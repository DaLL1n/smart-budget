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

type BrowserTab = 'samsung' | 'chrome' | 'ios' | 'yandex';

interface TabConfig {
  id: BrowserTab;
  label: string;
  fullName: string;
}

const TABS: TabConfig[] = [
  { id: 'samsung', label: 'Samsung', fullName: 'Samsung Internet' },
  { id: 'chrome', label: 'Chrome', fullName: 'Google Chrome' },
  { id: 'ios', label: 'Safari (iOS)', fullName: 'Safari на iPhone' },
  { id: 'yandex', label: 'Яндекс', fullName: 'Яндекс Браузер' },
];

export const MandatoryInstallScreen: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<BrowserTab>('chrome');
  const [installedSuccessfully, setInstalledSuccessfully] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) {
      setActiveTab('ios');
    } else if (/SamsungBrowser/i.test(ua)) {
      setActiveTab('samsung');
    } else if (/YaBrowser/i.test(ua)) {
      setActiveTab('yandex');
    } else {
      setActiveTab('chrome');
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
            <span>Установить приложение</span>
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
              className="fixed inset-x-0 bottom-0 z-[10001] bg-slate-900/95 border-t border-slate-800 rounded-t-[28px] p-5 sm:p-6 shadow-2xl max-w-md mx-auto backdrop-blur-xl max-h-[90dvh] flex flex-col"
            >
              {/* Top Handle Indicator */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 shrink-0" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      Добавление на главный экран
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Инструкция для {TABS.find(t => t.id === activeTab)?.fullName}
                    </p>
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

              {/* OS & Browser Selector Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/90 mb-4 shrink-0 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 min-w-[74px] py-2 px-2 rounded-xl text-[11px] font-semibold transition-all text-center whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Step Items by Active Tab */}
              <div className="overflow-y-auto no-scrollbar space-y-2.5 mb-5 text-xs text-slate-200 pr-0.5">
                {activeTab === 'samsung' && (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </span>
                      <span>
                        Нажмите меню браузера <strong className="text-white">☰</strong> или <strong className="text-white">⋮</strong> в правом нижнем (или верхнем) углу
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </span>
                      <span>
                        В открывшемся списке выберите <strong className="text-white">«Добавить страницу в»</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </span>
                      <span>
                        В подменю нажмите <strong className="text-white">«Главный экран»</strong> (или «Установить как веб-приложение»)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        4
                      </span>
                      <span>
                        Подтвердите действие, нажав кнопку <strong className="text-white">«Добавить»</strong>
                      </span>
                    </div>
                  </>
                )}

                {activeTab === 'chrome' && (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </span>
                      <span>
                        Нажмите меню браузера <strong className="text-white">⋮</strong> в правом верхнем углу
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </span>
                      <span>
                        Выберите пункт <strong className="text-white">«Установить приложение»</strong> (или «Добавить на главный экран»)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </span>
                      <span>
                        Подтвердите нажатием кнопки <strong className="text-white">«Установить»</strong> (или «Добавить»)
                      </span>
                    </div>
                  </>
                )}

                {activeTab === 'ios' && (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </span>
                      <span>
                        Нажмите кнопку <strong className="text-white">«Поделиться»</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> на панели Safari внизу
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </span>
                      <span>
                        В открывшемся меню выберите <strong className="text-white">«На экран „Домой“»</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </span>
                      <span>
                        В правом верхнем углу нажмите <strong className="text-white">«Добавить»</strong>
                      </span>
                    </div>
                  </>
                )}

                {activeTab === 'yandex' && (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </span>
                      <span>
                        Нажмите меню браузера <strong className="text-white">⋮</strong> или <strong className="text-white">☰</strong> рядом с адресной строкой
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </span>
                      <span>
                        В списке опций выберите <strong className="text-white">«Добавить ярлык на телефон»</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </span>
                      <span>
                        В появившемся окне нажмите <strong className="text-white">«Добавить»</strong>
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Close / Got it Button */}
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:bg-slate-700 text-white font-semibold text-sm transition-all cursor-pointer shrink-0"
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
