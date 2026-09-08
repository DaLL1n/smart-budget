import { z } from 'zod';

export const defaultExpenseCategorySchema = z.enum([
  'vegetables_fruits',
  'dairy_cheese',
  'meat_fish',
  'grocery_bread',
  'drinks_snacks',
  'ready_food',
  'other',
]);
export type DefaultExpenseCategory = z.infer<typeof defaultExpenseCategorySchema>;

export const expenseCategorySchema = z.string().min(1);
export type ExpenseCategory = string;

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
  deletedAt: z.string().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
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
  id: string;
  label: string;
  icon: string;
  color: string;
  badgeBg: string;
  isCustom?: boolean;
}

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  { id: 'vegetables_fruits', label: 'Овощи и фрукты', icon: '🥦', color: '#10B981', badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'dairy_cheese', label: 'Молочка и сыры', icon: '🧀', color: '#38BDF8', badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  { id: 'meat_fish', label: 'Мясо и рыба', icon: '🥩', color: '#F43F5E', badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  { id: 'grocery_bread', label: 'Бакалея и хлеб', icon: '🍞', color: '#F59E0B', badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { id: 'drinks_snacks', label: 'Напитки и снеки', icon: '🧃', color: '#A855F7', badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { id: 'ready_food', label: 'Готовая еда', icon: '🍱', color: '#EC4899', badgeBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
  { id: 'other', label: 'Прочее', icon: '🛒', color: '#64748B', badgeBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
];

export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;

const HARMONIOUS_BADGES = [
  { hex: '#6366F1', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  { hex: '#14B8A6', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  { hex: '#F97316', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  { hex: '#8B5CF6', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  { hex: '#84CC16', badge: 'bg-lime-500/15 text-lime-300 border-lime-500/30' },
  { hex: '#D946EF', badge: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' },
  { hex: '#06B6D4', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  { hex: '#EAB308', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
];

export function buildCategoryBadge(color?: string, id?: string): { color: string; badgeBg: string } {
  if (color) {
    const found = HARMONIOUS_BADGES.find(c => c.hex.toLowerCase() === color.toLowerCase());
    if (found) return { color: found.hex, badgeBg: found.badge };
  }
  let hash = 0;
  const str = id || 'cat';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const item = HARMONIOUS_BADGES[Math.abs(hash) % HARMONIOUS_BADGES.length];
  return { color: color || item.hex, badgeBg: item.badge };
}

export function getCategoryConfig(id: string, customCategories?: ExpenseCategoryConfig[]): ExpenseCategoryConfig {
  if (customCategories && customCategories.length > 0) {
    const custom = customCategories.find(c => c.id === id);
    if (custom) return custom;
  }
  const standard = DEFAULT_EXPENSE_CATEGORIES.find(c => c.id === id);
  if (standard) return standard;

  const style = buildCategoryBadge(undefined, id);
  return {
    id,
    label: id.replace(/_/g, ' '),
    icon: '🏷️',
    color: style.color,
    badgeBg: style.badgeBg,
    isCustom: true,
  };
}

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
