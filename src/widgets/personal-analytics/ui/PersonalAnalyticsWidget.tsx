import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  PieChart, 
  Calendar, 
  Trash2, 
  Loader2, 
  Coins, 
  Sparkles, 
  ArrowDownRight, 
  CheckCircle2, 
  Receipt 
} from 'lucide-react';
import { User } from '../../../entities/user';
import { 
  Expense, 
  DateFilterState, 
  EXPENSE_CATEGORIES, 
  filterExpensesByDate, 
  calculatePersonalKPIs, 
  calculateCategoryBreakdown, 
  calculateDailyBarDistribution, 
  calculateStoreBreakdown,
  formatDayMonth,
  formatShortDay,
  usePersonalExpensesQuery,
  useDeleteExpenseMutation
} from '../../../entities/expense';
import { POPULAR_STORES } from '../../../entities/store';
import { formatRubles } from '../../../entities/budget';
import { CategoryDonutChart } from './charts/CategoryDonutChart';
import { DailyBarChart } from './charts/DailyBarChart';

interface PersonalAnalyticsWidgetProps {
  currentUser: User;
  filter: DateFilterState;
}

function getExpensePeriodTitle(filter: DateFilterState): string {
  switch (filter.period) {
    case 'today':
      return 'Расход за сегодня';
    case 'yesterday':
      return 'Расход за вчера';
    case '7days':
      return 'Расход за 7 дней';
    case 'month':
      return 'Расход за месяц';
    case 'custom_day':
      return filter.customDate ? `Расход за ${formatShortDay(filter.customDate)}` : 'Расход за день';
    default:
      return 'Расход за период';
  }
}

export const PersonalAnalyticsWidget: React.FC<PersonalAnalyticsWidgetProps> = ({
  currentUser,
  filter,
}) => {
  const { data: expenses = [], isLoading } = usePersonalExpensesQuery(currentUser.id);
  const deleteMutation = useDeleteExpenseMutation(currentUser.id);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm('Удалить эту запись о расходе?')) return;
    setDeletingId(expenseId);
    try {
      await deleteMutation.mutateAsync({ expenseId });
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Загрузка личной аналитики...</span>
      </div>
    );
  }

  const monthlyBudget = currentUser.profile?.monthlyBudget || 35000;
  const dailyTarget = currentUser.profile?.dailyTarget || Math.round(monthlyBudget / 30);

  const { filtered, title: periodTitle, daysInRange } = filterExpensesByDate(expenses, filter);
  const kpis = calculatePersonalKPIs(filtered, monthlyBudget, daysInRange, periodTitle);
  const categoryBreakdown = calculateCategoryBreakdown(filtered);
  const dailyBars = calculateDailyBarDistribution(expenses, filter, dailyTarget);
  const storeRankings = calculateStoreBreakdown(filtered);
  const expensePeriodTitle = getExpensePeriodTitle(filter);

  return (
    <div className="w-full space-y-6">
      
      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Spent */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg flex flex-col justify-between space-y-2.5 min-w-0">
          <div className="text-xs text-slate-400 font-medium whitespace-nowrap truncate">
            {expensePeriodTitle}
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-white whitespace-nowrap truncate">
            {formatRubles(kpis.totalSpent)}
          </div>
        </div>

        {/* Average Per Day */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg flex flex-col justify-between space-y-2.5 min-w-0">
          <div className="text-xs text-slate-400 font-medium whitespace-nowrap">В среднем в день</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-emerald-400 whitespace-nowrap truncate">
            {formatRubles(kpis.averagePerDay)}
          </div>
        </div>

        {/* % of Monthly Limit */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg flex flex-col justify-between space-y-2.5 min-w-0">
          <div className="text-xs text-slate-400 font-medium whitespace-nowrap truncate">
            Доля от бюджета
          </div>
          <div className="flex items-center gap-2.5 w-full min-w-0">
            <div className="flex-1 h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden min-w-0">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  kpis.percentOfBudget > 85 ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(kpis.percentOfBudget, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-bold font-mono shrink-0 ${kpis.percentOfBudget > 85 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {kpis.percentOfBudget}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 whitespace-nowrap truncate">
            Лимит: <span className="text-slate-200 font-mono font-semibold">{formatRubles(monthlyBudget)}</span>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg flex flex-col justify-between space-y-2.5 min-w-0">
          <div className="text-xs text-slate-400 font-medium whitespace-nowrap">Остаток на месяц</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-white whitespace-nowrap truncate">
            {formatRubles(kpis.remainingBudget)}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">В норме</span>
          </div>
        </div>

      </div>

      {/* Main Visuals Grid: Daily Dynamics & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Dynamics Bar Chart */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-sm font-bold text-slate-100 whitespace-nowrap">Динамика расходов по дням</h3>
          </div>

          <DailyBarChart 
            items={dailyBars} 
            dailyLimit={dailyTarget} 
          />
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-slate-100">Категории продуктов</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Корзина</span>
          </div>

          <CategoryDonutChart 
            items={categoryBreakdown} 
            totalAmount={kpis.totalSpent} 
          />
        </div>

      </div>

      {/* Secondary Grid: Store Rankings & Transactions Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Store Rankings */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Рейтинг супермаркетов</h3>
          </div>

          {storeRankings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Нет данных о магазинах
            </div>
          ) : (
            <div className="space-y-3">
              {storeRankings.map((store) => (
                <div key={store.storeId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: store.color }} />
                      <span>{store.name}</span>
                    </span>
                    <span className="font-mono text-slate-200">
                      {formatRubles(store.amount)} ({store.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${store.percentage}%`, backgroundColor: store.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchases Feed */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">История расходов ({filtered.length})</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">за выбранный период</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              За выбранный период расходов не найдено. Добавьте покупку на дашборде!
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
              {filtered.map((exp) => {
                const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category) || EXPENSE_CATEGORIES[0];
                const store = POPULAR_STORES.find(s => s.id === exp.storeId);

                return (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{cat.icon}</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-100 truncate">{exp.title || cat.label}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{formatDayMonth(exp.date)}</span>
                          <span>•</span>
                          <span className="text-slate-300 font-medium">{store ? store.name : 'Супермаркет'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-slate-100 text-sm">
                        {formatRubles(exp.amount)}
                      </span>
                      <button
                        type="button"
                        disabled={deletingId === exp.id}
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Удалить запись"
                      >
                        {deletingId === exp.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
