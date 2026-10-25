// lib/api/tender.mapper.ts
import type {
    Tender,
    TenderAttachment,
    SubmissionDetail,
    SubmissionRow,
    DocTaskStatus,
    SubmissionDocTask,
    TenderSection,
} from "./tender.api";
import type { TenderDetailData } from "@/components/tender/TenderDetailReview";
import type { ActiveTenderDetail } from "@/components/tender/TenderDetailActive";
import type { SubmittedTenderDetail } from "@/components/tender/TenderDetailSubmitted";
import type { LostTenderDetail } from "@/components/tender/TenderDetailLost";

/* ============================================================
 * SHARED HELPERS
 * ============================================================ */

export function fmtDate(d?: string | null): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function fmtDateTime(d?: string | null): string {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function daysLeft(d?: string | null): number {
    if (!d) return 0;
    return Math.max(
        0,
        Math.ceil((new Date(d).getTime() - Date.now()) / 86400000),
    );
}

export function budgetLabel(n?: number | null): string {
    if (!n) return "—";
    return `৳${n.toLocaleString("en-IN")}`;
}

export function normalizeAttachments(
    attachments?: TenderAttachment[] | null,
): TenderAttachment[] {
    if (!Array.isArray(attachments)) return [];
    return attachments.map((a, idx) => ({
        _id: a._id ?? `att-${idx}-${a.name ?? idx}`,
        name: a.name ?? "",
        url: a.url ?? "",
        size: a.size ?? 0,
        mimeType: a.mimeType ?? "",
        uploadedAt: a.uploadedAt ?? "",
    }));
}

/* ============================================================
 * TENDER DETAIL MAPPERS
 * ============================================================ */

export function toReviewDetail(t: Tender | any): TenderDetailData {
    const resolvedUrl =
        t.advertisementUrl || t.advertisement || t.adUrl || "";

    const resolvedFile =
        t.advertisementFile ||
        (typeof resolvedUrl === "string" && resolvedUrl.trim()
            ? resolvedUrl.split("/").pop()?.split("?")[0]
            : undefined);

    const requirements = Array.isArray(t.eligibilityRequirements)
        ? t.eligibilityRequirements
        : [];

    const meetsOnly = requirements
        .filter((r: any) => r.match === "Meets")
        .map((r: any) => r.requirement)
        .filter(Boolean)
        .join(",\n");

    return {
        id: t._id,
        tenderer: t.tenderer,
        title: t.title,

        advertisementFile: resolvedFile,
        advertisementUrl: resolvedUrl,
        advertisementUploadedBy: t.advertisementUploadedBy || t.uploadedBy,
        advertisementUploadedAt:
            t.advertisementUploadedAt || t.updatedAt
                ? fmtDateTime(t.advertisementUploadedAt || t.updatedAt)
                : "",

        tenderLink: t.tenderLink,
        recordedBy: t.recordedBy ?? "—",
        tenderType: t.tenderType,
        responsiblePerson: t.responsiblePerson ?? "—",
        lastDateOfPurchase: fmtDate(t.lastDateOfPurchase),
        lastDateOfSubmission: fmtDateTime(t.lastDateOfSubmission),
        note: t.note,
        attachments: normalizeAttachments(t.attachments),
        eligibility: meetsOnly || t.eligibility || "",
    };
}

export function toActiveDetail(t: Tender): ActiveTenderDetail {
    return {
        id: t._id,
        tenderer: t.tenderer,
        title: t.title,
        recordedBy: t.recordedBy ?? "—",
        deadlineDays: daysLeft(t.lastDateOfSubmission),
        tenderType: t.tenderType,
        value: t.tentativeBudget ? budgetLabel(t.tentativeBudget) : undefined,
        responsiblePerson: t.responsiblePerson ?? "—",
        docStatus:
            (t.docStatus as ActiveTenderDetail["docStatus"]) ?? "Pending",
        documentTasks: t.note ?? "—",
        checklist: (t.checklist ?? []).map((c) => ({
            id: c.id,
            label: c.label,
            checked: !!c.checked,
            isCustom: !!c.isCustom,
        })),
    };
}

export function toSubmittedDetail(t: Tender): SubmittedTenderDetail {
    return {
        id: t._id,
        tenderer: t.tenderer,
        title: t.title,
        bidValue: t.bidValue ? budgetLabel(t.bidValue) : "—",
        tenderSecurity: t.tenderSecurityAmount
            ? budgetLabel(t.tenderSecurityAmount)
            : undefined,
        performanceSecurity: t.performanceSecurityAmount
            ? budgetLabel(t.performanceSecurityAmount)
            : undefined,
        documentsSubmitted: normalizeAttachments(t.attachments).map((a) => ({
            name: a.name,
            url: a.url,
        })),
        otherParticipants: (t.otherParticipants ?? []).map((p) => ({
            bidder: p.bidder,
            value: budgetLabel(p.value),
            isUs: p.isUs,
        })),
        checklist: (t.checklist ?? []).map((c) => ({
            id: c.id,
            label: c.label,
            checked: !!c.checked,
            isCustom: !!c.isCustom,
        })),
    };
}

export function toLostDetail(t: Tender): LostTenderDetail {
    return {
        id: t._id,
        tenderer: t.tenderer,
        title: t.title,
        bidValue: t.bidValue ? budgetLabel(t.bidValue) : undefined,
        disqualificationReason: t.lossReason,
        lowestCompliantBidder: t.lowestCompliantBidder,
        lowestCompliantValue: t.lowestCompliantValue
            ? budgetLabel(t.lowestCompliantValue)
            : undefined,
        checklist: (t.checklist ?? []).map((c) => ({
            id: c.id,
            label: c.label,
            checked: !!c.checked,
            isCustom: !!c.isCustom,
        })),
    };
}

/* ============================================================
 * SUBMISSION MAPPERS
 * ============================================================ */

export interface SubmissionRowUI {
    id: string;
    tenderer: string;
    mode: string;
    submitted: "Submitted" | "Not yet";
    status: string;
    statusColor: "in-progress" | "pending" | "complete" | "banking";
    readiness: number;
    priority?: "high" | "medium" | "low"; // ✅ ADD THIS
    tenderSecurityPurchased?: boolean;
}

export function toSubmissionUIRow(r: SubmissionRow): SubmissionRowUI {
    const s = (r.status || "").toLowerCase();
    const statusColor: SubmissionRowUI["statusColor"] = s.includes("complete")
        ? "complete"
        : s.includes("banking")
            ? "banking"
            : s.includes("pending")
                ? "pending"
                : "in-progress";

    return {
        id: r.id,
        tenderer: r.tenderer,
        mode: r.mode || "—",
        submitted: r.submitted,
        status: r.status || "Docs pending",
        statusColor,
        readiness: r.readiness ?? 0,
        priority: (r as any).priority,
        tenderSecurityPurchased: (r as any).tenderSecurityPurchased,
    };
}

export function sanitizeSubmissionDetail(
    d: SubmissionDetail,
): SubmissionDetail {
    /* ✅ Map doc tasks — every task now carries sectionId */
    const docTasks = (d.docTasks ?? []).map((t, index) => {
        const safeStatus: DocTaskStatus =
            t.status === "Done" || t.status === "In Progress" || t.status === "Pending"
                ? t.status
                : "Pending";

        return {
            id: String(t.id ?? t._id ?? `temp-${index}`),
            _id: t._id,
            sectionId: t.sectionId ?? "",
            title: t.title ?? "",
            owner: t.owner ?? "",
            fileName: t.fileName ?? "No file uploaded yet",
            status: safeStatus,
            fileUrl: t.fileUrl,
        };
    });

    /* ✅ Normalize sections — always an array, always sorted */
    const sections: TenderSection[] = (d.sections ?? [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((s) => ({
            id: s.id,
            key: s.key,
            title: s.title,
            description: s.description ?? "",
            portalHint: s.portalHint ?? "",
            order: s.order ?? 0,
            readyCount: s.readyCount ?? 0,
            totalCount: s.totalCount ?? 0,
            todoItems: (s.todoItems ?? []).map((t) => ({
                id: t.id,
                title: t.title,
                done: !!t.done,
            })),
        }));

    return {
        ...d,
        docTasks,
        sections,
        packageMode: d.packageMode ?? "",
        packageLabel: d.packageLabel ?? "",
        notes: d.notes ?? "",
        checklist: (d.checklist ?? []).map((c) => ({
            id: c.id,
            label: c.label,
            value: c.value,
            tone: c.tone,
            checked: !!c.checked,
            isCustom: !!c.isCustom,
        })),
        info: {
            ...d.info,
            recordedBy: d.info?.recordedBy || "—",
            responsiblePerson: d.info?.responsiblePerson || "—",
            attachments: (d.info?.attachments ?? []).map((a, idx) => ({
                _id: a._id ?? `att-${idx}-${a.name ?? idx}`,
                name: a.name ?? "",
                url: a.url ?? "",
                size: a.size ?? 0,
                mimeType: a.mimeType ?? "",
            })),
        },
    };
}

/* ============================================================
 * ✅ NEW — Helpers used by SubmissionDetail.tsx (Commit 3)
 * ============================================================ */

/** Default sections to seed when an old tender has no `sections` yet. */
export const DEFAULT_SECTIONS: Array<{
    key: string;
    title: string;
    description: string;
    portalHint: string;
}> = [
        {
            key: "company_eligibility",
            title: "Company & eligibility",
            description: "Legal documents, company profile and eligibility declarations.",
            portalHint: 'Upload in the portal under "Company & eligibility"',
        },
        {
            key: "technical",
            title: "Technical",
            description: "Technical proposal, methodology, and specifications.",
            portalHint: 'Upload in the portal under "Technical"',
        },
        {
            key: "financial",
            title: "Financial / price",
            description: "Price schedule, BOQ, and financial breakdown.",
            portalHint: 'Upload in the portal under "Financial / price"',
        },
        {
            key: "tender_security",
            title: "Tender security",
            description: "Pay order, bank guarantee, or bid security.",
            portalHint: 'Upload in the portal under "Tender security"',
        },
        {
            key: "review",
            title: "Review & package",
            description: "Final review, sign-off, and submission package.",
            portalHint: 'Confirm all documents before final submission',
        },
    ];

/**
 * Group doc tasks by their sectionId. Tasks with no sectionId fall
 * into the "" (Unsectioned) bucket, which we surface as its own group
 * so users can still see + manage them.
 */
export function groupTasksBySection(
    tasks: SubmissionDocTask[],
): Record<string, SubmissionDocTask[]> {
    const out: Record<string, SubmissionDocTask[]> = {};
    for (const t of tasks) {
        const key = t.sectionId || "";
        if (!out[key]) out[key] = [];
        out[key].push(t);
    }
    return out;
}