"use client";

import { useState } from "react";

const TABS = [
    { id: "pipeline", num: "01", label: "Tender pipeline" },
    { id: "prep", num: "02", label: "Bid preparation" },
    { id: "followups", num: "03", label: "Follow-up activity" },
    { id: "security", num: "04", label: "Tender & performance security" },
    { id: "docs", num: "05", label: "Experience & documents" },
];

export default function ProductViews() {
    const [active, setActive] = useState("pipeline");

    return (
        <section id="views" className="bg-[#123B2C] py-20 md:py-28">
            <div className="wrap max-w-7xl mx-auto px-6">
                {/* Header */}
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#DCEFAE]">
                    Product views
                </p>
                <h2 className="mt-4 text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-white">
                    Your tender process.
                    <br />
                    A more visual perspective.
                </h2>
                <p className="mt-5 max-w-xl text-base text-white/70 leading-relaxed">
                    Explore five illustrative screens, from preparing a bid to guarantees and
                    company documents.
                </p>

                {/* Tabs */}
                <div className="mt-10 flex flex-wrap gap-2.5">
                    {TABS.map((t) => {
                        const isActive = active === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActive(t.id)}
                                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-300 ${isActive
                                        ? "bg-[#DCEFAE] border-[#DCEFAE] text-[#0F1714] font-semibold shadow-[0_8px_20px_-8px_rgba(220,239,174,0.6)]"
                                        : "bg-transparent border-white/25 text-white/80 hover:bg-white/10 hover:border-white/40"
                                    }`}
                            >
                                <span className={`text-[11px] font-mono ${isActive ? "text-[#1B6B52]" : "text-white/50"}`}>
                                    {t.num}
                                </span>
                                <span>{t.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Browser Window */}
                <div className="mt-10 rounded-2xl bg-[#F5F8EE] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] overflow-hidden">
                    {/* Browser Chrome */}
                    <div className="flex items-center justify-between border-b border-black/5 bg-[#EBEFE0] px-5 py-3">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#E8A29A]" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[#EAD29A]" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[#A4C99A]" />
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                            Orvix Tender / Product interface concept
                        </p>
                        <div className="w-12" />
                    </div>

                    {/* Panel content */}
                    <div className="p-6 md:p-10 bg-[#F5F8EE] min-h-[440px]">
                        {active === "pipeline" && <PipelinePanel />}
                        {active === "prep" && <PrepPanel />}
                        {active === "followups" && <FollowUpsPanel />}
                        {active === "security" && <SecurityPanel />}
                        {active === "docs" && <DocsPanel />}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ==================== SHARED PANEL HEADER ==================== */
function PanelHeader({ over, title }: { over: string; title: string }) {
    return (
        <div className="mb-6 flex items-start justify-between gap-4">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1B6B52]">
                    {over}
                </p>
                <h3 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-[#0F1714] leading-tight">
                    {title}
                </h3>
            </div>
            <span className="shrink-0 rounded-full bg-white border border-[#DDE5CC] px-3 py-1 text-[11px] font-medium text-gray-500">
                Sample records
            </span>
        </div>
    );
}

/* ==================== PANEL 1 — TENDER PIPELINE ==================== */
function PipelinePanel() {
    const columns = [
        {
            title: "Review", count: 2,
            cards: [
                { ref: "TF / 026", name: "Water monitoring equipment", badge: "Requirements review", badgeStyle: "bg-[#FBF3E3] text-[#A56A00]", progress: 25, owner: "Bid team", due: "28 Oct" },
                { ref: "TF / 027", name: "Office technology package", owner: "Sales team", due: "30 Oct", noBadge: true },
            ],
        },
        {
            title: "In preparation", count: 2,
            cards: [
                { ref: "TF / 024", name: "Enterprise software supply", badge: "Documents in progress", badgeStyle: "bg-[#DCEFAE] text-[#1B6B52]", progress: 70, owner: "Bid team", due: "18 Oct" },
                { ref: "TF / 025", name: "Industrial equipment package", owner: "Sourcing team", due: "21 Oct", noBadge: true },
            ],
        },
        {
            title: "Submitted", count: 1,
            cards: [
                { ref: "TF / 023", name: "Campus network upgrade", badge: "Awaiting update", badgeStyle: "bg-[#E4EAF7] text-[#2F5BA8]", progress: 100, owner: "Sales team", due: "24 Oct" },
            ],
        },
    ];

    return (
        <div>
            <PanelHeader over="Opportunity workspace" title="A clear view of every bid." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {columns.map((col) => (
                    <div key={col.title} className="rounded-xl bg-white/70 border border-[#E6EBDD] p-3">
                        <div className="mb-3 flex items-center justify-between px-1">
                            <span className="text-sm font-medium text-[#0F1714]">{col.title}</span>
                            <span className="text-xs text-gray-400">
                                {String(col.count).padStart(2, "0")}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {col.cards.map((c) => (
                                <div key={c.ref} className="rounded-lg bg-white border border-[#EBF0E0] p-4">
                                    <p className="text-[11px] font-mono text-gray-500">{c.ref}</p>
                                    <p className="mt-1 text-sm font-semibold text-[#0F1714] leading-snug">
                                        {c.name}
                                    </p>
                                    {c.badge && (
                                        <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${c.badgeStyle}`}>
                                            {c.badge}
                                        </span>
                                    )}
                                    {typeof c.progress === "number" && (
                                        <div className="mt-3 h-1 w-full rounded-full bg-[#EAEFE0] overflow-hidden">
                                            <div className="h-full bg-[#1B6B52] rounded-full" style={{ width: `${c.progress}%` }} />
                                        </div>
                                    )}
                                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                                        <span>{c.owner}</span>
                                        <span>{c.due}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ==================== PANEL 2 — BID PREPARATION ==================== */
function PrepPanel() {
    const steps = [
        { label: "Requirements reviewed", state: "done" },
        { label: "Company documents gathered", state: "done" },
        { label: "Technical response", state: "review" },
        { label: "Pricing confirmation", state: "next" },
        { label: "Final check before submission", state: "later" },
    ];

    return (
        <div>
            <PanelHeader over="TF / 024 · Enterprise software supply" title="Preparation, step by step." />

            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
                {/* Checklist */}
                <ul className="divide-y divide-[#E6EBDD] rounded-xl bg-white/70 border border-[#E6EBDD]">
                    {steps.map((s) => (
                        <li key={s.label} className="flex items-center gap-3 px-4 py-3.5">
                            <StepDot state={s.state} />
                            <span className="flex-1 text-sm text-[#0F1714]">{s.label}</span>
                            <StateBadge state={s.state} />
                        </li>
                    ))}
                </ul>

                {/* Progress box */}
                <div className="rounded-xl bg-white/70 border border-[#E6EBDD] p-5">
                    <h4 className="text-base font-semibold text-[#0F1714]">Preparation progress</h4>
                    <div className="mt-5 h-2 w-full rounded-full bg-[#EAEFE0] overflow-hidden">
                        <div className="h-full bg-[#1B6B52] rounded-full" style={{ width: "70%" }} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium text-[#1B6B52]">3 of 5 steps</span>
                        <span>Due 18 Oct</span>
                    </div>
                    <p className="mt-6 text-xs text-gray-500 leading-relaxed">
                        Owner: Bid team. Next step: pricing confirmation.
                    </p>
                </div>
            </div>
        </div>
    );
}

function StepDot({ state }: { state: string }) {
    if (state === "done") {
        return (
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1B6B52]">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.3l2.4 2.3L9.5 3.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        );
    }
    return <span className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300" />;
}

function StateBadge({ state }: { state: string }) {
    const styles: Record<string, { label: string; cls: string }> = {
        done: { label: "Done", cls: "bg-[#DCEFAE] text-[#1B6B52]" },
        review: { label: "Review", cls: "bg-[#FBF3E3] text-[#A56A00]" },
        next: { label: "Next", cls: "bg-[#E4EAF7] text-[#2F5BA8]" },
        later: { label: "Later", cls: "bg-[#EEF1EA] text-[#5E6D66]" },
    };
    const s = styles[state];
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${s.cls}`}>
            {s.label}
        </span>
    );
}

/* ==================== PANEL 3 — FOLLOW-UPS ==================== */
function FollowUpsPanel() {
    const items = [
        { title: "Confirm supplier pricing", sub: "Equipment package", when: "Today", s: "follow" },
        { title: "Review the latest status", sub: "Network upgrade", when: "Tomorrow", s: "review" },
        { title: "Clarification reply recorded", sub: "Software supply", when: "Done", s: "done", done: true },
    ];
    const activity = [
        { t: "Supplier asked for revised quantities", d: "Yesterday" },
        { t: "Clarification question sent", d: "2 days ago" },
        { t: "Tender added to the register", d: "Last week" },
    ];

    return (
        <div>
            <PanelHeader over="Follow-up activity" title="Keep every conversation on your radar." />

            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
                {/* List */}
                <ul className="divide-y divide-[#E6EBDD] rounded-xl bg-white/70 border border-[#E6EBDD]">
                    {items.map((it) => (
                        <li key={it.title} className="flex items-center gap-3 px-4 py-4">
                            {it.done ? (
                                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1B6B52]">
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                        <path d="M2.5 6.3l2.4 2.3L9.5 3.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            ) : (
                                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#0F1714] font-medium truncate">{it.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{it.sub}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${it.s === "follow" ? "bg-[#FBF3E3] text-[#A56A00]" :
                                    it.s === "done" ? "bg-[#DCEFAE] text-[#1B6B52]" :
                                        "bg-[#E4EAF7] text-[#2F5BA8]"
                                }`}>{it.when}</span>
                        </li>
                    ))}
                </ul>

                {/* Recent activity */}
                <div className="rounded-xl bg-white/70 border border-[#E6EBDD] p-5">
                    <h4 className="text-base font-semibold text-[#0F1714]">Recent activity</h4>
                    <ul className="mt-4 space-y-3">
                        {activity.map((a) => (
                            <li key={a.t} className="flex items-start gap-3">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B6B52]" />
                                <div>
                                    <p className="text-sm text-[#0F1714] leading-snug">{a.t}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{a.d}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

/* ==================== PANEL 4 — SECURITY ==================== */
function SecurityPanel() {
    const items = [
        { title: "Tender security", sub: "Enterprise software supply · valid to 30 Nov", when: "Valid", s: "done" },
        { title: "Tender security", sub: "Campus network upgrade · return request", when: "Return due in 3 days", s: "follow" },
        { title: "Performance security", sub: "Industrial equipment package · release after delivery", when: "Release date set", s: "review" },
        { title: "Tender security", sub: "Office technology package", when: "Returned", s: "done", done: true },
    ];
    const watch = [
        { t: "Return request reminder", d: "Today" },
        { t: "Validity ends in 12 days", d: "Reminder scheduled" },
        { t: "Release date added after award", d: "Yesterday" },
    ];

    return (
        <div>
            <PanelHeader over="Tender security · Performance security" title="No more money sitting idle, forgotten." />

            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
                <ul className="divide-y divide-[#E6EBDD] rounded-xl bg-white/70 border border-[#E6EBDD]">
                    {items.map((it, idx) => (
                        <li key={idx} className="flex items-center gap-3 px-4 py-4">
                            {it.done ? (
                                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1B6B52]">
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                        <path d="M2.5 6.3l2.4 2.3L9.5 3.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            ) : (
                                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#0F1714] font-medium">{it.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{it.sub}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${it.s === "follow" ? "bg-[#FBF3E3] text-[#A56A00]" :
                                    it.s === "done" ? "bg-[#DCEFAE] text-[#1B6B52]" :
                                        "bg-[#E4EAF7] text-[#2F5BA8]"
                                }`}>{it.when}</span>
                        </li>
                    ))}
                </ul>

                <div className="rounded-xl bg-white/70 border border-[#E6EBDD] p-5">
                    <h4 className="text-base font-semibold text-[#0F1714]">Idle-money watch</h4>
                    <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                        Every security gets a validity date and a return or release date, with a
                        reminder before each one.
                    </p>
                    <ul className="mt-5 space-y-3">
                        {watch.map((w) => (
                            <li key={w.t} className="flex items-start gap-3">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B6B52]" />
                                <div>
                                    <p className="text-sm text-[#0F1714] leading-snug">{w.t}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{w.d}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

/* ==================== PANEL 5 — DOCS ==================== */
function DocsPanel() {
    const items = [
        { title: "Trade licence", sub: "Company document", when: "Valid to Dec 2027", s: "done" },
        { title: "Tax and VAT certificates", sub: "Company document", when: "Valid", s: "done" },
        { title: "Bank solvency certificate", sub: "Company document", when: "Renew in 20 days", s: "follow" },
        { title: "Experience certificates", sub: "Past work proof", when: "Updated this week", s: "done" },
    ];
    const record = [
        { t: "Campus network upgrade", d: "Sample client · 2024" },
        { t: "Enterprise software supply", d: "Sample client · 2023" },
        { t: "Industrial equipment package", d: "Sample client · 2022" },
    ];

    return (
        <div>
            <PanelHeader over="Experience · Company documents" title="Keep proof ready for every bid." />

            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
                <ul className="divide-y divide-[#E6EBDD] rounded-xl bg-white/70 border border-[#E6EBDD]">
                    {items.map((it) => (
                        <li key={it.title} className="flex items-center gap-3 px-4 py-4">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1B6B52]">
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                    <path d="M2.5 6.3l2.4 2.3L9.5 3.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#0F1714] font-medium">{it.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{it.sub}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${it.s === "follow" ? "bg-[#FBF3E3] text-[#A56A00]" : "bg-[#DCEFAE] text-[#1B6B52]"
                                }`}>{it.when}</span>
                        </li>
                    ))}
                </ul>

                <div className="rounded-xl bg-white/70 border border-[#E6EBDD] p-5">
                    <h4 className="text-base font-semibold text-[#0F1714]">Experience record</h4>
                    <ul className="mt-4 space-y-3">
                        {record.map((r) => (
                            <li key={r.t} className="flex items-start gap-3">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B6B52]" />
                                <div>
                                    <p className="text-sm text-[#0F1714] leading-snug">{r.t}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{r.d}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-5 text-xs text-gray-500 leading-relaxed">
                        Save a document once. Attach it to any tender checklist.
                    </p>
                </div>
            </div>
        </div>
    );
}