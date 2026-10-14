"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOffer } from "./OfferDialogProvider";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#views", label: "Product views" },
  { href: "#automation", label: "Automation" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQs" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const offer = useOffer(); // ✅ hook inside component

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
        ? "bg-white/85 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06),0_4px_20px_-8px_rgba(0,0,0,0.08)]"
        : "bg-white"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${scrolled ? "h-16" : "h-20"
            }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1B6B52] text-white text-lg font-bold">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M7 17L17 7M9 7h8v8"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-xl font-bold tracking-tight text-[#0F1714]">
              Orvix Tender
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[15px] font-medium text-[#0F1714]/80 hover:text-[#0F1714] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            {/* Sign in — desktop only */}
            <Link
              href="/login"
              className="hidden lg:inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-[#0F1714]/80 hover:text-[#0F1714] transition-colors"
            >
              Login
            </Link>

            {/* Enjoy free — main CTA */}
            <button
              onClick={offer.open}
              className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#1B6B52] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#155A44] transition-colors"
            >
              Enjoy free ↗
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden grid h-10 w-10 place-items-center rounded-lg hover:bg-gray-100"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0F1714"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {mobileOpen ? (
                  <>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </>
                ) : (
                  <>
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${mobileOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
            }`}
        >
          <nav className="flex flex-col gap-1 pt-2 border-t border-gray-100">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#0F1714]/80 hover:bg-gray-50 hover:text-[#0F1714]"
              >
                {link.label}
              </a>
            ))}

            {/* Sign in for existing users */}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-lg border border-[#DCE5CB] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F1714] hover:bg-[#F7FAF0] transition-colors"
            >
              Sign in
            </Link>

            {/* Enjoy free for new users */}
            <button
              onClick={() => {
                setMobileOpen(false);
                offer.open();
              }}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#1B6B52] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#155A44] transition-colors"
            >
              Enjoy free ↗
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}