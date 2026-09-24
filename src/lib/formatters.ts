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
  fallback: string = '—'
): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString(undefined, options);
  } catch {
    return fallback;
  }
}

export function formatDateTime(
  dateValue: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '—'
): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString(undefined, options);
  } catch {
    return fallback;
  }
}

export function formatTime(
  dateValue: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '—'
): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleTimeString(undefined, options);
  } catch {
    return fallback;
  }
}
