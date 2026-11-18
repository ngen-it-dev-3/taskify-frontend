"use client";

import Link from "next/link";

export interface StatItem {
  label: string;
  value: string;
  hint?: string;
  highlighted?: boolean;
  href?: string; // 👈 নতুন: কার্ড ক্লিক করলে কোথায় যাবে
}

interface Props {
  stats: StatItem[];
}

export function TenderOverviewStats({ stats }: Props) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((s) => {
        // কার্ডের ভেতরের কন্টেন্ট
        const content = (
          <div
            className={`h-full rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${s.href ? "cursor-pointer transition-all hover:border-slate-300 hover:shadow-md" : ""
              }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {s.label}
            </p>
            <p
              className={`mt-1.5 font-mono text-xl font-bold tracking-tight ${s.highlighted ? "text-[#a97400]" : "text-slate-900"
                }`}
            >
              {s.value}
            </p>
            {s.hint && (
              <p className="mt-0.5 text-[11px] text-slate-500">{s.hint}</p>
            )}
          </div>
        );

        // যদি href থাকে, তবে Link হিসেবে র‍্যাপ করব, না থাকলে সাধারণ div
        return s.href ? (
          <Link key={s.label} href={s.href} className="block h-full">
            {content}
          </Link>
        ) : (
          <div key={s.label} className="h-full">
            {content}
          </div>
        );
      })}
    </section>
  );
}