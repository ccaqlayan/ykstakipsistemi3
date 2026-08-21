import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Calculator,
  ArrowUpRight,
  BarChart2,
  Share2
} from 'lucide-react';
import { SchoolExam, StudentProfile, UserAccount } from '../types';
import { SchoolExamModal } from './school_exams/SchoolExamModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getGradeLevel, getGradeDisplayName } from '../utils/gradeUtils';
import { GRADE9_SUBJECT_NAMES } from '../data/curriculum/grade9';
import { GRADE10_SUBJECT_NAMES } from '../data/curriculum/grade10';
import { GRADE11_SUBJECT_NAMES } from '../data/curriculum/grade11';

interface SchoolExamsViewProps {
  schoolExams: SchoolExam[];
  profile: StudentProfile;
  currentUser: UserAccount;
  onAddSchoolExam: (exam: Omit<SchoolExam, 'id'>) => void;
  onUpdateSchoolExam: (exam: SchoolExam) => void;
  onDeleteSchoolExam: (id: string) => void;
  onUpdateProfile?: (updatedProfile: StudentProfile) => void;
}

export const SchoolExamsView: React.FC<SchoolExamsViewProps> = ({
  schoolExams = [],
  profile,
  currentUser,
  onAddSchoolExam,
  onUpdateSchoolExam,
  onDeleteSchoolExam,
  onUpdateProfile
}) => {
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<SchoolExam | null>(null);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [isTargetGpaModalOpen, setIsTargetGpaModalOpen] = useState(false);
  const [customTargetGpa, setCustomTargetGpa] = useState(profile.schoolGpaTarget?.toString() || '90.0');

  const gradeLevel = getGradeLevel(profile.className || currentUser.className);

  // Available subjects based on grade
  const availableSubjects = useMemo(() => {
    switch (gradeLevel) {
      case '9':
        return GRADE9_SUBJECT_NAMES.length > 0 ? GRADE9_SUBJECT_NAMES : [
          'Matematik', 'Türk Dili ve Edebiyatı', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Din Kültürü', 'İngilizce'
        ];
      case '10':
        return GRADE10_SUBJECT_NAMES.length > 0 ? GRADE10_SUBJECT_NAMES : [
          'Matematik', 'Türk Dili ve Edebiyatı', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü', 'İngilizce'
        ];
      case '11':
        return [
          '11. Sınıf Matematik', '11. Sınıf Fizik', '11. Sınıf Kimya', '11. Sınıf Biyoloji',
          '11. Sınıf Türk Dili ve Edebiyatı', '11. Sınıf Tarih', '11. Sınıf Coğrafya', '11. Sınıf Felsefe', 'İngilizce'
        ];
      default:
        return ['Matematik', 'Türk Dili ve Edebiyatı', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe'];
    }
  }, [gradeLevel]);

  // Filter exams by selected semester
  const semesterExams = useMemo(() => {
    return schoolExams.filter(e => e.semester === selectedSemester);
  }, [schoolExams, selectedSemester]);

  // Group exams by subject
  const subjectGroups = useMemo(() => {
    const groups: Record<string, { exam1?: SchoolExam; exam2?: SchoolExam; avg?: number }> = {};
    
    // First initialize from available subjects
    availableSubjects.forEach(sub => {
      groups[sub] = {};
    });

    // Populate with existing exams
    semesterExams.forEach(exam => {
      if (!groups[exam.subject]) {
        groups[exam.subject] = {};
      }
      if (exam.examNumber === 1) {
        groups[exam.subject].exam1 = exam;
      } else if (exam.examNumber === 2) {
        groups[exam.subject].exam2 = exam;
      }
    });

    // Calculate averages
    Object.keys(groups).forEach(sub => {
      const g = groups[sub];
      if (g.exam1 && g.exam2) {
        g.avg = (g.exam1.score + g.exam2.score) / 2;
      } else if (g.exam1) {
        g.avg = g.exam1.score;
      } else if (g.exam2) {
        g.avg = g.exam2.score;
      }
    });

    return groups;
  }, [semesterExams, availableSubjects]);

  // Overall semester GPA calculation
  const overallSemesterGpa = useMemo(() => {
    const scoredSubjects = Object.values(subjectGroups).filter(g => g.avg !== undefined);
    if (scoredSubjects.length === 0) return 0;
    const total = scoredSubjects.reduce((acc, curr) => acc + (curr.avg || 0), 0);
    return Math.round((total / scoredSubjects.length) * 100) / 100;
  }, [subjectGroups]);

  // Estimated OBP and YKS Contribution
  const estimatedObp = Math.round(overallSemesterGpa * 5 * 100) / 100; // OBP = GPA * 5 (Max 500)
  const yksPointContribution = Math.round(estimatedObp * 0.12 * 100) / 100; // YKS Yerleştirme katkısı = OBP * 0.12 (Max 60)

  // Certificate Status
  const certificateStatus = useMemo(() => {
    if (overallSemesterGpa >= 85) {
      return { title: 'Takdir Belgesi Adayı', color: 'emerald', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    }
    if (overallSemesterGpa >= 70) {
      return { title: 'Teşekkür Belgesi Adayı', color: 'indigo', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    }
    if (overallSemesterGpa >= 50) {
      return { title: 'Doğrudan Sınıf Geçme', color: 'amber', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    }
    return { title: 'Geliştirilmeli (Risk)', color: 'rose', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  }, [overallSemesterGpa]);

  const handleSaveExam = (examData: Omit<SchoolExam, 'id'> | SchoolExam) => {
    if ('id' in examData) {
      onUpdateSchoolExam(examData as SchoolExam);
    } else {
      onAddSchoolExam(examData);
    }
  };

  const handleSaveTargetGpa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;
    const gpa = parseFloat(customTargetGpa);
    if (!isNaN(gpa)) {
      onUpdateProfile({
        ...profile,
        schoolGpaTarget: Math.max(0, Math.min(100, gpa))
      });
    }
    setIsTargetGpaModalOpen(false);
  };

  const handleShareWhatsAppReport = () => {
    const studentName = profile.name || currentUser.name || 'Öğrenci';
    const scoredList = Object.entries(subjectGroups).filter(([_, g]) => g.avg !== undefined);

    let text = `🎓 *${studentName} - ${getGradeDisplayName(gradeLevel)} Okul Yazılı Sınav Karnesi* 🎓\n` +
      `📅 *${selectedSemester}. Dönem Not Dökümü*\n\n` +
      `📊 *Dönem Karne Ortalaması:* ${overallSemesterGpa > 0 ? overallSemesterGpa.toFixed(2) : '-'} / 100 (${certificateStatus.title})\n` +
      `🎯 *Tahmini OBP:* ${estimatedObp > 0 ? estimatedObp.toFixed(1) : '-'} / 500\n` +
      `🚀 *YKS Yerleştirme Puanı Katkısı:* ${yksPointContribution > 0 ? `+${yksPointContribution.toFixed(2)}` : '-'} Puan\n\n` +
      `📝 *Ders Bazlı Yazılı Notları:*\n`;

    scoredList.forEach(([sub, g]) => {
      text += `• ${sub}: ${g.avg?.toFixed(1)} Puan`;
      if (g.exam1 && g.exam2) {
        text += ` (1. Yazılı: ${g.exam1.score}, 2. Yazılı: ${g.exam2.score})`;
      }
      text += '\n';
    });

    text += `\n_MEB Türkiye Yüzyılı Maarif Modeli & Akıllı Öğrenci Takip Sistemi_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              <GraduationCap className="w-4 h-4" />
              <span>{getGradeDisplayName(gradeLevel)} • MEB Okul Yazılıları & OBP Takibi</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Okul Yazılı Sınav Karnesi & Başarı Puanı
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              1. ve 2. dönem yazılı sınav notlarınızı girin; karne not ortalamanızı ve YKS'ye doğrudan etki eden OBP (+{yksPointContribution} puan) katkınızı anlık hesaplayın.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsAppReport}
              className="px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-2xl transition-all flex items-center space-x-1.5 shadow-sm"
              title="Yazılı sınav notlarını WhatsApp formatında veliyle paylaşın"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp İle Paylaş</span>
            </button>

            {/* Semester Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
              <button
                onClick={() => setSelectedSemester(1)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  selectedSemester === 1
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Dönem
              </button>
              <button
                onClick={() => setSelectedSemester(2)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  selectedSemester === 2
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Dönem
              </button>
            </div>

            {/* Add Exam Button */}
            <button
              onClick={() => {
                setEditingExam(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Yazılı Notu Ekle</span>
            </button>
          </div>
        </div>

        {/* KPI Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* Semester GPA */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>{selectedSemester}. Dönem Ortalaması</span>
              <Award className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              {overallSemesterGpa > 0 ? overallSemesterGpa.toFixed(2) : '-'}
            </div>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${certificateStatus.bg}`}>
                {overallSemesterGpa > 0 ? certificateStatus.title : 'Not bekleniyor'}
              </span>
            </div>
          </div>

          {/* Target GPA */}
          <div 
            onClick={() => setIsTargetGpaModalOpen(true)}
            className="bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 cursor-pointer group transition-all"
            title="Hedef Karne Notunuzu Güncellemek İçin Tıklayın"
          >
            <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>Hedef Karne Notu</span>
              <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-indigo-400 group-hover:text-indigo-300">
              {profile.schoolGpaTarget ? profile.schoolGpaTarget.toFixed(2) : '90.00'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {overallSemesterGpa > 0 && profile.schoolGpaTarget ? (
                overallSemesterGpa >= profile.schoolGpaTarget ? (
                  <span className="text-emerald-400 font-bold">✓ Hedefe ulaşıldı</span>
                ) : (
                  <span className="text-amber-400">Hedefe {(profile.schoolGpaTarget - overallSemesterGpa).toFixed(1)} puan</span>
                )
              ) : (
                'Tıklayıp hedef belirleyin'
              )}
            </div>
          </div>

          {/* Estimated OBP */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>Tahmini OBP (Diploma)</span>
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {estimatedObp > 0 ? estimatedObp.toFixed(1) : '-'}
              <span className="text-xs text-slate-500 font-normal"> / 500</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Dönem karne notu × 5
            </div>
          </div>

          {/* YKS Point Boost */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>YKS Yerleştirme Katkısı</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
              {yksPointContribution > 0 ? `+${yksPointContribution.toFixed(2)}` : '-'}
              <span className="text-xs text-slate-500 font-normal"> Puan</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1">
              OBP × 0.12 doğrudan eklenir
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: VISUAL EXAM COMPARISON BARS */}
      {Object.values(subjectGroups).some(g => g.avg !== undefined) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <span>Ders Bazlı Yazılı Notu & Sınıf Ortalaması Karşılaştırması</span>
            </h2>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-slate-300 font-medium">Öğrenci Notu</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                <span className="text-slate-400 font-medium">Sınıf Ortalaması</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {Object.entries(subjectGroups)
              .filter(([_, g]) => g.avg !== undefined)
              .map(([subjectName, g]) => {
                const studentScore = g.avg || 0;
                const classAvg = g.exam1?.classAverage || g.exam2?.classAverage || 70;

                return (
                  <div key={subjectName} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white truncate max-w-[200px]">{subjectName}</span>
                      <div className="flex items-center space-x-2 font-mono font-bold">
                        <span className="text-emerald-400">{studentScore.toFixed(1)} Puan</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-400 text-[11px]">Ort: {classAvg.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Comparison Bars */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/5 relative">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${Math.min(100, Math.max(0, studentScore))}%` }}
                        />
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5 relative">
                        <div 
                          className="bg-slate-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, classAvg))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Main Subjects Table & Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>{selectedSemester}. Dönem Ders Yazılı Notları</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Toplam {Object.keys(subjectGroups).length} Ders
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(subjectGroups).map(([subjectName, group]) => {
            const hasExams = group.exam1 || group.exam2;
            const avg = group.avg;

            return (
              <div 
                key={subjectName}
                className={`bg-slate-900 border rounded-3xl p-5 shadow-lg transition-all relative overflow-hidden ${
                  hasExams ? 'border-slate-800 hover:border-slate-700' : 'border-slate-850/60 opacity-80'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">{subjectName}</h3>
                    <span className="text-[10px] text-slate-400">
                      {hasExams ? 'Notlar girildi' : 'Henüz not girilmedi'}
                    </span>
                  </div>
                  {avg !== undefined && (
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold font-mono border ${
                      avg >= 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      avg >= 70 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                      avg >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      Ort: {avg.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Exams 1 & 2 Slots */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {/* 1. Yazılı */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 relative group">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      1. Yazılı
                    </div>
                    {group.exam1 ? (
                      <div>
                        <div className="text-lg font-black font-mono text-emerald-400">
                          {group.exam1.score}
                        </div>
                        {group.exam1.classAverage !== undefined && (
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            Sınıf Ort: {group.exam1.classAverage}
                          </div>
                        )}
                        <div className="flex items-center space-x-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingExam(group.exam1!);
                              setIsModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Düzenle"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeletingExamId(group.exam1!.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingExam(null);
                          setIsModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 py-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Not Gir</span>
                      </button>
                    )}
                  </div>

                  {/* 2. Yazılı */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 relative group">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      2. Yazılı
                    </div>
                    {group.exam2 ? (
                      <div>
                        <div className="text-lg font-black font-mono text-emerald-400">
                          {group.exam2.score}
                        </div>
                        {group.exam2.classAverage !== undefined && (
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            Sınıf Ort: {group.exam2.classAverage}
                          </div>
                        )}
                        <div className="flex items-center space-x-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingExam(group.exam2!);
                              setIsModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Düzenle"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeletingExamId(group.exam2!.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingExam(null);
                          setIsModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 py-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Not Gir</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {avg !== undefined && (
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        avg >= 85 ? 'bg-emerald-500' :
                        avg >= 70 ? 'bg-indigo-500' :
                        avg >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, avg)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Exam Modal */}
      <SchoolExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExam}
        initialExam={editingExam}
        availableSubjects={availableSubjects}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingExamId}
        title="Yazılı Sınav Notunu Sil"
        itemName="Bu yazılı sınav kaydını"
        onConfirm={() => {
          if (deletingExamId) {
            onDeleteSchoolExam(deletingExamId);
            setDeletingExamId(null);
          }
        }}
        onClose={() => setDeletingExamId(null)}
      />

      {/* Target GPA Modal */}
      {isTargetGpaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/60 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Hedef Karne Notunu Belirle</h3>
            <p className="text-xs text-slate-400 mb-4">
              9, 10 ve 11. sınıf yıl sonu karne notunuz YKS'deki OBP katkınızı belirler.
            </p>
            <form onSubmit={handleSaveTargetGpa} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hedef Yıl Sonu Notu (0 - 100)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  step="0.5"
                  required
                  value={customTargetGpa}
                  onChange={(e) => setCustomTargetGpa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-lg font-bold font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTargetGpaModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
