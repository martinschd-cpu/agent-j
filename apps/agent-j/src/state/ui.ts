import { create } from 'zustand';

import type { ID, PanelRef, TaskRange } from '@/api/types';

export type SidebarSection = 'chats' | 'requests' | 'flows';

export interface UiState {
  workspaceId: ID;
  /** null: the newest chat of the workspace. */
  activeChatId: ID | null;
  sidebar: SidebarSection;
  /** undefined: the default panel of the active chat. null: closed. */
  panel: PanelRef | null | undefined;
  drawerOpen: boolean;
  menuOpen: boolean;
  taskRange: TaskRange;
  /** A short message without undo, e.g. an error. */
  notice: string | null;

  setWorkspace(id: ID): void;
  openChat(id: ID): void;
  setSidebar(section: SidebarSection): void;
  setPanel(panel: PanelRef | null | undefined): void;
  setDrawerOpen(open: boolean): void;
  setMenuOpen(open: boolean): void;
  setTaskRange(range: TaskRange): void;
  setNotice(text: string | null): void;
}

export const useUi = create<UiState>()((set) => ({
  workspaceId: 'privat',
  activeChatId: null,
  sidebar: 'chats',
  panel: undefined,
  drawerOpen: false,
  menuOpen: false,
  taskRange: 'today',
  notice: null,

  setWorkspace: (workspaceId) =>
    set({ workspaceId, activeChatId: null, panel: undefined, menuOpen: false }),
  openChat: (activeChatId) =>
    set({ activeChatId, panel: undefined, sidebar: 'chats', drawerOpen: false }),
  setSidebar: (sidebar) =>
    set(sidebar === 'flows' ? { sidebar, panel: { type: 'flows' } } : { sidebar }),
  setPanel: (panel) => set({ panel }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen, menuOpen: false }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setTaskRange: (taskRange) => set({ taskRange }),
  setNotice: (notice) => set({ notice }),
}));
