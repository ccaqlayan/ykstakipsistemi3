import React, { useState, useRef, useEffect } from 'react';
import { 
  getWeekLabel, 
  normalizeWeekLabel, 
  parseWeekStartTimestamp,
  getMonday,
  getIsoDateString,
  getWeekDays,
  formatWeekLabelWithYear,
  addWeeks,
  isSameWeekLabel,
  cleanWeekLabelForComparison
} from '../utils/dateUtils';
import { 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus, 
  Copy,
  Trash2, 
  CheckCircle, 
  Clock, 
  Calendar,
  Check,
  Edit3,
  BarChart3,
  ListFilter,
  X,
  TrendingUp,
  PieChart,
  CheckSquare,
  BookOpen,
  GripVertical,
  MoveRight,
  Sparkles,
  ArrowRightLeft,
  AlertTriangle,
  History,
  CalendarDays,
  Award,
  Info,
  RotateCcw,
  Settings,
  Edit2,
  Maximize,
  Minimize,
  Youtube,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { StudyPlanItem, DayOfWeek, QuestionLog, YouTubeVideoItem, DailyStudyTimeLog, UserAccount, RoutineItem } from '../types';
import { YKS_SUBJECTS, YKS_CURRICULUM_TOPICS, DEFAULT_TASK_TYPES, DEFAULT_DAILY_STUDY_LOGS } from '../data/initialData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { StudyPlannerWeeklyBoard } from './planner/StudyPlannerWeeklyBoard';
import { StudyPlannerDailyView } from './planner/StudyPlannerDailyView';
import { StudyPlannerStatsView } from './planner/StudyPlannerStatsView';
import { StudyPlannerModals, DailyStudyLogModalData } from './planner/StudyPlannerModals';
import { AddVideoTaskModal } from './planner/AddVideoTaskModal';
import { StudyPlannerPrintModal } from './planner/StudyPlannerPrintModal';
import { WeeklyAiReportCardModal } from './reports/WeeklyAiReportCardModal';

interface StudyPlannerViewProps {
  studyPlans: StudyPlanItem[];
  questionLogs?: QuestionLog[];
  onAddPlan: (plan: Omit<StudyPlanItem, 'id'>) => void;
  onUpdatePlan: (plan: StudyPlanItem) => void;
  onDeletePlan: (id: string) => void;
  onAddQuestionLog?: (log: any) => void;
  onDeleteQuestionLog?: (id: string) => void;
  onUpdateAllPlans?: (plans: StudyPlanItem[], auditMessage?: string) => void;
  taskTypes?: string[];
  onUpdateTaskTypes?: (taskTypes: string[], actionText?: string) => void;
  isZenMode?: boolean;
  onZenModeChange?: (isZen: boolean) => void;
  // AI suggest props
  profile?: any;
  currentUser?: UserAccount;
  routines?: RoutineItem[];
  topicErrors?: any[];
  generalMocks?: any[];
  branchExams?: any[];
  coachDataSettings?: any;
  youtubeVideos?: YouTubeVideoItem[];
  topicStatuses?: Record<string, 'Çalışmadım' | 'Erteledim' | 'Zor Geldi' | 'Çalıştım' | 'Uzmanlaştım'>;
  completedPastTopics?: string[];
  schoolExams?: any[];
  dailyStudyLogs?: Record<string, DailyStudyTimeLog>;
  onSaveDailyStudyLog?: (dateKey: string, log: DailyStudyTimeLog | null) => void;
}

const DAYS: DayOfWeek[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const getTodayName = (): DayOfWeek => {
  const dayIndex = new Date().getDay();
  const daysMap: DayOfWeek[] = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return daysMap[dayIndex];
};

export const QUICK_REFLECTIONS = [
  { label: 'Çalışmadım', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30', activeColor: 'bg-rose-500/40 text-white border-rose-400 ring-2 ring-rose-400/50 shadow-md shadow-rose-500/20', icon: '🔴' },
  { label: 'Erteledim', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30', activeColor: 'bg-amber-500/40 text-white border-amber-400 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/20', icon: '🟡' },
  { label: 'Zor Geldi', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30', activeColor: 'bg-orange-500/40 text-white border-orange-400 ring-2 ring-orange-400/50 shadow-md shadow-orange-500/20', icon: '🟠' },
  { label: 'Çalıştım', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30', activeColor: 'bg-emerald-500/40 text-white border-emerald-400 ring-2 ring-emerald-400/50 shadow-md shadow-emerald-500/20', icon: '🟢' },
  { label: 'Uzmanlaştım', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30', activeColor: 'bg-purple-500/40 text-white border-purple-400 ring-2 ring-purple-400/50 shadow-md shadow-purple-500/20', icon: '🌟' },
];

export interface SubjectTheme {
  badgeClass: string;
  cardBorderClass: string;
  dotBgClass: string;
  textClass: string;
}

const SUBJECT_COLOR_MAP: Record<string, SubjectTheme> = {
  'Matematik': {
    badgeClass: 'text-sky-300 bg-sky-500/20 border-sky-500/40',
    cardBorderClass: 'border-l-4 border-l-sky-500',
    dotBgClass: 'bg-sky-400',
    textClass: 'text-sky-300',
  },
  'Türkçe': {
    badgeClass: 'text-rose-300 bg-rose-500/20 border-rose-500/40',
    cardBorderClass: 'border-l-4 border-l-rose-500',
    dotBgClass: 'bg-rose-400',
    textClass: 'text-rose-300',
  },
  'Fizik': {
    badgeClass: 'text-purple-300 bg-purple-500/20 border-purple-500/40',
    cardBorderClass: 'border-l-4 border-l-purple-500',
    dotBgClass: 'bg-purple-400',
    textClass: 'text-purple-300',
  },
  'Kimya': {
    badgeClass: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40',
    cardBorderClass: 'border-l-4 border-l-cyan-500',
    dotBgClass: 'bg-cyan-400',
    textClass: 'text-cyan-300',
  },
  'Biyoloji': {
    badgeClass: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
    cardBorderClass: 'border-l-4 border-l-emerald-500',
    dotBgClass: 'bg-emerald-400',
    textClass: 'text-emerald-300',
  },
  'Geometri': {
    badgeClass: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
    cardBorderClass: 'border-l-4 border-l-amber-500',
    dotBgClass: 'bg-amber-400',
    textClass: 'text-amber-300',
  },
  'Tarih': {
    badgeClass: 'text-orange-300 bg-orange-500/20 border-orange-500/40',
    cardBorderClass: 'border-l-4 border-l-orange-500',
    dotBgClass: 'bg-orange-400',
    textClass: 'text-orange-300',
  },
  'Coğrafya': {
    badgeClass: 'text-teal-300 bg-teal-500/20 border-teal-500/40',
    cardBorderClass: 'border-l-4 border-l-teal-500',
    dotBgClass: 'bg-teal-400',
    textClass: 'text-teal-300',
  },
  'Paragraf': {
    badgeClass: 'text-fuchsia-300 bg-fuchsia-500/20 border-fuchsia-500/40',
    cardBorderClass: 'border-l-4 border-l-fuchsia-500',
    dotBgClass: 'bg-fuchsia-400',
    textClass: 'text-fuchsia-300',
  },
  'Edebiyat': {
    badgeClass: 'text-violet-300 bg-violet-500/20 border-violet-500/40',
    cardBorderClass: 'border-l-4 border-l-violet-500',
    dotBgClass: 'bg-violet-400',
    textClass: 'text-violet-300',
  },
  'Felsefe': {
    badgeClass: 'text-lime-300 bg-lime-500/20 border-lime-500/40',
    cardBorderClass: 'border-l-4 border-l-lime-500',
    dotBgClass: 'bg-lime-400',
    textClass: 'text-lime-300',
  },
  'Din Kültürü': {
    badgeClass: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/40',
    cardBorderClass: 'border-l-4 border-l-yellow-500',
    dotBgClass: 'bg-yellow-400',
    textClass: 'text-yellow-300',
  },
  'İngilizce': {
    badgeClass: 'text-blue-300 bg-blue-500/20 border-blue-500/40',
    cardBorderClass: 'border-l-4 border-l-blue-500',
    dotBgClass: 'bg-blue-400',
    textClass: 'text-blue-300',
  },
  'Problem': {
    badgeClass: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/40',
    cardBorderClass: 'border-l-4 border-l-indigo-500',
    dotBgClass: 'bg-indigo-400',
    textClass: 'text-indigo-300',
  },
};

const FALLBACK_THEMES: SubjectTheme[] = [
  { badgeClass: 'text-sky-300 bg-sky-500/20 border-sky-500/40', cardBorderClass: 'border-l-4 border-l-sky-500', dotBgClass: 'bg-sky-400', textClass: 'text-sky-300' },
  { badgeClass: 'text-rose-300 bg-rose-500/20 border-rose-500/40', cardBorderClass: 'border-l-4 border-l-rose-500', dotBgClass: 'bg-rose-400', textClass: 'text-rose-300' },
  { badgeClass: 'text-purple-300 bg-purple-500/20 border-purple-500/40', cardBorderClass: 'border-l-4 border-l-purple-500', dotBgClass: 'bg-purple-400', textClass: 'text-purple-300' },
  { badgeClass: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40', cardBorderClass: 'border-l-4 border-l-emerald-500', dotBgClass: 'bg-emerald-400', textClass: 'text-emerald-300' },
  { badgeClass: 'text-amber-300 bg-amber-500/20 border-amber-500/40', cardBorderClass: 'border-l-4 border-l-amber-500', dotBgClass: 'bg-amber-400', textClass: 'text-amber-300' },
  { badgeClass: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40', cardBorderClass: 'border-l-4 border-l-cyan-500', dotBgClass: 'bg-cyan-400', textClass: 'text-cyan-300' },
  { badgeClass: 'text-orange-300 bg-orange-500/20 border-orange-500/40', cardBorderClass: 'border-l-4 border-l-orange-500', dotBgClass: 'bg-orange-400', textClass: 'text-orange-300' },
  { badgeClass: 'text-teal-300 bg-teal-500/20 border-teal-500/40', cardBorderClass: 'border-l-4 border-l-teal-500', dotBgClass: 'bg-teal-400', textClass: 'text-teal-300' },
  { badgeClass: 'text-fuchsia-300 bg-fuchsia-500/20 border-fuchsia-500/40', cardBorderClass: 'border-l-4 border-l-fuchsia-500', dotBgClass: 'bg-fuchsia-400', textClass: 'text-fuchsia-300' },
  { badgeClass: 'text-lime-300 bg-lime-500/20 border-lime-500/40', cardBorderClass: 'border-l-4 border-l-lime-500', dotBgClass: 'bg-lime-400', textClass: 'text-lime-300' },
];

export function getSubjectTheme(subjectName: string): SubjectTheme {
  if (!subjectName) return FALLBACK_THEMES[0];
  
  const norm = subjectName.toLowerCase().trim();
  
  if (norm.includes('matematik') || norm.includes('mat')) return SUBJECT_COLOR_MAP['Matematik'];
  if (norm.includes('türkçe') || norm.includes('turkce')) return SUBJECT_COLOR_MAP['Türkçe'];
  if (norm.includes('fizik')) return SUBJECT_COLOR_MAP['Fizik'];
  if (norm.includes('kimya')) return SUBJECT_COLOR_MAP['Kimya'];
  if (norm.includes('biyoloji') || norm.includes('bio')) return SUBJECT_COLOR_MAP['Biyoloji'];
  if (norm.includes('geometri') || norm.includes('geo')) return SUBJECT_COLOR_MAP['Geometri'];
  if (norm.includes('tarih')) return SUBJECT_COLOR_MAP['Tarih'];
  if (norm.includes('coğrafya') || norm.includes('cografya')) return SUBJECT_COLOR_MAP['Coğrafya'];
  if (norm.includes('paragraf')) return SUBJECT_COLOR_MAP['Paragraf'];
  if (norm.includes('edebiyat')) return SUBJECT_COLOR_MAP['Edebiyat'];
  if (norm.includes('felsefe')) return SUBJECT_COLOR_MAP['Felsefe'];
  if (norm.includes('din')) return SUBJECT_COLOR_MAP['Din Kültürü'];
  if (norm.includes('ingilizce') || norm.includes('yabancı dil') || norm.includes('ydt') || norm.includes('dil')) return SUBJECT_COLOR_MAP['İngilizce'];
  if (norm.includes('problem')) return SUBJECT_COLOR_MAP['Problem'];

  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_THEMES.length;
  return FALLBACK_THEMES[index];
}

export interface DayColumnStyle {
  bg: string;
  headerBg: string;
  border: string;
  accentBar: string;
  titleColor: string;
  badgeBg: string;
  dayClassKey: string;
}

export const DAY_COLUMN_STYLES: Record<DayOfWeek, DayColumnStyle> = {
  'Pazartesi': {
    bg: 'bg-gradient-to-b from-indigo-950/40 via-slate-900/90 to-slate-950/95 hover:from-indigo-950/60',
    headerBg: 'bg-gradient-to-r from-indigo-950/95 to-slate-900/95 border-indigo-500/40',
    border: 'border-indigo-500/40 shadow-lg shadow-indigo-950/30',
    accentBar: 'bg-indigo-500',
    titleColor: 'text-indigo-300 font-black',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
    dayClassKey: 'pazartesi',
  },
  'Salı': {
    bg: 'bg-gradient-to-b from-sky-950/40 via-slate-900/90 to-slate-950/95 hover:from-sky-950/60',
    headerBg: 'bg-gradient-to-r from-sky-950/95 to-slate-900/95 border-sky-500/40',
    border: 'border-sky-500/40 shadow-lg shadow-sky-950/30',
    accentBar: 'bg-sky-500',
    titleColor: 'text-sky-300 font-black',
    badgeBg: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
    dayClassKey: 'sali',
  },
  'Çarşamba': {
    bg: 'bg-gradient-to-b from-purple-950/40 via-slate-900/90 to-slate-950/95 hover:from-purple-950/60',
    headerBg: 'bg-gradient-to-r from-purple-950/95 to-slate-900/95 border-purple-500/40',
    border: 'border-purple-500/40 shadow-lg shadow-purple-950/30',
    accentBar: 'bg-purple-500',
    titleColor: 'text-purple-300 font-black',
    badgeBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    dayClassKey: 'carsamba',
  },
  'Perşembe': {
    bg: 'bg-gradient-to-b from-teal-950/40 via-slate-900/90 to-slate-950/95 hover:from-teal-950/60',
    headerBg: 'bg-gradient-to-r from-teal-950/95 to-slate-900/95 border-teal-500/40',
    border: 'border-teal-500/40 shadow-lg shadow-teal-950/30',
    accentBar: 'bg-teal-500',
    titleColor: 'text-teal-300 font-black',
    badgeBg: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
    dayClassKey: 'persembe',
  },
  'Cuma': {
    bg: 'bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-950/95 hover:from-emerald-950/60',
    headerBg: 'bg-gradient-to-r from-emerald-950/95 to-slate-900/95 border-emerald-500/40',
    border: 'border-emerald-500/40 shadow-lg shadow-emerald-950/30',
    accentBar: 'bg-emerald-500',
    titleColor: 'text-emerald-300 font-black',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    dayClassKey: 'cuma',
  },
  'Cumartesi': {
    bg: 'bg-gradient-to-b from-amber-950/50 via-slate-900/90 to-slate-950/95 hover:from-amber-950/65',
    headerBg: 'bg-gradient-to-r from-amber-950/95 to-slate-900/95 border-amber-500/50',
    border: 'border-amber-500/45 shadow-xl shadow-amber-950/35',
    accentBar: 'bg-amber-500',
    titleColor: 'text-amber-300 font-black',
    badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    dayClassKey: 'cumartesi',
  },
  'Pazar': {
    bg: 'bg-gradient-to-b from-rose-950/50 via-slate-900/90 to-slate-950/95 hover:from-rose-950/65',
    headerBg: 'bg-gradient-to-r from-rose-950/95 to-slate-900/95 border-rose-500/50',
    border: 'border-rose-500/45 shadow-xl shadow-rose-950/35',
    accentBar: 'bg-rose-500',
    titleColor: 'text-rose-300 font-black',
    badgeBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    dayClassKey: 'pazar',
  },
};

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  studyPlans,
  questionLogs,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onAddQuestionLog,
  onDeleteQuestionLog,
  onUpdateAllPlans,
  taskTypes,
  onUpdateTaskTypes,
  isZenMode = false,
  onZenModeChange,
  profile,
  currentUser,
  routines,
  topicErrors,
  generalMocks,
  branchExams,
  coachDataSettings,
  youtubeVideos = [],
  topicStatuses,
  completedPastTopics,
  schoolExams = [],
  dailyStudyLogs,
  onSaveDailyStudyLog
}) => {
  const today = getTodayName();
  const [viewMode, setViewMode] = useState<'board' | 'daily' | 'stats'>('daily');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handlePrevDay = () => {
    setSlideDirection('prev');
    const currentIndex = DAYS.indexOf(selectedDay);
    const prevIndex = (currentIndex - 1 + DAYS.length) % DAYS.length;
    setSelectedDay(DAYS[prevIndex]);
  };

  const handleNextDay = () => {
    setSlideDirection('next');
    const currentIndex = DAYS.indexOf(selectedDay);
    const nextIndex = (currentIndex + 1) % DAYS.length;
    setSelectedDay(DAYS[nextIndex]);
  };

  // Week navigation states
  const currentMonday = React.useMemo(() => getMonday(new Date()), []);
  const realCurrentWeekLabel = React.useMemo(() => formatWeekLabelWithYear(currentMonday), [currentMonday]);
  const nextMonday = React.useMemo(() => addWeeks(currentMonday, 1), [currentMonday]);
  const nextWeekLabel = React.useMemo(() => formatWeekLabelWithYear(nextMonday), [nextMonday]);
  const [selectedMondayDate, setSelectedMondayDate] = useState<Date>(currentMonday);
  const [weekSlideDirection, setWeekSlideDirection] = useState<'next' | 'prev'>('next');

  const selectedWeekDays = React.useMemo(() => getWeekDays(selectedMondayDate), [selectedMondayDate]);
  const selectedWeekDaysMap = React.useMemo(() => {
    const map: Record<string, { isoDate: string; displayDate: string }> = {};
    selectedWeekDays.forEach(d => {
      map[d.dayName] = { isoDate: d.isoDate, displayDate: d.displayDate };
    });
    return map;
  }, [selectedWeekDays]);

  const currentWeekLabel = React.useMemo(() => formatWeekLabelWithYear(selectedMondayDate), [selectedMondayDate]);
  const isCurrentWeek = selectedMondayDate.getTime() === currentMonday.getTime();
  const isPastWeek = selectedMondayDate.getTime() < currentMonday.getTime();
  const isFutureWeek = selectedMondayDate.getTime() > currentMonday.getTime();

  const handlePrevWeek = () => {
    setWeekSlideDirection('prev');
    setSelectedMondayDate(prev => addWeeks(prev, -1));
  };

  const handleNextWeek = () => {
    setWeekSlideDirection('next');
    setSelectedMondayDate(prev => addWeeks(prev, 1));
  };

  const handleGoToCurrentWeek = () => {
    setWeekSlideDirection(selectedMondayDate.getTime() < currentMonday.getTime() ? 'next' : 'prev');
    setSelectedMondayDate(currentMonday);
  };

  const getPlanDateAndWeekLabel = (targetDay: DayOfWeek) => {
    const dayIndex = DAYS.indexOf(targetDay);
    const targetDate = new Date(selectedMondayDate);
    targetDate.setDate(selectedMondayDate.getDate() + (dayIndex >= 0 ? dayIndex : 0));
    return {
      date: getIsoDateString(targetDate),
      weekLabel: currentWeekLabel
    };
  };

  const getRealCurrentWeekPlanDateAndLabel = (targetDay: DayOfWeek) => {
    const dayIndex = DAYS.indexOf(targetDay);
    const targetDate = new Date(currentMonday);
    targetDate.setDate(currentMonday.getDate() + (dayIndex >= 0 ? dayIndex : 0));
    return {
      date: getIsoDateString(targetDate),
      weekLabel: realCurrentWeekLabel
    };
  };

  const getNextWeekPlanDateAndLabel = (targetDay: DayOfWeek) => {
    const dayIndex = DAYS.indexOf(targetDay);
    const targetDate = new Date(nextMonday);
    targetDate.setDate(nextMonday.getDate() + (dayIndex >= 0 ? dayIndex : 0));
    return {
      date: getIsoDateString(targetDate),
      weekLabel: nextWeekLabel
    };
  };
  
  const [activeSubTab, setActiveSubTab] = useState<'tracker' | 'history'>('tracker');
  const [selectedHistoryWeek, setSelectedHistoryWeek] = useState<string>('');
  const [historyWeeksPage, setHistoryWeeksPage] = useState<number>(1);
  const [applyPastWeekModalData, setApplyPastWeekModalData] = useState<{
    weekLabel: string;
    targetWeekLabel?: string;
    targetWeekTitle?: string;
    pastPlans: StudyPlanItem[];
    currentPlansCount: number;
    onApply?: (choice: 'merge' | 'replace') => void;
  } | null>(null);
  const [clearFutureWeekConfirm, setClearFutureWeekConfirm] = useState<{
    weekLabel: string;
    plansCount: number;
    step: 1 | 2;
  } | null>(null);
  const [subjectChartScope, setSubjectChartScope] = useState<'total' | 'selected'>('total');
  const [subjectChartMetric, setSubjectChartMetric] = useState<'duration' | 'question'>('duration');

  // Smooth scroll to top whenever planner view mode or active sub-tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const mainElem = document.querySelector('main');
    if (mainElem) {
      mainElem.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [viewMode, activeSubTab]);

  const CHRONOLOGICAL_SEEDS: string[] = ['6 - 12 Temmuz', '13 - 19 Temmuz', '20 - 26 Temmuz'];

  // Cleanup studyPlans: normalize short month names and purge duplicate user-archived 20-26 Temmuz entries
  useEffect(() => {
    if (!onUpdateAllPlans) return;
    let changed = false;

    const cleanedPlans = studyPlans.filter(p => {
      // Purge old initial hardcoded seed entries (plan-1 .. plan-12) if improperly archived for 27 Temmuz - 2 Ağustos
      if (p.archived && p.weekLabel && isSameWeekLabel(p.weekLabel, '27 Temmuz - 2 Ağustos') && /^plan-(?:[1-9]|1[0-2])$/.test(p.id)) {
        changed = true;
        return false;
      }
      return true;
    }).map(p => {
      if (p.weekLabel) {
        const norm = normalizeWeekLabel(p.weekLabel);
        if (norm !== p.weekLabel) {
          changed = true;
          return { ...p, weekLabel: norm };
        }
      }
      return p;
    });

    const currentMondayTime = currentMonday.getTime();

    const updatedPlans = cleanedPlans.map(p => {
      if (!p.archived && (p.weekLabel || p.date)) {
        let pTimestamp = 0;
        if (p.date) {
          pTimestamp = new Date(p.date).getTime();
        } else if (p.weekLabel) {
          pTimestamp = parseWeekStartTimestamp(p.weekLabel);
        }
        // If task belongs to a week before current week, automatically archive it into history
        if (pTimestamp > 0 && pTimestamp < currentMondayTime - 86400000 * 2) {
          changed = true;
          return { ...p, archived: true };
        }
      }
      return p;
    });

    if (changed) {
      onUpdateAllPlans(updatedPlans);
    }
  }, [studyPlans, onUpdateAllPlans, currentMonday]);

  const getPlansForWeek = (weekLabel: string): StudyPlanItem[] => {
    const realArchived = studyPlans.filter(p => p.archived && p.weekLabel && isSameWeekLabel(p.weekLabel, weekLabel));
    if (realArchived.length > 0) return realArchived;

    const unarchivedMatching = studyPlans.filter(p => !p.archived && p.weekLabel && isSameWeekLabel(p.weekLabel, weekLabel));
    if (unarchivedMatching.length > 0) return unarchivedMatching;

    if (isSameWeekLabel(weekLabel, '6 - 12 Temmuz')) {
      return [
        { id: 'seed-1-1', day: 'Pazartesi', subject: 'Matematik', topic: 'Temel Kavramlar', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: '6 - 12 Temmuz', archived: true },
        { id: 'seed-1-2', day: 'Pazartesi', subject: 'Türkçe', topic: 'Paragrafta Yapı', plannedMinutes: 45, completedMinutes: 45, status: 'completed', targetQuestionCount: 30, weekLabel: '6 - 12 Temmuz', archived: true },
        { id: 'seed-1-3', day: 'Salı', subject: 'Fizik', topic: 'Vektörler', plannedMinutes: 60, completedMinutes: 45, status: 'in_progress', targetQuestionCount: 25, weekLabel: '6 - 12 Temmuz', archived: true },
        { id: 'seed-1-4', day: 'Çarşamba', subject: 'Matematik', topic: 'Sayı Basamakları', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: '6 - 12 Temmuz', archived: true },
        { id: 'seed-1-5', day: 'Perşembe', subject: 'Kimya', topic: 'Kimya Bilimi', plannedMinutes: 60, completedMinutes: 60, status: 'completed', targetQuestionCount: 30, weekLabel: '6 - 12 Temmuz', archived: true },
        { id: 'seed-1-6', day: 'Cuma', subject: 'Biyoloji', topic: 'Canlıların Ortak Özellikleri', plannedMinutes: 60, completedMinutes: 0, status: 'pending', targetQuestionCount: 30, weekLabel: '6 - 12 Temmuz', archived: true },
        { id: 'seed-1-7', day: 'Cumartesi', subject: 'Tarih', topic: 'Tarih ve Zaman', plannedMinutes: 45, completedMinutes: 45, status: 'completed', targetQuestionCount: 20, weekLabel: '6 - 12 Temmuz', archived: true },
      ];
    }
    if (isSameWeekLabel(weekLabel, '13 - 19 Temmuz')) {
      return [
        { id: 'seed-2-1', day: 'Pazartesi', subject: 'Matematik', topic: 'Bölme-Bölünebilme', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 45, weekLabel: '13 - 19 Temmuz', archived: true },
        { id: 'seed-2-2', day: 'Pazartesi', subject: 'Türkçe', topic: 'Paragrafta Ana Düşünce', plannedMinutes: 45, completedMinutes: 45, status: 'completed', targetQuestionCount: 30, weekLabel: '13 - 19 Temmuz', archived: true },
        { id: 'seed-2-3', day: 'Salı', subject: 'Fizik', topic: 'Bağıl Hareket', plannedMinutes: 75, completedMinutes: 75, status: 'completed', targetQuestionCount: 30, weekLabel: '13 - 19 Temmuz', archived: true },
        { id: 'seed-2-4', day: 'Çarşamba', subject: 'Matematik', topic: 'EBOB-EKOK', plannedMinutes: 120, completedMinutes: 120, status: 'completed', targetQuestionCount: 50, weekLabel: '13 - 19 Temmuz', archived: true },
        { id: 'seed-2-5', day: 'Perşembe', subject: 'Kimya', topic: 'Atom ve Periyodik Sistem', plannedMinutes: 75, completedMinutes: 30, status: 'in_progress', targetQuestionCount: 30, weekLabel: '13 - 19 Temmuz', archived: true },
        { id: 'seed-2-6', day: 'Cuma', subject: 'Biyoloji', topic: 'Canlıların Temel Bileşenleri', plannedMinutes: 60, completedMinutes: 60, status: 'completed', targetQuestionCount: 35, weekLabel: '13 - 19 Temmuz', archived: true },
        { id: 'seed-2-7', day: 'Pazar', subject: 'Geometri', topic: 'Doğruda ve Üçgende Açılar', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: '13 - 19 Temmuz', archived: true },
      ];
    }
    if (isSameWeekLabel(weekLabel, '20 - 26 Temmuz')) {
      return [
        { id: 'seed-3-1', day: 'Pazartesi', subject: 'Matematik', topic: 'Rasyonel Sayılar', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: '20 - 26 Temmuz', archived: true },
        { id: 'seed-3-2', day: 'Pazartesi', subject: 'Türkçe', topic: 'Anlatım Biçimleri', plannedMinutes: 45, completedMinutes: 45, status: 'completed', targetQuestionCount: 30, weekLabel: '20 - 26 Temmuz', archived: true },
        { id: 'seed-3-3', day: 'Salı', subject: 'Fizik', topic: 'Newton’ın Hareket Yasaları', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 35, weekLabel: '20 - 26 Temmuz', archived: true },
        { id: 'seed-3-4', day: 'Çarşamba', subject: 'Matematik', topic: 'Birinci Dereceden Denklemler', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: '20 - 26 Temmuz', archived: true },
        { id: 'seed-3-5', day: 'Perşembe', subject: 'Kimya', topic: 'Kimyasal Türler Arası Etkileşimler', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 30, weekLabel: '20 - 26 Temmuz', archived: true },
        { id: 'seed-3-6', day: 'Cuma', subject: 'Biyoloji', topic: 'Hücre Yapısı', plannedMinutes: 75, completedMinutes: 75, status: 'completed', targetQuestionCount: 30, weekLabel: '20 - 26 Temmuz', archived: true },
        { id: 'seed-3-7', day: 'Cumartesi', subject: 'Coğrafya', topic: 'Doğa ve İnsan', plannedMinutes: 45, completedMinutes: 45, status: 'completed', targetQuestionCount: 20, weekLabel: '20 - 26 Temmuz', archived: true },
        { id: 'seed-3-8', day: 'Pazar', subject: 'Geometri', topic: 'Özel Üçgenler', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: '20 - 26 Temmuz', archived: true },
      ];
    }

    return [];
  };

  const getOrderedWeeks = (): string[] => {
    const rawLabels = [
      ...studyPlans.filter(p => p.archived && p.weekLabel).map(p => p.weekLabel as string),
      ...CHRONOLOGICAL_SEEDS
    ];
    // Map by clean comparison label to deduplicate without year mismatches
    const map = new Map<string, string>();
    rawLabels.filter(Boolean).forEach(l => {
      const clean = cleanWeekLabelForComparison(l);
      if (!map.has(clean)) {
        map.set(clean, l);
      }
    });
    const unique = Array.from(map.values());
    unique.sort((a, b) => parseWeekStartTimestamp(b) - parseWeekStartTimestamp(a));
    return unique;
  };

  const orderedWeeks = getOrderedWeeks();
  const activeHistoryWeek = selectedHistoryWeek || orderedWeeks[0] || '20 - 26 Temmuz';

  const getWeeklyStats = () => {
    const allLogs = { ...DEFAULT_DAILY_STUDY_LOGS, ...(dailyStudyLogs || {}) };
    return orderedWeeks.map(weekLabel => {
      const plans = getPlansForWeek(weekLabel);
      const totalTasks = plans.length;
      const completedTasks = plans.filter(p => p.status === 'completed').length;
      const plannedMin = plans.reduce((acc, p) => acc + p.plannedMinutes, 0);
      const completedMin = plans.reduce((acc, p) => acc + p.completedMinutes, 0);
      
      // Calculate effective completed minutes for this week (using daily logs if available, fallback to completed tasks)
      const effectiveMin = DAYS.reduce((sum, day) => {
        const matchingLogKey = Object.keys(allLogs).find(k => {
          const log = allLogs[k];
          return log && log.day === day && isSameWeekLabel(log.weekLabel || '', weekLabel);
        });
        if (matchingLogKey && allLogs[matchingLogKey]) {
          return sum + allLogs[matchingLogKey].minutes;
        }
        const altKey = `${weekLabel}_${day}`;
        if (allLogs[altKey]) {
          return sum + allLogs[altKey].minutes;
        }
        const dayTaskMin = plans.filter(p => p.day === day).reduce((s, p) => s + (p.completedMinutes || 0), 0);
        return sum + dayTaskMin;
      }, 0);

      const taskComplianceRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const durationComplianceRate = plannedMin > 0 ? Math.round((effectiveMin / plannedMin) * 100) : 0;
      const completedHours = Number((effectiveMin / 60).toFixed(1));

      return {
        name: weekLabel,
        'Görev Uyumu (%)': taskComplianceRate,
        'Süre Uyumu (%)': durationComplianceRate,
        'Çalışma Süresi (Saat)': completedHours,
        'Tamamlanan Görev': completedTasks,
        'Toplam Görev': totalTasks
      };
    });
  };

  const getSubjectDistributionStats = () => {
    const subjectData: Record<string, { planned: number; completed: number; completedQuestions: number }> = {};
    const targetWeeks = subjectChartScope === 'selected' ? (activeHistoryWeek ? [activeHistoryWeek] : []) : orderedWeeks;
    
    targetWeeks.forEach(weekLabel => {
      const plans = getPlansForWeek(weekLabel);
      plans.forEach(p => {
        if (!subjectData[p.subject]) {
          subjectData[p.subject] = { planned: 0, completed: 0, completedQuestions: 0 };
        }
        subjectData[p.subject].planned += p.plannedMinutes;
        subjectData[p.subject].completed += p.completedMinutes;
        
        // Calculate completed questions proportionally to study minutes
        const targetQ = p.targetQuestionCount || 0;
        if (targetQ > 0) {
          if (p.status === 'completed') {
            subjectData[p.subject].completedQuestions += targetQ;
          } else if (p.status === 'in_progress') {
            const ratio = p.plannedMinutes > 0 ? (p.completedMinutes / p.plannedMinutes) : 0.5;
            subjectData[p.subject].completedQuestions += Math.round(targetQ * Math.min(1, ratio));
          }
        }
      });
    });

    return Object.keys(subjectData).map(subject => {
      const { planned, completed, completedQuestions } = subjectData[subject];
      return {
        name: subject,
        'Planlanan (Saat)': Number((planned / 60).toFixed(1)),
        'Tamamlanan (Saat)': Number((completed / 60).toFixed(1)),
        'Tamamlanan (Soru)': completedQuestions,
        'Uyum (%)': planned > 0 ? Math.round((completed / planned) * 100) : 0
      };
    });
  };

  const handleInitiateApplyPastWeek = (targetWeekLabel: string) => {
    const pastPlans = getPlansForWeek(targetWeekLabel);
    if (pastPlans.length === 0) {
      alert('Seçilen haftaya ait aktarılacak ders bulunamadı.');
      return;
    }

    // Active unarchived plans in REAL CURRENT WEEK (not the currently viewed past week)
    const currentActivePlans = studyPlans.filter(p => !p.archived && (
      !p.weekLabel || isSameWeekLabel(p.weekLabel, realCurrentWeekLabel)
    ));

    if (currentActivePlans.length === 0) {
      // Direct apply if current week is completely empty
      handleApplyPastWeekToCurrent(targetWeekLabel, 'replace');
    } else {
      // Open conflict resolution modal
      setApplyPastWeekModalData({
        weekLabel: targetWeekLabel,
        pastPlans,
        currentPlansCount: currentActivePlans.length
      });
    }
  };

  const handleApplyPastWeekToCurrent = (targetPastWeekLabel: string, choice: 'merge' | 'replace') => {
    if (!onUpdateAllPlans) return;

    const pastPlans = getPlansForWeek(targetPastWeekLabel);
    if (pastPlans.length === 0) return;

    // Generate new unarchived plans STRICTLY for the REAL CURRENT WEEK with reset status and proper dates
    const newPlansForCurrentWeek: StudyPlanItem[] = pastPlans.map(p => {
      const { date, weekLabel } = getRealCurrentWeekPlanDateAndLabel(p.day);
      return {
        ...p,
        id: 'plan-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        completedMinutes: 0,
        status: 'pending' as const,
        reflection: undefined,
        archived: false,
        date,
        weekLabel
      };
    });

    let updatedAllPlans: StudyPlanItem[] = [];

    if (choice === 'replace') {
      // Remove any existing active unarchived plans belonging to real current week, and replace with newPlansForCurrentWeek
      const otherPlans = studyPlans.filter(p => {
        if (p.archived) return true;
        if (p.weekLabel && !isSameWeekLabel(p.weekLabel, realCurrentWeekLabel)) return true;
        return false;
      });
      updatedAllPlans = [...otherPlans, ...newPlansForCurrentWeek];
    } else {
      // Merge / append to existing plans
      updatedAllPlans = [...studyPlans, ...newPlansForCurrentWeek];
    }

    onUpdateAllPlans(
      updatedAllPlans,
      `"${targetPastWeekLabel}" haftasının ders planı güncel haftaya (${realCurrentWeekLabel}) uygulandı (${choice === 'replace' ? 'Sıfırlandı' : 'Birleştirildi'}).`
    );

    // Switch view to real current week tracker
    setSelectedMondayDate(currentMonday);
    setActiveSubTab('tracker');
    setQuestionToast(`✨ "${targetPastWeekLabel}" haftasının planı güncel haftanıza (${realCurrentWeekLabel}) başarıyla aktarıldı!`);
  };

  const handleInitiateApplyPlanToNextWeek = (sourceWeekLabel: string) => {
    let sourcePlans = getPlansForWeek(sourceWeekLabel);
    if (isSameWeekLabel(sourceWeekLabel, realCurrentWeekLabel)) {
      const currentActive = studyPlans.filter(p => !p.archived && (
        !p.weekLabel || isSameWeekLabel(p.weekLabel, realCurrentWeekLabel)
      ));
      if (currentActive.length > 0) {
        sourcePlans = currentActive;
      }
    }

    if (sourcePlans.length === 0) {
      alert(`"${sourceWeekLabel}" haftasına ait kopyalanacak ders bulunamadı.`);
      return;
    }

    const nextWeekPlans = studyPlans.filter(p => !p.archived && p.weekLabel && isSameWeekLabel(p.weekLabel, nextWeekLabel));

    if (nextWeekPlans.length === 0) {
      handleApplyPlanToNextWeek(sourceWeekLabel, 'replace');
    } else {
      setApplyPastWeekModalData({
        weekLabel: sourceWeekLabel,
        targetWeekLabel: nextWeekLabel,
        targetWeekTitle: `Gelecek Haftaya (${nextWeekLabel}) Plan Aktarımı`,
        pastPlans: sourcePlans,
        currentPlansCount: nextWeekPlans.length,
        onApply: (choice: 'merge' | 'replace') => handleApplyPlanToNextWeek(sourceWeekLabel, choice)
      });
    }
  };

  const handleApplyPlanToNextWeek = (sourceWeekLabel: string, choice: 'merge' | 'replace') => {
    if (!onUpdateAllPlans) return;

    let sourcePlans = getPlansForWeek(sourceWeekLabel);
    if (isSameWeekLabel(sourceWeekLabel, realCurrentWeekLabel)) {
      const currentActive = studyPlans.filter(p => !p.archived && (
        !p.weekLabel || isSameWeekLabel(p.weekLabel, realCurrentWeekLabel)
      ));
      if (currentActive.length > 0) {
        sourcePlans = currentActive;
      }
    }
    if (sourcePlans.length === 0) return;

    const newPlansForNextWeek: StudyPlanItem[] = sourcePlans.map(p => {
      const { date, weekLabel } = getNextWeekPlanDateAndLabel(p.day);
      return {
        ...p,
        id: 'plan-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        completedMinutes: 0,
        status: 'pending' as const,
        reflection: undefined,
        archived: false,
        date,
        weekLabel
      };
    });

    let updatedAllPlans: StudyPlanItem[] = [];

    if (choice === 'replace') {
      const otherPlans = studyPlans.filter(p => {
        if (p.archived) return true;
        if (p.weekLabel && isSameWeekLabel(p.weekLabel, nextWeekLabel)) return false;
        return true;
      });
      updatedAllPlans = [...otherPlans, ...newPlansForNextWeek];
    } else {
      updatedAllPlans = [...studyPlans, ...newPlansForNextWeek];
    }

    onUpdateAllPlans(
      updatedAllPlans,
      `"${sourceWeekLabel}" planı gelecek haftaya (${nextWeekLabel}) uygulandı (${choice === 'replace' ? 'Sıfırlandı' : 'Birleştirildi'}).`
    );

    // Switch view to next week tracker
    setWeekSlideDirection('next');
    setSelectedMondayDate(nextMonday);
    setActiveSubTab('tracker');
    setQuestionToast(`✨ "${sourceWeekLabel}" planı gelecek haftanıza (${nextWeekLabel}) başarıyla aktarıldı!`);
  };

  const handleInitiateClearFutureWeek = () => {
    if (!isFutureWeek) return;
    if (activePlans.length === 0) {
      alert('Bu hafta için henüz eklenmiş bir ders bulunmuyor.');
      return;
    }
    setClearFutureWeekConfirm({
      weekLabel: currentWeekLabel,
      plansCount: activePlans.length,
      step: 1
    });
  };

  const handleConfirmClearFutureWeek = () => {
    if (!isFutureWeek || !onUpdateAllPlans) return;
    
    // Remove active unarchived plans belonging to this future week
    const remainingPlans = studyPlans.filter(p => {
      const isTargetWeekPlan = !p.archived && (
        (p.weekLabel && isSameWeekLabel(p.weekLabel, currentWeekLabel)) ||
        (p.date && selectedWeekDays.some(d => d.isoDate === p.date))
      );
      return !isTargetWeekPlan;
    });

    onUpdateAllPlans(
      remainingPlans,
      `Gelecek Hafta (${currentWeekLabel}) ders planı temizlendi.`
    );
    setClearFutureWeekConfirm(null);
    setQuestionToast(`✨ ${currentWeekLabel} ders planı başarıyla temizlendi. Sıfırdan plan oluşturabilirsiniz.`);
  };
  
  // Helper to get question logs linked to a specific study plan item
  const getLinkedQuestionLogs = (studyPlanId: string, planTopic?: string, planSubject?: string): QuestionLog[] => {
    if (!questionLogs) return [];
    let linked = questionLogs.filter((q) => q.studyPlanId === studyPlanId);
    if (linked.length === 0 && planTopic && planSubject) {
      linked = questionLogs.filter((q) => 
        q.subject === planSubject && 
        q.notes && (
          q.notes.includes(`Plandan Eklendi: ${planTopic}`) || 
          q.notes.includes(`Çalışma Planından Eklendi: ${planTopic}`) ||
          q.notes.includes(`Çalışma Planından Otomatik Eklendi: ${planTopic}`)
        )
      );
    }
    return linked;
  };

  // Helper to remove question log linked to a specific study plan item
  const removeLinkedQuestionLog = (studyPlanId: string, planTopic?: string, planSubject?: string) => {
    if (!onDeleteQuestionLog) return;
    const linkedLogs = getLinkedQuestionLogs(studyPlanId, planTopic, planSubject);
    linkedLogs.forEach((linkedLog) => {
      onDeleteQuestionLog(linkedLog.id);
    });
  };
  
  // Refs for Day selector auto-centering
  const daysContainerRef = useRef<HTMLDivElement>(null);
  const activeDayBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (viewMode === 'daily' && activeDayBtnRef.current) {
      activeDayBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedDay, viewMode]);
  
  // Drag and Drop States
  const [draggedPlanId, setDraggedPlanId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);
  const [dragOverPlanId, setDragOverPlanId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const [touchDraggedPlanId, setTouchDraggedPlanId] = useState<string | null>(null);
  const [openMoveMenuPlanId, setOpenMoveMenuPlanId] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; moved: boolean; isLongPress?: boolean } | null>(null);
  const touchTimeoutRef = useRef<any>(null);

  // Click-outside listener to dismiss quick move day popover menu
  useEffect(() => {
    const handleClickOutside = () => setOpenMoveMenuPlanId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlanItem | null>(null);
  const [completingPlan, setCompletingPlan] = useState<StudyPlanItem | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<{ id: string; title: string } | null>(null);
  const [uncompleteConfirm, setUncompleteConfirm] = useState<{
    plan: StudyPlanItem;
    targetStatus: 'pending' | 'in_progress';
    linkedLogs: QuestionLog[];
  } | null>(null);

  const [showTaskTypeModal, setShowTaskTypeModal] = useState(false);
  const [editingTaskTypeIndex, setEditingTaskTypeIndex] = useState<number | null>(null);
  const [editingTaskTypeValue, setEditingTaskTypeValue] = useState<string>('');
  const [newTaskTypeValue, setNewTaskTypeValue] = useState<string>('');
  const [deletingTaskTypeIndex, setDeletingTaskTypeIndex] = useState<number | null>(null);
  const [deletingStep, setDeletingStep] = useState<number>(0); // 0: normal, 1: step 1, 2: step 2

  const actualTaskTypes = taskTypes && taskTypes.length > 0 ? taskTypes : DEFAULT_TASK_TYPES;

  const handleAddTaskType = () => {
    const value = newTaskTypeValue.trim();
    if (!value) return;
    if (actualTaskTypes.includes(value)) {
      alert('Bu görev tanımı zaten mevcut.');
      return;
    }
    const updated = [...actualTaskTypes];
    const dicerIndex = updated.indexOf('Diğer');
    if (dicerIndex !== -1) {
      updated.splice(dicerIndex, 1);
    }
    updated.push(value);
    updated.push('Diğer');
    
    if (onUpdateTaskTypes) {
      onUpdateTaskTypes(updated, `Yeni görev tanımı eklendi: ${value}`);
    }
    setNewTaskTypeValue('');
  };

  const handleEditTaskType = (index: number) => {
    const value = editingTaskTypeValue.trim();
    if (!value) return;
    const oldValue = actualTaskTypes[index];
    if (DEFAULT_TASK_TYPES.includes(oldValue)) {
      alert(`Sistem korumalı "${oldValue}" seçeneği düzenlenemez.`);
      setEditingTaskTypeIndex(null);
      return;
    }
    if (value === actualTaskTypes[index]) {
      setEditingTaskTypeIndex(null);
      return;
    }
    if (actualTaskTypes.includes(value) && actualTaskTypes.indexOf(value) !== index) {
      alert('Bu görev tanımı zaten mevcut.');
      return;
    }
    
    const updated = [...actualTaskTypes];
    updated[index] = value;
    
    if (onUpdateTaskTypes) {
      onUpdateTaskTypes(updated, `Görev tanımı güncellendi: ${oldValue} -> ${value}`);
    }
    setEditingTaskTypeIndex(null);
  };

  const handleDeleteTaskType = (index: number) => {
    const val = actualTaskTypes[index];
    if (DEFAULT_TASK_TYPES.includes(val)) {
      alert(`Sistem korumalı "${val}" seçeneği silinemez.`);
      return;
    }
    setDeletingTaskTypeIndex(index);
    setDeletingStep(1);
  };

  const handleConfirmUncompleteWithLogDeletion = () => {
    if (!uncompleteConfirm) return;
    const { plan, targetStatus } = uncompleteConfirm;
    removeLinkedQuestionLog(plan.id, plan.topic, plan.subject);
    onUpdatePlan({
      ...plan,
      status: targetStatus,
      completedMinutes: targetStatus === 'pending' ? 0 : plan.completedMinutes
    });
    setQuestionToast(`Soru takibindeki ilgili soru kaydı silindi ve görev durumu güncellendi.`);
    setUncompleteConfirm(null);
  };

  // Question Tracker Sync States
  const [questionPromptPlan, setQuestionPromptPlan] = useState<StudyPlanItem | null>(null);
  const [questionPromptSolvedCount, setQuestionPromptSolvedCount] = useState<number | ''>('');
  const [questionPromptCorrectCount, setQuestionPromptCorrectCount] = useState<number | ''>('');
  const [questionPromptWrongCount, setQuestionPromptWrongCount] = useState<number | ''>('');
  const [questionPromptNotes, setQuestionPromptNotes] = useState<string>('');
  const [questionToast, setQuestionToast] = useState<string | null>(null);

  useEffect(() => {
    if (questionToast) {
      const timer = setTimeout(() => setQuestionToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [questionToast]);

  // New Plan Form State
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [taskType, setTaskType] = useState<string>(actualTaskTypes[0]);
  const [plannedMinutes, setPlannedMinutes] = useState(60);
  const [targetQuestionCount, setTargetQuestionCount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [targetDaysForAdd, setTargetDaysForAdd] = useState<DayOfWeek[]>([today]);
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState<boolean>(false);

  // Add YouTube Video Task Modal States
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [targetDayForAddVideo, setTargetDayForAddVideo] = useState<DayOfWeek>(today);

  const openAddVideoModal = (day?: DayOfWeek) => {
    setTargetDayForAddVideo(day || selectedDay || 'Pazartesi');
    setShowAddVideoModal(true);
  };

  // Completion duration, status & reflection input state
  const [completionMinutesInput, setCompletionMinutesInput] = useState<number>(60);
  const [completionStatusInput, setCompletionStatusInput] = useState<'completed' | 'pending' | 'in_progress'>('completed');
  const [completionReflectionInput, setCompletionReflectionInput] = useState<string | undefined>('Çalıştım');
  const [showModalQuickStatus, setShowModalQuickStatus] = useState<boolean>(false);
  const [showModalQuickReflection, setShowModalQuickReflection] = useState<boolean>(false);

  // List Item Quick Options Visibility Controls
  const [expandedQuickControls, setExpandedQuickControls] = useState<Record<string, boolean>>({});
  const [showAllQuickControls, setShowAllQuickControls] = useState<boolean>(false);

  // Inline Notes States
  const [inlineEditingNotesPlanId, setInlineEditingNotesPlanId] = useState<string | null>(null);
  const [inlineNotesText, setInlineNotesText] = useState<string>('');

  // Process question log when a plan item is completed
  const processQuestionLogOnComplete = (plan: StudyPlanItem) => {
    setQuestionPromptPlan(plan);
    const initialSolved = plan.targetQuestionCount && plan.targetQuestionCount > 0 ? plan.targetQuestionCount : '';
    setQuestionPromptSolvedCount(initialSolved);
    setQuestionPromptCorrectCount('');
    setQuestionPromptWrongCount('');
    
    const taskNotesStr = plan.notes ? plan.notes.trim() : '';
    const defaultNote = taskNotesStr 
      ? `Plandan Eklendi: ${plan.topic} (${taskNotesStr})` 
      : `Plandan Eklendi: ${plan.topic}`;

    setQuestionPromptNotes(defaultNote);
  };

  const handleConfirmQuestionPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionPromptPlan) return;
    const solved = Number(questionPromptSolvedCount);
    if (solved > 0 && onAddQuestionLog) {
      // Remove any previously existing linked log to prevent duplication
      removeLinkedQuestionLog(questionPromptPlan.id);

      const todayStr = new Date().toISOString().split('T')[0];
      const examType = YKS_SUBJECTS.AYT.includes(questionPromptPlan.subject) ? 'AYT' : 'TYT';
      
      const wrong = questionPromptWrongCount !== '' ? Number(questionPromptWrongCount) : 0;
      let correct = questionPromptCorrectCount !== '' ? Number(questionPromptCorrectCount) : Math.max(0, solved - wrong);
      if (questionPromptCorrectCount === '' && questionPromptWrongCount === '') {
        correct = solved;
      }
      const empty = Math.max(0, solved - (correct + wrong));
      const net = Number((correct - (wrong * 0.25)).toFixed(2));

      onAddQuestionLog({
        date: todayStr,
        subject: questionPromptPlan.subject,
        examType: examType,
        targetCount: questionPromptPlan.targetQuestionCount || solved,
        solvedCount: solved,
        correctCount: correct,
        wrongCount: wrong,
        emptyCount: empty,
        netScore: net,
        notes: questionPromptNotes.trim(),
        studyPlanId: questionPromptPlan.id
      });
      setQuestionToast(`Soru takibine ${solved} çözülen soru (${net} Net) başarıyla eklendi (${questionPromptPlan.subject}).`);
    }
    setQuestionPromptPlan(null);
    setQuestionPromptSolvedCount('');
    setQuestionPromptCorrectCount('');
    setQuestionPromptWrongCount('');
    setQuestionPromptNotes('');
  };

  // AI Task Suggestion State & Helper Storage
  const [aiSuggestLoading, setAiSuggestLoading] = useState<boolean>(false);
  const [aiSuggestError, setAiSuggestError] = useState<string | null>(null);
  const [aiSuggestReason, setAiSuggestReason] = useState<string | null>(null);

  const getSuggestionStorageKey = () => `ai_task_suggest_${profile?.id || profile?.name || 'default'}`;
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];

  const handleAiSuggestTask = async () => {
    setAiSuggestLoading(true);
    setAiSuggestError(null);
    setAiSuggestReason(null);

    const storageKey = getSuggestionStorageKey();
    const todayStr = getTodayDateStr();

    let localData: {
      date: string;
      countToday: number;
      draft: {
        suggestion: any;
        saved: boolean;
      } | null;
    } = { date: todayStr, countToday: 0, draft: null };

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.date === todayStr) {
          localData = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse suggestion storage:', e);
    }

    // 1. If an unsaved draft from today exists, use it immediately without calling Gemini API!
    if (localData.draft && !localData.draft.saved && localData.draft.suggestion) {
      const sug = localData.draft.suggestion;
      if (sug.subject) setSubject(sug.subject);
      if (sug.topic) setTopic(sug.topic);
      if (sug.taskType && actualTaskTypes.includes(sug.taskType)) setTaskType(sug.taskType);
      if (sug.plannedMinutes) setPlannedMinutes(Number(sug.plannedMinutes) || 60);
      if (sug.targetQuestionCount !== undefined && sug.targetQuestionCount !== '') {
        setTargetQuestionCount(Number(sug.targetQuestionCount) || '');
      }
      if (sug.notes) setNotes(sug.notes);
      setAiSuggestReason((sug.reason || 'Daha önce aldığınız görev önerisi yüklendi.') + ' (Önceki kaydedilmemiş taslak öneriniz yüklendi)');
      setAiSuggestLoading(false);
      return;
    }

    // 2. Check daily limit (max 2 API queries per day)
    if (localData.countToday >= 2) {
      setAiSuggestError('Günlük 2 olan yapay zeka görev önerisi limitinize ulaştınız. Bugün daha fazla yeni öneri alamazsınız.');
      setAiSuggestLoading(false);
      return;
    }

    // 3. Query Gemini API
    try {
      const currentWeekPlans = studyPlans.filter(p => !p.archived);
      const lastWeekLabel = formatWeekLabelWithYear(addWeeks(selectedMondayDate, -1));
      const lastWeekPlans = getPlansForWeek(lastWeekLabel);

      const res = await fetch('/api/gemini/suggest-study-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          targetDay: targetDaysForAdd[0] || selectedDay || 'Pazartesi',
          currentWeekPlans,
          lastWeekPlans,
          generalMocks,
          branchExams,
          topicErrors,
          questionLogs,
          taskTypes: actualTaskTypes,
          coachDataSettings
        })
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        throw new Error('Yapay zeka servisi geçersiz yanıt döndürdü. Lütfen sunucuyu yeniden başlatıp tekrar deneyiniz.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Yapay zeka görev önerisi şu an alınamadı.');
      }

      const sug = data.suggestion || {};

      if (sug.subject) setSubject(sug.subject);
      if (sug.topic) setTopic(sug.topic);
      if (sug.taskType && actualTaskTypes.includes(sug.taskType)) setTaskType(sug.taskType);
      if (sug.plannedMinutes) setPlannedMinutes(Number(sug.plannedMinutes) || 60);
      if (sug.targetQuestionCount !== undefined && sug.targetQuestionCount !== '') {
        setTargetQuestionCount(Number(sug.targetQuestionCount) || '');
      }
      if (sug.notes) setNotes(sug.notes);
      if (sug.reason) setAiSuggestReason(sug.reason);

      // Save suggestion as unsaved draft and increment countToday
      const updatedStorage = {
        date: todayStr,
        countToday: localData.countToday + 1,
        draft: {
          suggestion: sug,
          saved: false
        }
      };
      localStorage.setItem(storageKey, JSON.stringify(updatedStorage));
    } catch (err: any) {
      console.error('AI Task Suggest error:', err);
      setAiSuggestError(err.message || 'Görev önerisi alınırken bir hata oluştu.');
    } finally {
      setAiSuggestLoading(false);
    }
  };

  // Open add modal
  const openAddModal = (day?: DayOfWeek) => {
    if (day) setTargetDaysForAdd([day]);
    else setTargetDaysForAdd([selectedDay || today]);
    setSubject('');
    setTopic('');
    setNotes('');
    setPlannedMinutes(60);
    setTargetQuestionCount('');
    setTaskType(actualTaskTypes[0]);
    setAiSuggestError(null);
    setAiSuggestReason(null);
    setAiSuggestLoading(false);
    setShowAddModal(true);
  };

  // Create Plan Handler (supports multiple target days)
  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic.trim() || targetDaysForAdd.length === 0) return;

    targetDaysForAdd.forEach((targetDay) => {
      const { date, weekLabel } = getPlanDateAndWeekLabel(targetDay);
      onAddPlan({
        day: targetDay,
        subject,
        topic: topic.trim(),
        taskType: taskType || actualTaskTypes[0],
        plannedMinutes: Number(plannedMinutes) || 60,
        targetQuestionCount: targetQuestionCount !== '' && Number(targetQuestionCount) > 0 ? Number(targetQuestionCount) : undefined,
        completedMinutes: 0,
        status: 'pending',
        notes,
        date,
        weekLabel
      });
    });

    // Mark current draft as saved in localStorage
    try {
      const storageKey = getSuggestionStorageKey();
      const todayStr = getTodayDateStr();
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.date === todayStr && parsed.draft) {
          parsed.draft.saved = true;
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      }
    } catch (e) {}

    setSubject('');
    setTopic('');
    setNotes('');
    setTargetQuestionCount('');
    setAiSuggestError(null);
    setAiSuggestReason(null);
    setShowAddModal(false);
  };

  // Duplicate Plan Handler
  const handleDuplicatePlan = (e: React.MouseEvent, plan: StudyPlanItem) => {
    e.stopPropagation();
    const { date, weekLabel } = getPlanDateAndWeekLabel(plan.day);

    onAddPlan({
      day: plan.day,
      subject: plan.subject,
      topic: plan.topic,
      taskType: plan.taskType,
      plannedMinutes: plan.plannedMinutes,
      targetQuestionCount: plan.targetQuestionCount,
      completedMinutes: 0,
      status: 'pending',
      notes: plan.notes,
      date,
      weekLabel
    });
  };

  // Handle Edit Plan Submit
  const handleSaveEditPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    const originalPlan = studyPlans.find(p => p.id === editingPlan.id);
    const wasCompleted = originalPlan?.status === 'completed';
    const isNowCompleted = editingPlan.status === 'completed';

    if (wasCompleted && !isNowCompleted) {
      const linked = getLinkedQuestionLogs(editingPlan.id, originalPlan?.topic, originalPlan?.subject);
      if (linked.length > 0) {
        setUncompleteConfirm({
          plan: editingPlan,
          targetStatus: editingPlan.status as 'pending' | 'in_progress',
          linkedLogs: linked
        });
        setEditingPlan(null);
        return;
      }
      removeLinkedQuestionLog(editingPlan.id, originalPlan?.topic, originalPlan?.subject);
    }

    onUpdatePlan(editingPlan);
    setEditingPlan(null);
    if (isNowCompleted && !wasCompleted) {
      processQuestionLogOnComplete(editingPlan);
    }
  };

  // Handle Trigger Completion Click
  const handleCheckClick = (e: React.MouseEvent, plan: StudyPlanItem) => {
    e.stopPropagation();
    if (plan.status === 'completed') {
      const linked = getLinkedQuestionLogs(plan.id, plan.topic, plan.subject);
      if (linked.length > 0) {
        setUncompleteConfirm({
          plan,
          targetStatus: 'pending',
          linkedLogs: linked
        });
        return;
      }
      onUpdatePlan({
        ...plan,
        status: 'pending',
        completedMinutes: 0
      });
      removeLinkedQuestionLog(plan.id, plan.topic, plan.subject);
    } else {
      setCompletingPlan(plan);
      setCompletionMinutesInput(plan.plannedMinutes > 0 ? plan.plannedMinutes : 60);
      setCompletionStatusInput('completed');
      setCompletionReflectionInput(plan.reflection || 'Çalıştım');
      setShowModalQuickStatus(false);
      setShowModalQuickReflection(false);
    }
  };

  // Confirm completion with duration & reflection
  const handleConfirmCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingPlan) return;

    const finalMins = Number(completionMinutesInput) || 0;
    const updatedPlan: StudyPlanItem = {
      ...completingPlan,
      completedMinutes: finalMins,
      status: completionStatusInput,
      reflection: completionReflectionInput || completingPlan.reflection
    };
    onUpdatePlan(updatedPlan);
    setCompletingPlan(null);
    if (completionStatusInput === 'completed') {
      processQuestionLogOnComplete(updatedPlan);
    }
  };

  // REORDER / MOVE STUDY PLAN ITEM (INTRA-DAY SORTING & CROSS-DAY DROPPING)
  const handleReorderPlan = (
    sourcePlanId: string, 
    targetDay: DayOfWeek, 
    targetPlanId?: string | null, 
    position?: 'before' | 'after' | null
  ) => {
    if (!sourcePlanId) return;
    const sourceIndex = studyPlans.findIndex(p => p.id === sourcePlanId);
    if (sourceIndex === -1) return;

    const sourcePlan = studyPlans[sourceIndex];
    const isDayChanging = sourcePlan.day !== targetDay;

    let updatedSourcePlan = { ...sourcePlan };
    if (isDayChanging) {
      const { date, weekLabel } = getPlanDateAndWeekLabel(targetDay);
      updatedSourcePlan = {
        ...updatedSourcePlan,
        day: targetDay,
        date,
        weekLabel
      };
    }

    // If dropped on itself without day change, do nothing
    if (targetPlanId === sourcePlanId && !isDayChanging) {
      return;
    }

    const nextPlans = [...studyPlans];
    nextPlans.splice(sourceIndex, 1);

    if (targetPlanId && targetPlanId !== sourcePlanId) {
      const targetIndexInNext = nextPlans.findIndex(p => p.id === targetPlanId);
      if (targetIndexInNext !== -1) {
        const insertIndex = position === 'after' ? targetIndexInNext + 1 : targetIndexInNext;
        nextPlans.splice(insertIndex, 0, updatedSourcePlan);
      } else {
        nextPlans.push(updatedSourcePlan);
      }
    } else {
      // If dropped on empty day column, insert at the end of that day's tasks
      let lastMatchingIdx = -1;
      for (let i = nextPlans.length - 1; i >= 0; i--) {
        if (nextPlans[i].day === targetDay && !nextPlans[i].archived) {
          lastMatchingIdx = i;
          break;
        }
      }
      if (lastMatchingIdx !== -1) {
        nextPlans.splice(lastMatchingIdx + 1, 0, updatedSourcePlan);
      } else {
        nextPlans.push(updatedSourcePlan);
      }
    }

    if (onUpdateAllPlans) {
      onUpdateAllPlans(nextPlans);
    } else if (isDayChanging) {
      onUpdatePlan(updatedSourcePlan);
    }
  };

  // DRAG AND DROP HANDLERS
  const handleDragStart = (e: React.DragEvent, planId: string) => {
    e.dataTransfer.setData('text/plain', planId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPlanId(planId);
  };

  const handleDragEnd = () => {
    setDraggedPlanId(null);
    setDragOverDay(null);
    setDragOverPlanId(null);
    setDropPosition(null);
  };

  const handleDragOver = (e: React.DragEvent, day: DayOfWeek) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDay !== day) {
      setDragOverDay(day);
    }
  };

  const handleDragLeave = (e: React.DragEvent, day: DayOfWeek) => {
    e.preventDefault();
    if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverDay === day) {
        setDragOverDay(null);
      }
    }
  };

  const handleDragOverCard = (e: React.DragEvent, planId: string, day: DayOfWeek) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDay !== day) {
      setDragOverDay(day);
    }
    if (draggedPlanId === planId) {
      setDragOverPlanId(null);
      setDropPosition(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'before' : 'after';
    setDragOverPlanId(planId);
    setDropPosition(pos);
  };

  const handleDragLeaveCard = (e: React.DragEvent, planId: string) => {
    if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverPlanId === planId) {
        setDragOverPlanId(null);
        setDropPosition(null);
      }
    }
  };

  const handleDropCard = (e: React.DragEvent, targetPlanId: string, day: DayOfWeek) => {
    e.preventDefault();
    e.stopPropagation();
    const sourcePlanId = e.dataTransfer.getData('text/plain') || draggedPlanId;
    const pos = dropPosition || 'before';
    setDraggedPlanId(null);
    setDragOverDay(null);
    setDragOverPlanId(null);
    setDropPosition(null);
    if (!sourcePlanId) return;
    handleReorderPlan(sourcePlanId, day, targetPlanId, pos);
  };

  const handleDrop = (e: React.DragEvent, targetDay: DayOfWeek) => {
    e.preventDefault();
    const sourcePlanId = e.dataTransfer.getData('text/plain') || draggedPlanId;
    const targetCardId = dragOverPlanId;
    const pos = dropPosition;
    setDraggedPlanId(null);
    setDragOverDay(null);
    setDragOverPlanId(null);
    setDropPosition(null);
    if (!sourcePlanId) return;
    handleReorderPlan(sourcePlanId, targetDay, targetCardId, pos);
  };

  // TOUCH DRAG AND DROP HANDLERS FOR TABLETS & MOBILE (WITH LONG-PRESS ACTIVATION)
  const handleTouchStart = (e: React.TouchEvent, planId: string) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }

    const touch = e.touches[0];
    if (touch) {
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        moved: false,
        isLongPress: false,
      };
    }

    // Set a timer of 350ms. If the finger does not move significantly within this time, trigger drag mode!
    touchTimeoutRef.current = setTimeout(() => {
      if (touchStartRef.current && !touchStartRef.current.moved) {
        touchStartRef.current.isLongPress = true;
        setTouchDraggedPlanId(planId);
        setDraggedPlanId(planId);
        // Haptic feedback for tactile feel on mobile devices
        if (navigator.vibrate) {
          try {
            navigator.vibrate(40);
          } catch (err) {
            // ignore vibration failures
          }
        }
      }
    }, 350);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    // Detect movement from start position
    if (touchStartRef.current) {
      const dist = Math.hypot(
        touch.clientX - touchStartRef.current.x,
        touch.clientY - touchStartRef.current.y
      );
      
      // If moved more than 8 pixels, cancel the long press timer (this is a scroll/pan, not a press & hold)
      if (dist > 8) {
        touchStartRef.current.moved = true;
        if (touchTimeoutRef.current) {
          clearTimeout(touchTimeoutRef.current);
          touchTimeoutRef.current = null;
        }
      }
    }

    // Only process drag calculations and prevent scrolling if the drag state is actually active (Long press triggered)
    if (touchDraggedPlanId) {
      if (e.cancelable) {
        e.preventDefault();
      }

      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!targetEl) return;

      const cardEl = targetEl.closest('[data-plan-id]') as HTMLElement | null;
      if (cardEl) {
        const planId = cardEl.getAttribute('data-plan-id');
        const cardDay = cardEl.getAttribute('data-plan-day') as DayOfWeek;
        if (cardDay && cardDay !== dragOverDay) {
          setDragOverDay(cardDay);
        }
        if (planId && planId !== touchDraggedPlanId) {
          const rect = cardEl.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const pos = touch.clientY < midY ? 'before' : 'after';
          setDragOverPlanId(planId);
          setDropPosition(pos);
        }
      } else {
        const dayCol = targetEl.closest('[data-day-column]') as HTMLElement | null;
        if (dayCol) {
          const dayAttr = dayCol.getAttribute('data-day-column') as DayOfWeek;
          if (dayAttr && dayAttr !== dragOverDay) {
            setDragOverDay(dayAttr);
          }
          setDragOverPlanId(null);
          setDropPosition(null);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }

    const wasMoved = touchStartRef.current?.moved;
    const isLongPress = touchStartRef.current?.isLongPress;

    if (touchDraggedPlanId && dragOverDay) {
      const sourcePlanId = touchDraggedPlanId;
      const targetCardId = dragOverPlanId;
      const pos = dropPosition;
      const targetDay = dragOverDay;

      handleReorderPlan(sourcePlanId, targetDay, targetCardId, pos);
    }

    // Only prevent default if we were actually dragging (long press triggered and moved)
    if (isLongPress && wasMoved && e.cancelable) {
      e.preventDefault();
    }

    setTouchDraggedPlanId(null);
    setDraggedPlanId(null);
    setDragOverDay(null);
    setDragOverPlanId(null);
    setDropPosition(null);

    // Keep moved flag temporarily to block accidental click modal opening on touch release
    setTimeout(() => {
      touchStartRef.current = null;
    }, 150);
  };

  // Move task via dropdown/button (For touch devices or quick click)
  const handleQuickMoveDay = (plan: StudyPlanItem, newDay: DayOfWeek) => {
    if (plan.day === newDay) return;
    const { date, weekLabel } = getPlanDateAndWeekLabel(newDay);
    onUpdatePlan({
      ...plan,
      day: newDay,
      date,
      weekLabel
    });
  };

  // Active/Displayed Plans for the currently selected week (Past, Current, or Future)
  const activePlans = React.useMemo(() => {
    if (isCurrentWeek) {
      return studyPlans.filter(p => !p.archived && (
        !p.weekLabel || isSameWeekLabel(p.weekLabel, realCurrentWeekLabel)
      ));
    }

    if (isPastWeek) {
      const archivedMatched = studyPlans.filter(p => p.archived && (
        (p.weekLabel && isSameWeekLabel(p.weekLabel, currentWeekLabel)) ||
        (p.date && selectedWeekDays.some(d => d.isoDate === p.date))
      ));
      if (archivedMatched.length > 0) return archivedMatched;

      const unarchivedMatched = studyPlans.filter(p => !p.archived && (
        (p.weekLabel && isSameWeekLabel(p.weekLabel, currentWeekLabel)) ||
        (p.date && selectedWeekDays.some(d => d.isoDate === p.date))
      ));
      if (unarchivedMatched.length > 0) return unarchivedMatched;

      return getPlansForWeek(currentWeekLabel);
    }

    if (isFutureWeek) {
      const futureMatched = studyPlans.filter(p => !p.archived && (
        (p.weekLabel && isSameWeekLabel(p.weekLabel, currentWeekLabel)) ||
        (p.date && selectedWeekDays.some(d => d.isoDate === p.date))
      ));
      return futureMatched;
    }

    return [];
  }, [studyPlans, selectedMondayDate, currentWeekLabel, realCurrentWeekLabel, isCurrentWeek, isPastWeek, isFutureWeek, selectedWeekDays]);

  // Daily Net Study Time Modal & State
  const [dailyStudyLogModalData, setDailyStudyLogModalData] = useState<DailyStudyLogModalData | null>(null);

  const getEffectiveDayStudyMinutes = (day: DayOfWeek, dateKey?: string): { minutes: number; isManual: boolean; notes?: string } => {
    const allLogs = { ...DEFAULT_DAILY_STUDY_LOGS, ...(dailyStudyLogs || {}) };
    if (dateKey && allLogs[dateKey]) {
      return { minutes: allLogs[dateKey].minutes, isManual: true, notes: allLogs[dateKey].notes };
    }
    const altKey = `${currentWeekLabel}_${day}`;
    if (allLogs[altKey]) {
      return { minutes: allLogs[altKey].minutes, isManual: true, notes: allLogs[altKey].notes };
    }
    const matchingLogKey = Object.keys(allLogs).find(k => {
      const log = allLogs[k];
      return log && log.day === day && isSameWeekLabel(log.weekLabel || '', currentWeekLabel);
    });
    if (matchingLogKey && allLogs[matchingLogKey]) {
      return { minutes: allLogs[matchingLogKey].minutes, isManual: true, notes: allLogs[matchingLogKey].notes };
    }
    const dayPlans = activePlans.filter(p => p.day === day);
    const taskMinutes = dayPlans.reduce((sum, p) => sum + (p.completedMinutes || 0), 0);
    return { minutes: taskMinutes, isManual: false, notes: undefined };
  };

  const openDailyStudyLogModal = (day: DayOfWeek) => {
    const dateInfo = selectedWeekDaysMap?.[day];
    const dateStr = dateInfo?.isoDate || getPlanDateAndWeekLabel(day).date;
    const displayDate = dateInfo?.displayDate || '';
    const { minutes, isManual, notes } = getEffectiveDayStudyMinutes(day, dateStr);
    const dayPlans = activePlans.filter(p => p.day === day);
    const taskMinutes = dayPlans.reduce((sum, p) => sum + (p.completedMinutes || 0), 0);

    setDailyStudyLogModalData({
      day,
      dateStr,
      displayDate,
      currentMinutes: isManual ? minutes : 0,
      currentNotes: notes || '',
      isManual,
      taskMinutes
    });
  };

  const handleSaveDailyStudyLogModal = (minutes: number, notes?: string) => {
    if (!dailyStudyLogModalData || !onSaveDailyStudyLog) return;
    const dateKey = dailyStudyLogModalData.dateStr;
    if (minutes <= 0) {
      onSaveDailyStudyLog(dateKey, null);
    } else {
      onSaveDailyStudyLog(dateKey, {
        date: dateKey,
        day: dailyStudyLogModalData.day,
        weekLabel: currentWeekLabel,
        minutes,
        notes,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleDeleteDailyStudyLogModal = () => {
    if (!dailyStudyLogModalData || !onSaveDailyStudyLog) return;
    onSaveDailyStudyLog(dailyStudyLogModalData.dateStr, null);
  };

  // ── AI SMART ADD PREFILL EVENT & MOUNT CACHE LISTENER ──
  useEffect(() => {
    const applyPrefill = (detail: any) => {
      if (!detail) return;
      const f = detail.fields || {};

      // ── CASE A: STUDY_SESSION (Günün Net Çalışma Süresi / "+ Net Süre Gir" Modalı) ──
      if (detail.intent === 'STUDY_SESSION') {
        let targetDay: DayOfWeek = selectedDay || today;
        if (f.date) {
          try {
            const d = new Date(f.date);
            const dayNames: DayOfWeek[] = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
            targetDay = dayNames[d.getDay()] || targetDay;
          } catch {}
        }

        setSelectedDay(targetDay);
        setActiveSubTab('tracker');

        const dateInfo = selectedWeekDaysMap?.[targetDay];
        const dateStr = f.date || dateInfo?.isoDate || getPlanDateAndWeekLabel(targetDay).date;
        const displayDate = dateInfo?.displayDate || '';
        const dayPlans = activePlans.filter(p => p.day === targetDay);
        const taskMinutes = dayPlans.reduce((sum, p) => sum + (p.completedMinutes || 0), 0);

        let totalMins = Number(f.durationMinutes) || 0;
        if (totalMins === 0) {
          const textToParse = `${f.notes || ''} ${detail.summary || ''}`;
          const hourMatches = [...textToParse.matchAll(/([0-9]+(?:[.,][0-9]+)?)\s*saat/gi)];
          const minMatches = [...textToParse.matchAll(/([0-9]+)\s*(?:dk|dakika)/gi)];
          
          let parsedMins = 0;
          for (const m of hourMatches) {
            parsedMins += parseFloat(m[1].replace(',', '.')) * 60;
          }
          for (const m of minMatches) {
            parsedMins += parseInt(m[1], 10);
          }
          if (parsedMins > 0) totalMins = Math.round(parsedMins);
        }

        const logNotes = f.notes || (detail.summary && !detail.summary.includes('Net') ? detail.summary : 'Çalışma oturumu');

        setDailyStudyLogModalData({
          day: targetDay,
          dateStr,
          displayDate,
          currentMinutes: totalMins > 0 ? totalMins : 60,
          currentNotes: logNotes,
          isManual: true,
          taskMinutes
        });
        return;
      }

      // ── CASE B: STUDY_PLAN (Yeni Ders / Çalışma Görevi Ekle Modalı) ──
      if (detail.intent === 'STUDY_PLAN') {
        let targetDay: DayOfWeek = selectedDay || today;
        if (f.date) {
          try {
            const d = new Date(f.date);
            const dayNames: DayOfWeek[] = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
            targetDay = dayNames[d.getDay()] || targetDay;
          } catch {}
        }

        setTargetDaysForAdd([targetDay]);
        setSelectedDay(targetDay);

        if (f.subject) {
          setSubject(f.subject);
        }
        if (f.topicName) {
          setTopic(f.topicName);
        }
        if (f.durationMinutes) {
          setPlannedMinutes(Number(f.durationMinutes) || 60);
        }
        if (f.totalQuestions) {
          setTargetQuestionCount(Number(f.totalQuestions) || '');
        }

        const noteParts: string[] = [];
        if (f.time) noteParts.push(`Saat: ${f.time}`);
        if (f.notes) noteParts.push(f.notes);
        if (noteParts.length > 0) {
          setNotes(noteParts.join(' - '));
        }

        setActiveSubTab('tracker');
        setShowAddModal(true);
      }
    };

    const cached = (window as any).__lastSmartAddPrefill;
    if (cached && (cached.intent === 'STUDY_PLAN' || cached.intent === 'STUDY_SESSION') && Date.now() - cached.timestamp < 3500) {
      applyPrefill(cached);
      delete (window as any).__lastSmartAddPrefill;
    }

    const handleSmartAddPrefill = (e: any) => {
      applyPrefill(e.detail);
    };

    window.addEventListener('yks_smart_add_prefill', handleSmartAddPrefill);
    return () => window.removeEventListener('yks_smart_add_prefill', handleSmartAddPrefill);
  }, [today, selectedDay, selectedWeekDaysMap, activePlans]);

  // Weekly Stats Calculation
  const totalWeeklyPlannedMins = activePlans.reduce((acc, curr) => acc + (curr.plannedMinutes || 0), 0);
  const totalWeeklyCompletedMins = activePlans.reduce((acc, curr) => acc + (curr.completedMinutes || 0), 0);
  const effectiveWeeklyCompletedMins = DAYS.reduce((sum, d) => {
    const dateKey = selectedWeekDaysMap?.[d]?.isoDate;
    return sum + getEffectiveDayStudyMinutes(d, dateKey).minutes;
  }, 0);
  const totalWeeklyTasks = activePlans.length;
  const completedWeeklyTasks = activePlans.filter((p) => p.status === 'completed').length;
  const weeklyTaskCompletionRate = totalWeeklyTasks > 0 
    ? Math.round((completedWeeklyTasks / totalWeeklyTasks) * 100) 
    : 0;
  const weeklyDurationCompletionRate = totalWeeklyPlannedMins > 0 
    ? Math.round((effectiveWeeklyCompletedMins / totalWeeklyPlannedMins) * 100) 
    : 0;

  // Daily Stats Calculation
  const currentDayPlans = activePlans.filter((p) => p.day === selectedDay);
  const totalDailyPlannedMins = currentDayPlans.reduce((acc, curr) => acc + (curr.plannedMinutes || 0), 0);
  const totalDailyCompletedMins = currentDayPlans.reduce((acc, curr) => acc + (curr.completedMinutes || 0), 0);
  const selectedDayDateKey = selectedWeekDaysMap?.[selectedDay]?.isoDate;
  const effectiveDailyLog = getEffectiveDayStudyMinutes(selectedDay, selectedDayDateKey);
  const effectiveDailyCompletedMins = effectiveDailyLog.minutes;
  const totalDailyTasks = currentDayPlans.length;
  const completedDailyTasks = currentDayPlans.filter((p) => p.status === 'completed').length;
  const dailyTaskCompletionRate = totalDailyTasks > 0 
    ? Math.round((completedDailyTasks / totalDailyTasks) * 100) 
    : 0;
  const dailyDurationCompletionRate = totalDailyPlannedMins > 0 
    ? Math.round((effectiveDailyCompletedMins / totalDailyPlannedMins) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification Banner for Question Tracker Sync */}
      {questionToast && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xl text-xs font-bold animate-in slide-in-from-top-2 duration-300 backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{questionToast}</span>
          </div>
          <button 
            onClick={() => setQuestionToast(null)} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Level Sub-Tabs & Actions Wrapper */}
      {!isZenMode && (
      <div className="flex flex-row items-center justify-between border-b border-slate-800/80 gap-2 pb-0.5 overflow-x-auto no-scrollbar">
        {/* Left Side: Tab triggers */}
        <div className="flex gap-2 sm:gap-6 shrink-0">
          <button
            onClick={() => setActiveSubTab('tracker')}
            className={`pb-3.5 text-xs md:text-sm font-black tracking-tight relative transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'tracker'
                ? 'text-white font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
              <span className="sm:hidden">Aktif Plan</span>
              <span className="hidden sm:inline">Aktif Çalışma Planı</span>
            </div>
            {activeSubTab === 'tracker' && (
              <motion.div
                layoutId="plannerActiveTabLine"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`pb-3.5 text-xs md:text-sm font-black tracking-tight relative transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'text-white font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
              <span className="sm:hidden">Plan Arşivi</span>
              <span className="hidden sm:inline">Plan Arşivi & İstatistikler</span>
            </div>
            {activeSubTab === 'history' && (
              <motion.div
                layoutId="plannerActiveTabLine"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
              />
            )}
          </button>
        </div>

        {/* Right Side: Print Button & Week Template Copy Buttons */}
        <div className="flex items-center shrink-0 pb-1.5 sm:pb-0 gap-2">
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-4 sm:py-3 bg-indigo-950/60 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 hover:border-indigo-400 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
            title="Haftalık ders çalışma planını resmi siyah-beyaz formatta PDF olarak indir veya yazdır"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">Haftalık Planı Yazdır / PDF</span>
          </button>

          {isPastWeek && (
            <button
              type="button"
              onClick={() => handleInitiateApplyPastWeek(currentWeekLabel)}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-4 sm:py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
              title="Bu haftanın ders çalışma planı şablonunu güncel (bu) haftaya aktar"
            >
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden">Bu Planı Uygula</span>
              <span className="hidden sm:inline">Bu Planı Güncel Haftaya Uygula</span>
            </button>
          )}

          {isCurrentWeek && (
            <button
              type="button"
              onClick={() => handleInitiateApplyPlanToNextWeek(realCurrentWeekLabel)}
              className="hidden sm:inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-4 sm:py-3 bg-purple-950/60 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/40 hover:border-purple-400 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
              title="Bu haftanın ders çalışma programını gelecek haftaya kopyalar"
            >
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
              <span className="hidden sm:inline">Gelecek Haftaya Kopyala</span>
            </button>
          )}

          {isFutureWeek && (
            <div className="flex items-center space-x-2">
              {activePlans.length > 0 && (
                <button
                  type="button"
                  onClick={handleInitiateClearFutureWeek}
                  className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-4 sm:py-3 bg-rose-950/60 hover:bg-rose-600/30 text-rose-300 hover:text-white border border-rose-500/40 hover:border-rose-400 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
                  title="Gelecek haftanın tüm ders planlarını temizler ve baştan planlamanızı sağlar"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                  <span className="sm:hidden">Temizle</span>
                  <span className="hidden sm:inline">Planı Temizle</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleInitiateApplyPlanToNextWeek(realCurrentWeekLabel)}
                className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-4 sm:py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
                title="Güncel (bu) haftanın ders programı şablonunu buraya aktarır"
              >
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="sm:hidden">Şablon Yükle</span>
                <span className="hidden sm:inline">Bu Haftanın Şablonunu Yükle</span>
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* SUNDAY / WEEKEND NEXT WEEK PLANNING COACH BANNER */}
      {!isZenMode && (today === 'Pazar' || today === 'Cumartesi') && isCurrentWeek && activeSubTab === 'tracker' && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-950/90 via-purple-950/70 to-slate-900/90 border border-indigo-500/40 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 shadow-inner">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-indigo-300 uppercase tracking-wider">🎯 Yeni Hafta Planlama Zamanı</span>
                {studyPlans.filter(p => !p.archived && p.weekLabel && isSameWeekLabel(p.weekLabel, nextWeekLabel)).length > 0 ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {studyPlans.filter(p => !p.archived && p.weekLabel && isSameWeekLabel(p.weekLabel, nextWeekLabel)).length} Ders Hazır
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Henüz Planlanmadı
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-2xl">
                {studyPlans.filter(p => !p.archived && p.weekLabel && isSameWeekLabel(p.weekLabel, nextWeekLabel)).length === 0 
                  ? `Önümüzdeki haftanın (${nextWeekLabel}) ders çalışma programını şimdiden hazırlayarak yeni haftaya avantajlı ve motive başlayabilirsin!`
                  : `Gelecek hafta (${nextWeekLabel}) için şimdiden ${studyPlans.filter(p => !p.archived && p.weekLabel && isSameWeekLabel(p.weekLabel, nextWeekLabel)).length} ders planladın. Planını incelemek veya yeni dersler eklemek için hemen geçiş yapabilirsin.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-auto w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleInitiateApplyPlanToNextWeek(realCurrentWeekLabel)}
              className="px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center space-x-1.5"
              title="Bu haftanın ders programı şablonunu gelecek haftaya kopyalar"
            >
              <Copy className="w-3.5 h-3.5 text-purple-400" />
              <span>Bu Haftayı Gelecek Haftaya Kopyala</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setWeekSlideDirection('next');
                setSelectedMondayDate(nextMonday);
              }}
              className="px-4 py-2.5 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer flex items-center space-x-1.5"
              title="Önümüzdeki haftanın planlama tablosuna gider"
            >
              <span>Gelecek Haftayı Planla</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'tracker' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* COMPACT TOP BAR FOR SADE / FULLSCREEN FOCUS MODE */}
          {isZenMode && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-row items-center overflow-x-auto no-scrollbar max-w-full p-1 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0 gap-1">
                  <button
                    onClick={() => setViewMode('daily')}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      viewMode === 'daily'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5 shrink-0" />
                    <span>Günlük Plan ({selectedDay})</span>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode('board');
                      onZenModeChange?.(true);
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      viewMode === 'board'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                    <span>Haftalık Plan</span>
                  </button>

                  <button
                    onClick={() => setViewMode('stats')}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      viewMode === 'stats'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5 shrink-0" />
                    <span>Haftalık İstatistikler</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openAddVideoModal()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center space-x-1 border border-indigo-400/40 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <Youtube className="w-4 h-4 shrink-0" />
                  <span>Video Ekle</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAddModal()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 border border-indigo-400/40 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Yeni Görev Ekle</span>
                </button>
              </div>

              {/* Exit Sade / Fullscreen Button */}
              <button
                onClick={() => onZenModeChange?.(false)}
                className="bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-lg flex items-center space-x-2 cursor-pointer shrink-0 ml-auto active:scale-95 group"
                title="Sade Moddan Çık (Normal Görünüm)"
              >
                <Minimize className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                <span>Tam Ekrandan Çık</span>
              </button>
            </div>
          )}

          {/* Top Banner & View Switcher (Normal Mode) */}
          {!isZenMode && (
          <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900/80 to-purple-900/60 border border-indigo-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col gap-2.5 sm:gap-3 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3 min-w-0">
                <div className="min-w-0 space-y-1">
                  <div className="hidden landscape:flex sm:flex items-center space-x-2 text-indigo-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-0.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">YKS Haftalık Çalışma Düzenleyici</span>
                  </div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate leading-tight">
                    Günlük - Haftalık Çalışma Planı
                  </h1>
                  <p className="hidden landscape:block sm:block text-slate-300 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
                    Görevlerin üzerine basılı tutarak gün değiştirebilir (Sürükle & Bırak), tamamlanan dersleri işaretleyebilir ve haftalık ders programınızı yönetebilirsiniz. Tamamlanan görevlerinizdeki sorularınız soru takip sayfasına aktarılır.
                  </p>
                </div>

                {/* Enter Sade / Fullscreen Mode Button (Desktop Only) */}
                <button
                  onClick={() => onZenModeChange?.(true)}
                  className="hidden sm:flex bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/40 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/30 items-center space-x-2 cursor-pointer shrink-0 self-start sm:self-center active:scale-95 group"
                  title="Sade / Tam Ekran Çalışma Moduna Geç"
                >
                  <Maximize className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Sade Mod (Tam Ekran)</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 sm:pt-3 border-t border-indigo-500/20">
                {/* View Switcher Tabs (Single line on mobile) */}
                <div className="flex flex-row items-center overflow-x-auto no-scrollbar max-w-full p-1 bg-slate-950/60 border border-slate-800 rounded-xl sm:rounded-2xl shrink-0 gap-1">
                  <button
                    onClick={() => setViewMode('daily')}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      viewMode === 'daily'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">
                      Günlük ({
                        selectedDay === 'Pazartesi' ? 'Pzt' :
                        selectedDay === 'Çarşamba' ? 'Çarş' :
                        selectedDay === 'Perşembe' ? 'Perş' :
                        selectedDay === 'Cumartesi' ? 'Cmt' :
                        selectedDay === 'Pazar' ? 'Paz' : selectedDay
                      })
                    </span>
                    <span className="hidden sm:inline">Günlük Plan ({selectedDay})</span>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('board');
                      onZenModeChange?.(true);
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      viewMode === 'board'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">Haftalık</span>
                    <span className="hidden sm:inline">Haftalık Plan</span>
                  </button>
                  <button
                    onClick={() => setViewMode('stats')}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      viewMode === 'stats'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">İstatistik</span>
                    <span className="hidden sm:inline">Haftalık İstatistikler</span>
                  </button>
                </div>

                {/* Add task buttons & Weekly AI Report Card */}
                <div className="flex flex-row items-center justify-between sm:justify-start gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setShowWeeklyReportModal(true)}
                    title="Bu haftanın yapay zeka gelişim karnesi ve YKS sıralama tahminini görüntüle"
                    className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 hover:text-white border border-amber-500/40 text-[11px] sm:text-xs font-black px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all shadow-md shadow-amber-500/10 flex items-center space-x-1.5 cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                  >
                    <Award className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>AI Karnesi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddVideoModal()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all shadow-md shadow-indigo-600/30 flex items-center space-x-1 border border-indigo-400/40 cursor-pointer shrink-0 whitespace-nowrap flex-1 sm:flex-initial justify-center"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <Youtube className="w-4 h-4 shrink-0" />
                    <span>Video Ekle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddModal()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 border border-indigo-400/40 cursor-pointer shrink-0 whitespace-nowrap flex-1 sm:flex-initial justify-center"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Yeni Görev Ekle</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

      {/* QUICK SUMMARY METRICS BAR */}
      {!isZenMode && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Combined planned & realized card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase truncate">
                {viewMode === 'daily' ? `Günün Çalışma Süresi (${selectedDay})` : 'Haftalık Çalışma Süresi'}
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                %{viewMode === 'daily' ? dailyDurationCompletionRate : weeklyDurationCompletionRate} Süre Uyumu
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-1">
              <div className="text-base font-black text-white font-mono">
                <span className="text-xs font-semibold text-slate-400 mr-1.5">Planlanan:</span>
                {Math.floor((viewMode === 'daily' ? totalDailyPlannedMins : totalWeeklyPlannedMins) / 60)}<span className="text-xs font-semibold text-slate-400">sa</span> {(viewMode === 'daily' ? totalDailyPlannedMins : totalWeeklyPlannedMins) % 60}<span className="text-xs font-semibold text-slate-400">dk</span>
              </div>
              <span className="hidden sm:inline text-slate-700">|</span>
              <div className="text-base font-black text-emerald-400 font-mono">
                <span className="text-xs font-semibold text-slate-400 mr-1.5">Gerçekleşen:</span>
                {Math.floor((viewMode === 'daily' ? effectiveDailyCompletedMins : effectiveWeeklyCompletedMins) / 60)}<span className="text-xs font-semibold text-slate-400">sa</span> {(viewMode === 'daily' ? effectiveDailyCompletedMins : effectiveWeeklyCompletedMins) % 60}<span className="text-xs font-semibold text-slate-400">dk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completed tasks card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              {viewMode === 'daily' ? `Tamamlanan Görev (${selectedDay})` : 'Tamamlanan Görev (Haftalık)'}
            </div>
            <div className="text-base font-black text-white font-mono">
              {viewMode === 'daily' ? completedDailyTasks : completedWeeklyTasks} / {viewMode === 'daily' ? totalDailyTasks : totalWeeklyTasks} <span className="text-xs font-semibold text-purple-300">({viewMode === 'daily' ? dailyTaskCompletionRate : weeklyTaskCompletionRate}%)</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* CENTERED WEEK NAVIGATOR (< Hafta >) FOR HOURLY & WEEKLY BOARD */}
      {viewMode === 'board' && (
        <div className="flex flex-col items-center justify-center my-2 sm:my-3 space-y-2">
          <div className="flex items-center justify-between bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-1.5 sm:p-2 backdrop-blur-xl shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 group"
              title="Önceki Hafta"
              aria-label="Önceki Hafta"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="flex flex-col items-center justify-center text-center px-3 min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Haftalık Çalışma Takvimi</span>
              </span>
              <h2 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight truncate max-w-full mt-0.5">
                {currentWeekLabel}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 group"
              title="Sonraki Hafta"
              aria-label="Sonraki Hafta"
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {!isCurrentWeek && (
            <button
              type="button"
              onClick={handleGoToCurrentWeek}
              className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bu Haftaya Dön</span>
            </button>
          )}
        </div>
      )}

      {/* CENTERED DAY NAVIGATOR (< Gün >) WITH SLIDE ANIMATION */}
      {viewMode === 'daily' && (
        <div className="flex items-center justify-center my-2 sm:my-3">
          <div className="flex items-center justify-between bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-1.5 sm:p-2 backdrop-blur-xl shadow-xl w-full max-w-xs sm:max-w-sm md:max-w-md">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 group"
              title="Önceki Gün"
              aria-label="Önceki Gün"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="flex-1 text-center overflow-hidden px-2 sm:px-4 min-w-0">
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div
                  key={selectedDay}
                  custom={slideDirection}
                  initial={((direction: any) => ({
                    x: direction === 'next' ? 60 : -60,
                    opacity: 0,
                  })) as any}
                  animate={{
                    x: 0,
                    opacity: 1,
                  }}
                  exit={((direction: any) => ({
                    x: direction === 'next' ? -60 : 60,
                    opacity: 0,
                  })) as any}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center gap-2"
                >
                  <span className="text-base sm:text-xl font-black text-white tracking-wide truncate">
                    {selectedDay}
                  </span>
                  {selectedDay === today && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      Bugün
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 group"
              title="Sonraki Gün"
              aria-label="Sonraki Gün"
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: DRAG & DROP WEEKLY BOARD WITH SLIDE ANIMATION */}
      {viewMode === 'board' && (
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={weekSlideDirection}>
            <motion.div
              key={selectedMondayDate.getTime()}
              custom={weekSlideDirection}
              initial={((direction: any) => ({
                x: direction === 'next' ? 60 : -60,
                opacity: 0,
              })) as any}
              animate={{
                x: 0,
                opacity: 1,
              }}
              exit={((direction: any) => ({
                x: direction === 'next' ? -60 : 60,
                opacity: 0,
              })) as any}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <StudyPlannerWeeklyBoard
                activePlans={activePlans}
                today={today}
                DAYS={DAYS}
                getSubjectTheme={getSubjectTheme}
                DAY_COLUMN_STYLES={DAY_COLUMN_STYLES}
                dragOverDay={dragOverDay}
                dragOverPlanId={dragOverPlanId}
                dropPosition={dropPosition}
                draggedPlanId={draggedPlanId}
                touchDraggedPlanId={touchDraggedPlanId}
                openMoveMenuPlanId={openMoveMenuPlanId}
                setOpenMoveMenuPlanId={setOpenMoveMenuPlanId}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleDragOverCard={handleDragOverCard}
                handleDragLeaveCard={handleDragLeaveCard}
                handleDropCard={handleDropCard}
                handleDragStart={handleDragStart}
                handleDragEnd={handleDragEnd}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
                handleCheckClick={handleCheckClick}
                handleQuickMoveDay={handleQuickMoveDay}
                handleDuplicatePlan={handleDuplicatePlan}
                openAddModal={openAddModal}
                openAddVideoModal={openAddVideoModal}
                openPrintModal={() => setShowPrintModal(true)}
                setEditingPlan={setEditingPlan}
                setDeletingPlan={setDeletingPlan}
                touchStartRef={touchStartRef}
                weekDaysMap={selectedWeekDaysMap}
                isArchivedWeek={isPastWeek}
                isFutureWeek={isFutureWeek}
                getEffectiveDayStudyMinutes={getEffectiveDayStudyMinutes}
                openDailyStudyLogModal={openDailyStudyLogModal}
                onApplyPastWeekToCurrent={() => handleInitiateApplyPastWeek(currentWeekLabel)}
                onApplyCurrentWeekToFuture={() => handleInitiateApplyPlanToNextWeek(realCurrentWeekLabel)}
                onClearFutureWeekPlan={handleInitiateClearFutureWeek}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* VIEW 2: SINGLE DAY FOCUS DETAIL VIEW */}
      {viewMode === 'daily' && (
        <StudyPlannerDailyView
          activePlans={activePlans}
          selectedDay={selectedDay}
          getSubjectTheme={getSubjectTheme}
          openAddModal={openAddModal}
          openAddVideoModal={openAddVideoModal}
          setEditingPlan={setEditingPlan}
          setDeletingPlan={setDeletingPlan}
          onUpdatePlan={onUpdatePlan}
          handleCheckClick={handleCheckClick}
          handleDuplicatePlan={handleDuplicatePlan}
          QUICK_REFLECTIONS={QUICK_REFLECTIONS}
          processQuestionLogOnComplete={processQuestionLogOnComplete}
          getLinkedQuestionLogs={getLinkedQuestionLogs}
          removeLinkedQuestionLog={removeLinkedQuestionLog}
          setUncompleteConfirm={setUncompleteConfirm}
          isArchivedWeek={isPastWeek}
          getEffectiveDayStudyMinutes={getEffectiveDayStudyMinutes}
          openDailyStudyLogModal={openDailyStudyLogModal}
          weekDaysMap={selectedWeekDaysMap}
        />
      )}

        </div>
      )}

      {/* VIEW 3 & 4: STATS AND HISTORY */}
      <StudyPlannerStatsView
        viewMode={viewMode}
        activeSubTab={activeSubTab}
        DAYS={DAYS}
        activePlans={activePlans}
        orderedWeeks={orderedWeeks}
        activeHistoryWeek={activeHistoryWeek}
        setSelectedHistoryWeek={setSelectedHistoryWeek}
        historyWeeksPage={historyWeeksPage}
        setHistoryWeeksPage={setHistoryWeeksPage}
        subjectChartScope={subjectChartScope}
        setSubjectChartScope={setSubjectChartScope}
        subjectChartMetric={subjectChartMetric}
        setSubjectChartMetric={setSubjectChartMetric}
        getWeeklyStats={getWeeklyStats}
        getSubjectDistributionStats={getSubjectDistributionStats}
        getPlansForWeek={getPlansForWeek}
        getEffectiveDayStudyMinutes={getEffectiveDayStudyMinutes}
        weekDaysMap={selectedWeekDaysMap}
        dailyStudyLogs={dailyStudyLogs}
        today={today}
        openDailyStudyLogModal={openDailyStudyLogModal}
        getSubjectTheme={getSubjectTheme}
        currentWeekLabel={currentWeekLabel}
        onInitiateApplyPastWeek={handleInitiateApplyPastWeek}
        onApplyPastWeekToNext={handleInitiateApplyPlanToNextWeek}
      />

      {/* ALL MODALS */}
      <StudyPlannerModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        targetDaysForAdd={targetDaysForAdd}
        setTargetDaysForAdd={setTargetDaysForAdd}
        subject={subject}
        setSubject={setSubject}
        topic={topic}
        setTopic={setTopic}
        taskType={taskType}
        setTaskType={setTaskType}
        plannedMinutes={plannedMinutes}
        setPlannedMinutes={setPlannedMinutes}
        targetQuestionCount={targetQuestionCount}
        setTargetQuestionCount={setTargetQuestionCount}
        notes={notes}
        setNotes={setNotes}
        DAYS={DAYS}
        actualTaskTypes={actualTaskTypes}
        handleCreatePlan={handleCreatePlan}
        editingPlan={editingPlan}
        setEditingPlan={setEditingPlan}
        handleSaveEditPlan={handleSaveEditPlan}
        completingPlan={completingPlan}
        setCompletingPlan={setCompletingPlan}
        completionMinutesInput={completionMinutesInput}
        setCompletionMinutesInput={setCompletionMinutesInput}
        showModalQuickStatus={showModalQuickStatus}
        setShowModalQuickStatus={setShowModalQuickStatus}
        completionStatusInput={completionStatusInput}
        setCompletionStatusInput={setCompletionStatusInput}
        showModalQuickReflection={showModalQuickReflection}
        setShowModalQuickReflection={setShowModalQuickReflection}
        completionReflectionInput={completionReflectionInput}
        setCompletionReflectionInput={setCompletionReflectionInput}
        handleConfirmCompletion={handleConfirmCompletion}
        QUICK_REFLECTIONS={QUICK_REFLECTIONS}
        deletingPlan={deletingPlan}
        setDeletingPlan={setDeletingPlan}
        studyPlans={studyPlans}
        removeLinkedQuestionLog={removeLinkedQuestionLog}
        onDeletePlan={onDeletePlan}
        questionPromptPlan={questionPromptPlan}
        setQuestionPromptPlan={setQuestionPromptPlan}
        questionPromptSolvedCount={questionPromptSolvedCount}
        setQuestionPromptSolvedCount={setQuestionPromptSolvedCount}
        questionPromptCorrectCount={questionPromptCorrectCount}
        setQuestionPromptCorrectCount={setQuestionPromptCorrectCount}
        questionPromptWrongCount={questionPromptWrongCount}
        setQuestionPromptWrongCount={setQuestionPromptWrongCount}
        questionPromptNotes={questionPromptNotes}
        setQuestionPromptNotes={setQuestionPromptNotes}
        handleConfirmQuestionPrompt={handleConfirmQuestionPrompt}
        uncompleteConfirm={uncompleteConfirm}
        setUncompleteConfirm={setUncompleteConfirm}
        handleConfirmUncompleteWithLogDeletion={handleConfirmUncompleteWithLogDeletion}
        applyPastWeekModalData={applyPastWeekModalData}
        setApplyPastWeekModalData={setApplyPastWeekModalData}
        handleApplyPastWeekToCurrent={handleApplyPastWeekToCurrent}
        showTaskTypeModal={showTaskTypeModal}
        setShowTaskTypeModal={setShowTaskTypeModal}
        editingTaskTypeIndex={editingTaskTypeIndex}
        setEditingTaskTypeIndex={setEditingTaskTypeIndex}
        editingTaskTypeValue={editingTaskTypeValue}
        setEditingTaskTypeValue={setEditingTaskTypeValue}
        deletingTaskTypeIndex={deletingTaskTypeIndex}
        setDeletingTaskTypeIndex={setDeletingTaskTypeIndex}
        deletingStep={deletingStep}
        setDeletingStep={setDeletingStep}
        newTaskTypeValue={newTaskTypeValue}
        setNewTaskTypeValue={setNewTaskTypeValue}
        handleEditTaskType={handleEditTaskType}
        handleDeleteTaskType={handleDeleteTaskType}
        handleAddTaskType={handleAddTaskType}
        handleAiSuggestTask={handleAiSuggestTask}
        aiSuggestLoading={aiSuggestLoading}
        aiSuggestError={aiSuggestError}
        aiSuggestReason={aiSuggestReason}
        coachDataSettings={coachDataSettings}
        topicStatuses={topicStatuses}
        completedPastTopics={completedPastTopics}
        dailyStudyLogModalData={dailyStudyLogModalData}
        setDailyStudyLogModalData={setDailyStudyLogModalData}
        handleSaveDailyStudyLogModal={handleSaveDailyStudyLogModal}
        handleDeleteDailyStudyLogModal={handleDeleteDailyStudyLogModal}
        clearFutureWeekConfirm={clearFutureWeekConfirm}
        setClearFutureWeekConfirm={setClearFutureWeekConfirm}
        handleConfirmClearFutureWeek={handleConfirmClearFutureWeek}
        currentUser={currentUser}
        profile={profile}
      />

      <AddVideoTaskModal
        isOpen={showAddVideoModal}
        onClose={() => setShowAddVideoModal(false)}
        youtubeVideos={youtubeVideos}
        defaultDay={targetDayForAddVideo}
        DAYS={DAYS}
        onAddPlan={(plan) => {
          const { date, weekLabel } = getPlanDateAndWeekLabel(plan.day);
          onAddPlan({ ...plan, date, weekLabel });
        }}
        weekLabel={currentWeekLabel}
        currentUser={currentUser}
        profile={profile}
      />

      <StudyPlannerPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        activePlans={activePlans}
        weekLabel={currentWeekLabel}
        profile={profile}
        currentUser={currentUser}
        routines={routines}
        weekDaysMap={selectedWeekDaysMap}
      />

      {/* 📊 Haftalık AI Başarı Karnesi Modalı */}
      {showWeeklyReportModal && (
        <WeeklyAiReportCardModal
          isOpen={showWeeklyReportModal}
          onClose={() => setShowWeeklyReportModal(false)}
          currentUser={currentUser}
          profile={profile}
          questionLogs={questionLogs}
          generalMocks={generalMocks}
          studyPlans={studyPlans}
          schoolExams={schoolExams}
          currentWeekLabel={currentWeekLabel}
        />
      )}

      {/* ── FLOATING ACTION BUTTON (+ FAB) ── */}
      <button
        onClick={() => openAddModal()}
        id="fab-add-study-plan-btn"
        aria-label="Yeni Çalışma Görevi Ekle"
        title="Yeni Çalışma Görevi Ekle"
        className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-40 bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full sm:rounded-2xl shadow-[0_10px_25px_rgba(99,102,241,0.45)] border border-indigo-400/40 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group ring-4 ring-indigo-500/20 backdrop-blur-md"
      >
        <Plus className="w-6 h-6 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90 stroke-[2.5]" />
        <span className="hidden sm:inline font-bold text-sm tracking-wide text-white drop-shadow-sm">
          Yeni Görev Ekle
        </span>
      </button>
    </div>
  );
};
