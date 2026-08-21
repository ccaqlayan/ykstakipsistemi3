import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Award, 
  Sparkles, 
  X, 
  Printer, 
  Share2, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Target, 
  Flame, 
  Clock, 
  BookOpen, 
  Loader2, 
  RefreshCw,
  Copy,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { UserAccount, StudentProfile, QuestionLog, GeneralMockExam, StudyPlanItem } from '../../types';
import { generateWeeklyAiReportCard, WeeklyReportCardData } from '../../services/geminiService';
import { formatDisplayDate } from '../../utils/dateUtils';

interface WeeklyAiReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  profile?: StudentProfile | null;
  questionLogs?: QuestionLog[];
  generalMocks?: GeneralMockExam[];
  studyPlans?: StudyPlanItem[];
  currentWeekLabel?: string;
}

export const WeeklyAiReportCardModal: React.FC<WeeklyAiReportCardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  profile,
  questionLogs = [],
  generalMocks = [],
  studyPlans = [],
  currentWeekLabel = 'Bu Hafta'
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<WeeklyReportCardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const [lastGeneratedDate, setLastGeneratedDate] = useState<string | null>(null);
  const [dailyLimitWarning, setDailyLimitWarning] = useState<string | null>(null);

  const studentName = profile?.name || currentUser?.name || 'Öğrenci';
  const targetField = profile?.targetField || 'SAY';
  const targetGoal = profile?.targetUniversity && profile?.targetDepartment 
    ? `${profile.targetUniversity} - ${profile.targetDepartment}` 
    : (profile?.targetRank ? `Hedef #${profile.targetRank}` : 'İlk 20.000');

  const getStorageKey = () => {
    const userIdentifier = currentUser?.id || profile?.name || 'student';
    return `yks_weekly_ai_report_card_${userIdentifier}_${currentWeekLabel}`;
  };

  const getStoredReport = () => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse cached weekly report card', e);
    }
    return null;
  };

  // Haftalık verileri derleme fonksiyonu
  const buildReportPayload = () => {
    // Son 7 günün soru kayıtları
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysIso = sevenDaysAgo.toISOString().split('T')[0];

    const weeklyLogs = questionLogs.filter(l => l.date >= sevenDaysIso);
    const totalSolved = weeklyLogs.reduce((acc, curr) => acc + (curr.solvedCount || 0), 0);
    const totalCorrect = weeklyLogs.reduce((acc, curr) => acc + (curr.correctCount || 0), 0);
    const totalWrong = weeklyLogs.reduce((acc, curr) => acc + (curr.wrongCount || 0), 0);

    // Ders bazlı soru dağılımı
    const subjectMap: Record<string, { solved: number; correct: number; wrong: number }> = {};
    weeklyLogs.forEach(log => {
      const s = log.subject || 'Diğer';
      if (!subjectMap[s]) subjectMap[s] = { solved: 0, correct: 0, wrong: 0 };
      subjectMap[s].solved += log.solvedCount || 0;
      subjectMap[s].correct += log.correctCount || 0;
      subjectMap[s].wrong += log.wrongCount || 0;
    });

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      solved: data.solved,
      correct: data.correct,
      wrong: data.wrong,
      accuracy: data.solved > 0 ? Math.round((data.correct / data.solved) * 100) : 0
    })).sort((a, b) => b.solved - a.solved).slice(0, 6);

    // Tamamlanan ders planı süreleri
    const weeklyPlans = studyPlans.filter(p => p.weekLabel === currentWeekLabel || (p.status === 'completed'));
    const totalStudyMins = weeklyPlans.reduce((acc, curr) => acc + (curr.completedMinutes || 0), 0);
    const totalStudyHours = (totalStudyMins / 60).toFixed(1);

    // Son denemeler
    const latestMocks = generalMocks
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
      .map(m => ({
        title: m.title,
        date: formatDisplayDate(m.date),
        tytNet: m.tyt?.totalNet || 0,
        aytNet: m.ayt?.totalNet || 0,
        ydtNet: m.ydt?.net || 0
      }));

    return {
      studentName,
      targetField,
      targetGoal,
      weekLabel: currentWeekLabel,
      weeklyStats: {
        totalSolved,
        targetSolved: 1500,
        completionRate: Math.min(100, Math.round((totalSolved / 1500) * 100)),
        totalStudyHours,
        mistakeCount: totalWrong,
        pekiştirilenHataCount: Math.round(totalWrong * 0.6)
      },
      subjectBreakdown,
      latestMocks,
      topMistakeTopics: [
        { subject: 'AYT Matematik', topic: 'Türev & İntegral', count: 6 },
        { subject: 'AYT Fizik', topic: 'Elektrostatik', count: 4 }
      ]
    };
  };

  const fetchWeeklyReport = async (forceRefresh = false) => {
    const todayIsoDate = new Date().toISOString().split('T')[0];

    // Günde 1 kez oluşturma kuralı kontrolü
    if (forceRefresh && lastGeneratedDate === todayIsoDate) {
      setDailyLimitWarning('Haftalık başarı karnesi günde en fazla 1 kez yeniden oluşturulabilir. Bugün için karneniz zaten oluşturuldu. Yeni çalışma verilerinizle birlikte yarın tekrar yeni karne üretebilirsiniz.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDailyLimitWarning(null);
    try {
      const payload = buildReportPayload();
      const response = await generateWeeklyAiReportCard(payload, currentUser);
      if (response && response.data) {
        const nowIso = new Date().toISOString();
        setReportData(response.data);
        setLastGeneratedAt(nowIso);
        setLastGeneratedDate(todayIsoDate);

        // Karneyi 1 hafta boyunca hatırlamak üzere yerel hafızaya kaydet
        try {
          localStorage.setItem(getStorageKey(), JSON.stringify({
            reportData: response.data,
            createdAt: nowIso,
            createdDate: todayIsoDate,
            weekLabel: currentWeekLabel
          }));
        } catch (saveErr) {
          console.warn('Failed to cache weekly report card', saveErr);
        }
      } else {
        throw new Error('Karne verisi alınamadı.');
      }
    } catch (err: any) {
      console.error('Fetch weekly report card error:', err);
      setError(err?.message || 'Yapay zeka haftalık karnesi oluşturulurken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setDailyLimitWarning(null);
      const cached = getStoredReport();
      if (cached && cached.reportData) {
        // Önceden oluşturulmuş karne mevcut! 1 hafta boyunca doğrudan kayıtlı karne gösterilir.
        setReportData(cached.reportData);
        setLastGeneratedAt(cached.createdAt || null);
        setLastGeneratedDate(cached.createdDate || null);
        setIsLoading(false);
      } else {
        // Henüz bu haftaya ait karne yok, ilk kez oluştur
        fetchWeeklyReport(false);
      }
    } else {
      setReportData(null);
      setError(null);
      setDailyLimitWarning(null);
    }
  }, [isOpen, currentWeekLabel]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!reportData) return;
    const text = `📊 *${studentName} - YKS Haftalık AI Başarı Karnesi* 🎓\n\n` +
      `🏆 *Haftanın Notu:* ${reportData.overallScore}/100\n` +
      `📈 *Tahmini Sıralama:* ${reportData.estimatedRankBand}\n\n` +
      `🌟 *Genel Değerlendirme:* ${reportData.overallEvaluation}\n\n` +
      `🎯 *Gelecek Hafta Stratejileri:*\n` +
      reportData.goldenActionStrategies.map(s => `• ${s}`).join('\n') +
      `\n\n💬 *Koç Mesajı:* "${reportData.coachMotivationNote}"\n\n_YKS Takip Sistemi Akıllı Koçluk Raporu_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    if (!reportData) return;
    const text = `📊 ${studentName} - YKS Haftalık AI Başarı Karnesi (${currentWeekLabel})\n` +
      `🏆 Puan: ${reportData.overallScore}/100 | Sıralama Bandı: ${reportData.estimatedRankBand}\n\n` +
      `Genel Değerlendirme: ${reportData.overallEvaluation}\n\n` +
      `Koç Tavsiyeleri:\n` + reportData.goldenActionStrategies.join('\n');

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const formatDateTimeDisplay = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const isGeneratedToday = lastGeneratedDate === new Date().toISOString().split('T')[0];

  const modalContent = (
    <div 
      className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in print:p-0 print:bg-white print:static"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl shadow-indigo-950/60 space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar my-auto modal-dialog-card print:border-none print:shadow-none print:max-h-none print:w-full print:p-0 print:text-black">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 rounded-2xl border border-amber-400/30 text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-lg font-black text-white">Haftalık Yapay Zeka Başarı Karnesi</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                  Pazar Raporu
                </span>
                {lastGeneratedAt && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Kayıtlı Karne
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {studentName} • {targetField} • {currentWeekLabel} Performans Analizi
                {lastGeneratedAt && (
                  <span className="text-slate-400 ml-1.5 font-mono text-[11px]">
                    (Oluşturulma: {formatDateTimeDisplay(lastGeneratedAt)})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {reportData && (
              <>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                  title="WhatsApp ile Paylaş"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                  title="A4 PDF Yazdır"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PDF / Yazdır</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Günlük Limit Uyarısı */}
        {dailyLimitWarning && (
          <div className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center space-x-3 text-amber-200 animate-fade-in shadow-lg">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs font-medium leading-relaxed flex-1">
              <strong className="text-amber-300 font-bold block mb-0.5">Günde 1 Kez Oluşturma Kuralı:</strong>
              {dailyLimitWarning}
            </div>
            <button
              type="button"
              onClick={() => setDailyLimitWarning(null)}
              className="text-amber-400 hover:text-white p-1 rounded-lg hover:bg-amber-500/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-white">Yapay Zeka Karneniz Hazırlanıyor...</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Son 7 günün soru çözümleri, çalışılan süreler, giderilen hatalar ve deneme netleri bütüncül olarak analiz ediliyor.
              </p>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !isLoading && (
          <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => fetchWeeklyReport(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* REPORT CARD CONTENT */}
        {reportData && !isLoading && (
          <div className="space-y-6 print:space-y-4">
            
            {/* 1. Üst Banner & Karne Puanı */}
            <div className="p-6 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
              <div className="space-y-2 z-10 text-center sm:text-left">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{reportData.headline}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {studentName} • Haftalık Değerlendirme
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  {reportData.overallEvaluation}
                </p>
              </div>

              {/* Başarı Skoru Rozeti */}
              <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-slate-950/80 border border-amber-500/40 rounded-2xl shadow-xl text-center min-w-[120px]">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Haftalık Skor</span>
                <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 font-mono">
                  {reportData.overallScore}
                </span>
                <span className="text-[10px] font-bold text-slate-400">/ 100 Puan</span>
              </div>
            </div>

            {/* 2. Tahmini Sıralama Bandı Kartı */}
            <div className="p-5 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-400/40 text-cyan-300 shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block">
                    🎯 YKS TAHMİNİ BAŞARI BANDI ({targetField})
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">
                      {reportData.estimatedRankBand}
                    </span>
                    <span className="text-xs text-cyan-200/80 font-semibold">Sıralama Aralığı</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {reportData.rankBandExplanation}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block font-semibold">Hedeflenen Alan / Bölüm</span>
                <strong className="text-sm text-indigo-300 font-bold block">{targetGoal}</strong>
              </div>
            </div>

            {/* 3. Güçlü Yönler & Kritik Gelişim Alanları Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Güçlü Yönler */}
              <div className="p-5 bg-slate-950/70 border border-emerald-500/30 rounded-2xl space-y-3.5">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                    Haftanın En Güçlü Yönleri (Kazanımlar)
                  </h4>
                </div>
                <div className="space-y-2.5">
                  {reportData.topStrengths?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/90 border border-emerald-500/20 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-emerald-400 block">{item.subject}</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kritik Gelişim Alanları */}
              <div className="p-5 bg-slate-950/70 border border-rose-500/30 rounded-2xl space-y-3.5">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider">
                    Acil Tekrar & Gelişim Alanları
                  </h4>
                </div>
                <div className="space-y-2.5">
                  {reportData.criticalFocusAreas?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/90 border border-rose-500/20 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-300">{item.subject}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">{item.topic}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.actionAdvice}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 4. Gelecek Hafta İçin 3 Altın Strateji */}
            <div className="p-5 bg-gradient-to-br from-indigo-950/50 to-slate-950 border border-indigo-500/30 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                  Gelecek Hafta İçin 3 Altın Koçluk Stratejisi
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {reportData.goldenActionStrategies?.map((strat, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-900/90 border border-indigo-500/20 rounded-xl text-xs text-slate-200 font-medium leading-relaxed flex flex-col justify-between">
                    <span>{strat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Koçun Motivasyon Mesajı */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center space-x-3.5">
              <div className="text-2xl shrink-0">🚀</div>
              <p className="text-xs sm:text-sm text-amber-200 font-medium italic leading-relaxed">
                "{reportData.coachMotivationNote}"
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 print:hidden">
              <button
                type="button"
                onClick={() => fetchWeeklyReport(true)}
                disabled={isLoading}
                title={isGeneratedToday ? "Haftalık başarı karnesi günde 1 kez oluşturulabilir. Yarın tekrar yenileyebilirsiniz." : "Yeni çalışma ve soru verileriyle karneyi güncelle"}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isGeneratedToday 
                    ? 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-800' 
                    : 'bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-md'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Yeniden Değerlendir</span>
                {isGeneratedToday && (
                  <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-amber-400 border border-amber-500/30 font-mono">
                    Günde 1 Kez
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copySuccess ? 'Kopyalandı!' : 'Metni Kopyala'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Tamamdır
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
