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
  GraduationCap,
  Volume2,
  VolumeX,
  Square
} from 'lucide-react';
import { speechService, isSpeechSynthesisSupported } from '../../services/speechService';
import { UserAccount, StudentProfile, QuestionLog, GeneralMockExam, StudyPlanItem, SchoolExam } from '../../types';
import { generateWeeklyAiReportCard, WeeklyReportCardData } from '../../services/geminiService';
import { formatDisplayDate } from '../../utils/dateUtils';
import { 
  getGradeLevel, 
  calculateAverageForSemester, 
  calculateObpContribution, 
  getDiplomaHonorBadge,
  GradeLevel
} from '../../utils/gradeUtils';

interface WeeklyAiReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  profile?: StudentProfile | null;
  questionLogs?: QuestionLog[];
  generalMocks?: GeneralMockExam[];
  studyPlans?: StudyPlanItem[];
  schoolExams?: SchoolExam[];
  gradeLevel?: GradeLevel;
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
  schoolExams = [],
  gradeLevel,
  currentWeekLabel = 'Bu Hafta'
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<WeeklyReportCardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const [lastGeneratedDate, setLastGeneratedDate] = useState<string | null>(null);
  const [dailyLimitWarning, setDailyLimitWarning] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  const studentGrade = gradeLevel || getGradeLevel(profile?.className || currentUser?.className);
  const isGrade9or10 = studentGrade === '9' || studentGrade === '10';
  const isGrade11 = studentGrade === '11';
  const isAraSinif = isGrade9or10 || isGrade11;

  const sem1Avg = calculateAverageForSemester(schoolExams || [], 1);
  const sem2Avg = calculateAverageForSemester(schoolExams || [], 2);
  const currentGpa = sem2Avg > 0 ? Number(((sem1Avg + sem2Avg) / 2).toFixed(2)) : sem1Avg;
  const honorBadge = getDiplomaHonorBadge(currentGpa);
  const obpContribution = calculateObpContribution(currentGpa);

  const studentName = profile?.name || currentUser?.name || 'Öğrenci';
  const targetField = isGrade9or10 ? `Maarif Modeli (${studentGrade}. Sınıf)` : (profile?.targetField || 'SAY');
  const targetGoal = isAraSinif && profile?.schoolGpaTarget 
    ? `Hedef OBP: ${profile.schoolGpaTarget}` 
    : (profile?.targetUniversity && profile?.targetDepartment 
      ? `${profile.targetUniversity} - ${profile.targetDepartment}` 
      : (profile?.targetRank ? `Hedef #${profile.targetRank}` : 'İlk 20.000'));

  const getStorageKey = () => {
    const userIdentifier = currentUser?.id || profile?.name || 'student';
    return `yks_weekly_ai_report_card_${userIdentifier}_${currentWeekLabel}_${studentGrade}`;
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

    const schoolExamsSummary = (schoolExams && schoolExams.length > 0)
      ? schoolExams.map(e => `- ${e.semester}. Dönem ${e.examNumber}. Yazılı: ${e.subject} -> ${e.score}/100 ${e.classAverage !== undefined ? `(Sınıf Ort: ${e.classAverage})` : ''}`).join('\n')
      : undefined;

    return {
      studentName,
      targetField,
      targetGoal,
      weekLabel: currentWeekLabel,
      gradeLevel: studentGrade,
      schoolExamsSummary,
      targetGpa: profile?.schoolGpaTarget,
      obpScore: currentGpa > 0 ? (currentGpa * 5).toFixed(1) : undefined,
      weeklyStats: {
        totalSolved,
        targetSolved: isAraSinif ? 600 : 1500,
        completionRate: Math.min(100, Math.round((totalSolved / (isAraSinif ? 600 : 1500)) * 100)),
        totalStudyHours,
        mistakeCount: totalWrong,
        pekiştirilenHataCount: Math.round(totalWrong * 0.6)
      },
      subjectBreakdown,
      latestMocks,
      topMistakeTopics: isAraSinif ? [
        { subject: `${studentGrade}. Sınıf Matematik`, topic: 'Kavram Pekiştirme', count: 3 },
        { subject: `${studentGrade}. Sınıf Fizik`, topic: 'Temel Denklemler', count: 2 }
      ] : [
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
    const printDoc = document.getElementById('weekly-report-card-print-document');
    if (!printDoc) {
      window.print();
      return;
    }

    // Varsa eski iframe'i temizle
    const oldIframe = document.getElementById('weekly-report-print-iframe');
    if (oldIframe) {
      oldIframe.remove();
    }

    // Tamamen izole yazdırma iframe'i oluştur (Ana sayfa öğeleri asla karışmaz)
    const iframe = document.createElement('iframe');
    iframe.id = 'weekly-report-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow;
    if (!pri) {
      window.print();
      return;
    }

    // Dokümandaki Tailwind ve temel stilleri al
    let styleHtml = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      styleHtml += node.outerHTML;
    });

    pri.document.open();
    pri.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>YKS Haftalık Başarı Karnesi - ${studentName}</title>
          ${styleHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 4mm 7mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
              background: #ffffff !important;
              color: #0f172a !important;
              width: 100% !important;
              height: 100vh !important;
              max-height: 100vh !important;
              overflow: hidden !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            }
            #print-root {
              width: 100% !important;
              height: 100vh !important;
              max-height: 100vh !important;
              background: #ffffff !important;
              color: #0f172a !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: hidden !important;
            }
            #weekly-report-card-print-document {
              background: #ffffff !important;
              color: #0f172a !important;
              width: 100% !important;
              height: 100vh !important;
              max-height: 100vh !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            /* 🖨️ Mürekkep Tasarruflu Açık & Siyah-Beyaz Baskı Formatı */
            .bg-slate-900,
            .bg-slate-950,
            .bg-slate-950\\/80,
            .bg-slate-950\\/70,
            .bg-slate-900\\/90,
            .bg-gradient-to-br,
            .bg-gradient-to-r,
            .bg-cyan-950\\/60,
            .bg-indigo-950\\/50,
            .bg-amber-500\\/10,
            .bg-emerald-500\\/20,
            .bg-rose-500\\/10,
            .bg-cyan-500\\/20 {
              background-color: #ffffff !important;
              background-image: none !important;
              background: #ffffff !important;
              color: #0f172a !important;
            }
            /* Koyu metinleri yüksek kontrastlı siyah/koyu griye çevir */
            .text-white,
            .text-slate-100,
            .text-slate-200,
            .text-slate-300,
            .text-indigo-200,
            .text-indigo-300,
            .text-amber-200,
            .text-amber-300,
            .text-cyan-200,
            .text-cyan-300,
            .text-emerald-200,
            .text-emerald-300,
            .text-rose-200,
            .text-rose-300 {
              color: #0f172a !important;
              -webkit-text-fill-color: #0f172a !important;
            }
            .text-slate-400,
            .text-slate-500 {
              color: #475569 !important;
            }
            /* Tüm kenarlıkları şık 1px gri sınır çizgilerine dönüştür */
            div, section, article {
              border-color: #cbd5e1 !important;
            }
            .border-indigo-500\\/30,
            .border-indigo-500\\/20,
            .border-amber-500\\/40,
            .border-amber-500\\/30,
            .border-amber-400\\/30,
            .border-cyan-500\\/30,
            .border-cyan-400\\/40,
            .border-emerald-500\\/30,
            .border-emerald-500\\/20,
            .border-rose-500\\/30,
            .border-rose-500\\/20,
            .border-slate-800,
            .border-slate-700 {
              border-color: #cbd5e1 !important;
              border-width: 1px !important;
              border-style: solid !important;
            }
            /* Tek Sayfaya Sığdırma: Kart iç boşlukları ve kompakt fontlar */
            .p-6 {
              padding: 7px 10px !important;
              border-radius: 8px !important;
              background-color: #f8fafc !important;
              border: 1px solid #cbd5e1 !important;
            }
            .p-5 {
              padding: 6px 10px !important;
              border-radius: 8px !important;
              background-color: #f8fafc !important;
              border: 1px solid #cbd5e1 !important;
            }
            .p-4 {
              padding: 5px 8px !important;
              border-radius: 6px !important;
              background-color: #f8fafc !important;
              border: 1px solid #cbd5e1 !important;
            }
            .p-3.5, .p-3 {
              padding: 4px 6px !important;
              border-radius: 6px !important;
              background-color: #ffffff !important;
              border: 1px solid #e2e8f0 !important;
            }
            .space-y-6 > * + *, .space-y-5 > * + *, .space-y-4 > * + * {
              margin-top: 4px !important;
            }
            .space-y-3.5 > * + *, .space-y-3 > * + *, .space-y-2.5 > * + * {
              margin-top: 3px !important;
            }
            .gap-4, .gap-5 {
              gap: 5px !important;
            }
            .gap-2.5 {
              gap: 4px !important;
            }
            h1 { font-size: 13px !important; margin: 0 !important; }
            h2 { font-size: 13px !important; margin: 0 !important; }
            h3 { font-size: 12px !important; margin: 0 !important; }
            h4 { font-size: 10.5px !important; margin: 0 !important; }
            p, span, div { font-size: 10px !important; line-height: 1.25 !important; }
            .text-3xl, .text-4xl { font-size: 20px !important; }
            .text-2xl { font-size: 15px !important; }
            .text-xl { font-size: 13px !important; }
            .text-lg { font-size: 12px !important; }
            .text-sm { font-size: 10px !important; }
            .text-xs { font-size: 9px !important; }
            .text-\\[10px\\] { font-size: 8px !important; }
            svg { width: 12px !important; height: 12px !important; }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:block {
              display: block !important;
            }
          </style>
        </head>
        <body>
          <div id="print-root">
            ${printDoc.outerHTML}
          </div>
        </body>
      </html>
    `);
    pri.document.close();

    setTimeout(() => {
      pri.focus();
      pri.print();
      setTimeout(() => {
        iframe.remove();
      }, 1500);
    }, 300);
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

  const handleToggleSpeakReportCard = () => {
    if (!reportData) return;
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }

    let speechText = `Haftalık Yapay Zeka Başarı Karnesi. Öğrenci: ${studentName}. Haftalık başarı puanı: 100 üzerinden ${reportData.overallScore}. Tahmini YKS Sıralama Bandı: ${reportData.estimatedRankBand}. Genel Değerlendirme: ${reportData.overallEvaluation}. Gelecek Hafta Stratejileri: ${reportData.goldenActionStrategies.join('. ')}. Koç Motivasyon Mesajı: ${reportData.coachMotivationNote}.`;

    setIsSpeaking(true);
    speechService.speak(speechText, {
      id: 'weekly-report-card',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
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
                {isSpeechSynthesisSupported() && (
                  <button
                    type="button"
                    onClick={handleToggleSpeakReportCard}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer border ${
                      isSpeaking
                        ? 'bg-rose-600/30 text-rose-300 border-rose-500/50 animate-pulse'
                        : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border-purple-500/40'
                    }`}
                    title={isSpeaking ? 'Seslendirmeyi Durdur' : 'Karneyi Sesli Dinle'}
                  >
                    {isSpeaking ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                        <span>Durdur</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-purple-300" />
                        <span className="hidden sm:inline">Sesli Dinle</span>
                      </>
                    )}
                  </button>
                )}

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
          <div id="weekly-report-card-print-document" className="space-y-5 print:space-y-3">
            
            {/* Sadece Yazdırmada Gözüken Profesyonel Üst Başlık */}
            <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
              <div>
                <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  YKS Takip & Koçluk Sistemi • Haftalık Başarı Karnesi
                </h1>
                <p className="text-xs text-slate-600 font-semibold">
                  Öğrenci: <span className="text-slate-900 font-black">{studentName}</span> | Alan: <span className="text-slate-900 font-black">{targetField}</span> | Hafta: <span className="text-slate-900 font-black">{currentWeekLabel}</span>
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-500 font-mono">
                {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

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

            {/* 2. Tahmini Başarı Bandı Kartı */}
            <div className="p-5 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-400/40 text-cyan-300 shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block">
                    {isGrade9or10 
                      ? `🎯 ${studentGrade}. SINIF MAARİF MODELİ BAŞARI & OBP BANDI` 
                      : isGrade11 
                      ? `🎯 11. SINIF YAZILI & YKS TEMEL BANDI` 
                      : `🎯 YKS TAHMİNİ BAŞARI BANDI (${targetField})`}
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">
                      {reportData.estimatedRankBand}
                    </span>
                    <span className="text-xs text-cyan-200/80 font-semibold">
                      {isAraSinif ? 'Başarı Aralığı' : 'Sıralama Aralığı'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {reportData.rankBandExplanation}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block font-semibold">
                  {isAraSinif ? 'Hedef Diploma / OBP' : 'Hedeflenen Alan / Bölüm'}
                </span>
                <strong className="text-sm text-indigo-300 font-bold block">{targetGoal}</strong>
              </div>
            </div>

            {/* Ara Sınıflar İçin Okul Yazılıları & OBP Başarı Tablosu */}
            {isAraSinif && schoolExams && schoolExams.length > 0 && (
              <div className="p-5 bg-slate-950/70 border border-indigo-500/30 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Okul Yazılı Sınavları & OBP Durumu
                    </h4>
                  </div>
                  {honorBadge && (
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-black">
                      🏆 {honorBadge}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block">1. Dönem Ort.</span>
                    <strong className="text-sm font-black text-white font-mono">{sem1Avg > 0 ? sem1Avg : '-'}</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block">2. Dönem Ort.</span>
                    <strong className="text-sm font-black text-white font-mono">{sem2Avg > 0 ? sem2Avg : '-'}</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block">Tahmini OBP</span>
                    <strong className="text-sm font-black text-indigo-400 font-mono">{currentGpa > 0 ? (currentGpa * 5).toFixed(1) : '-'}</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block">YKS Katkısı</span>
                    <strong className="text-sm font-black text-emerald-400 font-mono">+{obpContribution} Puan</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {schoolExams.slice(0, 6).map((exam) => {
                    const diff = typeof exam.classAverage === 'number' ? Number((exam.score - exam.classAverage).toFixed(1)) : null;
                    return (
                      <div key={exam.id} className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400">{exam.semester}. Dönem • {exam.examNumber}. Yazılı</div>
                          <div className="font-bold text-white text-xs">{exam.subject}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-400 font-mono text-sm">{exam.score}</span>
                          {diff !== null && (
                            <span className={`block text-[9.5px] font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {diff >= 0 ? `+${diff}` : diff} Sınıf
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
