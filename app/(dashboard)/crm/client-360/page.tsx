// app/(dashboard)/crm/client-360/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

import {
    Client360Api,
    type Client360,
    type ClientStats,
    type SectorBreakdown,
    type ClientConstants,
    type ClientListParams,
    type ClientContact,
} from '@/services/client360.service';

import { ClientHeader } from '@/components/CRM/client-360/ClientHeader';
import { KpiStrip } from '@/components/CRM/client-360/KpiStrip';
import { ProfileTabs } from '@/components/CRM/client-360/ProfileTabs';
import { AllClientsView } from '@/components/CRM/client-360/AllClientsView';
import { AddClientModal } from '@/components/CRM/client-360/AddClientModal';
import { ContactModal } from '@/components/CRM/client-360/ContactModal';
import { CommunicationModal } from '@/components/CRM/client-360/CommunicationModal';
import { EditClientModal } from '@/components/CRM/client-360/EditClientModal';
import { ClientProfileSkeleton } from '@/components/CRM/client-360/ClientProfileSkeleton';

type TopTab = 'profile' | 'all';

export default function Client360Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedId = searchParams.get('id');

    // ---- Data ----
    const [clients, setClients] = useState<Client360[]>([]);
    const [selected, setSelected] = useState<Client360 | null>(null);
    const [stats, setStats] = useState<ClientStats | null>(null);
    const [sectorBreakdown, setSectorBreakdown] =
        useState<SectorBreakdown | null>(null);
    const [constants, setConstants] = useState<ClientConstants | null>(null);

    // ---- UI ----
    const [topTab, setTopTab] = useState<TopTab>(selectedId ? 'profile' : 'all');
    const [loading, setLoading] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false);

    // ---- Modals ----
    const [addClientOpen, setAddClientOpen] = useState(false);
    const [editClientOpen, setEditClientOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
    const [commModalOpen, setCommModalOpen] = useState(false);

    const [filters, setFilters] = useState<{
        sector: string;
        tier: string;
        search: string;
        isPartner?: boolean;
    }>({
        sector: 'all',
        tier: 'all',
        search: '',
        isPartner: undefined,
    });

    // ============================================================
    // LOAD CONSTANTS (once)
    // ============================================================
    useEffect(() => {
        (async () => {
            try {
                const c = await Client360Api.constants();
                setConstants(c);
            } catch {
                /* silent */
            }
        })();
    }, []);

    // ============================================================
    // LOAD selected client (by url id) + sync active tab
    // ⭐ Shows skeleton while fetching
    // ============================================================
    useEffect(() => {
        if (!selectedId) {
            setSelected(null);
            setTopTab('all');
            setLoadingProfile(false);
            return;
        }

        setLoadingProfile(true);
        setTopTab('profile');

        (async () => {
            try {
                const c = await Client360Api.getById(selectedId);
                setSelected(c);
            } catch (e: any) {
                toast.error(e.message || 'Failed to load client');
                setSelected(null);
                setTopTab('all');
            } finally {
                setLoadingProfile(false);
            }
        })();
    }, [selectedId]);

    // ============================================================
    // LOAD list + stats + sector breakdown (only on "All" tab)
    // ============================================================
    const loadAll = useCallback(async () => {
        try {
            setLoading(true);

            const params: ClientListParams = {
                limit: 100,
                page: 1,
            };
            if (filters.sector !== 'all') params.sector = filters.sector;
            if (filters.tier !== 'all') params.tier = filters.tier;
            if (filters.search) params.search = filters.search;
            if (filters.isPartner) params.isPartner = 'true';

            const [listRes, statsRes, sectorRes] = await Promise.all([
                Client360Api.list(params),
                Client360Api.stats({
                    tier: filters.tier !== 'all' ? filters.tier : undefined,
                    sector: filters.sector !== 'all' ? filters.sector : undefined,
                    isPartner: filters.isPartner ? 'true' : undefined,
                }),
                Client360Api.sectorBreakdown({
                    tier: filters.tier !== 'all' ? filters.tier : undefined,
                }),
            ]);

            setClients(listRes.items);
            setStats(statsRes);
            setSectorBreakdown(sectorRes);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load clients');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (topTab === 'all') {
            loadAll();
        }
    }, [topTab, loadAll]);

    // ============================================================
    // HANDLERS
    // ============================================================
    const handleSelectClient = (c: Client360) => {
        router.push(`/crm/client-360?id=${c.id}`);
    };

    const handleBackToAll = () => {
        setTopTab('all');
        router.push('/crm/client-360');
    };

    const handleNewQuotation = () => {
        // Every quotation requires an RFQ. Prefer a linked one.
        const rfqId = selected?.sourceRefs?.rfqId;
        if (rfqId) {
            router.push(`/crm/quotation-builder/${rfqId}`);
            return;
        }
        // No RFQ linked → send user to RFQ dashboard
        router.push('/crm/rfq');
    };

    // ---- Edit Client ----
    const handleEdit = () => {
        setEditClientOpen(true);
    };

    const handleClientEdited = (updated: Client360) => {
        setSelected(updated);
        setEditClientOpen(false);
    };

    // ---- Contacts ----
    const handleAddContact = () => {
        setEditingContact(null);
        setContactModalOpen(true);
    };

    const handleEditContact = (contact: ClientContact) => {
        setEditingContact(contact);
        setContactModalOpen(true);
    };

    const handleContactSaved = async () => {
        setContactModalOpen(false);
        setEditingContact(null);

        if (selectedId) {
            try {
                const c = await Client360Api.getById(selectedId);
                setSelected(c);
            } catch {
                /* silent */
            }
        }
    };

    // ---- Communication ----
    const handleAddCommunication = () => {
        setCommModalOpen(true);
    };

    const handleCommSaved = async () => {
        setCommModalOpen(false);

        if (selectedId) {
            try {
                const c = await Client360Api.getById(selectedId);
                setSelected(c);
            } catch {
                /* silent */
            }
        }
    };

    // ---- Add Client ----
    const handleAddClient = () => {
        setAddClientOpen(true);
    };

    const handleClientSaved = async () => {
        setAddClientOpen(false);
        await loadAll();
    };

    const handleFilterChange = (f: typeof filters) => {
        setFilters(f);
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <main className="min-h-screen bg-[#FDFBF7] pb-20 text-[#1E293B]">
            <div className="mx-auto max-w-[1600px] space-y-5 p-6 lg:p-8">
                {/* Header */}
                <header>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A06126] mb-1">
                        CRM Dashboard
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-[#0F2D4A]">
                        Client 360
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        Full account history — quotes, orders, contracts, and
                        communication, in one view.
                    </p>
                </header>

                {/* Top tabs */}
                <div className="border-b border-[#EBE6DF] flex items-center gap-6 text-xs">
                    <TopTabBtn
                        active={topTab === 'profile'}
                        onClick={() => {
                            if (selected) setTopTab('profile');
                            else
                                toast('Select a client from All Clients first', {
                                    icon: 'ℹ️',
                                });
                        }}
                    >
                        Client Profile
                    </TopTabBtn>
                    <TopTabBtn
                        active={topTab === 'all'}
                        onClick={handleBackToAll}
                    >
                        All Clients
                    </TopTabBtn>
                </div>

                {/* ============================================================
                    PROFILE TAB
                    Three states: loading → loaded → empty
                   ============================================================ */}

                {/* 1. Loading skeleton */}
                {topTab === 'profile' && loadingProfile && (
                    <ClientProfileSkeleton />
                )}

                {/* 2. Client loaded → full profile */}
                {topTab === 'profile' && !loadingProfile && selected && (
                    <>
                        <ClientHeader
                            client={selected}
                            onNewQuotation={handleNewQuotation}
                            onEdit={handleEdit}
                        />
                        <KpiStrip client={selected} />
                        <ProfileTabs
                            client={selected}
                            onAddContact={handleAddContact}
                            onEditContact={handleEditContact}
                            onAddCommunication={handleAddCommunication}
                        />
                    </>
                )}

                {/* 3. No client & not loading → empty state */}
                {topTab === 'profile' && !loadingProfile && !selected && (
                    <div className="rounded-xl border border-dashed border-[#E5DFD3] py-16 text-center text-[12px] italic text-slate-400">
                        Select a client from All Clients to view their profile.
                    </div>
                )}

                {/* ============================================================
                    ALL CLIENTS TAB
                   ============================================================ */}
                {topTab === 'all' && (
                    <AllClientsView
                        clients={clients}
                        stats={stats}
                        sectorBreakdown={sectorBreakdown}
                        constants={constants}
                        loading={loading}
                        onSelect={handleSelectClient}
                        onAddClient={handleAddClient}
                        onFilterChange={handleFilterChange}
                        activeFilter={filters}
                    />
                )}
            </div>

            {/* ============================================================
                MODALS
               ============================================================ */}

            {/* Add Client */}
            {addClientOpen && (
                <AddClientModal
                    constants={constants}
                    onClose={() => setAddClientOpen(false)}
                    onSaved={handleClientSaved}
                />
            )}

            {/* Edit Client */}
            {editClientOpen && selected && (
                <EditClientModal
                    client={selected}
                    constants={constants}
                    onClose={() => setEditClientOpen(false)}
                    onSaved={handleClientEdited}
                />
            )}

            {/* Contact Modal — add or edit */}
            {contactModalOpen && selected && (
                <ContactModal
                    clientId={selected.id}
                    contact={editingContact}
                    onClose={() => {
                        setContactModalOpen(false);
                        setEditingContact(null);
                    }}
                    onSaved={handleContactSaved}
                />
            )}

            {/* Communication Log Modal */}
            {commModalOpen && selected && (
                <CommunicationModal
                    clientId={selected.id}
                    onClose={() => setCommModalOpen(false)}
                    onSaved={handleCommSaved}
                />
            )}
        </main>
    );
}

/* =========================================================
   Top Tab Button
   ========================================================= */
function TopTabBtn({
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