import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  Loader2, 
  Coins, 
  Target, 
  User as UserIcon, 
  Bell, 
  Building, 
  TrendingUp, 
  ShoppingBag, 
  Sparkles, 
  Sliders 
} from 'lucide-react';
import { 
  Currency, 
  DIETARY_OPTIONS, 
  BUDGET_GOALS, 
  BUDGET_PRESETS,
  BudgetGoalType, 
  formatRubles, 
  calculateSingleUserBudget 
} from '../../../entities/budget';
import { User, UserProfile, AVATAR_OPTIONS, UpdateUserSettingsParams } from '../../../entities/user';
import { StoreSelector } from '../../select-stores';

export type SettingsTabId = 'budget' | 'strategy' | 'account' | 'notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  currentUser: User;
  onSave: (params: UpdateUserSettingsParams) => Promise<void> | void;
}

export const EditBudgetModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currency,
  currentUser,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('budget');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Form State - Account
  const [name, setName] = useState<string>(currentUser.name || '');
  const [avatar, setAvatar] = useState<string>(currentUser.avatar || '🥑');
  const [avatarColor, setAvatarColor] = useState<string>(currentUser.avatarColor || 'from-emerald-400 to-teal-500');
  const [city, setCity] = useState<string>(currentUser.profile?.city || 'Москва');
  const [notes, setNotes] = useState<string>(currentUser.profile?.notes || '');

  // Form State - Budget (Single Personal User Baseline)
  const [monthlyBudget, setMonthlyBudget] = useState<number>(currentUser.profile?.monthlyBudget || 35000);
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState<number>(currentUser.profile?.budgetAlertThreshold || 80);

  // Form State - Strategy (Multiple selections for AI Assistant)
  const initialGoals: BudgetGoalType[] = currentUser.profile?.budgetGoals?.length 
    ? currentUser.profile.budgetGoals 
    : currentUser.profile?.budgetGoal 
    ? [currentUser.profile.budgetGoal] 
    : ['smart_planning', 'save_money'];
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoalType[]>(initialGoals);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(currentUser.profile?.dietaryPreferences || ['standard', 'healthy']);
  const [favoriteStores, setFavoriteStores] = useState<string[]>(currentUser.profile?.favoriteStores || ['pyaterochka', 'vkusvill', 'samokat']);

  // Form State - Notifications
  const [budgetAlerts, setBudgetAlerts] = useState<boolean>(currentUser.profile?.notificationSettings?.budgetAlerts ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState<boolean>(currentUser.profile?.notificationSettings?.weeklyDigest ?? true);
  const [savingTips, setSavingTips] = useState<boolean>(currentUser.profile?.notificationSettings?.savingTips ?? true);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Prevent layout shift from scrollbar disappearing
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const singleCalc = calculateSingleUserBudget(monthlyBudget);

  const toggleGoal = (id: BudgetGoalType) => {
    setBudgetGoals(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Сохраняем минимум 1 стратегию
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

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim() || currentUser.name,
        avatar,
        avatarColor,
        profile: {
          currency: 'RUB',
          monthlyBudget,
          weeklyTarget: singleCalc.weekly,
          dailyTarget: singleCalc.daily,
          adultsCount: 1,
          childrenCount: 0,
          petsCount: 0,
          budgetGoal: budgetGoals[0] || 'smart_planning',
          budgetGoals,
          dietaryPreferences,
          favoriteStores,
          budgetAlertThreshold,
          city,
          notes,
          notificationSettings: {
            budgetAlerts,
            weeklyDigest,
            savingTips,
          },
          updatedAt: new Date().toISOString(),
        }
      });
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'budget' as const, label: 'Бюджет и лимиты', icon: Coins, desc: 'Сумма, пресеты и лимиты' },
    { id: 'strategy' as const, label: 'Стратегия и рацион', icon: Target, desc: 'Цели, диета и магазины' },
    { id: 'account' as const, label: 'Аккаунт и профиль', icon: UserIcon, desc: 'Имя, аватар и город' },
    { id: 'notifications' as const, label: 'Оповещения', icon: Bell, desc: 'Лимиты и оповещения' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        id="settings-modal-card"
        className="bg-zinc-950 border border-zinc-800/90 rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl shadow-black/80 flex flex-col h-[640px] sm:h-[680px] md:h-[620px] max-h-[92vh] overflow-hidden relative"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Параметры и настройки</h2>
              <p className="text-[11px] text-zinc-400">Управление продуктовым бюджетом, стратегией и профилем</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-all cursor-pointer"
            title="Закрыть настройки"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Vertical Navigation + Right Content Area (Fixed Height) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64 bg-zinc-900/40 border-b md:border-b-0 md:border-r border-zinc-800/80 p-2 sm:p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all shrink-0 md:w-full cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/70 border border-transparent'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold tracking-tight">{tab.label}</div>
                    <div className="text-[10px] text-zinc-500 truncate hidden md:block">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel (Scrollable with persistent locked height) */}
          <div className="flex-1 min-h-0 h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-zinc-950/60">
            {/* TAB 1: БЮДЖЕТ И ЛИМИТЫ (Только для текущего пользователя) */}
            {activeTab === 'budget' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Месячный продуктовый бюджет (₽)</span>
                    </label>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {formatRubles(monthlyBudget)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-emerald-400 font-bold">₽</span>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={monthlyBudget || ''}
                      onChange={(e) => setMonthlyBudget(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <div className="text-[11px] text-zinc-400 mb-2 font-medium">Быстрые суммы:</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {BUDGET_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMonthlyBudget(preset)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all text-center border cursor-pointer ${
                          monthlyBudget === preset
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {formatRubles(preset)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personal Calculated Targets Overview (2 Columns: Неделя & День) */}
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>Расчет персонального лимита</span>
                    </span>
                    <span className="font-mono text-zinc-500 text-[11px]">базовая норма</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Лимит в неделю</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">{formatRubles(singleCalc.weekly)}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                      <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Лимит в день</div>
                      <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">{formatRubles(singleCalc.daily)}</div>
                    </div>
                  </div>
                </div>

                {/* Threshold Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-300">Порог предупреждения о расходе:</span>
                    <span className="font-mono font-bold text-amber-400">{budgetAlertThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={budgetAlertThreshold}
                    onChange={(e) => setBudgetAlertThreshold(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>50% (ранее)</span>
                    <span>80% (рекомендуется)</span>
                    <span>95% (строго)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: СТРАТЕГИЯ И РАЦИОН */}
            {activeTab === 'strategy' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span>Стратегии продуктового бюджета (выберите 1 или несколько)</span>
                    </label>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-900/60">
                      Выбрано: {budgetGoals.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-3">
                    AI-ассистент будет формировать списки покупок, подсказки и оптимизацию меню с учетом всех выбранных стратегий.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {BUDGET_GOALS.map((goal) => {
                      const isSelected = budgetGoals.includes(goal.id as BudgetGoalType);
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => toggleGoal(goal.id as BudgetGoalType)}
                          className={`p-3 rounded-xl text-left border transition-all flex items-start gap-2.5 relative cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30 shadow-md'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <span className="text-2xl mt-0.5">{goal.icon}</span>
                          <div className="flex-1 pr-6">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{goal.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-normal">
                                {goal.badge}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{goal.desc}</div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-bold shadow-sm">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-2">Особенности питания</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DIETARY_OPTIONS.map((item) => {
                      const isSelected = dietaryPreferences.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleDietary(item.id)}
                          className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="text-lg mb-0.5">{item.icon}</div>
                          <div className="text-xs font-medium leading-tight">{item.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Integrated Store Selector Feature */}
                <StoreSelector
                  city={city}
                  selectedStores={favoriteStores}
                  onChange={setFavoriteStores}
                />
              </div>
            )}

            {/* TAB 3: АККАУНТ И ПРОФИЛЬ */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Имя пользователя</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Имя профиля"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email аккаунта</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-400 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Аватар профиля</label>
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
                          className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all relative cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-800 border-2 border-emerald-500 scale-105 shadow-md'
                              : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <span>{item.emoji}</span>
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px] font-bold">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Город проживания</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Москва"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Заметки и комментарии к рациону</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Например: покупка продуктов по субботам, доставка свежего молока..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: ОПОВЕЩЕНИЯ И ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Предупреждения о лимите бюджета</div>
                    <div className="text-[11px] text-zinc-400">Сигнализировать при достижении {budgetAlertThreshold}% от суммы</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={budgetAlerts}
                    onChange={(e) => setBudgetAlerts(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Еженедельный дайджест расходов</div>
                    <div className="text-[11px] text-zinc-400">Сводка трат и экономии за неделю</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Умные советы по экономии</div>
                    <div className="text-[11px] text-zinc-400">Персональные рекомендации по акциям в ваших супермаркетах</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={savingTips}
                    onChange={(e) => setSavingTips(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {showSuccessToast && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4" />
                <span>Настройки сохранены!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-all cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Сохранить настройки</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
