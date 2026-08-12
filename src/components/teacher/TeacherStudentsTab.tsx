import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  BarChart3, 
  BookOpen, 
  AlertTriangle, 
  Filter, 
  Search, 
  UserPlus, 
  Target, 
  CheckCircle2, 
  MessageSquare, 
  Calendar, 
  Eye, 
  Trash2,
  Lock,
  Unlock,
  Pencil,
  X
} from 'lucide-react';
import { UserAccount, YKSDataState } from '../../types';
import { DEFAULT_AVATAR } from '../../data/initialData';
import { isUserOnline, isStudentActive } from '../../utils/statusUtils';

interface TeacherStudentsTabProps {
  totalStudentsCount: number;
  avgTYTNet: number | string;
  avgAYTNet: number | string;
  totalQuestionsSolvedInClass: number;
  totalUnresolvedErrorsInClass: number;
  selectedClassFilter: string;
  setSelectedClassFilter: (className: string) => void;
  isSchoolCounselor: boolean;
  availableClasses: string[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  newStudentClass: string;
  setNewStudentClass: (className: string) => void;
  setShowCreateStudentModal: (show: boolean) => void;
  filteredStudents: UserAccount[];
  studentsData: Record<string, YKSDataState>;
  handleOpenInspectStudent: (student: UserAccount, tab: any) => void;
  isBranchTeacher: boolean;
  setEditingStudentId: (id: string) => void;
  setEditStudentName: (name: string) => void;
  setEditStudentEmail: (email: string) => void;
  setEditStudentClassName: (className: string) => void;
  setEditStudentPassword: (password: string) => void;
  setShowEditStudentModal: (show: boolean) => void;
  onDeleteStudentAccount?: any;
  setStudentToDelete: (student: UserAccount) => void;
  setDeleteConfirmationStep: (step: number) => void;
  setTypedConfirmName: (name: string) => void;
  OfflineStatusDisplay: React.FC<{ user: UserAccount; className?: string }>;
  onUnlockUserAccount?: (userId: string) => void;
}

export const TeacherStudentsTab: React.FC<TeacherStudentsTabProps> = ({
  onUnlockUserAccount,
  totalStudentsCount,
  avgTYTNet,
  avgAYTNet,
  totalQuestionsSolvedInClass,
  totalUnresolvedErrorsInClass,
  selectedClassFilter,
  setSelectedClassFilter,
  isSchoolCounselor,
  availableClasses,
  searchTerm,
  setSearchTerm,
  newStudentClass,
  setNewStudentClass,
  setShowCreateStudentModal,
  filteredStudents,
  studentsData,
  handleOpenInspectStudent,
  isBranchTeacher,
  setEditingStudentId,
  setEditStudentName,
  setEditStudentEmail,
  setEditStudentClassName,
  setEditStudentPassword,
  setShowEditStudentModal,
  onDeleteStudentAccount,
  setStudentToDelete,
  setDeleteConfirmationStep,
  setTypedConfirmName,
  OfflineStatusDisplay
}) => {
  const [selectedCoachNoteStudent, setSelectedCoachNoteStudent] = useState<{ name: string; notes: string } | null>(null);

  return (
    <div className="space-y-6 font-sans">
      {/* Executive Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-4 shadow-xl hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">Takip Edilen Öğrenci</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shadow-inner">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalStudentsCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Aktif kayıtlı öğrenci</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 shadow-xl hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">Sınıf TYT Net Ort.</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{avgTYTNet} <span className="text-xs text-slate-400 font-normal">Net</span></div>
          <p className="text-[10px] text-slate-400 mt-1">Son genel denemeler</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 shadow-xl hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">Sınıf AYT Net Ort.</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shadow-inner">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">{avgAYTNet} <span className="text-xs text-slate-400 font-normal">Net</span></div>
          <p className="text-[10px] text-slate-400 mt-1">Son genel denemeler</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4 shadow-xl hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">Toplam Çözülen Soru</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center shadow-inner">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">{totalQuestionsSolvedInClass}</div>
          <p className="text-[10px] text-slate-400 mt-1">Haftalık Soru Günlükleri</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-4 shadow-xl hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">Çözülmemiş Hata</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{totalUnresolvedErrorsInClass}</div>
          <p className="text-[10px] text-slate-400 mt-1">Konu hatası bildirimleri</p>
        </div>

      </div>

      {/* Student Matrix Container */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2 className="text-base font-black text-white">Öğrenci Listesi ve İlerleme Paneli</h2>
            </div>
            
            <div className="flex items-center space-x-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10">
              <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="bg-transparent text-xs text-white font-bold border-none focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">
                  {isSchoolCounselor ? 'Tüm Okul Sınıfları (Tümü)' : `Tüm Atanmış Sınıflarım (${availableClasses.join(', ')})`}
                </option>
                {availableClasses.map((clsName) => (
                  <option key={clsName} value={clsName} className="bg-slate-900">{clsName}</option>
                ))}
              </select>
            </div>

            <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-lg font-mono">
              {filteredStudents.length} öğrenci
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Öğrenci adı veya sınıf ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
              />
            </div>

            <button
              onClick={() => {
                if (!newStudentClass && availableClasses.length > 0) {
                  setNewStudentClass(availableClasses[0]);
                }
                setShowCreateStudentModal(true);
              }}
              id="create-student-btn-table"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer border border-indigo-400/40"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Öğrenci Ekle</span>
            </button>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-3xl bg-slate-950/40 space-y-2">
            <Users className="w-12 h-12 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-300 font-bold">Kayıtlı öğrenci bulunamadı.</p>
            <p className="text-xs text-slate-400">Filtrenizi değiştirebilir veya yeni öğrenci kaydı ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map((student) => {
              const data = studentsData[student.id];
              const profile = data?.profile;
              const lastMock = data?.generalMocks?.[data.generalMocks.length - 1];
              const plans = data?.studyPlans || [];
              const totalPlansCount = plans.length;
              const completedPlansCount = plans.filter(p => p.status === 'completed' || (p.completedMinutes && p.completedMinutes > 0)).length;
              const planPct = totalPlansCount > 0 ? Math.round((completedPlansCount / totalPlansCount) * 100) : 0;
              
              const hasCoachNote = Boolean(profile?.coachNotes && profile.coachNotes.trim() !== '');
              const unresolvedErrorsCount = (data?.topicErrors || []).filter(e => !e.revised).length;

              return (
                <div 
                  key={student.id} 
                  className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all duration-300 hover:-translate-y-1 cursor-pointer group flex flex-col justify-between h-full relative space-y-4"
                  onClick={() => handleOpenInspectStudent(student, 'performance')}
                >
                  {/* Top Card Header: Full room for student name */}
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="relative shrink-0">
                        <img 
                          src={student.avatarUrl || DEFAULT_AVATAR} 
                          alt={student.name}
                          className="w-13 h-13 rounded-2xl object-cover border-2 border-white/15 shadow-md group-hover:border-indigo-400/60 transition-colors" 
                        />
                        <span 
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 shadow-sm ${
                            isStudentActive(student.id, studentsData[student.id]) ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                          title={isStudentActive(student.id, studentsData[student.id]) ? 'Aktif Öğrenci' : 'Pasif Öğrenci'}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3 
                            className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors leading-snug break-words"
                          >
                            {student.name}
                          </h3>

                          {!isBranchTeacher && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStudentId(student.id);
                                setEditStudentName(student.name);
                                setEditStudentEmail(student.email);
                                setEditStudentClassName(student.className || '');
                                setEditStudentPassword('');
                                setShowEditStudentModal(true);
                              }}
                              className="text-slate-500 hover:text-indigo-400 transition-colors p-1 rounded shrink-0"
                              title="Öğrenci Bilgilerini Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30 whitespace-nowrap">
                            {student.className || 'Sınıfsız'}
                          </span>
                          {profile?.targetField && (
                            <span className="text-[9px] font-bold bg-fuchsia-500/20 text-fuchsia-300 px-1.5 py-0.5 rounded-md border border-fuchsia-500/30">
                              {profile.targetField}
                            </span>
                          )}
                          {isUserOnline(student) ? (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/30 flex items-center space-x-1 whitespace-nowrap" title="Çevrimiçi">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>Online</span>
                            </span>
                          ) : (
                            <OfflineStatusDisplay 
                              user={student} 
                              className="text-[9px] text-slate-400 font-medium px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 whitespace-nowrap inline-flex" 
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stacked Horizontal Rectangles (Hedef & Son Deneme) */}
                    <div className="space-y-2">
                      {/* Target Rectangle Box */}
                      <div className="bg-slate-900/90 rounded-2xl p-3 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-indigo-400" />
                            <span>Hedef Üniversite & Bölüm</span>
                          </span>
                          {profile?.targetRank && (
                            <span className="text-amber-300 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              #{profile.targetRank.toLocaleString()} Sıralama
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                          <span>{profile?.targetUniversity || 'Üniversite Belirtilmedi'}</span>
                          {profile?.targetDepartment && (
                            <span className="text-slate-400 font-normal">• {profile.targetDepartment}</span>
                          )}
                        </div>
                      </div>

                      {/* Last Mock Net Rectangle Box */}
                      <div className="bg-slate-900/90 rounded-2xl p-3 border border-white/5 flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span>Son Deneme Netleri</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            TYT: <strong className="text-white ml-0.5">{lastMock?.tyt?.totalNet || '-'}</strong>
                          </span>
                          <span className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                            AYT: <strong className="text-white ml-0.5">{lastMock?.ayt?.totalNet || '-'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Task Progress Bar Box */}
                    <div className="bg-slate-900/90 rounded-2xl p-3 border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                          <span>Haftalık Çalışma Planı</span>
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          <strong className="text-fuchsia-300 font-bold">{completedPlansCount}</strong> / {totalPlansCount} Görev ({planPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${planPct}%` }} 
                        />
                      </div>
                    </div>

                    {/* Quick Metric Pills (Coach Note & Unresolved Errors) */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {hasCoachNote ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCoachNoteStudent({ name: student.name, notes: profile?.coachNotes || '' });
                          }}
                          className="text-[10px] bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 px-2.5 py-1 rounded-xl flex items-center space-x-1 font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>Koç Notu Var (Tıkla Gör)</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCoachNoteStudent({ name: student.name, notes: '' });
                          }}
                          className="text-[10px] bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 px-2.5 py-1 rounded-xl flex items-center space-x-1 font-medium border border-amber-500/30 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 shrink-0 text-amber-400" />
                          <span>Not Eklenmedi</span>
                        </button>
                      )}

                      {unresolvedErrorsCount > 0 && (
                        <div className="text-[10px] bg-rose-500/15 text-rose-300 px-2 py-1 rounded-xl flex items-center space-x-1 font-bold border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3 shrink-0 text-rose-400" />
                          <span>{unresolvedErrorsCount} Hata</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex items-center space-x-2 pt-3 border-t border-white/10 mt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenInspectStudent(student, 'planner')}
                      className="flex-1 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-[11px] font-bold transition-all border border-fuchsia-400/40 flex items-center justify-center space-x-1.5 shadow-md shadow-fuchsia-600/20 cursor-pointer"
                      title="Haftalık Çalışma Planını İncele"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Çalışma Planı</span>
                    </button>

                    <button
                      onClick={() => handleOpenInspectStudent(student, 'performance')}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold transition-all border border-indigo-400/40 flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detay</span>
                    </button>

                    {onUnlockUserAccount && (student.isLocked || (student.lockoutUntil && new Date(student.lockoutUntil).getTime() > Date.now())) && (
                      <button
                        onClick={() => onUnlockUserAccount(student.id)}
                        className="px-2.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[11px] font-bold transition-all border border-amber-500/30 flex items-center justify-center space-x-1 shadow-sm shrink-0 cursor-pointer"
                        title="Hesap Kilidini Aç"
                      >
                        <Unlock className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    )}

                    {isSchoolCounselor && onDeleteStudentAccount && (
                      <button
                        onClick={() => {
                          setStudentToDelete(student);
                          setDeleteConfirmationStep(1);
                          setTypedConfirmName('');
                        }}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-xl transition-all border border-white/10 shrink-0 cursor-pointer"
                        title="Öğrenciyi Kalıcı Olarak Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Small Coach Note Popup Modal */}
      {selectedCoachNoteStudent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedCoachNoteStudent(null)}
        >
          <div 
            className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Koç Değerlendirme Notu</h3>
              </div>
              <button
                onClick={() => setSelectedCoachNoteStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-indigo-300 block">{selectedCoachNoteStudent.name}</span>
              <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed font-sans max-h-60 overflow-y-auto whitespace-pre-wrap">
                {selectedCoachNoteStudent.notes.trim() !== '' 
                  ? selectedCoachNoteStudent.notes 
                  : 'Henüz bu öğrenci için rehberlik/koç değerlendirme notu girilmemiş.'}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedCoachNoteStudent(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/30 border border-indigo-400/40"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
