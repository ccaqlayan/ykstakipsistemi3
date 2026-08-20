import React from 'react';
import { 
  GraduationCap, 
  FileSpreadsheet, 
  UserCheck, 
  RotateCcw, 
  Sparkles,
  LogOut,
  User,
  Cloud,
  Menu,
  Sun,
  Moon,
  MessageSquare
} from 'lucide-react';
import { UserAccount, StudentProfile, GoogleSheetsStatus } from '../types';
import { YildizLisesiLogo } from './YildizLisesiLogo';

interface NavbarProps {
  currentUser: UserAccount | null;
  previewStudentUser?: UserAccount | null;
  profile: StudentProfile;
  sheetsStatus: GoogleSheetsStatus;
  onOpenProfile: () => void;
  onOpenSheetsModal: () => void;
  onExportJSON: () => void;
  onResetData: () => void;
  onLogout: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  undoCount?: number;
  onToggleMobileMenu?: () => void;
  unreadMessageCount?: number;
  onOpenMessages?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  alwaysShowMenuButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  previewStudentUser = null,
  profile,
  sheetsStatus,
  onOpenProfile,
  onOpenSheetsModal,
  onExportJSON,
  onResetData,
  onLogout,
  onUndo,
  canUndo = false,
  undoCount = 0,
  onToggleMobileMenu,
  unreadMessageCount = 0,
  onOpenMessages,
  theme = 'dark',
  onToggleTheme,
  alwaysShowMenuButton = false
}) => {
  const isPreviewMode = !!previewStudentUser;
  const effectiveUser = previewStudentUser || currentUser;
  const isTeacher = !isPreviewMode && (currentUser?.role === 'class_teacher' || currentUser?.role === 'school_counselor' || currentUser?.role === 'teacher' || currentUser?.role === 'admin');
  const isSchoolCounselor = !isPreviewMode && currentUser?.role === 'school_counselor';

  const [currentSchoolName, setCurrentSchoolName] = React.useState<string>(
    () => localStorage.getItem('school_name') || 'Yıldız Anadolu Lisesi'
  );

  React.useEffect(() => {
    const handleUpdate = () => {
      setCurrentSchoolName(localStorage.getItem('school_name') || 'Yıldız Anadolu Lisesi');
    };
    window.addEventListener('yks_settings_updated', handleUpdate);
    return () => window.removeEventListener('yks_settings_updated', handleUpdate);
  }, []);

  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 text-slate-100 sticky top-0 z-30 shadow-lg shadow-black/20 font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & School Name */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                id="mobile-menu-toggle-btn"
                aria-label="Menüyü Aç"
                className={`relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center shrink-0 ${
                  alwaysShowMenuButton ? 'flex' : 'flex md:hidden'
                }`}
                title="Menüyü Aç / Kapat"
              >
                <Menu className="w-5 h-5 text-indigo-300" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md animate-pulse">
                    {unreadMessageCount}
                  </span>
                )}
              </button>
            )}

            <YildizLisesiLogo className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 drop-shadow-lg" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-lg text-white tracking-tight truncate max-w-[130px] sm:max-w-none">
                  {currentSchoolName}
                </span>
                <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider hidden xs:inline-block ${
                  isPreviewMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : isSchoolCounselor
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : isTeacher 
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' 
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                }`}>
                  {isPreviewMode
                    ? `ÖNİZLEME (${effectiveUser?.className || '12-A'})`
                    : isSchoolCounselor 
                    ? 'OKUL REHBERİ' 
                    : isTeacher 
                    ? 'SINIF REHBERİ' 
                    : `${effectiveUser?.className || '12-A'}`}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {isPreviewMode ? 'Öğrenci Gözünden Canlı Önizleme (Salt Okunur)' : 'YKS Koçluk, Soru & Sınıf Takip Platformu'}
              </p>
            </div>
          </div>

          {/* Right Actions & Profile */}
          <div className="flex items-center space-x-2.5">
            
            {/* Geri Al (Undo) Button */}
            {canUndo && onUndo && !isPreviewMode && (
              <button
                onClick={onUndo}
                id="navbar-undo-btn"
                title="Son yapılan işlemi geri al (Ctrl+Z)"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 backdrop-blur-md transition-all shadow-md animate-pulse"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Geri Al</span>
                {undoCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {undoCount}
                  </span>
                )}
              </button>
            )}

            {/* Mesajlar Butonu (Navbar) */}
            {onOpenMessages && !isPreviewMode && (
              <button
                onClick={onOpenMessages}
                id="navbar-messages-btn"
                title="Mesajlar"
                className="relative p-2 text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md animate-pulse">
                    {unreadMessageCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile Pill */}
            {!isTeacher ? (
              <button
                onClick={!isPreviewMode ? onOpenProfile : undefined}
                id="student-profile-btn"
                title={isPreviewMode ? 'Öğrenci Önizleme Modu' : 'Profil ve Hedefleri Düzenle'}
                className={`flex items-center space-x-2.5 backdrop-blur-md border px-3 py-1.5 rounded-2xl transition-all shadow-md group ${
                  isPreviewMode ? 'bg-amber-500/10 border-amber-500/30 cursor-default' : 'bg-white/10 hover:bg-white/15 border-white/15'
                }`}
              >
                {effectiveUser?.avatarUrl ? (
                  <img 
                    src={effectiveUser.avatarUrl} 
                    alt={effectiveUser.name} 
                    className="w-7 h-7 rounded-full object-cover border border-indigo-400/50 shadow-sm shrink-0" 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : null}
                {(!effectiveUser?.avatarUrl) && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                    {effectiveUser?.name ? effectiveUser.name.charAt(0) : 'Ö'}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight group-hover:text-indigo-300 transition-colors">
                    {effectiveUser?.name || profile.name}
                  </div>
                  <div className="text-[10px] text-indigo-300 font-mono font-medium">
                    {profile.targetField} • Hedef #{profile.targetRank}
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenProfile}
                id="teacher-profile-btn"
                title="Öğretmen Profilini Düzenle"
                className="flex items-center space-x-2 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 px-3 py-1.5 rounded-2xl transition-all shadow-md text-left group"
              >
                {currentUser?.avatarUrl ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.name} 
                    className="w-7 h-7 rounded-full object-cover border border-fuchsia-400/50 shadow-sm shrink-0" 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : null}
                {(!currentUser?.avatarUrl) && (
                  <div className="w-7 h-7 rounded-full bg-fuchsia-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {currentUser?.name?.charAt(0) || 'Ö'}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight group-hover:text-fuchsia-200 transition-colors">
                    {currentUser?.name}
                  </div>
                  <div className="text-[10px] text-fuchsia-300 font-mono">
                    {currentUser?.title || (currentUser?.role === 'school_counselor' ? 'Okul Rehberlik Uzmanı' : 'Sınıf Öğretmeni')}
                  </div>
                </div>
              </button>
            )}

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
                className="p-2 text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" />
                )}
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="Çıkış Yap"
              className="p-2 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};

