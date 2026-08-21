export interface RecommendedBook {
  subject: string;
  category: string;
  publisher: string;
  name: string;
  difficulty: string;
  difficultyValue: number;
  reason: string;
  isPopular: boolean;
}

export const RECOMMENDED_BOOKS: RecommendedBook[] = [
  // --- TYT MATEMATİK ---
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Antrenmanlarla Matematik',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Temel işlem yeteneği kazandıran ve sıfırdan başlayanlar için en popüler kaynak.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Doktrin',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Sıfırdan zirveye konseptiyle adım adım öğreten temel seviye kaynak.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Hocalara Geldik',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Kanal anlatımıyla paralel ilerleyen temel pratik ve pekiştirme soruları.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Karekök',
    name: 'Sıfır Matematik',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Karekök kalitesiyle matematikte hiç temeli olmayanlar için köprü görevi görür.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'KİNG',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Hız ve işlem yeteneği kazanmak için pratik seviye başlangıç kaynağı.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Okyanus',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: '40 seansta mantığıyla ünite ünite parçalanmış, kolay öğrenim sağlayan düzen.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Şenol Hoca',
    name: 'Merhaba TYT',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Şenol Hoca\'nın sade diliyle matematiğe merhaba dedirten başlangıç kitabı.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: '345',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Her seviyeden test barındıran, ÖSYM tarzı yeni nesil soruların öncüsü.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Benim Hocam',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'İlyas Güneş videoları ile entegre, bol soru tipli klasik orta seviye kaynak.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Bilgi Sarmal',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'ÖSYM standartlarında sarmal denemeler ve testler sunan en dengeli kitap.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Birey',
    name: 'TYT Matematik B Gelişim',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Konu kavrama testleri ile orta düzey pekiştirme sağlayan klasikleşmiş soru bankası.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Hız ve Renk',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Süre barometreli testleriyle hızlanmak ve zaman yönetimi kazanmak için ideal.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'KR Akademi',
    name: 'Eyüp B. TYT Matematik Soru Bankası 2026',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Eyüp B.\'nin video çözümleriyle zenginleştirilmiş, bakış açısı katan özgün anlatım.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Orijinal',
    name: 'Mikro TYT',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Orijinal kalitesinde başlangıç-orta seviye geçiş soruları barındırır.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Rehber Matematik',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Mehmet Hoca ile aktif öğrenme, bebek adımlarıyla orta seviyeye geçiş.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Yayın Denizi',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Hız ve pratik kazandıran, video çözümlü zengin soru bankası.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Endemik',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Klasikleşmiş ÖSYM sorularını analiz eden, muhakeme gücü isteyen kaynak.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Karekök',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Klasik zor soruların adresi, matematiksel alt yapıyı üst seviyeye çıkarır.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Limit',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Sözel-sayısal mantık ve seçici yeni nesil problemler barındırır.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Orijinal',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Yorum gücü gerektiren ÖSYM tarzının zirvelerinden olan yeni nesil SB.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Palme',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Konu özetleriyle destekli, bilimsel ve analitik yaklaşım katan klasik.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: '3D',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Bire bir ÖSYM testleri ve simülasyon testleriyle tam sınav zorluğunda.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Acil',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Yaratıcı ve ezber bozan bakış açıları içeren, ileri düzey problem ve işlem kitabı.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Matematik',
    publisher: 'Apotemi',
    name: 'TYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Konu maraton testleriyle limitleri zorlayan, derece isteyenlere hitap eden kitap.',
    isPopular: true
  },

  // --- TYT PROBLEMLER ---
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Antrenman Hiç Problem değil',
    name: 'Problemler Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Problemleri sıfırdan adım adım sevdiren ve yöntem öğreten kolay seviye kitap.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Doktrin',
    name: 'Sıfırdan Problemler',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Yazarak ve boşlukları doldurarak problem çözme mantığı kazandıran başlangıç.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Tonguç',
    name: 'Problematik',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Süre ve test bazlı, pratik, yormayan başlangıç seviye problem kitabı.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Şenol Hoca',
    name: 'Çıtır Çerez Problemler',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Matematiğin sözel dilini işlem diline dökmede kolay aşamalı çalışma.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Arı',
    name: 'Problemlerin Ritmi',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Rutin ve rutin olmayan problemlerin ritmini yakalatan popüler orta seviye.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Benim Hocam',
    name: 'TYT Problemler Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sınav formatına uyumlu klasikleşmiş ve yeni nesil problem soruları.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Marka',
    name: 'YouTube Hocam Problemler',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sıcak bölge testleri ve pratik ipuçlarıyla problem çözüm yolları.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Rehber Matematik',
    name: '321 Problemler Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Yöntem ve taktikler sunan, rehberlik odaklı problem kitabı.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Tonguç',
    name: 'Problematik S',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Seviyeyi bir tık üste taşıyan, görsel ağırlıklı yeni nesil problemler.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Toprak',
    name: 'TYT Problemler Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Kurgusal yeni nesil sorulardan oluşan, net artırıcı orta seviye SB.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Çap',
    name: 'Problemler Fasikülü',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Hibrit testler ve konu özetleriyle sistemli problem fasikülü.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Bilgi Sarmal',
    name: 'TYT Problemler Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Sarmal deneme testleri içeren ve sınav provası yaptıran çok yönlü kitap.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Endemik',
    name: 'TYT Problemler Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Seçici, analitik düşünme yetisini tetikleyen kaliteli soru havuzu.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Karekök',
    name: 'Rutin Olmayan Problemler',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Sayısal mantık ve sıra dışı ÖSYM tarzı zor problemler.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Okyanus',
    name: 'TYT Master Problemler',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Master seviyede yeni nesil paragrafik problem çözümleri.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Acil',
    name: 'Problemler Deposu',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Zorlayıcı denemeler ve üst düzey analiz gerektiren efsane problem kitabı.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'TYT Problemler',
    publisher: 'Apotemi',
    name: 'Problemler Fasikülü',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Problemlerde derece yapmak isteyenlerin çözmesi gereken en meşhur zor fasikül.',
    isPopular: true
  },

  // --- AYT MATEMATİK ---
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Aktif',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'AYT konularının temelini adım adım atan, işlem öncelikli başlangıç kitabı.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Karekök',
    name: 'AYT Sıfır Matematik',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Karekök metodolojisi ile sıfırdan AYT formüllerini ve mantığını kavratır.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Tonguç',
    name: '0 dan AYT Matematik',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Görsel ve video destekli adımlarla AYT konularına kolay bir başlangıç.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Şenol Hoca',
    name: 'Merhaba AYT',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Lise son ve mezunlar için kafa karıştırmadan sade anlatımlı pratik kitap.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Aydın',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Müfredatı tam kapsayan konu tarama testleri ve kaliteli sorular.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Bilgi Sarmal',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'ÖSYM tarzı testleri sarmal tekrarlarla birleştiren en ideal orta seviye.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Limit',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Bilgi ağırlıklı AYT sorularıyla analiz yeteneğini artıran SB.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Orijinal',
    name: 'Mikro AYT',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Orijinal sorularına ısınmanızı sağlayan basitten zora geçiş kitabı.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Paraf',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Yeni sınav sistemine uyumlu grafiksel ve sözel muhakeme soruları.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Yayın Denizi',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Zengin çözümlü soru bankası ile konuyu pratikleştirir.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Çap',
    name: 'AYT Matematik Hibrit SB',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Konu özetleri ve standart-yeni nesil soru sentezi.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: '345',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'AYT için adeta klasikleşmiş, basitten en zor simülasyonlara giden başucu kitabı.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: '3D',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'ÖSYM formatında zekice hazırlanmış yeni nesil kurgusal sorular.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Acil',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Yoğun işlem yeteneği ve üst seviye matematik disiplini kazandırır.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Acil',
    name: 'AYT Reaksiyon Denemeleri',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Zaman sınırlı pratikler için tasarlanmış branş denemeleri.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Benim Hocam',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'AYT video ders notlarıyla entegre çalışan derinlemesine konu taraması.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Endemik',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Analitik çözümler gerektiren, ÖSYM standartlarının bir tık üstündeki sorular.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Full',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Tüm konu detaylarını kapsayan geniş hacimli soru havuzu.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Karaağaç',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Matematikte derinleşmek isteyenler için klasik ve yeni tarz soruların harmanı.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Karekök',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'AYT limit-türev-integral ve trigonometri konularında en köklü ve zorlayıcı klasik.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Mert Hoca',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Mert Hoca kamplarıyla uyumlu, ÖSYM ayarı yeni nesil sorular.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Metin',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Orijinal felsefeyle tasarlanmış, akıl yürütme gerektiren seçici sorular.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Acil',
    name: 'Logaritma-Diziler Fasikülü',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Logaritma ve dizilerde çıkabilecek en zor ve seçici soruların toplandığı kitap.',
    isPopular: false
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Apotemi',
    name: 'AYT Konu Fasikülleri',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Limit, Türev, İntegral ve Trigonometride Türkiye derecesi hedefleyenlerin çözdüğü efsane zor fasiküller.',
    isPopular: true
  },
  {
    subject: 'Matematik',
    category: 'AYT Matematik',
    publisher: 'Orijinal',
    name: 'AYT Matematik Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Ufuk açıcı, üst düzey matematiksel düşünme ve yorumlama becerisi kazandırır.',
    isPopular: true
  },

  // --- TYT-AYT GEOMETRİ ---
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Antrenmanlarla Geometri',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Geometrisi sıfır olanların kalemi eline almasını sağlayan ilk adım kitabı.',
    isPopular: true
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Doktrin',
    name: 'Sıfırdan Geometri',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Görsel pekiştirmelerle geometrik kavramları en baştan öğreten kaynak.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Karekök',
    name: 'Geometri Sıfır',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Köşe taşı sistemiyle geometride pratik işlem yeteneği kazandırır.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Okyanus',
    name: '40 Seansta Geometri',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Konuları 40 bağımsız adıma bölerek kolayca bitirme imkanı sunar.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Tonguç',
    name: '0 dan Geometri',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Tonguç tarzıyla eğlenceli, renkli ve sade geometri başlangıcı.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Şenol Hoca',
    name: 'Merhaba Geometri',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Yeni nesil görsellere geçişte ilk adımı attıran kolay kılavuz.',
    isPopular: true
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Endemik',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Orta seviyede şekil yorumlama ve sınav ayarı sorular içerir.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'EİS',
    name: 'Geometri Başlangıç',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Ders föyleriyle paralel, konu sırasına göre dengeli testler.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Metin',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Müfredata uygun orta düzey şekilli ve yeni nesil testler.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Palme',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Klasik Palme kalitesi ile analitik ve düzlemsel geometri testleri.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Paraf',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sınavda çıkabilecek günlük yaşam kurgulu özgün sorular.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Tonguç',
    name: '7 Adımda Geometri',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Yedi aşamada geometri becerilerini geliştirmeyi hedefleyen planlı SB.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Aydın',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Kavramları derinleştiren, bakış açısı gerektiren kaliteli geometri SB.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Benim Hocam',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Görkem Hoca video kamplarına uygun, zengin içerikli orta-üst seviye.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Bilgi Sarmal',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Hem TYT hem de AYT için ÖSYM çizgisine en yakın, sarmal yapıda vazgeçilmez kaynak.',
    isPopular: true
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Hız ve Renk',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Süre tutarak geometri hızını artırmak isteyenlere özel renkli testler.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Karekök',
    name: 'Geometri Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Klasik ve geometride ispat mantığını öğreten, alt yapıyı güçlendiren klasik.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Kenan Kara',
    name: 'Geometri Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Kenan Kara ile Geometri kampıyla %100 uyumlu başucu kitabı.',
    isPopular: true
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Yayın Denizi',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Yeni nesil katlama, döndürme ve kesme sorularını bolca bulundurur.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Çap',
    name: 'Geometri Fasikülleri',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Konu konu ayrılmış, pratik çözümler ve bol alıştırmalı fasiküller.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: '3D',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Simülasyon testleriyle tam sınav zorluğunda, 3 boyutlu düşünme yetisi kazandıran başyapıt.',
    isPopular: true
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Apotemi',
    name: 'Geometri Fasikülleri',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Üst düzey zorlayıcı, ispat ve şekil analizi yaptıran en üst düzey set.',
    isPopular: true
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Karekök',
    name: 'Geometri Zoru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Geometride sınırları zorlayan, en seçici olimpiyat tarzı soruların adresi.',
    isPopular: false
  },
  {
    subject: 'Geometri',
    category: 'TYT-AYT Geometri',
    publisher: 'Orijinal',
    name: 'TYT-AYT Geometri Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Yeni nesil soruların zirvesi, orijinal çözümleriyle geometride son nokta.',
    isPopular: true
  },

  // --- TYT TÜRKÇE ---
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Paraf',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Dil bilgisi ve okuma-anlamayı basitleştirerek sunan ilk adım kaynağı.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Yayın Denizi',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Konu testleriyle dil bilgisini pekiştiren, video çözümlü kolay SB.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Deneme Deposu',
    name: 'TYT Türkçe Denemeleri',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Branş bazında hızlanmayı ve net takibi yapmayı kolaylaştıran denemeler.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Hız ve Renk',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Hız kazandırmaya yönelik süre tutmalı test kurgusu ile popüler kaynak.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Karekök',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Klasikleşmiş dil bilgisi sorularıyla temel kuralları öğreten SB.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Kronometre',
    name: 'TYT Türkçe Paragraf SB',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sınav formatındaki süre kısıtlı pratikler için mükemmel zaman ayarlı kaynak.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Okyanus',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'ÖSYM standartlarında konu pekiştirme ve kelime haznesi geliştirme.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: '345',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Hem dil bilgisi hem paragraf dengesini mükemmel kuran sınav ayarı başucu eseri.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Benim Hocam',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Kadir Gümüş video anlatımlarıyla birebir paralel, her konuyu didikleyen SB.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Bilgi Sarmal',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'ÖSYM dil bilgisi ve paragraf sarmal yapısını en iyi analiz eden popüler kaynak.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Toprak',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Kavramsal kurguları ve kaliteli kelime oyunları olan seçici kitap.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Çap',
    name: 'TYT Türkçe Hibrit SB',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Fasikül sistemli, konu pekiştirmeli ve taramalı sistem.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: '3D',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Sınırları zorlayan kafa karıştırıcı dil bilgisi ve paragraflarıyla derece öğrencileri için.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Türkçe',
    publisher: 'Limit',
    name: 'TYT Türkçe Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Edebiyat ve Türkçe konusunda en köklü, zor ve detaylı bilgi barındıran kaynak.',
    isPopular: true
  },

  // --- TYT PARAGRAF ---
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Antrenmanlarla Paragraf',
    name: 'TYT Paragraf Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Okuma alışkanlığı ve paragraf çözme ritmi kazandıran sıfır seviyesi.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Arı',
    name: 'Paragrafın Ritmi',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Paragrafta soru tiplerini sınıflandırarak çözen, Türkiye\'nin en popüler paragraf kitabı.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Hız ve Renk',
    name: 'Hız ve Renk Paragraf SB',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Süre tutarak odaklanma süresini ve okuma hızını artırır.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Marka',
    name: 'Paragraf Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Kolay okunabilir ve anlaşılır, seviye seviye ilerleyen başlangıç.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Pelikan Rüştü Hoca',
    name: 'Paragraf Taktikleri',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Rüştü Hoca\'nın tescilli taktikleriyle paragraf çözüm yolları.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Tonguç',
    name: 'Paragrafik',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Görsel, infografik ve yeni nesil paragraf sorularına giriş.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Arı',
    name: 'Paragraf Denemeleri',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Her gün çözülmesi gereken, hızı ve kelime dağarcığını geliştiren denemeler.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Benim Hocam',
    name: 'Paragraf Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'ÖSYM diline ve felsefesine yakın konulardan derlenmiş testler.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Sınav Dergisi',
    name: 'Paragraf Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Geniş konu dağılımı ile farklı tarzlarda metinler barındırır.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Tonguç',
    name: 'Paragrafik S',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sınav temposunda, bir tık daha uzun ve yoruma dayalı paragraflar.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Bilgi Sarmal',
    name: 'Paragraf Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Süre ve net analiziyle destekli, Türkiye genelinde çok çözülen dengeli kaynak.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Endemik',
    name: 'Paragraf Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Yazar, felsefe ve bilim odaklı ağır metinlerden oluşan seçici SB.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Palme',
    name: 'Paragraf Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Metin analiz yeteneğini güçlendiren, Palme kalitesinde sorular.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Paragrafın Şifresi',
    name: 'Metot Paragraf',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Paragrafları formüller ve yöntemlerle çözen popüler taktik kitabı.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Paragrafın Şifresi',
    name: 'Modüler Paragraf',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Modül modül bölünmüş, yoğun ve seçici soru yapısı.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Pelikan',
    name: 'Paragraf Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Derin okuma gerektiren ve odaklanmayı güçlendiren uzun metinler.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Çap',
    name: 'Muhteşem Üçlü Paragraf',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Anlam, yapı ve yorum gücü olarak üç aşamalı mükemmel sistem.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: '3D',
    name: 'Paragraf Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'ÖSYM sınavlarında süreyi eriten en zorlayıcı, çoklu paragraf soruları.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Karekök',
    name: 'Paragraf Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Soyut kavramlar ve ağır edebi metinler barındıran üst düzey zorluk.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'TYT Paragraf',
    publisher: 'Kronometre',
    name: 'Limit Paragraf SB (Zor)',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Limit zorluğunda, adeta Türkçe netlerinin sınırlarını belirleyen başyapıt.',
    isPopular: true
  },

  // --- TYT FİZİK ---
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Aktif',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Hiç fiziğim yok diyenlere fiziği sevdiren, işlem ve kavram öncelikli kolay kitap.',
    isPopular: true
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Antrenmanlarla Fizik',
    name: 'Fizik Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Basit adımlarla fizik kurallarını ve temel formüllerini oturtur.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Okyanus',
    name: '40 Seansta TYT Fizik',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: '40 ayrı derste TYT fiziğin tamamını kolayca bitirmenizi sağlayan SB.',
    isPopular: true
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Doktrin',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sıfırdan başlayıp orta düzeye getiren, konu anlatım destekli pratik SB.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Karekök',
    name: 'Fizik Sıfır',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Klasik Karekök yöntemi ile temel düzey fizik formüllerini pratikleştirir.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Kriter Akademi',
    name: 'TYT-AYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'YKS öncesi harika bir tarama ve video çözümlü pekiştirme.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Tonguç',
    name: 'TYT Fizik Dinamo',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Aktivasyonlu, video çözümlü, okul ve sınav müfredatıyla uyumlu.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: '345',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'ÖSYM tarzı günlük hayat senaryolarına dayanan soruların en popüler adresi.',
    isPopular: true
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Aydın',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Aydın kalitesi ile kavram yanılgılarını düzelten mükemmel bilimsel içerik.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Benim Hocam',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Barış Hoca videolarına tam uyumlu, akıcı ve müfredata tam sadık kitap.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Bilgi Sarmal',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Denemeler ve konu testleriyle en dengeli ve ÖSYM sınav diline en yakın kaynak.',
    isPopular: true
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Palme',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Özellikle fen liseleri ve yüksek net hedefleyen sayısalcılar için bilimsel klasik.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Toprak',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Yeni nesil günlük yaşam kurgulu, yormayan orta-üst seviye SB.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'VIP Fizik',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Kemal Hoca\'nın VIP Fizik kanal kamplarıyla tam entegre çalışan harika SB.',
    isPopular: true
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: '3D',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Deneysel, ÖSYM üstü zorlukta yorum ve analiz isteyen en seçici fizik kitabı.',
    isPopular: true
  },
  {
    subject: 'Fizik',
    category: 'TYT Fizik',
    publisher: 'Limit',
    name: 'TYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Bilgi ve teori odaklı, zor sorularla kavram süzgeci oluşturan kaynak.',
    isPopular: false
  },

  // --- TYT KİMYA ---
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Aktif',
    name: 'TYT Kimya Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Kimya terimlerini sıfırdan öğreten, kavram eşleştirmeli kolay kitap.',
    isPopular: true
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Antrenmanlarla Kimya',
    name: 'Kimya Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Kimyada hiç temeli olmayanlar için formülleri basitleştiren kitap.',
    isPopular: false
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Okyanus',
    name: '40 Seansta TYT Kimya',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Adım adım üniteleri bölen, pratik ve hızlı tekrar yaptıran SB.',
    isPopular: false
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Tonguç',
    name: 'Konu Özetli Kimya',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Görsel kartlar ve sade konu özetleriyle kimya başlangıcı.',
    isPopular: false
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Tonguç',
    name: 'Kimya Dinamo',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Yazılı ve TYT sınavlarına uygun, çözümlü soru bankası.',
    isPopular: false
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Benim Hocam',
    name: 'TYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Görkem Şahin video kamplarıyla %100 paralel, Türkiye geneli çok popüler kaynak.',
    isPopular: true
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Bilgi Sarmal',
    name: 'TYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sarmal testleri ve ÖSYM tarzı ünite denemeleriyle en dengeli orta seviye.',
    isPopular: true
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: '345',
    name: 'TYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Günlük hayat kimyası ve seçici deney soruları barındıran başucu kitabı.',
    isPopular: true
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Aydın',
    name: 'TYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Kimyada ekol olan Aydın kalitesi, kavramları derinleştirir.',
    isPopular: true
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Karekök',
    name: 'TYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Kimya teorilerini ve laboratuvar kurallarını test eden köklü kaynak.',
    isPopular: false
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: '3D',
    name: 'TYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'ÖSYM üstü, çoklu öncüllü ve kafa karıştırıcı reaksiyon soruları.',
    isPopular: true
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Limit',
    name: 'TYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Ayrıntılı bilgi ve kavram süzgeci oluşturan en zor kimya kitaplarından biri.',
    isPopular: false
  },
  {
    subject: 'Kimya',
    category: 'TYT Kimya',
    publisher: 'Palme',
    name: 'TYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Bilimsel derinliği en fazla olan, organik ve genel kimyayı pekiştiren efsane.',
    isPopular: true
  },

  // --- TYT BİYOLOJİ ---
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Antrenmanlarla Biyoloji',
    name: 'Biyoloji Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Sözel ezberleri ve terimleri sıfırdan basitleştirerek sunan ilk adım.',
    isPopular: false
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Karekök',
    name: 'Biyoloji Sıfır',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Konu kavrama şemalarıyla biyoloji temeli oluşturan klasik kaynak.',
    isPopular: true
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Tonguç',
    name: 'TYT Biyoloji Dinamo',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Sadeleştirilmiş, yeni nesil görsel sorulardan oluşan başlangıç SB.',
    isPopular: false
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Benim Hocam',
    name: 'TYT Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sınav formatındaki konu şemaları ve video ders notlarıyla tam uyumlu.',
    isPopular: false
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Biyotik',
    name: 'TYT Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sadece biyoloji üzerine odaklanmış yayının, müfredatla %100 uyumlu harika eseri.',
    isPopular: true
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Eğitim Vadisi',
    name: 'Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Modüler test yapısıyla pekiştirme ve tarama sağlayan kaynak.',
    isPopular: false
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Fen Bilimleri',
    name: 'Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Okul dersleri ve TYT için müfredata tam sadık klasik soru bankası.',
    isPopular: false
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Fundamentals',
    name: 'TYT Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Fundamentals Biyoloji kanal kamplarıyla tam paralel ilerleyen popüler kaynak.',
    isPopular: true
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Palme',
    name: 'TYT Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Biyolojide adeta bir ekol olan, hem bilgi hem yorumu mükemmel harmanlayan klasik.',
    isPopular: true
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: '345',
    name: 'TYT Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Görsel ve deneysel tablolarla süslenmiş, ÖSYM tadında seçici sorular.',
    isPopular: true
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Karekök',
    name: 'TYT Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Öncüllü ve çeldiricisi yüksek klasik biyoloji soruları barındırır.',
    isPopular: false
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Apotemi',
    name: 'Biyoloji Fasikülleri',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Sistemler ve hücre konularında en zorlayıcı, derece adayları için tasarlanmış kaynak.',
    isPopular: true
  },
  {
    subject: 'Biyoloji',
    category: 'TYT Biyoloji',
    publisher: 'Aydın',
    name: 'TYT Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'ÖSYM üstü, kafa karıştıran kavramsal derinlikteki en zor biyoloji SB.',
    isPopular: true
  },

  // --- TYT TARİH ---
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Okyanus',
    name: '40 Seansta Tarih',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Tarih yorumlarını ve kronolojiyi sıfırdan adım adım sevdiren başlangıç.',
    isPopular: true
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Tonguç',
    name: 'TYT Tarih Dinamo',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'ÖSYM\'nin sormayı sevdiği temel paragraf ve yorumlama testleri.',
    isPopular: false
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Delta Kültür',
    name: 'Özet Tarih SB',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Tarih kavramlarını ve savaşlar kronolojisini özet kartlarla öğreten kaynak.',
    isPopular: false
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Karekök',
    name: 'TYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Müfredat kazanımlarıyla tam uyumlu, klasikleşmiş tarih soruları.',
    isPopular: false
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Kurul',
    name: 'Tarih Özet El Kitabı',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Haritalarla ve tablolarla zenginleştirilmiş hızlı tekrar el kitabı.',
    isPopular: true
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Paraf',
    name: 'TYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sınav dilindeki paragrafik tarih yorum sorularından oluşan SB.',
    isPopular: false
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Yayın Denizi',
    name: 'TYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Konu testleriyle tarih bilincini ve yorumlama hızını artıran kitap.',
    isPopular: false
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Çap',
    name: 'TYT Tarih Hibrit SB',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Konu anlatım özetli ve tarama testli hibrit tarih soru bankası.',
    isPopular: false
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: '345',
    name: 'TYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Tarih dersinde ÖSYM tarzı yeni nesil yorum ve öncül soruların öncüsü.',
    isPopular: true
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Benim Hocam',
    name: 'TYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Ramazan Yetgin videoları ile birebir uyumlu, bilgi ve yorum sentezi efsane kaynak.',
    isPopular: true
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Palme',
    name: 'TYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Konu bazlı detay bilgileri soru üzerinde öğreten Palme klasiği.',
    isPopular: false
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Pomodoro',
    name: 'Tarih Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Pomodoro zamanlama tekniğiyle planlanmış pratik tarih SB.',
    isPopular: false
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: '3D',
    name: 'TYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Sınavda çıkabilecek en zor ve kafa karıştırıcı kronoloji/yorum soruları.',
    isPopular: true
  },
  {
    subject: 'Tarih',
    category: 'TYT Tarih',
    publisher: 'Limit',
    name: 'TYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Sözelciler ve derece isteyenler için en detaylı bilgi ve kronoloji barındıran zirve.',
    isPopular: true
  },

  // --- TYT COĞRAFYA ---
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: 'Kurul',
    name: 'Coğrafya Özet El Kitabı',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Haritalarla ve tablolarla coğrafya konularını hızlıca sevdiren başlangıç.',
    isPopular: true
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: 'Tonguç',
    name: 'TYT Coğrafya Dinamo',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Sınav müfredatına uygun harita yorumlama ve kavram başlangıcı.',
    isPopular: false
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: 'Biders',
    name: 'TYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sınav öncesi pratik konu testleriyle eksikleri kapatan SB.',
    isPopular: false
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: 'Delta Kültür',
    name: 'Özet Coğrafya SB',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Kavram ve harita okumayı kolaylaştıran kompakt test yapısı.',
    isPopular: false
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: 'Editör',
    name: 'TYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Müfredat kazanımlarıyla tam uyumlu, geniş soru yelpazeli orta düzey SB.',
    isPopular: false
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: 'Palme',
    name: 'TYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Klasik Palme kalitesiyle iklim ve yer şekilleri konularında öğretici testler.',
    isPopular: false
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: '345',
    name: 'TYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Sınav formatındaki en özgün harita ve grafik yorum sorularını içeren popüler SB.',
    isPopular: true
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: 'Benim Hocam',
    name: 'TYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Bayram Meral videoları ile tam uyumlu, harita destekli çok yönlü kaynak.',
    isPopular: true
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: 'Bilgi Sarmal',
    name: 'TYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Harita, grafik ve nüfus piramitlerini mükemmel analiz eden dengeli SB.',
    isPopular: true
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: 'Yayın Denizi',
    name: 'TYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Müfredata uygun güncel coğrafi veriler içeren video çözümlü SB.',
    isPopular: false
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: 'Çap',
    name: 'TYT Coğrafya Hibrit SB',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Harita okuma ve doğal afet/iklim yorumlama odaklı harika fasiküller.',
    isPopular: false
  },
  {
    subject: 'Coğrafya',
    category: 'TYT Coğrafya',
    publisher: '3D',
    name: 'TYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'ÖSYM üstü harita detayları ve iklim teorileri içeren en zorlayıcı coğrafya SB.',
    isPopular: true
  },

  // --- TYT FELSEFE ---
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Kurul',
    name: 'Felsefe Özet El Kitabı',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Felsefi terimleri ve düşünürleri şematik olarak sevdiren hızlı başlangıç.',
    isPopular: true
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Tonguç',
    name: 'Dinamo Felsefe SB',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Temel kavramları ve akımları okul müfredatına uygun test eden SB.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Data',
    name: 'Felsefe Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Akımlar ve filozoflar üzerine pratik konu tarama testleri sunar.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Delta Kültür',
    name: 'Tyt Felsefe Özet SB',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sözel ezberleri kolaylaştıran özet kart formatlı felsefe testi.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Merkez',
    name: 'TYT Felsefe Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sınav müfredatına uygun paragrafik felsefe yorum testleri.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Okyanus',
    name: '40 Seansta Felsefe',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Felsefe ünitelerini parçalara bölerek sıkılmadan bitirmeyi sağlayan SB.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Pomodoro',
    name: 'Felsefe Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: '25 dakikalık odaklanma süreleriyle bitirilebilecek planlı pratik.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Benim Hocam',
    name: 'TYT Felsefe Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Konu anlatım videoları ile tam uyumlu, bilgi ve akıl yürütme soruları.',
    isPopular: true
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'ENS',
    name: 'Destek Felsefe SB',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Konu kavratma ve sarmal test dengesiyle orta-üst seviye pratik.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Hocalara Geldik',
    name: 'TYT Felsefe Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Farklı filozofların görüşlerini harmanlayan, yorum gücünü sınayan SB.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Simya Dergisi',
    name: 'Felsefe Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Köklü soru yapısı ile felsefi akımları derinlemesine analiz eder.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Supara Yayınları',
    name: 'TYT Felsefe Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Müfredatla tam uyumlu, zorlayıcı öncüllere sahip kaliteli SB.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: '3D',
    name: 'TYT Felsefe Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Ağır felsefi paragraflar içeren, gerçek sınavda süre kaybettiren cinsten zor sorular.',
    isPopular: true
  },
  {
    subject: 'Felsefe',
    category: 'TYT Felsefe',
    publisher: 'Soru Kalesi',
    name: 'Felsefe Zoru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'En çeldirici felsefe öncülleriyle kafa yoran, derece isteyenlere özel kaynak.',
    isPopular: false
  },
  
  // --- AYT EDEBİYAT (Subject: Türkçe) ---
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'Okyanus',
    name: '40 Seansta AYT Edebiyat',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Sıfırdan başlayanlar için üniteleri parçalara ayırarak kolay öğrenim sağlayan SB.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'Karekök',
    name: 'AYT Edebiyat Sıfır',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Edebiyata yeni başlayanlar için temel kavramları ve dönemleri basitleştirerek sunan rehber.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'Pelikan',
    name: 'Rüştü Hoca ile Taktiklerle Edebiyat Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Rüştü Hoca\'nın akılda kalıcı taktikleri ve özel kodlama tablolarıyla desteklenmiş popüler SB.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'Benim Hocam',
    name: 'AYT Türk Dili ve Edebiyatı Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Kadir Gümüş video kampları ile %100 entegre, bol soru tipli kaynak.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: '345',
    name: 'AYT Türk Dili ve Edebiyatı Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Basitten zora seviyelendirilmiş, ÖSYM tarzı güncel yeni nesil sorular.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'Hız ve Renk',
    name: 'AYT Edebiyat Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Süre barometreli testleriyle edebi dönem taramalarında hız ve pratiklik kazandırır.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'KR Akademi',
    name: 'AYT Edebiyat Poster Notlar',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Görsel hafıza teknikleri ve zihin haritalarıyla tüm edebiyat dönemlerini özetleyen harika çalışma kaynağı.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'Bilgi Sarmal',
    name: 'AYT Türk Dili ve Edebiyatı Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'ÖSYM tarzına en yakın, sarmal tekrarlı mükemmel dengeli kitap.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'Paraf',
    name: 'AYT Edebiyat Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Zengin yazar-eser ve metin analizi sorularıyla ÖSYM sınav diline birebir uygun seçici SB.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'Palme',
    name: 'AYT Edebiyat Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Edebiyatta geniş tarama ve bilgi sorularıyla pekiştirme sağlayan klasikleşmiş kaynak.',
    isPopular: false
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'Limit',
    name: 'AYT Türk Dili ve Edebiyatı Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Edebiyatta en detaylı, derece yaptıran ve bilgi dolu başucu kaynağı.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: '3D',
    name: 'AYT Edebiyat Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Bire bir ÖSYM soruları ve simülasyon testleriyle edebiyatta zirveyi hedefleyenlerin çözmesi gereken kaynak.',
    isPopular: true
  },
  {
    subject: 'Türkçe',
    category: 'AYT Edebiyat',
    publisher: 'Apotemi',
    name: 'AYT Edebiyat Konu Fasikülleri',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Derin edebi akımlar, sanatçılar ve dönem detaylarıyla derece hedefleyenlere özel ağır set.',
    isPopular: false
  },

  // --- AYT FİZİK ---
  {
    subject: 'Fizik',
    category: 'AYT Fizik',
    publisher: 'Aktif Fizik',
    name: 'AYT Fizik Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Temel kavramları ve basit formülleri adım adım öğreten başlangıç kaynağı.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'AYT Fizik',
    publisher: 'VİP Fizik',
    name: 'AYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'VİP Fizik YouTube kanalı ile uyumlu, konuyu pekiştiren orta seviye kitap.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'AYT Fizik',
    publisher: 'Bilgi Sarmal',
    name: 'AYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'ÖSYM standartlarında konu pekiştirmeli, sarmal tekrarlı dengeli kaynak.',
    isPopular: true
  },
  {
    subject: 'Fizik',
    category: 'AYT Fizik',
    publisher: 'Nihat Bilgin',
    name: 'AYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Klasik ispat ve muhakeme odaklı fizik sorularıyla derinlik katan ekol kaynak.',
    isPopular: false
  },
  {
    subject: 'Fizik',
    category: 'AYT Fizik',
    publisher: '3D',
    name: 'AYT Fizik Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Simülasyon testleriyle kurgusal ve zekice tasarlanmış yeni nesil sorular.',
    isPopular: true
  },
  {
    subject: 'Fizik',
    category: 'AYT Fizik',
    publisher: 'Apotemi',
    name: 'AYT Fizik Konu Fasikülleri',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Fizikte derece hedefleyenler için en ağır, üst düzey analiz gerektiren set.',
    isPopular: true
  },

  // --- AYT KİMYA ---
  {
    subject: 'Kimya',
    category: 'AYT Kimya',
    publisher: 'Aktif Kimya',
    name: 'AYT Kimya Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Reaksiyon ve formül temellerini sıfırdan alan kolay başlangıç kitabı.',
    isPopular: false
  },
  {
    subject: 'Kimya',
    category: 'AYT Kimya',
    publisher: 'Kimya Adası',
    name: 'AYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Kimya Adası videoları ile paralel ilerleyen, pratik kazandıran SB.',
    isPopular: false
  },
  {
    subject: 'Kimya',
    category: 'AYT Kimya',
    publisher: '345',
    name: 'AYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sınav ayarında, basitten zora ÖSYM tarzı simülasyon testleri.',
    isPopular: true
  },
  {
    subject: 'Kimya',
    category: 'AYT Kimya',
    publisher: 'Palme',
    name: 'AYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Klasikleşmiş bol bilgi ve reaksiyon soruları barındıran üst düzey SB.',
    isPopular: true
  },
  {
    subject: 'Kimya',
    category: 'AYT Kimya',
    publisher: 'Aydın',
    name: 'AYT Kimya Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Kimya müfredatını en derin, bilimsel ve zorlayıcı düzeyde işleyen kaynak.',
    isPopular: true
  },

  // --- AYT BİYOLOJİ ---
  {
    subject: 'Biyoloji',
    category: 'AYT Biyoloji',
    publisher: 'Tonguç',
    name: '0 dan AYT Biyoloji',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Renkli görsellerle biyolojiyi sıkmadan sıfırdan anlatan başlangıç kaynağı.',
    isPopular: false
  },
  {
    subject: 'Biyoloji',
    category: 'AYT Biyoloji',
    publisher: 'Fundamentals',
    name: 'AYT Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Fundamentals kanal kamplarıyla uyumlu, pekiştirici orta seviye SB.',
    isPopular: false
  },
  {
    subject: 'Biyoloji',
    category: 'AYT Biyoloji',
    publisher: 'Biyotik',
    name: 'AYT Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sadece biyoloji odaklı yayından, tam müfredat uyumlu popüler kaynak.',
    isPopular: true
  },
  {
    subject: 'Biyoloji',
    category: 'AYT Biyoloji',
    publisher: 'Palme',
    name: 'AYT Biyoloji Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Biyolojide ekol olmuş, şekilli ve öncüllü üst düzey yorum soruları.',
    isPopular: true
  },
  {
    subject: 'Biyoloji',
    category: 'AYT Biyoloji',
    publisher: 'Apotemi',
    name: 'AYT Biyoloji Sistemler Fasikülü',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Sistemler konusunu en ince detayına kadar inceleyen, derece adaylarının başucu kitabı.',
    isPopular: true
  },

  // --- AYT TARİH ---
  {
    subject: 'Tarih',
    category: 'AYT Tarih',
    publisher: 'Okyanus',
    name: '40 Seansta AYT Tarih',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Tarih konularını bölerek sıkılmadan sıfırdan öğreten kolay SB.',
    isPopular: false
  },
  {
    subject: 'Tarih',
    category: 'AYT Tarih',
    publisher: 'Bilgi Sarmal',
    name: 'AYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sarmal tekrarları ve ÖSYM tarzı dengeli sorularıyla çok sevilen kaynak.',
    isPopular: true
  },
  {
    subject: 'Tarih',
    category: 'AYT Tarih',
    publisher: 'Benim Hocam',
    name: 'AYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Ramazan Yetgin videoları ile birebir uyumlu, en meşhur bilgi-yorum kitabı.',
    isPopular: true
  },
  {
    subject: 'Tarih',
    category: 'AYT Tarih',
    publisher: '3D',
    name: 'AYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Zorlayıcı yorum ve doğrudan bilgi sorularıyla sınav provası yaptıran SB.',
    isPopular: false
  },
  {
    subject: 'Tarih',
    category: 'AYT Tarih',
    publisher: 'Limit',
    name: 'AYT Tarih Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Sözelciler ve derece isteyenler için en detaylı bilgi ve kronoloji kaynağı.',
    isPopular: true
  },

  // --- AYT COĞRAFYA ---
  {
    subject: 'Coğrafya',
    category: 'AYT Coğrafya',
    publisher: 'Tonguç',
    name: '0 dan AYT Coğrafya',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Haritaları ve ülkeleri sıkılmadan sıfırdan öğreten kolay başlangıç kitabı.',
    isPopular: false
  },
  {
    subject: 'Coğrafya',
    category: 'AYT Coğrafya',
    publisher: 'Coğrafyanın Kodları',
    name: 'AYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Hafıza teknikleri ve görsel kodlamalarla coğrafyayı kalıcı kılan SB.',
    isPopular: true
  },
  {
    subject: 'Coğrafya',
    category: 'AYT Coğrafya',
    publisher: 'Benim Hocam',
    name: 'AYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Bayram Meral videoları ile paralel, harita destekli popüler orta seviye.',
    isPopular: true
  },
  {
    subject: 'Coğrafya',
    category: 'AYT Coğrafya',
    publisher: '3D',
    name: 'AYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Gerçek sınav ayarında, seçici grafik ve harita soruları barındıran SB.',
    isPopular: false
  },
  {
    subject: 'Coğrafya',
    category: 'AYT Coğrafya',
    publisher: 'Limit',
    name: 'AYT Coğrafya Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Üst düzey harita okuma ve detaylı beşeri coğrafya bilgisi içeren zirve kitap.',
    isPopular: true
  },

  // --- AYT FELSEFE GRUBU (Subject: Felsefe) ---
  {
    subject: 'Felsefe',
    category: 'AYT Felsefe Grubu',
    publisher: 'Okyanus',
    name: '40 Seansta Felsefe Grubu',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Felsefe grubu derslerini adım adım sıfırdan kavratan kolay başlangıç.',
    isPopular: false
  },
  {
    subject: 'Felsefe',
    category: 'AYT Felsefe Grubu',
    publisher: 'Benim Hocam',
    name: 'AYT Felsefe Grubu Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Video ders notlarıyla tam paralel, bol pratikli orta seviye SB.',
    isPopular: true
  },
  {
    subject: 'Felsefe',
    category: 'AYT Felsefe Grubu',
    publisher: 'Limit',
    name: 'AYT Felsefe Grubu Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta-Zor)',
    difficultyValue: 4,
    reason: 'Derin terim ezberi ve akıl yürütme soruları içeren nitelikli kaynak.',
    isPopular: true
  },
  {
    subject: 'Felsefe',
    category: 'AYT Felsefe Grubu',
    publisher: '3D',
    name: 'AYT Felsefe Grubu Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Mantık, psikoloji ve sosyoloji konularında en çelişkili ve zor sorular.',
    isPopular: true
  },

  // --- DİL / YDT (Subject: Dil) ---
  // [KELİME]
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Modadil Yayınları',
    name: 'Passagework YDS-YÖKDİL Ön Hazırlık Kelime Canavarı',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Sürece yeni başlayan adaylar için temel akademik kelimeleri, göz korkutmayan bir tasarımla ve basit okuma parçalarıyla bağdaştırarak sunar.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'YDS Publishing',
    name: 'Yks Dil Vocabulary Topic Based',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Kelimeleri sağlık, bilim, sosyal yaşam gibi tematik başlıklara ayırarak zihinsel gruplandırmayı kolaylaştırır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Benim Hocam',
    name: 'Kelimesiz Asla',
    difficulty: '⭐⭐☆☆☆ (Kolay - Orta)',
    difficultyValue: 2,
    reason: 'Kelimelerin kök, önek (prefix) ve sonek (suffix) analizlerini yaparak morfolojik farkındalık yaratır. Görsel hafıza tekniklerini destekler.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Pelikan Yayınları',
    name: 'Vocabulary Blasting',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Eşdizimlilik (collocations) üzerine yoğunlaşır. Hangi sıfatın hangi isimle, hangi fiilin hangi edatla kullanıldığına dair yoğun pratik içerir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'The Originals',
    name: 'Vocabulary',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'YDT müfredatına tam uyumlu, orta karar bir kelime soru bankasıdır. Sınav formatındaki kelime sorularına aşinalık kazandırır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Akındil Eğitim',
    name: '100 Reading Passages',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Aslen bir okuma kitabı olmasına rağmen, her metnin sonunda yer alan yoğun kelime testleri sayesinde en etkili bağlamsal kelime öğrenim araçlarından biridir.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Modadil Yayınları',
    name: 'Kelime ve Edat Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Özellikle ilk bölümdeki edat (preposition) ve kelime birleşimleri soruları için spesifik ve nokta atışı bir soru havuzu sunar.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Modadil Yayınları',
    name: 'YKS Dil Sınav Stratejileri 5 Kelime Yaprak Test',
    difficulty: '⭐⭐⭐⭐☆ (Orta - Zor)',
    difficultyValue: 4,
    reason: 'Sürecin ortalarında, öğrenilen kelimelerin hızlı bir şekilde test edilmesi ve atıl zamanların (yolculuk vb.) değerlendirilmesi için idealdir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Modadil Yayınları',
    name: 'Vocabulary Fighter',
    difficulty: '⭐⭐⭐⭐☆ (Orta - Zor)',
    difficultyValue: 4,
    reason: 'İleri düzey çeldiriciler içeren, adayları YDS seviyesine yaklaştıran akademik kelime alıştırmaları ve yoğun test bataryaları barındırır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Akındil Eğitim',
    name: 'Reading Words',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Metin odaklı kelime çalışmasının temelini oluşturur, adayların metin içindeki anlamsal ipuçlarını (context clues) kullanarak kelime tahmini yapmasını sağlar.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'RH Pozitif Yayınları',
    name: 'Yds-yökdil Kelime Soru Bankası',
    difficulty: '⭐⭐⭐⭐☆ (Orta - Zor)',
    difficultyValue: 4,
    reason: 'YDT\'nin zorluk derecesinin üzerine çıkarak, adayları akademik makalelerde geçen spesifik terimlerle tanıştırır. Derece hedefleyenlere yöneliktir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Modadil Yayınları',
    name: 'YDS Tamamı Çözümlü Soru Bankası 1 Vocabulary',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Tamamen çözümlü olması sayesinde adayın kendi kendine öğrenmesini destekler, yanlış şıkların neden yanlış olduğunu analiz eder.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Modadil Yayınları',
    name: '60 Günde Ezberbozan YDS Kelimeleri',
    difficulty: '⭐⭐⭐⭐☆ (Orta - İleri)',
    difficultyValue: 4,
    reason: 'Zaman çizelgesine oturtulmuş bir disiplin sunar. Dijital platformlardaki kampanyalarla desteklenen ve oldukça popüler olan sistematik bir kaynaktır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Kelime',
    publisher: 'Akın Dil Eğitim',
    name: 'YÖKDİL Sağlık Bilimleri Kelime Okuma Kitabı',
    difficulty: '⭐⭐⭐⭐⭐ (İleri - Spesifik)',
    difficultyValue: 5,
    reason: 'YDT için doğrudan birincil kaynak olmasa da, bilimsel makalelere aşinalık kazanmak isteyen üst düzey öğrenciler için farklı bir alternatif sunar.',
    isPopular: false
  },

  // [GRAMER]
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Road to Success',
    name: 'Grammar Test Book',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Gramer kurallarının en temel hatlarıyla pekiştirildiği, özgüven artırıcı ve mekanik tekrara dayalı başlangıç seviyesi soru bankasıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Dilko',
    name: 'Yds Grammar Question Bank',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Dilko\'nun pedagojik sadelik ilkesini yansıtan, karmaşık çeldiricilerden arındırılmış, temel yapıları öğretmeyi hedefleyen bir eserdir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Modadil Yayınları',
    name: 'Gramer Canavarı Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Kolay - Orta)',
    difficultyValue: 2,
    reason: 'Kuralları eğlenceli ve akılda kalıcı bir tasarımla sunan, öğrencilerin gramer fobisinden kurtulmalarına yardımcı olan geçiş kaynağıdır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Modadil Yayınları',
    name: 'YKS İngilizce Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'YDT formatına tam uyumlu, tüm gramer konularını homojen bir şekilde tarayan, müfredatın ana omurgasını oluşturan standart bir test kitabıdır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Benim Hocam',
    name: 'Grammar Overdose',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Video derslerle senkronize ilerleyen, gramer konularını aşırı dozda (overdose) pratikle zihne kazımayı hedefleyen popüler bir eserdir.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Modadil Yayınları',
    name: 'Gramer Yaprak Test - 3',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Konu anlatımları bittikten sonra, unutmayı engellemek ve sarmal tekrar (spiral review) yapmak amacıyla tasarlanmış kısa soluklu testlerdir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Benim Hocam',
    name: '2024 YDT İngilizce Grammar Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Güncel ÖSYM soru havuzunun eğilimlerine göre revize edilmiş, bağlaç ve eylemsi ağırlıklı yeni nesil sorular içeren temel soru bankasıdır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Remzi Hoca',
    name: 'YDS-YÖKDİL Gramer Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Geleneksel YDS çizgisini koruyan, özellikle YDT\'de zorlanılan karmaşık cümle yapılarının çözümlemesinde akademik bir perspektif sunan kaynaktır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Hocawebde',
    name: 'YKSDİL Master Grammar',
    difficulty: '⭐⭐☆☆☆ (Kolaydan Zora)',
    difficultyValue: 2,
    reason: 'Öğrenciyi temelden alıp basamak basamak zorlaştıran, kademeli ilerleme (scaffolding) prensibiyle tasarlanmış hibrit bir soru bankasıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Modadil Yayınları',
    name: 'YDS Tamamı Çözümlü Soru Bankası 2 Tüm Gramer Konuları',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Tüm soruların neden-sonuç ilişkisiyle açıklandığı, yanlış şıkların analiz edildiği, bağımsız öğrenenler için hazırlanmış üst düzey bir kaynaktır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Yargı Yayınları',
    name: '2024 YDS Gramer Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Yargı\'nın standart test zorluğunu yansıtan, çeldiricileri güçlü ve öğrenciyi ince düşünmeye sevk eden zorlayıcı gramer bataryaları içerir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Yayın Yok (Jenerik)',
    name: 'YDT Test Attack',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Sınavın zorluk seviyesinin üstüne çıkarak, öğrencinin karşılaşabileceği en karmaşık sentaktik yapılara karşı bir nevi bağışıklık kazandırır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Akındil Eğitim',
    name: 'The Last Touch',
    difficulty: '⭐⭐⭐⭐☆ (Orta - Zor)',
    difficultyValue: 4,
    reason: 'Sürecin sonlarına doğru tüm gramer eksikliklerini "son bir dokunuşla" tarayan, ince ayar ve hata ayıklama (troubleshooting) kitabıdır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Gramer',
    publisher: 'Berk Hoca',
    name: 'YDT & YDS & YÖKDİL Grammar Soru Bankası Tekil Ürün',
    difficulty: '⭐⭐☆☆☆ (Başlangıç - Orta)',
    difficultyValue: 2,
    reason: 'İnternet perakendeciliğinde yüksek satış ivmesi yakalayan, tekil ürün olarak 300 TL bandında erişilebilir, pratik odaklı bir çalışmadır.',
    isPopular: true
  },

  // [SKILLS]
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Dilko',
    name: 'Basic Skills',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Soru tipleriyle ilk defa karşılaşan öğrenciler için çözüm yollarını en basite indirgeyen, tekniklerin mantığını kavratan giriş kitabıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Dilko',
    name: 'YDS Question Bank',
    difficulty: '⭐⭐☆☆☆ (Kolay)',
    difficultyValue: 2,
    reason: 'Dilko\'nun temel seviye beceri pratiklerini içeren, moral verici ve mekanik kazanımları önceleyen genel soru bankasıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Modadil Yayınları',
    name: 'YKS-DİL Thumbs Up - All Skills',
    difficulty: '⭐⭐☆☆☆ (Kolay - Orta)',
    difficultyValue: 2,
    reason: 'Tüm beceri sorularını tek bir kapakta toplayan, sınav formatına yumuşak bir geçiş sağlayan ve yapılandırılmış pratik sunan temel kaynaktır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Modadil Yayınları',
    name: 'Soru Canavarı 4 - Skills Yaprak Test',
    difficulty: '⭐⭐☆☆☆ (Kolaydan Zora)',
    difficultyValue: 2,
    reason: 'Farklı beceri sorularını karışık bir şekilde sunarak adayın soru tipi değiştirme (task switching) reflekslerini hızlandıran testlerdir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Akındil Eğitim',
    name: 'Skills Özgün Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Akındil\'in akademik derinliğini yansıtan, özellikle anlamı bozan cümle ve paragraf tamamlama kısımlarında güçlü metinler kullanan kaynaktır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Akındil Eğitim',
    name: 'Voga Test',
    difficulty: '⭐⭐⭐⭐⭐ (İleri)',
    difficultyValue: 5,
    reason: 'YDS, YÖKDİL ve YKS-DİL formatlarını harmanlayan, derece öğrencilerinin sınırlarını zorlamak için tasarlanmış hibrit ve oldukça kompleks bir bataryadır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Modadil Yayınları',
    name: 'YKS İngilizce Soru Tipleri Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sınavın tam ağırlık merkezinde yer alan, her soru tipi için yeterli hacimde pratik imkanı sunan standart referans kitabıdır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Modadil Yayınları',
    name: 'YKS-DİL İngilizce Sınav Stratejileri 2 - Skills Konu + Soru',
    difficulty: '⭐⭐⭐⭐☆ (Orta - İleri)',
    difficultyValue: 4,
    reason: 'Soru çözüm algoritmalarını adım adım öğreten, "hangi bağlaç nasıl elenir, referans kelimeler nasıl takip edilir" gibi doğrudan taktik veren başyapıttır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Yargı Yayınları',
    name: 'Advance Your Test Skills',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Çeldiricileri kasıtlı olarak birbirine çok yakın tutarak, adayı sınavdaki en kötü senaryoya (yakın şıklı zor diyaloglar vb.) karşı eğiten kitaptır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Modadil Yayınları',
    name: 'YDS Tamamı Çözümlü Soru Bankası 3 ve 4',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Becerileri ölçen en zorlu metin ve diyalogların detaylı açıklamalarla çözümlendiği, hata oranını minimize etmeyi hedefleyen analitik kaynaktır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Modadil Yayınları',
    name: 'YDS Sınav Stratejileri Özgün Soru Bankası 3',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Strateji serisinin en ileri seviye kitabıdır, öğrencinin kazandığı tüm taktikleri çürütmeye çalışan güçlü çeldiricilerle doludur.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Benim Hocam',
    name: '2026 YDT Skills Lab Soru Bankası',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'En güncel soru tarzlarını yakalayan, erişilebilir fiyatı (246,50 TL) ve video entegrasyonuyla piyasada hızla popülerleşen modern beceri laboratuvarıdır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Skills',
    publisher: 'Benim Hocam',
    name: '2024 YDT Taktiklerle İngilizce Skills Soru Bankası',
    difficulty: '⭐⭐☆☆☆ (Başlangıç - Orta)',
    difficultyValue: 2,
    reason: 'Dilin bütününden ziyade soru tiplerinin "taktiksel anatomisini" inceleyerek adayın hız kazanmasını sağlayan fonksiyonel bir çalışmadır.',
    isPopular: true
  },

  // [OKUMA]
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'ODTÜ Yayıncılık',
    name: 'Reader At Work 1',
    difficulty: '⭐⭐☆☆☆ (Kolaydan Zora)',
    difficultyValue: 2,
    reason: 'Aslen üniversitelerin hazırlık atlama (proficiency) sınavları için yazılmış olan bu klasikleşmiş eser, düzenli okuma alışkanlığının temelini atar.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'ODTÜ Yayıncılık',
    name: 'Reader At Work 2',
    difficulty: '⭐⭐⭐☆☆ (Ortadan Zora)',
    difficultyValue: 3,
    reason: 'Birinci kitabın devamı niteliğinde olup, metinlerin leksikal yoğunluğunu ve akademik dilini artırarak öğrenciyi ileri düzeye taşır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'ODTÜ Yayıncılık',
    name: 'More to Read 1 & 2',
    difficulty: '⭐⭐⭐☆☆ (Ortadan Zora)',
    difficultyValue: 3,
    reason: 'Reader at Work serisine alternatif ve tamamlayıcı olarak kurgulanan, modern temalara odaklanan bir diğer kült akademik okuma bataryasıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Akındil Eğitim',
    name: 'Read for Speed 1 ve 2 Set',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Okuma hızını ve kavramayı eş zamanlı geliştirmeyi vadeden, 829,90 TL\'lik hacimli yapısıyla piyasanın en kapsamlı setlerinden biridir.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Dilko',
    name: 'Reading Activity Book',
    difficulty: '⭐⭐☆☆☆ (Kolaydan Zora)',
    difficultyValue: 2,
    reason: 'Paragrafları bütün olarak sormadan önce eşleştirme, boşluk doldurma gibi aktivitelerle metni parçalayarak öğreten didaktik bir çalışmadır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Dilko',
    name: 'YDS Reading Question Bank',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Doğrudan çoktan seçmeli paragraf sorularına odaklanan, YDT okuma bölümünün mantığını basit ve anlaşılır bir çerçevede sunan soru bankasıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Akındil Eğitim',
    name: '100 Reading Passages',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Zengin içerikli 100 farklı metin üzerinden okuma becerisini ve kelime bilgisini entegre bir biçimde test eden, yüksek verimli bir kaynaktır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Modadil Yayınları',
    name: 'Passage Work 4, 5, 6',
    difficulty: '⭐⭐⭐☆☆ (Ortadan Zora)',
    difficultyValue: 3,
    reason: 'Modadil\'in kademeli zorluk mimarisinin en belirgin örneğidir. Paragrafların uzunluğu ve soru çeldiricileri her bir seviyede sistematik olarak artar.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Modadil Yayınları',
    name: 'Makalelerle YKSDİL',
    difficulty: '⭐⭐⭐⭐☆ (Orta - Zor)',
    difficultyValue: 4,
    reason: 'Güncel gazete ve bilimsel makalelerinden devşirilmiş metinlerle, adayın genel kültürünü ve akademik okuryazarlığını destekleyen prestijli bir kitaptır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'ELS',
    name: 'English Through Reading',
    difficulty: '⭐⭐⭐⭐☆ (Orta - İleri)',
    difficultyValue: 4,
    reason: 'İçerisinde müzeler, gıda, teknoloji, spor gibi çeşitli bilimsel ve sosyal alanlardan 25 ayrı yoğun okuma parçası barındıran efsanevi referans kaynağıdır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Yayın Yok (Jenerik)',
    name: 'Road to Success Reading',
    difficulty: '⭐⭐☆☆☆ (Kolaydan Zora)',
    difficultyValue: 2,
    reason: 'Öğrenciyi yormadan, hikaye tadındaki basit metinlerden makalelere doğru evrilen, motivasyonu yüksek tutmayı hedefleyen bir geçiş kaynağıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'The Originals',
    name: 'Reading (Eyüp Gündüz vb.)',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Farklı yazar perspektifleri görmek isteyen adaylar için, YDT standardında yazılmış, dengeli metin dağılımına sahip özgün bir paragraf kitabıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Pelikan Yayınları',
    name: 'Get Reading Soru Bankası',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Özellikle çeldirici tasarımı konusunda iddialı olan, detaylı ve uzun metinlerle adayın zaman yönetimini test eden ağır bir soru bankasıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Dilko',
    name: 'YDS Reading',
    difficulty: '⭐⭐⭐⭐☆ (Orta - Zor)',
    difficultyValue: 4,
    reason: 'Dilko ekosisteminde daha üst basamakları hedefleyen öğrencilere hitap eden, ileri düzey kavramsal analiz gerektiren paragraflar içerir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Modadil Yayınları',
    name: 'YDS Reader',
    difficulty: '⭐⭐⭐⭐⭐ (Zor)',
    difficultyValue: 5,
    reason: 'Paragraf okumalarında zirveyi temsil eder; karmaşık referans kelimeleri, çift katmanlı soruları ve akademik kelime yoğunluğuyla üstün bir antrenman sahasıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Pelikan (Çeşitli)',
    name: 'A Comprehensive Guide to Academic Writing',
    difficulty: '⭐⭐⭐⭐⭐ (Çok İleri)',
    difficultyValue: 5,
    reason: 'En çok satanlar listesinde %30 indirimle yer alan eser, okuma-yazma entegrasyonu sunarak paragraf kurgusunu yazarlık perspektifinden öğretir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Okuma',
    publisher: 'Pelikan (Çeşitli)',
    name: 'Building Skills For Proficiency',
    difficulty: '⭐⭐⭐⭐⭐ (Çok İleri)',
    difficultyValue: 5,
    reason: 'Sadece okumayı değil, genel dil becerilerini YDT\'nin fersah fersah ötesinde akademik bir düzlemde ele alan klasikleşmiş hazırlık atlama kılavuzudur.',
    isPopular: false
  },

  // [DENEME]
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'KR Akademi',
    name: 'YDT Çıkmış Sorular Son 5 Yıl Tıpkı Basım Fasikülleri',
    difficulty: '⭐⭐⭐⭐⭐ (Gerçek)',
    difficultyValue: 5,
    reason: 'Mizanpajı, yazı tipi ve font boşluklarıyla birebir ÖSYM formatında basılan, sınava girmeden son 1 ay kala mutlaka çözülmesi gereken nihai gerçeklik testidir.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Modadil Yayınları',
    name: 'IntroPack Deneme Canavarı',
    difficulty: '⭐⭐☆☆☆ (Kolay - Orta)',
    difficultyValue: 2,
    reason: 'Deneme çözmeye yeni başlayanlar için şevk kırıcı olmayan, nispeten daha kısa ve anlaşılır metinlerden oluşan ısındırma simülasyonudur.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Modadil Yayınları',
    name: 'YKS İngilizce 5+5 Deneme',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Sürecin ilk yarısında gelişimi gözlemlemek, net dalgalanmalarını analiz etmek için kurgulanmış dengeli ve kompakt bir deneme setidir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Modadil Yayınları',
    name: '10, 15 ve 20 Özgün Deneme Setleri',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Modadil\'in standart YDT mantığını yansıtan, piyasanın en çok tüketilen ve öğrencinin kendi performans ortalamasını net görmesini sağlayan omurga serileridir.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Modadil Yayınları',
    name: 'YKS-DİL (YDT) Deneme Setleri (40 ve 60 Deneme)',
    difficulty: '⭐-⭐⭐⭐⭐⭐ (Tüm Seviyeler)',
    difficultyValue: 3,
    reason: 'Sırasıyla 1390 TL ve 2229 TL fiyat etiketlerine sahip olan bu devasa setler, sınav yılı boyunca adayın kümülatif yorgunluğu yenmesini sağlayan endüstriyel çözümlerdir.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Modadil Yayınları',
    name: 'YKS-DİL YDT Joker Deneme Seti - 11 Deneme',
    difficulty: '⭐⭐⭐⭐☆ (Orta - İleri)',
    difficultyValue: 4,
    reason: 'Sürecin son düzlüğünde nokta atışı eksiklik tespiti yapmak üzere tasarlanmış, 479 TL\'lik özel karmalardan oluşan prestijli deneme bataryasıdır.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Akındil Eğitim',
    name: '8\'li Çözümlü Deneme',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Hatalı yapılan soruların çözüm algoritmalarının detaylı verildiği, öğrenciyi yalnız bırakmayan kendi kendini besleyen (self-sustaining) bir denemedir.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Akındil Eğitim',
    name: '14 YDT Deneme',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Yıl geneline yayılacak düzenli pratik imkanı sunan, ÖSYM çeldirici mantığını başarıyla replike eden klasik bir deneme bataryasıdır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Akındil Eğitim',
    name: '7+7 Deneme',
    difficulty: '⭐⭐⭐⭐☆ (Orta - Zor)',
    difficultyValue: 4,
    reason: 'Öğrenciyi konfor alanından çıkarıp, akademik metin yoğunluğu ve karmaşık sentaktik yapılarla yüzleştiren zorlayıcı bir seridir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Akındil Eğitim',
    name: 'Özgün 5 YDT Deneme Sınavı (Video Çözümlü)',
    difficulty: '⭐⭐⭐⭐⭐ (İleri)',
    difficultyValue: 5,
    reason: 'Zorluk derecesi ÖSYM ortalamasının üzerinde olan, derece öğrencilerinin sınırlarını test eden ve 389 TL\'lik fiyatıyla piyasada yer edinen zorlu bir simülasyondur.',
    isPopular: true
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'YDS Publishing',
    name: 'Sınav Stratejileri 5 - Özgün Denemeler 5',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'YDS yayıncılığının test dinamiğini YDT ortamına aktaran, dengeleyici ve farklı bir yazar dili görmek isteyenler için alternatif bir seçenektir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'AKIN Publishing',
    name: 'YKS Dil 12. Sınıf 15 Mini YDT Deneme',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Uzun deneme çözmeye vakti olmayan 12. sınıf öğrencileri için okul temposuna uygun tasarlanmış, becerileri paslandırmayan mini simülasyonlardır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Yargı Yayınları',
    name: 'Mastering YDT 10 Deneme Sınavı',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Farklı bir test okulu ve yaklaşımı arayanlar için, piyasanın baskın yayınlarına alternatif oluşturan, standart sapma ölçümü güçlü bir kaynaktır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'The Originals',
    name: 'YDT Deneme Sınavları',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Çeşitli yayıncıların tekelini kırmak adına, özgün soru havuzlarıyla farklı düşünme pratikleri geliştirmeyi amaçlayan bir alternatiftir.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Yediiklim',
    name: 'YDT 7 Deneme Sınavı (Fatih Çömez)',
    difficulty: '⭐⭐⭐⭐☆ (Orta - İleri)',
    difficultyValue: 4,
    reason: '248 TL\'lik fiyat etiketiyle satılan, yazarın kendi tarzını yansıtan ve çeldirici kurgularıyla sınav ciddiyetini hissettiren bir çalışmadır.',
    isPopular: false
  },
  {
    subject: 'Dil',
    category: 'Deneme',
    publisher: 'Benim Hocam',
    name: '2024-2025 YDT İngilizce 5 Deneme Sınavı (Ens)',
    difficulty: '⭐⭐⭐☆☆ (Orta)',
    difficultyValue: 3,
    reason: 'Ens Yayıncılık işbirliğiyle hazırlanan, hap niteliğindeki bu set, 259 TL\'lik erişilebilir fiyatıyla süreç başında seviye ölçümü için sıklıkla kullanılmaktadır.',
    isPopular: true
  }
];

import { GRADE_RECOMMENDED_BOOKS } from './curriculum/recommendationsData';

const GRADE_MAARIF_BOOKS: RecommendedBook[] = (GRADE_RECOMMENDED_BOOKS || []).map(b => ({
  subject: b.subject,
  category: `${b.grade}. Sınıf Maarif Modeli`,
  publisher: b.publisher,
  name: b.name,
  difficulty: b.difficulty,
  difficultyValue: Math.round(b.difficultyValue),
  reason: b.reason,
  isPopular: b.difficultyValue >= 3
}));

RECOMMENDED_BOOKS.push(...GRADE_MAARIF_BOOKS);

