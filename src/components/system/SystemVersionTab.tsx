import React, { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  Download, 
  RotateCcw, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  Trash2, 
  ExternalLink, 
  Terminal, 
  Check, 
  X, 
  Layers, 
  Sparkles,
  Info,
  Server,
  ArrowUpRight,
  Search
} from 'lucide-react';
import { APP_VERSION, BUILD_DATE } from '../../version';
import { GitHubVersion, BackupInfo } from './SystemTypes';

export const SystemVersionTab: React.FC = () => {
  const [versions, setVersions] = useState<GitHubVersion[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);
  const [loadingBackups, setLoadingBackups] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Update in progress state
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateLogs, setUpdateLogs] = useState<string[]>([]);
  const [selectedVersionForUpdate, setSelectedVersionForUpdate] = useState<GitHubVersion | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Manual Backup State
  const [backupLabel, setBackupLabel] = useState<string>('');
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchVersions();
    fetchBackups();
    checkUpdateStatus();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isUpdating) {
      interval = setInterval(checkUpdateStatus, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isUpdating]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [updateLogs]);

  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch('/api/system/updater/versions');
      const data = await res.json();
      if (data.success && data.versions) {
        setVersions(data.versions);
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/system/updater/backups');
      const data = await res.json();
      if (data.success && data.backups) {
        setBackups(data.backups);
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const checkUpdateStatus = async () => {
    try {
      const res = await fetch('/api/system/updater/status');
      const data = await res.json();
      setIsUpdating(data.isUpdating);
      if (data.logs && data.logs.length > 0) {
        setUpdateLogs(data.logs);
      }
      if (!data.isUpdating && isUpdating) {
        // Just finished
        fetchBackups();
        fetchVersions();
      }
    } catch (err) {
      // ignore
    }
  };

  const handleStartUpdate = async () => {
    if (!selectedVersionForUpdate) return;
    setShowConfirmModal(false);
    setIsUpdating(true);
    setUpdateLogs([`[${new Date().toLocaleTimeString('tr-TR')}] Güncelleme işlemi başlatılıyor: ${selectedVersionForUpdate.tag}`]);

    try {
      const res = await fetch('/api/system/updater/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: selectedVersionForUpdate.tag,
          commitSha: selectedVersionForUpdate.commitSha,
          zipballUrl: selectedVersionForUpdate.zipballUrl
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert('Güncelleme başlatılamadı: ' + data.error);
        setIsUpdating(false);
      }
    } catch (err: any) {
      alert('İstek hatası: ' + err.message);
      setIsUpdating(false);
    }
  };

  const handleCreateManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch('/api/system/updater/backup-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: backupLabel || `manual_v${APP_VERSION}` })
      });
      const data = await res.json();
      if (data.success) {
        setBackupLabel('');
        fetchBackups();
      } else {
        alert('Yedek alma hatası: ' + data.error);
      }
    } catch (err: any) {
      alert('İstek hatası: ' + err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`DİKKAT: '${filename}' yedeği çalışma dizinine yüklenecek ve sistem yeniden derlenecektir.\n\nDevam etmek istediğinize emin misiniz?`)) {
      return;
    }

    setIsUpdating(true);
    setUpdateLogs([`[${new Date().toLocaleTimeString('tr-TR')}] '${filename}' yedeğini geri yükleme başlatıldı...`]);

    try {
      const res = await fetch('/api/system/updater/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (data.success) {
        alert('Yedek başarıyla geri yüklendi! Sayfa yenileniyor...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert('Geri yükleme hatası: ' + data.error);
        setIsUpdating(false);
      }
    } catch (err: any) {
      alert('İstek hatası: ' + err.message);
      setIsUpdating(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`'${filename}' yedeğini kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/system/updater/backups/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchBackups();
      } else {
        alert('Silme hatası: ' + data.error);
      }
    } catch (err: any) {
      alert('İstek hatası: ' + err.message);
    }
  };

  const filteredVersions = versions.filter(v => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (v.tag || '').toLowerCase().includes(q) ||
      (v.name || '').toLowerCase().includes(q) ||
      (v.message || '').toLowerCase().includes(q) ||
      (v.commitSha || '').toLowerCase().includes(q) ||
      (v.author || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. TOP OVERVIEW & ACTIVE VERSION CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Active Version Card */}
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-5 shadow-xl backdrop-blur-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>Aktif Çalışan Sürüm</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CANLI
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">{APP_VERSION}</span>
              <span className="text-xs text-slate-400 font-mono">({BUILD_DATE})</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              GitHub Reposu: <span className="text-slate-200 font-semibold">ccaqlayan/ykstakipsistemi3</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Node / Vite Fullstack</span>
            <button
              onClick={() => { fetchVersions(); fetchBackups(); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingVersions ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Backups Summary Card */}
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-5 shadow-xl backdrop-blur-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>Sistem Yedekleri</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                {backups.length} Yedek Kayıtlı
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">{backups.length}</span>
              <span className="text-xs text-slate-400">arşiv dosyası</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Son Yedek: <span className="text-slate-200 font-semibold">{backups[0] ? backups[0].filename : 'Yok'}</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={backupLabel}
              onChange={(e) => setBackupLabel(e.target.value)}
              placeholder="Yedek etiketi (isteğe bağlı)..."
              className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={handleCreateManualBackup}
              disabled={isBackingUp}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1 rounded-xl transition-all shadow-md flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {isBackingUp ? <RefreshCw className="w-3 h-3 animate-spin" /> : <HardDrive className="w-3 h-3" />}
              <span>Yedek Al</span>
            </button>
          </div>
        </div>

        {/* Disaster Recovery Link Card */}
        <div className="bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-900/90 border border-rose-500/30 rounded-3xl p-5 shadow-xl backdrop-blur-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>Acil Kurtarma Linki</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                GÜVENLİ
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
              Site tamamen çökse bile React paketlerinden bağımsız çalışan ve tek tıkla yedekten geri yükleyen acil kurtarma sayfası.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-mono text-rose-300/80">/emergency-restore</span>
            <a
              href="/emergency-restore"
              target="_blank"
              rel="noreferrer"
              className="bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Aç</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>

      {/* 2. LIVE TERMINAL / UPDATE PROGRESS (IF ACTIVE OR LOGS PRESENT) */}
      {(isUpdating || updateLogs.length > 0) && (
        <div className="bg-slate-950 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Sistem Güncelleme & Derleme Konsolu</h3>
              {isUpdating && (
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  İşlem Devam Ediyor
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!isUpdating && (
                <button
                  onClick={() => setUpdateLogs([])}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                >
                  Konsolu Temizle
                </button>
              )}
            </div>
          </div>

          <div className="bg-black/80 rounded-2xl p-4 border border-white/5 font-mono text-xs text-indigo-200/90 max-h-64 overflow-y-auto space-y-1.5">
            {updateLogs.map((log, idx) => {
              const isError = log.includes('HATA') || log.includes('❌');
              const isSuccess = log.includes('✅') || log.includes('TEBRİKLER');
              const isRollback = log.includes('ROLLBACK') || log.includes('🚨');
              return (
                <div 
                  key={idx} 
                  className={`leading-relaxed ${
                    isError 
                      ? 'text-rose-400 font-bold' 
                      : isRollback 
                      ? 'text-amber-400 font-bold bg-amber-500/10 p-1 rounded' 
                      : isSuccess 
                      ? 'text-emerald-400 font-semibold' 
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* 3. GITHUB REPOSITORY VERSION LIST */}
      <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <GitCommit className="w-5 h-5 text-indigo-400" />
              <span>GitHub Sürümleri ve Değişiklik Geçmişi</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              İstediğiniz versiyonu veya commit'i seçerek sisteminizi otomatik güncelleyebilir veya önceki bir sürüme dönebilirsiniz.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sürüm, commit veya başlık ara..."
                className="bg-slate-950/80 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 w-48 sm:w-64"
              />
            </div>
            <button
              onClick={fetchVersions}
              disabled={loadingVersions}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Sürümleri Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loadingVersions ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Version Cards */}
        {loadingVersions && versions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs">GitHub sürümleri yükleniyor...</p>
          </div>
        ) : filteredVersions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Info className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs">Arama kriterine uygun sürüm bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredVersions.map((v, index) => {
              const isCurrent = v.isCurrent;
              const dateStr = new Date(v.date).toLocaleString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={`${v.commitSha}-${index}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-indigo-950/30 border-indigo-500/40 shadow-lg'
                      : 'bg-slate-950/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border font-mono ${
                        isCurrent
                          ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/50'
                          : 'bg-white/5 text-slate-300 border-white/10'
                      }`}>
                        {v.tag}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        #{v.commitSha}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          ✓ Yüklü Sürüm
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {dateStr}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white leading-snug break-words pt-0.5">
                      {v.name}
                    </p>
                    
                    {v.author && (
                      <p className="text-[10px] text-slate-400">
                        Geliştirici: <span className="text-slate-300 font-medium">{v.author}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    {isCurrent ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Mevcut</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedVersionForUpdate(v);
                          setShowConfirmModal(true);
                        }}
                        disabled={isUpdating}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Bu Sürüme Güncelle</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. BACKUPS LIST CARD */}
      <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-amber-400" />
              <span>Kayıtlı Sistem Yedekleri</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Her güncelleme öncesi sistem otomatik olarak tam yedek alır. Dilediğiniz zaman bu yedekleri indirebilir veya tek tıkla geri yükleyebilirsiniz.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchBackups}
              disabled={loadingBackups}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Yedekleri Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loadingBackups ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-2 border border-dashed border-white/10 rounded-2xl">
            <HardDrive className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs">Henüz kayıtlı bir sistem yedeği bulunmuyor.</p>
            <button
              onClick={handleCreateManualBackup}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              Şimdi İlk Yedeği Al
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {backups.map((b) => {
              const dateStr = new Date(b.createdAt).toLocaleString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={b.filename}
                  className="bg-slate-950/60 border border-white/5 hover:border-white/15 p-4 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs font-bold text-white font-mono break-all">
                        {b.filename}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        b.isAuto
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      }`}>
                        {b.isAuto ? 'Otomatik Yedek' : 'Manuel Yedek'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                        {b.sizeFormatted}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{dateStr}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <a
                      href={`/api/system/updater/download-backup/${encodeURIComponent(b.filename)}`}
                      className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                      download
                    >
                      <Download className="w-3 h-3" />
                      <span>İndir</span>
                    </a>
                    <button
                      onClick={() => handleRestoreBackup(b.filename)}
                      disabled={isUpdating}
                      className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      title="Bu yedeği geri yükle"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Geri Yükle</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(b.filename)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Yedeği Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRM UPDATE MODAL */}
      {showConfirmModal && selectedVersionForUpdate && (
        <div 
          className="fixed inset-0 z-[100000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirmModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Sürüm Güncelleme Onayı</h3>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3.5">
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hedef Sürüm:</span>
                  <span className="font-bold text-white font-mono bg-indigo-500/30 px-2 py-0.5 rounded border border-indigo-400/40">
                    {selectedVersionForUpdate.tag}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Commit:</span>
                  <span className="font-mono text-slate-300">#{selectedVersionForUpdate.commitSha}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Açıklama:</span>
                  <p className="text-white font-semibold">{selectedVersionForUpdate.name}</p>
                </div>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5 text-amber-200">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Güvenlik & Otomatik Geri Alma Güvencesi:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-300/90 pl-1">
                  <li>İşlem başlamadan önce mevcut sisteminizin tam bir <strong>.zip yedeği</strong> otomatik alınır.</li>
                  <li><code>.env</code> dosyası ve kullanıcıların yüklediği <strong>fotoğraflar kesinlikle korunur</strong>.</li>
                  <li>Derleme veya sunucu testinde bir hata yaşanırsa, sistem <strong>otomatik olarak önceki yedeğe geri döner</strong>.</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleStartUpdate}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Güncellemeyi Başlat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
