// components/tender/security/AddSecurityModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => Promise<void>;
}

export function AddSecurityModal({ open, onOpenChange, onSave }: Props) {
    const [entity, setEntity] = useState("NGL-26");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("Tender Security");
    const [amount, setAmount] = useState<number | "">("");
    const [dueDate, setDueDate] = useState("");
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const handleSave = async () => {
        if (!description.trim() || !amount) return;
        setSaving(true);
        try {
            await onSave({
                entity,
                clientDescription: description,
                type,
                amount: Number(amount),
                dueDate: dueDate || null,
                invoiceNo: "No invoice yet",
                receivedAmount: 0,
                delivery: "Pending",
                docsStatus: "Missing",
            });
            // Reset
            setDescription("");
            setAmount("");
            setDueDate("");
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl relative">
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <h2 className="font-serif text-xl font-bold text-slate-900">Add Security Record</h2>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Entity</label>
                            <select
                                value={entity}
                                onChange={(e) => setEntity(e.target.value)}
                                className="h-9 w-full rounded border border-slate-300 px-2 text-xs focus:border-slate-900 focus:outline-none"
                            >
                                <option value="NGL-26">NGL-26</option>
                                <option value="NG-26">NG-26</option>
                                <option value="JT">JT</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="h-9 w-full rounded border border-slate-300 px-2 text-xs focus:border-slate-900 focus:outline-none"
                            >
                                <option value="Tender Security">Tender Security</option>
                                <option value="Performance Security">Performance Security</option>
                                <option value="Bank Guarantee">Bank Guarantee</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Description / Tender Name</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. BPDP — Substation Automation"
                            className="h-9 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-900 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Contract Amount (BDT)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                                placeholder="0"
                                className="h-9 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-900 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="h-9 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-900 focus:outline-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || !description || !amount}
                        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded bg-[#a97400] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#8f6100] disabled:opacity-50"
                    >
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Create Record
                    </button>
                </div>
            </div>
        </div>
    );
}