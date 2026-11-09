"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StripeDemoForm from "@/components/site/StripeDemoForm";
import { toast } from "react-hot-toast";

type Draft = {
    name: string;
    company: string;
    emails: string[];
    users: number;
    pricePerUser: number;
};

export default function CheckoutPage() {
    const router = useRouter();
    const [draft, setDraft] = useState<Draft | null>(null);
    const [plan, setPlan] = useState<"year" | "month">("year");
    const [payment, setPayment] = useState<"invoice" | "card">("invoice");
    const [agree, setAgree] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [paidId, setPaidId] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem("ovx_draft");
            if (raw) setDraft(JSON.parse(raw));
        } catch { }
    }, []);

    const users = draft?.users ?? 0;
    const pricePerUser = draft?.pricePerUser ?? 100;
    const totalMonthly = users * pricePerUser;
    const totalYear = totalMonthly * 12;

    const canSubmit = users > 0 && agree && payment !== "card";

    /* ---------- BACKEND CALL ---------- */
    const submitCheckout = async (
        paymentMethod: "invoice" | "card",
        paymentIntentId?: string
    ) => {
        if (!draft) {
            setError("Session expired. Please start over.");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/tenant/checkout`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: draft.name,
                        company: draft.company,
                        emails: draft.emails,
                        plan,
                        payment: paymentMethod,
                        paymentIntentId: paymentIntentId || null,
                    }),
                }
            );

            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Checkout failed");

            // ✅ Save with the SAME keys AuthContext reads
            localStorage.setItem("token", json.data.token);
            localStorage.setItem("user", JSON.stringify(json.data.users[0]));
            localStorage.setItem("orvix_tenant", JSON.stringify(json.data.tenant));

            sessionStorage.removeItem("ovx_draft");

            // ✅ Show success toast
            toast.success(`Welcome to ${json.data.tenant.name}!`, {
                duration: 2500,
                style: {
                    background: "#1B6B52",
                    color: "#fff",
                    fontWeight: "600",
                },
            });

            // Small delay so the toast shows before navigation
            setTimeout(() => {
                router.push("/dashboard");
            }, 700);
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
            setPaidId(null);
            toast.error(err.message || "Checkout failed");
        }
    };

    /* ---------- After Stripe Demo succeeds ---------- */
    if (paidId) {
        // Show success, then immediately create the tenant
        return (
            <div className="min-h-screen bg-[#F4F7EC] flex items-center justify-center px-6">
                <div className="max-w-md w-full rounded-2xl border border-[#E6EBDD] bg-white p-8 text-center shadow-[0_20px_50px_-30px_rgba(27,107,82,0.25)]">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#DCEFAE]">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12.5l4.5 4.5L19 7" stroke="#1B6B52" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <h1 className="mt-5 text-2xl font-bold text-[#0F1714]">
                        Creating your workspace…
                    </h1>
                    <p className="mt-3 text-sm text-[#0F1714]/60">
                        Sending welcome emails and setting up your 7-day trial.
                    </p>
                    <div className="mt-6 h-1 w-full rounded-full bg-[#EAEFE0] overflow-hidden">
                        <div className="h-full bg-[#1B6B52] rounded-full animate-[load_1.4s_ease-out_forwards]" style={{ width: "100%" }} />
                    </div>
                    {error && (
                        <p className="mt-4 text-xs text-red-500">{error}</p>
                    )}
                </div>
                <style jsx global>{`
          @keyframes load { from { width: 0%; } to { width: 100%; } }
        `}</style>
            </div>
        );
    }

    /* ---------- Normal checkout ---------- */
    return (
        <div className="min-h-screen bg-[#F4F7EC]">
            <header className="bg-[#F4F7EC] border-b border-[#E6EBDD]">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-[#0F1714]">
                        <span className="grid h-8 w-8 place-items-center rounded-md bg-[#1B6B52] text-white">
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M7 17L17 7M9 7h8v8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                        Orvix Tender
                    </Link>
                    <Link href="/" className="text-sm text-[#0F1714] hover:text-[#1B6B52]">
                        ← Back to the site
                    </Link>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-12">
                <h1 className="text-5xl font-bold tracking-tight text-[#0F1714]">Checkout</h1>
                <p className="mt-3 text-[#0F1714]/60">
                    Start your free period in a few minutes. You pay nothing today.
                </p>

                {error && (
                    <div className="mt-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
                    {/* LEFT */}
                    <div className="space-y-6">
                        <Section title="1. Your company">
                            <Field label="Company name" defaultValue={draft?.company} />
                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field label="Your name" defaultValue={draft?.name} />
                                <Field label="Phone (optional)" />
                            </div>
                        </Section>

                        <Section title="2. Your team">
                            <p className="mt-1 text-xs text-[#0F1714]/60">
                                One email for each person who will use it.
                            </p>
                            <div className="mt-5 space-y-4">
                                {(draft?.emails || [""]).map((em, i) => (
                                    <Field
                                        key={i}
                                        label={i === 0 ? "Administrator email" : `Email ${i + 1}`}
                                        defaultValue={em}
                                    />
                                ))}
                            </div>
                            <div className="mt-5 rounded-lg bg-[#F7FAF0] border border-[#E6EBDD] p-4 text-xs text-[#0F1714]/70">
                                One user means one seat. Each account is for one person only: signing in on a
                                second device signs the first one out.
                            </div>
                        </Section>

                        <Section title="3. Choose your plan">
                            <div className="mt-5 space-y-3">
                                <PlanOption
                                    active={plan === "year"}
                                    onClick={() => setPlan("year")}
                                    title="1-year plan"
                                    desc="Charged monthly for 12 months."
                                    price="100 Tk / user / month"
                                />
                                <PlanOption
                                    active={plan === "month"}
                                    onClick={() => setPlan("month")}
                                    title="Monthly plan"
                                    desc="Price to be announced."
                                    price="TBA"
                                    muted
                                />
                            </div>
                        </Section>

                        <Section title="4. Payment">
                            <div className="mt-5 space-y-3">
                                <PlanOption
                                    active={payment === "invoice"}
                                    onClick={() => setPayment("invoice")}
                                    title="Pay after the free period"
                                    desc="We send an invoice with bank transfer details. Nothing is charged today."
                                />
                                <PlanOption
                                    active={payment === "card"}
                                    onClick={() => setPayment("card")}
                                    title="Pay by card"
                                    desc="Secure card checkout. You are not charged until the free period ends."
                                />
                            </div>

                            {payment === "card" && (
                                <div className="mt-5 rounded-xl border border-[#E6EBDD] bg-[#FBFDF6] p-5">
                                    <StripeDemoForm
                                        onSuccess={(id) => {
                                            setPaidId(id);
                                            submitCheckout("card", id);
                                        }}
                                    />
                                </div>
                            )}
                        </Section>

                        <label className="flex items-start gap-3 text-sm text-[#0F1714]/70 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1B6B52] focus:ring-[#1B6B52]"
                            />
                            <span>
                                Final terms of service and privacy policy will be sent to you by email before
                                any payment is taken.
                            </span>
                        </label>

                        {payment !== "card" && (
                            <button
                                disabled={!canSubmit || submitting}
                                onClick={() => submitCheckout("invoice")}
                                className="w-full rounded-lg bg-[#1B6B52] py-4 text-sm font-semibold text-white hover:bg-[#155A44] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? "Creating your workspace…" : "Place order and start free period"}
                            </button>
                        )}
                    </div>

                    {/* RIGHT — CART */}
                    <aside className="rounded-2xl border border-[#E6EBDD] bg-white p-6 md:p-7 lg:sticky lg:top-6">
                        <h3 className="text-xl font-bold text-[#0F1714]">Your cart</h3>
                        <div className="mt-4 inline-flex items-center rounded-full bg-[#DCEFAE] px-3 py-1 text-xs font-semibold text-[#1B6B52]">
                            1-year plan
                        </div>

                        <div className="mt-5 flex justify-between border-b border-gray-100 pb-3 text-sm">
                            <span className="text-[#0F1714]/70">
                                {users} user{users > 1 ? "s" : ""}
                            </span>
                            <span className="font-medium text-[#0F1714]">
                                {users} × {pricePerUser} Tk
                            </span>
                        </div>

                        <div className="mt-5 rounded-lg bg-[#DCEFAE] p-4 text-sm font-semibold text-[#0F1714]">
                            Free for 1 week. Nothing to pay today.
                        </div>

                        <div className="mt-5 space-y-4 text-sm">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-[#0F1714]/70">After the free period</p>
                                    <p className="text-xs text-[#0F1714]/50 mt-0.5">
                                        per month, {users} user{users > 1 ? "s" : ""}
                                    </p>
                                </div>
                                <span className="font-medium text-[#0F1714]">{totalMonthly} Tk</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-100 pt-4">
                                <div>
                                    <p className="text-[#0F1714]/70">12-month commitment</p>
                                    <p className="text-xs text-[#0F1714]/50 mt-0.5">
                                        Total over the plan, charged monthly
                                    </p>
                                </div>
                                <span className="font-medium text-[#0F1714]">
                                    {totalYear.toLocaleString()} Tk
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-100 pt-4">
                                <span className="font-bold text-[#0F1714]">Due today</span>
                                <span className="font-bold text-[#0F1714]">0 Tk</span>
                            </div>
                        </div>

                        <p className="mt-6 text-xs text-[#0F1714]/50 leading-relaxed">
                            Share feedback through our feedback form and get 1 week extra.
                        </p>
                    </aside>
                </div>
            </div>
        </div>
    );
}

/* ---------- Small helper components ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-[#E6EBDD] bg-white p-6 md:p-7">
            <h2 className="text-xl font-bold text-[#0F1714]">{title}</h2>
            <div className="mt-5">{children}</div>
        </div>
    );
}

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
    return (
        <div>
            <label className="text-xs font-semibold text-[#0F1714]">{label}</label>
            <input
                defaultValue={defaultValue || ""}
                className="mt-2 w-full text-black rounded-md border border-[#DCE5CB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1B6B52] focus:ring-2 focus:ring-[#1B6B52]/15"
            />
        </div>
    );
}

function PlanOption({
    active,
    onClick,
    title,
    desc,
    price,
    muted,
}: {
    active: boolean;
    onClick: () => void;
    title: string;
    desc: string;
    price?: string;
    muted?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-xl border p-4 text-left transition-all ${active
                ? "border-[#1B6B52] bg-[#F7FAF0] ring-1 ring-[#1B6B52]/20"
                : "border-[#E6EBDD] bg-white hover:border-[#B9D1A8]"
                }`}
        >
            <div className="flex items-start gap-3">
                <span
                    className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${active ? "border-[#1B6B52] bg-[#1B6B52]" : "border-gray-300"
                        }`}
                >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <p className={`font-semibold ${muted && !active ? "text-gray-400" : "text-[#0F1714]"}`}>
                            {title}
                        </p>
                        {price && (
                            <span className={`text-xs font-semibold ${muted ? "text-gray-400" : "text-[#1B6B52]"}`}>
                                {price}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-[#0F1714]/60">{desc}</p>
                </div>
            </div>
        </button>
    );
}