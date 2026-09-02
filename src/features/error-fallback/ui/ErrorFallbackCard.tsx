import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, RotateCcw, ChevronDown, ChevronUp, Bug, Hash } from 'lucide-react';

export interface ErrorFallbackCardProps {
  error: Error;
  resetErrorBoundary: () => void;
  title?: string;
  subtitle?: string;
  variant?: 'page' | 'widget';
}

export const ErrorFallbackCard: React.FC<ErrorFallbackCardProps> = ({
  error,
  resetErrorBoundary,
  title = 'Что-то пошло не так',
  subtitle = 'В этом компоненте произошел непредвиденный сбой. Ваши остальные данные в безопасности.',
  variant = 'widget',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Vite environment flag: true only during 'npm run dev'
  const isDev = import.meta.env.DEV;

  // Generate deterministic/stable reference code from error for support tickets
  const incidentCode = React.useMemo(() => {
    const raw = `${error?.message || 'unknown'}_${error?.name || 'error'}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `ERR-${Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`;
  }, [error]);

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      resetErrorBoundary();
      setIsResetting(false);
    }, 250);
  };

  const isPage = variant === 'page';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`w-full ${
        isPage
          ? 'min-h-[70vh] flex items-center justify-center p-4'
          : 'p-4 sm:p-6 my-3'
      }`}
    >
      <div
        className={`w-full ${
          isPage ? 'max-w-xl' : 'max-w-full'
        } rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 border border-rose-500/30 shadow-2xl relative overflow-hidden backdrop-blur-xl p-6 sm:p-7 space-y-5`}
      >
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header: Icon + Title + Variant Badge */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/10">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/20">
                  {variant === 'page' ? 'App Error' : 'Widget Fallback'}
                </span>
                {!isDev && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-950/80 border border-slate-800 flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5 text-slate-500" />
                    <span>{incidentCode}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Production friendly safe notice */}
        {!isDev && (
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <p>
              Отчет об ошибке автоматически зафиксирован во внутреннем журнале инцидентов.
            </p>
            <p className="text-[11px] text-slate-500">
              При обращении в поддержку назовите код ошибки: <span className="font-mono text-emerald-400 font-semibold">{incidentCode}</span>
            </p>
          </div>
        )}

        {/* Action Button & Details Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Попробовать снова</span>
          </button>

          {/* Technical Details: Only visible in DEV mode for security */}
          {isDev ? (
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="px-3 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              <span>{showDetails ? 'Скрыть детали' : 'Технические детали (Dev)'}</span>
              {showDetails ? (
                <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
              )}
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono">
              Безопасный режим
            </span>
          )}
        </div>

        {/* Technical Details Accordion (Only in DEV) */}
        {isDev && (
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Сообщение ошибки:</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">ID: {incidentCode}</span>
                  </div>

                  <div className="font-mono text-[11px] text-rose-300 bg-rose-950/30 p-2.5 rounded-xl border border-rose-900/40 break-all select-all">
                    {error?.message || 'Неизвестная ошибка рендеринга'}
                  </div>

                  {error?.stack && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Трассировка стека (скрыта в Production):
                      </div>
                      <pre className="text-[10px] text-slate-400 font-mono bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 overflow-x-auto max-h-40 leading-normal select-all">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};
