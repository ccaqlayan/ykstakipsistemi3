import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  Download, 
  Award, 
  GraduationCap, 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Sparkles,
  Calendar,
  Building2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { YKSDataState, UserAccount, SchoolExam } from '../../types';
import { YildizLisesiLogo } from '../YildizLisesiLogo';
import { getGradeLevel, getGradeDisplayName } from '../../utils/gradeUtils';

interface OfficialStudentReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserAccount;
  studentData: YKSDataState;
  schoolName?: string;
  academicYear?: string;
}

export const OfficialStudentReportCardModal: React.FC<OfficialStudentReportCardModalProps> = ({
  isOpen,
  onClose,
  student,
  studentData,
  schoolName = 'Gürsu Yıldız Anadolu Lisesi',
  academicYear = '2024 - 2025'
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const profile = studentData.profile || {};
  const schoolExams = studentData.schoolExams || [];
  const questionLogs = studentData.questionLogs || [];
  const studyPlans = studentData.studyPlans || [];
  const topicErrors = studentData.topicErrors || [];

  const gradeLevel = getGradeLevel(student.className);
  const gradeDisplayName = getGradeDisplayName(gradeLevel);

  // Group school exams by subject
  const subjectExamsMap: Record<string, {
    sem1Exam1?: number;
    sem1Exam2?: number;
    sem1Perf?: number;
    sem2Exam1?: number;
    sem2Exam2?: number;
    sem2Perf?: number;
    classAvg?: number;
  }> = {};

  schoolExams.forEach((exam) => {
    if (!subjectExamsMap[exam.subject]) {
      subjectExamsMap[exam.subject] = {};
    }
    const entry = subjectExamsMap[exam.subject];
    if (exam.semester === 1) {
      if (exam.examNumber === 1) entry.sem1Exam1 = exam.score;
      else if (exam.examNumber === 2) entry.sem1Exam2 = exam.score;
    } else if (exam.semester === 2) {
      if (exam.examNumber === 1) entry.sem2Exam1 = exam.score;
      else if (exam.examNumber === 2) entry.sem2Exam2 = exam.score;
    }
    if (exam.classAverage) {
      entry.classAvg = exam.classAverage;
    }
  });

  // Calculate subject averages and overall GPA
  const subjectRows = Object.entries(subjectExamsMap).map(([subjectName, scores]) => {
    const validScores: number[] = [];
    if (scores.sem1Exam1 !== undefined) validScores.push(scores.sem1Exam1);
    if (scores.sem1Exam2 !== undefined) validScores.push(scores.sem1Exam2);
    if (scores.sem2Exam1 !== undefined) validScores.push(scores.sem2Exam1);
    if (scores.sem2Exam2 !== undefined) validScores.push(scores.sem2Exam2);

    const avg = validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0;

    let statusText = 'Pekiyi';
    let statusColor = 'text-emerald-600 bg-emerald-50';
    if (avg < 50) {
      statusText = 'Geçersiz';
      statusColor = 'text-rose-600 bg-rose-50';
    } else if (avg < 60) {
      statusText = 'Geçer';
      statusColor = 'text-amber-600 bg-amber-50';
    } else if (avg < 70) {
      statusText = 'Orta';
      statusColor = 'text-blue-600 bg-blue-50';
    } else if (avg < 85) {
      statusText = 'İyi';
      statusColor = 'text-indigo-600 bg-indigo-50';
    }

    return {
      subjectName,
      ...scores,
      average: avg,
      statusText,
      statusColor
    };
  });

  // Overall Written GPA
  const totalSubjectsWithScore = subjectRows.filter(r => r.average > 0);
  const overallWrittenGPA = totalSubjectsWithScore.length > 0
    ? totalSubjectsWithScore.reduce((sum, r) => sum + r.average, 0) / totalSubjectsWithScore.length
    : (profile.highSchoolGpa || 85.0);

  // Certificate prediction
  let certificate = { text: 'Belge Yok (Ort. < 70)', color: 'text-slate-600', icon: '📝', bg: 'bg-slate-100' };
  if (overallWrittenGPA >= 85.0) {
    certificate = { text: 'Takdir Belgesi Adayı', color: 'text-amber-600 font-black', icon: '🏆', bg: 'bg-amber-100' };
  } else if (overallWrittenGPA >= 70.0) {
    certificate = { text: 'Teşekkür Belgesi Adayı', color: 'text-indigo-600 font-bold', icon: '🎖️', bg: 'bg-indigo-100' };
  }

  // Question solving stats
  const totalSolvedQuestions = questionLogs.reduce((acc, q) => acc + (q.solvedCount || 0), 0);
  const totalCorrect = questionLogs.reduce((acc, q) => acc + (q.correctCount || 0), 0);
  const accuracyRate = totalSolvedQuestions > 0 ? Math.round((totalCorrect / totalSolvedQuestions) * 100) : 0;

  // Study plans stats
  const completedPlans = studyPlans.filter(p => p.status === 'completed');
  const totalCompletedMinutes = completedPlans.reduce((sum, p) => sum + (p.completedMinutes || p.plannedMinutes || 0), 0);
  const totalStudyHours = Math.round((totalCompletedMinutes / 60) * 10) / 10;

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-sans">
      
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #official-report-card, #official-report-card * {
            visibility: visible;
          }
          #official-report-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Controls Toolbar (Non-printable) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 no-print">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Resmi Öğrenci Gelişim & Koçluk Karnesi</h4>
              <p className="text-[11px] text-slate-400">A4 Yazdırma ve PDF İndirme Önizlemesi</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır / PDF Olarak Kaydet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 bg-slate-950 flex justify-center custom-scrollbar">
          
          {/* THE OFFICIAL A4 REPORT CARD DOCUMENT */}
          <div 
            id="official-report-card"
            ref={printContainerRef}
            className="w-full max-w-[800px] bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 border border-slate-200"
          >
            
            {/* Header / Logo Banner */}
            <div className="flex items-center justify-between border-b-2 border-indigo-900/20 pb-5">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 flex items-center justify-center p-1 bg-indigo-950 rounded-2xl">
                  <YildizLisesiLogo className="w-14 h-14" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-900">
                    T.C. MİLLÎ EĞİTİM BAKANLIĞI
                  </div>
                  <h1 className="text-xl font-black text-slate-950 tracking-tight">
                    {schoolName.toUpperCase()}
                  </h1>
                  <p className="text-xs font-semibold text-slate-600">
                    ÖĞRENCİ AKADEMİK GELİŞİM & YKS KOÇLUK KARNESİ
                  </p>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-xs font-bold text-indigo-950 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl inline-block">
                  {academicYear} EĞİTİM YILI
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Düzenleme Tarihi: {currentDateStr}
                </div>
              </div>
            </div>

            {/* Student ID & Target Identity Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Öğrenci Bilgileri</div>
                <div className="text-sm font-black text-slate-900">{student.name}</div>
                <div className="text-slate-600 font-medium">
                  {student.className || '12-A SAY'} • No: {student.schoolNumber || profile.schoolNumber || 'Belirtilmedi'}
                </div>
                <div className="text-[11px] font-semibold text-indigo-700">
                  {gradeDisplayName}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase">YKS / Akademik Hedef</div>
                <div className="font-bold text-slate-900">{profile.targetUniversity || 'Üniversite Belirtilmedi'}</div>
                <div className="text-slate-600 font-medium">{profile.targetDepartment || 'Bölüm Belirtilmedi'}</div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  Hedef Sıralama: #{profile.targetRank ? profile.targetRank.toLocaleString() : '-'}
                </div>
              </div>

              <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
                  <span>Yazılı Not Ortalaması</span>
                  <span className="text-xs">{certificate.icon}</span>
                </div>
                <div className="text-xl font-black text-indigo-950 font-mono">
                  {overallWrittenGPA.toFixed(2)}
                </div>
                <div className={`text-[10.5px] ${certificate.color}`}>
                  {certificate.text}
                </div>
              </div>
            </div>

            {/* Academic School Written Exams Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ders Yazılı Sınav Notları & Akademik Performans</span>
                </h3>
                <span className="text-[10px] text-slate-500">MEB 100'lük Not Baremi</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Ders Adı</th>
                      <th className="p-2.5 text-center">1. Dönem 1. Yazılı</th>
                      <th className="p-2.5 text-center">1. Dönem 2. Yazılı</th>
                      <th className="p-2.5 text-center">2. Dönem 1. Yazılı</th>
                      <th className="p-2.5 text-center">2. Dönem 2. Yazılı</th>
                      <th className="p-2.5 text-center">Sınıf Ort.</th>
                      <th className="p-2.5 text-center">Ders Ort.</th>
                      <th className="p-2.5 text-center">Derece</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {subjectRows.length > 0 ? (
                      subjectRows.map((row) => (
                        <tr key={row.subjectName} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900">{row.subjectName}</td>
                          <td className="p-2 text-center font-mono">{row.sem1Exam1 !== undefined ? row.sem1Exam1 : '-'}</td>
                          <td className="p-2 text-center font-mono">{row.sem1Exam2 !== undefined ? row.sem1Exam2 : '-'}</td>
                          <td className="p-2 text-center font-mono">{row.sem2Exam1 !== undefined ? row.sem2Exam1 : '-'}</td>
                          <td className="p-2 text-center font-mono">{row.sem2Exam2 !== undefined ? row.sem2Exam2 : '-'}</td>
                          <td className="p-2 text-center font-mono text-slate-500">{row.classAvg ? row.classAvg : '-'}</td>
                          <td className="p-2 text-center font-mono font-bold text-indigo-950">
                            {row.average > 0 ? row.average.toFixed(1) : '-'}
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${row.statusColor}`}>
                              {row.statusText}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                          Henüz okul yazılı sınav notu girilmemiştir.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Study Discipline & Question Solving Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Toplam Çözülen Soru</div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {totalSolvedQuestions.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">Soru</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold">
                  Doğruluk Oranı: %{accuracyRate}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Çalışma Programı Süresi</div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {totalStudyHours} <span className="text-[10px] font-normal text-slate-500">Saat</span>
                </div>
                <div className="text-[10px] text-indigo-700 font-semibold">
                  {completedPlans.length} Görev Tamamlandı
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Hata Defteri & Tekrar</div>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {topicErrors.length} <span className="text-[10px] font-normal text-slate-500">Kazanım</span>
                </div>
                <div className="text-[10px] text-amber-700 font-semibold">
                  Geliştirilmesi Gereken Konu
                </div>
              </div>
            </div>

            {/* Coach & Counselor Evaluation Notes */}
            <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-indigo-950 font-bold">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Rehber Öğretmen & Koçluk Değerlendirmesi</span>
              </div>
              <p className="text-slate-700 leading-relaxed italic">
                {profile.coachNotes || 
                  `${student.name} eğitim dönemi boyunca gösterdiği çalışma disiplini, düzenli soru çözümleri ve ders takibi ile hedeflediği başarı bandına doğru kararlılıkla ilerlemektedir. Okul yazılı sınavlarındaki başarısının ve düzenli konu tekrarlarının devamı tavsiye edilir.`}
              </p>
            </div>

            {/* Official Signatures Block */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-center text-xs text-slate-800">
              <div className="space-y-6">
                <div className="font-bold text-[11px]">Sınıf Rehber Öğretmeni</div>
                <div className="text-[10px] text-slate-500">İmza</div>
              </div>
              <div className="space-y-6">
                <div className="font-bold text-[11px]">Okul Rehberlik Servisi</div>
                <div className="text-[10px] text-slate-500">İmza / Mühür</div>
              </div>
              <div className="space-y-6">
                <div className="font-bold text-[11px]">Okul Müdürü</div>
                <div className="text-[10px] text-slate-500">Mühür / Onay</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
