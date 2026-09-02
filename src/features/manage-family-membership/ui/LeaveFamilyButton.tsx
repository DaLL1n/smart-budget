import React, { useState } from 'react';
import { LogOut, Loader2, AlertTriangle, X } from 'lucide-react';
import { User } from '../../../entities/user';
import { Family, useLeaveFamilyMutation } from '../../../entities/family';

interface LeaveFamilyButtonProps {
  currentUser: User;
  family: Family;
  onFamilyUpdated?: (family: Family | null) => void;
}

export const LeaveFamilyButton: React.FC<LeaveFamilyButtonProps> = ({
  currentUser,
  family,
  onFamilyUpdated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const leaveMutation = useLeaveFamilyMutation(currentUser);

  const isWillDissolve = family.members.length <= 2;
  const isLeaving = leaveMutation.isPending;

  const handleConfirm = async () => {
    setError(null);
    try {
      await leaveMutation.mutateAsync();
      setIsOpen(false);
      if (onFamilyUpdated) onFamilyUpdated(null);
    } catch (err: any) {
      setError(err?.message || 'Не удалось выйти из семьи.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        disabled={isLeaving}
        className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        title="Выйти из этого семейного пространства"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Выйти из семьи</span>
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 text-left">
            <button
              type="button"
              onClick={() => !isLeaving && setIsOpen(false)}
              disabled={isLeaving}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Выход из семьи</h4>
                <p className="text-xs text-slate-400">Подтвердите действие</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                Вы уверены, что хотите выйти из текущего семейного пространства?
              </p>
              {isWillDissolve && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  Внимание: В семье останется меньше двух участников, поэтому семейное пространство будет автоматически распущено.
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isLeaving}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLeaving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLeaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Выход...</span>
                  </>
                ) : (
                  <span>Да, выйти из семьи</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
