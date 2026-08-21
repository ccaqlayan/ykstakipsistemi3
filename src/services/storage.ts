import { AppGlobalState, YKSDataState } from '../types';
import { 
  DEMO_USERS, 
  DEMO_CLASSES,
  DEFAULT_PROGRAM_TEMPLATES,
  INITIAL_AUDIT_LOGS,
  INITIAL_MESSAGES
} from '../data/initialData';

const STORAGE_KEY = 'yks_kocluk_global_data_v5';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 gün (72 saat)
const LAST_ACTIVE_KEY = 'yks_last_active_time';

export const INITIAL_GLOBAL_STATE: AppGlobalState = {
  currentUser: null, // Site ilk açıldığında giriş yapma ekranının gösterilmesi için varsayılan null
  users: DEMO_USERS,
  classes: DEMO_CLASSES,
  studentsData: {},
  programTemplates: DEFAULT_PROGRAM_TEMPLATES,
  auditLogs: INITIAL_AUDIT_LOGS,
  messages: INITIAL_MESSAGES
};

export function loadGlobalState(): AppGlobalState {
  try {
    // Proactively scan for any lost/older/backup keys containing institutionalMockExams before clearing them
    let recoveredExams: any[] = [];
    try {
      const activeRaw = localStorage.getItem(STORAGE_KEY);
      const activeParsed = activeRaw ? JSON.parse(activeRaw) : null;
      if (!activeParsed || !activeParsed.institutionalMockExams || activeParsed.institutionalMockExams.length === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key !== STORAGE_KEY && (key.startsWith('yks_kocluk_global_data') || key.startsWith('yks_backup'))) {
            const val = localStorage.getItem(key);
            if (val && val.includes('institutionalMockExams')) {
              const p = JSON.parse(val);
              if (p && Array.isArray(p.institutionalMockExams) && p.institutionalMockExams.length > 0) {
                recoveredExams = p.institutionalMockExams;
                console.log(`[Recovery] Successfully found and recovered ${recoveredExams.length} institutional mock exams from old key: ${key}`);
                break;
              }
            }
          }
        }
      }
    } catch (recoverErr) {
      console.warn('[Recovery] Error checking for old key backups:', recoverErr);
    }

    clearDeprecatedStorageKeys();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState = { ...INITIAL_GLOBAL_STATE };
      if (recoveredExams.length > 0) {
        defaultState.institutionalMockExams = recoveredExams;
      }
      return defaultState;
    }
    const parsed = JSON.parse(raw);
    if (recoveredExams.length > 0 && (!parsed.institutionalMockExams || parsed.institutionalMockExams.length === 0)) {
      parsed.institutionalMockExams = recoveredExams;
    }
    
    // Oturum Süresi Kontrolü (Son Aktiviteden İtibaren 3 Gün)
    if (parsed.currentUser) {
      const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
      const now = Date.now();

      if (lastActiveStr) {
        const lastActiveTime = parseInt(lastActiveStr, 10);
        const elapsed = now - lastActiveTime;

        if (isNaN(lastActiveTime) || elapsed > THREE_DAYS_MS) {
          // 3 gün boyunca siteye girilmemişse oturumu kapat
          parsed.currentUser = null;
          localStorage.removeItem(LAST_ACTIVE_KEY);
          localStorage.removeItem('yks_remember_me');
          sessionStorage.removeItem('yks_session_active');
        } else {
          // 3 gün dolmamışsa oturumu açık tut ve son aktivite zamanını yenile
          localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
          localStorage.setItem('yks_remember_me', 'true');
          sessionStorage.setItem('yks_session_active', 'true');
        }
      } else {
        // Son aktivite kaydı yoksa mevcut zamanla başlat
        localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        localStorage.setItem('yks_remember_me', 'true');
        sessionStorage.setItem('yks_session_active', 'true');
      }
    }

    return {
      ...INITIAL_GLOBAL_STATE,
      ...parsed,
      users: (() => {
        const storedUsers = Array.isArray(parsed.users) ? parsed.users : [];
        const storedMap = new Map(storedUsers.map((u: any) => [u.id, u]));
        DEMO_USERS.forEach(du => {
          if (!storedMap.has(du.id)) {
            storedMap.set(du.id, du);
          }
        });
        return Array.from(storedMap.values());
      })(),
      classes: (() => {
        const storedClasses = Array.isArray(parsed.classes) ? parsed.classes : [];
        const classMap = new Map(storedClasses.map((c: any) => [c.id, c]));
        DEMO_CLASSES.forEach(dc => {
          if (!classMap.has(dc.id)) {
            classMap.set(dc.id, dc);
          }
        });
        return Array.from(classMap.values());
      })(),
      studentsData: parsed.studentsData || {},
      programTemplates: parsed.programTemplates && parsed.programTemplates.length > 0 
        ? parsed.programTemplates 
        : DEFAULT_PROGRAM_TEMPLATES,
      auditLogs: parsed.auditLogs && parsed.auditLogs.length > 0
        ? parsed.auditLogs
        : INITIAL_AUDIT_LOGS,
      messages: parsed.messages && Array.isArray(parsed.messages) && parsed.messages.length > 0
        ? parsed.messages
        : INITIAL_MESSAGES
    };
  } catch (err) {
    console.error('Failed to load global state from localStorage:', err);
    return INITIAL_GLOBAL_STATE;
  }
}

export function clearDeprecatedStorageKeys(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('yks_kocluk_global_data_v0') ||
        key.startsWith('yks_kocluk_global_data_v1') ||
        key.startsWith('yks_kocluk_global_data_v2') ||
        key.startsWith('yks_kocluk_global_data_v3') ||
        key.startsWith('yks_kocluk_global_data_v4') ||
        key.startsWith('yks_backup_')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (err) {
    // Ignore cleanup errors
  }
}

function createTrimmedGlobalState(state: AppGlobalState): any {
  // Trim heavy history data for local storage fallback
  // (Full dataset is safely maintained in Firestore)
  const trimmedStudentsData: Record<string, any> = {};
  if (state.studentsData) {
    for (const [stId, stVal] of Object.entries(state.studentsData)) {
      if (!stVal) continue;
      trimmedStudentsData[stId] = {
        ...stVal,
        questionLogs: Array.isArray(stVal.questionLogs) ? stVal.questionLogs.slice(-50) : [],
        branchExams: Array.isArray(stVal.branchExams) ? stVal.branchExams.slice(-30) : [],
        generalMocks: Array.isArray(stVal.generalMocks) ? stVal.generalMocks.slice(-30) : []
      };
    }
  }

  return {
    currentUser: state.currentUser,
    users: state.users,
    classes: state.classes,
    studentsData: trimmedStudentsData,
    programTemplates: state.programTemplates,
    auditLogs: Array.isArray(state.auditLogs) ? state.auditLogs.slice(0, 30) : [],
    messages: Array.isArray(state.messages) ? state.messages.slice(-50) : [],
    customRecommendations: state.customRecommendations
  };
}

export function saveGlobalState(state: AppGlobalState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // QuotaExceededError or storage error handling
    clearDeprecatedStorageKeys();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return;
    } catch (retryErr) {
      try {
        const trimmed = createTrimmedGlobalState(state);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        return;
      } catch (trimmedErr) {
        try {
          const minimal = {
            currentUser: state.currentUser,
            users: state.users,
            classes: state.classes
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
        } catch (minimalErr) {
          console.warn('[Storage] LocalStorage quota reached. Complete data is preserved in Firestore.');
        }
      }
    }
  }
}

export function resetToDefaultData(): AppGlobalState {
  saveGlobalState(INITIAL_GLOBAL_STATE);
  return INITIAL_GLOBAL_STATE;
}

export function exportDataAsJSON(data: any): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `YKS_Takip_Sistem_Yedegi_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDataFromJSON(file: File): Promise<AppGlobalState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.users || !parsed.classes) {
          throw new Error('Geçersiz yedek dosyası formatı. users veya classes alanı eksik.');
        }
        saveGlobalState(parsed);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsText(file);
  });
}

