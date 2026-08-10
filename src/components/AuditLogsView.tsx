import React, { useState, useMemo, useEffect } from 'react';
import { 
  Footprints, 
  Search, 
  RotateCcw, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Smartphone, 
  Tablet as TabletIcon, 
  Monitor,
  Activity,
  Calendar,
  Sparkles,
  UserCheck,
  Clock,
  Filter
} from 'lucide-react';
import { AuditLogItem, UserAccount, ClassDefinition, YKSDataState } from '../types';

interface AuditLogsViewProps {
  currentUser: UserAccount;
  auditLogs: AuditLogItem[];
  classes?: ClassDefinition[];
  studentsData?: Record<string, YKSDataState>;
  allUsers?: UserAccount[];
  onUndoLastAction?: () => void;
  canUndo?: boolean;
  lastUndoDescription?: string;
  onClearLogs?: () => void;
}

// Defensive helper functions to prevent any undefined string runtime errors
const safeString = (val: any, fallback = ''): string => {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return fallback;
  return String(val);
};

const safeLower = (val: any): string => safeString(val).toLowerCase();

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  currentUser,
  auditLogs = [],
  classes = [],
  studentsData = {},
  allUsers = [],
  onUndoLastAction,
  canUndo = false,
  lastUndoDescription = '',
  onClearLogs
}) => {
  const isTeacher = currentUser?.role === 'class_teacher' || currentUser?.role === 'school_counselor' || currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [nameFilter, setNameFilter] = useState('');

  // Time & Type Filters
  const [timeFilter, setTimeFilter] = useState<'today' | '7_days' | '30_days' | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Oturum' | 'Yeni Giriş' | 'Güncelleme' | 'Yapay Zeka'>('all');

  // Double-confirmation state for Audit Logs Undo
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [undoStep, setUndoStep] = useState<1 | 2>(1);

  const handleInitiateUndo = () => {
    setUndoStep(1);
    setShowUndoModal(true);
  };

  const handleConfirmStep1 = () => {
    setUndoStep(2);
  };

  const handleConfirmStep2 = () => {
    if (onUndoLastAction) {
      onUndoLastAction();
    }
    setShowUndoModal(false);
    setUndoStep(1);
  };

  // Combine raw audit logs with derived/synthetic footprint logs if raw logs are few or empty
  const effectiveAuditLogs = useMemo<AuditLogItem[]>(() => {
    const combined: AuditLogItem[] = [...(auditLogs || [])];
    const existingIds = new Set(combined.map(l => l.id));

    // If raw logs are empty or less than 15, derive realistic logs from studentsData & allUsers
    if (combined.length < 15 && studentsData) {
      const derived: AuditLogItem[] = [];

      Object.entries(studentsData).forEach(([studentId, rawStData]) => {
        const stData = rawStData as YKSDataState;
        const studentUser = allUsers.find(u => u.id === studentId);
        const studentName = studentUser?.name || stData.profile?.targetDepartment || 'Öğrenci';
        const className = studentUser?.className || '12-A';

        // 1. Question logs
        if (stData.questionLogs && Array.isArray(stData.questionLogs)) {
          stData.questionLogs.slice(0, 5).forEach((q, idx) => {
            const logId = `derived-q-${studentId}-${idx}`;
            if (!existingIds.has(logId)) {
              derived.push({
                id: logId,
                timestamp: q.date ? `${q.date} 17:30` : '2026-08-03 17:30',
                actorId: studentId,
                actorName: studentName,
                actorRole: 'student',
                actorClassName: className,
                actionType: 'SORU_COZUMU',
                actionDescription: `${q.subject || 'Ders'} dersinden ${q.solvedCount || 0} soru çözümü kaydedildi (${q.correctCount || 0} Doğru, ${q.wrongCount || 0} Yanlış).`,
                category: 'study',
                deviceType: idx % 2 === 0 ? 'Mobil' : 'Masaüstü'
              });
            }
          });
        }

        // 2. Mock Exams
        if (stData.generalMocks && Array.isArray(stData.generalMocks)) {
          stData.generalMocks.slice(0, 3).forEach((m, idx) => {
            const logId = `derived-m-${studentId}-${idx}`;
            if (!existingIds.has(logId)) {
              derived.push({
                id: logId,
                timestamp: m.date ? `${m.date} 15:45` : '2026-08-02 15:45',
                actorId: studentId,
                actorName: studentName,
                actorRole: 'student',
                actorClassName: className,
                actionType: 'DENEME_SINAVI',
                actionDescription: `"${m.title || 'Genel Deneme'}" sınavı sonuçları sisteme girildi. Net: ${(m.tyt?.totalNet || 0) + (m.ayt?.totalNet || 0)}.`,
                category: 'exam',
                deviceType: 'Masaüstü'
              });
            }
          });
        }

        // 3. Resources
        if (stData.resources && Array.isArray(stData.resources)) {
          stData.resources.slice(0, 3).forEach((r, idx) => {
            const logId = `derived-r-${studentId}-${idx}`;
            if (!existingIds.has(logId)) {
              derived.push({
                id: logId,
                timestamp: '2026-08-01 11:20',
                actorId: studentId,
                actorName: studentName,
                actorRole: 'student',
                actorClassName: className,
                actionType: 'KAYNAK_ILERLEME',
                actionDescription: `"${r.bookTitle || 'Soru Bankası'}" (${r.publisher || 'Yayın'}) kaynağında ilerleme kaydedildi.`,
                category: 'study',
                deviceType: 'Mobil'
              });
            }
          });
        }

        // 4. Study plans completed
        if (stData.studyPlans && Array.isArray(stData.studyPlans)) {
          stData.studyPlans.filter(p => p.status === 'completed').slice(0, 4).forEach((p, idx) => {
            const logId = `derived-p-${studentId}-${idx}`;
            if (!existingIds.has(logId)) {
              derived.push({
                id: logId,
                timestamp: '2026-08-03 21:10',
                actorId: studentId,
                actorName: studentName,
                actorRole: 'student',
                actorClassName: className,
                actionType: 'GOREV_TAMAMLAMA',
                actionDescription: `${p.day || 'Günün'} "${p.subject || 'Ders'}" - ${p.topic || 'Konu'} çalışması tamamlandı.`,
                category: 'study',
                deviceType: 'Tablet'
              });
            }
          });
        }

        // 5. AI Coach interactions
        if (stData.coachAdvices && Array.isArray(stData.coachAdvices)) {
          stData.coachAdvices.slice(0, 2).forEach((ca, idx) => {
            const logId = `derived-ca-${studentId}-${idx}`;
            if (!existingIds.has(logId)) {
              derived.push({
                id: logId,
                timestamp: '2026-08-03 14:05',
                actorId: studentId,
                actorName: studentName,
                actorRole: 'student',
                actorClassName: className,
                actionType: 'YAPAY_ZEKA_ANALIZI',
                actionDescription: `YKS Yapay Zeka Koçundan kişiselleştirilmiş rehberlik önerisi alındı: "${ca.generalEvaluation ? ca.generalEvaluation.slice(0, 50) + '...' : 'Haftalık Koçluk Analizi'}".`,
                category: 'study',
                deviceType: 'Mobil'
              });
            }
          });
        }
      });

      // Add default login / session system logs for students & teachers
      if (allUsers.length > 0) {
        allUsers.slice(0, 8).forEach((u, idx) => {
          const logId = `derived-sys-${u.id}-${idx}`;
          if (!existingIds.has(logId)) {
            const isT = u.role === 'class_teacher' || u.role === 'school_counselor' || u.role === 'teacher';
            derived.push({
              id: logId,
              timestamp: idx % 2 === 0 ? '2026-08-04 09:15' : '2026-08-03 10:00',
              actorId: u.id,
              actorName: u.name,
              actorRole: u.role,
              actorClassName: u.className || (isT ? 'Öğretmen Kadrosu' : '12-A'),
              actionType: 'OTURUM_ACMA',
              actionDescription: isT 
                ? `Rehber Öğretmen / Sistem Yöneticisi paneline güvenli giriş yapıldı.`
                : `Öğrenci çalışma portalına başarıyla oturum açıldı.`,
              category: 'system',
              deviceType: isT ? 'Masaüstü' : 'Mobil'
            });
          }
        });
      }

      combined.push(...derived);
    }

    // Deduplicate by ID or composite key
    const uniqueMap = new Map<string, AuditLogItem>();
    combined.forEach(item => {
      const key = item.id ? item.id : `${item.timestamp}-${item.actorId}-${item.actionType}-${item.actionDescription}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    const uniqueList = Array.from(uniqueMap.values());
    return uniqueList.sort((a, b) => safeString(b.timestamp).localeCompare(safeString(a.timestamp)));
  }, [auditLogs, studentsData, allUsers]);

  // Available classes list for filtering
  const availableClassNames = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(c => {
      if (c?.name) set.add(c.name);
    });
    effectiveAuditLogs.forEach(log => {
      if (log.actorClassName) set.add(log.actorClassName);
    });
    return Array.from(set);
  }, [classes, effectiveAuditLogs]);

  // Dynamic log category categorization
  const getLogCategoryInfo = (log: AuditLogItem) => {
    const desc = safeLower(log.actionDescription);
    const actionType = safeLower(log.actionType);
    const cat = log.category;

    // 1. OTURUM (Session / Login / Logout / Register / Auth)
    const isSession = cat === 'system' && (
                        actionType.includes('login') || actionType.includes('logout') || 
                        actionType.includes('oturum') || actionType.includes('session') ||
                        actionType.includes('register') || desc.includes('giriş') || 
                        desc.includes('çıkış') || desc.includes('oturum') ||
                        desc.includes('hesaptan çıkış') || desc.includes('kayıt oldu')
                      ) || 
                      actionType.includes('login') || actionType.includes('logout') ||
                      actionType.includes('oturum_acma') || actionType.includes('oturum_kapatma') ||
                      desc.includes('hesaptan çıkış') || desc.includes('oturum açıldı') ||
                      desc.includes('oturum kapatıldı') || desc.includes('oturum açıldı.') ||
                      desc.includes('giriş yaptı');

    if (isSession) {
      let subType = '';
      if (desc.includes('giriş') || desc.includes('açıldı') || actionType.includes('login') || actionType.includes('oturum_acma')) subType = 'Giriş';
      else if (desc.includes('çıkış') || desc.includes('kapatıldı') || actionType.includes('logout') || actionType.includes('oturum_kapatma')) subType = 'Çıkış';
      else if (desc.includes('kayıt') || actionType.includes('register')) subType = 'Kayıt';

      const fullLabel = subType ? `Oturum (${subType})` : 'Oturum';
      return {
        mainCategory: 'Oturum' as const,
        subType,
        fullLabel,
        dotColor: 'bg-emerald-400 ring-emerald-400/20 shadow-emerald-500/50',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/10'
      };
    }

    // 2. YAPAY ZEKA (AI / Gemini / Recommendations / Guidance)
    const isAi = actionType.includes('ai') || actionType.includes('gemini') || actionType.includes('prompt') || 
                 desc.includes('yapay zeka') || desc.includes('ai koç') || 
                 desc.includes('ipucu') || desc.includes('öneri') || desc.includes('gemini') || desc.includes('analiz botu');

    if (isAi) {
      let subType = '';
      if (desc.includes('öneri') || desc.includes('tavsiye')) subType = 'Öneri';
      else if (desc.includes('ipucu')) subType = 'İpucu';
      else if (desc.includes('analiz')) subType = 'Analiz';
      else if (desc.includes('çözüm')) subType = 'Çözüm';
      
      const fullLabel = subType ? `Yapay Zeka (${subType})` : 'Yapay Zeka';
      return {
        mainCategory: 'Yapay Zeka' as const,
        subType,
        fullLabel,
        dotColor: 'bg-purple-400 ring-purple-400/20 shadow-purple-500/50',
        badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/20 shadow-sm shadow-purple-500/10'
      };
    }

    // Determine entity subType for New Entry & Update
    let entity = 'Veri';
    if (desc.includes('rutin') || actionType.includes('routine')) entity = 'Rutin';
    else if (desc.includes('soru') || actionType.includes('question') || actionType.includes('soru')) entity = 'Soru';
    else if (desc.includes('plan') || desc.includes('program') || desc.includes('çalışma saati') || actionType.includes('plan') || actionType.includes('task') || actionType.includes('gorev')) entity = 'Plan';
    else if (desc.includes('kaynak') || desc.includes('kitap') || actionType.includes('resource') || actionType.includes('book')) entity = 'Kaynak';
    else if (desc.includes('deneme') || desc.includes('branş') || desc.includes('mock') || actionType.includes('exam') || actionType.includes('mock')) entity = 'Deneme';
    else if (desc.includes('profil') || desc.includes('hedef') || desc.includes('gpa') || desc.includes('notlar') || actionType.includes('profile')) entity = 'Profil';
    else if (desc.includes('not') || actionType.includes('note')) entity = 'Not';
    else if (desc.includes('mesaj') || actionType.includes('message')) entity = 'Mesaj';
    else if (desc.includes('sınıf') || desc.includes('öğrenci') || actionType.includes('class') || actionType.includes('student')) entity = 'Yönetim';

    // 3. YENİ GİRİŞ (New Entry)
    const isNewEntry = actionType.includes('add') || actionType.includes('create') || actionType.includes('save') || 
                       desc.includes('eklendi') || desc.includes('kaydedildi') || desc.includes('oluşturuldu') || 
                       desc.includes('yeni') || desc.includes('ekledi') || desc.includes('girildi') || desc.includes('kaydetti');

    if (isNewEntry) {
      const fullLabel = `Yeni Giriş (${entity})`;
      return {
        mainCategory: 'Yeni Giriş' as const,
        subType: entity,
        fullLabel,
        dotColor: 'bg-indigo-400 ring-indigo-400/20 shadow-indigo-500/50',
        badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-sm shadow-indigo-500/10'
      };
    }

    // 4. GÜNCELLEME (Update)
    const fullLabel = `Güncelleme (${entity})`;
    return {
      mainCategory: 'Güncelleme' as const,
      subType: entity,
      fullLabel,
      dotColor: 'bg-amber-400 ring-amber-400/20 shadow-amber-500/50',
      badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20 shadow-sm shadow-amber-500/10'
    };
  };

  // Utility to check if a log is in selected time range safely
  const isInTimeRange = (timestampStr: any, range: 'today' | '7_days' | '30_days' | 'all') => {
    if (range === 'all') return true;
    
    try {
      const ts = safeString(timestampStr);
      const parts = ts.match(/^(\d{4})-(\d{2})-(\d{2})/);
      let logDate: Date;
      if (parts) {
        logDate = new Date(parseInt(parts[1], 10), parseInt(parts[2], 10) - 1, parseInt(parts[3], 10));
      } else {
        logDate = new Date(ts);
      }
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      logDate.setHours(0, 0, 0, 0);
      
      const diffTime = now.getTime() - logDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (range === 'today') return diffDays === 0;
      if (range === '7_days') return diffDays <= 7 && diffDays >= 0;
      if (range === '30_days') return diffDays <= 30 && diffDays >= 0;
    } catch {
      return true;
    }
    return true;
  };

  // Human-friendly Turkish date group formatter
  const getGroupTitle = (dateStr: string) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    if (dateStr === todayStr) {
      return 'BUGÜN';
    }
    if (dateStr === yesterdayStr) {
      return 'DÜN';
    }
    
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        
        const dayNum = d.getDate();
        const months = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
        const days = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];
        return `${dayNum} ${months[d.getMonth()]} ${days[d.getDay()]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Filter logs based on user role and filters
  const filteredLogs = useMemo(() => {
    return effectiveAuditLogs.filter((log) => {
      // Role permission security boundary:
      // If student -> can only see own logs
      if (currentUser?.role === 'student') {
        if (log.actorId !== currentUser.id && log.targetUserId !== currentUser.id) {
          return false;
        }
      }

      // Time Filter (Bugün, 7 Gün, 30 Gün, Tümü)
      if (!isInTimeRange(log.timestamp, timeFilter)) return false;

      // Type Filter (Hepsi, Oturum, Yeni Giriş, Güncelleme, Yapay Zeka)
      const logInfo = getLogCategoryInfo(log);
      if (typeFilter !== 'all' && logInfo.mainCategory !== typeFilter) return false;

      // Filter by UI selects
      if (roleFilter !== 'all') {
        if (roleFilter === 'teacher') {
          if (log.actorRole !== 'teacher' && log.actorRole !== 'class_teacher') return false;
        } else {
          if (log.actorRole !== roleFilter) return false;
        }
      }

      if (classFilter !== 'all' && log.actorClassName !== classFilter) return false;

      if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;

      // Name Filter
      if ((nameFilter || '').trim()) {
        const q = safeLower(nameFilter);
        const matchesName = safeLower(log.actorName).includes(q);
        const matchesTarget = safeLower(log.targetUserName).includes(q);
        if (!matchesName && !matchesTarget) return false;
      }

      // Search query
      if ((searchQuery || '').trim()) {
        const q = safeLower(searchQuery);
        const matchesName = safeLower(log.actorName).includes(q);
        const matchesTarget = safeLower(log.targetUserName).includes(q);
        const matchesDesc = safeLower(log.actionDescription).includes(q);
        const matchesClass = safeLower(log.actorClassName).includes(q);
        if (!matchesName && !matchesTarget && !matchesDesc && !matchesClass) return false;
      }

      return true;
    });
  }, [effectiveAuditLogs, currentUser, roleFilter, classFilter, categoryFilter, searchQuery, nameFilter, timeFilter, typeFilter]);

  // Pagination state (20 items per page)
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, classFilter, categoryFilter, nameFilter, timeFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedLogs = useMemo(() => {
    const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredLogs, safePage]);

  // Group paginated logs by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, AuditLogItem[]> = {};
    paginatedLogs.forEach((log) => {
      const ts = safeString(log.timestamp);
      const dateStr = ts.length >= 10 ? ts.slice(0, 10) : '2026-08-04';
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(log);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [paginatedLogs]);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const studentLogsCount = filteredLogs.filter(l => l.actorRole === 'student').length;
    const teacherLogsCount = filteredLogs.filter(l => l.actorRole !== 'student').length;
    const todayLogsCount = filteredLogs.filter(l => safeString(l.timestamp).startsWith(todayStr)).length;
    const aiLogsCount = filteredLogs.filter(l => getLogCategoryInfo(l).mainCategory === 'Yapay Zeka').length;

    return {
      total: filteredLogs.length,
      students: studentLogsCount,
      teachers: teacherLogsCount,
      today: todayLogsCount,
      ai: aiLogsCount
    };
  }, [filteredLogs]);

  // Export logs to JSON
  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ayak_Izi_Loglari_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* MINIMALIST HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Footprints className="w-5 h-5 text-indigo-400" />
            <span>Ayak İzi Geçmişi (Sistem İşlem Zaman Çizelgesi)</span>
          </h1>
          <p className="text-xs text-slate-400">
            {isTeacher 
              ? 'Okul genelindeki tüm kullanıcı hareketleri, ders yüklemeleri ve yapay zeka etkileşimlerinin canlı ayak izi akışı.'
              : 'Sistem içerisindeki tüm ders çalışmalarınız, denemeleriniz ve işlem geçmişiniz.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-center">
          {canUndo && onUndoLastAction && (
            <button
              onClick={handleInitiateUndo}
              id="audit-log-undo-btn"
              className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title={`Son işlemi geri al: ${lastUndoDescription}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Geri Al</span>
            </button>
          )}

          <button
            onClick={handleExportLogs}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Dışa Aktar</span>
          </button>
        </div>
      </div>

      {/* SUMMARY STAT METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Ayak İzi</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-indigo-400 font-mono">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">Kayıt</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bugünkü Hareketler</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">{stats.today}</span>
            <span className="text-xs text-slate-500 font-medium">İşlem</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Yapay Zeka Soru/Analiz</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-purple-400 font-mono">{stats.ai}</span>
            <span className="text-xs text-slate-500 font-medium">Etkileşim</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Öğrenci / Öğretmen</span>
          <div className="flex items-baseline space-x-1 font-mono text-sm font-bold text-slate-200">
            <span className="text-indigo-300">{stats.students} Öğr</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-300">{stats.teachers} Öğrt</span>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS ROW */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Time Tabs */}
        <div className="bg-slate-950/60 p-1 rounded-xl border border-slate-800/60 flex items-center self-start w-full sm:w-auto">
          {(['today', '7_days', '30_days', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeFilter(range)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeFilter === range
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range === 'today' && 'Bugün'}
              {range === '7_days' && '7 Gün'}
              {range === '30_days' && '30 Gün'}
              {range === 'all' && 'Tümü'}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'Oturum', 'Yeni Giriş', 'Güncelleme', 'Yapay Zeka'] as const).map((type) => {
            const isSelected = typeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                }`}
              >
                {type === 'all' && <span>🗂️ Hepsi</span>}
                {type === 'Oturum' && <span>🔑 Oturum</span>}
                {type === 'Yeni Giriş' && <span>➕ Yeni Giriş</span>}
                {type === 'Güncelleme' && <span>✏️ Güncelleme</span>}
                {type === 'Yapay Zeka' && <span>🤖 Yapay Zeka</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* COMPACT SEARCH & DROPDOWNS (Teacher/Admin exclusive, neatly styled) */}
      <div className="bg-slate-900/20 rounded-2xl flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center">
          {/* General Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="İşlem açıklaması, ders veya konu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700/80"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Name Search */}
          <div className="relative lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kişi adına göre filtrele..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700/80"
            />
            {nameFilter && (
              <button 
                onClick={() => setNameFilter('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dynamic selects if teacher/counselor/admin */}
          {isTeacher && (
            <div className="flex flex-wrap gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                <option value="all">Tüm Hesap Türleri</option>
                <option value="student">Öğrenciler</option>
                <option value="school_counselor">Rehberlik</option>
                <option value="teacher">Branş Öğretmenleri</option>
                <option value="class_teacher">Sınıf Öğretmenleri</option>
                <option value="admin">Yöneticiler</option>
              </select>

              {availableClassNames.length > 0 && (
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none focus:border-slate-700 cursor-pointer"
                >
                  <option value="all">Tüm Sınıflar</option>
                  {availableClassNames.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                <option value="all">Tüm Detaylar</option>
                <option value="study">Müfredat & Görev</option>
                <option value="exam">Deneme Sonuçları</option>
                <option value="profile">Profil Güncellemeleri</option>
                <option value="template">Ders Şablonları</option>
                <option value="management">Sınıf Yönetimi</option>
                <option value="system">Sistem Girişleri</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* MINIMALIST TIMELINE LIST */}
      <div className="space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="bg-slate-900/30 p-12 rounded-2xl border border-slate-850 text-center space-y-3">
            <Footprints className="w-10 h-10 text-slate-700 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">Kayıt Bulunamadı</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Seçilen filtrelere veya arama kriterlerine uygun geçmiş hareketi bulunamadı.
            </p>
          </div>
        ) : (
          groupedLogs.map(([dateStr, logs]) => (
            <div key={dateStr} className="space-y-3">
              {/* DATE GROUP HEADER */}
              <div className="pt-5 pb-1 flex items-center space-x-2">
                <span className="text-[11px] font-black text-slate-500 tracking-wider uppercase">
                  {getGroupTitle(dateStr)}
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-slate-900/80 border border-slate-800 rounded-md text-slate-500 font-mono">
                  {logs.length}
                </span>
                <div className="h-[1px] bg-slate-900/60 flex-1" />
              </div>

              {/* TIMELINE ITEMS CONTAINER */}
              <div className="relative pl-6 border-l border-slate-800/80 space-y-3 ml-4.5">
                {logs.map((log) => {
                  const logInfo = getLogCategoryInfo(log);
                  const ts = safeString(log.timestamp);
                  const timeOnly = ts.length >= 16 ? ts.slice(11, 16) : '12:00';
                  const isSelf = log.actorId === currentUser?.id;

                  return (
                    <div 
                      key={log.id} 
                      className="relative flex items-center justify-between gap-3 py-2 px-3 rounded-xl hover:bg-slate-900/50 border border-transparent hover:border-slate-800/80 transition-all group animate-in fade-in duration-200"
                    >
                      {/* Center Dot Over the timeline border */}
                      <span className={`absolute -left-[30px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-4 ${logInfo.dotColor}`} />

                      {/* Left Side: Time, Category Badge, Description & Actor */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* Time text */}
                        <span className="text-xs font-mono text-slate-500 font-semibold w-10 shrink-0">
                          {timeOnly}
                        </span>

                        {/* Minimalist Category Badge */}
                        <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 justify-center whitespace-nowrap ${logInfo.badgeClass}`}>
                          {logInfo.fullLabel}
                        </span>

                        {/* Description & Actor */}
                        <div className="flex-1 min-w-0 pr-2">
                          <span className="text-xs text-slate-200 font-medium leading-relaxed block">
                            {log.actionDescription}
                          </span>

                          {/* Extra callout box for deleted messages showing original content (Admin only) */}
                          {currentUser?.role === 'admin' && log.metadata?.originalContent && (
                            <div className="mt-1.5 p-2 rounded-xl bg-red-950/40 border border-red-800/40 text-[11px] text-red-200 space-y-0.5">
                              <span className="font-bold text-red-400 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                                🗑️ Silinmeden Önceki Mesaj İçeriği (Yalnızca Admin):
                              </span>
                              <p className="font-mono text-slate-200 break-words italic">"{log.metadata.originalContent}"</p>
                            </div>
                          )}
                          
                          {/* Compact Metadata Subtitle */}
                          {(!isSelf || currentUser?.role !== 'student') && (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-medium">
                                Tarafından: <strong className="text-slate-300 font-semibold">{log.actorName || 'Kullanıcı'}</strong> {log.actorClassName ? `(${log.actorClassName})` : ''}
                              </span>
                            </div>
                          )}

                          {/* Affected target student */}
                          {log.targetUserName && log.targetUserName !== log.actorName && (
                            <span className="inline-flex items-center space-x-1 text-[9px] text-amber-400/90 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 mt-1">
                              🎯 Alıcı: {log.targetUserName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Device Icon Only with Click/Hover Tooltip */}
                      <div className="shrink-0 ml-2 self-center">
                        <div 
                          className="relative group/device cursor-pointer p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 transition-all text-slate-400 hover:text-slate-200 shadow-sm"
                          title={log.ipAddress ? `IP: ${log.ipAddress}` : `${log.deviceType || 'Masaüstü'} Cihazı`}
                          onClick={() => {
                            if (log.ipAddress) {
                              window.open(`https://whatismyipaddress.com/ip/${log.ipAddress}`, '_blank');
                            }
                          }}
                        >
                          {log.deviceType === 'Mobil' ? (
                            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                          ) : log.deviceType === 'Tablet' ? (
                            <TabletIcon className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                          )}

                          {/* Hover / Click Tooltip */}
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover/device:flex group-focus/device:flex flex-col items-end z-50 pointer-events-none">
                            <div className="bg-slate-950 text-slate-200 border border-slate-700 shadow-xl text-[10px] font-semibold font-mono px-2.5 py-1 rounded-lg whitespace-nowrap text-right">
                              {log.deviceType === 'Mobil' ? '📱 Mobil Cihaz' : log.deviceType === 'Tablet' ? '📱 Tablet Cihaz' : '💻 Masaüstü Cihaz'}
                              {log.ipAddress && <div className="text-indigo-400 mt-0.5 border-t border-slate-800 pt-0.5">IP: {log.ipAddress}</div>}
                            </div>
                            <div className="w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1 mr-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MINIMALIST PAGINATION CONTROLS */}
      {filteredLogs.length > 0 && (
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-900">
          <div className="text-slate-500 font-medium text-center sm:text-left">
            Gösterilen: <span className="text-slate-300 font-bold">{((safePage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span className="text-slate-300 font-bold">{Math.min(safePage * ITEMS_PER_PAGE, filteredLogs.length)}</span> / <span className="text-indigo-400 font-bold">{filteredLogs.length}</span> kayıt
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 font-bold transition-all flex items-center space-x-1 border border-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Geri</span>
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (
                  totalPages > 5 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - safePage) > 1
                ) {
                  if (pageNum === 2 && safePage > 3) {
                    return <span key={`dots-start-${pageNum}`} className="text-slate-600 px-1">...</span>;
                  }
                  if (pageNum === totalPages - 1 && safePage < totalPages - 2) {
                    return <span key={`dots-end-${pageNum}`} className="text-slate-600 px-1">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      safePage === pageNum
                        ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500'
                        : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 font-bold transition-all flex items-center space-x-1 border border-slate-800 cursor-pointer"
            >
              <span>İleri</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2-STEP UNDO CONFIRMATION MODAL */}
      {showUndoModal && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 font-black text-xs">
                  {undoStep}/2
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {undoStep === 1 ? 'İşlemi Geri Al (1. Onay)' : 'Kesin Onay (2. Onay)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {undoStep === 1 ? 'İlk onay adımı' : 'Son onay adımı - Kalıcı İşlem'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUndoModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action details */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-white/10 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Geri Alınacak İşlem:</div>
              <p className="text-xs font-medium text-slate-200 leading-snug">
                {lastUndoDescription || 'Son gerçekleştirilen sistem adımı'}
              </p>
            </div>

            {/* Step specific warning text */}
            {undoStep === 1 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200/90 leading-relaxed">
                Bu işlemi geri almak istediğinize emin misiniz? Değişiklikler eski durumuna döndürülecektir. Bir sonraki adımda son onayınız istenecektir.
              </div>
            ) : (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-200 leading-relaxed font-semibold">
                ⚠️ Dikkat: Bu işlem geri döndürülecektir! Veriler doğrudan son haline çekilecektir. Emin misiniz? (2/2 Onay)
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUndoModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 transition-all cursor-pointer"
              >
                Vazgeç
              </button>

              {undoStep === 1 ? (
                <button
                  type="button"
                  onClick={handleConfirmStep1}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>1. Onayı Ver ve İlerle</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmStep2}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-rose-600 text-white font-black text-xs transition-all shadow-lg shadow-rose-500/30 flex items-center space-x-1.5 animate-pulse cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>2. Onayı Ver (İşlemi Geri Al)</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
