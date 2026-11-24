import api from "./axios";

export type PositionStage =
    | "open"
    | "interviewing"
    | "offer"
    | "closed"
    | "on_hold";

export type CandidateStage =
    | "Shortlisted"
    | "Interviewing"
    | "Not Selected"
    | "On File"
    | "Selected";

export interface JobPositionItem {
    _id: string;
    title: string;
    department: string;
    region?: string;
    vacancies?: number;
    stage: PositionStage;
    targetStartDate?: string | null;
    description?: string;
    candidateCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface QuestionItem {
    _id?: string;
    question: string;
    answer: string;
    marks?: number;
}

export interface QuestionPaperItem {
    _id: string;
    title: string;
    positionLabel: string;
    positionId?: string | null;
    paperType: string;
    questionsCountOverride?: number | null;
    questions: QuestionItem[];
    createdAt?: string;
    updatedAt?: string;
}

export interface OnlineTestItem {
    _id: string;
    title: string;
    positionId?: string | null;
    questionPaperId?: string | null;
    status: "Active" | "Completed" | "Draft";
    candidatesTaken: number;
    candidatesTotal: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface SubmittedAnswerItem {
    _id?: string;
    question: string;
    answered: string;
    isCorrect: boolean;
}

export interface TestSubmissionItem {
    _id: string;
    testId?: string | null;
    candidateId?: string | null;
    candidateName: string;
    submittedDate: string;
    score: number;
    answers: SubmittedAnswerItem[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CandidateItem {
    _id: string;
    fullName: string;
    email?: string;
    phone?: string;
    gender?: "Male" | "Female" | "Other" | "";
    department?: string;
    experienceYears?: number;
    interviewedBefore?: boolean;
    positionId?:
    | string
    | {
        _id: string;
        title: string;
        department?: string;
    }
    | null;
    positionAppliedLabel?: string;
    source?: string;
    stage: CandidateStage;
    testScore?: number | null;
    blacklisted?: boolean;
    blacklistReason?: string;
    cvFileName?: string;
    cvFileUrl?: string;
    cvFileSize?: number;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface InterviewSelectionItem {
    _id: string;
    candidateId?: string | null;
    candidateName: string;
    designation: string;
    interviewDate: string;
    status: "Selected" | "Scheduled" | "Rejected";
    createdAt?: string;
    updatedAt?: string;
}

export interface OnboardingHireItem {
    _id: string;
    candidateId?: string | null;
    employeeName: string;
    department: string;
    positionTitle?: string;
    startDate: string;
    completedSteps: number;
    totalSteps: number;
    ndaStatus: "Signed" | "Pending";
    status: "In Progress" | "Completed" | "On Hold";
    createdAt?: string;
    updatedAt?: string;
}

export interface RecruitmentOverviewData {
    openPositions: { count: number; subtitle: string };
    candidatesInPipeline: { count: number; subtitle: string };
    activeOnlineTests: { count: number; subtitle: string };
    onboardingInProgress: { count: number; subtitle: string };
}

export function resolveBackendOrigin(): string {
    const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://taskify-server-5gat.onrender.com/api/v1";
    return apiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
}

export function resolveCvFileUrl(cvFileUrl?: string): string | null {
    if (!cvFileUrl) return null;
    if (cvFileUrl.startsWith("http://") || cvFileUrl.startsWith("https://")) {
        return cvFileUrl;
    }
    const origin = resolveBackendOrigin();
    return `${origin}${cvFileUrl.startsWith("/") ? "" : "/"}${cvFileUrl}`;
}

export function formatDisplayDate(dateStr?: string | null): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export async function fetchRecruitmentOverview(): Promise<RecruitmentOverviewData> {
    const res = await api.get("/recruitment/overview");
    return res.data?.data;
}

export async function fetchPositions(params?: {
    search?: string;
}): Promise<JobPositionItem[]> {
    const res = await api.get("/recruitment/positions", { params });
    return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function createPosition(payload: {
    title: string;
    department: string;
    stage?: PositionStage;
    targetStartDate?: string;
    description?: string;
}): Promise<JobPositionItem> {
    const res = await api.post("/recruitment/positions", payload);
    return res.data?.data;
}

export async function updatePosition(
    id: string,
    payload: Partial<{
        title: string;
        department: string;
        region: string;
        vacancies: number;
        stage: PositionStage;
        targetStartDate?: string | null;
        description?: string;
    }>
): Promise<JobPositionItem> {
    const res = await api.patch(`/recruitment/positions/${id}`, payload);
    return res.data?.data;
}

export async function deletePosition(id: string): Promise<void> {
    await api.delete(`/recruitment/positions/${id}`);
}

export async function fetchCandidates(params?: {
    positionId?: string;
    stage?: string;
    gender?: string;
    department?: string;
    minExp?: string | number;
    maxExp?: string | number;
    interviewedBefore?: string;
    blacklistedOnly?: boolean;
    search?: string;
}): Promise<CandidateItem[]> {
    const res = await api.get("/recruitment/candidates", { params });
    return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function createCandidateWithCv(payload: {
    fullName: string;
    email?: string;
    phone?: string;
    gender?: "Male" | "Female" | "Other" | "";
    department?: string;
    experienceYears?: number;
    interviewedBefore?: boolean;
    positionId?: string;
    positionAppliedLabel?: string;
    source?: string;
    stage?: CandidateStage;
    testScore?: string | number;
    blacklisted?: boolean;
    blacklistReason?: string;
    notes?: string;
    cvFile?: File | null;
}): Promise<CandidateItem> {
    const formData = new FormData();
    formData.append("fullName", payload.fullName);
    if (payload.email) formData.append("email", payload.email);
    if (payload.phone) formData.append("phone", payload.phone);
    if (payload.gender) formData.append("gender", payload.gender);
    if (payload.department) formData.append("department", payload.department);
    if (typeof payload.experienceYears === "number") {
        formData.append("experienceYears", String(payload.experienceYears));
    }
    if (typeof payload.interviewedBefore === "boolean") {
        formData.append("interviewedBefore", String(payload.interviewedBefore));
    }
    if (payload.positionId) formData.append("positionId", payload.positionId);
    if (payload.positionAppliedLabel) {
        formData.append("positionAppliedLabel", payload.positionAppliedLabel);
    }
    if (payload.source) formData.append("source", payload.source);
    if (payload.stage) formData.append("stage", payload.stage);
    if (
        payload.testScore !== undefined &&
        payload.testScore !== null &&
        String(payload.testScore).trim() !== ""
    ) {
        formData.append("testScore", String(payload.testScore));
    }
    if (typeof payload.blacklisted === "boolean") {
        formData.append("blacklisted", String(payload.blacklisted));
    }
    if (payload.blacklistReason) {
        formData.append("blacklistReason", payload.blacklistReason);
    }
    if (payload.notes) formData.append("notes", payload.notes);
    if (payload.cvFile) formData.append("cv", payload.cvFile);

    const res = await api.post("/recruitment/candidates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data;
}

export async function updateCandidate(
    id: string,
    payload: Partial<{
        stage: CandidateStage;
        testScore: number | null;
        blacklisted: boolean;
        blacklistReason: string;
    }>
): Promise<CandidateItem> {
    const res = await api.put(`/recruitment/candidates/${id}`, payload);
    return res.data?.data;
}

export async function downloadCandidateCv(
    candidateId: string,
    fallbackFileName = "CV.pdf"
): Promise<void> {
    const response = await api.get(
        `/recruitment/candidates/${candidateId}/cv/download`,
        { responseType: "blob" }
    );

    const rawType = response.headers?.["content-type"];
    const contentType = Array.isArray(rawType)
        ? rawType.join(", ")
        : typeof rawType === "string"
            ? rawType
            : "application/octet-stream";

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fallbackFileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export async function fetchTestsAndSubmissions(): Promise<{
    tests: OnlineTestItem[];
    submissions: TestSubmissionItem[];
}> {
    const res = await api.get("/recruitment/tests");
    return {
        tests: Array.isArray(res.data?.data?.tests) ? res.data.data.tests : [],
        submissions: Array.isArray(res.data?.data?.submissions)
            ? res.data.data.submissions
            : [],
    };
}

export async function createOnlineTest(payload: {
    title: string;
    positionId?: string;
    questionPaperId?: string;
    status?: "Active" | "Completed" | "Draft";
    candidatesTaken?: number;
    candidatesTotal?: number;
}): Promise<OnlineTestItem> {
    const res = await api.post("/recruitment/tests", payload);
    return res.data?.data;
}

export async function createTestSubmission(payload: {
    testId?: string;
    candidateId?: string;
    candidateName: string;
    submittedDate?: string;
    score: number;
    answers: SubmittedAnswerItem[];
}): Promise<TestSubmissionItem> {
    const res = await api.post("/recruitment/submissions", payload);
    return res.data?.data;
}

export async function fetchQuestionPapers(): Promise<QuestionPaperItem[]> {
    const res = await api.get("/recruitment/question-papers");
    return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function createQuestionPaper(payload: {
    title: string;
    positionLabel?: string;
    positionId?: string;
    paperType?: string;
    questionsCountOverride?: number;
    questions: QuestionItem[];
}): Promise<QuestionPaperItem> {
    const res = await api.post("/recruitment/question-papers", payload);
    return res.data?.data;
}

export async function fetchInterviewSelections(): Promise<
    InterviewSelectionItem[]
> {
    const res = await api.get("/recruitment/interview-selections");
    return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function createInterviewSelection(payload: {
    candidateId?: string;
    candidateName: string;
    designation: string;
    interviewDate: string;
    status?: "Selected" | "Scheduled" | "Rejected";
}): Promise<InterviewSelectionItem> {
    const res = await api.post("/recruitment/interview-selections", payload);
    return res.data?.data;
}

export async function fetchOnboardingHires(): Promise<OnboardingHireItem[]> {
    const res = await api.get("/recruitment/onboarding");
    return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function createOnboardingHire(payload: {
    candidateId?: string;
    employeeName: string;
    department: string;
    positionTitle?: string;
    startDate: string;
    completedSteps?: number;
    totalSteps?: number;
    ndaStatus?: "Signed" | "Pending";
    status?: "In Progress" | "Completed" | "On Hold";
}): Promise<OnboardingHireItem> {
    const res = await api.post("/recruitment/onboarding", payload);
    return res.data?.data;
}

export async function updateOnboardingHire(
    id: string,
    payload: Partial<{
        completedSteps: number;
        totalSteps: number;
        ndaStatus: "Signed" | "Pending";
        status: "In Progress" | "Completed" | "On Hold";
    }>
): Promise<OnboardingHireItem> {
    const res = await api.patch(`/recruitment/onboarding/${id}`, payload);
    return res.data?.data;
}