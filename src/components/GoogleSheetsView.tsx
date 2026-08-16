import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Upload, 
  RotateCcw, 
  FolderPlus,
  Lock,
  Sparkles
} from 'lucide-react';
import { YKSDataState, GoogleSheetsStatus } from '../types';
import { 
  checkGoogleAuthStatus, 
  startGoogleAuthFlow, 
  createYKSGoogleSheet, 
  syncDataToGoogleSheet,
  logoutGoogleAuth 
} from '../services/sheetsService';
import { exportDataAsJSON, resetToDefaultData } from '../services/storage';

interface GoogleSheetsViewProps {
  state: YKSDataState;
  onUpdateSheetsStatus: (status: GoogleSheetsStatus) => void;
  onReloadState: (newState: YKSDataState) => void;
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  state,
  onUpdateSheetsStatus,
  onReloadState
}) => {
  const { sheetsStatus, profile } = state;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check auth status on mount
    checkGoogleAuthStatus().then((auth) => {
      if (auth.isConnected) {
        onUpdateSheetsStatus({
          ...sheetsStatus,
          isConnected: true,
          userEmail: auth.email
        });
      }
    });

    // Check query param for OAuth redirect callback status
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_success') === 'true') {
      setMessage({ type: 'success', text: 'Google hesabınız başarıyla bağlandı!' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('oauth_error')) {
      setMessage({ type: 'error', text: 'Google yetkilendirme hatası: ' + params.get('oauth_error') });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnectGoogle = () => {
    startGoogleAuthFlow();
  };

  const handleCreateSheet = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await createYKSGoogleSheet(profile.name || 'Öğrenci');
      onUpdateSheetsStatus({
        ...sheetsStatus,
        sheetId: res.spreadsheetId,
        sheetUrl: res.spreadsheetUrl
      });
      setMessage({ type: 'success', text: 'Google Sheets tablosu Google Drive üzerinde oluşturuldu!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Sheet oluşturulurken hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToSheet = async () => {
    if (!sheetsStatus.sheetId) {
      setMessage({ type: 'error', text: 'Önce bir Google Sheet tablosu oluşturmalı veya bağlamalısınız.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await syncDataToGoogleSheet(sheetsStatus.sheetId, state);
      onUpdateSheetsStatus({
        ...sheetsStatus,
        lastSyncedAt: new Date().toLocaleString('tr-TR')
      });
      setMessage({ type: 'success', text: 'Tüm çalışma planı, soru takipleri, denemeler ve yanlış tablosu Google Sheets\'e aktarıldı!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Senkronizasyon sırasında hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onReloadState(parsed);
        setMessage({ type: 'success', text: 'Yedek verileri başarıyla yüklendi!' });
      } catch (err) {
        setMessage({ type: 'error', text: 'Geçersiz JSON yedek dosyası.' });
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Tüm veriler varsayılan örnek verilere sıfırlanacak. Emin misiniz?')) {
      const reset = resetToDefaultData();
      onReloadState(reset as any);
      setMessage({ type: 'success', text: 'Veriler varsayılan duruma sıfırlandı.' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Google Sheets Entegrasyonu & Veri Yedekleme</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Google Drive hesabınızı bağlayarak tüm YKS takip verilerinizi anlık olarak Google Sheets e-tablosuna aktarın.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs flex items-center space-x-2 border ${
          message.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Google Connection Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
              sheetsStatus.isConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Google Hesabı Bağlantı Durumu</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  sheetsStatus.isConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {sheetsStatus.isConnected ? 'Bağlı' : 'Bağlı Değil'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {sheetsStatus.isConnected && sheetsStatus.userEmail
                  ? `Bağlı E-posta: ${sheetsStatus.userEmail}`
                  : 'Google Sheets API izni almak için oturum açın.'}
              </p>
            </div>
          </div>

          {!sheetsStatus.isConnected ? (
            <button
              onClick={handleConnectGoogle}
              id="connect-google-account-btn"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Google Hesabını Bağla</span>
            </button>
          ) : (
            <button
              onClick={async () => {
                await logoutGoogleAuth();
                onUpdateSheetsStatus({ isConnected: false });
              }}
              className="text-xs text-slate-400 hover:text-rose-400 underline"
            >
              Çıkış Yap
            </button>
          )}
        </div>

        {/* Sheet Actions */}
        {sheetsStatus.isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Create Sheet */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FolderPlus className="w-4 h-4 text-indigo-400" />
                <span>1. Google Drive E-Tablosu Oluştur</span>
              </h3>
              <p className="text-xs text-slate-400">
                Google Drive hesabınızda "YKS Takip Sistemi 2026" adıyla 5 sekmeden oluşan hazır tablo oluşturur.
              </p>

              {sheetsStatus.sheetUrl ? (
                <div className="space-y-2 pt-2">
                  <a
                    href={sheetsStatus.sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">Google Sheets'te Aç</span>
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    Sheet ID: {sheetsStatus.sheetId}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleCreateSheet}
                  disabled={loading}
                  id="create-google-sheet-btn"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
                >
                  {loading ? 'Oluşturuluyor...' : 'Yeni YKS Sheets Tablosu Oluştur'}
                </button>
              )}
            </div>

            {/* Box 2: Sync Data */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>2. Verileri Google Sheets'e Aktar</span>
              </h3>
              <p className="text-xs text-slate-400">
                Uygulamanızdaki tüm çalışma planları, soru sayıları, denemeler ve yanlış tablosunu Sheet'e yazar.
              </p>

              <button
                onClick={handleSyncToSheet}
                disabled={loading || !sheetsStatus.sheetId}
                id="sync-to-google-sheet-btn"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {loading ? 'Aktarılıyor...' : 'Verileri Google Sheets ile Eşitle'}
              </button>

              {sheetsStatus.lastSyncedAt && (
                <p className="text-[11px] text-emerald-400 font-mono text-center mt-1">
                  Son Eşitleme: {sheetsStatus.lastSyncedAt}
                </p>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Local File Export / Import */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">Çevrimdışı Veri Yedekleme & İçe/Dışa Aktarma</h2>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => exportDataAsJSON(state)}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Yedek Dosyası İndir (JSON)</span>
          </button>

          <label className="w-full sm:w-auto bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Yedek Dosyası Yükle (JSON)</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleResetData}
            className="w-full sm:w-auto text-xs text-slate-500 hover:text-rose-400 px-3 py-2 transition-colors ml-auto"
          >
            Varsayılana Sıfırla
          </button>
        </div>
      </div>

    </div>
  );
};
