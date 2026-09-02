import React, { useState } from 'react';
import { Bomb } from 'lucide-react';

export const BuggyComponent: React.FC<{ label?: string }> = ({
  label = 'Смоделировать сбой рендеринга',
}) => {
  const [shouldCrash, setShouldCrash] = useState(false);

  // Never render test crash trigger in production build
  if (!import.meta.env.DEV) {
    return null;
  }

  if (shouldCrash) {
    throw new Error('ТЕСТОВАЯ ОШИБКА РЕНДЕРИНГА: BuggyComponent был принудительно сломан для проверки ErrorBoundary!');
  }

  return (
    <button
      type="button"
      onClick={() => setShouldCrash(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
      title="Нажмите, чтобы выбросить синхронную ошибку рендеринга"
    >
      <Bomb className="w-3.5 h-3.5 text-rose-400" />
      <span>{label}</span>
    </button>
  );
};
