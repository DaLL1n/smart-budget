import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  WifiOff,
  Zap
} from 'lucide-react';
import { User, useAuth } from '../../../entities/user';
import { NotificationBell } from '../../../features/view-notifications';
import { useNetworkStatus } from '../../../shared/lib';

export type ActiveNavTab = 'dashboard' | 'family' | 'analytics';

interface TopNavbarProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  onOpenSettings: () => void;
  onFamilyUpdated?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onFamilyUpdated,
}) => {
  const { currentUser, logout } = useAuth();
  const isOnline = useNetworkStatus();

  if (!currentUser) return null;

  const navItems = [
    { id: 'dashboard' as const, label: 'Дашборд', icon: LayoutDashboard },
    { id: 'family' as const, label: 'Семья', icon: Users, badge: currentUser.familyId ? 'Активна' : null },
    { id: 'analytics' as const, label: 'Аналитика', icon: BarChart3 },
  ];

  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-2xl sticky top-0 z-40 shadow-lg shadow-black/40">
      {/* Top Header Row */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* User Profile on the left */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0" 
            onClick={() => onTabChange('dashboard')}
            title="Перейти на дашборд"
          >
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${currentUser.avatarColor || 'from-emerald-400 to-teal-600'} flex items-center justify-center text-lg sm:text-xl shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform shrink-0`}>
              {currentUser.avatar || '🥑'}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-tight truncate">
                  {currentUser.name}
                </span>
                {!isOnline && (
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono flex items-center gap-0.5 shrink-0" title="Работа в автономном режиме">
                    <WifiOff className="w-2.5 h-2.5" />
                    <span className="hidden xs:inline">Офлайн</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px] sm:max-w-[220px]" title={currentUser.email}>
                {currentUser.email}
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs (Desktop: sm and up) */}
        <nav className="hidden sm:flex items-center gap-1 sm:gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer leading-none ${
                  isActive
                    ? 'text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTabIndicatorDesktop"
                    className="absolute inset-0 rounded-lg bg-emerald-500/15 border border-emerald-500/40 shadow-sm"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35
                    }}
                  />
                )}

                <span className="relative z-10 inline-flex items-center gap-1.5 leading-none">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap leading-none">{item.label}</span>
                  {item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 self-center mt-[2px]" />
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Notification Bell + Settings + Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <NotificationBell 
            currentUser={currentUser} 
            onFamilyUpdated={onFamilyUpdated} 
          />

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium shrink-0"
            title="Параметры профиля и бюджета"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline">Параметры</span>
          </button>

          <div className="flex items-center pl-1 border-l border-slate-800">
            <button
              type="button"
              onClick={() => logout()}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Выйти из аккаунта"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Navigation Sub-Bar with Full Page Names under Header */}
      <div className="sm:hidden px-3 pb-2.5 pt-0.5">
        <nav className="flex items-center justify-between gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer leading-none ${
                  isActive
                    ? 'text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTabIndicatorMobile"
                    className="absolute inset-0 rounded-lg bg-emerald-500/15 border border-emerald-500/40 shadow-sm"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35
                    }}
                  />
                )}

                <span className="relative z-10 inline-flex items-center gap-1.5 leading-none">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap leading-none">{item.label}</span>
                  {item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 self-center mt-[2px]" />
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
