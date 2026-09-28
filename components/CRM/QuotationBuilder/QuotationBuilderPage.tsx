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

    // ============================================================
    // LOADING & SENDING STATE
    // ============================================================
    const [loading, setLoading] = useState<boolean>(!!rfqId);
    // ⭐ FIX #1 — sending state was missing
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
        send,          // send(id, withAttachment)
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

                setLines([...productLines, ...FIXED_LINES]);
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
        setLines(quotation.lines?.length ? quotation.lines : [...FIXED_LINES]);
        if (quotation.rates) setRates(quotation.rates);
        if (quotation.terms?.length) setTerms(quotation.terms);
        if (quotation.logistics)
            setLogistics((prev) => ({ ...prev, ...quotation.logistics }));
    }, [quotation]);

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
    // LIVE CALC  —  Convention A: tax on post-discount price
    // ============================================================
    const calc = useMemo(() => {
        let costOfGoods = 0;
        let officeTotal = 0;
        let profitTotal = 0;
        let othersTotal = 0;

        let subTotal = 0;             // pre-discount, pre-tax
        let discountTotal = 0;        // Σ discounts
        let customerPrice = 0;        // net after discount, pre-tax
        let totalWeight = 0;

        for (const l of lines) {
            const lineTotal = (l.qty || 0) * (l.principalCost || 0);
            const weight = (l.qty || 0) * (l.weightKg || 0);
            const office = (lineTotal * (rates.officePct || 0)) / 100;
            const profit = (lineTotal * (rates.profitPct || 0)) / 100;
            const others = (lineTotal * (rates.othersPct || 0)) / 100;

            const sub = lineTotal + office + profit + others;
            const discountAmt = sub * ((l.discountPct || 0) / 100);
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

        // ⭐ Tax on the net (post-discount) subtotal
        const taxVatGst =
            (rates.taxPct || 0) === 0
                ? 0
                : (customerPrice * rates.taxPct) / 100;

        const grandTotal = customerPrice + taxVatGst;

        return {
            costOfGoods,
            remittanceOfficeExp: officeTotal,
            customsFreight: 0,
            commissionOthers: othersTotal,
            netProfit: profitTotal,

            subTotal,         // pre-discount
            discountTotal,    // Σ discount
            customerPrice,    // net after discount, pre-tax
            taxVatGst,        // tax on customerPrice
            grandTotal,       // customerPrice + tax

            totalWeight,
        };
    }, [lines, rates]);

    // ============================================================
    // LINE HANDLERS
    // ============================================================
    const updateLine = (id: string, patch: Partial<QuotationLineItem>) => {
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    };

    const addLine = () => {
        setLines((prev) => {
            const itemCount = prev.filter((l) => l.type !== 'fixed').length;
            const newLine: QuotationLineItem = {
                id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                sl: itemCount + 1,
                name: 'New Item',
                qty: 1,
                principalCost: 0,
                weightKg: 0,
                discountPct: 0,
                type: 'item',
            };
            const firstFixedIdx = prev.findIndex((l) => l.type === 'fixed');
            if (firstFixedIdx === -1) return [...prev, newLine];
            return [
                ...prev.slice(0, firstFixedIdx),
                newLine,
                ...prev.slice(firstFixedIdx),
            ];
        });
    };

    const removeLine = (id: string) => {
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
    // ⭐ NEW — remove a term by index
    const removeTerm = (index: number) => {
        setTerms((prev) => prev.filter((_, i) => i !== index));
    };

    // ============================================================
    // VALIDATION HELPERS
    // ============================================================
    const discountTooHigh = lines.some((l) => l.discountPct > 15);
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
                    quotation.status !== 'awaiting_approval'
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
                });
            }

            if (discountTooHigh) {
                toast.error('Discount exceeds 15% — routed for approval');
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

        setSending(true);
        try {
            // Ensure quotation exists
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

            // Guard status
            if (quotation?.status === 'sent') {
                toast.error('Already sent');
                return;
            }

            // ⭐ FIX #2 — use `send`, not `sendWithAttachment`
            const result = await send(qid, withAttachment);

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
    // WHATSAPP / SHARE LINK
    // ============================================================
    const handleWhatsApp = () => {
        // ⭐ Always use the production URL — never localhost
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            'https://taskify-frontend-alpha.vercel.app';

        const link = rfqId
            ? `${baseUrl}/crm/quotation-builder/${rfqId}`
            : `${baseUrl}/crm/quotation-builder`;

        const message = `Hello! Here's your quotation ${meta.pqNumber || meta.rfqNumber
            }:\n${link}`;

        const text = encodeURIComponent(message);

        if (typeof window !== 'undefined') {
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    const handleGenerateLink = async () => {
        const url = quotation?.id
            ? `https://taskify-frontend-alpha.vercel.app/crm/quotation-builder/${quotation.id}`
            : `https://taskify-frontend-alpha.vercel.app/crm/quotation-builder/${meta.rfqNumber}`;
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
                                terms={terms}
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
                                onRemoveLine={removeLine}
                                onAddLine={addLine}
                            />
                        )}

                        {discountTooHigh && tab !== 'quotation' && <ThresholdBanner />}
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