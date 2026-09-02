import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  LogOut,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../entities/user';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 6;

interface FieldErrors {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  general?: string | null;
}

export const AuthCard: React.FC = () => {
  const { currentUser, firebaseUser, isAuthenticated, isLoading, login, register, logout } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Field touched / blur states for real-time validation feedback
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean }>({});

  // Field-specific & server errors
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side validation
  const getClientEmailError = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Адрес электронной почты обязателен для заполнения';
    if (!EMAIL_REGEX.test(trimmed)) return 'Введите корректный email (например, name@example.com)';
    return null;
  };

  const getClientPasswordError = (val: string): string | null => {
    if (!val) return 'Пароль обязателен для заполнения';
    if (val.length < MIN_PASSWORD_LENGTH) {
      return `Минимальная длина пароля — ${MIN_PASSWORD_LENGTH} символов (сейчас: ${val.length})`;
    }
    return null;
  };

  const getClientNameError = (val: string): string | null => {
    if (tab === 'register' && !val.trim()) {
      return 'Пожалуйста, укажите ваше имя';
    }
    return null;
  };

  const activeEmailError = serverErrors.email || (touched.email ? getClientEmailError(email) : null);
  const activePasswordError = serverErrors.password || (touched.password ? getClientPasswordError(password) : null);
  const activeNameError = serverErrors.name || (touched.name ? getClientNameError(name) : null);

  const isEmailValid = email.trim().length > 0 && EMAIL_REGEX.test(email.trim()) && !serverErrors.email;
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH && !serverErrors.password;
  const isNameValid = (tab === 'login' || name.trim().length > 0) && !serverErrors.name;
  const isFormValid = isEmailValid && isPasswordValid && isNameValid;

  const parseFirebaseError = (err: any): FieldErrors => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/user-not-found':
        return {
          email: 'Пользователь с таким email не найден. Проверьте адрес или зарегистрируйтесь.',
        };
      case 'auth/wrong-password':
        return {
          password: 'Неверный пароль. Пожалуйста, проверьте раскладку клавиатуры и повторите ввод.',
        };
      case 'auth/invalid-credential':
        return {
          email: 'Неверный адрес электронной почты или пароль.',
          password: 'Пожалуйста, проверьте введенные учетные данные.',
        };
      case 'auth/email-already-in-use':
        return {
          email: 'Пользователь с этим email уже зарегистрирован. Переключитесь на вкладку «Вход».',
        };
      case 'auth/weak-password':
        return {
          password: `Пароль слишком простой. Требуется минимум ${MIN_PASSWORD_LENGTH} символов.`,
        };
      case 'auth/invalid-email':
        return {
          email: 'Некорректный формат адреса электронной почты.',
        };
      case 'auth/user-disabled':
        return {
          email: 'Данная учетная запись заблокирована администратором.',
        };
      case 'auth/too-many-requests':
        return {
          general: 'Слишком много неудачных попыток. Доступ временно ограничен в целях безопасности, повторите попытку через 1-2 минуты.',
        };
      case 'auth/network-request-failed':
      case 'auth/timeout':
        return {
          general: 'Не удалось отправить запрос на сервер. Проверьте интернет-соединение или повторите попытку.',
        };
      case 'auth/internal-error':
        return {
          general: 'Внутренняя ошибка сервера авторизации. Пожалуйста, повторите попытку через несколько секунд.',
        };
      default: {
        const msg = err?.message || '';
        if (msg.includes('network') || msg.includes('offline') || msg.includes('Failed to fetch') || msg.includes('fetch')) {
          return {
            general: 'Проблема с отправкой запроса на сервер. Проверьте интернет-соединение и повторите попытку.',
          };
        }
        return {
          general: msg || 'Произошла ошибка при отправке запроса. Пожалуйста, попробуйте еще раз.',
        };
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrors({});
    setSuccessMessage(null);
    setTouched({ name: true, email: true, password: true });

    const clientEmailErr = getClientEmailError(email);
    const clientPasswordErr = getClientPasswordError(password);
    const clientNameErr = getClientNameError(name);

    if (clientEmailErr || clientPasswordErr || clientNameErr) {
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      if (tab === 'login') {
        await login(trimmedEmail, password);
        setSuccessMessage('Успешный вход в аккаунт!');
      } else {
        await register(name.trim(), trimmedEmail, password);
        setSuccessMessage('Аккаунт успешно создан!');
      }
    } catch (err: any) {
      const parsedErrors = parseFirebaseError(err);
      setServerErrors(parsedErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs text-[#A1A1AA]">Загрузка профиля...</p>
      </div>
    );
  }

  if (isAuthenticated && currentUser) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="bg-[#121214] rounded-3xl border border-[#27272A] p-6 sm:p-8 shadow-2xl shadow-black/60 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-4xl shadow-lg shadow-emerald-950/50 ring-4 ring-emerald-500/20">
            {currentUser.avatar || '🥑'}
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Активный аккаунт</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#FAFAFA] mt-2">
              {currentUser.name}
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              {currentUser.email}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18181B] border border-[#27272A] text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center text-[#D4D4D8]">
              <span className="text-[#71717A]">Статус:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Авторизован
              </span>
            </div>

            <div className="flex justify-between items-center text-[#D4D4D8]">
              <span className="text-[#71717A]">Валюта:</span>
              <span className="text-white font-mono font-medium">Российский рубль (₽)</span>
            </div>
          </div>

          <button
            id="btn-logout-card"
            onClick={logout}
            className="w-full py-3 px-4 rounded-xl bg-[#18181B] hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-rose-900/40 hover:border-rose-700/60 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти из аккаунта</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-400/20 mb-1">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">
          Форма авторизации
        </h1>
        <p className="text-xs text-[#A1A1AA]">
          Облачная регистрация и вход в систему
        </p>
      </div>

      <div className="bg-[#121214] rounded-3xl border border-[#27272A] shadow-2xl shadow-black/60 p-6 sm:p-8">
        <div className="flex rounded-2xl bg-[#18181B] border border-[#27272A] p-1 mb-6">
          <button
            id="auth-tab-login"
            type="button"
            onClick={() => { 
              setTab('login'); 
              setServerErrors({});
              setSuccessMessage(null);
              setTouched({});
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-[#27272A] text-[#FAFAFA] shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
            }`}
          >
            Вход в систему
          </button>
          <button
            id="auth-tab-register"
            type="button"
            onClick={() => { 
              setTab('register'); 
              setServerErrors({});
              setSuccessMessage(null);
              setTouched({});
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-[#27272A] text-[#FAFAFA] shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
            }`}
          >
            Регистрация
          </button>
        </div>

        {serverErrors.general && (
          <div id="auth-error-banner" className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs flex items-start gap-2.5 shadow-md shadow-rose-950/40">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-rose-300">Ошибка отправки запроса</p>
              <p className="text-rose-200/90 leading-relaxed">{serverErrors.general}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div id="auth-success-banner" className="mb-5 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#D4D4D8] mb-1.5">
                Ваше имя
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (serverErrors.name) setServerErrors(prev => ({ ...prev, name: null }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                  placeholder="Иван Иванов"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#18181B] text-[#FAFAFA] placeholder-[#71717A] text-sm outline-none transition-all border ${
                    activeNameError 
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : touched.name && name.trim()
                        ? 'border-emerald-500/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-[#27272A] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
              {activeNameError && (
                <p id="error-name-field" className="mt-1.5 text-[11px] text-rose-400 flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{activeNameError}</span>
                </p>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#D4D4D8]">
                Электронная почта
              </label>
              {touched.email && isEmailValid && !activeEmailError && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Корректный email
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (serverErrors.email || serverErrors.general) {
                    setServerErrors(prev => ({ ...prev, email: null, general: null }));
                  }
                }}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                placeholder="name@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#18181B] text-[#FAFAFA] placeholder-[#71717A] text-sm outline-none transition-all border ${
                  activeEmailError
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-950/10'
                    : touched.email && isEmailValid
                      ? 'border-emerald-500/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'border-[#27272A] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            </div>
            {activeEmailError && (
              <p id="error-email-field" className="mt-1.5 text-[11px] text-rose-400 flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{activeEmailError}</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#D4D4D8]">
                Пароль
              </label>
              <span className={`text-[10px] ${password.length >= MIN_PASSWORD_LENGTH ? 'text-emerald-400 font-medium' : 'text-[#71717A]'}`}>
                {password.length >= MIN_PASSWORD_LENGTH ? (
                  `✓ ${password.length} символов`
                ) : (
                  `мин. ${MIN_PASSWORD_LENGTH} символов`
                )}
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (serverErrors.password || serverErrors.general) {
                    setServerErrors(prev => ({ ...prev, password: null, general: null }));
                  }
                }}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#18181B] text-[#FAFAFA] placeholder-[#71717A] text-sm outline-none transition-all border ${
                  activePasswordError
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-950/10'
                    : touched.password && isPasswordValid
                      ? 'border-emerald-500/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'border-[#27272A] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#D4D4D8] cursor-pointer"
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password.length > 0 && !activePasswordError && (
              <div className="mt-2 space-y-1">
                <div className="h-1 w-full bg-[#27272A] rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      password.length >= MIN_PASSWORD_LENGTH
                        ? 'w-full bg-emerald-500'
                        : password.length >= 4
                          ? 'w-2/3 bg-amber-500'
                          : 'w-1/3 bg-rose-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {activePasswordError && (
              <p id="error-password-field" className="mt-1.5 text-[11px] text-rose-400 flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{activePasswordError}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#27272A] bg-[#18181B] accent-emerald-600 cursor-pointer"
              />
              <span>Запомнить сессию в облаке</span>
            </label>
          </div>

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 ${
              isFormValid
                ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-950/40 hover:shadow-xl'
                : 'bg-emerald-700/80 hover:bg-emerald-600 shadow-emerald-950/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Выполняется запрос...</span>
              </>
            ) : (
              <>
                <span>{tab === 'login' ? 'Войти в аккаунт' : 'Зарегистрироваться'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
