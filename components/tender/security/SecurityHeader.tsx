// components/tender/security/SecurityHeader.tsx
"use client";

export function SecurityHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#b8860b]">
          TENDER DASHBOARD
        </p>
        <h1 className="mt-1 text-3xl font-serif font-bold tracking-tight text-slate-900">
          Payment &amp; Security
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-slate-500 leading-relaxed">
          Track what each tender owes you, and every bank security that is held, due to mature or ready to collect back.
        </p>
      </div>
    </header>
  );
}