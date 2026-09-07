import { supabase } from '../../../shared/api';
import { Expense, ExpenseCategory } from '../model/types';
import { formatDateIso } from '../model/selectors';

const LOCAL_EXPENSES_KEY = 'smart_budget_personal_expenses_v1';

/**
 * Generate seed expenses for realistic analytics out-of-the-box
 */
function generateSeedExpenses(userId: string): Expense[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();

  const seeds: Expense[] = [
    {
      id: `seed_exp_1_${userId}`,
      userId,
      familyId: null,
      amount: 1450,
      category: 'vegetables_fruits',
      storeId: 'vkusvill',
      date: formatDateIso(new Date(year, month, Math.max(1, currentDay))),
      title: 'Свежие овощи, зелень, авокадо',
      createdAt: new Date().toISOString(),
    },
    {
      id: `seed_exp_2_${userId}`,
      userId,
      familyId: null,
      amount: 890,
      category: 'dairy_cheese',
      storeId: 'pyaterochka',
      date: formatDateIso(new Date(year, month, Math.max(1, currentDay - 1))),
      title: 'Молоко, творог, пармезан',
      createdAt: new Date().toISOString(),
    },
    {
      id: `seed_exp_3_${userId}`,
      userId,
      familyId: null,
      amount: 2300,
      category: 'meat_fish',
      storeId: 'perekrestok',
      date: formatDateIso(new Date(year, month, Math.max(1, currentDay - 2))),
      title: 'Индейка, филе лосося',
      createdAt: new Date().toISOString(),
    },
    {
      id: `seed_exp_4_${userId}`,
      userId,
      familyId: null,
      amount: 650,
      category: 'grocery_bread',
      storeId: 'samokat',
      date: formatDateIso(new Date(year, month, Math.max(1, currentDay - 3))),
      title: 'Гречневая крупа, цельнозерновой хлеб',
      createdAt: new Date().toISOString(),
    },
    {
      id: `seed_exp_5_${userId}`,
      userId,
      familyId: null,
      amount: 1120,
      category: 'ready_food',
      storeId: 'vkusvill',
      date: formatDateIso(new Date(year, month, Math.max(1, currentDay - 4))),
      title: 'Обед: боул с курицей и смузи',
      createdAt: new Date().toISOString(),
    },
    {
      id: `seed_exp_6_${userId}`,
      userId,
      familyId: null,
      amount: 480,
      category: 'drinks_snacks',
      storeId: 'magnit',
      date: formatDateIso(new Date(year, month, Math.max(1, currentDay - 5))),
      title: 'Ореховая смесь и минеральная вода',
      createdAt: new Date().toISOString(),
    },
    {
      id: `seed_exp_7_${userId}`,
      userId,
      familyId: null,
      amount: 3200,
      category: 'meat_fish',
      storeId: 'auchan',
      date: formatDateIso(new Date(year, month, Math.max(1, currentDay - 6))),
      title: 'Большая закупка мяса и птицы на неделю',
      createdAt: new Date().toISOString(),
    },
    {
      id: `seed_exp_8_${userId}`,
      userId,
      familyId: null,
      amount: 980,
      category: 'vegetables_fruits',
      storeId: 'pyaterochka',
      date: formatDateIso(new Date(year, month, Math.max(1, currentDay - 7))),
      title: 'Яблоки, бананы, томаты',
      createdAt: new Date().toISOString(),
    },
  ];

  return seeds;
}

export function getLocalExpenses(userId: string): Expense[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_EXPENSES_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading local expenses:', e);
  }

  const seeds = generateSeedExpenses(userId);
  saveLocalExpenses(userId, seeds);
  return seeds;
}

function saveLocalExpenses(userId: string, expenses: Expense[]): void {
  try {
    localStorage.setItem(`${LOCAL_EXPENSES_KEY}_${userId}`, JSON.stringify(expenses));
  } catch (e) {
    console.warn('Error saving local expenses:', e);
  }
}

/**
 * Fetches all personal expenses for a specific user from Supabase with local fallback
 */
export async function fetchPersonalExpenses(userId: string): Promise<Expense[]> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (!error && data) {
      const supabaseResults: Expense[] = data.map((row) => ({
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
      }));

      saveLocalExpenses(userId, supabaseResults);
      return supabaseResults;
    }
  } catch (err) {
    console.warn('Supabase fetch expenses note (using local cache):', err);
  }

  return getLocalExpenses(userId);
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
    });
  } catch (err) {
    console.warn('Supabase create expense note (saved locally):', err);
  }

  // Update local cache
  const local = getLocalExpenses(params.userId);
  const updated = [newExpense, ...local];
  saveLocalExpenses(params.userId, updated);

  return newExpense;
}

export const LOCAL_DELETED_EXPENSES_KEY = 'smart_budget_deleted_expenses';

export function getLocalDeletedExpenses(userId: string): Expense[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_DELETED_EXPENSES_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading deleted expenses:', e);
  }
  return [];
}

export function saveLocalDeletedExpenses(userId: string, expenses: Expense[]): void {
  try {
    localStorage.setItem(`${LOCAL_DELETED_EXPENSES_KEY}_${userId}`, JSON.stringify(expenses));
  } catch (e) {
    console.warn('Error saving deleted expenses:', e);
  }
}

/**
 * Deletes a personal expense by ID and saves to deleted history
 */
export async function deletePersonalExpense(expenseId: string, userId: string): Promise<void> {
  // Always update personal cache & store into deleted list
  const local = getLocalExpenses(userId);
  const toDelete = local.find((e) => e.id === expenseId);
  if (toDelete) {
    const deletedList = getLocalDeletedExpenses(userId);
    if (!deletedList.some((d) => d.id === expenseId)) {
      saveLocalDeletedExpenses(userId, [toDelete, ...deletedList]);
    }
  }

  const updated = local.filter((e) => e.id !== expenseId);
  saveLocalExpenses(userId, updated);

  try {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) {
      console.warn('Supabase delete expense error:', error);
    }
  } catch (err) {
    console.warn('Supabase delete expense note:', err);
  }

  // Also clean up all cached family expenses in localStorage
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
    }
  } catch (e) {
    console.warn('Error cleaning family cache on delete:', e);
  }
}

/**
 * Restores a deleted personal expense by ID
 */
export async function restorePersonalExpense(expenseId: string, userId: string): Promise<Expense | null> {
  const deletedList = getLocalDeletedExpenses(userId);
  const toRestore = deletedList.find((e) => e.id === expenseId);
  if (!toRestore) return null;

  // Remove from deleted list
  saveLocalDeletedExpenses(userId, deletedList.filter((e) => e.id !== expenseId));

  // Add back to active expenses
  const local = getLocalExpenses(userId);
  saveLocalExpenses(userId, [toRestore, ...local]);

  try {
    await supabase.from('expenses').upsert({
      id: toRestore.id,
      user_id: toRestore.userId,
      family_id: toRestore.familyId || null,
      amount: toRestore.amount,
      category: toRestore.category,
      store_id: toRestore.storeId,
      date: toRestore.date,
      title: toRestore.title || 'Покупка продуктов',
      created_at: toRestore.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Supabase restore expense note:', err);
  }

  return toRestore;
}

/**
 * Synchronous local retrieval of family expenses from cache
 */
export function getLocalFamilyExpenses(familyId: string, memberIds: string[] = []): Expense[] {
  const result: Expense[] = [];
  const seenIds = new Set<string>();

  // Check cached family-specific expenses
  try {
    const raw = localStorage.getItem(`${LOCAL_EXPENSES_KEY}_family_${familyId}`);
    if (raw) {
      const list = JSON.parse(raw) as Expense[];
      list.forEach(e => {
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
    memList.forEach(e => {
      if (!seenIds.has(e.id)) {
        seenIds.add(e.id);
        result.push(e);
      }
    });
  });

  return result.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Fetches all family expenses from Supabase with fallback to member local caches
 */
export async function fetchFamilyExpenses(familyId: string, memberIds: string[] = []): Promise<Expense[]> {
  try {
    let query = supabase.from('expenses').select('*');
    if (memberIds.length > 0) {
      query = query.or(`family_id.eq.${familyId},user_id.in.(${memberIds.join(',')})`);
    } else {
      query = query.eq('family_id', familyId);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (!error && data) {
      const supabaseResults: Expense[] = data.map((row) => ({
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
      }));

      try {
        localStorage.setItem(`${LOCAL_EXPENSES_KEY}_family_${familyId}`, JSON.stringify(supabaseResults));
      } catch {}
      return supabaseResults;
    }
  } catch (err) {
    console.warn('Supabase fetch family expenses note (using local cache):', err);
  }

  // Fallback to local items only on network error
  return getLocalFamilyExpenses(familyId, memberIds);
}
