// app/(dashboard)/crm/sales-orders/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

import {
    SalesOrderApi,
    type SalesOrder,
    type SalesOrderStats,
    type SalesOrderStage,
} from '@/services/salesOrder.service';
import { SalesOrderTable } from '@/components/CRM/sales-orders/SalesOrderTable';
import { SalesOrderDetail } from '@/components/CRM/sales-orders/SalesOrderDetail';
import { AddOrderModal } from '@/components/CRM/sales-orders/AddOrderModal';
import { EditOrderModal } from '@/components/CRM/sales-orders/EditOrderModal';
import { fmtFull } from '@/components/CRM/sales-orders/constants';

const STAGE_TABS: { key: SalesOrderStage | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'Order Placed', label: 'Order Placed' },
    { key: 'Sourcing', label: 'Sourcing' },
    { key: 'Procurement', label: 'Procurement' },
    { key: 'Delivery', label: 'Delivery' },
    { key: 'Invoiced', label: 'Invoiced' },
    { key: 'Payment Received', label: 'Payment Received' },
];

export default function SalesOrdersPage() {
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [stats, setStats] = useState<SalesOrderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);

    const [activeStage, setActiveStage] = useState<SalesOrderStage | 'all'>('all');
    const [search, setSearch] = useState('');

    // ============================================================
    // LOAD
    // ============================================================
    const load = useCallback(async () => {
        try {
            setLoading(true);

            const params: Record<string, any> = { limit: 200 };
            if (activeStage !== 'all') params.stage = activeStage;
            if (search.trim()) params.search = search.trim();

            const [listRes, statsRes] = await Promise.all([
                SalesOrderApi.list(params),
                SalesOrderApi.stats(),
            ]);

            setOrders(listRes.items);
            setStats(statsRes);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [activeStage, search]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const t = setTimeout(() => {
            load();
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const selected = useMemo(
        () => orders.find((o) => o.id === selectedId) ?? null,
        [orders, selectedId]
    );

    // ============================================================
    // DELETE HANDLER
    // ============================================================
    const handleDelete = async (order: SalesOrder) => {
        if (!confirm(`Delete order "${order.poRef}"? This cannot be undone.`)) return;

        try {
            await SalesOrderApi.remove(order.id);
            toast.success('Order deleted');
            if (selectedId === order.id) setSelectedId(null);
            await load();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete order');
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <main className="min-h-screen bg-[#FDFBF7] pb-20 text-[#1E293B]">
            <div className="mx-auto max-w-[1600px] space-y-5 p-6 lg:p-8">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A06126] mb-1">
                            CRM Dashboard
                        </div>
                        <h1 className="font-serif text-3xl font-bold text-[#0F2D4A]">
                            Sales Orders
                        </h1>
                        <p className="mt-1 max-w-3xl text-xs text-slate-500 leading-relaxed">
                            Every client order from placement to payment — one stage tracker
                            everyone reads the same way. Orders are auto-created when a
                            quotation, tender, or forecast is marked as won.
                        </p>
                    </div>

                    <button
                        onClick={() => setAddOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#A06126] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#88501E] transition"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Order
                    </button>
                </header>

                {/* KPI cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiCard
                            label="Total Orders (FY26)"
                            value={String(stats.totalOrders)}
                        />
                        <KpiCard label="In Progress" value={String(stats.inProgress)} />
                        <KpiCard label="Delivered" value={String(stats.delivered)} />
                        <KpiCard
                            label="Payment Pending"
                            value={fmtFull(stats.paymentPending)}
                            valueClass="text-rose-600"
                        />
                    </div>
                )}

                {/* Stage tabs */}
                <div className="border-b border-[#EBE6DF] flex items-center gap-6 text-xs overflow-x-auto">
                    {STAGE_TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActiveStage(t.key)}
                            className={`pb-3 font-semibold relative whitespace-nowrap transition ${activeStage === t.key
                                    ? 'text-[#A06126]'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {t.label}
                            {activeStage === t.key && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[260px] flex-1">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search PO ref, client, or product…"
                            className="w-full rounded-lg border border-[#E2DBD1] bg-white pl-9 pr-8 py-2 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {loading && orders.length === 0 ? (
                    <div className="h-[300px] animate-pulse rounded-xl border border-[#EBE6DF] bg-white" />
                ) : (
                    <SalesOrderTable
                        orders={orders}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onEdit={(o) => setEditingOrder(o)}
                        onDelete={handleDelete}
                    />
                )}

                {/* Detail */}
                {selected && <SalesOrderDetail order={selected} onRefresh={load} />}
            </div>

            {/* Add Order Modal */}
            {addOpen && (
                <AddOrderModal
                    onClose={() => setAddOpen(false)}
                    onSaved={async () => {
                        setAddOpen(false);
                        await load();
                    }}
                />
            )}

            {/* ⭐ Edit Order Modal */}
            {editingOrder && (
                <EditOrderModal
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSaved={async () => {
                        setEditingOrder(null);
                        await load();
                    }}
                />
            )}
        </main>
    );
}

function KpiCard({
    label,
    value,
    valueClass = '',
}: {
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div className="rounded-xl border border-[#EBE6DF] bg-white p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {label}
            </div>
            <div
                className={`mt-1.5 font-mono text-xl font-bold text-[#0F2D4A] ${valueClass}`}
            >
                {value}
            </div>
        </div>
    );
}