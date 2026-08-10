import React from 'react';
import { X, StickyNote } from 'lucide-react';
import { UserAccount } from '../../types';

interface DashboardSubjectNotesModalProps {
  activeNotesSubject: string | null;
  studentNoteDraft: string;
  setStudentNoteDraft: (v: string) => void;
  teacherNoteDraft: string;
  setTeacherNoteDraft: (v: string) => void;
  currentUser?: UserAccount | null;
  onSaveNotes: () => void;
  onClose: () => void;
  onUpdateSubjectNotes?: (subjectName: string, notes: { studentNote?: string; teacherNote?: string }) => void;
}

export const DashboardSubjectNotesModal: React.FC<DashboardSubjectNotesModalProps> = ({
  activeNotesSubject,
  studentNoteDraft,
  setStudentNoteDraft,
  teacherNoteDraft,
  setTeacherNoteDraft,
  currentUser,
  onSaveNotes,
  onClose,
  onUpdateSubjectNotes
}) => {
  if (!activeNotesSubject) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-2 pb-2 border-b border-white/10">
          <StickyNote className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">{activeNotesSubject} Not Defteri</h3>
            <p className="text-[10px] text-slate-400">Özel çalışma notları ve öğretmen koçluk yönlendirmeleri</p>
          </div>
        </div>

        {/* Note Fields */}
        <div className="space-y-4">
          
          {/* STUDENT NOTE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {currentUser?.role === 'student' ? 'Benim Özel Notum' : 'Öğrencinin Özel Notu'}
            </label>
            {currentUser?.role === 'student' ? (
              <textarea
                rows={4}
                value={studentNoteDraft}
                onChange={(e) => setStudentNoteDraft(e.target.value)}
                placeholder="Bu ders için kendinize özel hatırlatmalar, formüller veya hedefler yazın..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all font-sans resize-none"
              />
            ) : (
              <div className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 italic min-h-[80px] select-none whitespace-pre-wrap">
                {studentNoteDraft || 'Öğrenci henüz özel bir not eklememiş.'}
              </div>
            )}
            <p className="text-[10px] text-slate-500 italic">
              {currentUser?.role === 'student' ? 'Bu not sadece sizin tarafınızdan görülebilir ve düzenlenebilir.' : 'Bu not sadece öğrenci tarafından düzenlenebilir.'}
            </p>
          </div>

          {/* TEACHER NOTE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Öğretmen / Koç Notu
            </label>
            {currentUser?.role !== 'student' ? (
              <textarea
                rows={4}
                value={teacherNoteDraft}
                onChange={(e) => setTeacherNoteDraft(e.target.value)}
                placeholder="Öğrenciniz için bu derse özel koçluk tavsiyeleri ve yönlendirmeleri yazın..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all font-sans resize-none"
              />
            ) : (
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-3 py-2.5 text-xs text-slate-200 min-h-[80px] whitespace-pre-wrap">
                {teacherNoteDraft ? (
                  teacherNoteDraft
                ) : (
                  <span className="text-slate-500 italic">Öğretmeniniz veya koçunuz henüz bu derse özel bir not eklememiş.</span>
                )}
              </div>
            )}
            <p className="text-[10px] text-indigo-400/80 italic font-medium">
              {currentUser?.role !== 'student' ? 'Bu not öğrenci tarafından ders kutucuğunda anında görüntülenecektir.' : 'Bu not öğretmeniniz / koçunuz tarafından sizin gelişiminiz için eklenmiştir.'}
            </p>
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Kapat
          </button>
          {((currentUser?.role === 'student' && onUpdateSubjectNotes) || (currentUser?.role !== 'student' && onUpdateSubjectNotes)) && (
            <button
              type="button"
              onClick={onSaveNotes}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 transition-colors cursor-pointer"
            >
              Kaydet
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
