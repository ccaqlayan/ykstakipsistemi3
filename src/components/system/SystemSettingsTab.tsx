import React from 'react';
import { 
  GraduationCap, 
  Building2, 
  School, 
  Activity, 
  Zap, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Bell, 
  Save, 
  CheckCircle2, 
  X,
  Wrench,
  Clock,
  ShieldAlert,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { db, setLowDataMode, setLowDataModeIntervalMinutes, getPresenceHeartbeatMinutes, setPresenceHeartbeatMinutes, setPresenceHeartbeatEnabled, sanitizeAndPrepareForFirestore } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface SystemSettingsTabProps {
  settingsSaveMsg: string | null;
  setSettingsSaveMsg: (msg: string | null) => void;
  setShowLogoManager: (val: boolean) => void;
  schoolName: string;
  setSchoolName: (val: string) => void;
  academicYear: string;
  setAcademicYear: (val: string) => void;
  yksTargetDate: string;
  setYksTargetDate: (val: string) => void;
  handleSaveSettings: (e: React.FormEvent) => Promise<void>;
  activeCriteriaDays: number;
  setActiveCriteriaDays: (val: number) => void;
  activeCriteriaMinQuestions: number;
  setActiveCriteriaMinQuestions: (val: number) => void;
  activeCriteriaMinPlans: number;
  setActiveCriteriaMinPlans: (val: number) => void;
  onlineTimeoutMinutes: number;
  setOnlineTimeoutMinutes: (val: number) => void;
  showLastSeenEnabled: boolean;
  setShowLastSeenEnabled: (val: boolean) => void;
  presenceHeartbeatEnabled: boolean;
  setPresenceHeartbeatEnabledState: (val: boolean) => void;
  presenceHeartbeatMinutes: number;
  setPresenceHeartbeatMinutesState: (val: number) => void;
  handleSaveCriteriaSettings: (e: React.FormEvent) => Promise<void>;
  isLowDataModeActive: boolean;
  setIsLowDataModeActive: (val: boolean) => void;
  intervalMinutes: number;
  setIntervalMinutes: (val: number) => void;
  handleExportSystemBackup: () => void;
  dailyEmailNotify: boolean;
  setDailyEmailNotify: (val: boolean) => void;
  inactiveStudentAlert: boolean;
  setInactiveStudentAlert: (val: boolean) => void;
  highRiskTopicAlert: boolean;
  setHighRiskTopicAlert: (val: boolean) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: (val: boolean) => void;
  maintenanceMessage: string;
  setMaintenanceMessage: (val: string) => void;
  maintenanceEndTime: string;
  setMaintenanceEndTime: (val: string) => void;
  maintenanceAllowTeachers: boolean;
  setMaintenanceAllowTeachers: (val: boolean) => void;
  handleSaveMaintenanceSettings: (e?: React.FormEvent, directMode?: boolean) => Promise<void>;
}

export const SystemSettingsTab: React.FC<SystemSettingsTabProps> = ({
  settingsSaveMsg,
  setSettingsSaveMsg,
  setShowLogoManager,
  schoolName,
  setSchoolName,
  academicYear,
  setAcademicYear,
  yksTargetDate,
  setYksTargetDate,
  handleSaveSettings,
  activeCriteriaDays,
  setActiveCriteriaDays,
  activeCriteriaMinQuestions,
  setActiveCriteriaMinQuestions,
  activeCriteriaMinPlans,
  setActiveCriteriaMinPlans,
  onlineTimeoutMinutes,
  setOnlineTimeoutMinutes,
  showLastSeenEnabled,
  setShowLastSeenEnabled,
  presenceHeartbeatEnabled,
  setPresenceHeartbeatEnabledState,
  presenceHeartbeatMinutes,
  setPresenceHeartbeatMinutesState,
  handleSaveCriteriaSettings,
  isLowDataModeActive,
  setIsLowDataModeActive,
  intervalMinutes,
  setIntervalMinutes,
  handleExportSystemBackup,
  dailyEmailNotify,
  setDailyEmailNotify,
  inactiveStudentAlert,
  setInactiveStudentAlert,
  highRiskTopicAlert,
  setHighRiskTopicAlert,
  maintenanceMode,
  setMaintenanceMode,
  maintenanceMessage,
  setMaintenanceMessage,
  maintenanceEndTime,
  setMaintenanceEndTime,
  maintenanceAllowTeachers,
  setMaintenanceAllowTeachers,
  handleSaveMaintenanceSettings,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {settingsSaveMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{settingsSaveMsg}</span>
          </div>
          <button
            onClick={() => setSettingsSaveMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FEATURED: MAINTENANCE MODE CONFIGURATION CARD */}
      <div className={`border rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5 transition-all ${
        maintenanceMode 
          ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-orange-950/70 border-amber-500/60 shadow-amber-500/10'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              maintenanceMode 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">Sistem Bakım Modu (Maintenance Mode)</h3>
                {maintenanceMode ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider animate-pulse">
                    ⚠️ Bakım Aktif
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    🟢 Normal Çalışıyor
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bakım modunu açarak öğrenci erişimini durdurabilir, bakım mesajı ve bitiş saati yayınlayabilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                const nextState = !maintenanceMode;
                if (nextState) {
                  if (confirm('Sistem Bakım Modunu AKTİF etmek üzeresiniz. Yönetici (Admin) haricindeki tüm kullanıcılar bakım ekranına yönlendirilecektir. Onaylıyor musunuz?')) {
                    setMaintenanceMode(true);
                    handleSaveMaintenanceSettings(undefined, true);
                  }
                } else {
                  setMaintenanceMode(false);
                  handleSaveMaintenanceSettings(undefined, false);
                }
              }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 shadow-lg ${
                maintenanceMode
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 border border-emerald-400/40'
                  : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30 border border-amber-400/40'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>{maintenanceMode ? 'Bakım Modunu Kapat' : 'Bakım Modunu Başlat'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={(e) => handleSaveMaintenanceSettings(e)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Öğrencilere Gösterilecek Bakım Mesajı:</span>
                <span className="text-[10px] text-slate-500 font-normal">Kişiselleştirilmiş duyuru metni</span>
              </label>
              <textarea
                rows={3}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Öğrencilerin bakım ekranında göreceği açıklama metnini yazın..."
                className="w-full bg-slate-950 text-white font-medium text-xs p-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-all leading-relaxed"
              />
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Tahmini Bitiş Saati / Süresi:
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={maintenanceEndTime}
                    onChange={(e) => setMaintenanceEndTime(e.target.value)}
                    placeholder="Örn: 23:30 veya 1 saat"
                    className="w-full bg-slate-950 text-white font-medium text-xs py-2.5 pl-9 pr-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200 block">Öğretmen Girişi</span>
                  <span className="text-[10px] text-slate-400 block">Öğretmenler bakımda sisteme girebilsin</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceAllowTeachers}
                    onChange={(e) => setMaintenanceAllowTeachers(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Yöneticiler (Admin) bakım modu açıkken bile sistemi tam yetkiyle kullanabilir.</span>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center space-x-2 shadow-sm"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Bakım Mesajı ve Ayarları Kaydet</span>
            </button>
          </div>
        </form>
      </div>

      {/* FEATURED: UNIVERSITY LOGO MANAGER SECTION */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-purple-500/30 border border-purple-400/40 shrink-0 mt-0.5">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  Üniversite Logoları Yönetimi
                </span>
                <span className="text-xs text-slate-400">Öğrenci Tercih Rehberliği</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Öğrenci Panellerinde Görünür Üniversite Logolarını Özelleştirin
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                YKS hedef belirleme ve üniversite tercih süreçlerinde öğrencilerin gördüğü üniversite logolarını düzenleyebilir, kendi logolarınızı yükleyebilir veya varsayılan resmi logolara sıfırlayabilirsiniz.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoManager(true)}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/30 border border-purple-400/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center space-x-2 shrink-0"
          >
            <Building2 className="w-4 h-4" />
            <span>Üniversite Logolarını Düzenle</span>
          </button>
        </div>
      </div>

      {/* SCHOOL & ACADEMIC YEAR CONFIGURATION */}
      <form onSubmit={handleSaveSettings} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Okul & Akademik Yıl Yapılandırması</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Okul adını, aktif akademik yılı ve hedef YKS sınav tarihini ayarlayın.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Okul Adı:</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-all"
              placeholder="Okul tam adını yazın..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Aktif Akademik Yıl:</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="2025 - 2026">2025 - 2026 Dönemi</option>
              <option value="2026 - 2027">2026 - 2027 Dönemi</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Hedef YKS Sınav Tarihi:</label>
            <input
              type="date"
              value={yksTargetDate}
              onChange={(e) => setYksTargetDate(e.target.value)}
              className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-all"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 border border-amber-400/40 transition-all cursor-pointer flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Okul Ayarlarını Kaydet</span>
          </button>
        </div>
      </form>

      {/* STUDENT ENGAGEMENT & ONLINE STATUS CRITERIA CONFIGURATION */}
      <form onSubmit={handleSaveCriteriaSettings} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Öğrenci Aktiflik Kriterleri & Çevrimiçi Ayarları</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Öğrencilerin aktif/pasif ayrımı kriterlerini, çevrimiçi algılanma süresini ve son görülme görünürlüğünü yapılandırın.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Değerlendirme Süresi (Gün):</label>
            <input
              type="number"
              min="1"
              max="90"
              value={activeCriteriaDays}
              onChange={(e) => setActiveCriteriaDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono"
              required
            />
            <span className="text-[10px] text-slate-400 block">Kriter için taranacak geriye dönük gün sayısı.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Min. Çözülen Soru Sayısı:</label>
            <input
              type="number"
              min="0"
              max="10000"
              value={activeCriteriaMinQuestions}
              onChange={(e) => setActiveCriteriaMinQuestions(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono"
              required
            />
            <span className="text-[10px] text-slate-400 block">Aktif sayılması için gereken asgari çözülen soru sayısı.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Min. Tamamlanan Plan:</label>
            <input
              type="number"
              min="0"
              max="50"
              value={activeCriteriaMinPlans}
              onChange={(e) => setActiveCriteriaMinPlans(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono"
              required
            />
            <span className="text-[10px] text-slate-400 block">Aktif sayılması için gereken tamamlanmış çalışma planı sayısı.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Çevrimiçi Timeout (Dakika):</label>
            <input
              type="number"
              min="1"
              max="60"
              value={onlineTimeoutMinutes}
              onChange={(e) => setOnlineTimeoutMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono"
              required
            />
            <span className="text-[10px] text-slate-400 block">Hareketsizlik durumunda çevrimdışı sayılma süresi.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Son Görülme Zamanı:</label>
            <select
              value={showLastSeenEnabled ? 'true' : 'false'}
              onChange={(e) => setShowLastSeenEnabled(e.target.value === 'true')}
              className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="true">Açık (Bugün saatini göster)</option>
              <option value="false">Kapalı (Sadece Çevrimdışı yaz)</option>
            </select>
            <span className="text-[10px] text-slate-400 block">Mesajlarda ve listede son çevrimiçi saatinin gösterimi.</span>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4 mt-4 space-y-5">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  Periyodik Heartbeat (Sunucuya Düzenli Aktiflik Bildirimi)
                  {presenceHeartbeatEnabled ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      Kapalı
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Kapatılırsa, çevrimiçi durumu sadece kullanıcı gerçek bir işlem yaptığında (veri kaydetme, vb.) güncellenir; süre boyunca hiçbir işlem yapılmazsa kullanıcı 'Çevrimiçi Zaman Aşımı' süresi sonunda otomatik çevrimdışı görünür.
                </p>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !presenceHeartbeatEnabled;
                    setPresenceHeartbeatEnabled(nextVal);
                    setPresenceHeartbeatEnabledState(nextVal);
                    setSettingsSaveMsg(`Periyodik Heartbeat durumu ${nextVal ? 'AKTİF' : 'KAPALI'} olarak güncellendi.`);
                    setTimeout(() => setSettingsSaveMsg(null), 4000);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    presenceHeartbeatEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      presenceHeartbeatEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {presenceHeartbeatEnabled && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-white">Heartbeat Aralığı (dakika)</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Sunucuya hangi sıklıkla aktiflik bildirimi (heartbeat) gönderileceğini belirler.
                  </p>
                </div>
                <div>
                  <select
                    value={presenceHeartbeatMinutes}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPresenceHeartbeatMinutes(val);
                      setPresenceHeartbeatMinutesState(val);
                      setSettingsSaveMsg(`Heartbeat aralığı ${val} dakika olarak güncellendi.`);
                      setTimeout(() => setSettingsSaveMsg(null), 4000);
                    }}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value={1}>1 Dakika</option>
                    <option value={2}>2 Dakika</option>
                    <option value={3}>3 Dakika</option>
                    <option value={5}>5 Dakika</option>
                    <option value={10}>10 Dakika</option>
                    <option value={15}>15 Dakika</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 border border-indigo-400/40 transition-all cursor-pointer flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Kriter ve Çevrimiçi Ayarlarını Kaydet</span>
          </button>
        </div>
      </form>

      {/* LOW DATA MODE (DÜŞÜK VERİ MODU) SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Düşük Veri Modu (Low Data Mode)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Firestore veritabanı kotalarından tasarruf etmek için yazma isteklerini batch/toplu halde gruplandıran tasarruf modunu yönetin.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                Düşük Veri Modu Durumu:
                {isLowDataModeActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    Aktif (Tasarruf Modu)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Devre Dışı (Gerçek Zamanlı)
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Bu mod etkinken; öğrenci verileri ve sistem logları seçilen aralık boyunca toplu (batch) olarak biriktirilip Firestore'a gönderilir. Siz kapatana kadar açık kalır.
              </p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  const nextState = !isLowDataModeActive;
                  setLowDataMode(nextState, nextState ? Date.now() : null);
                  setIsLowDataModeActive(nextState);
                  setSettingsSaveMsg(
                    nextState 
                      ? 'Düşük Veri Modu manuel olarak AKTİF edildi. Veri yazma sıklığı azaltıldı.' 
                      : 'Düşük Veri Modu manuel olarak DEVRE DIŞI bırakıldı. Gerçek zamanlı yazma etkinleştirildi.'
                  );
                  setTimeout(() => setSettingsSaveMsg(null), 4000);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isLowDataModeActive ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isLowDataModeActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 mt-4 space-y-3">
            <div>
              <h4 className="font-bold text-sm text-white">Sunucuya Gönderim Aralığı</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Düşük Veri Modu aktifken, tarayıcıdaki değişiklikler bu süre boyunca biriktirilip tek seferde sunucuya gönderilir. Aynı veri bu süre içinde birden fazla kez güncellenirse sadece en son hali gönderilir.
              </p>
            </div>
            <div>
              <select
                value={intervalMinutes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setIntervalMinutes(val);
                  setLowDataModeIntervalMinutes(val);
                  setSettingsSaveMsg(`Sunucuya gönderim aralığı ${val} dakika olarak güncellendi.`);
                  setTimeout(() => setSettingsSaveMsg(null), 4000);
                }}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
              >
                <option value={1}>1 Dakika</option>
                <option value={2}>2 Dakika</option>
                <option value={5}>5 Dakika</option>
                <option value={10}>10 Dakika</option>
                <option value={15}>15 Dakika</option>
                <option value={30}>30 Dakika</option>
                <option value={60}>60 Dakika</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* BACKUP & RESTORE DATA SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Otomatik Yedekleme & Sistem Veri Aktarımı</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tüm sistem verilerini JSON olarak bilgisayarınıza indirin veya önceden yedeklenmiş dosyayı geri yükleyin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-indigo-300">
              <Download className="w-5 h-5" />
              <h4 className="font-bold text-sm text-white">Sistem Verilerini Dışa Aktar (JSON Export)</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Öğrenci listeleri, rehberlik notları, çalışma planları ve AI konfigürasyonlarını içeren eksiksiz sistem yedeğini yerel sürücüye indirin.
            </p>
            <button
              type="button"
              onClick={handleExportSystemBackup}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sistem Yedeğini İndir (.json)</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-emerald-300">
              <Upload className="w-5 h-5" />
              <h4 className="font-bold text-sm text-white">Yedeklenmiş Dosyadan Geri Yükle (JSON Import)</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Daha önce indirdiğiniz JSON yedek dosyasını seçerek sistem ayarlarını ve veritabanı kayıtlarını güvenle yenileyin.
            </p>
            <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center space-x-2 border border-slate-700">
              <Upload className="w-3.5 h-3.5" />
              <span>Yedek Dosyası Seç (.json)</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      try {
                        const content = event.target?.result as string;
                        if (content) {
                          const parsed = JSON.parse(content);
                          const prepared = sanitizeAndPrepareForFirestore(parsed);
                          if (prepared.schoolName) {
                            setSchoolName(prepared.schoolName);
                            localStorage.setItem('school_name', prepared.schoolName);
                          }
                          if (prepared.academicYear) {
                            setAcademicYear(prepared.academicYear);
                            localStorage.setItem('academic_year', prepared.academicYear);
                          }
                          if (prepared.yksTargetDate) {
                            setYksTargetDate(prepared.yksTargetDate);
                            localStorage.setItem('yks_target_date', prepared.yksTargetDate);
                          }
                          await setDoc(doc(db, 'settings', 'school_config'), sanitizeAndPrepareForFirestore({
                            schoolName: prepared.schoolName || schoolName,
                            academicYear: prepared.academicYear || academicYear,
                            yksTargetDate: prepared.yksTargetDate || yksTargetDate
                          }), { merge: true });
                          setSettingsSaveMsg('Yedek dosyası doğrulandı, uzun veri alanları güvenle parçalandı ve veritabanı kayıtları güncellendi.');
                          setTimeout(() => setSettingsSaveMsg(null), 4000);
                        }
                      } catch (importErr) {
                        console.error('Failed to import backup JSON:', importErr);
                        setSettingsSaveMsg('Yedek dosyası okunamadı veya geçersiz JSON formatı.');
                        setTimeout(() => setSettingsSaveMsg(null), 4000);
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>

          {/* DEMO SEED CARD */}
          <div className="p-4 bg-slate-950 border border-indigo-500/20 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-indigo-300">
              <Sparkles className="w-5 h-5" />
              <h4 className="font-bold text-sm text-white">Örnek Kademe Öğrencilerini & Şubelerini Tazeleyin (Demo Seed)</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              9. Sınıf (Eren Aydın - Maarif), 10. Sınıf (Selin Yılmaz - Maarif), 11. Sınıf (Kerem Yıldız) ve Mezun (Mert Aksoy) örnek öğrenci ve şubelerini sisteme yeniden yükleyin. (Ahmet Yılmaz ve diğer kullanıcı verileri <strong className="text-emerald-400">kesinlikle korunur</strong>).
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Örnek ara sınıf (9, 10, 11) ve mezun kademe verilerini tazelemek istiyor musunuz? (Ahmet Yılmaz verisi korunur)')) {
                  try {
                    const event = new CustomEvent('yks_refresh_demo_students');
                    window.dispatchEvent(event);
                    setSettingsSaveMsg('Örnek kademe öğrencileri ve şubeleri başarıyla tazelendi.');
                    setTimeout(() => setSettingsSaveMsg(null), 4000);
                  } catch (e) {
                    console.error('Demo refresh error:', e);
                  }
                }
              }}
              className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center space-x-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Örnek Kademe Verilerini Yenile</span>
            </button>
          </div>
        </div>
      </div>

      {/* COUNSELOR ALERT & NOTIFICATION PREFERENCES */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Rehberlik Bildirim & Otomatik Uyarı Tercihleri</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Öğrencilerin çalışma disiplini ve yapay zeka harcama maliyetleri için otomatik sistem uyarıları.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
            <div className="space-y-0.5">
              <span className="font-bold text-white text-xs block">Günlük Rehberlik Rapor Bildirimi</span>
              <span className="text-[11px] text-slate-400 block">Her gün saat 18:00'de okul geneli etüt ve soru takip özet e-postası hazırlansın.</span>
            </div>
            <input
              type="checkbox"
              checked={dailyEmailNotify}
              onChange={(e) => setDailyEmailNotify(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
            <div className="space-y-0.5">
              <span className="font-bold text-white text-xs block">İnaktif Öğrenci Takip Uyarısı</span>
              <span className="text-[11px] text-slate-400 block">3 gün üst üste soru çözümü girmeyen öğrenciler için rehber öğretmen paneline kırmızı uyarı düşsün.</span>
            </div>
            <input
              type="checkbox"
              checked={inactiveStudentAlert}
              onChange={(e) => setInactiveStudentAlert(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
            <div className="space-y-0.5">
              <span className="font-bold text-white text-xs block">Kazanım Yetersizliği & Yüksek Hata Riski Uyarısı</span>
              <span className="text-[11px] text-slate-400 block">Bir konuda hata oranı %40'ın üzerine çıkan öğrenciler etüt çalışma listesine otomatik eklensin.</span>
            </div>
            <input
              type="checkbox"
              checked={highRiskTopicAlert}
              onChange={(e) => setHighRiskTopicAlert(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
