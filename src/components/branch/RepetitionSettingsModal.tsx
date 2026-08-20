import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Settings, Plus, Trash2, RotateCcw, Check, Sparkles } from 'lucide-react';
import { 
  getUserRepetitionIntervals, 
  saveUserRepetitionIntervals, 
  DEFAULT_REPETITION_INTERVALS 
} from '../../services/spacedRepetition';

interface RepetitionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (newIntervals: number[]) => void;
}

export const RepetitionSettingsModal: React.FC<RepetitionSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [intervals, setIntervals] = useState<number[]>(() => getUserRepetitionIntervals());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUpdateInterval = (index: number, val: number) => {
    if (val < 1) val = 1;
    const next = [...intervals];
    next[index] = val;
    setIntervals(next);
  };

  const handleAddStage = () => {
    const last = intervals[intervals.length - 1] ?? 7;
    setIntervals([...intervals, last * 2]);
  };

  const handleRemoveStage = (index: number) => {
    if (intervals.length <= 1) return;
    setIntervals(intervals.filter((_, i) => i !== index));
  };

  const handleResetDefaults = () => {
    setIntervals(DEFAULT_REPETITION_INTERVALS);
  };

  const handleApplyPreset = (preset: number[]) => {
    setIntervals(preset);
  };

  const handleSave = () => {
    saveUserRepetitionIntervals(intervals);
    if (onSave) onSave(intervals);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in my-auto modal-dialog-card">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Aralıklı Tekrar Ayarları</h3>
              <p className="text-[10px] text-slate-400">Soru tekrar zaman aralıklarını özelleştirin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300">Hazır Şablonlar:</label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPreset([1, 3, 7])}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-[11px] font-bold text-slate-200 text-center transition-all cursor-pointer"
            >
              1 - 3 - 7 Gün <span className="text-[9px] text-indigo-400 block font-normal">(Standart)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset([1, 2, 4])}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-[11px] font-bold text-slate-200 text-center transition-all cursor-pointer"
            >
              1 - 2 - 4 Gün <span className="text-[9px] text-emerald-400 block font-normal">(Hızlı)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset([1, 3, 7, 14, 30])}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-[11px] font-bold text-slate-200 text-center transition-all cursor-pointer"
            >
              5 Aşamalı <span className="text-[9px] text-purple-400 block font-normal">(Kapsamlı)</span>
            </button>
          </div>
        </div>

        {/* Intervals List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-300">Tekrar Aşamaları (Gün Sonra):</label>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[10px] text-slate-400 hover:text-indigo-300 flex items-center space-x-1 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıfırla</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {intervals.map((days, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-800 rounded-xl gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-300">{idx + 1}. Tekrar:</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={days}
                      onChange={(e) => handleUpdateInterval(idx, parseInt(e.target.value) || 1)}
                      className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold text-center focus:outline-none focus:border-indigo-400"
                    />
                    <span className="text-xs text-slate-400">gün</span>
                  </div>

                  {intervals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Bu aşamayı sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {intervals.length < 8 && (
            <button
              type="button"
              onClick={handleAddStage}
              className="w-full py-1.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 text-xs font-bold rounded-xl border border-dashed border-indigo-500/30 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Tekrar Aşaması Ekle</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Kaydedildi!</span>
              </>
            ) : (
              <span>Ayarları Kaydet</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
