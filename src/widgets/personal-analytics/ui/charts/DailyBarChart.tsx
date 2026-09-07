import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyBarItem, formatDayMonth, formatShortDay } from '../../../../entities/expense';
import { formatRubles } from '../../../../entities/budget';
import { defineChart, barY, ruleY } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import { Chart } from '@tanstack/charts/react/tooltip';

export interface DailyBarChartProps {
  items: DailyBarItem[];
  dailyLimit: number;
  selectedDate?: string | null;
  onSelectDate?: (date: string | null) => void;
}

export const DailyBarChart: React.FC<DailyBarChartProps> = ({
  items,
  dailyLimit,
  selectedDate,
  onSelectDate,
}) => {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Нет данных о расходах за выбранный период
      </div>
    );
  }

  // Responsive window size: 7 days on desktop (>= 1024px), 3 days on mobile/tablet (< 1024px)
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 ? 7 : 3;
    }
    return 7;
  });

  useEffect(() => {
    const handleResize = () => {
      const nextSize = window.innerWidth >= 1024 ? 7 : 3;
      setPageSize((prev) => (prev !== nextSize ? nextSize : prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isPaginated = items.length > pageSize;
  const totalPages = isPaginated ? Math.ceil(items.length / pageSize) : 1;

  // Default to the page containing the current day or the first page
  const defaultPage = useMemo(() => {
    if (!isPaginated) return 0;
    const currentDayIdx = items.findIndex((i) => i.isCurrentDay);
    if (currentDayIdx !== -1) {
      return Math.floor(currentDayIdx / pageSize);
    }
    return 0;
  }, [items, isPaginated, pageSize]);

  const [page, setPage] = useState<number>(defaultPage);

  // Sync page when items or pageSize changes
  useEffect(() => {
    setPage(defaultPage);
  }, [defaultPage, pageSize]);

  // Auto-scroll to selectedDate page if set
  useEffect(() => {
    if (selectedDate && isPaginated) {
      const idx = items.findIndex(i => i.date === selectedDate);
      if (idx !== -1) {
        setPage(Math.floor(idx / pageSize));
      }
    }
  }, [selectedDate, isPaginated, items, pageSize]);

  // Sliced items for the active window
  const visibleItems = useMemo(() => {
    if (!isPaginated) return items;
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize, isPaginated]);

  // Stable scale based on full period dataset
  const maxAmount = Math.max(...items.map((i) => i.amount), 0);
  const maxScale = Math.max(dailyLimit * 1.25, maxAmount * 1.15, 1000);

  const chartDefinition = useMemo(() => {
    const limitData = [{ limit: dailyLimit }];

    return defineChart({
      marks: [
        // Daily expense bars (3 at a time when >= 7 days)
        barY(visibleItems, {
          x: 'dayLabel',
          y: 'amount',
          fill: (d) => {
            if (selectedDate && d.date === selectedDate) {
              return '#10b981';
            }
            if (selectedDate && d.date !== selectedDate) {
              return d.isOverLimit ? '#f43f5e55' : '#10b98155';
            }
            return d.isOverLimit ? '#f43f5e' : '#10b981';
          },
          radius: 6,
          inset: 3,
          maxThickness: 36,
          key: (d) => d.date,
        }),
        // Daily budget limit reference line
        ruleY(limitData, {
          y: 'limit',
          stroke: '#fbbf24',
          strokeDasharray: '4 4',
          strokeWidth: 1.5,
          strokeOpacity: 0.85,
        }),
      ],
      scales: {
        x: {
          scale: () => scaleBand<string>().padding(0.28),
        },
        y: {
          scale: () => scaleLinear().domain([0, maxScale]),
          nice: true,
          grid: true,
          axis: {
            ticks: {
              format: (val: number) => `${Math.round(val)} ₽`,
            },
          },
        },
      },
      tooltip,
    });
  }, [visibleItems, dailyLimit, maxScale, selectedDate]);

  return (
    <div className="w-full space-y-3">
      {/* Target limit badge & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <span className="text-[11px] text-slate-300">В норме</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm ml-1" />
          <span className="text-[11px] text-slate-300">Превышение</span>
        </div>
        <div className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/95 text-amber-300 border border-amber-500/40 shadow-sm whitespace-nowrap">
          Лимит: {formatRubles(dailyLimit)}
        </div>
      </div>

      {/* TanStack Charts Container */}
      <div className="w-full h-48 bg-slate-950/40 rounded-xl p-2 border border-slate-800/60 overflow-hidden">
        <Chart
          definition={chartDefinition}
          height={175}
          ariaLabel="Динамика расходов по дням"
          renderTooltipBody={({ points }) => {
            const point = points[0];
            if (!point) return null;
            const datum = point.datum as DailyBarItem;
            if (!datum) return null;
            return (
              <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs min-w-[145px] space-y-1.5 pointer-events-none text-left">
                <div className="text-[11px] font-medium text-slate-300 border-b border-slate-800/80 pb-1">
                  {datum.dayLabel}
                </div>

                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] text-slate-400">Расход:</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {formatRubles(datum.amount)}
                  </span>
                </div>

                <div className="pt-1 border-t border-slate-800/80">
                  {datum.isOverLimit ? (
                    <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-center font-medium">
                      Лимит превышен (+{formatRubles(datum.amount - dailyLimit)})
                    </div>
                  ) : datum.amount > 0 ? (
                    <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-center font-medium">
                      В рамках лимита
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 text-center">
                      Нет расходов
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Interactive Day Selection Chips for the Visible Window */}
      {visibleItems.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
          {visibleItems.map((item) => {
            const isSelected = selectedDate === item.date;
            return (
              <button
                key={item.date}
                type="button"
                onClick={() => onSelectDate?.(isSelected ? null : item.date)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md ring-2 ring-emerald-400'
                    : item.amount > 0
                    ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
                    : 'bg-slate-950/40 hover:bg-slate-800/60 text-slate-400 border border-slate-800/60'
                }`}
                title={isSelected ? 'Снять выбор дня' : `Показать траты за ${item.dayLabel}`}
              >
                <span>{item.dayLabel}</span>
                {item.amount > 0 ? (
                  <span className={`font-semibold ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`}>
                    {formatRubles(item.amount)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">0 ₽</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination Controls for 3-Day Sliding Window */}
      {isPaginated && totalPages > 1 && (
        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/60 w-full min-w-0">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-medium shrink-0 cursor-pointer"
            title="Предыдущие дни"
          >
            <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] hidden sm:inline">Назад</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 font-medium min-w-0 flex-1 text-center truncate">
            <span className="text-[11px] truncate">
              {visibleItems[0] ? formatShortDay(visibleItems[0].date) : ''}
              {visibleItems.length > 1 && ` — ${formatShortDay(visibleItems[visibleItems.length - 1].date)}`}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700/60 shrink-0">
              {page + 1}/{totalPages}
            </span>
          </div>

          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-medium shrink-0 cursor-pointer"
            title="Следующие дни"
          >
            <span className="text-[11px] hidden sm:inline">Вперед</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
};
