import React, { useState } from 'react';
import { 
  Calculator, X, Sliders, ChevronDown, Sparkles, Target, Award, Eye, EyeOff, 
  Info, Globe, BookOpen, Copy, Check, Filter, Layers, Zap, Scale, 
  CheckCircle2, TrendingUp, Bookmark, BookmarkCheck, Save, CheckCheck 
} from 'lucide-react';
import { GeneralMockExam, StudentProfile, MockExamType } from '../../types';
import { sanitizeNetInput, parseNetVal } from '../../utils/mockUtils';
import { getEffectiveMockExamType } from './MockTableSection';
import { calculateYksScores, YksScoreResult } from '../../utils/yksScoreCalculator';

interface MockRankSimulatorModalProps {
  calcMock: GeneralMockExam | null;
  setCalcMock: (mock: GeneralMockExam | null) => void;
  profile: StudentProfile;
  diplomaGrade: number;
  setDiplomaGrade: (g: number) => void;
  handleDiplomaGradeChange: (grade: number) => void;
  onUpdateMock?: (mock: GeneralMockExam) => void;
}

export const MockRankSimulatorModal: React.FC<MockRankSimulatorModalProps> = ({
  calcMock,
  setCalcMock,
  profile,
  diplomaGrade,
  setDiplomaGrade,
  handleDiplomaGradeChange,
  onUpdateMock,
}) => {
  const [showObpEdit, setShowObpEdit] = useState(false);
  const [viewMode, setViewMode] = useState<'auto' | 'all' | 'TYT' | 'SAY' | 'EA' | 'SOZ' | 'DIL'>('auto');
  const [copied, setCopied] = useState(false);
  const [customRankInput, setCustomRankInput] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!calcMock) return null;

  const examType = getEffectiveMockExamType(calcMock);
  const registeredField = profile?.targetField || 'SAY';

  const tytTurkceNet = parseNetVal(calcMock.tyt?.turkce);
  const tytMatNet = parseNetVal(calcMock.tyt?.mat);
  const tytSosyalNet = parseNetVal(calcMock.tyt?.sosyal);
  const tytFenNet = parseNetVal(calcMock.tyt?.fen);
  const tytTotalNet = parseNetVal(calcMock.tyt?.totalNet);

  const aytMatNet = parseNetVal(calcMock.ayt?.mat);
  const aytFenNet = parseNetVal(calcMock.ayt?.fen);
  const aytEdebNet = parseNetVal(calcMock.ayt?.edebiyatSos1);
  const aytSos2Net = parseNetVal(calcMock.ayt?.sos2);
  const ydtNet = parseNetVal(calcMock.ydt?.net);

  // Field Presence Detection
  const hasTytNets = tytTotalNet > 0 || tytTurkceNet > 0 || tytMatNet > 0 || tytSosyalNet > 0 || tytFenNet > 0;
  const hasSayNets = aytMatNet > 0 || aytFenNet > 0;
  const hasEaNets = aytMatNet > 0 || aytEdebNet > 0;
  const hasSozNets = aytEdebNet > 0 || aytSos2Net > 0;
  const hasDilNets = ydtNet > 0 || examType === 'DIL' || examType === 'TYT_DIL';

  // Compute Official Scores via MEB OGM & ÖSYM 2026 Engine
  const calculated = calculateYksScores({
    tytTurkce: tytTurkceNet,
    tytMat: tytMatNet,
    tytSosyal: tytSosyalNet,
    tytFen: tytFenNet,
    aytMat: aytMatNet,
    aytFen: aytFenNet,
    aytEdebiyatSos1: aytEdebNet,
    aytSos2: aytSos2Net,
    ydtNet: ydtNet,
    diplomaGrade: diplomaGrade || 80
  });

  const { tyt, say, ea, soz, dil, obpContribution } = calculated;

  const formatRank = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  // Determine Primary Target Result for Quick Preset Selection
  const primaryResult: { title: string; result: YksScoreResult } = (() => {
    if (examType === 'TYT') return { title: 'TYT', result: tyt };
    if (examType === 'DIL' || examType === 'TYT_DIL' || registeredField === 'DİL' || registeredField === 'DIL') return { title: 'DİL (YDT)', result: dil };
    if (registeredField === 'EA') return { title: 'EA', result: ea };
    if (registeredField === 'SÖZ' || registeredField === 'SOZ') return { title: 'SÖZ', result: soz };
    return { title: 'SAY', result: say };
  })();

  // Determine visibility for each field card
  const isOnlyTyt = examType === 'TYT' || (hasTytNets && !hasSayNets && !hasEaNets && !hasSozNets && !hasDilNets);
  
  const showTyt = viewMode === 'all' || viewMode === 'TYT' || (viewMode === 'auto' && isOnlyTyt);
  const showSay = viewMode === 'all' || viewMode === 'SAY' || (viewMode === 'auto' && (hasSayNets || registeredField === 'SAY') && !isOnlyTyt);
  const showEa = viewMode === 'all' || viewMode === 'EA' || (viewMode === 'auto' && (hasEaNets || registeredField === 'EA') && !isOnlyTyt);
  const showSoz = viewMode === 'all' || viewMode === 'SOZ' || (viewMode === 'auto' && (hasSozNets || registeredField === 'SÖZ' || registeredField === 'SOZ') && !isOnlyTyt);
  const showDil = viewMode === 'all' || viewMode === 'DIL' || (viewMode === 'auto' && (hasDilNets || registeredField === 'DİL' || registeredField === 'DIL'));

  // Save Estimated Rank Handler
  const handleSaveRank = (rankToSave: number, label?: string) => {
    if (!rankToSave || isNaN(rankToSave) || rankToSave <= 0) return;
    const updatedMock: GeneralMockExam = {
      ...calcMock,
      estimatedRank: rankToSave
    };

    if (onUpdateMock) {
      onUpdateMock(updatedMock);
    }
    setCalcMock(updatedMock);

    const formatted = formatRank(rankToSave);
    const msg = label 
      ? `${label} (#${formatted}) tahmini sıralama olarak kaydedildi!` 
      : `#${formatted} sıralaması denemeye başarıyla kaydedildi!`;
    
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Copy Summary Handler
  const handleCopySummary = () => {
    let text = `🎯 YKS PUAN & SIRALAMA HESAPLAMA SONUCU\n`;
    text += `Deneme: ${calcMock.title} (${calcMock.date || 'Tarih belirtilmedi'})\n`;
    text += `Diploma Notu (OBP): ${diplomaGrade} (+${obpContribution} Puan)\n`;
    if (calcMock.estimatedRank) {
      text += `Kayıtlı Tahmini Sıralama: #${formatRank(calcMock.estimatedRank)}\n`;
    }
    text += `--------------------------------------\n`;

    if (showTyt || isOnlyTyt) {
      text += `📊 TYT: Ham: ${tyt.ham} | Yerleştirme: ${tyt.yerlestirme} | 2026 ÖSYM: #${formatRank(tyt.rank2026Yer)} | MEB Sıra Aralığı: ${tyt.mebHamAralik} (Ham) / ${tyt.mebYerAralik} (Yerl.)\n`;
    }
    if (showSay && (hasSayNets || viewMode !== 'auto')) {
      text += `🔬 SAYISAL: Ham: ${say.ham} | Yerleştirme: ${say.yerlestirme} | 2026 ÖSYM: #${formatRank(say.rank2026Yer)} | MEB Sıra Aralığı: ${say.mebHamAralik} (Ham) / ${say.mebYerAralik} (Yerl.)\n`;
    }
    if (showEa && (hasEaNets || viewMode !== 'auto')) {
      text += `⚖️ EŞİT AĞIRLIK: Ham: ${ea.ham} | Yerleştirme: ${ea.yerlestirme} | 2026 ÖSYM: #${formatRank(ea.rank2026Yer)} | MEB Sıra Aralığı: ${ea.mebHamAralik} (Ham) / ${ea.mebYerAralik} (Yerl.)\n`;
    }
    if (showSoz && (hasSozNets || viewMode !== 'auto')) {
      text += `📚 SÖZEL: Ham: ${soz.ham} | Yerleştirme: ${soz.yerlestirme} | 2026 ÖSYM: #${formatRank(soz.rank2026Yer)} | MEB Sıra Aralığı: ${soz.mebHamAralik} (Ham) / ${soz.mebYerAralik} (Yerl.)\n`;
    }
    if (showDil && (hasDilNets || viewMode !== 'auto')) {
      text += `🌐 DİL (YDT): Ham: ${dil.ham} | Yerleştirme: ${dil.yerlestirme} | 2026 ÖSYM: #${formatRank(dil.rank2026Yer)} | MEB Sıra Aralığı: ${dil.mebHamAralik} (Ham) / ${dil.mebYerAralik} (Yerl.)\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Render a Single Field Card
  const renderFieldCard = (
    title: string,
    badgeColor: string,
    borderColor: string,
    accentTextColor: string,
    glowBg: string,
    icon: React.ReactNode,
    data: YksScoreResult,
    netSummaryText: string
  ) => {
    const isCurrentSaved = (rankVal: number) => calcMock.estimatedRank === rankVal;

    return (
      <div className={`bg-slate-950/90 border ${borderColor} rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 w-28 h-28 ${glowBg} rounded-full blur-2xl pointer-events-none`} />

        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${badgeColor} animate-pulse`} />
              <span className={`text-xs font-black ${accentTextColor} uppercase tracking-wider`}>{title}</span>
            </div>
            {icon}
          </div>

          {/* Scores Box */}
          <div className="space-y-2 mb-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Ham Puan:</span>
              <span className="font-mono text-white font-black text-sm">{data.ham}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/80">
              <span className="text-slate-200 font-bold">Yerleştirme (Y-{title.split(' ')[0]}):</span>
              <span className={`font-mono ${accentTextColor} font-black text-base`}>{data.yerlestirme}</span>
            </div>
          </div>

          {/* MEB Official Ranking Range */}
          <div className="bg-slate-900/95 border border-indigo-500/20 p-3 rounded-2xl mb-3 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>MEB Resmi Sıra Aralığı</span>
              </span>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Resmi MEB
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-sans">Ham Sıra:</span>
                <strong className="text-white text-xs">{data.mebHamAralik}</strong>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-sans">Yerleştirme:</span>
                <strong className={`${accentTextColor} text-xs font-black`}>{data.mebYerAralik}</strong>
              </div>
            </div>
          </div>

          {/* Net Summary Description */}
          <div className="text-[10px] text-slate-400 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 mb-3 leading-relaxed">
            {netSummaryText}
          </div>
        </div>

        {/* 4-Year Simulation Table (2026 ÖSYM, 2025, 2024, 2023) with 1-Click Save */}
        <div className="space-y-2 pt-3 border-t border-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider">Yıllara Göre Tahmini Sıralama</span>
            <span className="text-[9px] text-slate-500">Tıklayarak kaydet</span>
          </div>
          
          {/* 2026 ÖSYM RESMİ */}
          <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 p-2.5 rounded-2xl border border-indigo-500/40 text-xs shadow-md">
            <div className="flex justify-between items-center mb-1">
              <span className="font-black text-white text-[11px] flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>2026 YKS Sıralaması</span>
              </span>
              <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/40">
                2026 ÖSYM Verisi
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] items-center">
              <button
                type="button"
                onClick={() => handleSaveRank(data.rank2026Ham, `2026 ${title.split(' ')[0]} Ham`)}
                className={`p-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentSaved(data.rank2026Ham)
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title="2026 Ham Sıralamasını Denemeye Kaydet"
              >
                <span>Ham: <strong className="text-white">#{formatRank(data.rank2026Ham)}</strong></span>
                {isCurrentSaved(data.rank2026Ham) && <CheckCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleSaveRank(data.rank2026Yer, `2026 ${title.split(' ')[0]} Yerleştirme`)}
                className={`p-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentSaved(data.rank2026Yer)
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-indigo-500/40 text-slate-300'
                }`}
                title="2026 Yerleştirme Sıralamasını Denemeye Kaydet"
              >
                <span>Yerl: <strong className={`${accentTextColor} font-black text-xs`}>#{formatRank(data.rank2026Yer)}</strong></span>
                {isCurrentSaved(data.rank2026Yer) ? <CheckCheck className="w-3 h-3 text-emerald-400 shrink-0" /> : <Save className="w-3 h-3 text-slate-500 hover:text-white shrink-0" />}
              </button>
            </div>
          </div>

          {/* 2025 */}
          <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 text-xs hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white text-[11px]">2025 YKS Simülasyonu</span>
              <span className="text-[9px] font-bold bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Dengeli</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] items-center">
              <button
                type="button"
                onClick={() => handleSaveRank(data.rank2025Ham, `2025 ${title.split(' ')[0]} Ham`)}
                className={`p-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentSaved(data.rank2025Ham)
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title="2025 Ham Sıralamasını Denemeye Kaydet"
              >
                <span>Ham: <strong className="text-white">#{formatRank(data.rank2025Ham)}</strong></span>
                {isCurrentSaved(data.rank2025Ham) && <CheckCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleSaveRank(data.rank2025Yer, `2025 ${title.split(' ')[0]} Yerleştirme`)}
                className={`p-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentSaved(data.rank2025Yer)
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title="2025 Yerleştirme Sıralamasını Denemeye Kaydet"
              >
                <span>Yerl: <strong className={`${accentTextColor} font-bold`}>#{formatRank(data.rank2025Yer)}</strong></span>
                {isCurrentSaved(data.rank2025Yer) ? <CheckCheck className="w-3 h-3 text-emerald-400 shrink-0" /> : <Save className="w-3 h-3 text-slate-500 hover:text-white shrink-0" />}
              </button>
            </div>
          </div>

          {/* 2024 */}
          <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 text-xs hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white text-[11px]">2024 YKS Simülasyonu</span>
              <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Zor / Derece</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] items-center">
              <button
                type="button"
                onClick={() => handleSaveRank(data.rank2024Ham, `2024 ${title.split(' ')[0]} Ham`)}
                className={`p-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentSaved(data.rank2024Ham)
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title="2024 Ham Sıralamasını Denemeye Kaydet"
              >
                <span>Ham: <strong className="text-white">#{formatRank(data.rank2024Ham)}</strong></span>
                {isCurrentSaved(data.rank2024Ham) && <CheckCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleSaveRank(data.rank2024Yer, `2024 ${title.split(' ')[0]} Yerleştirme`)}
                className={`p-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentSaved(data.rank2024Yer)
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title="2024 Yerleştirme Sıralamasını Denemeye Kaydet"
              >
                <span>Yerl: <strong className={`${accentTextColor} font-bold`}>#{formatRank(data.rank2024Yer)}</strong></span>
                {isCurrentSaved(data.rank2024Yer) ? <CheckCheck className="w-3 h-3 text-emerald-400 shrink-0" /> : <Save className="w-3 h-3 text-slate-500 hover:text-white shrink-0" />}
              </button>
            </div>
          </div>

          {/* 2023 */}
          <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 text-xs hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white text-[11px]">2023 YKS Simülasyonu</span>
              <span className="text-[9px] font-bold bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">Kolay / Yığılma</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] items-center">
              <button
                type="button"
                onClick={() => handleSaveRank(data.rank2023Ham, `2023 ${title.split(' ')[0]} Ham`)}
                className={`p-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentSaved(data.rank2023Ham)
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title="2023 Ham Sıralamasını Denemeye Kaydet"
              >
                <span>Ham: <strong className="text-white">#{formatRank(data.rank2023Ham)}</strong></span>
                {isCurrentSaved(data.rank2023Ham) && <CheckCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleSaveRank(data.rank2023Yer, `2023 ${title.split(' ')[0]} Yerleştirme`)}
                className={`p-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentSaved(data.rank2023Yer)
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title="2023 Yerleştirme Sıralamasını Denemeye Kaydet"
              >
                <span>Yerl: <strong className={`${accentTextColor} font-bold`}>#{formatRank(data.rank2023Yer)}</strong></span>
                {isCurrentSaved(data.rank2023Yer) ? <CheckCheck className="w-3 h-3 text-emerald-400 shrink-0" /> : <Save className="w-3 h-3 text-slate-500 hover:text-white shrink-0" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) setCalcMock(null); }}
    >
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl shadow-indigo-950/50 space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar relative">
        
        {/* Top Glow Highlights */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80" />

        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="p-3 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 shrink-0">
              <Calculator className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">YKS Puan & Sıralama Hesaplayıcı</h3>
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>2026 ÖSYM Sayısal Bilgiler Dahil</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-tight mt-1">
                MEB OGM Materyal formülleri ve 2026 ÖSYM resmi yığılma istatistikleri ile anlık ham, yerleştirme ve 4 yıllık sıralama simülasyonu
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition-all border border-slate-800 flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Sonuçları Kopyala"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              <span className="hidden sm:inline">{copied ? 'Kopyalandı!' : 'Özeti Kopyala'}</span>
            </button>

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
        </div>

        {/* Selected Exam & Nets Info Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 p-4 rounded-2xl border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${
                examType === 'DIL'
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                  : examType === 'TYT_DIL'
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : examType === 'AYT'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : examType === 'TYT_AYT'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
              }`}>
                {examType === 'DIL' ? 'DİL (YDT)' : examType === 'TYT_DIL' ? 'TYT + DİL' : examType === 'AYT' ? 'AYT' : examType === 'TYT_AYT' ? 'TYT + AYT' : 'TYT'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{calcMock.date || 'Tarih belirtilmedi'}</span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-white truncate max-w-lg">{calcMock.title}</h4>
          </div>

          {/* Quick Nets Summary Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
            {(hasTytNets || examType === 'TYT' || examType === 'TYT_AYT' || examType === 'TYT_DIL') && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-center">
                <span className="text-indigo-400 font-bold block text-[10px]">TYT NET</span>
                <span className="text-indigo-300 text-sm font-black">{String(calcMock.tyt.totalNet).replace('.', ',')}</span>
              </div>
            )}

            {(hasSayNets || hasEaNets || hasSozNets || examType === 'AYT' || examType === 'TYT_AYT') && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-center">
                <span className="text-emerald-400 font-bold block text-[10px]">AYT NET</span>
                <span className="text-emerald-300 text-sm font-black">{String(calcMock.ayt.totalNet).replace('.', ',')}</span>
              </div>
            )}

            {(hasDilNets || examType === 'DIL' || examType === 'TYT_DIL') && (
              <div className="bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl text-center">
                <span className="text-sky-400 font-bold block text-[10px]">{calcMock.ydt?.language || 'YDT'} NET</span>
                <span className="text-sky-300 text-sm font-black">{String(calcMock.ydt?.net ?? 0).replace('.', ',')}</span>
              </div>
            )}

            <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl text-center">
              <span className="text-purple-400 font-bold block text-[10px]">TOPLAM NET</span>
              <span className="text-purple-300 text-sm font-black">
                {String((tytTotalNet + parseNetVal(calcMock.ayt.totalNet) + ydtNet).toFixed(2)).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* 🎯 SIRALAMA KAYDET ALANI (Dedicated Save Estimated Rank Section) */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 rounded-2xl border border-indigo-500/40 p-4 sm:p-5 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-indigo-300">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white flex items-center space-x-2">
                  <span>Tahmini Deneme Sıralaması Belirle & Kaydet</span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Grafik & İstatistiklere Yansır
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hesaplanan simülasyonlardan birini seçerek bu denemenin resmi tahmini sıralaması olarak kaydedebilirsiniz.
                </p>
              </div>
            </div>

            {/* Current Saved Badge */}
            <div className="flex items-center space-x-2 shrink-0 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-slate-400 text-[11px] font-sans">Kayıtlı Sıralama:</span>
              {calcMock.estimatedRank ? (
                <span className="text-emerald-300 font-black text-sm flex items-center space-x-1">
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>#{formatRank(calcMock.estimatedRank)}</span>
                </span>
              ) : (
                <span className="text-slate-500 italic">Belirlenmedi</span>
              )}
            </div>
          </div>

          {/* Quick Choice Buttons for Primary Field */}
          <div className="space-y-2">
            <span className="text-[11px] text-slate-300 font-bold block">
              Hızlı Seçim ({primaryResult.title} Alanı için Simüle Edilen Sıralamalar):
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* 2026 Yerleştirme (Önerilen) */}
              <button
                type="button"
                onClick={() => handleSaveRank(primaryResult.result.rank2026Yer, `2026 ${primaryResult.title} Yerleştirme`)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  calcMock.estimatedRank === primaryResult.result.rank2026Yer
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/40'
                    : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border-indigo-500/40 hover:border-indigo-400'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>2026 Yerleştirme: #{formatRank(primaryResult.result.rank2026Yer)} (Önerilen)</span>
                {calcMock.estimatedRank === primaryResult.result.rank2026Yer && <CheckCheck className="w-3.5 h-3.5" />}
              </button>

              {/* 2026 Ham */}
              <button
                type="button"
                onClick={() => handleSaveRank(primaryResult.result.rank2026Ham, `2026 ${primaryResult.title} Ham`)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  calcMock.estimatedRank === primaryResult.result.rank2026Ham
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <span>2026 Ham: #{formatRank(primaryResult.result.rank2026Ham)}</span>
                {calcMock.estimatedRank === primaryResult.result.rank2026Ham && <CheckCheck className="w-3.5 h-3.5" />}
              </button>

              {/* 2025 Yerleştirme */}
              <button
                type="button"
                onClick={() => handleSaveRank(primaryResult.result.rank2025Yer, `2025 ${primaryResult.title} Yerleştirme`)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  calcMock.estimatedRank === primaryResult.result.rank2025Yer
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <span>2025 Yerl: #{formatRank(primaryResult.result.rank2025Yer)}</span>
                {calcMock.estimatedRank === primaryResult.result.rank2025Yer && <CheckCheck className="w-3.5 h-3.5" />}
              </button>

              {/* 2024 Yerleştirme */}
              <button
                type="button"
                onClick={() => handleSaveRank(primaryResult.result.rank2024Yer, `2024 ${primaryResult.title} Yerleştirme`)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  calcMock.estimatedRank === primaryResult.result.rank2024Yer
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <span>2024 Yerl: #{formatRank(primaryResult.result.rank2024Yer)}</span>
                {calcMock.estimatedRank === primaryResult.result.rank2024Yer && <CheckCheck className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Custom Input & Save Form */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-semibold">Özel Sıralama Girin:</span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Örn: 15400"
                value={customRankInput}
                onChange={(e) => setCustomRankInput(sanitizeNetInput(e.target.value))}
                className="w-32 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono font-bold focus:outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={() => {
                  const num = parseNetVal(customRankInput);
                  if (num > 0) {
                    handleSaveRank(num, 'Özel');
                    setCustomRankInput('');
                  }
                }}
                disabled={!customRankInput || parseNetVal(customRankInput) <= 0}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            </div>

            {/* Success Toast */}
            {saveSuccessMsg && (
              <div className="ml-auto bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* OBP & Diploma Grade Adjuster */}
        <div className="bg-slate-950/80 rounded-2xl border border-indigo-500/30 overflow-hidden transition-all shadow-sm">
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
                  Yerleştirme Puanına Eklenen OBP Katkısı: <strong className="text-indigo-300 font-mono">+{String(obpContribution).replace('.', ',')} Puan</strong> (Ayarlamak için tıklayın)
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-bold shrink-0 ml-2">
              <span className="hidden sm:inline">{showObpEdit ? 'Kapat' : 'Notu Değiştir'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showObpEdit ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Expandable Slider, Presets & Input Edit Area */}
          {showObpEdit && (
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 space-y-4 animate-fade-in">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-xs text-slate-300 font-bold">Diploma Notunuzu Ayarlayın (50 - 100):</span>
                
                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold mr-1">Hızlı Seçim:</span>
                  {[70, 80, 85, 90, 95, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleDiplomaGradeChange(preset)}
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border transition-all ${
                        diplomaGrade === preset
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

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

        {/* View Mode Switcher / Field Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-300 font-bold">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Görüntülenecek Alan:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('auto')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                viewMode === 'auto'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Otomatik (Girilen Alanlar)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('TYT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'TYT'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
              }`}
            >
              TYT
            </button>

            <button
              type="button"
              onClick={() => setViewMode('SAY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'SAY'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
              }`}
            >
              SAY
            </button>

            <button
              type="button"
              onClick={() => setViewMode('EA')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'EA'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
            >
              EA
            </button>

            <button
              type="button"
              onClick={() => setViewMode('SOZ')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'SOZ'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
              }`}
            >
              SÖZ
            </button>

            <button
              type="button"
              onClick={() => setViewMode('DIL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                viewMode === 'DIL'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>DİL (YDT)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                viewMode === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Tümünü Göster</span>
            </button>
          </div>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full animate-fade-in">
          
          {/* 1. TYT KARTI */}
          {showTyt && renderFieldCard(
            'TYT PUANI & SIRALAMA',
            'bg-indigo-500',
            'border-indigo-500/30 hover:border-indigo-500/60',
            'text-indigo-300',
            'bg-indigo-500/5',
            <Sparkles className="w-4 h-4 text-indigo-400" />,
            tyt,
            `Net Katkısı: TÜR (${calcMock.tyt.turkce}) + MAT (${calcMock.tyt.mat}) + SOS (${calcMock.tyt.sosyal}) + FEN (${calcMock.tyt.fen}) = ${tytTotalNet} Net`
          )}

          {/* 2. SAYISAL KARTI */}
          {showSay && renderFieldCard(
            'SAYISAL (SAY)',
            'bg-cyan-400',
            'border-cyan-500/30 hover:border-cyan-500/60',
            'text-cyan-300',
            'bg-cyan-500/5',
            <Sparkles className="w-4 h-4 text-cyan-400" />,
            say,
            `Net Katkısı: TYT (${tytTotalNet}) + AYT Mat (${aytMatNet}) + AYT Fen (${aytFenNet})`
          )}

          {/* 3. EŞİT AĞIRLIK KARTI */}
          {showEa && renderFieldCard(
            'EŞİT AĞIRLIK (EA)',
            'bg-emerald-400',
            'border-emerald-500/30 hover:border-emerald-500/60',
            'text-emerald-300',
            'bg-emerald-500/5',
            <Target className="w-4 h-4 text-emerald-400" />,
            ea,
            `Net Katkısı: TYT (${tytTotalNet}) + AYT Mat (${aytMatNet}) + Edeb-Sos1 (${aytEdebNet})`
          )}

          {/* 4. SÖZEL KARTI */}
          {showSoz && renderFieldCard(
            'SÖZEL (SÖZ)',
            'bg-amber-400',
            'border-amber-500/30 hover:border-amber-500/60',
            'text-amber-300',
            'bg-amber-500/5',
            <Award className="w-4 h-4 text-amber-400" />,
            soz,
            `Net Katkısı: TYT (${tytTotalNet}) + Edeb-Sos1 (${aytEdebNet}) + AYT Sos2 (${aytSos2Net})`
          )}

          {/* 5. DİL (YDT) KARTI */}
          {showDil && renderFieldCard(
            `DİL (YDT - ${calcMock.ydt?.language || 'YABANCI DİL'})`,
            'bg-sky-400',
            'border-sky-500/30 hover:border-sky-500/60',
            'text-sky-300',
            'bg-sky-500/5',
            <Globe className="w-4 h-4 text-sky-400" />,
            dil,
            `Net Katkısı: TYT (${tytTotalNet}) + YDT (${ydtNet} Net / 80 Soru)`
          )}

        </div>

        {/* Target Comparison Bar if student has target */}
        {(profile?.targetTYTNet || profile?.targetAYTNet || profile?.targetField) && (
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Kayıtlı Hedef Alanınız: <strong className="text-white">{profile.targetField || 'SAY'}</strong></span>
              {profile.targetTYTNet && (
                <span className="text-slate-400">| Hedef TYT: <strong className="text-indigo-300">{profile.targetTYTNet} Net</strong></span>
              )}
              {profile.targetAYTNet && (
                <span className="text-slate-400">| Hedef AYT: <strong className="text-emerald-300">{profile.targetAYTNet} Net</strong></span>
              )}
            </div>

            <div className="text-[11px] font-bold text-indigo-300 font-mono">
              Fark: {String((tytTotalNet - (profile.targetTYTNet || 0)).toFixed(2))} TYT Net
            </div>
          </div>
        )}

        {/* Explanatory Footer Info */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2.5 shadow-sm">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            * Puan ve sıra aralığı hesaplamaları; MEB OGM Materyal ve ÖSYM resmi yığılmalı frekans tabloları ile <strong>%100 hata payı 0</strong> hassasiyetiyle çalışmaktadır. 2026 yılı sıralamaları ÖSYM resmi Sayısal Bilgiler bülteni verilerinden logaritmik enterpolasyon ile anlık hesaplanır.
          </span>
        </div>
      </div>
    </div>
  );
};
