// app/(dashboard)/crm/client-360/components/ProfileTabs.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
    Mail,
    Phone,
    Smartphone,
    User,
    Edit,
    Loader2,
    Pencil,
    Trash2,
    AlertTriangle,
    Plus,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';
import type {
    Client360,
    ClientContact,
    ClientQuote,
    ClientContract,
} from './constants';
import { fmtMoneyFull, getInitials } from './constants';
import { Client360Api } from '@/services/client360.service';

// ⭐ A local date formatter that always includes the year
function formatDateWithYear(dateString?: string | null) {
    if (!dateString) return '—';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
}

interface Props {
    client: Client360;
    onAddContact: () => void;
    onEditContact: (contact: ClientContact) => void;
    onDeleteContact?: (contact: ClientContact) => Promise<void> | void;
    onAddCommunication: () => void;
    onEditCommunication?: (log: any) => void;
    onDeleteCommunication?: (id: string) => Promise<void> | void;
    onRefreshClient?: () => Promise<void> | void;
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
    onDeleteContact,
    onAddCommunication,
    onEditCommunication,
    onDeleteCommunication,
    onRefreshClient,
}: Props) {
    const [tab, setTab] = useState<TabKey>('contacts');

    // ⭐ Quote States
    const [quoteModalOpen, setQuoteModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<ClientQuote | null>(null);
    const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
    const [deletingQuote, setDeletingQuote] = useState(false);

    // ⭐ Contract States
    const [contractModalOpen, setContractModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<ClientContract | null>(null);
    const [contractToDelete, setContractToDelete] = useState<string | null>(null);
    const [deletingContract, setDeletingContract] = useState(false);

    // ⭐ Contact States
    const [contactToDelete, setContactToDelete] = useState<ClientContact | null>(null);
    const [deletingContact, setDeletingContact] = useState(false);

    // ---- Confirm Delete Handlers ----
    const confirmDeleteQuote = async () => {
        if (!quoteToDelete) return;
        try {
            setDeletingQuote(true);
            await Client360Api.deleteQuote(client.id, quoteToDelete);
            toast.success('Quote deleted');
            setQuoteToDelete(null);
            if (onRefreshClient) await onRefreshClient();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete quote');
        } finally {
            setDeletingQuote(false);
        }
    };

    const confirmDeleteContract = async () => {
        if (!contractToDelete) return;
        try {
            setDeletingContract(true);
            await Client360Api.deleteContract(client.id, contractToDelete);
            toast.success('Contract deleted');
            setContractToDelete(null);
            if (onRefreshClient) await onRefreshClient();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete contract');
        } finally {
            setDeletingContract(false);
        }
    };

    const confirmDeleteContact = async () => {
        if (!contactToDelete || !onDeleteContact) return;
        try {
            setDeletingContact(true);
            await onDeleteContact(contactToDelete);
            setContactToDelete(null);
        } catch (e) {
            // Error handled in parent
        } finally {
            setDeletingContact(false);
        }
    };

    return (
        <>
            <div className="mt-6 border-b border-[#EBE6DF] flex items-center gap-6 text-xs">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`pb-3 font-semibold relative transition ${
                            tab === t.key
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
                        onDelete={(c) => setContactToDelete(c)} // ⭐ Open custom modal
                    />
                )}

                {tab === 'overview' && <OverviewTab client={client} />}

                {tab === 'quotes' && (
                    <QuotesTab
                        quotes={client.quotes}
                        clientId={client.id}
                        client={client}
                        onAddQuote={() => {
                            setEditingQuote(null);
                            setQuoteModalOpen(true);
                        }}
                        onEditQuote={(quote) => {
                            setEditingQuote(quote);
                            setQuoteModalOpen(true);
                        }}
                        onDeleteQuote={(id) => setQuoteToDelete(id)}
                    />
                )}

                {tab === 'contracts' && (
                    <ContractsTab
                        contracts={client.contracts}
                        onAddContract={() => {
                            setEditingContract(null);
                            setContractModalOpen(true);
                        }}
                        onEditContract={(contract) => {
                            setEditingContract(contract);
                            setContractModalOpen(true);
                        }}
                        onDeleteContract={(id) => setContractToDelete(id)}
                    />
                )}

                {tab === 'log' && (
                    <LogTab
                        log={client.communicationLog}
                        onAdd={onAddCommunication}
                        onEdit={onEditCommunication}
                        onDelete={onDeleteCommunication}
                    />
                )}
            </div>

            {/* MODALS */}
            {quoteModalOpen && (
                <QuoteModal
                    clientId={client.id}
                    clientName={client.name}
                    initialData={editingQuote}
                    onClose={() => {
                        setQuoteModalOpen(false);
                        setEditingQuote(null);
                    }}
                    onSaved={async () => {
                        setQuoteModalOpen(false);
                        setEditingQuote(null);
                        if (onRefreshClient) await onRefreshClient();
                    }}
                />
            )}

            {contractModalOpen && (
                <ContractModal
                    clientId={client.id}
                    initialData={editingContract}
                    onClose={() => {
                        setContractModalOpen(false);
                        setEditingContract(null);
                    }}
                    onSaved={async () => {
                        setContractModalOpen(false);
                        setEditingContract(null);
                        if (onRefreshClient) await onRefreshClient();
                    }}
                />
            )}

            {/* ⭐ Custom Delete Modals */}
            {quoteToDelete && (
                <DeleteConfirmModal
                    title="Delete Quote"
                    message="Are you sure you want to delete this quote? This action cannot be undone."
                    onCancel={() => setQuoteToDelete(null)}
                    onConfirm={confirmDeleteQuote}
                    loading={deletingQuote}
                />
            )}

            {contractToDelete && (
                <DeleteConfirmModal
                    title="Delete Contract"
                    message="Are you sure you want to delete this contract? This action cannot be undone."
                    onCancel={() => setContractToDelete(null)}
                    onConfirm={confirmDeleteContract}
                    loading={deletingContract}
                />
            )}

            {contactToDelete && (
                <DeleteConfirmModal
                    title="Delete Contact"
                    message="Are you sure you want to delete this contact? This action cannot be undone."
                    onCancel={() => setContactToDelete(null)}
                    onConfirm={confirmDeleteContact}
                    loading={deletingContact}
                />
            )}
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
    onDelete
}: {
    contacts: ClientContact[];
    onAdd: () => void;
    onEdit: (c: ClientContact) => void;
    onDelete?: (c: ClientContact) => void;
}) {
    return (
        <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                {contacts.map((c, i) => (
                    <div
                        key={c._id || i}
                        className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs group"
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

                        <div className="mt-4 pt-3 border-t border-[#F0EBE3] flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-3">
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
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(c)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition opacity-0 group-hover:opacity-100"
                                    title="Delete contact"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
   OVERVIEW TAB
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
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                deal.status === 'Sent'
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
   QUOTES TAB
   ========================================================= */
function QuotesTab({
    quotes,
    clientId,
    client,
    onAddQuote,
    onEditQuote,
    onDeleteQuote,
}: {
    quotes: ClientQuote[];
    clientId: string;
    client: Client360;
    onAddQuote: () => void;
    onEditQuote?: (quote: ClientQuote) => void;
    onDeleteQuote?: (quoteId: string) => void;
}) {
    const [live, setLive] = useState<ClientQuote[] | null>(null);
    const [loading, setLoading] = useState(true);

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
            <>
                <div className="rounded-xl border border-dashed border-[#E5DFD3] py-12 text-center text-[11px] italic text-slate-400">
                    No quotes yet.
                </div>
                <button
                    onClick={onAddQuote}
                    className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-[#A06126] hover:underline"
                >
                    <Plus className="w-3.5 h-3.5" /> Create Quote
                </button>
            </>
        );
    }

    return (
        <>
            <div className="rounded-xl border border-[#EBE6DF] bg-white overflow-hidden">
                {list.map((q, i) => (
                    <div
                        key={q._id || i}
                        className="group flex items-center justify-between gap-4 px-5 py-4 border-b border-[#F0EBE3] last:border-b-0 hover:bg-[#FDFBF7] transition"
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
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    q.status === 'Sent'
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

                            {/* ⭐ এডিট এবং ডিলিট বাটন */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onEditQuote && (
                                    <button
                                        onClick={() => onEditQuote(q)}
                                        className="p-1.5 text-slate-400 hover:text-[#A06126] hover:bg-[#F9F1E2] rounded transition"
                                        title="Edit quote"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {onDeleteQuote && q._id && (
                                    <button
                                        onClick={() => onDeleteQuote(q._id!)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                        title="Delete quote"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={onAddQuote}
                className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-[#A06126] hover:underline"
            >
                <Plus className="w-3.5 h-3.5" /> Create Quote
            </button>
        </>
    );
}

/* =========================================================
   CONTRACTS TAB
   ========================================================= */
function ContractsTab({
    contracts,
    onAddContract,
    onEditContract,
    onDeleteContract,
}: {
    contracts: ClientContract[];
    onAddContract: () => void;
    onEditContract: (contract: ClientContract) => void;
    onDeleteContract?: (id: string) => void;
}) {
    if (contracts.length === 0) {
        return (
            <>
                <div className="rounded-xl border border-[#EBE6DF] bg-white px-6 py-8 text-center text-[11.5px] text-slate-500">
                    No active contracts or renewals for this account yet.
                </div>
                <button
                    onClick={onAddContract}
                    className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-[#A06126] hover:underline"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Contract
                </button>
            </>
        );
    }

    return (
        <>
            <div className="rounded-xl border border-[#EBE6DF] bg-white overflow-hidden">
                {contracts.map((c, i) => (
                    <div
                        key={c._id || i}
                        className="group flex items-center justify-between gap-4 px-5 py-4 border-b border-[#F0EBE3] last:border-b-0 hover:bg-[#FDFBF7] transition"
                    >
                        <div>
                            <div className="text-[12px] font-semibold text-slate-800">
                                {c.title}
                            </div>
                            <div className="text-[10.5px] text-slate-500">
                                {formatDateWithYear(c.startDate)} → {formatDateWithYear(c.endDate)}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-[11px]">
                            <span className="font-mono font-bold text-slate-800">
                                {fmtMoneyFull(c.value)}
                            </span>
                            <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                {c.status}
                            </span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEditContract(c)}
                                    className="p-1.5 text-slate-400 hover:text-[#A06126] hover:bg-[#F9F1E2] rounded transition"
                                    title="Edit contract"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {onDeleteContract && c._id && (
                                    <button
                                        onClick={() => onDeleteContract(c._id!)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                        title="Delete contract"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onAddContract}
                className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-[#A06126] hover:underline"
            >
                <Plus className="w-3.5 h-3.5" /> Add Contract
            </button>
        </>
    );
}

/* =========================================================
   LOG TAB
   ========================================================= */
function LogTab({
    log,
    onAdd,
    onEdit,
    onDelete,
}: {
    log: Client360['communicationLog'];
    onAdd: () => void;
    onEdit?: (log: any) => void;
    onDelete?: (id: string) => Promise<void> | void;
}) {
    const [range, setRange] = useState<'active' | '1m' | '3m' | '6m' | '1y' | 'all'>('active');

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

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
        const days = range === '1m' ? 30 : range === '3m' ? 90 : range === '6m' ? 180 : 365;
        const cutoff = Date.now() - days * 86400000;
        return new Date(e.at).getTime() >= cutoff;
    });

    const handleDeleteConfirm = async () => {
        if (!deleteId || !onDelete) return;
        try {
            setDeleting(true);
            await onDelete(deleteId);
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <div className="rounded-xl border border-[#EBE6DF] bg-white shadow-xs overflow-hidden">
                <div className="border-b border-[#F0EBE3] px-5 py-3 flex items-center gap-4 text-[11px]">
                    {RANGES.map((r) => (
                        <button
                            key={r.key}
                            onClick={() => setRange(r.key)}
                            className={`pb-2 font-semibold relative transition ${
                                range === r.key
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
                            className="group flex items-center justify-between gap-4 px-5 py-3.5 border-b border-[#F0EBE3] last:border-b-0 hover:bg-[#FDFBF7] transition"
                        >
                            <div className="text-[11.5px] text-slate-700">
                                <span className="capitalize font-semibold text-slate-800">{entry.kind}</span> —{' '}
                                {entry.summary}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-[10.5px] text-slate-400 whitespace-nowrap">
                                    {formatDateWithYear(entry.at)}
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(entry)}
                                            className="p-1.5 text-slate-400 hover:text-[#A06126] hover:bg-[#F9F1E2] rounded transition"
                                            title="Edit log"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => setDeleteId(entry._id!)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                            title="Delete log"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
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

            {deleteId && (
                <DeleteConfirmModal
                    title="Delete Log Entry"
                    message="Are you sure you want to delete this communication log? This action cannot be undone."
                    onCancel={() => setDeleteId(null)}
                    onConfirm={handleDeleteConfirm}
                    loading={deleting}
                />
            )}
        </>
    );
}

/* =========================================================
   QUOTE MODAL
   ========================================================= */
function QuoteModal({ clientId, clientName, initialData, onClose, onSaved }: {
    clientId: string;
    clientName: string;
    initialData?: ClientQuote | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [item, setItem] = useState(initialData?.item || '');
    const [value, setValue] = useState(initialData?.value?.toString() || '');
    const [status, setStatus] = useState(initialData?.status || 'Draft');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!item.trim() || !value) {
            toast.error('Item and Value are required');
            return;
        }

        setSaving(true);
        try {
            if (initialData?._id) {
                await Client360Api.updateQuote(clientId, initialData._id, {
                    item,
                    value: Number(value),
                    status
                });
            } else {
                await Client360Api.addQuote(clientId, {
                    item,
                    value: Number(value),
                    status
                });
            }

            toast.success(initialData ? 'Quote updated!' : 'Quote added successfully!');
            onSaved();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save quote');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-serif text-lg font-bold text-[#0F2D4A]">
                        {initialData ? 'Edit Quote' : 'Create Quote'} for {clientName}
                    </h2>
                    <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Item / Product</label>
                        <input value={item} onChange={e => setItem(e.target.value)} className="w-full rounded-lg border border-[#E2DBD1] px-3 py-2 text-xs" placeholder="e.g. Acronis Backup" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Value (৳)</label>
                        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full rounded-lg border border-[#E2DBD1] px-3 py-2 text-xs" placeholder="e.g. 50000" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-lg border border-[#E2DBD1] px-3 py-2 text-xs">
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Won">Won</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border rounded-lg">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-[#A06126] rounded-lg">
                        {saving ? 'Saving...' : initialData ? 'Update Quote' : 'Save Quote'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   CONTRACT MODAL
   ========================================================= */
function ContractModal({ clientId, initialData, onClose, onSaved }: { clientId: string, initialData: ClientContract | null, onClose: () => void, onSaved: () => void }) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [value, setValue] = useState(initialData?.value?.toString() || '');
    const [startDate, setStartDate] = useState(initialData?.startDate ? initialData.startDate.slice(0, 10) : '');
    const [endDate, setEndDate] = useState(initialData?.endDate ? initialData.endDate.slice(0, 10) : '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !value) {
            toast.error('Title and Value are required');
            return;
        }

        setSaving(true);
        try {
            if (initialData?._id) {
                await Client360Api.updateContract(clientId, initialData._id, {
                    title,
                    value: Number(value),
                    startDate,
                    endDate
                });
            } else {
                await Client360Api.addContract(clientId, {
                    title,
                    value: Number(value),
                    startDate,
                    endDate
                });
            }

            toast.success(initialData ? 'Contract updated!' : 'Contract added successfully!');
            onSaved();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save contract');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-serif text-lg font-bold text-[#0F2D4A]">{initialData ? 'Edit Contract' : 'Add Contract'}</h2>
                    <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Contract Title</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border border-[#E2DBD1] px-3 py-2 text-xs" placeholder="e.g. Annual AMC" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Value (৳)</label>
                        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full rounded-lg border border-[#E2DBD1] px-3 py-2 text-xs" placeholder="e.g. 100000" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg border border-[#E2DBD1] px-3 py-2 text-xs" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg border border-[#E2DBD1] px-3 py-2 text-xs" />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border rounded-lg">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-[#A06126] rounded-lg">
                        {saving ? 'Saving...' : 'Save Contract'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   REUSABLE DELETE CONFIRMATION MODAL
   ========================================================= */
function DeleteConfirmModal({
    title,
    message,
    onCancel,
    onConfirm,
    loading,
}: {
    title: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#0F2D4A]">{title}</h3>
                </div>
                <p className="text-sm text-slate-600 mb-6">{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}