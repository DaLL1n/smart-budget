import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  Sparkles, 
  Check, 
  X, 
  ChevronRight,
  Menu,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { MobilePlatform } from '../model/usePwaInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onInstall: () => Promise<boolean>;
  canNativeInstall: boolean;
  platform: MobilePlatform;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  onDismiss,
  onInstall,
  canNativeInstall,
  platform,
}) => {
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(!canNativeInstall);

  if (!isOpen) return null;

  const handleNativeClick = async () => {
    setIsInstalling(true);
    try {
      const installed = await onInstall();
      if (!installed) {
        setShowManualGuide(true);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const isIos = platform === 'ios';
  const isSamsung = platform === 'samsung';

  return (
    <AnimatePresence>
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="install-modal-title"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 text-slate-100 z-10 custom-scrollbar-viewport"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* App Header Badge */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-emerald-950/60 shrink-0 border border-emerald-400/30">
              🥑
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold tracking-wide uppercase mb-1 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                Веб-приложение
              </div>
              <h2 id="install-modal-title" className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                Установите Смарт-Бюджет
              </h2>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="grid grid-cols-1 gap-2.5 mb-5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-slate-300">
                <strong className="text-white">Полноэкранный режим:</strong> никаких адресных строк и всплывающих панелей браузера.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-slate-300">
                <strong className="text-white">Запуск в 1 касание:</strong> отдельная иконка на домашнем экране вашего телефона.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-slate-300">
                <strong className="text-white">Офлайн-кэш:</strong> доступ к вашим спискам и расходам даже без связи.
              </span>
            </div>
          </div>

          {/* Platform-Specific Installation Guide */}
          {isIos ? (
            /* iOS Safari Step-by-Step */
            <div className="space-y-3 mb-6 bg-gradient-to-b from-slate-800/60 to-slate-900/60 p-4 rounded-xl border border-slate-700/60">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                Инструкция для iPhone / iPad (Safari)
              </div>
              <div className="space-y-2.5 text-xs text-slate-200">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    Нажмите кнопку <strong className="text-white">«Поделиться»</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> на нижней панели Safari.
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    Прокрутите меню вниз и выберите <strong className="text-white">«На экран „Домой“»</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    В правом верхнем углу нажмите <strong className="text-white">«Добавить»</strong>.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Samsung / Chromium */
            <div className="space-y-3 mb-6">
              {canNativeInstall && !showManualGuide ? (
                <button
                  type="button"
                  onClick={handleNativeClick}
                  disabled={isInstalling}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-slate-950" />
                  <span>{isInstalling ? 'Установка...' : 'Добавить на главный экран'}</span>
                </button>
              ) : (
                <div className="space-y-2.5 bg-gradient-to-b from-slate-800/60 to-slate-900/60 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-200">
                  <div className="font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Smartphone className="w-3.5 h-3.5" />
                    {isSamsung ? 'Инструкция для Samsung Internet' : 'Инструкция для Android'}
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      Нажмите меню браузера <Menu className="w-3.5 h-3.5 inline mx-1 text-slate-300" /> (кнопка <strong className="text-white">⋮</strong> или <strong className="text-white">☰</strong> в правом углу).
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      Выберите пункт <strong className="text-white">«Добавить страницу в...»</strong> ➔ <strong className="text-white">«Главный экран»</strong> (или «Установить приложение»).
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      Подтвердите нажатием <strong className="text-white">«Добавить»</strong>.
                    </div>
                  </div>
                </div>
              )}

              {canNativeInstall && (
                <button
                  type="button"
                  onClick={() => setShowManualGuide(!showManualGuide)}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
                >
                  {showManualGuide ? 'Скрыть пошаговую инструкцию' : 'Как установить вручную через меню?'}
                </button>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors text-center"
            >
              Напомнить позже
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
            >
              Понятно
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
