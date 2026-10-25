// app/(dashboard)/tenders/submissions/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SubmissionHeader } from "@/components/tender/submission/SubmissionHeader";
import { SubmissionTable } from "@/components/tender/submission/SubmissionTable";
import { SubmissionDetail } from "@/components/tender/submission/SubmissionDetail";
import {
    useSubmissions,
    useSubmissionDetail,
} from "@/hooks/tender/useSubmissions";
import {
    sanitizeSubmissionDetail,
    toSubmissionUIRow,
} from "@/lib/api/tender.mapper";
import { tenderApi } from "@/lib/api/tender.api";
import { confirmToast } from "@/lib/confirmToast";
import { BidderList } from "@/components/tender/BidderList";
import { AddBidderModal, BidderRow } from "@/components/tender/AddBidderModal";
import { SecurityNotifyModal } from "@/components/tender/modal/SecurityNotifyModal";

type FilterType = "all" | "active" | "high" | "deadline" | "security";

export default function TenderSubmissionPage() {
    const router = useRouter();
    const { rows, loading: rowsLoading, refetch: refetchRows } = useSubmissions();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [bidderModalOpen, setBidderModalOpen] = useState(false);

    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notifying, setNotifying] = useState(false);

    // ✅ Filter States
    const [filterMode, setFilterMode] = useState<FilterType>("all");
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    useEffect(() => {
        if (!selectedId && rows.length > 0) {
            setSelectedId(rows[0].id);
        }
    }, [rows, selectedId]);

    const {
        data: detail,
        loading: detailLoading,
        refetch: refetchDetail,
    } = useSubmissionDetail(selectedId);

    // ✅ Calculate counts for the dropdown menu
    const counts = useMemo(() => {
        const mapped = rows.map(toSubmissionUIRow);
        return {
            all: mapped.length,
            active: mapped.filter((r) => r.submitted === "Not yet").length,
            high: mapped.filter((r) => r.priority === "high").length,
            deadline: mapped.filter((r) => {
                // Using the new lastDateOfSubmission property we added to the mapper
                if (!r.lastDateOfSubmission) return false;
                const days = Math.max(0, Math.ceil((new Date(r.lastDateOfSubmission).getTime() - Date.now()) / 86400000));
                return days <= 7;
            }).length,
            security: mapped.filter((r) => r.tenderSecurityPurchased).length,
        };
    }, [rows]);

    // ✅ Apply the active filter to the rows
    const filteredRows = useMemo(() => {
        const mapped = rows.map(toSubmissionUIRow);
        return mapped.filter((r) => {
            if (filterMode === "active") return r.submitted === "Not yet";
            if (filterMode === "high") return r.priority === "high";
            if (filterMode === "security") return r.tenderSecurityPurchased;
            if (filterMode === "deadline") {
                if (!r.lastDateOfSubmission) return false;
                const days = Math.max(0, Math.ceil((new Date(r.lastDateOfSubmission).getTime() - Date.now()) / 86400000));
                return days <= 7;
            }
            return true; // "all"
        });
    }, [rows, filterMode]);

    const handleDelete = (id: string) => {
        const row = rows.find((r) => r.id === id);
        confirmToast({
            title: `Delete ${row?.tenderer ?? "this submission"}?`,
            description: "This will permanently remove the tender and all its document tasks.",
            confirmLabel: "Delete",
            variant: "danger",
            onConfirm: async () => {
                const loadingId = toast.loading("Deleting submission...");
                try {
                    await tenderApi.remove(id);
                    toast.success("Submission deleted", { id: loadingId });
                    if (selectedId === id) setSelectedId(null);
                    await refetchRows();
                } catch (e) {
                    toast.error((e as Error).message || "Failed to delete", { id: loadingId });
                }
            },
        });
    };

    const handleSaveBidders = async (bidders: BidderRow[]) => {
        if (!detail) return;
        const loadingId = toast.loading("Saving bidders...");
        try {
            await tenderApi.update(detail.id, { otherParticipants: bidders });
            toast.success("Bidders saved", { id: loadingId });
            await refetchDetail();
        } catch (e) {
            toast.error((e as Error).message || "Failed to save bidders", { id: loadingId });
        }
    };

    const handleDeleteAllBidders = () => {
        if (!detail) return;
        confirmToast({
            title: `Clear all bidders?`,
            description: "This will remove every recorded bidder for this tender.",
            confirmLabel: "Clear",
            variant: "danger",
            onConfirm: async () => { await handleSaveBidders([]); },
        });
    };

    const handleNotifySend = async (emails: string[], note?: string) => {
        if (!detail) return;
        setNotifying(true);
        const loadingId = toast.loading("Notifying finance...");
        try {
            const res = await tenderApi.notifyFinance(detail.id, { emails, note });
            const sent = res?.sent ?? emails.length;
            const failed = res?.failed ?? 0;
            toast.success(failed === 0 ? `Finance notified (${sent} recipient${sent === 1 ? "" : "s"})` : `Notified ${sent} (${failed} failed)`, { id: loadingId });
            setNotifyOpen(false);
        } catch (e) {
            toast.error((e as Error).message || "Failed to notify finance", { id: loadingId });
            throw e;
        } finally {
            setNotifying(false);
        }
    };

    const handleFinalSubmit = async () => {
        if (!detail || submitting) return;
        const row = rows.find((r) => r.id === detail.id);
        confirmToast({
            title: `Submit ${row?.tenderer ?? "this tender"}?`,
            description: "The tender will be marked as Submitted and moved to the Submitted tab. This cannot be undone from here.",
            confirmLabel: "Submit Tender",
            variant: "default",
            onConfirm: async () => {
                setSubmitting(true);
                const loadingId = toast.loading("Submitting tender...");
                try {
                    await tenderApi.changeStage(detail.id, "submitted", "Submitted to client");
                    toast.success("Tender marked as submitted", { id: loadingId });
                    await refetchRows();
                    setSelectedId(null);
                    router.push("/tenders/manage?tab=submitted");
                } catch (e) {
                    toast.error((e as Error).message || "Failed to submit", { id: loadingId });
                } finally {
                    setSubmitting(false);
                }
            },
        });
    };

    const handlePreparationChanged = async () => {
        await refetchRows();
        await refetchDetail();
    };

    const handleTaskMutated = async () => {
        await refetchDetail();
        await refetchRows();
    };

    const handleSilentUpdate = async () => {
        await refetchRows();
    };

    return (
        <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
            <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
                <SubmissionHeader />

                {/* ✅ Top bar with "Showing selected tender" and "Show more" dropdown */}
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] text-slate-500">
                        Showing the selected tender — <span className="font-semibold text-slate-700">{detail?.tenderer || 'None'}</span>
                    </p>

                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                            Show more <ChevronDown className="h-3 w-3" />
                        </button>

                        {showFilterMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                                <div className="absolute right-0 top-full z-20 mt-1 w-[240px] rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                                    <button onClick={() => { setFilterMode("all"); setShowFilterMenu(false); }} className={`flex w-full items-center justify-between px-3 py-2 text-[11px] hover:bg-slate-50 ${filterMode === 'all' ? 'text-[#a97400] font-bold' : 'text-slate-700'}`}>
                                        All tenders <span className="text-slate-400">{counts.all}</span>
                                    </button>
                                    <button onClick={() => { setFilterMode("active"); setShowFilterMenu(false); }} className={`flex w-full items-center justify-between px-3 py-2 text-[11px] hover:bg-slate-50 ${filterMode === 'active' ? 'text-[#a97400] font-bold' : 'text-slate-700'}`}>
                                        Active — not yet submitted <span className="text-slate-400">{counts.active}</span>
                                    </button>
                                    <button onClick={() => { setFilterMode("high"); setShowFilterMenu(false); }} className={`flex w-full items-center justify-between px-3 py-2 text-[11px] hover:bg-slate-50 ${filterMode === 'high' ? 'text-[#a97400] font-bold' : 'text-slate-700'}`}>
                                        High priority <span className="text-slate-400">{counts.high}</span>
                                    </button>
                                    <button onClick={() => { setFilterMode("deadline"); setShowFilterMenu(false); }} className={`flex w-full items-center justify-between px-3 py-2 text-[11px] hover:bg-slate-50 ${filterMode === 'deadline' ? 'text-[#a97400] font-bold' : 'text-slate-700'}`}>
                                        Deadline within 7 days <span className="text-slate-400">{counts.deadline}</span>
                                    </button>
                                    <button onClick={() => { setFilterMode("security"); setShowFilterMenu(false); }} className={`flex w-full items-center justify-between px-3 py-2 text-[11px] hover:bg-slate-50 ${filterMode === 'security' ? 'text-[#a97400] font-bold' : 'text-slate-700'}`}>
                                        Tender security purchased <span className="text-slate-400">{counts.security}</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {rowsLoading ? (
                    <div className="h-[260px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
                ) : rows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
                        No submissions yet.
                    </div>
                ) : (
                    <SubmissionTable
                        rows={filteredRows}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onDelete={handleDelete}
                        onView={setSelectedId}
                    />
                )}

                {!detail && detailLoading && (
                    <div className="h-[420px] animate-pulse rounded-xl border border-amber-200 bg-white" />
                )}

                {detail && (
                    <>
                        <SubmissionDetail
                            data={{
                                ...(() => {
                                    const sanitized = sanitizeSubmissionDetail(detail);
                                    return {
                                        ...sanitized,
                                        info: {
                                            ...sanitized.info,
                                            lastDateOfSubmissionRaw: detail.info?.lastDateOfSubmission,
                                            attachments: sanitized.info.attachments?.map((attachment, index) => ({
                                                ...attachment,
                                                _id: attachment._id ?? `${detail.id}-attachment-${index}`,
                                            })),
                                        },
                                    };
                                })(),
                                notifyAction: {
                                    label: "Notify Finance",
                                    onClick: () => setNotifyOpen(true),
                                    loading: notifying,
                                },
                            }}
                            onTaskMutated={handleTaskMutated}
                            onPreparationChanged={handlePreparationChanged}
                            onHeaderUpdated={handleSilentUpdate}
                            submitAction={{
                                label: "Submit Tender",
                                onClick: handleFinalSubmit,
                                loading: submitting,
                            }}
                        />

                        <BidderList
                            bidders={detail.otherParticipants ?? []}
                            onAdd={() => setBidderModalOpen(true)}
                            onEdit={() => setBidderModalOpen(true)}
                            onDelete={() => handleDeleteAllBidders()}
                        />
                    </>
                )}
            </div>

            {detail && (
                <AddBidderModal
                    open={bidderModalOpen}
                    onOpenChange={setBidderModalOpen}
                    initial={detail.otherParticipants ?? []}
                    onSave={handleSaveBidders}
                />
            )}

            {detail && (
                <SecurityNotifyModal
                    open={notifyOpen}
                    onOpenChange={setNotifyOpen}
                    entity={detail.tenderer}
                    variant="submission"
                    onSend={handleNotifySend}
                />
            )}
        </main>
    );
}