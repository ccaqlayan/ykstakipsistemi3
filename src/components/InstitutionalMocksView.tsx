import React, { useState, useMemo, useCallback } from 'react';
import { 
  BarChart3, 
  Menu
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
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Modals for record management
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
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
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
