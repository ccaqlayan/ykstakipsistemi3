import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
  arrayUnion,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppGlobalState, UserAccount, ClassDefinition, YKSDataState, RecommendedChannel, RecommendedBook, DirectMessage, AuditLogItem, InstitutionalMockExam, QuestionLog } from '../types';
import { INITIAL_GLOBAL_STATE, loadGlobalState } from './storage';
import { INITIAL_STATE } from '../data/initialData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const firestoreSettings = {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
};

function initDb() {
  try {
    return firebaseConfig.firestoreDatabaseId
      ? initializeFirestore(app, firestoreSettings, firebaseConfig.firestoreDatabaseId)
      : initializeFirestore(app, firestoreSettings);
  } catch (err) {
    console.warn('Firestore kalıcı önbellek başlatılamadı, standart moda geçiliyor:', err);
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const db = initDb();

// Firestore Collections
const USERS_COL = 'users';
const CLASSES_COL = 'classes';
const STUDENTS_DATA_COL = 'studentsData';
const MESSAGES_COL = 'messages';

// Quota and Error Tracking
let onQuotaErrorCallback: ((hasError: boolean) => void) | null = null;
let isQuotaExceeded = false;

// Low Data Mode (Düşük Veri Modu) Setup
let lowDataMode = localStorage.getItem('yks_low_data_mode') === 'true';
let lowDataModeActivationTime = localStorage.getItem('yks_low_data_mode_time')
  ? Number(localStorage.getItem('yks_low_data_mode_time'))
  : null;
let lowDataModeIntervalMinutes: number = localStorage.getItem('yks_low_data_mode_interval_minutes') ? Number(localStorage.getItem('yks_low_data_mode_interval_minutes')) : 5;
let onLowDataModeChangeCallback: ((active: boolean) => void) | null = null;

export function getLowDataMode(): boolean {
  return lowDataMode;
}

export function getLowDataModeActivationTime(): number | null {
  return lowDataModeActivationTime;
}

export function getLowDataModeIntervalMinutes(): number {
  return lowDataModeIntervalMinutes;
}

export function setLowDataModeIntervalMinutes(minutes: number): void {
  lowDataModeIntervalMinutes = minutes;
  localStorage.setItem('yks_low_data_mode_interval_minutes', String(minutes));
  setDoc(doc(db, 'settings', 'school_config'), { lowDataModeIntervalMinutes: minutes }, { merge: true })
    .catch(err => console.warn('Could not write interval to Firestore:', err));
}

export function setLowDataMode(active: boolean, activationTime: number | null = null) {
  lowDataMode = active;
  if (active) {
    lowDataModeActivationTime = activationTime || Date.now();
    localStorage.setItem('yks_low_data_mode', 'true');
    localStorage.setItem('yks_low_data_mode_time', String(lowDataModeActivationTime));
  } else {
    lowDataModeActivationTime = null;
    localStorage.removeItem('yks_low_data_mode');
    localStorage.removeItem('yks_low_data_mode_time');
  }
  
  // Also persist to settings document in Firestore if possible
  try {
    setDoc(doc(db, 'settings', 'school_config'), { lowDataMode: active }, { merge: true })
      .catch(err => console.warn('Could not write Low Data Mode to Firestore (expected if quota exceeded):', err));
  } catch (err) {
    console.warn('Could not save Low Data Mode to Firestore settings:', err);
  }

  if (onLowDataModeChangeCallback) {
    onLowDataModeChangeCallback(active);
  }
}

export function onLowDataModeChange(callback: (active: boolean) => void) {
  onLowDataModeChangeCallback = callback;
  callback(lowDataMode);
}

// Helper to check if current TRT (UTC+3) has passed the next 10:00 AM reset
export function getNext10AmTrt(activationTimeMs: number): number {
  const trtOffsetMs = 3 * 60 * 60 * 1000;
  const trtDate = new Date(activationTimeMs + trtOffsetMs);
  
  // Build 10:00 AM TRT date on the same day
  const targetTrtDate = new Date(trtDate);
  targetTrtDate.setUTCHours(10, 0, 0, 0);
  
  let targetTimeMs = targetTrtDate.getTime() - trtOffsetMs;
  if (activationTimeMs >= targetTimeMs) {
    // If activation was at or after 10:00 AM, the next reset is 10:00 AM tomorrow
    targetTimeMs += 24 * 60 * 60 * 1000;
  }
  return targetTimeMs;
}

export function checkAndResetLowDataMode() {
  if (!lowDataMode || !lowDataModeActivationTime) return;
  
  const now = Date.now();
  const resetTime = getNext10AmTrt(lowDataModeActivationTime);
  
  if (now >= resetTime) {
    console.log('Deactivating Low Data Mode automatically at 10:00 AM Turkey Time.');
    setLowDataMode(false);
  }
}

// Note: Auto-reset of low data mode at 10:00 AM has been disabled per user request.

export function onQuotaError(callback: (hasError: boolean) => void) {
  onQuotaErrorCallback = callback;
  if (isQuotaExceeded) {
    callback(true);
  }
}

export function handleFirebaseError(err: any) {
  const errStr = String(err);
  if (
    errStr.includes('resource-exhausted') || 
    errStr.includes('Quota limit exceeded') || 
    (err && (err.code === 'resource-exhausted' || err.code === '8' || err.code === 'resource_exhausted' || err.code === 8))
  ) {
    if (!isQuotaExceeded) {
      isQuotaExceeded = true;
      console.warn('Firebase Quota Limit Detected. Entering offline local session mode.');
      if (onQuotaErrorCallback) {
        onQuotaErrorCallback(true);
      }
    }
    if (!lowDataMode) {
      setLowDataMode(true, Date.now());
      console.warn('Firebase quota exceeded. Automatically activated Low Data Mode.');
    }
  }
}

/**
 * Migration v3: student-1 questionLogs'u son 30 güne yayılmış yeni verilerle günceller.
 * Bir kez çalışır — meta/migrations/questionlogs_v3 marker ile izlenir.
 */
export async function migrateStudentQuestionLogs() {
  try {
    // Migration daha önce yapıldıysa atla
    const markerRef = doc(db, 'meta', 'migrations');
    const markerSnap = await getDoc(markerRef);
    if (markerSnap.exists() && markerSnap.data()?.questionlogs_v3 === true) {
      return;
    }

    console.log('[Migration v3] Running questionLogs migration for student-1...');
    const student1Ref = doc(db, STUDENTS_DATA_COL, 'student-1');
    const student1Snap = await getDoc(student1Ref);

    if (student1Snap.exists()) {
      const data = student1Snap.data();
      const cleanLogs = sanitizeAndPrepareForFirestore(INITIAL_STATE.questionLogs);
      await setDoc(student1Ref, { ...data, questionLogs: cleanLogs }, { merge: false });
      console.log('[Migration v3] student-1 questionLogs updated successfully.');
    }

    // student-4 de güncelle (Burak ÇAKIR)
    const student4Ref = doc(db, STUDENTS_DATA_COL, 'student-4');
    const student4Snap = await getDoc(student4Ref);
    if (student4Snap.exists()) {
      const data4 = student4Snap.data();
      const cleanLogs4 = sanitizeAndPrepareForFirestore(INITIAL_STATE.questionLogs);
      await setDoc(student4Ref, { ...data4, questionLogs: cleanLogs4 }, { merge: false });
      console.log('[Migration v3] student-4 questionLogs updated successfully.');
    }

    // Marker'ı kaydet — bir daha çalışmasın
    await setDoc(markerRef, { questionlogs_v3: true, migratedAt: new Date().toISOString() }, { merge: true });
    console.log('[Migration v3] Migration marker written. Done.');
  } catch (err) {
    console.warn('[Migration v3] migrateStudentQuestionLogs error:', err);
  }
}

export async function seedInitialFirestoreData() {
  try {
    // Her zaman migration kontrolü yap (seed marker'a bakmaksızın)
    await migrateStudentQuestionLogs();

    // Hafif "seed marker" kontrolü — tüm koleksiyonları taramak yerine TEK bir doküman oku
    const seedMarkerRef = doc(db, 'meta', 'seed_status');
    const seedMarkerSnap = await getDoc(seedMarkerRef);
    
    if (seedMarkerSnap.exists() && seedMarkerSnap.data()?.seeded === true) {
      // Zaten seed edilmiş, ağır koleksiyon taramalarını atla
      return;
    }

    const studentsSnap = await getDocs(collection(db, STUDENTS_DATA_COL));
    if (studentsSnap.empty) {
      for (const [stId, stData] of Object.entries(INITIAL_GLOBAL_STATE.studentsData)) {
        await setDoc(doc(db, STUDENTS_DATA_COL, stId), stData);
      }
    } else {
      const student1Doc = studentsSnap.docs.find(d => d.id === 'student-1');
      if (student1Doc) {
        const data = student1Doc.data() as YKSDataState;
        const needsBranchUpdate = !data.branchExams || data.branchExams.length < INITIAL_STATE.branchExams.length;
        const needsGeneralUpdate = !data.generalMocks || data.generalMocks.length < INITIAL_STATE.generalMocks.length || data.generalMocks[2]?.tyt?.totalNet === 87.5;
        const needsQuestionLogUpdate = !data.questionLogs || data.questionLogs.length < INITIAL_STATE.questionLogs.length || data.questionLogs.some(l => l.date && l.date.startsWith('2026-06-'));
        
        let finalSt1Data = data;
        if (needsBranchUpdate || needsGeneralUpdate || needsQuestionLogUpdate) {
          finalSt1Data = {
            ...data,
            branchExams: needsBranchUpdate ? INITIAL_STATE.branchExams : data.branchExams,
            generalMocks: needsGeneralUpdate ? INITIAL_STATE.generalMocks : data.generalMocks,
            questionLogs: needsQuestionLogUpdate ? INITIAL_STATE.questionLogs : data.questionLogs
          };
          await setDoc(doc(db, STUDENTS_DATA_COL, 'student-1'), finalSt1Data, { merge: true });
        }

        // Kopyalama / Yedekleme: student-1 (Ahmet Yılmaz) verilerini student-4 (Burak ÇAKIR) hesabına sadece yoksa kopyala
        const student4Doc = studentsSnap.docs.find(d => d.id === 'student-4');
        if (!student4Doc) {
          const student4Data: YKSDataState = {
            ...finalSt1Data,
            profile: {
              ...finalSt1Data.profile,
              name: 'Burak ÇAKIR'
            }
          };
          await setDoc(doc(db, STUDENTS_DATA_COL, 'student-4'), student4Data);
        }
      }
    }

    const usersSnap = await getDocs(collection(db, USERS_COL));
    if (usersSnap.empty) {
      console.log('Seeding initial users to Firestore...');
      for (const u of INITIAL_GLOBAL_STATE.users) {
        await setDoc(doc(db, USERS_COL, u.id), u);
      }
    } else {
      // Burak ÇAKIR (student-4) kullanıcısının Firestore'da olduğundan emin ol
      const hasStudent4 = usersSnap.docs.some(d => d.id === 'student-4');
      if (!hasStudent4) {
        const burakUser = INITIAL_GLOBAL_STATE.users.find(u => u.id === 'student-4');
        if (burakUser) {
          await setDoc(doc(db, USERS_COL, 'student-4'), burakUser);
        }
      }
    }

    const classesSnap = await getDocs(collection(db, CLASSES_COL));
    if (classesSnap.empty) {
      console.log('Seeding initial classes to Firestore...');
      for (const c of INITIAL_GLOBAL_STATE.classes) {
        await setDoc(doc(db, CLASSES_COL, c.id), c);
      }
    }

    const messagesSnap = await getDocs(collection(db, MESSAGES_COL));
    if (messagesSnap.empty && INITIAL_GLOBAL_STATE.messages) {
      console.log('Seeding initial messages to Firestore...');
      for (const msg of INITIAL_GLOBAL_STATE.messages) {
        await setDoc(doc(db, MESSAGES_COL, msg.id), msg);
      }
    }

    // One-time clear of audit logs in Firestore as requested by the user
    const markerDocRef = doc(db, 'auditLogs', '_clear_marker_v1');
    const logsSnap = await getDocs(collection(db, 'auditLogs'));
    const hasMarker = logsSnap.docs.some(d => d.id === '_clear_marker_v1');
    if (!hasMarker) {
      console.log('One-time audit log reset: clearing collection...');
      for (const d of logsSnap.docs) {
        await deleteDoc(doc(db, 'auditLogs', d.id));
      }
      await setDoc(markerDocRef, { clearedAt: new Date().toISOString() });
    }

    await setDoc(seedMarkerRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Error seeding initial Firestore data:', err);
  }
}

/**
 * Real-time subscription to all Firestore collections (Users, Classes, Student Performance Data, Recommendations, Messages)
 */
export function subscribeToFirestore(
  onDataChange: (data: { 
    users: UserAccount[]; 
    classes: ClassDefinition[]; 
    customRecommendations: { channels: RecommendedChannel[]; books: RecommendedBook[] };
  }) => void
) {
  let currentUsers: UserAccount[] = [];
  let currentClasses: ClassDefinition[] = [];
  let currentRecommendations: { channels: RecommendedChannel[]; books: RecommendedBook[] } = { channels: [], books: [] };

  const notify = () => {
    onDataChange({
      users: currentUsers.length > 0 ? currentUsers : INITIAL_GLOBAL_STATE.users,
      classes: currentClasses.length > 0 ? currentClasses : INITIAL_GLOBAL_STATE.classes,
      customRecommendations: currentRecommendations
    });
  };

  // 1. Listen to Users
  const unsubUsers = onSnapshot(collection(db, USERS_COL), (snapshot) => {
    const users: UserAccount[] = [];
    snapshot.forEach((doc) => {
      users.push(reassembleDataFromFirestore(doc.data()) as UserAccount);
    });
    currentUsers = users;
    notify();
  }, (err) => {
    console.error('Firestore users subscription error:', err);
    handleFirebaseError(err);
  });

  // 2. Listen to Classes
  const unsubClasses = onSnapshot(collection(db, CLASSES_COL), (snapshot) => {
    const classes: ClassDefinition[] = [];
    snapshot.forEach((doc) => {
      classes.push(reassembleDataFromFirestore(doc.data()) as ClassDefinition);
    });
    currentClasses = classes;
    notify();
  }, (err) => {
    console.error('Firestore classes subscription error:', err);
    handleFirebaseError(err);
  });

  // 4. Listen to Recommendations
  const unsubRecommendations = onSnapshot(collection(db, 'recommendations'), (snapshot) => {
    const channels: RecommendedChannel[] = [];
    const books: RecommendedBook[] = [];
    snapshot.forEach((doc) => {
      const data = reassembleDataFromFirestore(doc.data());
      if (data.type === 'channel') {
        channels.push({ id: doc.id, ...data } as any);
      } else if (data.type === 'book') {
        books.push({ id: doc.id, ...data } as any);
      }
    });
    currentRecommendations = { channels, books };
    notify();
  }, (err) => {
    console.error('Firestore recommendations subscription error:', err);
    handleFirebaseError(err);
  });

  // 7. Listen to Global Settings
  const unsubSettings = onSnapshot(doc(db, 'settings', 'school_config'), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.schoolName) {
        localStorage.setItem('school_name', data.schoolName);
      }
      if (data.academicYear) {
        localStorage.setItem('academic_year', data.academicYear);
      }
      if (data.yksTargetDate) {
        localStorage.setItem('yks_target_date', data.yksTargetDate);
      }
      if (data.activeCriteriaDays !== undefined) {
        localStorage.setItem('active_criteria_days', String(data.activeCriteriaDays));
      }
      if (data.activeCriteriaMinQuestions !== undefined) {
        localStorage.setItem('active_criteria_min_questions', String(data.activeCriteriaMinQuestions));
      }
      if (data.activeCriteriaMinPlans !== undefined) {
        localStorage.setItem('active_criteria_min_plans', String(data.activeCriteriaMinPlans));
      }
      if (data.onlineTimeoutMinutes !== undefined) {
        localStorage.setItem('online_timeout_minutes', String(data.onlineTimeoutMinutes));
      }
      if (data.showLastSeenEnabled !== undefined) {
        localStorage.setItem('show_last_seen_enabled', String(data.showLastSeenEnabled));
      }
      if (data.lowDataMode !== undefined) {
        const nextLowData = !!data.lowDataMode;
        if (nextLowData !== lowDataMode) {
          setLowDataMode(nextLowData);
        }
      }
      if (data.lowDataModeIntervalMinutes !== undefined) {
        lowDataModeIntervalMinutes = data.lowDataModeIntervalMinutes;
        localStorage.setItem('yks_low_data_mode_interval_minutes', String(data.lowDataModeIntervalMinutes));
      }
      if (data.presenceHeartbeatMinutes !== undefined) {
        presenceHeartbeatMinutes = data.presenceHeartbeatMinutes;
        localStorage.setItem('presence_heartbeat_minutes', String(data.presenceHeartbeatMinutes));
      }
      if (data.presenceHeartbeatEnabled !== undefined) {
        presenceHeartbeatEnabled = data.presenceHeartbeatEnabled;
        localStorage.setItem('presence_heartbeat_enabled', String(data.presenceHeartbeatEnabled));
      }
      if (data.maintenanceMode !== undefined) {
        localStorage.setItem('maintenance_mode', String(data.maintenanceMode));
      }
      if (data.maintenanceMessage !== undefined) {
        localStorage.setItem('maintenance_message', data.maintenanceMessage);
      }
      if (data.maintenanceEndTime !== undefined) {
        localStorage.setItem('maintenance_end_time', data.maintenanceEndTime);
      }
      if (data.maintenanceAllowTeachers !== undefined) {
        localStorage.setItem('maintenance_allow_teachers', String(data.maintenanceAllowTeachers));
      }
      // Dispatch a custom event so components can listen to setting updates reactively
      window.dispatchEvent(new Event('yks_settings_updated'));
    }
  }, (err) => {
    console.error('Firestore settings subscription error:', err);
    handleFirebaseError(err);
  });

  // Return unsubscribe function
  return () => {
    unsubUsers();
    unsubClasses();
    unsubRecommendations();
    unsubSettings();
  };
}

export function subscribeToMessages(onChange: (messages: DirectMessage[]) => void) {
  return onSnapshot(collection(db, MESSAGES_COL), (snapshot) => {
    const messages: DirectMessage[] = [];
    snapshot.forEach((docSnap) => {
      messages.push(reassembleDataFromFirestore(docSnap.data()) as DirectMessage);
    });
    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    onChange(messages);
  }, (err) => {
    console.error('Firestore messages subscription error:', err);
    handleFirebaseError(err);
  });
}

export function subscribeToInstitutionalMockExams(onChange: (exams: InstitutionalMockExam[]) => void) {
  let hasAutoSeeded = false;
  return onSnapshot(collection(db, 'institutional_mock_exams'), (snapshot) => {
    const exams: InstitutionalMockExam[] = [];
    snapshot.forEach((docSnap) => {
      exams.push(reassembleDataFromFirestore(docSnap.data()) as InstitutionalMockExam);
    });
    exams.sort((a, b) => new Date(b.createdAt || b.examDate || 0).getTime() - new Date(a.createdAt || a.examDate || 0).getTime());

    if (snapshot.empty && !hasAutoSeeded) {
      hasAutoSeeded = true;
      try {
        if (localStorage.getItem('yks_exempt_auto_seed') === 'true') {
          console.log('Auto-seeding of institutional exams is bypassed because they were explicitly deleted.');
        } else {
          const loadedState = loadGlobalState();
          const localExams = loadedState?.institutionalMockExams || [];
          if (localExams.length > 0) {
            console.log(`Auto-seeding ${localExams.length} institutional mock exams to Firestore...`);
            saveBulkInstitutionalExamsToFirestore(localExams);
          }
        }
      } catch (err) {
        console.error('Error loading or auto-seeding local exams to Firestore:', err);
      }
    }

    onChange(exams);
  }, (err) => {
    console.error('Firestore institutional_mock_exams subscription error:', err);
    handleFirebaseError(err);
  });
}

/**
 * Audit loglarını sadece ihtiyacı olan roller için, limitli ve sıralı şekilde dinler.
 * (Öğrenci rolü audit log görmediği için bu fonksiyon öğrenciler için hiç çağrılmamalı.)
 */
export function subscribeToAuditLogs(
  onChange: (logs: AuditLogItem[]) => void,
  maxLogs: number = 500
) {
  const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(maxLogs));
  return onSnapshot(q, (snapshot) => {
    const logs: AuditLogItem[] = [];
    snapshot.forEach((docSnap) => {
      logs.push(reassembleDataFromFirestore(docSnap.data()) as AuditLogItem);
    });
    onChange(logs);
  }, (err) => {
    console.error('Firestore auditLogs subscription error:', err);
    handleFirebaseError(err);
  });
}

const enrichQuestionLogs = (logs: QuestionLog[]) => {
  if (!logs) return INITIAL_STATE.questionLogs;
  return logs.map((log) => {
    const initialMatch = INITIAL_STATE.questionLogs.find(iLog => iLog.id === log.id || (iLog.date === log.date && iLog.subject === log.subject));
    const topic = log.topic || initialMatch?.topic || log.notes || 'Genel Soru Çözümü';
    if (log.durationMinutes && log.durationMinutes > 0) {
      return { ...log, topic };
    }
    if (initialMatch?.durationMinutes && initialMatch.durationMinutes > 0) {
      return { ...log, topic, durationMinutes: initialMatch.durationMinutes };
    }
    const solved = log.solvedCount || 30;
    let factor = 1.2;
    if (log.subject?.includes('Matematik')) factor = 1.4;
    else if (log.subject?.includes('Paragraf') || log.subject?.includes('Türkçe')) factor = 0.8;
    else if (log.subject?.includes('Fizik') || log.subject?.includes('Geometri')) factor = 1.3;
    return { ...log, topic, durationMinutes: Math.max(1, Math.round(solved * factor)) };
  });
};

/**
 * Öğretmen/Rehber/Admin rolleri için: TÜM öğrencilerin verisini gerçek zamanlı dinler.
 * (Öğrenci rolü için KULLANILMAMALI — bkz. subscribeToSingleStudentData)
 */
export function subscribeToAllStudentsData(
  onChange: (dataMap: Record<string, YKSDataState>) => void
) {
  return onSnapshot(collection(db, STUDENTS_DATA_COL), (snapshot) => {
    const dataMap: Record<string, YKSDataState> = {};
    snapshot.forEach((docSnap) => {
      const parsed = reassembleDataFromFirestore(docSnap.data()) as YKSDataState;
      if (parsed) {
        parsed.questionLogs = enrichQuestionLogs(parsed.questionLogs);
      }
      dataMap[docSnap.id] = parsed;
    });

    // Ensure demo students have full fallback data
    Object.entries(INITIAL_GLOBAL_STATE.studentsData).forEach(([demoId, demoState]) => {
      if (!dataMap[demoId]) {
        dataMap[demoId] = demoState;
      }
    });

    if (dataMap['student-1']) {
      const st1 = dataMap['student-1'];
      const needsBranch = !st1.branchExams || st1.branchExams.length < INITIAL_STATE.branchExams.length;
      const needsGeneral = !st1.generalMocks || st1.generalMocks.length < INITIAL_STATE.generalMocks.length || st1.generalMocks[2]?.tyt?.totalNet === 87.5;
      const needsQuestions = !st1.questionLogs || st1.questionLogs.length < INITIAL_STATE.questionLogs.length;

      if (needsBranch || needsGeneral || needsQuestions) {
        dataMap['student-1'] = {
          ...st1,
          questionLogs: needsQuestions ? INITIAL_STATE.questionLogs : st1.questionLogs,
          branchExams: needsBranch ? INITIAL_STATE.branchExams : st1.branchExams,
          generalMocks: needsGeneral ? INITIAL_STATE.generalMocks : st1.generalMocks
        };
      }
    }

    onChange(Object.keys(dataMap).length > 0 ? dataMap : INITIAL_GLOBAL_STATE.studentsData);
  }, (err) => {
    console.error('Firestore studentsData subscription error:', err);
    handleFirebaseError(err);
  });
}

/**
 * Öğrenci rolü için: SADECE kendi dokümanını gerçek zamanlı dinler (tek doküman, tüm koleksiyon değil).
 */
export function subscribeToSingleStudentData(
  studentId: string,
  onChange: (data: YKSDataState | null) => void
) {
  return onSnapshot(doc(db, STUDENTS_DATA_COL, studentId), (docSnap) => {
    if (!docSnap.exists()) {
      onChange(null);
      return;
    }
    let data = reassembleDataFromFirestore(docSnap.data()) as YKSDataState;

    if (data) {
      data = {
        ...data,
        questionLogs: enrichQuestionLogs(data.questionLogs)
      };
    }

    if (studentId === 'student-1') {
      const needsBranch = !data.branchExams || data.branchExams.length < INITIAL_STATE.branchExams.length;
      const needsGeneral = !data.generalMocks || data.generalMocks.length < INITIAL_STATE.generalMocks.length || data.generalMocks[2]?.tyt?.totalNet === 87.5;
      if (needsBranch || needsGeneral) {
        data = {
          ...data,
          branchExams: needsBranch ? INITIAL_STATE.branchExams : data.branchExams,
          generalMocks: needsGeneral ? INITIAL_STATE.generalMocks : data.generalMocks
        };
      }
    }

    onChange(data);
  }, (err) => {
    console.error('Firestore single studentData subscription error:', err);
    handleFirebaseError(err);
  });
}

/**
 * UTF-8 byte length calculation
 */
export function getUtf8ByteLength(str: string): number {
  if (!str) return 0;
  return new TextEncoder().encode(str).length;
}

/**
 * Splits a string into chunks where each chunk's UTF-8 byte length is at most maxBytes (default 1300 bytes,
 * safely below Firestore's ~1400/1500 byte single-field index limit).
 */
export function chunkStringByBytes(str: string, maxBytes: number = 1300): string[] {
  if (!str) return [];
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  if (bytes.length <= maxBytes) return [str];

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let start = 0;

  while (start < bytes.length) {
    let end = Math.min(start + maxBytes, bytes.length);
    // Move end backward if we land on a UTF-8 continuation byte (0x80 to 0xBF)
    while (end > start && (bytes[end] & 0xC0) === 0x80) {
      end--;
    }
    if (end === start) {
      end = start + 1;
      while (end < bytes.length && (bytes[end] & 0xC0) === 0x80) {
        end++;
      }
    }
    const chunkBytes = bytes.subarray(start, end);
    chunks.push(decoder.decode(chunkBytes));
    start = end;
  }

  return chunks;
}

/**
 * Recursively prepares any object or data structure for Firestore:
 * - Replaces undefined with null
 * - Splits any string exceeding 1400 bytes into a chunked map object { __chunkedString: true, chunks: [...] }
 */
export function sanitizeAndPrepareForFirestore<T>(data: T, maxBytes: number = 1300): T {
  if (data === undefined || data === null) {
    return null as any;
  }

  if (typeof data === 'string') {
    if (getUtf8ByteLength(data) > 1400) {
      return {
        __chunkedString: true,
        chunks: chunkStringByBytes(data, maxBytes)
      } as any;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeAndPrepareForFirestore(item, maxBytes)) as any;
  }

  if (typeof data === 'object') {
    if (data instanceof Date) return data;

    if ((data as any).__chunkedString === true && Array.isArray((data as any).chunks)) {
      return data;
    }

    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      const val = (data as any)[key];
      if (val !== undefined) {
        cleaned[key] = sanitizeAndPrepareForFirestore(val, maxBytes);
      }
    }
    return cleaned;
  }

  return data;
}

/**
 * Sanitizes an object to be compatible with Firestore by recursively
 * replacing any undefined values with null and chunking strings > 1400 bytes.
 */
export function sanitizeForFirestore<T>(data: T): T {
  return sanitizeAndPrepareForFirestore(data);
}

/**
 * Recursively reassembles data read from Firestore:
 * Reconstructs any { __chunkedString: true, chunks: [...] } maps back into a unified string.
 */
export function reassembleDataFromFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'object') {
    if ((data as any).__chunkedString === true && Array.isArray((data as any).chunks)) {
      return (data as any).chunks.join('') as any;
    }

    if (Array.isArray(data)) {
      return data.map(item => reassembleDataFromFirestore(item)) as any;
    }

    if (data instanceof Date) return data;

    const result: any = {};
    for (const key of Object.keys(data)) {
      result[key] = reassembleDataFromFirestore((data as any)[key]);
    }
    return result;
  }

  return data;
}

/**
 * Save single institutional exam to Firestore
 */
export async function saveInstitutionalExamToFirestore(exam: InstitutionalMockExam) {
  try {
    if (!exam || !exam.id) return;
    const sanitized = sanitizeForFirestore(exam);
    await setDoc(doc(db, 'institutional_mock_exams', exam.id), sanitized, { merge: true });
  } catch (err) {
    console.error('Error saving institutional exam to Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Save bulk institutional exams to Firestore using batching
 */
export async function saveBulkInstitutionalExamsToFirestore(exams: InstitutionalMockExam[]) {
  try {
    if (!exams || exams.length === 0) return;
    const BATCH_SIZE = 400;
    for (let i = 0; i < exams.length; i += BATCH_SIZE) {
      const chunk = exams.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(exam => {
        if (exam && exam.id) {
          const ref = doc(db, 'institutional_mock_exams', exam.id);
          const sanitized = sanitizeForFirestore(exam);
          batch.set(ref, sanitized, { merge: true });
        }
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Error saving bulk institutional exams to Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Delete institutional exam from Firestore
 */
export async function deleteInstitutionalExamFromFirestore(examId: string) {
  try {
    if (!examId) return;
    await deleteDoc(doc(db, 'institutional_mock_exams', examId));
  } catch (err) {
    console.error('Error deleting institutional exam from Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Delete all institutional mock exams and clear institutionalMocks in all students' documents in Firestore
 */
export async function deleteAllInstitutionalExamsFromFirestore() {
  try {
    // 1. Delete all documents in institutional_mock_exams collection
    const querySnapshot = await getDocs(collection(db, 'institutional_mock_exams'));
    if (!querySnapshot.empty) {
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      console.log('Successfully deleted all documents from institutional_mock_exams collection.');
    }

    // 2. Clear institutionalMocks for all student profiles in students_data collection
    const studentsSnapshot = await getDocs(collection(db, STUDENTS_DATA_COL));
    if (!studentsSnapshot.empty) {
      const batch = writeBatch(db);
      studentsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.institutionalMocks && data.institutionalMocks.length > 0) {
          batch.update(docSnap.ref, { institutionalMocks: [] });
        }
      });
      await batch.commit();
      console.log('Successfully cleared institutionalMocks array for all student documents.');
    }
  } catch (err) {
    console.error('Error executing complete institutional exams wipe in Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Subscribe to custom recommendations in Firestore
 */
export function subscribeToRecommendations(
  onChange: (data: { channels: RecommendedChannel[]; books: RecommendedBook[] }) => void
) {
  return onSnapshot(collection(db, 'recommendations'), (snapshot) => {
    const channels: RecommendedChannel[] = [];
    const books: RecommendedBook[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      if (data.type === 'channel') {
        channels.push(data as RecommendedChannel);
      } else if (data.type === 'book') {
        books.push(data as RecommendedBook);
      }
    });
    onChange({ channels, books });
  }, (err) => {
    console.error('Firestore recommendations subscription error:', err);
  });
}

/**
 * Save custom recommendation to Firestore
 */
export async function saveRecommendationToFirestore(rec: any) {
  try {
    const id = rec.id || 'rec-' + Date.now();
    const cleanRec = sanitizeAndPrepareForFirestore({ ...rec, id });
    await setDoc(doc(db, 'recommendations', id), cleanRec);
  } catch (err) {
    console.error('Error saving recommendation to Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Delete custom recommendation from Firestore
 */
export async function deleteRecommendationFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'recommendations', id));
  } catch (err) {
    console.error('Error deleting recommendation from Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Save user account to Firestore
 */
export async function saveUserToFirestore(user: UserAccount) {
  try {
    const cleanUser = sanitizeAndPrepareForFirestore(user);
    await setDoc(doc(db, USERS_COL, user.id), cleanUser, { merge: true });
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
    handleFirebaseError(err);
  }
}

// --- Presence ayarları (admin panelinden yönetilebilir) ---
let presenceHeartbeatMinutes: number = localStorage.getItem('presence_heartbeat_minutes') 
  ? Number(localStorage.getItem('presence_heartbeat_minutes')) 
  : 5;
let presenceHeartbeatEnabled: boolean = localStorage.getItem('presence_heartbeat_enabled') !== null
  ? localStorage.getItem('presence_heartbeat_enabled') === 'true'
  : true;

export function getPresenceHeartbeatMinutes(): number {
  return presenceHeartbeatMinutes;
}

export function setPresenceHeartbeatMinutes(minutes: number): void {
  presenceHeartbeatMinutes = minutes;
  localStorage.setItem('presence_heartbeat_minutes', String(minutes));
  setDoc(doc(db, 'settings', 'school_config'), { presenceHeartbeatMinutes: minutes }, { merge: true })
    .catch(err => console.warn('Could not write presenceHeartbeatMinutes to Firestore:', err));
}

export function getPresenceHeartbeatEnabled(): boolean {
  return presenceHeartbeatEnabled;
}

export function setPresenceHeartbeatEnabled(enabled: boolean): void {
  presenceHeartbeatEnabled = enabled;
  localStorage.setItem('presence_heartbeat_enabled', String(enabled));
  setDoc(doc(db, 'settings', 'school_config'), { presenceHeartbeatEnabled: enabled }, { merge: true })
    .catch(err => console.warn('Could not write presenceHeartbeatEnabled to Firestore:', err));
}

let lastPresenceState: { userId: string; isOnline: boolean; timestamp: number } | null = null;

export async function updateUserPresenceInFirestore(userId: string, isOnline: boolean) {
  try {
    const now = Date.now();
    const throttleMs = presenceHeartbeatMinutes * 60 * 1000;
    if (
      lastPresenceState &&
      lastPresenceState.userId === userId &&
      lastPresenceState.isOnline === isOnline &&
      now - lastPresenceState.timestamp < throttleMs
    ) {
      // Skip redundant write
      return;
    }

    await setDoc(doc(db, 'presence', userId), {
      isOnline,
      lastActiveAt: new Date().toISOString()
    }, { merge: true });

    lastPresenceState = { userId, isOnline, timestamp: now };
  } catch (err) {
    console.warn('Could not update user presence in Firestore:', err);
  }
}

/**
 * 'presence' koleksiyonunun tamamını dinler. SADECE presence verisine gerçekten ihtiyacı olan
 * görünümlerde (MessagesView, TeacherDashboardView) çağrılmalı — App.tsx'te global olarak ÇAĞRILMAMALI.
 */
export function subscribeToPresence(
  onChange: (presenceMap: Record<string, { isOnline: boolean; lastActiveAt: string }>) => void
) {
  return onSnapshot(collection(db, 'presence'), (snapshot) => {
    const presenceMap: Record<string, { isOnline: boolean; lastActiveAt: string }> = {};
    snapshot.forEach((docSnap) => {
      presenceMap[docSnap.id] = docSnap.data() as { isOnline: boolean; lastActiveAt: string };
    });
    onChange(presenceMap);
  }, (err) => {
    console.error('Firestore presence subscription error:', err);
    handleFirebaseError(err);
  });
}

/**
 * Save multiple users to Firestore
 */
export async function saveGlobalUsersToFirestore(users: UserAccount[]) {
  try {
    for (const u of users) {
      const cleanUser = sanitizeAndPrepareForFirestore(u);
      await setDoc(doc(db, USERS_COL, u.id), cleanUser, { merge: true });
    }
  } catch (err) {
    console.error('Error saving users to Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Delete user from Firestore
 */
export async function deleteUserFromFirestore(userId: string) {
  try {
    await deleteDoc(doc(db, USERS_COL, userId));
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Save class definition to Firestore
 */
export async function saveClassToFirestore(classDef: ClassDefinition) {
  try {
    const cleanClass = sanitizeAndPrepareForFirestore(classDef);
    await setDoc(doc(db, CLASSES_COL, classDef.id), cleanClass, { merge: true });
  } catch (err) {
    console.error('Error saving class to Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Delete class definition from Firestore
 */
export async function deleteClassFromFirestore(classId: string) {
  try {
    await deleteDoc(doc(db, CLASSES_COL, classId));
  } catch (err) {
    console.error('Error deleting class from Firestore:', err);
    handleFirebaseError(err);
  }
}

const studentDebounceTimeouts: Record<string, any> = {};
const studentLatestData: Record<string, YKSDataState> = {};

let lowDataBatchTimeout: any = null;
let pendingStudentWrites: Record<string, YKSDataState> = {};

export async function commitStudentDebounce(studentId: string): Promise<void> {
  const latestData = studentLatestData[studentId];
  if (!latestData) return;

  delete studentDebounceTimeouts[studentId];
  delete studentLatestData[studentId];

  try {
    const cleanData = sanitizeAndPrepareForFirestore(latestData);
    await setDoc(doc(db, STUDENTS_DATA_COL, studentId), cleanData, { merge: true });
    console.log(`Successfully flushed debounced student data to Firestore for user: ${studentId}`);
  } catch (err) {
    console.error('Error flushing student data to Firestore:', err);
    handleFirebaseError(err);
  }
}

export async function commitStudentLowDataBatch(): Promise<void> {
  const batchData = { ...pendingStudentWrites };
  pendingStudentWrites = {};
  lowDataBatchTimeout = null;
  
  const studentIds = Object.keys(batchData);
  if (studentIds.length === 0) return;
  
  try {
    const batch = writeBatch(db);
    studentIds.forEach(id => {
      const docRef = doc(db, STUDENTS_DATA_COL, id);
      const cleanData = sanitizeAndPrepareForFirestore(batchData[id]);
      batch.set(docRef, cleanData, { merge: true });
    });
    await batch.commit();
    console.log(`Successfully batch written data for students: ${studentIds.join(', ')} in Low Data Mode.`);
  } catch (err) {
    console.error('Error flushing batch student data to Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Save student data slice to Firestore (Debounced to save quota and optimize writes)
 */
export async function saveStudentDataToFirestore(studentId: string, dataState: YKSDataState) {
  updateUserPresenceInFirestore(studentId, true); // Gerçek aktiviteye binerek presence güncelle (await ETME, arka planda çalışsın)
  if (lowDataMode) {
    pendingStudentWrites[studentId] = dataState;
    
    if (lowDataBatchTimeout) return;
    
    lowDataBatchTimeout = setTimeout(() => {
      commitStudentLowDataBatch();
    }, lowDataModeIntervalMinutes * 60 * 1000); // Ayarlanabilir batching aralığı
  } else {
    // Store the latest state to be written
    studentLatestData[studentId] = dataState;

    // Clear previous timeout if any
    if (studentDebounceTimeouts[studentId]) {
      clearTimeout(studentDebounceTimeouts[studentId]);
    }

    // Debounce the write for 2 seconds
    studentDebounceTimeouts[studentId] = setTimeout(() => {
      commitStudentDebounce(studentId);
    }, 2000);
  }
}

/**
 * Save direct message to Firestore
 */
export async function saveMessageToFirestore(msg: DirectMessage) {
  try {
    const cleanMsg = sanitizeAndPrepareForFirestore(msg);
    await setDoc(doc(db, MESSAGES_COL, msg.id), cleanMsg, { merge: true });
  } catch (err) {
    console.error('Error saving message to Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Delete message from Firestore
 */
export async function deleteMessageFromFirestore(msgId: string) {
  try {
    await deleteDoc(doc(db, MESSAGES_COL, msgId));
  } catch (err) {
    console.error('Error deleting message from Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Mark messages as delivered in Firestore
 */
export async function markMessagesAsDeliveredInFirestore(msgIds: string[]) {
  try {
    for (const id of msgIds) {
      await setDoc(doc(db, MESSAGES_COL, id), { isDelivered: true }, { merge: true });
    }
  } catch (err) {
    console.error('Error marking messages as delivered in Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Mark messages as read in Firestore
 */
export async function markMessagesAsReadInFirestore(msgIds: string[], userId: string, readAt?: string) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const defaultReadAt = `${year}-${month}-${day} ${hours}:${minutes}`;
    const timestamp = readAt || defaultReadAt;

    const batch = writeBatch(db);
    for (const id of msgIds) {
      const docRef = doc(db, MESSAGES_COL, id);
      batch.set(docRef, {
        isRead: true,
        isDelivered: true,
        readAt: timestamp,
        readBy: arrayUnion({ userId, readAt: timestamp })
      }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.error('Error marking messages as read in Firestore:', err);
    handleFirebaseError(err);
  }
}

let logQueue: AuditLogItem[] = [];
let writeTimeout: any = null;

export async function commitAuditLogQueue(): Promise<void> {
  const logsToWrite = [...logQueue];
  logQueue = [];
  writeTimeout = null;

  if (logsToWrite.length === 0) return;

  try {
    const batch = writeBatch(db);
    logsToWrite.forEach(item => {
      const docRef = doc(db, 'auditLogs', item.id);
      const cleanLog = sanitizeAndPrepareForFirestore(item);
      batch.set(docRef, cleanLog, { merge: true });
    });
    await batch.commit();
    console.log(`Successfully flushed batch of ${logsToWrite.length} audit logs to Firestore (${lowDataMode ? 'Low Data Mode' : 'Normal Mode'}).`);
  } catch (err) {
    console.error('Error committed batch audit logs to Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Save audit log to Firestore (Batched and buffered to save quota and optimize writes)
 */
export async function saveAuditLogToFirestore(log: AuditLogItem) {
  if (log.actorId) {
    updateUserPresenceInFirestore(log.actorId, true); // Gerçek aktiviteye binerek presence güncelle
  }
  logQueue.push(log);

  if (writeTimeout) {
    clearTimeout(writeTimeout);
  }

  // Buffer and write in a batch; adjustable minutes delay under Low Data Mode, otherwise 3 seconds
  const bufferDelay = lowDataMode ? (lowDataModeIntervalMinutes * 60 * 1000) : 3000;

  writeTimeout = setTimeout(() => {
    commitAuditLogQueue();
  }, bufferDelay);
}

/**
 * Flush all pending Firestore writes immediately (e.g. on user logout)
 */
export async function flushPendingFirestoreWrites(): Promise<void> {
  const promises: Promise<void>[] = [];

  // Bekleyen öğrenci verisi (normal mod debounce)
  Object.keys(studentDebounceTimeouts).forEach(studentId => {
    clearTimeout(studentDebounceTimeouts[studentId]);
    delete studentDebounceTimeouts[studentId];
    promises.push(commitStudentDebounce(studentId));
  });

  // Bekleyen öğrenci verisi (Düşük Veri Modu batch)
  if (lowDataBatchTimeout) {
    clearTimeout(lowDataBatchTimeout);
    lowDataBatchTimeout = null;
    promises.push(commitStudentLowDataBatch());
  }

  // Bekleyen audit log kuyruğu
  if (writeTimeout) {
    clearTimeout(writeTimeout);
    writeTimeout = null;
    promises.push(commitAuditLogQueue());
  }

  await Promise.all(promises);
  console.log('Tüm bekleyen veriler başarıyla sunucuya gönderildi (flush).');
}

/**
 * Delete audit log from Firestore
 */
export async function deleteAuditLogFromFirestore(logId: string) {
  try {
    await deleteDoc(doc(db, 'auditLogs', logId));
  } catch (err) {
    console.error('Error deleting audit log from Firestore:', err);
    handleFirebaseError(err);
  }
}

/**
 * Clear all audit logs in Firestore
 */
export async function clearAllAuditLogsInFirestore() {
  try {
    const snapshot = await getDocs(collection(db, 'auditLogs'));
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, 'auditLogs', d.id));
    }
  } catch (err) {
    console.error('Error clearing audit logs in Firestore:', err);
    handleFirebaseError(err);
  }
}
