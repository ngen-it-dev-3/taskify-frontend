"use client";
import { useInView } from "@/hooks/site/useInView";

export default function MobileSection() {
  const { ref, inView } = useInView<HTMLDivElement>();

  const cards = [
    { tag: "◷ PREPARATION",   title: "Technical response review", meta: "Software supply · Today" },
    { tag: "↻ FOLLOW-UP",     title: "Confirm supplier pricing",  meta: "Equipment package · Today" },
    { tag: "☷ TENDER UPDATE", title: "Review the latest status",  meta: "Network upgrade · Tomorrow" },
  ];

  return (
    <section className="bg-[#F4F7EC] py-20 md:py-28">
      <div ref={ref} className="wrap max-w-7xl mx-auto px-6">
        <div className="rounded-3xl bg-[#E9EFDD] p-8 md:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left copy */}
            <div className={inView ? "anim-slide-up d-1" : "opacity-0"}>
              <span className="inline-flex items-center rounded-full border border-[#C9D8B6] bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
                Responsive interface concept
              </span>
              <h2 className="mt-6 text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-[#0F1714]">
                A smaller screen.
                <br />
                The same clear focus.
              </h2>
              <p className="mt-5 max-w-md text-base text-[#0F1714]/60 leading-relaxed">
                Show clients how daily actions and reminders could look in a mobile
                web view, alongside the desktop experience.
              </p>
              <p className="mt-4 max-w-md text-xs text-[#0F1714]/50 leading-relaxed">
                Illustrative mobile web layout. Native mobile app availability has not
                been confirmed.
              </p>
              <a
                href="/register"
                className="mt-7 inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0F1714] border border-[#DCE5CB] hover:bg-[#F7FAF0] transition"
              >
                Enjoy free ↗
              </a>
            </div>

            {/* Right phone mockup */}
            <div className={`flex justify-center ${inView ? "anim-slide-up d-2" : "opacity-0"}`}>
              <div className="relative w-[280px] rounded-[36px] border-[10px] border-[#123B2C] bg-[#123B2C] shadow-[0_40px_80px_-20px_rgba(15,23,20,0.4)]">
                {/* Notch */}
                <div className="absolute left-1/2 top-0 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#123B2C]" />
                {/* Screen */}
                <div className="rounded-[26px] bg-[#F7FAF0] p-5 pt-8 pb-6">
                  <p className="text-[10px] text-gray-500">
                    Orvix Tender / SAMPLE VIEW
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-[#0F1714]">
                    Your next actions.
                  </h3>
                  <div className="mt-4 space-y-2.5">
                    {cards.map((c, i) => (
                      <div
                        key={c.title}
                        className={`rounded-xl bg-white border border-[#E6EBDD] p-3 ${
                          inView ? `anim-slide-up d-${4 + i}` : "opacity-0"
                        }`}
                      >
                        <p className="text-[9px] font-semibold tracking-wider text-[#1B6B52]">
                          {c.tag}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#0F1714] leading-snug">
                          {c.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-500">{c.meta}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-gray-500">
                    <span>Overview</span>
                    <span>·</span>
                    <span>Tenders</span>
                    <span>·</span>
                    <span>Reminders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}