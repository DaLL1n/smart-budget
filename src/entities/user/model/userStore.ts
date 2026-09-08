import { Store } from '@tanstack/store';
import { User } from './types';
import { CustomCategory } from './schema';

export const LOCAL_SESSION_KEY = 'food_budget_cloud_user';

export interface UserState {
  currentUser: User | null;
  isLoading: boolean;
}

function getInitialUser(): User | null {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        return JSON.parse(stored) as User;
      }
    }
  } catch (e) {
    console.warn('Could not read user from localStorage:', e);
  }
  return null;
}

const initialUser = getInitialUser();

export const userStore = new Store<UserState>({
  currentUser: initialUser,
  isLoading: !initialUser,
});

export const userActions = {
  setUser: (user: User | null) => {
    userStore.setState((state) => ({
      ...state,
      currentUser: user,
      isLoading: false,
    }));
    if (user) {
      try {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
      } catch {}
    } else {
      try {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      } catch {}
    }
  },

  updateFamilyId: (familyId: string | null) => {
    userStore.setState((state) => {
      if (!state.currentUser) return state;
      const updatedUser: User = {
        ...state.currentUser,
        familyId,
      };
      try {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));
      } catch {}
      return {
        ...state,
        currentUser: updatedUser,
      };
    });
  },

  patchUser: (updates: Partial<User>) => {
    userStore.setState((state) => {
      if (!state.currentUser) return state;
      const updatedUser: User = {
        ...state.currentUser,
        ...updates,
      };
      try {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));
      } catch {}
      return {
        ...state,
        currentUser: updatedUser,
      };
    });
  },

  addCustomCategories: (newCats: CustomCategory[]) => {
    userStore.setState((state) => {
      if (!state.currentUser || newCats.length === 0) return state;
      const currentList = state.currentUser.profile?.custom_categories || [];
      const existingIds = new Set(currentList.map(c => c.id));
      const trulyNew = newCats.filter(c => !existingIds.has(c.id));
      if (trulyNew.length === 0) return state;

      const updatedUser: User = {
        ...state.currentUser,
        profile: {
          ...state.currentUser.profile,
          custom_categories: [...currentList, ...trulyNew],
          updatedAt: new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));
      } catch {}
      return {
        ...state,
        currentUser: updatedUser,
      };
    });
  },

  setLoading: (isLoading: boolean) => {
    userStore.setState((state) => ({
      ...state,
      isLoading,
    }));
  },
};
