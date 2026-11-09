// components/tender/submission/SubmissionPackageStepper.tsx
"use client";

import { Plus, Trash2 } from "lucide-react";
import type { TenderSection } from "@/lib/api/tender.api";

interface Props {
    sections: TenderSection[];
    activeSectionId: string | null;
    onSelect: (id: string) => void;
    onAddSection?: () => void;
    onRemoveSection?: () => void;
}

/**
 * Horizontal numbered stepper for the submission package sections.
 * Renders each section with its "ready/total" counter, and appends
 * a "+ Section" button at the end.
 */
export function SubmissionPackageStepper({
    sections,
    activeSectionId,
    onSelect,
    onAddSection,
    onRemoveSection,
}: Props) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {sections.map((s, idx) => {
                const active = s.id === activeSectionId;
                const ready = s.readyCount ?? 0;
                const total = s.totalCount ?? 0;
                const complete = total > 0 && ready === total;

                return (
                    <div
                        key={s.id}
                        className={`group/stepper relative inline-flex h-8 items-center rounded-full border text-[11px] font-semibold transition ${active
                            ? "border-[#a97400] bg-[#a97400] pr-1 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                    >
                        <button
                            type="button"
                            onClick={() => onSelect(s.id)}
                            className="inline-flex h-full items-center gap-2 pl-3 pr-2"
                        >
                            {/* number badge */}
                            <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${active
                                    ? "bg-white/20 text-white"
                                    : complete
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                            >
                                {idx + 1}
                            </span>

                            <span className="whitespace-nowrap">{s.title}</span>

                            <span
                                className={`ml-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold ${active
                                    ? "bg-white/20 text-white"
                                    : complete
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                            >
                                {ready}/{total}
                            </span>
                        </button>

                        {/* ✅ Delete button (only shows when the tab is active) */}
                        {active && onRemoveSection && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveSection();
                                }}
                                className="mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-rose-500 hover:text-white"
                                title="Remove this section"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                );
            })}

            {onAddSection && (
                <button
                    type="button"
                    onClick={onAddSection}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-500 transition hover:border-[#a97400] hover:text-[#a97400]"
                >
                    <Plus className="h-3 w-3" />
                    Section
                </button>
            )}
        </div>
    );
}