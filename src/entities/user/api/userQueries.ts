import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, UpdateUserSettingsParams } from '../model/types';

export const userQueryKeys = {
  all: ['user'] as const,
  current: (userId?: string) => [...userQueryKeys.all, 'current', userId] as const,
};

/**
 * Hook to manage user settings mutations
 */
export function useUpdateUserMutation(
  userId?: string, 
  updateFn?: (params: UpdateUserSettingsParams) => Promise<void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateUserSettingsParams) => {
      if (updateFn) {
        await updateFn(params);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
  });
}
