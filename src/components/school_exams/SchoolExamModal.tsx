import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, BookOpen, Award, CheckCircle2, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { SchoolExam } from '../../types';

interface SchoolExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exam: Omit<SchoolExam, 'id'> | SchoolExam) => void;
  initialExam?: SchoolExam | null;
  availableSubjects: string[];
  defaultSemester?: 1 | 2;
}

export const SchoolExamModal: React.FC<SchoolExamModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExam,
  availableSubjects,
  defaultSemester = 1
}) => {
  const [semester, setSemester] = useState<1 | 2>(defaultSemester);
  const [subject, setSubject] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [score, setScore] = useState<number | ''>(''); // 1. Sınav
  const [written2, setWritten2] = useState<number | ''>(''); // 2. Sınav
  const [perf1, setPerf1] = useState<number | ''>(''); // 1. Performans
  const [perf2, setPerf2] = useState<number | ''>(''); // 2. Performans
  const [project, setProject] = useState<number | ''>(''); // Proje
  const [weeklyHours, setWeeklyHours] = useState<number | ''>('');
  const [classAverage, setClassAverage] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialExam) {
      setSemester(initialExam.semester);
      if (availableSubjects.includes(initialExam.subject)) {
        setSubject(initialExam.subject);
        setCustomSubject('');
      } else {
        setSubject('OTHER');
        setCustomSubject(initialExam.subject);
      }
      setScore(typeof initialExam.score === 'number' ? initialExam.score : '');
      setWritten2(typeof initialExam.written2 === 'number' ? initialExam.written2 : '');
      setPerf1(typeof initialExam.perf1 === 'number' ? initialExam.perf1 : '');
      setPerf2(typeof initialExam.perf2 === 'number' ? initialExam.perf2 : '');
      setProject(typeof initialExam.project === 'number' ? initialExam.project : '');
      setWeeklyHours(typeof initialExam.weeklyHours === 'number' ? initialExam.weeklyHours : '');
      setClassAverage(typeof initialExam.classAverage === 'number' ? initialExam.classAverage : '');
      setDate(initialExam.date || new Date().toISOString().split('T')[0]);
      setNotes(initialExam.notes || '');
    } else {
      setSemester(defaultSemester);
      setSubject(availableSubjects[0] || 'Matematik');
      setCustomSubject('');
      setScore('');
      setWritten2('');
      setPerf1('');
      setPerf2('');
      setProject('');
      setWeeklyHours('');
      setClassAverage('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [initialExam, isOpen, availableSubjects, defaultSemester]);

  // Canlı Ders Ortalaması Hesaplama
  const liveAverage = useMemo(() => {
    const validScores: number[] = [];
    if (typeof score === 'number') validScores.push(score);
    if (typeof written2 === 'number') validScores.push(written2);
    if (typeof perf1 === 'number') validScores.push(perf1);
    if (typeof perf2 === 'number') validScores.push(perf2);
    if (typeof project === 'number') validScores.push(project);

    if (validScores.length === 0) return null;
    const sum = validScores.reduce((a, b) => a + b, 0);
    return Math.round((sum / validScores.length) * 100) / 100;
  }, [score, written2, perf1, perf2, project]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === 'OTHER' ? customSubject.trim() : subject;
    if (!finalSubject) return;

    const numScore = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0;
    const numWritten2 = typeof written2 === 'number' ? Math.max(0, Math.min(100, written2)) : undefined;
    const numPerf1 = typeof perf1 === 'number' ? Math.max(0, Math.min(100, perf1)) : undefined;
    const numPerf2 = typeof perf2 === 'number' ? Math.max(0, Math.min(100, perf2)) : undefined;
    const numProject = typeof project === 'number' ? Math.max(0, Math.min(100, project)) : undefined;
    const numWeeklyHours = typeof weeklyHours === 'number' ? Math.max(1, Math.min(20, weeklyHours)) : undefined;
    const numClassAvg = typeof classAverage === 'number' ? Math.max(0, Math.min(100, classAverage)) : undefined;

    const payload = {
      semester,
      examNumber: 1 as const,
      subject: finalSubject,
      score: numScore,
      written2: numWritten2,
      perf1: numPerf1,
      perf2: numPerf2,
      project: numProject,
      weeklyHours: numWeeklyHours,
      classAverage: numClassAvg,
      date,
      notes: notes.trim() || undefined
    };

    if (initialExam) {
      onSave({
        ...initialExam,
        ...payload
      });
    } else {
      onSave(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/60 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-850/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialExam ? `${initialExam.subject} Notlarını Düzenle` : 'Yeni Ders & Yazılı Notu Ekle'}
              </h2>
              <p className="text-xs text-slate-400">MEB müfredatı sınav, performans ve proje notlarını girin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Semester & Subject Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dönem</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSemester(1)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    semester === 1
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1. Dönem
                </button>
                <button
                  type="button"
                  onClick={() => setSemester(2)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    semester === 2
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2. Dönem
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ders Seçimi</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub} className="bg-slate-900">
                    {sub}
                  </option>
                ))}
                <option value="OTHER" className="bg-slate-900">➕ Diğer (Özel / Seçmeli Ders)</option>
              </select>
            </div>
          </div>

          {subject === 'OTHER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Özel / Seçmeli Ders Adı</label>
              <input
                type="text"
                required
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Örn: Seçmeli Astronomi ve Uzay Bilimleri"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Sınav ve Performans Notları Grid */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Ders Not Girişleri (0 - 100)</span>
              </span>
              {liveAverage !== null && (
                <div className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-black border ${
                  liveAverage >= 85 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  liveAverage >= 70 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                  liveAverage >= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  Ders Ortalaması: {liveAverage.toFixed(1)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* 1. Sınav */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  1. Sınav (Yazılı)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0 - 100"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 placeholder-slate-600 text-center"
                />
              </div>

              {/* 2. Sınav */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  2. Sınav (Yazılı)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={written2}
                  onChange={(e) => setWritten2(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0 - 100"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 placeholder-slate-600 text-center"
                />
              </div>

              {/* 1. Performans */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  1. Performans (Sözlü)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={perf1}
                  onChange={(e) => setPerf1(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0 - 100"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 placeholder-slate-600 text-center"
                />
              </div>

              {/* 2. Performans */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  2. Performans (Sözlü)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={perf2}
                  onChange={(e) => setPerf2(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0 - 100"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 placeholder-slate-600 text-center"
                />
              </div>

              {/* Proje */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Proje Notu (Varsa)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={project}
                  onChange={(e) => setProject(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0 - 100"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-purple-400 focus:outline-none focus:border-purple-500 placeholder-slate-600 text-center"
                />
              </div>

              {/* Haftalık Ders Saati */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Haftalık Ders Saati
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Örn: 4"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-amber-300 focus:outline-none focus:border-amber-500 placeholder-slate-600 text-center"
                />
              </div>
            </div>
          </div>

          {/* Sınıf Ortalaması & Tarih */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sınıf Ortalaması (İsteğe Bağlı)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={classAverage}
                onChange={(e) => setClassAverage(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Örn: 72.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tarih</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notlar / Konu Kapsamı (İsteğe Bağlı)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: 1. ve 2. ünite MEB Maarif kazanımları dahil edildi"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialExam ? 'Değişiklikleri Kaydet' : 'Ders Notunu Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
