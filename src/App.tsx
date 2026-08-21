import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginView } from './components/LoginView';
import { MaintenanceView } from './components/MaintenanceView';
import { ProfileModal } from './components/ProfileModal';
import { MandatoryPasswordChangeModal } from './components/MandatoryPasswordChangeModal';
import { StudentPreviewBanner } from './components/StudentPreviewBanner';
import { OnboardingWizard } from './components/OnboardingWizard';
import { GlobalAiSmartAddModal } from './components/common/GlobalAiSmartAddModal';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';

import { AppGlobalState, UserAccount, YKSDataState, StudentProfile, AuditLogItem, DirectMessage, ClassAICoachAdvice, ClassDefinition, ClassFieldType, InstitutionalMockExam, FieldType, DailyStudyTimeLog, StudyPlanItem, ResourceItem, RoutineItem, SchoolExam } from './types';
import { getGradeLevel, GradeLevel } from './utils/gradeUtils';
import { deleteStorageFile } from './services/storageUpload';
import { loadGlobalState, saveGlobalState, exportDataAsJSON, resetToDefaultData } from './services/storage';
import { isMessageUnreadForUser } from './utils/statusUtils';
import { 
  seedInitialFirestoreData, 
  subscribeToFirestore, 
  subscribeToMessages,
  subscribeToInstitutionalMockExams,
  subscribeToRecommendations,
  subscribeToAuditLogs, 
  subscribeToAllStudentsData,
  subscribeToSingleStudentData,
  saveUserToFirestore, 
  saveClassToFirestore, 
  saveStudentDataToFirestore,
  saveGlobalUsersToFirestore,
  deleteUserFromFirestore,
  deleteClassFromFirestore,
  saveMessageToFirestore,
  markMessagesAsDeliveredInFirestore,
  markMessagesAsReadInFirestore,
  saveAuditLogToFirestore,
  clearAllAuditLogsInFirestore,
  onQuotaError,
  updateUserPresenceInFirestore,
  getPresenceHeartbeatEnabled,
  getPresenceHeartbeatMinutes,
  saveInstitutionalExamToFirestore,
  saveBulkInstitutionalExamsToFirestore,
  deleteInstitutionalExamFromFirestore,
  deleteAllInstitutionalExamsFromFirestore,
  flushPendingFirestoreWrites
} from './services/firebase';
import { 
  createEmptyStudentData, 
  DEFAULT_AVATAR,
  INITIAL_STUDENT_GRADE9_STATE,
  INITIAL_STUDENT_GRADE10_STATE,
  INITIAL_STUDENT_GRADE11_STATE,
  INITIAL_STUDENT_MEZUN_STATE
} from './data/initialData';
import { syncCompletedPlanToYoutubeVideos } from './utils/youtubeUtils';
import { resolveStudentData } from './utils/studentDataUtils';

// Subcomponents
import { UndoItem, getCachedUserIp, getDeviceType } from './components/app/AppTypes';
import { AppToastBanner } from './components/app/AppToastBanner';
import { AppTabRouter } from './components/app/AppTabRouter';
import { MotivationToastItem } from './types';
import { BadgeDefinition, BADGE_DEFINITIONS, evaluateBadges, calculateMotivationStats, generateContextualFeedback, MotivationEvent } from './services/motivationEngine';
import { BadgeCelebrationModal } from './components/badges/BadgeCelebrationModal';
import { MotivationToast } from './components/motivation/MotivationToast';
import { BadgesShowcaseModal } from './components/badges/BadgesShowcaseModal';
import { getTodayDateString, calculateNextReviewDate, getUserRepetitionIntervals } from './services/spacedRepetition';

export default function App() {
  const [globalState, setGlobalState] = useState<AppGlobalState>(() => loadGlobalState());
  const currentUser = globalState.currentUser;

  // Maintenance Mode States
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => localStorage.getItem('maintenance_mode') === 'true');
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>(() => localStorage.getItem('maintenance_message') || '');
  const [maintenanceEndTime, setMaintenanceEndTime] = useState<string>(() => localStorage.getItem('maintenance_end_time') || '');
  const [maintenanceAllowTeachers, setMaintenanceAllowTeachers] = useState<boolean>(() => localStorage.getItem('maintenance_allow_teachers') === 'true');

  useEffect(() => {
    const handleSettingsUpdate = () => {
      const mm = localStorage.getItem('maintenance_mode');
      if (mm !== null) setMaintenanceMode(mm === 'true');
      const mmMsg = localStorage.getItem('maintenance_message');
      if (mmMsg !== null) setMaintenanceMessage(mmMsg);
      const mmEnd = localStorage.getItem('maintenance_end_time');
      if (mmEnd !== null) setMaintenanceEndTime(mmEnd);
      const mmTeach = localStorage.getItem('maintenance_allow_teachers');
      if (mmTeach !== null) setMaintenanceAllowTeachers(mmTeach === 'true');
    };
    window.addEventListener('yks_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('yks_settings_updated', handleSettingsUpdate);
  }, []);

  // Demo kademe öğrencilerini ve verilerini tazeleyen özel olay dinleyicisi
  useEffect(() => {
    const handleRefreshDemoStudents = () => {
      setGlobalState((prev) => {
        const updatedStudents = {
          ...prev.studentsData,
          'student-9a': INITIAL_STUDENT_GRADE9_STATE,
          'student-10a': INITIAL_STUDENT_GRADE10_STATE,
          'student-11a': INITIAL_STUDENT_GRADE11_STATE,
          'student-mezun1': INITIAL_STUDENT_MEZUN_STATE
        };
        const newState = {
          ...prev,
          studentsData: updatedStudents
        };
        saveGlobalState(newState);
        return newState;
      });
    };
    window.addEventListener('yks_refresh_demo_students', handleRefreshDemoStudents);
    return () => window.removeEventListener('yks_refresh_demo_students', handleRefreshDemoStudents);
  }, []);

  // Audit loglarını sadece öğrenci olmayan roller için dinle
  useEffect(() => {
    if (!currentUser || currentUser.role === 'student') {
      return;
    }
    const unsubscribeAuditLogs = subscribeToAuditLogs((logs) => {
      setGlobalState((prev) => ({ ...prev, auditLogs: logs }));
    });
    return () => unsubscribeAuditLogs();
  }, [currentUser?.id, currentUser?.role]);

  // studentsData: role'e göre daralt
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (currentUser.role === 'student') {
      const unsubscribeStudent = subscribeToSingleStudentData(currentUser.id, (data) => {
        setGlobalState((prev) => ({
          ...prev,
          studentsData: data 
            ? { ...prev.studentsData, [currentUser.id]: resolveStudentData(currentUser, { [currentUser.id]: data }) } 
            : prev.studentsData
        }));
      });
      return () => unsubscribeStudent();
    } else {
      const unsubscribeAll = subscribeToAllStudentsData((dataMap) => {
        setGlobalState((prev) => {
          const sanitizedStudentsData = { ...dataMap };
          (prev.users || []).forEach((u) => {
            if (u.role === 'student') {
              sanitizedStudentsData[u.id] = resolveStudentData(u, sanitizedStudentsData);
            }
          });
          return { ...prev, studentsData: sanitizedStudentsData };
        });
      });
      return () => unsubscribeAll();
    }
  }, [currentUser?.id, currentUser?.role]);

  // messages: login sonrası dinle
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    const unsubscribeMessages = subscribeToMessages((messages) => {
      setGlobalState((prev) => {
        const mergedMessagesMap = new Map<string, DirectMessage>();
        for (const m of messages) {
          mergedMessagesMap.set(m.id, m);
        }
        const combined = Array.from(mergedMessagesMap.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        return { ...prev, messages: combined };
      });
    });
    return () => unsubscribeMessages();
  }, [currentUser?.id]);

  // institutionalMockExams: sadece counselor/admin rolleri
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'school_counselor' && currentUser.role !== 'admin')) {
      return;
    }
    const unsubscribeExams = subscribeToInstitutionalMockExams((institutionalMockExams) => {
      setGlobalState((prev) => ({
        ...prev,
        institutionalMockExams: (institutionalMockExams && institutionalMockExams.length > 0)
          ? institutionalMockExams
          : (prev.institutionalMockExams && prev.institutionalMockExams.length > 0)
            ? (() => {
                if (localStorage.getItem('yks_exempt_auto_seed') === 'true') {
                  console.log('[Sync] Firestore is empty, but auto-upload is disabled due to exemption flag.');
                  return [];
                }
                console.log(`[Sync] Firestore is empty but local state has ${prev.institutionalMockExams.length} exams. Auto-uploading...`);
                saveBulkInstitutionalExamsToFirestore(prev.institutionalMockExams);
                return prev.institutionalMockExams;
              })()
            : []
      }));
    });
    return () => unsubscribeExams();
  }, [currentUser?.id, currentUser?.role]);

  // recommendations: login sonrası dinle
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribeRecs = subscribeToRecommendations((recs) => {
      setGlobalState((prev) => ({
        ...prev,
        customRecommendations: recs
      }));
    });
    return () => unsubscribeRecs();
  }, [currentUser?.id]);

  const [currentSchoolName, setCurrentSchoolName] = useState<string>(
    () => localStorage.getItem('school_name') || 'Yıldız Anadolu Lisesi'
  );

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentSchoolName(localStorage.getItem('school_name') || 'Yıldız Anadolu Lisesi');
    };
    window.addEventListener('yks_settings_updated', handleUpdate);
    return () => window.removeEventListener('yks_settings_updated', handleUpdate);
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const isTeacherRole = currentUser?.role === 'class_teacher' || currentUser?.role === 'school_counselor' || currentUser?.role === 'teacher' || currentUser?.role === 'admin';
    return isTeacherRole ? 'teacher_summary' : 'dashboard';
  });
  const [previewStudentUser, setPreviewStudentUser] = useState<UserAccount | null>(null);
  const [previousTeacherTab, setPreviousTeacherTab] = useState<TabType | null>(null);

  const handleStartStudentPreview = (student: UserAccount) => {
    setPreviousTeacherTab(activeTab);
    setPreviewStudentUser(student);
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitStudentPreview = () => {
    setPreviewStudentUser(null);
    if (previousTeacherTab) {
      setActiveTab(previousTeacherTab);
    } else {
      setActiveTab('teacher_students');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [resourceTrackerTab, setResourceTrackerTab] = useState<'resources' | 'topics'>('resources');
  const [resourceTrackerDers, setResourceTrackerDers] = useState<string>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  // Motivation & Badges State
  const [motivationToast, setMotivationToast] = useState<MotivationToastItem | null>(null);
  const [celebrationBadge, setCelebrationBadge] = useState<BadgeDefinition | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<BadgeDefinition[]>([]);
  const [showBadgesShowcaseModal, setShowBadgesShowcaseModal] = useState(false);

  // Onboarding Wizard State (Öğrenci ilk defa girdiğinde açılır)
  const [showOnboardingWizard, setShowOnboardingWizard] = useState<boolean>(() => {
    if (!currentUser || currentUser.role !== 'student') return false;
    if (currentUser.hasCompletedOnboarding) return false;
    return !localStorage.getItem(`yks_onboarding_done_${currentUser.id}`);
  });

  useEffect(() => {
    if (currentUser && currentUser.role === 'student' && !currentUser.hasCompletedOnboarding && !localStorage.getItem(`yks_onboarding_done_${currentUser.id}`)) {
      setShowOnboardingWizard(true);
    } else {
      setShowOnboardingWizard(false);
    }
  }, [currentUser?.id, currentUser?.hasCompletedOnboarding]);

  const handleTabChange = (tab: TabType) => {
    setIsZenMode(false);
    setActiveTab(tab);
  };

  const handleNavigateTab = (tab: string, opts?: { subTab?: 'resources' | 'topics'; subject?: string }) => {
    setIsZenMode(false);
    setActiveTab(tab as TabType);
    if (tab === 'resources') {
      if (opts?.subTab) {
        setResourceTrackerTab(opts.subTab);
      } else {
        setResourceTrackerTab('resources');
      }
      if (opts?.subject) {
        const sub = opts.subject.toLowerCase();
        let ders = 'all';
        if (sub.includes('matematik')) ders = 'Matematik';
        else if (sub.includes('geometri')) ders = 'Geometri';
        else if (sub.includes('türkçe') || sub.includes('edebiyat') || sub.includes('paragraf')) ders = 'Türkçe';
        else if (sub.includes('fizik')) ders = 'Fizik';
        else if (sub.includes('kimya')) ders = 'Kimya';
        else if (sub.includes('biyoloji')) ders = 'Biyoloji';
        else if (sub.includes('tarih')) ders = 'Tarih';
        else if (sub.includes('coğrafya') || sub.includes('cografya')) ders = 'Coğrafya';
        else if (sub.includes('felsefe') || sub.includes('din')) ders = 'Felsefe';
        setResourceTrackerDers(ders);
      } else {
        setResourceTrackerDers('all');
      }
    }
  };

  // Theme State & Sync Effect
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    if (typeof (document as any).startViewTransition === 'function') {
      (document as any).startViewTransition(() => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      });
    } else {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }
  };

  // PWA & Device Detection State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [showPwaGuide, setShowPwaGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVirtualFullscreen, setIsVirtualFullscreen] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      const isMobileUA = /iphone|ipad|ipod|android|blackberry|iemobile|opera mini/i.test(ua);
      const isTouchScreen = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      setIsMobileOrTablet(isMobileUA || isTouchScreen || window.innerWidth < 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (!window.history.state || window.history.state.tab !== activeTab) {
      window.history.replaceState({ tab: activeTab }, '', '');
    }
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (window.history.state && window.history.state.tab !== activeTab) {
      window.history.pushState({ tab: activeTab }, '', '');
    }
  }, [activeTab, currentUser]);

  // Presence Tracker
  useEffect(() => {
    if (!currentUser?.id) return;
    updateUserPresenceInFirestore(currentUser.id, true);

    let interval: ReturnType<typeof setInterval> | null = null;
    if (getPresenceHeartbeatEnabled()) {
      interval = setInterval(() => {
        updateUserPresenceInFirestore(currentUser.id, true);
      }, getPresenceHeartbeatMinutes() * 60 * 1000);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserPresenceInFirestore(currentUser.id, true);
      }
    };
    const handleBeforeUnload = () => {
      updateUserPresenceInFirestore(currentUser.id, false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateUserPresenceInFirestore(currentUser.id, false);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const mainElem = document.querySelector('main');
    if (mainElem) {
      mainElem.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handleAddToHomeScreen = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Kullanıcı PWA yüklemeyi kabul etti');
        } else {
          console.log('Kullanıcı PWA yüklemeyi reddetti');
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowPwaGuide(true);
    }
  };

  const handleToggleFullscreen = () => {
    if (isVirtualFullscreen) {
      setIsVirtualFullscreen(false);
      return;
    }

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.warn('Tam ekran başarısız, sanal tam ekran aktif ediliyor:', err);
          setIsVirtualFullscreen(true);
          setLastToast({
            id: 'fs-virtual-' + Date.now(),
            message: 'Önizleme penceresinde olduğunuz için sanal tam ekran aktif edildi. Gerçek tam ekran için sağ üstteki Yeni Sekmede Aç butonunu kullanabilirsiniz.'
          });
        });
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVirtualFullscreen) {
        setIsVirtualFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isVirtualFullscreen]);

  // Undo & Audit Logging State
  const [undoStack, setUndoStack] = useState<UndoItem[]>([]);
  const [lastToast, setLastToast] = useState<{ id: string; message: string; type?: 'success' | 'warning' | 'error' | 'info'; title?: string; undoFn?: () => void } | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    onQuotaError((hasError) => {
      setIsQuotaExceeded(hasError);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const latestUndoItem = undoStack[undoStack.length - 1];
  const canUndoForNavbar = latestUndoItem ? (currentTime - (latestUndoItem.createdAt || 0)) < 60000 : false;

  // ✨ Yapay Zeka ile Akıllı Hızlı Ekleme (Smart Add Modal) State & Handler
  const [isSmartAddModalOpen, setIsSmartAddModalOpen] = useState<boolean>(false);

  const handleDispatchSmartAdd = (
    intent: string,
    targetTab: string,
    fields: Record<string, any>,
    directSave: boolean
  ) => {
    const tabMapping: Record<string, string> = {
      QUESTION_LOG: 'questions',
      TOPIC_ERROR: 'errors',
      BRANCH_EXAM: 'branches',
      GENERAL_MOCK: 'mocks',
      STUDY_PLAN: 'planner',
      STUDY_SESSION: 'planner',
      RESOURCE_BOOK: 'resources',
      ROUTINE: 'routines'
    };

    const resolvedTab = tabMapping[intent] || targetTab || 'dashboard';
    
    // Doğrudan hızlı kayıt (Eğer seçildiyse ve soru kaydı eksiksizse)
    if (directSave && intent === 'QUESTION_LOG' && fields.subject && fields.totalQuestions) {
      const correct = Number(fields.correct) || 0;
      const wrong = Number(fields.wrong) || 0;
      const empty = Number(fields.empty) || Math.max(0, Number(fields.totalQuestions) - (correct + wrong));

      handleAddQuestionLog({
        date: fields.date || new Date().toISOString().split('T')[0],
        examType: (fields.subject.startsWith('AYT') ? 'AYT' : fields.subject.startsWith('YDT') ? 'YDT' : 'TYT') as any,
        subject: fields.subject,
        targetCount: Number(fields.totalQuestions),
        solvedCount: Number(fields.totalQuestions),
        correctCount: correct,
        wrongCount: wrong,
        emptyCount: empty,
        durationMinutes: Number(fields.durationMinutes) || 0,
        notes: fields.notes || 'AI ile hızlı eklendi.'
      });

      setLastToast({
        id: 'toast-' + Date.now(),
        message: `✨ ${fields.subject} ${fields.totalQuestions} soru çözümü başarıyla kaydedildi.`
      });
      return;
    }

    // Hedef pencere için cache ve event dispatch mekanizması
    (window as any).__lastSmartAddPrefill = {
      intent,
      targetTab: resolvedTab,
      fields,
      timestamp: Date.now()
    };

    handleTabChange(resolvedTab as TabType);

    // Olası mount/render gecikmelerini karşılamak için çoklu tetikleme
    [50, 150, 300].forEach((delay) => {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('yks_smart_add_prefill', {
            detail: { intent, targetTab: resolvedTab, fields }
          })
        );
      }, delay);
    });
  };

  useEffect(() => {
    if (lastToast) {
      const timer = setTimeout(() => {
        setLastToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, currentUser]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastItem = undoStack[undoStack.length - 1];
    lastItem.undoAction();
    setUndoStack((prev) => prev.slice(0, prev.length - 1));

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${year}-${month}-${day} ${hours}:${minutes}`;
    if (currentUser) {
      const undoAuditItem: AuditLogItem = {
        id: 'log-' + Date.now(),
        timestamp: timeStr,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actorClassName: currentUser.className,
        actionType: 'undo',
        actionDescription: `[Geri Alındı] ${lastItem.description}`,
        category: 'system',
        ipAddress: getCachedUserIp()
      };
      saveAuditLogToFirestore(undoAuditItem);
      setGlobalState((prev) => ({
        ...prev,
        auditLogs: [undoAuditItem, ...(prev.auditLogs || [])]
      }));
    }

    setLastToast({
      id: 'toast-' + Date.now(),
      message: `İşlem geri alındı: "${lastItem.description}"`
    });
  };

  const addAuditAndUndo = (
    description: string,
    category: AuditLogItem['category'],
    actionType: string,
    undoFn?: () => void,
    targetUserId?: string,
    targetUserName?: string,
    metadata?: Record<string, any>
  ) => {
    if (!currentUser || previewStudentUser) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${year}-${month}-${day} ${hours}:${minutes}`;

    const newLog: AuditLogItem = {
      id: 'log-' + Date.now(),
      timestamp: timeStr,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      actorClassName: currentUser.className,
      targetUserId,
      targetUserName,
      actionType,
      actionDescription: description,
      category,
      deviceType: getDeviceType(),
      ipAddress: getCachedUserIp(),
      metadata
    };

    saveAuditLogToFirestore(newLog);
    setGlobalState((prev) => ({
      ...prev,
      auditLogs: [newLog, ...(prev.auditLogs || [])]
    }));

    if (undoFn) {
      const undoItem: UndoItem = {
        id: 'undo-' + Date.now(),
        description,
        undoAction: undoFn,
        timestamp: timeStr,
        createdAt: Date.now()
      };
      setUndoStack((prev) => [...prev, undoItem]);
    }
  };

  useEffect(() => {
    seedInitialFirestoreData();
    const unsubscribe = subscribeToFirestore(({ users, classes, customRecommendations }) => {
      setGlobalState((prev) => {
        return {
          ...prev,
          users,
          classes,
          customRecommendations,
          currentUser: prev.currentUser ? users.find((u) => u.id === prev.currentUser?.id) || prev.currentUser : null
        };
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isTeacherRole = currentUser?.role === 'class_teacher' || currentUser?.role === 'school_counselor' || currentUser?.role === 'teacher' || currentUser?.role === 'admin';
    if (isTeacherRole) {
      setActiveTab('teacher_summary');
    } else {
      setActiveTab('dashboard');
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!currentUser) return;
    setGlobalState(prev => {
      const messages = prev.messages || [];
      const undeliveredIds: string[] = [];
      const updatedMessages = messages.map(m => {
        if (m.receiverId === currentUser.id && !m.isDelivered) {
          undeliveredIds.push(m.id);
          return { ...m, isDelivered: true };
        }
        return m;
      });

      if (undeliveredIds.length > 0) {
        markMessagesAsDeliveredInFirestore(undeliveredIds);
        return { ...prev, messages: updatedMessages };
      }
      return prev;
    });
  }, [currentUser?.id]);

  useEffect(() => {
    saveGlobalState(globalState);
    if (globalState.currentUser) {
      localStorage.setItem('yks_last_active_time', Date.now().toString());
    }
  }, [globalState]);



  const activeViewingUser = previewStudentUser || currentUser;
  const currentStudentData: YKSDataState = (activeViewingUser && globalState.studentsData[activeViewingUser.id]) || (activeViewingUser ? createEmptyStudentData(activeViewingUser.name, activeViewingUser.className) : createEmptyStudentData('', ''));
  const unresolvedErrorCount = currentStudentData.topicErrors.filter((e) => !e.revised).length;

  const updateCurrentStudentData = (updater: (prev: YKSDataState) => YKSDataState) => {
    if (!currentUser) return;
    if (previewStudentUser) {
      setLastToast({
        id: 'toast-' + Date.now(),
        type: 'error',
        title: 'ÖĞRENCİ ÖNİZLEME MODU (SALT OKUNUR)',
        message: 'Önizleme modunda değişiklik, ekleme veya silme yapılamaz.'
      });
      return;
    }
    setGlobalState((prev) => {
      const existingData = prev.studentsData[currentUser.id] || createEmptyStudentData(currentUser.name, currentUser.className);
      const updatedData = updater(existingData);
      saveStudentDataToFirestore(currentUser.id, updatedData);
      return {
        ...prev,
        studentsData: {
          ...prev.studentsData,
          [currentUser.id]: updatedData
        }
      };
    });
  };

  // 1. Motivation Event Listener (for action toasts across the app)
  useEffect(() => {
    const handleTriggerMotivation = (e: any) => {
      if (!currentUser || currentUser.role !== 'student' || previewStudentUser) return;
      const event: MotivationEvent = e.detail;
      if (!event) return;
      
      let customMsgs: Record<string, string> | undefined;
      try {
        const saved = localStorage.getItem('yks_motivation_messages');
        if (saved) customMsgs = JSON.parse(saved);
      } catch (err) {}

      const toast = generateContextualFeedback(event, currentStudentData, customMsgs);
      if (toast) {
        setMotivationToast(toast);
      }
    };
    window.addEventListener('yks_trigger_motivation', handleTriggerMotivation as EventListener);
    return () => window.removeEventListener('yks_trigger_motivation', handleTriggerMotivation as EventListener);
  }, [currentUser?.id, currentStudentData]);

  // 2. Daily Streak Greeting (Shown once per day when logging in with an active streak)
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student' || previewStudentUser) return;
    const lastGreeting = localStorage.getItem('yks_last_streak_greet');
    const todayStr = new Date().toISOString().split('T')[0];
    if (lastGreeting !== todayStr) {
      const stats = calculateMotivationStats(currentStudentData);
      if (stats.currentStreak > 0) {
        const timer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
            detail: { type: 'streak_greet', payload: { streak: stats.currentStreak } }
          }));
          localStorage.setItem('yks_last_streak_greet', todayStr);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser?.id, currentStudentData.dailyStudyLogs, currentStudentData.questionLogs, currentStudentData.studyPlans, previewStudentUser]);

  // 3. Automated Badge Evaluation & Celebration Trigger
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student' || previewStudentUser) return;

    const { newBadges, allEarnedBadges, stats } = evaluateBadges(currentStudentData);
    if (newBadges.length > 0) {
      updateCurrentStudentData((prev) => ({
        ...prev,
        earnedBadges: allEarnedBadges,
        motivationStats: stats
      }));

      const defs = newBadges
        .map(nb => BADGE_DEFINITIONS.find(d => d.key === nb.key))
        .filter((d): d is BadgeDefinition => !!d);

      if (defs.length > 0) {
        setCelebrationBadge(defs[0]);
        if (defs.length > 1) {
          setBadgeQueue(defs.slice(1));
        }
      }
    }
  }, [
    currentUser?.id,
    currentStudentData.questionLogs?.length,
    currentStudentData.generalMocks?.length,
    currentStudentData.branchExams?.length,
    currentStudentData.resources?.length,
    currentStudentData.studyPlans?.length,
    JSON.stringify(currentStudentData.topicStatuses || {}),
    JSON.stringify(currentStudentData.dailyStudyLogs || {})
  ]);

  const handleNextCelebration = () => {
    if (badgeQueue.length > 0) {
      setCelebrationBadge(badgeQueue[0]);
      setBadgeQueue(prev => prev.slice(1));
    } else {
      setCelebrationBadge(null);
    }
  };

  const handleUpdateSubjectNotes = (subjectName: string, notes: { studentNote?: string; teacherNote?: string }) => {
    if (!currentUser) return;
    updateCurrentStudentData((prev) => {
      const currentNotes = prev.subjectNotes || {};
      const updatedNotes = {
        ...currentNotes,
        [subjectName]: {
          ...currentNotes[subjectName],
          ...notes
        }
      };
      return {
        ...prev,
        subjectNotes: updatedNotes
      };
    });

    addAuditAndUndo(
      `${currentUser.name}, ${subjectName} dersi notlarını güncelledi.`,
      'profile',
      'update_subject_notes'
    );
  };

  const handleUpdateStudentSubjectNotesByTeacher = (studentId: string, subjectName: string, notes: { studentNote?: string; teacherNote?: string }) => {
    const targetStudent = globalState.users.find(u => u.id === studentId);
    setGlobalState((prev) => {
      const studentData = prev.studentsData[studentId] || createEmptyStudentData(targetStudent?.name || '', targetStudent?.className || '');
      const currentNotes = studentData.subjectNotes || {};
      const updatedData = {
        ...studentData,
        subjectNotes: {
          ...currentNotes,
          [subjectName]: {
            ...currentNotes[subjectName],
            ...notes
          }
        }
      };
      saveStudentDataToFirestore(studentId, updatedData);
      return {
        ...prev,
        studentsData: {
          ...prev.studentsData,
          [studentId]: updatedData
        }
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'}, ${targetStudent?.name || 'Öğrenci'} için ${subjectName} dersi notlarını güncelledi.`,
      'management',
      'teacher_update_subject_notes',
      undefined,
      studentId,
      targetStudent?.name
    );
  };

  const handleUpdateDashboardWidgets = (widgets: any[]) => {
    if (!currentUser) return;

    const updatedUser: UserAccount = {
      ...currentUser,
      dashboardWidgets: widgets
    };
    saveUserToFirestore(updatedUser);

    if (currentUser.role === 'student' || globalState.studentsData[currentUser.id]) {
      updateCurrentStudentData((prev) => ({
        ...prev,
        dashboardWidgets: widgets
      }));
    }

    setGlobalState((prev) => ({
      ...prev,
      currentUser: updatedUser,
      users: prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    }));

    addAuditAndUndo(
      `${currentUser.name} genel özet panel düzenini güncelledi.`,
      'profile',
      'update_dashboard_widgets'
    );
  };

  const handleLoginSuccess = (user: UserAccount) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${year}-${month}-${day} ${hours}:${minutes}`;

    const roleLabels: Record<string, string> = {
      student: 'Öğrenci',
      class_teacher: 'Sınıf Öğretmeni',
      school_counselor: 'Okul Rehber Öğretmeni',
      teacher: 'Öğretmen'
    };
    const roleText = roleLabels[user.role] || 'Kullanıcı';

    const loginAuditItem: AuditLogItem = {
      id: 'log-login-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: timeStr,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      actorClassName: user.className,
      actionType: 'USER_LOGIN',
      actionDescription: `${user.name} (${roleText}${user.className ? ` - ${user.className}` : ''}) hesaba giriş yaptı. Oturum açıldı.`,
      category: 'system',
      ipAddress: getCachedUserIp()
    };

    saveAuditLogToFirestore(loginAuditItem);
    setGlobalState((prev) => ({
      ...prev,
      currentUser: user,
      auditLogs: [loginAuditItem, ...(prev.auditLogs || [])],
      studentsData: user.role === 'student' && !prev.studentsData[user.id] 
        ? { ...prev.studentsData, [user.id]: resolveStudentData(user, prev.studentsData) }
        : prev.studentsData
    }));
  };

  const handleCreateAccount = (newUserData: Omit<UserAccount, 'id'>) => {
    const newId = (newUserData.role === 'student' ? 'student-' : 'teacher-') + Date.now();
    const newUser: UserAccount = {
      ...newUserData,
      id: newId,
      createdAt: newUserData.createdAt || new Date().toISOString()
    };

    saveUserToFirestore(newUser);

    if (newUser.role === 'student') {
      const initialStudentData: YKSDataState = createEmptyStudentData(newUser.name, newUser.className || '12-A SAY');
      saveStudentDataToFirestore(newId, initialStudentData);
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${year}-${month}-${day} ${hours}:${minutes}`;

    const roleLabels: Record<string, string> = {
      student: 'Öğrenci',
      class_teacher: 'Sınıf Öğretmeni',
      school_counselor: 'Okul Rehber Öğretmeni',
      teacher: 'Öğretmen'
    };
    const roleText = roleLabels[newUser.role] || 'Kullanıcı';

    const registerAuditItem: AuditLogItem = {
      id: 'log-reg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: timeStr,
      actorId: newUser.id,
      actorName: newUser.name,
      actorRole: newUser.role,
      actorClassName: newUser.className,
      actionType: newUser.status === 'pending' ? 'ACCOUNT_REGISTER' : 'ACCOUNT_REGISTER_AND_LOGIN',
      actionDescription: newUser.status === 'pending'
        ? `${newUser.name} (${roleText}) yeni hesap oluşturdu (Öğretmen onayı bekleniyor).`
        : `${newUser.name} (${roleText}) yeni hesap oluşturdu ve giriş yaptı.`,
      category: 'system',
      ipAddress: getCachedUserIp()
    };

    saveAuditLogToFirestore(registerAuditItem);
    setGlobalState((prev) => {
      const updatedUsers = [...prev.users, newUser];
      const updatedStudentsData = { ...prev.studentsData };
      if (newUser.role === 'student') {
        updatedStudentsData[newId] = createEmptyStudentData(newUser.name, newUser.className || '12-A SAY');
      }
      return {
        ...prev,
        currentUser: newUser.status === 'pending' ? prev.currentUser : newUser,
        users: updatedUsers,
        studentsData: updatedStudentsData,
        auditLogs: [registerAuditItem, ...(prev.auditLogs || [])]
      };
    });
  };

  const handleLogout = async () => {
    try {
      await flushPendingFirestoreWrites();
    } catch (e) {
      console.error('Çıkış öncesi bekleyen veriler gönderilirken hata oluştu:', e);
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    const prevUser = globalState.currentUser;

    if (prevUser) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${year}-${month}-${day} ${hours}:${minutes}`;

      const roleLabels: Record<string, string> = {
        student: 'Öğrenci',
        class_teacher: 'Sınıf Öğretmeni',
        school_counselor: 'Okul Rehber Öğretmeni',
        teacher: 'Öğretmen'
      };
      const roleText = roleLabels[prevUser.role] || 'Kullanıcı';

      const logoutAuditItem: AuditLogItem = {
        id: 'log-logout-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        timestamp: timeStr,
        actorId: prevUser.id,
        actorName: prevUser.name,
        actorRole: prevUser.role,
        actorClassName: prevUser.className,
        actionType: 'USER_LOGOUT',
        actionDescription: `${prevUser.name} (${roleText}) hesaptan çıkış yaptı.`,
        category: 'system',
        ipAddress: getCachedUserIp()
      };

      saveAuditLogToFirestore(logoutAuditItem);
      setGlobalState((prev) => ({
        ...prev,
        currentUser: null,
        auditLogs: [logoutAuditItem, ...(prev.auditLogs || [])]
      }));
    } else {
      setGlobalState((prev) => ({
        ...prev,
        currentUser: null
      }));
    }

    localStorage.removeItem('yks_remember_me');
    sessionStorage.removeItem('yks_session_active');
    localStorage.removeItem('yks_last_active_time');
    setPreviewStudentUser(null);
  };

  const handleUpdateStudentProfileByTeacher = (studentId: string, updatedProfile: StudentProfile) => {
    const studentUser = globalState.users.find(u => u.id === studentId);
    const prevStudentData = globalState.studentsData[studentId] || createEmptyStudentData(studentUser?.name || '', studentUser?.className || '');

    setGlobalState((prev) => {
      const studentData = prev.studentsData[studentId] || createEmptyStudentData(studentUser?.name || '', studentUser?.className || '');
      const updatedData = { ...studentData, profile: updatedProfile };
      saveStudentDataToFirestore(studentId, updatedData);
      return {
        ...prev,
        studentsData: {
          ...prev.studentsData,
          [studentId]: updatedData
        }
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'}, ${studentUser?.name || 'Öğrenci'} kullanıcısının profil & koç notunu güncelledi.`,
      'profile',
      'teacher_update_profile',
      () => {
        setGlobalState((prev) => {
          saveStudentDataToFirestore(studentId, prevStudentData);
          return {
            ...prev,
            studentsData: { ...prev.studentsData, [studentId]: prevStudentData }
          };
        });
      },
      studentId,
      studentUser?.name
    );
  };

  const handleCreateClass = (
    className: string, 
    field: ClassFieldType, 
    description?: string, 
    gradeLevel?: GradeLevel
  ) => {
    const resolvedGrade = gradeLevel || getGradeLevel(className);
    const newClass: ClassDefinition = {
      id: 'class-' + Date.now(),
      name: className,
      gradeLevel: resolvedGrade,
      field: field,
      description: description || '',
      assignedTeacherIds: currentUser ? [currentUser.id] : []
    };
    const prevClasses = globalState.classes;
    saveClassToFirestore(newClass);

    setGlobalState((prev) => {
      const updatedUsers = prev.users.map((u) => {
        if (u.id === currentUser?.id && u.role === 'teacher') {
          const updatedTeacher = {
            ...u,
            assignedClassNames: [...(u.assignedClassNames || []), className]
          };
          saveUserToFirestore(updatedTeacher);
          return updatedTeacher;
        }
        return u;
      });

      return {
        ...prev,
        users: updatedUsers,
        classes: [...prev.classes, newClass],
        currentUser: currentUser?.role === 'teacher' 
          ? { ...currentUser, assignedClassNames: [...(currentUser.assignedClassNames || []), className] }
          : currentUser
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'} "${className}" isimli yeni bir sınıf oluşturdu.`,
      'management',
      'create_class',
      () => {
        deleteClassFromFirestore(newClass.id);
        setGlobalState((prev) => ({
          ...prev,
          classes: prevClasses
        }));
      }
    );
  };

  const handleAssignStudentClass = (studentId: string, newClassName: string) => {
    const targetStudent = globalState.users.find(u => u.id === studentId);
    const prevClassName = targetStudent?.className || 'Atanmamış';
    const targetClass = globalState.classes.find(c => c.name === newClassName);

    setGlobalState((prev) => {
      const updatedUsers = prev.users.map((u) => {
        if (u.id === studentId) {
          const updatedStudent = { ...u, className: newClassName };
          saveUserToFirestore(updatedStudent);
          return updatedStudent;
        }
        return u;
      });

      const studentData = prev.studentsData[studentId];
      const updatedStudentsData = { ...prev.studentsData };
      if (studentData) {
        const updatedData = {
          ...studentData,
          profile: {
            ...studentData.profile,
            className: newClassName,
            targetField: targetClass?.field || studentData.profile?.targetField
          }
        };
        saveStudentDataToFirestore(studentId, updatedData);
        updatedStudentsData[studentId] = updatedData;
      }

      return {
        ...prev,
        users: updatedUsers,
        studentsData: updatedStudentsData
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'}, ${targetStudent?.name || 'Öğrenci'} isimli öğrenciyi "${newClassName}" sınıfına atadı.`,
      'management',
      'assign_class',
      () => {
        handleAssignStudentClass(studentId, prevClassName);
      },
      studentId,
      targetStudent?.name
    );
  };

  const handleUpdateStudentStudyPlansByTeacher = (studentId: string, updatedPlans: any[]) => {
    const targetStudent = globalState.users.find(u => u.id === studentId);
    const prevPlans = globalState.studentsData[studentId]?.studyPlans || [];

    setGlobalState((prev) => {
      const studentData = prev.studentsData[studentId] || createEmptyStudentData(targetStudent?.name || '', targetStudent?.className || '');
      const updatedData = { ...studentData, studyPlans: updatedPlans };
      saveStudentDataToFirestore(studentId, updatedData);
      return {
        ...prev,
        studentsData: {
          ...prev.studentsData,
          [studentId]: updatedData
        }
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'}, ${targetStudent?.name || 'Öğrenci'} için çalışma programını güncelledi.`,
      'study',
      'teacher_update_plans',
      () => {
        handleUpdateStudentStudyPlansByTeacher(studentId, prevPlans);
      },
      studentId,
      targetStudent?.name
    );
  };

  const handleUpdateStudentTopicErrorsByTeacher = (studentId: string, updatedErrors: any[], actionText?: string) => {
    const targetStudent = globalState.users.find(u => u.id === studentId);
    const prevErrors = globalState.studentsData[studentId]?.topicErrors || [];

    setGlobalState((prev) => {
      const studentData = prev.studentsData[studentId] || createEmptyStudentData(targetStudent?.name || '', targetStudent?.className || '');
      const updatedData = { ...studentData, topicErrors: updatedErrors };
      saveStudentDataToFirestore(studentId, updatedData);
      return {
        ...prev,
        studentsData: {
          ...prev.studentsData,
          [studentId]: updatedData
        }
      };
    });

    if (actionText) {
      addAuditAndUndo(
        actionText,
        'exam',
        'teacher_update_topic_errors',
        () => {
          handleUpdateStudentTopicErrorsByTeacher(studentId, prevErrors);
        },
        studentId,
        targetStudent?.name
      );
    }
  };

  const handleSaveProgramTemplate = (templateData: any) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const newTemplate = {
      ...templateData,
      id: 'template-' + Date.now(),
      createdAt: `${year}-${month}-${day}`
    };
    const prevTemplates = globalState.programTemplates || [];
    setGlobalState((prev) => ({
      ...prev,
      programTemplates: [newTemplate, ...(prev.programTemplates || [])]
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'} "${newTemplate.title}" adlı çalışma programı şablonu oluşturdu.`,
      'template',
      'save_template',
      () => {
        setGlobalState((prev) => ({ ...prev, programTemplates: prevTemplates }));
      }
    );
  };

  const handleUpdateProgramTemplate = (updatedTemplate: any) => {
    const prevTemplates = globalState.programTemplates || [];
    setGlobalState((prev) => ({
      ...prev,
      programTemplates: (prev.programTemplates || []).map((t) => t.id === updatedTemplate.id ? updatedTemplate : t)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'} "${updatedTemplate.title}" çalışma programı şablonunu güncelledi.`,
      'template',
      'update_template',
      () => {
        setGlobalState((prev) => ({ ...prev, programTemplates: prevTemplates }));
      }
    );
  };

  const handleDeleteProgramTemplate = (templateId: string) => {
    const prevTemplates = globalState.programTemplates || [];
    const tplToDelete = prevTemplates.find(t => t.id === templateId);

    setGlobalState((prev) => ({
      ...prev,
      programTemplates: (prev.programTemplates || []).filter((t) => t.id !== templateId)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'} "${tplToDelete?.title || 'Şablon'}" program şablonunu sildi.`,
      'template',
      'delete_template',
      () => {
        setGlobalState((prev) => ({ ...prev, programTemplates: prevTemplates }));
      }
    );
  };

  const handleApplyTemplateToStudent = (studentId: string, templateId: string, mode: 'overwrite' | 'merge') => {
    const tpl = (globalState.programTemplates || []).find((t) => t.id === templateId);
    const targetStudent = globalState.users.find(u => u.id === studentId);
    if (!tpl) return;

    const prevPlans = globalState.studentsData[studentId]?.studyPlans || [];

    const newItems: StudyPlanItem[] = tpl.items.map((item: any, idx: number) => ({
      id: `plan-${Date.now()}-${idx}`,
      day: item.day,
      subject: item.subject,
      topic: item.topic,
      plannedMinutes: item.plannedMinutes,
      completedMinutes: 0,
      status: 'pending' as const,
      notes: item.notes
    }));

    setGlobalState((prev) => {
      const studentData = prev.studentsData[studentId] || createEmptyStudentData(targetStudent?.name || '', targetStudent?.className || '');
      const existingPlans = studentData.studyPlans || [];
      const updatedPlans = mode === 'overwrite' ? newItems : [...newItems, ...existingPlans];
      const updatedData = { ...studentData, studyPlans: updatedPlans };
      saveStudentDataToFirestore(studentId, updatedData);
      return {
        ...prev,
        studentsData: {
          ...prev.studentsData,
          [studentId]: updatedData
        }
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'}, ${targetStudent?.name || 'Öğrenci'} öğrencisine "${tpl.title}" şablonunu uyguladı.`,
      'template',
      'apply_template',
      () => {
        handleUpdateStudentStudyPlansByTeacher(studentId, prevPlans);
      },
      studentId,
      targetStudent?.name
    );
  };

  const handleApplyTemplateToClass = (className: string, templateId: string, mode: 'overwrite' | 'merge') => {
    const tpl = (globalState.programTemplates || []).find((t) => t.id === templateId);
    if (!tpl) return;

    const classStudents = globalState.users.filter(u => u.role === 'student' && u.className === className);
    if (classStudents.length === 0) {
      alert(`"${className}" şubesinde kayıtlı öğrenci bulunamadı.`);
      return;
    }

    const prevStudentsData = { ...globalState.studentsData };

    setGlobalState((prev) => {
      const nextStudentsData = { ...prev.studentsData };

      classStudents.forEach(student => {
        const studentId = student.id;
        const studentData = nextStudentsData[studentId] || createEmptyStudentData(student.name, student.className);
        const existingPlans = studentData.studyPlans || [];

        const newItems: StudyPlanItem[] = tpl.items.map((item: any, idx: number) => ({
          id: `plan-${Date.now()}-${studentId.slice(-4)}-${idx}`,
          day: item.day,
          subject: item.subject,
          topic: item.topic,
          plannedMinutes: item.plannedMinutes,
          completedMinutes: 0,
          status: 'pending' as const,
          notes: item.notes
        }));

        const updatedPlans = mode === 'overwrite' ? newItems : [...newItems, ...existingPlans];
        const updatedData = { ...studentData, studyPlans: updatedPlans };
        saveStudentDataToFirestore(studentId, updatedData);
        nextStudentsData[studentId] = updatedData;
      });

      return {
        ...prev,
        studentsData: nextStudentsData
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'} "${tpl.title}" şablonunu "${className}" şubesindeki ${classStudents.length} öğrenciye toplu uyguladı.`,
      'template',
      'bulk_apply_template_class',
      () => {
        setGlobalState((prev) => {
          classStudents.forEach(st => {
            const oldData = prevStudentsData[st.id];
            if (oldData) {
              saveStudentDataToFirestore(st.id, oldData);
            }
          });
          return {
            ...prev,
            studentsData: prevStudentsData
          };
        });
      }
    );
  };

  const handleUpdateStudentAccount = (updatedStudent: UserAccount) => {
    const prevUsers = globalState.users;
    setGlobalState((prev) => {
      const updatedUsers = prev.users.map((u) => u.id === updatedStudent.id ? updatedStudent : u);
      saveGlobalUsersToFirestore(updatedUsers);
      return { ...prev, users: updatedUsers };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Rehber Öğretmen'} "${updatedStudent.name}" öğrencisinin bilgilerini güncelledi.`,
      'management',
      'update_student_account',
      () => {
        setGlobalState((prev) => ({ ...prev, users: prevUsers }));
        saveGlobalUsersToFirestore(prevUsers);
      }
    );
  };

  const handleUpdateTeacherAccount = (updatedTeacher: UserAccount) => {
    const prevUsers = globalState.users;
    setGlobalState((prev) => {
      const updatedUsers = prev.users.map((u) => u.id === updatedTeacher.id ? updatedTeacher : u);
      saveGlobalUsersToFirestore(updatedUsers);
      return { ...prev, users: updatedUsers };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Rehber Öğretmen'} "${updatedTeacher.name}" öğretmeninin bilgilerini güncelledi.`,
      'management',
      'update_teacher_account',
      () => {
        setGlobalState((prev) => ({ ...prev, users: prevUsers }));
        saveGlobalUsersToFirestore(prevUsers);
      }
    );
  };

  const handleUpdateTeacherAssignedClasses = (teacherId: string, assignedClassNames: string[]) => {
    const prevUsers = globalState.users;
    setGlobalState((prev) => {
      const updatedUsers = prev.users.map((u) => u.id === teacherId ? { ...u, assignedClassNames } : u);
      saveGlobalUsersToFirestore(updatedUsers);
      return { ...prev, users: updatedUsers };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Rehber Öğretmen'} öğretmen atamalarını güncelledi.`,
      'management',
      'update_teacher_classes',
      () => {
        setGlobalState((prev) => ({ ...prev, users: prevUsers }));
        saveGlobalUsersToFirestore(prevUsers);
      }
    );
  };

  const handleDeleteClassDefinition = (classId: string) => {
    deleteClassFromFirestore(classId);
    const prevClasses = globalState.classes;
    const prevUsers = globalState.users;

    setGlobalState((prev) => {
      const clsToDelete = prev.classes.find(c => c.id === classId);
      if (!clsToDelete) return prev;
      const updatedClasses = prev.classes.filter(c => c.id !== classId);
      const updatedUsers = prev.users.map(u => {
        if (u.assignedClassNames && u.assignedClassNames.includes(clsToDelete.name)) {
          return {
            ...u,
            assignedClassNames: u.assignedClassNames.filter(cName => cName !== clsToDelete.name)
          };
        }
        return u;
      });
      saveGlobalUsersToFirestore(updatedUsers);
      return {
        ...prev,
        classes: updatedClasses,
        users: updatedUsers
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Rehber Öğretmen'} sınıf tanımını sildi.`,
      'management',
      'delete_class',
      () => {
        setGlobalState((prev) => ({ ...prev, classes: prevClasses, users: prevUsers }));
        saveGlobalUsersToFirestore(prevUsers);
      }
    );
  };

  const handleUpdateClassDefinition = (updatedClass: ClassDefinition) => {
    saveClassToFirestore(updatedClass);
    const prevClasses = globalState.classes;
    const prevUsers = globalState.users;

    setGlobalState((prev) => {
      const oldClass = prev.classes.find(c => c.id === updatedClass.id);
      if (!oldClass) return prev;
      
      const updatedClasses = prev.classes.map(c => c.id === updatedClass.id ? updatedClass : c);
      let updatedUsers = prev.users;
      
      if (oldClass.name !== updatedClass.name) {
        updatedUsers = prev.users.map(u => {
           let changed = false;
           let uData = { ...u };
           if (u.className === oldClass.name) {
             uData.className = updatedClass.name;
             changed = true;
           }
           if (u.assignedClassNames && u.assignedClassNames.includes(oldClass.name)) {
             uData.assignedClassNames = u.assignedClassNames.map(c => c === oldClass.name ? updatedClass.name : c);
             changed = true;
           }
           return uData;
        });
        saveGlobalUsersToFirestore(updatedUsers);
      }
      return {
        ...prev,
        classes: updatedClasses,
        users: updatedUsers
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Rehber Öğretmen'} sınıf tanımını güncelledi.`,
      'management',
      'update_class',
      () => {
        setGlobalState((prev) => ({ ...prev, classes: prevClasses, users: prevUsers }));
        saveGlobalUsersToFirestore(prevUsers);
        const oldClass = prevClasses.find(c => c.id === updatedClass.id);
        if (oldClass) {
            saveClassToFirestore(oldClass);
        }
      }
    );
  };

  const handleCreateStudentUser = (newStudent: Omit<UserAccount, 'id'>) => {
    const studentId = `student-${Date.now()}`;
    const createdStudent: UserAccount = {
      ...newStudent,
      avatarUrl: newStudent.avatarUrl || DEFAULT_AVATAR,
      status: 'active',
      id: studentId
    };
    saveUserToFirestore(createdStudent);

    const targetClass = globalState.classes.find(c => c.name === createdStudent.className);
    const initialDataForStudent: YKSDataState = createEmptyStudentData(createdStudent.name, createdStudent.className, targetClass?.field);
    saveStudentDataToFirestore(studentId, initialDataForStudent);

    setGlobalState((prev) => ({
      ...prev,
      users: [...prev.users, createdStudent],
      studentsData: {
        ...prev.studentsData,
        [studentId]: initialDataForStudent
      }
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'} "${createdStudent.name}" (${createdStudent.className || '12-A SAY'}) öğrencisini sisteme ekledi.`,
      'management',
      'create_student',
      () => {
        deleteUserFromFirestore(studentId);
        setGlobalState((prev) => {
          const newUsers = prev.users.filter(u => u.id !== studentId);
          const newStudentsData = { ...prev.studentsData };
          delete newStudentsData[studentId];
          return {
            ...prev,
            users: newUsers,
            studentsData: newStudentsData
          };
        });
      },
      studentId,
      createdStudent.name
    );
  };

  const handleSaveInstitutionalExams = (newExams: InstitutionalMockExam[]) => {
    saveBulkInstitutionalExamsToFirestore(newExams);
    setGlobalState((prev) => {
      const existingGlobal = prev.institutionalMockExams || [];
      const updatedGlobal = [...newExams, ...existingGlobal];

      const updatedStudentsData = { ...prev.studentsData };
      newExams.forEach((exam) => {
        if (exam.studentId) {
          const studentData = updatedStudentsData[exam.studentId] || createEmptyStudentData(exam.studentName, exam.className || '');
          const currentMocks = studentData.institutionalMocks || [];
          const updatedStudentMocks = [exam, ...currentMocks];
          
          const updatedData = {
            ...studentData,
            institutionalMocks: updatedStudentMocks
          };
          updatedStudentsData[exam.studentId] = updatedData;
          saveStudentDataToFirestore(exam.studentId, updatedData);
        }
      });

      return {
        ...prev,
        institutionalMockExams: updatedGlobal,
        studentsData: updatedStudentsData
      };
    });
  };

  const handleUpdateInstitutionalExam = (updatedExam: InstitutionalMockExam) => {
    saveInstitutionalExamToFirestore(updatedExam);
    setGlobalState((prev) => {
      const existingGlobal = prev.institutionalMockExams || [];
      const oldExam = existingGlobal.find(e => e.id === updatedExam.id);
      const updatedGlobal = existingGlobal.map(e => e.id === updatedExam.id ? updatedExam : e);

      const updatedStudentsData = { ...prev.studentsData };

      if (oldExam?.studentId && oldExam.studentId !== updatedExam.studentId) {
        const oldStudentData = updatedStudentsData[oldExam.studentId];
        if (oldStudentData && oldStudentData.institutionalMocks) {
          const filteredMocks = oldStudentData.institutionalMocks.filter(m => m.id !== updatedExam.id);
          updatedStudentsData[oldExam.studentId] = {
            ...oldStudentData,
            institutionalMocks: filteredMocks
          };
          saveStudentDataToFirestore(oldExam.studentId, updatedStudentsData[oldExam.studentId]);
        }
      }

      if (updatedExam.studentId) {
        const studentData = updatedStudentsData[updatedExam.studentId] || createEmptyStudentData(updatedExam.studentName, updatedExam.className || '');
        const currentMocks = studentData.institutionalMocks || [];
        const existsIndex = currentMocks.findIndex(m => m.id === updatedExam.id);
        let updatedMocks: InstitutionalMockExam[];
        if (existsIndex >= 0) {
          updatedMocks = [...currentMocks];
          updatedMocks[existsIndex] = updatedExam;
        } else {
          updatedMocks = [updatedExam, ...currentMocks];
        }
        updatedStudentsData[updatedExam.studentId] = {
          ...studentData,
          institutionalMocks: updatedMocks
        };
        saveStudentDataToFirestore(updatedExam.studentId, updatedStudentsData[updatedExam.studentId]);
      }

      return {
        ...prev,
        institutionalMockExams: updatedGlobal,
        studentsData: updatedStudentsData
      };
    });
  };

  const handleDeleteInstitutionalExam = async (examIdOrIds: string | string[]) => {
    const ids = Array.isArray(examIdOrIds) ? examIdOrIds : [examIdOrIds];
    if (ids.length === 0) return;

    for (const id of ids) {
      await deleteInstitutionalExamFromFirestore(id);
    }

    setGlobalState((prev) => {
      const existingGlobal = prev.institutionalMockExams || [];
      const updatedGlobal = existingGlobal.filter(e => !ids.includes(e.id));

      const updatedStudentsData = { ...prev.studentsData };
      const studentIdsToUpdate = new Set<string>();

      Object.entries(updatedStudentsData).forEach(([studentId, val]) => {
        const studentState = val as YKSDataState;
        if (studentState && studentState.institutionalMocks) {
          const hasExam = studentState.institutionalMocks.some(m => ids.includes(m.id));
          if (hasExam) {
            const filteredMocks = studentState.institutionalMocks.filter(m => !ids.includes(m.id));
            updatedStudentsData[studentId] = {
              ...studentState,
              institutionalMocks: filteredMocks
            };
            studentIdsToUpdate.add(studentId);
          }
        }
      });

      studentIdsToUpdate.forEach((studentId) => {
        saveStudentDataToFirestore(studentId, updatedStudentsData[studentId]);
      });

      return {
        ...prev,
        institutionalMockExams: updatedGlobal,
        studentsData: updatedStudentsData
      };
    });
  };

  const handleDeleteAllInstitutionalExams = async () => {
    try {
      localStorage.setItem('yks_exempt_auto_seed', 'true');
      await deleteAllInstitutionalExamsFromFirestore();

      setGlobalState((prev) => {
        const updatedStudentsData = { ...prev.studentsData };
        Object.keys(updatedStudentsData).forEach((studentId) => {
          if (updatedStudentsData[studentId]) {
            updatedStudentsData[studentId] = {
              ...updatedStudentsData[studentId],
              institutionalMocks: []
            };
          }
        });

        return {
          ...prev,
          institutionalMockExams: [],
          studentsData: updatedStudentsData
        };
      });

      addAuditAndUndo(
        `${currentUser?.name || 'Okul Rehber Öğretmeni'} veritabanındaki tüm kurumsal deneme karnelerini silerek baştan başladı.`,
        'management',
        'delete_all_exams',
        undefined,
        undefined
      );
    } catch (err) {
      console.error('Error clearing all institutional exams:', err);
    }
  };

  const handleDeleteStudentUser = (studentId: string) => {
    const targetStudent = globalState.users.find(u => u.id === studentId);
    deleteUserFromFirestore(studentId);
    setGlobalState((prev) => {
      const newUsers = prev.users.filter(u => u.id !== studentId);
      const newStudentsData = { ...prev.studentsData };
      delete newStudentsData[studentId];
      return {
        ...prev,
        users: newUsers,
        studentsData: newStudentsData
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Okul Rehber Öğretmeni'} "${targetStudent?.name || 'Öğrenci'}" öğrencisini ve tüm verilerini sistemden kalıcı olarak sildi.`,
      'management',
      'delete_student',
      undefined,
      studentId,
      targetStudent?.name
    );
  };

  const handleCreateTeacherUser = (newTeacher: Omit<UserAccount, 'id'>) => {
    const createdTeacher: UserAccount = {
      ...newTeacher,
      avatarUrl: newTeacher.avatarUrl || DEFAULT_AVATAR,
      status: 'active',
      id: `teacher-${Date.now()}`
    };
    saveUserToFirestore(createdTeacher);
    setGlobalState((prev) => {
      const updatedUsers = [...prev.users, createdTeacher];
      return {
        ...prev,
        users: updatedUsers
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Okul Rehberlik'} "${createdTeacher.name}" öğretmen hesabını ekledi.`,
      'management',
      'create_teacher',
      () => {
        handleDeleteTeacherUser(createdTeacher.id);
      }
    );
  };

  const handleUnlockUserAccount = async (userId: string) => {
    const targetUser = globalState.users.find(u => u.id === userId);
    try {
      const res = await fetch('/api/auth/unlock-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGlobalState((prev) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.id === userId
              ? { ...u, failedLoginAttempts: 0, lockoutUntil: null, isLocked: false }
              : u
          )
        }));
        addAuditAndUndo(
          `${currentUser?.name || 'Rehber Öğretmen'} "${targetUser?.name || 'Kullanıcı'}" kilitli hesabını yeniden aktif hale getirdi.`,
          'management',
          'unlock_user',
          undefined,
          userId,
          targetUser?.name
        );
      } else {
        alert(data.error || 'Hesap kilidi açılırken bir hata oluştu.');
      }
    } catch (err) {
      alert('Sunucuya bağlanılamadı.');
    }
  };

  const handleApproveStudent = (studentId: string) => {
    const studentUser = globalState.users.find(u => u.id === studentId);
    setGlobalState((prev) => {
      const updatedUsers = prev.users.map((u) => u.id === studentId ? { ...u, status: 'active' as const } : u);
      const approvedUser = updatedUsers.find((u) => u.id === studentId);
      if (approvedUser) {
        saveUserToFirestore(approvedUser);
      }
      return { ...prev, users: updatedUsers };
    });
    addAuditAndUndo(
      `${currentUser?.name || 'Rehber Öğretmen'} "${studentUser?.name || 'Öğrenci'}" kaydını onayladı.`,
      'management',
      'approve_student',
      () => {
        setGlobalState((prev) => ({
          ...prev,
          users: prev.users.map((u) => u.id === studentId ? { ...u, status: 'pending' as const } : u)
        }));
      },
      studentId,
      studentUser?.name
    );
  };

  const handleRejectStudent = (studentId: string) => {
    const studentUser = globalState.users.find(u => u.id === studentId);
    deleteUserFromFirestore(studentId);
    setGlobalState((prev) => {
      const updatedUsers = prev.users.filter((u) => u.id !== studentId);
      return { ...prev, users: updatedUsers };
    });
    addAuditAndUndo(
      `${currentUser?.name || 'Rehber Öğretmen'} "${studentUser?.name || 'Öğrenci'}" kaydını reddetti.`,
      'management',
      'reject_student',
      () => {
        if (studentUser) {
          saveUserToFirestore(studentUser);
          setGlobalState((prev) => ({ ...prev, users: [...prev.users, studentUser] }));
        }
      },
      studentId,
      studentUser?.name
    );
  };

  const handleDeleteTeacherUser = (teacherId: string) => {
    const teacherUser = globalState.users.find(u => u.id === teacherId);
    deleteUserFromFirestore(teacherId);
    setGlobalState((prev) => {
      const updatedUsers = prev.users.filter(u => u.id !== teacherId);
      return {
        ...prev,
        users: updatedUsers
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Okul Rehberlik'} "${teacherUser?.name || 'Öğretmen'}" hesabını çıkardı.`,
      'management',
      'delete_teacher',
      () => {
        if (teacherUser) {
          saveUserToFirestore(teacherUser);
          setGlobalState((prev) => ({ ...prev, users: [...prev.users, teacherUser] }));
        }
      }
    );
  };

  const handleUpdateProfile = (updatedUser: UserAccount, updatedStudentProfile?: StudentProfile) => {
    if (previewStudentUser) {
      setLastToast({
        id: 'toast-' + Date.now(),
        type: 'error',
        title: 'YETKİSİZ İŞLEM',
        message: 'Öğrenci önizleme modunda profil bilgileri düzenlenemez.'
      });
      return;
    }
    const prevUser = currentUser;
    const prevStudentProfile = currentStudentData?.profile;

    saveUserToFirestore(updatedUser);
    setGlobalState((prev) => {
      const updatedUsers = prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      saveGlobalUsersToFirestore(updatedUsers);
      return {
        ...prev,
        currentUser: prev.currentUser?.id === updatedUser.id ? updatedUser : prev.currentUser,
        users: updatedUsers
      };
    });

    if (updatedStudentProfile && currentUser) {
      updateCurrentStudentData((prev) => ({
        ...prev,
        profile: updatedStudentProfile
      }));
    }

    addAuditAndUndo(
      `${updatedUser.name} profil bilgilerini ve profil fotoğrafını güncelledi.`,
      'profile',
      'update_profile',
      () => {
        if (prevUser) {
          saveUserToFirestore(prevUser);
          setGlobalState((prev) => ({
            ...prev,
            currentUser: prev.currentUser?.id === prevUser.id ? prevUser : prev.currentUser,
            users: prev.users.map((u) => (u.id === prevUser.id ? prevUser : u))
          }));
        }
        if (prevStudentProfile) {
          updateCurrentStudentData((prev) => ({ ...prev, profile: prevStudentProfile }));
        }
      }
    );
  };

  const handleUpdateStudentProfile = (updatedStudentProfile: StudentProfile) => {
    if (currentUser) {
      updateCurrentStudentData((prev) => ({
        ...prev,
        profile: updatedStudentProfile
      }));
    }
  };

  const handleAddPlan = (plan: any) => {
    const newItem = { ...plan, id: 'plan-' + Date.now() };
    const prevPlans = currentStudentData.studyPlans || [];
    updateCurrentStudentData((prev) => ({ ...prev, studyPlans: [newItem, ...(prev.studyPlans || [])] }));
    
    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${plan.subject} - ${plan.topic}" çalışma görevini plana ekledi (${plan.plannedMinutes} dk).`,
      'study',
      'add_plan',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, studyPlans: prevPlans }));
      }
    );
  };

  const handleUpdatePlan = (plan: any) => {
    const prevPlans = currentStudentData.studyPlans || [];
    const prevVideos = currentStudentData.youtubeVideos || [];
    let updatedVideos = prevVideos;

    const oldPlan = prevPlans.find((p) => p.id === plan.id);
    const isNewlyCompleted = plan.status === 'completed' && oldPlan?.status !== 'completed';

    if (isNewlyCompleted) {
      updatedVideos = syncCompletedPlanToYoutubeVideos(plan, prevVideos);

      const todayStr = plan.date || new Date().toISOString().split('T')[0];
      const todayPlans = prevPlans.filter(p => (p.date || '').startsWith(todayStr) || (!p.date && p.day === plan.day));
      const willAllBeCompleted = todayPlans.length > 0 && todayPlans.every(p => p.id === plan.id || p.status === 'completed');

      if (willAllBeCompleted) {
        window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
          detail: {
            type: 'all_plans_completed'
          }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
          detail: {
            type: 'plan_completed',
            payload: {
              subject: plan.subject,
              minutes: plan.completedMinutes || plan.plannedMinutes || 45
            }
          }
        }));
      }
    } else if (plan.status === 'completed') {
      updatedVideos = syncCompletedPlanToYoutubeVideos(plan, prevVideos);
    }

    updateCurrentStudentData((prev) => ({
      ...prev,
      studyPlans: (prev.studyPlans || []).map((p) => (p.id === plan.id ? plan : p)),
      youtubeVideos: updatedVideos
    }));

    const isDayChanged = oldPlan && oldPlan.day !== plan.day;
    const auditText = isDayChanged
      ? `${currentUser?.name || 'Öğrenci'} "${plan.subject} - ${plan.topic}" görev gününü ${oldPlan.day} -> ${plan.day} olarak değiştirdi.`
      : `${currentUser?.name || 'Öğrenci'} "${plan.subject} - ${plan.topic}" görev durumunu güncelledi (${plan.status === 'completed' ? 'Tamamlandı' : 'Devam Ediyor'}).`;

    addAuditAndUndo(
      auditText,
      'study',
      'update_plan',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, studyPlans: prevPlans, youtubeVideos: prevVideos }));
      }
    );
  };

  const handleDeletePlan = (id: string) => {
    const prevPlans = currentStudentData.studyPlans || [];
    const planToDelete = prevPlans.find(p => p.id === id);
    updateCurrentStudentData((prev) => ({
      ...prev,
      studyPlans: (prev.studyPlans || []).filter((p) => p.id !== id)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${planToDelete?.subject || ''} ${planToDelete?.topic || ''}" görevini planından sildi.`,
      'study',
      'delete_plan',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, studyPlans: prevPlans }));
      }
    );
  };

  const handleUpdateAllPlans = (plans: any[], auditMessage?: string) => {
    const prevPlans = currentStudentData.studyPlans || [];
    const prevVideos = currentStudentData.youtubeVideos || [];
    let updatedVideos = prevVideos;

    plans.forEach(plan => {
      if (plan.status === 'completed') {
        updatedVideos = syncCompletedPlanToYoutubeVideos(plan, updatedVideos);
      }
    });

    updateCurrentStudentData((prev) => ({
      ...prev,
      studyPlans: plans,
      youtubeVideos: updatedVideos
    }));

    addAuditAndUndo(
      auditMessage || `${currentUser?.name || 'Öğrenci'} haftalık çalışma planını güncelledi.`,
      'study',
      'update_all_plans',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, studyPlans: prevPlans, youtubeVideos: prevVideos }));
      }
    );
  };

  const handleSaveDailyStudyLog = (dateKey: string, log: DailyStudyTimeLog | null) => {
    const prevLogs = currentStudentData.dailyStudyLogs || {};
    const updated = { ...prevLogs };
    if (!log || log.minutes <= 0) {
      delete updated[dateKey];
    } else {
      updated[dateKey] = log;
    }
    updateCurrentStudentData((prev) => ({
      ...prev,
      dailyStudyLogs: updated
    }));

    const formattedDuration = log && log.minutes > 0 
      ? `${Math.floor(log.minutes / 60)} sa ${log.minutes % 60} dk` 
      : 'temizlendi';

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} ${log?.date || dateKey} tarihi için günlük net çalışma süresini güncelledi (${formattedDuration}).`,
      'study',
      'update_daily_study_log',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, dailyStudyLogs: prevLogs }));
      }
    );
  };

  const handleAddQuestionLog = (log: any) => {
    const newItem = { ...log, id: 'qlog-' + Date.now() };
    const prevLogs = currentStudentData.questionLogs || [];
    updateCurrentStudentData((prev) => ({ ...prev, questionLogs: [newItem, ...(prev.questionLogs || [])] }));

    if (log.targetCount && log.solvedCount >= log.targetCount) {
      window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
        detail: {
          type: 'question_goal_reached',
          payload: {
            solved: log.solvedCount,
            correct: log.correctCount || log.solvedCount
          }
        }
      }));
    }

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} ${log.solvedCount} adet ${log.subject} sorusu çözdü (${log.netScore} Net).`,
      'study',
      'add_qlog',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, questionLogs: prevLogs }));
      }
    );
  };

  const handleDeleteQuestionLog = (id: string) => {
    const prevLogs = currentStudentData.questionLogs || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      questionLogs: (prev.questionLogs || []).filter((q) => q.id !== id)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} soru takibi kaydını sildi.`,
      'study',
      'delete_qlog',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, questionLogs: prevLogs }));
      }
    );
  };

  const handleUpdateQuestionLog = (updatedLog: any) => {
    const prevLogs = currentStudentData.questionLogs || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      questionLogs: (prev.questionLogs || []).map((q) => q.id === updatedLog.id ? updatedLog : q)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} soru takibi kaydını güncelledi.`,
      'study',
      'update_qlog',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, questionLogs: prevLogs }));
      }
    );
  };

  const handleAddResource = (res: any) => {
    const newItem = { ...res, id: 'res-' + Date.now() };
    const prevResources = currentStudentData.resources || [];
    updateCurrentStudentData((prev) => ({ ...prev, resources: [...(prev.resources || []), newItem] }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${res.bookTitle}" (${res.subject}) kaynağını takip listesine ekledi.`,
      'study',
      'add_resource',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, resources: prevResources }));
      }
    );
  };

  const handleUpdateResource = (res: any) => {
    const prevResources = currentStudentData.resources || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      resources: (prev.resources || []).map((r) => (r.id === res.id ? res : r))
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${res.bookTitle}" (${res.subject}) kaynağının durumunu güncelledi.`,
      'study',
      'update_resource',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, resources: prevResources }));
      }
    );
  };

  const handleDeleteResource = (id: string) => {
    const prevResources = currentStudentData.resources || [];
    const resToDelete = prevResources.find((r) => r.id === id);
    updateCurrentStudentData((prev) => ({
      ...prev,
      resources: (prev.resources || []).filter((r) => r.id !== id)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${resToDelete?.bookTitle || ''}" (${resToDelete?.subject || ''}) kaynağını takip listesinden sildi.`,
      'study',
      'delete_resource',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, resources: prevResources }));
      }
    );
  };

  const handleUpdateTopicStatus = (
    topicName: string, 
    status: 'Çalışmadım' | 'Erteledim' | 'Zor Geldi' | 'Çalıştım' | 'Uzmanlaştım',
    isManual: boolean = false
  ) => {
    if (status === 'Çalışmadım') {
      const isSolvedInAnyResource = (currentStudentData.resources || []).some(
        (b) => (b.completedTopics || []).includes(topicName)
      );
      if (isSolvedInAnyResource) {
        return;
      }
    }

    const prevStatuses = currentStudentData.topicStatuses || {};
    const prevManuals = currentStudentData.manuallyChangedTopicStatuses || [];

    updateCurrentStudentData((prev) => {
      const currentManuals = prev.manuallyChangedTopicStatuses || [];
      const updatedManuals = isManual 
        ? (currentManuals.includes(topicName) ? currentManuals : [...currentManuals, topicName])
        : currentManuals;
      return {
        ...prev,
        topicStatuses: {
          ...(prev.topicStatuses || {}),
          [topicName]: status
        },
        manuallyChangedTopicStatuses: updatedManuals
      };
    });

    if (status === 'Uzmanlaştım') {
      window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
        detail: {
          type: 'topic_mastered',
          payload: { topicName }
        }
      }));
    }

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${topicName}" konusunun çalışma durumunu "${status}" olarak güncelledi.`,
      'study',
      'update_topic_status',
      () => {
        updateCurrentStudentData((prev) => ({
          ...prev,
          topicStatuses: prevStatuses,
          manuallyChangedTopicStatuses: prevManuals
        }));
      }
    );
  };

  const handleUpdatePastExam = (pe: any) => {
    const prevExams = currentStudentData.pastExams || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      pastExams: prev.pastExams.map((p) => (p.id === pe.id ? pe : p))
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${pe.title}" çıkmış sınav analizini güncelledi.`,
      'exam',
      'update_past_exam',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, pastExams: prevExams }));
      }
    );
  };

  const handleToggleTopicCompleted = (topicKey: string) => {
    const prevList = currentStudentData.completedPastTopics || [];
    const isDoubleColon = topicKey.includes('::');
    const isSingleColon = !isDoubleColon && topicKey.includes(':');
    
    let altKey = '';
    if (isDoubleColon) {
      altKey = topicKey.replace('::', ':');
    } else if (isSingleColon) {
      altKey = topicKey.replace(':', '::');
    }

    const exists = prevList.includes(topicKey) || (altKey ? prevList.includes(altKey) : false);

    updateCurrentStudentData((prev) => {
      const currentList = prev.completedPastTopics || [];
      const updatedList = exists
        ? currentList.filter((k) => k !== topicKey && k !== altKey)
        : [...currentList.filter((k) => k !== topicKey && k !== altKey), topicKey];
      return {
        ...prev,
        completedPastTopics: updatedList
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} çıkmış sınav "${topicKey}" konusunu ${exists ? 'çalışılmadı' : 'tamamlandı'} olarak işaretledi.`,
      'study',
      'toggle_past_topic',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, completedPastTopics: prevList }));
      }
    );
  };

  const handleToggleFavoriteBook = (bookKey: string) => {
    const prevFavs = currentStudentData.favoriteBooks || [];
    const exists = prevFavs.includes(bookKey);
    const updatedFavs = exists
      ? prevFavs.filter((k) => k !== bookKey)
      : [...prevFavs, bookKey];
      
    updateCurrentStudentData((prev) => ({
      ...prev,
      favoriteBooks: updatedFavs
    }));

    addAuditAndUndo(
      exists 
        ? `Bir kitap favorilerden kaldırıldı.` 
        : `Bir kitap favorilere eklendi.`,
      'study',
      'toggle_favorite_book',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, favoriteBooks: prevFavs }));
      }
    );
  };

  const handleAddBranchExam = (exam: any) => {
    const newItem = { ...exam, id: 'be-' + Date.now() };
    const prevExams = currentStudentData.branchExams || [];
    updateCurrentStudentData((prev) => ({ ...prev, branchExams: [newItem, ...(prev.branchExams || [])] }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} yeni bir branş denemesi ekledi: ${exam.subject} (${exam.correct ?? exam.corrects ?? 0}D ${exam.wrong ?? exam.incorrects ?? 0}Y ${exam.net} Net).`,
      'exam',
      'add_branch_exam',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, branchExams: prevExams }));
      }
    );
  };

  const handleUpdateBranchExam = (updatedExam: any) => {
    const prevExams = currentStudentData.branchExams || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      branchExams: (prev.branchExams || []).map((e) => (e.id === updatedExam.id ? updatedExam : e))
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${updatedExam.subject}" branş denemesi kaydını güncelledi (${updatedExam.correct ?? updatedExam.corrects ?? 0}D ${updatedExam.wrong ?? updatedExam.incorrects ?? 0}Y ${updatedExam.net} Net).`,
      'exam',
      'update_branch_exam',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, branchExams: prevExams }));
      }
    );
  };

  const handleDeleteBranchExam = (id: string) => {
    const prevExams = currentStudentData.branchExams || [];
    const deletedExam = prevExams.find(e => e.id === id);
    updateCurrentStudentData((prev) => ({
      ...prev,
      branchExams: (prev.branchExams || []).filter((e) => e.id !== id)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${deletedExam?.subject || ''}" branş denemesi kaydını sildi.`,
      'exam',
      'delete_branch_exam',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, branchExams: prevExams }));
      }
    );
  };

  const handleAddSchoolExam = (exam: Omit<SchoolExam, 'id'>) => {
    const newItem: SchoolExam = { ...exam, id: 'se-' + Date.now() };
    const prevExams = currentStudentData.schoolExams || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      schoolExams: [newItem, ...(prev.schoolExams || [])]
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} yeni bir okul yazılı notu ekledi: ${exam.subject} (${exam.semester}. Dönem ${exam.examNumber}. Yazılı: ${exam.score} Puan).`,
      'exam',
      'add_school_exam',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, schoolExams: prevExams }));
      }
    );
  };

  const handleUpdateSchoolExam = (updatedExam: SchoolExam) => {
    const prevExams = currentStudentData.schoolExams || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      schoolExams: (prev.schoolExams || []).map((e) => (e.id === updatedExam.id ? updatedExam : e))
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${updatedExam.subject}" yazılı sınav notunu güncelledi (${updatedExam.score} Puan).`,
      'exam',
      'update_school_exam',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, schoolExams: prevExams }));
      }
    );
  };

  const handleDeleteSchoolExam = (id: string) => {
    const prevExams = currentStudentData.schoolExams || [];
    const deletedExam = prevExams.find((e) => e.id === id);
    updateCurrentStudentData((prev) => ({
      ...prev,
      schoolExams: (prev.schoolExams || []).filter((e) => e.id !== id)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${deletedExam?.subject || ''}" yazılı sınav kaydını sildi.`,
      'exam',
      'delete_school_exam',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, schoolExams: prevExams }));
      }
    );
  };

  const handleUpdateStudentSchoolExamsByTeacher = (studentId: string, updatedExams: SchoolExam[], actionDescription?: string) => {
    const targetStudent = globalState.users.find(u => u.id === studentId);
    const prevExams = globalState.studentsData[studentId]?.schoolExams || [];

    setGlobalState((prev) => {
      const studentData = prev.studentsData[studentId] || createEmptyStudentData(targetStudent?.name || '', targetStudent?.className || '');
      const updatedData: YKSDataState = {
        ...studentData,
        schoolExams: updatedExams
      };
      saveStudentDataToFirestore(studentId, updatedData);
      return {
        ...prev,
        studentsData: {
          ...prev.studentsData,
          [studentId]: updatedData
        }
      };
    });

    addAuditAndUndo(
      actionDescription || `${currentUser?.name || 'Öğretmen'}, ${targetStudent?.name || 'Öğrenci'} için okul yazılı sınav notlarını güncelledi.`,
      'exam',
      'teacher_update_school_exams',
      () => {
        handleUpdateStudentSchoolExamsByTeacher(studentId, prevExams);
      },
      studentId,
      targetStudent?.name
    );
  };

  const handleUpdateTopicTipsCache = (cacheKey: string, data: { mistakes: Array<{ mistake: string; correction: string }>; tips: string[] }) => {
    updateCurrentStudentData((prev) => ({
      ...prev,
      topicTipsCache: {
        ...(prev.topicTipsCache || {}),
        [cacheKey]: data
      }
    }));
  };

  const handleAddTopicError = (err: any) => {
    const todayStr = getTodayDateString();
    const intervals = getUserRepetitionIntervals();
    // 1. tekrar tarihi sisteme eklendiği tarihten (bugünden) itibaren 1. aralık kadar gün sonrasıdır (örn: 1 gün sonra / yarın)
    const nextReviewDate = err.nextReviewDate || (err.imageUrl ? calculateNextReviewDate(todayStr, err.repetitionStage ?? 0, intervals) : undefined);
    const newItem = { 
      ...err, 
      id: err.id || ('err-' + Date.now()),
      date: err.date || todayStr,
      repetitionStage: err.repetitionStage ?? 0,
      nextReviewDate
    };
    const prevErrors = currentStudentData.topicErrors || [];
    updateCurrentStudentData((prev) => ({ ...prev, topicErrors: [newItem, ...(prev.topicErrors || [])] }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} hata defterine yeni bir soru ekledi: ${err.subject} - ${err.topicName || err.topic || 'Belirtilmedi'} (${err.sourceBook || 'Kaynak Belirtilmedi'}).`,
      'exam',
      'add_topic_error',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, topicErrors: prevErrors }));
      }
    );
  };

  const handleUpdateTopicError = (err: any) => {
    const prevErrors = currentStudentData.topicErrors || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      topicErrors: (prev.topicErrors || []).map((e) => (e.id === err.id ? err : e))
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} hata defterindeki "${err.topicName || err.topic || 'Belirtilmedi'}" konusuna ait soruyu güncelledi.`,
      'exam',
      'update_topic_error',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, topicErrors: prevErrors }));
      }
    );
  };

  const handleDeleteTopicError = (id: string) => {
    const prevErrors = currentStudentData.topicErrors || [];
    const deletedError = prevErrors.find(e => e.id === id);
    if (deletedError?.imageUrl) {
      deleteStorageFile(deletedError.imageUrl);
    }
    updateCurrentStudentData((prev) => ({
      ...prev,
      topicErrors: (prev.topicErrors || []).filter((e) => e.id !== id)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} hata defterinden "${deletedError?.topicName || ''}" konusuna ait soruyu sildi.`,
      'exam',
      'delete_topic_error',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, topicErrors: prevErrors }));
      }
    );
  };

  const handleAddGeneralMock = (mock: any) => {
    const newItem = { ...mock, id: 'gm-' + Date.now() };
    const prevMocks = currentStudentData.generalMocks || [];
    updateCurrentStudentData((prev) => ({ ...prev, generalMocks: [...(prev.generalMocks || []), newItem] }));

    const examTypeStr = mock.examType === 'DIL' ? 'DİL' : mock.examType === 'TYT_DIL' ? 'TYT + DİL' : mock.examType === 'AYT' ? 'AYT' : mock.examType === 'TYT_AYT' ? 'TYT + AYT' : 'TYT';
    const netDetailsStr = [
      mock.tyt?.totalNet ? `TYT: ${mock.tyt.totalNet}` : null,
      mock.ayt?.totalNet ? `AYT: ${mock.ayt.totalNet}` : null,
      mock.ydt?.net !== undefined ? `YDT: ${mock.ydt.net}` : null
    ].filter(Boolean).join(', ');

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} yeni bir genel deneme ekledi: "${mock.title}" (${examTypeStr}${netDetailsStr ? ` - ${netDetailsStr}` : ''}).`,
      'exam',
      'add_general_mock',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, generalMocks: prevMocks }));
      }
    );
  };

  const handleDeleteGeneralMock = (id: string) => {
    const prevMocks = currentStudentData.generalMocks || [];
    const deletedMock = prevMocks.find(m => m.id === id);
    updateCurrentStudentData((prev) => ({
      ...prev,
      generalMocks: (prev.generalMocks || []).filter((m) => m.id !== id)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${deletedMock?.title || ''}" genel deneme sonucunu sildi.`,
      'exam',
      'delete_general_mock',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, generalMocks: prevMocks }));
      }
    );
  };

  const handleUpdateGeneralMock = (updated: any) => {
    const prevMocks = currentStudentData.generalMocks || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      generalMocks: (prev.generalMocks || []).map((m) => (m.id === updated.id ? updated : m))
    }));

    const examTypeStr = updated.examType === 'DIL' ? 'DİL' : updated.examType === 'TYT_DIL' ? 'TYT + DİL' : updated.examType === 'AYT' ? 'AYT' : updated.examType === 'TYT_AYT' ? 'TYT + AYT' : 'TYT';
    const netDetailsStr = [
      updated.tyt?.totalNet ? `TYT: ${updated.tyt.totalNet}` : null,
      updated.ayt?.totalNet ? `AYT: ${updated.ayt.totalNet}` : null,
      updated.ydt?.net !== undefined ? `YDT: ${updated.ydt.net}` : null
    ].filter(Boolean).join(', ');

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${updated.title}" genel deneme sonucunu güncelledi (${examTypeStr}${netDetailsStr ? ` - ${netDetailsStr}` : ''}).`,
      'exam',
      'update_general_mock',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, generalMocks: prevMocks }));
      }
    );
  };

  const handleAddYouTubeVideo = (vid: any) => {
    const newItem = { ...vid, id: 'yt-' + Date.now(), createdAt: vid.createdAt || new Date().toISOString() };
    const prevVideos = currentStudentData.youtubeVideos || [];
    updateCurrentStudentData((prev) => ({ ...prev, youtubeVideos: [...(prev.youtubeVideos || []), newItem] }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${vid.channelName} - ${vid.topicName || ''}" (${vid.subject}) ders videosunu takip listesine ekledi.`,
      'study',
      'add_youtube_video',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, youtubeVideos: prevVideos }));
      }
    );
  };

  const handleUpdateYouTubeVideo = (vid: any) => {
    const prevVideos = currentStudentData.youtubeVideos || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      youtubeVideos: (prev.youtubeVideos || []).map((v) => (v.id === vid.id ? vid : v))
    }));

    const statusText = vid.isWatched ? 'Tamamlandı' : 'İzleniyor';

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${vid.channelName} - ${vid.topicName || ''}" (${vid.subject}) videosunun durumunu güncelledi (${statusText}).`,
      'study',
      'update_youtube_video',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, youtubeVideos: prevVideos }));
      }
    );
  };

  const handleDeleteYouTubeVideo = (id: string) => {
    const prevVideos = currentStudentData.youtubeVideos || [];
    const vidToDelete = prevVideos.find((v) => v.id === id);
    updateCurrentStudentData((prev) => ({
      ...prev,
      youtubeVideos: (prev.youtubeVideos || []).filter((v) => v.id !== id)
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${vidToDelete?.channelName || ''} - ${vidToDelete?.topicName || ''}" (${vidToDelete?.subject || ''}) videosunu takip listesinden çıkardı.`,
      'study',
      'delete_youtube_video',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, youtubeVideos: prevVideos }));
      }
    );
  };

  const handleUpdateRoutines = (updatedRoutines: any[], actionText?: string) => {
    const prevRoutines = currentStudentData.routines || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      routines: updatedRoutines
    }));

    if (actionText) {
      addAuditAndUndo(
        actionText,
        'study',
        'update_routine',
        () => {
          updateCurrentStudentData((prev) => ({ ...prev, routines: prevRoutines }));
        }
      );
    }
  };

  const handleUpdateQuickNotes = (updatedNotes: any[], actionText?: string) => {
    const prevNotes = currentStudentData.quickNotes || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      quickNotes: updatedNotes
    }));

    if (actionText) {
      addAuditAndUndo(
        actionText,
        'study',
        'update_quick_notes',
        () => {
          updateCurrentStudentData((prev) => ({ ...prev, quickNotes: prevNotes }));
        }
      );
    }
  };

  const handleUpdateTaskTypes = (updatedTaskTypes: string[], actionText?: string) => {
    const prevTaskTypes = currentStudentData.taskTypes || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      taskTypes: updatedTaskTypes
    }));

    if (actionText) {
      addAuditAndUndo(
        actionText,
        'study',
        'update_task_types',
        () => {
          updateCurrentStudentData((prev) => ({ ...prev, taskTypes: prevTaskTypes }));
        }
      );
    }
  };

  const handleSaveAICoachAdvice = (advice: any) => {
    const adviceWithId = {
      ...advice,
      id: advice.id || 'adv-' + Date.now()
    };
    updateCurrentStudentData((prev) => ({
      ...prev,
      coachAdvices: [...(prev.coachAdvices || []), adviceWithId]
    }));
  };

  const handleDeleteAICoachAdvice = (idOrTimestamp: string) => {
    const prevAdvices = currentStudentData.coachAdvices || [];
    updateCurrentStudentData((prev) => ({
      ...prev,
      coachAdvices: (prev.coachAdvices || []).filter((a) => {
        if (a.id) return a.id !== idOrTimestamp;
        return a.timestamp !== idOrTimestamp;
      })
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} bir yapay zeka koç raporunu sildi.`,
      'study',
      'delete_ai_coach_advice',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, coachAdvices: prevAdvices }));
      }
    );
  };

  const handleSaveClassAICoachAdvice = (className: string, advice: ClassAICoachAdvice) => {
    const adviceWithId: ClassAICoachAdvice = {
      ...advice,
      id: advice.id || 'class-adv-' + Date.now(),
      className: className,
      createdByName: currentUser?.name || advice.createdByName || 'Rehber Öğretmen',
      createdByRole: currentUser?.title || (currentUser?.role === 'school_counselor' ? 'Okul Rehber Öğretmeni' : 'Sınıf Rehber Öğretmeni'),
      createdById: currentUser?.id || advice.createdById
    };

    setGlobalState((prev) => {
      let updatedClasses = [...prev.classes];
      const targetClass = updatedClasses.find(c => c.name === className);

      if (targetClass) {
        const updatedClass = {
          ...targetClass,
          classCoachAdvices: [...(targetClass.classCoachAdvices || []), adviceWithId]
        };
        saveClassToFirestore(updatedClass);
        updatedClasses = updatedClasses.map(c => c.id === targetClass.id ? updatedClass : c);
      } else {
        const newClass: ClassDefinition = {
          id: 'class-' + Date.now(),
          name: className,
          assignedTeacherIds: currentUser ? [currentUser.id] : [],
          classCoachAdvices: [adviceWithId]
        };
        saveClassToFirestore(newClass);
        updatedClasses.push(newClass);
      }

      return {
        ...prev,
        classes: updatedClasses
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'} "${className}" sınıfı için Yapay Zeka Koçluk Analiz Raporu oluşturdu ve kaydetti.`,
      'system',
      'AI_COACH_CLASS_ANALYSIS'
    );
  };

  const handleDeleteClassAICoachAdvice = (className: string, idOrTimestamp: string) => {
    setGlobalState((prev) => {
      const targetClass = prev.classes.find(c => c.name === className);
      if (!targetClass || !targetClass.classCoachAdvices) return prev;

      const updatedAdvices = targetClass.classCoachAdvices.filter(a => {
        if (a.id) return a.id !== idOrTimestamp;
        return a.timestamp !== idOrTimestamp;
      });

      const updatedClass = {
        ...targetClass,
        classCoachAdvices: updatedAdvices
      };
      saveClassToFirestore(updatedClass);

      return {
        ...prev,
        classes: prev.classes.map(c => c.id === targetClass.id ? updatedClass : c)
      };
    });

    addAuditAndUndo(
      `${currentUser?.name || 'Öğretmen'} "${className}" sınıfına ait bir yapay zeka koç raporunu sildi.`,
      'system',
      'DELETE_CLASS_AI_COACH_ADVICE'
    );
  };

  const handleSendMessage = (receiverId: string, content: string, attachmentUrl?: string, replyTo?: DirectMessage['replyTo']) => {
    if (!currentUser) return;
    if (previewStudentUser) {
      setLastToast({
        id: 'toast-' + Date.now(),
        type: 'error',
        title: 'GİZLİLİK KORUMASI',
        message: 'Öğrenci önizleme modunda mesaj gönderilemez.'
      });
      return;
    }
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day} ${hours}:${minutes}`;

    const createAndDispatchMsg = (recId: string, recName: string, recRole: string, recAvatar?: string) => {
      const msg: DirectMessage = {
        id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 10000000),
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        ...(currentUser.avatarUrl ? { senderAvatar: currentUser.avatarUrl } : {}),
        receiverId: recId,
        receiverName: recName,
        receiverRole: recRole as any,
        ...(recAvatar ? { receiverAvatar: recAvatar } : {}),
        content,
        timestamp,
        timestampMs: now.getTime(),
        isRead: false,
        isDelivered: true,
        ...(attachmentUrl ? { attachmentUrl } : {}),
        ...(replyTo ? { replyTo } : {})
      };

      setGlobalState(prev => ({
        ...prev,
        messages: [...(prev.messages || []).filter(m => m.id !== msg.id), msg]
      }));
      saveMessageToFirestore(msg);
      return msg;
    };

    if (receiverId === 'broadcast-all') {
      createAndDispatchMsg('broadcast-all', 'Tüm Kayıtlı Kullanıcılar (Toplu Duyuru)', 'all');
      const activeTargets = globalState.users.filter(u => u.id !== currentUser.id && u.status !== 'pending' && u.status !== 'rejected');
      addAuditAndUndo(
        `Tüm kayıtlı kullanıcılara (${activeTargets.length} kişi) toplu duyuru gönderildi`,
        'social',
        'send_message',
        undefined,
        'broadcast-all',
        'Tüm Kayıtlı Kullanıcılar'
      );
      return;
    }

    if (receiverId === 'broadcast-students') {
      createAndDispatchMsg('broadcast-students', 'Tüm Öğrenciler', 'student');
      const activeStudents = globalState.users.filter(u => u.id !== currentUser.id && u.role === 'student' && u.status !== 'pending' && u.status !== 'rejected');
      addAuditAndUndo(`Tüm öğrencilere (${activeStudents.length} kişi) toplu mesaj gönderildi`, 'social', 'send_message', undefined, 'broadcast-students', 'Tüm Öğrenciler');
      return;
    }

    if (receiverId === 'broadcast-teachers') {
      createAndDispatchMsg('broadcast-teachers', 'Tüm Öğretmenler', 'teacher');
      const activeTeachers = globalState.users.filter(u => u.id !== currentUser.id && (u.role === 'teacher' || u.role === 'class_teacher') && u.status !== 'pending' && u.status !== 'rejected');
      addAuditAndUndo(`Tüm öğretmenlere (${activeTeachers.length} kişi) toplu mesaj gönderildi`, 'social', 'send_message', undefined, 'broadcast-teachers', 'Tüm Öğretmenler');
      return;
    }

    if (receiverId === 'broadcast-counselors') {
      createAndDispatchMsg('broadcast-counselors', 'Tüm Rehber Öğretmenler', 'school_counselor');
      const activeCounselors = globalState.users.filter(u => u.id !== currentUser.id && u.role === 'school_counselor' && u.status !== 'pending' && u.status !== 'rejected');
      addAuditAndUndo(`Tüm rehber öğretmenlere (${activeCounselors.length} kişi) toplu mesaj gönderildi`, 'social', 'send_message', undefined, 'broadcast-counselors', 'Tüm Rehber Öğretmenler');
      return;
    }

    let receiver: any = null;
    if (receiverId?.startsWith('class-group-')) {
      const classId = receiverId.replace('class-group-', '');
      const classDef = globalState.classes.find(c => c.id === classId);
      if (classDef) {
        receiver = {
          id: receiverId,
          name: `${classDef.name} Sınıf Grubu`,
          role: 'student'
        };
      }
    } else {
      receiver = globalState.users.find(u => u.id === receiverId);
    }

    if (!receiver) return;

    createAndDispatchMsg(receiver.id, receiver.name, receiver.role, receiver.avatarUrl);
    addAuditAndUndo(
      `${receiver.name} kullanıcısına mesaj gönderildi`,
      'social',
      'send_message',
      undefined,
      receiver.id,
      receiver.name
    );
  };

  const getMessageTimestampMs = (msg: DirectMessage | null | undefined): number => {
    if (!msg) return 0;
    if (typeof msg.timestampMs === 'number' && !isNaN(msg.timestampMs) && msg.timestampMs > 0) {
      return msg.timestampMs;
    }
    if (msg.id && typeof msg.id === 'string' && msg.id.startsWith('msg-')) {
      const parts = msg.id.split('-');
      const parsed = Number(parts[1]);
      if (!isNaN(parsed) && parsed > 1000000000000) {
        return parsed;
      }
    }
    if (msg.timestamp) {
      const formatted = msg.timestamp.includes('T') ? msg.timestamp : msg.timestamp.replace(' ', 'T');
      const parsed = new Date(formatted).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 0;
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!currentUser) return;
    const msgToDelete = (globalState.messages || []).find(m => m.id === messageId);
    if (!msgToDelete) return;

    const msgTimeMs = getMessageTimestampMs(msgToDelete);
    if (msgTimeMs > 0) {
      const elapsed = Date.now() - msgTimeMs;
      if (elapsed > 60000) {
        return;
      }
    }

    if (msgToDelete.attachmentUrl) {
      deleteStorageFile(msgToDelete.attachmentUrl);
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestampStr = `${year}-${month}-${day} ${hours}:${minutes}`;

    const originalContentText = msgToDelete.originalContent || msgToDelete.content;

    const updatedMsg: DirectMessage = {
      ...msgToDelete,
      isDeleted: true,
      content: 'Bu mesaj kullanıcı tarafından silindi',
      originalContent: originalContentText,
      attachmentUrl: undefined,
      replyTo: undefined,
      deletedAt: timestampStr,
      timestampMs: msgTimeMs || Date.now()
    };

    setGlobalState(prev => ({
      ...prev,
      messages: (prev.messages || []).map(m => m.id === messageId ? updatedMsg : m)
    }));
    saveMessageToFirestore(updatedMsg);

    addAuditAndUndo(
      `"${msgToDelete.receiverName}" kullanıcısına gönderilen mesaj 1dk içinde silindi. (Silinmeden önceki içerik: "${originalContentText}")`,
      'social',
      'MESAJ_SILINDI',
      undefined,
      msgToDelete.receiverId,
      msgToDelete.receiverName,
      {
        messageId: msgToDelete.id,
        originalContent: originalContentText,
        deletedAt: timestampStr,
        receiverId: msgToDelete.receiverId,
        receiverName: msgToDelete.receiverName,
        senderId: msgToDelete.senderId,
        senderName: msgToDelete.senderName
      }
    );
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!currentUser) return;
    const msgToEdit = (globalState.messages || []).find(m => m.id === messageId);
    if (!msgToEdit) return;

    const msgTimeMs = getMessageTimestampMs(msgToEdit);
    if (msgTimeMs > 0) {
      const elapsed = Date.now() - msgTimeMs;
      if (elapsed > 60000) {
        return;
      }
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeOnly = `${hours}:${minutes}`;

    const oldContentText = msgToEdit.content;

    const updatedMsg: DirectMessage = {
      ...msgToEdit,
      content: newContent,
      isEdited: true,
      editedAt: timeOnly
    };

    setGlobalState(prev => ({
      ...prev,
      messages: (prev.messages || []).map(m => m.id === messageId ? updatedMsg : m)
    }));
    saveMessageToFirestore(updatedMsg);

    addAuditAndUndo(
      `"${msgToEdit.receiverName}" kullanıcısına gönderilen mesaj düzenlendi. (Eski içerik: "${oldContentText}", Yeni içerik: "${newContent}")`,
      'social',
      'MESAJ_DUZENLENDI',
      undefined,
      msgToEdit.receiverId,
      msgToEdit.receiverName,
      {
        messageId: msgToEdit.id,
        oldContent: oldContentText,
        newContent,
        receiverId: msgToEdit.receiverId,
        receiverName: msgToEdit.receiverName
      }
    );
  };

  const handleMarkAsRead = (messageIds: string[]) => {
    if (!messageIds || messageIds.length === 0 || !currentUser) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const readAt = `${year}-${month}-${day} ${hours}:${minutes}`;

    setGlobalState(prev => ({
      ...prev,
      messages: (prev.messages || []).map(m => {
        if (messageIds.includes(m.id)) {
          const newReadBy = [...(m.readBy || [])];
          if (!newReadBy.some(r => r.userId === currentUser.id)) {
            newReadBy.push({ userId: currentUser.id, readAt });
          }
          return { ...m, isRead: true, isDelivered: true, readAt: m.readAt || readAt, readBy: newReadBy };
        }
        return m;
      })
    }));
    markMessagesAsReadInFirestore(messageIds, currentUser.id, readAt);
  };

  const handleCompleteOnboarding = (
    updatedProfile: Partial<StudentProfile>,
    newResources: ResourceItem[],
    newRoutines: RoutineItem[]
  ) => {
    if (!currentUser) return;

    const currentData = currentStudentData || createEmptyStudentData(currentUser.name, currentUser.className);
    const nextProfile = {
      ...currentData.profile,
      ...updatedProfile
    };
    const nextResources = newResources.length > 0 ? [...(currentData.resources || []), ...newResources] : currentData.resources;
    const nextRoutines = newRoutines.length > 0 ? newRoutines : currentData.routines;

    const updatedStudentData: YKSDataState = {
      ...currentData,
      profile: nextProfile,
      resources: nextResources,
      routines: nextRoutines
    };

    const updatedUser: UserAccount = {
      ...currentUser,
      hasCompletedOnboarding: true
    };

    saveStudentDataToFirestore(currentUser.id, updatedStudentData);
    saveUserToFirestore(updatedUser);

    setGlobalState((prev) => ({
      ...prev,
      currentUser: updatedUser,
      users: (prev.users || []).map((u) => u.id === currentUser.id ? updatedUser : u),
      studentsData: {
        ...prev.studentsData,
        [currentUser.id]: updatedStudentData
      }
    }));

    localStorage.setItem(`yks_onboarding_done_${currentUser.id}`, 'true');
    setShowOnboardingWizard(false);

    setMotivationToast({
      id: `onboard-${Date.now()}`,
      type: 'general',
      title: '🚀 YKS Kurulumu Tamamlandı!',
      message: 'Hedeflerin, kaynakların ve rutinlerin başarıyla hazırlandı. İyi çalışmalar!',
      variant: 'emerald',
      timestamp: Date.now()
    });
  };

  const unreadMessageCount = currentUser ? (globalState.messages || []).filter(m => isMessageUnreadForUser(m, currentUser, globalState.classes)).length : 0;

  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'class_teacher' || currentUser?.role === 'school_counselor';
  const isTeacherAllowed = isTeacher && maintenanceAllowTeachers;
  const isAllowedToAccess = isAdmin || isTeacherAllowed;

  // IF MAINTENANCE MODE IS ACTIVE AND USER NOT LOGGED IN OR NOT ALLOWED -> RENDER MAINTENANCE VIEW
  if (maintenanceMode && (!currentUser || !isAllowedToAccess)) {
    return (
      <MaintenanceView
        currentUser={currentUser}
        onLogout={handleLogout}
        onAdminLogin={handleLoginSuccess}
        users={globalState.users}
        schoolName={currentSchoolName}
        maintenanceMessage={maintenanceMessage}
        maintenanceEndTime={maintenanceEndTime}
        maintenanceAllowTeachers={maintenanceAllowTeachers}
      />
    );
  }

  // IF NOT LOGGED IN -> RENDER LOGIN VIEW
  if (!currentUser) {
    return (
      <LoginView
        users={globalState.users}
        classes={globalState.classes}
        onLoginSuccess={handleLoginSuccess}
        onCreateAccount={handleCreateAccount}
        onUpdateAccount={handleUpdateStudentAccount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // IF LOGGED IN -> MAIN APPLICATION VIEW
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Top Warning Banner for Admin and Teachers during Maintenance Mode */}
      {maintenanceMode && (
        <div className={`text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between shadow-lg sticky top-0 z-50 animate-pulse ${
          isAdmin 
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500' 
            : 'bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-black">🚧</span>
            <span>
              {isAdmin 
                ? 'DİKKAT: Sistem şu anda BAKIM MODUNDA! Öğrenciler bakım ekranını görmektedir.' 
                : 'BİLGİ: Sistem şu anda BAKIM MODUNDA. (Öğretmen erişim izni açık)'}
            </span>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('teacher_system')}
              className="bg-slate-950 text-amber-400 hover:text-white px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-md"
            >
              Bakım Modu Ayarlarını Aç
            </button>
          )}
        </div>
      )}

      {currentUser.mustChangePassword && (
        <MandatoryPasswordChangeModal
          currentUser={currentUser}
          onPasswordChanged={(updatedUser) => {
            handleUpdateStudentAccount(updatedUser);
          }}
        />
      )}
      {/* Ambient Glows */}
      <div className="fixed -top-40 -right-40 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -left-40 w-64 h-64 sm:w-96 sm:h-96 bg-fuchsia-500/15 rounded-full blur-[90px] sm:blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 right-1/4 w-72 h-72 sm:w-[30rem] sm:h-[30rem] bg-indigo-600/15 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none z-0" />

      {/* Student View (Impersonation / Read-only Preview) Top Banner */}
      {previewStudentUser && (
        <StudentPreviewBanner
          student={previewStudentUser}
          onExitPreview={handleExitStudentPreview}
        />
      )}

      {/* Top Navbar */}
      {!isZenMode && (
        <Navbar
          currentUser={currentUser}
          previewStudentUser={previewStudentUser}
          profile={currentStudentData.profile}
          sheetsStatus={currentStudentData.sheetsStatus}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenSheetsModal={() => {}}
          onExportJSON={() => exportDataAsJSON(globalState)}
          onResetData={() => {
            if (confirm('Tüm verileri varsayılan fabrika ayarlarına sıfırlamak istediğinize emin misiniz?')) {
              const defaultData = resetToDefaultData();
              setGlobalState(defaultData);
              seedInitialFirestoreData();
            }
          }}
          onLogout={handleLogout}
          onUndo={handleUndo}
          canUndo={canUndoForNavbar}
          undoCount={canUndoForNavbar ? undoStack.length : 0}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          unreadMessageCount={unreadMessageCount}
          onOpenMessages={() => setActiveTab('messages')}
          onOpenSmartAddModal={() => setIsSmartAddModalOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          alwaysShowMenuButton={activeTab === 'bulk_exam_import' || activeTab === 'teacher_system'}
          routines={currentStudentData.routines}
          studyPlans={currentStudentData.studyPlans}
          topicErrors={currentStudentData.topicErrors}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* Toast and Banners */}
      <AppToastBanner
        isZenMode={isZenMode}
        isQuotaExceeded={isQuotaExceeded}
        setIsQuotaExceeded={setIsQuotaExceeded}
        lastToast={lastToast}
        setLastToast={setLastToast}
        activeTab={activeTab}
        isFullscreen={isFullscreen}
        isVirtualFullscreen={isVirtualFullscreen}
        handleToggleFullscreen={handleToggleFullscreen}
        showPwaGuide={showPwaGuide}
        setShowPwaGuide={setShowPwaGuide}
        currentSchoolName={currentSchoolName}
      />

      {/* Main Container */}
      <div className={`flex-1 ${activeTab === 'bulk_exam_import' || activeTab === 'teacher_system' ? 'w-full max-w-none px-2 sm:px-4' : 'max-w-7xl w-full mx-auto'} flex flex-col md:flex-row relative`}>
        
        {/* Navigation Sidebar */}
        {!isZenMode && (
          <Sidebar
            currentUser={currentUser}
            previewStudentUser={previewStudentUser}
            activeTab={activeTab}
            onSelectTab={handleTabChange}
            unresolvedErrorCount={unresolvedErrorCount}
            unreadMessageCount={unreadMessageCount}
            onLogout={handleLogout}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            isMobileOrTablet={isMobileOrTablet}
            onAddToHomeScreen={handleAddToHomeScreen}
            isHideDesktopSidebar={activeTab === 'bulk_exam_import' || activeTab === 'teacher_system'}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 sm:pb-24 md:pb-8 overflow-y-auto">
          <AppTabRouter
            activeTab={activeTab}
            currentUser={currentUser}
            previewStudentUser={previewStudentUser}
            onPreviewStudent={handleStartStudentPreview}
            globalState={globalState}
            currentStudentData={currentStudentData}
            resourceTrackerTab={resourceTrackerTab}
            resourceTrackerDers={resourceTrackerDers}
            isZenMode={isZenMode}
            setIsZenMode={setIsZenMode}
            theme={theme}
            undoStack={undoStack}
            handleUndo={handleUndo}
            clearAllAuditLogsInFirestore={clearAllAuditLogsInFirestore}
            setGlobalState={setGlobalState}
            handleSendMessage={handleSendMessage}
            handleSaveInstitutionalExams={handleSaveInstitutionalExams}
            handleUpdateInstitutionalExam={handleUpdateInstitutionalExam}
            handleDeleteInstitutionalExam={handleDeleteInstitutionalExam}
            handleDeleteAllInstitutionalExams={handleDeleteAllInstitutionalExams}
            addAuditAndUndo={addAuditAndUndo}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            handleUpdateStudentProfileByTeacher={handleUpdateStudentProfileByTeacher}
            handleUpdateStudentStudyPlansByTeacher={handleUpdateStudentStudyPlansByTeacher}
            handleUpdateStudentTopicErrorsByTeacher={handleUpdateStudentTopicErrorsByTeacher}
            handleUpdateStudentSchoolExamsByTeacher={handleUpdateStudentSchoolExamsByTeacher}
            handleCreateClass={handleCreateClass}
            handleAssignStudentClass={handleAssignStudentClass}
            handleSaveProgramTemplate={handleSaveProgramTemplate}
            handleUpdateProgramTemplate={handleUpdateProgramTemplate}
            handleDeleteProgramTemplate={handleDeleteProgramTemplate}
            handleApplyTemplateToStudent={handleApplyTemplateToStudent}
            handleApplyTemplateToClass={handleApplyTemplateToClass}
            handleUpdateTeacherAssignedClasses={handleUpdateTeacherAssignedClasses}
            handleUpdateTeacherAccount={handleUpdateTeacherAccount}
            handleDeleteClassDefinition={handleDeleteClassDefinition}
            handleUpdateClassDefinition={handleUpdateClassDefinition}
            handleCreateTeacherUser={handleCreateTeacherUser}
            handleDeleteTeacherUser={handleDeleteTeacherUser}
            handleCreateStudentUser={handleCreateStudentUser}
            handleUpdateStudentAccount={handleUpdateStudentAccount}
            handleDeleteStudentUser={handleDeleteStudentUser}
            handleApproveStudent={handleApproveStudent}
            handleRejectStudent={handleRejectStudent}
            handleUpdateStudentSubjectNotesByTeacher={handleUpdateStudentSubjectNotesByTeacher}
            handleUnlockUserAccount={handleUnlockUserAccount}
            setActiveTab={setActiveTab}
            setShowProfileModal={setShowProfileModal}
            handleUpdateRoutines={handleUpdateRoutines}
            handleUpdateStudentProfile={handleUpdateStudentProfile}
            handleUpdateSubjectNotes={handleUpdateSubjectNotes}
            handleUpdateDashboardWidgets={handleUpdateDashboardWidgets}
            handleUpdateQuickNotes={handleUpdateQuickNotes}
            handleUpdateTopicStatus={handleUpdateTopicStatus}
            handleNavigateTab={handleNavigateTab}
            handleAddPlan={handleAddPlan}
            handleUpdatePlan={handleUpdatePlan}
            handleDeletePlan={handleDeletePlan}
            handleAddQuestionLog={handleAddQuestionLog}
            handleDeleteQuestionLog={handleDeleteQuestionLog}
            handleUpdateAllPlans={handleUpdateAllPlans}
            handleSaveDailyStudyLog={handleSaveDailyStudyLog}
            handleUpdateTaskTypes={handleUpdateTaskTypes}
            handleUpdateQuestionLog={handleUpdateQuestionLog}
            handleAddResource={handleAddResource}
            handleUpdateResource={handleUpdateResource}
            handleDeleteResource={handleDeleteResource}
            handleUpdatePastExam={handleUpdatePastExam}
            handleToggleTopicCompleted={handleToggleTopicCompleted}
            handleAddBranchExam={handleAddBranchExam}
            handleUpdateBranchExam={handleUpdateBranchExam}
            handleDeleteBranchExam={handleDeleteBranchExam}
            handleAddTopicError={handleAddTopicError}
            handleUpdateTopicError={handleUpdateTopicError}
            handleDeleteTopicError={handleDeleteTopicError}
            handleUpdateTopicTipsCache={handleUpdateTopicTipsCache}
            handleAddGeneralMock={handleAddGeneralMock}
            handleDeleteGeneralMock={handleDeleteGeneralMock}
            handleUpdateGeneralMock={handleUpdateGeneralMock}
            handleAddSchoolExam={handleAddSchoolExam}
            handleUpdateSchoolExam={handleUpdateSchoolExam}
            handleDeleteSchoolExam={handleDeleteSchoolExam}
            handleAddYouTubeVideo={handleAddYouTubeVideo}
            handleUpdateYouTubeVideo={handleUpdateYouTubeVideo}
            handleDeleteYouTubeVideo={handleDeleteYouTubeVideo}
            handleSaveAICoachAdvice={handleSaveAICoachAdvice}
            handleDeleteAICoachAdvice={handleDeleteAICoachAdvice}
            handleSaveClassAICoachAdvice={handleSaveClassAICoachAdvice}
            handleDeleteClassAICoachAdvice={handleDeleteClassAICoachAdvice}
            handleToggleFavoriteBook={handleToggleFavoriteBook}
            handleEditMessage={handleEditMessage}
            handleDeleteMessage={handleDeleteMessage}
            handleMarkAsRead={handleMarkAsRead}
          />
        </main>

      </div>
 
      {/* Mobile Bottom Navigation Bar (Sadece mobilde görünür) */}
      {!isZenMode && currentUser && (
        <MobileBottomNav
          currentUser={currentUser}
          previewStudentUser={previewStudentUser}
          activeTab={activeTab}
          onSelectTab={handleTabChange}
          unresolvedErrorCount={unresolvedErrorCount}
          unreadMessageCount={unreadMessageCount}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && currentUser && (
        <ProfileModal
          currentUser={currentUser}
          profile={currentStudentData?.profile}
          onSave={handleUpdateProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Real-time Motivation Context Toast Banner */}
      <MotivationToast
        item={motivationToast}
        soundEnabled={currentUser?.soundEnabled !== false}
        onClose={() => setMotivationToast(null)}
      />

      {/* 3D Badge Unlock Celebration Fanfare Modal */}
      <BadgeCelebrationModal
        badge={celebrationBadge}
        soundEnabled={currentUser?.soundEnabled !== false}
        onClose={handleNextCelebration}
        onOpenShowcase={() => {
          handleNextCelebration();
          setShowBadgesShowcaseModal(true);
        }}
      />

      {/* Badges Collection & Showcase Modal */}
      {showBadgesShowcaseModal && currentUser && (
        <BadgesShowcaseModal
          studentData={currentStudentData}
          studentName={currentUser.name}
          onClose={() => setShowBadgesShowcaseModal(false)}
        />
      )}

      {/* İlk Giriş Onboarding Sihirbazı */}
      {showOnboardingWizard && currentUser && currentUser.role === 'student' && !previewStudentUser && (
        <OnboardingWizard
          currentUser={currentUser}
          currentProfile={currentStudentData?.profile || createEmptyStudentData(currentUser.name, currentUser.className).profile}
          classes={globalState.classes}
          onComplete={handleCompleteOnboarding}
        />
      )}

      {/* ✨ Yapay Zeka ile Akıllı Hızlı Ekle (Smart Add Modal) */}
      <GlobalAiSmartAddModal
        isOpen={isSmartAddModalOpen}
        onClose={() => setIsSmartAddModalOpen(false)}
        currentUser={currentUser}
        onDispatchAction={handleDispatchSmartAdd}
      />

      {/* 📲 PWA Yükleme & Çevrimdışı/Senkronizasyon Göstergesi */}
      <PwaInstallBanner />

    </div>
  );
}
