import { z } from 'zod';

export const notificationTypeSchema = z.enum(['family_invite', 'budget_alert', 'system', 'saving_tip']);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  createdAt: z.string(),
  isRead: z.boolean().default(false),
  actionPayload: z
    .object({
      inviteId: z.string().optional(),
      familyId: z.string().optional(),
      inviterName: z.string().optional(),
    })
    .optional(),
});
export type AppNotification = z.infer<typeof notificationSchema>;
