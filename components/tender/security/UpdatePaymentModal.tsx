// components/tender/security/UpdatePaymentModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: any;
    onSave: (data: any) => Promise<void>;
}

export function UpdatePaymentModal({ open, onOpenChange, row, onSave }: Props) {
    const [amount, setAmount] = useState<number | "">("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [mode, setMode] = useState("Bank transfer");
    const [reference, setReference] = useState("");
    const [delivery, setDelivery] = useState("Delivered");
    const [closeOrder, setCloseOrder] = useState(true);
    const [saving, setSaving] = useState(false);

    if (!open || !row) return null;

    const balance = row.amount - (row.receivedAmount || 0);

    // components/tender/security/UpdatePaymentModal.tsx
    // (Keep everything the same, just ensure handleSave looks exactly like this)

    const handleSave = async () => {
        if (!amount || Number(amount) <= 0) return;
        setSaving(true);
        try {
            await onSave({
                amount: Number(amount),
                date,
                mode,
                reference,
                delivery,
                closeOrder,
            });
            setAmount("");
            setReference("");
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl relative">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <h2 className="font-serif text-xl font-bold text-slate-900">Update payment</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-700">{row.clientDescription}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        Contract ৳{row.amount.toLocaleString("en-IN")} &middot; received ৳{(row.receivedAmount || 0).toLocaleString("en-IN")} &middot; balance ৳{balance.toLocaleString("en-IN")}
                    </p>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 space-y-4">
                    <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Record a payment received
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Amount (BDT)</label>
                                <input
                                    type="number"
                                    placeholder={`up to ৳${balance.toLocaleString("en-IN")}`}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                                    className="h-9 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-900 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Date received</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-9 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-900 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Mode</label>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value)}
                                    className="h-9 w-full rounded border border-slate-300 px-2 text-xs focus:border-slate-900 focus:outline-none"
                                >
                                    <option>Bank transfer</option>
                                    <option>Cheque</option>
                                    <option>Cash</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Reference</label>
                                <input
                                    type="text"
                                    placeholder="Txn / cheque no."
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    className="h-9 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-900 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Delivery status</label>
                        <select
                            value={delivery}
                            onChange={(e) => setDelivery(e.target.value)}
                            className="h-9 w-full rounded border border-slate-300 px-2 text-xs focus:border-slate-900 focus:outline-none"
                        >
                            <option>Delivered</option>
                            <option>In delivery</option>
                            <option>Pending</option>
                        </select>
                    </div>

                    <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={closeOrder}
                            onChange={(e) => setCloseOrder(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
                        />
                        When fully paid, close this tender's order and delivery tracking
                    </label>

                    <button
                        onClick={handleSave}
                        disabled={saving || !amount}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded bg-[#a97400] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#8f6100] disabled:opacity-50"
                    >
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save update
                    </button>
                </div>
            </div>
        </div>
    );
}