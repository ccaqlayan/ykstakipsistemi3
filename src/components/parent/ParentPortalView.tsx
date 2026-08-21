import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Share2, 
  MessageSquare, 
  Send, 
  User, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  PhoneCall,
  Check
} from 'lucide-react';
import { UserAccount, YKSDataState, SchoolExam } from '../../types';
import { getGradeLevel, getGradeDisplayName, isEarlyHighSchool } from '../../utils/gradeUtils';
import { ParentWhatsAppReportModal } from './ParentWhatsAppReportModal';

interface ParentPortalViewProps {
  student: UserAccount;
  studentData: YKSDataState;
  coachUser?: UserAccount;
  currentUser?: UserAccount;
  onSendMessage?: (receiverId: string, content: string) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  student,
  studentData,
  coachUser,
  currentUser,
  onSendMessage
}) => {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [parentMessage, setParentMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const gradeLevel = getGradeLevel(student.className);
  const isEarly = isEarlyHighSchool(gradeLevel);

  // Computations
  const questionLogs = studentData.questionLogs || [];
  const studyPlans = studentData.studyPlans || [];
  const schoolExams = studentData.schoolExams || [];
  const routines = studentData.routines || [];

  const totalWeeklyQuestions = useMemo(() => {
    return questionLogs.reduce((acc, q) => acc + (q.solvedCount || 0), 0);
  }, [questionLogs]);

  const weeklyQuestionTarget = studentData.profile?.weeklyQuestionTarget || (isEarly ? 250 : 500);
  const questionTargetRate = Math.min(150, Math.round((totalWeeklyQuestions / weeklyQuestionTarget) * 100));

  const totalWeeklyMinutes = useMemo(() => {
    return studyPlans
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.completedMinutes || p.plannedMinutes || 0), 0);
  }, [studyPlans]);

  const weeklyHours = Math.round((totalWeeklyMinutes / 60) * 10) / 10;
  const weeklyHoursTarget = studentData.profile?.weeklyStudyHoursTarget || (isEarly ? 10 : 20);
  const hoursTargetRate = Math.min(150, Math.round((weeklyHours / weeklyHoursTarget) * 100));

  // Plan completion rate
  const completedPlansCount = studyPlans.filter(p => p.status === 'completed').length;
  const planRate = studyPlans.length > 0 ? Math.round((completedPlansCount / studyPlans.length) * 100) : 100;

  // School exam average
  const scoredExams = schoolExams.filter(e => e.score !== undefined && e.score > 0);
  const schoolExamAvg = scoredExams.length > 0
    ? Math.round((scoredExams.reduce((sum, e) => sum + (e.score || 0), 0) / scoredExams.length) * 10) / 10
    : (studentData.profile?.schoolGpaTarget || 88.0);

  const isHonorRoll = schoolExamAvg >= 85;
  const isCommendation = schoolExamAvg >= 70 && schoolExamAvg < 85;

  // Last 7 days distribution
  const last7DaysData = useMemo(() => {
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    return days.map(day => {
      const dayPlans = studyPlans.filter(p => p.day === day && p.status === 'completed');
      const dayMinutes = dayPlans.reduce((sum, p) => sum + (p.completedMinutes || p.plannedMinutes || 0), 0);
      const dayQuestions = questionLogs
        .filter(q => q.date && new Date(q.date).toLocaleDateString('tr-TR', { weekday: 'long' }) === day)
        .reduce((sum, q) => sum + (q.solvedCount || 0), 0);

      return {
        day,
        hours: Math.round((dayMinutes / 60) * 10) / 10,
        questions: dayQuestions
      };
    });
  }, [studyPlans, questionLogs]);

  const handleSendParentNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentMessage.trim()) return;

    if (onSendMessage && coachUser) {
      onSendMessage(coachUser.id, `[Veli Notu - ${student.name}]: ${parentMessage.trim()}`);
    }

    setMessageSent(true);
    setParentMessage('');
    setTimeout(() => setMessageSent(false), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans max-w-6xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-emerald-500/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Heart className="w-8 h-8 text-rose-400 fill-rose-400/20" />
            </div>
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Gürsu Yıldız Anadolu Lisesi • Veli Bilgilendirme Portalı</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {student.name} - Haftalık Gelişim Raporu
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-bold">
                  {student.className || getGradeDisplayName(gradeLevel)}
                </span>
                <span>•</span>
                <span>Danışman: <strong className="text-slate-200">{coachUser?.name || 'Rehberlik Servisi'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Bülteni Oluştur</span>
            </button>
          </div>
        </div>

        {/* KPI Score Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800">
          
          {/* Haftalık Soru */}
          <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Haftalık Soru</span>
              </span>
              <span className="text-[10px] font-bold text-amber-400">%{questionTargetRate}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {totalWeeklyQuestions} <span className="text-xs font-normal text-slate-400">/ {weeklyQuestionTarget}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, questionTargetRate)}%` }} 
              />
            </div>
          </div>

          {/* Haftalık Etüt Süresi */}
          <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Etüt Süresi</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-400">%{hoursTargetRate}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {weeklyHours} <span className="text-xs font-normal text-slate-400">/ {weeklyHoursTarget} Saat</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, hoursTargetRate)}%` }} 
              />
            </div>
          </div>

          {/* Yazılı Notu & OBP */}
          <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Okul Yazılı / OBP</span>
              </span>
              {isHonorRoll && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                  Takdir
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {schoolExamAvg} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, schoolExamAvg)}%` }} 
              />
            </div>
          </div>

          {/* Program Uyumu */}
          <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Program Uyumu</span>
              </span>
              <span className="text-[10px] font-bold text-purple-400">{completedPlansCount} Görev</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              %{planRate}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${planRate}%` }} 
              />
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Weekly Chart & Coach Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Günlük Çalışma Dağılımı */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Haftalık Günlük Çalışma Temposu</span>
              </h3>
              <span className="text-xs text-slate-400">Pazartesi - Pazar Dağılımı</span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2">
              {last7DaysData.map((d) => (
                <div 
                  key={d.day}
                  className="bg-slate-950 border border-slate-850 p-2.5 rounded-2xl text-center space-y-2"
                >
                  <span className="text-[11px] font-bold text-slate-400 block truncate">
                    {d.day.substring(0, 3)}
                  </span>
                  
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold text-indigo-300">
                      {d.hours}s
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full" 
                        style={{ width: `${Math.min(100, (d.hours / 3) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-amber-400/80">
                    {d.questions} soru
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Okul Yazılı Sınav Notları Tablosu */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Ders Bazlı Okul Yazılı Notları & Karne Özeti</span>
              </h3>
              <span className="text-xs text-slate-400">{schoolExams.length} Sınav Kaydı</span>
            </div>

            {schoolExams.length === 0 ? (
              <div className="text-center py-6 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
                Henüz yazılı sınav notu girilmedi.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Ders</th>
                      <th className="p-2.5">Dönem & Sınav</th>
                      <th className="p-2.5 text-center">Öğrenci Notu</th>
                      <th className="p-2.5 text-center">Sınıf Ort.</th>
                      <th className="p-2.5 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {schoolExams.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-2.5 font-bold text-white">{e.subject}</td>
                        <td className="p-2.5 text-slate-400">{e.semester}. Dönem {e.examNumber}. Yazılı</td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-400">
                          {e.score ?? '-'}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-400">
                          {e.classAverage ?? '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          {(e.score || 0) >= (e.classAverage || 70) ? (
                            <span className="text-[10px] text-emerald-400 font-bold">✨ Ort. Üstü</span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-bold">⚠️ Takviye</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Koç Öğretmen Notları & Veli Mesajı */}
        <div className="space-y-6">
          
          {/* Koç Değerlendirmesi */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">Koç Öğretmen Değerlendirmesi</h3>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-xs text-slate-300 leading-relaxed">
              {studentData.profile?.coachNotes ? (
                <span>"{studentData.profile.coachNotes}"</span>
              ) : (
                <span className="text-slate-400 italic">
                  Öğrencimiz bu hafta düzenli olarak çalışma programını sürdürmektedir. Okul yazılıları ve soru hedefleri yakından takip edilmektedir.
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-850">
              <span>Danışman Öğretmen:</span>
              <span className="font-bold text-white">{coachUser?.name || 'Rehberlik Servisi'}</span>
            </div>
          </div>

          {/* Veli İletişim / Talep Kutusu */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3.5">
            <div className="flex items-center space-x-2 text-rose-400">
              <MessageSquare className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">Rehber Öğretmene Not İletin</h3>
            </div>
            
            <p className="text-xs text-slate-400">
              Öğrencinin evdeki çalışma durumu, ihtiyaçları veya talepleriniz hakkında danışman öğretmene hızlı mesaj bırakabilirsiniz.
            </p>

            <form onSubmit={handleSendParentNote} className="space-y-2.5">
              <textarea
                rows={3}
                required
                placeholder="Öğretmene iletmek istediğiniz not..."
                value={parentMessage}
                onChange={(e) => setParentMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Öğretmene İlet</span>
              </button>

              {messageSent && (
                <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300 font-bold flex items-center justify-center space-x-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Notunuz başarıyla öğretmene iletildi!</span>
                </div>
              )}
            </form>
          </div>

        </div>

      </div>

      {/* WhatsApp Report Modal */}
      {showWhatsAppModal && (
        <ParentWhatsAppReportModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          student={student}
          studentData={studentData}
          coachUser={coachUser}
        />
      )}

    </div>
  );
};
