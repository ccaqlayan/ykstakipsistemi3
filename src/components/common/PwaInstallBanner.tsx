import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  X, 
  Smartphone, 
  CheckCircle2, 
  Sparkles,
  Share
} from 'lucide-react';
import { offlineSync } from '../../services/offlineSyncService';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncedAt: null as number | null
  });

  useEffect(() => {
    // Subscribe to offline sync manager
    const unsubscribe = offlineSync.subscribe((status) => {
      setSyncStatus(status);
    });

    // Check if iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isIosDevice && !isStandalone) {
      setIsIos(true);
    }

    // Capture beforeinstallprompt for Android & Desktop Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt only if user hasn't dismissed in this session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismissPrompt = () => {
    setShowInstallPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', '1');
  };

  return (
    <>
      {/* 1. Offline & Sync Status Floating Indicator */}
      {!syncStatus.isOnline && (
        <div className="fixed bottom-4 left-4 z-[90] bg-rose-600/90 text-white px-3.5 py-2 rounded-2xl shadow-xl backdrop-blur-md border border-rose-400/40 text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-bottom-2">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Çevrimdışı Mod: İşlemleriniz yerelde kaydediliyor</span>
          {syncStatus.pendingCount > 0 && (
            <span className="bg-rose-950/80 px-2 py-0.5 rounded-full text-[10px] font-mono">
              {syncStatus.pendingCount} bekliyor
            </span>
          )}
        </div>
      )}

      {syncStatus.isOnline && syncStatus.isSyncing && (
        <div className="fixed bottom-4 left-4 z-[90] bg-indigo-600/90 text-white px-3.5 py-2 rounded-2xl shadow-xl backdrop-blur-md border border-indigo-400/40 text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-bottom-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
          <span>Verileriniz senkronize ediliyor...</span>
        </div>
      )}

      {/* 2. PWA Install Banner */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 right-4 z-[85] max-w-sm bg-slate-900/95 border border-indigo-500/40 rounded-3xl p-4 shadow-2xl backdrop-blur-md text-white space-y-2.5 animate-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Uygulamayı Cihazına Yükle</h4>
                <p className="text-[11px] text-slate-400 leading-tight">
                  İnternetsiz ortamda hızlı çalışır ve bildirim gönderir.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissPrompt}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yükle (Ücretsiz)</span>
            </button>
            <button
              onClick={handleDismissPrompt}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Daha Sonra
            </button>
          </div>
        </div>
      )}

      {/* 3. iOS Safari Install Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Share className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">iPhone / iPad'e Yükleme</h3>
            <p className="text-xs text-slate-300 leading-relaxed text-left space-y-2">
              <span>1. Safari tarayıcısının altındaki <strong>Paylaş</strong> (kare ve yukarı ok) simgesine dokunun.</span><br />
              <span>2. Menüden <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.</span><br />
              <span>3. Sağ üstteki <strong>"Ekle"</strong> butonuna basarak uygulamayı yükleyin.</span>
            </p>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
};
