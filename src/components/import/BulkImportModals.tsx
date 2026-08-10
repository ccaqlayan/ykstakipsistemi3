import React, { useState, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  Users, 
  Link, 
  UserX, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Sliders, 
  Plus 
} from 'lucide-react';
import { UserAccount, InstitutionalMockExam } from '../../types';

// --- 1. Match Student Modal ---
interface MatchStudentModalProps {
  exam: InstitutionalMockExam;
  studentUsers: UserAccount[];
  availableClasses: string[];
  onClose: () => void;
  onSaveMatch: (updatedExam: InstitutionalMockExam) => void;
}

export const MatchStudentModal: React.FC<MatchStudentModalProps> = ({
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

// --- 2. Edit Exam Modal ---
interface EditExamModalProps {
  exam: InstitutionalMockExam;
  onClose: () => void;
  onSaveEdit: (updatedExam: InstitutionalMockExam) => void;
}

export const EditExamModal: React.FC<EditExamModalProps> = ({
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

// --- 3. Delete Confirm Modal ---
interface DeleteConfirmModalProps {
  exam: InstitutionalMockExam;
  onClose: () => void;
  onConfirmDelete: (examId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
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

// --- 4. Delete All Exams Modal ---
interface DeleteAllExamsModalProps {
  onClose: () => void;
  onConfirmDeleteAll: () => void;
  totalExamsCount: number;
}

export const DeleteAllExamsModal: React.FC<DeleteAllExamsModalProps> = ({
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

// --- 5. Edit Series Modal ---
interface EditSeriesModalProps {
  examTitle: string;
  latestDate?: string;
  count: number;
  onClose: () => void;
  onSaveSeries: (oldTitle: string, newTitle: string, newDate: string) => void;
  onDeleteSeries: (titleToDelete: string) => void;
}

export const EditSeriesModal: React.FC<EditSeriesModalProps> = ({
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
                  <strong>3/3 ONAY (SON ONAY):</strong> Silinen {count} adet karne GERİ ALINAMAZ!
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

// --- 6. Class Mapping Modal ---
interface ClassMappingModalProps {
  classMappings: Record<string, string>;
  availableClasses: string[];
  onClose: () => void;
  onSaveMappings: (newMappings: Record<string, string>) => void;
}

export const ClassMappingModal: React.FC<ClassMappingModalProps> = ({
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
            İptal
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kuralları Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 7. Duplicate Confirm Modal ---
interface DuplicateConfirmModalProps {
  examTitle: string;
  existingCount: number;
  onClose: () => void;
  onOverwrite: () => void;
}

export const DuplicateConfirmModal: React.FC<DuplicateConfirmModalProps> = ({
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

