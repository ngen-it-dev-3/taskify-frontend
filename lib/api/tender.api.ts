// lib/api/tender.api.ts

/* ============================================================
 * AUTH HELPERS
 * ============================================================ */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token")
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function authHeadersNoJson(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(r: Response): Promise<T> {
  const json = await r.json();
  if (!json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json.data as T;
}

/* ============================================================
 * SHARED TYPES
 * ============================================================ */

export type TenderStage =
  | "potential"
  | "active"
  | "submitted"
  | "lost"
  | "won";

export interface TenderAttachment {
  _id?: string;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: string;
}

export interface TenderEligibilityRequirement {
  id: string;
  requirement: string;
  ourRecord: string;
  match: "Meets" | "Gap" | "Partial" | "";
}

export interface TenderChecklistItem {
  id: string;
  label: string;
  checked?: boolean;
  isCustom?: boolean;
  value?: string;
  tone?: "neutral" | "progress" | "warn";
}

export interface TenderOtherParticipant {
  bidder: string;
  value: number;
  isUs?: boolean;
}

export interface TenderStageHistoryEntry {
  from?: string;
  to?: string;
  at?: string;
  by?: string;
  note?: string;
}

/* ============================================================
 * SUBMISSION PACKAGE
 * ============================================================ */

export type SubmissionPackageMode =
  | "section_by_section"
  | "single_package"
  | "portal"
  | "rfq"
  | "";

export interface TenderTodo {
  id: string;
  title: string;
  done: boolean;
}

export interface TenderSection {
  id: string;
  key: string;
  title: string;
  description?: string;
  portalHint?: string;
  order: number;
  todoItems: TenderTodo[];
  readyCount?: number;
  totalCount?: number;
}

/* ============================================================
 * TENDER
 * ============================================================ */

export interface Tender {
  _id: string;
  tenderer: string;
  title: string;
  description?: string;
  draft?: boolean;
  stage: TenderStage;
  tenderType: "eGP" | "RFQ" | "Hardcopy Ref.";
  priority?: "high" | "medium" | "low";
  tenderSecurityPurchased?: boolean;
  tenderLink?: string;
  recordedBy?: string;
  responsiblePerson?: string;
  mode?: string;
  lastDateOfPurchase?: string | null;
  lastDateOfSubmission?: string | null;
  submittedAt?: string | null;
  lostAt?: string | null;
  tentativeBudget?: number;
  bidValue?: number;
  currency?: string;
  tenderSecurityAmount?: number;
  tenderSecurityValidity?: string | null;
  performanceSecurityAmount?: number;
  performanceSecurityValidity?: string | null;
  securityMode?: string;
  submitted?: boolean;
  readiness?: number;
  docStatus?: string;
  advertisementFile?: string;
  advertisementUrl?: string;
  advertisementUploadedBy?: string;
  advertisementUploadedAt?: string | null;
  note?: string;
  eligibility?: string;
  eligibilityRequirements?: TenderEligibilityRequirement[];
  attachments?: TenderAttachment[];
  otherParticipants?: TenderOtherParticipant[];
  checklist?: TenderChecklistItem[];
  packageMode?: SubmissionPackageMode;
  packageLabel?: string;
  sections?: TenderSection[];
  notes?: string;
  lossReason?: string;
  lowestCompliantBidder?: string;
  lowestCompliantValue?: number;
  owner?: any;
  departmentId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  stageHistory?: TenderStageHistoryEntry[];
}

/* ============================================================
 * TENDER OVERVIEW / DASHBOARD TYPES
 * ============================================================ */

export interface TenderOverviewStat {
  label: string;
  value: string;
  change?: number;
  tone?: "neutral" | "positive" | "negative" | "warn";
  icon?: string;
  hint?: string;
  highlighted?: boolean;
}

export interface TenderPipelineRow {
  id: string;
  label: string;
  count: number;
  color: string;
  hint?: string;
}
export interface PipelineSegment {
  label: string;
  value: number;
  color: string;
}

export interface TenderOverviewData {
  stats: TenderOverviewStat[];
  pipeline: TenderPipelineRow[];
  stages: Record<string, number>;
  upcoming: UpcomingTender[];
  performance: PerformanceResponse;
  recentActivity: TenderActivity[];
}

export interface UpcomingTender {
  id: string;
  tenderer: string;
  title: string;
  deadline?: string;
  daysLeft: number;
  priority?: "high" | "medium" | "low";
  value?: string;
  currency?: string;
  stage?: TenderStage;
}

export interface PerformanceDataPoint {
  month: string;
  won: number;
  lost: number;
  submitted: number;
  value?: number;
}

export interface PerformanceResponse {
  data: PerformanceDataPoint[];
  winRate: number;
  totalSubmitted?: number;
  totalWon?: number;
  totalLost?: number;
  totalValue?: number;
  pipelineMix?: PipelineSegment[];
  wonValue?: string;
  wonValueShort?: string;
  lostCount?: number;
}

export interface TenderActivity {
  id: string;
  kind:
  | "chat"
  | "discussed"
  | "lost"
  | "stage_change"
  | "submitted"
  | "uploaded"
  | "won";
  tenderer: string;
  message: string;
  timeAgo: string;
}

/* ============================================================
 * SUBMISSION TYPES
 * ============================================================ */

export interface SubmissionRow {
  id: string;
  tenderer: string;
  mode: string;
  submitted: "Submitted" | "Not yet";
  status: string;
  readiness: number;
}

export type DocTaskStatus = "Done" | "In Progress" | "Pending";

export interface SubmissionDocTask {
  _id?: string;
  id: string;
  sectionId?: string;
  title: string;
  owner: string;
  status: DocTaskStatus;
  fileName: string;
  fileUrl?: string;
}

export interface SubmissionDetail {
  id: string;
  tenderer: string;
  title: string;
  deadlineDays: number;
  readiness: number;
  docTasks: SubmissionDocTask[];
  checklist: TenderChecklistItem[];
  otherParticipants?: TenderOtherParticipant[];
  packageMode?: SubmissionPackageMode;
  packageLabel?: string;
  notes?: string;
  sections?: TenderSection[];
  priority?: "high" | "medium" | "low";
  tenderSecurityPurchased?: boolean;
  info: {
    advertisementFile?: string;
    advertisementUrl?: string;
    advertisementUploadedBy?: string;
    tenderLink?: string;
    recordedBy: string;
    tenderType: "eGP" | "RFQ" | "Hardcopy Ref.";
    responsiblePerson: string;
    lastDateOfPurchase?: string;
    lastDateOfSubmission?: string;
    lastDateOfSubmissionRaw?: string;
    note?: string;
    attachments: TenderAttachment[];
    eligibility?: string;
  };
}

/* ============================================================
 * NOTIFY FINANCE TYPES
 * ============================================================ */

export interface NotifyFinanceResult {
  recipients: string[];
  sent: number;
  failed: number;
}

/* ============================================================
 * SECURITY TYPES
 * ============================================================ */

export type SecurityType =
  | "Tender Security"
  | "Performance Security"
  | "Bank Guarantee";

export interface TenderSecurity {
  _id: string;
  entity: string;
  clientDescription: string;
  type: SecurityType;
  amount: number;
  dueDate?: string;
  docsStatus: "Attached" | "Missing";
}

export interface TenderSecurityStats {
  totalPending: number;
  entitiesAffected: number;
  receivableOutstanding: number;
  payableOutstanding: number;
}

export interface SecurityStats {
  totalPending: number;
  entitiesAffected: number;
  receivableOutstanding: number;
  payableOutstanding: number;
}

/* ============================================================
 * COMPANY DOC TYPES (UPDATED)
 * ============================================================ */

export type CompanyDocCategory =
  | "legal"
  | "profiles"
  | "work-orders"
  | "certificates"
  | "team"
  | "datasheets";

export interface CompanyDocument {
  _id: string;
  category: CompanyDocCategory;
  title: string;
  description?: string;
  subtitle?: string;
  reference?: string;
  validity?: string;
  validityDate?: string;
  status: "Valid" | "Expired" | "Expiring Soon";
  action?: "View" | "Replace" | "Renew";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMime?: string;
  docType?: string;
  chips?: string[];
  validUntil?: string;
  issuedOn?: string;
  createdBy?: { _id: string; fullName?: string; name?: string; email?: string } | string;
  createdAt?: string;

  // Work Order specific fields
  totalValue?: number;
  customerType?: string;
  isGovt?: boolean;
  products?: string[];
  workType?: string;
  certReceived?: boolean;

  // Team specific fields
  experienceYears?: number;
  isEngineer?: boolean;

}

/* ============================================================
 * TENDER API
 * ============================================================ */

export const tenderApi = {
  async list(params?: {
    stage?: string;
    tenderType?: string;
    search?: string;
    includeDrafts?: boolean;
    limit?: number;
  }): Promise<{ data: Tender[] }> {
    const qs = new URLSearchParams();
    if (params?.includeDrafts) qs.set("includeDrafts", "true");
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.stage) qs.set("stage", params.stage);
    if (params?.tenderType) qs.set("tenderType", params.tenderType);
    if (params?.search) qs.set("search", params.search);

    const r = await fetch(`${API_BASE}/tenders?${qs.toString()}`, {
      headers: authHeaders(),
    });
    const data = await handle<Tender[]>(r);
    return { data };
  },

  async get(id: string): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders/${id}`, {
      headers: authHeaders(),
    });
    return handle<Tender>(r);
  },

  async create(body: Partial<Tender>): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<Tender>(r);
  },

  async update(id: string, body: Partial<Tender>): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<Tender>(r);
  },

  async remove(id: string): Promise<void> {
    const r = await fetch(`${API_BASE}/tenders/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<void>(r);
  },

  async changeStage(
    id: string,
    stage: TenderStage,
    note?: string,
    lossReason?: string,
  ): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders/${id}/stage`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ stage, note, lossReason }),
    });
    return handle<Tender>(r);
  },

  async updateChecklist(
    id: string,
    items: TenderChecklistItem[],
  ): Promise<TenderChecklistItem[]> {
    const r = await fetch(`${API_BASE}/tenders/${id}/checklist`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ items }),
    });
    return handle<TenderChecklistItem[]>(r);
  },

  async updatePreparation(
    id: string,
    body: {
      packageMode?: SubmissionPackageMode;
      packageLabel?: string;
      notes?: string;
    },
  ): Promise<{
    packageMode: SubmissionPackageMode;
    packageLabel: string;
    notes: string;
    sections: TenderSection[];
  }> {
    const r = await fetch(`${API_BASE}/tenders/${id}/preparation`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle(r);
  },

  async applySectionTemplate(
    id: string,
    mode: string,
  ): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders/${id}/sections/apply-template`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ mode }),
    });
    return handle<Tender>(r);
  },

  async addSection(
    id: string,
    body: {
      key?: string;
      title: string;
      description?: string;
      portalHint?: string;
    },
  ): Promise<TenderSection> {
    const r = await fetch(`${API_BASE}/tenders/${id}/sections`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<TenderSection>(r);
  },

  async updateSection(
    id: string,
    sectionId: string,
    body: Partial<{
      key: string;
      title: string;
      description: string;
      portalHint: string;
      order: number;
    }>,
  ): Promise<TenderSection> {
    const r = await fetch(
      `${API_BASE}/tenders/${id}/sections/${sectionId}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return handle<TenderSection>(r);
  },

  async deleteSection(id: string, sectionId: string): Promise<void> {
    const r = await fetch(
      `${API_BASE}/tenders/${id}/sections/${sectionId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
    return handle<void>(r);
  },

  async addTodo(
    id: string,
    sectionId: string,
    body: { title: string },
  ): Promise<TenderTodo> {
    const r = await fetch(
      `${API_BASE}/tenders/${id}/sections/${sectionId}/todos`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return handle<TenderTodo>(r);
  },

  async updateTodo(
    id: string,
    sectionId: string,
    todoId: string,
    body: Partial<{ title: string; done: boolean }>,
  ): Promise<TenderTodo> {
    const r = await fetch(
      `${API_BASE}/tenders/${id}/sections/${sectionId}/todos/${todoId}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return handle<TenderTodo>(r);
  },

  async deleteTodo(
    id: string,
    sectionId: string,
    todoId: string,
  ): Promise<void> {
    const r = await fetch(
      `${API_BASE}/tenders/${id}/sections/${sectionId}/todos/${todoId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
    return handle<void>(r);
  },

  async uploadAttachment(id: string, file: File): Promise<TenderAttachment> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API_BASE}/tenders/${id}/attachments`, {
      method: "POST",
      headers: authHeadersNoJson(),
      body: fd,
    });
    return handle<TenderAttachment>(r);
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    const r = await fetch(
      `${API_BASE}/tenders/${id}/attachments/${attachmentId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
    return handle<void>(r);
  },

  async uploadAdvertisement(
    id: string,
    file: File,
  ): Promise<{
    advertisementFile: string;
    advertisementUrl: string;
    advertisementUploadedBy: string;
    advertisementUploadedAt: string;
  }> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API_BASE}/tenders/${id}/advertisement`, {
      method: "POST",
      headers: authHeadersNoJson(),
      body: fd,
    });
    return handle(r);
  },

  async deleteAdvertisement(id: string): Promise<void> {
    const r = await fetch(`${API_BASE}/tenders/${id}/advertisement`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<void>(r);
  },

  async notifyFinance(
    id: string,
    body: { emails: string[]; note?: string },
  ): Promise<NotifyFinanceResult> {
    const r = await fetch(`${API_BASE}/tenders/${id}/notify-finance`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<NotifyFinanceResult>(r);
  },
  // ✅ Add Company Docs to Tender
  async addCompanyDocsToTender(
    tenderId: string,
    body: { documentIds: string[]; sectionId: string }
  ): Promise<any> {
    const r = await fetch(`${API_BASE}/tenders/${tenderId}/add-documents`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<any>(r);
  },
};

/* ============================================================
 * SUBMISSION API
 * ============================================================ */

export const submissionApi = {
  async list(): Promise<SubmissionRow[]> {
    const r = await fetch(`${API_BASE}/tenders/submissions/list`, {
      headers: authHeaders(),
    });
    return handle<SubmissionRow[]>(r);
  },

  async get(id: string): Promise<SubmissionDetail> {
    const r = await fetch(`${API_BASE}/tenders/submissions/${id}`, {
      headers: authHeaders(),
    });
    return handle<SubmissionDetail>(r);
  },
};

/* ============================================================
 * DOC TASK API
 * ============================================================ */

export const docTaskApi = {
  async add(
    tenderId: string,
    body: {
      title: string;
      owner: string;
      status: string;
      fileName?: string;
      sectionId?: string;
    },
  ): Promise<{ _id: string }> {
    const r = await fetch(`${API_BASE}/tenders/${tenderId}/doc-tasks`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<{ _id: string }>(r);
  },

  async update(
    tenderId: string,
    taskId: string,
    body: Partial<{
      title: string;
      owner: string;
      status: string;
      fileName: string;
      fileUrl: string;
      order: number;
      sectionId: string;
    }>,
  ): Promise<any> {
    const r = await fetch(
      `${API_BASE}/tenders/${tenderId}/doc-tasks/${taskId}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return handle<any>(r);
  },

  async remove(tenderId: string, taskId: string): Promise<void> {
    const r = await fetch(
      `${API_BASE}/tenders/${tenderId}/doc-tasks/${taskId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
    return handle<void>(r);
  },
};

/* ============================================================
 * SECURITY API
 * ============================================================ */

export const securityApi = {
  async list(params?: {
    entity?: string;
    type?: string;
    docs?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: TenderSecurity[]; total?: number }> {
    const qs = new URLSearchParams();
    if (params?.entity) qs.set("entity", params.entity);
    if (params?.type) qs.set("type", params.type);
    if (params?.docs) qs.set("docs", params.docs);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);

    const r = await fetch(`${API_BASE}/tenders/security/list?${qs}`, {
      headers: authHeaders(),
    });
    const json = await r.json();
    if (!json.success) throw new Error(json.message || "Request failed");

    const data = Array.isArray(json.data)
      ? json.data
      : json.data?.rows ?? [];

    return { data, total: json.data?.total };
  },

  async recordPayment(
    id: string,
    body: {
      amount: number;
      date: string;
      mode: string;
      reference: string;
      delivery: string;
      closeOrder: boolean;
    },
  ): Promise<TenderSecurity> {
    const r = await fetch(`${API_BASE}/tenders/security/${id}/pay`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<TenderSecurity>(r);
  },

  async stats(): Promise<TenderSecurityStats> {
    const r = await fetch(`${API_BASE}/tenders/security/stats`, {
      headers: authHeaders(),
    });
    return handle<TenderSecurityStats>(r);
  },

  async create(body: Partial<TenderSecurity>): Promise<TenderSecurity> {
    const r = await fetch(`${API_BASE}/tenders/security`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<TenderSecurity>(r);
  },

  async update(
    id: string,
    body: Partial<TenderSecurity>,
  ): Promise<TenderSecurity> {
    const r = await fetch(`${API_BASE}/tenders/security/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<TenderSecurity>(r);
  },

  async remove(id: string): Promise<void> {
    const r = await fetch(`${API_BASE}/tenders/security/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<void>(r);
  },

  async notify(
    id: string,
    body: { emails: string[]; note?: string },
  ): Promise<{ accepted?: string[]; rejected?: string[] }> {
    const r = await fetch(`${API_BASE}/tenders/security/${id}/notify`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<{ accepted?: string[]; rejected?: string[] }>(r);
  },
};

/* ============================================================
 * COMPANY DOCS API
 * ============================================================ */

export const companyDocApi = {
  async list(params?: {
    category?: CompanyDocCategory;
    search?: string;
    sector?: string;
    duration?: string;
    volume?: string;
  }): Promise<CompanyDocument[]> {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    if (params?.sector) qs.set("sector", params.sector);
    if (params?.duration) qs.set("duration", params.duration);
    if (params?.volume) qs.set("volume", params.volume);

    const r = await fetch(`${API_BASE}/tenders/docs/list?${qs}`, {
      headers: authHeaders(),
    });
    return handle<CompanyDocument[]>(r);
  },

  async counts(): Promise<Record<string, number>> {
    const r = await fetch(`${API_BASE}/tenders/docs/counts`, {
      headers: authHeaders(),
    });
    return handle<Record<string, number>>(r);
  },

  async bundle(params?: {
    category?: CompanyDocCategory;
    search?: string;
    sector?: string;
    duration?: string;
    volume?: string;
  }): Promise<{ docs: CompanyDocument[]; counts: Record<string, number> }> {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    if (params?.sector) qs.set("sector", params.sector);
    if (params?.duration) qs.set("duration", params.duration);
    if (params?.volume) qs.set("volume", params.volume);

    const r = await fetch(`${API_BASE}/tenders/docs/bundle?${qs}`, {
      headers: authHeaders(),
    });
    return handle(r);
  },

  async create(body: {
    category?: CompanyDocCategory;
    title: string;
    description?: string;
    reference?: string;
    validity?: string;
    validityDate?: string;
    issuedOn?: string;
    subtitle?: string;
    chips?: string[];
    docType?: string;
    totalValue?: number;
    customerType?: string;
    isGovt?: boolean;
    products?: string[];
    workType?: string;
    certReceived?: boolean;
    experienceYears?: number;
    isEngineer?: boolean;
  }): Promise<CompanyDocument> {
    const r = await fetch(`${API_BASE}/tenders/docs`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<CompanyDocument>(r);
  },

  async update(
    id: string,
    body: Partial<CompanyDocument>,
  ): Promise<CompanyDocument> {
    const r = await fetch(`${API_BASE}/tenders/docs/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<CompanyDocument>(r);
  },

  async remove(id: string): Promise<void> {
    const r = await fetch(`${API_BASE}/tenders/docs/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<void>(r);
  },

  async uploadDocFile(id: string, file: File): Promise<CompanyDocument> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API_BASE}/tenders/docs/${id}/file`, {
      method: "POST",
      headers: authHeadersNoJson(),
      body: fd,
    });
    return handle<CompanyDocument>(r);
  },

  async renewDoc(
    id: string,
    body: {
      validityDate: string;
      issuedOn?: string;
      reference?: string;
      note?: string;
    },
  ): Promise<CompanyDocument> {
    const r = await fetch(`${API_BASE}/tenders/docs/${id}/renew`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<CompanyDocument>(r);
  },

  async importToTender(body: {
    targetTenderId: string;
    documentIds: string[];
  }): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders/docs/import`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<Tender>(r);
  },
};