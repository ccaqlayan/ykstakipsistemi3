import React from 'react';
import { Youtube, AlertCircle, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { PaginationControls } from './PaginationControls';
import { errorReasonLabels } from './SubjectTypes';

interface SubjectVideoErrorsTabProps {
  activeDetailData: any;
  videoPage: number;
  setVideoPage: (p: number) => void;
  errorPage: number;
  setErrorPage: (p: number) => void;
  setPreviewImageUrl: (url: string | null) => void;
  onNavigateTab?: (tab: string, opts?: any) => void;
}

export const SubjectVideoErrorsTab: React.FC<SubjectVideoErrorsTabProps> = ({
  activeDetailData,
  videoPage,
  setVideoPage,
  errorPage,
  setErrorPage,
  setPreviewImageUrl,
  onNavigateTab,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* YouTube Videos Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Youtube className="w-5 h-5 text-rose-400" />
            <span>YouTube Ders Videoları</span>
          </h3>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('youtube')}
              className="text-[11px] text-rose-400 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Tümü</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {activeDetailData.matchedVideos.length > 0 ? (
          (() => {
            const videoPerPage = 5;
            const totalVidPages = Math.ceil(activeDetailData.matchedVideos.length / videoPerPage);
            const paginatedVideos = activeDetailData.matchedVideos.slice((videoPage - 1) * videoPerPage, videoPage * videoPerPage);

            return (
              <>
                <div className="space-y-2.5">
                  {paginatedVideos.map((vid: any) => {
                    const isPlaylist = Boolean((vid.playlistVideos && vid.playlistVideos.length > 0) || vid.isPlaylist);
                    const playlistTotal = vid.playlistVideos ? vid.playlistVideos.length : 0;
                    const playlistWatched = vid.playlistVideos 
                      ? vid.playlistVideos.filter((pv: any) => pv.isWatched).length 
                      : (vid.isWatched ? 1 : 0);
                    const percent = isPlaylist && playlistTotal > 0 
                      ? Math.round((playlistWatched / playlistTotal) * 100) 
                      : (vid.isWatched ? 100 : 0);
                    const isFullyWatched = isPlaylist && playlistTotal > 0 
                      ? (playlistWatched === playlistTotal) 
                      : vid.isWatched;

                    return (
                      <div key={vid.id} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-rose-400 font-bold uppercase">{vid.channelName}</span>
                              {isPlaylist && (
                                <span className="text-[9px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">
                                  Oynatma Listesi
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-semibold text-white leading-snug">{vid.title || vid.playlistTitle}</h4>
                          </div>

                          <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold shrink-0 ${
                            isFullyWatched 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : (playlistWatched > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400')
                          }`}>
                            {isFullyWatched 
                              ? 'Tamamlandı' 
                              : (isPlaylist && playlistTotal > 0 
                                  ? `${playlistWatched}/${playlistTotal} İzlendi` 
                                  : 'İzlenecek')}
                          </span>
                        </div>

                        {isPlaylist && playlistTotal > 0 && (
                          <div className="space-y-1 pt-1.5 border-t border-slate-850">
                            <div className="flex justify-between items-center text-[10.5px] font-medium text-slate-400">
                              <span>Oynatma Listesi İlerlemesi</span>
                              <span className="font-bold font-mono text-slate-200">
                                {playlistWatched} / {playlistTotal} Video (%{percent})
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                              <div 
                                style={{ width: `${percent}%` }} 
                                className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-300" 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <PaginationControls
                  currentPage={videoPage}
                  totalPages={totalVidPages}
                  onPageChange={setVideoPage}
                />
              </>
            );
          })()
        ) : (
          <div className="text-center py-8 bg-slate-950/50 rounded-2xl text-xs text-slate-400 italic">
            Bu derse eklenmiş video ders takibi yok.
          </div>
        )}
      </div>

      {/* Topic Error Log Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-purple-400" />
            <span>Hata Defteri Kayıtları</span>
          </h3>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('errors')}
              className="text-[11px] text-purple-400 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Tümü</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {activeDetailData.matchedErrors.length > 0 ? (
          (() => {
            const errPerPage = 5;
            const totalErrPages = Math.ceil(activeDetailData.matchedErrors.length / errPerPage);
            const paginatedErrors = activeDetailData.matchedErrors.slice((errorPage - 1) * errPerPage, errorPage * errPerPage);

            return (
              <>
                <div className="space-y-3">
                  {paginatedErrors.map((err: any) => (
                    <div key={err.id} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{err.topicName || err.subject || 'Konu Belirtilmedi'}</span>
                            {err.examType && (
                              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded font-semibold">
                                {err.examType}
                              </span>
                            )}
                            {err.imageUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl(err.imageUrl!)}
                                className="p-1 text-purple-300 bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 rounded-lg transition-all cursor-pointer hover:scale-105"
                                title="Soru Görselini Tam Ekran İncele"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                              </button>
                            )}
                          </div>
                          {err.publisher && (
                            <div className="text-[10px] font-semibold text-purple-400 mt-0.5">Yayın / Kaynak: {err.publisher}</div>
                          )}
                        </div>
                        <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold shrink-0 ${
                          err.revised ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {err.revised ? 'Tekrar Edildi' : 'Tekrar Bekliyor'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        {err.date && <span className="text-slate-400 font-medium">Tarih: {err.date}</span>}
                        {err.errorReason && (
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-semibold">
                            Neden: {errorReasonLabels[err.errorReason] || err.errorReason}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <PaginationControls
                  currentPage={errorPage}
                  totalPages={totalErrPages}
                  onPageChange={setErrorPage}
                />
              </>
            );
          })()
        ) : (
          <div className="text-center py-8 bg-slate-950/50 rounded-2xl text-xs text-slate-400 italic">
            Bu derse eklenmiş hata kaydı yok.
          </div>
        )}
      </div>
    </div>
  );
};
