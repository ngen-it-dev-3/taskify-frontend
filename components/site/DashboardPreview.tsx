"use client";

import { useState } from "react";

/* ============ SIDEBAR MENU ============ */
const MENU = [
  { id: "overview",    label: "Overview",        icon: "grid" },
  { id: "register",    label: "Tender register", icon: "list" },
  { id: "preparation", label: "Preparation",     icon: "check" },
  { id: "followups",   label: "Follow-ups",      icon: "rotate" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "reports",     label: "Reports",         icon: "chart" },
];

const ICONS: Record<string, React.ReactNode> = {
  grid: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  ),
  list: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3.2 3L13 4.5" />
    </svg>
  ),
  rotate: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" />
    </svg>
  ),
  bell: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2a3.5 3.5 0 0 0-3.5 3.5V8L3 10.5h10L11.5 8V5.5A3.5 3.5 0 0 0 8 2zM6.7 12.5a1.4 1.4 0 0 0 2.6 0" />
    </svg>
  ),
  chart: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
      <path d="M5 6.5h6M5 9.5h6" strokeLinecap="round" />
    </svg>
  ),
};

export default function DashboardPreview() {
  const [active, setActive] = useState("overview");

  return (
    <section id="workspace" className="wrap py-16 md:py-24 bg-[#f7f8f1]">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#E6EBDD] bg-white shadow-[0_30px_60px_-20px_rgba(27,107,82,0.15)]">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside className="bg-[#123B2C] text-white p-5">
            <div className="mb-8 flex items-center gap-2 font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-white/10">↗</span>
              <span>Orvix Tender</span>
            </div>
            <ul className="space-y-1 text-sm">
              {MENU.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setActive(m.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      active === m.id
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className={active === m.id ? "text-white" : "text-white/60"}>
                      {ICONS[m.icon]}
                    </span>
                    <span className={active === m.id ? "font-semibold" : ""}>{m.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Content */}
          <div className="p-6 md:p-10 min-h-[520px] bg-white">
            {active === "overview" && <OverviewView />}
            {active === "register" && <RegisterView />}
            {active === "preparation" && <PreparationView />}
            {active === "followups" && <FollowUpsView />}
            {active === "notifications" && <NotificationsView />}
            {active === "reports" && <ReportsView />}
          </div>
        </div>
      </div>

      {/* Audience strip */}
      <div className="mt-16 text-center">
        <p className="text-sm text-[#0F1714]/60">
          Designed around the teams that prepare and pursue tenders
        </p>
        <ul className="mt-4 tender-text-color flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-[#0F1714]">
          <li>Suppliers</li>
          <li>Contractors</li>
          <li>Service providers</li>
          <li>Bid teams</li>
        </ul>
      </div>
    </section>
  );
}

/* ==================== SHARED UI ==================== */

function ViewHeader({ over, title, tag }: { over: string; title: string; tag: string }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1B6B52]">
          {over}
        </p>
        <h3 className="mt-2 text-2xl md:text-[28px] font-bold text-[#0F1714] leading-tight">
          {title}
        </h3>
      </div>
      <span className="rounded-full bg-[#EEF3E4] px-3 py-1 text-[11px] font-medium text-[#5E6D66] shrink-0">
        {tag}
      </span>
    </div>
  );
}

/* ==================== OVERVIEW ==================== */
function OverviewView() {
  const [filter, setFilter] = useState<"all" | "prep" | "follow" | "sub">("all");

  const all = [
    { name: "Enterprise software supply",  owner: "Bid team",       due: "18 Oct", status: "In preparation", s: "prep" },
    { name: "Industrial equipment package", owner: "Sourcing team",  due: "21 Oct", status: "Follow-up",      s: "follow" },
    { name: "Campus network upgrade",       owner: "Sales team",     due: "24 Oct", status: "Submitted",      s: "sub" },
  ];

  const rows = filter === "all" ? all : all.filter((r) => r.s === filter);

  const chips: { key: typeof filter; label: string }[] = [
    { key: "all",    label: "All tenders" },
    { key: "prep",   label: "In preparation" },
    { key: "follow", label: "Follow-up" },
    { key: "sub",    label: "Submitted" },
  ];

  return (
    <div>
      <ViewHeader over="Your tender workspace" title="Good morning, bid team." tag="Illustrative dashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Active tenders",      value: "12", sub: "In your pipeline" },
          { label: "In preparation",      value: "05", sub: "Work in progress" },
          { label: "Upcoming deadlines",  value: "03", sub: "This week" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-[#E6EBDD] p-4">
            <p className="text-xs text-gray-500">{k.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-3xl font-bold text-[#0F1714]">{k.value}</p>
              <p className="text-xs text-gray-500">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === c.key
                ? "border-[#1B6B52] bg-[#E8F0E0] text-[#1B6B52]"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E6EBDD]">
        <table className="w-full text-sm">
          <thead className="bg-[#F2F6EA] text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Tender / opportunity</th>
              <th className="text-left px-4 py-3 font-medium">Owner</th>
              <th className="text-left px-4 py-3 font-medium">Due date</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.name} className="border-t border-gray-100">
                <td className="px-4 py-4 font-medium text-[#0F1714]">{t.name}</td>
                <td className="px-4 py-4 text-gray-600">{t.owner}</td>
                <td className="px-4 py-4 text-gray-600">{t.due}</td>
                <td className="px-4 py-4">
                  <StatusPill s={t.s} label={t.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Showing {rows.length} of {all.length} sample tenders
      </p>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-[#FBF3E3] px-4 py-3 text-sm">
        <span className="text-[#7A5B1E]">◷ Next action: review documents for the software supply bid</span>
        <span className="font-semibold text-[#7A5B1E]">Due tomorrow</span>
      </div>
    </div>
  );
}

function StatusPill({ s, label }: { s: string; label: string }) {
  const styles: Record<string, string> = {
    prep:   "bg-[#E8F0E0] text-[#1B6B52]",
    follow: "bg-[#FBF3E3] text-[#A56A00]",
    sub:    "bg-[#E4EAF7] text-[#2F5BA8]",
    review: "bg-[#FBF3E3] text-[#A56A00]",
    done:   "bg-[#E8F0E0] text-[#1B6B52]",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${styles[s] || "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}

/* ==================== REGISTER ==================== */
function RegisterView() {
  const rows = [
    { ref: "TF / 027", name: "Office technology package",   owner: "Sales team",    close: "30 Oct", status: "Review",          s: "review" },
    { ref: "TF / 026", name: "Water monitoring equipment",  owner: "Bid team",      close: "28 Oct", status: "Review",          s: "review" },
    { ref: "TF / 025", name: "Industrial equipment package", owner: "Sourcing team", close: "21 Oct", status: "In preparation",  s: "prep" },
    { ref: "TF / 024", name: "Enterprise software supply",  owner: "Bid team",      close: "18 Oct", status: "In preparation",  s: "prep" },
    { ref: "TF / 023", name: "Campus network upgrade",      owner: "Sales team",    close: "24 Oct", status: "Submitted",       s: "sub" },
  ];

  return (
    <div>
      <ViewHeader over="Tender register" title="Every tender, one list." tag="Sample records" />

      <div className="overflow-hidden rounded-lg border border-[#E6EBDD]">
        <table className="w-full text-sm">
          <thead className="bg-[#F2F6EA] text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Ref</th>
              <th className="text-left px-4 py-3 font-medium">Tender / opportunity</th>
              <th className="text-left px-4 py-3 font-medium">Owner</th>
              <th className="text-left px-4 py-3 font-medium">Closing</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ref} className="border-t border-gray-100">
                <td className="px-4 py-4 font-medium text-[#0F1714]">{r.ref}</td>
                <td className="px-4 py-4 text-[#0F1714]">{r.name}</td>
                <td className="px-4 py-4 text-gray-600">{r.owner}</td>
                <td className="px-4 py-4 text-gray-600">{r.close}</td>
                <td className="px-4 py-4">
                  <StatusPill s={r.s} label={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">Showing 5 sample tenders, newest first.</p>
    </div>
  );
}

/* ==================== PREPARATION ==================== */
function PreparationView() {
  const items = [
    { name: "Enterprise software supply", ref: "TF / 024", done: 3, total: 5, next: "technical response review", due: "Due 18 Oct" },
    { name: "Industrial equipment package", ref: "TF / 025", done: 2, total: 5, next: "confirm supplier pricing", due: "Due 21 Oct" },
    { name: "Water monitoring equipment", ref: "TF / 026", done: 1, total: 5, next: "requirements review", due: "Due 28 Oct" },
    { name: "Office technology package", ref: "TF / 027", done: 0, total: 5, next: "Not started", due: "Due 30 Oct" },
  ];

  return (
    <div>
      <ViewHeader over="Preparation" title="See what is left to do." tag="Sample records" />

      <div className="space-y-6">
        {items.map((it) => {
          const pct = Math.round((it.done / it.total) * 100);
          return (
            <div key={it.ref} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-semibold text-[#0F1714]">{it.name}</span>
                  <span className="ml-2 text-xs text-gray-500">{it.ref}</span>
                </div>
                <span className="text-sm font-semibold text-[#0F1714]">
                  {it.done} of {it.total} steps
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-[#EAEFE0] overflow-hidden">
                <div className="h-full bg-[#1B6B52] rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Next: {it.next}</span>
                <span>{it.due}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==================== FOLLOW-UPS ==================== */
function FollowUpsView() {
  const items = [
    { title: "Confirm supplier pricing",   sub: "Industrial equipment package", when: "Today",       s: "follow" },
    { title: "Review the latest status",   sub: "Campus network upgrade",       when: "Tomorrow",    s: "review" },
    { title: "Send clarification question",sub: "Water monitoring equipment",   when: "In 2 days",   s: "review" },
    { title: "Clarification reply recorded", sub: "Software supply",            when: "Done",        s: "done", done: true },
  ];

  return (
    <div>
      <ViewHeader over="Follow-ups" title="Nothing slips past." tag="Sample records" />

      <ul className="divide-y divide-gray-100">
        {items.map((it) => (
          <li key={it.title} className="flex items-center gap-4 py-4">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
              it.done ? "border-[#1B6B52] bg-[#1B6B52] text-white" : "border-gray-300"
            }`}>
              {it.done && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.3l2.4 2.3L9.5 3.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0F1714]">{it.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{it.sub}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
              it.s === "follow" ? "bg-[#FBF3E3] text-[#A56A00]" :
              it.s === "done"   ? "bg-[#E8F0E0] text-[#1B6B52]" :
              "bg-[#E4EAF7] text-[#2F5BA8]"
            }`}>
              {it.when}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ==================== NOTIFICATIONS ==================== */
function NotificationsView() {
  const [prefs, setPrefs] = useState({
    daily: true,
    deadline: true,
    security: false,
  });

  const rows = [
    { key: "daily",    title: "Daily tender update by email", sub: "New tenders matching your interests" },
    { key: "deadline", title: "Deadline reminders",            sub: "Before a closing date" },
    { key: "security", title: "Security return reminders",     sub: "When a tender or performance security is due back" },
  ] as const;

  return (
    <div>
      <ViewHeader over="Notifications" title="Reminders before it is late." tag="Sample settings" />

      <ul className="space-y-3">
        {rows.map((r) => {
          const on = prefs[r.key];
          return (
            <li key={r.key} className="flex items-center justify-between rounded-xl border border-[#E6EBDD] bg-[#FBFBF7] px-4 py-4">
              <div>
                <p className="text-sm font-medium text-[#0F1714]">{r.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.sub}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => setPrefs((p) => ({ ...p, [r.key]: !on }))}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  on ? "bg-[#1B6B52]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                    on ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-gray-500">Switches are part of the illustration. Nothing is saved or sent.</p>
    </div>
  );
}

/* ==================== REPORTS ==================== */
function ReportsView() {
  const kpis = [
    { label: "Submitted",      value: "01" },
    { label: "In preparation", value: "02" },
    { label: "In review",      value: "02" },
  ];
  const teams = [
    { name: "Bid team",      count: 5, pct: 80 },
    { name: "Sourcing team", count: 3, pct: 48 },
    { name: "Sales team",    count: 4, pct: 64 },
  ];

  return (
    <div>
      <ViewHeader over="Reports" title="Show the work." tag="Sample figures" />

      <div className="grid grid-cols-3 gap-3 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-[#E6EBDD] p-4">
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className="mt-1 text-3xl font-bold text-[#0F1714]">{k.value}</p>
          </div>
        ))}
      </div>

      <h4 className="text-base font-semibold text-[#0F1714] mb-4">Open tenders by team</h4>

      <div className="space-y-4">
        {teams.map((t) => (
          <div key={t.name} className="grid grid-cols-[110px_1fr_28px] items-center gap-4 text-sm">
            <span className="text-gray-600">{t.name}</span>
            <div className="h-2 rounded-full bg-[#EAEFE0] overflow-hidden">
              <div className="h-full bg-[#1B6B52] rounded-full" style={{ width: `${t.pct}%` }} />
            </div>
            <span className="text-right font-semibold text-[#0F1714]">
              {String(t.count).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}