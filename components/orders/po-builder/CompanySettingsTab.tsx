// components/orders/po-builder/CompanySettingsTab.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { CURRENCY_OPTIONS, type CompanyProfile } from "@/types/orders/po-builder/types";

interface CompanySettingsTabProps {
  companies: CompanyProfile[];
  onUpdateCompany: (updated: CompanyProfile) => void;
  onAddCompany: (newCompany: CompanyProfile) => void;
}

export default function CompanySettingsTab({
  companies,
  onUpdateCompany,
  onAddCompany,
}: CompanySettingsTabProps) {
  const [selectedId, setSelectedId] = useState<string>(companies[0]?.id || "");
  const [formState, setFormState] = useState<CompanyProfile | null>(
    companies[0] || null
  );
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const found = companies.find((c) => c.id === selectedId) || companies[0] || null;
    setFormState(found ? { ...found } : null);
  }, [selectedId, companies]);

  if (!formState) return null;

  const handleFieldChange = <K extends keyof CompanyProfile>(
    key: K,
    value: CompanyProfile[K]
  ) => {
    setFormState((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCurrencyChange = (code: string) => {
    const option = CURRENCY_OPTIONS.find((c) => c.code === code);
    setFormState((prev) =>
      prev
        ? {
            ...prev,
            currency: (option?.code || "BDT") as CompanyProfile["currency"],
            currencySymbol: option?.symbol || "৳",
          }
        : prev
    );
  };

  const handleAddNewEntity = () => {
    const id = `comp-${Date.now()}`;
    const created: CompanyProfile = {
      id,
      name: "NGEN IT — New Entity",
      address: "Dhaka, Bangladesh",
      phoneOrWebsite: "www.ngenit.com",
      regNo: "REG: 00000000",
      currency: "USD",
      currencySymbol: "$",
      letterheadInitial: "N",
      showBankDetails: true,
      beneficiaryName: "NGEN IT Entity",
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      swiftCode: "",
      accountType: "Current / Corporate",
      termsAndConditions:
        "Goods/services must conform strictly to the specification and quantity stated above.",
    };
    onAddCompany(created);
    setSelectedId(id);
    setFormState(created);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState) return;
    onUpdateCompany(formState);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <form
      onSubmit={handleSaveProfile}
      className="bg-[#fffefa] border border-[#e6dfd3] rounded-[6px] p-6 space-y-5 shadow-[0_1px_1px_rgba(24,22,18,0.02)]"
    >
      {/* Top Selector + Add Company */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
          SELECT COMPANY TO EDIT
        </label>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-1.5 text-[12.5px] font-medium bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14] min-w-[240px]"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddNewEntity}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[#d6cfc2] bg-white hover:bg-[#faf7f0] text-[11.5px] font-medium text-[#171512] transition-colors cursor-pointer"
          >
            <Plus size={12} />
            <span>Add Company</span>
          </button>
        </div>

        <p className="text-[11px] text-[#6e685f] mt-2">
          Editing a profile here updates what appears on every Purchase Order issued under that company — letterhead, registration number, bank details, currency, and Terms &amp; Conditions. Use this to keep one profile per entity (Bangladesh, Singapore, Portugal, UK, etc.) and switch between them from the Create Purchase Order tab.
        </p>
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
          COMPANY NAME
        </label>
        <input
          type="text"
          value={formState.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
        />
      </div>

      {/* Registered Address */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
          REGISTERED ADDRESS
        </label>
        <textarea
          rows={2}
          value={formState.address}
          onChange={(e) => handleFieldChange("address", e.target.value)}
          className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
        />
      </div>

      {/* Phone/Website & Trade License/TIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
            PHONE / WEBSITE
          </label>
          <input
            type="text"
            value={formState.phoneOrWebsite}
            onChange={(e) => handleFieldChange("phoneOrWebsite", e.target.value)}
            className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
            TRADE LICENSE / TIN / REG. NO.
          </label>
          <input
            type="text"
            value={formState.regNo}
            onChange={(e) => handleFieldChange("regNo", e.target.value)}
            className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
          />
        </div>
      </div>

      {/* Currency & Letterhead Initial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
            CURRENCY
          </label>
          <select
            value={formState.currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
          >
            {CURRENCY_OPTIONS.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
            LETTERHEAD INITIAL
          </label>
          <input
            type="text"
            maxLength={2}
            value={formState.letterheadInitial}
            onChange={(e) =>
              handleFieldChange("letterheadInitial", e.target.value.toUpperCase())
            }
            className="w-24 px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
          />
        </div>
      </div>

      {/* Bank Details Checkbox */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#575148]">
          BANK DETAILS
        </span>
        <input
          id="show-bank-details"
          type="checkbox"
          checked={formState.showBankDetails}
          onChange={(e) => handleFieldChange("showBankDetails", e.target.checked)}
          className="rounded border-[#d6cfc2] text-[#8a5a14] cursor-pointer"
        />
        <label htmlFor="show-bank-details" className="text-[12px] text-[#3d3933] cursor-pointer">
          Show bank details on Purchase Orders for this company
        </label>
      </div>

      {/* Bank Details Grid */}
      {formState.showBankDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
              BENEFICIARY NAME
            </label>
            <input
              type="text"
              value={formState.beneficiaryName}
              onChange={(e) => handleFieldChange("beneficiaryName", e.target.value)}
              className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
              BANK NAME
            </label>
            <input
              type="text"
              value={formState.bankName}
              onChange={(e) => handleFieldChange("bankName", e.target.value)}
              className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
              ACCOUNT NUMBER
            </label>
            <input
              type="text"
              value={formState.accountNumber}
              onChange={(e) => handleFieldChange("accountNumber", e.target.value)}
              className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
              ROUTING NUMBER
            </label>
            <input
              type="text"
              value={formState.routingNumber}
              onChange={(e) => handleFieldChange("routingNumber", e.target.value)}
              className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
              SWIFT CODE
            </label>
            <input
              type="text"
              value={formState.swiftCode}
              onChange={(e) => handleFieldChange("swiftCode", e.target.value)}
              className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
              ACCOUNT TYPE
            </label>
            <input
              type="text"
              value={formState.accountType}
              onChange={(e) => handleFieldChange("accountType", e.target.value)}
              className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#d6cfc2] rounded text-[#171512] focus:outline-none focus:border-[#8a5a14]"
            />
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#575148] mb-1.5">
          TERMS &amp; CONDITIONS{" "}
          <span className="normal-case font-normal text-[#787167]">(one per line)</span>
        </label>
        <textarea
          rows={5}
          value={formState.termsAndConditions}
          onChange={(e) => handleFieldChange("termsAndConditions", e.target.value)}
          className="w-full px-3 py-2 text-[12px] bg-white border border-[#d6cfc2] rounded text-[#171512] leading-relaxed focus:outline-none focus:border-[#8a5a14]"
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="px-4 py-2 rounded bg-[#8a5a14] hover:bg-[#734a0f] text-white text-[12px] font-semibold transition-colors cursor-pointer"
        >
          Save Company Profile
        </button>

        {savedToast && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1f6b3b]">
            <Check size={14} />
            <span>Company profile updated</span>
          </span>
        )}
      </div>
    </form>
  );
}