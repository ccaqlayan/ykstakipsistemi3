import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Quote, 
  RefreshCw,
  Award,
  Users,
  School,
  TrendingUp,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  FileText,
  X,
  Calendar
} from 'lucide-react';
import { YKSDataState, AICoachAdvice, UserAccount, ClassDefinition, ClassAICoachAdvice, AuditLogItem } from '../types';
import { fetchAICoachAdvice, fetchClassAICoachAdvice } from '../services/geminiService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AICoachViewProps {
  state: YKSDataState;
  onSaveAdvice: (advice: AICoachAdvice) => void;
  onDeleteAdvice?: (idOrTimestamp: string) => void;
  onSaveClassAdvice?: (className: string, advice: ClassAICoachAdvice) => void;
  onDeleteClassAdvice?: (className: string, idOrTimestamp: string) => void;
  currentUser?: UserAccount;
  allUsers?: UserAccount[];
  classes?: ClassDefinition[];
  studentsData?: Record<string, YKSDataState>;
  onAddAuditLog?: (
    description: string,
    category: AuditLogItem['category'],
    actionType: string,
    undoFn?: () => void,
    targetUserId?: string,
    targetUserName?: string,
    metadata?: Record<string, any>
  ) => void;
}

export const AICoachView: React.FC<AICoachViewProps> = ({
  state,
  onSaveAdvice,
  onDeleteAdvice,
  onSaveClassAdvice,
  onDeleteClassAdvice,
  currentUser,
  allUsers = [],
  classes = [],
  studentsData = {},
  onAddAuditLog
}) => {
  const isTeacher = currentUser?.role === 'class_teacher' || currentUser?.role === 'school_counselor' || currentUser?.role === 'teacher' || currentUser?.role === 'admin';
  const isSchoolCounselor = currentUser?.role === 'school_counselor' || currentUser?.role === 'admin';

  // Available classes for teacher selection
  const availableClassNames = isSchoolCounselor
    ? Array.from(new Set([...classes.map(c => c.name), ...allUsers.map(u => u.className).filter(Boolean) as string[]]))
    : (currentUser?.assignedClassNames || ['12-A SAY']);

  const [selectedClass, setSelectedClass] = useState<string>(availableClassNames[0] || '12-A SAY');
  const [classAdvice, setClassAdvice] = useState<ClassAICoachAdvice | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pagination & Modal States for Students
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedDetailAdvice, setSelectedDetailAdvice] = useState<AICoachAdvice | null>(null);
  const [adviceToDelete, setAdviceToDelete] = useState<AICoachAdvice | null>(null);

  // Pagination & Modal States for Class Advice
  const [classCurrentPage, setClassCurrentPage] = useState<number>(1);
  const [selectedDetailClassAdvice, setSelectedDetailClassAdvice] = useState<ClassAICoachAdvice | null>(null);
  const [classAdviceToDelete, setClassAdviceToDelete] = useState<ClassAICoachAdvice | null>(null);

  // Get selected class object from global classes list
  const selectedClassObj = useMemo(() => {
    return classes.find(c => c.name === selectedClass);
  }, [classes, selectedClass]);

  // All saved class coach advices for selectedClass reversed (newest first)
  const allClassAdvices = useMemo(() => {
    if (!isTeacher) return [];
    return [...(selectedClassObj?.classCoachAdvices || [])].reverse();
  }, [selectedClassObj, isTeacher]);

  // Daily report count for selectedClass (max 2 per day per class)
  const classGeneratedTodayCount = useMemo(() => {
    if (!isTeacher || !selectedClass) return 0;
    const todayStr = new Date().toLocaleDateString('tr-TR');
    const isoToday = new Date().toISOString().slice(0, 10);
    const advices = selectedClassObj?.classCoachAdvices || [];
    return advices.filter(adv => {
      if (!adv.timestamp) return false;
      return adv.timestamp.includes(todayStr) || adv.timestamp.includes(isoToday);
    }).length;
  }, [selectedClassObj, isTeacher, selectedClass]);

  // Active class advice to display (either freshly generated or latest saved report for class)
  const activeClassAdvice = useMemo(() => {
    if (classAdvice) return classAdvice;
    if (allClassAdvices.length > 0) return allClassAdvices[0];
    return null;
  }, [classAdvice, allClassAdvices]);

  // Reset classAdvice local selection when selectedClass changes
  useEffect(() => {
    setClassAdvice(null);
    setClassCurrentPage(1);
  }, [selectedClass]);

  // All student coach advices reversed (newest first)
  const allAdvices = useMemo(() => {
    return [...(state.coachAdvices || [])].reverse();
  }, [state.coachAdvices]);

  const hasGeneratedToday = useMemo(() => {
    if (isTeacher) return false;
    const todayStr = new Date().toLocaleDateString('tr-TR');
    const isoToday = new Date().toISOString().slice(0, 10);
    return (state.coachAdvices || []).some(adv => {
      if (!adv.timestamp) return false;
      return adv.timestamp.includes(todayStr) || adv.timestamp.includes(isoToday);
    });
  }, [state.coachAdvices, isTeacher]);

  const latestAdvice = allAdvices.length > 0 ? allAdvices[0] : null;

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.max(1, Math.ceil(allAdvices.length / ITEMS_PER_PAGE));
  const classTotalPages = Math.max(1, Math.ceil(allClassAdvices.length / ITEMS_PER_PAGE));

  const paginatedAdvices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allAdvices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allAdvices, currentPage]);

  const paginatedClassAdvices = useMemo(() => {
    const startIndex = (classCurrentPage - 1) * ITEMS_PER_PAGE;
    return allClassAdvices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allClassAdvices, classCurrentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (classCurrentPage > classTotalPages) {
      setClassCurrentPage(classTotalPages);
    }
  }, [classTotalPages, classCurrentPage]);

  const handleConfirmDelete = () => {
    if (adviceToDelete && onDeleteAdvice) {
      const key = adviceToDelete.id || adviceToDelete.timestamp;
      onDeleteAdvice(key);
      if (selectedDetailAdvice && (selectedDetailAdvice.id === adviceToDelete.id || selectedDetailAdvice.timestamp === adviceToDelete.timestamp)) {
        setSelectedDetailAdvice(null);
      }
      setAdviceToDelete(null);
    }
  };

  const handleConfirmDeleteClassAdvice = () => {
    if (classAdviceToDelete && onDeleteClassAdvice) {
      const key = classAdviceToDelete.id || classAdviceToDelete.timestamp;
      onDeleteClassAdvice(selectedClass, key);
      if (selectedDetailClassAdvice && (selectedDetailClassAdvice.id === classAdviceToDelete.id || selectedDetailClassAdvice.timestamp === classAdviceToDelete.timestamp)) {
        setSelectedDetailClassAdvice(null);
      }
      if (classAdvice && (classAdvice.id === classAdviceToDelete.id || classAdvice.timestamp === classAdviceToDelete.timestamp)) {
        setClassAdvice(null);
      }
      setClassAdviceToDelete(null);
    }
  };

  const handleFetchAdvice = async () => {
    if (!isTeacher && hasGeneratedToday) {
      setErrorMsg('Öğrenci hesabında günde yalnızca 1 adet Yapay Zeka Koçluk Analiz Raporu oluşturabilirsiniz. Bugün için analiz hakkınızı kullandınız. Yeni rapor için lütfen yarın tekrar deneyin.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await fetchAICoachAdvice(state, currentUser);
      const advice = result.advice;
      onSaveAdvice({
        ...advice,
        id: advice.id || 'adv-' + Date.now()
      });
      setCurrentPage(1); // Go to page 1 to show newly generated report
      
      if (onAddAuditLog) {
        onAddAuditLog(
          'Öğrenci Yapay Zeka Koçluğu çalışma analizi ve YKS derece tavsiyesi üretti.',
          'system',
          'AI_COACH_ANALYSIS',
          undefined,
          undefined,
          undefined,
          result.aiUsage
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Yapay Zeka koç tavsiyesi alınırken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchClassAdvice = async () => {
    if (classGeneratedTodayCount >= 2) {
      setErrorMsg(`"${selectedClass}" sınıfı için bugün izin verilen maksimum 2/2 Yapay Zeka Koçluk Analiz Raporu oluşturuldu. Aynı sınıfa bir günde en fazla 2 rapor oluşturulabilir. Yeni rapor için lütfen yarın tekrar deneyin.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      // Aggregate data for selected class
      const classStudents = allUsers.filter(u => u.role === 'student' && (u.className || '12-A SAY') === selectedClass);
      
      let sumTYT = 0;
      let countTYT = 0;
      let sumAYT = 0;
      let countAYT = 0;
      let totalSolved = 0;
      const strugglingTopicsMap: Record<string, number> = {};
      const studentsSummary: { name: string; tytNet: number; aytNet: number; topWeakTopic: string }[] = [];

      classStudents.forEach(st => {
        const stData = studentsData[st.id];
        let tyt = 0;
        let ayt = 0;
        let weakTopic = 'Yok';

        if (stData) {
          if (stData.generalMocks && stData.generalMocks.length > 0) {
            const lastMock = stData.generalMocks[stData.generalMocks.length - 1];
            if (lastMock.tyt?.totalNet) {
              tyt = lastMock.tyt.totalNet;
              sumTYT += tyt;
              countTYT++;
            }
            if (lastMock.ayt?.totalNet) {
              ayt = lastMock.ayt.totalNet;
              sumAYT += ayt;
              countAYT++;
            }
          }

          if (stData.questionLogs) {
            stData.questionLogs.forEach(q => {
              totalSolved += q.solvedCount || 0;
            });
          }

          if (stData.topicErrors) {
            const activeErrors = stData.topicErrors.filter(e => !e.revised);
            activeErrors.forEach(errItem => {
              const key = `${errItem.subject} - ${errItem.topicName || (errItem as any).topic || ''}`;
              strugglingTopicsMap[key] = (strugglingTopicsMap[key] || 0) + 1;
            });

            if (activeErrors.length > 0) {
              const firstErr = activeErrors[0];
              weakTopic = `${firstErr.subject}: ${firstErr.topicName || (firstErr as any).topic || ''}`;
            }
          }
        }

        studentsSummary.push({
          name: st.name,
          tytNet: tyt,
          aytNet: ayt,
          topWeakTopic: weakTopic
        });
      });

      const topStrugglingTopics = Object.entries(strugglingTopicsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count]) => `${topic} (${count} hatalı soru)`);

      const result = await fetchClassAICoachAdvice({
        className: selectedClass,
        studentCount: classStudents.length,
        averageTYTNet: countTYT > 0 ? Number((sumTYT / countTYT).toFixed(1)) : 0,
        averageAYTNet: countAYT > 0 ? Number((sumAYT / countAYT).toFixed(1)) : 0,
        totalQuestionsSolved: totalSolved,
        topStrugglingTopics,
        studentsSummary
      });

      const resAdvice = result.advice;
      const nowStr = new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '');
      const finalAdvice: ClassAICoachAdvice = {
        ...resAdvice,
        id: 'class-adv-' + Date.now(),
        className: selectedClass,
        timestamp: resAdvice.timestamp || nowStr,
        createdByName: currentUser?.name || 'Rehber Öğretmen',
        createdByRole: currentUser?.title || (currentUser?.role === 'school_counselor' ? 'Okul Rehber Öğretmeni' : 'Sınıf Rehber Öğretmeni'),
        createdById: currentUser?.id
      };

      if (onSaveClassAdvice) {
        onSaveClassAdvice(selectedClass, finalAdvice);
      }

      setClassAdvice(finalAdvice);
      setClassCurrentPage(1);

      if (onAddAuditLog) {
        onAddAuditLog(
          `${selectedClass} sınıfı için Yapay Zeka Koçluk Analiz Raporu oluşturdu.`,
          'system',
          'AI_COACH_CLASS_ANALYSIS',
          undefined,
          undefined,
          undefined,
          result.aiUsage
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sınıf yapay zeka koçluk tavsiyesi alınırken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Generate Button */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Bot className="w-4 h-4" />
              <span>Gemini AI Destekli YKS {isTeacher ? 'Sınıf & Okul' : ''} Koçluk Modülü</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isTeacher ? `${selectedClass} Sınıfı Yapay Zeka Koçluk Analizi` : 'Kişiselleştirilmiş Yapay Zeka YKS Çalışma Analizi'}
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl">
              {isTeacher
                ? `${selectedClass} sınıfındaki tüm öğrencilerin soru günlükleri, deneme netleri ve eksik konuları üzerinden ortak rehberlik ve koçluk analiz raporu üretir. Rapor sınıfa kaydedilir ve tüm öğretmenler tarafından görüntülenebilir.`
                : 'Tüm soru çözüm verilerinizi, deneme netlerinizi ve Yanlış Tablonuzdaki eksik konuları analiz ederek YKS derece hedefinize özel aksiyon planı üretir.'
              }
            </p>
          </div>

          {isTeacher ? (
            <div className="flex flex-col sm:items-end gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-white/10 flex items-center space-x-2">
                  <School className="w-4 h-4 text-purple-400" />
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-transparent text-xs text-white font-bold border-none focus:outline-none cursor-pointer"
                  >
                    {availableClassNames.map((cls) => (
                      <option key={cls} value={cls} className="bg-slate-900">{cls}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleFetchClassAdvice}
                  disabled={loading || classGeneratedTodayCount >= 2}
                  id="generate-class-ai-coach-advice-btn"
                  className={`bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 flex-shrink-0 cursor-pointer ${
                    classGeneratedTodayCount >= 2 ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sınıf Analizi Yapılıyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-200" />
                      <span>Sınıf Koçluk Raporu Üret</span>
                    </>
                  )}
                </button>
              </div>

              <span className={`text-[11px] font-medium ${classGeneratedTodayCount >= 2 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {classGeneratedTodayCount >= 2 
                  ? `⚠️ Bu sınıf için günlük 2/2 analiz hakkı tamamlandı` 
                  : `✨ Günlük Sınıf Analizi Hakkı: ${classGeneratedTodayCount}/2 Kullanıldı`}
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:items-end gap-1">
              <button
                onClick={handleFetchAdvice}
                disabled={loading || (!isTeacher && hasGeneratedToday)}
                id="generate-ai-coach-advice-btn"
                className={`bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 flex-shrink-0 cursor-pointer ${
                  (!isTeacher && hasGeneratedToday) ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analiz Yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Yapay Zeka Koç Tavsiyesi Al</span>
                  </>
                )}
              </button>
              {!isTeacher && (
                <span className={`text-[11px] font-medium ${hasGeneratedToday ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {hasGeneratedToday ? '⚠️ Bugünkü 1/1 analiz hakkınız kullanıldı' : '✨ Günlük 1 ücretsiz analiz hakkı hazır'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-500/40 p-4 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TEACHER CLASS AI COACH ACTIVE REPORT */}
      {isTeacher && activeClassAdvice && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>{activeClassAdvice.className} Sınıfı Koçluk Değerlendirme Raporu</span>
                </h2>
                {activeClassAdvice.createdByName && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Oluşturan Öğretmen: <span className="text-purple-300 font-semibold">{activeClassAdvice.createdByName}</span> ({activeClassAdvice.createdByRole || 'Rehber Öğretmen'})
                  </p>
                )}
              </div>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/30 shrink-0 self-start sm:self-center">
                {activeClassAdvice.timestamp}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              {activeClassAdvice.generalEvaluation}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Sınıfın Güçlü Yönleri</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeClassAdvice.strengths?.map((str, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Sınıfça Müdahale Edilecek Alanlar</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeClassAdvice.weakAreas?.map((w, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-slate-950 border border-purple-500/30 p-5 rounded-xl space-y-3 mt-4">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Rehber Öğretmen / Koç İçin Bu Haftalık Sınıf İçi Etüt ve Aksiyon Planı</span>
              </h3>

              <div className="space-y-2">
                {activeClassAdvice.actionPlan?.map((plan, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-normal">{plan}</p>
                  </div>
                ))}
              </div>
            </div>

            {activeClassAdvice.motivationalQuote && (
              <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-4 rounded-xl border border-purple-500/30 flex items-center space-x-3 italic text-xs text-purple-200">
                <Quote className="w-6 h-6 text-purple-400 flex-shrink-0" />
                <span>"{activeClassAdvice.motivationalQuote}"</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Student Advice Card (Most Recent Active Report) */}
      {!isTeacher && (latestAdvice ? (
        <div className="space-y-6">
          
          {/* General Evaluation Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Genel Gidişat ve Durum Analizi (Son Rapor)</span>
              </h2>
              <span className="text-[11px] font-mono text-purple-300 font-bold bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                {latestAdvice.timestamp}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              {latestAdvice.generalEvaluation}
            </p>

            {/* Strengths & Weak Areas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Strengths */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Güçlü Yönleriniz & Öne Çıkanlar</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {latestAdvice.strengths?.map((str, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weak Areas */}
              <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Öncelikli Geliştirilecek Alanlar</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {latestAdvice.weakAreas?.map((w, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Action Plan */}
            <div className="bg-slate-950 border border-indigo-500/30 p-5 rounded-xl space-y-3 mt-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>YKS Koçunun Bu Haftaki Aksiyon Planı</span>
              </h3>

              <div className="space-y-2">
                {latestAdvice.actionPlan?.map((plan, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-normal">{plan}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Quote */}
            {latestAdvice.motivationalQuote && (
              <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-4 rounded-xl border border-purple-500/30 flex items-center space-x-3 italic text-xs text-purple-200">
                <Quote className="w-6 h-6 text-purple-400 flex-shrink-0" />
                <span>"{latestAdvice.motivationalQuote}"</span>
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Bot className="w-12 h-12 text-purple-400 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">Yapay Zeka Koç Değerlendirmesi Bekleniyor</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Yukarıdaki "Yapay Zeka Koç Tavsiyesi Al" butonuna tıklayarak son deneme netleriniz ve soru çözümleriniz üzerinden özel koçluk raporu oluşturun.
          </p>
        </div>
      ))}

      {isTeacher && !activeClassAdvice && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-purple-400 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">{selectedClass} Sınıf Yapay Zeka Koçluk Analizi Bekleniyor</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Yukarıdaki "Sınıf Koçluk Raporu Üret" butonuna tıklayarak seçtiğiniz sınıfın tüm soru çözüm verileri ve deneme netleri üzerinden yapay zeka sınıf koçluk özetini oluşturun.
          </p>
        </div>
      )}

      {/* History of Past Advice for Teachers ({selectedClass}) */}
      {isTeacher && allClassAdvices.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Geçmiş Sınıf Koçluk Raporları ({selectedClass})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Bu sınıfa verilmiş tüm geçmiş yapay zeka analiz raporları. Sınıfa atanmış tüm öğretmenler görebilir.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-1 rounded-full self-start sm:self-center">
              Toplam {allClassAdvices.length} Sınıf Raporu
            </span>
          </div>

          <div className="space-y-2.5">
            {paginatedClassAdvices.map((adv, idx) => {
              const adviceKey = adv.id || adv.timestamp || `class-adv-idx-${idx}`;
              return (
                <div 
                  key={adviceKey}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left content snippet */}
                  <div 
                    onClick={() => {
                      setClassAdvice(adv);
                      setSelectedDetailClassAdvice(adv);
                    }}
                    className="flex-1 min-w-0 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-purple-300">
                      <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="font-bold">{adv.timestamp}</span>
                      {adv.createdByName && (
                        <span className="text-slate-400 font-normal">
                          • Oluşturan: <strong className="text-white">{adv.createdByName}</strong> ({adv.createdByRole || 'Öğretmen'})
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                      {adv.generalEvaluation}
                    </p>
                    <div className="flex items-center space-x-2 pt-0.5 flex-wrap gap-y-1">
                      {adv.strengths && adv.strengths.length > 0 && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
                          {adv.strengths.length} Sınıf Güçlü Yön
                        </span>
                      )}
                      {adv.weakAreas && adv.weakAreas.length > 0 && (
                        <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md font-medium">
                          {adv.weakAreas.length} Müdahale Alanı
                        </span>
                      )}
                      {adv.actionPlan && adv.actionPlan.length > 0 && (
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium">
                          {adv.actionPlan.length} Aksiyon Adımı
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setClassAdvice(adv);
                        setSelectedDetailClassAdvice(adv);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 text-purple-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                      title="Tüm Detayları Gör"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Detay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClassAdviceToDelete(adv)}
                      className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                      title="Sınıf Raporunu Sil (2 Adımlı Onay)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {classTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">
                Sayfa <strong className="text-white">{classCurrentPage}</strong> / <strong className="text-white">{classTotalPages}</strong> (Her sayfada 5 rapor)
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setClassCurrentPage(p => Math.max(1, p - 1))}
                  disabled={classCurrentPage === 1}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Önceki</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: classTotalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setClassCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        classCurrentPage === pageNum 
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setClassCurrentPage(p => Math.min(classTotalPages, p + 1))}
                  disabled={classCurrentPage === classTotalPages}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <span>Sonraki</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History of Past Advice for Students (5 Items Per Page + Pagination + Detail Popup + 2-Step Delete) */}
      {!isTeacher && allAdvices.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Geçmiş Koç Raporları
                </h3>
                <p className="text-[11px] text-slate-400">
                  Önceki tüm yapay zeka analizlerinizi inceleyebilir veya yönetebilirsiniz.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-1 rounded-full self-start sm:self-center">
              Toplam {allAdvices.length} Rapor
            </span>
          </div>

          <div className="space-y-2.5">
            {paginatedAdvices.map((adv, idx) => {
              const adviceKey = adv.id || adv.timestamp || `adv-idx-${idx}`;
              return (
                <div 
                  key={adviceKey}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left content snippet */}
                  <div 
                    onClick={() => setSelectedDetailAdvice(adv)}
                    className="flex-1 min-w-0 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-purple-300">
                      <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="font-bold">{adv.timestamp}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                      {adv.generalEvaluation}
                    </p>
                    <div className="flex items-center space-x-2 pt-0.5 flex-wrap gap-y-1">
                      {adv.strengths && adv.strengths.length > 0 && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
                          {adv.strengths.length} Güçlü Yan
                        </span>
                      )}
                      {adv.weakAreas && adv.weakAreas.length > 0 && (
                        <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md font-medium">
                          {adv.weakAreas.length} Eksik
                        </span>
                      )}
                      {adv.actionPlan && adv.actionPlan.length > 0 && (
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium">
                          {adv.actionPlan.length} Aksiyon
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailAdvice(adv)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 text-purple-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                      title="Tüm Detayları Gör"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Detay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdviceToDelete(adv)}
                      className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                      title="Raporu Sil (2 Adımlı Onay)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">
                Sayfa <strong className="text-white">{currentPage}</strong> / <strong className="text-white">{totalPages}</strong> (Her sayfada 5 rapor)
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Önceki</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum 
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <span>Sonraki</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Detail Modal Popup for Teacher Class Advice */}
      {selectedDetailClassAdvice && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedDetailClassAdvice(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>{selectedDetailClassAdvice.className} Sınıfı Koçluk Değerlendirme Raporu</span>
                  </h3>
                  <p className="text-xs text-purple-300 font-mono mt-0.5">
                    Tarih: {selectedDetailClassAdvice.timestamp} {selectedDetailClassAdvice.createdByName ? `• Oluşturan: ${selectedDetailClassAdvice.createdByName}` : ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDetailClassAdvice(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Evaluation */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>Sınıf Genel Gidişat ve Durum Analizi</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap">
                {selectedDetailClassAdvice.generalEvaluation}
              </p>
            </div>

            {/* Strengths & Weak Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Sınıfın Güçlü Yönleri</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedDetailClassAdvice.strengths?.map((str, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Sınıfça Müdahale Edilecek Alanlar</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedDetailClassAdvice.weakAreas?.map((w, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Plan */}
            <div className="bg-slate-950 border border-purple-500/30 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Rehber Öğretmen / Koç İçin Haftalık Sınıf Aksiyon Planı</span>
              </h4>
              <div className="space-y-2">
                {selectedDetailClassAdvice.actionPlan?.map((plan, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-normal">{plan}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Quote */}
            {selectedDetailClassAdvice.motivationalQuote && (
              <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-4 rounded-xl border border-purple-500/30 flex items-center space-x-3 italic text-xs text-purple-200">
                <Quote className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span>"{selectedDetailClassAdvice.motivationalQuote}"</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setClassAdviceToDelete(selectedDetailClassAdvice);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bu Sınıf Raporunu Sil (2 Adımlı Onay)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDetailClassAdvice(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Detail Modal Popup for Student Advice */}
      {selectedDetailAdvice && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedDetailAdvice(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Yapay Zeka Koçluk Analiz Raporu</span>
                  </h3>
                  <p className="text-xs text-purple-300 font-mono mt-0.5">
                    Oluşturulma Tarihi: {selectedDetailAdvice.timestamp}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDetailAdvice(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Evaluation */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>Genel Gidişat ve Durum Analizi</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap">
                {selectedDetailAdvice.generalEvaluation}
              </p>
            </div>

            {/* Strengths & Weak Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Güçlü Yönleriniz & Öne Çıkanlar</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedDetailAdvice.strengths?.map((str, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Öncelikli Geliştirilecek Alanlar</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedDetailAdvice.weakAreas?.map((w, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Plan */}
            <div className="bg-slate-950 border border-indigo-500/30 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>YKS Koçunun Bu Haftaki Aksiyon Planı</span>
              </h4>
              <div className="space-y-2">
                {selectedDetailAdvice.actionPlan?.map((plan, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-normal">{plan}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Quote */}
            {selectedDetailAdvice.motivationalQuote && (
              <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-4 rounded-xl border border-purple-500/30 flex items-center space-x-3 italic text-xs text-purple-200">
                <Quote className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span>"{selectedDetailAdvice.motivationalQuote}"</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAdviceToDelete(selectedDetailAdvice);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bu Raporu Sil (2 Adımlı Onay)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDetailAdvice(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal for Student Advice */}
      <ConfirmDeleteModal
        isOpen={!!adviceToDelete}
        title="Koç Raporunu Sil"
        itemName={adviceToDelete ? `Yapay Zeka Koç Raporu (${adviceToDelete.timestamp})` : undefined}
        onConfirm={handleConfirmDelete}
        onClose={() => setAdviceToDelete(null)}
      />

      {/* Confirm Delete Modal for Class Advice */}
      <ConfirmDeleteModal
        isOpen={!!classAdviceToDelete}
        title="Sınıf Koçluk Raporunu Sil"
        itemName={classAdviceToDelete ? `${selectedClass} Sınıf Yapay Zeka Koç Raporu (${classAdviceToDelete.timestamp})` : undefined}
        onConfirm={handleConfirmDeleteClassAdvice}
        onClose={() => setClassAdviceToDelete(null)}
      />

    </div>
  );
};

export default AICoachView;

