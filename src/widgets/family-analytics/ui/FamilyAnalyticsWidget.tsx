import React, { useMemo, useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  PieChart, 
  Calendar, 
  Coins, 
  ShoppingBag, 
  Sparkles, 
  ArrowDownRight, 
  Store, 
  UserCheck, 
  Filter, 
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { 
  useLegacyTable, 
  legacyCreateColumnHelper, 
  getCoreRowModel, 
  getSortedRowModel 
} from '@tanstack/react-table/legacy';
import { flexRender } from '@tanstack/react-table';
import { SortingState } from '@tanstack/table-core';
import { User } from '../../../entities/user';
import { Family } from '../../../entities/family';
import { 
  Expense, 
  DateFilterState, 
  EXPENSE_CATEGORIES, 
  filterExpensesByDate, 
  calculateDailyBarDistribution, 
  calculateCategoryBreakdown,
  calculateStoreBreakdown,
  formatDayMonth,
  formatShortDay,
  useFamilyExpensesQuery 
} from '../../../entities/expense';
import { formatRubles } from '../../../entities/budget';
import { POPULAR_STORES } from '../../../entities/store';
import { CategoryDonutChart } from '../../personal-analytics/ui/charts/CategoryDonutChart';
import { DailyBarChart } from '../../personal-analytics/ui/charts/DailyBarChart';

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

  // Selected member filter: 'all' or specific userId
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);

  // 1. Filter by Date Period
  const { filtered: dateFilteredExpenses, title: periodTitle, daysInRange } = useMemo(() => {
    return filterExpensesByDate(expenses, filter);
  }, [expenses, filter]);

  // 2. Filter by Member
  const activeExpenses = useMemo(() => {
    if (selectedMemberId === 'all') return dateFilteredExpenses;
    return dateFilteredExpenses.filter(e => e.userId === selectedMemberId);
  }, [dateFilteredExpenses, selectedMemberId]);

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

  // Top spending member
  const topSpender = memberBreakdown[0];

  // TanStack Table Column Definition
  const columnHelper = legacyCreateColumnHelper<Expense>();
  const columns = useMemo(() => [
    columnHelper.accessor('date', {
      header: 'Дата',
      cell: info => (
        <span className="font-mono text-xs text-slate-300">
          {formatDayMonth(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('userId', {
      header: 'Кто купил',
      cell: info => {
        const uId = info.getValue();
        const member = family.members.find(m => m.userId === uId);
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${member?.avatarColor || 'from-emerald-400 to-teal-500'} flex items-center justify-center text-[10px] shrink-0`}>
              {member?.avatar || '🥑'}
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate">
              {member?.name || (uId === currentUser.id ? 'Вы' : 'Участник')}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('category', {
      header: 'Категория',
      cell: info => {
        const catId = info.getValue();
        const cat = EXPENSE_CATEGORIES.find(c => c.id === catId) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span>{cat.icon}</span>
            <span className="truncate">{cat.label}</span>
          </span>
        );
      },
    }),
    columnHelper.accessor('storeId', {
      header: 'Магазин',
      cell: info => {
        const sId = info.getValue();
        const storeObj = POPULAR_STORES.find(s => s.id === sId);
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
            {storeObj && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: storeObj.color }} />}
            <span>{storeObj?.name || sId || 'Продуктовый'}</span>
          </span>
        );
      },
    }),
    columnHelper.accessor('amount', {
      header: 'Сумма',
      cell: info => (
        <span className="font-mono font-bold text-xs text-emerald-400">
          {formatRubles(info.getValue())}
        </span>
      ),
    }),
  ], [family.members, currentUser.id]);

  const table = useLegacyTable({
    data: activeExpenses,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">

      {/* Family KPI Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Family Spent */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Траты семьи</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {percentUsed}% от лимита
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
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
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-3">
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
              {formatRubles(avgPerDay)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Семейная норма: <span className="font-mono text-slate-200">{formatRubles(familyDailyLimit)} / день</span>
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
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span>Остаток бюджета</span>
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-teal-300 tracking-tight">
              {formatRubles(remainingBudget)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Доступно для семейных покупок
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {family.members.length} {family.members.length === 1 ? 'участник' : family.members.length < 5 ? 'участника' : 'участников'} ведут общий учет
          </div>
        </div>

        {/* Card 4: Top Contributor Leader */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Лидер закупок</span>
            </div>
            {topSpender && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900/60">
                {topSpender.percent}% трат
              </span>
            )}
          </div>

          {topSpender ? (
            <div>
              <div className="flex items-center gap-2.5">
                <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${topSpender.member.avatarColor || 'from-emerald-400 to-teal-500'} flex items-center justify-center text-sm shadow-md`}>
                  {topSpender.member.avatar || '🥑'}
                </span>
                <div className="min-w-0">
                  <div className="text-base font-bold text-white truncate">
                    {topSpender.member.name}
                  </div>
                  <div className="text-xs font-mono text-emerald-400">
                    {formatRubles(topSpender.spent)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-2">Нет трат за период</div>
          )}

          <div className="text-[10px] text-slate-400 truncate">
            {selectedMemberId !== 'all' ? 'Применен фильтр по участнику' : 'Сводка по всем участникам семьи'}
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

      {/* Charts Grid: Left (Daily Bar Chart) + Right (Category Donut & Member Contributions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Daily Spending Bar Chart */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                Динамика семейных трат по дням
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
              {periodTitle}
            </span>
          </div>

          <div className="flex-1 min-h-[220px]">
            <DailyBarChart
              items={dailyDistribution}
              dailyLimit={familyDailyLimit}
            />
          </div>
        </div>

        {/* Right Column (5 cols): Category Donut Chart & Member Share Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category Donut */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Категории семейной корзины
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatRubles(activeSpent)}
              </span>
            </div>

            <div className="min-h-[190px]">
              <CategoryDonutChart
                items={categoryBreakdown}
                totalAmount={activeSpent}
              />
            </div>
          </div>

          {/* Member Spending Shares */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Доли участников в общих тратах</span>
              </h4>
            </div>

            <div className="space-y-2.5 pt-1">
              {memberBreakdown.map(({ member, spent, percent }) => (
                <div key={member.userId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span>{member.avatar || '🥑'}</span>
                      <span className="font-medium text-slate-200">{member.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-200 font-bold">{formatRubles(spent)}</span>
                      <span className="text-slate-500 text-[11px] w-8 text-right">{percent}%</span>
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
          </div>
        </div>
      </div>

      {/* Stores Breakdown */}
      {storeBreakdown.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Покупки по магазинам семьи</span>
            </h4>
            <span className="text-xs font-mono text-slate-400">
              {storeBreakdown.length} {storeBreakdown.length === 1 ? 'сеть' : storeBreakdown.length < 5 ? 'сети' : 'сетей'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            {storeBreakdown.map(sb => {
              const percent = activeSpent > 0 ? Math.round((sb.amount / activeSpent) * 100) : 0;
              return (
                <div 
                  key={sb.storeId} 
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sb.color }} />
                      <span className="font-semibold text-slate-200 truncate">{sb.name}</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold font-mono text-white">
                    {formatRubles(sb.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {sb.count} {sb.count === 1 ? 'покупка' : sb.count < 5 ? 'покупки' : 'покупок'} ({percent}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TanStack Table: Family Purchases Registry */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
              Реестр семейных покупок (TanStack Table)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Показано {table.getRowModel().rows.length} из {dateFilteredExpenses.length} записей
          </span>
        </div>

        {table.getRowModel().rows.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Нет зарегистрированных покупок за выбранный период
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-slate-800/80 text-[11px] text-slate-400 uppercase tracking-wider">
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id} 
                        className="pb-3 px-3 font-semibold cursor-pointer select-none hover:text-white transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ArrowUpDown className="w-3 h-3 text-emerald-400 rotate-180" />,
                            desc: <ArrowUpDown className="w-3 h-3 text-emerald-400" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-3 px-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
