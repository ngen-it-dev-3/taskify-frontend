"use client";

import { useInView } from "@/hooks/site/useInView";


export default function InsideTender() {
  const { ref, inView } = useInView<HTMLDivElement>();

  const stages = [
    { label: "Identified", state: "done" },
    { label: "Reviewed", state: "done" },
    { label: "Preparation", state: "current" },
    { label: "Submitted", state: "todo" },
    { label: "Follow-up", state: "todo" },
  ];

  const documents = [
    {
      ext: "PDF",
      color: "#B3402F",
      name: "Company profile",
      meta: "Updated this week",
      status: "Ready",
      statusCls: "bg-[#DCEFAE] text-[#1B6B52]",
    },
    {
      ext: "DOC",
      color: "#2B6CB0",
      name: "Technical response",
      meta: "Draft 2",
      status: "In review",
      statusCls: "bg-[#FBF3E3] text-[#A56A00]",
    },
    {
      ext: "XLS",
      color: "#1B6B52",
      name: "Pricing sheet",
      meta: "Waiting for supplier prices",
      status: "Next",
      statusCls: "bg-[#E4EAF7] text-[#2F5BA8]",
    },
  ];

  const activity = [
    { title: "Requirements review completed", when: "Today, 10:20" },
    { title: "Supplier pricing requested", when: "Yesterday" },
    { title: "Reminder set for the submission deadline", when: "2 days ago" },
    { title: "Tender added to the register", when: "Last week" },
  ];

  return (
    <section id="inside" className="bg-[#F4F7EC] pt-20 md:pt-28">
      <div className="wrap max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
            Inside a tender
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-[#0F1714]">
            Everything about a bid,
            <br />
            on one page.
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-base text-[#0F1714]/60 leading-relaxed">
            An illustrative tender record: where the bid stands, which documents are
            ready and what happened last.
          </p>
        </div>

        {/* Card */}
        <div
          ref={ref}
          className="rounded-2xl border border-[#E6EBDD] bg-white p-6 md:p-10 shadow-[0_20px_50px_-30px_rgba(27,107,82,0.2)] transition-transform duration-500 hover:-translate-y-1"
        >
          {/* Header row */}
          <div
            className={`flex items-start justify-between gap-4 mb-8 ${
              inView ? "anim-slide-up d-1" : "opacity-0"
            }`}
          >
            <div>
              <p className="text-xs font-mono text-[#1B6B52]">TF / 024</p>
              <h3 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-[#0F1714]">
                Enterprise software supply
              </h3>
            </div>
            <span className="shrink-0 rounded-full bg-[#EEF3E4] px-3 py-1 text-[11px] font-medium text-[#5E6D66]">
              Illustrative concept
            </span>
          </div>

          {/* Stage timeline */}
          <div className="mb-10 px-1">
            <div className="relative flex items-center justify-between">
              {/* Background line */}
              <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-[#E5E7DD]" />
              {/* Animated progress line */}
              <div
                className={`absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-[#1B6B52] ${
                  inView ? "anim-grow-x d-2" : "scale-x-0"
                }`}
                style={{ width: "50%" }}
              />

              {stages.map((s, i) => (
                <StageNode
                  key={s.label}
                  stage={s}
                  index={i}
                  inView={inView}
                />
              ))}
            </div>

            {/* Stage labels */}
            <div className="mt-3 flex items-center justify-between text-[11px] md:text-xs">
              {stages.map((s) => (
                <span
                  key={s.label}
                  className={`${
                    s.state === "done" || s.state === "current"
                      ? "text-[#0F1714] font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* Two-column panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bid documents */}
            <div
              className={`rounded-xl bg-[#F7FAF0] border border-[#E6EBDD] p-5 ${
                inView ? "anim-slide-up d-4" : "opacity-0"
              }`}
            >
              <h4 className="text-base font-bold text-[#0F1714] mb-4">
                Bid documents
              </h4>
              <ul className="space-y-3">
                {documents.map((d, i) => (
                  <li
                    key={d.name}
                    className={`flex items-center gap-3 rounded-lg bg-white px-3 py-3 border border-[#EDF2E3] transition-all duration-500 hover:border-[#B9D1A8] hover:shadow-[0_8px_20px_-12px_rgba(27,107,82,0.25)] ${
                      inView ? `anim-slide-up d-${5 + i}` : "opacity-0"
                    }`}
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#F2F6EA] text-[10px] font-bold"
                      style={{ color: d.color }}
                    >
                      {d.ext}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F1714] truncate">
                        {d.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {d.meta}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${d.statusCls}`}
                    >
                      {d.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Latest activity */}
            <div
              className={`rounded-xl bg-[#F7FAF0] border border-[#E6EBDD] p-5 ${
                inView ? "anim-slide-up d-5" : "opacity-0"
              }`}
            >
              <h4 className="text-base font-bold text-[#0F1714] mb-4">
                Latest activity
              </h4>
              <ul className="relative">
                {/* Vertical line behind dots */}
                <div className="absolute left-[5px] top-3 bottom-3 w-px bg-[#DCE4CC]" />

                {activity.map((a, i) => (
                  <li
                    key={a.title}
                    className={`relative flex gap-4 py-2.5 ${
                      inView ? `anim-slide-up d-${6 + i}` : "opacity-0"
                    }`}
                  >
                    <span className="relative mt-1.5 grid h-2.5 w-2.5 shrink-0 place-items-center">
                      <span className="absolute h-2.5 w-2.5 rounded-full bg-[#1B6B52]" />
                      <span className="anim-pulse-ring absolute h-2.5 w-2.5 rounded-full bg-[#1B6B52]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0F1714] leading-snug">
                        {a.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.when}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==================== STAGE NODE ==================== */
function StageNode({
  stage,
  index,
  inView,
}: {
  stage: { label: string; state: string };
  index: number;
  inView: boolean;
}) {
  const isDone = stage.state === "done";
  const isCurrent = stage.state === "current";

  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        inView ? `anim-pop-in d-${3 + index}` : "opacity-0"
      }`}
    >
      {isDone && (
        <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1B6B52]">
          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
        </span>
      )}
      {isCurrent && (
        <span className="relative grid h-4 w-4 place-items-center rounded-full bg-white border-2 border-[#1B6B52]">
          <span className="absolute h-4 w-4 rounded-full border-2 border-[#1B6B52] anim-pulse-ring" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#1B6B52]" />
        </span>
      )}
      {!isDone && !isCurrent && (
        <span className="h-4 w-4 rounded-full bg-white border-2 border-[#DDE5CC]" />
      )}
    </div>
  );
}