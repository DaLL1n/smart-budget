import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { useStore } from '@tanstack/react-store';
import { auth, db, supabase } from '../../../shared/api';
import { hashPassword, getFirestoreUserId } from '../../../shared/lib';
import { User, UserProfile, CompleteSetupParams, UpdateUserSettingsParams } from './types';
import { DEFAULT_PROFILE } from './constants';
import { userStore, userActions, LOCAL_SESSION_KEY } from './userStore';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

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

  // Sync auth state listener with Firebase & Firestore Session
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          // 1. First fetch latest authoritative state from Supabase
          let supabaseFamilyId: string | null = null;
          try {
            const { data: suData } = await supabase
              .from('users')
              .select('family_id')
              .eq('id', user.uid)
              .maybeSingle();
            if (suData && suData.family_id !== undefined) {
              supabaseFamilyId = suData.family_id;
            }
          } catch {}

          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists() && isMounted) {
            const data = userDocSnap.data();

            // Priority: Supabase -> localStorage -> Firestore
            const localRaw = localStorage.getItem(LOCAL_SESSION_KEY);
            let localFamilyId: string | null = null;
            try {
              if (localRaw) localFamilyId = (JSON.parse(localRaw) as User).familyId || null;
            } catch {}

            const resolvedFamilyId = supabaseFamilyId !== null 
              ? supabaseFamilyId 
              : (localFamilyId !== null ? localFamilyId : (data.familyId || data.profile?.familyId || null));

            const loadedUser: User = {
              id: user.uid,
              name: data.name || user.displayName || user.email?.split('@')[0] || 'Пользователь',
              email: data.email || user.email || '',
              avatar: data.avatar || '🥑',
              avatarColor: data.avatarColor || 'from-emerald-400 to-teal-500',
              familyId: resolvedFamilyId,
              familyRole: data.familyRole || data.profile?.familyRole || undefined,
              createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
              isOnboarded: data.isOnboarded === true,
              profile: data.profile || {
                ...DEFAULT_PROFILE,
                updatedAt: new Date().toISOString(),
              },
            };
            setCurrentUser(loadedUser);
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(loadedUser));
            syncUserToSupabase(loadedUser);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        const stored = localStorage.getItem(LOCAL_SESSION_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as User;
            if (isMounted) setCurrentUser(parsed);
            
            if (parsed.id) {
              // Fetch latest family_id from Supabase
              (async () => {
                try {
                  const { data: suData } = await supabase
                    .from('users')
                    .select('family_id')
                    .eq('id', parsed.id)
                    .maybeSingle();
                  if (suData && isMounted) {
                    const resolvedFamilyId = suData.family_id !== undefined ? suData.family_id : parsed.familyId;
                    setCurrentUser((prev) => {
                      if (!prev) return prev;
                      const updated = { ...prev, familyId: resolvedFamilyId };
                      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updated));
                      return updated;
                    });
                  }
                } catch {}
              })();

              const docRef = doc(db, 'users', parsed.id);
              getDoc(docRef).then((snap) => {
                if (snap.exists() && isMounted) {
                  const data = snap.data();
                  const updated: User = {
                    ...parsed,
                    name: data.name || parsed.name,
                    avatar: data.avatar || parsed.avatar,
                    avatarColor: data.avatarColor || parsed.avatarColor,
                    familyRole: data.familyRole !== undefined ? data.familyRole : (data.profile?.familyRole ?? parsed.familyRole),
                    isOnboarded: data.isOnboarded === true,
                    profile: data.profile || parsed.profile,
                  };
                  setCurrentUser(updated);
                  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updated));
                }
              }).catch(() => {});
            }
          } catch {
            localStorage.removeItem(LOCAL_SESSION_KEY);
          }
        }
      }
      if (isMounted) setIsLoading(false);
    });

    // Real-time listener: Supabase Realtime + Firestore fallback
    let supabaseChannel: any = null;
    let unsubscribeUserDoc: (() => void) | null = null;

    const subscribeToUserChanges = (userId: string) => {
      // 1. Supabase Realtime Channel
      try {
        if (supabaseChannel) supabase.removeChannel(supabaseChannel);
        supabaseChannel = supabase
          .channel(`user_sync_${userId}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
            (payload) => {
              if (!isMounted) return;
              const newFamilyId = (payload.new as any)?.family_id || null;
              setCurrentUser((prev) => {
                if (!prev || prev.id !== userId) return prev;
                if (prev.familyId === newFamilyId) return prev;
                const updated = { ...prev, familyId: newFamilyId };
                localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updated));
                return updated;
              });
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription error:', err);
      }

      // 2. Firestore onSnapshot fallback
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      try {
        const userDocRef = doc(db, 'users', userId);
        unsubscribeUserDoc = onSnapshot(userDocRef, (snap) => {
          if (!snap.exists() || !isMounted) return;
          const data = snap.data();
          const firestoreFamilyId = data.familyId || data.profile?.familyId || null;

          setCurrentUser((prev) => {
            if (!prev || prev.id !== userId) return prev;
            if (prev.familyId === firestoreFamilyId) return prev;
            const updated = { ...prev, familyId: firestoreFamilyId };
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updated));
            return updated;
          });
        }, () => {});
      } catch {}
    };

    // Listen for cross-tab family updates via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('smart_budget_sync');
      bc.onmessage = (e) => {
        if (e.data?.type === 'FAMILY_UPDATED' && isMounted) {
          const stored = localStorage.getItem(LOCAL_SESSION_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as User;
              setCurrentUser(parsed);
            } catch {}
          }
        }
      };
    } catch {}

    // Subscribe once we know the userId (from Firebase Auth or localStorage)
    const storedRaw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (storedRaw) {
      try {
        const storedUser = JSON.parse(storedRaw) as User;
        if (storedUser.id) subscribeToUserChanges(storedUser.id);
      } catch {}
    }

    return () => {
      isMounted = false;
      unsubscribe();
      if (bc) bc.close();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (supabaseChannel) supabase.removeChannel(supabaseChannel);
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const trimmedEmail = email.trim().toLowerCase();
    
    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      try {
        const userDocRef = doc(db, 'users', cred.user.uid);
        await updateDoc(userDocRef, {
          lastLoginAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Could not update last login timestamp', e);
      }
      return;
    } catch (firebaseErr: any) {
      const isRestricted = 
        firebaseErr?.code === 'auth/operation-not-allowed' || 
        firebaseErr?.code === 'auth/admin-restricted-operation' ||
        firebaseErr?.code === 'auth/configuration-not-found';

      if (!isRestricted) {
        throw firebaseErr;
      }
    }

    // --- Fallback Cloud Firestore Authentication ---
    const userId = getFirestoreUserId(trimmedEmail);
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const notFoundErr: any = new Error('User not found');
      notFoundErr.code = 'auth/user-not-found';
      throw notFoundErr;
    }

    const userData = userDocSnap.data();
    const expectedHash = await hashPassword(password);

    if (userData.passwordHash && userData.passwordHash !== expectedHash) {
      const wrongPassErr: any = new Error('Wrong password');
      wrongPassErr.code = 'auth/wrong-password';
      throw wrongPassErr;
    }

    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
    }).catch(() => {});

    const loggedUser: User = {
      id: userId,
      name: userData.name || trimmedEmail.split('@')[0] || 'Пользователь',
      email: trimmedEmail,
      avatar: userData.avatar || '🥑',
      avatarColor: userData.avatarColor || 'from-emerald-400 to-teal-500',
      familyId: userData.familyId || userData.profile?.familyId || null,
      familyRole: userData.familyRole || userData.profile?.familyRole || undefined,
      createdAt: userData.createdAt ? (typeof userData.createdAt === 'string' ? userData.createdAt : new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      isOnboarded: userData.isOnboarded === true,
      profile: userData.profile || {
        ...DEFAULT_PROFILE,
        updatedAt: new Date().toISOString(),
      },
    };

    setCurrentUser(loggedUser);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(loggedUser));
    syncUserToSupabase(loggedUser);
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      
      if (trimmedName) {
        await updateFirebaseProfile(cred.user, {
          displayName: trimmedName,
        });
      }

      const userDocRef = doc(db, 'users', cred.user.uid);
      const initialUserData = {
        id: cred.user.uid,
        name: trimmedName || trimmedEmail.split('@')[0] || 'Пользователь',
        email: trimmedEmail,
        avatar: '🥑',
        avatarColor: 'from-emerald-400 to-teal-500',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isOnboarded: false,
        profile: {
          ...DEFAULT_PROFILE,
          updatedAt: new Date().toISOString(),
        },
      };

      await setDoc(userDocRef, initialUserData);

      const createdUser: User = {
        id: cred.user.uid,
        name: initialUserData.name,
        email: trimmedEmail,
        avatar: initialUserData.avatar,
        avatarColor: initialUserData.avatarColor,
        createdAt: new Date().toISOString().split('T')[0],
        isOnboarded: false,
        profile: initialUserData.profile,
      };

      setCurrentUser(createdUser);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(createdUser));
      syncUserToSupabase(createdUser);
      return;
    } catch (firebaseErr: any) {
      const isRestricted = 
        firebaseErr?.code === 'auth/operation-not-allowed' || 
        firebaseErr?.code === 'auth/admin-restricted-operation' ||
        firebaseErr?.code === 'auth/configuration-not-found';

      if (!isRestricted) {
        throw firebaseErr;
      }
    }

    // --- Fallback Cloud Firestore Registration ---
    const userId = getFirestoreUserId(trimmedEmail);
    const userDocRef = doc(db, 'users', userId);
    const existingSnap = await getDoc(userDocRef);

    if (existingSnap.exists()) {
      const existsErr: any = new Error('Email already in use');
      existsErr.code = 'auth/email-already-in-use';
      throw existsErr;
    }

    const hashedPassword = await hashPassword(password);
    const newUserData = {
      id: userId,
      name: trimmedName || trimmedEmail.split('@')[0] || 'Пользователь',
      email: trimmedEmail,
      passwordHash: hashedPassword,
      avatar: '🥑',
      avatarColor: 'from-emerald-400 to-teal-500',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isOnboarded: false,
      profile: {
        ...DEFAULT_PROFILE,
        updatedAt: new Date().toISOString(),
      },
    };

    await setDoc(userDocRef, newUserData);

    const createdUser: User = {
      id: userId,
      name: newUserData.name,
      email: trimmedEmail,
      avatar: '🥑',
      avatarColor: 'from-emerald-400 to-teal-500',
      createdAt: new Date().toISOString().split('T')[0],
      isOnboarded: false,
      profile: newUserData.profile,
    };

    setCurrentUser(createdUser);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(createdUser));
    syncUserToSupabase(createdUser);
  };

  const completeAccountSetup = async (params: CompleteSetupParams): Promise<void> => {
    if (!currentUser) return;

    const updatedProfile: UserProfile = {
      ...currentUser.profile,
      ...params.profile,
      city: params.city ?? currentUser.profile.city,
      updatedAt: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...currentUser,
      name: params.name || currentUser.name,
      avatar: params.avatar || currentUser.avatar,
      avatarColor: params.avatarColor || currentUser.avatarColor,
      isOnboarded: true,
      profile: updatedProfile,
    };

    try {
      const userDocRef = doc(db, 'users', currentUser.id);
      await updateDoc(userDocRef, {
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        avatarColor: updatedUser.avatarColor,
        isOnboarded: true,
        profile: updatedProfile,
        setupCompletedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore updateDoc note in setup:', err);
    }

    // Sync to Supabase
    try {
      await supabase.from('users').upsert({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email.toLowerCase(),
        avatar: updatedUser.avatar,
        avatar_color: updatedUser.avatarColor,
        is_onboarded: true,
        family_id: updatedUser.familyId || null,
        profile: updatedProfile as any,
        last_login_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase upsert in setup:', err);
    }

    setCurrentUser(updatedUser);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));
  };

  const refreshUser = () => {
    const stored = localStorage.getItem(LOCAL_SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setCurrentUser(parsed);
      } catch {}
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut auth note:', e);
    }
    setCurrentUser(null);
    setFirebaseUser(null);
    localStorage.removeItem(LOCAL_SESSION_KEY);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) return;

    const updatedProfile: UserProfile = {
      ...currentUser.profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      const userDocRef = doc(db, 'users', currentUser.id);
      await updateDoc(userDocRef, {
        profile: updatedProfile,
        lastUpdated: serverTimestamp(),
      });

      const updatedUser: User = {
        ...currentUser,
        profile: updatedProfile,
      };

      try {
        await supabase.from('users').update({
          profile: updatedProfile as any,
        }).eq('id', currentUser.id);
      } catch {}

      setCurrentUser(updatedUser);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error updating user profile in Firestore:', err);
      throw err;
    }
  };

  const updateUserSettings = async (params: UpdateUserSettingsParams): Promise<void> => {
    if (!currentUser) return;

    const updatedProfile: UserProfile = {
      ...currentUser.profile,
      ...(params.profile || {}),
      updatedAt: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...currentUser,
      name: params.name || currentUser.name,
      avatar: params.avatar || currentUser.avatar,
      avatarColor: params.avatarColor || currentUser.avatarColor,
      profile: updatedProfile,
    };

    try {
      const userDocRef = doc(db, 'users', currentUser.id);
      await updateDoc(userDocRef, {
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        avatarColor: updatedUser.avatarColor,
        profile: updatedProfile,
        lastUpdated: serverTimestamp(),
      });

      try {
        await supabase.from('users').update({
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          avatar_color: updatedUser.avatarColor,
          profile: updatedProfile as any,
        }).eq('id', currentUser.id);
      } catch {}

      setCurrentUser(updatedUser);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));

      // If user is in a family, broadcast update so family budget recalculates instantly
      if (updatedUser.familyId) {
        try {
          const bc = new BroadcastChannel('smart_budget_sync');
          bc.postMessage({ type: 'FAMILY_UPDATED', familyId: updatedUser.familyId });
          bc.close();
        } catch {}
      }
    } catch (err) {
      console.error('Error updating user settings in Firestore:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
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
