import React from 'react';
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
  Unlock
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
  return (
    <>
      {/* Executive Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Takip Edilen Öğrenci</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalStudentsCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Aktif kayıtlı öğrenci</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Sınıf TYT Net Ort.</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{avgTYTNet} <span className="text-xs text-slate-400 font-normal">Net</span></div>
          <p className="text-[10px] text-slate-400 mt-1">Son genel denemeler</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Sınıf AYT Net Ort.</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">{avgAYTNet} <span className="text-xs text-slate-400 font-normal">Net</span></div>
          <p className="text-[10px] text-slate-400 mt-1">Son genel denemeler</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Toplam Çözülen Soru</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">{totalQuestionsSolvedInClass}</div>
          <p className="text-[10px] text-slate-400 mt-1">Haftalık Soru Günlükleri</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Çözülmemiş Hata</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{totalUnresolvedErrorsInClass}</div>
          <p className="text-[10px] text-slate-400 mt-1">Konu hatası bildirimleri</p>
        </div>

      </div>

      {/* Student Matrix Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Öğrenci Performans ve Çalışma Programı Takibi</span>
            </h2>
            
            <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
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
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Öğrenci adı veya sınıf ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shadow-md shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Öğrenci Ekle</span>
            </button>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
            <Users className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-semibold">Kayıtlı öğrenci bulunamadı.</p>
            <p className="text-xs text-slate-400 mt-1">Filtrenizi değiştirebilir veya yeni öğrenci kaydı ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map((student) => {
              const data = studentsData[student.id];
              const profile = data?.profile;
              const lastMock = data?.generalMocks?.[data.generalMocks.length - 1];
              const plansCount = data?.studyPlans?.length || 0;
              const hasCoachNote = Boolean(profile?.coachNotes);

              return (
                <div 
                  key={student.id} 
                  className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all cursor-pointer group flex flex-col h-full relative"
                  onClick={() => handleOpenInspectStudent(student, 'performance')}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative shrink-0">
                      <img 
                        src={student.avatarUrl || DEFAULT_AVATAR} 
                        alt={student.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white/10 shadow-md group-hover:border-indigo-400/50 transition-colors shrink-0" 
                      />
                      <span 
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-sm ${
                          isStudentActive(student.id, studentsData[student.id]) ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                        title={isStudentActive(student.id, studentsData[student.id]) ? 'Aktif Öğrenci (Sistem Kriterlerine Göre)' : 'Pasif Öğrenci (Sistem Kriterlerine Göre)'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-0.5 flex">
                        {isUserOnline(student) ? (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1 whitespace-nowrap" title="Sistemde Çevrimiçi (Online)">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-0.5"></span>
                            <span>Çevrimiçi</span>
                          </span>
                        ) : (
                          <OfflineStatusDisplay 
                            user={student} 
                            className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5 hover:text-slate-200 transition-colors whitespace-nowrap inline-flex" 
                          />
                        )}

                        {(student.isLocked || (student.lockoutUntil && new Date(student.lockoutUntil).getTime() > Date.now())) && (
                          <span className="ml-1.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center space-x-1 whitespace-nowrap" title="Hesap Kilitli">
                            <Lock className="w-3 h-3 text-rose-400" />
                            <span>Kilitli</span>
                          </span>
                        )}
                      </div>
                      <h3 
                        className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isBranchTeacher) {
                            alert('Branş öğretmenlerinin öğrenci profili düzenleme yetkisi yoktur.');
                            return;
                          }
                          setEditingStudentId(student.id);
                          setEditStudentName(student.name);
                          setEditStudentEmail(student.email);
                          setEditStudentClassName(student.className || '');
                          setEditStudentPassword(student.password || '');
                          setShowEditStudentModal(true);
                        }}
                      >
                        {student.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-500/30 whitespace-nowrap">
                          {student.className || '12-A SAY'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                      <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> Hedef</div>
                      <div className="text-xs font-semibold text-slate-200 line-clamp-1" title={profile?.targetUniversity}>
                        {profile?.targetUniversity || 'Üniversite'}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {profile?.targetDepartment || 'Bölüm'} • <strong className="text-amber-300">{profile?.targetRank?.toLocaleString() || '-'}</strong>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                      <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Son Netler</div>
                      <div className="text-sm font-black font-mono">
                        <span className="text-emerald-400">{lastMock?.tyt?.totalNet || '-'}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-purple-400">{lastMock?.ayt?.totalNet || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center space-x-2">
                      <div className="text-[10px] bg-white/5 text-slate-300 px-2.5 py-1 rounded-lg flex items-center space-x-1 font-medium border border-white/5">
                        <BookOpen className="w-3 h-3 text-fuchsia-400" />
                        <span>{plansCount} Görev</span>
                      </div>
                      {hasCoachNote ? (
                        <div className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg flex items-center space-x-1 font-medium border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Koç Notu</span>
                        </div>
                      ) : (
                        <div className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg flex items-center space-x-1 font-medium border border-amber-500/20">
                          <MessageSquare className="w-3 h-3" />
                          <span>Not Yok</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenInspectStudent(student, 'planner')}
                      className="flex-1 py-1.5 bg-fuchsia-600/80 hover:bg-fuchsia-500 text-white rounded-xl text-[11px] font-semibold transition-all border border-fuchsia-400/40 flex items-center justify-center space-x-1.5 shadow-sm"
                      title="Haftalık Çalışma Planını İncele ve Düzenle"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Çalışma Planı</span>
                    </button>

                    <button
                      onClick={() => handleOpenInspectStudent(student, 'performance')}
                      className="flex-1 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-semibold transition-all border border-indigo-400/40 flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detay</span>
                    </button>

                    {onUnlockUserAccount && (student.isLocked || (student.lockoutUntil && new Date(student.lockoutUntil).getTime() > Date.now())) && (
                      <button
                        onClick={() => onUnlockUserAccount(student.id)}
                        className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[11px] font-bold transition-all border border-amber-500/30 flex items-center justify-center space-x-1 shadow-sm shrink-0"
                        title="Hesap Kilidini Aç"
                      >
                        <Unlock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Kilidi Aç</span>
                      </button>
                    )}

                    {isSchoolCounselor && onDeleteStudentAccount && (
                      <button
                        onClick={() => {
                          setStudentToDelete(student);
                          setDeleteConfirmationStep(1);
                          setTypedConfirmName('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-xl transition-all border border-white/10 shrink-0"
                        title="Öğrenciyi Sistemden Kalıcı Olarak Sil"
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
    </>
  );
};
