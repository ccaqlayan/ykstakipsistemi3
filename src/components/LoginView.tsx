import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  Lock, 
  Mail, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  School,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { YildizLisesiLogo } from './YildizLisesiLogo';
import { DEFAULT_AVATAR } from '../data/initialData';
import { APP_VERSION } from '../version';


interface LoginViewProps {
  users: UserAccount[];
  classes: { id: string; name: string }[];
  onLoginSuccess: (user: UserAccount) => void;
  onCreateAccount: (user: Omit<UserAccount, 'id'>) => void;
  onUpdateAccount?: (user: UserAccount) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  classes,
  onLoginSuccess,
  onCreateAccount,
  onUpdateAccount,
  theme = 'dark',
  onToggleTheme
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [role, setRole] = useState<UserRole>('student');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClassName, setRegClassName] = useState(classes[0]?.name || '12-A SAY');
  const [isRegistering, setIsRegistering] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [foundUser, setFoundUser] = useState<UserAccount | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lockoutCountdownSeconds, setLockoutCountdownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0 && lockoutCountdownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setLockoutCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds, lockoutCountdownSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0 || lockoutCountdownSeconds > 0) return;

    setErrorMessage('');
    setSuccessMessage('');
    setIsRegistering(true); // Using this for loading state

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Giriş yapılamadı.');
        if (data.lockoutRemainingSeconds && data.lockoutRemainingSeconds > 0) {
          setLockoutCountdownSeconds(data.lockoutRemainingSeconds);
        } else {
          setCooldownSeconds(5);
        }
        setIsRegistering(false);
        return;
      }
      
      const now = Date.now().toString();
      localStorage.setItem('yks_last_active_time', now);
      localStorage.setItem('yks_remember_me', 'true');
      sessionStorage.setItem('yks_session_active', 'true');
      
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMessage('Sunucuya bağlanılamadı.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!(regName || '').trim() || !(regEmail || '').trim() || !(regPassword || '').trim()) {
      setErrorMessage('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    const existing = users.find(
      (u) => (u.email || '').trim().toLowerCase() === (regEmail || '').trim().toLowerCase()
    );

    if (existing) {
      setErrorMessage('Bu e-posta adresi zaten kullanımda.');
      return;
    }

    setIsRegistering(true);
    try {
      const response = await fetch('/api/auth/register-limit-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setErrorMessage(result.error || 'Aynı cihazdan en fazla 3 hesap talebinde bulunabilirsiniz. Fazlası için sınıf rehber öğretmeniniz ile iletişime geçiniz.');
        setIsRegistering(false);
        return;
      }
    } catch (err) {
      console.error('Registration limit check failed:', err);
    }

    const newUser: Omit<UserAccount, 'id'> = {
      name: regName,
      email: regEmail,
      password: regPassword,
      role: 'student',
      className: regClassName,
      title: `${regClassName} Öğrencisi`,
      status: 'pending',
      avatarUrl: DEFAULT_AVATAR
    };

    onCreateAccount(newUser);
    setSuccessMessage('Öğrenci kaydınız başarıyla alındı! Hesabınız öğretmen onayına sunulmuştur. Öğretmeniniz onayladıktan sonra e-posta ve şifrenizle giriş yapabilirsiniz.');
    setActiveTab('login');
    setEmail(regEmail);
    setPassword('');
    setIsRegistering(false);
  };

  // Quick Demo Login Helper
  const handleQuickDemo = async (demoUserEmail: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoUserEmail, password: '123' })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setErrorMessage(data.error || 'Demo girişi başarısız.');
      }
    } catch(err) {
      setErrorMessage('Demo girişi başarısız, sunucuya bağlanılamadı.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Floating Theme Button */}
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
          className="absolute top-4 right-4 z-50 p-3 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-full shadow-lg transition-all cursor-pointer flex items-center justify-center shrink-0 hover:scale-105 active:scale-95"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600" />
          )}
        </button>
      )}

      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-fuchsia-600/25 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Header Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 mx-auto flex items-center justify-center filter drop-shadow-lg">
            <YildizLisesiLogo className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            YKS Koçluk & Takip Sistemi
          </h1>
          <p className="text-xs font-semibold text-slate-300">
            GÜRSU YILDIZ ANADOLU LİSESİ • GİRİŞ PANELİ
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="mb-6 p-3.5 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl space-y-2">
          <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Hızlı Demo Girişi (1-Tık)</span>
            </span>
            <span className="text-[10px] bg-indigo-500/30 px-2 py-0.5 rounded text-indigo-200">Şifre: 123</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('ahmet@okul.edu.tr')}
              className="py-2 px-2.5 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-semibold transition-all border border-indigo-400/40 flex items-center justify-center space-x-1 shadow-md shadow-indigo-600/20"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>1. Öğrenci</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('elif.hoca@okul.edu.tr')}
              className="py-2 px-2.5 bg-fuchsia-600/80 hover:bg-fuchsia-500 text-white rounded-xl text-[11px] font-semibold transition-all border border-fuchsia-400/40 flex items-center justify-center space-x-1 shadow-md shadow-fuchsia-600/20"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>2. Sınıf Reh. Öğr.</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('caglayan.mat@gmail.com')}
              className="py-2 px-2.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-xl text-[11px] font-semibold transition-all border border-purple-400/40 flex items-center justify-center space-x-1 shadow-md shadow-purple-600/20"
            >
              <School className="w-3.5 h-3.5" />
              <span>3. Okul Reh. Öğr.</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="flex bg-white/10 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            onClick={() => { 
              setActiveTab('login'); 
              setErrorMessage(''); 
              setSuccessMessage('');
              setForgotStep(1);
              setFoundUser(null);
              setIsDevMode(false);
              setEnteredCode('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'login' || activeTab === 'forgot'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => { 
              setActiveTab('register'); 
              setErrorMessage(''); 
              setSuccessMessage('');
              setForgotStep(1);
              setFoundUser(null);
              setIsDevMode(false);
              setEnteredCode('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'register'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yeni Hesap Oluştur
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-start space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-Posta Adresi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="ahmet@okul.edu.tr veya elif.hoca@okul.edu.tr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Şifre
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px]">
                <span className="text-slate-400">Demo hesapların şifresi: <strong className="text-indigo-300">123</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('forgot');
                    setErrorMessage('');
                    setSuccessMessage('');
                    setForgotStep(1);
                    setFoundUser(null);
                    setForgotEmail('');
                    setForgotNewPassword('');
                    setIsDevMode(false);
                    setEnteredCode('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                >
                  Şifremi Unuttum?
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-300 select-none cursor-pointer">
                Oturumu açık tut (Beni hatırla)
              </label>
            </div>

            <button
              type="submit"
              disabled={isRegistering || cooldownSeconds > 0 || lockoutCountdownSeconds > 0}
              className={`w-full py-3 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 border ${
                cooldownSeconds > 0 || lockoutCountdownSeconds > 0
                  ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 border-indigo-400/40'
              }`}
            >
              {cooldownSeconds > 0 ? (
                <span>Tekrar denemek için {cooldownSeconds} sn bekleyin...</span>
              ) : lockoutCountdownSeconds > 0 ? (
                <span>Kilitli ({Math.floor(lockoutCountdownSeconds / 60)}dk {lockoutCountdownSeconds % 60}sn)</span>
              ) : (
                <>
                  <span>Güvenli Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {activeTab === 'forgot' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-950/70 border border-indigo-500/30 rounded-2xl flex items-start space-x-2.5">
              <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-200">
                <strong className="block text-white font-bold mb-0.5">Şifremi Unuttum / Sıfırlama</strong>
                <span>Kayıtlı e-posta adresinizi girerek şifrenizi güvenle güncelleyebilirsiniz.</span>
              </div>
            </div>

            {forgotStep === 1 && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErrorMessage('');
                  setSuccessMessage('');
                  const user = users.find(u => (u.email || '').trim().toLowerCase() === (forgotEmail || '').trim().toLowerCase());
                  if (!user) {
                    setErrorMessage('Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.');
                    return;
                  }

                  setIsSendingCode(true);
                  try {
                    const response = await fetch('/api/auth/send-code', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: user.email })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                      setIsDevMode(!!result.devMode);
                      setFoundUser(user);
                      setForgotStep(2);
                      setEnteredCode('');
                      if (result.devMode) {
                        setSuccessMessage('E-posta servisleri bağlı olmadığı için güvenlik kodu sunucu terminal loglarına yazdırıldı.');
                      } else {
                        setSuccessMessage('Doğrulama kodu başarıyla e-posta adresinize gönderildi.');
                      }
                    } else {
                      setErrorMessage(result.error || 'Onay kodu gönderilemedi. Lütfen daha sonra tekrar deneyin.');
                    }
                  } catch (err: any) {
                    setErrorMessage('Sunucu ile iletişim kurulurken bir hata oluştu.');
                  } finally {
                    setIsSendingCode(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-Posta Adresiniz
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="Kayıtlı e-posta adresinizi girin..."
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl border border-white/10 transition-all text-center"
                    disabled={isSendingCode}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingCode}
                    className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/40 flex items-center justify-center space-x-2"
                  >
                    {isSendingCode ? <span>Gönderiliyor...</span> : <span>Onay Kodu Gönder</span>}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErrorMessage('');
                  setSuccessMessage('');
                  if (enteredCode.length !== 6) {
                    setErrorMessage('Lütfen 6 haneli onay kodunun tamamını girin.');
                    return;
                  }

                  setIsVerifyingCode(true);
                  try {
                    const response = await fetch('/api/auth/verify-code', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: forgotEmail, code: enteredCode })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                      setForgotStep(3);
                      setSuccessMessage('E-posta adresi doğrulandı. Yeni şifrenizi belirleyebilirsiniz.');
                    } else {
                      setErrorMessage(result.error || 'Girdiğiniz onay kodu yanlış! Lütfen tekrar kontrol edin.');
                    }
                  } catch (err: any) {
                    setErrorMessage('Sunucu ile iletişim kurulurken bir hata oluştu.');
                  } finally {
                    setIsVerifyingCode(false);
                  }
                }}
                className="space-y-4 animate-in fade-in duration-200"
              >
                {/* Simulated Developer Log Box */}
                {isDevMode && (
                  <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 space-y-2 text-xs text-amber-200">
                    <strong className="block text-amber-400 font-bold mb-0.5">⚠️ Geliştirici Modu Aktif</strong>
                    <span>E-posta sunucusu (SMTP / Resend) tanımlanmadığı için onay kodu <strong>sunucu terminal (konsol) loglarına</strong> yazdırıldı. Lütfen terminalden veya logs ekranından 6 haneli kodu bulup buraya girin.</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Onay Kodunu Girin
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="6 haneli onay kodunu yazın..."
                      maxLength={6}
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 font-mono font-extrabold tracking-widest text-center"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setErrorMessage('');
                    }}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl border border-white/10 transition-all text-center"
                    disabled={isVerifyingCode}
                  >
                    Geri Git
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingCode}
                    className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/40 flex items-center justify-center space-x-2"
                  >
                    {isVerifyingCode ? <span>Doğrulanıyor...</span> : <span>Kodu Doğrula</span>}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setErrorMessage('');
                  setSuccessMessage('');
                  if (!(forgotNewPassword || '').trim() || (forgotNewPassword || '').trim().length < 3) {
                    setErrorMessage('Lütfen en az 3 karakterden oluşan bir şifre belirleyin.');
                    return;
                  }
                  if (foundUser && onUpdateAccount) {
                    onUpdateAccount({
                      ...foundUser,
                      password: (forgotNewPassword || '').trim()
                    });
                    setSuccessMessage(`"${foundUser.name}" kullanıcısının şifresi başarıyla güncellendi! Giriş yapabilirsiniz.`);
                    setActiveTab('login');
                    setEmail(foundUser.email);
                    setPassword((forgotNewPassword || '').trim());
                    setForgotStep(1);
                    setFoundUser(null);
                    setEnteredCode('');
                  } else {
                    setErrorMessage('Bir hata oluştu veya bu işlem desteklenmiyor.');
                  }
                }}
                className="space-y-4 animate-in fade-in duration-200"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1">
                  <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Doğrulanan Kullanıcı</div>
                  <div className="text-xs font-extrabold text-white">{foundUser?.name}</div>
                  <div className="text-[10px] text-slate-300 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded w-fit">
                    {foundUser?.role === 'school_counselor' ? 'Okul Rehber Öğretmeni' : foundUser?.role === 'class_teacher' ? 'Sınıf Rehber Öğretmeni' : foundUser?.role === 'teacher' ? 'Branş Öğretmeni' : `${foundUser?.className || 'YKS'} Öğrencisi`}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Yeni Şifre Belirleyin
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Yeni şifreniz..."
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(2);
                      setErrorMessage('');
                    }}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl border border-white/10 transition-all text-center"
                  >
                    Geri Git
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/30 border border-emerald-400/40"
                  >
                    Yeni Şifreyi Kaydet
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Student Only Info Banner */}
            <div className="p-3 bg-indigo-950/70 border border-indigo-500/30 rounded-2xl flex items-start space-x-2.5">
              <GraduationCap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-200">
                <strong className="block text-white font-bold mb-0.5">Öğrenci Kayıt Formu</strong>
                <span>Öğretmen hesapları yalnızca <strong>Okul Rehber Öğretmeni</strong> tarafından oluşturulabilir. Öğrenci kaydınız oluşturulduktan sonra öğretmen onayına sunulacaktır.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ad Soyad</label>
              <input
                type="text"
                required
                placeholder="Ör: Selin Yılmaz"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">E-Posta Adresi</label>
              <input
                type="email"
                required
                placeholder="selin@okul.edu.tr"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Şifre Belirleyin</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ait Olduğu Sınıf
              </label>
              <select
                value={regClassName}
                onChange={(e) => setRegClassName(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-semibold text-indigo-300"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/40 flex items-center justify-center space-x-2"
            >
              {isRegistering ? <span>Başvuru Gönderiliyor...</span> : <span>Öğrenci Kayıt Başvurusunu Gönder</span>}
            </button>
          </form>
        )}

        {/* Demo Credentials Summary Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-400">
            Sisteme tanımlı demo hesaplar:
          </p>
          <div className="text-[10px] text-slate-300 space-y-0.5 mt-1 font-mono">
            <div>Öğrenci 1: ahmet@okul.edu.tr (Şifre: 123)</div>
            <div>Öğrenci 2: zeynep@okul.edu.tr (Şifre: 123)</div>
            <div>Öğretmen: caglayan.mat@gmail.com (Şifre: 123)</div>
          </div>
        </div>

        {/* App Version Footer */}
        <div className="mt-4 pt-3 border-t border-white/5 text-center flex items-center justify-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono font-medium text-slate-400">
            Sistem Versiyonu: <span className="text-indigo-400 font-bold tracking-wide">{APP_VERSION}</span>
          </span>
        </div>


      </div>
    </div>
  );
};
