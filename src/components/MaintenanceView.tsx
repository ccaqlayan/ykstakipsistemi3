import React, { useState } from 'react';
import { 
  Wrench, 
  Clock, 
  Sparkles, 
  LogIn, 
  LogOut, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  X, 
  AlertCircle,
  School,
  Users,
  UserCheck,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { UserAccount } from '../types';

interface MaintenanceViewProps {
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onAdminLogin?: (user: UserAccount) => void;
  users?: UserAccount[];
  schoolName?: string;
  maintenanceMessage?: string;
  maintenanceEndTime?: string;
  maintenanceAllowTeachers?: boolean;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  currentUser,
  onLogout,
  onAdminLogin,
  users = [],
  schoolName = 'YKS Hazırlık & Koçluk Sistemi',
  maintenanceMessage,
  maintenanceEndTime,
  maintenanceAllowTeachers = false,
}) => {
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminUsernameOrEmail, setAdminUsernameOrEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const displayMessage = maintenanceMessage || localStorage.getItem('maintenance_message') || 'Sistemimizde şu anda planlı altyapı iyileştirmesi ve güncelleme çalışması yapılmaktadır. Öğrenci verileriniz güvendedir ve en kısa sürede sistem tekrar açılacaktır.';
  const displayEndTime = maintenanceEndTime || localStorage.getItem('maintenance_end_time') || '';
  const displaySchool = schoolName || localStorage.getItem('school_name') || 'YKS Hazırlık & Takip Sistemi';

  const handleAuthorizedLoginSubmit = async (e?: React.FormEvent, customIdentifier?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const identifier = (customIdentifier || adminUsernameOrEmail).trim().toLowerCase();
    const pass = (customPass || adminPassword).trim();

    if (!identifier || !pass) {
      setLoginError('Lütfen kullanıcı adı / e-posta ve şifrenizi girin.');
      return;
    }

    setIsLoggingIn(true);
    try {
      // 1. Authenticate via backend API endpoint (handles password hashes and verify logic)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password: pass })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        const loggedUser: UserAccount = data.user;
        const isTeacher = loggedUser.role === 'teacher' || loggedUser.role === 'class_teacher' || loggedUser.role === 'school_counselor';
        const isAdmin = loggedUser.role === 'admin';

        if (!isAdmin && !(isTeacher && maintenanceAllowTeachers)) {
          if (isTeacher) {
            setLoginError('Sistem bakım modundadır ve öğretmen giriş izni şu anda kapalıdır. Yalnızca yöneticiler giriş yapabilir.');
          } else {
            setLoginError('Sistem şu anda planlı bakım modundadır. Yalnızca yetkili personel (yönetici / izinli öğretmenler) giriş yapabilir.');
          }
          setIsLoggingIn(false);
          return;
        }

        const now = Date.now().toString();
        localStorage.setItem('yks_last_active_time', now);
        localStorage.setItem('yks_remember_me', 'true');
        sessionStorage.setItem('yks_session_active', 'true');

        if (onAdminLogin) {
          onAdminLogin(loggedUser);
          setShowAdminLoginModal(false);
        }
        return;
      }

      // If backend returned a specific authentication error (e.g. wrong password)
      if (data && data.error) {
        // Fallback: check if local demo user matches
        const localMatch = users.find(u => 
          (u.email?.toLowerCase() === identifier || u.name?.toLowerCase() === identifier || u.id?.toLowerCase() === identifier)
        );
        if (localMatch && localMatch.password === pass) {
          const isTeacher = localMatch.role === 'teacher' || localMatch.role === 'class_teacher' || localMatch.role === 'school_counselor';
          const isAdmin = localMatch.role === 'admin';

          if (!isAdmin && !(isTeacher && maintenanceAllowTeachers)) {
            setLoginError(isTeacher 
              ? 'Sistem bakım modundadır ve öğretmen giriş izni şu anda kapalıdır.' 
              : 'Sistem bakım modundadır. Yalnızca yetkili personel giriş yapabilir.');
            setIsLoggingIn(false);
            return;
          }

          if (onAdminLogin) {
            onAdminLogin(localMatch);
            setShowAdminLoginModal(false);
            return;
          }
        }

        setLoginError(data.error || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
        setIsLoggingIn(false);
        return;
      }
    } catch (err: any) {
      // Local fallback for offline/demo
      const localMatch = users.find(u => 
        (u.email?.toLowerCase() === identifier || u.name?.toLowerCase() === identifier || u.id?.toLowerCase() === identifier) &&
        u.password === pass
      );
      if (localMatch) {
        const isTeacher = localMatch.role === 'teacher' || localMatch.role === 'class_teacher' || localMatch.role === 'school_counselor';
        const isAdmin = localMatch.role === 'admin';
        if (isAdmin || (isTeacher && maintenanceAllowTeachers)) {
          if (onAdminLogin) {
            onAdminLogin(localMatch);
            setShowAdminLoginModal(false);
            return;
          }
        }
      }
      setLoginError('Sunucuya bağlanılamadı veya şifre hatalı.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickAuthorizedDemo = (email: string) => {
    setAdminUsernameOrEmail(email);
    setAdminPassword('123');
    handleAuthorizedLoginSubmit(undefined, email, '123');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Background Ambient Glows */}
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse" />
      <div className="fixed top-1/2 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 right-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 text-center animate-fade-in">
        
        {/* School Badge & Maintenance Status */}
        <div className="flex flex-col items-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-4 py-1.5 rounded-full text-xs font-bold text-slate-300 shadow-sm">
            <School className="w-3.5 h-3.5 text-amber-400" />
            <span>{displaySchool}</span>
          </div>

          <div className="relative my-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
              <Wrench className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce transition-transform duration-1000" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md animate-pulse">
              !
            </div>
          </div>

          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full text-[11px] font-bold text-amber-300">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Planlı Sistem Bakım & İyileştirme Modu</span>
          </div>
        </div>

        {/* Title & Message */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sistemimiz Bakım Modundadır
          </h1>
          <div className="p-4 sm:p-5 bg-slate-950/70 border border-slate-850 rounded-2xl text-xs sm:text-sm text-slate-300 leading-relaxed font-normal text-left whitespace-pre-line shadow-inner">
            {displayMessage}
          </div>
        </div>

        {/* Estimated End Time Badge (if provided) */}
        {displayEndTime && (
          <div className="flex items-center justify-center space-x-2 bg-indigo-950/40 border border-indigo-500/30 px-4 py-2 rounded-2xl text-xs text-indigo-200">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span><strong>Tahmini Tamamlanma:</strong> {displayEndTime}</span>
          </div>
        )}

        {/* Current User Session or Authorized Login Button */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {currentUser ? (
            <div className="w-full flex items-center justify-between bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                  {currentUser.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left truncate">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{currentUser.role}</p>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Çıkış Yap</span>
                </button>
              )}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowAdminLoginModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700 flex items-center justify-center space-x-2 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {maintenanceAllowTeachers 
                    ? 'Yetkili Girişi (Yönetici / Öğretmen)' 
                    : 'Yönetici Girişi (Admin Bypass)'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <p className="text-[11px] text-slate-500 font-medium">
          🔒 Veritabanınız ve kayıtlı tüm denemeleriniz güvenle korunmaktadır.
        </p>

      </div>

      {/* Authorized Login Modal (When in Maintenance Mode) */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400">
                  {maintenanceAllowTeachers ? <Users className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {maintenanceAllowTeachers ? 'Yetkili Personel Girişi' : 'Yönetici Girişi'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {maintenanceAllowTeachers ? 'Yönetici ve öğretmen hesapları giriş yapabilir' : 'Yalnızca yönetici (admin) hesapları'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminLoginModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Quick Demo Access Bar inside Modal */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Hızlı Yetkili Demo Girişi</span>
                </span>
                <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">Şifre: 123</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {maintenanceAllowTeachers && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickAuthorizedDemo('elif.hoca@okul.edu.tr')}
                      className="py-1.5 px-2 bg-fuchsia-600/30 hover:bg-fuchsia-600/50 text-fuchsia-200 border border-fuchsia-500/30 rounded-xl text-[10px] font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer truncate"
                    >
                      <UserCheck className="w-3 h-3 shrink-0" />
                      <span className="truncate">Sınıf Reh. (Elif Hoca)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAuthorizedDemo('demo.rehber@yksdemo.local')}
                      className="py-1.5 px-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 rounded-xl text-[10px] font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer truncate"
                    >
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      <span className="truncate">Okul Reh. (Dilek Hoca)</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleQuickAuthorizedDemo('caglayan.mat@gmail.com')}
                  className={`py-1.5 px-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/30 rounded-xl text-[10px] font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer truncate ${!maintenanceAllowTeachers ? 'sm:col-span-2' : ''}`}
                >
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span className="truncate">Yönetici (Admin)</span>
                </button>
              </div>
            </div>

            <form onSubmit={(e) => handleAuthorizedLoginSubmit(e)} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Kullanıcı Adı veya E-posta
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={adminUsernameOrEmail}
                    onChange={(e) => setAdminUsernameOrEmail(e.target.value)}
                    placeholder="kullanici@okul.edu.tr / e-posta..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAdminLoginModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Doğrulanıyor...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Giriş Yap</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
