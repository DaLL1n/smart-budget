import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, X, Plus, Check, Loader2, Store, MapPin } from 'lucide-react';
import { StoreOption, fetchStoresForCity } from '../../../entities/store';

interface StoreSelectorProps {
  city: string;
  selectedStores: string[];
  onChange: (stores: string[]) => void;
}

export const StoreSelector: React.FC<StoreSelectorProps> = ({
  city,
  selectedStores,
  onChange,
}) => {
  const [availableStores, setAvailableStores] = useState<StoreOption[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState<string>('');
  const [isStoreSelectOpen, setIsStoreSelectOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadStores = async () => {
      setIsLoadingStores(true);
      try {
        const stores = await fetchStoresForCity(city);
        if (isMounted) {
          setAvailableStores(stores);
          if (selectedStores.length === 0 && stores.length > 0) {
            onChange(stores.slice(0, 3).map(s => s.id));
          }
        }
      } catch (err) {
        console.error('Failed to load stores for city:', err);
      } finally {
        if (isMounted) setIsLoadingStores(false);
      }
    };

    loadStores();
    return () => {
      isMounted = false;
    };
  }, [city]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStoreSelectOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addStore = (storeId: string) => {
    if (!selectedStores.includes(storeId)) {
      onChange([...selectedStores, storeId]);
    }
    setIsStoreSelectOpen(false);
    setStoreSearchQuery('');
  };

  const removeStore = (storeId: string) => {
    onChange(selectedStores.filter(id => id !== storeId));
  };

  const filteredStores = availableStores.filter(store => {
    if (!storeSearchQuery.trim()) return true;
    const query = storeSearchQuery.toLowerCase().trim();
    return (
      store.name.toLowerCase().includes(query) ||
      (store.category && store.category.toLowerCase().includes(query))
    );
  });

  const selectedStoreObjects = selectedStores.map(id => {
    const found = availableStores.find(s => s.id === id);
    if (found) return found;
    return {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      category: 'supermarket' as const,
      color: '#10b981'
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="city-stores-select-input" className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-emerald-400" />
          <span>Магазины и доставка в г. {city || 'Ваш город'}</span>
        </label>
        <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>выбрано: {selectedStores.length}</span>
        </span>
      </div>

      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setIsStoreSelectOpen(prev => !prev)}
          className={`w-full bg-zinc-950/90 border rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-all ${
            isStoreSelectOpen 
              ? 'border-emerald-500 ring-1 ring-emerald-500/30' 
              : 'border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-zinc-400 truncate">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="truncate">
              {isLoadingStores 
                ? `Загрузка магазинов для города ${city}...` 
                : 'Нажмите, чтобы выбрать или найти магазин...'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isLoadingStores && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
              isStoreSelectOpen ? 'rotate-180 text-emerald-400' : ''
            }`} />
          </div>
        </div>

        <AnimatePresence>
          {isStoreSelectOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-2 z-50 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-72 flex flex-col"
            >
              <div className="p-2.5 border-b border-zinc-800 bg-zinc-950/90 sticky top-0 z-10 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input
                  id="city-stores-select-input"
                  type="text"
                  value={storeSearchQuery}
                  onChange={(e) => setStoreSearchQuery(e.target.value)}
                  placeholder="Поиск магазина (Пятёрочка, ВкусВилл, Самокат...)"
                  autoFocus
                  className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
                {storeSearchQuery && (
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded shrink-0">
                    {filteredStores.length}
                  </span>
                )}
                {storeSearchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStoreSearchQuery('');
                    }}
                    className="text-zinc-500 hover:text-white text-xs p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="overflow-y-auto divide-y divide-zinc-800/40 p-1.5 custom-scrollbar">
                {filteredStores.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    Магазин «{storeSearchQuery.trim()}» не найден в списке города {city}.
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (storeSearchQuery.trim()) {
                          const customId = `custom_${Date.now()}`;
                          const newStore: StoreOption = {
                            id: customId,
                            name: storeSearchQuery.trim(),
                            category: 'supermarket',
                            color: '#10b981'
                          };
                          setAvailableStores(prev => [newStore, ...prev]);
                          addStore(customId);
                        }
                      }}
                      className="mt-2 block mx-auto px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-[11px]"
                    >
                      + Добавить «{storeSearchQuery.trim()}»
                    </button>
                  </div>
                ) : (
                  filteredStores.map((store) => {
                    const isAdded = selectedStores.includes(store.id);
                    const query = storeSearchQuery.trim().toLowerCase();
                    let nameDisplay: React.ReactNode = store.name;
                    if (query) {
                      const idx = store.name.toLowerCase().indexOf(query);
                      if (idx !== -1) {
                        const before = store.name.slice(0, idx);
                        const match = store.name.slice(idx, idx + query.length);
                        const after = store.name.slice(idx + query.length);
                        nameDisplay = (
                          <span>
                            {before}
                            <span className="text-emerald-400 font-bold bg-emerald-500/20 px-0.5 rounded">
                              {match}
                            </span>
                            {after}
                          </span>
                        );
                      }
                    }

                    return (
                      <div
                        key={store.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isAdded) {
                            removeStore(store.id);
                          } else {
                            addStore(store.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (isAdded) {
                              removeStore(store.id);
                            } else {
                              addStore(store.id);
                            }
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-lg text-left text-xs transition-all duration-150 flex items-center justify-between cursor-pointer select-none ${
                          isAdded 
                            ? 'bg-emerald-950/50 text-emerald-300 hover:bg-emerald-950/70 border border-emerald-500/30' 
                            : 'hover:bg-zinc-800/90 text-zinc-200 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                            style={{ backgroundColor: store.color }} 
                          />
                          <span className="font-medium truncate">{nameDisplay}</span>
                          <span className="text-[10px] text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-zinc-950/60 border border-zinc-800">
                            {store.category === 'delivery' ? 'доставка' : store.category === 'organic' ? 'зож' : store.category === 'discount' ? 'дискаунтер' : 'супермаркет'}
                          </span>
                        </div>
                        <div className="shrink-0 ml-2 pointer-events-none">
                          {isAdded ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-[11px] font-bold text-emerald-400 border border-emerald-500/40">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Добавлен</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-[11px] text-zinc-400 group-hover:text-emerald-300 border border-zinc-700/60">
                              <Plus className="w-3 h-3" />
                              <span>Выбрать</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <div className="text-[11px] font-medium text-zinc-400 mb-2">
          Добавленные магазины ({selectedStoreObjects.length}):
        </div>
        {selectedStoreObjects.length === 0 ? (
          <div className="p-3 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-xs text-zinc-500 text-center">
            Ни один магазин не выбран. Выберите магазины в выпадающем списке выше.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selectedStoreObjects.map((store) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-300 text-xs font-medium shadow-sm hover:border-emerald-500 transition-colors group"
                >
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: store.color }} 
                  />
                  <span>{store.name}</span>
                  <button
                    type="button"
                    onClick={() => removeStore(store.id)}
                    title="Удалить из выбранных"
                    className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-400 hover:bg-rose-950 hover:text-rose-300 flex items-center justify-center transition-colors ml-1"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
