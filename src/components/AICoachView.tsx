import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Quote, 
  RefreshCw,
  Users,
  School,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  FileText,
  X,
  Calendar,
  MessageSquare,
  Target,
  AlertTriangle,
  Send,
  ListTodo,
  CheckCircle2,
  Flame,
  HelpCircle
} from 'lucide-react';
import { 
  YKSDataState, 
  AICoachAdvice, 
  UserAccount, 
  ClassDefinition, 
  ClassAICoachAdvice, 
  AuditLogItem, 
  AICoachChatMessage 
} from '../types';
import { fetchAICoachAdvice, fetchClassAICoachAdvice, sendAICoachChatMessage } from '../services/geminiService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export type AICoachTab = 'report' | 'chat' | 'targetGap' | 'urgentTopics' | 'history';

interface AICoachViewProps {
  state: YKSDataState;
  onSaveAdvice: (advice: AICoachAdvice) => void;
  onDeleteAdvice?: (idOrTimestamp: string) => void;
  onSaveClassAdvice?: (className: string, advice: ClassAICoachAdvice) => void;
  onDeleteClassAdvice?: (className: string, idOrTimestamp: string) => void;
  currentUser?: UserAccount;
  previewStudentUser?: UserAccount | null;
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

const DEFAULT_QUICK_PROMPTS = [
  '⚡ Bu haftaki en kritik çalışma eksiğim ne?',
  '🎯 Hedef sıralamama ulaşmak için hangi derslere ağırlık vermeliyim?',
  '⏱️ Denemelerde süre yetiştiremiyorum, bana taktik verir misin?',
  '📐 Matematik netlerimi +10 artırmak için hangi konulara odaklanmalıyım?'
];

const DIL_QUICK_PROMPTS = [
  '⚡ YDT Reading (Okuma) parçalarında hızlanmak için ne yapmalıyım?',
  '🎯 YDT Vocabulary ve Phrasal Verbs ezberini nasıl kalıcı hale getirebilirim?',
  '⏱️ YDT 80 soruluk denemede zaman yönetimini nasıl yapmalıyım?',
  '📐 TYT Türkçe ve Matematik ile DİL sıralamamı ilk 5.000\'e nasıl taşırım?'
];

export const AICoachView: React.FC<AICoachViewProps> = ({
  state,
  onSaveAdvice,
  onDeleteAdvice,
  onSaveClassAdvice,
  onDeleteClassAdvice,
  currentUser,
  previewStudentUser,
  allUsers = [],
  classes = [],
  studentsData = {},
  onAddAuditLog
}) => {
  const isTeacher = !previewStudentUser && (currentUser?.role === 'class_teacher' || currentUser?.role === 'school_counselor' || currentUser?.role === 'teacher' || currentUser?.role === 'admin');
  const isSchoolCounselor = !previewStudentUser && (currentUser?.role === 'school_counselor' || currentUser?.role === 'admin');

  const [activeTab, setActiveTab] = useState<AICoachTab>('report');

  const availableClassNames = isSchoolCounselor
    ? Array.from(new Set([...classes.map(c => c.name), ...allUsers.map(u => u.className).filter(Boolean) as string[]]))
    : (currentUser?.assignedClassNames || ['12-A SAY']);

  const [selectedClass, setSelectedClass] = useState<string>(availableClassNames[0] || '12-A SAY');
  const [classAdvice, setClassAdvice] = useState<ClassAICoachAdvice | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<AICoachChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`yks_ai_coach_chat_${currentUser?.id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: `Merhaba ${currentUser?.name || state.profile?.name || 'Şampiyon'}! 👋 Ben senin kişisel YKS Koçunum. Soru çözümlerini, deneme netlerini ve yanlış yaptığın konuları yakından takip ediyorum. Hedeflediğin ${state.profile?.targetUniversity || 'üniversite'} ve derece için aklına takılan her şeyi bana sorabilirsin!`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatEnabledGlobally, setIsChatEnabledGlobally] = useState<boolean>(true);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/api/gemini/model-settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.aiCoachChatEnabled === 'boolean') {
          setIsChatEnabledGlobally(data.aiCoachChatEnabled);
        }
      })
      .catch(err => console.warn('Could not check AI coach chat status:', err));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(`yks_ai_coach_chat_${currentUser?.id || 'guest'}`, JSON.stringify(chatMessages));
    } catch { }
  }, [chatMessages, currentUser?.id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedDetailAdvice, setSelectedDetailAdvice] = useState<AICoachAdvice | null>(null);
  const [adviceToDelete, setAdviceToDelete] = useState<AICoachAdvice | null>(null);

  const [classCurrentPage, setClassCurrentPage] = useState<number>(1);
  const [selectedDetailClassAdvice, setSelectedDetailClassAdvice] = useState<ClassAICoachAdvice | null>(null);
  const [classAdviceToDelete, setClassAdviceToDelete] = useState<ClassAICoachAdvice | null>(null);

  const selectedClassObj = useMemo(() => classes.find(c => c.name === selectedClass), [classes, selectedClass]);
  const allClassAdvices = useMemo(() => isTeacher ? [...(selectedClassObj?.classCoachAdvices || [])].reverse() : [], [selectedClassObj, isTeacher]);
  const allAdvices = useMemo(() => [...(state.coachAdvices || [])].reverse(), [state.coachAdvices]);

  const classGeneratedTodayCount = useMemo(() => {
    if (!isTeacher || !selectedClass) return 0;
    const todayStr = new Date().toLocaleDateString('tr-TR');
    const isoToday = new Date().toISOString().slice(0, 10);
    const advices = selectedClassObj?.classCoachAdvices || [];
    return advices.filter(adv => adv.timestamp && (adv.timestamp.includes(todayStr) || adv.timestamp.includes(isoToday))).length;
  }, [selectedClassObj, isTeacher, selectedClass]);

  const activeClassAdvice = useMemo(() => {
    if (classAdvice) return classAdvice;
    if (allClassAdvices.length > 0) return allClassAdvices[0];
    return null;
  }, [classAdvice, allClassAdvices]);

  useEffect(() => {
    setClassAdvice(null);
    setClassCurrentPage(1);
  }, [selectedClass]);

  const hasGeneratedToday = useMemo(() => {
    if (isTeacher) return false;
    const todayStr = new Date().toLocaleDateString('tr-TR');
    const isoToday = new Date().toISOString().slice(0, 10);
    return (state.coachAdvices || []).some(adv => adv.timestamp && (adv.timestamp.includes(todayStr) || adv.timestamp.includes(isoToday)));
  }, [state.coachAdvices, isTeacher]);

  const latestAdvice = allAdvices.length > 0 ? allAdvices[0] : null;

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.max(1, Math.ceil(allAdvices.length / ITEMS_PER_PAGE));

  const paginatedAdvices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allAdvices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allAdvices, currentPage]);

  const urgentStrugglingTopics = useMemo(() => {
    const errors = state.topicErrors || [];
    const unrevised = errors.filter(e => !e.revised);
    const map: Record<string, { subject: string; topic: string; count: number; errorReasons: string[] }> = {};
    unrevised.forEach(err => {
      const topicName = err.topicName || (err as any).topic || 'Genel Konu';
      const key = `${err.subject} - ${topicName}`;
      if (!map[key]) map[key] = { subject: err.subject, topic: topicName, count: 0, errorReasons: [] };
      map[key].count++;
      if (err.errorReason && !map[key].errorReasons.includes(err.errorReason)) map[key].errorReasons.push(err.errorReason);
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [state.topicErrors]);

  const targetGapData = useMemo(() => {
    const profile = state.profile;
    const isDil = profile?.targetField === 'DİL' || (profile?.targetField as string) === 'DIL';
    const targetTyt = profile?.targetTYTNet || 100;
    const targetAyt = isDil ? (profile?.targetYDTNet || 75) : (profile?.targetAYTNet || 70);
    let currentTyt = 0;
    let currentAyt = 0;
    if (state.generalMocks && state.generalMocks.length > 0) {
      const lastMock = state.generalMocks[state.generalMocks.length - 1];
      currentTyt = lastMock.tyt?.totalNet || 0;
      currentAyt = isDil ? (lastMock.ydt?.net || 0) : (lastMock.ayt?.totalNet || 0);
    }
    return { 
      isDil,
      currentTyt, 
      targetTyt, 
      tytGap: Math.max(0, Number((targetTyt - currentTyt).toFixed(2))), 
      currentAyt, 
      targetAyt, 
      aytGap: Math.max(0, Number((targetAyt - currentAyt).toFixed(2))) 
    };
  }, [state.profile, state.generalMocks]);

  const handleConfirmDelete = () => {
    if (previewStudentUser) {
      setErrorMsg('Öğrenci önizleme modunda rapor silinemez.');
      setAdviceToDelete(null);
      return;
    }
    if (adviceToDelete && onDeleteAdvice) {
      onDeleteAdvice(adviceToDelete.id || adviceToDelete.timestamp);
      if (selectedDetailAdvice && (selectedDetailAdvice.id === adviceToDelete.id || selectedDetailAdvice.timestamp === adviceToDelete.timestamp)) {
        setSelectedDetailAdvice(null);
      }
      setAdviceToDelete(null);
    }
  };

  const handleConfirmDeleteClassAdvice = () => {
    if (classAdviceToDelete && onDeleteClassAdvice) {
      onDeleteClassAdvice(selectedClass, classAdviceToDelete.id || classAdviceToDelete.timestamp);
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
    if (previewStudentUser) {
      setErrorMsg('Öğrenci önizleme modunda yeni rapor oluşturulamaz.');
      return;
    }
    if (!isTeacher && hasGeneratedToday) {
      setErrorMsg('Öğrenci hesabında günde yalnızca 1 adet Yapay Zeka Koçluk Analiz Raporu oluşturabilirsiniz.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await fetchAICoachAdvice(state, currentUser);
      onSaveAdvice({ ...result.advice, id: result.advice.id || 'adv-' + Date.now() });
      setCurrentPage(1);
      if (onAddAuditLog) onAddAuditLog('AI Koç analizi oluşturuldu.', 'system', 'AI_COACH_ANALYSIS', undefined, undefined, undefined, result.aiUsage);
    } catch (err: any) {
      setErrorMsg(err.message || 'Rapor oluşturulurken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchClassAdvice = async () => {
    if (classGeneratedTodayCount >= 2) {
      setErrorMsg(`"${selectedClass}" sınıfı için bugün izin verilen maksimum 2/2 rapora ulaşıldı.`);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
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

      const finalAdvice: ClassAICoachAdvice = { 
        ...result.advice, 
        id: 'class-adv-' + Date.now(), 
        className: selectedClass,
        timestamp: result.advice.timestamp || new Date().toLocaleString('tr-TR'),
        createdByName: currentUser?.name || 'Rehber Öğretmen',
        createdByRole: currentUser?.title || (currentUser?.role === 'school_counselor' ? 'Okul Rehber Öğretmeni' : 'Sınıf Rehber Öğretmeni'),
        createdById: currentUser?.id
      };
      if (onSaveClassAdvice) onSaveClassAdvice(selectedClass, finalAdvice);
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
      setErrorMsg(err.message || 'Sınıf koçluk raporu alınırken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || chatLoading) return;
    if (!isChatEnabledGlobally) {
      setErrorMsg('YKS Koç Canlı Sohbet özelliği yönetici tarafından geçici olarak kapatılmıştır.');
      return;
    }
    const userMsg: AICoachChatMessage = { 
      id: 'msg-' + Date.now(), 
      sender: 'user', 
      text: query, 
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const historyPayload = chatMessages.slice(-6).map(m => ({ sender: m.sender, text: m.text }));
      const result = await sendAICoachChatMessage(query, historyPayload, state, currentUser);
      setChatMessages(prev => [...prev, { 
        id: 'msg-' + (Date.now() + 1), 
        sender: 'ai', 
        text: result.reply, 
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { 
        id: 'msg-err-' + Date.now(), 
        sender: 'ai', 
        text: `⚠️ Yanıt alınırken hata oluştu: ${err.message || 'Lütfen tekrar deneyiniz.'}`, 
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Sohbet geçmişini sıfırlamak istediğinize emin misiniz?')) {
      setChatMessages([{ 
        id: 'msg-welcome-' + Date.now(), 
        sender: 'ai', 
        text: 'Sohbet geçmişi temizlendi. YKS koçun burada, hazırım! 🚀', 
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
      }]);
      try {
        localStorage.removeItem(`yks_ai_coach_chat_${currentUser?.id || 'guest'}`);
      } catch { }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-purple-300 text-[11px] font-semibold uppercase tracking-wider mb-1">
              <Bot className="w-4 h-4" />
              <span>Yapay Zeka Destekli YKS {isTeacher ? 'Sınıf & Okul' : ''} Koçluk Merkezi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isTeacher ? `${selectedClass} Sınıfı Yapay Zeka Koçluk Analizi` : 'Kişiselleştirilmiş Yapay Zeka YKS Çalışma Analizi'}
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              {isTeacher
                ? `${selectedClass} sınıfındaki tüm öğrencilerin soru günlükleri, deneme netleri ve eksik konuları üzerinden ortak rehberlik ve etüt planı üretir.`
                : 'Soru çözüm verilerini, deneme netlerini ve Hata Defterindeki eksik konularını analiz ederek kişisel çalışma reçetesi ve canlı rehberlik sunar.'
              }
            </p>
          </div>

          {isTeacher ? (
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
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
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analiz Ediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-200" />
                      <span>Sınıf Raporu Üret</span>
                    </>
                  )}
                </button>
              </div>

              <span className={`text-[11px] font-medium ${classGeneratedTodayCount >= 2 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {classGeneratedTodayCount >= 2 ? '⚠️ Günlük 2/2 analiz tamamlandı' : `✨ Günlük Sınıf Analiz Hakkı: ${classGeneratedTodayCount}/2`}
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:items-end gap-1 shrink-0">
              <button
                onClick={handleFetchAdvice}
                disabled={loading || hasGeneratedToday}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rapor Hazırlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Yeni Koçluk Raporu & Reçete Üret</span>
                  </>
                )}
              </button>
              <span className={`text-[11px] font-medium ${hasGeneratedToday ? 'text-amber-300' : 'text-emerald-300'}`}>
                {hasGeneratedToday ? '⚠️ Bugünkü 1/1 rapor hakkınız kullanıldı' : '✨ Günlük 1 analiz hakkı hazır'}
              </span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-500/40 p-3.5 rounded-2xl text-rose-300 text-xs flex items-center justify-between space-x-2 animate-shake">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-rose-900/50 rounded-lg text-rose-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isTeacher && (
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 items-center gap-1.5 w-full shadow-lg overflow-x-auto">
          {[
            { id: 'report', label: 'Koçluk Raporu & Reçete', icon: Sparkles },
            { id: 'chat', label: 'AI Koç ile Canlı Sohbet', icon: MessageSquare, badge: isChatEnabledGlobally },
            { id: 'targetGap', label: 'Hedef Gap & Net İbresi', icon: Target },
            { id: 'urgentTopics', label: 'Acil Müdahale Konuları', icon: AlertTriangle, count: urgentStrugglingTopics.length },
            { id: 'history', label: 'Geçmiş Raporlar', icon: FileText, count: allAdvices.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AICoachTab)}
              className={`flex-1 min-w-[130px] flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer relative ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              )}
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="text-[10px] bg-purple-500/30 text-purple-200 font-mono px-1.5 py-0.2 rounded-full font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {(!isTeacher && activeTab === 'report') && (
        <div className="space-y-6">
          {latestAdvice ? (
            <div className="space-y-6 animate-fade-in">
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Genel Gidişat ve Durum Değerlendirmesi</span>
                  </h2>
                  <span className="text-[11px] font-mono text-purple-300 font-bold bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full self-start sm:self-center">
                    Rapor Tarihi: {latestAdvice.timestamp}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  {latestAdvice.generalEvaluation}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl space-y-2.5">
                    <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Güçlü Yönleriniz & Öne Çıkanlar</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {latestAdvice.strengths?.map((str, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-emerald-400 font-bold mt-0.5">•</span>
                          <span className="leading-relaxed">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl space-y-2.5">
                    <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Öncelikli Geliştirilecek Alanlar</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {latestAdvice.weakAreas?.map((w, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-rose-400 font-bold mt-0.5">•</span>
                          <span className="leading-relaxed">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {latestAdvice.weeklyPrescription && latestAdvice.weeklyPrescription.length > 0 && (
                  <div className="bg-slate-950 border border-purple-500/30 p-5 rounded-2xl space-y-4 mt-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-2">
                        <ListTodo className="w-4 h-4 text-purple-400" />
                        <span>Haftalık YKS Çalışma & Soru Reçetesi</span>
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">Kişiye Özel Haftalık Kota</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {latestAdvice.weeklyPrescription.map((item, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2.5 hover:border-purple-500/40 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{item.subject}</span>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                              item.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              item.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {item.priority === 'high' ? 'Kritik' : item.priority === 'medium' ? 'Önemli' : 'Rutin'}
                            </span>
                          </div>

                          <div className="flex items-baseline space-x-1.5">
                            <span className="text-xl font-black text-purple-400 font-mono">{item.targetQuestions}</span>
                            <span className="text-[11px] text-slate-400">Hedef Soru</span>
                          </div>

                          {item.focusTopics && item.focusTopics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.focusTopics.map((top, tIdx) => (
                                <span key={tIdx} className="text-[9px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800">
                                  {top}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-[11px] text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-950 border border-indigo-500/30 p-5 rounded-2xl space-y-3 mt-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>YKS Koçunun Bu Haftaki 4 Temel Aksiyon Adımı</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {latestAdvice.actionPlan?.map((plan, idx) => (
                      <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">{plan}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {latestAdvice.motivationalQuote && (
                  <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-4 rounded-2xl border border-purple-500/30 flex items-center space-x-3 italic text-xs text-purple-200">
                    <Quote className="w-6 h-6 text-purple-400 flex-shrink-0" />
                    <span>"{latestAdvice.motivationalQuote}"</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Bot className="w-12 h-12 text-purple-400 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-white">Yapay Zeka Koç Değerlendirmesi Bekleniyor</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Yukarıdaki "Yeni Koçluk Raporu & Reçete Üret" butonuna tıklayarak son deneme netleriniz ve soru çözümleriniz üzerinden özel haftalık koçluk reçetenizi oluşturun.
              </p>
            </div>
          )}
        </div>
      )}

      {(!isTeacher && activeTab === 'chat') && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white">YKS Mentoru ile Canlı Danışmanlık</h3>
                  {isChatEnabledGlobally ? (
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Aktif & Hazır
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-bold">
                      Yönetici Tarafından Kapatıldı
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Çözdüğün soru sayıları, netlerin ve eksik konuların koçunun hafızasındadır. Dilediğin soruyu sorabilirsin.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearChat}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center space-x-1.5 self-start sm:self-center px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-rose-500/30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sohbeti Temizle</span>
            </button>
          </div>

          {!isChatEnabledGlobally ? (
            <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
              <Bot className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
              <h4 className="text-sm font-bold text-white">YKS Koç Canlı Sohbet Geçici Olarak Kapalı</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Yapay Zeka Koç canlı sohbet özelliği okul rehberliği veya sistem yöneticisi tarafından geçici olarak devre dışı bırakılmıştır.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Hızlı Taktik Soruları:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {((state.profile?.targetField === 'DİL' || (state.profile?.targetField as string) === 'DIL') ? DIL_QUICK_PROMPTS : DEFAULT_QUICK_PROMPTS).map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(promptText)}
                      disabled={chatLoading}
                      className="text-[11px] bg-slate-950 hover:bg-purple-950/40 text-purple-300 hover:text-purple-200 border border-purple-500/20 hover:border-purple-500/50 px-3 py-1.5 rounded-xl transition-all text-left cursor-pointer disabled:opacity-50"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 h-[380px] overflow-y-auto space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 px-1 text-[10px] text-slate-400 font-mono">
                      {msg.sender === 'user' ? (
                        <span>Sen • {msg.timestamp}</span>
                      ) : (
                        <span className="text-purple-400 flex items-center gap-1 font-bold">
                          <Bot className="w-3 h-3" /> YKS Koçu • {msg.timestamp}
                        </span>
                      )}
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[88%] sm:max-w-[75%] whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-purple-600/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex flex-col items-start space-y-1">
                    <span className="text-[10px] text-purple-400 font-mono font-bold flex items-center gap-1 px-1">
                      <Bot className="w-3 h-3" /> YKS Koçu yazıyor...
                    </span>
                    <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 flex items-center space-x-2 text-xs text-purple-300">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Netlerin ve çalışma kayıtların taranıyor...</span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Koçuna bir soru sor (Örn: Bu hafta Geometriyi nasıl toparlarım?)..."
                  disabled={chatLoading}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-white p-3 rounded-xl focus:outline-none placeholder-slate-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gönder</span>
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {(!isTeacher && activeTab === 'targetGap') && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">TYT Hedef Net Açığı</h3>
                    <span className="text-[10px] text-slate-400">Son Deneme vs Hedef</span>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                  Hedef: {targetGapData.targetTyt} Net
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Mevcut Net</span>
                  <span className="text-2xl font-black text-white font-mono">{targetGapData.currentTyt} Net</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Kalan Net Açığı</span>
                  <span className={`text-2xl font-black font-mono ${targetGapData.tytGap > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {targetGapData.tytGap > 0 ? `+${targetGapData.tytGap} Net` : 'Hedefe Ulaşıldı 🎉'}
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((targetGapData.currentTyt / targetGapData.targetTyt) * 100))}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${targetGapData.isDil ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{targetGapData.isDil ? 'YDT Hedef Net Açığı' : 'AYT Hedef Net Açığı'}</h3>
                    <span className="text-[10px] text-slate-400">{targetGapData.isDil ? 'Yabancı Dil (80 Soru) vs Hedef' : 'Son Deneme vs Hedef'}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${targetGapData.isDil ? 'text-sky-400 bg-sky-500/10 border border-sky-500/20' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'}`}>
                  Hedef: {targetGapData.targetAyt} Net
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Mevcut Net</span>
                  <span className="text-2xl font-black text-white font-mono">{targetGapData.currentAyt} Net</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Kalan Net Açığı</span>
                  <span className={`text-2xl font-black font-mono ${targetGapData.aytGap > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {targetGapData.aytGap > 0 ? `+${targetGapData.aytGap} Net` : 'Hedefe Ulaşıldı 🎉'}
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${targetGapData.isDil ? 'bg-gradient-to-r from-sky-500 to-cyan-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                  style={{ width: `${Math.min(100, Math.round((targetGapData.currentAyt / targetGapData.targetAyt) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Flame className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">En Hızlı Net Kazanabileceğin Yüksek Getirili Konular</h3>
                <p className="text-[11px] text-slate-400">
                  ÖSYM sınavlarında çıkma sıklığı yüksek olan ve eksik görünen konuların toparlanması en yüksek net sıçramasını sağlayacaktır.
                </p>
              </div>
            </div>

            {latestAdvice?.targetGapAnalysis?.highYieldTopics && latestAdvice.targetGapAnalysis.highYieldTopics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {latestAdvice.targetGapAnalysis.highYieldTopics.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-2 hover:border-amber-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{item.subject} • {item.topic}</span>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold font-mono">
                        +{item.estimatedNetGain} Net Potansiyeli
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">
                  Detaylı yüksek getirili konu analizini görmek için lütfen "Yeni Koçluk Raporu & Reçete Üret" butonuna basarak güncel analiz alınız.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {(!isTeacher && activeTab === 'urgentTopics') && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Acil Müdahale Konuları (Kritik Hata Alarmı)</h3>
                  <p className="text-[11px] text-slate-400">
                    Hata Defterinde henüz pekiştirilmemiş yanlışların yoğunlaştığı konular.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full self-start sm:self-center">
                {urgentStrugglingTopics.length} Kritik Konu
              </span>
            </div>

            {urgentStrugglingTopics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {urgentStrugglingTopics.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 hover:border-rose-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                        {item.subject}
                      </span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold font-mono">
                        {item.count} Bekleyen Hata
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white">{item.topic}</h4>
                      {item.errorReasons.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          Neden: {item.errorReasons.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Hata Defteri Durumu</span>
                      <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Tekrar Gerekli
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Harika! Bekleyen Kritik Hata Yok</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Hata Defterindeki tüm sorularını başarıyla tekrar etmiş ve pekiştirmişsin.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {(!isTeacher && activeTab === 'history') && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Geçmiş Yapay Zeka Koçluk Raporları
                </h3>
                <p className="text-[11px] text-slate-400">
                  Daha önce oluşturulmuş tüm koçluk analizleri ve haftalık tavsiye kayıtları.
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
                  className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
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
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailAdvice(adv)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 text-purple-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>İncele</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdviceToDelete(adv)}
                      className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                      title="Raporu Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Sayfa {currentPage} / {totalPages}</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isTeacher && activeClassAdvice && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>{activeClassAdvice.className} Sınıfı Koçluk Değerlendirme Raporu</span>
                </h2>
                {activeClassAdvice.createdByName && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Oluşturan: <span className="text-purple-300 font-semibold">{activeClassAdvice.createdByName}</span> ({activeClassAdvice.createdByRole || 'Rehber Öğretmen'})
                  </p>
                )}
              </div>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/30 shrink-0 self-start sm:self-center">
                {activeClassAdvice.timestamp}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {activeClassAdvice.generalEvaluation}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
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

              <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl space-y-2">
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

            <div className="bg-slate-950 border border-purple-500/30 p-5 rounded-2xl space-y-3 mt-4">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Rehber Öğretmen / Koç İçin Bu Haftalık Sınıf İçi Etüt ve Aksiyon Planı</span>
              </h3>

              <div className="space-y-2">
                {activeClassAdvice.actionPlan?.map((plan, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-normal">{plan}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDetailAdvice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>YKS Koçluk Rapor Detayı ({selectedDetailAdvice.timestamp})</span>
              </h3>
              <button onClick={() => setSelectedDetailAdvice(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-slate-200 bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                {selectedDetailAdvice.generalEvaluation}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Güçlü Yönler
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {selectedDetailAdvice.strengths?.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Geliştirilecek Alanlar
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {selectedDetailAdvice.weakAreas?.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedDetailAdvice.actionPlan && (
                <div className="bg-slate-950 border border-indigo-500/30 p-4 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Aksiyon Planı</span>
                  <div className="space-y-1.5">
                    {selectedDetailAdvice.actionPlan.map((p, i) => (
                      <div key={i} className="text-xs text-slate-200 flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">{i + 1}.</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!adviceToDelete}
        title="Koçluk Raporunu Sil"
        itemName={adviceToDelete ? `Yapay Zeka Koç Raporu (${adviceToDelete.timestamp})` : undefined}
        onConfirm={handleConfirmDelete}
        onClose={() => setAdviceToDelete(null)}
      />

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
