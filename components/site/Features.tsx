export default function Features() {
  const items = [
    {
      title: "Daily tender updates",
      desc: "Keep tender records and their latest status organized in one place.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B6B52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10" />
        </svg>
      ),
    },
    {
      title: "Preparation tracking",
      desc: "See outstanding preparation work and keep the next steps visible.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B6B52" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      ),
    },
    {
      title: "Follow-up management",
      desc: "Track ongoing follow-ups so important conversations stay on your radar.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B6B52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12a7 7 0 1 1-2.3-5.2M19 4v4.5h-4.5" />
        </svg>
      ),
    },
    {
      title: "Timely notifications",
      desc: "Keep deadlines and pending actions in view through reminders.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B6B52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5.2l3.2 2" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="bg-[#F4F7EC] py-20 md:py-28">
      <div className="wrap max-w-7xl mx-auto px-6">
        {/* Header row */}
        <div className="grid md:grid-cols-2 gap-8 items-start mb-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
              One focused solution
            </p>
            <h2 className="mt-4 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-[#0F1714]">
              Less chasing.
              <br />
              More clarity.
            </h2>
          </div>
          <p className="text-base md:text-lg text-[#0F1714]/60 leading-relaxed md:pt-14 md:max-w-md">
            Bring the day-to-day tender workload into a workspace your team can follow.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <article
              key={item.title}
              className="group flex flex-col rounded-2xl border border-[#E6EBDD] bg-white p-6 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#B9D1A8] hover:shadow-[0_20px_40px_-15px_rgba(27,107,82,0.25)]"
            >
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-[#E8F0E0] transition-colors duration-300 group-hover:bg-[#DCE9CC]">
                <div className="transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </div>
              </div>
              <h3 className="text-lg font-bold leading-snug text-[#0F1714]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#0F1714]/60 transition-colors duration-300 group-hover:text-[#0F1714]/80">
                {item.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}