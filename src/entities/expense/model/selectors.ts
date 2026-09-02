import { 
  Expense, 
  DateFilterState, 
  EXPENSE_CATEGORIES, 
  CategoryBreakdownItem, 
  DailyBarItem, 
  StoreRankItem, 
  PersonalAnalyticsKPIs 
} from './types';
import { POPULAR_STORES } from '../../store';

/**
 * Format Date to YYYY-MM-DD
 */
export function formatDateIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format ISO date string (YYYY-MM-DD) to Russian day and month name (e.g. "1 сентября")
 */
export function formatDayMonth(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(day) || isNaN(month) || month < 1 || month > 12) return dateStr;

  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];

  return `${day} ${months[month - 1]}`;
}

/**
 * Format ISO date string (YYYY-MM-DD) to compact date and weekday (e.g. "1 сен, Вт")
 */
export function formatDayWeekday(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const d = new Date(year, month - 1, day);
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const shortMonths = [
    'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
  ];

  return `${day} ${shortMonths[month - 1]}, ${weekdays[d.getDay()]}`;
}

/**
 * Format ISO date string (YYYY-MM-DD) to compact short date (e.g. "1 сен")
 */
export function formatShortDay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(day) || isNaN(month) || month < 1 || month > 12) return dateStr;

  const shortMonths = [
    'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
  ];

  return `${day} ${shortMonths[month - 1]}`;
}


/**
 * Filter expenses based on the selected DateFilterState
 */
export function filterExpensesByDate(
  expenses: Expense[], 
  filter: DateFilterState
): { filtered: Expense[]; title: string; daysInRange: number } {
  const now = new Date();
  const todayStr = formatDateIso(now);
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatDateIso(yesterday);

  switch (filter.period) {
    case 'today': {
      const items = expenses.filter(e => e.date === todayStr);
      return { filtered: items, title: 'Сегодня', daysInRange: 1 };
    }

    case 'yesterday': {
      const items = expenses.filter(e => e.date === yesterdayStr);
      return { filtered: items, title: 'Вчера', daysInRange: 1 };
    }

    case 'custom_day': {
      const targetDate = filter.customDate || todayStr;
      const items = expenses.filter(e => e.date === targetDate);
      const [y, m, d] = targetDate.split('-');
      const formatted = `${d}.${m}.${y}`;
      return { filtered: items, title: formatted, daysInRange: 1 };
    }

    case '7days': {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      const sevenDaysAgoStr = formatDateIso(sevenDaysAgo);
      const items = expenses.filter(e => e.date >= sevenDaysAgoStr && e.date <= todayStr);
      return { filtered: items, title: 'Последние 7 дней', daysInRange: 7 };
    }

    case 'month':
    default: {
      const currentYearMonth = todayStr.substring(0, 7); // "YYYY-MM"
      const items = expenses.filter(e => e.date.startsWith(currentYearMonth));
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      const title = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      return { filtered: items, title, daysInRange: daysInMonth };
    }
  }
}

/**
 * Calculate Personal KPIs (Total spent, Average per day, % of budget, Remaining)
 */
export function calculatePersonalKPIs(
  filteredExpenses: Expense[],
  monthlyBudget: number,
  daysInRange: number,
  periodTitle: string
): PersonalAnalyticsKPIs {
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const uniqueDays = new Set(filteredExpenses.map(e => e.date)).size;
  const divisor = Math.max(1, uniqueDays || daysInRange);
  const averagePerDay = Math.round(totalSpent / divisor);
  
  const percentOfBudget = Math.min(100, Math.round((totalSpent / monthlyBudget) * 100));
  const remainingBudget = Math.max(0, monthlyBudget - totalSpent);

  return {
    totalSpent,
    periodLabel: periodTitle,
    averagePerDay,
    budgetLimit: monthlyBudget,
    remainingBudget,
    percentOfBudget,
    daysWithExpensesCount: uniqueDays,
  };
}

/**
 * Calculate Category breakdown with percentages for SVG Donut Chart
 */
export function calculateCategoryBreakdown(expenses: Expense[]): CategoryBreakdownItem[] {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  if (total === 0) return [];

  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const exp of expenses) {
    const prev = categoryMap.get(exp.category) || { amount: 0, count: 0 };
    categoryMap.set(exp.category, {
      amount: prev.amount + exp.amount,
      count: prev.count + 1,
    });
  }

  const items: CategoryBreakdownItem[] = [];

  for (const cat of EXPENSE_CATEGORIES) {
    const data = categoryMap.get(cat.id);
    if (data && data.amount > 0) {
      const percentage = Math.round((data.amount / total) * 100);
      items.push({
        category: cat,
        amount: data.amount,
        percentage,
        count: data.count,
      });
    }
  }

  // Sort descending by amount
  return items.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate Daily Bar distribution for SVG Bar Chart with dailyLimit comparison
 */
export function calculateDailyBarDistribution(
  expenses: Expense[],
  filter: DateFilterState,
  dailyLimit: number
): DailyBarItem[] {
  const now = new Date();
  const todayStr = formatDateIso(now);

  const dayAmounts = new Map<string, number>();
  for (const e of expenses) {
    dayAmounts.set(e.date, (dayAmounts.get(e.date) || 0) + e.amount);
  }

  const result: DailyBarItem[] = [];

  // If 7days or month: build continuous timeline
  if (filter.period === '7days') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = formatDateIso(d);
      const amount = dayAmounts.get(iso) || 0;
      const dayLabel = formatDayWeekday(iso);

      result.push({
        date: iso,
        dayLabel,
        amount,
        isOverLimit: amount > dailyLimit,
        isCurrentDay: iso === todayStr,
      });
    }
    return result;
  }

  if (filter.period === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const iso = formatDateIso(d);
      const amount = dayAmounts.get(iso) || 0;
      const dayLabel = formatDayWeekday(iso);

      result.push({
        date: iso,
        dayLabel,
        amount,
        isOverLimit: amount > dailyLimit,
        isCurrentDay: iso === todayStr,
      });
    }
    return result;
  }

  // Single day view ('today', 'yesterday', 'custom_day'):
  const targetDate = filter.period === 'today' 
    ? todayStr 
    : filter.period === 'yesterday'
    ? formatDateIso(new Date(now.setDate(now.getDate() - 1)))
    : filter.customDate || todayStr;

  const amount = dayAmounts.get(targetDate) || 0;
  result.push({
    date: targetDate,
    dayLabel: formatDayWeekday(targetDate),
    amount,
    isOverLimit: amount > dailyLimit,
    isCurrentDay: targetDate === todayStr,
  });

  return result;
}

/**
 * Calculate Store Ranking
 */
export function calculateStoreBreakdown(expenses: Expense[]): StoreRankItem[] {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  if (total === 0) return [];

  const storeMap = new Map<string, { amount: number; count: number }>();

  for (const exp of expenses) {
    const prev = storeMap.get(exp.storeId) || { amount: 0, count: 0 };
    storeMap.set(exp.storeId, {
      amount: prev.amount + exp.amount,
      count: prev.count + 1,
    });
  }

  const items: StoreRankItem[] = [];

  storeMap.forEach((val, storeId) => {
    const foundStore = POPULAR_STORES.find(s => s.id === storeId);
    const name = foundStore ? foundStore.name : 'Прочие покупки';
    const color = foundStore ? foundStore.color : '#64748B';
    const percentage = Math.round((val.amount / total) * 100);

    items.push({
      storeId,
      name,
      color,
      amount: val.amount,
      percentage,
      count: val.count,
    });
  });

  return items.sort((a, b) => b.amount - a.amount);
}
