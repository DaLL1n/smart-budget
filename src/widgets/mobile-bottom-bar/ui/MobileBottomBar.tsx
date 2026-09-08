import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Plus, 
  Wallet, 
  Sparkles,
  X
} from 'lucide-react';
import { ActiveNavTab } from '../../top-navbar';

interface MobileBottomBarProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  onOpenAddExpense: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddExpense,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [showFinanceNotice, setShowFinanceNotice] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFinanceClick = () => {
    setShowFinanceNotice(true);
    setTimeout(() => setShowFinanceNotice(false), 3000);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Main Bottom Dock */}
      <nav 
        aria-label="Мобильная навигация" 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden overflow-visible bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-2xl shadow-2xl shadow-black/80 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))] transform-gpu translate-z-0"
      >
        {/* Toast notice for upcoming Finance sister app */}
        {showFinanceNotice && (
          <div 
            role="status"
            className="absolute bottom-16 left-4 right-4 z-50 p-3.5 rounded-2xl bg-slate-900/98 border border-emerald-500/40 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-2 text-xs animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>Финансы и доходы</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 uppercase">Скоро</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Единый учет доходов, счетов и общих трат вне продуктов
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Закрыть уведомление"
              onClick={() => setShowFinanceNotice(false)}
              className="p-1.5 text-slate-500 hover:text-white rounded-lg active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="max-w-md mx-auto grid grid-cols-5 items-center">
          {/* TAB 1: Обзор (Дашборд) */}
          <button
            type="button"
            aria-label="Перейти на обзор"
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'text-emerald-400 font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Обзор</span>
          </button>

          {/* TAB 2: Семья */}
          <button
            type="button"
            aria-label="Перейти в семейное пространство"
            aria-current={activeTab === 'family' ? 'page' : undefined}
            onClick={() => onTabChange('family')}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
              activeTab === 'family' 
                ? 'text-emerald-400 font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Семья</span>
          </button>

          {/* CENTER: Floating Action Button (+) */}
          <div className="flex justify-center items-center">
            <button
              type="button"
              onClick={onOpenAddExpense}
              aria-label="Записать покупку продуктов"
              title="Записать покупку продуктов"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 -mt-5 border-[3px] border-slate-900 active:scale-90 hover:scale-105 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <Plus className="w-6 h-6 stroke-[2.8]" />
            </button>
          </div>

          {/* TAB 3: Аналитика */}
          <button
            type="button"
            aria-label="Перейти в аналитику"
            aria-current={activeTab === 'analytics' ? 'page' : undefined}
            onClick={() => onTabChange('analytics')}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
              activeTab === 'analytics' 
                ? 'text-emerald-400 font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Аналитика</span>
          </button>

          {/* TAB 4: Финансы (sister app placeholder) */}
          <button
            type="button"
            aria-label="Раздел Финансы (скоро)"
            onClick={handleFinanceClick}
            className="flex flex-col items-center justify-center min-h-[48px] py-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer relative"
          >
            <div className="relative">
              <Wallet className="w-5 h-5 mb-0.5" />
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[10px] tracking-tight">Финансы</span>
          </button>
        </div>
      </nav>
    </>,
    document.body
  );
};
