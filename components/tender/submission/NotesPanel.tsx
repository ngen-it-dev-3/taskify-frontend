// components/tender/submission/NotesPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface Props {
  value: string;
  onSave?: (notes: string) => Promise<void> | void;
  saving?: boolean;
  readOnly?: boolean;
}

export function NotesPanel({
  value,
  onSave,
  saving = false,
  readOnly = false,
}: Props) {
  const [text, setText] = useState(value);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setText(value ?? "");
    setDirty(false);
  }, [value]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3 w-3 text-[#a97400]" />
          Notes
        </p>
        {!readOnly && dirty && (
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              await onSave?.(text);
              setDirty(false);
            }}
            className="inline-flex h-6 items-center rounded-md bg-[#a97400] px-2.5 text-[10px] font-bold text-white transition hover:bg-[#8f6100] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
        readOnly={readOnly}
        rows={2}
        placeholder="No notes yet."
        className="w-full resize-none rounded-md border border-slate-200 bg-slate-50/40 px-3 py-2 text-[11px] leading-relaxed text-slate-700 placeholder:text-slate-400 focus:border-[#a97400] focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-200"
      />
    </div>
  );
}