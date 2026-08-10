import { DashboardWidgetConfig, DEFAULT_DASHBOARD_WIDGETS } from '../DashboardCustomizeModal';

export const DSH_STORAGE_KEY = 'yks_dashboard_widget_config_v1';

export const mergeWidgetsWithDefaults = (savedWidgets: DashboardWidgetConfig[]): DashboardWidgetConfig[] => {
  if (!Array.isArray(savedWidgets) || savedWidgets.length === 0) return DEFAULT_DASHBOARD_WIDGETS;
  const merged = DEFAULT_DASHBOARD_WIDGETS.map(def => {
    const found = savedWidgets.find(p => p.id === def.id);
    const result = found ? { ...def, ...found } : { ...def };
    if (result.id === 'weekly_schedule') {
      result.category = 'header';
      if (found && found.category === 'content') {
        result.order = 5;
      }
    }
    if (result.id === 'quick_notes') {
      result.category = 'header';
      if (found && found.category === 'content') {
        result.order = 3;
      }
    }
    return result;
  });
  savedWidgets.forEach(p => {
    if (!merged.find(m => m.id === p.id)) {
      const result = { ...p };
      if (result.id === 'weekly_schedule') {
        result.category = 'header';
        result.order = 5;
      }
      if (result.id === 'quick_notes') {
        result.category = 'header';
        result.order = 3;
      }
      merged.push(result);
    }
  });
  merged.sort((a, b) => a.order - b.order);
  return merged;
};

export const ERROR_REASON_LABELS: Record<string, { label: string; color: string }> = {
  bilgi_eksigi: { label: 'Bilgi Eksikliği', color: '#f43f5e' }, // Rose
  dikkat_hatasi: { label: 'Dikkat / İşlem Hatası', color: '#f59e0b' }, // Amber
  zaman_yetmedi: { label: 'Süre Yetmedi', color: '#6366f1' }, // Indigo
  iki_sik_arasinda: { label: 'Çeldirici / İki Şık', color: '#8b5cf6' }, // Violet
  soru_kokunu_yanlis_okuma: { label: 'Soru Kökü Okuma', color: '#06b6d4' } // Cyan
};
