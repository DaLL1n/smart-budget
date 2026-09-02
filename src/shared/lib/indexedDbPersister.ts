import { get, set, del } from 'idb-keyval';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const DEFAULT_CACHE_KEY = 'smart_budget_indexeddb_cache_v1';

/**
 * Creates an ultra-fast async IndexedDB persister for TanStack Query
 */
export function createIndexedDbPersister(key: string = DEFAULT_CACHE_KEY): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await set(key, client);
      } catch (err) {
        console.warn('Failed to persist TanStack Query cache to IndexedDB:', err);
      }
    },
    restoreClient: async () => {
      try {
        return await get<PersistedClient>(key);
      } catch (err) {
        console.warn('Failed to restore TanStack Query cache from IndexedDB:', err);
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await del(key);
      } catch (err) {
        console.warn('Failed to remove TanStack Query cache from IndexedDB:', err);
      }
    },
  };
}

export const indexedDbPersister = createIndexedDbPersister();
