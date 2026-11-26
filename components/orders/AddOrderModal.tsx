// components/orders/AddOrderModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { NewOrderInput } from "@/types/orders/types";

interface AddOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddOrder: (order: NewOrderInput) => void;
}

export default function AddOrderModal({
    isOpen,
    onClose,
    onAddOrder,
}: AddOrderModalProps) {
    const [client, setClient] = useState("");
    const [poRef, setPoRef] = useState("");
    const [title, setTitle] = useState("");
    const [salesOrderRef, setSalesOrderRef] = useState("");
    const [invoiceRef, setInvoiceRef] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setClient("");
            setPoRef("");
            setTitle("");
            setSalesOrderRef("");
            setInvoiceRef("");
            setError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!client.trim() || !poRef.trim() || !title.trim()) {
            setError("Client, PO Reference, and Order / Product Title are required.");
            return;
        }

        onAddOrder({
            client: client.trim(),
            poRef: poRef.trim(),
            title: title.trim(),
            salesOrderRef: salesOrderRef.trim() || "SO-2026-0201",
            invoiceRef: invoiceRef.trim() || undefined,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
            <div className="w-full max-w-[560px] bg-white rounded-md border border-[#e5dfd3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3 border-b border-[#efe9dc]">
                    <div>
                        <h3 className="text-[16px] font-semibold text-[#181612]">
                            Add New Order to Pipeline
                        </h3>
                        <p className="text-[12px] text-[#6f6960] mt-1">
                            Create an order fulfillment record to track steps from invoice to client completion certificate.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="w-7 h-7 rounded bg-[#f4f1ea] hover:bg-[#e8e3d7] text-[#4a453e] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6f6960] mb-1.5">
                                CLIENT NAME *
                            </label>
                            <input
                                type="text"
                                value={client}
                                onChange={(e) => setClient(e.target.value)}
                                placeholder="e.g. EGCB / Sonali Bank PLC"
                                className="w-full px-3 py-2 text-[13px] rounded border border-[#d6cfc2] bg-white text-[#181612] placeholder:text-[#a19a90] focus:outline-none focus:border-[#8a5a14]"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6f6960] mb-1.5">
                                PO / ORDER REFERENCE *
                            </label>
                            <input
                                type="text"
                                value={poRef}
                                onChange={(e) => setPoRef(e.target.value)}
                                placeholder="e.g. NG-EGCB/HW/260205"
                                className="w-full px-3 py-2 text-[13px] rounded border border-[#d6cfc2] bg-white text-[#181612] placeholder:text-[#a19a90] focus:outline-none focus:border-[#8a5a14]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6f6960] mb-1.5">
                            PRODUCT / PROCUREMENT TITLE *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Acronis Backup Spares — DCS Module"
                            className="w-full px-3 py-2 text-[13px] rounded border border-[#d6cfc2] bg-white text-[#181612] placeholder:text-[#a19a90] focus:outline-none focus:border-[#8a5a14]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6f6960] mb-1.5">
                                SALES ORDER REF
                            </label>
                            <input
                                type="text"
                                value={salesOrderRef}
                                onChange={(e) => setSalesOrderRef(e.target.value)}
                                placeholder="e.g. SO-2026-0142"
                                className="w-full px-3 py-2 text-[13px] rounded border border-[#d6cfc2] bg-white text-[#181612] placeholder:text-[#a19a90] focus:outline-none focus:border-[#8a5a14]"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6f6960] mb-1.5">
                                INVOICE REF (OPTIONAL)
                            </label>
                            <input
                                type="text"
                                value={invoiceRef}
                                onChange={(e) => setInvoiceRef(e.target.value)}
                                placeholder="e.g. INV-2026-0088"
                                className="w-full px-3 py-2 text-[13px] rounded border border-[#d6cfc2] bg-white text-[#181612] placeholder:text-[#a19a90] focus:outline-none focus:border-[#8a5a14]"
                            />
                        </div>
                    </div>

                    {error && <p className="text-[12px] text-rose-600 font-medium">{error}</p>}

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 rounded border border-[#d6cfc2] text-[12px] font-medium text-[#4a453e] hover:bg-[#f7f4ed] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-[#8a5a14] hover:bg-[#734a0f] text-white text-[12px] font-semibold transition-colors cursor-pointer"
                        >
                            Create Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}