import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Numeric = number | string | null | undefined;
const FALLBACK = '—';
const localeCode = (locale = 'fr') => locale === 'ar' ? 'ar-MA' : 'fr-FR';
const numeric = (value: Numeric) => value === '' || value == null || !Number.isFinite(Number(value)) ? null : Number(value);
const formatted = (value: Numeric, locale: string, options: Intl.NumberFormatOptions) => {
  const number = numeric(value);
  return number == null ? FALLBACK : new Intl.NumberFormat(localeCode(locale), options).format(number);
};

export function formatInteger(value: Numeric, locale = 'fr') {
  return formatted(value, locale, { maximumFractionDigits: 0 });
}

export function formatNumber(value: Numeric, locale = 'fr', maximumFractionDigits = 1) {
  return formatted(value, locale, { minimumFractionDigits: 0, maximumFractionDigits });
}

export function formatCurrency(value: Numeric, locale = 'fr') {
  const number = formatted(value, locale, { maximumFractionDigits: 0 });
  if (number === FALLBACK) return FALLBACK;
  return locale === 'ar' ? `${number} درهم` : `${number} MAD`;
}

export function formatArea(value: Numeric, locale = 'fr') {
  const number = formatNumber(value, locale, 1);
  return number === FALLBACK ? FALLBACK : `${number} m²`;
}

export function formatPricePerSquareMeter(value: Numeric, locale = 'fr') {
  const number = formatted(value, locale, { maximumFractionDigits: 0 });
  if (number === FALLBACK) return FALLBACK;
  return locale === 'ar' ? `${number} درهم/م²` : `${number} MAD/m²`;
}

export function formatPercentage(value: Numeric, locale = 'fr', maximumFractionDigits = 1) {
  const number = formatNumber(value, locale, maximumFractionDigits);
  return number === FALLBACK ? FALLBACK : `${number} %`;
}

export function formatDate(value: Date | string | number | null | undefined, locale = 'fr', includeTime = false) {
  if (value == null) return FALLBACK;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return FALLBACK;
  return new Intl.DateTimeFormat(localeCode(locale), includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'long' }).format(date);
}

export function formatCompactNumber(value: Numeric, locale = 'fr') {
  return formatted(value, locale, { notation: 'compact', maximumFractionDigits: 1 });
}
