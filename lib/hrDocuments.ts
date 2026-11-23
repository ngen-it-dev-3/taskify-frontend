// lib/hrDocuments.ts
import api from "@/lib/axios";

export type HrDocumentCategory = "form" | "policy";
export type HrSubmissionStatus = "submitted" | "reviewed" | "approved" | "rejected";

export interface HrUserSummary {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  employeeId?: string;
}

export interface HrDocumentItem {
  _id: string;
  title: string;
  description?: string;
  category: HrDocumentCategory;
  fileName: string;
  fileExt: string;
  mimeType: string;
  fileSize: number;
  fileUrl?: string;
  filePath?: string;
  version?: string;
  isActive: boolean;
  uploadedBy?: HrUserSummary | string;
  updatedBy?: HrUserSummary | string;
  submissionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HrSubmissionItem {
  _id: string;
  documentId:
  | string
  | { _id: string; title: string; category: HrDocumentCategory; fileExt: string };
  submittedBy: HrUserSummary | string;
  fileName: string;
  fileExt: string;
  mimeType: string;
  fileSize: number;
  fileUrl?: string;
  filePath?: string;
  notes?: string;
  status: HrSubmissionStatus;
  reviewedBy?: HrUserSummary | string | null;
  reviewedAt?: string | null;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export function formatUpdatedMonthYear(dateString?: string): string {
  if (!dateString) return "Jan 2026";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "Jan 2026";
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveFullFileUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const base = (
    process.env.NEXT_PUBLIC_API_URL || "https://taskify-server-5gat.onrender.com/api/v1"
  ).replace(/\/api\/v1\/?$/, "");
  return `${base}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

export async function fetchHrDocuments(params?: {
  category?: HrDocumentCategory;
  search?: string;
}): Promise<HrDocumentItem[]> {
  const res = await api.get("/hr-documents", { params });
  return res.data?.data || [];
}

export async function uploadHrDocumentTemplate(payload: {
  title: string;
  description?: string;
  category: HrDocumentCategory;
  file: File;
  version?: string;
}): Promise<HrDocumentItem> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description || "");
  formData.append("category", payload.category);
  formData.append("version", payload.version || "1.0");
  formData.append("file", payload.file);

  const res = await api.post("/hr-documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data;
}

export async function deleteHrDocumentTemplate(id: string): Promise<void> {
  await api.delete(`/hr-documents/${id}`);
}

export async function downloadHrDocumentTemplate(
  id: string,
  fallbackFileName: string
): Promise<void> {
  const response = await api.get(`/hr-documents/${id}/download`, {
    responseType: "blob",
  });

  const rawContentType = response.headers?.["content-type"];
  const contentType = Array.isArray(rawContentType)
    ? rawContentType.join(", ")
    : typeof rawContentType === "string"
      ? rawContentType
      : "";

  if (contentType.includes("application/json")) {
    const text = await response.data.text();
    const parsed = JSON.parse(text);
    if (parsed?.data?.fileUrl) {
      window.open(
        resolveFullFileUrl(parsed.data.fileUrl),
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
  }

  let fileName = fallbackFileName || "document";
  const rawDisposition = response.headers?.["content-disposition"];
  const disposition = Array.isArray(rawDisposition)
    ? rawDisposition.join("; ")
    : typeof rawDisposition === "string"
      ? rawDisposition
      : "";

  if (disposition) {
    const match = disposition.match(/filename="?([^";]+)"?/i);
    if (match && match[1]) {
      fileName = decodeURIComponent(match[1]);
    }
  }

  const blob = new Blob([response.data], {
    type: contentType || "application/octet-stream",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function uploadHrFilledCopy(
  documentId: string,
  payload: {
    file: File;
    notes?: string;
  }
): Promise<HrSubmissionItem> {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("notes", payload.notes || "");

  const res = await api.post(`/hr-documents/${documentId}/submissions`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data;
}

export async function fetchHrSubmissions(documentId: string): Promise<HrSubmissionItem[]> {
  const res = await api.get(`/hr-documents/${documentId}/submissions`);
  return res.data?.data || [];
}