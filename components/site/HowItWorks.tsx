"use client";

import { useInView } from "@/hooks/site/useInView";

export default function HowItWorks() {
  const { ref, inView } = useInView<HTMLDivElement>();

  const steps = [
    { num: "01 / CAPTURE",  title: "Add the tender",     desc: "Record the opportunity and its key dates." },
    { num: "02 / PREPARE",  title: "Keep work moving",   desc: "Update preparation progress as the bid takes shape." },
    { num: "03 / REMIND",   title: "See what is due",    desc: "Stay aware of deadlines and pending actions." },
    { num: "04 / FOLLOW UP",title: "Track the next step",desc: "Keep follow-up activity connected to the tender." },
  ];

  return (
    <section id="how" className="bg-[#e9efe3] py-20 md:py-28">
      <div ref={ref} className="wrap max-w-6xl mx-auto px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
          How it works
        </p>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-[#0F1714]">
          A simple rhythm for every tender.
        </h2>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className={`border-t border-[#D6DEC4] pt-6 ${
                inView ? `anim-slide-up d-${1 + i}` : "opacity-0"
              }`}
            >
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#1B6B52]">
                {s.num}
              </p>
              <h3 className="mt-3 text-lg font-bold text-[#0F1714]">{s.title}</h3>
              <p className="mt-2 text-sm text-[#0F1714]/60 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}