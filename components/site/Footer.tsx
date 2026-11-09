import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#123B2C] text-white/80">
      <div className="wrap max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1B6B52]">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 17L17 7M9 7h8v8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-lg">Orvix Tender</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              A dedicated solution for the work behind every bid. The first module of
              a possible future suite.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#DCEFAE]">
              Product
            </h4>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li><a href="#features"   className="hover:text-white">Features</a></li>
              <li><a href="#views"      className="hover:text-white">Product views</a></li>
              <li><a href="#automation" className="hover:text-white">Automation</a></li>
              <li><a href="#inside"     className="hover:text-white">Inside a tender</a></li>
              <li><a href="#how"        className="hover:text-white">How it works</a></li>
            </ul>
          </div>

          {/* Get started */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#DCEFAE]">
              Get started
            </h4>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li><Link href="/register" className="hover:text-white">Enjoy free</Link></li>
              <li><a href="#faq" className="hover:text-white">FAQs</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#DCEFAE]">
              Contact
            </h4>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li><a href="#contact" className="hover:text-white">Send us a message</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50">
          <span>© {new Date().getFullYear()} Orvix Tender. All rights reserved.</span>
          <span>Screens shown on this page are illustrative.</span>
        </div>
      </div>
    </footer>
  );
}