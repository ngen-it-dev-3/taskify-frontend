export default function Automation() {
  const features = [
    {
      title: "Daily tender updates by email",
      desc: "Fresh tenders that fit your business reach your inbox each day, so nobody has to open site after site every morning.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B6B52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      ),
    },
    {
      title: "AI-assisted tender matching",
      desc: "Tell it your categories and keywords. It surfaces the tenders worth your attention and highlights the key requirements.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B6B52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" />
          <path d="M18 15l.8 2.1 2.2.7-2.2.7L18 20.6l-.8-2.1-2.2-.7 2.2-.7z" />
        </svg>
      ),
    },
    {
      title: "Reminders that chase for you",
      desc: "Closing dates, clarifications and follow-ups are sent to you by email before they become urgent.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B6B52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a5 5 0 0 0-5 5v3l-2 3h14l-2-3V8a5 5 0 0 0-5-5zM10 18a2 2 0 0 0 4 0" />
        </svg>
      ),
    },
    {
      title: "A register that fills itself",
      desc: "Updates land in your tender register with a preparation checklist ready, with no copying into spreadsheets.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B6B52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h10M4 18h7" />
          <path d="M16 15l2.2 2.2L22 13" />
        </svg>
      ),
    },
    {
      title: "Guarantee and document watch",
      desc: "Tender security, performance security and company document dates are tracked, so money and paperwork are not forgotten.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B6B52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M8 9V7a4 4 0 0 1 8 0v2" />
        </svg>
      ),
    },
  ];

  return (
    <section id="automation" className="bg-[#F4F7EC] pt-20 md:pt-28">
      <div className="wrap max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="grid md:grid-cols-2 gap-8 items-start mb-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
              Automatic by design
            </p>
            <h2 className="mt-4 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-[#0F1714]">
              Repetitive working
              <br />
              days are over.
            </h2>
          </div>
          <p className="text-base md:text-lg text-[#0F1714]/60 leading-relaxed md:pt-14 md:max-w-md">
            Let Orvix Tender do the daily watching, sorting and reminding. Your team
            can spend that time on better bids.
          </p>
        </div>

        {/* Two columns: features + email mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-10 lg:gap-14 items-start">
          {/* Features list */}
          <ul className="divide-y divide-[#E0E7D1]">
            {features.map((f) => (
              <li key={f.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E8F0E0]">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F1714]">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#0F1714]/60">
                    {f.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Sample email card */}
          <EmailMockup />
        </div>

        {/* Comparison */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old way */}
          <div className="rounded-2xl border border-[#E6EBDD] bg-white p-6 md:p-8">
            <h3 className="text-lg font-bold text-[#0F1714]">The old way</h3>
            <ul className="mt-5 space-y-3.5">
              {[
                "Someone checks tender sites every day and copies details by hand.",
                "Deadlines live in a person's head or a spreadsheet.",
                "Security money is forgotten until someone remembers to ask for it.",
                "Company documents are hunted down again for every bid.",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-sm text-[#0F1714]/70">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center text-[#E85D4A]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 2l8 8M10 2l-8 8" />
                    </svg>
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* With Orvix */}
          <div className="rounded-2xl bg-[#123B2C] p-6 md:p-8 text-white">
            <h3 className="text-lg font-bold">With Orvix Tender</h3>
            <ul className="mt-5 space-y-3.5">
              {[
                "Daily updates arrive by email, already sorted.",
                "Reminders go out before each deadline.",
                "Every security has a return or release date and a reminder.",
                "Experience and company documents are saved once and reused.",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-sm text-white/90">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center">
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.3l2.4 2.3L9.5 3.8" stroke="#DCEFAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Lime CTA banner */}
        <div className="mt-14 rounded-2xl bg-[#DCEFAE] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-lg md:text-xl font-bold text-[#0F1714] leading-snug max-w-2xl">
            You do not need to keep a person just to watch tenders and chase reminders.
            Save that money.
          </p>
          <a
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-[#1B6B52] px-5 py-3 text-sm font-semibold text-white hover:bg-[#155A44] transition-colors shrink-0"
          >
            Enjoy free ↗
          </a>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-xs text-[#0F1714]/50 leading-relaxed max-w-4xl">
          Feature descriptions on this page are prototype copy. Matching accuracy, email
          delivery and cost savings are to be confirmed by the product owner before publishing.
        </p>
      </div>
    </section>
  );
}

/* ==================== EMAIL MOCKUP ==================== */
function EmailMockup() {
  const newForYou = [
    { name: "Water monitoring equipment", meta: "Closes 28 Oct · Sample organisation", badge: "Good match", badgeCls: "bg-[#DCEFAE] text-[#1B6B52]" },
    { name: "Office technology package", meta: "Closes 30 Oct · Sample organisation", badge: "Good match", badgeCls: "bg-[#DCEFAE] text-[#1B6B52]" },
    { name: "Network cabling works", meta: "Closes 2 Nov · Sample organisation", badge: "Possible", badgeCls: "bg-[#E4EAF7] text-[#2F5BA8]" },
  ];
  const needsAction = [
    { name: "Review documents, software supply", meta: "Tender TF / 024", badge: "Tomorrow", badgeCls: "bg-[#FBF3E3] text-[#A56A00]" },
    { name: "Tender security return request", meta: "Campus network upgrade", badge: "In 3 days", badgeCls: "bg-[#FBF3E3] text-[#A56A00]" },
  ];

  return (
    <div className="rounded-2xl bg-white border border-[#E6EBDD] shadow-[0_20px_50px_-25px_rgba(27,107,82,0.25)] overflow-hidden lg:sticky lg:top-24">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#F2F6EA] px-5 py-3 border-b border-[#E6EBDD]">
        <span className="text-xs font-medium text-gray-600">
          Inbox · Your daily tender update
        </span>
        <span className="rounded-full bg-white border border-[#DDE5CC] px-2.5 py-0.5 text-[10px] font-medium text-gray-500">
          Sample email
        </span>
      </div>

      {/* Body */}
      <div className="p-5 md:p-6">
        <h3 className="text-lg font-bold text-[#0F1714] leading-snug">
          Good morning. 3 tenders match you today.
        </h3>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1B6B52]">
          New for you
        </p>
        <ul className="mt-3 space-y-3">
          {newForYou.map((r) => (
            <li key={r.name} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F1714] truncate">{r.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.meta}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${r.badgeCls}`}>
                {r.badge}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1B6B52]">
          Needs action
        </p>
        <ul className="mt-3 space-y-3">
          {needsAction.map((r) => (
            <li key={r.name} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F1714] truncate">{r.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.meta}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${r.badgeCls}`}>
                {r.badge}
              </span>
            </li>
          ))}
        </ul>

        <button className="mt-6 inline-flex items-center rounded-lg bg-[#1B6B52] px-4 py-2 text-xs font-semibold text-white hover:bg-[#155A44] transition-colors">
          Open in TenderFlow
        </button>
      </div>
    </div>
  );
}