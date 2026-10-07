// app/(dashboard)/crm/client-360/components/ProfileTabs.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Mail, Phone, Smartphone, User, Edit, Loader2, Star } from 'lucide-react';
import type {
    Client360,
    ClientContact,
    ClientQuote,
    ClientContract,
} from './constants';
import { fmtMoneyFull, fmtDate, fmtDateLong, getInitials } from './constants';
import { Client360Api } from '@/services/client360.service';

interface Props {
    client: Client360;
    onAddContact: () => void;
    onEditContact: (contact: ClientContact) => void;
    onAddCommunication: () => void;
}

type TabKey = 'contacts' | 'overview' | 'quotes' | 'contracts' | 'log';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'contacts', label: 'Contacts' },
    { key: 'overview', label: 'Overview' },
    { key: 'quotes', label: 'Quotes' },
    { key: 'contracts', label: 'Contracts & Renewals' },
    { key: 'log', label: 'Communication Log' },
];

export function ProfileTabs({
    client,
    onAddContact,
    onEditContact,
    onAddCommunication,
}: Props) {
    const [tab, setTab] = useState<TabKey>('contacts');

    return (
        <>
            <div className="mt-6 border-b border-[#EBE6DF] flex items-center gap-6 text-xs">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`pb-3 font-semibold relative transition ${tab === t.key
                            ? 'text-[#A06126]'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t.label}
                        {tab === t.key && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-5">
                {tab === 'contacts' && (
                    <ContactsTab
                        contacts={client.contacts}
                        onAdd={onAddContact}
                        onEdit={onEditContact}
                    />
                )}
                {tab === 'overview' && <OverviewTab client={client} />}
                {tab === 'quotes' && (
                    <QuotesTab quotes={client.quotes} clientId={client.id} client={client} />
                )}
                {tab === 'contracts' && <ContractsTab contracts={client.contracts} />}
                {tab === 'log' && (
                    <LogTab log={client.communicationLog} onAdd={onAddCommunication} />
                )}
            </div>
        </>
    );
}

/* =========================================================
   CONTACTS TAB
   ========================================================= */
function ContactsTab({
    contacts,
    onAdd,
    onEdit,
}: {
    contacts: ClientContact[];
    onAdd: () => void;
    onEdit: (c: ClientContact) => void;
}) {
    return (
        <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                {contacts.map((c, i) => (
                    <div
                        key={c._id || i}
                        className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0F2D4A] text-[11px] font-bold text-white">
                                {getInitials(c.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[13px] font-bold text-[#0F2D4A] truncate">
                                        {c.name}
                                    </span>
                                </div>
                                <div className="text-[10.5px] text-slate-500 truncate">
                                    {c.designation}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 text-[11px]">
                            {c.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="text-slate-700 truncate">{c.email}</span>
                                </div>
                            )}
                            {c.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="text-slate-700">{c.phone} (office)</span>
                                </div>
                            )}
                            {c.personalPhone && (
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="text-slate-700">
                                        {c.personalPhone} (mobile)
                                    </span>
                                </div>
                            )}
                            {c.notes && (
                                <div className="flex items-center gap-2 pt-1">
                                    <User className="w-3 h-3 text-slate-300 shrink-0" />
                                    <span className="text-slate-500 italic text-[10.5px]">
                                        {c.notes}
                                    </span>
                                </div>
                            )}
                            {c.isDecisionMaker && (
                                <span
                                    className="inline-flex mt-2 items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wider shrink-0"
                                    title="This person is a decision maker"
                                >
                                    <span className="w-3 h-3 text-slate-300 shrink-0">💬</span>
                                    <span className="text-slate-500 italic text-[10.5px]">
                                        Decision Maker
                                    </span>
                                </span>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#F0EBE3] flex items-center gap-3 text-[11px]">
                            <button
                                onClick={() => onEdit(c)}
                                className="inline-flex items-center gap-1 text-slate-600 font-semibold hover:text-[#A06126]"
                            >
                                <Edit className="w-3 h-3" /> Edit
                            </button>
                            {c.email && (
                                <a
                                    href={`mailto:${c.email}`}
                                    className="inline-flex items-center gap-1 text-slate-600 font-semibold hover:text-[#A06126]"
                                >
                                    <Mail className="w-3 h-3" /> Email
                                </a>
                            )}
                        </div>
                    </div>
                ))}

                {contacts.length === 0 && (
                    <div className="lg:col-span-2 rounded-xl border border-dashed border-[#E5DFD3] py-10 text-center text-[11px] italic text-slate-400">
                        No contacts added yet.
                    </div>
                )}
            </div>

            <button
                onClick={onAdd}
                className="mt-4 text-[11px] font-bold text-[#A06126] hover:underline"
            >
                + Add Contact
            </button>
        </>
    );
}

/* =========================================================
   OVERVIEW TAB — Deals list with lifetime fallback
   ========================================================= */
function OverviewTab({ client }: { client: Client360 }) {
    const quoteDeals = (client.quotes || []).map((q) => ({
        id: q._id || q.quotationId || q.qtnNumber,
        title: q.item || 'Untitled',
        subtitle: q.qtnNumber ? `— ${q.qtnNumber}` : '',
        value: q.value || 0,
        status: q.status || 'Draft',
    }));

    const hasDeals = quoteDeals.length > 0;
    const showLifetimeRow = !hasDeals && client.lifetimeValue > 0;

    if (!hasDeals && !showLifetimeRow) {
        return (
            <div className="rounded-xl border border-[#EBE6DF] bg-white px-6 py-8 text-center text-[11.5px] text-slate-500">
                No active deals or projects for this client yet.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[#EBE6DF] bg-white overflow-hidden">
            {quoteDeals.map((deal, i) => (
                <div
                    key={deal.id || i}
                    className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#F0EBE3] last:border-b-0 hover:bg-[#FDFBF7] transition"
                >
                    <div className="min-w-0 text-[12.5px] text-slate-800">
                        <span className="font-semibold">{deal.title}</span>
                        {deal.subtitle && (
                            <span className="text-slate-500"> {deal.subtitle}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] shrink-0">
                        <span className="font-mono font-bold text-slate-800">
                            {fmtMoneyFull(deal.value)}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${deal.status === 'Sent'
                                ? 'bg-[#EEF4FB] text-[#1F3864]'
                                : deal.status === 'Won'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : deal.status === 'Lost'
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                        >
                            {deal.status}
                        </span>
                    </div>
                </div>
            ))}

            {showLifetimeRow && (
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0 text-[12.5px] text-slate-800">
                        <span className="font-semibold">Total Account Value</span>
                        <span className="text-slate-500">
                            {' '}
                            — captured from {client.autoAddedFrom || 'source'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] shrink-0">
                        <span className="font-mono font-bold text-slate-800">
                            {fmtMoneyFull(client.lifetimeValue)}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600">
                            {client.autoAddedFrom || 'Auto'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================================================
   QUOTES TAB — Live fetch + source fallback
   ========================================================= */
function QuotesTab({
    quotes,
    clientId,
    client,
}: {
    quotes: ClientQuote[];
    clientId: string;
    client: Client360;
}) {
    const [live, setLive] = useState<ClientQuote[] | null>(null);
    const [loading, setLoading] = useState(true);

    // ⭐ Fetch live quotations on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await Client360Api.getClientQuotations(clientId);
                if (!cancelled) setLive(data);
            } catch {
                if (!cancelled) setLive(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [clientId]);

    if (loading) {
        return (
            <div className="rounded-xl border border-[#EBE6DF] bg-white px-6 py-8 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading quotes…
            </div>
        );
    }

    const list = live && live.length > 0 ? live : quotes;

    // ⭐ If no quotations, fall back to showing source data
    if (!list || list.length === 0) {
        const isTender = client.autoAddedFrom === 'tender';
        const isForecast = client.autoAddedFrom === 'sales-crm';
        const isRfq = client.autoAddedFrom === 'rfq';

        if (isTender && client.lifetimeValue > 0) {
            return (
                <>
                    <div className="mb-3 text-[10.5px] text-slate-500 italic">
                        No quotations yet — this client was captured from a Tender.
                    </div>
                    <div className="rounded-xl border border-[#EBE6DF] bg-white overflow-hidden">
                        <div className="flex items-center justify-between gap-4 px-5 py-4">
                            <div className="min-w-0 text-[12.5px] text-slate-800">
                                <span className="font-semibold">
                                    Tender Budget — {client.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] shrink-0">
                                <span className="font-mono font-bold text-slate-800">
                                    {fmtMoneyFull(client.lifetimeValue)}
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-[#E8F6F1] text-[#0F6B4F] border border-[#C4E8DA]">
                                    Tender
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if ((isForecast || isRfq) && client.lifetimeValue > 0) {
            return (
                <>
                    <div className="mb-3 text-[10.5px] text-slate-500 italic">
                        No quotations yet — captured from {client.autoAddedFrom}.
                    </div>
                    <div className="rounded-xl border border-[#EBE6DF] bg-white overflow-hidden">
                        <div className="flex items-center justify-between gap-4 px-5 py-4">
                            <div className="min-w-0 text-[12.5px] text-slate-800">
                                <span className="font-semibold">Account value — {client.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] shrink-0">
                                <span className="font-mono font-bold text-slate-800">
                                    {fmtMoneyFull(client.lifetimeValue)}
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-[#FFF7E8] text-[#A06126] border border-[#F5D9B8]">
                                    {client.autoAddedFrom}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        return (
            <div className="rounded-xl border border-dashed border-[#E5DFD3] py-12 text-center text-[11px] italic text-slate-400">
                No quotes yet.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[#EBE6DF] bg-white overflow-hidden">
            {list.map((q, i) => (
                <div
                    key={q._id || i}
                    className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#F0EBE3] last:border-b-0 hover:bg-[#FDFBF7] transition"
                >
                    <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-slate-800">
                            {q.qtnNumber} — {q.item}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] shrink-0">
                        <span className="font-mono font-bold text-slate-800">
                            {fmtMoneyFull(q.value)}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${q.status === 'Sent'
                                ? 'bg-[#EEF4FB] text-[#1F3864]'
                                : q.status === 'Won'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : q.status === 'Lost'
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                        >
                            {q.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* =========================================================
   CONTRACTS TAB
   ========================================================= */
function ContractsTab({ contracts }: { contracts: ClientContract[] }) {
    if (contracts.length === 0) {
        return (
            <div className="rounded-xl border border-[#EBE6DF] bg-white px-6 py-8 text-center text-[11.5px] text-slate-500">
                No active contracts or renewals for this account yet.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[#EBE6DF] bg-white overflow-hidden">
            {contracts.map((c, i) => (
                <div
                    key={c._id || i}
                    className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#F0EBE3] last:border-b-0"
                >
                    <div>
                        <div className="text-[12px] font-semibold text-slate-800">
                            {c.title}
                        </div>
                        <div className="text-[10.5px] text-slate-500">
                            {fmtDateLong(c.startDate)} → {fmtDateLong(c.endDate)}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                        <span className="font-mono font-bold text-slate-800">
                            {fmtMoneyFull(c.value)}
                        </span>
                        <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {c.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* =========================================================
   LOG TAB
   ========================================================= */
function LogTab({
    log,
    onAdd,
}: {
    log: Client360['communicationLog'];
    onAdd: () => void;
}) {
    const [range, setRange] = useState<'active' | '1m' | '3m' | '6m' | '1y' | 'all'>('active');

    const RANGES = [
        { key: 'active' as const, label: 'Active' },
        { key: '1m' as const, label: '1 Month' },
        { key: '3m' as const, label: '3 Months' },
        { key: '6m' as const, label: '6 Months' },
        { key: '1y' as const, label: '1 Year' },
        { key: 'all' as const, label: 'No more' },
    ];

    const filtered = log.filter((e) => {
        if (range === 'all') return true;
        const days =
            range === '1m' ? 30 : range === '3m' ? 90 : range === '6m' ? 180 : 365;
        const cutoff = Date.now() - days * 86400000;
        return new Date(e.at).getTime() >= cutoff;
    });

    return (
        <>
            <div className="rounded-xl border border-[#EBE6DF] bg-white shadow-xs overflow-hidden">
                <div className="border-b border-[#F0EBE3] px-5 py-3 flex items-center gap-4 text-[11px]">
                    {RANGES.map((r) => (
                        <button
                            key={r.key}
                            onClick={() => setRange(r.key)}
                            className={`pb-2 font-semibold relative transition ${range === r.key
                                ? 'text-[#A06126]'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {r.label}
                            {range === r.key && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                <div>
                    {filtered.map((entry, i) => (
                        <div
                            key={entry._id || i}
                            className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-[#F0EBE3] last:border-b-0"
                        >
                            <div className="text-[11.5px] text-slate-700">
                                <span className="capitalize">{entry.kind}</span> —{' '}
                                {entry.summary}
                            </div>
                            <div className="text-[10.5px] text-slate-400 whitespace-nowrap">
                                {fmtDate(entry.at)}
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="px-5 py-10 text-center text-[11px] italic text-slate-400">
                            No communication in this period.
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={onAdd}
                className="mt-4 text-[11px] font-bold text-[#A06126] hover:underline"
            >
                + Log Communication
            </button>
        </>
    );
}