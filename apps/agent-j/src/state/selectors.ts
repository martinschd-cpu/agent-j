import { useWindowDimensions } from 'react-native';

import type { Chat, PanelRef } from '@/api/types';
import { layout } from '@/theme/tokens';
import { useChats } from './queries';
import { useUi } from './ui';

/** The chat shown in the main column: the selected one, or the newest of the workspace. */
export function useActiveChat(): { chat: Chat | undefined; chats: Chat[]; isLoading: boolean } {
  const ws = useUi((s) => s.workspaceId);
  const activeId = useUi((s) => s.activeChatId);
  const { data, isLoading } = useChats(ws);
  const chats = data ?? [];
  return { chat: chats.find((c) => c.id === activeId) ?? chats[0], chats, isLoading };
}

/**
 * The open side panel. Until the user picks one, a chat shows its default panel, except when
 * the panel would cover the chat; then it opens only on request.
 */
export function usePanel(): PanelRef | null {
  const panel = useUi((s) => s.panel);
  const { chat } = useActiveChat();
  const { width } = useWindowDimensions();
  if (panel !== undefined) return panel;
  return width >= layout.panelBreakpoint ? (chat?.defaultPanel ?? null) : null;
}
