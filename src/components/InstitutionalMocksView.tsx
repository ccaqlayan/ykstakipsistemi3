import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Menu,
  GraduationCap,
  Search,
  Calendar,
  Award,
  Users,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Filter,
  Eye,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  LayoutGrid,
  ListFilter,
  Layers,
  Activity,
  Flame,
  Trophy,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronUp,
  LineChart as LineChartIcon,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend 
} from 'recharts';
import { UserAccount, InstitutionalMockExam, YKSDataState } from '../types';
import { 
  MatchStudentModal, 
  EditExamModal, 
  DeleteConfirmModal, 
  DeleteAllExamsModal, 
  EditSeriesModal, 
  ClassMappingModal 
} from './import/BulkImportModals';
import { BulkImportHistoryTab } from './import/BulkImportHistoryTab';
import { MockInstitutionalDetailView } from './mocks/MockInstitutionalDetailView';

interface InstitutionalMocksViewProps {
  currentUser: UserAccount | null;
  users: UserAccount[];
  classes: any[];
  studentsData: Record<string, YKSDataState>;
  institutionalMockExams?: InstitutionalMockExam[];
  onUpdateInstitutionalExam?: (exam: InstitutionalMockExam) => void;
  onDeleteInstitutionalExam?: (examId: string | string[]) => void;
  onDeleteAllInstitutionalExams?: () => Promise<void> | void;
  onToggleMenu?: () => void;
}

const formatMockDate = (dateStr?: string) => {
  if (!dateStr) return { day: '-', month: '-', year: '-', time: '', short: '-' };
  const [datePart, timePart] = dateStr.split(' ');
  const parts = (datePart || '').split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const monthIndex = parseInt(m, 10) - 1;
    const monthName = months[monthIndex] || m;
    return {
      day: d,
      month: monthName,
      year: y,
      time: timePart || '',
      short: `${d} ${monthName} ${y}`
    };
  }
  return { day: dateStr, month: '', year: '', time: '', short: dateStr };
};

const getExamTotalNet = (exam: InstitutionalMockExam): number => {
  if (exam.totalNet && exam.totalNet > 0) return exam.totalNet;
  if (Array.isArray(exam.subjects) && exam.subjects.length > 0) {
    const sum = exam.subjects.reduce((acc, s) => acc + (s.net || 0), 0);
    return Math.round(sum * 100) / 100;
  }
  return 0;
};

const getMaxExamScore = (exam: InstitutionalMockExam): number => {
  const scores = [
    exam.scores?.tytScore || 0,
    exam.scores?.sayScore || 0,
    exam.scores?.eaScore || 0,
    exam.scores?.sozScore || 0
  ];
  return Math.max(...scores);
};

export const InstitutionalMocksView: React.FC<InstitutionalMocksViewProps> = ({
  currentUser,
  users,
  classes,
  studentsData,
  institutionalMockExams = [],
  onUpdateInstitutionalExam,
  onDeleteInstitutionalExam,
  onDeleteAllInstitutionalExams,
  onToggleMenu
}) => {
  const isStudent = currentUser?.role === 'student';

  // ── STUDENT VIEW STATE ──
  const [selectedInstitutionalExam, setSelectedInstitutionalExam] = useState<InstitutionalMockExam | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('ALL');
  const [publisherFilter, setPublisherFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'score_desc' | 'net_desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ── ADMIN / TEACHER MODALS STATE ──
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [matchModalExam, setMatchModalExam] = useState<InstitutionalMockExam | null>(null);
  const [editModalExam, setEditModalExam] = useState<InstitutionalMockExam | null>(null);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState<InstitutionalMockExam | null>(null);
  const [editingSeriesExam, setEditingSeriesExam] = useState<{
    examTitle: string;
    latestDate?: string;
    count: number;
  } | null>(null);
  const [showClassMappingModal, setShowClassMappingModal] = useState(false);

  // Persistent class mappings state (e.g. "12-A" -> "12-A SAY")
  const [classMappings, setClassMappings] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('yks_class_mappings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error reading class mappings from localStorage", e);
    }
    return {
      '12-A': '12-A SAY',
      '12A': '12-A SAY',
      '12-B': '12-B EA',
      '12B': '12-B EA'
    };
  });

  // Sync class mappings to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('yks_class_mappings', JSON.stringify(classMappings));
    } catch (e) {
      console.error("Error saving class mappings to localStorage", e);
    }
  }, [classMappings]);

  // ── FILTER EXAMS FOR CURRENT STUDENT (STRICT DATA ISOLATION) ──
  const myStudentExams = useMemo(() => {
    if (!currentUser) return [];
    const examMap = new Map<string, InstitutionalMockExam>();
    const studentId = currentUser.id;
    const studentEmail = (currentUser.email || '').trim().toLowerCase();
    const studentName = (currentUser.name || '').trim().toLowerCase();

    // 1. From studentsData for this specific student
    if (studentsData && studentsData[studentId]?.institutionalMocks) {
      studentsData[studentId].institutionalMocks.forEach(e => {
        if (e && e.id) examMap.set(e.id, e);
      });
    }

    // 2. From institutionalMockExams global array (only matching this student)
    if (Array.isArray(institutionalMockExams)) {
      institutionalMockExams.forEach(e => {
        if (!e || !e.id) return;
        const eStudentId = e.studentId;
        const eEmail = (e as any).studentEmail?.trim().toLowerCase();
        const eName = (e.studentName || '').trim().toLowerCase();
        
        if (
          eStudentId === studentId ||
          (studentEmail && eEmail === studentEmail) ||
          (studentName && eName === studentName)
        ) {
          examMap.set(e.id, e);
        }
      });
    }

    return Array.from(examMap.values()).sort((a, b) => {
      const dateA = new Date(a.examDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.examDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [currentUser, studentsData, institutionalMockExams]);

  // Available publishers list for filter dropdown
  const availablePublishers = useMemo(() => {
    const set = new Set<string>();
    myStudentExams.forEach(e => {
      const pub = (e.createdByName || (e as any).publisher || '').trim();
      if (pub && pub !== 'Kurumsal Deneme Sınavı') {
        set.add(pub);
      }
    });
    return Array.from(set).sort();
  }, [myStudentExams]);

  // Filter & Search student exams
  const filteredStudentExams = useMemo(() => {
    return myStudentExams.filter(exam => {
      // Exam Type filter
      if (examTypeFilter !== 'ALL') {
        const typeMatch = (exam.examType || '').toLowerCase().includes(examTypeFilter.toLowerCase());
        if (!typeMatch) return false;
      }

      // Publisher filter
      if (publisherFilter !== 'ALL') {
        const pub = (exam.createdByName || (exam as any).publisher || '').trim();
        if (pub !== publisherFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (exam.examTitle || '').toLowerCase().includes(q);
        const matchType = (exam.examType || '').toLowerCase().includes(q);
        const matchDate = (exam.examDate || '').toLowerCase().includes(q);
        const matchPublisher = (exam.createdByName || (exam as any).publisher || '').toLowerCase().includes(q);
        if (!matchTitle && !matchType && !matchDate && !matchPublisher) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'score_desc') {
        return getMaxExamScore(b) - getMaxExamScore(a);
      }
      if (sortOrder === 'net_desc') {
        return getExamTotalNet(b) - getExamTotalNet(a);
      }
      const dateA = new Date(a.examDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.examDate || b.createdAt || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [myStudentExams, examTypeFilter, publisherFilter, searchQuery, sortOrder]);

  // Pagination calculations for student view
  const totalStudentPages = Math.ceil(filteredStudentExams.length / itemsPerPage) || 1;
  const safeStudentPage = Math.min(Math.max(1, currentPage), totalStudentPages);
  const paginatedStudentExams = filteredStudentExams.slice(
    (safeStudentPage - 1) * itemsPerPage,
    safeStudentPage * itemsPerPage
  );

  // Student summary metrics
  const studentMetrics = useMemo(() => {
    const total = myStudentExams.length;
    if (total === 0) {
      return { 
        total: 0, 
        latestExam: null, 
        maxScore: 0, 
        maxScoreTitle: '',
        bestClassRank: null, 
        bestInstRank: null,
        avgTotalNet: 0,
        netDelta: 0
      };
    }

    const latest = myStudentExams[0];
    const previous = myStudentExams.length > 1 ? myStudentExams[1] : null;
    
    let maxSc = 0;
    let maxScTitle = '';
    let bestCls: number | null = null;
    let bestInst: number | null = null;
    let totalNetsSum = 0;
    let validNetsCount = 0;

    myStudentExams.forEach(e => {
      const scores = [
        e.scores.tytScore || 0,
        e.scores.sayScore || 0,
        e.scores.eaScore || 0,
        e.scores.sozScore || 0
      ];
      const examMax = Math.max(...scores);
      if (examMax > maxSc) {
        maxSc = examMax;
        maxScTitle = e.examTitle || 'Kurumsal Deneme';
      }

      const clsRanks = [
        e.scores.tytClassRank,
        e.scores.sayClassRank,
        e.scores.eaClassRank,
        e.scores.sozClassRank
      ].filter((r): r is number => typeof r === 'number' && r > 0);

      clsRanks.forEach(r => {
        if (bestCls === null || r < bestCls) bestCls = r;
      });

      const instRanks = [
        e.scores.tytInstitutionRank,
        e.scores.sayInstitutionRank,
        e.scores.eaInstitutionRank,
        e.scores.sozInstitutionRank
      ].filter((r): r is number => typeof r === 'number' && r > 0);

      instRanks.forEach(r => {
        if (bestInst === null || r < bestInst) bestInst = r;
      });

      const eNet = getExamTotalNet(e);
      if (eNet > 0) {
        totalNetsSum += eNet;
        validNetsCount++;
      }
    });

    const avgNet = validNetsCount > 0 ? Math.round((totalNetsSum / validNetsCount) * 10) / 10 : 0;
    const latestNet = getExamTotalNet(latest);
    const previousNet = previous ? getExamTotalNet(previous) : 0;
    const netDelta = previous ? Math.round((latestNet - previousNet) * 10) / 10 : 0;

    return {
      total,
      latestExam: latest,
      maxScore: maxSc,
      maxScoreTitle: maxScTitle,
      bestClassRank: bestCls,
      bestInstRank: bestInst,
      avgTotalNet: avgNet,
      netDelta
    };
  }, [myStudentExams]);

  // Chronological data for Recharts Trend Chart
  const trendChartData = useMemo(() => {
    if (myStudentExams.length === 0) return [];
    
    // Sort oldest to newest
    const sortedChronological = [...myStudentExams].sort((a, b) => {
      const dateA = new Date(a.examDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.examDate || b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    return sortedChronological.map(exam => {
      const dateInfo = formatMockDate(exam.examDate);
      const isTyt = (exam.examType || '').toUpperCase().includes('TYT');
      const isAyt = (exam.examType || '').toUpperCase().includes('AYT');
      const tytNet = exam.scores.tytScore ? getExamTotalNet(exam) : (isTyt ? getExamTotalNet(exam) : 0);
      const aytNet = (exam.scores.sayScore || exam.scores.eaScore || exam.scores.sozScore || isAyt) ? getExamTotalNet(exam) : 0;
      const maxScore = getMaxExamScore(exam);

      return {
        name: exam.examTitle.length > 18 ? exam.examTitle.substring(0, 16) + '..' : exam.examTitle,
        fullTitle: exam.examTitle,
        date: dateInfo.short,
        type: exam.examType || 'Kurumsal',
        totalNet: getExamTotalNet(exam),
        tytNet: tytNet > 0 ? tytNet : undefined,
        aytNet: aytNet > 0 ? aytNet : undefined,
        maxScore: maxScore > 0 ? maxScore : undefined
      };
    });
  }, [myStudentExams]);

  // ── ADMIN VIEW EXAMS ──
  const examsToUse = useMemo(() => {
    const examMap = new Map<string, InstitutionalMockExam>();
    
    if (Array.isArray(institutionalMockExams)) {
      institutionalMockExams.forEach(exam => {
        if (exam && exam.id) {
          examMap.set(exam.id, exam);
        }
      });
    }

    if (studentsData) {
      Object.entries(studentsData).forEach(([studentId, val]) => {
        const studentState = val as YKSDataState;
        if (studentState && studentState.institutionalMocks) {
          studentState.institutionalMocks.forEach(exam => {
            if (exam && exam.id) {
              const enrichedExam = {
                ...exam,
                studentId: exam.studentId || studentId,
                studentName: exam.studentName || studentState.profile?.name || ''
              };
              examMap.set(exam.id, enrichedExam);
            }
          });
        }
      });
    }

    return Array.from(examMap.values()).sort((a, b) => {
      const dateA = new Date(a.createdAt || a.examDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.examDate || 0).getTime();
      return dateB - dateA;
    });
  }, [institutionalMockExams, studentsData]);

  const studentUsers = useMemo(() => {
    return users.filter(u => u.role === 'student');
  }, [users]);

  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    classes.forEach(c => { if (c.name) classSet.add(c.name); });
    studentUsers.forEach(u => {
      if (u.className) classSet.add(u.className);
      const profClass = studentsData[u.id]?.profile?.className;
      if (profClass) classSet.add(profClass);
    });
    return Array.from(classSet).sort();
  }, [classes, studentUsers, studentsData]);

  const handleSaveSeries = (oldTitle: string, newTitle: string, newDate: string) => {
    const matching = examsToUse.filter(e => e.examTitle === oldTitle);
    matching.forEach(e => {
      if (onUpdateInstitutionalExam) {
        onUpdateInstitutionalExam({
          ...e,
          examTitle: newTitle,
          examDate: newDate
        });
      }
    });
  };

  const handleDeleteSeries = (titleToDelete: string) => {
    const matching = examsToUse.filter(e => e.examTitle === titleToDelete);
    const matchingIds = matching.map(e => e.id);
    if (matchingIds.length > 0 && onDeleteInstitutionalExam) {
      onDeleteInstitutionalExam(matchingIds);
    }
  };

  // ── RENDER STUDENT DETAIL KARNE VIEW ──
  if (isStudent && selectedInstitutionalExam) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4 animate-fade-in">
        <MockInstitutionalDetailView
          selectedInstitutionalExam={selectedInstitutionalExam}
          setSelectedInstitutionalExam={setSelectedInstitutionalExam}
          allInstitutionalExams={myStudentExams}
        />
      </div>
    );
  }

  // ── RENDER STUDENT PERSONAL REPORT CARDS VIEW ──
  if (isStudent) {
    return (
      <div className="space-y-6 text-slate-100 max-w-7xl mx-auto px-3 sm:px-6 py-6 animate-fade-in">
        
        {/* Top Header Banner with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/80 border border-white/10 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center space-x-4">
              {onToggleMenu && (
                <button
                  onClick={onToggleMenu}
                  className="lg:hidden p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
                  aria-label="Menüyü Aç"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 shadow-xl shadow-emerald-950/50">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Kurumsal Deneme Karnelerim
                  </h1>
                  <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    {myStudentExams.length} Sınav Kaydı
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
                  Okulunuz tarafından uygulanan resmi kurumsal sınav sonuçları, ders netleriniz ve kazanım analizleriniz
                </p>
              </div>
            </div>

            {/* Quick Action: Trend Chart Toggle */}
            {myStudentExams.length > 0 && (
              <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTrendChart(prev => !prev)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-lg ${
                    showTrendChart
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/40 border border-emerald-400/30'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 hover:border-white/20'
                  }`}
                >
                  <LineChartIcon className="w-4 h-4 text-emerald-400" />
                  <span>{showTrendChart ? 'Gelişim Grafiğini Gizle' : 'Net Gelişim Grafiği'}</span>
                  {showTrendChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Collapsible Interactive Trend Chart Banner */}
          {showTrendChart && trendChartData.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Tüm Kurumsal Sınavlar Net & Puan Değişim Eğrisi
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {trendChartData.length} Deneme Karşılaştırılıyor
                </span>
              </div>
              <div className="h-56 w-full font-mono text-[11px] bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs font-sans space-y-1.5 min-w-[200px]">
                              <p className="font-extrabold text-white">{data.fullTitle}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{data.date} • {data.type}</p>
                              <div className="pt-1.5 border-t border-slate-800 space-y-1 font-mono text-[11px]">
                                {data.totalNet !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-emerald-400 font-bold">Toplam Net:</span>
                                    <span className="font-extrabold text-white">{data.totalNet}</span>
                                  </div>
                                )}
                                {data.maxScore !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-indigo-400 font-bold">En Yüksek Puan:</span>
                                    <span className="font-extrabold text-white">{data.maxScore}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <RechartsLegend 
                      verticalAlign="bottom" 
                      height={24}
                      formatter={(val) => <span className="text-[10px] font-bold text-slate-300 font-sans">{val === 'totalNet' ? 'Toplam Net' : 'Puan'}</span>}
                    />
                    <Area type="monotone" dataKey="totalNet" name="totalNet" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#netGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* 5'li Modern KPI İstatistik Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Toplam Karne */}
          <div className="bg-slate-900/80 border border-white/5 hover:border-emerald-500/30 rounded-3xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Karne</span>
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white font-mono">{studentMetrics.total}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Sisteme kayıtlı sınav</p>
            </div>
          </div>

          {/* 2. Son Deneme */}
          <div className="bg-slate-900/80 border border-white/5 hover:border-indigo-500/30 rounded-3xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-all col-span-2 sm:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Son Sınav</span>
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 min-w-0">
              <div className="text-sm font-black text-white truncate">
                {studentMetrics.latestExam ? studentMetrics.latestExam.examTitle : 'Kayıt Yok'}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                <span>{studentMetrics.latestExam ? formatMockDate(studentMetrics.latestExam.examDate).short : '-'}</span>
                {studentMetrics.netDelta !== 0 && (
                  <span className={`font-bold flex items-center gap-0.5 ${studentMetrics.netDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {studentMetrics.netDelta > 0 ? '+' : ''}{studentMetrics.netDelta} Net
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Puan Rekoru / Zirvesi */}
          <div className="bg-slate-900/80 border border-white/5 hover:border-amber-500/30 rounded-3xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Yüksek Puan</span>
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-300 font-mono">
                {studentMetrics.maxScore > 0 ? studentMetrics.maxScore : '-'}
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5" title={studentMetrics.maxScoreTitle}>
                {studentMetrics.maxScoreTitle || 'Henüz puan yok'}
              </p>
            </div>
          </div>

          {/* 4. En İyi Derece */}
          <div className="bg-slate-900/80 border border-white/5 hover:border-purple-500/30 rounded-3xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En İyi Derece</span>
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 shrink-0">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-black text-purple-300 font-mono">
                {studentMetrics.bestClassRank !== null 
                  ? `Snf: #${studentMetrics.bestClassRank}` 
                  : studentMetrics.bestInstRank !== null 
                    ? `Kurum: #${studentMetrics.bestInstRank}` 
                    : '-'}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {studentMetrics.bestClassRank === 1 ? '🥇 Sınıf Birinciliği' : 'Kişisel en iyi sıralama'}
              </p>
            </div>
          </div>

          {/* 5. Net Ortalaması */}
          <div className="bg-slate-900/80 border border-white/5 hover:border-teal-500/30 rounded-3xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Ortalaması</span>
              <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-teal-300 font-mono">
                {studentMetrics.avgTotalNet > 0 ? studentMetrics.avgTotalNet : '-'}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Tüm sınavlar genel ortalaması</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar with View Mode Toggle */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-xl">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kurumsal sınav adı, yayın veya tarih ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Exam Type Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              {['ALL', 'TYT', 'AYT', 'KDS'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setExamTypeFilter(type);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    examTypeFilter === type
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {type === 'ALL' ? 'Tümü' : type}
                </button>
              ))}
            </div>

            {/* Publisher Filter if available */}
            {availablePublishers.length > 1 && (
              <select
                value={publisherFilter}
                onChange={(e) => {
                  setPublisherFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">Tüm Yayınlar</option>
                {availablePublishers.map(pub => (
                  <option key={pub} value={pub}>{pub}</option>
                ))}
              </select>
            )}

            {/* Sort Order Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="desc">Yeniden Eskiye</option>
              <option value="asc">Eskiden Yeniye</option>
              <option value="score_desc">Puana Göre (En Yüksek)</option>
              <option value="net_desc">Nete Göre (En Yüksek)</option>
            </select>

            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Kart / Vitrin Görünümü"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Kompakt Tablo Görünümü"
              >
                <ListFilter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Exams Content Area */}
        {filteredStudentExams.length === 0 ? (
          <div className="text-center py-20 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Kayıtlı Kurumsal Deneme Bulunamadı</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              {searchQuery || examTypeFilter !== 'ALL' || publisherFilter !== 'ALL'
                ? 'Seçilen filtre ve arama kriterlerine uygun kurumsal deneme karnesi bulunamadı. Filtreleri temizleyerek tekrar deneyebilirsiniz.'
                : 'Okulunuz tarafından adınıza yüklenmiş kurumsal deneme sınav karnesi henüz bulunmuyor. Yeni sınav sonuçları sisteme aktarıldığında otomatik olarak burada listelenecektir.'}
            </p>
            {(searchQuery || examTypeFilter !== 'ALL' || publisherFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setExamTypeFilter('ALL');
                  setPublisherFilter('ALL');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ─── 🎨 MODERN GRID CARDS VIEW ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedStudentExams.map((exam) => {
              const dateInfo = formatMockDate(exam.examDate);
              const totalNet = getExamTotalNet(exam);
              const maxScore = getMaxExamScore(exam);
              const isAyt = (exam.examType || '').toUpperCase().includes('AYT');
              
              // Score breakdown items
              const scoreChips: Array<{ label: string; score: number; color: string }> = [];
              if (exam.scores.tytScore) scoreChips.push({ label: 'TYT', score: exam.scores.tytScore, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' });
              if (exam.scores.sayScore) scoreChips.push({ label: 'SAY', score: exam.scores.sayScore, color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' });
              if (exam.scores.eaScore) scoreChips.push({ label: 'EA', score: exam.scores.eaScore, color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' });
              if (exam.scores.sozScore) scoreChips.push({ label: 'SÖZ', score: exam.scores.sozScore, color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' });

              // Best rank available in this exam
              const classRank = exam.scores.tytClassRank || exam.scores.sayClassRank || exam.scores.eaClassRank || exam.scores.sozClassRank;
              const classTotal = exam.scores.tytClassTotal || exam.scores.sayClassTotal || exam.scores.eaClassTotal || exam.scores.classParticipantCount;
              
              const instRank = exam.scores.tytInstitutionRank || exam.scores.sayInstitutionRank || exam.scores.eaInstitutionRank || exam.scores.sozInstitutionRank;
              const instTotal = exam.scores.tytInstitutionTotal || exam.scores.sayInstitutionTotal || exam.scores.eaInstitutionTotal || exam.scores.institutionParticipantCount;

              const genRank = exam.scores.tytGeneralRank || exam.scores.sayGeneralRank || exam.scores.eaGeneralRank || exam.scores.sozGeneralRank;

              return (
                <div 
                  key={exam.id}
                  className="bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 rounded-3xl p-5 shadow-xl hover:shadow-2xl hover:shadow-emerald-950/30 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden backdrop-blur-md hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 group-hover:bg-emerald-500/10 rounded-full blur-2xl transition-all pointer-events-none" />

                  {/* Card Header: Type Badge, Publisher & Date */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-xl border uppercase tracking-wider ${
                        isAyt 
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {exam.examType || 'Kurumsal'}
                      </span>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{dateInfo.short}</span>
                      </div>
                    </div>

                    {/* Exam Title & Publisher */}
                    <div>
                      <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                        {exam.examTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{exam.createdByName || (exam as any).publisher || 'Kurumsal Deneme Sınavı'}</span>
                      </p>
                    </div>

                    {/* Scores Strip */}
                    {scoreChips.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {scoreChips.map((sc, idx) => (
                          <div 
                            key={idx} 
                            className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 ${sc.color}`}
                          >
                            <span>{sc.label}:</span>
                            <span className="text-white font-extrabold">{sc.score} Puan</span>
                          </div>
                        ))}
                      </div>
                    ) : totalNet > 0 ? (
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-emerald-400 flex items-center justify-between">
                        <span>Toplam Net:</span>
                        <span className="text-white text-sm">{totalNet} Net</span>
                      </div>
                    ) : null}

                    {/* Rank Badges: Class / Institution / General */}
                    {(classRank || instRank || genRank) && (
                      <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800/80 grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Sınıf</span>
                          <span className="font-extrabold text-emerald-400">
                            {classRank ? `#${classRank}${classTotal ? `/${classTotal}` : ''}` : '-'}
                          </span>
                        </div>
                        <div className="space-y-0.5 border-x border-slate-800 px-1">
                          <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Kurum</span>
                          <span className="font-extrabold text-indigo-300">
                            {instRank ? `#${instRank}${instTotal ? `/${instTotal}` : ''}` : '-'}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Genel</span>
                          <span className="font-extrabold text-amber-300">
                            {genRank ? `#${genRank.toLocaleString('tr-TR')}` : '-'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA Action: Karneyi İncele */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setSelectedInstitutionalExam(exam)}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50 group-hover:scale-[1.02]"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Karneyi İncele</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── 📊 MODERN PRO TABLE VIEW ─── */
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                  <th className="p-4">Sınav & Yayın Bilgisi</th>
                  <th className="p-4">Tarih</th>
                  <th className="p-4">Tür</th>
                  <th className="p-4">Puanlar & Netler</th>
                  <th className="p-4">Dereceler (Snf / Kurum / Genel)</th>
                  <th className="p-4 text-center">Katılım</th>
                  <th className="p-4 text-right">Eylem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-slate-300">
                {paginatedStudentExams.map((exam) => {
                  const dateInfo = formatMockDate(exam.examDate);
                  const displayScores: Array<{ label: string; score: number; badgeColor: string }> = [];

                  if (exam.scores.tytScore) displayScores.push({ label: 'TYT', score: exam.scores.tytScore, badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' });
                  if (exam.scores.sayScore) displayScores.push({ label: 'SAY', score: exam.scores.sayScore, badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' });
                  if (exam.scores.eaScore) displayScores.push({ label: 'EA', score: exam.scores.eaScore, badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30' });
                  if (exam.scores.sozScore) displayScores.push({ label: 'SÖZ', score: exam.scores.sozScore, badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30' });

                  const classRank = exam.scores.tytClassRank || exam.scores.sayClassRank || exam.scores.eaClassRank || exam.scores.sozClassRank;
                  const instRank = exam.scores.tytInstitutionRank || exam.scores.sayInstitutionRank || exam.scores.eaInstitutionRank || exam.scores.sozInstitutionRank;
                  const genRank = exam.scores.tytGeneralRank || exam.scores.sayGeneralRank || exam.scores.eaGeneralRank || exam.scores.sozGeneralRank;

                  return (
                    <tr key={exam.id} className="hover:bg-slate-900/70 transition-colors group">
                      {/* Sınav Adı */}
                      <td className="p-4 font-extrabold text-white max-w-xs">
                        <div className="truncate group-hover:text-emerald-300 transition-colors text-sm">
                          {exam.examTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal font-sans mt-0.5 flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3 text-slate-500" />
                          <span>{exam.createdByName || (exam as any).publisher || 'Kurumsal Deneme Sınavı'}</span>
                        </div>
                      </td>

                      {/* Tarih */}
                      <td className="p-4 font-mono text-slate-300 whitespace-nowrap">
                        <span className="text-xs">{dateInfo.short}</span>
                      </td>

                      {/* Sınav Türü */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 uppercase">
                          {exam.examType || 'Kurumsal'}
                        </span>
                      </td>

                      {/* Puanlar */}
                      <td className="p-4">
                        {displayScores.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                            {displayScores.map((sc, sIdx) => (
                              <span key={sIdx} className={`px-2.5 py-0.5 rounded-lg border font-bold text-[11px] ${sc.badgeColor}`}>
                                {sc.label}: {sc.score} P
                              </span>
                            ))}
                          </div>
                        ) : getExamTotalNet(exam) > 0 ? (
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {getExamTotalNet(exam)} Net
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Puan Kaydı Yok</span>
                        )}
                      </td>

                      {/* Dereceler */}
                      <td className="p-4 whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          {classRank ? (
                            <span className="bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-emerald-400 font-bold" title="Sınıf Derecesi">
                              Snf: #{classRank}
                            </span>
                          ) : null}
                          {instRank ? (
                            <span className="bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-indigo-300 font-bold" title="Kurum Derecesi">
                              Kurum: #{instRank}
                            </span>
                          ) : null}
                          {genRank ? (
                            <span className="bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-amber-300 font-bold" title="Genel Sıralama">
                              Genel: #{genRank.toLocaleString('tr-TR')}
                            </span>
                          ) : null}
                          {!classRank && !instRank && !genRank && <span className="text-slate-500">-</span>}
                        </div>
                      </td>

                      {/* Katılımcı Sayısı */}
                      <td className="p-4 text-center whitespace-nowrap font-mono text-xs text-slate-400">
                        {exam.scores.classParticipantCount || exam.scores.institutionParticipantCount ? (
                          <span className="inline-flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                            <Users className="w-3 h-3 text-indigo-400" />
                            <span>{exam.scores.classParticipantCount || exam.scores.institutionParticipantCount} Öğr.</span>
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Eylem: Karneyi Görüntüle */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedInstitutionalExam(exam)}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-md shadow-emerald-950/40 hover:scale-[1.02]"
                        >
                          <GraduationCap className="w-4 h-4" />
                          <span>İncele</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalStudentPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 px-2">
            <p className="text-xs text-slate-400">
              Toplam <span className="font-bold text-white">{filteredStudentExams.length}</span> sınavdan{' '}
              <span className="font-bold text-white">{(safeStudentPage - 1) * itemsPerPage + 1}</span> -{' '}
              <span className="font-bold text-white">
                {Math.min(safeStudentPage * itemsPerPage, filteredStudentExams.length)}
              </span>{' '}
              arası gösteriliyor
            </p>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeStudentPage === 1}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    safeStudentPage === p
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalStudentPages, prev + 1))}
                disabled={safeStudentPage === totalStudentPages}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER ADMIN / SCHOOL COUNSELOR / TEACHER MANAGEMENT VIEW ──
  return (
    <div className="space-y-6 text-slate-100 max-w-7xl mx-auto px-4 py-6">
      {/* Active Modals */}
      {matchModalExam && (
        <MatchStudentModal
          exam={matchModalExam}
          studentUsers={studentUsers}
          availableClasses={availableClasses}
          onClose={() => setMatchModalExam(null)}
          onSaveMatch={(updatedExam) => {
            if (onUpdateInstitutionalExam) onUpdateInstitutionalExam(updatedExam);
            setMatchModalExam(null);
          }}
        />
      )}

      {editModalExam && (
        <EditExamModal
          exam={editModalExam}
          onClose={() => setEditModalExam(null)}
          onSaveEdit={(updatedExam) => {
            if (onUpdateInstitutionalExam) onUpdateInstitutionalExam(updatedExam);
            setEditModalExam(null);
          }}
        />
      )}

      {deleteConfirmExam && (
        <DeleteConfirmModal
          exam={deleteConfirmExam}
          onClose={() => setDeleteConfirmExam(null)}
          onConfirmDelete={(examId) => {
            if (onDeleteInstitutionalExam) onDeleteInstitutionalExam(examId);
            setDeleteConfirmExam(null);
          }}
        />
      )}

      {showDeleteAllConfirm && (
        <DeleteAllExamsModal
          totalExamsCount={examsToUse.length}
          onClose={() => setShowDeleteAllConfirm(false)}
          onConfirmDeleteAll={() => {
            if (onDeleteAllInstitutionalExams) onDeleteAllInstitutionalExams();
            setShowDeleteAllConfirm(false);
          }}
        />
      )}

      {editingSeriesExam && (
        <EditSeriesModal
          examTitle={editingSeriesExam.examTitle}
          latestDate={editingSeriesExam.latestDate}
          count={editingSeriesExam.count}
          onClose={() => setEditingSeriesExam(null)}
          onSaveSeries={handleSaveSeries}
          onDeleteSeries={handleDeleteSeries}
        />
      )}

      {showClassMappingModal && (
        <ClassMappingModal
          classMappings={classMappings}
          availableClasses={availableClasses}
          onClose={() => setShowClassMappingModal(false)}
          onSaveMappings={(newMappings) => setClassMappings(newMappings)}
        />
      )}

      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center space-x-3">
          {onToggleMenu && (
            <button
              onClick={onToggleMenu}
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
              aria-label="Menüyü Aç"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Kurumsal Deneme Takip</span>
            </h1>
            <p className="text-xs text-slate-400">Kurumsal deneme sınavları analiz ve raporlama portalı</p>
          </div>
        </div>
      </div>

      <BulkImportHistoryTab
        examsToUse={examsToUse}
        studentUsers={studentUsers}
        availableClasses={availableClasses}
        studentsData={studentsData}
        onUpdateInstitutionalExam={onUpdateInstitutionalExam}
        onDeleteInstitutionalExam={onDeleteInstitutionalExam}
        onDeleteAllInstitutionalExams={onDeleteAllInstitutionalExams}
        setMatchModalExam={setMatchModalExam}
        setEditModalExam={setEditModalExam}
        setDeleteConfirmExam={setDeleteConfirmExam}
        setEditingSeriesExam={setEditingSeriesExam}
        setShowClassMappingModal={setShowClassMappingModal}
        setShowDeleteAllConfirm={setShowDeleteAllConfirm}
      />
    </div>
  );
};

