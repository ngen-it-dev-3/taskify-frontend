// components/tender/security/EditSecurityModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, UploadCloud, FileText, Eye } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: any;
    onSave: (id: string, data: FormData) => Promise<void>; // ✅ FormData টাইপ
}

export function EditSecurityModal({ open, onOpenChange, row, onSave }: Props) {
    const [entity, setEntity] = useState("NGL-26");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("Tender Security");
    const [amount, setAmount] = useState<number | "">("");
    const [dueDate, setDueDate] = useState("");
    
    // ✅ নতুন ফিল্ড
    const [purchaseDate, setPurchaseDate] = useState("");
    const [securityClosingDate, setSecurityClosingDate] = useState("");
    const [purchaseFrom, setPurchaseFrom] = useState("");
    const [purchaseType, setPurchaseType] = useState("Bank");
    const [validityDate, setValidityDate] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [existingDocUrl, setExistingDocUrl] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && row) {
            setEntity(row.entity || "NGL-26");
            setDescription(row.clientDescription || "");
            setType(row.type || "Tender Security");
            setAmount(row.amount || "");
            
            // ডেট ফরম্যাট ঠিক করা (YYYY-MM-DD)
            const formatDate = (dateStr: string) => {
                if (!dateStr || dateStr === "-") return "";
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
            };

            setDueDate(formatDate(row.dueDate));
            setPurchaseDate(formatDate(row.purchaseDate));
            setSecurityClosingDate(formatDate(row.securityClosingDate));
            setValidityDate(formatDate(row.validityDate));
            setPurchaseFrom(row.purchaseFrom || "");
            setPurchaseType(row.purchaseType || "Bank");
            
            setFile(null);
            setPreviewUrl(null);
            setExistingDocUrl(row.documentUrl || null);
        }
    }, [open, row]);

    if (!open || !row) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (selectedFile) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleSave = async () => {
        if (!description.trim() || !amount) return;
        setSaving(true);
        try {
            // ✅ FormData তৈরি করুন
            const formData = new FormData();
            formData.append("entity", entity);
            formData.append("clientDescription", description);
            formData.append("type", type);
            formData.append("amount", String(amount));
            
            if (dueDate) formData.append("dueDate", dueDate);
            
            const isSecurityType = type === "Tender Security" || type === "Performance Security" || type === "Bank Guarantee";
            if (isSecurityType) {
                if (purchaseDate) formData.append("purchaseDate", purchaseDate);
                if (securityClosingDate) formData.append("securityClosingDate", securityClosingDate);
                if (purchaseFrom) formData.append("purchaseFrom", purchaseFrom);
                if (purchaseType) formData.append("purchaseType", purchaseType);
                if (validityDate) formData.append("validityDate", validityDate);
            }

            if (file) {
                formData.append("document", file);
            }

            await onSave(row.id, formData);
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl relative max-h-[90vh] overflow-y-auto">
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                        <X className="h-4 w-4" />
                    </button>
                    <h2 className="font-serif text-xl font-bold text-slate-900">Edit Security Record</h2>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Entity</label>
                            <select value={entity} onChange={(e) => setEntity(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-2 text-xs">
                                <option value="NGL-26">NGL-26</option>
                                <option value="NG-26">NG-26</option>
                                <option value="JT">JT</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Type</label>
                            <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-2 text-xs">
                                <option value="Tender Security">Tender Security</option>
                                <option value="Performance Security">Performance Security</option>
                                <option value="Payments">Payments</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Description / Tender Name</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-3 text-xs" />
                    </div>

                    {(type === "Tender Security" || type === "Performance Security") && (
                        <div className="grid grid-cols-2 gap-4 border p-3 rounded bg-slate-50">
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase">Security Details</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Price (Amount)</label>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} className="h-9 w-full rounded border border-slate-300 px-3 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Purchase Date</label>
                                <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-3 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Security Closing Date</label>
                                <input type="date" value={securityClosingDate} onChange={(e) => setSecurityClosingDate(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-3 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Purchase From</label>
                                <input type="text" value={purchaseFrom} onChange={(e) => setPurchaseFrom(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-3 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Purchase Type</label>
                                <select value={purchaseType} onChange={(e) => setPurchaseType(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-2 text-xs">
                                    <option value="Bank">Bank</option>
                                    <option value="Insurance">Insurance</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Validity Date</label>
                                <input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-3 text-xs" />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Update Document</label>
                                {existingDocUrl && !file && (
                                    <p className="text-[10px] text-green-600 mb-2 font-semibold">A document is already attached. Choose a new file to replace it.</p>
                                )}
                                <div className="flex items-center gap-3">
                                    <input type="file" id="edit-security-doc" onChange={handleFileChange} className="hidden" />
                                    <label htmlFor="edit-security-doc" className="inline-flex h-9 cursor-pointer items-center justify-center rounded border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                                        <UploadCloud className="h-4 w-4 mr-1.5 text-slate-500" />
                                        Browse New File
                                    </label>
                                    <span className="text-xs text-slate-500 truncate max-w-[180px]">
                                        {file ? file.name : "No new file selected"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Due Date */}
                    {type === "Payments" && (
                        <div className="grid grid-cols-2 gap-4 border p-3 rounded bg-slate-50">
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase">Payment Details</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Contract Value (Amount)</label>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} className="h-9 w-full rounded border border-slate-300 px-3 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Due Date</label>
                                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-3 text-xs" />
                            </div>
                        </div>
                    )}

                    <button onClick={handleSave} disabled={saving || !description || !amount} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded bg-[#a97400] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#8f6100] disabled:opacity-50">
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}