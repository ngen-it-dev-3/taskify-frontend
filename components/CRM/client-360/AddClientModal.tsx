// app/(dashboard)/crm/client-360/components/AddClientModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Client360Api, type ClientConstants } from '@/services/client360.service';
import { inputCls, selectCls } from './constants';

interface Props {
    constants: ClientConstants | null;
    onClose: () => void;
    onSaved: () => void;
}

const COUNTRIES = [
    'Bangladesh', 'Singapore', 'India', 'Pakistan', 'Egypt',
    'Middle East', 'Hungary', 'Nigeria', 'United Kingdom', 'United States',
];

export function AddClientModal({ constants, onClose, onSaved }: Props) {
    const [name, setName] = useState('');
    const [tier, setTier] = useState('Standard');
    const [isPartner, setIsPartner] = useState(false);
    const [sector, setSector] = useState('');
    const [country, setCountry] = useState('Bangladesh');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [notes, setNotes] = useState('');

    // First contact (optional)
    const [contactName, setContactName] = useState('');
    const [contactDesignation, setContactDesignation] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactMobile, setContactMobile] = useState('');
    const [contactDecision, setContactDecision] = useState(false);

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Company name is required');
            return;
        }

        try {
            setSaving(true);

            const contacts = contactName.trim()
                ? [{
                    name: contactName.trim(),
                    designation: contactDesignation.trim(),
                    department: '',
                    email: contactEmail.trim(),
                    personalEmail: '',
                    phone: contactPhone.trim(),
                    personalPhone: contactMobile.trim(),
                    notes: '',
                    isDecisionMaker: contactDecision,
                    autoAdded: false,
                    linkedIn: '',
                }]
                : [];

            await Client360Api.create({
                name: name.trim(),
                tier: tier as any,
                isPartner,
                sector,
                country,
                city: city.trim(),
                area: area.trim(),
                notes: notes.trim(),
                contacts,
            });

            toast.success('Client created');
            onSaved();
        } catch (e: any) {
            toast.error(e.message || 'Failed to create client');
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
                className="w-full max-w-[680px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
                            Add Client
                        </h2>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Manually create a new client. The system will check for existing
                            matches by name, email, or phone before creating.
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
                            placeholder="e.g. Bangladesh Power Development Board"
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
                    <Field label="City / Area">
                        <div className="flex gap-2">
                            <input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="City"
                                className={inputCls}
                            />
                            <input
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                                placeholder="Area"
                                className={inputCls}
                            />
                        </div>
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
                            rows={2}
                            placeholder="Optional notes"
                            className={inputCls + ' resize-none'}
                        />
                    </Field>

                    {/* Optional first contact */}
                    <div className="col-span-2 mt-2 border-t border-[#F0EBE3] pt-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                            Primary Contact (optional)
                        </div>
                    </div>

                    <Field label="Contact Name">
                        <input
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="e.g. Touhidur Rahman Khan"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Designation">
                        <input
                            value={contactDesignation}
                            onChange={(e) => setContactDesignation(e.target.value)}
                            placeholder="e.g. Sub Divisional Engineer"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Email">
                        <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="e.g. contact@company.com"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Phone (office)">
                        <input
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="e.g. 02-55138668"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Mobile">
                        <input
                            value={contactMobile}
                            onChange={(e) => setContactMobile(e.target.value)}
                            placeholder="e.g. +880 1711-224499"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Decision Maker?">
                        <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer py-2.5">
                            <input
                                type="checkbox"
                                checked={contactDecision}
                                onChange={(e) => setContactDecision(e.target.checked)}
                                className="accent-[#A06126]"
                            />
                            Yes, this person is a decision maker
                        </label>
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
                        {saving ? 'Saving…' : 'Add Client'}
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