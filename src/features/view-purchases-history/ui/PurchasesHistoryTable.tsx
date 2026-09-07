import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  showBuyer?: boolean;
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
  showBuyer,
  className = '',
}) => {
  const isBuyerVisible = showBuyer !== undefined ? showBuyer : members.length > 0;
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const handleConfirmDelete = async () => {
    if (!expenseToDelete || !onDeleteExpense) return;
    try {
      await Promise.resolve(onDeleteExpense(expenseToDelete.id));
      setExpenseToDelete(null);
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

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
  const columns = useMemo(() => {
    const cols: any[] = [
      // 1. Дата
      columnHelper.accessor('date', {
        header: 'Дата',
        cell: info => (
          <span className="font-mono text-xs text-slate-300 whitespace-nowrap">
            {formatShortDayMonthYear(info.getValue())}
          </span>
        ),
      }),
      // 2. Сумма
      columnHelper.accessor('amount', {
        header: 'Сумма',
        cell: info => (
          <span className="font-mono font-bold text-xs text-emerald-400 whitespace-nowrap">
            {formatRubles(info.getValue())}
          </span>
        ),
      }),
      // 3. Магазин
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
      // 4. Категория
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
    ];

    // 5. Кто купил (только в семейной аналитике)
    if (isBuyerVisible) {
      cols.push(
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
        })
      );
    }

    // 6. Действия
    cols.push(
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
                onClick={() => setExpenseToDelete(exp)}
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
      })
    );

    return cols;
  }, [isBuyerVisible, members, currentUserId, onDeleteExpense, deletingId]);

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
          {selectedDate && (
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
          )}
        </div>
      </div>

      {/* Content: Skeleton / Empty / Table */}
      {isLoading ? (
        <div className="space-y-3 py-2 animate-pulse">
          <div className="h-9 w-full bg-slate-800/40 rounded-xl" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-11 w-full bg-slate-800/25 rounded-xl border border-slate-800/40 flex items-center justify-between px-4 gap-4">
              <div className="w-20 h-3.5 bg-slate-700/50 rounded" />
              <div className="w-16 h-3.5 bg-slate-700/50 rounded" />
              <div className="w-24 h-3.5 bg-slate-700/50 rounded" />
              <div className="w-28 h-5 bg-slate-700/50 rounded-lg" />
              {isBuyerVisible && <div className="w-20 h-3.5 bg-slate-700/50 rounded hidden sm:block" />}
              <div className="w-6 h-3.5 bg-slate-700/50 rounded ml-auto" />
            </div>
          ))}
        </div>
      ) : table.getRowModel().rows.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          В этот период покупок не было
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className={`w-full ${isBuyerVisible ? 'min-w-[620px]' : 'min-w-[480px] sm:min-w-full'} table-fixed text-left border-collapse`}>
            {isBuyerVisible ? (
              <colgroup>
                {/* 1. Дата */}
                <col className="w-[15%]" />
                {/* 2. Сумма */}
                <col className="w-[14%]" />
                {/* 3. Магазин */}
                <col className="w-[18%]" />
                {/* 4. Категория */}
                <col className="w-[28%]" />
                {/* 5. Кто купил */}
                <col className="w-[19%]" />
                {/* 6. Действия */}
                <col className="w-[6%]" />
              </colgroup>
            ) : (
              <colgroup>
                {/* 1. Дата */}
                <col className="w-[18%]" />
                {/* 2. Сумма */}
                <col className="w-[18%]" />
                {/* 3. Магазин */}
                <col className="w-[23%]" />
                {/* 4. Категория */}
                <col className="w-[35%]" />
                {/* 5. Действия */}
                <col className="w-[6%]" />
              </colgroup>
            )}
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

      {/* Confirmation Modal for Deleting Purchase via Portal directly to body */}
      {expenseToDelete && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => {
            if (!deletingId) setExpenseToDelete(null);
          }}
        >
          <div 
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 relative my-auto animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            {/* Top decorative glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-sm">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="delete-modal-title" className="text-base font-bold text-white tracking-tight">
                    Удаление покупки
                  </h3>
                  <p className="text-xs text-slate-400">
                    Подтвердите удаление записи
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                disabled={!!deletingId}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expense Details Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">Товар / Категория:</span>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]" title={expenseToDelete.title || undefined}>
                  {expenseToDelete.title || (EXPENSE_CATEGORIES.find(c => c.id === expenseToDelete.category)?.label || 'Покупка')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">Магазин:</span>
                <span className="text-xs font-medium text-slate-300 truncate max-w-[200px]">
                  {POPULAR_STORES.find(s => s.id === expenseToDelete.storeId)?.name || expenseToDelete.storeId || 'Продуктовый'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">Дата:</span>
                <span className="text-xs font-mono text-slate-300">
                  {formatShortDayMonthYear(expenseToDelete.date)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-300">Сумма:</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {formatRubles(expenseToDelete.amount)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Вы уверены, что хотите удалить эту покупку? Действие нельзя отменить.
            </p>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                disabled={!!deletingId}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={!!deletingId}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deletingId === expenseToDelete.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Удаление...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Да, удалить</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
