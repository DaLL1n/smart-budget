import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  AlignLeft, 
  Link as LinkIcon, 
  Sparkles, 
  Loader2, 
  Check, 
  Trash2, 
  Plus, 
  AlertCircle, 
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { Currency } from '../../../entities/budget';
import { StoreOption, fetchStoresForCity, POPULAR_STORES } from '../../../entities/store';
import { 
  ExpenseCategory, 
  EXPENSE_CATEGORIES, 
  ExpenseCategoryConfig, 
  getCategoryConfig 
} from '../../../entities/expense';
import { useAuth } from '../../../entities/user';
import { 
  receiptAiService, 
  ParsedReceiptData, 
  ParsedReceiptItem, 
  calculateTotals 
} from '../api/receiptAiService';

export type ReceiptInputTab = 'camera' | 'gallery' | 'document' | 'text' | 'link';

interface ScanReceiptViewProps {
  city?: string;
  currency: Currency;
  onConfirmReceipt: (
    items: Array<{ category: ExpenseCategory; amount: number }>, 
    storeId: string, 
    receiptItems?: ParsedReceiptItem[],
    newCategories?: ExpenseCategoryConfig[]
  ) => Promise<void> | void;
  onCancel: () => void;
}

export const ScanReceiptView: React.FC<ScanReceiptViewProps> = ({
  city = 'Москва',
  currency,
  onConfirmReceipt,
  onCancel,
}) => {
  const { currentUser, addCustomCategories } = useAuth();
  const userCustomCategories = (currentUser?.profile?.custom_categories as ExpenseCategoryConfig[]) || [];

  const [activeTab, setActiveTab] = useState<ReceiptInputTab>('gallery');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzingStep, setAnalyzingStep] = useState<string>('Считывание реквизитов чека...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed receipt state for interactive preview
  const [receiptData, setReceiptData] = useState<ParsedReceiptData | null>(null);

  // Accordion collapsed state: categories that are collapsed
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Category picker popover: currently editing item ID
  const [categoryPickerItemId, setCategoryPickerItemId] = useState<string | null>(null);

  // City stores for store selection
  const [cityStores, setCityStores] = useState<StoreOption[]>(POPULAR_STORES.slice(0, 5));
  const [showStorePicker, setShowStorePicker] = useState<boolean>(false);

  // Text tab input
  const [rawText, setRawText] = useState<string>('');

  // Link tab input
  const [receiptUrl, setReceiptUrl] = useState<string>('');

  // Hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Load stores for city
  React.useEffect(() => {
    fetchStoresForCity(city).then(stores => {
      if (stores && stores.length > 0) {
        setCityStores(stores);
      }
    });
  }, [city]);

  const runAnalysisAnimation = async (action: () => Promise<ParsedReceiptData>) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalyzingStep('Считывание реквизитов чека...');

    const timer1 = setTimeout(() => {
      setAnalyzingStep('Распознавание позиций и цен...');
    }, 400);

    const timer2 = setTimeout(() => {
      setAnalyzingStep('Категоризация продуктов по отделам...');
    }, 900);

    try {
      const data = await action();
      setReceiptData(data);
      // All accordions collapsed by default to eliminate visual clutter
      const activeCats = Object.entries(data.categoryTotals)
        .filter(([_, total]) => total > 0)
        .map(([catId]) => catId);
      setCollapsedCategories(new Set(activeCats));
      setCategoryPickerItemId(null);
    } catch (err: any) {
      console.error('Receipt parsing error:', err);
      setErrorMessage(err?.message || 'Не удалось распознать чек. Попробуйте другой файл или текст.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    runAnalysisAnimation(() => receiptAiService.scanReceiptImage(file, city, userCustomCategories));
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    runAnalysisAnimation(() => receiptAiService.scanReceiptText(rawText, city, userCustomCategories));
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptUrl.trim()) return;
    runAnalysisAnimation(() => receiptAiService.scanReceiptUrl(receiptUrl, city, userCustomCategories));
  };

  const handleSampleText = () => {
    const sample = `Пятёрочка
Чек №421
1. Томаты на ветке 500г 179.90
2. Молоко цельное 3.2% 89.00
3. Сыр Российский 200г 210.00
4. Филе грудки цыпленка 340.00
5. Хлеб бородинский 45.00
6. Вода минеральная 1.5л 55.00
7. Корм для кошек Felix 45.00
8. Корнерсы сырные 95.00
ИТОГО: 1058.90 руб`;
    setRawText(sample);
  };

  // --- PREVIEW SCREEN HANDLERS ---
  const handleItemCategoryChange = (itemId: string, newCat: string) => {
    if (!receiptData) return;
    const updatedItems = receiptData.items.map(it => 
      it.id === itemId ? { ...it, category: newCat } : it
    );
    const { categoryTotals, totalAmount } = calculateTotals(updatedItems);
    setReceiptData({
      ...receiptData,
      items: updatedItems,
      categoryTotals,
      totalAmount,
    });
    setCategoryPickerItemId(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!receiptData) return;
    const updatedItems = receiptData.items.filter(it => it.id !== itemId);
    const { categoryTotals, totalAmount } = calculateTotals(updatedItems);
    setReceiptData({
      ...receiptData,
      items: updatedItems,
      categoryTotals,
      totalAmount,
    });
    if (categoryPickerItemId === itemId) {
      setCategoryPickerItemId(null);
    }
  };

  const handleAddItem = (targetCategory: string = 'other') => {
    if (!receiptData) return;
    const newItem: ParsedReceiptItem = {
      id: `new_item_${Date.now()}`,
      name: 'Новый продукт',
      price: 100,
      count: 1,
      category: targetCategory,
    };
    const updatedItems = [...receiptData.items, newItem];
    const { categoryTotals, totalAmount } = calculateTotals(updatedItems);
    setReceiptData({
      ...receiptData,
      items: updatedItems,
      categoryTotals,
      totalAmount,
    });
    // Ensure target category accordion is open
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      next.delete(targetCategory);
      return next;
    });
  };

  const handleToggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const handleToggleAllAccordions = (activeCategoryIds: string[]) => {
    const allCollapsed = activeCategoryIds.every(id => collapsedCategories.has(id));
    if (allCollapsed) {
      // Expand all
      setCollapsedCategories(new Set());
    } else {
      // Collapse all
      setCollapsedCategories(new Set(activeCategoryIds));
    }
  };

  const handleSelectStore = (store: StoreOption) => {
    if (!receiptData) return;
    setReceiptData({
      ...receiptData,
      storeName: store.name,
      storeId: store.id,
    });
    setShowStorePicker(false);
  };

  const handleConfirmSave = async () => {
    if (!receiptData) return;
    if (receiptData.newCategories && receiptData.newCategories.length > 0) {
      await addCustomCategories(
        receiptData.newCategories.map(c => ({
          id: c.id,
          label: c.label,
          icon: c.icon,
          color: c.color,
          badgeBg: c.badgeBg,
          isCustom: true,
        }))
      );
    }
    const batchItems = Object.entries(receiptData.categoryTotals)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
      }))
      .filter(item => item.amount > 0);

    if (batchItems.length === 0) return;

    await onConfirmReceipt(batchItems, receiptData.storeId, receiptData.items, receiptData.newCategories);
  };

  // ==========================================
  // VIEW 1: SCANNING / ANALYZING LOADER
  // ==========================================
  if (isAnalyzing) {
    return (
      <div className="py-10 px-4 text-center space-y-5 animate-fade-in">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 animate-ping opacity-60" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/10">
            <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-white tracking-wide">
            Умный сканер чека
          </h4>
          <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1.5 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{analyzingStep}</span>
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto pt-1">
            Товары автоматически распределяются по 7 отделам для точного учета бюджета
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: REVAMPED PREVIEW & DEPARTMENT ACCORDIONS
  // ==========================================
  if (receiptData) {
    const selectedStore = cityStores.find(s => s.id === receiptData.storeId) || {
      id: receiptData.storeId,
      name: receiptData.storeName,
      color: '#10b981',
      distance: '0.5 км'
    };

    // Build unified map of categories: default + user custom + new ones in this receipt
    const allCatsMap = new Map<string, ExpenseCategoryConfig>();
    EXPENSE_CATEGORIES.forEach(c => allCatsMap.set(c.id, c));
    userCustomCategories.forEach(c => allCatsMap.set(c.id, c));
    (receiptData.newCategories || []).forEach(c => allCatsMap.set(c.id, c));
    const allCategoriesList = Array.from(allCatsMap.values());

    const getCategoryStyle = (catId: string) => {
      const cfg = allCatsMap.get(catId) || getCategoryConfig(catId, userCustomCategories);
      return {
        bg: cfg.badgeBg.split(' ')[0] || 'bg-slate-500/15',
        text: cfg.badgeBg.split(' ')[1] || 'text-slate-300',
        hex: cfg.color || '#64748B',
        border: cfg.badgeBg.split(' ')[2] || 'border-slate-500/30',
        icon: cfg.icon || '🏷️',
        label: cfg.label || catId,
      };
    };

    // Group items by category
    const groupedItems: Record<string, ParsedReceiptItem[]> = {};
    allCategoriesList.forEach(c => {
      groupedItems[c.id] = [];
    });

    receiptData.items.forEach(it => {
      if (!groupedItems[it.category]) {
        groupedItems[it.category] = [];
      }
      groupedItems[it.category].push(it);
    });

    // Active categories in order
    const activeCategories = allCategoriesList.filter(
      c => (groupedItems[c.id]?.length || 0) > 0
    );
    const activeCategoryIds = activeCategories.map(c => c.id);
    const isAllCollapsed = activeCategoryIds.length > 0 && activeCategoryIds.every(id => collapsedCategories.has(id));
    const selectedItemForCategoryPicker = receiptData.items.find(it => it.id === categoryPickerItemId);

    return (
      <div className="space-y-3.5 pt-1 animate-fade-in text-left relative">
        {/* Invisible backdrop to dismiss store picker dropdown */}
        {showStorePicker && (
          <div 
            className="fixed inset-0 z-20 bg-transparent"
            onClick={() => setShowStorePicker(false)}
          />
        )}



        {/* 1. COMPACT HEADER: Store + Date + Grand Total + Multi-color Segmented Proportions Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5">
          {/* Top row: Store dropdown pill + Date */}
          <div className="flex items-center justify-between">
            <div className="relative z-30">
              <button
                type="button"
                onClick={() => setShowStorePicker(!showStorePicker)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-xs font-bold text-white transition-colors cursor-pointer outline-none select-none"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedStore.color || '#10b981' }}
                />
                <span>{receiptData.storeName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Store dropdown picker */}
              {showStorePicker && (
                <div className="absolute top-full left-0 mt-1.5 w-60 max-h-52 overflow-y-auto custom-scrollbar rounded-xl bg-slate-950 border border-slate-800 p-1 shadow-2xl space-y-0.5 animate-fade-in">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400">
                    Магазины в г. {city}
                  </div>
                  {cityStores.map(store => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => handleSelectStore(store)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-900 text-slate-300 hover:text-white cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: store.color }}
                        />
                        <span>{store.name}</span>
                      </div>
                      {store.distance && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {store.distance}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              г. {city}
            </span>
          </div>

          {/* Big Total Row */}
          <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium">Сумма по чеку</span>
            <div className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
              {receiptData.totalAmount.toLocaleString('ru-RU')} {currency.symbol}
            </div>
          </div>

          {/* Segmented Proportions Bar */}
          {receiptData.totalAmount > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-800">
                {activeCategories.map(cat => {
                  const amount = receiptData.categoryTotals[cat.id] || 0;
                  const pct = Math.max(2, (amount / receiptData.totalAmount) * 100);
                  const col = getCategoryStyle(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: col.hex,
                      }}
                      title={`${cat.label}: ${amount} ${currency.symbol} (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>
              {/* Category legend dots */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                {activeCategories.map(cat => {
                  const amount = receiptData.categoryTotals[cat.id] || 0;
                  const col = getCategoryStyle(cat.id);
                  return (
                    <span key={cat.id} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.hex }} />
                      <span>{cat.label}</span>
                      <span className="font-mono text-slate-200 font-bold">{amount} {currency.symbol}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. SUBHEADER: Title + Toggle All + Add Item */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
            Отделы и товары ({receiptData.items.length})
          </span>
          <div className="flex items-center gap-2.5">
            {activeCategories.length > 1 && (
              <button
                type="button"
                onClick={() => handleToggleAllAccordions(activeCategoryIds)}
                className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer outline-none"
              >
                {isAllCollapsed ? 'Развернуть все' : 'Свернуть все'}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleAddItem('other')}
              className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить</span>
            </button>
          </div>
        </div>

        {/* 3. GROUPED DEPARTMENT ACCORDIONS */}
        <div 
          className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar scrollbar-gutter-stable"
          style={{ scrollbarGutter: 'stable' }}
        >
          {activeCategories.map(cat => {
            const items = groupedItems[cat.id] || [];
            const isCollapsed = collapsedCategories.has(cat.id);
            const catTotal = receiptData.categoryTotals[cat.id] || 0;
            const col = getCategoryStyle(cat.id);

            return (
              <div 
                key={cat.id}
                className="rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => handleToggleCategoryCollapse(cat.id)}
                  className="w-full px-3 py-2.5 bg-slate-900/60 hover:bg-slate-900/90 flex items-center justify-between text-left transition-colors cursor-pointer outline-none select-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base select-none">{cat.icon}</span>
                    <span className="text-xs font-bold text-slate-200 truncate">{cat.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({items.length})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {catTotal.toLocaleString('ru-RU')} {currency.symbol}
                    </span>
                    <motion.div
                      animate={{ rotate: isCollapsed ? -90 : 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="shrink-0 flex items-center"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </motion.div>
                  </div>
                </button>

                {/* Accordion Body: Items list with smooth motion */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      key={`content_${cat.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: 'auto', 
                        opacity: 1,
                        transition: {
                          height: { duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] },
                          opacity: { duration: 0.2, delay: 0.04 }
                        }
                      }}
                      exit={{ 
                        height: 0, 
                        opacity: 0,
                        transition: {
                          height: { duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] },
                          opacity: { duration: 0.14 }
                        }
                      }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y divide-slate-850/60 p-1">
                        {items.map(item => (
                          <div
                            key={item.id}
                            className="p-2 rounded-lg hover:bg-slate-900/40 transition-colors flex items-center justify-between gap-2 group"
                          >
                            {/* Name & price */}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-slate-200 truncate">
                                {item.name}
                              </div>
                              <div className="text-[11px] font-mono font-bold text-white mt-0.5">
                                {item.price} {currency.symbol}
                                {item.count > 1 && (
                                  <span className="text-slate-400 font-normal ml-1">
                                    × {item.count} = {(item.price * item.count).toFixed(2)} {currency.symbol}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Interactive Category Chip */}
                            <div className="shrink-0 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setCategoryPickerItemId(item.id)}
                                className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer outline-none ${col.bg} ${col.text} ${col.border} hover:brightness-110`}
                                title="Сменить категорию товара"
                              >
                                <span>{cat.icon}</span>
                                <span className="hidden sm:inline">{cat.label}</span>
                                <ChevronDown className="w-3 h-3 opacity-60" />
                              </button>

                              {/* Delete item */}
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-colors cursor-pointer outline-none"
                                title="Удалить позицию"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* 4. STREAMLINED FOOTER: Single Primary Action + Reset Link */}
        <div className="space-y-2 pt-1 border-t border-slate-800/60">
          <button
            type="button"
            onClick={handleConfirmSave}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer outline-none select-none"
          >
            <Check className="w-4 h-4" />
            <span>Записать чек в бюджет ({receiptData.totalAmount.toLocaleString('ru-RU')} {currency.symbol})</span>
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setReceiptData(null)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer outline-none inline-flex items-center gap-1 py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Загрузить другой чек / Сбросить</span>
            </button>
          </div>
        </div>

        {/* 5. DEDICATED MODAL DIALOG: Change Department for selected item */}
        {createPortal(
          <AnimatePresence>
            {selectedItemForCategoryPicker && (
              <motion.div 
                key="category-picker-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
                onClick={() => setCategoryPickerItemId(null)}
              >
                <motion.div 
                  key="category-picker-modal-card"
                  initial={{ scale: 0.95, opacity: 0, y: 6 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 6 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 space-y-3 my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 shrink-0">
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-white leading-tight">
                        Переместить товар в отдел
                      </h4>
                      <p className="text-[11px] text-emerald-400 font-medium truncate mt-0.5">
                        {selectedItemForCategoryPicker.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCategoryPickerItemId(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Categories List */}
                  <div className="space-y-1.5 max-h-[65vh] overflow-y-auto custom-scrollbar pr-0.5">
                    {allCategoriesList.map(c => {
                      const isCurrent = c.id === selectedItemForCategoryPicker.category;
                      const col = getCategoryStyle(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            handleItemCategoryChange(selectedItemForCategoryPicker.id, c.id);
                            setCollapsedCategories(prev => {
                              const next = new Set(prev);
                              next.delete(c.id);
                              return next;
                            });
                            setCategoryPickerItemId(null);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer outline-none ${
                            isCurrent
                              ? `${col.bg} ${col.text} border ${col.border} font-bold shadow-sm`
                              : 'bg-slate-950/60 hover:bg-slate-950 text-slate-300 hover:text-white border border-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base select-none">{c.icon}</span>
                            <span>{c.label}</span>
                          </div>
                          {isCurrent && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 3: 5 INPUT CHANNELS TABS
  // ==========================================
  return (
    <div className="space-y-4 pt-1 animate-fade-in text-left">
      {/* Tabs Bar: 5 tabs on mobile, 4 tabs on desktop (camera is mobile-only) */}
      <div className="grid grid-cols-5 md:grid-cols-4 gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors duration-150 flex flex-col items-center gap-1 cursor-pointer outline-none focus:outline-none focus-visible:outline-none select-none border ${
            activeTab === 'gallery'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-none'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="truncate">Фото</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          className={`md:hidden py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors duration-150 flex flex-col items-center gap-1 cursor-pointer outline-none focus:outline-none focus-visible:outline-none select-none border ${
            activeTab === 'camera'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-none'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="truncate">Камера</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('document')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors duration-150 flex flex-col items-center gap-1 cursor-pointer outline-none focus:outline-none focus-visible:outline-none select-none border ${
            activeTab === 'document'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-none'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="truncate">Файл</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors duration-150 flex flex-col items-center gap-1 cursor-pointer outline-none focus:outline-none focus-visible:outline-none select-none border ${
            activeTab === 'text'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-none'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span className="truncate">Текст</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('link')}
          className={`py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors duration-150 flex flex-col items-center gap-1 cursor-pointer outline-none focus:outline-none focus-visible:outline-none select-none border ${
            activeTab === 'link'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-none'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span className="truncate">Ссылка</span>
        </button>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB CONTENT 1: PHOTO */}
      {activeTab === 'gallery' && (
        <div className="space-y-3 animate-fade-in">
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <div 
            onClick={() => galleryInputRef.current?.click()}
            className="p-6 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-dashed border-slate-700/80 hover:border-emerald-500/60 transition-all text-center cursor-pointer group space-y-2.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto group-hover:scale-105 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                Выберите фото чека
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Поддерживаются скриншоты банковских чеков, фото бумажных лент и QR-кодов
              </p>
            </div>
            <span className="inline-block px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-bold text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
              Выбрать фото
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CAMERA */}
      {activeTab === 'camera' && (
        <div className="space-y-3 animate-fade-in">
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <div 
            onClick={() => cameraInputRef.current?.click()}
            className="p-6 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-dashed border-slate-700/80 hover:border-emerald-500/60 transition-all text-center cursor-pointer group space-y-2.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                Сделать снимок чека
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Наведите камеру смартфона на кассовый чек при хорошем освещении
              </p>
            </div>
            <span className="inline-block px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-bold text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
              Включить камеру
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: DOCUMENT (PDF/FILE) */}
      {activeTab === 'document' && (
        <div className="space-y-3 animate-fade-in">
          <input
            type="file"
            ref={documentInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />
          <div 
            onClick={() => documentInputRef.current?.click()}
            className="p-6 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-dashed border-slate-700/80 hover:border-emerald-500/60 transition-all text-center cursor-pointer group space-y-2.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                Загрузить документ (PDF или скан)
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Электронные чеки из интернет-магазинов, доставок и банковских выписок
              </p>
            </div>
            <span className="inline-block px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-bold text-teal-400 group-hover:border-teal-500/50 transition-colors">
              Выбрать файл
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: PASTED TEXT */}
      {activeTab === 'text' && (
        <form onSubmit={handleTextSubmit} className="space-y-3 animate-fade-in">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Вставьте текст чека или SMS:
              </label>
              <button
                type="button"
                onClick={handleSampleText}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Вставить образец
              </button>
            </div>

            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Вставьте текст чека, выписку или список продуктов с ценами...&#10;Например:&#10;Хлеб 45&#10;Молоко 89&#10;Сыр 210"
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-emerald-500/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors custom-scrollbar"
            />
          </div>

          <button
            type="submit"
            disabled={!rawText.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Распознать текст чека</span>
          </button>
        </form>
      )}

      {/* TAB CONTENT 5: LINK */}
      {activeTab === 'link' && (
        <form onSubmit={handleUrlSubmit} className="space-y-3 animate-fade-in">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Ссылка на электронный чек:
            </label>
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="https://ofd.ru/check/... или ссылка из SMS"
                className="w-full bg-slate-950/90 border border-slate-800 focus:border-emerald-500/80 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Подходят ссылки ОФД (Первый ОФД, Такском, Платформа ОФД) и ссылки доставок.
            </p>
          </div>

          <button
            type="submit"
            disabled={!receiptUrl.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Загрузить по ссылке</span>
          </button>
        </form>
      )}
    </div>
  );
};
