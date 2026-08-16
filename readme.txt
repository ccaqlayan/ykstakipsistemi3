================================================================================
YKS TAKİP SİSTEMİ - DOSYA SİSTEMİ İÇİNDEKİLER VE PROJE REHBERİ (README.TXT)
================================================================================
Bu dosya, projedeki tüm modüllerin, sayfaların, backend rotalarının ve bileşenlerin 
haritasıdır. Yapay zeka veya geliştiriciler değişiklik yapmadan önce doğrudan ilgili 
dosyaya odaklanmak için bu indeksi referans almalıdır.

--------------------------------------------------------------------------------
1. UYGULAMA ANADİZİN & GİRİŞ NOKTALARI (ENTRYPOINT & CORE)
--------------------------------------------------------------------------------
- server.ts                   : Express sunucu ana dosyası. Rotaların yüklenmesi, Vite dev middleware ve statik yayın.
- src/App.tsx                 : React ana kök bileşeni. State yönetimi (AppGlobalState), Firebase abonelikleri ve modal olayları.
- src/main.tsx                : React DOM başlangıç ve render dosyası.
- src/types.ts                : Tüm TypeScript arayüzleri ve veri tipleri (AppGlobalState, YKSDataState, UserAccount, DirectMessage, AuditLogItem vb.).
- src/version.ts              : Uygulama sürüm bilgisi (APP_VERSION).
- src/index.css               : Global CSS stilleri ve Tailwind/Custom stilleri.

--------------------------------------------------------------------------------
2. YÖNLENDİRME VE LEYOUT BİLEŞENLERİ (ROUTING & LAYOUT)
--------------------------------------------------------------------------------
- src/components/Navbar.tsx                 : Üst navigasyon barı (Profil, duyurular, aktif sekme başlığı).
- src/components/Sidebar.tsx                : Sol menü navigasyon çubuğu.
- src/components/StudentPreviewBanner.tsx   : Öğrenci gözünden önizleme modu (salt okunur) üst bilgi ve geri dönüş şeridi.
- src/components/app/AppTabRouter.tsx       : 18 ana sayfanın görünümünü yönlendiren ana tab switcher bileşeni.
- src/components/app/AppToastBanner.tsx      : Yüzen geri al (undo) toast kutusu, kota uyarısı ve PWA yükleme rehberi modalı.
- src/components/app/AppTypes.ts            : IP tespiti, cihaz türü ve UndoItem arayüz yardımcıları.

--------------------------------------------------------------------------------
3. MODÜLER SAYFA VE BİLEŞEN HARİTASI (PAGES & SUBCOMPONENTS)
--------------------------------------------------------------------------------

[3.1. Ana Dashboard (Öğrenci Paneli)]
- Main Orchestrator : src/components/DashboardView.tsx
- Modüller (src/components/dashboard/) :
  * DashboardTypes.ts             : Dashboard tipleri ve arayüzler
  * DashboardCountdownBar.tsx     : YKS Geri Sayım sayacı
  * DashboardTargetBanner.tsx     : Öğrenci hedef üniversite/bölüm bannerı
  * DashboardKpiCards.tsx         : Haftalık soru, net, ders saat kartları
  * DashboardDailyRoutines.tsx    : Günlük rutin checkbox bileşeni
  * DashboardSubjectWidget.tsx    : Ders bazlı ilerleme durum kartları
  * DashboardChartWidgets.tsx     : Net ve soru grafik widgetları
  * DashboardScheduleWidget.tsx   : Günlük ders çalışma çizelgesi
  * DashboardSideWidgets.tsx      : AI Koç tavsiye ve hızlı istatistikler
  * DashboardQuickNotes.tsx       : Hızlı not alma widgetı
  * DashboardSubjectNotesModal.tsx: Ders notu ekleme ve düzenleme modalı
  * DashboardBadgesWidget.tsx     : 3D rozet vitrini ve günlük çalışma serisi kartı

[3.2. Öğretmen ve Rehberlik Paneli (Teacher Dashboard)]
- Main Orchestrator : src/components/TeacherDashboardView.tsx
- Modüller (src/components/teacher/) :
  * TeacherSummaryTab.tsx         : Genel okul/sınıf özet istatistikleri
  * TeacherStudentsTab.tsx        : Sınıf öğrenci listesi ve öğrenci onay/silme
  * TeacherTeachersTab.tsx        : Öğretmen yetkilendirme ve sınıf atama tabı
  * TeacherTemplatesTab.tsx       : Ders programı şablonları yönetimi
  * TeacherStudentInspectModal.tsx: Detaylı öğrenci inceleme ve müdahale modalı

[3.3. Genel Deneme Analizi (General Mock Exams)]
- Main Orchestrator : src/components/GeneralMockView.tsx
- Modüller (src/components/mocks/) :
  * MockChartsSection.tsx         : TYT/AYT Net değişim ve sıralama grafikleri
  * MockTableSection.tsx          : Sınav listesi ve net detay tabloları
  * MockAddModal.tsx              : Yeni genel deneme ekleme penceresi
  * MockEditModal.tsx             : Genel deneme düzenleme penceresi
  * MockRankSimulatorModal.tsx    : Tahmini YKS sıralama simülatörü
  * MockCustomizeModal.tsx        : Deneme grafik ve tablo görünüm özelleştirici
  * MockInstitutionalDetailView.tsx: Kurumsal deneme detay görünümü

[3.4. Haftalık Ders Çalışma Planı (Study Planner)]
- Main Orchestrator : src/components/StudyPlannerView.tsx
- Modüller (src/components/planner/) :
  * StudyPlannerWeeklyBoard.tsx   : Haftalık sürükle-bırak / gün bazlı pano
  * StudyPlannerDailyView.tsx     : Günlük detaylı saatlik ders görünümü
  * StudyPlannerStatsView.tsx     : Tamamlanan/bekleyen ders çalışma istatistikleri
  * StudyPlannerModals.tsx        : Yeni ders ekleme, düzenleme ve şablon seçici modallar

[3.5. Ders & Konu Takibi (Subject Progress)]
- Main Orchestrator : src/components/SubjectProgressView.tsx
- Modüller (src/components/subject/) :
  * SubjectTypes.ts               : Konu ve ders ilerleme tipleri
  * SubjectLandingGrid.tsx        : Tüm derslerin kartlı ızgara görünümü
  * SubjectDetailHeader.tsx       : Ders detay üst bilgi başlığı
  * SubjectDetailOverviewTab.tsx  : Ders tamamlama ve genel durum özeti
  * SubjectTopicsTab.tsx          : TYT/AYT konu listesi ve tikleme alanı
  * SubjectMocksTab.tsx           : Derse özel deneme sonuçları tabı
  * SubjectQuestionsTab.tsx       : Derse özel soru çözüm takibi tabı
  * SubjectResourcesTab.tsx       : Derse ait kaynak kitap ilerleme tabı
  * SubjectStudyTab.tsx           : Ders çalışma süresi ve oturumları tabı
  * SubjectVideoErrorsTab.tsx     : Yanlış yapılan sorular ve ders video hataları tabı
  * PaginationControls.tsx        : Sayfalama kontrol bileşeni

[3.6. Branş Denemeleri (Branch Exams)]
- Main Orchestrator : src/components/BranchExamView.tsx
- Modüller (src/components/branch/) :
  * BranchListTab.tsx             : Branş deneme listesi ve yeni giriş alanı
  * BranchErrorsTab.tsx           : Branş denemelerindeki yanlış konu analizleri
  * BranchAnalyticsTab.tsx        : Branş deneme net grafik ve istatistikleri
  * BranchModals.tsx              : Branş denemesi ekleme/düzenleme pencereleri

[3.7. Toplu Kurumsal Deneme İçe Aktarma (Bulk Import)]
- Main Orchestrator : src/components/BulkExamImportView.tsx
- Modüller (src/components/import/) :
  * BulkImportCsvTab.tsx          : Excel/CSV dosyası yükleme ve sütun eşleme alanı
  * BulkImportPdfTab.tsx          : Yapay Zeka destekli PDF sınav sonuç belgesi ve karne ayrıştırma alanı
  * BulkImportMarkdownTab.tsx     : Yapay zekasız, tarayıcıda anında çalışan Markdown (.md) sınav sonuç belgesi ayrıştırma alanı
  * BulkImportHistoryTab.tsx      : Geçmiş toplu aktarım kayıtları
  * BulkImportModals.tsx          : Manuel öğrenci eşleştirme ve toplu giriş modalları

[3.8. Sistem Yönetimi & Ayarlar (System Management)]
- Main Orchestrator : src/components/SystemManagementView.tsx
- Modüller (src/components/system/) :
  * SystemTypes.ts                : Sistem yönetimi tipleri
  * SystemAiTab.tsx               : Gemini AI yönetimi ana orchestrator ve 6 alt-tab yönlendiricisi
  * ai/AiOverviewTab.tsx          : Yapay zeka özet paneli ve temel KPI kartları
  * ai/AiCostTab.tsx              : Yapay zeka bütçe, maliyet alarmı (anomali) ve harcama tabloları
  * ai/AiStatsTab.tsx             : Recharts grafikli günlük jeton harcama ve model kullanım istatistikleri
  * ai/AiModelSettingsTab.tsx     : Gemini modelleri, modül model tercihleri ve sistem genel anahtarı
  * ai/AiQuerySettingsTab.tsx     : Yapay zeka koçu prompt veri izinleri ve sorgu kayıt limitleri
  * ai/AiAuditLogsTab.tsx         : Yapay zeka istek günlüğü ve ayakizi takibi
  * SystemSettingsTab.tsx         : Okul adı, veritabanı ve genel sistem ayarları
  * SystemStorageTab.tsx          : Disk kullanımı ve Firestore veritabanı kotası alanı
  * SystemVersionTab.tsx          : GitHub sürüm güncelleme, commit geçmişi ve sistem yedekleri yönetimi alanı

[3.9. Bağımsız Diğer Ekranlar (Independent Views)]
- src/components/AICoachView.tsx               : Bireysel öğrenci ve sınıf genel Yapay Zeka Koç Raporu.
- src/components/AdminMessageManagement.tsx   : Yönetici toplu mesaj gönderme ve mesaj denetim paneli.
- src/components/AuditLogsView.tsx             : Sistem İşlem Zaman Çizelgesi (Ayak İzi izleme alanı).
- src/components/ConfirmDeleteModal.tsx        : Evrensel silme onay penceresi.
- src/components/GoogleSheetsView.tsx          : Google Tabloları bağlantı ve veri senkronizasyonu.
- src/components/LoginView.tsx                 : Kullanıcı giriş ve hesap oluşturma ekranı.
- src/components/MaintenanceView.tsx           : Sistem bakım modu ekranı ve yönetici bypass giriş penceresi.
- src/components/MessagesView.tsx              : Birebir rehberlik ve sınıf mesajlaşma alanı.
- src/components/PastExamsView.tsx             : ÖSYM Çıkmış YKS sınav istatistikleri ve analiz ekranı.
- src/components/PastQuestionsView.tsx          : Konularına göre çıkmış soru sayıları ve ağırlıkları.
- src/components/PomodoroView.tsx              : Pomodoro odaklanma sayacı ve kronometre.
- src/components/ProfileModal.tsx             : Öğrenci profil bilgileri ve YKS hedef düzenleme modalı.
- src/components/QuestionTrackerView.tsx       : Günlük soru çözme hedef ve sayaç ekranı.
- src/components/RecommendationsView.tsx       : Derece öğrencileri kaynak kitap ve YouTube kanal tavsiyeleri.
- src/components/ResourceTrackerView.tsx       : Kaynak kitap soru çözüm ve bitirme takip ekranı.
- src/components/RoutinesView.tsx              : Günlük çalışma ve paragraf/problem rutinleri ekranı.
- src/components/TargetModal.tsx               : Hedef net ve sıralama belirleme penceresi.
- src/components/TemplateFullBuilderView.tsx   : Şablon ders programı oluşturucu ekranı.
- src/components/TemplateWeeklyPreviewModal.tsx: Şablon ders programı haftalık önizleme penceresi.
- src/components/UniversityLogoManagerModal.tsx: Üniversite amblemleri ve logo yönetim modalı.
- src/components/UniversityLogo.tsx            : Üniversite amblemleri ve Wikipedia proxy bileşeni.
- src/components/YouTubeTrackerView.tsx        : YouTube ders playlisti ve video takip ekranı.
- src/components/badges/BadgeShield.tsx        : 3D fasetli kristal kalkan SVG çizici.
- src/components/badges/BadgeIcons.tsx         : Roket, alev, kılıç, taç vb. 3D SVG amblemleri.
- src/components/badges/BadgeCelebrationModal.tsx : Rozet açılma konfeti & zafer töreni modalı.
- src/components/badges/BadgesShowcaseModal.tsx   : Tam rozet koleksiyonu & albüm modalı.
- src/components/badges/DashboardBadgesWidget.tsx : Dashboard rozet vitrini ve aktif streak kartı.
- src/components/motivation/MotivationToast.tsx   : Anlık bağlam duyarlı sağ alt tebrik toast'u.
- src/components/system/MotivationMessagesTab.tsx : Admin paneli motivasyon metinleri düzenleyici.

--------------------------------------------------------------------------------
4. SUNUCU VE BACKEND ROTALARI (SERVER & API ROUTES)
--------------------------------------------------------------------------------
- server.ts                   : Sunucu ayağa kaldırma ve express middleware.
- src/server/config.ts        : Port, Firebase Admin, Gemini AI ve dosya yükleme yolları yapılandırması.
- src/server/routes/authRoutes.ts  : `/api/auth/*` (Login, Register, Logout, Password Reset, Google OAuth2, 6 Haneli E-posta Kod Doğrulama).
- src/server/routes/sheetsRoutes.ts: `/api/sheets/*` (Google Tablosu otomatik oluşturma ve canlı veri aktarma).
- src/server/routes/geminiRoutes.ts: `/api/gemini/*` (Yapay Zeka Bireysel/Sınıf Koçu, Soru Çözücü, Çeldirici Analizi, Benzer Soru Üretici, Rozet Entegrasyonu).
- src/server/routes/systemRoutes.ts: `/api/*` (Storage istatistikleri, YouTube playlist scraper, Fotoğraf Yükleme/Silme, Admin Mesaj Yönetimi, Wikipedia Proxy).
- src/server/routes/updaterRoutes.ts: `/api/system/updater/*` (GitHub sürümleri, otomatik güncelleme, anlık yedek alma, log akışı ve rollback).
- src/server/routes/emergencyRecoveryRoute.ts: `/emergency-restore` (Bağımsız, standalone acil durum felaket kurtarma HTML ve API rotası).
- src/server/services/updaterService.ts: (GitHub API, AdmZip yedekleme/geri yükleme ve auto-rollback motoru).

--------------------------------------------------------------------------------
5. SERVİSLER, VERİ SETLERİ VE YARDIMCI YAZILIMLAR (SERVICES, DATA & UTILS)
--------------------------------------------------------------------------------
[Servisler (src/services/)]
- firebase.ts        : Firestore ve Authentication gerçek zamanlı abonelik ve kayıt fonksiyonları.
- geminiService.ts   : Frontend'den Gemini AI endpoint'lerine yapılan istek servisleri.
- motivationEngine.ts: 26 adet 3D başarım rozeti kuralları, XP sistemi, seri (streak) hesaplayıcı ve anlık geri bildirim motoru.
- sheetsService.ts   : Google Sheets API istemci istekleri.
- storage.ts         : LocalStorage yerel önbellek ve yükleme yardımcıları.
- storageUpload.ts   : Mesaj ve avatar fotoğraflarını sunucuya/Firebase Storage'a yükleyen servis.

[Veri Setleri (src/data/)]
- books.ts           : Önerilen kaynak kitap kataloğu ve zorluk dereceleri.
- departments.ts     : Üniversite bölümleri ve puan türleri listesi.
- initialData.ts     : Uygulama varsayılan başlangıç verileri.
- pastExamData.ts    : ÖSYM geçmiş YKS taban puan ve sıralama verileri.
- pastQuestionsData.ts: ÖSYM geçmiş yıllara göre konu bazlı soru sayıları.
- universities.ts    : Türkiye üniversiteler listesi.

[Yardımcı Modüller (src/utils/)]
- colorUtils.ts        : Rastgele renk ve badge stil oluşturucuları.
- dateUtils.ts         : Tarih formatlama ve zaman hesaplayıcılar.
- imageCompressor.ts   : Görsel boyut küçültme ve Canvas sıkıştırma.
- mockUtils.ts         : Deneme sınavı net hesaplayıcıları.
- soundUtils.ts        : Bildirim ve sayaç ses efektleri.
- statusUtils.ts       : Ders çalışma ve onay durum göstergeleri.
- universityLogoStore.ts: Üniversite logoları veritabanı ve önbellek deposu.
- pdfReportParser.ts    : PDF sınav sonuç belgelerinden metin ayıklama ve öğrenci eşleştirici.
- markdownReportParser.ts: Markdown (.md) sınav sonuç belgelerinden tarayıcıda doğrudan sonuç ve konu ayıklayıcı.
================================================================================
