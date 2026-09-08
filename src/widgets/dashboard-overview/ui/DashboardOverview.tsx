import React, { useState } from 'react';
import { 
  Target, 
  Sparkles,
  CheckCircle2,
  Plus,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../../entities/user';
import { CURRENCIES, DIETARY_OPTIONS, BUDGET_GOALS } from '../../../entities/budget';
import { POPULAR_STORES } from '../../../entities/store';
import { AddExpenseModal } from '../../../features/add-expense';
import { 
  usePersonalExpensesQuery, 
  useCreateExpenseMutation,
  filterExpensesByDate 
} from '../../../entities/expense';
import { AiMealPlannerModal } from './AiMealPlannerModal';

export const DashboardOverview: React.FC = () => {
  const { currentUser } = useAuth();
  const { data: expenses = [] } = usePersonalExpensesQuery(currentUser?.id);
  const createMutation = useCreateExpenseMutation(currentUser?.id || '');

  // AI Meal Planner Modal state
  const [isPlannerOpen, setIsPlannerOpen] = useState<boolean>(false);
  // Add Expense Modal state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);

  if (!currentUser) return null;

  // Authoritative monthly expenses calculation
  const { filtered: thisMonthExpenses } = filterExpensesByDate(expenses, { period: 'month' });
  const spentSoFar = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const profile = currentUser.profile;
  const currencyCode = profile?.currency || 'RUB';
  const curr = CURRENCIES[currencyCode] || CURRENCIES.RUB;
  const monthlyBudget = profile?.monthlyBudget || 35000;
  const isOverBudget = spentSoFar > monthlyBudget;
  const remainingBudget = Math.max(0, monthlyBudget - spentSoFar);
  const overspendAmount = isOverBudget ? spentSoFar - monthlyBudget : 0;
  const percentUsed = Math.min(100, Math.round((spentSoFar / monthlyBudget) * 100));

  const weeklyTarget = profile?.weeklyTarget || Math.round(monthlyBudget / 4);
  const dailyTarget = profile?.dailyTarget || Math.round(monthlyBudget / 30);

  // Calendar calculation for remaining days
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  const selectedGoalIds = profile?.budgetGoals?.length 
    ? profile.budgetGoals 
    : profile?.budgetGoal 
    ? [profile.budgetGoal] 
    : ['smart_planning'];
  const userGoals = BUDGET_GOALS.filter(g => selectedGoalIds.includes(g.id as any));
  const userStores = POPULAR_STORES.filter(s => profile?.favoriteStores?.includes(s.id));
  const userDiets = DIETARY_OPTIONS.filter(d => profile?.dietaryPreferences?.includes(d.id));

  const handleAddExpense = async (amount: number, note?: string, storeId?: string) => {
    if (!currentUser) return;
    await createMutation.mutateAsync({
      amount,
      category: 'other',
      storeId: storeId || userStores[0]?.id || 'pyaterochka',
      title: note || 'Покупка продуктов',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column (lg: 6 cols): Main Budget Hero Card with AI CTA Button */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Месячный бюджет на еду</div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1">
                  {curr.format(monthlyBudget)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-medium text-slate-400">
                  {isOverBudget ? 'Перерасход' : 'Остаток на месяц'}
                </div>
                <div className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                  isOverBudget ? 'text-rose-400/90' : 'text-emerald-400/90'
                }`}>
                  {isOverBudget ? `+${curr.format(overspendAmount)}` : curr.format(remainingBudget)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">
                  Израсходовано: <b className="text-white font-mono font-bold">{curr.format(spentSoFar)}</b>
                </span>
                <span className={`font-mono font-bold ${
                  isOverBudget ? 'text-rose-400' : percentUsed > 85 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {percentUsed}% {isOverBudget && '(лимит исчерпан)'}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget 
                      ? 'bg-gradient-to-r from-rose-500/80 to-amber-500/80' 
                      : 'bg-gradient-to-r from-emerald-500/80 to-teal-400/80'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>

            {/* Target Limits in Day & Week */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-center">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Лимит в неделю</div>
                <div className="text-sm sm:text-base font-bold font-mono text-white mt-0.5">
                  {curr.format(weeklyTarget)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider">Лимит в день</div>
                <div className="text-sm sm:text-base font-bold font-mono text-emerald-300 mt-0.5">
                  {curr.format(dailyTarget)}
                </div>
              </div>
            </div>

            {/* Main AI Meal Planning CTA Button */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setIsPlannerOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Сформировать рацион и список покупок с ИИ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (lg: 6 cols): Quick Add Form + Preferences Profile */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-6">
          {/* Quick Expense Action Card (opens AddExpenseModal) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Учет покупок продуктов</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/70 border border-slate-800/80 px-2 py-0.5 rounded-md">
                Чек или вручную
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Внесите траты на продукты или отсканируйте чек — баланс и лимиты на неделю и день пересчитаются автоматически.
            </p>

            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Добавить покупку</span>
            </button>
          </div>

          {/* Compact Preferences & Diet Profile Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Профиль питания и магазины</span>
            </div>

            {/* Goals */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Цели бюджета</div>
              <div className="flex flex-wrap gap-1.5">
                {userGoals.map(goal => (
                  <span 
                    key={goal.id} 
                    className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-1.5"
                  >
                    <span>{goal.icon}</span>
                    <span>{goal.title}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Diets */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Особенности питания</div>
              <div className="flex flex-wrap gap-1.5">
                {userDiets.length > 0 ? (
                  userDiets.map(d => (
                    <span 
                      key={d.id} 
                      className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-1.5"
                    >
                      <span>{d.icon}</span>
                      <span>{d.label}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500">Без ограничений</span>
                )}
              </div>
            </div>

            {/* Favorite Stores */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Любимые магазины</div>
              <div className="flex flex-wrap gap-1.5">
                {userStores.length > 0 ? (
                  userStores.map(s => (
                    <span 
                      key={s.id} 
                      className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span>{s.name}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500">Любые супермаркеты</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Meal Planner Modal Preview */}
      <AiMealPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        currency={curr}
        remainingBudget={remainingBudget}
        daysRemaining={daysRemaining}
        userGoals={userGoals}
        userStores={userStores}
        userDiets={userDiets}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        currency={curr}
        onAddExpense={handleAddExpense}
        userStores={userStores}
      />
    </div>
  );
};
