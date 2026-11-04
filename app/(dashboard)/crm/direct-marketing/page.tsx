// app/(dashboard)/dmar/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ExternalLink, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import {
    DmarApi,
    type DmarActivity,
    type DmarStats,
    type SectorVisitsData,
    type MonthlyPlanData,
    type TeamMember,
    type Team,
    type DmarConstants,
} from '@/services/dmar.service';

import { FilterBar, type DmarFilters } from '@/components/CRM/dmar/FilterBar';
import { ActivityTable } from '@/components/CRM/dmar/ActivityTable';
import { LogActivityModal } from '@/components/CRM/dmar/LogActivityModal';
import { formatDate, formatFull } from '@/components/CRM/dmar/constants';
import { KpiRow } from '@/components/CRM/dmar/KpiCards';
import { SectorPanel } from '@/components/CRM/dmar/SectorPanel';
import { MonthlyPlanPanel } from '@/components/CRM/dmar/MonthlyPlanPanel';

export default function DmarPage() {
    const router = useRouter();

    // ---- Data ----
    const [activities, setActivities] = useState<DmarActivity[]>([]);
    const [stats, setStats] = useState<DmarStats | null>(null);
    const [sectorData, setSectorData] = useState<SectorVisitsData | null>(null);
    const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlanData | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [constants, setConstants] = useState<DmarConstants | null>(null);

    // ---- UI ----
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<Team>('Marketing');
    const [selectedActivity, setSelectedActivity] = useState<DmarActivity | null>(null);
    const [editingActivity, setEditingActivity] = useState<DmarActivity | null>(null);
    const [logOpen, setLogOpen] = useState(false);

    // ⭐ Delete State
    const [deletingActivity, setDeletingActivity] = useState<DmarActivity | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [filters, setFilters] = useState<DmarFilters>({
        search: '',
        activityType: 'all',
        sector: 'all',
        clientType: 'all',
        loggedBy: 'all',
        dateRange: 'this-month',
    });

    // ---- Compute date range ----
    const dateRange = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();

        switch (filters.dateRange) {
            case 'this-month':
                return {
                    dateFrom: new Date(y, m, 1).toISOString(),
                    dateTo: new Date(y, m + 1, 0, 23, 59, 59).toISOString(),
                };
            case 'last-month':
                return {
                    dateFrom: new Date(y, m - 1, 1).toISOString(),
                    dateTo: new Date(y, m, 0, 23, 59, 59).toISOString(),
                };
            case 'this-year':
                return {
                    dateFrom: new Date(y, 0, 1).toISOString(),
                    dateTo: new Date(y, 11, 31, 23, 59, 59).toISOString(),
                };
            default:
                return {};
        }
    }, [filters.dateRange]);

    // ============================================================
    // LOAD
    // ============================================================
    const load = useCallback(async () => {
        try {
            setLoading(true);

            const base: Record<string, any> = { ...dateRange };
            if (filters.search) base.search = filters.search;
            if (filters.activityType !== 'all') base.activityType = filters.activityType;
            if (filters.sector !== 'all') base.sector = filters.sector;
            if (filters.clientType !== 'all') base.clientType = filters.clientType;
            if (filters.loggedBy !== 'all') base.loggedBy = filters.loggedBy;

            const [
                listRes,
                statsRes,
                sectorRes,
                planRes,
                membersRes,
                constRes,
            ] = await Promise.all([
                DmarApi.list({ ...base, limit: 500 }),
                DmarApi.stats(base),
                DmarApi.sectorVisits({ ...base, team }),
                DmarApi.monthlyPlan(base),
                DmarApi.teamMembers(),
                DmarApi.constants(),
            ]);

            setActivities(listRes.items);
            setStats(statsRes);
            setSectorData(sectorRes);
            setMonthlyPlan(planRes);
            setTeamMembers(membersRes);
            setConstants(constRes);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load DMAR');
        } finally {
            setLoading(false);
        }
    }, [filters, team, dateRange]);

    useEffect(() => {
        load();
    }, [load]);

    // ============================================================
    // HANDLERS
    // ============================================================
    const handleSaved = async () => {
        setLogOpen(false);
        setEditingActivity(null);
        await load();
    };

    const handleMarkSold = async (a: DmarActivity) => {
        try {
            await DmarApi.markSold(a.id);
            toast.success(`Marked "${a.company}" as Sold`);
            await load();
        } catch (e: any) {
            toast.error(e.message || 'Failed to mark sold');
        }
    };

    // ⭐ Open custom modal instead of window.confirm
    const handleDelete = (a: DmarActivity) => {
        setDeletingActivity(a);
    };

    // ⭐ Actual deletion logic
    const confirmDelete = async () => {
        if (!deletingActivity) return;
        try {
            setIsDeleting(true);
            await DmarApi.remove(deletingActivity.id);
            toast.success('Activity deleted');
            if (selectedActivity?.id === deletingActivity.id) setSelectedActivity(null);
            setDeletingActivity(null);
            await load();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete');
        } finally {
            setIsDeleting(false);
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <main className="min-h-screen bg-[#FDFBF7] pb-20 text-[#1E293B]">
            <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
                {/* Header */}
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A06126] mb-1">
                            CRM Dashboard
                        </div>
                        <h1 className="font-serif text-3xl font-bold text-[#0F2D4A]">
                            DMAR — Daily Marketing Activity Report
                        </h1>
                        <p className="mt-1 max-w-3xl text-xs text-slate-500 leading-relaxed">
                            Every call, visit, email, and presentation, logged once — feeds
                            this report and your My Tasks list automatically.
                        </p>
                    </div>

                    <button
                        onClick={() => setLogOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#A06126] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#88501E]"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Log Activity
                    </button>
                </header>

                {/* KPI Row */}
                <KpiRow stats={stats} />

                {/* Two panels */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <SectorPanel
                        data={sectorData}
                        activeTeam={team}
                        onTeamChange={setTeam}
                        onSectorClick={(s) =>
                            setFilters((f) => ({ ...f, sector: f.sector === s ? 'all' : s }))
                        }
                        selectedSector={filters.sector !== 'all' ? filters.sector : undefined}
                    />

                    <MonthlyPlanPanel
                        data={monthlyPlan}
                        onOpenSettings={() => router.push('/settings/universal')}
                    />
                </div>

                {/* Filter Bar */}
                <FilterBar
                    value={filters}
                    onChange={setFilters}
                    teamMembers={teamMembers}
                    sectors={constants?.ALL_SECTORS ?? []}
                />

                {/* Activity Table */}
                {loading && activities.length === 0 ? (
                    <div className="h-[300px] animate-pulse rounded-xl border border-[#EBE6DF] bg-white" />
                ) : (
                    <ActivityTable
                        activities={activities}
                        selectedId={selectedActivity?.id ?? null}
                        onSelect={setSelectedActivity}
                        onEdit={setEditingActivity}
                        onMarkSold={handleMarkSold}
                        onDelete={handleDelete}
                    />
                )}

                {/* Selected Activity — expanded detail panel */}
                {selectedActivity && (
                    <ActivityDetail
                        activity={selectedActivity}
                        onClose={() => setSelectedActivity(null)}
                        onEdit={() => setEditingActivity(selectedActivity)}
                        onViewClient={() => {
                            if (selectedActivity.client360Id) {
                                router.push(`/crm/client/${selectedActivity.client360Id}`);
                            } else {
                                toast('No client linked yet', { icon: 'ℹ️' });
                            }
                        }}
                        onViewTask={() => {
                            if (selectedActivity.syncedTaskId) {
                                router.push(`/tasks/${selectedActivity.syncedTaskId}`);
                            } else {
                                toast('No task linked yet', { icon: 'ℹ️' });
                            }
                        }}
                    />
                )}
            </div>

            {/* Modals */}
            {logOpen && (
                <LogActivityModal
                    constants={constants}
                    onClose={() => setLogOpen(false)}
                    onSaved={handleSaved}
                />
            )}

            {editingActivity && (
                <LogActivityModal
                    constants={constants}
                    initial={editingActivity}
                    onClose={() => setEditingActivity(null)}
                    onSaved={handleSaved}
                />
            )}

            {/* ⭐ Custom Delete Modal */}
            {deletingActivity && (
                <DeleteConfirmModal
                    title="Delete Activity"
                    message={`Are you sure you want to delete the activity for "${deletingActivity.company}"? This action cannot be undone.`}
                    onClose={() => setDeletingActivity(null)}
                    onConfirm={confirmDelete}
                    loading={isDeleting}
                />
            )}
        </main>
    );
}

/* =========================================================
   EXPANDED ROW DETAIL
   ========================================================= */
function ActivityDetail({
    activity,
    onClose,
    onEdit,
    onViewClient,
    onViewTask,
}: {
    activity: DmarActivity;
    onClose: () => void;
    onEdit: () => void;
    onViewClient: () => void;
    onViewTask: () => void;
}) {
    return (
        <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                    <div className="inline-flex items-center gap-2 mb-1">
                        <span className="inline-block rounded-full bg-[#EEF4FB] text-[#1F3864] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            {activity.activityType}
                        </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#0F2D4A]">
                        {activity.company}
                    </h3>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                    <button
                        onClick={onViewClient}
                        className="inline-flex items-center gap-1 text-[#A06126] font-semibold hover:underline"
                    >
                        View in Client 360 <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                        onClick={onViewTask}
                        className="inline-flex items-center gap-1 text-[#A06126] font-semibold hover:underline"
                    >
                        View synced task in My Tasks <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                        onClick={onEdit}
                        className="rounded border border-[#E2DBD1] px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Edit
                    </button>
                </div>
            </div>

            <div className="divide-y divide-[#F0EBE3] text-[11.5px]">
                <DetailRow label="Date" value={formatDate(activity.date)} />
                <DetailRow label="Product / Solution" value={activity.product || '—'} />
                <DetailRow label="Tentative Value" value={formatFull(activity.value)} />
                <DetailRow label="Current Status" value={activity.status} />
                <DetailRow label="Client Type" value={activity.clientType} />
                <DetailRow label="Sector" value={activity.sector || '—'} />
                <DetailRow label="Area" value={activity.area || '—'} />
                <DetailRow label="Logged By" value={activity.loggedByName || '—'} />
                {activity.followUpDate && (
                    <DetailRow label="Follow-up Date" value={formatDate(activity.followUpDate)} />
                )}
                {activity.notes && <DetailRow label="Notes" value={activity.notes} />}
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[180px_1fr] items-start">
            <div className="py-2.5 text-slate-500">{label}</div>
            <div className="py-2.5 font-semibold text-slate-800">{value}</div>
        </div>
    );
}

/* =========================================================
   DELETE CONFIRM MODAL
   ========================================================= */
function DeleteConfirmModal({
    title,
    message,
    onClose,
    onConfirm,
    loading,
}: {
    title: string;
    message: string;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#0F2D4A]">
                            {title}
                        </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                        {message}
                    </p>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-[#E2DBD1] bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                    >
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {loading ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}