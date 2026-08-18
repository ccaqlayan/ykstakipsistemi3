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
  HelpCircle,
  TrendingUp,
  BarChart2,
  BookOpen,
  GraduationCap,
  Award,
  Layers
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

  // --- Student Chat State ---
  const [studentChatMessages, setStudentChatMessages] = useState<AICoachChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`yks_ai_coach_chat_${currentUser?.id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: `Merhaba ${currentUser?.name || state.profile?.name || 'Şampiyon'}! 👋 Ben senin kişisel YKS Koçun ve Mentorunum. Soru çözümlerini, deneme netlerini ve yanlış yaptığın konuları yakından takip ediyorum. Hedeflediğin ${state.profile?.targetUniversity || 'üniversite'} ve derece için YKS hazırlığı, ders çalışma taktikleri ve motivasyon konusunda aklına takılan her şeyi bana sorabilirsin! Masanın başına geçmeye hazır mısın? 🚀`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // --- Teacher Class Chat State ---
  const [teacherChatMessages, setTeacherChatMessages] = useState<AICoachChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`yks_ai_coach_class_chat_${selectedClass}_${currentUser?.id || 'teacher'}`);
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      {
        id: 'msg-class-welcome',
        sender: 'ai',
        text: `Merhaba Değerli Hocam! 👋 Ben ${selectedClass} sınıfının YKS Sınıf Rehberliği ve Koçluk Danışmanıyım. Sınıfınızın soru çözümlerini, deneme net ortalamalarını ve en çok hata yapılan ortak konularını analiz ediyorum. Sınıf genelinde etüt planlama, ders bazlı eksik giderme, seviye gruplandırma ve motivasyon stratejileri hakkında aklınıza takılan her şeyi bana sorabilirsiniz! 🚀`,
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

  // Sync Student Chat Storage
  useEffect(() => {
    if (!isTeacher) {
      try {
        localStorage.setItem(`yks_ai_coach_chat_${currentUser?.id || 'guest'}`, JSON.stringify(studentChatMessages));
      } catch { }
    }
  }, [studentChatMessages, currentUser?.id, isTeacher]);

  // Sync Teacher Class Chat Storage & reset when class changes
  useEffect(() => {
    if (isTeacher) {
      try {
        const saved = localStorage.getItem(`yks_ai_coach_class_chat_${selectedClass}_${currentUser?.id || 'teacher'}`);
        if (saved) {
          setTeacherChatMessages(JSON.parse(saved));
        } else {
          setTeacherChatMessages([
            {
              id: `msg-class-welcome-${selectedClass}`,
              sender: 'ai',
              text: `Merhaba Değerli Hocam! 👋 Ben ${selectedClass} sınıfının YKS Sınıf Rehberliği ve Koçluk Danışmanıyım. Sınıfınızın soru çözümlerini, deneme net ortalamalarını ve en çok hata yapılan ortak konularını analiz ediyorum. Sınıf genelinde etüt planlama, ders bazlı eksik giderme, seviye gruplandırma ve motivasyon stratejileri hakkında aklınıza takılan her şeyi bana sorabilirsiniz! 🚀`,
              timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch { }
    }
  }, [selectedClass, currentUser?.id, isTeacher]);

  useEffect(() => {
    if (isTeacher) {
      try {
        localStorage.setItem(`yks_ai_coach_class_chat_${selectedClass}_${currentUser?.id || 'teacher'}`, JSON.stringify(teacherChatMessages));
      } catch { }
    }
  }, [teacherChatMessages, selectedClass, currentUser?.id, isTeacher]);

  const chatMessages = isTeacher ? teacherChatMessages : studentChatMessages;

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
  const totalClassPages = Math.max(1, Math.ceil(allClassAdvices.length / ITEMS_PER_PAGE));

  const paginatedAdvices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allAdvices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allAdvices, currentPage]);

  const paginatedClassAdvices = useMemo(() => {
    const startIndex = (classCurrentPage - 1) * ITEMS_PER_PAGE;
    return allClassAdvices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allClassAdvices, classCurrentPage]);

  // --- Student Specific Metrics ---
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

  // --- Teacher Class Metrics & Aggregation ---
  const classStudents = useMemo(() => {
    if (!isTeacher) return [];
    return allUsers.filter(u => u.role === 'student' && (u.className || '12-A SAY') === selectedClass);
  }, [allUsers, selectedClass, isTeacher]);

  const classSummaryStats = useMemo(() => {
    if (!isTeacher || classStudents.length === 0) {
      return {
        studentCount: 0,
        averageTYTNet: 0,
        averageAYTNet: 0,
        highestTYTNet: 0,
        lowestTYTNet: 0,
        highestAYTNet: 0,
        lowestAYTNet: 0,
        totalQuestionsSolved: 0,
        targetTYTNet: 95,
        targetAYTNet: 65,
        tytGap: 0,
        aytGap: 0
      };
    }

    let sumTYT = 0;
    let countTYT = 0;
    let sumAYT = 0;
    let countAYT = 0;
    let highestTYT = 0;
    let lowestTYT = 120;
    let highestAYT = 0;
    let lowestAYT = 80;
    let totalSolved = 0;

    classStudents.forEach(st => {
      const stData = studentsData[st.id];
      if (stData) {
        if (stData.generalMocks && stData.generalMocks.length > 0) {
          const lastMock = stData.generalMocks[stData.generalMocks.length - 1];
          if (lastMock.tyt?.totalNet !== undefined && lastMock.tyt.totalNet > 0) {
            const t = lastMock.tyt.totalNet;
            sumTYT += t;
            countTYT++;
            if (t > highestTYT) highestTYT = t;
            if (t < lowestTYT) lowestTYT = t;
          }
          if (lastMock.ayt?.totalNet !== undefined && lastMock.ayt.totalNet > 0) {
            const a = lastMock.ayt.totalNet;
            sumAYT += a;
            countAYT++;
            if (a > highestAYT) highestAYT = a;
            if (a < lowestAYT) lowestAYT = a;
          }
        }
        if (stData.questionLogs) {
          stData.questionLogs.forEach(q => {
            totalSolved += q.solvedCount || 0;
          });
        }
      }
    });

    const avgTYT = countTYT > 0 ? Number((sumTYT / countTYT).toFixed(1)) : 0;
    const avgAYT = countAYT > 0 ? Number((sumAYT / countAYT).toFixed(1)) : 0;
    const targetTYT = 95;
    const targetAYT = 65;

    return {
      studentCount: classStudents.length,
      averageTYTNet: avgTYT,
      averageAYTNet: avgAYT,
      highestTYTNet: countTYT > 0 ? highestTYT : 0,
      lowestTYTNet: countTYT > 0 ? (lowestTYT === 120 ? 0 : lowestTYT) : 0,
      highestAYTNet: countAYT > 0 ? highestAYT : 0,
      lowestAYTNet: countAYT > 0 ? (lowestAYT === 80 ? 0 : lowestAYT) : 0,
      totalQuestionsSolved: totalSolved,
      targetTYTNet: targetTYT,
      targetAYTNet: targetAYT,
      tytGap: Math.max(0, Number((targetTYT - avgTYT).toFixed(1))),
      aytGap: Math.max(0, Number((targetAYT - avgAYT).toFixed(1)))
    };
  }, [classStudents, studentsData, isTeacher]);

  const classUrgentTopics = useMemo(() => {
    if (!isTeacher) return [];
    const map: Record<string, { subject: string; topic: string; studentCount: number; totalErrorCount: number; studentNames: string[]; errorReasons: string[] }> = {};
    classStudents.forEach(st => {
      const stData = studentsData[st.id];
      if (stData?.topicErrors) {
        const unrevised = stData.topicErrors.filter(e => !e.revised);
        unrevised.forEach(err => {
          const topicName = err.topicName || (err as any).topic || 'Genel Konu';
          const key = `${err.subject} - ${topicName}`;
          if (!map[key]) {
            map[key] = { subject: err.subject, topic: topicName, studentCount: 0, totalErrorCount: 0, studentNames: [], errorReasons: [] };
          }
          map[key].totalErrorCount++;
          if (!map[key].studentNames.includes(st.name)) {
            map[key].studentNames.push(st.name);
            map[key].studentCount++;
          }
          if (err.errorReason && !map[key].errorReasons.includes(err.errorReason)) {
            map[key].errorReasons.push(err.errorReason);
          }
        });
      }
    });
    return Object.values(map).sort((a, b) => b.studentCount - a.studentCount || b.totalErrorCount - a.totalErrorCount);
  }, [isTeacher, classStudents, studentsData]);

  // High Yield Topics for Class
  const classHighYieldTopics = useMemo(() => {
    if (classUrgentTopics.length > 0) {
      return classUrgentTopics.slice(0, 4).map((item, idx) => ({
        subject: item.subject,
        topic: item.topic,
        studentCount: item.studentCount,
        estimatedNetGain: idx === 0 ? 6.5 : idx === 1 ? 5.0 : idx === 2 ? 4.0 : 3.5,
        reason: `${item.studentCount} öğrencinin ortak eksiği. Sınıfça yapılacak 2 etüt oturumuyla sınıf ortalamasını doğrudan yükseltir.`
      }));
    }
    return [
      { subject: 'TYT Matematik', topic: 'Problemler & Sayısal Mantık', studentCount: classStudents.length, estimatedNetGain: 6.5, reason: 'Sınavda 12-14 soru çıkmaktadır, sınıf genelinde net farkı yaratır.' },
      { subject: 'TYT Geometri', topic: 'Üçgenler & Alan Bağıntıları', studentCount: Math.ceil(classStudents.length * 0.7), estimatedNetGain: 4.0, reason: 'Tüm AYT geometri sorularının temelini oluşturur.' },
      { subject: 'AYT Matematik', topic: 'Türev & Uygulamaları', studentCount: Math.ceil(classStudents.length * 0.8), estimatedNetGain: 5.5, reason: 'AYT Matematikte en yüksek getiriye sahip kritik konudur.' },
      { subject: 'AYT Fen', topic: 'Elektrik & Manyetizma', studentCount: Math.ceil(classStudents.length * 0.6), estimatedNetGain: 4.0, reason: 'Kavramsal net kazanımı sağlayacak yüksek soru sayılı bölümdür.' }
    ];
  }, [classUrgentTopics, classStudents]);

  const teacherQuickPrompts = useMemo(() => [
    `⚡ ${selectedClass} sınıfında acil etüt açılması gereken en kritik 3 konu nedir?`,
    `🎯 Sınıfın ortalama TYT netini 10 net artırmak için bu haftalık nasıl bir ödevlendirme yapmalıyız?`,
    `📐 Matematik net ivmesini hızlandırmak için hangi konu sıralamasını önerirsin?`,
    `⏱️ Sınıf genelinde deneme sınavlarında zaman yönetimi ve odaklanma nasıl geliştirilir?`
  ], [selectedClass]);

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
      const studentsSummary: { name: string; tytNet: number; aytNet: number; topWeakTopic: string }[] = [];

      classStudents.forEach(st => {
        const stData = studentsData[st.id];
        let tyt = 0;
        let ayt = 0;
        let weakTopic = 'Yok';

        if (stData) {
          if (stData.generalMocks && stData.generalMocks.length > 0) {
            const lastMock = stData.generalMocks[stData.generalMocks.length - 1];
            if (lastMock.tyt?.totalNet) tyt = lastMock.tyt.totalNet;
            if (lastMock.ayt?.totalNet) ayt = lastMock.ayt.totalNet;
          }
          if (stData.topicErrors) {
            const activeErrors = stData.topicErrors.filter(e => !e.revised);
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

      const topStrugglingTopics = classUrgentTopics.slice(0, 5).map(item => `${item.subject} - ${item.topic} (${item.studentCount} öğrenci, ${item.totalErrorCount} hata)`);

      const result = await fetchClassAICoachAdvice({
        className: selectedClass,
        studentCount: classStudents.length,
        averageTYTNet: classSummaryStats.averageTYTNet,
        averageAYTNet: classSummaryStats.averageAYTNet,
        totalQuestionsSolved: classSummaryStats.totalQuestionsSolved,
        topStrugglingTopics,
        studentsSummary
      }, currentUser);

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
      setActiveTab('report');

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

    if (isTeacher) {
      setTeacherChatMessages(prev => [...prev, userMsg]);
    } else {
      setStudentChatMessages(prev => [...prev, userMsg]);
    }

    setChatInput('');
    setChatLoading(true);

    try {
      const historyPayload = chatMessages.slice(-6).map(m => ({ sender: m.sender, text: m.text }));
      const classContextPayload = isTeacher ? {
        className: selectedClass,
        studentCount: classSummaryStats.studentCount,
        averageTYTNet: classSummaryStats.averageTYTNet,
        averageAYTNet: classSummaryStats.averageAYTNet,
        topStrugglingTopics: classUrgentTopics.slice(0, 5).map(t => `${t.subject} - ${t.topic} (${t.studentCount} öğrenci)`),
        studentsSummary: classStudents.map(st => ({
          name: st.name,
          tytNet: studentsData[st.id]?.generalMocks?.slice(-1)[0]?.tyt?.totalNet || 0,
          aytNet: studentsData[st.id]?.generalMocks?.slice(-1)[0]?.ayt?.totalNet || 0,
          topWeakTopic: studentsData[st.id]?.topicErrors?.filter(e => !e.revised)[0]?.topicName || 'Yok'
        }))
      } : undefined;

      const result = await sendAICoachChatMessage(query, historyPayload, state, currentUser, classContextPayload);
      const aiMsg: AICoachChatMessage = { 
        id: 'msg-' + (Date.now() + 1), 
        sender: 'ai', 
        text: result.reply, 
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
      };

      if (isTeacher) {
        setTeacherChatMessages(prev => [...prev, aiMsg]);
      } else {
        setStudentChatMessages(prev => [...prev, aiMsg]);
      }
    } catch (err: any) {
      const errMsg: AICoachChatMessage = { 
        id: 'msg-err-' + Date.now(), 
        sender: 'ai', 
        text: `⚠️ Yanıt alınırken hata oluştu: ${err.message || 'Lütfen tekrar deneyiniz.'}`, 
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
      };
      if (isTeacher) {
        setTeacherChatMessages(prev => [...prev, errMsg]);
      } else {
        setStudentChatMessages(prev => [...prev, errMsg]);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Sohbet geçmişini sıfırlamak istediğinize emin misiniz?')) {
      if (isTeacher) {
        setTeacherChatMessages([{ 
          id: `msg-class-welcome-${selectedClass}-reset`, 
          sender: 'ai', 
          text: `Sohbet geçmişi temizlendi. ${selectedClass} sınıfı YKS Rehberlik Koçunuz hazır, dinliyorum! 🚀`, 
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
        }]);
        try {
          localStorage.removeItem(`yks_ai_coach_class_chat_${selectedClass}_${currentUser?.id || 'teacher'}`);
        } catch { }
      } else {
        setStudentChatMessages([{ 
          id: 'msg-welcome-' + Date.now(), 
          sender: 'ai', 
          text: 'Sohbet geçmişi temizlendi. YKS koçun burada, masanın başında hazırım! 🚀', 
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
        }]);
        try {
          localStorage.removeItem(`yks_ai_coach_chat_${currentUser?.id || 'guest'}`);
        } catch { }
      }
    }
  };

  // Nav Tabs configuration for Student vs Teacher
  const tabsList = useMemo(() => {
    if (isTeacher) {
      return [
        { id: 'report', label: 'Sınıf Koçluk Raporu & Reçete', icon: Sparkles },
        { id: 'chat', label: 'Sınıf Rehberliği AI Danışmanı', icon: MessageSquare, badge: isChatEnabledGlobally },
        { id: 'targetGap', label: 'Sınıf Hedef Gap & Net İbresi', icon: Target },
        { id: 'urgentTopics', label: 'Sınıf Ortak Acil Konuları', icon: AlertTriangle, count: classUrgentTopics.length },
        { id: 'history', label: 'Geçmiş Sınıf Raporları', icon: FileText, count: allClassAdvices.length }
      ];
    }
    return [
      { id: 'report', label: 'Koçluk Raporu & Reçete', icon: Sparkles },
      { id: 'chat', label: 'AI Koç ile Canlı Sohbet', icon: MessageSquare, badge: isChatEnabledGlobally },
      { id: 'targetGap', label: 'Hedef Gap & Net İbresi', icon: Target },
      { id: 'urgentTopics', label: 'Acil Müdahale Konuları', icon: AlertTriangle, count: urgentStrugglingTopics.length },
      { id: 'history', label: 'Geçmiş Raporlar', icon: FileText, count: allAdvices.length }
    ];
  }, [isTeacher, isChatEnabledGlobally, classUrgentTopics.length, allClassAdvices.length, urgentStrugglingTopics.length, allAdvices.length]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* ── 1. HERO HEADER ── */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-purple-300 text-[11px] font-semibold uppercase tracking-wider mb-1">
              <Bot className="w-4 h-4" />
              <span>Yapay Zeka Destekli YKS {isTeacher ? 'Sınıf & Okul Rehberlik' : 'Bireysel Öğrenci'} Koçluk Merkezi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isTeacher ? `${selectedClass} Sınıfı Yapay Zeka Koçluk Analizi` : 'Kişiselleştirilmiş Yapay Zeka YKS Çalışma Analizi'}
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              {isTeacher
                ? `${selectedClass} sınıfındaki ${classStudents.length} öğrencinin soru günlükleri, deneme netleri ve ortak hata havuzu üzerinden analitik rehberlik ve etüt planı üretir.`
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

      {/* ── 2. SUB-TABS NAVIGATION (HER İKİ MOD İÇİN ZENGİN 5'Lİ ŞERİT) ── */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 items-center gap-1.5 w-full shadow-lg overflow-x-auto">
        {tabsList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AICoachTab)}
            className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer relative ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
            }`}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{tab.label}</span>
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

      {/* ── 3. TAB CONTENT ── */}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 1: KOÇLUK RAPORU & REÇETE */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* TEACHER MODE REPORT */}
          {isTeacher ? (
            activeClassAdvice ? (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
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
                      Rapor Tarihi: {activeClassAdvice.timestamp}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    {activeClassAdvice.generalEvaluation}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle className="w-4 h-4" />
                        <span>Sınıfın Güçlü Yönleri & Başarı Dinamikleri</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {activeClassAdvice.strengths?.map((str, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-emerald-400 font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Sınıfça Müdahale Edilecek Zayıf Alanlar</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {activeClassAdvice.weakAreas?.map((w, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-rose-400 font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Sınıf Haftalık Branş & Etüt Reçetesi */}
                  {activeClassAdvice.weeklyPrescription && activeClassAdvice.weeklyPrescription.length > 0 && (
                    <div className="bg-slate-950 border border-purple-500/30 p-5 rounded-2xl space-y-4 mt-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-2">
                          <ListTodo className="w-4 h-4 text-purple-400" />
                          <span>Sınıf Geneli Haftalık Çalışma & Soru Çözüm Reçetesi</span>
                        </h3>
                        <span className="text-[10px] text-slate-400 font-medium">Sınıf Tavsiye Kotası</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeClassAdvice.weeklyPrescription.map((item, idx) => (
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
                              <span className="text-[11px] text-slate-400">Hedef Soru / Öğrenci</span>
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

                  {/* Rehber Öğretmen 4 Temel Aksiyon Planı */}
                  <div className="bg-slate-950 border border-indigo-500/30 p-5 rounded-2xl space-y-3 mt-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Rehber Öğretmen / Sınıf Koçu İçin Bu Haftalık 4 Temel Aksiyon ve Etüt Planı</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeClassAdvice.actionPlan?.map((plan, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                          <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed">{plan}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeClassAdvice.motivationalQuote && (
                    <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-4 rounded-2xl border border-purple-500/30 flex items-center space-x-3 italic text-xs text-purple-200">
                      <Quote className="w-6 h-6 text-purple-400 flex-shrink-0" />
                      <p className="leading-relaxed font-medium">"{activeClassAdvice.motivationalQuote}"</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="text-base font-bold text-white">{selectedClass} Sınıfı İçin Rapor Bulunmuyor</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sınıfın tüm öğrenci verilerini tarayarak SWOT değerlendirmesi, haftalık etüt reçetesi ve rehberlik planı oluşturmak için yukarıdaki butona tıklayın.
                  </p>
                </div>
                <button
                  onClick={handleFetchClassAdvice}
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 cursor-pointer hover:from-purple-500 hover:to-indigo-500 transition-all inline-flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{selectedClass} Sınıf Raporunu Başlat</span>
                </button>
              </div>
            )
          ) : (
            /* STUDENT MODE REPORT */
            latestAdvice ? (
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
                      <p className="leading-relaxed font-medium">"{latestAdvice.motivationalQuote}"</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="text-base font-bold text-white">Henüz Bir Koçluk Raporu Üretilmedi</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Soru çözümlerini, deneme netlerini ve Hata Defterindeki eksik konularını analiz ederek kişisel çalışma reçetesi almak için yukarıdaki butona tıkla.
                  </p>
                </div>
                <button
                  onClick={handleFetchAdvice}
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 cursor-pointer hover:from-purple-500 hover:to-indigo-500 transition-all inline-flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>İlk Analizi Başlat</span>
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 2: AI KOÇ İLE CANLI SOHBET & DANIŞMANLIK */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in flex flex-col h-[650px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{isTeacher ? `${selectedClass} Sınıf Rehberliği AI Danışmanı` : 'YKS Koçu ile Canlı Danışmanlık'}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isTeacher
                    ? `${selectedClass} sınıfı akademik performansı ve rehberlik taktikleri hakkında anlık danışın`
                    : 'YKS stratejisi, çalışma taktikleri ve motivasyon konusunda sorularını sor'
                  }
                </p>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="text-xs text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-950 border border-slate-800 transition-all cursor-pointer flex items-center space-x-1.5"
              title="Sohbeti Sıfırla"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Temizle</span>
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none shrink-0 -mx-1 px-1">
            {(isTeacher ? teacherQuickPrompts : (state.profile?.targetField === 'DİL' || (state.profile?.targetField as string) === 'DIL' ? DIL_QUICK_PROMPTS : DEFAULT_QUICK_PROMPTS)).map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(promptText)}
                disabled={chatLoading}
                className="shrink-0 text-[11px] bg-slate-950 hover:bg-purple-950/40 text-purple-200 border border-purple-500/20 hover:border-purple-500/40 px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-purple-600/20">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow-inner'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className={`text-[9px] block mt-1.5 text-right font-mono ${msg.sender === 'user' ? 'text-purple-200' : 'text-slate-500'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center space-x-2 text-xs text-purple-300 bg-slate-950 p-3 rounded-2xl border border-slate-800 w-fit animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>YKS Koçunuz yanıt hazırlıyor...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2 pt-2 border-t border-slate-800 shrink-0"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={isTeacher ? `${selectedClass} sınıfı için bir rehberlik sorusu sorun...` : 'YKS koçuna bir soru sor veya taktik iste...'}
              disabled={chatLoading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 3: HEDEF GAP & NET DAĞILIMI */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'targetGap' && (
        <div className="space-y-6 animate-fade-in">
          {isTeacher ? (
            /* TEACHER CLASS GAP & NET DISTRIBUTION */
            <div className="space-y-6">
              {/* 4 Top Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Sınıf Mevcudu</span>
                    <span className="text-xl font-black text-white font-mono">{classSummaryStats.studentCount} <span className="text-xs text-slate-500 font-normal">Öğrenci</span></span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Ort. TYT Neti</span>
                    <span className="text-xl font-black text-indigo-300 font-mono">{classSummaryStats.averageTYTNet} <span className="text-xs text-slate-500 font-normal">Net</span></span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Ort. AYT Neti</span>
                    <span className="text-xl font-black text-emerald-300 font-mono">{classSummaryStats.averageAYTNet} <span className="text-xs text-slate-500 font-normal">Net</span></span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Toplam Soru Çözümü</span>
                    <span className="text-xl font-black text-amber-300 font-mono">{classSummaryStats.totalQuestionsSolved.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              {/* Progress & Gap Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-indigo-500/30 p-5 rounded-3xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <Target className="w-4 h-4" /> Sınıf TYT Hedef Gap Analizi
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      {classSummaryStats.averageTYTNet} / {classSummaryStats.targetTYTNet} Net
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (classSummaryStats.averageTYTNet / classSummaryStats.targetTYTNet) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>En Yüksek: <strong className="text-white font-mono">{classSummaryStats.highestTYTNet}</strong> Net</span>
                    <span>Hedefe Kalan Gap: <strong className="text-indigo-300 font-mono">+{classSummaryStats.tytGap}</strong> Net</span>
                    <span>En Düşük: <strong className="text-white font-mono">{classSummaryStats.lowestTYTNet}</strong> Net</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-3xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Target className="w-4 h-4" /> Sınıf AYT Hedef Gap Analizi
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {classSummaryStats.averageAYTNet} / {classSummaryStats.targetAYTNet} Net
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (classSummaryStats.averageAYTNet / classSummaryStats.targetAYTNet) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>En Yüksek: <strong className="text-white font-mono">{classSummaryStats.highestAYTNet}</strong> Net</span>
                    <span>Hedefe Kalan Gap: <strong className="text-emerald-300 font-mono">+{classSummaryStats.aytGap}</strong> Net</span>
                    <span>En Düşük: <strong className="text-white font-mono">{classSummaryStats.lowestAYTNet}</strong> Net</span>
                  </div>
                </div>
              </div>

              {/* Sınıf Seviyesinde Yüksek Getirili Ortak Konular */}
              <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>{selectedClass} Sınıfına En Hızlı Net Kazandıracak Yüksek Getirili Ortak Konular</span>
                  </h3>
                  <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    Öncelikli Telafi Konuları
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {classHighYieldTopics.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 hover:border-purple-500/40 transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                          {item.subject}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                          +{item.estimatedNetGain} Net Potansiyeli
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{item.topic}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* STUDENT GAP & METRICS */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-indigo-500/30 p-5 rounded-3xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <Target className="w-4 h-4" /> TYT Net Hedef İbresi
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      {targetGapData.currentTyt} / {targetGapData.targetTyt} Net
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (targetGapData.currentTyt / targetGapData.targetTyt) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Mevcut: <strong className="text-white font-mono">{targetGapData.currentTyt}</strong> Net</span>
                    <span>Kalan Gap: <strong className="text-indigo-300 font-mono">+{targetGapData.tytGap}</strong> Net</span>
                    <span>Hedef: <strong className="text-white font-mono">{targetGapData.targetTyt}</strong> Net</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-3xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Target className="w-4 h-4" /> {targetGapData.isDil ? 'YDT Net Hedef İbresi' : 'AYT Net Hedef İbresi'}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {targetGapData.currentAyt} / {targetGapData.targetAyt} Net
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (targetGapData.currentAyt / targetGapData.targetAyt) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Mevcut: <strong className="text-white font-mono">{targetGapData.currentAyt}</strong> Net</span>
                    <span>Kalan Gap: <strong className="text-emerald-300 font-mono">+{targetGapData.aytGap}</strong> Net</span>
                    <span>Hedef: <strong className="text-white font-mono">{targetGapData.targetAyt}</strong> Net</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 4: ACİL MÜDAHALE KONULARI */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'urgentTopics' && (
        <div className="space-y-6 animate-fade-in">
          {isTeacher ? (
            /* TEACHER AGGREGATED CLASS ERROR TOPICS */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{selectedClass} Sınıfının Ortak Hata ve Acil Telafi Konuları</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sınıftaki tüm öğrencilerin Hata Defteri kayıtlarından toplanan, en çok yanlış yapılan ortak eksikler.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-rose-300 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full self-start sm:self-center">
                  Toplam {classUrgentTopics.length} Ortak Konu
                </span>
              </div>

              {classUrgentTopics.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {classUrgentTopics.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-rose-500/40 transition-all space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                          {item.subject}
                        </span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold font-mono">
                          {item.studentCount} Öğrencide Hata
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white">{item.topic}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Toplam {item.totalErrorCount} hatalı soru kaydı
                        </p>
                      </div>

                      {item.studentNames.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block mb-1">Zorlanan Öğrenciler:</span>
                          <div className="flex flex-wrap gap-1">
                            {item.studentNames.slice(0, 4).map((name, nIdx) => (
                              <span key={nIdx} className="text-[9px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800">
                                {name}
                              </span>
                            ))}
                            {item.studentNames.length > 4 && (
                              <span className="text-[9px] text-purple-300 font-bold self-center">
                                +{item.studentNames.length - 4} diğer
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Rehberlik Önerisi</span>
                        <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Toplu Etüt Önerilir
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Harika! Sınıfta Bekleyen Ortak Hata Yok</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Öğrenciler Hata Defterlerindeki soruları düzenli tekrar etmiş veya henüz kayıtlı hata bulunmuyor.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* STUDENT INDIVIDUAL ERROR TOPICS */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Hata Defterindeki Acil Müdahale Konuların</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hata defterinde biriken ve tekrar edilmeyi bekleyen kritik soru konuları.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-rose-300 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full self-start sm:self-center">
                  {urgentStrugglingTopics.length} Kritik Konu
                </span>
              </div>

              {urgentStrugglingTopics.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {urgentStrugglingTopics.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-rose-500/40 transition-all space-y-2.5">
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
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 5: GEÇMİŞ RAPORLAR & ARŞİV */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isTeacher ? `${selectedClass} Sınıfı Geçmiş Koçluk Raporları` : 'Geçmiş Yapay Zeka Koçluk Raporları'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Daha önce oluşturulmuş tüm koçluk analizleri ve reçete kayıtları.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-1 rounded-full self-start sm:self-center">
              Toplam {isTeacher ? allClassAdvices.length : allAdvices.length} Rapor
            </span>
          </div>

          <div className="space-y-2.5">
            {isTeacher ? (
              paginatedClassAdvices.map((adv, idx) => {
                const adviceKey = adv.id || adv.timestamp || `class-adv-idx-${idx}`;
                return (
                  <div 
                    key={adviceKey}
                    className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div 
                      onClick={() => setSelectedDetailClassAdvice(adv)}
                      className="flex-1 min-w-0 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-purple-300">
                        <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="font-bold">{adv.timestamp}</span>
                        {adv.createdByName && (
                          <span className="text-slate-400">• {adv.createdByName}</span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                        {adv.generalEvaluation}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailClassAdvice(adv)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 text-purple-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-400" />
                        <span>İncele</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setClassAdviceToDelete(adv)}
                        className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                        title="Raporu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              paginatedAdvices.map((adv, idx) => {
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
              })
            )}
          </div>

          {/* Pagination Controls */}
          {((isTeacher ? totalClassPages : totalPages) > 1) && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Sayfa {isTeacher ? classCurrentPage : currentPage} / {isTeacher ? totalClassPages : totalPages}</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => isTeacher ? setClassCurrentPage(p => Math.max(1, p - 1)) : setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={isTeacher ? classCurrentPage === 1 : currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => isTeacher ? setClassCurrentPage(p => Math.min(totalClassPages, p + 1)) : setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={isTeacher ? classCurrentPage === totalClassPages : currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DETAIL MODAL FOR STUDENT ADVICE ── */}
      {selectedDetailAdvice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
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

              {selectedDetailAdvice.weeklyPrescription && selectedDetailAdvice.weeklyPrescription.length > 0 && (
                <div className="bg-slate-950 border border-purple-500/30 p-4 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Haftalık Soru Reçetesi</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDetailAdvice.weeklyPrescription.map((p, i) => (
                      <div key={i} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-200">
                        <div className="flex justify-between font-bold text-white mb-1">
                          <span>{p.subject}</span>
                          <span className="text-purple-400">{p.targetQuestions} Soru</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {selectedDetailAdvice.motivationalQuote && (
                <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl italic text-xs text-purple-200">
                  "{selectedDetailAdvice.motivationalQuote}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL FOR CLASS ADVICE ── */}
      {selectedDetailClassAdvice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>{selectedDetailClassAdvice.className} Sınıf Koçluk Rapor Detayı ({selectedDetailClassAdvice.timestamp})</span>
              </h3>
              <button onClick={() => setSelectedDetailClassAdvice(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-slate-200 bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                {selectedDetailClassAdvice.generalEvaluation}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Sınıfın Güçlü Yönleri
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {selectedDetailClassAdvice.strengths?.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Sınıfça Müdahale Edilecek Alanlar
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {selectedDetailClassAdvice.weakAreas?.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedDetailClassAdvice.weeklyPrescription && selectedDetailClassAdvice.weeklyPrescription.length > 0 && (
                <div className="bg-slate-950 border border-purple-500/30 p-4 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Sınıf Haftalık Soru ve Etüt Reçetesi</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDetailClassAdvice.weeklyPrescription.map((p, i) => (
                      <div key={i} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-200">
                        <div className="flex justify-between font-bold text-white mb-1">
                          <span>{p.subject}</span>
                          <span className="text-purple-400">{p.targetQuestions} Soru / Öğr.</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDetailClassAdvice.actionPlan && (
                <div className="bg-slate-950 border border-indigo-500/30 p-4 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Rehber Öğretmen Aksiyon Planı</span>
                  <div className="space-y-1.5">
                    {selectedDetailClassAdvice.actionPlan.map((p, i) => (
                      <div key={i} className="text-xs text-slate-200 flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">{i + 1}.</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDetailClassAdvice.motivationalQuote && (
                <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl italic text-xs text-purple-200">
                  "{selectedDetailClassAdvice.motivationalQuote}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
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
