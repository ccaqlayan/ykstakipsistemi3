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
import { UserAccount, InstitutionalMockExam, InstitutionalSubjectDetail, YKSDataState } from '../types';
import { BulkImportCsvTab } from './import/BulkImportCsvTab';

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

export const BulkExamImportView: React.FC<BulkExamImportViewProps> = ({
  currentUser,
  users,
  classes,
  studentsData,
  institutionalMockExams = [],
  onSaveInstitutionalExams,
  onUpdateInstitutionalExam,
  onDeleteInstitutionalExam,
  onAddAuditLog,
  onToggleMenu
}) => {
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

  // Merge institutionalMockExams prop with any exams from studentsData
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

  const findBestClassMatch = (fileClassName: string): string => {
    if (!fileClassName) return 'all';
    const trimmed = fileClassName.trim();
    const normFile = normalizeText(fileClassName);
    if (!normFile) return 'all';

    if (classMappings[trimmed]) return classMappings[trimmed];
    const mappedEntry = Object.entries(classMappings).find(([k]) => normalizeText(k) === normFile);
    if (mappedEntry && mappedEntry[1]) return String(mappedEntry[1]);

    const exact = availableClasses.find(c => normalizeText(c) === normFile);
    if (exact) return exact;

    const partial = availableClasses.find(c => {
      const normC = normalizeText(c);
      return normC.includes(normFile) || normFile.includes(normC);
    });
    if (partial) return partial;

    return 'all';
  };

  return (
    <div className="space-y-6 text-slate-100 max-w-7xl mx-auto px-4 py-6">

      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center space-x-3">
          {onToggleMenu && (
            <button
              onClick={onToggleMenu}
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Toplu Liste Girişi</span>
            </h1>
            <p className="text-xs text-slate-400">Toplu Excel/PDF karne yükleme</p>
          </div>
        </div>
      </div>

      <BulkImportCsvTab
        currentUser={currentUser!}
        studentUsers={studentUsers}
        availableClasses={availableClasses}
        studentsData={studentsData}
        examsToUse={examsToUse}
        onSaveInstitutionalExams={onSaveInstitutionalExams}
        onDeleteInstitutionalExam={onDeleteInstitutionalExam}
        onAddAuditLog={onAddAuditLog}
        getMappedClassName={getMappedClassName}
        findBestClassMatch={findBestClassMatch}
        onImportComplete={() => {}}
      />
    </div>
  );
};
