// Full month names in Turkish
export const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

/**
 * Gets the week label for a given date in format "27 Temmuz - 2 Ağustos" or "20 - 26 Temmuz"
 */
export const getWeekLabel = (date: Date = new Date()): string => {
  const currentDay = date.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(date);
  monday.setDate(date.getDate() + distanceToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const mDay = monday.getDate();
  const mMonth = TURKISH_MONTHS[monday.getMonth()];
  const sDay = sunday.getDate();
  const sMonth = TURKISH_MONTHS[sunday.getMonth()];
  
  if (monday.getMonth() === sunday.getMonth()) {
    return `${mDay} - ${sDay} ${mMonth}`;
  }
  return `${mDay} ${mMonth} - ${sDay} ${sMonth}`;
};

/**
 * Normalizes any week label string (e.g. "20-26 tem", "20 - 26 Tem", "3 - 6 Ağu")
 * to standard full Turkish month names (e.g. "20 - 26 Temmuz", "3 - 6 Ağustos").
 */
export const normalizeWeekLabel = (label: string): string => {
  if (!label) return label;
  let normalized = label.trim();

  // Normalize month abbreviations (case insensitive)
  const monthReplacements: [RegExp, string][] = [
    [/\bTemmuz\b/gi, 'Temmuz'],
    [/\bTem\b/gi, 'Temmuz'],
    [/\bAğustos\b/gi, 'Ağustos'],
    [/\bAğu\b/gi, 'Ağustos'],
    [/\bOcak\b/gi, 'Ocak'],
    [/\bOca\b/gi, 'Ocak'],
    [/\bŞubat\b/gi, 'Şubat'],
    [/\bŞub\b/gi, 'Şubat'],
    [/\bMart\b/gi, 'Mart'],
    [/\bMar\b/gi, 'Mart'],
    [/\bNisan\b/gi, 'Nisan'],
    [/\bNis\b/gi, 'Nisan'],
    [/\bMayıs\b/gi, 'Mayıs'],
    [/\bMay\b/gi, 'Mayıs'],
    [/\bHaziran\b/gi, 'Haziran'],
    [/\bHaz\b/gi, 'Haziran'],
    [/\bEylül\b/gi, 'Eylül'],
    [/\bEyl\b/gi, 'Eylül'],
    [/\bEkim\b/gi, 'Ekim'],
    [/\bEki\b/gi, 'Ekim'],
    [/\bKasım\b/gi, 'Kasım'],
    [/\bKas\b/gi, 'Kasım'],
    [/\bAralık\b/gi, 'Aralık'],
    [/\bAra\b/gi, 'Aralık']
  ];

  for (const [regex, replacement] of monthReplacements) {
    normalized = normalized.replace(regex, replacement);
  }

  // Standardize spacing around hyphens e.g. "20-26" -> "20 - 26"
  normalized = normalized.replace(/(\d+)\s*-\s*(\d+)/, '$1 - $2');

  return normalized;
};

const MONTH_INDEX_MAP: Record<string, number> = {
  'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
  'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11,
  'oca': 0, 'şub': 1, 'mar': 2, 'nis': 3, 'may': 4, 'haz': 5,
  'tem': 6, 'ağu': 7, 'eyl': 8, 'eki': 9, 'kas': 10, 'ara': 11
};

/**
 * Normalizes a week label by removing optional year suffix, month short names,
 * and hyphen spacing for reliable comparison across views.
 */
export const cleanWeekLabelForComparison = (label?: string): string => {
  if (!label) return '';
  const norm = normalizeWeekLabel(label);
  // Strip trailing 4-digit year if present (e.g., "20 - 26 Temmuz 2026" -> "20 - 26 Temmuz")
  return norm.replace(/\s*20\d\d\s*$/, '').trim().toLowerCase();
};

export const isSameWeekLabel = (labelA?: string, labelB?: string): boolean => {
  if (!labelA || !labelB) return false;
  return cleanWeekLabelForComparison(labelA) === cleanWeekLabelForComparison(labelB);
};

/**
 * Parses the start timestamp of a week from its week label (e.g., "20 - 26 Temmuz", "3 - 6 Ağustos").
 * Used for chronological sorting.
 */
export const parseWeekStartTimestamp = (weekLabel: string): number => {
  if (!weekLabel) return 0;
  const clean = normalizeWeekLabel(weekLabel).toLowerCase();

  // Extract start day (first number in string)
  const dayMatch = clean.match(/^(\d+)/);
  if (!dayMatch) return 0;
  const day = parseInt(dayMatch[1], 10);

  // Extract year if present
  const yearMatch = clean.match(/\b(20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;

  // Find the first month name that appears
  let monthIndex = -1;
  let firstPos = Infinity;

  for (const [monthKey, idx] of Object.entries(MONTH_INDEX_MAP)) {
    const pos = clean.indexOf(monthKey);
    if (pos !== -1 && pos < firstPos) {
      firstPos = pos;
      monthIndex = idx;
    }
  }

  if (monthIndex === -1) return 0;

  return new Date(year, monthIndex, day, 12, 0, 0, 0).getTime();
};

/**
 * Returns Monday Date object for the week containing the given date.
 * Set to 12:00:00 to prevent timezone/DST boundary shifts.
 */
export const getMonday = (date: Date = new Date()): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const dayIndex = d.getDay();
  const diff = dayIndex === 0 ? -6 : 1 - dayIndex;
  d.setDate(d.getDate() + diff);
  return d;
};

/**
 * Formats a Date object to YYYY-MM-DD ISO string using local timezone.
 */
export const getIsoDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns 7 dates (Monday through Sunday) for a given Monday Date.
 */
export const getWeekDays = (mondayDate: Date) => {
  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'] as const;
  const shortMonths = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  return days.map((dayName, index) => {
    const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + index, 12, 0, 0, 0);
    const isoDate = getIsoDateString(d);
    const displayDate = `${d.getDate()} ${shortMonths[d.getMonth()]}`;
    return {
      dayName,
      date: d,
      isoDate,
      displayDate
    };
  });
};

/**
 * Formats week label with optional year, e.g. "11 - 17 Ağustos 2026"
 */
export const formatWeekLabelWithYear = (mondayDate: Date): string => {
  const sunday = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + 6, 12, 0, 0, 0);

  const mDay = mondayDate.getDate();
  const mMonth = TURKISH_MONTHS[mondayDate.getMonth()];
  const sDay = sunday.getDate();
  const sMonth = TURKISH_MONTHS[sunday.getMonth()];
  const year = mondayDate.getFullYear();

  if (mondayDate.getMonth() === sunday.getMonth()) {
    return `${mDay} - ${sDay} ${mMonth} ${year}`;
  }
  return `${mDay} ${mMonth} - ${sDay} ${sMonth} ${year}`;
};

/**
 * Shifts Monday date by N weeks.
 */
export const addWeeks = (mondayDate: Date, weeks: number): Date => {
  const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + weeks * 7, 12, 0, 0, 0);
  return d;
};

