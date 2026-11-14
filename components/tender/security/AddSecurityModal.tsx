// components/tender/security/AddSecurityModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2, UploadCloud, FileText, Image as ImageIcon, Eye } from "lucide-react"; // ✅ নতুন আইকন যোগ করা হলো

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: FormData) => Promise<void>;
}

export function AddSecurityModal({ open, onOpenChange, onSave }: Props) {
    const [entity, setEntity] = useState("NGL-26");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("Tender Security");
    const [amount, setAmount] = useState<number | "">("");

    // ✅ সিকিউরিটি ফিল্ড
    const [purchaseDate, setPurchaseDate] = useState("");
    const [securityClosingDate, setSecurityClosingDate] = useState("");
    const [purchaseFrom, setPurchaseFrom] = useState("");
    const [purchaseType, setPurchaseType] = useState("Bank");
    const [validityDate, setValidityDate] = useState("");
    const [file, setFile] = useState<File | null>(null);

    // ✅ নতুন স্টেট: মডালে প্রিভিউ দেখানোর জন্য
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // ✅ পেমেন্ট ফিল্ড
    const [dueDate, setDueDate] = useState("");

    const [saving, setSaving] = useState(false);

    if (!open) return null;

    // ✅ ফাইল পরিবর্তন হলে প্রিভিউ লিংক তৈরি করুন
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);

        if (selectedFile) {
            const objectUrl = URL.createObjectURL(selectedFile);
            setPreviewUrl(objectUrl);
        } else {
            setPreviewUrl(null);
        }
    };

    // ✅ ফাইল রিমুভ করলে প্রিভিউ লিংক রিমুভ করুন
    const handleRemoveFile = () => {
        setFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleSave = async () => {
        if (!description.trim() || !amount) return;
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("entity", entity);
            formData.append("clientDescription", description);
            formData.append("type", type);
            formData.append("amount", String(amount));
            formData.append("invoiceNo", "No invoice yet");
            formData.append("receivedAmount", "0");
            formData.append("delivery", "Pending");
            formData.append("docsStatus", file ? "Attached" : "Missing");

            const isSecurityType = type === "Tender Security" || type === "Performance Security" || type === "Bank Guarantee";
            const isPaymentType = type === "Payment" || type === "Payments" || type === "Security & Guarantees";

            if (isSecurityType) {
                if (purchaseDate) formData.append("purchaseDate", purchaseDate);
                if (securityClosingDate) formData.append("securityClosingDate", securityClosingDate);
                if (purchaseFrom) formData.append("purchaseFrom", purchaseFrom);
                if (purchaseType) formData.append("purchaseType", purchaseType);
                if (validityDate) formData.append("validityDate", validityDate);
            }
            if (isPaymentType && dueDate) {
                formData.append("dueDate", dueDate);
            }
            if (file) {
                formData.append("document", file);
            }

            await onSave(formData);

            // Reset
            setDescription(""); setAmount(""); setPurchaseDate("");
            setSecurityClosingDate(""); setPurchaseFrom(""); setValidityDate("");
            setDueDate(""); handleRemoveFile();
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
                    <h2 className="font-serif text-xl font-bold text-slate-900">Add Security Record</h2>
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
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">{type} Price (Amount)</label>
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
                                <input type="text" placeholder="Bank Name" value={purchaseFrom} onChange={(e) => setPurchaseFrom(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-3 text-xs" />
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

                            {/* ✅ কাস্টম ফাইল আপলোড ও প্রিভিউ UI */}
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Choose File (Document)</label>

                                {!file ? (
                                    // ফাইল সিলেক্ট করার বাটন
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            id="security-doc-upload"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="security-doc-upload"
                                            className="inline-flex h-9 cursor-pointer items-center justify-center rounded border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                        >
                                            <UploadCloud className="h-4 w-4 mr-1.5 text-slate-500" />
                                            Browse File
                                        </label>
                                        <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                            No file selected
                                        </span>
                                    </div>
                                ) : (
                                    // ফাইল সিলেক্ট করার পর প্রিভিউ কার্ড
                                    <div className="relative rounded-lg border border-slate-200 bg-white p-3 flex items-start gap-4">

                                        {/* ইমেজ প্রিভিউ */}
                                        {file.type.startsWith("image/") && previewUrl && (
                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                                                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                            </div>
                                        )}

                                        {/* পিডিএফ বা অন্যান্য ফাইলের আইকন */}
                                        {!file.type.startsWith("image/") && (
                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                                                <FileText className="h-8 w-8 text-blue-500" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>

                                            <div className="flex items-center gap-3 mt-2">
                                                {/* নতুন ট্যাবে ফাইল ওপেন করার লিংক */}
                                                <a
                                                    href={previewUrl!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                                                >
                                                    <Eye className="h-3 w-3" /> Preview
                                                </a>
                                                {/* ফাইল রিমুভ করার বাটন */}
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    className="text-[10px] font-bold text-red-500 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(type === "Payments") && (
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
                        Create Record
                    </button>
                </div>
            </div>
        </div>
    );
}