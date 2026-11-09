"use client";

import { useState } from "react";

type Props = {
  onSuccess: (paymentIntentId: string) => void;
};

export default function StripeDemoForm({ onSuccess }: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  /* -------- formatting helpers -------- */
  const formatCard = (val: string) =>
    val
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const formatExpiry = (val: string) => {
    const v = val.replace(/\D/g, "").slice(0, 4);
    return v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
  };

  const formatCvc = (val: string) => val.replace(/\D/g, "").slice(0, 4);

  /* -------- validation -------- */
  const validate = () => {
    if (cardNumber.replace(/\s/g, "").length !== 16) return "Enter a valid 16-digit card number.";
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Enter the expiry as MM/YY.";
    if (cvc.length < 3) return "Enter a valid CVC.";
    if (!name.trim()) return "Enter the cardholder name.";

    const [mm, yy] = expiry.split("/").map(Number);
    if (mm < 1 || mm > 12) return "Invalid month.";
    const now = new Date();
    const expDate = new Date(2000 + yy, mm);
    if (expDate < now) return "Card has expired.";

    return "";
  };

  /* -------- submit -------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setProcessing(true);

    // Simulate a real Stripe API call
    await new Promise((r) => setTimeout(r, 1600));

    const fakeId = `pi_demo_${Math.random().toString(36).slice(2, 14)}`;
    setProcessing(false);
    onSuccess(fakeId);
  };

  /* -------- test card hint -------- */
  const fillTestCard = () => {
    setCardNumber("4242 4242 4242 4242");
    setExpiry("12/34");
    setCvc("123");
    setName("Test User");
    setError("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#0F1714]/60">
          Card details · Secure
        </p>
        <button
          type="button"
          onClick={fillTestCard}
          className="text-xs font-medium text-[#1B6B52] hover:underline"
        >
          Use test card
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {/* Card number */}
        <div>
          <label className="text-xs font-medium text-[#0F1714]">
            Card number
          </label>
          <div className="mt-1.5 flex items-center rounded-md border border-[#DCE5CB] bg-white focus-within:border-[#1B6B52] focus-within:ring-2 focus-within:ring-[#1B6B52]/15">
            <input
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCard(e.target.value))}
              placeholder="1234 1234 1234 1234"
              inputMode="numeric"
              autoComplete="cc-number"
              className="flex-1 rounded-md text-black bg-transparent px-3 py-2.5 text-sm outline-none"
            />
            <span className="pr-3 text-[#1B6B52]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
          </div>
        </div>

        {/* Expiry + CVC */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[#0F1714]">Expiry</label>
            <input
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM / YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              className="mt-1.5 text-black w-full rounded-md border border-[#DCE5CB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#0F1714]">CVC</label>
            <input
              value={cvc}
              onChange={(e) => setCvc(formatCvc(e.target.value))}
              placeholder="123"
              inputMode="numeric"
              autoComplete="cc-csc"
              className="mt-1.5 text-black w-full rounded-md border border-[#DCE5CB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15"
            />
          </div>
        </div>

        {/* Cardholder name */}
        <div>
          <label className="text-xs font-medium text-[#0F1714]">
            Cardholder name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name on card"
            autoComplete="cc-name"
            className="mt-1.5 text-black w-full rounded-md border border-[#DCE5CB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={processing}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B6B52] py-3 text-sm font-semibold text-white hover:bg-[#155A44] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {processing ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Processing…
          </>
        ) : (
          "Pay securely"
        )}
      </button>

      <p className="mt-3 text-[11px] text-center text-[#0F1714]/50">
        This is a demo. No real card is charged. Use{" "}
        <span className="font-mono text-[#0F1714]/70">
          4242 4242 4242 4242
        </span>{" "}
        · any future date · any CVC.
      </p>
    </form>
  );
}