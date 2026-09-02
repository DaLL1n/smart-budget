import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShoppingBag, 
  Loader2, 
  Building, 
  TrendingUp, 
  Coins
} from 'lucide-react';
import { useAuth, AVATAR_OPTIONS } from '../../../entities/user';
import { 
  DIETARY_OPTIONS, 
  BUDGET_GOALS, 
  BUDGET_PRESETS,
  BudgetGoalType,
  formatRubles, 
  calculateSingleUserBudget, 
  validateStep1Profile 
} from '../../../entities/budget';
import { StoreSelector } from '../../../features/select-stores';

export const AccountSetupWizard: React.FC = () => {
  const { currentUser, completeAccountSetup, logout } = useAuth();
  
  const [currentSubStep, setCurrentSubStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Form State - Step 1: Personal Budget & Avatar
  const [monthlyBudget, setMonthlyBudget] = useState<number>(currentUser?.profile?.monthlyBudget || 35000);
  const [city, setCity] = useState<string>(currentUser?.profile?.city || 'Москва');
  const [avatar, setAvatar] = useState<string>(currentUser?.avatar || '🥑');
  const [avatarColor, setAvatarColor] = useState<string>(currentUser?.avatarColor || 'from-emerald-400 to-teal-500');

  // Form State - Step 2: Preferences, Stores & Strategy (Multiple for AI)
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(
    currentUser?.profile?.dietaryPreferences || ['standard', 'healthy']
  );
  const [favoriteStores, setFavoriteStores] = useState<string[]>(
    currentUser?.profile?.favoriteStores || ['pyaterochka', 'vkusvill', 'samokat']
  );
  const initialGoals: BudgetGoalType[] = currentUser?.profile?.budgetGoals?.length
    ? currentUser.profile.budgetGoals
    : currentUser?.profile?.budgetGoal
    ? [currentUser.profile.budgetGoal]
    : ['smart_planning', 'save_money'];
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoalType[]>(initialGoals);

  const singleCalc = calculateSingleUserBudget(monthlyBudget);

  const toggleGoal = (id: BudgetGoalType) => {
    setBudgetGoals(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter(g => g !== id);
      }
      return [...prev, id];
    });
  };

  const toggleDietary = (id: string) => {
    setDietaryPreferences(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleNextFromStep1 = () => {
    const validation = validateStep1Profile({ monthlyBudget, city, avatar });
    if (!validation.isValid) {
      setStep1Error(validation.errors[0]);
      return;
    }
    setStep1Error(null);
    setCurrentSubStep(2);
  };

  const handleFinishSetup = async () => {
    setIsSubmitting(true);
    try {
      await completeAccountSetup({
        avatar,
        avatarColor,
        city,
        profile: {
          currency: 'RUB',
          monthlyBudget,
          weeklyTarget: singleCalc.weekly,
          dailyTarget: singleCalc.daily,
          adultsCount: 1,
          childrenCount: 0,
          petsCount: 0,
          dietaryPreferences,
          favoriteStores,
          budgetGoal: budgetGoals[0] || 'smart_planning',
          budgetGoals,
          updatedAt: new Date().toISOString(),
        }
      });
    } catch (err) {
      console.error('Failed to complete onboarding setup:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { 
      id: 1, 
      title: 'Персональный бюджет', 
      subtitle: 'Сумма в рублях и аватар', 
      icon: Coins 
    },
    { 
      id: 2, 
      title: 'Стратегия и предпочтения', 
      subtitle: 'Рацион, супермаркеты и цель', 
      icon: ShoppingBag 
    },
  ];

  const progressPercent = Math.round((currentSubStep / steps.length) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4 sm:px-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-3 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="tracking-wide">Индивидуальная настройка профиля</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
          Настройка продуктового бюджета
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          Укажите персональный лимит в рублях и настройте подходящую стратегию покупок.
        </p>
      </div>

      <div 
        id="setup-progress-container"
        className="mb-6 p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white tracking-wide">
              Шаг {currentSubStep} из {steps.length}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400 hidden sm:inline">
              {steps[currentSubStep - 1].title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-0.5 rounded-lg text-xs">
            <span>{progressPercent}%</span>
            <span className="text-[10px] text-emerald-500/70">готово</span>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800/80 overflow-hidden p-0.5 mb-4">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-sm shadow-emerald-500/30"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 relative">
          {steps.map((step) => {
            const isDone = currentSubStep > step.id;
            const isCurrent = currentSubStep === step.id;
            const isPending = currentSubStep < step.id;
            const StepIcon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isDone && setCurrentSubStep(step.id)}
                disabled={isPending}
                className={`group text-left p-3 sm:p-3.5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 ${
                  isCurrent
                    ? 'bg-zinc-900/90 border-emerald-500/70 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                    : isDone
                    ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 cursor-pointer'
                    : 'bg-zinc-950/40 border-zinc-900/80 opacity-50 cursor-not-allowed'
                }`}
              >
                <div 
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : <StepIcon className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-semibold tracking-tight truncate ${
                      isCurrent ? 'text-emerald-300' : isDone ? 'text-zinc-200' : 'text-zinc-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate hidden sm:block">
                    {step.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div 
        id="account-setup-card"
        className="bg-zinc-900/85 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-visible"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl" />
        </div>

        <AnimatePresence mode="wait">
          {currentSubStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-6 relative z-10"
            >
              <div className="border-b border-zinc-800/80 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-400" />
                    <span>Шаг 1: Месячный бюджет на еду</span>
                  </h2>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-900/60">
                    Валюта: RUB (₽)
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Укажите желаемый бюджет на продукты питания в месяц. Все расчеты производятся строго в рублях.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="budget-amount-input" className="text-xs font-medium text-zinc-300">
                    Сумма на месяц (в рублях)
                  </label>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {formatRubles(monthlyBudget)}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-emerald-400 font-bold">
                    ₽
                  </span>
                  <input
                    id="budget-amount-input"
                    type="number"
                    min={1000}
                    step={1000}
                    value={monthlyBudget || ''}
                    onChange={(e) => setMonthlyBudget(Math.max(0, Number(e.target.value)))}
                    placeholder="35000"
                    className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-3 text-base font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <div className="text-[11px] text-zinc-400 mb-2 font-medium">Быстрый выбор суммы:</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {BUDGET_PRESETS.map((preset) => {
                      const isSelected = monthlyBudget === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMonthlyBudget(preset)}
                          className={`py-2 px-2 rounded-xl text-xs font-mono font-medium transition-all text-center border cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30 shadow-sm'
                              : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {formatRubles(preset)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {step1Error && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900/60 text-xs text-rose-300">
                    {step1Error}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Расчет персонального лимита</span>
                  </span>
                  <span className="font-mono text-zinc-400 text-[11px]">базовая норма</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/60">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Лимит в неделю</div>
                    <div className="text-base font-bold font-mono text-white mt-0.5">
                      {formatRubles(singleCalc.weekly)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/60">
                    <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Лимит в день</div>
                    <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                      {formatRubles(singleCalc.daily)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-zinc-800/60">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">
                    Выберите аватар для вашего профиля
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {AVATAR_OPTIONS.map((item) => {
                      const isSelected = avatar === item.emoji;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setAvatar(item.emoji);
                            setAvatarColor(item.color);
                          }}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-2xl transition-all relative cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-800 border-2 border-emerald-500 ring-2 ring-emerald-500/20 scale-105 shadow-md'
                              : 'bg-zinc-950/60 border border-zinc-800/80 hover:bg-zinc-800/60 hover:border-zinc-700'
                          }`}
                        >
                          <span>{item.emoji}</span>
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="user-city-input" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Город проживания (для цен в супермаркетах)
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="user-city-input"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Москва"
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentSubStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-6 relative z-10"
            >
              <div className="border-b border-zinc-800/80 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                    <span>Шаг 2: Стратегия и предпочтения</span>
                  </h2>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-900/60">
                    Шаг 2 из 2
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Укажите предпочтительные магазины, пищевые особенности и главную цель бюджета.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Стратегии продуктового бюджета (выберите 1 или несколько)
                  </label>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-900/60">
                    Выбрано: {budgetGoals.length}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-3">
                  AI-ассистент будет формировать персонализированный список покупок и рецептов на основе всех выбранных стратегий.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUDGET_GOALS.map((goal) => {
                    const isSelected = budgetGoals.includes(goal.id as BudgetGoalType);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleGoal(goal.id as BudgetGoalType)}
                        className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 relative cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-2xl shrink-0 mt-0.5">{goal.icon}</span>
                        <div className="flex-1 pr-6">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{goal.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-normal">
                              {goal.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{goal.desc}</div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-bold shadow-sm">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Особенности питания (можно выбрать несколько)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DIETARY_OPTIONS.map((item) => {
                    const isSelected = dietaryPreferences.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleDietary(item.id)}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                            : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-xl mb-1">{item.icon}</div>
                        <div className="text-xs font-semibold leading-tight">{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FSD Feature Integration */}
              <StoreSelector
                city={city}
                selectedStores={favoriteStores}
                onChange={setFavoriteStores}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-between relative z-0">
          {currentSubStep > 1 ? (
            <button
              id="setup-back-button"
              type="button"
              onClick={() => setCurrentSubStep(prev => prev - 1)}
              className="px-4 py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-950/60 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>
          ) : (
            <button
              id="setup-logout-button"
              type="button"
              onClick={() => logout()}
              className="px-3.5 py-2 rounded-xl text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Выйти
            </button>
          )}

          {currentSubStep === 1 ? (
            <button
              id="setup-step1-continue-button"
              type="button"
              onClick={handleNextFromStep1}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <span>Продолжить</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id="setup-finish-button"
              type="button"
              disabled={isSubmitting}
              onClick={handleFinishSetup}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-xs font-bold hover:from-emerald-400 hover:to-teal-300 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Сохранение профиля...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Завершить настройку и войти</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
