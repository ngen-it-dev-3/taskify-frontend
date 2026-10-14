import Link from "next/link";
import FloatingCard from "./FloatingCard";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-[#EFF3E6]">
            {/* Background grid */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: `
            linear-gradient(to right, rgba(27,107,82,0.10) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(27,107,82,0.10) 1px, transparent 1px)
          `,
                    backgroundSize: "56px 56px",
                    maskImage:
                        "linear-gradient(to bottom, black 0%, black 55%, transparent 95%)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, black 0%, black 55%, transparent 95%)",
                }}
            />

            {/* Soft radial glow behind headline */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 55% 45% at 50% 35%, rgba(214,231,198,0.55), transparent 70%)",
                }}
            />

            {/* Floating cards */}
            <FloatingCard
                label="TF / 024"
                title="Enterprise software supply"
                meta="Closes 18 Oct"
                className="left-[6%] top-[22%]"
                delay="0s"
                floatSpeed="slow"
            />
            <FloatingCard
                label="Reminder"
                title="Confirm supplier pricing"
                meta="Today"
                className="right-[6%] top-[28%]"
                delay="0.8s"
                floatSpeed="normal"
            />
            <FloatingCard
                label="Daily update"
                title="3 tenders match you"
                meta="Sample"
                className="left-[8%] bottom-[18%]"
                delay="1.6s"
                floatSpeed="fast"
            />
            <FloatingCard
                label="Security"
                title="Return request due"
                meta="In 3 days"
                className="right-[8%] bottom-[20%]"
                delay="0.4s"
                floatSpeed="slow"
            />

            {/* Main hero content */}
            <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
                <span className="inline-flex items-center rounded-full border border-[#D5E2CC] bg-white/70 backdrop-blur-sm px-4 py-1.5 text-[11px] font-semibold tracking-[0.15em] text-[#1B6B52] uppercase">
                    A clearer way to manage tenders
                </span>

                <h1 className="mt-8 text-5xl md:text-9xl font-bold  leading-[1.05] text-[#0F1714]">
                    Every tender.
                    <br />
                    <span className="text-[#1B6B52]">One clear workflow.</span>
                </h1>

                <p className="mx-auto mt-8 max-w-2xl text-lg text-[#0F1714]/70 leading-relaxed">
                    Keep daily updates, bid preparation, follow-ups and deadline reminders
                    together. Give your team a clear view of what needs to happen next.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/register"
                        className="inline-flex items-center justify-center rounded-lg bg-[#1B6B52] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#155A44] transition-colors"
                    >
                        Enjoy free ↗
                    </Link>
                    <a
                        href="#workspace"
                        className="inline-flex items-center justify-center rounded-lg border border-[#D5E2CC] bg-white/70 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-[#0F1714] hover:bg-white transition-colors"
                    >
                        Explore the workspace ↓
                    </a>
                </div>

                <p className="mt-6 text-xs text-[#0F1714]/50">
                    A dedicated solution for the work behind every bid.
                </p>

                <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-[#1B6B52]">
                    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                        <circle cx="10" cy="10" r="9" fill="#1B6B52" />
                        <path
                            d="M6 10.4l2.7 2.6L14 7.9"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    Free for 1 week · then only 100 Tk / user / month on a 1-year plan
                </p>
            </div>
        </section>
    );
}