import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  BarChart3, 
  TrendingUp, 
  Award, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  Layers, 
  Building2,
  ChevronRight,
  Sparkles,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { UserAccount, YKSDataState, ClassDefinition } from '../../types';
import { getGradeLevel, getGradeDisplayName, GradeLevel } from '../../utils/gradeUtils';

interface ClassComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassDefinition[];
  allUsers: UserAccount[];
  studentsData: Record<string, YKSDataState>;
  onInspectStudent?: (student: UserAccount) => void;
}

export const ClassComparisonModal: React.FC<ClassComparisonModalProps> = ({
  isOpen,
  onClose,
  classes,
  allUsers,
  studentsData,
  onInspectStudent
}) => {
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | '9' | '10' | '11' | '12' | 'mezun'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'classes' | 'radar'>('overview');

  if (!isOpen) return null;

  const studentsList = allUsers.filter(u => u.role === 'student');

  // Compute Grade Level Analytics
  const gradeAnalytics = useMemo(() => {
    const grades: ('9' | '10' | '11' | '12' | 'mezun')[] = ['9', '10', '11', '12', 'mezun'];

    return grades.map((g) => {
      const gradeStudents = studentsList.filter(s => getGradeLevel(s.className) === g);
      const totalStudents = gradeStudents.length;

      let totalQuestions = 0;
      let totalHours = 0;
      let totalCompletedTasks = 0;
      let totalTasks = 0;
      let totalExamScores: number[] = [];

      gradeStudents.forEach((student) => {
        const sData = studentsData[student.id] || ({} as YKSDataState);
        const qLogs = sData.questionLogs || [];
        const plans = sData.studyPlans || [];
        const exams = sData.schoolExams || [];

        // Question count
        totalQuestions += qLogs.reduce((acc, q) => acc + (q.solvedCount || 0), 0);

        // Study hours
        const completedMinutes = plans
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.completedMinutes || p.plannedMinutes || 0), 0);
        totalHours += completedMinutes / 60;

        // Plans completion
        totalCompletedTasks += plans.filter(p => p.status === 'completed').length;
        totalTasks += plans.length;

        // School exams
        exams.forEach(e => {
          if (e.score !== undefined && e.score > 0) {
            totalExamScores.push(e.score);
          }
        });
      });

      const avgQuestions = totalStudents > 0 ? Math.round(totalQuestions / totalStudents) : 0;
      const avgHours = totalStudents > 0 ? Math.round((totalHours / totalStudents) * 10) / 10 : 0;
      const planRate = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;
      const avgExamScore = totalExamScores.length > 0 
        ? Math.round((totalExamScores.reduce((a, b) => a + b, 0) / totalExamScores.length) * 10) / 10 
        : 80.0;

      return {
        grade: g,
        displayName: getGradeDisplayName(g),
        studentCount: totalStudents,
        totalQuestions,
        avgQuestions,
        totalHours: Math.round(totalHours),
        avgHours,
        planRate,
        avgExamScore
      };
    });
  }, [studentsList, studentsData]);

  // Compute Class Detailed Analytics
  const classAnalytics = useMemo(() => {
    return classes.map((cls) => {
      const clsStudents = studentsList.filter(s => (s.className || '').trim() === cls.name.trim());
      const studentCount = clsStudents.length;

      let totalQuestions = 0;
      let totalCompletedTasks = 0;
      let totalTasks = 0;
      let examScores: number[] = [];

      clsStudents.forEach((student) => {
        const sData = studentsData[student.id] || ({} as YKSDataState);
        const qLogs = sData.questionLogs || [];
        const plans = sData.studyPlans || [];
        const exams = sData.schoolExams || [];

        totalQuestions += qLogs.reduce((acc, q) => acc + (q.solvedCount || 0), 0);
        totalCompletedTasks += plans.filter(p => p.status === 'completed').length;
        totalTasks += plans.length;

        exams.forEach(e => {
          if (e.score !== undefined && e.score > 0) {
            examScores.push(e.score);
          }
        });
      });

      const grade = getGradeLevel(cls.name);
      const avgQuestions = studentCount > 0 ? Math.round(totalQuestions / studentCount) : 0;
      const planRate = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;
      const avgExamScore = examScores.length > 0
        ? Math.round((examScores.reduce((a, b) => a + b, 0) / examScores.length) * 10) / 10
        : 82.0;

      return {
        classId: cls.id,
        className: cls.name,
        grade,
        field: cls.field || 'ORTAK',
        studentCount,
        totalQuestions,
        avgQuestions,
        planRate,
        avgExamScore
      };
    }).filter(c => selectedGradeFilter === 'all' || c.grade === selectedGradeFilter);
  }, [classes, studentsList, studentsData, selectedGradeFilter]);

  // Early Warning Radar: Students who need urgent coaching attention
  const atRiskStudents = useMemo(() => {
    return studentsList.map((student) => {
      const sData = studentsData[student.id] || ({} as YKSDataState);
      const qLogs = sData.questionLogs || [];
      const plans = sData.studyPlans || [];
      const exams = sData.schoolExams || [];

      const totalQ = qLogs.reduce((acc, q) => acc + (q.solvedCount || 0), 0);
      const completedPlans = plans.filter(p => p.status === 'completed').length;
      const planRate = plans.length > 0 ? Math.round((completedPlans / plans.length) * 100) : 100;

      const examScores = exams.map(e => e.score).filter(s => s > 0);
      const avgExam = examScores.length > 0 
        ? examScores.reduce((a, b) => a + b, 0) / examScores.length 
        : 80;

      const risks: string[] = [];
      if (totalQ < 100) risks.push('Düşük Soru Çözümü (<100 soru)');
      if (planRate < 50 && plans.length > 0) risks.push('Çalışma Programı Uyumsuzluğu (<%50)');
      if (avgExam < 60 && examScores.length > 0) risks.push('Düşük Yazılı Sınav Ortalaması (<60)');

      return {
        student,
        grade: getGradeLevel(student.className),
        totalQuestions: totalQ,
        planRate,
        avgExamScore: Math.round(avgExam * 10) / 10,
        risks,
        riskLevel: risks.length >= 2 ? 'high' : risks.length === 1 ? 'medium' : 'low'
      };
    }).filter(s => s.risks.length > 0 && (selectedGradeFilter === 'all' || s.grade === selectedGradeFilter));
  }, [studentsList, studentsData, selectedGradeFilter]);

  // Highest question max for visual scaling
  const maxAvgQuestions = Math.max(...gradeAnalytics.map(g => g.avgQuestions), 100);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <span>Kademeler Arası Karşılaştırmalı Okul Analitiği</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                  9, 10, 11, 12 & Mezun
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tüm kademe ve şubelerin soru çözümleri, yazılı sınav ortalamaları ve erken uyarı radarı.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs & Grade Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex space-x-1.5">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Kademe Kıyaslama Grafikleri</span>
            </button>
            <button
              onClick={() => setActiveSubTab('classes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'classes'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Şube Başarı Tablosu</span>
            </button>
            <button
              onClick={() => setActiveSubTab('radar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'radar'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-800/60 text-rose-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Erken Uyarı Radarı ({atRiskStudents.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {(['all', '9', '10', '11', '12', 'mezun'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGradeFilter(g)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                  selectedGradeFilter === g
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {g === 'all' ? 'Tüm Kademeler' : g === 'mezun' ? 'Mezun' : `${g}. Sınıf`}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">

          {/* TAB 1: OVERVIEW COMPARISON CARDS & BARS */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Metric Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {gradeAnalytics.map((item) => (
                  <div
                    key={item.grade}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-2xl space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-300">{item.displayName}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                        {item.studentCount} Öğrenci
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-400">Ortalama Soru:</span>
                        <span className="font-mono font-bold text-amber-400">{item.avgQuestions}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(item.avgQuestions / maxAvgQuestions) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-400">Yazılı / OBP:</span>
                        <span className="font-mono font-bold text-emerald-400">{item.avgExamScore}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${item.avgExamScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                      <span>Program Uyumu:</span>
                      <span className="font-bold text-indigo-400">%{item.planRate}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparative Visual Bars */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Soru Çözüm Karşılaştırması */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <BookOpen className="w-4 h-4" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Kademe Başına Ortalama Soru Sayıları
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {gradeAnalytics.map((g) => (
                      <div key={g.grade} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-300">{g.displayName}</span>
                          <span className="font-mono font-bold text-amber-400">{g.avgQuestions} Soru / Öğrenci</span>
                        </div>
                        <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-700"
                            style={{ width: `${(g.avgQuestions / maxAvgQuestions) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Yazılı Sınav / Akademik Başarı Karşılaştırması */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Award className="w-4 h-4" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Kademe Bazlı Okul Yazılı Not Ortalamaları
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {gradeAnalytics.map((g) => (
                      <div key={g.grade} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-300">{g.displayName}</span>
                          <span className="font-mono font-bold text-emerald-400">{g.avgExamScore} / 100</span>
                        </div>
                        <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                            style={{ width: `${g.avgExamScore}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: CLASS PERFORMANCE TABLE */}
          {activeSubTab === 'classes' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Şube Adı</th>
                      <th className="p-3">Kademe & Alan</th>
                      <th className="p-3 text-center">Öğrenci Sayısı</th>
                      <th className="p-3 text-center">Ortalama Soru</th>
                      <th className="p-3 text-center">Yazılı Ortalaması</th>
                      <th className="p-3 text-center">Program Uyumu</th>
                      <th className="p-3 text-center">Akademik Başarı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {classAnalytics.map((c) => (
                      <tr key={c.classId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{c.className}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-800 rounded-lg text-[10.5px] font-semibold text-slate-300">
                            {getGradeDisplayName(c.grade)} • {c.field}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">{c.studentCount}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-400">
                          {c.avgQuestions}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-400">
                          {c.avgExamScore}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-400">
                          %{c.planRate}
                        </td>
                        <td className="p-3 text-center">
                          {c.avgExamScore >= 85 ? (
                            <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full text-[10px] font-bold">
                              🏆 Yüksek Başarı
                            </span>
                          ) : c.avgExamScore >= 70 ? (
                            <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full text-[10px] font-bold">
                              ✨ İyi Düzey
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-full text-[10px] font-bold">
                              ⚠️ Destek Gerekli
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: EARLY WARNING RADAR */}
          {activeSubTab === 'radar' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl flex items-center space-x-3 text-xs text-rose-300">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                <span>
                  Soru çözümü hedeflerini yakalayamayan veya yazılı sınav not ortalaması 60'ın altında kalan öğrenciler koçluk müdahalesi için burada listelenmektedir.
                </span>
              </div>

              {atRiskStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  Tebrikler! Seçili kademede risk altında olan öğrenci bulunmuyor.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {atRiskStudents.map(({ student, grade, totalQuestions, planRate, avgExamScore, risks }) => (
                    <div
                      key={student.id}
                      className="p-4 bg-slate-950 border border-slate-800 hover:border-rose-500/40 rounded-2xl space-y-3 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-white text-xs">{student.name}</h5>
                          <p className="text-[10px] text-slate-400">{student.className || '12-A SAY'}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-bold">
                          {getGradeDisplayName(grade)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900 rounded-xl text-center text-xs">
                        <div>
                          <div className="text-[10px] text-slate-500">Soru</div>
                          <div className="font-mono font-bold text-amber-400">{totalQuestions}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">Program</div>
                          <div className="font-mono font-bold text-indigo-400">%{planRate}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">Yazılı</div>
                          <div className="font-mono font-bold text-emerald-400">{avgExamScore}</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {risks.map((r, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 text-[10.5px] text-rose-300">
                            <AlertTriangle className="w-3 h-3 shrink-0 text-rose-400" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      {onInspectStudent && (
                        <button
                          onClick={() => onInspectStudent(student)}
                          className="w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <span>Öğrenciyi İncele & Müdahale Et</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Toplam {studentsList.length} öğrenci ve {classes.length} şube analiz edilmektedir.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
