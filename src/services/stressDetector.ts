/**
 * stressDetector.ts
 * Öğrencinin stres/yorgunluk profilini 4 sinyal ile hesaplar:
 * 1. Performans düşüşü (son 7 gün vs önceki 7 gün net ortalaması)
 * 2. Çalışma serisi kırılması
 * 3. Rutin tamamlama oranı düşüklüğü
 * 4. Hata defteri pasifliği
 *
 * Opsiyonel: Manuel ruh hali girişi (manualMoodToday)
 */

import { YKSDataState, StressProfile, StressLevel, StressSignals } from '../types';

// ─── YARDIMCI FONKSİYONLAR ────────────────────────────────────────────────

function getIsoDate(daysAgo: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

/** Son N günlük soru loglarının toplam net ortalamasını döndürür */
function getAvgNetForDays(state: YKSDataState, startDaysAgo: number, endDaysAgo: number): number {
  const logs = state.questionLogs || [];
  const start = getIsoDate(startDaysAgo);
  const end = getIsoDate(endDaysAgo);

  const filtered = logs.filter(l => {
    const d = (l.date || '').slice(0, 10);
    return d >= end && d <= start;
  });

  if (filtered.length === 0) return -1; // Veri yok

  const totalNet = filtered.reduce((sum, l) => {
    const correct = (l as any).correct ?? 0;
    const wrong = (l as any).wrong ?? 0;
    return sum + (correct - wrong / 4);
  }, 0);

  return totalNet / filtered.length;
}

/** Son N günde tamamlanan rutin oranını hesaplar (0-1 arası) */
function getRoutineCompletionRate(state: YKSDataState, days: number): number {
  const routines = state.routines || [];
  if (routines.length === 0) return 1;

  const today = getIsoDate(0);
  let totalExpected = 0;
  let totalDone = 0;

  for (let i = 0; i < days; i++) {
    const dateStr = getIsoDate(i);
    if (dateStr > today) continue;

    const activeRoutines = routines.filter(r => {
      if (!(r as any).isActive) return false;
      const startDate = (r as any).startDate || '2000-01-01';
      return dateStr >= startDate;
    });

    totalExpected += activeRoutines.length;

    activeRoutines.forEach(r => {
      const log = ((r as any).completionLog || {})[dateStr];
      if (log === true || log === 'done') totalDone++;
    });
  }

  return totalExpected > 0 ? totalDone / totalExpected : 1;
}

/** Hata defterinin pasif olup olmadığını kontrol eder (14 gün içinde yeni hata yok) */
function isErrorLogPassive(state: YKSDataState): boolean {
  const errors = state.topicErrors || [];
  if (errors.length === 0) return false;

  const cutoff = getIsoDate(14);
  const recentErrors = errors.filter(e => {
    const d = ((e as any).createdAt || (e as any).date || '').slice(0, 10);
    return d >= cutoff;
  });

  return recentErrors.length === 0;
}

/** Streak kırılıp kırılmadığını kontrol eder */
function isStreakBroken(state: YKSDataState): boolean {
  const stats = state.motivationStats;
  if (!stats) return false;

  const yesterday = getIsoDate(1);
  const lastActive = (stats.lastActiveDate || '').slice(0, 10);

  const noRecentActivity = lastActive < yesterday;
  const lowStreak = stats.currentStreak < 3 && stats.longestStreak >= 5;

  return noRecentActivity || lowStreak;
}

// ─── ANA FONKSİYON ────────────────────────────────────────────────────────

export function detectStressProfile(state: YKSDataState): StressProfile {
  // 1. Performans düşüşü sinyali (ağırlık %35)
  const recentAvg = getAvgNetForDays(state, 7, 0);
  const prevAvg = getAvgNetForDays(state, 14, 7);
  const performanceDrop = recentAvg !== -1 && prevAvg !== -1 && recentAvg < prevAvg * 0.8;

  // 2. Streak kırılması sinyali (ağırlık %25)
  const streakBroken = isStreakBroken(state);

  // 3. Rutin tamamlama düşüklüğü sinyali (ağırlık %20)
  const routineRate = getRoutineCompletionRate(state, 7);
  const lowRoutineRate = routineRate < 0.5;

  // 4. Hata defteri pasifliği sinyali (ağırlık %20)
  const errorLogPassive = isErrorLogPassive(state);

  // 5. Manuel ruh hali override (opsiyonel)
  const manualMood = state.manualMoodToday ?? null;

  // Ham skor hesaplama (0-100)
  let score = 0;
  if (performanceDrop) score += 35;
  if (streakBroken) score += 25;
  if (lowRoutineRate) score += 20;
  if (errorLogPassive) score += 20;

  // Manuel mood override etkisi
  if (manualMood === 'tired') score = Math.min(100, score + 40);
  else if (manualMood === 'okay') score = Math.max(0, score - 15);
  else if (manualMood === 'ready') score = Math.max(0, score - 35);

  // Stres seviyesi belirleme
  let stressLevel: StressLevel;
  if (score >= 65) stressLevel = 'burnt_out';
  else if (score >= 30) stressLevel = 'mildly_stressed';
  else stressLevel = 'calm';

  // AI prompt'a eklenecek özet metin
  const signalTexts: string[] = [];
  if (performanceDrop) signalTexts.push('son 7 günlük net ortalaması önceki haftaya göre %20+ düştü');
  if (streakBroken) signalTexts.push('çalışma serisi son 2 günde kırıldı veya düşük kaldı');
  if (lowRoutineRate) signalTexts.push(`son 7 günde rutinlerin yalnızca %${Math.round(routineRate * 100)}'ini tamamladı`);
  if (errorLogPassive) signalTexts.push('14 gündür hata defterine yeni kayıt eklenmedi');
  if (manualMood === 'tired') signalTexts.push('kendisi "yorgunum" diyerek durumunu bildirdi');

  let summary: string;
  if (stressLevel === 'burnt_out') {
    summary = `Öğrenci ciddi düzeyde yorgunluk/stres belirtisi gösteriyor (skor: ${score}/100). Tespit edilen sinyaller: ${signalTexts.join('; ')}.`;
  } else if (stressLevel === 'mildly_stressed') {
    summary = `Öğrenci hafif stres/yorgunluk belirtisi gösteriyor (skor: ${score}/100). Tespit edilen sinyaller: ${signalTexts.length > 0 ? signalTexts.join('; ') : 'hafif düşüş eğilimi'}.`;
  } else {
    summary = `Öğrenci motivasyonu ve performansı genel olarak dengede (skor: ${score}/100). Belirgin bir stres sinyali yok.`;
  }

  const signals: StressSignals = {
    performanceDrop,
    streakBroken,
    lowRoutineRate,
    errorLogPassive,
    manualMoodOverride: manualMood,
  };

  return { stressLevel, score, signals, summary };
}

/** Stres seviyesine göre AI tonu prompt parçası üretir (geminiRoutes.ts'te kullanılır) */
export function buildStressTonePrompt(profile: StressProfile): string {
  const toneGuide: Record<StressLevel, string> = {
    calm:
      'Öğrenci motivasyonu ve performansı iyi durumda. Analitik, hedefe yönelik ve verimliliğe odaklı bir ton kullan. Performans artışı için somut stratejiler öner.',
    mildly_stressed:
      'Öğrenci hafif stres veya yorgunluk yaşıyor olabilir. Önce empati kurarak başla, ardından öneri sun. Yargılayıcı veya baskı oluşturucu bir dil KULLANMA. Küçük kazanımlara dikkat çek.',
    burnt_out:
      'Öğrenci ciddi düzeyde yorgun veya tükenmiş görünüyor. Performans baskısından önce psikolojik güvenlik ver. "Bu hissin normal olduğunu" belirt. Çok küçük, başarılabilir tek bir adım öner. Nazik, anlayışlı ve destekleyici ol. Kesinlikle yargılama. Mümkünse nefes egzersizi veya kısa mola önerisi de ekle.',
  };

  return `## ÖĞRENCİNİN DUYGUSAL/MOTİVASYON DURUMU
Stres Seviyesi: ${profile.stressLevel} (Ham Skor: ${profile.score}/100)
Durum Özeti: ${profile.summary}

TON YÖNERGESİ — BU KURALI MUTLAKA UYGULA:
${toneGuide[profile.stressLevel]}`;
}

/** Stres seviyesi için UI renk/tema bilgileri döndürür */
export function getStressUiTheme(stressLevel: StressLevel) {
  switch (stressLevel) {
    case 'burnt_out':
      return {
        borderColor: 'border-rose-500/40',
        bgColor: 'bg-rose-500/10',
        textColor: 'text-rose-300',
        badgeBg: 'bg-rose-600/80',
        label: '🫶 Destekleyici Mod',
        bannerText: 'Son günlerde yorulduğunu görüyorum. Bu çok normal — küçük bir adımdan başlayalım.',
        icon: '🫶',
      };
    case 'mildly_stressed':
      return {
        borderColor: 'border-amber-500/40',
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-300',
        badgeBg: 'bg-amber-600/80',
        label: '💛 Sabırlı Mod',
        bannerText: 'Biraz yorgun görünüyorsun. Sorun değil — bugün neler yapabileceğine birlikte bakalım.',
        icon: '💛',
      };
    default:
      return {
        borderColor: 'border-indigo-500/40',
        bgColor: 'bg-indigo-500/10',
        textColor: 'text-indigo-300',
        badgeBg: 'bg-indigo-600/80',
        label: '🚀 Odaklanma Modu',
        bannerText: null,
        icon: '🚀',
      };
  }
}
