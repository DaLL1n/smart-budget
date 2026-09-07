import React, { useState } from 'react';
import { QueryClient, useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { indexedDbPersister } from '../../shared/lib';
import { AppShellSkeleton } from '../../shared/ui';

const RestoreGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isRestoring = useIsRestoring();
  if (isRestoring) {
    return <AppShellSkeleton />;
  }
  return <>{children}</>;
};

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Immediately fetch fresh data from server
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            networkMode: 'offlineFirst',
            refetchOnMount: 'always', // Always send query immediately when component mounts
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            networkMode: 'offlineFirst',
            retry: 0,
          },
        },
      })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: indexedDbPersister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days cache retention
        buster: 'smart-budget-v5', // BUST old persisted client cache so clients on production purge mock data
      }}
      onSuccess={() => {
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries();
        });
      }}
    >
      <RestoreGate>
        {children}
      </RestoreGate>
    </PersistQueryClientProvider>
  );
};
