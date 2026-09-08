import React, { useState } from 'react';
import { Receipt, Plus, Check, Store } from 'lucide-react';
import { Currency } from '../../../entities/budget';
import { StoreOption, POPULAR_STORES } from '../../../entities/store';

interface AddExpenseFormProps {
  currency: Currency;
  onAddExpense: (amount: number, note?: string, storeId?: string) => Promise<void> | void;
  isLoading?: boolean;
  userStores?: StoreOption[];
}

const QUICK_AMOUNTS = [300, 500, 1000, 2000];

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  currency,
  onAddExpense,
  isLoading = false,
  userStores = [],
}) => {
  const [newExpense, setNewExpense] = useState<string>('');
  const [expenseNote, setExpenseNote] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    userStores[0]?.id || 'pyaterochka'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Available stores for selection: user favorite stores + popular ones without duplicates
  const storeList = userStores.length > 0
    ? userStores
    : POPULAR_STORES.slice(0, 5);

  const handleChipClick = (amount: number) => {
    const currentVal = parseFloat(newExpense) || 0;
    setNewExpense(String(currentVal + amount));
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newExpense.replace(',', '.'));
    if (!isNaN(val) && val > 0 && !isSubmitting && !isLoading) {
      try {
        setIsSubmitting(true);
        await onAddExpense(val, expenseNote.trim() || undefined, selectedStoreId);
        setNewExpense('');
        setExpenseNote('');
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 2000);
      } catch (err) {
        console.error('Error adding expense:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const numVal = parseFloat(newExpense.replace(',', '.'));
  const isValidAmount = !isNaN(numVal) && numVal > 0;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Быстрая запись расхода</span>
          </div>
          {isSuccess && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              Добавлено
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mb-4">Учтите чек из магазина или доставку еды</p>

        <form onSubmit={handleAddExpense} className="space-y-3.5">
          {/* Quick amount chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleChipClick(amt)}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-950/70 border border-slate-800/80 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/50 transition-colors cursor-pointer active:scale-95"
              >
                +{amt} {currency.symbol}
              </button>
            ))}
            {newExpense && (
              <button
                type="button"
                onClick={() => setNewExpense('')}
                className="px-2 py-1 text-xs text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                title="Очистить сумму"
              >
                Сброс
              </button>
            )}
          </div>

          {/* Amount input */}
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              autoComplete="off"
              value={newExpense}
              onChange={(e) => setNewExpense(e.target.value)}
              placeholder={`0 ${currency.symbol}`}
              className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 transition-all"
            />
          </div>

          {/* Store selection */}
          <div>
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
              <Store className="w-3 h-3 text-slate-400" />
              <span>Магазин</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {storeList.slice(0, 5).map((store) => {
                const isSelected = selectedStoreId === store.id;
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => setSelectedStoreId(store.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: store.color || '#10b981' }}
                    />
                    <span className="truncate max-w-[100px]">{store.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note / Title input */}
          <div>
            <input
              type="text"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              placeholder="Заметка к покупке (напр. овощи, сыр, молоко)"
              className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 transition-all"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isValidAmount || isSubmitting || isLoading}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isSubmitting ? 'Сохранение...' : 'Записать покупку'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
