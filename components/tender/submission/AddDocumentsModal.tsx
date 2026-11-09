// components/tender/submission/AddDocumentsModal.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Search, ChevronDown, Plus, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useCompanyDocBundle } from "@/hooks/tender/useCompanyDocBundle";
import type { CompanyDocUI } from "@/lib/api/mappers";
import { toCompanyDocUI } from "@/lib/api/mappers";
import type { DocsTab } from "@/components/tender/documents/DocsTabs";
import { useRouter } from "next/navigation";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (selectedIds: string[], category: string) => Promise<void>;
    targetSectionId: string;
    targetSectionTitle: string;
}

const TABS: { id: DocsTab; label: string }[] = [
    { id: "work-orders", label: "Work Orders" },
    { id: "team", label: "Team & CVs" },
    { id: "certificates", label: "Partner Certificates" },
    { id: "legal", label: "Company & Legal Docs" },
    { id: "datasheets", label: "Datasheets & Brochures" },
    { id: "profiles", label: "Company Profiles" },
];

const REQUIREMENT_TYPES = [
    "Auto-detect",
    "Related years",
    "Work orders",
    "Total value",
    "Govt / Non-Govt",
    "Customer type",
    "Product / subject",
    "General years",
    "Service years",
    "Engineers / technicians",
];

export function AddDocumentsModal({ open, onOpenChange, onAdd, targetSectionTitle }: Props) {
    const [activeTab, setActiveTab] = useState<DocsTab>("work-orders");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    // --- Requirements State ---
    const [requirements, setRequirements] = useState<string[]>([
        "≥ 5 work orders",
        "Total value ≥ 20 Lac",
        "Govt.",
        "Service experience ≥ 2 yrs (completion certificate)",
        "≥ 5 engineers / technicians"
    ]);
    const [newReq, setNewReq] = useState("");
    const [reqType, setReqType] = useState("Auto-detect");

    // --- Dates State ---
    const [tenderDate, setTenderDate] = useState("2026-09-30");
    const [companyStartDate, setCompanyStartDate] = useState("2009-01-04");

    const { rows, loading } = useCompanyDocBundle({ category: activeTab });

    const docs: CompanyDocUI[] = useMemo(() => {
        if (!Array.isArray(rows)) return [];
        return rows.map(toCompanyDocUI);
    }, [rows]);

    // --- Computed Logic for Auto-Matching ---
    const metrics = useMemo(() => {
        if (activeTab !== "work-orders") return null;

        const tenderTime = new Date(tenderDate).getTime();
        const startTime = new Date(companyStartDate).getTime();
        const generalYears = ((tenderTime - startTime) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);

        // Filter docs valid before tender date
        const validDocs = docs.filter(d => new Date(d.issuedOn || 0).getTime() <= tenderTime);

        const totalValue = validDocs.reduce((sum, d) => sum + (d.totalValue || 0), 0);
        const serviceDocs = validDocs.filter(d => d.workType?.includes("Service") || d.certReceived);
        const serviceYears = validDocs.filter(d => d.issuedOn).map(d => new Date(d.issuedOn!).getFullYear()).sort();
        const serviceRange = serviceYears.length > 0 ? (new Date(tenderDate).getFullYear() - serviceYears[0]) : 0;

        return {
            workOrders: validDocs.length,
            totalValue,
            serviceYears,
            engineers: validDocs.filter(d => d.isEngineer).length,
            generalYears,
        };
    }, [docs, tenderDate, companyStartDate, activeTab]);

    // Filter the displayed table based on matched criteria
    const filteredDocs = useMemo(() => {
        let result = docs;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(d => d.title.toLowerCase().includes(q));
        }
        // Apply automatic filtering for Work Orders if we have metrics
        if (activeTab === "work-orders" && metrics) {
            result = result.filter(d => new Date(d.issuedOn || 0).getTime() <= new Date(tenderDate).getTime());
        }
        return result;
    }, [docs, search, activeTab, metrics, tenderDate]);

    // Select/Deselect all matched
    const toggleAll = () => {
        if (selectedIds.size === filteredDocs.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredDocs.map(d => d.id)));
        }
    };

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setSelectedIds(new Set());
            setSearch("");
        }
    }, [open, activeTab]);

    if (!open) return null;

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAdd = async () => {
        if (selectedIds.size === 0) return;
        setSaving(true);
        try {
            await onAdd(Array.from(selectedIds), activeTab);
            toast.success(`${selectedIds.size} document(s) added`);
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to add");
        } finally {
            setSaving(false);
        }
    };

    const addRequirement = () => {
        if (!newReq.trim()) return;
        setRequirements([...requirements, newReq.trim()]);
        setNewReq("");
    };

    const removeRequirement = (index: number) => {
        setRequirements(requirements.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && onOpenChange(false)} />

            <div className="relative z-10 flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#faf7f0] shadow-2xl">

                {/* Header */}
                <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Add documents</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            {targetSectionTitle} — pick from your saved documents and tick what to include.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                onOpenChange(false);
                                router.push("/tenders/documents");
                                // Optional: router.refresh() ensures fresh data on arrival
                                router.refresh();
                            }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#a97400] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#8f6100]"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add New
                        </button>
                        <button
                            onClick={() => !saving && onOpenChange(false)}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {/* Tabs */}
                <div className="shrink-0 border-b border-slate-200 bg-white px-6">
                    {/* ✅ Added scrollbar-hide and proper flex alignment */}
                    <div className="flex items-center gap-8 overflow-hide">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`relative whitespace-nowrap pb-3 pt-4 text-[13px] font-semibold transition ${activeTab === t.id
                                    ? "text-slate-900"
                                    : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                {t.label}
                                {activeTab === t.id && (
                                    <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#a97400]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4">

                    {/* ✅ WORK ORDERS MATCHER */}
                    {activeTab === "work-orders" && (
                        <div className="mb-6 rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
                            <h3 className="text-[13px] font-bold text-slate-900 mb-1">What does this tender ask for?</h3>
                            <p className="text-[10px] text-slate-500 mb-3">
                                Sample requirements are filled in — remove or change them. Type in plain words, for example: 3 years, 5 orders, 20 lac, 1 cr, Govt, Educational, Tenable, general 10 years, service 2 years, 5 engineers.
                            </p>

                            {/* Chips */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {requirements.map((req, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
                                        {req}
                                        <button onClick={() => removeRequirement(i)} className="rounded-full p-0.5 hover:bg-slate-200 text-slate-400">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            {/* Input Row */}
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Add a requirement and press Enter"
                                    value={newReq}
                                    onChange={(e) => setNewReq(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addRequirement()}
                                    className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-[12px] focus:border-[#a97400] outline-none"
                                />
                                <select
                                    value={reqType}
                                    onChange={(e) => setReqType(e.target.value)}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] outline-none"
                                >
                                    {REQUIREMENT_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <button onClick={addRequirement} className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold hover:bg-slate-50">Add</button>
                            </div>

                            {/* Dates */}
                            <div className="flex items-center gap-4 mb-4">
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tender Date (Years are counted up to this date)</label>
                                    <input type="date" value={tenderDate} onChange={(e) => setTenderDate(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company Start Date (Sample — set yours)</label>
                                    <input type="date" value={companyStartDate} onChange={(e) => setCompanyStartDate(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] outline-none" />
                                </div>
                            </div>

                            {/* Matched Cards */}
                            {metrics && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                        <p className="text-[9px] font-bold uppercase text-emerald-800 mb-1">Related work orders</p>
                                        <div className="flex items-end gap-2 mb-1">
                                            <span className="text-xl font-bold text-emerald-900 leading-none">{metrics.workOrders}</span>
                                            <span className="text-[10px] text-emerald-700 mb-0.5">min 5</span>
                                        </div>
                                        <p className="text-[10px] text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> meets the requirement</p>
                                    </div>

                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                        <p className="text-[9px] font-bold uppercase text-emerald-800 mb-1">Related total value</p>
                                        <div className="flex items-end gap-2 mb-1">
                                            <span className="text-xl font-bold text-emerald-900 leading-none">{(metrics.totalValue / 100000).toFixed(0)} Lac</span>
                                            <span className="text-[10px] text-emerald-700 mb-0.5">min 20 Lac</span>
                                        </div>
                                        <p className="text-[10px] text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> meets the requirement</p>
                                    </div>

                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                        <p className="text-[9px] font-bold uppercase text-emerald-800 mb-1">Service experience</p>
                                        <div className="flex items-end gap-2 mb-1">
                                            <span className="text-xl font-bold text-emerald-900 leading-none">{metrics.serviceYears} yrs</span>
                                            <span className="text-[10px] text-emerald-700 mb-0.5">min 2 yrs</span>
                                        </div>
                                        <p className="text-[10px] text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> meets the requirement</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-3 flex items-center justify-between">
                                <p className="text-[11px] text-slate-500">
                                    <strong>{filteredDocs.length} work orders</strong> match the filters and are ticked below. Orders dated after the tender date are not counted.
                                </p>
                                <div className="flex items-center gap-2 text-[11px]">
                                    <button onClick={toggleAll} className="font-semibold text-slate-700 hover:underline">Tick matching</button>
                                    <span className="text-slate-300">·</span>
                                    <button onClick={() => setSelectedIds(new Set())} className="font-semibold text-slate-700 hover:underline">Untick all</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Standard Filter Bar for non-work-orders */}
                    {activeTab !== "work-orders" && (
                        <div className="mb-4 flex items-center justify-between">
                            <div className="relative w-[280px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] focus:border-slate-400 outline-none"
                                />
                            </div>
                            <span className="text-[11px] text-slate-500">{filteredDocs.length} of {docs.length} shown</span>
                        </div>
                    )}

                    {/* Documents List / Table */}
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="text-center py-10 text-sm text-slate-500">No documents found.</div>
                        ) : activeTab === "work-orders" ? (
                            // Work Order Table View
                            <table className="w-full text-left text-[11px]">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="w-10 px-4 py-3"></th>
                                        <th className="px-4 py-3">Client</th>
                                        <th className="px-4 py-3">Order Received</th>
                                        <th className="px-4 py-3">Value</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">What it was for</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDocs.map(d => (
                                        <tr key={d.id} className={`transition hover:bg-slate-50 ${selectedIds.has(d.id) ? "bg-[#fdf8ec]" : ""}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(d.id)}
                                                    onChange={() => toggleSelect(d.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-900">{d.title}</td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {d.issuedOn ? new Date(d.issuedOn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">
                                                {d.totalValue ? `${(d.totalValue / 100000).toFixed(1)} Lac` : "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="mb-0.5 block w-fit rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">{d.isGovt ? "Govt." : "Non-Govt."}</span>
                                                <span className="text-[10px] text-slate-500">{d.customerType}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="mb-1 flex flex-wrap gap-1">
                                                    {(d.products || []).map((p: string) => (
                                                        <span key={p} className="rounded bg-[#fdf8ec] px-1.5 py-0.5 text-[9px] font-medium text-[#a97400]">{p}</span>
                                                    ))}
                                                </div>
                                                <span className="line-clamp-1 block max-w-[200px] text-[10px] text-slate-500">{d.subtitle}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            // Standard List View
                            <div className="divide-y divide-slate-100 p-2">
                                {filteredDocs.map((doc) => (
                                    <label
                                        key={doc.id}
                                        className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 transition ${selectedIds.has(doc.id) ? "bg-[#fdf8ec]" : "hover:bg-slate-50"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(doc.id)}
                                            onChange={() => toggleSelect(doc.id)}
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-[13px] font-bold text-slate-900">{doc.title}</h4>
                                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                {doc.reference ? `${doc.reference} · ` : ""}
                                                {doc.validity || "No expiry"}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
                    <span className="text-[12px] font-semibold text-slate-700">
                        {selectedIds.size} ticked — {selectedIds.size} {activeTab.replace("-", " ")}
                    </span>
                    <div className="flex items-center gap-3">
                        <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px]">
                            <option>Company & eligibility</option>
                            <option>Technical</option>
                            <option>Financial</option>
                        </select>
                        <button
                            onClick={() => !saving && onOpenChange(false)}
                            disabled={saving}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={selectedIds.size === 0 || saving}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a97400] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#8f6100] disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Add to tender →
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}