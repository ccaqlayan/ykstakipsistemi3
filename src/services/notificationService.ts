import { DayOfWeek, RoutineItem, StudyPlanItem, TopicErrorItem } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'routine' | 'task' | 'error' | 'ai' | 'streak';
  timestamp: number;
  read: boolean;
  linkTab?: string;
}

export interface NotificationSettings {
  browserNotificationsEnabled: boolean;
  routineRemindersEnabled: boolean;
  studyTaskRemindersEnabled: boolean;
  errorRemindersEnabled: boolean;
  eveningReminderHour: number; // e.g. 17 (17:00)
  nightReminderHour: number; // e.g. 21 (21:00)
}

const SETTINGS_KEY = 'yks_notification_settings_v1';
const NOTIFICATIONS_STORAGE_KEY = 'yks_in_app_notifications_v1';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  browserNotificationsEnabled: false,
  routineRemindersEnabled: true,
  studyTaskRemindersEnabled: true,
  errorRemindersEnabled: true,
  eveningReminderHour: 17,
  nightReminderHour: 21
};

export function getNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Failed to parse notification settings', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save notification settings', e);
  }
}

export function getStoredInAppNotifications(): AppNotification[] {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse in-app notifications', e);
  }
  return [];
}

export function saveStoredInAppNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, 30)));
  } catch (e) {
    console.error('Failed to save in-app notifications', e);
  }
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    const isGranted = permission === 'granted';
    const current = getNotificationSettings();
    saveNotificationSettings({ ...current, browserNotificationsEnabled: isGranted });
    return isGranted;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return false;
  }
}

export function triggerBrowserNotification(title: string, body: string, icon = '🎯'): void {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } catch (e) {
      console.warn('Failed to send browser notification:', e);
    }
  }
}

// ── AKILLI HATIRLATICI DEĞERLENDİRME MOTORU ──
export function evaluateSmartReminders({
  routines = [],
  studyPlans = [],
  topicErrors = [],
  todayDay,
  currentNotifications = [],
  onAddNotification
}: {
  routines: RoutineItem[];
  studyPlans: StudyPlanItem[];
  topicErrors: TopicErrorItem[];
  todayDay: DayOfWeek;
  currentNotifications: AppNotification[];
  onAddNotification: (notif: AppNotification) => void;
}): void {
  const settings = getNotificationSettings();
  const now = new Date();
  const currentHour = now.getHours();
  const todayDateStr = now.toISOString().split('T')[0];

  const recentIds = new Set(currentNotifications.map(n => n.id));

  // 1. Günlük Rutin Hatırlatıcısı (Saat 16:00'dan sonra veya 20:00'den sonra)
  if (settings.routineRemindersEnabled && currentHour >= 16) {
    const pendingRoutines = routines.filter(r => !r.completedDays?.includes(todayDay));

    if (pendingRoutines.length > 0) {
      const reminderId = `routine-reminder-${todayDateStr}-${currentHour >= 20 ? 'night' : 'evening'}`;
      if (!recentIds.has(reminderId)) {
        const notif: AppNotification = {
          id: reminderId,
          title: '🎯 Günlük Rutinlerini Tamamla!',
          message: `Bugünkü ${pendingRoutines.map(r => r.title).slice(0, 2).join(', ')} rutinlerini henüz tamamlamadın. Serini korumak için şimdi tıkla!`,
          type: 'routine',
          timestamp: Date.now(),
          read: false,
          linkTab: 'routines'
        };
        onAddNotification(notif);
        if (settings.browserNotificationsEnabled) {
          triggerBrowserNotification(notif.title, notif.message);
        }
      }
    }
  }

  // 2. Ders Programı Görev Hatırlatıcısı (Bugüne ait tamamlanmamış görevler)
  if (settings.studyTaskRemindersEnabled && currentHour >= 14) {
    const todayPlans = studyPlans.filter(p => p.day === todayDay && p.status === 'pending');
    if (todayPlans.length > 0) {
      const reminderId = `task-reminder-${todayDateStr}`;
      if (!recentIds.has(reminderId)) {
        const notif: AppNotification = {
          id: reminderId,
          title: `📅 Bugün ${todayPlans.length} Görev Seni Bekliyor`,
          message: `${todayPlans.slice(0, 2).map(p => `${p.subject} (${p.topic})`).join(', ')} çalışmalarını tamamlayıp soru kaydını oluşturabilirsin.`,
          type: 'task',
          timestamp: Date.now(),
          read: false,
          linkTab: 'planner'
        };
        onAddNotification(notif);
        if (settings.browserNotificationsEnabled) {
          triggerBrowserNotification(notif.title, notif.message);
        }
      }
    }
  }

  // 3. Hata Defteri / Aralıklı Tekrar Bekleyen Yanlışlar
  if (settings.errorRemindersEnabled && currentHour >= 12) {
    const pendingErrors = topicErrors.filter(e => !e.revised);
    if (pendingErrors.length >= 3) {
      const reminderId = `error-reminder-${todayDateStr}`;
      if (!recentIds.has(reminderId)) {
        const notif: AppNotification = {
          id: reminderId,
          title: '🧠 Tekrar Bekleyen Hataların Var!',
          message: `Hata defterinde pekiştirilmeyi bekleyen ${pendingErrors.length} soru bulunuyor. Kalıcı öğrenme için mini bir tekrar testi çöz!`,
          type: 'error',
          timestamp: Date.now(),
          read: false,
          linkTab: 'errors'
        };
        onAddNotification(notif);
        if (settings.browserNotificationsEnabled) {
          triggerBrowserNotification(notif.title, notif.message);
        }
      }
    }
  }
}
