import React from 'react';
import { RotateCcw, CheckCircle2, X, Maximize, Minimize } from 'lucide-react';
import { YildizLisesiLogo } from '../YildizLisesiLogo';

interface AppToastBannerProps {
  isZenMode: boolean;
  isQuotaExceeded: boolean;
  setIsQuotaExceeded: (val: boolean) => void;
  lastToast: { id: string; message: string; undoFn?: () => void } | null;
  setLastToast: (val: { id: string; message: string; undoFn?: () => void } | null) => void;
  activeTab: string;
  isFullscreen: boolean;
  isVirtualFullscreen: boolean;
  handleToggleFullscreen: () => void;
  showPwaGuide: boolean;
  setShowPwaGuide: (val: boolean) => void;
  currentSchoolName: string;
}

export const AppToastBanner: React.FC<AppToastBannerProps> = ({
  isZenMode,
  isQuotaExceeded,
  setIsQuotaExceeded,
  lastToast,
  setLastToast,
  activeTab,
  isFullscreen,
  isVirtualFullscreen,
  handleToggleFullscreen,
  showPwaGuide,
  setShowPwaGuide,
  currentSchoolName
}) => {
  return (
    <>
      {/* Firebase Quota Warning Banner */}
      {!isZenMode && isQuotaExceeded && (
        <div className="w-full max-w-7xl mx-auto px-4 pt-4 relative z-20 animate-fade-in">
          <div className="bg-amber-950/60 border border-amber-500/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-200">
                  Bulut Veri Tabanı Kotası Doldu (Sorunsuz Oturum Devam Ediyor)
                </h4>
                <p className="text-xs text-amber-300/90 leading-relaxed max-w-3xl">
                  Yüksek kullanım sebebiyle ücretsiz Google Firebase bulut veri tabanı günlük yazma sınırına ulaşıldı. 
                  Yaptığınız değişiklikler tarayıcınızın <strong>Yerel Depolama (localStorage)</strong> hafızasında güvenle saklanacak, 
                  oturumunuz kesintiye uğramadan çalışmaya devam edecektir. Dilerseniz tüm verilerinizi sağ üstteki menüden 
                  <strong> "Veri Yedekle (JSON)"</strong> butonu ile bilgisayarınıza indirebilirsiniz. Sınırlar sıfırlandığında bulut otomatik eşitlenecektir.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsQuotaExceeded(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all cursor-pointer self-end md:self-auto shrink-0"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}

      {/* Floating Undo Toast Notification */}
      {lastToast && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-bounce-short max-w-sm sm:max-w-md ml-auto">
          <div className="bg-slate-900/95 border border-purple-500/40 text-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-xl flex items-center space-x-2 sm:space-x-3.5">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-tight">İşlem Gerçekleşti</div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-100 truncate">{lastToast.message}</p>
            </div>

            {lastToast.undoFn && (
              <button
                onClick={() => {
                  if (lastToast.undoFn) lastToast.undoFn();
                }}
                className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs flex items-center space-x-1 shadow-md shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Geri Al</span>
              </button>
            )}

            <button
              onClick={() => setLastToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Fullscreen Action Button */}
      {activeTab !== 'pomodoro' && !isZenMode && (
        <button
          onClick={handleToggleFullscreen}
          className="fixed bottom-6 left-6 z-40 p-3.5 bg-slate-950/80 hover:bg-indigo-600 border border-white/10 text-white rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 group focus:outline-none"
          title={isFullscreen || isVirtualFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
        >
          {isFullscreen || isVirtualFullscreen ? (
            <Minimize className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors" />
          ) : (
            <Maximize className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors" />
          )}
        </button>
      )}

      {/* PWA Home Screen Install Guide Modal */}
      {showPwaGuide && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center pb-5 border-b border-white/5 relative z-10">
              <YildizLisesiLogo className="w-20 h-20 mb-3 filter drop-shadow-md" />
              <h3 className="text-lg font-black text-white">YKS Takip Sistemi</h3>
              <p className="text-xs text-indigo-300 font-bold mt-1">{currentSchoolName}</p>
            </div>

            <div className="py-5 space-y-4 text-slate-300 relative z-10 text-xs sm:text-sm">
              <p className="text-slate-400 font-medium text-center">
                Uygulamayı telefon veya tabletinizin ana ekranına ekleyerek tek dokunuşla bir uygulama gibi hızlıca açabilirsiniz.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-white font-bold">
                  <span className="w-5 h-5 rounded-lg bg-indigo-600/30 border border-indigo-400 text-indigo-300 flex items-center justify-center text-xs font-black">1</span>
                  <span>Apple iOS (iPhone / iPad) için:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs">
                  <li>Tarayıcınızın altındaki <span className="text-white font-bold">"Paylaş" (Share)</span> butonuna tıklayın.</li>
                  <li>Açılan menüden aşağı kaydırıp <span className="text-white font-bold">"Ana Ekrana Ekle" (Add to Home Screen)</span> seçeneğini seçin.</li>
                  <li>Sağ üstteki <span className="text-white font-bold">"Ekle"</span> butonuna basarak tamamlayın.</li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-white font-bold">
                  <span className="w-5 h-5 rounded-lg bg-indigo-600/30 border border-indigo-400 text-indigo-300 flex items-center justify-center text-xs font-black">2</span>
                  <span>Android / Chrome için:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs">
                  <li>Tarayıcı adres çubuğunun sağındaki <span className="text-white font-bold">üç nokta (Menü)</span> simgesine tıklayın.</li>
                  <li><span className="text-white font-bold">"Uygulamayı yükle"</span> veya <span className="text-white font-bold">"Ana ekrana ekle"</span> seçeneğini seçin.</li>
                  <li>Gelen onay penceresinde <span className="text-white font-bold">"Ekle / Yükle"</span> butonuna tıklayın.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-3 relative z-10">
              <button
                onClick={() => setShowPwaGuide(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
