import { YKSDataState, EarnedBadge, MotivationStats, BadgeTier, BadgeCategory, MotivationToastItem } from '../types';
import { BadgeIconType } from '../components/badges/BadgeShield';

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  iconType: BadgeIconType;
  xpReward: number;
  checkEarned: (data: YKSDataState, stats: MotivationStats) => boolean;
  calcProgress: (data: YKSDataState, stats: MotivationStats) => { current: number; target: number; percent: number; label: string };
}

// 26 Comprehensive Game Rank Achievement Badges
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // 1. 🔥 SERİ & GÜNLÜK DİSİPLİN (Streak)
  {
    key: 'streak_1',
    name: '🌱 Kıvılcım',
    description: 'İlk çalışma gününü tamamlayarak YKS maratonunu başlattın.',
    category: 'streak',
    tier: 'bronze',
    iconType: 'sprout',
    xpReward: 50,
    checkEarned: (_, stats) => stats.totalStudyDays >= 1 || stats.currentStreak >= 1,
    calcProgress: (_, stats) => {
      const current = Math.min(stats.totalStudyDays, 1);
      return { current, target: 1, percent: (current / 1) * 100, label: `${current}/1 Gün` };
    }
  },
  {
    key: 'streak_3',
    name: '🔥 Alev Muhafızı',
    description: 'Aralıksız 3 gün boyunca çalışma serisini sürdürdün.',
    category: 'streak',
    tier: 'silver',
    iconType: 'flame',
    xpReward: 100,
    checkEarned: (_, stats) => stats.currentStreak >= 3 || stats.longestStreak >= 3,
    calcProgress: (_, stats) => {
      const current = Math.min(Math.max(stats.currentStreak, stats.longestStreak), 3);
      return { current, target: 3, percent: (current / 3) * 100, label: `${current}/3 Gün Seri` };
    }
  },
  {
    key: 'streak_7',
    name: '⚔️ Çelik İrade',
    description: 'Aralıksız 7 gün (1 tam hafta) boyunca disiplinini hiç bozmadın.',
    category: 'streak',
    tier: 'gold',
    iconType: 'swords',
    xpReward: 250,
    checkEarned: (_, stats) => stats.currentStreak >= 7 || stats.longestStreak >= 7,
    calcProgress: (_, stats) => {
      const current = Math.min(Math.max(stats.currentStreak, stats.longestStreak), 7);
      return { current, target: 7, percent: (current / 7) * 100, label: `${current}/7 Gün Seri` };
    }
  },
  {
    key: 'streak_14',
    name: '🛡️ Fırtına Şövalyesi',
    description: 'Aralıksız 14 gün boyunca demir gibi bir çalışma serisi yakaladın.',
    category: 'streak',
    tier: 'platinum',
    iconType: 'shield',
    xpReward: 500,
    checkEarned: (_, stats) => stats.currentStreak >= 14 || stats.longestStreak >= 14,
    calcProgress: (_, stats) => {
      const current = Math.min(Math.max(stats.currentStreak, stats.longestStreak), 14);
      return { current, target: 14, percent: (current / 14) * 100, label: `${current}/14 Gün Seri` };
    }
  },
  {
    key: 'streak_30',
    name: '👑 Yenilmez Efsane',
    description: 'Tam 30 gün aralıksız çalışma serisi! Şampiyonların disiplinine ulaştın.',
    category: 'streak',
    tier: 'legendary',
    iconType: 'crown',
    xpReward: 1000,
    checkEarned: (_, stats) => stats.currentStreak >= 30 || stats.longestStreak >= 30,
    calcProgress: (_, stats) => {
      const current = Math.min(Math.max(stats.currentStreak, stats.longestStreak), 30);
      return { current, target: 30, percent: (current / 30) * 100, label: `${current}/30 Gün Seri` };
    }
  },

  // 2. 🚀 DENEME & NET CANAVARLARI (Mock Exams)
  {
    key: 'mock_first',
    name: '📜 Arena Çırağı',
    description: 'İlk Genel Deneme sınavını sisteme girerek seviyeni ölçtün.',
    category: 'mock',
    tier: 'bronze',
    iconType: 'scroll',
    xpReward: 50,
    checkEarned: (data) => (data.generalMocks || []).length >= 1,
    calcProgress: (data) => {
      const count = (data.generalMocks || []).length;
      return { current: Math.min(count, 1), target: 1, percent: count >= 1 ? 100 : 0, label: `${Math.min(count, 1)}/1 Deneme` };
    }
  },
  {
    key: 'mock_5',
    name: '🎯 Net Keskin Nişancısı',
    description: 'En az 5 Genel Deneme tamamlayarak net analizini sağlamlaştırdın.',
    category: 'mock',
    tier: 'silver',
    iconType: 'target',
    xpReward: 150,
    checkEarned: (data) => (data.generalMocks || []).length >= 5,
    calcProgress: (data) => {
      const count = (data.generalMocks || []).length;
      return { current: Math.min(count, 5), target: 5, percent: Math.min(100, (count / 5) * 100), label: `${Math.min(count, 5)}/5 Deneme` };
    }
  },
  {
    key: 'tyt_rocket',
    name: '🚀 TYT Roketi',
    description: 'TYT Genel Denemesinde 80 Net barajını aşarak göklere yükseldin!',
    category: 'mock',
    tier: 'gold',
    iconType: 'rocket',
    xpReward: 400,
    checkEarned: (data) => (data.generalMocks || []).some(m => (m.tyt?.totalNet || 0) >= 80),
    calcProgress: (data) => {
      const maxNet = Math.max(0, ...(data.generalMocks || []).map(m => m.tyt?.totalNet || 0));
      return { current: maxNet, target: 80, percent: Math.min(100, (maxNet / 80) * 100), label: `En Yüksek: ${maxNet.toFixed(1)} / 80 Net` };
    }
  },
  {
    key: 'ayt_tempest',
    name: '⚡ AYT Kasırgası',
    description: 'AYT Genel Denemesinde 50 Net barajını yıktın!',
    category: 'mock',
    tier: 'platinum',
    iconType: 'lightning',
    xpReward: 600,
    checkEarned: (data) => (data.generalMocks || []).some(m => (m.ayt?.totalNet || 0) >= 50),
    calcProgress: (data) => {
      const maxNet = Math.max(0, ...(data.generalMocks || []).map(m => m.ayt?.totalNet || 0));
      return { current: maxNet, target: 50, percent: Math.min(100, (maxNet / 50) * 100), label: `En Yüksek: ${maxNet.toFixed(1)} / 50 Net` };
    }
  },
  {
    key: 'rank_breaker',
    name: '🦅 Sıralama Kırıcı',
    description: 'Tahmini YKS Sıralamasında ilk 100.000 bandının içine girdin.',
    category: 'mock',
    tier: 'legendary',
    iconType: 'eagle_trophy',
    xpReward: 800,
    checkEarned: (data) => (data.generalMocks || []).some(m => m.estimatedRank && m.estimatedRank > 0 && m.estimatedRank <= 100000),
    calcProgress: (data) => {
      const ranks = (data.generalMocks || []).map(m => m.estimatedRank).filter((r): r is number => !!r && r > 0);
      const bestRank = ranks.length > 0 ? Math.min(...ranks) : 0;
      const isMet = bestRank > 0 && bestRank <= 100000;
      return {
        current: bestRank,
        target: 100000,
        percent: isMet ? 100 : bestRank > 0 ? Math.max(10, Math.min(90, Math.round((100000 / bestRank) * 100))) : 0,
        label: bestRank > 0 ? `En İyi Sıralama: ${bestRank.toLocaleString('tr-TR')}` : 'Henüz Sıralama Yok'
      };
    }
  },
  {
    key: 'steady_rise',
    name: '📈 İstikrarlı Yükseliş',
    description: 'Art arda 3 denemede TYT veya AYT netlerini sürekli artırdın.',
    category: 'mock',
    tier: 'gold',
    iconType: 'trending_up',
    xpReward: 350,
    checkEarned: (data) => {
      const mocks = (data.generalMocks || []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (mocks.length < 3) return false;
      for (let i = 2; i < mocks.length; i++) {
        const tytIncrease = (mocks[i].tyt?.totalNet || 0) > (mocks[i - 1].tyt?.totalNet || 0) && (mocks[i - 1].tyt?.totalNet || 0) > (mocks[i - 2].tyt?.totalNet || 0);
        const aytIncrease = (mocks[i].ayt?.totalNet || 0) > (mocks[i - 1].ayt?.totalNet || 0) && (mocks[i - 1].ayt?.totalNet || 0) > (mocks[i - 2].ayt?.totalNet || 0);
        if (tytIncrease || aytIncrease) return true;
      }
      return false;
    },
    calcProgress: (data) => {
      const mocks = data.generalMocks || [];
      const current = Math.min(mocks.length, 3);
      return { current, target: 3, percent: Math.min(100, (current / 3) * 100), label: `${current}/3 Deneme Kaydı` };
    }
  },

  // 3. 🗺️ KONU HÂKİMİYETİ & AKADEMİ (Topic Mastery)
  {
    key: 'topic_5',
    name: '⭐ Konu Çırağı',
    description: 'En az 5 konuyu "Uzmanlaştım" olarak işaretledin.',
    category: 'topic',
    tier: 'bronze',
    iconType: 'star',
    xpReward: 75,
    checkEarned: (data) => Object.values(data.topicStatuses || {}).filter(s => s === 'Uzmanlaştım').length >= 5,
    calcProgress: (data) => {
      const count = Object.values(data.topicStatuses || {}).filter(s => s === 'Uzmanlaştım').length;
      return { current: Math.min(count, 5), target: 5, percent: Math.min(100, (count / 5) * 100), label: `${count}/5 Konu` };
    }
  },
  {
    key: 'topic_25',
    name: '🌟 Bilgi Mimarı',
    description: '25 farklı konuyu tam kavrayıp "Uzmanlaştım" rütbesine taşıdın.',
    category: 'topic',
    tier: 'silver',
    iconType: 'constellation',
    xpReward: 200,
    checkEarned: (data) => Object.values(data.topicStatuses || {}).filter(s => s === 'Uzmanlaştım').length >= 25,
    calcProgress: (data) => {
      const count = Object.values(data.topicStatuses || {}).filter(s => s === 'Uzmanlaştım').length;
      return { current: Math.min(count, 25), target: 25, percent: Math.min(100, (count / 25) * 100), label: `${count}/25 Konu` };
    }
  },
  {
    key: 'topic_100',
    name: '📖 Kadim Bilge',
    description: '100 konuyu eksiksiz bitirip YKS müfredatının efendisi oldun.',
    category: 'topic',
    tier: 'gold',
    iconType: 'ancient_book',
    xpReward: 500,
    checkEarned: (data) => Object.values(data.topicStatuses || {}).filter(s => s === 'Uzmanlaştım').length >= 100,
    calcProgress: (data) => {
      const count = Object.values(data.topicStatuses || {}).filter(s => s === 'Uzmanlaştım').length;
      return { current: Math.min(count, 100), target: 100, percent: Math.min(100, (count / 100) * 100), label: `${count}/100 Konu` };
    }
  },
  {
    key: 'subject_master',
    name: '🎓 Ders Fatihi',
    description: 'Herhangi bir dersteki tüm TYT veya AYT konularını %100 tamamladın.',
    category: 'topic',
    tier: 'legendary',
    iconType: 'graduation',
    xpReward: 750,
    checkEarned: (data) => {
      const mastered = Object.entries(data.topicStatuses || {})
        .filter(([_, s]) => s === 'Uzmanlaştım')
        .map(([k]) => k);
      return mastered.length >= 20; // At least 20 topics fully mastered
    },
    calcProgress: (data) => {
      const count = Object.values(data.topicStatuses || {}).filter(s => s === 'Uzmanlaştım').length;
      return { current: Math.min(count, 20), target: 20, percent: Math.min(100, (count / 20) * 100), label: `${count}/20 Uzman Konu` };
    }
  },

  // 4. 🏹 SORU AVCISI & ÖĞÜTÜCÜ (Question Grinding)
  {
    key: 'question_100',
    name: '🎯 İlk İsabet',
    description: 'Sistemde ilk 100 sorunu çözerek soru maratonuna adım attın.',
    category: 'question',
    tier: 'bronze',
    iconType: 'bow_arrow',
    xpReward: 50,
    checkEarned: (data) => (data.questionLogs || []).reduce((acc, q) => acc + (q.solvedCount || 0), 0) >= 100,
    calcProgress: (data) => {
      const total = (data.questionLogs || []).reduce((acc, q) => acc + (q.solvedCount || 0), 0);
      return { current: Math.min(total, 100), target: 100, percent: Math.min(100, (total / 100) * 100), label: `${total.toLocaleString('tr-TR')}/100 Soru` };
    }
  },
  {
    key: 'question_1000',
    name: '⚙️ Soru Değirmeni',
    description: 'Toplam 1.000 soru barajını devirdin! Çözüm hızın artıyor.',
    category: 'question',
    tier: 'silver',
    iconType: 'gear',
    xpReward: 200,
    checkEarned: (data) => (data.questionLogs || []).reduce((acc, q) => acc + (q.solvedCount || 0), 0) >= 1000,
    calcProgress: (data) => {
      const total = (data.questionLogs || []).reduce((acc, q) => acc + (q.solvedCount || 0), 0);
      return { current: Math.min(total, 1000), target: 1000, percent: Math.min(100, (total / 1000) * 100), label: `${total.toLocaleString('tr-TR')}/1.000 Soru` };
    }
  },
  {
    key: 'question_5000',
    name: '⚡ Soru Kasırgası',
    description: '5.000 soru çözerek YKS soru tiplerinde uzmanlaştın.',
    category: 'question',
    tier: 'gold',
    iconType: 'hammer',
    xpReward: 500,
    checkEarned: (data) => (data.questionLogs || []).reduce((acc, q) => acc + (q.solvedCount || 0), 0) >= 5000,
    calcProgress: (data) => {
      const total = (data.questionLogs || []).reduce((acc, q) => acc + (q.solvedCount || 0), 0);
      return { current: Math.min(total, 5000), target: 5000, percent: Math.min(100, (total / 5000) * 100), label: `${total.toLocaleString('tr-TR')}/5.000 Soru` };
    }
  },
  {
    key: 'question_15000',
    name: '💎 Milyonluk Zihin',
    description: 'Tam 15.000 soru! Çelik gibi bir tecrübe ve refleks kazandın.',
    category: 'question',
    tier: 'legendary',
    iconType: 'diamond_sphere',
    xpReward: 1000,
    checkEarned: (data) => (data.questionLogs || []).reduce((acc, q) => acc + (q.solvedCount || 0), 0) >= 15000,
    calcProgress: (data) => {
      const total = (data.questionLogs || []).reduce((acc, q) => acc + (q.solvedCount || 0), 0);
      return { current: Math.min(total, 15000), target: 15000, percent: Math.min(100, (total / 15000) * 100), label: `${total.toLocaleString('tr-TR')}/15.000 Soru` };
    }
  },
  {
    key: 'question_target_7',
    name: '🏹 Günlük Seri Atıcı',
    description: 'Günlük soru hedefine en az 7 farklı günde başarıyla ulaştın.',
    category: 'question',
    tier: 'silver',
    iconType: 'target',
    xpReward: 250,
    checkEarned: (data) => {
      const targetMetDays = (data.questionLogs || []).filter(q => q.targetCount && q.targetCount > 0 && (q.solvedCount || 0) >= q.targetCount).length;
      return targetMetDays >= 7;
    },
    calcProgress: (data) => {
      const count = (data.questionLogs || []).filter(q => q.targetCount && q.targetCount > 0 && (q.solvedCount || 0) >= q.targetCount).length;
      return { current: Math.min(count, 7), target: 7, percent: Math.min(100, (count / 7) * 100), label: `${count}/7 Hedef Günü` };
    }
  },

  // 5. 📚 KAYNAK & KİTAP BİTİRİCİ (Resource Conqueror)
  {
    key: 'resource_first',
    name: '📕 İlk Sayfa',
    description: 'Takip etmek için ilk kaynak kitabını sisteme ekledin.',
    category: 'resource',
    tier: 'bronze',
    iconType: 'scroll',
    xpReward: 50,
    checkEarned: (data) => (data.resources || []).length >= 1,
    calcProgress: (data) => {
      const count = (data.resources || []).length;
      return { current: Math.min(count, 1), target: 1, percent: count >= 1 ? 100 : 0, label: `${Math.min(count, 1)}/1 Kaynak Kitap` };
    }
  },
  {
    key: 'resource_3',
    name: '🛡️ Kütüphane Şövalyesi',
    description: '3 farklı kaynak kitabı baştan sona %100 bitirdin.',
    category: 'resource',
    tier: 'silver',
    iconType: 'shield',
    xpReward: 300,
    checkEarned: (data) => (data.resources || []).filter(r => r.status === 'completed' || (r.totalUnits > 0 && r.completedUnits >= r.totalUnits)).length >= 3,
    calcProgress: (data) => {
      const count = (data.resources || []).filter(r => r.status === 'completed' || (r.totalUnits > 0 && r.completedUnits >= r.totalUnits)).length;
      return { current: Math.min(count, 3), target: 3, percent: Math.min(100, (count / 3) * 100), label: `${count}/3 Biten Kaynak` };
    }
  },
  {
    key: 'resource_10',
    name: '🏰 Kaynaklar Efendisi',
    description: 'Tam 10 kaynak kitabı bitirerek dev bir kütüphane fethettin!',
    category: 'resource',
    tier: 'gold',
    iconType: 'library_castle',
    xpReward: 700,
    checkEarned: (data) => (data.resources || []).filter(r => r.status === 'completed' || (r.totalUnits > 0 && r.completedUnits >= r.totalUnits)).length >= 10,
    calcProgress: (data) => {
      const count = (data.resources || []).filter(r => r.status === 'completed' || (r.totalUnits > 0 && r.completedUnits >= r.totalUnits)).length;
      return { current: Math.min(count, 10), target: 10, percent: Math.min(100, (count / 10) * 100), label: `${count}/10 Biten Kaynak` };
    }
  },

  // 6. ⏳ ODAKLANMA, RUTİN & POMODORO (Focus & Routines)
  {
    key: 'routine_1week',
    name: '⌛ Zaman Muhafızı',
    description: 'Tüm günlük rutinlerini (paragraf, problem vb.) 1 hafta eksiksiz uyguladın.',
    category: 'routine',
    tier: 'silver',
    iconType: 'hourglass',
    xpReward: 200,
    checkEarned: (data) => {
      const routines = data.routines || [];
      return routines.length > 0 && routines.some(r => (r.completedDays || []).length >= 5);
    },
    calcProgress: (data) => {
      const maxDays = Math.max(0, ...(data.routines || []).map(r => (r.completedDays || []).length));
      return { current: Math.min(maxDays, 5), target: 5, percent: Math.min(100, (maxDays / 5) * 100), label: `${maxDays}/5 Gün Tam Rutin` };
    }
  },
  {
    key: 'pomodoro_20',
    name: '🧘 Derin Odak Ustası',
    description: 'Toplamda en az 20 saat (1.200 dakika) net odaklanmış ders çalıştın.',
    category: 'routine',
    tier: 'gold',
    iconType: 'lotus',
    xpReward: 400,
    checkEarned: (data) => {
      const totalMinutes = Object.values(data.dailyStudyLogs || {}).reduce((acc, log) => acc + (log.minutes || 0), 0);
      return totalMinutes >= 1200;
    },
    calcProgress: (data) => {
      const totalMinutes = Object.values(data.dailyStudyLogs || {}).reduce((acc, log) => acc + (log.minutes || 0), 0);
      const hours = Math.round(totalMinutes / 60);
      return { current: Math.min(hours, 20), target: 20, percent: Math.min(100, (totalMinutes / 1200) * 100), label: `${hours}/20 Saat Çalışma` };
    }
  },
  {
    key: 'discipline_monument',
    name: '💎 Disiplin Anıtı',
    description: 'Toplam 100 saat net ders çalışma süresini aşarak disiplin anıtı diktin.',
    category: 'routine',
    tier: 'legendary',
    iconType: 'hologram_gem',
    xpReward: 1000,
    checkEarned: (data) => {
      const totalMinutes = Object.values(data.dailyStudyLogs || {}).reduce((acc, log) => acc + (log.minutes || 0), 0);
      return totalMinutes >= 6000; // 100 hours
    },
    calcProgress: (data) => {
      const totalMinutes = Object.values(data.dailyStudyLogs || {}).reduce((acc, log) => acc + (log.minutes || 0), 0);
      const hours = Math.round(totalMinutes / 60);
      return { current: Math.min(hours, 100), target: 100, percent: Math.min(100, (totalMinutes / 6000) * 100), label: `${hours}/100 Saat Çalışma` };
    }
  }
];

/**
 * Multi-source streak calculation:
 * Examines dailyStudyLogs, questionLogs, and completed studyPlans.
 */
export function calculateMotivationStats(studentData: YKSDataState): MotivationStats {
  const activeDates = new Set<string>();

  // 1. dailyStudyLogs (minutes > 0)
  Object.entries(studentData.dailyStudyLogs || {}).forEach(([dateStr, log]) => {
    if (log && log.minutes > 0) {
      activeDates.add(dateStr);
    }
  });

  // 2. questionLogs (solvedCount > 0)
  (studentData.questionLogs || []).forEach(q => {
    if (q.date && (q.solvedCount || 0) > 0) {
      activeDates.add(q.date.split('T')[0]);
    }
  });

  // 3. studyPlans (status === 'completed')
  (studentData.studyPlans || []).forEach(p => {
    if (p.status === 'completed' && p.date) {
      activeDates.add(p.date.split('T')[0]);
    }
  });

  const sortedDates = Array.from(activeDates).sort();
  const totalStudyDays = sortedDates.length;

  if (totalStudyDays === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalStudyDays: 0
    };
  }

  // Calculate streaks
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currDate = new Date(dateStr + 'T00:00:00');
    if (isNaN(currDate.getTime())) continue;

    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDate = currDate;
  }

  // Calculate current active streak relative to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let currentStreak = 0;
  if (activeDates.has(todayStr) || activeDates.has(yesterdayStr)) {
    // Walk backward from the latest active date
    let testDate = activeDates.has(todayStr) ? new Date(today) : new Date(yesterday);
    while (true) {
      const testStr = testDate.toISOString().split('T')[0];
      if (activeDates.has(testStr)) {
        currentStreak++;
        testDate.setDate(testDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastActiveDate: sortedDates[sortedDates.length - 1] || '',
    totalStudyDays
  };
}

/**
 * Checks all badge definitions and returns newly earned badges + updated full list
 */
export function evaluateBadges(studentData: YKSDataState): {
  newBadges: EarnedBadge[];
  allEarnedBadges: EarnedBadge[];
  stats: MotivationStats;
  totalXp: number;
} {
  const stats = calculateMotivationStats(studentData);
  const existingBadgesMap = new Map<string, EarnedBadge>();

  (studentData.earnedBadges || []).forEach(b => {
    existingBadgesMap.set(b.key, b);
  });

  const newBadges: EarnedBadge[] = [];
  const nowIso = new Date().toISOString();

  BADGE_DEFINITIONS.forEach(def => {
    if (!existingBadgesMap.has(def.key)) {
      const isMet = def.checkEarned(studentData, stats);
      if (isMet) {
        const newBadge: EarnedBadge = {
          key: def.key,
          earnedAt: nowIso
        };
        existingBadgesMap.set(def.key, newBadge);
        newBadges.push(newBadge);
      }
    }
  });

  const allEarnedBadges = Array.from(existingBadgesMap.values());

  // Calculate total gamification XP
  const totalXp = allEarnedBadges.reduce((acc, b) => {
    const def = BADGE_DEFINITIONS.find(d => d.key === b.key);
    return acc + (def?.xpReward || 0);
  }, 0);

  return {
    newBadges,
    allEarnedBadges,
    stats,
    totalXp
  };
}

// -------------------------------------------------------------
// CONTEXTUAL POSITIVE FEEDBACK ENGINE
// -------------------------------------------------------------

export interface MotivationEvent {
  type: 'plan_completed' | 'all_plans_completed' | 'mock_added' | 'branch_added' | 'topic_mastered' | 'question_goal_reached' | 'streak_greet';
  payload?: Record<string, any>;
}

export const DEFAULT_MOTIVATION_MESSAGES: Record<string, string> = {
  plan_completed: 'Harika! {subject} için {minutes} dk tamamlandı 💪 Bugün {count}. görevin bitti!',
  all_plans_completed: 'İnanılmaz! Bugünkü tüm planı eksiksiz bitirdin 🎉 Bunu başarmak ciddi disiplin ister, tebrikler!',
  tyt_mock_increase: 'Net artıyor! TYT\'de {oldNet} → {newNet} net 📈 Bu eğilimi sürdürürsen hedefine hızla yaklaşıyorsun.',
  tyt_mock_decrease: 'Bu deneme zorlamış olabilir, ama her deneme bir ders 🧠 Analiz bölümüne bakarak eksikleri kapatalım.',
  ayt_mock_increase: 'Güzel ilerleme! AYT\'de {oldNet} → {newNet} net 📈 Hedef bölümüne doğru emin adımlarla!',
  ayt_mock_decrease: 'AYT bu sefer zorlamış olabilir 🧠 Zayıf konuları analiz edip tekrara dönelim.',
  branch_mock_increase: '{subject} branş denemesinde {oldNet} → {newNet} net 🎯 {subject} giderek güçleniyor!',
  branch_mock_decrease: '{subject} bu seferlik zorlamış olabilir 🔍 Analiz sekmesinden yanlışlara bakalım.',
  topic_mastered: 'Süper! {topicName} konusunu özümsedin ⭐ Bu konudan soru gelse artık seni şaşırtamaz.',
  question_goal_reached: 'Günlük soru hedefi tamam! 🎯 {solved} soru çözüldü ({correct} Doğru). Harikasın!',
  streak_active: '🔥 {streak} günlük serin devam ediyor! Bugün de devam edelim.'
};

export function generateContextualFeedback(
  event: MotivationEvent,
  studentData: YKSDataState,
  customMessages?: Record<string, string>
): MotivationToastItem | null {
  const messages = { ...DEFAULT_MOTIVATION_MESSAGES, ...(customMessages || {}) };
  const p = event.payload || {};

  switch (event.type) {
    case 'plan_completed': {
      const subject = p.subject || 'Ders';
      const minutes = p.minutes || 45;
      const completedTodayCount = (studentData.studyPlans || []).filter(
        plan => plan.status === 'completed' && (!plan.date || plan.date === new Date().toISOString().split('T')[0])
      ).length;

      let msg = messages.plan_completed
        .replace('{subject}', subject)
        .replace('{minutes}', String(minutes))
        .replace('{count}', String(completedTodayCount || 1));

      return {
        id: 'toast-plan-' + Date.now(),
        type: 'plan',
        title: '🎯 Görev Tamamlandı!',
        message: msg,
        variant: 'emerald'
      };
    }

    case 'all_plans_completed': {
      return {
        id: 'toast-all-plans-' + Date.now(),
        type: 'plan',
        title: '🏆 Günlük Plan Tamamlandı!',
        message: messages.all_plans_completed,
        variant: 'gold'
      };
    }

    case 'mock_added': {
      const isTyt = p.examType === 'TYT' || (p.tytNet !== undefined && (p.aytNet === undefined || p.aytNet === 0));
      const newNet = Number(p.newNet || (isTyt ? p.tytNet : p.aytNet) || 0);
      const oldNet = Number(p.oldNet || 0);
      const hasPrevious = p.hasPrevious === true || oldNet > 0;

      if (isTyt) {
        if (!hasPrevious || newNet >= oldNet) {
          const template = messages.tyt_mock_increase;
          return {
            id: 'toast-mock-' + Date.now(),
            type: 'mock',
            title: '🚀 TYT Denemesi Kaydedildi!',
            message: template.replace('{oldNet}', oldNet.toFixed(1)).replace('{newNet}', newNet.toFixed(1)),
            variant: 'cyan'
          };
        } else {
          return {
            id: 'toast-mock-' + Date.now(),
            type: 'mock',
            title: '📝 TYT Denemesi Kaydedildi',
            message: messages.tyt_mock_decrease,
            variant: 'purple'
          };
        }
      } else {
        if (!hasPrevious || newNet >= oldNet) {
          const template = messages.ayt_mock_increase;
          return {
            id: 'toast-mock-' + Date.now(),
            type: 'mock',
            title: '⚡ AYT Denemesi Kaydedildi!',
            message: template.replace('{oldNet}', oldNet.toFixed(1)).replace('{newNet}', newNet.toFixed(1)),
            variant: 'cyan'
          };
        } else {
          return {
            id: 'toast-mock-' + Date.now(),
            type: 'mock',
            title: '📝 AYT Denemesi Kaydedildi',
            message: messages.ayt_mock_decrease,
            variant: 'purple'
          };
        }
      }
    }

    case 'branch_added': {
      const subject = p.subject || 'Branş';
      const newNet = Number(p.newNet || 0);
      const oldNet = Number(p.oldNet || 0);
      const hasPrevious = p.hasPrevious === true;

      if (!hasPrevious || newNet >= oldNet) {
        const template = messages.branch_mock_increase;
        return {
          id: 'toast-branch-' + Date.now(),
          type: 'mock',
          title: `🎯 ${subject} Branş Denemesi`,
          message: template.replace('{subject}', subject).replace('{oldNet}', oldNet.toFixed(1)).replace('{newNet}', newNet.toFixed(1)),
          variant: 'cyan'
        };
      } else {
        const template = messages.branch_mock_decrease;
        return {
          id: 'toast-branch-' + Date.now(),
          type: 'mock',
          title: `📊 ${subject} Branş Denemesi`,
          message: template.replace('{subject}', subject),
          variant: 'purple'
        };
      }
    }

    case 'topic_mastered': {
      const topicName = p.topicName || 'Konu';
      const template = messages.topic_mastered;
      return {
        id: 'toast-topic-' + Date.now(),
        type: 'topic',
        title: '⭐ Konuda Uzmanlaştın!',
        message: template.replace('{topicName}', topicName),
        variant: 'gold'
      };
    }

    case 'question_goal_reached': {
      const solved = p.solved || 0;
      const correct = p.correct || 0;
      const template = messages.question_goal_reached;
      return {
        id: 'toast-q-goal-' + Date.now(),
        type: 'question',
        title: '🎯 Soru Hedefi Aşıldı!',
        message: template.replace('{solved}', String(solved)).replace('{correct}', String(correct)),
        variant: 'emerald'
      };
    }

    case 'streak_greet': {
      const streak = p.streak || 1;
      const template = messages.streak_active;
      return {
        id: 'toast-streak-' + Date.now(),
        type: 'streak',
        title: '🔥 Çalışma Serisi!',
        message: template.replace('{streak}', String(streak)),
        variant: 'amber'
      };
    }

    default:
      return null;
  }
}
