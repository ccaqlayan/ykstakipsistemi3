import React, { useState, useRef, useEffect } from 'react';
import { getWeekLabel, normalizeWeekLabel, parseWeekStartTimestamp } from '../utils/dateUtils';
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
  Minimize
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
import { StudyPlanItem, DayOfWeek, QuestionLog } from '../types';
import { YKS_SUBJECTS, YKS_CURRICULUM_TOPICS, DEFAULT_TASK_TYPES } from '../data/initialData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

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
  onZenModeChange
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
    const d = new Date();
    d.setDate(d.getDate() + offsetInWeeks * 7);
    return d;
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
      if (p.archived && p.weekLabel) {
        const norm = normalizeWeekLabel(p.weekLabel);
        // If it's a duplicate user-archived plan for 20 - 26 Temmuz, drop it
        if (norm === '20 - 26 Temmuz' && (p.weekLabel !== '20 - 26 Temmuz' || p.id.startsWith('plan-') || p.id.startsWith('arch-'))) {
          changed = true;
          return false;
        }
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

    if (changed) {
      onUpdateAllPlans(cleanedPlans);
    }
  }, [studyPlans, onUpdateAllPlans]);

  const getPlansForWeek = (weekLabel: string): StudyPlanItem[] => {
    const norm = normalizeWeekLabel(weekLabel);
    const realArchived = studyPlans.filter(p => p.archived && p.weekLabel && normalizeWeekLabel(p.weekLabel) === norm);
    if (realArchived.length > 0) return realArchived;

    if (norm === '6 - 12 Temmuz') {
      return [
        { id: 'seed-1-1', day: 'Pazartesi', subject: 'Matematik', topic: 'Temel Kavramlar', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: norm, archived: true },
        { id: 'seed-1-2', day: 'Pazartesi', subject: 'Türkçe', topic: 'Paragrafta Yapı', plannedMinutes: 45, completedMinutes: 45, status: 'completed', targetQuestionCount: 30, weekLabel: norm, archived: true },
        { id: 'seed-1-3', day: 'Salı', subject: 'Fizik', topic: 'Vektörler', plannedMinutes: 60, completedMinutes: 45, status: 'in_progress', targetQuestionCount: 25, weekLabel: norm, archived: true },
        { id: 'seed-1-4', day: 'Çarşamba', subject: 'Matematik', topic: 'Sayı Basamakları', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: norm, archived: true },
        { id: 'seed-1-5', day: 'Perşembe', subject: 'Kimya', topic: 'Kimya Bilimi', plannedMinutes: 60, completedMinutes: 60, status: 'completed', targetQuestionCount: 30, weekLabel: norm, archived: true },
        { id: 'seed-1-6', day: 'Cuma', subject: 'Biyoloji', topic: 'Canlıların Ortak Özellikleri', plannedMinutes: 60, completedMinutes: 0, status: 'pending', targetQuestionCount: 30, weekLabel: norm, archived: true },
        { id: 'seed-1-7', day: 'Cumartesi', subject: 'Tarih', topic: 'Tarih ve Zaman', plannedMinutes: 45, completedMinutes: 45, status: 'completed', targetQuestionCount: 20, weekLabel: norm, archived: true },
      ];
    }
    if (norm === '13 - 19 Temmuz') {
      return [
        { id: 'seed-2-1', day: 'Pazartesi', subject: 'Matematik', topic: 'Bölme-Bölünebilme', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 45, weekLabel: norm, archived: true },
        { id: 'seed-2-2', day: 'Pazartesi', subject: 'Türkçe', topic: 'Paragrafta Ana Düşünce', plannedMinutes: 45, completedMinutes: 45, status: 'completed', targetQuestionCount: 30, weekLabel: norm, archived: true },
        { id: 'seed-2-3', day: 'Salı', subject: 'Fizik', topic: 'Bağıl Hareket', plannedMinutes: 75, completedMinutes: 75, status: 'completed', targetQuestionCount: 30, weekLabel: norm, archived: true },
        { id: 'seed-2-4', day: 'Çarşamba', subject: 'Matematik', topic: 'EBOB-EKOK', plannedMinutes: 120, completedMinutes: 120, status: 'completed', targetQuestionCount: 50, weekLabel: norm, archived: true },
        { id: 'seed-2-5', day: 'Perşembe', subject: 'Kimya', topic: 'Atom ve Periyodik Sistem', plannedMinutes: 75, completedMinutes: 30, status: 'in_progress', targetQuestionCount: 30, weekLabel: norm, archived: true },
        { id: 'seed-2-6', day: 'Cuma', subject: 'Biyoloji', topic: 'Canlıların Temel Bileşenleri', plannedMinutes: 60, completedMinutes: 60, status: 'completed', targetQuestionCount: 35, weekLabel: norm, archived: true },
        { id: 'seed-2-7', day: 'Pazar', subject: 'Geometri', topic: 'Doğruda ve Üçgende Açılar', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: norm, archived: true },
      ];
    }
    if (norm === '20 - 26 Temmuz') {
      return [
        { id: 'seed-3-1', day: 'Pazartesi', subject: 'Matematik', topic: 'Rasyonel Sayılar', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: norm, archived: true },
        { id: 'seed-3-2', day: 'Pazartesi', subject: 'Türkçe', topic: 'Anlatım Biçimleri', plannedMinutes: 45, completedMinutes: 45, status: 'completed', targetQuestionCount: 30, weekLabel: norm, archived: true },
        { id: 'seed-3-3', day: 'Salı', subject: 'Fizik', topic: 'Newton’ın Hareket Yasaları', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 35, weekLabel: norm, archived: true },
        { id: 'seed-3-4', day: 'Çarşamba', subject: 'Matematik', topic: 'Birinci Dereceden Denklemler', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: norm, archived: true },
        { id: 'seed-3-5', day: 'Perşembe', subject: 'Kimya', topic: 'Kimyasal Türler Arası Etkileşimler', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 30, weekLabel: norm, archived: true },
        { id: 'seed-3-6', day: 'Cuma', subject: 'Biyoloji', topic: 'Hücre Yapısı', plannedMinutes: 75, completedMinutes: 75, status: 'completed', targetQuestionCount: 30, weekLabel: norm, archived: true },
        { id: 'seed-3-7', day: 'Cumartesi', subject: 'Coğrafya', topic: 'Doğa ve İnsan', plannedMinutes: 45, completedMinutes: 45, status: 'completed', targetQuestionCount: 20, weekLabel: norm, archived: true },
        { id: 'seed-3-8', day: 'Pazar', subject: 'Geometri', topic: 'Özel Üçgenler', plannedMinutes: 90, completedMinutes: 90, status: 'completed', targetQuestionCount: 40, weekLabel: norm, archived: true },
      ];
    }

    return [];
  };

  const getOrderedWeeks = (): string[] => {
    const rawLabels = [
      ...studyPlans.filter(p => p.archived && p.weekLabel).map(p => p.weekLabel as string),
      ...CHRONOLOGICAL_SEEDS
    ];
    const normalized = rawLabels.filter(Boolean).map(l => normalizeWeekLabel(l));
    const unique = Array.from(new Set<string>(normalized));
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

    // Filter current active plans
    const activePlansToArchive = studyPlans.filter(p => !p.archived);

    // Archive current active plans with targetWeekLabel
    const archivedPlans = activePlansToArchive.map(p => ({
      ...p,
      archived: true,
      weekLabel: targetWeekLabel
    }));

    // Keep existing archived plans EXCEPT those matching targetWeekLabel (which are overwritten)
    const otherArchivedPlans = studyPlans.filter(p => !(p.archived && p.weekLabel === targetWeekLabel));

    // Create new active plans for next week
    let newActivePlans: StudyPlanItem[] = [];
    if (choice === 'keep_template') {
      newActivePlans = activePlansToArchive.map(p => ({
        ...p,
        id: 'plan-' + Math.random().toString(36).substr(2, 9),
        completedMinutes: 0,
        status: 'pending',
        reflection: undefined,
        archived: false,
        weekLabel: undefined
      }));
    }

    const updatedAllPlans = [...otherArchivedPlans, ...archivedPlans, ...newActivePlans];
    
    onUpdateAllPlans(
      updatedAllPlans, 
      `Çalışma planı "${targetWeekLabel}" haftasına arşivlendi ve yeni hafta başlatıldı.`
    );

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
    setShowAddModal(true);
  };

  // Create Plan Handler
  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic.trim()) return;

    onAddPlan({
      day: targetDayForAdd,
      subject,
      topic: topic.trim(),
      taskType: taskType || actualTaskTypes[0],
      plannedMinutes: Number(plannedMinutes) || 60,
      targetQuestionCount: targetQuestionCount !== '' && Number(targetQuestionCount) > 0 ? Number(targetQuestionCount) : undefined,
      completedMinutes: 0,
      status: 'pending',
      notes
    });

    setSubject('');
    setTopic('');
    setNotes('');
    setTargetQuestionCount('');
    setShowAddModal(false);
  };

  // Duplicate Plan Handler
  const handleDuplicatePlan = (e: React.MouseEvent, plan: StudyPlanItem) => {
    e.stopPropagation();
    onAddPlan({
      day: plan.day,
      subject: plan.subject,
      topic: plan.topic,
      taskType: plan.taskType,
      plannedMinutes: plan.plannedMinutes,
      targetQuestionCount: plan.targetQuestionCount,
      completedMinutes: 0,
      status: 'pending',
      notes: plan.notes
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
      onUpdatePlan({
        ...planToMove,
        day: targetDay
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
        onUpdatePlan({
          ...planToMove,
          day: dragOverDay
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
    onUpdatePlan({
      ...plan,
      day: newDay
    });
  };

  // Active Plans
  const activePlans = studyPlans.filter(p => !p.archived);

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
              setArchiveWeekOffset(-1);
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

                {/* Add task button */}
                <div className="flex flex-row items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                  <button
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
                  initial={(direction) => ({
                    x: direction === 'next' ? 60 : -60,
                    opacity: 0,
                  })}
                  animate={{
                    x: 0,
                    opacity: 1,
                  }}
                  exit={(direction) => ({
                    x: direction === 'next' ? -60 : 60,
                    opacity: 0,
                  })}
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

      {/* VIEW 1: DRAG & DROP WEEKLY BOARD */}
      {viewMode === 'board' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span><strong>Sürükle & Bırak İpucu:</strong> Herhangi bir görevi basılı tutarak başka bir günün sütununa sürükleyin. Sürüklediğinizde hedef sütun mor renkle parlayacaktır.</span>
            </div>
          </div>

          {/* Subject Color Legend */}
          {activePlans.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs">
              <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1">Ders Renkleri:</span>
              {Array.from(new Set<string>(activePlans.map(p => p.subject))).map((subject) => {
                const theme = getSubjectTheme(subject);
                return (
                  <span key={subject} className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${theme.badgeClass}`}>
                    {subject}
                  </span>
                );
              })}
            </div>
          )}

          {/* Drag and Drop Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-3.5">
            {DAYS.map((day) => {
              const dayPlans = activePlans.filter((p) => p.day === day);
              const completedCount = dayPlans.filter((p) => p.status === 'completed').length;
              const isDragTarget = dragOverDay === day;
              const isWeekend = day === 'Cumartesi' || day === 'Pazar';
              const dayStyle = DAY_COLUMN_STYLES[day];
              const isToday = day === today;

              return (
                <div
                  key={day}
                  data-day-column={day}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDragLeave={(e) => handleDragLeave(e, day)}
                  onDrop={(e) => handleDrop(e, day)}
                  className={`flex flex-col rounded-2xl border transition-all duration-200 min-h-[420px] relative overflow-hidden day-column-${dayStyle.dayClassKey} ${
                    isWeekend ? 'lg:col-span-5' : 'lg:col-span-2'
                  } ${
                    isDragTarget
                      ? 'bg-indigo-950/80 border-indigo-500 border-2 shadow-2xl shadow-indigo-500/30 scale-[1.02] z-10'
                      : `${dayStyle.bg} ${dayStyle.border}`
                  }`}
                >
                  {/* Accent Colored Line at the Top of Day Column */}
                  <div className={`h-1.5 w-full ${dayStyle.accentBar}`} />

                  {/* Column Header */}
                  <div className={`p-3.5 border-b flex items-center justify-between day-header-${dayStyle.dayClassKey} ${
                    isDragTarget ? 'bg-indigo-900/90 border-indigo-500/60' : dayStyle.headerBg
                  }`}>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-base sm:text-lg font-black tracking-wider uppercase day-title-text ${
                          isToday ? 'text-white' : dayStyle.titleColor
                        }`}>
                          {day.toUpperCase()}
                        </h3>
                        {isToday && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500 text-white uppercase tracking-wider shadow-sm animate-pulse">
                            BUGÜN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold flex items-center space-x-1 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold day-header-badge ${dayStyle.badgeBg}`}>
                          {completedCount}/{dayPlans.length} Görev Bitti
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openAddModal(day)}
                      className={`p-1.5 rounded-xl transition-all border shadow-sm day-header-add-btn ${
                        isToday
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
                      }`}
                      title={`${day} gününe görev ekle`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Drag Target Banner when hovering */}
                  {isDragTarget && (
                    <div className="m-2 p-2 bg-indigo-500/30 border border-indigo-400/60 rounded-xl text-[11px] font-bold text-indigo-100 text-center animate-pulse">
                      📥 {day.toUpperCase()} Gününe Bırak
                    </div>
                  )}

                  {/* Tasks List inside Day Column */}
                  <div className="p-2.5 flex-1 space-y-2.5">
                    {dayPlans.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-4 border border-dashed border-slate-800 rounded-xl text-center text-[11px] text-slate-500">
                        <span>Görev yok</span>
                        <button
                          onClick={() => openAddModal(day)}
                          className="mt-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                        >
                          + Görev Ekle
                        </button>
                      </div>
                    ) : (
                      dayPlans.map((plan) => {
                        const isBeingDragged = draggedPlanId === plan.id;
                        const subjectTheme = getSubjectTheme(plan.subject);

                        return (
                          <div
                            key={plan.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, plan.id)}
                            onDragEnd={handleDragEnd}
                            onTouchStart={(e) => handleTouchStart(e, plan.id)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchEnd}
                            onContextMenu={(e) => e.preventDefault()}
                            onClick={(e) => {
                              if (touchStartRef.current?.moved) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                              }
                              setEditingPlan(plan);
                            }}
                            className={`group p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing relative select-none ${
                              touchDraggedPlanId === plan.id 
                                ? 'touch-none opacity-80 shadow-indigo-500/30 shadow-xl scale-[1.03] border-indigo-500/80 bg-slate-900' 
                                : 'touch-pan-y'
                            } ${subjectTheme.cardBorderClass} ${
                              isBeingDragged
                                ? 'opacity-40 scale-95 border-dashed border-indigo-400'
                                : plan.status === 'completed'
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                            }`}
                          >
                            {/* Drag Grip Handle */}
                            <div className="flex items-start justify-between gap-1.5 mb-1.5">
                              <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded border truncate max-w-[120px] ${subjectTheme.badgeClass}`}>
                                  {plan.subject}
                                </span>
                                {plan.taskType && (
                                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    {plan.taskType}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
                                
                                <button
                                  type="button"
                                  onClick={(e) => handleCheckClick(e, plan)}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                    plan.status === 'completed'
                                      ? 'bg-emerald-500 text-white'
                                      : 'border border-slate-700 hover:border-emerald-400 text-transparent hover:text-emerald-400/40'
                                  }`}
                                  title={plan.status === 'completed' ? 'Tamamlanmadı yap' : 'Tamamla ve Süre Gir'}
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </button>
                              </div>
                            </div>

                            {/* Topic Title */}
                            <h4 className={`text-xs font-bold leading-snug ${
                              plan.status === 'completed' ? 'line-through text-slate-400 font-normal' : 'text-white'
                            }`}>
                              {plan.topic}
                            </h4>

                            {/* Target Duration & Question Count ONLY */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800/80 font-mono">
                              <span>Hedef: <strong className="text-slate-200">{plan.plannedMinutes}dk</strong></span>
                              {plan.targetQuestionCount ? (
                                <span className="text-emerald-400 font-bold">({plan.targetQuestionCount} Soru)</span>
                              ) : (
                                <span className="text-slate-600 font-medium">(- Soru)</span>
                              )}
                            </div>

                            {/* Quick Day Shift Popover Button (For Touch/Click Convenience) */}
                            <div className="mt-2 pt-1 flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMoveMenuPlanId(openMoveMenuPlanId === plan.id ? null : plan.id);
                                  }}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                                    openMoveMenuPlanId === plan.id
                                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                      : 'bg-slate-900/90 text-slate-300 hover:text-indigo-300 hover:bg-slate-800 border-slate-800'
                                  }`}
                                  title="Günü Değiştir"
                                >
                                  <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                                </button>

                                {openMoveMenuPlanId === plan.id && (
                                  <div className="absolute left-0 bottom-full mb-1.5 z-40 w-36 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                                    <div className="text-[9px] font-extrabold text-indigo-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                                      <span>Günü Seçin</span>
                                      <ArrowRightLeft className="w-2.5 h-2.5 text-indigo-400" />
                                    </div>
                                    {DAYS.map((d) => (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickMoveDay(plan, d);
                                          setOpenMoveMenuPlanId(null);
                                        }}
                                        className={`w-full text-left text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                                          plan.day === d
                                            ? 'bg-indigo-600 text-white font-bold shadow-sm'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                      >
                                        <span>{d}</span>
                                        {plan.day === d && <Check className="w-3 h-3 stroke-[3]" />}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleDuplicatePlan(e, plan)}
                                  className="text-[10px] text-slate-500 hover:text-indigo-400 p-0.5 rounded transition-colors cursor-pointer"
                                  title="Görevi Kopyala"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeletingPlan({ id: plan.id, title: `${plan.day} - ${plan.subject}: ${plan.topic}` })}
                                  className="text-[10px] text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VIEW 2: SINGLE DAY FOCUS DETAIL VIEW */}
      {viewMode === 'daily' && (
        <div className="space-y-6">
          {/* Plan List for Selected Day */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-5 backdrop-blur-md shadow-2xl">
            <div className="flex flex-row items-start justify-between pb-3.5 sm:pb-4 border-b border-slate-800 gap-2 sm:gap-4">
              <div className="min-w-0 flex-1 pr-1 sm:pr-0">
                <h2 className="text-xs sm:text-lg font-black text-white flex items-center space-x-1.5 sm:space-x-2.5 min-w-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" />
                  <span className="truncate">{selectedDay} Günü Detaylı Ders Planı</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                  Görevlerin durumunu tek tıkla değiştirebilir, gerçekleşen sürenizi girebilir ve hızlı değerlendirme yorumları ekleyebilirsiniz.
                </p>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1.5 sm:flex-row sm:items-center sm:gap-3 self-start">
                <span className="inline-flex items-center justify-center text-[10px] sm:text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-full border border-indigo-500/30 font-semibold leading-tight shrink-0 whitespace-nowrap">
                  <span className="font-bold mr-1">{activePlans.filter(p => p.day === selectedDay).length}</span> Görev
                </span>

                <button
                  onClick={() => openAddModal(selectedDay)}
                  className="text-[11px] sm:text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all font-bold flex items-center space-x-1 sm:space-x-1.5 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Görev Ekle</span>
                </button>
              </div>
            </div>

            {activePlans.filter(p => p.day === selectedDay).length === 0 ? (
              <div className="text-center py-14 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-300 font-bold">Bu gün için henüz bir ders görevi planlanmadı.</p>
                <button
                  onClick={() => openAddModal(selectedDay)}
                  className="mt-4 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md"
                >
                  + {selectedDay} Gününe Görev Ekle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activePlans.filter(p => p.day === selectedDay).map((plan) => {
                  const subjectTheme = getSubjectTheme(plan.subject);
                  return (
                    <div
                      key={plan.id}
                      className={`p-5 rounded-2xl border transition-all space-y-4 relative ${subjectTheme.cardBorderClass} ${
                        plan.status === 'completed'
                          ? 'bg-slate-950/70 border-emerald-500/30 shadow-md shadow-emerald-950/10'
                          : plan.status === 'in_progress'
                          ? 'bg-slate-950 border-sky-500/40 shadow-lg shadow-sky-950/20 ring-1 ring-sky-500/20'
                          : 'bg-slate-950 border-slate-800 hover:border-indigo-500/40 shadow-md'
                      }`}
                    >
                    {/* Top-Right Edit & Delete & Check Actions */}
                    <div className="absolute top-4 right-4 flex flex-col items-center gap-2 z-10">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingPlan(plan)}
                          className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-800/80 opacity-50 hover:opacity-100 cursor-pointer shadow-sm"
                          title="Görevi Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDuplicatePlan(e, plan)}
                          className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-xl transition-all border border-slate-800/80 opacity-50 hover:opacity-100 cursor-pointer shadow-sm"
                          title="Görevi Kopyala"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingPlan({ id: plan.id, title: `${plan.day} - ${plan.subject}: ${plan.topic}` })}
                          className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl transition-all border border-slate-800/80 opacity-50 hover:opacity-100 cursor-pointer shadow-sm"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleCheckClick(e, plan)}
                        className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all cursor-pointer shrink-0 shadow-md ${
                          plan.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30 shadow-emerald-500/10'
                            : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                        }`}
                        title={plan.status === 'completed' ? 'Görevi Tamamlanmadı Olarak İşaretle' : 'Görevi Tamamlandı Olarak İşaretle'}
                      >
                        <Check className={`w-4 h-4 ${plan.status === 'completed' ? 'stroke-[3]' : 'stroke-[2]'}`} />
                      </button>
                    </div>

                    {/* Header Row: Subject, Topic & Time */}
                    <div className="flex flex-col gap-3 pb-3 border-b border-slate-800/80 pr-16 sm:pr-20">
                      <div className="space-y-1.5 w-full">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${subjectTheme.badgeClass}`}>
                            {plan.subject}
                          </span>
                          {plan.taskType && (
                            <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                              {plan.taskType}
                            </span>
                          )}
                        </div>
                        <h3 className={`text-base font-extrabold text-white ${plan.status === 'completed' ? 'line-through text-slate-400 font-medium' : ''} break-words`}>
                          {plan.topic}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800 w-full sm:w-auto self-start">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-slate-400">
                            Hedef Süre: <strong className="text-slate-200">{plan.plannedMinutes} dk</strong>
                          </span>
                        </div>
                        <span className="text-slate-700 font-bold">|</span>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-slate-400">
                            Hedef Soru: <strong className={plan.targetQuestionCount ? "text-emerald-400" : "text-slate-500"}>
                              {plan.targetQuestionCount ? `${plan.targetQuestionCount} Soru` : '-'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Status & Quick Reflection Dropdowns (Toggleable, Hidden by Default) */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setExpandedQuickControls(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                        className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-indigo-300 py-1.5 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 transition-all cursor-pointer"
                      >
                        <span className="flex items-center font-bold text-[11px] sm:text-xs text-slate-300">
                          <span>Hızlı Durum & Yorum Seçenekleri</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
                          <span>{expandedQuickControls[plan.id] ? 'Gizle' : 'Göster'}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedQuickControls[plan.id] ? 'rotate-180 text-indigo-400' : ''}`} />
                        </span>
                      </button>

                      <AnimatePresence>
                        {expandedQuickControls[plan.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-800/80">
                              {/* Hızlı Durum Açılır Menü */}
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-400 shrink-0">Hızlı Durum:</span>
                                <select
                                  value={plan.status}
                                  onChange={(e) => {
                                    const newStatus = e.target.value as 'pending' | 'in_progress' | 'completed';
                                    if (newStatus === 'completed' && plan.status !== 'completed') {
                                      const updatedPlan: StudyPlanItem = {
                                        ...plan,
                                        status: 'completed',
                                        completedMinutes: plan.completedMinutes || plan.plannedMinutes || 60,
                                        reflection: plan.reflection || 'Çalıştım'
                                      };
                                      onUpdatePlan(updatedPlan);
                                      processQuestionLogOnComplete(updatedPlan);
                                    } else if (plan.status === 'completed' && newStatus !== 'completed') {
                                      const linked = getLinkedQuestionLogs(plan.id, plan.topic, plan.subject);
                                      if (linked.length > 0) {
                                        setUncompleteConfirm({
                                          plan,
                                          targetStatus: newStatus,
                                          linkedLogs: linked
                                        });
                                      } else {
                                        removeLinkedQuestionLog(plan.id, plan.topic, plan.subject);
                                        onUpdatePlan({
                                          ...plan,
                                          status: newStatus,
                                          completedMinutes: newStatus === 'pending' ? 0 : plan.completedMinutes
                                        });
                                      }
                                    } else {
                                      onUpdatePlan({
                                        ...plan,
                                        status: newStatus,
                                        completedMinutes: newStatus === 'pending' ? 0 : plan.completedMinutes
                                      });
                                    }
                                  }}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none transition-all cursor-pointer ${
                                    plan.status === 'completed'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : plan.status === 'in_progress'
                                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  <option value="pending" className="bg-slate-900 text-amber-300">⏳ Bekliyor</option>
                                  <option value="in_progress" className="bg-slate-900 text-sky-300">⚡ Devam Ediyor</option>
                                  <option value="completed" className="bg-slate-900 text-emerald-300">✅ Tamamladı</option>
                                </select>
                              </div>

                              {/* Hızlı Yorum Açılır Menü */}
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center space-x-1">
                                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                                  <span>Hızlı Yorum:</span>
                                </span>
                                <select
                                  value={plan.reflection || ''}
                                  onChange={(e) => {
                                    onUpdatePlan({
                                      ...plan,
                                      reflection: e.target.value || undefined
                                    });
                                  }}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none transition-all cursor-pointer ${
                                    plan.reflection
                                      ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/40'
                                      : 'bg-slate-900 text-slate-400 border-slate-800'
                                  }`}
                                >
                                  <option value="" className="bg-slate-900 text-slate-400">-- Yorum Yok --</option>
                            {QUICK_REFLECTIONS.map((chip) => (
                              <option key={chip.label} value={chip.label} className="bg-slate-900 text-white">
                                {chip.icon} {chip.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

                    {/* Notes / Custom Comment Display & Inline Editing */}
                    <div className="pt-2 border-t border-slate-800/40">
                      {inlineEditingNotesPlanId === plan.id ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-indigo-500/30">
                          <input
                            type="text"
                            value={inlineNotesText}
                            onChange={(e) => setInlineNotesText(e.target.value)}
                            placeholder="Not veya detaylı yorumunuzu yazın..."
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onUpdatePlan({
                                  ...plan,
                                  notes: inlineNotesText.trim() || undefined
                                });
                                setInlineEditingNotesPlanId(null);
                              } else if (e.key === 'Escape') {
                                setInlineEditingNotesPlanId(null);
                              }
                            }}
                          />
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <button
                              onClick={() => {
                                onUpdatePlan({
                                  ...plan,
                                  notes: inlineNotesText.trim() || undefined
                                });
                                setInlineEditingNotesPlanId(null);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Kaydet</span>
                            </button>
                            <button
                              onClick={() => setInlineEditingNotesPlanId(null)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : plan.notes ? (
                        <div className="flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                          <div className="flex items-center space-x-2">
                            <span className="text-indigo-400 font-bold">Not:</span>
                            <span className="italic">{plan.notes}</span>
                          </div>
                          <button
                            onClick={() => {
                              setInlineEditingNotesPlanId(plan.id);
                              setInlineNotesText(plan.notes || '');
                            }}
                            className="text-slate-400 hover:text-indigo-300 opacity-60 hover:opacity-100 transition-opacity ml-2 cursor-pointer p-1 rounded hover:bg-slate-800"
                            title="Notu Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setInlineEditingNotesPlanId(plan.id);
                            setInlineNotesText('');
                          }}
                          className="text-xs text-slate-500 hover:text-indigo-400 transition-colors flex items-center space-x-1 font-medium cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Not veya Detaylı Yorum Ekleyin...</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: WEEKLY STATS OVERVIEW */}
      {viewMode === 'stats' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
          <h2 className="text-base font-black text-white flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <span>Haftalık Çalışma Performansı & Ders Dağılımı</span>
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Gün</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Planlanan Dersler & Konular</th>
                  <th className="py-3.5 px-4 text-center">Hedef Süre</th>
                  <th className="py-3.5 px-4 text-center">Gerçekleşen Süre</th>
                  <th className="py-3.5 px-4 text-center">İlerleme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {DAYS.map((day) => {
                  const dayPlans = activePlans.filter((p) => p.day === day);
                  const dayPlannedMins = dayPlans.reduce((sum, p) => sum + (p.plannedMinutes || 0), 0);
                  const dayCompletedMins = dayPlans.reduce((sum, p) => sum + (p.completedMinutes || 0), 0);
                  const dayPercent = dayPlannedMins > 0 ? Math.round((dayCompletedMins / dayPlannedMins) * 100) : 0;

                  return (
                    <tr key={day} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-white">
                        {day}
                      </td>
                      <td className="py-4 px-4">
                        {dayPlans.length === 0 ? (
                          <span className="text-slate-600 italic">Ders planlanmadı</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {dayPlans.map((plan) => (
                              <span
                                key={plan.id}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                  plan.status === 'completed'
                                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-200'
                                }`}
                              >
                                {plan.subject}: {plan.topic} ({plan.plannedMinutes}m)
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold">
                        {dayPlannedMins} dk
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-emerald-400">
                        {dayCompletedMins} dk
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-indigo-300">
                        %{dayPercent}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

        </div>
      )}

      {/* VIEW 4: PLAN ARCHIVE & PAST STATISTICS VIEW */}
      {activeSubTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* HISTORY ANALYTICS INSIGHTS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Kayıtlı Geçmiş Hafta</div>
                <div className="text-lg font-black text-white font-mono">{orderedWeeks.length} Hafta</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Ortalama Uyum Oranı</div>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {orderedWeeks.length > 0 
                    ? Math.round(getWeeklyStats().reduce((sum, w) => sum + (w['Görev Uyumu (%)'] || 0), 0) / orderedWeeks.length)
                    : 0}%
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Toplam Çalışma Süresi</div>
                <div className="text-lg font-black text-white font-mono">
                  {getWeeklyStats().reduce((sum, w) => sum + (w['Çalışma Süresi (Saat)'] || 0), 0).toFixed(1)} Saat
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">En Çok Çalışılan Ders</div>
                <div className="text-sm font-black text-amber-300 truncate max-w-[150px]">
                  {(() => {
                    const subStats = getSubjectDistributionStats();
                    if (subStats.length === 0) return 'Veri Yok';
                    const maxSub = subStats.reduce((max, s) => s['Tamamlanan (Saat)'] > max['Tamamlanan (Saat)'] ? s : max, subStats[0]);
                    return maxSub ? `${maxSub.name} (${maxSub['Tamamlanan (Saat)']} sa)` : 'Veri Yok';
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* CHARTS SECTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AREA CHART - WEEKLY COMPLIANCE & STUDY HOURS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Haftalık Çalışma Performans Grafiği</span>
                </h3>
              </div>
              <div className="h-64 w-full">
                {orderedWeeks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 italic">
                    Grafik oluşturmak için henüz geçmiş arşiv bulunmuyor.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...getWeeklyStats()].reverse()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area type="monotone" name="Görev Uyumu (%)" dataKey="Görev Uyumu (%)" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCompliance)" />
                      <Area type="monotone" name="Çalışma Süresi (Saat)" dataKey="Çalışma Süresi (Saat)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* BAR CHART - SUBJECT DISTRIBUTION */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Ders Bazlı Çalışma Dağılımı</span>
                </h3>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Scope Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setSubjectChartScope('total')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartScope === 'total'
                          ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Toplam Saat
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectChartScope('selected')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartScope === 'selected'
                          ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Seçili Hafta
                    </button>
                  </div>

                  {/* Metric Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setSubjectChartMetric('duration')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartMetric === 'duration'
                          ? 'bg-indigo-600/90 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Süre (Saat)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectChartMetric('question')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartMetric === 'question'
                          ? 'bg-indigo-600/90 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Soru (Adet)
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                {orderedWeeks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 italic">
                    Ders bazlı istatistik oluşturmak için henüz geçmiş arşiv bulunmuyor.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSubjectDistributionStats()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {subjectChartMetric === 'duration' ? (
                        <Bar name="Tamamlanan (Saat)" dataKey="Tamamlanan (Saat)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      ) : (
                        <Bar name="Tamamlanan (Soru)" dataKey="Tamamlanan (Soru)" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* DETAILED LOGS GRID (Left Sidebar: Weeks Selector, Right Content: Day List) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Weeks Selector Cards */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 pl-1 flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Geçmiş Haftalar</span>
              </div>
              {orderedWeeks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs bg-slate-900/10">
                  Arşivlenmiş hafta bulunmamaktadır. Sağ üstteki "Haftayı Arşive Kaldır" butonu ile mevcut haftanızı buraya ekleyebilirsiniz.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {(() => {
                      const ITEMS_PER_PAGE = 5;
                      const totalHistoryPages = Math.ceil(orderedWeeks.length / ITEMS_PER_PAGE);
                      const startIndex = (historyWeeksPage - 1) * ITEMS_PER_PAGE;
                      const paginatedWeeks = orderedWeeks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                      return paginatedWeeks.map((weekLabel) => {
                        const weekPlans = getPlansForWeek(weekLabel);
                        const total = weekPlans.length;
                        const completed = weekPlans.filter(p => p.status === 'completed').length;
                        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                        const isSelected = activeHistoryWeek === weekLabel;

                        return (
                          <button
                            key={weekLabel}
                            onClick={() => setSelectedHistoryWeek(weekLabel)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-br from-indigo-950/75 to-slate-900 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white">{weekLabel}</span>
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                                {percent}% Başarı
                              </span>
                            </div>
                            
                            <div className="text-[10px] text-slate-400 font-semibold mt-1">
                              {completed} / {total} Ders Görevi Tamamlandı
                            </div>

                            <div className="w-full h-1.5 bg-slate-950 rounded-full mt-3 overflow-hidden border border-white/5">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  percent >= 85 
                                    ? 'bg-emerald-500' 
                                    : percent >= 60 
                                    ? 'bg-indigo-500' 
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Pagination Controls */}
                  {(() => {
                    const ITEMS_PER_PAGE = 5;
                    const totalHistoryPages = Math.ceil(orderedWeeks.length / ITEMS_PER_PAGE);
                    if (totalHistoryPages <= 1) return null;

                    return (
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setHistoryWeeksPage(p => Math.max(1, p - 1))}
                          disabled={historyWeeksPage === 1}
                          className="px-3 py-2 rounded-xl border border-slate-850 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                        >
                          &larr; Önceki
                        </button>
                        <span className="text-slate-400 font-mono font-bold">
                          {historyWeeksPage} / {totalHistoryPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setHistoryWeeksPage(p => Math.min(totalHistoryPages, p + 1))}
                          disabled={historyWeeksPage === totalHistoryPages}
                          className="px-3 py-2 rounded-xl border border-slate-850 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                        >
                          Sonraki &rarr;
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Right Column: Detailed Day List of study plans in the selected archived week */}
            <div className="lg:col-span-8 space-y-4">
              {orderedWeeks.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center text-slate-500 text-xs">
                  Ayrıntılı raporu görüntülemek için lütfen sol taraftan bir hafta seçin veya yeni bir hafta arşivleyin.
                </div>
              ) : (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center space-x-2.5">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <span>{activeHistoryWeek} Detaylı Raporu</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Bu hafta uyguladığınız ders programı ve detaylı ders performansı.
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>
                        Uyum Oranı: {(() => {
                          const plans = getPlansForWeek(activeHistoryWeek);
                          const tot = plans.length;
                          const cmp = plans.filter(p => p.status === 'completed').length;
                          return tot > 0 ? Math.round((cmp / tot) * 100) : 0;
                        })()}%
                      </span>
                    </div>
                  </div>

                  {/* AI COACH FEEDBACK BASED ON COMPLIANCE */}
                  {(() => {
                    const plans = getPlansForWeek(activeHistoryWeek);
                    const tot = plans.length;
                    const cmp = plans.filter(p => p.status === 'completed').length;
                    const percent = tot > 0 ? Math.round((cmp / tot) * 100) : 0;

                    let title = 'Yeterli Veri Yok';
                    let feedback = 'Haftalık uyumunuzu görmek için lütfen arşivleri oluşturun.';
                    let colorClass = 'bg-slate-950 border-slate-800 text-slate-300';
                    let icon = 'ℹ️';

                    if (tot > 0) {
                      if (percent >= 85) {
                        title = 'Kusursuz Performans!';
                        feedback = 'Harika bir hafta geçirdin! Programına neredeyse kusursuz uydun. Bu tempo ve disiplin seni doğrudan YKS hedefindeki üniversiteye ulaştıracak! Kendinle gurur duy ve asla gevşeme. 🌟';
                        colorClass = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
                        icon = '🌟';
                      } else if (percent >= 60) {
                        title = 'Güzel Çaba, Potansiyel Yüksek!';
                        feedback = 'Güzel bir çaba! Bazı hedefler ertelenmiş olsa da genel uyumun gayet iyi. Bir sonraki hafta eksik kaldığın konulara biraz daha ağırlık vererek fark yaratabilirsin. İstikrar en büyük anahtardır! 👍';
                        colorClass = 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300';
                        icon = '👍';
                      } else {
                        title = 'Taktiksel Değişim Zamanı';
                        feedback = 'Bu hafta planına sadık kalmakta biraz zorlanmışsın. Hiç sorun değil! Kendini hırpalamadan, planındaki ders sürelerini biraz düşürerek daha sürdürülebilir bir tempo bulmaya çalış. Ders programını hafifletmek verimini artırabilir. 🎯';
                        colorClass = 'bg-amber-950/40 border-amber-500/30 text-amber-300';
                        icon = '🎯';
                      }
                    }

                    return (
                      <div className={`p-4 rounded-2xl border flex items-start space-x-3.5 ${colorClass}`}>
                        <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                        <div className="space-y-1">
                          <div className="text-xs font-black uppercase tracking-wider">{title}</div>
                          <p className="text-xs font-medium leading-relaxed opacity-90">{feedback}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TASK ITEMS LIST FOR SELECTED WEEK */}
                  <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
                    {DAYS.map((day) => {
                      const plans = getPlansForWeek(activeHistoryWeek).filter(p => p.day === day);
                      if (plans.length === 0) return null;

                      return (
                        <div key={day} className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-sm transition-all hover:border-slate-800">
                          {/* Distinct Day Badge Header */}
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0" />
                              <span className="text-xs font-black text-indigo-300 tracking-wider uppercase font-mono">{day} Günü</span>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full font-bold">
                              {plans.length} Ders Görevi
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {plans.map((p) => {
                              const isTYT = p.subject.toUpperCase().includes('TYT') || p.topic.toUpperCase().includes('TYT');
                              const isAYT = p.subject.toUpperCase().includes('AYT') || p.topic.toUpperCase().includes('AYT');
                              return (
                                <div
                                  key={p.id}
                                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all hover:bg-slate-900/30 ${
                                    p.status === 'completed'
                                      ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-300'
                                      : 'bg-slate-900/10 border-slate-800/80'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 space-y-1">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 truncate max-w-[150px]">
                                          {p.subject}
                                        </span>
                                        {/* Task Type Badge */}
                                        {p.taskType && (
                                          <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                                            {p.taskType}
                                          </span>
                                        )}
                                        {/* TYT / AYT Badges */}
                                        {isTYT && (
                                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full font-mono">
                                            TYT
                                          </span>
                                        )}
                                        {isAYT && (
                                          <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full font-mono">
                                            AYT
                                          </span>
                                        )}
                                      </div>
                                      <h4 className={`text-xs font-bold text-slate-100 line-clamp-2 ${p.status === 'completed' ? 'text-slate-400 font-medium' : ''}`}>
                                        {p.topic}
                                      </h4>
                                    </div>

                                    {/* Completion status badge */}
                                    <div className="shrink-0">
                                      {p.status === 'completed' ? (
                                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-black font-mono">
                                          ✓ TAMAM
                                        </span>
                                      ) : (
                                        <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full text-[9px] font-black font-mono inline-flex items-center gap-1">
                                          <span className="text-rose-500 font-black">✗</span> EKSİK
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Stats details row */}
                                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-400 font-semibold border-t border-slate-800/40 pt-1.5">
                                    <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                      ⏱️ {p.completedMinutes} dk
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800/40">
                                      🎯 Hedef: {p.plannedMinutes} dk
                                    </span>
                                    {p.targetQuestionCount && p.targetQuestionCount > 0 && (
                                      <span className="flex items-center gap-1 text-purple-300 bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-md">
                                        📝 {p.targetQuestionCount} Soru
                                      </span>
                                    )}
                                    {p.reflection && (
                                      <span className="text-[9px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 max-w-[120px] truncate" title={p.reflection}>
                                        💬 {p.reflection}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    
                    {getPlansForWeek(activeHistoryWeek).length === 0 && (
                      <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                        Bu hafta için ders görevi bulunmuyor.
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* MODAL 1: ADD NEW TASK */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-slate-900 backdrop-blur-2xl border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Yeni Çalışma Görevi Ekle</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Gün Seçimi</label>
                  <select
                    value={targetDayForAdd}
                    onChange={(e) => setTargetDayForAdd(e.target.value as DayOfWeek)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold text-indigo-300"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Ders Seçimi</label>
                  <select
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setTopic('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-medium"
                  >
                    <option value="">Lütfen ders seçimi yapınız</option>
                    <optgroup label="TYT Dersleri">
                      {YKS_SUBJECTS.TYT.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                    <optgroup label="AYT Dersleri">
                      {YKS_SUBJECTS.AYT.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {!subject && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 font-medium">
                  💡 Devam etmek için lütfen yukarıdan bir ders seçiniz.
                </div>
              )}

              {subject && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Konu Seçimi
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 font-medium text-indigo-300"
                    >
                      <option value="">-- Konu Seçiniz --</option>
                      <option value="Genel">Genel</option>
                      <option value="Diğer">Diğer</option>
                      {(YKS_CURRICULUM_TOPICS[subject] || []).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Görev Tanımı (Görev Tipi)</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        className={`${
                          taskType === 'Diğer' ? 'flex-1' : 'w-full'
                        } bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold text-amber-300 transition-all duration-200`}
                      >
                        {actualTaskTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {taskType === 'Diğer' && (
                        <button
                          type="button"
                          onClick={() => setShowTaskTypeModal(true)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm shadow-indigo-600/20"
                        >
                          Özelleştir
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Hedeflenen Süre (Dakika)</label>
                      <input
                        type="number"
                        min="15"
                        step="15"
                        value={plannedMinutes}
                        onChange={(e) => setPlannedMinutes(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Hedef Soru Sayısı (Opsiyonel)</label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        placeholder="Ör: 40"
                        value={targetQuestionCount}
                        onChange={(e) => setTargetQuestionCount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Notlar / Açıklamalar (Opsiyonel)</label>
                    <textarea
                      rows={2}
                      placeholder="Kaynak veya detay..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!subject || !topic.trim()}
                  className={`text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg ${
                    subject && topic.trim()
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Kaydet ve Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TASK MODAL */}
      {editingPlan && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingPlan(null); }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <span>Görevi Düzenle</span>
              </h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Gün</label>
                  <select
                    value={editingPlan.day}
                    onChange={(e) => setEditingPlan({ ...editingPlan, day: e.target.value as DayOfWeek })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Durum</label>
                  <select
                    value={editingPlan.status}
                    onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold text-indigo-300"
                  >
                    <option value="pending">Bekliyor</option>
                    <option value="in_progress">Devam Ediyor</option>
                    <option value="completed">Tamamlandı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ders</label>
                <select
                  value={editingPlan.subject}
                  onChange={(e) => setEditingPlan({ ...editingPlan, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <optgroup label="TYT Dersleri">
                    {YKS_SUBJECTS.TYT.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="AYT Dersleri">
                    {YKS_SUBJECTS.AYT.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Konu Seçimi (Otomatik Liste)
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) setEditingPlan({ ...editingPlan, topic: e.target.value });
                  }}
                  value={(YKS_CURRICULUM_TOPICS[editingPlan.subject] || []).includes(editingPlan.topic) ? editingPlan.topic : ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 font-medium text-indigo-300 mb-2"
                >
                  <option value="">-- {editingPlan.subject} Konusu Seçin --</option>
                  {(YKS_CURRICULUM_TOPICS[editingPlan.subject] || []).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <label className="block text-xs font-bold text-slate-300 mb-1">Konu / Özel Başlık</label>
                <input
                  type="text"
                  required
                  value={editingPlan.topic}
                  onChange={(e) => setEditingPlan({ ...editingPlan, topic: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Görev Tanımı (Görev Tipi)</label>
                <div className="flex items-center gap-2">
                  <select
                    value={editingPlan.taskType || actualTaskTypes[0]}
                    onChange={(e) => setEditingPlan({ ...editingPlan, taskType: e.target.value })}
                    className={`${
                      (editingPlan.taskType || actualTaskTypes[0]) === 'Diğer' ? 'flex-1' : 'w-full'
                    } bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold text-amber-300 transition-all duration-200`}
                  >
                    {(() => {
                      const options = [...actualTaskTypes];
                      const currentType = editingPlan.taskType;
                      if (currentType && !options.includes(currentType)) {
                        const dicerIdx = options.indexOf('Diğer');
                        if (dicerIdx !== -1) {
                          options.splice(dicerIdx, 0, currentType);
                        } else {
                          options.push(currentType);
                        }
                      }
                      return options.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ));
                    })()}
                  </select>
                  {(editingPlan.taskType || actualTaskTypes[0]) === 'Diğer' && (
                    <button
                      type="button"
                      onClick={() => setShowTaskTypeModal(true)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm shadow-indigo-600/20"
                    >
                      Özelleştir
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Hedef Süre (Dk)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={editingPlan.plannedMinutes}
                    onChange={(e) => setEditingPlan({ ...editingPlan, plannedMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Hedef Soru</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="Ör: 40"
                    value={editingPlan.targetQuestionCount || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, targetQuestionCount: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Gerçekleşen (Dk)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={editingPlan.completedMinutes}
                    onChange={(e) => setEditingPlan({ ...editingPlan, completedMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-emerald-400 font-bold focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notlar / Açıklamalar</label>
                <textarea
                  rows={2}
                  value={editingPlan.notes || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, notes: e.target.value })}
                  placeholder="Örn: 40 soru çözüldü, yanlış yapılan 3 soru öğretmenle incelenecek"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Hızlı Değerlendirme Yorumu</span>
                </label>
                <select
                  value={editingPlan.reflection || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, reflection: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                >
                  <option value="" className="bg-slate-900 text-slate-400">-- Değerlendirme Yorumu Seçin --</option>
                  {QUICK_REFLECTIONS.map((chip) => (
                    <option key={chip.label} value={chip.label} className="bg-slate-900 text-white">
                      {chip.icon} {chip.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const planToDelete = editingPlan;
                    setEditingPlan(null);
                    setDeletingPlan({ id: planToDelete.id, title: `${planToDelete.day} - ${planToDelete.subject}: ${planToDelete.topic}` });
                  }}
                  className="px-3 py-2 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-rose-500/30 font-bold transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sil</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg"
                  >
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: COMPLETION MINUTES INPUT MODAL */}
      {completingPlan && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setCompletingPlan(null); }}
        >
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Görevi Tamamla</span>
              </h3>
              <button onClick={() => setCompletingPlan(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                {completingPlan.subject}
              </span>
              <div className="text-sm font-bold text-white mt-1">
                {completingPlan.topic}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                Hedef Süre: <strong>{completingPlan.plannedMinutes} Dakika</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmCompletion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Bu görevi kaç dakikada tamamladınız?
                </label>
                
                {/* Duration Presets */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[30, 45, 60, 90].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCompletionMinutesInput(preset)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        completionMinutesInput === preset
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {preset} dk
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={completionMinutesInput}
                    onChange={(e) => setCompletionMinutesInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-2xl px-4 py-3 text-lg font-bold text-emerald-400 focus:outline-none font-mono text-center"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">Dakika</span>
                </div>
              </div>

              {/* ACCORDION 1: HIZLI DURUM (GİZLİ / COLLAPSED BY DEFAULT) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowModalQuickStatus(!showModalQuickStatus)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                >
                  <span className="flex items-center space-x-2 min-w-0">
                    <ListFilter className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate">Hızlı Durum Seçeneği</span>
                    <span className="text-[10px] text-slate-400 font-normal shrink-0">
                      ({completionStatusInput === 'completed' ? '✅ Tamam' : completionStatusInput === 'in_progress' ? '⚡ Devam' : '⏳ Bekliyor'})
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${showModalQuickStatus ? 'rotate-180 text-sky-400' : ''}`} />
                </button>

                <AnimatePresence>
                  {showModalQuickStatus && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 mt-1.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-400">Görevin Durumu:</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setCompletionStatusInput('pending')}
                            className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              completionStatusInput === 'pending'
                                ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            ⏳ Bekliyor
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompletionStatusInput('in_progress')}
                            className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              completionStatusInput === 'in_progress'
                                ? 'bg-sky-500/30 border-sky-400 text-sky-200 shadow-md shadow-sky-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            ⚡ Devam
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompletionStatusInput('completed')}
                            className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              completionStatusInput === 'completed'
                                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            ✅ Tamam
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ACCORDION 2: HIZLI YORUM / DEĞERLENDİRME (GİZLİ / COLLAPSED BY DEFAULT) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowModalQuickReflection(!showModalQuickReflection)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                >
                  <span className="flex items-center space-x-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0" />
                    <span className="truncate">Hızlı Yorum / Değerlendirme</span>
                    {completionReflectionInput && (
                      <span className="text-[10px] text-fuchsia-300 font-normal truncate max-w-[80px]">
                        ({completionReflectionInput})
                      </span>
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${showModalQuickReflection ? 'rotate-180 text-fuchsia-400' : ''}`} />
                </button>

                <AnimatePresence>
                  {showModalQuickReflection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 mt-1.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                        <label className="block text-[11px] font-semibold text-slate-400">Yorum / Değerlendirme Seçin:</label>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_REFLECTIONS.map((chip) => {
                            const isSelected = completionReflectionInput === chip.label;
                            return (
                              <button
                                key={chip.label}
                                type="button"
                                onClick={() => setCompletionReflectionInput(isSelected ? undefined : chip.label)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1 cursor-pointer ${
                                  isSelected ? chip.activeColor : chip.color
                                }`}
                              >
                                <span>{chip.icon}</span>
                                <span>{chip.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletingPlan(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30"
                >
                  Tamamlandı Olarak İşaretle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-Step Confirmation Modal for Study Plan Deletion */}
      <ConfirmDeleteModal
        isOpen={!!deletingPlan}
        title="Ders Planı Görevini Sil"
        itemName={deletingPlan?.title}
        onConfirm={() => {
          if (deletingPlan) {
            const planToDelete = studyPlans.find(p => p.id === deletingPlan.id);
            removeLinkedQuestionLog(deletingPlan.id, planToDelete?.topic, planToDelete?.subject);
            onDeletePlan(deletingPlan.id);
            setDeletingPlan(null);
          }
        }}
        onClose={() => setDeletingPlan(null)}
      />

      {/* MODAL 4: QUESTION TRACKER PROMPT MODAL (For ALL completed tasks) */}
      {questionPromptPlan && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setQuestionPromptPlan(null); }}
        >
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Soru Takibine Eklensin mi?</span>
              </h3>
              <button 
                onClick={() => {
                  setQuestionPromptPlan(null);
                  setQuestionPromptSolvedCount('');
                  setQuestionPromptCorrectCount('');
                  setQuestionPromptWrongCount('');
                  setQuestionPromptNotes('');
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  {questionPromptPlan.subject}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Görevi Tamamlandı
                </span>
              </div>
              <div className="text-sm font-bold text-white">
                {questionPromptPlan.topic}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                {questionPromptPlan.targetQuestionCount && questionPromptPlan.targetQuestionCount > 0 ? (
                  <>Bu çalışma için hedef soru sayısı <strong>{questionPromptPlan.targetQuestionCount}</strong> olarak belirlenmişti. Soru takibine eklenecek bilgileri gözden geçirip kaydedebilirsiniz.</>
                ) : (
                  <>Bu çalışmada çözdüğünüz soruları <strong>Soru Takibi</strong> sayfasına eklemek için detayları girebilirsiniz.</>
                )}
              </p>
            </div>

            <form onSubmit={handleConfirmQuestionPrompt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Çözülen Soru Sayısı *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Örn: 40"
                  value={questionPromptSolvedCount}
                  onChange={(e) => setQuestionPromptSolvedCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none font-mono"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">
                    Doğru Sayısı <span className="text-slate-500 font-normal">(Opsiyonel)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Örn: 35"
                    value={questionPromptCorrectCount}
                    onChange={(e) => setQuestionPromptCorrectCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">
                    Yanlış Sayısı <span className="text-slate-500 font-normal">(Opsiyonel)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Örn: 5"
                    value={questionPromptWrongCount}
                    onChange={(e) => setQuestionPromptWrongCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Net score live preview badge */}
              {questionPromptSolvedCount !== '' && Number(questionPromptSolvedCount) > 0 && (
                <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Hesaplanan Net:</span>
                  <span className="text-indigo-400 font-extrabold text-sm">
                    {(() => {
                      const s = Number(questionPromptSolvedCount);
                      const w = questionPromptWrongCount !== '' ? Number(questionPromptWrongCount) : 0;
                      let c = questionPromptCorrectCount !== '' ? Number(questionPromptCorrectCount) : Math.max(0, s - w);
                      if (questionPromptCorrectCount === '' && questionPromptWrongCount === '') {
                        c = s;
                      }
                      return Number((c - (w * 0.25)).toFixed(2));
                    })()} Net
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Notlar / Açıklamalar <span className="text-slate-500 font-normal">(Opsiyonel)</span>
                  </label>
                  {questionPromptNotes && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionPromptNotes('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer font-medium"
                    >
                      Metni Temizle
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  placeholder="Açıklama veya not ekleyin..."
                  value={questionPromptNotes}
                  onChange={(e) => {
                    setQuestionPromptNotes(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setQuestionPromptPlan(null);
                    setQuestionPromptSolvedCount('');
                    setQuestionPromptCorrectCount('');
                    setQuestionPromptWrongCount('');
                    setQuestionPromptNotes('');
                  }}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white font-bold transition-colors"
                >
                  Sadece Görevi Tamamla
                </button>
                <button
                  type="submit"
                  disabled={!questionPromptSolvedCount || Number(questionPromptSolvedCount) <= 0}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
                >
                  Evet, Soru Takibine Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNCOMPLETE CONFIRMATION MODAL (IF QUESTION LOG EXISTS) */}
      {uncompleteConfirm && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setUncompleteConfirm(null); }}
        >
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Soru Takibi Kaydı Silinecek</span>
              </h3>
              <button 
                onClick={() => setUncompleteConfirm(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-[11px] font-black text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded border border-indigo-500/30">
                  {uncompleteConfirm.plan.subject}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {uncompleteConfirm.plan.topic}
                </span>
              </div>

              {uncompleteConfirm.linkedLogs.map((log) => (
                <div key={log.id} className="text-xs text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between font-mono">
                  <span className="text-slate-400 font-sans">İlişkili Soru Kaydı:</span>
                  <strong className="text-amber-300 font-extrabold">{log.solvedCount} Soru ({log.netScore} Net)</strong>
                </div>
              ))}

              <p className="text-xs text-slate-400 leading-relaxed">
                Bu görevin tamamlandı durumunu değiştirdiğinizde, Soru Takibinde kayıtlı olan yukarıdaki soru bilgisi de otomatik olarak silinecektir.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUncompleteConfirm(null)}
                className="px-4 py-2.5 text-xs text-slate-400 hover:text-white font-bold transition-colors rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmUncompleteWithLogDeletion}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-600/30 cursor-pointer"
              >
                Evet, Sil ve Durumu Değiştir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ARCHIVE & RESET STUDY PLAN CONFIRMATION (With rollover templates & date selector & double confirmation) */}
      {showArchiveConfirm && (
        (() => {
          const targetWeekLabel = getWeekLabel(getOffsetDate(archiveWeekOffset));
          const existingArchivedCount = studyPlans.filter(p => p.archived && p.weekLabel === targetWeekLabel).length;
          const isAlreadyArchived = existingArchivedCount > 0 || CHRONOLOGICAL_SEEDS.includes(targetWeekLabel);

          const handleInitiateChoice = (choice: 'keep_template' | 'fresh_start') => {
            setArchiveChoice(choice);
            if (isAlreadyArchived) {
              setOverwriteStep(1); // Trigger 1st confirmation step
            } else {
              executeArchiveAndReset(choice, targetWeekLabel);
            }
          };

          return (
            <div 
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={(e) => { 
                if (e.target === e.currentTarget) {
                  setShowArchiveConfirm(false);
                  setOverwriteStep(0);
                  setArchiveChoice(null);
                } 
              }}
            >
              <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white flex items-center space-x-2">
                    <History className="w-5 h-5 text-purple-400 shrink-0" />
                    <span>Haftayı Arşive Kaldır & Sıfırla</span>
                  </h3>
                  <button 
                    onClick={() => {
                      setShowArchiveConfirm(false);
                      setOverwriteStep(0);
                      setArchiveChoice(null);
                    }} 
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* OVERWRITE CONFIRMATION STEP 1 */}
                {overwriteStep === 1 && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                        <span>Üzerine Yazma Onayı (1 / 2)</span>
                      </div>
                      <p className="text-amber-200/90 leading-relaxed font-medium pt-1">
                        Seçtiğiniz <strong className="text-white underline">{targetWeekLabel}</strong> haftasına ait sistemde daha önce kaydedilmiş bir arşiv verisi bulunmaktadır.
                      </p>
                      <p className="text-amber-300 font-semibold pt-1">
                        Eski arşiv verisini silip, yerine bu haftanın çalışma planını kaydetmek istediğinizden emin misiniz?
                      </p>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setOverwriteStep(0);
                          setArchiveChoice(null);
                        }}
                        className="px-4 py-2.5 text-slate-400 hover:text-white font-bold transition-colors rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverwriteStep(2)}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all rounded-xl shadow-lg shadow-amber-600/30 cursor-pointer"
                      >
                        Evet, Devam Et (2. Adım)
                      </button>
                    </div>
                  </div>
                )}

                {/* OVERWRITE CONFIRMATION STEP 2 (FINAL DOUBLE CONFIRMATION) */}
                {overwriteStep === 2 && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 bg-rose-950/50 border border-rose-500/60 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-rose-400 font-extrabold text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                        <span>⚠️ SON ONAY (2 / 2) - Kalıcı İşlem</span>
                      </div>
                      <p className="text-rose-200/95 leading-relaxed font-medium pt-1">
                        <strong>DİKKAT:</strong> <strong className="text-white underline">{targetWeekLabel}</strong> haftasının eski arşiv verileri <strong>KALICI OLARAK SİLİNECEK</strong> ve geri getirilemeyecektir.
                      </p>
                      <p className="text-rose-300 font-bold pt-1">
                        Bu işlemi onaylayıp eski arşivi silerek yeni planı kaydetmek istiyor musunuz?
                      </p>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setOverwriteStep(0);
                          setArchiveChoice(null);
                        }}
                        className="px-4 py-2.5 text-slate-400 hover:text-white font-bold transition-colors rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (archiveChoice) {
                            executeArchiveAndReset(archiveChoice, targetWeekLabel);
                          }
                        }}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer"
                      >
                        Kalıcı Olarak Sil ve Üzerine Yaz
                      </button>
                    </div>
                  </div>
                )}

                {/* MAIN ARCHIVE FORM (When overwriteStep === 0) */}
                {overwriteStep === 0 && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-purple-950/20 border border-purple-500/20 rounded-2xl space-y-1 text-xs text-purple-300 leading-relaxed font-semibold">
                      <p>ℹ️ Mevcut çalışma alanınızdaki görevler belirtilen haftanın arşivine aktarılacaktır.</p>
                    </div>

                    {/* SECTION: TARİH BİLGİSİ (WEEK SELECTOR) */}
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span className="flex items-center space-x-1.5 text-purple-400">
                          <CalendarDays className="w-4 h-4" />
                          <span>Tarih Bilgisi (Arşivlenecek Hafta)</span>
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/50 font-bold">
                          {getOffsetBadgeText(archiveWeekOffset)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900 border border-slate-750 p-2 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setArchiveWeekOffset(prev => prev - 1)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold shrink-0"
                          title="Eski Haftalara Geçiş Yap"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Önceki Hafta</span>
                        </button>

                        <div className="text-center px-3 py-1">
                          <div className="text-sm font-black text-white tracking-wide">
                            {targetWeekLabel}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Seçilen Arşiv Haftası
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setArchiveWeekOffset(prev => prev + 1)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold shrink-0"
                          title="Sonraki Haftaya Geç"
                        >
                          <span className="hidden sm:inline">Sonraki Hafta</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* ALREADY ARCHIVED WARNING BADGE */}
                    {isAlreadyArchived && (
                      <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-start space-x-3 text-amber-200 text-xs animate-in fade-in duration-200">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-amber-300">
                            Seçtiğiniz haftada daha önce girilmiş veri var!
                          </div>
                          <div className="text-[11px] text-amber-200/90 leading-relaxed">
                            "{targetWeekLabel}" haftasına ait mevcut bir arşiv bulunuyor. Devam ederseniz eskisini silip üzerine yazmak için onay istenecektir.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 pt-1">
                      YENİ HAFTA BAŞLANGIÇ TERCİHİNİZ:
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Option A: Keep Template */}
                      <button
                        type="button"
                        onClick={() => handleInitiateChoice('keep_template')}
                        className="p-4 bg-slate-950 hover:bg-slate-800/85 border border-indigo-500/30 hover:border-indigo-500/50 rounded-2xl text-left transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2.5 group-hover:scale-110 transition-transform">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-white">Plan Şablonunu Koru</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          Mevcut derslerinizi ve hedeflerinizi korur; süre ve durumları sıfırlayarak yeni haftaya hazırlar.
                        </p>
                      </button>

                      {/* Option B: Fresh Start */}
                      <button
                        type="button"
                        onClick={() => handleInitiateChoice('fresh_start')}
                        className="p-4 bg-slate-950 hover:bg-slate-800/85 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl text-left transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 mb-2.5 group-hover:scale-110 transition-transform">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-white">Sıfırdan Başla</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          Tüm programı tamamen temizler ve sıfırdan yeni bir haftalık çalışma planı sunar.
                        </p>
                      </button>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setShowArchiveConfirm(false);
                          setOverwriteStep(0);
                          setArchiveChoice(null);
                        }}
                        className="px-4 py-2.5 text-slate-400 hover:text-white font-bold transition-colors rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })()
      )}

      {showTaskTypeModal && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTaskTypeModal(false); }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">Görev Tanımları</h3>
              </div>
              <button 
                onClick={() => {
                  setShowTaskTypeModal(false);
                  setEditingTaskTypeIndex(null);
                }} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed font-semibold">
              Haftalık çalışma planınızda yer alan görev tiplerini aşağıdan düzenleyebilir, yenilerini ekleyebilir veya silebilirsiniz.
            </div>

            {/* List of Custom Task Types */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {actualTaskTypes.map((type, index) => {
                const isEditing = editingTaskTypeIndex === index;
                const isDeleting = deletingTaskTypeIndex === index;
                const isSystemProtected = DEFAULT_TASK_TYPES.includes(type);

                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all gap-2 group ${
                      isDeleting 
                        ? 'bg-rose-950/20 border border-rose-800/40' 
                        : 'bg-slate-950/60 border border-slate-800 hover:border-slate-700/80'
                    }`}
                  >
                    {isDeleting ? (
                      deletingStep === 1 ? (
                        <div className="flex-1 flex items-center justify-between gap-2 animate-in fade-in duration-200">
                          <span className="text-[11px] font-bold text-rose-400">"{type}" silinsin mi?</span>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDeletingStep(2)}
                              className="px-2 py-1 bg-rose-600/90 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors shadow-sm"
                            >
                              Evet
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingTaskTypeIndex(null);
                                setDeletingStep(0);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between gap-1.5 animate-in fade-in duration-200">
                          <span className="text-[9px] font-extrabold text-amber-400 leading-tight">
                            Geçmiş görevler etkilenmez. Son onay?
                          </span>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const val = actualTaskTypes[index];
                                const updated = actualTaskTypes.filter((_, i) => i !== index);
                                if (onUpdateTaskTypes) {
                                  onUpdateTaskTypes(updated, `Özel görev tanımı silindi: ${val}`);
                                }
                                setDeletingTaskTypeIndex(null);
                                setDeletingStep(0);
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors shadow-sm"
                            >
                              Sil
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingTaskTypeIndex(null);
                                setDeletingStep(0);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      )
                    ) : isEditing ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingTaskTypeValue}
                          onChange={(e) => setEditingTaskTypeValue(e.target.value)}
                          className="flex-1 bg-slate-900 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditTaskType(index);
                            if (e.key === 'Escape') setEditingTaskTypeIndex(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleEditTaskType(index)}
                          className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                          title="Kaydet"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTaskTypeIndex(null)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="İptal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-200 pl-1">{type}</span>
                        <div className="flex items-center space-x-1 shrink-0">
                          {isSystemProtected ? (
                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 font-bold">
                              Sistem
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTaskTypeIndex(index);
                                  setEditingTaskTypeValue(type);
                                }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTaskType(index)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add New Task Type */}
            <div className="border-t border-slate-800 pt-3.5 space-y-2">
              <label className="block text-xs font-bold text-slate-300">Yeni Görev Tanımı Ekle</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="örn: Kitap Okuma"
                  value={newTaskTypeValue}
                  onChange={(e) => setNewTaskTypeValue(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTaskType();
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTaskType}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1 shadow-md shadow-indigo-600/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowTaskTypeModal(false);
                  setEditingTaskTypeIndex(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700/50"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
