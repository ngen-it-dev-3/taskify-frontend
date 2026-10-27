// app/(dashboard)/tenders/sites/page.tsx
"use client";

import SiteDirectory from "@/components/tender/site-directory/SiteDirectory";

export default function SiteDirectoryPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900 font-sans">
      <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
        <SiteDirectory />
      </div>
    </main>
  );
}