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
        country: string;
        search: string;
        isPartner?: boolean;
    }>({
        sector: 'all',
        tier: 'all',
        country: 'all',
        search: '',
        isPartner: undefined,
    });

    // ============================================================
    // Constants — once on mount
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
    // Selected client — on URL change
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
    // LIST — refetch only when filters change
    // ============================================================
    const loadList = useCallback(async () => {
        try {
            setLoading(true);

            const params: ClientListParams = {
                limit: 500,   // ⭐ fetch more so pagination is fully client-side
                page: 1,
            };
            if (filters.sector !== 'all') params.sector = filters.sector;
            if (filters.tier !== 'all') params.tier = filters.tier;
            if (filters.country !== 'all') params.country = filters.country;
            if (filters.search) params.search = filters.search;
            if (filters.isPartner !== undefined) {
                params.isPartner = filters.isPartner ? 'true' : 'false';
            }

            const listRes = await Client360Api.list(params);
            setClients(listRes.items);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load clients');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (topTab === 'all') loadList();
    }, [topTab, loadList]);

    // ============================================================
    // AGGREGATES (stats + sector) — load only when tab opens
    //                      not on every filter change
    // ============================================================
    const loadAggregates = useCallback(async () => {
        try {
            const [statsRes, sectorRes] = await Promise.all([
                Client360Api.stats({}),
                Client360Api.sectorBreakdown({}),
            ]);
            setStats(statsRes);
            setSectorBreakdown(sectorRes);
        } catch {
            /* silent */
        }
    }, []);

    useEffect(() => {
        if (topTab === 'all') loadAggregates();
    }, [topTab, loadAggregates]);

    // ============================================================
    // HANDLERS
    // ============================================================

    // ⭐ Fast save — updates local state, no full refetch
    const handleSaveContact = async (
        client: Client360,
        contact: ClientContact,
        updated: Partial<ClientContact>,
        index: number
    ) => {
        try {
            const contactId = contact._id;
            if (!contactId) {
                throw new Error(
                    'Contact has no _id — cannot update. Try reloading.'
                );
            }

            await Client360Api.updateContact(client.id, contactId, updated);

            // ⭐ Local merge — instant UI update
            setClients((prev) =>
                prev.map((c) => {
                    if (c.id !== client.id) return c;
                    const newContacts = [...(c.contacts || [])];
                    newContacts[index] = { ...newContacts[index], ...updated };
                    return { ...c, contacts: newContacts };
                })
            );

            toast.success(`Contact updated for ${client.name}`);
        } catch (e: any) {
            toast.error(e.message || 'Failed to update contact');
            throw e;
        }
    };

    const handleSelectClient = (c: Client360) => {
        router.push(`/crm/client-360?id=${c.id}`);
    };

    const handleBackToAll = () => {
        setTopTab('all');
        router.push('/crm/client-360');
    };

    const handleNewQuotation = () => {
        const rfqId = selected?.sourceRefs?.rfqId;
        if (rfqId) {
            router.push(`/crm/quotation-builder/${rfqId}`);
            return;
        }
        router.push('/crm/rfq');
    };

    const handleEdit = () => {
        setEditClientOpen(true);
    };

    const handleClientEdited = (updated: Client360) => {
        setSelected(updated);
        setEditClientOpen(false);
    };

    // ---- Contacts (modal based) ----
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
        await loadList();
        await loadAggregates();
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
                    <TopTabBtn active={topTab === 'all'} onClick={handleBackToAll}>
                        All Clients
                    </TopTabBtn>
                </div>

                {/* PROFILE TAB */}
                {topTab === 'profile' && loadingProfile && (
                    <ClientProfileSkeleton />
                )}

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

                {topTab === 'profile' && !loadingProfile && !selected && (
                    <div className="rounded-xl border border-dashed border-[#E5DFD3] py-16 text-center text-[12px] italic text-slate-400">
                        Select a client from All Clients to view their profile.
                    </div>
                )}

                {/* ALL CLIENTS TAB */}
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
                        onSaveContact={handleSaveContact}
                        onChatContact={() => {
                            toast('Chat coming soon', { icon: '💬' });
                        }}
                        onEmailContact={(client, contact) => {
                            if (contact.email) {
                                window.location.href = `mailto:${contact.email}`;
                            } else {
                                toast.error('No email on file');
                            }
                        }}
                        onCallContact={(client, contact) => {
                            const phone = contact.personalPhone || contact.phone;
                            if (phone) {
                                window.location.href = `tel:${phone}`;
                            } else {
                                toast.error('No phone on file');
                            }
                        }}
                    />
                )}
            </div>

            {/* MODALS */}
            {addClientOpen && (
                <AddClientModal
                    constants={constants}
                    onClose={() => setAddClientOpen(false)}
                    onSaved={handleClientSaved}
                />
            )}

            {editClientOpen && selected && (
                <EditClientModal
                    client={selected}
                    constants={constants}
                    onClose={() => setEditClientOpen(false)}
                    onSaved={handleClientEdited}
                />
            )}

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
            className={`pb-3 font-semibold relative transition ${
                active ? 'text-[#A06126]' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            {children}
            {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
            )}
        </button>
    );
}