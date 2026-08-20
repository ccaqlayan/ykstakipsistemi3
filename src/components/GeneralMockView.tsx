import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus,
  Award,
  GraduationCap,
  Sparkles,
  BarChart2,
  Target
} from 'lucide-react';
import { GeneralMockExam, StudentProfile, TytDetails, AytDetails, SubSubjectScore, InstitutionalMockExam, MockExamType } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { MockAddModal } from './mocks/MockAddModal';
import { MockEditModal } from './mocks/MockEditModal';
import { MockRankSimulatorModal } from './mocks/MockRankSimulatorModal';
import { MockCustomizeModal } from './mocks/MockCustomizeModal';
import { MockInstitutionalDetailView } from './mocks/MockInstitutionalDetailView';
import { MockChartsSection } from './mocks/MockChartsSection';
import { MockTableSection, getEffectiveMockExamType } from './mocks/MockTableSection';









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
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [activeGeneralTab, setActiveGeneralTab] = useState<'analytics' | 'history'>('analytics');
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
    return 'net';
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
  const [addExamType, setAddExamType] = useState<MockExamType>(() => {
    return (profile?.targetField === 'DİL' || (profile?.targetField as string) === 'DIL') ? 'DIL' : 'TYT';
  });
  const [addEntryMode, setAddEntryMode] = useState<'quick' | 'detailed'>('quick');
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

  // YDT Net & DYB (ADD)
  const [ydtNet, setYdtNet] = useState<number | string>('');
  const [ydtDyb, setYdtDyb] = useState<{ d: string; y: string; b: string; net: string }>({ d: '', y: '', b: '', net: '' });
  const [ydtLanguage, setYdtLanguage] = useState<string>('İngilizce');

  // Detailed Nets (ADD)
  const [addTytDyb, setAddTytDyb] = useState<Record<TytSubKey, DybSubSubjectItem>>(() => createInitialSubMap(TYT_SUB_KEYS));
  const [addAytDyb, setAddAytDyb] = useState<Record<AytSubKey, DybSubSubjectItem>>(() => createInitialSubMap(AYT_SUB_KEYS));

  const [estimatedRank, setEstimatedRank] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false);

  // Sync addExamType when targetField changes if user hasn't typed
  useEffect(() => {
    if (profile?.targetField === 'DİL' || (profile?.targetField as string) === 'DIL') {
      setAddExamType('DIL');
    }
  }, [profile?.targetField]);

  const resetAddForm = () => {
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setAddExamType((profile?.targetField === 'DİL' || (profile?.targetField as string) === 'DIL') ? 'DIL' : 'TYT');
    setAddEntryMode('quick');
    setAddInputMethod('dyb');
    setTytTurkce('');
    setTytMat('');
    setTytSosyal('');
    setTytFen('');
    setAytMat('');
    setAytFen('');
    setAytEdebiyatSos1('');
    setAytSos2('');
    setYdtNet('');
    setYdtDyb({ d: '', y: '', b: '', net: '' });
    setYdtLanguage('İngilizce');
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
  const [editExamType, setEditExamType] = useState<MockExamType>('TYT');
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

  // YDT Net & DYB (EDIT)
  const [editYdtNet, setEditYdtNet] = useState<number | string>('');
  const [editYdtDyb, setEditYdtDyb] = useState<{ d: string; y: string; b: string; net: string }>({ d: '', y: '', b: '', net: '' });
  const [editYdtLanguage, setEditYdtLanguage] = useState<string>('İngilizce');

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
    const resolvedType = getEffectiveMockExamType(mock);
    setEditExamType(mock.examType || resolvedType);
    setEditTytTurkce(mock.tyt.turkce ?? '');
    setEditTytMat(mock.tyt.mat ?? '');
    setEditTytSosyal(mock.tyt.sosyal ?? '');
    setEditTytFen(mock.tyt.fen ?? '');
    setEditAytMat(mock.ayt.mat ?? '');
    setEditAytFen(mock.ayt.fen ?? '');
    setEditAytEdebiyatSos1(mock.ayt.edebiyatSos1 ?? '');
    setEditAytSos2(mock.ayt.sos2 ?? '');

    if (mock.ydt) {
      setEditYdtNet(mock.ydt.net !== undefined ? String(mock.ydt.net).replace('.', ',') : '');
      setEditYdtDyb({
        d: mock.ydt.correct !== undefined ? String(mock.ydt.correct) : '',
        y: mock.ydt.wrong !== undefined ? String(mock.ydt.wrong) : '',
        b: mock.ydt.empty !== undefined ? String(mock.ydt.empty) : '',
        net: mock.ydt.net !== undefined ? String(mock.ydt.net).replace('.', ',') : ''
      });
      setEditYdtLanguage(mock.ydt.language || 'İngilizce');
    } else {
      setEditYdtNet('');
      setEditYdtDyb({ d: '', y: '', b: '', net: '' });
      setEditYdtLanguage('İngilizce');
    }

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

    let ydtObj: { net: number; correct?: number; wrong?: number; empty?: number; language?: string } | undefined = undefined;
    if (editExamType === 'DIL' || editExamType === 'TYT_DIL') {
      if (editEntryMode === 'detailed') {
        const dVal = editYdtDyb.d !== '' ? parseNetVal(editYdtDyb.d) : undefined;
        const yVal = editYdtDyb.y !== '' ? parseNetVal(editYdtDyb.y) : undefined;
        const bVal = editYdtDyb.b !== '' ? parseNetVal(editYdtDyb.b) : undefined;
        const netVal = editYdtDyb.net !== '' ? parseNetVal(editYdtDyb.net) : Number(((dVal || 0) - (yVal || 0) / 4).toFixed(2));
        ydtObj = {
          net: netVal,
          correct: dVal,
          wrong: yVal,
          empty: bVal,
          language: editYdtLanguage || 'İngilizce'
        };
      } else {
        ydtObj = {
          net: parseNetVal(editYdtNet),
          language: editYdtLanguage || 'İngilizce'
        };
      }
    }

    const tytTotal = (editExamType === 'AYT' || editExamType === 'DIL') ? 0 : tTurkce + tMat + tSosyal + tFen;
    const aytTotal = (editExamType === 'TYT' || editExamType === 'DIL' || editExamType === 'TYT_DIL') ? 0 : aMat + aFen + aEdeb + aSos2;

    onUpdateMock({
      ...editingMock,
      title: editTitle.trim(),
      date: editDate,
      examType: editExamType,
      tyt: {
        turkce: (editExamType === 'AYT' || editExamType === 'DIL') ? 0 : tTurkce,
        mat: (editExamType === 'AYT' || editExamType === 'DIL') ? 0 : tMat,
        sosyal: (editExamType === 'AYT' || editExamType === 'DIL') ? 0 : tSosyal,
        fen: (editExamType === 'AYT' || editExamType === 'DIL') ? 0 : tFen,
        totalNet: Number(tytTotal.toFixed(2)),
        details: (editExamType === 'AYT' || editExamType === 'DIL') ? undefined : tytDetailsObj
      },
      ayt: {
        mat: (editExamType === 'TYT' || editExamType === 'DIL' || editExamType === 'TYT_DIL') ? 0 : aMat,
        fen: (editExamType === 'TYT' || editExamType === 'DIL' || editExamType === 'TYT_DIL') ? 0 : aFen,
        edebiyatSos1: (editExamType === 'TYT' || editExamType === 'DIL' || editExamType === 'TYT_DIL') ? 0 : aEdeb,
        sos2: (editExamType === 'TYT' || editExamType === 'DIL' || editExamType === 'TYT_DIL') ? 0 : aSos2,
        totalNet: Number(aytTotal.toFixed(2)),
        details: (editExamType === 'TYT' || editExamType === 'DIL' || editExamType === 'TYT_DIL') ? undefined : aytDetailsObj
      },
      ydt: ydtObj,
      estimatedRank: editEstimatedRank === '' ? undefined : parseNetVal(editEstimatedRank),
      notes: editNotes,
      isAnalyzed: editIsAnalyzed
    });

    setSuccessToast(`"${editTitle.trim()}" deneme sınavı başarıyla güncellendi!`);
    setTimeout(() => setSuccessToast(null), 3500);
    setEditingMock(null);
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

    let ydtObj: { net: number; correct?: number; wrong?: number; empty?: number; language?: string } | undefined = undefined;
    if (addExamType === 'DIL' || addExamType === 'TYT_DIL') {
      if (addEntryMode === 'detailed') {
        const dVal = ydtDyb.d !== '' ? parseNetVal(ydtDyb.d) : undefined;
        const yVal = ydtDyb.y !== '' ? parseNetVal(ydtDyb.y) : undefined;
        const bVal = ydtDyb.b !== '' ? parseNetVal(ydtDyb.b) : undefined;
        const netVal = ydtDyb.net !== '' ? parseNetVal(ydtDyb.net) : Number(((dVal || 0) - (yVal || 0) / 4).toFixed(2));
        ydtObj = {
          net: netVal,
          correct: dVal,
          wrong: yVal,
          empty: bVal,
          language: ydtLanguage || 'İngilizce'
        };
      } else {
        ydtObj = {
          net: parseNetVal(ydtNet),
          language: ydtLanguage || 'İngilizce'
        };
      }
    }

    const tytTotal = (addExamType === 'AYT' || addExamType === 'DIL') ? 0 : tTurkce + tMat + tSosyal + tFen;
    const aytTotal = (addExamType === 'TYT' || addExamType === 'DIL' || addExamType === 'TYT_DIL') ? 0 : aMat + aFen + aEdeb + aSos2;

    onAddMock({
      title: title.trim(),
      date,
      examType: addExamType,
      tyt: {
        turkce: (addExamType === 'AYT' || addExamType === 'DIL') ? 0 : tTurkce,
        mat: (addExamType === 'AYT' || addExamType === 'DIL') ? 0 : tMat,
        sosyal: (addExamType === 'AYT' || addExamType === 'DIL') ? 0 : tSosyal,
        fen: (addExamType === 'AYT' || addExamType === 'DIL') ? 0 : tFen,
        totalNet: Number(tytTotal.toFixed(2)),
        details: (addExamType === 'AYT' || addExamType === 'DIL') ? undefined : tytDetailsObj
      },
      ayt: {
        mat: (addExamType === 'TYT' || addExamType === 'DIL' || addExamType === 'TYT_DIL') ? 0 : aMat,
        fen: (addExamType === 'TYT' || addExamType === 'DIL' || addExamType === 'TYT_DIL') ? 0 : aFen,
        edebiyatSos1: (addExamType === 'TYT' || addExamType === 'DIL' || addExamType === 'TYT_DIL') ? 0 : aEdeb,
        sos2: (addExamType === 'TYT' || addExamType === 'DIL' || addExamType === 'TYT_DIL') ? 0 : aSos2,
        totalNet: Number(aytTotal.toFixed(2)),
        details: (addExamType === 'TYT' || addExamType === 'DIL' || addExamType === 'TYT_DIL') ? undefined : aytDetailsObj
      },
      ydt: ydtObj,
      estimatedRank: estimatedRank === '' ? undefined : parseNetVal(estimatedRank),
      notes,
      isAnalyzed
    });

    // Contextual motivation trigger with net comparison
    const prevMocks = [...generalMocks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const prevTytNet = prevMocks.find(m => (m.tyt?.totalNet || 0) > 0)?.tyt?.totalNet;
    const prevAytNet = prevMocks.find(m => (m.ayt?.totalNet || 0) > 0)?.ayt?.totalNet;
    const prevYdtNet = prevMocks.find(m => (m.ydt?.net !== undefined && Number(m.ydt.net) > 0))?.ydt?.net;

    if (addExamType === 'DIL') {
      const currentYdt = ydtObj?.net || 0;
      window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
        detail: {
          type: 'mock_added',
          payload: {
            examType: 'DIL',
            newNet: currentYdt,
            oldNet: prevYdtNet || 0,
            hasPrevious: prevYdtNet !== undefined && Number(prevYdtNet) > 0
          }
        }
      }));
    } else if (addExamType === 'TYT_DIL') {
      const currentYdt = ydtObj?.net || 0;
      window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
        detail: {
          type: 'mock_added',
          payload: {
            examType: 'TYT_DIL',
            tytNet: tytTotal,
            ydtNet: currentYdt,
            newNet: currentYdt,
            oldNet: prevYdtNet || 0,
            hasPrevious: prevYdtNet !== undefined && Number(prevYdtNet) > 0
          }
        }
      }));
    } else if (addExamType === 'TYT_AYT') {
      window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
        detail: {
          type: 'mock_added',
          payload: {
            examType: 'TYT_AYT',
            tytNet: tytTotal,
            aytNet: aytTotal,
            newNet: aytTotal,
            oldNet: prevAytNet || 0,
            hasPrevious: prevAytNet !== undefined && Number(prevAytNet) > 0
          }
        }
      }));
    } else if (addExamType === 'AYT' || (aytTotal > 0 && tytTotal === 0)) {
      window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
        detail: {
          type: 'mock_added',
          payload: {
            examType: 'AYT',
            newNet: aytTotal,
            oldNet: prevAytNet || 0,
            hasPrevious: prevAytNet !== undefined && Number(prevAytNet) > 0
          }
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
        detail: {
          type: 'mock_added',
          payload: {
            examType: 'TYT',
            newNet: tytTotal,
            oldNet: prevTytNet || 0,
            hasPrevious: prevTytNet !== undefined && Number(prevTytNet) > 0
          }
        }
      }));
    }

    setSuccessToast(`"${title.trim()}" deneme sınavı başarıyla kaydedildi!`);
    setTimeout(() => setSuccessToast(null), 3500);

    resetAddForm();
    setShowAddModal(false);
  };

  // Prepare chart data (chronological date ascending for trend line)
  const sortedByDateMocks = [...generalMocks].sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return dateA - dateB;
  });

  // Convert institutional mocks to GeneralMockExam-compatible chart data
  const institutionalAsMocks: GeneralMockExam[] = React.useMemo(() => {
    return [...institutionalMocks]
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
      .map(exam => {
        const getNet = (name: string) =>
          exam.subjects.find(s => s.subjectName.toLowerCase().includes(name.toLowerCase()))?.net ?? 0;

        const tytTurkce = getNet('Türkçe');
        const tytMat = getNet('TYT Mat') || getNet('Temel Mat');
        const tytFen = getNet('TYT Fen') || getNet('Fen Bil');
        const tytSosyal = getNet('TYT Sos') || getNet('Sosyal Bil');
        const aytMat = getNet('AYT Mat') || getNet('Matematik');
        const aytFen = getNet('AYT Fen') || getNet('Fen Bil') || 0;
        const aytEdeb = getNet('Edebiyat') || getNet('AYT Ed') || 0;
        const aytSos2 = getNet('AYT Sos') || getNet('Sos-2') || 0;

        const sayScore = exam.scores?.sayScore ?? 0;
        const eaScore = exam.scores?.eaScore ?? 0;
        const sozScore = exam.scores?.sozScore ?? 0;
        const estimatedScore = sayScore || eaScore || sozScore || undefined;

        return {
          id: exam.id,
          title: exam.examTitle,
          date: exam.examDate,
          tyt: {
            turkce: tytTurkce,
            mat: tytMat,
            fen: tytFen,
            sosyal: tytSosyal,
            totalNet: Number((tytTurkce + tytMat + tytFen + tytSosyal).toFixed(2)),
          },
          ayt: {
            mat: aytMat,
            fen: aytFen,
            edebiyatSos1: aytEdeb,
            sos2: aytSos2,
            totalNet: Number((aytMat + aytFen + aytEdeb + aytSos2).toFixed(2)),
          },
          estimatedRank: estimatedScore,
          notes: '',
          isAnalyzed: false,
        } as GeneralMockExam;
      });
  }, [institutionalMocks]);

  // Active data source: switch between individual and institutional based on tab
  const activeSourceMocks = mockListTab === 'institutional' ? institutionalAsMocks : sortedByDateMocks;

  const filteredByCountMocks = mockCountFilter === '7'
    ? activeSourceMocks.slice(-7)
    : mockCountFilter === '30'
    ? activeSourceMocks.slice(-30)
    : activeSourceMocks;

  const chartData = filteredByCountMocks.map((m) => {
    const tytNet = Number(m.tyt?.totalNet) || 0;
    const aytNet = Number(m.ayt?.totalNet) || 0;
    const dilNet = (m.ydt?.net !== undefined && Number(m.ydt.net) > 0) ? Number(m.ydt.net) : null;

    return {
      id: m.id,
      name: m.title.length > 14 ? m.title.substring(0, 14) + '...' : m.title,
      fullTitle: m.title,
      date: m.date,
      TYT_Net: tytNet > 0 ? tytNet : null,
      AYT_Net: aytNet > 0 ? aytNet : null,
      DIL_Net: dilNet,
      Hedef_TYT: profile.targetTYTNet,
      Hedef_AYT: profile.targetAYTNet
    };
  });

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

  const sortedGeneralMocks = [...(mockListTab === 'institutional' ? institutionalAsMocks : generalMocks)].sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const displayUniversity = profile?.targetUniversity || 'İstanbul Teknik Üniversitesi (İTÜ)';

  if (selectedInstitutionalExam) {
    return (
      <MockInstitutionalDetailView
        selectedInstitutionalExam={selectedInstitutionalExam}
        setSelectedInstitutionalExam={setSelectedInstitutionalExam}
        allInstitutionalExams={institutionalMocks}
      />
    );
  }

  // Compute KPI summary metrics for General Mock Exams
  const totalMockCount = generalMocks.length;
  const analyzedMockCount = generalMocks.filter(m => m.isAnalyzed).length;
  const analyzedMockPercentage = totalMockCount > 0 ? Math.round((analyzedMockCount / totalMockCount) * 100) : 0;

  const tytNets = generalMocks.map(m => parseNetVal(m.tyt.totalNet));
  const aytNets = generalMocks.map(m => parseNetVal(m.ayt.totalNet));
  const maxTytNet = tytNets.length > 0 ? Math.max(...tytNets) : 0;
  const maxAytNet = aytNets.length > 0 ? Math.max(...aytNets) : 0;
  const avgTytNetVal = tytNets.length > 0 ? (tytNets.reduce((a, b) => a + b, 0) / tytNets.length).toFixed(2).replace('.', ',') : '0,00';
  const avgAytNetVal = aytNets.length > 0 ? (aytNets.reduce((a, b) => a + b, 0) / aytNets.length).toFixed(2).replace('.', ',') : '0,00';

  const latestExam = generalMocks.length > 0 ? [...generalMocks].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] : null;
  const latestEstRank = latestExam?.estimatedRank ? latestExam.estimatedRank : null;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in bg-slate-900/95 border border-indigo-500/50 text-indigo-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-semibold backdrop-blur-xl ring-1 ring-indigo-500/20">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ── TOP PRIMARY NAVIGATION TABS (En Üstte) ── */}
      <div className="bg-slate-900/95 border border-slate-800 p-2.5 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
        <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveGeneralTab('analytics')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeGeneralTab === 'analytics'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>Grafik & Analiz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGeneralTab('history')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeGeneralTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Deneme Geçmişi ({totalMockCount})</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 pr-2">
          <div className="text-xs text-slate-400 font-mono hidden md:flex items-center space-x-2">
            {activeGeneralTab === 'analytics' ? (
              <span className="text-indigo-300 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                Net ivmesi ve branş analizleri
              </span>
            ) : (
              <span className="text-emerald-300 font-semibold flex items-center gap-1.5 font-mono">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                {mockListTab === 'individual' ? `${generalMocks.length} Bireysel Deneme` : `${institutionalMocks.length} Kurumsal Karne`}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            id="add-general-mock-btn"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2 cursor-pointer border border-indigo-400/30 group shrink-0"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Genel Deneme Sonucu Gir</span>
          </button>
        </div>
      </div>

      {/* ── HERO HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>YKS Genel Deneme Takip ve İlerleme Paneli</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>Genel Deneme Analizi & Net Yükseliş Grafiği</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Türkiye geneli ve kurum içi TYT & AYT genel deneme sonuçlarınızı girin, net ivmenizi ve tahmini YKS sıralamanızı adım adım takip edin.
          </p>
        </div>
      </div>

      {/* ── 4 TOP HERO KPI METRIC CARDS (KOMPAKT MİNİ İSTATİSTİK ŞERİDİ) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Toplam Genel Deneme */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-md backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/40 transition-all min-h-[80px]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">Toplam Deneme</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-white font-mono">{totalMockCount}</span>
                <span className="text-[10px] text-slate-500 font-medium">Deneme</span>
              </div>
            </div>
          </div>
          <span className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-[9px] sm:text-[9.5px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0" title={`Bireysel: ${generalMocks.length}, Kurumsal: ${institutionalMocks.length}`}>
            %{analyzedMockPercentage} Analiz
          </span>
        </div>

        {/* Card 2: TYT Net Ortalaması & Rekor */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-md backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/40 transition-all min-h-[80px]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">TYT Ortalaması</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-indigo-400 font-mono">{avgTytNetVal}</span>
                <span className="text-[10px] text-slate-500 font-medium">Net</span>
              </div>
            </div>
          </div>
          {maxTytNet > 0 && (
            <span className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-[9px] sm:text-[9.5px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0" title={`En Son TYT Net: ${latestExam ? String(latestExam.tyt.totalNet).replace('.', ',') : '-'} Net`}>
              Rekor: {maxTytNet.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>

        {/* Card 3: AYT Net Ortalaması & Rekor */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-md backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all min-h-[80px]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">AYT Ortalaması</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">{avgAytNetVal}</span>
                <span className="text-[10px] text-slate-500 font-medium">Net</span>
              </div>
            </div>
          </div>
          {maxAytNet > 0 && (
            <span className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-[9px] sm:text-[9.5px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0" title={`En Son AYT Net: ${latestExam ? String(latestExam.ayt.totalNet).replace('.', ',') : '-'} Net`}>
              Rekor: {maxAytNet.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>

        {/* Card 4: Tahmini YKS Sıralaması */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-md backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all min-h-[80px]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">Tahmini Sıralama</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-amber-300 font-mono">{latestEstRank ? `#${latestEstRank}` : '-'}</span>
              </div>
            </div>
          </div>
          <span className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-[9px] sm:text-[9.5px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0" title={`Hedef Üniversite: ${displayUniversity}`}>
            Son Deneme
          </span>
        </div>
      </div>

      {/* Tab 1: Grafik & Analiz */}
      {activeGeneralTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <MockChartsSection
            generalMocks={mockListTab === 'institutional' ? institutionalAsMocks : generalMocks}
            filteredByCountMocks={filteredByCountMocks}
            mockCountFilter={mockCountFilter}
            setMockCountFilter={setMockCountFilter}
            activeChartTab={activeChartTab}
            setActiveChartTab={setActiveChartTab as any}
            setShowCustomizeModal={setShowCustomizeModal}
            visibleCharts={visibleCharts}
            pinnedSubjects={pinnedSubjects}
            togglePinnedSubject={togglePinnedSubject}
            subSubjectStatsMap={subSubjectStatsMap}
            detailedSubSubjectsMeta={DETAILED_SUB_SUBJECTS_META}
            mockSubjectConfig={MOCK_SUBJECT_CONFIG}
            chartData={chartData}
            subjectChartData={subjectChartData}
            rankChartData={rankChartData}
            detailedChartData={detailedChartData}
            criticalWeakSubjects={criticalWeakSubjects}
            selectedMockSubjects={selectedMockSubjects}
            setSelectedMockSubjects={setSelectedMockSubjects}
            toggleMockSubject={toggleMockSubject}
            showSubjectFilters={showSubjectFilters}
            setShowSubjectFilters={setShowSubjectFilters}
            subSubjectChartType={subSubjectChartType}
            setSubSubjectChartType={setSubSubjectChartType}
            subSubjectExamTab={subSubjectExamTab}
            setSubSubjectExamTab={setSubSubjectExamTab}
            subSubjectGroupFilter={subSubjectGroupFilter}
            setSubSubjectGroupFilter={setSubSubjectGroupFilter}
            activeSubSubjectKeys={activeSubSubjectKeys}
            setActiveSubSubjectKeys={setActiveSubSubjectKeys}
            toggleActiveSubSubject={toggleActiveSubSubject}
            profile={profile}
          />
        </div>
      )}

      {/* Tab 2: Deneme Geçmişi */}
      {activeGeneralTab === 'history' && (
        <div className="space-y-5 animate-fade-in">
          {/* === TOP TAB SWITCHER: Bireysel / Kurumsal === */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMockListTab('individual')}
              className={`relative flex items-center space-x-3 p-4 rounded-3xl border-2 transition-all duration-200 cursor-pointer group ${
                mockListTab === 'individual'
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-xl shadow-indigo-600/20 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                mockListTab === 'individual' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'bg-slate-800 text-slate-400 group-hover:text-white'
              }`}>
                <Award className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className={`text-sm font-extrabold ${mockListTab === 'individual' ? 'text-white' : 'text-slate-300'}`}>Bireysel Genel Denemelerim</div>
                <div className={`text-xs mt-0.5 font-semibold font-mono ${mockListTab === 'individual' ? 'text-indigo-300' : 'text-slate-500'}`}>
                  {generalMocks.length} Kayıtlı Deneme
                </div>
              </div>
              {mockListTab === 'individual' && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/60" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMockListTab('institutional')}
              className={`relative flex items-center space-x-3 p-4 rounded-3xl border-2 transition-all duration-200 cursor-pointer group ${
                mockListTab === 'institutional'
                  ? 'bg-emerald-600/15 border-emerald-500 shadow-xl shadow-emerald-600/20 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                mockListTab === 'institutional' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40' : 'bg-slate-800 text-slate-400 group-hover:text-white'
              }`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className={`text-sm font-extrabold ${mockListTab === 'institutional' ? 'text-white' : 'text-slate-300'}`}>Kurumsal Deneme Karnelerim</div>
                <div className={`text-xs mt-0.5 font-semibold font-mono ${mockListTab === 'institutional' ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {institutionalMocks.length} Okul Karnesi
                </div>
              </div>
              {mockListTab === 'institutional' && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60" />
              )}
            </button>
          </div>

          {/* Mock Exams List & Table */}
          <MockTableSection
            mockListTab={mockListTab}
            setMockListTab={setMockListTab}
            generalMocks={generalMocks}
            institutionalMocks={institutionalMocks}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            sortedGeneralMocks={sortedGeneralMocks}
            setSelectedInstitutionalExam={setSelectedInstitutionalExam}
            handleStartEdit={handleStartEdit}
            onUpdateMock={onUpdateMock}
            expandedMockDetails={expandedMockDetails}
            toggleExpandMockDetails={toggleExpandMockDetails}
            setCalcMock={setCalcMock}
            setShowAllFields={setShowAllFields}
            setDeletingMock={setDeletingMock}
          />
        </div>
      )}


      {/* Modal: Add General Mock */}
      <MockAddModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        handleSubmit={handleSubmit}
        title={title}
        setTitle={setTitle}
        date={date}
        setDate={setDate}
        addExamType={addExamType}
        setAddExamType={setAddExamType}
        targetField={profile?.targetField}
        addEntryMode={addEntryMode}
        setAddEntryMode={setAddEntryMode}
        addInputMethod={addInputMethod}
        setAddInputMethod={setAddInputMethod}
        tytTurkce={tytTurkce}
        setTytTurkce={setTytTurkce}
        tytMat={tytMat}
        setTytMat={setTytMat}
        tytSosyal={tytSosyal}
        setTytSosyal={setTytSosyal}
        tytFen={tytFen}
        setTytFen={setTytFen}
        aytMat={aytMat}
        setAytMat={setAytMat}
        aytFen={aytFen}
        setAytFen={setAytFen}
        aytEdebiyatSos1={aytEdebiyatSos1}
        setAytEdebiyatSos1={setAytEdebiyatSos1}
        aytSos2={aytSos2}
        setAytSos2={setAytSos2}
        ydtNet={ydtNet}
        setYdtNet={setYdtNet}
        ydtDyb={ydtDyb}
        setYdtDyb={setYdtDyb}
        ydtLanguage={ydtLanguage}
        setYdtLanguage={setYdtLanguage}
        addTytDyb={addTytDyb}
        setAddTytDyb={setAddTytDyb}
        addAytDyb={addAytDyb}
        setAddAytDyb={setAddAytDyb}
        updateSubSubjectDybItem={updateSubSubjectDybItem}
        estimatedRank={String(estimatedRank)}
        setEstimatedRank={setEstimatedRank}
        notes={notes}
        setNotes={setNotes}
        isAnalyzed={isAnalyzed}
        setIsAnalyzed={setIsAnalyzed}
      />


      {/* Modal: Edit General Mock */}
      <MockEditModal
        editingMock={editingMock}
        setEditingMock={setEditingMock}
        handleEditSubmit={handleEditSubmit}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editDate={editDate}
        setEditDate={setEditDate}
        editExamType={editExamType}
        setEditExamType={setEditExamType}
        targetField={profile?.targetField}
        editEntryMode={editEntryMode}
        setEditEntryMode={setEditEntryMode}
        editInputMethod={editInputMethod}
        setEditInputMethod={setEditInputMethod}
        editTytTurkce={editTytTurkce}
        setEditTytTurkce={setEditTytTurkce}
        editTytMat={editTytMat}
        setEditTytMat={setEditTytMat}
        editTytSosyal={editTytSosyal}
        setEditTytSosyal={setEditTytSosyal}
        editTytFen={editTytFen}
        setEditTytFen={setEditTytFen}
        editAytMat={editAytMat}
        setEditAytMat={setEditAytMat}
        editAytFen={editAytFen}
        setEditAytFen={setEditAytFen}
        editAytEdebiyatSos1={editAytEdebiyatSos1}
        setEditAytEdebiyatSos1={setEditAytEdebiyatSos1}
        editAytSos2={editAytSos2}
        setEditAytSos2={setEditAytSos2}
        editYdtNet={editYdtNet}
        setEditYdtNet={setEditYdtNet}
        editYdtDyb={editYdtDyb}
        setEditYdtDyb={setEditYdtDyb}
        editYdtLanguage={editYdtLanguage}
        setEditYdtLanguage={setEditYdtLanguage}
        editTytDyb={editTytDyb}
        setEditTytDyb={setEditTytDyb}
        editAytDyb={editAytDyb}
        setEditAytDyb={setEditAytDyb}
        updateSubSubjectDybItem={updateSubSubjectDybItem}
        editEstimatedRank={String(editEstimatedRank)}
        setEditEstimatedRank={setEditEstimatedRank}
        editNotes={editNotes}
        setEditNotes={setEditNotes}
        editIsAnalyzed={editIsAnalyzed}
        setEditIsAnalyzed={setEditIsAnalyzed}
      />


      {/* Modal: Score & Rank Simulator */}
      <MockRankSimulatorModal
        calcMock={calcMock}
        setCalcMock={setCalcMock}
        profile={profile}
        diplomaGrade={diplomaGrade}
        setDiplomaGrade={setDiplomaGrade}
        handleDiplomaGradeChange={handleDiplomaGradeChange}
        onUpdateMock={onUpdateMock}
      />


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
      <MockCustomizeModal
        showCustomizeModal={showCustomizeModal}
        setShowCustomizeModal={setShowCustomizeModal}
        visibleCharts={visibleCharts}
        saveVisibleCharts={saveVisibleCharts}
        pinnedSubjects={pinnedSubjects}
        togglePinnedSubject={togglePinnedSubject}
        setPinnedSubjects={setPinnedSubjects}
        setActiveChartTab={setActiveChartTab as any}
        detailedSubSubjectsMeta={DETAILED_SUB_SUBJECTS_META}
      />

      {/* ── FLOATING ACTION BUTTON (+ FAB) ── */}
      <button
        onClick={() => setShowAddModal(true)}
        id="fab-add-general-mock-btn"
        aria-label="Yeni Genel Deneme Ekle"
        title="Yeni Genel Deneme Ekle"
        className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-40 bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full sm:rounded-2xl shadow-[0_10px_25px_rgba(99,102,241,0.45)] border border-indigo-400/40 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group ring-4 ring-indigo-500/20 backdrop-blur-md"
      >
        <Plus className="w-6 h-6 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90 stroke-[2.5]" />
        <span className="hidden sm:inline font-bold text-sm tracking-wide text-white drop-shadow-sm">
          Yeni Genel Deneme
        </span>
      </button>

    </div>
  );
};
