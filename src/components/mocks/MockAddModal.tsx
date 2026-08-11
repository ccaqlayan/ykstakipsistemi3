import React from 'react';
import { Plus, X, SlidersHorizontal, CheckCircle2, Clock } from 'lucide-react';
import { sanitizeNetInput, parseNetVal } from '../../utils/mockUtils';

type TytSubKey = 'turkce' | 'matematik' | 'geometri' | 'fizik' | 'kimya' | 'biyoloji' | 'tarih' | 'cografya' | 'felsefe' | 'din';
type AytSubKey = 'matematik' | 'geometri' | 'fizik' | 'kimya' | 'biyoloji' | 'edebiyat' | 'tarih1' | 'cografya1' | 'tarih2' | 'cografya2' | 'felsefe2' | 'din2';

interface MockAddModalProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  title: string;
  setTitle: (t: string) => void;
  date: string;
  setDate: (d: string) => void;
  addEntryMode: 'quick' | 'detailed';
  setAddEntryMode: (m: 'quick' | 'detailed') => void;
  addInputMethod: 'net' | 'dyb';
  setAddInputMethod: (m: 'net' | 'dyb') => void;
  tytTurkce: number | string;
  setTytTurkce: (val: string) => void;
  tytMat: number | string;
  setTytMat: (val: string) => void;
  tytSosyal: number | string;
  setTytSosyal: (val: string) => void;
  tytFen: number | string;
  setTytFen: (val: string) => void;
  aytMat: number | string;
  setAytMat: (val: string) => void;
  aytFen: number | string;
  setAytFen: (val: string) => void;
  aytEdebiyatSos1: number | string;
  setAytEdebiyatSos1: (val: string) => void;
  aytSos2: number | string;
  setAytSos2: (val: string) => void;
  addTytDyb: any;
  setAddTytDyb: any;
  addAytDyb: any;
  setAddAytDyb: any;
  updateSubSubjectDybItem: any;
  estimatedRank: string;
  setEstimatedRank: (r: string) => void;
  notes: string;
  setNotes: (n: string) => void;
  isAnalyzed: boolean;
  setIsAnalyzed: (a: boolean) => void;
}

export const MockAddModal: React.FC<MockAddModalProps> = ({
  showAddModal,
  setShowAddModal,
  handleSubmit,
  title,
  setTitle,
  date,
  setDate,
  addEntryMode,
  setAddEntryMode,
  addInputMethod,
  setAddInputMethod,
  tytTurkce,
  setTytTurkce,
  tytMat,
  setTytMat,
  tytSosyal,
  setTytSosyal,
  tytFen,
  setTytFen,
  aytMat,
  setAytMat,
  aytFen,
  setAytFen,
  aytEdebiyatSos1,
  setAytEdebiyatSos1,
  aytSos2,
  setAytSos2,
  addTytDyb,
  setAddTytDyb,
  addAytDyb,
  setAddAytDyb,
  updateSubSubjectDybItem,
  estimatedRank,
  setEstimatedRank,
  notes,
  setNotes,
  isAnalyzed,
  setIsAnalyzed
}) => {
  if (!showAddModal) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
    >
      <div className="bg-slate-900/95 border border-indigo-500/30 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl shadow-indigo-950/50 space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl shadow-md shadow-indigo-600/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">Yeni Genel Deneme Sonucu Gir</h3>
              <p className="text-xs text-slate-400 font-medium">TYT & AYT genel deneme netlerinizi sisteme kaydedin</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setShowAddModal(false)}
            className="text-slate-400 hover:text-white p-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Info: Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Deneme / Yayınevi Adı</label>
              <input
                type="text"
                required
                placeholder="Ör: ÖZDEBİR Türkiye Geneli #4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Tarih</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Entry Mode Switcher */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Veri Giriş Hassasiyeti:</span>
              </span>

              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddEntryMode('quick')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    addEntryMode === 'quick'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  ⚡ Hızlı (Ana Dersler)
                </button>
                <button
                  type="button"
                  onClick={() => setAddEntryMode('detailed')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    addEntryMode === 'detailed'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  📊 Detaylı (Mat/Geo, Fiz/Kim/Biyo...)
                </button>
              </div>
            </div>

            {addEntryMode === 'detailed' && (
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-900 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold">Giriş Yöntemi:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddInputMethod('dyb')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      addInputMethod === 'dyb'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ✍️ Doğru / Yanlış / Boş
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddInputMethod('net')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      addInputMethod === 'net'
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

          {/* QUICK ENTRY MODE */}
          {addEntryMode === 'quick' && (
            <div className="space-y-4 animate-fade-in">
              {/* TYT Section */}
              <div className="bg-slate-950/80 p-4.5 rounded-2xl border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">TYT Netleri</span>
                  <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                    Toplam: {(parseNetVal(tytTurkce) + parseNetVal(tytMat) + parseNetVal(tytSosyal) + parseNetVal(tytFen)).toFixed(2).replace('.', ',')} Net
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Türkçe (40 Soru)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={tytTurkce}
                      onChange={(e) => setTytTurkce(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Matematik (40 Soru)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={tytMat}
                      onChange={(e) => setTytMat(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sosyal (20 Soru)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={tytSosyal}
                      onChange={(e) => setTytSosyal(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fen (20 Soru)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={tytFen}
                      onChange={(e) => setTytFen(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* AYT Section */}
              <div className="bg-slate-950/80 p-4.5 rounded-2xl border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">AYT Netleri</span>
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                    Toplam: {(parseNetVal(aytMat) + parseNetVal(aytFen) + parseNetVal(aytEdebiyatSos1) + parseNetVal(aytSos2)).toFixed(2).replace('.', ',')} Net
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">AYT Mat (40 Soru)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={aytMat}
                      onChange={(e) => setAytMat(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">AYT Fen (40 Soru)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={aytFen}
                      onChange={(e) => setAytFen(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Edeb-Sos1 (40 Soru)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={aytEdebiyatSos1}
                      onChange={(e) => setAytEdebiyatSos1(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">AYT Sos2 (40 Soru)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={aytSos2}
                      onChange={(e) => setAytSos2(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DETAILED ENTRY MODE */}
          {addEntryMode === 'detailed' && (
            <div className="space-y-4 animate-fade-in">
              {/* TYT Detailed Section */}
              <div className="bg-slate-950/80 p-4.5 rounded-2xl border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">TYT Alt Ders Kırılımları</span>
                  <span className="text-xs text-indigo-300 font-mono font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                    Hesaplanan TYT: {(
                      (parseNetVal(addTytDyb?.turkce?.net)) +
                      (parseNetVal(addTytDyb?.matematik?.net)) +
                      (parseNetVal(addTytDyb?.geometri?.net)) +
                      (parseNetVal(addTytDyb?.fizik?.net)) +
                      (parseNetVal(addTytDyb?.kimya?.net)) +
                      (parseNetVal(addTytDyb?.biyoloji?.net)) +
                      (parseNetVal(addTytDyb?.tarih?.net)) +
                      (parseNetVal(addTytDyb?.cografya?.net)) +
                      (parseNetVal(addTytDyb?.felsefe?.net)) +
                      (parseNetVal(addTytDyb?.din?.net))
                    ).toFixed(2).replace('.', ',')} Net
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
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
                    const item = addTytDyb?.[k] || { d: '', y: '', b: '', net: '' };

                    return (
                      <div key={k} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-[11px]">{sub.label} ({sub.max})</span>
                          <span className="text-indigo-400 font-mono font-bold text-[11px]">{item.net !== '' ? `${item.net} Net` : '-'}</span>
                        </div>

                        {addInputMethod === 'dyb' ? (
                          <div className="grid grid-cols-3 gap-1.5">
                            <input
                              type="text"
                              placeholder="D"
                              value={item.d}
                              onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'd', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-emerald-400 font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              type="text"
                              placeholder="Y"
                              value={item.y}
                              onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'y', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-rose-400 font-mono font-bold text-center focus:outline-none focus:border-rose-500"
                            />
                            <input
                              type="text"
                              placeholder="B"
                              value={item.b}
                              onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'b', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-400 font-mono font-bold text-center focus:outline-none focus:border-slate-600"
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Net"
                            value={item.net}
                            onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'net', e.target.value, 'net')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AYT Detailed Section */}
              <div className="bg-slate-950/80 p-4.5 rounded-2xl border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">AYT Alt Ders Kırılımları</span>
                  <span className="text-xs text-emerald-300 font-mono font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                    Hesaplanan AYT: {(
                      (parseNetVal(addAytDyb?.matematik?.net)) +
                      (parseNetVal(addAytDyb?.geometri?.net)) +
                      (parseNetVal(addAytDyb?.fizik?.net)) +
                      (parseNetVal(addAytDyb?.kimya?.net)) +
                      (parseNetVal(addAytDyb?.biyoloji?.net)) +
                      (parseNetVal(addAytDyb?.edebiyat?.net)) +
                      (parseNetVal(addAytDyb?.tarih1?.net)) +
                      (parseNetVal(addAytDyb?.cografya1?.net)) +
                      (parseNetVal(addAytDyb?.tarih2?.net)) +
                      (parseNetVal(addAytDyb?.cografya2?.net)) +
                      (parseNetVal(addAytDyb?.felsefe2?.net)) +
                      (parseNetVal(addAytDyb?.din2?.net))
                    ).toFixed(2).replace('.', ',')} Net
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
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
                    const item = addAytDyb?.[k] || { d: '', y: '', b: '', net: '' };

                    return (
                      <div key={k} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-[11px]">{sub.label} ({sub.max})</span>
                          <span className="text-emerald-400 font-mono font-bold text-[11px]">{item.net !== '' ? `${item.net} Net` : '-'}</span>
                        </div>

                        {addInputMethod === 'dyb' ? (
                          <div className="grid grid-cols-3 gap-1.5">
                            <input
                              type="text"
                              placeholder="D"
                              value={item.d}
                              onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'd', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-emerald-400 font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              type="text"
                              placeholder="Y"
                              value={item.y}
                              onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'y', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-rose-400 font-mono font-bold text-center focus:outline-none focus:border-rose-500"
                            />
                            <input
                              type="text"
                              placeholder="B"
                              value={item.b}
                              onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'b', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-400 font-mono font-bold text-center focus:outline-none focus:border-slate-600"
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Net"
                            value={item.net}
                            onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'net', e.target.value, 'net')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Optional Details: Rank & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Tahmini Türkiye Sıralaması (Opsiyonel)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ör: 4500"
                value={estimatedRank}
                onChange={(e) => setEstimatedRank(sanitizeNetInput(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-bold transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Genel Notlar / Hızlı Değerlendirme</label>
              <input
                type="text"
                placeholder="Ör: Geometride süre sıkıntısı yaşandı."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Analysis Status */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
              <span>Deneme Analizi Durumu</span>
              <span className="text-[11px] text-slate-400 font-medium">Soru hatalarınızı incelediniz mi?</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsAnalyzed(true)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 border cursor-pointer ${
                  isAnalyzed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Analiz Edildi</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAnalyzed(false)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 border cursor-pointer ${
                  !isAnalyzed
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Analiz Bekliyor</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-6 py-2.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer border border-indigo-400/30"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
