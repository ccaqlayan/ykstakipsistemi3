import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Calculator,
  ArrowUpRight,
  BarChart2,
  Share2,
  FileSpreadsheet,
  Compass,
  Save,
  RotateCcw,
  Check,
  Zap,
  LayoutGrid,
  Table as TableIcon,
  HelpCircle,
  Clock
} from 'lucide-react';
import { SchoolExam, StudentProfile, UserAccount, YKSDataState } from '../types';
import { SchoolExamModal } from './school_exams/SchoolExamModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { OfficialStudentReportCardModal } from './reports/OfficialStudentReportCardModal';
import { BulkImportSchoolExamsModal } from './import/BulkImportSchoolExamsModal';
import { FieldSelectionAdvisorModal } from './advisor/FieldSelectionAdvisorModal';
import { getGradeLevel, getGradeDisplayName } from '../utils/gradeUtils';

interface SchoolExamsViewProps {
  schoolExams: SchoolExam[];
  profile: StudentProfile;
  currentUser: UserAccount;
  studentData?: YKSDataState;
  allUsers?: UserAccount[];
  classes?: { id: string; name: string }[];
  onAddSchoolExam: (exam: Omit<SchoolExam, 'id'>) => void;
  onUpdateSchoolExam: (exam: SchoolExam) => void;
  onDeleteSchoolExam: (id: string) => void;
  onUpdateProfile?: (updatedProfile: StudentProfile) => void;
  onApplyBulkSchoolExams?: (updates: { studentId: string; exams: SchoolExam[] }[]) => void;
}

// Standart MEB Ders Listeleri (Title Case)
const GRADE9_STANDARD_SUBJECTS = [
  'Matematik',
  'Türk Dili ve Edebiyatı',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Tarih',
  'Coğrafya',
  'Din Kültürü ve Ahlak Bilgisi',
  'İngilizce',
  'İkinci Yabancı Dil (Almanca)',
  'Beden Eğitimi ve Spor',
  'Görsel Sanatlar/Müzik',
  'Sağlık Bilgisi ve Trafik Kültürü'
];

const GRADE10_STANDARD_SUBJECTS = [
  'Matematik',
  'Türk Dili ve Edebiyatı',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Din Kültürü ve Ahlak Bilgisi',
  'İngilizce',
  'İkinci Yabancı Dil (Almanca)',
  'Beden Eğitimi ve Spor',
  'Görsel Sanatlar/Müzik'
];

const GRADE11_STANDARD_SUBJECTS = [
  '11. Sınıf Matematik',
  '11. Sınıf Fizik',
  '11. Sınıf Kimya',
  '11. Sınıf Biyoloji',
  '11. Sınıf Türk Dili ve Edebiyatı',
  '11. Sınıf Tarih',
  '11. Sınıf Coğrafya',
  '11. Sınıf Felsefe',
  'Din Kültürü ve Ahlak Bilgisi',
  'İngilizce',
  'İkinci Yabancı Dil (Almanca)',
  'Beden Eğitimi ve Spor'
];

const GRADE12_STANDARD_SUBJECTS = [
  'Matematik',
  'Türk Dili ve Edebiyatı',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'T.C. İnkılap Tarihi ve Atatürkçülük',
  'Coğrafya',
  'Din Kültürü ve Ahlak Bilgisi',
  'İngilizce',
  'İkinci Yabancı Dil (Almanca)',
  'Beden Eğitimi ve Spor'
];

// Standart MEB Haftalık Ders Saatleri (Varsayılan Krediler)
const DEFAULT_WEEKLY_HOURS: Record<string, number> = {
  'Matematik': 6,
  '11. Sınıf Matematik': 6,
  'Türk Dili ve Edebiyatı': 5,
  '11. Sınıf Türk Dili ve Edebiyatı': 5,
  'Fizik': 2,
  '11. Sınıf Fizik': 4,
  'Kimya': 2,
  '11. Sınıf Kimya': 4,
  'Biyoloji': 2,
  '11. Sınıf Biyoloji': 4,
  'Tarih': 2,
  '11. Sınıf Tarih': 2,
  'T.C. İnkılap Tarihi ve Atatürkçülük': 2,
  'Coğrafya': 2,
  '11. Sınıf Coğrafya': 2,
  'Felsefe': 2,
  '11. Sınıf Felsefe': 2,
  'Din Kültürü ve Ahlak Bilgisi': 2,
  'Din Kültürü': 2,
  'İngilizce': 4,
  'Birinci Yabancı Dil': 4,
  'İkinci Yabancı Dil (Almanca)': 2,
  'Almanca': 2,
  'Beden Eğitimi ve Spor': 2,
  'Görsel Sanatlar/Müzik': 2,
  'Sağlık Bilgisi ve Trafik Kültürü': 1,
  'Rehberlik ve Yönlendirme': 1
};

export interface SubjectGradeRow {
  subject: string;
  primaryExamId?: string;
  examIds: string[];
  written1?: number | null;
  written2?: number | null;
  perf1?: number | null;
  perf2?: number | null;
  project?: number | null;
  weeklyHours: number;
  classAverage?: number | null;
  notes?: string;
  date?: string;
  average: number | null;
}

// Türkçe karakter ve büyük/küçük harf duyarsız normalizasyon
const normalizeSubject = (str: string): string => {
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]/g, '')
    .trim();
};

// Farklı formatlardaki ders isimlerini standart liste ile eşleştirme
const findMatchingStandardSubject = (inputSubject: string, availableList: string[]): string => {
  const normInput = normalizeSubject(inputSubject);
  
  // 1. Doğrudan eşleşme
  const direct = availableList.find(s => normalizeSubject(s) === normInput);
  if (direct) return direct;

  // 2. Yaygın varyasyonlar
  if (normInput.includes('dinkulturu') || normInput === 'din') {
    const dinSub = availableList.find(s => normalizeSubject(s).includes('dinkulturu'));
    if (dinSub) return dinSub;
  }
  if (normInput === 'ingilizce' || normInput.includes('birinciyabancidil')) {
    const ingSub = availableList.find(s => normalizeSubject(s).includes('ingilizce') || normalizeSubject(s).includes('birinciyabancidil'));
    if (ingSub) return ingSub;
  }
  if (normInput === 'almanca' || normInput.includes('ikinciyabancidil')) {
    const almSub = availableList.find(s => normalizeSubject(s).includes('almanca') || normalizeSubject(s).includes('ikinciyabancidil'));
    if (almSub) return almSub;
  }
  if (normInput.includes('turkdiliveedebiyati') || normInput === 'edebiyat') {
    const edSub = availableList.find(s => normalizeSubject(s).includes('turkdiliveedebiyati') || normalizeSubject(s).includes('edebiyat'));
    if (edSub) return edSub;
  }
  if (normInput.includes('bedenegitimi') || normInput.includes('beden')) {
    const bedSub = availableList.find(s => normalizeSubject(s).includes('beden'));
    if (bedSub) return bedSub;
  }
  if (normInput.includes('gorselsanatlar') || normInput.includes('muzik') || normInput.includes('sanat')) {
    const artSub = availableList.find(s => normalizeSubject(s).includes('gorsel') || normalizeSubject(s).includes('muzik'));
    if (artSub) return artSub;
  }
  if (normInput.includes('matematik')) {
    const matSub = availableList.find(s => normalizeSubject(s).includes('matematik'));
    if (matSub) return matSub;
  }
  if (normInput.includes('fizik')) {
    const fizSub = availableList.find(s => normalizeSubject(s).includes('fizik'));
    if (fizSub) return fizSub;
  }
  if (normInput.includes('kimya')) {
    const kimSub = availableList.find(s => normalizeSubject(s).includes('kimya'));
    if (kimSub) return kimSub;
  }
  if (normInput.includes('biyoloji')) {
    const bioSub = availableList.find(s => normalizeSubject(s).includes('biyoloji'));
    if (bioSub) return bioSub;
  }
  if (normInput.includes('inkilap') || normInput.includes('tarih')) {
    const tarSub = availableList.find(s => normalizeSubject(s).includes('inkilap') || normalizeSubject(s).includes('tarih'));
    if (tarSub) return tarSub;
  }
  if (normInput.includes('cografya')) {
    const cogSub = availableList.find(s => normalizeSubject(s).includes('cografya'));
    if (cogSub) return cogSub;
  }
  if (normInput.includes('felsefe')) {
    const felSub = availableList.find(s => normalizeSubject(s).includes('felsefe'));
    if (felSub) return felSub;
  }

  return inputSubject;
};

export const SchoolExamsView: React.FC<SchoolExamsViewProps> = ({
  schoolExams = [],
  profile,
  currentUser,
  studentData,
  allUsers = [],
  classes = [],
  onAddSchoolExam,
  onUpdateSchoolExam,
  onDeleteSchoolExam,
  onUpdateProfile,
  onApplyBulkSchoolExams
}) => {
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isQuickEditMode, setIsQuickEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [editingExam, setEditingExam] = useState<SchoolExam | null>(null);
  const [deletingRow, setDeletingRow] = useState<SubjectGradeRow | null>(null);
  const [isTargetGpaModalOpen, setIsTargetGpaModalOpen] = useState(false);
  const [customTargetGpa, setCustomTargetGpa] = useState(profile.schoolGpaTarget?.toString() || '90.0');

  // Hızlı Tablo Düzenleme State'i
  const [quickFormState, setQuickFormState] = useState<Record<string, {
    written1: string;
    written2: string;
    perf1: string;
    perf2: string;
    project: string;
    weeklyHours: string;
    classAverage: string;
  }>>({});

  const gradeLevel = getGradeLevel(profile.className || currentUser.className);

  // Kademeye göre ders listesi
  const availableSubjects = useMemo(() => {
    switch (gradeLevel) {
      case '9':
        return GRADE9_STANDARD_SUBJECTS;
      case '10':
        return GRADE10_STANDARD_SUBJECTS;
      case '11':
        return GRADE11_STANDARD_SUBJECTS;
      case '12':
      case 'mezun':
        return GRADE12_STANDARD_SUBJECTS;
      default:
        return GRADE9_STANDARD_SUBJECTS;
    }
  }, [gradeLevel]);

  // Seçili döneme ait sınav kayıtları
  const semesterExams = useMemo(() => {
    return schoolExams.filter(e => e.semester === selectedSemester);
  }, [schoolExams, selectedSemester]);

  // Tüm derslerin birleştirilmiş satır verileri (Tekilleştirilmiş Tablo modeli)
  const subjectRows: SubjectGradeRow[] = useMemo(() => {
    const map: Record<string, SubjectGradeRow> = {};

    // 1. Standart dersleri başlat
    availableSubjects.forEach(sub => {
      map[sub] = {
        subject: sub,
        examIds: [],
        weeklyHours: DEFAULT_WEEKLY_HOURS[sub] || 2,
        written1: null,
        written2: null,
        perf1: null,
        perf2: null,
        project: null,
        classAverage: null,
        average: null
      };
    });

    // 2. Kaydedilmiş sınav verilerini standart derslerle eşleştirerek entegre et
    semesterExams.forEach(exam => {
      const matchedSubject = findMatchingStandardSubject(exam.subject, availableSubjects);

      if (!map[matchedSubject]) {
        map[matchedSubject] = {
          subject: matchedSubject,
          examIds: [],
          weeklyHours: exam.weeklyHours || DEFAULT_WEEKLY_HOURS[matchedSubject] || 2,
          written1: null,
          written2: null,
          perf1: null,
          perf2: null,
          project: null,
          classAverage: null,
          average: null
        };
      }

      const row = map[matchedSubject];
      if (exam.id && !row.examIds.includes(exam.id)) {
        row.examIds.push(exam.id);
      }
      if (!row.primaryExamId) {
        row.primaryExamId = exam.id;
      }

      // 1. Sınav ve yeni alanlar
      if (exam.score !== undefined && exam.score !== null) {
        if (exam.examNumber === 2) {
          row.written2 = exam.score;
        } else {
          row.written1 = exam.score;
        }
      }
      if (exam.written2 !== undefined && exam.written2 !== null) {
        row.written2 = exam.written2;
      }
      if (exam.perf1 !== undefined && exam.perf1 !== null) {
        row.perf1 = exam.perf1;
      }
      if (exam.perf2 !== undefined && exam.perf2 !== null) {
        row.perf2 = exam.perf2;
      }
      if (exam.project !== undefined && exam.project !== null) {
        row.project = exam.project;
      }
      if (exam.weeklyHours !== undefined && exam.weeklyHours !== null) {
        row.weeklyHours = exam.weeklyHours;
      }
      if (exam.classAverage !== undefined && exam.classAverage !== null) {
        row.classAverage = exam.classAverage;
      }
      if (exam.notes) {
        row.notes = exam.notes;
      }
      if (exam.date) {
        row.date = exam.date;
      }
    });

    // 3. Her ders için not ortalamasını hesapla
    return Object.values(map).map(row => {
      const validScores: number[] = [];
      if (typeof row.written1 === 'number') validScores.push(row.written1);
      if (typeof row.written2 === 'number') validScores.push(row.written2);
      if (typeof row.perf1 === 'number') validScores.push(row.perf1);
      if (typeof row.perf2 === 'number') validScores.push(row.perf2);
      if (typeof row.project === 'number') validScores.push(row.project);

      const avg = validScores.length > 0
        ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 100) / 100
        : null;

      return {
        ...row,
        average: avg
      };
    });
  }, [availableSubjects, semesterExams]);

  // Ağırlıklı ve Aritmetik Dönem Not Ortalaması
  const { weightedGpa, unweightedGpa, totalWeeklyHours, scoredSubjectCount } = useMemo(() => {
    const scoredRows = subjectRows.filter(r => r.average !== null);
    if (scoredRows.length === 0) {
      return { weightedGpa: 0, unweightedGpa: 0, totalWeeklyHours: 0, scoredSubjectCount: 0 };
    }

    let weightedSum = 0;
    let totalHours = 0;
    let unweightedSum = 0;

    scoredRows.forEach(r => {
      const avg = r.average || 0;
      const hours = r.weeklyHours || 2;
      weightedSum += avg * hours;
      totalHours += hours;
      unweightedSum += avg;
    });

    const wGpa = totalHours > 0 ? Math.round((weightedSum / totalHours) * 100) / 100 : 0;
    const uGpa = Math.round((unweightedSum / scoredRows.length) * 100) / 100;

    return {
      weightedGpa: wGpa,
      unweightedGpa: uGpa,
      totalWeeklyHours: totalHours,
      scoredSubjectCount: scoredRows.length
    };
  }, [subjectRows]);

  // Tahmini OBP ve YKS Yerleştirme Katkısı
  const activeGpa = weightedGpa > 0 ? weightedGpa : unweightedGpa;
  const estimatedObp = Math.round(activeGpa * 5 * 100) / 100; // OBP = GPA * 5 (Max 500)
  const yksPointContribution = Math.round(estimatedObp * 0.12 * 100) / 100; // YKS Yerleştirme katkısı = OBP * 0.12 (Max 60)

  // Takdir / Teşekkür Belgesi Durumu
  const certificateStatus = useMemo(() => {
    if (activeGpa >= 85) {
      return { title: 'Takdir Belgesi Adayı', color: 'emerald', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
    }
    if (activeGpa >= 70) {
      return { title: 'Teşekkür Belgesi Adayı', color: 'indigo', bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' };
    }
    if (activeGpa >= 50) {
      return { title: 'Doğrudan Sınıf Geçme', color: 'amber', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
    }
    return { title: 'Geliştirilmeli (Risk)', color: 'rose', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30' };
  }, [activeGpa]);

  // Hızlı düzenleme moduna girildiğinde form state'ini doldur
  const startQuickEdit = () => {
    const initialForm: Record<string, any> = {};
    subjectRows.forEach(row => {
      initialForm[row.subject] = {
        written1: row.written1 !== null && row.written1 !== undefined ? String(row.written1) : '',
        written2: row.written2 !== null && row.written2 !== undefined ? String(row.written2) : '',
        perf1: row.perf1 !== null && row.perf1 !== undefined ? String(row.perf1) : '',
        perf2: row.perf2 !== null && row.perf2 !== undefined ? String(row.perf2) : '',
        project: row.project !== null && row.project !== undefined ? String(row.project) : '',
        weeklyHours: String(row.weeklyHours || DEFAULT_WEEKLY_HOURS[row.subject] || 2),
        classAverage: row.classAverage !== null && row.classAverage !== undefined ? String(row.classAverage) : ''
      };
    });
    setQuickFormState(initialForm);
    setIsQuickEditMode(true);
  };

  const handleQuickInputChange = (subject: string, field: string, value: string) => {
    setQuickFormState(prev => ({
      ...prev,
      [subject]: {
        ...(prev[subject] || {}),
        [field]: value
      }
    }));
  };

  // Hızlı Tablo Notlarını Topluca Kaydet
  const handleSaveAllQuickGrades = () => {
    subjectRows.forEach(row => {
      const form = quickFormState[row.subject];
      if (!form) return;

      const w1 = form.written1.trim() !== '' ? Math.max(0, Math.min(100, Number(form.written1))) : undefined;
      const w2 = form.written2.trim() !== '' ? Math.max(0, Math.min(100, Number(form.written2))) : undefined;
      const p1 = form.perf1.trim() !== '' ? Math.max(0, Math.min(100, Number(form.perf1))) : undefined;
      const p2 = form.perf2.trim() !== '' ? Math.max(0, Math.min(100, Number(form.perf2))) : undefined;
      const prj = form.project.trim() !== '' ? Math.max(0, Math.min(100, Number(form.project))) : undefined;
      const hours = form.weeklyHours.trim() !== '' ? Math.max(1, Math.min(20, Number(form.weeklyHours))) : (DEFAULT_WEEKLY_HOURS[row.subject] || 2);
      const cAvg = form.classAverage.trim() !== '' ? Math.max(0, Math.min(100, Number(form.classAverage))) : undefined;

      const hasAnyScore = w1 !== undefined || w2 !== undefined || p1 !== undefined || p2 !== undefined || prj !== undefined;

      if (row.primaryExamId) {
        if (hasAnyScore) {
          onUpdateSchoolExam({
            id: row.primaryExamId,
            semester: selectedSemester,
            examNumber: 1,
            subject: row.subject,
            score: w1 !== undefined ? w1 : 0,
            written2: w2,
            perf1: p1,
            perf2: p2,
            project: prj,
            weeklyHours: hours,
            classAverage: cAvg,
            date: row.date || new Date().toISOString().split('T')[0],
            notes: row.notes
          });
        }
      } else if (hasAnyScore) {
        onAddSchoolExam({
          semester: selectedSemester,
          examNumber: 1,
          subject: row.subject,
          score: w1 !== undefined ? w1 : 0,
          written2: w2,
          perf1: p1,
          perf2: p2,
          project: prj,
          weeklyHours: hours,
          classAverage: cAvg,
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    setIsQuickEditMode(false);
  };

  const handleOpenEditModalForRow = (row: SubjectGradeRow) => {
    const existingExam: SchoolExam = {
      id: row.primaryExamId || `temp-${Date.now()}`,
      semester: selectedSemester,
      examNumber: 1,
      subject: row.subject,
      score: row.written1 ?? 0,
      written2: row.written2 ?? undefined,
      perf1: row.perf1 ?? undefined,
      perf2: row.perf2 ?? undefined,
      project: row.project ?? undefined,
      weeklyHours: row.weeklyHours,
      classAverage: row.classAverage ?? undefined,
      notes: row.notes,
      date: row.date || new Date().toISOString().split('T')[0]
    };
    setEditingExam(row.primaryExamId ? existingExam : null);
    setIsModalOpen(true);
  };

  const handleSaveExam = (examData: Omit<SchoolExam, 'id'> | SchoolExam) => {
    if ('id' in examData && examData.id && !examData.id.startsWith('temp-')) {
      onUpdateSchoolExam(examData as SchoolExam);
    } else {
      onAddSchoolExam(examData);
    }
  };

  const handleConfirmDeleteRow = () => {
    if (deletingRow) {
      if (deletingRow.examIds && deletingRow.examIds.length > 0) {
        deletingRow.examIds.forEach(id => onDeleteSchoolExam(id));
      } else if (deletingRow.primaryExamId) {
        onDeleteSchoolExam(deletingRow.primaryExamId);
      }
      setDeletingRow(null);
    }
  };

  const handleSaveTargetGpa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;
    const gpa = parseFloat(customTargetGpa);
    if (!isNaN(gpa)) {
      onUpdateProfile({
        ...profile,
        schoolGpaTarget: Math.max(0, Math.min(100, gpa))
      });
    }
    setIsTargetGpaModalOpen(false);
  };

  const handleShareWhatsAppReport = () => {
    const studentName = profile.name || currentUser.name || 'Öğrenci';
    const scoredList = subjectRows.filter(r => r.average !== null);

    let text = `🎓 *${studentName} - ${getGradeDisplayName(gradeLevel)} Okul Ders & Sınav Karnesi* 🎓\n` +
      `📅 *${selectedSemester}. Dönem Not Dökümü*\n\n` +
      `📊 *Ağırlıklı Dönem Ortalaması:* ${activeGpa > 0 ? activeGpa.toFixed(2) : '-'} / 100 (${certificateStatus.title})\n` +
      `🎯 *Tahmini OBP (Diploma):* ${estimatedObp > 0 ? estimatedObp.toFixed(1) : '-'} / 500\n` +
      `🚀 *YKS Yerleştirme Puanı Katkısı:* ${yksPointContribution > 0 ? `+${yksPointContribution.toFixed(2)}` : '-'} Puan\n\n` +
      `📝 *Ders Notları Özeti:*\n`;

    scoredList.forEach(r => {
      text += `• ${r.subject} (${r.weeklyHours} saat): Ort: ${r.average?.toFixed(1)} `;
      const parts: string[] = [];
      if (r.written1 !== null && r.written1 !== undefined) parts.push(`1.Yazılı: ${r.written1}`);
      if (r.written2 !== null && r.written2 !== undefined) parts.push(`2.Yazılı: ${r.written2}`);
      if (r.perf1 !== null && r.perf1 !== undefined) parts.push(`1.Perf: ${r.perf1}`);
      if (r.perf2 !== null && r.perf2 !== undefined) parts.push(`2.Perf: ${r.perf2}`);
      if (r.project !== null && r.project !== undefined) parts.push(`Proje: ${r.project}`);
      if (parts.length > 0) text += `[${parts.join(', ')}]`;
      text += '\n';
    });

    text += `\n_MEB Türkiye Yüzyılı Maarif Modeli & Akıllı Öğrenci Takip Sistemi_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const getScoreBadge = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return <span className="text-slate-600 font-mono text-xs">-</span>;
    }
    const colorClass =
      score >= 85 ? 'text-emerald-400 font-black' :
      score >= 70 ? 'text-indigo-300 font-bold' :
      score >= 50 ? 'text-amber-300 font-bold' :
      'text-rose-400 font-bold';

    return <span className={`font-mono text-xs ${colorClass}`}>{score}</span>;
  };

  const getGradeStatusBadge = (avg: number | null) => {
    if (avg === null) {
      return <span className="text-[10px] text-slate-500 font-medium">Not Bekleniyor</span>;
    }
    if (avg >= 85) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Pekiyi (5)</span>;
    if (avg >= 70) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">İyi (4)</span>;
    if (avg >= 60) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Orta (3)</span>;
    if (avg >= 50) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Geçer (2)</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Kaldı (1)</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* ── 1. HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-72 h-72 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              <GraduationCap className="w-4 h-4" />
              <span>{getGradeDisplayName(gradeLevel)} • MEB Okul Yazılıları, Performans & OBP Takip Tablosu</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Okul Yazılı & Performans Notlarım</span>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden sm:inline-block">
                {selectedSemester}. Dönem
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              1. Sınav, 2. Sınav, Performans ve Proje notlarınızı düzenli tablo üzerinden girin; ağırlıklı karne ortalamanızı ve YKS'ye etki eden OBP (+{yksPointContribution} puan) katkınızı anlık takip edin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 11. Sınıf Alan Seçimi Rehberi (9 & 10. Sınıflar İçin) */}
            {(gradeLevel === '9' || gradeLevel === '10') && (
              <button
                type="button"
                onClick={() => setShowAdvisorModal(true)}
                className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                title="9 ve 10. sınıf yazılı notlarınıza göre 11. sınıf alan seçimi tavsiyesi alın"
              >
                <Compass className="w-4 h-4 text-amber-300" />
                <span>11. Sınıf Alan Seçimi Rehberi</span>
              </button>
            )}

            {/* Official Report Card Button */}
            <button
              type="button"
              onClick={() => setShowReportCardModal(true)}
              className="px-3.5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-2xl transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
              title="Resmi A4 formatında gelişim ve koçluk karnesini görüntüleyin / yazdırın"
            >
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Resmi Gelişim Karnesi (A4/PDF)</span>
            </button>

            {/* E-Okul Bulk Import Button (Teacher/Admin) */}
            {currentUser.role !== 'student' && onApplyBulkSchoolExams && (
              <button
                type="button"
                onClick={() => setShowBulkImportModal(true)}
                className="px-3.5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-2xl transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
                title="E-Okul not çizelgesinden toplu yazılı sınav notu yükleyin"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                <span>E-Okul Not Aktar</span>
              </button>
            )}

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareWhatsAppReport}
              className="px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-2xl transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
              title="Yazılı sınav notlarını WhatsApp formatında veliyle paylaşın"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp Paylaş</span>
            </button>

            {/* Semester Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedSemester(1);
                  setIsQuickEditMode(false);
                }}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedSemester === 1
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Dönem
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSemester(2);
                  setIsQuickEditMode(false);
                }}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedSemester === 2
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Dönem
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. KPI SCORE CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* Semester GPA */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-inner">
            <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>{selectedSemester}. Dönem Ağırlıklı Ort.</span>
              <Award className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              {activeGpa > 0 ? activeGpa.toFixed(2) : '-'}
            </div>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${certificateStatus.bg}`}>
                {activeGpa > 0 ? certificateStatus.title : 'Not bekleniyor'}
              </span>
            </div>
          </div>

          {/* Target GPA */}
          <div 
            onClick={() => setIsTargetGpaModalOpen(true)}
            className="bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 cursor-pointer group transition-all shadow-inner"
            title="Hedef Karne Notunuzu Güncellemek İçin Tıklayın"
          >
            <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>Hedef Yıl Sonu Notu</span>
              <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-indigo-400 group-hover:text-indigo-300">
              {profile.schoolGpaTarget ? profile.schoolGpaTarget.toFixed(2) : '90.00'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {activeGpa > 0 && profile.schoolGpaTarget ? (
                activeGpa >= profile.schoolGpaTarget ? (
                  <span className="text-emerald-400 font-bold">✓ Hedefe ulaşıldı</span>
                ) : (
                  <span className="text-amber-400">Hedefe {(profile.schoolGpaTarget - activeGpa).toFixed(1)} puan</span>
                )
              ) : (
                'Tıklayıp hedef belirleyin'
              )}
            </div>
          </div>

          {/* Estimated OBP */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-inner">
            <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>Tahmini OBP (Diploma)</span>
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {estimatedObp > 0 ? estimatedObp.toFixed(1) : '-'}
              <span className="text-xs text-slate-500 font-normal"> / 500</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Karne notu × 5 ile hesaplanır
            </div>
          </div>

          {/* YKS Point Boost */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-inner">
            <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>YKS Yerleştirme Katkısı</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
              {yksPointContribution > 0 ? `+${yksPointContribution.toFixed(2)}` : '-'}
              <span className="text-xs text-slate-500 font-normal"> Puan</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1">
              OBP × 0.12 doğrudan eklenir
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. TOOLBAR & VIEW TOGGLES ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-lg backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <TableIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{selectedSemester}. Dönem Ders Not Çizelgesi</span>
              <span className="text-[11px] font-mono text-slate-400">({subjectRows.length} Ders • {scoredSubjectCount} Notlu)</span>
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick In-Place Edit Mode Button */}
          {!isQuickEditMode ? (
            <button
              type="button"
              onClick={startQuickEdit}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              title="Tablo üzerinde doğrudan kutucuklara not yazıp toplu kaydedin"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              <span>⚡ Hızlı Tablodan Not Gir</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveAllQuickGrades}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Değişiklikleri Kaydet</span>
              </button>
              <button
                type="button"
                onClick={() => setIsQuickEditMode(false)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          )}

          {/* Add Subject / Modal Button */}
          <button
            type="button"
            onClick={() => {
              setEditingExam(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ders & Not Ekle</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tablo Görünümü (E-Okul Formatı)"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Kart & Grafik Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. MODERN GRADE TABLE VIEW (E-OKUL TABLO FORMATI) ── */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 min-w-[200px]">Ders Adı & Kredi</th>
                  <th className="py-3.5 px-3 text-center min-w-[90px]">1. Sınav</th>
                  <th className="py-3.5 px-3 text-center min-w-[90px]">2. Sınav</th>
                  <th className="py-3.5 px-3 text-center min-w-[90px]">1. Performans</th>
                  <th className="py-3.5 px-3 text-center min-w-[90px]">2. Performans</th>
                  <th className="py-3.5 px-3 text-center min-w-[90px]">Proje</th>
                  <th className="py-3.5 px-4 text-center min-w-[110px]">Ders Ortalaması</th>
                  <th className="py-3.5 px-4 text-center min-w-[120px]">Durum</th>
                  <th className="py-3.5 px-4 text-right min-w-[100px]">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {subjectRows.map((row, idx) => {
                  const form = quickFormState[row.subject] || {
                    written1: '',
                    written2: '',
                    perf1: '',
                    perf2: '',
                    project: '',
                    weeklyHours: '2',
                    classAverage: ''
                  };

                  return (
                    <tr 
                      key={row.subject} 
                      className={`hover:bg-slate-850/50 transition-colors ${
                        idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/80'
                      }`}
                    >
                      {/* 1. Ders Adı & Saat */}
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-200">{row.subject}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {isQuickEditMode ? (
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={form.weeklyHours}
                                  onChange={(e) => handleQuickInputChange(row.subject, 'weeklyHours', e.target.value)}
                                  className="w-12 bg-slate-950 border border-slate-700 rounded px-1 text-center text-amber-300 font-bold"
                                  title="Haftalık ders saati"
                                />
                              ) : (
                                <span>{row.weeklyHours} Saat / Hafta</span>
                              )}
                              {row.classAverage && (
                                <span className="text-slate-500">• Sınıf Ort: {row.classAverage}</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. 1. Sınav */}
                      <td className="py-3 px-3 text-center">
                        {isQuickEditMode ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.written1}
                            onChange={(e) => handleQuickInputChange(row.subject, 'written1', e.target.value)}
                            placeholder="-"
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                          />
                        ) : (
                          getScoreBadge(row.written1)
                        )}
                      </td>

                      {/* 3. 2. Sınav */}
                      <td className="py-3 px-3 text-center">
                        {isQuickEditMode ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.written2}
                            onChange={(e) => handleQuickInputChange(row.subject, 'written2', e.target.value)}
                            placeholder="-"
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                          />
                        ) : (
                          getScoreBadge(row.written2)
                        )}
                      </td>

                      {/* 4. 1. Performans */}
                      <td className="py-3 px-3 text-center">
                        {isQuickEditMode ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.perf1}
                            onChange={(e) => handleQuickInputChange(row.subject, 'perf1', e.target.value)}
                            placeholder="-"
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-cyan-400 focus:border-cyan-500 focus:outline-none"
                          />
                        ) : (
                          getScoreBadge(row.perf1)
                        )}
                      </td>

                      {/* 5. 2. Performans */}
                      <td className="py-3 px-3 text-center">
                        {isQuickEditMode ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.perf2}
                            onChange={(e) => handleQuickInputChange(row.subject, 'perf2', e.target.value)}
                            placeholder="-"
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-cyan-400 focus:border-cyan-500 focus:outline-none"
                          />
                        ) : (
                          getScoreBadge(row.perf2)
                        )}
                      </td>

                      {/* 6. Proje */}
                      <td className="py-3 px-3 text-center">
                        {isQuickEditMode ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.project}
                            onChange={(e) => handleQuickInputChange(row.subject, 'project', e.target.value)}
                            placeholder="-"
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-purple-400 focus:border-purple-500 focus:outline-none"
                          />
                        ) : (
                          getScoreBadge(row.project)
                        )}
                      </td>

                      {/* 7. Ders Ortalaması */}
                      <td className="py-3 px-4 text-center">
                        {row.average !== null ? (
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-black font-mono px-2.5 py-0.5 rounded-lg border ${
                              row.average >= 85 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              row.average >= 70 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                              row.average >= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                              'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              {row.average.toFixed(1)}
                            </span>
                            <div className="w-16 bg-slate-950 h-1 rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full ${
                                  row.average >= 85 ? 'bg-emerald-400' :
                                  row.average >= 70 ? 'bg-indigo-400' :
                                  row.average >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                                }`} 
                                style={{ width: `${Math.min(100, Math.max(0, row.average))}%` }} 
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      {/* 8. Başarı Durumu */}
                      <td className="py-3 px-4 text-center">
                        {getGradeStatusBadge(row.average)}
                      </td>

                      {/* 9. İşlemler */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModalForRow(row)}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 transition-all cursor-pointer"
                            title="Detaylı Not Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {(row.primaryExamId || row.examIds.length > 0) && (
                            <button
                              type="button"
                              onClick={() => setDeletingRow(row)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                              title="Bu dersin notlarını temizle"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── 5. CARDS & VISUAL COMPARISON VIEW ── */
        <div className="space-y-6">
          {/* Visual Comparison Bars */}
          {subjectRows.some(r => r.average !== null) && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                  <span>Ders Bazlı Not & Sınıf Ortalaması Grafiği</span>
                </h2>
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-slate-300 font-medium">Öğrenci Not Ortalaması</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                    <span className="text-slate-400 font-medium">Sınıf Ortalaması</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {subjectRows
                  .filter(r => r.average !== null)
                  .map(row => {
                    const studentScore = row.average || 0;
                    const classAvg = row.classAverage || 70;

                    return (
                      <div key={row.subject} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white truncate max-w-[200px]">{row.subject}</span>
                          <div className="flex items-center space-x-2 font-mono font-bold">
                            <span className="text-emerald-400">{studentScore.toFixed(1)} Puan</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-slate-400 text-[11px]">Sınıf: {classAvg.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Comparison Bars */}
                        <div className="space-y-1.5">
                          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/5 relative">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm"
                              style={{ width: `${Math.min(100, Math.max(0, studentScore))}%` }}
                            />
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5 relative">
                            <div 
                              className="bg-slate-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, classAvg))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectRows.map(row => {
              const hasGrades = row.average !== null;

              return (
                <div 
                  key={row.subject}
                  className={`bg-slate-900 border rounded-3xl p-5 shadow-lg transition-all relative overflow-hidden ${
                    hasGrades ? 'border-slate-800 hover:border-slate-700' : 'border-slate-850/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{row.subject}</h3>
                      <span className="text-[10px] text-slate-400">
                        {row.weeklyHours} Saat / Hafta • {hasGrades ? 'Notlar girildi' : 'Not bekleniyor'}
                      </span>
                    </div>
                    {row.average !== null && (
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono border ${
                        row.average >= 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        row.average >= 70 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                        row.average >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        Ort: {row.average.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Grade Pills Grid */}
                  <div className="grid grid-cols-3 gap-2 my-3 text-center">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                      <div className="text-[9px] font-semibold text-slate-400">1. Sınav</div>
                      <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">{row.written1 ?? '-'}</div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                      <div className="text-[9px] font-semibold text-slate-400">2. Sınav</div>
                      <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">{row.written2 ?? '-'}</div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                      <div className="text-[9px] font-semibold text-slate-400">1. Perf</div>
                      <div className="text-xs font-bold font-mono text-cyan-400 mt-0.5">{row.perf1 ?? '-'}</div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                      <div className="text-[9px] font-semibold text-slate-400">2. Perf</div>
                      <div className="text-xs font-bold font-mono text-cyan-400 mt-0.5">{row.perf2 ?? '-'}</div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                      <div className="text-[9px] font-semibold text-slate-400">Proje</div>
                      <div className="text-xs font-bold font-mono text-purple-400 mt-0.5">{row.project ?? '-'}</div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-850 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModalForRow(row)}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Düzenle</span>
                      </button>
                    </div>
                  </div>

                  {row.average !== null && (
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2">
                      <div 
                        className={`h-full ${
                          row.average >= 85 ? 'bg-emerald-500' :
                          row.average >= 70 ? 'bg-indigo-500' :
                          row.average >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${Math.min(100, Math.max(0, row.average))}%` }} 
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Exam Modal */}
      <SchoolExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExam}
        initialExam={editingExam}
        availableSubjects={availableSubjects}
        defaultSemester={selectedSemester}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingRow}
        title="Ders Notlarını Sil"
        itemName={deletingRow ? `${deletingRow.subject} dersine ait not dökümünü` : 'Bu dersin notlarını'}
        onConfirm={handleConfirmDeleteRow}
        onClose={() => setDeletingRow(null)}
      />

      {/* Target GPA Modal */}
      {isTargetGpaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/60 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Hedef Karne Notunu Belirle</h3>
            <p className="text-xs text-slate-400 mb-4">
              9, 10 ve 11. sınıf yıl sonu karne notunuz YKS'deki OBP katkınızı belirler.
            </p>
            <form onSubmit={handleSaveTargetGpa} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hedef Yıl Sonu Notu (0 - 100)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  step="0.5"
                  required
                  value={customTargetGpa}
                  onChange={(e) => setCustomTargetGpa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-lg font-bold font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTargetGpaModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Student Report Card Modal (A4 Print / PDF) */}
      {showReportCardModal && (
        <OfficialStudentReportCardModal
          isOpen={showReportCardModal}
          onClose={() => setShowReportCardModal(false)}
          student={currentUser}
          studentData={studentData || {
            profile,
            schoolExams,
            questionLogs: [],
            studyPlans: [],
            topicErrors: [],
            resources: [],
            generalMocks: [],
            branchExams: [],
            pastExams: [],
            youtubeVideos: [],
            coachAdvices: [],
            sheetsStatus: { isConnected: false }
          }}
        />
      )}

      {/* Bulk Import School Exams Modal */}
      {showBulkImportModal && onApplyBulkSchoolExams && (
        <BulkImportSchoolExamsModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          allUsers={allUsers}
          classes={classes}
          onApplyBulkSchoolExams={onApplyBulkSchoolExams}
        />
      )}

      {/* 11. Sınıf Alan Seçimi Karar Destek Modalı */}
      {showAdvisorModal && (
        <FieldSelectionAdvisorModal
          isOpen={showAdvisorModal}
          onClose={() => setShowAdvisorModal(false)}
          student={currentUser}
          studentData={studentData || {
            profile,
            schoolExams,
            questionLogs: [],
            studyPlans: [],
            topicErrors: [],
            resources: [],
            generalMocks: [],
            branchExams: [],
            pastExams: [],
            youtubeVideos: [],
            coachAdvices: [],
            sheetsStatus: { isConnected: false }
          }}
        />
      )}
    </div>
  );
};
