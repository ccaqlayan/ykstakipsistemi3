import * as pdfjsLib from 'pdfjs-dist';
import { UserAccount, YKSDataState, ParsedStudentRow, InstitutionalSubjectDetail } from '../types';

// Configure worker for pdfjs in Vite / Browser environment
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  } catch (e) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
    } catch {}
  }
}

export function normalizeTurkishText(str: string): string {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Strips out answer key sequences, TCPDF markers, and raw bar chart coordinates
 * to drastically save Gemini API tokens while preserving all exam tables & topic breakdowns.
 */
export function cleanRawPdfPageText(pageText: string): string {
  if (!pageText) return '';

  const lines = pageText.split('\n');
  const filteredLines: string[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Remove TCPDF watermark / footer
    if (/Powered by TCPDF/i.test(trimmed)) continue;

    // Remove Cevap Anahtarı lines (e.g. Cevap Anahtarı A BBDCBDEEEB...)
    if (/^Cevap\s*Anahtarı/i.test(trimmed)) continue;

    // Remove Soru No sequences (e.g. Soru No 1234567890...)
    if (/^Soru\s*No/i.test(trimmed)) continue;
    if (/^12345678901234567890/i.test(trimmed)) continue;

    // Remove raw student optical answer bubbling strings (e.g. "CDDeDEbE B dEA CdB ba D cCca CA EA", "CEBeEb BDBDEAaaADDbe...")
    if (/^(Matematik|Fen Bilimleri|TYT Fen|TYT Matematik|TYT Sosyal|TYT Türkçe|Edebiyat-Sosyal-1|Sosyal-2)\s+[a-zA-Z\s*#]{12,}$/i.test(trimmed)) {
      // It is an optical student bubbling line, strip out to save tokens
      continue;
    }

    // Remove chart axis labels / numbers line (e.g. "100 80 60 40 20 0 MAT2 GEO FİZ KİM BİY Öğr. Sınıf Kurum İlçe İl Genel")
    if (/^(100\s+80\s+60|0\s+20\s+40|MAT2\s+GEO|FİZ\s+KİM\s+BİY|TÜR\s+TAR1\s+COĞ1)/i.test(trimmed)) {
      continue;
    }
    if (/^Öğr\.\s+Sınıf\s+Kurum/i.test(trimmed)) {
      continue;
    }

    filteredLines.push(trimmed);
  }

  return filteredLines.join('\n');
}

/**
 * Extracts structured line-by-line text from every page of a PDF file using pdfjs-dist
 */
export async function extractTextFromPdfFile(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ pageIndex: number; text: string }>> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pagesText: Array<{ pageIndex: number; text: string }> = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    // Group items into visual lines based on vertical Y position
    const lineMap = new Map<number, Array<{ x: number; str: string }>>();

    items.forEach((item: any) => {
      if (!item.str || typeof item.str !== 'string') return;
      const rawY = item.transform ? item.transform[5] : 0;
      const rawX = item.transform ? item.transform[4] : 0;
      
      // Bucket Y within 4px to align text in the same row
      let matchedY: number | null = null;
      for (const yKey of lineMap.keys()) {
        if (Math.abs(yKey - rawY) <= 4) {
          matchedY = yKey;
          break;
        }
      }

      if (matchedY !== null) {
        lineMap.get(matchedY)!.push({ x: rawX, str: item.str });
      } else {
        lineMap.set(rawY, [{ x: rawX, str: item.str }]);
      }
    });

    // Sort lines top to bottom (Y descending in PDF coordinates)
    const sortedYKeys = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const rawLines: string[] = [];

    sortedYKeys.forEach(yKey => {
      const lineItems = lineMap.get(yKey)!;
      // Sort left to right on the same line
      lineItems.sort((a, b) => a.x - b.x);
      const lineString = lineItems.map(it => it.str).join(' ').trim();
      if (lineString) {
        rawLines.push(lineString);
      }
    });

    const fullPageText = rawLines.join('\n');
    const cleanedText = cleanRawPdfPageText(fullPageText);
    
    // Always include page text if it has student header information
    if (cleanedText.length > 20) {
      pagesText.push({ pageIndex: i, text: cleanedText });
    }

    if (onProgress) {
      onProgress(i, numPages);
    }
  }

  return pagesText;
}

/**
 * Intelligent automatic student matching by School Number, Name, Class
 */
export function matchStudentToSystem(
  fileStudentName: string,
  fileSchoolNumber: string,
  fileClassName: string,
  studentUsers: UserAccount[],
  studentsData?: Record<string, YKSDataState>
): { matchedStudentId: string | null; matchScore: number; matchReason: string } {
  const normFileName = normalizeTurkishText(fileStudentName);
  const cleanSchoolNo = (fileSchoolNumber || '').trim().replace(/^0+/, ''); // strip leading zeros

  // 1. High-Confidence: School Number match (when valid and not "0")
  if (cleanSchoolNo && cleanSchoolNo !== '0') {
    const directNoMatch = studentUsers.find(u => {
      const uNo = (u.schoolNumber || '').trim().replace(/^0+/, '');
      const profNo = (studentsData?.[u.id]?.profile?.schoolNumber || '').trim().replace(/^0+/, '');
      return (uNo && uNo === cleanSchoolNo) || (profNo && profNo === cleanSchoolNo);
    });

    if (directNoMatch) {
      return {
        matchedStudentId: directNoMatch.id,
        matchScore: 100,
        matchReason: `Okul No Eşleşti (#${fileSchoolNumber})`
      };
    }
  }

  // 2. Exact Name Match
  if (normFileName) {
    const exactNameMatch = studentUsers.find(u => {
      const uNorm = normalizeTurkishText(u.name);
      const profNorm = normalizeTurkishText(studentsData?.[u.id]?.profile?.name || '');
      return uNorm === normFileName || (profNorm && profNorm === normFileName);
    });

    if (exactNameMatch) {
      return {
        matchedStudentId: exactNameMatch.id,
        matchScore: 98,
        matchReason: 'Tam Ad Soyad Eşleşti'
      };
    }

    // 3. First + Last name token matching
    const fileTokens = normFileName.split(' ').filter(Boolean);
    let bestMatch: { user: UserAccount; score: number } | null = null;

    for (const u of studentUsers) {
      const uNorm = normalizeTurkishText(u.name);
      const uTokens = uNorm.split(' ').filter(Boolean);

      // Check if all file tokens exist in user name or vice versa
      if (fileTokens.length > 1 && uTokens.length > 1) {
        const firstMatches = fileTokens[0] === uTokens[0];
        const lastMatches = fileTokens[fileTokens.length - 1] === uTokens[uTokens.length - 1];

        if (firstMatches && lastMatches) {
          const score = 88;
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { user: u, score };
          }
        }
      }

      // Check partial substring inclusion
      if (uNorm.includes(normFileName) || normFileName.includes(uNorm)) {
        const score = 75;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { user: u, score };
        }
      }
    }

    if (bestMatch && bestMatch.score >= 75) {
      return {
        matchedStudentId: bestMatch.user.id,
        matchScore: bestMatch.score,
        matchReason: `Benzer İsim Eşleşti (%${bestMatch.score})`
      };
    }
  }

  return {
    matchedStudentId: null,
    matchScore: 0,
    matchReason: 'Eşleşen Öğrenci Bulunamadı (Yeni)'
  };
}
