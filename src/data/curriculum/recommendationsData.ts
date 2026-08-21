// 9 ve 10. Sınıf MEB Maarif Modeli Seviye Bazlı Kaynak Kitap Tavsiyeleri
export interface GradeBookRecommendation {
  id: string;
  subject: string;
  publisher: string;
  name: string;
  difficulty: string;
  difficultyValue: number;
  reason: string;
  grade: 9 | 10 | 11;
}

export const GRADE_RECOMMENDED_BOOKS: GradeBookRecommendation[] = [
  {
    "id": "book-9-1",
    "subject": "Matematik",
    "publisher": "Mikro Orijinal",
    "name": "MÖF (Mikro Fasikül)",
    "difficulty": "1/5 Başlangıç",
    "difficultyValue": 1,
    "reason": "Temel Atma: Konuyu en küçük yapı taşlarına ayırarak anlatır. Lise matematiğine girişte zorlanan ve temeli zayıf öğrenciler için en güvenli başlangıçtır.",
    "grade": 9
  },
  {
    "id": "book-9-2",
    "subject": "Matematik",
    "publisher": "Acil Yayınları",
    "name": "Matematiğin İlacı",
    "difficulty": "1.5/5 Başlangıç",
    "difficultyValue": 1.5,
    "reason": "Önyargı Kıran: İşlem yeteneğini geliştiren, temel düzeyde sorular içerir. Öğrencinin \"\"yapabiliyorum\"\" hissini kazanmasını sağlar.",
    "grade": 9
  },
  {
    "id": "book-9-3",
    "subject": "Matematik",
    "publisher": "YarıÇap Yayınları",
    "name": "Soru Bankası",
    "difficulty": "1.5/5 Başlangıç",
    "difficultyValue": 1.5,
    "reason": "Pratik Başlangıç: Konuyu yeni öğrenenler için yorucu olmayan, temel kavramları oturtan bir kitaptır. Çap serisinin giriş basamağıdır.",
    "grade": 9
  },
  {
    "id": "book-9-4",
    "subject": "Matematik",
    "publisher": "Metin Yayınları",
    "name": "Parkur (Konu Anlatımlı SB)",
    "difficulty": "2/5 Kolay - Orta",
    "difficultyValue": 2,
    "reason": "Kur Sistemi: \"\"Öğren-Pekiştir\"\" mantığıyla ilerler. Klasik test kitabından ziyade bir çalışma defteri havasındadır, konuyu adım adım öğretir.",
    "grade": 9
  },
  {
    "id": "book-9-5",
    "subject": "Matematik",
    "publisher": "Sonuç Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "2/5 Kolay - Orta",
    "difficultyValue": 2,
    "reason": "Kazanım Odaklı: Konu anlatımı ve çözümlü örnekleri boldur. Yazılı sınavlara hazırlıkta ve konuyu bireysel çalışmada en çok tercih edilen settir.",
    "grade": 9
  },
  {
    "id": "book-9-6",
    "subject": "Matematik",
    "publisher": "Kafa Dengi",
    "name": "Süper Öğreten (Turuncu)",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Adım Adım: Video destekli ilerler ve konuyu öğretmeye odaklanır. Konu eksiği olan öğrenciler için tamamlayıcıdır.",
    "grade": 9
  },
  {
    "id": "book-9-7",
    "subject": "Matematik",
    "publisher": "Karekök Yayınları",
    "name": "MPS (Modüler Piramit Sistemi)",
    "difficulty": "2.5/5 Öğretici / Drill",
    "difficultyValue": 2.5,
    "reason": "Köşe Taşı Yöntemi: Her soru tipini önce çözer, sonra benzerlerini sorar. İşlem yeteneğini ve soru kalıplarını ezberletmek için etkilidir.",
    "grade": 9
  },
  {
    "id": "book-9-8",
    "subject": "Matematik",
    "publisher": "Zafer Yayınları",
    "name": "Soru Bankası Fasikül Seti",
    "difficulty": "2.5/5 Orta",
    "difficultyValue": 2.5,
    "reason": "Okul Uyumlu: Konu özetli ve bol alıştırmalıdır. Set halinde olması taşıma kolaylığı sağlar, okul derslerine paralel gitmek için uygundur.",
    "grade": 9
  },
  {
    "id": "book-9-9",
    "subject": "Matematik",
    "publisher": "Acil Yayınları",
    "name": "Tema Seti (Fasikül)",
    "difficulty": "2.5/5 Öğretici",
    "difficultyValue": 2.5,
    "reason": "Müfredat Odaklı: Yeni müfredatın mantık, kümeler ve denklem yapılarına birebir uygun, bol örnekli bir ders materyalidir.",
    "grade": 9
  },
  {
    "id": "book-9-10",
    "subject": "Matematik",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Basamaklı Sistem: Mavi (Kolay), Kırmızı (Orta), Turuncu (Zor) testleri ile seviyeyi kademeli artırır. Öğrencinin gelişimini izlemesi için idealdir.",
    "grade": 9
  },
  {
    "id": "book-9-11",
    "subject": "Matematik",
    "publisher": "Eis Yayınları",
    "name": "DAF (Ders Föyleri)",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Sınıf İçi: Düzenli not tutmak ve müfredatı adım adım takip etmek için kurumsal yapıda sıkça kullanılır.",
    "grade": 9
  },
  {
    "id": "book-9-12",
    "subject": "Matematik",
    "publisher": "Miray Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Güncel İçerik: Sayfa kenarı notları ve yeni nesil soru geçişleri dengelidir. Müfredatın ince detaylarını yakalayan dinamik bir kaynaktır.",
    "grade": 9
  },
  {
    "id": "book-9-13",
    "subject": "Matematik",
    "publisher": "Nitelik Yayınları",
    "name": "Beceri Temelli Soru Kitabı",
    "difficulty": "3.5/5 Orta",
    "difficultyValue": 3.5,
    "reason": "Yeni Nesil Odaklı: Klasik sorudan ziyade, beceri temelli ve hikayeli sorulara ağırlık verir. Okuduğunu anlama becerisini ölçer.",
    "grade": 9
  },
  {
    "id": "book-9-14",
    "subject": "Matematik",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Standart Belirleyici: 9. sınıf öğrencisini üniversite sınavı mantığına hazırlar. Yazılı ve deneme sınavlarında başarı için temel referans kaynağıdır.",
    "grade": 9
  },
  {
    "id": "book-9-15",
    "subject": "Matematik",
    "publisher": "Toprak Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Orta - Zor",
    "difficultyValue": 3.5,
    "reason": "Problem Yeteneği: Soruları kalitelidir. Özellikle denklem kurma ve problem tarzı sorularda öğrencinin analiz yeteneğini geliştirir.",
    "grade": 9
  },
  {
    "id": "book-9-16",
    "subject": "Matematik",
    "publisher": "Kafa Dengi",
    "name": "\"\"Ekstra\"\" Soru Bankası (Siyah)",
    "difficulty": "4/5 Orta - Zor",
    "difficultyValue": 4,
    "reason": "Sınav Hazırlık: Turuncu serinin bir üstüdür. Daha seçici ve zorlayıcı sorular barındırır, iyi seviye öğrencilere hitap eder.",
    "grade": 9
  },
  {
    "id": "book-9-17",
    "subject": "Matematik",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Teknik ve Sert: İşlem gücünü zorlar. Konuyu bildiğini düşünen öğrenciye teknik detayları ve zorlu soru kalıplarını gösterir.",
    "grade": 9
  },
  {
    "id": "book-9-18",
    "subject": "Matematik",
    "publisher": "Aydın Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Klasik Zor: Sağlam cebirsel işlem gerektiren, teknik soruları ile bilinir. Fen lisesi seviyesindeki öğrencilerin işlem pratiğini artırır.",
    "grade": 9
  },
  {
    "id": "book-9-19",
    "subject": "Matematik",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Muhakeme: Mantık ve kümeler gibi soyut konularda ezber bozan, düşündürücü sorular içerir.",
    "grade": 9
  },
  {
    "id": "book-9-20",
    "subject": "Matematik",
    "publisher": "Orijinal Yayınları",
    "name": "ODAF (Ders Föyleri)",
    "difficulty": "4/5 Orta - Zor",
    "difficultyValue": 4,
    "reason": "Detaylı Anlatım: Konu anlatımı detaylıdır. 9. sınıftan itibaren işi sıkı tutmak isteyen proje okulu öğrencileri için ideal ders materyalidir.",
    "grade": 9
  },
  {
    "id": "book-9-21",
    "subject": "Matematik",
    "publisher": "Endemik Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4.5/5 Zor",
    "difficultyValue": 4.5,
    "reason": "Seçici Sorular: Özellikle zor soru görmek isteyen öğrencilerin tercihidir. Üniversite sınavı zorluk derecesinin üzerini hedefler.",
    "grade": 9
  },
  {
    "id": "book-9-22",
    "subject": "Matematik",
    "publisher": "Acil Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4.5/5 Zor",
    "difficultyValue": 4.5,
    "reason": "Ufuk Açıcı: \"\"İlacı\"\" serisinden farklı olarak ana soru bankasıdır. Sağlam geometri ve problem soruları ile öğrenciyi zorlar.",
    "grade": 9
  },
  {
    "id": "book-9-23",
    "subject": "Matematik",
    "publisher": "Orijinal Yayınları",
    "name": "Soru Bankası",
    "difficulty": "5/5 Zor - İleri",
    "difficultyValue": 5,
    "reason": "Zirve: Sarı testler konu kavratır, Mavi testler sınav tarzıdır, Pembe testler ise çok üst düzeydir. Derece hedefleyen öğrencilerin çözmesi gereken kaynaktır.",
    "grade": 9
  },
  {
    "id": "book-9-24",
    "subject": "Edebiyat",
    "publisher": "Okyanus Yayınları",
    "name": "Iceberg Soru Bankası",
    "difficulty": "1/5 Başlangıç",
    "difficultyValue": 1,
    "reason": "Özet Konu Anlatımlı: Her testin başında o konuyla ilgili \"\"hap bilgiler\"\" verir. Edebiyat terimlerine yabancı olan ve terimleri karıştıran öğrenciler için kurtarıcıdır.",
    "grade": 9
  },
  {
    "id": "book-9-25",
    "subject": "Edebiyat",
    "publisher": "Sonuç Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Parça Parça: Kitap bütünlüğü yerine fasikül halindedir. Özellikle \"\"Dil Bilgisi\"\" (Sıfat, Zamir vb.) kısmında zorlananlar için bol alıştırma sunar.",
    "grade": 9
  },
  {
    "id": "book-9-26",
    "subject": "Edebiyat",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "2/5 Kolay - Orta",
    "difficultyValue": 2,
    "reason": "Ritim Yakalama: Mavi testleri konuyu öğretir, Kırmızı testleri pekiştirir. Sıkıcı değildir, öğrenciyi edebiyattan soğutmaz. Okuma parçaları yeni müfredata uygundur.",
    "grade": 9
  },
  {
    "id": "book-9-27",
    "subject": "Edebiyat",
    "publisher": "Kafa Dengi",
    "name": "Süper Öğreten (Turuncu)",
    "difficulty": "2.5/5 Öğretici",
    "difficultyValue": 2.5,
    "reason": "Video Destekli: YouTube ders anlatımlarıyla uyumludur. Edebiyatı ezberden ziyade mantığıyla (dönem özellikleri vb.) öğretmeye çalışır.",
    "grade": 9
  },
  {
    "id": "book-9-28",
    "subject": "Edebiyat",
    "publisher": "Yayın Denizi",
    "name": "Pro Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Sözelin Uzmanı: Yayın Denizi, sözel derslerde matematikten daha güçlüdür. Soruları tam \"\"öğrenci dostu\"\"dur. Şiir inceleme soruları çok kalitelidir.",
    "grade": 9
  },
  {
    "id": "book-9-29",
    "subject": "Edebiyat",
    "publisher": "Eis Yayınları",
    "name": "DAF (Ders Föyleri)",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Ders Notu: Edebiyat çok fazla ezber içerdiği için derste not tutmak zordur. Eis föyleri, öğrencinin sadece dinleyip boşluk doldurmasını sağlar.",
    "grade": 9
  },
  {
    "id": "book-9-30",
    "subject": "Edebiyat",
    "publisher": "Miray Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Pratik Bilgiler: Sayfa kenarlarında yazar-eser hatırlatmaları ve nokta atışı bilgiler vardır. Maarif Modeli'nin metin odaklı yapısını iyi yakalamıştır.",
    "grade": 9
  },
  {
    "id": "book-9-31",
    "subject": "Edebiyat",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Lider Kaynak: Edebiyatta tartışmasız en çok satandır. ÖSYM tarzı soruları, \"\"Sıcak Bölge\"\" testleri ile hem yazılıya hem de üniversite sınavına mükemmel hazırlar.",
    "grade": 9
  },
  {
    "id": "book-9-32",
    "subject": "Edebiyat",
    "publisher": "Çap Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "3.5/5 Orta - Zor",
    "difficultyValue": 3.5,
    "reason": "Ünite Bazlı: \"\"Şiir Ünitesi\"\", \"\"Roman Ünitesi\"\" gibi ayrı ayrı satılır. Sadece zayıf olduğunuz konuyu alıp çalışmak için idealdir.",
    "grade": 9
  },
  {
    "id": "book-9-33",
    "subject": "Edebiyat",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Yeni Nesil: Edebiyatta \"\"yeni nesil soru\"\" (uzun metinli, yorumlamaya dayalı) tarzını en iyi uygulayan yayınlardandır. Okuduğunu anlama becerisini ölçer.",
    "grade": 9
  },
  {
    "id": "book-9-34",
    "subject": "Edebiyat",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "5/5 Zor - İleri",
    "difficultyValue": 5,
    "reason": "Zirve: Edebiyatın \"\"Orijinal\"\"i budur. Çok detaylıdır, kıyıda köşede kalmış bilgileri bile sorar. \"\"Ben edebiyatta full yapmak istiyorum\"\" diyen öğrencinin kitabıdır.",
    "grade": 9
  },
  {
    "id": "book-9-35",
    "subject": "Fizik",
    "publisher": "VIP Fizik",
    "name": "Video Ders Defteri (VDD)",
    "difficulty": "1/5 Başlangıç",
    "difficultyValue": 1,
    "reason": "YouTube Destekli: Türkiye'nin en popüler fizik kanalı ile birebir uyumludur. Fizikten korkan, \"\"yapamıyorum\"\" diyen öğrenci için en iyi başlangıç rehberidir.",
    "grade": 9
  },
  {
    "id": "book-9-36",
    "subject": "Fizik",
    "publisher": "Aktif Öğrenme",
    "name": "Aktif Fizik 0'dan Başlayanlara",
    "difficulty": "1/5 Sıfır Seviye",
    "difficultyValue": 1,
    "reason": "Önyargı Kıran: Formüllerden arındırılmış, mantığı kavratan basit sorularla başlar. Sayısalı zayıf öğrenciler için \"\"ilacı\"\"dır.",
    "grade": 9
  },
  {
    "id": "book-9-37",
    "subject": "Fizik",
    "publisher": "Sonuç Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Kazanım Odaklı: Konuyu parçalara böler. Bol çözümlü örnekleri sayesinde öğrenci takılmadan ilerler. Yazılılara çalışmak için idealdir.",
    "grade": 9
  },
  {
    "id": "book-9-38",
    "subject": "Fizik",
    "publisher": "Ertan Sinan Şahin",
    "name": "9. Sınıf Fizik Seti (2026)",
    "difficulty": "2.5/5 Konu Anlatım",
    "difficultyValue": 2.5,
    "reason": "Yeni Nesil Eğitim: Sadece bir kitap değil, bir \"\"video kurs\"\" sistemidir. Konuyu derinlemesine ve modern bir dille (simülasyonlarla) anlatır. Ezber bozar.",
    "grade": 9
  },
  {
    "id": "book-9-39",
    "subject": "Fizik",
    "publisher": "Miray Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Güncel: Maarif Modeli'nin getirdiği günlük hayat örneklerini en iyi yansıtan kitaplardandır. Sayfa kenarlarındaki hatırlatmalar çok faydalıdır.",
    "grade": 9
  },
  {
    "id": "book-9-40",
    "subject": "Fizik",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Basamaklı: Mavi testlerle konuyu öğretir, Kırmızı ile hızlandırır. Fizikte seviyesini görmek isteyenler için iyi bir \"\"check-up\"\" kitabıdır.",
    "grade": 9
  },
  {
    "id": "book-9-41",
    "subject": "Fizik",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Referans Kaynak: Fizikte de \"\"piyasa standardı\"\"dır. Ne çok zor ne çok kolaydır. TYT Fiziğin temellerini en sağlam attıran kitaptır.",
    "grade": 9
  },
  {
    "id": "book-9-42",
    "subject": "Fizik",
    "publisher": "Çap Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "4/5 Orta - Zor",
    "difficultyValue": 4,
    "reason": "Anadolu Lisesi: Özellikle \"\"Hareket\"\" ve \"\"Kuvvet\"\" fasikülleri çok kalitelidir. Konuyu tüm detaylarıyla öğrenmek isteyenlerin tercihidir.",
    "grade": 9
  },
  {
    "id": "book-9-43",
    "subject": "Fizik",
    "publisher": "Nihat Bilgin",
    "name": "Soru Bankası",
    "difficulty": "4/5 Teknik/Zor",
    "difficultyValue": 4,
    "reason": "Efsane: Fizik camiasının duayenidir. Soruları \"\"süslemeden\"\" uzak, doğrudan fiziğin mantığını ve matematiğini sorgular.",
    "grade": 9
  },
  {
    "id": "book-9-44",
    "subject": "Fizik",
    "publisher": "Aydın Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4.5/5 Zor",
    "difficultyValue": 4.5,
    "reason": "Fen Lisesi: İşlem yoğunluğu fazladır. \"\"Ben sayısalcıyım, zor soru istiyorum\"\" diyen öğrenciyi tatmin eder.",
    "grade": 9
  },
  {
    "id": "book-9-45",
    "subject": "Fizik",
    "publisher": "Karaağaç",
    "name": "Fasikül Seti",
    "difficulty": "5/5 İleri",
    "difficultyValue": 5,
    "reason": "Mekanik Ustası: Fizikte \"\"Karaağaç çözdüysen bitmiştir\"\" denir. Çok teknik ve zorlayıcı soruları vardır. Proje okulu öğrencileri için zirve noktasıdır.",
    "grade": 9
  },
  {
    "id": "book-9-46",
    "subject": "Kimya",
    "publisher": "Okyanus Yayınları",
    "name": "Iceberg Soru Bankası",
    "difficulty": "1.5/5 Başlangıç",
    "difficultyValue": 1.5,
    "reason": "Konu Özetli: Her testin başında verdiği kısa \"\"hap bilgiler\"\" ile kimyayı sıfırdan alanlar için harikadır. Yeni müfredatın sözel kısımlarını (Simya, Güvenlik vb.) yormadan öğretir.",
    "grade": 9
  },
  {
    "id": "book-9-47",
    "subject": "Kimya",
    "publisher": "ENS Yayınları",
    "name": "Destek Defterim",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Defter Kitap: Klasik bir soru bankası değildir. Öğrencinin üzerine not alabileceği, boşluk doldurabileceği bir çalışma defteridir. Kimyaya \"\"yabancı\"\" kalanlar için en iyi alıştırma kitabıdır.",
    "grade": 9
  },
  {
    "id": "book-9-48",
    "subject": "Kimya",
    "publisher": "Sonuç Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "2/5 Kolay - Orta",
    "difficultyValue": 2,
    "reason": "Kazanım Odaklı: Konuyu parçalayarak öğretir. Özellikle \"\"Atom Modelleri\"\" gibi ezber gerektiren konularda bol tekrar yaptırır.",
    "grade": 9
  },
  {
    "id": "book-9-49",
    "subject": "Kimya",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Basamaklı Sistem: Mavi testler konuyu öğretir, Kırmızı testler pekiştirir. Kimyada seviyesini görmek isteyen öğrenci için en dengeli \"\"geçiş\"\" kitabıdır.",
    "grade": 9
  },
  {
    "id": "book-9-50",
    "subject": "Kimya",
    "publisher": "Miray Yayınları",
    "name": "Tematik Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Tam Uyum: Maarif Modeli'nin \"\"Tema\"\" yapısına en hızlı uyum sağlayan kitaptır. Sayfa kenarlarındaki öğretmen notları, öğrenciyi \"\"Sürdürülebilirlik\"\" gibi yeni konularda bilgilendirir.",
    "grade": 9
  },
  {
    "id": "book-9-51",
    "subject": "Kimya",
    "publisher": "Orbital Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Kimyanın Kralı: Sadece kimya üzerine uzmanlaşmış bir yayınevidir. Soruları çok kalitelidir. TYT Kimya'nın temelini en sağlam attıran kitaptır. Video çözümleri çok detaylıdır.",
    "grade": 9
  },
  {
    "id": "book-9-52",
    "subject": "Kimya",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Piyasa Lideri: Okullarda en çok önerilen kitaptır. Ne çok zor ne çok kolaydır. \"\"Sıcak Bölge\"\" testleri ile öğrenciyi yazılılara ve denemelere hazırlar.",
    "grade": 9
  },
  {
    "id": "book-9-53",
    "subject": "Kimya",
    "publisher": "Aydın Yayınları",
    "name": "Ders İşleyiş Modülleri",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Fen Lisesi Ayarı: Konu anlatımı çok derindir. Kimyayı yüzeysel değil, tüm detaylarıyla (orbital şemaları vb.) öğrenmek isteyen, hedefi yüksek öğrenciler içindir.",
    "grade": 9
  },
  {
    "id": "book-9-54",
    "subject": "Kimya",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Yorum ve Analiz: Yeni müfredatın istediği \"\"deney yorumlama\"\" ve \"\"grafik okuma\"\" sorularını en iyi barındıran kaynaklardan biridir.",
    "grade": 9
  },
  {
    "id": "book-9-55",
    "subject": "Biyoloji",
    "publisher": "Biyotik Yayınları",
    "name": "Soru Bankası",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Biyolojinin Başlangıcı: Biyotik, sadece biyoloji üreten bir uzman yayınevidir. Soruları kazanım sırasına göre gider, öğreticidir. Maarif Modeli'nin yeni \"\"Sınıflandırma\"\" sırasına tam uyumludur.",
    "grade": 9
  },
  {
    "id": "book-9-56",
    "subject": "Biyoloji",
    "publisher": "Funda Menten",
    "name": "9. Sınıf Biyoloji Defteri",
    "difficulty": "2/5 Konu Anlatım",
    "difficultyValue": 2,
    "reason": "YouTube Destekli: Funda Hoca'nın (Funda Menten) YouTube kanalındaki videolarla birebir giden \"\"Video Ders Defteri\"\"dir. Biyolojiyi ezberlemeden, mantığıyla öğrenmek isteyenler için en iyi rehberdir.",
    "grade": 9
  },
  {
    "id": "book-9-57",
    "subject": "Biyoloji",
    "publisher": "ENS Yayınları",
    "name": "Destek Defterim",
    "difficulty": "2/5 Pratik",
    "difficultyValue": 2,
    "reason": "Yazarak Çalışma: Soru bankasından ziyade, boşluk doldurmalı ve etkinlikli bir çalışma defteridir. Yeni müfredattaki terimleri (Arke, Domain vb.) yazarak öğrenmek için idealdir.",
    "grade": 9
  },
  {
    "id": "book-9-58",
    "subject": "Biyoloji",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Basamaklı Sistem: \"\"Mavi-Kırmızı-Turuncu\"\" test yapısıyla öğrenciyi yavaş yavaş zorlar. Biyolojide netlerini artırmak isteyen orta seviye öğrenci için en dengeli kaynaktır.",
    "grade": 9
  },
  {
    "id": "book-9-59",
    "subject": "Biyoloji",
    "publisher": "Miray Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Güncel İçerik: Maarif Modeli'ne en hızlı adapte olan, sayfa kenarında \"\"Biyoloji Notları\"\" barındıran kitaptır. Görselleri ve renkli tasarımıyla çalışmayı keyifli hale getirir.",
    "grade": 9
  },
  {
    "id": "book-9-60",
    "subject": "Biyoloji",
    "publisher": "Palme Yayınları",
    "name": "Soru Kitabı (Tematik)",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Biyolojinin Efsanesi: Biyolojide \"\"Palme çözmeden sınava girilmez\"\" denir. Soruları detaylıdır, konuyu tüm incelikleriyle öğretir. 2025-2026 \"\"Tematik\"\" baskısı yeni müfredata göre düzenlenmiştir.",
    "grade": 9
  },
  {
    "id": "book-9-61",
    "subject": "Biyoloji",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Referans Kaynak: Piyasada en çok güvenilen kaynaktır. \"\"Sıcak Bölge\"\" testleri ve biyolojik şekil soruları çok kalitelidir. Okul sınavlarına ve TYT'ye hazırlıkta tam ayarındadır.",
    "grade": 9
  },
  {
    "id": "book-9-62",
    "subject": "Biyoloji",
    "publisher": "Senin Biyolojin",
    "name": "TYT Biyoloji Kamp Kitabı",
    "difficulty": "3.5/5 Video Ders",
    "difficultyValue": 3.5,
    "reason": "Aras Hoca Faktörü: YouTube'da \"\"Senin Biyolojin\"\" kanalıyla uyumludur. Maarif Modeli videolarıyla senkronize gider. Kitabın görselliği ve hafıza teknikleri çok güçlüdür.",
    "grade": 9
  },
  {
    "id": "book-9-63",
    "subject": "Biyoloji",
    "publisher": "Dr. Biyoloji",
    "name": "9. Sınıf Soru Bankası",
    "difficulty": "4/5 Orta - Zor",
    "difficultyValue": 4,
    "reason": "Mantık Odaklı: Barış Hoca'nın (Dr. Biyoloji) kitabı ezber bozar. Soruları \"\"Neden/Nasıl\"\" ilişkisi üzerine kuruludur. Fen Lisesi öğrencileri için ufuk açıcıdır.",
    "grade": 9
  },
  {
    "id": "book-9-64",
    "subject": "Biyoloji",
    "publisher": "Aydın Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Detaycı: Özellikle \"\"Hücre\"\" ve \"\"Sınıflandırma\"\" ünitelerinde çok detay soru sorar. Hedefi yüksek olan, \"\"ben biyolojide soru kaçırmamalıyım\"\" diyen öğrenciye hitap eder.",
    "grade": 9
  },
  {
    "id": "book-9-65",
    "subject": "Tarih",
    "publisher": "Okyanus Yayınları",
    "name": "Iceberg Soru Bankası",
    "difficulty": "1.5/5 Başlangıç",
    "difficultyValue": 1.5,
    "reason": "Özet Konu Anlatımlı: Tarih dersinde terimler (Kurgan, Toy, Töre vb.) çoktur. Her testin başındaki özetler ve kavram haritaları, yeni müfredatın kavramlarını öğrenciye ezberletmeden öğretir.",
    "grade": 9
  },
  {
    "id": "book-9-66",
    "subject": "Tarih",
    "publisher": "Benim Hocam",
    "name": "9. Sınıf Video Ders Defteri",
    "difficulty": "2/5 Konu Anlatım",
    "difficultyValue": 2,
    "reason": "Ramazan Yetgin Faktörü: Türkiye'nin en iyi tarih anlatıcılarından Ramazan Hoca'nın 9. sınıf müfredatına özel anlatımıdır. Soru bankasından önce konuyu hikayeleştirerek dinlemek için şarttır.",
    "grade": 9
  },
  {
    "id": "book-9-67",
    "subject": "Tarih",
    "publisher": "Sonuç Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Kazanım Odaklı: Konuları \"\"Kazanım Testi\"\" mantığıyla böler. Özellikle yazılıya hazırlık sayfaları ve boşluk doldurma etkinlikleri, okul başarısını doğrudan artırır.",
    "grade": 9
  },
  {
    "id": "book-9-68",
    "subject": "Tarih",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Harita ve Görsel Yorumlama: Maarif Modeli \"\"görsel okuryazarlık\"\" ister. Hız ve Renk, özellikle harita yorumlama sorularında ve renkli basımıyla öğrenciyi sıkmadan öğretir.",
    "grade": 9
  },
  {
    "id": "book-9-69",
    "subject": "Tarih",
    "publisher": "Yayın Denizi",
    "name": "Pro Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Sözelci Dostu: Soruları çok dengelidir. Yeni müfredatın \"\"insan odaklı\"\" tarih anlayışını yansıtır. Paragraf tipi tarih soruları ile okuduğunu anlama becerisini geliştirir.",
    "grade": 9
  },
  {
    "id": "book-9-70",
    "subject": "Tarih",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Referans Kaynak: Tarihte de kalitesini konuşturur. \"\"Sıcak Bölge\"\" testleri ve ÖSYM tipi sorularıyla hem okul sınavlarına hem de gelecekteki TYT'ye en sağlam hazırlıktır.",
    "grade": 9
  },
  {
    "id": "book-9-71",
    "subject": "Tarih",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor / Detay",
    "difficultyValue": 4,
    "reason": "Detay Sevenlere: Tarihi seven, sözel veya eşit ağırlık seçmeyi düşünen öğrenciler içindir. Müfredatın en ince detayını (Hükümdar unvanları vb.) sorar, öğrenciyi uzmanlaştırır.",
    "grade": 9
  },
  {
    "id": "book-9-72",
    "subject": "Tarih",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Yorum",
    "difficultyValue": 4,
    "reason": "Yeni Nesil: Tarihte \"\"yeni nesil soru\"\" (uzun metinli, neden-sonuç ilişkili) tarzını en iyi uygulayanlardandır. Ezber bozan, yorum gücü yüksek sorular içerir.",
    "grade": 9
  },
  {
    "id": "book-9-73",
    "subject": "Coğrafya",
    "publisher": "Coğrafyanın Kodları",
    "name": "9. Sınıf Kamp Kitabı",
    "difficulty": "1/5 Başlangıç/Konu",
    "difficultyValue": 1,
    "reason": "Yunus Hoca Faktörü: YouTube'un en popüler coğrafya kanalıdır. Maarif Modeli'ne özel çıkardığı bu kamp kitabı, haritaları ve kodlamaları (hafıza teknikleri) ile coğrafyayı sevdirir. İlk adım için şarttır.",
    "grade": 9
  },
  {
    "id": "book-9-74",
    "subject": "Coğrafya",
    "publisher": "Okyanus Yayınları",
    "name": "Iceberg Soru Bankası",
    "difficulty": "1.5/5 Öğretici",
    "difficultyValue": 1.5,
    "reason": "Konu Özetli: Her testin başında verdiği \"\"hap bilgiler\"\" ve harita görselleri ile konuyu hatırlatır. Coğrafya terimlerine (izohips, enlem vb.) yabancı olanlar için yumuşak bir giriştir.",
    "grade": 9
  },
  {
    "id": "book-9-75",
    "subject": "Coğrafya",
    "publisher": "Sonuç Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "2/5 Kazanım",
    "difficultyValue": 2,
    "reason": "Okul Başarısı: Konuları parçalar halinde işler. Özellikle \"\"Harita Bilgisi\"\" ve \"\"İklim\"\" gibi sayısal mantık gerektiren ünitelerde bol örnek çözerek öğrenciyi yazılıya hazırlar.",
    "grade": 9
  },
  {
    "id": "book-9-76",
    "subject": "Coğrafya",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Görsel Zeka: Renkli haritaları ve görselleriyle ünlüdür. Mavi testlerle konuyu kavratır, Turuncu testlerle zorlar. Yeni müfredatın \"\"Görsel Okuryazarlık\"\" hedefine çok uygundur.",
    "grade": 9
  },
  {
    "id": "book-9-77",
    "subject": "Coğrafya",
    "publisher": "Yavuz Tuna",
    "name": "Video Ders Defteri",
    "difficulty": "3/5 Konu Anlatım",
    "difficultyValue": 3,
    "reason": "Efsane Anlatım: Yavuz Tuna, coğrafyanın duayenlerindendir. Kitabı, YouTube videolarıyla senkronizedir. Harita çizimlerini bizzat yaptırarak öğretir (dilsiz harita çalışmaları).",
    "grade": 9
  },
  {
    "id": "book-9-78",
    "subject": "Coğrafya",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Referans Kaynak: Coğrafyada da piyasa lideridir. \"\"Sıcak Bölge\"\" testleri, TYT formatındaki harita soruları ve güncel \"\"Afetler\"\" ünitesiyle tam bir başucu kitabıdır.",
    "grade": 9
  },
  {
    "id": "book-9-79",
    "subject": "Coğrafya",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Yorum",
    "difficultyValue": 4,
    "reason": "Yeni Nesil: Coğrafyada \"\"paragraf tipi\"\" ve \"\"yorum ağırlıklı\"\" soruları en iyi kurgulayan yayındır. Ezber bozar, haritayı yorumlatır.",
    "grade": 9
  },
  {
    "id": "book-9-80",
    "subject": "Coğrafya",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor/Detay",
    "difficultyValue": 4,
    "reason": "Detaycı: Coğrafyayı sözelden (veya Eşit Ağırlıktan) fullemek isteyenler içindir. Müfredattaki en ince ayrıntıyı (yerel rüzgarların özel isimleri vb.) sorar. Zorlayıcıdır.",
    "grade": 9
  },
  {
    "id": "book-9-81",
    "subject": "Din Kültürü",
    "publisher": "Okyanus Yayınları",
    "name": "Iceberg Soru Bankası",
    "difficulty": "1/5 Başlangıç",
    "difficultyValue": 1,
    "reason": "Özetli ve Pratik: Her testin başında o üniteyle ilgili (Tevhid, İhlas, Fıtrat vb.) kavramların kısa özetleri vardır. Din kültürü kavramlarına yabancı olanlar için en iyi başlangıçtır.",
    "grade": 9
  },
  {
    "id": "book-9-82",
    "subject": "Din Kültürü",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "2/5 Kolay - Orta",
    "difficultyValue": 2,
    "reason": "Kavram Haritaları: Renkli tasarımı ve kavram haritaları ile sıkıcı ezberden kurtarır. Mavi testler konuyu öğretir, kırmızı testler paragraf yorumlatır. Din dersinde net çıkarmak için en popüler kaynaktır.",
    "grade": 9
  },
  {
    "id": "book-9-83",
    "subject": "Din Kültürü",
    "publisher": "Tonguç Akademi",
    "name": "9. Sınıf Dinamo",
    "difficulty": "2/5 Okul Tarzı",
    "difficultyValue": 2,
    "reason": "Yazılıya Hazırlık: İçinde \"\"Yazılı Denemeleri\"\" ve klasik (açık uçlu) sorular barındırır. Okuldaki Din sınavlarından yüksek not almak isteyen öğrenciler için özel olarak tasarlanmıştır.",
    "grade": 9
  },
  {
    "id": "book-9-84",
    "subject": "Din Kültürü",
    "publisher": "Eis Yayınları",
    "name": "DAF (Ders Föyleri)",
    "difficulty": "2/5 Disiplinli",
    "difficultyValue": 2,
    "reason": "Ders Notu: Din dersinde hoca anlatırken not tutmak zor olabilir. Eis föyleri, Maarif Modeli'nin tüm kazanımlarını adım adım işler. Düzenli ders takibi için idealdir.",
    "grade": 9
  },
  {
    "id": "book-9-85",
    "subject": "Din Kültürü",
    "publisher": "Yayın Denizi",
    "name": "Pro Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Paragraf Odaklı: Maarif Modeli'nin ve TYT'nin istediği \"\"Din Kültürü Paragrafı\"\" tarzını en iyi yansıtan kitaptır. Bilgiyi doğrudan sormaz, bir metin verip yorumlamanızı ister.",
    "grade": 9
  },
  {
    "id": "book-9-86",
    "subject": "Din Kültürü",
    "publisher": "Benim Hocam",
    "name": "Video Ders Defteri",
    "difficulty": "3/5 Konu Anlatım",
    "difficultyValue": 3,
    "reason": "Hikayeleştirme: Video desteklidir. Din kültürü konularını güncel hayatla ve bilimle ilişkilendirerek anlatır. Ezber yapmadan mantığını kavramak isteyenler için çok başarılıdır.",
    "grade": 9
  },
  {
    "id": "book-9-87",
    "subject": "Din Kültürü",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Referans Kaynak: 9. sınıf olmasına rağmen sizi üniversite sınavına (TYT) hazırlar. \"\"Sıcak Bölge\"\" testleri, kavram eşleştirmeleri ve yeni nesil sorularıyla piyasanın en iyisidir.",
    "grade": 9
  },
  {
    "id": "book-9-88",
    "subject": "Din Kültürü",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor / Detay",
    "difficultyValue": 4,
    "reason": "Kavram Avcısı: Din Kültürü dersini çok ciddiye alan veya İmam Hatip Lisesi müfredatına yakın detay görmek isteyenler içindir. Kavram bilgisi çok yoğundur.",
    "grade": 9
  },
  {
    "id": "book-10-1",
    "subject": "Matematik",
    "publisher": "Mikro Orijinal",
    "name": "MÖF (Fasikül)",
    "difficulty": "1.5/5 Başlangıç",
    "difficultyValue": 1.5,
    "reason": "Temel Atma: Konuyu en küçük parçalara (mikro hücrelere) bölerek anlatır. Matematik korkusu olanlar için en güvenli giriştir.",
    "grade": 10
  },
  {
    "id": "book-10-2",
    "subject": "Matematik",
    "publisher": "YarıÇap Yayınları",
    "name": "Soru Bankası",
    "difficulty": "1.5/5 Başlangıç",
    "difficultyValue": 1.5,
    "reason": "Pratik Başlangıç: Çap Yayınları'nın alt markasıdır. Çap fasiküllerinden daha kolaydır. Konuyu yeni öğrenen ve \"\"ısınma turu\"\" atmak isteyenler içindir.",
    "grade": 10
  },
  {
    "id": "book-10-3",
    "subject": "Matematik",
    "publisher": "Metin Yayınları",
    "name": "Parkur (Konu Anlatımlı SB)",
    "difficulty": "2/5 Kolay - Orta",
    "difficultyValue": 2,
    "reason": "Kur Sistemi: \"\"Öğren-Pekiştir\"\" mantığıyla ilerler. Klasik test kitabından ziyade bir çalışma defteri havasındadır.",
    "grade": 10
  },
  {
    "id": "book-10-4",
    "subject": "Matematik",
    "publisher": "Sonuç Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "2/5 Kolay - Orta",
    "difficultyValue": 2,
    "reason": "Kazanım Odaklı: Yılların klasiğidir. Bol çözümlü örnek içerir. Öğrencinin kendi başına konuyu kavraması için en iyi kaynaktır.",
    "grade": 10
  },
  {
    "id": "book-10-5",
    "subject": "Matematik",
    "publisher": "Kafa Dengi",
    "name": "Süper Öğreten Soru Bankası",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Adım Adım: Kafa Dengi'nin \"\"Turuncu\"\" kapaklı serisidir. YouTube destekli gider ve konuyu öğretmeye odaklanır.",
    "grade": 10
  },
  {
    "id": "book-10-6",
    "subject": "Matematik",
    "publisher": "Karekök Yayınları",
    "name": "MPS (Modüler Piramit Sistemi)",
    "difficulty": "2.5/5 Öğretici / Drill",
    "difficultyValue": 2.5,
    "reason": "Köşe Taşı Yöntemi: Her soru tipini önce çözer, sonra aynısından 4 tane sorar. İşlem yeteneğini geliştirmek ve soru kalıplarını ezberlemek için rakipsizdir.",
    "grade": 10
  },
  {
    "id": "book-10-7",
    "subject": "Matematik",
    "publisher": "Zafer Yayınları",
    "name": "Soru Bankası Fasikül Seti",
    "difficulty": "2.5/5 Orta",
    "difficultyValue": 2.5,
    "reason": "Ekonomik ve Klasik: Konu özetli ve bol alıştırmalıdır. Yeni müfredat için set halinde basılmıştır, okul derslerine paralel gitmek için uygundur.",
    "grade": 10
  },
  {
    "id": "book-10-8",
    "subject": "Matematik",
    "publisher": "Acil Yayınları",
    "name": "Tema Seti (Fasikül)",
    "difficulty": "2.5/5 Öğretici",
    "difficultyValue": 2.5,
    "reason": "Konu Anlatımı: Acil'in zorluğundan bağımsız, tamamen \"\"öğretim\"\" odaklı fasiküllerdir. Maarif Modeli'nin tema yapısına birebir uygundur.",
    "grade": 10
  },
  {
    "id": "book-10-9",
    "subject": "Matematik",
    "publisher": "Hız ve Renk",
    "name": "\"\"Hit\"\" Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Renklerle Seviye: Mavi (Kolay), Kırmızı (Orta), Turuncu (Zor) testleri ile meşhurdur. Hızlanmak isteyen öğrenci için ideal ara geçiş kitabıdır.",
    "grade": 10
  },
  {
    "id": "book-10-10",
    "subject": "Matematik",
    "publisher": "Eis Yayınları",
    "name": "DAF (Ders Föyleri)",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Sınıf İçi: Düzenli not tutmak ve müfredatı adım adım takip etmek için kurumsal yapıda en çok tercih edilen föydür.",
    "grade": 10
  },
  {
    "id": "book-10-11",
    "subject": "Matematik",
    "publisher": "Miray Yayınları",
    "name": "TYMM Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Güncel ve Dinamik: Sayfa kenarı notları ve yeni nesil soru geçişleri çok dengelidir. Maarif Modeli'ne en hızlı uyum sağlayan yayınlardandır.",
    "grade": 10
  },
  {
    "id": "book-10-12",
    "subject": "Matematik",
    "publisher": "Nitelik Yayınları",
    "name": "Beceri Temelli Soru Kitabı",
    "difficulty": "3.5/5 Orta",
    "difficultyValue": 3.5,
    "reason": "Yeni Nesil Odaklı: Klasik sorudan ziyade, yeni müfredatın istediği \"\"beceri temelli\"\" ve \"\"hikayeli\"\" sorulara ağırlık verir.",
    "grade": 10
  },
  {
    "id": "book-10-13",
    "subject": "Matematik",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Referans Kaynak: Piyasada \"\"ÖSYM standardı\"\" denince akla gelen ilk kitaptır. Yazılı ve deneme sınavlarında başarı için olmazsa olmazdır.",
    "grade": 10
  },
  {
    "id": "book-10-14",
    "subject": "Matematik",
    "publisher": "Kafa Dengi",
    "name": "\"\"Ekstra\"\" Soru Bankası",
    "difficulty": "4/5 Orta - Zor",
    "difficultyValue": 4,
    "reason": "Sınav Hazırlık: Süper Öğreten'in bir üstüdür. \"\"Siyah/Koyu\"\" kapaklıdır. Zorlayıcı ve seçici sorular barındırır.",
    "grade": 10
  },
  {
    "id": "book-10-15",
    "subject": "Matematik",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Klasik Zor: Yıllardır çizgisini bozmayan, işlem yeteneği ve sağlam geometri bilgisi isteyen \"\"Kemik\"\" bir kaynaktır.",
    "grade": 10
  },
  {
    "id": "book-10-16",
    "subject": "Matematik",
    "publisher": "Aydın Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "İşlem Yeteneği: Fen Lisesi öğrencileri için klasiktir. Bol işlem gerektiren, teknik soruları ile bilinir. Öğrencinin kalemini güçlendirir, \"\"Soru kaçırmaz\"\" hale getirir.",
    "grade": 10
  },
  {
    "id": "book-10-17",
    "subject": "Matematik",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Yorum Gücü: Açık uçlu ve etkinlikli sorularıyla öne çıkar. Öğrenciyi düşünmeye ve yorum yapmaya zorlar.",
    "grade": 10
  },
  {
    "id": "book-10-18",
    "subject": "Matematik",
    "publisher": "Orijinal Yayınları",
    "name": "ODAF (Ders Föyleri)",
    "difficulty": "4/5 Orta - Zor",
    "difficultyValue": 4,
    "reason": "Detaylı Anlatım: Konu anlatımı bile öğrenciyi zorlar. Fen liselerinde ders işlemek için kullanılan, ispatlara giren güçlü bir föydür.",
    "grade": 10
  },
  {
    "id": "book-10-19",
    "subject": "Matematik",
    "publisher": "Endemik Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4.5/5 Zor",
    "difficultyValue": 4.5,
    "reason": "Seçici Sorular: Özellikle zor soru görmek isteyen öğrencilerin tercihidir. Üniversite sınavı zorluk derecesinin bir tık üzerini hedefler.",
    "grade": 10
  },
  {
    "id": "book-10-20",
    "subject": "Matematik",
    "publisher": "Acil Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4.5/5 Zor",
    "difficultyValue": 4.5,
    "reason": "Ufuk Açıcı: Fasikülünden farklı olarak soru bankası öğrencileri zorlar. Sağlam geometri ve problem soruları içerir.",
    "grade": 10
  },
  {
    "id": "book-10-21",
    "subject": "Matematik",
    "publisher": "Orijinal Yayınları",
    "name": "Soru Bankası",
    "difficulty": "5/5 Zor - İleri",
    "difficultyValue": 5,
    "reason": "Derece Kaynağı: Piyasada \"\"Zorluğun Zirvesi\"\" kabul edilir. Pembe testleri ile en iyi öğrencileri bile terletir.",
    "grade": 10
  },
  {
    "id": "book-10-22",
    "subject": "Edebiyat",
    "publisher": "Okyanus Yayınları",
    "name": "Iceberg Soru Bankası",
    "difficulty": "1.5/5 Başlangıç",
    "difficultyValue": 1.5,
    "reason": "Konu Özetli: Her testin başında kısa konu özetleri vardır. Divan Edebiyatı gibi ağır konularda öğrenciye \"\"can simidi\"\" olur. Soruları yormaz, temel düzeydedir.",
    "grade": 10
  },
  {
    "id": "book-10-23",
    "subject": "Edebiyat",
    "publisher": "Sonuç Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Kazanım Odaklı: Edebiyatı parça parça öğretir. Özellikle \"\"Dil Bilgisi\"\" (Fiilimsi, Cümle Türleri vb.) kısımlarında zorlananlar için bol alıştırma sunar.",
    "grade": 10
  },
  {
    "id": "book-10-24",
    "subject": "Edebiyat",
    "publisher": "Hız Yayınları",
    "name": "Soru Bankası",
    "difficulty": "2/5 Kolay - Orta",
    "difficultyValue": 2,
    "reason": "Pekiştirme: Konuyu sınıfta dinledikten sonra çözülebilecek, öğrenciyi sıkmayan, net ve anlaşılır sorulardan oluşur.",
    "grade": 10
  },
  {
    "id": "book-10-25",
    "subject": "Edebiyat",
    "publisher": "Kafa Dengi",
    "name": "Süper Öğreten (Turuncu)",
    "difficulty": "2.5/5 Öğretici",
    "difficultyValue": 2.5,
    "reason": "YouTube Uyumlu: Video ders notlarıyla paralel gider. Edebiyatı ezberden kurtarıp mantığını öğretmeye odaklanır. Ara sınıflar için idealdir.",
    "grade": 10
  },
  {
    "id": "book-10-26",
    "subject": "Edebiyat",
    "publisher": "Yayın Denizi",
    "name": "Pro Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Sözelin Kralı: Yayın Denizi, sözel derslerde çok güçlüdür. Soruları ne çok kolay ne çok zordur",
    "grade": 10
  },
  {
    "id": "book-10-27",
    "subject": "Edebiyat",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Ritim Yakalama: Mavi (Kolay), Kırmızı (Orta), Turuncu (Zor) testleri vardır. \"\"Kitap Tahlili\"\" ve \"\"Okuma\"\" üniteleri için özel testler barındırır.",
    "grade": 10
  },
  {
    "id": "book-10-28",
    "subject": "Edebiyat",
    "publisher": "Eis Yayınları",
    "name": "DAF (Ders Föyleri)",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Ders Notu: Okulda hoca anlatırken not tutmak yerine föy üzerinden gitmek isteyenler için birebirdir. Edebiyatın yoğun bilgi yükünü hafifletir.",
    "grade": 10
  },
  {
    "id": "book-10-29",
    "subject": "Edebiyat",
    "publisher": "Miray Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Öğretmen Notları: Sayfa kenarlarında \"\"Yazar-Eser\"\" hatırlatmaları ve pratik bilgiler bulunur. Maarif Modeli'nin metin odaklı yapısına uygundur.",
    "grade": 10
  },
  {
    "id": "book-10-30",
    "subject": "Edebiyat",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Referans Kaynak: Edebiyatın \"\"Best Seller\"\"ıdır. ÖSYM tarzı soruları, \"\"Sıcak Bölge\"\" testleri ve yazar-eser eşleştirmeleri ile 10. sınıfın en dengeli kitabıdır.",
    "grade": 10
  },
  {
    "id": "book-10-31",
    "subject": "Edebiyat",
    "publisher": "Çap Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "3.5/5 Orta",
    "difficultyValue": 3.5,
    "reason": "Ünite Ünite: Kitap kalın geliyorsa fasikül alıp sadece \"\"Şiir\"\" veya \"\"Hikaye\"\" ünitesine çalışmak için idealdir.",
    "grade": 10
  },
  {
    "id": "book-10-32",
    "subject": "Edebiyat",
    "publisher": "Palme Yayınları",
    "name": "Soru Kitabı",
    "difficulty": "4/5 Orta - Zor",
    "difficultyValue": 4,
    "reason": "Akademik Dil: Soruları biraz daha detaylı ve bilgi ağırlıklıdır. Özellikle Dil Bilgisi kısmında (Yazım, Noktalama, Cümle Ögeleri) çok sağlamdır.",
    "grade": 10
  },
  {
    "id": "book-10-33",
    "subject": "Edebiyat",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Yeni Nesil: Edebiyatta \"\"yeni nesil soru nasıl olur?\"\"un cevabıdır. Metinleri uzundur, okuduğunu anlama ve yorumlama becerisini ölçer.",
    "grade": 10
  },
  {
    "id": "book-10-34",
    "subject": "Edebiyat",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "5/5 Zor - İleri",
    "difficultyValue": 5,
    "reason": "Edebiyatın Zirvesi: Piyasada \"\"Limit çözmeden sınava girilmez\"\" algısı vardır. Soruları çok detaylıdır (\"\"Kıyıda köşede kalmış eserleri sorar\"\"). 10. sınıftan derece hedefleyenlerin başucu kitabıdır.",
    "grade": 10
  },
  {
    "id": "book-10-35",
    "subject": "Edebiyat",
    "publisher": "Aydın Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4.5/5 Zor",
    "difficultyValue": 4.5,
    "reason": "Detaycı: Limit ile yarışır. Özellikle Divan Edebiyatı testlerinde beyit şerhleri (açıklamaları) ve aruz ölçüsü gibi teknik konularda zorlar.",
    "grade": 10
  },
  {
    "id": "book-10-36",
    "subject": "Fizik",
    "publisher": "Okyanus",
    "name": "Iceberg Soru Bankası",
    "difficulty": "1.5/5 Başlangıç",
    "difficultyValue": 1.5,
    "reason": "Konu Özetli: Elektrik gibi ağır konularda her testin başında verdiği özetler hayat kurtarır. Temeli zayıf olanlar için yumuşak bir giriştir.",
    "grade": 10
  },
  {
    "id": "book-10-37",
    "subject": "Fizik",
    "publisher": "Eis Yayınları",
    "name": "DAF (Ders Föyleri)",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Ders Takibi: 10. sınıf fiziği çok formül ve çizim içerir. Eis föyleri öğrenciyi not tutma yükünden kurtarır, dersi dinlemeye odaklar.",
    "grade": 10
  },
  {
    "id": "book-10-38",
    "subject": "Fizik",
    "publisher": "Altuğ Güneş",
    "name": "10. Sınıf Soru Bankası",
    "difficulty": "2.5/5 YouTube",
    "difficultyValue": 2.5,
    "reason": "Video Destekli: YouTube'un sevilen hocalarından Altuğ Güneş'in kitabı, videolu anlatımlarıyla paralel gider. Samimi ve anlaşılır bir dili vardır.",
    "grade": 10
  },
  {
    "id": "book-10-39",
    "subject": "Fizik",
    "publisher": "Zafer Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Klasik: Okullarda çokça tercih edilir. Klasik soru tiplerini taramak ve yazılıya hazırlanmak için güvenli bir limandır.",
    "grade": 10
  },
  {
    "id": "book-10-40",
    "subject": "Fizik",
    "publisher": "Miray Yayınları",
    "name": "10. Sınıf DAF (Maarif)",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Tam Uyum: 2026 Maarif Modeli'ne özel olarak hazırlanmış \"\"Ders Anlatım Fasikülleri\"\"dir. Yeni müfredatın \"\"etkinlik\"\" odaklı yapısını barındırır.",
    "grade": 10
  },
  {
    "id": "book-10-41",
    "subject": "Fizik",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası (Maarif)",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Standart: 10. sınıf fiziğinde öğrencilerin en çok güvendiği kaynaktır. Elektrik devreleri ve Basınç testleri ÖSYM tadındadır.",
    "grade": 10
  },
  {
    "id": "book-10-42",
    "subject": "Fizik",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Orta - Zor",
    "difficultyValue": 4,
    "reason": "Yorum Gücü: Yeni modelin istediği \"\"Yorumlama\"\" ve \"\"Günlük Hayat\"\" sorularını en iyi harmanlayan kitaptır. Özellikle Optik ve Dalga soruları ufuk açıcıdır.",
    "grade": 10
  },
  {
    "id": "book-10-43",
    "subject": "Fizik",
    "publisher": "345 (ÜçDörtBeş)",
    "name": "Soru Bankası",
    "difficulty": "4/5 Sınav Ayarı",
    "difficultyValue": 4,
    "reason": "ÖSYM Tarzı: Eğer 10. sınıf güncel baskısını bulabilirseniz kaçırmayın. Fizikteki \"\"Gündelik Hayatla İlişkilendirme\"\" becerisini en iyi ölçen yayındır.",
    "grade": 10
  },
  {
    "id": "book-10-44",
    "subject": "Fizik",
    "publisher": "Nihat Bilgin",
    "name": "Konu Anlatımlı Soru Kitabı",
    "difficulty": "4.5/5 Zor",
    "difficultyValue": 4.5,
    "reason": "Başucu Kitabı: Sadece soru bankası değil, aynı zamanda bir konu anlatım kitabıdır. Fiziği ezberlemeden, mantığıyla öğrenmek isteyenlerin kütüphanesinde mutlaka olmalıdır.",
    "grade": 10
  },
  {
    "id": "book-10-45",
    "subject": "Fizik",
    "publisher": "Aydın Yayınları",
    "name": "Soru Bankası (Maarif)",
    "difficulty": "5/5 İleri",
    "difficultyValue": 5,
    "reason": "Zorlayıcı: Özellikle \"\"Elektrik ve Manyetizma\"\" ünitesinde çok sağlam soruları vardır. Fen Lisesi öğrencileri için biçilmiş kaftandır.",
    "grade": 10
  },
  {
    "id": "book-10-46",
    "subject": "Kimya",
    "publisher": "Aktif Öğrenme",
    "name": "Aktif Kimya",
    "difficulty": "1/5 Başlangıç",
    "difficultyValue": 1,
    "reason": "Sayısal Sorunu Olanlara: \"\"Ben Mol yapamıyorum, hesaplamalarda kafam karışıyor\"\" diyenler için basitleştirilmiş, adım adım öğreten bir \"\"ilaç\"\"tır.",
    "grade": 10
  },
  {
    "id": "book-10-47",
    "subject": "Kimya",
    "publisher": "Orbital Yayınları",
    "name": "Odam (Ders Anlatım Modülleri)",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Fasikül Set: Soru bankası değil, konu anlatım setidir. Okul dersine paralel gitmek ve Mol kavramını mantığıyla öğrenmek için Orbital'in bu yeni serisi çok başarılıdır.",
    "grade": 10
  },
  {
    "id": "book-10-48",
    "subject": "Kimya",
    "publisher": "Okyanus",
    "name": "Iceberg Soru Bankası",
    "difficulty": "2/5 Kolay - Orta",
    "difficultyValue": 2,
    "reason": "Pratik: Özellikle karışımlar ve asit-baz ünitelerinde verdiği özet tablolar hayat kurtarır. Öğrenciyi zorlamadan konuyu kavratır.",
    "grade": 10
  },
  {
    "id": "book-10-49",
    "subject": "Kimya",
    "publisher": "Miray Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Etkinlikli: Yeni Maarif Modeli, 10. sınıfta bolca \"\"etkinlik\"\" ve \"\"boşluk doldurma\"\" ister. Miray, testlerin yanında bu tarz etkinliklere yer veren nadir kitaplardandır.",
    "grade": 10
  },
  {
    "id": "book-10-50",
    "subject": "Kimya",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası (2026)",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Referans Kaynak: 10. sınıf kimyasının \"\"olmazsa olmaz\"\"ıdır. Özellikle Mol ve Hesaplama testleri ÖSYM formatına birebir uygundur.",
    "grade": 10
  },
  {
    "id": "book-10-51",
    "subject": "Kimya",
    "publisher": "Kafa Dengi",
    "name": "Extra Soru Bankası",
    "difficulty": "4/5 Orta - Zor",
    "difficultyValue": 4,
    "reason": "Seçici Sorular: \"\"Turuncu\"\" serisi kolaydır ama bu \"\"Extra\"\" serisi (Siyah kapaklı olabilir) zorlar. Hesaplama sorularında işlem kalabalığı ve dikkat gerektiren soruları vardır.",
    "grade": 10
  },
  {
    "id": "book-10-52",
    "subject": "Kimya",
    "publisher": "Aydın Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4.5/5 Zor",
    "difficultyValue": 4.5,
    "reason": "Teknik ve Sert: Kimyada \"\"ben fullemek istiyorum\"\" diyen öğrencinin kitabıdır. Mol soruları bazen üniversite sınavından bile zor olabilir, öğrenciyi çok iyi pişirir.",
    "grade": 10
  },
  {
    "id": "book-10-53",
    "subject": "Kimya",
    "publisher": "Orbital Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Özel İlgi: Orbital'in soru bankası, Odam serisine göre daha zordur. Özellikle Asit-Baz dengesi ve Tuzlar konusunda çok detaylı sorular içerir.",
    "grade": 10
  },
  {
    "id": "book-10-54",
    "subject": "Biyoloji",
    "publisher": "Biyotik Yayınları",
    "name": "Soru Bankası (2026)",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Konu Öğreten: Yeni eklenen \"\"Enerji Dönüşümleri\"\" (Fotosentez-Solunum) konusunu en temelden, yormadan anlatan ilaç gibi bir kitaptır. İlk kaynak olarak alınmalıdır.",
    "grade": 10
  },
  {
    "id": "book-10-55",
    "subject": "Biyoloji",
    "publisher": "Okyanus",
    "name": "Iceberg Soru Bankası",
    "difficulty": "2/5 Başlangıç",
    "difficultyValue": 2,
    "reason": "Özetli: Her testin başında verdiği özetler, özellikle ağırlaşan 10. sınıf müfredatında (Mitoz-Mayoz ve Enerji) öğrenciye can simidi olur.",
    "grade": 10
  },
  {
    "id": "book-10-56",
    "subject": "Biyoloji",
    "publisher": "Çap Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "2.5/5 Konu Anlatım",
    "difficultyValue": 2.5,
    "reason": "Modüler: Konu anlatımlı fasikül setidir. \"\"Enerji\"\" ünitesi için ayrı fasikülü vardır. Okul dersiyle paralel gitmek ve konu eksiğini kapatmak için idealdir.",
    "grade": 10
  },
  {
    "id": "book-10-57",
    "subject": "Biyoloji",
    "publisher": "Miray Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Tam Uyum: Kapağında \"\"Maarif Modeli\"\" ibaresiyle çıkar. Yeni müfredatın istediği \"\"Sürdürülebilirlik\"\" ve \"\"Ekoloji\"\" kazanımlarına tam uygundur.",
    "grade": 10
  },
  {
    "id": "book-10-58",
    "subject": "Biyoloji",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Lider: 10. sınıfın \"\"Best Seller\"\"ıdır. Yeni eklenen fotosentez konularını ÖSYM tadında sorar. Yazılıya hazırlık sayfaları çok kalitelidir. Mutlaka güncel basım (2026) alınmalı.",
    "grade": 10
  },
  {
    "id": "book-10-59",
    "subject": "Biyoloji",
    "publisher": "Palme Yayınları",
    "name": "Soru Kitabı",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Klasik: Biyolojinin en zorlayıcı sorularını barındırır. \"\"Kalıtım\"\" ve yeni eklenen \"\"Solunum\"\" konusunda çok teknik sorular sorar. Sayısalcıların başucu kitabıdır.",
    "grade": 10
  },
  {
    "id": "book-10-60",
    "subject": "Biyoloji",
    "publisher": "Aydın Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Fen Lisesi Ayarı: Eski müfredattaki \"\"Sistemler\"\" konusu kalkıp yerine gelen ağır konuları (Enerji) çok detaylı işler. Zorlanmak isteyenler içindir.",
    "grade": 10
  },
  {
    "id": "book-10-61",
    "subject": "Biyoloji",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Yorum",
    "difficultyValue": 4,
    "reason": "Yeni Nesil: Şekilli, grafik yorumlamalı soruları boldur. Fotosentez deneylerini ve Kalıtım soy ağaçlarını yorumlatmaya dayalı soruları çok başarılıdır.",
    "grade": 10
  },
  {
    "id": "book-10-62",
    "subject": "Tarih",
    "publisher": "Tonguç Akademi",
    "name": "Dinamo Soru Bankası",
    "difficulty": "1/5 Başlangıç",
    "difficultyValue": 1,
    "reason": "Etkinlikli: İçinde \"\"Yazılıya Hazırlık\"\" kısımları, doğru-yanlış testleri vardır. Tarihten sıkılan ve zorlanan öğrenciyi renkli tasarımıyla derse çeker.",
    "grade": 10
  },
  {
    "id": "book-10-63",
    "subject": "Tarih",
    "publisher": "Eis Yayınları",
    "name": "DAF (Ders Föyleri)",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Ders Notu: 10. sınıf tarihi çok olay ve padişah içerir. Not tutmak yerine Eis föylerini takip etmek, kronolojiyi kaçırmamak için en iyi yöntemdir.",
    "grade": 10
  },
  {
    "id": "book-10-64",
    "subject": "Tarih",
    "publisher": "Kafa Dengi",
    "name": "Süper Öğreten (Turuncu)",
    "difficulty": "2.5/5 Öğretici",
    "difficultyValue": 2.5,
    "reason": "Video Destekli: YouTube uyumludur. Osmanlı kuruluş ve yükselme dönemlerini sadece savaş tarihi olarak değil, kültür ve medeniyet boyutuyla (yeni modele uygun) anlatır.",
    "grade": 10
  },
  {
    "id": "book-10-65",
    "subject": "Tarih",
    "publisher": "Miray Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Yeni Müfredat: Kapağında \"\"Maarif Modeli\"\" yazar. Özellikle ünite sonlarındaki \"\"Yeni Nesil Tarama\"\" testleri, bilgiyi yoruma dökme becerisini ölçer.",
    "grade": 10
  },
  {
    "id": "book-10-66",
    "subject": "Tarih",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Lider: 10. sınıfın en çok tercih edilen kitabıdır. Osmanlı tarihini siyasi, sosyal ve kültürel olarak bütüncül ele alır. Yazılı notları çok yüksektir.",
    "grade": 10
  },
  {
    "id": "book-10-67",
    "subject": "Tarih",
    "publisher": "Aydın Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Bilgi Ağırlıklı: Yorumdan ziyade net bilgi (Antlaşma maddeleri, savaş tarihleri) sorar. AYT Tarih (Sözel Sınavı) için şimdiden yatırım yapmak isteyenlere önerilir.",
    "grade": 10
  },
  {
    "id": "book-10-68",
    "subject": "Tarih",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "5/5 İleri",
    "difficultyValue": 5,
    "reason": "Zirve: Piyasada \"\"Tarihin Piri\"\" kabul edilir. Soruları çok seçicidir. Sınıfta hocanın bile anlatmadığı detayları sorabilir. Tarih gurmeleri içindir.",
    "grade": 10
  },
  {
    "id": "book-10-69",
    "subject": "Coğrafya",
    "publisher": "Ens / Zeduva",
    "name": "Coğrafyanın Kodları (Maarif)",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Video Destekli: Yunus Hoca'nın 10. sınıf için özel hazırladığı, Maarif Modeli uyumlu notlarıdır. Kayaçlar ve Topraklar gibi ezber konuları kodlamalarla öğretir.",
    "grade": 10
  },
  {
    "id": "book-10-70",
    "subject": "Coğrafya",
    "publisher": "Eis Yayınları",
    "name": "DAF (Ders Föyleri)",
    "difficulty": "2/5 Disiplinli",
    "difficultyValue": 2,
    "reason": "Ders Notu: 10. sınıf coğrafyası çok fazla alt başlık içerir. Not tutmak yerine Eis föyleri üzerinden gitmek, ders takibini kolaylaştırır ve konu bütünlüğünü sağlar.",
    "grade": 10
  },
  {
    "id": "book-10-71",
    "subject": "Coğrafya",
    "publisher": "Yayın Denizi",
    "name": "Pro Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Öğrenci Dostu: Soruları ne çok kolay ne çok zordur. Harita soruları oldukça temiz ve anlaşılırdır. \"\"Nüfus ve Göç\"\" ünitesindeki güncel verileri (TÜİK verileri vb.) kullanır.",
    "grade": 10
  },
  {
    "id": "book-10-72",
    "subject": "Coğrafya",
    "publisher": "Miray Yayınları",
    "name": "Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Güncel Müfredat: Kapağında \"\"Maarif Modeli\"\" yazar. Yeni eklenen \"\"Sürdürülebilirlik\"\" ve \"\"Çevre\"\" kazanımlarına uygun, etkinlikli bir soru bankasıdır.",
    "grade": 10
  },
  {
    "id": "book-10-73",
    "subject": "Coğrafya",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Best Seller: 10. sınıfın en güvenilir kaynağıdır. Özellikle \"\"Dünyanın Yapısı (İç Kuvvetler)\"\" ve \"\"Nüfus Piramitleri\"\" testleri ÖSYM kalitesindedir. Yazılı notlarını yükseltir.",
    "grade": 10
  },
  {
    "id": "book-10-74",
    "subject": "Coğrafya",
    "publisher": "Aydın Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor",
    "difficultyValue": 4,
    "reason": "Bilgi Ağırlıklı: Yorumdan ziyade net bilgi sorar. \"\"Hangi toprak nerede görülür?\"\", \"\"Hangi bitki hangi iklimindir?\"\" gibi ezber gerektiren konularda öğrenciyi uzmanlaştırır.",
    "grade": 10
  },
  {
    "id": "book-10-75",
    "subject": "Coğrafya",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "5/5 İleri",
    "difficultyValue": 5,
    "reason": "Zirve: Coğrafyada Limit, \"\"El Kitabı\"\" ile meşhurdur ama soru bankası da çok sağlamdır. Harita bilgisini en üst seviyede sorgular. AYT Coğrafya temeli için şarttır.",
    "grade": 10
  },
  {
    "id": "book-10-76",
    "subject": "Felsefe",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "2/5 Başlangıç",
    "difficultyValue": 2,
    "reason": "Kavram Haritalı: Felsefeye yeni başlayanlar için terimler (Arkhe, Töz vb.) korkutucu olabilir. Bu kitap, kavram haritaları ve özet tablolarıyla terimleri basitleştirir. \"\"Mavi\"\" testleri konuyu öğretir, öğrenciyi felsefeden soğutmaz.",
    "grade": 10
  },
  {
    "id": "book-10-77",
    "subject": "Felsefe",
    "publisher": "Eis Yayınları",
    "name": "DAF (Ders Anlatım Föyleri)",
    "difficulty": "2/5 Öğretici",
    "difficultyValue": 2,
    "reason": "Ders Takibi: Felsefe dersi soyuttur, derste not tutmak zordur. Eis föyleri, Maarif Modeli'ne uygun olarak konuları adım adım işler. Öğrenci sadece dinler ve boşlukları doldurur. Düzenli ders takibi için en iyisidir.",
    "grade": 10
  },
  {
    "id": "book-10-78",
    "subject": "Felsefe",
    "publisher": "Yayın Denizi",
    "name": "Pro Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Paragraf Odaklı: Maarif Modeli'nin istediği \"\"Felsefi Okuryazarlık\"\" becerisine çok uygundur. Soruları bilgi ağırlıklı değil, \"\"Metin Yorumlama\"\" ve \"\"Paragraf\"\" ağırlıklıdır. Sözel mantığı geliştirir.",
    "grade": 10
  },
  {
    "id": "book-10-79",
    "subject": "Felsefe",
    "publisher": "Tonguç Akademi",
    "name": "10. Sınıf Dinamo",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Yazılıya Hazırlık: Renkli ve eğlenceli tasarımı vardır. İçindeki \"\"Yazılı Denemeleri\"\" ve klasik sorular, okul sınavlarında yüksek not almak isteyen öğrenciler için özel olarak hazırlanmıştır.",
    "grade": 10
  },
  {
    "id": "book-10-80",
    "subject": "Felsefe",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Referans Kaynak: Felsefede de piyasa standardıdır. Hem okul yazılılarına hem de gelecekteki TYT sınavına (TYT Felsefenin %60'ı 10. sınıftır) en dengeli hazırlayan kitaptır. \"\"Sıcak Bölge\"\" testleri çok kalitelidir.",
    "grade": 10
  },
  {
    "id": "book-10-81",
    "subject": "Felsefe",
    "publisher": "Çap Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "3.5/5 Orta",
    "difficultyValue": 3.5,
    "reason": "Ünite Ünite: Kitap bütünlüğü yerine fasikül halindedir. Örneğin sadece \"\"Bilgi Felsefesi\"\" ünitesine çalışmak istiyorsanız pratiklik sağlar. Konu anlatımı ve çözümlü örnekleri boldur.",
    "grade": 10
  },
  {
    "id": "book-10-82",
    "subject": "Felsefe",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "4/5 Zor / Detay",
    "difficultyValue": 4,
    "reason": "Kavram Avcısı: Felsefeyi derinlemesine öğrenmek isteyen, Sözel veya Eşit Ağırlık hedefleyenler içindir. Müfredattaki en kıyı köşe terimleri ve filozof görüşlerini sorar. Zorlayıcıdır.",
    "grade": 10
  },
  {
    "id": "book-10-83",
    "subject": "Felsefe",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Yorum",
    "difficultyValue": 4,
    "reason": "Yeni Nesil: Felsefede \"\"mantık yürütme\"\" sorularını en iyi kurgulayan yayındır. Ezber bilgi sormaz",
    "grade": 10
  },
  {
    "id": "book-10-84",
    "subject": "Din Kültürü",
    "publisher": "Okyanus Yayınları",
    "name": "Iceberg Soru Bankası",
    "difficulty": "1/5 Başlangıç",
    "difficultyValue": 1,
    "reason": "Özetli ve Pratik: Test başlarındaki \"\"hap bilgiler\"\" sayesinde öğrencinin kavram karmaşası yaşamasını engeller. Sınav kaygısı yüksek öğrencilerin ön yargılarını kırmak ve temel atmak için en güvenli ilk adımdır.",
    "grade": 10
  },
  {
    "id": "book-10-85",
    "subject": "Din Kültürü",
    "publisher": "Sonuç Yayınları",
    "name": "Fasikül Seti",
    "difficulty": "2/5 Okul Uyumlu",
    "difficultyValue": 2,
    "reason": "Kazanım Odaklı: Maarif Modeli'nin alt kazanımlarını adım adım işler. Yazılı sınavlar öncesi açık uçlu sorulara hazırlık yapmak ve okuldaki not ortalamasını yüksek tutmak için idealdir.",
    "grade": 10
  },
  {
    "id": "book-10-86",
    "subject": "Din Kültürü",
    "publisher": "Hız ve Renk",
    "name": "Soru Bankası",
    "difficulty": "2/5 Kolay - Orta",
    "difficultyValue": 2,
    "reason": "Kavram Haritaları: Renkli tasarımıyla dersi sıkıcı olmaktan çıkarır. Mavi testlerle konuyu öğretip, kırmızı testlerle paragraf yorumlama becerisine yumuşak bir geçiş sağlar.",
    "grade": 10
  },
  {
    "id": "book-10-87",
    "subject": "Din Kültürü",
    "publisher": "Eis Yayınları",
    "name": "DAF (Ders Föyleri)",
    "difficulty": "2.5/5 Disiplinli",
    "difficultyValue": 2.5,
    "reason": "Sistematik İlerleyiş: Müfredatın tüm detaylarını atlamadan, föy föy işler. Sınıf ortamında veya bireysel çalışmada düzenli bir takip haritası sunar.",
    "grade": 10
  },
  {
    "id": "book-10-88",
    "subject": "Din Kültürü",
    "publisher": "Yayın Denizi",
    "name": "Pro Soru Bankası",
    "difficulty": "3/5 Orta",
    "difficultyValue": 3,
    "reason": "Okuduğunu Anlama: Din Kültürü sorularının artık birer \"\"Türkçe Paragraf\"\" sorusu olduğu gerçeğine en uygun yayındır. Ayet ve hadisleri verip öğrencinin yorum yapmasını, ana fikri bulmasını ister.",
    "grade": 10
  },
  {
    "id": "book-10-89",
    "subject": "Din Kültürü",
    "publisher": "Bilgi Sarmal",
    "name": "Soru Bankası",
    "difficulty": "3.5/5 Sınav Ayarı",
    "difficultyValue": 3.5,
    "reason": "Standart Belirleyici: 10. sınıfı bitirirken TYT Din Kültürü yükünün büyük kısmını halletmek için çözülmesi gereken ana kaynaktır. \"\"Sıcak Bölge\"\" testleri ÖSYM formatıyla birebir örtüşür.",
    "grade": 10
  },
  {
    "id": "book-10-90",
    "subject": "Din Kültürü",
    "publisher": "Paraf Yayınları",
    "name": "IQ Soru Kütüphanesi",
    "difficulty": "4/5 Yorum",
    "difficultyValue": 4,
    "reason": "Analitik Düşünce: Yeni nesil, uzun metinli ve muhakeme gücünü zorlayan sorular barındırır. Proje okulu dinamiğine sahip, analitik düşünme becerisi yüksek öğrencileri tatmin edecek güçlü bir kaynaktır.",
    "grade": 10
  },
  {
    "id": "book-10-91",
    "subject": "Din Kültürü",
    "publisher": "Limit Yayınları",
    "name": "Soru Bankası",
    "difficulty": "5/5 Zor / Detay",
    "difficultyValue": 5,
    "reason": "Zirve: Din Kültüründe \"\"kavram ve yorum\"\" ikilisini en zorlayıcı şekilde harmanlar. İşi şansa bırakmak istemeyen, derece hedefleyen öğrencilerin \"\"son vuruş\"\" kitabıdır.",
    "grade": 10
  }
];
