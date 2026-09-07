import React, { useState } from 'react';
import { 
  Users, 
  UserMinus, 
  LogOut, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  AlertTriangle,
  X 
} from 'lucide-react';
import { User } from '../../../entities/user';
import { 
  Family, 
  FamilyMember, 
  useLeaveFamilyMutation, 
  useRemoveFamilyMemberMutation 
} from '../../../entities/family';
import { formatRubles } from '../../../entities/budget';

interface FamilyMemberListProps {
  currentUser: User;
  family: Family;
  onFamilyUpdated?: (family: Family | null) => void;
}

type ModalType = 'leave' | 'remove' | null;

export const FamilyMemberList: React.FC<FamilyMemberListProps> = ({
  currentUser,
  family,
  onFamilyUpdated,
}) => {
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null);

  const leaveMutation = useLeaveFamilyMutation(currentUser);
  const removeMutation = useRemoveFamilyMemberMutation(currentUser);

  const isWillDissolve = family.members.length <= 2;

  const openLeaveModal = () => {
    setError(null);
    setModalType('leave');
  };

  const openRemoveModal = (member: FamilyMember) => {
    setError(null);
    setMemberToRemove(member);
    setModalType('remove');
  };

  const closeModal = () => {
    if (processingUserId) return;
    setModalType(null);
    setMemberToRemove(null);
  };

  const confirmLeave = async () => {
    setProcessingUserId(currentUser.id);
    setError(null);
    try {
      await leaveMutation.mutateAsync();
      closeModal();
      if (onFamilyUpdated) onFamilyUpdated(null);
    } catch (err: any) {
      setError(err?.message || 'Не удалось выйти из семьи.');
    } finally {
      setProcessingUserId(null);
    }
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;
    setProcessingUserId(memberToRemove.userId);
    setError(null);
    try {
      const updatedFamily = await removeMutation.mutateAsync(memberToRemove.userId);
      closeModal();
      if (onFamilyUpdated) onFamilyUpdated(updatedFamily);
    } catch (err: any) {
      setError(err?.message || 'Не удалось удалить участника.');
    } finally {
      setProcessingUserId(null);
    }
  };

  const isLeaving = leaveMutation.isPending && processingUserId === currentUser.id;

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
            Участники семьи
          </h3>
        </div>

        <button
          type="button"
          onClick={openLeaveModal}
          disabled={isLeaving}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Выйти из этого семейного пространства"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Выйти из семьи</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {family.members.map((member) => {
          const isCurrent = 
            member.userId === currentUser.id || 
            (!!member.email && !!currentUser.email && member.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase());
          const isRemovingThis = removeMutation.isPending && processingUserId === member.userId;

          return (
            <div 
              key={member.userId}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isCurrent 
                  ? 'bg-gradient-to-r from-emerald-950/30 to-slate-900/80 border-emerald-500/30 shadow-sm' 
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${member.avatarColor || 'from-emerald-400 to-teal-500'} flex items-center justify-center text-lg shadow-md shrink-0 select-none`}>
                  {member.avatar || '🥑'}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {member.name}
                    </span>
                    {isCurrent ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
                        Вы
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                        Участник
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{member.email}</div>
                  <div className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                    Траты: {formatRubles(member.monthlySpent || 0)}
                  </div>
                </div>
              </div>

              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => openRemoveModal(member)}
                  disabled={isRemovingThis}
                  className="p-2 rounded-xl bg-slate-950/70 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/60 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  title={`Удалить ${member.name} из семьи`}
                >
                  {isRemovingThis ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* --- CUSTOM CONFIRMATION MODAL --- */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {modalType === 'leave' ? 'Выход из семьи' : 'Удаление участника'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalType === 'leave' ? 'Подтвердите выход из пространства' : 'Подтвердите действие'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={!!processingUserId}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Description */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 space-y-2 leading-relaxed">
              {modalType === 'leave' ? (
                <>
                  <p>
                    Вы действительно хотите покинуть семейное пространство?
                  </p>
                  {isWillDissolve && (
                    <p className="text-amber-400/90 font-medium">
                      ⚠️ В семье останется меньше двух человек — семейное пространство будет автоматически распущено.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p>
                    Вы собираетесь исключить участника <span className="text-white font-bold">{memberToRemove?.name}</span> (<span className="font-mono text-slate-400">{memberToRemove?.email}</span>) из семейного бюджета.
                  </p>
                  {isWillDissolve && (
                    <p className="text-amber-400/90 font-medium">
                      ⚠️ В семье останется 1 человек — семейное пространство будет распущено.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeModal}
                disabled={!!processingUserId}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={modalType === 'leave' ? confirmLeave : confirmRemove}
                disabled={!!processingUserId}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {processingUserId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Выполняется...</span>
                  </>
                ) : (
                  <span>
                    {modalType === 'leave' ? 'Да, выйти из семьи' : 'Да, исключить'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
