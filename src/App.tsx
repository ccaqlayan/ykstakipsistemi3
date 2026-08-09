import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, CheckCircle2, X, Maximize, Minimize } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { YildizLisesiLogo } from './components/YildizLisesiLogo';
import { LoginView } from './components/LoginView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { DashboardView } from './components/DashboardView';
import { SubjectProgressView } from './components/SubjectProgressView';
import { RoutinesView } from './components/RoutinesView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { PomodoroView } from './components/PomodoroView';
import { QuestionTrackerView } from './components/QuestionTrackerView';
import { ResourceTrackerView } from './components/ResourceTrackerView';
import { PastQuestionsView } from './components/PastQuestionsView';
import { BranchExamView } from './components/BranchExamView';
import { GeneralMockView } from './components/GeneralMockView';
import { YouTubeTrackerView } from './components/YouTubeTrackerView';
import { AICoachView } from './components/AICoachView';
import { GoogleSheetsView } from './components/GoogleSheetsView';
import { AuditLogsView } from './components/AuditLogsView';
import { ProfileModal } from './components/ProfileModal';
import { RecommendationsView } from './components/RecommendationsView';
import { MessagesView } from './components/MessagesView';
import { SystemManagementView } from './components/SystemManagementView';
import { BulkExamImportView } from './components/BulkExamImportView';

import { AppGlobalState, UserAccount, YKSDataState, StudentProfile, AuditLogItem, DirectMessage, ClassAICoachAdvice, ClassDefinition, InstitutionalMockExam, FieldType } from './types';
import { deleteStorageFile } from './services/storageUpload';
import { loadGlobalState, saveGlobalState, exportDataAsJSON, resetToDefaultData } from './services/storage';
import { 
  seedInitialFirestoreData, 
  subscribeToFirestore, 
  subscribeToMessages,
  subscribeToInstitutionalMockExams,
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
  deleteMessageFromFirestore,
  markMessagesAsDeliveredInFirestore,
  markMessagesAsReadInFirestore,
  saveAuditLogToFirestore,
  deleteAuditLogFromFirestore,
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
import { INITIAL_STATE, createEmptyStudentData, DEFAULT_AVATAR } from './data/initialData';

interface UndoItem {
  id: string;
  description: string;
  undoAction: () => void;
  timestamp: string;
  createdAt: number;
}

let cachedUserIp = '';
const fetchUserIp = async () => {
  if (cachedUserIp) return cachedUserIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    cachedUserIp = data.ip;
  } catch (err) {
    console.warn('Could not fetch IP address', err);
  }
  return cachedUserIp;
};
fetchUserIp(); // Fetch on module load

export default function App() {
  const [globalState, setGlobalState] = useState<AppGlobalState>(() => loadGlobalState());
  const currentUser = globalState.currentUser;

  // Audit loglarını sadece öğrenci olmayan roller için dinle (gereksiz okuma isteğini önlemek amacıyla)
  useEffect(() => {
    if (!currentUser || currentUser.role === 'student') {
      return;
    }
    const unsubscribeAuditLogs = subscribeToAuditLogs((logs) => {
      setGlobalState((prev) => ({ ...prev, auditLogs: logs }));
    });
    return () => unsubscribeAuditLogs();
  }, [currentUser?.id, currentUser?.role]);

  // studentsData: role'e göre daralt — öğrenci sadece kendi verisini, diğer roller tüm listeyi dinler
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (currentUser.role === 'student') {
      const unsubscribeStudent = subscribeToSingleStudentData(currentUser.id, (data) => {
        setGlobalState((prev) => ({
          ...prev,
          studentsData: data ? { [currentUser.id]: data } : prev.studentsData
        }));
      });
      return () => unsubscribeStudent();
    } else {
      const unsubscribeAll = subscribeToAllStudentsData((dataMap) => {
        setGlobalState((prev) => {
          // Mevcut "sanitize" mantığı: yeni oluşturulan ama yanlışlıkla demo plan miras alan öğrencileri düzelt
          const sanitizedStudentsData = { ...dataMap };
          (prev.users || []).forEach((u) => {
            if (u.role === 'student' && u.id !== 'student-1') {
              const stData = sanitizedStudentsData[u.id];
              if (!stData || (stData.studyPlans?.[0]?.id === INITIAL_STATE.studyPlans?.[0]?.id && stData.generalMocks?.[0]?.id === INITIAL_STATE.generalMocks?.[0]?.id)) {
                sanitizedStudentsData[u.id] = createEmptyStudentData(u.name, u.className);
              }
            }
          });
          return { ...prev, studentsData: sanitizedStudentsData };
        });
      });
      return () => unsubscribeAll();
    }
  }, [currentUser?.id, currentUser?.role]);

  // messages: login öncesi hiç dinleme, login sonrası herkes için aç
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

  // institutionalMockExams: sadece school_counselor/admin rolleri, sadece login sonrası dinlesin
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
  const [resourceTrackerTab, setResourceTrackerTab] = useState<'resources' | 'topics'>('resources');
  const [resourceTrackerDers, setResourceTrackerDers] = useState<string>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

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
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // PWA & Device Detection State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [showPwaGuide, setShowPwaGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVirtualFullscreen, setIsVirtualFullscreen] = useState(false);

  // PWA & Device Detection Effect
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

  // Fullscreen Listener Effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Browser History and Back-Button support (navigates previous tabs/pages inside the app on mobile & desktop instead of exiting)
  useEffect(() => {
    if (!currentUser) return;

    // Initialize state with the starting activeTab
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

  // User Presence and Heartbeat Tracker (more reliable online tracking strategy)
  useEffect(() => {
    if (!currentUser?.id) return;

    // 1. Set online instantly on mount / login
    updateUserPresenceInFirestore(currentUser.id, true);

    // 2. Setup periodic heartbeat SADECE ayarlardan aktifse
    let interval: ReturnType<typeof setInterval> | null = null;
    if (getPresenceHeartbeatEnabled()) {
      interval = setInterval(() => {
        updateUserPresenceInFirestore(currentUser.id, true);
      }, getPresenceHeartbeatMinutes() * 60 * 1000);
    }

    // 3. Update presence on visibility change (re-focusing tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserPresenceInFirestore(currentUser.id, true);
      }
    };

    // 4. Mark offline on browser/tab close
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



  // Smooth scroll to top whenever activeTab or view changes
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

  // Escape key handler to exit virtual fullscreen
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
  const [lastToast, setLastToast] = useState<{ id: string; message: string; undoFn?: () => void } | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    onQuotaError((hasError) => {
      setIsQuotaExceeded(hasError);
    });
  }, []);

  // Timer to check 1-minute expiration for navbar undo button
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute if latest undo item was created less than 1 minute (60 seconds) ago for Navbar
  const latestUndoItem = undoStack[undoStack.length - 1];
  const canUndoForNavbar = latestUndoItem ? (currentTime - (latestUndoItem.createdAt || 0)) < 60000 : false;

  // Auto-dismiss lastToast notification after 5 seconds
  useEffect(() => {
    if (lastToast) {
      const timer = setTimeout(() => {
        setLastToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastToast]);

  // Global Ctrl+Z / Cmd+Z Keyboard Shortcut listener for Undo
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

    // Log undo action in Audit Logs
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
        ipAddress: cachedUserIp
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
    if (!currentUser) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${year}-${month}-${day} ${hours}:${minutes}`;

    const getDeviceType = (): 'Mobil' | 'Tablet' | 'Masaüstü' => {
      const ua = navigator.userAgent.toLowerCase();
      const isMobileUA = /iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua);
      const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(ua);
      
      if (isMobileUA) {
        return 'Mobil';
      } else if (isTabletUA) {
        return 'Tablet';
      } else {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isTouch && window.innerWidth < 1024) {
          if (window.innerWidth < 640) {
            return 'Mobil';
          }
          return 'Tablet';
        }
        return 'Masaüstü';
      }
    };

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
      ipAddress: cachedUserIp,
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

  // Real-time Firebase Firestore listener
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

  // Sync tab on user switch
  useEffect(() => {
    const isTeacherRole = currentUser?.role === 'class_teacher' || currentUser?.role === 'school_counselor' || currentUser?.role === 'teacher' || currentUser?.role === 'admin';
    if (isTeacherRole) {
      setActiveTab('teacher_summary');
    } else {
      setActiveTab('dashboard');
    }
  }, [currentUser?.id, currentUser?.role]);

  // Auto-mark messages as delivered when receiver logs in / currentUser changes
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

  // Auto-save global state locally as fallback & update activity timestamp
  useEffect(() => {
    saveGlobalState(globalState);
    if (globalState.currentUser) {
      localStorage.setItem('yks_last_active_time', Date.now().toString());
    }
  }, [globalState]);

  useEffect(() => {
    if (localStorage.getItem('yks_force_wipe_pending_v3') !== 'done') {
      console.log('Forcing complete wipe of institutional exams...');
      localStorage.setItem('yks_exempt_auto_seed', 'true');
      deleteAllInstitutionalExamsFromFirestore().then(() => {
        localStorage.setItem('yks_force_wipe_pending_v3', 'done');
        
        setGlobalState(prev => {
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
      });
    }
  }, []);

  // Current active student data (if logged in as student)
  const currentStudentData: YKSDataState = (currentUser && globalState.studentsData[currentUser.id]) || (currentUser ? createEmptyStudentData(currentUser.name, currentUser.className) : INITIAL_STATE);

  const unresolvedErrorCount = currentStudentData.topicErrors.filter((e) => !e.revised).length;

  // Helper to update current student's state slice in both React and Firestore
  const updateCurrentStudentData = (updater: (prev: YKSDataState) => YKSDataState) => {
    if (!currentUser) return;
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
      const studentData = prev.studentsData[studentId] || INITIAL_STATE;
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

  // Login handler
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
      ipAddress: cachedUserIp
    };

    saveAuditLogToFirestore(loginAuditItem);
    setGlobalState((prev) => ({
      ...prev,
      currentUser: user,
      auditLogs: [loginAuditItem, ...(prev.auditLogs || [])],
      studentsData: user.role === 'student' && !prev.studentsData[user.id] 
        ? { ...prev.studentsData, [user.id]: { ...INITIAL_STATE, profile: { ...INITIAL_STATE.profile, name: user.name, className: user.className } } }
        : prev.studentsData
    }));
  };

  // Create account handler with Firestore persistence
  const handleCreateAccount = (newUserData: Omit<UserAccount, 'id'>) => {
    const newId = (newUserData.role === 'student' ? 'student-' : 'teacher-') + Date.now();
    const newUser: UserAccount = { ...newUserData, id: newId };

    saveUserToFirestore(newUser);

    if (newUser.role === 'student') {
      const initialStudentData: YKSDataState = {
        ...INITIAL_STATE,
        profile: {
          ...INITIAL_STATE.profile,
          name: newUser.name,
          className: newUser.className || '12-A SAY'
        }
      };
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
      ipAddress: cachedUserIp
    };

    saveAuditLogToFirestore(registerAuditItem);
    setGlobalState((prev) => {
      const updatedUsers = [...prev.users, newUser];
      const updatedStudentsData = { ...prev.studentsData };
      if (newUser.role === 'student') {
        updatedStudentsData[newId] = {
          ...INITIAL_STATE,
          profile: {
            ...INITIAL_STATE.profile,
            name: newUser.name,
            className: newUser.className || '12-A SAY'
          }
        };
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

  // Logout handler
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
        ipAddress: cachedUserIp
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
  };

  // Teacher action: Update a student's profile (e.g., write coach notes)
  const handleUpdateStudentProfileByTeacher = (studentId: string, updatedProfile: StudentProfile) => {
    const studentUser = globalState.users.find(u => u.id === studentId);
    const prevStudentData = globalState.studentsData[studentId] || INITIAL_STATE;

    setGlobalState((prev) => {
      const studentData = prev.studentsData[studentId] || INITIAL_STATE;
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

  // Teacher action: Create new class
  const handleCreateClass = (className: string, field: FieldType, description?: string) => {
    const newClass: ClassDefinition = {
      id: 'class-' + Date.now(),
      name: className,
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

  // Teacher action: Assign student to a new class
  const handleAssignStudentClass = (studentId: string, newClassName: string) => {
    const targetStudent = globalState.users.find(u => u.id === studentId);
    const prevClassName = targetStudent?.className || 'Atanmamış';
    
    // Find the class definition to get its field
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

  // Teacher action: Update a student's study plans directly
  const handleUpdateStudentStudyPlansByTeacher = (studentId: string, updatedPlans: any[]) => {
    const targetStudent = globalState.users.find(u => u.id === studentId);
    const prevPlans = globalState.studentsData[studentId]?.studyPlans || [];

    setGlobalState((prev) => {
      const studentData = prev.studentsData[studentId] || INITIAL_STATE;
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

  // Program Templates handlers
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

    const newItems = tpl.items.map((item: any, idx: number) => ({
      id: `plan-${Date.now()}-${idx}`,
      day: item.day,
      subject: item.subject,
      topic: item.topic,
      plannedMinutes: item.plannedMinutes,
      completedMinutes: 0,
      status: 'pending',
      notes: item.notes
    }));

    setGlobalState((prev) => {
      const studentData = prev.studentsData[studentId] || INITIAL_STATE;
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

    // Initialize clean empty student state data for target, plans, questions, resources, mocks
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

      // If old studentId existed and changed or removed, remove from old student's institutionalMocks
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

      // If new studentId exists, add or update in new student's institutionalMocks
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

    // 1. Delete from Firestore's institutional_mock_exams collection
    for (const id of ids) {
      await deleteInstitutionalExamFromFirestore(id);
    }

    // 2. Update React global state & persist modified student documents to Firestore
    setGlobalState((prev) => {
      const existingGlobal = prev.institutionalMockExams || [];
      const updatedGlobal = existingGlobal.filter(e => !ids.includes(e.id));

      const updatedStudentsData = { ...prev.studentsData };
      const studentIdsToUpdate = new Set<string>();

      // Scan all student profiles to find and clean up any reference to these exam IDs
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

      // Persist any updated student records back to Firestore
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
      // Set local storage exempt flag to prevent automatic re-upload/auto-seed on empty check
      localStorage.setItem('yks_exempt_auto_seed', 'true');

      // 1. Delete all institutional exams and clear student sub-arrays from Firestore
      await deleteAllInstitutionalExamsFromFirestore();

      // 2. Clear local React state
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

  // Action handler: User Profile Update with Audit & Undo
  const handleUpdateProfile = (updatedUser: UserAccount, updatedStudentProfile?: StudentProfile) => {
    const prevUser = currentUser;
    const prevStudentProfile = currentStudentData?.profile;

    // Save updated user to Firestore & local global state
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

    // If student profile provided, update current student data
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
    updateCurrentStudentData((prev) => ({
      ...prev,
      studyPlans: (prev.studyPlans || []).map((p) => (p.id === plan.id ? plan : p))
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${plan.subject} - ${plan.topic}" görev durumunu güncelledi (${plan.status === 'completed' ? 'Tamamlandı' : 'Devam Ediyor'}).`,
      'study',
      'update_plan',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, studyPlans: prevPlans }));
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
    updateCurrentStudentData((prev) => ({
      ...prev,
      studyPlans: plans
    }));

    addAuditAndUndo(
      auditMessage || `${currentUser?.name || 'Öğrenci'} haftalık çalışma planını güncelledi.`,
      'study',
      'update_all_plans',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, studyPlans: prevPlans }));
      }
    );
  };

  const handleAddQuestionLog = (log: any) => {
    const newItem = { ...log, id: 'qlog-' + Date.now() };
    const prevLogs = currentStudentData.questionLogs || [];
    updateCurrentStudentData((prev) => ({ ...prev, questionLogs: [newItem, ...(prev.questionLogs || [])] }));

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
    const oldRes = prevResources.find((r) => r.id === res.id);
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
    // If student has solved at least 1 test in any resource for this topic, prevent setting status to 'Çalışmadım'
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
    const exists = prevList.includes(topicKey);
    updateCurrentStudentData((prev) => {
      const currentList = prev.completedPastTopics || [];
      const updatedList = exists
        ? currentList.filter((k) => k !== topicKey)
        : [...currentList, topicKey];
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

  const handleTogglePastExamSolved = (id: string) => {
    const prevExams = currentStudentData.pastExams || [];
    const pe = prevExams.find(x => x.id === id);
    const newSolvedState = pe ? !pe.solved : true;
    updateCurrentStudentData((prev) => ({
      ...prev,
      pastExams: prev.pastExams.map((pe) =>
        pe.id === id ? { ...pe, solved: !pe.solved } : pe
      )
    }));

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${pe ? `${pe.year} ${pe.examType} ${pe.subject}` : ''}" çıkmış sınavını ${newSolvedState ? 'çözüldü' : 'çözülmedi'} olarak işaretledi.`,
      'exam',
      'toggle_past_exam_solved',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, pastExams: prevExams }));
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
      `${currentUser?.name || 'Öğrenci'} yeni bir branş denemesi ekledi: ${exam.subject} (${exam.corrects}D ${exam.incorrects}Y ${exam.net} Net).`,
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
      `${currentUser?.name || 'Öğrenci'} "${updatedExam.subject}" branş denemesi kaydını güncelledi (${updatedExam.corrects}D ${updatedExam.incorrects}Y ${updatedExam.net} Net).`,
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
    const newItem = { ...err, id: 'err-' + Date.now() };
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

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} yeni bir genel deneme ekledi: "${mock.title}" (${mock.tytNet ? `TYT Net: ${mock.tytNet}` : ''}${mock.aytNet ? `, AYT Net: ${mock.aytNet}` : ''}).`,
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

    addAuditAndUndo(
      `${currentUser?.name || 'Öğrenci'} "${updated.title}" genel deneme sonucunu güncelledi (${updated.tytNet ? `TYT Net: ${updated.tytNet}` : ''}${updated.aytNet ? `, AYT Net: ${updated.aytNet}` : ''}).`,
      'exam',
      'update_general_mock',
      () => {
        updateCurrentStudentData((prev) => ({ ...prev, generalMocks: prevMocks }));
      }
    );
  };

  const handleAddYouTubeVideo = (vid: any) => {
    const newItem = { ...vid, id: 'yt-' + Date.now() };
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
    const oldVid = prevVideos.find((v) => v.id === vid.id);
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

  const handleUpdateSheetsStatus = (status: any) => {
    updateCurrentStudentData((prev) => ({ ...prev, sheetsStatus: status }));
  };

  const handleSendMessage = (receiverId: string, content: string, attachmentUrl?: string, replyTo?: DirectMessage['replyTo']) => {
    if (!currentUser) return;
    
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

    // Broadcast Target 1: ALL REGISTERED USERS
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

    // Broadcast Target 2: ALL STUDENTS
    if (receiverId === 'broadcast-students') {
      createAndDispatchMsg('broadcast-students', 'Tüm Öğrenciler', 'student');
      const activeStudents = globalState.users.filter(u => u.id !== currentUser.id && u.role === 'student' && u.status !== 'pending' && u.status !== 'rejected');
      addAuditAndUndo(`Tüm öğrencilere (${activeStudents.length} kişi) toplu mesaj gönderildi`, 'social', 'send_message', undefined, 'broadcast-students', 'Tüm Öğrenciler');
      return;
    }

    // Broadcast Target 3: ALL TEACHERS
    if (receiverId === 'broadcast-teachers') {
      createAndDispatchMsg('broadcast-teachers', 'Tüm Öğretmenler', 'teacher');
      const activeTeachers = globalState.users.filter(u => u.id !== currentUser.id && (u.role === 'teacher' || u.role === 'class_teacher') && u.status !== 'pending' && u.status !== 'rejected');
      addAuditAndUndo(`Tüm öğretmenlere (${activeTeachers.length} kişi) toplu mesaj gönderildi`, 'social', 'send_message', undefined, 'broadcast-teachers', 'Tüm Öğretmenler');
      return;
    }

    // Broadcast Target 4: ALL COUNSELORS
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

    // Check 1-minute time constraint (60 seconds)
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

    const updatedMsg: DirectMessage = {
      ...msgToDelete,
      isDeleted: true,
      content: 'Bu mesaj kullanıcı tarafından silindi',
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
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!currentUser) return;
    const msgToEdit = (globalState.messages || []).find(m => m.id === messageId);
    if (!msgToEdit) return;

    // Check 1-minute time constraint (60 seconds)
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
    const editedAtTime = `${hours}:${minutes}`;

    const updatedMsg: DirectMessage = {
      ...msgToEdit,
      content: newContent,
      isEdited: true,
      editedAt: editedAtTime,
      timestampMs: msgTimeMs || Date.now()
    };

    setGlobalState(prev => ({
      ...prev,
      messages: (prev.messages || []).map(m => m.id === messageId ? updatedMsg : m)
    }));
    saveMessageToFirestore(updatedMsg);
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

  const unreadMessageCount = currentUser ? (globalState.messages || []).filter(m => {
    if (!m || m.senderId === currentUser.id) return false;
    if (m.receiverId?.startsWith('class-group-')) {
      return !m.readBy || !m.readBy.some(r => r.userId === currentUser.id);
    }
    if (m.receiverId?.startsWith('broadcast-')) {
      const role = currentUser.role;
      let relevant = false;
      if (m.receiverId === 'broadcast-all') relevant = true;
      if (m.receiverId === 'broadcast-students' && (role === 'student' || role === 'admin')) relevant = true;
      if (m.receiverId === 'broadcast-teachers' && (role === 'teacher' || role === 'class_teacher' || role === 'admin')) relevant = true;
      if (m.receiverId === 'broadcast-counselors' && (role === 'school_counselor' || role === 'admin')) relevant = true;
      if (!relevant) return false;
      return !m.readBy || !m.readBy.some(r => r.userId === currentUser.id);
    }
    return m.receiverId === currentUser.id && !m.isRead;
  }).length : 0;

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
      {/* Ambient Glows */}
      <div className="fixed -top-40 -right-40 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -left-40 w-64 h-64 sm:w-96 sm:h-96 bg-fuchsia-500/15 rounded-full blur-[90px] sm:blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 right-1/4 w-72 h-72 sm:w-[30rem] sm:h-[30rem] bg-indigo-600/15 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none z-0" />

      {/* Top Navbar */}
      {!isZenMode && (
      <Navbar
        currentUser={currentUser}
        profile={currentStudentData.profile}
        sheetsStatus={currentStudentData.sheetsStatus}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenSheetsModal={() => setActiveTab('sheets')}
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
        theme={theme}
        onToggleTheme={handleToggleTheme}
        alwaysShowMenuButton={activeTab === 'bulk_exam_import'}
      />
      )}

      {/* Firebase Quota Warning Banner */}
      {!isZenMode && isQuotaExceeded && (
        <div className="w-full max-w-7xl mx-auto px-4 pt-4 relative z-20 animate-fade-in">
          <div className="bg-amber-950/60 border border-amber-500/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-200">
                  Bulut Veri Tabanı Kotası Doldu (Sorunsuz Oturum Devam Ediyor)
                </h4>
                <p className="text-xs text-amber-300/90 leading-relaxed max-w-3xl">
                  Yüksek kullanım sebebiyle ücretsiz Google Firebase bulut veri tabanı günlük yazma sınırına ulaşıldı. 
                  Yaptığınız değişiklikler tarayıcınızın <strong>Yerel Depolama (localStorage)</strong> hafızasında güvenle saklanacak, 
                  oturumunuz kesintiye uğramadan çalışmaya devam edecektir. Dilerseniz tüm verilerinizi sağ üstteki menüden 
                  <strong> "Veri Yedekle (JSON)"</strong> butonu ile bilgisayarınıza indirebilirsiniz. Sınırlar sıfırlandığında bulut otomatik eşitlenecektir.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsQuotaExceeded(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all cursor-pointer self-end md:self-auto shrink-0"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className={`flex-1 ${activeTab === 'bulk_exam_import' ? 'w-full max-w-none px-2 sm:px-4' : 'max-w-7xl w-full mx-auto'} flex flex-col md:flex-row relative z-10`}>
        
        {/* Navigation Sidebar */}
        {!isZenMode && (
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onSelectTab={handleTabChange}
          unresolvedErrorCount={unresolvedErrorCount}
          unreadMessageCount={unreadMessageCount}
          onLogout={handleLogout}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isMobileOrTablet={isMobileOrTablet}
          onAddToHomeScreen={handleAddToHomeScreen}
          isHideDesktopSidebar={activeTab === 'bulk_exam_import'}
        />
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          
          {/* AUDIT LOGS / AYAK İZİ VIEW */}
          {activeTab === 'audit_logs' && currentUser && currentUser.role !== 'student' && (
            <AuditLogsView
              currentUser={currentUser}
              auditLogs={globalState.auditLogs || []}
              classes={globalState.classes}
              studentsData={globalState.studentsData}
              allUsers={globalState.users}
              onUndoLastAction={handleUndo}
              canUndo={undoStack.length > 0}
              lastUndoDescription={undoStack[undoStack.length - 1]?.description || ''}
              onClearLogs={() => {
                clearAllAuditLogsInFirestore();
                setGlobalState(prev => ({ ...prev, auditLogs: [] }));
              }}
            />
          )}

          {/* SYSTEM MANAGEMENT / SİSTEM YÖNETİMİ & MALİYET ANALİZİ VIEW */}
          {activeTab === 'teacher_system' && currentUser.role === 'admin' && (
            <SystemManagementView 
              auditLogs={globalState.auditLogs || []} 
              currentUser={currentUser}
              users={globalState.users}
              onSendMessage={handleSendMessage}
            />
          )}

          {/* BULK EXAM IMPORT VIEW */}
          {activeTab === 'bulk_exam_import' && (currentUser.role === 'school_counselor' || currentUser.role === 'admin') && (
            <BulkExamImportView
              currentUser={currentUser}
              users={globalState.users}
              classes={globalState.classes}
              studentsData={globalState.studentsData}
              institutionalMockExams={globalState.institutionalMockExams || []}
              onSaveInstitutionalExams={handleSaveInstitutionalExams}
              onUpdateInstitutionalExam={handleUpdateInstitutionalExam}
              onDeleteInstitutionalExam={handleDeleteInstitutionalExam}
              onDeleteAllInstitutionalExams={handleDeleteAllInstitutionalExams}
              onAddAuditLog={addAuditAndUndo}
              onToggleMenu={() => setIsMobileMenuOpen(prev => !prev)}
            />
          )}

          {/* TEACHER DASHBOARD */}
          {(activeTab === 'teacher_summary' || activeTab === 'teacher_students' || activeTab === 'teacher_teachers' || activeTab === 'teacher_templates') && (currentUser.role === 'class_teacher' || currentUser.role === 'school_counselor' || currentUser.role === 'teacher' || currentUser.role === 'admin') && (
            <TeacherDashboardView
              teacher={currentUser}
              classes={globalState.classes}
              allUsers={globalState.users}
              studentsData={globalState.studentsData}
              programTemplates={globalState.programTemplates || []}
              auditLogs={globalState.auditLogs || []}
              activeTeacherSubView={activeTab === 'teacher_summary' ? 'summary' : activeTab === 'teacher_teachers' ? 'teachers' : activeTab === 'teacher_templates' ? 'templates' : 'students'}
              onUpdateStudentProfile={handleUpdateStudentProfileByTeacher}
              onUpdateStudentStudyPlans={handleUpdateStudentStudyPlansByTeacher}
              onCreateClass={handleCreateClass}
              onAssignStudentClass={handleAssignStudentClass}
              onSaveProgramTemplate={handleSaveProgramTemplate}
              onUpdateProgramTemplate={handleUpdateProgramTemplate}
              onDeleteProgramTemplate={handleDeleteProgramTemplate}
              onApplyTemplateToStudent={handleApplyTemplateToStudent}
              onUpdateTeacherAssignedClasses={handleUpdateTeacherAssignedClasses}
              onUpdateTeacherAccount={handleUpdateTeacherAccount}
              onDeleteClass={handleDeleteClassDefinition}
              onUpdateClass={handleUpdateClassDefinition}
              onCreateTeacherAccount={handleCreateTeacherUser}
              onDeleteTeacherAccount={handleDeleteTeacherUser}
              onCreateStudentAccount={handleCreateStudentUser}
              onUpdateStudentAccount={handleUpdateStudentAccount}
              onDeleteStudentAccount={handleDeleteStudentUser}
              onApproveStudent={handleApproveStudent}
              onRejectStudent={handleRejectStudent}
              onUpdateStudentSubjectNotes={handleUpdateStudentSubjectNotesByTeacher}
            />
          )}

          {/* STUDENT DASHBOARD */}
          {activeTab === 'dashboard' && (
            <DashboardView
              state={currentStudentData}
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onOpenProfile={() => setShowProfileModal(true)}
              onUpdateRoutines={handleUpdateRoutines}
              onUpdateStudentProfile={handleUpdateStudentProfile}
              onUpdateSubjectNotes={handleUpdateSubjectNotes}
              onUpdateDashboardWidgets={handleUpdateDashboardWidgets}
              onUpdateQuickNotes={handleUpdateQuickNotes}
            />
          )}

          {activeTab === 'subject_progress' && (
            <SubjectProgressView
              state={currentStudentData}
              onUpdateTopicStatus={handleUpdateTopicStatus}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'routines' && (
            <RoutinesView
              state={currentStudentData}
              onUpdateRoutines={handleUpdateRoutines}
            />
          )}

          {activeTab === 'planner' && (
            <StudyPlannerView
              studyPlans={currentStudentData.studyPlans}
              questionLogs={currentStudentData.questionLogs}
              onAddPlan={handleAddPlan}
              onUpdatePlan={handleUpdatePlan}
              onDeletePlan={handleDeletePlan}
              onAddQuestionLog={handleAddQuestionLog}
              onDeleteQuestionLog={handleDeleteQuestionLog}
              onUpdateAllPlans={handleUpdateAllPlans}
              taskTypes={currentStudentData.taskTypes}
              onUpdateTaskTypes={handleUpdateTaskTypes}
              isZenMode={isZenMode}
              onZenModeChange={setIsZenMode}
            />
          )}

          {activeTab === 'pomodoro' && (
            <PomodoroView
              studyPlans={currentStudentData.studyPlans}
              routines={currentStudentData.routines || []}
              onUpdatePlan={handleUpdatePlan}
              onZenModeChange={setIsZenMode}
            />
          )}

          {activeTab === 'questions' && (
            <QuestionTrackerView
              questionLogs={currentStudentData.questionLogs}
              onAddLog={handleAddQuestionLog}
              onUpdateLog={handleUpdateQuestionLog}
              onDeleteLog={handleDeleteQuestionLog}
              theme={theme}
            />
          )}

          {activeTab === 'resources' && (
            <ResourceTrackerView
              resources={currentStudentData.resources}
              pastExams={currentStudentData.pastExams}
              onAddResource={handleAddResource}
              onUpdateResource={handleUpdateResource}
              onDeleteResource={handleDeleteResource}
              onUpdatePastExam={handleUpdatePastExam}
              topicStatuses={currentStudentData.topicStatuses || {}}
              onUpdateTopicStatus={handleUpdateTopicStatus}
              manuallyChangedTopicStatuses={currentStudentData.manuallyChangedTopicStatuses || []}
              initialTrackerTab={resourceTrackerTab}
              initialDersFilter={resourceTrackerDers}
            />
          )}

          {activeTab === 'past_questions' && (
            <PastQuestionsView
              completedPastTopics={currentStudentData.completedPastTopics}
              onTogglePastTopic={handleToggleTopicCompleted}
            />
          )}

          {activeTab === 'errors' && (
            <BranchExamView
              currentUser={currentUser || undefined}
              mode="errors"
              branchExams={currentStudentData.branchExams}
              topicErrors={currentStudentData.topicErrors}
              generalMocks={currentStudentData.generalMocks}
              resources={currentStudentData.resources}
              topicTipsCache={currentStudentData.topicTipsCache}
              onAddBranchExam={handleAddBranchExam}
              onUpdateBranchExam={handleUpdateBranchExam}
              onDeleteBranchExam={handleDeleteBranchExam}
              onAddTopicError={handleAddTopicError}
              onUpdateTopicError={handleUpdateTopicError}
              onDeleteTopicError={handleDeleteTopicError}
              onUpdateTopicTipsCache={handleUpdateTopicTipsCache}
              theme={theme}
              onAddAuditLog={addAuditAndUndo}
            />
          )}

          {activeTab === 'branches' && (
            <BranchExamView
              currentUser={currentUser || undefined}
              mode="branches"
              branchExams={currentStudentData.branchExams}
              topicErrors={currentStudentData.topicErrors}
              generalMocks={currentStudentData.generalMocks}
              resources={currentStudentData.resources}
              topicTipsCache={currentStudentData.topicTipsCache}
              onAddBranchExam={handleAddBranchExam}
              onUpdateBranchExam={handleUpdateBranchExam}
              onDeleteBranchExam={handleDeleteBranchExam}
              onAddTopicError={handleAddTopicError}
              onUpdateTopicError={handleUpdateTopicError}
              onDeleteTopicError={handleDeleteTopicError}
              onUpdateTopicTipsCache={handleUpdateTopicTipsCache}
              theme={theme}
              onAddAuditLog={addAuditAndUndo}
            />
          )}

          {activeTab === 'mocks' && (
            <GeneralMockView
              generalMocks={currentStudentData.generalMocks}
              profile={currentStudentData.profile}
              institutionalMocks={currentStudentData.institutionalMocks || []}
              onAddMock={handleAddGeneralMock}
              onDeleteMock={handleDeleteGeneralMock}
              onUpdateMock={handleUpdateGeneralMock}
              onUpdateProfile={handleUpdateStudentProfile}
            />
          )}

          {activeTab === 'youtube' && (
            <YouTubeTrackerView
              videos={currentStudentData.youtubeVideos}
              onAddVideo={handleAddYouTubeVideo}
              onUpdateVideo={handleUpdateYouTubeVideo}
              onDeleteVideo={handleDeleteYouTubeVideo}
            />
          )}

          {activeTab === 'ai_coach' && (
            <AICoachView
              state={currentStudentData}
              onSaveAdvice={handleSaveAICoachAdvice}
              onDeleteAdvice={handleDeleteAICoachAdvice}
              onSaveClassAdvice={handleSaveClassAICoachAdvice}
              onDeleteClassAdvice={handleDeleteClassAICoachAdvice}
              currentUser={currentUser}
              allUsers={globalState.users}
              classes={globalState.classes}
              studentsData={globalState.studentsData}
              onAddAuditLog={addAuditAndUndo}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationsView
              onAddVideo={handleAddYouTubeVideo}
              onAddResource={handleAddResource}
              onDeleteVideo={handleDeleteYouTubeVideo}
              onDeleteResource={handleDeleteResource}
              trackedVideos={currentStudentData.youtubeVideos || []}
              trackedResources={currentStudentData.resources || []}
              favoriteBooks={currentStudentData.favoriteBooks || []}
              onToggleFavoriteBook={handleToggleFavoriteBook}
              currentUser={currentUser}
              customRecommendations={globalState.customRecommendations || { channels: [], books: [] }}
            />
          )}

          {activeTab === 'messages' && currentUser && (
            <MessagesView
              currentUser={currentUser}
              allUsers={globalState.users}
              classes={globalState.classes}
              messages={globalState.messages || []}
              studentsData={globalState.studentsData}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
        </main>

      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && currentUser && (
        <ProfileModal
          currentUser={currentUser}
          profile={currentStudentData?.profile}
          onSave={handleUpdateProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Floating Undo Toast Notification */}
      {lastToast && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-bounce-short max-w-sm sm:max-w-md ml-auto">
          <div className="bg-slate-900/95 border border-purple-500/40 text-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-xl flex items-center space-x-2 sm:space-x-3.5">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-tight">İşlem Gerçekleşti</div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-100 truncate">{lastToast.message}</p>
            </div>

            {lastToast.undoFn && (
              <button
                onClick={() => {
                  if (lastToast.undoFn) lastToast.undoFn();
                }}
                className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs flex items-center space-x-1 shadow-md shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Geri Al</span>
              </button>
            )}

            <button
              onClick={() => setLastToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Fullscreen Action Button - Sol Altta */}
      {activeTab !== 'pomodoro' && !isZenMode && (
      <button
        onClick={handleToggleFullscreen}
        className="fixed bottom-6 left-6 z-40 p-3.5 bg-slate-950/80 hover:bg-indigo-600 border border-white/10 text-white rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 group focus:outline-none"
        title={isFullscreen || isVirtualFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
      >
        {isFullscreen || isVirtualFullscreen ? (
          <Minimize className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors" />
        ) : (
          <Maximize className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors" />
        )}
      </button>
      )}

      {/* PWA Home Screen Install Guide Modal */}
      {showPwaGuide && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-white/5 relative z-10">
              <YildizLisesiLogo className="w-20 h-20 mb-3 filter drop-shadow-md" />
              <h3 className="text-lg font-black text-white">YKS Takip Sistemi</h3>
              <p className="text-xs text-indigo-300 font-bold mt-1">{currentSchoolName}</p>
            </div>

            {/* Body Instructions */}
            <div className="py-5 space-y-4 text-slate-300 relative z-10 text-xs sm:text-sm">
              <p className="text-slate-400 font-medium text-center">
                Uygulamayı telefon veya tabletinizin ana ekranına ekleyerek tek dokunuşla bir uygulama gibi hızlıca açabilirsiniz.
              </p>

              {/* Apple iOS Safari Instructions */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-white font-bold">
                  <span className="w-5 h-5 rounded-lg bg-indigo-600/30 border border-indigo-400 text-indigo-300 flex items-center justify-center text-xs font-black">1</span>
                  <span>Apple iOS (iPhone / iPad) için:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs">
                  <li>Tarayıcınızın altındaki <span className="text-white font-bold">"Paylaş" (Share)</span> butonuna tıklayın.</li>
                  <li>Açılan menüden aşağı kaydırıp <span className="text-white font-bold">"Ana Ekrana Ekle" (Add to Home Screen)</span> seçeneğini seçin.</li>
                  <li>Sağ üstteki <span className="text-white font-bold">"Ekle"</span> butonuna basarak tamamlayın.</li>
                </ul>
              </div>

              {/* Android / Chrome Instructions */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-white font-bold">
                  <span className="w-5 h-5 rounded-lg bg-indigo-600/30 border border-indigo-400 text-indigo-300 flex items-center justify-center text-xs font-black">2</span>
                  <span>Android / Chrome için:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs">
                  <li>Tarayıcı adres çubuğunun sağındaki <span className="text-white font-bold">üç nokta (Menü)</span> simgesine tıklayın.</li>
                  <li><span className="text-white font-bold">"Uygulamayı yükle"</span> veya <span className="text-white font-bold">"Ana ekrana ekle"</span> seçeneğini seçin.</li>
                  <li>Gelen onay penceresinde <span className="text-white font-bold">"Ekle / Yükle"</span> butonuna tıklayın.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 relative z-10">
              <button
                onClick={() => setShowPwaGuide(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
