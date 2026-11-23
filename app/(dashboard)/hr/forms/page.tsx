// app/hr/forms-policies/page.tsx
"use client";

import HrFormsPoliciesSection from "@/components/HR/HrFormsPoliciesSection";


export default function HrFormsPoliciesPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] px-4 sm:px-6 lg:px-8 py-6">
      <div className="container mx-auto">
        <HrFormsPoliciesSection />
      </div>
    </div>
  );
}