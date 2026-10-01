// app/(dashboard)/crm/client-360/components/ContactModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Client360Api, type ClientContact } from '@/services/client360.service';
import { inputCls } from './constants';

interface Props {
    clientId: string;
    /** When present → edit mode. When absent → add mode. */
    contact?: ClientContact | null;
    onClose: () => void;
    onSaved: () => void;
}

export function ContactModal({ clientId, contact, onClose, onSaved }: Props) {
    const isEdit = !!contact?._id;

    const [name, setName] = useState(contact?.name ?? '');
    const [designation, setDesignation] = useState(contact?.designation ?? '');
    const [department, setDepartment] = useState(contact?.department ?? '');
    const [email, setEmail] = useState(contact?.email ?? '');
    const [personalEmail, setPersonalEmail] = useState(contact?.personalEmail ?? '');
    const [phone, setPhone] = useState(contact?.phone ?? '');
    const [personalPhone, setPersonalPhone] = useState(contact?.personalPhone ?? '');
    const [linkedIn, setLinkedIn] = useState(contact?.linkedIn ?? '');
    const [notes, setNotes] = useState(contact?.notes ?? '');
    const [isDecisionMaker, setIsDecisionMaker] = useState(!!contact?.isDecisionMaker);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Contact name is required');
            return;
        }

        try {
            setSaving(true);

            const payload: Partial<ClientContact> = {
                name: name.trim(),
                designation: designation.trim(),
                department: department.trim(),
                email: email.trim().toLowerCase(),
                personalEmail: personalEmail.trim().toLowerCase(),
                phone: phone.trim(),
                personalPhone: personalPhone.trim(),
                linkedIn: linkedIn.trim(),
                notes: notes.trim(),
                isDecisionMaker,
            };

            if (isEdit && contact?._id) {
                await Client360Api.updateContact(clientId, contact._id, payload);
                toast.success('Contact updated');
            } else {
                await Client360Api.addContact(clientId, payload);
                toast.success('Contact added');
            }

            onSaved();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save contact');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!contact?._id) return;
        if (!confirm(`Delete contact "${contact.name}"?`)) return;

        try {
            setSaving(true);
            await Client360Api.deleteContact(clientId, contact._id);
            toast.success('Contact deleted');
            onSaved();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete');
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
                className="w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
                            {isEdit ? 'Edit Contact' : 'Add Contact'}
                        </h2>
                        <p className="mt-1 text-[11px] text-slate-500">
                            {isEdit
                                ? 'Update the contact details.'
                                : 'Add a contact person to this client account.'}
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
                    <Field label="Name" required full>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Touhidur Rahman Khan"
                            className={inputCls}
                            autoFocus
                        />
                    </Field>

                    <Field label="Designation">
                        <input
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="e.g. Sub Divisional Engineer"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Department">
                        <input
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="e.g. Procurement & Maintenance"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Official Email">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. name@company.com"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Personal Email">
                        <input
                            type="email"
                            value={personalEmail}
                            onChange={(e) => setPersonalEmail(e.target.value)}
                            placeholder="e.g. name@gmail.com"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Official Phone">
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 02-55138668"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Personal Phone / Mobile">
                        <input
                            value={personalPhone}
                            onChange={(e) => setPersonalPhone(e.target.value)}
                            placeholder="e.g. +880 1711-224499"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="LinkedIn" full>
                        <input
                            value={linkedIn}
                            onChange={(e) => setLinkedIn(e.target.value)}
                            placeholder="e.g. https://linkedin.com/in/username"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Notes" full>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="e.g. Prefers English · site visits welcome"
                            className={inputCls + ' resize-none'}
                        />
                    </Field>

                    <Field label="Decision Maker?" full>
                        <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer py-1">
                            <input
                                type="checkbox"
                                checked={isDecisionMaker}
                                onChange={(e) => setIsDecisionMaker(e.target.checked)}
                                className="accent-[#A06126]"
                            />
                            Yes, this person is a decision maker
                        </label>
                    </Field>
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-between gap-2">
                    <div>
                        {isEdit && (
                            <button
                                onClick={handleDelete}
                                disabled={saving}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-60 transition"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
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
                            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Contact'}
                        </button>
                    </div>
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