import React, { useState, useMemo, useEffect, useRef } from 'react';
import { detectStressProfile, getStressUiTheme } from '../services/stressDetector';
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
  Layers,
  Volume2,
  VolumeX,
  Square,
  Play,
  Headphones
} from 'lucide-react';
import { speechService, isSpeechSynthesisSupported } from '../services/speechService';
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

export type AICoachTab = 'report' | 'chat' | 'history';

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

const GRADE_9_QUICK_PROMPTS = [
  '📚 Okul yazılı sınavlarına (1. ve 2. sınavlar) nasıl çalışmalıyım?',
  '📝 Matematik ve Fen derslerindeki konu açıklarımı nasıl kapatabilirim?',
  '⏱️ Günlük ders çalışma ve ödev rutinimi nasıl planlamalıyım?',
  '🎯 9. sınıf not ortalamamı (OBP) 90+ üstünde tutmak için taktik verir misin?'
];

const GRADE_10_QUICK_PROMPTS = [
  '📐 10. sınıf yazılı sınavlarında yüksek not almak için nasıl bir program yapmalıyım?',
  '🎯 11. sınıfa geçerken alan seçimi (Sayısal, EA, Sözel, Dil) için tavsiyelerin neler?',
  '🧠 Zorlandığım Fizik / Kimya / Matematik konularını en iyi nasıl kavrarım?',
  '⚡ Okul dersleri ile birlikte temel problem ve paragraf rutinini nasıl götürmeliyim?'
];

const GRADE_11_QUICK_PROMPTS = [
  '🎯 11. sınıf ders başarımı yüksek tutarken 1. aşama (TYT) ön hazırlığına nasıl başlamalıyım?',
  '📐 11. sınıf Matematik ve Fen/Edebiyat konularını AYT temeli için nasıl sağlamlaştırırım?',
  '⏱️ Haftalık çalışma planımda okul yazılıları ile TYT tekrarlarını nasıl dengelemeliyim?',
  '📝 Okulda yapılan KDS / Kurumsal denemelerde netlerimi nasıl artırırım?'
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

  // --- Kademe Tespiti ---
  const effectiveUser = previewStudentUser || currentUser;
  const gradeLevel = useMemo(() => {
    const rawClass = (effectiveUser?.className || state.profile?.className || '').toUpperCase().trim();
    if (rawClass.includes('MEZUN')) return 'mezun';
    if (rawClass.startsWith('9') || rawClass.includes('9-') || rawClass.includes('9.')) return '9';
    if (rawClass.startsWith('10') || rawClass.includes('10-') || rawClass.includes('10.')) return '10';
    if (rawClass.startsWith('11') || rawClass.includes('11-') || rawClass.includes('11.')) return '11';
    return '12';
  }, [effectiveUser?.className, state.profile?.className]);

  const isGrade9 = gradeLevel === '9';
  const isGrade10 = gradeLevel === '10';
  const isGrade11 = gradeLevel === '11';
  const isEarlyHighSchool = isGrade9 || isGrade10;

  // --- Stres / Motivasyon Profili ---
  const [manualMood, setManualMood] = useState<'tired' | 'okay' | 'ready' | null>(() => {
    try {
      const stored = localStorage.getItem(`yks_manual_mood_${currentUser?.id || 'guest'}`);
      if (stored) {
        const { mood, date } = JSON.parse(stored);
        const today = new Date().toISOString().slice(0, 10);
        if (date === today) return mood; // Bugün girilen mood geçerli
      }
    } catch {}
    return null;
  });

  const stressProfile = useMemo(() => {
    const stateWithMood = { ...state, manualMoodToday: manualMood };
    return detectStressProfile(stateWithMood);
  }, [state, manualMood]);

  const stressTheme = useMemo(() => getStressUiTheme(stressProfile.stressLevel), [stressProfile.stressLevel]);

  const handleSetMood = (mood: 'tired' | 'okay' | 'ready') => {
    setManualMood(mood);
    try {
      localStorage.setItem(`yks_manual_mood_${currentUser?.id || 'guest'}`, JSON.stringify({
        mood,
        date: new Date().toISOString().slice(0, 10)
      }));
    } catch {}
  };

  // Stres seviyesine ve KADEMEYE göre uyarlanmış hızlı soru butonları
  const adaptedQuickPrompts = useMemo(() => {
    if (isTeacher) return DEFAULT_QUICK_PROMPTS;
    if (stressProfile.stressLevel === 'burnt_out') {
      return [
        '🫶 Çok yorgunum, bugün için küçük bir başlangıç noktası önerir misin?',
        '😮‍💨 Motivasyonumu nasıl geri kazanabilirim?',
        '🛌 Zihinsel tükenmişlikle nasıl başa çıkabilirim?',
        '🌱 Bu haftaki tek önceliğim ne olmalı?',
      ];
    }
    if (stressProfile.stressLevel === 'mildly_stressed') {
      const base = isGrade9 
        ? GRADE_9_QUICK_PROMPTS 
        : isGrade10 
        ? GRADE_10_QUICK_PROMPTS 
        : isGrade11 
        ? GRADE_11_QUICK_PROMPTS 
        : ((state.profile?.targetField as string) === 'DİL' || (state.profile?.targetField as string) === 'DIL') 
        ? DIL_QUICK_PROMPTS 
        : DEFAULT_QUICK_PROMPTS;
      return [
        '💛 Biraz yorgunum ama devam etmek istiyorum — nereden başlamalıyım?',
        ...base.slice(0, 3),
      ];
    }
    if (isGrade9) return GRADE_9_QUICK_PROMPTS;
    if (isGrade10) return GRADE_10_QUICK_PROMPTS;
    if (isGrade11) return GRADE_11_QUICK_PROMPTS;
    const isDil = (state.profile?.targetField as string) === 'DİL' || (state.profile?.targetField as string) === 'DIL';
    return isDil ? DIL_QUICK_PROMPTS : DEFAULT_QUICK_PROMPTS;
  }, [stressProfile.stressLevel, isTeacher, isGrade9, isGrade10, isGrade11, state.profile?.targetField]);

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

    const studentName = currentUser?.name || state.profile?.name || 'Şampiyon';
    let welcomeText = `Merhaba ${studentName}! 👋 Ben senin kişisel YKS Koçun ve Mentorunum. Soru çözümlerini, deneme netlerini ve yanlış yaptığın konuları yakından takip ediyorum. Hedeflediğin ${state.profile?.targetUniversity || 'üniversite'} ve derece için YKS hazırlığı, ders çalışma taktikleri ve motivasyon konusunda aklına takılan her şeyi bana sorabilirsin! Masanın başına geçmeye hazır mısın? 🚀`;
    
    if (isGrade9) {
      welcomeText = `Merhaba ${studentName}! 👋 Ben senin 9. Sınıf Lise Koçunum. MEB Türkiye Yüzyılı Maarif Modeli müfredatında okul derslerin, 1. ve 2. dönem yazılı sınavların, OBP not ortalaman ve çalışma rutinlerin konusunda sana yardımcı olmak için buradayım. Matematik, Fizik, Kimya, Biyoloji, Edebiyat ve diğer derslerdeki konular, ödevler veya sınav taktikleri hakkında merak ettiğin her şeyi bana sorabilirsin! 📚✨`;
    } else if (isGrade10) {
      welcomeText = `Merhaba ${studentName}! 👋 Ben senin 10. Sınıf Lise Koçun ve Akademik Danışmanınım. Okul derslerin, yazılı sınavların, OBP başarın ve 11. sınıfa geçerken yapacağın alan seçimi (Sayısal, Eşit Ağırlık, Sözel, Dil) konusunda sana rehberlik etmek için buradayım. Derslerdeki eksiklerin ve çalışma planın hakkında aklına takılan her şeyi bana sorabilirsin! 🚀`;
    } else if (isGrade11) {
      welcomeText = `Merhaba ${studentName}! 👋 Ben senin 11. Sınıf Akademik ve YKS Ön Hazırlık Koçunum. 11. sınıf okul derslerinin başarısı, yazılı sınavların ve 1. Aşama (TYT) temelini sağlamlaştırma sürecinde yanındayım. Hem okul derslerinde en yüksek ortalamayı yakalamak hem de YKS'ye güçlü bir ön hazırlık yapmak için her zaman bana danışabilirsin! 🎯`;
    }

    return [
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: welcomeText,
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
        text: `Merhaba Değerli Hocam! 👋 Ben ${selectedClass} sınıfının Sınıf Rehberliği ve Koçluk Danışmanıyım. Sınıfınızın soru çözümlerini, deneme/yazılı ortalamalarını ve en çok hata yapılan ortak konularını analiz ediyorum. Sınıf genelinde etüt planlama, ders bazlı eksik giderme, seviye gruplandırma ve motivasyon stratejileri hakkında aklınıza takılan her şeyi bana sorabilirsiniz! 🚀`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatEnabledGlobally, setIsChatEnabledGlobally] = useState<boolean>(true);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  // Typewriter efekti için: son gelen AI mesajının ID'si ve gösterilen metin
  const [typewriterMsgId, setTypewriterMsgId] = useState<string | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- AI Sesli Koç (Speech Synthesis) State ---
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('yks_ai_auto_speak') === 'true';
    } catch {
      return false;
    }
  });

  const [speechRate, setSpeechRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('yks_ai_speech_rate');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  const toggleAutoSpeak = () => {
    const next = !isAutoSpeakEnabled;
    setIsAutoSpeakEnabled(next);
    try {
      localStorage.setItem('yks_ai_auto_speak', String(next));
    } catch {}
    if (!next) {
      speechService.stop();
      setActiveSpeakingId(null);
    }
  };

  const cycleSpeechRate = () => {
    const rates = [1.0, 1.2, 1.4, 0.9];
    const currentIndex = rates.indexOf(speechRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setSpeechRate(nextRate);
    try {
      localStorage.setItem('yks_ai_speech_rate', String(nextRate));
    } catch {}
    if (activeSpeakingId) {
      speechService.stop();
      setActiveSpeakingId(null);
    }
  };

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (activeSpeakingId === msgId) {
      speechService.stop();
      setActiveSpeakingId(null);
      return;
    }

    setActiveSpeakingId(msgId);
    speechService.speak(text, {
      id: msgId,
      rate: speechRate,
      onStart: () => setActiveSpeakingId(msgId),
      onEnd: () => setActiveSpeakingId(null),
      onError: () => setActiveSpeakingId(null)
    });
  };

  const handleSpeakReport = (advice: AICoachAdvice) => {
    const reportId = 'report-latest';
    if (activeSpeakingId === reportId) {
      speechService.stop();
      setActiveSpeakingId(null);
      return;
    }

    const reportTitle = isEarlyHighSchool 
      ? 'Lise Okul Dersleri ve Yazılı Hazırlık Koçluk Raporu.' 
      : isGrade11 
      ? '11. Sınıf Akademik ve TYT Ön Hazırlık Koçluk Raporu.' 
      : 'YKS Koçluk Raporu ve Durum Değerlendirmesi.';
    let speechText = `${reportTitle} ${advice.generalEvaluation || ''}. `;
    if (advice.strengths && advice.strengths.length > 0) {
      speechText += `Öne çıkan güçlü yönleriniz: ${advice.strengths.join('. ')}. `;
    }
    if (advice.weakAreas && advice.weakAreas.length > 0) {
      speechText += `Öncelikli geliştirilmesi gereken alanlar: ${advice.weakAreas.join('. ')}. `;
    }
    if (advice.weeklyPrescription && advice.weeklyPrescription.length > 0) {
      speechText += `Haftalık çalışma reçetesi: `;
      advice.weeklyPrescription.forEach((item, idx) => {
        const topicsStr = Array.isArray(item.focusTopics) && item.focusTopics.length > 0 ? item.focusTopics.join(', ') : '';
        speechText += `${idx + 1}. madde: ${item.subject} dersi ${topicsStr ? `${topicsStr} konusu için ` : ''}${item.targetQuestions ? `${item.targetQuestions} soru hedefi.` : ''} Tavsiye: ${item.description || ''}. `;
      });
    }

    setActiveSpeakingId(reportId);
    speechService.speak(speechText, {
      id: reportId,
      rate: speechRate,
      onStart: () => setActiveSpeakingId(reportId),
      onEnd: () => setActiveSpeakingId(null),
      onError: () => setActiveSpeakingId(null)
    });
  };

  const handleSpeakClassReport = (advice: ClassAICoachAdvice) => {
    const reportId = 'report-class-latest';
    if (activeSpeakingId === reportId) {
      speechService.stop();
      setActiveSpeakingId(null);
      return;
    }

    let speechText = `${selectedClass} Sınıfı Rehberlik ve Durum Değerlendirmesi. ${advice.generalEvaluation || ''}. `;
    if (advice.strengths && advice.strengths.length > 0) {
      speechText += `Sınıfın güçlü yönleri: ${advice.strengths.join('. ')}. `;
    }
    if (advice.weakAreas && advice.weakAreas.length > 0) {
      speechText += `Müdahale edilecek alanlar: ${advice.weakAreas.join('. ')}. `;
    }

    setActiveSpeakingId(reportId);
    speechService.speak(speechText, {
      id: reportId,
      rate: speechRate,
      onStart: () => setActiveSpeakingId(reportId),
      onEnd: () => setActiveSpeakingId(null),
      onError: () => setActiveSpeakingId(null)
    });
  };

  // Ses motoru temizlik (unmount & tab switch)
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  useEffect(() => {
    speechService.stop();
    setActiveSpeakingId(null);
  }, [activeTab]);

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

  // Canlı sohbet sekmesi ilk defa açıldığında veya sınıf değiştiğinde doğrudan son mesajın sonuna kaydır
  useEffect(() => {
    if (activeTab !== 'chat') return;

    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
      chatBottomRef.current?.scrollIntoView({ behavior, block: 'end' });
    };

    // DOM ilk render edildiğinde ve eleman boyutları oturduğunda son mesaja kaydır
    scrollToBottom('auto');
    const frameId = requestAnimationFrame(() => scrollToBottom('auto'));
    const t1 = setTimeout(() => scrollToBottom('auto'), 50);
    const t2 = setTimeout(() => scrollToBottom('auto'), 150);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeTab, selectedClass]);

  // Kullanıcı mesajı gönderince en alta yumuşak scroll
  const lastMsgId = chatMessages[chatMessages.length - 1]?.id;
  const lastMsgSender = chatMessages[chatMessages.length - 1]?.sender;
  useEffect(() => {
    if (activeTab !== 'chat') return;
    if (lastMsgSender === 'user') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMsgId, lastMsgSender, activeTab]);

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
      const sortedMocks = [...state.generalMocks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestTYTMock = sortedMocks.find(m => m.tyt && m.tyt.totalNet !== undefined && (m.examType === 'TYT' || m.examType === 'TYT_AYT' || m.examType === 'TYT_DIL' || m.tyt.totalNet > 0));
      const latestAYTMock = sortedMocks.find(m => m.ayt && m.ayt.totalNet !== undefined && (m.examType === 'AYT' || m.examType === 'TYT_AYT' || m.ayt.totalNet > 0));
      const latestYDTMock = sortedMocks.find(m => m.ydt && m.ydt.net !== undefined && (m.examType === 'DIL' || m.examType === 'TYT_DIL' || Number(m.ydt.net) > 0));

      currentTyt = latestTYTMock?.tyt?.totalNet ?? (sortedMocks[0]?.tyt?.totalNet || 0);
      currentAyt = isDil 
        ? (latestYDTMock?.ydt?.net ?? latestAYTMock?.ayt?.totalNet ?? (sortedMocks[0]?.ydt?.net || 0))
        : (latestAYTMock?.ayt?.totalNet ?? (sortedMocks[0]?.ayt?.totalNet || 0));
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
          const sortedMocks = [...stData.generalMocks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const latestTYTMock = sortedMocks.find(m => m.tyt && m.tyt.totalNet !== undefined && (m.examType === 'TYT' || m.examType === 'TYT_AYT' || m.examType === 'TYT_DIL' || m.tyt.totalNet > 0));
          const latestAYTMock = sortedMocks.find(m => m.ayt && m.ayt.totalNet !== undefined && (m.examType === 'AYT' || m.examType === 'TYT_AYT' || m.ayt.totalNet > 0));
          const latestYDTMock = sortedMocks.find(m => m.ydt && m.ydt.net !== undefined && (m.examType === 'DIL' || m.examType === 'TYT_DIL' || Number(m.ydt.net) > 0));

          const isStudentDil = stData.profile?.targetField === 'DİL' || (stData.profile?.targetField as string) === 'DIL';
          const t = latestTYTMock?.tyt?.totalNet;
          const a = isStudentDil ? (latestYDTMock?.ydt?.net ?? latestAYTMock?.ayt?.totalNet) : latestAYTMock?.ayt?.totalNet;

          if (t !== undefined && t > 0) {
            sumTYT += t;
            countTYT++;
            if (t > highestTYT) highestTYT = t;
            if (t < lowestTYT) lowestTYT = t;
          }
          if (a !== undefined && a > 0) {
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
            const sortedMocks = [...stData.generalMocks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latestTYTMock = sortedMocks.find(m => m.tyt && m.tyt.totalNet !== undefined && (m.examType === 'TYT' || m.examType === 'TYT_AYT' || m.examType === 'TYT_DIL' || m.tyt.totalNet > 0));
            const latestAYTMock = sortedMocks.find(m => m.ayt && m.ayt.totalNet !== undefined && (m.examType === 'AYT' || m.examType === 'TYT_AYT' || m.ayt.totalNet > 0));
            const latestYDTMock = sortedMocks.find(m => m.ydt && m.ydt.net !== undefined && (m.examType === 'DIL' || m.examType === 'TYT_DIL' || Number(m.ydt.net) > 0));

            const isStudentDil = stData.profile?.targetField === 'DİL' || (stData.profile?.targetField as string) === 'DIL';
            if (latestTYTMock?.tyt?.totalNet) tyt = latestTYTMock.tyt.totalNet;
            if (isStudentDil) {
              ayt = latestYDTMock?.ydt?.net ?? latestAYTMock?.ayt?.totalNet ?? 0;
            } else if (latestAYTMock?.ayt?.totalNet) {
              ayt = latestAYTMock.ayt.totalNet;
            }
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

      // Typewriter efekti başlat
      const fullText = result.reply;
      setTypewriterMsgId(aiMsg.id);
      setTypewriterText('');

      // AI cevabının en üstüne scroll (chatScrollRef container'ını scroll et)
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight - chatScrollRef.current.clientHeight - 60;
        }
      }, 50);

      // Harf harf yazma efekti
      let idx = 0;
      const CHUNK = 3; // Her adımda 3 karakter ekle (hız ayarı)
      const INTERVAL = 18; // ms cinsinden gecikme
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      typewriterRef.current = setInterval(() => {
        idx += CHUNK;
        if (idx >= fullText.length) {
          setTypewriterText(fullText);
          setTypewriterMsgId(null); // Typewriter bitti
          if (typewriterRef.current) clearInterval(typewriterRef.current);
          // Yazma bitince sona git
          setTimeout(() => {
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          setTypewriterText(fullText.slice(0, idx));
        }
      }, INTERVAL);

      // Otomatik Seslendir açıksa sesli oku
      if (isAutoSpeakEnabled) {
        setActiveSpeakingId(aiMsg.id);
        speechService.speak(fullText, {
          id: aiMsg.id,
          rate: speechRate,
          onStart: () => setActiveSpeakingId(aiMsg.id),
          onEnd: () => setActiveSpeakingId(null),
          onError: () => setActiveSpeakingId(null)
        });
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

  // Nav Tabs configuration for Student vs Teacher (3 Ana Sekme)
  const tabsList = useMemo(() => {
    if (isTeacher) {
      return [
        { 
          id: 'report' as AICoachTab, 
          label: 'Sınıf Koçluk Raporu & Reçete', 
          shortLabel: 'Rapor & Reçete',
          icon: Sparkles 
        },
        { 
          id: 'chat' as AICoachTab, 
          label: 'Sınıf Rehberliği AI Danışmanı', 
          shortLabel: 'Canlı Sohbet',
          icon: MessageSquare, 
          badge: isChatEnabledGlobally 
        },
        { 
          id: 'history' as AICoachTab, 
          label: 'Geçmiş Sınıf Raporları', 
          shortLabel: 'Geçmiş',
          icon: FileText, 
          count: allClassAdvices.length 
        }
      ];
    }
    return [
      { 
        id: 'report' as AICoachTab, 
        label: 'Koçluk Raporu & Reçete', 
        shortLabel: 'Koçluk Raporu',
        icon: Sparkles 
      },
      { 
        id: 'chat' as AICoachTab, 
        label: 'Canlı Sohbet', 
        shortLabel: 'Canlı Sohbet',
        icon: MessageSquare, 
        badge: isChatEnabledGlobally 
      },
      { 
        id: 'history' as AICoachTab, 
        label: 'Geçmiş Raporlar', 
        shortLabel: 'Geçmiş',
        icon: FileText, 
        count: isTeacher ? allClassAdvices.length : allAdvices.length
      }
    ];
  }, [isTeacher, isChatEnabledGlobally, allClassAdvices.length, allAdvices.length]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* ── 1. HERO HEADER ── */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-purple-300 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mb-1">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>
                {isTeacher 
                  ? 'Yapay Zeka Destekli Sınıf & Okul Rehberlik Koçluk Merkezi' 
                  : isEarlyHighSchool 
                  ? `Lise Koçu (Yapay Zeka) • ${gradeLevel}. Sınıf MEB Maarif Modeli`
                  : isGrade11
                  ? 'Lise Koçu (Yapay Zeka) • 11. Sınıf Akademik & YKS Ön Hazırlık'
                  : 'Yapay Zeka Destekli YKS Bireysel Öğrenci Koçluk Merkezi'
                }
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {isTeacher 
                ? `${selectedClass} Sınıfı Yapay Zeka Koçluk Analizi` 
                : isEarlyHighSchool
                ? 'Lise Akademik Koçu & Okul Dersleri Rehberi'
                : isGrade11
                ? '11. Sınıf Akademik Koçu & 1. Aşama (TYT) Ön Hazırlık Rehberi'
                : 'Kişiselleştirilmiş Yapay Zeka YKS Çalışma Analizi'
              }
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              {isTeacher
                ? `${selectedClass} sınıfındaki ${classStudents.length} öğrencinin soru günlükleri, deneme netleri ve ortak hata havuzu üzerinden analitik rehberlik ve etüt planı üretir.`
                : isEarlyHighSchool
                ? 'Okul derslerinde başarı, 1. ve 2. dönem yazılı sınavlarına hazırlık, OBP not ortalamasını yükseltme ve düzenli çalışma alışkanlığı için kişiselleştirilmiş rehberin.'
                : isGrade11
                ? '11. sınıf okul dersleri ve yazılı sınavlarında en yüksek OBP\'yi hedeflerken, 1. Aşama (TYT) temelini sağlamlaştıran ve AYT altyapısını kuran kişiselleştirilmiş rehberin.'
                : 'Soru çözüm verilerini, deneme netlerini ve Hata Defterindeki eksik konularını analiz ederek kişisel çalışma reçetesi ve canlı rehberlik sunar.'
              }
            </p>
          </div>

          {isTeacher ? (
            <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-white/10 flex items-center space-x-2 flex-1 sm:flex-initial">
                  <School className="w-4 h-4 text-purple-400 shrink-0" />
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-transparent text-xs text-white font-bold border-none focus:outline-none cursor-pointer w-full sm:w-auto"
                  >
                    {availableClassNames.map((cls) => (
                      <option key={cls} value={cls} className="bg-slate-900">{cls}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleFetchClassAdvice}
                  disabled={loading || classGeneratedTodayCount >= 2}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial"
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
              <span className={`text-[10px] sm:text-[11px] font-medium ${classGeneratedTodayCount >= 2 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {classGeneratedTodayCount >= 2 ? '⚠️ Günlük 2/2 sınıf analiz hakkı kullanıldı' : `✨ Bugün ${classGeneratedTodayCount}/2 sınıf analizi yapıldı`}
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:items-end gap-1.5 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleFetchAdvice}
                disabled={loading || hasGeneratedToday}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rapor Hazırlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>
                      {isEarlyHighSchool 
                        ? 'Yeni Lise Ders Koçluk Raporu Üret' 
                        : isGrade11 
                        ? 'Yeni 11. Sınıf & Ön Hazırlık Raporu Üret' 
                        : 'Yeni Koçluk Raporu & Reçete Üret'
                      }
                    </span>
                  </>
                )}
              </button>
              <span className={`text-[10px] sm:text-[11px] font-medium text-center sm:text-right ${hasGeneratedToday ? 'text-amber-300' : 'text-emerald-300'}`}>
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

      {/* ── 2. SUB-TABS NAVIGATION (3'LÜ RESPONSIVE ŞERİT) ── */}
      <div className="grid grid-cols-3 bg-slate-950 p-1 sm:p-1.5 rounded-2xl border border-slate-800 gap-1 sm:gap-1.5 w-full shadow-lg">
        {tabsList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AICoachTab)}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-bold text-[10.5px] sm:text-xs transition-all cursor-pointer relative text-center ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden md:inline truncate">{tab.label}</span>
            <span className="md:hidden truncate">{tab.shortLabel}</span>
            {tab.badge && (
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            )}
            {typeof tab.count === 'number' && tab.count > 0 && (
              <span className="text-[9px] sm:text-[10px] bg-purple-500/30 text-purple-200 font-mono px-1.5 py-0.2 rounded-full font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 3. TAB CONTENT (3 ANA SEKME) ── */}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SEKME 1: KOÇLUK RAPORU & REÇETE */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'report' && (
        <div className="space-y-6 animate-fade-in">
          {isTeacher ? (
            /* TEACHER MODE REPORT */
            activeClassAdvice ? (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
                        <span>{activeClassAdvice.className} Sınıfı Koçluk Değerlendirme Raporu</span>
                      </h2>
                      {activeClassAdvice.createdByName && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Oluşturan: <span className="text-purple-300 font-semibold">{activeClassAdvice.createdByName}</span> ({activeClassAdvice.createdByRole || 'Rehber Öğretmen'})
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
                      {isSpeechSynthesisSupported() && (
                        <button
                          onClick={() => handleSpeakClassReport(activeClassAdvice)}
                          className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                            activeSpeakingId === 'report-class-latest'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                              : 'bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600/30'
                          }`}
                          title="Sınıf raporunu sesli dinle"
                        >
                          {activeSpeakingId === 'report-class-latest' ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                              <span>Durdur</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                              <span>Sesli Dinle</span>
                            </>
                          )}
                        </button>
                      )}
                      <span className="text-[10px] sm:text-[11px] font-mono text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/30">
                        Rapor Tarihi: {activeClassAdvice.timestamp}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
                    {activeClassAdvice.generalEvaluation}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 sm:p-4 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Sınıfın Güçlü Yönleri & Başarı Dinamikleri</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {activeClassAdvice.strengths?.map((str, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-emerald-400 font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 sm:p-4 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Sınıfça Müdahale Edilecek Zayıf Alanlar</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
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
                    <div className="bg-slate-950 border border-purple-500/30 p-4 sm:p-5 rounded-2xl space-y-3.5 mt-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-2">
                          <ListTodo className="w-4 h-4 text-purple-400" />
                          <span>Sınıf Geneli Haftalık Çalışma & Soru Çözüm Reçetesi</span>
                        </h3>
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Sınıf Tavsiye Kotası</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeClassAdvice.weeklyPrescription.map((item, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2 hover:border-purple-500/40 transition-all">
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
                              <span className="text-lg sm:text-xl font-black text-purple-400 font-mono">{item.targetQuestions}</span>
                              <span className="text-[10px] text-slate-400">Hedef Soru / Öğrenci</span>
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
                  {activeClassAdvice.actionPlan && activeClassAdvice.actionPlan.length > 0 && (
                    <div className="bg-slate-950 border border-indigo-500/30 p-4 sm:p-5 rounded-2xl space-y-3 mt-4">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>Rehber Öğretmen / Sınıf Koçu İçin Bu Haftalık 4 Temel Aksiyon ve Etüt Planı</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeClassAdvice.actionPlan?.map((plan, idx) => (
                          <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-xs text-slate-200 leading-relaxed">{plan}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeClassAdvice.motivationalQuote && (
                    <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-3.5 sm:p-4 rounded-2xl border border-purple-500/30 flex items-center space-x-3 italic text-xs text-purple-200">
                      <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                      <p className="leading-relaxed font-medium">"{activeClassAdvice.motivationalQuote}"</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-white">{selectedClass} Sınıfı İçin Rapor Bulunmuyor</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sınıfın tüm öğrenci verilerini tarayarak SWOT değerlendirmesi, haftalık etüt reçetesi ve rehberlik planı oluşturmak için yukarıdaki butona tıklayın.
                  </p>
                </div>
              </div>
            )
          ) : (
            /* STUDENT MODE REPORT */
            latestAdvice ? (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Genel Gidişat ve Durum Değerlendirmesi</span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                      {isSpeechSynthesisSupported() && (
                        <button
                          onClick={() => handleSpeakReport(latestAdvice)}
                          className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                            activeSpeakingId === 'report-latest'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                              : 'bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600/30'
                          }`}
                          title="Raporu ve reçeteyi sesli koçtan dinle"
                        >
                          {activeSpeakingId === 'report-latest' ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                              <span>Durdur</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                              <span>Raporu Sesli Dinle</span>
                            </>
                          )}
                        </button>
                      )}
                      <span className="text-[10px] sm:text-[11px] font-mono text-purple-300 font-bold bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                        Rapor Tarihi: {latestAdvice.timestamp}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-slate-800/80">
                    {latestAdvice.generalEvaluation}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 sm:p-4 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Güçlü Yönleriniz & Öne Çıkanlar</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {latestAdvice.strengths?.map((str, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-emerald-400 font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 sm:p-4 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Öncelikli Geliştirilecek Alanlar</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {latestAdvice.weakAreas?.map((w, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-rose-400 font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Haftalık Soru Reçetesi */}
                  {latestAdvice.weeklyPrescription && latestAdvice.weeklyPrescription.length > 0 && (
                    <div className="bg-slate-950 border border-purple-500/30 p-4 sm:p-5 rounded-2xl space-y-3.5 mt-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-2">
                          <ListTodo className="w-4 h-4 text-purple-400" />
                          <span>
                            {isEarlyHighSchool 
                              ? 'Haftalık Okul Dersleri & Yazılıya Hazırlık Reçetesi' 
                              : isGrade11 
                              ? '11. Sınıf Ders & 1. Aşama (TYT) Ön Hazırlık Reçetesi' 
                              : 'Haftalık YKS Çalışma & Soru Reçetesi'
                            }
                          </span>
                        </h3>
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                          {isEarlyHighSchool ? 'MEB Maarif Modeli Haftalık Kota' : isGrade11 ? '11. Sınıf & TYT Haftalık Kota' : 'Kişiye Özel Haftalık Kota'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {latestAdvice.weeklyPrescription.map((item, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2 hover:border-purple-500/40 transition-all">
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
                              <span className="text-lg sm:text-xl font-black text-purple-400 font-mono">{item.targetQuestions}</span>
                              <span className="text-[10px] text-slate-400">Hedef Soru</span>
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

                  {/* 4 Temel Aksiyon Adımı */}
                  {latestAdvice.actionPlan && latestAdvice.actionPlan.length > 0 && (
                    <div className="bg-slate-950 border border-indigo-500/30 p-4 sm:p-5 rounded-2xl space-y-3 mt-4">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>
                          {isEarlyHighSchool 
                            ? 'Lise Koçunun Bu Haftaki 4 Temel Aksiyon Adımı' 
                            : isGrade11 
                            ? 'Akademik Koçun Bu Haftaki 4 Temel Aksiyon Adımı' 
                            : 'YKS Koçunun Bu Haftaki 4 Temel Aksiyon Adımı'
                          }
                        </span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {latestAdvice.actionPlan.map((plan, idx) => (
                          <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-xs text-slate-200 leading-relaxed">{plan}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestAdvice.motivationalQuote && (
                    <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-3.5 sm:p-4 rounded-2xl border border-purple-500/30 flex items-center space-x-3 italic text-xs text-purple-200">
                      <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                      <p className="leading-relaxed font-medium">"{latestAdvice.motivationalQuote}"</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-white">Henüz Bir Koçluk Raporu Üretilmedi</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isEarlyHighSchool
                      ? 'Okul dersleri soru çözümlerini, yazılı sınav notlarını ve Hata Defterindeki eksik konularını analiz ederek kişisel çalışma reçetesi almak için yukarıdaki butona tıkla.'
                      : isGrade11
                      ? '11. sınıf derslerini ve 1. Aşama (TYT) ön hazırlık durumunu analiz ederek kişisel çalışma reçetesi almak için yukarıdaki butona tıkla.'
                      : 'Soru çözümlerini, deneme netlerini ve Hata Defterindeki eksik konularını analiz ederek kişisel çalışma reçetesi almak için yukarıdaki butona tıkla.'
                    }
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SEKME 2: AI KOÇ İLE CANLI SOHBET & DANIŞMANLIK */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <div className={`bg-slate-900 border ${!isTeacher ? stressTheme.borderColor : 'border-slate-800'} rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-3.5 shadow-xl animate-fade-in flex flex-col h-[560px] sm:h-[650px] transition-colors duration-500`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0 gap-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                  <span className="truncate">
                    {isTeacher 
                      ? `${selectedClass} Sınıf Rehberliği Danışmanı` 
                      : isEarlyHighSchool
                      ? 'Lise Koçu ile Canlı Danışmanlık (Okul Dersleri)'
                      : isGrade11
                      ? '11. Sınıf & TYT Ön Hazırlık Danışmanı'
                      : 'YKS Koçu ile Canlı Danışmanlık'
                    }
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {isTeacher
                    ? `${selectedClass} sınıfı için taktik ve plan danışın`
                    : isEarlyHighSchool
                    ? 'Okul dersleri, yazılı sınavlar, MEB kazanımları ve ödevler hakkında sorularını sor'
                    : isGrade11
                    ? '11. sınıf dersleri, yazılılar ve 1. aşama (TYT) ön hazırlık taktikleri hakkında sorularını sor'
                    : 'YKS stratejisi ve motivasyon konusunda sorularını sor'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {isSpeechSynthesisSupported() && (
                <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
                  <button
                    onClick={toggleAutoSpeak}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isAutoSpeakEnabled
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={isAutoSpeakEnabled ? 'Otomatik sesli okuma açık' : 'Otomatik sesli okumayı aç'}
                  >
                    {isAutoSpeakEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                    <span className="hidden md:inline">{isAutoSpeakEnabled ? 'Sesli Koç: Açık' : 'Sesli Koç: Kapalı'}</span>
                  </button>

                  {isAutoSpeakEnabled && (
                    <button
                      onClick={cycleSpeechRate}
                      className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 px-1.5 py-0.5 rounded border border-purple-500/30 transition-all cursor-pointer"
                      title="Konuşma hızını değiştir (1.0x, 1.2x, 1.4x, 0.9x)"
                    >
                      {speechRate}x
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleClearChat}
                className="text-xs text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-950 border border-slate-800 transition-all cursor-pointer flex items-center space-x-1.5"
                title="Sohbeti Sıfırla"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Temizle</span>
              </button>
            </div>
          </div>

          {/* 🧠 Stres Durumu Banner & Check-In Widget (sadece öğrenci modunda) */}
          {!isTeacher && (
            <div className="shrink-0 space-y-2">
              {stressTheme.bannerText && (
                <div className={`flex items-start space-x-2.5 px-3 py-2 rounded-xl ${stressTheme.bgColor} border ${stressTheme.borderColor} animate-fade-in`}>
                  <span className="text-base shrink-0 mt-0.5">{stressTheme.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${stressTheme.textColor}`}>{stressTheme.label}</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{stressTheme.bannerText}</p>
                  </div>
                </div>
              )}

              {/* Günlük Ruh Hali Check-In */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-medium shrink-0">Bugün nasılsın?</span>
                {(['tired', 'okay', 'ready'] as const).map(m => {
                  const labels = { tired: '😴 Yorgunum', okay: '😐 İdare Eder', ready: '🔥 Hazırım' };
                  return (
                    <button
                      key={m}
                      onClick={() => handleSetMood(m)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border font-bold transition-all cursor-pointer active:scale-95 ${
                        manualMood === m
                          ? `${stressTheme.badgeBg} text-white border-transparent scale-105 shadow-md`
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {labels[m]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Prompts - 2 satıra yayılan sarmalayan düzen */}
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {(isTeacher ? teacherQuickPrompts : adaptedQuickPrompts).map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(promptText)}
                disabled={chatLoading}
                className={`text-[10px] leading-snug ${!isTeacher && stressProfile.stressLevel !== 'calm' ? `${stressTheme.bgColor} ${stressTheme.textColor} ${stressTheme.borderColor}` : 'bg-slate-950 text-purple-200 border-purple-500/20 hover:border-purple-500/40'} border hover:opacity-80 px-2.5 py-1.5 rounded-full transition-all cursor-pointer disabled:opacity-50 text-left`}
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Chat Messages List */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3.5 pr-1 sm:pr-2 custom-scrollbar">
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
                  className={`max-w-[88%] sm:max-w-[75%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow-inner'
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {msg.sender === 'ai' && msg.id === typewriterMsgId
                      ? typewriterText
                      : msg.text}
                    {msg.sender === 'ai' && msg.id === typewriterMsgId && (
                      <span className="inline-block w-0.5 h-3.5 bg-purple-400 ml-0.5 align-middle animate-pulse" />
                    )}
                  </p>

                  {/* AI Mesajı için Dinle / Durdur Butonu ve Zaman Damgası */}
                  <div className={`flex items-center ${msg.sender === 'ai' ? 'justify-between' : 'justify-end'} mt-2 pt-1.5 border-t ${msg.sender === 'user' ? 'border-purple-500/20' : 'border-slate-800/60'}`}>
                    {msg.sender === 'ai' && isSpeechSynthesisSupported() && (
                      <button
                        onClick={() => handleSpeakMessage(msg.id, msg.text)}
                        className={`flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-medium ${
                          activeSpeakingId === msg.id
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                            : 'bg-slate-900 text-purple-300 border-purple-500/30 hover:bg-purple-950/50 hover:text-purple-200'
                        }`}
                        title={activeSpeakingId === msg.id ? 'Seslendirmeyi Durdur' : 'Sesli Dinle'}
                      >
                        {activeSpeakingId === msg.id ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                            <span>Durdur</span>
                            <span className="flex items-center space-x-0.5 ml-1">
                              <span className="w-0.5 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-0.5 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-0.5 h-1.5 bg-rose-400 rounded-full animate-bounce" />
                            </span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-2.5 h-2.5 text-purple-400" />
                            <span>Dinle</span>
                          </>
                        )}
                      </button>
                    )}
                    <span className={`text-[9px] font-mono ${msg.sender === 'user' ? 'text-purple-200' : 'text-slate-500'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center space-x-2 text-xs text-purple-300 bg-slate-950 p-3 rounded-2xl border border-slate-800 w-fit animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>
                  {isTeacher 
                    ? 'Sınıf Koçluk Danışmanı yanıt hazırlıyor...' 
                    : isEarlyHighSchool 
                    ? 'Lise Koçunuz yanıt hazırlıyor...' 
                    : isGrade11 
                    ? '11. Sınıf Koçunuz yanıt hazırlıyor...' 
                    : 'YKS Koçunuz yanıt hazırlıyor...'
                  }
                </span>
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
              placeholder={
                isTeacher 
                  ? `${selectedClass} sınıfı için bir rehberlik sorusu sorun...` 
                  : isEarlyHighSchool 
                  ? 'Lise koçuna okul dersleri, yazılı sınavlar veya ödevlerinle ilgili bir soru sor...' 
                  : isGrade11 
                  ? '11. sınıf dersleri, yazılılar veya TYT ön hazırlık hakkında koçuna danış...' 
                  : 'YKS koçuna bir soru sor veya taktik iste...'
              }
              disabled={chatLoading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2.5 sm:p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SEKME 3: GEÇMİŞ RAPORLAR & ARŞİV */}
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
                <span>
                  {isEarlyHighSchool 
                    ? 'Lise Koçluk Rapor Detayı' 
                    : isGrade11 
                    ? '11. Sınıf & Ön Hazırlık Rapor Detayı' 
                    : 'YKS Koçluk Rapor Detayı'
                  } ({selectedDetailAdvice.timestamp})
                </span>
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
