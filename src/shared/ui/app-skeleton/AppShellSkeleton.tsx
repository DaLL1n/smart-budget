import React from 'react';
import { AnalyticsDashboardSkeleton } from '../analytics-skeleton/AnalyticsDashboardSkeleton';

export const AppShellSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen min-w-[375px] flex flex-col bg-slate-950 text-slate-100">
      {/* 1. Header / TopNavbar Skeleton */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-2xl sticky top-0 z-40 shadow-lg shadow-black/40">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Avatar + Name Pill */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 animate-pulse shrink-0" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 sm:h-4 w-24 sm:w-28 bg-slate-800/80 rounded animate-pulse" />
              <div className="h-2.5 w-16 sm:w-20 bg-slate-800/50 rounded animate-pulse" />
            </div>
          </div>

          {/* Center: Navigation Tabs Pill */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/90 shrink-0">
            <div className="h-7 sm:h-8 w-16 sm:w-24 rounded-xl bg-emerald-500/15 border border-emerald-500/30 animate-pulse" />
            <div className="h-7 sm:h-8 w-14 sm:w-20 rounded-xl bg-slate-900/60 animate-pulse" />
            <div className="h-7 sm:h-8 w-16 sm:w-24 rounded-xl bg-slate-900/60 animate-pulse" />
          </div>

          {/* Right: Settings / Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 animate-pulse" />
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 animate-pulse hidden sm:block" />
          </div>
        </div>
      </header>

      {/* 2. Main Page View Container */}
      <main id="app-main-view" className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-safe flex flex-col items-center">
        <div className="w-full space-y-4 sm:space-y-6">
          {/* Page Top Header Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl shadow-xl animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-800 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-5 w-44 bg-slate-800 rounded" />
                <div className="h-3 w-64 bg-slate-800/60 rounded hidden sm:block" />
              </div>
            </div>
            <div className="h-9 w-52 rounded-xl bg-slate-950/80 border border-slate-800/90 mx-auto sm:mx-0 shrink-0" />
          </div>

          {/* Date & Filter Bar */}
          <div className="p-1.5 sm:p-2 bg-slate-900/90 border border-slate-800/80 rounded-2xl backdrop-blur-xl animate-pulse flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-20 bg-slate-800/80 rounded-xl" />
            <div className="h-8 w-24 bg-slate-800/50 rounded-xl" />
            <div className="h-8 w-20 bg-slate-800/50 rounded-xl" />
            <div className="h-8 w-20 bg-slate-800/50 rounded-xl hidden sm:block" />
            <div className="h-8 w-28 bg-slate-800/50 rounded-xl ml-auto" />
          </div>

          {/* Core Analytics Dashboard Skeleton (KPIs, Charts, Purchases History Table) */}
          <AnalyticsDashboardSkeleton isFamily={false} />
        </div>
      </main>
    </div>
  );
};
