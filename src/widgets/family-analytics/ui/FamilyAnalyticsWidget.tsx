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
  Filter, 
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
  useFamilyExpensesQuery,
  useDeleteExpenseMutation 
} from '../../../entities/expense';
import { formatRubles } from '../../../entities/budget';
import { CategoryDonutChart } from '../../personal-analytics/ui/charts/CategoryDonutChart';
import { DailyBarChart } from '../../personal-analytics/ui/charts/DailyBarChart';
import { PurchasesHistoryTable } from '../../../features/view-purchases-history';

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
  const { data: expenses = [], isLoading } = useFamilyExpensesQuery(family.id, memberIds);
  const deleteMutation = useDeleteExpenseMutation(currentUser.id, family.id);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [isDateTransitioning, setIsDateTransitioning] = useState(false);

  useEffect(() => {
    setSelectedDayDate(null);
  }, [filter, selectedMemberId]);

  // Smooth skeleton transition when switching dates
  useEffect(() => {
    setIsDateTransitioning(true);
    const timer = setTimeout(() => setIsDateTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [filter, selectedDayDate]);

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

  // 1. Filter by Date Period
  const { filtered: dateFilteredExpenses, title: periodTitle, daysInRange } = useMemo(() => {
    return filterExpensesByDate(expenses, filter);
  }, [expenses, filter]);

  // 2. Filter by Member
  const activeExpenses = useMemo(() => {
    if (selectedMemberId === 'all') return dateFilteredExpenses;
    return dateFilteredExpenses.filter(e => e.userId === selectedMemberId);
  }, [dateFilteredExpenses, selectedMemberId]);

  // 3. Filter for Table (Synchronized with chart date selection)
  const tableExpenses = useMemo(() => {
    if (selectedDayDate) {
      return activeExpenses.filter(e => e.date === selectedDayDate);
    }
    return activeExpenses;
  }, [activeExpenses, selectedDayDate]);

  // Total Family Spend in Period
  const totalPeriodSpent = useMemo(() => {
    return dateFilteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [dateFilteredExpenses]);

  // Active view spend (either all family or selected member)
  const activeSpent = useMemo(() => {
    return activeExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [activeExpenses]);

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
    return calculateCategoryBreakdown(activeExpenses);
  }, [activeExpenses]);

  const storeBreakdown = useMemo(() => {
    return calculateStoreBreakdown(activeExpenses);
  }, [activeExpenses]);

  if (isLoading && expenses.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Загрузка семейной аналитики...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

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
            {isDateTransitioning ? (
              <div className="space-y-2 py-1">
                <div className="h-8 w-32 bg-slate-800/80 rounded-lg animate-pulse" />
                <div className="h-3 w-40 bg-slate-800/60 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {formatRubles(totalPeriodSpent)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Бюджет на месяц: <b className="font-mono text-slate-200">{formatRubles(familyMonthlyBudget)}</b>
                </div>
              </>
            )}
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
            {isDateTransitioning ? (
              <div className="space-y-2 py-1">
                <div className="h-8 w-28 bg-slate-800/80 rounded-lg animate-pulse" />
                <div className="h-3 w-36 bg-slate-800/60 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {formatRubles(avgPerDay)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Норма: <span className="font-mono text-slate-200">{formatRubles(familyDailyLimit)} / день</span>
                </div>
              </>
            )}
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
            {isDateTransitioning ? (
              <div className="space-y-2 py-1">
                <div className="h-8 w-28 bg-slate-800/80 rounded-lg animate-pulse" />
                <div className="h-3 w-44 bg-slate-800/60 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-black font-mono text-teal-300 tracking-tight">
                  {formatRubles(remainingBudget)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Доступно для семейных покупок
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Баланс в норме</span>
          </div>
        </div>
      </div>

      {/* Member Filter Bar (Pills to slice analytics by person) */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Фильтр по участнику:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto custom-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedMemberId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedMemberId === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Вся семья</span>
            <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-300 ml-1">
              {formatRubles(totalPeriodSpent)}
            </span>
          </button>

          {family.members.map(member => {
            const isSelected = selectedMemberId === member.userId;
            const spent = dateFilteredExpenses
              .filter(e => e.userId === member.userId)
              .reduce((sum, e) => sum + e.amount, 0);

            return (
              <button
                key={member.userId}
                type="button"
                onClick={() => setSelectedMemberId(member.userId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{member.avatar || '🥑'}</span>
                <span>{member.name}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-300 ml-1">
                  {formatRubles(spent)}
                </span>
              </button>
            );
          })}
        </div>
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
            totalAmount={activeSpent}
          />
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

        {isDateTransitioning ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {[...Array(family.members.length || 3)].map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-slate-800/70 rounded" />
                  <div className="h-4 w-16 bg-slate-800/70 rounded" />
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800/50" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {memberBreakdown.map(({ member, spent, percent }) => (
              <div key={member.userId} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{member.avatar || '🥑'}</span>
                    <span className="font-semibold text-slate-200 truncate">{member.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono shrink-0">
                    <span className="text-slate-200 font-bold">{formatRubles(spent)}</span>
                    <span className="text-slate-500 text-[10px]">({percent}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stores Breakdown (Matches Рейтинг супермаркетов in Personal Analytics) */}
      {isDateTransitioning ? (
        <div className="p-3.5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4 animate-pulse">
          <div className="h-5 w-48 bg-slate-800/80 rounded-lg" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3.5 w-24 bg-slate-800/70 rounded" />
                  <div className="h-3.5 w-20 bg-slate-800/70 rounded" />
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800/50" />
              </div>
            ))}
          </div>
        </div>
      ) : storeBreakdown.length > 0 && (
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
        expenses={tableExpenses}
        totalPeriodExpensesCount={activeExpenses.length}
        isLoading={isDateTransitioning || isLoading}
        selectedDate={selectedDayDate}
        periodTitle={periodTitle}
        onResetDateFilter={() => setSelectedDayDate(null)}
        onDeleteExpense={handleDelete}
        deletingId={deletingId}
        members={family.members}
        currentUserId={currentUser.id}
      />

    </div>
  );
};
