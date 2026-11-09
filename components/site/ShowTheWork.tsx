"use client";

import { useInView } from "@/hooks/site/useInView";

export default function ShowTheWork() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section className="bg-[#F4F7EC] py-20 md:py-28">
      <div className="wrap max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
            The details that bring it together
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-[#0F1714]">
            Show the work.
            <br />
            Make the value visible.
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-base text-[#0F1714]/60 leading-relaxed">
            A closer look at how dates, preparation and daily actions could appear
            in your tender workspace.
          </p>
        </div>

        {/* Two cards */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 — Upcoming dates */}
          <article
            className={`rounded-3xl bg-[#E9EFDD] p-7 md:p-9 ${
              inView ? "anim-slide-up d-1" : "opacity-0"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
              01 / Upcoming dates
            </p>
            <h3 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-[#0F1714] leading-tight">
              Give deadlines a place to stand out.
            </h3>
            <p className="mt-3 text-sm text-[#0F1714]/60 leading-relaxed max-w-sm">
              A calendar-style interface concept puts upcoming tender dates into
              a visual context.
            </p>

            {/* Calendar mockup card */}
            <div className="mt-8 md:mt-10 flex justify-center">
              <CalendarCard animateIn={inView} />
            </div>
          </article>

          {/* Card 2 — Preparation overview */}
          <article
            className={`rounded-3xl bg-[#E5EAEB] p-7 md:p-9 ${
              inView ? "anim-slide-up d-2" : "opacity-0"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
              02 / Preparation overview
            </p>
            <h3 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-[#0F1714] leading-tight">
              Turn the next step into focus.
            </h3>
            <p className="mt-3 text-sm text-[#0F1714]/60 leading-relaxed max-w-sm">
              A concise preparation view keeps pending work easy to scan.
            </p>

            {/* Preparation mockup card */}
            <div className="mt-8 md:mt-10 flex justify-center">
              <PrepCard animateIn={inView} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ==================== CALENDAR CARD ==================== */
function CalendarCard({ animateIn }: { animateIn: boolean }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dates = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  const highlighted = [18, 21, 24];

  return (
    <div
      className={`w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-[0_20px_40px_-20px_rgba(27,107,82,0.25)] transition-transform duration-500 ease-out hover:scale-[1.02] ${
        animateIn ? "anim-slide-up d-3" : "opacity-0"
      }`}
      style={{ transform: "rotate(-2deg)" }}
    >
      <p className="text-base font-bold text-[#0F1714]">
        October · Tender schedule
      </p>

      {/* Day labels */}
      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-gray-400">
        {days.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      {/* Dates */}
      <div className="mt-2 grid grid-cols-7 gap-1.5 text-center text-sm">
        {dates.map((d, i) => {
          const isHL = highlighted.includes(d);
          return (
            <span
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${
                isHL
                  ? "bg-[#1B6B52] text-white font-semibold shadow-[0_4px_10px_-4px_rgba(27,107,82,0.6)]"
                  : "text-[#0F1714]/80 hover:bg-gray-100"
              }`}
              style={{
                animation: animateIn
                  ? `pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.4 + i * 0.02}s both`
                  : "none",
              }}
            >
              {d}
            </span>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px]">
        <span className="flex items-center gap-2 text-[#1B6B52] font-medium">
          <span className="h-2 w-2 rounded-full bg-[#1B6B52]" />
          Sample tender deadline
        </span>
        <span className="text-gray-400">Interface concept</span>
      </div>
    </div>
  );
}

/* ==================== PREPARATION CARD ==================== */
function PrepCard({ animateIn }: { animateIn: boolean }) {
  const rows = [
    {
      icon: "✓",
      iconCls: "text-[#1B6B52]",
      label: "Requirements reviewed",
      status: "Done",
      statusCls: "bg-[#DCEFAE] text-[#1B6B52]",
    },
    {
      icon: "◷",
      iconCls: "text-[#A56A00]",
      label: "Technical response",
      status: "Review",
      statusCls: "bg-[#FBF3E3] text-[#A56A00]",
    },
    {
      icon: "○",
      iconCls: "text-[#2F5BA8]",
      label: "Pricing confirmation",
      status: "Next",
      statusCls: "bg-[#E4EAF7] text-[#2F5BA8]",
    },
  ];

  return (
    <div
      className={`w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-[0_20px_40px_-20px_rgba(27,107,82,0.25)] transition-transform duration-500 ease-out hover:scale-[1.02] ${
        animateIn ? "anim-slide-up d-4" : "opacity-0"
      }`}
      style={{ transform: "rotate(1.5deg)" }}
    >
      <p className="text-base font-bold text-[#0F1714]">
        Software supply · Preparation
      </p>

      <ul className="mt-4 divide-y divide-gray-100">
        {rows.map((r, i) => (
          <li
            key={r.label}
            className={`flex items-center gap-3 py-3 ${
              animateIn ? `anim-slide-up d-${5 + i}` : "opacity-0"
            }`}
          >
            <span
              className={`grid h-5 w-5 place-items-center text-sm font-semibold ${r.iconCls}`}
            >
              {r.icon}
            </span>
            <span className="flex-1 text-sm text-[#0F1714]">{r.label}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${r.statusCls}`}
            >
              {r.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}