// app/(dashboard)/crm/client-360/components/EditClientModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    Client360Api,
    type Client360,
    type ClientConstants,
} from '@/services/client360.service';
import { inputCls, selectCls } from './constants';

interface Props {
    client: Client360;
    constants: ClientConstants | null;
    onClose: () => void;
    onSaved: (updated: Client360) => void;
}

const COUNTRIES = [
    'Bangladesh', 'Singapore', 'India', 'Pakistan', 'Egypt',
    'Middle East', 'Hungary', 'Nigeria', 'United Kingdom', 'United States',
];

const STAGES = ['hot', 'warm', 'won', 'cold'];

export function EditClientModal({ client, constants, onClose, onSaved }: Props) {
    const [name, setName] = useState(client.name || '');
    const [tier, setTier] = useState(client.tier || 'Standard');
    const [isPartner, setIsPartner] = useState(!!client.isPartner);
    const [sector, setSector] = useState(client.sector || '');
    const [country, setCountry] = useState(client.country || 'Bangladesh');
    const [city, setCity] = useState(client.city || '');
    const [area, setArea] = useState(client.area || '');
    const [location, setLocation] = useState(client.location || '');
    const [team, setTeam] = useState(client.team || '');
    const [stage, setStage] = useState(client.stage || 'cold');
    const [notes, setNotes] = useState(client.notes || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Company name is required');
            return;
        }

        try {
            setSaving(true);

            const updated = await Client360Api.update(client.id, {
                name: name.trim(),
                tier: tier as any,
                isPartner,
                sector,
                country,
                city: city.trim(),
                area: area.trim(),
                location: location.trim(),
                team: team.trim(),
                stage: stage as any,
                notes: notes.trim(),
            });

            toast.success('Client updated');
            onSaved(updated);
        } catch (e: any) {
            toast.error(e.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[640px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
                            Edit Client
                        </h2>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Update this client's details. Changes apply immediately.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Company Name" required full>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputCls}
                            autoFocus
                        />
                    </Field>

                    <Field label="Tier">
                        <select value={tier} onChange={(e) => setTier(e.target.value)} className={selectCls}>
                            {(constants?.TIERS || ['Gold', 'Silver', 'Bronze', 'Standard']).map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Sector">
                        <select value={sector} onChange={(e) => setSector(e.target.value)} className={selectCls}>
                            <option value="">Select sector</option>
                            {(constants?.SECTORS || []).map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Country">
                        <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectCls}>
                            {COUNTRIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Location">
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Head Office"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="City">
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Area">
                        <input
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            placeholder="Area"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Team">
                        <input
                            value={team}
                            onChange={(e) => setTeam(e.target.value)}
                            placeholder="e.g. Sales"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Stage">
                        <select value={stage} onChange={(e) => setStage(e.target.value)} className={selectCls}>
                            {STAGES.map((s) => (
                                <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Partner / Reseller?" full>
                        <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPartner}
                                onChange={(e) => setIsPartner(e.target.checked)}
                                className="accent-[#A06126]"
                            />
                            This client is a partner / reseller
                        </label>
                    </Field>

                    <Field label="Notes" full>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Optional notes"
                            className={inputCls + ' resize-none'}
                        />
                    </Field>
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-[#E2DBD1] bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-lg bg-[#A06126] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60 transition"
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    required,
    full,
    children,
}: {
    label: string;
    required?: boolean;
    full?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className={full ? 'col-span-2' : ''}>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {children}
        </div>
    );
}