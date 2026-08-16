import React from 'react';
import { Pencil, X, SlidersHorizontal, CheckCircle2, Clock, Sparkles, Globe } from 'lucide-react';
import { FieldType, GeneralMockExam, MockExamType } from '../../types';
import { sanitizeNetInput, parseNetVal } from '../../utils/mockUtils';

type TytSubKey = 'turkce' | 'matematik' | 'geometri' | 'fizik' | 'kimya' | 'biyoloji' | 'tarih' | 'cografya' | 'felsefe' | 'din';
type AytSubKey = 'matematik' | 'geometri' | 'fizik' | 'kimya' | 'biyoloji' | 'edebiyat' | 'tarih1' | 'cografya1' | 'tarih2' | 'cografya2' | 'felsefe2' | 'din2';

interface MockEditModalProps {
  editingMock: GeneralMockExam | null;
  setEditingMock: (mock: GeneralMockExam | null) => void;
  handleEditSubmit: (e: React.FormEvent) => void;
  editTitle: string;
  setEditTitle: (t: string) => void;
  editDate: string;
  setEditDate: (d: string) => void;
  editExamType: MockExamType;
  setEditExamType: (t: MockExamType) => void;
  targetField?: FieldType;
  editEntryMode: 'quick' | 'detailed';
  setEditEntryMode: (m: 'quick' | 'detailed') => void;
  editInputMethod: 'net' | 'dyb';
  setEditInputMethod: (m: 'net' | 'dyb') => void;
  editTytTurkce: number | string;
  setEditTytTurkce: (val: string) => void;
  editTytMat: number | string;
  setEditTytMat: (val: string) => void;
  editTytSosyal: number | string;
  setEditTytSosyal: (val: string) => void;
  editTytFen: number | string;
  setEditTytFen: (val: string) => void;
  editAytMat: number | string;
  setEditAytMat: (val: string) => void;
  editAytFen: number | string;
  setEditAytFen: (val: string) => void;
  editAytEdebiyatSos1: number | string;
  setEditAytEdebiyatSos1: (val: string) => void;
  editAytSos2: number | string;
  setEditAytSos2: (val: string) => void;
  editYdtNet: number | string;
  setEditYdtNet: (val: string) => void;
  editYdtDyb: { d: string; y: string; b: string; net: string };
  setEditYdtDyb: any;
  editYdtLanguage: string;
  setEditYdtLanguage: (l: string) => void;
  editTytDyb: any;
  setEditTytDyb: any;
  editAytDyb: any;
  setEditAytDyb: any;
  updateSubSubjectDybItem: any;
  editEstimatedRank: string;
  setEditEstimatedRank: (r: string) => void;
  editNotes: string;
  setEditNotes: (n: string) => void;
  editIsAnalyzed: boolean;
  setEditIsAnalyzed: (a: boolean) => void;
}

export const MockEditModal: React.FC<MockEditModalProps> = ({
  editingMock,
  setEditingMock,
  handleEditSubmit,
  editTitle,
  setEditTitle,
  editDate,
  setEditDate,
  editExamType,
  setEditExamType,
  targetField,
  editEntryMode,
  setEditEntryMode,
  editInputMethod,
  setEditInputMethod,
  editTytTurkce,
  setEditTytTurkce,
  editTytMat,
  setEditTytMat,
  editTytSosyal,
  setEditTytSosyal,
  editTytFen,
  setEditTytFen,
  editAytMat,
  setEditAytMat,
  editAytFen,
  setEditAytFen,
  editAytEdebiyatSos1,
  setEditAytEdebiyatSos1,
  editAytSos2,
  setEditAytSos2,
  editYdtNet,
  setEditYdtNet,
  editYdtDyb,
  setEditYdtDyb,
  editYdtLanguage,
  setEditYdtLanguage,
  editTytDyb,
  setEditTytDyb,
  editAytDyb,
  setEditAytDyb,
  updateSubSubjectDybItem,
  editEstimatedRank,
  setEditEstimatedRank,
  editNotes,
  setEditNotes,
  editIsAnalyzed,
  setEditIsAnalyzed
}) => {
  if (!editingMock) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) setEditingMock(null); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Pencil className="w-4 h-4 text-indigo-400" />
            <span>Deneme Sonucunu Düzenle</span>
          </h3>
          <button 
            type="button" 
            onClick={() => setEditingMock(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Deneme / Yayınevi Adı</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tarih</label>
              <input
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sınav Türü Seçimi */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Deneme Sınav Türü:</span>
              </span>
              {targetField && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  🎯 Hedef Alanınız: <strong className="text-white font-mono">{targetField}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(targetField === 'DİL' || (targetField as string) === 'DIL'
                ? [
                    { id: 'DIL' as MockExamType, label: 'DİL (YDT)', sub: '80 Soru', color: 'sky' },
                    { id: 'TYT' as MockExamType, label: 'TYT', sub: '120 Soru', color: 'indigo' },
                    { id: 'TYT_DIL' as MockExamType, label: 'TYT + DİL', sub: 'TYT & YDT', color: 'cyan' },
                    { id: 'AYT' as MockExamType, label: 'AYT', sub: '80 Soru', color: 'emerald' },
                    { id: 'TYT_AYT' as MockExamType, label: 'TYT + AYT', sub: 'Tam YKS', color: 'purple' },
                  ]
                : [
                    { id: 'TYT' as MockExamType, label: 'TYT', sub: '120 Soru', color: 'indigo' },
                    { id: 'AYT' as MockExamType, label: 'AYT', sub: '80 Soru', color: 'emerald' },
                    { id: 'TYT_AYT' as MockExamType, label: 'TYT + AYT', sub: 'Tam YKS', color: 'purple' },
                    { id: 'DIL' as MockExamType, label: 'DİL (YDT)', sub: '80 Soru', color: 'sky' },
                    { id: 'TYT_DIL' as MockExamType, label: 'TYT + DİL', sub: 'TYT & YDT', color: 'cyan' },
                  ]
              ).map(opt => {
                const isActive = editExamType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEditExamType(opt.id)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                      isActive
                        ? opt.color === 'sky'
                          ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                          : opt.color === 'emerald'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                          : opt.color === 'purple'
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                          : opt.color === 'cyan'
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                          : 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black">{opt.label}</span>
                    <span className={`text-[9px] ${isActive ? 'text-white/80' : 'text-slate-500'} font-medium`}>
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Entry Mode Switcher for Edit Modal */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ders Bazlı Veri Giriş Modu</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditEntryMode('quick')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    editEntryMode === 'quick' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚡ Hızlı (Ana Ders)
                </button>
                <button
                  type="button"
                  onClick={() => setEditEntryMode('detailed')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    editEntryMode === 'detailed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📊 Detaylı (Ayrı Alt Dersler)
                </button>
              </div>
            </div>

            {editEntryMode === 'detailed' && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 text-[11px]">Veri Tipi Tercihi:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditInputMethod('dyb')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      editInputMethod === 'dyb'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ✍️ Doğru / Yanlış / Boş Sayısı
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditInputMethod('net')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      editInputMethod === 'net'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🎯 Doğrudan Net
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QUICK MODE FOR EDIT */}
          {editEntryMode === 'quick' && (
            <div className="space-y-3 animate-fade-in">
              {/* TYT Section */}
              {(editExamType === 'TYT' || editExamType === 'TYT_AYT' || editExamType === 'TYT_DIL') && (
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">TYT Netleri</span>
                    <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                      Toplam: {(parseNetVal(editTytTurkce) + parseNetVal(editTytMat) + parseNetVal(editTytSosyal) + parseNetVal(editTytFen)).toFixed(2).replace('.', ',')} Net
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Türkçe (40)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={editTytTurkce}
                        onChange={(e) => setEditTytTurkce(sanitizeNetInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Matematik (40)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={editTytMat}
                        onChange={(e) => setEditTytMat(sanitizeNetInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Sosyal (20)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={editTytSosyal}
                        onChange={(e) => setEditTytSosyal(sanitizeNetInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Fen (20)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={editTytFen}
                        onChange={(e) => setEditTytFen(sanitizeNetInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AYT Section */}
              {(editExamType === 'AYT' || editExamType === 'TYT_AYT') && (
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">AYT Netleri</span>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                      Toplam: {(parseNetVal(editAytMat) + parseNetVal(editAytFen) + parseNetVal(editAytEdebiyatSos1) + parseNetVal(editAytSos2)).toFixed(2).replace('.', ',')} Net
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">AYT Mat (40)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={editAytMat}
                        onChange={(e) => setEditAytMat(sanitizeNetInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">AYT Fen (40)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={editAytFen}
                        onChange={(e) => setEditAytFen(sanitizeNetInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Edeb-Sos1 (40)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={editAytEdebiyatSos1}
                        onChange={(e) => setEditAytEdebiyatSos1(sanitizeNetInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">AYT Sos2 (40)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={editAytSos2}
                        onChange={(e) => setEditAytSos2(sanitizeNetInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DİL (YDT) Section */}
              {(editExamType === 'DIL' || editExamType === 'TYT_DIL') && (
                <div className="bg-slate-950 p-4 rounded-xl border border-sky-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-sky-400">YDT (Yabancı Dil) Netleri</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-sky-300 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                      Toplam: {parseNetVal(editYdtNet).toFixed(2).replace('.', ',')} Net
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Sınav Dili</label>
                      <select
                        value={editYdtLanguage}
                        onChange={(e) => setEditYdtLanguage(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-sky-300 font-bold focus:outline-none focus:border-sky-500"
                      >
                        <option value="İngilizce">İngilizce (80 Soru)</option>
                        <option value="Almanca">Almanca (80 Soru)</option>
                        <option value="Fransızca">Fransızca (80 Soru)</option>
                        <option value="Arapça">Arapça (80 Soru)</option>
                        <option value="Rusça">Rusça (80 Soru)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">YDT Neti (80 Soru)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={editYdtNet}
                        onChange={(e) => setEditYdtNet(sanitizeNetInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DETAILED MODE FOR EDIT */}
          {editEntryMode === 'detailed' && (
            <div className="space-y-4 animate-fade-in">
              {/* TYT Detailed Section */}
              {(editExamType === 'TYT' || editExamType === 'TYT_AYT' || editExamType === 'TYT_DIL') && (
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">TYT Ayrıntılı Ders Netleri</span>
                    <span className="text-[11px] text-indigo-300 font-mono">
                      Otomatik TYT Toplam: {(
                        (parseNetVal(editTytDyb?.turkce?.net)) +
                        (parseNetVal(editTytDyb?.matematik?.net)) +
                        (parseNetVal(editTytDyb?.geometri?.net)) +
                        (parseNetVal(editTytDyb?.fizik?.net)) +
                        (parseNetVal(editTytDyb?.kimya?.net)) +
                        (parseNetVal(editTytDyb?.biyoloji?.net)) +
                        (parseNetVal(editTytDyb?.tarih?.net)) +
                        (parseNetVal(editTytDyb?.cografya?.net)) +
                        (parseNetVal(editTytDyb?.felsefe?.net)) +
                        (parseNetVal(editTytDyb?.din?.net))
                      ).toFixed(2).replace('.', ',')} Net
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'turkce', label: 'Türkçe', max: 40 },
                      { key: 'matematik', label: 'Matematik', max: 30 },
                      { key: 'geometri', label: 'Geometri', max: 10 },
                      { key: 'fizik', label: 'Fizik', max: 7 },
                      { key: 'kimya', label: 'Kimya', max: 7 },
                      { key: 'biyoloji', label: 'Biyoloji', max: 6 },
                      { key: 'tarih', label: 'Tarih', max: 5 },
                      { key: 'cografya', label: 'Coğrafya', max: 5 },
                      { key: 'felsefe', label: 'Felsefe', max: 5 },
                      { key: 'din', label: 'Din Kültürü', max: 5 },
                    ].map((sub) => {
                      const k = sub.key as TytSubKey;
                      const item = editTytDyb?.[k] || { d: '', y: '', b: '', net: '' };

                      return (
                        <div key={k} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 text-[11px]">{sub.label} ({sub.max})</span>
                            <span className="text-indigo-400 font-mono font-bold text-[11px]">{item.net !== '' ? `${item.net} N` : '-'}</span>
                          </div>

                          {editInputMethod === 'dyb' ? (
                            <div className="grid grid-cols-3 gap-1">
                              <input
                                type="text"
                                placeholder="D"
                                value={item.d}
                                onChange={(e) => updateSubSubjectDybItem(setEditTytDyb, k, 'd', e.target.value, 'dyb')}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-emerald-400 font-mono text-center focus:outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Y"
                                value={item.y}
                                onChange={(e) => updateSubSubjectDybItem(setEditTytDyb, k, 'y', e.target.value, 'dyb')}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-rose-400 font-mono text-center focus:outline-none"
                              />
                              <input
                                type="text"
                                placeholder="B"
                                value={item.b}
                                onChange={(e) => updateSubSubjectDybItem(setEditTytDyb, k, 'b', e.target.value, 'dyb')}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-400 font-mono text-center focus:outline-none"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder="Net"
                              value={item.net}
                              onChange={(e) => updateSubSubjectDybItem(setEditTytDyb, k, 'net', e.target.value, 'net')}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-indigo-300 font-mono focus:outline-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AYT Detailed Section */}
              {(editExamType === 'AYT' || editExamType === 'TYT_AYT') && (
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">AYT Ayrıntılı Ders Netleri</span>
                    <span className="text-[11px] text-emerald-300 font-mono">
                      Otomatik AYT Toplam: {(
                        (parseNetVal(editAytDyb?.matematik?.net)) +
                        (parseNetVal(editAytDyb?.geometri?.net)) +
                        (parseNetVal(editAytDyb?.fizik?.net)) +
                        (parseNetVal(editAytDyb?.kimya?.net)) +
                        (parseNetVal(editAytDyb?.biyoloji?.net)) +
                        (parseNetVal(editAytDyb?.edebiyat?.net)) +
                        (parseNetVal(editAytDyb?.tarih1?.net)) +
                        (parseNetVal(editAytDyb?.cografya1?.net)) +
                        (parseNetVal(editAytDyb?.tarih2?.net)) +
                        (parseNetVal(editAytDyb?.cografya2?.net)) +
                        (parseNetVal(editAytDyb?.felsefe2?.net)) +
                        (parseNetVal(editAytDyb?.din2?.net))
                      ).toFixed(2).replace('.', ',')} Net
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'matematik', label: 'AYT Matematik', max: 30 },
                      { key: 'geometri', label: 'AYT Geometri', max: 10 },
                      { key: 'fizik', label: 'AYT Fizik', max: 14 },
                      { key: 'kimya', label: 'AYT Kimya', max: 13 },
                      { key: 'biyoloji', label: 'AYT Biyoloji', max: 13 },
                      { key: 'edebiyat', label: 'Edebiyat', max: 24 },
                      { key: 'tarih1', label: 'Tarih-1', max: 10 },
                      { key: 'cografya1', label: 'Coğrafya-1', max: 6 },
                      { key: 'tarih2', label: 'Tarih-2', max: 11 },
                      { key: 'cografya2', label: 'Coğrafya-2', max: 11 },
                      { key: 'felsefe2', label: 'Felsefe Grubu', max: 12 },
                      { key: 'din2', label: 'Din Kültürü', max: 6 },
                    ].map((sub) => {
                      const k = sub.key as AytSubKey;
                      const item = editAytDyb?.[k] || { d: '', y: '', b: '', net: '' };

                      return (
                        <div key={k} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 text-[11px]">{sub.label} ({sub.max})</span>
                            <span className="text-emerald-400 font-mono font-bold text-[11px]">{item.net !== '' ? `${item.net} N` : '-'}</span>
                          </div>

                          {editInputMethod === 'dyb' ? (
                            <div className="grid grid-cols-3 gap-1">
                              <input
                                type="text"
                                placeholder="D"
                                value={item.d}
                                onChange={(e) => updateSubSubjectDybItem(setEditAytDyb, k, 'd', e.target.value, 'dyb')}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-emerald-400 font-mono text-center focus:outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Y"
                                value={item.y}
                                onChange={(e) => updateSubSubjectDybItem(setEditAytDyb, k, 'y', e.target.value, 'dyb')}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-rose-400 font-mono text-center focus:outline-none"
                              />
                              <input
                                type="text"
                                placeholder="B"
                                value={item.b}
                                onChange={(e) => updateSubSubjectDybItem(setEditAytDyb, k, 'b', e.target.value, 'dyb')}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-400 font-mono text-center focus:outline-none"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder="Net"
                              value={item.net}
                              onChange={(e) => updateSubSubjectDybItem(setEditAytDyb, k, 'net', e.target.value, 'net')}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-emerald-300 font-mono focus:outline-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DİL (YDT) Detailed Section */}
              {(editExamType === 'DIL' || editExamType === 'TYT_DIL') && (
                <div className="bg-slate-950 p-4 rounded-xl border border-sky-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-sky-400">YDT (Yabancı Dil) Soru Dağılımı</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-sky-300 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                      Toplam: {editYdtDyb?.net !== '' ? `${editYdtDyb.net} Net` : `${parseNetVal(editYdtNet).toFixed(2).replace('.', ',')} Net`}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <select
                          value={editYdtLanguage}
                          onChange={(e) => setEditYdtLanguage(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-sky-300 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500"
                        >
                          <option value="İngilizce">İngilizce</option>
                          <option value="Almanca">Almanca</option>
                          <option value="Fransızca">Fransızca</option>
                          <option value="Arapça">Arapça</option>
                          <option value="Rusça">Rusça</option>
                        </select>
                        <span className="text-slate-400 text-xs">(80 Soru)</span>
                      </div>
                      <span className="text-sky-400 font-mono font-bold text-xs">{editYdtDyb?.net !== '' ? `${editYdtDyb.net} Net` : '-'}</span>
                    </div>

                    {editInputMethod === 'dyb' ? (
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Doğru"
                          value={editYdtDyb?.d || ''}
                          onChange={(e) => {
                            const d = sanitizeNetInput(e.target.value);
                            setEditYdtDyb((prev: any) => {
                              const y = prev?.y || '';
                              const dNum = parseNetVal(d);
                              const yNum = parseNetVal(y);
                              const calcNet = Number((dNum - yNum / 4).toFixed(2));
                              return { ...prev, d, net: String(calcNet).replace('.', ',') };
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-mono text-center focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Yanlış"
                          value={editYdtDyb?.y || ''}
                          onChange={(e) => {
                            const y = sanitizeNetInput(e.target.value);
                            setEditYdtDyb((prev: any) => {
                              const d = prev?.d || '';
                              const dNum = parseNetVal(d);
                              const yNum = parseNetVal(y);
                              const calcNet = Number((dNum - yNum / 4).toFixed(2));
                              return { ...prev, y, net: String(calcNet).replace('.', ',') };
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-rose-400 font-mono text-center focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Boş"
                          value={editYdtDyb?.b || ''}
                          onChange={(e) => {
                            const b = sanitizeNetInput(e.target.value);
                            setEditYdtDyb((prev: any) => ({ ...prev, b }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-400 font-mono text-center focus:outline-none"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Net"
                        value={editYdtDyb?.net || ''}
                        onChange={(e) => {
                          const net = sanitizeNetInput(e.target.value);
                          setEditYdtDyb((prev: any) => ({ ...prev, net }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-sky-300 font-mono focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tahmini Türkiye Sıralaması</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ör: 4500"
                value={editEstimatedRank}
                onChange={(e) => setEditEstimatedRank(sanitizeNetInput(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Genel Notlar</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Deneme Analizi Durumu</span>
              <span className="text-[10px] text-slate-400 font-normal">Doğru, yanlış, boş ve soru hataları incelendi mi?</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditIsAnalyzed(true)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                  editIsAnalyzed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Analiz Edildi</span>
              </button>

              <button
                type="button"
                onClick={() => setEditIsAnalyzed(false)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                  !editIsAnalyzed
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Analiz Edilmedi</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingMock(null)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              İptal
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md"
            >
              Değişiklikleri Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
