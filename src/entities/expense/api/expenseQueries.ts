import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Expense, CreateExpenseInput } from '../model/types';
import { 
  fetchPersonalExpenses, 
  fetchPersonalDeletedExpenses,
  createPersonalExpense, 
  deletePersonalExpense,
  restorePersonalExpense,
  getLocalExpenses,
  fetchFamilyExpenses,
  fetchFamilyDeletedExpenses,
  getLocalFamilyExpenses,
  getLocalDeletedExpenses,
  getLocalFamilyDeletedExpenses
} from './expenseService';
import { supabase } from '../../../shared/api';

export const expenseQueryKeys = {
  all: ['expenses'] as const,
  personal: (userId?: string) => [...expenseQueryKeys.all, 'personal', userId] as const,
  personalDeleted: (userId?: string) => [...expenseQueryKeys.all, 'personal_deleted', userId] as const,
  family: (familyId?: string) => [...expenseQueryKeys.all, 'family', familyId] as const,
  familyDeleted: (familyId?: string) => [...expenseQueryKeys.all, 'family_deleted', familyId] as const,
};

/**
 * Hook to query active personal expenses.
 * Always triggers immediate fetch on mount to guarantee fresh Supabase data and show skeleton loader.
 */
export function usePersonalExpensesQuery(userId?: string) {
  return useQuery({
    queryKey: expenseQueryKeys.personal(userId),
    queryFn: async () => {
      if (!userId) return [];
      return fetchPersonalExpenses(userId);
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to query personal deleted expenses
 */
export function usePersonalDeletedExpensesQuery(userId?: string) {
  return useQuery({
    queryKey: expenseQueryKeys.personalDeleted(userId),
    queryFn: async () => {
      if (!userId) return [];
      return fetchPersonalDeletedExpenses(userId);
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to query active family expenses.
 * Always triggers immediate fetch on mount to guarantee fresh Supabase data and show skeleton loader.
 */
export function useFamilyExpensesQuery(familyId?: string | null, memberIds: string[] = []) {
  return useQuery({
    queryKey: expenseQueryKeys.family(familyId || undefined),
    queryFn: async () => {
      if (!familyId) return [];
      return fetchFamilyExpenses(familyId, memberIds);
    },
    enabled: !!familyId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to query family deleted expenses (all deleted expenses by family members)
 */
export function useFamilyDeletedExpensesQuery(familyId?: string | null, memberIds: string[] = []) {
  return useQuery({
    queryKey: expenseQueryKeys.familyDeleted(familyId || undefined),
    queryFn: async () => {
      if (!familyId) return [];
      return fetchFamilyDeletedExpenses(familyId, memberIds);
    },
    enabled: !!familyId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to create a new expense with automatic cache invalidation
 */
export function useCreateExpenseMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput & { familyId?: string | null }) => {
      return createPersonalExpense({
        userId,
        amount: input.amount,
        category: input.category,
        storeId: input.storeId,
        date: input.date,
        title: input.title,
        familyId: input.familyId,
      });
    },
    onSuccess: (newExpense) => {
      queryClient.setQueriesData<Expense[]>({ queryKey: ['expenses', 'personal'] }, (old) => {
        const list = Array.isArray(old) ? old : [];
        return [newExpense, ...list.filter(e => e.id !== newExpense.id)];
      });
      queryClient.setQueriesData<Expense[]>({ queryKey: ['expenses', 'family'] }, (old) => {
        const list = Array.isArray(old) ? old : [];
        return [newExpense, ...list.filter(e => e.id !== newExpense.id)];
      });
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}

/**
 * Hook to delete an expense with instant optimistic cache updates
 */
export function useDeleteExpenseMutation(userId: string, familyId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId }: { expenseId: string }) => {
      return deletePersonalExpense(expenseId, userId);
    },
    onMutate: async ({ expenseId }) => {
      await queryClient.cancelQueries({ queryKey: expenseQueryKeys.all });

      const previousData = queryClient.getQueriesData({ queryKey: expenseQueryKeys.all });

      let foundItem: Expense | undefined;
      for (const [, data] of previousData) {
        if (Array.isArray(data)) {
          const item = data.find(e => e && e.id === expenseId);
          if (item) {
            foundItem = item;
            break;
          }
        }
      }

      const nowIso = new Date().toISOString();
      const deletedItem: Expense = foundItem ? {
        ...foundItem,
        deletedAt: nowIso,
        deletedBy: userId,
      } : {
        id: expenseId,
        userId,
        familyId: familyId || null,
        amount: 0,
        category: 'other',
        storeId: '',
        date: new Date().toISOString().split('T')[0],
        createdAt: nowIso,
        deletedAt: nowIso,
        deletedBy: userId,
      };

      // 1. Immediately remove from active expense queries
      queryClient.setQueriesData<Expense[]>({ queryKey: ['expenses', 'personal'] }, (old) => {
        return Array.isArray(old) ? old.filter(e => e.id !== expenseId) : [];
      });
      queryClient.setQueriesData<Expense[]>({ queryKey: ['expenses', 'family'] }, (old) => {
        return Array.isArray(old) ? old.filter(e => e.id !== expenseId) : [];
      });

      // 2. Immediately add to deleted expense queries
      queryClient.setQueriesData<Expense[]>({ queryKey: ['expenses', 'personal_deleted'] }, (old) => {
        const list = Array.isArray(old) ? old : [];
        if (deletedItem.userId === userId) {
          return [deletedItem, ...list.filter(e => e.id !== expenseId)];
        }
        return list;
      });
      queryClient.setQueriesData<Expense[]>({ queryKey: ['expenses', 'family_deleted'] }, (old) => {
        const list = Array.isArray(old) ? old : [];
        return [deletedItem, ...list.filter(e => e.id !== expenseId)];
      });

      // Direct exact key updates to guarantee active hooks receive updates synchronously
      if (userId) {
        queryClient.setQueryData<Expense[]>(expenseQueryKeys.personal(userId), (old) => {
          return Array.isArray(old) ? old.filter(e => e.id !== expenseId) : [];
        });
        queryClient.setQueryData<Expense[]>(expenseQueryKeys.personalDeleted(userId), (old) => {
          const list = Array.isArray(old) ? old : [];
          return [deletedItem, ...list.filter(e => e.id !== expenseId)];
        });
      }
      if (familyId) {
        queryClient.setQueryData<Expense[]>(expenseQueryKeys.family(familyId), (old) => {
          return Array.isArray(old) ? old.filter(e => e.id !== expenseId) : [];
        });
        queryClient.setQueryData<Expense[]>(expenseQueryKeys.familyDeleted(familyId), (old) => {
          const list = Array.isArray(old) ? old : [];
          return [deletedItem, ...list.filter(e => e.id !== expenseId)];
        });
      }

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}

/**
 * Hook to restore an expense with instant optimistic cache updates
 */
export function useRestoreExpenseMutation(userId: string, familyId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId }: { expenseId: string }) => {
      return restorePersonalExpense(expenseId, userId);
    },
    onMutate: async ({ expenseId }) => {
      await queryClient.cancelQueries({ queryKey: expenseQueryKeys.all });

      const previousData = queryClient.getQueriesData({ queryKey: expenseQueryKeys.all });

      let foundDeletedItem: Expense | undefined;
      for (const [, data] of previousData) {
        if (Array.isArray(data)) {
          const item = data.find(e => e && e.id === expenseId);
          if (item) {
            foundDeletedItem = item;
            break;
          }
        }
      }

      const nowIso = new Date().toISOString();
      const restoredItem: Expense = foundDeletedItem ? {
        ...foundDeletedItem,
        deletedAt: null,
        deletedBy: null,
      } : {
        id: expenseId,
        userId,
        familyId: familyId || null,
        amount: 0,
        category: 'other',
        storeId: '',
        date: new Date().toISOString().split('T')[0],
        createdAt: nowIso,
        deletedAt: null,
        deletedBy: null,
      };

      // 1. Immediately remove from deleted expense queries
      queryClient.setQueriesData<Expense[]>({ queryKey: ['expenses', 'personal_deleted'] }, (old) => {
        return Array.isArray(old) ? old.filter(e => e.id !== expenseId) : [];
      });
      queryClient.setQueriesData<Expense[]>({ queryKey: ['expenses', 'family_deleted'] }, (old) => {
        return Array.isArray(old) ? old.filter(e => e.id !== expenseId) : [];
      });

      // 2. Immediately add back to active expense queries
      queryClient.setQueriesData<Expense[]>({ queryKey: ['expenses', 'personal'] }, (old) => {
        const list = Array.isArray(old) ? old : [];
        if (restoredItem.userId === userId) {
          return [restoredItem, ...list.filter(e => e.id !== expenseId)].sort((a, b) => b.date.localeCompare(a.date));
        }
        return list;
      });
      queryClient.setQueriesData<Expense[]>({ queryKey: ['expenses', 'family'] }, (old) => {
        const list = Array.isArray(old) ? old : [];
        return [restoredItem, ...list.filter(e => e.id !== expenseId)].sort((a, b) => b.date.localeCompare(a.date));
      });

      // Direct exact key updates
      if (userId) {
        queryClient.setQueryData<Expense[]>(expenseQueryKeys.personalDeleted(userId), (old) => {
          return Array.isArray(old) ? old.filter(e => e.id !== expenseId) : [];
        });
        queryClient.setQueryData<Expense[]>(expenseQueryKeys.personal(userId), (old) => {
          const list = Array.isArray(old) ? old : [];
          if (restoredItem.userId === userId) {
            return [restoredItem, ...list.filter(e => e.id !== expenseId)].sort((a, b) => b.date.localeCompare(a.date));
          }
          return list;
        });
      }
      if (familyId) {
        queryClient.setQueryData<Expense[]>(expenseQueryKeys.familyDeleted(familyId), (old) => {
          return Array.isArray(old) ? old.filter(e => e.id !== expenseId) : [];
        });
        queryClient.setQueryData<Expense[]>(expenseQueryKeys.family(familyId), (old) => {
          const list = Array.isArray(old) ? old : [];
          return [restoredItem, ...list.filter(e => e.id !== expenseId)].sort((a, b) => b.date.localeCompare(a.date));
        });
      }

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}

/**
 * Supabase Realtime hook: instantly synchronizes expenses across active users and browser tabs
 */
export function useExpensesRealtimeSubscription(familyId?: string | null, userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelName = `realtime-expenses-${familyId || userId || 'global'}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, userId, queryClient]);
}
