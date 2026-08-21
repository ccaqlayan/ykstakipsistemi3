import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  Plus, 
  Check, 
  X,
  Flame,
  Zap,
  School,
  BookCheck,
  Building2,
  PlusCircle,
  Trash2,
  Award,
  Clock,
  HelpCircle,
  Compass
} from 'lucide-react';
import { UserAccount, StudentProfile, FieldType, ResourceItem, RoutineItem, ClassDefinition } from '../types';
import { UniversityLogo } from './UniversityLogo';
import { UNIVERSITIES } from '../data/universities';
import { DEPARTMENTS } from '../data/departments';
import { RECOMMENDED_BOOKS } from '../data/books';
import { YKS_SUBJECTS } from '../data/initialData';
import { getGradeLevel, isEarlyHighSchool, isIntermediateGrade, getGradeDisplayName } from '../utils/gradeUtils';
import { GRADE9_SUBJECT_NAMES } from '../data/curriculum/grade9';
import { GRADE10_SUBJECT_NAMES } from '../data/curriculum/grade10';

interface OnboardingWizardProps {
  currentUser: UserAccount;
  classes?: ClassDefinition[];
  currentProfile: StudentProfile;
  onComplete: (
    updatedProfile: Partial<StudentProfile>,
    newResources: ResourceItem[],
    newRoutines: RoutineItem[]
  ) => void;
}

const toTurkishLowerCase = (str: string) => {
  return str.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
};

const POPULAR_UNIVERSITIES = [
  'Orta Doğu Teknik Üniversitesi (ODTÜ)',
  'Boğaziçi Üniversitesi',
  'İstanbul Teknik Üniversitesi (İTÜ)',
  'Hacettepe Üniversitesi',
  'Koç Üniversitesi',
  'Bilkent Üniversitesi',
  'İstanbul Üniversitesi',
  'Ankara Üniversitesi',
  'Yıldız Teknik Üniversitesi',
  'Ege Üniversitesi'
];

// ════════════ 9. SINIF MAARİF BAŞLANGIÇ KİTAPLARI ════════════
const RECOMMENDED_STARTER_BOOKS_GRADE9 = [
  { subject: '9. Sınıf Matematik', title: '9. Sınıf Matematik Soru Bankası (Maarif)', publisher: '345 Yayınları', units: 35, examType: 'TYT' as const },
  { subject: '9. Sınıf Türk Dili ve Edebiyatı', title: '9. Sınıf Edebiyat Soru Bankası', publisher: 'Limit Yayınları', units: 30, examType: 'TYT' as const },
  { subject: '9. Sınıf Fizik', title: '9. Sınıf Fizik Soru Bankası', publisher: '3D Yayınları', units: 28, examType: 'TYT' as const },
  { subject: '9. Sınıf Kimya', title: '9. Sınıf Kimya Soru Bankası', publisher: 'Aydın Yayınları', units: 26, examType: 'TYT' as const },
  { subject: '9. Sınıf Biyoloji', title: '9. Sınıf Biyoloji Soru Bankası', publisher: 'Palme Yayınları', units: 24, examType: 'TYT' as const },
  { subject: '9. Sınıf Tarih', title: '9. Sınıf Tarih Soru Bankası', publisher: 'Bilgi Sarmal', units: 20, examType: 'TYT' as const },
  { subject: '9. Sınıf Coğrafya', title: '9. Sınıf Coğrafya Soru Bankası', publisher: 'Limit Yayınları', units: 18, examType: 'TYT' as const }
];

// ════════════ 10. SINIF MAARİF BAŞLANGIÇ KİTAPLARI ════════════
const RECOMMENDED_STARTER_BOOKS_GRADE10 = [
  { subject: '10. Sınıf Matematik', title: '10. Sınıf Matematik Soru Bankası (Maarif)', publisher: 'Orijinal Yayınları', units: 36, examType: 'TYT' as const },
  { subject: '10. Sınıf Türk Dili ve Edebiyatı', title: '10. Sınıf Edebiyat Soru Bankası', publisher: 'Limit Yayınları', units: 32, examType: 'TYT' as const },
  { subject: '10. Sınıf Fizik', title: '10. Sınıf Fizik Soru Bankası', publisher: '3D Yayınları', units: 28, examType: 'TYT' as const },
  { subject: '10. Sınıf Kimya', title: '10. Sınıf Kimya Soru Bankası', publisher: 'Aydın Yayınları', units: 26, examType: 'TYT' as const },
  { subject: '10. Sınıf Biyoloji', title: '10. Sınıf Biyoloji Soru Bankası', publisher: 'Palme Yayınları', units: 25, examType: 'TYT' as const },
  { subject: '10. Sınıf Tarih', title: '10. Sınıf Tarih Soru Bankası', publisher: 'Karakök Yayınları', units: 20, examType: 'TYT' as const },
  { subject: '10. Sınıf Felsefe', title: '10. Sınıf Felsefe Soru Bankası', publisher: 'Bilgi Sarmal', units: 18, examType: 'TYT' as const }
];

// ════════════ 11. SINIF ALAN & TYT BAŞLANGIÇ KİTAPLARI ════════════
const RECOMMENDED_STARTER_BOOKS_GRADE11: Record<FieldType, Array<{ subject: string; title: string; publisher: string; units: number; examType: 'TYT' | 'AYT' }>> = {
  SAY: [
    { subject: '11. Sınıf Matematik', title: '11. Sınıf İleri Matematik Soru Bankası', publisher: 'Orijinal Yayınları', units: 40, examType: 'AYT' },
    { subject: '11. Sınıf Fizik', title: '11. Sınıf Fizik Soru Bankası', publisher: '3D Yayınları', units: 32, examType: 'AYT' },
    { subject: '11. Sınıf Kimya', title: '11. Sınıf Kimya Soru Bankası', publisher: 'Aydın Yayınları', units: 30, examType: 'AYT' },
    { subject: '11. Sınıf Biyoloji', title: '11. Sınıf Biyoloji Soru Bankası', publisher: 'Palme Yayınları', units: 28, examType: 'AYT' },
    { subject: 'TYT Matematik', title: 'TYT Matematik Soru Bankası', publisher: '345 Yayınları', units: 40, examType: 'TYT' },
    { subject: 'TYT Türkçe', title: 'Paragrafın Ritmi', publisher: 'Arı Yayınları', units: 30, examType: 'TYT' }
  ],
  EA: [
    { subject: '11. Sınıf Matematik', title: '11. Sınıf İleri Matematik Soru Bankası', publisher: '3D Yayınları', units: 40, examType: 'AYT' },
    { subject: '11. Sınıf Edebiyat', title: '11. Sınıf Edebiyat Soru Bankası', publisher: 'Limit Yayınları', units: 32, examType: 'AYT' },
    { subject: '11. Sınıf Tarih', title: '11. Sınıf Tarih Soru Bankası', publisher: 'Karakök Yayınları', units: 24, examType: 'AYT' },
    { subject: '11. Sınıf Coğrafya', title: '11. Sınıf Coğrafya Soru Bankası', publisher: 'Limit Yayınları', units: 20, examType: 'AYT' },
    { subject: 'TYT Matematik', title: 'TYT Matematik Soru Bankası', publisher: '345 Yayınları', units: 40, examType: 'TYT' },
    { subject: 'TYT Türkçe', title: 'Paragrafın Ritmi', publisher: 'Arı Yayınları', units: 30, examType: 'TYT' }
  ],
  SÖZ: [
    { subject: '11. Sınıf Edebiyat', title: '11. Sınıf Edebiyat Soru Bankası', publisher: 'Limit Yayınları', units: 32, examType: 'AYT' },
    { subject: '11. Sınıf Tarih', title: '11. Sınıf Tarih Soru Bankası', publisher: 'Limit Yayınları', units: 28, examType: 'AYT' },
    { subject: '11. Sınıf Coğrafya', title: '11. Sınıf Coğrafya Soru Bankası', publisher: 'Yayın Denizi', units: 24, examType: 'AYT' },
    { subject: '11. Sınıf Felsefe', title: '11. Sınıf Felsefe Soru Bankası', publisher: 'Birey Yayınları', units: 20, examType: 'AYT' },
    { subject: 'TYT Türkçe', title: 'Paragrafın Ritmi', publisher: 'Arı Yayınları', units: 30, examType: 'TYT' }
  ],
  DİL: [
    { subject: 'YDT İngilizce', title: 'YDS/YDT Reading & Vocabulary', publisher: 'Akın Dil', units: 40, examType: 'TYT' },
    { subject: 'YDT İngilizce', title: 'YDT Gramer Soru Bankası', publisher: 'Modadil Yayınları', units: 45, examType: 'TYT' },
    { subject: '11. Sınıf Edebiyat', title: '11. Sınıf Edebiyat Soru Bankası', publisher: 'Limit Yayınları', units: 30, examType: 'TYT' },
    { subject: 'TYT Türkçe', title: 'Paragrafın Ritmi', publisher: 'Arı Yayınları', units: 30, examType: 'TYT' }
  ]
};

// ════════════ 12. SINIF & MEZUN YKS BAŞLANGIÇ KİTAPLARI ════════════
const RECOMMENDED_STARTER_BOOKS_YKS: Record<FieldType, Array<{ subject: string; title: string; publisher: string; units: number; examType: 'TYT' | 'AYT' }>> = {
  SAY: [
    { subject: 'TYT Türkçe', title: 'Paragrafın Ritmi Soru Bankası', publisher: 'Arı Yayınları', units: 30, examType: 'TYT' },
    { subject: 'TYT Matematik', title: 'TYT Matematik Soru Bankası', publisher: '345 Yayınları', units: 45, examType: 'TYT' },
    { subject: 'AYT Matematik', title: 'AYT Matematik Soru Bankası', publisher: 'Orijinal Yayınları', units: 50, examType: 'AYT' },
    { subject: 'AYT Fizik', title: 'AYT Fizik Soru Bankası', publisher: '3D Yayınları', units: 35, examType: 'AYT' },
    { subject: 'AYT Kimya', title: 'AYT Kimya Soru Bankası', publisher: 'Aydın Yayınları', units: 32, examType: 'AYT' },
    { subject: 'AYT Biyoloji', title: 'AYT Biyoloji Soru Bankası', publisher: 'Palme Yayınları', units: 28, examType: 'AYT' }
  ],
  EA: [
    { subject: 'TYT Türkçe', title: 'Paragrafın Ritmi Soru Bankası', publisher: 'Arı Yayınları', units: 30, examType: 'TYT' },
    { subject: 'TYT Matematik', title: 'TYT Matematik Soru Bankası', publisher: '345 Yayınları', units: 45, examType: 'TYT' },
    { subject: 'AYT Matematik', title: 'AYT Matematik Soru Bankası', publisher: '3D Yayınları', units: 50, examType: 'AYT' },
    { subject: 'AYT Edebiyat', title: 'AYT Edebiyat Soru Bankası', publisher: 'Limit Yayınları', units: 36, examType: 'AYT' },
    { subject: 'AYT Tarih-1', title: 'AYT Tarih Soru Bankası', publisher: 'Karakök Yayınları', units: 25, examType: 'AYT' },
    { subject: 'AYT Coğrafya-1', title: 'AYT Coğrafya Soru Bankası', publisher: 'Limit Yayınları', units: 22, examType: 'AYT' }
  ],
  SÖZ: [
    { subject: 'TYT Türkçe', title: 'Paragrafın Ritmi Soru Bankası', publisher: 'Arı Yayınları', units: 30, examType: 'TYT' },
    { subject: 'TYT Sosyal', title: 'TYT Sosyal Bilimler Soru Bankası', publisher: 'Apotemi Yayınları', units: 30, examType: 'TYT' },
    { subject: 'AYT Edebiyat', title: 'AYT Edebiyat Soru Bankası', publisher: 'Limit Yayınları', units: 36, examType: 'AYT' },
    { subject: 'AYT Tarih-2', title: 'AYT Tarih Soru Bankası', publisher: 'Limit Yayınları', units: 28, examType: 'AYT' },
    { subject: 'AYT Coğrafya-2', title: 'AYT Coğrafya Soru Bankası', publisher: 'Yayın Denizi', units: 24, examType: 'AYT' },
    { subject: 'AYT Felsefe Grubu', title: 'AYT Felsefe Soru Bankası', publisher: 'Birey Yayınları', units: 20, examType: 'AYT' }
  ],
  DİL: [
    { subject: 'TYT Türkçe', title: 'Paragrafın Ritmi Soru Bankası', publisher: 'Arı Yayınları', units: 30, examType: 'TYT' },
    { subject: 'TYT Matematik', title: 'Temel Matematik Soru Bankası', publisher: 'Karakök Yayınları', units: 35, examType: 'TYT' },
    { subject: 'YDT İngilizce', title: 'YDS/YDT Reading & Vocabulary', publisher: 'Akın Dil', units: 40, examType: 'TYT' },
    { subject: 'YDT İngilizce', title: 'YDT Gramer Soru Bankası', publisher: 'Modadil Yayınları', units: 45, examType: 'TYT' },
    { subject: 'YDT İngilizce', title: 'YDT Deneme Paketi (20 Deneme)', publisher: 'Pelikan Yayınları', units: 20, examType: 'TYT' }
  ]
};

// ════════════ KADEMEYE GÖRE BAŞLANGIÇ RUTİNLERİ ════════════
const DEFAULT_STARTER_ROUTINES_GRADE9_10 = [
  { id: 'rot-kitap', title: 'Günlük Kitap Okuma', target: '30 Sayfa', icon: '📖', recommended: true },
  { id: 'rot-tekrar', title: 'Ders Tekrarı & Ödev Tamamlama', target: '45 Dk', icon: '📝', recommended: true },
  { id: 'rot-soru', title: 'Günün Dersi Soru Çözümü', target: '25 Soru', icon: '📐', recommended: true },
  { id: 'rot-dil', title: 'İngilizce / Yabancı Dil Pratiği', target: '20 Dk', icon: '🌐', recommended: false },
  { id: 'rot-yazili', title: 'Yazılı Sınav Hazırlık Tekrarı', target: '30 Dk', icon: '🏆', recommended: false }
];

const DEFAULT_STARTER_ROUTINES_GRADE11 = [
  { id: 'rot-para', title: 'TYT Paragraf Çözümü', target: '20 Soru', icon: '📖', recommended: true },
  { id: 'rot-prob', title: 'TYT Problem Çözümü', target: '15 Soru', icon: '📐', recommended: true },
  { id: 'rot-alan', title: '11. Sınıf Alan Tekrarı', target: '30 Soru', icon: '🧠', recommended: true },
  { id: 'rot-geom', title: 'Geometri Rutini', target: '10 Soru', icon: '📏', recommended: false },
  { id: 'rot-yazili', title: 'Okul Yazılı Sınav Tekrarı', target: '45 Dk', icon: '🏆', recommended: false }
];

const DEFAULT_STARTER_ROUTINES_YKS = [
  { id: 'rot-para', title: 'Paragraf Çözümü', target: '20 Soru', icon: '📖', recommended: true },
  { id: 'rot-prob', title: 'Problem Çözümü', target: '15 Soru', icon: '📐', recommended: true },
  { id: 'rot-geom', title: 'Geometri Rutini', target: '10 Soru', icon: '📏', recommended: true },
  { id: 'rot-kelime', title: 'Kelime / Kavram Tekrarı', target: '30 Dk', icon: '🧠', recommended: false },
  { id: 'rot-deneme', title: 'Haftalık Branş Denemesi', target: '1 Deneme', icon: '🎯', recommended: false }
];

const ROUTINE_EMOJI_OPTIONS = ['📖', '📐', '📏', '🧠', '🎯', '⚡', '📝', '🎧', '☕', '💡', '🔥', '📚', '🌐', '🏆'];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  currentUser,
  currentProfile,
  onComplete
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // KADEME BİLGİSİ
  const gradeLevel = getGradeLevel(currentProfile.className || currentUser.className);
  const isEarly = isEarlyHighSchool(gradeLevel); // 9 or 10
  const isG11 = gradeLevel === '11';
  const isYKS = gradeLevel === '12' || gradeLevel === 'mezun';

  // ════════════ STEP 1: HEDEFLER & ALAN ════════════
  const [selectedField, setSelectedField] = useState<FieldType>(currentProfile.targetField || (isEarly ? 'SAY' : 'SAY'));
  const [targetUniversity, setTargetUniversity] = useState(currentProfile.targetUniversity || 'Orta Doğu Teknik Üniversitesi (ODTÜ)');
  const [targetDepartment, setTargetDepartment] = useState(currentProfile.targetDepartment || (isEarly ? 'Mühendislik / Tıp' : 'Bilgisayar Mühendisliği'));
  
  // YKS Hedefleri
  const [targetRank, setTargetRank] = useState(currentProfile.targetRank || 5000);
  const [targetTYTNet, setTargetTYTNet] = useState(currentProfile.targetTYTNet || 95);
  const [targetAYTNet, setTargetAYTNet] = useState(currentProfile.targetAYTNet || 70);

  // Ara Sınıf / Okul Başarı Hedefleri
  const [targetSchoolGpa, setTargetSchoolGpa] = useState<number>(currentProfile.schoolGpaTarget || 92.0);
  const [targetWeeklyQuestions, setTargetWeeklyQuestions] = useState<number>(currentProfile.weeklyQuestionTarget || (isEarly ? 250 : isG11 ? 400 : 600));
  const [targetWeeklyHours, setTargetWeeklyHours] = useState<number>(currentProfile.weeklyStudyHoursTarget || (isEarly ? 12 : isG11 ? 16 : 25));

  const [showUniSuggestions, setShowUniSuggestions] = useState(false);
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false);

  const filteredUniversities = useMemo(() => {
    const q = targetUniversity.trim();
    if (!q) return UNIVERSITIES.slice(0, 8);
    const query = toTurkishLowerCase(q);
    return UNIVERSITIES.filter(u => toTurkishLowerCase(u).includes(query)).slice(0, 8);
  }, [targetUniversity]);

  const filteredDepartments = useMemo(() => {
    const q = targetDepartment.trim();
    if (!q) return DEPARTMENTS.slice(0, 8);
    const query = toTurkishLowerCase(q);
    return DEPARTMENTS.filter(d => toTurkishLowerCase(d).includes(query)).slice(0, 8);
  }, [targetDepartment]);

  // ════════════ STEP 2: KAYNAK KİTAPLARI ════════════
  const [selectedBooks, setSelectedBooks] = useState<ResourceItem[]>([]);

  // Manuel / Özel Kaynak Ekleme Formu
  const [showCustomBookForm, setShowCustomBookForm] = useState(false);
  const [customExamType, setCustomExamType] = useState<'TYT' | 'AYT' | 'DIL'>('TYT');
  const [customSubject, setCustomSubject] = useState<string>(
    isEarly 
      ? (gradeLevel === '9' ? '9. Sınıf Matematik' : '10. Sınıf Matematik') 
      : isG11 
      ? '11. Sınıf Matematik' 
      : 'TYT Matematik'
  );
  const [customDilCategory, setCustomDilCategory] = useState<string>('Tümü');
  const [customBookTitle, setCustomBookTitle] = useState('');
  const [customPublisher, setCustomPublisher] = useState('');
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);

  // Kademeye göre hazır başlangıç kaynakları listesi
  const availableStarterBooks = useMemo(() => {
    if (gradeLevel === '9') return RECOMMENDED_STARTER_BOOKS_GRADE9;
    if (gradeLevel === '10') return RECOMMENDED_STARTER_BOOKS_GRADE10;
    if (gradeLevel === '11') return RECOMMENDED_STARTER_BOOKS_GRADE11[selectedField] || RECOMMENDED_STARTER_BOOKS_GRADE11.SAY;
    return RECOMMENDED_STARTER_BOOKS_YKS[selectedField] || RECOMMENDED_STARTER_BOOKS_YKS.SAY;
  }, [gradeLevel, selectedField]);

  // Kademeye göre başlangıç rutinleri
  const availableStarterRoutines = useMemo(() => {
    if (isEarly) return DEFAULT_STARTER_ROUTINES_GRADE9_10;
    if (isG11) return DEFAULT_STARTER_ROUTINES_GRADE11;
    return DEFAULT_STARTER_ROUTINES_YKS;
  }, [isEarly, isG11]);

  // Manuel ders listesi
  const availableSubjectsForCustom = useMemo(() => {
    if (gradeLevel === '9') {
      return GRADE9_SUBJECT_NAMES.length > 0 ? GRADE9_SUBJECT_NAMES : [
        '9. Sınıf Matematik', '9. Sınıf Türk Dili ve Edebiyatı', '9. Sınıf Fizik', '9. Sınıf Kimya', '9. Sınıf Biyoloji', '9. Sınıf Tarih', '9. Sınıf Coğrafya', '9. Sınıf Din Kültürü', '9. Sınıf İngilizce'
      ];
    }
    if (gradeLevel === '10') {
      return GRADE10_SUBJECT_NAMES.length > 0 ? GRADE10_SUBJECT_NAMES : [
        '10. Sınıf Matematik', '10. Sınıf Türk Dili ve Edebiyatı', '10. Sınıf Fizik', '10. Sınıf Kimya', '10. Sınıf Biyoloji', '10. Sınıf Tarih', '10. Sınıf Coğrafya', '10. Sınıf Felsefe', '10. Sınıf İngilizce'
      ];
    }
    if (gradeLevel === '11') {
      return [
        '11. Sınıf Matematik', '11. Sınıf Fizik', '11. Sınıf Kimya', '11. Sınıf Biyoloji',
        '11. Sınıf Edebiyat', '11. Sınıf Tarih', '11. Sınıf Coğrafya', '11. Sınıf Felsefe', 'TYT Matematik', 'TYT Türkçe'
      ];
    }
    if (customExamType === 'DIL') {
      return ['YDT İngilizce', 'YDT Almanca', 'YDT Fransızca', 'YDT Arapça', 'YDT Rusça'];
    }
    return YKS_SUBJECTS[customExamType] || [];
  }, [gradeLevel, customExamType]);

  const toggleStarterBookSelection = (book: { subject: string; title: string; publisher: string; units: number; examType: 'TYT' | 'AYT' }) => {
    const exists = selectedBooks.find(b => b.bookTitle === book.title);
    if (exists) {
      setSelectedBooks(selectedBooks.filter(b => b.bookTitle !== book.title));
    } else {
      const newBook: ResourceItem = {
        id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        subject: book.subject,
        bookTitle: book.title,
        publisher: book.publisher,
        totalUnits: book.units,
        completedUnits: 0,
        status: 'not_started',
        examType: book.examType
      };
      setSelectedBooks([...selectedBooks, newBook]);
    }
  };

  const handleAddCustomBookSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customBookTitle.trim()) return;

    let finalSubject = customSubject;
    let finalExamType: 'TYT' | 'AYT' = 'TYT';

    if (customExamType === 'DIL') {
      finalSubject = customDilCategory !== 'Tümü' ? `YDT İngilizce (${customDilCategory})` : 'YDT İngilizce';
      finalExamType = 'TYT';
    } else {
      finalExamType = customExamType;
    }

    const newBook: ResourceItem = {
      id: `res-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      subject: finalSubject,
      bookTitle: customBookTitle.trim(),
      publisher: customPublisher.trim() || 'Özel Yayın',
      totalUnits: 30,
      completedUnits: 0,
      status: 'not_started',
      examType: finalExamType
    };

    setSelectedBooks(prev => [...prev, newBook]);
    setCustomBookTitle('');
    setCustomPublisher('');
    setShowBookSuggestions(false);
    setShowCustomBookForm(false);
  };

  const handleRemoveBook = (bookId: string) => {
    setSelectedBooks(prev => prev.filter(b => b.id !== bookId));
  };

  // ════════════ STEP 3: GÜNLÜK RUTİNLER ════════════
  const [selectedRoutines, setSelectedRoutines] = useState<RoutineItem[]>(() => {
    if (isEarly) {
      return [
        { id: `rot-${Date.now()}-1`, title: '📖 Günlük Kitap Okuma', target: '30 Sayfa', completedDays: [] },
        { id: `rot-${Date.now()}-2`, title: '📝 Ders Tekrarı & Ödev', target: '45 Dk', completedDays: [] },
        { id: `rot-${Date.now()}-3`, title: '📐 Günün Soru Çözümü', target: '25 Soru', completedDays: [] }
      ];
    }
    if (isG11) {
      return [
        { id: `rot-${Date.now()}-1`, title: '📖 TYT Paragraf Çözümü', target: '20 Soru', completedDays: [] },
        { id: `rot-${Date.now()}-2`, title: '📐 TYT Problem Çözümü', target: '15 Soru', completedDays: [] },
        { id: `rot-${Date.now()}-3`, title: '🧠 11. Sınıf Alan Tekrarı', target: '30 Soru', completedDays: [] }
      ];
    }
    return [
      { id: `rot-${Date.now()}-1`, title: '📖 Paragraf Çözümü', target: '20 Soru', completedDays: [] },
      { id: `rot-${Date.now()}-2`, title: '📐 Problem Çözümü', target: '15 Soru', completedDays: [] },
      { id: `rot-${Date.now()}-3`, title: '📏 Geometri Rutini', target: '10 Soru', completedDays: [] }
    ];
  });

  // Manuel / Özel Rutin Ekleme Formu
  const [showCustomRoutineForm, setShowCustomRoutineForm] = useState(false);
  const [customRoutineTitle, setCustomRoutineTitle] = useState('');
  const [customRoutineTarget, setCustomRoutineTarget] = useState('20 Soru');
  const [customRoutineIcon, setCustomRoutineIcon] = useState('⚡');

  const toggleRoutine = (r: typeof DEFAULT_STARTER_ROUTINES_YKS[0]) => {
    const exists = selectedRoutines.find(item => item.title.includes(r.title));
    if (exists) {
      setSelectedRoutines(selectedRoutines.filter(item => !item.title.includes(r.title)));
    } else {
      setSelectedRoutines([
        ...selectedRoutines,
        {
          id: `rot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: `${r.icon} ${r.title}`,
          target: r.target,
          completedDays: []
        }
      ]);
    }
  };

  const handleAddCustomRoutine = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customRoutineTitle.trim()) return;

    const newRoutine: RoutineItem = {
      id: `rot-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${customRoutineIcon} ${customRoutineTitle.trim()}`,
      target: customRoutineTarget.trim() || 'Günlük Hedef',
      completedDays: []
    };

    setSelectedRoutines(prev => [...prev, newRoutine]);
    setCustomRoutineTitle('');
    setCustomRoutineTarget('20 Soru');
    setCustomRoutineIcon('⚡');
    setShowCustomRoutineForm(false);
  };

  const handleRemoveRoutine = (routineId: string) => {
    setSelectedRoutines(prev => prev.filter(r => r.id !== routineId));
  };

  const handleFinish = () => {
    const updatedProfile: Partial<StudentProfile> = {
      targetField: isEarly ? 'SAY' : selectedField,
      targetUniversity: targetUniversity.trim(),
      targetDepartment: targetDepartment.trim(),
      targetRank: isEarly ? 10000 : targetRank,
      targetTYTNet: isEarly ? 0 : targetTYTNet,
      targetAYTNet: isEarly ? 0 : targetAYTNet,
      schoolGpaTarget: targetSchoolGpa,
      weeklyQuestionTarget: targetWeeklyQuestions,
      weeklyStudyHoursTarget: targetWeeklyHours
    };

    onComplete(updatedProfile, selectedBooks, selectedRoutines);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] relative">
        
        {/* Decorative Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-24 bg-gradient-to-r from-indigo-500/30 via-fuchsia-500/30 to-emerald-500/30 rounded-full blur-3xl pointer-events-none" />

        {/* Step Indicator Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-black text-xs">
              {step}/4
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>
                  {isEarly
                    ? `${gradeLevel}. Sınıf Maarif Modeli Kurulumu`
                    : isG11
                    ? '11. Sınıf Alan & TYT Kurulumu'
                    : 'YKS Başlangıç & Derece Kurulumu'}
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                  {currentUser.className || getGradeDisplayName(gradeLevel)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {step === 1 && (isEarly ? '1. Başarı & OBP Hedeflerini Belirle' : '1. Hedef & Alanını Belirle')}
                {step === 2 && (isEarly ? `2. ${gradeLevel}. Sınıf Ders & Soru Bankalarını Seç` : '2. Kaynak Kitaplarını Seç & Ekle')}
                {step === 3 && '3. Günlük Çalışma Rutinlerini Kur'}
                {step === 4 && '4. Başlamaya Hazırsın! 🚀'}
              </div>
            </div>
          </div>

          {/* Step Progress Dots */}
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-indigo-500'
                    : s < step
                    ? 'w-2 bg-emerald-400'
                    : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1 relative z-10 custom-scrollbar">

          {/* ═════════ STEP 1: HEDEFLER & ALAN ═════════ */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hoş Geldin, {currentUser.name}!</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {isEarly
                    ? `${gradeLevel}. Sınıf Başarı & OBP Hedeflerini Belirleyelim`
                    : isG11
                    ? '11. Sınıf Alanını ve Hedeflerini Belirleyelim'
                    : 'YKS Hedefini ve Alanını Belirleyelim'}
                </h1>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {isEarly
                    ? 'Türkiye Yüzyılı Maarif Modeli ile lise yolculuğuna güçlü bir başlangıç yap! Yıl sonu karne notun ve OBP puanın YKS yerleştirmene doğrudan etki edecek.'
                    : isG11
                    ? '11. sınıf alan derslerin ve temel TYT hedeflerin için sana özel bir koçluk rotası çizelim.'
                    : 'Sana özel analizler ve öneriler sunabilmemiz için önce alanını ve hedeflerini seç.'}
                </p>
              </div>

              {/* ARA SINIF (9 & 10) ÖZEL HEDEF ALANLARI */}
              {isEarly ? (
                <div className="space-y-4">
                  
                  {/* Maarif Modeli Bilgilendirme Rozeti */}
                  <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
                    <div className="flex items-center space-x-2.5">
                      <School className="w-5 h-5 text-indigo-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white">{gradeLevel}. Sınıf Ortak Müfredat Programı</div>
                        <div className="text-[11px] text-slate-400">MEB Türkiye Yüzyılı Maarif Modeli Ders Dağılımı</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-500/20 rounded-xl text-[10px] font-bold text-indigo-300 border border-indigo-500/40">
                      Ortak Alan
                    </span>
                  </div>

                  {/* Yıl Sonu Notu (OBP) & Haftalık Hedefler */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center space-x-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>Hedef Karne Notu (OBP)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="60"
                          max="100"
                          step="0.5"
                          value={targetSchoolGpa}
                          onChange={(e) => setTargetSchoolGpa(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 text-emerald-400 text-sm font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                        />
                        <div className="text-[10px] text-slate-500 mt-1">
                          {targetSchoolGpa >= 85 ? '🏆 Takdir Belgesi Hedefi' : '🎖️ Teşekkür Belgesi'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-indigo-400" />
                        <span>Haftalık Soru Hedefi</span>
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="2000"
                        step="25"
                        value={targetWeeklyQuestions}
                        onChange={(e) => setTargetWeeklyQuestions(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-indigo-300 text-sm font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                      />
                      <div className="text-[10px] text-slate-500 mt-1">
                        Günlük ~{Math.round(targetWeeklyQuestions / 7)} soru
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-purple-400" />
                        <span>Haftalık Etüt Saati</span>
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="50"
                        step="1"
                        value={targetWeeklyHours}
                        onChange={(e) => setTargetWeeklyHours(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-purple-300 text-sm font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                      />
                      <div className="text-[10px] text-slate-500 mt-1">
                        Günlük ~{Math.round((targetWeeklyHours / 7) * 10) / 10} saat çalışma
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* 11, 12 & MEZUN İÇİN ALAN SEÇİMİ */
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Hazırlandığın YKS Alanı:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(['SAY', 'EA', 'SÖZ', 'DİL'] as FieldType[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSelectedField(f)}
                        className={`p-3.5 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                          selectedField === f
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-102 ring-2 ring-indigo-400/50'
                            : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="text-lg font-black">{f}</div>
                        <div className="text-[10px] font-normal opacity-80 mt-0.5">
                          {f === 'SAY' && 'Sayısal'}
                          {f === 'EA' && 'Eşit Ağırlık'}
                          {f === 'SÖZ' && 'Sözel'}
                          {f === 'DİL' && 'Yabancı Dil'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hedef Üniversite & Bölüm (Tüm Sınıflar İçin Motivasyon) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Hedef Üniversite */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Hayalindeki Üniversite {isEarly && '(Hedef / Motivasyon)'}</span>
                    </span>
                    {targetUniversity && (
                      <span className="text-[10px] text-indigo-300 font-mono">Logo önizleme</span>
                    )}
                  </label>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={targetUniversity}
                      onChange={(e) => {
                        setTargetUniversity(e.target.value);
                        setShowUniSuggestions(true);
                      }}
                      onFocus={() => setShowUniSuggestions(true)}
                      placeholder="Örn: Boğaziçi Üniversitesi, İTÜ, ODTÜ..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs font-semibold rounded-xl pl-3.5 pr-10 py-2.5 outline-none transition-all"
                    />
                    <div className="absolute right-3 flex items-center pointer-events-none">
                      <UniversityLogo universityName={targetUniversity} sizeClassName="w-5 h-5" />
                    </div>
                  </div>

                  {/* University Autocomplete Suggestions */}
                  {showUniSuggestions && filteredUniversities.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-950 border border-indigo-500/40 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredUniversities.map((uni) => (
                        <button
                          key={uni}
                          type="button"
                          onClick={() => {
                            setTargetUniversity(uni);
                            setShowUniSuggestions(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-indigo-600/30 hover:text-white flex items-center space-x-2.5 transition-colors border-b border-white/5 last:border-b-0 cursor-pointer"
                        >
                          <UniversityLogo universityName={uni} sizeClassName="w-4 h-4" />
                          <span className="truncate">{uni}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Hızlı Seçim Butonları */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {POPULAR_UNIVERSITIES.slice(0, 4).map((uni) => (
                      <button
                        key={uni}
                        type="button"
                        onClick={() => {
                          setTargetUniversity(uni);
                          setShowUniSuggestions(false);
                        }}
                        className="text-[10px] bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-white px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                      >
                        {uni.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hedef Bölüm */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hedef Bölüm / Meslek</span>
                  </label>
                  
                  <input
                    type="text"
                    value={targetDepartment}
                    onChange={(e) => {
                      setTargetDepartment(e.target.value);
                      setShowDeptSuggestions(true);
                    }}
                    onFocus={() => setShowDeptSuggestions(true)}
                    placeholder="Örn: Bilgisayar Mühendisliği, Tıp, Hukuk, Mimarlık..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs font-semibold rounded-xl px-3.5 py-2.5 outline-none transition-all"
                  />

                  {/* Department Autocomplete Suggestions */}
                  {showDeptSuggestions && filteredDepartments.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-950 border border-indigo-500/40 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredDepartments.map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => {
                            setTargetDepartment(dept);
                            setShowDeptSuggestions(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors border-b border-white/5 last:border-b-0 cursor-pointer"
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 11, 12 VE MEZUN İÇİN HEDEF SIRALAMA VE NETLER */}
              {!isEarly && (
                <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center space-x-1">
                      <Award className="w-3 h-3 text-emerald-400" />
                      <span>Hedef Sıralama</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-indigo-400 font-bold text-xs">#</span>
                      <input
                        type="number"
                        value={targetRank}
                        onChange={(e) => setTargetRank(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-white text-xs font-mono font-bold rounded-xl pl-6 pr-2 py-2 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Hedef TYT Net
                    </label>
                    <input
                      type="number"
                      value={targetTYTNet}
                      onChange={(e) => setTargetTYTNet(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {isG11 ? '11. Sınıf OBP Hedefi' : `Hedef ${selectedField === 'DİL' ? 'YDT' : 'AYT'} Net`}
                    </label>
                    <input
                      type="number"
                      value={isG11 ? targetSchoolGpa : targetAYTNet}
                      onChange={(e) => isG11 ? setTargetSchoolGpa(Number(e.target.value)) : setTargetAYTNet(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-emerald-300 text-xs font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════ STEP 2: KAYNAK KİTAPLARI ═════════ */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <BookCheck className="w-3.5 h-3.5" />
                  <span>
                    {isEarly
                      ? `${gradeLevel}. Sınıf Maarif Modeli Kaynakları`
                      : `${selectedField} Alanı Kaynak Önerileri & Kitap Ekleme`}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Kullandığın Kaynak Kitapları Seç & Ekle
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {isEarly
                    ? `${gradeLevel}. sınıf müfredatına uygun popüler soru bankalarından seç veya elindeki kitapları kolayca listene ekle.`
                    : 'Önerilen popüler kitaplardan hızlıca seçebilir veya elindeki farklı kitapları otomatik tamamlamayla ekleyebilirsin.'}
                </p>
              </div>

              {/* Starter Recommended Books Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {isEarly ? `${gradeLevel}. Sınıf Önerilen Başlangıç Kaynakları` : `${selectedField} Popüler Başlangıç Kaynakları`}
                  </span>
                  <span className="text-[10px] text-slate-400">Tek tıkla listene ekle</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableStarterBooks.map((book) => {
                    const isSelected = selectedBooks.some(b => b.bookTitle === book.title);

                    return (
                      <div
                        key={book.title}
                        onClick={() => toggleStarterBookSelection(book)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                            : 'bg-slate-950/60 border-slate-855 hover:border-slate-750'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-indigo-300 border border-slate-800">
                            {book.subject}
                          </span>
                          <div className="text-xs font-bold text-white truncate mt-1">
                            {book.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {book.publisher}
                          </div>
                        </div>

                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MANUEL KAYNAK EKLEME PANELİ */}
              <div className="pt-2 border-t border-slate-800">
                {!showCustomBookForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomBookForm(true)}
                    className="w-full py-2.5 px-4 bg-indigo-950/40 hover:bg-indigo-900/50 border border-dashed border-indigo-500/40 hover:border-indigo-400 rounded-2xl text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4 text-indigo-400" />
                    <span>+ Listede Olmayan Farklı Bir Kaynak Kitap Ekle</span>
                  </button>
                ) : (
                  <div className="bg-slate-950/80 border border-indigo-500/40 rounded-2xl p-4 space-y-3.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2 text-xs font-black text-indigo-300">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <span>Farklı / Özel Kaynak Ekle</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomBookForm(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Ders Seçimi</label>
                        <select
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer font-medium"
                        >
                          {availableSubjectsForCustom.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Yayınevi</label>
                        <input
                          type="text"
                          placeholder="Örn: 345, Bilgi Sarmal, Palme..."
                          value={customPublisher}
                          onChange={(e) => setCustomPublisher(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Kitap Adı</label>
                      <input
                        type="text"
                        placeholder="Örn: Soru Bankası, Konu Anlatımlı, Deneme..."
                        value={customBookTitle}
                        onChange={(e) => setCustomBookTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowCustomBookForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddCustomBookSubmit()}
                        disabled={!customBookTitle.trim()}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Kitabı Ekle
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Seçili Kitaplar Listesi */}
              {selectedBooks.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-300">
                    Seçilen Kaynakların ({selectedBooks.length} Kitap):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBooks.map((b) => (
                      <div
                        key={b.id}
                        className="inline-flex items-center space-x-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-200 px-3 py-1 rounded-xl text-xs"
                      >
                        <Check className="w-3 h-3 text-amber-400" />
                        <span className="font-semibold truncate max-w-[200px]">{b.subject} - {b.bookTitle}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBook(b.id)}
                          className="text-amber-400/60 hover:text-amber-400 p-0.5 rounded cursor-pointer"
                          title="Listeden Kaldır"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════ STEP 3: GÜNLÜK RUTİNLER ═════════ */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5" />
                  <span>
                    {isEarly
                      ? `${gradeLevel}. Sınıf Çalışma & Alışkanlık Rutinleri`
                      : 'Günlük Alışkanlık & Çalışma Rutinleri'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Her Gün Düzenli Yapacağın Rutinleri Belirle
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {isEarly
                    ? 'Lise başarısının sırrı günlük düzenli çalışmadır. Ödevlerini aksatmamak ve kitap okumak için hedeflerini seç.'
                    : 'Her gün aksatmadan yapacağın rutinleri seçebilir veya kendine özel yeni bir rutin oluşturabilirsin.'}
                </p>
              </div>

              {/* Starter Routine Options */}
              <div className="space-y-2.5">
                {availableStarterRoutines.map((r) => {
                  const isSelected = selectedRoutines.some(item => item.title.includes(r.title));

                  return (
                    <div
                      key={r.title}
                      onClick={() => toggleRoutine(r)}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500/50 shadow-md shadow-rose-500/10'
                          : 'bg-slate-950/60 border-slate-855 hover:border-slate-750'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <span className="text-2xl">{r.icon}</span>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            <span>{r.title}</span>
                            {r.recommended && (
                              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.2 rounded-full font-bold uppercase">
                                Önerilen
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Günlük Hedef: <strong className="text-slate-200">{r.target}</strong>
                          </div>
                        </div>
                      </div>

                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-rose-500 text-white border-rose-400 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MANUEL RUTİN EKLEME PANELİ */}
              <div className="pt-2 border-t border-slate-800">
                {!showCustomRoutineForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomRoutineForm(true)}
                    className="w-full py-2.5 px-4 bg-rose-950/30 hover:bg-rose-900/40 border border-dashed border-rose-500/40 hover:border-rose-400 rounded-2xl text-rose-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4 text-rose-400" />
                    <span>+ Özel / Farklı Bir Rutin Ekle</span>
                  </button>
                ) : (
                  <div className="bg-slate-950/80 border border-rose-500/40 rounded-2xl p-4 space-y-3.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2 text-xs font-black text-rose-300">
                        <Flame className="w-4 h-4 text-rose-400" />
                        <span>Yeni Özel Rutin Oluştur</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomRoutineForm(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Emoji İkon Seçici */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Rutin İkonu</label>
                      <div className="flex flex-wrap gap-1.5">
                        {ROUTINE_EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setCustomRoutineIcon(emoji)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-base border transition-all cursor-pointer ${
                              customRoutineIcon === emoji
                                ? 'bg-rose-500/20 border-rose-400 scale-110 shadow-sm'
                                : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Rutin Başlığı</label>
                        <input
                          type="text"
                          placeholder="Örn: 20 Dk Kitap Okuma, Ödev Kontrolü..."
                          value={customRoutineTitle}
                          onChange={(e) => setCustomRoutineTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Günlük Hedef Miktarı</label>
                        <input
                          type="text"
                          placeholder="Örn: 20 Soru, 30 Dk, 1 Test..."
                          value={customRoutineTarget}
                          onChange={(e) => setCustomRoutineTarget(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowCustomRoutineForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddCustomRoutine()}
                        disabled={!customRoutineTitle.trim()}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Rutini Ekle
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Seçili Rutinler Listesi */}
              {selectedRoutines.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-300">
                    Aktif Rutinlerin ({selectedRoutines.length} Rutin):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoutines.map((r) => (
                      <div
                        key={r.id}
                        className="inline-flex items-center space-x-1.5 bg-rose-500/15 border border-rose-500/40 text-rose-200 px-3 py-1 rounded-xl text-xs"
                      >
                        <Check className="w-3 h-3 text-rose-400" />
                        <span className="font-semibold">{r.title} ({r.target})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoutine(r.id)}
                          className="text-rose-400/60 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                          title="Listeden Kaldır"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════ STEP 4: HAZIRIM EKRANI ═════════ */}
          {step === 4 && (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Tebrikler! Kurulum Tamamlandı 🎉
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  {isEarly
                    ? `${gradeLevel}. Sınıf lise ve OBP başarı yolculuğun için tüm derslerin, kaynakların ve rutinlerin hazır!`
                    : isG11
                    ? '11. Sınıf alan derslerin ve TYT hazırlığın için akıllı koçluk programın hazırlandı!'
                    : 'Artık hedeflerine giden yolda tüm çalışma araçların hazır. Dashboard üzerinden günlük ilerlemeni takip edebilirsin.'}
                </p>
              </div>

              {/* Kurulum Özeti Kartı */}
              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-5 text-left space-y-3 max-w-lg mx-auto">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>{gradeLevel}. Sınıf Kurulum Özeti</span>
                  <span className="text-emerald-400">✅ Hazır</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kademe & Şube</span>
                    <span className="font-bold text-white">{currentUser.className || `${gradeLevel}. Sınıf`}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">{isEarly ? 'Hedef Karne Notu' : 'Hedef Üniversite'}</span>
                    <span className="font-bold text-emerald-400">
                      {isEarly ? `${targetSchoolGpa} / 100 Puan` : targetUniversity.split(' ')[0]}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">Eklenen Kaynaklar</span>
                    <span className="font-bold text-amber-300">{selectedBooks.length} Kitap</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">Aktif Rutinler</span>
                    <span className="font-bold text-rose-300">{selectedRoutines.length} Rutin</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full max-w-md mx-auto py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-extrabold text-sm rounded-2xl transition-all shadow-xl shadow-indigo-600/40 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
              >
                <span>
                  {isEarly ? 'Lise Başarı Yolculuğuna Başla' : isG11 ? '11. Sınıf Koçluk Programına Başla' : 'YKS Hazırlığına Başla'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        {step < 4 && (
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between relative z-10">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Geri</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              {step > 1 && step < 4 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as any)}
                  className="px-3 py-2 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Bu Adımı Atla
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowUniSuggestions(false);
                  setShowDeptSuggestions(false);
                  setShowBookSuggestions(false);
                  setStep((s) => (s + 1) as any);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <span>Devam Et</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
