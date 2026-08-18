import React from 'react';
import { BookMarked, Search, ArrowUpRight, Layers, ChevronUp, ChevronDown } from 'lucide-react';
import { PaginationControls } from './PaginationControls';
import { matchesExamScope, isTYTKey, isAYTKey } from './SubjectTypes';

interface SubjectTopicsTabProps {
  activeDetailData: any;
  detailExamFilter: 'TÜMÜ' | 'TYT' | 'AYT';
  topicStatuses: Record<string, string>;
  completedPastTopics: string[];
  topicSearchQuery: string;
  setTopicSearchQuery: (q: string) => void;
  topicStatusFilter: string;
  setTopicStatusFilter: (f: string) => void;
  topicPage: number;
  setTopicPage: (p: number) => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (keyName: string) => void;
  curriculumViewMode: 'status' | 'resource';
  setCurriculumViewMode: (mode: 'status' | 'resource') => void;
  resourceTopicStats: {
    solved3PlusCount: number;
    solved2Count: number;
    solved1Count: number;
    solved0Count: number;
    totalTopicsSolvedInResources: number;
    resourceSolvedPercent: number;
  };
  getStatusBadge: (topicName: string) => { label: string; color: string };
  onNavigateTab?: (tab: string, opts?: any) => void;
}

export const SubjectTopicsTab: React.FC<SubjectTopicsTabProps> = ({
  activeDetailData,
  detailExamFilter,
  topicStatuses,
  completedPastTopics,
  topicSearchQuery,
  setTopicSearchQuery,
  topicStatusFilter,
  setTopicStatusFilter,
  topicPage,
  setTopicPage,
  expandedSections,
  toggleSection,
  curriculumViewMode,
  setCurriculumViewMode,
  resourceTopicStats,
  getStatusBadge,
  onNavigateTab,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <BookMarked className="w-5 h-5 text-indigo-400" />
            <span>Müfredat Konu Listesi ve İlerleme Durumu</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Bu sayfa bilgilendirme amaçlıdır. Konu durumlarını düzenlemek için Rutinler & Konu Takibi sekmesine geçebilirsiniz.
          </p>
        </div>

        {/* Search, Status Filter & Navigation Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 sm:top-2.5" />
            <input
              type="text"
              placeholder="Konu başlığı ara..."
              value={topicSearchQuery}
              onChange={(e) => setTopicSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 sm:py-1.5 w-full sm:w-44 focus:outline-none focus:border-indigo-500 min-h-[44px] sm:min-h-0"
            />
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('resources', { subTab: 'topics', subject: activeDetailData.category.title })}
              className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3.5 py-2.5 sm:px-3 sm:py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 min-h-[44px] sm:min-h-0"
              title="Kaynak Takibi Konularım Sekmesine Git"
            >
              <span>Konu Takibine Git</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          <select
            value={topicStatusFilter}
            onChange={(e) => setTopicStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 sm:py-1.5 focus:outline-none focus:border-indigo-500 min-h-[44px] sm:min-h-0 cursor-pointer"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="Uzmanlaştım">Uzmanlaştım</option>
            <option value="Çalıştım">Çalıştım</option>
            <option value="Zor Geldi">Zor Geldi</option>
            <option value="Erteledim">Erteledim</option>
            <option value="Çalışmadım">Çalışmadım</option>
          </select>
        </div>
      </div>

      {/* Status & Resource Breakdown Bar with Toggle Switch */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300 font-bold">Müfredat İlerleme Dağılımı</span>
            
            {/* Sliding / Toggle Mode Switch Button */}
            <div className="inline-flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl space-x-0.5">
              <button
                type="button"
                onClick={() => setCurriculumViewMode('status')}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                  curriculumViewMode === 'status'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Konu Durumu
              </button>
              <button
                type="button"
                onClick={() => setCurriculumViewMode('resource')}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                  curriculumViewMode === 'resource'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Kaynak Çözümü
              </button>
            </div>
          </div>

          <span className="text-xs font-mono font-semibold text-slate-300">
            {curriculumViewMode === 'status' ? (
              <>{activeDetailData.completedTopicsCount} / {activeDetailData.topics.length} Konu Bitti (<strong className="text-emerald-400 font-bold">%{activeDetailData.topicCompletionPercent}</strong>)</>
            ) : (
              <>{resourceTopicStats.totalTopicsSolvedInResources} / {activeDetailData.topics.length} Konu Kaynakta Çözüldü (<strong className="text-indigo-400 font-bold">%{resourceTopicStats.resourceSolvedPercent}</strong>)</>
            )}
          </span>
        </div>

        {curriculumViewMode === 'status' ? (
          <>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${(activeDetailData.masteredCount / activeDetailData.topics.length) * 100}%` }} className="bg-emerald-500 transition-all duration-500" title={`Uzmanlaştım: ${activeDetailData.masteredCount}`} />
              <div style={{ width: `${(activeDetailData.workedCount / activeDetailData.topics.length) * 100}%` }} className="bg-indigo-500 transition-all duration-500" title={`Çalıştım: ${activeDetailData.workedCount}`} />
              <div style={{ width: `${(activeDetailData.hardCount / activeDetailData.topics.length) * 100}%` }} className="bg-rose-500 transition-all duration-500" title={`Zor Geldi: ${activeDetailData.hardCount}`} />
              <div style={{ width: `${(activeDetailData.postponedCount / activeDetailData.topics.length) * 100}%` }} className="bg-amber-500 transition-all duration-500" title={`Erteledim: ${activeDetailData.postponedCount}`} />
            </div>
            <div className="flex flex-wrap items-center gap-3.5 text-[11px] pt-1 text-slate-300">
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>Uzmanlaştım ({activeDetailData.masteredCount})</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span>Çalıştım ({activeDetailData.workedCount})</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span>Zor Geldi ({activeDetailData.hardCount})</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>Erteledim ({activeDetailData.postponedCount})</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700" /><span>Çalışmadım ({activeDetailData.notStartedCount})</span></span>
            </div>
          </>
        ) : (
          <>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${(resourceTopicStats.solved3PlusCount / activeDetailData.topics.length) * 100}%` }} className="bg-emerald-500 transition-all duration-500" title={`3+ Kaynakta Çözüldü: ${resourceTopicStats.solved3PlusCount}`} />
              <div style={{ width: `${(resourceTopicStats.solved2Count / activeDetailData.topics.length) * 100}%` }} className="bg-indigo-500 transition-all duration-500" title={`2 Kaynakta Çözüldü: ${resourceTopicStats.solved2Count}`} />
              <div style={{ width: `${(resourceTopicStats.solved1Count / activeDetailData.topics.length) * 100}%` }} className="bg-cyan-500 transition-all duration-500" title={`1 Kaynakta Çözüldü: ${resourceTopicStats.solved1Count}`} />
            </div>
            <div className="flex flex-wrap items-center gap-3.5 text-[11px] pt-1 text-slate-300">
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>3+ Kaynakta Çözüldü ({resourceTopicStats.solved3PlusCount})</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span>2 Kaynakta Çözüldü ({resourceTopicStats.solved2Count})</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /><span>1 Kaynakta Çözüldü ({resourceTopicStats.solved1Count})</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700" /><span>Henüz Çözülmedi ({resourceTopicStats.solved0Count})</span></span>
            </div>
          </>
        )}
      </div>

      {/* Grouped Collapsible Accordions for Topics */}
      <div className="space-y-4">
        {(() => {
          const groupsPerPage = 5;
          const totalTopicPages = Math.ceil(activeDetailData.topicGroups.length / groupsPerPage);
          const currentTopicGroups = activeDetailData.topicGroups.slice((topicPage - 1) * groupsPerPage, topicPage * groupsPerPage);

          return (
            <>
              {currentTopicGroups.map((group: any) => {
                const isExpanded = expandedSections[group.keyName] ?? true;
                
                const filteredGroupTopics = group.topics.filter((tName: string) => {
                  const matchesSearch = topicSearchQuery === '' || tName.toLowerCase().includes(topicSearchQuery.toLowerCase());
                  if (!matchesSearch) return false;
                  if (topicStatusFilter === 'ALL') return true;
                  const badge = getStatusBadge(tName);
                  return badge.label === topicStatusFilter;
                });

                if (filteredGroupTopics.length === 0 && topicSearchQuery !== '') {
                  return null;
                }

                const groupCompletedCount = group.topics.filter((t: string) => {
                  const st = topicStatuses[t];
                  return st === 'Uzmanlaştım' || st === 'Çalıştım' || completedPastTopics.includes(t);
                }).length;

                const groupExamFilter: 'TYT' | 'AYT' | 'TÜMÜ' = isTYTKey(group.keyName)
                  ? 'TYT'
                  : isAYTKey(group.keyName)
                  ? 'AYT'
                  : (detailExamFilter !== 'TÜMÜ' ? detailExamFilter : 'TÜMÜ');

                const groupRelevantResources = activeDetailData.matchedResources.filter((r: any) => matchesExamScope(r, groupExamFilter));

                return (
                  <div key={group.keyName} className="border border-slate-800 rounded-2xl bg-slate-950/70 overflow-hidden">
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleSection(group.keyName)}
                      className="w-full flex items-center justify-between p-4 bg-slate-900/80 hover:bg-slate-850 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-sm font-bold text-white">{group.keyName}</h4>
                        <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2.5 py-0.5 rounded-full">
                          {groupCompletedCount} / {group.topics.length} Tamamlandı
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-400">
                        <span className="text-xs font-semibold">{isExpanded ? 'Gizle' : 'Göster'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="p-3 border-t border-slate-850 space-y-2">
                        <div className="flex flex-col space-y-2">
                          {filteredGroupTopics.map((topicName: string, idx: number) => {
                            const badge = getStatusBadge(topicName);
                            const resourceCount = groupRelevantResources.length;
                            const solvedInResources = groupRelevantResources.filter((r: any) => (r.completedTopics || []).includes(topicName)).length;
                            const resourceProgressPercent = resourceCount > 0 ? Math.round((solvedInResources / resourceCount) * 100) : 0;

                            return (
                              <div 
                                key={idx} 
                                className="bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800/80 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 transition-all"
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <span className="text-xs font-mono text-slate-500 w-5 text-right font-bold shrink-0">{idx + 1}.</span>
                                  <span className="text-xs sm:text-sm font-semibold text-white truncate">{topicName}</span>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                                  {/* Status Badge */}
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                                    {badge.label}
                                  </span>

                                  {/* Resource Solved Progress */}
                                  <div className="flex items-center space-x-2">
                                    <div className="flex flex-col items-start sm:items-end">
                                      <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                                        <strong className="text-indigo-300 font-bold">{solvedInResources}</strong> / {resourceCount} Kaynakta Çözüldü
                                      </span>
                                      <div className="w-20 sm:w-24 h-1.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden mt-0.5">
                                        <div 
                                          className={`h-full transition-all rounded-full ${solvedInResources === resourceCount && resourceCount > 0 ? 'bg-emerald-400' : 'bg-indigo-500'}`} 
                                          style={{ width: `${resourceProgressPercent}%` }} 
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <PaginationControls
                currentPage={topicPage}
                totalPages={totalTopicPages}
                onPageChange={setTopicPage}
              />
            </>
          );
        })()}
      </div>
    </div>
  );
};
