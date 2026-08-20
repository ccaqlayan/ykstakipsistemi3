import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, CheckCircle2, AlertCircle, Sparkles, ChevronRight, ChevronLeft, 
  RotateCcw, Brain, Trophy, BookOpen, Layers, ArrowRight, Eye, Check, HelpCircle 
} from 'lucide-react';
import { TopicErrorItem } from '../../types';
import { 
  recordRepetitionAttempt, 
  getUserRepetitionIntervals, 
  extractOptionLetter 
} from '../../services/spacedRepetition';

interface SpacedRepetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueQuestions: TopicErrorItem[];
  onUpdateTopicError: (err: TopicErrorItem) => void;
  onOpenSolutionModal?: (err: TopicErrorItem) => void;
  onOpenSimilarModal?: (err: TopicErrorItem) => void;
}

export const SpacedRepetitionModal: React.FC<SpacedRepetitionModalProps> = ({
  isOpen,
  onClose,
  dueQuestions,
  onUpdateTopicError,
  onOpenSolutionModal,
  onOpenSimilarModal
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [attemptResult, setAttemptResult] = useState<{
    isCorrect: boolean;
    message: string;
    correctOption: string;
  } | null>(null);
  const [showSolutionInline, setShowSolutionInline] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const intervals = getUserRepetitionIntervals();
  const currentQuestion = dueQuestions[currentIndex];

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setAttemptResult(null);
      setShowSolutionInline(false);
      setCompletedCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedOption(null);
    setAttemptResult(null);
    setShowSolutionInline(false);
  }, [currentIndex]);

  if (!isOpen) return null;

  if (!currentQuestion || dueQuestions.length === 0) {
    const finishContent = (
      <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-fade-in my-auto modal-dialog-card">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">Harika İş Çıkardın! 🎉</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Bugün için tekrar zamanı gelen tüm soruları başarıyla tamamladın. Düzenli aralıklı tekrarlar hafızanı zirvede tutacak!
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            Hata Defterine Dön
          </button>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(finishContent, document.body) : finishContent;
  }

  const stage = (currentQuestion.repetitionStage ?? 0) + 1;
  const stageDay = intervals[stage - 1] ?? 7;

  const handleSelectOption = (opt: string) => {
    if (attemptResult) return; // Zaten cevaplandı

    setSelectedOption(opt);
    const result = recordRepetitionAttempt(currentQuestion, opt, intervals);
    onUpdateTopicError(result.updatedError);

    const correctRaw = currentQuestion.correctOption || currentQuestion.aiSolutionCorrectAnswer || '';
    const correctLetter = extractOptionLetter(correctRaw);

    setAttemptResult({
      isCorrect: result.isCorrect,
      message: result.message,
      correctOption: correctLetter || 'Belirtilmedi'
    });

    if (result.isCorrect) {
      setCompletedCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < dueQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Tüm sorular bitti
      setCurrentIndex(dueQuestions.length);
    }
  };

  const mainContent = (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-y-auto">
      
      {/* 🟢 TOP BAR */}
      <div className="w-full max-w-4xl flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md shrink-0 mb-2">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-white truncate">
                {currentQuestion.subject} - {currentQuestion.topicName}
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold shrink-0">
                {stage}. Tekrar ({stageDay}. Gün)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Kör Tekrar Modu: İpuçsuz kendi hafızanla doğru şıkkı bulmaya çalış!
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-300 font-mono text-[11px] font-bold">
            {currentIndex + 1} / {dueQuestions.length}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 🖼️ QUESTION CONTENT AREA */}
      <div className="flex-1 w-full max-w-4xl bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px] max-h-[60vh] sm:max-h-[65vh]">
        {currentQuestion.imageUrl ? (
          <div className="w-full h-full flex items-center justify-center overflow-auto rounded-xl">
            <img
              src={currentQuestion.imageUrl}
              alt="Tekrar Sorusu"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        ) : (
          <div className="text-center p-6 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-200">{currentQuestion.subject} - {currentQuestion.topicName}</h4>
            <p className="text-xs text-slate-400 italic">Fotoğraf eklenmemiş soru. Hafızandaki bilgiyi değerlendirmek için aşağıdaki şıkları kullanabilirsin.</p>
          </div>
        )}
      </div>

      {/* 🎯 BOTTOM INTERACTION AREA (OPTIONS & FEEDBACK) */}
      <div className="w-full max-w-4xl mt-2 space-y-2 shrink-0">
        
        {/* Feedback Card when answered */}
        {attemptResult && (
          <div className={`p-3 sm:p-4 rounded-2xl border transition-all animate-fade-in ${
            attemptResult.isCorrect 
              ? 'bg-emerald-950/80 border-emerald-500/40 shadow-lg shadow-emerald-950/40' 
              : 'bg-rose-950/80 border-rose-500/40 shadow-lg shadow-rose-950/40'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start space-x-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  attemptResult.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {attemptResult.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className={`text-xs sm:text-sm font-black ${attemptResult.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {attemptResult.isCorrect ? 'Tebrikler, Doğru Cevap! 🎉' : `Cevabın Yanlış (Doğru Cevap: ${attemptResult.correctOption})`}
                  </h4>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    {attemptResult.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                {!attemptResult.isCorrect && (
                  <>
                    {onOpenSolutionModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSolutionModal(currentQuestion);
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Çözümü Aç</span>
                      </button>
                    )}

                    {onOpenSimilarModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSimilarModal(currentQuestion);
                        }}
                        className="px-2.5 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-sm"
                        title="Bu sorunun mantığını benzer sorularla pekiştir"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Benzer Sorularla Pekiştir</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all flex items-center space-x-1 shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  <span>{currentIndex < dueQuestions.length - 1 ? 'Sonraki Soru' : 'Tamamla'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Option Selection Buttons */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md">
          {!currentQuestion.correctOption && !currentQuestion.aiSolutionCorrectAnswer && (
            <div className="mb-2.5 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Bu sorunun doğru cevabı girilmemiş. Lütfen hata kaydını düzenleyerek doğru şıkkı kaydediniz.</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
              <span>👇 Şıkkını İşaretle:</span>
              <span className="text-[10px] text-slate-500 font-normal">(Dokunmatik ve Hızlı Seçim)</span>
            </span>
            {attemptResult && (
              <span className="text-[10px] text-slate-400 font-mono">
                {completedCount} doğru / {dueQuestions.length} soru
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {['A', 'B', 'C', 'D', 'E'].map((opt) => {
              const isSelected = selectedOption === opt;
              let btnStyle = 'bg-slate-800/90 text-slate-200 border-slate-700/80 hover:bg-slate-750 hover:text-white';
              
              if (attemptResult) {
                const correctOpt = attemptResult.correctOption;
                if (opt === correctOpt) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50 scale-105';
                } else if (isSelected && !attemptResult.isCorrect) {
                  btnStyle = 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50';
                } else {
                  btnStyle = 'bg-slate-900/60 text-slate-600 border-slate-800 opacity-50 cursor-not-allowed';
                }
              } else if (isSelected) {
                btnStyle = 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50';
              }

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={!!attemptResult}
                  onClick={() => handleSelectOption(opt)}
                  className={`py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer border flex items-center justify-center space-x-1 shadow-sm ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {attemptResult && opt === attemptResult.correctOption && (
                    <Check className="w-3.5 h-3.5 stroke-[3] ml-1 text-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );

  return typeof document !== 'undefined' ? createPortal(mainContent, document.body) : mainContent;
};
