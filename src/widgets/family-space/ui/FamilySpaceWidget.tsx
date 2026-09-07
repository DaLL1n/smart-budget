import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Wallet, 
  ShoppingBag, 
  Sparkles, 
  RefreshCw, 
  Loader2, 
  Tag, 
  PieChart,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useStore } from '@tanstack/react-store';
import { useAuth } from '../../../entities/user';
import { useFamilyQuery, familyStore, familyActions } from '../../../entities/family';
import { useFamilyExpensesQuery, formatDateIso } from '../../../entities/expense';
import { formatRubles, BUDGET_GOALS, DIETARY_OPTIONS } from '../../../entities/budget';
import { POPULAR_STORES } from '../../../entities/store';
import { AddFamilyMemberForm } from '../../../features/add-family-member';
import { FamilyMemberList } from '../../../features/manage-family-membership';

export const FamilySpaceWidget: React.FC = () => {
  const { currentUser, refreshUser, isLoading: isAuthLoading } = useAuth();
  const storeFamily = useStore(familyStore, (s) => s.currentFamily);
  const { data: queryFamily, isLoading: isQueryLoading, refetch, isFetching } = useFamilyQuery(currentUser?.familyId);

  // Prioritize live fresh query data over cached store, falling back gracefully
  const family = currentUser?.familyId ? (queryFamily || storeFamily) : null;

  // Query live family expenses for all members
  const memberIds = useMemo(() => family?.members?.map(m => m.userId) || [], [family?.members]);
  const { data: familyExpenses = [] } = useFamilyExpensesQuery(family?.id, memberIds);

  const currentYearMonth = useMemo(() => formatDateIso(new Date()).substring(0, 7), []);

  // Enrich members with live calculated monthly expenses from current month
  const displayFamily = useMemo(() => {
    if (!family) return null;
    const currentMonthExpenses = familyExpenses.filter(e => e.date.startsWith(currentYearMonth));

    const enrichedMembers = family.members.map(member => {
      const userMonthExpenses = currentMonthExpenses.filter(e => e.userId === member.userId);
      const computedSpent = userMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const spent = familyExpenses.length > 0 ? computedSpent : (member.monthlySpent || 0);

      return {
        ...member,
        monthlySpent: spent,
      };
    });

    return {
      ...family,
      members: enrichedMembers,
    };
  }, [family, familyExpenses, currentYearMonth]);

  // Keep familyStore in sync whenever query returns fresh data
  useEffect(() => {
    if (queryFamily) {
      familyActions.setFamily(queryFamily);
    }
  }, [queryFamily]);

  // Listen for cross-component and cross-tab updates (e.g., when member modifies monthly budget or strategy)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('smart_budget_sync');
      bc.onmessage = (e) => {
        if (e.data?.type === 'FAMILY_UPDATED') {
          refetch();
        }
      };
    } catch {}

    return () => {
      if (bc) bc.close();
    };
  }, [refetch]);

  if (!currentUser) return null;

  // Only show full loader if we TRULY have no family data to display yet (first-time load without cache)
  const hasFamily = !!family && family.members.length > 0;
  if (!hasFamily && (isAuthLoading || !!currentUser.familyId || isQueryLoading)) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-28 gap-4 animate-in fade-in duration-200">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Users className="w-7 h-7 text-emerald-400 animate-pulse" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-emerald-500/15 blur-xl pointer-events-none" />
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-sm font-bold text-white tracking-tight">Подключение семейного пространства</span>
          <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            Проверяем данные бюджета и участников...
          </span>
        </div>
      </div>
    );
  }

  // --- 1. NO FAMILY VIEW ---
  if (!family || family.members.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Совместный бюджет</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Общий семейный бюджет
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Объедините расходы на продукты с близкими. Добавьте родственника по Email — он будет мгновенно подключен к общему бюджету без инвайтов и ожидания.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-200">Единый лимит</div>
              <p className="text-[11px] text-slate-400">Общий баланс и статистика трат всех участников семьи</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-200">Прямое добавление</div>
              <p className="text-[11px] text-slate-400">Ввели Email — участник сразу в семье без ожидания подтверждения</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-200">Равные права</div>
              <p className="text-[11px] text-slate-400">Все участники равноправны и имеют доступ к аналитике</p>
            </div>
          </div>
        </div>

        {/* Direct Add Member Form */}
        <AddFamilyMemberForm 
          currentUser={currentUser}
          onMemberAdded={() => { refreshUser(); refetch(); }}
          title="Создать семью и добавить родственника"
          subtitle="Введите Email родственника, чтобы мгновенно объединить ваши продуктовые бюджеты"
        />
      </div>
    );
  }

  // --- 2. ACTIVE FAMILY VIEW ---
  const activeFamily = displayFamily || family;
  const totalFamilySpent = activeFamily.members.reduce((acc, m) => acc + (m.monthlySpent || 0), 0);
  const monthlyBudget = activeFamily.monthlyBudget || 60000;
  const remainingBudget = Math.max(0, monthlyBudget - totalFamilySpent);
  const percentUsed = Math.min(100, Math.round((totalFamilySpent / monthlyBudget) * 100));

  const familyGoalsList = (activeFamily.budgetGoals && activeFamily.budgetGoals.length > 0)
    ? activeFamily.budgetGoals
    : (currentUser?.profile?.budgetGoals || ['save_money', 'smart_planning']);
  const familyGoals = BUDGET_GOALS.filter(g => familyGoalsList.includes(g.id as any));

  const familyDietsList = (activeFamily.dietaryPreferences && activeFamily.dietaryPreferences.length > 0)
    ? activeFamily.dietaryPreferences
    : (currentUser?.profile?.dietaryPreferences || ['standard']);
  const familyDiets = DIETARY_OPTIONS.filter(d => familyDietsList.includes(d.id));

  const familyStores = POPULAR_STORES.filter(s => currentUser?.profile?.favoriteStores?.includes(s.id));

  return (
    <div className="w-full space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner Card */}
      <div className="p-4 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Семейный бюджет</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Семейное пространство
            </h1>
            <p className="text-xs text-slate-400">
              <span>{activeFamily.members.length} {activeFamily.members.length === 1 ? 'участник' : activeFamily.members.length < 5 ? 'участника' : 'участников'}</span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3.5 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Обновить данные"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Обновить</span>
            </button>
          </div>
        </div>

        {/* Family Budget Progress Summary */}
        <div className="mt-6 pt-6 border-t border-slate-800/70 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Общий бюджет месяца</div>
            <div className="text-lg font-black text-white font-mono">{formatRubles(monthlyBudget)}</div>
            <div className="text-[10px] text-slate-500">Лимит на всех участников</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Потрачено семьей</div>
            <div className="text-lg font-black text-emerald-400 font-mono">{formatRubles(totalFamilySpent)}</div>
            <div className="text-[10px] text-slate-500">{percentUsed}% от общего лимита</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Остаток средств</div>
            <div className={`text-lg font-black font-mono ${remainingBudget > 0 ? 'text-teal-300' : 'text-rose-400'}`}>
              {formatRubles(remainingBudget)}
            </div>
            <div className="text-[10px] text-slate-500">До конца расчетного периода</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Расход бюджета</span>
            <span className="font-mono font-bold text-slate-200">{percentUsed}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 90
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Members & Stats) + Right (Add form & Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Member List & Contribution Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          <FamilyMemberList 
            currentUser={currentUser} 
            family={activeFamily}
            onFamilyUpdated={(updatedFamily) => {
              familyStore.setState((s) => ({ ...s, currentFamily: updatedFamily }));
              refreshUser();
              refetch();
            }}
          />

          {/* Member Spending Distribution Chart */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span>Распределение расходов</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Текущий месяц</span>
            </div>

            <div className="space-y-3">
              {activeFamily.members.map((member) => {
                const memberSpent = member.monthlySpent || 0;
                const memberPercent = totalFamilySpent > 0 ? Math.round((memberSpent / totalFamilySpent) * 100) : 0;

                return (
                  <div key={member.userId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>{member.avatar || '🥑'}</span>
                        <span className="font-semibold text-slate-200">{member.name}</span>
                      </div>
                      <div className="font-mono text-slate-300">
                        {formatRubles(memberSpent)} <span className="text-slate-500">({memberPercent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                        style={{ width: `${memberPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Direct Add form + Preferences */}
        <div className="lg:col-span-5 space-y-6">
          <AddFamilyMemberForm 
            currentUser={currentUser}
            onMemberAdded={() => { refetch(); }}
            title="Добавить еще участника"
            subtitle="Введите Email родственника для прямого добавления в семью"
          />

          {/* Preferences and Goals Summary */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-teal-400" />
              <span>Цели и предпочтения семьи</span>
            </h3>

            <div className="space-y-3 text-xs">
              {familyGoals.length > 0 && (
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">Приоритетные финансовые цели:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {familyGoals.map((g) => (
                      <span key={g.id} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-1">
                        <span>{g.icon}</span>
                        <span>{g.title}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {familyDiets.length > 0 && (
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">Диетические предпочтения:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {familyDiets.map((d) => (
                      <span key={d.id} className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center gap-1">
                        <span>{d.icon}</span>
                        <span>{d.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {familyStores.length > 0 && (
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">Регулярные магазины семьи:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {familyStores.map((s) => (
                      <span key={s.id} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: s.color }} 
                        />
                        <span>{s.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
