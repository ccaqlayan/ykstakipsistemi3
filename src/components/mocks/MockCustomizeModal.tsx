import React from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X, BarChart2, Pin, RotateCcw } from 'lucide-react';

interface MockCustomizeModalProps {
  showCustomizeModal: boolean;
  setShowCustomizeModal: (show: boolean) => void;
  visibleCharts: {
    netTrend: boolean;
    subjectComparison: boolean;
    detailedSubSubjects: boolean;
    rankTrend: boolean;
  };
  saveVisibleCharts: (cfg: { netTrend: boolean; subjectComparison: boolean; detailedSubSubjects: boolean; rankTrend: boolean }) => void;
  pinnedSubjects: string[];
  togglePinnedSubject: (key: string) => void;
  setPinnedSubjects: (keys: string[]) => void;
  setActiveChartTab: (tab: string) => void;
  detailedSubSubjectsMeta: Array<{ key: string; label: string; examType: 'tyt' | 'ayt' }>;
}

export const MockCustomizeModal: React.FC<MockCustomizeModalProps> = ({
  showCustomizeModal,
  setShowCustomizeModal,
  visibleCharts,
  saveVisibleCharts,
  pinnedSubjects,
  togglePinnedSubject,
  setPinnedSubjects,
  setActiveChartTab,
  detailedSubSubjectsMeta
}) => {
  if (!showCustomizeModal) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-5 text-white shadow-2xl relative my-auto modal-dialog-card">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <span>Grafik & Ders Analizi Sayfasını Özelleştir</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowCustomizeModal(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Sayfanızda görmek istediğiniz grafik bloklarını açıp kapatabilir, öncelikli derslerinizi en üste sabitleyerek kendinize özel bir YKS analiz ekranı oluşturabilirsiniz.
        </p>

        {/* 1. Grafik Blokları Görünürlüğü */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
            <BarChart2 className="w-4 h-4" />
            <span>1. Gösterilecek Grafik Blokları</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <label className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
              <span className="font-semibold text-slate-200">TYT & AYT Net Trendi Grafiği</span>
              <input
                type="checkbox"
                checked={visibleCharts.netTrend}
                onChange={(e) => saveVisibleCharts({ ...visibleCharts, netTrend: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
              <span className="font-semibold text-slate-200">Ders Bazlı Net Karşılaştırma Grafiği</span>
              <input
                type="checkbox"
                checked={visibleCharts.subjectComparison}
                onChange={(e) => saveVisibleCharts({ ...visibleCharts, subjectComparison: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
              <span className="font-semibold text-slate-200">Detaylı Ders Analizi (Mat/Geo, Fiz/Kim/Biyo, Tar/Coğ/Fel)</span>
              <input
                type="checkbox"
                checked={visibleCharts.detailedSubSubjects}
                onChange={(e) => saveVisibleCharts({ ...visibleCharts, detailedSubSubjects: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
              <span className="font-semibold text-slate-200">Tahmini Sıralama Trendi Grafiği</span>
              <input
                type="checkbox"
                checked={visibleCharts.rankTrend}
                onChange={(e) => saveVisibleCharts({ ...visibleCharts, rankTrend: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 2. En Üste Sabitlenecek Dersler */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Pin className="w-4 h-4" />
              <span>2. En Üste Sabitlenecek Ders Takip Kartları</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">({pinnedSubjects.length} seçili)</span>
          </div>

          <div className="max-h-52 overflow-y-auto pr-1 space-y-3">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">TYT Alt Branşlar:</div>
            <div className="flex flex-wrap gap-2">
              {detailedSubSubjectsMeta.filter(m => m.examType === 'tyt').map(meta => {
                const isPinned = pinnedSubjects.includes(meta.key);
                return (
                  <button
                    key={meta.key}
                    type="button"
                    onClick={() => togglePinnedSubject(meta.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                      isPinned
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Pin className={`w-3 h-3 ${isPinned ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider pt-1">AYT Alt Branşlar:</div>
            <div className="flex flex-wrap gap-2">
              {detailedSubSubjectsMeta.filter(m => m.examType === 'ayt').map(meta => {
                const isPinned = pinnedSubjects.includes(meta.key);
                return (
                  <button
                    key={meta.key}
                    type="button"
                    onClick={() => togglePinnedSubject(meta.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                      isPinned
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Pin className={`w-3 h-3 ${isPinned ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              saveVisibleCharts({
                netTrend: true,
                subjectComparison: true,
                detailedSubSubjects: true,
                rankTrend: true,
              });
              setPinnedSubjects(['TYT Geometri', 'TYT Fizik', 'TYT Matematik']);
              try {
                localStorage.removeItem('yks_visible_charts_config_v2');
                localStorage.removeItem('yks_pinned_subjects_config_v2');
                localStorage.removeItem('yks_is_chart_customized');
              } catch {}
              setActiveChartTab('all');
            }}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Varsayılana Sıfırla</span>
          </button>

          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem('yks_is_chart_customized', 'true');
              } catch {}
              setActiveChartTab('custom');
              setShowCustomizeModal(false);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            Tamam (Kaydet)
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
