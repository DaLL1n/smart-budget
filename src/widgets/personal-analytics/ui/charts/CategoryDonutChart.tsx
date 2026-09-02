import React, { useMemo, useState } from 'react';
import { CategoryBreakdownItem } from '../../../../entities/expense';
import { formatRubles } from '../../../../entities/budget';
import { defineChart } from '@tanstack/charts';
import { pie, polar, radialArc } from '@tanstack/charts/polar';
import { tooltip } from '@tanstack/charts/tooltip';
import { Chart } from '@tanstack/charts/react/tooltip';

interface CategoryDonutChartProps {
  items: CategoryBreakdownItem[];
  totalAmount: number;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  items,
  totalAmount,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<CategoryBreakdownItem | null>(null);

  const chartDefinition = useMemo(() => {
    if (items.length === 0 || totalAmount === 0) return null;

    const slices = pie<CategoryBreakdownItem>(items, {
      value: (d) => d.amount,
    });

    const categoryIds = items.map((i) => i.category.id);
    const categoryColors = items.map((i) => i.category.color);

    return defineChart({
      marks: [
        polar({
          inset: 4,
          radiusRatio: 0.92,
          marks: [
            radialArc(slices, {
              innerRadius: ({ radius }) => radius * 0.62,
              cornerRadius: 4,
              color: (d) => d.category.id,
              key: (d) => d.category.id,
              fill: (d) => d.category.color,
            }),
          ],
          scales: {
            angle: null,
            radius: null,
          },
        }),
      ],
      scales: {
        x: null,
        y: null,
      },
      color: {
        domain: categoryIds,
        range: categoryColors,
      },
      tooltip,
    });
  }, [items, totalAmount]);

  if (items.length === 0 || totalAmount === 0 || !chartDefinition) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Нет расходов по категориям за выбранный период
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start xl:items-center justify-between gap-5 sm:gap-6 w-full">
      {/* TanStack Polar Donut Chart Container */}
      <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
        <Chart
          definition={chartDefinition}
          height={176}
          width={176}
          ariaLabel="Категории продуктов"
          onFocusChange={(point) => {
            if (point && point.datum) {
              const item = point.datum as unknown as CategoryBreakdownItem;
              if (item?.category) setHoveredCategory(item);
            } else {
              setHoveredCategory(null);
            }
          }}
          renderTooltipBody={({ points }) => {
            const point = points[0];
            if (!point) return null;
            const item = point.datum as unknown as CategoryBreakdownItem;
            if (!item?.category) return null;
            return (
              <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs min-w-[145px] space-y-1.5 pointer-events-none text-left">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span className="text-base leading-none">{item.category.icon}</span>
                  <span className="font-bold text-slate-100 truncate text-xs">
                    {item.category.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] text-slate-400">Сумма:</span>
                  <span className="font-mono text-sm font-bold text-white">
                    {formatRubles(item.amount)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] text-slate-400">Доля:</span>
                  <span className="font-mono text-xs font-bold text-teal-400">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          }}
        />

        {/* Center Donut Summary */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
          {hoveredCategory ? (
            <>
              <span className="text-xl mb-0.5">{hoveredCategory.category.icon}</span>
              <span className="text-xs font-bold text-white font-mono leading-tight">
                {formatRubles(hoveredCategory.amount)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]">
                {hoveredCategory.category.label}
              </span>
              <span className="text-[10px] font-mono text-teal-400 mt-0.5">
                {hoveredCategory.percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Итого</span>
              <span className="text-sm font-extrabold text-white font-mono">
                {formatRubles(totalAmount)}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">100%</span>
            </>
          )}
        </div>
      </div>

      {/* Legend & Breakdown List */}
      <div className="flex-1 min-w-0 w-full space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-0.5">
        {items.map((item) => {
          const isHovered = hoveredCategory?.category.id === item.category.id;
          return (
            <div
              key={item.category.id}
              onMouseEnter={() => setHoveredCategory(item)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 text-xs cursor-pointer ${
                isHovered
                  ? 'bg-slate-800/90 border border-slate-700 shadow-md ring-1 ring-slate-700/50'
                  : 'bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: item.category.color }}
                />
                <span className="text-base shrink-0">{item.category.icon}</span>
                <span className="font-semibold text-slate-200 truncate text-[11px] sm:text-xs">
                  {item.category.label}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-slate-100 font-bold text-[11px] sm:text-xs">
                  {formatRubles(item.amount)}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
