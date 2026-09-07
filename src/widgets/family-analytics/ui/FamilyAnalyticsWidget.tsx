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
  const percentUsed = Math.min(100, Math.round((totalPeriodSpent / familyMonthlyBudget) * 100));
  const avgPerDay = daysInRange > 0 ? Math.round(totalPeriodSpent / daysInRange) : 0;

  // Breakdown per member
  const memberBreakdown = useMemo(() => {
    return family.members.map(member => {
      const spent = dateFilteredExpenses
        .filter(e => e.userId === member.userId)
        .reduce((sum, e) => sum + e.amount, 0);
      const percent = totalPeriodSpent > 0 ? Math.round((spent / totalPeriodSpent) * 100) : 0;
      return {
        member,
        spent,
        percent,
      };
    }).sort((a, b) => b.spent - a.spent);
  }, [family.members, dateFilteredExpenses, totalPeriodSpent]);

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
    <div className="space-y-6 animate-fade-in">

      {/* Family KPI Metrics Header: 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Family Spent */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Семейный бюджет</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {percentUsed}% от лимита
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {formatRubles(totalPeriodSpent)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Бюджет на месяц: <b className="font-mono text-slate-200">{formatRubles(familyMonthlyBudget)}</b>
            </div>
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

        {/* Card 2: Average Daily Burn */}
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
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {formatRubles(avgPerDay)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Норма: <span className="font-mono text-slate-200">{formatRubles(familyDailyLimit)} / день</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            {avgPerDay <= familyDailyLimit ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Семья в рамках нормы</span>
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Превышение дневной нормы</span>
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
            <div className="text-2xl sm:text-3xl font-bold font-mono text-teal-300 tracking-tight">
              {formatRubles(remainingBudget)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Доступно для семейных покупок
            </div>
          </div>

          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Баланс в норме</span>
          </div>
        </div>
      </div>

      {/* Member Contributions Breakdown */}
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
              {memberBreakdown.map(({ member, spent, percent }) => {
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
                    <div className="flex items-center justify-between text-xs w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{member.avatar || '🥑'}</span>
                        <span className={`font-semibold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                          {member.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono shrink-0">
                        <span className={`font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                          {formatRubles(spent)}
                        </span>
                        <span className="text-slate-500 text-[10px]">({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollContainer>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {memberBreakdown.map(({ member, spent, percent }) => {
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
                  <div className="flex items-center justify-between text-xs w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{member.avatar || '🥑'}</span>
                      <span className={`font-semibold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                        {member.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono shrink-0">
                      <span className={`font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                        {formatRubles(spent)}
                      </span>
                      <span className="text-slate-500 text-[10px]">({percent}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts Grid: 2 Equal Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Daily Dynamics Bar Chart */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
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

        {/* Right: Category Donut Chart */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
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
