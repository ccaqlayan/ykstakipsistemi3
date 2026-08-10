export const sanitizeNetInput = (rawVal: string): string => {
  if (rawVal === '' || rawVal === null || rawVal === undefined) return '';
  let cleaned = String(rawVal).replace(/\./g, ',');
  cleaned = cleaned.replace(/[^0-9,-]/g, '');

  if (cleaned.indexOf('-') > 0) {
    cleaned = cleaned.charAt(0) + cleaned.slice(1).replace(/-/g, '');
  }

  const parts = cleaned.split(',');
  if (parts.length > 2) {
    cleaned = parts[0] + ',' + parts.slice(1).join('');
  }

  if (/^-?0+[1-9]/.test(cleaned)) {
    cleaned = cleaned.replace(/^(-?)0+([1-9])/, '$1$2');
  } else if (/^-?00+$/.test(cleaned)) {
    cleaned = cleaned.replace(/^(-?)0+$/, '$10');
  } else if (/^-?00+,/.test(cleaned)) {
    cleaned = cleaned.replace(/^(-?)0+,/, '$10,');
  }

  return cleaned;
};

export const parseNetVal = (val: number | string | undefined | null): number => {
  if (val === '' || val === undefined || val === null) return 0;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) ? 0 : num;
};
