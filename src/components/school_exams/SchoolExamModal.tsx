import React, { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { SchoolExam } from '../../types';

interface SchoolExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exam: Omit<SchoolExam, 'id'> | SchoolExam) => void;
  initialExam?: SchoolExam | null;
  availableSubjects: string[];
}

export const SchoolExamModal: React.FC<SchoolExamModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExam,
  availableSubjects
}) => {
  const [semester, setSemester] = useState<1 | 2>(1);
  const [examNumber, setExamNumber] = useState<1 | 2>(1);
  const [subject, setSubject] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [score, setScore] = useState<number | ''>('');
  const [classAverage, setClassAverage] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialExam) {
      setSemester(initialExam.semester);
      setExamNumber(initialExam.examNumber);
      if (availableSubjects.includes(initialExam.subject)) {
        setSubject(initialExam.subject);
        setCustomSubject('');
      } else {
        setSubject('OTHER');
        setCustomSubject(initialExam.subject);
      }
      setScore(initialExam.score);
      setClassAverage(initialExam.classAverage ?? '');
      setDate(initialExam.date || new Date().toISOString().split('T')[0]);
      setNotes(initialExam.notes || '');
    } else {
      setSemester(1);
      setExamNumber(1);
      setSubject(availableSubjects[0] || 'Matematik');
      setCustomSubject('');
      setScore('');
      setClassAverage('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [initialExam, isOpen, availableSubjects]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === 'OTHER' ? customSubject.trim() : subject;
    if (!finalSubject) return;

    const numScore = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0;
    const numClassAvg = typeof classAverage === 'number' ? Math.max(0, Math.min(100, classAverage)) : undefined;

    if (initialExam) {
      onSave({
        ...initialExam,
        semester,
        examNumber,
        subject: finalSubject,
        score: numScore,
        classAverage: numClassAvg,
        date,
        notes: notes.trim() || undefined
      });
    } else {
      onSave({
        semester,
        examNumber,
        subject: finalSubject,
        score: numScore,
        classAverage: numClassAvg,
        date,
        notes: notes.trim() || undefined
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/60 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialExam ? 'Yazılı Notunu Düzenle' : 'Yeni Okul Yazılı Notu Ekle'}
              </h2>
              <p className="text-xs text-slate-400">MEB müfredatı okul yazılı sınav sonucunu girin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Semester & Exam Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dönem</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSemester(1)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
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
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Yazılı Sırası</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setExamNumber(1)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    examNumber === 1
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1. Yazılı
                </button>
                <button
                  type="button"
                  onClick={() => setExamNumber(2)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    examNumber === 2
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2. Yazılı
                </button>
              </div>
            </div>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ders</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
              <option value="OTHER">Diğer (Manuel Giriş)</option>
            </select>
          </div>

          {subject === 'OTHER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ders Adı</label>
              <input
                type="text"
                required
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Örn: Seçmeli Proje Hazırlama"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Score & Class Average */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Aldığınız Not (0-100) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={score}
                onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Örn: 85"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

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
                placeholder="Örn: 68.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sınav Tarihi</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notlar / Kapsam (İsteğe Bağlı)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: 1. ve 2. ünite dahil yapıldı"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialExam ? 'Değişiklikleri Kaydet' : 'Notu Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
