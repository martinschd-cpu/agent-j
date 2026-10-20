import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';

import type {
  AgentJApi,
  AgentRequest,
  Approval,
  ConnectedAccount,
  Flow,
  FlowTemplate,
  Profile,
  RequestOption,
  Settings,
  SettingsPatch,
  Task,
} from '@/api';
import { useApi, useUndoController } from './api-context';
import { keys } from './queries';
import type { UndoController, UndoableAction } from './undo';
import { useUi } from './ui';

/**
 * Builds an undoable action whose optimistic update touches the cached queries under `prefixes`.
 * `revert` restores exactly the snapshot taken before the update.
 */
export function optimisticAction(
  qc: QueryClient,
  prefixes: QueryKey[],
  label: string,
  update: () => void,
  commit: () => Promise<unknown>,
): UndoableAction {
  let snapshot: [QueryKey, unknown][] = [];
  return {
    label,
    apply() {
      prefixes.forEach((queryKey) => void qc.cancelQueries({ queryKey }));
      snapshot = prefixes.flatMap((queryKey) => qc.getQueriesData({ queryKey }));
      update();
    },
    revert() {
      snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    commit,
  };
}

const mapList =
  <T extends { id: string }>(id: string, fn: (item: T) => T) =>
  (list: T[] | undefined) =>
    list?.map((x) => (x.id === id ? fn(x) : x));

const removeFromList =
  <T extends { id: string }>(id: string) =>
  (list: T[] | undefined) =>
    list?.filter((x) => x.id !== id);

export function createActions(api: AgentJApi, qc: QueryClient, undo: UndoController) {
  const setApprovalStatus = (approval: Approval, status: Approval['status']) => {
    qc.setQueryData<Approval>(keys.approval(approval.id), (a) => (a ? { ...a, status } : a));
    qc.setQueryData<AgentRequest[]>(keys.requests(approval.workspaceId), (list) =>
      list?.filter((r) => r.approvalId !== approval.id),
    );
  };
  const approvalPrefixes = (a: Approval) => [keys.approval(a.id), keys.requests(a.workspaceId)];

  const setTasks = (ws: string, fn: (list: Task[] | undefined) => Task[] | undefined) =>
    qc.setQueriesData<Task[]>({ queryKey: keys.tasksAll(ws) }, fn);

  return {
    approve(approval: Approval) {
      return undo.run(
        optimisticAction(
          qc,
          approvalPrefixes(approval),
          'Freigegeben und gesendet',
          () => setApprovalStatus(approval, 'approved'),
          () => api.approve(approval.id),
        ),
      );
    },

    reject(approval: Approval) {
      return undo.run(
        optimisticAction(
          qc,
          approvalPrefixes(approval),
          'Abgelehnt, nichts gesendet',
          () => setApprovalStatus(approval, 'rejected'),
          () => api.reject(approval.id),
        ),
      );
    },

    /** Saving an edited draft is not undoable; the user can simply edit again. */
    async saveDraft(approval: Approval, body: string) {
      const saved = await api.updateApprovalDraft(approval.id, body);
      qc.setQueryData(keys.approval(approval.id), saved);
      return saved;
    },

    answerRequest(request: AgentRequest, option: RequestOption) {
      const { action } = option;
      if (action.type === 'open_chat') {
        if (request.relatedChatId) useUi.getState().openChat(request.relatedChatId);
        return Promise.resolve();
      }
      const prefixes: QueryKey[] = [keys.requests(request.workspaceId)];
      if (request.approvalId) prefixes.push(keys.approval(request.approvalId));
      return undo.run(
        optimisticAction(
          qc,
          prefixes,
          option.confirmation ?? `${option.label}: erledigt`,
          () => {
            qc.setQueryData<AgentRequest[]>(
              keys.requests(request.workspaceId),
              removeFromList(request.id),
            );
            if (request.approvalId && (action.type === 'approve' || action.type === 'reject')) {
              const status = action.type === 'approve' ? 'approved' : 'rejected';
              qc.setQueryData<Approval>(keys.approval(request.approvalId), (a) =>
                a ? { ...a, status } : a,
              );
            }
          },
          () => api.answerRequest(request.id, action),
        ),
      );
    },

    toggleTaskDone(task: Task) {
      const done = task.status !== 'done';
      const status = done ? 'done' : 'open';
      return undo.run(
        optimisticAction(
          qc,
          [keys.tasksAll(task.workspaceId)],
          done ? `Erledigt: ${task.title}` : 'Wieder offen',
          () =>
            setTasks(
              task.workspaceId,
              mapList(task.id, (t) => ({
                ...t,
                status,
                completedAt: done ? new Date().toISOString() : undefined,
              })),
            ),
          () => api.updateTask(task.id, { status }),
        ),
      );
    },

    confirmTask(task: Task) {
      return undo.run(
        optimisticAction(
          qc,
          [keys.tasksAll(task.workspaceId)],
          'Aufgabe übernommen',
          () =>
            setTasks(
              task.workspaceId,
              mapList(task.id, (t) => ({ ...t, isDraft: false })),
            ),
          () => api.confirmTask(task.id),
        ),
      );
    },

    discardTask(task: Task) {
      return undo.run(
        optimisticAction(
          qc,
          [keys.tasksAll(task.workspaceId)],
          'Aufgabe verworfen',
          () => setTasks(task.workspaceId, removeFromList(task.id)),
          () => api.discardTask(task.id),
        ),
      );
    },

    toggleFlow(flow: Flow) {
      const enabled = !flow.enabled;
      return undo.run(
        optimisticAction(
          qc,
          [keys.flows],
          `${flow.name} ${enabled ? 'aktiviert' : 'pausiert'}`,
          () =>
            qc.setQueryData<Flow[]>(
              keys.flows,
              mapList(flow.id, (f) => ({ ...f, enabled })),
            ),
          () => api.updateFlow(flow.id, { enabled }),
        ),
      );
    },

    async adoptTemplate(template: FlowTemplate) {
      const flow = await api.adoptTemplate(template.id);
      qc.setQueryData<FlowTemplate[]>(
        keys.flowhub,
        mapList(template.id, (t) => ({ ...t, adopted: true, adoptions: t.adoptions + 1 })),
      );
      qc.setQueryData<Flow[]>(keys.flows, (list) => (list ? [...list, flow] : list));
      return flow;
    },

    confirmFact(factId: string, text: string) {
      return undo.run(
        optimisticAction(
          qc,
          [keys.profile],
          `Gespeichert: ${text}`,
          () =>
            qc.setQueryData<Profile>(keys.profile, (p) =>
              p
                ? {
                    ...p,
                    facts: p.facts.map((f) =>
                      f.id === factId ? { ...f, status: 'confirmed' as const } : f,
                    ),
                  }
                : p,
            ),
          () => api.confirmFact(factId),
        ),
      );
    },

    rejectFact(factId: string) {
      return undo.run(
        optimisticAction(
          qc,
          [keys.profile],
          'Verworfen',
          () =>
            qc.setQueryData<Profile>(keys.profile, (p) =>
              p ? { ...p, facts: p.facts.filter((f) => f.id !== factId) } : p,
            ),
          () => api.rejectFact(factId),
        ),
      );
    },

    async setAccountConnected(account: ConnectedAccount, connected: boolean) {
      qc.setQueryData<ConnectedAccount[]>(
        keys.accounts,
        mapList(account.id, (a) => ({ ...a, connected })),
      );
      try {
        const saved = await (connected
          ? api.connectAccount(account.id)
          : api.disconnectAccount(account.id));
        qc.setQueryData<ConnectedAccount[]>(
          keys.accounts,
          mapList(account.id, () => saved),
        );
      } catch (e) {
        void qc.invalidateQueries({ queryKey: keys.accounts });
        throw e;
      }
    },

    async updateSettings(patch: SettingsPatch) {
      qc.setQueryData<Settings>(keys.settings, (s) => (s ? { ...s, ...patch } : s));
      try {
        qc.setQueryData(keys.settings, await api.updateSettings(patch));
      } catch (e) {
        void qc.invalidateQueries({ queryKey: keys.settings });
        throw e;
      }
    },
  };
}

export type Actions = ReturnType<typeof createActions>;

export function useActions(): Actions {
  const api = useApi();
  const qc = useQueryClient();
  const undo = useUndoController();
  return useMemo(() => createActions(api, qc, undo), [api, qc, undo]);
}
