'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import toast from 'react-hot-toast';

import Header from './Header';
import QuoteInfoCard from './QuoteInfoCard';
import ThresholdBanner from './ThresholdBanner';

import QuotationTab from './tabs/QuotationTab';
import CostOfGoodTab from './tabs/CostOfGoodTab';
import SourceTab from './tabs/SourceTab';
import QuotesListTab from './tabs/QuotesListTab';
import DraftsListTab from './tabs/DraftsListTab';

import {
    DEFAULT_META,
    DEFAULT_RATES,
    DEFAULT_TERMS,
    FIXED_LINES,
    CURRENCIES,
} from './constants';

import type {
    QuotationLineItem,
    QuotationMeta,
    QuotationRates,
    QuotationTabKey,
    TopTabKey,
} from './types';

import { RfqApi } from '@/services/rfq.service';
import { useQuotation } from '@/hooks/crm/useQuotation';
import { QuotationApi } from '@/services/quotation.service';
import { NumberingApi } from '@/services/numbering.service';

interface Props {
    rfqId?: string;
}

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'Singapore': 'USD',      // ⭐ সিঙ্গাপুরের জন্য USD
  'United Kingdom': 'GBP',
  'Bangladesh': 'BDT',
  'Middle East': 'AED',
  'Portugal': 'EUR',
};

function buildPqNumberFromSettings(s: any): string {
    if (!s) return '';
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePart = s.useTodayDate
        ? `${yy}${mm}${dd}`
        : (s.manualDate || `${yy}${mm}${dd}`).replace(/\D/g, '').slice(0, 6);
    const padded = String((s.nextSeq || 0) + 1).padStart(s.padding || 4, '0');
    return `${s.countryCode}-${s.regionCode}/${s.entityCode}/${s.docTypeCode}/${datePart}-${padded}`;
}

function buildQuoteNumberFromSettings(s: any): string {
    if (!s) return '';
    const year = new Date().getFullYear();
    const yearPart =
        s.yearSegment === 'none'
            ? ''
            : s.yearSegment === 'yy'
                ? String(year).slice(-2)
                : String(year);
    const padded = String((s.nextSeq || 0) + 1).padStart(s.padding || 4, '0');
    return [s.rfqPrefix, yearPart, padded].filter(Boolean).join('-');
}

export default function QuotationBuilderPage({ rfqId }: Props) {
    const [topTab, setTopTab] = useState<TopTabKey>('builder');
    const [tab, setTab] = useState<QuotationTabKey>('quotation');

    const [meta, setMeta] = useState<QuotationMeta>(DEFAULT_META);
    const [rates, setRates] = useState<QuotationRates>(DEFAULT_RATES);
    const [lines, setLines] = useState<QuotationLineItem[]>([...FIXED_LINES]);
    const [terms, setTerms] = useState(DEFAULT_TERMS);
    const [logistics, setLogistics] = useState({
        totalDimension: '3x4x5 mm',
        clientAskedFor: 'CIF',
        productType: 'DG',
    });

    const [autoEditLineId, setAutoEditLineId] = useState<string | null>(null);
    const [linesDirty, setLinesDirty] = useState(false);

    const [loading, setLoading] = useState<boolean>(!!rfqId);
    const [sending, setSending] = useState(false);
    const [generating, setGenerating] = useState(false);

    const {
        quotation,
        loading: loadingQuotation,
        saving,
        create,
        update,
        send,
    } = useQuotation(rfqId);

    const [quoteStats, setQuoteStats] = useState({
        drafts: 0,
        sent: 0,
        won: 0,
        lost: 0,
        awaiting: 0,
    });

    const removableCount = lines.filter((l) => l.type !== 'fixed').length;
    const canRemoveLine = removableCount > 1;

    // ⭐ Prevents the useEffect from overwriting manual changes after a save
    const hasLoadedInitialRef = useRef(false);

    const refreshNumbering = React.useCallback(async () => {
        try {
            const [pqSettings, quoteSettings] = await Promise.all([
                NumberingApi.get('pq').catch(() => null),
                NumberingApi.get('quote').catch(() => null),
            ]);

            const pqNumber = pqSettings ? buildPqNumberFromSettings(pqSettings) : '';
            const quoteNumber = quoteSettings
                ? buildQuoteNumberFromSettings(quoteSettings)
                : '';

            setMeta((prev) => ({
                ...prev,
                pqNumber: prev.rfqRefOverride ? prev.pqNumber : (pqNumber || prev.pqNumber || ''),
                quotationNumber: quoteNumber || prev.quotationNumber || '',
            }));
        } catch (err) {
            console.warn('[QuotationBuilder] refreshNumbering failed', err);
        }
    }, []);

    // 1️⃣ Load RFQ Data
    useEffect(() => {
        if (!rfqId) {
            setLoading(false);
            return;
        }

        let mounted = true;
        setLoading(true);

        (async () => {
            try {
                const rfq = await RfqApi.get(rfqId);
                if (!mounted) return;

                let pqNumber = '';
                let quoteNumber = '';
                try {
                    const [pqSettings, quoteSettings] = await Promise.all([
                        NumberingApi.get('pq').catch(() => null),
                        NumberingApi.get('quote').catch(() => null),
                    ]);
                    if (pqSettings) pqNumber = buildPqNumberFromSettings(pqSettings);
                    if (quoteSettings)
                        quoteNumber = buildQuoteNumberFromSettings(quoteSettings);
                } catch (err) {
                    console.warn('[QuotationBuilder] Numbering settings load failed', err);
                }

                if (!mounted) return;

                const assignedTerritory = rfq.territory || rfq.country || 'Bangladesh';
                const derivedCurrencyCode = COUNTRY_CURRENCY_MAP[assignedTerritory] || rfq.currency || 'BDT';
                const currencyData = CURRENCIES.find((c) => c.code === derivedCurrencyCode);

                setMeta((prev) => ({
                    ...prev,
                    rfqNumber: rfq.rfqNumber || prev.rfqNumber || '',
                    title: `${rfq.company} — ${assignedTerritory}`,
                    territory: assignedTerritory,
                    country: assignedTerritory,
                    currency: derivedCurrencyCode,
                    currencySymbol: currencyData?.symbol || '৳',
                    exchangeRate: derivedCurrencyCode === 'BDT' ? 1 : currencyData?.rateToBDT || 1,

                    crmManager: rfq.assignedTo || rfq.salesman || prev.crmManager,
                    client: {
                        company: rfq.clientInfo?.company || rfq.company || '',
                        contactName: rfq.clientInfo?.contactName || '',
                        designation: rfq.clientInfo?.designation || '',
                        email: rfq.clientInfo?.email || '',
                        phone: rfq.clientInfo?.phone || '',
                        address: rfq.clientInfo?.address || '',
                        city: rfq.clientInfo?.city || '',
                        country: rfq.clientInfo?.country || rfq.country || '',
                        zipCode: rfq.clientInfo?.zipCode || '',
                    },
                    pqNumber: pqNumber || prev.pqNumber || '',
                    quotationNumber: quoteNumber || prev.quotationNumber || '',
                    billToCompany: prev.billToCompany || rfq.clientInfo?.company || rfq.company || '',
                    billToContactName: prev.billToContactName || rfq.clientInfo?.contactName || '',
                    billToContactRole: prev.billToContactRole || rfq.clientInfo?.designation || '',
                    billToEmail: prev.billToEmail || rfq.clientInfo?.email || '',
                    billToPhone: prev.billToPhone || rfq.clientInfo?.phone || '',
                    billToAddress:
                        prev.billToAddress ||
                        [rfq.clientInfo?.address, rfq.clientInfo?.city, rfq.clientInfo?.country]
                            .filter(Boolean)
                            .join(', '),
                    pqrNumber: prev.pqrNumber || 'ME0-P021(T10)-W(L1)',
                }));

                const rawProducts = Array.isArray(rfq.products) ? rfq.products : [];
                const productLines: QuotationLineItem[] = rawProducts.map((p, i) => ({
                    id: `p-${rfq.id}-${i}`,
                    sl: i + 1,
                    name: p.name || 'Unnamed Product',
                    qty: Number(p.qty) || 1,
                    principalCost: 0,
                    weightKg: 0,
                    discountPct: 0,
                    type: 'item' as const,
                    spec: p.spec || '',
                }));

                setLines((prev) => {
                    const hasRealLines = prev.some(
                        (l) => l.type !== 'fixed' && l.name && l.name !== 'New Item'
                    );
                    if (hasRealLines) return prev;
                    return [...productLines, ...FIXED_LINES];
                });

                hasLoadedInitialRef.current = true;
            } catch (e: any) {
                console.error('[QuotationBuilder] Failed to load RFQ:', e);
                if (mounted) toast.error(e.message || 'Failed to load RFQ data');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [rfqId]);

    // 2️⃣ Load Existing Quotation (if any)
    useEffect(() => {
        if (!quotation) return;

        setMeta((prev) => {
            const quotationTerritory = quotation.territory || prev.territory;
            const isFirstLoadOfQuotation = hasLoadedInitialRef.current;

            const companyName = (quotation.client?.company || prev.client.company || 'Client').trim();
            const finalTitle = isFirstLoadOfQuotation
                ? (quotation as any).title || `${companyName} — ${quotationTerritory}`
                : prev.title;

            const expectedCurrency = COUNTRY_CURRENCY_MAP[quotationTerritory];
            const newCurrencyCode = expectedCurrency || quotation.currency || prev.currency;
            const currencyData = CURRENCIES.find(c => c.code === newCurrencyCode);

            return {
                ...prev,
                rfqNumber: quotation.rfqNumber || prev.rfqNumber || '',
                pqNumber: quotation.pqNumber || prev.pqNumber || '',
                quotationNumber: (quotation as any).quotationNumber || prev.quotationNumber || '',
                client: { ...prev.client, ...quotation.client },
                clientType: quotation.clientType || prev.clientType,

                title: finalTitle,
                territory: isFirstLoadOfQuotation ? quotationTerritory : prev.territory,
                country: isFirstLoadOfQuotation ? quotationTerritory : prev.country,

                currency: isFirstLoadOfQuotation ? newCurrencyCode : prev.currency,
                currencySymbol: quotation.currencySymbol || currencyData?.symbol || prev.currencySymbol,
                exchangeRate: isFirstLoadOfQuotation ? (quotation.exchangeRate ?? prev.exchangeRate ?? 1) : prev.exchangeRate,

                crmManager: quotation.crmManager || prev.crmManager,
                vatEnabled: quotation.vatEnabled,
                discountEnabled: quotation.discountEnabled,
                pqrNumber: quotation.pqrNumber || prev.pqrNumber,
                billToCompany: quotation.billToCompany || prev.billToCompany,
                billToContactName: quotation.billToContactName || prev.billToContactName,
                billToContactRole: quotation.billToContactRole || prev.billToContactRole,
                billToEmail: quotation.billToEmail || prev.billToEmail,
                billToPhone: quotation.billToPhone || prev.billToPhone,
                billToAddress: quotation.billToAddress || prev.billToAddress,
                pqDate: quotation.pqDate || prev.pqDate,
                rfqRefOverride: quotation.rfqRefOverride || prev.rfqRefOverride,
            };
        });

        if (!linesDirty) {
            const loadedLines = quotation.lines?.length ? quotation.lines : [...FIXED_LINES];

            setLines(prevLines => {
                return loadedLines.map((newLine): QuotationLineItem => {
                    const oldLine = prevLines.find(l => l.id === newLine.id);

                    if (!oldLine) return newLine as QuotationLineItem;

                    return {
                        ...newLine,
                        source1: { ...newLine.source1, manualRate: (oldLine.source1 as any)?.manualRate },
                        source2: { ...newLine.source2, manualRate: (oldLine.source2 as any)?.manualRate },
                        source3: { ...newLine.source3, manualRate: (oldLine.source3 as any)?.manualRate },
                    } as QuotationLineItem;
                });
            });
        }






        if (quotation.rates) setRates(quotation.rates);
        if (quotation.terms?.length) setTerms(quotation.terms);
        if (quotation.logistics)
            setLogistics((prev) => ({ ...prev, ...quotation.logistics }));

        hasLoadedInitialRef.current = false;
    }, [quotation, linesDirty]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const stats = await QuotationApi.stats();
                if (mounted) setQuoteStats(stats);
            } catch { }
        })();
        return () => {
            mounted = false;
        };
    }, [topTab, quotation?.id]);

    const calc = useMemo(() => {
        let costOfGoods = 0;
        let officeTotal = 0;
        let profitTotal = 0;
        let othersTotal = 0;
        let subTotal = 0;
        let discountTotal = 0;
        let customerPrice = 0;
        let totalWeight = 0;

        const principalRate = 1 - (rates.principalDiscountPct || 0) / 100;
        const discountOn = meta.discountEnabled !== false;
        const taxOn = meta.vatEnabled !== false;
        const taxPct = rates.taxPct || 0;

        for (const l of lines) {
            const effectiveCost = (l.principalCost || 0) * principalRate;
            const lineTotal = (l.qty || 0) * effectiveCost;
            const weight = (l.qty || 0) * (l.weightKg || 0);
            const office = (lineTotal * (rates.officePct || 0)) / 100;
            const profit = (lineTotal * (rates.profitPct || 0)) / 100;
            const others = (lineTotal * (rates.othersPct || 0)) / 100;
            const sub = lineTotal + office + profit + others;
            const appliedPct = discountOn ? (l.discountPct || 0) : 0;
            const discountAmt = sub * (appliedPct / 100);
            const discounted = sub - discountAmt;

            costOfGoods += lineTotal;
            officeTotal += office;
            profitTotal += profit;
            othersTotal += others;
            subTotal += sub;
            discountTotal += discountAmt;
            customerPrice += discounted;
            totalWeight += weight;
        }

        const taxVatGst = !taxOn || taxPct === 0 ? 0 : (customerPrice * taxPct) / 100;
        const grandTotal = customerPrice + taxVatGst;

        return {
            costOfGoods,
            remittanceOfficeExp: officeTotal,
            customsFreight: 0,
            commissionOthers: othersTotal,
            netProfit: profitTotal,
            subTotal,
            discountTotal,
            customerPrice,
            taxVatGst,
            grandTotal,
            totalWeight,
        };
    }, [lines, rates, meta.vatEnabled, meta.discountEnabled]);

    const updateLine = (id: string, patch: Partial<QuotationLineItem>) => {
        setLinesDirty(true);
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    };

    const addLine = () => {
        setLinesDirty(true);
        let newId = '';
        setLines((prev) => {
            const itemCount = prev.filter((l) => l.type !== 'fixed').length;
            newId = `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

            const targetCurr = COUNTRY_CURRENCY_MAP[meta.territory] || meta.currency || 'BDT';

            const newLine: QuotationLineItem = {
                id: newId,
                sl: itemCount + 1,
                name: 'New Item',
                qty: 1,
                principalCost: 0,
                weightKg: 0,
                discountPct: 0,
                type: 'item',
                source1: { name: '', price: '', currency: targetCurr },
                source2: { name: '', price: '', currency: targetCurr },
                source3: { name: '', price: '', currency: targetCurr },
            };
            const firstFixedIdx = prev.findIndex((l) => l.type === 'fixed');
            if (firstFixedIdx === -1) return [...prev, newLine];
            return [
                ...prev.slice(0, firstFixedIdx),
                newLine,
                ...prev.slice(firstFixedIdx),
            ];
        });
        setAutoEditLineId(newId);
    };

    const removeLine = (id: string) => {
        const removableLines = lines.filter((l) => l.type !== 'fixed');
        if (removableLines.length <= 1) {
            toast.error('A quotation needs at least one line item.');
            return;
        }
        setLinesDirty(true);
        setLines((prev) => {
            const filtered = prev.filter((l) => l.id !== id);
            let counter = 1;
            return filtered.map((l) => {
                if (l.type === 'fixed') return { ...l, sl: '-' as const };
                return { ...l, sl: counter++ };
            });
        });
    };

    const addTerm = () => {
        setTerms((prev) => [...prev, { label: 'New Term', value: 'Description…' }]);
    };
    const updateTerm = (index: number, patch: { label?: string; value?: string }) => {
        setTerms((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
    };
    const removeTerm = (index: number) => {
        setTerms((prev) => prev.filter((_, i) => i !== index));
    };

    const DISCOUNT_THRESHOLD = 15;
    const maxDiscountPct = lines.reduce((max, l) => {
        if (l.type === 'fixed') return max;
        return Math.max(max, l.discountPct || 0);
    }, 0);
    const discountTooHigh = maxDiscountPct > DISCOUNT_THRESHOLD;
    const hasRealCosts = lines.some((l) => l.type !== 'fixed' && l.principalCost > 0);

    const buildMetaPayload = () => {
        const strictCurrency = COUNTRY_CURRENCY_MAP[meta.territory] || meta.currency;

        return {
            title: meta.title,
            client: meta.client,
            clientType: meta.clientType,
            crmManager: meta.crmManager,
            territory: meta.territory,
            currency: strictCurrency,
            exchangeRate: meta.exchangeRate,
            vatEnabled: meta.vatEnabled,
            discountEnabled: meta.discountEnabled,
            pqrNumber: meta.pqrNumber,
            pqNumber: meta.pqNumber,
            quotationNumber: meta.quotationNumber,
            billToCompany: meta.billToCompany,
            billToContactName: meta.billToContactName,
            billToContactRole: meta.billToContactRole,
            billToEmail: meta.billToEmail,
            billToPhone: meta.billToPhone,
            billToAddress: meta.billToAddress,
            pqDate: meta.pqDate,
            rfqRefOverride: meta.rfqRefOverride,
        };
    };

    const handleSaveDraft = async () => {
        if (!rfqId) {
            toast.error('No RFQ linked');
            return;
        }
        try {
            if (quotation?.id) {
                if (
                    quotation.status !== 'draft' &&
                    quotation.status !== 'awaiting_approval' &&
                    quotation.status !== 'sent'
                ) {
                    toast.error(
                        `Cannot edit — quotation is "${quotation.status}". Create a new version to continue.`
                    );
                    return;
                }
                await update(quotation.id, {
                    ...buildMetaPayload(),
                    lines,
                    rates,
                    terms,
                    logistics,
                });
                setLinesDirty(false);
                toast.success('Draft updated');
            } else {
                await create({
                    rfqId,
                    ...buildMetaPayload(),
                    lines,
                    rates,
                    terms,
                    logistics,
                });
                setLinesDirty(false);
                toast.success('Draft created');
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to save draft');
        }
    };

    const handleGenerateQuote = async () => {
        if (generating) return;
        if (!rfqId) {
            toast.error('No RFQ linked');
            return;
        }
        if (!hasRealCosts) {
            toast.error('Please enter principal cost for at least one product');
            return;
        }
        if (quotation?.status === 'sent') {
            toast('Already sent — showing Quotes tab', { icon: 'ℹ️' });
            setTopTab('quotes');
            return;
        }
        setGenerating(true);
        try {
            let qid = quotation?.id;
            if (!qid) {
                const created = await create({
                    rfqId,
                    ...buildMetaPayload(),
                    lines,
                    rates,
                    terms,
                    logistics,
                });
                qid = created.id;
            } else {
                await update(qid, {
                    ...buildMetaPayload(),
                    lines,
                    rates,
                    terms,
                    logistics,
                });
            }
            setLinesDirty(false);
            if (discountTooHigh) {
                toast.error(
                    `Discount ${maxDiscountPct}% exceeds ${DISCOUNT_THRESHOLD}% — routed for approval`
                );
                setTopTab('drafts');
                return;
            }
            await send(qid);
            toast.success('Quote sent to client');
            setTopTab('quotes');
        } catch (e: any) {
            toast.error(e.message || 'Failed to generate quote');
        } finally {
            setGenerating(false);
        }
    };

    const handleSendQuote = async (withAttachment: boolean = false) => {
        if (!hasRealCosts) {
            toast.error('Please enter principal cost for at least one product');
            return;
        }
        if (discountTooHigh) {
            toast.error(
                `Discount ${maxDiscountPct}% exceeds ${DISCOUNT_THRESHOLD}% — routed for approval`
            );
            return;
        }
        setSending(true);
        try {
            let qid = quotation?.id;
            if (!qid) {
                if (!rfqId) {
                    toast.error('No RFQ linked');
                    return;
                }
                const created = await create({
                    rfqId,
                    ...buildMetaPayload(),
                    lines,
                    rates,
                    terms,
                    logistics,
                });
                qid = created.id;
            } else {
                await update(qid, {
                    ...buildMetaPayload(),
                    lines,
                    rates,
                    terms,
                    logistics,
                });
            }
            if (quotation?.status === 'sent') {
                toast.error('Already sent');
                return;
            }
            await send(qid, withAttachment);
            setLinesDirty(false);
            toast.success(
                withAttachment
                    ? 'Quotation sent with PDF attachment'
                    : 'Quotation sent to client'
            );
            setTopTab('quotes');
        } catch (e: any) {
            toast.error(e.message || 'Failed to send');
        } finally {
            setSending(false);
        }
    };

    const buildShareableLink = (): string => {
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            'https://taskify-frontend-alpha.vercel.app';
        return rfqId
            ? `${baseUrl}/crm/quotation-builder/${rfqId}`
            : `${baseUrl}/crm/quotation-builder`;
    };

    const handleWhatsApp = () => {
        const link = buildShareableLink();
        const message = `Hello! Here's your quotation ${meta.pqNumber || meta.quotationNumber || meta.rfqNumber
            }:\n${link}`;
        const text = encodeURIComponent(message);
        if (typeof window !== 'undefined') {
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    const handleGenerateLink = async () => {
        const url = buildShareableLink();
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                toast.success('Shareable link copied');
            } else {
                toast.success(`Link: ${url}`);
            }
        } catch {
            toast.success(`Link: ${url}`);
        }
    };

    const updateLineAndSave = async (id: string, patch: Partial<QuotationLineItem>) => {
        const nextLines = lines.map((l) => (l.id === id ? { ...l, ...patch } : l));
        setLines(nextLines);
        if (!rfqId) return;
        try {
            if (quotation?.id) {
                await update(quotation.id, { lines: nextLines });
            } else {
                await create({
                    rfqId,
                    ...buildMetaPayload(),
                    lines: nextLines,
                    rates,
                    terms,
                    logistics,
                });
            }
            setLinesDirty(false);
        } catch (e: any) {
            toast.error(e.message || 'Failed to save source');
        }
    };

    // ⭐ NEW: Handler to select a source price, update principal cost, and SAVE to backend
    const handleSelectSourcePrice = async (lineId: string, selectedPrice: number) => {
        // Round to 2 decimal places to prevent long floats like 4.4285714285
        const roundedPrice = Number(selectedPrice.toFixed(2));

        setLinesDirty(true);

        // 1. Update local state instantly
        const nextLines = lines.map((l) =>
            l.id === lineId ? { ...l, principalCost: roundedPrice } : l
        );
        setLines(nextLines);

        // 2. Save to backend automatically so it persists on reload
        if (!rfqId) return;
        try {
            if (quotation?.id) {
                await update(quotation.id, { lines: nextLines });
            } else {
                await create({
                    rfqId,
                    ...buildMetaPayload(),
                    lines: nextLines,
                    rates,
                    terms,
                    logistics,
                });
            }
            setLinesDirty(false);
            toast.success('Principal cost updated and saved');
        } catch (e: any) {
            toast.error(e.message || 'Failed to save imported price');
        }
    };

    const quoteCount =
        (quoteStats.sent || 0) +
        (quoteStats.won || 0) +
        (quoteStats.lost || 0) +
        (quoteStats.awaiting || 0);
    const draftCount = quoteStats.drafts || 0;

    if (loading || loadingQuotation) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-3 border-[#A06126] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-slate-500">Loading quotation…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] antialiased p-6 lg:p-8">
            <Header
                topTab={topTab}
                onTabChange={setTopTab}
                quoteCount={quoteCount}
                draftCount={draftCount}
                onSaveDraft={handleSaveDraft}
                onGenerateQuote={handleGenerateQuote}
                generating={generating}
                savingDraft={saving || sending}
            />

            {topTab === 'builder' && (
                <>
                    <QuoteInfoCard
                        meta={meta}
                        onChange={setMeta}
                        onSaveDraft={handleSaveDraft}
                        onGenerateQuote={handleGenerateQuote}
                        onDiscuss={() => { }}
                        generating={generating}
                        savingDraft={saving || sending}
                        onNumberingSaved={refreshNumbering}
                    />

                    <div className="mt-6 border-b border-[#EBE6DF] flex items-center gap-6 text-xs">
                        <InnerTab active={tab === 'quotation'} onClick={() => setTab('quotation')}>
                            Quotation
                        </InnerTab>
                        <InnerTab active={tab === 'cog'} onClick={() => setTab('cog')}>
                            Cost Of Good
                        </InnerTab>
                        <InnerTab active={tab === 'source'} onClick={() => setTab('source')}>
                            Source
                        </InnerTab>
                    </div>

                    <div className="mt-5 space-y-4">
                        {tab === 'quotation' && (
                            <QuotationTab
                                meta={meta}
                                lines={lines}
                                calc={calc}
                                rates={rates}
                                terms={terms}
                                canRemoveLine={canRemoveLine}
                                onUpdateLine={updateLine}
                                onRemoveLine={removeLine}
                                onAddLine={addLine}
                                onAddTerm={addTerm}
                                onUpdateTerm={updateTerm}
                                onRemoveTerm={removeTerm}
                                onSend={handleSendQuote}
                                onWhatsApp={handleWhatsApp}
                                onGenerateLink={handleGenerateLink}
                                sending={sending}
                                onChangeMeta={(patch: Partial<QuotationMeta>) =>
                                    setMeta((m) => ({ ...m, ...patch }))
                                }
                            />
                        )}

                        {tab === 'cog' && (
                            <CostOfGoodTab
                                meta={meta}
                                lines={lines}
                                calc={calc}
                                rates={rates}
                                logistics={logistics}
                                onChangeRates={setRates}
                                onChangeLine={updateLine}
                                onAddLine={addLine}
                                onRemoveLine={removeLine}
                                onChangeLogistics={setLogistics}
                            />
                        )}

                        {tab === 'source' && (
                            <SourceTab
                                lines={lines}
                                meta={meta}
                                autoEditLineId={autoEditLineId}
                                onAutoEditConsumed={() => setAutoEditLineId(null)}
                                onUpdateLine={updateLineAndSave}
                                onRemoveLine={removeLine}
                                onAddLine={addLine}
                                onChangeMeta={(patch: Partial<QuotationMeta>) =>
                                    setMeta((m) => ({ ...m, ...patch }))
                                }
                                onSelectSource={handleSelectSourcePrice}
                            />
                        )}

                        {discountTooHigh && (
                            <ThresholdBanner
                                discountPct={maxDiscountPct}
                                threshold={DISCOUNT_THRESHOLD}
                            />
                        )}
                    </div>
                </>
            )}

            {topTab === 'quotes' && <QuotesListTab />}
            {topTab === 'drafts' && <DraftsListTab />}
        </div>
    );
}

function InnerTab({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`pb-3 font-semibold relative transition ${active ? 'text-[#A06126]' : 'text-slate-500 hover:text-slate-700'
                }`}
        >
            {children}
            {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
            )}
        </button>
    );
}