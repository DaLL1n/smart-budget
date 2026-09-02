import { collection, query, where, getDocs } from 'firebase/firestore';
import { supabase, db } from '../../../shared/api';
import { User, userActions } from '../../user';
import { Family, FamilyMember, addFamilyMemberInputSchema } from '../model/schema';
import { familyActions } from '../model/familyStore';

const LOCAL_FAMILY_PREFIX = 'smart_budget_family_';
const LOCAL_SESSION_KEY = 'food_budget_cloud_user';

/**
 * Broadcast event helper to sync across tabs/windows
 */
function broadcastFamilyUpdate(type: string, payload?: any) {
  try {
    const bc = new BroadcastChannel('smart_budget_sync');
    bc.postMessage({ type, ...payload });
    bc.close();
  } catch {}
}

/**
 * Loads user details for family member representation from Supabase with fallback
 */
async function loadMemberProfile(userId: string): Promise<FamilyMember | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      const userProfile = (data.profile as any) || {};
      return {
        userId: data.id,
        name: data.name || data.email.split('@')[0] || 'Участник',
        email: data.email || '',
        avatar: data.avatar || '🥑',
        avatarColor: data.avatar_color || 'from-emerald-400 to-teal-500',
        joinedAt: data.created_at || new Date().toISOString(),
        monthlySpent: 0,
        monthlyBudget: userProfile.monthlyBudget ? Number(userProfile.monthlyBudget) : 35000,
      };
    }
  } catch (err) {
    console.warn('Could not load member profile from Supabase:', err);
  }

  // Fallback to local session if matching
  try {
    const local = localStorage.getItem(LOCAL_SESSION_KEY);
    if (local) {
      const u = JSON.parse(local);
      if (u.id === userId) {
        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar || '🥑',
          avatarColor: u.avatarColor || 'from-emerald-400 to-teal-500',
          joinedAt: u.createdAt || new Date().toISOString(),
          monthlySpent: 0,
          monthlyBudget: u.profile?.monthlyBudget ? Number(u.profile.monthlyBudget) : 35000,
        };
      }
    }
  } catch {}

  return null;
}

/**
 * Fetches Family data by ID and enriches members profile list
 */
export async function fetchFamily(familyId: string): Promise<Family | null> {
  if (!familyId) return null;

  let rawFamily: any = null;

  try {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .maybeSingle();

    if (!error && data) {
      rawFamily = {
        id: data.id,
        memberIds: data.member_ids,
        monthlyBudget: Number(data.monthly_budget),
        dietaryPreferences: data.dietary_preferences,
        budgetGoals: data.budget_goals,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch (err) {
    console.warn('Supabase fetchFamily note:', err);
  }

  if (!rawFamily) {
    const localRaw = localStorage.getItem(`${LOCAL_FAMILY_PREFIX}${familyId}`);
    if (localRaw) {
      try {
        rawFamily = JSON.parse(localRaw);
      } catch {}
    }
  }

  if (!rawFamily) return null;

  const memberIds: string[] = rawFamily.memberIds || [];

  // Hydrate all member profiles
  const loadedMembers: FamilyMember[] = [];
  for (const uid of memberIds) {
    const profile = await loadMemberProfile(uid);
    if (profile) {
      loadedMembers.push(profile);
    } else {
      loadedMembers.push({
        userId: uid,
        name: 'Участник семьи',
        email: '',
        avatar: '🥑',
        avatarColor: 'from-emerald-400 to-teal-500',
        joinedAt: new Date().toISOString(),
        monthlySpent: 0,
      });
    }
  }

  // Calculate total monthly budget dynamically as the sum of all members' individual budgets
  const sumMembersBudget = loadedMembers.reduce((acc, m) => acc + (m.monthlyBudget || 35000), 0);
  const totalMonthlyBudget = sumMembersBudget > 0 ? sumMembersBudget : (rawFamily.monthlyBudget || 60000);

  const familyData: Family = {
    id: familyId,
    memberIds,
    members: loadedMembers,
    monthlyBudget: totalMonthlyBudget,
    dietaryPreferences: rawFamily.dietaryPreferences || ['standard'],
    budgetGoals: rawFamily.budgetGoals || ['save_money', 'smart_planning'],
    createdAt: rawFamily.createdAt || new Date().toISOString(),
    updatedAt: rawFamily.updatedAt || new Date().toISOString(),
  };

  // Sync updated aggregated budget to Supabase if changed
  if (rawFamily.monthlyBudget !== totalMonthlyBudget) {
    (async () => {
      try {
        await supabase
          .from('families')
          .update({
            monthly_budget: totalMonthlyBudget,
            updated_at: new Date().toISOString(),
          })
          .eq('id', familyId);
      } catch {}
    })();
  }

  localStorage.setItem(`${LOCAL_FAMILY_PREFIX}${familyId}`, JSON.stringify(familyData));
  familyActions.setFamily(familyData);
  return familyData;
}

/**
 * Directly adds a member to the family by Email without invitations
 */
export async function addFamilyMember(currentUser: User, targetEmail: string): Promise<Family> {
  const parsed = addFamilyMemberInputSchema.parse({ email: targetEmail });
  const normalizedEmail = parsed.email;

  if (normalizedEmail === currentUser.email.trim().toLowerCase()) {
    throw new Error('Вы не можете добавить свой собственный адрес.');
  }

  // Ensure current user is synced to Supabase
  try {
    await supabase.from('users').upsert(
      {
        id: currentUser.id,
        email: currentUser.email.trim().toLowerCase(),
        name: currentUser.name,
        avatar: currentUser.avatar || '🥑',
        avatar_color: currentUser.avatarColor || 'from-emerald-400 to-teal-500',
        family_id: currentUser.familyId || null,
        is_onboarded: currentUser.isOnboarded ?? true,
        last_login_at: new Date().toISOString(),
        profile: (currentUser.profile as any) || {},
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Supabase upsert currentUser error:', err);
  }

  // 1. Locate registered user by Email in Supabase
  let targetUser: { id: string; name: string; email: string; familyId?: string | null } | null = null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!error && data) {
      targetUser = {
        id: data.id,
        name: data.name || normalizedEmail.split('@')[0],
        email: data.email,
        familyId: data.family_id,
      };
    }
  } catch (err) {
    console.warn('Error querying user by email in Supabase:', err);
  }

  // 2. Fallback to Firestore (for users registered before Supabase migration)
  if (!targetUser) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', normalizedEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0].data();
        targetUser = {
          id: snap.docs[0].id,
          name: docData.name || normalizedEmail.split('@')[0],
          email: docData.email || normalizedEmail,
          familyId: docData.familyId || null,
        };

        // Sync found Firestore user directly into Supabase
        await supabase.from('users').upsert(
          {
            id: targetUser.id,
            email: targetUser.email.toLowerCase(),
            name: targetUser.name,
            family_id: targetUser.familyId || null,
            avatar: docData.avatar || '🥑',
            avatar_color: docData.avatarColor || 'from-emerald-400 to-teal-500',
            is_onboarded: docData.isOnboarded ?? true,
            profile: docData.profile || {},
          },
          { onConflict: 'id' }
        );
      }
    } catch (err) {
      console.warn('Firestore fallback user query note:', err);
    }
  }

  // 3. Fallback to local session check & registered users registry
  if (!targetUser) {
    const registryRaw = localStorage.getItem('smart_budget_registered_users_v1');
    if (registryRaw) {
      try {
        const reg = JSON.parse(registryRaw);
        const match = Object.values(reg).find((u: any) => u.email?.toLowerCase() === normalizedEmail) as any;
        if (match) {
          targetUser = {
            id: match.id,
            name: match.name,
            email: match.email,
            familyId: match.familyId || null,
          };
          // Sync to Supabase so it has full persistence
          await supabase.from('users').upsert(
            {
              id: match.id,
              email: match.email.toLowerCase(),
              name: match.name,
              family_id: match.familyId || null,
            },
            { onConflict: 'id' }
          );
        }
      } catch {}
    }
  }

  if (!targetUser) {
    const local = localStorage.getItem(LOCAL_SESSION_KEY);
    if (local) {
      try {
        const u = JSON.parse(local);
        if (u.email?.toLowerCase() === normalizedEmail) {
          targetUser = {
            id: u.id,
            name: u.name,
            email: u.email,
            familyId: u.familyId || null,
          };
        }
      } catch {}
    }
  }

  if (!targetUser) {
    throw new Error('Пользователь с таким email не найден в системе. Попросите его сначала зарегистрироваться в приложении.');
  }

  const currentFamilyId = currentUser.familyId;

  // Check if target user is already in a family (and that family actually exists)
  if (targetUser.familyId) {
    const targetFamily = await fetchFamily(targetUser.familyId);
    if (!targetFamily) {
      // Stale familyId pointing to deleted family — clear it and allow adding
      targetUser.familyId = null;
      try {
        await supabase.from('users').update({ family_id: null }).eq('id', targetUser.id);
      } catch {}
    } else {
      if (currentFamilyId && targetUser.familyId === currentFamilyId) {
        throw new Error('Этот пользователь уже состоит в вашей семье.');
      }
      throw new Error('Пользователь уже состоит в другой семье. Ему необходимо сначала выйти из нее.');
    }
  }

  let familyId = currentFamilyId;
  let familyData: Family | undefined;

  if (!familyId) {
    // Create new Family grouping currentUser and targetUser
    familyId = `fam_${currentUser.id}_${Date.now()}`;
    const initialMemberIds = [currentUser.id, targetUser.id];

    familyData = {
      id: familyId,
      memberIds: initialMemberIds,
      members: [],
      monthlyBudget: currentUser.profile?.monthlyBudget ? currentUser.profile.monthlyBudget * 1.8 : 60000,
      dietaryPreferences: currentUser.profile?.dietaryPreferences || ['standard'],
      budgetGoals: currentUser.profile?.budgetGoals || ['save_money', 'smart_planning'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save Family to Supabase
    try {
      await supabase.from('families').upsert({
        id: familyId,
        member_ids: initialMemberIds,
        monthly_budget: familyData.monthlyBudget,
        dietary_preferences: familyData.dietaryPreferences,
        budget_goals: familyData.budgetGoals,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase set family error:', err);
    }

    // Update currentUser in Supabase
    try {
      await supabase.from('users').update({ family_id: familyId }).eq('id', currentUser.id);
    } catch (err) {
      console.warn('Supabase set currentUser family_id error:', err);
    }

    // Update targetUser in Supabase
    try {
      await supabase.from('users').update({ family_id: familyId }).eq('id', targetUser.id);
    } catch (err) {
      console.warn('Supabase set targetUser family_id error:', err);
    }

    // Update local registry
    try {
      const rawReg = localStorage.getItem('smart_budget_registered_users_v1');
      const reg = rawReg ? JSON.parse(rawReg) : {};
      reg[currentUser.id] = { ...currentUser, familyId };
      reg[targetUser.id] = { ...targetUser, familyId };
      localStorage.setItem('smart_budget_registered_users_v1', JSON.stringify(reg));
    } catch {}

    // Update current user local session and family cache
    currentUser.familyId = familyId;
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ ...currentUser, familyId }));
    localStorage.setItem(`${LOCAL_FAMILY_PREFIX}${familyId}`, JSON.stringify(familyData));

  } else {
    // Existing family: append targetUser.id
    const existingFamily = await fetchFamily(familyId);
    if (!existingFamily) {
      // Stale familyId in localStorage — reset and recurse
      currentUser.familyId = null;
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ ...currentUser, familyId: null }));
      return addFamilyMember(currentUser, targetEmail);
    }

    if (existingFamily.memberIds.includes(targetUser.id)) {
      throw new Error('Этот пользователь уже состоит в вашей семье.');
    }

    const updatedMemberIds = [...existingFamily.memberIds, targetUser.id];
    familyData = {
      ...existingFamily,
      memberIds: updatedMemberIds,
      updatedAt: new Date().toISOString(),
    };

    // Update family in Supabase
    try {
      await supabase
        .from('families')
        .update({
          member_ids: updatedMemberIds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', familyId);
    } catch (err) {
      console.warn('Supabase update family error:', err);
    }

    // Update targetUser in Supabase
    try {
      await supabase.from('users').update({ family_id: familyId }).eq('id', targetUser.id);
    } catch (err) {
      console.warn('Supabase set targetUser error:', err);
    }

    // Update local registry and family cache
    try {
      const rawReg = localStorage.getItem('smart_budget_registered_users_v1');
      const reg = rawReg ? JSON.parse(rawReg) : {};
      reg[targetUser.id] = { ...targetUser, familyId };
      localStorage.setItem('smart_budget_registered_users_v1', JSON.stringify(reg));
    } catch {}

    localStorage.setItem(`${LOCAL_FAMILY_PREFIX}${familyId}`, JSON.stringify(familyData));
  }

  // Hydrate updated full family profile
  const fullFamily = await fetchFamily(familyId);
  const resultFamily = fullFamily || familyData!;
  
  // Reactively update TanStack Stores immediately
  userActions.updateFamilyId(familyId);
  familyActions.setFamily(resultFamily);

  broadcastFamilyUpdate('FAMILY_UPDATED', { familyId });
  return resultFamily;
}

/**
 * Current user voluntarily leaves the family.
 * If 1 or 0 members remain, the family is dissolved.
 */
export async function leaveFamily(currentUser: User): Promise<void> {
  const familyId = currentUser.familyId;
  if (!familyId) return;

  const family = await fetchFamily(familyId);
  if (!family) {
    currentUser.familyId = null;
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ ...currentUser, familyId: null }));
    return;
  }

  const remainingMemberIds = family.memberIds.filter(id => id !== currentUser.id);

  // Update currentUser in Supabase
  try {
    await supabase.from('users').update({ family_id: null }).eq('id', currentUser.id);
  } catch (err) {
    console.warn('Supabase leave update user error:', err);
  }

  // If only 1 or 0 members remain, dissolve the family completely
  if (remainingMemberIds.length <= 1) {
    if (remainingMemberIds.length === 1) {
      const lastUserId = remainingMemberIds[0];
      try {
        await supabase.from('users').update({ family_id: null }).eq('id', lastUserId);
      } catch (err) {
        console.warn('Supabase reset last user family_id error:', err);
      }
    }

    try {
      await supabase.from('families').delete().eq('id', familyId);
    } catch (err) {
      console.warn('Supabase delete dissolved family error:', err);
    }

    localStorage.removeItem(`${LOCAL_FAMILY_PREFIX}${familyId}`);
  } else {
    // Keep family with remaining members
    try {
      await supabase
        .from('families')
        .update({
          member_ids: remainingMemberIds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', familyId);
    } catch (err) {
      console.warn('Supabase update family after leave error:', err);
    }
  }

  currentUser.familyId = null;
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ ...currentUser, familyId: null }));
  userActions.updateFamilyId(null);
  familyActions.setFamily(null);
  broadcastFamilyUpdate('FAMILY_UPDATED', { familyId });
}

/**
 * Removes another member from the family (any member has equal rights).
 * If 1 or 0 members remain, the family is dissolved.
 */
export async function removeFamilyMember(currentUser: User, memberUserId: string): Promise<Family | null> {
  const familyId = currentUser.familyId;
  if (!familyId) throw new Error('Вы не состоите в семье.');

  if (memberUserId === currentUser.id) {
    await leaveFamily(currentUser);
    return null;
  }

  const family = await fetchFamily(familyId);
  if (!family) throw new Error('Семейное пространство не найдено.');

  const remainingMemberIds = family.memberIds.filter(id => id !== memberUserId);

  // Clear removed user's familyId in Supabase
  try {
    await supabase.from('users').update({ family_id: null }).eq('id', memberUserId);
  } catch (err) {
    console.warn('Supabase remove member update error:', err);
  }

  // If only 1 member remains (currentUser), dissolve the family
  if (remainingMemberIds.length <= 1) {
    try {
      await supabase.from('users').update({ family_id: null }).eq('id', currentUser.id);
    } catch (err) {
      console.warn('Supabase reset currentUser family_id error:', err);
    }

    try {
      await supabase.from('families').delete().eq('id', familyId);
    } catch (err) {
      console.warn('Supabase delete family error:', err);
    }

    currentUser.familyId = null;
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ ...currentUser, familyId: null }));
    userActions.updateFamilyId(null);
    familyActions.setFamily(null);
    localStorage.removeItem(`${LOCAL_FAMILY_PREFIX}${familyId}`);
    broadcastFamilyUpdate('FAMILY_UPDATED', { familyId });
    return null;
  }

  // Update family doc
  try {
    await supabase
      .from('families')
      .update({
        member_ids: remainingMemberIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', familyId);
  } catch (err) {
    console.warn('Supabase update family error:', err);
  }

  const updatedFamily = await fetchFamily(familyId);
  broadcastFamilyUpdate('FAMILY_UPDATED', { familyId });
  return updatedFamily;
}
