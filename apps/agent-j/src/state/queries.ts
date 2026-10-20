import { useQuery } from '@tanstack/react-query';

import type { ID, TaskRange } from '@/api/types';
import { useApi } from './api-context';

export const keys = {
  me: ['me'] as const,
  workspaces: ['workspaces'] as const,
  chats: (ws: ID) => ['chats', ws] as const,
  messages: (chatId: ID) => ['messages', chatId] as const,
  requests: (ws: ID) => ['requests', ws] as const,
  approval: (id: ID) => ['approval', id] as const,
  tasksAll: (ws: ID) => ['tasks', ws] as const,
  tasks: (ws: ID, range: TaskRange) => ['tasks', ws, range] as const,
  flows: ['flows'] as const,
  flowhub: ['flowhub'] as const,
  graph: ['graph'] as const,
  profile: ['profile'] as const,
  accounts: ['accounts'] as const,
  settings: ['settings'] as const,
  billing: ['billing'] as const,
};

export function useMe() {
  const api = useApi();
  return useQuery({ queryKey: keys.me, queryFn: () => api.getMe() });
}

export function useWorkspaces() {
  const api = useApi();
  return useQuery({ queryKey: keys.workspaces, queryFn: () => api.getWorkspaces() });
}

export function useChats(ws: ID) {
  const api = useApi();
  return useQuery({ queryKey: keys.chats(ws), queryFn: () => api.getChats(ws) });
}

export function useMessages(chatId: ID | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: keys.messages(chatId ?? ''),
    queryFn: () => api.getMessages(chatId ?? ''),
    enabled: !!chatId,
  });
}

export function useRequests(ws: ID) {
  const api = useApi();
  return useQuery({ queryKey: keys.requests(ws), queryFn: () => api.getRequests(ws) });
}

export function useApproval(id: ID) {
  const api = useApi();
  return useQuery({ queryKey: keys.approval(id), queryFn: () => api.getApproval(id) });
}

export function useTasks(ws: ID, range: TaskRange) {
  const api = useApi();
  return useQuery({ queryKey: keys.tasks(ws, range), queryFn: () => api.getTasks(ws, range) });
}

export function useFlows() {
  const api = useApi();
  return useQuery({ queryKey: keys.flows, queryFn: () => api.getFlows() });
}

export function useFlowhub() {
  const api = useApi();
  return useQuery({ queryKey: keys.flowhub, queryFn: () => api.getFlowhub() });
}

export function useContactGraph() {
  const api = useApi();
  return useQuery({ queryKey: keys.graph, queryFn: () => api.getContactGraph() });
}

export function useProfile() {
  const api = useApi();
  return useQuery({ queryKey: keys.profile, queryFn: () => api.getProfile() });
}

export function useAccounts() {
  const api = useApi();
  return useQuery({ queryKey: keys.accounts, queryFn: () => api.getAccounts() });
}

export function useSettings() {
  const api = useApi();
  return useQuery({ queryKey: keys.settings, queryFn: () => api.getSettings() });
}

export function useBilling() {
  const api = useApi();
  return useQuery({ queryKey: keys.billing, queryFn: () => api.getBilling() });
}
