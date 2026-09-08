import { z } from 'zod';

export const currencyCodeSchema = z.enum(['RUB', 'USD', 'EUR', 'KZT', 'BYN', 'UAH']).default('RUB');
export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

export const budgetGoalTypeSchema = z.enum([
  'save_money',
  'eat_healthier',
  'healthy_eating',
  'strict_budget',
  'strict_control',
  'smart_planning',
  'reduce_waste',
  'variety_taste'
]);
export type BudgetGoalType = z.infer<typeof budgetGoalTypeSchema>;

export const userNotificationSettingsSchema = z.object({
  budgetAlerts: z.boolean().default(true),
  weeklyDigest: z.boolean().default(true),
  savingTips: z.boolean().default(false),
});
export type UserNotificationSettings = z.infer<typeof userNotificationSettingsSchema>;

export const customCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string().default('🏷️'),
  color: z.string().default('#94A3B8'),
  badgeBg: z.string().default('bg-slate-500/15 text-slate-300 border-slate-500/30'),
  isCustom: z.boolean().default(true),
});
export type CustomCategory = z.infer<typeof customCategorySchema>;

export const userProfileSchema = z.object({
  currency: currencyCodeSchema,
  monthlyBudget: z.number().nonnegative().default(35000),
  weeklyTarget: z.number().nonnegative().default(8750),
  dailyTarget: z.number().nonnegative().default(1167),
  adultsCount: z.number().int().min(1).default(1),
  childrenCount: z.number().int().min(0).default(0),
  petsCount: z.number().int().min(0).default(0),
  dietaryPreferences: z.array(z.string()).default([]),
  favoriteStores: z.array(z.string()).default(['kuulclever', 'pyaterochka', 'perekrestok']),
  budgetGoal: budgetGoalTypeSchema.optional(),
  budgetGoals: z.array(budgetGoalTypeSchema).default(['save_money', 'eat_healthier']),
  budgetAlertThreshold: z.number().min(50).max(100).default(85),
  notificationSettings: userNotificationSettingsSchema.default({
    budgetAlerts: true,
    weeklyDigest: true,
    savingTips: false,
  }),
  city: z.string().optional(),
  notes: z.string().optional(),
  custom_categories: z.array(customCategorySchema).default([]),
  familyId: z.string().nullable().optional(),
  familyRole: z.enum(['owner', 'member']).optional(),
  updatedAt: z.string().default(() => new Date().toISOString()),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  avatar: z.string().default('🥑'),
  avatarColor: z.string().default('from-emerald-400 to-teal-600'),
  role: z.string().optional(),
  familyId: z.string().nullable().optional(),
  familyRole: z.enum(['owner', 'member']).optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
  isOnboarded: z.boolean().default(false),
  profile: userProfileSchema,
});
export type User = z.infer<typeof userSchema>;

export const completeSetupParamsSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().optional(),
  avatarColor: z.string().optional(),
  city: z.string().optional(),
  profile: userProfileSchema.partial(),
});
export type CompleteSetupParams = z.infer<typeof completeSetupParamsSchema>;

export const updateUserSettingsParamsSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().optional(),
  avatarColor: z.string().optional(),
  city: z.string().optional(),
  monthlyBudget: z.number().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  favoriteStores: z.array(z.string()).optional(),
  budgetGoals: z.array(budgetGoalTypeSchema).optional(),
  profile: userProfileSchema.partial().optional(),
});
export type UpdateUserSettingsParams = z.infer<typeof updateUserSettingsParamsSchema>;

export interface DemoPreset {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  user: User;
}
