// app/orders/po-builder/page.tsx
"use client";

import { useState } from "react";
import CreatePurchaseOrderTab from "@/components/orders/po-builder/CreatePurchaseOrderTab";
import DraftsTab from "@/components/orders/po-builder/DraftsTab";
import CompanySettingsTab from "@/components/orders/po-builder/CompanySettingsTab";
import {
    INITIAL_COMPANIES,
    type CompanyProfile,
    type DraftPurchaseOrder,
} from "@/types/orders/po-builder/types";
type PoBuilderTab = "create" | "drafts" | "settings";



export default function PurchaseOrderBuilderPage() {
    const [activeTab, setActiveTab] = useState<PoBuilderTab>("create");
    const [companies, setCompanies] = useState<CompanyProfile[]>(INITIAL_COMPANIES);
    const [drafts, setDrafts] = useState<DraftPurchaseOrder[]>([]);

    const handleSaveDraft = (
        draftInput: Omit<DraftPurchaseOrder, "id" | "status">,
        status: "Draft" | "Pending Approval"
    ) => {
        const newEntry: DraftPurchaseOrder = {
            ...draftInput,
            id: `draft-${Date.now()}`,
            status,
        };
        setDrafts((prev) => [newEntry, ...prev]);
    };

    const handleDeleteDraft = (id: string) => {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
    };

    const handleUpdateCompany = (updated: CompanyProfile) => {
        setCompanies((prev) =>
            prev.map((comp) => (comp.id === updated.id ? updated : comp))
        );
    };

    const handleAddCompany = (newCompany: CompanyProfile) => {
        setCompanies((prev) => [...prev, newCompany]);
    };

    const tabs: { id: PoBuilderTab; label: string }[] = [
        { id: "create", label: "Create Purchase Order" },
        { id: "drafts", label: "Drafts" },
        { id: "settings", label: "Company Settings" },
    ];

    return (
        <div className="min-h-screen bg-[#f9f6f0] text-[#171512] px-6 py-6">
            <div className="max-w-[1440px] mx-auto space-y-5">
                {/* Page Title Header */}
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c5e18]">
                        ORDER MANAGEMENT
                    </p>
                    <h1 className="text-[30px] leading-tight font-serif font-semibold text-[#171512] mt-0.5">
                        Purchase Order Builder
                    </h1>
                    <p className="text-[12.5px] text-[#6e685f] mt-1">
                        Draft a formal Purchase Order to send to a principal or vendor.
                    </p>
                </div>

                {/* 3-Tab Underline Navigation */}
                <div className="border-b border-[#e5dfd3] flex items-center gap-6">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-2.5 text-[12px] transition-colors cursor-pointer relative ${isActive
                                    ? "text-[#171512] font-semibold"
                                    : "text-[#6e685f] font-medium hover:text-[#171512]"
                                    }`}
                            >
                                <span>{tab.label}</span>
                                {tab.id === "drafts" && drafts.length > 0 && (
                                    <span className="ml-1.5 px-1.5 py-0.2 text-[10px] rounded-full bg-[#f3ead6] text-[#8c5e18] font-semibold">
                                        {drafts.length}
                                    </span>
                                )}
                                {isActive && (
                                    <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#8c5e18]" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Active Tab Content */}
                {activeTab === "create" && (
                    <CreatePurchaseOrderTab
                        companies={companies}
                        onSaveDraft={handleSaveDraft}
                    />
                )}

                {activeTab === "drafts" && (
                    <DraftsTab drafts={drafts} onDeleteDraft={handleDeleteDraft} />
                )}

                {activeTab === "settings" && (
                    <CompanySettingsTab
                        companies={companies}
                        onUpdateCompany={handleUpdateCompany}
                        onAddCompany={handleAddCompany}
                    />
                )}
            </div>
        </div>
    );
}