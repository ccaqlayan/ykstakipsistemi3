import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { UserAccount, StudentProfile, FieldType, ResourceItem, RoutineItem, ClassDefinition } from '../types';
import { UniversityLogo } from './UniversityLogo';

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

const DEFAULT_STARTER_ROUTINES = [
  { id: 'rot-para', title: 'Paragraf Çözümü', target: '20 Soru', icon: '📖', recommended: true },
  { id: 'rot-prob', title: 'Problem Çözümü', target: '15 Soru', icon: '📐', recommended: true },
  { id: 'rot-geom', title: 'Geometri Rutini', target: '10 Soru', icon: '📏', recommended: true },
  { id: 'rot-kelime', title: 'Kelime / Kavram Tekrarı', target: '30 Dk', icon: '🧠', recommended: false },
  { id: 'rot-deneme', title: 'Haftalık Branş Denemesi', target: '1 Deneme', icon: '🎯', recommended: false }
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  currentUser,
  currentProfile,
  onComplete
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State: Hedefler
  const [selectedField, setSelectedField] = useState<FieldType>(currentProfile.targetField || 'SAY');
  const [targetUniversity, setTargetUniversity] = useState(currentProfile.targetUniversity || 'Orta Doğu Teknik Üniversitesi (ODTÜ)');
  const [targetDepartment, setTargetDepartment] = useState(currentProfile.targetDepartment || 'Bilgisayar Mühendisliği');
  const [targetRank, setTargetRank] = useState(currentProfile.targetRank || 5000);
  const [targetTYTNet, setTargetTYTNet] = useState(currentProfile.targetTYTNet || 95);
  const [targetAYTNet, setTargetAYTNet] = useState(currentProfile.targetAYTNet || 70);

  // Step 2 State: Seçilen Kitaplar
  const [selectedBooks, setSelectedBooks] = useState<ResourceItem[]>([]);

  // Step 3 State: Seçilen Rutinler
  const [selectedRoutines, setSelectedRoutines] = useState<RoutineItem[]>([
    { id: `rot-${Date.now()}-1`, title: 'Paragraf Çözümü', target: '20 Soru', completedDays: [] },
    { id: `rot-${Date.now()}-2`, title: 'Problem Çözümü', target: '15 Soru', completedDays: [] },
    { id: `rot-${Date.now()}-3`, title: 'Geometri Rutini', target: '10 Soru', completedDays: [] }
  ]);

  const toggleBookSelection = (book: { subject: string; title: string; publisher: string; units: number; examType: 'TYT' | 'AYT' }) => {
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

  const handleFinish = () => {
    const updatedProfile: Partial<StudentProfile> = {
      targetField: selectedField,
      targetUniversity,
      targetDepartment,
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
                {step === 2 && '2. Kaynak Kitaplarını Seç'}
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
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1 relative z-10">

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
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
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

              {/* Hedef Üniversite & Bölüm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Hedef Üniversite
                  </label>
                  <input
                    type="text"
                    value={targetUniversity}
                    onChange={(e) => setTargetUniversity(e.target.value)}
                    placeholder="Örn: ODTÜ, Boğaziçi, İTÜ..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs font-semibold rounded-xl px-3.5 py-2.5 outline-none transition-all"
                  />
                  {/* Hızlı Seçim Butonları */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {POPULAR_UNIVERSITIES.slice(0, 4).map((uni) => (
                      <button
                        key={uni}
                        type="button"
                        onClick={() => setTargetUniversity(uni)}
                        className="text-[10px] bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-white px-2 py-0.5 rounded-lg transition-all"
                      >
                        {uni.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Hedef Bölüm
                  </label>
                  <input
                    type="text"
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    placeholder="Örn: Bilgisayar Mühendisliği, Tıp, Hukuk..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs font-semibold rounded-xl px-3.5 py-2.5 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Hedef Sıralama ve Netler */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Hedef Sıralama
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
                  <span>{selectedField} Alanı Kaynak Önerileri</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Kullandığın Kaynak Kitapları Seç
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Çözmeye başladığın veya elinde olan kitapları seçerek tek tıkla kaynak takip listene ekle. (Daha sonra yenilerini ekleyebilirsin)
                </p>
              </div>

              {/* Book Recommendation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RECOMMENDED_STARTER_BOOKS[selectedField]?.map((book) => {
                  const isSelected = selectedBooks.some(b => b.bookTitle === book.title);

                  return (
                    <div
                      key={book.title}
                      onClick={() => toggleBookSelection(book)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
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
                          {book.publisher} • {book.units} Ünite/Test
                        </div>
                      </div>

                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedBooks.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <span>✅ <strong>{selectedBooks.length} kaynak</strong> takip listene eklenecek.</span>
                  <span className="font-mono font-bold">Toplam {selectedBooks.reduce((a, b) => a + b.totalUnits, 0)} Ünite</span>
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
                  Her gün aksatmadan yapacağın rutinleri seç. Haftalık başarı yüzden Dashboard'da anlık hesaplanır.
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
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
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

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                💡 <strong>İpucu:</strong> Paragraf ve Problem rutinlerini sabah saatlerinde çözmek sınav odaklanmasını %40 artırır.
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
                onClick={() => setStep((s) => (s + 1) as any)}
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
