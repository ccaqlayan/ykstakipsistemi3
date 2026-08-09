import React, { useState, useMemo, useEffect } from 'react';
import { 
  YKSDataState, 
  ResourceItem, 
  QuestionLog, 
  StudyPlanItem, 
  BranchExam, 
  TopicErrorItem, 
  YouTubeVideoItem,
  GeneralMockExam,
  FieldType
} from '../types';
import { YKS_CURRICULUM_TOPICS } from '../data/initialData';
import { 
  Calculator, 
  Ruler, 
  Zap, 
  FlaskConical, 
  Dna, 
  BookOpen, 
  Landmark, 
  Globe, 
  Brain, 
  Languages, 
  CheckCircle2, 
  ArrowLeft, 
  Clock, 
  Target, 
  TrendingUp, 
  Youtube, 
  Sparkles, 
  BookMarked, 
  AlertCircle, 
  BarChart2, 
  Search, 
  ArrowUpRight, 
  Check, 
  FileText, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PieChart,
  HelpCircle,
  LayoutDashboard,
  Layers,
  Filter,
  Calendar,
  Image as ImageIcon,
  Eye,
  X,
  LucideIcon
} from 'lucide-react';

function isTYTKey(keyName: string): boolean {
  const k = keyName.toUpperCase();
  return k.startsWith('TYT') || k === 'PROBLEMLER' || k === 'PARAGRAF';
}

function isAYTKey(keyName: string): boolean {
  const k = keyName.toUpperCase();
  return k.startsWith('AYT');
}

function isWithinTimeRange(dateStr: string | undefined, range: 'haftalik' | 'aylik' | 'tumu'): boolean {
  if (range === 'tumu') return true;
  if (!dateStr) return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const now = new Date();
  const nowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  const diffDays = (nowEnd - d.getTime()) / (1000 * 60 * 60 * 24);
  if (range === 'haftalik') {
    return diffDays >= -1 && diffDays <= 7.5;
  }
  if (range === 'aylik') {
    return diffDays >= -1 && diffDays <= 30.5;
  }
  return true;
}

function matchesExamScope(
  item: { subject?: string; examType?: string; topicName?: string },
  filter: 'TÜMÜ' | 'TYT' | 'AYT'
): boolean {
  if (filter === 'TÜMÜ') return true;
  if (item.examType) {
    if (filter === 'TYT' && item.examType === 'TYT') return true;
    if (filter === 'AYT' && item.examType === 'AYT') return true;
    if (item.examType === 'TYT' || item.examType === 'AYT') return false;
  }
  const str = `${item.subject || ''} ${item.topicName || ''}`.toUpperCase();
  if (filter === 'TYT') {
    return str.includes('TYT') || str.includes('PROBLEM') || str.includes('PARAGRAF') || (str.includes('TÜRKÇE') && !str.includes('EDEBİYAT'));
  }
  if (filter === 'AYT') {
    return str.includes('AYT') || str.includes('EDEBİYAT') || str.includes('YDT');
  }
  return true;
}

function getSubjectGeneralMockSummary(
  mock: GeneralMockExam, 
  category: SubjectCategory, 
  allLogs: QuestionLog[], 
  allErrors: TopicErrorItem[]
) {
  let tytNet: number | null = null;
  let aytNet: number | null = null;
  let tytLabel = 'TYT Net';
  let aytLabel = 'AYT Net';
  let subjectLabel = '';

  const catId = category.id;

  if (catId === 'matematik') {
    const hasTytDetail = mock.tyt?.details?.matematik?.net !== undefined;
    const hasAytDetail = mock.ayt?.details?.matematik?.net !== undefined;
    tytNet = hasTytDetail ? mock.tyt.details!.matematik!.net : (mock.tyt?.mat ?? 0);
    aytNet = hasAytDetail ? mock.ayt.details!.matematik!.net : (mock.ayt?.mat ?? 0);
    tytLabel = hasTytDetail ? 'TYT Mat Net (Kesin)' : 'TYT Mat Net';
    aytLabel = hasAytDetail ? 'AYT Mat Net (Kesin)' : 'AYT Mat Net';
    subjectLabel = 'Matematik Testleri (TYT & AYT)';
  } else if (catId === 'geometri') {
    const hasTytDetail = mock.tyt?.details?.geometri?.net !== undefined;
    const hasAytDetail = mock.ayt?.details?.geometri?.net !== undefined;
    tytNet = hasTytDetail ? mock.tyt.details!.geometri!.net : (mock.tyt?.mat ?? 0);
    aytNet = hasAytDetail ? mock.ayt.details!.geometri!.net : (mock.ayt?.mat ?? 0);
    tytLabel = hasTytDetail ? 'TYT Geometri Net (Kesin)' : 'TYT Mat (Geo Dahil)';
    aytLabel = hasAytDetail ? 'AYT Geometri Net (Kesin)' : 'AYT Mat (Geo Dahil)';
    subjectLabel = (hasTytDetail || hasAytDetail) ? 'Geometri (Kesin Ders Neti)' : 'Geometri (TYT & AYT Mat Dahilinde)';
  } else if (catId === 'turkce_edebiyat') {
    const hasTytDetail = mock.tyt?.details?.turkce?.net !== undefined;
    const hasAytDetail = mock.ayt?.details?.edebiyat?.net !== undefined;
    tytNet = hasTytDetail ? mock.tyt.details!.turkce!.net : (mock.tyt?.turkce ?? 0);
    aytNet = hasAytDetail ? mock.ayt.details!.edebiyat!.net : (mock.ayt?.edebiyatSos1 ?? 0);
    tytLabel = hasTytDetail ? 'TYT Türkçe Net (Kesin)' : 'TYT Türkçe Net';
    aytLabel = hasAytDetail ? 'AYT Edebiyat Net (Kesin)' : 'AYT Edebiyat Net';
    subjectLabel = 'Türkçe & AYT Edebiyat-Sos1';
  } else if (catId === 'fizik') {
    const hasTytDetail = mock.tyt?.details?.fizik?.net !== undefined;
    const hasAytDetail = mock.ayt?.details?.fizik?.net !== undefined;
    tytNet = hasTytDetail ? mock.tyt.details!.fizik!.net : (mock.tyt?.fen ?? 0);
    aytNet = hasAytDetail ? mock.ayt.details!.fizik!.net : (mock.ayt?.fen ?? 0);
    tytLabel = hasTytDetail ? 'TYT Fizik Net (Kesin)' : 'TYT Fen Testi';
    aytLabel = hasAytDetail ? 'AYT Fizik Net (Kesin)' : 'AYT Fen Testi';
    subjectLabel = (hasTytDetail || hasAytDetail) ? 'Fizik (Kesin Ders Neti)' : 'Fizik (TYT Fen & AYT Fen)';
  } else if (catId === 'kimya') {
    const hasTytDetail = mock.tyt?.details?.kimya?.net !== undefined;
    const hasAytDetail = mock.ayt?.details?.kimya?.net !== undefined;
    tytNet = hasTytDetail ? mock.tyt.details!.kimya!.net : (mock.tyt?.fen ?? 0);
    aytNet = hasAytDetail ? mock.ayt.details!.kimya!.net : (mock.ayt?.fen ?? 0);
    tytLabel = hasTytDetail ? 'TYT Kimya Net (Kesin)' : 'TYT Fen Testi';
    aytLabel = hasAytDetail ? 'AYT Kimya Net (Kesin)' : 'AYT Fen Testi';
    subjectLabel = (hasTytDetail || hasAytDetail) ? 'Kimya (Kesin Ders Neti)' : 'Kimya (TYT Fen & AYT Fen)';
  } else if (catId === 'biyoloji') {
    const hasTytDetail = mock.tyt?.details?.biyoloji?.net !== undefined;
    const hasAytDetail = mock.ayt?.details?.biyoloji?.net !== undefined;
    tytNet = hasTytDetail ? mock.tyt.details!.biyoloji!.net : (mock.tyt?.fen ?? 0);
    aytNet = hasAytDetail ? mock.ayt.details!.biyoloji!.net : (mock.ayt?.fen ?? 0);
    tytLabel = hasTytDetail ? 'TYT Biyoloji Net (Kesin)' : 'TYT Fen Testi';
    aytLabel = hasAytDetail ? 'AYT Biyoloji Net (Kesin)' : 'AYT Fen Testi';
    subjectLabel = (hasTytDetail || hasAytDetail) ? 'Biyoloji (Kesin Ders Neti)' : 'Biyoloji (TYT Fen & AYT Fen)';
  } else if (catId === 'tarih') {
    const hasTytDetail = mock.tyt?.details?.tarih?.net !== undefined;
    const hasAytDetail = mock.ayt?.details?.tarih1?.net !== undefined || mock.ayt?.details?.tarih2?.net !== undefined;
    tytNet = hasTytDetail ? mock.tyt.details!.tarih!.net : (mock.tyt?.sosyal ?? 0);
    aytNet = hasAytDetail 
      ? (mock.ayt?.details?.tarih1?.net ?? 0) + (mock.ayt?.details?.tarih2?.net ?? 0)
      : ((mock.ayt?.edebiyatSos1 || 0) + (mock.ayt?.sos2 || 0));
    tytLabel = hasTytDetail ? 'TYT Tarih Net (Kesin)' : 'TYT Sosyal Testi';
    aytLabel = hasAytDetail ? 'AYT Tarih Net (Kesin)' : 'AYT Sos1/2 Testi';
    subjectLabel = (hasTytDetail || hasAytDetail) ? 'Tarih (Kesin Ders Neti)' : 'Tarih (TYT Sosyal & AYT Sos1/2)';
  } else if (catId === 'cografya') {
    const hasTytDetail = mock.tyt?.details?.cografya?.net !== undefined;
    const hasAytDetail = mock.ayt?.details?.cografya1?.net !== undefined || mock.ayt?.details?.cografya2?.net !== undefined;
    tytNet = hasTytDetail ? mock.tyt.details!.cografya!.net : (mock.tyt?.sosyal ?? 0);
    aytNet = hasAytDetail 
      ? (mock.ayt?.details?.cografya1?.net ?? 0) + (mock.ayt?.details?.cografya2?.net ?? 0)
      : ((mock.ayt?.edebiyatSos1 || 0) + (mock.ayt?.sos2 || 0));
    tytLabel = hasTytDetail ? 'TYT Coğrafya Net (Kesin)' : 'TYT Sosyal Testi';
    aytLabel = hasAytDetail ? 'AYT Coğrafya Net (Kesin)' : 'AYT Sos1/2 Testi';
    subjectLabel = (hasTytDetail || hasAytDetail) ? 'Coğrafya (Kesin Ders Neti)' : 'Coğrafya (TYT Sosyal & AYT Sos1/2)';
  } else if (catId === 'felsefe_din') {
    const hasTytDetail = mock.tyt?.details?.felsefe?.net !== undefined || mock.tyt?.details?.din?.net !== undefined;
    const hasAytDetail = mock.ayt?.details?.felsefe2?.net !== undefined || mock.ayt?.details?.din2?.net !== undefined;
    tytNet = hasTytDetail 
      ? (mock.tyt?.details?.felsefe?.net ?? 0) + (mock.tyt?.details?.din?.net ?? 0)
      : (mock.tyt?.sosyal ?? 0);
    aytNet = hasAytDetail 
      ? (mock.ayt?.details?.felsefe2?.net ?? 0) + (mock.ayt?.details?.din2?.net ?? 0)
      : (mock.ayt?.sos2 ?? 0);
    tytLabel = hasTytDetail ? 'TYT Fel&Din Net (Kesin)' : 'TYT Sosyal Testi';
    aytLabel = hasAytDetail ? 'AYT Fel&Din Net (Kesin)' : 'AYT Sos2 Testi';
    subjectLabel = (hasTytDetail || hasAytDetail) ? 'Felsefe & Din (Kesin Ders Neti)' : 'Felsefe & Din (TYT Sosyal & AYT Sos2)';
  } else if (catId === 'yabanci_dil') {
    tytNet = mock.tyt?.totalNet ?? 0;
    tytLabel = 'TYT Net';
    aytLabel = 'YDT Net';
    subjectLabel = 'YDT / Yabancı Dil';
  } else {
    tytNet = mock.tyt?.totalNet ?? 0;
    aytNet = mock.ayt?.totalNet ?? 0;
    tytLabel = `TYT ${category.title} Net`;
    aytLabel = `AYT ${category.title} Net`;
    subjectLabel = category.title;
  }

  const matchingLogs = allLogs.filter(l => {
    const sameDate = l.date === mock.date;
    const noteMatch = Boolean(
      (l.notes && mock.title && l.notes.toLowerCase().includes(mock.title.toLowerCase())) ||
      (l.notes && mock.id && l.notes.toLowerCase().includes(mock.id.toLowerCase()))
    );
    return matchesSubjectCategory(l.subject, category) && (sameDate || noteMatch);
  });

  const matchingErrors = allErrors.filter(e => {
    if (e.examId) {
      if (e.examTypeRef === 'general') {
        return e.examId === mock.id && matchesSubjectCategory(e.subject, category);
      } else {
        return false;
      }
    }
    const sameDate = e.date === mock.date;
    const noteMatch = Boolean(
      (e.publisher && mock.title && e.publisher.toLowerCase().includes(mock.title.toLowerCase())) ||
      (e.solutionNotes && mock.title && e.solutionNotes.toLowerCase().includes(mock.title.toLowerCase()))
    );
    return matchesSubjectCategory(e.subject, category) && (sameDate || noteMatch);
  });

  const totalQuestionsFromLogs = matchingLogs.reduce((acc, l) => acc + (l.solvedCount || 0), 0);
  const totalCorrectFromLogs = matchingLogs.reduce((acc, l) => acc + (l.correctCount || 0), 0);
  const totalWrongFromLogs = matchingLogs.reduce((acc, l) => acc + (l.wrongCount || 0), 0);
  const totalEmptyFromLogs = matchingLogs.reduce((acc, l) => acc + (l.emptyCount || 0), 0);

  return {
    tytNet,
    aytNet,
    tytLabel,
    aytLabel,
    subjectLabel,
    matchingLogs,
    matchingErrors,
    totalQuestionsFromLogs,
    totalCorrectFromLogs,
    totalWrongFromLogs,
    totalEmptyFromLogs
  };
}

const errorReasonLabels: Record<string, string> = {
  bilgi_eksigi: 'Bilgi Eksikliği',
  dikkat_hatasi: 'Dikkat Hatası',
  zaman_yetmedi: 'Zaman Yetmedi',
  iki_sik_arasinda: 'İki Şık Arasında Kalma',
  soru_kokunu_yanlis_okuma: 'Soru Kökünü Yanlış Okuma',
};

function computeStudyMinutes(plans: StudyPlanItem[], branchExams: BranchExam[], videos: YouTubeVideoItem[]): number {
  const planMins = plans.reduce((acc, p) => {
    if ((p.completedMinutes || 0) > 0) return acc + p.completedMinutes;
    if (p.status === 'completed') return acc + (p.plannedMinutes || 0);
    return acc;
  }, 0);

  const examMins = branchExams.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);

  const videoMins = videos.reduce((acc, v) => {
    if (!v.isWatched) return acc;
    if ((v.durationMinutes || 0) > 0) return acc + v.durationMinutes!;
    if (v.playlistVideos && v.playlistVideos.length > 0) {
      return acc + v.playlistVideos.filter(pv => pv.isWatched).reduce((sum, pv) => sum + (pv.durationMinutes || 0), 0);
    }
    return acc + 30; // default estimated 30 mins per watched video if duration not specified
  }, 0);

  return planMins + examMins + videoMins;
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs">
      <span className="text-slate-400 font-medium">
        Sayfa <strong className="text-white font-mono">{currentPage}</strong> / <strong className="text-white font-mono">{totalPages}</strong>
      </span>
      <div className="flex items-center space-x-1.5">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all cursor-pointer"
        >
          Önceki
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all cursor-pointer"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}

interface SubjectProgressViewProps {
  state: YKSDataState;
  onUpdateTopicStatus?: (
    topicName: string, 
    status: 'Çalışmadım' | 'Erteledim' | 'Zor Geldi' | 'Çalıştım' | 'Uzmanlaştım', 
    isManual?: boolean
  ) => void;
  onNavigateTab?: (tab: string, opts?: { subTab?: 'resources' | 'topics'; subject?: string }) => void;
}

export interface SubjectCategory {
  id: string;
  title: string;
  subtitle: string;
  group: 'Sayısal' | 'Sözel' | 'Eşit Ağırlık' | 'Genel';
  fields: FieldType[];
  examType: 'TYT' | 'AYT' | 'TYT & AYT';
  icon: LucideIcon;
  gradient: string;
  borderColor: string;
  badgeBg: string;
  curriculumKeys: string[];
}

export const SUBJECT_CATEGORIES: SubjectCategory[] = [
  {
    id: 'matematik',
    title: 'Matematik',
    subtitle: 'TYT & AYT Matematik & Problemler',
    group: 'Sayısal',
    fields: ['SAY', 'EA'],
    examType: 'TYT & AYT',
    icon: Calculator,
    gradient: 'from-blue-600 to-indigo-600',
    borderColor: 'border-blue-500/30',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    curriculumKeys: ['TYT Matematik', 'AYT Matematik', 'Problemler']
  },
  {
    id: 'geometri',
    title: 'Geometri',
    subtitle: 'TYT & AYT Geometri',
    group: 'Sayısal',
    fields: ['SAY', 'EA'],
    examType: 'TYT & AYT',
    icon: Ruler,
    gradient: 'from-cyan-600 to-blue-600',
    borderColor: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    curriculumKeys: ['TYT Geometri', 'AYT Geometri']
  },
  {
    id: 'fizik',
    title: 'Fizik',
    subtitle: 'TYT & AYT Fizik',
    group: 'Sayısal',
    fields: ['SAY'],
    examType: 'TYT & AYT',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    curriculumKeys: ['TYT Fizik', 'AYT Fizik']
  },
  {
    id: 'kimya',
    title: 'Kimya',
    subtitle: 'TYT & AYT Kimya',
    group: 'Sayısal',
    fields: ['SAY'],
    examType: 'TYT & AYT',
    icon: FlaskConical,
    gradient: 'from-emerald-600 to-teal-600',
    borderColor: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    curriculumKeys: ['TYT Kimya', 'AYT Kimya']
  },
  {
    id: 'biyoloji',
    title: 'Biyoloji',
    subtitle: 'TYT & AYT Biyoloji',
    group: 'Sayısal',
    fields: ['SAY'],
    examType: 'TYT & AYT',
    icon: Dna,
    gradient: 'from-green-600 to-emerald-600',
    borderColor: 'border-green-500/30',
    badgeBg: 'bg-green-500/20 text-green-300 border-green-500/30',
    curriculumKeys: ['TYT Biyoloji', 'AYT Biyoloji']
  },
  {
    id: 'turkce_edebiyat',
    title: 'Türkçe & Edebiyat',
    subtitle: 'TYT Türkçe, Paragraf & AYT Edebiyat',
    group: 'Eşit Ağırlık',
    fields: ['EA', 'SÖZ', 'DİL'],
    examType: 'TYT & AYT',
    icon: BookOpen,
    gradient: 'from-fuchsia-600 to-pink-600',
    borderColor: 'border-fuchsia-500/30',
    badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    curriculumKeys: ['TYT Türkçe', 'Paragraf', 'AYT Edebiyat']
  },
  {
    id: 'tarih',
    title: 'Tarih',
    subtitle: 'TYT Tarih, AYT Tarih-1 & Tarih-2',
    group: 'Sözel',
    fields: ['EA', 'SÖZ'],
    examType: 'TYT & AYT',
    icon: Landmark,
    gradient: 'from-yellow-600 to-amber-700',
    borderColor: 'border-yellow-500/30',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    curriculumKeys: ['TYT Tarih', 'AYT Tarih-1', 'AYT Tarih-2']
  },
  {
    id: 'cografya',
    title: 'Coğrafya',
    subtitle: 'TYT Coğrafya, AYT Coğrafya-1 & Coğrafya-2',
    group: 'Eşit Ağırlık',
    fields: ['EA', 'SÖZ'],
    examType: 'TYT & AYT',
    icon: Globe,
    gradient: 'from-teal-600 to-emerald-700',
    borderColor: 'border-teal-500/30',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    curriculumKeys: ['TYT Coğrafya', 'AYT Coğrafya-1', 'AYT Coğrafya-2']
  },
  {
    id: 'felsefe_din',
    title: 'Felsefe & Din Kültürü',
    subtitle: 'TYT Felsefe, Din & AYT Felsefe Grubu',
    group: 'Sözel',
    fields: ['SÖZ'],
    examType: 'TYT & AYT',
    icon: Brain,
    gradient: 'from-violet-600 to-purple-600',
    borderColor: 'border-violet-500/30',
    badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    curriculumKeys: ['TYT Felsefe', 'TYT Din Kültürü', 'AYT Felsefe Grubu']
  },
  {
    id: 'yabanci_dil',
    title: 'Yabancı Dil (YDT)',
    subtitle: 'AYT / YDT İngilizce & Almanca / Fransızca',
    group: 'Genel',
    fields: ['DİL'],
    examType: 'AYT',
    icon: Languages,
    gradient: 'from-rose-600 to-pink-600',
    borderColor: 'border-rose-500/30',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    curriculumKeys: ['AYT Yabancı Dil']
  }
];

// Helper to check if item subject matches category keys
function matchesSubjectCategory(itemSubject: string | undefined, category: SubjectCategory): boolean {
  if (!itemSubject) return false;
  const sLower = itemSubject.toLowerCase().trim();
  
  return category.curriculumKeys.some(key => {
    const keyLower = key.toLowerCase().trim();
    if (sLower === keyLower) return true;
    if (sLower.includes(keyLower) || keyLower.includes(sLower)) return true;
    
    // Core token matching
    if (category.id === 'matematik' && (sLower.includes('matematik') || sLower.includes('problem'))) return true;
    if (category.id === 'geometri' && sLower.includes('geometri')) return true;
    if (category.id === 'fizik' && sLower.includes('fizik')) return true;
    if (category.id === 'kimya' && sLower.includes('kimya')) return true;
    if (category.id === 'biyoloji' && sLower.includes('biyoloji')) return true;
    if (category.id === 'turkce_edebiyat' && (sLower.includes('türkçe') || sLower.includes('turkce') || sLower.includes('edebiyat') || sLower.includes('paragraf'))) return true;
    if (category.id === 'tarih' && sLower.includes('tarih')) return true;
    if (category.id === 'cografya' && (sLower.includes('coğrafya') || sLower.includes('cografya'))) return true;
    if (category.id === 'felsefe_din' && (sLower.includes('felsefe') || sLower.includes('din'))) return true;
    if (category.id === 'yabanci_dil' && (sLower.includes('dil') || sLower.includes('ydt') || sLower.includes('ingilizce'))) return true;
    
    return false;
  });
}

export type DetailSubTab = 'overview' | 'topics' | 'resources' | 'questions' | 'study' | 'mocks' | 'youtube' | 'errors';

export const SubjectProgressView: React.FC<SubjectProgressViewProps> = ({
  state,
  onUpdateTopicStatus,
  onNavigateTab
}) => {
  const targetField: FieldType = state.profile?.targetField || 'SAY';

  const getFieldTitle = (f: FieldType) => {
    switch (f) {
      case 'SAY': return 'Sayısal (SAY)';
      case 'EA': return 'Eşit Ağırlık (EA)';
      case 'SÖZ': return 'Sözel (SÖZ)';
      case 'DİL': return 'Yabancı Dil (DİL)';
      default: return 'Sayısal (SAY)';
    }
  };

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALANIM');
  
  // Detail Exam Scope Filter: 'TÜMÜ' | 'TYT' | 'AYT'
  const [detailExamFilter, setDetailExamFilter] = useState<'TÜMÜ' | 'TYT' | 'AYT'>('TÜMÜ');
  
  // Landing Summary Time Range Filter: 'haftalik' | 'aylik' | 'tumu'
  const [landingTimeRange, setLandingTimeRange] = useState<'haftalik' | 'aylik' | 'tumu'>('tumu');
  
  // Default to summary overview tab so the user is not overwhelmed with long topic lists
  const [detailSubTab, setDetailSubTab] = useState<DetailSubTab>('overview');
  
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [topicStatusFilter, setTopicStatusFilter] = useState<string>('ALL');
  
  // Toggle for curriculum distribution view mode: 'status' (Konu Durumu) vs 'resource' (Kaynak Çözümü)
  const [curriculumViewMode, setCurriculumViewMode] = useState<'status' | 'resource'>('status');
  
  // Track open/collapsed state for curriculum section accordions
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Image lightbox preview and inline expand states
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [expandedImageIds, setExpandedImageIds] = useState<Record<string, boolean>>({});

  // Detail Sub-Tab Mock Filter: 'all' | 'branch' | 'general'
  const [mockTypeTab, setMockTypeTab] = useState<'all' | 'branch' | 'general'>('all');
  const [expandedMockIds, setExpandedMockIds] = useState<Record<string, boolean>>({});

  // Pagination states for detail view sub-tabs
  const [topicPage, setTopicPage] = useState(1);
  const [resourcePage, setResourcePage] = useState(1);
  const [questionPage, setQuestionPage] = useState(1);
  const [studyPage, setStudyPage] = useState(1);
  const [mockPage, setMockPage] = useState(1);
  const [generalMockPage, setGeneralMockPage] = useState(1);
  const [videoPage, setVideoPage] = useState(1);
  const [errorPage, setErrorPage] = useState(1);

  // Reset pagination to page 1 on filter or tab change
  useEffect(() => {
    setTopicPage(1);
    setResourcePage(1);
    setQuestionPage(1);
    setStudyPage(1);
    setMockPage(1);
    setGeneralMockPage(1);
    setVideoPage(1);
    setErrorPage(1);
  }, [selectedSubjectId, detailExamFilter, detailSubTab, topicSearchQuery, topicStatusFilter, mockTypeTab]);

  // Smooth scroll to top whenever selected subject, sub-tab, or group filter changes (crucial for mobile layout transition)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const mainElem = document.querySelector('main');
    if (mainElem) {
      mainElem.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedSubjectId, detailSubTab, selectedGroupFilter]);

  const topicStatuses = state.topicStatuses || {};
  const completedPastTopics = state.completedPastTopics || [];

  // Compute stats for all subject categories
  const categoryStats = useMemo(() => {
    return SUBJECT_CATEGORIES.map(category => {
      // 1. Topics grouped by curriculum keys
      const topicGroups: { keyName: string; topics: string[] }[] = [];
      let allTopics: string[] = [];

      category.curriculumKeys.forEach(key => {
        if (YKS_CURRICULUM_TOPICS[key]) {
          const groupTopics = YKS_CURRICULUM_TOPICS[key];
          topicGroups.push({ keyName: key, topics: groupTopics });
          allTopics.push(...groupTopics);
        }
      });
      
      const uniqueTopics = Array.from(new Set(allTopics));
      
      let completedTopicsCount = 0;
      let masteredCount = 0;
      let workedCount = 0;
      let hardCount = 0;
      let postponedCount = 0;
      let notStartedCount = 0;

      uniqueTopics.forEach(t => {
        const status = topicStatuses[t];
        const isPastCompleted = completedPastTopics.includes(t);

        if (status === 'Uzmanlaştım') {
          masteredCount++;
          completedTopicsCount++;
        } else if (status === 'Çalıştım' || isPastCompleted) {
          workedCount++;
          completedTopicsCount++;
        } else if (status === 'Zor Geldi') {
          hardCount++;
        } else if (status === 'Erteledim') {
          postponedCount++;
        } else {
          notStartedCount++;
        }
      });

      const topicCompletionPercent = uniqueTopics.length > 0
        ? Math.round((completedTopicsCount / uniqueTopics.length) * 100)
        : 0;

      // TYT & AYT topic breakdown for subject card summary
      const tytTopicGroups = topicGroups.filter(g => isTYTKey(g.keyName));
      let allTytTopics: string[] = [];
      tytTopicGroups.forEach(g => allTytTopics.push(...g.topics));
      const tytTopics = Array.from(new Set(allTytTopics));
      let tytCompletedTopicsCount = 0;
      tytTopics.forEach(t => {
        const status = topicStatuses[t];
        const isPastCompleted = completedPastTopics.includes(t);
        if (status === 'Uzmanlaştım' || status === 'Çalıştım' || isPastCompleted) {
          tytCompletedTopicsCount++;
        }
      });
      const tytCompletionPercent = tytTopics.length > 0
        ? Math.round((tytCompletedTopicsCount / tytTopics.length) * 100)
        : 0;

      const aytTopicGroups = topicGroups.filter(g => isAYTKey(g.keyName));
      let allAytTopics: string[] = [];
      aytTopicGroups.forEach(g => allAytTopics.push(...g.topics));
      const aytTopics = Array.from(new Set(allAytTopics));
      let aytCompletedTopicsCount = 0;
      aytTopics.forEach(t => {
        const status = topicStatuses[t];
        const isPastCompleted = completedPastTopics.includes(t);
        if (status === 'Uzmanlaştım' || status === 'Çalıştım' || isPastCompleted) {
          aytCompletedTopicsCount++;
        }
      });
      const aytCompletionPercent = aytTopics.length > 0
        ? Math.round((aytCompletedTopicsCount / aytTopics.length) * 100)
        : 0;

      // 2. Resources
      const matchedResources = (state.resources || []).filter(r => matchesSubjectCategory(r.subject, category));
      const totalResourceUnits = matchedResources.reduce((acc, r) => acc + (r.totalUnits || 0), 0);
      const completedResourceUnits = matchedResources.reduce((acc, r) => acc + (r.completedUnits || 0), 0);
      const resourcePercent = totalResourceUnits > 0 ? Math.round((completedResourceUnits / totalResourceUnits) * 100) : 0;

      // 3. Question Logs
      const matchedLogs = (state.questionLogs || []).filter(l => 
        matchesSubjectCategory(l.subject, category) && isWithinTimeRange(l.date, landingTimeRange)
      );
      const totalSolvedQuestions = matchedLogs.reduce((acc, l) => acc + (l.solvedCount || 0), 0);
      const totalCorrectQuestions = matchedLogs.reduce((acc, l) => acc + (l.correctCount || 0), 0);
      const totalWrongQuestions = matchedLogs.reduce((acc, l) => acc + (l.wrongCount || 0), 0);
      const totalEmptyQuestions = matchedLogs.reduce((acc, l) => acc + (l.emptyCount || 0), 0);
      const questionAccuracy = (totalCorrectQuestions + totalWrongQuestions + totalEmptyQuestions) > 0
        ? Math.round((totalCorrectQuestions / (totalCorrectQuestions + totalWrongQuestions + totalEmptyQuestions)) * 100)
        : 0;

      // 4. Study Plans, Branch Exams, Videos & Combined Study Time
      const matchedPlans = (state.studyPlans || [])
        .filter(p => 
          matchesSubjectCategory(p.subject, category) && isWithinTimeRange(p.date, landingTimeRange)
        )
        .sort((a, b) => {
          const timeA = a.date ? new Date(a.date).getTime() : 0;
          const timeB = b.date ? new Date(b.date).getTime() : 0;
          return timeB - timeA;
        });

      // 5. Branch Exams & General Mocks
      const matchedBranchExams = (state.branchExams || [])
        .filter(b => 
          matchesSubjectCategory(b.subject, category) && isWithinTimeRange(b.date, landingTimeRange)
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const branchExamCount = matchedBranchExams.length;
      const avgBranchNet = branchExamCount > 0
        ? (matchedBranchExams.reduce((acc, b) => acc + (b.net || 0), 0) / branchExamCount).toFixed(1)
        : '0.0';

      const matchedGeneralMocks = (state.generalMocks || [])
        .filter(g => 
          isWithinTimeRange(g.date, landingTimeRange)
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const generalExamCount = matchedGeneralMocks.length;

      // 6. YouTube Videos
      const matchedVideos = (state.youtubeVideos || []).filter(v => matchesSubjectCategory(v.subject, category));
      const totalVideos = matchedVideos.length;
      const watchedVideos = matchedVideos.filter(v => v.isWatched).length;

      // Combined Total Study Duration
      const totalStudyMinutes = computeStudyMinutes(matchedPlans, matchedBranchExams, matchedVideos);

      // Calculate active days specifically for this category
      const categoryDates = new Set<string>();
      matchedPlans.forEach(p => {
        if (p.date && ((p.completedMinutes || 0) > 0 || p.status === 'completed')) {
          const dStr = p.date.trim().split(' ')[0];
          if (dStr) categoryDates.add(dStr);
        }
      });
      matchedBranchExams.forEach(b => {
        if (b.date) {
          const dStr = b.date.trim().split(' ')[0];
          if (dStr) categoryDates.add(dStr);
        }
      });
      matchedLogs.forEach(l => {
        if (l.date && (l.solvedCount || 0) > 0) {
          const dStr = l.date.trim().split(' ')[0];
          if (dStr) categoryDates.add(dStr);
        }
      });
      const activeDaysCount = Math.max(1, categoryDates.size);

      // 7. Topic Errors
      const matchedErrors = (state.topicErrors || []).filter(e => 
        matchesSubjectCategory(e.subject, category) && isWithinTimeRange(e.date, landingTimeRange)
      );
      const totalErrors = matchedErrors.length;
      const revisedErrors = matchedErrors.filter(e => e.revised).length;

      return {
        category,
        topicGroups,
        topics: uniqueTopics,
        completedTopicsCount,
        masteredCount,
        workedCount,
        hardCount,
        postponedCount,
        notStartedCount,
        topicCompletionPercent,
        matchedResources,
        totalResourceUnits,
        completedResourceUnits,
        resourcePercent,
        matchedLogs,
        totalSolvedQuestions,
        totalCorrectQuestions,
        totalWrongQuestions,
        totalEmptyQuestions,
        questionAccuracy,
        matchedPlans,
        totalStudyMinutes,
        matchedBranchExams,
        branchExamCount,
        avgBranchNet,
        matchedGeneralMocks,
        generalExamCount,
        matchedVideos,
        totalVideos,
        watchedVideos,
        matchedErrors,
        totalErrors,
        revisedErrors,
        tytTopics,
        tytCompletedTopicsCount,
        tytCompletionPercent,
        aytTopics,
        aytCompletedTopicsCount,
        aytCompletionPercent,
        activeDaysCount,
      };
    });
  }, [state, topicStatuses, completedPastTopics, landingTimeRange]);

  // Filtered Subject List for Main Grid View
  const filteredCategoryStats = useMemo(() => {
    return categoryStats.filter(cs => {
      const cat = cs.category;
      const matchesSearch = searchQuery === '' || 
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        cat.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (selectedGroupFilter === 'ALANIM') {
        return cat.fields.includes(targetField);
      }
      if (selectedGroupFilter === 'ALL') return true;
      if (selectedGroupFilter === 'TYT') return cat.examType.includes('TYT');
      if (selectedGroupFilter === 'AYT') return cat.examType.includes('AYT');
      if (selectedGroupFilter === 'DİL') return cat.fields.includes('DİL') || cat.group === 'Genel';
      if (selectedGroupFilter === 'Sayısal' || selectedGroupFilter === 'SAY') return cat.fields.includes('SAY') || cat.group === 'Sayısal';
      if (selectedGroupFilter === 'Eşit Ağırlık' || selectedGroupFilter === 'EA') return cat.fields.includes('EA') || cat.group === 'Eşit Ağırlık';
      if (selectedGroupFilter === 'Sözel' || selectedGroupFilter === 'SÖZ') return cat.fields.includes('SÖZ') || cat.group === 'Sözel';
      return cat.group === selectedGroupFilter;
    });
  }, [categoryStats, searchQuery, selectedGroupFilter, targetField]);

  // Overall Global Curriculum Stats for active filter
  const globalCurriculumStats = useMemo(() => {
    let totalTopics = 0;
    let totalCompleted = 0;
    let totalTytTopics = 0;
    let totalTytCompleted = 0;
    let totalAytTopics = 0;
    let totalAytCompleted = 0;

    filteredCategoryStats.forEach(cs => {
      totalTopics += cs.topics.length;
      totalCompleted += cs.completedTopicsCount;
      totalTytTopics += cs.tytTopics.length;
      totalTytCompleted += cs.tytCompletedTopicsCount;
      totalAytTopics += cs.aytTopics.length;
      totalAytCompleted += cs.aytCompletedTopicsCount;
    });

    const percent = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;
    const tytPercent = totalTytTopics > 0 ? Math.round((totalTytCompleted / totalTytTopics) * 100) : 0;
    const aytPercent = totalAytTopics > 0 ? Math.round((totalAytCompleted / totalAytTopics) * 100) : 0;
    
    const totalQuestions = filteredCategoryStats.reduce((acc, cs) => acc + cs.totalSolvedQuestions, 0);
    const totalStudyMins = filteredCategoryStats.reduce((acc, cs) => acc + cs.totalStudyMinutes, 0);
    const totalResources = filteredCategoryStats.reduce((acc, cs) => acc + cs.matchedResources.length, 0);

    return {
      totalTopics,
      totalCompleted,
      percent,
      totalTytTopics,
      totalTytCompleted,
      tytPercent,
      totalAytTopics,
      totalAytCompleted,
      aytPercent,
      totalQuestions,
      totalStudyMins,
      totalResources
    };
  }, [filteredCategoryStats]);

  // Get global active days count (the total number of days any study/activity was recorded across any subject)
  const globalActiveDaysCount = useMemo(() => {
    const globalDates = new Set<string>();
    
    // Check study plans
    (state.studyPlans || []).forEach(p => {
      if (p.date && isWithinTimeRange(p.date, landingTimeRange) && ((p.completedMinutes || 0) > 0 || p.status === 'completed')) {
        const dStr = p.date.trim().split(' ')[0];
        if (dStr) globalDates.add(dStr);
      }
    });
    
    // Check branch exams
    (state.branchExams || []).forEach(b => {
      if (b.date && isWithinTimeRange(b.date, landingTimeRange)) {
        const dStr = b.date.trim().split(' ')[0];
        if (dStr) globalDates.add(dStr);
      }
    });
    
    // Check question logs
    (state.questionLogs || []).forEach(l => {
      if (l.date && isWithinTimeRange(l.date, landingTimeRange) && (l.solvedCount || 0) > 0) {
        const dStr = l.date.trim().split(' ')[0];
        if (dStr) globalDates.add(dStr);
      }
    });
    
    return Math.max(1, globalDates.size);
  }, [landingTimeRange, state.studyPlans, state.branchExams, state.questionLogs]);

  const dailyAvgMins = useMemo(() => {
    return Math.round(globalCurriculumStats.totalStudyMins / globalActiveDaysCount);
  }, [globalCurriculumStats.totalStudyMins, globalActiveDaysCount]);

  // Raw selected active category detail before scope filter
  const activeRawCategoryData = useMemo(() => {
    if (!selectedSubjectId) return null;
    return categoryStats.find(cs => cs.category.id === selectedSubjectId) || null;
  }, [selectedSubjectId, categoryStats]);

  // Selected active category detail dynamically filtered by detailExamFilter ('TÜMÜ' | 'TYT' | 'AYT')
  const activeDetailData = useMemo(() => {
    if (!activeRawCategoryData) return null;

    if (detailExamFilter === 'TÜMÜ') {
      return activeRawCategoryData;
    }

    const { category, topicGroups } = activeRawCategoryData;

    // Filter topic groups by exam key
    const filteredTopicGroups = topicGroups.filter(g => {
      if (detailExamFilter === 'TYT') return isTYTKey(g.keyName);
      if (detailExamFilter === 'AYT') return isAYTKey(g.keyName);
      return true;
    });

    let allTopics: string[] = [];
    filteredTopicGroups.forEach(g => allTopics.push(...g.topics));
    const uniqueTopics = Array.from(new Set(allTopics));

    let completedTopicsCount = 0;
    let masteredCount = 0;
    let workedCount = 0;
    let hardCount = 0;
    let postponedCount = 0;
    let notStartedCount = 0;

    uniqueTopics.forEach(t => {
      const status = topicStatuses[t];
      const isPastCompleted = completedPastTopics.includes(t);

      if (status === 'Uzmanlaştım') {
        masteredCount++;
        completedTopicsCount++;
      } else if (status === 'Çalıştım' || isPastCompleted) {
        workedCount++;
        completedTopicsCount++;
      } else if (status === 'Zor Geldi') {
        hardCount++;
      } else if (status === 'Erteledim') {
        postponedCount++;
      } else {
        notStartedCount++;
      }
    });

    const topicCompletionPercent = uniqueTopics.length > 0
      ? Math.round((completedTopicsCount / uniqueTopics.length) * 100)
      : 0;

    const matchedResources = activeRawCategoryData.matchedResources.filter(r => matchesExamScope(r, detailExamFilter));
    const totalResourceUnits = matchedResources.reduce((acc, r) => acc + (r.totalUnits || 0), 0);
    const completedResourceUnits = matchedResources.reduce((acc, r) => acc + (r.completedUnits || 0), 0);
    const resourcePercent = totalResourceUnits > 0 ? Math.round((completedResourceUnits / totalResourceUnits) * 100) : 0;

    const matchedLogs = activeRawCategoryData.matchedLogs.filter(l => matchesExamScope(l, detailExamFilter));
    const totalSolvedQuestions = matchedLogs.reduce((acc, l) => acc + (l.solvedCount || 0), 0);
    const totalCorrectQuestions = matchedLogs.reduce((acc, l) => acc + (l.correctCount || 0), 0);
    const totalWrongQuestions = matchedLogs.reduce((acc, l) => acc + (l.wrongCount || 0), 0);
    const totalEmptyQuestions = matchedLogs.reduce((acc, l) => acc + (l.emptyCount || 0), 0);
    const questionAccuracy = (totalCorrectQuestions + totalWrongQuestions + totalEmptyQuestions) > 0
      ? Math.round((totalCorrectQuestions / (totalCorrectQuestions + totalWrongQuestions + totalEmptyQuestions)) * 100)
      : 0;

    const matchedPlans = [...activeRawCategoryData.matchedPlans]
      .filter(p => matchesExamScope(p, detailExamFilter))
      .sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return timeB - timeA;
      });

    const matchedBranchExams = [...activeRawCategoryData.matchedBranchExams]
      .filter(b => matchesExamScope(b, detailExamFilter))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const branchExamCount = matchedBranchExams.length;
    const avgBranchNet = branchExamCount > 0
      ? (matchedBranchExams.reduce((acc, b) => acc + (b.net || 0), 0) / branchExamCount).toFixed(1)
      : '0.0';

    const matchedGeneralMocks = [...(activeRawCategoryData.matchedGeneralMocks || [])]
      .filter(g => {
        if (detailExamFilter === 'TÜMÜ') return true;
        if (detailExamFilter === 'TYT') return Boolean(g.tyt && g.tyt.totalNet > 0);
        if (detailExamFilter === 'AYT') return Boolean(g.ayt && g.ayt.totalNet > 0);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const generalExamCount = matchedGeneralMocks.length;

    const matchedVideos = activeRawCategoryData.matchedVideos.filter(v => matchesExamScope(v, detailExamFilter));
    const totalVideos = matchedVideos.length;
    const watchedVideos = matchedVideos.filter(v => v.isWatched).length;

    const totalStudyMinutes = computeStudyMinutes(matchedPlans, matchedBranchExams, matchedVideos);

    const matchedErrors = activeRawCategoryData.matchedErrors.filter(e => matchesExamScope(e, detailExamFilter));
    const totalErrors = matchedErrors.length;
    const revisedErrors = matchedErrors.filter(e => e.revised).length;

    return {
      category,
      topicGroups: filteredTopicGroups,
      topics: uniqueTopics,
      completedTopicsCount,
      masteredCount,
      workedCount,
      hardCount,
      postponedCount,
      notStartedCount,
      topicCompletionPercent,
      matchedResources,
      totalResourceUnits,
      completedResourceUnits,
      resourcePercent,
      matchedLogs,
      totalSolvedQuestions,
      totalCorrectQuestions,
      totalWrongQuestions,
      totalEmptyQuestions,
      questionAccuracy,
      matchedPlans,
      totalStudyMinutes,
      matchedBranchExams,
      branchExamCount,
      avgBranchNet,
      matchedGeneralMocks,
      generalExamCount,
      matchedVideos,
      totalVideos,
      watchedVideos,
      matchedErrors,
      totalErrors,
      revisedErrors,
      tytTopics: activeRawCategoryData.tytTopics,
      tytCompletedTopicsCount: activeRawCategoryData.tytCompletedTopicsCount,
      tytCompletionPercent: activeRawCategoryData.tytCompletionPercent,
      aytTopics: activeRawCategoryData.aytTopics,
      aytCompletedTopicsCount: activeRawCategoryData.aytCompletedTopicsCount,
      aytCompletionPercent: activeRawCategoryData.aytCompletionPercent,
    };
  }, [activeRawCategoryData, detailExamFilter, topicStatuses, completedPastTopics]);

  // Resource-based topic solved stats for activeDetailData
  const resourceTopicStats = useMemo(() => {
    if (!activeDetailData) {
      return {
        solved3PlusCount: 0,
        solved2Count: 0,
        solved1Count: 0,
        solved0Count: 0,
        totalTopicsSolvedInResources: 0,
        resourceSolvedPercent: 0,
      };
    }

    const topics = activeDetailData.topics;
    const matchedResources = activeDetailData.matchedResources;

    let solved3PlusCount = 0;
    let solved2Count = 0;
    let solved1Count = 0;
    let solved0Count = 0;

    topics.forEach(tName => {
      const resCount = matchedResources.filter(r => (r.completedTopics || []).includes(tName)).length;
      if (resCount >= 3) {
        solved3PlusCount++;
      } else if (resCount === 2) {
        solved2Count++;
      } else if (resCount === 1) {
        solved1Count++;
      } else {
        solved0Count++;
      }
    });

    const totalTopicsSolvedInResources = solved1Count + solved2Count + solved3PlusCount;
    const resourceSolvedPercent = topics.length > 0 
      ? Math.round((totalTopicsSolvedInResources / topics.length) * 100) 
      : 0;

    return {
      solved3PlusCount,
      solved2Count,
      solved1Count,
      solved0Count,
      totalTopicsSolvedInResources,
      resourceSolvedPercent,
    };
  }, [activeDetailData]);

  // Format minutes into hours & mins
  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins} dk`;
    if (remainingMins === 0) return `${hours} sa`;
    return `${hours} sa ${remainingMins} dk`;
  };

  // Status Badge Helper
  const getStatusBadge = (topicName: string) => {
    const status = topicStatuses[topicName];
    const isPastCompleted = completedPastTopics.includes(topicName);

    if (status === 'Uzmanlaştım') {
      return { label: 'Uzmanlaştım', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    }
    if (status === 'Çalıştım' || isPastCompleted) {
      return { label: 'Çalıştım', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    }
    if (status === 'Zor Geldi') {
      return { label: 'Zor Geldi', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    }
    if (status === 'Erteledim') {
      return { label: 'Erteledim', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    return { label: 'Çalışmadım', color: 'bg-slate-800 text-slate-400 border-slate-700' };
  };

  // Toggle accordion section open/close
  const toggleSection = (keyName: string) => {
    setExpandedSections(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  return (
    <div className="space-y-6 pb-12" id="subject-progress-view-root">
      
      {/* SECTION 1: DETAILED SUMMARY VIEW FOR SELECTED SUBJECT */}
      {activeDetailData ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Bar with Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${activeDetailData.category.gradient} opacity-10 rounded-full blur-3xl pointer-events-none`} />

            <div className="space-y-3 relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setSelectedSubjectId(null)}
                  className="inline-flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tüm Derslere Dön</span>
                </button>

                {/* Scope Filter Buttons: TÜMÜ | TYT | AYT */}
                <div className="inline-flex items-center p-1 bg-slate-950/90 border border-slate-800 rounded-xl space-x-1 shadow-inner">
                  <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center space-x-1">
                    <Filter className="w-3 h-3 text-indigo-400" />
                    <span className="hidden sm:inline">Kapsam:</span>
                  </span>
                  {(['TÜMÜ', 'TYT', 'AYT'] as const).map(scope => {
                    const isDisabled = activeRawCategoryData ? (
                      (scope === 'TYT' && activeRawCategoryData.tytTopics.length === 0) ||
                      (scope === 'AYT' && activeRawCategoryData.aytTopics.length === 0)
                    ) : false;

                    return (
                      <button
                        key={scope}
                        disabled={isDisabled}
                        onClick={() => setDetailExamFilter(scope)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          detailExamFilter === scope
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400'
                            : isDisabled
                            ? 'opacity-40 cursor-not-allowed text-slate-600'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {scope}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeDetailData.category.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                  <activeDetailData.category.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {activeDetailData.category.title}
                    </h1>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${activeDetailData.category.badgeBg}`}>
                      {activeDetailData.category.examType}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    {activeDetailData.category.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Subject Progress Pill */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center space-x-4 shrink-0 relative z-10">
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Müfredat Tamamlama</div>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  %{activeDetailData.topicCompletionPercent}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  {activeDetailData.completedTopicsCount} / {activeDetailData.topics.length} Konu Bitti
                </div>
              </div>
              <div className="w-14 h-14 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="23" stroke="currentColor" strokeWidth="4.5" className="text-slate-800" fill="transparent" />
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="23" 
                    stroke="currentColor" 
                    strokeWidth="4.5" 
                    className="text-emerald-400 transition-all duration-1000" 
                    fill="transparent"
                    strokeDasharray={144}
                    strokeDashoffset={144 - (144 * activeDetailData.topicCompletionPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <Sparkles className="w-4 h-4 text-emerald-400 absolute" />
              </div>
            </div>
          </div>

          {/* MULTI-TAB NAVIGATION SCROLL BAR */}
          <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl scrollbar-none snap-x">
            <button
              onClick={() => setDetailSubTab('overview')}
              className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
                detailSubTab === 'overview'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Genel Özet</span>
            </button>

            <button
              onClick={() => setDetailSubTab('topics')}
              className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
                detailSubTab === 'topics'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookMarked className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Konular ({activeDetailData.completedTopicsCount}/{activeDetailData.topics.length})</span>
            </button>

            <button
              onClick={() => setDetailSubTab('resources')}
              className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
                detailSubTab === 'resources'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Kaynaklar ({activeDetailData.matchedResources.length})</span>
            </button>

            <button
              onClick={() => setDetailSubTab('questions')}
              className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
                detailSubTab === 'questions'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Soru Takibi ({activeDetailData.totalSolvedQuestions})</span>
            </button>

            <button
              onClick={() => setDetailSubTab('study')}
              className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
                detailSubTab === 'study'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Süre ({formatMinutes(activeDetailData.totalStudyMinutes)})</span>
            </button>

            <button
              onClick={() => setDetailSubTab('mocks')}
              className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
                detailSubTab === 'mocks'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Denemeler ({activeDetailData.branchExamCount + activeDetailData.generalExamCount})</span>
            </button>

            <button
              onClick={() => setDetailSubTab('youtube')}
              className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
                detailSubTab === 'youtube' || detailSubTab === 'errors'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Youtube className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="whitespace-nowrap">Video & Hatalar ({activeDetailData.totalVideos + activeDetailData.totalErrors})</span>
            </button>
          </div>

          {/* TAB 0: OVERVIEW (ÖZET & GENEL DURUM) */}
          {detailSubTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Clean Summary Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                {/* Card 1: Konu Müfredatı Özet Kartı */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-xl">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-indigo-400">
                        <BookMarked className="w-5 h-5" />
                        <h3 className="font-extrabold text-white text-base">Konu İlerlemesi</h3>
                      </div>
                      <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        %{activeDetailData.topicCompletionPercent}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400 font-semibold">
                        <span>Tamamlanan Konu</span>
                        <span className="text-white font-mono">{activeDetailData.completedTopicsCount} / {activeDetailData.topics.length}</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div 
                          style={{ width: `${activeDetailData.topicCompletionPercent}%` }} 
                          className={`h-full bg-gradient-to-r ${activeDetailData.category.gradient} rounded-full`} 
                        />
                      </div>
                    </div>

                    {/* Mini Status Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                        <span className="text-emerald-400 font-semibold">Uzmanlaştım:</span>
                        <span className="font-black text-white font-mono">{activeDetailData.masteredCount}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                        <span className="text-indigo-300 font-semibold">Çalıştım:</span>
                        <span className="font-black text-white font-mono">{activeDetailData.workedCount}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                        <span className="text-rose-400 font-semibold">Zor Geldi:</span>
                        <span className="font-black text-white font-mono">{activeDetailData.hardCount}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                        <span className="text-amber-400 font-semibold">Erteledim:</span>
                        <span className="font-black text-white font-mono">{activeDetailData.postponedCount}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDetailSubTab('topics')}
                    className="w-full mt-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <span>Konu Listesini İncele</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 2: Kaynaklar & Kitap Özet Kartı */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-xl">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-cyan-400">
                        <BookOpen className="w-5 h-5" />
                        <h3 className="font-extrabold text-white text-base">Kaynak & Kitaplar</h3>
                      </div>
                      <span className="text-xs font-black text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                        {activeDetailData.matchedResources.length} Kitap
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400 font-semibold">
                        <span>Çözülen Test Oranı</span>
                        <span className="text-white font-mono">%{activeDetailData.resourcePercent}</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div 
                          style={{ width: `${activeDetailData.resourcePercent}%` }} 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" 
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850 space-y-2">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Takipteki Kitaplar</div>
                      {activeDetailData.matchedResources.length > 0 ? (
                        <div className="space-y-1">
                          {activeDetailData.matchedResources.slice(0, 2).map(r => (
                            <div key={r.id} className="text-xs flex items-center justify-between">
                              <span className="text-white font-medium truncate max-w-[180px]">{r.bookTitle}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{r.completedUnits}/{r.totalUnits} Test</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Henüz kaynak eklenmedi.</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setDetailSubTab('resources')}
                    className="w-full mt-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <span>Kaynak Detaylarını Gör</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 3: Soru Çözüm Analizi Özet Kartı */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-xl">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-emerald-400">
                        <BarChart2 className="w-5 h-5" />
                        <h3 className="font-extrabold text-white text-base">Soru Analizi</h3>
                      </div>
                      <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        %{activeDetailData.questionAccuracy} Doğruluk
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Toplam Çözülen</div>
                      <div className="text-2xl font-black text-white font-mono mt-0.5">
                        {activeDetailData.totalSolvedQuestions.toLocaleString('tr-TR')}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                        <div className="text-[9.5px] text-emerald-400 font-bold uppercase">Doğru</div>
                        <div className="font-mono font-bold text-white mt-0.5">{activeDetailData.totalCorrectQuestions}</div>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                        <div className="text-[9.5px] text-rose-400 font-bold uppercase">Yanlış</div>
                        <div className="font-mono font-bold text-white mt-0.5">{activeDetailData.totalWrongQuestions}</div>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                        <div className="text-[9.5px] text-amber-400 font-bold uppercase">Boş</div>
                        <div className="font-mono font-bold text-white mt-0.5">{activeDetailData.totalEmptyQuestions}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDetailSubTab('questions')}
                    className="w-full mt-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <span>Soru Takip Kayıtlarını Aç</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 4: Çalışma Süreleri Özet Kartı */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-xl">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-purple-400">
                        <Clock className="w-5 h-5" />
                        <h3 className="font-extrabold text-white text-base">Çalışma Süresi</h3>
                      </div>
                      <span className="text-xs font-black text-purple-300 font-mono bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                        {activeDetailData.matchedPlans.length} Oturum
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Toplam Çalışılan Süre</div>
                      <div className="text-2xl font-black text-indigo-400 font-mono mt-0.5">
                        {formatMinutes(activeDetailData.totalStudyMinutes)}
                      </div>
                      <div className="text-[10.5px] text-slate-400 font-semibold mt-1">
                        ({formatMinutes(Math.round(activeDetailData.totalStudyMinutes / activeDetailData.activeDaysCount))}/gün)
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                      Haftalık programa eklenmiş ve tamamlanmış çalışma zamanlarının özeti.
                    </p>
                  </div>

                  <button
                    onClick={() => setDetailSubTab('study')}
                    className="w-full mt-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <span>Çalışma Oturumlarını İncele</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 5: Deneme Sınavları Özet Kartı (Branş & Genel) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-xl">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-amber-400">
                        <Target className="w-5 h-5" />
                        <h3 className="font-extrabold text-white text-base">Deneme Sınavları</h3>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-black text-amber-300 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          {activeDetailData.branchExamCount} Branş
                        </span>
                        <span className="text-[10px] font-black text-indigo-300 font-mono bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                          {activeDetailData.generalExamCount} Genel
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-850">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Branş Ort. Net</div>
                        <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                          {activeDetailData.avgBranchNet} Net
                        </div>
                      </div>
                      <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-850">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Genel Deneme</div>
                        <div className="text-lg font-black text-indigo-400 font-mono mt-0.5">
                          {activeDetailData.generalExamCount} Sınav
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                      Branş ve genel deneme sınavlarında bu derse ait net ve soru dökümü takibi.
                    </p>
                  </div>

                  <button
                    onClick={() => setDetailSubTab('mocks')}
                    className="w-full mt-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <span>Deneme Sonuçlarını Gör</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 6: YouTube & Hata Defteri Özet Kartı */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-rose-500/40 transition-all flex flex-col justify-between shadow-xl">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-rose-400">
                        <Youtube className="w-5 h-5" />
                        <h3 className="font-extrabold text-white text-base">Video & Hatalar</h3>
                      </div>
                      <span className="text-xs font-black text-rose-300 font-mono bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                        {activeDetailData.totalVideos} Video
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">İzlenen Video</div>
                        <div className="text-lg font-black text-rose-400 font-mono mt-0.5">{activeDetailData.watchedVideos} / {activeDetailData.totalVideos}</div>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Hata Kaydı</div>
                        <div className="text-lg font-black text-purple-400 font-mono mt-0.5">{activeDetailData.totalErrors} Kayıt</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                      Konu anlatım videoları ve tekrar edilmesi gereken soru hataları.
                    </p>
                  </div>

                  <button
                    onClick={() => setDetailSubTab('youtube')}
                    className="w-full mt-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <span>Video & Hata Defterini Aç</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* SUB TAB 1: KONU TAMAMLAMALARI (COLLAPSIBLE ACCORDION GROUPS) */}
          {detailSubTab === 'topics' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
              
              {/* Top Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <BookMarked className="w-5 h-5 text-indigo-400" />
                    <span>Müfredat Konu Listesi ve İlerleme Durumu</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bu sayfa bilgilendirme amaçlıdır. Konu durumlarını düzenlemek için Rutinler & Konu Takibi sekmesine geçebilirsiniz.
                  </p>
                </div>

                {/* Search, Status Filter & Navigation Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Konu başlığı ara..."
                      value={topicSearchQuery}
                      onChange={(e) => setTopicSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-8 pr-3 py-1.5 w-36 sm:w-44 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('resources', { subTab: 'topics', subject: activeDetailData.category.title })}
                      className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                      title="Kaynak Takibi Konularım Sekmesine Git"
                    >
                      <span>Konu Takibine Git</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <select
                    value={topicStatusFilter}
                    onChange={(e) => setTopicStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Tüm Durumlar</option>
                    <option value="Uzmanlaştım">Uzmanlaştım</option>
                    <option value="Çalıştım">Çalıştım</option>
                    <option value="Zor Geldi">Zor Geldi</option>
                    <option value="Erteledim">Erteledim</option>
                    <option value="Çalışmadım">Çalışmadım</option>
                  </select>
                </div>
              </div>

              {/* Status & Resource Breakdown Bar with Toggle Switch */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-300 font-bold">Müfredat İlerleme Dağılımı</span>
                    
                    {/* Sliding / Toggle Mode Switch Button */}
                    <div className="inline-flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl space-x-0.5">
                      <button
                        type="button"
                        onClick={() => setCurriculumViewMode('status')}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                          curriculumViewMode === 'status'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        Konu Durumu
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurriculumViewMode('resource')}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                          curriculumViewMode === 'resource'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        Kaynak Çözümü
                      </button>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {curriculumViewMode === 'status' ? (
                      <>{activeDetailData.completedTopicsCount} / {activeDetailData.topics.length} Konu Bitti (<strong className="text-emerald-400 font-bold">%{activeDetailData.topicCompletionPercent}</strong>)</>
                    ) : (
                      <>{resourceTopicStats.totalTopicsSolvedInResources} / {activeDetailData.topics.length} Konu Kaynakta Çözüldü (<strong className="text-indigo-400 font-bold">%{resourceTopicStats.resourceSolvedPercent}</strong>)</>
                    )}
                  </span>
                </div>

                {curriculumViewMode === 'status' ? (
                  <>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${(activeDetailData.masteredCount / activeDetailData.topics.length) * 100}%` }} className="bg-emerald-500 transition-all duration-500" title={`Uzmanlaştım: ${activeDetailData.masteredCount}`} />
                      <div style={{ width: `${(activeDetailData.workedCount / activeDetailData.topics.length) * 100}%` }} className="bg-indigo-500 transition-all duration-500" title={`Çalıştım: ${activeDetailData.workedCount}`} />
                      <div style={{ width: `${(activeDetailData.hardCount / activeDetailData.topics.length) * 100}%` }} className="bg-rose-500 transition-all duration-500" title={`Zor Geldi: ${activeDetailData.hardCount}`} />
                      <div style={{ width: `${(activeDetailData.postponedCount / activeDetailData.topics.length) * 100}%` }} className="bg-amber-500 transition-all duration-500" title={`Erteledim: ${activeDetailData.postponedCount}`} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3.5 text-[11px] pt-1 text-slate-300">
                      <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>Uzmanlaştım ({activeDetailData.masteredCount})</span></span>
                      <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span>Çalıştım ({activeDetailData.workedCount})</span></span>
                      <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span>Zor Geldi ({activeDetailData.hardCount})</span></span>
                      <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>Erteledim ({activeDetailData.postponedCount})</span></span>
                      <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700" /><span>Çalışmadım ({activeDetailData.notStartedCount})</span></span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${(resourceTopicStats.solved3PlusCount / activeDetailData.topics.length) * 100}%` }} className="bg-emerald-500 transition-all duration-500" title={`3+ Kaynakta Çözüldü: ${resourceTopicStats.solved3PlusCount}`} />
                      <div style={{ width: `${(resourceTopicStats.solved2Count / activeDetailData.topics.length) * 100}%` }} className="bg-indigo-500 transition-all duration-500" title={`2 Kaynakta Çözüldü: ${resourceTopicStats.solved2Count}`} />
                      <div style={{ width: `${(resourceTopicStats.solved1Count / activeDetailData.topics.length) * 100}%` }} className="bg-cyan-500 transition-all duration-500" title={`1 Kaynakta Çözüldü: ${resourceTopicStats.solved1Count}`} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3.5 text-[11px] pt-1 text-slate-300">
                      <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>3+ Kaynakta Çözüldü ({resourceTopicStats.solved3PlusCount})</span></span>
                      <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span>2 Kaynakta Çözüldü ({resourceTopicStats.solved2Count})</span></span>
                      <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /><span>1 Kaynakta Çözüldü ({resourceTopicStats.solved1Count})</span></span>
                      <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700" /><span>Henüz Çözülmedi ({resourceTopicStats.solved0Count})</span></span>
                    </div>
                  </>
                )}
              </div>

              {/* Grouped Collapsible Accordions for Topics */}
              <div className="space-y-4">
                {(() => {
                  const groupsPerPage = 5;
                  const totalTopicPages = Math.ceil(activeDetailData.topicGroups.length / groupsPerPage);
                  const currentTopicGroups = activeDetailData.topicGroups.slice((topicPage - 1) * groupsPerPage, topicPage * groupsPerPage);

                  return (
                    <>
                      {currentTopicGroups.map((group) => {
                        const isExpanded = expandedSections[group.keyName] ?? true;
                        
                        // Filter topics inside group
                        const filteredGroupTopics = group.topics.filter(tName => {
                          const matchesSearch = topicSearchQuery === '' || tName.toLowerCase().includes(topicSearchQuery.toLowerCase());
                          if (!matchesSearch) return false;
                          if (topicStatusFilter === 'ALL') return true;
                          const badge = getStatusBadge(tName);
                          return badge.label === topicStatusFilter;
                        });

                        if (filteredGroupTopics.length === 0 && topicSearchQuery !== '') {
                          return null;
                        }

                        const groupCompletedCount = group.topics.filter(t => {
                          const st = topicStatuses[t];
                          return st === 'Uzmanlaştım' || st === 'Çalıştım' || completedPastTopics.includes(t);
                        }).length;

                        const groupExamFilter: 'TYT' | 'AYT' | 'TÜMÜ' = isTYTKey(group.keyName)
                          ? 'TYT'
                          : isAYTKey(group.keyName)
                          ? 'AYT'
                          : (detailExamFilter !== 'TÜMÜ' ? detailExamFilter : 'TÜMÜ');

                        const groupRelevantResources = activeDetailData.matchedResources.filter(r => matchesExamScope(r, groupExamFilter));

                        return (
                          <div key={group.keyName} className="border border-slate-800 rounded-2xl bg-slate-950/70 overflow-hidden">
                            {/* Accordion Header */}
                            <button
                              onClick={() => toggleSection(group.keyName)}
                              className="w-full flex items-center justify-between p-4 bg-slate-900/80 hover:bg-slate-850 transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center space-x-3">
                                <Layers className="w-4 h-4 text-indigo-400" />
                                <h4 className="text-sm font-bold text-white">{group.keyName}</h4>
                                <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2.5 py-0.5 rounded-full">
                                  {groupCompletedCount} / {group.topics.length} Tamamlandı
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 text-slate-400">
                                <span className="text-xs font-semibold">{isExpanded ? 'Gizle' : 'Göster'}</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>

                            {/* Accordion Content */}
                            {isExpanded && (
                              <div className="p-3 border-t border-slate-850 space-y-2">
                                <div className="flex flex-col space-y-2">
                                  {filteredGroupTopics.map((topicName, idx) => {
                                    const badge = getStatusBadge(topicName);
                                    const resourceCount = groupRelevantResources.length;
                                    const solvedInResources = groupRelevantResources.filter(r => (r.completedTopics || []).includes(topicName)).length;
                                    const resourceProgressPercent = resourceCount > 0 ? Math.round((solvedInResources / resourceCount) * 100) : 0;

                                    return (
                                      <div 
                                        key={idx} 
                                        className="bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800/80 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 transition-all"
                                      >
                                        <div className="flex items-center space-x-3 min-w-0">
                                          <span className="text-xs font-mono text-slate-500 w-5 text-right font-bold shrink-0">{idx + 1}.</span>
                                          <span className="text-xs sm:text-sm font-semibold text-white truncate">{topicName}</span>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                                          {/* Status Badge */}
                                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                                            {badge.label}
                                          </span>

                                          {/* Resource Solved Progress (Positioned on the far right) */}
                                          <div className="flex items-center space-x-2">
                                            <div className="flex flex-col items-start sm:items-end">
                                              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                                                <strong className="text-indigo-300 font-bold">{solvedInResources}</strong> / {resourceCount} Kaynakta Çözüldü
                                              </span>
                                              <div className="w-20 sm:w-24 h-1.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden mt-0.5">
                                                <div 
                                                  className={`h-full transition-all rounded-full ${solvedInResources === resourceCount && resourceCount > 0 ? 'bg-emerald-400' : 'bg-indigo-500'}`} 
                                                  style={{ width: `${resourceProgressPercent}%` }} 
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <PaginationControls
                        currentPage={topicPage}
                        totalPages={totalTopicPages}
                        onPageChange={setTopicPage}
                      />
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* SUB TAB 2: KAYNAKLARIM */}
          {detailSubTab === 'resources' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    <span>Ders Kaynakları ve Kitap İlerlemeleri</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bu derse ait soru bankaları ve test kitaplarının ünite tamamlama takibi
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('resources')}
                    className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <span>Kaynak Yönetimi</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {activeDetailData.matchedResources.length > 0 ? (
                (() => {
                  const resPerPage = 6;
                  const totalResPages = Math.ceil(activeDetailData.matchedResources.length / resPerPage);
                  const paginatedResources = activeDetailData.matchedResources.slice((resourcePage - 1) * resPerPage, resourcePage * resPerPage);

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedResources.map((res) => {
                          const percent = res.totalUnits > 0 ? Math.round((res.completedUnits / res.totalUnits) * 100) : 0;
                          return (
                            <div key={res.id} className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{res.publisher}</span>
                                  <h4 className="text-sm font-bold text-white">{res.bookTitle}</h4>
                                </div>
                                <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                                  {res.examType}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-slate-400">
                                  <span>Çözülen Test / Ünite</span>
                                  <span className="font-bold text-white">{res.completedUnits} / {res.totalUnits} (%{percent})</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div style={{ width: `${percent}%` }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                                </div>
                              </div>
                              {res.notes && (
                                <p className="text-xs text-slate-400 italic bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                                  "{res.notes}"
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <PaginationControls
                        currentPage={resourcePage}
                        totalPages={totalResPages}
                        onPageChange={setResourcePage}
                      />
                    </>
                  );
                })()
              ) : (
                <div className="text-center py-10 bg-slate-950/50 rounded-2xl border border-slate-850">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 italic">Bu ders için eklenmiş bir kaynak bulunmuyor.</p>
                </div>
              )}
            </div>
          )}

          {/* SUB TAB 3: SORU TAKİBİ */}
          {detailSubTab === 'questions' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <BarChart2 className="w-5 h-5 text-emerald-400" />
                    <span>Soru Çözüm Analizi ve Kayıtlar</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bu derste girilen soru çözümleri ve doğruluk performansı
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('questions')}
                    className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <span>Soru Girişi Yap</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Accuracy KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Toplam Soru</div>
                  <div className="text-xl font-black text-white font-mono mt-1">{activeDetailData.totalSolvedQuestions}</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Doğru</div>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-1">{activeDetailData.totalCorrectQuestions}</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Yanlış</div>
                  <div className="text-xl font-black text-rose-400 font-mono mt-1">{activeDetailData.totalWrongQuestions}</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Boş</div>
                  <div className="text-xl font-black text-amber-400 font-mono mt-1">{activeDetailData.totalEmptyQuestions}</div>
                </div>
              </div>

              {/* Recent Question Logs Table */}
              {activeDetailData.matchedLogs.length > 0 ? (
                (() => {
                  const logsPerPage = 8;
                  const totalLogPages = Math.ceil(activeDetailData.matchedLogs.length / logsPerPage);
                  const paginatedLogs = activeDetailData.matchedLogs.slice((questionPage - 1) * logsPerPage, questionPage * logsPerPage);

                  return (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                            <tr>
                              <th className="p-3 rounded-l-xl">Tarih</th>
                              <th className="p-3">Sınav Tipi</th>
                              <th className="p-3">Çözülen</th>
                              <th className="p-3">Doğru</th>
                              <th className="p-3">Yanlış</th>
                              <th className="p-3">Boş</th>
                              <th className="p-3 rounded-r-xl">Net</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {paginatedLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-950/40 transition-colors">
                                <td className="p-3 font-semibold text-white">{log.date}</td>
                                <td className="p-3">
                                  <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {log.examType}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-bold text-white">{log.solvedCount}</td>
                                <td className="p-3 font-mono text-emerald-400 font-bold">{log.correctCount}</td>
                                <td className="p-3 font-mono text-rose-400 font-bold">{log.wrongCount}</td>
                                <td className="p-3 font-mono text-amber-400 font-bold">{log.emptyCount}</td>
                                <td className="p-3 font-mono text-indigo-400 font-extrabold">{log.netScore} Net</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <PaginationControls
                        currentPage={questionPage}
                        totalPages={totalLogPages}
                        onPageChange={setQuestionPage}
                      />
                    </>
                  );
                })()
              ) : (
                <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-slate-850 text-xs text-slate-400 italic">
                  Bu ders için henüz soru çözümü kaydedilmedi.
                </div>
              )}
            </div>
          )}

          {/* SUB TAB 4: ÇALIŞMA SÜRELERİ */}
          {detailSubTab === 'study' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <span>Ders Çalışma Süreleri ve Program Oturumları</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Çalışma programı, branş denemeleri ve izlenen video derslerin toplam süre dökümü
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('planner')}
                    className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <span>Çalışma Planı</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Study Time Source Breakdown */}
              {(() => {
                const planMins = activeDetailData.matchedPlans.reduce((acc, p) => {
                  if ((p.completedMinutes || 0) > 0) return acc + p.completedMinutes;
                  if (p.status === 'completed') return acc + (p.plannedMinutes || 0);
                  return acc;
                }, 0);

                const examMins = activeDetailData.matchedBranchExams.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);

                const videoMins = activeDetailData.matchedVideos.reduce((acc, v) => {
                  if (!v.isWatched) return acc;
                  if ((v.durationMinutes || 0) > 0) return acc + v.durationMinutes!;
                  if (v.playlistVideos && v.playlistVideos.length > 0) {
                    return acc + v.playlistVideos.filter(pv => pv.isWatched).reduce((sum, pv) => sum + (pv.durationMinutes || 0), 0);
                  }
                  return acc + 30;
                }, 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Program Çalışması</div>
                      <div className="text-lg font-black text-indigo-400 font-mono mt-1">{formatMinutes(planMins)}</div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Branş Denemeleri</div>
                      <div className="text-lg font-black text-amber-400 font-mono mt-1">{formatMinutes(examMins)}</div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Video Dersler</div>
                      <div className="text-lg font-black text-rose-400 font-mono mt-1">{formatMinutes(videoMins)}</div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 text-center">
                      <div className="text-[10px] text-indigo-300 font-bold uppercase">Toplam Süre</div>
                      <div className="text-lg font-black text-emerald-400 font-mono mt-1">{formatMinutes(activeDetailData.totalStudyMinutes)}</div>
                    </div>
                  </div>
                );
              })()}

              {activeDetailData.matchedPlans.length > 0 ? (
                (() => {
                  const plansPerPage = 8;
                  const totalPlanPages = Math.ceil(activeDetailData.matchedPlans.length / plansPerPage);
                  const paginatedPlans = activeDetailData.matchedPlans.slice((studyPage - 1) * plansPerPage, studyPage * plansPerPage);

                  return (
                    <>
                      <div className="space-y-3">
                        {paginatedPlans.map((plan) => {
                          const displayMins = (plan.completedMinutes || 0) > 0 
                            ? plan.completedMinutes 
                            : (plan.status === 'completed' ? (plan.plannedMinutes || 0) : 0);

                          // Distinct date / day label for the study plan session
                          let dateLabel = plan.day;
                          if (plan.archived && plan.date) {
                            try {
                              const d = new Date(plan.date);
                              if (!isNaN(d.getTime())) {
                                const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                                dateLabel = `${d.getDate()} ${months[d.getMonth()]} (${plan.day})`;
                              }
                            } catch (e) {
                              // fallback
                            }
                          } else if (!plan.archived && plan.date) {
                            // If it's this week, let's still show the day like "Pazartesi" but in a very beautiful way
                            dateLabel = plan.day;
                          }

                          return (
                            <div key={plan.id} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800/80 text-[10px] font-bold text-indigo-300 px-2.5 py-0.5 rounded-lg shrink-0">
                                    <Calendar className="w-3 h-3 text-indigo-400" />
                                    <span>{dateLabel}</span>
                                  </div>
                                  <span className="text-xs font-bold text-slate-100">{plan.topic}</span>
                                  {plan.taskType && (
                                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-semibold">
                                      {plan.taskType}
                                    </span>
                                  )}
                                </div>
                                {plan.notes && <p className="text-[11px] text-slate-400 mt-0.5 italic">"{plan.notes}"</p>}
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold font-mono text-emerald-400">
                                  {displayMins} / {plan.plannedMinutes || 0} dk
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                  plan.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {plan.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <PaginationControls
                        currentPage={studyPage}
                        totalPages={totalPlanPages}
                        onPageChange={setStudyPage}
                      />
                    </>
                  );
                })()
              ) : (
                <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-slate-850 text-xs text-slate-400 italic">
                  Bu ders için planlanmış çalışma oturumu bulunmuyor.
                </div>
              )}
            </div>
          )}

          {/* SUB TAB 5: DENEMELER (BRANŞ & GENEL) */}
          {detailSubTab === 'mocks' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
              {/* Header & Sub-Tab Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    <span>Deneme Sınavları & Net Performansı</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bu derse özel branş denemeleri ve genel deneme sınavı soru dökümleri
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Toggle Pills */}
                  <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setMockTypeTab('all')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        mockTypeTab === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tümü ({activeDetailData.branchExamCount + activeDetailData.generalExamCount})
                    </button>

                    <button
                      onClick={() => setMockTypeTab('branch')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        mockTypeTab === 'branch'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Branş ({activeDetailData.branchExamCount})
                    </button>

                    <button
                      onClick={() => setMockTypeTab('general')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        mockTypeTab === 'general'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Genel Denemeler ({activeDetailData.generalExamCount})
                    </button>
                  </div>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('branches')}
                      className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                      title="Denemeler Sekmesine Git"
                    >
                      <span>Denemeler Modülü</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION 1: BRANŞ DENEMELERİ */}
              {(mockTypeTab === 'all' || mockTypeTab === 'branch') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center space-x-1.5">
                      <Target className="w-4 h-4" />
                      <span>Branş Denemesi Kayıtları ({activeDetailData.matchedBranchExams.length})</span>
                    </h4>
                  </div>

                  {activeDetailData.matchedBranchExams.length > 0 ? (
                    (() => {
                      const examsPerPage = 5;
                      const totalExamPages = Math.ceil(activeDetailData.matchedBranchExams.length / examsPerPage);
                      const paginatedExams = activeDetailData.matchedBranchExams.slice((mockPage - 1) * examsPerPage, mockPage * examsPerPage);

                      return (
                        <>
                          <div className="overflow-x-auto rounded-2xl border border-slate-800">
                            <table className="w-full text-left text-xs text-slate-300">
                              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                                <tr>
                                  <th className="p-3">Tarih</th>
                                  <th className="p-3">Yayın</th>
                                  <th className="p-3">Süre</th>
                                  <th className="p-3">Doğru</th>
                                  <th className="p-3">Yanlış</th>
                                  <th className="p-3">Boş</th>
                                  <th className="p-3">Net</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850 bg-slate-950/40">
                                {paginatedExams.map((exam) => (
                                  <tr key={exam.id} className="hover:bg-slate-900/60 transition-colors">
                                    <td className="p-3 font-semibold text-white">{exam.date}</td>
                                    <td className="p-3 text-amber-300 font-medium">{exam.publisher}</td>
                                    <td className="p-3 font-mono text-slate-400">{exam.durationMinutes || 0} dk</td>
                                    <td className="p-3 font-mono text-emerald-400 font-bold">{exam.correct}</td>
                                    <td className="p-3 font-mono text-rose-400 font-bold">{exam.wrong}</td>
                                    <td className="p-3 font-mono text-amber-400 font-bold">{exam.empty}</td>
                                    <td className="p-3 font-mono text-amber-400 font-black">{exam.net} Net</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {totalExamPages > 1 && (
                            <PaginationControls
                              currentPage={mockPage}
                              totalPages={totalExamPages}
                              onPageChange={setMockPage}
                            />
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-center py-6 bg-slate-950/50 rounded-2xl border border-slate-850 text-xs text-slate-400 italic">
                      Bu ders için henüz branş denemesi kaydedilmedi.
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 2: GENEL DENEMELER */}
              {(mockTypeTab === 'all' || mockTypeTab === 'general') && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center space-x-1.5">
                      <BarChart2 className="w-4 h-4" />
                      <span>Genel Deneme Sınavları ({activeDetailData.matchedGeneralMocks.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Genel deneme kartındaki "Soru Detayları" ile o derse ait soru ve konu analizini inceleyin
                    </span>
                  </div>

                  {activeDetailData.matchedGeneralMocks.length > 0 ? (
                    (() => {
                      const generalMocksPerPage = 5;
                      const totalGeneralPages = Math.ceil(activeDetailData.matchedGeneralMocks.length / generalMocksPerPage);
                      const paginatedGeneralMocks = activeDetailData.matchedGeneralMocks.slice((generalMockPage - 1) * generalMocksPerPage, generalMockPage * generalMocksPerPage);

                      return (
                        <>
                          <div className="space-y-3">
                            {paginatedGeneralMocks.map((mock) => {
                              const summary = getSubjectGeneralMockSummary(
                                mock, 
                                activeDetailData.category, 
                                activeDetailData.matchedLogs, 
                                activeDetailData.matchedErrors
                              );

                              const isExpanded = Boolean(expandedMockIds[mock.id]);

                              return (
                                <div 
                                  key={mock.id} 
                                  className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 transition-all space-y-3"
                                >
                                  {/* Card Header */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs shrink-0">
                                        TG
                                      </div>
                                      <div>
                                        <div className="flex items-center space-x-2 flex-wrap">
                                          <h5 className="text-sm font-bold text-white">{mock.title}</h5>
                                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                                            {mock.date}
                                          </span>
                                          {mock.estimatedRank && (
                                            <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-bold font-mono">
                                              Sıralama: #{mock.estimatedRank}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                          {summary.subjectLabel} • Genel Toplam Net: <strong className="text-indigo-300 font-mono">TYT: {mock.tyt?.totalNet || 0}</strong> | <strong className="text-purple-300 font-mono">AYT: {mock.ayt?.totalNet || 0}</strong>
                                        </p>
                                      </div>
                                    </div>

                                    {/* Subject Net Highlight Pills */}
                                    <div className="flex items-center gap-2 self-start sm:self-center">
                                      {summary.tytNet !== null && (
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-center">
                                          <span className="text-[9px] uppercase font-bold text-indigo-400 block">{summary.tytLabel}</span>
                                          <span className="text-xs font-black font-mono text-indigo-300">{summary.tytNet} Net</span>
                                        </div>
                                      )}

                                      {summary.aytNet !== null && (
                                        <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl text-center">
                                          <span className="text-[9px] uppercase font-bold text-purple-400 block">{summary.aytLabel}</span>
                                          <span className="text-xs font-black font-mono text-purple-300">{summary.aytNet} Net</span>
                                        </div>
                                      )}

                                      <button
                                        onClick={() => setExpandedMockIds(prev => ({ ...prev, [mock.id]: !prev[mock.id] }))}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ml-1"
                                      >
                                        <span className="text-[11px]">
                                          {isExpanded ? 'Gizle' : 'Deneme Detayları'}
                                        </span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Expandable Question & Full Exam Details Section */}
                                  {isExpanded && (
                                    <div className="pt-3 border-t border-slate-850 space-y-3">
                                      {/* Full Exam Net Breakdown Table */}
                                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                          <span className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                                            <BarChart2 className="w-4 h-4 text-indigo-400" />
                                            <span>Sınav Genel Net Dağılımı (Tüm Testler)</span>
                                          </span>
                                          <span className="text-[11px] font-mono text-slate-400 font-bold">
                                            Genel Toplam: <strong className="text-indigo-300">{(mock.tyt?.totalNet || 0) + (mock.ayt?.totalNet || 0)} Net</strong>
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                          {/* TYT Breakdown */}
                                          <div className="bg-slate-900/80 p-3 rounded-xl border border-indigo-500/20 space-y-2">
                                            <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                                              <span className="font-extrabold text-indigo-300 text-xs">TYT Netleri</span>
                                              <span className="font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[11px]">
                                                Toplam: {mock.tyt?.totalNet || 0} Net
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center text-[11px]">
                                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                                <span className="text-[9px] text-slate-400 block font-sans">Türkçe</span>
                                                <span className="font-bold text-white">{mock.tyt?.turkce ?? 0}</span>
                                              </div>
                                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                                <span className="text-[9px] text-slate-400 block font-sans">Sosyal</span>
                                                <span className="font-bold text-white">{mock.tyt?.sosyal ?? 0}</span>
                                              </div>
                                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                                <span className="text-[9px] text-slate-400 block font-sans">Matematik</span>
                                                <span className="font-bold text-white">{mock.tyt?.mat ?? 0}</span>
                                              </div>
                                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                                <span className="text-[9px] text-slate-400 block font-sans">Fen</span>
                                                <span className="font-bold text-white">{mock.tyt?.fen ?? 0}</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* AYT Breakdown */}
                                          <div className="bg-slate-900/80 p-3 rounded-xl border border-purple-500/20 space-y-2">
                                            <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                                              <span className="font-extrabold text-purple-300 text-xs">AYT Netleri</span>
                                              <span className="font-mono font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-[11px]">
                                                Toplam: {mock.ayt?.totalNet || 0} Net
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center text-[11px]">
                                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                                <span className="text-[9px] text-slate-400 block font-sans">Matematik</span>
                                                <span className="font-bold text-white">{mock.ayt?.mat ?? 0}</span>
                                              </div>
                                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                                <span className="text-[9px] text-slate-400 block font-sans">Fen</span>
                                                <span className="font-bold text-white">{mock.ayt?.fen ?? 0}</span>
                                              </div>
                                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                                <span className="text-[9px] text-slate-400 block font-sans">Ed.-Sos1</span>
                                                <span className="font-bold text-white">{mock.ayt?.edebiyatSos1 ?? 0}</span>
                                              </div>
                                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                                <span className="text-[9px] text-slate-400 block font-sans">Sosyal-2</span>
                                                <span className="font-bold text-white">{mock.ayt?.sos2 ?? 0}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Subject Specific Soru ve Konu Analizi */}
                                      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                                            <FileText className="w-4 h-4 text-indigo-400" />
                                            <span>{activeDetailData.category.title} - Soru ve Konu Analizi</span>
                                          </span>
                                          {summary.totalQuestionsFromLogs > 0 && (
                                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded font-bold">
                                              {summary.totalQuestionsFromLogs} Soru Detayı Kayıtlı
                                            </span>
                                          )}
                                        </div>

                                        {/* Question Log Entries for this mock */}
                                        {summary.matchingLogs.length > 0 ? (
                                          <div className="space-y-2">
                                            {summary.matchingLogs.map((log) => (
                                              <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                <div>
                                                  <span className="font-bold text-white">{log.subject}</span>
                                                  {log.notes && (
                                                    <p className="text-[11px] text-slate-400 mt-0.5 italic">"{log.notes}"</p>
                                                  )}
                                                </div>
                                                <div className="flex items-center space-x-3 font-mono text-xs">
                                                  <span className="text-slate-300">Soru: <strong>{log.solvedCount}</strong></span>
                                                  <span className="text-emerald-400">Doğru: <strong>{log.correctCount}</strong></span>
                                                  <span className="text-rose-400">Yanlış: <strong>{log.wrongCount}</strong></span>
                                                  <span className="text-amber-400">Boş: <strong>{log.emptyCount}</strong></span>
                                                  <span className="text-indigo-300 font-black bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                                    {log.netScore} Net
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-850">
                                            <span>
                                              Bu genel deneme sınavında {activeDetailData.category.title} dersi net skorları: 
                                              <strong className="text-indigo-300 font-mono ml-1.5">
                                                {summary.tytNet !== null ? `${summary.tytLabel}: ${summary.tytNet} Net` : ''} 
                                                {summary.aytNet !== null ? ` | ${summary.aytLabel}: ${summary.aytNet} Net` : ''}
                                              </strong>
                                            </span>
                                          </div>
                                        )}

                                        {/* Matching Topic Errors for this exam */}
                                        {summary.matchingErrors.length > 0 && (
                                          <div className="pt-2 border-t border-slate-800 space-y-2">
                                            <span className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
                                              <AlertCircle className="w-4 h-4 text-purple-400" />
                                              <span>Bu Denemeden Kaydedilen Hata Defteri Soru Detayları ({summary.matchingErrors.length}):</span>
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {summary.matchingErrors.map(err => (
                                                <div key={err.id} className="bg-slate-950 p-2.5 rounded-xl border border-purple-500/20 text-xs space-y-1">
                                                  <div className="flex justify-between items-center">
                                                    <span className="font-bold text-white">{err.topicName || err.subject}</span>
                                                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-semibold">
                                                      {errorReasonLabels[err.errorReason] || err.errorReason}
                                                    </span>
                                                  </div>
                                                  {err.solutionNotes && (
                                                    <p className="text-[11px] text-slate-400 italic">Çözüm Notu: {err.solutionNotes}</p>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {mock.notes && (
                                          <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 italic">
                                            Genel Deneme Notu: {mock.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {totalGeneralPages > 1 && (
                            <PaginationControls
                              currentPage={generalMockPage}
                              totalPages={totalGeneralPages}
                              onPageChange={setGeneralMockPage}
                            />
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-center py-6 bg-slate-950/50 rounded-2xl border border-slate-850 text-xs text-slate-400 italic">
                      Henüz kaydedilmiş genel deneme bulunmuyor.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUB TAB 6: YOUTUBE & HATA DEFTERİ */}
          {(detailSubTab === 'youtube' || detailSubTab === 'errors') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* YouTube Videos Panel */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Youtube className="w-5 h-5 text-rose-400" />
                    <span>YouTube Ders Videoları</span>
                  </h3>
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('youtube')}
                      className="text-[11px] text-rose-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Tümü</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {activeDetailData.matchedVideos.length > 0 ? (
                  (() => {
                    const videoPerPage = 5;
                    const totalVidPages = Math.ceil(activeDetailData.matchedVideos.length / videoPerPage);
                    const paginatedVideos = activeDetailData.matchedVideos.slice((videoPage - 1) * videoPerPage, videoPage * videoPerPage);

                    return (
                      <>
                        <div className="space-y-2.5">
                          {paginatedVideos.map((vid) => {
                            const isPlaylist = Boolean((vid.playlistVideos && vid.playlistVideos.length > 0) || vid.isPlaylist);
                            const playlistTotal = vid.playlistVideos ? vid.playlistVideos.length : 0;
                            const playlistWatched = vid.playlistVideos 
                              ? vid.playlistVideos.filter(pv => pv.isWatched).length 
                              : (vid.isWatched ? 1 : 0);
                            const percent = isPlaylist && playlistTotal > 0 
                              ? Math.round((playlistWatched / playlistTotal) * 100) 
                              : (vid.isWatched ? 100 : 0);
                            const isFullyWatched = isPlaylist && playlistTotal > 0 
                              ? (playlistWatched === playlistTotal) 
                              : vid.isWatched;

                            return (
                              <div key={vid.id} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[10px] text-rose-400 font-bold uppercase">{vid.channelName}</span>
                                      {isPlaylist && (
                                        <span className="text-[9px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">
                                          Oynatma Listesi
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-xs font-semibold text-white leading-snug">{vid.title || vid.playlistTitle}</h4>
                                  </div>

                                  <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold shrink-0 ${
                                    isFullyWatched 
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                      : (playlistWatched > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400')
                                  }`}>
                                    {isFullyWatched 
                                      ? 'Tamamlandı' 
                                      : (isPlaylist && playlistTotal > 0 
                                          ? `${playlistWatched}/${playlistTotal} İzlendi` 
                                          : 'İzlenecek')}
                                  </span>
                                </div>

                                {isPlaylist && playlistTotal > 0 && (
                                  <div className="space-y-1 pt-1.5 border-t border-slate-850">
                                    <div className="flex justify-between items-center text-[10.5px] font-medium text-slate-400">
                                      <span>Oynatma Listesi İlerlemesi</span>
                                      <span className="font-bold font-mono text-slate-200">
                                        {playlistWatched} / {playlistTotal} Video (%{percent})
                                      </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                                      <div 
                                        style={{ width: `${percent}%` }} 
                                        className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-300" 
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <PaginationControls
                          currentPage={videoPage}
                          totalPages={totalVidPages}
                          onPageChange={setVideoPage}
                        />
                      </>
                    );
                  })()
                ) : (
                  <div className="text-center py-8 bg-slate-950/50 rounded-2xl text-xs text-slate-400 italic">
                    Bu derse eklenmiş video ders takibi yok.
                  </div>
                )}
              </div>

              {/* Topic Error Log Panel */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-purple-400" />
                    <span>Hata Defteri Kayıtları</span>
                  </h3>
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('errors')}
                      className="text-[11px] text-purple-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Tümü</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {activeDetailData.matchedErrors.length > 0 ? (
                  (() => {
                    const errPerPage = 5;
                    const totalErrPages = Math.ceil(activeDetailData.matchedErrors.length / errPerPage);
                    const paginatedErrors = activeDetailData.matchedErrors.slice((errorPage - 1) * errPerPage, errorPage * errPerPage);

                    return (
                      <>
                        <div className="space-y-3">
                          {paginatedErrors.map((err) => (
                            <div key={err.id} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-white">{err.topicName || err.subject || 'Konu Belirtilmedi'}</span>
                                    {err.examType && (
                                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded font-semibold">
                                        {err.examType}
                                      </span>
                                    )}
                                    {err.imageUrl && (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImageUrl(err.imageUrl!)}
                                        className="p-1 text-purple-300 bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 rounded-lg transition-all cursor-pointer hover:scale-105"
                                        title="Soru Görselini Tam Ekran İncele"
                                      >
                                        <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                                      </button>
                                    )}
                                  </div>
                                  {err.publisher && (
                                    <div className="text-[10px] font-semibold text-purple-400 mt-0.5">Yayın / Kaynak: {err.publisher}</div>
                                  )}
                                </div>
                                <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold shrink-0 ${
                                  err.revised ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}>
                                  {err.revised ? 'Tekrar Edildi' : 'Tekrar Bekliyor'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                {err.date && <span className="text-slate-400 font-medium">Tarih: {err.date}</span>}
                                {err.errorReason && (
                                  <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-semibold">
                                    Neden: {errorReasonLabels[err.errorReason] || err.errorReason}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <PaginationControls
                          currentPage={errorPage}
                          totalPages={totalErrPages}
                          onPageChange={setErrorPage}
                        />
                      </>
                    );
                  })()
                ) : (
                  <div className="text-center py-8 bg-slate-950/50 rounded-2xl text-xs text-slate-400 italic">
                    Bu derse eklenmiş hata kaydı yok.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      ) : (

        /* SECTION 2: MAIN GRID VIEW FOR ALL SUBJECTS */
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Banner */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Ders İlerleme & İnceleme Paneli</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Ders İlerlemelerim
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
                  YKS müfredatındaki derslerinizin konu tamamlama oranları, çözülen soru sayıları, çalışma süreleri ve deneme performanslarının bütüncül özeti.
                </p>
              </div>

              {/* Overall Progress Stat Card */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center space-x-4 shrink-0">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Genel Müfredat</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">%{globalCurriculumStats.percent}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{globalCurriculumStats.totalCompleted} / {globalCurriculumStats.totalTopics} Konu</div>
                </div>
                <div className="w-14 h-14 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-slate-800" fill="transparent" />
                    <circle 
                      cx="28" 
                      cy="28" 
                      r="22" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      className="text-emerald-400 transition-all duration-1000" 
                      fill="transparent"
                      strokeDasharray={138}
                      strokeDashoffset={138 - (138 * globalCurriculumStats.percent) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <BookOpen className="w-4 h-4 text-emerald-400 absolute" />
                </div>
              </div>
            </div>

            {/* Landing Time Range Selector Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 relative z-10">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Özet Bilgi Zaman Aralığı:</span>
              </div>
              <div className="inline-flex items-center p-1 bg-slate-950/90 border border-slate-800 rounded-2xl space-x-1 shadow-inner">
                {[
                  { id: 'haftalik', label: 'Haftalık (Son 7 Gün)' },
                  { id: 'aylik', label: 'Aylık (Son 30 Gün)' },
                  { id: 'tumu', label: 'Tüm Zamanlar' }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setLandingTimeRange(r.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      landingTimeRange === r.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Global Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">Müfredat Tamamlama</div>
              <div className="grid grid-cols-2 gap-3 divide-x divide-slate-800">
                <div>
                  <div className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">TYT</div>
                  <div className="text-base font-black text-white font-mono mt-0.5">%{globalCurriculumStats.tytPercent}</div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      style={{ width: `${globalCurriculumStats.tytPercent}%` }}
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1.5">{globalCurriculumStats.totalTytCompleted}/{globalCurriculumStats.totalTytTopics} Konu</div>
                </div>
                <div className="pl-3">
                  <div className="text-[9px] text-pink-400 font-bold uppercase tracking-wider">AYT</div>
                  <div className="text-base font-black text-white font-mono mt-0.5">%{globalCurriculumStats.aytPercent}</div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      style={{ width: `${globalCurriculumStats.aytPercent}%` }}
                      className="h-full bg-pink-500 rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1.5">{globalCurriculumStats.totalAytCompleted}/{globalCurriculumStats.totalAytTopics} Konu</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                {landingTimeRange === 'haftalik' ? 'Soru (Son 7 Gün)' : landingTimeRange === 'aylik' ? 'Soru (Son 30 Gün)' : 'Toplam Soru (Tümü)'}
              </div>
              <div className="text-xl font-black text-indigo-400 font-mono mt-1">{globalCurriculumStats.totalQuestions.toLocaleString('tr-TR')}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Soru Kaydı</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  {landingTimeRange === 'haftalik' ? 'Çalışma (Son 7 Gün)' : landingTimeRange === 'aylik' ? 'Çalışma (Son 30 Gün)' : 'Toplam Çalışma (Tümü)'}
                </div>
                <div className="text-xl font-black text-cyan-400 font-mono mt-1">{formatMinutes(globalCurriculumStats.totalStudyMins)}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Tamamlanan Süre</div>
              </div>
              <div className="text-[10.5px] text-emerald-400 font-bold border-t border-slate-800/60 pt-1.5 mt-1.5">
                Günlük Ort: {formatMinutes(dailyAvgMins)}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Kayıtlı Kaynak</div>
              <div className="text-xl font-black text-amber-400 font-mono mt-1">{globalCurriculumStats.totalResources} Kitap</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Takip Listesinde</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              {/* Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                {[
                  { id: 'ALANIM', label: `⭐ Alanım (${getFieldTitle(targetField)})` },
                  { id: 'ALL', label: 'Tüm Dersler' },
                  { id: 'Sayısal', label: 'Sayısal' },
                  { id: 'Eşit Ağırlık', label: 'Eşit Ağırlık' },
                  { id: 'Sözel', label: 'Sözel' },
                  { id: 'DİL', label: 'Yabancı Dil' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedGroupFilter(f.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                      selectedGroupFilter === f.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Field Banner */}
            {selectedGroupFilter === 'ALANIM' && (
              <div className="bg-indigo-950/40 border border-indigo-500/30 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs text-indigo-200 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    Profilindeki alan hedefine <strong>({getFieldTitle(targetField)})</strong> özel alan derslerin gösteriliyor.
                  </span>
                </div>
                <button
                  onClick={() => setSelectedGroupFilter('ALL')}
                  className="text-[11px] font-bold text-indigo-300 hover:text-white underline cursor-pointer shrink-0 ml-2 text-nowrap"
                >
                  Tüm Dersleri Gör
                </button>
              </div>
            )}
          </div>

          {/* Subject Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCategoryStats.map(stat => {
              const cat = stat.category;
              const Icon = cat.icon;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedSubjectId(cat.id);
                    setDetailSubTab('overview'); // Set default to user-friendly overview tab!
                  }}
                  className={`bg-slate-900/90 hover:bg-slate-900 border ${cat.borderColor} hover:border-indigo-500/50 rounded-3xl p-5 shadow-xl transition-all hover:scale-[1.01] cursor-pointer space-y-4 group relative overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${cat.gradient} opacity-5 group-hover:opacity-10 rounded-full blur-2xl transition-opacity pointer-events-none`} />

                  {/* Top Bar: Icon + Subject Info */}
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                          {cat.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{cat.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Genel Müfredat</span>
                      <span className="font-black text-emerald-400 font-mono text-sm">%{stat.topicCompletionPercent}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div 
                        style={{ width: `${stat.topicCompletionPercent}%` }}
                        className={`h-full rounded-full bg-gradient-to-r ${cat.gradient} transition-all duration-700`} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>{stat.completedTopicsCount} / {stat.topics.length} Toplam Konu</span>
                      {stat.masteredCount > 0 && <span className="text-emerald-400 font-semibold">{stat.masteredCount} Uzman</span>}
                    </div>

                    {/* Separate TYT & AYT Progress Sub-cards */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {stat.tytTopics.length > 0 && (
                        <div className="bg-slate-950/80 border border-blue-500/25 rounded-xl p-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-blue-400 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                              <span>TYT</span>
                            </span>
                            <span className="font-mono font-bold text-white">%{stat.tytCompletionPercent}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${stat.tytCompletionPercent}%` }}
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            />
                          </div>
                          <div className="text-[9px] text-slate-400 text-right font-mono">
                            {stat.tytCompletedTopicsCount}/{stat.tytTopics.length} Konu
                          </div>
                        </div>
                      )}

                      {stat.aytTopics.length > 0 && (
                        <div className="bg-slate-950/80 border border-purple-500/25 rounded-xl p-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-purple-400 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                              <span>AYT</span>
                            </span>
                            <span className="font-mono font-bold text-white">%{stat.aytCompletionPercent}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${stat.aytCompletionPercent}%` }}
                              className="h-full bg-purple-500 rounded-full transition-all duration-500"
                            />
                          </div>
                          <div className="text-[9px] text-slate-400 text-right font-mono">
                            {stat.aytCompletedTopicsCount}/{stat.aytTopics.length} Konu
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Summary Pill Badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-850 relative z-10">
                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-850">
                      <div className="text-[9.5px] text-slate-400 font-semibold">Çözülen Soru</div>
                      <div className="font-bold text-white font-mono">{stat.totalSolvedQuestions} Soru</div>
                    </div>

                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-850">
                      <div className="text-[9.5px] text-slate-400 font-semibold">Çalışma Süresi</div>
                      <div className="font-bold text-indigo-400 font-mono">
                        {formatMinutes(stat.totalStudyMinutes)}
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          ({formatMinutes(Math.round(stat.totalStudyMinutes / stat.activeDaysCount))}/gün)
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-850">
                      <div className="text-[9.5px] text-slate-400 font-semibold">Kaynak Kitap</div>
                      <div className="font-bold text-cyan-400 font-mono">{stat.matchedResources.length} Kitap</div>
                    </div>

                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-850">
                      <div className="text-[9.5px] text-slate-400 font-semibold">Branş Denemesi</div>
                      <div className="font-bold text-amber-400 font-mono">{stat.branchExamCount} Deneme</div>
                    </div>
                  </div>

                  {/* Bottom Action CTA */}
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300 pt-1 relative z-10">
                    <span>Ayrıntılı Ders Özeti</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCategoryStats.length === 0 && (
            <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
              <Search className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Aramanıza Uygun Ders Bulunamadı</h3>
              <p className="text-xs text-slate-400">Filtreleri değiştirmeyi veya farklı bir ders aramayı deneyebilirsiniz.</p>
            </div>
          )}

        </div>
      )}

      {/* IMAGE LIGHTBOX MODAL */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full border border-slate-700 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              Soru Görseli Detayı
            </h3>

            <div className="w-full flex justify-center overflow-auto max-h-[80vh] rounded-2xl bg-slate-900/60 p-2 border border-slate-850">
              <img 
                src={previewImageUrl} 
                alt="Soru Görseli" 
                className="max-h-[75vh] w-auto object-contain rounded-xl border border-slate-800 shadow-xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
