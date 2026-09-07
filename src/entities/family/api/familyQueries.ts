import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../../user';
import { BudgetGoalType } from '../../budget';
import { Family, AddFamilyMemberInput } from '../model/schema';
import { 
  fetchFamily, 
  addFamilyMember, 
  leaveFamily, 
  removeFamilyMember,
  updateFamilyPreferences 
} from './familyService';

export const familyKeys = {
  all: ['family'] as const,
  detail: (id?: string | null) => ['family', id] as const,
};

/**
 * Hook to query Family details
 */
export function useFamilyQuery(familyId?: string | null) {
  return useQuery({
    queryKey: familyKeys.detail(familyId),
    queryFn: () => (familyId ? fetchFamily(familyId) : Promise.resolve(null)),
    enabled: !!familyId,
    initialData: () => {
      if (!familyId) return undefined;
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          const cached = localStorage.getItem(`smart_budget_family_${familyId}`);
          if (cached) return JSON.parse(cached) as Family;
        }
      } catch {}
      return undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    networkMode: 'offlineFirst',
  });
}

/**
 * Mutation to directly add a family member by Email
 */
export function useAddFamilyMemberMutation(currentUser: User | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddFamilyMemberInput | string) => {
      if (!currentUser) throw new Error('Пользователь не авторизован');
      const email = typeof input === 'string' ? input : input.email;
      return await addFamilyMember(currentUser, email);
    },
    onSuccess: (updatedFamily) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.setQueryData(familyKeys.detail(updatedFamily.id), updatedFamily);
    },
    networkMode: 'offlineFirst',
  });
}

/**
 * Mutation for current user to leave the family
 */
export function useLeaveFamilyMutation(currentUser: User | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('Пользователь не авторизован');
      return await leaveFamily(currentUser);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: familyKeys.all });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.setQueryData(familyKeys.detail(currentUser?.familyId), null);
    },
    networkMode: 'offlineFirst',
  });
}

/**
 * Mutation to remove another member from the family
 */
export function useRemoveFamilyMemberMutation(currentUser: User | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberUserId: string) => {
      if (!currentUser) throw new Error('Пользователь не авторизован');
      return await removeFamilyMember(currentUser, memberUserId);
    },
    onSuccess: (updatedFamily) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      if (updatedFamily) {
        queryClient.setQueryData(familyKeys.detail(updatedFamily.id), updatedFamily);
      }
    },
    networkMode: 'offlineFirst',
  });
}

/**
 * Mutation to update family shared preferences (budget goals, dietary preferences, monthly budget)
 */
export function useUpdateFamilyPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      preferences,
    }: {
      familyId: string;
      preferences: {
        budgetGoals?: BudgetGoalType[];
        dietaryPreferences?: string[];
        monthlyBudget?: number;
      };
    }) => {
      return await updateFamilyPreferences(familyId, preferences);
    },
    onSuccess: (updatedFamily) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      if (updatedFamily) {
        queryClient.setQueryData(familyKeys.detail(updatedFamily.id), updatedFamily);
      }
    },
    networkMode: 'offlineFirst',
  });
}
