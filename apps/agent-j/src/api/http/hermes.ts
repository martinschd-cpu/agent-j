import type { Chat, ChatStreamEvent, ID, Message } from '../types';
import type { SseFrame } from './sse';

/** Session as returned by `GET /api/sessions` (see docs/hermes-api.md). */
export interface HermesSession {
  id: string;
  source?: string | null;
  title?: string | null;
  preview?: string | null;
  started_at?: number | null;
  last_active?: number | null;
}

export interface HermesMessage {
  id: string | number;
  session_id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string | null;
  timestamp?: number | null;
}

export interface HermesList<T> {
  data: T[];
}

const unixToIso = (s: number | null | undefined) => new Date((s ?? 0) * 1000).toISOString();

/** Hermes has no workspaces. Agent-J tags its sessions with the workspace in `source`. */
export const sourceForWorkspace = (workspaceId: ID) => `agent-j-${workspaceId}`;

export function mapSession(s: HermesSession, workspaceId: ID): Chat {
  const title = s.title?.trim() || s.preview?.trim() || 'Neuer Chat';
  return { id: s.id, workspaceId, title, updatedAt: unixToIso(s.last_active ?? s.started_at) };
}

/** User and assistant messages become text messages; tool and system messages are dropped. */
export function mapMessage(m: HermesMessage): Message | null {
  if (m.role !== 'user' && m.role !== 'assistant') return null;
  if (!m.content) return null;
  return {
    id: String(m.id),
    chatId: m.session_id,
    role: m.role === 'user' ? 'user' : 'agent',
    createdAt: unixToIso(m.timestamp),
    parts: [{ type: 'text', text: m.content }],
  };
}

interface Payload {
  message?: { id?: string; role?: string };
  message_id?: string;
  delta?: string;
  content?: string;
  tool_name?: string;
  preview?: string;
}

/**
 * Translates the SSE frames of `POST /api/sessions/{id}/chat/stream` into app stream events.
 * One instance per stream; it emits exactly one `done` or `error`.
 */
export class HermesStreamMapper {
  private messageId: string | undefined;
  private text = '';
  private finalText: string | undefined;
  private stepSeq = 0;
  private runningSteps = new Map<string, { id: string; label: string }[]>();
  private finished = false;

  constructor(
    private readonly chatId: ID,
    private readonly now: () => Date = () => new Date(),
  ) {}

  get isFinished(): boolean {
    return this.finished;
  }

  map(frame: SseFrame): ChatStreamEvent[] {
    if (this.finished) return [];
    let p: Payload = {};
    try {
      p = frame.data ? (JSON.parse(frame.data) as Payload) : {};
    } catch {
      // Ignore payloads that are not JSON.
    }

    switch (frame.event) {
      case 'message.started':
        if (p.message?.role === 'assistant' && p.message.id) this.messageId = p.message.id;
        return [];
      case 'assistant.delta':
        if (!p.delta) return [];
        this.messageId ??= p.message_id;
        this.text += p.delta;
        return [{ type: 'delta', text: p.delta }];
      case 'assistant.completed':
        this.messageId = p.message_id ?? this.messageId;
        if (typeof p.content === 'string') this.finalText = p.content;
        return [];
      case 'tool.started': {
        const name = p.tool_name ?? 'Werkzeug';
        const step = { id: `tool-${++this.stepSeq}`, label: stepLabel(name, p.preview) };
        this.runningSteps.set(name, [...(this.runningSteps.get(name) ?? []), step]);
        return [{ type: 'step', id: step.id, label: step.label, status: 'running' }];
      }
      case 'tool.completed':
      case 'tool.failed': {
        const name = p.tool_name ?? 'Werkzeug';
        const [step, ...rest] = this.runningSteps.get(name) ?? [];
        this.runningSteps.set(name, rest);
        const base = step?.label ?? stepLabel(name, p.preview);
        const label = frame.event === 'tool.failed' ? `${base} · fehlgeschlagen` : base;
        return [{ type: 'step', id: step?.id ?? `tool-${++this.stepSeq}`, label, status: 'done' }];
      }
      case 'run.completed':
      case 'done':
        return [this.done()];
      case 'error':
        this.finished = true;
        return [
          { type: 'error', message: (p as { message?: string }).message ?? 'Fehler im Backend' },
        ];
      default:
        return [];
    }
  }

  /** Call when the HTTP stream ended. Emits `done` if the backend did not. */
  end(): ChatStreamEvent[] {
    if (this.finished) return [];
    if (!this.text && this.finalText === undefined) {
      this.finished = true;
      return [{ type: 'error', message: 'Verbindung beendet, bevor eine Antwort kam' }];
    }
    return [this.done()];
  }

  private done(): ChatStreamEvent {
    this.finished = true;
    const message: Message = {
      id: this.messageId ?? `local-${this.now().getTime()}`,
      chatId: this.chatId,
      role: 'agent',
      createdAt: this.now().toISOString(),
      parts: [{ type: 'text', text: this.finalText ?? this.text }],
    };
    return { type: 'done', message };
  }
}

function stepLabel(tool: string, preview?: string): string {
  const name = tool.replace(/_/g, ' ');
  const short = preview?.trim().replace(/\s+/g, ' ');
  return short ? `${name} · ${short.length > 48 ? `${short.slice(0, 45)}...` : short}` : name;
}
