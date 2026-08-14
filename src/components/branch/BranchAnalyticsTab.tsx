import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Filter, 
  BarChart2, 
  Sparkles, 
  PieChart as PieChartIcon, 
  Activity, 
  BookOpen,
  Award,
  Layers,
  Zap,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ReferenceLine,
  LabelList
} from 'recharts';
import { BranchExam } from '../../types';

interface BranchAnalyticsTabProps {
  branchExams?: BranchExam[];
  totalBranchExamsCount: number;
  analyzedBranchExamsCount: number;
  analyzedBranchExamsPercentage: number;
  avgNetOverall: string | number;
  unrevisedErrorsCount: number;
  revisedErrorsCount: number;
  revisionPercentage: number;
  totalDurationMinutes: number;
  avgDurationMinutes: string | number;
  chartExamType: 'ALL' | 'TYT' | 'AYT';
  setChartExamType: (val: 'ALL' | 'TYT' | 'AYT') => void;
  chartSubject: string;
  setChartSubject: (val: string) => void;
  chartLimit: '10' | '30' | 'ALL';
  setChartLimit: (val: '10' | '30' | 'ALL') => void;
  netChartData: any[];
  branchSubjectStats: any[];
  errorReasonStats: any[];
  topProblematicTopics: any[];
  ERROR_REASON_COLORS: Record<string, string>;
  ERROR_REASON_LABELS: Record<string, string>;
  DEFAULT_CHART_COLORS: string[];
  SUBJECT_COLORS: Record<string, string>;
}

export const BranchAnalyticsTab: React.FC<BranchAnalyticsTabProps> = ({
  branchExams = [],
  totalBranchExamsCount,
  analyzedBranchExamsCount,
  analyzedBranchExamsPercentage,
  avgNetOverall,
  unrevisedErrorsCount,
  revisedErrorsCount,
  revisionPercentage,
  totalDurationMinutes,
  avgDurationMinutes,
  chartExamType,
  setChartExamType,
  chartSubject,
  setChartSubject,
  chartLimit,
  setChartLimit,
  netChartData,
  branchSubjectStats,
  errorReasonStats,
  topProblematicTopics,
  ERROR_REASON_COLORS,
  ERROR_REASON_LABELS,
  DEFAULT_CHART_COLORS,
  SUBJECT_COLORS,
}) => {
  const [activeGraphType, setActiveGraphType] = useState<'net' | 'distribution' | 'time'>('net');
  const [showDataLabels, setShowDataLabels] = useState<boolean>(false);
  const [showAverageLine, setShowAverageLine] = useState<boolean>(true);

  // Compute highest net in the current dataset
  const maxNetRecord = React.useMemo(() => {
    if (!netChartData || netChartData.length === 0) return 0;
    return Math.max(...netChartData.map(d => Number(d.net) || 0));
  }, [netChartData]);

  // Dynamic average net calculated from currently filtered netChartData (respects ExamType, Subject and Limit filters)
  const filteredAvgNet = React.useMemo(() => {
    if (!netChartData || netChartData.length === 0) return 0;
    const sum = netChartData.reduce((acc, curr) => acc + (Number(curr.net) || 0), 0);
    return Math.round((sum / netChartData.length) * 100) / 100;
  }, [netChartData]);

  const filteredAvgNetStr = React.useMemo(() => {
    return filteredAvgNet.toString().replace('.', ',');
  }, [filteredAvgNet]);

  // Compute TYT vs AYT exam counts
  const tytExamCount = React.useMemo(() => {
    return branchSubjectStats
      .filter(s => s.examType === 'TYT')
      .reduce((acc, s) => acc + (s.count || 0), 0);
  }, [branchSubjectStats]);

  const aytExamCount = React.useMemo(() => {
    return branchSubjectStats
      .filter(s => s.examType === 'AYT')
      .reduce((acc, s) => acc + (s.count || 0), 0);
  }, [branchSubjectStats]);

  // Compute subject record counts based on active chartExamType (ALL / TYT / AYT)
  const subjectRecordCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (branchExams && branchExams.length > 0) {
      branchExams.forEach(ex => {
        if (chartExamType === 'ALL' || ex.examType === chartExamType) {
          if (ex.subject) {
            counts[ex.subject] = (counts[ex.subject] || 0) + 1;
          }
        }
      });
    } else if (branchSubjectStats && branchSubjectStats.length > 0) {
      branchSubjectStats.forEach(s => {
        if (chartExamType === 'ALL' || s.examType === chartExamType) {
          if (s.subject) {
            counts[s.subject] = (counts[s.subject] || 0) + (s.count || 0);
          }
        }
      });
    }
    return counts;
  }, [branchExams, branchSubjectStats, chartExamType]);

  // Compute available subjects list
  const availableSubjects = React.useMemo(() => {
    return Object.keys(subjectRecordCounts).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [subjectRecordCounts]);

  const totalFilteredExamsCount = React.useMemo(() => {
    return Object.values(subjectRecordCounts).reduce((acc, c) => acc + c, 0);
  }, [subjectRecordCounts]);

  const formatHoursAndMinutes = (totalMins: number) => {
    if (!totalMins || totalMins <= 0) return '0 dk';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} dk`;
    if (m === 0) return `${h} sa`;
    return `${h} sa ${m} dk`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ── 1. TOP KPI DASHBOARD CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Toplam Branş Denemesi */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Toplam Branş Denemesi</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white font-mono">{totalBranchExamsCount}</span>
              <span className="text-xs text-slate-400 font-medium">Deneme</span>
            </div>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold font-mono">
              %{analyzedBranchExamsPercentage} Analiz Edildi
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>TYT: <strong className="text-indigo-300 font-mono">{tytExamCount}</strong></span>
            <span>AYT: <strong className="text-purple-300 font-mono">{aytExamCount}</strong></span>
          </div>
        </div>

        {/* Card 2: Net Ortalaması & Rekor */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Genel Net Ortalaması</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-black text-emerald-400 font-mono">{avgNetOverall}</span>
              <span className="text-xs text-slate-400 font-medium">Net</span>
            </div>
            <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold font-mono">
              Rekor: {maxNetRecord} Net
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Ders Başına Ort:</span>
            <span className="text-white font-mono font-bold">
              {branchSubjectStats.length > 0 ? (branchSubjectStats.reduce((acc, s) => acc + (Number(s.avgNet) || 0), 0) / branchSubjectStats.length).toFixed(1).replace('.', ',') : 0} Net
            </span>
          </div>
        </div>

        {/* Card 3: Toplam Çözüm Süresi & Hız */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Toplam Çözüm Süresi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {formatHoursAndMinutes(totalDurationMinutes)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Ort. <strong className="text-amber-300">{avgDurationMinutes}</strong> dk/deneme
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Toplam Soru Pratiği:</span>
            <span className="text-amber-400 font-bold font-mono">
              {branchSubjectStats.reduce((acc, s) => acc + (s.count || 0), 0)} Oturum
            </span>
          </div>
        </div>

        {/* Card 4: Hata Defteri & Tekrar Oranı */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Hata Defteri Durumu</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-rose-400 font-mono">{unrevisedErrorsCount}</span>
              <span className="text-xs text-slate-400 font-medium">Bekleyen Hata</span>
            </div>
            <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold font-mono">
              %{revisionPercentage} Tekrar
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tekrar Edilen:</span>
            <span className="text-emerald-400 font-bold font-mono">{revisedErrorsCount} Soru</span>
          </div>
        </div>

      </div>

      {/* ── 2. INTERACTIVE GRAPH ANALYTICS DASHBOARD ── */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl backdrop-blur-md space-y-5">
        
        {/* 1. Header (Title & Description) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">Branş Denemeleri Performans Analitiği</h3>
              <p className="text-xs text-slate-400">Net ivmesini, doğru/yanlış dağılımını ve çözüm sürelerini inceleyin</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-400">
            <span className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{netChartData.length} Deneme İnceleniyor</span>
            </span>
          </div>
        </div>

        {/* 2. Selection Buttons & Filters Toolbar (Below Title & Description) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800/90 shadow-inner">
          
          {/* Left Group: Graph Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveGraphType('net')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeGraphType === 'net' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Net Trendi</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGraphType('distribution')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeGraphType === 'distribution' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>D / Y / B Dağılımı</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGraphType('time')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeGraphType === 'time' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Çözüm Süreleri</span>
              </button>
            </div>
          </div>

          {/* Right Group: Filters (Exam Type, Dedicated Subject Selector, Limit) */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Exam Filter Segment */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setChartExamType('ALL'); setChartSubject('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartExamType === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => { setChartExamType('TYT'); setChartSubject('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartExamType === 'TYT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                TYT
              </button>
              <button
                type="button"
                onClick={() => { setChartExamType('AYT'); setChartSubject('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartExamType === 'AYT' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                AYT
              </button>
            </div>

            {/* Dedicated Subject Selector Area */}
            <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">Ders:</span>
              <select
                id="branch-chart-subject-filter"
                value={chartSubject}
                onChange={(e) => setChartSubject(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[190px] truncate"
              >
                <option value="ALL" className="bg-slate-900 text-white">Tüm Dersler ({totalFilteredExamsCount})</option>
                {availableSubjects.map(s => (
                  <option key={s} value={s} className="bg-slate-900 text-white">
                    {s} ({subjectRecordCounts[s] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Limit Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                id="branch-chart-limit-filter"
                value={chartLimit}
                onChange={(e) => setChartLimit(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="10" className="bg-slate-900 text-white">Son 10 Deneme</option>
                <option value="30" className="bg-slate-900 text-white">Son 30 Deneme</option>
                <option value="ALL" className="bg-slate-900 text-white">Tüm Kayıtlar</option>
              </select>
            </div>

            {/* Average Reference Line (Ortalama Çizgisi) Toggle Button */}
            <button
              type="button"
              onClick={() => setShowAverageLine(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
                showAverageLine
                  ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
              title="Grafikteki ortalama net referans çizgisini aç / kapat"
            >
              <span className={`w-2 h-2 rounded-full ${showAverageLine ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>Ort. Çizgisi {showAverageLine ? 'Açık' : 'Kapalı'}</span>
            </button>

            {/* Data Labels (Sayı Bilgisi) Toggle Button */}
            <button
              type="button"
              onClick={() => setShowDataLabels(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
                showDataLabels
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
              title="Grafik üzerindeki noktaların ve sütunların sayısal değerlerini göster veya gizle"
            >
              {showDataLabels ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              <span>Sayılar {showDataLabels ? 'Açık' : 'Kapalı'}</span>
            </button>

          </div>
        </div>

        {/* Render Chart according to activeGraphType */}
        {netChartData.length > 0 ? (
          <div className="h-80 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              {activeGraphType === 'net' ? (
                /* Mode 1: Net Gelişim Trendi */
                <LineChart data={netChartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="shortName" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ 
                       backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: '#334155', 
                      borderRadius: '1rem', 
                      color: '#fff', 
                      fontSize: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                    }}
                    formatter={(value: any) => [`${value} Net`, 'Net Skoru']}
                    labelFormatter={(label, items) => {
                      if (items && items.length > 0 && items[0].payload) {
                        const p = items[0].payload;
                        const title = p.fullTitle || (p.subject ? `${p.subject} - ${p.publisher || 'Branş Denemesi'}` : label);
                        const date = p.dateStr || p.date || '';
                        return date ? `${title} (${date})` : title;
                      }
                      return label;
                    }}
                  />
                  {showAverageLine && filteredAvgNet > 0 && (
                    <ReferenceLine 
                      y={filteredAvgNet} 
                      stroke="#10b981" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ 
                        value: `Ort. Net: ${filteredAvgNetStr}`, 
                        fill: '#10b981', 
                        fontSize: 10, 
                        position: 'insideTopRight',
                        fontWeight: 'bold'
                      }} 
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0f172a' }}
                    activeDot={{ r: 7, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
                  >
                    {showDataLabels && (
                      <LabelList 
                        dataKey="net" 
                        position="top" 
                        fill="#a5b4fc" 
                        fontSize={10} 
                        fontWeight="bold" 
                        offset={8}
                        formatter={(v: any) => (v != null && v !== '' ? `${v}` : '')}
                      />
                    )}
                  </Line>
                </LineChart>
              ) : activeGraphType === 'distribution' ? (
                /* Mode 2: D / Y / B Dağılımı (Stacked Bar) */
                <BarChart data={netChartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="shortName" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: '#334155', 
                      borderRadius: '1rem', 
                      color: '#fff', 
                      fontSize: '12px' 
                    }}
                    labelFormatter={(label, items) => {
                      if (items && items.length > 0 && items[0].payload) {
                        const p = items[0].payload;
                        return `${p.fullTitle || label} (${p.dateStr || p.date || ''})`;
                      }
                      return label;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                  <Bar dataKey="correct" fill="#10b981" name="Doğru" stackId="a" radius={[0, 0, 0, 0]} maxBarSize={36}>
                    {showDataLabels && (
                      <LabelList 
                        dataKey="correct" 
                        position="insideTop" 
                        fill="#ffffff" 
                        fontSize={9} 
                        fontWeight="bold" 
                        formatter={(v: any) => (v > 0 ? `${v}D` : '')} 
                      />
                    )}
                  </Bar>
                  <Bar dataKey="wrong" fill="#ef4444" name="Yanlış" stackId="a" radius={[0, 0, 0, 0]} maxBarSize={36}>
                    {showDataLabels && (
                      <LabelList 
                        dataKey="wrong" 
                        position="insideTop" 
                        fill="#ffffff" 
                        fontSize={9} 
                        fontWeight="bold" 
                        formatter={(v: any) => (v > 0 ? `${v}Y` : '')} 
                      />
                    )}
                  </Bar>
                  <Bar dataKey="empty" fill="#64748b" name="Boş" stackId="a" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {showDataLabels && (
                      <LabelList 
                        dataKey="empty" 
                        position="insideTop" 
                        fill="#ffffff" 
                        fontSize={9} 
                        fontWeight="bold" 
                        formatter={(v: any) => (v > 0 ? `${v}B` : '')} 
                      />
                    )}
                  </Bar>
                </BarChart>
              ) : (
                /* Mode 3: Çözüm Süreleri (Bar Chart) */
                <BarChart data={netChartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="shortName" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit=" dk" />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: '#334155', 
                      borderRadius: '1rem', 
                      color: '#fff', 
                      fontSize: '12px' 
                    }}
                    formatter={(val: any) => [`${val} dk`, 'Çözüm Süresi']}
                    labelFormatter={(label, items) => {
                      if (items && items.length > 0 && items[0].payload) {
                        const p = items[0].payload;
                        return `${p.fullTitle || label} (${p.dateStr || p.date || ''})`;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey="durationMinutes" fill="#f59e0b" name="Çözüm Süresi (Dakika)" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {showDataLabels && (
                      <LabelList 
                        dataKey="durationMinutes" 
                        position="top" 
                        fill="#fbbf24" 
                        fontSize={10} 
                        fontWeight="bold" 
                        offset={6}
                        formatter={(v: any) => (v > 0 ? `${v} dk` : '')} 
                      />
                    )}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-3xl space-y-3">
            <Filter className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">Henüz Gösterilecek Branş Denemesi Yok</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Seçilen filtrelerde veya sisteme henüz girilmiş branş deneme verisi bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* ── 3. DERS BAZLI DETAYLI PERFORMANS KARTLARI & İLERLEME ── */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ders Bazlı Branş Performans Ortalamaları</h3>
              <p className="text-xs text-slate-400">Her ders için çözülen deneme sayıları, D/Y/B ve net başarı grafiği</p>
            </div>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 font-mono font-bold px-3 py-1 rounded-full border border-slate-700">
            {branchSubjectStats.length} Ders
          </span>
        </div>

        {branchSubjectStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchSubjectStats.map((stat, idx) => {
              const color = SUBJECT_COLORS[stat.subject] || DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length];
              const totalQCount = (stat.avgCorrect || 0) + (stat.avgWrong || 0) + (stat.avgEmpty || 0);
              const accuracyPct = totalQCount > 0 ? Math.round(((stat.avgCorrect || 0) / totalQCount) * 100) : 0;

              return (
                <div 
                  key={stat.subject} 
                  className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 p-4 rounded-2xl space-y-3 transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                        style={{ backgroundColor: color }} 
                      />
                      <h4 className="text-sm font-bold text-white truncate" title={stat.subject}>
                        {stat.subject}
                      </h4>
                    </div>
                    <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-mono shrink-0">
                      {stat.count} Deneme
                    </span>
                  </div>

                  {/* Stat Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 text-center py-2 bg-slate-900/60 rounded-xl border border-slate-800/40">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">Doğru</div>
                      <div className="text-xs font-mono font-bold text-emerald-400">{stat.avgCorrect ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">Yanlış</div>
                      <div className="text-xs font-mono font-semibold text-rose-400">{stat.avgWrong ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">Boş</div>
                      <div className="text-xs font-mono text-slate-400">{stat.avgEmpty ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">Net</div>
                      <div className="text-xs font-mono font-black text-indigo-300">{stat.avgNet ?? '0'}</div>
                    </div>
                  </div>

                  {/* Accuracy Bar & Peak Record */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Doğruluk Oranı</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400 font-bold font-mono">%{accuracyPct}</span>
                        {stat.maxNet > 0 && (
                          <span className="text-[10px] text-amber-400/90 font-mono" title={`En Yüksek Net: ${stat.maxNet}`}>
                            (Max: {stat.maxNet})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, accuracyPct))}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-500">Henüz ders ortalaması verisi bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* ── 4. HATA REASON DAĞILIMI & TOP PROBLEMATİK KONULAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Error Reasons Distribution Donut Chart */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Hata Nedenleri Dağılımı</h3>
                <p className="text-[11px] text-slate-400">Yanlış yapılan soruların analiz nedenleri</p>
              </div>
            </div>
            <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">
              {errorReasonStats.reduce((a, b) => a + (b.count || 0), 0)} Yanlış Kaydı
            </span>
          </div>

          {errorReasonStats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 pt-2">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorReasonStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {errorReasonStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        borderColor: '#334155', 
                        borderRadius: '0.75rem', 
                        color: '#fff', 
                        fontSize: '11px' 
                      }}
                      formatter={(val: any) => [`${val} Soru`, 'Hata Adedi']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {errorReasonStats.map((item) => (
                  <div key={item.reason} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/70 border border-slate-800/60">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-semibold truncate">{item.label || item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0 ml-2">
                      {item.count} <span className="text-[10px] text-slate-400 font-normal">(%{item.percentage})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-1">
              <HelpCircle className="w-7 h-7 text-slate-600 mx-auto mb-1" />
              <p className="text-xs text-slate-400 font-semibold">Hata Defterine Henüz Yanlış Kaydı Girilmedi</p>
              <p className="text-[11px] text-slate-500">Yanlış yaptığınız soruları Hata Defteri sekmesinden ekleyebilirsiniz.</p>
            </div>
          )}
        </div>

        {/* Right: Top Problematic Topics Ranking (Top 5) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">En Çok Yanlış Yapılan Konular (Top 5)</h3>
                <p className="text-[11px] text-slate-400">Öncelikli olarak tekrar etmeniz gereken konular</p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Öncelikli Tekrar
            </span>
          </div>

          {topProblematicTopics && topProblematicTopics.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {topProblematicTopics.map((item, idx) => {
                const topicTitle = item.topicName || item.topic || 'Konu Belirtilmemiş';
                const badgeLabel = idx === 0 ? '🔥 Acil Tekrar' : idx === 1 ? '💡 Kavram Kontrolü' : '⚡ Soru Pratiği';
                const badgeColor = idx === 0 ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : idx === 1 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';

                return (
                  <div key={idx} className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between space-x-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-black text-indigo-400 font-mono shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                            {item.subject}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 truncate mt-0.5" title={topicTitle}>
                          {topicTitle}
                        </h4>
                      </div>
                    </div>

                    <div className="shrink-0 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-xs px-3 py-1 rounded-xl font-mono">
                      {item.count} Yanlış
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-1">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-slate-400 font-semibold">Tebrikler! Belirgin Problem Konusu Yok</p>
              <p className="text-[11px] text-slate-500">Yanlış sorularınızı girdikçe en çok aksayan konular burada sıralanır.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
