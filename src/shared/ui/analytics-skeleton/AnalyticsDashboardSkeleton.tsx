import React from 'react';

interface AnalyticsDashboardSkeletonProps {
  isFamily?: boolean;
}

export const AnalyticsDashboardSkeleton: React.FC<AnalyticsDashboardSkeletonProps> = ({
  isFamily = false,
}) => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* 1. KPI Metric Cards: 3 distinct cards matching real widget layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Budget / Total Spent */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/30 shrink-0" />
              <div className="h-3.5 w-32 bg-slate-800 rounded" />
            </div>
            <div className="h-4 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20" />
          </div>

          <div>
            <div className="h-8 sm:h-9 w-28 sm:w-36 bg-slate-800/90 rounded-lg" />
            <div className="h-3.5 w-44 sm:w-52 bg-slate-800/50 rounded mt-1.5" />
          </div>

          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
            <div className="h-full rounded-full bg-emerald-500/30 w-1/4" />
          </div>
        </div>

        {/* Card 2: Average Daily Burn */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-teal-500/30 shrink-0" />
              <div className="h-3.5 w-36 bg-slate-800 rounded" />
            </div>
          </div>

          <div>
            <div className="h-8 sm:h-9 w-24 sm:w-32 bg-slate-800/90 rounded-lg" />
            <div className="h-3.5 w-36 sm:w-44 bg-slate-800/50 rounded mt-1.5" />
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-500/30 shrink-0" />
            <div className="h-3 w-36 bg-slate-800/50 rounded" />
          </div>
        </div>

        {/* Card 3: Remaining Budget */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-teal-500/30 shrink-0" />
              <div className="h-3.5 w-32 bg-slate-800 rounded" />
            </div>
          </div>

          <div>
            <div className="h-8 sm:h-9 w-28 sm:w-36 bg-slate-800/90 rounded-lg" />
            <div className="h-3.5 w-36 sm:w-44 bg-slate-800/50 rounded mt-1.5" />
          </div>

          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
            <div className="h-full rounded-full bg-teal-500/30 w-3/4" />
          </div>
        </div>
      </div>

      {/* 2. Member Breakdown Skeleton (Family mode only) */}
      {isFamily && (
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-slate-800" />
            <div className="h-3.5 w-48 bg-slate-800 rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-800" />
                    <div className="h-3 w-20 bg-slate-800 rounded" />
                  </div>
                  <div className="h-3 w-16 bg-slate-800 rounded" />
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{ width: `${40 * i}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Charts Grid: 2 Equal Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dynamics Chart */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-800" />
            <div className="h-4 w-44 bg-slate-800 rounded" />
          </div>
          <div className="h-56 w-full bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-end gap-2 sm:gap-3 p-4">
            {[35, 60, 25, 80, 50, 40, 75].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full bg-slate-800/80 rounded-t-md transition-all"
                  style={{ height: `${val}%` }}
                />
                <div className="h-2.5 w-6 bg-slate-800/40 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Categories Donut Chart */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-800" />
            <div className="h-4 w-36 bg-slate-800 rounded" />
          </div>
          <div className="h-56 w-full bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center justify-center p-4">
            <div className="w-36 h-36 rounded-full border-[14px] border-slate-800/70 border-t-slate-700/80 flex items-center justify-center">
              <div className="w-14 h-4 bg-slate-800/50 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Purchases History Table Skeleton */}
      <div className="p-3.5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-800" />
            <div className="h-4 w-32 bg-slate-800 rounded" />
          </div>
          <div className="h-7 w-32 bg-slate-800/60 rounded-xl" />
        </div>

        <div className="space-y-2.5 py-2">
          <div className="h-9 w-full bg-slate-800/40 rounded-xl" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-11 w-full bg-slate-800/25 rounded-xl border border-slate-800/40 flex items-center justify-between px-4 gap-4"
            >
              <div className="w-20 h-3.5 bg-slate-700/50 rounded" />
              <div className="w-16 h-3.5 bg-slate-700/50 rounded" />
              <div className="w-24 h-3.5 bg-slate-700/50 rounded" />
              <div className="w-28 h-5 bg-slate-700/50 rounded-lg" />
              {isFamily && <div className="w-20 h-3.5 bg-slate-700/50 rounded hidden sm:block" />}
              <div className="w-6 h-3.5 bg-slate-700/50 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
