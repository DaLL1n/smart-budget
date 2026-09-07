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
 * Uses local cache as initialData only if real cached items exist; otherwise isLoading is true to show skeleton.
 */
export function usePersonalExpensesQuery(userId?: string) {
  return useQuery({
    queryKey: expenseQueryKeys.personal(userId),
    queryFn: async () => {
      if (!userId) return [];
      return fetchPersonalExpenses(userId);
    },
    initialData: () => {
      if (!userId) return undefined;
      const local = getLocalExpenses(userId);
      return local.length > 0 ? local : undefined;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
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
    initialData: () => {
      if (!userId) return undefined;
      const local = getLocalDeletedExpenses(userId);
      return local.length > 0 ? local : undefined;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to query active family expenses.
 * Uses local cache as initialData only if real cached items exist; otherwise isLoading is true to show skeleton.
 */
export function useFamilyExpensesQuery(familyId?: string | null, memberIds: string[] = []) {
  return useQuery({
    queryKey: expenseQueryKeys.family(familyId || undefined),
    queryFn: async () => {
      if (!familyId) return [];
      return fetchFamilyExpenses(familyId, memberIds);
    },
    initialData: () => {
      if (!familyId) return undefined;
      const local = getLocalFamilyExpenses(familyId, memberIds);
      return local.length > 0 ? local : undefined;
    },
    enabled: !!familyId,
    staleTime: 1000 * 60 * 5,
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
    initialData: () => {
      if (!familyId) return undefined;
      const local = getLocalFamilyDeletedExpenses(familyId, memberIds);
      return local.length > 0 ? local : undefined;
    },
    enabled: !!familyId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to create a new expense with automatic cache invalidation
 */
export function useCreateExpenseMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseInput & { familyId?: string | null }) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}

/**
 * Hook to delete an expense with automatic cache invalidation
 */
export function useDeleteExpenseMutation(userId: string, familyId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId }: { expenseId: string }) => {
      return deletePersonalExpense(expenseId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}

/**
 * Hook to restore an expense with automatic cache invalidation
 */
export function useRestoreExpenseMutation(userId: string, familyId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId }: { expenseId: string }) => {
      return restorePersonalExpense(expenseId, userId);
    },
    onSuccess: () => {
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
