import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Timer,
  CheckSquare, 
  BookOpenCheck, 
  Award,
  Target, 
  TrendingUp, 
  Youtube, 
  Bot, 
  FileSpreadsheet,
  Users,
  LogOut,
  UserCheck,
  GraduationCap,
  Layers,
  Footprints,
  Sparkles,
  X,
  MessageSquare,
  User,
  CheckCircle2,
  BookOpen,
  Sliders,
  BarChart3
} from 'lucide-react';
import { UserAccount } from '../types';
import { YildizLisesiLogo } from './YildizLisesiLogo';

export type TabType = 
  | 'teacher_summary'
  | 'teacher_students'
  | 'bulk_exam_import'
  | 'teacher_teachers'
  | 'teacher_templates'
  | 'teacher_system'
  | 'dashboard' 
  | 'subject_progress'
  | 'routines'
  | 'planner' 
  | 'pomodoro'
  | 'questions' 
  | 'resources' 
  | 'past_questions'
  | 'errors'
  | 'branches' 
  | 'mocks' 
  | 'youtube' 
  | 'recommendations'
  | 'ai_coach' 
  | 'messages'
  | 'audit_logs'
  | 'institutional_mocks';

interface TabItem {
  id: TabType;
  label: string;
  icon: any;
  highlight?: boolean;
  badge?: string;
}

interface SidebarProps {
  currentUser: UserAccount | null;
  previewStudentUser?: UserAccount | null;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unresolvedErrorCount: number;
  unreadMessageCount?: number;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isMobileOrTablet: boolean;
  onAddToHomeScreen: () => void;
  isHideDesktopSidebar?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  previewStudentUser = null,
  activeTab,
  onSelectTab,
  unresolvedErrorCount,
  unreadMessageCount = 0,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
  isMobileOrTablet,
  onAddToHomeScreen,
  isHideDesktopSidebar = false
}) => {
  const isPreviewMode = !!previewStudentUser;
  const effectiveUser = previewStudentUser || currentUser;
  const isTeacher = !isPreviewMode && (currentUser?.role === 'class_teacher' || currentUser?.role === 'school_counselor' || currentUser?.role === 'teacher' || currentUser?.role === 'admin');
  const isSchoolCounselor = !isPreviewMode && (currentUser?.role === 'school_counselor' || currentUser?.role === 'admin');
  const isAdmin = !isPreviewMode && currentUser?.role === 'admin';

  const studentTabs: TabItem[] = [
    { id: 'dashboard', label: 'Genel Özet', icon: LayoutDashboard },
    { id: 'subject_progress', label: 'Ders İlerlemelerim', icon: GraduationCap, highlight: true },
    { id: 'routines', label: 'Rutinlerim', icon: CheckCircle2, highlight: true },
    { id: 'planner', label: 'Haftalık Çalışma Planı', icon: CalendarCheck },
    { id: 'questions', label: 'Soru Takibi', icon: CheckSquare },
    { id: 'resources', label: 'Kaynak Takibi', icon: BookOpenCheck },
    { id: 'past_questions', label: 'Çıkmış Sorular', icon: FileSpreadsheet, highlight: true },
    { 
      id: 'errors', 
      label: 'Hata Defteri', 
      icon: BookOpen,
      badge: unresolvedErrorCount > 0 ? `${unresolvedErrorCount}` : undefined
    },
    { id: 'branches', label: 'Branş Deneme Analizi', icon: Target },
    { id: 'mocks', label: 'Genel Deneme Analizi', icon: TrendingUp },
    { id: 'youtube', label: 'YouTube Ders Takip', icon: Youtube },
    { id: 'pomodoro', label: 'Pomodoro Sayacı', icon: Timer, highlight: true },
    { id: 'recommendations', label: 'Kaynak Önerileri', icon: Sparkles, highlight: true },
    { id: 'ai_coach', label: 'Yapay Zeka Koçu', icon: Bot, highlight: true }
  ];

  const teacherTabs: TabItem[] = [
    { id: 'teacher_summary', label: 'Genel Özet', icon: LayoutDashboard },
    { id: 'teacher_students', label: 'Öğrenci Yönetimi & Takip', icon: Users, highlight: true },
    ...(isSchoolCounselor ? [{ id: 'teacher_teachers' as TabType, label: 'Öğretmenler & Sınıf Atamaları', icon: UserCheck, highlight: true }] : []),
    ...(isAdmin ? [{ id: 'bulk_exam_import' as TabType, label: 'Toplu Liste Girişi', icon: FileSpreadsheet, highlight: true }] : []),
    ...(isSchoolCounselor ? [{ id: 'institutional_mocks' as TabType, label: 'Kurumsal Deneme Takip', icon: BarChart3, highlight: true }] : []),
    { id: 'teacher_templates', label: 'Çalışma Programı Şablonları', icon: Layers },
    { id: 'past_questions', label: 'Çıkmış Sorular', icon: FileSpreadsheet, highlight: true },
    { id: 'recommendations', label: 'Öneriler & Tavsiyeler', icon: Sparkles, highlight: true },
    { id: 'ai_coach', label: 'YKS Yapay Zeka Koçu', icon: Bot, highlight: true },
    ...(isAdmin ? [{ id: 'teacher_system' as TabType, label: 'Sistem Yönetimi', icon: Sliders, highlight: true }] : []),
    { id: 'audit_logs', label: 'Ayak İzi (İşlem Geçmişi)', icon: Footprints, highlight: true }
  ];

  const tabs = isTeacher ? teacherTabs : studentTabs;

  const handleSelectTab = (tabId: TabType) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
    onLogout();
  };

  const renderNavContent = () => (
    <>
      <div className="flex flex-col space-y-1.5 overflow-y-auto scrollbar-none py-1 flex-1">
        
        {/* Role Badge inside Sidebar Header with Message Icon */}
        <div className={`flex items-center justify-between p-3 mb-2 rounded-2xl border ${
          isPreviewMode 
            ? 'bg-amber-500/10 border-amber-500/30' 
            : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            {effectiveUser?.avatarUrl ? (
              <img
                src={effectiveUser.avatarUrl}
                alt={effectiveUser.name}
                className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-indigo-500/50 shadow-md"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
            {(!effectiveUser?.avatarUrl) && (
              <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                {effectiveUser?.name ? effectiveUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-xs sm:text-sm font-bold text-white truncate">{effectiveUser?.name || 'Kullanıcı'}</div>
              <div className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                isPreviewMode
                  ? 'text-amber-300'
                  : isSchoolCounselor
                  ? 'text-purple-300'
                  : isTeacher
                  ? 'text-fuchsia-300'
                  : 'text-indigo-300'
              }`}>
                {isPreviewMode
                  ? `ÖĞRENCİ ÖNİZLEME (${effectiveUser?.className || '12-A'})`
                  : isSchoolCounselor
                  ? 'OKUL REHBER ÖĞRET.'
                  : isTeacher
                  ? 'SINIF REHBER ÖĞRET.'
                  : `ÖĞRENCİ (${effectiveUser?.className || '12-A SAY'})`}
              </div>
            </div>
          </div>

          {/* Message Icon button - Hidden or locked in preview mode */}
          {!isPreviewMode ? (
            <button
              onClick={() => handleSelectTab('messages')}
              id="sidebar-messages-icon-btn"
              title="Mesajlar"
              className={`relative p-2.5 rounded-xl border transition-all shrink-0 ml-1.5 ${
                activeTab === 'messages'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/30'
                  : 'bg-indigo-500/10 text-indigo-200 hover:text-white hover:bg-indigo-500/20 border-indigo-500/20 backdrop-blur-md'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md animate-pulse">
                  {unreadMessageCount}
                </span>
              )}
            </button>
          ) : (
            <div
              className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300/60 shrink-0 ml-1.5 cursor-not-allowed"
              title="Önizleme modunda özel mesajlar gizlidir"
            >
              <MessageSquare className="w-4 h-4 opacity-50" />
            </div>
          )}
        </div>

        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              id={`tab-btn-${t.id}`}
              onClick={() => handleSelectTab(t.id as TabType)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap w-full text-left border ${
                isActive
                  ? isTeacher
                    ? 'bg-fuchsia-600/80 backdrop-blur-md text-white shadow-lg shadow-fuchsia-500/30 border-fuchsia-400/40'
                    : 'bg-indigo-600/80 backdrop-blur-md text-white shadow-lg shadow-indigo-500/30 border-indigo-400/40'
                  : t.highlight
                  ? 'bg-gradient-to-r from-fuchsia-500/20 to-indigo-500/20 text-fuchsia-200 border-fuchsia-400/30 hover:bg-fuchsia-500/30 backdrop-blur-md'
                  : 'bg-indigo-500/10 text-indigo-200 border-indigo-500/20 hover:bg-indigo-500/20 hover:text-white backdrop-blur-md'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : t.highlight ? 'text-fuchsia-300' : 'text-slate-400'}`} />
              <span className="flex-1 font-semibold">{t.label}</span>

              {t.badge && (
                <span className="bg-rose-500/20 backdrop-blur-md text-rose-300 text-[10px] px-2 py-0.5 rounded-full border border-rose-500/40 font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Logout button */}
      <div className="pt-3 border-t border-white/10 mt-2 space-y-2">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 w-full transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Çıkış Yap / Giriş Ekranı</span>
        </button>

        {isMobileOrTablet && (
          <button
            onClick={onAddToHomeScreen}
            id="sidebar-add-to-homescreen-bottom"
            className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 w-full transition-all"
          >
            <YildizLisesiLogo className="w-4 h-4 shrink-0" />
            <span>Ana Ekrana Ekle</span>
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      {!isHideDesktopSidebar && (
        <nav className="hidden md:flex bg-white/5 backdrop-blur-xl border-r border-white/10 p-3 w-64 flex-shrink-0 z-20 flex-col justify-between min-h-[calc(100vh-4rem)]">
          {renderNavContent()}
        </nav>
      )}

      {/* OVERLAY & DRAWER SIDEBAR */}
      {isOpenMobile && (
        <div 
          id="mobile-sidebar-backdrop"
          onClick={onCloseMobile} 
          className={`sidebar-backdrop fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity ${
            isHideDesktopSidebar ? '' : 'md:hidden'
          }`} 
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-white/10 p-4 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
        isHideDesktopSidebar ? '' : 'md:hidden'
      } ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <YildizLisesiLogo className="w-7 h-7 shrink-0 drop-shadow-md" />
            <span className="font-bold text-sm text-white">Menü</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderNavContent()}
      </aside>
    </>
  );
};

