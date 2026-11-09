"use client";
import { useInView } from "@/hooks/site/useInView";
import { useState } from "react";

export default function DailyView() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [done, setDone] = useState<Record<number, boolean>>({ 0: true });

  const checks = [
    "Daily updates in one place",
    "Preparation progress at a glance",
    "A visible next action for each tender",
  ];

  const tasks = [
    { label: "Update the tender register",    due: "Done" },
    { label: "Review preparation documents",  due: "Today" },
    { label: "Follow up on supplier pricing", due: "Today" },
    { label: "Check the submission deadline", due: "Tomorrow" },
  ];

  return (
    <section className="bg-[#F4F7EC] pt-20 md:pt-20">
      <div ref={ref} className="wrap max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left copy */}
          <div className={inView ? "anim-slide-up d-1" : "opacity-0"}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
              Your daily view
            </p>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-[#0F1714]">
              Know what needs
              <br />
              your attention.
            </h2>
            <p className="mt-5 max-w-md text-base text-[#0F1714]/60 leading-relaxed">
              Start the day with a clearer picture of preparation, follow-ups and
              approaching deadlines.
            </p>

            <ul className="mt-8 divide-y divide-[#E0E7D1] max-w-md">
              {checks.map((c) => (
                <li key={c} className="flex items-center gap-3 py-3.5">
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-[#1B6B52]">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.3l2.4 2.3L9.5 3.8" stroke="#1B6B52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-sm text-[#0F1714]">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right card */}
          <div
            className={`rounded-2xl border border-[#E6EBDD] bg-white p-6 md:p-8 shadow-[0_20px_50px_-30px_rgba(27,107,82,0.2)] ${
              inView ? "anim-slide-up d-2" : "opacity-0"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
              Illustrative daily action view · tick to try
            </p>
            <h3 className="mt-3 text-2xl font-bold text-[#0F1714] leading-tight">
              A little structure.
              <br />
              A clearer day.
            </h3>

            <ul className="mt-6">
              {tasks.map((t, i) => {
                const isDone = !!done[i];
                return (
                  <li
                    key={t.label}
                    className="flex items-center gap-3 border-b border-gray-100 py-3.5 last:border-0 cursor-pointer"
                    onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                        isDone
                          ? "bg-[#1B6B52] border-[#1B6B52]"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isDone && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6.3l2.4 2.3L9.5 3.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`flex-1 text-sm ${
                        isDone ? "text-gray-400 line-through" : "text-[#0F1714]"
                      }`}
                    >
                      {t.label}
                    </span>
                    <span className="text-xs text-gray-500">{t.due}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}