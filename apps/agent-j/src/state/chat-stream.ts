import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { create } from 'zustand';

import type { AgentJApi, Chat, ID, Message } from '@/api';
import { useApi, useUndoController } from './api-context';
import { keys } from './queries';
import { useUi } from './ui';

export interface WorkStep {
  id: string;
  label: string;
  status: 'running' | 'done';
}

export interface ChatStream {
  steps: WorkStep[];
  text: string;
}

interface StreamState {
  /** Running streams by chat id. A chat with an entry here is locked for sending. */
  streams: Record<ID, ChatStream>;
  /** Last stream error by chat id, shown under the conversation. */
  errors: Record<ID, string>;
}

export const useStreams = create<StreamState>()(() => ({ streams: {}, errors: {} }));

const patchStream = (chatId: ID, fn: (s: ChatStream) => ChatStream) =>
  useStreams.setState((st) => {
    const cur = st.streams[chatId];
    return cur ? { streams: { ...st.streams, [chatId]: fn(cur) } } : st;
  });

function omit<T>(record: Record<ID, T>, key: ID): Record<ID, T> {
  const copy = { ...record };
  delete copy[key];
  return copy;
}

const endStream = (chatId: ID, error?: string) =>
  useStreams.setState((st) => {
    const errors = omit(st.errors, chatId);
    return {
      streams: omit(st.streams, chatId),
      errors: error ? { ...errors, [chatId]: error } : errors,
    };
  });

/** Sends a message and folds the stream into the query cache. Exported for tests. */
export async function runChatStream(
  api: AgentJApi,
  qc: QueryClient,
  chat: Chat,
  text: string,
): Promise<void> {
  const chatId = chat.id;
  if (useStreams.getState().streams[chatId]) return;
  useStreams.setState((st) => ({ streams: { ...st.streams, [chatId]: { steps: [], text: '' } } }));

  const userMessage: Message = {
    id: `local-${Date.now()}`,
    chatId,
    role: 'user',
    createdAt: new Date().toISOString(),
    parts: [{ type: 'text', text }],
  };
  qc.setQueryData<Message[]>(keys.messages(chatId), (list) => [...(list ?? []), userMessage]);

  let error: string | undefined;
  try {
    for await (const ev of api.sendMessage(chatId, text)) {
      switch (ev.type) {
        case 'step':
          patchStream(chatId, (s) => {
            const exists = s.steps.some((x) => x.id === ev.id);
            const step = { id: ev.id, label: ev.label, status: ev.status };
            return {
              ...s,
              steps: exists ? s.steps.map((x) => (x.id === ev.id ? step : x)) : [...s.steps, step],
            };
          });
          break;
        case 'delta':
          patchStream(chatId, (s) => ({ ...s, text: s.text + ev.text }));
          break;
        case 'approval':
          qc.setQueryData(keys.approval(ev.approval.id), ev.approval);
          break;
        case 'done': {
          qc.setQueryData<Message[]>(keys.messages(chatId), (list) => [
            ...(list ?? []),
            ev.message,
          ]);
          const card = ev.message.parts.find((p) => p.type === 'card');
          const ui = useUi.getState();
          const isActive = ui.activeChatId === chatId || ui.activeChatId === null;
          if (card && isActive) ui.setPanel({ type: card.card, refId: card.refId });
          break;
        }
        case 'error':
          error = ev.message;
          break;
        case 'card':
          // Part of the final message, handled on `done`.
          break;
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unbekannter Fehler';
  } finally {
    endStream(chatId, error);
    const ws = chat.workspaceId;
    // The agent may have created requests, tasks or flows; the title may have changed.
    void qc.invalidateQueries({ queryKey: keys.chats(ws) });
    void qc.invalidateQueries({ queryKey: keys.messages(chatId) });
    void qc.invalidateQueries({ queryKey: keys.requests(ws) });
    void qc.invalidateQueries({ queryKey: keys.tasksAll(ws) });
    void qc.invalidateQueries({ queryKey: keys.flows });
  }
}

export function useSendMessage() {
  const api = useApi();
  const qc = useQueryClient();
  const undo = useUndoController();
  return useCallback(
    async (chat: Chat, text: string) => {
      // Sending starts a new action: commit a pending one so the refetch afterwards includes it.
      await undo.flush();
      await runChatStream(api, qc, chat, text);
    },
    [api, qc, undo],
  );
}
