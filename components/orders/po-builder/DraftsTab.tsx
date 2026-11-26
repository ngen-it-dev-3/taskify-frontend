// components/orders/po-builder/DraftsTab.tsx
"use client";

import { FileText, Pencil, Trash2 } from "lucide-react";
import type { DraftPurchaseOrder } from "@/types/orders/po-builder/types";

interface DraftsTabProps {
    drafts: DraftPurchaseOrder[];
    onResumeDraft?: (draft: DraftPurchaseOrder) => void;
    onDeleteDraft: (id: string) => void;
}

export default function DraftsTab({
    drafts,
    onResumeDraft,
    onDeleteDraft,
}: DraftsTabProps) {
    const formatSavedDate = (dateValue?: string | number | Date) => {
        const date = dateValue ? new Date(dateValue) : new Date();
        if (Number.isNaN(date.getTime())) return String(dateValue || "—");
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
            {/* Top Modern Header Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
                        <FileText className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[13px] font-semibold text-slate-900">
                        Saved Drafts
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                        {drafts.length}
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200/80 bg-slate-50/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <th className="py-3 px-5">PO Ref</th>
                            <th className="py-3 px-4">Company</th>
                            <th className="py-3 px-4">Vendor</th>
                            <th className="py-3 px-4">Client</th>
                            <th className="py-3 px-4">Grand Total</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Saved</th>
                            <th className="py-3 px-5 text-right"></th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-[13px]">
                        {drafts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-14 px-6 text-center">
                                    <div className="mx-auto max-w-md space-y-1.5">
                                        <p className="text-[13.5px] font-medium text-slate-800">
                                            No drafts saved yet
                                        </p>
                                        <p className="text-[12px] text-slate-500 leading-relaxed">
                                            Use{" "}
                                            <span className="font-medium text-slate-700">
                                                Save as Draft
                                            </span>{" "}
                                            or{" "}
                                            <span className="font-medium text-slate-700">
                                                Send for Approval
                                            </span>{" "}
                                            on the Create Purchase Order tab to keep work here.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            drafts.map((draft) => {
                                const savedRaw = (
                                    draft as DraftPurchaseOrder & {
                                        savedAt?: string;
                                        updatedAt?: string;
                                    }
                                ).savedAt ??
                                    (draft as DraftPurchaseOrder & { updatedAt?: string })
                                        .updatedAt;

                                const isPending = draft.status === "Pending Approval";

                                return (
                                    <tr
                                        key={draft.id}
                                        className="group transition-colors duration-150 hover:bg-slate-50/90"
                                    >
                                        <td className="py-3.5 px-5 font-mono text-[12.5px] font-semibold text-slate-900 whitespace-nowrap">
                                            {draft.poRef?.trim() || "Untitled Draft"}
                                        </td>

                                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                                            {draft.companyName || "—"}
                                        </td>

                                        <td className="py-3.5 px-4 text-slate-600">
                                            {draft.vendor?.trim() || "—"}
                                        </td>

                                        <td className="py-3.5 px-4 text-slate-600">
                                            {draft.client?.trim() || "—"}
                                        </td>

                                        <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                                            {draft.currencySymbol}
                                            {draft.grandTotal.toLocaleString("en-US")}
                                        </td>

                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isPending
                                                        ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20"
                                                        : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/15"
                                                    }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${isPending ? "bg-amber-500" : "bg-slate-500"
                                                        }`}
                                                />
                                                {draft.status}
                                            </span>
                                        </td>

                                        <td className="py-3.5 px-4 font-mono text-[12px] text-slate-500 whitespace-nowrap">
                                            {formatSavedDate(savedRaw)}
                                        </td>

                                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onResumeDraft?.(draft)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-[0.99] cursor-pointer"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                    Resume Editing
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteDraft(draft.id)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50 cursor-pointer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}