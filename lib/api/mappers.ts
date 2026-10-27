// lib/api/mappers.ts
import type { TenderSecurity, CompanyDocument } from "./tender.api";
import { budgetLabel, fmtDate } from "./tender.mapper";

/* ============================================================
 * SECURITY MAPPERS
 * ============================================================ */

export interface SecurityRowUI {
    id: string;
    entity: string;
    clientDescription: string;
    invoiceNo: string;
    invoiceDate: string;
    amount: number;
    receivedAmount: number;
    receivedPercent: number;
    balance: number;
    dueDate: string;
    dueText: string;
    isOverdue: boolean;
    paymentStatus: string;
    delivery: string;
    type: TenderSecurity["type"];
    docsStatus: "Attached" | "Missing";
    currency: string;
    isDraft?: boolean;
    isEditing?: boolean;
    isSaving?: boolean;
    isDeleting?: boolean;
}

export function toSecurityUIRow(raw: any): SecurityRowUI {
    const amount = Number(raw.amount) || 0;
    const receivedAmount = Number(raw.receivedAmount) || 0;
    const balance = amount - receivedAmount;
    const receivedPercent = amount > 0 ? Math.round((receivedAmount / amount) * 100) : 0;

    let paymentStatus = "Not invoiced";
    let isOverdue = false;
    let dueText = "";

    // ✅ Dynamic Status Calculation
    if (raw.invoiceNo && raw.invoiceNo !== "No invoice yet") {
        if (balance <= 0) {
            paymentStatus = raw.delivery === "Closed" ? "Closed" : "Paid in full";
        } else if (raw.dueDate) {
            const dueDateObj = new Date(raw.dueDate);
            const today = new Date();

            if (dueDateObj < today) {
                isOverdue = true;
                paymentStatus = receivedAmount > 0 ? "Part paid · overdue" : "Overdue";
                const diffDays = Math.floor((today.getTime() - dueDateObj.getTime()) / (1000 * 3600 * 24));
                dueText = `${diffDays} days ago`;
            } else {
                paymentStatus = receivedAmount > 0 ? "Part paid" : "Invoiced";
                const diffDays = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24));
                dueText = `in ${diffDays} days`;
            }
        } else {
            paymentStatus = receivedAmount > 0 ? "Part paid" : "Invoiced";
        }
    }

    return {
        id: raw._id || raw.id,
        entity: raw.entity || "N/A",
        clientDescription: raw.clientDescription || "",
        invoiceNo: raw.invoiceNo || "No invoice yet",
        invoiceDate: raw.invoiceDate ? fmtDate(raw.invoiceDate) : "",
        amount,
        receivedAmount,
        receivedPercent,
        balance,
        dueDate: raw.dueDate ? fmtDate(raw.dueDate) : "-",
        dueText,
        isOverdue,
        paymentStatus,
        delivery: raw.delivery || "Pending",
        type: raw.type || "Tender Security",
        docsStatus: raw.docsStatus || "Missing",
        currency: "৳",
    };
}

export function toSecurityStatsTiles(s: any) {
    return [
        {
            label: "Payments outstanding",
            value: budgetLabel(s.paymentsOutstanding || 0),
            hint: `${s.countOutstanding || 0} invoiced tenders`,
            tone: "blue"
        },
        {
            label: "Overdue payments",
            value: budgetLabel(s.overduePayments || 0),
            hint: `${s.countOverdue || 0} tender past due`,
            tone: "red"
        },
        {
            label: "Security held by banks",
            value: budgetLabel(s.totalSecurityHeld || 0),
            hint: `${s.countSecurity || 0} instruments`,
            tone: "green"
        },
        {
            label: "Awaiting purchase",
            value: budgetLabel(s.awaitingPurchase || 0),
            hint: `${s.countAwaiting || 0} requested from Accounts`,
            tone: "amber"
        },
        {
            label: "Maturing in 30 days",
            value: budgetLabel(s.maturingIn30 || 0),
            hint: `${s.countMaturing || 0} instruments`,
            tone: "dark"
        },
        {
            label: "Matured — collect back",
            value: budgetLabel(s.maturedCollect || 0),
            hint: `${s.countMatured || 0} instruments`,
            tone: "red"
        },
    ];
}

/* ============================================================
 * COMPANY DOC MAPPERS
 * ============================================================ */

export interface CompanyDocUI {
    id: string;
    category: CompanyDocument["category"];
    title: string;
    description?: string;
    reference?: string;
    validity?: string;
    status: CompanyDocument["status"];
    action?: "View" | "Replace" | "Renew";
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileMime?: string;
    docType?: string;
    subtitle?: string;
    chips?: string[];
    validUntil?: string;
    issuedOn?: string;
    creatorName?: string;
    createdAt?: string;

    /* ---------- Work Orders ---------- */
    totalValue?: number;
    customerType?: string;
    isGovt?: boolean;
    products?: string[];
    workType?: string;
    certReceived?: boolean;

    /* ---------- Team & CVs ---------- */
    experienceYears?: number;
    isEngineer?: boolean;
}

/* ---------- Category-aware docType fallback ---------- */
const DEFAULT_DOC_TYPE_BY_CATEGORY: Record<string, string> = {
    certificates: "Partner Certificate",
    legal: "Certificate",
    profiles: "Company Profile",
    experience: "Experience Certificate",
};

function resolveDocType(
    category: CompanyDocument["category"],
    docType?: string,
): string | undefined {
    if (docType && docType.trim()) return docType.trim();
    return DEFAULT_DOC_TYPE_BY_CATEGORY[category];
}

/* ---------- Description with subtitle fallback ---------- */
function resolveDescription(
    category: CompanyDocument["category"],
    description?: string,
    subtitle?: string,
): string | undefined {
    const desc = (description || "").trim();
    const sub = (subtitle || "").trim();

    if (desc) return desc;
    if (category === "profiles" && sub) return sub;
    return undefined;
}

export function toCompanyDocUI(d: CompanyDocument): CompanyDocUI {
    /* Derive action based on status. If expired or expiring soon,
     * force "Renew" — regardless of what's stored in the DB. */
    const derivedAction: "View" | "Replace" | "Renew" =
        d.status === "Expired" || d.status === "Expiring Soon"
            ? "Renew"
            : d.action === "Replace"
                ? "Replace"
                : "View";

    let creatorName: string | undefined = undefined;
    if (d.createdBy) {
        if (typeof d.createdBy === "object") {
            creatorName = d.createdBy.fullName || d.createdBy.name || d.createdBy.email;
        }
    }
    return {
        id: d._id,
        category: d.category,
        title: d.title,
        description: resolveDescription(d.category, d.description, d.subtitle),
        reference: d.reference || undefined,
        validity: d.validity || undefined,
        status: d.status,
        action: derivedAction,
        fileUrl: d.fileUrl || undefined,
        fileName: d.fileName || undefined,
        fileSize: d.fileSize ?? 0,
        fileMime: d.fileMime || undefined,
        docType: resolveDocType(d.category, d.docType),
        subtitle: d.subtitle || undefined,
        chips: Array.isArray(d.chips) ? d.chips : [],
        validUntil: d.validUntil || undefined,
        issuedOn: d.issuedOn || undefined,
        createdAt: d.createdAt || undefined,

        // ✅ Added mapping for Work Orders and Team specific fields
        totalValue: d.totalValue,
        customerType: d.customerType,
        isGovt: d.isGovt,
        products: d.products,
        workType: d.workType,
        certReceived: d.certReceived,
        experienceYears: d.experienceYears,
        isEngineer: d.isEngineer,
        creatorName,
    };



}