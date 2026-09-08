import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  Menu,
  X
} from 'lucide-react';

export const MandatoryInstallScreen: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'samsung' | 'android' | 'other'>('other');
  const [installedSuccessfully, setInstalledSuccessfully] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) {
      setPlatform('ios');
    } else if (/SamsungBrowser/i.test(ua)) {
      setPlatform('samsung');
    } else if (/Android/i.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // Read immediately from global — event may have fired before this component mounted
    if (window.__deferredInstallPrompt) {
      setDeferredPrompt(window.__deferredInstallPrompt);
    }

    // Also listen for the custom event in case the prompt fires after mount
    const handleInstallReady = () => {
      if (window.__deferredInstallPrompt) {
        setDeferredPrompt(window.__deferredInstallPrompt);
      }
    };

    const handleAppInstalled = () => {
      setInstalledSuccessfully(true);
      setDeferredPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener('pwa-install-ready', handleInstallReady);
    window.addEventListener('pwa-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-install-ready', handleInstallReady);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || window.__deferredInstallPrompt;
    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        window.__deferredInstallPrompt = null;
        setDeferredPrompt(null);
        if (choice.outcome === 'accepted') {
          setInstalledSuccessfully(true);
        } else {
          // User dismissed the native dialog — show manual instructions as fallback
          setShowInstructions(true);
        }
      } catch (err) {
        console.warn('Install prompt failed, showing instructions:', err);
        setShowInstructions(true);
      }
    } else {
      // No native prompt available (iOS, or browser without beforeinstallprompt)
      setShowInstructions(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#090D16] text-white flex flex-col justify-between items-center p-6 select-none overflow-hidden h-[100dvh] w-full">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Pill */}
      <div className="relative z-10 pt-4 flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Мобильное приложение</span>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full my-auto">
        {/* Animated App Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-300 p-0.5 shadow-2xl shadow-emerald-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-5xl">
              🥑
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md border-2 border-[#090D16]">
            +
          </div>
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
          Смарт-Бюджет
        </h1>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed max-w-xs">
          {installedSuccessfully ? (
            <span className="text-emerald-400 font-medium">
              Ярлык успешно добавлен! Откройте приложение с главного экрана вашего телефона.
            </span>
          ) : (
            'Установите приложение на главный экран, чтобы пользоваться всеми возможностями сервиса.'
          )}
        </p>
      </div>

      {/* Bottom Mandatory Action Button */}
      <div className="relative z-10 w-full max-w-sm pb-4">
        {installedSuccessfully ? (
          <div className="w-full py-4 px-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold text-center text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Запустите ярлык «Смарт-Бюджет»</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2.5 shadow-2xl shadow-emerald-500/40 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>Добавить на рабочий стол</span>
          </button>
        )}
      </div>

      {/* Bottom Sheet Instructions */}
      <AnimatePresence>
        {showInstructions && !installedSuccessfully && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstructions(false)}
              className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm"
            />

            {/* Slide-up Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[10001] bg-slate-900/95 border-t border-slate-800 rounded-t-[28px] p-6 shadow-2xl max-w-md mx-auto backdrop-blur-xl"
            >
              {/* Top Handle Indicator */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {platform === 'ios' ? 'Инструкция для Safari' : 'Добавление на главный экран'}
                    </h3>
                    <p className="text-[11px] text-slate-400">3 простых шага</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstructions(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Items */}
              {platform === 'ios' ? (
                <div className="space-y-2.5 mb-6 text-xs text-slate-200">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </span>
                    <span>
                      Нажмите <strong className="text-white">«Поделиться»</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> внизу Safari
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </span>
                    <span>
                      Выберите <strong className="text-white">«На экран „Домой“»</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </span>
                    <span>
                      В верхнем углу нажмите <strong className="text-white">«Добавить»</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 mb-6 text-xs text-slate-200">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </span>
                    <span>
                      Нажмите меню браузера <Menu className="w-3.5 h-3.5 inline mx-1 text-slate-300" /> в правом углу экрана
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </span>
                    <span>
                      Выберите <strong className="text-white">«Добавить на главный экран»</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </span>
                    <span>
                      Подтвердите нажатием <strong className="text-white">«Добавить»</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Close / Got it Button */}
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:bg-slate-700 text-white font-semibold text-sm transition-all cursor-pointer"
              >
                Понятно
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
