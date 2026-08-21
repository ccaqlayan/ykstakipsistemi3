import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  Sparkles, 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  GraduationCap,
  Send,
  Edit3
} from 'lucide-react';
import { UserAccount, YKSDataState } from '../../types';
import { getGradeLevel, getGradeDisplayName, isEarlyHighSchool } from '../../utils/gradeUtils';

interface ParentWhatsAppReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserAccount;
  studentData: YKSDataState;
  coachUser?: UserAccount;
}

export const ParentWhatsAppReportModal: React.FC<ParentWhatsAppReportModalProps> = ({
  isOpen,
  onClose,
  student,
  studentData,
  coachUser
}) => {
  const [copied, setCopied] = useState(false);
  const [customCoachNote, setCustomCoachNote] = useState('');

  const gradeLevel = getGradeLevel(student.className);
  const isEarly = isEarlyHighSchool(gradeLevel);

  // Computations
  const stats = useMemo(() => {
    const questionLogs = studentData.questionLogs || [];
    const studyPlans = studentData.studyPlans || [];
    const schoolExams = studentData.schoolExams || [];
    const routines = studentData.routines || [];

    // Weekly question calculation
    const totalQuestions = questionLogs.reduce((sum, q) => sum + (q.solvedCount || 0), 0);
    const weeklyQuestionGoal = studentData.profile?.weeklyQuestionTarget || (isEarly ? 250 : 500);
    const questionGoalRate = weeklyQuestionGoal > 0 ? Math.round((totalQuestions / weeklyQuestionGoal) * 100) : 100;

    // Study minutes
    const totalMinutes = studyPlans
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.completedMinutes || p.plannedMinutes || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const weeklyHoursGoal = studentData.profile?.weeklyStudyHoursTarget || (isEarly ? 10 : 20);

    // Plans completion rate
    const completedPlans = studyPlans.filter(p => p.status === 'completed').length;
    const planRate = studyPlans.length > 0 ? Math.round((completedPlans / studyPlans.length) * 100) : 100;

    // School exams average
    const validScores = schoolExams.map(e => e.score).filter((s): s is number => s !== undefined && s > 0);
    const examAvg = validScores.length > 0 
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10 
      : (studentData.profile?.schoolGpaTarget || 88.0);

    const certificate = examAvg >= 85 ? '🏆 Takdir Belgesi Adayı' : examAvg >= 70 ? '🎖️ Teşekkür Belgesi Adayı' : 'Geçer Düzey';

    return {
      totalQuestions,
      weeklyQuestionGoal,
      questionGoalRate,
      totalHours,
      weeklyHoursGoal,
      planRate,
      examAvg,
      certificate
    };
  }, [studentData, isEarly]);

  // Generate Default WhatsApp Bulletin Text
  const defaultMessage = useMemo(() => {
    const studentName = student.name || 'Öğrencimiz';
    const className = student.className || `${getGradeDisplayName(gradeLevel)}`;
    const coachName = coachUser?.name || 'Rehberlik & Koçluk Servisi';

    let text = `🌟 *GÜRSU YILDIZ ANADOLU LİSESİ* 🌟\n` +
      `📌 *HAFTALIK ÖĞRENCİ GELİŞİM & KOÇLUK BÜLTENİ*\n\n` +
      `Sayın Velimiz, öğrencimiz *${studentName}* (${className}) için bu haftaki akademik çalışma ve gelişim özeti aşağıda bilgilerinize sunulmuştur:\n\n` +
      `📊 *1. Çözülen Soru Sayısı:* ${stats.totalQuestions} Soru (Haftalık Hedef: ${stats.weeklyQuestionGoal} - %${stats.questionGoalRate} Başarı)\n` +
      `⏱️ *2. Toplam Etüt & Çalışma Süresi:* ${stats.totalHours} Saat (Haftalık Hedef: ${stats.weeklyHoursGoal} Saat)\n` +
      `📋 *3. Çalışma Programına Uyum:* %${stats.planRate}\n` +
      `📝 *4. Okul Yazılı Sınav Ortalaması:* ${stats.examAvg} / 100 (${stats.certificate})\n`;

    if (!isEarly) {
      text += `🎯 *5. Hedef Üniversite / Alan:* ${studentData.profile?.targetUniversity || 'Üniversite Hedefi'} (${studentData.profile?.targetField || 'SAY'})\n`;
    }

    if (customCoachNote.trim()) {
      text += `\n💬 *Koç Öğretmen Değerlendirmesi:*\n"${customCoachNote.trim()}"\n`;
    } else if (studentData.profile?.coachNotes) {
      text += `\n💬 *Koç Öğretmen Değerlendirmesi:*\n"${studentData.profile.coachNotes}"\n`;
    } else {
      text += `\n💬 *Koçluk Notu:* Öğrencimiz bu hafta planlı ve disiplinli bir şekilde çalışmalarına devam etmiştir. Düzenli soru çözümü ve okul ders tekrarı başarısını artıracaktır.\n`;
    }

    text += `\nİyi haftalar dileriz.\n` +
      `👨‍🏫 *${coachName}*\n` +
      `_MEB Türkiye Yüzyılı Maarif Modeli & Akıllı Öğrenci Takip Sistemi_`;

    return text;
  }, [student, gradeLevel, coachUser, stats, isEarly, studentData.profile, customCoachNote]);

  const [messageDraft, setMessageDraft] = useState(defaultMessage);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageDraft)}`;
    window.open(url, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-sans">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-emerald-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span>Veliye Haftalık WhatsApp Bülteni</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  {student.name}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Öğrencinin haftalık soru, etüt, yazılı notları ve koç değerlendirmesini tek tıkla veliyle paylaşın.
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

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
            <div>
              <div className="text-[10px] text-slate-500">Soru</div>
              <div className="text-xs font-mono font-bold text-amber-400">{stats.totalQuestions}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Etüt</div>
              <div className="text-xs font-mono font-bold text-indigo-400">{stats.totalHours} Saat</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Yazılı/OBP</div>
              <div className="text-xs font-mono font-bold text-emerald-400">{stats.examAvg}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Program</div>
              <div className="text-xs font-mono font-bold text-purple-400">%{stats.planRate}</div>
            </div>
          </div>

          {/* Optional Extra Coach Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Veliye Özel Koçluk Notu (İsteğe Bağlı):</span>
            </label>
            <input
              type="text"
              placeholder="Örn: Bu hafta matematikte fonksiyonlar konusuna ağırlık verdik, tebrik ederiz."
              value={customCoachNote}
              onChange={(e) => {
                setCustomCoachNote(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Message Preview and Editable Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Mesaj Metni Önizleme (Düzenlenebilir):</span>
              </span>
              <span className="text-[10px] text-slate-500">Göndermeden önce dilediğiniz gibi değiştirebilirsiniz</span>
            </label>
            <textarea
              rows={9}
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs font-sans text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed custom-scrollbar"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Panoya Kopyalandı!' : 'Metni Kopyala'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Kapat
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp'ta Aç & Gönder</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
