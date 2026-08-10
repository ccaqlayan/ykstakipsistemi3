import React from 'react';
import { 
  UserCheck, 
  Building2, 
  ShieldCheck, 
  Users, 
  Plus, 
  Edit, 
  Search, 
  UserPlus, 
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';
import { UserAccount, ClassDefinition } from '../../types';
import { DEFAULT_AVATAR } from '../../data/initialData';

interface TeacherTeachersTabProps {
  allUsers: UserAccount[];
  classes: ClassDefinition[];
  teacher: UserAccount;
  setShowCreateClassModal: (show: boolean) => void;
  onUpdateClass?: any;
  setClassToEdit: (cls: ClassDefinition) => void;
  setEditClassNameInput: (name: string) => void;
  setEditClassDescInput: (desc: string) => void;
  setEditClassFieldInput: (field: any) => void;
  setShowEditClassModal: (show: boolean) => void;
  setSelectedClassForTeacherAssign: (cls: ClassDefinition) => void;
  setSelectedTeacherIdsForClass: (ids: string[]) => void;
  setClassTeacherSearchTerm: (term: string) => void;
  setShowClassTeacherAssignModal: (show: boolean) => void;
  teacherSearchTerm: string;
  setTeacherSearchTerm: (term: string) => void;
  setNewTeacherName: (name: string) => void;
  setNewTeacherEmail: (email: string) => void;
  setNewTeacherPassword: (pwd: string) => void;
  setNewTeacherTitle: (title: string) => void;
  setNewTeacherAssignedClasses: (classes: string[]) => void;
  setShowCreateTeacherModal: (show: boolean) => void;
  setEditingTeacherId: (id: string) => void;
  setEditTeacherName: (name: string) => void;
  setEditTeacherEmail: (email: string) => void;
  setEditTeacherTitle: (title: string) => void;
  setEditTeacherRole: (role: any) => void;
  setShowEditTeacherModal: (show: boolean) => void;
  setSelectedTeacherForAssignment: (user: UserAccount) => void;
  setAssignedClassesForSelectedTeacher: (classes: string[]) => void;
  setShowAssignTeacherModal: (show: boolean) => void;
  onDeleteTeacherAccount?: any;
  setTeacherToDelete: (user: UserAccount) => void;
  setDeleteTeacherConfirmationStep: (step: number) => void;
  setTypedTeacherConfirmName: (name: string) => void;
  onUnlockUserAccount?: (userId: string) => void;
  setEditTeacherPassword?: (pwd: string) => void;
}

export const TeacherTeachersTab: React.FC<TeacherTeachersTabProps> = ({
  onUnlockUserAccount,
  setEditTeacherPassword,
  allUsers,
  classes,
  teacher,
  setShowCreateClassModal,
  onUpdateClass,
  setClassToEdit,
  setEditClassNameInput,
  setEditClassDescInput,
  setEditClassFieldInput,
  setShowEditClassModal,
  setSelectedClassForTeacherAssign,
  setSelectedTeacherIdsForClass,
  setClassTeacherSearchTerm,
  setShowClassTeacherAssignModal,
  teacherSearchTerm,
  setTeacherSearchTerm,
  setNewTeacherName,
  setNewTeacherEmail,
  setNewTeacherPassword,
  setNewTeacherTitle,
  setNewTeacherAssignedClasses,
  setShowCreateTeacherModal,
  setEditingTeacherId,
  setEditTeacherName,
  setEditTeacherEmail,
  setEditTeacherTitle,
  setEditTeacherRole,
  setShowEditTeacherModal,
  setSelectedTeacherForAssignment,
  setAssignedClassesForSelectedTeacher,
  setShowAssignTeacherModal,
  onDeleteTeacherAccount,
  setTeacherToDelete,
  setDeleteTeacherConfirmationStep,
  setTypedTeacherConfirmName
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Executive Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Okul Öğretmen Sayısı</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {allUsers.filter(u => u.role === 'class_teacher' || u.role === 'teacher' || u.role === 'school_counselor').length}
            </div>
            <p className="text-[10px] text-purple-300 mt-0.5">Kayıtlı Öğretmen Kadrosu</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Tanımlı Okul Sınıfları</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {classes.length}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Aktif Sınıf Şubeleri</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Atanmış Sınıf Şubeleri</span>
            <div className="text-2xl font-black text-indigo-300 font-mono mt-1">
              {Array.from(new Set(allUsers.flatMap(u => u.assignedClassNames || []))).length}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Rehber Öğretmeni Olan Sınıflar</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Toplam Öğrenci Kapasitesi</span>
            <div className="text-2xl font-black text-amber-300 font-mono mt-1">
              {allUsers.filter(u => u.role === 'student').length}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sınıflardaki Öğrenciler</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Section 1: Class Definitions & Assignments Overview */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span>Sınıf Tanımları ve Sınıf Rehber Öğretmenleri</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Okuldaki mevcut tüm sınıf şubelerini yönetin, yeni sınıf tanımı ekleyin veya sınıfların öğretmen atamalarını düzenleyin/silin.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowCreateClassModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 border border-emerald-400/30 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Sınıf Tanımı Ekle</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const assignedTeachers = allUsers.filter(u => 
              (u.role === 'class_teacher' || u.role === 'teacher' || u.role === 'school_counselor') &&
              u.assignedClassNames?.includes(cls.name)
            );
            const studentsInClass = allUsers.filter(u => u.role === 'student' && u.className === cls.name);

            return (
              <div key={cls.id} className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-3 hover:border-emerald-500/40 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      {cls.name}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{cls.name} Şubesi</h3>
                    {cls.description && <p className="text-[11px] text-slate-400 mt-0.5">{cls.description}</p>}
                  </div>

                  {onUpdateClass && (
                    <button
                      onClick={() => {
                        setClassToEdit(cls);
                        setEditClassNameInput(cls.name);
                        setEditClassDescInput(cls.description || '');
                        setEditClassFieldInput(cls.field || 'SAY');
                        setShowEditClassModal(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 rounded-xl transition-all border border-white/10"
                      title="Sınıf Tanımını Düzenle"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Atanmış Rehber Öğretmen:</span>
                    <div className="font-semibold text-right">
                      {assignedTeachers.length > 0 ? (
                        assignedTeachers.map(t => (
                          <span key={t.id} className="text-purple-300 block">{t.name}</span>
                        ))
                      ) : (
                        <span className="text-amber-400 text-[11px]">Atama Yapılmadı</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Kayıtlı Öğrenci:</span>
                    <span className="font-mono text-white font-bold">{studentsInClass.length} Öğrenci</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => {
                      const assignedIds = allUsers
                        .filter(u => (u.role === 'class_teacher' || u.role === 'teacher' || u.role === 'school_counselor') && u.assignedClassNames?.includes(cls.name))
                        .map(u => u.id);
                      setSelectedClassForTeacherAssign(cls);
                      setSelectedTeacherIdsForClass(assignedIds);
                      setClassTeacherSearchTerm('');
                      setShowClassTeacherAssignModal(true);
                    }}
                    className="w-full bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Sınıf Atamasını Düzenle</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Teacher Users Management Table & Actions */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              <span>Öğretmen Kadrosu & Sınıf Yetki Tanımları</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Öğretmenlerin sorumlu olduğu sınıfları tanımlayabilir, değiştirebilir veya öğretmen hesabını silebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Öğretmen ara..."
                value={teacherSearchTerm}
                onChange={(e) => setTeacherSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            <button
              onClick={() => {
                setNewTeacherName('');
                setNewTeacherEmail('');
                setNewTeacherPassword('123456');
                setNewTeacherTitle('Sınıf Rehber Öğretmeni');
                setNewTeacherAssignedClasses([]);
                setShowCreateTeacherModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-purple-600/20 border border-purple-400/30 flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yeni Öğretmen Hesabı Tanımla</span>
            </button>
          </div>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allUsers
            .filter(u => u.role === 'class_teacher' || u.role === 'teacher' || u.role === 'school_counselor')
            .filter(u => 
              teacherSearchTerm === '' ||
              u.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
              u.email.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
              (u.assignedClassNames || []).some(c => c.toLowerCase().includes(teacherSearchTerm.toLowerCase()))
            )
            .map((tUser) => {
              const assignedList = tUser.assignedClassNames || [];
              const totalStudentsCount = allUsers.filter(u => u.role === 'student' && assignedList.includes(u.className || '')).length;

              return (
                <div 
                  key={tUser.id} 
                  className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg hover:border-purple-500/50 hover:bg-slate-800/60 transition-all group flex flex-col h-full relative"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <img 
                      src={tUser.avatarUrl || DEFAULT_AVATAR} 
                      alt={tUser.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-white/10 shadow-md group-hover:border-purple-400/50 transition-colors shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <h3 
                          className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate hover:underline cursor-pointer"
                          onClick={() => {
                            setEditingTeacherId(tUser.id);
                            setEditTeacherName(tUser.name);
                            setEditTeacherEmail(tUser.email);
                            setEditTeacherTitle(tUser.title || 'Sınıf Rehber Öğretmeni');
                            setEditTeacherRole(tUser.role as any);
                            if (setEditTeacherPassword) setEditTeacherPassword('');
                            setShowEditTeacherModal(true);
                          }}
                        >
                          {tUser.name}
                        </h3>
                        {tUser.role === 'school_counselor' && (
                          <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded-md border border-purple-400/30 font-semibold whitespace-nowrap">
                            Okul Rehberlik Yetkilisi
                          </span>
                        )}
                        {(tUser.isLocked || (tUser.lockoutUntil && new Date(tUser.lockoutUntil).getTime() > Date.now())) && (
                          <span className="text-[9px] bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded-md border border-rose-400/30 font-semibold flex items-center gap-1 whitespace-nowrap" title="Hesap Kilitli">
                            <Lock className="w-2.5 h-2.5 text-rose-400" />
                            <span>Kilitli</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-slate-400 mb-0.5">
                        {tUser.title || 'Sınıf Rehber Öğretmeni'}
                      </div>
                      
                      <div className="text-[10px] text-slate-400 truncate">
                        {tUser.email}
                      </div>
                      <div className="text-[10px] text-purple-300/80 font-semibold mt-0.5">
                        {tUser.role === 'school_counselor' 
                          ? 'Okul Rehber Öğretmeni' 
                          : tUser.role === 'class_teacher' 
                          ? 'Sınıf Rehber Öğretmeni' 
                          : tUser.role === 'teacher' 
                          ? 'Branş Öğretmeni' 
                          : 'Öğrenci'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 mb-4 flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3"/> Atanmış Sınıflar
                      </div>
                      <div className="text-[10px] font-bold text-emerald-400 font-mono">
                        {totalStudentsCount} Öğrenci
                      </div>
                    </div>
                    {assignedList.length === 0 ? (
                      <span className="text-[11px] text-amber-400 italic bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 inline-block w-fit mt-1">
                        Atanmış sınıf yok
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {assignedList.map(cName => (
                          <span key={cName} className="text-[10px] font-bold bg-purple-500/20 text-purple-200 px-2.5 py-1 rounded-lg border border-purple-500/30">
                            {cName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-white/10 mt-auto">
                    <button
                      onClick={() => {
                        setSelectedTeacherForAssignment(tUser);
                        setAssignedClassesForSelectedTeacher(assignedList);
                        setShowAssignTeacherModal(true);
                      }}
                      className="w-full py-1.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-xl text-[11px] font-semibold transition-all border border-purple-400/40 flex items-center justify-center space-x-1.5 shadow-sm"
                      title="Sınıf Atamalarını Değiştir veya Ekle"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Sınıf Atamalarını Düzenle</span>
                    </button>

                    <div className="flex items-center gap-2 mt-2">
                      {onUnlockUserAccount && (tUser.isLocked || (tUser.lockoutUntil && new Date(tUser.lockoutUntil).getTime() > Date.now())) && (
                        <button
                          onClick={() => onUnlockUserAccount(tUser.id)}
                          className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[11px] font-semibold transition-all border border-amber-500/30 flex items-center justify-center space-x-1"
                          title="Hesap Kilidini Aç"
                        >
                          <Unlock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Kilidi Aç</span>
                        </button>
                      )}

                      {onDeleteTeacherAccount && tUser.id !== teacher.id && (
                        <button
                          onClick={() => {
                            setTeacherToDelete(tUser);
                            setDeleteTeacherConfirmationStep(1);
                            setTypedTeacherConfirmName('');
                          }}
                          className="w-full py-1.5 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-xl transition-all border border-white/10 flex items-center justify-center"
                          title="Öğretmen Hesabını Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold ml-1.5">Hesabı Sil</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

    </div>
  );
};
