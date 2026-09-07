import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Tag, 
  ShoppingBag 
} from 'lucide-react';
import { useAuth } from '../../../entities/user';
import { CURRENCIES, DIETARY_OPTIONS, BUDGET_GOALS } from '../../../entities/budget';
import { POPULAR_STORES } from '../../../entities/store';
import { AddExpenseForm } from '../../../features/add-expense';
import { 
  usePersonalExpensesQuery, 
  useCreateExpenseMutation,
  filterExpensesByDate 
} from '../../../entities/expense';

export const DashboardOverview: React.FC = () => {
  const { currentUser } = useAuth();
  const { data: expenses = [] } = usePersonalExpensesQuery(currentUser?.id);
  const createMutation = useCreateExpenseMutation(currentUser?.id || '');

  if (!currentUser) return null;

  // Calculate this month's spent total from authoritative cached expenses
  const { filtered: thisMonthExpenses } = filterExpensesByDate(expenses, { period: 'month' });
  const spentSoFar = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const profile = currentUser.profile;
  const currencyCode = profile?.currency || 'RUB';
  const curr = CURRENCIES[currencyCode] || CURRENCIES.RUB;
  const monthlyBudget = profile?.monthlyBudget || 35000;
  const remainingBudget = Math.max(0, monthlyBudget - spentSoFar);
  const percentUsed = Math.min(100, Math.round((spentSoFar / monthlyBudget) * 100));

  const weeklyTarget = profile?.weeklyTarget || Math.round(monthlyBudget / 4);
  const dailyTarget = profile?.dailyTarget || Math.round(monthlyBudget / 30);

  const selectedGoalIds = profile?.budgetGoals?.length 
    ? profile.budgetGoals 
    : profile?.budgetGoal 
    ? [profile.budgetGoal] 
    : ['smart_planning'];
  const userGoals = BUDGET_GOALS.filter(g => selectedGoalIds.includes(g.id as any));
  const userStores = POPULAR_STORES.filter(s => profile?.favoriteStores?.includes(s.id));
  const userDiets = DIETARY_OPTIONS.filter(d => profile?.dietaryPreferences?.includes(d.id));

  const handleAddExpense = async (amount: number, note?: string) => {
    if (!currentUser) return;
    await createMutation.mutateAsync({
      amount,
      category: 'other',
      storeId: 'pyaterochka',
      title: note || 'Покупка продуктов',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Месячный бюджет на еду</div>
              <div className="text-3xl font-extrabold font-mono text-white mt-1">
                {curr.format(monthlyBudget)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400">Остаток на месяц</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {curr.format(remainingBudget)}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-400">Израсходовано: <b className="text-white font-mono">{curr.format(spentSoFar)}</b></span>
              <span className={percentUsed > 85 ? 'text-amber-400' : 'text-emerald-400'}>{percentUsed}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80 text-center">
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Лимит в неделю</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">{curr.format(weeklyTarget)}</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
              <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Лимит в день</div>
              <div className="text-sm font-bold font-mono text-emerald-300 mt-0.5">{curr.format(dailyTarget)}</div>
            </div>
          </div>
        </div>

        <AddExpenseForm
          currency={curr}
          onAddExpense={handleAddExpense}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Стратегии бюджета</span>
          </div>
          <div className="space-y-2">
            {userGoals.map(goal => (
              <div key={goal.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-2.5">
                <span className="text-xl mt-0.5">{goal.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>{goal.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-normal">
                      {goal.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug line-clamp-1">{goal.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <Tag className="w-4 h-4 text-teal-400" />
            <span>Особенности питания</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {userDiets.length > 0 ? (
              userDiets.map(d => (
                <span key={d.id} className="px-2.5 py-1 rounded-lg bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1.5">
                  <span>{d.icon}</span>
                  <span>{d.label}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500">Без строгих ограничений</span>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Выбранные магазины</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {userStores.length > 0 ? (
              userStores.map(s => (
                <span key={s.id} className="px-2.5 py-1 rounded-lg bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.name}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500">Любые супермаркеты</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

