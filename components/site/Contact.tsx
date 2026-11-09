"use client";
import { useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" className="bg-[#F4F7EC] pb-20 md:pb-28">
      <div className="wrap max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left copy */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6B52]">
              Contact
            </p>
            <h2 className="mt-4 text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight text-[#0F1714]">
              Talk to us.
            </h2>
            <p className="mt-5 max-w-sm text-base text-[#0F1714]/60 leading-relaxed">
              Questions about the product, pricing or your team? Send a message and
              we will reply by email.
            </p>
          </div>

          {/* Right form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="rounded-2xl border border-[#E6EBDD] bg-white p-6 md:p-8 shadow-[0_20px_50px_-30px_rgba(27,107,82,0.2)]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-[#0F1714]">
                  Your name
                </label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-md border border-[#DCE5CB] bg-white px-3 py-2.5 text-sm text-[#0F1714] outline-none focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F1714]">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-2 w-full rounded-md border border-[#DCE5CB] bg-white px-3 py-2.5 text-sm text-[#0F1714] outline-none focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold text-[#0F1714]">
                Phone (optional)
              </label>
              <input
                type="tel"
                className="mt-2 w-full rounded-md border border-[#DCE5CB] bg-white px-3 py-2.5 text-sm text-[#0F1714] outline-none focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15"
              />
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold text-[#0F1714]">
                Message
              </label>
              <textarea
                rows={5}
                className="mt-2 w-full rounded-md border border-[#DCE5CB] bg-white px-3 py-2.5 text-sm text-[#0F1714] outline-none focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15 resize-none"
              />
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#1B6B52] px-6 py-3 text-sm font-semibold text-white hover:bg-[#155A44] transition-colors"
            >
              Send message
            </button>

            {sent && (
              <p className="mt-4 text-xs text-[#1B6B52] font-medium">
                ✓ Thank you. We received your message.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}