import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Expense, CreateExpenseInput } from '../model/types';
import { 
  fetchPersonalExpenses, 
  createPersonalExpense, 
  deletePersonalExpense,
  restorePersonalExpense,
  getLocalExpenses,
  fetchFamilyExpenses,
  getLocalFamilyExpenses
} from './expenseService';

export const expenseQueryKeys = {
  all: ['expenses'] as const,
  personal: (userId?: string) => [...expenseQueryKeys.all, 'personal', userId] as const,
  family: (familyId?: string) => [...expenseQueryKeys.all, 'family', familyId] as const,
};

/**
 * Hook to query personal expenses with synchronous local initialData to eliminate layout jumps
 */
export function usePersonalExpensesQuery(userId?: string) {
  return useQuery({
    queryKey: expenseQueryKeys.personal(userId),
    queryFn: async () => {
      if (!userId) return [];
      return fetchPersonalExpenses(userId);
    },
    initialData: () => {
      if (!userId) return [];
      return getLocalExpenses(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to query family expenses with synchronous initialData from member caches
 */
export function useFamilyExpensesQuery(familyId?: string | null, memberIds: string[] = []) {
  return useQuery({
    queryKey: expenseQueryKeys.family(familyId || undefined),
    queryFn: async () => {
      if (!familyId) return [];
      return fetchFamilyExpenses(familyId, memberIds);
    },
    initialData: () => {
      if (!familyId) return [];
      return getLocalFamilyExpenses(familyId, memberIds);
    },
    enabled: !!familyId,
    staleTime: 1000 * 60 * 5,
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

