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

// ⚠️ These are FALLBACKS only — real data comes from RFQ
export const DEFAULT_META: QuotationMeta = {
    rfqNumber: '',
    title: '',
    territory: '',
    crmManager: '',
    stage: 'Negotiation',
    currency: 'BDT (base)',
    currencySymbol: '৳',
    clientType: 'new',
    country: '',
    exchangeRate: 1,
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

export const COUNTRIES = ['Bangladesh', 'Singapore', 'Europe', 'Middle East', 'UK'];

export const CURRENCIES = [
    { code: 'BDT', symbol: '৳', label: 'Taka (৳)' },
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'EUR', symbol: '€', label: 'EUR (€)' },
    { code: 'GBP', symbol: '£', label: 'GBP (£)' },
    { code: 'AED', symbol: 'AED', label: 'AED' },
];