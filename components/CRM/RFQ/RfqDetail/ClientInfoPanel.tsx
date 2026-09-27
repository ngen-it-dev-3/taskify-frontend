'use client';

import React from 'react';
import type { RFQClientInfo } from '../types';

interface Props {
    info: RFQClientInfo;
    onDetails: () => void;
}

export default function ClientInfoPanel({ info, onDetails }: Props) {
    return (
        <div className="bg-[#FAF8F4] rounded-lg p-4 border border-[#EFE9DF] mb-5">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    Client Information
                </h3>
                <button onClick={onDetails} className="text-xs font-semibold text-[#A06126] hover:underline">
                    Details →
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                <Field label="Name" value={info.contactName} strong />
                <Field label="Tentative Budget" value={info.tentativeBudget} mono />
                <Field label="Email" value={info.email} mono accent />
                <Field label="Purchase Date" value={info.purchaseDate} mono />
                <Field label="Company" value={info.company} strong />
                <Field label="Delivery Country" value={info.country} />
                <Field label="Phone" value={info.phone} mono />
                <Field label="Delivery Zip Code" value={info.zipCode} mono />
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    mono,
    strong,
    accent,
}: {
    label: string;
    value: string;
    mono?: boolean;
    strong?: boolean;
    accent?: boolean;
}) {
    const cls = [
        mono ? 'font-mono' : '',
        strong ? 'font-semibold' : '',
        accent ? 'text-[#0F2D4A]' : 'text-slate-800',
    ].join(' ');
    return (
        <div>
            <span className="text-slate-400">{label}:</span> <span className={cls}>{value}</span>
        </div>
    );
}