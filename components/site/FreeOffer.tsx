import Link from "next/link";

export default function FreeOffer() {
  return (
    <section id="free" className="bg-[#F4F7EC] py-20 md:py-20">
      <div className="wrap max-w-6xl mx-auto px-6">
        <div className="rounded-3xl bg-[#123B2C] p-8 md:p-14 text-white overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12">
            {/* Left copy */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#DCEFAE]">
                Start today
              </p>
              <h2 className="mt-4 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                Enjoy <span className="text-[#DCEFAE]">free.</span>
              </h2>
              <p className="mt-5 max-w-md text-white/70 leading-relaxed">
                Try Orvix Tender with your team at no cost. After the free period, pay
                only for the people who use it.
              </p>

              <div className="mt-8 flex items-baseline gap-3">
                <span className="text-sm italic text-white/60">Only</span>
                <span className="text-5xl md:text-6xl font-bold text-[#DCEFAE]">
                  100 Tk
                </span>
                <div className="text-sm text-white/70">
                  <div>/ user / month</div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    1-year plan, charged monthly
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-white/50">
                * After the free period is over. Monthly-plan price: to be announced.
              </p>

              <Link
                href="/register"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#DCEFAE] px-6 py-3 text-sm font-semibold text-[#0F1714] hover:bg-[#C8E093] transition-colors"
              >
                Enjoy free ↗
              </Link>

              <p className="mt-5 max-w-md text-xs text-white/50 leading-relaxed">
                Launch offer: 1 week completely free, plus 1 week extra when you share
                feedback using our feedback form. Referral rewards are planned for later.
              </p>
            </div>

            {/* Right card */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 md:p-7 backdrop-blur-sm">
              <h3 className="text-lg font-bold">Launch offer</h3>
              <div className="mt-5 rounded-xl bg-[#DCEFAE] p-5 text-[#0F1714]">
                <p className="text-base font-bold">1 week completely free</p>
                <p className="mt-1 text-xs opacity-80">
                  For every company that registers at launch.
                </p>
              </div>
              <div className="my-4 text-center text-white/60 text-lg font-light">+</div>
              <div className="rounded-xl bg-[#DCEFAE] p-5 text-[#0F1714]">
                <p className="text-base font-bold">1 week extra</p>
                <p className="mt-1 text-xs opacity-80">
                  When you share your feedback with us using our feedback form.
                </p>
              </div>
              <p className="mt-6 text-center text-xs text-white/50 leading-relaxed">
                Referral rewards are coming later, once we have listened to early users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}