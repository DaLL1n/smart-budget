import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  PieChart, 
  Calendar, 
  Coins, 
  Sparkles, 
  ArrowDownRight, 
  CheckCircle2, 
  Loader2
} from 'lucide-react';
import { User } from '../../../entities/user';
import { 
  Expense, 
  DateFilterState, 
  filterExpensesByDate, 
  calculatePersonalKPIs, 
  calculateCategoryBreakdown, 
  calculateDailyBarDistribution, 
  calculateStoreBreakdown,
  formatDateDdMmYy,
  usePersonalExpensesQuery,
  usePersonalDeletedExpensesQuery,
  useExpensesRealtimeSubscription,
  useDeleteExpenseMutation,
  useRestoreExpenseMutation
} from '../../../entities/expense';
import { formatRubles } from '../../../entities/budget';
import { CategoryDonutChart } from './charts/CategoryDonutChart';
import { DailyBarChart } from './charts/DailyBarChart';
import { PurchasesHistoryTable } from '../../../features/view-purchases-history';
import { AnalyticsDashboardSkeleton } from '../../../shared/ui';

interface PersonalAnalyticsWidgetProps {
  currentUser: User;
  filter: DateFilterState;
}

export const PersonalAnalyticsWidget: React.FC<PersonalAnalyticsWidgetProps> = ({
  currentUser,
  filter,
}) => {
  const { data: expenses = [], isLoading, isFetching } = usePersonalExpensesQuery(currentUser.id);
  const { data: personalDeletedExpenses = [] } = usePersonalDeletedExpensesQuery(currentUser.id);

  // Subscribe to realtime changes in Supabase expenses table
  useExpensesRealtimeSubscription(currentUser.familyId || null, currentUser.id);

  const deleteMutation = useDeleteExpenseMutation(currentUser.id, currentUser.familyId);
  const restoreMutation = useRestoreExpenseMutation(currentUser.id, currentUser.familyId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [mobileChartTab, setMobileChartTab] = useState<'categories' | 'daily'>('categories');

  useEffect(() => {
    setSelectedDayDate(null);
  }, [filter]);

  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId);
    try {
      await deleteMutation.mutateAsync({ expenseId });
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (expenseId: string) => {
    try {
      await restoreMutation.mutateAsync({ expenseId });
    } catch (err) {
      console.error('Failed to restore expense:', err);
    }
  };

  const monthlyBudget = currentUser.profile?.monthlyBudget || 35000;
  const dailyTarget = currentUser.profile?.dailyTarget || Math.round(monthlyBudget / 30);

  const { filtered, title: periodTitle, daysInRange } = useMemo(() => {
    return filterExpensesByDate(expenses, filter);
  }, [expenses, filter]);

  // Data for the Purchase History Table and Category/Store breakdowns:
  // Synchronized with both date range filter and interactive chart date selection
  const currentViewExpenses = useMemo(() => {
    if (selectedDayDate) {
      return filtered.filter(e => e.date === selectedDayDate);
    }
    return filtered;
  }, [filtered, selectedDayDate]);

  const currentViewSpent = useMemo(() => {
    return currentViewExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [currentViewExpenses]);

  const kpis = useMemo(() => {
    return calculatePersonalKPIs(filtered, monthlyBudget, daysInRange, periodTitle);
  }, [filtered, monthlyBudget, daysInRange, periodTitle]);

  const isOverBudget = kpis.totalSpent > monthlyBudget;

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(currentViewExpenses, currentUser.profile?.custom_categories);
  }, [currentViewExpenses, currentUser.profile?.custom_categories]);

  const dailyBars = useMemo(() => {
    return calculateDailyBarDistribution(expenses, filter, dailyTarget);
  }, [expenses, filter, dailyTarget]);

  const storeRankings = useMemo(() => {
    return calculateStoreBreakdown(currentViewExpenses);
  }, [currentViewExpenses]);

  if ((isLoading || isFetching) && expenses.length === 0) {
    return <AnalyticsDashboardSkeleton isFamily={false} />;
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* 1. Compact Hero Status Banner */}
      <div className="p-4 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-3 h-3" />
                <span>Личный бюджет</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {kpis.percentOfBudget}% израсходовано
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              {periodTitle || 'Аналитика расходов'}
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span>Норма: <b className="font-mono text-white">{formatRubles(dailyTarget)}</b>/день</span>
          </div>
        </div>

        {/* Highlight Remaining Budget & Key Metrics */}
        <div className="mt-4 pt-4 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-6">
          <div className="space-y-0.5">
            <div className="text-[11px] text-slate-400 font-medium">Остаток бюджета:</div>
            <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${kpis.remainingBudget > 0 ? 'text-teal-400' : 'text-rose-400/85'}`}>
              {formatRubles(kpis.remainingBudget)}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 text-xs">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Потрачено</div>
              <div className={`text-sm sm:text-base font-bold font-mono ${isOverBudget ? 'text-rose-400/85' : 'text-emerald-400/80'}`}>
                {formatRubles(kpis.totalSpent)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Средний чек в день</div>
              <div className="text-sm sm:text-base font-bold font-mono text-white flex items-center gap-1.5">
                <span>{formatRubles(kpis.averagePerDay)}</span>
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">/ {formatRubles(dailyTarget)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Расход бюджета ({formatRubles(kpis.totalSpent)} из {formatRubles(monthlyBudget)})</span>
            <span className="font-mono font-bold text-slate-200">{kpis.percentOfBudget}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                kpis.percentOfBudget > 85 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(kpis.percentOfBudget, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Chart Tabs Switcher */}
      <div className="lg:hidden flex p-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setMobileChartTab('categories')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileChartTab === 'categories'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-teal-400" />
          <span>Категории продуктов</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileChartTab('daily')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileChartTab === 'daily'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Динамика по дням</span>
        </button>
      </div>

      {/* Main Visuals Grid: Daily Dynamics & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Category Breakdown Donut Chart (Primary on mobile) */}
        <div className={`p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4 ${
          mobileChartTab !== 'categories' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-slate-100">Категории продуктов</h3>
          </div>

          <CategoryDonutChart 
            items={categoryBreakdown} 
            totalAmount={currentViewSpent} 
            selectedDate={selectedDayDate}
          />
        </div>

        {/* Daily Dynamics Bar Chart */}
        <div className={`p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4 ${
          mobileChartTab !== 'daily' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-sm font-bold text-slate-100 whitespace-nowrap">Динамика расходов по дням</h3>
          </div>

          <DailyBarChart 
            items={dailyBars} 
            dailyLimit={dailyTarget} 
            selectedDate={selectedDayDate}
            onSelectDate={(date) => setSelectedDayDate(date)}
          />
        </div>

      </div>

      {/* Stores Breakdown */}
      {storeRankings.length > 0 && (
        <div className="p-3.5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Рейтинг супермаркетов</h3>
          </div>

          <div className="space-y-3">
            {storeRankings.map((store) => (
              <div key={store.storeId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-semibold truncate">
                    {store.name}
                  </span>
                  <span className="font-mono text-slate-200 shrink-0">
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
        </div>
      )}

      {/* Unified Reusable Purchases History Table with Skeleton Support */}
      <PurchasesHistoryTable 
        expenses={currentViewExpenses}
        deletedExpenses={personalDeletedExpenses}
        totalPeriodExpensesCount={filtered.length}
        isLoading={isLoading && expenses.length === 0}
        selectedDate={selectedDayDate}
        periodTitle={periodTitle}
        onResetDateFilter={() => setSelectedDayDate(null)}
        onDeleteExpense={handleDelete}
        onRestoreExpense={handleRestore}
        deletingId={deletingId}
        currentUserId={currentUser.id}
        showBuyer={false}
      />

    </div>
  );
};
