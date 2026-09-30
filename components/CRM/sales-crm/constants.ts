// components/CRM/sales-crm/constants.ts
import type { ForecastStage, ForecastMonth } from '@/services/salesCrm.service';

export const MONTHS: ForecastMonth[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const STAGES: { key: ForecastStage; label: string; color: string }[] = [
  { key: 'query',       label: 'Query',       color: 'border-slate-200 bg-slate-50' },
  { key: 'rfq',         label: 'RFQ',         color: 'border-amber-200 bg-amber-50' },
  { key: 'quotation',   label: 'Quotation',   color: 'border-violet-200 bg-violet-50' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-orange-200 bg-orange-50' },
  { key: 'won',         label: 'Won',         color: 'border-emerald-200 bg-emerald-50' },
  { key: 'lost',        label: 'Lost',        color: 'border-rose-200 bg-rose-50' },
];

// ============================================================
// REGIONS
// ============================================================
export const REGIONS = [
  'All Regions',
  'Bangladesh',
  'Singapore',
  'India',
  'Pakistan',
  'Hungary',
  'Nigeria',
  'United Kingdom',
  'United States',
  'Eurozone',
  'South Africa',
];

// ============================================================
// TERRITORIES BY REGION
// ============================================================
export const TERRITORIES_BY_REGION: Record<string, string[]> = {
  'All Regions': [
    'All Territories',
    'Dhaka', 'Chattogram',
    'Singapore City',
    'Mumbai', 'Delhi',
    'Karachi', 'Lahore',
    'Budapest',
    'Lagos',
    'London',
    'New York',
    'Dublin',
    'Johannesburg',
  ],
  Bangladesh: [
    'All Territories',
    'Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Sylhet',
    'Barishal', 'Rangpur', 'Mymensingh',
  ],
  Singapore: [
    'All Territories',
    'Singapore City', 'Jurong East', 'Woodlands', 'Tampines', 'Changi',
  ],
  India: [
    'All Territories',
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
  ],
  Pakistan: [
    'All Territories',
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  ],
  Hungary: [
    'All Territories',
    'Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs',
  ],
  Nigeria: [
    'All Territories',
    'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt',
  ],
  'United Kingdom': [
    'All Territories',
    'London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Leeds',
  ],
  'United States': [
    'All Territories',
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Boston',
  ],
  Eurozone: [
    'All Territories',
    'Dublin', 'Berlin', 'Paris', 'Madrid', 'Rome', 'Amsterdam',
  ],
  'South Africa': [
    'All Territories',
    'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth',
  ],
};

// ============================================================
// CURRENCIES
//
// ⭐ rate = how much of this currency 1 BDT is worth.
//    (i.e. "1 BDT = rate × this-currency")
//    Matches Google's "1 Bangladeshi Taka equals ___"
//
// Rates from Sept 30, 2026 (Google Finance):
// ============================================================
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;    // 1 BDT = rate units of this currency
}

export const CURRENCIES: Record<string, Currency> = {
  BDT: { code: 'BDT', symbol: '৳',  name: 'Bangladeshi Taka', rate: 1 },
  USD: { code: 'USD', symbol: '$',  name: 'US Dollar',         rate: 1 / 123.06 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar',  rate: 0.010 },
  INR: { code: 'INR', symbol: '₹',  name: 'Indian Rupee',      rate: 0.78 },
  PKR: { code: 'PKR', symbol: '₨',  name: 'Pakistani Rupee',   rate: 2.25 },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint',  rate: 2.63 },
  NGN: { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira',    rate: 10.79 },
  GBP: { code: 'GBP', symbol: '£',  name: 'British Pound',     rate: 0.0061 },
  EUR: { code: 'EUR', symbol: '€',  name: 'Euro',              rate: 0.0072 },
  ZAR: { code: 'ZAR', symbol: 'R',  name: 'South African Rand', rate: 0.13 },
};

// ============================================================
// REGION → DEFAULT CURRENCY
// ============================================================
export const REGION_DEFAULT_CURRENCY: Record<string, string> = {
  'All Regions': 'BDT',
  Bangladesh: 'BDT',
  Singapore: 'SGD',
  India: 'INR',
  Pakistan: 'PKR',
  Hungary: 'HUF',
  Nigeria: 'NGN',
  'United Kingdom': 'GBP',
  'United States': 'USD',
  Eurozone: 'EUR',
  'South Africa': 'ZAR',
};

// ============================================================
// TERRITORY → DEFAULT CURRENCY
// ============================================================
export const TERRITORY_DEFAULT_CURRENCY: Record<string, string> = {
  Dhaka: 'BDT',
  Chattogram: 'BDT',
  'Singapore City': 'SGD',
  Mumbai: 'INR',
  Delhi: 'INR',
  Karachi: 'PKR',
  Lahore: 'PKR',
  Budapest: 'HUF',
  Lagos: 'NGN',
  London: 'GBP',
  Manchester: 'GBP',
  'New York': 'USD',
  'Los Angeles': 'USD',
  Dublin: 'EUR',
  Johannesburg: 'ZAR',
};

// ============================================================
// HELPERS
// ============================================================

/** Default rate for a currency — always valid */
export function getDefaultRate(currencyCode: string): number {
  const c = CURRENCIES[currencyCode];
  return c && typeof c.rate === 'number' && c.rate > 0 ? c.rate : 1;
}

/** Effective rate — falls back to default if custom is 0/NaN/undefined */
export function effectiveRate(
  currencyCode: string,
  customRate?: number
): number {
  if (
    typeof customRate === 'number' &&
    !Number.isNaN(customRate) &&
    customRate > 0
  ) {
    return customRate;
  }
  return getDefaultRate(currencyCode);
}

/** Convert base (BDT) → target currency. Multiply by the rate. */
export function convertFromBase(
  baseAmount: number,
  currencyCode: string,
  customRate?: number
): number {
  const rate = effectiveRate(currencyCode, customRate);
  return (baseAmount || 0) * rate;
}

/** Format a base (BDT) amount in the target currency */
export function formatMoney(
  baseAmount: number,
  currencyCode: string,
  opts: { compact?: boolean; rate?: number } = {}
): string {
  const c = CURRENCIES[currencyCode] || CURRENCIES.BDT;
  const rate = effectiveRate(currencyCode, opts.rate);
  const amount = (baseAmount || 0) * rate;

  if (opts.compact) {
    if (amount >= 1_000_000_000)
      return `${c.symbol}${(amount / 1_000_000_000).toFixed(2)}B`;
    if (amount >= 1_000_000)
      return `${c.symbol}${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000)
      return `${c.symbol}${(amount / 1_000).toFixed(1)}k`;
    return `${c.symbol}${amount.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    c.symbol +
    amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
  );
}

export const fmtFull = (
  baseAmount: number,
  currencyCode = 'BDT',
  rate?: number
) => formatMoney(baseAmount, currencyCode, { rate });

export const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export const inputCls =
  'w-full rounded-lg border border-[#E2DBD1] bg-[#FDFBF7] px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126] focus:border-[#A06126]';

export const selectCls = inputCls + ' cursor-pointer';