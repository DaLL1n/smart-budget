import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  X, 
  Camera, 
  Edit3, 
  ArrowLeft, 
  Check, 
  Store, 
  Receipt,
  QrCode,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Currency } from '../../../entities/budget';
import { StoreOption, POPULAR_STORES } from '../../../entities/store';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onAddExpense: (amount: number, note?: string, storeId?: string) => Promise<void> | void;
  userStores?: StoreOption[];
}

type AddMode = 'choose' | 'manual' | 'scan';

const QUICK_AMOUNTS = [300, 500, 1000, 2000];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  currency,
  onAddExpense,
  userStores = [],
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [mode, setMode] = useState<AddMode>('choose');
  const [newExpense, setNewExpense] = useState<string>('');
  const [expenseNote, setExpenseNote] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    userStores[0]?.id || 'pyaterochka'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body & html scroll, and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset mode on reopen
  useEffect(() => {
    if (isOpen) {
      setMode('choose');
      setNewExpense('');
      setExpenseNote('');
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const storeList = userStores.length > 0 ? userStores : POPULAR_STORES.slice(0, 6);

  const handleChipClick = (amount: number) => {
    const currentVal = parseFloat(newExpense.replace(',', '.')) || 0;
    setNewExpense(String(currentVal + amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newExpense.replace(',', '.'));
    if (!isNaN(val) && val > 0 && !isSubmitting) {
      try {
        setIsSubmitting(true);
        await onAddExpense(val, expenseNote.trim() || undefined, selectedStoreId);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1200);
      } catch (err) {
        console.error('Failed to add expense:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const numVal = parseFloat(newExpense.replace(',', '.'));
  const isValidAmount = !isNaN(numVal) && numVal > 0;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-slate-900 via-slate-900/98 to-slate-950 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode !== 'choose' && (
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer mr-1"
                title="Назад к выбору"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {mode === 'choose' && 'Добавить покупку'}
                {mode === 'manual' && 'Запись расхода вручную'}
                {mode === 'scan' && 'Сканирование чека'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'choose' && 'Выберите удобный способ внесения чека'}
                {mode === 'manual' && 'Укажите сумму, магазин и категорию'}
                {mode === 'scan' && 'Считывание фото или QR-кода'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE 1: CHOOSE ACTION */}
        {mode === 'choose' && (
          <div className="space-y-3 pt-2 animate-fade-in">
            {/* Option A: Scan receipt (AI / Camera / QR) */}
            <button
              type="button"
              onClick={() => setMode('scan')}
              className="w-full p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/80 hover:border-emerald-500/40 text-left transition-all group flex items-start gap-3.5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Отсканировать чек
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI-сканер
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Мгновенное распознавание позиций, цен и магазина по фото чека или QR-коду
                </p>
              </div>
            </button>

            {/* Option B: Manual Entry */}
            <button
              type="button"
              onClick={() => setMode('manual')}
              className="w-full p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/80 hover:border-teal-500/40 text-left transition-all group flex items-start gap-3.5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                <Edit3 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                    Добавить вручную
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Быстрый ввод
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Быстро введите сумму покупки, выберите магазин из списка и добавьте заметку
                </p>
              </div>
            </button>
          </div>
        )}

        {/* MODE 2: SCAN RECEIPT PREVIEW */}
        {mode === 'scan' && (
          <div className="space-y-4 pt-2 text-center animate-fade-in">
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-dashed border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Умное сканирование чека</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Подключение модуля распознавания чеков через камеру и QR-код Федеральной налоговой службы запланировано на следующем шаге разработки.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Ввести чек вручную →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: MANUAL EXPENSE FORM */}
        {mode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1 animate-fade-in">
            {/* Quick Amount Chips */}
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
                >
                  Сброс
                </button>
              )}
            </div>

            {/* Amount input */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                Сумма покупки
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                autoComplete="off"
                autoFocus
                value={newExpense}
                onChange={(e) => setNewExpense(e.target.value)}
                placeholder={`0 ${currency.symbol}`}
                className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 transition-all"
              />
            </div>

            {/* Store Selection */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                <Store className="w-3 h-3 text-slate-400" />
                <span>Магазин</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {storeList.map((store) => {
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
                      <span>{store.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note input */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                Заметка (необязательно)
              </label>
              <input
                type="text"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                placeholder="Например: овощи, сыр, хлеб или кофе"
                className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 transition-all"
              />
            </div>

            {/* Status message */}
            {isSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Расход успешно записан и учтен в бюджете!</span>
              </div>
            )}

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isValidAmount || isSubmitting || isSuccess}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Сохранение расхода...</span>
                ) : isSuccess ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Сохранено!
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    Записать чек
                  </span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
