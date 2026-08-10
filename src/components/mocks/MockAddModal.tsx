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
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Yeni Genel Deneme Sonucu Gir</span>
          </h3>
          <button 
            type="button" 
            onClick={() => setShowAddModal(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Deneme / Yayınevi Adı</label>
              <input
                type="text"
                required
                placeholder="Ör: ÖZDEBİR Türkiye Geneli #4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tarih</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Entry Mode Switcher */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ders Bazlı Veri Giriş Modu</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddEntryMode('quick')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    addEntryMode === 'quick' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚡ Hızlı (Ana Ders)
                </button>
                <button
                  type="button"
                  onClick={() => setAddEntryMode('detailed')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    addEntryMode === 'detailed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📊 Detaylı (Ayrı Alt Dersler)
                </button>
              </div>
            </div>

            {addEntryMode === 'detailed' && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 text-[11px]">Veri Tipi Tercihi:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAddInputMethod('dyb')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      addInputMethod === 'dyb'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ✍️ Doğru / Yanlış / Boş Sayısı
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddInputMethod('net')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
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
            <>
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                <span className="text-xs font-bold text-indigo-400">TYT Netleri</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Türkçe (40)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={tytTurkce}
                      onChange={(e) => setTytTurkce(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Mat (40)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={tytMat}
                      onChange={(e) => setTytMat(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Sosyal (20)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={tytSosyal}
                      onChange={(e) => setTytSosyal(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Fen (20)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={tytFen}
                      onChange={(e) => setTytFen(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="text-right text-xs text-indigo-300 font-mono font-bold">
                  Hesaplanan TYT Toplam: {(parseNetVal(tytTurkce) + parseNetVal(tytMat) + parseNetVal(tytSosyal) + parseNetVal(tytFen)).toFixed(2).replace('.', ',')} Net
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                <span className="text-xs font-bold text-emerald-400">AYT Netleri</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">AYT Mat (40)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={aytMat}
                      onChange={(e) => setAytMat(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">AYT Fen (40)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={aytFen}
                      onChange={(e) => setAytFen(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Edeb-Sos1 (40)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={aytEdebiyatSos1}
                      onChange={(e) => setAytEdebiyatSos1(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">AYT Sos2 (40)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={aytSos2}
                      onChange={(e) => setAytSos2(sanitizeNetInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="text-right text-xs text-emerald-300 font-mono font-bold">
                  Hesaplanan AYT Toplam: {(parseNetVal(aytMat) + parseNetVal(aytFen) + parseNetVal(aytEdebiyatSos1) + parseNetVal(aytSos2)).toFixed(2).replace('.', ',')} Net
                </div>
              </div>
            </>
          )}

          {/* DETAILED ENTRY MODE */}
          {addEntryMode === 'detailed' && (
            <div className="space-y-4">
              {/* TYT Detailed Section */}
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400">TYT Ayrıntılı Ders Netleri</span>
                  <span className="text-[11px] text-indigo-300 font-mono">
                    Otomatik TYT Toplam: {(
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
                    const item = addTytDyb?.[k] || { d: '', y: '', b: '', net: '' };

                    return (
                      <div key={k} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 text-[11px]">{sub.label} ({sub.max})</span>
                          <span className="text-indigo-400 font-mono font-bold text-[11px]">{item.net !== '' ? `${item.net} N` : '-'}</span>
                        </div>

                        {addInputMethod === 'dyb' ? (
                          <div className="grid grid-cols-3 gap-1">
                            <input
                              type="text"
                              placeholder="D"
                              value={item.d}
                              onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'd', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-emerald-400 font-mono text-center focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Y"
                              value={item.y}
                              onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'y', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-rose-400 font-mono text-center focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="B"
                              value={item.b}
                              onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'b', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-400 font-mono text-center focus:outline-none"
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Net"
                            value={item.net}
                            onChange={(e) => updateSubSubjectDybItem(setAddTytDyb, k, 'net', e.target.value, 'net')}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-indigo-300 font-mono focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AYT Detailed Section */}
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">AYT Ayrıntılı Ders Netleri</span>
                  <span className="text-[11px] text-emerald-300 font-mono">
                    Otomatik AYT Toplam: {(
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
                    const item = addAytDyb?.[k] || { d: '', y: '', b: '', net: '' };

                    return (
                      <div key={k} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 text-[11px]">{sub.label} ({sub.max})</span>
                          <span className="text-emerald-400 font-mono font-bold text-[11px]">{item.net !== '' ? `${item.net} N` : '-'}</span>
                        </div>

                        {addInputMethod === 'dyb' ? (
                          <div className="grid grid-cols-3 gap-1">
                            <input
                              type="text"
                              placeholder="D"
                              value={item.d}
                              onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'd', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-emerald-400 font-mono text-center focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Y"
                              value={item.y}
                              onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'y', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-rose-400 font-mono text-center focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="B"
                              value={item.b}
                              onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'b', e.target.value, 'dyb')}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-400 font-mono text-center focus:outline-none"
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Net"
                            value={item.net}
                            onChange={(e) => updateSubSubjectDybItem(setAddAytDyb, k, 'net', e.target.value, 'net')}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-emerald-300 font-mono focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tahmini Türkiye Sıralaması</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ör: 4500"
              value={estimatedRank}
              onChange={(e) => setEstimatedRank(sanitizeNetInput(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Genel Notlar / Değerlendirme</label>
            <input
              type="text"
              placeholder="Ör: Geometride zaman sıkıntısı yaşandı."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Deneme Analizi Durumu</span>
              <span className="text-[10px] text-slate-400 font-normal">Doğru, yanlış, boş ve soru hataları incelendi mi?</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsAnalyzed(true)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                  isAnalyzed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Analiz Edildi</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAnalyzed(false)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                  !isAnalyzed
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
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              İptal
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
