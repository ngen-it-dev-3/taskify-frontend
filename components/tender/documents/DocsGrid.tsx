// components/tender/documents/DocsGrid.tsx
"use client";

import { DocCard } from "./DocCard";
import type { CompanyDocUI } from "@/lib/api/mappers";
import type { DocsTab } from "./DocsTabs";

interface Props {
  docs: CompanyDocUI[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onAction?: (doc: CompanyDocUI, action?: "view" | "edit" | "renew") => void;
  onDelete?: (doc: CompanyDocUI) => void;
  category: DocsTab; // ✅ Added category so cards know how to render
  emptyMessage?: string;
}

export function DocsGrid({
  docs,
  selectedIds,
  onToggleSelect,
  onAction,
  onDelete,
  category,
  emptyMessage = "No documents in this category yet.",
}: Props) {
  if (!docs.length) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/60 p-12 text-center text-[13px] text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc) => (
        <DocCard
          key={doc.id}
          doc={doc}
          category={category}
          selected={selectedIds.has(doc.id)}
          onToggleSelect={onToggleSelect}
          onAction={onAction}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}