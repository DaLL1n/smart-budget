import { Store } from '@tanstack/store';
import { Family } from './schema';

export interface FamilyState {
  currentFamily: Family | null;
  isLoading: boolean;
  error: string | null;
}

export const LOCAL_FAMILY_PREFIX = 'smart_budget_family_';

function getInitialFamily(): Family | null {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const localUserRaw = localStorage.getItem('food_budget_cloud_user');
      if (localUserRaw) {
        const u = JSON.parse(localUserRaw);
        if (u.familyId) {
          const stored = localStorage.getItem(`${LOCAL_FAMILY_PREFIX}${u.familyId}`);
          if (stored) {
            return JSON.parse(stored) as Family;
          }
        }
      }
    }
  } catch {}
  return null;
}

export const familyStore = new Store<FamilyState>({
  currentFamily: getInitialFamily(),
  isLoading: false,
  error: null,
});

export const familyActions = {
  setFamily: (family: Family | null) => {
    familyStore.setState((state) => ({
      ...state,
      currentFamily: family,
      isLoading: false,
      error: null,
    }));
  },

  setLoading: (isLoading: boolean) => {
    familyStore.setState((state) => ({
      ...state,
      isLoading,
    }));
  },

  setError: (error: string | null) => {
    familyStore.setState((state) => ({
      ...state,
      error,
      isLoading: false,
    }));
  },
};
