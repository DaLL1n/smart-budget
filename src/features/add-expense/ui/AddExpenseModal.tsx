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
  CheckCircle2,
  Search,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { Currency } from '../../../entities/budget';
import { StoreOption, POPULAR_STORES, fetchStoresForCity } from '../../../entities/store';
import { ExpenseCategory, ExpenseCategoryConfig, useExpenseCategories } from '../../../entities/expense';
import { useAuth } from '../../../entities/user';

import { ScanReceiptView } from '../../scan-receipt';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onAddExpense: (amount: number, note?: string, storeId?: string, category?: ExpenseCategory) => Promise<void> | void;
  onAddBatchExpenses?: (items: Array<{ category: ExpenseCategory; amount: number }>, storeId: string) => Promise<void> | void;
  userStores?: StoreOption[];
  city?: string;
}

type AddMode = 'choose' | 'manual' | 'scan';
type ManualStep = 'store' | 'categories';

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  currency,
  onAddExpense,
  onAddBatchExpenses,
  city = 'Москва',
}) => {
  const { addCustomCategories } = useAuth();
  const { categories } = useExpenseCategories();

  const [mounted, setMounted] = useState<boolean>(false);
  const [mode, setMode] = useState<AddMode>('choose');
  const [manualStep, setManualStep] = useState<ManualStep>('store');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('pyaterochka');
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // City-specific stores with top 5 within 2-3km and debounced search
  const [cityStores, setCityStores] = useState<StoreOption[]>(POPULAR_STORES.slice(0, 5));
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(false);
  const [storeSearch, setStoreSearch] = useState<string>('');
  const [debouncedSearch] = useDebouncedValue(storeSearch, { wait: 180 });
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch stores for user's city when modal opens
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setIsLoadingStores(true);
      fetchStoresForCity(city)
        .then(stores => {
          if (isMounted && stores.length > 0) {
            setCityStores(stores);
            if (!selectedStoreId || !stores.some(s => s.id === selectedStoreId)) {
              setSelectedStoreId(stores[0].id);
            }
          }
        })
        .catch(err => console.error('Failed to load stores for AddExpenseModal:', err))
        .finally(() => {
          if (isMounted) setIsLoadingStores(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, city]);

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

  // Reset state on reopen
  useEffect(() => {
    if (isOpen) {
      setMode('choose');
      setManualStep('store');
      setCategoryAmounts({});
      setIsSuccess(false);
      setIsSubmitting(false);
      setIsSearching(false);
      setStoreSearch('');
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const top5 = cityStores.slice(0, 5);
  const selectedStore = cityStores.find(s => s.id === selectedStoreId) || cityStores[0] || {
    id: 'pyaterochka',
    name: 'Пятёрочка',
    color: '#16a34a',
    distance: '0.4 км'
  };

  const displayedTopStores = [...top5];
  if (selectedStore && !displayedTopStores.some(s => s.id === selectedStoreId)) {
    displayedTopStores.push(selectedStore);
  }

  const searchedStores = debouncedSearch.trim()
    ? cityStores.filter(s => s.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : [];

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    setManualStep('categories');
    setIsSearching(false);
    setStoreSearch('');
  };

  const handleCategoryAmountChange = (catId: string, rawValue: string) => {
    const cleaned = rawValue.replace(/[^0-9.,]/g, '');
    setCategoryAmounts(prev => ({
      ...prev,
      [catId]: cleaned,
    }));
  };

  const handleClearCategory = (catId: string) => {
    setCategoryAmounts(prev => ({
      ...prev,
      [catId]: '',
    }));
  };

  // Calculate parsed items and total
  const validItems = Object.entries(categoryAmounts)
    .map(([cat, val]) => ({
      category: cat as ExpenseCategory,
      amount: parseFloat(val.replace(',', '.')) || 0,
    }))
    .filter(item => !isNaN(item.amount) && item.amount > 0);

  const totalAmount = validItems.reduce((acc, item) => acc + item.amount, 0);
  const filledCount = validItems.length;

  const handleSaveManual = async () => {
    if (validItems.length === 0) return;

    try {
      setIsSubmitting(true);
      if (onAddBatchExpenses) {
        await onAddBatchExpenses(validItems, selectedStoreId);
      } else {
        await Promise.all(
          validItems.map(item => onAddExpense(item.amount, undefined, selectedStoreId, item.category))
        );
      }
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to add batch expenses:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanReceiptConfirm = async (
    batchItems: Array<{ category: ExpenseCategory; amount: number }>,
    storeId: string,
    _receiptItems?: any,
    newCategories?: ExpenseCategoryConfig[]
  ) => {
    try {
      setIsSubmitting(true);
      if (newCategories && newCategories.length > 0) {
        await addCustomCategories(
          newCategories.map(c => ({
            id: c.id,
            label: c.label,
            icon: c.icon,
            color: c.color,
            badgeBg: c.badgeBg,
            isCustom: true,
          }))
        );
      }
      if (onAddBatchExpenses) {
        await onAddBatchExpenses(batchItems, storeId);
      } else {
        await Promise.all(
          batchItems.map(item => onAddExpense(item.amount, undefined, storeId, item.category))
        );
      }
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save scanned receipt items:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (mode === 'manual' && manualStep === 'categories') {
      setManualStep('store');
    } else {
      setMode('choose');
    }
  };

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
                onClick={handleBack}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer mr-1 outline-none focus:outline-none focus-visible:outline-none select-none"
                title="Назад"
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
                {mode === 'manual' && manualStep === 'store' && 'Шаг 1 из 2: Выберите магазин'}
                {mode === 'manual' && manualStep === 'categories' && 'Шаг 2 из 2: Суммы по категориям'}
                {mode === 'scan' && 'Умный сканер чека'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'choose' && 'Выберите способ внесения чека'}
                {mode === 'manual' && manualStep === 'store' && `Магазины рядом в г. ${city} (до 2–3 км)`}
                {mode === 'manual' && manualStep === 'categories' && 'Укажите потраченные суммы для нужных категорий'}
                {mode === 'scan' && 'Распознавание по фото, файлу, тексту или ссылке'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none select-none"
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
              className="w-full p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/80 hover:border-emerald-500/40 active:border-emerald-500/60 text-left transition-colors duration-150 group flex items-start gap-3.5 cursor-pointer outline-none focus:outline-none focus-visible:outline-none select-none"
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
              onClick={() => {
                setMode('manual');
                setManualStep('store');
              }}
              className="w-full p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/80 hover:border-teal-500/40 active:border-teal-500/60 text-left transition-colors duration-150 group flex items-start gap-3.5 cursor-pointer outline-none focus:outline-none focus-visible:outline-none select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                <Edit3 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                    Ввести чек по категориям
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Укажите магазин и распределите суммы по нужным отделам одним чеком
                </p>
              </div>
            </button>
          </div>
        )}

        {/* MODE 2: SCAN RECEIPT PREVIEW & EDIT */}
        {mode === 'scan' && (
          <ScanReceiptView
            city={city}
            currency={currency}
            onConfirmReceipt={handleScanReceiptConfirm}
            onCancel={() => setMode('choose')}
          />
        )}

        {/* MODE 3: MANUAL EXPENSE FLOW */}
        {mode === 'manual' && (
          <>
            {/* STEP 1: STORE SELECTION */}
            {manualStep === 'store' && (
              <div className="space-y-4 pt-1 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Выберите магазин в г. {city}:</span>
                    </label>
                    {isLoadingStores && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    )}
                  </div>

                  {/* Top 5 stores within 2-3km cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {displayedTopStores.map((store) => {
                      const isSelected = selectedStoreId === store.id;
                      return (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => handleSelectStore(store.id)}
                          className={`p-3 rounded-xl border text-left transition-colors duration-150 cursor-pointer flex items-center justify-between group outline-none focus:outline-none focus-visible:outline-none select-none ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/70 text-white shadow-sm'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-slate-950/90'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: store.color || '#10b981' }}
                            />
                            <span className="text-xs font-medium truncate">{store.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {store.distance && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {store.distance}
                              </span>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Debounced Search for other stores in the city */}
                <div className="pt-1">
                  {!isSearching ? (
                    <button
                      type="button"
                      onClick={() => setIsSearching(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer py-1"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                      <span>Найти другой супермаркет в г. {city}...</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={storeSearch}
                          onChange={(e) => setStoreSearch(e.target.value)}
                          placeholder={`Поиск магазина в г. ${city}...`}
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-emerald-500/80 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsSearching(false);
                            setStoreSearch('');
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Search results dropdown */}
                      {debouncedSearch.trim() && (
                        <div className="max-h-40 overflow-y-auto custom-scrollbar rounded-xl bg-slate-950/95 border border-slate-800 p-1 space-y-0.5 shadow-xl">
                          {searchedStores.length > 0 ? (
                            searchedStores.map((store) => (
                              <button
                                key={store.id}
                                type="button"
                                onClick={() => handleSelectStore(store.id)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer hover:bg-slate-900 text-slate-300 hover:text-white"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: store.color }}
                                  />
                                  <span>{store.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {store.distance && (
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {store.distance}
                                    </span>
                                  )}
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="py-2.5 px-3 text-center text-xs text-slate-500">
                              Магазин не найден в базе города {city}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: CATEGORY AMOUNTS INPUT */}
            {manualStep === 'categories' && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveManual(); }} className="space-y-4 pt-1 animate-fade-in">
                {/* Store banner with quick switch button */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedStore.color || '#10b981' }}
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-white mr-1.5">{selectedStore.name}</span>
                      {selectedStore.distance && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({selectedStore.distance})
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManualStep('store')}
                    className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors shrink-0 ml-2 cursor-pointer"
                  >
                    Сменить магазин
                  </button>
                </div>

                {/* Categories list with amounts */}
                <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1 custom-scrollbar">
                  {categories.map((cat) => {
                    const currentVal = categoryAmounts[cat.id] || '';
                    const hasValue = currentVal.trim() !== '' && parseFloat(currentVal.replace(',', '.')) > 0;
                    return (
                      <div
                        key={cat.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          hasValue
                            ? 'bg-slate-900/90 border-emerald-500/50 shadow-sm'
                            : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Category info */}
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="text-base shrink-0 select-none">{cat.icon}</span>
                          <span className="text-xs font-medium text-slate-200 truncate">
                            {cat.label}
                          </span>
                        </div>

                        {/* Amount input + clear button */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*[.,]?[0-9]*"
                              autoComplete="off"
                              value={currentVal}
                              onChange={(e) => handleCategoryAmountChange(cat.id, e.target.value)}
                              placeholder="0"
                              className="w-24 sm:w-28 bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-lg px-2.5 py-1.5 text-right text-xs font-mono font-bold text-white placeholder-slate-600 focus:outline-none transition-colors pr-6"
                            />
                            <span className="absolute right-2 text-xs font-mono text-slate-500 pointer-events-none">
                              {currency.symbol}
                            </span>
                          </div>

                          {currentVal && (
                            <button
                              type="button"
                              onClick={() => handleClearCategory(cat.id)}
                              className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                              title="Очистить сумму"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary calculation card */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    Заполнено: <b className="text-emerald-400 font-mono">{filledCount}</b> из 7 категорий
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 mr-1.5">Итого чек:</span>
                    <span className="font-mono font-bold text-sm text-white">
                      {totalAmount.toLocaleString('ru-RU')} {currency.symbol}
                    </span>
                  </div>
                </div>

                {/* Status message */}
                {isSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Чек успешно записан в историю покупок!</span>
                  </div>
                )}

                {/* Submit button */}
                <div>
                  <button
                    type="submit"
                    disabled={filledCount === 0 || isSubmitting || isSuccess}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Запись покупок...</span>
                    ) : isSuccess ? (
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Записано!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Plus className="w-4 h-4" />
                        Записать чек ({totalAmount.toLocaleString('ru-RU')} {currency.symbol})
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

