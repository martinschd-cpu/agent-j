import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import type { AgentJApi } from '@/api/AgentJApi';
import { UndoController } from './undo';
import { useUi } from './ui';

const ApiContext = createContext<AgentJApi | null>(null);
const UndoContext = createContext<UndoController | null>(null);

export function useApi(): AgentJApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useApi needs an <AppProviders>');
  return api;
}

export function useUndoController(): UndoController {
  const undo = useContext(UndoContext);
  if (!undo) throw new Error('useUndoController needs an <AppProviders>');
  return undo;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Optimistic updates wait up to 8 s for their commit; a background refetch must not undo them.
      queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
    },
  });
}

export function AppProviders({ api, children }: { api: AgentJApi; children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [undo] = useState(
    () =>
      new UndoController({
        onError: (e) =>
          useUi
            .getState()
            .setNotice(
              `Das hat nicht geklappt: ${e instanceof Error ? e.message : 'unbekannter Fehler'}`,
            ),
      }),
  );

  // Do not lose a pending action when the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void undo.flush();
    });
    return () => sub.remove();
  }, [undo]);

  return (
    <ApiContext.Provider value={api}>
      <UndoContext.Provider value={undo}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </UndoContext.Provider>
    </ApiContext.Provider>
  );
}
