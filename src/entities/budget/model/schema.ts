import { z } from 'zod';
import { currencyCodeSchema, budgetGoalTypeSchema } from '../../user/model/schema';

export { currencyCodeSchema, budgetGoalTypeSchema };
export type { CurrencyCode, BudgetGoalType } from '../../user/model/schema';

export const dietaryPreferenceSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  description: z.string(),
});
export type DietaryPreference = z.infer<typeof dietaryPreferenceSchema>;

export const currencySchema = z.object({
  code: currencyCodeSchema,
  symbol: z.string(),
  label: z.string(),
  flag: z.string(),
  format: z.function(),
});
export type Currency = {
  code: string;
  symbol: string;
  label: string;
  flag: string;
  format: (val: number) => string;
};

export const budgetGoalOptionSchema = z.object({
  id: budgetGoalTypeSchema,
  title: z.string(),
  desc: z.string(),
  icon: z.string(),
  badge: z.string().optional(),
});
export type BudgetGoalOption = z.infer<typeof budgetGoalOptionSchema>;

export interface BudgetStatus {
  spent: number;
  totalBudget: number;
  remaining: number;
  spentPercentage: number;
  isExceeded: boolean;
  isWarning: boolean;
  statusColor: string;
  statusText: string;
}

export interface DayForecast {
  daysLeft: number;
  allowedPerDay: number;
  recommendedDailyBudget: number;
  isAheadOfSchedule: boolean;
}
