import React, { useSyncExternalStore } from 'react';
import { AnalyticsDashboardSkeleton } from '../analytics-skeleton/AnalyticsDashboardSkeleton';

const subscribe = () => () => {};
const getIsFamily = () => {
  try {
    return localStorage.getItem('smart_budget_analytics_mode') === 'family';
  } catch {
    return false;
  }
};

export const AppShellSkeleton: React.FC = () => {
  const isFamilyMode = useSyncExternalStore(subscribe, getIsFamily, () => false);

  return (
    <div className="min-h-screen min-h-dvh min-w-[375px] flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* 1. Header / TopNavbar Skeleton - Exactly mirrors TopNavbar */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-2xl sticky top-0 z-40 shadow-lg shadow-black/40">
        {/* Top Header Row */}
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* User Profile on the left */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/90 animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0 gap-1 sm:gap-1.5">
                <div className="h-3.5 sm:h-4 w-16 sm:w-24 bg-slate-800/90 rounded animate-pulse" />
                <div className="h-2.5 w-24 sm:w-32 bg-slate-800/50 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs Pill (hidden on mobile) */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
            <div className="h-7 w-20 rounded-lg bg-slate-900/60 animate-pulse" />
            <div className="h-7 w-16 rounded-lg bg-slate-900/60 animate-pulse" />
            <div className="h-7 w-24 rounded-lg bg-emerald-500/15 border border-emerald-500/30 animate-pulse" />
          </nav>

          {/* Right Actions: Notification Bell + Settings + Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/80 border border-slate-800 animate-pulse shrink-0" />
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/80 border border-slate-800 animate-pulse shrink-0" />
            <div className="flex items-center pl-1 border-l border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-slate-900/50 border border-transparent animate-pulse shrink-0" />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Sub-Bar (sm:hidden px-3 pb-2.5 pt-0.5) */}
        <div className="sm:hidden px-3 pb-2.5 pt-0.5">
          <nav className="flex items-center justify-between gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 w-full">
            <div className="flex-1 h-7 rounded-lg bg-slate-900/60 animate-pulse" />
            <div className="flex-1 h-7 rounded-lg bg-slate-900/60 animate-pulse" />
            <div className="flex-1 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 animate-pulse" />
          </nav>
        </div>
      </header>

      {/* 2. Main View Container */}
      <main id="app-main-view" className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-safe flex flex-col items-center">
        <div className="w-full space-y-4 sm:space-y-6">
          
          {/* Top Header & Sub-section Switcher Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 animate-pulse" />
              <div className="space-y-1">
                <div className="h-5 w-44 bg-slate-800/90 rounded animate-pulse" />
                <div className="h-3.5 w-60 sm:w-72 bg-slate-800/50 rounded animate-pulse" />
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800/90 shrink-0 mx-auto sm:mx-0 self-center sm:self-auto">
              <div className={`h-7 w-28 rounded-lg ${!isFamilyMode ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-slate-900/60'} animate-pulse`} />
              <div className={`h-7 w-36 rounded-lg ${isFamilyMode ? 'bg-teal-500/15 border border-teal-500/30' : 'bg-slate-900/60'} animate-pulse`} />
            </div>
          </div>

          {/* Date & Period Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl shadow-lg">
            {/* Preset Pills */}
            <div className="flex items-center justify-evenly gap-1 sm:gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 shrink-0">
              <div className="h-7 w-16 sm:w-18 bg-slate-900/60 rounded-lg animate-pulse" />
              <div className="h-7 w-16 sm:w-20 bg-slate-900/60 rounded-lg animate-pulse" />
              <div className="h-7 w-16 sm:w-18 bg-slate-900/60 rounded-lg animate-pulse" />
              <div className="h-7 w-24 sm:w-28 bg-emerald-500/15 border border-emerald-500/30 rounded-lg animate-pulse" />
            </div>

            {/* Day Picker with Prev/Next step buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-1.5 w-full sm:w-auto">
              <div className="w-7 h-7 rounded-xl bg-slate-950/70 border border-slate-800 animate-pulse shrink-0" />
              <div className="h-7 w-32 rounded-xl bg-slate-950/80 border border-slate-800 animate-pulse shrink-0 flex items-center justify-center gap-2 px-3">
                <div className="w-3.5 h-3.5 rounded bg-emerald-400/30 shrink-0" />
                <div className="h-3 w-16 bg-slate-700/60 rounded" />
              </div>
              <div className="w-7 h-7 rounded-xl bg-slate-950/70 border border-slate-800 animate-pulse shrink-0" />
            </div>
          </div>

          {/* Core Analytics Dashboard Skeleton (KPIs, Breakdown, Charts, Purchases History Table) */}
          <AnalyticsDashboardSkeleton isFamily={isFamilyMode} />
        </div>
      </main>
    </div>
  );
};
