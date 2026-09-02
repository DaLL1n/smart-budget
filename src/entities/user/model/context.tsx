import React, { createContext, useContext, useEffect } from 'react';
import { useStore } from '@tanstack/react-store';
import { supabase } from '../../../shared/api';
import { hashPassword, generateUserId } from '../../../shared/lib';
import { User, UserProfile, CompleteSetupParams, UpdateUserSettingsParams } from './types';
import { DEFAULT_PROFILE } from './constants';
import { userStore, userActions, LOCAL_SESSION_KEY } from './userStore';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: any | null; // Backwards-compatible dummy reference
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUserSettings: (params: UpdateUserSettingsParams) => Promise<void>;
  completeAccountSetup: (params: CompleteSetupParams) => Promise<void>;
  /** Re-reads currentUser from localStorage and syncs React state. Call after external familyId changes. */
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncUserToSupabase(user: User) {
  try {
    await supabase.from('users').upsert(
      {
        id: user.id,
        email: user.email.trim().toLowerCase(),
        name: user.name,
        avatar: user.avatar || '🥑',
        avatar_color: user.avatarColor || 'from-emerald-400 to-teal-500',
        family_id: user.familyId || null,
        is_onboarded: user.isOnboarded ?? true,
        last_login_at: new Date().toISOString(),
        profile: (user.profile as any) || {},
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Could not sync user to Supabase:', err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useStore(userStore, (state) => state.currentUser);
  const isLoading = useStore(userStore, (state) => state.isLoading);

  const setCurrentUser = (user: User | null | ((prev: User | null) => User | null)) => {
    if (typeof user === 'function') {
      const next = user(userStore.state.currentUser);
      userActions.setUser(next);
    } else {
      userActions.setUser(user);
    }
  };

  const setIsLoading = (loading: boolean) => {
    userActions.setLoading(loading);
  };

  // Sync auth state from Supabase Auth and localStorage
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // 1. Check active Supabase Auth session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const suUser = session.user;
          // Load profile from public.users table
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', suUser.id)
            .maybeSingle();

          if (profileData && isMounted) {
            const loaded: User = {
              id: profileData.id,
              name: profileData.name || suUser.user_metadata?.name || suUser.email?.split('@')[0] || 'Пользователь',
              email: profileData.email || suUser.email || '',
              avatar: profileData.avatar || '🥑',
              avatarColor: profileData.avatar_color || 'from-emerald-400 to-teal-500',
              familyId: profileData.family_id,
              createdAt: profileData.created_at ? profileData.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              isOnboarded: profileData.is_onboarded === true,
              profile: (profileData.profile as any) || {
                ...DEFAULT_PROFILE,
                updatedAt: new Date().toISOString(),
              },
            };
            setCurrentUser(loaded);
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(loaded));
            setIsLoading(false);
            return;
          }
        }

        // 2. Fallback to LocalStorage session with background Supabase sync
        const stored = localStorage.getItem(LOCAL_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          if (isMounted) setCurrentUser(parsed);

          if (parsed.id) {
            const { data: suData } = await supabase
              .from('users')
              .select('*')
              .eq('id', parsed.id)
              .maybeSingle();

            if (suData && isMounted) {
              const merged: User = {
                ...parsed,
                familyId: suData.family_id !== undefined ? suData.family_id : parsed.familyId,
                name: suData.name || parsed.name,
                avatar: suData.avatar || parsed.avatar,
                avatarColor: suData.avatar_color || parsed.avatarColor,
                isOnboarded: suData.is_onboarded ?? parsed.isOnboarded,
                profile: (suData.profile as any) || parsed.profile,
              };
              setCurrentUser(merged);
              localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(merged));
            }
          }
        }
      } catch (err) {
        console.warn('Auth initialization notice:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem(LOCAL_SESSION_KEY);
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        const { data: row } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (row && isMounted) {
          const userObj: User = {
            id: row.id,
            name: row.name || session.user.user_metadata?.name || 'Пользователь',
            email: row.email || session.user.email || '',
            avatar: row.avatar || '🥑',
            avatarColor: row.avatar_color || 'from-emerald-400 to-teal-500',
            familyId: row.family_id,
            createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            isOnboarded: row.is_onboarded === true,
            profile: (row.profile as any) || {
              ...DEFAULT_PROFILE,
              updatedAt: new Date().toISOString(),
            },
          };
          setCurrentUser(userObj);
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userObj));
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = () => {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (raw) {
      try {
        const user = JSON.parse(raw) as User;
        setCurrentUser(user);
      } catch {}
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (!error && data.user) {
        const { data: row } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        const loggedUser: User = {
          id: data.user.id,
          name: row?.name || data.user.user_metadata?.name || trimmedEmail.split('@')[0] || 'Пользователь',
          email: trimmedEmail,
          avatar: row?.avatar || '🥑',
          avatarColor: row?.avatar_color || 'from-emerald-400 to-teal-500',
          familyId: row?.family_id || null,
          createdAt: row?.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          isOnboarded: row?.is_onboarded ?? true,
          profile: (row?.profile as any) || {
            ...DEFAULT_PROFILE,
            updatedAt: new Date().toISOString(),
          },
        };

        setCurrentUser(loggedUser);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(loggedUser));
        await syncUserToSupabase(loggedUser);
        return;
      }
    } catch (suErr) {
      console.warn('Supabase Auth signIn note, checking direct user credentials:', suErr);
    }

    // 2. Direct Supabase public.users / Local session verification
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', trimmedEmail)
      .maybeSingle();

    const userId = existingUser?.id || generateUserId(trimmedEmail);

    const loggedUser: User = {
      id: userId,
      name: existingUser?.name || trimmedEmail.split('@')[0] || 'Пользователь',
      email: trimmedEmail,
      avatar: existingUser?.avatar || '🥑',
      avatarColor: existingUser?.avatar_color || 'from-emerald-400 to-teal-500',
      familyId: existingUser?.family_id || null,
      createdAt: existingUser?.created_at ? existingUser.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      isOnboarded: existingUser?.is_onboarded ?? true,
      profile: (existingUser?.profile as any) || {
        ...DEFAULT_PROFILE,
        updatedAt: new Date().toISOString(),
      },
    };

    setCurrentUser(loggedUser);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(loggedUser));
    await syncUserToSupabase(loggedUser);
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // 1. Try Supabase Auth signUp
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { name: trimmedName },
        },
      });

      if (!error && data.user) {
        const createdUser: User = {
          id: data.user.id,
          name: trimmedName || trimmedEmail.split('@')[0] || 'Пользователь',
          email: trimmedEmail,
          avatar: '🥑',
          avatarColor: 'from-emerald-400 to-teal-500',
          familyId: null,
          createdAt: new Date().toISOString().split('T')[0],
          isOnboarded: false,
          profile: {
            ...DEFAULT_PROFILE,
            updatedAt: new Date().toISOString(),
          },
        };

        setCurrentUser(createdUser);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(createdUser));
        await syncUserToSupabase(createdUser);
        return;
      }
    } catch (suErr) {
      console.warn('Supabase Auth signUp note, using direct user persistence:', suErr);
    }

    // 2. Direct Supabase public.users registration fallback
    const userId = generateUserId(trimmedEmail);
    const createdUser: User = {
      id: userId,
      name: trimmedName || trimmedEmail.split('@')[0] || 'Пользователь',
      email: trimmedEmail,
      avatar: '🥑',
      avatarColor: 'from-emerald-400 to-teal-500',
      familyId: null,
      createdAt: new Date().toISOString().split('T')[0],
      isOnboarded: false,
      profile: {
        ...DEFAULT_PROFILE,
        updatedAt: new Date().toISOString(),
      },
    };

    setCurrentUser(createdUser);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(createdUser));
    await syncUserToSupabase(createdUser);
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch {}

    userActions.setUser(null);
    localStorage.removeItem(LOCAL_SESSION_KEY);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) return;

    const updatedProfile: UserProfile = {
      ...currentUser.profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...currentUser,
      profile: updatedProfile,
    };

    setCurrentUser(updatedUser);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));
    await syncUserToSupabase(updatedUser);
  };

  const updateUserSettings = async (params: UpdateUserSettingsParams): Promise<void> => {
    if (!currentUser) return;

    const updatedProfile: UserProfile = {
      ...currentUser.profile,
      ...params.profile,
      updatedAt: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...currentUser,
      name: params.name ?? currentUser.name,
      avatar: params.avatar ?? currentUser.avatar,
      avatarColor: params.avatarColor ?? currentUser.avatarColor,
      profile: updatedProfile,
    };

    setCurrentUser(updatedUser);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));
    await syncUserToSupabase(updatedUser);

    if (updatedUser.familyId) {
      try {
        const bc = new BroadcastChannel('smart_budget_sync');
        bc.postMessage({ type: 'FAMILY_UPDATED', familyId: updatedUser.familyId });
        bc.close();
      } catch {}
    }
  };

  const completeAccountSetup = async (params: CompleteSetupParams): Promise<void> => {
    if (!currentUser) return;

    const updatedProfile: UserProfile = {
      ...currentUser.profile,
      ...params.profile,
      updatedAt: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...currentUser,
      name: params.name ?? currentUser.name,
      avatar: params.avatar ?? currentUser.avatar,
      avatarColor: params.avatarColor ?? currentUser.avatarColor,
      isOnboarded: true,
      profile: updatedProfile,
    };

    setCurrentUser(updatedUser);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));
    await syncUserToSupabase(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser: null,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        register,
        logout,
        updateUserProfile,
        updateUserSettings,
        completeAccountSetup,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
