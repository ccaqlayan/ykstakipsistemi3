import React from 'react';
import { LucideIcon } from 'lucide-react';
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
} from '../../types';
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
  Languages
} from 'lucide-react';

export type DetailSubTab = 'overview' | 'topics' | 'resources' | 'questions' | 'study' | 'mocks' | 'youtube' | 'errors';

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

export const errorReasonLabels: Record<string, string> = {
  bilgi_eksigi: 'Bilgi Eksikliği',
  dikkat_hatasi: 'Dikkat Hatası',
  zaman_yetmedi: 'Zaman Yetmedi',
  iki_sik_arasinda: 'İki Şık Arasında Kalma',
  soru_kokunu_yanlis_okuma: 'Soru Kökünü Yanlış Okuma',
};

export function isTYTKey(keyName: string): boolean {
  const k = keyName.toUpperCase();
  return k.startsWith('TYT') || k === 'PROBLEMLER' || k === 'PARAGRAF';
}

export function isAYTKey(keyName: string): boolean {
  const k = keyName.toUpperCase();
  return k.startsWith('AYT');
}

export function isWithinTimeRange(dateStr: string | undefined, range: 'haftalik' | 'aylik' | 'tumu'): boolean {
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

export function matchesExamScope(
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

export function matchesSubjectCategory(itemSubject: string | undefined, category: SubjectCategory): boolean {
  if (!itemSubject) return false;
  const sLower = itemSubject.toLowerCase().trim();
  
  return category.curriculumKeys.some(key => {
    const keyLower = key.toLowerCase().trim();
    if (sLower === keyLower) return true;
    if (sLower.includes(keyLower) || keyLower.includes(sLower)) return true;
    
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

export function getSubjectGeneralMockSummary(
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

export function computeStudyMinutes(plans: StudyPlanItem[], branchExams: BranchExam[], videos: YouTubeVideoItem[]): number {
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
    return acc + 30;
  }, 0);

  return planMins + examMins + videoMins;
}

export interface SubjectProgressViewProps {
  state: YKSDataState;
  onUpdateTopicStatus?: (
    topicName: string, 
    status: 'Çalışmadım' | 'Erteledim' | 'Zor Geldi' | 'Çalıştım' | 'Uzmanlaştım', 
    isManual?: boolean
  ) => void;
  onNavigateTab?: (tab: string, opts?: { subTab?: 'resources' | 'topics'; subject?: string }) => void;
}
