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
 * Extracts student optical answer bubbling sequences and answer keys from raw PDF text.
 * Handles strings like "ADCcdACEEd aaEAddBdBEaBcdeEBCdBCBDBDCCC", where:
 * - Uppercase letters (A-E) = Correct answers
 * - Lowercase letters (a-e) = Wrong answers
 * - Spaces = Blank/empty questions
 */
export function extractOpticalDataFromPdfText(pageText: string): {
  opticalAnswers: Record<string, string>;
  answerKeys: Record<string, string>;
} {
  const opticalAnswers: Record<string, string> = {};
  const answerKeys: Record<string, string> = {};

  if (!pageText) return { opticalAnswers, answerKeys };

  const lines = pageText.split('\n');

  const subjectMatchers: Array<{
    keys: string[];
    namePattern: RegExp;
  }> = [
    {
      keys: ['Türkçe', 'TYT Türkçe'],
      namePattern: /(?:^|\b)(?:TYT\s*)?Türkçe\b/i
    },
    {
      keys: ['TYT Sosyal', 'Sosyal'],
      namePattern: /(?:^|\b)(?:TYT\s*)?Sosyal(?:\s*Bilimler)?(?:\s*-?\s*1)?\b/i
    },
    {
      keys: ['TYT Matematik', 'Matematik', 'Matematik-1', 'Matematik-2'],
      namePattern: /(?:^|\b)(?:TYT\s*|AYT\s*)?Matematik(?:-?[12])?\b/i
    },
    {
      keys: ['TYT Fen', 'Fen', 'Fen Bilimleri'],
      namePattern: /(?:^|\b)(?:TYT\s*|AYT\s*)?Fen(?:\s*Bilimleri)?\b/i
    },
    {
      keys: ['Edebiyat-Sosyal-1', 'Türk Dili ve Edebiyatı', 'Edebiyat'],
      namePattern: /(?:^|\b)(?:Edebiyat-Sosyal(?:-1)?|Türk Dili ve Edebiyatı|Edebiyat)\b/i
    },
    {
      keys: ['Sosyal-2'],
      namePattern: /(?:^|\b)Sosyal-2\b/i
    },
    {
      keys: ['Fizik', 'TYT Fizik'],
      namePattern: /(?:^|\b)(?:TYT\s*)?Fizik\b/i
    },
    {
      keys: ['Kimya', 'TYT Kimya'],
      namePattern: /(?:^|\b)(?:TYT\s*)?Kimya\b/i
    },
    {
      keys: ['Biyoloji', 'TYT Biyoloji'],
      namePattern: /(?:^|\b)(?:TYT\s*)?Biyoloji\b/i
    }
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. Standalone Cevap Anahtarı line
    if (/Cevap\s*Anahtarı/i.test(line)) {
      const keyMatch = line.match(/Cevap\s*Anahtarı\s*(?:[A-Z]\s*)?([A-E\s]{8,})/i);
      if (keyMatch) {
        const rawKey = keyMatch[1].trim();
        for (const matcher of subjectMatchers) {
          if (matcher.namePattern.test(line)) {
            matcher.keys.forEach(k => { answerKeys[k] = rawKey; });
          }
        }
      }
    }

    // 2. Optical student answer lines
    for (const matcher of subjectMatchers) {
      if (matcher.namePattern.test(line)) {
        // Strip out the subject name itself
        let lineAfterSubject = line.replace(matcher.namePattern, '').trim();

        // If line contains Cevap Anahtarı, extract answer key too
        if (/Cevap\s*Anahtarı/i.test(lineAfterSubject)) {
          const parts = lineAfterSubject.split(/Cevap\s*Anahtarı/i);
          lineAfterSubject = (parts[0] || '').trim();
          const keyCandidateMatch = (parts[1] || '').match(/(?:[A-Z]\s*)?([A-E\s]{6,})/i);
          if (keyCandidateMatch) {
            const rawKey = keyCandidateMatch[1].trim();
            matcher.keys.forEach(k => { answerKeys[k] = rawKey; });
          }
        }

        // Look for optical answer sequence in remaining string or next line
        const optMatch = lineAfterSubject.match(/[A-Ea-e\s*#?._-]{6,}/);
        if (optMatch && /[A-Ea-e]/.test(optMatch[0])) {
          const rawCandidate = optMatch[0];
          // Ensure it is primarily letters and spaces (not numbers/words)
          if (/^[A-Ea-e\s*#?._-]+$/.test(rawCandidate.trim())) {
            matcher.keys.forEach(k => { opticalAnswers[k] = rawCandidate; });
          }
        } else if (lines[i + 1]) {
          const nextLine = lines[i + 1].trim();
          if (/^[A-Ea-e\s*#?._-]{6,}$/.test(nextLine) && /[A-Ea-e]/.test(nextLine) && !/Cevap|Soru|Analiz|Konu|Puan|Snf|Kurum|Net|Doğru|Yanlış/i.test(nextLine)) {
            matcher.keys.forEach(k => {
              if (!opticalAnswers[k]) opticalAnswers[k] = nextLine;
            });
          }
        }
      }
    }
  }

  return { opticalAnswers, answerKeys };
}

/**
 * Strips out TCPDF markers and raw bar chart coordinates
 * while preserving exam tables, student optical answer lines, and topic breakdowns.
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

    // Remove raw numeric chart axis labels / coordinates
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
 * Extracts structured line-by-line text and optical answer sequences from every page of a PDF file using pdfjs-dist
 */
export async function extractTextFromPdfFile(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ pageIndex: number; text: string; opticalAnswers?: Record<string, string>; answerKeys?: Record<string, string> }>> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pagesText: Array<{ pageIndex: number; text: string; opticalAnswers?: Record<string, string>; answerKeys?: Record<string, string> }> = [];

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
    const { opticalAnswers, answerKeys } = extractOpticalDataFromPdfText(fullPageText);
    const cleanedText = cleanRawPdfPageText(fullPageText);
    
    // Always include page text if it has student header information
    if (cleanedText.length > 20) {
      pagesText.push({ pageIndex: i, text: cleanedText, opticalAnswers, answerKeys });
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
