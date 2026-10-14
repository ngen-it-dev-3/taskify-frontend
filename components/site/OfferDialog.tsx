"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OfferDialogProps = {
  open: boolean;
  onClose: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAILS = 25;
const PRICE_PER_USER = 100;

export default function OfferDialog({ open, onClose }: OfferDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [emails, setEmails] = useState<string[]>([""]);
  const [errors, setErrors] = useState<{
    name?: string;
    company?: string;
    emails: Record<number, string>;
  }>({ emails: {} });

  const [submitting, setSubmitting] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1);
      setName("");
      setCompany("");
      setEmails([""]);
      setErrors({ emails: {} });
      setSubmitting(false);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  /* ---------- email handlers ---------- */
  const updateEmail = (idx: number, val: string) => {
    setEmails((prev) => {
      const next = [...prev];
      next[idx] = val;
      // Auto-append a new empty row when the last is a valid email
      if (
        idx === next.length - 1 &&
        EMAIL_RE.test(val.trim()) &&
        next.length < MAX_EMAILS
      ) {
        next.push("");
      }
      return next;
    });
    // Clear the error for that field as user types
    if (errors.emails[idx]) {
      setErrors((e) => {
        const nextEmails = { ...e.emails };
        delete nextEmails[idx];
        return { ...e, emails: nextEmails };
      });
    }
  };

  const removeEmail = (idx: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== idx || prev.length === 1));
    setErrors((e) => {
      const nextEmails = { ...e.emails };
      delete nextEmails[idx];
      return { ...e, emails: nextEmails };
    });
  };

  /* ---------- validation ---------- */
  const validEmails = () =>
    emails.map((v) => v.trim()).filter((v) => EMAIL_RE.test(v));

  const countUsers = () =>
    new Set(validEmails().map((v) => v.toLowerCase())).size;

  const validate = () => {
    const newErrors: typeof errors = { emails: {} };
    let firstBadInput: HTMLInputElement | null = null;

    if (!name.trim()) newErrors.name = "Enter your name.";
    if (!company.trim()) newErrors.company = "Enter your company name.";

    const seen = new Set<string>();
    emails.forEach((raw, i) => {
      const v = raw.trim().toLowerCase();
      if (!v) {
        if (i === 0) newErrors.emails[i] = "Enter at least one work email.";
        return;
      }
      if (!EMAIL_RE.test(v)) {
        newErrors.emails[i] = "Enter an email address like name@company.com.";
        return;
      }
      if (seen.has(v)) {
        newErrors.emails[i] = "This email is already added.";
        return;
      }
      seen.add(v);
    });

    setErrors(newErrors);

    // focus first bad field
    if (newErrors.name) firstBadInput = document.getElementById("offer-name") as HTMLInputElement;
    else if (newErrors.company) firstBadInput = document.getElementById("offer-company") as HTMLInputElement;
    else {
      const firstEmailErr = Object.keys(newErrors.emails)[0];
      if (firstEmailErr !== undefined)
        firstBadInput = document.getElementById(`offer-email-${firstEmailErr}`) as HTMLInputElement;
    }
    firstBadInput?.focus();

    return (
      !newErrors.name &&
      !newErrors.company &&
      Object.keys(newErrors.emails).length === 0
    );
  };

  /* ---------- submit ---------- */
  const handleSubmit = () => {
  if (!validate()) return;
  setSubmitting(true);

  const payload = {
    name: name.trim(),
    company: company.trim(),
    emails: validEmails(),
    users: countUsers(),
    pricePerUser: PRICE_PER_USER,
  };

  try {
    sessionStorage.setItem("ovx_draft", JSON.stringify(payload));
  } catch {}

  // Close the modal first, then navigate on the next tick
  onClose();
  requestAnimationFrame(() => {
    router.push("/checkout");
  });
};

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[fade_200ms_ease-out]"
      style={{ background: "rgba(15, 23, 20, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] p-7 md:p-9 max-h-[90vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-[#F2F5EC] hover:bg-[#E6EBDD] text-[#0F1714] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="flex gap-2 pr-12 mb-6">
          <div className="h-[3px] flex-1 rounded-full bg-[#1B6B52]" />
          <div className={`h-[3px] flex-1 rounded-full ${step === 2 ? "bg-[#1B6B52]" : "bg-[#E6EBDD]"}`} />
        </div>

        {step === 1 ? (
          <>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0F1714]">
              Enjoy Orvix Tender free.
            </h2>
            <p className="mt-3 text-[#0F1714]/60">
              Start without paying. Here is how it works.
            </p>

            <ul className="mt-6 space-y-4">
              {[
                <>
                  <strong>Free for 1 week</strong> at launch, for your team.
                </>,
                <>
                  <strong>Share your feedback</strong> and get 1 week extra.
                </>,
                <>
                  <strong>After the free period, only 100 Tk</strong> / user / month on a
                  1-year plan, charged monthly.
                </>,
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#0F1714]/80 leading-relaxed">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1B6B52]">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.3l2.4 2.3L9.5 3.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs text-[#0F1714]/50">
              Monthly-plan price: to be announced.
            </p>

            <button
              onClick={() => setStep(2)}
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#1B6B52] px-6 py-3 text-sm font-semibold text-white hover:bg-[#155A44] transition-colors"
            >
              Continue to registration
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0F1714]">
              Create your account.
            </h2>
            <p className="mt-3 text-[#0F1714]/60">
              A few details to get started.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-[#0F1714]">
                  Your name
                </label>
                <input
                  id="offer-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
                  }}
                  className={`mt-2 w-full text-black rounded-md border bg-white px-3 py-2.5 text-sm outline-none transition-all ${
                    errors.name
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-[#DCE5CB] focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F1714]">
                  Company
                </label>
                <input
                  id="offer-company"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (errors.company) setErrors((x) => ({ ...x, company: undefined }));
                  }}
                  className={`mt-2 w-full text-black rounded-md border bg-white px-3 py-2.5 text-sm outline-none transition-all ${
                    errors.company
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-[#DCE5CB] focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15"
                  }`}
                />
                {errors.company && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.company}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-[#0F1714]">Email IDs</p>
              <p className="mt-1 text-xs text-[#0F1714]/60 leading-relaxed">
                Add one for each person who will use it. A new box appears after each
                valid email.
              </p>

              <div className="mt-4 space-y-4">
                {emails.map((val, i) => {
                  const err = errors.emails[i];
                  const isOnly = emails.length === 1;
                  return (
                    <div key={i}>
                      <label className="text-xs font-semibold text-[#0F1714]">
                        Email {i + 1}
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          id={`offer-email-${i}`}
                          type="email"
                          value={val}
                          onChange={(e) => updateEmail(i, e.target.value)}
                          className={`flex-1 text-black rounded-md border bg-white px-3 py-2.5 text-sm outline-none transition-all ${
                            err
                              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                              : "border-[#DCE5CB] focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15"
                          }`}
                        />
                        {!isOnly && (
                          <button
                            type="button"
                            onClick={() => removeEmail(i)}
                            aria-label="Remove email"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#E6EBDD] bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M3 3l10 10M13 3L3 13" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {err && (
                        <p className="mt-1.5 text-xs text-red-500">{err}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Seat count */}
              {countUsers() > 0 && (
                <p className="mt-4 text-xs text-[#1B6B52] font-medium">
                  {countUsers()} user{countUsers() > 1 ? "s" : ""}. After the free period,
                  about {countUsers() * PRICE_PER_USER} Tk per month, on a 1-year plan,
                  charged monthly.
                </p>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-[#1B6B52] px-6 py-3 text-sm font-semibold text-white hover:bg-[#155A44] disabled:opacity-60 transition-colors"
              >
                {submitting ? "Opening checkout…" : "Continue to checkout"}
              </button>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center justify-center rounded-lg border border-[#DCE5CB] bg-white px-6 py-3 text-sm font-semibold text-[#0F1714] hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            </div>

            <p className="mt-5 text-xs text-[#0F1714]/50 leading-relaxed">
              Next: choose your plan and check out. Nothing is created until you place
              the order.
            </p>
          </>
        )}
      </div>

      {/* fade-in keyframe (inline) */}
      <style jsx global>{`
        @keyframes fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}