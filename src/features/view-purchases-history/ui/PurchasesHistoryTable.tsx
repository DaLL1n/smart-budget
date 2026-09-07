import React, { useMemo, useState, useEffect } from 'react';
import { 
  Receipt,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  X
} from 'lucide-react';
import { 
  useLegacyTable, 
  legacyCreateColumnHelper, 
  getCoreRowModel, 
  getSortedRowModel,
  getPaginationRowModel
} from '@tanstack/react-table/legacy';
import { flexRender } from '@tanstack/react-table';
import { SortingState, PaginationState } from '@tanstack/table-core';
import { Expense, EXPENSE_CATEGORIES, formatShortDayMonthYear } from '../../../entities/expense';
import { POPULAR_STORES } from '../../../entities/store';
import { formatRubles } from '../../../entities/budget';
import { FamilyMember } from '../../../entities/family';

export interface PurchasesHistoryTableProps {
  expenses: Expense[];
  totalPeriodExpensesCount?: number;
  isLoading?: boolean;
  selectedDate?: string | null;
  periodTitle?: string;
  onResetDateFilter?: () => void;
  onDeleteExpense?: (expenseId: string) => Promise<void> | void;
  deletingId?: string | null;
  members?: FamilyMember[];
  currentUserId?: string;
  className?: string;
}

export const PurchasesHistoryTable: React.FC<PurchasesHistoryTableProps> = ({
  expenses,
  totalPeriodExpensesCount,
  isLoading = false,
  selectedDate,
  periodTitle,
  onResetDateFilter,
  onDeleteExpense,
  deletingId,
  members = [],
  currentUserId,
  className = '',
}) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);

  const getInitialPageSize = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 5;
    }
    return 10;
  };

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: getInitialPageSize(),
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      setPagination(prev => {
        const newSize = isMobile ? 5 : 10;
        if (prev.pageSize === newSize) return prev;
        return { ...prev, pageSize: newSize, pageIndex: 0 };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset pagination when data or selected date changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [expenses.length, selectedDate]);

  const columnHelper = legacyCreateColumnHelper<Expense>();
  const columns = useMemo(() => [
    columnHelper.accessor('date', {
      header: 'Дата',
      cell: info => (
        <span className="font-mono text-xs text-slate-300 whitespace-nowrap">
          {formatShortDayMonthYear(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('userId', {
      header: 'Кто купил',
      cell: info => {
        const uId = info.getValue();
        const member = members.find(m => m.userId === uId);
        const isCurrent = uId === currentUserId;
        const displayName = member?.name || (isCurrent ? 'Вы' : 'Участник');
        const avatar = member?.avatar || (isCurrent ? '🥑' : '👤');
        const avatarColor = member?.avatarColor || 'from-emerald-400 to-teal-500';

        return (
          <div className="flex items-center gap-2 min-w-0 whitespace-nowrap">
            <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${avatarColor} flex items-center justify-center text-[10px] shrink-0`}>
              {avatar}
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate">
              {displayName}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('category', {
      header: 'Категория',
      cell: info => {
        const exp = info.row.original;
        const catId = info.getValue();
        const cat = EXPENSE_CATEGORIES.find(c => c.id === catId) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 whitespace-nowrap max-w-full">
              <span className="shrink-0">{cat.icon}</span>
              <span className="truncate">{cat.label}</span>
            </span>
            {exp.title && exp.title.toLowerCase() !== cat.label.toLowerCase() && (
              <span className="text-xs text-slate-400 truncate hidden sm:inline" title={exp.title}>
                ({exp.title})
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('storeId', {
      header: 'Магазин',
      cell: info => {
        const sId = info.getValue();
        const storeObj = POPULAR_STORES.find(s => s.id === sId);
        const storeColor = storeObj?.color || '#10b981';
        return (
          <div className="flex items-center gap-1.5 min-w-0 whitespace-nowrap">
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: storeColor }}
            />
            <span className="text-xs text-slate-300 truncate">
              {storeObj?.name || sId || 'Продуктовый'}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('amount', {
      header: 'Сумма',
      cell: info => (
        <span className="font-mono font-bold text-xs text-emerald-400 whitespace-nowrap">
          {formatRubles(info.getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: info => {
        if (!onDeleteExpense) return null;
        const exp = info.row.original;
        const isDeleting = deletingId === exp.id;
        return (
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                if (window.confirm('Удалить эту запись о расходе?')) {
                  onDeleteExpense(exp.id);
                }
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-40"
              title="Удалить запись"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        );
      },
    }),
  ], [members, currentUserId, onDeleteExpense, deletingId]);

  const table = useLegacyTable({
    data: expenses,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className={`p-3.5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="text-sm font-bold text-slate-100">
            История покупок
          </h3>
          {selectedDate ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
              <span>{formatShortDayMonthYear(selectedDate)}</span>
              {onResetDateFilter && (
                <button
                  type="button"
                  onClick={onResetDateFilter}
                  className="hover:text-white p-0.5 rounded transition-colors cursor-pointer text-emerald-400"
                  title="Показать все дни периода"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : periodTitle ? (
            <span className="text-xs text-slate-400 font-mono">
              ({periodTitle})
            </span>
          ) : null}
        </div>

        {selectedDate && onResetDateFilter && (
          <button
            type="button"
            onClick={onResetDateFilter}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-medium self-start sm:self-auto"
          >
            Сбросить фильтр дня {typeof totalPeriodExpensesCount === 'number' && `(всего: ${totalPeriodExpensesCount})`}
          </button>
        )}
      </div>

      {/* Content: Skeleton / Empty / Table */}
      {isLoading ? (
        <div className="space-y-3 py-2 animate-pulse">
          <div className="h-9 w-full bg-slate-800/40 rounded-xl" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-11 w-full bg-slate-800/25 rounded-xl border border-slate-800/40 flex items-center justify-between px-4 gap-4">
              <div className="w-20 h-3.5 bg-slate-700/50 rounded" />
              <div className="w-24 h-3.5 bg-slate-700/50 rounded hidden sm:block" />
              <div className="w-28 h-5 bg-slate-700/50 rounded-lg" />
              <div className="w-24 h-3.5 bg-slate-700/50 rounded" />
              <div className="w-16 h-3.5 bg-slate-700/50 rounded ml-auto" />
            </div>
          ))}
        </div>
      ) : table.getRowModel().rows.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          {selectedDate 
            ? `Нет зарегистрированных покупок за ${formatShortDayMonthYear(selectedDate)}`
            : periodTitle 
            ? `Нет зарегистрированных покупок за выбранный период (${periodTitle})`
            : 'Нет зарегистрированных покупок'}
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[620px] table-fixed text-left border-collapse">
            <colgroup>
              <col className="w-[17%]" />
              <col className="w-[19%]" />
              <col className="w-[26%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-800/80 text-[11px] text-slate-400 uppercase tracking-wider text-left">
                  {headerGroup.headers.map(header => {
                    const canSort = header.column.getCanSort();
                    return (
                      <th 
                        key={header.id} 
                        className={`pb-3 px-3 font-semibold select-none transition-colors whitespace-nowrap text-left ${
                          canSort ? 'cursor-pointer hover:text-white' : ''
                        }`}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <div className="flex items-center gap-1.5 whitespace-nowrap text-left">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && ({
                            asc: <ArrowUpDown className="w-3 h-3 text-emerald-400 rotate-180 shrink-0" />,
                            desc: <ArrowUpDown className="w-3 h-3 text-emerald-400 shrink-0" />,
                          }[header.column.getIsSorted() as string] ?? null)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors text-left">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="py-3 px-3 text-left">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TanStack Table Pagination Controls */}
      {!isLoading && table.getPageCount() > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="text-slate-400 font-mono text-[11px] text-center sm:text-left">
            Показано <span className="text-slate-200 font-semibold">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span>–
            <span className="text-slate-200 font-semibold">
              {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, expenses.length)}
            </span> из <span className="text-slate-200 font-semibold">{expenses.length}</span> покупок
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>

            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-slate-300 text-xs">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </div>

            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer text-xs"
            >
              <span>Вперед</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
