import React, { useState } from 'react';
import { Receipt, Plus } from 'lucide-react';
import { Currency } from '../../../entities/budget';

interface AddExpenseFormProps {
  currency: Currency;
  onAddExpense: (amount: number, note: string) => void;
}

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  currency,
  onAddExpense,
}) => {
  const [newExpense, setNewExpense] = useState<string>('');
  const [expenseNote, setExpenseNote] = useState<string>('');

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newExpense);
    if (!isNaN(val) && val > 0) {
      onAddExpense(val, expenseNote);
      setNewExpense('');
      setExpenseNote('');
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>Быстрая запись расхода</span>
        </div>
        <p className="text-[11px] text-zinc-400 mb-4">Учтите покупку продуктов или доставку</p>

        <form onSubmit={handleAddExpense} className="space-y-3">
          <div>
            <input
              type="number"
              min={1}
              step="any"
              value={newExpense}
              onChange={(e) => setNewExpense(e.target.value)}
              placeholder={`Сумма в ${currency.symbol}...`}
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <input
              type="text"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              placeholder="Магазин или категория (напр. ВкусВилл)"
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={!newExpense}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить расход</span>
          </button>
        </form>
      </div>
    </div>
  );
};
