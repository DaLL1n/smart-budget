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
  const { data: expenses = [], isLoading } = usePersonalExpensesQuery(currentUser.id);
  const { data: personalDeletedExpenses = [] } = usePersonalDeletedExpensesQuery(currentUser.id);

  // Realtime instant live synchronization across active browser tabs & devices
  useExpensesRealtimeSubscription(currentUser.familyId, currentUser.id);

  const deleteMutation = useDeleteExpenseMutation(currentUser.id, currentUser.familyId);
  const restoreMutation = useRestoreExpenseMutation(currentUser.id, currentUser.familyId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

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

  // Data for the Purchase History Table:
  // Synchronized with both date range filter and interactive chart date selection
  const tableExpenses = useMemo(() => {
    if (selectedDayDate) {
      return filtered.filter(e => e.date === selectedDayDate);
    }
    return filtered;
  }, [filtered, selectedDayDate]);

  const kpis = useMemo(() => {
    return calculatePersonalKPIs(filtered, monthlyBudget, daysInRange, periodTitle);
  }, [filtered, monthlyBudget, daysInRange, periodTitle]);

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(filtered);
  }, [filtered]);

  const dailyBars = useMemo(() => {
    return calculateDailyBarDistribution(expenses, filter, dailyTarget);
  }, [expenses, filter, dailyTarget]);

  const storeRankings = useMemo(() => {
    return calculateStoreBreakdown(filtered);
  }, [filtered]);

  if (isLoading && expenses.length === 0) {
    return <AnalyticsDashboardSkeleton isFamily={false} />;
  }

  return (
    <div className="w-full space-y-6">
      
      {/* 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Total Personal Spent */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Мой бюджет</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {kpis.percentOfBudget}% от лимита
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {formatRubles(kpis.totalSpent)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Бюджет на месяц: <b className="font-mono text-slate-200">{formatRubles(monthlyBudget)}</b>
            </div>
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

        {/* Card 2: Average Per Day */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>Средний чек в день</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              за {daysInRange} {daysInRange === 1 ? 'день' : daysInRange < 5 ? 'дня' : 'дней'}
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {formatRubles(kpis.averagePerDay)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Норма: <span className="font-mono text-slate-200">{formatRubles(dailyTarget)} / день</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            {kpis.averagePerDay <= dailyTarget ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>В рамках личной нормы</span>
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Превышение нормы дня</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Remaining Budget */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span>Остаток бюджета</span>
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-teal-300 tracking-tight">
              {formatRubles(kpis.remainingBudget)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Доступно на продукты до конца месяца
            </div>
          </div>

          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Баланс в норме</span>
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
            selectedDate={selectedDayDate}
            onSelectDate={(date) => setSelectedDayDate(date)}
          />
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-slate-100">Категории продуктов</h3>
          </div>

          <CategoryDonutChart 
            items={categoryBreakdown} 
            totalAmount={kpis.totalSpent} 
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
        expenses={tableExpenses}
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
