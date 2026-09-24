/**
 * WOWTEK OMS — Defensive Formatting Helpers
 * Guarantees zero runtime crashes from null/undefined/invalid values
 */

export function formatCurrency(
  amount: number | null | undefined,
  symbol: string = 'Rs.',
  fallback: string = '0',
  options?: Intl.NumberFormatOptions
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return `${symbol} ${fallback}`;
  }
  return `${symbol} ${Number(amount).toLocaleString('en-LK', options)}`;
}

export function formatNumber(
  value: number | null | undefined,
  fallback: string = '0',
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return fallback;
  }
  return Number(value).toLocaleString('en-LK', options);
}

export function formatDate(
  dateValue: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '-'
): string {
  if (!dateValue) return fallback;
  try {
    let val = dateValue;
    if (typeof val === 'string') {
      val = val.trim();
      if (!val) return fallback;
      if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(val)) {
        val = val.replace(' ', 'T');
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString(undefined, options);
  } catch {
    return fallback;
  }
}

export function formatDateTime(
  dateValue: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '-'
): string {
  if (!dateValue) return fallback;
  try {
    let val = dateValue;
    if (typeof val === 'string') {
      val = val.trim();
      if (!val) return fallback;
      if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(val)) {
        val = val.replace(' ', 'T');
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString(undefined, options);
  } catch {
    return fallback;
  }
}

export function formatTime(
  dateValue: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '-'
): string {
  if (!dateValue) return fallback;
  try {
    let val = dateValue;
    if (typeof val === 'string') {
      val = val.trim();
      if (!val) return fallback;
      if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(val)) {
        val = val.replace(' ', 'T');
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleTimeString(undefined, options);
  } catch {
    return fallback;
  }
}

/**
 * Safely executes .replace on a string or returns fallback
 */
export function safeReplace(
  str: string | null | undefined,
  pattern: string | RegExp,
  replacement: string
): string {
  if (typeof str !== 'string') return '';
  return str.replace(pattern, replacement);
}
