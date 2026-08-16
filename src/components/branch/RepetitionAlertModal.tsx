import React from 'react';
import { X, Bell, Brain, ArrowRight, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { TopicErrorItem } from '../../types';

interface RepetitionAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueQuestions: TopicErrorItem[];
  onStartRepetition: () => void;
}

export const RepetitionAlertModal: React.FC<RepetitionAlertModalProps> = ({
  isOpen,
  onClose,
  dueQuestions,
  onStartRepetition
}) => {
  if (!isOpen || dueQuestions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-fade-in relative overflow-hidden">
        
        {/* Glow background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Aralıklı Tekrar Hatırlatıcı</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Icon & Title */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-indigo-600/30">
            <Brain className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            {dueQuestions.length} Adet Soruyu Tekrar Etme Zamanın Geldi! 🎯
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hata Defterine eklediğin <strong className="text-indigo-400">{dueQuestions.length} sorunun</strong> aralıklı tekrar günü geldi. İpuçsuz kör tekrar moduyla soruları hemen çöz ve bilgiyi kalıcı hale getir!
          </p>
        </div>

        {/* Due Items Preview Badge List */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2 max-h-36 overflow-y-auto">
          {dueQuestions.slice(0, 4).map((item, idx) => (
            <div key={item.id || idx} className="flex items-center justify-between text-xs text-slate-300 py-1 border-b border-slate-800/60 last:border-0">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span className="font-bold text-white truncate">{item.subject}</span>
                <span className="text-slate-400 truncate text-[11px]">- {item.topicName}</span>
              </div>
              <span className="text-[10px] bg-purple-500/15 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/25 shrink-0">
                {(item.repetitionStage ?? 0) + 1}. Tekrar
              </span>
            </div>
          ))}
          {dueQuestions.length > 4 && (
            <p className="text-[10px] text-slate-500 text-center pt-1 italic font-medium">
              ...ve {dueQuestions.length - 4} soru daha
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer"
          >
            Daha Sonra
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartRepetition();
            }}
            className="flex-[2] py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Hemen Tekrar Et</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
