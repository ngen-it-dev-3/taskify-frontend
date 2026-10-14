const FAQS = [
  { q: "What does Orvix Tender focus on?",       a: "The confirmed scope is daily tendering updates, tender preparation, follow-up management and notifications." },
  { q: "How do the daily email updates work?",   a: "You choose the kinds of tenders you want to follow, and a daily update with matching tenders and reminders is sent by email. Sources covered, delivery times and matching accuracy are to be confirmed by the product owner." },
  { q: "Is this a complete ERP platform?",       a: "No. It is a dedicated tender management solution and the first module of a possible future suite. This page covers tender management only." },
  { q: "How does the free offer work?",          a: "At launch, every company that registers gets 1 week completely free. Share your feedback with us and get 1 week extra. After the free period, the price is 100 Tk per user per month on a 1-year plan, charged monthly." },
  { q: "What if I choose a monthly plan instead of a year?", a: "Monthly-plan pricing is to be announced by the product owner." },
  { q: "Will there be a referral program?",      a: "Yes, we plan to add one after early users have had time to try the product and share feedback. The rules will be published here when it starts." },
  { q: "Can I explore the software here?",       a: "To be confirmed by the product owner." },
  { q: "What are setup and support like?",       a: "To be confirmed by the product owner." },
];

export default function FAQ() {
  return (
    <section id="faq" className="bg-[#F4F7EC] pb-20 md:pb-28">
      <div className="wrap max-w-3xl mx-auto px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
          A few helpful answers
        </p>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-[#0F1714]">
          Before you get started.
        </h2>

        <div className="mt-10 border-t border-[#E0E7D1]">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group border-b border-[#E0E7D1] py-5"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                <span className="flex items-center gap-3 text-base font-semibold text-[#0F1714]">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    className="text-[#1B6B52] transition-transform group-open:rotate-90"
                    fill="currentColor"
                  >
                    <path d="M3 1.5l7 4.5-7 4.5z" />
                  </svg>
                  {f.q}
                </span>
              </summary>
              <p className="mt-3 pl-6 text-sm text-[#0F1714]/60 leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}