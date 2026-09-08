import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  X, 
  CalendarDays, 
  Coins, 
  Users, 
  CheckCircle2, 
  Loader2,
  Store,
  Tag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Currency, DietaryOption, BudgetGoal } from '../../../entities/budget';
import { StoreOption, POPULAR_STORES } from '../../../entities/store';

interface AiMealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  remainingBudget: number;
  daysRemaining: number;
  userGoals: BudgetGoal[];
  userStores: StoreOption[];
  userDiets: DietaryOption[];
}

type MealCycleDays = 3 | 7 | 14;
type WizardStep = 1 | 2 | 3;

export const AiMealPlannerModal: React.FC<AiMealPlannerModalProps> = ({
  isOpen,
  onClose,
  currency,
  remainingBudget,
  daysRemaining,
  userGoals,
  userStores,
  userDiets,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedCycle, setSelectedCycle] = useState<MealCycleDays>(7);
  const [selectedStores, setSelectedStores] = useState<string[]>(
    userStores.length > 0 ? userStores.map(s => s.id) : ['pyaterochka', 'vkusvill']
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body and html scroll, and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset step on reopen
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsReady(false);
      setIsSimulating(false);
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  // Safe cycle budget allocation based on remaining days (strictly without 'daily averages')
  const cycleBudget = Math.max(
    0,
    Math.min(remainingBudget, Math.round((remainingBudget / Math.max(1, daysRemaining)) * selectedCycle))
  );
  const remainingAfterCycle = Math.max(0, remainingBudget - cycleBudget);

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        if (prev.length <= 1) return prev; // keep at least 1 store
        return prev.filter(id => id !== storeId);
      }
      return [...prev, storeId];
    });
  };

  const handleGenerateClick = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setIsReady(true);
    }, 1500);
  };

  const availableStores = POPULAR_STORES.slice(0, 6);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-slate-900 via-slate-900/98 to-slate-950 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Elegant Name without raw vendor badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Шеф-меню и умная корзина
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Пошаговая настройка рациона и списка покупок под ваш бюджет
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-Step Progress Indicator */}
        <div className="flex items-center justify-between px-1 py-1 border-b border-slate-800/70 pb-3">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => {
              const isActive = currentStep === step;
              const isCompleted = currentStep > step;
              return (
                <div key={step} className="flex items-center gap-1.5">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                        : isActive 
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30' 
                        : 'bg-slate-950 border border-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-6 sm:w-10 h-0.5 rounded transition-all ${
                      currentStep > step ? 'bg-emerald-500/50' : 'bg-slate-800'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {currentStep === 1 && '1. Горизонт и бюджет'}
            {currentStep === 2 && '2. Состав и диета'}
            {currentStep === 3 && '3. Магазины и запуск'}
          </div>
        </div>

        {/* STEP 1: Горизонт и бюджет закупки */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  Горизонт планирования
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([3, 7, 14] as MealCycleDays[]).map((days) => {
                  const isSelected = selectedCycle === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSelectedCycle(days)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {days} {days === 3 ? 'дня' : 'дней'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Budget Allocation (No 'daily average' contradictive metric) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Coins className="w-3 h-3 text-emerald-400" />
                  <span>Бюджет на закупку</span>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                  {currency.format(cycleBudget)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  целевая закупка на {selectedCycle} дн.
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-teal-400" />
                  <span>Остаток бюджета</span>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-emerald-300 mt-1">
                  {currency.format(remainingAfterCycle)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  резерв на другие дни
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Состав персон и особенности питания */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Формат питания</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">👤</span>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Личный рацион (1 персона)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Индивидуальный расчет калорийности и ингредиентов под ваши цели
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dietary preferences */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Особенности рациона и диеты:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {userDiets.length > 0 ? (
                  userDiets.map(d => (
                    <span key={d.id} className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-teal-300 text-xs font-medium flex items-center gap-1.5">
                      <span>{d.icon}</span>
                      <span>{d.label}</span>
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs">
                    Сбалансированное традиционное меню
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Магазины для покупки и финальный запуск */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>Магазины для составления корзины (выберите супермаркеты):</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableStores.map(store => {
                  const isChecked = selectedStores.includes(store.id);
                  return (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => toggleStore(store.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                        isChecked 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white' 
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: store.color }} 
                        />
                        <span className="truncate">{store.name}</span>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary preview badge */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs">
              <div className="text-slate-400 flex justify-between">
                <span>Горизонт:</span>
                <b className="text-white font-mono">{selectedCycle} дней</b>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Лимит на продукты:</span>
                <b className="text-emerald-300 font-mono">{currency.format(cycleBudget)}</b>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Выбрано супермаркетов:</span>
                <b className="text-white">{selectedStores.length}</b>
              </div>
            </div>

            {/* Status result / Simulation feedback */}
            {isReady && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Параметры зафиксированы для генерации!</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Горизонт: {selectedCycle} дней • Лимит: <b className="text-white font-mono">{currency.format(cycleBudget)}</b>. Архитектура готова к подключению генерации рецептов и продуктовой корзины.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step Navigation / Action Buttons */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2.5">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as WizardStep)}
              className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev + 1) as WizardStep)}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
            >
              <span>Далее</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerateClick}
              disabled={isSimulating}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Составление меню и корзины...</span>
                </>
              ) : isReady ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Обновить расчет</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Сформировать меню и корзину</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
