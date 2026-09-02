import React from 'react';
import { motion } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { DateFilterState, DatePeriod, formatDateIso } from '../../../entities/expense';

interface DateRangeSelectorProps {
  filter: DateFilterState;
  onChange: (filter: DateFilterState) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  filter,
  onChange,
}) => {
  const periods: { id: DatePeriod; label: string }[] = [
    { id: 'today', label: 'Сегодня' },
    { id: 'yesterday', label: 'Вчера' },
    { id: '7days', label: '7 дней' },
    { id: 'month', label: 'Текущий месяц' },
  ];

  const handlePeriodClick = (p: DatePeriod) => {
    onChange({ period: p });
  };

  const handleCustomDateChange = (dateVal: string) => {
    if (!dateVal) return;
    onChange({
      period: 'custom_day',
      customDate: dateVal,
    });
  };

  const shiftCustomDay = (days: number) => {
    const baseStr = filter.customDate || (filter.period === 'yesterday' 
      ? formatDateIso(new Date(Date.now() - 86400000))
      : formatDateIso(new Date()));
    
    const [y, m, d] = baseStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);

    onChange({
      period: 'custom_day',
      customDate: formatDateIso(dateObj),
    });
  };

  const currentDateValue = filter.period === 'today'
    ? formatDateIso(new Date())
    : filter.period === 'yesterday'
    ? formatDateIso(new Date(Date.now() - 86400000))
    : filter.customDate || formatDateIso(new Date());

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl shadow-lg">
      
      {/* Preset Pills */}
      <div className="flex items-center justify-evenly gap-1 sm:gap-1.5 overflow-x-auto custom-scrollbar p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 shrink-0">
        {periods.map((item) => {
          const isSelected = filter.period === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePeriodClick(item.id)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isSelected
                  ? 'text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeDatePeriodIndicator"
                  className="absolute inset-0 rounded-lg bg-emerald-500/15 border border-emerald-500/40 shadow-sm"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 35
                  }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Day Picker with Prev/Next step buttons */}
      <div className="flex items-center justify-center sm:justify-end gap-1.5 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => shiftCustomDay(-1)}
          className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
          title="Предыдущий день"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div 
          onClick={() => {
            const input = document.getElementById('analytics-date-picker-input') as HTMLInputElement;
            try {
              input?.showPicker?.();
            } catch {}
          }}
          className="relative inline-flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <input
            id="analytics-date-picker-input"
            type="date"
            value={currentDateValue}
            onChange={(e) => handleCustomDateChange(e.target.value)}
            className="w-auto bg-transparent border-0 text-slate-100 text-xs font-mono p-0 focus:outline-none cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={() => shiftCustomDay(1)}
          className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
          title="Следующий день"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
