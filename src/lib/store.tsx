import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AGENTS } from '../data/agents';
import { CHATS } from '../data/chats';
import { CHANNELS, FACTS, MODELS, PREFERENCES, type Preferences } from '../data/profile';
import { TASKS } from '../data/tasks';
import type { Agent, Chat, Fact, Message, Status, Task } from '../data/types';

export type ThemePref = 'system' | 'light' | 'dark';

interface DemoState {
  tasks: Task[];
  chats: Chat[];
  agents: Agent[];
  facts: Fact[];
  prefs: Preferences;
  channels: Record<string, boolean>;
  modelId: string;
  themePref: ThemePref;
  notifications: Record<string, boolean>;
}

// Bump the suffix whenever the mock data shape changes, so old demo state doesn't linger.
const STORAGE_KEY = 'agentj-demo-v1';

const initialState = (): DemoState => ({
  tasks: TASKS,
  chats: CHATS,
  agents: AGENTS,
  facts: FACTS,
  prefs: PREFERENCES,
  channels: Object.fromEntries(CHANNELS.map((c) => [c.id, c.connected])),
  modelId: MODELS[0].id,
  themePref: 'system',
  notifications: { push: true, daily: true, email: false },
});

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState(), ...(JSON.parse(raw) as Partial<DemoState>) };
  } catch {
    // Private mode or corrupted storage – fall back to fresh demo data.
  }
  return initialState();
}

function useDemoState() {
  const [state, setState] = useState<DemoState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable – the dummy still works, it just won't remember clicks.
    }
  }, [state]);

  const patch = useCallback((p: Partial<DemoState> | ((s: DemoState) => Partial<DemoState>)) => {
    setState((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  }, []);

  return useMemo(
    () => ({
      ...state,
      setTaskStatus: (id: string, status: Status) =>
        patch((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) })),
      addTask: (task: Task) => patch((s) => ({ tasks: [task, ...s.tasks] })),
      addMessage: (chatId: string, msg: Message) =>
        patch((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c)) })),
      createChat: (chat: Chat) => patch((s) => ({ chats: [chat, ...s.chats] })),
      saveAgent: (agent: Agent) =>
        patch((s) => ({
          agents: s.agents.some((a) => a.id === agent.id)
            ? s.agents.map((a) => (a.id === agent.id ? agent : a))
            : [...s.agents, agent],
        })),
      toggleAgent: (id: string) =>
        patch((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)) })),
      deleteAgent: (id: string) => patch((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
      setFacts: (facts: Fact[]) => patch({ facts }),
      setPrefs: (prefs: Preferences) => patch({ prefs }),
      toggleChannel: (id: string) => patch((s) => ({ channels: { ...s.channels, [id]: !s.channels[id] } })),
      setModel: (modelId: string) => patch({ modelId }),
      setThemePref: (themePref: ThemePref) => patch({ themePref }),
      toggleNotification: (id: string) =>
        patch((s) => ({ notifications: { ...s.notifications, [id]: !s.notifications[id] } })),
      reset: () => setState(initialState()),
    }),
    [state, patch],
  );
}

type Store = ReturnType<typeof useDemoState>;

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useDemoState();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside <StoreProvider>');
  return s;
}
