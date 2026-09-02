import React, { useState } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { indexedDbPersister } from '../../shared/lib';

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days in IndexedDB cache
            networkMode: 'offlineFirst',
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
        buster: 'smart-budget-v1',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
