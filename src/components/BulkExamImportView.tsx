import React, { useState, useMemo, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  UserCheck, 
  TrendingUp, 
  Award, 
  BookOpen, 
  BarChart3, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Filter, 
  HelpCircle,
  Users,
  RefreshCw,
  FileText,
  Link,
  Edit3,
  Trash2,
  UserX,
  UserPlus,
  X,
  AlertCircle,
  Sliders,
  Plus,
  Settings,
  Menu
} from 'lucide-react';
import { UserAccount, InstitutionalMockExam, InstitutionalSubjectDetail, InstitutionalTopicDetail, YKSDataState, formatRankWithTotal } from '../types';

interface BulkExamImportViewProps {
  currentUser: UserAccount | null;
  users: UserAccount[];
  classes: any[];
  studentsData: Record<string, YKSDataState>;
  institutionalMockExams?: InstitutionalMockExam[];
  onSaveInstitutionalExams: (exams: InstitutionalMockExam[]) => void;
  onUpdateInstitutionalExam?: (exam: InstitutionalMockExam) => void;
  onDeleteInstitutionalExam?: (examId: string | string[]) => void;
  onDeleteAllInstitutionalExams?: () => Promise<void> | void;
  onAddAuditLog?: (description: string, category: any, actionType: string) => void;
  onToggleMenu?: () => void;
}

interface ParsedStudentRow {
  fileStudentName: string;
  fileSchoolNumber: string;
  fileClassName: string;
  matchedStudentId: string | null;
  selectedClassForMatch?: string; // Step 1: Selected class for filtering student dropdown
  matchScore: number; // 0 to 100
  matchReason: string;
  isSelected: boolean;
  sayScore: number;
  eaScore: number;
  sozScore: number;
  sayClassRank: number;
  sayClassTotal?: number;
  sayInstitutionRank: number;
  sayInstitutionTotal?: number;
  sayGeneralRank: number;
  sayGeneralTotal?: number;
  eaClassRank: number;
  eaClassTotal?: number;
  eaInstitutionRank: number;
  eaInstitutionTotal?: number;
  eaGeneralRank: number;
  eaGeneralTotal?: number;
  sozClassRank: number;
  sozClassTotal?: number;
  sozInstitutionRank: number;
  sozInstitutionTotal?: number;
  sozGeneralRank: number;
  sozGeneralTotal?: number;
  subjects: InstitutionalSubjectDetail[];
}

// Helper to format net numbers with 2 decimals and comma
const formatNet = (net: number | string | undefined | null): string => {
  if (net === undefined || net === null || net === '') return '0,00';
  const num = typeof net === 'string' ? parseFloat(net.replace(',', '.')) : Number(net);
  if (isNaN(num)) return '0,00';
  return num.toFixed(2).replace('.', ',');
};

// Helper to safely parse numeric values from CSV strings handling comma decimal separators
const parseNum = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  const str = String(val).replace(/['"]/g, '').replace(',', '.').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Process TYT subjects to group sub-tests and calculate summaries (TYT Sosyal, TYT Matematik, TYT Fen) without double counting
const processTytSubjects = (allSubjects: InstitutionalSubjectDetail[]) => {
  const norm = (str: string) => (str || '').toLowerCase().replace(/İ/g, 'i').replace(/I/g, 'ı').trim();

  // Exclude subjects that have topics (AYT subjects) or explicitly match AYT keywords
  const nonTopicSubjects = allSubjects.filter(s => {
    if (s.topics && s.topics.length > 0) return false;
    const name = norm(s.subjectName);
    if (name.includes('ayt') || name.includes('-2') || name.includes('edebiyat') || name.includes('sosyal-2') || name.includes('tarih-2') || name.includes('coğrafya-2') || name.includes('cografya-2') || name.includes('fizik-2') || name.includes('kimya-2') || name.includes('biyoloji-2')) return false;
    return true;
  });

  if (nonTopicSubjects.length === 0) {
    return { displayList: [], tytNet: 0, tytCorrect: 0, tytWrong: 0 };
  }

  const findSub = (keywords: string[], excludeKeywords: string[] = []) => {
    return nonTopicSubjects.find(s => {
      const name = norm(s.subjectName);
      const matchesKey = keywords.some(k => name.includes(k));
      const excluded = excludeKeywords.some(e => name.includes(e));
      return matchesKey && !excluded;
    });
  };

  const turkce = findSub(['türkçe', 'turkce', 'tyt türkçe']);

  // Sosyal sub-tests
  const tarih = findSub(['tarih-1', 'tarih'], ['tarih-2']);
  const cografya = findSub(['coğrafya-1', 'cografya-1', 'coğrafya', 'cografya'], ['coğrafya-2', 'cografya-2']);
  const felsefe = findSub(['felsefe']);
  const din = findSub(['din kül', 'din kültürü', 'din ahlak', 'din']);
  const tytSosyal = findSub(['tyt sosyal', 'sosyal bilimler', 'sosyal-1']) ||
    nonTopicSubjects.find(s => norm(s.subjectName) === 'sosyal');

  // Matematik sub-tests
  const mat1 = findSub(['matematik-1', 'mat-1', 'temel matematik'], ['geometri', 'matematik-2']);
  const geo = findSub(['geometri', 'geometri-1'], ['geometri-2']);
  const tytMat = findSub(['tyt matematik', 'matematik (toplam)']) ||
    nonTopicSubjects.find(s => (norm(s.subjectName) === 'matematik' || norm(s.subjectName) === 'temel matematik') && !norm(s.subjectName).includes('-2'));

  // Fen sub-tests
  const fizik = findSub(['fizik', 'fizik-1'], ['fizik-2']);
  const kimya = findSub(['kimya', 'kimya-1'], ['kimya-2']);
  const biyoloji = findSub(['biyoloji', 'biyoloji-1'], ['biyoloji-2']);
  const tytFen = findSub(['tyt fen', 'fen bilimleri']) ||
    nonTopicSubjects.find(s => norm(s.subjectName) === 'fen' && !norm(s.subjectName).includes('-2'));

  const usedSubjects = new Set<InstitutionalSubjectDetail>();
  [turkce, tarih, cografya, felsefe, din, tytSosyal, mat1, geo, tytMat, fizik, kimya, biyoloji, tytFen]
    .filter(Boolean)
    .forEach(s => usedSubjects.add(s!));

  const displayList: Array<InstitutionalSubjectDetail & { isSummary?: boolean }> = [];

  const calcNet = (s: InstitutionalSubjectDetail) =>
    s.net !== undefined ? s.net : Number(((s.correct || 0) - (s.wrong || 0) * 0.25).toFixed(2));

  // 1. Türkçe (Highlighted like TYT Sosyal)
  if (turkce) {
    const q = turkce.questionCount || 40;
    const c = turkce.correct || 0;
    const w = turkce.wrong || 0;
    const n = calcNet(turkce);
    const succ = q > 0 ? Math.round((Math.max(0, n) / q) * 100) : 0;
    displayList.push({
      ...turkce,
      subjectName: 'TYT Türkçe',
      questionCount: q,
      correct: c,
      wrong: w,
      net: n,
      successRate: succ,
      isSummary: true
    });
  }

  // 2. Sosyal Group
  const sosyalSubtests = [tarih, cografya, felsefe, din].filter(Boolean) as InstitutionalSubjectDetail[];
  sosyalSubtests.forEach(s => displayList.push({ ...s, net: calcNet(s), isSummary: false }));

  if (sosyalSubtests.length > 0 || tytSosyal) {
    if (tytSosyal && sosyalSubtests.length === 0) {
      displayList.push({
        ...tytSosyal,
        subjectName: 'TYT Sosyal',
        questionCount: tytSosyal.questionCount || 20,
        net: calcNet(tytSosyal),
        isSummary: true
      });
    } else if (sosyalSubtests.length > 0) {
      const q = tytSosyal?.questionCount || sosyalSubtests.reduce((a, b) => a + (b.questionCount || 0), 0) || 20;
      const c = tytSosyal?.correct ?? sosyalSubtests.reduce((a, b) => a + (b.correct || 0), 0);
      const w = tytSosyal?.wrong ?? sosyalSubtests.reduce((a, b) => a + (b.wrong || 0), 0);
      const n = tytSosyal ? calcNet(tytSosyal) : Number((c - w * 0.25).toFixed(2));
      const succ = q > 0 ? Math.round((Math.max(0, n) / q) * 100) : 0;

      displayList.push({
        subjectName: 'TYT Sosyal',
        questionCount: q,
        correct: c,
        wrong: w,
        net: n,
        successRate: succ,
        topics: [],
        isSummary: true
      });
    }
  }

  // 3. Matematik Group
  const matSubtests = [mat1, geo].filter(Boolean) as InstitutionalSubjectDetail[];
  matSubtests.forEach(s => displayList.push({ ...s, net: calcNet(s), isSummary: false }));

  if (matSubtests.length > 0 || tytMat) {
    if (tytMat && matSubtests.length === 0) {
      displayList.push({
        ...tytMat,
        subjectName: 'TYT Matematik',
        questionCount: 40,
        net: calcNet(tytMat),
        isSummary: true
      });
    } else if (matSubtests.length > 0) {
      const q = 40;
      const c = tytMat?.correct ?? matSubtests.reduce((a, b) => a + (b.correct || 0), 0);
      const w = tytMat?.wrong ?? matSubtests.reduce((a, b) => a + (b.wrong || 0), 0);
      const n = tytMat ? calcNet(tytMat) : Number((c - w * 0.25).toFixed(2));
      const succ = Math.round((Math.max(0, n) / q) * 100);

      displayList.push({
        subjectName: 'TYT Matematik',
        questionCount: 40,
        correct: c,
        wrong: w,
        net: n,
        successRate: succ,
        topics: [],
        isSummary: true
      });
    }
  }

  // 4. Fen Group
  const fenSubtests = [fizik, kimya, biyoloji].filter(Boolean) as InstitutionalSubjectDetail[];
  fenSubtests.forEach(s => displayList.push({ ...s, net: calcNet(s), isSummary: false }));

  if (fenSubtests.length > 0 || tytFen) {
    if (tytFen && fenSubtests.length === 0) {
      displayList.push({
        ...tytFen,
        subjectName: 'TYT Fen',
        questionCount: tytFen.questionCount || 20,
        net: calcNet(tytFen),
        isSummary: true
      });
    } else if (fenSubtests.length > 0) {
      const q = tytFen?.questionCount || fenSubtests.reduce((a, b) => a + (b.questionCount || 0), 0) || 20;
      const c = tytFen?.correct ?? fenSubtests.reduce((a, b) => a + (b.correct || 0), 0);
      const w = tytFen?.wrong ?? fenSubtests.reduce((a, b) => a + (b.wrong || 0), 0);
      const n = tytFen ? calcNet(tytFen) : Number((c - w * 0.25).toFixed(2));
      const succ = q > 0 ? Math.round((Math.max(0, n) / q) * 100) : 0;

      displayList.push({
        subjectName: 'TYT Fen',
        questionCount: q,
        correct: c,
        wrong: w,
        net: n,
        successRate: succ,
        topics: [],
        isSummary: true
      });
    }
  }

  // Any other non-topic subjects (filtering out duplicate summary names or AYT keywords)
  nonTopicSubjects.forEach(s => {
    if (!usedSubjects.has(s)) {
      const name = norm(s.subjectName);
      if (
        name.includes('tyt') ||
        name.includes('matematik') ||
        name.includes('fen') ||
        name.includes('sosyal') ||
        name.includes('türkçe') ||
        name.includes('turkce')
      ) {
        return;
      }
      displayList.push({ ...s, net: calcNet(s), isSummary: false });
    }
  });

  // Calculate strict tytNet without double counting:
  const netItems = displayList.filter(item => {
    if (!item.isSummary) return true;
    if (item.subjectName === 'TYT Sosyal' && sosyalSubtests.length > 0) return false;
    if (item.subjectName === 'TYT Matematik' && matSubtests.length > 0) return false;
    if (item.subjectName === 'TYT Fen' && fenSubtests.length > 0) return false;
    return true;
  });

  const tytNet = Number(netItems.reduce((acc, item) => acc + item.net, 0).toFixed(2));
  const tytCorrect = netItems.reduce((acc, item) => acc + (item.correct || 0), 0);
  const tytWrong = netItems.reduce((acc, item) => acc + (item.wrong || 0), 0);

  return { displayList, tytNet, tytCorrect, tytWrong };
};

const parseNumOpt = (val: any): number | undefined => {
  if (val === undefined || val === null || val === '') return undefined;
  const str = String(val).replace(/['"]/g, '').replace(',', '.').trim();
  const num = parseFloat(str);
  return isNaN(num) ? undefined : num;
};

// Sample CSV content generator for demo download
const generateSampleCSV = () => {
  const header = "Öğrenci Adı Soyadı;Okul No;Sınıf;SAY Puan;EA Puan;SÖZ Puan;SAY Sınıf Sıra;SAY Kurum Sıra;SAY Genel Sıra;Sınıf Katılım;Kurum Katılım;Genel Katılım;Ders Adı;Ders Soru Sayısı;Ders Doğru;Ders Yanlış;Ders Net;Ders Başarı %;Ders Sınıf Ort Net;Ders Kurum Ort Net;Ders Genel Ort Net;Konu Adı;Konu Soru Sayısı;Konu Doğru;Konu Yanlış;Konu Boş;Konu Başarı %\n";
  const rows = [
    "Ahmet Yılmaz;528;12-A SAY;445.20;380.10;320.00;1/9;3/30;142/91056;9;30;91056;Türkçe;40;34;5;32.75;81.8;28.5;26.2;24.1;Sözcükte Anlam;5;5;0;0;100",
    "Ahmet Yılmaz;528;12-A SAY;445.20;380.10;320.00;1/9;3/30;142/91056;9;30;91056;Türkçe;40;34;5;32.75;81.8;28.5;26.2;24.1;Paragrafta Ana Düşünce;15;12;2;1;80",
    "Ahmet Yılmaz;528;12-A SAY;445.20;380.10;320.00;1/9;3/30;142/91056;9;30;91056;Matematik;40;36;3;35.25;88.1;24.0;21.5;18.4;Fonksiyonlar;8;7;1;0;87.5",
    "Ahmet Yılmaz;528;12-A SAY;445.20;380.10;320.00;1/9;3/30;142/91056;9;30;91056;Matematik;40;36;3;35.25;88.1;24.0;21.5;18.4;Türev ve Uygulamaları;6;4;2;0;66.7",
    "Ayşe Demir;612;12-A SAY;420.80;395.40;340.50;2/9;5/30;280/91056;9;30;91056;Türkçe;40;36;3;35.25;88.1;28.5;26.2;24.1;Sözcükte Anlam;5;4;1;0;80",
    "Ayşe Demir;612;12-A SAY;420.80;395.40;340.50;2/9;5/30;280/91056;9;30;91056;Matematik;40;32;6;30.50;76.25;24.0;21.5;18.4;Fonksiyonlar;8;6;2;0;75",
    "Mehmet Kaya;415;12-B EA;360.50;425.80;390.20;1/12;2/30;195/91056;12;30;91056;Türkçe;40;38;2;37.50;93.75;28.5;26.2;24.1;Paragrafta Ana Düşünce;15;14;1;0;93.3",
    "Zeynep Şahin;703;12-B EA;310.20;378.60;360.10;3/12;8/30;510/91056;12;30;91056;Türkçe;40;30;8;28.00;70.0;28.5;26.2;24.1;Sözcükte Anlam;5;3;2;0;60"
  ];
  return header + rows.join("\n");
};

// --- MODAL COMPONENTS FOR MANAGING UNMATCHED / MATCHED EXAMS ---

interface MatchStudentModalProps {
  exam: InstitutionalMockExam;
  studentUsers: UserAccount[];
  availableClasses: string[];
  onClose: () => void;
  onSaveMatch: (updatedExam: InstitutionalMockExam) => void;
}

const MatchStudentModal: React.FC<MatchStudentModalProps> = ({
  exam,
  studentUsers,
  availableClasses,
  onClose,
  onSaveMatch
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [chosenId, setChosenId] = useState<string>(exam.studentId || '');

  const filteredStudents = useMemo(() => {
    return studentUsers.filter(s => {
      if (selectedClass !== 'all' && s.className !== selectedClass) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = (s.name || '').toLowerCase().includes(q);
        const matchesNo = (s.schoolNumber || '').includes(q);
        return matchesName || matchesNo;
      }
      return true;
    });
  }, [studentUsers, selectedClass, search]);

  const handleConfirm = () => {
    if (!chosenId) {
      onSaveMatch({
        ...exam,
        studentId: null as any
      });
      onClose();
      return;
    }
    const chosenStudent = studentUsers.find(s => s.id === chosenId);
    if (!chosenStudent) return;

    onSaveMatch({
      ...exam,
      studentId: chosenStudent.id,
      studentName: chosenStudent.name,
      className: chosenStudent.className || exam.className,
      schoolNumber: chosenStudent.schoolNumber || exam.schoolNumber
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Öğrenci Hesabı İle Eşleştir</h3>
              <p className="text-xs text-slate-400">Karneyi sisteme kayıtlı bir öğrenci hesabına bağlayın</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Exam Info */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-white/10 text-xs space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Karne Üzerindeki Bilgiler:</span>
          <div className="flex flex-wrap items-center gap-2 font-bold text-white text-sm">
            <span>{exam.studentName}</span>
            {exam.schoolNumber && <span className="text-indigo-400 font-mono text-xs">#{exam.schoolNumber}</span>}
            {exam.className && <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{exam.className}</span>}
          </div>
          <span className="text-slate-400 block text-[11px]">{exam.examTitle} ({exam.examDate})</span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Sınıf Filtresi</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tüm Sınıflar ({studentUsers.length})</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Öğrenci Ara</label>
            <input
              type="text"
              placeholder="İsim veya okul no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Student Accounts List */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-400">
            Sistemdeki Öğrenci Hesapları ({filteredStudents.length})
          </label>
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-white/10 rounded-xl p-2 bg-slate-950">
            {filteredStudents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Kriterlere uygun öğrenci hesabı bulunamadı.</p>
            ) : (
              filteredStudents.map(st => {
                const isSelected = chosenId === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setChosenId(prev => prev === st.id ? '' : st.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                        : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <span className="block font-semibold">{st.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {st.className || 'Sınıf Belirtilmemiş'} {st.schoolNumber ? `• #${st.schoolNumber}` : ''}
                        </span>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div>
            {exam.studentId && (
              <button
                type="button"
                onClick={() => {
                  onSaveMatch({
                    ...exam,
                    studentId: null as any
                  });
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center space-x-1"
              >
                <UserX className="w-4 h-4" />
                <span>Eşleşmeyi Kaldır</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
            >
              İptal
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Eşleştirmeyi Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EditExamModalProps {
  exam: InstitutionalMockExam;
  onClose: () => void;
  onSaveEdit: (updatedExam: InstitutionalMockExam) => void;
}

const EditExamModal: React.FC<EditExamModalProps> = ({
  exam,
  onClose,
  onSaveEdit
}) => {
  const [studentName, setStudentName] = useState(exam.studentName || '');
  const [schoolNumber, setSchoolNumber] = useState(exam.schoolNumber || '');
  const [className, setClassName] = useState(exam.className || '');
  const [examTitle, setExamTitle] = useState(exam.examTitle || '');
  const [examDate, setExamDate] = useState(exam.examDate || '');
  const [examType, setExamType] = useState(exam.examType || 'TYT');
  
  const [sayScore, setSayScore] = useState(exam.scores?.sayScore || 0);
  const [eaScore, setEaScore] = useState(exam.scores?.eaScore || 0);
  const [sozScore, setSozScore] = useState(exam.scores?.sozScore || 0);
  
  const [sayClassRank, setSayClassRank] = useState(exam.scores?.sayClassRank || 0);
  const [sayInstRank, setSayInstRank] = useState(exam.scores?.sayInstitutionRank || 0);
  const [sayGenRank, setSayGenRank] = useState(exam.scores?.sayGeneralRank || 0);

  const handleSave = () => {
    if (!studentName.trim() || !examTitle.trim()) {
      alert("Lütfen öğrenci adı ve deneme başlığını doldurun.");
      return;
    }

    onSaveEdit({
      ...exam,
      studentName: studentName.trim(),
      schoolNumber: schoolNumber.trim(),
      className: className.trim(),
      examTitle: examTitle.trim(),
      examDate,
      examType,
      scores: {
        ...exam.scores,
        sayScore: Number(sayScore) || 0,
        eaScore: Number(eaScore) || 0,
        sozScore: Number(sozScore) || 0,
        sayClassRank: Number(sayClassRank) || 0,
        sayInstitutionRank: Number(sayInstRank) || 0,
        sayGeneralRank: Number(sayGenRank) || 0
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Deneme Karnesini Düzenle</h3>
              <p className="text-xs text-slate-400">Karne ve öğrenci bilgilerini güncelleyin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Fields */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Öğrenci Bilgileri</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Öğrenci Adı Soyadı</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Okul No</label>
              <input
                type="text"
                value={schoolNumber}
                onChange={(e) => setSchoolNumber(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Sınıf</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Sınav Adı</label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Sınav Türü</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="TYT">TYT</option>
                <option value="AYT">AYT</option>
                <option value="Ara Sınıf">Ara Sınıf</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exam Scores & Ranks */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Puanlar & Dereceler</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">SAY Puanı</label>
              <input
                type="number"
                step="0.01"
                value={sayScore}
                onChange={(e) => setSayScore(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">EA Puanı</label>
              <input
                type="number"
                step="0.01"
                value={eaScore}
                onChange={(e) => setEaScore(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">SÖZ Puanı</label>
              <input
                type="number"
                step="0.01"
                value={sozScore}
                onChange={(e) => setSozScore(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Sınıf Sırası</label>
              <input
                type="number"
                value={sayClassRank}
                onChange={(e) => setSayClassRank(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Kurum Sırası</label>
              <input
                type="number"
                value={sayInstRank}
                onChange={(e) => setSayInstRank(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Genel Sıra</label>
              <input
                type="number"
                value={sayGenRank}
                onChange={(e) => setSayGenRank(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Değişiklikleri Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  exam: InstitutionalMockExam;
  onClose: () => void;
  onConfirmDelete: (examId: string) => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  exam,
  onClose,
  onConfirmDelete
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center space-x-3 text-rose-400 border-b border-white/10 pb-4">
          <div className="p-2.5 bg-rose-500/20 text-rose-400 font-black font-mono text-sm rounded-xl border border-rose-500/30">
            {step}/3
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sınav Karnesini Sil ({step}/3 Onay)</h3>
            <p className="text-xs text-rose-300">
              {step === 1 && '1. Aşama: İşlem Başlatılıyor'}
              {step === 2 && '2. Aşama: Dikkat ve Onay'}
              {step === 3 && '3. Aşama: Son Onay (Kalıcı Silme)'}
            </p>
          </div>
        </div>

        {step === 1 && (
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white font-bold">{exam.studentName}</strong> öğrencisine ait <strong className="text-amber-300 font-bold">{exam.examTitle}</strong> deneme sınavı sonucu silinecektir. Devam etmek istiyor musunuz?
          </p>
        )}

        {step === 2 && (
          <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-xs text-rose-200 leading-relaxed">
            <strong>DİKKAT (2/3):</strong> Bu karnedeki tüm netler, puanlar ve konu analiz verileri kalıcı olarak silinecektir. Silmek istediğinizden emin misiniz?
          </div>
        )}

        {step === 3 && (
          <div className="bg-rose-900/30 p-3 rounded-xl border border-rose-500/40 text-xs text-rose-300 font-bold leading-relaxed">
            <strong>SON ONAY (3/3):</strong> Karneyi silmek üzeresiniz. Bu işlem kesinlikle GERİ ALINAMAZ! Onaylıyor musunuz?
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            Vazgeç
          </button>
          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/30 transition-all flex items-center space-x-1.5"
            >
              <span>1. Onayı Ver ➔</span>
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-1.5"
            >
              <span>2. Onayı Ver ➔</span>
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(exam.id);
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-600 shadow-lg shadow-rose-700/40 transition-all flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>EVET, KALICI OLARAK SİL (3/3)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface DeleteAllExamsModalProps {
  onClose: () => void;
  onConfirmDeleteAll: () => void;
  totalExamsCount: number;
}

const DeleteAllExamsModal: React.FC<DeleteAllExamsModalProps> = ({
  onClose,
  onConfirmDeleteAll,
  totalExamsCount
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center space-x-3 text-rose-400 border-b border-white/10 pb-4">
          <div className="p-2.5 bg-rose-500/20 text-rose-400 font-black font-mono text-sm rounded-xl border border-rose-500/30">
            {step}/3
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Tüm Kurumsal Karneleri Sil</h3>
            <p className="text-xs text-rose-300">
              {step === 1 && '1. Aşama: Toplu Silme İşlemi Başlatılıyor'}
              {step === 2 && '2. Aşama: Kritik Uyarı ve Onay'}
              {step === 3 && '3. Aşama: Son Onay (Geri Alınamaz)'}
            </p>
          </div>
        </div>

        {step === 1 && (
          <p className="text-xs text-slate-300 leading-relaxed">
            Sistemdeki <strong className="text-white font-bold">{totalExamsCount} adet</strong> kurumsal deneme sınavı karnesinin tamamı silinecektir. En baştan başlamak istediğinize emin misiniz?
          </p>
        )}

        {step === 2 && (
          <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-xs text-rose-200 leading-relaxed">
            <strong>DİKKAT (2/3):</strong> Bu işlemle birlikte tüm öğrencilerin kurumsal denemelerdeki netleri, puanları, sıralama verileri ve konu analizleri kalıcı olarak temizlenecektir. Devam etmek istiyor musunuz?
          </div>
        )}

        {step === 3 && (
          <div className="bg-rose-900/30 p-3 rounded-xl border border-rose-500/40 text-xs text-rose-300 font-bold leading-relaxed">
            <strong>SON ONAY (3/3):</strong> Tüm kurumsal sınav karnelerini silmek üzeresiniz. Bu işlem veritabanında kesinlikle GERİ ALINAMAZ! Onaylıyor musunuz?
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            Vazgeç
          </button>
          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
            >
              Devam Et ➔
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md transition-all"
            >
              Kritik Onay Ver ➔
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={() => {
                onConfirmDeleteAll();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30 transition-all flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kalıcı Olarak Hepsini Sil</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface EditSeriesModalProps {
  examTitle: string;
  latestDate?: string;
  count: number;
  onClose: () => void;
  onSaveSeries: (oldTitle: string, newTitle: string, newDate: string) => void;
  onDeleteSeries: (titleToDelete: string) => void;
}

const EditSeriesModal: React.FC<EditSeriesModalProps> = ({
  examTitle,
  latestDate = '',
  count,
  onClose,
  onSaveSeries,
  onDeleteSeries
}) => {
  const [newTitle, setNewTitle] = useState(examTitle);
  const [newDate, setNewDate] = useState(latestDate);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2 | 3>(0);

  const handleSave = () => {
    if (!newTitle.trim()) {
      alert("Lütfen geçerli bir deneme başlığı girin.");
      return;
    }
    onSaveSeries(examTitle, newTitle.trim(), newDate);
    onClose();
  };

  const handleConfirmDeleteStep = () => {
    if (deleteStep === 0) setDeleteStep(1);
    else if (deleteStep === 1) setDeleteStep(2);
    else if (deleteStep === 2) setDeleteStep(3);
    else if (deleteStep === 3) {
      onDeleteSeries(examTitle);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Toplu Deneme Bilgilerini Düzenle</h3>
              <p className="text-xs text-amber-300">
                Bu deneme başlığı altındaki {count} adet öğrenci karnesi güncellenecektir
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {deleteStep === 0 ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Deneme Adı / Başlığı
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  placeholder="Deneme Sınavı Adı"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Sınav Tarihi
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5 text-xs text-slate-400 flex items-center justify-between">
                <span>Kayıtlı Karne Sayısı:</span>
                <span className="font-extrabold text-white font-mono bg-white/10 px-2 py-0.5 rounded">
                  {count} Öğrenci Karnesi
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDeleteStep(1)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Tüm Karneleri Sil ({count})</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tümünü Kaydet</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Toplu Karne Silme Onayı ({deleteStep}/3)</span>
              </div>

              {deleteStep === 1 && (
                <p className="text-xs text-slate-200 leading-relaxed">
                  <strong>1/3 ONAY:</strong> <strong className="text-amber-300">{examTitle}</strong> isimli sınavına ait <strong className="text-white">{count} ADET öğrenci karnesinin tamamı</strong> silinecektir. Devam etmek istiyor musunuz?
                </p>
              )}

              {deleteStep === 2 && (
                <p className="text-xs text-rose-200 leading-relaxed">
                  <strong>2/3 ONAY: DİKKAT!</strong> Bu deneme altında bulunan {count} öğrencinin tüm net, puan, sıra ve konu analizi verileri kalıcı olarak silinecektir. Emin misiniz?
                </p>
              )}

              {deleteStep === 3 && (
                <p className="text-xs text-rose-300 font-bold leading-relaxed">
                  <strong>3/3 ONAY (SON ONAY):</strong> Silme işlemini onaylıyor musunuz? Silinen {count} adet karne GERİ ALINAMAZ!
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
              >
                Vazgeç / İptal
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteStep}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-1.5"
              >
                {deleteStep === 3 ? (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>EVET, TÜM {count} KARNEYİ KALICI SİL (3/3)</span>
                  </>
                ) : (
                  <span>{deleteStep}. Onayı Ver ➔</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ClassMappingModalProps {
  classMappings: Record<string, string>;
  availableClasses: string[];
  onClose: () => void;
  onSaveMappings: (newMappings: Record<string, string>) => void;
}

const ClassMappingModal: React.FC<ClassMappingModalProps> = ({
  classMappings,
  availableClasses,
  onClose,
  onSaveMappings
}) => {
  const [localMappings, setLocalMappings] = useState<Record<string, string>>({ ...classMappings });
  const [sourceInput, setSourceInput] = useState('');
  const [targetSelect, setTargetSelect] = useState(availableClasses[0] || '');

  React.useEffect(() => {
    if (availableClasses.length > 0 && !targetSelect) {
      setTargetSelect(availableClasses[0]);
    }
  }, [availableClasses, targetSelect]);

  const handleAddRule = () => {
    const src = sourceInput.trim();
    if (!src) {
      alert("Lütfen dosyada geçen sınıf adını giriniz (Örn: 12-A).");
      return;
    }
    if (!targetSelect) {
      alert("Lütfen sistemdeki hedef sınıfı seçiniz.");
      return;
    }
    const updated = { ...localMappings, [src]: targetSelect };
    setLocalMappings(updated);
    setSourceInput('');
  };

  const handleDeleteRule = (keyToDelete: string) => {
    const updated = { ...localMappings };
    delete updated[keyToDelete];
    setLocalMappings(updated);
  };

  const handleConfirmSave = () => {
    onSaveMappings(localMappings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Otomatik Sınıf Eşleştirme Kuralları</span>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                  Otomatik Yönlendirme
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Okulizyon/Excel dosyalarında geçen sınıf adlarını sistemdeki sınıflarla eşleştirin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New Rule Form */}
        <div className="bg-slate-950 p-4 rounded-xl border border-white/10 space-y-3">
          <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
            Yeni Eşleştirme Kuralı Ekle
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Dosyadaki Sınıf Adı
              </label>
              <input
                type="text"
                placeholder="Örn: 12-A veya 12A"
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="sm:col-span-1 text-center hidden sm:block pb-2 text-slate-500 font-extrabold">
              ➔
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Sistemdeki Hedef Sınıf
              </label>
              <select
                value={targetSelect}
                onChange={(e) => setTargetSelect(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAddRule}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mappings Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Kayıtlı Eşleştirme Kuralları ({Object.keys(localMappings).length})</span>
            <span className="text-[10px] text-slate-500 font-normal">Gelecek tüm yüklemelerde otomatik uygulanır</span>
          </div>

          <div className="max-h-52 overflow-y-auto border border-white/10 rounded-xl bg-slate-950 p-2 space-y-1.5">
            {Object.keys(localMappings).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Henüz özel bir sınıf eşleştirme kuralı eklenmedi.
              </p>
            ) : (
              Object.entries(localMappings).map(([source, target]) => (
                <div
                  key={source}
                  className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 rounded bg-slate-800 text-amber-300 font-mono font-bold">
                      {source}
                    </span>
                    <span className="text-slate-500 font-extrabold">➔</span>
                    <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                      {target}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(source)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Kuralı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kuralları Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface DuplicateConfirmModalProps {
  examTitle: string;
  existingCount: number;
  onClose: () => void;
  onOverwrite: () => void;
}

const DuplicateConfirmModal: React.FC<DuplicateConfirmModalProps> = ({
  examTitle,
  existingCount,
  onClose,
  onOverwrite
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center space-x-3 text-amber-400 border-b border-white/10 pb-4">
          <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Mükerrer Deneme Sınavı Uyarısı</h3>
            <p className="text-xs text-amber-300">Aynı isimde sınav verisi zaten mevcut</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/20 space-y-1">
            <p className="text-slate-400">Aranan Deneme Adı:</p>
            <p className="text-sm font-black text-amber-300">{examTitle}</p>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
              Sistemdeki Mevcut Karne Sayısı: <strong className="text-white font-bold">{existingCount} adet</strong>
            </p>
          </div>

          <p>
            Bu deneme sınavı ismi daha önce sisteme kaydedilmiş. Eski kayıtları silip güncel verileri kaydetmek mi istersiniz, yoksa işlemi iptal mi etmek istersiniz?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all text-center"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onOverwrite}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-1.5 text-center"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eski Verileri Sil ve Yenisini Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const BulkExamImportView: React.FC<BulkExamImportViewProps> = ({
  currentUser,
  users,
  classes,
  studentsData,
  institutionalMockExams = [],
  onSaveInstitutionalExams,
  onUpdateInstitutionalExam,
  onDeleteInstitutionalExam,
  onDeleteAllInstitutionalExams,
  onAddAuditLog,
  onToggleMenu
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'reports'>('import');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Merge institutionalMockExams prop with any exams from studentsData to ensure "görünmeyen karne kalmasın" (no hidden report cards)
  const examsToUse = useMemo(() => {
    const examMap = new Map<string, InstitutionalMockExam>();
    
    // 1. Add all from the prop
    if (Array.isArray(institutionalMockExams)) {
      institutionalMockExams.forEach(exam => {
        if (exam && exam.id) {
          examMap.set(exam.id, exam);
        }
      });
    }

    // 2. Add all from studentsData (merging/overwriting or adding missing ones)
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

    // Convert back to sorted array
    return Array.from(examMap.values()).sort((a, b) => {
      const dateA = new Date(a.createdAt || a.examDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.examDate || 0).getTime();
      return dateB - dateA;
    });
  }, [institutionalMockExams, studentsData]);
  
  // File import state
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'Ara Sınıf'>('TYT');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  
  // Active class tab for filtering large student imports
  const [activeClassTab, setActiveClassTab] = useState<string>('all');

  // Filter state for Reports tab
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all'); // 'all' | 'TYT' | 'AYT' | 'Ara Sınıf'
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [matchFilter, setMatchFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [selectedExamRecordId, setSelectedExamRecordId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals for management of exam records
  const [matchModalExam, setMatchModalExam] = useState<InstitutionalMockExam | null>(null);
  const [editModalExam, setEditModalExam] = useState<InstitutionalMockExam | null>(null);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState<InstitutionalMockExam | null>(null);
  const [editingSeriesExam, setEditingSeriesExam] = useState<{
    examTitle: string;
    latestDate?: string;
    count: number;
  } | null>(null);

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
    if (selectedExamId === oldTitle) {
      setSelectedExamId(newTitle);
    }
  };

  const handleDeleteSeries = (titleToDelete: string) => {
    const matching = examsToUse.filter(e => e.examTitle === titleToDelete);
    const matchingIds = matching.map(e => e.id);
    if (matchingIds.length > 0 && onDeleteInstitutionalExam) {
      onDeleteInstitutionalExam(matchingIds);
    }
    if (selectedExamId === titleToDelete) {
      setSelectedExamId('all');
    }
    if (selectedExamRecordId && matchingIds.includes(selectedExamRecordId)) {
      setSelectedExamRecordId(null);
    }
  };

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

  const [showClassMappingModal, setShowClassMappingModal] = useState(false);

  // Duplicate warning modal state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    examTitle: string;
    existingExams: InstitutionalMockExam[];
    pendingRows: ParsedStudentRow[];
  } | null>(null);

  // Sync class mappings to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('yks_class_mappings', JSON.stringify(classMappings));
    } catch (e) {
      console.error("Error saving class mappings to localStorage", e);
    }
  }, [classMappings]);

  // Get list of all student accounts
  const studentUsers = useMemo(() => {
    return users.filter(u => u.role === 'student');
  }, [users]);

  // Helper to map class names based on saved classMappings rules (e.g. "12-A" -> "12-A SAY")
  const getMappedClassName = useCallback((clsName: string | undefined | null): string => {
    if (!clsName) return '';
    const trimmed = clsName.trim();
    if (!trimmed) return '';
    if (classMappings[trimmed]) return classMappings[trimmed];
    const norm = normalizeText(trimmed);
    const mappedEntry = Object.entries(classMappings).find(([k]) => normalizeText(k) === norm);
    if (mappedEntry && mappedEntry[1]) return String(mappedEntry[1]);
    return trimmed;
  }, [classMappings]);

  // List of all distinct class names registered in the system
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

  // Normalize string helper for fuzzy student matching
  const normalizeText = (str: string) => {
    return (str || '')
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');
  };

  // Smart class matching helper (e.g. "12-A" -> "12-A SAY")
  const findBestClassMatch = (fileClassName: string): string => {
    if (!fileClassName) return 'all';
    const trimmed = fileClassName.trim();
    const normFile = normalizeText(fileClassName);
    if (!normFile) return 'all';

    // 0. Check custom class mappings saved by user (e.g. "12-A" -> "12-A SAY")
    if (classMappings[trimmed]) return classMappings[trimmed];
    const mappedEntry = Object.entries(classMappings).find(([k]) => normalizeText(k) === normFile);
    if (mappedEntry && mappedEntry[1]) return String(mappedEntry[1]);

    // 1. Exact match
    const exact = availableClasses.find(c => normalizeText(c) === normFile);
    if (exact) return exact;

    // 2. Partial / Substring match (e.g. "12-A" matches "12-A (SAY)" or "12-A SAY")
    const partial = availableClasses.find(c => {
      const normC = normalizeText(c);
      return normC.includes(normFile) || normFile.includes(normC);
    });
    if (partial) return partial;

    return 'all';
  };

  // Helper to get students filtered by selected class
  const getStudentsForClass = (selectedClass?: string) => {
    if (!selectedClass || selectedClass === 'all') {
      return studentUsers;
    }
    return studentUsers.filter(st => {
      const stClass = st.className || studentsData[st.id]?.profile?.className || '';
      return getMappedClassName(stClass) === selectedClass || stClass === selectedClass;
    });
  };

  // Distinct classes detected from parsed file rows for top tabs
  const importedClassesTabs = useMemo(() => {
    const classSet = new Set<string>();
    parsedRows.forEach(r => {
      const fileCls = getMappedClassName(r.fileClassName);
      if (fileCls) classSet.add(fileCls);
      if (r.selectedClassForMatch && r.selectedClassForMatch !== 'all') {
        classSet.add(getMappedClassName(r.selectedClassForMatch));
      }
      if (r.matchedStudentId) {
        const u = studentUsers.find(st => st.id === r.matchedStudentId);
        const c = u?.className || studentsData[r.matchedStudentId]?.profile?.className;
        if (c) classSet.add(getMappedClassName(c));
      }
    });
    return Array.from(classSet).sort();
  }, [parsedRows, studentUsers, studentsData, getMappedClassName]);

  // Helper to check if a row matches the active class tab filter
  const isRowInActiveTabForCls = (row: ParsedStudentRow, targetCls: string) => {
    if (targetCls === 'all') return true;
    if (getMappedClassName(row.fileClassName) === targetCls) return true;
    if (getMappedClassName(row.selectedClassForMatch) === targetCls) return true;
    if (row.matchedStudentId) {
      const u = studentUsers.find(st => st.id === row.matchedStudentId);
      const c = u?.className || studentsData[row.matchedStudentId]?.profile?.className;
      if (getMappedClassName(c) === targetCls) return true;
    }
    return false;
  };

  // Match engine: compares file student row with registered students
  const findBestStudentMatch = (fileStudentName: string, fileSchoolNumber: string, fileClassName: string) => {
    const normFileName = normalizeText(fileStudentName);
    const normFileNum = (fileSchoolNumber || '').trim();
    const mappedClass = findBestClassMatch(fileClassName);
    const normFileClass = normalizeText(mappedClass !== 'all' ? mappedClass : fileClassName);

    let bestUser: UserAccount | null = null;
    let bestScore = 0;
    let reason = 'Eşleşme Bulunamadı';

    for (const student of studentUsers) {
      const studentProfile = studentsData[student.id]?.profile;
      const studentNum = (student.schoolNumber || studentProfile?.schoolNumber || '').trim();
      const normStudentName = normalizeText(student.name);
      const normStudentClass = normalizeText(student.className || studentProfile?.className || '');

      // Check 1: School Number exact match AND Name exact match
      if (normFileNum && studentNum && normFileNum === studentNum && normFileName === normStudentName) {
        return {
          studentId: student.id,
          score: 100,
          reason: 'Tam Eşleşme (Okul No + Ad Soyad)'
        };
      }

      // Check 2: School Number exact match
      if (normFileNum && studentNum && normFileNum === studentNum) {
        if (85 > bestScore) {
          bestScore = 90;
          bestUser = student;
          reason = `Okul No Eşleşti (#${studentNum})`;
        }
      }

      // Check 3: Name exact match + Class match
      if (normFileName === normStudentName && normFileClass && normStudentClass && normFileClass === normStudentClass) {
        if (95 > bestScore) {
          bestScore = 95;
          bestUser = student;
          reason = 'Ad Soyad + Sınıf Eşleşti';
        }
      }

      // Check 4: Name exact match
      if (normFileName === normStudentName) {
        if (80 > bestScore) {
          bestScore = 80;
          bestUser = student;
          reason = 'Ad Soyad Eşleşti';
        }
      }

      // Check 5: Partial Name match
      if (normFileName.length > 3 && (normStudentName.includes(normFileName) || normFileName.includes(normStudentName))) {
        if (65 > bestScore) {
          bestScore = 65;
          bestUser = student;
          reason = 'Benzer İsim Tahmini';
        }
      }
    }

    return {
      studentId: bestUser ? bestUser.id : null,
      score: bestScore,
      reason: bestUser ? reason : 'Eşleşme Bulunamadı'
    };
  };

  // Helper to parse rank and total count from value (supports "1/9", "5207/91056" or numeric "1")
  const parseRankAndTotalVal = (val: string | undefined): { rank: number; total?: number } => {
    if (!val) return { rank: 0 };
    const str = String(val).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      const rank = parseInt(parts[0].replace(/[^0-9]/g, '')) || 0;
      const total = parseInt(parts[1].replace(/[^0-9]/g, '')) || undefined;
      return { rank, total };
    }
    const rank = parseInt(str.replace(/[^0-9]/g, '')) || 0;
    return { rank };
  };

  // Parse raw delimited text or sample CSV
  const parseDelimitedText = (text: string) => {
    setIsParsing(true);
    setImportSuccessMessage(null);

    setTimeout(() => {
      try {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          setParsedRows([]);
          setIsParsing(false);
          return;
        }

        // Detect delimiter (;, tab, comma)
        const firstLine = lines[0];
        let delimiter = ';';
        if (firstLine.includes(';')) delimiter = ';';
        else if (firstLine.includes('\t')) delimiter = '\t';
        else if (firstLine.includes(',')) delimiter = ',';

        const headers = firstLine.split(delimiter).map(h => h.trim());
        const normHeaders = headers.map(h => normalizeText(h));
        
        // Find column indices using normalized headers
        const nameIdx = normHeaders.findIndex(h => h.includes('ogrenci') || h.includes('ad') || h.includes('isim'));
        const numIdx = normHeaders.findIndex(h => h.includes('okul') || h.includes('numara') || h === 'no' || h.endsWith('no'));
        const classIdx = normHeaders.findIndex(h => h === 'sinif' || h === 'sube' || h.startsWith('sinif') || h.startsWith('sube'));

        const sayScoreIdx = normHeaders.findIndex(h => h.includes('saypuan'));
        const eaScoreIdx = normHeaders.findIndex(h => h.includes('eapuan'));
        const sozScoreIdx = normHeaders.findIndex(h => h.includes('sozpuan'));

        const sayClassRankIdx = normHeaders.findIndex(h => h.includes('saysinifsira') || h.includes('sayssira') || h.includes('sinifsira'));
        const sayInstRankIdx = normHeaders.findIndex(h => h.includes('saykurumsira') || h.includes('sayksira') || h.includes('kurumsira'));
        const sayGenRankIdx = normHeaders.findIndex(h => h.includes('saygenelsira') || h.includes('saygsira') || h.includes('genelsira'));

        const classTotalIdx = normHeaders.findIndex(h => h.includes('sinifkatilim') || h.includes('siniftoplam') || h.includes('katilimsinif'));
        const instTotalIdx = normHeaders.findIndex(h => h.includes('kurumkatilim') || h.includes('kurumtoplam') || h.includes('katilimkurum'));
        const genTotalIdx = normHeaders.findIndex(h => h.includes('genelkatilim') || h.includes('geneltoplam') || h.includes('katilimlar') || h.includes('katilimgenel'));

        const subjectIdx = normHeaders.findIndex(h => h.includes('dersadi') || (h.includes('ders') && !h.includes('soru') && !h.includes('dogru') && !h.includes('yanlis') && !h.includes('net') && !h.includes('basari') && !h.includes('ort')));
        const subQuestIdx = normHeaders.findIndex(h => h.includes('derssoru'));
        const subCorrectIdx = normHeaders.findIndex(h => h.includes('dersdogru'));
        const subWrongIdx = normHeaders.findIndex(h => h.includes('dersyanlis'));
        const subNetIdx = normHeaders.findIndex(h => h.includes('dersnet'));
        const subSuccessIdx = normHeaders.findIndex(h => h.includes('dersbasari'));

        const subClassAvgIdx = normHeaders.findIndex(h => h.includes('derssinifort'));
        const subInstAvgIdx = normHeaders.findIndex(h => h.includes('derskurumort'));
        const subGenAvgIdx = normHeaders.findIndex(h => h.includes('dersgenelort'));

        const topicNameIdx = normHeaders.findIndex(h => h.includes('konu') || h.includes('kazanim'));
        const topicQuestIdx = normHeaders.findIndex(h => h.includes('konusoru'));
        const topicCorrectIdx = normHeaders.findIndex(h => h.includes('konudogru'));
        const topicWrongIdx = normHeaders.findIndex(h => h.includes('konuyanlis'));
        const topicEmptyIdx = normHeaders.findIndex(h => h.includes('konubos'));
        const topicSuccessIdx = normHeaders.findIndex(h => h.includes('konubasari'));

        // First pass: collect student rows and count class totals
        const studentMap = new Map<string, any>();
        const classStudentCountMap = new Map<string, Set<string>>();

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map(c => c.trim());
          if (cols.length < 2) continue;

          const studentName = (cols[nameIdx !== -1 ? nameIdx : 0] || 'Öğrenci').replace(/['"]/g, '');
          const schoolNumber = numIdx !== -1 ? cols[numIdx] || '' : '';
          const className = classIdx !== -1 ? cols[classIdx] || '' : '';

          const key = `${studentName}_${schoolNumber}_${className}`;

          if (!classStudentCountMap.has(className)) {
            classStudentCountMap.set(className, new Set());
          }
          classStudentCountMap.get(className)?.add(key);

          if (!studentMap.has(key)) {
            const parsedSayClassRank = sayClassRankIdx !== -1 ? parseRankAndTotalVal(cols[sayClassRankIdx]) : { rank: 0 };
            const parsedSayInstRank = sayInstRankIdx !== -1 ? parseRankAndTotalVal(cols[sayInstRankIdx]) : { rank: 0 };
            const parsedSayGenRank = sayGenRankIdx !== -1 ? parseRankAndTotalVal(cols[sayGenRankIdx]) : { rank: 0 };

            const explicitClassTotal = classTotalIdx !== -1 ? parseInt(cols[classTotalIdx]) || undefined : undefined;
            const explicitInstTotal = instTotalIdx !== -1 ? parseInt(cols[instTotalIdx]) || undefined : undefined;
            const explicitGenTotal = genTotalIdx !== -1 ? parseInt(cols[genTotalIdx]) || undefined : undefined;

            studentMap.set(key, {
              fileStudentName: studentName,
              fileSchoolNumber: schoolNumber,
              fileClassName: className,
              sayScore: sayScoreIdx !== -1 ? parseNum(cols[sayScoreIdx]) : 0,
              eaScore: eaScoreIdx !== -1 ? parseNum(cols[eaScoreIdx]) : 0,
              sozScore: sozScoreIdx !== -1 ? parseNum(cols[sozScoreIdx]) : 0,
              sayClassRank: parsedSayClassRank.rank,
              sayClassTotal: parsedSayClassRank.total || explicitClassTotal,
              sayInstitutionRank: parsedSayInstRank.rank,
              sayInstitutionTotal: parsedSayInstRank.total || explicitInstTotal,
              sayGeneralRank: parsedSayGenRank.rank,
              sayGeneralTotal: parsedSayGenRank.total || explicitGenTotal,
              eaClassRank: 0,
              eaInstitutionRank: 0,
              eaGeneralRank: 0,
              sozClassRank: 0,
              sozInstitutionRank: 0,
              sozGeneralRank: 0,
              subjectsMap: new Map<string, any>()
            });
          }

          const stObj = studentMap.get(key);
          const subjectName = subjectIdx !== -1 ? cols[subjectIdx] || 'Genel Ders' : 'Türkçe';

          const subCorrect = subCorrectIdx !== -1 ? parseInt(cols[subCorrectIdx]) || 0 : 0;
          const subWrong = subWrongIdx !== -1 ? parseInt(cols[subWrongIdx]) || 0 : 0;
          const subQuest = subQuestIdx !== -1 ? parseInt(cols[subQuestIdx]) || 40 : 40;
          const subNetParsed = subNetIdx !== -1 ? parseNumOpt(cols[subNetIdx]) : undefined;
          const subSuccess = subSuccessIdx !== -1 ? parseNum(cols[subSuccessIdx]) : 0;
          const classAvg = subClassAvgIdx !== -1 ? parseNumOpt(cols[subClassAvgIdx]) : undefined;
          const instAvg = subInstAvgIdx !== -1 ? parseNumOpt(cols[subInstAvgIdx]) : undefined;
          const genAvg = subGenAvgIdx !== -1 ? parseNumOpt(cols[subGenAvgIdx]) : undefined;

          if (!stObj.subjectsMap.has(subjectName)) {
            stObj.subjectsMap.set(subjectName, {
              subjectName,
              questionCount: subQuest,
              correct: subCorrect,
              wrong: subWrong,
              net: subNetParsed,
              successRate: subSuccess,
              classAvgNet: classAvg,
              institutionAvgNet: instAvg,
              generalAvgNet: genAvg,
              topics: []
            });
          } else {
            const existingSub = stObj.subjectsMap.get(subjectName);
            if (subCorrect > 0) existingSub.correct = Math.max(existingSub.correct, subCorrect);
            if (subWrong > 0) existingSub.wrong = Math.max(existingSub.wrong, subWrong);
            if (subQuest > 0) existingSub.questionCount = Math.max(existingSub.questionCount, subQuest);
            if (classAvg !== undefined) existingSub.classAvgNet = classAvg;
            if (instAvg !== undefined) existingSub.institutionAvgNet = instAvg;
            if (genAvg !== undefined) existingSub.generalAvgNet = genAvg;
          }

          const subjObj = stObj.subjectsMap.get(subjectName);
          const topicName = topicNameIdx !== -1 ? cols[topicNameIdx] : null;

          if (topicName && topicName.length > 0) {
            const topicQuest = topicQuestIdx !== -1 ? parseInt(cols[topicQuestIdx]) || 0 : 0;
            const topicCorr = topicCorrectIdx !== -1 ? parseInt(cols[topicCorrectIdx]) || 0 : 0;
            const topicWrng = topicWrongIdx !== -1 ? parseInt(cols[topicWrongIdx]) || 0 : 0;
            const topicEmp = topicEmptyIdx !== -1 ? parseInt(cols[topicEmptyIdx]) || 0 : 0;
            const topicSucc = topicSuccessIdx !== -1 ? parseNum(cols[topicSuccessIdx]) : 0;

            // Strict net formula: 4 yanlış 1 doğruyu götürür (1 yanlış 0,25 net düşürür)
            const topicNet = Number((topicCorr - topicWrng * 0.25).toFixed(2));
            const calcTopicSucc = topicQuest > 0 ? Number(((Math.max(0, topicNet) / topicQuest) * 100).toFixed(1)) : topicSucc;

            subjObj.topics.push({
              topicName,
              questionCount: topicQuest,
              correct: topicCorr,
              wrong: topicWrng,
              empty: topicEmp,
              successRate: calcTopicSucc > 0 ? calcTopicSucc : topicSucc
            });
          }
        }

        const totalStudentsInFile = studentMap.size;

        // Convert grouped objects to final ParsedStudentRow list with match calculations
        const result: ParsedStudentRow[] = [];

        studentMap.forEach((st) => {
          const matchRes = findBestStudentMatch(st.fileStudentName, st.fileSchoolNumber, st.fileClassName);
          
          const subjects: InstitutionalSubjectDetail[] = [];
          st.subjectsMap.forEach((subj: any) => {
            // Aggregate totals from topics if topic items exist and subject totals were not populated
            if (subj.topics && subj.topics.length > 0) {
              const topicTotalCorr = subj.topics.reduce((acc: number, t: any) => acc + (t.correct || 0), 0);
              const topicTotalWrng = subj.topics.reduce((acc: number, t: any) => acc + (t.wrong || 0), 0);
              const topicTotalQuest = subj.topics.reduce((acc: number, t: any) => acc + (t.questionCount || 0), 0);

              if (subj.correct === 0 && subj.wrong === 0 && (topicTotalCorr > 0 || topicTotalWrng > 0)) {
                subj.correct = topicTotalCorr;
                subj.wrong = topicTotalWrng;
                if (topicTotalQuest > 0) subj.questionCount = topicTotalQuest;
              }
            }

            // STRICT NET CALCULATION: Net = Correct - (Wrong * 0.25)
            // 4 Yanlış 1 Doğruyu Götürür (Her 1 yanlış 0,25 net düşürür)
            const calculatedNet = Number(((subj.correct || 0) - (subj.wrong || 0) * 0.25).toFixed(2));

            // Use calculatedNet if correct/wrong exist or if net was unparsed
            subj.net = (subj.correct > 0 || subj.wrong > 0 || subj.net === undefined)
              ? calculatedNet
              : subj.net;

            if (subj.questionCount > 0) {
              subj.successRate = Number((Math.max(0, subj.net / subj.questionCount) * 100).toFixed(1));
            }

            subjects.push({
              ...subj,
              topics: subj.topics
            });
          });

          const isMatched = matchRes.studentId !== null && matchRes.score > 0;
          const matchedUser = matchRes.studentId ? studentUsers.find(u => u.id === matchRes.studentId) : undefined;
          
          let rowClassMatch = 'all';
          if (matchedUser) {
            rowClassMatch = matchedUser.className || studentsData[matchedUser.id]?.profile?.className || 'all';
          }
          if (!rowClassMatch || rowClassMatch === 'all') {
            rowClassMatch = findBestClassMatch(st.fileClassName);
          }

          // Fallback calculations for totals if not specified
          const calculatedClassTotal = st.sayClassTotal || classStudentCountMap.get(st.fileClassName)?.size || 0;
          const calculatedInstTotal = st.sayInstitutionTotal || totalStudentsInFile || 0;
          const calculatedGenTotal = st.sayGeneralTotal || 0;

          result.push({
            fileStudentName: st.fileStudentName,
            fileSchoolNumber: st.fileSchoolNumber,
            fileClassName: st.fileClassName,
            matchedStudentId: matchRes.studentId,
            selectedClassForMatch: rowClassMatch,
            matchScore: matchRes.score,
            matchReason: matchRes.reason,
            isSelected: true, // Selected by default so unmatched students are also saved
            sayScore: st.sayScore,
            eaScore: st.eaScore,
            sozScore: st.sozScore,
            sayClassRank: st.sayClassRank,
            sayClassTotal: calculatedClassTotal,
            sayInstitutionRank: st.sayInstitutionRank,
            sayInstitutionTotal: calculatedInstTotal,
            sayGeneralRank: st.sayGeneralRank,
            sayGeneralTotal: calculatedGenTotal,
            eaClassRank: st.eaClassRank,
            eaClassTotal: calculatedClassTotal,
            eaInstitutionRank: st.eaInstitutionRank,
            eaInstitutionTotal: calculatedInstTotal,
            eaGeneralRank: st.eaGeneralRank,
            eaGeneralTotal: calculatedGenTotal,
            sozClassRank: st.sozClassRank,
            sozClassTotal: calculatedClassTotal,
            sozInstitutionRank: st.sozInstitutionRank,
            sozInstitutionTotal: calculatedInstTotal,
            sozGeneralRank: st.sozGeneralRank,
            sozGeneralTotal: calculatedGenTotal,
            subjects
          });
        });

        setParsedRows(result);
      } catch (err) {
        console.error("Parse error:", err);
      } finally {
        setIsParsing(false);
      }
    }, 200);
  };

  // Extract exam name automatically from file name
  const extractExamTitleFromFilename = (filename: string): string => {
    if (!filename) return '';
    let name = filename.replace(/\.[^/.]+$/, '');
    name = name.replace(/[_-]*(Sinav|Sınav)[_-]*(Sonuc|Sonuç)[_-]*(Analiz[iı]?)?$/i, '');
    name = name.replace(/[_-]*(Sonuc|Sonuç)[_-]*(Analiz[iı]?)?$/i, '');
    name = name.replace(/[_-]*(Sinav|Sınav)$/i, '');
    name = name.replace(/[_-]*(Analiz[iı]?)$/i, '');
    name = name.replace(/_/g, ' ');
    return name.replace(/\s+/g, ' ').trim();
  };

  // Handle manual file upload (.csv, .txt, .tsv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const autoDetectedTitle = extractExamTitleFromFilename(file.name);
    if (autoDetectedTitle) {
      setExamTitle(autoDetectedTitle);
    }

    // Auto detect examType based on filename
    const lowerFileName = file.name.toLowerCase();
    if (lowerFileName.includes('tyt')) {
      setExamType('TYT');
    } else if (lowerFileName.includes('ayt')) {
      setExamType('AYT');
    } else if (lowerFileName.includes('lgs') || lowerFileName.includes('ara')) {
      setExamType('Ara Sınıf');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        parseDelimitedText(content);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Handle changing class filter for a row (Step 1)
  const handleRowClassChange = (rowIndex: number, newClass: string) => {
    setParsedRows(prev => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      row.selectedClassForMatch = newClass;

      // If student was previously matched, check if they belong to newClass
      if (row.matchedStudentId) {
        const matchedUser = studentUsers.find(u => u.id === row.matchedStudentId);
        const userClass = matchedUser?.className || studentsData[row.matchedStudentId]?.profile?.className || '';
        
        if (newClass !== 'all' && userClass !== newClass) {
          // Find student in newClass with matching name or number
          const studentsInNewClass = getStudentsForClass(newClass);
          const autoMatchInNewClass = studentsInNewClass.find(u => 
            normalizeText(u.name) === normalizeText(row.fileStudentName) ||
            (row.fileSchoolNumber && u.schoolNumber === row.fileSchoolNumber)
          );

          if (autoMatchInNewClass) {
            row.matchedStudentId = autoMatchInNewClass.id;
            row.matchScore = 85;
            row.matchReason = `Sınıfta Eşleşti (${newClass})`;
            row.isSelected = true;
          } else {
            row.matchedStudentId = null;
            row.matchScore = 0;
            row.matchReason = 'Yeni Sınıfta Seçilmedi';
            row.isSelected = false;
          }
        }
      } else if (newClass !== 'all') {
        const studentsInNewClass = getStudentsForClass(newClass);
        const autoMatchInNewClass = studentsInNewClass.find(u => 
          normalizeText(u.name) === normalizeText(row.fileStudentName) ||
          (row.fileSchoolNumber && u.schoolNumber === row.fileSchoolNumber)
        );
        if (autoMatchInNewClass) {
          row.matchedStudentId = autoMatchInNewClass.id;
          row.matchScore = 85;
          row.matchReason = `Sınıfta Eşleşti (${newClass})`;
          row.isSelected = true;
        }
      }

      updated[rowIndex] = row;
      return updated;
    });
  };

  // Handle changing matched student manually from dropdown (Step 2)
  const handleManualMatchChange = (rowIndex: number, studentId: string) => {
    setParsedRows(prev => {
      const updated = [...prev];
      if (studentId === 'none') {
        updated[rowIndex].matchedStudentId = null;
        updated[rowIndex].matchScore = 0;
        updated[rowIndex].matchReason = 'Eşleştirilmedi';
        updated[rowIndex].isSelected = false;
      } else {
        const found = studentUsers.find(u => u.id === studentId);
        updated[rowIndex].matchedStudentId = studentId;
        updated[rowIndex].matchScore = 100;
        updated[rowIndex].matchReason = found ? `Manuel Seçildi (${found.name})` : 'Manuel Seçildi';
        updated[rowIndex].isSelected = true;
        
        // Auto update row class selection to matched student's class if available
        const foundClass = found?.className || studentsData[studentId]?.profile?.className;
        if (foundClass) {
          updated[rowIndex].selectedClassForMatch = foundClass;
        }
      }
      return updated;
    });
  };

  // Internal save execution
  const executeSaveImport = (selectedRows: ParsedStudentRow[], isOverwriting = false, deletedCount = 0) => {
    const now = new Date().toISOString();
    const createdExams: InstitutionalMockExam[] = selectedRows.map(row => {
      const targetUser = row.matchedStudentId ? studentUsers.find(u => u.id === row.matchedStudentId) : null;
      const studentName = targetUser?.name || row.fileStudentName;
      const schoolNumber = targetUser?.schoolNumber || row.fileSchoolNumber;
      const rawClass = row.selectedClassForMatch !== 'all'
        ? row.selectedClassForMatch
        : (targetUser?.className || row.fileClassName);
      const className = getMappedClassName(rawClass);

      return {
        id: `inst-exam-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        examTitle,
        examDate,
        examType,
        createdByName: currentUser?.name || 'Rehberlik Servisi',
        createdById: currentUser?.id,
        createdAt: now,
        studentId: row.matchedStudentId || undefined,
        studentName,
        schoolNumber,
        className,
        scores: {
          sayScore: row.sayScore,
          eaScore: row.eaScore,
          sozScore: row.sozScore,
          sayClassRank: row.sayClassRank,
          sayClassTotal: row.sayClassTotal,
          sayInstitutionRank: row.sayInstitutionRank,
          sayInstitutionTotal: row.sayInstitutionTotal,
          sayGeneralRank: row.sayGeneralRank,
          sayGeneralTotal: row.sayGeneralTotal,
          eaClassRank: row.eaClassRank,
          eaClassTotal: row.eaClassTotal,
          eaInstitutionRank: row.eaInstitutionRank,
          eaInstitutionTotal: row.eaInstitutionTotal,
          eaGeneralRank: row.eaGeneralRank,
          eaGeneralTotal: row.eaGeneralTotal,
          sozClassRank: row.sozClassRank,
          sozClassTotal: row.sozClassTotal,
          sozInstitutionRank: row.sozInstitutionRank,
          sozInstitutionTotal: row.sozInstitutionTotal,
          sozGeneralRank: row.sozGeneralRank,
          sozGeneralTotal: row.sozGeneralTotal,
          classParticipantCount: row.sayClassTotal,
          institutionParticipantCount: row.sayInstitutionTotal,
          generalParticipantCount: row.sayGeneralTotal
        },
        subjects: row.subjects
      };
    });

    onSaveInstitutionalExams(createdExams);
    
    const matchedSaved = createdExams.filter(e => e.studentId).length;
    const unmatchedSaved = createdExams.filter(e => !e.studentId).length;

    if (onAddAuditLog) {
      onAddAuditLog(
        `Toplu Kurumsal Deneme Girişi Yapıldı: "${examTitle}" (${createdExams.length} kayıt eklendi; ${matchedSaved} eşleşmiş, ${unmatchedSaved} eşleşmemiş${isOverwriting ? `; ${deletedCount} eski kayıt silindi` : ''}).`,
        'exam',
        'bulk_exam_import'
      );
    }

    setImportSuccessMessage(
      `${createdExams.length} adet deneme sonucu kaydedildi! ${isOverwriting ? `(${deletedCount} eski kayıt yenisiyle değiştirildi).` : `(${matchedSaved} eşleşmiş öğrenci profiline aktarıldı, ${unmatchedSaved} eşleşmemiş olarak kaydedildi).`}`
    );
    setParsedRows([]);
    setRawText('');
    setDuplicateWarning(null);
    setActiveTab('reports');
  };

  // Save parsed students into institutional exams database
  const handleConfirmAndSaveImport = () => {
    const selectedRows = parsedRows.filter(r => r.isSelected);
    if (selectedRows.length === 0) {
      alert("Lütfen en az bir öğrenci sonucu seçiniz.");
      return;
    }

    // Check for duplicate exam titles in examsToUse
    const normTitle = (examTitle || '').trim().toLowerCase();
    const existingDuplicates = examsToUse.filter(
      e => (e.examTitle || '').trim().toLowerCase() === normTitle
    );

    if (existingDuplicates.length > 0) {
      // Trigger warning modal
      setDuplicateWarning({
        examTitle,
        existingExams: existingDuplicates,
        pendingRows: selectedRows
      });
      return;
    }

    executeSaveImport(selectedRows);
  };

  // Overwrite existing duplicate exams
  const handleOverwriteDuplicateExams = () => {
    if (!duplicateWarning) return;
    const { existingExams, pendingRows } = duplicateWarning;

    // Delete existing duplicate exam records
    if (onDeleteInstitutionalExam && existingExams.length > 0) {
      onDeleteInstitutionalExam(existingExams.map(e => e.id));
    }

    executeSaveImport(pendingRows, true, existingExams.length);
  };

  // Match counts
  const matchedCount = useMemo(() => {
    return examsToUse.filter(e => !!e.studentId).length;
  }, [examsToUse]);

  const unmatchedCount = useMemo(() => {
    return examsToUse.filter(e => !e.studentId).length;
  }, [examsToUse]);

  // Helper to get exam type
  const getExamTypeForRecord = (e: InstitutionalMockExam): string => {
    if (e.examType) return e.examType;
    const upper = (e.examTitle || '').toUpperCase();
    if (upper.includes('TYT')) return 'TYT';
    if (upper.includes('AYT')) return 'AYT';
    if (upper.includes('LGS') || upper.includes('ARA')) return 'Ara Sınıf';
    return 'TYT';
  };

  // Filtering for Reports tab
  const filteredExams = useMemo(() => {
    return examsToUse.filter(exam => {
      if (examTypeFilter !== 'all') {
        const type = getExamTypeForRecord(exam);
        if (type !== examTypeFilter) return false;
      }
      if (matchFilter === 'matched' && !exam.studentId) return false;
      if (matchFilter === 'unmatched' && exam.studentId) return false;
      if (selectedExamId !== 'all' && exam.examTitle !== selectedExamId) return false;
      if (selectedClassFilter !== 'all') {
        const resolvedClass = getMappedClassName(exam.className);
        if (resolvedClass !== selectedClassFilter) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const resolvedClass = getMappedClassName(exam.className).toLowerCase();
        const matchesName = (exam.studentName || '').toLowerCase().includes(term);
        const matchesNum = (exam.schoolNumber || '').includes(term);
        const matchesTitle = (exam.examTitle || '').toLowerCase().includes(term);
        const matchesClass = resolvedClass.includes(term);
        if (!matchesName && !matchesNum && !matchesTitle && !matchesClass) return false;
      }
      return true;
    });
  }, [examsToUse, selectedExamId, selectedClassFilter, matchFilter, examTypeFilter, searchTerm, getMappedClassName]);

  // Unique exam summaries for overview selection cards
  const uniqueExamSummaries = useMemo(() => {
    const map = new Map<string, {
      count: number;
      maxSayScore: number;
      totalSayScore: number;
      examType: string;
      latestDate: string;
    }>();

    examsToUse.forEach(e => {
      const title = e.examTitle || 'İsimsiz Deneme';
      const type = getExamTypeForRecord(e);
      const curr = map.get(title) || {
        count: 0,
        maxSayScore: 0,
        totalSayScore: 0,
        examType: type,
        latestDate: e.examDate || e.createdAt || ''
      };
      curr.count += 1;
      const score = e.scores?.sayScore || 0;
      if (score > curr.maxSayScore) curr.maxSayScore = score;
      curr.totalSayScore += score;
      if (e.examDate && e.examDate > curr.latestDate) {
        curr.latestDate = e.examDate;
      }
      map.set(title, curr);
    });

    return Array.from(map.entries()).map(([examTitle, data]) => ({
      examTitle,
      count: data.count,
      maxScore: data.maxSayScore,
      avgScore: data.count > 0 ? (data.totalSayScore / data.count).toFixed(1) : '0',
      examType: data.examType,
      latestDate: data.latestDate
    })).sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  }, [examsToUse]);

  const filteredExamSummaries = useMemo(() => {
    if (examTypeFilter === 'all') return uniqueExamSummaries;
    return uniqueExamSummaries.filter(s => s.examType === examTypeFilter);
  }, [uniqueExamSummaries, examTypeFilter]);

  const top3Exams = useMemo(() => {
    return filteredExamSummaries.slice(0, 3);
  }, [filteredExamSummaries]);

  const otherExams = useMemo(() => {
    return filteredExamSummaries.slice(3);
  }, [filteredExamSummaries]);

  // Exams matching selected exam filter and type filter (for class selection buttons)
  const examsForClassFilter = useMemo(() => {
    return examsToUse.filter(exam => {
      if (examTypeFilter !== 'all') {
        const type = getExamTypeForRecord(exam);
        if (type !== examTypeFilter) return false;
      }
      if (selectedExamId !== 'all' && exam.examTitle !== selectedExamId) return false;
      if (matchFilter === 'matched' && !exam.studentId) return false;
      if (matchFilter === 'unmatched' && exam.studentId) return false;
      return true;
    });
  }, [examsToUse, examTypeFilter, selectedExamId, matchFilter]);

  // Unique class summaries for overview selection cards (updated per selected exam, hiding 0 count)
  const uniqueClassSummaries = useMemo(() => {
    const map = new Map<string, { count: number; totalSayScore: number }>();
    examsForClassFilter.forEach(e => {
      const rawCls = e.className || 'Belirtilmemiş';
      const cls = getMappedClassName(rawCls) || 'Belirtilmemiş';
      const curr = map.get(cls) || { count: 0, totalSayScore: 0 };
      curr.count += 1;
      curr.totalSayScore += e.scores?.sayScore || 0;
      map.set(cls, curr);
    });
    return Array.from(map.entries())
      .map(([className, data]) => ({
        className,
        count: data.count,
        avgScore: data.count > 0 ? (data.totalSayScore / data.count).toFixed(1) : '0'
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true, sensitivity: 'base' }));
  }, [examsForClassFilter, getMappedClassName]);

  // Reset class filter if the selected class is no longer present in filtered exams
  React.useEffect(() => {
    if (selectedClassFilter !== 'all') {
      const exists = uniqueClassSummaries.some(c => c.className === selectedClassFilter);
      if (!exists) {
        setSelectedClassFilter('all');
      }
    }
  }, [uniqueClassSummaries, selectedClassFilter]);

  // Active student detailed report card
  const activeStudentExam = useMemo(() => {
    if (selectedExamRecordId) {
      const found = examsToUse.find(e => e.id === selectedExamRecordId);
      if (found) return found;
    }
    return filteredExams.length > 0 ? filteredExams[0] : null;
  }, [examsToUse, filteredExams, selectedExamRecordId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              {onToggleMenu && (
                <button
                  type="button"
                  onClick={onToggleMenu}
                  className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-xl text-indigo-300 hover:text-white transition-all flex items-center space-x-1.5 text-xs font-extrabold shrink-0"
                  title="Sol Menüyü Aç / Kapat"
                >
                  <Menu className="w-5 h-5 text-indigo-300" />
                  <span className="hidden sm:inline">Menü</span>
                </button>
              )}
              <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Toplu Deneme Sonuçları & Excel Girişi
              </h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Okul genelinde uygulanan kurumsal deneme sınavlarının Excel/CSV listelerini sisteme aktarın, öğrencileri otomatik eşleştirin ve detaylı konu-kazanım analiz karnelerini oluşturun.
            </p>
          </div>

          {/* Tab Navigation & Delete Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950/80 border border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'import'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Yeni Liste Yükle</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'reports'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Sistemdeki Denemeler & Analizler</span>
                {examsToUse.length > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/30 text-indigo-300 font-extrabold">
                    {examsToUse.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {importSuccessMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between text-emerald-300 text-sm font-medium animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{importSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setImportSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs underline"
          >
            Kapat
          </button>
        </div>
      )}

      {/* TAB 1: IMPORT & MATCHING WORKFLOW */}
      {activeTab === 'import' && (
        <div className="space-y-6 w-full">
          {/* STEP-BY-STEP IMPORT GUIDANCE BOX */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Toplu Deneme Karnesi Yükleme Rehberi</span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      Adım Adım Kılavuz
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Okulizyon sisteminden toplu karneleri PDF indirip Gemini Gem ile CSV'ye dönüştürme ve sisteme yükleme adımları
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      1. ADIM
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Okulizyon PDF</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">Toplu Liste PDF İndirin</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Okulizyon sitesi üzerinden <strong className="text-amber-300 font-bold">"TOPLU LİSTE - KARNE 110 (YKS-TYT) (TYT DERSLİ)"</strong> isimli listenizi PDF olarak bilgisayarınıza indirin.
                  </p>
                </div>
                <a
                  href="https://okulizyon.com/app2/olcme/?pg=ykstopluliste"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition-all w-full text-center"
                >
                  <span>Okulizyon İndirme Sayfası</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      2. ADIM
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Gemini Gem</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">PDF'i CSV'ye Dönüştürün</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Aşağıdaki Gem linkine tıklayın. Açılan Gemini sohbetinde <strong className="text-amber-300 font-bold">(+)</strong> butonuna basıp PDF'i ekleyin ve <strong className="text-white">mesaj yazmadan</strong> gönderin. Cevap olarak gelen <strong className="text-emerald-300 font-bold">.csv</strong> dosyasını indirin.
                  </p>
                </div>
                <a
                  href="https://gemini.google.com/gem/1CtMzVvvkHYkNY7YoKtiT5GTv4UFFj_VM?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all w-full text-center"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gemini Dönüştürücü Gem'i Aç</span>
                </a>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      3. ADIM
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">CSV Yükleme</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">CSV Dosyasını Yükleyin</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Gemini'den aldığınız <strong className="text-emerald-300 font-bold">.csv</strong> uzantılı dosyayı sağ taraftaki <strong className="text-white font-bold">"Excel / CSV Yükle"</strong> butonuna basarak seçin ve sisteme aktarın.
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-center space-x-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1.5 rounded-lg text-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Yüklemeye Hazırsınız</span>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Exam Metadata & Upload Card */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
            {/* Top Title Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 text-white font-extrabold text-sm">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Deneme Sınavı Bilgileri</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Yüklenen sınav bilgilerini tanımlayın
              </span>
            </div>

            {/* Form & Upload Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Exam Title Input (Wider - col-span 6) */}
              <div className="md:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Deneme Adı & Yayın
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExamTitle(val);
                    const upper = val.toUpperCase();
                    if (upper.includes('AYT')) setExamType('AYT');
                    else if (upper.includes('TYT')) setExamType('TYT');
                    else if (upper.includes('LGS') || upper.includes('ARA')) setExamType('Ara Sınıf');
                  }}
                  placeholder="Ör: BILGI_SARMAL_AYT_TG_4"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Exam Type Selector (Narrower - col-span 2) */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Sınav Türü
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as 'TYT' | 'AYT' | 'Ara Sınıf')}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="TYT">TYT</option>
                  <option value="AYT">AYT</option>
                  <option value="Ara Sınıf">Ara Sınıf</option>
                </select>
              </div>

              {/* Exam Date Input (col-span 2) */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Sınav Tarihi
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {/* Upload Button at Far Right (col-span 2) */}
              <div className="md:col-span-2">
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 rounded-xl px-3 py-2 flex items-center justify-center space-x-1.5 text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all text-center w-full">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Excel/CSV Yükle</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Full Width Parsed Students & Matching Table */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Eşleşen & Eşleşmeyen Öğrenci Listesi ({parsedRows.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Eşleşenler doğrudan öğrenciye atanır. Eşleşmeyenler 'Eşleşmemiş Karneler' olarak kaydedilir.
                </p>
              </div>

              {parsedRows.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="hidden md:flex items-center space-x-1.5 text-[11px] text-slate-400 mr-2">
                    <button
                      type="button"
                      onClick={() => setParsedRows(prev => prev.map(r => ({ ...r, isSelected: true })))}
                      className="hover:text-indigo-300 underline"
                    >
                      Tümünü Seç
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setParsedRows(prev => prev.map(r => ({ ...r, isSelected: !!r.matchedStudentId })))}
                      className="hover:text-indigo-300 underline"
                    >
                      Yalnızca Eşleşenleri Seç
                    </button>
                  </div>
                  <button
                    onClick={handleConfirmAndSaveImport}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Seçilen Sonuçları Sisteme İşle ({parsedRows.filter(r => r.isSelected).length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Class Filter Tabs Bar */}
            {parsedRows.length > 0 && !isParsing && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-white/10 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveClassTab('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                    activeClassTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>Tüm Sınıflar</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30 text-white/90">
                    {parsedRows.length}
                  </span>
                </button>

                {importedClassesTabs.map(cls => {
                  const count = parsedRows.filter(r => isRowInActiveTabForCls(r, cls)).length;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setActiveClassTab(cls)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                        activeClassTab === cls
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{cls}</span>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30 text-white/90">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Table Body */}
            {isParsing ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs font-semibold">Excel verileri işleniyor ve öğrenciler eşleştiriliyor...</p>
              </div>
            ) : parsedRows.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3 border-2 border-dashed border-white/10 rounded-xl">
                <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-300">Henüz Veri Yüklenmedi</p>
                  <p className="text-xs max-w-md mx-auto text-slate-500">
                    Yukarıdaki panelden bir Excel/CSV dosyası seçerek yükleme işlemini başlatın.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10 w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                      <th className="p-3 w-10 text-center">Seç</th>
                      <th className="p-3 whitespace-nowrap">Dosyadaki Öğrenci</th>
                      <th className="p-3 whitespace-nowrap">Okul No</th>
                      <th className="p-3 whitespace-nowrap">Dosya Sınıfı</th>
                      <th className="p-3 whitespace-nowrap">1. Sınıf Seçimi</th>
                      <th className="p-3 whitespace-nowrap">2. Sistem Hesabı Eşleşmesi</th>
                      <th className="p-3 text-center whitespace-nowrap">Eşleşme Oranı</th>
                      <th className="p-3 text-right whitespace-nowrap">Ders Sayısı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {parsedRows
                      .map((row, originalIdx) => ({ row, originalIdx }))
                      .filter(({ row }) => isRowInActiveTabForCls(row, activeClassTab))
                      .map(({ row, originalIdx: idx }) => {
                        const filteredStudents = getStudentsForClass(row.selectedClassForMatch);

                      return (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.isSelected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setParsedRows(prev => {
                                  const u = [...prev];
                                  u[idx].isSelected = checked;
                                  return u;
                                });
                              }}
                              className="w-4 h-4 rounded bg-slate-950 border-white/20 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-3 font-semibold text-white whitespace-nowrap">
                            {row.fileStudentName}
                          </td>
                          <td className="p-3 font-mono text-indigo-300 whitespace-nowrap">
                            {row.fileSchoolNumber || '-'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10 font-medium text-xs whitespace-nowrap inline-block">
                              {row.fileClassName || '-'}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <select
                              value={row.selectedClassForMatch || 'all'}
                              onChange={(e) => handleRowClassChange(idx, e.target.value)}
                              className="bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-300 focus:outline-none focus:border-indigo-500 whitespace-nowrap"
                            >
                              <option value="all">Tüm Sınıflar ({studentUsers.length})</option>
                              {availableClasses.map(cls => (
                                <option key={cls} value={cls}>
                                  {cls} ({getStudentsForClass(cls).length})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 min-w-[220px]">
                            <select
                              value={row.matchedStudentId || 'none'}
                              onChange={(e) => handleManualMatchChange(idx, e.target.value)}
                              className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none ${
                                row.matchedStudentId 
                                  ? 'border-emerald-500/40 text-emerald-300' 
                                  : 'border-rose-500/40 text-rose-300'
                              }`}
                            >
                              <option value="none">-- Öğrenci Seçin --</option>
                              {filteredStudents.map(st => (
                                <option key={st.id} value={st.id}>
                                  {st.name} {st.schoolNumber ? `(#${st.schoolNumber})` : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                            <td className="p-3 text-center">
                              {row.matchScore >= 90 ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>%{row.matchScore}</span>
                                </span>
                              ) : row.matchScore >= 60 ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>%{row.matchScore}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  <XCircle className="w-3 h-3" />
                                  <span>Eşleşmedi</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-400">
                              {row.subjects.length} Ders
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      {/* TAB 2: REPORTS & ANALYTICS VIEW */}
      {activeTab === 'reports' && (
        <div className="space-y-6 w-full">
          {/* STACKED FULL-WIDTH SELECTION CARDS */}
          <div className="space-y-4 w-full">
            
            {/* TOP BOX: Deneme Seçim Ekranı (Full Width) */}
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl shadow-xl w-full">
              {/* Top Bar: Title & TYT/AYT/Ara Sınıf Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>Deneme Sınavı Seçimi</span>
                      {selectedExamId !== 'all' && (
                        <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          Seçili: {selectedExamId}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">Önce sınav türünü seçin, ardından denemenizi seçin</p>
                  </div>
                </div>

                {/* Sınav Türü Seçim Tabları (TYT / AYT / Ara Sınıf) */}
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setExamTypeFilter('all');
                      setSelectedExamId('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      examTypeFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tüm Türler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExamTypeFilter('TYT');
                      setSelectedExamId('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      examTypeFilter === 'TYT'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TYT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExamTypeFilter('AYT');
                      setSelectedExamId('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      examTypeFilter === 'AYT'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AYT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExamTypeFilter('Ara Sınıf');
                      setSelectedExamId('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      examTypeFilter === 'Ara Sınıf'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ara Sınıf
                  </button>
                </div>
              </div>

              {/* Son 3 Deneme (Kutu Kutu Display) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Öne Çıkan / Son Yüklenen Denemeler (Son 3)</span>
                  </span>
                  {selectedExamId !== 'all' && (
                    <button
                      onClick={() => setSelectedExamId('all')}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold"
                    >
                      Tüm Denemeleri Göster
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Card 0: "Tüm Denemeler" Option */}
                  <div
                    onClick={() => setSelectedExamId('all')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedExamId === 'all'
                        ? 'bg-amber-500/25 border-amber-500 shadow-lg shadow-amber-500/20 text-white ring-2 ring-amber-500/50'
                        : 'bg-slate-950/80 border-white/10 text-slate-300 hover:border-amber-500/40 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-extrabold text-xs text-white block">Tüm Denemeler</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {filteredExamSummaries.length} Adet {examTypeFilter !== 'all' ? examTypeFilter : ''} Denemesi
                        </span>
                      </div>
                      {selectedExamId === 'all' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-amber-300/80 font-semibold">
                      Filtresiz Tüm Karneleri Listele
                    </div>
                  </div>

                  {/* Top 3 Exam Cards */}
                  {top3Exams.map((ex) => {
                    const isSelected = selectedExamId === ex.examTitle;
                    return (
                      <div
                        key={ex.examTitle}
                        onClick={() => setSelectedExamId(ex.examTitle)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                          isSelected
                            ? 'bg-amber-500/25 border-amber-500 shadow-lg shadow-amber-500/20 text-white ring-2 ring-amber-500/50'
                            : 'bg-slate-950/80 border-white/10 text-slate-300 hover:border-amber-500/40 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-xs text-white block truncate" title={ex.examTitle}>
                              {ex.examTitle}
                            </span>
                            <span className="text-[10px] text-amber-400/90 font-mono font-semibold block mt-0.5">
                              {ex.examType} • {ex.latestDate || 'Tarih Yok'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSeriesExam({
                                  examTitle: ex.examTitle,
                                  latestDate: ex.latestDate,
                                  count: ex.count
                                });
                              }}
                              className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 opacity-60 hover:opacity-100 transition-all"
                              title="Deneme Bilgilerini Düzenle / Sil"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-medium text-slate-400">
                          <span>{ex.count} Katılımcı</span>
                          <span className="font-bold text-amber-300">Max: {ex.maxScore}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Other Exams Dropdown List */}
              {otherExams.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                    <ChevronDown className="w-4 h-4 text-indigo-400" />
                    <span>Diğer Denemeler ({otherExams.length} deneme listede):</span>
                  </div>
                  <select
                    value={otherExams.some(e => e.examTitle === selectedExamId) ? selectedExamId : 'none'}
                    onChange={(e) => {
                      if (e.target.value !== 'none') {
                        setSelectedExamId(e.target.value);
                      }
                    }}
                    className="w-full sm:w-80 bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="none">-- Diğer Denemeler Arasından Seçin --</option>
                    {otherExams.map((ex) => (
                      <option key={ex.examTitle} value={ex.examTitle}>
                        {ex.examTitle} ({ex.count} Katılımcı - Max: {ex.maxScore})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* BOTTOM BOX: Sınıf Seçim Ekranı (Full Width) */}
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-3 backdrop-blur-xl shadow-xl w-full">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>Sınıf / Şube Seçimi</span>
                      {selectedClassFilter !== 'all' && (
                        <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                          Seçili: {selectedClassFilter}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">Raporlanan öğrenci listesini sınıfa göre daraltın</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowClassMappingModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-600/30 transition-all border border-indigo-500/30 bg-indigo-500/10 shadow-sm"
                    title="Otomatik Sınıf Eşleştirme Kuralları"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sınıf Eşleştirme</span>
                  </button>
                  <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/20">
                    {uniqueClassSummaries.length} Sınıf Bulundu
                  </span>
                </div>
              </div>

              {/* Full Width Grid / Horizontal Flex for Classes */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedClassFilter('all')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center space-x-2 ${
                    selectedClassFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-950/80 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-950'
                  }`}
                >
                  <span>Tüm Sınıflar</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-black/40 font-mono">
                    {examsForClassFilter.length}
                  </span>
                </button>

                {uniqueClassSummaries.map((cls) => {
                  const isSelected = selectedClassFilter === cls.className;
                  return (
                    <button
                      key={cls.className}
                      type="button"
                      onClick={() => setSelectedClassFilter(cls.className)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center space-x-2 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-950/80 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-950'
                      }`}
                    >
                      <span>{cls.className}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-black/40 font-mono">
                        {cls.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Match Status Segmented Filter Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setMatchFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                matchFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <span>Tüm Karneler</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{examsToUse.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setMatchFilter('matched')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                matchFilter === 'matched'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Eşleşmiş Karneler</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{matchedCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setMatchFilter('unmatched')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                matchFilter === 'unmatched'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : unmatchedCount > 0
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Eşleşmemiş Karneler</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{unmatchedCount}</span>
            </button>
          </div>

          {/* Search & Active Filter Info Bar */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-bold mr-1">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span>Seçili Filtre:</span>
              </div>
              <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                {selectedClassFilter === 'all' ? 'Tüm Sınıflar' : selectedClassFilter}
              </span>
              <span className="text-slate-600 font-bold">•</span>
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                {selectedExamId === 'all' ? 'Tüm Denemeler' : selectedExamId}
              </span>
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 ml-1">
                {filteredExams.length} Karne Bulundu
              </span>

              {(selectedClassFilter !== 'all' || selectedExamId !== 'all' || matchFilter !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedClassFilter('all');
                    setSelectedExamId('all');
                    setMatchFilter('all');
                    setSearchTerm('');
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 underline ml-2 font-semibold"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Öğrenci veya sınav ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {filteredExams.length === 0 ? (
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">Kayıtlı Kurumsal Deneme Bulunamadı</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Seçili filtre kriterlerine uygun kurumsal deneme sonucu bulunamadı. "Yeni Liste Yükle" sekmesinden Excel listenizi aktarabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student Cards List */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
                  <span>Öğrenci Sınav Karneleri ({filteredExams.length})</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Karnesini Görmek İçin Tıklayın</span>
                </h3>

                <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
                  {filteredExams.map((exam) => {
                    const isSelected = activeStudentExam?.id === exam.id;

                    return (
                      <div
                        key={exam.id}
                        onClick={() => setSelectedExamRecordId(exam.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/10'
                            : 'bg-slate-900/80 border-white/10 hover:border-white/20 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm">
                                {exam.studentName}
                              </span>
                              {exam.schoolNumber && (
                                <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded">
                                  #{exam.schoolNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {getMappedClassName(exam.className)} • {exam.examTitle}
                            </p>
                            <div className="mt-1.5">
                              {exam.studentId ? (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Eşleşmiş</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>Eşleşmemiş</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-indigo-400 translate-x-1' : 'text-slate-600'}`} />
                        </div>

                        {/* Scores row */}
                        {(() => {
                          const examProf = exam.studentId ? studentsData[exam.studentId]?.profile : null;
                          let field = examProf?.targetField;
                          if (!field || !['SAY', 'EA', 'SÖZ', 'DİL'].includes(field)) {
                            const mappedC = getMappedClassName(exam.className).toUpperCase();
                            if (mappedC.includes('EA') || mappedC.includes('EŞİT AĞIRLIK')) field = 'EA';
                            else if (mappedC.includes('SÖZ') || mappedC.includes('SÖZEL')) field = 'SÖZ';
                            else if (mappedC.includes('DİL') || mappedC.includes('YABANCI DİL')) field = 'DİL';
                            else field = 'SAY';
                          }

                          let sc = exam.scores.sayScore || '-';
                          let cr = exam.scores.sayClassRank;
                          let ct = exam.scores.sayClassTotal || exam.scores.classParticipantCount;
                          let ir = exam.scores.sayInstitutionRank;
                          let it = exam.scores.sayInstitutionTotal || exam.scores.institutionParticipantCount;

                          if (field === 'EA') {
                            sc = exam.scores.eaScore || exam.scores.sayScore || '-';
                            cr = exam.scores.eaClassRank || exam.scores.sayClassRank;
                            ct = exam.scores.eaClassTotal || exam.scores.sayClassTotal || exam.scores.classParticipantCount;
                            ir = exam.scores.eaInstitutionRank || exam.scores.sayInstitutionRank;
                            it = exam.scores.eaInstitutionTotal || exam.scores.sayInstitutionTotal || exam.scores.institutionParticipantCount;
                          } else if (field === 'SÖZ') {
                            sc = exam.scores.sozScore || exam.scores.sayScore || '-';
                            cr = exam.scores.sozClassRank || exam.scores.sayClassRank;
                            ct = exam.scores.sozClassTotal || exam.scores.sayClassTotal || exam.scores.classParticipantCount;
                            ir = exam.scores.sozInstitutionRank || exam.scores.sayInstitutionRank;
                            it = exam.scores.sozInstitutionTotal || exam.scores.sayInstitutionTotal || exam.scores.institutionParticipantCount;
                          }

                          return (
                            <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="bg-slate-950/60 p-1.5 rounded-lg border border-white/5">
                                <span className="text-[10px] text-slate-500 block">{field} Puan</span>
                                <span className="font-bold text-indigo-300">{sc}</span>
                              </div>
                              <div className="bg-slate-950/60 p-1.5 rounded-lg border border-white/5">
                                <span className="text-[10px] text-slate-500 block">{field} Sınıf</span>
                                <span className="font-bold text-emerald-400 font-mono">
                                  {formatRankWithTotal(cr, ct)}
                                </span>
                              </div>
                              <div className="bg-slate-950/60 p-1.5 rounded-lg border border-white/5">
                                <span className="text-[10px] text-slate-500 block">{field} Kurum</span>
                                <span className="font-bold text-amber-400 font-mono">
                                  {formatRankWithTotal(ir, it)}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Report Card View */}
              <div className="lg:col-span-2">
                {activeStudentExam ? (
                  <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
                    {/* Unmatched Warning Banner if applicable */}
                    {!activeStudentExam.studentId && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-amber-300">Profil Eşleşmesi Olmayan Karne</h4>
                            <p className="text-[11px] text-amber-200/80 mt-0.5">
                              Bu karne henüz bir öğrenci hesabıyla eşleştirilmedi. Karneyi sisteme kayıtlı bir hesaba bağlayabilir, düzenleyebilir veya silebilirsiniz.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setMatchModalExam(activeStudentExam)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shrink-0 flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition-all"
                        >
                          <Link className="w-3.5 h-3.5" />
                          <span>Öğrenci İle Eşleştir</span>
                        </button>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-xl font-extrabold text-white">
                            {activeStudentExam.studentName}
                          </h2>
                          {activeStudentExam.schoolNumber && (
                            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                              Okul No: #{activeStudentExam.schoolNumber}
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                            {getMappedClassName(activeStudentExam.className)}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-400 font-semibold mt-1">
                          {activeStudentExam.examTitle} • {activeStudentExam.examDate}
                        </p>
                      </div>

                      {/* Action buttons (Match / Edit / Delete) */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMatchModalExam(activeStudentExam)}
                          className="px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-bold flex items-center space-x-1.5 transition-all"
                          title="Öğrenci Hesabı İle Eşleştir"
                        >
                          <Link className="w-3.5 h-3.5" />
                          <span>{activeStudentExam.studentId ? 'Eşleşmeyi Değiştir' : 'Öğrenci İle Eşleştir'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditModalExam(activeStudentExam)}
                          className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-bold flex items-center space-x-1.5 transition-all"
                          title="Deneme Bilgilerini Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Düzenle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmExam(activeStudentExam)}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-bold flex items-center space-x-1.5 transition-all"
                          title="Deneme Karneyi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      </div>
                    </div>

                    {/* Scores & Ranks Summary Grid */}
                    {(() => {
                      const isAytExam = activeStudentExam.examType === 'AYT' || (activeStudentExam.examTitle || '').toUpperCase().includes('AYT');

                      const aytSubjects = activeStudentExam.subjects.filter(s => s.topics && s.topics.length > 0);
                      const aytNet = Number(aytSubjects.reduce((sum, s) => {
                        const calcNet = (s.correct || 0) - (s.wrong || 0) * 0.25;
                        return sum + (s.net !== undefined ? s.net : calcNet);
                      }, 0).toFixed(2));
                      const aytCorrect = aytSubjects.reduce((sum, s) => sum + (s.correct || 0), 0);
                      const aytWrong = aytSubjects.reduce((sum, s) => sum + (s.wrong || 0), 0);

                      const { tytNet, tytCorrect, tytWrong } = processTytSubjects(activeStudentExam.subjects);

                      const totalNet = Number((aytNet + tytNet).toFixed(2));
                      const totalCorrect = aytCorrect + tytCorrect;
                      const totalWrong = aytWrong + tytWrong;

                      // Determine student target field for score & ranks
                      const studentProfile = activeStudentExam.studentId ? studentsData[activeStudentExam.studentId]?.profile : null;
                      let targetField = studentProfile?.targetField;
                      if (!targetField || !['SAY', 'EA', 'SÖZ', 'DİL'].includes(targetField)) {
                        const mappedCls = getMappedClassName(activeStudentExam.className).toUpperCase();
                        if (mappedCls.includes('EA') || mappedCls.includes('EŞİT AĞIRLIK')) targetField = 'EA';
                        else if (mappedCls.includes('SÖZ') || mappedCls.includes('SÖZEL')) targetField = 'SÖZ';
                        else if (mappedCls.includes('DİL') || mappedCls.includes('YABANCI DİL')) targetField = 'DİL';
                        else targetField = 'SAY';
                      }

                      let displayScore = 0;
                      let classRank = 0;
                      let classTotal = 0;
                      let instRank = 0;
                      let instTotal = 0;
                      let genRank = 0;
                      let genTotal = 0;

                      if (targetField === 'EA') {
                        displayScore = activeStudentExam.scores.eaScore || activeStudentExam.scores.sayScore || 0;
                        classRank = activeStudentExam.scores.eaClassRank || activeStudentExam.scores.sayClassRank || 0;
                        classTotal = activeStudentExam.scores.eaClassTotal || activeStudentExam.scores.sayClassTotal || activeStudentExam.scores.classParticipantCount || 0;
                        instRank = activeStudentExam.scores.eaInstitutionRank || activeStudentExam.scores.sayInstitutionRank || 0;
                        instTotal = activeStudentExam.scores.eaInstitutionTotal || activeStudentExam.scores.sayInstitutionTotal || activeStudentExam.scores.institutionParticipantCount || 0;
                        genRank = activeStudentExam.scores.eaGeneralRank || activeStudentExam.scores.sayGeneralRank || 0;
                        genTotal = activeStudentExam.scores.eaGeneralTotal || activeStudentExam.scores.sayGeneralTotal || activeStudentExam.scores.generalParticipantCount || 0;
                      } else if (targetField === 'SÖZ') {
                        displayScore = activeStudentExam.scores.sozScore || activeStudentExam.scores.sayScore || 0;
                        classRank = activeStudentExam.scores.sozClassRank || activeStudentExam.scores.sayClassRank || 0;
                        classTotal = activeStudentExam.scores.sozClassTotal || activeStudentExam.scores.sayClassTotal || activeStudentExam.scores.classParticipantCount || 0;
                        instRank = activeStudentExam.scores.sozInstitutionRank || activeStudentExam.scores.sayInstitutionRank || 0;
                        instTotal = activeStudentExam.scores.sozInstitutionTotal || activeStudentExam.scores.sayInstitutionTotal || activeStudentExam.scores.institutionParticipantCount || 0;
                        genRank = activeStudentExam.scores.sozGeneralRank || activeStudentExam.scores.sayGeneralRank || 0;
                        genTotal = activeStudentExam.scores.sozGeneralTotal || activeStudentExam.scores.sayGeneralTotal || activeStudentExam.scores.generalParticipantCount || 0;
                      } else {
                        targetField = 'SAY';
                        displayScore = activeStudentExam.scores.sayScore || 0;
                        classRank = activeStudentExam.scores.sayClassRank || 0;
                        classTotal = activeStudentExam.scores.sayClassTotal || activeStudentExam.scores.classParticipantCount || 0;
                        instRank = activeStudentExam.scores.sayInstitutionRank || 0;
                        instTotal = activeStudentExam.scores.sayInstitutionTotal || activeStudentExam.scores.institutionParticipantCount || 0;
                        genRank = activeStudentExam.scores.sayGeneralRank || 0;
                        genTotal = activeStudentExam.scores.sayGeneralTotal || activeStudentExam.scores.generalParticipantCount || 0;
                      }

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {/* Toplam Net Card */}
                          <div className="bg-slate-950/80 border border-indigo-500/30 p-3.5 rounded-xl text-center flex flex-col justify-between shadow-lg shadow-indigo-500/5">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Net</span>
                              <span className="text-xl font-black text-indigo-400 font-mono mt-0.5 block">{formatNet(totalNet)}</span>
                            </div>
                            {isAytExam ? (
                              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-semibold">
                                <div className="text-left">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">AYT Net</span>
                                  <span className="text-emerald-400 font-extrabold font-mono">{formatNet(aytNet)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">TYT Net</span>
                                  <span className="text-sky-400 font-extrabold font-mono">{formatNet(tytNet)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2.5 pt-2 border-t border-white/5 space-y-0.5">
                                <div className="text-[10px] font-bold flex items-center justify-center space-x-1.5">
                                  <span className="text-emerald-400">{totalCorrect} D</span>
                                  <span className="text-slate-500">/</span>
                                  <span className="text-rose-400">{totalWrong} Y</span>
                                </div>
                                <span className="text-[9px] font-medium text-slate-500 block">(4 Yanlış = -1 Net)</span>
                              </div>
                            )}
                          </div>

                          {/* Dynamic Target Field Score Card */}
                          <div className="bg-slate-950/80 border border-indigo-500/20 p-3.5 rounded-xl text-center flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{targetField} Puanı</span>
                              <span className="text-lg font-black text-indigo-400">
                                {displayScore > 0 ? (typeof displayScore === 'number' ? displayScore.toFixed(2).replace('.', ',') : displayScore) : '0'}
                              </span>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-white/5 text-[10px] font-semibold text-slate-400">
                              Ham Puan
                            </div>
                          </div>

                          {/* Sınıf Derecesi Card */}
                          {(() => {
                            const rank = classRank;
                            const total = classTotal;
                            const rankStr = formatRankWithTotal(rank, total);
                            const percentile = (rank > 0 && total > 0) ? (rank / total) * 100 : null;
                            const progressPercent = (rank > 0 && total > 0) ? Math.max(3, Math.min(100, ((total - rank + 1) / total) * 100)) : 0;
                            return (
                              <div className="bg-slate-950/80 border border-emerald-500/20 p-3.5 rounded-xl text-center flex flex-col justify-between">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sınıf Derecesi</span>
                                  <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">{rankStr}</span>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-400 block">
                                    {percentile !== null ? <>Yüzdelik Dilim: <strong className="text-emerald-400">%{percentile.toFixed(1)}</strong></> : 'Yüzdelik: -'}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Kurum Derecesi Card */}
                          {(() => {
                            const rank = instRank;
                            const total = instTotal;
                            const rankStr = formatRankWithTotal(rank, total);
                            const percentile = (rank > 0 && total > 0) ? (rank / total) * 100 : null;
                            const progressPercent = (rank > 0 && total > 0) ? Math.max(3, Math.min(100, ((total - rank + 1) / total) * 100)) : 0;
                            return (
                              <div className="bg-slate-950/80 border border-amber-500/20 p-3.5 rounded-xl text-center flex flex-col justify-between">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kurum Derecesi</span>
                                  <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">{rankStr}</span>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-400 block">
                                    {percentile !== null ? <>Yüzdelik Dilim: <strong className="text-amber-400">%{percentile.toFixed(1)}</strong></> : 'Yüzdelik: -'}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Genel Derece Card */}
                          {(() => {
                            const rank = genRank;
                            const total = genTotal;
                            const rankStr = formatRankWithTotal(rank, total);
                            const percentile = (rank > 0 && total > 0) ? (rank / total) * 100 : null;
                            const progressPercent = (rank > 0 && total > 0) ? Math.max(3, Math.min(100, ((total - rank + 1) / total) * 100)) : 0;
                            return (
                              <div className="bg-slate-950/80 border border-cyan-500/20 p-3.5 rounded-xl text-center flex flex-col justify-between">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Genel Derece</span>
                                  <span className="text-lg font-black text-cyan-400 font-mono mt-0.5 block">{rankStr}</span>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-400 block">
                                    {percentile !== null ? <>Yüzdelik Dilim: <strong className="text-cyan-400">%{percentile.toFixed(1)}</strong></> : 'Yüzdelik: -'}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}

                    {/* Subject Breakdown & Topic Outcomes */}
                    <div className="space-y-5 pt-2">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-indigo-400" />
                          <span>Ders ve Konu Kazanım Başarı Karnesi</span>
                        </h3>
                        <span className="text-xs font-semibold text-slate-400">
                          {activeStudentExam.subjects.length} Ders Kayıtlı
                        </span>
                      </div>

                      {/* 1. Subjects WITH Topic Analysis */}
                      {activeStudentExam.subjects.filter(s => s.topics && s.topics.length > 0).map((subj, idx) => (
                        <div key={idx} className="bg-slate-950/80 border border-white/10 rounded-xl p-4 space-y-3">
                          {/* Subject Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-white text-sm">{subj.subjectName}</span>
                              <span className="text-xs text-slate-400 font-mono">
                                ({subj.correct} D / {subj.wrong} Y = <strong className="text-indigo-400">{formatNet(subj.net)} Net</strong>)
                              </span>
                            </div>

                            {/* Net comparisons */}
                            <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-400">
                              {subj.classAvgNet !== undefined && (
                                <span>Sınıf Ort: <strong className="text-slate-200">{formatNet(subj.classAvgNet)} Net</strong></span>
                              )}
                              {subj.institutionAvgNet !== undefined && (
                                <span>Kurum Ort: <strong className="text-slate-200">{formatNet(subj.institutionAvgNet)} Net</strong></span>
                              )}
                            </div>
                          </div>

                          {/* Topic Details Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-[10px] text-slate-500 font-bold border-b border-white/5 uppercase">
                                  <th className="py-1.5">Konu / Kazanım Adı</th>
                                  <th className="py-1.5 text-center">Soru</th>
                                  <th className="py-1.5 text-center">D</th>
                                  <th className="py-1.5 text-center">Y</th>
                                  <th className="py-1.5 text-center">B</th>
                                  <th className="py-1.5 text-right">Başarı %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {subj.topics!.map((top, tIdx) => (
                                  <tr key={tIdx} className="hover:bg-white/5">
                                    <td className="py-2 font-medium text-slate-200">{top.topicName}</td>
                                    <td className="py-2 text-center text-slate-400">{top.questionCount}</td>
                                    <td className="py-2 text-center text-emerald-400 font-bold">{top.correct}</td>
                                    <td className="py-2 text-center text-rose-400 font-bold">{top.wrong}</td>
                                    <td className="py-2 text-center text-slate-500">{top.empty}</td>
                                    <td className="py-2 text-right">
                                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                        top.successRate >= 80 
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : top.successRate >= 50
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      }`}>
                                        %{top.successRate}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}

                      {/* 2. TYT Subjects Table */}
                      {(() => {
                        const { displayList } = processTytSubjects(activeStudentExam.subjects);
                        if (displayList.length === 0) return null;

                        return (
                          <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 space-y-3">
                            <div className="border-b border-white/10 pb-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>TYT Dersleri</span>
                                </h4>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  {displayList.length} Ders / Alan
                                </span>
                              </div>
                              <p className="text-[11px] italic text-slate-400 mt-1">
                                İsminiz ile eşleşen TYT bilgileriniz kullanılmıştır.
                              </p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="text-[10px] text-slate-400 font-bold border-b border-white/15 uppercase tracking-wider">
                                    <th className="py-2.5 px-2">Ders</th>
                                    <th className="py-2.5 px-2 text-center">Soru</th>
                                    <th className="py-2.5 px-2 text-center">Doğru</th>
                                    <th className="py-2.5 px-2 text-center">Yanlış</th>
                                    <th className="py-2.5 px-2 text-center">Net</th>
                                    <th className="py-2.5 px-2 text-center">Başarı %</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {displayList.map((subj, sIdx) => {
                                    if (subj.isSummary) {
                                      return (
                                        <tr key={sIdx} className="bg-slate-800/90 hover:bg-slate-800/100 border-y border-white/15 transition-colors">
                                          <td className="py-2.5 px-2 font-black text-indigo-300 underline underline-offset-4 decoration-indigo-400/50 tracking-wide text-xs">
                                            {subj.subjectName}
                                          </td>
                                          <td className="py-2.5 px-2 text-center font-mono font-extrabold text-slate-200">{subj.questionCount}</td>
                                          <td className="py-2.5 px-2 text-center font-mono font-extrabold text-emerald-300">{subj.correct}</td>
                                          <td className="py-2.5 px-2 text-center font-mono font-extrabold text-rose-300">{subj.wrong}</td>
                                          <td className="py-2.5 px-2 text-center font-mono font-black text-indigo-300 text-sm bg-indigo-500/10 border-x border-indigo-500/20">
                                            {formatNet(subj.net)}
                                          </td>
                                          <td className="py-2.5 px-2 text-center font-mono">
                                            <span className="font-extrabold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 text-[11px] inline-block">
                                              %{subj.successRate}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    }

                                    return (
                                      <tr key={sIdx} className="hover:bg-white/5 transition-colors">
                                        <td className="py-2 px-2 font-medium text-slate-200 italic underline decoration-slate-600/40">{subj.subjectName}</td>
                                        <td className="py-2 px-2 text-center font-mono text-slate-300">{subj.questionCount}</td>
                                        <td className="py-2 px-2 text-center font-mono text-emerald-400 font-bold">{subj.correct}</td>
                                        <td className="py-2 px-2 text-center font-mono text-rose-400 font-bold">{subj.wrong}</td>
                                        <td className="py-2 px-2 text-center font-mono text-indigo-400 font-extrabold">{formatNet(subj.net)}</td>
                                        <td className="py-2 px-2 text-center font-mono font-bold text-slate-300">%{subj.successRate}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-12 text-center text-slate-400">
                    <p className="text-xs">Detaylarını görmek için sol taraftan bir öğrenci seçin.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MANAGEMENT MODALS --- */}
      {matchModalExam && (
        <MatchStudentModal
          exam={matchModalExam}
          studentUsers={studentUsers}
          availableClasses={classes.map(c => c.name)}
          onClose={() => setMatchModalExam(null)}
          onSaveMatch={(updatedExam) => {
            if (onUpdateInstitutionalExam) {
              onUpdateInstitutionalExam(updatedExam);
            }
          }}
        />
      )}

      {editModalExam && (
        <EditExamModal
          exam={editModalExam}
          onClose={() => setEditModalExam(null)}
          onSaveEdit={(updatedExam) => {
            if (onUpdateInstitutionalExam) {
              onUpdateInstitutionalExam(updatedExam);
            }
          }}
        />
      )}

      {deleteConfirmExam && (
        <DeleteConfirmModal
          exam={deleteConfirmExam}
          onClose={() => setDeleteConfirmExam(null)}
          onConfirmDelete={(examId) => {
            if (onDeleteInstitutionalExam) {
              onDeleteInstitutionalExam(examId);
            }
            if (selectedExamRecordId === examId) {
              setSelectedExamRecordId(null);
            }
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
          onSaveMappings={(newMappings) => {
            setClassMappings(newMappings);
            // Re-trigger class match on current parsed rows if any
            setParsedRows(prev => prev.map(r => {
              const matchedCls = findBestClassMatch(r.fileClassName);
              return {
                ...r,
                selectedClassForMatch: matchedCls !== 'all' ? matchedCls : r.selectedClassForMatch
              };
            }));
          }}
        />
      )}

      {duplicateWarning && (
        <DuplicateConfirmModal
          examTitle={duplicateWarning.examTitle}
          existingCount={duplicateWarning.existingExams.length}
          onClose={() => setDuplicateWarning(null)}
          onOverwrite={handleOverwriteDuplicateExams}
        />
      )}

      {showDeleteAllConfirm && (
        <DeleteAllExamsModal
          totalExamsCount={examsToUse.length}
          onClose={() => setShowDeleteAllConfirm(false)}
          onConfirmDeleteAll={() => {
            if (onDeleteAllInstitutionalExams) {
              onDeleteAllInstitutionalExams();
            }
          }}
        />
      )}
    </div>
  );
};
