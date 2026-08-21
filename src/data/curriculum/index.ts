import { GRADE9_CURRICULUM } from './grade9';
import { GRADE10_CURRICULUM } from './grade10';
import { GRADE11_CURRICULUM } from './grade11';
import { YKS_CURRICULUM_TOPICS } from '../initialData';
import { GradeLevel } from '../../utils/gradeUtils';

export * from './grade9';
export * from './grade10';
export * from './grade11';
export * from './recommendationsData';

/**
 * Kademeye ve alan bilgisine göre doğru konu ağacını döner.
 */
export function getCurriculumForGrade(grade: GradeLevel): Record<string, string[]> {
  switch (grade) {
    case '9':
      return GRADE9_CURRICULUM;
    case '10':
      return GRADE10_CURRICULUM;
    case '11':
      return GRADE11_CURRICULUM;
    case '12':
    case 'mezun':
    default:
      return YKS_CURRICULUM_TOPICS;
  }
}

/**
 * Ders kategorisine ve sınıf kademesine göre müfredat anahtarlarını döner.
 */
export function getCategoryCurriculumKeysForGrade(
  categoryId: string,
  grade: GradeLevel,
  defaultKeys: string[]
): string[] {
  if (grade === '9') {
    switch (categoryId) {
      case 'matematik':
      case 'geometri':
        return ['MATEMATİK'];
      case 'fizik':
        return ['FİZİK'];
      case 'kimya':
        return ['KİMYA'];
      case 'biyoloji':
        return ['BİYOLOJİ'];
      case 'turkce_edebiyat':
        return ['TÜRK DİLİ VE EDEBİYATI'];
      case 'tarih':
        return ['TARİH'];
      case 'cografya':
        return ['COĞRAFYA'];
      case 'felsefe_din':
        return ['DİN KÜLTÜRÜ'];
      default:
        return defaultKeys;
    }
  }

  if (grade === '10') {
    switch (categoryId) {
      case 'matematik':
      case 'geometri':
        return ['MATEMATİK'];
      case 'fizik':
        return ['FİZİK'];
      case 'kimya':
        return ['KİMYA'];
      case 'biyoloji':
        return ['BİYOLOJİ'];
      case 'turkce_edebiyat':
        return ['TÜRK DİLİ VE EDEBİYATI'];
      case 'tarih':
        return ['TARİH'];
      case 'cografya':
        return ['COĞRAFYA'];
      case 'felsefe_din':
        return ['FELSEFE'];
      default:
        return defaultKeys;
    }
  }

  if (grade === '11') {
    switch (categoryId) {
      case 'matematik':
      case 'geometri':
        return ['11. Sınıf Matematik'];
      case 'fizik':
        return ['11. Sınıf Fizik'];
      case 'kimya':
        return ['11. Sınıf Kimya'];
      case 'biyoloji':
        return ['11. Sınıf Biyoloji'];
      case 'turkce_edebiyat':
        return ['11. Sınıf Türk Dili ve Edebiyatı'];
      case 'tarih':
        return ['11. Sınıf Tarih'];
      case 'cografya':
        return ['11. Sınıf Coğrafya'];
      case 'felsefe_din':
        return ['11. Sınıf Felsefe'];
      default:
        return defaultKeys;
    }
  }

  return defaultKeys;
}
