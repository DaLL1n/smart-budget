import { supabase } from '../../../shared/api';
import { Expense, ExpenseCategory } from '../model/types';
import { formatDateIso } from '../model/selectors';

export const LOCAL_EXPENSES_KEY = 'smart_budget_personal_expenses_v1';
export const LOCAL_DELETED_EXPENSES_KEY = 'smart_budget_deleted_expenses';

/**
 * Filter out legacy or synthetic seed mock expenses
 */
export function cleanExpenses(list: Expense[]): Expense[] {
  if (!Array.isArray(list)) return [];
  return list.filter(e => e && typeof e.id === 'string' && !e.id.startsWith('seed_exp_') && !e.id.includes('seed'));
}

/**
 * Proactively purges legacy mock/seed items and stale cached objects from localStorage
 */
export function purgeLegacyStorage(): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (
        key.startsWith(LOCAL_EXPENSES_KEY) || 
        key.startsWith(LOCAL_DELETED_EXPENSES_KEY) || 
        key.startsWith('smart_budget_family_')
      ) {
        const raw = localStorage.getItem(key);
        if (raw && (raw.includes('seed_exp_') || raw.includes('seed_') || raw.includes('33373') || raw.includes('33696'))) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const cleaned = cleanExpenses(parsed);
              if (cleaned.length === 0) {
                keysToRemove.push(key);
              } else {
                localStorage.setItem(key, JSON.stringify(cleaned));
              }
            } else {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  } catch (e) {
    console.warn('Error purging legacy storage:', e);
  }
}

// Proactively run cleanup on module initialization
purgeLegacyStorage();

/**
 * Reads local cached expenses for a user, purging any legacy seeds
 */
export function getLocalExpenses(userId: string): Expense[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_EXPENSES_KEY}_${userId}`);
    if (raw) {
      const list = JSON.parse(raw) as Expense[];
      const cleaned = cleanExpenses(list).filter(e => !e.deletedAt);
      if (cleaned.length !== list.length) {
        saveLocalExpenses(userId, cleaned);
      }
      return cleaned;
    }
  } catch (e) {
    console.warn('Error reading local expenses:', e);
  }

  return [];
}

export function saveLocalExpenses(userId: string, expenses: Expense[]): void {
  try {
    const cleaned = cleanExpenses(expenses);
    localStorage.setItem(`${LOCAL_EXPENSES_KEY}_${userId}`, JSON.stringify(cleaned));
  } catch (e) {
    console.warn('Error saving local expenses:', e);
  }
}

/**
 * Reads local cached deleted expenses for a user
 */
export function getLocalDeletedExpenses(userId: string): Expense[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_DELETED_EXPENSES_KEY}_${userId}`);
    if (raw) {
      const list = JSON.parse(raw) as Expense[];
      return cleanExpenses(list).filter(e => e.userId === userId);
    }
  } catch (e) {
    console.warn('Error reading deleted expenses:', e);
  }
  return [];
}

export function saveLocalDeletedExpenses(userId: string, expenses: Expense[]): void {
  try {
    const cleaned = cleanExpenses(expenses).filter(e => e.userId === userId);
    localStorage.setItem(`${LOCAL_DELETED_EXPENSES_KEY}_${userId}`, JSON.stringify(cleaned));
  } catch (e) {
    console.warn('Error saving deleted expenses:', e);
  }
}

/**
 * Reads local cached family deleted expenses
 */
export function getLocalFamilyDeletedExpenses(familyId: string, memberIds: string[] = []): Expense[] {
  const result: Expense[] = [];
  const seenIds = new Set<string>();

  try {
    const raw = localStorage.getItem(`${LOCAL_DELETED_EXPENSES_KEY}_family_${familyId}`);
    if (raw) {
      const list = cleanExpenses(JSON.parse(raw) as Expense[]);
      list.forEach(e => {
        if (!seenIds.has(e.id)) {
          seenIds.add(e.id);
          result.push(e);
        }
      });
    }
  } catch {}

  memberIds.forEach(memberId => {
    const memDeleted = getLocalDeletedExpenses(memberId);
    memDeleted.forEach(e => {
      if (!seenIds.has(e.id)) {
        seenIds.add(e.id);
        result.push(e);
      }
    });
  });

  return result.sort((a, b) => (b.deletedAt || b.date).localeCompare(a.deletedAt || a.date));
}

export function saveLocalFamilyDeletedExpenses(familyId: string, expenses: Expense[]): void {
  try {
    localStorage.setItem(`${LOCAL_DELETED_EXPENSES_KEY}_family_${familyId}`, JSON.stringify(cleanExpenses(expenses)));
  } catch (e) {
    console.warn('Error saving family deleted expenses:', e);
  }
}

/**
 * Helper to map Supabase expense row to typed Expense object
 */
function mapRowToExpense(row: any): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    familyId: row.family_id,
    amount: Number(row.amount),
    category: row.category as ExpenseCategory,
    storeId: row.store_id,
    date: row.date,
    title: row.title || 'Покупка продуктов',
    receiptItems: (row.receipt_items as any) || [],
    createdAt: row.created_at,
    deletedAt: row.deleted_at || null,
    deletedBy: row.deleted_by || null,
  };
}

/**
 * Fetches active personal expenses for a specific user from Supabase with local fallback
 */
export async function fetchPersonalExpenses(userId: string): Promise<Expense[]> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false });

    if (!error && data) {
      const supabaseResults = data.map(mapRowToExpense);
      saveLocalExpenses(userId, supabaseResults);
      return supabaseResults;
    }
  } catch (err) {
    console.warn('Supabase fetch expenses note (using local cache):', err);
  }

  return getLocalExpenses(userId);
}

/**
 * Fetches deleted personal expenses (only for this user)
 */
export async function fetchPersonalDeletedExpenses(userId: string): Promise<Expense[]> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (!error && data) {
      const supabaseResults = data.map(mapRowToExpense);
      saveLocalDeletedExpenses(userId, supabaseResults);
      return supabaseResults;
    }
  } catch (err) {
    console.warn('Supabase fetch personal deleted expenses note (using local cache):', err);
  }

  return getLocalDeletedExpenses(userId);
}

/**
 * Creates a new personal expense in Supabase and local cache
 */
export async function createPersonalExpense(params: {
  userId: string;
  amount: number;
  category: ExpenseCategory;
  storeId: string;
  date?: string;
  title?: string;
  familyId?: string | null;
}): Promise<Expense> {
  const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const date = params.date || formatDateIso(new Date());

  const newExpense: Expense = {
    id: expenseId,
    userId: params.userId,
    familyId: params.familyId || null,
    amount: params.amount,
    category: params.category,
    storeId: params.storeId,
    date,
    title: params.title || 'Покупка продуктов',
    createdAt: new Date().toISOString(),
    deletedAt: null,
    deletedBy: null,
  };

  try {
    await supabase.from('expenses').insert({
      id: expenseId,
      user_id: params.userId,
      family_id: params.familyId || null,
      amount: params.amount,
      category: params.category,
      store_id: params.storeId,
      date,
      title: params.title || 'Покупка продуктов',
      created_at: new Date().toISOString(),
      deleted_at: null,
      deleted_by: null,
    });
  } catch (err) {
    console.warn('Supabase create expense note (saved locally):', err);
  }

  // Update local cache
  const local = getLocalExpenses(params.userId);
  const updated = [newExpense, ...local];
  saveLocalExpenses(params.userId, updated);

  // If created within a family, also update cached family expenses if present
  if (params.familyId) {
    try {
      const famKey = `${LOCAL_EXPENSES_KEY}_family_${params.familyId}`;
      const rawFam = localStorage.getItem(famKey);
      if (rawFam) {
        const famList = JSON.parse(rawFam) as Expense[];
        localStorage.setItem(famKey, JSON.stringify([newExpense, ...famList.filter(e => e.id !== newExpense.id)]));
      }
    } catch (e) {
      console.warn('Error updating local family cache on create:', e);
    }
  }

  return newExpense;
}

/**
 * Deletes an expense by ID with strict ownership validation (user can only delete their own item)
 */
export async function deletePersonalExpense(expenseId: string, userId: string): Promise<void> {
  const nowIso = new Date().toISOString();

  // 1. Check existing local item in user's cache, other users' caches, or family caches
  const local = getLocalExpenses(userId);
  let targetExpense = local.find(e => e.id === expenseId);

  if (!targetExpense) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_EXPENSES_KEY)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const list = JSON.parse(raw) as Expense[];
            const found = Array.isArray(list) ? list.find(e => e.id === expenseId) : null;
            if (found) {
              targetExpense = found;
              break;
            }
          } catch {}
        }
      }
    }
  }

  // Also check Supabase if not found locally
  if (!targetExpense) {
    try {
      const { data } = await supabase.from('expenses').select('*').eq('id', expenseId).maybeSingle();
      if (data) {
        targetExpense = mapRowToExpense(data);
      }
    } catch {}
  }

  // Permission validation: only creator can delete
  if (targetExpense && targetExpense.userId !== userId) {
    throw new Error('Пользователь может удалять только те товары, которые он добавил сам');
  }

  // Mark deleted
  const deletedExpense: Expense = targetExpense ? {
    ...targetExpense,
    deletedAt: nowIso,
    deletedBy: userId,
  } : {
    id: expenseId,
    userId,
    amount: 0,
    category: 'other',
    storeId: '',
    date: formatDateIso(new Date()),
    createdAt: nowIso,
    deletedAt: nowIso,
    deletedBy: userId,
  };

  // 2. Update personal active & deleted caches
  const updatedActive = local.filter(e => e.id !== expenseId);
  saveLocalExpenses(userId, updatedActive);

  const personalDeleted = getLocalDeletedExpenses(userId);
  saveLocalDeletedExpenses(userId, [deletedExpense, ...personalDeleted.filter(e => e.id !== expenseId)]);

  // 3. Update family active & deleted caches
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${LOCAL_EXPENSES_KEY}_family_`)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw) as Expense[];
          const filtered = list.filter(e => e.id !== expenseId);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
      if (key && key.startsWith(`${LOCAL_DELETED_EXPENSES_KEY}_family_`)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw) as Expense[];
          const updated = [deletedExpense, ...list.filter(e => e.id !== expenseId)];
          localStorage.setItem(key, JSON.stringify(updated));
        }
      }
    }
  } catch (e) {
    console.warn('Error updating local family caches on delete:', e);
  }

  // 4. Soft delete in Supabase
  try {
    const { error } = await supabase
      .from('expenses')
      .update({
        deleted_at: nowIso,
        deleted_by: userId,
      })
      .eq('id', expenseId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase soft delete expense error:', error);
    }
  } catch (err) {
    console.warn('Supabase soft delete expense note:', err);
  }
}

/**
 * Restores a deleted expense by ID with ownership validation
 */
export async function restorePersonalExpense(expenseId: string, userId: string): Promise<Expense | null> {
  // Find in personal or family deleted list or other deleted caches
  const personalDeleted = getLocalDeletedExpenses(userId);
  let toRestore = personalDeleted.find(e => e.id === expenseId);

  if (!toRestore) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_DELETED_EXPENSES_KEY)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const list = JSON.parse(raw) as Expense[];
            const found = Array.isArray(list) ? list.find(e => e.id === expenseId) : null;
            if (found) {
              toRestore = found;
              break;
            }
          } catch {}
        }
      }
    }
  }

  // Also check Supabase if not found locally
  if (!toRestore) {
    try {
      const { data } = await supabase.from('expenses').select('*').eq('id', expenseId).maybeSingle();
      if (data) {
        toRestore = mapRowToExpense(data);
      }
    } catch {}
  }

  if (toRestore && toRestore.userId !== userId) {
    throw new Error('Пользователь может восстанавливать только те товары, которые он добавил сам');
  }

  const restoredExpense: Expense = toRestore ? {
    ...toRestore,
    deletedAt: null,
    deletedBy: null,
  } : {
    id: expenseId,
    userId,
    amount: 0,
    category: 'other',
    storeId: '',
    date: formatDateIso(new Date()),
    createdAt: new Date().toISOString(),
    deletedAt: null,
    deletedBy: null,
  };

  // Remove from personal deleted list and add back to personal active
  saveLocalDeletedExpenses(userId, personalDeleted.filter(e => e.id !== expenseId));
  const personalActive = getLocalExpenses(userId);
  saveLocalExpenses(userId, [restoredExpense, ...personalActive.filter(e => e.id !== expenseId)]);

  // Clean from family deleted caches and restore to family active caches
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${LOCAL_DELETED_EXPENSES_KEY}_family_`)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw) as Expense[];
          localStorage.setItem(key, JSON.stringify(list.filter(e => e.id !== expenseId)));
        }
      }
      if (key && key.startsWith(`${LOCAL_EXPENSES_KEY}_family_`)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw) as Expense[];
          localStorage.setItem(key, JSON.stringify([restoredExpense, ...list.filter(e => e.id !== expenseId)]));
        }
      }
    }
  } catch (e) {
    console.warn('Error updating family caches on restore:', e);
  }

  // Soft restore in Supabase
  try {
    await supabase
      .from('expenses')
      .update({
        deleted_at: null,
        deleted_by: null,
      })
      .eq('id', expenseId)
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Supabase restore expense note:', err);
  }

  return restoredExpense;
}

/**
 * Synchronous local retrieval of active family expenses from cache
 */
export function getLocalFamilyExpenses(familyId: string, memberIds: string[] = []): Expense[] {
  const result: Expense[] = [];
  const seenIds = new Set<string>();

  // Check cached family-specific expenses
  try {
    const raw = localStorage.getItem(`${LOCAL_EXPENSES_KEY}_family_${familyId}`);
    if (raw) {
      const list = cleanExpenses(JSON.parse(raw) as Expense[]);
      list.filter(e => !e.deletedAt).forEach(e => {
        if (!seenIds.has(e.id)) {
          seenIds.add(e.id);
          result.push(e);
        }
      });
    }
  } catch {}

  // Aggregate personal expenses of family members
  memberIds.forEach(memberId => {
    const memList = getLocalExpenses(memberId);
    memList.filter(e => !e.deletedAt).forEach(e => {
      if (!seenIds.has(e.id)) {
        seenIds.add(e.id);
        result.push(e);
      }
    });
  });

  return result.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Fetches all active family expenses from Supabase with fallback to member local caches
 */
export async function fetchFamilyExpenses(familyId: string, memberIds: string[] = []): Promise<Expense[]> {
  try {
    let query = supabase.from('expenses').select('*').is('deleted_at', null);
    if (memberIds.length > 0) {
      query = query.or(`family_id.eq.${familyId},user_id.in.(${memberIds.join(',')})`);
    } else {
      query = query.eq('family_id', familyId);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (!error && data) {
      const supabaseResults = data.map(mapRowToExpense);
      try {
        localStorage.setItem(`${LOCAL_EXPENSES_KEY}_family_${familyId}`, JSON.stringify(supabaseResults));
      } catch {}
      return supabaseResults;
    }
  } catch (err) {
    console.warn('Supabase fetch family expenses note (using local cache):', err);
  }

  return getLocalFamilyExpenses(familyId, memberIds);
}

/**
 * Fetches all deleted family expenses from Supabase with fallback to member local caches
 */
export async function fetchFamilyDeletedExpenses(familyId: string, memberIds: string[] = []): Promise<Expense[]> {
  try {
    let query = supabase.from('expenses').select('*').not('deleted_at', 'is', null);
    if (memberIds.length > 0) {
      query = query.or(`family_id.eq.${familyId},user_id.in.(${memberIds.join(',')})`);
    } else {
      query = query.eq('family_id', familyId);
    }

    const { data, error } = await query.order('deleted_at', { ascending: false });

    if (!error && data) {
      const supabaseResults = data.map(mapRowToExpense);
      saveLocalFamilyDeletedExpenses(familyId, supabaseResults);
      return supabaseResults;
    }
  } catch (err) {
    console.warn('Supabase fetch family deleted expenses note:', err);
  }

  return getLocalFamilyDeletedExpenses(familyId, memberIds);
}
