import { YKSDataState, AuditLogItem, DirectMessage, FieldType, DailyStudyTimeLog } from '../types';

export const DEFAULT_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImF2YXRhckdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxZTI5M2IiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzMzQxNTUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNhdmF0YXJHcmFkKSIgcng9IjI0Ii8+PGNpcmNsZSBjeD0iNTAiIGN5PSI0MCIgcj0iMTgiIGZpbGw9IiM5NGEzYjgiLz48cGF0aCBkPSJNNTAgNjJjLTE1IDAtMjYgOC0yNiAxOHY0aDUydi00YzAtMTAtMTEtMTgtMjYtMTh6IiBmaWxsPSIjOTRhM2I4Ii8+PC9zdmc+`;

export function createEmptyStudentData(name: string = '', className: string = '', explicitField?: FieldType): YKSDataState {
  const targetField = explicitField || (className?.includes('EA') 
    ? 'EA' 
    : className?.includes('SÖZ') 
    ? 'SÖZ' 
    : className?.includes('DİL') 
    ? 'DİL' 
    : 'SAY');

  return {
    profile: {
      name: name,
      highSchool: 'Gürsu Yıldız Anadolu Lisesi',
      className: className,
      targetUniversity: '',
      targetDepartment: '',
      targetField: targetField as any,
      targetTYTNet: 0,
      targetAYTNet: 0,
      targetRank: 0,
      avatarUrl: DEFAULT_AVATAR,
      coachName: '',
      coachNotes: ''
    },
    studyPlans: [],
    questionLogs: [],
    resources: [],
    pastExams: [],
    branchExams: [],
    topicErrors: [],
    generalMocks: [],
    youtubeVideos: [],
    coachAdvices: [],
    sheetsStatus: {
      isConnected: false
    },
    manuallyChangedTopicStatuses: [],
    routines: [],
    quickNotes: [],
    dailyStudyLogs: {}
  };
}

export const YKS_SUBJECTS = {
  TYT: [
    'TYT Türkçe',
    'TYT Matematik',
    'TYT Geometri',
    'TYT Fizik',
    'TYT Kimya',
    'TYT Biyoloji',
    'TYT Tarih',
    'TYT Coğrafya',
    'TYT Felsefe',
    'TYT Din Kültürü',
    'Paragraf'
  ],
  AYT: [
    'AYT Matematik',
    'AYT Geometri',
    'AYT Fizik',
    'AYT Kimya',
    'AYT Biyoloji',
    'AYT Edebiyat',
    'AYT Tarih-1',
    'AYT Coğrafya-1',
    'AYT Tarih-2',
    'AYT Coğrafya-2',
    'AYT Felsefe Grubu',
    'AYT Yabancı Dil'
  ]
};

export const ERROR_REASON_LABELS: Record<string, string> = {
  bilgi_eksigi: 'Bilgi Eksikliği',
  dikkat_hatasi: 'Dikkat / İşlem Hatası',
  zaman_yetmedi: 'Zaman Yetmedi / Süre Baskısı',
  iki_sik_arasinda: 'İki Şık Arasında Kaldım',
  soru_kokunu_yanlis_okuma: 'Soru Kökünü Yanlış Okuma'
};

export const DEFAULT_TASK_TYPES = [
  'Soru Çözümü',
  'Konu Çalışması',
  'Video İzleme',
  'Deneme Çözümü',
  'Tekrar & Özet',
  'Ödev / Test',
  'Diğer'
];

export const YKS_CURRICULUM_TOPICS: Record<string, string[]> = {
  'TYT Türkçe': [
    'Sözcükte Anlam & Söz Öbeğinde Anlam',
    'Cümlede Anlam & Kavramlar',
    'Paragrafta Anlam & Yapı',
    'Paragrafta Ana Fikir & Yardımcı Fikirler',
    'Ses Bilgisi',
    'Yazım Kuralları',
    'Noktalama İşaretleri',
    'Sözcükte Yapı & Ekler',
    'İsimler, Sıfatlar, Zamirler',
    'Zarf, Edat, Bağlaç, Ünlem',
    'Fiiller, Ek Fiil, Fiilde Çatı',
    'Fiilimsiler (Eylemsiler)',
    'Cümlenin Ögeleri',
    'Cümle Türleri',
    'Anlatım Bozuklukları'
  ],
  'TYT Matematik': [
    'Temel Kavramlar & Sayı Kümeleri',
    'Basamak Kavramı & Sayı Sistemleri',
    'Bölme & Bölünebilme Kuralları',
    'EBOB - EKOK',
    'Rasyonel & Ondalık Sayılar',
    'Birinci Dereceden Denklem ve Eşitsizlikler',
    'Mutlak Değer',
    'Üslü İfadeler',
    'Köklü İfadeler',
    'Çarpanlara Ayırma',
    'Oran - Orantı',
    'Sayı - Kesir Problemleri',
    'Yaş Problemleri',
    'İşçi - Havuz Problemleri',
    'Hareket (Hız) Problemleri',
    'Yüzde, Kar-Zarar Problemleri',
    'Karışım Problemleri',
    'Grafik Problemleri',
    'Kümeler & Kartezyen Çarpım',
    'Mantık',
    'Fonksiyonlar (Temel Düzey)',
    'Permütasyon & Kombinasyon',
    'Binom & Olasılık',
    'İstatistik & Veri Analizi'
  ],
  'TYT Geometri': [
    'Doğruda ve Üçgende Açılar',
    'Dik ve Özel Üçgenler (Pisagor & Öklid)',
    'İkizkenar ve Eşkenar Üçgen',
    'Üçgende Açıortay ve Kenarortay',
    'Üçgende Alan ve Benzerlik',
    'Çokgenler & Dörtgenler',
    'Paralelkenar & Eşkenar Dörtgen',
    'Dikdörtgen & Kare',
    'Deltoid & Yamuk',
    'Çemberde Açı ve Uzunluk',
    'Dairede Çevre ve Alan',
    'Analitik Geometri (Nokta & Doğru Analitiği)',
    'Katı Cisimler (Prizma, Piramit, Silindir, Koni, Küre)'
  ],
  'TYT Fizik': [
    'Fizik Bilimine Giriş',
    'Madde ve Özellikleri (Özkütle & Dayanıklılık)',
    'Sıvıların Kaldırma Kuvveti & Basınç',
    'Isı, Sıcaklık ve Genleşme',
    'Hareket ve Kuvvet (Newton Yasaları)',
    'İş, Güç ve Enerji',
    'Elektrostatik & Elektrik Akımı',
    'Mıknatıs ve Manyetizma',
    'Optik (Gölge, Aynalar)',
    'Optik (Kırılma, Mercekler, Renk)',
    'Dalgalar (Yay, Su, Ses, Deprem)'
  ],
  'TYT Kimya': [
    'Kimya Bilimi & Güvenlik',
    'Atomun Yapısı ve Periyodik Sistem',
    'Kimyasal Türler Arası Etkileşimler',
    'Maddenin Halleri (Gazlar, Sıvılar, Katılar)',
    'Doğa ve Kimya',
    'Kimyanın Temel Kanunları & Mol Kavramı',
    'Kimyasal Tepkimeler ve Hesaplamalar',
    'Karışımlar & Çözeltiler',
    'Asitler, Bazlar ve Tuzlar',
    'Kimya Her Yerde'
  ],
  'TYT Biyoloji': [
    'Canlıların Ortak Özellikleri',
    'Canlıların Temel Bileşenleri',
    'Hücre Yapısı, Organeller ve Hücre Zarı',
    'Canlıların Sınıflandırılması & Âlemler',
    'Hücre Bölünmeleri (Mitoz & Mayoz)',
    'Eşeysiz ve Eşeyli Üreme',
    'Kalıtım (Mendel İlkeleri, Kan Grupları)',
    'Ekosistem Ekolojisi & Çevre Sorunları'
  ],
  'TYT Tarih': [
    'Tarih ve Zaman / Tarih Bilimine Giriş',
    'İlk Çağ Uygarlıkları',
    'İlk ve Orta Çağlarda Türk Dünyası',
    'İslam Medeniyetinin Doğuşu ve İlk Türk-İslam Devletleri',
    'Türkiye Selçuklu Devleti',
    'Beylikten Devlete Osmanlı Siyaseti (1300-1453)',
    'Dünya Gücü Osmanlı (1453-1600)',
    'Değişim Çağında Osmanlı ve Avrupa (17. YY)',
    'Uluslararası İlişkilerde Denge Stratejisi (1789-1914)',
    '20. Yüzyıl Başlarında Osmanlı Devleti & I. Dünya Savaşı',
    'Milli Mücadele Dönemi (Hazırlık, Cepheler)',
    'Atatürkçülük ve Türk İnkılabı'
  ],
  'TYT Coğrafya': [
    'Doğa ve İnsan & Coğrafi Konum',
    'Dünya\'nın Şekli ve Hareketleri',
    'Harita Bilgisi & İzohipsler',
    'Atmosfer, İklim ve Hava Durumu',
    'Sıcaklık, Basınç, Rüzgarlar, Nem ve Yağış',
    'İklim Tipleri ve Bitki Örtüsü',
    'İç Kuvvetler (Dağ Oluşumu, Depremler, Volkanizma)',
    'Dış Kuvvetler (Akarsular, Rüzgarlar, Buzullar)',
    'Türkiye\'nin Yer Şekilleri & İklimi',
    'Nüfus, Yerleşme ve Göçler',
    'Ekonomik Faaliyetler & Bölge Kavramı',
    'Doğal Afetler & Çevre Riskleri'
  ],
  'TYT Felsefe': [
    'Felsefeyi Tanıma & Felsefi Düşünce',
    'Bilgi Felsefesi (Epistemoloji)',
    'Varlık Felsefesi (Ontoloji)',
    'Ahlak Felsefesi (Etik)',
    'Sanat Felsefesi (Estetik)',
    'Din Felsefesi',
    'Siyaset Felsefesi',
    'Bilim Felsefesi',
    'MÖ 6. Yüzyıl - MS 2. Yüzyıl Felsefesi',
    'MS 2. Yüzyıl - MS 15. Yüzyıl Felsefesi',
    '15. Yüzyıl - 17. Yüzyıl Felsefesi'
  ],
  'TYT Din Kültürü': [
    'Bilgi ve İnanç / İslam\'da İnanç Esasları',
    'İbadet ve Temel İlkeleri',
    'Ahlak ve Değerler',
    'Hz. Muhammed (s.a.v.) ve Gençlik',
    'Vahiy ve Akıl / Kur\'an\'da Bazı Kavramlar',
    'İslam Medeniyeti ve Bilim'
  ],
  'Paragraf': [
    'Sözcükte & Cümlede Anlam',
    'Paragrafta Ana Fikir & Konu',
    'Paragrafta Yardımcı Fikirler',
    'Paragrafın Yapısı (Giriş, Gelişme, Sonuç)',
    'Paragrafı İkiye Bölme & Akışı Bozan Cümle',
    'Paragrafta Boşluk Doldurma & Yer Değiştirme',
    'Paragrafta Anlatım Biçimleri & Düşünceyi Geliştirme Yolları',
    'Çoklu (İkili & Üçlü) Paragraf Soruları'
  ],
  'AYT Matematik': [
    'Polinomlar & Çarpanlara Ayırma',
    '2. Dereceden Denklemler & Karmaşık Sayılar',
    'Parabol (2. Dereceden Fonksiyon Grafikleri)',
    '2. Dereceden Eşitsizlikler & Sistemleri',
    'Fonksiyonlarda Uygulamalar (Öteleme, Simetri)',
    'Logaritma Fonksiyonu & Özellikleri',
    'Logaritmik Denklem ve Eşitsizlikler',
    'Diziler (Aritmetik ve Geometrik Dizi)',
    'Trigonometri - 1 (Trigonometrik Fonksiyonlar)',
    'Trigonometri - 2 (Toplam-Fark, Yarım Açı, Denklemler)',
    'Limit ve Süreklilik',
    'Türev - 1 (Türev Alma Kuralları, Teğet Eğimleri)',
    'Türev - 2 (Artan-Azalanlık, Maks-Min, Grafikler)',
    'İntegral - 1 (Belirsiz İntegral & Kuralları)',
    'İntegral - 2 (Belirli İntegral & Alan Hesabı)',
    'Permütasyon, Kombinasyon, Binom, Olasılık'
  ],
  'AYT Geometri': [
    'Doğruda & Üçgende Açılar',
    'Üçgenler (Açıortay, Kenarortay, Alan, Benzerlik)',
    'Çokgenler & Özel Dörtgenler',
    'Çember & Daire (Açı, Uzunluk, Alan)',
    'Noktanın ve Doğrunun Analitik İncelenmesi',
    'Çemberin Analitik İncelenmesi',
    'Dönüşüm Geometrisi (Öteleme, Dönme, Simetri)',
    'Katı Cisimler (Prizma, Piramit, Silindir, Koni, Küre)'
  ],
  'AYT Fizik': [
    'Vektörler & Bağıl Hareket',
    'Newton\'ın Hareket Yasaları',
    'Sabit İvmeli Hareket & Atışlar',
    'İş, Güç, Enerji & İtme - Momentum',
    'Tork, Denge ve Kütle Merkezi',
    'Basit Makineler',
    'Elektriksel Kuvvet, Alan ve Potansiyel',
    'Paralel Levhalar ve Kondansatörler',
    'Manyetik Alan, Kuvvet ve İndüksiyon',
    'Alternatif Akım ve Transformatörler',
    'Çembersel Hareket & Açısal Momentum',
    'Kepler Yasaları & Kütle Çekim',
    'Basit Harmonik Hareket',
    'Dalga Mekaniği (Kırınım, Girişim, Doppler)',
    'Atom Fiziğine Giriş & Radyoaktivite',
    'Modern Fizik (Fotoelektrik, Compton, Özel Görelilik)',
    'Modern Fiziğin Teknolojideki Uygulamaları'
  ],
  'AYT Kimya': [
    'Modern Atom Teorisi (Kuantum Sayıları, Elektron Dizilimi)',
    'Gazlar (Gaz Yasaları, İdeal Gaz)',
    'Sıvı Çözeltiler ve Çözünürlük (Derişim Birimleri)',
    'Kimyasal Tepkimelerde Enerji (Entalpi)',
    'Kimyasal Tepkimelerde Hız',
    'Kimyasal Tepkimelerde Denge',
    'Sulu Çözelti Dengeleri (Asit-Baz, pH, Kçç)',
    'Kimya ve Elektrik (Redoks, Piller, Elektroliz)',
    'Karbon Kimyasına Giriş (Hibritleşme)',
    'Organik Bileşikler - Hidrokarbonlar (Alkan, Alken, Alkin)',
    'Organik Bileşikler - Fonksiyonel Gruplar'
  ],
  'AYT Biyoloji': [
    'Sinir Sistemi & Duyu Organları',
    'Destek ve Hareket Sistemi',
    'Sindirim Sistemi',
    'Dolaşım ve Lenf Sistemi (Bağışıklık)',
    'Solunum Sistemi',
    'Üriner (Boşaltım) Sistemi',
    'Üreme Sistemi ve Embriyonik Gelişim',
    'Komünite ve Popülasyon Ekolojisi',
    'Nükleik Asitler (DNA, RNA, Protein Sentezi)',
    'Hücresel Solunum (Glikoliz, Krebs, ETS)',
    'Fotosentez ve Kemosentez',
    'Bitki Biyolojisi (Dokular, Madde Taşınması, Üreme)',
    'Canlılar ve Çevre'
  ],
  'AYT Edebiyat': [
    'Güzel Sanatlar ve Edebiyat / Metinlerin Sınıflandırılması',
    'Şiir Bilgisi (Ölçü, Kafiye, Redif, Söz Sanatları)',
    'İslamiyet Öncesi Türk Edebiyatı & Geçiş Dönemi',
    'Halk Edebiyatı (Anonim, Âşık, Tekke-Tasavvuf)',
    'Divan Edebiyatı (Şairler, Nazım Şekilleri)',
    'Tanzimat Edebiyatı (1. ve 2. Dönem)',
    'Servet-i Fünun & Fecr-i Âti Edebiyatı',
    'Milli Edebiyat Dönemi & Beş Hececiler',
    'Cumhuriyet Dönemi Şiir',
    'Cumhuriyet Dönemi Roman ve Hikâye',
    'Cumhuriyet Dönemi Tiyatro ve Öğretici Metinler',
    'Edebiyat Akımları'
  ],
  'AYT Tarih-1': [
    'Tarih Bilimi & İlk Çağ Uygarlıkları',
    'İlk ve Orta Çağlarda Türk Dünyası',
    'İslam Medeniyetinin Doğuşu ve Türk-İslam Devletleri',
    'Türkiye Selçuklu Devleti',
    'Osmanlı Devleti Kuruluş ve Yükselme Dönemi',
    'Osmanlı Devlet Düzeni & Kültür Medeniyet',
    '17. ve 18. Yüzyılda Osmanlı Devleti & Islahatlar',
    '19. Yüzyılda Osmanlı Devleti (Dağılma Dönemi)',
    '20. Yüzyıl Başlarında Osmanlı Devleti & I. Dünya Savaşı',
    'Milli Mücadele Dönemi & Atatürk İnkılapları'
  ],
  'AYT Coğrafya-1': [
    'Ekosistem ve Madde Döngüleri',
    'Biomlar ve Biyoçeşitlilik',
    'Şehirlerin Fonksiyonları ve Etki Alanları',
    'Türkiye\'de Nüfus ve Yerleşme Politikaları',
    'Türkiye\'nin Madenleri ve Enerji Kaynakları',
    'Türkiye\'de Sanayi, Ticaret ve Ulaşım',
    'Türkiye\'de Turizm ve Bölgesel Kalkınma Projeleri',
    'Küresel ve Bölgesel Örgütler',
    'Çevre Sorunları ve Küresel İklim Değişimi'
  ],
  'AYT Tarih-2': [
    'İlk Çağ Uygarlıkları & Orta Çağ Dünyası',
    'Türk-İslam Devletleri & Osmanlı Siyaseti',
    'Yeni Çağ ve Yakın Çağ Avrupa Tarihi',
    'I. ve II. Dünya Savaşları & Sonuçları',
    'Soğuk Savaş Dönemi & Yumuşama Dönemi',
    '21. Yüzyıl Başlarında Türkiye ve Dünya'
  ],
  'AYT Coğrafya-2': [
    'Doğal Unsurlar & İklim Sistemleri',
    'Küresel Ticaret & Turizm Yolları',
    'Türkiye\'nin Jeopolitik Konumu',
    'Doğal Kaynaklar ve Arazi Kullanımı',
    'Çevre ve Sürdürülebilir Kalkınma'
  ],
  'AYT Felsefe Grubu': [
    'Felsefeye Giriş & Temel Disiplinler',
    'Psikolojinin Temel Süreçleri & Öğrenme',
    'Sosyolojiye Giriş & Toplumsal Yapı',
    'Klasik ve Sembolik Mantık'
  ],
  'AYT Yabancı Dil': [
    'Grammar & Tenses',
    'Vocabulary & Phrasal Verbs',
    'Reading Comprehension & Paragraphs',
    'Sentence Completion & Restatement',
'Translation (English - Turkish)',
    'Irrelevant Sentence & Paragraph Completion'
  ]
};

export const DEFAULT_DAILY_STUDY_LOGS: Record<string, DailyStudyTimeLog> = {
  // 6 - 12 Temmuz 2026
  '2026-07-06': { date: '2026-07-06', day: 'Pazartesi', weekLabel: '6 - 12 Temmuz', minutes: 330, notes: 'Okul etüdü ve evde paragraf çalışması' },
  '2026-07-07': { date: '2026-07-07', day: 'Salı', weekLabel: '6 - 12 Temmuz', minutes: 270, notes: 'Kütüphanede fizik vektörler soru çözümü' },
  '2026-07-08': { date: '2026-07-08', day: 'Çarşamba', weekLabel: '6 - 12 Temmuz', minutes: 360, notes: 'Dershane + bireysel matematik basamaklar' },
  '2026-07-09': { date: '2026-07-09', day: 'Perşembe', weekLabel: '6 - 12 Temmuz', minutes: 240, notes: 'Kimya bilimi video dersleri ve özet' },
  '2026-07-10': { date: '2026-07-10', day: 'Cuma', weekLabel: '6 - 12 Temmuz', minutes: 300, notes: 'Biyoloji canlıların ortak özellikleri' },
  '2026-07-11': { date: '2026-07-11', day: 'Cumartesi', weekLabel: '6 - 12 Temmuz', minutes: 420, notes: 'Haftalık genel deneme ve tarih tekrarı' },
  '2026-07-12': { date: '2026-07-12', day: 'Pazar', weekLabel: '6 - 12 Temmuz', minutes: 180, notes: 'Hafta değerlendirmesi ve dinlenme' },

  // 13 - 19 Temmuz 2026
  '2026-07-13': { date: '2026-07-13', day: 'Pazartesi', weekLabel: '13 - 19 Temmuz', minutes: 360, notes: 'Matematik bölünebilme ve paragraf maratonu' },
  '2026-07-14': { date: '2026-07-14', day: 'Salı', weekLabel: '13 - 19 Temmuz', minutes: 300, notes: 'Fizik bağıl hareket soru bankası' },
  '2026-07-15': { date: '2026-07-15', day: 'Çarşamba', weekLabel: '13 - 19 Temmuz', minutes: 390, notes: 'EBOB-EKOK maratonu ve kütüphane etüdü' },
  '2026-07-16': { date: '2026-07-16', day: 'Perşembe', weekLabel: '13 - 19 Temmuz', minutes: 240, notes: 'Atom ve periyodik sistem notları' },
  '2026-07-17': { date: '2026-07-17', day: 'Cuma', weekLabel: '13 - 19 Temmuz', minutes: 330, notes: 'Biyoloji temel bileşenler soru taraması' },
  '2026-07-18': { date: '2026-07-18', day: 'Cumartesi', weekLabel: '13 - 19 Temmuz', minutes: 450, notes: 'Branş denemeleri ve soru çözümleri' },
  '2026-07-19': { date: '2026-07-19', day: 'Pazar', weekLabel: '13 - 19 Temmuz', minutes: 210, notes: 'Geometri doğrudan ve üçgende açılar' },

  // 20 - 26 Temmuz 2026
  '2026-07-20': { date: '2026-07-20', day: 'Pazartesi', weekLabel: '20 - 26 Temmuz', minutes: 300, notes: 'Rasyonel sayılar ve anlatım biçimleri' },
  '2026-07-21': { date: '2026-07-21', day: 'Salı', weekLabel: '20 - 26 Temmuz', minutes: 360, notes: 'Newton hareket yasaları derin analiz' },
  '2026-07-22': { date: '2026-07-22', day: 'Çarşamba', weekLabel: '20 - 26 Temmuz', minutes: 330, notes: 'Birinci dereceden denklemler etüdü' },
  '2026-07-23': { date: '2026-07-23', day: 'Perşembe', weekLabel: '20 - 26 Temmuz', minutes: 270, notes: 'Kimyasal türler arası etkileşimler' },
  '2026-07-24': { date: '2026-07-24', day: 'Cuma', weekLabel: '20 - 26 Temmuz', minutes: 360, notes: 'Hücre yapısı ve video özetleri' },
  '2026-07-25': { date: '2026-07-25', day: 'Cumartesi', weekLabel: '20 - 26 Temmuz', minutes: 480, notes: 'TYT denemesi + coğrafya doğa insan' },
  '2026-07-26': { date: '2026-07-26', day: 'Pazar', weekLabel: '20 - 26 Temmuz', minutes: 240, notes: 'Özel üçgenler ve haftalık analiz' },

  // 27 Temmuz - 2 Ağustos 2026
  '2026-07-27': { date: '2026-07-27', day: 'Pazartesi', weekLabel: '27 Temmuz - 2 Ağustos', minutes: 330, notes: 'Okulda etüt ve paragraf çalışması' },
  '2026-07-28': { date: '2026-07-28', day: 'Salı', weekLabel: '27 Temmuz - 2 Ağustos', minutes: 360, notes: 'Matematik ve Fizik soru çözümü' },
  '2026-07-29': { date: '2026-07-29', day: 'Çarşamba', weekLabel: '27 Temmuz - 2 Ağustos', minutes: 300, notes: 'Kütüphanede Kimya çalışması' },
  '2026-07-30': { date: '2026-07-30', day: 'Perşembe', weekLabel: '27 Temmuz - 2 Ağustos', minutes: 390, notes: 'Geometri üçgenler kampı' },
  '2026-07-31': { date: '2026-07-31', day: 'Cuma', weekLabel: '27 Temmuz - 2 Ağustos', minutes: 270, notes: 'Biyoloji kalıtım hazırlık' },
  '2026-08-01': { date: '2026-08-01', day: 'Cumartesi', weekLabel: '27 Temmuz - 2 Ağustos', minutes: 450, notes: 'Hafta sonu genel deneme etüdü' },
  '2026-08-02': { date: '2026-08-02', day: 'Pazar', weekLabel: '27 Temmuz - 2 Ağustos', minutes: 180, notes: 'Eksik konu tekrarları' },

  // 3 - 9 Ağustos 2026
  '2026-08-03': { date: '2026-08-03', day: 'Pazartesi', weekLabel: '3 - 9 Ağustos', minutes: 360, notes: 'TYT kampı ve problem çözümü' },
  '2026-08-04': { date: '2026-08-04', day: 'Salı', weekLabel: '3 - 9 Ağustos', minutes: 330, notes: 'Fizik iş güç enerji' },
  '2026-08-05': { date: '2026-08-05', day: 'Çarşamba', weekLabel: '3 - 9 Ağustos', minutes: 360, notes: 'Matematik fonksiyonlar' },
  '2026-08-06': { date: '2026-08-06', day: 'Perşembe', weekLabel: '3 - 9 Ağustos', minutes: 270, notes: 'Kimya mol kavramı' },
  '2026-08-07': { date: '2026-08-07', day: 'Cuma', weekLabel: '3 - 9 Ağustos', minutes: 390, notes: 'Biyoloji hücre bölünmeleri' },
  '2026-08-08': { date: '2026-08-08', day: 'Cumartesi', weekLabel: '3 - 9 Ağustos', minutes: 420, notes: 'Kurumsal TYT denemesi' },
  '2026-08-09': { date: '2026-08-09', day: 'Pazar', weekLabel: '3 - 9 Ağustos', minutes: 210, notes: 'Haftalık deneme değerlendirmesi' },

  // 10 - 16 Ağustos 2026 (Mevcut Hafta)
  '2026-08-10': { date: '2026-08-10', day: 'Pazartesi', weekLabel: '10 - 16 Ağustos', minutes: 330, notes: 'Okul etüdü ve kütüphane çalışması' },
  '2026-08-11': { date: '2026-08-11', day: 'Salı', weekLabel: '10 - 16 Ağustos', minutes: 360, notes: 'AYT Matematik ve Fizik soru çözümü' },
  '2026-08-12': { date: '2026-08-12', day: 'Çarşamba', weekLabel: '10 - 16 Ağustos', minutes: 300, notes: 'Kimya ve Paragraf rutini' },
  '2026-08-13': { date: '2026-08-13', day: 'Perşembe', weekLabel: '10 - 16 Ağustos', minutes: 270, notes: 'Biyoloji soru taraması' },
  '2026-08-14': { date: '2026-08-14', day: 'Cuma', weekLabel: '10 - 16 Ağustos', minutes: 390, notes: 'Kronometre ile net soru çözümü' }
};

export const INITIAL_STATE: YKSDataState = {
  profile: {
    name: 'Ahmet Yılmaz',
    highSchool: 'Yıldız Anadolu Lisesi',
    className: '12-A SAY',
    targetField: 'SAY',
    targetUniversity: 'İstanbul Teknik Üniversitesi (İTÜ)',
    targetDepartment: 'Bilgisayar Mühendisliği',
    targetRank: 3500,
    targetTYTNet: 105,
    targetAYTNet: 74,
    coachName: 'Elif Çelik (12-A Rehber Öğretmeni)',
    coachNotes: 'İTÜ Bilgisayar hedefi doğrultusunda AYT Matematikte türev-integral ve Fizikte elektromanyetizma pürüzsüzleştirilmeli. Günlük paragraf/problem rutini mükemmel şekilde devam ediyor.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  studyPlans: [
    {
      id: 'plan-1',
      day: 'Pazartesi',
      subject: 'Paragraf',
      topic: 'Paragraf Çözüm Teknikleri & Hızlandırma',
      plannedMinutes: 45,
      completedMinutes: 45,
      status: 'completed',
      notes: '30 Paragraf sorusu zamana karşı çözüldü.'
    },
    {
      id: 'plan-2',
      day: 'Pazartesi',
      subject: 'AYT Matematik',
      topic: 'Türevde Eğim ve Teğet Denklemi',
      plannedMinutes: 120,
      completedMinutes: 120,
      status: 'completed',
      notes: 'İleri düzey 40 soru çözüldü.'
    },
    {
      id: 'plan-1b',
      day: 'Pazartesi',
      subject: 'AYT Fizik',
      topic: 'Vektörler & Bağıl Hareket',
      plannedMinutes: 75,
      completedMinutes: 0,
      status: 'pending',
      targetQuestionCount: 30,
      notes: 'Kavramsal soru bankası testi çözülecek.'
    },
    {
      id: 'plan-2b',
      day: 'Pazartesi',
      subject: 'TYT Matematik',
      topic: 'Günlük Paragraf & Problem Rutini',
      plannedMinutes: 45,
      completedMinutes: 0,
      status: 'pending',
      targetQuestionCount: 25,
      notes: 'Hız ve kronometre takipli rutin.'
    },
    {
      id: 'plan-3',
      day: 'Salı',
      subject: 'AYT Fizik',
      topic: 'Elektriksel Potansiyel ve İş',
      plannedMinutes: 90,
      completedMinutes: 90,
      status: 'completed',
      notes: '3D Fizik kitabından testler tamamlandı.'
    },
    {
      id: 'plan-4',
      day: 'Salı',
      subject: 'AYT Matematik',
      topic: 'Belirsiz & Belirli İntegral Hesabı',
      plannedMinutes: 120,
      completedMinutes: 120,
      status: 'completed',
      notes: 'Değişken değiştirme kuralları çalışıldı.'
    },
    {
      id: 'plan-5',
      day: 'Çarşamba',
      subject: 'AYT Kimya',
      topic: 'Organik Kimya - Alkenler & Alkinler',
      plannedMinutes: 90,
      completedMinutes: 90,
      status: 'completed',
      notes: 'Aydın Yayınları test 4-5 bitti.'
    },
    {
      id: 'plan-6',
      day: 'Çarşamba',
      subject: 'TYT Geometri',
      topic: 'Analitik Geometri - Doğru Analitiği',
      plannedMinutes: 75,
      completedMinutes: 75,
      status: 'completed',
      notes: 'Orijinal Geometri soru bankasından çözüldü.'
    },
    {
      id: 'plan-7',
      day: 'Perşembe',
      subject: 'TYT Geometri',
      topic: 'Üçgende Açılar ve Benzerlik',
      plannedMinutes: 90,
      completedMinutes: 60,
      status: 'in_progress'
    },
    {
      id: 'plan-8',
      day: 'Perşembe',
      subject: 'AYT Matematik',
      topic: 'Trigonometrik Denklemler & Toplam-Fark',
      plannedMinutes: 105,
      completedMinutes: 0,
      status: 'pending'
    },
    {
      id: 'plan-9',
      day: 'Cuma',
      subject: 'AYT Biyoloji',
      topic: 'Protein Sentezi ve DNA',
      plannedMinutes: 90,
      completedMinutes: 0,
      status: 'pending'
    },
    {
      id: 'plan-10',
      day: 'Cuma',
      subject: 'AYT Fizik',
      topic: 'İndüksiyon ve Lenz Kanunu',
      plannedMinutes: 90,
      completedMinutes: 0,
      status: 'pending',
      date: '2026-07-31'
    },
    {
      id: 'plan-11',
      day: 'Cumartesi',
      subject: 'TYT Matematik',
      topic: 'Problemler Karma Soru Çözümü',
      plannedMinutes: 150,
      completedMinutes: 0,
      status: 'pending',
      date: '2026-08-01'
    },
    {
      id: 'plan-12',
      day: 'Pazar',
      subject: 'TYT Türkçe',
      topic: 'Genel TYT Branş Denemesi Provası',
      plannedMinutes: 165,
      completedMinutes: 0,
      status: 'pending'
    }
  ],
  questionLogs: [
    {
      id: 'qlog-1',
      date: '2026-07-25',
      subject: 'TYT Matematik',
      examType: 'TYT',
      targetCount: 60,
      solvedCount: 60,
      correctCount: 52,
      wrongCount: 6,
      emptyCount: 2,
      netScore: 50.5,
      durationMinutes: 75,
      notes: 'Problemler hızı arttı, 2 işlem hatası var.'
    },
    {
      id: 'qlog-2',
      date: '2026-07-26',
      subject: 'AYT Biyoloji',
      examType: 'AYT',
      targetCount: 45,
      solvedCount: 45,
      correctCount: 41,
      wrongCount: 3,
      emptyCount: 1,
      netScore: 40.25,
      durationMinutes: 45,
      notes: 'Genden Proteine konusu sorunsuz.'
    },
    {
      id: 'qlog-3',
      date: '2026-07-27',
      subject: 'Paragraf',
      examType: 'TYT',
      targetCount: 40,
      solvedCount: 40,
      correctCount: 36,
      wrongCount: 3,
      emptyCount: 1,
      netScore: 35.25,
      durationMinutes: 32,
      notes: 'Ana düşünce sorularında 2 yanlış çıktı.'
    },
    {
      id: 'qlog-4',
      date: '2026-07-27',
      subject: 'AYT Matematik',
      examType: 'AYT',
      targetCount: 50,
      solvedCount: 50,
      correctCount: 44,
      wrongCount: 4,
      emptyCount: 2,
      netScore: 43.0,
      durationMinutes: 80,
      notes: 'Türev alma kuralları pekişti.'
    },
    {
      id: 'qlog-5',
      date: '2026-07-28',
      subject: 'AYT Fizik',
      examType: 'AYT',
      targetCount: 35,
      solvedCount: 35,
      correctCount: 29,
      wrongCount: 4,
      emptyCount: 2,
      netScore: 28.0,
      durationMinutes: 45,
      notes: 'Elektrostatik formülleri tekrar edilmeli.'
    },
    {
      id: 'qlog-6',
      date: '2026-07-28',
      subject: 'TYT Geometri',
      examType: 'TYT',
      targetCount: 30,
      solvedCount: 28,
      correctCount: 26,
      wrongCount: 3,
      emptyCount: 1,
      netScore: 25.25,
      durationMinutes: 35,
      notes: 'Analitik geometri soruları tamamlandı.'
    },
    {
      id: 'qlog-7',
      date: '2026-07-29',
      subject: 'AYT Kimya',
      examType: 'AYT',
      targetCount: 40,
      solvedCount: 40,
      correctCount: 38,
      wrongCount: 2,
      emptyCount: 0,
      netScore: 37.5,
      durationMinutes: 45,
      notes: 'Organik bileşik adlandırmaları bitti.'
    },
    {
      id: 'qlog-8',
      date: '2026-07-30',
      subject: 'AYT Matematik',
      examType: 'AYT',
      targetCount: 55,
      solvedCount: 55,
      correctCount: 50,
      wrongCount: 4,
      emptyCount: 1,
      netScore: 49.0,
      durationMinutes: 90,
      notes: 'İntegral alan hesabı kavrandı.'
    },
    {
      id: 'qlog-9',
      date: '2026-06-01',
      subject: 'TYT Türkçe',
      examType: 'TYT',
      targetCount: 50,
      solvedCount: 50,
      correctCount: 43,
      wrongCount: 5,
      emptyCount: 2,
      netScore: 41.75,
      durationMinutes: 45,
      notes: 'Ses bilgisi ve yazım kuralları soruları çözüldü.'
    },
    {
      id: 'qlog-10',
      date: '2026-06-03',
      subject: 'AYT Matematik',
      examType: 'AYT',
      targetCount: 60,
      solvedCount: 60,
      correctCount: 51,
      wrongCount: 6,
      emptyCount: 3,
      netScore: 49.5,
      durationMinutes: 95,
      notes: 'Logaritma grafik ve denklem soruları.'
    },
    {
      id: 'qlog-11',
      date: '2026-06-05',
      subject: 'TYT Fizik',
      examType: 'TYT',
      targetCount: 35,
      solvedCount: 35,
      correctCount: 30,
      wrongCount: 4,
      emptyCount: 1,
      netScore: 29.0,
      durationMinutes: 40,
      notes: 'Kaldırma kuvveti ve basınç testleri.'
    },
    {
      id: 'qlog-12',
      date: '2026-06-07',
      subject: 'AYT Kimya',
      examType: 'AYT',
      targetCount: 40,
      solvedCount: 40,
      correctCount: 36,
      wrongCount: 3,
      emptyCount: 1,
      netScore: 35.25,
      durationMinutes: 45,
      notes: 'Gaz yasaları ve ideal gaz tepkimeleri.'
    },
    {
      id: 'qlog-13',
      date: '2026-06-09',
      subject: 'Paragraf',
      examType: 'TYT',
      targetCount: 30,
      solvedCount: 30,
      correctCount: 28,
      wrongCount: 2,
      emptyCount: 0,
      netScore: 27.5,
      durationMinutes: 24,
      notes: 'Sabah paragraf rutini, süre: 24 dakika.'
    },
    {
      id: 'qlog-14',
      date: '2026-06-11',
      subject: 'AYT Biyoloji',
      examType: 'AYT',
      targetCount: 45,
      solvedCount: 45,
      correctCount: 39,
      wrongCount: 4,
      emptyCount: 2,
      netScore: 38.0,
      durationMinutes: 45,
      notes: 'Sinir sistemi ve hormonlar pekiştirildi.'
    },
    {
      id: 'qlog-15',
      date: '2026-06-14',
      subject: 'TYT Matematik',
      examType: 'TYT',
      targetCount: 70,
      solvedCount: 70,
      correctCount: 62,
      wrongCount: 6,
      emptyCount: 2,
      netScore: 60.5,
      durationMinutes: 95,
      notes: 'Hız ve yaş problemleri ağırlıklı çalışma.'
    },
    {
      id: 'qlog-16',
      date: '2026-06-16',
      subject: 'AYT Fizik',
      examType: 'AYT',
      targetCount: 40,
      solvedCount: 38,
      correctCount: 32,
      wrongCount: 5,
      emptyCount: 1,
      netScore: 30.75,
      durationMinutes: 50,
      notes: 'Bağıl hareket ve Newton yasaları.'
    },
    {
      id: 'qlog-17',
      date: '2026-06-18',
      subject: 'TYT Geometri',
      examType: 'TYT',
      targetCount: 35,
      solvedCount: 35,
      correctCount: 31,
      wrongCount: 3,
      emptyCount: 1,
      netScore: 30.25,
      durationMinutes: 45,
      notes: 'Dik üçgen ve açıortay-kenarortay.'
    },
    {
      id: 'qlog-18',
      date: '2026-06-20',
      subject: 'AYT Matematik',
      examType: 'AYT',
      targetCount: 50,
      solvedCount: 50,
      correctCount: 43,
      wrongCount: 5,
      emptyCount: 2,
      netScore: 41.75,
      durationMinutes: 80,
      notes: 'Trigonometri toplam-fark ve yarım açı.'
    },
    {
      id: 'qlog-19',
      date: '2026-06-22',
      subject: 'TYT Kimya',
      examType: 'TYT',
      targetCount: 30,
      solvedCount: 30,
      correctCount: 28,
      wrongCount: 2,
      emptyCount: 0,
      netScore: 27.5,
      durationMinutes: 30,
      notes: 'Asit, baz ve tuzlar soru taraması.'
    },
    {
      id: 'qlog-20',
      date: '2026-06-24',
      subject: 'Paragraf',
      examType: 'TYT',
      targetCount: 40,
      solvedCount: 40,
      correctCount: 35,
      wrongCount: 4,
      emptyCount: 1,
      netScore: 34.0,
      durationMinutes: 35,
      notes: 'Paragraf bölme ve akışı bozan cümleler.'
    },
    {
      id: 'qlog-21',
      date: '2026-06-26',
      subject: 'AYT Biyoloji',
      examType: 'AYT',
      targetCount: 40,
      solvedCount: 40,
      correctCount: 36,
      wrongCount: 3,
      emptyCount: 1,
      netScore: 35.25,
      durationMinutes: 40,
      notes: 'Dolaşım ve bağışıklık sistemi testleri.'
    },
    {
      id: 'qlog-22',
      date: '2026-06-29',
      subject: 'TYT Türkçe',
      examType: 'TYT',
      targetCount: 45,
      solvedCount: 45,
      correctCount: 40,
      wrongCount: 4,
      emptyCount: 1,
      netScore: 39.0,
      durationMinutes: 40,
      notes: 'Noktalama işaretleri ve karma dil bilgisi.'
    },
    {
      id: 'qlog-23',
      date: '2026-07-01',
      subject: 'AYT Matematik',
      examType: 'AYT',
      targetCount: 65,
      solvedCount: 65,
      correctCount: 58,
      wrongCount: 5,
      emptyCount: 2,
      netScore: 56.75,
      durationMinutes: 105,
      notes: 'Diziler ve aritmetik-geometrik toplam.'
    },
    {
      id: 'qlog-24',
      date: '2026-07-03',
      subject: 'AYT Fizik',
      examType: 'AYT',
      targetCount: 35,
      solvedCount: 35,
      correctCount: 29,
      wrongCount: 4,
      emptyCount: 2,
      netScore: 28.0,
      durationMinutes: 45,
      notes: 'Çembersel hareket ve tork dengesi.'
    },
    {
      id: 'qlog-25',
      date: '2026-07-05',
      subject: 'TYT Matematik',
      examType: 'TYT',
      targetCount: 50,
      solvedCount: 50,
      correctCount: 44,
      wrongCount: 4,
      emptyCount: 2,
      netScore: 43.0,
      durationMinutes: 65,
      notes: 'Yüzde, kar-zarar ve karışım problemleri.'
    },
    {
      id: 'qlog-26',
      date: '2026-07-07',
      subject: 'AYT Kimya',
      examType: 'AYT',
      targetCount: 40,
      solvedCount: 40,
      correctCount: 37,
      wrongCount: 2,
      emptyCount: 1,
      netScore: 36.5,
      durationMinutes: 45,
      notes: 'Tepkimelerde hız ve denge bağıntıları.'
    },
    {
      id: 'qlog-27',
      date: '2026-07-09',
      subject: 'Paragraf',
      examType: 'TYT',
      targetCount: 30,
      solvedCount: 30,
      correctCount: 27,
      wrongCount: 2,
      emptyCount: 1,
      netScore: 26.5,
      durationMinutes: 25,
      notes: 'Yardımcı fikir soruları pratiği.'
    },
    {
      id: 'qlog-28',
      date: '2026-07-11',
      subject: 'TYT Biyoloji',
      examType: 'TYT',
      targetCount: 30,
      solvedCount: 30,
      correctCount: 27,
      wrongCount: 2,
      emptyCount: 1,
      netScore: 26.5,
      durationMinutes: 28,
      notes: 'Hücre bölünmeleri ve kalıtım.'
    },
    {
      id: 'qlog-29',
      date: '2026-07-13',
      subject: 'AYT Matematik',
      examType: 'AYT',
      targetCount: 55,
      solvedCount: 55,
      correctCount: 48,
      wrongCount: 5,
      emptyCount: 2,
      netScore: 46.75,
      durationMinutes: 85,
      notes: 'Limit ve süreklilik konsept testleri.'
    },
    {
      id: 'qlog-30',
      date: '2026-07-15',
      subject: 'AYT Biyoloji',
      examType: 'AYT',
      targetCount: 40,
      solvedCount: 40,
      correctCount: 35,
      wrongCount: 3,
      emptyCount: 2,
      netScore: 34.25,
      durationMinutes: 40,
      notes: 'Solunum ve fotosentez denklemleri.'
    },
    {
      id: 'qlog-31',
      date: '2026-07-17',
      subject: 'TYT Geometri',
      examType: 'TYT',
      targetCount: 30,
      solvedCount: 30,
      correctCount: 27,
      wrongCount: 2,
      emptyCount: 1,
      netScore: 26.5,
      durationMinutes: 38,
      notes: 'Çokgenler ve kare-dikdörtgen testleri.'
    },
    {
      id: 'qlog-32',
      date: '2026-07-19',
      subject: 'AYT Fizik',
      examType: 'AYT',
      targetCount: 35,
      solvedCount: 35,
      correctCount: 30,
      wrongCount: 3,
      emptyCount: 2,
      netScore: 29.25,
      durationMinutes: 45,
      notes: 'Manyetik alan ve indüksiyon akımı.'
    },
    {
      id: 'qlog-33',
      date: '2026-07-20',
      subject: 'TYT Türkçe',
      examType: 'TYT',
      targetCount: 40,
      solvedCount: 40,
      correctCount: 36,
      wrongCount: 3,
      emptyCount: 1,
      netScore: 35.25,
      durationMinutes: 35,
      notes: 'Cümlenin ögeleri ve anlatım bozuklukları.'
    },
    {
      id: 'qlog-34',
      date: '2026-07-21',
      subject: 'AYT Kimya',
      examType: 'AYT',
      targetCount: 45,
      solvedCount: 45,
      correctCount: 41,
      wrongCount: 3,
      emptyCount: 1,
      netScore: 40.25,
      durationMinutes: 50,
      notes: 'Elektrokimya ve pil tepkimeleri.'
    },
    {
      id: 'qlog-35',
      date: '2026-07-22',
      subject: 'AYT Matematik',
      examType: 'AYT',
      targetCount: 60,
      solvedCount: 60,
      correctCount: 53,
      wrongCount: 5,
      emptyCount: 2,
      netScore: 51.75,
      durationMinutes: 90,
      notes: 'Türevde artan-azalanlık ve maksimum-minimum.'
    },
    {
      id: 'qlog-36',
      date: '2026-07-23',
      subject: 'Paragraf',
      examType: 'TYT',
      targetCount: 35,
      solvedCount: 35,
      correctCount: 32,
      wrongCount: 2,
      emptyCount: 1,
      netScore: 31.5,
      durationMinutes: 30,
      notes: 'Çoklu paragraf soruları serisi.'
    },
    {
      id: 'qlog-37',
      date: '2026-07-24',
      subject: 'TYT Matematik',
      examType: 'TYT',
      targetCount: 50,
      solvedCount: 50,
      correctCount: 45,
      wrongCount: 4,
      emptyCount: 1,
      netScore: 44.0,
      durationMinutes: 65,
      notes: 'Kümeler, mantık ve temel kavramlar.'
    },
    {
      id: 'qlog-38',
      date: '2026-07-24',
      subject: 'AYT Biyoloji',
      examType: 'AYT',
      targetCount: 30,
      solvedCount: 30,
      correctCount: 28,
      wrongCount: 1,
      emptyCount: 1,
      netScore: 27.75,
      durationMinutes: 30,
      notes: 'Bitki biyolojisi ve madde taşınması.'
    }
  ],
  resources: [
    {
      id: 'res-1',
      subject: 'AYT Matematik',
      bookTitle: '3D AYT Matematik Soru Bankası',
      publisher: '3D Yayınları',
      totalUnits: 16,
      completedUnits: 12,
      status: 'in_progress',
      examType: 'AYT',
      completedTopics: [
        'Polinomlar & Çarpanlara Ayırma',
        '2. Dereceden Denklemler & Karmaşık Sayılar',
        'Parabol (2. Dereceden Fonksiyon Grafikleri)',
        '2. Dereceden Eşitsizlikler & Sistemleri',
        'Fonksiyonlarda Uygulamalar (Öteleme, Simetri)',
        'Logaritma Fonksiyonu & Özellikleri',
        'Logaritmik Denklem ve Eşitsizlikler',
        'Diziler (Aritmetik ve Geometrik Dizi)',
        'Trigonometri - 1 (Trigonometrik Fonksiyonlar)',
        'Trigonometri - 2 (Toplam-Fark, Yarım Açı, Denklemler)',
        'Limit ve Süreklilik',
        'Türev - 1 (Türev Alma Kuralları, Teğet Eğimleri)'
      ],
      notes: 'Türev 2 ve İntegral testleri kaldı.'
    },
    {
      id: 'res-2',
      subject: 'TYT Türkçe',
      bookTitle: 'Limit Paragraf Soru Bankası',
      publisher: 'Limit Yayınları',
      totalUnits: 15,
      completedUnits: 13,
      status: 'in_progress',
      examType: 'TYT',
      completedTopics: [
        'Sözcükte Anlam & Söz Öbeğinde Anlam',
        'Cümlede Anlam & Kavramlar',
        'Paragrafta Anlam & Yapı',
        'Paragrafta Ana Fikir & Yardımcı Fikirler',
        'Ses Bilgisi',
        'Yazım Kuralları',
        'Noktalama İşaretleri',
        'Sözcükte Yapı & Ekler',
        'İsimler, Sıfatlar, Zamirler',
        'Zarf, Edat, Bağlaç, Ünlem',
        'Fiiller, Ek Fiil, Fiilde Çatı',
        'Fiilimsiler (Eylemsiler)',
        'Cümlenin Ögeleri'
      ],
      notes: 'Son 2 konu kaldı, hızlanma harika.'
    },
    {
      id: 'res-3',
      subject: 'AYT Fizik',
      bookTitle: 'Nihat Bilgin AYT Fizik',
      publisher: 'Nihat Bilgin',
      totalUnits: 17,
      completedUnits: 11,
      status: 'in_progress',
      examType: 'AYT',
      completedTopics: [
        'Vektörler & Bağıl Hareket',
        'Newton\'ın Hareket Yasaları',
        'Sabit İvmeli Hareket & Atışlar',
        'İş, Güç, Enerji & İtme - Momentum',
        'Tork, Denge ve Kütle Merkezi',
        'Basit Makineler',
        'Elektriksel Kuvvet, Alan ve Potansiyel',
        'Paralel Levhalar ve Kondansatörler',
        'Manyetik Alan, Kuvvet ve İndüksiyon',
        'Alternatif Akım ve Transformatörler',
        'Çembersel Hareket & Açısal Momentum'
      ],
      notes: 'Modern Fizik üniteleri kaldı.'
    },
    {
      id: 'res-4',
      subject: 'AYT Kimya',
      bookTitle: 'Aydın Yayınları AYT Kimya',
      publisher: 'Aydın Yayınları',
      totalUnits: 11,
      completedUnits: 11,
      status: 'completed',
      examType: 'AYT',
      completedTopics: [
        'Modern Atom Teorisi (Kuantum Sayıları, Elektron Dizilimi)',
        'Gazlar (Gaz Yasaları, İdeal Gaz)',
        'Sıvı Çözeltiler ve Çözünürlük (Derişim Birimleri)',
        'Kimyasal Tepkimelerde Enerji (Entalpi)',
        'Kimyasal Tepkimelerde Hız',
        'Kimyasal Tepkimelerde Denge',
        'Sulu Çözelti Dengeleri (Asit-Baz, pH, Kçç)',
        'Kimya ve Elektrik (Redoks, Piller, Elektroliz)',
        'Karbon Kimyasına Giriş (Hibritleşme)',
        'Organik Bileşikler - Hidrokarbonlar (Alkan, Alken, Alkin)',
        'Organik Bileşikler - Fonksiyonel Gruplar'
      ],
      notes: 'Kitap tamamen bitirildi ve tekrar edildi!'
    },
    {
      id: 'res-5',
      subject: 'TYT Matematik',
      bookTitle: 'Bilgi Sarmal TYT Matematik Soru Bankası',
      publisher: 'Bilgi Sarmal',
      totalUnits: 18,
      completedUnits: 16,
      status: 'in_progress',
      examType: 'TYT',
      completedTopics: [
        'Temel Kavramlar & Sayı Kümeleri',
        'Basamak Kavramı & Sayı Sistemleri',
        'Bölme & Bölünebilme Kuralları',
        'EBOB - EKOK',
        'Rasyonel & Ondalık Sayılar',
        'Birinci Dereceden Denklem ve Eşitsizlikler',
        'Mutlak Değer',
        'Üslü İfadeler',
        'Köklü İfadeler',
        'Çarpanlara Ayırma',
        'Oran - Orantı',
        'Sayı - Kesir Problemleri',
        'Yaş Problemleri',
        'İşçi - Havuz Problemleri',
        'Hareket (Hız) Problemleri',
        'Yüzde, Kar-Zarar Problemleri'
      ],
      notes: 'Kümeler ve Olasılık testleri tamamlanacak.'
    },
    {
      id: 'res-6',
      subject: 'AYT Biyoloji',
      bookTitle: 'Palme AYT Biyoloji Soru Bankası',
      publisher: 'Palme Yayınevi',
      totalUnits: 12,
      completedUnits: 9,
      status: 'in_progress',
      examType: 'AYT',
      completedTopics: [
        'Sinir Sistemi',
        'Endokrin Sistem',
        'Duyu Organları',
        'Destek ve Hareket Sistemi',
        'Sindirim Sistemi',
        'Dolaşım ve Bağışıklık Sistemi',
        'Solunum Sistemi',
        'Boşaltım Sistemi (Üriner Sistem)',
        'Genden Proteine (DNA, RNA, Protein Sentezi)'
      ],
      notes: 'Fotosentez & Kemosentez ünitesi sıradaki konu.'
    }
  ],
  pastExams: [
    {
      id: 'pe-2025-tyt',
      year: 2025,
      examType: 'TYT',
      subject: 'TYT Genel (Tüm Dersler)',
      solved: true,
      correctCount: 106,
      wrongCount: 11,
      netScore: 103.25,
      analyzed: true,
      notes: 'Süre kontrolü harikaydı, sosyal bilgiler kıvrak sorulmuştu.'
    },
    {
      id: 'pe-2025-ayt',
      year: 2025,
      examType: 'AYT',
      subject: 'AYT Sayısal (Mat & Fen)',
      solved: true,
      correctCount: 70,
      wrongCount: 7,
      netScore: 68.25,
      analyzed: true,
      notes: 'Fizikte modern fizik soruları tekrar edildi.'
    },
    {
      id: 'pe-2024-tyt',
      year: 2024,
      examType: 'TYT',
      subject: 'TYT Genel (Tüm Dersler)',
      solved: true,
      correctCount: 102,
      wrongCount: 13,
      netScore: 98.75,
      analyzed: true
    },
    {
      id: 'pe-2024-ayt',
      year: 2024,
      examType: 'AYT',
      subject: 'AYT Sayısal (Mat & Fen)',
      solved: true,
      correctCount: 67,
      wrongCount: 8,
      netScore: 65.0,
      analyzed: true
    },
    {
      id: 'pe-2023-tyt',
      year: 2023,
      examType: 'TYT',
      subject: 'TYT Genel',
      solved: true,
      correctCount: 99,
      wrongCount: 15,
      netScore: 95.25,
      analyzed: true
    },
    {
      id: 'pe-2023-ayt',
      year: 2023,
      examType: 'AYT',
      subject: 'AYT Sayısal',
      solved: true,
      correctCount: 64,
      wrongCount: 9,
      netScore: 61.75,
      analyzed: true
    },
    {
      id: 'pe-2022-tyt',
      year: 2022,
      examType: 'TYT',
      subject: 'TYT Genel',
      solved: false,
      analyzed: false
    },
    {
      id: 'pe-2022-ayt',
      year: 2022,
      examType: 'AYT',
      subject: 'AYT Sayısal',
      solved: false,
      analyzed: false
    }
  ],
  branchExams: [
    {
      id: 'be-1',
      date: '2026-07-25',
      subject: 'AYT Matematik',
      examType: 'AYT',
      publisher: 'Bilgi Sarmal 15Lı Deneme #3',
      correct: 35,
      wrong: 3,
      empty: 2,
      net: 34.25,
      durationMinutes: 75,
      notes: 'Trigonometri karmaşık sayı hatası.'
    },
    {
      id: 'be-2',
      date: '2026-07-26',
      subject: 'TYT Türkçe',
      examType: 'TYT',
      publisher: '3D Yayınları TYT Türkçe #5',
      correct: 36,
      wrong: 3,
      empty: 1,
      net: 35.25,
      durationMinutes: 40,
      notes: 'Yazım kuralları yanlış yapıldı.'
    },
    {
      id: 'be-3',
      date: '2026-07-27',
      subject: 'AYT Fizik',
      examType: 'AYT',
      publisher: 'Aydın Yayınları Fizik Branş #2',
      correct: 12,
      wrong: 1,
      empty: 1,
      net: 11.75,
      durationMinutes: 25
    },
    {
      id: 'be-4',
      date: '2026-07-28',
      subject: 'AYT Kimya',
      examType: 'AYT',
      publisher: 'Palme Kimya Branş Deneme #2',
      correct: 13,
      wrong: 0,
      empty: 0,
      net: 13.0,
      durationMinutes: 20,
      notes: 'Full çekildi! Organik netleşti.'
    },
    {
      id: 'be-5',
      date: '2026-07-29',
      subject: 'TYT Matematik',
      examType: 'TYT',
      publisher: 'Orijinal Yayınları TYT Mat Branş #6',
      correct: 36,
      wrong: 3,
      empty: 1,
      net: 35.25,
      durationMinutes: 58
    },
    {
      id: 'be-6',
      date: '2026-06-02',
      subject: 'TYT Türkçe',
      examType: 'TYT',
      publisher: 'Limit Yayınları Kronometre #1',
      correct: 33,
      wrong: 5,
      empty: 2,
      net: 31.75,
      durationMinutes: 42,
      notes: 'Paragraf olumsuz köklü sorularda süre kayboldu.'
    },
    {
      id: 'be-7',
      date: '2026-06-05',
      subject: 'TYT Matematik',
      examType: 'TYT',
      publisher: 'Bilgi Sarmal TYT Mat #1',
      correct: 32,
      wrong: 4,
      empty: 4,
      net: 31.0,
      durationMinutes: 65,
      notes: 'Problemlerde denklem kurma hataları vardı.'
    },
    {
      id: 'be-8',
      date: '2026-06-08',
      subject: 'AYT Matematik',
      examType: 'AYT',
      publisher: '3D Yayınları AYT Mat #1',
      correct: 30,
      wrong: 4,
      empty: 6,
      net: 29.0,
      durationMinutes: 80,
      notes: 'Logaritma ve dizi soruları iyi geçti.'
    },
    {
      id: 'be-9',
      date: '2026-06-12',
      subject: 'TYT Fizik',
      examType: 'TYT',
      publisher: 'Karekök TYT Fizik #1',
      correct: 6,
      wrong: 1,
      empty: 0,
      net: 5.75,
      durationMinutes: 12,
      notes: 'Optik kırılma sorusu kaçtı.'
    },
    {
      id: 'be-10',
      date: '2026-06-15',
      subject: 'TYT Kimya',
      examType: 'TYT',
      publisher: 'Aydın Yayınları TYT Kimya #1',
      correct: 7,
      wrong: 0,
      empty: 0,
      net: 7.0,
      durationMinutes: 10,
      notes: 'Mol kavramı ve karışımlar tam net.'
    },
    {
      id: 'be-11',
      date: '2026-06-18',
      subject: 'TYT Biyoloji',
      examType: 'TYT',
      publisher: 'Palme TYT Biyoloji #1',
      correct: 5,
      wrong: 1,
      empty: 0,
      net: 4.75,
      durationMinutes: 8,
      notes: 'Kalıtım soyağacı hatası.'
    },
    {
      id: 'be-12',
      date: '2026-06-21',
      subject: 'AYT Fizik',
      examType: 'AYT',
      publisher: 'Nihat Bilgin AYT Fizik #1',
      correct: 10,
      wrong: 2,
      empty: 2,
      net: 9.5,
      durationMinutes: 28,
      notes: 'İtme-momentum bağıntısı karıştırıldı.'
    },
    {
      id: 'be-13',
      date: '2026-06-25',
      subject: 'AYT Kimya',
      examType: 'AYT',
      publisher: '3D Yayınları AYT Kimya #1',
      correct: 11,
      wrong: 1,
      empty: 1,
      net: 10.75,
      durationMinutes: 22,
      notes: 'Gazlar ideal gaz denklemi birim hatası.'
    },
    {
      id: 'be-14',
      date: '2026-06-28',
      subject: 'AYT Biyoloji',
      examType: 'AYT',
      publisher: 'Dr. Biyoloji AYT #1',
      correct: 11,
      wrong: 2,
      empty: 0,
      net: 10.5,
      durationMinutes: 18,
      notes: 'Endokrin sistem hormon fonksiyonları tekrar edildi.'
    },
    {
      id: 'be-15',
      date: '2026-07-02',
      subject: 'TYT Türkçe',
      examType: 'TYT',
      publisher: 'Bilgi Sarmal Türkçe #4',
      correct: 35,
      wrong: 3,
      empty: 2,
      net: 34.25,
      durationMinutes: 38,
      notes: 'Cümlenin ögeleri dikkatsizlik.'
    },
    {
      id: 'be-16',
      date: '2026-07-05',
      subject: 'TYT Matematik',
      examType: 'TYT',
      publisher: '3D Yayınları Simülasyon #3',
      correct: 35,
      wrong: 2,
      empty: 3,
      net: 34.5,
      durationMinutes: 55,
      notes: 'Geometri katı cisimler iyi çözüldü.'
    },
    {
      id: 'be-17',
      date: '2026-07-08',
      subject: 'AYT Matematik',
      examType: 'AYT',
      publisher: 'Apotemi AYT Mat Branş #2',
      correct: 33,
      wrong: 4,
      empty: 3,
      net: 32.0,
      durationMinutes: 78,
      notes: 'Türev maks-min problemleri sorusu harikaydı.'
    },
    {
      id: 'be-18',
      date: '2026-07-11',
      subject: 'TYT Geometri',
      examType: 'TYT',
      publisher: 'Orijinal Geometri Branş #1',
      correct: 9,
      wrong: 1,
      empty: 0,
      net: 8.75,
      durationMinutes: 18,
      notes: 'Çemberde açılar katlama sorusu çözüldü.'
    },
    {
      id: 'be-19',
      date: '2026-07-14',
      subject: 'Paragraf',
      examType: 'TYT',
      publisher: 'Hız ve Renk Paragraf #5',
      correct: 18,
      wrong: 2,
      empty: 0,
      net: 17.5,
      durationMinutes: 20,
      notes: '20 soruluk pratik paragraf denemesi.'
    },
    {
      id: 'be-20',
      date: '2026-07-17',
      subject: 'AYT Fizik',
      examType: 'AYT',
      publisher: 'Ertan Sinan Şahin AYT #3',
      correct: 13,
      wrong: 1,
      empty: 0,
      net: 12.75,
      durationMinutes: 26,
      notes: 'Çembersel hareket ve viraj emniyeti tam net.'
    },
    {
      id: 'be-21',
      date: '2026-07-19',
      subject: 'AYT Kimya',
      examType: 'AYT',
      publisher: 'Aydın Yayınları AYT Kimya #3',
      correct: 12,
      wrong: 1,
      empty: 0,
      net: 11.75,
      durationMinutes: 21,
      notes: 'Sulu çözeltilerde denge (KÇÇ) sorusu dikkat hatası.'
    },
    {
      id: 'be-22',
      date: '2026-07-21',
      subject: 'AYT Biyoloji',
      examType: 'AYT',
      publisher: 'Palme AYT Biyoloji #3',
      correct: 12,
      wrong: 1,
      empty: 0,
      net: 11.75,
      durationMinutes: 16,
      notes: 'Protein sentezi şifrelenme evreleri pekişti.'
    },
    {
      id: 'be-23',
      date: '2026-07-22',
      subject: 'TYT Türkçe',
      examType: 'TYT',
      publisher: '3D Yayınları Türkçe #6',
      correct: 37,
      wrong: 2,
      empty: 1,
      net: 36.5,
      durationMinutes: 37,
      notes: '37 dakika sürdü, harika hız!'
    },
    {
      id: 'be-24',
      date: '2026-07-23',
      subject: 'TYT Matematik',
      examType: 'TYT',
      publisher: 'Bilgi Sarmal TYT Mat #8',
      correct: 37,
      wrong: 2,
      empty: 1,
      net: 36.5,
      durationMinutes: 52,
      notes: 'Mantık ve küme soruları çok kolaydı.'
    },
    {
      id: 'be-25',
      date: '2026-07-24',
      subject: 'AYT Matematik',
      examType: 'AYT',
      publisher: 'Orijinal AYT Mat Branş #4',
      correct: 36,
      wrong: 2,
      empty: 2,
      net: 35.5,
      durationMinutes: 72,
      notes: 'İntegral alan hesabı sorusu kusursuz.'
    }
  ],
  topicErrors: [
    {
      id: 'err-1',
      date: '2026-07-25',
      subject: 'AYT Matematik',
      examType: 'AYT',
      topicName: 'Trigonometrik Denklemler',
      publisher: 'Bilgi Sarmal',
      errorReason: 'bilgi_eksigi',
      priority: 'high',
      revised: false,
      solutionNotes: 'Kök bulma formülünde k*pi eklemeyi unuttum.'
    },
    {
      id: 'err-2',
      date: '2026-07-26',
      subject: 'TYT Türkçe',
      examType: 'TYT',
      topicName: 'Noktalama İşaretleri & Kesme İşareti',
      publisher: '3D Yayınları',
      errorReason: 'dikkat_hatasi',
      priority: 'medium',
      revised: true,
      solutionNotes: 'Kurum ve kuruluş adlarına gelen ekler ayrılmaz kuralı hatırlandı.'
    }
  ],
  generalMocks: [
    {
      id: 'gm-1',
      title: 'ÖZDEBİR TG Deneme 1',
      date: '2025-10-15',
      tyt: {
        turkce: 29.5,
        sosyal: 13.0,
        mat: 28.0,
        fen: 14.5,
        totalNet: 85.0,
        details: {
          turkce: { correct: 32, wrong: 10, empty: 0, net: 29.5 },
          matematik: { correct: 22, wrong: 4, empty: 4, net: 21.0 },
          geometri: { correct: 8, wrong: 4, empty: 0, net: 7.0 },
          fizik: { correct: 5, wrong: 2, empty: 0, net: 4.5 },
          kimya: { correct: 6, wrong: 4, empty: 0, net: 5.0 },
          biyoloji: { correct: 5, wrong: 0, empty: 1, net: 5.0 },
          tarih: { correct: 4, wrong: 4, empty: 0, net: 3.0 },
          cografya: { correct: 4, wrong: 0, empty: 1, net: 4.0 },
          felsefe: { correct: 3, wrong: 0, empty: 2, net: 3.0 },
          din: { correct: 3, wrong: 0, empty: 2, net: 3.0 }
        }
      },
      ayt: {
        mat: 23.0,
        fen: 22.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 45.0,
        details: {
          matematik: { correct: 18, wrong: 4, empty: 8, net: 17.0 },
          geometri: { correct: 7, wrong: 4, empty: 1, net: 6.0 },
          fizik: { correct: 8, wrong: 4, empty: 2, net: 7.0 },
          kimya: { correct: 9, wrong: 4, empty: 0, net: 8.0 },
          biyoloji: { correct: 8, wrong: 4, empty: 1, net: 7.0 }
        }
      },
      estimatedRank: 16500,
      notes: 'Sezon ilk Türkiye Geneli denemesi.'
    },
    {
      id: 'gm-2',
      title: 'Bilgi Sarmal TG Deneme 1',
      date: '2025-11-02',
      tyt: {
        turkce: 32.0,
        sosyal: 14.5,
        mat: 30.5,
        fen: 15.0,
        totalNet: 92.0,
        details: {
          turkce: { correct: 34, wrong: 8, empty: 0, net: 32.0 },
          matematik: { correct: 24, wrong: 4, empty: 2, net: 23.0 },
          geometri: { correct: 8, wrong: 2, empty: 0, net: 7.5 },
          fizik: { correct: 6, wrong: 4, empty: 0, net: 5.0 },
          kimya: { correct: 5, wrong: 0, empty: 2, net: 5.0 },
          biyoloji: { correct: 5, wrong: 0, empty: 1, net: 5.0 },
          tarih: { correct: 4, wrong: 0, empty: 1, net: 4.0 },
          cografya: { correct: 4, wrong: 4, empty: 0, net: 3.0 },
          felsefe: { correct: 4, wrong: 0, empty: 1, net: 4.0 },
          din: { correct: 4, wrong: 2, empty: 0, net: 3.5 }
        }
      },
      ayt: {
        mat: 26.5,
        fen: 24.5,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 51.0,
        details: {
          matematik: { correct: 20, wrong: 4, empty: 6, net: 19.0 },
          geometri: { correct: 8, wrong: 2, empty: 0, net: 7.5 },
          fizik: { correct: 9, wrong: 4, empty: 1, net: 8.0 },
          kimya: { correct: 9, wrong: 4, empty: 0, net: 8.0 },
          biyoloji: { correct: 9, wrong: 2, empty: 2, net: 8.5 }
        }
      },
      estimatedRank: 11200,
      notes: 'Temposu iyi bir denemeydi, yüksek net geldi.'
    },
    {
      id: 'gm-3',
      title: '3D Yayınları TG Deneme 1',
      date: '2025-11-20',
      tyt: {
        turkce: 27.5,
        sosyal: 12.0,
        mat: 25.0,
        fen: 12.5,
        totalNet: 77.0
      },
      ayt: {
        mat: 20.5,
        fen: 21.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 41.5
      },
      estimatedRank: 21000,
      notes: '3D aşırı zordu, matematikte süre yetişmedi ve düşüş oldu.'
    },
    {
      id: 'gm-4',
      title: 'Palme TG Deneme 1',
      date: '2025-12-05',
      tyt: {
        turkce: 31.0,
        sosyal: 14.0,
        mat: 29.0,
        fen: 16.0,
        totalNet: 90.0
      },
      ayt: {
        mat: 25.0,
        fen: 27.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 52.0
      },
      estimatedRank: 12500,
      notes: 'Tekrar toparlanma sağlandı.'
    },
    {
      id: 'gm-5',
      title: 'Limit Yayınları TG Deneme 1',
      date: '2025-12-22',
      tyt: {
        turkce: 28.5,
        sosyal: 13.5,
        mat: 27.0,
        fen: 14.0,
        totalNet: 83.0
      },
      ayt: {
        mat: 24.0,
        fen: 23.5,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 47.5
      },
      estimatedRank: 17800,
      notes: 'Paragraf olumsuz köklü sorular çok vakit kaybettirdi.'
    },
    {
      id: 'gm-6',
      title: 'TÖDER TG Deneme 1',
      date: '2026-01-10',
      tyt: {
        turkce: 33.0,
        sosyal: 15.0,
        mat: 32.5,
        fen: 15.5,
        totalNet: 96.0
      },
      ayt: {
        mat: 28.5,
        fen: 27.5,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 56.0
      },
      estimatedRank: 8900,
      notes: 'Sömestr öncesi harika bir ivme yakalandı.'
    },
    {
      id: 'gm-7',
      title: 'Apotemi TG Deneme 1',
      date: '2026-01-28',
      tyt: {
        turkce: 29.0,
        sosyal: 12.5,
        mat: 26.5,
        fen: 13.5,
        totalNet: 81.5
      },
      ayt: {
        mat: 22.0,
        fen: 23.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 45.0
      },
      estimatedRank: 19200,
      notes: 'Apotemi klasiği, sorular aşırı seçiciydi netler düştü.'
    },
    {
      id: 'gm-8',
      title: 'Krallar Karması TG Deneme 1',
      date: '2026-02-14',
      tyt: {
        turkce: 32.5,
        sosyal: 15.0,
        mat: 31.0,
        fen: 15.0,
        totalNet: 93.5
      },
      ayt: {
        mat: 29.0,
        fen: 28.5,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 57.5
      },
      estimatedRank: 9900,
      notes: 'Yeniden 90+ üstüne çıkıldı.'
    },
    {
      id: 'gm-9',
      title: 'ÖZDEBİR TG Deneme 2',
      date: '2026-03-01',
      tyt: {
        turkce: 34.0,
        sosyal: 16.0,
        mat: 34.5,
        fen: 16.5,
        totalNet: 101.0
      },
      ayt: {
        mat: 32.0,
        fen: 31.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 63.0
      },
      estimatedRank: 5800,
      notes: 'İlk kez TYT 100 net barajı geçildi!'
    },
    {
      id: 'gm-10',
      title: 'Supara TG Deneme 2',
      date: '2026-03-18',
      tyt: {
        turkce: 30.0,
        sosyal: 14.0,
        mat: 30.0,
        fen: 14.5,
        totalNet: 88.5
      },
      ayt: {
        mat: 27.5,
        fen: 26.5,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 54.0
      },
      estimatedRank: 13500,
      notes: '100 net sonrası dikkatsizlikler yüzünden sert düşüş.'
    },
    {
      id: 'gm-11',
      title: 'Bilgi Sarmal TG Deneme 2',
      date: '2026-04-05',
      tyt: {
        turkce: 33.5,
        sosyal: 15.5,
        mat: 33.0,
        fen: 16.0,
        totalNet: 98.0
      },
      ayt: {
        mat: 31.5,
        fen: 31.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 62.5
      },
      estimatedRank: 7200,
      notes: 'Eksik konular kapatıldı, netler tekrar yükselişte.'
    },
    {
      id: 'gm-12',
      title: 'Aydın Yayınları TG Deneme 2',
      date: '2026-04-22',
      tyt: {
        turkce: 31.5,
        sosyal: 14.5,
        mat: 29.5,
        fen: 17.0,
        totalNet: 92.5
      },
      ayt: {
        mat: 33.0,
        fen: 33.5,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 66.5
      },
      estimatedRank: 6900,
      notes: 'AYT neti çok iyi gelirken TYT matematikte küçük bir sarkma oldu.'
    },
    {
      id: 'gm-13',
      title: 'Paraf TG Deneme 2',
      date: '2026-05-08',
      tyt: {
        turkce: 34.5,
        sosyal: 16.5,
        mat: 35.0,
        fen: 16.0,
        totalNet: 102.0
      },
      ayt: {
        mat: 31.0,
        fen: 30.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 61.0
      },
      estimatedRank: 6100,
      notes: 'TYT tekrar 100 üstü, AYT orta şeker.'
    },
    {
      id: 'gm-14',
      title: 'ÖZDEBİR TG Deneme 3',
      date: '2026-05-22',
      tyt: {
        turkce: 32.0,
        sosyal: 15.0,
        mat: 32.0,
        fen: 15.0,
        totalNet: 94.0
      },
      ayt: {
        mat: 35.0,
        fen: 34.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 69.0
      },
      estimatedRank: 5200,
      notes: 'AYT rekor nete ulaştı.'
    },
    {
      id: 'gm-15',
      title: 'TÖDER TG Deneme 2',
      date: '2026-06-05',
      tyt: {
        turkce: 35.0,
        sosyal: 17.0,
        mat: 36.0,
        fen: 17.0,
        totalNet: 105.0
      },
      ayt: {
        mat: 33.5,
        fen: 32.5,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 66.0
      },
      estimatedRank: 4200,
      notes: 'Çok dengeli yüksek performans.'
    },
    {
      id: 'gm-16',
      title: '3D TG Deneme 2',
      date: '2026-06-18',
      tyt: {
        turkce: 31.5,
        sosyal: 14.5,
        mat: 31.0,
        fen: 15.0,
        totalNet: 92.0
      },
      ayt: {
        mat: 30.0,
        fen: 29.5,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 59.5
      },
      estimatedRank: 8500,
      notes: '3D sınav zorluğu genel net ortalamasını düşürdü.'
    },
    {
      id: 'gm-17',
      title: 'Enderun TG Deneme 3',
      date: '2026-07-02',
      tyt: {
        turkce: 35.0,
        sosyal: 16.5,
        mat: 35.5,
        fen: 16.5,
        totalNet: 103.5
      },
      ayt: {
        mat: 36.0,
        fen: 35.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 71.0
      },
      estimatedRank: 3600,
      notes: 'AYT 70 net barajı aşıldı.'
    },
    {
      id: 'gm-18',
      title: 'Krallar Karması Son Prova',
      date: '2026-07-12',
      tyt: {
        turkce: 33.5,
        sosyal: 15.5,
        mat: 34.0,
        fen: 15.5,
        totalNet: 98.5
      },
      ayt: {
        mat: 34.5,
        fen: 34.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 68.5
      },
      estimatedRank: 5100,
      notes: 'Ufak bir yorgunluk ve dalgalanma.'
    },
    {
      id: 'gm-19',
      title: 'ÖZDEBİR Son Prova TG',
      date: '2026-07-20',
      tyt: {
        turkce: 36.0,
        sosyal: 17.5,
        mat: 37.0,
        fen: 17.0,
        totalNet: 107.5
      },
      ayt: {
        mat: 37.5,
        fen: 36.0,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 73.5
      },
      estimatedRank: 2600,
      notes: 'Zirve performans, motivasyon tavan!'
    },
    {
      id: 'gm-20',
      title: 'Bilgi Sarmal YKS Son Prova',
      date: '2026-07-28',
      tyt: {
        turkce: 35.0,
        sosyal: 16.5,
        mat: 35.5,
        fen: 16.5,
        totalNet: 103.5
      },
      ayt: {
        mat: 36.5,
        fen: 35.5,
        edebiyatSos1: 0,
        sos2: 0,
        totalNet: 72.0
      },
      estimatedRank: 3100,
      notes: 'YKS öncesi dengeli ve özgüvenli son prova.'
    }
  ],
  youtubeVideos: [
    {
      id: 'yt-1',
      subject: 'AYT Matematik',
      channelName: 'Eyüp B. Matematik',
      topicName: 'Türev Kampı 1. Video (Türev Kavramı & Eğim)',
      playlistTitle: 'AYT Matematik Derece Kampı',
      videoUrl: 'https://www.youtube.com/results?search_query=eyup+b+turev',
      isWatched: true,
      notes: 'Mükemmel bakış açıları var, soruların pratik mantığı not alındı.'
    },
    {
      id: 'yt-2',
      subject: 'AYT Matematik',
      channelName: 'Eyüp B. Matematik',
      topicName: 'İntegral Belirli İntegral ile Alan Hesabı',
      playlistTitle: 'AYT Matematik Derece Kampı',
      videoUrl: 'https://www.youtube.com/results?search_query=eyup+b+integral+alan',
      isWatched: true,
      notes: 'Eğriler arasında kalan alan soru tipleri incelendi.'
    },
    {
      id: 'yt-3',
      subject: 'AYT Fizik',
      channelName: 'VIP Fizik',
      topicName: 'Elektromanyetik İndüksiyon ve Lenz Kanunu',
      playlistTitle: '2026 AYT Fizik Kampı',
      videoUrl: 'https://www.youtube.com/results?search_query=vip+fizik+induksiyon',
      isWatched: false,
      notes: 'Lenz kanunu yön tayini kısmını dikkatli izle.'
    },
    {
      id: 'yt-4',
      subject: 'AYT Fizik',
      channelName: 'VIP Fizik',
      topicName: 'Düzgün Çembersel Hareket ve Açısal Momentum',
      playlistTitle: '2026 AYT Fizik Kampı',
      videoUrl: 'https://www.youtube.com/results?search_query=vip+fizik+cembersel+hareket',
      isWatched: true,
      notes: 'Vektörel yön tayini ve tork ilişkisi kavrandı.'
    },
    {
      id: 'yt-5',
      subject: 'TYT Türkçe',
      channelName: 'Rüştü Hoca ile Türkçe',
      topicName: 'Paragraf Taktikleri 2026',
      playlistTitle: 'Paragraf Kampı',
      videoUrl: 'https://www.youtube.com/results?search_query=rustu+hoca+paragraf',
      isWatched: true,
      notes: 'Soru köklerini okuma hızı geliştiren ipuçları alındı.'
    },
    {
      id: 'yt-6',
      subject: 'AYT Kimya',
      channelName: 'Görkem Şahin Kimya',
      topicName: 'Organik Kimya - Alkenler ve Alkinler',
      playlistTitle: 'AYT Kimya Full Tekrar',
      videoUrl: 'https://www.youtube.com/results?search_query=gorkem+sahin+organik+kimya',
      isWatched: true,
      notes: 'IUPAC adlandırma kuralları pekişti.'
    },
    {
      id: 'yt-7',
      subject: 'AYT Biyoloji',
      channelName: 'Dr. Biyoloji',
      topicName: 'Genden Proteine & Protein Sentezi',
      playlistTitle: 'AYT Biyoloji Derece Kampı',
      videoUrl: 'https://www.youtube.com/results?search_query=dr+biyoloji+protein+sentezi',
      isWatched: false,
      notes: 'Şifreler ve kodon tablosu kısımları izlenecek.'
    },
    {
      id: 'yt-8',
      subject: 'TYT Geometri',
      channelName: 'Kenan Kara ile Geometri',
      topicName: 'Analitik Geometri ve Doğru Denklemleri',
      playlistTitle: 'TYT-AYT Geometri Kampı',
      videoUrl: 'https://www.youtube.com/results?search_query=kenan+kara+analitik+geometri',
      isWatched: true,
      notes: 'Eğim açısı ve dik kesişen doğrular bağıntıları çalışıldı.'
    }
  ],
  coachAdvices: [
    {
      timestamp: '2026-07-28 14:30',
      generalEvaluation: 'Genel gidişatın son derece olumlu. TÖDER denemesinde 108.5 TYT / 73.5 AYT neti ile hedeflenen İTÜ Bilgisayar Mühendisliği derecesine adım adım ilerliyorsun. TYT Matematik ve Türkçe netlerin yüksek seyrini koruyor.',
      strengths: ['TYT Türkçe paragraf hızı ve odaklanma', 'AYT Kimya konularının eksiksiz biterilmesi', 'Düzenli ve disiplinli günlük soru kaydı'],
      weakAreas: ['AYT Fizik Magnetizma & İndüksiyon sağ el kuralı', 'Trigonometrik denklemler işaret hataları'],
      actionPlan: [
        'Haftada en az 2 adet AYT Matematik branş denemesi çöz ve yanlış soruların çözümünü hocalarına sor.',
        'VIP Fizik İndüksiyon videosunu izleyip 3D soru bankasından 30 soru çöz.',
        'Günlük 30 Paragraf + 15 Problem rutinine aksatmadan devam et.'
      ],
      motivationalQuote: 'Disiplin, ne istediğin ile en çok ne istediğin arasında seçim yapmaktır. Zirve seni bekliyor!'
    },
    {
      timestamp: '2026-07-20 11:00',
      generalEvaluation: 'TYT Netlerin 105 barajını aştı. AYT Matematikte türev ve integral konularındaki başarın takdire şayan. Fizik elektrostatik sorularına özen gösterelim.',
      strengths: ['AYT Matematik soru çözüm hızı', 'Düzenli deneme analizi yapma alışkanlığı'],
      weakAreas: ['Fizik elektrostatik formül karıştırma'],
      actionPlan: ['Fizik elektrostatik özet kâğıdı çıkar ve panona as.'],
      motivationalQuote: 'Başarı, her gün tekrarlanan küçük çabaların toplamıdır.'
    }
  ],
  sheetsStatus: {
    isConnected: false
  },
  dailyStudyLogs: DEFAULT_DAILY_STUDY_LOGS
};

export const INITIAL_STUDENT_2_STATE: YKSDataState = {
  ...INITIAL_STATE,
  profile: {
    name: 'Zeynep Kaya',
    highSchool: 'Yıldız Anadolu Lisesi',
    className: '12-A SAY',
    targetField: 'SAY',
    targetUniversity: 'Hacettepe Üniversitesi',
    targetDepartment: 'Tıp Fakültesi',
    targetRank: 1000,
    targetTYTNet: 110,
    targetAYTNet: 76,
    coachName: 'Mustafa Öğretmen',
    coachNotes: 'Çok yüksek tempolu çalışma. AYT Biyoloji ve Fizikte harika ilerliyor. Denemelerde süre arttırma egzersizleri yapılıyor.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  questionLogs: [
    {
      id: 'qlog-z1',
      date: '2026-07-28',
      subject: 'AYT Matematik',
      examType: 'AYT',
      targetCount: 60,
      solvedCount: 60,
      correctCount: 54,
      wrongCount: 4,
      emptyCount: 2,
      netScore: 53.0
    },
    {
      id: 'qlog-z2',
      date: '2026-07-27',
      subject: 'AYT Biyoloji',
      examType: 'AYT',
      targetCount: 50,
      solvedCount: 50,
      correctCount: 48,
      wrongCount: 2,
      emptyCount: 0,
      netScore: 47.5
    }
  ],
  generalMocks: [
    {
      id: 'gm-z1',
      title: '3D Türkiye Geneli Deneme 2',
      date: '2026-07-22',
      tyt: { turkce: 38.0, sosyal: 18.5, mat: 38.5, fen: 19.0, totalNet: 114.0 },
      ayt: { mat: 38.0, fen: 37.5, edebiyatSos1: 0, sos2: 0, totalNet: 75.5 },
      estimatedRank: 850,
      notes: 'Tıp hedefi için mükemmel net!'
    }
  ]
};

export const INITIAL_STUDENT_3_STATE: YKSDataState = {
  ...INITIAL_STATE,
  profile: {
    name: 'Mehmet Demir',
    highSchool: 'Yıldız Anadolu Lisesi',
    className: '12-B EA',
    targetField: 'EA',
    targetUniversity: 'Galatasaray Üniversitesi',
    targetDepartment: 'Hukuk Fakültesi',
    targetRank: 2500,
    targetTYTNet: 95,
    targetAYTNet: 68,
    coachName: 'Mustafa Öğretmen',
    coachNotes: 'Edebiyat ezberleri ve Matematik limit-türev ağırlıklı programlandı.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  questionLogs: [
    {
      id: 'qlog-m1',
      date: '2026-07-28',
      subject: 'AYT Edebiyat',
      examType: 'AYT',
      targetCount: 50,
      solvedCount: 50,
      correctCount: 44,
      wrongCount: 4,
      emptyCount: 2,
      netScore: 43.0
    }
  ],
  generalMocks: [
    {
      id: 'gm-m1',
      title: 'ÖZDEBİR Türkiye Geneli 3',
      date: '2026-07-15',
      tyt: { turkce: 34.0, sosyal: 17.0, mat: 28.5, fen: 12.0, totalNet: 91.5 },
      ayt: { mat: 28.0, fen: 0, edebiyatSos1: 34.5, sos2: 0, totalNet: 62.5 },
      estimatedRank: 2900
    }
  ]
};

export const INITIAL_STUDENT_4_STATE: YKSDataState = {
  ...INITIAL_STATE,
  profile: {
    ...INITIAL_STATE.profile,
    name: 'Burak ÇAKIR'
  }
};

export const DEMO_USERS = [
  {
    id: 'student-1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@okul.edu.tr',
    password: '123',
    role: 'student' as const,
    className: '12-A SAY',
    title: '12. Sınıf SAY Öğrencisi',
    status: 'active' as const,
    isOnline: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'student-4',
    name: 'Burak ÇAKIR',
    email: 'burak@okul.edu.tr',
    password: '123',
    role: 'student' as const,
    className: '12-A SAY',
    title: '12. Sınıf SAY Öğrencisi (Yedek)',
    status: 'active' as const,
    isOnline: true,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'student-2',
    name: 'Zeynep Kaya',
    email: 'zeynep@okul.edu.tr',
    password: '123',
    role: 'student' as const,
    className: '12-A SAY',
    title: '12. Sınıf SAY Öğrencisi',
    status: 'active' as const,
    isOnline: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'student-3',
    name: 'Mehmet Demir',
    email: 'mehmet@okul.edu.tr',
    password: '123',
    role: 'student' as const,
    className: '12-B EA',
    title: '12. Sınıf EA Öğrencisi',
    status: 'active' as const,
    isOnline: false,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'student-pending-1',
    name: 'Caner Özkan (Onay Bekliyor)',
    email: 'caner@okul.edu.tr',
    password: '123',
    role: 'student' as const,
    className: '12-A SAY',
    title: '12. Sınıf SAY Öğrencisi (Onay Bekliyor)',
    status: 'pending' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'teacher-1',
    name: 'Çağlayan ÇAKIR',
    email: 'caglayan.mat@gmail.com',
    password: '123',
    role: 'admin' as const,
    assignedClassNames: ['12-A SAY', '12-B EA', 'Mezun-1'],
    title: 'Sistem Yöneticisi',
    status: 'active' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'teacher-2',
    name: 'Elif Çelik',
    email: 'elif.hoca@okul.edu.tr',
    password: '123',
    role: 'class_teacher' as const,
    assignedClassNames: ['12-A SAY'],
    title: '12-A SAY Sınıf Rehber Öğretmeni',
    status: 'active' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'teacher-3',
    name: 'Dilek Küçük',
    email: 'demo.rehber@yksdemo.local',
    password: '123',
    role: 'school_counselor' as const,
    assignedClassNames: ['12-A SAY', '12-B EA', 'Mezun-1'],
    title: 'Okul Rehber Öğretmeni',
    status: 'active' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  }
];

export const DEMO_CLASSES = [
  {
    id: 'class-1',
    name: '12-A SAY',
    description: 'Sayısal Derece Şubesi',
    assignedTeacherIds: ['teacher-1', 'teacher-2']
  },
  {
    id: 'class-2',
    name: '12-B EA',
    description: 'Eşit Ağırlık Hedef Şubesi',
    assignedTeacherIds: ['teacher-1']
  },
  {
    id: 'class-3',
    name: 'Mezun-1',
    description: 'Mezun Derece Grubu',
    assignedTeacherIds: ['teacher-1']
  }
];

export const DEFAULT_PROGRAM_TEMPLATES = [
  {
    id: 'template-1',
    title: '⚡ TYT 70+ Net Hızlandırma Programı',
    description: 'Haftalık düzenli problem, paragraf ve fen tekrarıyla TYT netlerini hızla yükselten koçluk programı.',
    targetField: 'TÜMÜ' as const,
    createdByName: 'Mustafa Yılmaz (Rehber Koç)',
    createdAt: '2026-07-01',
    items: [
      { day: 'Pazartesi' as const, subject: 'Paragraf', topic: '30 Paragraf Sorusu Zamana Karşı', plannedMinutes: 45, notes: 'Kronometre tutarak çöz' },
      { day: 'Pazartesi' as const, subject: 'TYT Matematik', topic: 'Sayı & Kesir Problemleri', plannedMinutes: 90, notes: 'En az 40 soru' },
      { day: 'Salı' as const, subject: 'TYT Matematik', topic: 'Üslü ve Köklü İfadeler', plannedMinutes: 90, notes: 'ÖSYM tipi sorular' },
      { day: 'Salı' as const, subject: 'TYT Fizik', topic: 'Kuvvet ve Hareket', plannedMinutes: 60, notes: 'Grafik okuma soruları' },
      { day: 'Çarşamba' as const, subject: 'TYT Kimya', topic: 'Mol Kavramı & Hesaplamalar', plannedMinutes: 75, notes: 'Formüllere dikkat' },
      { day: 'Çarşamba' as const, subject: 'TYT Türkçe', topic: 'Ses Bilgisi & Yazım Kuralları', plannedMinutes: 60, notes: 'TDK kılavuzundan istisnalar' },
      { day: 'Perşembe' as const, subject: 'TYT Biyoloji', topic: 'Hücre Organelleri ve Bölünmeler', plannedMinutes: 60, notes: 'Şemaları çizerek çalış' },
      { day: 'Perşembe' as const, subject: 'TYT Geometri', topic: 'Üçgende Açılar & Özel Üçgenler', plannedMinutes: 75, notes: 'Çizim sorularına odaklan' },
      { day: 'Cuma' as const, subject: 'TYT Matematik', topic: 'Yaş ve Hız Problemleri Karma', plannedMinutes: 90, notes: 'ÖSYM çıkmış benzerleri' },
      { day: 'Cumartesi' as const, subject: 'TYT Türkçe', topic: 'Tam TYT Türkçe Branş Denemesi', plannedMinutes: 60, notes: '40 soru 45 dakika hedefi' },
      { day: 'Pazar' as const, subject: 'Paragraf', topic: 'Haftalık Hatalı Soru Tekrar Defteri', plannedMinutes: 90, notes: 'Tüm branşların hatalarını incele' }
    ]
  },
  {
    id: 'template-2',
    title: '🚀 AYT Sayısal Derece Şablonı (Mat & Fen Yoğun)',
    description: '12. Sınıf ve Mezun Sayısal öğrencileri için Türev, İntegral, Elektrik ve Organik Kimya ağırlıklı haftalık program.',
    targetField: 'SAY' as const,
    createdByName: 'Elif Çelik (Matematik Zümre Bşk.)',
    createdAt: '2026-07-05',
    items: [
      { day: 'Pazartesi' as const, subject: 'AYT Matematik', topic: 'Türev Alma Kuralları ve Teğet Denklemi', plannedMinutes: 120, notes: 'İleri düzey 50 soru' },
      { day: 'Pazartesi' as const, subject: 'AYT Fizik', topic: 'Elektriksel Potansiyel ve İndüksiyon', plannedMinutes: 90, notes: 'Sağ el kuralı şemaları' },
      { day: 'Salı' as const, subject: 'AYT Matematik', topic: 'Belirsiz & Belirli İntegral Hesabı', plannedMinutes: 120, notes: 'Değişken değiştirme yöntemi' },
      { day: 'Salı' as const, subject: 'AYT Kimya', topic: 'Kimyasal Denge ve Denge Sabiti (Kc)', plannedMinutes: 90, notes: 'Le Chatelier ilkesi' },
      { day: 'Çarşamba' as const, subject: 'AYT Biyoloji', topic: 'Fotosentez ve Kemosentez Evreleri', plannedMinutes: 90, notes: 'Işığa bağımlı reaksiyonlar' },
      { day: 'Çarşamba' as const, subject: 'AYT Geometri', topic: 'Doğrunun ve Çemberin Analitiği', plannedMinutes: 90, notes: 'Denklem kurma alıştırmaları' },
      { day: 'Perşembe' as const, subject: 'AYT Matematik', topic: 'Trigonometrik Denklemler & Toplam-Fark', plannedMinutes: 120, notes: 'ÖSYM çıkmış sorular' },
      { day: 'Perşembe' as const, subject: 'AYT Fizik', topic: 'Düzgün Çembersel Hareket ve Açısal Momentum', plannedMinutes: 90, notes: 'Merkezcil kuvvet vektörleri' },
      { day: 'Cuma' as const, subject: 'AYT Kimya', topic: 'Organik Kimya - Alkanlar & Alkenler', plannedMinutes: 105, notes: 'IUPAC adlandırma kuralları' },
      { day: 'Cumartesi' as const, subject: 'AYT Matematik', topic: '40 Soruluk AYT Matematik Branş Denemesi', plannedMinutes: 135, notes: 'Sınav provası' },
      { day: 'Pazar' as const, subject: 'AYT Biyoloji', topic: 'İnsan Fizyolojisi & Sinir Sistemi Tekrarı', plannedMinutes: 90, notes: 'Önemli kavram özeti' }
    ]
  },
  {
    id: 'template-3',
    title: '🏆 Eşit Ağırlık İlk 10.000 Hedef Programı',
    description: 'Matematik netlerini yukarılara taşırken Divan ve Tanzimat edebiyatı ezberlerini güçlendiren dengeli program.',
    targetField: 'EA' as const,
    createdByName: 'Mustafa Yılmaz (Rehber Koç)',
    createdAt: '2026-07-10',
    items: [
      { day: 'Pazartesi' as const, subject: 'AYT Edebiyat', topic: 'Divan Edebiyatı Nazım Şekilleri ve Şairler', plannedMinutes: 90, notes: 'Fuzuli, Baki, Nedim eser kartları' },
      { day: 'Pazartesi' as const, subject: 'TYT Matematik', topic: 'Sayı, İşçi ve Hareket Problemleri Karma', plannedMinutes: 90, notes: 'Yeni nesil uzun kurgulu sorular' },
      { day: 'Salı' as const, subject: 'AYT Matematik', topic: 'İkinci Dereceden Denklemler ve Parabol', plannedMinutes: 105, notes: 'Tepe noktası ve simetri ekseni' },
      { day: 'Salı' as const, subject: 'AYT Tarih-1', topic: 'Osmanlı Devleti Kuruluş ve Yükselme Dönemi', plannedMinutes: 75, notes: 'Padişahlar ve ıslahatlar' },
      { day: 'Çarşamba' as const, subject: 'Paragraf', topic: '40 Paragraf Odak Sorusu', plannedMinutes: 50, notes: 'Hız ve odak kontrolü' },
      { day: 'Çarşamba' as const, subject: 'AYT Coğrafya-1', topic: 'Biyoçeşitlilik ve Ekosistem Hizmetleri', plannedMinutes: 60, notes: 'Harita üzerinde biyomlar' },
      { day: 'Perşembe' as const, subject: 'AYT Matematik', topic: 'Logaritma Kuralları ve Grafik Analizi', plannedMinutes: 105, notes: 'Taban değiştirme soruları' },
      { day: 'Perşembe' as const, subject: 'AYT Edebiyat', topic: 'Tanzimat I. ve II. Dönem Romancıları', plannedMinutes: 90, notes: 'Namık Kemal, Recaizade Mahmut Esat' },
      { day: 'Cuma' as const, subject: 'AYT Tarih-1', topic: 'Milli Mücadele Dönemi ve Kongreler', plannedMinutes: 90, notes: 'Amasya, Erzurum, Sivas kronolojisi' },
      { day: 'Cumartesi' as const, subject: 'AYT Edebiyat', topic: 'AYT Edebiyat-Sosyal-1 Branş Denemesi', plannedMinutes: 120, notes: 'Net analizi yap' },
      { day: 'Pazar' as const, subject: 'TYT Matematik', topic: 'Haftalık Yanlış Soru Tekrar Defteri', plannedMinutes: 90, notes: 'Tüm branşların yanlışlarını çöz' }
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

export const INITIAL_MESSAGES: DirectMessage[] = [
  {
    id: 'msg-1',
    senderId: 'teacher-2', // Elif Çelik (Sınıf Rehber Öğretmeni)
    senderName: 'Elif Çelik',
    senderRole: 'class_teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    receiverId: 'student-1', // Ahmet Yılmaz
    receiverName: 'Ahmet Yılmaz',
    receiverRole: 'student',
    receiverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'Merhaba Ahmet, bu haftaki AYT Matematik ve Fizik çalışma saatlerini kontrol ettim. Gayet sistemli ilerliyorsun, tebrik ederim!',
    timestamp: '2026-07-29 16:30',
    isRead: true,
    isDelivered: true,
    readAt: '2026-07-29 16:35'
  },
  {
    id: 'msg-2',
    senderId: 'student-1',
    senderName: 'Ahmet Yılmaz',
    senderRole: 'student',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    receiverId: 'teacher-2',
    receiverName: 'Elif Çelik',
    receiverRole: 'class_teacher',
    receiverAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    content: 'Teşekkür ederim Elif hocam! Organik Kimya konularında biraz süre sıkıntısı yaşıyorum, bu konuda bir tavsiyeniz olur mu?',
    timestamp: '2026-07-29 17:05',
    isRead: true,
    isDelivered: true,
    readAt: '2026-07-29 17:12'
  },
  {
    id: 'msg-3',
    senderId: 'teacher-2',
    senderName: 'Elif Çelik',
    senderRole: 'class_teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    receiverId: 'student-1',
    receiverName: 'Ahmet Yılmaz',
    receiverRole: 'student',
    receiverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'Organik Kimya için her gün 25 dakikalık kısa reaksiyon haritası tekrarları ekleyebiliriz. Yarın rehberlik saatinde detaylandıralım.',
    timestamp: '2026-07-29 17:20',
    isRead: true,
    isDelivered: true,
    readAt: '2026-07-29 17:28'
  },
  {
    id: 'msg-4',
    senderId: 'teacher-1', // Mustafa Yılmaz (Okul Rehber Öğretmeni)
    senderName: 'Mustafa Yılmaz',
    senderRole: 'school_counselor',
    senderAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    receiverId: 'student-1',
    receiverName: 'Ahmet Yılmaz',
    receiverRole: 'student',
    receiverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'Ahmet selam, genel deneme sınavı net analizlerini inceledim. İTÜ hedefin doğrultusunda TYT Türkçe netlerini 32 üzerine sabitlemek harika bir ivme kazandıracaktır.',
    timestamp: '2026-07-30 09:15',
    isRead: false,
    isDelivered: false
  }
];

