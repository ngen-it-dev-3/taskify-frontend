"use client";

import { useInView } from "@/hooks/site/useInView";

export default function TeamsAndReminders() {
  const { ref, inView } = useInView<HTMLDivElement>();

  const teams = [
    { name: "Bid team",      count: 5, pct: 80 },
    { name: "Sourcing team", count: 3, pct: 48 },
    { name: "Sales team",    count: 4, pct: 64 },
  ];

  const reminders = [
    {
      title: "Review documents, software supply",
      when: "Tomorrow",
      whenCls: "bg-[#FBF3E3] text-[#A56A00]",
    },
    {
      title: "Confirm supplier pricing",
      when: "Today",
      whenCls: "bg-[#FBF3E3] text-[#A56A00]",
    },
    {
      title: "Industrial package closes",
      when: "In 3 days",
      whenCls: "bg-[#E4EAF7] text-[#2F5BA8]",
    },
  ];

  return (
    <section className="bg-[#F4F7EC] pt-10 md:pt-10">
      <div className="wrap max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
            Teams and reminders
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-[#0F1714]">
            Everyone knows what is theirs.
            <br />
            Nothing slips past.
          </h2>
        </div>

        {/* Two cards */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 — Team workload */}
          <article
            className={`rounded-2xl border border-[#E6EBDD] bg-white p-7 md:p-9 ${
              inView ? "anim-slide-up d-1" : "opacity-0"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
              Illustrative concept
            </p>
            <h3 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-[#0F1714] leading-tight">
              See the load across teams.
            </h3>
            <p className="mt-3 text-sm text-[#0F1714]/60 leading-relaxed max-w-sm">
              An overview of how many open tenders each team is carrying.
            </p>

            <div className="mt-7 space-y-5">
              {teams.map((t, i) => (
                <div
                  key={t.name}
                  className="grid grid-cols-[110px_1fr_28px] items-center gap-4 text-sm"
                >
                  <span className="text-[#0F1714]/80">{t.name}</span>
                  <div className="h-2 rounded-full bg-[#EAEFE0] overflow-hidden">
                    <div
                      className="h-full bg-[#1B6B52] rounded-full transition-transform duration-1000 ease-out"
                      style={{
                        width: `${t.pct}%`,
                        transformOrigin: "left center",
                        animation: inView
                          ? `grow-x 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.15}s both`
                          : "none",
                        transform: inView ? undefined : "scaleX(0)",
                      }}
                    />
                  </div>
                  <span className="text-right font-semibold text-[#0F1714]">
                    {String(t.count).padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
          </article>

          {/* Card 2 — Reminders */}
          <article
            className={`rounded-2xl border border-[#E6EBDD] bg-white p-7 md:p-9 ${
              inView ? "anim-slide-up d-2" : "opacity-0"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
              Illustrative concept
            </p>
            <h3 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-[#0F1714] leading-tight">
              Reminders before it is late.
            </h3>
            <p className="mt-3 text-sm text-[#0F1714]/60 leading-relaxed max-w-sm">
              Deadlines and pending actions surface ahead of time. Delivery
              channels are to be confirmed.
            </p>

            <ul className="mt-7 space-y-3">
              {reminders.map((r, i) => (
                <li
                  key={r.title}
                  className={`flex items-center gap-3 rounded-xl bg-[#F7FAF0] border border-[#E6EBDD] px-4 py-3.5 transition-all duration-500 hover:-translate-y-0.5 hover:border-[#B9D1A8] hover:shadow-[0_8px_20px_-12px_rgba(27,107,82,0.25)] ${
                    inView ? `anim-slide-up d-${4 + i}` : "opacity-0"
                  }`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white border border-[#E6EBDD]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1B6B52"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3a5 5 0 0 0-5 5v3l-2 3h14l-2-3V8a5 5 0 0 0-5-5zM10 18a2 2 0 0 0 4 0" />
                    </svg>
                  </span>
                  <span className="flex-1 text-sm text-[#0F1714] truncate">
                    {r.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${r.whenCls}`}
                  >
                    {r.when}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}