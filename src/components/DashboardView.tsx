import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  BookCheck,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Compass,
  Scroll,
  Globe,
  Lightbulb,
  Languages,
  BookMarked,
  Flame, 
  Sparkles, 
  Play, 
  TrendingUp, 
  ArrowUpRight,
  MessageSquareQuote,
  Timer,
  Calendar,
  Clock,
  Trash2,
  Plus,
  Check,
  Edit3,
  Edit2,
  Sliders,
  BarChart2,
  PieChart as PieChartIcon,
  Video,
  GraduationCap,
  Activity,
  Layers,
  HelpCircle,
  StickyNote,
  X,
  CalendarDays,
  List,
  LayoutGrid,
  Pin,
  PinOff,
  Cloud,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { YKSDataState, StudentProfile, UserAccount, DayOfWeek, QuickNote } from '../types';
import { UniversityLogo } from './UniversityLogo';
import { TargetModal } from './TargetModal';
import { 
  DashboardCustomizeModal, 
  DashboardWidgetConfig, 
  DEFAULT_DASHBOARD_WIDGETS 
} from './DashboardCustomizeModal';

interface DashboardViewProps {
  state: YKSDataState;
  currentUser?: UserAccount | null;
  onNavigateTab: (tab: any) => void;
  onOpenProfile: () => void;
  onUpdateRoutines?: (routines: any[], actionText?: string) => void;
  onUpdateStudentProfile?: (updatedStudentProfile: StudentProfile) => void;
  onUpdateSubjectNotes?: (subjectName: string, notes: { studentNote?: string; teacherNote?: string }) => void;
  onUpdateDashboardWidgets?: (widgets: DashboardWidgetConfig[]) => void;
  onUpdateQuickNotes?: (notes: QuickNote[], actionText?: string) => void;
}

const DSH_STORAGE_KEY = 'yks_dashboard_widget_config_v1';

const mergeWidgetsWithDefaults = (savedWidgets: DashboardWidgetConfig[]): DashboardWidgetConfig[] => {
  if (!Array.isArray(savedWidgets) || savedWidgets.length === 0) return DEFAULT_DASHBOARD_WIDGETS;
  const merged = DEFAULT_DASHBOARD_WIDGETS.map(def => {
    const found = savedWidgets.find(p => p.id === def.id);
    const result = found ? { ...def, ...found } : { ...def };
    // Force weekly_schedule to be in 'header' category and have order 5 by default if it was old content
    if (result.id === 'weekly_schedule') {
      result.category = 'header';
      if (found && found.category === 'content') {
        result.order = 5;
      }
    }
    // Force quick_notes to be in 'header' category and have order 3 by default if it was old content
    if (result.id === 'quick_notes') {
      result.category = 'header';
      if (found && found.category === 'content') {
        result.order = 3;
      }
    }
    return result;
  });
  savedWidgets.forEach(p => {
    if (!merged.find(m => m.id === p.id)) {
      const result = { ...p };
      if (result.id === 'weekly_schedule') {
        result.category = 'header';
        result.order = 5;
      }
      if (result.id === 'quick_notes') {
        result.category = 'header';
        result.order = 3;
      }
      merged.push(result);
    }
  });
  merged.sort((a, b) => a.order - b.order);
  return merged;
};

const ERROR_REASON_LABELS: Record<string, { label: string; color: string }> = {
  bilgi_eksigi: { label: 'Bilgi Eksikliği', color: '#f43f5e' }, // Rose
  dikkat_hatasi: { label: 'Dikkat / İşlem Hatası', color: '#f59e0b' }, // Amber
  zaman_yetmedi: { label: 'Süre Yetmedi', color: '#6366f1' }, // Indigo
  iki_sik_arasinda: { label: 'Çeldirici / İki Şık', color: '#8b5cf6' }, // Violet
  soru_kokunu_yanlis_okuma: { label: 'Soru Kökü Okuma', color: '#06b6d4' } // Cyan
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  currentUser,
  onNavigateTab,
  onOpenProfile,
  onUpdateRoutines,
  onUpdateStudentProfile,
  onUpdateSubjectNotes,
  onUpdateDashboardWidgets,
  onUpdateQuickNotes
}) => {
  const { 
    profile, 
    questionLogs = [], 
    generalMocks = [], 
    topicErrors = [], 
    studyPlans = [], 
    resources = [],
    branchExams = [],
    pastExams = [],
    youtubeVideos = [],
    coachAdvices = [],
    quickNotes = []
  } = state;

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Quick Notes local form states
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<'amber' | 'emerald' | 'sky' | 'rose' | 'purple' | 'slate'>('amber');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editNoteColor, setEditNoteColor] = useState<'amber' | 'emerald' | 'sky' | 'rose' | 'purple' | 'slate'>('amber');
  
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);

  // Schedule Widget tab state (Yesterday, Today, Tomorrow)
  const [scheduleDayTab, setScheduleDayTab] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [scheduleViewMode, setScheduleViewMode] = useState<'tabs' | 'grid'>('tabs');

  // Subject progress notes modal states
  const [activeNotesSubject, setActiveNotesSubject] = useState<string | null>(null);
  const [studentNoteDraft, setStudentNoteDraft] = useState('');
  const [teacherNoteDraft, setTeacherNoteDraft] = useState('');

  const handleOpenNotesModal = (subjectName: string) => {
    setActiveNotesSubject(subjectName);
    const existingNotes = state.subjectNotes?.[subjectName] || { studentNote: '', teacherNote: '' };
    setStudentNoteDraft(existingNotes.studentNote || '');
    setTeacherNoteDraft(existingNotes.teacherNote || '');
  };

  const handleSaveNotes = () => {
    if (activeNotesSubject && onUpdateSubjectNotes) {
      onUpdateSubjectNotes(activeNotesSubject, {
        studentNote: studentNoteDraft,
        teacherNote: teacherNoteDraft
      });
      setActiveNotesSubject(null);
    }
  };

  // Widget Configuration State (Persisted in Cloud / Firestore with localStorage fallback)
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    const cloudWidgets = state.dashboardWidgets || currentUser?.dashboardWidgets;
    if (cloudWidgets && Array.isArray(cloudWidgets) && cloudWidgets.length > 0) {
      return mergeWidgetsWithDefaults(cloudWidgets);
    }
    try {
      const saved = localStorage.getItem(DSH_STORAGE_KEY);
      if (saved) {
        const parsed: DashboardWidgetConfig[] = JSON.parse(saved);
        return mergeWidgetsWithDefaults(parsed);
      }
    } catch (err) {
      console.error('Failed to load dashboard widgets from localStorage', err);
    }
    return DEFAULT_DASHBOARD_WIDGETS;
  });

  // Sync with cloud state updates in real time
  useEffect(() => {
    const cloudWidgets = state.dashboardWidgets || currentUser?.dashboardWidgets;
    if (cloudWidgets && Array.isArray(cloudWidgets) && cloudWidgets.length > 0) {
      setWidgets(mergeWidgetsWithDefaults(cloudWidgets));
    }
  }, [state.dashboardWidgets, currentUser?.dashboardWidgets]);

  const handleSaveWidgets = (updated: DashboardWidgetConfig[]) => {
    setWidgets(updated);
    try {
      localStorage.setItem(DSH_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save dashboard widgets to localStorage', err);
    }
    if (onUpdateDashboardWidgets) {
      onUpdateDashboardWidgets(updated);
    }
  };

  const handleResetWidgets = () => {
    setWidgets(DEFAULT_DASHBOARD_WIDGETS);
    try {
      localStorage.removeItem(DSH_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to reset dashboard widgets', err);
    }
    if (onUpdateDashboardWidgets) {
      onUpdateDashboardWidgets(DEFAULT_DASHBOARD_WIDGETS);
    }
  };

  // Routines State and Helpers
  const DEFAULT_ROUTINES = [
    { id: 'rot-1', title: 'Paragraf Çözümü', target: '20 Soru', completedDays: [] },
    { id: 'rot-2', title: 'Problem Çözümü', target: '15 Soru', completedDays: [] },
    { id: 'rot-3', title: 'Geometri Rutini', target: '10 Soru', completedDays: [] }
  ];

  const rawRoutines = state.routines && state.routines.length > 0 ? state.routines : DEFAULT_ROUTINES;
  const routines = rawRoutines.filter(r => !r.isDeleted);

  const getTurkishDayName = (): string => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const todayIndex = new Date().getDay();
    return days[todayIndex];
  };

  const todayDayName = getTurkishDayName();
  const todaysRoutinesCount = routines.length;
  const todaysCompletedCount = routines.filter(r => r.completedDays?.includes(todayDayName)).length;
  const overallTotalCheckboxes = routines.length * 7;
  const overallCompletedCheckboxes = routines.reduce((acc, r) => acc + (r.completedDays?.length || 0), 0);
  const overallPercent = overallTotalCheckboxes > 0 ? Math.round((overallCompletedCheckboxes / overallTotalCheckboxes) * 100) : 0;

  const handleToggleRoutineDay = (routineId: string, dayName: string) => {
    if (!onUpdateRoutines) return;
    
    let actionText = '';
    
    const updated = rawRoutines.map(r => {
      if (r.id === routineId) {
        const completed = r.completedDays || [];
        const isCompleted = completed.includes(dayName);
        
        if (isCompleted) {
          actionText = `"${r.title}" rutini (${dayName}) için tamamlanmadı olarak işaretlendi.`;
        } else {
          actionText = `"${r.title}" rutini (${dayName}) için tamamlandı olarak işaretlendi.`;
        }
        
        return {
          ...r,
          completedDays: isCompleted 
            ? completed.filter(d => d !== dayName)
            : [...completed, dayName]
        };
      }
      return r;
    });
    
    onUpdateRoutines(updated, actionText);
  };

  // Countdown to 19 June 2027
  const [daysLeft, setDaysLeft] = useState(0);
  const [timeBreakdown, setTimeBreakdown] = useState<{ months: number; days: number }>({ months: 0, days: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const savedDateStr = localStorage.getItem('yks_target_date') || '2027-06-19';
      const yksTargetDate = new Date(`${savedDateStr}T10:00:00`);
      const now = new Date();
      const diff = yksTargetDate.getTime() - now.getTime();
      if (diff > 0) {
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        setDaysLeft(days);

        let months = (yksTargetDate.getFullYear() - now.getFullYear()) * 12 + (yksTargetDate.getMonth() - now.getMonth());
        let tempDate = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
        if (tempDate > yksTargetDate) {
          months--;
          tempDate = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
        }
        const remDays = Math.floor((yksTargetDate.getTime() - tempDate.getTime()) / (1000 * 60 * 60 * 24));
        setTimeBreakdown({ months, days: remDays });
      } else {
        setDaysLeft(0);
        setTimeBreakdown({ months: 0, days: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    window.addEventListener('yks_settings_updated', updateTimer);
    return () => {
      clearInterval(interval);
      window.removeEventListener('yks_settings_updated', updateTimer);
    };
  }, []);

  // General KPI Calculations - Last 7 days question logs
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const sevenDaysCutoffStr = sevenDaysAgo.toISOString().split('T')[0];

  const last7DaysQuestionLogs = questionLogs.filter((q) => q.date && q.date >= sevenDaysCutoffStr);
  const logsFor7Days = last7DaysQuestionLogs.length > 0 ? last7DaysQuestionLogs : questionLogs.slice(-7);

  const totalQuestionsSolved = logsFor7Days.reduce((acc, q) => acc + q.solvedCount, 0);
  const totalQuestionsTarget = logsFor7Days.reduce((acc, q) => acc + q.targetCount, 0);
  const questionTargetPercent = totalQuestionsTarget > 0 
    ? Math.round((totalQuestionsSolved / totalQuestionsTarget) * 100) 
    : 0;

  const latestMock = generalMocks.length > 0 ? generalMocks[generalMocks.length - 1] : null;
  const latestTYTNet = latestMock ? latestMock.tyt.totalNet : 0;
  const latestAYTNet = latestMock ? latestMock.ayt.totalNet : 0;

  const pendingTopicErrors = topicErrors.filter((e) => !e.revised);

  // Resource Tracking stats
  const totalResources = resources.length;
  const completedResources = resources.filter((r) => r.status === 'completed').length;
  
  let totalResourceUnits = 0;
  let completedResourceUnits = 0;
  resources.forEach((r) => {
    const comp = r.completedTopics ? r.completedTopics.length : (r.completedUnits || 0);
    const tot = r.totalUnits || 1;
    completedResourceUnits += comp;
    totalResourceUnits += tot;
  });
  const resourcePercent = totalResourceUnits > 0 
    ? Math.min(100, Math.round((completedResourceUnits / totalResourceUnits) * 100))
    : 0;

  // Individual Widget Renderers

  const renderCountdownBar = () => (
    <div 
      className="bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg flex items-center justify-between gap-2 sm:gap-4 relative z-40 group cursor-pointer flex-nowrap whitespace-nowrap"
      title={`Sınav Tarihi: 19 Haziran 2027 • Kalan Süre: ${timeBreakdown.months} Ay ${timeBreakdown.days} Gün (Toplam ${daysLeft} Gün)`}
    >
      <div className="flex items-center space-x-2 sm:space-x-3 shrink min-w-0 overflow-hidden">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
          <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
        </div>
        <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate whitespace-nowrap">
          YKS Sınavına Kalan Süre:
        </span>
      </div>

      <div className="relative shrink-0">
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 sm:px-3.5 sm:py-1 rounded-xl shrink-0 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/50 transition-all">
          <span className="text-sm sm:text-lg font-black text-emerald-400 font-mono">{daysLeft}</span>
          <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase">GÜN</span>
        </div>

        <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col bg-slate-950 border border-emerald-500/40 p-3 rounded-2xl shadow-2xl z-50 min-w-[220px] pointer-events-none animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sınav Detayı</span>
          </div>
          <div className="text-xs font-medium text-slate-200">
            Sınav Tarihi: <span className="font-bold text-white">19 Haziran 2027</span>
          </div>
          <div className="text-xs font-medium text-slate-200 mt-1">
            Kalan Süre: <span className="font-bold text-emerald-300">{timeBreakdown.months} Ay {timeBreakdown.days} Gün</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800">
            Toplam {daysLeft} gün kaldı
          </div>
        </div>
      </div>
    </div>
  );

  const renderTargetBanner = () => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 relative z-10">
        <div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-indigo-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            <span>YKS Derece Hedef Tablosu</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 my-0.5 sm:my-1">
            <UniversityLogo 
              universityName={profile.targetUniversity} 
              sizeClassName="w-6 h-6 sm:w-10 sm:h-10 shrink-0" 
              opacityClassName="opacity-90 hover:opacity-100" 
            />
            <h1 className="text-lg sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight target-uni-title">
              {profile.targetUniversity || 'Üniversite Hedefi'}
            </h1>
          </div>
          <p className="text-slate-300 text-[10px] sm:text-sm mt-0.5 sm:mt-1 flex items-center flex-nowrap whitespace-nowrap overflow-hidden gap-1 sm:gap-2">
            <span className="truncate">{profile.targetDepartment || 'Bölüm Hedefi'}</span>
            <span className="shrink-0">•</span>
            <span className="text-emerald-400 font-semibold font-mono shrink-0">Hedef Sıralama: #{profile.targetRank}</span>
            {profile.targetField && (
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold font-mono shrink-0">
                {profile.targetField}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 bg-white/10 backdrop-blur-md p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/15 shadow-inner">
          <div className="text-center px-1.5 sm:px-3 border-r border-white/15">
            <div className="text-[10px] sm:text-xs text-slate-300">Hedef TYT</div>
            <div className="text-base sm:text-xl font-bold text-indigo-400 font-mono">{profile.targetTYTNet}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Mevcut: <span className="text-white font-semibold">{latestTYTNet}</span></div>
          </div>

          <div className="text-center px-1.5 sm:px-3 border-r border-white/15">
            <div className="text-[10px] sm:text-xs text-slate-300">Hedef AYT</div>
            <div className="text-base sm:text-xl font-bold text-emerald-400 font-mono">{profile.targetAYTNet}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Mevcut: <span className="text-white font-semibold">{latestAYTNet}</span></div>
          </div>

          <div className="text-center px-1.5 sm:px-3">
            <div className="text-[10px] sm:text-xs text-slate-300">OBP</div>
            <div className="text-base sm:text-xl font-bold text-amber-400 font-mono">{profile.highSchoolGpa || '85.0'}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Diploma</div>
          </div>

          <button
            type="button"
            onClick={() => setShowTargetModal(true)}
            className="ml-1 sm:ml-2 bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-400/40 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Düzenle</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderDailyRoutines = () => (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl space-y-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-base font-bold text-white flex items-center space-x-1.5 truncate">
              <span className="truncate">Günlük Rutin Özeti</span>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                {todayDayName}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 hidden md:block truncate">
              Bugün için tanımlı rutinler ve tek tıkla tamamlama listesi
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            <span className="text-slate-400">Bugün: <strong className="text-white font-mono">{todaysCompletedCount}/{todaysRoutinesCount}</strong></span>
            <span className="text-slate-400">Haftalık: <strong className="text-emerald-400 font-mono">%{overallPercent}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('routines')}
            className="text-[11px] sm:text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span>Tüm Rutinler</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {routines.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {routines.map((r) => {
            const isDoneToday = r.completedDays?.includes(todayDayName);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleToggleRoutineDay(r.id, todayDayName)}
                className={`flex items-center justify-between text-xs p-3.5 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                  isDoneToday
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 mr-2.5 flex-1">
                  <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                    isDoneToday 
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {isDoneToday && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold block text-xs sm:text-sm text-slate-100 leading-snug break-normal">{r.title}</span>
                    {r.target && <span className="text-[11px] text-slate-400 block mt-0.5 font-medium leading-tight">{r.target}</span>}
                  </div>
                </div>
                <span className={`text-[9.5px] px-2.5 py-1 rounded-full font-bold shrink-0 ${
                  isDoneToday 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {isDoneToday ? 'Tamamlandı' : 'Yapılmadı'}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic text-center py-2">Henüz eklentisi yapılmış bir rutin bulunmuyor.</p>
      )}
    </div>
  );

  const renderKpiQuestions = () => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Soru Hedef Başarısı (Son 7 Gün)</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {totalQuestionsSolved} <span className="text-xs font-normal text-slate-400">/ {totalQuestionsTarget} Soru</span>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm" 
            style={{ width: `${Math.min(questionTargetPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
          <span>Tamamlama</span>
          <span className="font-semibold text-indigo-300">%{questionTargetPercent}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onNavigateTab('questions')}
        className="text-[11px] text-indigo-300 hover:text-indigo-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
      >
        <span>Soru Takibine Git</span>
        <ArrowUpRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );

  const renderKpiMocks = () => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Son Deneme Performansı</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-bold text-white font-mono">TYT: {latestTYTNet}</span>
          <span className="text-sm font-semibold text-emerald-400 font-mono">AYT: {latestAYTNet}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 truncate">
          {latestMock ? latestMock.title : 'Henüz deneme girilmedi'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onNavigateTab('mocks')}
        className="text-[11px] text-indigo-300 hover:text-white font-medium flex items-center mt-3 transition-colors cursor-pointer"
      >
        <span>Deneme Grafiğini Gör</span>
        <ArrowUpRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );

  const renderKpiErrors = () => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Yanlış Defteri (Eksik Konular)</span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {pendingTopicErrors.length} <span className="text-xs font-normal text-slate-400">Bekleyen Hata</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {pendingTopicErrors.length > 0 ? 'Tekrar edilmeyi bekleyen yanlışlar var.' : 'Tüm yanlışlar tekrar edildi! 🎉'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onNavigateTab('errors')}
        className="text-[11px] text-rose-300 hover:text-rose-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
      >
        <span>Hata Defterine Git</span>
        <ArrowUpRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );

  const renderKpiResources = () => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Kaynak Takibi (Soru Bankaları)</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
            <BookCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {completedResources} <span className="text-xs font-normal text-slate-400">/ {totalResources} Kitap</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
          <span>Konu İlerlemesi:</span>
          <span className="font-bold text-amber-300">%{resourcePercent}</span>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full mt-1.5 overflow-hidden">
          <div 
            className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-sm" 
            style={{ width: `${resourcePercent}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onNavigateTab('resources')}
        className="text-[11px] text-amber-300 hover:text-amber-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
      >
        <span>Kaynak Takibine Git</span>
        <ArrowUpRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );

  {/* NEW WIDGET: Selected Subject Progress Card */}
  const renderSubjectProgressWidget = (config?: { subject?: string }) => {
    const selectedSubj = config?.subject || 'TYT Matematik';

    // Helper to get subject-specific icon and theme
    const getSubjectTheme = (subj: string) => {
      const normalized = subj.toLowerCase();
      if (normalized.includes('matematik') || normalized.includes('mat')) {
        return {
          icon: Calculator,
          textClass: 'text-cyan-400',
          hoverTextClass: 'hover:text-cyan-300',
          borderClass: 'border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-cyan-500/5',
          bgClass: 'bg-cyan-500/10 border-cyan-500/20',
          titleColor: 'text-cyan-300',
          badgeBg: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
          barColor: 'bg-cyan-400'
        };
      }
      if (normalized.includes('fizik') || normalized.includes('fiz')) {
        return {
          icon: Atom,
          textClass: 'text-indigo-400',
          hoverTextClass: 'hover:text-indigo-300',
          borderClass: 'border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-indigo-500/5',
          bgClass: 'bg-indigo-500/10 border-indigo-500/20',
          titleColor: 'text-indigo-300',
          badgeBg: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
          barColor: 'bg-indigo-400'
        };
      }
      if (normalized.includes('kimya') || normalized.includes('kim')) {
        return {
          icon: FlaskConical,
          textClass: 'text-emerald-400',
          hoverTextClass: 'hover:text-emerald-300',
          borderClass: 'border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-emerald-500/5',
          bgClass: 'bg-emerald-500/10 border-emerald-500/20',
          titleColor: 'text-emerald-300',
          badgeBg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
          barColor: 'bg-emerald-400'
        };
      }
      if (normalized.includes('biyoloji') || normalized.includes('biyo')) {
        return {
          icon: Dna,
          textClass: 'text-rose-400',
          hoverTextClass: 'hover:text-rose-300',
          borderClass: 'border-rose-500/30 hover:border-rose-400/50 hover:shadow-rose-500/5',
          bgClass: 'bg-rose-500/10 border-rose-500/20',
          titleColor: 'text-rose-300',
          badgeBg: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
          barColor: 'bg-rose-400'
        };
      }
      if (normalized.includes('geometri') || normalized.includes('geo')) {
        return {
          icon: Compass,
          textClass: 'text-amber-400',
          hoverTextClass: 'hover:text-amber-300',
          borderClass: 'border-amber-500/30 hover:border-amber-400/50 hover:shadow-amber-500/5',
          bgClass: 'bg-amber-500/10 border-amber-500/20',
          titleColor: 'text-amber-300',
          badgeBg: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
          barColor: 'bg-amber-400'
        };
      }
      if (normalized.includes('tarih') || normalized.includes('tar')) {
        return {
          icon: Scroll,
          textClass: 'text-orange-400',
          hoverTextClass: 'hover:text-orange-300',
          borderClass: 'border-orange-500/30 hover:border-orange-400/50 hover:shadow-orange-500/5',
          bgClass: 'bg-orange-500/10 border-orange-500/20',
          titleColor: 'text-orange-300',
          badgeBg: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
          barColor: 'bg-orange-400'
        };
      }
      if (normalized.includes('coğrafya') || normalized.includes('coğ')) {
        return {
          icon: Globe,
          textClass: 'text-blue-400',
          hoverTextClass: 'hover:text-blue-300',
          borderClass: 'border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/5',
          bgClass: 'bg-blue-500/10 border-blue-500/20',
          titleColor: 'text-blue-300',
          badgeBg: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
          barColor: 'bg-blue-400'
        };
      }
      if (normalized.includes('felsefe') || normalized.includes('fel')) {
        return {
          icon: Lightbulb,
          textClass: 'text-violet-400',
          hoverTextClass: 'hover:text-violet-300',
          borderClass: 'border-violet-500/30 hover:border-violet-400/50 hover:shadow-violet-500/5',
          bgClass: 'bg-violet-500/10 border-violet-500/20',
          titleColor: 'text-violet-300',
          badgeBg: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
          barColor: 'bg-violet-400'
        };
      }
      if (normalized.includes('türkçe') || normalized.includes('tür') || normalized.includes('edebiyat') || normalized.includes('edeb')) {
        return {
          icon: Languages,
          textClass: 'text-pink-400',
          hoverTextClass: 'hover:text-pink-300',
          borderClass: 'border-pink-500/30 hover:border-pink-400/50 hover:shadow-pink-500/5',
          bgClass: 'bg-pink-500/10 border-pink-500/20',
          titleColor: 'text-pink-300',
          badgeBg: 'bg-pink-500/20 border-pink-500/30 text-pink-300',
          barColor: 'bg-pink-400'
        };
      }
      if (normalized.includes('din') || normalized.includes('ahlak')) {
        return {
          icon: BookMarked,
          textClass: 'text-teal-400',
          hoverTextClass: 'hover:text-teal-300',
          borderClass: 'border-teal-500/30 hover:border-teal-400/50 hover:shadow-teal-500/5',
          bgClass: 'bg-teal-500/10 border-teal-500/20',
          titleColor: 'text-teal-300',
          badgeBg: 'bg-teal-500/20 border-teal-500/30 text-teal-300',
          barColor: 'bg-teal-400'
        };
      }
      return {
        icon: BookOpen,
        textClass: 'text-sky-400',
        hoverTextClass: 'hover:text-sky-300',
        borderClass: 'border-sky-500/30 hover:border-sky-400/50 hover:shadow-sky-500/5',
        bgClass: 'bg-sky-500/10 border-sky-500/20',
        titleColor: 'text-sky-300',
        badgeBg: 'bg-sky-500/20 border-sky-500/30 text-sky-300',
        barColor: 'bg-sky-400'
      };
    };

    const theme = getSubjectTheme(selectedSubj);
    const SubjectIcon = theme.icon;

    // Calculate logs & resources for this specific subject
    const subjLogs = questionLogs.filter(q => q.subject.toLowerCase() === selectedSubj.toLowerCase());
    const subjSolved = subjLogs.reduce((acc, q) => acc + q.solvedCount, 0);
    const subjCorrect = subjLogs.reduce((acc, q) => acc + q.correctCount, 0);
    const accuracy = subjSolved > 0 ? Math.round((subjCorrect / subjSolved) * 100) : 0;

    const subjResources = resources.filter(r => r.subject.toLowerCase() === selectedSubj.toLowerCase());
    const totalSubjUnits = subjResources.reduce((acc, r) => acc + (r.totalUnits || 1), 0);
    const completedSubjUnits = subjResources.reduce((acc, r) => acc + (r.completedTopics ? r.completedTopics.length : (r.completedUnits || 0)), 0);
    const subjResourcePercent = totalSubjUnits > 0 ? Math.min(100, Math.round((completedSubjUnits / totalSubjUnits) * 100)) : 0;

    const subjNotes = state.subjectNotes?.[selectedSubj] || { studentNote: '', teacherNote: '' };
    const hasNote = !!(subjNotes.studentNote || subjNotes.teacherNote);

    return (
      <div className={`bg-white/5 backdrop-blur-md border ${theme.borderClass} rounded-2xl p-5 shadow-xl transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl flex flex-col justify-between`}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-xl ${theme.bgClass} ${theme.textClass} flex items-center justify-center shrink-0`}>
                <SubjectIcon className="w-4.5 h-4.5" />
              </div>
              <span className={`text-xs font-bold ${theme.titleColor} truncate`} title={`${selectedSubj} İlerlemesi`}>
                {selectedSubj}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenNotesModal(selectedSubj);
                }}
                title="Ders Notları ve Koç Notu"
                className={`relative p-1 rounded-lg bg-white/5 hover:bg-white/10 ${theme.textClass} ${theme.hoverTextClass} transition-all shrink-0 cursor-pointer`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                {hasNote && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>

          </div>

          <div className="text-2xl font-bold text-white font-mono">
            %{subjResourcePercent} <span className="text-xs font-normal text-slate-400">Konu Bitti</span>
          </div>

          <div className="w-full bg-white/10 h-2 rounded-full mt-2.5 overflow-hidden">
            <div 
              className={`${theme.barColor} h-full rounded-full transition-all duration-500 shadow-sm`} 
              style={{ width: `${subjResourcePercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block">Çözülen Soru:</span>
              <strong className="text-white font-mono">{subjSolved} Soru</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Doğru Oranı:</span>
              <strong className="text-emerald-400 font-mono">%{accuracy}</strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('subject_progress')}
          className={`text-[11px] ${theme.textClass} ${theme.hoverTextClass} font-medium flex items-center mt-3 transition-colors cursor-pointer`}
        >
          <span>Tüm Müfredatı Detaylı İncele</span>
          <ArrowUpRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    );
  };

  {/* NEW WIDGET: Branch Exams Summary */}
  const renderBranchExamsWidget = () => {
    const totalBranchCount = branchExams.length;
    const avgNet = totalBranchCount > 0 
      ? (branchExams.reduce((acc, b) => acc + b.net, 0) / totalBranchCount).toFixed(1)
      : '0';

    return (
      <div className="bg-white/5 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-5 shadow-xl hover:border-emerald-400/50 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Branş Denemeleri</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalBranchCount} <span className="text-xs font-normal text-slate-400">Deneme Çözüldü</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 mt-2">
            <span>Ortalama Net:</span>
            <span className="font-bold text-emerald-400 font-mono">{avgNet} Net</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {totalBranchCount > 0 ? `Son: ${branchExams[branchExams.length - 1].subject} (${branchExams[branchExams.length - 1].net} Net)` : 'Henüz branş denemesi eklenmedi'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('branches')}
          className="text-[11px] text-emerald-300 hover:text-emerald-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
        >
          <span>Branş Denemelerine Git</span>
          <ArrowUpRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    );
  };

  {/* NEW WIDGET: Past Exams (ÖSYM) Summary */}
  const renderPastExamsWidget = () => {
    const solvedPastExams = pastExams.filter(p => p.solved);
    const totalPast = pastExams.length > 0 ? pastExams.length : 24;
    const pastPercent = Math.round((solvedPastExams.length / totalPast) * 100);

    return (
      <div className="bg-white/5 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 shadow-xl hover:border-amber-400/50 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">ÖSYM Çıkmış Sorular</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {solvedPastExams.length} <span className="text-xs font-normal text-slate-400">/ {totalPast} Yıl/Ders</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-sm" 
              style={{ width: `${Math.min(pastPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
            <span>Çözülme Oranı</span>
            <span className="font-semibold text-amber-300">%{pastPercent}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('past_questions')}
          className="text-[11px] text-amber-300 hover:text-amber-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
        >
          <span>Çıkmış Sorular Tablosuna Git</span>
          <ArrowUpRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    );
  };

  {/* NEW WIDGET: Video Lessons & Playlists */}
  const renderVideoLessonsWidget = () => {
    const totalVideos = youtubeVideos.length;
    const watchedVideos = youtubeVideos.filter(v => v.isWatched).length;
    const videoPercent = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;

    return (
      <div className="bg-white/5 backdrop-blur-md border border-purple-500/30 rounded-2xl p-5 shadow-xl hover:border-purple-400/50 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Video Ders & Oynatma Listesi</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {watchedVideos} <span className="text-xs font-normal text-slate-400">/ {totalVideos} İzlenen Ders</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-purple-400 h-full rounded-full transition-all duration-500 shadow-sm" 
              style={{ width: `${Math.min(videoPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
            <span>İzleme Tamamlama</span>
            <span className="font-semibold text-purple-300">%{videoPercent}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('youtube')}
          className="text-[11px] text-purple-300 hover:text-purple-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
        >
          <span>Ders Videolarına Git</span>
          <ArrowUpRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    );
  };

  {/* NEW WIDGET: Pomodoro Focus Stats */}
  const renderPomodoroStatsWidget = () => {
    // Calculated total planned study minutes completed
    const completedMinutes = studyPlans
      .filter(p => p.status === 'completed')
      .reduce((acc, p) => acc + (p.completedMinutes || p.plannedMinutes || 0), 0);
    
    const focusHours = (completedMinutes / 60).toFixed(1);

    return (
      <div className="bg-white/5 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-5 shadow-xl hover:border-indigo-400/50 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Pomodoro Odaklanma Saati</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {focusHours} <span className="text-xs font-normal text-slate-400">Saat Odaklanıldı</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Kronometre ile kaydedilen ve tamamlanan çalışma süreleri toplamı
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('pomodoro')}
          className="text-[11px] text-indigo-300 hover:text-indigo-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
        >
          <span>Pomodoro Odasına Git</span>
          <ArrowUpRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    );
  };

  {/* NEW WIDGET: Mock Exam Trend Chart (Recharts) */}
  const renderMockChartWidget = () => {
    const last7Mocks = generalMocks.slice(-7);
    const chartData = last7Mocks.map((m, idx) => ({
      name: m.title.length > 12 ? `D-${generalMocks.length - last7Mocks.length + idx + 1}` : m.title,
      TYT: m.tyt.totalNet,
      AYT: m.ayt.totalNet
    }));

    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Deneme Net İlerleme Grafiği</h3>
              <p className="text-[11px] text-slate-400">Son 7 genel deneme sınavında zamana göre TYT ve AYT net değişimi</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('mocks')}
            className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition-all cursor-pointer"
          >
            <span>Tüm Denemeler</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {chartData.length > 0 ? (
          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTYT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAYT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="TYT" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTYT)" />
                <Area type="monotone" dataKey="AYT" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAYT)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-xs text-slate-400 italic bg-slate-950/40 rounded-2xl border border-slate-800">
            Grafik oluşturmak için henüz kaydedilmiş deneme sınavı bulunmuyor.
          </div>
        )}
      </div>
    );
  };

  {/* NEW WIDGET: Error Reasons Distribution Chart */}
  const renderErrorReasonsWidget = () => {
    // Count reasons
    const counts: Record<string, number> = {};
    topicErrors.forEach(err => {
      const reason = err.errorReason || 'bilgi_eksigi';
      counts[reason] = (counts[reason] || 0) + 1;
    });

    const pieData = Object.keys(ERROR_REASON_LABELS).map(key => ({
      key,
      name: ERROR_REASON_LABELS[key].label,
      value: counts[key] || 0,
      color: ERROR_REASON_LABELS[key].color
    })).filter(d => d.value > 0);

    const totalErrorsCount = topicErrors.length;

    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-rose-500/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base font-bold text-white truncate">Yanlış Nedenleri Analizi</h3>
              <p className="text-[11px] text-slate-400 hidden md:block truncate">Hatalı çözülen soruların kök neden dağılımı</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('errors')}
            className="text-[11px] sm:text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span>Hata Defteri</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {totalErrorsCount > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {pieData.map((d) => {
                const pct = Math.round((d.value / totalErrorsCount) * 100);
                return (
                  <div key={d.key} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-300 font-medium">{d.name}</span>
                    </div>
                    <span className="font-bold text-white font-mono">{d.value} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-xs text-slate-400 italic bg-slate-950/40 rounded-2xl border border-slate-800">
            Hata nedeni analizi için henüz yanlış soru kaydı bulunmuyor.
          </div>
        )}

        {/* Son 3 Hata Özeti Listesi */}
        {topicErrors.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Son 3 Yanlış Soru & Hata Sebebi:</span>
              <button
                type="button"
                onClick={() => onNavigateTab('errors')}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold transition-colors cursor-pointer"
              >
                Tüm Hatalar ({topicErrors.length}) &rarr;
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[...topicErrors]
                .map((err, index) => ({ err, index }))
                .sort((a, b) => {
                  const timeA = new Date(a.err.date || 0).getTime();
                  const timeB = new Date(b.err.date || 0).getTime();
                  if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
                    return timeB - timeA;
                  }
                  return b.index - a.index;
                })
                .slice(0, 3)
                .map(({ err }) => {
                  const reasonLabel = ERROR_REASON_LABELS[err.errorReason]?.label || err.errorReason || 'Bilgi Eksikliği';
                  const noteText = err.solutionNotes || (err as any).notes;

                  return (
                    <div key={err.id} className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
                          <span className="font-bold text-white text-xs shrink-0">{err.subject}</span>
                          <span className="text-[10px] text-slate-500 hidden xs:inline">•</span>
                          <span className="text-slate-300 text-xs truncate max-w-full">{err.topicName || (err as any).topic}</span>
                        </div>
                        {noteText && (
                          <p className="text-[11px] text-slate-400 truncate italic">
                            "{noteText}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-1.5 sm:pt-0 border-t border-slate-900 sm:border-t-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 truncate max-w-[200px]">
                          {reasonLabel}
                        </span>
                        {err.revised ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">Tekrar Edildi</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md shrink-0">Bekliyor</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper for schedule widget (Yesterday, Today, Tomorrow)
  const getScheduleDayData = (offset: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offset);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const isoDateStr = `${year}-${month}-${day}`;

    const daysMap: DayOfWeek[] = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const dayName = daysMap[targetDate.getDay()];

    const activePlans = (studyPlans || []).filter(p => !p.archived);

    // Get ISO date strings for yesterday, today, and tomorrow
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayIso = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;

    const todayObj = new Date();
    const todayIso = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowIso = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;

    const matchedPlans = activePlans.filter(p => {
      const planDayClean = p.day ? p.day.trim().toLocaleLowerCase('tr-TR') : '';
      const targetDayClean = (dayName || '').trim().toLocaleLowerCase('tr-TR');
      const planDateIso = p.date ? p.date.split('T')[0].trim() : '';

      // 1. Exact ISO date match
      if (planDateIso && planDateIso === isoDateStr) {
        return true;
      }

      // 2. Day name match (e.g. 'pazartesi' === 'pazartesi')
      if (planDayClean && planDayClean === targetDayClean) {
        // If the plan explicitly has a date that belongs to another day in the 3-day (yesterday/today/tomorrow) window, don't include it here
        if (offset === 0 && planDateIso && (planDateIso === yesterdayIso || planDateIso === tomorrowIso)) {
          return false;
        }
        if (offset === -1 && planDateIso && (planDateIso === todayIso || planDateIso === tomorrowIso)) {
          return false;
        }
        if (offset === 1 && planDateIso && (planDateIso === todayIso || planDateIso === yesterdayIso)) {
          return false;
        }
        return true;
      }

      return false;
    });

    const completedCount = matchedPlans.filter(p => 
      p.status === 'completed' || p.reflection === 'Çalıştım' || p.reflection === 'Uzmanlaştım'
    ).length;
    const totalMinutes = matchedPlans.reduce((acc, p) => acc + (p.plannedMinutes || 0), 0);
    const totalQuestions = matchedPlans.reduce((acc, p) => acc + (p.targetQuestionCount || 0), 0);

    const formattedDate = targetDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

    return {
      offset,
      isoDateStr,
      dayName,
      formattedDate,
      plans: matchedPlans,
      completedCount,
      totalCount: matchedPlans.length,
      totalMinutes,
      totalQuestions
    };
  };

  const renderWeeklySchedule = () => {
    const yesterdayData = getScheduleDayData(-1);
    const todayData = getScheduleDayData(0);
    const tomorrowData = getScheduleDayData(1);

    const activeData = scheduleDayTab === 'yesterday' 
      ? yesterdayData 
      : scheduleDayTab === 'tomorrow' 
      ? tomorrowData 
      : todayData;

    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-cyan-400" />
              <span>Dün, Bugün & Yarın Çalışma Özeti</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Günlük yapılalacak dersler ve çalışma durumu takibi
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* View Mode Toggle (Tabs vs Grid) */}
            <div className="hidden sm:flex items-center bg-slate-900/60 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setScheduleViewMode('tabs')}
                title="Sekmeli Görünüm"
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 cursor-pointer ${
                  scheduleViewMode === 'tabs' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Sekmeli</span>
              </button>
              <button
                type="button"
                onClick={() => setScheduleViewMode('grid')}
                title="3 Gün Yan Yana Görünüm"
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 cursor-pointer ${
                  scheduleViewMode === 'grid' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>3 Günlük Akış</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('planner')}
              className="text-xs bg-white/10 hover:bg-white/15 text-indigo-300 border border-white/15 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all font-semibold flex items-center space-x-1 backdrop-blur-md cursor-pointer"
            >
              <span>Tüm Program</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TABBED VIEW MODE */}
        {scheduleViewMode === 'tabs' && (
          <div className="space-y-4">
            
            {/* Day Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900/60 rounded-2xl border border-white/10">
              
              {/* Yesterday Tab */}
              <button
                type="button"
                onClick={() => setScheduleDayTab('yesterday')}
                className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                  scheduleDayTab === 'yesterday'
                    ? 'bg-gradient-to-r from-slate-800 to-slate-800 text-white border border-slate-700 shadow-md ring-1 ring-slate-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span className="text-xs font-bold">Dün</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{yesterdayData.dayName}</span>
                <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-mono font-semibold ${
                  yesterdayData.completedCount === yesterdayData.totalCount && yesterdayData.totalCount > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/10 text-slate-300'
                }`}>
                  {yesterdayData.completedCount}/{yesterdayData.totalCount} Tamam
                </span>
              </button>

              {/* Today Tab */}
              <button
                type="button"
                onClick={() => setScheduleDayTab('today')}
                className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                  scheduleDayTab === 'today'
                    ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 text-white border border-cyan-500/50 shadow-lg ring-2 ring-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-cyan-300">Bugün</span>
                  <span className="text-[10px]">⭐</span>
                </div>
                <span className="text-[10px] text-cyan-200/80 mt-0.5">{todayData.dayName}</span>
                <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-mono font-semibold ${
                  todayData.completedCount === todayData.totalCount && todayData.totalCount > 0
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}>
                  {todayData.completedCount}/{todayData.totalCount} Tamam
                </span>
              </button>

              {/* Tomorrow Tab */}
              <button
                type="button"
                onClick={() => setScheduleDayTab('tomorrow')}
                className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                  scheduleDayTab === 'tomorrow'
                    ? 'bg-gradient-to-r from-slate-800 to-slate-800 text-white border border-slate-700 shadow-md ring-1 ring-slate-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span className="text-xs font-bold">Yarın</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{tomorrowData.dayName}</span>
                <span className="text-[10px] mt-1 px-2 py-0.5 rounded-full font-mono font-semibold bg-white/10 text-slate-300">
                  {tomorrowData.totalCount} Görev
                </span>
              </button>

            </div>

            {/* Selected Day Info Banner */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">{activeData.formattedDate}, {activeData.dayName}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({activeData.totalCount} Çalışma Planı)
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                {activeData.totalMinutes > 0 && (
                  <span className="text-slate-300 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{activeData.totalMinutes} dk Hedef</span>
                  </span>
                )}
                {activeData.totalQuestions > 0 && (
                  <span className="text-slate-300 flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{activeData.totalQuestions} Soru</span>
                  </span>
                )}
              </div>
            </div>

            {/* Day Task List */}
            {activeData.plans.length > 0 ? (
              <div className="space-y-2.5">
                {activeData.plans.map((plan) => {
                  const isCompleted = plan.status === 'completed' || plan.reflection === 'Çalıştım' || plan.reflection === 'Uzmanlaştım';
                  const isInProgress = plan.status === 'in_progress';
                  const isPostponed = plan.reflection === 'Erteledim';
                  const isHard = plan.reflection === 'Zor Geldi';

                  return (
                    <div 
                      key={plan.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all gap-3 ${
                        isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
                          : isInProgress
                          ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        {/* Status Icon */}
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : isInProgress ? (
                            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                          ) : (
                            <Clock className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                              {plan.subject}
                            </span>
                            {plan.taskType && (
                              <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-md font-medium">
                                {plan.taskType}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-semibold text-white truncate">
                            {plan.topic}
                          </div>

                          {plan.notes && (
                            <div className="text-[11px] text-slate-400 line-clamp-1 italic">
                              "{plan.notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Meta Info & Status Tag */}
                      <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-300">
                          {plan.plannedMinutes > 0 && <span>{plan.plannedMinutes} dk</span>}
                          {plan.targetQuestionCount && plan.targetQuestionCount > 0 && (
                            <span className="text-cyan-300">• {plan.targetQuestionCount} Soru</span>
                          )}
                        </div>

                        {/* Status Pill */}
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border backdrop-blur-md shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : isInProgress
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : isPostponed
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                            : isHard
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {isCompleted ? 'Tamamlandı' : isInProgress ? 'Devam Ediyor' : isPostponed ? 'Erteledim' : isHard ? 'Zor Geldi' : 'Bekliyor'}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State for Selected Day */
              <div className="text-center py-8 px-4 bg-white/5 rounded-2xl border border-dashed border-white/10 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    {activeData.formattedDate} için ders planı bulunmuyor
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Çalışma programınıza yeni konu anlatımı veya soru çözümü eklemek için planlayıcıyı kullanabilirsiniz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('planner')}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Bu Güne Ders Ekle</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* GRID VIEW MODE (3 Days Side by Side) */}
        {scheduleViewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[yesterdayData, todayData, tomorrowData].map((dayData) => {
              const isToday = dayData.offset === 0;
              const isYesterday = dayData.offset === -1;

              return (
                <div 
                  key={dayData.offset}
                  className={`rounded-2xl p-4 border flex flex-col justify-between space-y-3 ${
                    isToday
                      ? 'bg-gradient-to-b from-cyan-950/30 to-slate-900/60 border-cyan-500/40 shadow-lg ring-1 ring-cyan-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div>
                    {/* Day Column Header */}
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs font-bold ${isToday ? 'text-cyan-300' : 'text-white'}`}>
                          {isYesterday ? 'Dün' : isToday ? 'Bugün ⭐' : 'Yarın'}
                        </span>
                        <span className="text-[10px] text-slate-400">({dayData.dayName})</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {dayData.completedCount}/{dayData.totalCount}
                      </span>
                    </div>

                    {/* Compact Task List */}
                    {dayData.plans.length > 0 ? (
                      <div className="space-y-2">
                        {dayData.plans.map((p) => {
                          const isDone = p.status === 'completed' || p.reflection === 'Çalıştım' || p.reflection === 'Uzmanlaştım';
                          return (
                            <div 
                              key={p.id}
                              className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                                isDone 
                                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                                  : 'bg-slate-950/60 border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-cyan-300 truncate text-[11px]">{p.subject}</span>
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-mono">{p.plannedMinutes}dk</span>
                                )}
                              </div>
                              <div className="text-[11px] font-medium text-slate-200 truncate">{p.topic}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-[11px] text-slate-500 italic">
                        Planlanmış ders yok
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setScheduleDayTab(isYesterday ? 'yesterday' : isToday ? 'today' : 'tomorrow');
                      setScheduleViewMode('tabs');
                    }}
                    className="w-full text-center py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    Detayları Göster
                  </button>

                </div>
              );
            })}
          </div>
        )}

      </div>
    );
  };

  const renderCoachNotes = () => (
    <div className="bg-indigo-600/20 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center space-x-2 text-indigo-300 mb-3">
        <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-bold text-white">Sınıf Rehber Öğretmeninin Değerlendirmesi</h3>
      </div>
      
      <p className="text-xs text-indigo-100 leading-relaxed italic bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
        "{profile.coachNotes || 'Koçunuz henüz özel bir değerlendirme notu eklemedi.'}"
      </p>

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-slate-300">Koç: <strong className="text-white">{profile.coachName || 'Atanmadı'}</strong></span>
        <button
          type="button"
          onClick={() => onNavigateTab('ai_coach')}
          className="text-purple-300 hover:text-white font-semibold flex items-center space-x-1 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>Yapay Zeka Analizi</span>
        </button>
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 space-y-2.5 shadow-xl">
      <div className="text-xs font-semibold text-slate-400 px-1 mb-2">Hızlı İşlemler</div>

      <button
        type="button"
        onClick={() => onNavigateTab('pomodoro')}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 backdrop-blur-md border border-indigo-500/30 rounded-2xl text-xs font-semibold text-indigo-200 transition-all shadow-md cursor-pointer"
      >
        <span className="flex items-center space-x-2">
          <Play className="w-4 h-4 text-indigo-400" />
          <span>Pomodoro Odaklanma Modu</span>
        </span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onNavigateTab('questions')}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-xs font-semibold text-slate-200 transition-all cursor-pointer"
      >
        <span>Günlük Soru Kaydı Ekle</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
      </button>

      <button
        type="button"
        onClick={() => onNavigateTab('mocks')}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-xs font-semibold text-slate-200 transition-all cursor-pointer"
      >
        <span>Yeni Genel Deneme Gir</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
      </button>
    </div>
  );

  const renderAICoachSummaryWidget = () => {
    const latestAdvice = coachAdvices.length > 0 ? coachAdvices[coachAdvices.length - 1] : null;

    return (
      <div className="bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-slate-900 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Yapay Zeka Koç Analizi Özeti</h3>
                <p className="text-[11px] text-purple-300/80">
                  {latestAdvice?.timestamp ? `Son Analiz: ${latestAdvice.timestamp}` : 'Gemini AI Koç Değerlendirmesi'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('ai_coach')}
              className="text-xs bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition-all cursor-pointer"
            >
              <span>Koça Git</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {latestAdvice ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-200 leading-relaxed bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 italic">
                "{latestAdvice.generalEvaluation}"
              </p>

              {latestAdvice.actionPlan && latestAdvice.actionPlan.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                    Öne Çıkan Aksiyon Maddeleri:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {latestAdvice.actionPlan.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-purple-400 font-bold">•</span>
                        <span className="line-clamp-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
              <p className="text-xs text-slate-300 italic">
                Henüz Yapay Zeka Koç analizi oluşturulmadı. Performans verilerine göre kişiselleştirilmiş analiz almak için Yapay Zeka Koçu sekmesini ziyaret et.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('ai_coach')}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Yapay Zeka Analizi Başlat</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Kişisel Öğrenme Asistanı</span>
          <button
            type="button"
            onClick={() => onNavigateTab('ai_coach')}
            className="text-purple-300 hover:text-white font-medium transition-colors cursor-pointer"
          >
            Detaylı Raporu Oku &rarr;
          </button>
        </div>
      </div>
    );
  };

  const renderQuickNotesWidget = () => {
    const notesList = [...(quickNotes || [])].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const orderA = typeof a.order === 'number' ? a.order : 0;
      const orderB = typeof b.order === 'number' ? b.order : 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return b.id.localeCompare(a.id); // fallback to ID descending
    });

    const handleAddNote = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!newNoteText.trim()) return;

      const now = new Date();
      const dateStr = now.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const minOrder = quickNotes?.reduce((min, n) => (typeof n.order === 'number' && n.order < min) ? n.order : min, 0) || 0;

      const newNote: QuickNote = {
        id: 'note-' + Date.now(),
        text: newNoteText.trim(),
        createdAt: dateStr,
        color: newNoteColor,
        isPinned: false,
        order: minOrder - 1
      };

      const updated = [newNote, ...(quickNotes || [])];
      if (onUpdateQuickNotes) {
        onUpdateQuickNotes(updated, 'Yeni hızlı not eklendi.');
      }
      setNewNoteText('');
      setShowNoteForm(false);
    };

    const handleDeleteNote = (id: string) => {
      const updated = (quickNotes || []).filter(n => n.id !== id);
      if (onUpdateQuickNotes) {
        onUpdateQuickNotes(updated, 'Hızlı not silindi.');
      }
    };

    const handleTogglePin = (id: string) => {
      const updated = (quickNotes || []).map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n);
      if (onUpdateQuickNotes) {
        onUpdateQuickNotes(updated, 'Not iğne durumu değiştirildi.');
      }
    };

    const handleEditNote = (note: QuickNote) => {
      setEditingNoteId(note.id);
      setEditNoteText(note.text);
      setEditNoteColor(note.color || 'amber');
    };

    const handleSaveEdit = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!editingNoteId || !editNoteText.trim()) return;

      const updated = (quickNotes || []).map(n => 
        n.id === editingNoteId 
          ? { ...n, text: editNoteText.trim(), color: editNoteColor }
          : n
      );
      
      if (onUpdateQuickNotes) {
        onUpdateQuickNotes(updated, 'Not güncellendi.');
      }
      setEditingNoteId(null);
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedNoteId(id);
      e.dataTransfer.effectAllowed = 'move';
      // Firefox requires some data to be set
      e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = 'move';
      if (draggedNoteId === id) return;
      setDragOverNoteId(id);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverNoteId(null);
      
      if (!draggedNoteId || draggedNoteId === targetId) {
        setDraggedNoteId(null);
        return;
      }
      
      const currentIndex = notesList.findIndex(n => n.id === draggedNoteId);
      const targetIndex = notesList.findIndex(n => n.id === targetId);
      
      if (currentIndex === -1 || targetIndex === -1) return;
      
      const newNotesList = [...notesList];
      const [movedItem] = newNotesList.splice(currentIndex, 1);
      
      // Inherit pin status from the element at the target index (or keep own if none)
      const targetItem = notesList[targetIndex];
      movedItem.isPinned = targetItem?.isPinned ?? movedItem.isPinned;
      
      newNotesList.splice(targetIndex, 0, movedItem);
      
      const updatedNotesList = newNotesList.map((note, index) => ({
        ...note,
        order: index
      }));
      
      if (onUpdateQuickNotes) {
        onUpdateQuickNotes(updatedNotesList, 'Not sıralaması güncellendi.');
      }
      setDraggedNoteId(null);
    };

    const getColorStyles = (color: string = 'amber', isPinned: boolean = false) => {
      switch (color) {
        case 'emerald':
          return {
            bg: isPinned
              ? 'bg-emerald-900/80 border border-emerald-400 shadow-lg shadow-emerald-950/60'
              : 'bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 shadow-sm shadow-emerald-950/30',
            editBg: 'bg-emerald-950/60 border border-emerald-500/60 backdrop-blur-md shadow-lg shadow-emerald-950/50',
            textareaBg: 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-100 placeholder-emerald-300/40 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50',
            badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            dot: 'bg-emerald-400',
            pinText: 'text-emerald-300',
            pinBg: 'bg-emerald-500/25 border border-emerald-400/40'
          };
        case 'sky':
          return {
            bg: isPinned
              ? 'bg-sky-900/80 border border-sky-400 shadow-lg shadow-sky-950/60'
              : 'bg-sky-950/40 border border-sky-500/30 hover:border-sky-500/60 shadow-sm shadow-sky-950/30',
            editBg: 'bg-sky-950/60 border border-sky-500/60 backdrop-blur-md shadow-lg shadow-sky-950/50',
            textareaBg: 'bg-sky-950/70 border border-sky-500/40 text-sky-100 placeholder-sky-300/40 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50',
            badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
            dot: 'bg-sky-400',
            pinText: 'text-sky-300',
            pinBg: 'bg-sky-500/25 border border-sky-400/40'
          };
        case 'rose':
          return {
            bg: isPinned
              ? 'bg-rose-900/80 border border-rose-400 shadow-lg shadow-rose-950/60'
              : 'bg-rose-950/40 border border-rose-500/30 hover:border-rose-500/60 shadow-sm shadow-rose-950/30',
            editBg: 'bg-rose-950/60 border border-rose-500/60 backdrop-blur-md shadow-lg shadow-rose-950/50',
            textareaBg: 'bg-rose-950/70 border border-rose-500/40 text-rose-100 placeholder-rose-300/40 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50',
            badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            dot: 'bg-rose-400',
            pinText: 'text-rose-300',
            pinBg: 'bg-rose-500/25 border border-rose-400/40'
          };
        case 'purple':
          return {
            bg: isPinned
              ? 'bg-purple-900/80 border border-purple-400 shadow-lg shadow-purple-950/60'
              : 'bg-purple-950/40 border border-purple-500/30 hover:border-purple-500/60 shadow-sm shadow-purple-950/30',
            editBg: 'bg-purple-950/60 border border-purple-500/60 backdrop-blur-md shadow-lg shadow-purple-950/50',
            textareaBg: 'bg-purple-950/70 border border-purple-500/40 text-purple-100 placeholder-purple-300/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50',
            badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            dot: 'bg-purple-400',
            pinText: 'text-purple-300',
            pinBg: 'bg-purple-500/25 border border-purple-400/40'
          };
        case 'slate':
          return {
            bg: isPinned
              ? 'bg-slate-800/90 border border-slate-300 shadow-lg shadow-slate-950/60'
              : 'bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 shadow-sm shadow-slate-950/30',
            editBg: 'bg-slate-900/70 border border-slate-600/70 backdrop-blur-md shadow-lg shadow-slate-950/50',
            textareaBg: 'bg-slate-950/70 border border-slate-600/40 text-slate-100 placeholder-slate-400/40 focus:border-slate-300 focus:ring-1 focus:ring-slate-300/50',
            badge: 'bg-slate-800 text-slate-300 border-slate-700',
            dot: 'bg-slate-300',
            pinText: 'text-slate-200',
            pinBg: 'bg-slate-700/50 border border-slate-400/40'
          };
        case 'amber':
        default:
          return {
            bg: isPinned
              ? 'bg-amber-900/80 border border-amber-400 shadow-lg shadow-amber-950/60'
              : 'bg-amber-950/40 border border-amber-500/30 hover:border-amber-500/60 shadow-sm shadow-amber-950/30',
            editBg: 'bg-amber-950/60 border border-amber-500/60 backdrop-blur-md shadow-lg shadow-amber-950/50',
            textareaBg: 'bg-amber-950/70 border border-amber-500/40 text-amber-100 placeholder-amber-300/40 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50',
            badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            dot: 'bg-amber-400',
            pinText: 'text-amber-300',
            pinBg: 'bg-amber-500/25 border border-amber-400/40'
          };
      }
    };

    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
        {/* Glowing Background Effect */}
        <div className="absolute -right-12 -top-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner shrink-0">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Hızlı Notlarım</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {notesList.length} Not
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowNoteForm(prev => !prev)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shrink-0 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
          >
            {showNoteForm ? (
              <>
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Vazgeç</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Not Ekle</span>
              </>
            )}
          </button>
        </div>

        {/* Note Input Box - Expandable with effect */}
        <div 
          className={`transition-all duration-300 ease-in-out relative z-10 ${
            showNoteForm 
              ? 'max-h-72 opacity-100 transform translate-y-0 py-1 px-0.5' 
              : 'max-h-0 opacity-0 transform -translate-y-2 pointer-events-none overflow-hidden'
          }`}
        >
          {(() => {
            const newNoteStyles = getColorStyles(newNoteColor, false);
            return (
              <form onSubmit={handleAddNote} className={`space-y-2.5 p-3.5 rounded-2xl transition-all duration-300 ${newNoteStyles.editBg}`}>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                    placeholder="Akla gelen hızlı bir fikir veya hatırlatma yaz... (Enter ile kaydet)"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs transition-all duration-300 resize-none font-sans outline-none ${newNoteStyles.textareaBg}`}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Color Selector Dots */}
                  <div className="flex items-center space-x-1.5 bg-slate-950/70 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                    <span className="text-[10px] text-slate-300 font-semibold px-1">Renk:</span>
                    {(['amber', 'emerald', 'sky', 'rose', 'purple', 'slate'] as const).map((clr) => {
                      const colorMap = {
                        amber: 'bg-amber-400 shadow-amber-400/50',
                        emerald: 'bg-emerald-400 shadow-emerald-400/50',
                        sky: 'bg-sky-400 shadow-sky-400/50',
                        rose: 'bg-rose-400 shadow-rose-400/50',
                        purple: 'bg-purple-400 shadow-purple-400/50',
                        slate: 'bg-slate-300 shadow-slate-300/50'
                      };
                      const isSelected = newNoteColor === clr;
                      return (
                        <button
                          key={clr}
                          type="button"
                          onClick={() => setNewNoteColor(clr)}
                          className={`w-4 h-4 rounded-full ${colorMap[clr]} transition-all duration-200 cursor-pointer ${
                            isSelected 
                              ? 'ring-2 ring-white scale-125 shadow-lg z-10' 
                              : 'opacity-50 hover:opacity-100 hover:scale-110'
                          }`}
                          title={`${clr} rengini seç`}
                        />
                      );
                    })}
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Kaydet</span>
                  </button>
                </div>
              </form>
            );
          })()}
        </div>

        {/* Quick Notes Grid/List */}
        <div className="space-y-2 relative z-10">
          <AnimatePresence mode="popLayout">
            {notesList.length > 0 ? (
              notesList.map((note, index) => {
                const isEditing = editingNoteId === note.id;
                const activeColor = isEditing ? editNoteColor : (note.color || 'amber');
                const styles = getColorStyles(activeColor, note.isPinned);
                return (
                  <motion.div
                    layout
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    key={note.id}
                    draggable={!isEditing}
                    onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, note.id)}
                    onDragOver={(e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, note.id)}
                    onDragLeave={() => setDragOverNoteId(null)}
                    onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, note.id)}
                    onDragEnd={() => {
                      setDraggedNoteId(null);
                      setDragOverNoteId(null);
                    }}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 group relative transition-all duration-300 ease-in-out ${
                      dragOverNoteId === note.id ? 'ring-2 ring-indigo-500 shadow-xl opacity-50' : ''
                    } ${isEditing ? styles.editBg : styles.bg}`}
                  >
                    {isEditing ? (
                      <form onSubmit={handleSaveEdit} className="space-y-2.5">
                        <textarea
                          rows={2}
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit();
                            }
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-xs font-sans transition-all duration-300 resize-none outline-none ${styles.textareaBg}`}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-1.5 bg-slate-950/70 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                            <span className="text-[10px] text-slate-300 font-semibold px-1">Renk:</span>
                            {(['amber', 'emerald', 'sky', 'rose', 'purple', 'slate'] as const).map((clr) => {
                              const colorMap = {
                                amber: 'bg-amber-400 shadow-amber-400/50',
                                emerald: 'bg-emerald-400 shadow-emerald-400/50',
                                sky: 'bg-sky-400 shadow-sky-400/50',
                                rose: 'bg-rose-400 shadow-rose-400/50',
                                purple: 'bg-purple-400 shadow-purple-400/50',
                                slate: 'bg-slate-300 shadow-slate-300/50'
                              };
                              const isSelected = editNoteColor === clr;
                              return (
                                <button
                                  key={clr}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditNoteColor(clr);
                                  }}
                                  className={`w-4 h-4 rounded-full ${colorMap[clr]} transition-all duration-200 cursor-pointer ${
                                    isSelected 
                                      ? 'ring-2 ring-white scale-125 shadow-lg z-10' 
                                      : 'opacity-50 hover:opacity-100 hover:scale-110'
                                  }`}
                                  title={`${clr} rengine geç`}
                                />
                              );
                            })}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                              title="Vazgeç"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="submit"
                              disabled={!editNoteText.trim()}
                              className="p-1.5 rounded-lg text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                              title="Kaydet"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-slate-100 font-medium leading-relaxed whitespace-pre-wrap break-words flex-1 cursor-grab active:cursor-grabbing">
                            {note.text}
                          </p>
    
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleTogglePin(note.id)}
                                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                  note.isPinned
                                    ? `${styles.pinText} ${styles.pinBg}`
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                                title={note.isPinned ? 'İğneyi Kaldır' : 'Üste İğnele'}
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
      
                              {deletingNoteId === note.id ? (
                                <div className="flex items-center space-x-1 bg-rose-500/20 border border-rose-500/30 rounded-lg p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteNote(note.id);
                                      setDeletingNoteId(null);
                                    }}
                                    className="px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:text-rose-200 hover:bg-rose-500/30 rounded-md transition-colors cursor-pointer"
                                  >
                                    Sil
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingNoteId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingNoteId(note.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Notu Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            
                            {note.isPinned && (
                              <span className={`${styles.pinText} text-[9px] opacity-60 font-medium flex items-center space-x-0.5 pr-1`}>
                                <Pin className="w-2 h-2" />
                                <span>İğnelendi</span>
                              </span>
                            )}
                          </div>
                        </div>
    
                        <div className="flex items-end justify-between border-t border-white/5 pt-1.5 mt-2">
                          <div className="flex flex-col gap-1 opacity-60">
                            <span className="flex items-center space-x-1 text-[10px] text-slate-400 cursor-grab active:cursor-grabbing">
                              <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                              <span>{note.createdAt}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-0.5 opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              type="button"
                              onClick={() => {
                                if (index === notesList.length - 1) return;
                                const newNotesList = [...notesList];
                                const temp = newNotesList[index];
                                newNotesList[index] = newNotesList[index + 1];
                                newNotesList[index + 1] = temp;
                                
                                const updatedNotesList = newNotesList.map((n, i) => ({
                                  ...n,
                                  order: i
                                }));
                                
                                if (onUpdateQuickNotes) {
                                  onUpdateQuickNotes(updatedNotesList, 'Not sıralaması güncellendi.');
                                }
                              }}
                              disabled={index === notesList.length - 1}
                              className="p-1 text-slate-500 hover:text-white hover:bg-slate-800/80 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Aşağı Taşı"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (index === 0) return;
                                const newNotesList = [...notesList];
                                const temp = newNotesList[index];
                                newNotesList[index] = newNotesList[index - 1];
                                newNotesList[index - 1] = temp;
                                
                                const updatedNotesList = newNotesList.map((n, i) => ({
                                  ...n,
                                  order: i
                                }));
                                
                                if (onUpdateQuickNotes) {
                                  onUpdateQuickNotes(updatedNotesList, 'Not sıralaması güncellendi.');
                                }
                              }}
                              disabled={index === 0}
                              className="p-1 text-slate-500 hover:text-white hover:bg-slate-800/80 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Yukarı Taşı"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditNote(note)}
                              className="p-1 text-slate-500 hover:text-white hover:bg-slate-800/80 rounded-md transition-colors cursor-pointer ml-1"
                              title="Notu Düzenle"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-1.5">
                <StickyNote className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Henüz hızlı bir not almadın.</p>
                <p className="text-[10px] text-slate-500">
                  Akla gelen hedeflerini veya kısa hatırlatmalarını buraya yazarak doğrudan Firebase'e kaydedebilirsin.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderWidget = (widget: DashboardWidgetConfig) => {
    if (widget.id === 'subject_progress_widget' || widget.id.startsWith('subject_progress')) {
      return renderSubjectProgressWidget(widget.config);
    }
    switch (widget.id) {
      case 'countdown': return renderCountdownBar();
      case 'target_banner': return renderTargetBanner();
      case 'daily_routines': return renderDailyRoutines();
      case 'kpi_questions': return renderKpiQuestions();
      case 'kpi_mocks': return renderKpiMocks();
      case 'kpi_errors': return renderKpiErrors();
      case 'kpi_resources': return renderKpiResources();
      case 'branch_exams_widget': return renderBranchExamsWidget();
      case 'past_exams_widget': return renderPastExamsWidget();
      case 'video_lessons_widget': return renderVideoLessonsWidget();
      case 'pomodoro_stats_widget': return renderPomodoroStatsWidget();
      case 'mock_chart_widget': return renderMockChartWidget();
      case 'error_reasons_widget': return renderErrorReasonsWidget();
      case 'weekly_schedule': return renderWeeklySchedule();
      case 'coach_notes': return renderCoachNotes();
      case 'ai_coach_summary': return renderAICoachSummaryWidget();
      case 'quick_actions': return renderQuickActions();
      case 'quick_notes': return renderQuickNotesWidget();
      default: return null;
    }
  };

  const renderDashboardContent = () => {
    const activeWidgets = widgets.filter(w => w.visible).sort((a, b) => a.order - b.order);

    if (activeWidgets.length === 0) {
      return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-4 my-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Tüm Özet Modülleri Gizlendi</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Sayfada gösterilecek modül bulunmuyor. Sayfayı özelleştirmek ve modülleri tekrar görünür yapmak için düzenle butonuna tıkla.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomizeModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 inline-flex items-center space-x-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Modülleri Düzenle</span>
          </button>
        </div>
      );
    }

    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < activeWidgets.length) {
      const current = activeWidgets[i];

      // Group contiguous KPI cards
      if (current.category === 'kpis') {
        const kpiGroup: DashboardWidgetConfig[] = [];
        while (i < activeWidgets.length && activeWidgets[i].category === 'kpis') {
          kpiGroup.push(activeWidgets[i]);
          i++;
        }
        elements.push(
          <div key={`kpi-group-${i}`} className={`grid grid-cols-1 sm:grid-cols-2 ${kpiGroup.length >= 3 ? 'lg:grid-cols-4' : kpiGroup.length === 2 ? 'lg:grid-cols-2' : ''} gap-4`}>
            {kpiGroup.map(w => (
              <React.Fragment key={w.id}>
                {renderWidget(w)}
              </React.Fragment>
            ))}
          </div>
        );
        continue;
      }

      // Group contiguous Charts
      if (current.category === 'charts') {
        const chartGroup: DashboardWidgetConfig[] = [];
        while (i < activeWidgets.length && activeWidgets[i].category === 'charts') {
          chartGroup.push(activeWidgets[i]);
          i++;
        }
        elements.push(
          <div key={`chart-group-${i}`} className={`grid grid-cols-1 ${chartGroup.length > 1 ? 'lg:grid-cols-2' : ''} gap-6`}>
            {chartGroup.map(w => (
              <React.Fragment key={w.id}>
                {renderWidget(w)}
              </React.Fragment>
            ))}
          </div>
        );
        continue;
      }

      // Group contiguous Content items (weekly_schedule + coach_notes / ai_coach_summary / quick_actions / quick_notes)
      if (current.category === 'content') {
        const contentGroup: DashboardWidgetConfig[] = [];
        while (i < activeWidgets.length && activeWidgets[i].category === 'content') {
          contentGroup.push(activeWidgets[i]);
          i++;
        }

        const hasSchedule = contentGroup.some(w => w.id === 'weekly_schedule');
        const rightSideItems = contentGroup.filter(w => w.id === 'coach_notes' || w.id === 'ai_coach_summary' || w.id === 'quick_actions' || w.id === 'quick_notes');

        if (hasSchedule && rightSideItems.length > 0) {
          elements.push(
            <div key={`content-group-${i}`} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {renderWidget(contentGroup.find(w => w.id === 'weekly_schedule')!)}
              </div>
              <div className="space-y-4">
                {rightSideItems.map(w => (
                  <React.Fragment key={w.id}>
                    {renderWidget(w)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        } else {
          contentGroup.forEach(w => {
            elements.push(
              <div key={w.id}>
                {renderWidget(w)}
              </div>
            );
          });
        }
        continue;
      }

      // Standalone header items
      elements.push(
        <div key={current.id} className={current.id === 'countdown' ? 'relative z-20' : current.id === 'target_banner' ? 'relative z-10' : ''}>
          {renderWidget(current)}
        </div>
      );
      i++;
    }

    return <div className="space-y-6">{elements}</div>;
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header Bar with Customization Trigger Button */}
      <div className="flex flex-row items-center justify-between gap-2.5 bg-slate-900/80 backdrop-blur-md px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-indigo-500/20 shadow-md">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base md:text-lg font-bold text-white leading-tight truncate">Genel Özet & Performans</h1>
            <p className="text-[11px] text-slate-400 hidden md:block truncate">YKS çalışma sürecinin genel görünümü, hedeflerin ve kişiselleştirilebilir analiz kutucukları</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomizeModal(true)}
          className="text-[11px] sm:text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/40 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center space-x-1.5 cursor-pointer hover:scale-102 active:scale-98 shrink-0 whitespace-nowrap"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-300" />
          <span>Özeti Düzenle</span>
        </button>
      </div>

      {/* Main Dynamic Dashboard Content */}
      {renderDashboardContent()}

      {/* Target Edit Modal */}
      {showTargetModal && (
        <TargetModal
          profile={profile}
          onSave={(updatedProfile) => {
            if (onUpdateStudentProfile) {
              onUpdateStudentProfile(updatedProfile);
            }
          }}
          onClose={() => setShowTargetModal(false)}
          onOpenFullProfile={onOpenProfile}
        />
      )}

      {/* Customize Dashboard Layout Modal */}
      {showCustomizeModal && (
        <DashboardCustomizeModal
          widgets={widgets}
          onSave={handleSaveWidgets}
          onReset={handleResetWidgets}
          onClose={() => setShowCustomizeModal(false)}
        />
      )}

      {/* Subject Notes Modal (Student Notes & Teacher Coaching Notes) */}
      {activeNotesSubject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              onClick={() => setActiveNotesSubject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="flex items-center space-x-2 pb-2 border-b border-white/10">
              <StickyNote className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">{activeNotesSubject} Not Defteri</h3>
                <p className="text-[10px] text-slate-400">Özel çalışma notları ve öğretmen koçluk yönlendirmeleri</p>
              </div>
            </div>

            {/* Note Fields */}
            <div className="space-y-4">
              
              {/* STUDENT NOTE */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {currentUser?.role === 'student' ? 'Benim Özel Notum' : 'Öğrencinin Özel Notu'}
                </label>
                {currentUser?.role === 'student' ? (
                  <textarea
                    rows={4}
                    value={studentNoteDraft}
                    onChange={(e) => setStudentNoteDraft(e.target.value)}
                    placeholder="Bu ders için kendinize özel hatırlatmalar, formüller veya hedefler yazın..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all font-sans resize-none"
                  />
                ) : (
                  <div className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 italic min-h-[80px] select-none whitespace-pre-wrap">
                    {studentNoteDraft || 'Öğrenci henüz özel bir not eklememiş.'}
                  </div>
                )}
                <p className="text-[10px] text-slate-500 italic">
                  {currentUser?.role === 'student' ? 'Bu not sadece sizin tarafınızdan görülebilir ve düzenlenebilir.' : 'Bu not sadece öğrenci tarafından düzenlenebilir.'}
                </p>
              </div>

              {/* TEACHER NOTE */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Öğretmen / Koç Notu
                </label>
                {currentUser?.role !== 'student' ? (
                  <textarea
                    rows={4}
                    value={teacherNoteDraft}
                    onChange={(e) => setTeacherNoteDraft(e.target.value)}
                    placeholder="Öğrenciniz için bu derse özel koçluk tavsiyeleri ve yönlendirmeleri yazın..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all font-sans resize-none"
                  />
                ) : (
                  <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-3 py-2.5 text-xs text-slate-200 min-h-[80px] whitespace-pre-wrap">
                    {teacherNoteDraft ? (
                      teacherNoteDraft
                    ) : (
                      <span className="text-slate-500 italic">Öğretmeniniz veya koçunuz henüz bu derse özel bir not eklememiş.</span>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-indigo-400/80 italic font-medium">
                  {currentUser?.role !== 'student' ? 'Bu not öğrenci tarafından ders kutucuğunda anında görüntülenecektir.' : 'Bu not öğretmeniniz / koçunuz tarafından sizin gelişiminiz için eklenmiştir.'}
                </p>
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveNotesSubject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Kapat
              </button>
              {((currentUser?.role === 'student' && onUpdateSubjectNotes) || (currentUser?.role !== 'student' && onUpdateSubjectNotes)) && (
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 transition-colors cursor-pointer"
                >
                  Kaydet
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
