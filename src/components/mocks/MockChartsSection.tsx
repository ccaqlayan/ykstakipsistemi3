import React, { useState } from 'react';
import { 
  Filter, 
  BarChart2, 
  Sparkles, 
  SlidersHorizontal, 
  Pin, 
  PinOff, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle2, 
  Award,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  BarChart, 
  Bar, 
  Cell, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { GeneralMockExam, StudentProfile } from '../../types';

interface SubSubjectStat {
  meta: any;
  avgNet: number;
  latestNet: number;
  prevNet: number;
  accuracyPercent: number;
  status: 'critical' | 'warning' | 'good';
  totalCount: number;
}

interface MockChartsSectionProps {
  generalMocks: GeneralMockExam[];
  filteredByCountMocks: GeneralMockExam[];
  mockCountFilter: '7' | '30' | 'all';
  setMockCountFilter: (filter: '7' | '30' | 'all') => void;
  activeChartTab: string;
  setActiveChartTab: (tab: string) => void;
  setShowCustomizeModal: (show: boolean) => void;
  visibleCharts: {
    netTrend: boolean;
    subjectComparison: boolean;
    detailedSubSubjects: boolean;
    rankTrend: boolean;
  };
  pinnedSubjects: string[];
  togglePinnedSubject: (key: string) => void;
  subSubjectStatsMap: Record<string, SubSubjectStat>;
  detailedSubSubjectsMeta: Array<any>;
  mockSubjectConfig: Array<any>;
  chartData: any[];
  subjectChartData: any[];
  rankChartData: any[];
  detailedChartData: any[];
  criticalWeakSubjects: SubSubjectStat[];
  selectedMockSubjects: string[];
  setSelectedMockSubjects: React.Dispatch<React.SetStateAction<string[]>>;
  toggleMockSubject: (key: string) => void;
  showSubjectFilters: boolean;
  setShowSubjectFilters: React.Dispatch<React.SetStateAction<boolean>>;
  subSubjectChartType: 'line' | 'bar';
  setSubSubjectChartType: (type: 'line' | 'bar') => void;
  subSubjectExamTab: 'tyt' | 'ayt';
  setSubSubjectExamTab: (tab: 'tyt' | 'ayt') => void;
  subSubjectGroupFilter: 'all' | 'mat' | 'fen' | 'sos';
  setSubSubjectGroupFilter: (group: 'all' | 'mat' | 'fen' | 'sos') => void;
  activeSubSubjectKeys: string[];
  setActiveSubSubjectKeys: React.Dispatch<React.SetStateAction<string[]>>;
  toggleActiveSubSubject: (key: string) => void;
  profile: StudentProfile;
}

export const MockChartsSection: React.FC<MockChartsSectionProps> = ({
  generalMocks,
  filteredByCountMocks,
  mockCountFilter,
  setMockCountFilter,
  activeChartTab,
  setActiveChartTab,
  setShowCustomizeModal,
  visibleCharts,
  pinnedSubjects,
  togglePinnedSubject,
  subSubjectStatsMap,
  detailedSubSubjectsMeta,
  mockSubjectConfig,
  chartData,
  subjectChartData,
  rankChartData,
  detailedChartData,
  criticalWeakSubjects,
  selectedMockSubjects,
  setSelectedMockSubjects,
  toggleMockSubject,
  showSubjectFilters,
  setShowSubjectFilters,
  subSubjectChartType,
  setSubSubjectChartType,
  subSubjectExamTab,
  setSubSubjectExamTab,
  subSubjectGroupFilter,
  setSubSubjectGroupFilter,
  activeSubSubjectKeys,
  setActiveSubSubjectKeys,
  toggleActiveSubSubject,
  profile
}) => {
  const isDilStudent = profile?.targetField === 'DİL' || profile?.targetField === 'DIL';
  const [showTytLine, setShowTytLine] = useState<boolean>(true);
  const [showAytLine, setShowAytLine] = useState<boolean>(true);
  const [showDilLine, setShowDilLine] = useState<boolean>(isDilStudent);

  if (generalMocks.length === 0) return null;

  return (
    <>
      {/* Sabitlenen Branş Takip Kartları (Artık Filtre Kutusunun Üstünde) */}
      {pinnedSubjects.length > 0 && (
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-4 sm:p-5 space-y-3 shadow-lg shadow-indigo-950/20 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <Pin className="w-4 h-4 text-amber-400 rotate-45 shrink-0" />
              <span>Sabitlenen Branş Takip Kartlarınız ({pinnedSubjects.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Sayfa başından anlık takip ettiğiniz öncelikli branşlar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pinnedSubjects.map(key => {
              const stat = subSubjectStatsMap[key];
              const meta = detailedSubSubjectsMeta.find(m => m.key === key) || mockSubjectConfig.find(m => m.key === key);
              if (!stat && !meta) return null;

              const label = meta?.label || key;
              const avgNet = stat ? stat.avgNet : 0;
              const maxQ = meta && 'maxQuestions' in meta ? meta.maxQuestions : 10;
              const percent = stat ? stat.accuracyPercent : 0;
              const status = stat ? stat.status : 'warning';

              return (
                <div key={key} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 relative group hover:border-indigo-500/50 transition-all shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100 truncate pr-4">{label}</span>
                    <button
                      type="button"
                      onClick={() => togglePinnedSubject(key)}
                      className="text-slate-500 hover:text-amber-400 transition-colors p-1 rounded hover:bg-slate-800/80 cursor-pointer"
                      title="Sabitlemeyi kaldır"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">Ort. Net:</span>
                    <span className="text-sm font-bold text-white">{avgNet} / {maxQ} Net</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'critical' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-0.5">
                    <span className={`font-semibold flex items-center gap-1 ${
                      status === 'critical' ? 'text-rose-400' : status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {status === 'critical' ? '🔴 Kritik (%' + percent + ')' : status === 'warning' ? '🟡 Geliştirilmeli (%' + percent + ')' : '🟢 Güçlü (%' + percent + ')'}
                    </span>
                    <span className="text-slate-500 font-mono">Son: {stat?.latestNet ?? '-'} Net</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart Count Filter & Graph Selection Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-2xl backdrop-blur-md space-y-4">
        {/* 1. Satır: Deneme Filtresi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">Grafik Deneme Filtresi</span>
              <span className="text-[11px] text-slate-400 font-mono">
                ({filteredByCountMocks.length} / {generalMocks.length} deneme gösteriliyor)
              </span>
            </div>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMockCountFilter('7')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mockCountFilter === '7'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Son 7 Deneme
            </button>
            <button
              type="button"
              onClick={() => setMockCountFilter('30')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mockCountFilter === '30'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Son 30 Deneme
            </button>
            <button
              type="button"
              onClick={() => setMockCountFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mockCountFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Tüm Denemeler
            </button>
          </div>
        </div>

        {/* 2. Satır: Grafik Seçimi & Kişiselleştirme */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">Görüntülenen Grafik:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveChartTab('net')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeChartTab === 'net'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Net Gelişim Trendi
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('subject')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeChartTab === 'subject'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Ders Bazlı Netler
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('detailed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeChartTab === 'detailed'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Detaylı Ders Analizi
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('rank')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeChartTab === 'rank'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Sıralama Trendi
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeChartTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Tüm Grafikler
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('custom')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
                activeChartTab === 'custom'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Bana Özel</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCustomizeModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer shadow-sm shrink-0 ml-1"
              title="Sayfa grafiklerini düzenle ve sabitle"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Özelleştir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Net Trend Graph */}
      {chartData.length > 0 && (activeChartTab === 'all' || activeChartTab === 'net' || (activeChartTab === 'custom' && visibleCharts.netTrend)) && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>
                <span className="text-indigo-400 font-bold">TYT</span>, <span className="text-emerald-400 font-bold">AYT</span> & <span className="text-sky-400 font-bold">DİL</span> Net Gelişim Trendi
              </span>
            </h2>

            {/* Interactive Toggle Buttons for TYT, AYT & DİL Net Lines */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setShowTytLine(prev => !prev)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                  showTytLine
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800 opacity-60 hover:opacity-100 hover:text-slate-300'
                }`}
                title={showTytLine ? 'TYT Net çizgisini gizle' : 'TYT Net çizgisini göster'}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${showTytLine ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'} inline-block`} />
                <span>TYT Net</span>
                {showTytLine ? <Eye className="w-3 h-3 text-indigo-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
              </button>

              <button
                type="button"
                onClick={() => setShowAytLine(prev => !prev)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                  showAytLine
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800 opacity-60 hover:opacity-100 hover:text-slate-300'
                }`}
                title={showAytLine ? 'AYT Net çizgisini gizle' : 'AYT Net çizgisini göster'}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${showAytLine ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'} inline-block`} />
                <span>AYT Net</span>
                {showAytLine ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
              </button>

              <button
                type="button"
                onClick={() => setShowDilLine(prev => !prev)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                  showDilLine
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-md shadow-sky-950/40'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800 opacity-60 hover:opacity-100 hover:text-slate-300'
                }`}
                title={showDilLine ? 'DİL (YDT) Net çizgisini gizle' : 'DİL (YDT) Net çizgisini göster'}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${showDilLine ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'} inline-block`} />
                <span>DİL Net</span>
                {showDilLine ? <Eye className="w-3 h-3 text-sky-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
              </button>
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                <XAxis 
                  dataKey="id" 
                  tickFormatter={(id) => {
                    const m = generalMocks.find(x => x.id === id);
                    if (!m) return '';
                    let dStr = '';
                    if (m.date) {
                      const d = new Date(m.date + 'T00:00:00');
                      if (!isNaN(d.getTime())) {
                        const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                        dStr = `${d.getDate()} ${months[d.getMonth()]}`;
                      }
                    }
                    const t = m.title.length > 16 ? m.title.substring(0, 16) + '...' : m.title;
                    return dStr ? `${dStr} (${t})` : t;
                  }} 
                  stroke="var(--chart-axis)" 
                  fontSize={10} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={65}
                  dy={6}
                  dx={-2}
                />
                <YAxis 
                  stroke="var(--chart-axis)" 
                  fontSize={11} 
                  domain={[
                    (dataMin: number) => Math.max(0, Math.floor(dataMin - 5)), 
                    (dataMax: number) => Math.min(120, Math.ceil(dataMax + 5))
                  ]} 
                  width={38} 
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const validPayload = payload.filter((p: any) => p.value !== null && p.value !== undefined);
                      if (validPayload.length === 0) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs sm:max-w-sm">
                          <div className="font-bold text-white text-sm break-words leading-snug">{data.fullTitle}</div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <span>📅</span>
                            <span>Tarih: {data.date}</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800 space-y-1 font-mono font-semibold">
                            {validPayload.map((p: any) => (
                              <div key={p.dataKey} className="flex items-center justify-between gap-4" style={{ color: p.color }}>
                                <span>{p.dataKey === 'TYT_Net' ? 'TYT Net' : p.dataKey === 'AYT_Net' ? 'AYT Net' : p.dataKey === 'DIL_Net' ? 'DİL Net' : p.name}:</span>
                                <span>{String(p.value).replace('.', ',')} Net</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showTytLine && (
                  <Line
                    type="monotone"
                    dataKey="TYT_Net"
                    name="TYT Net"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1' }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                  />
                )}
                {showAytLine && (
                  <Line
                    type="monotone"
                    dataKey="AYT_Net"
                    name="AYT Net"
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#34d399' }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                  />
                )}
                {showDilLine && (
                  <Line
                    type="monotone"
                    dataKey="DIL_Net"
                    name="DİL Net"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0ea5e9' }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Subject Nets Comparison Graph */}
      {subjectChartData.length > 0 && (activeChartTab === 'all' || activeChartTab === 'subject' || (activeChartTab === 'custom' && visibleCharts.subjectComparison)) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-3 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-sky-500/5 hover:border-slate-700/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-sky-400" />
              <span>Ders Bazlı Net Gelişim Karşılaştırması</span>
            </h2>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-[11px] text-slate-400 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {selectedMockSubjects.length} Ders Gösteriliyor
              </span>
              <button
                type="button"
                onClick={() => setShowSubjectFilters(prev => !prev)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  showSubjectFilters
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Ders seçeneği butonlarını göster veya gizle"
              >
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                <span>{showSubjectFilters ? 'Ders Seçimini Gizle' : 'Ders Seçimi (Göster/Gizle)'}</span>
                {showSubjectFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={subjectChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                <XAxis 
                  dataKey="id" 
                  tickFormatter={(id) => {
                    const m = generalMocks.find(x => x.id === id);
                    if (!m) return '';
                    return m.title.length > 22 ? m.title.substring(0, 22) + '...' : m.title;
                  }} 
                  stroke="var(--chart-axis)" 
                  fontSize={10} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={65}
                  dy={6}
                  dx={-2}
                />
                <YAxis stroke="var(--chart-axis)" fontSize={11} domain={[0, 'auto']} width={38} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const visibleItems = payload.filter((p: any) => selectedMockSubjects.includes(p.dataKey));
                      if (visibleItems.length === 0) return null;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs sm:max-w-sm">
                          <div className="font-bold text-white text-sm break-words leading-snug">{data.fullTitle}</div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <span>📅</span>
                            <span>Tarih: {data.date}</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800 space-y-1 font-mono font-semibold">
                            {visibleItems.map((p: any) => (
                              <div key={p.dataKey} className="flex items-center justify-between gap-4" style={{ color: p.color }}>
                                <span>{p.dataKey}:</span>
                                <span>{String(p.value).replace('.', ',')} Net</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {mockSubjectConfig.map((subj) => (
                  <Line
                    key={subj.key}
                    type="monotone"
                    dataKey={subj.key}
                    stroke={subj.color}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: subj.color }}
                    activeDot={{ r: 6 }}
                    hide={!selectedMockSubjects.includes(subj.key)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Toggle Buttons Below Chart */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            {!showSubjectFilters ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-medium shrink-0">Gösterilen Dersler:</span>
                  {selectedMockSubjects.length === 0 ? (
                    <span className="text-amber-400 font-medium italic">Hiçbir ders seçilmedi</span>
                  ) : (
                    selectedMockSubjects.map((key) => {
                      const cfg = mockSubjectConfig.find((s) => s.key === key);
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-200"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cfg?.color || '#38bdf8' }}
                          />
                          <span>{cfg?.label || key}</span>
                        </span>
                      );
                    })
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubjectFilters(true)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-all cursor-pointer shrink-0 self-end sm:self-auto"
                >
                  <Filter className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ders Seçeneklerini Göster</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-3 animate-fade-in">
                {/* Quick Selection Presets */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5 text-sky-400" />
                    <span>Grafikte Gösterilecek Dersleri Seçin:</span>
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMockSubjects(['TYT Fen', 'TYT Sos', 'TYT Mat', 'TYT Tür'])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 transition-colors cursor-pointer"
                    >
                      TYT Toplamları
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMockSubjects(['AYT Mat', 'AYT Fen', 'AYT Edeb', 'AYT Sos'])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/20 transition-colors cursor-pointer"
                    >
                      AYT Toplamları
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMockSubjects(mockSubjectConfig.map((s) => s.key))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMockSubjects([])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                    >
                      Temizle
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSubjectFilters(false)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <span>Gizle</span>
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 1. Satır: TYT Dersleri */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded-lg uppercase shrink-0">
                    TYT:
                  </span>
                  {mockSubjectConfig.filter((s) => s.key.startsWith('TYT')).map((subj) => {
                    const isSelected = selectedMockSubjects.includes(subj.key);
                    return (
                      <button
                        key={subj.key}
                        type="button"
                        onClick={() => toggleMockSubject(subj.key)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'opacity-100 bg-slate-800 text-slate-100 border border-slate-700 shadow-md hover:bg-slate-700'
                            : 'opacity-40 line-through bg-slate-900 text-slate-500 border border-slate-800/80 hover:opacity-60'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
                          style={{ backgroundColor: isSelected ? subj.color : '#64748b' }}
                        />
                        <span>{subj.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Satır: AYT Dersleri */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-1 rounded-lg uppercase shrink-0">
                    AYT:
                  </span>
                  {mockSubjectConfig.filter((s) => s.key.startsWith('AYT')).map((subj) => {
                    const isSelected = selectedMockSubjects.includes(subj.key);
                    return (
                      <button
                        key={subj.key}
                        type="button"
                        onClick={() => toggleMockSubject(subj.key)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'opacity-100 bg-slate-800 text-slate-100 border border-slate-700 shadow-md hover:bg-slate-700'
                            : 'opacity-40 line-through bg-slate-900 text-slate-500 border border-slate-800/80 hover:opacity-60'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
                          style={{ backgroundColor: isSelected ? subj.color : '#64748b' }}
                        />
                        <span>{subj.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 italic text-center mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-1.5">
            <span>💡</span>
            <span>
              <strong className="text-slate-300 not-italic">İpucu:</strong> Butonlara basarak ilgilendiğiniz derslerin net grafiklerini açıp kapatabilirsiniz.
            </span>
          </p>
        </div>
      )}

      {/* Detaylı Ders Analizi Grafiği (Alt Branş Kırılımı & Anlık Zayıf Branş Tespiti) */}
      {(activeChartTab === 'all' || activeChartTab === 'detailed' || (activeChartTab === 'custom' && visibleCharts.detailedSubSubjects)) && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-3 sm:p-5 shadow-lg shadow-purple-950/10 space-y-4 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/50">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Detaylı Ders Analizi (Alt Branş Net Trendleri & Anlık Zayıf Branş Tespiti)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Denemeler bazında alt branş (Mat, Geo, Fiz, Kim, Biyo vb.) net gelişiminizi çizgi grafik üzerinde takip edin.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Line vs Bar Mode Switcher */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubSubjectChartType('line')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                    subSubjectChartType === 'line'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Deneme Deneme Çizgi Grafik"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Çizgi Grafik</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubSubjectChartType('bar')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                    subSubjectChartType === 'bar'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ortalama Bar Grafiği"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Ortalama Bar</span>
                </button>
              </div>

              {/* Exam Type Tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSubSubjectExamTab('tyt');
                    setActiveSubSubjectKeys([]);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    subSubjectExamTab === 'tyt'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TYT Alt Branşlar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubSubjectExamTab('ayt');
                    setActiveSubSubjectKeys([]);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    subSubjectExamTab === 'ayt'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AYT Alt Branşlar
                </button>
              </div>

              {/* Group Filter */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubSubjectGroupFilter('all')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    subSubjectGroupFilter === 'all'
                      ? 'bg-slate-800 text-slate-100 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tümü
                </button>
                <button
                  type="button"
                  onClick={() => setSubSubjectGroupFilter('mat')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    subSubjectGroupFilter === 'mat'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mat/Geo
                </button>
                <button
                  type="button"
                  onClick={() => setSubSubjectGroupFilter('fen')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    subSubjectGroupFilter === 'fen'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fiz/Kim/Biyo
                </button>
                <button
                  type="button"
                  onClick={() => setSubSubjectGroupFilter('sos')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    subSubjectGroupFilter === 'sos'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tar/Coğ/Fel/Din
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Sub-Subject Pills Selector for Line Chart */}
          {subSubjectChartType === 'line' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Çizgi Grafiğe Ekle / Çıkar:</span>
              </span>
              {detailedSubSubjectsMeta
                .filter(meta => meta.examType === subSubjectExamTab)
                .filter(meta => subSubjectGroupFilter === 'all' || meta.group === subSubjectGroupFilter)
                .map(meta => {
                  const isSelected = activeSubSubjectKeys.length === 0 || activeSubSubjectKeys.includes(meta.key);
                  return (
                    <button
                      key={meta.key}
                      type="button"
                      onClick={() => toggleActiveSubSubject(meta.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                          : 'bg-slate-950/60 text-slate-500 border-slate-800/80 opacity-50 hover:opacity-90'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span>{meta.shortLabel}</span>
                    </button>
                  );
                })}
              {activeSubSubjectKeys.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveSubSubjectKeys([])}
                  className="text-[10px] text-purple-400 hover:text-purple-300 ml-2 underline cursor-pointer"
                >
                  Tümünü Göster
                </button>
              )}
            </div>
          )}

          {/* Anlık Zayıf Branş Tespiti Banner */}
          {criticalWeakSubjects.length > 0 ? (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-xs font-bold text-rose-200">
                    Anlık Tespit Edilen Zayıf Branşlarınız ({criticalWeakSubjects.length})
                  </span>
                </div>
                <span className="text-[10px] text-rose-300 font-mono bg-rose-900/50 px-2 py-0.5 rounded border border-rose-700/50">
                  Başarı Oranı %50'nin Altında
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {criticalWeakSubjects.map(sub => (
                  <div
                    key={sub.meta.key}
                    className="bg-slate-950 border border-rose-500/30 rounded-lg p-2 flex items-center space-x-2 text-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <span className="font-bold text-white">{sub.meta.label}:</span>
                    <span className="text-rose-300 font-mono">{sub.avgNet} / {sub.meta.maxQuestions} Net (%{sub.accuracyPercent})</span>
                    <button
                      type="button"
                      onClick={() => togglePinnedSubject(sub.meta.key)}
                      className="ml-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                      title="En üste sabitle"
                    >
                      <Pin className="w-2.5 h-2.5" />
                      <span>{pinnedSubjects.includes(sub.meta.key) ? 'Sabitlendi' : 'Sabitle'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center space-x-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Harika Performans!</strong> Tüm alt branşlarınızda başarı oranınız %50'nin üzerinde. Mevcut çalışma temponuzu koruyun!
              </span>
            </div>
          )}

          {/* Sub-Subject Chart Render (LineChart or BarChart) */}
          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {subSubjectChartType === 'line' ? (
                <LineChart data={subjectChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--chart-axis)" 
                    fontSize={11} 
                    tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <YAxis stroke="var(--chart-axis)" fontSize={11} domain={[0, 'auto']} width={38} />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-2 max-w-xs">
                            <div className="font-bold text-white text-sm border-b border-slate-800 pb-1.5">
                              {data.fullTitle || label}
                              <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{data.date}</span>
                            </div>
                            <div className="space-y-1 font-mono">
                              {payload.map((p: any) => (
                                <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs">
                                  <span className="flex items-center gap-1.5 font-sans text-slate-200">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                    {p.name}:
                                  </span>
                                  <span className="font-bold text-white">{p.value} Net</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  {detailedSubSubjectsMeta
                    .filter(meta => meta.examType === subSubjectExamTab)
                    .filter(meta => subSubjectGroupFilter === 'all' || meta.group === subSubjectGroupFilter)
                    .filter(meta => activeSubSubjectKeys.length === 0 || activeSubSubjectKeys.includes(meta.key))
                    .map(meta => (
                      <Line
                        key={meta.key}
                        type="monotone"
                        dataKey={meta.key}
                        name={meta.shortLabel}
                        stroke={meta.color}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: meta.color, strokeWidth: 1, stroke: '#0f172a' }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        connectNulls
                      />
                    ))}
                </LineChart>
              ) : (
                <BarChart data={detailedChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--chart-axis)" 
                    fontSize={11} 
                    tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <YAxis stroke="var(--chart-axis)" fontSize={11} domain={[0, 'auto']} width={38} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs">
                            <div className="font-bold text-white text-sm">{data.fullLabel}</div>
                            <div className="pt-1.5 border-t border-slate-800 space-y-1 font-mono">
                              <div className="flex justify-between gap-4 text-indigo-300">
                                <span>Ortalama Net:</span>
                                <span className="font-bold">{data.avgNet} / {data.maxQuestions} Net</span>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-400">
                                <span>Son Deneme Net:</span>
                                <span>{data.latestNet} Net</span>
                              </div>
                              <div className="flex justify-between gap-4 text-emerald-400">
                                <span>Başarı Oranı:</span>
                                <span className="font-bold">%{data.accuracyPercent}</span>
                              </div>
                              <div className="pt-1 text-[10px] font-semibold flex items-center justify-between">
                                <span>Anlık Durum:</span>
                                <span className={data.status === 'critical' ? 'text-rose-400' : data.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}>
                                  {data.status === 'critical' ? '🔴 Kritik Zayıf Branş' : data.status === 'warning' ? '🟡 Geliştirilmeli' : '🟢 Güçlü Performans'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgNet" name="Ortalama Net" radius={[6, 6, 0, 0]}>
                    {detailedChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Group Breakdown Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* 1. Matematik Grubu (Mat & Geo) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                  <span>📐</span>
                  <span>Matematik Grubu (Mat / Geo)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">40 Soru</span>
              </div>

              {detailedSubSubjectsMeta.filter(m => m.examType === subSubjectExamTab && m.group === 'mat').map(meta => {
                const stat = subSubjectStatsMap[meta.key];
                const avg = stat ? stat.avgNet : 0;
                const percent = stat ? stat.accuracyPercent : 0;
                const isPinned = pinnedSubjects.includes(meta.key);

                return (
                  <div key={meta.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{meta.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-white font-bold">{avg} / {meta.maxQuestions} Net</span>
                        <button
                          type="button"
                          onClick={() => togglePinnedSubject(meta.key)}
                          className={`p-1 rounded transition-colors ${
                            isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Sayfa başına sabitle"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percent < 45 ? 'bg-rose-500' : percent < 65 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Fen Bilimleri Grubu (Fiz / Kim / Biyo) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-sky-300 flex items-center space-x-1.5">
                  <span>🧪</span>
                  <span>Fen Bilimleri (Fiz / Kim / Biyo)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">20/40 Soru</span>
              </div>

              {detailedSubSubjectsMeta.filter(m => m.examType === subSubjectExamTab && m.group === 'fen').map(meta => {
                const stat = subSubjectStatsMap[meta.key];
                const avg = stat ? stat.avgNet : 0;
                const percent = stat ? stat.accuracyPercent : 0;
                const isPinned = pinnedSubjects.includes(meta.key);

                return (
                  <div key={meta.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{meta.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-white font-bold">{avg} / {meta.maxQuestions} Net</span>
                        <button
                          type="button"
                          onClick={() => togglePinnedSubject(meta.key)}
                          className={`p-1 rounded transition-colors ${
                            isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Sayfa başına sabitle"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percent < 45 ? 'bg-rose-500' : percent < 65 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. Sosyal Bilimler Grubu (Tar / Coğ / Fel / Din) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <span>🏛️</span>
                  <span>Sosyal Bilimler (Tar / Coğ / Fel)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">20/40 Soru</span>
              </div>

              {detailedSubSubjectsMeta.filter(m => m.examType === subSubjectExamTab && m.group === 'sos').map(meta => {
                const stat = subSubjectStatsMap[meta.key];
                const avg = stat ? stat.avgNet : 0;
                const percent = stat ? stat.accuracyPercent : 0;
                const isPinned = pinnedSubjects.includes(meta.key);

                return (
                  <div key={meta.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{meta.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-white font-bold">{avg} / {meta.maxQuestions} Net</span>
                        <button
                          type="button"
                          onClick={() => togglePinnedSubject(meta.key)}
                          className={`p-1 rounded transition-colors ${
                            isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Sayfa başına sabitle"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percent < 45 ? 'bg-rose-500' : percent < 65 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recharts Rank Trend Graph */}
      {rankChartData.length > 0 && (activeChartTab === 'all' || activeChartTab === 'rank' || (activeChartTab === 'custom' && visibleCharts.rankTrend)) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-3 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-amber-500/5 hover:border-slate-700/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Tahmini Sıralama Gelişim Trendi</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="text-slate-300">Tahmini Derece (Üst Sıralar Yukarıda)</span>
              </span>
              {profile?.targetRank && Number(profile.targetRank) > 0 && (
                <span className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                  <span className="w-3.5 h-0.5 bg-emerald-400 inline-block" />
                  <span className="text-emerald-400 font-bold">Hedef: #{Number(profile.targetRank).toLocaleString('tr-TR')}</span>
                </span>
              )}
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rankChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                <XAxis 
                  dataKey="id" 
                  tickFormatter={(id) => {
                    const m = generalMocks.find(x => x.id === id);
                    if (!m) return '';
                    return m.title.length > 22 ? m.title.substring(0, 22) + '...' : m.title;
                  }} 
                  stroke="var(--chart-axis)" 
                  fontSize={10} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={65}
                  dy={6}
                  dx={-2}
                />
                <YAxis 
                  stroke="var(--chart-axis)" 
                  fontSize={11} 
                  reversed={true}
                  width={58}
                  tickFormatter={(val) => `#${Number(val).toLocaleString('tr-TR')}`}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs sm:max-w-sm">
                          <div className="font-bold text-white text-sm break-words leading-snug">{data.fullTitle}</div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <span>📅</span>
                            <span>Tarih: {data.date}</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800 font-mono font-bold text-amber-400 flex items-center justify-between gap-4">
                            <span>Tahmini Sıralama:</span>
                            <span>#{Number(data.Tahmini_Siralama).toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {profile?.targetRank && Number(profile.targetRank) > 0 && (
                  <ReferenceLine 
                    y={Number(profile.targetRank)} 
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{ 
                      value: `Hedef: #${Number(profile.targetRank).toLocaleString('tr-TR')}`, 
                      fill: '#34d399', 
                      fontSize: 11,
                      position: 'top',
                      fontWeight: 'bold'
                    }} 
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="Tahmini_Siralama"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#fbbf24' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {/* Empty state for 'custom' tab when no charts are selected */}
      {activeChartTab === 'custom' && !visibleCharts.netTrend && !visibleCharts.subjectComparison && !visibleCharts.detailedSubSubjects && !visibleCharts.rankTrend && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Bana Özel Görünümünde Henüz Grafik Seçilmedi</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Özelleştir butonuna tıklayarak bu modda görmek istediğiniz grafikleri işaretleyebilir veya üstteki filtre butonlarından dilediğiniz grafiği doğrudan seçebilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => setShowCustomizeModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Grafikleri Özelleştir</span>
          </button>
        </div>
      )}
    </>
  );
};
