# Workspace Rules for Antigravity AI Agent

## Project File Index & Direct Navigation
- Before searching or reading full component files across the repository, **ALWAYS consult `readme.txt`** located at the root of the workspace.
- `readme.txt` contains a comprehensive Table of Contents mapping every feature, tab, modal, and API endpoint to its exact file location in `src/components/`, `src/server/routes/`, and `src/services/`.
- Target the specific subcomponent file directly rather than loading monolithic parent orchestrators when making edits.

## Git Commit Formatting Rule
- Whenever creating a Git commit and publishing to GitHub, **ALWAYS prefix the commit message with the version number and write the description in TURKISH** in the format `vX.Y.Z: <Türkçe açıklama>` (e.g. `v1.7.9: Sistem güncelleme ekranındaki otomatik kaydırma düzeltildi`).
- Commit açıklamaları her zaman anlaşılır ve net bir Türkçe ile yazılmalıdır.

## Versiyon Numaralandırma & Artış Kuralı (vX.Y.Z)
- Versiyon formatı her zaman `vX.Y.Z` (Örn: `v1.8.9`) şeklindedir:
  1. **En Sağdaki Sayı (Z - Patch):** Her geliştirmede ve kod değişikliğinde `1` artar (`v1.8.9` -> `v1.8.10` -> `...` -> `v1.8.99`).
  2. **Ortadaki Sayı (Y - Minor):** En sağdaki `Z` sayısı `99`'a ulaştıktan sonraki ilk artışta `Z` sıfırlanır (`0`) ve ortadaki `Y` sayısı `1` artar (`v1.8.99` -> `v1.9.0`).
  3. **En Soldaki Sayı (X - Major):** Ortadaki `Y` sayısı `9` ve `Z` sayısı `99` olduktan sonraki ilk artışta `Y` ve `Z` sıfırlanır (`0.0`) ve en soldaki `X` sayısı `1` artar (`v1.9.99` -> `v2.0.0`).
- Her kod değişikliğinde `src/version.ts` ve `package.json` dosyalarındaki versiyon numarası bu kurala göre güncellenmeli ve GitHub'a commit atılmalıdır.

## Yerel Geliştirme Sunucusu (Localhost) Başlatma Kuralı
- **Windows PowerShell İzin Kısıtı (`PSSecurityException`):** Windows ortamında PowerShell varsayılan olarak `.ps1` betiklerini (`npm.ps1`) engeller. Bu nedenle doğrudan `npm run dev` çalıştırmak yerine her zaman `cmd /c npx tsx server.ts` veya `powershell -ExecutionPolicy Bypass` ile komut koşturulmalıdır.
- **`tsx watch` vs Arka Plan Süreçleri:** Arka plan (daemon/async) süreçlerinde `tsx watch server.ts` komutu terminal TTY ve watcher beklemesi nedeniyle arka planda asılı kalabilir. Sunucuyu arka planda güvenle ayağa kaldırmak için doğrudan `cmd /c npx tsx server.ts` çalıştırılmalıdır.
- **Vite & Firestore Başlatma Süresi:** Sunucu başladığında Vite middleware ve Firestore servislerinin derleme/bağlantı kurması yaklaşık 5-10 saniye sürer (`http://0.0.0.0:3000`). Doğrudan tarayıcı/bağlantı kontrolü yapılmadan önce sunucunun tamamen ayağa kalktığı loglardan teyit edilmelidir.

eğer promptum ile bir dosyada değişikliği yaptıysan mutlaka versiyon sayısını bu kurala göre arttırıp github a commit yap, açıklamaları her zaman Türkçe yaz.