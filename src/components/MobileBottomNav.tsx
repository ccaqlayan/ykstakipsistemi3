import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  BookOpen, 
  Menu, 
  Users, 
  BarChart3, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { TabType } from './Sidebar';
import { UserAccount } from '../types';

interface MobileBottomNavProps {
  currentUser: UserAccount | null;
  previewStudentUser?: UserAccount | null;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unresolvedErrorCount: number;
  unreadMessageCount?: number;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

interface BottomNavItem {
  id: TabType | 'menu';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  isActive: boolean;
  activeSubtitle?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentUser,
  previewStudentUser = null,
  activeTab,
  onSelectTab,
  unresolvedErrorCount,
  unreadMessageCount = 0,
  onToggleMobileMenu,
  isMobileMenuOpen
}) => {
  const isPreviewMode = !!previewStudentUser;
  const isTeacher = !isPreviewMode && (
    currentUser?.role === 'class_teacher' || 
    currentUser?.role === 'school_counselor' || 
    currentUser?.role === 'teacher' || 
    currentUser?.role === 'admin'
  );

  // Otomatik Modal / Açılır Pencere Tespiti (Modal açıkken alt navbarı gizle)
  const [isAnyModalOpen, setIsAnyModalOpen] = React.useState(false);

  React.useEffect(() => {
    const checkModalInDOM = () => {
      // Modal overlay seçicilerini kontrol et (Sidebar hariç z-50 ve üzeri modallar)
      const activeModal = document.querySelector(
        '.fixed.inset-0.z-50:not(#mobile-sidebar-backdrop), .fixed.inset-0.z-\\[60\\], .fixed.inset-0.z-\\[70\\], .fixed.inset-0.z-\\[100\\], .fixed.inset-0.z-\\[100000\\], .fixed.inset-0.z-\\[999999\\], [role="dialog"], [aria-modal="true"]'
      );
      setIsAnyModalOpen(!!activeModal);
    };

    const observer = new MutationObserver(checkModalInDOM);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    checkModalInDOM();

    return () => observer.disconnect();
  }, []);

  const effectiveUser = previewStudentUser || currentUser;

  // Kademe tespiti
  const gradeLevel = effectiveUser?.className ? (
    effectiveUser.className.toUpperCase().includes('MEZUN') ? 'mezun' :
    effectiveUser.className.startsWith('9') ? '9' :
    effectiveUser.className.startsWith('10') ? '10' :
    effectiveUser.className.startsWith('11') ? '11' : '12'
  ) : '12';
  const isEarlyGrade = gradeLevel === '9' || gradeLevel === '10';

  // Student Primary Tabs
  const isStudentDenemeActive = isEarlyGrade 
    ? activeTab === 'school_exams' || activeTab === 'institutional_mocks'
    : activeTab === 'branches' || activeTab === 'mocks' || activeTab === 'school_exams' || activeTab === 'institutional_mocks';
    
  const studentMainTabIds: TabType[] = ['dashboard', 'questions', 'school_exams', 'institutional_mocks', 'branches', 'mocks', 'errors'];
  const isStudentOtherTabActive = !studentMainTabIds.includes(activeTab);

  const getStudentOtherTabLabel = (): string => {
    switch (activeTab) {
      case 'school_exams': return 'Yazılılar';
      case 'institutional_mocks': return 'Karnem';
      case 'subject_progress': return 'Dersler';
      case 'routines': return 'Rutinler';
      case 'planner': return 'Plan';
      case 'pomodoro': return 'Pomodoro';
      case 'resources': return 'Kaynaklar';
      case 'past_questions': return 'Çıkmış';
      case 'youtube': return 'YouTube';
      case 'recommendations': return 'Öneriler';
      case 'ai_coach': return 'AI Koç';
      case 'messages': return 'Mesajlar';
      default: return 'Menü';
    }
  };

  const studentNavItems: BottomNavItem[] = [
    {
      id: 'dashboard',
      label: 'Özet',
      icon: LayoutDashboard,
      isActive: activeTab === 'dashboard'
    },
    {
      id: 'questions',
      label: 'Soru',
      icon: CheckSquare,
      isActive: activeTab === 'questions'
    },
    {
      id: isEarlyGrade ? 'school_exams' : 'branches',
      label: isEarlyGrade ? 'Yazılılar' : 'Deneme',
      icon: isEarlyGrade ? BarChart3 : Target,
      isActive: isStudentDenemeActive
    },
    {
      id: 'errors',
      label: 'Hatalar',
      icon: BookOpen,
      badge: unresolvedErrorCount > 0 ? unresolvedErrorCount : undefined,
      badgeColor: 'bg-rose-500',
      isActive: activeTab === 'errors'
    },
    {
      id: 'menu',
      label: isStudentOtherTabActive ? getStudentOtherTabLabel() : 'Menü',
      icon: isStudentOtherTabActive && activeTab === 'ai_coach' ? Sparkles : Menu,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      badgeColor: 'bg-indigo-500',
      isActive: isStudentOtherTabActive || isMobileMenuOpen,
      activeSubtitle: isStudentOtherTabActive ? 'Açık' : undefined
    }
  ];

  // Teacher Primary Tabs
  const teacherMainTabIds: TabType[] = ['teacher_summary', 'teacher_students', 'institutional_mocks', 'messages'];
  const isTeacherOtherTabActive = !teacherMainTabIds.includes(activeTab);

  const getTeacherOtherTabLabel = (): string => {
    switch (activeTab) {
      case 'teacher_teachers': return 'Öğretmenler';
      case 'bulk_exam_import': return 'Toplu Giriş';
      case 'teacher_templates': return 'Şablonlar';
      case 'past_questions': return 'Çıkmış';
      case 'recommendations': return 'Öneriler';
      case 'ai_coach': return 'AI Koç';
      case 'teacher_system': return 'Sistem';
      case 'audit_logs': return 'Ayak İzi';
      default: return 'Menü';
    }
  };

  const teacherNavItems: BottomNavItem[] = [
    {
      id: 'teacher_summary',
      label: 'Özet',
      icon: LayoutDashboard,
      isActive: activeTab === 'teacher_summary'
    },
    {
      id: 'teacher_students',
      label: 'Öğrenci',
      icon: Users,
      isActive: activeTab === 'teacher_students'
    },
    {
      id: 'institutional_mocks',
      label: 'Denemeler',
      icon: BarChart3,
      isActive: activeTab === 'institutional_mocks' || activeTab === 'teacher_templates'
    },
    {
      id: 'messages',
      label: 'Mesajlar',
      icon: MessageSquare,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      badgeColor: 'bg-rose-500',
      isActive: activeTab === 'messages'
    },
    {
      id: 'menu',
      label: isTeacherOtherTabActive ? getTeacherOtherTabLabel() : 'Menü',
      icon: Menu,
      isActive: isTeacherOtherTabActive || isMobileMenuOpen
    }
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  const handleClick = (item: BottomNavItem) => {
    if (item.id === 'menu') {
      onToggleMobileMenu();
    } else {
      onSelectTab(item.id as TabType);
    }
  };

  return (
    <nav 
      id="mobile-bottom-navbar"
      aria-label="Mobil Alt Navigasyon"
      className={`mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-35 bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] transition-all duration-300 ease-in-out select-none ${
        (isAnyModalOpen || isMobileMenuOpen) ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-90 group ${
                isActive 
                  ? 'text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Background Glow / Pill */}
              <div 
                className={`relative p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? isTeacher
                      ? 'bg-fuchsia-600/90 text-white shadow-lg shadow-fuchsia-500/40 ring-1 ring-fuchsia-400/40 scale-105'
                      : 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/40 ring-1 ring-indigo-400/40 scale-105'
                    : 'bg-transparent text-slate-400 group-hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform" />

                {/* Notification Badge */}
                {item.badge !== undefined && (
                  <span className={`absolute -top-1 -right-1.5 ${item.badgeColor || 'bg-rose-500'} text-white text-[10px] font-black min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md animate-pulse`}>
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10.5px] mt-0.5 tracking-tight font-medium transition-all truncate max-w-full ${
                isActive 
                  ? isTeacher ? 'text-fuchsia-300 font-bold' : 'text-indigo-300 font-bold'
                  : 'text-slate-400'
              }`}>
                {item.label}
              </span>

              {/* Active Underline Dot */}
              {isActive && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${
                  isTeacher ? 'bg-fuchsia-400 shadow-[0_0_6px_#e879f9]' : 'bg-indigo-400 shadow-[0_0_6px_#818cf8]'
                }`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
