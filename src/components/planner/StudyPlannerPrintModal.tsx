import React, { useState, useRef } from 'react';
import { 
  Printer, 
  X, 
  FileText, 
  Settings2, 
  CheckSquare, 
  Eye, 
  Sparkles, 
  GraduationCap, 
  Target, 
  Calendar,
  Building2,
  Layers,
  Award,
  Check,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { StudyPlanItem, StudentProfile, UserAccount, RoutineItem, DayOfWeek } from '../../types';

interface StudyPlannerPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlans: StudyPlanItem[];
  weekLabel: string;
  profile?: StudentProfile;
  currentUser?: UserAccount;
  routines?: RoutineItem[];
  weekDaysMap?: Record<string, { isoDate: string; displayDate: string }>;
}

const DAYS: DayOfWeek[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export const StudyPlannerPrintModal: React.FC<StudyPlannerPrintModalProps> = ({
  isOpen,
  onClose,
  activePlans,
  weekLabel,
  profile,
  currentUser,
  routines = [],
  weekDaysMap
}) => {
  const defaultInstitutionName = React.useMemo(() => {
    if (profile?.highSchool && profile.highSchool.trim()) {
      const cleanSchool = profile.highSchool.trim().toUpperCase();
      if (cleanSchool.includes('REHBERLİK')) return cleanSchool;
      return `${cleanSchool} REHBERLİK SERVİSİ`;
    }
    return 'YILDIZ ANADOLU LİSESİ REHBERLİK SERVİSİ';
  }, [profile?.highSchool]);

  // Customization Options State
  const [institutionName, setInstitutionName] = useState(defaultInstitutionName);
  const [documentTitle, setDocumentTitle] = useState('YKS HAFTALIK DERS ÇALIŞMA PROGRAMI & TAKİP ÇİZELGESİ');
  const [coachNote, setCoachNote] = useState(
    'Haftalık hedeflerini adım adım tamamla, çözdüğün her sorunun analizini yap. Başarı, günlük disiplinin toplamıdır!'
  );
  const [showCheckboxes, setShowCheckboxes] = useState(true);
  const [showRoutines, setShowRoutines] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showBlankLines, setShowBlankLines] = useState(true);
  const [showGoalSummary, setShowGoalSummary] = useState(true);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Keep institutionName updated if profile high school changes
  React.useEffect(() => {
    setInstitutionName(defaultInstitutionName);
  }, [defaultInstitutionName]);

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const studentName = currentUser?.name || profile?.targetUniversity || 'YKS Adayı';
  const targetField = profile?.targetField || 'SAY';
  const targetUni = profile?.targetUniversity || 'Hedef Üniversite';
  const targetDept = profile?.targetDepartment || 'Hedef Bölüm';
  const targetRank = profile?.targetRank ? `#${profile.targetRank.toLocaleString('tr-TR')}` : 'İlk 10.000';

  // Stats calculation
  const totalPlannedMinutes = activePlans.reduce((sum, p) => sum + (p.plannedMinutes || 0), 0);
  const totalTargetQuestions = activePlans.reduce((sum, p) => sum + (p.targetQuestionCount || 0), 0);
  const totalTasks = activePlans.length;

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header Toolbar (Screen only) */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0 screen-only">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center space-x-2">
                <span>Haftalık Plan Yazdırma & PDF Çıktısı</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                  Siyah - Beyaz / Resmi Format
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                MEB/Rehberlik standartlarında mürekkep tasarruflu, yüksek kaliteli A4 PDF çıktısı.
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır / PDF Kaydet</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar Settings + Live Paper Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Settings Panel (Screen only) */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/70 p-4 space-y-4 overflow-y-auto shrink-0 custom-scrollbar screen-only text-xs">
            
            <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Çıktı Seçenekleri</span>
            </div>

            {/* Kurum & Başlık */}
            <div className="space-y-2.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Kurum / Okul Adı</label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Belge Başlığı</label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Koçluk & Motivasyon Notu</label>
                <textarea
                  rows={2}
                  value={coachNote}
                  onChange={(e) => setCoachNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium resize-none"
                />
              </div>
            </div>

            {/* Sayfa Yönü (Landscape / Portrait) */}
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-[10px] font-bold text-slate-400">Sayfa Düzeni</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    orientation === 'landscape'
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Yatay (Önerilen)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    orientation === 'portrait'
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Dikey
                </button>
              </div>
            </div>

            {/* Bölüm Aç / Kapat Toggle'ları */}
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Görünecek Alanlar
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="text-[11px]">Onay Kutucukları ([ ])</span>
                <input
                  type="checkbox"
                  checked={showCheckboxes}
                  onChange={(e) => setShowCheckboxes(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="text-[11px]">Günlük Rutinler Çizelgesi</span>
                <input
                  type="checkbox"
                  checked={showRoutines}
                  onChange={(e) => setShowRoutines(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="text-[11px]">Haftalık Hedef Özeti</span>
                <input
                  type="checkbox"
                  checked={showGoalSummary}
                  onChange={(e) => setShowGoalSummary(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="text-[11px]">Boş Ders Ekleme Çizgileri</span>
                <input
                  type="checkbox"
                  checked={showBlankLines}
                  onChange={(e) => setShowBlankLines(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="text-[11px]">İmza ve Onay Alanı</span>
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-[11px] text-indigo-200">
              💡 <strong>İpucu:</strong> Yazıcı çıktısını çalışma masana veya panona asarak, tamamladığın her dersi fiziksel olarak kurşun kalemle işaretleyebilirsin.
            </div>
          </div>

          {/* Right Live Paper Preview Area */}
          <div className="flex-1 bg-slate-950 p-4 sm:p-8 overflow-y-auto custom-scrollbar flex justify-center items-start">
            
            {/* The Actual Printable Sheet (White Paper / Crisp B&W) */}
            <div
              id="study-plan-print-document"
              ref={printAreaRef}
              className={`bg-white text-black font-sans shadow-2xl border border-gray-400 transition-all ${
                orientation === 'landscape'
                  ? 'w-full max-w-[1100px] min-h-[760px] p-6'
                  : 'w-full max-w-[800px] min-h-[1050px] p-6'
              }`}
              style={{
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            >
              {/* ══════════ 1. RESMİ ANTET & BAŞLIK ══════════ */}
              <div className="border-b-2 border-black pb-2 mb-3">
                <div className="flex items-start justify-between border-b border-black pb-1.5 mb-1.5">
                  <div className="text-left">
                    <div className="text-[11px] font-black uppercase tracking-wider text-black">
                      {institutionName}
                    </div>
                    <div className="text-[9px] font-bold text-gray-700">
                      YKS AKADEMİK BAŞARI VE DERS ÇALIŞMA TAKİP SİSTEMİ
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-black text-black">
                      HAFTA: <span className="font-mono">{weekLabel}</span>
                    </div>
                    <div className="text-[9px] text-gray-600">
                      Çıktı Tarihi: {new Date().toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>

                <div className="text-center my-1">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-black uppercase">
                    {documentTitle}
                  </h1>
                </div>

                {/* Öğrenci Bilgileri Şeridi */}
                <div className="grid grid-cols-4 gap-2 bg-gray-100 border border-black p-2 text-[10px] font-bold">
                  <div>
                    <span className="text-gray-600 block text-[8px] uppercase">Öğrenci Adı Soyadı</span>
                    <span className="text-black font-black text-[11px]">{studentName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8px] uppercase">Alan / Hedef Sıralama</span>
                    <span className="text-black">{targetField} Alanı • {targetRank}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8px] uppercase">Hedef Üniversite & Bölüm</span>
                    <span className="text-black truncate block">{targetUni.split('(')[0]} - {targetDept}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8px] uppercase">Haftalık Toplam Hedef</span>
                    <span className="text-black font-mono font-black">
                      {Math.floor(totalPlannedMinutes / 60)} sa {totalPlannedMinutes % 60} dk • {totalTargetQuestions} Soru
                    </span>
                  </div>
                </div>
              </div>

              {/* ══════════ 2. 7 GÜNLÜK HAFTALIK MATRİS TABLOSU ══════════ */}
              <div className="mb-3">
                <div className={`grid ${orientation === 'landscape' ? 'grid-cols-7 gap-1.5' : 'grid-cols-1 sm:grid-cols-2 gap-2'}`}>
                  {DAYS.map((day) => {
                    const dayPlans = activePlans.filter((p) => p.day === day);
                    const dayDateInfo = weekDaysMap?.[day];
                    const dayPlannedMins = dayPlans.reduce((s, p) => s + (p.plannedMinutes || 0), 0);
                    const dayTargetQ = dayPlans.reduce((s, p) => s + (p.targetQuestionCount || 0), 0);

                    return (
                      <div
                        key={day}
                        className="border-2 border-black flex flex-col justify-between bg-white text-[9px] min-h-[220px]"
                      >
                        {/* Gün Başlığı (Mürekkep Tasarruflu Açık Gri Zemin) */}
                        <div className="bg-gray-200 text-black border-b border-black px-1.5 py-1 text-center font-black flex items-center justify-between">
                          <span className="uppercase text-[9.5px] font-black">{day}</span>
                          {dayDateInfo && (
                            <span className="text-[7.5px] text-gray-700 font-mono font-bold">
                              {dayDateInfo.displayDate.split(' ')[0]} {dayDateInfo.displayDate.split(' ')[1]}
                            </span>
                          )}
                        </div>

                        {/* Günün Görevleri */}
                        <div className="p-1 space-y-1 flex-1 flex flex-col justify-start">
                          {dayPlans.length === 0 ? (
                            <div className="text-center text-gray-400 italic py-4 text-[8.5px]">
                              Planlanan ders yok
                            </div>
                          ) : (
                            dayPlans.map((plan, pIdx) => (
                              <div
                                key={plan.id || pIdx}
                                className="border-b border-gray-300 pb-1 last:border-b-0"
                              >
                                <div className="flex items-start space-x-1">
                                  {showCheckboxes && (
                                    <span className="inline-block w-3 h-3 border border-black rounded-[2px] mt-0.5 shrink-0" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="font-black text-black text-[9px] leading-tight truncate">
                                      {plan.subject}
                                    </div>
                                    <div className="text-gray-800 text-[8px] leading-tight truncate">
                                      {plan.topic}
                                    </div>
                                    <div className="text-gray-600 text-[7.5px] font-mono mt-0.2">
                                      {plan.plannedMinutes > 0 && `${plan.plannedMinutes} dk`}
                                      {plan.targetQuestionCount ? ` • ${plan.targetQuestionCount} Soru` : ''}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}

                          {/* Boş İlave Satır Çizgileri */}
                          {showBlankLines && (
                            <div className="pt-1 mt-auto border-t border-dashed border-gray-300 space-y-1.5 opacity-60">
                              <div className="flex items-center space-x-1">
                                {showCheckboxes && <span className="w-2.5 h-2.5 border border-gray-400 rounded-[2px] shrink-0" />}
                                <div className="h-2 border-b border-gray-400 w-full" />
                              </div>
                              <div className="flex items-center space-x-1">
                                {showCheckboxes && <span className="w-2.5 h-2.5 border border-gray-400 rounded-[2px] shrink-0" />}
                                <div className="h-2 border-b border-gray-400 w-full" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Günlük Toplam & Net Çalışma Süresi Alt Bilgisi */}
                        <div className="bg-gray-50 border-t border-black px-1.5 py-1 text-[7.5px] space-y-0.5">
                          <div className="flex items-center justify-between text-gray-700 font-bold">
                            <span>Hedef: {dayPlans.length} Ders</span>
                            <span className="font-mono font-black">{Math.floor(dayPlannedMins / 60)}s {dayPlannedMins % 60}d {dayTargetQ > 0 ? `• ${dayTargetQ} S` : ''}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-dashed border-gray-300 pt-0.5 font-bold text-black">
                            <span className="text-[7px] uppercase tracking-tighter">Net Çalışma Süresi:</span>
                            <span className="font-mono text-[7.5px] bg-white px-1 py-0.2 border border-gray-400 rounded">
                              ____ sa ____ dk
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ══════════ 3. GÜNLÜK ALIŞKANLIK & RUTİN ÇİZELGESİ ══════════ */}
              {showRoutines && (
                <div className="border border-black mb-2 text-[8.5px]">
                  <div className="bg-gray-200 px-2 py-0.5 font-black uppercase text-[8px] border-b border-black flex items-center justify-between">
                    <span>GÜNLÜK ALIŞKANLIK & DİSİPLİN TAKİP ÇİZELGESİ</span>
                    <span className="text-[7.5px] font-normal text-gray-700">Her gün tamamlanan rutine [X] atınız</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black bg-gray-50 text-[8px] font-bold text-center">
                          <th className="p-1 border-r border-black text-left w-36">Rutin Adı / Hedef</th>
                          {DAYS.map(d => (
                            <th key={d} className="p-1 border-r border-black last:border-r-0 w-10">
                              {d.slice(0, 3)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(routines.length > 0 ? routines : [
                          { id: '1', title: 'Paragraf Çözümü', target: '20 Soru', completedDays: [] },
                          { id: '2', title: 'Problem Çözümü', target: '15 Soru', completedDays: [] },
                          { id: '3', title: 'Geometri Rutini', target: '10 Soru', completedDays: [] },
                          { id: '4', title: 'Kelime / Formül Tekrarı', target: '30 Dk', completedDays: [] }
                        ]).map((rot, rIdx) => (
                          <tr key={rot.id || rIdx} className="border-b border-gray-300 last:border-b-0 text-center">
                            <td className="p-1 border-r border-black text-left font-bold text-[8px]">
                              {rot.title} <span className="font-normal text-gray-600">({rot.target})</span>
                            </td>
                            {DAYS.map(d => (
                              <td key={d} className="p-1 border-r border-black last:border-r-0">
                                <span className="inline-block w-3.5 h-3.5 border border-black rounded-[2px]" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ══════════ 4. KOÇLUK NOTU & İMZALAR ══════════ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto text-[8.5px]">
                {/* Koçluk Notu & Haftalık Hedef */}
                {showGoalSummary && (
                  <div className="border border-black p-2 bg-gray-50 flex flex-col justify-between">
                    <div>
                      <div className="font-black text-[8.5px] uppercase border-b border-gray-300 pb-0.5 mb-1 text-black">
                        Haftalık Odak & Koçluk Değerlendirmesi
                      </div>
                      <p className="text-[8px] text-gray-800 leading-relaxed italic">
                        "{coachNote}"
                      </p>
                    </div>
                    <div className="mt-1 pt-1 border-t border-dashed border-gray-300 text-[7.5px] text-gray-600 flex justify-between">
                      <span>Hedeflenen Toplam Ders Saati: <strong>{(totalPlannedMinutes / 60).toFixed(1)} Saat</strong></span>
                      <span>Hedef Soru: <strong>{totalTargetQuestions} Soru</strong></span>
                    </div>
                  </div>
                )}

                {/* İmza ve Onay Bölümü */}
                {showSignatures && (
                  <div className="border border-black p-2 bg-white flex flex-col justify-between">
                    <div className="font-black text-[8.5px] uppercase border-b border-gray-300 pb-0.5 mb-1 text-black">
                      Onay & İmzalar
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-4 text-center text-[7.5px]">
                      <div>
                        <div className="border-b border-black mb-0.5 h-4" />
                        <span className="font-bold">Öğrenci İmzası</span>
                      </div>
                      <div>
                        <div className="border-b border-black mb-0.5 h-4" />
                        <span className="font-bold">Veli İmzası</span>
                      </div>
                      <div>
                        <div className="border-b border-black mb-0.5 h-4" />
                        <span className="font-bold">Rehber Öğretmen / Koç</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Alt Küçük Dipnot */}
              <div className="text-[7px] text-gray-500 text-center mt-2 border-t border-gray-200 pt-1">
                YKS Koçluk ve Öğrenci Takip Sistemi • Bu belge öğrencinin haftalık akademik ilerlemesini takip etmek üzere otomatik oluşturulmuştur.
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
