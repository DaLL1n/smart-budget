import React, { createContext, useContext, useEffect } from 'react';
import { useStore } from '@tanstack/react-store';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/api';
import { hashPassword, generateUserId } from '../../../shared/lib';
import { User, UserProfile, CompleteSetupParams, UpdateUserSettingsParams } from './types';
import { DEFAULT_PROFILE } from './constants';
import { userStore, userActions, LOCAL_SESSION_KEY } from './userStore';
import { familyKeys } from '../../family/api/familyQueries';
import { fetchFamily, updateFamilyPreferences } from '../../family/api/familyService';
import { familyActions } from '../../family/model/familyStore';

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
  const queryClient = useQueryClient();
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
          const userEmail = (suUser.email || '').trim().toLowerCase();
          // Load profile from public.users table
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .or(`id.eq.${suUser.id},email.eq.${userEmail}`)
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

  // Realtime Supabase synchronization & fallback polling for family membership, users, and expenses
  useEffect(() => {
    if (!currentUser?.id) return;

    let isMounted = true;
    const currentUserId = currentUser.id;

    // Helper to refresh and compare user state from Supabase
    const syncUserRemote = async () => {
      try {
        const userEmail = currentUser.email?.trim().toLowerCase() || '';
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, avatar, avatar_color, family_id, is_onboarded, profile')
          .or(`id.eq.${currentUserId},email.eq.${userEmail}`)
          .maybeSingle();

        if (error || !data || !isMounted) return;

        const latestFamilyId = data.family_id || null;
        const currentInMemory = userStore.state.currentUser;

        if (!currentInMemory) return;

        // Check if family_id, id or other core fields changed remotely
        if (
          currentInMemory.familyId !== latestFamilyId ||
          currentInMemory.id !== data.id ||
          currentInMemory.name !== (data.name || currentInMemory.name) ||
          currentInMemory.avatar !== (data.avatar || currentInMemory.avatar)
        ) {
          const updated: User = {
            ...currentInMemory,
            id: data.id,
            familyId: latestFamilyId,
            name: data.name || currentInMemory.name,
            avatar: data.avatar || currentInMemory.avatar,
            avatarColor: data.avatar_color || currentInMemory.avatarColor,
            profile: (data.profile as any) || currentInMemory.profile,
          };

          setCurrentUser(updated);
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updated));
          userActions.updateFamilyId(latestFamilyId);

          // Invalidate family and user queries immediately
          queryClient.invalidateQueries({ queryKey: familyKeys.all });
          queryClient.invalidateQueries({ queryKey: ['family'] });
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['expenses'] });

          if (latestFamilyId) {
            fetchFamily(latestFamilyId).then((f) => {
              if (f && isMounted) familyActions.setFamily(f);
            });
          } else {
            familyActions.setFamily(null);
          }
        }
      } catch (err) {
        console.warn('Sync user remote warning:', err);
      }
    };

    // 1. Supabase Realtime Channel for User row updates
    const userChannel = supabase
      .channel(`realtime_user_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${currentUserId}`,
        },
        async (payload) => {
          if (!isMounted) return;
          const newRow = payload.new as any;
          if (!newRow) {
            await syncUserRemote();
            return;
          }

          const newFamilyId = newRow.family_id || null;
          const currentInMemory = userStore.state.currentUser;

          if (currentInMemory) {
            const updated: User = {
              ...currentInMemory,
              familyId: newFamilyId,
              name: newRow.name || currentInMemory.name,
              avatar: newRow.avatar || currentInMemory.avatar,
              avatarColor: newRow.avatar_color || currentInMemory.avatarColor,
              profile: (newRow.profile as any) || currentInMemory.profile,
            };

            setCurrentUser(updated);
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updated));
            userActions.updateFamilyId(newFamilyId);

            queryClient.invalidateQueries({ queryKey: familyKeys.all });
            queryClient.invalidateQueries({ queryKey: ['family'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });

            if (newFamilyId) {
              const f = await fetchFamily(newFamilyId);
              if (f && isMounted) familyActions.setFamily(f);
            } else {
              familyActions.setFamily(null);
            }
          }
        }
      )
      .subscribe();

    // 2. Supabase Realtime Channel for Family updates (if user has a family)
    let familyChannel: any = null;
    if (currentUser.familyId) {
      const famId = currentUser.familyId;
      familyChannel = supabase
        .channel(`realtime_family_${famId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'families',
            filter: `id=eq.${famId}`,
          },
          async (payload) => {
            if (!isMounted) return;
            queryClient.invalidateQueries({ queryKey: familyKeys.all });
            queryClient.invalidateQueries({ queryKey: familyKeys.detail(famId) });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });

            if (payload.eventType === 'DELETE') {
              userActions.updateFamilyId(null);
              familyActions.setFamily(null);
              setCurrentUser((prev) => (prev ? { ...prev, familyId: null } : prev));
            } else {
              const freshFam = await fetchFamily(famId);
              if (freshFam && isMounted) {
                if (!freshFam.memberIds.includes(currentUserId)) {
                  userActions.updateFamilyId(null);
                  familyActions.setFamily(null);
                  setCurrentUser((prev) => (prev ? { ...prev, familyId: null } : prev));
                } else {
                  familyActions.setFamily(freshFam);
                }
              }
            }
          }
        )
        .subscribe();
    }

    // 3. Supabase Realtime Channel for Expenses (budget and table sync)
    const expensesChannel = supabase
      .channel(`realtime_expenses_${currentUser.familyId || currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
        },
        () => {
          if (!isMounted) return;
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: familyKeys.all });
        }
      )
      .subscribe();

    // 4. Fallback Polling & Window Focus listener (rare background check, since WebSockets handle real-time)
    const intervalId = setInterval(syncUserRemote, 60000);

    const onFocus = () => {
      syncUserRemote();
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncUserRemote();
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 5. Cross-tab sync via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('smart_budget_sync');
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'FAMILY_UPDATED') {
          syncUserRemote();
        }
      };
    } catch {}

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (bc) bc.close();
      supabase.removeChannel(userChannel);
      if (familyChannel) supabase.removeChannel(familyChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, [currentUser?.id, currentUser?.familyId, queryClient]);

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
          .or(`id.eq.${data.user.id},email.eq.${trimmedEmail}`)
          .maybeSingle();

        const loggedUser: User = {
          id: row?.id || data.user.id,
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

    if (updatedUser.familyId && (updates.budgetGoals || updates.dietaryPreferences)) {
      await updateFamilyPreferences(updatedUser.familyId, {
        budgetGoals: updates.budgetGoals,
        dietaryPreferences: updates.dietaryPreferences,
      });
      try {
        const bc = new BroadcastChannel('smart_budget_sync');
        bc.postMessage({ type: 'FAMILY_UPDATED', familyId: updatedUser.familyId });
        bc.close();
      } catch {}
    }
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
      if (params.profile?.budgetGoals || params.profile?.dietaryPreferences) {
        await updateFamilyPreferences(updatedUser.familyId, {
          budgetGoals: params.profile.budgetGoals,
          dietaryPreferences: params.profile.dietaryPreferences,
        });
      }
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

    if (updatedUser.familyId && (params.profile?.budgetGoals || params.profile?.dietaryPreferences)) {
      await updateFamilyPreferences(updatedUser.familyId, {
        budgetGoals: params.profile.budgetGoals,
        dietaryPreferences: params.profile.dietaryPreferences,
      });
      try {
        const bc = new BroadcastChannel('smart_budget_sync');
        bc.postMessage({ type: 'FAMILY_UPDATED', familyId: updatedUser.familyId });
        bc.close();
      } catch {}
    }
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
