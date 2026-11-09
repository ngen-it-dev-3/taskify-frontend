// components/tender/documents/ImportBar.tsx
"use client";

import { ArrowRight, Loader2, X, Search, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

export interface ImportTarget {
  id: string;
  label: string;
  group: "Potential" | "Submission";
}

interface Props {
  selectedCount: number;
  targets: ImportTarget[];
  value: string | null;
  onChangeTarget: (id: string) => void;
  onImport: () => void;
  onClearSelection?: () => void;
  importing?: boolean;
}

export function ImportBar({
  selectedCount,
  targets,
  value,
  onChangeTarget,
  onImport,
  onClearSelection,
  importing = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group targets by "Potential" and "Submission" based on search filter
  const { potential, submission } = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = targets.filter((t) => t.label.toLowerCase().includes(q));
    return {
      potential: filtered.filter((t) => t.group === "Potential"),
      submission: filtered.filter((t) => t.group === "Submission"),
    };
  }, [targets, search]);

  if (selectedCount === 0) return null;

  const selectedTarget = targets.find((t) => t.id === value);
  const hasTargets = targets.length > 0;
  const hasFiltered = potential.length > 0 || submission.length > 0;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex w-full max-w-4xl -translate-x-1/2 flex-wrap items-center gap-3 rounded-xl bg-[#0f172a] px-4 py-3 shadow-2xl">
      <span className="text-[12px] font-semibold text-white">
        {selectedCount} document{selectedCount === 1 ? "" : "s"} selected
      </span>

      {onClearSelection && (
        <button
          type="button"
          onClick={onClearSelection}
          disabled={importing}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 text-[10px] font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}

      {/* ================= SEARCHABLE DROPDOWN ================= */}
      <div className="relative min-w-[320px] flex-1" ref={dropdownRef}>
        <div
          className={`flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border border-slate-700 bg-white px-3 text-xs font-medium ${isOpen ? "ring-2 ring-blue-500 border-transparent" : ""
            }`}
          onClick={() => {
            if (!importing && hasTargets) setIsOpen(!isOpen);
          }}
        >
          <span className={value ? "text-slate-900" : "text-slate-500"}>
            {selectedTarget ? selectedTarget.label : "Import to tender..."}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-[400px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
            {/* Search Input inside dropdown */}
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tender by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-md bg-slate-50 pl-8 pr-3 text-xs text-slate-900 outline-none focus:bg-slate-100"
                  autoFocus
                />
              </div>
            </div>

            {/* List Options */}
            <div className="max-h-[260px] overflow-y-auto p-1">
              {!hasTargets ? (
                <div className="p-3 text-center text-xs text-slate-500">No tenders available</div>
              ) : !hasFiltered ? (
                <div className="p-3 text-center text-xs text-slate-500">No tenders match your search</div>
              ) : (
                <>
                  {potential.length > 0 && (
                    <div className="mb-1">
                      <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Potential
                      </div>
                      {potential.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onChangeTarget(t.id);
                            setIsOpen(false);
                            setSearch("");
                          }}
                          className={`flex w-full items-center px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 ${value === t.id ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white" : ""
                            }`}
                        >
                          <span className="truncate">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {submission.length > 0 && (
                    <div>
                      <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Submission
                      </div>
                      {submission.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onChangeTarget(t.id);
                            setIsOpen(false);
                            setSearch("");
                          }}
                          className={`flex w-full items-center px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 ${value === t.id ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white" : ""
                            }`}
                        >
                          <span className="truncate">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= IMPORT BUTTON ================= */}
      <button
        type="button"
        onClick={onImport}
        disabled={!value || importing}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {importing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Importing…
          </>
        ) : (
          <>
            Import Selected
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </div>
  );
}