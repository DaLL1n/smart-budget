import { z } from 'zod';

export const expenseCategorySchema = z.enum([
  'vegetables_fruits',
  'dairy_cheese',
  'meat_fish',
  'grocery_bread',
  'drinks_snacks',
  'ready_food',
  'other',
]);
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

export const receiptItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  count: z.number().positive().default(1),
});
export type ReceiptItem = z.infer<typeof receiptItemSchema>;

export const expenseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  familyId: z.string().nullable().optional(),
  amount: z.number().nonnegative(),
  category: expenseCategorySchema,
  storeId: z.string(),
  date: z.string(), // YYYY-MM-DD
  title: z.string().optional(),
  receiptItems: z.array(receiptItemSchema).optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
});
export type Expense = z.infer<typeof expenseSchema>;

export const createExpenseInputSchema = z.object({
  amount: z.number().positive('Сумма должна быть больше нуля'),
  category: expenseCategorySchema,
  storeId: z.string().min(1, 'Выберите магазин'),
  date: z.string().min(1, 'Укажите дату'),
  title: z.string().optional(),
  receiptItems: z.array(receiptItemSchema).optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

export const datePeriodSchema = z.enum(['today', 'yesterday', '7days', 'month', 'custom_day']);
export type DatePeriod = z.infer<typeof datePeriodSchema>;

export const dateFilterSchema = z.object({
  period: datePeriodSchema,
  customDate: z.string().optional(),
});
export type DateFilterState = z.infer<typeof dateFilterSchema>;

export interface ExpenseCategoryConfig {
  id: ExpenseCategory;
  label: string;
  icon: string;
  color: string;
  badgeBg: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  { id: 'vegetables_fruits', label: 'Овощи и фрукты', icon: '🥦', color: '#10B981', badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'dairy_cheese', label: 'Молочка и сыры', icon: '🧀', color: '#38BDF8', badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  { id: 'meat_fish', label: 'Мясо и рыба', icon: '🥩', color: '#F43F5E', badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  { id: 'grocery_bread', label: 'Бакалея и хлеб', icon: '🍞', color: '#F59E0B', badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { id: 'drinks_snacks', label: 'Напитки и снеки', icon: '🧃', color: '#A855F7', badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { id: 'ready_food', label: 'Готовая еда', icon: '🍱', color: '#EC4899', badgeBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
  { id: 'other', label: 'Прочее', icon: '🛒', color: '#64748B', badgeBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
];

export interface CategoryBreakdownItem {
  category: ExpenseCategoryConfig;
  amount: number;
  percentage: number;
  count: number;
}

export interface DailyBarItem {
  date: string;       // YYYY-MM-DD
  dayLabel: string;   // e.g. "1 сен, Вт"
  amount: number;
  isOverLimit: boolean;
  isCurrentDay: boolean;
}

export interface StoreRankItem {
  storeId: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface PersonalAnalyticsKPIs {
  totalSpent: number;
  periodLabel: string;
  averagePerDay: number;
  budgetLimit: number;
  remainingBudget: number;
  percentOfBudget: number;
  daysWithExpensesCount: number;
}
