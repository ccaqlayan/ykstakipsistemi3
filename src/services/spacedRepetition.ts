import { TopicErrorItem, RepetitionLog } from '../types';

export const DEFAULT_REPETITION_INTERVALS = [1, 3, 7]; // 1. gün, 3. gün, 7. gün

export const STORAGE_KEY_INTERVALS = 'spaced_repetition_intervals';

/**
 * Kullanıcının belirlediği veya varsayılan tekrar aralıklarını getirir.
 */
export const getUserRepetitionIntervals = (): number[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INTERVALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(n => typeof n === 'number' && n > 0)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading spaced repetition intervals:', e);
  }
  return DEFAULT_REPETITION_INTERVALS;
};

/**
 * Kullanıcının özel tekrar aralıklarını kaydeder.
 */
export const saveUserRepetitionIntervals = (intervals: number[]): void => {
  try {
    const clean = intervals.filter(n => typeof n === 'number' && n > 0);
    localStorage.setItem(STORAGE_KEY_INTERVALS, JSON.stringify(clean.length > 0 ? clean : DEFAULT_REPETITION_INTERVALS));
  } catch (e) {
    console.error('Error saving spaced repetition intervals:', e);
  }
};

/**
 * Bugünün tarihini YYYY-MM-DD formatında döner.
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Belirtilen tarihe gün ekleyip YYYY-MM-DD olarak döner (Saat dilimi kaymalarına karşı güvenli).
 */
export const addDaysToDate = (baseDateStr: string, days: number): string => {
  if (!baseDateStr) {
    baseDateStr = getTodayDateString();
  }
  const dateOnly = baseDateStr.includes('T') ? baseDateStr.split('T')[0] : baseDateStr;
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const target = new Date(y, m, d + days);
      const year = target.getFullYear();
      const month = String(target.getMonth() + 1).padStart(2, '0');
      const day = String(target.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  const now = new Date();
  now.setDate(now.getDate() + days);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Sorunun bir sonraki tekrar tarihini hesaplar.
 * Aşama (stage): 0 -> 1. tekrar (örnek: 1 gün sonra)
 * Aşama (stage): 1 -> 2. tekrar (örnek: 3 gün sonra)
 * Aşama (stage): 2 -> 3. tekrar (örnek: 7 gün sonra)
 */
export const calculateNextReviewDate = (
  createdOrLastDate: string,
  stage: number,
  intervals: number[] = getUserRepetitionIntervals()
): string => {
  const daysToAdd = intervals[stage] ?? intervals[intervals.length - 1] ?? 1;
  const base = createdOrLastDate || getTodayDateString();
  return addDaysToDate(base, daysToAdd);
};

/**
 * Bir sorunun tekrar zamanının gelip gelmediğini kontrol eder.
 */
export const isQuestionDue = (
  errorItem: TopicErrorItem,
  intervals: number[] = getUserRepetitionIntervals(),
  todayStr: string = getTodayDateString()
): boolean => {
  // Sadece fotoğrafı olan sorular aralıklı tekrar sistemine dahil edilir
  if (!errorItem.imageUrl || errorItem.imageUrl.trim() === '') {
    return false;
  }

  const currentStage = errorItem.repetitionStage ?? 0;
  
  // Tüm aşamalar tamamlandıysa artık "Due" değil
  if (currentStage >= intervals.length) {
    return false;
  }

  // Henüz nextReviewDate tanımlanmadıysa hata eklenme tarihine göre ilk aşama hesaplanır
  let nextDate = errorItem.nextReviewDate;
  if (!nextDate) {
    const baseDate = currentStage === 0 
      ? (errorItem.date || todayStr) 
      : (errorItem.lastReviewDate || errorItem.date || todayStr);
    nextDate = calculateNextReviewDate(baseDate, currentStage, intervals);
  }

  // Soru sisteme eklendiği gün (stage 0 ve henüz tekrar yapılmamış) asla aynı gün tekrar zamanı geldi uyarısı vermez.
  // 1. tekrar için en erken ertesi gün (1 gün sonra) beklenmelidir.
  const itemDateOnly = (errorItem.date || '').split('T')[0];
  if (currentStage === 0 && !errorItem.lastReviewDate && itemDateOnly === todayStr) {
    return false;
  }

  return nextDate <= todayStr;
};

/**
 * Tekrar zamanı gelmiş soruları filtreler.
 */
export const getDueRepetitionQuestions = (
  topicErrors: TopicErrorItem[],
  intervals: number[] = getUserRepetitionIntervals()
): TopicErrorItem[] => {
  const todayStr = getTodayDateString();
  return topicErrors.filter(err => isQuestionDue(err, intervals, todayStr));
};

/**
 * Motive edici mesaj koleksiyonu
 */
export const MOTIVATION_MESSAGES = {
  CORRECT: [
    '🎯 Harikasın! Bu soruyu artık hafızana kazıdın.',
    '🚀 Tebrikler! Bilgiyi tazeledin ve pekiştirdin.',
    '⭐ Mükemmel ilerleme! Bir sonraki tekrar aşamasına geçtin.',
    '🧠 Harika odaklanma! Zihnin bu soru tipini tamamen kavradı.',
    '🏆 Bravo! Düzenli tekrarlar seni zirveye taşıyacak.',
    '✨ Süpersin! Hatanı başarıya dönüştürdün.'
  ],
  WRONG: [
    '💪 Hiç sorun değil! Hatalar en kalıcı ve güçlü öğrenme fırsatıdır.',
    '🔥 Pes etmek yok! Çözümü inceleyip benzer sorularla pekiştirelim.',
    '💡 Unutma: Zor soruları tekrar etmek gerçek net artışını sağlar.',
    '🌱 Her yanlış, doğruyu bulmanın en önemli adımıdır. Çözümü adım adım incele.',
    '🎯 Bu soruyu bir sonraki tekrar aşamasında kolayca çözeceksin!'
  ]
};

export const getRandomMotivationMessage = (isCorrect: boolean): string => {
  const list = isCorrect ? MOTIVATION_MESSAGES.CORRECT : MOTIVATION_MESSAGES.WRONG;
  return list[Math.floor(Math.random() * list.length)];
};

/**
 * Temiz şık harfi çıkartıcı (A, B, C, D, E)
 */
export const extractOptionLetter = (raw: string | undefined | null): string => {
  if (!raw) return '';
  const match = raw.trim().match(/^[A-Ea-e]/);
  if (match) return match[0].toUpperCase();
  const wordMatch = raw.match(/\b([A-Ea-e])\s*(?:şık|seçenek|seçeneği)/i);
  if (wordMatch) return wordMatch[1].toUpperCase();
  return raw.trim().slice(0, 1).toUpperCase();
};

/**
 * Tekrar denemesini kaydeder ve güncellenmiş TopicErrorItem nesnesini döndürür.
 */
export const recordRepetitionAttempt = (
  errorItem: TopicErrorItem,
  selectedOption: string,
  intervals: number[] = getUserRepetitionIntervals()
): { updatedError: TopicErrorItem; isCorrect: boolean; message: string } => {
  const normalizedSelected = extractOptionLetter(selectedOption);
  const correctRaw = errorItem.correctOption || errorItem.aiSolutionCorrectAnswer || '';
  const normalizedCorrect = extractOptionLetter(correctRaw);

  const isCorrect = normalizedCorrect ? normalizedSelected === normalizedCorrect : true;
  const currentStage = errorItem.repetitionStage ?? 0;
  const todayStr = getTodayDateString();

  const newLog: RepetitionLog = {
    date: todayStr,
    selectedOption: normalizedSelected,
    isCorrect,
    stage: currentStage + 1
  };

  const newHistory = [...(errorItem.repetitionHistory || []), newLog];

  let nextStage = currentStage;
  let nextReviewDate = errorItem.nextReviewDate;

  if (isCorrect) {
    nextStage = currentStage + 1;
    if (nextStage < intervals.length) {
      nextReviewDate = calculateNextReviewDate(todayStr, nextStage, intervals);
    } else {
      nextReviewDate = undefined; // Tamamlandı
    }
  } else {
    // Yanlış yapıldıysa: 1 gün sonra tekrar denet (hafızayı tazelemek için)
    nextReviewDate = addDaysToDate(todayStr, 1);
  }

  const updatedError: TopicErrorItem = {
    ...errorItem,
    repetitionStage: nextStage,
    nextReviewDate,
    lastReviewDate: todayStr,
    lastReviewResult: isCorrect ? 'CORRECT' : 'WRONG',
    repetitionHistory: newHistory,
    revised: nextStage >= intervals.length ? true : errorItem.revised
  };

  const message = getRandomMotivationMessage(isCorrect);

  return { updatedError, isCorrect, message };
};

export interface RepetitionStageInfo {
  stage: number;
  totalStages: number;
  isDue: boolean;
  isCompleted: boolean;
  label: string;
  shortLabel: string;
  badgeClass: string;
  nextReviewDate?: string;
  isTomorrow?: boolean;
}

/**
 * Bir sorunun mevcut tekrar aşamasını, etiketini ve stil sınıfını döner.
 */
export const getRepetitionStageInfo = (
  item: TopicErrorItem,
  intervals: number[] = getUserRepetitionIntervals(),
  todayStr: string = getTodayDateString()
): RepetitionStageInfo => {
  const stage = item.repetitionStage ?? (item.repetitionHistory ? item.repetitionHistory.length : 0);
  const totalStages = intervals.length;
  const isCompleted = !!item.revised || stage >= totalStages;
  const isDue = isQuestionDue(item, intervals, todayStr);
  const tomorrowStr = addDaysToDate(todayStr, 1);

  if (isCompleted) {
    return {
      stage,
      totalStages,
      isDue: false,
      isCompleted: true,
      label: `🌟 Pekiştirildi (${stage}/${totalStages})`,
      shortLabel: `🌟 Pekiştirildi (${stage}/${totalStages})`,
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      isTomorrow: false,
    };
  }

  if (isDue) {
    return {
      stage,
      totalStages,
      isDue: true,
      isCompleted: false,
      label: `⏳ ${stage + 1}. Tekrar Zamanı Geldi`,
      shortLabel: `⏳ ${stage + 1}. Tekrar Zamanı`,
      badgeClass: 'bg-purple-500/25 text-purple-300 border-purple-500/50 animate-pulse font-bold',
      isTomorrow: false,
    };
  }

  if (stage > 0) {
    const nextReview = item.nextReviewDate || calculateNextReviewDate(item.lastReviewDate || todayStr, stage, intervals);
    const isTomorrow = nextReview === tomorrowStr;
    const resultIcon = item.lastReviewResult === 'CORRECT' ? ' (✅)' : item.lastReviewResult === 'WRONG' ? ' (❌)' : '';
    return {
      stage,
      totalStages,
      isDue: false,
      isCompleted: false,
      label: `🔁 ${stage}. Tekrar Yapıldı${resultIcon} • ${isTomorrow ? 'Yarın' : nextReview}`,
      shortLabel: `🔁 ${stage}. Tekrar Yapıldı`,
      badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-bold',
      nextReviewDate: nextReview,
      isTomorrow,
    };
  }

  // stage === 0
  const nextReview = item.nextReviewDate || calculateNextReviewDate(item.date || todayStr, 0, intervals);
  const isTomorrow = nextReview === tomorrowStr;
  return {
    stage: 0,
    totalStages,
    isDue: false,
    isCompleted: false,
    label: `⏳ 1. Tekrar: ${isTomorrow ? 'Yarın' : nextReview} (0/${totalStages})`,
    shortLabel: `⏳ 0/${totalStages} Tekrar`,
    badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
    nextReviewDate: nextReview,
    isTomorrow,
  };
};
