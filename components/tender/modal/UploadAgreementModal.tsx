// components/tender/modal/UploadAgreementModal.tsx
"use client";

import { useState } from "react";
import { X, Upload, Loader2, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { tenderApi } from "@/lib/api/tender.api";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenderId: string;
    onSaved: () => void;
}

export function UploadAgreementModal({ open, onOpenChange, tenderId, onSaved }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<"agreement" | "delivery">("agreement");

    // ⭐ Dates State
    const [noaDate, setNoaDate] = useState("");
    const [contractDate, setContractDate] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [invoiceDate, setInvoiceDate] = useState("");
    const [challanDate, setChallanDate] = useState("");
    const [mushakDate, setMushakDate] = useState("");

    if (!open) return null;

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file");
            return;
        }
        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }

        setSaving(true);
        const loadingId = toast.loading("Uploading document...");

        try {
            // ⭐ FormData তৈরি করুন
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", title);
            formData.append("category", category);

            if (category === "agreement") {
                formData.append("noaDate", noaDate);
                formData.append("contractDate", contractDate);
            } else {
                formData.append("deliveryDate", deliveryDate);
                formData.append("invoiceDate", invoiceDate);
                formData.append("challanDate", challanDate);
                formData.append("mushakDate", mushakDate);
            }

            // ⭐ আসল API কল
            await tenderApi.uploadAgreement(tenderId, formData);

            toast.success("Document uploaded successfully", { id: loadingId });
            setFile(null);
            setTitle("");
            onSaved();
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e.message || "Upload failed", { id: loadingId });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Upload Agreement / Delivery</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">Add the signed agreement or product delivery documents.</p>
                    </div>
                    <button onClick={() => !saving && onOpenChange(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">

                    {/* Title & Category */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Title *</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Signed Contract" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] focus:border-[#a97400] outline-none" />
                        </div>
                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</label>
                            <select value={category} onChange={(e: any) => setCategory(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] focus:border-[#a97400] outline-none">
                                <option value="agreement">Agreement</option>
                                <option value="delivery">Product Delivery</option>
                            </select>
                        </div>
                    </div>

                    {/* ⭐ Conditional Date Fields */}
                    {category === "agreement" ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">NOA Collect Last Date</label>
                                <input type="date" value={noaDate} onChange={(e) => setNoaDate(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] focus:border-[#a97400] outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Contract Last Date</label>
                                <input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] focus:border-[#a97400] outline-none" />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Delivery Last Date</label>
                                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] focus:border-[#a97400] outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Invoice Submit Date</label>
                                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] focus:border-[#a97400] outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Challan Submit Date</label>
                                <input type="date" value={challanDate} onChange={(e) => setChallanDate(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] focus:border-[#a97400] outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Mushak - 6.3 Submit Date</label>
                                <input type="date" value={mushakDate} onChange={(e) => setMushakDate(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] focus:border-[#a97400] outline-none" />
                            </div>
                        </div>
                    )}

                    {/* File Upload */}
                    <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">File *</label>
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                            <div className="flex flex-col items-center justify-center pt-3 pb-3">
                                {file ? (
                                    <>
                                        <FileText className="w-6 h-6 mb-1 text-[#a97400]" />
                                        <p className="text-[11px] font-semibold text-slate-700 truncate max-w-[200px]">{file.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 mb-1 text-slate-400" />
                                        <p className="text-[11px] font-semibold text-slate-700">Click to upload</p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
                    <button onClick={() => onOpenChange(false)} disabled={saving} className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={handleUpload} disabled={!file || !title || saving} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[11px] font-semibold text-white hover:bg-[#8f6100] disabled:opacity-50">
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        {saving ? "Uploading..." : "Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
}