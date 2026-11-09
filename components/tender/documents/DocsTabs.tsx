// components/tender/documents/DocsTabs.tsx
"use client";

import type { CompanyDocCategory } from "@/lib/api/tender.api";

export type DocsTab = CompanyDocCategory;

interface Props {
  active: DocsTab;
  counts: Record<string, number>;
  onChange: (tab: DocsTab) => void;
}

const TABS: { id: DocsTab; label: string }[] = [
  { id: "legal", label: "Legal Docs" },
  { id: "profiles", label: "Company Profiles" },
  { id: "work-orders", label: "Work Orders" },
  { id: "certificates", label: "Partnership Certificates" },
  { id: "team", label: "Team & CVs" },
  { id: "datasheets", label: "Datasheets / Brochures" },
];

export function DocsTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200">
      {TABS.map((t) => {
        const isActive = active === t.id;
        const count = counts[t.id] || 0;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`relative inline-flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              isActive
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                  isActive
                    ? "bg-[#fdf8ec] text-[#a97400]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            )}
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#a97400]" />
            )}
          </button>
        );
      })}
    </div>
  );
}