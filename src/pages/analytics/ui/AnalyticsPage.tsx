import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Users, 
  BarChart3, 
  Sparkles, 
  ShieldAlert, 
  Lock 
} from 'lucide-react';
import { useAuth } from '../../../entities/user';
import { DateFilterState } from '../../../entities/expense';
import { DateRangeSelector } from '../../../features/filter-analytics-date';
import { PersonalAnalyticsWidget } from '../../../widgets/personal-analytics';
import { QueryErrorBoundary } from '../../../features/error-fallback';

export type AnalyticsMode = 'personal' | 'family';

export const AnalyticsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeMode, setActiveMode] = useState<AnalyticsMode>('personal');
  const [filterState, setFilterState] = useState<DateFilterState>({ period: 'month' });

  if (!currentUser) return null;

  return (
    <div className="w-full max-w-[1440px] mx-auto py-6 px-4 space-y-6">
      
      {/* Top Header & Sub-section Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xl text-black font-bold shadow-md shadow-emerald-950/40">
            <BarChart3 className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Аналитика расходов</h1>
            <p className="text-xs text-slate-400">Наглядные срезы продуктового бюджета и контроль трат</p>
          </div>
        </div>

        {/* Mode Tabs: Личные траты vs Траты семьи with Animated Pill (Centered on mobile) */}
        <div className="flex items-center justify-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800/90 shrink-0 mx-auto sm:mx-0 self-center sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode('personal')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeMode === 'personal'
                ? 'text-emerald-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            {activeMode === 'personal' && (
              <motion.div
                layoutId="activeAnalyticsModeIndicator"
                className="absolute inset-0 rounded-lg bg-emerald-500/15 border border-emerald-500/40 shadow-sm"
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 35
                }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" />
              <span>Личные траты</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('family')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeMode === 'family'
                ? 'text-teal-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            {activeMode === 'family' && (
              <motion.div
                layoutId="activeAnalyticsModeIndicator"
                className="absolute inset-0 rounded-lg bg-teal-500/15 border border-teal-500/40 shadow-sm"
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 35
                }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Траты семьи</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                Скоро
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Date & Period Filter Bar */}
      <DateRangeSelector
        filter={filterState}
        onChange={setFilterState}
      />

      {/* Mode View: Personal Analytics */}
      {activeMode === 'personal' && (
        <QueryErrorBoundary
          variant="widget"
          title="Сбой загрузки аналитики"
          subtitle="Не удалось сформировать графики трат и категорий. Остальные функции продолжают работать."
        >
          <PersonalAnalyticsWidget
            currentUser={currentUser}
            filter={filterState}
          />
        </QueryErrorBoundary>
      )}

      {/* Mode View: Family Analytics Preview */}
      {activeMode === 'family' && (
        <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-xl shadow-teal-950/40 ring-4 ring-teal-500/20">
            👨‍👩‍👧‍👦
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">Аналитика семейных трат (Этап 2)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              В следующем обновлении здесь появится сводная аналитика по каждому члену вашей семьи, сравнение вкладов в бюджет и умные рекомендации AI для оптимизации семейной продуктовой корзины.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveMode('personal')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Вернуться к личным тратам
          </button>
        </div>
      )}

    </div>
  );
};
