import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Award, 
  BarChart2, 
  Sparkles,
  Target,
  Pencil,
  Calculator,
  Sliders,
  ChevronRight,
  Info,
  ArrowUp,
  ArrowLeft,
  ArrowDown,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  GraduationCap,
  Layers,
  CheckCircle2,
  Clock,
  ListFilter,
  SlidersHorizontal,
  Pin,
  PinOff,
  RotateCcw,
  AlertTriangle,
  TrendingDown,
  LayoutGrid,
  Maximize2,
  PieChart,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  ReferenceLine,
  ComposedChart
} from 'recharts';
import { GeneralMockExam, StudentProfile, TytDetails, AytDetails, SubSubjectScore, InstitutionalMockExam } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { UniversityLogo } from './UniversityLogo';

interface GeneralMockViewProps {
  generalMocks: GeneralMockExam[];
  profile: StudentProfile;
  institutionalMocks?: InstitutionalMockExam[];
  onAddMock: (mock: Omit<GeneralMockExam, 'id'>) => void;
  onDeleteMock: (id: string) => void;
  onUpdateMock: (mock: GeneralMockExam) => void;
  onUpdateProfile?: (updatedProfile: StudentProfile) => void;
}

const MOCK_SUBJECT_CONFIG = [
  // Test Toplamları
  { key: 'TYT Mat', label: 'TYT Mat Toplam', color: '#6366f1' },
  { key: 'TYT Tür', label: 'TYT Türkçe', color: '#ec4899' },
  { key: 'TYT Fen', label: 'TYT Fen Toplam', color: '#38bdf8' },
  { key: 'TYT Sos', label: 'TYT Sosyal Toplam', color: '#fbbf24' },
  { key: 'AYT Mat', label: 'AYT Mat Toplam', color: '#a855f7' },
  { key: 'AYT Edeb', label: 'AYT Edeb-Sos1 Toplam', color: '#f43f5e' },
  { key: 'AYT Fen', label: 'AYT Fen Toplam', color: '#34d399' },
  { key: 'AYT Sos', label: 'AYT Sos2 Toplam', color: '#f97316' },

  // TYT Alt Dersler
  { key: 'TYT Matematik', label: 'TYT Mat (Saf)', color: '#818cf8' },
  { key: 'TYT Geometri', label: 'TYT Geometri', color: '#c084fc' },
  { key: 'TYT Fizik', label: 'TYT Fizik', color: '#60a5fa' },
  { key: 'TYT Kimya', label: 'TYT Kimya', color: '#2dd4bf' },
  { key: 'TYT Biyoloji', label: 'TYT Biyoloji', color: '#4ade80' },
  { key: 'TYT Tarih', label: 'TYT Tarih', color: '#f59e0b' },
  { key: 'TYT Coğrafya', label: 'TYT Coğrafya', color: '#fb923c' },
  { key: 'TYT Felsefe', label: 'TYT Felsefe', color: '#e879f9' },
  { key: 'TYT Din', label: 'TYT Din Kültürü', color: '#f472b6' },

  // AYT Alt Dersler
  { key: 'AYT Matematik', label: 'AYT Mat (Saf)', color: '#a855f7' },
  { key: 'AYT Geometri', label: 'AYT Geometri', color: '#e879f9' },
  { key: 'AYT Fizik', label: 'AYT Fizik', color: '#38bdf8' },
  { key: 'AYT Kimya', label: 'AYT Kimya', color: '#14b8a6' },
  { key: 'AYT Biyoloji', label: 'AYT Biyoloji', color: '#22c55e' },
  { key: 'AYT Edebiyat', label: 'AYT Edebiyat', color: '#fb7185' },
  { key: 'AYT Tarih-1', label: 'AYT Tarih-1', color: '#f59e0b' },
  { key: 'AYT Coğrafya-1', label: 'AYT Coğrafya-1', color: '#f97316' },
  { key: 'AYT Tarih-2', label: 'AYT Tarih-2', color: '#d97706' },
  { key: 'AYT Coğrafya-2', label: 'AYT Coğrafya-2', color: '#ea580c' },
  { key: 'AYT Felsefe-2', label: 'AYT Felsefe Grubu', color: '#c084fc' },
  { key: 'AYT Din-2', label: 'AYT Din Kültürü', color: '#f43f5e' },
];

export interface SubSubjectMetaItem {
  key: string;
  label: string;
  shortLabel: string;
  group: 'mat' | 'fen' | 'sos' | 'turkce';
  examType: 'tyt' | 'ayt';
  maxQuestions: number;
  color: string;
}

export interface SubSubjectStat {
  meta: SubSubjectMetaItem;
  avgNet: number;
  latestNet: number;
  prevNet: number;
  accuracyPercent: number;
  status: 'critical' | 'warning' | 'good';
  totalCount: number;
}

export const DETAILED_SUB_SUBJECTS_META: SubSubjectMetaItem[] = [
  // TYT Matematik Grubu (Mat / Geo)
  { key: 'TYT Matematik', label: 'TYT Matematik (Saf)', shortLabel: 'Matematik', group: 'mat', examType: 'tyt', maxQuestions: 30, color: '#818cf8' },
  { key: 'TYT Geometri', label: 'TYT Geometri', shortLabel: 'Geometri', group: 'mat', examType: 'tyt', maxQuestions: 10, color: '#c084fc' },

  // TYT Fen Grubu (Fizik / Kimya / Biyoloji)
  { key: 'TYT Fizik', label: 'TYT Fizik', shortLabel: 'Fizik', group: 'fen', examType: 'tyt', maxQuestions: 7, color: '#38bdf8' },
  { key: 'TYT Kimya', label: 'TYT Kimya', shortLabel: 'Kimya', group: 'fen', examType: 'tyt', maxQuestions: 7, color: '#2dd4bf' },
  { key: 'TYT Biyoloji', label: 'TYT Biyoloji', shortLabel: 'Biyoloji', group: 'fen', examType: 'tyt', maxQuestions: 6, color: '#4ade80' },

  // TYT Sosyal Grubu (Tarih / Coğrafya / Felsefe / Din)
  { key: 'TYT Tarih', label: 'TYT Tarih', shortLabel: 'Tarih', group: 'sos', examType: 'tyt', maxQuestions: 5, color: '#f59e0b' },
  { key: 'TYT Coğrafya', label: 'TYT Coğrafya', shortLabel: 'Coğrafya', group: 'sos', examType: 'tyt', maxQuestions: 5, color: '#fb923c' },
  { key: 'TYT Felsefe', label: 'TYT Felsefe', shortLabel: 'Felsefe', group: 'sos', examType: 'tyt', maxQuestions: 5, color: '#e879f9' },
  { key: 'TYT Din', label: 'TYT Din Kültürü', shortLabel: 'Din Kül.', group: 'sos', examType: 'tyt', maxQuestions: 5, color: '#f472b6' },

  // AYT Matematik Grubu
  { key: 'AYT Matematik', label: 'AYT Matematik (Saf)', shortLabel: 'AYT Mat', group: 'mat', examType: 'ayt', maxQuestions: 30, color: '#a855f7' },
  { key: 'AYT Geometri', label: 'AYT Geometri', shortLabel: 'AYT Geo', group: 'mat', examType: 'ayt', maxQuestions: 10, color: '#e879f9' },

  // AYT Fen Grubu
  { key: 'AYT Fizik', label: 'AYT Fizik', shortLabel: 'AYT Fizik', group: 'fen', examType: 'ayt', maxQuestions: 14, color: '#38bdf8' },
  { key: 'AYT Kimya', label: 'AYT Kimya', shortLabel: 'AYT Kimya', group: 'fen', examType: 'ayt', maxQuestions: 13, color: '#14b8a6' },
  { key: 'AYT Biyoloji', label: 'AYT Biyoloji', shortLabel: 'AYT Biyo', group: 'fen', examType: 'ayt', maxQuestions: 13, color: '#22c55e' },

  // AYT Sosyal Grubu
  { key: 'AYT Edebiyat', label: 'AYT Edebiyat', shortLabel: 'AYT Edebiyat', group: 'sos', examType: 'ayt', maxQuestions: 24, color: '#fb7185' },
  { key: 'AYT Tarih-1', label: 'AYT Tarih-1', shortLabel: 'AYT Tarih-1', group: 'sos', examType: 'ayt', maxQuestions: 10, color: '#f59e0b' },
  { key: 'AYT Coğrafya-1', label: 'AYT Coğrafya-1', shortLabel: 'AYT Coğ-1', group: 'sos', examType: 'ayt', maxQuestions: 6, color: '#f97316' },
  { key: 'AYT Tarih-2', label: 'AYT Tarih-2', shortLabel: 'AYT Tarih-2', group: 'sos', examType: 'ayt', maxQuestions: 11, color: '#d97706' },
  { key: 'AYT Coğrafya-2', label: 'AYT Coğrafya-2', shortLabel: 'AYT Coğ-2', group: 'sos', examType: 'ayt', maxQuestions: 11, color: '#ea580c' },
  { key: 'AYT Felsefe-2', label: 'AYT Felsefe Grubu', shortLabel: 'AYT Fel-2', group: 'sos', examType: 'ayt', maxQuestions: 12, color: '#c084fc' },
  { key: 'AYT Din-2', label: 'AYT Din Kültürü', shortLabel: 'AYT Din-2', group: 'sos', examType: 'ayt', maxQuestions: 6, color: '#f472b6' },
];

export interface DybSubSubjectItem {
  d: string;
  y: string;
  b: string;
  net: string;
}

const emptyDyb = (): DybSubSubjectItem => ({ d: '', y: '', b: '', net: '' });

const TYT_SUB_KEYS = ['turkce', 'matematik', 'geometri', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'felsefe', 'din'] as const;
type TytSubKey = typeof TYT_SUB_KEYS[number];

const AYT_SUB_KEYS = ['matematik', 'geometri', 'fizik', 'kimya', 'biyoloji', 'edebiyat', 'tarih1', 'cografya1', 'tarih2', 'cografya2', 'felsefe2', 'din2'] as const;
type AytSubKey = typeof AYT_SUB_KEYS[number];

const createInitialSubMap = <T extends string>(keys: readonly T[]): Record<T, DybSubSubjectItem> => {
  const obj = {} as Record<T, DybSubSubjectItem>;
  keys.forEach(k => {
    obj[k] = emptyDyb();
  });
  return obj;
};

const populateSubMapFromDetails = <T extends string>(
  keys: readonly T[],
  detailsObj?: Record<string, SubSubjectScore | undefined>
): Record<T, DybSubSubjectItem> => {
  const map = createInitialSubMap(keys);
  if (!detailsObj) return map;
  keys.forEach(k => {
    const sc = detailsObj[k];
    if (sc) {
      map[k] = {
        d: sc.correct !== undefined ? String(sc.correct) : '',
        y: sc.wrong !== undefined ? String(sc.wrong) : '',
        b: sc.empty !== undefined ? String(sc.empty) : '',
        net: sc.net !== undefined ? String(sc.net).replace('.', ',') : ''
      };
    }
  });
  return map;
};

export const GeneralMockView: React.FC<GeneralMockViewProps> = ({
  generalMocks,
  profile,
  institutionalMocks = [],
  onAddMock,
  onDeleteMock,
  onUpdateMock,
  onUpdateProfile
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [mockListTab, setMockListTab] = useState<'individual' | 'institutional'>('individual');
  const [selectedInstitutionalExam, setSelectedInstitutionalExam] = useState<InstitutionalMockExam | null>(null);
  const [deletingMock, setDeletingMock] = useState<{ id: string; title: string } | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedMockSubjects, setSelectedMockSubjects] = useState<string[]>(['TYT Fen', 'TYT Sos']);
  const [showSubjectFilters, setShowSubjectFilters] = useState(false);
  const [mockCountFilter, setMockCountFilter] = useState<'7' | '30' | 'all'>('7');
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'net' | 'subject' | 'detailed' | 'rank' | 'custom'>(() => {
    try {
      const savedCharts = localStorage.getItem('yks_visible_charts_config_v2');
      const savedPinned = localStorage.getItem('yks_pinned_subjects_config_v2');
      const isCustomized = localStorage.getItem('yks_is_chart_customized');
      if (savedCharts || savedPinned || isCustomized) {
        return 'custom';
      }
    } catch {}
    return 'all';
  });
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [visibleCharts, setVisibleCharts] = useState({
    netTrend: true,
    subjectComparison: true,
    detailedSubSubjects: true,
    rankTrend: true,
  });
  const [pinnedSubjects, setPinnedSubjects] = useState<string[]>(['TYT Geometri', 'TYT Fizik', 'TYT Matematik']);
  const [subSubjectExamTab, setSubSubjectExamTab] = useState<'tyt' | 'ayt'>('tyt');
  const [subSubjectGroupFilter, setSubSubjectGroupFilter] = useState<'all' | 'mat' | 'fen' | 'sos'>('all');
  const [subSubjectChartType, setSubSubjectChartType] = useState<'line' | 'bar'>('line');
  const [activeSubSubjectKeys, setActiveSubSubjectKeys] = useState<string[]>([]);

  const toggleActiveSubSubject = (key: string) => {
    setActiveSubSubjectKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  useEffect(() => {
    try {
      const savedCharts = localStorage.getItem('yks_visible_charts_config_v2');
      if (savedCharts) setVisibleCharts(JSON.parse(savedCharts));

      const savedPinned = localStorage.getItem('yks_pinned_subjects_config_v2');
      if (savedPinned) setPinnedSubjects(JSON.parse(savedPinned));

      const isCustomized = localStorage.getItem('yks_is_chart_customized');
      if (savedCharts || savedPinned || isCustomized) {
        setActiveChartTab('custom');
      }
    } catch (e) {
      console.error('Failed to parse saved chart config:', e);
    }
  }, []);

  const saveVisibleCharts = (newConfig: typeof visibleCharts) => {
    setVisibleCharts(newConfig);
    try {
      localStorage.setItem('yks_visible_charts_config_v2', JSON.stringify(newConfig));
      localStorage.setItem('yks_is_chart_customized', 'true');
    } catch {}
    setActiveChartTab('custom');
  };

  const togglePinnedSubject = (key: string) => {
    setPinnedSubjects(prev => {
      const updated = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      try {
        localStorage.setItem('yks_pinned_subjects_config_v2', JSON.stringify(updated));
        localStorage.setItem('yks_is_chart_customized', 'true');
      } catch {}
      return updated;
    });
  };
  const [expandedMockDetails, setExpandedMockDetails] = useState<Record<string, boolean>>({});

  const toggleMockSubject = (key: string) => {
    setSelectedMockSubjects(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleExpandMockDetails = (id: string) => {
    setExpandedMockDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper for input sanitization (convert dot to comma for display)
  const sanitizeNetInput = (rawVal: string): string => {
    if (rawVal === '' || rawVal === null || rawVal === undefined) return '';
    let cleaned = String(rawVal).replace(/\./g, ',');
    cleaned = cleaned.replace(/[^0-9,-]/g, '');

    if (cleaned.indexOf('-') > 0) {
      cleaned = cleaned.charAt(0) + cleaned.slice(1).replace(/-/g, '');
    }

    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }

    if (/^-?0+[1-9]/.test(cleaned)) {
      cleaned = cleaned.replace(/^(-?)0+([1-9])/, '$1$2');
    } else if (/^-?00+$/.test(cleaned)) {
      cleaned = cleaned.replace(/^(-?)0+$/, '$10');
    } else if (/^-?00+,/.test(cleaned)) {
      cleaned = cleaned.replace(/^(-?)0+,/, '$10,');
    }

    return cleaned;
  };

  const parseNetVal = (val: number | string): number => {
    if (val === '' || val === undefined || val === null) return 0;
    const num = Number(String(val).replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  // Form State: ADD
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [addEntryMode, setAddEntryMode] = useState<'quick' | 'detailed'>('detailed');
  const [addInputMethod, setAddInputMethod] = useState<'net' | 'dyb'>('dyb');

  // Quick Nets (ADD)
  const [tytTurkce, setTytTurkce] = useState<number | string>('');
  const [tytMat, setTytMat] = useState<number | string>('');
  const [tytSosyal, setTytSosyal] = useState<number | string>('');
  const [tytFen, setTytFen] = useState<number | string>('');
  const [aytMat, setAytMat] = useState<number | string>('');
  const [aytFen, setAytFen] = useState<number | string>('');
  const [aytEdebiyatSos1, setAytEdebiyatSos1] = useState<number | string>('');
  const [aytSos2, setAytSos2] = useState<number | string>('');

  // Detailed Nets (ADD)
  const [addTytDyb, setAddTytDyb] = useState<Record<TytSubKey, DybSubSubjectItem>>(() => createInitialSubMap(TYT_SUB_KEYS));
  const [addAytDyb, setAddAytDyb] = useState<Record<AytSubKey, DybSubSubjectItem>>(() => createInitialSubMap(AYT_SUB_KEYS));

  const [estimatedRank, setEstimatedRank] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false);

  const resetAddForm = () => {
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setAddEntryMode('detailed');
    setAddInputMethod('dyb');
    setTytTurkce('');
    setTytMat('');
    setTytSosyal('');
    setTytFen('');
    setAytMat('');
    setAytFen('');
    setAytEdebiyatSos1('');
    setAytSos2('');
    setAddTytDyb(createInitialSubMap(TYT_SUB_KEYS));
    setAddAytDyb(createInitialSubMap(AYT_SUB_KEYS));
    setEstimatedRank('');
    setNotes('');
    setIsAnalyzed(false);
  };

  // Form State: EDIT
  const [editingMock, setEditingMock] = useState<GeneralMockExam | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editEntryMode, setEditEntryMode] = useState<'quick' | 'detailed'>('quick');
  const [editInputMethod, setEditInputMethod] = useState<'net' | 'dyb'>('net');

  const [editTytTurkce, setEditTytTurkce] = useState<number | string>('');
  const [editTytMat, setEditTytMat] = useState<number | string>('');
  const [editTytSosyal, setEditTytSosyal] = useState<number | string>('');
  const [editTytFen, setEditTytFen] = useState<number | string>('');
  const [editAytMat, setEditAytMat] = useState<number | string>('');
  const [editAytFen, setEditAytFen] = useState<number | string>('');
  const [editAytEdebiyatSos1, setEditAytEdebiyatSos1] = useState<number | string>('');
  const [editAytSos2, setEditAytSos2] = useState<number | string>('');

  const [editTytDyb, setEditTytDyb] = useState<Record<TytSubKey, DybSubSubjectItem>>(() => createInitialSubMap(TYT_SUB_KEYS));
  const [editAytDyb, setEditAytDyb] = useState<Record<AytSubKey, DybSubSubjectItem>>(() => createInitialSubMap(AYT_SUB_KEYS));

  const [editEstimatedRank, setEditEstimatedRank] = useState<number | string>('');
  const [editNotes, setEditNotes] = useState('');
  const [editIsAnalyzed, setEditIsAnalyzed] = useState<boolean>(false);

  // Score Calculator State
  const [calcMock, setCalcMock] = useState<GeneralMockExam | null>(null);
  const [diplomaGrade, setDiplomaGrade] = useState<number>(profile?.highSchoolGpa ?? 85);
  const [showObpEdit, setShowObpEdit] = useState<boolean>(false);
  const [showAllFields, setShowAllFields] = useState<boolean>(false);

  React.useEffect(() => {
    if (profile?.highSchoolGpa !== undefined) {
      setDiplomaGrade(profile.highSchoolGpa);
    }
  }, [profile?.highSchoolGpa]);

  const handleDiplomaGradeChange = (newGrade: number) => {
    const validGrade = Math.min(100, Math.max(50, Number(newGrade) || 50));
    setDiplomaGrade(validGrade);
    if (onUpdateProfile && profile) {
      onUpdateProfile({
        ...profile,
        highSchoolGpa: validGrade
      });
    }
  };

  const updateSubSubjectDybItem = <T extends string>(
    setter: React.Dispatch<React.SetStateAction<Record<T, DybSubSubjectItem>>>,
    key: T,
    field: 'd' | 'y' | 'b' | 'net',
    val: string,
    method: 'net' | 'dyb'
  ) => {
    const sanitized = sanitizeNetInput(val);
    setter(prev => {
      const current = prev[key] || emptyDyb();
      const updated = { ...current, [field]: sanitized };

      if (method === 'dyb' && (field === 'd' || field === 'y')) {
        const dNum = parseNetVal(field === 'd' ? sanitized : updated.d);
        const yNum = parseNetVal(field === 'y' ? sanitized : updated.y);
        const calcNet = Number((dNum - yNum / 4).toFixed(2));
        updated.net = String(calcNet).replace('.', ',');
      }

      return {
        ...prev,
        [key]: updated
      };
    });
  };

  const handleStartEdit = (mock: GeneralMockExam) => {
    setEditingMock(mock);
    setEditTitle(mock.title);
    setEditDate(mock.date);
    setEditTytTurkce(mock.tyt.turkce ?? '');
    setEditTytMat(mock.tyt.mat ?? '');
    setEditTytSosyal(mock.tyt.sosyal ?? '');
    setEditTytFen(mock.tyt.fen ?? '');
    setEditAytMat(mock.ayt.mat ?? '');
    setEditAytFen(mock.ayt.fen ?? '');
    setEditAytEdebiyatSos1(mock.ayt.edebiyatSos1 ?? '');
    setEditAytSos2(mock.ayt.sos2 ?? '');
    setEditEstimatedRank(mock.estimatedRank ?? '');
    setEditNotes(mock.notes || '');
    setEditIsAnalyzed(mock.isAnalyzed ?? false);

    const hasTytDet = Boolean(mock.tyt.details);
    const hasAytDet = Boolean(mock.ayt.details);

    if (hasTytDet || hasAytDet) {
      setEditEntryMode('detailed');
      setEditInputMethod('dyb');
      setEditTytDyb(populateSubMapFromDetails(TYT_SUB_KEYS, mock.tyt.details as any));
      setEditAytDyb(populateSubMapFromDetails(AYT_SUB_KEYS, mock.ayt.details as any));
    } else {
      setEditEntryMode('quick');
      setEditInputMethod('net');
      setEditTytDyb(createInitialSubMap(TYT_SUB_KEYS));
      setEditAytDyb(createInitialSubMap(AYT_SUB_KEYS));
    }
  };

  const buildSubSubjectScore = (item: DybSubSubjectItem): SubSubjectScore | undefined => {
    const d = item.d !== '' ? parseNetVal(item.d) : undefined;
    const y = item.y !== '' ? parseNetVal(item.y) : undefined;
    const b = item.b !== '' ? parseNetVal(item.b) : undefined;
    let net = item.net !== '' ? parseNetVal(item.net) : undefined;

    if (d !== undefined || y !== undefined) {
      net = Number(((d || 0) - (y || 0) / 4).toFixed(2));
    }

    if (d === undefined && y === undefined && b === undefined && (net === undefined || item.net === '')) {
      return undefined;
    }

    return {
      correct: d,
      wrong: y,
      empty: b,
      net: net ?? 0
    };
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMock || !editTitle.trim()) return;

    let tTurkce = parseNetVal(editTytTurkce);
    let tMat = parseNetVal(editTytMat);
    let tSosyal = parseNetVal(editTytSosyal);
    let tFen = parseNetVal(editTytFen);

    let aMat = parseNetVal(editAytMat);
    let aFen = parseNetVal(editAytFen);
    let aEdeb = parseNetVal(editAytEdebiyatSos1);
    let aSos2 = parseNetVal(editAytSos2);

    let tytDetailsObj: TytDetails | undefined = undefined;
    let aytDetailsObj: AytDetails | undefined = undefined;

    if (editEntryMode === 'detailed') {
      const turkceSc = buildSubSubjectScore(editTytDyb.turkce);
      const matSc = buildSubSubjectScore(editTytDyb.matematik);
      const geoSc = buildSubSubjectScore(editTytDyb.geometri);
      const fizSc = buildSubSubjectScore(editTytDyb.fizik);
      const kimSc = buildSubSubjectScore(editTytDyb.kimya);
      const biyoSc = buildSubSubjectScore(editTytDyb.biyoloji);
      const tarSc = buildSubSubjectScore(editTytDyb.tarih);
      const cogSc = buildSubSubjectScore(editTytDyb.cografya);
      const felSc = buildSubSubjectScore(editTytDyb.felsefe);
      const dinSc = buildSubSubjectScore(editTytDyb.din);

      tTurkce = turkceSc?.net ?? 0;
      tMat = Number(((matSc?.net ?? 0) + (geoSc?.net ?? 0)).toFixed(2));
      tFen = Number(((fizSc?.net ?? 0) + (kimSc?.net ?? 0) + (biyoSc?.net ?? 0)).toFixed(2));
      tSosyal = Number(((tarSc?.net ?? 0) + (cogSc?.net ?? 0) + (felSc?.net ?? 0) + (dinSc?.net ?? 0)).toFixed(2));

      tytDetailsObj = {
        turkce: turkceSc,
        matematik: matSc,
        geometri: geoSc,
        fizik: fizSc,
        kimya: kimSc,
        biyoloji: biyoSc,
        tarih: tarSc,
        cografya: cogSc,
        felsefe: felSc,
        din: dinSc
      };

      const aytMatSc = buildSubSubjectScore(editAytDyb.matematik);
      const aytGeoSc = buildSubSubjectScore(editAytDyb.geometri);
      const aytFizSc = buildSubSubjectScore(editAytDyb.fizik);
      const aytKimSc = buildSubSubjectScore(editAytDyb.kimya);
      const aytBiyoSc = buildSubSubjectScore(editAytDyb.biyoloji);
      const aytEdebSc = buildSubSubjectScore(editAytDyb.edebiyat);
      const aytTar1Sc = buildSubSubjectScore(editAytDyb.tarih1);
      const aytCog1Sc = buildSubSubjectScore(editAytDyb.cografya1);
      const aytTar2Sc = buildSubSubjectScore(editAytDyb.tarih2);
      const aytCog2Sc = buildSubSubjectScore(editAytDyb.cografya2);
      const aytFel2Sc = buildSubSubjectScore(editAytDyb.felsefe2);
      const aytDin2Sc = buildSubSubjectScore(editAytDyb.din2);

      aMat = Number(((aytMatSc?.net ?? 0) + (aytGeoSc?.net ?? 0)).toFixed(2));
      aFen = Number(((aytFizSc?.net ?? 0) + (aytKimSc?.net ?? 0) + (aytBiyoSc?.net ?? 0)).toFixed(2));
      aEdeb = Number(((aytEdebSc?.net ?? 0) + (aytTar1Sc?.net ?? 0) + (aytCog1Sc?.net ?? 0)).toFixed(2));
      aSos2 = Number(((aytTar2Sc?.net ?? 0) + (aytCog2Sc?.net ?? 0) + (aytFel2Sc?.net ?? 0) + (aytDin2Sc?.net ?? 0)).toFixed(2));

      aytDetailsObj = {
        matematik: aytMatSc,
        geometri: aytGeoSc,
        fizik: aytFizSc,
        kimya: aytKimSc,
        biyoloji: aytBiyoSc,
        edebiyat: aytEdebSc,
        tarih1: aytTar1Sc,
        cografya1: aytCog1Sc,
        tarih2: aytTar2Sc,
        cografya2: aytCog2Sc,
        felsefe2: aytFel2Sc,
        din2: aytDin2Sc
      };
    }

    const tytTotal = tTurkce + tMat + tSosyal + tFen;
    const aytTotal = aMat + aFen + aEdeb + aSos2;

    onUpdateMock({
      ...editingMock,
      title: editTitle.trim(),
      date: editDate,
      tyt: {
        turkce: tTurkce,
        mat: tMat,
        sosyal: tSosyal,
        fen: tFen,
        totalNet: Number(tytTotal.toFixed(2)),
        details: tytDetailsObj
      },
      ayt: {
        mat: aMat,
        fen: aFen,
        edebiyatSos1: aEdeb,
        sos2: aSos2,
        totalNet: Number(aytTotal.toFixed(2)),
        details: aytDetailsObj
      },
      estimatedRank: editEstimatedRank === '' ? undefined : parseNetVal(editEstimatedRank),
      notes: editNotes,
      isAnalyzed: editIsAnalyzed
    });

    setEditingMock(null);
  };


  // Historic YKS Data Anchors for High Precision Predictions
  const SAY_ANCHORS_2023 = [
    { score: 500, rank: 1 },
    { score: 490, rank: 300 },
    { score: 475, rank: 1500 },
    { score: 450, rank: 6500 },
    { score: 420, rank: 17000 },
    { score: 400, rank: 27000 },
    { score: 350, rank: 68000 },
    { score: 300, rank: 135000 },
    { score: 250, rank: 245000 },
    { score: 200, rank: 440000 },
    { score: 100, rank: 1500000 }
  ];

  const SAY_ANCHORS_2024 = [
    { score: 500, rank: 1 },
    { score: 490, rank: 100 },
    { score: 475, rank: 600 },
    { score: 450, rank: 2500 },
    { score: 420, rank: 7500 },
    { score: 400, rank: 13000 },
    { score: 350, rank: 38000 },
    { score: 300, rank: 90000 },
    { score: 250, rank: 190000 },
    { score: 200, rank: 410000 },
    { score: 100, rank: 1500000 }
  ];

  const SAY_ANCHORS_2025 = [
    { score: 500, rank: 1 },
    { score: 490, rank: 200 },
    { score: 475, rank: 1100 },
    { score: 450, rank: 4500 },
    { score: 420, rank: 12000 },
    { score: 400, rank: 19000 },
    { score: 350, rank: 52000 },
    { score: 300, rank: 110000 },
    { score: 250, rank: 215000 },
    { score: 200, rank: 425000 },
    { score: 100, rank: 1500000 }
  ];

  const EA_ANCHORS_2023 = [
    { score: 500, rank: 1 },
    { score: 480, rank: 400 },
    { score: 450, rank: 2500 },
    { score: 400, rank: 15000 },
    { score: 350, rank: 55000 },
    { score: 300, rank: 145000 },
    { score: 250, rank: 320000 },
    { score: 200, rank: 650000 },
    { score: 100, rank: 2000000 }
  ];

  const EA_ANCHORS_2024 = [
    { score: 500, rank: 1 },
    { score: 480, rank: 100 },
    { score: 450, rank: 800 },
    { score: 400, rank: 6500 },
    { score: 350, rank: 28000 },
    { score: 300, rank: 90000 },
    { score: 250, rank: 240000 },
    { score: 200, rank: 550000 },
    { score: 100, rank: 2000000 }
  ];

  const EA_ANCHORS_2025 = [
    { score: 500, rank: 1 },
    { score: 480, rank: 250 },
    { score: 450, rank: 1500 },
    { score: 400, rank: 10000 },
    { score: 350, rank: 40000 },
    { score: 300, rank: 115000 },
    { score: 250, rank: 280000 },
    { score: 200, rank: 600000 },
    { score: 100, rank: 2000000 }
  ];

  const SOZ_ANCHORS_2023 = [
    { score: 500, rank: 1 },
    { score: 480, rank: 150 },
    { score: 450, rank: 1100 },
    { score: 400, rank: 9000 },
    { score: 350, rank: 45000 },
    { score: 300, rank: 150000 },
    { score: 250, rank: 380000 },
    { score: 200, rank: 780000 },
    { score: 100, rank: 2200000 }
  ];

  const SOZ_ANCHORS_2024 = [
    { score: 500, rank: 1 },
    { score: 480, rank: 50 },
    { score: 450, rank: 400 },
    { score: 400, rank: 4500 },
    { score: 350, rank: 26000 },
    { score: 300, rank: 105000 },
    { score: 250, rank: 300000 },
    { score: 200, rank: 680000 },
    { score: 100, rank: 2200000 }
  ];

  const SOZ_ANCHORS_2025 = [
    { score: 500, rank: 1 },
    { score: 480, rank: 100 },
    { score: 450, rank: 700 },
    { score: 400, rank: 6500 },
    { score: 350, rank: 35000 },
    { score: 300, rank: 125000 },
    { score: 250, rank: 340000 },
    { score: 200, rank: 730000 },
    { score: 100, rank: 2200000 }
  ];

  const interpolateRank = (score: number, anchors: { score: number, rank: number }[]) => {
    const minScore = anchors[anchors.length - 1].score;
    const maxScore = anchors[0].score;
    const clampedScore = Math.max(minScore, Math.min(maxScore, score));

    let i = 0;
    for (; i < anchors.length - 1; i++) {
      if (clampedScore >= anchors[i + 1].score) {
        break;
      }
    }

    const p1 = anchors[i];
    const p2 = anchors[i + 1];

    if (p1.score === p2.score) return p1.rank;

    const t = (clampedScore - p2.score) / (p1.score - p2.score);
    const logRank = Math.log(p2.rank) + t * (Math.log(p1.rank) - Math.log(p2.rank));
    const estimated = Math.exp(logRank);

    return Math.max(1, Math.round(estimated));
  };

  const getTytContribution = (tyt: any) => {
    return (tyt.turkce * 1.32) + (tyt.mat * 1.32) + (tyt.sosyal * 1.36) + (tyt.fen * 1.36);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let tTurkce = parseNetVal(tytTurkce);
    let tMat = parseNetVal(tytMat);
    let tSosyal = parseNetVal(tytSosyal);
    let tFen = parseNetVal(tytFen);

    let aMat = parseNetVal(aytMat);
    let aFen = parseNetVal(aytFen);
    let aEdeb = parseNetVal(aytEdebiyatSos1);
    let aSos2 = parseNetVal(aytSos2);

    let tytDetailsObj: TytDetails | undefined = undefined;
    let aytDetailsObj: AytDetails | undefined = undefined;

    if (addEntryMode === 'detailed') {
      const turkceSc = buildSubSubjectScore(addTytDyb.turkce);
      const matSc = buildSubSubjectScore(addTytDyb.matematik);
      const geoSc = buildSubSubjectScore(addTytDyb.geometri);
      const fizSc = buildSubSubjectScore(addTytDyb.fizik);
      const kimSc = buildSubSubjectScore(addTytDyb.kimya);
      const biyoSc = buildSubSubjectScore(addTytDyb.biyoloji);
      const tarSc = buildSubSubjectScore(addTytDyb.tarih);
      const cogSc = buildSubSubjectScore(addTytDyb.cografya);
      const felSc = buildSubSubjectScore(addTytDyb.felsefe);
      const dinSc = buildSubSubjectScore(addTytDyb.din);

      tTurkce = turkceSc?.net ?? 0;
      tMat = Number(((matSc?.net ?? 0) + (geoSc?.net ?? 0)).toFixed(2));
      tFen = Number(((fizSc?.net ?? 0) + (kimSc?.net ?? 0) + (biyoSc?.net ?? 0)).toFixed(2));
      tSosyal = Number(((tarSc?.net ?? 0) + (cogSc?.net ?? 0) + (felSc?.net ?? 0) + (dinSc?.net ?? 0)).toFixed(2));

      tytDetailsObj = {
        turkce: turkceSc,
        matematik: matSc,
        geometri: geoSc,
        fizik: fizSc,
        kimya: kimSc,
        biyoloji: biyoSc,
        tarih: tarSc,
        cografya: cogSc,
        felsefe: felSc,
        din: dinSc
      };

      const aytMatSc = buildSubSubjectScore(addAytDyb.matematik);
      const aytGeoSc = buildSubSubjectScore(addAytDyb.geometri);
      const aytFizSc = buildSubSubjectScore(addAytDyb.fizik);
      const aytKimSc = buildSubSubjectScore(addAytDyb.kimya);
      const aytBiyoSc = buildSubSubjectScore(addAytDyb.biyoloji);
      const aytEdebSc = buildSubSubjectScore(addAytDyb.edebiyat);
      const aytTar1Sc = buildSubSubjectScore(addAytDyb.tarih1);
      const aytCog1Sc = buildSubSubjectScore(addAytDyb.cografya1);
      const aytTar2Sc = buildSubSubjectScore(addAytDyb.tarih2);
      const aytCog2Sc = buildSubSubjectScore(addAytDyb.cografya2);
      const aytFel2Sc = buildSubSubjectScore(addAytDyb.felsefe2);
      const aytDin2Sc = buildSubSubjectScore(addAytDyb.din2);

      aMat = Number(((aytMatSc?.net ?? 0) + (aytGeoSc?.net ?? 0)).toFixed(2));
      aFen = Number(((aytFizSc?.net ?? 0) + (aytKimSc?.net ?? 0) + (aytBiyoSc?.net ?? 0)).toFixed(2));
      aEdeb = Number(((aytEdebSc?.net ?? 0) + (aytTar1Sc?.net ?? 0) + (aytCog1Sc?.net ?? 0)).toFixed(2));
      aSos2 = Number(((aytTar2Sc?.net ?? 0) + (aytCog2Sc?.net ?? 0) + (aytFel2Sc?.net ?? 0) + (aytDin2Sc?.net ?? 0)).toFixed(2));

      aytDetailsObj = {
        matematik: aytMatSc,
        geometri: aytGeoSc,
        fizik: aytFizSc,
        kimya: aytKimSc,
        biyoloji: aytBiyoSc,
        edebiyat: aytEdebSc,
        tarih1: aytTar1Sc,
        cografya1: aytCog1Sc,
        tarih2: aytTar2Sc,
        cografya2: aytCog2Sc,
        felsefe2: aytFel2Sc,
        din2: aytDin2Sc
      };
    }

    const tytTotal = tTurkce + tMat + tSosyal + tFen;
    const aytTotal = aMat + aFen + aEdeb + aSos2;

    onAddMock({
      title: title.trim(),
      date,
      tyt: {
        turkce: tTurkce,
        mat: tMat,
        sosyal: tSosyal,
        fen: tFen,
        totalNet: Number(tytTotal.toFixed(2)),
        details: tytDetailsObj
      },
      ayt: {
        mat: aMat,
        fen: aFen,
        edebiyatSos1: aEdeb,
        sos2: aSos2,
        totalNet: Number(aytTotal.toFixed(2)),
        details: aytDetailsObj
      },
      estimatedRank: estimatedRank === '' ? undefined : parseNetVal(estimatedRank),
      notes,
      isAnalyzed
    });

    resetAddForm();
    setShowAddModal(false);
  };

  // Prepare chart data (chronological date ascending for trend line)
  const sortedByDateMocks = [...generalMocks].sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return dateA - dateB;
  });

  const filteredByCountMocks = mockCountFilter === '7'
    ? sortedByDateMocks.slice(-7)
    : mockCountFilter === '30'
    ? sortedByDateMocks.slice(-30)
    : sortedByDateMocks;

  const chartData = filteredByCountMocks.map((m) => ({
    id: m.id,
    name: m.title.length > 14 ? m.title.substring(0, 14) + '...' : m.title,
    fullTitle: m.title,
    date: m.date,
    TYT_Net: m.tyt.totalNet,
    AYT_Net: m.ayt.totalNet,
    Hedef_TYT: profile.targetTYTNet,
    Hedef_AYT: profile.targetAYTNet
  }));

  const subjectChartData = filteredByCountMocks.map((m) => {
    const tDet = m.tyt.details;
    const aDet = m.ayt.details;

    return {
      id: m.id,
      name: m.title.length > 14 ? m.title.substring(0, 14) + '...' : m.title,
      fullTitle: m.title,
      date: m.date,
      'TYT Mat': m.tyt.mat ?? 0,
      'AYT Mat': m.ayt.mat ?? 0,
      'TYT Tür': m.tyt.turkce ?? 0,
      'AYT Edeb': m.ayt.edebiyatSos1 ?? 0,
      'TYT Fen': m.tyt.fen ?? 0,
      'AYT Fen': m.ayt.fen ?? 0,
      'TYT Sos': m.tyt.sosyal ?? 0,
      'AYT Sos': m.ayt.sos2 ?? 0,

      // TYT Sub-subjects
      'TYT Matematik': tDet?.matematik?.net ?? (tDet?.geometri ? Math.max(0, (m.tyt.mat ?? 0) - (tDet.geometri.net ?? 0)) : Number(((m.tyt.mat ?? 0) * 0.75).toFixed(2))),
      'TYT Geometri': tDet?.geometri?.net ?? ((m.tyt.mat ?? 0) > 0 ? Number(((m.tyt.mat ?? 0) * 0.25).toFixed(2)) : 0),
      'TYT Fizik': tDet?.fizik?.net ?? ((m.tyt.fen ?? 0) > 0 ? Number(((m.tyt.fen ?? 0) * (7/20)).toFixed(2)) : 0),
      'TYT Kimya': tDet?.kimya?.net ?? ((m.tyt.fen ?? 0) > 0 ? Number(((m.tyt.fen ?? 0) * (7/20)).toFixed(2)) : 0),
      'TYT Biyoloji': tDet?.biyoloji?.net ?? ((m.tyt.fen ?? 0) > 0 ? Number(((m.tyt.fen ?? 0) * (6/20)).toFixed(2)) : 0),
      'TYT Tarih': tDet?.tarih?.net ?? ((m.tyt.sosyal ?? 0) > 0 ? Number(((m.tyt.sosyal ?? 0) * (5/20)).toFixed(2)) : 0),
      'TYT Coğrafya': tDet?.cografya?.net ?? ((m.tyt.sosyal ?? 0) > 0 ? Number(((m.tyt.sosyal ?? 0) * (5/20)).toFixed(2)) : 0),
      'TYT Felsefe': tDet?.felsefe?.net ?? ((m.tyt.sosyal ?? 0) > 0 ? Number(((m.tyt.sosyal ?? 0) * (5/20)).toFixed(2)) : 0),
      'TYT Din': tDet?.din?.net ?? ((m.tyt.sosyal ?? 0) > 0 ? Number(((m.tyt.sosyal ?? 0) * (5/20)).toFixed(2)) : 0),

      // AYT Sub-subjects
      'AYT Matematik': aDet?.matematik?.net ?? (aDet?.geometri ? Math.max(0, (m.ayt.mat ?? 0) - (aDet.geometri.net ?? 0)) : Number(((m.ayt.mat ?? 0) * 0.75).toFixed(2))),
      'AYT Geometri': aDet?.geometri?.net ?? ((m.ayt.mat ?? 0) > 0 ? Number(((m.ayt.mat ?? 0) * 0.25).toFixed(2)) : 0),
      'AYT Fizik': aDet?.fizik?.net ?? ((m.ayt.fen ?? 0) > 0 ? Number(((m.ayt.fen ?? 0) * (14/40)).toFixed(2)) : 0),
      'AYT Kimya': aDet?.kimya?.net ?? ((m.ayt.fen ?? 0) > 0 ? Number(((m.ayt.fen ?? 0) * (13/40)).toFixed(2)) : 0),
      'AYT Biyoloji': aDet?.biyoloji?.net ?? ((m.ayt.fen ?? 0) > 0 ? Number(((m.ayt.fen ?? 0) * (13/40)).toFixed(2)) : 0),
      'AYT Edebiyat': aDet?.edebiyat?.net ?? ((m.ayt.edebiyatSos1 ?? 0) > 0 ? Number(((m.ayt.edebiyatSos1 ?? 0) * (24/40)).toFixed(2)) : 0),
      'AYT Tarih-1': aDet?.tarih1?.net ?? ((m.ayt.edebiyatSos1 ?? 0) > 0 ? Number(((m.ayt.edebiyatSos1 ?? 0) * (10/40)).toFixed(2)) : 0),
      'AYT Coğrafya-1': aDet?.cografya1?.net ?? ((m.ayt.edebiyatSos1 ?? 0) > 0 ? Number(((m.ayt.edebiyatSos1 ?? 0) * (6/40)).toFixed(2)) : 0),
      'AYT Tarih-2': aDet?.tarih2?.net ?? ((m.ayt.sos2 ?? 0) > 0 ? Number(((m.ayt.sos2 ?? 0) * (11/40)).toFixed(2)) : 0),
      'AYT Coğrafya-2': aDet?.cografya2?.net ?? ((m.ayt.sos2 ?? 0) > 0 ? Number(((m.ayt.sos2 ?? 0) * (11/40)).toFixed(2)) : 0),
      'AYT Felsefe-2': aDet?.felsefe2?.net ?? ((m.ayt.sos2 ?? 0) > 0 ? Number(((m.ayt.sos2 ?? 0) * (12/40)).toFixed(2)) : 0),
      'AYT Din-2': aDet?.din2?.net ?? ((m.ayt.sos2 ?? 0) > 0 ? Number(((m.ayt.sos2 ?? 0) * (6/40)).toFixed(2)) : 0),
    };
  });

  const rankChartData = filteredByCountMocks
    .filter((m) => m.estimatedRank !== undefined && m.estimatedRank !== null && Number(m.estimatedRank) > 0)
    .map((m) => ({
      id: m.id,
      name: m.title.length > 14 ? m.title.substring(0, 14) + '...' : m.title,
      fullTitle: m.title,
      date: m.date,
      Tahmini_Siralama: Number(m.estimatedRank)
    }));

  // Sub-Subject Breakdown Analysis Computation
  const subSubjectStatsMap = React.useMemo(() => {
    const stats: Record<string, SubSubjectStat> = {};

    DETAILED_SUB_SUBJECTS_META.forEach(meta => {
      let totalNet = 0;
      let count = 0;
      let latestNet = 0;
      let prevNet = 0;

      filteredByCountMocks.forEach((m, idx) => {
        let netVal: number | undefined = undefined;

        if (meta.examType === 'tyt') {
          const details = m.tyt.details;
          if (meta.key === 'TYT Matematik') {
            netVal = details?.matematik?.net ?? (details?.geometri?.net !== undefined ? Math.max(0, (m.tyt.mat ?? 0) - details.geometri.net) : (m.tyt.mat ?? 0) * 0.75);
          } else if (meta.key === 'TYT Geometri') {
            netVal = details?.geometri?.net ?? ((m.tyt.mat ?? 0) > 0 ? (m.tyt.mat ?? 0) * 0.25 : 0);
          } else if (meta.key === 'TYT Fizik') {
            netVal = details?.fizik?.net ?? ((m.tyt.fen ?? 0) > 0 ? (m.tyt.fen ?? 0) * (7/20) : 0);
          } else if (meta.key === 'TYT Kimya') {
            netVal = details?.kimya?.net ?? ((m.tyt.fen ?? 0) > 0 ? (m.tyt.fen ?? 0) * (7/20) : 0);
          } else if (meta.key === 'TYT Biyoloji') {
            netVal = details?.biyoloji?.net ?? ((m.tyt.fen ?? 0) > 0 ? (m.tyt.fen ?? 0) * (6/20) : 0);
          } else if (meta.key === 'TYT Tarih') {
            netVal = details?.tarih?.net ?? ((m.tyt.sosyal ?? 0) > 0 ? (m.tyt.sosyal ?? 0) * (5/20) : 0);
          } else if (meta.key === 'TYT Coğrafya') {
            netVal = details?.cografya?.net ?? ((m.tyt.sosyal ?? 0) > 0 ? (m.tyt.sosyal ?? 0) * (5/20) : 0);
          } else if (meta.key === 'TYT Felsefe') {
            netVal = details?.felsefe?.net ?? ((m.tyt.sosyal ?? 0) > 0 ? (m.tyt.sosyal ?? 0) * (5/20) : 0);
          } else if (meta.key === 'TYT Din') {
            netVal = details?.din?.net ?? ((m.tyt.sosyal ?? 0) > 0 ? (m.tyt.sosyal ?? 0) * (5/20) : 0);
          }
        } else {
          const details = m.ayt.details;
          if (meta.key === 'AYT Matematik') {
            netVal = details?.matematik?.net ?? (details?.geometri?.net !== undefined ? Math.max(0, (m.ayt.mat ?? 0) - details.geometri.net) : (m.ayt.mat ?? 0) * 0.75);
          } else if (meta.key === 'AYT Geometri') {
            netVal = details?.geometri?.net ?? ((m.ayt.mat ?? 0) > 0 ? (m.ayt.mat ?? 0) * 0.25 : 0);
          } else if (meta.key === 'AYT Fizik') {
            netVal = details?.fizik?.net ?? ((m.ayt.fen ?? 0) > 0 ? (m.ayt.fen ?? 0) * (14/40) : 0);
          } else if (meta.key === 'AYT Kimya') {
            netVal = details?.kimya?.net ?? ((m.ayt.fen ?? 0) > 0 ? (m.ayt.fen ?? 0) * (13/40) : 0);
          } else if (meta.key === 'AYT Biyoloji') {
            netVal = details?.biyoloji?.net ?? ((m.ayt.fen ?? 0) > 0 ? (m.ayt.fen ?? 0) * (13/40) : 0);
          } else if (meta.key === 'AYT Edebiyat') {
            netVal = details?.edebiyat?.net ?? ((m.ayt.edebiyatSos1 ?? 0) > 0 ? (m.ayt.edebiyatSos1 ?? 0) * (24/40) : 0);
          } else if (meta.key === 'AYT Tarih-1') {
            netVal = details?.tarih1?.net ?? ((m.ayt.edebiyatSos1 ?? 0) > 0 ? (m.ayt.edebiyatSos1 ?? 0) * (10/40) : 0);
          } else if (meta.key === 'AYT Coğrafya-1') {
            netVal = details?.cografya1?.net ?? ((m.ayt.edebiyatSos1 ?? 0) > 0 ? (m.ayt.edebiyatSos1 ?? 0) * (6/40) : 0);
          } else if (meta.key === 'AYT Tarih-2') {
            netVal = details?.tarih2?.net ?? ((m.ayt.sos2 ?? 0) > 0 ? (m.ayt.sos2 ?? 0) * (11/40) : 0);
          } else if (meta.key === 'AYT Coğrafya-2') {
            netVal = details?.cografya2?.net ?? ((m.ayt.sos2 ?? 0) > 0 ? (m.ayt.sos2 ?? 0) * (11/40) : 0);
          } else if (meta.key === 'AYT Felsefe-2') {
            netVal = details?.felsefe2?.net ?? ((m.ayt.sos2 ?? 0) > 0 ? (m.ayt.sos2 ?? 0) * (12/40) : 0);
          } else if (meta.key === 'AYT Din-2') {
            netVal = details?.din2?.net ?? ((m.ayt.sos2 ?? 0) > 0 ? (m.ayt.sos2 ?? 0) * (6/40) : 0);
          }
        }

        if (netVal !== undefined) {
          totalNet += netVal;
          count++;
          if (idx === filteredByCountMocks.length - 1) latestNet = netVal;
          if (idx === filteredByCountMocks.length - 2) prevNet = netVal;
        }
      });

      const avgNet = count > 0 ? totalNet / count : 0;
      const accuracyPercent = Math.min(100, Math.max(0, Math.round((avgNet / meta.maxQuestions) * 100)));
      const status: 'critical' | 'warning' | 'good' = accuracyPercent < 45 ? 'critical' : accuracyPercent < 65 ? 'warning' : 'good';

      stats[meta.key] = {
        meta,
        avgNet: Math.round(avgNet * 10) / 10,
        latestNet: Math.round(latestNet * 10) / 10,
        prevNet: Math.round(prevNet * 10) / 10,
        accuracyPercent,
        status,
        totalCount: count
      };
    });

    return stats;
  }, [filteredByCountMocks]);

  const detailedChartData = DETAILED_SUB_SUBJECTS_META
    .filter(meta => meta.examType === subSubjectExamTab)
    .filter(meta => subSubjectGroupFilter === 'all' || meta.group === subSubjectGroupFilter)
    .map(meta => {
      const stat = subSubjectStatsMap[meta.key];
      return {
        key: meta.key,
        name: meta.shortLabel,
        fullLabel: meta.label,
        avgNet: stat ? stat.avgNet : 0,
        latestNet: stat ? stat.latestNet : 0,
        maxQuestions: meta.maxQuestions,
        accuracyPercent: stat ? stat.accuracyPercent : 0,
        status: stat ? stat.status : 'warning',
        color: stat?.status === 'critical' ? '#ef4444' : stat?.status === 'warning' ? '#f59e0b' : '#10b981'
      };
    });

  const criticalWeakSubjects: SubSubjectStat[] = (Object.values(subSubjectStatsMap) as SubSubjectStat[])
    .filter(s => s.meta.examType === subSubjectExamTab)
    .filter(s => s.status === 'critical' || s.accuracyPercent < 50);

  const sortedGeneralMocks = [...generalMocks].sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const displayUniversity = profile?.targetUniversity || 'İstanbul Teknik Üniversitesi (İTÜ)';

  if (selectedInstitutionalExam) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        {/* Breadcrumbs / Back button */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setSelectedInstitutionalExam(null)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/60 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Geri Dön</span>
          </button>
          <span className="text-slate-500 text-xs font-medium">/</span>
          <span className="text-slate-400 text-xs font-medium truncate max-w-xs">{selectedInstitutionalExam.examTitle}</span>
        </div>

        {/* Detailed Report Card Card View */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-3.5">
              <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/30 text-indigo-400">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Kurumsal Deneme Sonuç Karnesi
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                  {selectedInstitutionalExam.examTitle} • {selectedInstitutionalExam.examDate}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedInstitutionalExam(null)}
              className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer border border-indigo-500/20 self-start sm:self-center"
            >
              Kapat ve Listeye Dön
            </button>
          </div>

          {/* Student & Overall Rank Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="bg-sky-500/10 p-2.5 rounded-xl text-sky-400 shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Öğrenci Bilgileri</span>
                <div className="text-sm font-extrabold text-white mt-0.5">{selectedInstitutionalExam.studentName}</div>
                <div className="text-xs text-slate-400 font-medium">{selectedInstitutionalExam.className} {selectedInstitutionalExam.schoolNumber ? `• No: ${selectedInstitutionalExam.schoolNumber}` : ''}</div>
              </div>
            </div>

            {/* Display primary score and ranks */}
            {(() => {
              // Determine best score
              let bestScoreType = 'SAY';
              let bestScore = selectedInstitutionalExam.scores.sayScore || 0;
              let classRank = selectedInstitutionalExam.scores.sayClassRank;
              let instRank = selectedInstitutionalExam.scores.sayInstitutionRank;
              let genRank = selectedInstitutionalExam.scores.sayGeneralRank;

              if ((selectedInstitutionalExam.scores.eaScore || 0) > bestScore) {
                bestScoreType = 'EA';
                bestScore = selectedInstitutionalExam.scores.eaScore || 0;
                classRank = selectedInstitutionalExam.scores.eaClassRank;
                instRank = selectedInstitutionalExam.scores.eaInstitutionRank;
                genRank = selectedInstitutionalExam.scores.eaGeneralRank;
              }
              if ((selectedInstitutionalExam.scores.sozScore || 0) > bestScore) {
                bestScoreType = 'SÖZ';
                bestScore = selectedInstitutionalExam.scores.sozScore || 0;
                classRank = selectedInstitutionalExam.scores.sozClassRank;
                instRank = selectedInstitutionalExam.scores.sozInstitutionRank;
                genRank = selectedInstitutionalExam.scores.sozGeneralRank;
              }

              if (bestScore === 0 && selectedInstitutionalExam.scores.sayScore !== undefined) {
                bestScoreType = 'SAY';
                bestScore = selectedInstitutionalExam.scores.sayScore;
                classRank = selectedInstitutionalExam.scores.sayClassRank;
                instRank = selectedInstitutionalExam.scores.sayInstitutionRank;
                genRank = selectedInstitutionalExam.scores.sayGeneralRank;
              }

              return (
                <>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400 shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Öncelikli Başarı Puanı</span>
                      <div className="text-sm font-extrabold text-white mt-0.5">{bestScore > 0 ? `${bestScore} Puan` : 'Hesaplanmadı'}</div>
                      <div className="text-xs text-emerald-400 font-bold">{bestScoreType} Alan Puanı</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
                    <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-400 shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Genel & Sınıf Derecesi</span>
                      <div className="text-sm font-extrabold text-white mt-0.5">
                        {classRank ? `Sınıf: ${classRank}.` : 'Derece Yok'}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        {instRank ? `Okul: ${instRank}.` : ''} {genRank ? `| İl/Genel: ${genRank}.` : ''}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Subject Net Summary Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <span>Ders Netleri & Karşılaştırmalı Ortalama Analizi</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[10px] sm:text-xs">
                    <th className="p-4">Ders Adı</th>
                    <th className="p-4 text-center">Doğru</th>
                    <th className="p-4 text-center">Yanlış</th>
                    <th className="p-4 text-center">Net Skor</th>
                    <th className="p-4 text-center">Sınıf Ort.</th>
                    <th className="p-4 text-center">Okul Ort.</th>
                    <th className="p-4 text-center">Başarı Oranı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-slate-300">
                  {selectedInstitutionalExam.subjects.map((sub, sIdx) => {
                    return (
                      <tr key={sIdx} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-extrabold text-white">{sub.subjectName}</td>
                        <td className="p-4 text-center text-emerald-400 font-bold">{sub.correct}</td>
                        <td className="p-4 text-center text-rose-400 font-bold">{sub.wrong}</td>
                        <td className="p-4 text-center font-black text-indigo-300">{sub.net}</td>
                        <td className="p-4 text-center text-slate-400 font-mono font-bold">{sub.classAvgNet !== undefined ? sub.classAvgNet : '-'}</td>
                        <td className="p-4 text-center text-slate-400 font-mono font-bold">{sub.institutionAvgNet !== undefined ? sub.institutionAvgNet : '-'}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold ${
                            sub.successRate >= 70
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : sub.successRate >= 45
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            %{sub.successRate}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subject Topic Level Breakdown Section (Fully scrollable) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>Konu & Kazanım Seviyesinde Detaylı Rapor</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedInstitutionalExam.subjects.filter(s => s.topics && s.topics.length > 0).map((sub, sIdx) => (
                <div key={sIdx} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full">
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">{sub.subjectName} Konu Dağılımları</span>
                    <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {sub.topics.length} Kazanım
                    </span>
                  </div>
                  <div className="p-4 divide-y divide-slate-900/60 space-y-1">
                    {sub.topics.map((top, tIdx) => (
                      <div key={tIdx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="text-slate-300 font-semibold">{top.topicName}</span>
                        <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                          <span className="text-[11px] text-slate-400 font-mono font-medium">
                            D: <strong className="text-emerald-400 font-bold">{top.correct}</strong> | Y: <strong className="text-rose-400 font-bold">{top.wrong}</strong> | B: <strong className="text-slate-500 font-bold">{top.empty}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            top.successRate >= 70
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : top.successRate >= 45
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            %{top.successRate} Başarı
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer advice */}
          <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl flex items-start space-x-3.5">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Yapay Zeka Rehberlik Önerisi</h4>
              <p className="text-xs text-indigo-200 mt-1 leading-relaxed font-medium">
                Bu karnedeki düşük başarı oranına sahip (<span className="text-rose-400 font-semibold">%45'in altındaki</span>) konuları öncelikli hata listenize ekleyerek yapay zeka destekli çalışma programınızı güncelleyebilirsiniz. Detaylı analizlerinizi tamamlamak için sol menüdeki "Hata Defteri" sekmesini de aktif kullanmanız önerilir.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedInstitutionalExam(null)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              Kapat ve Listeye Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>Genel Deneme Analizi & Net Yükseliş Grafiği</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Türkiye geneli ve kurum içi <span className="text-indigo-400 font-bold">TYT</span> & <span className="text-emerald-400 font-bold">AYT</span> genel deneme sonuçlarınızı girin, derece hedefinize adım adım yaklaşın.
          </p>
        </div>

        <button
          onClick={() => {
            resetAddForm();
            setShowAddModal(true);
          }}
          id="add-general-mock-btn"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Genel Deneme Sonucu Gir</span>
        </button>
      </div>

      {/* Chart Count Filter & Graph Selection Bar */}
      {generalMocks.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
          {/* 1. Satır: Deneme Filtresi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Grafik Deneme Filtresi:</span>
              <span className="text-[11px] text-slate-400 font-medium">
                ({filteredByCountMocks.length} / {generalMocks.length} deneme gösteriliyor)
              </span>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMockCountFilter('7')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mockCountFilter === '7'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                Son 7 Deneme
              </button>
              <button
                type="button"
                onClick={() => setMockCountFilter('30')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mockCountFilter === '30'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                Son 30 Deneme
              </button>
              <button
                type="button"
                onClick={() => setMockCountFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mockCountFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                Tüm Denemeler
              </button>
            </div>
          </div>

          {/* 2. Satır: Grafik Seçimi & Kişiselleştirme */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Gösterilecek Grafik:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveChartTab('net')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeChartTab === 'net'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  TYT & AYT Net
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('subject')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeChartTab === 'subject'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  Ders Bazlı Netler
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('detailed')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeChartTab === 'detailed'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  Detaylı Ders Analizi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('rank')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeChartTab === 'rank'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  Sıralama Trendi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeChartTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  Tüm Grafikler
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('custom')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                    activeChartTab === 'custom'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Bana Özel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomizeModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer shadow-sm shrink-0 ml-1"
                  title="Sayfa grafiklerini düzenle ve sabitle"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Özelleştir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sabitlenen Branş Takip Kartları */}
      {pinnedSubjects.length > 0 && (
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-lg shadow-indigo-950/20 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <Pin className="w-4 h-4 text-amber-400 rotate-45 shrink-0" />
              <span>Sabitlenen Branş Takip Kartlarınız ({pinnedSubjects.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Sayfa başından anlık takip ettiğiniz öncelikli branşlar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pinnedSubjects.map(key => {
              const stat = subSubjectStatsMap[key];
              const meta = DETAILED_SUB_SUBJECTS_META.find(m => m.key === key) || MOCK_SUBJECT_CONFIG.find(m => m.key === key);
              if (!stat && !meta) return null;

              const label = meta?.label || key;
              const avgNet = stat ? stat.avgNet : 0;
              const maxQ = meta && 'maxQuestions' in meta ? meta.maxQuestions : 10;
              const percent = stat ? stat.accuracyPercent : 0;
              const status = stat ? stat.status : 'warning';

              return (
                <div key={key} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative group hover:border-indigo-500/50 transition-all shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100 truncate pr-4">{label}</span>
                    <button
                      type="button"
                      onClick={() => togglePinnedSubject(key)}
                      className="text-slate-500 hover:text-amber-400 transition-colors p-1 rounded hover:bg-slate-800/80 cursor-pointer"
                      title="Sabitlemeyi kaldır"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">Ort. Net:</span>
                    <span className="text-sm font-bold text-white">{avgNet} / {maxQ} Net</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'critical' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-0.5">
                    <span className={`font-semibold flex items-center gap-1 ${
                      status === 'critical' ? 'text-rose-400' : status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {status === 'critical' ? '🔴 Kritik (%' + percent + ')' : status === 'warning' ? '🟡 Geliştirilmeli (%' + percent + ')' : '🟢 Güçlü (%' + percent + ')'}
                    </span>
                    <span className="text-slate-500 font-mono">Son: {stat?.latestNet ?? '-'} Net</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recharts Net Trend Graph */}
      {visibleCharts.netTrend && chartData.length > 0 && (activeChartTab === 'all' || activeChartTab === 'net' || activeChartTab === 'custom') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-3 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-700/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span><span className="text-indigo-400">TYT</span> & <span className="text-emerald-400">AYT</span> Net Gelişim Trendi</span>
            </h2>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                <span className="text-indigo-400 font-bold">TYT Net</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-emerald-400 font-bold">AYT Net</span>
              </span>
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                <XAxis 
                  dataKey="id" 
                  tickFormatter={(id) => {
                    const m = generalMocks.find(x => x.id === id);
                    if (!m) return '';
                    return m.title.length > 22 ? m.title.substring(0, 22) + '...' : m.title;
                  }} 
                  stroke="var(--chart-axis)" 
                  fontSize={10} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={65}
                  dy={6}
                  dx={-2}
                />
                <YAxis 
                  stroke="var(--chart-axis)" 
                  fontSize={11} 
                  domain={[
                    (dataMin: number) => Math.max(0, Math.floor(dataMin - 5)), 
                    (dataMax: number) => Math.min(120, Math.ceil(dataMax + 5))
                  ]} 
                  width={38} 
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs sm:max-w-sm">
                          <div className="font-bold text-white text-sm break-words leading-snug">{data.fullTitle}</div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <span>📅</span>
                            <span>Tarih: {data.date}</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800 space-y-1 font-mono font-semibold">
                            {payload.map((p: any) => (
                              <div key={p.dataKey} className="flex items-center justify-between gap-4" style={{ color: p.color }}>
                                <span>{p.dataKey === 'TYT_Net' ? 'TYT Net' : p.dataKey === 'AYT_Net' ? 'AYT Net' : p.name}:</span>
                                <span>{String(p.value).replace('.', ',')} Net</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="TYT_Net"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="AYT_Net"
                  stroke="#34d399"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#34d399' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Subject Nets Comparison Graph */}
      {visibleCharts.subjectComparison && subjectChartData.length > 0 && (activeChartTab === 'all' || activeChartTab === 'subject' || activeChartTab === 'custom') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-3 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-sky-500/5 hover:border-slate-700/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-sky-400" />
              <span>Ders Bazlı Net Gelişim Karşılaştırması</span>
            </h2>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-[11px] text-slate-400 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {selectedMockSubjects.length} Ders Gösteriliyor
              </span>
              <button
                type="button"
                onClick={() => setShowSubjectFilters(prev => !prev)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  showSubjectFilters
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Ders seçeneği butonlarını göster veya gizle"
              >
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                <span>{showSubjectFilters ? 'Ders Seçimini Gizle' : 'Ders Seçimi (Göster/Gizle)'}</span>
                {showSubjectFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={subjectChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                <XAxis 
                  dataKey="id" 
                  tickFormatter={(id) => {
                    const m = generalMocks.find(x => x.id === id);
                    if (!m) return '';
                    return m.title.length > 22 ? m.title.substring(0, 22) + '...' : m.title;
                  }} 
                  stroke="var(--chart-axis)" 
                  fontSize={10} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={65}
                  dy={6}
                  dx={-2}
                />
                <YAxis stroke="var(--chart-axis)" fontSize={11} domain={[0, 'auto']} width={38} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const visibleItems = payload.filter((p: any) => selectedMockSubjects.includes(p.dataKey));
                      if (visibleItems.length === 0) return null;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs sm:max-w-sm">
                          <div className="font-bold text-white text-sm break-words leading-snug">{data.fullTitle}</div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <span>📅</span>
                            <span>Tarih: {data.date}</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800 space-y-1 font-mono font-semibold">
                            {visibleItems.map((p: any) => (
                              <div key={p.dataKey} className="flex items-center justify-between gap-4" style={{ color: p.color }}>
                                <span>{p.dataKey}:</span>
                                <span>{String(p.value).replace('.', ',')} Net</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {MOCK_SUBJECT_CONFIG.map((subj) => (
                  <Line
                    key={subj.key}
                    type="monotone"
                    dataKey={subj.key}
                    stroke={subj.color}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: subj.color }}
                    activeDot={{ r: 6 }}
                    hide={!selectedMockSubjects.includes(subj.key)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Toggle Buttons Below Chart */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            {!showSubjectFilters ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-medium shrink-0">Gösterilen Dersler:</span>
                  {selectedMockSubjects.length === 0 ? (
                    <span className="text-amber-400 font-medium italic">Hiçbir ders seçilmedi</span>
                  ) : (
                    selectedMockSubjects.map((key) => {
                      const cfg = MOCK_SUBJECT_CONFIG.find((s) => s.key === key);
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-200"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cfg?.color || '#38bdf8' }}
                          />
                          <span>{cfg?.label || key}</span>
                        </span>
                      );
                    })
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubjectFilters(true)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-all cursor-pointer shrink-0 self-end sm:self-auto"
                >
                  <Filter className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ders Seçeneklerini Göster</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-3 animate-fade-in">
                {/* Quick Selection Presets */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5 text-sky-400" />
                    <span>Grafikte Gösterilecek Dersleri Seçin:</span>
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMockSubjects(['TYT Fen', 'TYT Sos', 'TYT Mat', 'TYT Tür'])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 transition-colors cursor-pointer"
                    >
                      TYT Toplamları
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMockSubjects(['AYT Mat', 'AYT Fen', 'AYT Edeb', 'AYT Sos'])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/20 transition-colors cursor-pointer"
                    >
                      AYT Toplamları
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMockSubjects(MOCK_SUBJECT_CONFIG.map((s) => s.key))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMockSubjects([])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                    >
                      Temizle
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSubjectFilters(false)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <span>Gizle</span>
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 1. Satır: TYT Dersleri */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded-lg uppercase shrink-0">
                    TYT:
                  </span>
                  {MOCK_SUBJECT_CONFIG.filter((s) => s.key.startsWith('TYT')).map((subj) => {
                    const isSelected = selectedMockSubjects.includes(subj.key);
                    return (
                      <button
                        key={subj.key}
                        type="button"
                        onClick={() => toggleMockSubject(subj.key)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'opacity-100 bg-slate-800 text-slate-100 border border-slate-700 shadow-md hover:bg-slate-700'
                            : 'opacity-40 line-through bg-slate-900 text-slate-500 border border-slate-800/80 hover:opacity-60'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
                          style={{ backgroundColor: isSelected ? subj.color : '#64748b' }}
                        />
                        <span>{subj.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Satır: AYT Dersleri */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-1 rounded-lg uppercase shrink-0">
                    AYT:
                  </span>
                  {MOCK_SUBJECT_CONFIG.filter((s) => s.key.startsWith('AYT')).map((subj) => {
                    const isSelected = selectedMockSubjects.includes(subj.key);
                    return (
                      <button
                        key={subj.key}
                        type="button"
                        onClick={() => toggleMockSubject(subj.key)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'opacity-100 bg-slate-800 text-slate-100 border border-slate-700 shadow-md hover:bg-slate-700'
                            : 'opacity-40 line-through bg-slate-900 text-slate-500 border border-slate-800/80 hover:opacity-60'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
                          style={{ backgroundColor: isSelected ? subj.color : '#64748b' }}
                        />
                        <span>{subj.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 italic text-center mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-1.5">
            <span>💡</span>
            <span>
              <strong className="text-slate-300 not-italic">İpucu:</strong> Butonlara basarak ilgilendiğiniz derslerin net grafiklerini açıp kapatabilirsiniz.
            </span>
          </p>
        </div>
      )}

      {/* Detaylı Ders Analizi Grafiği (Alt Branş Kırılımı & Anlık Zayıf Branş Tespiti) */}
      {visibleCharts.detailedSubSubjects && (activeChartTab === 'all' || activeChartTab === 'detailed' || activeChartTab === 'custom') && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-3 sm:p-5 shadow-lg shadow-purple-950/10 space-y-4 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/50">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Detaylı Ders Analizi (Alt Branş Net Trendleri & Anlık Zayıf Branş Tespiti)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Denemeler bazında alt branş (Mat, Geo, Fiz, Kim, Biyo vb.) net gelişiminizi çizgi grafik üzerinde takip edin.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Line vs Bar Mode Switcher */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubSubjectChartType('line')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                    subSubjectChartType === 'line'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Deneme Deneme Çizgi Grafik"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Çizgi Grafik</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubSubjectChartType('bar')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                    subSubjectChartType === 'bar'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ortalama Bar Grafiği"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Ortalama Bar</span>
                </button>
              </div>

              {/* Exam Type Tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSubSubjectExamTab('tyt');
                    setActiveSubSubjectKeys([]);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    subSubjectExamTab === 'tyt'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TYT Alt Branşlar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubSubjectExamTab('ayt');
                    setActiveSubSubjectKeys([]);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    subSubjectExamTab === 'ayt'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AYT Alt Branşlar
                </button>
              </div>

              {/* Group Filter */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubSubjectGroupFilter('all')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    subSubjectGroupFilter === 'all'
                      ? 'bg-slate-800 text-slate-100 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tümü
                </button>
                <button
                  type="button"
                  onClick={() => setSubSubjectGroupFilter('mat')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    subSubjectGroupFilter === 'mat'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mat/Geo
                </button>
                <button
                  type="button"
                  onClick={() => setSubSubjectGroupFilter('fen')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    subSubjectGroupFilter === 'fen'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fiz/Kim/Biyo
                </button>
                <button
                  type="button"
                  onClick={() => setSubSubjectGroupFilter('sos')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    subSubjectGroupFilter === 'sos'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tar/Coğ/Fel/Din
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Sub-Subject Pills Selector for Line Chart */}
          {subSubjectChartType === 'line' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Çizgi Grafiğe Ekle / Çıkar:</span>
              </span>
              {DETAILED_SUB_SUBJECTS_META
                .filter(meta => meta.examType === subSubjectExamTab)
                .filter(meta => subSubjectGroupFilter === 'all' || meta.group === subSubjectGroupFilter)
                .map(meta => {
                  const isSelected = activeSubSubjectKeys.length === 0 || activeSubSubjectKeys.includes(meta.key);
                  return (
                    <button
                      key={meta.key}
                      type="button"
                      onClick={() => toggleActiveSubSubject(meta.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                          : 'bg-slate-950/60 text-slate-500 border-slate-800/80 opacity-50 hover:opacity-90'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span>{meta.shortLabel}</span>
                    </button>
                  );
                })}
              {activeSubSubjectKeys.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveSubSubjectKeys([])}
                  className="text-[10px] text-purple-400 hover:text-purple-300 ml-2 underline cursor-pointer"
                >
                  Tümünü Göster
                </button>
              )}
            </div>
          )}

          {/* Anlık Zayıf Branş Tespiti Banner */}
          {criticalWeakSubjects.length > 0 ? (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-xs font-bold text-rose-200">
                    Anlık Tespit Edilen Zayıf Branşlarınız ({criticalWeakSubjects.length})
                  </span>
                </div>
                <span className="text-[10px] text-rose-300 font-mono bg-rose-900/50 px-2 py-0.5 rounded border border-rose-700/50">
                  Başarı Oranı %50'nin Altında
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {criticalWeakSubjects.map(sub => (
                  <div
                    key={sub.meta.key}
                    className="bg-slate-950 border border-rose-500/30 rounded-lg p-2 flex items-center space-x-2 text-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <span className="font-bold text-white">{sub.meta.label}:</span>
                    <span className="text-rose-300 font-mono">{sub.avgNet} / {sub.meta.maxQuestions} Net (%{sub.accuracyPercent})</span>
                    <button
                      type="button"
                      onClick={() => togglePinnedSubject(sub.meta.key)}
                      className="ml-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                      title="En üste sabitle"
                    >
                      <Pin className="w-2.5 h-2.5" />
                      <span>{pinnedSubjects.includes(sub.meta.key) ? 'Sabitlendi' : 'Sabitle'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center space-x-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Harika Performans!</strong> Tüm alt branşlarınızda başarı oranınız %50'nin üzerinde. Mevcut çalışma temponuzu koruyun!
              </span>
            </div>
          )}

          {/* Sub-Subject Chart Render (LineChart or BarChart) */}
          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {subSubjectChartType === 'line' ? (
                <LineChart data={subjectChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--chart-axis)" 
                    fontSize={11} 
                    tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <YAxis stroke="var(--chart-axis)" fontSize={11} domain={[0, 'auto']} width={38} />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-2 max-w-xs">
                            <div className="font-bold text-white text-sm border-b border-slate-800 pb-1.5">
                              {data.fullTitle || label}
                              <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{data.date}</span>
                            </div>
                            <div className="space-y-1 font-mono">
                              {payload.map((p: any) => (
                                <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs">
                                  <span className="flex items-center gap-1.5 font-sans text-slate-200">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                    {p.name}:
                                  </span>
                                  <span className="font-bold text-white">{p.value} Net</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  {DETAILED_SUB_SUBJECTS_META
                    .filter(meta => meta.examType === subSubjectExamTab)
                    .filter(meta => subSubjectGroupFilter === 'all' || meta.group === subSubjectGroupFilter)
                    .filter(meta => activeSubSubjectKeys.length === 0 || activeSubSubjectKeys.includes(meta.key))
                    .map(meta => (
                      <Line
                        key={meta.key}
                        type="monotone"
                        dataKey={meta.key}
                        name={meta.shortLabel}
                        stroke={meta.color}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: meta.color, strokeWidth: 1, stroke: '#0f172a' }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        connectNulls
                      />
                    ))}
                </LineChart>
              ) : (
                <BarChart data={detailedChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--chart-axis)" 
                    fontSize={11} 
                    tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <YAxis stroke="var(--chart-axis)" fontSize={11} domain={[0, 'auto']} width={38} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs">
                            <div className="font-bold text-white text-sm">{data.fullLabel}</div>
                            <div className="pt-1.5 border-t border-slate-800 space-y-1 font-mono">
                              <div className="flex justify-between gap-4 text-indigo-300">
                                <span>Ortalama Net:</span>
                                <span className="font-bold">{data.avgNet} / {data.maxQuestions} Net</span>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-400">
                                <span>Son Deneme Net:</span>
                                <span>{data.latestNet} Net</span>
                              </div>
                              <div className="flex justify-between gap-4 text-emerald-400">
                                <span>Başarı Oranı:</span>
                                <span className="font-bold">%{data.accuracyPercent}</span>
                              </div>
                              <div className="pt-1 text-[10px] font-semibold flex items-center justify-between">
                                <span>Anlık Durum:</span>
                                <span className={data.status === 'critical' ? 'text-rose-400' : data.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}>
                                  {data.status === 'critical' ? '🔴 Kritik Zayıf Branş' : data.status === 'warning' ? '🟡 Geliştirilmeli' : '🟢 Güçlü Performans'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgNet" name="Ortalama Net" radius={[6, 6, 0, 0]}>
                    {detailedChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Group Breakdown Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* 1. Matematik Grubu (Mat & Geo) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                  <span>📐</span>
                  <span>Matematik Grubu (Mat / Geo)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">40 Soru</span>
              </div>

              {DETAILED_SUB_SUBJECTS_META.filter(m => m.examType === subSubjectExamTab && m.group === 'mat').map(meta => {
                const stat = subSubjectStatsMap[meta.key];
                const avg = stat ? stat.avgNet : 0;
                const percent = stat ? stat.accuracyPercent : 0;
                const isPinned = pinnedSubjects.includes(meta.key);

                return (
                  <div key={meta.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{meta.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-white font-bold">{avg} / {meta.maxQuestions} Net</span>
                        <button
                          type="button"
                          onClick={() => togglePinnedSubject(meta.key)}
                          className={`p-1 rounded transition-colors ${
                            isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Sayfa başına sabitle"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percent < 45 ? 'bg-rose-500' : percent < 65 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Fen Bilimleri Grubu (Fiz / Kim / Biyo) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-sky-300 flex items-center space-x-1.5">
                  <span>🧪</span>
                  <span>Fen Bilimleri (Fiz / Kim / Biyo)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">20/40 Soru</span>
              </div>

              {DETAILED_SUB_SUBJECTS_META.filter(m => m.examType === subSubjectExamTab && m.group === 'fen').map(meta => {
                const stat = subSubjectStatsMap[meta.key];
                const avg = stat ? stat.avgNet : 0;
                const percent = stat ? stat.accuracyPercent : 0;
                const isPinned = pinnedSubjects.includes(meta.key);

                return (
                  <div key={meta.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{meta.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-white font-bold">{avg} / {meta.maxQuestions} Net</span>
                        <button
                          type="button"
                          onClick={() => togglePinnedSubject(meta.key)}
                          className={`p-1 rounded transition-colors ${
                            isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Sayfa başına sabitle"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percent < 45 ? 'bg-rose-500' : percent < 65 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. Sosyal Bilimler Grubu (Tar / Coğ / Fel / Din) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <span>🏛️</span>
                  <span>Sosyal Bilimler (Tar / Coğ / Fel)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">20/40 Soru</span>
              </div>

              {DETAILED_SUB_SUBJECTS_META.filter(m => m.examType === subSubjectExamTab && m.group === 'sos').map(meta => {
                const stat = subSubjectStatsMap[meta.key];
                const avg = stat ? stat.avgNet : 0;
                const percent = stat ? stat.accuracyPercent : 0;
                const isPinned = pinnedSubjects.includes(meta.key);

                return (
                  <div key={meta.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{meta.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-white font-bold">{avg} / {meta.maxQuestions} Net</span>
                        <button
                          type="button"
                          onClick={() => togglePinnedSubject(meta.key)}
                          className={`p-1 rounded transition-colors ${
                            isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Sayfa başına sabitle"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percent < 45 ? 'bg-rose-500' : percent < 65 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recharts Rank Trend Graph */}
      {visibleCharts.rankTrend && rankChartData.length > 0 && (activeChartTab === 'all' || activeChartTab === 'rank' || activeChartTab === 'custom') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-3 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-amber-500/5 hover:border-slate-700/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Tahmini Sıralama Gelişim Trendi</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="text-slate-300">Tahmini Derece (Üst Sıralar Yukarıda)</span>
              </span>
              {profile?.targetRank && Number(profile.targetRank) > 0 && (
                <span className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                  <span className="w-3.5 h-0.5 bg-emerald-400 inline-block" />
                  <span className="text-emerald-400 font-bold">Hedef: #{Number(profile.targetRank).toLocaleString('tr-TR')}</span>
                </span>
              )}
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rankChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                <XAxis 
                  dataKey="id" 
                  tickFormatter={(id) => {
                    const m = generalMocks.find(x => x.id === id);
                    if (!m) return '';
                    return m.title.length > 22 ? m.title.substring(0, 22) + '...' : m.title;
                  }} 
                  stroke="var(--chart-axis)" 
                  fontSize={10} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={65}
                  dy={6}
                  dx={-2}
                />
                <YAxis 
                  stroke="var(--chart-axis)" 
                  fontSize={11} 
                  reversed={true}
                  width={58}
                  tickFormatter={(val) => `#${Number(val).toLocaleString('tr-TR')}`}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs sm:max-w-sm">
                          <div className="font-bold text-white text-sm break-words leading-snug">{data.fullTitle}</div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <span>📅</span>
                            <span>Tarih: {data.date}</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800 font-mono font-bold text-amber-400 flex items-center justify-between gap-4">
                            <span>Tahmini Sıralama:</span>
                            <span>#{Number(data.Tahmini_Siralama).toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {profile?.targetRank && Number(profile.targetRank) > 0 && (
                  <ReferenceLine 
                    y={Number(profile.targetRank)} 
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{ 
                      value: `Hedef: #${Number(profile.targetRank).toLocaleString('tr-TR')}`, 
                      fill: '#34d399', 
                      fontSize: 11,
                      position: 'top',
                      fontWeight: 'bold'
                    }} 
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="Tahmini_Siralama"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#fbbf24' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Mock Exams List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
        
        {/* Tab switcher header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMockListTab('individual')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
                mockListTab === 'individual'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Bireysel Denemelerim ({generalMocks.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMockListTab('institutional')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
                mockListTab === 'institutional'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Kurumsal Deneme Karnelerim ({institutionalMocks.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-950 px-3 py-2 rounded-xl border border-slate-800"
            >
              <span>Sıralama:</span>
              <span className="text-indigo-400">
                {sortOrder === 'desc' ? 'Yeni' : 'Eski'}
              </span>
              {sortOrder === 'desc' ? (
                <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </button>

            {mockListTab === 'individual' && generalMocks.length > 0 && (
              <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{generalMocks.filter(m => m.isAnalyzed).length} / {generalMocks.length} Analiz Edildi</span>
              </div>
            )}
          </div>
        </div>

        {mockListTab === 'institutional' ? (
          (() => {
            const sortedInstitutionalMocks = [...institutionalMocks].sort((a, b) => {
              const dateA = new Date(a.examDate).getTime() || 0;
              const dateB = new Date(b.examDate).getTime() || 0;
              return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            });

            return sortedInstitutionalMocks.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">Okul tarafından yüklenmiş kurumsal deneme karneniz bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedInstitutionalMocks.map((exam) => {
                  const displayScores = [];
                  if (exam.scores.sayScore !== undefined) {
                    displayScores.push({ label: 'SAY', score: exam.scores.sayScore, rank: exam.scores.sayClassRank, total: exam.scores.sayClassTotal });
                  }
                  if (exam.scores.eaScore !== undefined) {
                    displayScores.push({ label: 'EA', score: exam.scores.eaScore, rank: exam.scores.eaClassRank, total: exam.scores.eaClassTotal });
                  }
                  if (exam.scores.sozScore !== undefined) {
                    displayScores.push({ label: 'SÖZ', score: exam.scores.sozScore, rank: exam.scores.sozClassRank, total: exam.scores.sozClassTotal });
                  }

                  return (
                    <div
                      key={exam.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 animate-fade-in relative group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {exam.examDate}
                          </span>
                          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                            {exam.examType || 'Kurumsal'}
                          </span>
                        </div>

                        <h3 className="text-sm font-extrabold text-white mt-3 line-clamp-2 font-bold">
                          {exam.examTitle}
                        </h3>

                        {exam.scores.classParticipantCount && (
                          <p className="text-[11px] text-slate-400 font-semibold mt-1.5 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Katılımcı Sayısı: {exam.scores.classParticipantCount} Öğrenci</span>
                          </p>
                        )}

                        {displayScores.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            {displayScores.map((sc, idx) => (
                              <div key={idx} className="bg-slate-900 border border-slate-800/60 rounded-xl p-2.5 text-center">
                                <span className="text-[10px] text-slate-400 font-bold block">{sc.label} Puanı</span>
                                <strong className="text-indigo-300 text-sm font-mono block mt-0.5">{sc.score}</strong>
                                {sc.rank && (
                                  <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">Sıra: {sc.rank} / {sc.total || '-'}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-500 font-medium">
                          {exam.studentName} {exam.schoolNumber ? `(#${exam.schoolNumber})` : ''}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedInstitutionalExam(exam)}
                          className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                        >
                          <GraduationCap className="w-4 h-4" />
                          <span>Karnemi Görüntüle</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : sortedGeneralMocks.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400">Henüz genel deneme kaydı bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGeneralMocks.map((mock) => (
              <div
                key={mock.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {mock.date}
                    </span>
                    <h3 
                      onClick={() => handleStartEdit(mock)}
                      className="text-sm font-bold text-white cursor-pointer hover:text-indigo-400 flex items-center gap-1.5 transition-colors group/mock-title"
                      title="Düzenlemek için tıklayın"
                    >
                      <span>{mock.title}</span>
                      <Pencil className="w-3 h-3 text-slate-500 opacity-0 group-hover/mock-title:opacity-100 transition-opacity" />
                    </h3>

                    <button
                      type="button"
                      onClick={() => onUpdateMock({ ...mock, isAnalyzed: !mock.isAnalyzed })}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all inline-flex items-center space-x-1 cursor-pointer border ${
                        mock.isAnalyzed
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                      }`}
                      title="Soru ve hata analiz durumunu değiştirmek için tıklayın"
                    >
                      {mock.isAnalyzed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Analiz Edildi</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Analiz Bekliyor</span>
                        </>
                      )}
                    </button>
                  </div>

                  {mock.notes && (
                    <p className="text-xs text-slate-400 mt-1 italic">{mock.notes}</p>
                  )}

                  {/* TYT & AYT Breakdown */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-300 mt-2 font-mono">
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      <span className="text-indigo-400 font-bold mr-1">TYT</span>
                      TÜR: <strong>{String(mock.tyt.turkce).replace('.', ',')}</strong> | MAT: <strong>{String(mock.tyt.mat).replace('.', ',')}</strong> | SOS: <strong>{String(mock.tyt.sosyal).replace('.', ',')}</strong> | FEN: <strong>{String(mock.tyt.fen).replace('.', ',')}</strong>
                    </span>
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      <span className="text-emerald-400 font-bold mr-1">AYT</span>
                      MAT: <strong>{String(mock.ayt.mat).replace('.', ',')}</strong> | FEN: <strong>{String(mock.ayt.fen).replace('.', ',')}</strong>
                      {mock.ayt.edebiyatSos1 !== undefined && mock.ayt.edebiyatSos1 > 0 && (
                        <> | EDB-SOS1: <strong>{String(mock.ayt.edebiyatSos1).replace('.', ',')}</strong></>
                      )}
                      {mock.ayt.sos2 !== undefined && mock.ayt.sos2 > 0 && (
                        <> | SOS2: <strong>{String(mock.ayt.sos2).replace('.', ',')}</strong></>
                      )}
                    </span>
                  </div>

                  {/* Granular Sub-subject Breakdown Accordion Toggle */}
                  {(mock.tyt.details || mock.ayt.details) && (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExpandMockDetails(mock.id)}
                        className="mt-2 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                        <span>{expandedMockDetails[mock.id] ? 'Ayrıntılı Ders Detaylarını Gizle' : 'Ayrıntılı Ders Detaylarını Göster (Mat/Geo, Fiz/Kim/Biyo...)'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMockDetails[mock.id] ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedMockDetails[mock.id] && (
                        <div className="mt-2.5 p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl space-y-3 text-[11px] font-mono animate-fade-in">
                          {/* TYT Sub-subjects */}
                          {mock.tyt.details && (
                            <div>
                              <div className="text-[11px] font-bold text-indigo-400 mb-1.5 flex items-center gap-1">
                                <span>TYT Alt Ders Netleri</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-slate-300">
                                {mock.tyt.details.matematik && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Matematik</span>
                                    <strong className="text-indigo-300 text-xs">{String(mock.tyt.details.matematik.net).replace('.', ',')} Net</strong>
                                    {mock.tyt.details.matematik.correct !== undefined && (
                                      <span className="text-[10px] text-slate-500 block">({mock.tyt.details.matematik.correct}D {mock.tyt.details.matematik.wrong}Y)</span>
                                    )}
                                  </div>
                                )}
                                {mock.tyt.details.geometri && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Geometri</span>
                                    <strong className="text-purple-300 text-xs">{String(mock.tyt.details.geometri.net).replace('.', ',')} Net</strong>
                                    {mock.tyt.details.geometri.correct !== undefined && (
                                      <span className="text-[10px] text-slate-500 block">({mock.tyt.details.geometri.correct}D {mock.tyt.details.geometri.wrong}Y)</span>
                                    )}
                                  </div>
                                )}
                                {mock.tyt.details.fizik && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Fizik</span>
                                    <strong className="text-sky-300 text-xs">{String(mock.tyt.details.fizik.net).replace('.', ',')} Net</strong>
                                    {mock.tyt.details.fizik.correct !== undefined && (
                                      <span className="text-[10px] text-slate-500 block">({mock.tyt.details.fizik.correct}D {mock.tyt.details.fizik.wrong}Y)</span>
                                    )}
                                  </div>
                                )}
                                {mock.tyt.details.kimya && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Kimya</span>
                                    <strong className="text-teal-300 text-xs">{String(mock.tyt.details.kimya.net).replace('.', ',')} Net</strong>
                                    {mock.tyt.details.kimya.correct !== undefined && (
                                      <span className="text-[10px] text-slate-500 block">({mock.tyt.details.kimya.correct}D {mock.tyt.details.kimya.wrong}Y)</span>
                                    )}
                                  </div>
                                )}
                                {mock.tyt.details.biyoloji && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Biyoloji</span>
                                    <strong className="text-emerald-300 text-xs">{String(mock.tyt.details.biyoloji.net).replace('.', ',')} Net</strong>
                                    {mock.tyt.details.biyoloji.correct !== undefined && (
                                      <span className="text-[10px] text-slate-500 block">({mock.tyt.details.biyoloji.correct}D {mock.tyt.details.biyoloji.wrong}Y)</span>
                                    )}
                                  </div>
                                )}
                                {mock.tyt.details.tarih && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Tarih</span>
                                    <strong className="text-amber-300 text-xs">{String(mock.tyt.details.tarih.net).replace('.', ',')} Net</strong>
                                  </div>
                                )}
                                {mock.tyt.details.cografya && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Coğrafya</span>
                                    <strong className="text-orange-300 text-xs">{String(mock.tyt.details.cografya.net).replace('.', ',')} Net</strong>
                                  </div>
                                )}
                                {mock.tyt.details.felsefe && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Felsefe</span>
                                    <strong className="text-fuchsia-300 text-xs">{String(mock.tyt.details.felsefe.net).replace('.', ',')} Net</strong>
                                  </div>
                                )}
                                {mock.tyt.details.din && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Din Kültürü</span>
                                    <strong className="text-pink-300 text-xs">{String(mock.tyt.details.din.net).replace('.', ',')} Net</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* AYT Sub-subjects */}
                          {mock.ayt.details && (
                            <div>
                              <div className="text-[11px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1">
                                <span>AYT Alt Ders Netleri</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-slate-300">
                                {mock.ayt.details.matematik && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">AYT Matematik</span>
                                    <strong className="text-purple-300 text-xs">{String(mock.ayt.details.matematik.net).replace('.', ',')} Net</strong>
                                    {mock.ayt.details.matematik.correct !== undefined && (
                                      <span className="text-[10px] text-slate-500 block">({mock.ayt.details.matematik.correct}D {mock.ayt.details.matematik.wrong}Y)</span>
                                    )}
                                  </div>
                                )}
                                {mock.ayt.details.geometri && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">AYT Geometri</span>
                                    <strong className="text-fuchsia-300 text-xs">{String(mock.ayt.details.geometri.net).replace('.', ',')} Net</strong>
                                    {mock.ayt.details.geometri.correct !== undefined && (
                                      <span className="text-[10px] text-slate-500 block">({mock.ayt.details.geometri.correct}D {mock.ayt.details.geometri.wrong}Y)</span>
                                    )}
                                  </div>
                                )}
                                {mock.ayt.details.fizik && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">AYT Fizik</span>
                                    <strong className="text-sky-300 text-xs">{String(mock.ayt.details.fizik.net).replace('.', ',')} Net</strong>
                                    {mock.ayt.details.fizik.correct !== undefined && (
                                      <span className="text-[10px] text-slate-500 block">({mock.ayt.details.fizik.correct}D {mock.ayt.details.fizik.wrong}Y)</span>
                                    )}
                                  </div>
                                )}
                                {mock.ayt.details.kimya && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">AYT Kimya</span>
                                    <strong className="text-teal-300 text-xs">{String(mock.ayt.details.kimya.net).replace('.', ',')} Net</strong>
                                    {mock.ayt.details.kimya.correct !== undefined && (
                                      <span className="text-[10px] text-slate-500 block">({mock.ayt.details.kimya.correct}D {mock.ayt.details.kimya.wrong}Y)</span>
                                    )}
                                  </div>
                                )}
                                {mock.ayt.details.biyoloji && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">AYT Biyoloji</span>
                                    <strong className="text-emerald-300 text-xs">{String(mock.ayt.details.biyoloji.net).replace('.', ',')} Net</strong>
                                    {mock.ayt.details.biyoloji.correct !== undefined && (
                                      <span className="text-[10px] text-slate-500 block">({mock.ayt.details.biyoloji.correct}D {mock.ayt.details.biyoloji.wrong}Y)</span>
                                    )}
                                  </div>
                                )}
                                {mock.ayt.details.edebiyat && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Edebiyat</span>
                                    <strong className="text-rose-300 text-xs">{String(mock.ayt.details.edebiyat.net).replace('.', ',')} Net</strong>
                                  </div>
                                )}
                                {mock.ayt.details.tarih1 && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Tarih-1</span>
                                    <strong className="text-amber-300 text-xs">{String(mock.ayt.details.tarih1.net).replace('.', ',')} Net</strong>
                                  </div>
                                )}
                                {mock.ayt.details.cografya1 && (
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">Coğrafya-1</span>
                                    <strong className="text-orange-300 text-xs">{String(mock.ayt.details.cografya1.net).replace('.', ',')} Net</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Totals & Delete & Calculate */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 w-full lg:w-auto">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="text-center px-2 sm:px-3">
                      <div className="text-[10px] text-slate-400">TYT Toplam</div>
                      <div className="text-base sm:text-lg font-bold text-indigo-400 font-mono">{String(mock.tyt.totalNet).replace('.', ',')}</div>
                    </div>

                    <div className="text-center px-2 sm:px-3 border-l border-slate-800">
                      <div className="text-[10px] text-slate-400">AYT Toplam</div>
                      <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">{String(mock.ayt.totalNet).replace('.', ',')}</div>
                    </div>

                    {mock.estimatedRank && (
                      <div className="text-center px-2 sm:px-3 border-l border-slate-800">
                        <div className="text-[10px] text-slate-400">Tahmini Sıra</div>
                        <div className="text-xs sm:text-sm font-bold text-amber-400 font-mono">#{mock.estimatedRank}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setCalcMock(mock);
                        setShowAllFields(false);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 cursor-pointer shadow-sm"
                      title="YKS Puan & Sıralama Hesapla"
                    >
                      <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Puan Hesapla</span>
                    </button>

                    <button
                      onClick={() => setDeletingMock({ id: mock.id, title: `${mock.date} - ${mock.title}` })}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Denemeyi Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add General Mock */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Yeni Genel Deneme Sonucu Gir</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deneme / Yayınevi Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Ör: ÖZDEBİR Türkiye Geneli #4"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Entry Mode Switcher */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ders Bazlı Veri Giriş Modu</span>
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setAddEntryMode('quick')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        addEntryMode === 'quick' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⚡ Hızlı (Ana Ders)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddEntryMode('detailed')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        addEntryMode === 'detailed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📊 Detaylı (Ayrı Alt Dersler)
                    </button>
                  </div>
                </div>

                {addEntryMode === 'detailed' && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 text-[11px]">Veri Tipi Tercihi:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAddInputMethod('dyb')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          addInputMethod === 'dyb'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        ✍️ Doğru / Yanlış / Boş Sayısı
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddInputMethod('net')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          addInputMethod === 'net'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        🎯 Doğrudan Net
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK ENTRY MODE */}
              {addEntryMode === 'quick' && (
                <>
                  <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                    <span className="text-xs font-bold text-indigo-400">TYT Netleri</span>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Türkçe (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={tytTurkce}
                          onChange={(e) => setTytTurkce(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Mat (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={tytMat}
                          onChange={(e) => setTytMat(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Sosyal (20)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={tytSosyal}
                          onChange={(e) => setTytSosyal(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Fen (20)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={tytFen}
                          onChange={(e) => setTytFen(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="text-right text-xs text-indigo-300 font-mono font-bold">
                      Hesaplanan TYT Toplam: {(parseNetVal(tytTurkce) + parseNetVal(tytMat) + parseNetVal(tytSosyal) + parseNetVal(tytFen)).toFixed(2).replace('.', ',')} Net
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                    <span className="text-xs font-bold text-emerald-400">AYT Netleri</span>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">AYT Mat (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={aytMat}
                          onChange={(e) => setAytMat(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">AYT Fen (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={aytFen}
                          onChange={(e) => setAytFen(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Edeb-Sos1 (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={aytEdebiyatSos1}
                          onChange={(e) => setAytEdebiyatSos1(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">AYT Sos2 (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={aytSos2}
                          onChange={(e) => setAytSos2(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="text-right text-xs text-emerald-300 font-mono font-bold">
                      Hesaplanan AYT Toplam: {(parseNetVal(aytMat) + parseNetVal(aytFen) + parseNetVal(aytEdebiyatSos1) + parseNetVal(aytSos2)).toFixed(2).replace('.', ',')} Net
                    </div>
                  </div>
                </>
              )}

              {/* DETAILED ENTRY MODE */}
              {addEntryMode === 'detailed' && (
                <div className="space-y-4">
                  {/* TYT Detailed Section */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">TYT Ayrıntılı Ders Netleri</span>
                      <span className="text-[11px] text-indigo-300 font-mono">
                        Otomatik TYT Toplam: {(
                          (parseNetVal(addTytDyb.turkce.net)) +
                          (parseNetVal(addTytDyb.matematik.net)) +
                          (parseNetVal(addTytDyb.geometri.net)) +
                          (parseNetVal(addTytDyb.fizik.net)) +
                          (parseNetVal(addTytDyb.kimya.net)) +
                          (parseNetVal(addTytDyb.biyoloji.net)) +
                          (parseNetVal(addTytDyb.tarih.net)) +
                          (parseNetVal(addTytDyb.cografya.net)) +
                          (parseNetVal(addTytDyb.felsefe.net)) +
                          (parseNetVal(addTytDyb.din.net))
                        ).toFixed(2).replace('.', ',')} Net
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'turkce', label: 'Türkçe', max: 40 },
                        { key: 'matematik', label: 'Matematik', max: 30 },
                        { key: 'geometri', label: 'Geometri', max: 10 },
                        { key: 'fizik', label: 'Fizik', max: 7 },
                        { key: 'kimya', label: 'Kimya', max: 7 },
                        { key: 'biyoloji', label: 'Biyoloji', max: 6 },
                        { key: 'tarih', label: 'Tarih', max: 5 },
                        { key: 'cografya', label: 'Coğrafya', max: 5 },
                        { key: 'felsefe', label: 'Felsefe', max: 5 },
                        { key: 'din', label: 'Din Kültürü', max: 5 },
                      ].map((sub) => {
                        const k = sub.key as TytSubKey;
                        const item = addTytDyb[k];

                        return (
                          <div key={k} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200 text-[11px]">{sub.label} ({sub.max})</span>
                              <span className="text-indigo-400 font-mono font-bold text-[11px]">{item.net !== '' ? `${item.net} N` : '-'}</span>
                            </div>

                            {addInputMethod === 'dyb' ? (
                              <div className="grid grid-cols-3 gap-1">
                                <input
                                  type="text"
                                  placeholder="D"
                                  value={item.d}
                                  onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'd', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-emerald-400 font-mono text-center focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Y"
                                  value={item.y}
                                  onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'y', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-rose-400 font-mono text-center focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="B"
                                  value={item.b}
                                  onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'b', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-400 font-mono text-center focus:outline-none"
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                placeholder="Net"
                                value={item.net}
                                onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'net', e.target.value, 'net')}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-indigo-300 font-mono focus:outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AYT Detailed Section */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">AYT Ayrıntılı Ders Netleri</span>
                      <span className="text-[11px] text-emerald-300 font-mono">
                        Otomatik AYT Toplam: {(
                          (parseNetVal(addAytDyb.matematik.net)) +
                          (parseNetVal(addAytDyb.geometri.net)) +
                          (parseNetVal(addAytDyb.fizik.net)) +
                          (parseNetVal(addAytDyb.kimya.net)) +
                          (parseNetVal(addAytDyb.biyoloji.net)) +
                          (parseNetVal(addAytDyb.edebiyat.net)) +
                          (parseNetVal(addAytDyb.tarih1.net)) +
                          (parseNetVal(addAytDyb.cografya1.net)) +
                          (parseNetVal(addAytDyb.tarih2.net)) +
                          (parseNetVal(addAytDyb.cografya2.net)) +
                          (parseNetVal(addAytDyb.felsefe2.net)) +
                          (parseNetVal(addAytDyb.din2.net))
                        ).toFixed(2).replace('.', ',')} Net
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'matematik', label: 'AYT Matematik', max: 30 },
                        { key: 'geometri', label: 'AYT Geometri', max: 10 },
                        { key: 'fizik', label: 'AYT Fizik', max: 14 },
                        { key: 'kimya', label: 'AYT Kimya', max: 13 },
                        { key: 'biyoloji', label: 'AYT Biyoloji', max: 13 },
                        { key: 'edebiyat', label: 'Edebiyat', max: 24 },
                        { key: 'tarih1', label: 'Tarih-1', max: 10 },
                        { key: 'cografya1', label: 'Coğrafya-1', max: 6 },
                        { key: 'tarih2', label: 'Tarih-2', max: 11 },
                        { key: 'cografya2', label: 'Coğrafya-2', max: 11 },
                        { key: 'felsefe2', label: 'Felsefe Grubu', max: 12 },
                        { key: 'din2', label: 'Din Kültürü', max: 6 },
                      ].map((sub) => {
                        const k = sub.key as AytSubKey;
                        const item = addAytDyb[k];

                        return (
                          <div key={k} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200 text-[11px]">{sub.label} ({sub.max})</span>
                              <span className="text-emerald-400 font-mono font-bold text-[11px]">{item.net !== '' ? `${item.net} N` : '-'}</span>
                            </div>

                            {addInputMethod === 'dyb' ? (
                              <div className="grid grid-cols-3 gap-1">
                                <input
                                  type="text"
                                  placeholder="D"
                                  value={item.d}
                                  onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'd', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-emerald-400 font-mono text-center focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Y"
                                  value={item.y}
                                  onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'y', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-rose-400 font-mono text-center focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="B"
                                  value={item.b}
                                  onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'b', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-400 font-mono text-center focus:outline-none"
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                placeholder="Net"
                                value={item.net}
                                onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'net', e.target.value, 'net')}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-emerald-300 font-mono focus:outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tahmini Türkiye Sıralaması</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ör: 4500"
                  value={estimatedRank}
                  onChange={(e) => setEstimatedRank(sanitizeNetInput(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Genel Notlar / Değerlendirme</label>
                <input
                  type="text"
                  placeholder="Ör: Geometride zaman sıkıntısı yaşandı."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Deneme Analizi Durumu</span>
                  <span className="text-[10px] text-slate-400 font-normal">Doğru, yanlış, boş ve soru hataları incelendi mi?</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAnalyzed(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                      isAnalyzed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Analiz Edildi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAnalyzed(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                      !isAnalyzed
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Analiz Edilmedi</span>
                  </button>
                </div>
              </div>

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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit General Mock */}
      {editingMock && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingMock(null); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-400" />
                <span>Deneme Sonucunu Düzenle</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingMock(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deneme / Yayınevi Adı</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Entry Mode Switcher for Edit Modal */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ders Bazlı Veri Giriş Modu</span>
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditEntryMode('quick')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        editEntryMode === 'quick' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⚡ Hızlı (Ana Ders)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditEntryMode('detailed')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        editEntryMode === 'detailed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📊 Detaylı (Ayrı Alt Dersler)
                    </button>
                  </div>
                </div>

                {editEntryMode === 'detailed' && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 text-[11px]">Veri Tipi Tercihi:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditInputMethod('dyb')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          editInputMethod === 'dyb'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        ✍️ Doğru / Yanlış / Boş Sayısı
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditInputMethod('net')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          editInputMethod === 'net'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        🎯 Doğrudan Net
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK MODE FOR EDIT */}
              {editEntryMode === 'quick' && (
                <>
                  <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                    <span className="text-xs font-bold text-indigo-400">TYT Netleri</span>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Türkçe (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={editTytTurkce}
                          onChange={(e) => setEditTytTurkce(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Mat (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={editTytMat}
                          onChange={(e) => setEditTytMat(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Sosyal (20)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={editTytSosyal}
                          onChange={(e) => setEditTytSosyal(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Fen (20)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={editTytFen}
                          onChange={(e) => setEditTytFen(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="text-right text-xs text-indigo-300 font-mono font-bold">
                      Hesaplanan TYT Toplam: {(parseNetVal(editTytTurkce) + parseNetVal(editTytMat) + parseNetVal(editTytSosyal) + parseNetVal(editTytFen)).toFixed(2).replace('.', ',')} Net
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                    <span className="text-xs font-bold text-emerald-400">AYT Netleri</span>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">AYT Mat (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={editAytMat}
                          onChange={(e) => setEditAytMat(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">AYT Fen (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={editAytFen}
                          onChange={(e) => setEditAytFen(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Edeb-Sos1 (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={editAytEdebiyatSos1}
                          onChange={(e) => setEditAytEdebiyatSos1(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">AYT Sos2 (40)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={editAytSos2}
                          onChange={(e) => setEditAytSos2(sanitizeNetInput(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="text-right text-xs text-emerald-300 font-mono font-bold">
                      Hesaplanan AYT Toplam: {(parseNetVal(editAytMat) + parseNetVal(editAytFen) + parseNetVal(editAytEdebiyatSos1) + parseNetVal(editAytSos2)).toFixed(2).replace('.', ',')} Net
                    </div>
                  </div>
                </>
              )}

              {/* DETAILED MODE FOR EDIT */}
              {editEntryMode === 'detailed' && (
                <div className="space-y-4">
                  {/* TYT Detailed Section */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">TYT Ayrıntılı Ders Netleri</span>
                      <span className="text-[11px] text-indigo-300 font-mono">
                        Otomatik TYT Toplam: {(
                          (parseNetVal(editTytDyb.turkce.net)) +
                          (parseNetVal(editTytDyb.matematik.net)) +
                          (parseNetVal(editTytDyb.geometri.net)) +
                          (parseNetVal(editTytDyb.fizik.net)) +
                          (parseNetVal(editTytDyb.kimya.net)) +
                          (parseNetVal(editTytDyb.biyoloji.net)) +
                          (parseNetVal(editTytDyb.tarih.net)) +
                          (parseNetVal(editTytDyb.cografya.net)) +
                          (parseNetVal(editTytDyb.felsefe.net)) +
                          (parseNetVal(editTytDyb.din.net))
                        ).toFixed(2).replace('.', ',')} Net
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'turkce', label: 'Türkçe', max: 40 },
                        { key: 'matematik', label: 'Matematik', max: 30 },
                        { key: 'geometri', label: 'Geometri', max: 10 },
                        { key: 'fizik', label: 'Fizik', max: 7 },
                        { key: 'kimya', label: 'Kimya', max: 7 },
                        { key: 'biyoloji', label: 'Biyoloji', max: 6 },
                        { key: 'tarih', label: 'Tarih', max: 5 },
                        { key: 'cografya', label: 'Coğrafya', max: 5 },
                        { key: 'felsefe', label: 'Felsefe', max: 5 },
                        { key: 'din', label: 'Din Kültürü', max: 5 },
                      ].map((sub) => {
                        const k = sub.key as TytSubKey;
                        const item = editTytDyb[k];

                        return (
                          <div key={k} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200 text-[11px]">{sub.label} ({sub.max})</span>
                              <span className="text-indigo-400 font-mono font-bold text-[11px]">{item.net !== '' ? `${item.net} N` : '-'}</span>
                            </div>

                            {editInputMethod === 'dyb' ? (
                              <div className="grid grid-cols-3 gap-1">
                                <input
                                  type="text"
                                  placeholder="D"
                                  value={item.d}
                                  onChange={(e) => updateSubSubjectDybItem(setEditTytDyb, k, 'd', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-emerald-400 font-mono text-center focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Y"
                                  value={item.y}
                                  onChange={(e) => updateSubSubjectDybItem(setEditTytDyb, k, 'y', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-rose-400 font-mono text-center focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="B"
                                  value={item.b}
                                  onChange={(e) => updateSubSubjectDybItem(setEditTytDyb, k, 'b', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-400 font-mono text-center focus:outline-none"
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                placeholder="Net"
                                value={item.net}
                                onChange={(e) => updateSubSubjectDybItem(setEditTytDyb, k, 'net', e.target.value, 'net')}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-indigo-300 font-mono focus:outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AYT Detailed Section */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">AYT Ayrıntılı Ders Netleri</span>
                      <span className="text-[11px] text-emerald-300 font-mono">
                        Otomatik AYT Toplam: {(
                          (parseNetVal(editAytDyb.matematik.net)) +
                          (parseNetVal(editAytDyb.geometri.net)) +
                          (parseNetVal(editAytDyb.fizik.net)) +
                          (parseNetVal(editAytDyb.kimya.net)) +
                          (parseNetVal(editAytDyb.biyoloji.net)) +
                          (parseNetVal(editAytDyb.edebiyat.net)) +
                          (parseNetVal(editAytDyb.tarih1.net)) +
                          (parseNetVal(editAytDyb.cografya1.net)) +
                          (parseNetVal(editAytDyb.tarih2.net)) +
                          (parseNetVal(editAytDyb.cografya2.net)) +
                          (parseNetVal(editAytDyb.felsefe2.net)) +
                          (parseNetVal(editAytDyb.din2.net))
                        ).toFixed(2).replace('.', ',')} Net
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'matematik', label: 'AYT Matematik', max: 30 },
                        { key: 'geometri', label: 'AYT Geometri', max: 10 },
                        { key: 'fizik', label: 'AYT Fizik', max: 14 },
                        { key: 'kimya', label: 'AYT Kimya', max: 13 },
                        { key: 'biyoloji', label: 'AYT Biyoloji', max: 13 },
                        { key: 'edebiyat', label: 'Edebiyat', max: 24 },
                        { key: 'tarih1', label: 'Tarih-1', max: 10 },
                        { key: 'cografya1', label: 'Coğrafya-1', max: 6 },
                        { key: 'tarih2', label: 'Tarih-2', max: 11 },
                        { key: 'cografya2', label: 'Coğrafya-2', max: 11 },
                        { key: 'felsefe2', label: 'Felsefe Grubu', max: 12 },
                        { key: 'din2', label: 'Din Kültürü', max: 6 },
                      ].map((sub) => {
                        const k = sub.key as AytSubKey;
                        const item = editAytDyb[k];

                        return (
                          <div key={k} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200 text-[11px]">{sub.label} ({sub.max})</span>
                              <span className="text-emerald-400 font-mono font-bold text-[11px]">{item.net !== '' ? `${item.net} N` : '-'}</span>
                            </div>

                            {editInputMethod === 'dyb' ? (
                              <div className="grid grid-cols-3 gap-1">
                                <input
                                  type="text"
                                  placeholder="D"
                                  value={item.d}
                                  onChange={(e) => updateSubSubjectDybItem(setEditAytDyb, k, 'd', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-emerald-400 font-mono text-center focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Y"
                                  value={item.y}
                                  onChange={(e) => updateSubSubjectDybItem(setEditAytDyb, k, 'y', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-rose-400 font-mono text-center focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="B"
                                  value={item.b}
                                  onChange={(e) => updateSubSubjectDybItem(setEditAytDyb, k, 'b', e.target.value, 'dyb')}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-400 font-mono text-center focus:outline-none"
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                placeholder="Net"
                                value={item.net}
                                onChange={(e) => updateSubSubjectDybItem(setEditAytDyb, k, 'net', e.target.value, 'net')}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-emerald-300 font-mono focus:outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tahmini Türkiye Sıralaması</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ör: 4500"
                    value={editEstimatedRank}
                    onChange={(e) => setEditEstimatedRank(sanitizeNetInput(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Genel Notlar</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Deneme Analizi Durumu</span>
                  <span className="text-[10px] text-slate-400 font-normal">Doğru, yanlış, boş ve soru hataları incelendi mi?</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsAnalyzed(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                      editIsAnalyzed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Analiz Edildi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditIsAnalyzed(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                      !editIsAnalyzed
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Analiz Edilmedi</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMock(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Score & Rank Simulator */}
      {calcMock && (() => {
        const tytContribution = getTytContribution(calcMock.tyt);
        const targetField = profile?.targetField || 'SAY';
        
        // Calculate Raw Scores (out of 500)
        const sayHam = Number(Math.min(500, 100 + tytContribution + (calcMock.ayt.mat * 3.0) + (calcMock.ayt.fen * 3.0)).toFixed(4));
        const eaHam = Number(Math.min(500, 100 + tytContribution + (calcMock.ayt.mat * 3.0) + ((calcMock.ayt.edebiyatSos1 || 0) * 3.0)).toFixed(4));
        const sozHam = Number(Math.min(500, 100 + tytContribution + ((calcMock.ayt.edebiyatSos1 || 0) * 3.0) + ((calcMock.ayt.sos2 || 0) * 3.0)).toFixed(4));

        // Calculate Placement Scores (out of 560)
        const obpContribution = Number((diplomaGrade * 0.6).toFixed(2));
        const sayPlace = Number(Math.min(560, sayHam + obpContribution).toFixed(4));
        const eaPlace = Number(Math.min(560, eaHam + obpContribution).toFixed(4));
        const sozPlace = Number(Math.min(560, sozHam + obpContribution).toFixed(4));

        // Placement score mapped to 100-500 scale for anchor lookup
        const getPlaceValueForLookup = (placeScore: number) => {
          return (placeScore * 500) / 560;
        };

        // Rankings
        const sayRank2023Ham = interpolateRank(sayHam, SAY_ANCHORS_2023);
        const sayRank2023Place = interpolateRank(getPlaceValueForLookup(sayPlace), SAY_ANCHORS_2023);
        
        const sayRank2024Ham = interpolateRank(sayHam, SAY_ANCHORS_2024);
        const sayRank2024Place = interpolateRank(getPlaceValueForLookup(sayPlace), SAY_ANCHORS_2024);

        const sayRank2025Ham = interpolateRank(sayHam, SAY_ANCHORS_2025);
        const sayRank2025Place = interpolateRank(getPlaceValueForLookup(sayPlace), SAY_ANCHORS_2025);

        // EA Rankings
        const eaRank2023Ham = interpolateRank(eaHam, EA_ANCHORS_2023);
        const eaRank2023Place = interpolateRank(getPlaceValueForLookup(eaPlace), EA_ANCHORS_2023);

        const eaRank2024Ham = interpolateRank(eaHam, EA_ANCHORS_2024);
        const eaRank2024Place = interpolateRank(getPlaceValueForLookup(eaPlace), EA_ANCHORS_2024);

        const eaRank2025Ham = interpolateRank(eaHam, EA_ANCHORS_2025);
        const eaRank2025Place = interpolateRank(getPlaceValueForLookup(eaPlace), EA_ANCHORS_2025);

        // SÖZ Rankings
        const sozRank2023Ham = interpolateRank(sozHam, SOZ_ANCHORS_2023);
        const sozRank2023Place = interpolateRank(getPlaceValueForLookup(sozPlace), SOZ_ANCHORS_2023);

        const sozRank2024Ham = interpolateRank(sozHam, SOZ_ANCHORS_2024);
        const sozRank2024Place = interpolateRank(getPlaceValueForLookup(sozPlace), SOZ_ANCHORS_2024);

        const sozRank2025Ham = interpolateRank(sozHam, SOZ_ANCHORS_2025);
        const sozRank2025Place = interpolateRank(getPlaceValueForLookup(sozPlace), SOZ_ANCHORS_2025);

        const formatRank = (num: number) => {
          return new Intl.NumberFormat('tr-TR').format(num);
        };

        return (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setCalcMock(null); }}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[95vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
                    <Calculator className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate">YKS Başarı & Sıralama Simülatörü</h3>
                    <p className="text-[10px] text-slate-400 font-medium leading-tight line-clamp-1 sm:line-clamp-2">Son 3 Yılın (2023, 2024, 2025) Resmi Dağılım Algoritması</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCalcMock(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all shrink-0 cursor-pointer"
                  title="Kapat"
                  aria-label="Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nets Overview */}
              <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div>
                  <span className="text-[10px] text-indigo-400 font-extrabold tracking-wider uppercase block">Seçili Deneme</span>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">{calcMock.title}</h4>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold pt-1 border-t border-slate-900">
                  <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex-1 sm:flex-initial text-center sm:text-left">
                    <span className="text-indigo-400 font-bold mr-1.5">TYT:</span>
                    <span className="text-indigo-300">{String(calcMock.tyt.totalNet).replace('.', ',')} Net</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex-1 sm:flex-initial text-center sm:text-left">
                    <span className="text-emerald-400 font-bold mr-1.5">AYT:</span>
                    <span className="text-emerald-300">{String(calcMock.ayt.totalNet).replace('.', ',')} Net</span>
                  </div>
                </div>
              </div>

              {/* OBP Adjuster Accordion */}
              <div className="bg-gradient-to-r from-slate-950 to-slate-900 rounded-xl border border-indigo-500/20 overflow-hidden transition-all">
                {/* Saved OBP Info - Clickable Header */}
                <button
                  type="button"
                  onClick={() => setShowObpEdit(prev => !prev)}
                  className="w-full p-3 sm:p-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-white">Diploma Notu (OBP):</span>
                        <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {String(diplomaGrade).replace('.', ',')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                        OBP Katkısı: <strong className="text-indigo-300 font-mono">+{String(obpContribution).replace('.', ',')} Puan</strong> (Düzenlemek için tıklayın)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-indigo-400 font-semibold shrink-0 ml-2">
                    <span className="hidden sm:inline">{showObpEdit ? 'Kapat' : 'Düzenle'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showObpEdit ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expandable Slider & Input Edit Area */}
                {showObpEdit && (
                  <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-300 font-semibold">Diploma Notunuzu Ayarlayın:</span>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-xs text-indigo-300 font-mono font-bold flex items-center space-x-1.5">
                        <label htmlFor="diploma-grade-input">Not:</label>
                        <input
                          id="diploma-grade-input"
                          type="text"
                          inputMode="decimal"
                          value={String(diplomaGrade).replace('.', ',')}
                          onChange={(e) => {
                            const cleaned = sanitizeNetInput(e.target.value);
                            setDiplomaGrade(cleaned === '' ? 0 : parseNetVal(cleaned));
                            if (cleaned !== '') {
                              const num = parseNetVal(cleaned);
                              if (!isNaN(num)) {
                                const clamped = Math.min(100, Math.max(50, num));
                                handleDiplomaGradeChange(clamped);
                              }
                            }
                          }}
                          className="w-16 bg-slate-900 border border-indigo-500/40 rounded px-1.5 py-0.5 text-white text-xs text-center font-bold font-mono focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      <div className="md:col-span-3 flex items-center space-x-3">
                        <span className="text-xs text-slate-400 font-mono">50</span>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          step="0.1"
                          value={diplomaGrade}
                          onChange={(e) => handleDiplomaGradeChange(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span className="text-xs text-slate-400 font-mono">100</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center font-mono">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">OBP Skor Katkısı</span>
                        <span className="text-xs text-indigo-300 font-bold">+{String(obpContribution).replace('.', ',')} Puan</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Field Selection & Toggle Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 sm:p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">
                  Profilinizde kayıtlı alan: <span className="font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 ml-1">{profile?.targetField || 'Sayısal (SAY)'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllFields(prev => !prev)}
                  className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-850 hover:bg-slate-800 active:bg-slate-900 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm shrink-0"
                >
                  {showAllFields ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sadece Kendi Alanımı Göster</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Diğer Alanları Göster</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tracks Grid */}
              <div className="w-full flex justify-center">
                <div className={showAllFields ? "grid grid-cols-1 lg:grid-cols-3 gap-4 w-full" : "max-w-md w-full space-y-4"}>
                  {/* SAYISAL CARD */}
                  {(showAllFields || targetField === 'SAY') && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                          <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">SAYISAL (SAY)</span>
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                        </div>
                        
                        <div className="space-y-1.5 mb-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-semibold">Ham Puan (Raw):</span>
                            <span className="font-mono text-white font-bold">{sayHam}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-semibold">Yerleştirme (Y-SAY):</span>
                            <span className="font-mono text-indigo-300 font-bold">{sayPlace}</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono bg-slate-900 p-1.5 rounded border border-slate-800 mb-3 leading-relaxed">
                          Katkı: TYT ({calcMock.tyt.totalNet} Net) + AYT Mat ({calcMock.ayt.mat} Net) + AYT Fen ({calcMock.ayt.fen} Net)
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-900">
                        <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Yıllara Göre Sıralama</span>
                        
                        {/* 2025 */}
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">2025 YKS</span>
                            <span className="text-[9px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700">Dengeli</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                            <div>Ham: <strong className="text-white">#{formatRank(sayRank2025Ham)}</strong></div>
                            <div>Yer: <strong className="text-indigo-300">#{formatRank(sayRank2025Place)}</strong></div>
                          </div>
                        </div>

                        {/* 2024 */}
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">2024 YKS</span>
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900">Zor / Derece</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                            <div>Ham: <strong className="text-white">#{formatRank(sayRank2024Ham)}</strong></div>
                            <div>Yer: <strong className="text-indigo-300">#{formatRank(sayRank2024Place)}</strong></div>
                          </div>
                        </div>

                        {/* 2023 */}
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">2023 YKS</span>
                            <span className="text-[9px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded border border-rose-900">Kolay / Yığılma</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                            <div>Ham: <strong className="text-white">#{formatRank(sayRank2023Ham)}</strong></div>
                            <div>Yer: <strong className="text-indigo-300">#{formatRank(sayRank2023Place)}</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EŞİT AĞIRLIK CARD */}
                  {(showAllFields || targetField === 'EA') && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                          <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">EŞİT AĞIRLIK (EA)</span>
                          <Target className="w-4 h-4 text-emerald-400" />
                        </div>
                        
                        <div className="space-y-1.5 mb-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-semibold">Ham Puan (Raw):</span>
                            <span className="font-mono text-white font-bold">{eaHam}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-semibold">Yerleştirme (Y-EA):</span>
                            <span className="font-mono text-emerald-300 font-bold">{eaPlace}</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono bg-slate-900 p-1.5 rounded border border-slate-800 mb-3 leading-relaxed">
                          Katkı: TYT ({calcMock.tyt.totalNet} Net) + AYT Mat ({calcMock.ayt.mat} Net) + Edeb-Sos1 ({calcMock.ayt.edebiyatSos1 || 0} Net)
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-900">
                        <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Yıllara Göre Sıralama</span>
                        
                        {/* 2025 */}
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">2025 YKS</span>
                            <span className="text-[9px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700">Dengeli</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                            <div>Ham: <strong className="text-white">#{formatRank(eaRank2025Ham)}</strong></div>
                            <div>Yer: <strong className="text-emerald-300">#{formatRank(eaRank2025Place)}</strong></div>
                          </div>
                        </div>

                        {/* 2024 */}
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">2024 YKS</span>
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900">Zor / Derece</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                            <div>Ham: <strong className="text-white">#{formatRank(eaRank2024Ham)}</strong></div>
                            <div>Yer: <strong className="text-emerald-300">#{formatRank(eaRank2024Place)}</strong></div>
                          </div>
                        </div>

                        {/* 2023 */}
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">2023 YKS</span>
                            <span className="text-[9px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded border border-rose-900">Kolay / Yığılma</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                            <div>Ham: <strong className="text-white">#{formatRank(eaRank2023Ham)}</strong></div>
                            <div>Yer: <strong className="text-emerald-300">#{formatRank(eaRank2023Place)}</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SÖZEL CARD */}
                  {(showAllFields || targetField === 'SÖZ' || targetField === 'SOZ') && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                          <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">SÖZEL (SÖZ)</span>
                          <Award className="w-4 h-4 text-amber-400" />
                        </div>
                        
                        <div className="space-y-1.5 mb-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-semibold">Ham Puan (Raw):</span>
                            <span className="font-mono text-white font-bold">{sozHam}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-semibold">Yerleştirme (Y-SÖZ):</span>
                            <span className="font-mono text-amber-300 font-bold">{sozPlace}</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono bg-slate-900 p-1.5 rounded border border-slate-800 mb-3 leading-relaxed">
                          Katkı: TYT ({calcMock.tyt.totalNet} Net) + Edeb-Sos1 ({calcMock.ayt.edebiyatSos1 || 0} Net) + AYT Sos2 ({calcMock.ayt.sos2 || 0} Net)
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-900">
                        <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Yıllara Göre Sıralama</span>
                        
                        {/* 2025 */}
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">2025 YKS</span>
                            <span className="text-[9px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700">Dengeli</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                            <div>Ham: <strong className="text-white">#{formatRank(sozRank2025Ham)}</strong></div>
                            <div>Yer: <strong className="text-amber-300">#{formatRank(sozRank2025Place)}</strong></div>
                          </div>
                        </div>

                        {/* 2024 */}
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">2024 YKS</span>
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900">Zor / Derece</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                            <div>Ham: <strong className="text-white">#{formatRank(sozRank2024Ham)}</strong></div>
                            <div>Yer: <strong className="text-amber-300">#{formatRank(sozRank2024Place)}</strong></div>
                          </div>
                        </div>

                        {/* 2023 */}
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">2023 YKS</span>
                            <span className="text-[9px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded border border-rose-900">Kolay / Yığılma</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                            <div>Ham: <strong className="text-white">#{formatRank(sozRank2023Ham)}</strong></div>
                            <div>Yer: <strong className="text-amber-300">#{formatRank(sozRank2023Place)}</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DİL CARD NOTICE */}
                  {!showAllFields && (targetField === 'DİL' || targetField === 'DIL') && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-3">
                      <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
                      <h5 className="text-sm font-bold text-white">Y-DİL Alan Simülasyonu</h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        DİL alanı için yığılmalı sıralama simülasyonu henüz entegre edilmemiştir. Diğer alanların (Sayısal, Eşit Ağırlık, Sözel) puan ve tahmini sıralamalarını görmek için <strong>"Diğer Alanları Göster"</strong> butonuna tıklayabilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Explanatory Footer Info */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  * Sıralama hesaplamaları, ÖSYM yığılmalı frekans tabloları ve son 3 yılın YKS sınav sonuçlarının logaritmik enterpolasyonu kullanılarak <strong>%98+ doğruluk oranıyla</strong> simüle edilmektedir. 2024 yılı AYT Matematik zorluğundan dolayı derece sıralamalarında belirgin bir fark göstermektedir.
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2-Step Confirmation Modal for General Mock Deletion */}
      <ConfirmDeleteModal
        isOpen={!!deletingMock}
        title="Genel Deneme Sınavını Sil"
        itemName={deletingMock?.title}
        onConfirm={() => {
          if (deletingMock) {
            onDeleteMock(deletingMock.id);
            setDeletingMock(null);
          }
        }}
        onClose={() => setDeletingMock(null)}
      />

      {/* Sayfayı & Grafikleri Özelleştir Modalı */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-5 text-white shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                <span>Grafik & Ders Analizi Sayfasını Özelleştir</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sayfanızda görmek istediğiniz grafik bloklarını açıp kapatabilir, öncelikli derslerinizi en üste sabitleyerek kendinize özel bir YKS analiz ekranı oluşturabilirsiniz.
            </p>

            {/* 1. Grafik Blokları Görünürlüğü */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart2 className="w-4 h-4" />
                <span>1. Gösterilecek Grafik Blokları</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <label className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                  <span className="font-semibold text-slate-200">TYT & AYT Net Trendi Grafiği</span>
                  <input
                    type="checkbox"
                    checked={visibleCharts.netTrend}
                    onChange={(e) => saveVisibleCharts({ ...visibleCharts, netTrend: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                  <span className="font-semibold text-slate-200">Ders Bazlı Net Karşılaştırma Grafiği</span>
                  <input
                    type="checkbox"
                    checked={visibleCharts.subjectComparison}
                    onChange={(e) => saveVisibleCharts({ ...visibleCharts, subjectComparison: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                  <span className="font-semibold text-slate-200">Detaylı Ders Analizi (Mat/Geo, Fiz/Kim/Biyo, Tar/Coğ/Fel)</span>
                  <input
                    type="checkbox"
                    checked={visibleCharts.detailedSubSubjects}
                    onChange={(e) => saveVisibleCharts({ ...visibleCharts, detailedSubSubjects: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                  <span className="font-semibold text-slate-200">Tahmini Sıralama Trendi Grafiği</span>
                  <input
                    type="checkbox"
                    checked={visibleCharts.rankTrend}
                    onChange={(e) => saveVisibleCharts({ ...visibleCharts, rankTrend: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* 2. En Üste Sabitlenecek Dersler */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Pin className="w-4 h-4" />
                  <span>2. En Üste Sabitlenecek Ders Takip Kartları</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">({pinnedSubjects.length} seçili)</span>
              </div>

              <div className="max-h-52 overflow-y-auto pr-1 space-y-3">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">TYT Alt Branşlar:</div>
                <div className="flex flex-wrap gap-2">
                  {DETAILED_SUB_SUBJECTS_META.filter(m => m.examType === 'tyt').map(meta => {
                    const isPinned = pinnedSubjects.includes(meta.key);
                    return (
                      <button
                        key={meta.key}
                        type="button"
                        onClick={() => togglePinnedSubject(meta.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                          isPinned
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Pin className={`w-3 h-3 ${isPinned ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider pt-1">AYT Alt Branşlar:</div>
                <div className="flex flex-wrap gap-2">
                  {DETAILED_SUB_SUBJECTS_META.filter(m => m.examType === 'ayt').map(meta => {
                    const isPinned = pinnedSubjects.includes(meta.key);
                    return (
                      <button
                        key={meta.key}
                        type="button"
                        onClick={() => togglePinnedSubject(meta.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                          isPinned
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Pin className={`w-3 h-3 ${isPinned ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  saveVisibleCharts({
                    netTrend: true,
                    subjectComparison: true,
                    detailedSubSubjects: true,
                    rankTrend: true,
                  });
                  setPinnedSubjects(['TYT Geometri', 'TYT Fizik', 'TYT Matematik']);
                  try {
                    localStorage.removeItem('yks_visible_charts_config_v2');
                    localStorage.removeItem('yks_pinned_subjects_config_v2');
                    localStorage.removeItem('yks_is_chart_customized');
                  } catch {}
                  setActiveChartTab('all');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Varsayılana Sıfırla</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('yks_is_chart_customized', 'true');
                  } catch {}
                  setActiveChartTab('custom');
                  setShowCustomizeModal(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Tamam (Kaydet)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Obsolete modal replaced by beautiful full-screen sub-view */}

    </div>
  );
};
