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
  Youtube
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
import { StudyPlanItem, DayOfWeek, QuestionLog, YouTubeVideoItem } from '../types';
import { YKS_SUBJECTS, YKS_CURRICULUM_TOPICS, DEFAULT_TASK_TYPES } from '../data/initialData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { StudyPlannerWeeklyBoard } from './planner/StudyPlannerWeeklyBoard';
import { StudyPlannerDailyView } from './planner/StudyPlannerDailyView';
import { StudyPlannerStatsView } from './planner/StudyPlannerStatsView';
import { StudyPlannerModals } from './planner/StudyPlannerModals';
import { AddVideoTaskModal } from './planner/AddVideoTaskModal';

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
  topicErrors?: any[];
  generalMocks?: any[];
  branchExams?: any[];
  coachDataSettings?: any;
  youtubeVideos?: YouTubeVideoItem[];
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
  topicErrors,
  generalMocks,
  branchExams,
  coachDataSettings,
  youtubeVideos = []
}) => {
  const today = getTodayName();
  const [viewMode, setViewMode] = useState<'board' | 'daily' | 'stats'>('daily');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');

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
  
  const [activeSubTab, setActiveSubTab] = useState<'tracker' | 'history'>('tracker');
  const [selectedHistoryWeek, setSelectedHistoryWeek] = useState<string>('');
  const [historyWeeksPage, setHistoryWeeksPage] = useState<number>(1);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveWeekOffset, setArchiveWeekOffset] = useState<number>(-1);
  const [archiveChoice, setArchiveChoice] = useState<'keep_template' | 'fresh_start' | null>(null);
  const [overwriteStep, setOverwriteStep] = useState<0 | 1 | 2>(0);
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

  const getOffsetDate = (offsetInWeeks: number) => {
    return addWeeks(selectedMondayDate, offsetInWeeks);
  };

  const getOffsetBadgeText = (offset: number) => {
    if (offset === 0) return 'Bu Hafta (Mevcut Hafta)';
    if (offset === -1) return 'Geçen Hafta (1 Hafta Önce)';
    if (offset === -2) return '2 Hafta Önce';
    if (offset < -2) return `${Math.abs(offset)} Hafta Önce`;
    if (offset === 1) return 'Gelecek Hafta (1 Hafta Sonra)';
    return `${offset} Hafta Sonra`;
  };

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
    return orderedWeeks.map(weekLabel => {
      const plans = getPlansForWeek(weekLabel);
      const totalTasks = plans.length;
      const completedTasks = plans.filter(p => p.status === 'completed').length;
      const plannedMin = plans.reduce((acc, p) => acc + p.plannedMinutes, 0);
      const completedMin = plans.reduce((acc, p) => acc + p.completedMinutes, 0);
      
      const taskComplianceRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const durationComplianceRate = plannedMin > 0 ? Math.round((completedMin / plannedMin) * 100) : 0;
      const completedHours = Number((completedMin / 60).toFixed(1));

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

  const executeArchiveAndReset = (choice: 'keep_template' | 'fresh_start', targetWeekLabel: string) => {
    if (!onUpdateAllPlans) return;

    const isTargetCurrentWeek = isSameWeekLabel(targetWeekLabel, currentWeekLabel);

    if (isTargetCurrentWeek) {
      // Filter current active plans
      const activePlansToArchive = studyPlans.filter(p => !p.archived);

      // Archive current active plans with targetWeekLabel
      const archivedPlans = activePlansToArchive.map(p => ({
        ...p,
        id: p.id.startsWith('arch-') ? p.id : 'arch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        archived: true,
        weekLabel: targetWeekLabel
      }));

      // Keep existing archived plans EXCEPT those matching targetWeekLabel (which are overwritten)
      const otherArchivedPlans = studyPlans.filter(p => !(p.archived && p.weekLabel && isSameWeekLabel(p.weekLabel, targetWeekLabel)));

      // Create new active plans for next week
      let newActivePlans: StudyPlanItem[] = [];
      if (choice === 'keep_template') {
        newActivePlans = activePlansToArchive.map(p => ({
          ...p,
          id: 'plan-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          completedMinutes: 0,
          status: 'pending' as const,
          reflection: undefined,
          archived: false,
          weekLabel: undefined,
          date: undefined
        }));
      }

      const updatedAllPlans = [...otherArchivedPlans, ...archivedPlans, ...newActivePlans];
      
      onUpdateAllPlans(
        updatedAllPlans, 
        `Çalışma planı "${targetWeekLabel}" haftasına arşivlendi ve yeni hafta başlatıldı.`
      );
    } else {
      // Archiving a specific past/other week - preserve current active plans!
      const currentActivePlans = studyPlans.filter(p => !p.archived);
      const existingOtherArchived = studyPlans.filter(p => p.archived && !(p.weekLabel && isSameWeekLabel(p.weekLabel, targetWeekLabel)));

      let plansForTargetWeek = studyPlans.filter(p => p.weekLabel && isSameWeekLabel(p.weekLabel, targetWeekLabel));
      if (plansForTargetWeek.length === 0) {
        plansForTargetWeek = currentActivePlans.map(p => ({
          ...p,
          completedMinutes: choice === 'keep_template' ? (p.completedMinutes > 0 ? p.completedMinutes : (p.plannedMinutes || 60)) : 0,
          status: choice === 'keep_template' ? (p.status === 'pending' ? 'completed' : p.status) : ('pending' as const)
        }));
      }

      const archivedPlans = plansForTargetWeek.map(p => ({
        ...p,
        id: p.id.startsWith('arch-') ? p.id : 'arch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        archived: true,
        weekLabel: targetWeekLabel
      }));

      const updatedAllPlans = [...existingOtherArchived, ...archivedPlans, ...currentActivePlans];
      onUpdateAllPlans(
        updatedAllPlans,
        `Geçmiş "${targetWeekLabel}" haftası arşivlendi.`
      );
    }

    setShowArchiveConfirm(false);
    setOverwriteStep(0);
    setArchiveChoice(null);
    setActiveSubTab('history');
    setSelectedHistoryWeek(targetWeekLabel);
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
  const [targetDayForAdd, setTargetDayForAdd] = useState<DayOfWeek>(today);

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
          targetDay: targetDayForAdd,
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
    if (day) setTargetDayForAdd(day);
    else setTargetDayForAdd(selectedDay);
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

  // Create Plan Handler
  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic.trim()) return;

    const { date, weekLabel } = getPlanDateAndWeekLabel(targetDayForAdd);

    onAddPlan({
      day: targetDayForAdd,
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

  // DRAG AND DROP HANDLERS
  const handleDragStart = (e: React.DragEvent, planId: string) => {
    e.dataTransfer.setData('text/plain', planId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPlanId(planId);
  };

  const handleDragEnd = () => {
    setDraggedPlanId(null);
    setDragOverDay(null);
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

  const handleDrop = (e: React.DragEvent, targetDay: DayOfWeek) => {
    e.preventDefault();
    setDragOverDay(null);
    const planId = e.dataTransfer.getData('text/plain') || draggedPlanId;
    if (!planId) return;

    const planToMove = studyPlans.find((p) => p.id === planId);
    if (planToMove && planToMove.day !== targetDay) {
      const { date, weekLabel } = getPlanDateAndWeekLabel(targetDay);
      onUpdatePlan({
        ...planToMove,
        day: targetDay,
        date,
        weekLabel
      });
    }
    setDraggedPlanId(null);
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

    // Set a timer of 400ms. If the finger does not move significantly within this time, trigger drag mode!
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
    }, 400);
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

      const dayCol = targetEl.closest('[data-day-column]') as HTMLElement | null;
      if (dayCol) {
        const dayAttr = dayCol.getAttribute('data-day-column') as DayOfWeek;
        if (dayAttr && dayAttr !== dragOverDay) {
          setDragOverDay(dayAttr);
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
      const planToMove = studyPlans.find((p) => p.id === touchDraggedPlanId);
      if (planToMove && planToMove.day !== dragOverDay) {
        const { date, weekLabel } = getPlanDateAndWeekLabel(dragOverDay);
        onUpdatePlan({
          ...planToMove,
          day: dragOverDay,
          date,
          weekLabel
        });
      }
    }

    // Only prevent default if we were actually dragging (long press triggered and moved)
    if (isLongPress && wasMoved && e.cancelable) {
      e.preventDefault();
    }

    setTouchDraggedPlanId(null);
    setDraggedPlanId(null);
    setDragOverDay(null);

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
      return studyPlans.filter(p => !p.archived);
    }

    if (isPastWeek) {
      const archivedMatched = studyPlans.filter(p => p.archived && (
        (p.weekLabel && isSameWeekLabel(p.weekLabel, currentWeekLabel)) ||
        (p.date && selectedWeekDays.some(d => d.isoDate === p.date))
      ));
      if (archivedMatched.length > 0) return archivedMatched;

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
  }, [studyPlans, selectedMondayDate, currentWeekLabel, isCurrentWeek, isPastWeek, isFutureWeek, selectedWeekDays]);

  // Weekly Stats Calculation
  const totalWeeklyPlannedMins = activePlans.reduce((acc, curr) => acc + (curr.plannedMinutes || 0), 0);
  const totalWeeklyCompletedMins = activePlans.reduce((acc, curr) => acc + (curr.completedMinutes || 0), 0);
  const totalWeeklyTasks = activePlans.length;
  const completedWeeklyTasks = activePlans.filter((p) => p.status === 'completed').length;
  const weeklyCompletionRate = totalWeeklyPlannedMins > 0 
    ? Math.round((totalWeeklyCompletedMins / totalWeeklyPlannedMins) * 100) 
    : 0;

  // Daily Stats Calculation
  const currentDayPlans = activePlans.filter((p) => p.day === selectedDay);
  const totalDailyPlannedMins = currentDayPlans.reduce((acc, curr) => acc + (curr.plannedMinutes || 0), 0);
  const totalDailyCompletedMins = currentDayPlans.reduce((acc, curr) => acc + (curr.completedMinutes || 0), 0);
  const totalDailyTasks = currentDayPlans.length;
  const completedDailyTasks = currentDayPlans.filter((p) => p.status === 'completed').length;
  const dailyCompletionRate = totalDailyPlannedMins > 0 
    ? Math.round((totalDailyCompletedMins / totalDailyPlannedMins) * 100) 
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

        {/* Right Side: Archive Week Button */}
        <div className="flex items-center shrink-0 pb-1.5 sm:pb-0">
          <button
            onClick={() => {
              setArchiveWeekOffset(0);
              setOverwriteStep(0);
              setArchiveChoice(null);
              setShowArchiveConfirm(true);
            }}
            className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-4 sm:py-3 bg-slate-900/60 hover:bg-purple-500/10 text-slate-300 hover:text-purple-400 border border-slate-800 hover:border-purple-500/30 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
            title="Mevcut çalışma haftasını arşive kaldırıp yeni hafta başlatır"
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
            <span className="sm:hidden">Arşive Kaldır</span>
            <span className="hidden sm:inline">Haftayı Arşive Kaldır</span>
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
          <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900/80 to-purple-900/60 border border-indigo-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col gap-3 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-0.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">YKS Haftalık Çalışma Düzenleyici</span>
                  </div>
                  <h1 className="text-sm sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate leading-tight">
                    Günlük - Haftalık Çalışma Planı
                  </h1>
                  <p className="hidden sm:block text-slate-300 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
                    Görevlerin üzerine basılı tutarak gün değiştirebilir (Sürükle & Bırak), tamamlanan dersleri işaretleyebilir ve haftalık ders programınızı yönetebilirsiniz. Tamamlanan görevlerinizdeki sorularınız soru takip sayfasına aktarılır.
                  </p>
                </div>

                {/* Enter Sade / Fullscreen Mode Button */}
                <button
                  onClick={() => onZenModeChange?.(true)}
                  className="bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/40 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer shrink-0 self-start sm:self-center active:scale-95 group"
                  title="Sade / Tam Ekran Çalışma Moduna Geç"
                >
                  <Maximize className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Sade Mod (Tam Ekran)</span>
                  <span className="sm:hidden">Tam Ekran</span>
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
                    <span className="sm:hidden">Günlük ({selectedDay})</span>
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
                    <span className="sm:hidden">İstatistikler</span>
                    <span className="hidden sm:inline">Haftalık İstatistikler</span>
                  </button>
                </div>

                {/* Add task buttons */}
                <div className="flex flex-row items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
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
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              {viewMode === 'daily' ? `Günün Çalışma Süresi (${selectedDay})` : 'Haftalık Çalışma Süresi'}
            </div>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-1">
              <div className="text-base font-black text-white font-mono">
                <span className="text-xs font-semibold text-slate-400 mr-1.5">Planlanan:</span>
                {Math.floor((viewMode === 'daily' ? totalDailyPlannedMins : totalWeeklyPlannedMins) / 60)}<span className="text-xs font-semibold text-slate-400">sa</span> {(viewMode === 'daily' ? totalDailyPlannedMins : totalWeeklyPlannedMins) % 60}<span className="text-xs font-semibold text-slate-400">dk</span>
              </div>
              <span className="hidden sm:inline text-slate-700">|</span>
              <div className="text-base font-black text-emerald-400 font-mono">
                <span className="text-xs font-semibold text-slate-400 mr-1.5">Gerçekleşen:</span>
                {Math.floor((viewMode === 'daily' ? totalDailyCompletedMins : totalWeeklyCompletedMins) / 60)}<span className="text-xs font-semibold text-slate-400">sa</span> {(viewMode === 'daily' ? totalDailyCompletedMins : totalWeeklyCompletedMins) % 60}<span className="text-xs font-semibold text-slate-400">dk</span>
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
              {viewMode === 'daily' ? completedDailyTasks : completedWeeklyTasks} / {viewMode === 'daily' ? totalDailyTasks : totalWeeklyTasks} <span className="text-xs font-semibold text-purple-300">({viewMode === 'daily' ? dailyCompletionRate : weeklyCompletionRate}%)</span>
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
                draggedPlanId={draggedPlanId}
                touchDraggedPlanId={touchDraggedPlanId}
                openMoveMenuPlanId={openMoveMenuPlanId}
                setOpenMoveMenuPlanId={setOpenMoveMenuPlanId}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
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
                setEditingPlan={setEditingPlan}
                setDeletingPlan={setDeletingPlan}
                touchStartRef={touchStartRef}
                weekDaysMap={selectedWeekDaysMap}
                isArchivedWeek={isPastWeek}
                isFutureWeek={isFutureWeek}
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
      />

      {/* ALL MODALS */}
      <StudyPlannerModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        targetDayForAdd={targetDayForAdd}
        setTargetDayForAdd={setTargetDayForAdd}
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
        showArchiveConfirm={showArchiveConfirm}
        setShowArchiveConfirm={setShowArchiveConfirm}
        archiveWeekOffset={archiveWeekOffset}
        setArchiveWeekOffset={setArchiveWeekOffset}
        archiveChoice={archiveChoice}
        setArchiveChoice={setArchiveChoice}
        overwriteStep={overwriteStep}
        setOverwriteStep={setOverwriteStep}
        getOffsetDate={getOffsetDate}
        getWeekLabel={getWeekLabel}
        getOffsetBadgeText={getOffsetBadgeText}
        CHRONOLOGICAL_SEEDS={CHRONOLOGICAL_SEEDS}
        executeArchiveAndReset={executeArchiveAndReset}
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
      />
    </div>
  );
};
