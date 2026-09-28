'use client';

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Header from './Header';
import QuoteInfoCard from './QuoteInfoCard';
import ClientTypeBar from './ClientTypeBar';
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

interface Props {
    rfqId?: string;
}

export default function QuotationBuilderPage({ rfqId }: Props) {
    // ============================================================
    // NAVIGATION STATE
    // ============================================================
    const [topTab, setTopTab] = useState<TopTabKey>('builder');
    const [tab, setTab] = useState<QuotationTabKey>('quotation');

    // ============================================================
    // FORM STATE
    // ============================================================
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

    // ⭐ Track unsaved line edits so hydration doesn't overwrite them
    const [linesDirty, setLinesDirty] = useState(false);

    // ============================================================
    // LOADING & SENDING STATE
    // ============================================================
    const [loading, setLoading] = useState<boolean>(!!rfqId);
    const [sending, setSending] = useState(false);

    // ============================================================
    // QUOTATION PERSISTENCE HOOK
    // ============================================================
    const {
        quotation,
        loading: loadingQuotation,
        saving,
        create,
        update,
        send,
        approve,
        markOutcome,
    } = useQuotation(rfqId);

    // ============================================================
    // STATS FOR TAB BADGES
    // ============================================================
    const [quoteStats, setQuoteStats] = useState({
        drafts: 0,
        sent: 0,
        won: 0,
        lost: 0,
        awaiting: 0,
    });

    // ⭐ Track whether user is allowed to remove a line
    const removableCount = lines.filter((l) => l.type !== 'fixed').length;
    const canRemoveLine = removableCount > 1;

    // ============================================================
    // LOAD RFQ DATA
    // ============================================================
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

                const clientInfo = {
                    company: rfq.clientInfo?.company || rfq.company || '',
                    contactName: rfq.clientInfo?.contactName || '',
                    designation: rfq.clientInfo?.designation || '',
                    email: rfq.clientInfo?.email || '',
                    phone: rfq.clientInfo?.phone || '',
                    address: rfq.clientInfo?.address || '',
                    city: rfq.clientInfo?.city || '',
                    country: rfq.clientInfo?.country || rfq.country || '',
                    zipCode: rfq.clientInfo?.zipCode || '',
                };

                const countryCode = (rfq.country || 'XX').slice(0, 2).toUpperCase();
                const initials = (rfq.company || 'XX')
                    .replace(/[^A-Za-z]/g, '')
                    .slice(0, 4)
                    .toUpperCase();
                const pqNumber = `NG-${countryCode}/${initials}/RV/${(rfq.rfqNumber || '').replace(/-/g, '')}`;

                setMeta((prev) => ({
                    ...prev,
                    rfqNumber: rfq.rfqNumber || '',
                    title: `${rfq.company} — ${rfq.clientInfo?.city || rfq.country}`,
                    territory: rfq.country || '',
                    crmManager: rfq.assignedTo || rfq.salesman || prev.crmManager,
                    country: rfq.country || '',
                    client: clientInfo,
                    pqNumber,
                    pqrNumber: 'ME0-P021(T10)-W(L1)',
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
                    // ⭐ Only seed from RFQ products if we don't already have real lines
                    const hasRealLines = prev.some(
                        (l) => l.type !== 'fixed' && l.name && l.name !== 'New Item'
                    );
                    if (hasRealLines) return prev;
                    return [...productLines, ...FIXED_LINES];
                });
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

    // ============================================================
    // HYDRATE FROM EXISTING QUOTATION
    // ⭐ Skips `setLines` when user has unsaved local edits
    // ============================================================
    useEffect(() => {
        if (!quotation) return;

        setMeta((prev) => ({
            ...prev,
            pqNumber: quotation.pqNumber,
            client: { ...prev.client, ...quotation.client },
            clientType: quotation.clientType,
            territory: quotation.territory || prev.territory,
            crmManager: quotation.crmManager || prev.crmManager,
            currency: quotation.currency || prev.currency,
            currencySymbol: quotation.currencySymbol || prev.currencySymbol,
            exchangeRate: quotation.exchangeRate ?? 1,
            vatEnabled: quotation.vatEnabled,
            discountEnabled: quotation.discountEnabled,
            pqrNumber: quotation.pqrNumber || prev.pqrNumber,
        }));

        // ⭐ Only hydrate lines if there are no unsaved local changes
        if (!linesDirty) {
            setLines(quotation.lines?.length ? quotation.lines : [...FIXED_LINES]);
        }

        if (quotation.rates) setRates(quotation.rates);
        if (quotation.terms?.length) setTerms(quotation.terms);
        if (quotation.logistics)
            setLogistics((prev) => ({ ...prev, ...quotation.logistics }));
    }, [quotation, linesDirty]);

    // ============================================================
    // FETCH STATS — refreshes on tab change + after mutations
    // ============================================================
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const stats = await QuotationApi.stats();
                if (mounted) setQuoteStats(stats);
            } catch {
                // silent
            }
        })();
        return () => {
            mounted = false;
        };
    }, [topTab, quotation?.id]);

    // ============================================================
    // LIVE CALC
    //
    // Business rules:
    //   1. Principal Discount % reduces the COST (supplier-side)
    //   2. Office / Profit / Others margins apply to discounted cost
    //   3. Per-line Disc % applies to the price (client-side)
    //      — gated by meta.discountEnabled (Special Discount checkbox)
    //   4. Tax is applied to the post-discount amount (Convention A)
    //      — gated by meta.vatEnabled (VAT / GST checkbox)
    // ============================================================
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

        const taxVatGst =
            !taxOn || taxPct === 0
                ? 0
                : (customerPrice * taxPct) / 100;

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
    }, [
        lines,
        rates,
        meta.vatEnabled,
        meta.discountEnabled,
    ]);

    // ============================================================
    // LINE HANDLERS
    // ============================================================
    const updateLine = (id: string, patch: Partial<QuotationLineItem>) => {
        setLinesDirty(true);   // ⭐ Mark unsaved changes
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    };

    const addLine = () => {
        setLinesDirty(true);   // ⭐ Mark unsaved changes
        let newId = '';

        setLines((prev) => {
            const itemCount = prev.filter((l) => l.type !== 'fixed').length;
            newId = `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

            const newLine: QuotationLineItem = {
                id: newId,
                sl: itemCount + 1,
                name: 'New Item',
                qty: 1,
                principalCost: 0,
                weightKg: 0,
                discountPct: 0,
                type: 'item',
                source1: { name: '', price: '' },
                source2: { name: '', price: '' },
                source3: { name: '', price: '' },
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

        setLinesDirty(true);   // ⭐ Mark unsaved changes

        setLines((prev) => {
            const filtered = prev.filter((l) => l.id !== id);
            let counter = 1;
            return filtered.map((l) => {
                if (l.type === 'fixed') return { ...l, sl: '-' as const };
                return { ...l, sl: counter++ };
            });
        });
    };

    // ============================================================
    // TERM HANDLERS
    // ============================================================
    const addTerm = () => {
        setTerms((prev) => [...prev, { label: 'New Term', value: 'Description…' }]);
    };

    const updateTerm = (
        index: number,
        patch: { label?: string; value?: string }
    ) => {
        setTerms((prev) =>
            prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
        );
    };

    const removeTerm = (index: number) => {
        setTerms((prev) => prev.filter((_, i) => i !== index));
    };

    // ============================================================
    // VALIDATION HELPERS
    // ============================================================
    const DISCOUNT_THRESHOLD = 15;

    const maxDiscountPct = lines.reduce((max, l) => {
        if (l.type === 'fixed') return max;
        return Math.max(max, l.discountPct || 0);
    }, 0);

    const discountTooHigh = maxDiscountPct > DISCOUNT_THRESHOLD;
    const hasRealCosts = lines.some(
        (l) => l.type !== 'fixed' && l.principalCost > 0
    );

    // ============================================================
    // SAVE DRAFT
    // ============================================================
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
                    quotation.status !== 'sent'   // ⭐ now editable
                ) {
                    toast.error(
                        `Cannot edit — quotation is "${quotation.status}". Create a new version to continue.`
                    );
                    return;
                }

                await update(quotation.id, {
                    client: meta.client,
                    clientType: meta.clientType,
                    lines,
                    rates,
                    terms,
                    logistics,
                    crmManager: meta.crmManager,
                    vatEnabled: meta.vatEnabled,
                    discountEnabled: meta.discountEnabled,
                });

                // ⭐ Clear dirty flag after successful save
                setLinesDirty(false);

                toast.success('Draft updated');
            } else {
                await create({
                    rfqId,
                    client: meta.client,
                    clientType: meta.clientType,
                    lines,
                    rates,
                    terms,
                    logistics,
                    crmManager: meta.crmManager,
                    territory: meta.territory,
                    vatEnabled: meta.vatEnabled,
                    discountEnabled: meta.discountEnabled,
                    pqrNumber: meta.pqrNumber,
                });

                // ⭐ Clear dirty flag after successful save
                setLinesDirty(false);

                toast.success('Draft created');
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to save draft');
        }
    };

    // ============================================================
    // GENERATE QUOTE
    // ============================================================
    const handleGenerateQuote = async () => {
        if (!rfqId) {
            toast.error('No RFQ linked');
            return;
        }

        if (!hasRealCosts) {
            toast.error('Please enter principal cost for at least one product');
            return;
        }

        try {
            let qid = quotation?.id;

            if (!qid) {
                const created = await create({
                    rfqId,
                    client: meta.client,
                    clientType: meta.clientType,
                    lines,
                    rates,
                    terms,
                    logistics,
                    crmManager: meta.crmManager,
                    territory: meta.territory,
                    vatEnabled: meta.vatEnabled,
                    discountEnabled: meta.discountEnabled,
                    pqrNumber: meta.pqrNumber,
                });
                qid = created.id;
            } else {
                await update(qid, {
                    client: meta.client,
                    clientType: meta.clientType,
                    lines,
                    rates,
                    terms,
                    logistics,
                    vatEnabled: meta.vatEnabled,
                    discountEnabled: meta.discountEnabled,
                });
            }

            // ⭐ Clear dirty flag
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
        }
    };

    // ============================================================
    // SEND QUOTATION (action bar)
    // ============================================================
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
                    client: meta.client,
                    lines,
                    rates,
                    terms,
                    logistics,
                    crmManager: meta.crmManager,
                    territory: meta.territory,
                    vatEnabled: meta.vatEnabled,
                    discountEnabled: meta.discountEnabled,
                });
                qid = created.id;
            }

            if (quotation?.status === 'sent') {
                toast.error('Already sent');
                return;
            }

            const result = await send(qid, withAttachment);

            // ⭐ Clear dirty flag
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

    // ============================================================
    // ⭐ SHAREABLE LINK — single source of truth
    //    Always uses rfqId so both buttons produce the SAME URL
    // ============================================================
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
        const message = `Hello! Here's your quotation ${meta.pqNumber || meta.rfqNumber
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

    // ============================================================
    // ⭐ UPDATE + SAVE (used by SourceTab ✓ button)
    //    Marks dirty + persists immediately
    // ============================================================
    const updateLineAndSave = async (id: string, patch: Partial<QuotationLineItem>) => {
        // Update local state first
        const nextLines = lines.map((l) =>
            l.id === id ? { ...l, ...patch } : l
        );
        setLines(nextLines);

        // ⭐ Then persist to backend
        if (!rfqId) return;

        try {
            if (quotation?.id) {
                await update(quotation.id, { lines: nextLines });
            } else {
                await create({
                    rfqId,
                    client: meta.client,
                    clientType: meta.clientType,
                    lines: nextLines,
                    rates,
                    terms,
                    logistics,
                    crmManager: meta.crmManager,
                    territory: meta.territory,
                    vatEnabled: meta.vatEnabled,
                    discountEnabled: meta.discountEnabled,
                    pqrNumber: meta.pqrNumber,
                });
            }
            // ⭐ No need to mark dirty — we just saved
            setLinesDirty(false);
        } catch (e: any) {
            toast.error(e.message || 'Failed to save source');
        }
    };

    // ============================================================
    // COMPUTED BADGE COUNTS
    // ============================================================
    const quoteCount =
        (quoteStats.sent || 0) +
        (quoteStats.won || 0) +
        (quoteStats.lost || 0) +
        (quoteStats.awaiting || 0);
    const draftCount = quoteStats.drafts || 0;

    // ============================================================
    // LOADING
    // ============================================================
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

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] antialiased p-6 lg:p-8">
            <Header
                topTab={topTab}
                onTabChange={setTopTab}
                quoteCount={quoteCount}
                draftCount={draftCount}
                onSaveDraft={handleSaveDraft}
                onGenerateQuote={handleGenerateQuote}
            />

            {topTab === 'builder' && (
                <>
                    <QuoteInfoCard
                        meta={meta}
                        onChange={setMeta}
                        onSaveDraft={handleSaveDraft}
                        onGenerateQuote={handleGenerateQuote}
                        onDiscuss={() => { }}
                    />

                    <ClientTypeBar meta={meta} onChange={setMeta} />

                    <div className="mt-6 border-b border-[#EBE6DF] flex items-center gap-6 text-xs">
                        <InnerTab
                            active={tab === 'quotation'}
                            onClick={() => setTab('quotation')}
                        >
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
                                autoEditLineId={autoEditLineId}
                                onAutoEditConsumed={() => setAutoEditLineId(null)}
                                onUpdateLine={updateLineAndSave}
                                onRemoveLine={removeLine}
                                onAddLine={addLine}
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

/* ========================================================= */
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