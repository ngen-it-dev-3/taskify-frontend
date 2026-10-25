// components/tender/submission/CreateSectionModal.tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { title: string; description: string; portalHint: string }) => Promise<void>;
}

export function CreateSectionModal({ open, onOpenChange, onSubmit }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [portalHint, setPortalHint] = useState("");
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try {
            await onSubmit({ title, description, portalHint });
            setTitle("");
            setDescription("");
            setPortalHint("");
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                <h2 className="mb-4 text-base font-bold text-slate-900">Add New Section</h2>

                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Certificates"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-[12px] focus:border-[#a97400] focus:outline-none"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Description (Optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Legal documents and profiles"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-[12px] focus:border-[#a97400] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Portal Hint (Optional)</label>
                        <input
                            type="text"
                            value={portalHint}
                            onChange={(e) => setPortalHint(e.target.value)}
                            placeholder="Upload in the portal under..."
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-[12px] focus:border-[#a97400] focus:outline-none"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !title.trim()}
                        className="inline-flex items-center gap-2 rounded-md bg-[#a97400] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#8f6100] disabled:opacity-50"
                    >
                        {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                        Save Section
                    </button>
                </div>
            </div>
        </div>
    );
}