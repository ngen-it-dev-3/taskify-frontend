// components/tender/security/SecurityViewModal.tsx
"use client";

import { X, FileText, ExternalLink } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: any;
}

export function SecurityViewModal({ open, onOpenChange, row }: Props) {
    if (!open || !row) return null;

    // ফাইল লিংক তৈরি করা
    const fileUrl = row.documentUrl
        ? row.documentUrl.startsWith("http")
            ? row.documentUrl
            : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}${row.documentUrl}`
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl relative overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 relative bg-slate-50">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <h2 className="font-serif text-lg font-bold text-slate-900">Security Details</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{row.entity} · {row.type}</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tender / Client</p>
                            <p className="font-semibold text-slate-800">{row.clientDescription}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Contract Value</p>
                            <p className="font-mono font-semibold text-slate-800">৳{row.amount.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {row.type !== "Payments" && (
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Purchase Date</p>
                                <p className="text-slate-700">{row.purchaseDate || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Validity Date</p>
                                <p className="text-slate-700">{row.validityDate || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Purchase From</p>
                                <p className="text-slate-700">{row.purchaseFrom || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Security Closing Date</p>
                                <p className="text-slate-700">{row.securityClosingDate || "—"}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</p>
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 mt-1">
                                {row.paymentStatus}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Delivery Status</p>
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 mt-1">
                                {row.delivery || "—"}
                            </span>
                        </div>
                    </div>

                    {/* ফাইল সেকশন */}
                    <div className="border-t border-slate-100 pt-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Attached Document</p>
                        {fileUrl ? (
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-2 text-slate-700">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <span className="text-xs font-semibold">View Document</span>
                                </div>
                                <ExternalLink className="h-4 w-4 text-slate-400" />
                            </a>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No document attached.</p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}