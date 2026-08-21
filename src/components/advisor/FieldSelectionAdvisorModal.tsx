import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  Compass, 
  HelpCircle, 
  Share2, 
  Printer, 
  ArrowRight, 
  ArrowLeft,
  GraduationCap,
  Calculator,
  Briefcase,
  Layers,
  Check
} from 'lucide-react';
import { UserAccount, YKSDataState } from '../../types';
import { getGradeLevel, getGradeDisplayName } from '../../utils/gradeUtils';

interface FieldSelectionAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserAccount;
  studentData: YKSDataState;
}

export const FieldSelectionAdvisorModal: React.FC<FieldSelectionAdvisorModalProps> = ({
  isOpen,
  onClose,
  student,
  studentData
}) => {
  const [currentStep, setCurrentStep] = useState<'survey' | 'report'>('survey');
  const [surveyIndex, setSurveyIndex] = useState(0);

  // Survey Questions & Options
  const questions = [
    {
      id: 'q1',
      title: 'Hangi problem türlerini çözmek seni daha çok motive eder?',
      options: [
        { text: 'Matematiksel formüller, mantıksal bulmacalar ve teknik hesaplamalar', fieldWeight: { SAY: 4, EA: 2, SÖZ: 0, DİL: 0 } },
        { text: 'İnsan ilişkileri, toplumsal dinamikler, yönetim ve finansal kararlar', fieldWeight: { SAY: 1, EA: 4, SÖZ: 2, DİL: 1 } },
        { text: 'Edebi metinler, tarihsel olaylar, felsefi tartışmalar ve yaratıcı yazarlık', fieldWeight: { SAY: 0, EA: 1, SÖZ: 4, DİL: 1 } },
        { text: 'Farklı kültürler, yabancı dillerde iletişim ve küresel konular', fieldWeight: { SAY: 0, EA: 1, SÖZ: 1, DİL: 4 } }
      ]
    },
    {
      id: 'q2',
      title: 'Gelecekte hangi çalışma ortamında bulunmak istersin?',
      options: [
        { text: 'Laboratuvar, Ar-Ge merkezi, hastane veya yazılım teknoloji şirketi', fieldWeight: { SAY: 4, EA: 1, SÖZ: 0, DİL: 0 } },
        { text: 'Hukuk bürosu, kurumsal şirket yönetimi, banka veya danışmanlık ofisi', fieldWeight: { SAY: 1, EA: 4, SÖZ: 2, DİL: 1 } },
        { text: 'Medya kuruluşu, yayınevi, akademik araştırma veya kamu kurumları', fieldWeight: { SAY: 0, EA: 1, SÖZ: 4, DİL: 1 } },
        { text: 'Uluslararası şirketler, büyükelçilikler, çeviri merkezleri veya turizm', fieldWeight: { SAY: 0, EA: 1, SÖZ: 1, DİL: 4 } }
      ]
    },
    {
      id: 'q3',
      title: 'Okul dersleri arasında çalışırken en çok keyif aldığın alan hangisidir?',
      options: [
        { text: 'Matematik ve Fen Bilimleri (Fizik, Kimya, Biyoloji)', fieldWeight: { SAY: 4, EA: 1, SÖZ: 0, DİL: 0 } },
        { text: 'Matematik ve Sosyal Bilimler (Türkçe/Edebiyat, Tarih, Coğrafya)', fieldWeight: { SAY: 1, EA: 4, SÖZ: 2, DİL: 0 } },
        { text: 'Türk Dili ve Edebiyatı, Tarih, Coğrafya ve Felsefe', fieldWeight: { SAY: 0, EA: 1, SÖZ: 4, DİL: 1 } },
        { text: 'İngilizce / İkinci Yabancı Dil dersleri ve dil pratikleri', fieldWeight: { SAY: 0, EA: 0, SÖZ: 1, DİL: 4 } }
      ]
    },
    {
      id: 'q4',
      title: 'Üniversite hedeflerinde sana en çok heyecan veren meslek grubu hangisidir?',
      options: [
        { text: 'Mühendislikler (Yazılım, Bilgisayar, Makine), Tıp, Diş Hekimliği, Eczacılık', fieldWeight: { SAY: 4, EA: 0, SÖZ: 0, DİL: 0 } },
        { text: 'Hukuk, Psikoloji, İşletme, İktisat, Yönetim Bilişim Sistemleri (YBS)', fieldWeight: { SAY: 0, EA: 4, SÖZ: 1, DİL: 1 } },
        { text: 'Özel Eğitim Öğretmenliği, İletişim, Halkla İlişkiler, Türk Dili', fieldWeight: { SAY: 0, EA: 1, SÖZ: 4, DİL: 0 } },
        { text: 'Mütercim Tercümanlık, İngilizce Öğretmenliği, Dilbilim', fieldWeight: { SAY: 0, EA: 0, SÖZ: 0, DİL: 4 } }
      ]
    }
  ];

  const [answers, setAnswers] = useState<Record<number, number>>({
    0: 0,
    1: 0,
    2: 0,
    3: 0
  });

  // Calculate Field Match Rates based on Exam Scores + Survey Answers
  const result = useMemo(() => {
    const schoolExams = studentData.schoolExams || [];

    // Base scores
    let sayScore = 0;
    let eaScore = 0;
    let sozScore = 0;
    let dilScore = 0;

    // 1. Survey Answers contribution (Max 16 points each)
    Object.entries(answers).forEach(([qIdx, optIdx]) => {
      const q = questions[Number(qIdx)];
      if (q && q.options[optIdx]) {
        const weight = q.options[optIdx].fieldWeight;
        sayScore += weight.SAY * 4;
        eaScore += weight.EA * 4;
        sozScore += weight.SÖZ * 4;
        dilScore += weight.DİL * 4;
      }
    });

    // 2. School Exam contribution
    schoolExams.forEach(e => {
      const score = e.score || 70;
      const subj = e.subject.toLowerCase();

      if (subj.includes('matematik')) {
        sayScore += (score / 100) * 20;
        eaScore += (score / 100) * 20;
      } else if (subj.includes('fizik') || subj.includes('kimya') || subj.includes('biyoloji')) {
        sayScore += (score / 100) * 15;
      } else if (subj.includes('edebiyat') || subj.includes('türkçe')) {
        eaScore += (score / 100) * 12;
        sozScore += (score / 100) * 20;
      } else if (subj.includes('tarih') || subj.includes('coğrafya') || subj.includes('felsefe')) {
        eaScore += (score / 100) * 8;
        sozScore += (score / 100) * 15;
      } else if (subj.includes('ingilizce') || subj.includes('dil')) {
        dilScore += (score / 100) * 35;
      }
    });

    // Default normalization
    const totalMax = 100;
    const normSay = Math.min(98, Math.max(30, Math.round((sayScore / 110) * 100)));
    const normEa = Math.min(98, Math.max(30, Math.round((eaScore / 105) * 100)));
    const normSoz = Math.min(98, Math.max(25, Math.round((sozScore / 95) * 100)));
    const normDil = Math.min(98, Math.max(25, Math.round((dilScore / 90) * 100)));

    // Top recommended field
    const scores = [
      { field: 'Sayısal (SAY)', rate: normSay, desc: 'Mühendislik, Tıp, Sağlık ve Doğa Bilimleri', color: 'text-indigo-400', bg: 'bg-indigo-500' },
      { field: 'Eşit Ağırlık (EA)', rate: normEa, desc: 'Hukuk, İşletme, İktisat ve Psikoloji', color: 'text-amber-400', bg: 'bg-amber-500' },
      { field: 'Yabancı Dil (DİL)', rate: normDil, desc: 'Tercümanlık, Dil Öğretmenliği ve Kültür', color: 'text-emerald-400', bg: 'bg-emerald-500' },
      { field: 'Sözel (SÖZ)', rate: normSoz, desc: 'İletişim, Medya, Özel Eğitim ve Sosyal Bilimler', color: 'text-purple-400', bg: 'bg-purple-500' }
    ].sort((a, b) => b.rate - a.rate);

    return {
      top: scores[0],
      allScores: scores
    };
  }, [answers, studentData.schoolExams]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `🎓 *GÜRSU YILDIZ ANADOLU LİSESİ - 11. SINIF ALAN SEÇİM RAPORU*\n` +
      `👤 *Öğrenci:* ${student.name} (${student.className || '10. Sınıf'})\n\n` +
      `✨ *ÖNERİLEN ALAN:* ${result.top.field} (%${result.top.rate} Uygunluk)\n` +
      `📌 *Alan Uygunluk Dağılımı:*\n` +
      result.allScores.map(s => `• ${s.field}: %${s.rate}`).join('\n') +
      `\n\n_MEB Maarif Modeli & Akıllı Alan Seçim Karar Robotu_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-sans">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-indigo-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span>11. Sınıf Alan Seçimi Karar Destek Robotu</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                  9 & 10. Sınıf
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Yazılı sınav notlarınız ve kariyer ilgi profilinize göre en uygun 11. sınıf alanını belirleyin.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          
          {currentStep === 'survey' ? (
            <div className="space-y-6">
              
              {/* Progress Indicator */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Soru {surveyIndex + 1} / {questions.length}</span>
                <div className="flex items-center space-x-1.5">
                  {questions.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-6 h-1.5 rounded-full transition-all ${
                        idx === surveyIndex 
                          ? 'bg-indigo-500' 
                          : idx < surveyIndex 
                            ? 'bg-emerald-500' 
                            : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Question Title */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850">
                <h4 className="text-sm sm:text-base font-black text-white leading-relaxed">
                  {questions[surveyIndex].title}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {questions[surveyIndex].options.map((opt, optIdx) => {
                  const isSelected = answers[surveyIndex] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => setAnswers(prev => ({ ...prev, [surveyIndex]: optIdx }))}
                      className={`w-full text-left p-4 rounded-2xl border transition-all text-xs font-semibold flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span>{opt.text}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Survey Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  disabled={surveyIndex === 0}
                  onClick={() => setSurveyIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all disabled:opacity-30 cursor-pointer flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Önceki Soru</span>
                </button>

                {surveyIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setSurveyIndex(prev => prev + 1)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Sonraki Soru</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentStep('report')}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center space-x-1.5 animate-pulse"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Alan Uygunluk Raporumu Gör</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* Report Step */
            <div className="space-y-6">
              
              {/* Winner Field Showcase Banner */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 rounded-3xl p-6 text-center space-y-3 relative overflow-hidden shadow-xl">
                <div className="w-14 h-14 bg-indigo-600/30 text-indigo-300 rounded-2xl flex items-center justify-center mx-auto border border-indigo-400/40">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    Sana En Uygun 11. Sınıf Alanı:
                  </span>
                  <h3 className="text-2xl font-black text-white mt-0.5">
                    {result.top.field}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                    {result.top.desc}
                  </p>
                </div>

                <div className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-md">
                  <span>Uygunluk Skoru: %{result.top.rate}</span>
                </div>
              </div>

              {/* All Fields Comparison Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Alanlar Arası Uygunluk Dağılımınız:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.allScores.map((score, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{score.field}</span>
                        <span className={`font-mono font-bold ${score.color}`}>%{score.rate}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${score.bg}`}
                          style={{ width: `${score.rate}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{score.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluation Highlights */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs text-slate-300 leading-relaxed">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Koçluk ve Rehberlik Değerlendirmesi:</span>
                </div>
                <p>
                  Okul yazılı sınav notlarınız ve problem çözme ilgi profiliniz birlikte incelendiğinde <strong>{result.top.field}</strong> alanı akademik potansiyelinizi en yüksek seviyede ortaya koyabileceğiniz alandır. 11. sınıfa geçerken bu doğrultuda çalışma programınızı yapılandırabilirsiniz.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentStep('survey')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Testi Tekrarla
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Yazdır</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-md cursor-pointer active:scale-95"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Veliyle WhatsApp'ta Paylaş</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>,
    document.body
  );
};
