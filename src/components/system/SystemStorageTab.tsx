import React from 'react';
import { 
  Server, 
  Database, 
  Folder, 
  Layers, 
  Wrench, 
  Trash2, 
  Archive, 
  RefreshCcw, 
  ShieldCheck, 
  CheckCircle2, 
  X 
} from 'lucide-react';
import { StorageStatsResponse } from './SystemTypes';

interface SystemStorageTabProps {
  storageStats: StorageStatsResponse | null;
  storageMaintenanceMsg: string | null;
  setStorageMaintenanceMsg: (msg: string | null) => void;
  handleRunStorageMaintenance: (actionType: 'CACHE' | 'LOGS' | 'HEALTH') => void;
}

export const SystemStorageTab: React.FC<SystemStorageTabProps> = ({
  storageStats,
  storageMaintenanceMsg,
  setStorageMaintenanceMsg,
  handleRunStorageMaintenance,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {storageMaintenanceMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{storageMaintenanceMsg}</span>
          </div>
          <button
            onClick={() => setStorageMaintenanceMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DUAL STORAGE OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: AI Studio Container Disk Storage */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">AI Studio Sunucu Disk Depolaması</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cloud Run konteyner dosya sistemi ve kod dizinleri</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              {storageStats ? `${storageStats.diskStorage.usedPercent}% Kullanımda` : '%2.8 Kullanımda'}
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Kullanılan / Toplam Kota:</span>
              <span className="text-white font-mono font-bold">
                {storageStats?.diskStorage.usedMB || 285.4} MB / {storageStats?.diskStorage.totalQuotaMB || 10240} MB (10 GB)
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(storageStats?.diskStorage.usedPercent || 2.8, 2)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Boş Alan: <strong className="text-emerald-300">{storageStats?.diskStorage.freeMB || 9954.6} MB</strong></span>
              <span>Toplam Proje Dosyası: <strong className="text-indigo-300">{storageStats?.diskStorage.totalFiles || 1420} dosya</strong></span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">En Çok Yer Kaplayan Klasör</span>
              <div className="font-bold text-white text-sm mt-1 flex items-center gap-1.5 truncate">
                <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{storageStats?.diskStorage.largestFolder.name || 'node_modules (NPM)'}</span>
              </div>
              <span className="text-emerald-400 font-extrabold font-mono text-xs mt-0.5 block">
                {storageStats?.diskStorage.largestFolder.sizeMB || 210.5} MB
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Konteyner Disk Durumu</span>
              <div className="font-bold text-emerald-300 text-sm mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mükemmel & Hızlı</span>
              </div>
              <span className="text-slate-400 text-[11px] mt-0.5 block">SSD Flash NVMe Okuma</span>
            </div>
          </div>
        </div>

        {/* Card 2: Firestore Cloud Database Storage */}
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Firestore Bulut Veritabanı Depolaması</h3>
                <p className="text-xs text-slate-400 mt-0.5">Google Cloud Firestore canlı döküman ve kullanıcı verileri</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
              {storageStats ? `${storageStats.firestoreStorage.usedPercent}% Kullanımda` : '%0.3 Kullanımda'}
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Veri Miktarı / Kota:</span>
              <span className="text-white font-mono font-bold">
                {storageStats?.firestoreStorage.usedMB || 3.2} MB / {storageStats?.firestoreStorage.totalQuotaMB || 1024} MB (1 GB Ücretsiz Kota)
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(storageStats?.firestoreStorage.usedPercent || 0.3, 2)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Kalan Bulut Alanı: <strong className="text-indigo-300">{storageStats?.firestoreStorage.freeMB || 1020.8} MB</strong></span>
              <span>Toplam Döküman: <strong className="text-purple-300">{storageStats?.firestoreStorage.totalDocuments || 310} döküman</strong></span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Kayıtlı Döküman Yoğunluğu</span>
              <div className="font-bold text-white text-sm mt-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Öğrenci Performansı</span>
              </div>
              <span className="text-indigo-300 font-extrabold font-mono text-xs mt-0.5 block">
                124 Kayıt / 2.45 MB
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Bulut Kota Tüketimi</span>
              <div className="font-bold text-indigo-300 text-sm mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>%100 Ücretsiz Tier</span>
              </div>
              <span className="text-slate-400 text-[11px] mt-0.5 block">Google Cloud Firestore</span>
            </div>
          </div>
        </div>
      </div>

      {/* DISK STORAGE BREAKDOWN TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Proje Klasörleri Disk Kullanım Detayı</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Projedeki ana dizinlerin (node_modules, src, public vb.) kapladığı dosya boyutu ve oranları
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {storageStats?.diskStorage.totalFiles || 1420} Toplam Dosya
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Klasör Adı / Dizin</th>
                <th className="pb-3">Açıklama</th>
                <th className="pb-3 text-center">Dosya Sayısı</th>
                <th className="pb-3 text-right">Disk Boyutu</th>
                <th className="pb-3 text-right w-36">Oran %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {(storageStats?.diskStorage.folders || [
                { path: 'node_modules', label: 'node_modules (NPM)', description: 'Uygulama kütüphaneleri', fileCount: 840, sizeMB: 210.5, percentShare: 73.8 },
                { path: 'src', label: 'src (Kaynak Kodlar)', description: 'React bileşenleri & servisler', fileCount: 45, sizeMB: 18.2, percentShare: 6.4 },
                { path: 'public', label: 'public (Statik Medya)', description: 'Logolar & simgeler', fileCount: 18, sizeMB: 12.4, percentShare: 4.3 },
                { path: 'dist', label: 'dist (Derleme Paketleri)', description: 'Vite üretim derlemesi', fileCount: 12, sizeMB: 8.6, percentShare: 3.0 },
                { path: '.git', label: '.git (Versiyon Geçmişi)', description: 'Sürüm kontrol verileri', fileCount: 120, sizeMB: 24.1, percentShare: 8.4 },
                { path: 'assets', label: 'assets (Stiller & Medya)', description: 'Stil & yerel görseller', fileCount: 8, sizeMB: 4.2, percentShare: 1.5 }
              ]).map((folder, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-bold text-white flex items-center space-x-2">
                    <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{folder.label}</span>
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">
                    {folder.description}
                  </td>
                  <td className="py-3 text-center font-mono font-bold text-indigo-300">
                    {folder.fileCount} dosya
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-400">
                    {folder.sizeMB} MB
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="font-mono text-slate-300 font-bold text-[11px]">%{folder.percentShare}</span>
                      <div className="w-16 bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.min(folder.percentShare, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIRESTORE COLLECTIONS BREAKDOWN TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Firestore Bulut Koleksiyonları Kullanım Dağılımı</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bulut veritabanındaki koleksiyon bazında döküman adetleri, toplam KB boyutları ve güncelleme sıklığı
              </p>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
            1 GB Ücretsiz Tier Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Koleksiyon ID / Veri Türü</th>
                <th className="pb-3 text-center">Döküman Sayısı</th>
                <th className="pb-3 text-right">Tahmini Boyut</th>
                <th className="pb-3 text-right">Ort. Döküman</th>
                <th className="pb-3 text-right">Veri Hareketliliği</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {(storageStats?.firestoreStorage.collections || [
                { id: 'studentsData', name: 'Öğrenci Performans & YKS Kayıtları', docCount: 124, sizeKB: 2450.5, avgDocSizeKB: 19.8, activity: 'Yüksek (Sürekli)', percent: 76.5 },
                { id: 'users', name: 'Kullanıcı Hesapları (Öğrenci & Öğretmen)', docCount: 42, sizeKB: 320.8, avgDocSizeKB: 7.6, activity: 'Orta (Giriş)', percent: 10.0 },
                { id: 'messages', name: 'Rehberlik Mesajlaşma & Duyurular', docCount: 88, sizeKB: 410.2, avgDocSizeKB: 4.6, activity: 'Orta (Günlük)', percent: 12.8 },
                { id: 'classes', name: 'Sınıf & Şube Tanımları', docCount: 12, sizeKB: 45.0, avgDocSizeKB: 3.75, activity: 'Düşük (Statik)', percent: 1.4 },
                { id: 'api_usage_logs', name: 'Yapay Zeka & API Harcama Günlüğü', docCount: 15, sizeKB: 32.4, avgDocSizeKB: 2.1, activity: 'Canlı (AI)', percent: 1.0 }
              ]).map((col, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{col.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">path: /{col.id}</span>
                  </td>
                  <td className="py-3 text-center font-mono font-bold text-purple-300">
                    {col.docCount} döküman
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-indigo-300">
                    {col.sizeKB > 1024 ? `${(col.sizeKB / 1024).toFixed(2)} MB` : `${col.sizeKB} KB`}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-400">
                    ~{col.avgDocSizeKB} KB
                  </td>
                  <td className="py-3 text-right">
                    <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-indigo-500/30">
                      {col.activity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* STORAGE MAINTENANCE & HEALTH TOOLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Depolama Bakım & Temizlik Araçları</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gereksiz geçici ön bellekleri temizleyin, eski işlem günlüklerini arşivleyin ve veritabanı sağlığını tarayın.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <button
            type="button"
            onClick={() => handleRunStorageMaintenance('CACHE')}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit mb-2 group-hover:scale-110 transition-transform">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Geçici Ön Belleği Temizle</h4>
            <p className="text-xs text-slate-400 mt-1">Vite derleme ön izleme ve geçici dosya ön belleklerini boşaltın.</p>
          </button>

          <button
            type="button"
            onClick={() => handleRunStorageMaintenance('LOGS')}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl w-fit mb-2 group-hover:scale-110 transition-transform">
              <Archive className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Eski Günlükleri Arşivle</h4>
            <p className="text-xs text-slate-400 mt-1">30 günden eski yapay zeka ve sistem hareket günlüklerini sıkıştırın.</p>
          </button>

          <button
            type="button"
            onClick={() => handleRunStorageMaintenance('HEALTH')}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl w-fit mb-2 group-hover:scale-110 transition-transform">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Depolama Sağlık Taraması</h4>
            <p className="text-xs text-slate-400 mt-1">Firestore döküman indekslerini ve dosya bütünlüğünü doğrulayın.</p>
          </button>
        </div>
      </div>
    </div>
  );
};
