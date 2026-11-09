// components/CRM/quotation-builder/constants.ts
import type {
    QuotationLineItem,
    QuotationMeta,
    QuotationRates,
} from './types';

export const DEFAULT_RATES: QuotationRates = {
    principalDiscountPct: 0,
    officePct: 1.5,
    profitPct: 8.5,
    othersPct: 5,
    taxPct: 0,
};

export const DEFAULT_META: QuotationMeta = {
    rfqNumber: '',
    title: '',
    territory: '',
    crmManager: '',
    stage: 'Negotiation',
    // ⭐ Currency fields
    currency: 'BDT',
    currencySymbol: '৳',
    baseCurrency: 'BDT',
    baseCurrencySymbol: '৳',
    exchangeRate: 1,
    // Other fields
    clientType: 'new',
    country: '',
    vatEnabled: true,
    discountEnabled: true,
    client: {
        company: '',
        contactName: '',
        designation: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        zipCode: '',
    },
    pqNumber: '',
    pqrNumber: '',
};

// Fixed rows (auto-added to every new quotation)
export const FIXED_LINES: QuotationLineItem[] = [
    {
        id: 'fixed-remittance',
        sl: '-',
        name: 'Remittance',
        qty: 1,
        principalCost: 80,
        weightKg: 1,
        discountPct: 5,
        type: 'fixed',
    },
    {
        id: 'fixed-packing',
        sl: '-',
        name: 'Packing Charge',
        qty: 1,
        principalCost: 0,
        weightKg: 1,
        discountPct: 0,
        type: 'fixed',
    },
    {
        id: 'fixed-customs',
        sl: '-',
        name: 'Customs / C&F',
        qty: 1,
        principalCost: 0,
        weightKg: 1,
        discountPct: 0,
        type: 'fixed',
    },
    {
        id: 'fixed-freight',
        sl: '-',
        name: 'Freight / Logistics',
        qty: 1,
        principalCost: 0,
        weightKg: 1,
        discountPct: 0,
        type: 'fixed',
    },
];

export const DEFAULT_LINES: QuotationLineItem[] = [...FIXED_LINES];

export const DEFAULT_TERMS = [
    {
        label: 'Validity',
        value:
            'Valid till 7 days from PQ. Offer may change on the bank forex rate or stock availability.',
    },
    {
        label: 'Payment',
        value:
            '100% payment through EFTN/WT & hit in the NGEN IT Limited account within 30 days of Delivery.',
    },
    {
        label: 'Product Mode',
        value:
            'Product may take a certain time for Payment, Shipment, Delivery. In exception it may differ.',
    },
    {
        label: 'Delivery',
        value:
            '4 business weeks upon receiving of WO. Extended time may require in any disaster issues.',
    },
    {
        label: 'Warranty',
        value: 'Principal Standard Warranty for respective product.',
    },
];

export const AUTHORIZED_BRANDS = [
    'Acronis',
    'Balluff',
    'EViews',
    'Radmin',
    'Axis Communications',
    'Fortinet',
];

// ⭐ Currency Interface
export interface Currency {
    code: string;
    symbol: string;
    label: string;
    country: string;
    rateToBDT: number;
}

// ⭐ Strictly the 5 requested countries & currencies
export const CURRENCIES: Currency[] = [
    { code: 'USD', symbol: '$', label: 'Singapore Dollar ($)', country: 'Singapore', rateToBDT: 124.25 },
    { code: 'GBP', symbol: '£', label: 'Pound (£)', country: 'United Kingdom', rateToBDT: 167.37 },
    { code: 'BDT', symbol: '৳', label: 'BDT (৳)', country: 'Bangladesh', rateToBDT: 1.00 },
    { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham (د.إ)', country: 'Middle East', rateToBDT: 33.83 },
    { code: 'EUR', symbol: '€', label: 'Euro (€)', country: 'Portugal', rateToBDT: 139.59 },
];

export const getCurrency = (code: string) => {
    const found = CURRENCIES.find(c => c.code === code);
    if (found) return found;

    // Safe fallback to BDT
    const fallback = CURRENCIES.find(c => c.code === 'BDT');
    if (!fallback) {
        return { code: 'BDT', symbol: '৳', label: 'BDT', country: 'Bangladesh', rateToBDT: 1 };
    }
    return fallback;
};

export const COUNTRIES = Array.from(new Set(CURRENCIES.map((c) => c.country))).sort();