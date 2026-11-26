// components/orders/po-builder/CreatePurchaseOrderTab.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import type { CompanyProfile, DraftPurchaseOrder, PoLineItem } from "./types";

interface CreatePurchaseOrderTabProps {
    companies: CompanyProfile[];
    onSaveDraft: (
        draft: Omit<DraftPurchaseOrder, "id" | "status">,
        status: "Draft" | "Pending Approval"
    ) => void;
}

export default function CreatePurchaseOrderTab({
    companies,
    onSaveDraft,
}: CreatePurchaseOrderTabProps) {
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
        companies[0]?.id || ""
    );
    const [poRef, setPoRef] = useState("");
    const [poDate] = useState("26 Nov 2026");

    const [vendor, setVendor] = useState("");
    const [vendorAddress, setVendorAddress] = useState("");
    const [client, setClient] = useState("");
    const [clientAddress, setClientAddress] = useState("");

    const [items, setItems] = useState<PoLineItem[]>([
        { id: "item-1", description: "", qty: 1, unitPrice: 0 },
    ]);

    const [vatEnabled, setVatEnabled] = useState(true);
    const [vatRate, setVatRate] = useState<string>("15");

    const [recipientContact, setRecipientContact] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [deliveryInstructions, setDeliveryInstructions] = useState("");

    const [paymentTerms, setPaymentTerms] = useState("Advance");
    const [shippingMode, setShippingMode] = useState("Air");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("Pending");
    const [notes, setNotes] = useState("");

    const [isEditingTerms, setIsEditingTerms] = useState(false);
    const [customTerms, setCustomTerms] = useState("");

    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");

    const activeCompany = useMemo(
        () => companies.find((c) => c.id === selectedCompanyId) || companies[0],
        [companies, selectedCompanyId]
    );

    useEffect(() => {
        if (activeCompany) {
            setCustomTerms(activeCompany.termsAndConditions);
            setIsEditingTerms(false);
        }
    }, [activeCompany]);

    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            { id: `item-${Date.now()}-${prev.length}`, description: "", qty: 1, unitPrice: 0 },
        ]);
    };

    const handleRemoveItem = (id: string) => {
        setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
    };

    const handleItemChange = (
        id: string,
        field: "product" | "qty" | "unitPrice",
        rawValue: string
    ) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                if (field === "product") {
                    return { ...item, description: rawValue };
                }
                const cleaned = rawValue.replace(/,/g, "");
                const num = Number(cleaned);
                return {
                    ...item,
                    [field]: rawValue.trim() === "" || Number.isNaN(num) ? 0 : Math.max(0, num),
                };
            })
        );
    };

    const numericVatPct = useMemo(() => {
        const parsed = Number(vatRate);
        return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    }, [vatRate]);

    const subTotal = useMemo(
        () => items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0),
        [items]
    );

    const vatAmount = useMemo(
        () => (vatEnabled ? (subTotal * numericVatPct) / 100 : 0),
        [subTotal, vatEnabled, numericVatPct]
    );

    const grandTotal = subTotal + vatAmount;
    const currencySymbol = activeCompany?.currencySymbol || "৳";

    const formatMoney = (amount: number) => {
        return `${currencySymbol}${amount.toLocaleString("en-US", {
            minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const buildDraftPayload = () => ({
        poRef: poRef.trim() || `NG-PO/${Math.floor(100000 + Math.random() * 900000)}`,
        date: poDate,
        companyId: activeCompany?.id || "",
        companyName: activeCompany?.name || "NGEN IT LIMITED",
        vendor: vendor.trim() || "Unspecified Principal",
        vendorAddress: vendorAddress.trim(),
        client: client.trim() || "Unspecified Client",
        clientAddress: clientAddress.trim(),
        items,
        vatEnabled,
        vatRate: numericVatPct,
        recipientContact: recipientContact.trim(),
        contactPhone: contactPhone.trim(),
        deliveryInstructions: deliveryInstructions.trim(),
        paymentTerms,
        shippingMode,
        deliveryDate: deliveryDate.trim(),
        paymentStatus,
        notes: notes.trim(),
        grandTotal,
        currencySymbol,
    });

    const handleActionSave = (status: "Draft" | "Pending Approval") => {
        onSaveDraft(buildDraftPayload(), status);
        setFeedbackMessage(
            status === "Draft"
                ? "Saved as draft in Drafts tab."
                : "Sent for approval and saved to Drafts."
        );
        setTimeout(() => setFeedbackMessage(""), 3000);
    };

    const handleShareWhatsApp = () => {
        const companyName = activeCompany?.name || "NGEN IT LIMITED";
        const refText = poRef.trim() || "Draft PO";
        const msg = encodeURIComponent(
            `Purchase Order (${refText}) from ${companyName}\nVendor: ${vendor || "N/A"
            }\nClient: ${client || "N/A"}\nGrand Total: ${formatMoney(grandTotal)}`
        );
        window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
    };

    const termsLines = customTerms.split("\n").filter(Boolean);

    return (
        <div className="po-modern-shell">
            {/* Top Issuing Company Selector */}
            <div className="po-company-bar">
                <label htmlFor="poIssuingCompanySelect" className="po-company-label">
                    ISSUING COMPANY
                </label>
                <select
                    id="poIssuingCompanySelect"
                    className="po-modern-input po-company-select"
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                    {companies.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                            {comp.name}
                        </option>
                    ))}
                </select>
                <span className="po-company-hint">
                    Switches the letterhead, currency, bank details &amp; terms below
                </span>
            </div>

            {feedbackMessage && (
                <div className="po-feedback-banner">
                    <CheckCircle2 size={14} />
                    <span>{feedbackMessage}</span>
                </div>
            )}

            {/* MODERN PO DOCUMENT CARD */}
            <div className="po-document">
                {/* MODERN NAVY LETTERHEAD */}
                <div className="po-letterhead">
                    <div className="po-letterhead-brand">
                        <div className="po-logo-mark" id="poLetterheadLogo">
                            {activeCompany?.letterheadInitial || "N"}
                        </div>
                        <div>
                            <div className="po-company-name" id="poLetterheadName">
                                {activeCompany?.name || "NGEN IT LIMITED"}
                            </div>
                            <div className="po-company-sub" id="poLetterheadSub">
                                {activeCompany?.phoneOrWebsite || "www.ngenit.com"} ·{" "}
                                {activeCompany?.regNo || "TIN: 176439821042"}
                            </div>
                        </div>
                    </div>

                    <div className="po-letterhead-meta">
                        <div className="po-doc-title">PURCHASE ORDER</div>
                        <input
                            type="text"
                            id="poRefHeaderInput"
                            className="po-doc-ref-input createpo-field"
                            data-field="poRef"
                            value={poRef}
                            onChange={(e) => setPoRef(e.target.value)}
                            placeholder="PO Ref — e.g. NG-XYZ/260901"
                        />
                        <div className="po-doc-date">
                            Date: <span id="poDateDisplay">{poDate}</span>
                        </div>
                    </div>
                </div>

                {/* BODY */}
                <div className="po-body">
                    <div className="po-two-col">
                        <div className="po-col-stack">
                            <div>
                                <div className="po-section-title">VENDOR / PRINCIPAL</div>
                                <input
                                    type="text"
                                    className="po-modern-input createpo-field"
                                    data-field="principal"
                                    value={vendor}
                                    onChange={(e) => setVendor(e.target.value)}
                                    placeholder="e.g. Acronis"
                                />
                            </div>

                            <div>
                                <div className="po-section-title">VENDOR ADDRESS</div>
                                <textarea
                                    className="po-modern-input createpo-field po-addr-textarea"
                                    data-field="principalAddress"
                                    value={vendorAddress}
                                    onChange={(e) => setVendorAddress(e.target.value)}
                                    placeholder="Full business address, incl. city &amp; country"
                                />
                            </div>
                        </div>

                        <div className="po-col-stack">
                            <div>
                                <div className="po-section-title">CLIENT / END USER (SHIP TO)</div>
                                <input
                                    type="text"
                                    className="po-modern-input createpo-field"
                                    data-field="client"
                                    value={client}
                                    onChange={(e) => setClient(e.target.value)}
                                    placeholder="e.g. Padma Bank Ltd."
                                />
                            </div>

                            <div>
                                <div className="po-section-title">CLIENT / DELIVERY ADDRESS</div>
                                <textarea
                                    className="po-modern-input createpo-field po-addr-textarea"
                                    data-field="clientAddress"
                                    value={clientAddress}
                                    onChange={(e) => setClientAddress(e.target.value)}
                                    placeholder="Full delivery address, incl. city &amp; country"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ITEM DETAILS */}
                    <div className="po-items-section">
                        <div className="po-section-title">ITEM DETAILS</div>

                        <div className="po-item-row-head">
                            <span></span>
                            <span>DESCRIPTION</span>
                            <span>QTY</span>
                            <span id="poUnitPriceHeader">UNIT PRICE ({currencySymbol})</span>
                            <span></span>
                        </div>

                        <div id="poItemsList">
                            {items.map((item) => (
                                <div key={item.id} className="po-item-row">
                                    <button
                                        type="button"
                                        className="po-item-add-inline"
                                        title="Add another item"
                                        onClick={handleAddItem}
                                    >
                                        +
                                    </button>
                                    <input
                                        type="text"
                                        className="po-modern-input po-item-field"
                                        data-item-field="product"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(item.id, "product", e.target.value)}
                                        placeholder="e.g. Backup Spares — DCS Module"
                                    />
                                    <input
                                        type="text"
                                        className="po-modern-input po-item-field"
                                        data-item-field="qty"
                                        value={item.qty}
                                        onChange={(e) => handleItemChange(item.id, "qty", e.target.value)}
                                        placeholder="e.g. 2"
                                    />
                                    <input
                                        type="text"
                                        className="po-modern-input po-item-field"
                                        data-item-field="unitPrice"
                                        value={item.unitPrice ? item.unitPrice.toLocaleString("en-US") : ""}
                                        onChange={(e) =>
                                            handleItemChange(item.id, "unitPrice", e.target.value)
                                        }
                                        placeholder="e.g. 92,500"
                                    />
                                    <button
                                        type="button"
                                        className="po-item-remove"
                                        title="Remove item"
                                        onClick={() => handleRemoveItem(item.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* VAT & TOTALS BLOCK */}
                        <div className="po-totals-block">
                            <div className="po-vat-row">
                                <label className="po-vat-check">
                                    <input
                                        type="checkbox"
                                        id="poVatToggle"
                                        className="createpo-field"
                                        data-field="vatOn"
                                        checked={vatEnabled}
                                        onChange={(e) => setVatEnabled(e.target.checked)}
                                    />
                                    <span>VAT / GST</span>
                                </label>
                                <input
                                    type="text"
                                    className="po-modern-input createpo-field po-vat-input"
                                    id="poVatPct"
                                    data-field="vatPct"
                                    value={vatRate}
                                    onChange={(e) => setVatRate(e.target.value)}
                                    disabled={!vatEnabled}
                                />
                                <span className="po-vat-pct-sign">%</span>
                            </div>

                            <table className="lines">
                                <tbody>
                                    <tr>
                                        <td className="po-total-label">Sub Total</td>
                                        <td className="mono" id="poSubTotal" style={{ textAlign: "right" }}>
                                            {formatMoney(subTotal)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="po-total-label">
                                            VAT / GST{" "}
                                            <span className="po-gst-note" id="poGstNote">
                                                (added)
                                            </span>
                                        </td>
                                        <td className="mono" id="poGstAmount" style={{ textAlign: "right" }}>
                                            {formatMoney(vatAmount)}
                                        </td>
                                    </tr>
                                    <tr className="po-grand-row">
                                        <td>Grand Total</td>
                                        <td className="mono" id="poGrandTotal" style={{ textAlign: "right" }}>
                                            {formatMoney(grandTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SHIPPING CONTACT & INSTRUCTIONS */}
                    <div className="po-shipping-section">
                        <div className="po-section-title">SHIPPING CONTACT &amp; INSTRUCTIONS</div>

                        <div className="po-ship-grid">
                            <div>
                                <div className="po-sub-label">RECIPIENT / CONTACT PERSON</div>
                                <input
                                    type="text"
                                    className="po-modern-input createpo-field"
                                    data-field="shipContact"
                                    value={recipientContact}
                                    onChange={(e) => setRecipientContact(e.target.value)}
                                    placeholder="e.g. Md. Rafiqul Islam, Procurement"
                                />
                            </div>

                            <div>
                                <div className="po-sub-label">CONTACT PHONE</div>
                                <input
                                    type="text"
                                    className="po-modern-input createpo-field"
                                    data-field="shipPhone"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    placeholder="e.g. 01711-XXXXXX"
                                />
                            </div>

                            <div className="po-field-full">
                                <div className="po-sub-label">
                                    DELIVERY INSTRUCTIONS{" "}
                                    <span className="po-optional-tag">(optional)</span>
                                </div>
                                <textarea
                                    className="po-modern-input createpo-field"
                                    data-field="shipNotes"
                                    value={deliveryInstructions}
                                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                                    placeholder="e.g. Delivery hours, security gate pass needed, site contact on arrival, etc."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5-COLUMN META GRID */}
                    <div className="po-oneline-grid">
                        <div>
                            <div className="po-sub-label">PAYMENT TERMS</div>
                            <select
                                className="po-modern-input createpo-field"
                                data-field="paymentTerms"
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(e.target.value)}
                            >
                                <option>Advance</option>
                                <option>Net 30</option>
                                <option>Net 60</option>
                                <option>Letter of Credit</option>
                            </select>
                        </div>

                        <div>
                            <div className="po-sub-label">SHIPPING MODE</div>
                            <select
                                className="po-modern-input createpo-field"
                                data-field="mode"
                                value={shippingMode}
                                onChange={(e) => setShippingMode(e.target.value)}
                            >
                                <option>Air</option>
                                <option>Sea</option>
                                <option>Land</option>
                                <option>Digital / N/A</option>
                            </select>
                        </div>

                        <div>
                            <div className="po-sub-label">DELIVERY DATE</div>
                            <input
                                type="text"
                                className="po-modern-input createpo-field"
                                data-field="deliveryDate"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                                placeholder="DD Mon YYYY"
                            />
                        </div>

                        <div>
                            <div className="po-sub-label">PAYMENT STATUS</div>
                            <select
                                className="po-modern-input createpo-field"
                                data-field="paymentStatus"
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
                            >
                                <option>Pending</option>
                                <option>Advance Paid</option>
                                <option>Paid in Full</option>
                            </select>
                        </div>

                        <div>
                            <div className="po-sub-label">NOTES</div>
                            <input
                                type="text"
                                className="po-modern-input createpo-field"
                                data-field="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Internal note"
                            />
                        </div>
                    </div>
                </div>

                {/* TERMS & CONDITIONS */}
                <div className="po-terms">
                    <div className="po-terms-header">
                        <span className="po-section-title" style={{ marginBottom: 0 }}>
                            TERMS &amp; CONDITIONS
                        </span>
                        <button
                            type="button"
                            className="btn btn-ghost po-edit-terms-btn"
                            id="poEditTermsBtn"
                            onClick={() => setIsEditingTerms((prev) => !prev)}
                        >
                            {isEditingTerms ? "Done" : "Edit Terms"}
                        </button>
                    </div>

                    {isEditingTerms ? (
                        <textarea
                            className="po-modern-input"
                            rows={4}
                            value={customTerms}
                            onChange={(e) => setCustomTerms(e.target.value)}
                            style={{ marginTop: "8px" }}
                        />
                    ) : (
                        <ol className="po-terms-list" id="poTermsList">
                            {termsLines.map((line, idx) => (
                                <li key={idx}>{line}</li>
                            ))}
                        </ol>
                    )}
                </div>

                {/* BANK DETAILS */}
                {activeCompany?.showBankDetails && (
                    <div className="po-bank" id="poBankSection">
                        <div className="po-section-title">BANK DETAILS FOR PAYMENT</div>
                        <div className="po-bank-grid" id="poBankGrid">
                            <div>
                                <span className="po-bank-label">BENEFICIARY NAME</span>
                                {activeCompany.beneficiaryName}
                            </div>
                            <div>
                                <span className="po-bank-label">BANK NAME</span>
                                {activeCompany.bankName}
                            </div>
                            <div>
                                <span className="po-bank-label">ACCOUNT NUMBER</span>
                                {activeCompany.accountNumber}
                            </div>
                            <div>
                                <span className="po-bank-label">ROUTING NUMBER</span>
                                {activeCompany.routingNumber}
                            </div>
                            <div>
                                <span className="po-bank-label">SWIFT CODE</span>
                                {activeCompany.swiftCode}
                            </div>
                            <div>
                                <span className="po-bank-label">ACCOUNT TYPE</span>
                                {activeCompany.accountType}
                            </div>
                        </div>
                    </div>
                )}

                {/* FOOTER */}
                <div className="po-footer">
                    <div className="po-signature-block">
                        <div className="po-signature-line"></div>
                        <div className="po-signature-label" id="poFooterSignatureLabel">
                            Authorized Signature — {activeCompany?.name || "NGEN IT LIMITED"}
                        </div>
                    </div>
                    <div className="po-footer-info" id="poFooterInfo">
                        {activeCompany?.name || "NGEN IT LIMITED"} ·{" "}
                        {activeCompany?.phoneOrWebsite || "www.ngenit.com"}
                        <br />
                        This is a system-generated Purchase Order and does not require a physical
                        stamp to be valid internally.
                    </div>
                </div>

                {/* ACTIONS ROW */}
                <div className="po-actions-row">
                    <button
                        type="button"
                        className="btn btn-brass"
                        id="createPoBtn"
                        onClick={() => handleActionSave("Pending Approval")}
                    >
                        Create Purchase Order
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        id="previewPoBtn"
                        onClick={() => setShowPreviewModal(true)}
                    >
                        👁 Preview
                    </button>
                    <button
                        type="button"
                        className="btn btn-navy"
                        id="sharePoWhatsappBtn"
                        onClick={handleShareWhatsApp}
                    >
                        📱 Share via WhatsApp
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        id="savePoDraftBtn"
                        onClick={() => handleActionSave("Draft")}
                    >
                        💾 Save as Draft
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        id="sendPoApprovalBtn"
                        onClick={() => handleActionSave("Pending Approval")}
                    >
                        ✉ Send for Approval
                    </button>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            {showPreviewModal && (
                <div className="po-modal-backdrop" onClick={() => setShowPreviewModal(false)}>
                    <div className="po-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="po-modal-head">
                            <div>
                                <div className="po-section-title">PURCHASE ORDER PREVIEW</div>
                                <h3 className="po-modal-title">
                                    {activeCompany?.name || "NGEN IT LIMITED"} — {poRef || "Draft PO"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setShowPreviewModal(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="po-two-col" style={{ marginTop: "14px" }}>
                            <div>
                                <div className="po-section-title">VENDOR / PRINCIPAL</div>
                                <p className="po-modal-val">{vendor || "—"}</p>
                            </div>
                            <div>
                                <div className="po-section-title">CLIENT / END USER</div>
                                <p className="po-modal-val">{client || "—"}</p>
                            </div>
                        </div>

                        <div className="po-preview-items">
                            {items.map((it, idx) => (
                                <div key={it.id} className="po-preview-item-row">
                                    <span>
                                        {idx + 1}. {it.description || "Item"} × {it.qty}
                                    </span>
                                    <span className="mono">{formatMoney(it.qty * it.unitPrice)}</span>
                                </div>
                            ))}
                            <div className="po-preview-total-row">
                                <span>Grand Total</span>
                                <span className="mono">{formatMoney(grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .po-modern-shell {
          max-width: 920px;
          margin: 0 auto;
          width: 100%;
        }

        .po-company-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .po-company-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #2f2a24;
        }

        .po-company-select {
          max-width: 265px;
          font-weight: 500;
        }

        .po-company-hint {
          font-size: 11px;
          color: #6b645b;
        }

        .po-feedback-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          margin-bottom: 12px;
          border-radius: 6px;
          background: #eaf6ee;
          border: 1px solid #b9dfc6;
          color: #1d6336;
          font-size: 12px;
          font-weight: 500;
        }

        .po-document {
          background: #ffff;
          border: 1px solid #e6e0d5;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(17, 34, 59, 0.04);
        }

        .po-letterhead {
            background: linear-gradient(135deg, var(--navy-900, #11223b), var(--navy-700, #1e3a5f));
            color: #fff;
            padding: 20px 24px;
            border-radius: 10px 10px 0 0;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .po-letterhead-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .po-logo-mark {
          width: 38px;
          height: 38px;
          border-radius: 7px;
          background: #8c621e;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .po-company-name {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #ffffff;
          line-height: 1.2;
        }

        .po-company-sub {
          font-size: 11px;
          color: #cbd5e1;
          margin-top: 3px;
        }

        .po-letterhead-meta {
          text-align: right;
        }

        .po-doc-title {
            font-family: 'Fraunces', serif;
            font-size: 20px;
            font-weight: 600;
            color: #f3e9d6;
            letter-spacing: 0.5px;
        }

        .po-doc-ref-input {
          margin-top: 5px;
          background: transparent;
          border: none;
          border-bottom: 1px dashed rgba(203, 213, 225, 0.55);
          color: #e2e8f0;
          font-size: 11px;
          text-align: right;
          width: 190px;
          padding: 2px 4px;
          outline: none;
        }

        .po-doc-ref-input::placeholder {
          color: #94a3b8;
        }

        .po-doc-ref-input:focus {
          border-bottom-color: #d99b38;
        }

        .po-doc-date {
          font-size: 11px;
          color: #cbd5e1;
          margin-top: 4px;
        }

        .po-body {
          padding: 22px 24px 0;
        }

        .po-two-col {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .po-col-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .po-section-title {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #2f2a24;
          margin-bottom: 6px;
        }

        .po-sub-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #4b453d;
          margin-bottom: 6px;
        }

        .po-modern-input {
          width: 100%;
          padding: 8px 11px;
          font-size: 12px;
          line-height: 1.4;
          color: #1c1917;
          background: #ffffff;
          border: 1px solid #dcd6ca;
          border-radius: 6px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .po-modern-input:focus {
          border-color: #8c621e;
          box-shadow: 0 0 0 2px rgba(140, 98, 30, 0.1);
        }

        .po-modern-input::placeholder {
          color: #a8a29e;
        }

        .po-addr-textarea {
          min-height: 62px;
          resize: vertical;
        }

        .po-items-section {
          margin-top: 22px;
        }

        .po-item-row-head {
          display: grid;
          grid-template-columns: 32px minmax(180px, 1fr) 88px 155px 30px;
          gap: 8px;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1.5px solid #8c621e;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6b645b;
        }

        .po-item-row {
          display: grid;
          grid-template-columns: 32px minmax(180px, 1fr) 88px 155px 30px;
          gap: 8px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e7e1d6;
        }

        .po-item-add-inline {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid #d6cfc2;
          background: #ffffff;
          color: #2f2a24;
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .po-item-add-inline:hover {
          background: #f2ede3;
        }

        .po-item-remove {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          border: 1px solid #dcd6ca;
          background: #ffffff;
          color: #6b645b;
          font-size: 13px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .po-item-remove:hover {
          background: #fef2f2;
          color: #b91c1c;
        }

        .po-totals-block {
          width: 295px;
          margin-top: 14px;
          margin-left: auto;
          margin-right: 0;
        }

        .po-vat-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
          margin-bottom: 10px;
        }

        .po-vat-check {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #2f2a24;
          cursor: pointer;
        }

        .po-vat-check input[type="checkbox"] {
          accent-color: #8c621e;
          width: 14px;
          height: 14px;
          cursor: pointer;
        }

        .po-vat-input {
          width: 50px !important;
          padding: 4px 6px !important;
          font-size: 11.5px !important;
          text-align: center;
        }

        .po-vat-pct-sign {
          font-size: 11.5px;
          color: #6b645b;
        }

        .po-totals-block .lines {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .po-totals-block .lines td {
          padding: 7px 0;
          color: #4b453d;
          border-bottom: 1px solid #e7e1d6;
        }

        .po-gst-note {
          font-size: 10.5px;
          color: #787167;
          margin-left: 3px;
        }

        .po-grand-row td {
          border-bottom: none !important;
          padding-top: 10px !important;
          font-size: 13.5px;
          font-weight: 700;
          color: #8c621e !important;
        }

        .mono {
          font-variant-numeric: tabular-nums;
        }

        .po-shipping-section {
          margin-top: 22px;
        }

        .po-ship-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 18px;
        }

        .po-optional-tag {
          font-weight: 400;
          text-transform: none;
          color: #787167;
        }

        .po-field-full {
          grid-column: 1 / -1;
        }

        .po-field-full textarea {
          min-height: 62px;
          resize: vertical;
        }

        .po-oneline-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .po-terms {
          margin: 22px 24px 0;
          padding-top: 16px;
          border-top: 1px solid #e7e1d6;
        }

        .po-terms-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .po-edit-terms-btn {
          padding: 4px 11px !important;
          font-size: 10.5px !important;
        }

        .po-terms-list {
          margin: 8px 0 0;
          padding-left: 18px;
          font-size: 11px;
          line-height: 1.6;
          color: #4b453d;
        }

        .po-bank {
          margin: 18px 24px 0;
          padding-top: 16px;
          border-top: 1px solid #e7e1d6;
        }

        .po-bank-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px 18px;
          margin-top: 8px;
          font-size: 11.5px;
          color: #1c1917;
          font-weight: 500;
        }

        .po-bank-label {
          display: block;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #6b645b;
          margin-bottom: 2px;
        }

        .po-footer {
          margin: 24px 24px 0;
          padding-top: 16px;
          border-top: 1px solid #e7e1d6;
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }

        .po-signature-block {
          width: 210px;
        }

        .po-signature-line {
          border-bottom: 1px solid #2f2a24;
          height: 22px;
        }

        .po-signature-label {
          font-size: 10px;
          color: #4b453d;
          margin-top: 5px;
        }

        .po-footer-info {
          font-size: 10px;
          line-height: 1.5;
          color: #6b645b;
          text-align: right;
        }

        .po-actions-row {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          margin: 20px 24px 24px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 600;
          line-height: 1.2;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-brass {
          background: #8c621e;
          color: #ffffff;
          border: 1px solid #8c621e;
        }

        .btn-brass:hover {
          background: #755015;
        }

        .btn-ghost {
          background: #ffffff;
          color: #1c1917;
          border: 1px solid #dcd6ca;
        }

        .btn-ghost:hover {
          background: #f3efe6;
        }

        .btn-navy {
          background: #11223b;
          color: #ffffff;
          border: 1px solid #11223b;
        }

        .btn-navy:hover {
          background: #0b1729;
        }

        .po-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .po-modal-card {
          width: 100%;
          max-width: 640px;
          background: #faf8f4;
          border: 1px solid #e6e0d5;
          border-radius: 10px;
          padding: 20px 22px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .po-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e7e1d6;
        }

        .po-modal-title {
          font-size: 15px;
          font-weight: 700;
          color: #1c1917;
          margin-top: 2px;
        }

        .po-modal-val {
          font-size: 12px;
          font-weight: 500;
          color: #1c1917;
        }

        .po-preview-items {
          margin-top: 12px;
          border: 1px solid #e6e0d5;
          border-radius: 6px;
          padding: 12px;
          background: #ffffff;
          font-size: 12px;
        }

        .po-preview-item-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          color: #2f2a24;
        }

        .po-preview-total-row {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e7e1d6;
          font-weight: 700;
          color: #8c621e;
        }

        @media (max-width: 860px) {
          .po-oneline-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .po-bank-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .po-two-col,
          .po-ship-grid,
          .po-oneline-grid,
          .po-bank-grid {
            grid-template-columns: 1fr;
          }
          .po-item-row-head,
          .po-item-row {
            grid-template-columns: 28px 1fr 68px 104px 26px;
          }
          .po-letterhead-meta,
          .po-footer-info {
            text-align: left;
          }
          .po-doc-ref-input {
            text-align: left;
          }
        }
      `}</style>
        </div>
    );
}
