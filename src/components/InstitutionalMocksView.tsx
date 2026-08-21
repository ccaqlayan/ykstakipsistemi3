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
  Sparkles,
  Filter,
  Eye,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
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
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
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

  // Filter & Search student exams
  const filteredStudentExams = useMemo(() => {
    return myStudentExams.filter(exam => {
      // Exam Type filter
      if (examTypeFilter !== 'ALL') {
        const typeMatch = (exam.examType || '').toLowerCase().includes(examTypeFilter.toLowerCase());
        if (!typeMatch) return false;
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
      const dateA = new Date(a.examDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.examDate || b.createdAt || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [myStudentExams, examTypeFilter, searchQuery, sortOrder]);

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
      return { total: 0, latestExam: null, maxScore: 0, bestClassRank: null, bestInstRank: null };
    }

    const latest = myStudentExams[0];
    let maxSc = 0;
    let bestCls: number | null = null;
    let bestInst: number | null = null;

    myStudentExams.forEach(e => {
      const scores = [
        e.scores.tytScore || 0,
        e.scores.sayScore || 0,
        e.scores.eaScore || 0,
        e.scores.sozScore || 0
      ];
      const examMax = Math.max(...scores);
      if (examMax > maxSc) maxSc = examMax;

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
    });

    return {
      total,
      latestExam: latest,
      maxScore: maxSc,
      bestClassRank: bestCls,
      bestInstRank: bestInst
    };
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
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
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
      <div className="space-y-6 text-slate-100 max-w-7xl mx-auto px-4 py-6 animate-fade-in">
        {/* Top Header */}
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
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 shadow-lg shadow-emerald-950/40">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Kurumsal Deneme Karnelerim</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {myStudentExams.length} Karne
                </span>
              </h1>
              <p className="text-xs text-slate-400">Okulunuz tarafından uygulanan ve sisteme aktarılan kurumsal deneme sonuç karneleriniz</p>
            </div>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Toplam Kurumsal Deneme */}
          <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Toplam Karne</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">{studentMetrics.total} <span className="text-xs font-normal text-slate-400">Sınav</span></div>
            </div>
          </div>

          {/* 2. Son Deneme */}
          <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Son Deneme</div>
              <div className="text-xs font-extrabold text-white truncate mt-0.5">
                {studentMetrics.latestExam ? studentMetrics.latestExam.examTitle : 'Kayıt Yok'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {studentMetrics.latestExam ? formatMockDate(studentMetrics.latestExam.examDate).short : '-'}
              </div>
            </div>
          </div>

          {/* 3. En Yüksek Puan */}
          <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">En Yüksek Puan</div>
              <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                {studentMetrics.maxScore > 0 ? `${studentMetrics.maxScore}` : '-'}
              </div>
            </div>
          </div>

          {/* 4. En İyi Derece */}
          <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">En İyi Derece</div>
              <div className="text-sm font-extrabold text-purple-300 font-mono mt-0.5">
                {studentMetrics.bestClassRank !== null 
                  ? `Sınıf: #${studentMetrics.bestClassRank}` 
                  : studentMetrics.bestInstRank !== null 
                    ? `Kurum: #${studentMetrics.bestInstRank}` 
                    : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kurumsal sınav veya yayın adı ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Exam Type Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['ALL', 'TYT', 'AYT', 'KDS'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setExamTypeFilter(type);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    examTypeFilter === type
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {type === 'ALL' ? 'Tümü' : type}
                </button>
              ))}
            </div>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="desc">Yeniden Eskiye</option>
              <option value="asc">Eskiden Yeniye</option>
            </select>
          </div>
        </div>

        {/* Exams List Table */}
        {filteredStudentExams.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500 shadow-inner">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-white">Kayıtlı Kurumsal Deneme Bulunamadı</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {searchQuery || examTypeFilter !== 'ALL'
                ? 'Arama kriterlerinize uygun kurumsal deneme karnesi bulunamadı. Filtreleri temizleyebilirsiniz.'
                : 'Okulunuz tarafından adınıza yüklenmiş kurumsal deneme sınav karnesi henüz bulunmuyor. Yeni sınav sonuçları yüklendiğinde otomatik olarak burada listelenecektir.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xl hidden md:block">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                    <th className="p-3.5">Sınav Adı</th>
                    <th className="p-3.5">Tarih</th>
                    <th className="p-3.5">Tür</th>
                    <th className="p-3.5">Puan & Dereceler (Snf / Kurum / Genel)</th>
                    <th className="p-3.5 text-center">Katılımcı</th>
                    <th className="p-3.5 text-right">Eylem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-slate-300">
                  {paginatedStudentExams.map((exam) => {
                    const dateInfo = formatMockDate(exam.examDate);
                    const displayScores: Array<{ 
                      label: string; 
                      score: number; 
                      classRank?: number; 
                      classTotal?: number; 
                      instRank?: number; 
                      instTotal?: number; 
                      genRank?: number; 
                      genTotal?: number; 
                      badgeColor: string 
                    }> = [];

                    if (exam.scores.tytScore !== undefined && exam.scores.tytScore > 0) {
                      displayScores.push({
                        label: 'TYT',
                        score: exam.scores.tytScore,
                        classRank: exam.scores.tytClassRank,
                        classTotal: exam.scores.tytClassTotal || exam.scores.classParticipantCount,
                        instRank: exam.scores.tytInstitutionRank,
                        instTotal: exam.scores.tytInstitutionTotal || exam.scores.institutionParticipantCount,
                        genRank: exam.scores.tytGeneralRank,
                        genTotal: exam.scores.tytGeneralTotal || exam.scores.generalParticipantCount,
                        badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      });
                    }
                    if (exam.scores.sayScore !== undefined && exam.scores.sayScore > 0) {
                      displayScores.push({
                        label: 'SAY',
                        score: exam.scores.sayScore,
                        classRank: exam.scores.sayClassRank,
                        classTotal: exam.scores.sayClassTotal || exam.scores.classParticipantCount,
                        instRank: exam.scores.sayInstitutionRank,
                        instTotal: exam.scores.sayInstitutionTotal || exam.scores.institutionParticipantCount,
                        genRank: exam.scores.sayGeneralRank,
                        genTotal: exam.scores.sayGeneralTotal || exam.scores.generalParticipantCount,
                        badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      });
                    }
                    if (exam.scores.eaScore !== undefined && exam.scores.eaScore > 0) {
                      displayScores.push({
                        label: 'EA',
                        score: exam.scores.eaScore,
                        classRank: exam.scores.eaClassRank,
                        classTotal: exam.scores.eaClassTotal || exam.scores.classParticipantCount,
                        instRank: exam.scores.eaInstitutionRank,
                        instTotal: exam.scores.eaInstitutionTotal || exam.scores.institutionParticipantCount,
                        genRank: exam.scores.eaGeneralRank,
                        genTotal: exam.scores.eaGeneralTotal || exam.scores.generalParticipantCount,
                        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      });
                    }
                    if (exam.scores.sozScore !== undefined && exam.scores.sozScore > 0) {
                      displayScores.push({
                        label: 'SÖZ',
                        score: exam.scores.sozScore,
                        classRank: exam.scores.sozClassRank,
                        classTotal: exam.scores.sozClassTotal || exam.scores.classParticipantCount,
                        instRank: exam.scores.sozInstitutionRank,
                        instTotal: exam.scores.sozInstitutionTotal || exam.scores.institutionParticipantCount,
                        genRank: exam.scores.sozGeneralRank,
                        genTotal: exam.scores.sozGeneralTotal || exam.scores.generalParticipantCount,
                        badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      });
                    }

                    return (
                      <tr key={exam.id} className="hover:bg-slate-900/60 transition-colors group">
                        {/* Sınav Adı */}
                        <td className="p-3.5 font-extrabold text-white max-w-xs">
                          <div className="truncate group-hover:text-emerald-300 transition-colors">
                            {exam.examTitle}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal font-sans mt-0.5">
                            {exam.createdByName || (exam as any).publisher || 'Kurumsal Deneme Sınavı'}
                          </div>
                        </td>

                        {/* Tarih */}
                        <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap">
                          <span className="text-xs">{dateInfo.short}</span>
                        </td>

                        {/* Sınav Türü */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 uppercase">
                            {exam.examType || 'Kurumsal'}
                          </span>
                        </td>

                        {/* Puan & Dereceler */}
                        <td className="p-3.5">
                          {displayScores.length === 0 ? (
                            <span className="text-slate-500 italic text-[11px]">Puan Kaydı Yok</span>
                          ) : (
                            <div className="space-y-1.5 font-mono text-[11px]">
                              {displayScores.map((sc, sIdx) => (
                                <div key={sIdx} className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-lg border font-bold text-[10px] ${sc.badgeColor}`}>
                                    {sc.label}
                                  </span>
                                  <strong className="text-white text-xs font-bold">{sc.score} Puan</strong>
                                  
                                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                                    {sc.classRank ? (
                                      <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-emerald-400 font-semibold" title="Sınıf Derecesi">
                                        Snf: #{sc.classRank}{sc.classTotal ? `/${sc.classTotal}` : ''}
                                      </span>
                                    ) : null}

                                    {sc.instRank ? (
                                      <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-indigo-300 font-semibold" title="Kurum Derecesi">
                                        Kurum: #{sc.instRank}{sc.instTotal ? `/${sc.instTotal}` : ''}
                                      </span>
                                    ) : null}

                                    {sc.genRank ? (
                                      <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-amber-300 font-semibold" title="Genel Sıralama">
                                        Genel: #{sc.genRank.toLocaleString('tr-TR')}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Katılımcı Sayısı */}
                        <td className="p-3.5 text-center whitespace-nowrap font-mono text-xs text-slate-400">
                          {exam.scores.classParticipantCount ? (
                            <span className="inline-flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                              <Users className="w-3 h-3 text-indigo-400" />
                              <span>{exam.scores.classParticipantCount} Öğr.</span>
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Eylem: Karneyi Görüntüle */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedInstitutionalExam(exam)}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-md shadow-emerald-950/40 hover:scale-[1.02]"
                          >
                            <GraduationCap className="w-4 h-4" />
                            <span>Karneyi İncele</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="space-y-3 md:hidden">
              {paginatedStudentExams.map((exam) => {
                const dateInfo = formatMockDate(exam.examDate);
                const displayScores: Array<{ label: string; score: number; classRank?: number; instRank?: number; genRank?: number }> = [];
                if (exam.scores.tytScore) displayScores.push({ label: 'TYT', score: exam.scores.tytScore, classRank: exam.scores.tytClassRank, instRank: exam.scores.tytInstitutionRank, genRank: exam.scores.tytGeneralRank });
                if (exam.scores.sayScore) displayScores.push({ label: 'SAY', score: exam.scores.sayScore, classRank: exam.scores.sayClassRank, instRank: exam.scores.sayInstitutionRank, genRank: exam.scores.sayGeneralRank });
                if (exam.scores.eaScore) displayScores.push({ label: 'EA', score: exam.scores.eaScore, classRank: exam.scores.eaClassRank, instRank: exam.scores.eaInstitutionRank, genRank: exam.scores.eaGeneralRank });
                if (exam.scores.sozScore) displayScores.push({ label: 'SÖZ', score: exam.scores.sozScore, classRank: exam.scores.sozClassRank, instRank: exam.scores.sozInstitutionRank, genRank: exam.scores.sozGeneralRank });

                return (
                  <div key={exam.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-white">{exam.examTitle}</h4>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{dateInfo.short} • {exam.examType || 'Kurumsal'}</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">
                        {exam.examType || 'Kurumsal'}
                      </span>
                    </div>

                    {/* Scores in Mobile */}
                    {displayScores.length > 0 && (
                      <div className="space-y-1.5 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 font-mono text-xs">
                        {displayScores.map((sc, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between">
                            <span className="font-bold text-white">{sc.label}: {sc.score} Puan</span>
                            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                              {sc.classRank ? <span className="text-emerald-400 font-bold">Snf:#{sc.classRank}</span> : null}
                              {sc.instRank ? <span className="text-indigo-300 font-bold">Kurum:#{sc.instRank}</span> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mobile Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedInstitutionalExam(exam)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-md"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Karneyi İncele</span>
                    </button>
                  </div>
                );
              })}
            </div>

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
