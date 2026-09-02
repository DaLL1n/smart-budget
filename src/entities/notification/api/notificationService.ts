import { User } from '../../user';
import { AppNotification } from '../model/types';

/**
 * Aggregates smart notifications for a user:
 * 1. Budget threshold alerts
 * 2. AI smart saving tips
 */
export async function fetchUserNotifications(user: User): Promise<AppNotification[]> {
  const notifications: AppNotification[] = [];

  // 1. Budget Alert if spent > alert threshold
  const spentSoFar = 12450;
  const monthly = user.profile?.monthlyBudget || 35000;
  const threshold = user.profile?.budgetAlertThreshold || 80;
  const percentUsed = Math.round((spentSoFar / monthly) * 100);

  if (percentUsed >= threshold && user.profile?.notificationSettings?.budgetAlerts) {
    notifications.push({
      id: 'notif_budget_alert_1',
      type: 'budget_alert',
      title: 'Внимание: Расход бюджета',
      message: `Израсходовано ${percentUsed}% от месячного продуктового лимита.`,
      createdAt: new Date().toISOString(),
      isRead: false,
    });
  }

  // 2. AI Saving Tip (if enabled)
  if (user.profile?.notificationSettings?.savingTips) {
    notifications.push({
      id: 'notif_tip_1',
      type: 'saving_tip',
      title: 'Умный совет по экономии',
      message: 'Сезонные кабачки и яблоки в супермаркетах у дома сейчас дешевле на 25%.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isRead: true,
    });
  }

  return notifications;
}
