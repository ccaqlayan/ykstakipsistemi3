import React from 'react';
import { RotateCcw, CheckCircle2, X, Maximize, Minimize, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { YildizLisesiLogo } from '../YildizLisesiLogo';

interface AppToastBannerProps {
  isZenMode: boolean;
  isQuotaExceeded: boolean;
  setIsQuotaExceeded: (val: boolean) => void;
  lastToast: { id: string; message: string; type?: 'success' | 'warning' | 'error' | 'info'; title?: string; undoFn?: () => void } | null;
  setLastToast: (val: { id: string; message: string; type?: 'success' | 'warning' | 'error' | 'info'; title?: string; undoFn?: () => void } | null) => void;
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
      {isQuotaExceeded && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-amber-950/90 border-b border-amber-500/30 px-4 py-3 text-amber-200 text-sm shadow-xl backdrop-blur-md relative z-50 animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 text-center md:text-left">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <p className="font-bold text-amber-200 text-xs sm:text-sm">
                  Bulut Veri Tabanı Günlük Kotası Doldu (Kesintisiz Çevrim Dışı Mod Devrede)
                </p>
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
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 transition-all cursor-pointer whitespace-nowrap"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}

      {/* Floating Undo / Alert Toast Notification */}
      {lastToast && (() => {
        const isError = lastToast.type === 'error';
        const isWarning = lastToast.type === 'warning';
        const isInfo = lastToast.type === 'info';
        
        const defaultTitle = isError ? 'İŞLEM ENGELLENDİ' : isWarning ? 'DİKKAT / UYARI' : isInfo ? 'BİLGİ' : 'İŞLEM GERÇEKLEŞTİ';
        const titleText = lastToast.title || defaultTitle;

        const borderClass = isError ? 'border-rose-500/50 shadow-rose-500/20' : isWarning ? 'border-amber-500/50 shadow-amber-500/20' : isInfo ? 'border-sky-500/50 shadow-sky-500/20' : 'border-purple-500/40 shadow-purple-500/20';
        const iconBgClass = isError ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : isWarning ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : isInfo ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        const titleColorClass = isError ? 'text-rose-400' : isWarning ? 'text-amber-400' : isInfo ? 'text-sky-400' : 'text-slate-400';

        return (
          <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-bounce-short max-w-sm sm:max-w-md md:max-w-lg ml-auto">
            <div className={`bg-slate-900/95 border ${borderClass} text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-xl flex items-center space-x-2.5 sm:space-x-3.5`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${iconBgClass} flex items-center justify-center shrink-0`}>
                {isError ? (
                  <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                ) : isInfo ? (
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 pr-1">
                <div className={`text-[10px] sm:text-[11px] font-extrabold ${titleColorClass} uppercase tracking-wider leading-tight`}>
                  {titleText}
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-100 leading-snug mt-0.5 break-words">{lastToast.message}</p>
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
        );
      })()}

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
