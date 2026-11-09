// app/(dashboard)/crm/client-360/components/ClientProfileSkeleton.tsx
'use client';

import React from 'react';

export function ClientProfileSkeleton() {
    return (
        <div className="space-y-5 animate-pulse">
            {/* Header card */}
            <div className="rounded-xl border border-[#EBE6DF] bg-white p-6">
                <div className="h-7 w-48 rounded bg-slate-200 mb-3" />
                <div className="flex gap-2">
                    <div className="h-5 w-24 rounded-full bg-slate-100" />
                    <div className="h-5 w-24 rounded-full bg-slate-100" />
                    <div className="h-5 w-28 rounded-full bg-slate-100" />
                </div>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-[#EBE6DF] bg-white px-5 py-4"
                    >
                        <div className="h-3 w-20 rounded bg-slate-100 mb-3" />
                        <div className="h-6 w-24 rounded bg-slate-200" />
                    </div>
                ))}
            </div>

            {/* Tab bar */}
            <div className="border-b border-[#EBE6DF] flex items-center gap-6 pb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-4 w-20 rounded bg-slate-100" />
                ))}
            </div>

            {/* Contact cards */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-[#EBE6DF] bg-white p-5"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <div className="h-11 w-11 rounded-full bg-slate-200" />
                            <div className="flex-1">
                                <div className="h-4 w-32 rounded bg-slate-200 mb-2" />
                                <div className="h-3 w-24 rounded bg-slate-100" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-48 rounded bg-slate-100" />
                            <div className="h-3 w-40 rounded bg-slate-100" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}