// components/tender/security/SecurityStats.tsx
"use client";

interface StatItem {
  label: string;
  value: string;
  hint?: string;
  tone?: "blue" | "red" | "green" | "amber" | "dark";
}

interface Props {
  stats: StatItem[];
}

const TONE_STYLES = {
  blue: "border-t-[3px] border-t-blue-500",
  red: "border-t-[3px] border-t-red-500",
  green: "border-t-[3px] border-t-emerald-600",
  amber: "border-t-[3px] border-t-amber-500",
  dark: "border-t-[3px] border-t-slate-800",
};

export function SecurityStats({ stats }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm ${
            s.tone ? TONE_STYLES[s.tone] : ""
          }`}
        >
          <p className="text-[11px] font-medium text-slate-500 mb-2">{s.label}</p>
          <p className={`font-mono text-xl font-bold ${
            s.tone === 'red' ? 'text-red-600' : 'text-slate-900'
          }`}>
            {s.value}
          </p>
          {s.hint && (
            <p className="mt-1 text-[11px] text-slate-400">{s.hint}</p>
          )}
        </div>
      ))}
    </section>
  );
}