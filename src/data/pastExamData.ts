export interface TopicQuestionCount {
  topicName: string;
  counts: Record<number, number>; // e.g. { 2018: 3, 2019: 3, 2020: 1, 2021: 2, 2022: 4, 2023: 4, 2024: 3, 2025: 3 }
  importance: 'high' | 'medium' | 'normal'; // 'high' = 3+ questions per year on average
  notes?: string;
}

export interface SubjectQuestionDistribution {
  subject: string;
  examType: 'TYT' | 'AYT';
  topics: TopicQuestionCount[];
}

export const PAST_EXAM_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export const PAST_EXAM_DISTRIBUTIONS: Record<string, SubjectQuestionDistribution> = {
  'TYT Türkçe': {
    subject: 'TYT Türkçe',
    examType: 'TYT',
    topics: [
      {
        topicName: 'Sözcükte Anlam & Söz Öbeklerinde Anlam',
        counts: { 2018: 3, 2019: 3, 2020: 1, 2021: 2, 2022: 4, 2023: 4, 2024: 3, 2025: 3 },
        importance: 'high',
        notes: 'Deyimler, mecaz anlam ve ikilemeler sorulur.'
      },
      {
        topicName: 'Cümlede Anlam & Kavramlar',
        counts: { 2018: 7, 2019: 3, 2020: 6, 2021: 3, 2022: 3, 2023: 3, 2024: 4, 2025: 4 },
        importance: 'high',
        notes: 'Öznel-nesnel, neden-sonuç ve amaç-sonuç cümleleri.'
      },
      {
        topicName: 'Paragrafta Ana Fikir & Konu',
        counts: { 2018: 12, 2019: 13, 2020: 14, 2021: 15, 2022: 15, 2023: 14, 2024: 15, 2025: 15 },
        importance: 'high',
        notes: 'En yüksek soru sayısına sahip kısımdır.'
      },
      {
        topicName: 'Paragrafta Yapı & Akışı Bozan Cümle',
        counts: { 2018: 6, 2019: 6, 2020: 5, 2021: 6, 2022: 6, 2023: 6, 2024: 5, 2025: 6 },
        importance: 'high',
        notes: 'Cümle yer değiştirme ve akışı bozma.'
      },
      {
        topicName: 'Paragrafta Yardımcı Düşünceler',
        counts: { 2018: 4, 2019: 3, 2020: 4, 2021: 4, 2022: 5, 2023: 5, 2024: 5, 2025: 4 },
        importance: 'high'
      },
      {
        topicName: 'Ses Bilgisi',
        counts: { 2018: 3, 2019: 1, 2020: 0, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium',
        notes: 'Ünlü düşmesi, ünsüz yumuşaması ve benzeşmesi.'
      },
      {
        topicName: 'Yazım Kuralları',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high',
        notes: 'Büyük harf ve bitişik/ayrı yazılan kelimeler.'
      },
      {
        topicName: 'Noktalama İşaretleri',
        counts: { 2018: 1, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high',
        notes: 'Virgül, noktalı virgül ve kesme işareti.'
      },
      {
        topicName: 'Sözcükte Yapı & Ekler',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 0, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Sözcük Türleri (İsim, Sıfat, Zamir, Zarf, Edat, Bağlaç)',
        counts: { 2018: 1, 2019: 2, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Fiiller, Ek Fiil & Fiilimsiler',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 0, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Cümlenin Ögeleri',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 0, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Cümle Türleri & Anlatım Bozuklukları',
        counts: { 2018: 1, 2019: 0, 2020: 0, 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0 },
        importance: 'normal'
      }
    ]
  },

  'TYT Matematik': {
    subject: 'TYT Matematik',
    examType: 'TYT',
    topics: [
      {
        topicName: 'Temel Kavramlar & Sayı Kümeleri',
        counts: { 2018: 4, 2019: 4, 2020: 1, 2021: 3, 2022: 3, 2023: 2, 2024: 3, 2025: 3 },
        importance: 'high',
        notes: 'Tek-çift sayılar, pozitif-negatif sayılar.'
      },
      {
        topicName: 'Basamak Kavramı & Sayı Sistemleri',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 2, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Bölme & Bölünebilme Kuralları',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'EBOB - EKOK',
        counts: { 2018: 0, 2019: 0, 2020: 1, 2021: 0, 2022: 1, 2023: 0, 2024: 1, 2025: 1 },
        importance: 'normal'
      },
      {
        topicName: 'Rasyonel & Ondalık Sayılar',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Birinci Dereceden Denklem ve Eşitsizlikler',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Mutlak Değer',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Üslü & Köklü İfadeler',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'medium'
      },
      {
        topicName: 'Çarpanlara Ayırma & Oran-Orantı',
        counts: { 2018: 1, 2019: 1, 2020: 2, 2021: 2, 2022: 1, 2023: 2, 2024: 1, 2025: 2 },
        importance: 'medium'
      },
      {
        topicName: 'Sayı & Kesir Problemleri',
        counts: { 2018: 4, 2019: 4, 2020: 5, 2021: 4, 2022: 5, 2023: 4, 2024: 4, 2025: 4 },
        importance: 'high',
        notes: 'Yeni nesil hikayeli matematik soruları.'
      },
      {
        topicName: 'Yaş Problemleri',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Hız (Hareket) & İşçi Problemleri',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Yüzde, Kar-Zarar & Karışım Problemleri',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Grafik & Rutin Olmayan Mantık Problemleri',
        counts: { 2018: 3, 2019: 4, 2020: 4, 2021: 3, 2022: 4, 2023: 3, 2024: 4, 2025: 4 },
        importance: 'high'
      },
      {
        topicName: 'Kümeler & Mantık',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Fonksiyonlar',
        counts: { 2018: 1, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Permütasyon, Kombinasyon, Binom & Olasılık',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'İstatistik & Veri Analizi',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      }
    ]
  },

  'TYT Geometri': {
    subject: 'TYT Geometri',
    examType: 'TYT',
    topics: [
      {
        topicName: 'Doğruda ve Üçgende Açılar',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Dik & Özel Üçgenler (Pisagor, Öklid)',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Üçgende Alan, Benzerlik & İkizkenar',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Çokgenler & Dörtgenler',
        counts: { 2018: 1, 2019: 2, 2020: 1, 2021: 1, 2022: 2, 2023: 1, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Paralelkenar, Dikdörtgen & Kare',
        counts: { 2018: 2, 2019: 1, 2020: 2, 2021: 2, 2022: 1, 2023: 2, 2024: 1, 2025: 1 },
        importance: 'high'
      },
      {
        topicName: 'Çemberde Açı & Dairede Alan',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Analitik Geometri (Nokta & Doğru)',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Katı Cisimler (Prizma, Piramit, Silindir)',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high',
        notes: 'Hacim ve yüzey alanı katlama soruları.'
      }
    ]
  },

  'TYT Fizik': {
    subject: 'TYT Fizik',
    examType: 'TYT',
    topics: [
      {
        topicName: 'Fizik Bilimine Giriş',
        counts: { 2018: 1, 2019: 0, 2020: 1, 2021: 0, 2022: 0, 2023: 1, 2024: 0, 2025: 0 },
        importance: 'normal'
      },
      {
        topicName: 'Madde ve Özellikleri (Özkütle, Dayanıklılık)',
        counts: { 2018: 0, 2019: 1, 2020: 0, 2021: 1, 2022: 1, 2023: 0, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Sıvıların Kaldırma Kuvveti & Basınç',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Isı, Sıcaklık ve Genleşme',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Hareket ve Kuvvet (Newton Yasaları)',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'İş, Güç ve Enerji',
        counts: { 2018: 0, 2019: 1, 2020: 0, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Elektrostatik & Elektrik Akımı',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Optik (Aynalar, Mercekler, Renk & Kırılma)',
        counts: { 2018: 2, 2019: 2, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'high'
      },
      {
        topicName: 'Dalgalar (Yay, Su, Ses, Deprem)',
        counts: { 2018: 0, 2019: 0, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      }
    ]
  },

  'TYT Kimya': {
    subject: 'TYT Kimya',
    examType: 'TYT',
    topics: [
      {
        topicName: 'Kimya Bilimi & Güvenlik Sembolleri',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Atomun Yapısı ve Periyodik Sistem',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Kimyasal Türler Arası Etkileşimler',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Maddenin Halleri (Gaz, Sıvı, Katı)',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Mol Kavramı & Kimyasal Hesaplamalar',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Karışımlar & Derişim Hesapları',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Asitler, Bazlar ve Tuzlar',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      }
    ]
  },

  'TYT Biyoloji': {
    subject: 'TYT Biyoloji',
    examType: 'TYT',
    topics: [
      {
        topicName: 'Canlıların Ortak Özellikleri & Bileşenler',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Hücre Yapısı, Organeller ve Zar Taşınması',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Canlıların Sınıflandırılması',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Hücre Bölünmeleri & Üreme',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Kalıtım (Mendel & Kan Grupları)',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Ekosistem Ekolojisi & Çevre',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      }
    ]
  },

  'TYT Tarih': {
    subject: 'TYT Tarih',
    examType: 'TYT',
    topics: [
      {
        topicName: 'Tarih Bilimine Giriş & İlk Çağ Uygarlıkları',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'İlk ve Orta Çağlarda Türk Dünyası',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'İslam Medeniyeti & Türk-İslam Devletleri',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Osmanlı Devleti Tarihi (Siyaset & Teşkilat)',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Milli Mücadele Dönemi & Atatürk İnkılapları',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      }
    ]
  },

  'TYT Coğrafya': {
    subject: 'TYT Coğrafya',
    examType: 'TYT',
    topics: [
      {
        topicName: 'Doğa ve İnsan & Harita Bilgisi (İzohips)',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'İklim Bilgisi & Dünya İklim Tipleri',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'İç ve Dış Kuvvetler (Deprem, Akarsu, Rüzgar)',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Nüfus, Yerleşme & Göç Hareketleri',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Bölge Kavramı & Doğal Afetler',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      }
    ]
  },

  'AYT Matematik': {
    subject: 'AYT Matematik',
    examType: 'AYT',
    topics: [
      {
        topicName: 'Polinomlar & Çarpanlara Ayırma',
        counts: { 2018: 2, 2019: 2, 2020: 3, 2021: 2, 2022: 2, 2023: 3, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: '2. Dereceden Denklemler & Karmaşık Sayılar',
        counts: { 2018: 1, 2019: 1, 2020: 2, 2021: 1, 2022: 1, 2023: 2, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Parabol & 2. Dereceden Eşitsizlikler',
        counts: { 2018: 1, 2019: 2, 2020: 2, 2021: 1, 2022: 2, 2023: 2, 2024: 1, 2025: 2 },
        importance: 'medium'
      },
      {
        topicName: 'Logaritma',
        counts: { 2018: 2, 2019: 3, 2020: 3, 2021: 1, 2022: 2, 2023: 3, 2024: 2, 2025: 2 },
        importance: 'high',
        notes: 'Taban değiştirme ve denklem çözümleri.'
      },
      {
        topicName: 'Diziler (Aritmetik & Geometrik)',
        counts: { 2018: 1, 2019: 1, 2020: 2, 2021: 1, 2022: 1, 2023: 2, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Trigonometri (Özdeşlikler, Toplam-Fark, Denklemler)',
        counts: { 2018: 3, 2019: 3, 2020: 4, 2021: 5, 2022: 4, 2023: 4, 2024: 4, 2025: 4 },
        importance: 'high',
        notes: 'AYT Mat\'ın temel direklerinden biridir.'
      },
      {
        topicName: 'Limit ve Süreklilik',
        counts: { 2018: 2, 2019: 2, 2020: 0, 2021: 2, 2022: 2, 2023: 0, 2024: 2, 2025: 2 },
        importance: 'high',
        notes: '2020 ve 2023 pandemide çıkarılmıştı.'
      },
      {
        topicName: 'Türev (Alma Kuralları, Teğet Eğimleri, Maks-Min)',
        counts: { 2018: 3, 2019: 3, 2020: 0, 2021: 3, 2022: 4, 2023: 0, 2024: 3, 2025: 3 },
        importance: 'high',
        notes: 'Her yıl 3-4 soru kesin gelir.'
      },
      {
        topicName: 'İntegral (Belirli/Belirsiz & Alan Hesabı)',
        counts: { 2018: 4, 2019: 4, 2020: 0, 2021: 4, 2022: 4, 2023: 0, 2024: 4, 2025: 4 },
        importance: 'high',
        notes: 'Reimann ve eğri altında kalan alan.'
      },
      {
        topicName: 'Permütasyon, Kombinasyon, Binom & Olasılık',
        counts: { 2018: 2, 2019: 2, 2020: 3, 2021: 2, 2022: 2, 2023: 3, 2024: 2, 2025: 2 },
        importance: 'high'
      }
    ]
  },

  'AYT Geometri': {
    subject: 'AYT Geometri',
    examType: 'AYT',
    topics: [
      {
        topicName: 'Doğruda & Üçgende Açılar, Özel Üçgenler',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Çokgenler & Özel Dörtgenler',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Çember & Daire (Uzunluk, Açı, Alan)',
        counts: { 2018: 1, 2019: 2, 2020: 3, 2021: 2, 2022: 1, 2023: 3, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Noktanın ve Doğrunun Analitiği',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Çemberin Analitik İncelenmesi',
        counts: { 2018: 1, 2019: 1, 2020: 0, 2021: 1, 2022: 1, 2023: 0, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Dönüşüm Geometrisi (Öteleme, Dönme, Simetri)',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Katı Cisimler (Prizma, Piramit, Koni, Küre)',
        counts: { 2018: 1, 2019: 1, 2020: 2, 2021: 1, 2022: 2, 2023: 2, 2024: 1, 2025: 1 },
        importance: 'medium'
      }
    ]
  },

  'AYT Fizik': {
    subject: 'AYT Fizik',
    examType: 'AYT',
    topics: [
      {
        topicName: 'Vektörler & Bağıl Hareket & Tork Denge',
        counts: { 2018: 1, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Newton Yasaları & Atışlar',
        counts: { 2018: 2, 2019: 1, 2020: 2, 2021: 1, 2022: 1, 2023: 2, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'İtme - Momentum & Enerji Korunumu',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Elektrik Alan, Potansiyel, Kondansatör',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Manyetizma, İndüksiyon & Alternatif Akım',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Çembersel Hareket & Açısal Momentum',
        counts: { 2018: 2, 2019: 2, 2020: 3, 2021: 2, 2022: 2, 2023: 3, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Basit Harmonik Hareket',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Dalga Mekaniği & Doppler Etkisi',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Modern Fizik & Fotoelektrik & Compton',
        counts: { 2018: 3, 2019: 3, 2020: 1, 2021: 3, 2022: 3, 2023: 1, 2024: 3, 2025: 3 },
        importance: 'high'
      }
    ]
  },

  'AYT Kimya': {
    subject: 'AYT Kimya',
    examType: 'AYT',
    topics: [
      {
        topicName: 'Modern Atom Teorisi (Kuantum Sayıları)',
        counts: { 2018: 1, 2019: 1, 2020: 2, 2021: 1, 2022: 1, 2023: 2, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Gazlar & Gaz Yasaları',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Sıvı Çözeltiler ve Çözünürlük',
        counts: { 2018: 1, 2019: 1, 2020: 2, 2021: 1, 2022: 1, 2023: 2, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Kimyasal Tepkimelerde Enerji (Entalpi)',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Kimyasal Tepkimelerde Hız & Denge',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Sulu Çözelti Dengeleri (Asit-Baz, pH, Kçç)',
        counts: { 2018: 1, 2019: 1, 2020: 2, 2021: 1, 2022: 1, 2023: 2, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Kimya ve Elektrik (Redoks, Piller, Elektroliz)',
        counts: { 2018: 2, 2019: 2, 2020: 3, 2021: 2, 2022: 2, 2023: 3, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Organik Kimya & Fonksiyonel Gruplar',
        counts: { 2018: 4, 2019: 4, 2020: 0, 2021: 4, 2022: 4, 2023: 0, 2024: 4, 2025: 4 },
        importance: 'high',
        notes: 'En çok soru çıkan kimya konusudur.'
      }
    ]
  },

  'AYT Biyoloji': {
    subject: 'AYT Biyoloji',
    examType: 'AYT',
    topics: [
      {
        topicName: 'İnsan Fizyolojisi (Sinir, Sindirim, Dolaşım, Solunum, Boşaltım)',
        counts: { 2018: 7, 2019: 6, 2020: 7, 2021: 7, 2022: 6, 2023: 8, 2024: 7, 2025: 7 },
        importance: 'high',
        notes: 'Sistemler AYT Biyoloji\'nin yarısından fazlasıdır.'
      },
      {
        topicName: 'Komünite ve Popülasyon Ekolojisi',
        counts: { 2018: 1, 2019: 1, 2020: 2, 2021: 1, 2022: 1, 2023: 2, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Nükleik Asitler & Protein Sentezi',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Hücresel Solunum, Fotosentez ve Kemosentez',
        counts: { 2018: 1, 2019: 2, 2020: 2, 2021: 1, 2022: 2, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Bitki Biyolojisi (Dokular, Madde Taşınması, Üreme)',
        counts: { 2018: 2, 2019: 2, 2020: 0, 2021: 2, 2022: 2, 2023: 0, 2024: 2, 2025: 2 },
        importance: 'high'
      }
    ]
  },

  'AYT Edebiyat': {
    subject: 'AYT Edebiyat',
    examType: 'AYT',
    topics: [
      {
        topicName: 'Güzel Sanatlar & Metin Türleri',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Şiir Bilgisi & Edebi Sanatlar',
        counts: { 2018: 3, 2019: 3, 2020: 3, 2021: 3, 2022: 3, 2023: 3, 2024: 3, 2025: 3 },
        importance: 'high'
      },
      {
        topicName: 'İslamiyet Öncesi & Halk Edebiyatı',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Divan Edebiyatı (Şairler & Nazım Biçimleri)',
        counts: { 2018: 5, 2019: 4, 2020: 5, 2021: 6, 2022: 4, 2023: 5, 2024: 5, 2025: 5 },
        importance: 'high'
      },
      {
        topicName: 'Tanzimat Edebiyatı',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Servet-i Fünun & Fecr-i Âti Edebiyatı',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Milli Edebiyat Dönemi & Beş Hececiler',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Cumhuriyet Dönemi Şiir, Roman & Hikâye',
        counts: { 2018: 7, 2019: 8, 2020: 7, 2021: 6, 2022: 8, 2023: 7, 2024: 7, 2025: 7 },
        importance: 'high',
        notes: 'Ayt Edebiyat soru sayısının yaklaşık %30-35\'idir.'
      },
      {
        topicName: 'Edebiyat Akımları',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      }
    ]
  },

  'AYT Tarih-1': {
    subject: 'AYT Tarih-1',
    examType: 'AYT',
    topics: [
      {
        topicName: 'Tarih Bilimi & İlk Çağ Uygarlıkları',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'İlk ve Orta Çağlarda Türk Dünyası',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'İslam Medeniyeti & Türk-İslam Devletleri',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Osmanlı Devleti Kuruluş, Yükselme & Kültür',
        counts: { 2018: 3, 2019: 3, 2020: 3, 2021: 3, 2022: 3, 2023: 3, 2024: 3, 2025: 3 },
        importance: 'high'
      },
      {
        topicName: '20. Yüzyıl Başlarında Osmanlı & I. Dünya Savaşı',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Milli Mücadele Dönemi & Atatürk İnkılapları',
        counts: { 2018: 3, 2019: 3, 2020: 3, 2021: 3, 2022: 3, 2023: 3, 2024: 3, 2025: 3 },
        importance: 'high'
      }
    ]
  },

  'AYT Coğrafya-1': {
    subject: 'AYT Coğrafya-1',
    examType: 'AYT',
    topics: [
      {
        topicName: 'Ekosistem, Biyoçeşitlilik & Madde Döngüleri',
        counts: { 2018: 2, 2019: 2, 2020: 2, 2021: 2, 2022: 2, 2023: 2, 2024: 2, 2025: 2 },
        importance: 'high'
      },
      {
        topicName: 'Şehirlerin Fonksiyonları & Yerleşme',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Türkiye\'nin Madenleri & Enerji Kaynakları',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Türkiye\'de Sanayi, Ticaret & Turizm',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      },
      {
        topicName: 'Küresel ve Bölgesel Örgütler & Çevre',
        counts: { 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 },
        importance: 'medium'
      }
    ]
  },

  'Paragraf': {
    subject: 'Paragraf',
    examType: 'TYT',
    topics: [
      {
        topicName: 'Paragrafta Ana Fikir & Konu',
        counts: { 2018: 8, 2019: 8, 2020: 9, 2021: 10, 2022: 10, 2023: 9, 2024: 10, 2025: 10 },
        importance: 'high'
      },
      {
        topicName: 'Paragrafta Yapı & Akışı Bozan Cümle',
        counts: { 2018: 4, 2019: 5, 2020: 5, 2021: 5, 2022: 5, 2023: 5, 2024: 5, 2025: 5 },
        importance: 'high'
      },
      {
        topicName: 'Paragrafta Yardımcı Düşünceler',
        counts: { 2018: 6, 2019: 6, 2020: 6, 2021: 7, 2022: 7, 2023: 7, 2024: 7, 2025: 7 },
        importance: 'high'
      },
      {
        topicName: 'Çoklu (İkili & Üçlü) Paragraf Soruları',
        counts: { 2018: 4, 2019: 3, 2020: 3, 2021: 3, 2022: 4, 2023: 4, 2024: 3, 2025: 3 },
        importance: 'high'
      }
    ]
  }
};
