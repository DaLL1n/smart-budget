import { useQuery } from '@tanstack/react-query';
import { User } from '../../user';
import { fetchUserNotifications } from './notificationService';

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  user: (userId?: string) => [...notificationQueryKeys.all, userId] as const,
};

/**
 * Hook to fetch notifications for current user
 */
export function useNotificationsQuery(user: User | null) {
  return useQuery({
    queryKey: notificationQueryKeys.user(user?.id),
    queryFn: async () => {
      if (!user) return [];
      return fetchUserNotifications(user);
    },
    enabled: !!user,
    refetchInterval: 1000 * 30, // Poll every 30 seconds
  });
}
