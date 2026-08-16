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
 * to drastically save Gemini API tokens.
 */
export function cleanRawPdfPageText(pageText: string): string {
  if (!pageText) return '';

  return pageText
    // Remove TCPDF footer
    .replace(/Powered by TCPDF[^\n]*/gi, '')
    // Remove Cevap Anahtarı lines (e.g. Cevap Anahtarı A BBDCBDEEEB...)
    .replace(/Cevap\s*Anahtarı[^\n]*/gi, '')
    // Remove Soru No sequences (e.g. Soru No 12345678901234567890...)
    .replace(/Soru\s*No[^\n]*/gi, '')
    .replace(/12345678901234567890[0-9]*/g, '')
    // Remove repetitive optik string sequences like "eeDCBA...", "dbBdeb...", "c***C***..."
    .replace(/^[a-zA-Z\s*#]{15,}$/gm, '')
    // Clean excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts text from every page of a PDF file using pdfjs-dist
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
    const pageStrings = textContent.items
      .map((item: any) => (item.str !== undefined ? item.str : ''))
      .join(' ');

    const cleanedText = cleanRawPdfPageText(pageStrings);
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
