import { format, parseISO } from 'date-fns';

/** Format a number as currency. Defaults to USD; change here to localize. */
export function formatCurrency(value, { compact = false, currency = 'USD' } = {}) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(n);
}

/** Plain number with thousands separators. */
export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

/** Format an ISO date string as e.g. "Jul 15, 2026". */
export function formatDate(value) {
  if (!value) return '';
  try {
    const d = typeof value === 'string' ? parseISO(value) : value;
    return format(d, 'MMM d, yyyy');
  } catch {
    return String(value);
  }
}

/** Today's date as YYYY-MM-DD (for date inputs). */
export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Percentage with one decimal. */
export function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}
