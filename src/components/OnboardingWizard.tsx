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
  Award
} from 'lucide-react';
import { UserAccount, StudentProfile, FieldType, ResourceItem, RoutineItem, ClassDefinition } from '../types';
import { UniversityLogo } from './UniversityLogo';
import { UNIVERSITIES } from '../data/universities';
import { DEPARTMENTS } from '../data/departments';
import { RECOMMENDED_BOOKS, RecommendedBook } from '../data/books';
import { YKS_SUBJECTS } from '../data/initialData';

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

const RECOMMENDED_STARTER_BOOKS: Record<FieldType, Array<{ subject: string; title: string; publisher: string; units: number; examType: 'TYT' | 'AYT' }>> = {
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

const DIL_CATEGORIES = [
  { id: 'Tümü', label: 'Tümü (Tüm Dil Kaynakları)', emoji: '🌐' },
  { id: 'Kelime', label: 'Kelime (Vocabulary)', emoji: '📖' },
  { id: 'Gramer', label: 'Gramer (Grammar)', emoji: '🧠' },
  { id: 'Skills', label: 'Skills (Soru Tipleri & Beceriler)', emoji: '🎯' },
  { id: 'Okuma', label: 'Okuma & Çeviri (Reading)', emoji: '📑' },
  { id: 'Deneme', label: 'Deneme Sınavları (Mocks)', emoji: '🏆' }
];

const DEFAULT_STARTER_ROUTINES = [
  { id: 'rot-para', title: 'Paragraf Çözümü', target: '20 Soru', icon: '📖', recommended: true },
  { id: 'rot-prob', title: 'Problem Çözümü', target: '15 Soru', icon: '📐', recommended: true },
  { id: 'rot-geom', title: 'Geometri Rutini', target: '10 Soru', icon: '📏', recommended: true },
  { id: 'rot-kelime', title: 'Kelime / Kavram Tekrarı', target: '30 Dk', icon: '🧠', recommended: false },
  { id: 'rot-deneme', title: 'Haftalık Branş Denemesi', target: '1 Deneme', icon: '🎯', recommended: false }
];

const ROUTINE_EMOJI_OPTIONS = ['📖', '📐', '📏', '🧠', '🎯', '⚡', '📝', '🎧', '☕', '💡', '🔥', '📚'];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  currentUser,
  currentProfile,
  onComplete
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // ════════════ STEP 1: HEDEFLER & ALAN ════════════
  const [selectedField, setSelectedField] = useState<FieldType>(currentProfile.targetField || 'SAY');
  const [targetUniversity, setTargetUniversity] = useState(currentProfile.targetUniversity || 'Orta Doğu Teknik Üniversitesi (ODTÜ)');
  const [targetDepartment, setTargetDepartment] = useState(currentProfile.targetDepartment || 'Bilgisayar Mühendisliği');
  const [targetRank, setTargetRank] = useState(currentProfile.targetRank || 5000);
  const [targetTYTNet, setTargetTYTNet] = useState(currentProfile.targetTYTNet || 95);
  const [targetAYTNet, setTargetAYTNet] = useState(currentProfile.targetAYTNet || 70);

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
  const [customSubject, setCustomSubject] = useState<string>('TYT Matematik');
  const [customDilCategory, setCustomDilCategory] = useState<string>('Tümü');
  const [customBookTitle, setCustomBookTitle] = useState('');
  const [customPublisher, setCustomPublisher] = useState('');
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);

  // Field değiştiğinde customExamType başlangıç ayarı
  React.useEffect(() => {
    if (selectedField === 'DİL') {
      if (customExamType === 'AYT') {
        setCustomExamType('DIL');
        setCustomSubject('YDT İngilizce');
      }
    } else {
      if (customExamType === 'DIL') {
        setCustomExamType('AYT');
        setCustomSubject('AYT Matematik');
      }
    }
  }, [selectedField]);

  const availableSubjectsForCustom = useMemo(() => {
    if (customExamType === 'DIL') {
      return ['YDT İngilizce', 'YDT Almanca', 'YDT Fransızca', 'YDT Arapça', 'YDT Rusça'];
    }
    return YKS_SUBJECTS[customExamType] || [];
  }, [customExamType]);

  const matchedBookSuggestions = useMemo(() => {
    if (!customBookTitle.trim()) return [];
    const query = toTurkishLowerCase(customBookTitle.trim());

    if (customExamType === 'DIL') {
      // DİL Alanı Önerileri (subject: 'Dil' olan kitaplar)
      return RECOMMENDED_BOOKS.filter((b) => {
        const isDil = toTurkishLowerCase(b.subject) === 'dil';
        const isCatMatch = customDilCategory === 'Tümü' || toTurkishLowerCase(b.category) === toTurkishLowerCase(customDilCategory);
        const isQueryMatch = toTurkishLowerCase(b.name).includes(query) ||
                             toTurkishLowerCase(b.publisher).includes(query) ||
                             toTurkishLowerCase(`${b.publisher} ${b.name}`).includes(query);
        return isDil && isCatMatch && isQueryMatch;
      }).slice(0, 6);
    }

    // TYT / AYT Genel Ders Eşleşmesi
    const normSub = toTurkishLowerCase(customSubject);
    return RECOMMENDED_BOOKS.filter((b) => {
      const bSub = toTurkishLowerCase(b.subject);
      const bCat = toTurkishLowerCase(b.category);
      const isSubMatch = bSub === normSub || bCat.includes(normSub) || normSub.includes(bSub) || normSub.includes(bCat);
      const isQueryMatch = toTurkishLowerCase(b.name).includes(query) ||
                           toTurkishLowerCase(b.publisher).includes(query) ||
                           toTurkishLowerCase(`${b.publisher} ${b.name}`).includes(query);
      return isSubMatch && isQueryMatch;
    }).slice(0, 6);
  }, [customExamType, customSubject, customDilCategory, customBookTitle]);

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
      finalExamType = 'TYT'; // Storage compatibility or as mapped
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
  const [selectedRoutines, setSelectedRoutines] = useState<RoutineItem[]>([
    { id: `rot-${Date.now()}-1`, title: 'Paragraf Çözümü', target: '20 Soru', completedDays: [] },
    { id: `rot-${Date.now()}-2`, title: 'Problem Çözümü', target: '15 Soru', completedDays: [] },
    { id: `rot-${Date.now()}-3`, title: 'Geometri Rutini', target: '10 Soru', completedDays: [] }
  ]);

  // Manuel / Özel Rutin Ekleme Formu
  const [showCustomRoutineForm, setShowCustomRoutineForm] = useState(false);
  const [customRoutineTitle, setCustomRoutineTitle] = useState('');
  const [customRoutineTarget, setCustomRoutineTarget] = useState('20 Soru');
  const [customRoutineIcon, setCustomRoutineIcon] = useState('⚡');

  const toggleRoutine = (r: typeof DEFAULT_STARTER_ROUTINES[0]) => {
    const exists = selectedRoutines.find(item => item.title === r.title);
    if (exists) {
      setSelectedRoutines(selectedRoutines.filter(item => item.title !== r.title));
    } else {
      setSelectedRoutines([
        ...selectedRoutines,
        {
          id: `rot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: r.title,
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
      targetField: selectedField,
      targetUniversity: targetUniversity.trim(),
      targetDepartment: targetDepartment.trim(),
      targetRank,
      targetTYTNet,
      targetAYTNet
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
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
              {step}/4
            </div>
            <div>
              <div className="text-xs font-bold text-white">YKS Başlangıç Kurulumu</div>
              <div className="text-[10px] text-slate-400">
                {step === 1 && '1. Hedef & Alanını Belirle'}
                {step === 2 && '2. Kaynak Kitaplarını Seç & Ekle'}
                {step === 3 && '3. Günlük Rutinlerini Kur'}
                {step === 4 && '4. Hazırsın! 🚀'}
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

          {/* ═════════ STEP 1: HEDEF & ALAN ═════════ */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hoş Geldin, {currentUser.name}!</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  YKS Hedefini ve Alanını Belirleyelim
                </h1>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Sana özel analizler ve öneriler sunabilmemiz için önce alanını ve hedeflerini seç.
                </p>
              </div>

              {/* Alan Seçimi (SAY / EA / SÖZ / DİL) */}
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

              {/* Hedef Üniversite & Bölüm (Otomatik Tamamlamalı) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Hedef Üniversite */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Hedef Üniversite</span>
                    </span>
                    {targetUniversity && (
                      <span className="text-[10px] text-indigo-300 font-mono">Önizleme logosu</span>
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
                      placeholder="Örn: İstanbul Teknik Üniversitesi (İTÜ)"
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
                    <span>Hedef Bölüm</span>
                  </label>
                  
                  <input
                    type="text"
                    value={targetDepartment}
                    onChange={(e) => {
                      setTargetDepartment(e.target.value);
                      setShowDeptSuggestions(true);
                    }}
                    onFocus={() => setShowDeptSuggestions(true)}
                    placeholder="Örn: Bilgisayar Mühendisliği, Tıp, İngilizce Öğretmenliği..."
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

              {/* Hedef Sıralama ve Netler */}
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
                    Hedef {selectedField === 'DİL' ? 'YDT' : 'AYT'} Net
                  </label>
                  <input
                    type="number"
                    value={targetAYTNet}
                    onChange={(e) => setTargetAYTNet(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-emerald-300 text-xs font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═════════ STEP 2: KAYNAK KİTAPLARI ═════════ */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <BookCheck className="w-3.5 h-3.5" />
                  <span>{selectedField} Alanı Kaynak Önerileri & Kitap Ekleme</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Kullandığın Kaynak Kitapları Seç & Ekle
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Önerilen popüler kitaplardan hızlıca seçebilir veya elindeki farklı kitapları otomatik tamamlamayla ekleyebilirsin.
                </p>
              </div>

              {/* Starter Recommended Books Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {selectedField} Popüler Başlangıç Kaynakları
                  </span>
                  <span className="text-[10px] text-slate-400">Tek tıkla listene ekle</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {RECOMMENDED_STARTER_BOOKS[selectedField]?.map((book) => {
                    const isSelected = selectedBooks.some(b => b.bookTitle === book.title);

                    return (
                      <div
                        key={book.title}
                        onClick={() => toggleStarterBookSelection(book)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                            : 'bg-slate-950/60 border-slate-850 hover:border-slate-750'
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

              {/* ── MANUEL KAYNAK EKLEME PANELİ (OTOMATİK TAMAMLAMALI & SADELEŞTİRİLMİŞ) ── */}
              <div className="pt-2 border-t border-slate-800">
                {!showCustomBookForm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomBookForm(true);
                      if (selectedField === 'DİL') {
                        setCustomExamType('DIL');
                        setCustomSubject('YDT İngilizce');
                      } else {
                        setCustomExamType('TYT');
                        setCustomSubject('TYT Matematik');
                      }
                    }}
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
                      {/* Sınav Türü Butonları (DİL alanı için TYT / DİL; diğerleri için TYT / AYT) */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Sınav Türü</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {selectedField === 'DİL' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomExamType('TYT');
                                  setCustomSubject('TYT Türkçe');
                                }}
                                className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                  customExamType === 'TYT'
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                TYT
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomExamType('DIL');
                                  setCustomSubject('YDT İngilizce');
                                }}
                                className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                  customExamType === 'DIL'
                                    ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                DİL (YDT)
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomExamType('TYT');
                                  setCustomSubject('TYT Matematik');
                                }}
                                className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                  customExamType === 'TYT'
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                TYT
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomExamType('AYT');
                                  setCustomSubject('AYT Matematik');
                                }}
                                className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                  customExamType === 'AYT'
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                AYT
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Ders / Kategori Seçimi */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          {customExamType === 'DIL' ? 'Kaynak Türü / Kategorisi' : 'Ders'}
                        </label>
                        {customExamType === 'DIL' ? (
                          <select
                            value={customDilCategory}
                            onChange={(e) => setCustomDilCategory(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 cursor-pointer"
                          >
                            {DIL_CATEGORIES.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.emoji} {cat.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={customSubject}
                            onChange={(e) => setCustomSubject(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            {availableSubjectsForCustom.map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Kitap Adı & Yayınevi (Toplam Ünite alanı kaldırıldı) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Kitap Adı (Otomatik Tamamlamalı) */}
                      <div className="relative">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                          <span>Kitap Adı</span>
                          <span className="text-[10px] text-indigo-400">Yazdıkça önerilir</span>
                        </label>
                        <input
                          type="text"
                          placeholder={customExamType === 'DIL' ? 'Örn: Passagework, Reader at Work...' : 'Örn: 3D Matematik, Bilgi Sarmal...'}
                          value={customBookTitle}
                          onChange={(e) => {
                            setCustomBookTitle(e.target.value);
                            setShowBookSuggestions(true);
                          }}
                          onFocus={() => setShowBookSuggestions(true)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                        />

                        {/* Kitap Otomatik Tamamlama Önerileri */}
                        {showBookSuggestions && matchedBookSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900 border border-indigo-500/40 rounded-xl p-1.5 shadow-2xl space-y-1 backdrop-blur-xl max-h-48 overflow-y-auto custom-scrollbar">
                            <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-1">
                              <span>{customExamType === 'DIL' ? `DİL Önerileri (${customDilCategory})` : `Kaynak Önerileri (${customSubject})`}</span>
                              <span className="text-indigo-400 font-mono">{matchedBookSuggestions.length} Öneri</span>
                            </div>
                            {matchedBookSuggestions.map((rec, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setCustomBookTitle(rec.name);
                                  setCustomPublisher(rec.publisher);
                                  setShowBookSuggestions(false);
                                }}
                                className="p-2 hover:bg-indigo-950/80 rounded-lg cursor-pointer transition-all border border-transparent hover:border-indigo-500/30 flex items-center justify-between gap-2 group"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                                    <span className="text-indigo-400 font-extrabold">{rec.publisher}</span> - {rec.name}
                                  </div>
                                  {rec.reason && (
                                    <p className="text-[10px] text-slate-400 truncate max-w-sm">{rec.reason}</p>
                                  )}
                                </div>
                                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold shrink-0">
                                  {rec.difficulty}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Yayınevi */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Yayınevi</label>
                        <input
                          type="text"
                          placeholder="Örn: Modadil, Akın Dil, 3D, Bilgi Sarmal"
                          value={customPublisher}
                          onChange={(e) => setCustomPublisher(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
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
                        Listeye Ekle
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Seçili Kitaplar Özeti */}
              {selectedBooks.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Seçilen Kaynaklar ({selectedBooks.length} Kitap)</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-1">
                    {selectedBooks.map((b) => (
                      <div
                        key={b.id}
                        className="inline-flex items-center space-x-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-xl text-xs"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="font-semibold truncate max-w-[200px]">{b.publisher} - {b.bookTitle}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBook(b.id)}
                          className="text-emerald-400/60 hover:text-rose-400 p-0.5 rounded cursor-pointer"
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
                  <span>Disiplin & Alışkanlık Takibi</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Günlük Çalışma Rutinlerini Başlat
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Her gün aksatmadan yapacağın rutinleri seçebilir veya kendine özel yeni bir rutin oluşturabilirsin.
                </p>
              </div>

              {/* Starter Routine Options */}
              <div className="space-y-2.5">
                {DEFAULT_STARTER_ROUTINES.map((r) => {
                  const isSelected = selectedRoutines.some(item => item.title === r.title);

                  return (
                    <div
                      key={r.title}
                      onClick={() => toggleRoutine(r)}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500/50 shadow-md shadow-rose-500/10'
                          : 'bg-slate-950/60 border-slate-850 hover:border-slate-750'
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

              {/* ── MANUEL RUTİN EKLEME PANELİ ── */}
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
                      {/* Rutin Başlığı */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Rutin Başlığı</label>
                        <input
                          type="text"
                          placeholder="Örn: 30 Dk Reading, Geometri 10 Soru..."
                          value={customRoutineTitle}
                          onChange={(e) => setCustomRoutineTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium"
                        />
                      </div>

                      {/* Günlük Hedef / Miktar */}
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

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                💡 <strong>İpucu:</strong> Günlük rutinlerini düzenli takip etmek sınavda süre yönetimini ve soru çözme hızını %50 artırır.
              </div>
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
                  Artık hedeflerine giden yolda tüm çalışma araçların hazır. Dashboard üzerinden günlük ilerlemeni takip edebilirsin.
                </p>
              </div>

              {/* Kurulum Özeti Kartı */}
              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-5 text-left space-y-3 max-w-lg mx-auto">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 border-b border-slate-800 pb-2">
                  Kurulum Özeti
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Hedef Alan & Üniversite</span>
                    <span className="font-bold text-white">{selectedField} • {targetUniversity.split(' ')[0]}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Hedef Sıralama</span>
                    <span className="font-mono font-bold text-emerald-400">#{targetRank.toLocaleString('tr-TR')}</span>
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
                <span>YKS Hazırlığına Başla</span>
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
