import { z } from 'zod';
import { budgetGoalTypeSchema } from '../../user/model/schema';

export const familyMemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().default('🥑'),
  avatarColor: z.string().default('from-emerald-400 to-teal-500'),
  joinedAt: z.string(),
  monthlySpent: z.number().nonnegative().default(0),
  monthlyBudget: z.number().nonnegative().optional(),
});
export type FamilyMember = z.infer<typeof familyMemberSchema>;

export const familySchema = z.object({
  id: z.string(),
  memberIds: z.array(z.string()).default([]),
  members: z.array(familyMemberSchema).default([]),
  monthlyBudget: z.number().nonnegative().default(60000),
  dietaryPreferences: z.array(z.string()).default([]),
  budgetGoals: z.array(budgetGoalTypeSchema).default(['save_money', 'smart_planning']),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});
export type Family = z.infer<typeof familySchema>;

export const addFamilyMemberInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Введите корректный email (например, name@example.com)'),
});
export type AddFamilyMemberInput = z.infer<typeof addFamilyMemberInputSchema>;

export const removeFamilyMemberInputSchema = z.object({
  memberUserId: z.string(),
});
export type RemoveFamilyMemberInput = z.infer<typeof removeFamilyMemberInputSchema>;
