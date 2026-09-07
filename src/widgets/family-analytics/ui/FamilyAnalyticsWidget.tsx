import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  PieChart, 
  Calendar, 
  Coins, 
  ShoppingBag, 
  Sparkles, 
  ArrowDownRight, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { User } from '../../../entities/user';
import { Family } from '../../../entities/family';
import { 
  DateFilterState, 
  filterExpensesByDate, 
  calculateDailyBarDistribution, 
  calculateCategoryBreakdown,
  calculateStoreBreakdown,
  formatDateDdMmYy,
  useFamilyExpensesQuery,
  useFamilyDeletedExpensesQuery,
  useExpensesRealtimeSubscription,
  useDeleteExpenseMutation,
  useRestoreExpenseMutation
} from '../../../entities/expense';
import { formatRubles } from '../../../entities/budget';
import { CategoryDonutChart } from '../../personal-analytics/ui/charts/CategoryDonutChart';
import { DailyBarChart } from '../../personal-analytics/ui/charts/DailyBarChart';
import { PurchasesHistoryTable } from '../../../features/view-purchases-history';
import { ScrollContainer, AnalyticsDashboardSkeleton } from '../../../shared/ui';

interface FamilyAnalyticsWidgetProps {
  currentUser: User;
  family: Family;
  filter: DateFilterState;
}

export const FamilyAnalyticsWidget: React.FC<FamilyAnalyticsWidgetProps> = ({
  currentUser,
  family,
  filter,
}) => {
  const memberIds = useMemo(() => family.members.map(m => m.userId), [family.members]);
  const { data: expenses = [], isLoading, isFetching } = useFamilyExpensesQuery(family.id, memberIds);
  const { data: familyDeletedExpenses = [] } = useFamilyDeletedExpensesQuery(family.id, memberIds);

  // Subscribe to realtime changes in Supabase expenses table
  useExpensesRealtimeSubscription(family.id, currentUser.id);

  const deleteMutation = useDeleteExpenseMutation(currentUser.id, family.id);
  const restoreMutation = useRestoreExpenseMutation(currentUser.id, family.id);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [mobileChartTab, setMobileChartTab] = useState<'categories' | 'daily'>('categories');

  useEffect(() => {
    setSelectedDayDate(null);
  }, [filter, selectedMemberId]);

  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId);
    try {
      await deleteMutation.mutateAsync({ expenseId });
    } catch (err) {
      console.error('Failed to delete expense in family view:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (expenseId: string) => {
    try {
      await restoreMutation.mutateAsync({ expenseId });
    } catch (err) {
      console.error('Failed to restore expense in family view:', err);
    }
  };

  // 1. Filter by Date Period
  const { filtered: dateFilteredExpenses, title: periodTitle, daysInRange } = useMemo(() => {
    return filterExpensesByDate(expenses, filter);
  }, [expenses, filter]);

  // 2. Filter by Member
  const activeExpenses = useMemo(() => {
    if (selectedMemberId === 'all') return dateFilteredExpenses;
    return dateFilteredExpenses.filter(e => e.userId === selectedMemberId);
  }, [dateFilteredExpenses, selectedMemberId]);

  // 3. Current View Filter for Table, Categories, and Stores (Synchronized with chart date selection)
  const currentViewExpenses = useMemo(() => {
    if (selectedDayDate) {
      return activeExpenses.filter(e => e.date === selectedDayDate);
    }
    return activeExpenses;
  }, [activeExpenses, selectedDayDate]);

  const currentViewSpent = useMemo(() => {
    return currentViewExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [currentViewExpenses]);

  // Total Family Spend in Period
  const totalPeriodSpent = useMemo(() => {
    return dateFilteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [dateFilteredExpenses]);

  // Family Budget metrics
  const familyMonthlyBudget = family.monthlyBudget || 60000;
  const familyDailyLimit = Math.round(familyMonthlyBudget / 30);
  const remainingBudget = Math.max(0, familyMonthlyBudget - totalPeriodSpent);
  const isOverBudget = totalPeriodSpent > familyMonthlyBudget;
  const percentUsed = Math.min(100, Math.round((totalPeriodSpent / familyMonthlyBudget) * 100));
  const avgPerDay = daysInRange > 0 ? Math.round(totalPeriodSpent / daysInRange) : 0;

  // Breakdown per member (percentage of individual budget limit)
  const memberBreakdown = useMemo(() => {
    const defaultMemberBudget = Math.round(familyMonthlyBudget / Math.max(1, family.members.length));
    return family.members.map(member => {
      const spent = dateFilteredExpenses
        .filter(e => e.userId === member.userId)
        .reduce((sum, e) => sum + e.amount, 0);
      const budget = member.monthlyBudget || defaultMemberBudget;
      const percent = Math.min(100, Math.round((spent / budget) * 100));
      const percentLabel = spent > 0 && percent < 1 ? '< 1%' : `${percent}%`;
      return {
        member,
        spent,
        budget,
        percent,
        percentLabel,
      };
    }).sort((a, b) => b.spent - a.spent);
  }, [family.members, dateFilteredExpenses, familyMonthlyBudget]);

  // Charts data
  const dailyDistribution = useMemo(() => {
    return calculateDailyBarDistribution(activeExpenses, filter, familyDailyLimit);
  }, [activeExpenses, filter, familyDailyLimit]);

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(currentViewExpenses);
  }, [currentViewExpenses]);

  const storeBreakdown = useMemo(() => {
    return calculateStoreBreakdown(currentViewExpenses);
  }, [currentViewExpenses]);

  if ((isLoading || isFetching) && expenses.length === 0) {
    return <AnalyticsDashboardSkeleton isFamily={true} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto">

      {/* 1. Compact Family Budget Hero Status Banner */}
      <div className="p-4 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Семейный бюджет</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {percentUsed}% израсходовано
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              {periodTitle || 'Семейная аналитика'}
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span>Норма: <b className="font-mono text-white">{formatRubles(familyDailyLimit)}</b>/день</span>
          </div>
        </div>

        {/* Highlight Remaining Budget & Key Metrics */}
        <div className="mt-4 pt-4 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-6">
          <div className="space-y-0.5">
            <div className="text-[11px] text-slate-400 font-medium">Остаток бюджета семьи:</div>
            <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${remainingBudget > 0 ? 'text-teal-400' : 'text-rose-400/85'}`}>
              {formatRubles(remainingBudget)}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 text-xs">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Потрачено семьей</div>
              <div className={`text-sm sm:text-base font-bold font-mono ${isOverBudget ? 'text-rose-400/85' : 'text-emerald-400/80'}`}>
                {formatRubles(totalPeriodSpent)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Средний чек в день</div>
              <div className="text-sm sm:text-base font-bold font-mono text-white flex items-center gap-1.5">
                <span>{formatRubles(avgPerDay)}</span>
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">/ {formatRubles(familyDailyLimit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Расход бюджета ({formatRubles(totalPeriodSpent)} из {formatRubles(familyMonthlyBudget)})</span>
            <span className="font-mono font-bold text-slate-200">{percentUsed}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 85 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Member Contributions Breakdown (Interactive Filter directly under Hero) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Вклад участников в общие траты</span>
          </h4>
        </div>

        {memberBreakdown.length > 3 ? (
          <ScrollContainer
            orientation="vertical"
            className="w-full min-w-0 pt-1"
            scrollClassName="max-h-[224px] sm:max-h-[86px] pr-3.5 py-1"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {memberBreakdown.map(({ member, spent, budget, percent, percentLabel }) => {
                const isSelected = selectedMemberId === member.userId;
                return (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => setSelectedMemberId(isSelected ? 'all' : member.userId)}
                    className={`p-3 rounded-xl border space-y-2 text-left cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700/80'
                    }`}
                    title={isSelected ? 'Сбросить фильтр по участнику' : `Фильтровать по участнику: ${member.name}`}
                  >
                    {/* Top row: Avatar + Name on left, Spent on right */}
                    <div className="flex items-center justify-between text-xs w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0 select-none">{member.avatar || '🥑'}</span>
                        <span className={`font-semibold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                          {member.name}
                        </span>
                      </div>
                      <div className="font-mono shrink-0">
                        <span className={`font-bold text-xs sm:text-sm ${isSelected ? 'text-emerald-300' : percent > 100 ? 'text-rose-400/85' : 'text-emerald-400/80'}`}>
                          {formatRubles(spent)}
                        </span>
                      </div>
                    </div>

                    {/* Free breathing space + Label row above progress bar */}
                    <div className="pt-2 border-t border-slate-800/60 space-y-1">
                      <div className="text-[10px] text-slate-400 font-mono">
                        {percentLabel} от бюджета
                      </div>
                      <div 
                        className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden"
                        title={`Израсходовано ${percentLabel} от бюджета (${formatRubles(spent)} из ${formatRubles(budget)})`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percent > 85 
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                              : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          }`}
                          style={{ width: `${Math.max(spent > 0 ? 1 : 0, percent)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollContainer>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {memberBreakdown.map(({ member, spent, budget, percent, percentLabel }) => {
              const isSelected = selectedMemberId === member.userId;
              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => setSelectedMemberId(isSelected ? 'all' : member.userId)}
                  className={`p-3 rounded-xl border space-y-2.5 text-left cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                  title={isSelected ? 'Сбросить фильтр по участнику' : `Фильтровать по участнику: ${member.name} (${percentLabel} от лимита)`}
                >
                  {/* Top row: Avatar + Name on left, Spent on right */}
                  <div className="flex items-center justify-between text-xs w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0 select-none">{member.avatar || '🥑'}</span>
                      <span className={`font-semibold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                        {member.name}
                      </span>
                    </div>
                    <div className="font-mono shrink-0">
                      <span className={`font-bold text-xs sm:text-sm ${isSelected ? 'text-emerald-300' : percent > 100 ? 'text-rose-400/85' : 'text-emerald-400/80'}`}>
                        {formatRubles(spent)}
                      </span>
                    </div>
                  </div>

                  {/* Free breathing space + Label row above progress bar */}
                  <div className="pt-2 border-t border-slate-800/60 space-y-1">
                    <div className="text-[10px] text-slate-400 font-mono">
                      {percentLabel} от бюджета
                    </div>
                    <div 
                      className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden"
                      title={`Израсходовано ${percentLabel} от бюджета (${formatRubles(spent)} из ${formatRubles(budget)})`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percent > 85 
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${Math.max(spent > 0 ? 1 : 0, percent)}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Mobile Chart Tabs Switcher */}
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

      {/* 4. Charts Grid: 2 Equal Columns (Responsive Tabs on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Category Donut Chart (Primary on mobile) */}
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
            items={dailyDistribution}
            dailyLimit={familyDailyLimit}
            selectedDate={selectedDayDate}
            onSelectDate={(date) => {
              setSelectedDayDate(date);
            }}
          />
        </div>
      </div>

      {/* Stores Breakdown (Matches Рейтинг супермаркетов in Personal Analytics) */}
      {storeBreakdown.length > 0 && (
        <div className="p-3.5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Рейтинг супермаркетов</h3>
          </div>

          <div className="space-y-3">
            {storeBreakdown.map((store) => (
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
        deletedExpenses={familyDeletedExpenses}
        totalPeriodExpensesCount={activeExpenses.length}
        isLoading={isLoading && expenses.length === 0}
        selectedDate={selectedDayDate}
        periodTitle={periodTitle}
        onResetDateFilter={() => setSelectedDayDate(null)}
        onDeleteExpense={handleDelete}
        onRestoreExpense={handleRestore}
        deletingId={deletingId}
        members={family.members}
        currentUserId={currentUser.id}
        showBuyer={true}
      />

    </div>
  );
};
