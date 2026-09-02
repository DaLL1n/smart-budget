import React, { useState } from 'react';
import { Mail, UserPlus, CheckCircle2, AlertCircle, Loader2, Users } from 'lucide-react';
import { User } from '../../../entities/user';
import { Family, useAddFamilyMemberMutation, addFamilyMemberInputSchema } from '../../../entities/family';

interface AddFamilyMemberFormProps {
  currentUser: User;
  onMemberAdded?: (family: Family) => void;
  title?: string;
  subtitle?: string;
}

export const AddFamilyMemberForm: React.FC<AddFamilyMemberFormProps> = ({
  currentUser,
  onMemberAdded,
  title = 'Добавить участника в семью',
  subtitle = 'Введите Email зарегистрированного родственника для совместного ведения бюджета',
}) => {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const addMutation = useAddFamilyMemberMutation(currentUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    const parsed = addFamilyMemberInputSchema.safeParse({ email });
    if (!parsed.success) {
      setValidationError(parsed.error.issues?.[0]?.message || 'Некорректный email');
      return;
    }

    try {
      const updatedFamily = await addMutation.mutateAsync(parsed.data);
      setEmail('');
      setSuccessMessage(`Участник ${parsed.data.email} успешно добавлен в семью!`);
      if (onMemberAdded) {
        onMemberAdded(updatedFamily);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setValidationError(err?.message || 'Не удалось добавить участника в семью.');
    }
  };

  const isPending = addMutation.isPending;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <UserPlus className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">{title}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="name@example.com"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !email.trim()}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-95 cursor-pointer shrink-0"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Добавить</span>
              </>
            )}
          </button>
        </div>
      </form>

      {validationError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
