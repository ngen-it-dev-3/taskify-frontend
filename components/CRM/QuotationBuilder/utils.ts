// components/CRM/QuotationBuilder/utils.ts
import type { QuotationMeta } from './types';

/**
 * Convert an amount from BASE currency to DISPLAY currency.
 *   Base amount ÷ exchange rate = Display amount
 *
 * Example:
 *   baseAmount = 15,000 BDT
 *   exchangeRate = 150 (1 EUR = 150 BDT)
 *   display = 15000 / 150 = 100 EUR
 */
export function convertToDisplay(
  baseAmount: number,
  meta: QuotationMeta
): number {
  if (!meta) return baseAmount;
  const rate = meta.exchangeRate && meta.exchangeRate > 0 ? meta.exchangeRate : 1;
  if (!meta.currency || meta.currency === meta.baseCurrency) return baseAmount;
  return baseAmount / rate;
}

/**
 * Convert an amount from DISPLAY currency back to BASE currency.
 *   Display amount × exchange rate = Base amount
 */
export function convertToBase(
  displayAmount: number,
  meta: QuotationMeta
): number {
  if (!meta) return displayAmount;
  const rate = meta.exchangeRate && meta.exchangeRate > 0 ? meta.exchangeRate : 1;
  if (!meta.currency || meta.currency === meta.baseCurrency) return displayAmount;
  return displayAmount * rate;
}

/**
 * Format any amount with a symbol + thousands separator.
 */
export function fmtAmount(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

/**
 * Shortcut: BASE amount → formatted string in DISPLAY currency.
 */
export function fmtDisplay(baseAmount: number, meta: QuotationMeta): string {
  return fmtAmount(convertToDisplay(baseAmount, meta), meta?.currencySymbol || '');
}

/**
 * Shortcut: BASE amount → formatted string in BASE currency.
 */
export function fmtBase(baseAmount: number, meta: QuotationMeta): string {
  return fmtAmount(baseAmount, meta?.baseCurrencySymbol || '');
}