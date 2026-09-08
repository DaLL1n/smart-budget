import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Check, Store, Search, X, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { Currency } from '../../../entities/budget';
import { StoreOption, POPULAR_STORES, fetchStoresForCity } from '../../../entities/store';
import { ExpenseCategory, useExpenseCategories } from '../../../entities/expense';

interface AddExpenseFormProps {
  currency: Currency;
  onAddExpense: (amount: number, note?: string, storeId?: string, category?: ExpenseCategory) => Promise<void> | void;
  onAddBatchExpenses?: (items: Array<{ category: ExpenseCategory; amount: number }>, storeId: string) => Promise<void> | void;
  isLoading?: boolean;
  userStores?: StoreOption[];
  city?: string;
}

type FormStep = 'store' | 'categories';

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  currency,
  onAddExpense,
  onAddBatchExpenses,
  isLoading = false,
  city = 'Москва',
}) => {
  const { categories } = useExpenseCategories();
  const [step, setStep] = useState<FormStep>('store');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('pyaterochka');
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Dynamic city stores with Top 5 within 2-3km & debounced search
  const [cityStores, setCityStores] = useState<StoreOption[]>(POPULAR_STORES.slice(0, 5));
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(false);
  const [storeSearch, setStoreSearch] = useState<string>('');
  const [debouncedSearch] = useDebouncedValue(storeSearch, { wait: 180 });
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingStores(true);
    fetchStoresForCity(city)
      .then((stores) => {
        if (isMounted && stores.length > 0) {
          setCityStores(stores);
          if (!selectedStoreId || !stores.some((s) => s.id === selectedStoreId)) {
            setSelectedStoreId(stores[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load stores for AddExpenseForm:', err))
      .finally(() => {
        if (isMounted) setIsLoadingStores(false);
      });
    return () => {
      isMounted = false;
    };
  }, [city]);

  const top5 = cityStores.slice(0, 5);
  const selectedStore = cityStores.find((s) => s.id === selectedStoreId) || cityStores[0] || {
    id: 'pyaterochka',
    name: 'Пятёрочка',
    color: '#16a34a',
    distance: '0.4 км',
  };
  const displayedTopStores = [...top5];
  if (selectedStore && !displayedTopStores.some((s) => s.id === selectedStoreId)) {
    displayedTopStores.push(selectedStore);
  }

  const searchedStores = debouncedSearch.trim()
    ? cityStores.filter((s) => s.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : [];

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    setStep('categories');
    setIsSearching(false);
    setStoreSearch('');
  };

  const handleCategoryAmountChange = (catId: ExpenseCategory, rawValue: string) => {
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

  const validItems = Object.entries(categoryAmounts)
    .map(([cat, val]) => ({
      category: cat as ExpenseCategory,
      amount: parseFloat(val.replace(',', '.')) || 0,
    }))
    .filter(item => !isNaN(item.amount) && item.amount > 0);

  const totalAmount = validItems.reduce((acc, item) => acc + item.amount, 0);
  const filledCount = validItems.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validItems.length === 0 || isSubmitting || isLoading) return;

    try {
      setIsSubmitting(true);
      if (onAddBatchExpenses) {
        await onAddBatchExpenses(validItems, selectedStoreId);
      } else {
        await Promise.all(
          validItems.map(item => onAddExpense(item.amount, undefined, selectedStoreId, item.category))
        );
      }
      setCategoryAmounts({});
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setStep('store');
      }, 1500);
    } catch (err) {
      console.error('Error adding expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide">
            {step === 'categories' && (
              <button
                type="button"
                onClick={() => setStep('store')}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer mr-0.5"
                title="Назад к магазинам"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>
              {step === 'store' ? 'Шаг 1 из 2: Выберите магазин' : 'Шаг 2 из 2: Суммы по категориям'}
            </span>
          </div>
          {isSuccess && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              Чек сохранен!
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mb-3.5">
          {step === 'store' 
            ? `Магазины рядом в г. ${city} (до 2–3 км)`
            : 'Укажите суммы для нужных категорий в чеке'}
        </p>

        {step === 'store' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Top 5 closest stores chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayedTopStores.map((store) => {
                const isSelected = selectedStoreId === store.id;
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => handleSelectStore(store.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/70 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: store.color || '#10b981' }}
                      />
                      <span className="text-xs font-medium truncate">{store.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
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

            {/* Debounced Search for other stores in the city */}
            {!isSearching ? (
              <button
                type="button"
                onClick={() => setIsSearching(true)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer py-0.5"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Найти другой супермаркет...</span>
              </button>
            ) : (
              <div className="space-y-1.5 pt-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    placeholder={`Поиск магазина в г. ${city}...`}
                    className="w-full bg-slate-950/90 border border-slate-800 focus:border-emerald-500/80 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
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
                  <div className="max-h-36 overflow-y-auto custom-scrollbar rounded-xl bg-slate-950/95 border border-slate-800 p-1 space-y-0.5 shadow-xl">
                    {searchedStores.length > 0 ? (
                      searchedStores.map((store) => (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => handleSelectStore(store.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer hover:bg-slate-900 text-slate-300 hover:text-white"
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
                      <div className="py-2 px-3 text-center text-xs text-slate-500">
                        Магазин не найден в базе города {city}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'categories' && (
          <form onSubmit={handleSubmit} className="space-y-3.5 animate-fade-in">
            {/* Store banner with switch button */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/90">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: selectedStore.color || '#10b981' }}
                />
                <span className="text-xs font-bold text-white truncate">{selectedStore.name}</span>
                {selectedStore.distance && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({selectedStore.distance})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep('store')}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors shrink-0 ml-2 cursor-pointer"
              >
                Сменить
              </button>
            </div>

            {/* Categories list with inputs */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {categories.map((cat) => {
                const currentVal = categoryAmounts[cat.id] || '';
                const hasValue = currentVal.trim() !== '' && parseFloat(currentVal.replace(',', '.')) > 0;
                return (
                  <div
                    key={cat.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      hasValue
                        ? 'bg-slate-900/90 border-emerald-500/50 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-sm shrink-0 select-none">{cat.icon}</span>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {cat.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          autoComplete="off"
                          value={currentVal}
                          onChange={(e) => handleCategoryAmountChange(cat.id, e.target.value)}
                          placeholder="0"
                          className="w-20 sm:w-24 bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-md px-2 py-1 text-right text-xs font-mono font-bold text-white placeholder-slate-600 focus:outline-none transition-colors pr-5"
                        />
                        <span className="absolute right-1.5 text-[11px] font-mono text-slate-500 pointer-events-none">
                          {currency.symbol}
                        </span>
                      </div>
                      {currentVal && (
                        <button
                          type="button"
                          onClick={() => handleClearCategory(cat.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                          title="Очистить сумму"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculation summary */}
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
              <div className="text-slate-400 text-[11px]">
                Заполнено: <b className="text-emerald-400 font-mono">{filledCount}</b> из 7
              </div>
              <div className="text-right">
                <span className="text-slate-400 mr-1 text-[11px]">Итого:</span>
                <span className="font-mono font-bold text-sm text-white">
                  {totalAmount.toLocaleString('ru-RU')} {currency.symbol}
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={filledCount === 0 || isSubmitting || isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Запись чека...'
                  : `Записать чек (${totalAmount.toLocaleString('ru-RU')} ${currency.symbol})`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

