import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Target, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  requestBrowserNotificationPermission, 
  triggerBrowserNotification, 
  NotificationSettings 
} from '../../services/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [permissionState, setPermissionState] = useState<string>('default');
  const [testStatus, setTestStatus] = useState<{ state: 'idle' | 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(getNotificationSettings());
      if ('Notification' in window) {
        setPermissionState(Notification.permission);
      }
      setTestStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleBrowser = async () => {
    if (!settings.browserNotificationsEnabled) {
      const granted = await requestBrowserNotificationPermission();
      if (granted) {
        const updated = { ...settings, browserNotificationsEnabled: true };
        setSettings(updated);
        saveNotificationSettings(updated);
        setPermissionState('granted');
        setTestStatus({ state: 'success', message: 'Bildirim izni başarıyla verildi!' });
      } else {
        setPermissionState(Notification.permission);
        setTestStatus({ 
          state: 'error', 
          message: 'Tarayıcı veya Windows ayarlarından bildirim engellenmiş. Lütfen adres çubuğundaki kilit simgesine tıklayıp Bildirimler seçeneğini "İzin Ver" olarak değiştiriniz.' 
        });
      }
    } else {
      const updated = { ...settings, browserNotificationsEnabled: false };
      setSettings(updated);
      saveNotificationSettings(updated);
      setTestStatus(null);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleSendTestNotification = async () => {
    setTestStatus(null);
    const res = await triggerBrowserNotification(
      '🎯 YKS Akıllı Hatırlatıcı Testi',
      'Tebrikler! Masaüstü bildirim sisteminiz başarıyla aktif edildi ve çalışıyor. 🚀'
    );
    if (res.success) {
      setTestStatus({ 
        state: 'success', 
        message: 'Masaüstü bildirimi gönderildi ve zil sesi çalındı! (Eğer Windows ekranınızda görünmüyorsa Windows Odaklanma Yardımı veya Chrome bildirim izinlerini kontrol ediniz.)' 
      });
    } else {
      setTestStatus({ 
        state: 'error', 
        message: res.error || 'Bildirim gönderilemedi. Lütfen tarayıcı izinlerini kontrol ediniz.' 
      });
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[130] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl shadow-indigo-950/60 space-y-5 my-auto modal-dialog-card">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Akıllı Bildirim Ayarları</h3>
              <p className="text-xs text-slate-400">Hatırlatıcı tercihlerini kişiselleştirin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Push Master Card */}
        <div className="p-4 bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <div>
                <strong className="text-xs text-white block">Tarayıcı Masaüstü Bildirimleri</strong>
                <span className="text-[11px] text-slate-400">Uygulama açıkken veya arka plandayken bildirim gönder</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleBrowser}
              className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                settings.browserNotificationsEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
            <span className={`text-[11px] font-semibold flex items-center gap-1 ${
              permissionState === 'granted' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {permissionState === 'granted' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  İzin Verildi
                </>
              ) : permissionState === 'denied' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Tarayıcıda Engellenmiş
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  İzin Bekleniyor
                </>
              )}
            </span>
            <button
              type="button"
              onClick={handleSendTestNotification}
              className="px-3 py-1.5 bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-200 hover:text-white border border-indigo-400/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Bildirimi Gönder</span>
            </button>
          </div>

          {/* Test Status Banner */}
          {testStatus && (
            <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start space-x-2 animate-fade-in ${
              testStatus.state === 'success' 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}>
              {testStatus.state === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span>{testStatus.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Specific Notification Toggles */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
            Hatırlatma Kategorileri
          </label>

          {/* Rutinler */}
          <div 
            onClick={() => handleToggle('routineRemindersEnabled')}
            className="p-3 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <Target className="w-4 h-4 text-amber-400" />
              <div>
                <strong className="text-xs text-slate-200 block">Günlük Rutinler (Paragraf / Problem)</strong>
                <span className="text-[10px] text-slate-500">Tamamlanmayan rutinler için akşam hatırlatması</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.routineRemindersEnabled} 
              onChange={() => {}} 
              className="rounded accent-indigo-600 w-4 h-4"
            />
          </div>

          {/* Ders Görevleri */}
          <div 
            onClick={() => handleToggle('studyTaskRemindersEnabled')}
            className="p-3 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <div>
                <strong className="text-xs text-slate-200 block">Ders Programı Görevleri</strong>
                <span className="text-[10px] text-slate-500">Bugüne planlanan bekleyen çalışma görevleri</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.studyTaskRemindersEnabled} 
              onChange={() => {}} 
              className="rounded accent-indigo-600 w-4 h-4"
            />
          </div>

          {/* Hata Defteri */}
          <div 
            onClick={() => handleToggle('errorRemindersEnabled')}
            className="p-3 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <div>
                <strong className="text-xs text-slate-200 block">Hata Defteri & Tekrar Uyarıları</strong>
                <span className="text-[10px] text-slate-500">Pekiştirilmeyi bekleyen yanlış soru birikimi</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.errorRemindersEnabled} 
              onChange={() => {}} 
              className="rounded accent-indigo-600 w-4 h-4"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/30 cursor-pointer text-center"
          >
            Ayarları Kaydet & Kapat
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
