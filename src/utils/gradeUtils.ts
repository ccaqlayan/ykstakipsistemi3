export type GradeLevel = '9' | '10' | '11' | '12' | 'mezun';

/**
 * Sınıf isminden (Örn: "9-A", "10-B SAY", "11-C EA", "12-A", "Mezun") kademe seviyesini çözer.
 */
export function getGradeLevel(className?: string): GradeLevel {
  if (!className || typeof className !== 'string') return '12';
  const clean = className.trim().toUpperCase();
  
  if (clean.includes('MEZUN')) return 'mezun';
  if (clean.startsWith('9')) return '9';
  if (clean.startsWith('10')) return '10';
  if (clean.startsWith('11')) return '11';
  if (clean.startsWith('12')) return '12';
  
  return '12';
}

/**
 * Öğrencinin ara sınıf (9, 10 veya 11) olup olmadığını döner.
 */
export function isIntermediateGrade(grade: GradeLevel): boolean {
  return grade === '9' || grade === '10' || grade === '11';
}

/**
 * Öğrencinin erken lise (9 veya 10) olup olmadığını döner.
 */
export function isEarlyHighSchool(grade: GradeLevel): boolean {
  return grade === '9' || grade === '10';
}

/**
 * Kademenin Türkçe okunabilir adını döner.
 */
export function getGradeDisplayName(grade: GradeLevel): string {
  switch (grade) {
    case '9': return '9. Sınıf (Lise 1)';
    case '10': return '10. Sınıf (Lise 2)';
    case '11': return '11. Sınıf (Lise 3)';
    case '12': return '12. Sınıf (YKS)';
    case 'mezun': return 'Mezun (YKS)';
    default: return 'YKS Hazırlık';
  }
}

/**
 * Kademeye göre tahmini YKS sınav yılını hesaplar.
 */
export function getGradeYksTargetYear(grade: GradeLevel): number {
  const currentYear = new Date().getFullYear();
  // Yaz ayları sonrası yeni eğitim yılı kabulü
  const isAfterSummer = new Date().getMonth() >= 7; // Ağustos ve sonrası
  const baseYear = isAfterSummer ? currentYear + 1 : currentYear;

  switch (grade) {
    case '9': return baseYear + 3; // 9. sınıf -> 3 yıl sonra
    case '10': return baseYear + 2; // 10. sınıf -> 2 yıl sonra
    case '11': return baseYear + 1; // 11. sınıf -> 1 yıl sonra
    case '12':
    case 'mezun':
    default:
      return baseYear;
  }
}
