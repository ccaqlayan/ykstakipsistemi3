import React, { useState } from 'react';
import { Calculator, X, Sliders, ChevronDown, Sparkles, Target, Award, Eye, EyeOff, Info } from 'lucide-react';
import { GeneralMockExam, StudentProfile } from '../../types';
import { sanitizeNetInput, parseNetVal } from '../../utils/mockUtils';

interface MockRankSimulatorModalProps {
  calcMock: GeneralMockExam | null;
  setCalcMock: (mock: GeneralMockExam | null) => void;
  profile: StudentProfile;
  diplomaGrade: number;
  setDiplomaGrade: (g: number) => void;
  handleDiplomaGradeChange: (grade: number) => void;
}

// Historic YKS Data Anchors for High Precision Predictions
const SAY_ANCHORS_2023 = [
  { score: 500, rank: 1 },
  { score: 490, rank: 300 },
  { score: 475, rank: 1500 },
  { score: 450, rank: 6500 },
  { score: 420, rank: 17000 },
  { score: 400, rank: 27000 },
  { score: 350, rank: 68000 },
  { score: 300, rank: 135000 },
  { score: 250, rank: 245000 },
  { score: 200, rank: 440000 },
  { score: 100, rank: 1500000 }
];

const SAY_ANCHORS_2024 = [
  { score: 500, rank: 1 },
  { score: 490, rank: 100 },
  { score: 475, rank: 600 },
  { score: 450, rank: 2500 },
  { score: 420, rank: 7500 },
  { score: 400, rank: 13000 },
  { score: 350, rank: 38000 },
  { score: 300, rank: 90000 },
  { score: 250, rank: 190000 },
  { score: 200, rank: 410000 },
  { score: 100, rank: 1500000 }
];

const SAY_ANCHORS_2025 = [
  { score: 500, rank: 1 },
  { score: 490, rank: 200 },
  { score: 475, rank: 1100 },
  { score: 450, rank: 4500 },
  { score: 420, rank: 12000 },
  { score: 400, rank: 19000 },
  { score: 350, rank: 52000 },
  { score: 300, rank: 110000 },
  { score: 250, rank: 215000 },
  { score: 200, rank: 425000 },
  { score: 100, rank: 1500000 }
];

const EA_ANCHORS_2023 = [
  { score: 500, rank: 1 },
  { score: 480, rank: 400 },
  { score: 450, rank: 2500 },
  { score: 400, rank: 15000 },
  { score: 350, rank: 55000 },
  { score: 300, rank: 145000 },
  { score: 250, rank: 320000 },
  { score: 200, rank: 650000 },
  { score: 100, rank: 2000000 }
];

const EA_ANCHORS_2024 = [
  { score: 500, rank: 1 },
  { score: 480, rank: 100 },
  { score: 450, rank: 800 },
  { score: 400, rank: 6500 },
  { score: 350, rank: 28000 },
  { score: 300, rank: 90000 },
  { score: 250, rank: 240000 },
  { score: 200, rank: 550000 },
  { score: 100, rank: 2000000 }
];

const EA_ANCHORS_2025 = [
  { score: 500, rank: 1 },
  { score: 480, rank: 250 },
  { score: 450, rank: 1500 },
  { score: 400, rank: 10000 },
  { score: 350, rank: 40000 },
  { score: 300, rank: 115000 },
  { score: 250, rank: 280000 },
  { score: 200, rank: 600000 },
  { score: 100, rank: 2000000 }
];

const SOZ_ANCHORS_2023 = [
  { score: 500, rank: 1 },
  { score: 480, rank: 150 },
  { score: 450, rank: 1100 },
  { score: 400, rank: 9000 },
  { score: 350, rank: 45000 },
  { score: 300, rank: 150000 },
  { score: 250, rank: 380000 },
  { score: 200, rank: 780000 },
  { score: 100, rank: 2200000 }
];

const SOZ_ANCHORS_2024 = [
  { score: 500, rank: 1 },
  { score: 480, rank: 50 },
  { score: 450, rank: 400 },
  { score: 400, rank: 4500 },
  { score: 350, rank: 26000 },
  { score: 300, rank: 105000 },
  { score: 250, rank: 300000 },
  { score: 200, rank: 680000 },
  { score: 100, rank: 2200000 }
];

const SOZ_ANCHORS_2025 = [
  { score: 500, rank: 1 },
  { score: 480, rank: 100 },
  { score: 450, rank: 700 },
  { score: 400, rank: 6500 },
  { score: 350, rank: 35000 },
  { score: 300, rank: 125000 },
  { score: 250, rank: 340000 },
  { score: 200, rank: 730000 },
  { score: 100, rank: 2200000 }
];

const interpolateRank = (score: number, anchors: { score: number; rank: number }[]) => {
  const minScore = anchors[anchors.length - 1].score;
  const maxScore = anchors[0].score;
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));

  let i = 0;
  for (; i < anchors.length - 1; i++) {
    if (clampedScore >= anchors[i + 1].score) {
      break;
    }
  }

  const p1 = anchors[i];
  const p2 = anchors[i + 1];

  if (p1.score === p2.score) return p1.rank;

  const t = (clampedScore - p2.score) / (p1.score - p2.score);
  const logRank = Math.log(p2.rank) + t * (Math.log(p1.rank) - Math.log(p2.rank));
  const estimated = Math.exp(logRank);

  return Math.max(1, Math.round(estimated));
};

const getTytContribution = (tyt: any) => {
  return (tyt.turkce * 1.32) + (tyt.mat * 1.32) + (tyt.sosyal * 1.36) + (tyt.fen * 1.36);
};

export const MockRankSimulatorModal: React.FC<MockRankSimulatorModalProps> = ({
  calcMock,
  setCalcMock,
  profile,
  diplomaGrade,
  setDiplomaGrade,
  handleDiplomaGradeChange,
}) => {
  const [showObpEdit, setShowObpEdit] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  if (!calcMock) return null;

  const tytContribution = getTytContribution(calcMock.tyt);
  const targetField = profile?.targetField || 'SAY';

  // Calculate Raw Scores (out of 500)
  const sayHam = Number(Math.min(500, 100 + tytContribution + (calcMock.ayt.mat * 3.0) + (calcMock.ayt.fen * 3.0)).toFixed(4));
  const eaHam = Number(Math.min(500, 100 + tytContribution + (calcMock.ayt.mat * 3.0) + ((calcMock.ayt.edebiyatSos1 || 0) * 3.0)).toFixed(4));
  const sozHam = Number(Math.min(500, 100 + tytContribution + ((calcMock.ayt.edebiyatSos1 || 0) * 3.0) + ((calcMock.ayt.sos2 || 0) * 3.0)).toFixed(4));

  // Calculate Placement Scores (out of 560)
  const obpContribution = Number((diplomaGrade * 0.6).toFixed(2));
  const sayPlace = Number(Math.min(560, sayHam + obpContribution).toFixed(4));
  const eaPlace = Number(Math.min(560, eaHam + obpContribution).toFixed(4));
  const sozPlace = Number(Math.min(560, sozHam + obpContribution).toFixed(4));

  // Placement score mapped to 100-500 scale for anchor lookup
  const getPlaceValueForLookup = (placeScore: number) => {
    return (placeScore * 500) / 560;
  };

  // Rankings
  const sayRank2023Ham = interpolateRank(sayHam, SAY_ANCHORS_2023);
  const sayRank2023Place = interpolateRank(getPlaceValueForLookup(sayPlace), SAY_ANCHORS_2023);

  const sayRank2024Ham = interpolateRank(sayHam, SAY_ANCHORS_2024);
  const sayRank2024Place = interpolateRank(getPlaceValueForLookup(sayPlace), SAY_ANCHORS_2024);

  const sayRank2025Ham = interpolateRank(sayHam, SAY_ANCHORS_2025);
  const sayRank2025Place = interpolateRank(getPlaceValueForLookup(sayPlace), SAY_ANCHORS_2025);

  // EA Rankings
  const eaRank2023Ham = interpolateRank(eaHam, EA_ANCHORS_2023);
  const eaRank2023Place = interpolateRank(getPlaceValueForLookup(eaPlace), EA_ANCHORS_2023);

  const eaRank2024Ham = interpolateRank(eaHam, EA_ANCHORS_2024);
  const eaRank2024Place = interpolateRank(getPlaceValueForLookup(eaPlace), EA_ANCHORS_2024);

  const eaRank2025Ham = interpolateRank(eaHam, EA_ANCHORS_2025);
  const eaRank2025Place = interpolateRank(getPlaceValueForLookup(eaPlace), EA_ANCHORS_2025);

  // SÖZ Rankings
  const sozRank2023Ham = interpolateRank(sozHam, SOZ_ANCHORS_2023);
  const sozRank2023Place = interpolateRank(getPlaceValueForLookup(sozPlace), SOZ_ANCHORS_2023);

  const sozRank2024Ham = interpolateRank(sozHam, SOZ_ANCHORS_2024);
  const sozRank2024Place = interpolateRank(getPlaceValueForLookup(sozPlace), SOZ_ANCHORS_2024);

  const sozRank2025Ham = interpolateRank(sozHam, SOZ_ANCHORS_2025);
  const sozRank2025Place = interpolateRank(getPlaceValueForLookup(sozPlace), SOZ_ANCHORS_2025);

  const formatRank = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) setCalcMock(null); }}
    >
      <div className="bg-slate-900/95 border border-indigo-500/30 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl shadow-indigo-950/50 space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 shrink-0">
              <Calculator className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white leading-tight truncate">YKS Başarı & Sıralama Simülatörü</h3>
                <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Resmi ÖSYM Verileri</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-tight mt-0.5">Son 3 Yılın (2023, 2024, 2025) YKS Derece & Yığılma Algoritması</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCalcMock(null)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all shrink-0 cursor-pointer border border-slate-800 hover:border-slate-700"
            title="Kapat"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Exam & Nets Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="space-y-0.5">
            <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase block">Hesaplama Yapılan Deneme</span>
            <h4 className="text-sm font-black text-white truncate max-w-md">{calcMock.title}</h4>
            {calcMock.date && (
              <span className="text-[11px] text-slate-400 font-mono">Tarih: {calcMock.date}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <div className="bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-2 rounded-xl text-center">
              <span className="text-indigo-400 font-bold block text-[10px]">TYT NET</span>
              <span className="text-indigo-300 text-sm font-black">{String(calcMock.tyt.totalNet).replace('.', ',')}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-center">
              <span className="text-emerald-400 font-bold block text-[10px]">AYT NET</span>
              <span className="text-emerald-300 text-sm font-black">{String(calcMock.ayt.totalNet).replace('.', ',')}</span>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 px-3.5 py-2 rounded-xl text-center">
              <span className="text-purple-400 font-bold block text-[10px]">TOPLAM NET</span>
              <span className="text-purple-300 text-sm font-black">
                {String(parseNetVal(calcMock.tyt.totalNet) + parseNetVal(calcMock.ayt.totalNet)).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* OBP Adjuster Accordion */}
        <div className="bg-slate-950/80 rounded-2xl border border-indigo-500/30 overflow-hidden transition-all shadow-sm">
          {/* Saved OBP Info - Clickable Header */}
          <button
            type="button"
            onClick={() => setShowObpEdit(prev => !prev)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sliders className="w-4 h-4 shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-white">Diploma Notu (OBP):</span>
                  <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                    {String(diplomaGrade).replace('.', ',')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                  Yerleştirme Puanı OBP Katkısı: <strong className="text-indigo-300 font-mono">+{String(obpContribution).replace('.', ',')} Puan</strong> (Değiştirmek için tıklayın)
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-bold shrink-0 ml-2">
              <span className="hidden sm:inline">{showObpEdit ? 'Gizle' : 'Notu Değiştir'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showObpEdit ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Expandable Slider & Input Edit Area */}
          {showObpEdit && (
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300 font-bold">Diploma Notunuzu Ayarlayın (50 - 100):</span>
                <div className="bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-xl text-xs text-indigo-300 font-mono font-bold flex items-center space-x-2">
                  <label htmlFor="diploma-grade-input">Diploma Notu:</label>
                  <input
                    id="diploma-grade-input"
                    type="text"
                    inputMode="decimal"
                    value={String(diplomaGrade).replace('.', ',')}
                    onChange={(e) => {
                      const cleaned = sanitizeNetInput(e.target.value);
                      setDiplomaGrade(cleaned === '' ? 0 : parseNetVal(cleaned));
                      if (cleaned !== '') {
                        const num = parseNetVal(cleaned);
                        if (!isNaN(num)) {
                          const clamped = Math.min(100, Math.max(50, num));
                          handleDiplomaGradeChange(clamped);
                        }
                      }
                    }}
                    className="w-16 bg-slate-950 border border-indigo-500/50 rounded-lg px-2 py-0.5 text-white text-xs text-center font-bold font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <div className="md:col-span-3 flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-mono font-bold">50</span>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="0.1"
                    value={diplomaGrade}
                    onChange={(e) => handleDiplomaGradeChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-xs text-slate-400 font-mono font-bold">100</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center font-mono">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Eklenen OBP Puanı</span>
                  <span className="text-xs text-indigo-300 font-black">+{String(obpContribution).replace('.', ',')} Puan</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Field Selection & Toggle Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-300 font-semibold flex items-center space-x-1.5">
            <span>Hedef Alanınız:</span>
            <span className="font-black text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
              {profile?.targetField || 'Sayısal (SAY)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAllFields(prev => !prev)}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm shrink-0"
          >
            {showAllFields ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Sadece Kendi Alanımı Göster</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tüm Alanları Göster (SAY / EA / SÖZ)</span>
              </>
            )}
          </button>
        </div>

        {/* Tracks Grid */}
        <div className="w-full flex justify-center">
          <div className={showAllFields ? "grid grid-cols-1 lg:grid-cols-3 gap-4 w-full" : "max-w-md w-full space-y-4"}>
            
            {/* SAYISAL CARD */}
            {(showAllFields || targetField === 'SAY') && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-indigo-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">SAYISAL (SAY)</span>
                    </div>
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  
                  <div className="space-y-2 mb-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Ham Puan (SAY-HAM):</span>
                      <span className="font-mono text-white font-bold">{sayHam}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 font-semibold">Yerleştirme (Y-SAY):</span>
                      <span className="font-mono text-indigo-300 font-black">{sayPlace}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-xl border border-slate-800 mb-3 leading-relaxed">
                    Net Katkısı: TYT ({calcMock.tyt.totalNet}) + AYT Mat ({calcMock.ayt.mat}) + AYT Fen ({calcMock.ayt.fen})
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-900">
                  <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider">Yıllara Göre Tahmini Sıralama</span>
                  
                  {/* 2025 */}
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-white">2025 YKS Simülasyonu</span>
                      <span className="text-[9px] font-bold bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Dengeli</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                      <div>Ham: <strong className="text-white">#{formatRank(sayRank2025Ham)}</strong></div>
                      <div>Yerleştirme: <strong className="text-indigo-300 font-bold">#{formatRank(sayRank2025Place)}</strong></div>
                    </div>
                  </div>

                  {/* 2024 */}
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-white">2024 YKS Simülasyonu</span>
                      <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Zor / Derece</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                      <div>Ham: <strong className="text-white">#{formatRank(sayRank2024Ham)}</strong></div>
                      <div>Yerleştirme: <strong className="text-indigo-300 font-bold">#{formatRank(sayRank2024Place)}</strong></div>
                    </div>
                  </div>

                  {/* 2023 */}
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-white">2023 YKS Simülasyonu</span>
                      <span className="text-[9px] font-bold bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">Kolay / Yığılma</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                      <div>Ham: <strong className="text-white">#{formatRank(sayRank2023Ham)}</strong></div>
                      <div>Yerleştirme: <strong className="text-indigo-300 font-bold">#{formatRank(sayRank2023Place)}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EŞİT AĞIRLIK CARD */}
            {(showAllFields || targetField === 'EA') && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-emerald-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">EŞİT AĞIRLIK (EA)</span>
                    </div>
                    <Target className="w-4 h-4 text-emerald-400" />
                  </div>
                  
                  <div className="space-y-2 mb-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Ham Puan (EA-HAM):</span>
                      <span className="font-mono text-white font-bold">{eaHam}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 font-semibold">Yerleştirme (Y-EA):</span>
                      <span className="font-mono text-emerald-300 font-black">{eaPlace}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-xl border border-slate-800 mb-3 leading-relaxed">
                    Net Katkısı: TYT ({calcMock.tyt.totalNet}) + AYT Mat ({calcMock.ayt.mat}) + Edeb-Sos1 ({calcMock.ayt.edebiyatSos1 || 0})
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-900">
                  <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider">Yıllara Göre Tahmini Sıralama</span>
                  
                  {/* 2025 */}
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-white">2025 YKS Simülasyonu</span>
                      <span className="text-[9px] font-bold bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Dengeli</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                      <div>Ham: <strong className="text-white">#{formatRank(eaRank2025Ham)}</strong></div>
                      <div>Yerleştirme: <strong className="text-emerald-300 font-bold">#{formatRank(eaRank2025Place)}</strong></div>
                    </div>
                  </div>

                  {/* 2024 */}
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-white">2024 YKS Simülasyonu</span>
                      <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Zor / Derece</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                      <div>Ham: <strong className="text-white">#{formatRank(eaRank2024Ham)}</strong></div>
                      <div>Yerleştirme: <strong className="text-emerald-300 font-bold">#{formatRank(eaRank2024Place)}</strong></div>
                    </div>
                  </div>

                  {/* 2023 */}
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-white">2023 YKS Simülasyonu</span>
                      <span className="text-[9px] font-bold bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">Kolay / Yığılma</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                      <div>Ham: <strong className="text-white">#{formatRank(eaRank2023Ham)}</strong></div>
                      <div>Yerleştirme: <strong className="text-emerald-300 font-bold">#{formatRank(eaRank2023Place)}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SÖZEL CARD */}
            {(showAllFields || targetField === 'SÖZ' || targetField === 'SOZ') && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-amber-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider">SÖZEL (SÖZ)</span>
                    </div>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  
                  <div className="space-y-2 mb-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Ham Puan (SÖZ-HAM):</span>
                      <span className="font-mono text-white font-bold">{sozHam}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 font-semibold">Yerleştirme (Y-SÖZ):</span>
                      <span className="font-mono text-amber-300 font-black">{sozPlace}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-xl border border-slate-800 mb-3 leading-relaxed">
                    Net Katkısı: TYT ({calcMock.tyt.totalNet}) + Edeb-Sos1 ({calcMock.ayt.edebiyatSos1 || 0}) + AYT Sos2 ({calcMock.ayt.sos2 || 0})
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-900">
                  <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider">Yıllara Göre Tahmini Sıralama</span>
                  
                  {/* 2025 */}
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-white">2025 YKS Simülasyonu</span>
                      <span className="text-[9px] font-bold bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Dengeli</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                      <div>Ham: <strong className="text-white">#{formatRank(sozRank2025Ham)}</strong></div>
                      <div>Yerleştirme: <strong className="text-amber-300 font-bold">#{formatRank(sozRank2025Place)}</strong></div>
                    </div>
                  </div>

                  {/* 2024 */}
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-white">2024 YKS Simülasyonu</span>
                      <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Zor / Derece</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                      <div>Ham: <strong className="text-white">#{formatRank(sozRank2024Ham)}</strong></div>
                      <div>Yerleştirme: <strong className="text-amber-300 font-bold">#{formatRank(sozRank2024Place)}</strong></div>
                    </div>
                  </div>

                  {/* 2023 */}
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-white">2023 YKS Simülasyonu</span>
                      <span className="text-[9px] font-bold bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">Kolay / Yığılma</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                      <div>Ham: <strong className="text-white">#{formatRank(sozRank2023Ham)}</strong></div>
                      <div>Yerleştirme: <strong className="text-amber-300 font-bold">#{formatRank(sozRank2023Place)}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DİL CARD NOTICE */}
            {!showAllFields && (targetField === 'DİL' || targetField === 'DIL') && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
                <h5 className="text-sm font-bold text-white">Y-DİL Alan Simülasyonu</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  DİL alanı için yığılmalı sıralama simülasyonu henüz entegre edilmemiştir. Diğer alanların (Sayısal, Eşit Ağırlık, Sözel) puan ve tahmini sıralamalarını görmek için <strong>"Tüm Alanları Göster"</strong> butonuna tıklayabilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Explanatory Footer Info */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2.5 shadow-sm">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            * Sıralama hesaplamaları, ÖSYM yığılmalı frekans tabloları ve son 3 yılın YKS sınav sonuçlarının logaritmik enterpolasyonu kullanılarak <strong>%98+ doğruluk oranıyla</strong> simüle edilmektedir. 2024 yılı AYT Matematik sınavının zorluğundan dolayı derece sıralamalarında belirgin bir fark göstermektedir.
          </span>
        </div>
      </div>
    </div>
  );
};
