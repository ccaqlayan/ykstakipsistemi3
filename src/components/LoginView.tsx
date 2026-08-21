import React, { useState, useEffect } from 'react';
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
  Moon,
  Eye,
  EyeOff,
  Clock,
  Info
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { YildizLisesiLogo } from './YildizLisesiLogo';
import { DEFAULT_AVATAR, DEMO_USERS } from '../data/initialData';
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

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Kayıt sonrası bekleme ekranı
  const [showPendingInfo, setShowPendingInfo] = useState(false);
  const [pendingUserName, setPendingUserName] = useState('');

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
      avatarUrl: DEFAULT_AVATAR,
      createdAt: new Date().toISOString()
    };

    onCreateAccount(newUser);
    setPendingUserName(regName);
    setShowPendingInfo(true);
    setEmail(regEmail);
    setPassword('');
    setIsRegistering(false);
  };

  // Quick Demo Login Helper
  const handleQuickDemo = async (demoUserEmail: string) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoUserEmail, password: '123' })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user);
        return;
      }
    } catch(err) {
      // Fallback to local users list
    }

    const found = users.find(u => (u.email || '').trim().toLowerCase() === demoUserEmail.trim().toLowerCase())
      || DEMO_USERS.find(u => (u.email || '').trim().toLowerCase() === demoUserEmail.trim().toLowerCase());
    if (found) {
      onLoginSuccess(found);
    } else {
      setErrorMessage('Demo kullanıcı girişi yapılamadı.');
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
        <div className="mb-6 p-4 bg-slate-900/90 border border-indigo-500/30 rounded-3xl space-y-3 shadow-xl backdrop-blur-md">
          <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Hızlı Demo Giriş İstasyonu (1-Tık)</span>
            </span>
            <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full text-indigo-200 font-mono">Şifre: 123</span>
          </div>

          {/* Kademe Öğrencileri */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <GraduationCap className="w-3 h-3 text-emerald-400" />
              <span>Örnek Öğrenciler (Tüm Kademeler)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('eren.9a@okul.edu.tr')}
                className="py-1.5 px-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between cursor-pointer"
                title="9. Sınıf Maarif Modeli - Eren Aydın (9-A)"
              >
                <span>9. Sınıf (Maarif)</span>
                <span className="text-[9px] bg-emerald-500/20 px-1 py-0.2 rounded font-normal">Eren</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('selin.10a@okul.edu.tr')}
                className="py-1.5 px-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between cursor-pointer"
                title="10. Sınıf Maarif Modeli - Selin Yılmaz (10-A)"
              >
                <span>10. Sınıf (Maarif)</span>
                <span className="text-[9px] bg-cyan-500/20 px-1 py-0.2 rounded font-normal">Selin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('kerem.11a@okul.edu.tr')}
                className="py-1.5 px-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between cursor-pointer"
                title="11. Sınıf Sayısal - Kerem Yıldız (11-A SAY)"
              >
                <span>11. Sınıf (Alan)</span>
                <span className="text-[9px] bg-purple-500/20 px-1 py-0.2 rounded font-normal">Kerem</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ahmet@okul.edu.tr')}
                className="py-1.5 px-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between cursor-pointer"
                title="12. Sınıf SAY - Ahmet Yılmaz (12-A SAY)"
              >
                <span>12. Sınıf (YKS)</span>
                <span className="text-[9px] bg-indigo-500/20 px-1 py-0.2 rounded font-normal">Ahmet</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('mehmet@okul.edu.tr')}
                className="py-1.5 px-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between cursor-pointer"
                title="12. Sınıf EA - Mehmet Demir (12-B EA)"
              >
                <span>12. Sınıf (EA)</span>
                <span className="text-[9px] bg-blue-500/20 px-1 py-0.2 rounded font-normal">Mehmet</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('mert.mezun@okul.edu.tr')}
                className="py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between cursor-pointer"
                title="Mezun Sayısal Derece Grubu - Mert Aksoy"
              >
                <span>Mezun (Derece)</span>
                <span className="text-[9px] bg-amber-500/20 px-1 py-0.2 rounded font-normal">Mert</span>
              </button>
            </div>
          </div>

          {/* Rehberlik & Yönetim */}
          <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-fuchsia-400" />
              <span>Rehberlik & Yönetim</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('elif.hoca@okul.edu.tr')}
                className="py-1.5 px-2 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-200 rounded-xl text-[10.5px] font-bold transition-all border border-fuchsia-500/30 flex items-center justify-center space-x-1 cursor-pointer"
              >
                <UserCheck className="w-3 h-3" />
                <span>Sınıf Rehberi</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('demo.rehber@yksdemo.local')}
                className="py-1.5 px-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 rounded-xl text-[10.5px] font-bold transition-all border border-purple-500/30 flex items-center justify-center space-x-1 cursor-pointer"
              >
                <School className="w-3 h-3" />
                <span>Okul Rehberliği</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('caglayan.mat@gmail.com')}
                className="py-1.5 px-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 rounded-xl text-[10.5px] font-bold transition-all border border-rose-500/30 flex items-center justify-center space-x-1 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Yönetici (Admin)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kay\u0131t Sonras\u0131 Bekleme Bilgi Paneli */}
        {showPendingInfo && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Ba\u015fvurunuz Al\u0131nd\u0131!</div>
                  <div className="text-[11px] text-emerald-300 font-semibold">{pendingUserName} \u2014 \u00d6\u011frenci Hesab\u0131</div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Hesab\u0131n\u0131z sisteme ba\u015far\u0131yla kaydedildi.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong className="text-amber-300">S\u0131nıf rehber \u00f6\u011fretmeninizin</strong> onay\u0131 bekleniyor. Genellikle 1 i\u015f g\u00fcn\u00fc i\u00e7inde onaylan\u0131r.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>\u00d6\u011fretmeninize bizzat s\u00f6yleyerek onay s\u00fcrecini h\u0131zland\u0131rabilirsiniz.</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-700/60 rounded-2xl">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Onay Sonras\u0131 Yap\u0131lacaklar</div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>1. E-posta ve \u015fifrenizle giri\u015f yap\u0131n</div>
                <div>2. Hedef \u00fcniversite ve bölüm\u00fcn\u00fc belirle</div>
                <div>3. Kaynak kitaplar\u0131n\u0131 ekle ve \u00e7al\u0131\u015fmaya ba\u015fla</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPendingInfo(false);
                setActiveTab('login');
                setSuccessMessage('\u00d6\u011frenci hesab\u0131n\u0131z olu\u015fturuldu! \u00d6\u011fretmeniniz onaylad\u0131ktan sonra giri\u015f yapabilirsiniz.');
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/40 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Giri\u015f Ekran\u0131na D\u00f6n</span>
            </button>
          </div>
        )}

        {/* Tab Switcher: Login vs Register (Sadece pending info yoksa g\u00f6ster) */}
        {!showPendingInfo && <div className="flex bg-white/10 p-1 rounded-2xl border border-white/10 mb-6">
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
            className={`flex-1 py-3 sm:py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] sm:min-h-0 flex items-center justify-center ${
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
            className={`flex-1 py-3 sm:py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] sm:min-h-0 flex items-center justify-center ${
              activeTab === 'register'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yeni Hesap Oluştur
          </button>
        </div>}

        {/* Error & Success Notifications + Forms (Sadece pending bilgi ekranı yokken göster) */}
        {!showPendingInfo && <>

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
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
                <input
                  type="email"
                  required
                  placeholder="ahmet@okul.edu.tr veya elif.hoca@okul.edu.tr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 sm:py-2.5 text-sm sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Şifre
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-3 sm:py-2.5 text-sm sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(p => !p)}
                  className="absolute right-3 top-3.5 sm:top-3 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showLoginPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[11px] sm:text-[10px]">
                <span className="text-slate-400">Demo şifre: <strong className="text-indigo-300">123</strong></span>
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
                  className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer py-1"
                >
                  Şifremi Unuttum?
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 py-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-slate-700 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-300 select-none cursor-pointer">
                Oturumu açık tut (Beni hatırla)
              </label>
            </div>

            <button
              type="submit"
              disabled={isRegistering || cooldownSeconds > 0 || lockoutCountdownSeconds > 0}
              className={`w-full py-3.5 sm:py-3 font-bold text-sm sm:text-xs rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 border min-h-[48px] active:scale-[0.98] ${
                cooldownSeconds > 0 || lockoutCountdownSeconds > 0
                  ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 border-indigo-400/40 cursor-pointer'
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
                        if (result.devCode) {
                          setEnteredCode(result.devCode);
                          setSuccessMessage(`[Geliştirici Modu] E-posta servisi bağlı olmadığı için onay kodunuz (${result.devCode}) kutucuğa otomatik dolduruldu.`);
                        } else {
                          setSuccessMessage('E-posta servisleri bağlı olmadığı için güvenlik kodu sunucu terminal loglarına yazdırıldı.');
                        }
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Şifre Belirleyin</label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 pr-10 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(p => !p)}
                  className="absolute right-3 top-3.5 sm:top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showRegPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ait Olduğu Sınıf
              </label>
              <select
                value={regClassName}
                onChange={(e) => setRegClassName(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none font-semibold text-indigo-300 min-h-[48px] sm:min-h-0 cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3.5 sm:py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-sm sm:text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/40 flex items-center justify-center space-x-2 min-h-[48px] cursor-pointer active:scale-[0.98]"
            >
              {isRegistering ? <span>Başvuru Gönderiliyor...</span> : <span>Öğrenci Kayıt Başvurusunu Gönder</span>}
            </button>
            </form>
        )}

        </> /* showPendingInfo false block end */}

        {/* Demo Credentials Summary Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] font-bold text-slate-400">
            Sisteme tanımlı demo hesaplar:
          </p>
          <div className="text-[10px] text-slate-300 space-y-0.5 mt-1 font-mono">
            <div>Öğrenci 1: ahmet@okul.edu.tr (Ahmet Yılmaz) • Şifre: 123</div>
            <div>Öğrenci 2: zeynep@okul.edu.tr (Zeynep Kaya) • Şifre: 123</div>
            <div>Sınıf Rehber Öğr.: elif.hoca@okul.edu.tr (Elif Çelik) • Şifre: 123</div>
            <div>Okul Rehber Öğr.: demo.rehber@yksdemo.local (Dilek Küçük) • Şifre: 123</div>
          </div>
        </div>

        {/* App Version Footer */}
        <div className="mt-4 pt-3 border-t border-white/5 text-center flex items-center justify-center space-x-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('caglayan.mat@gmail.com')}
            className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse cursor-pointer hover:scale-150 transition-transform focus:outline-none"
            title="Sistem Durumu"
          />
          <span className="text-[11px] font-mono font-medium text-slate-400">
            Sistem Versiyonu: <span className="text-indigo-400 font-bold tracking-wide">{APP_VERSION}</span>
          </span>
        </div>


      </div>
    </div>
  );
};
