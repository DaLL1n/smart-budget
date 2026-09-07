import React, { useState } from 'react';
import { QueryClient, useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { indexedDbPersister } from '../../shared/lib';

const RestoreGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isRestoring = useIsRestoring();
  if (isRestoring) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-2xl shadow-xl shadow-emerald-950/60">
            🥑
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Загрузка данных...</span>
          </div>
        </div>
      </div>
    );
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
