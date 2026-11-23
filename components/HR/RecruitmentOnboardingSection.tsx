// components/HR/RecruitmentOnboardingSection.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
    JobPositionItem,
    CandidateItem,
    OnlineTestItem,
    TestSubmissionItem,
    QuestionPaperItem,
    InterviewSelectionItem,
    OnboardingHireItem,
    RecruitmentOverviewData,
    fetchRecruitmentOverview,
    fetchPositions,
    fetchCandidates,
    fetchTestsAndSubmissions,
    fetchQuestionPapers,
    fetchInterviewSelections,
    fetchOnboardingHires,
} from "@/lib/recruitment";
import OpenPositionsTab from "./OpenPositionsTab";
import OnlineTestsTab from "./OnlineTestsTab";
import QuestionPapersTab from "./QuestionPapersTab";
import CvBankTab from "./CvBankTab";
import OnboardingTab from "./OnboardingTab";

export type RecruitmentTabKey =
    | "positions"
    | "tests"
    | "papers"
    | "cv_bank"
    | "onboarding";

const SAMPLE_OVERVIEW: RecruitmentOverviewData = {
    openPositions: { count: 1, subtitle: "Junior Accountant" },
    candidatesInPipeline: { count: 6, subtitle: "Across open positions" },
    activeOnlineTests: { count: 1, subtitle: "6 of 6 submitted" },
    onboardingInProgress: { count: 1, subtitle: "3 of 6 steps done" },
};

const SAMPLE_POSITIONS: JobPositionItem[] = [
    {
        _id: "sample-pos-1",
        title: "Junior Accountant",
        department: "Accounts & Finance",
        stage: "interviewing",
        targetStartDate: "2026-10-01T00:00:00.000Z",
        candidateCount: 6,
    },
];

const SAMPLE_CANDIDATES: CandidateItem[] = [
    {
        _id: "sample-cand-1",
        fullName: "Farhana Islam",
        gender: "Female",
        department: "Accounts & Finance",
        experienceYears: 3,
        interviewedBefore: true,
        positionId: { _id: "sample-pos-1", title: "Junior Accountant" },
        positionAppliedLabel: "Junior Accountant",
        source: "Online Test Portal",
        stage: "Shortlisted",
        testScore: 82,
        cvFileName: "CV.pdf",
        createdAt: "2026-09-15T00:00:00.000Z",
    },
    {
        _id: "sample-cand-2",
        fullName: "Rakib Hossain",
        gender: "Male",
        department: "Accounts & Finance",
        experienceYears: 2,
        interviewedBefore: true,
        positionId: { _id: "sample-pos-1", title: "Junior Accountant" },
        positionAppliedLabel: "Junior Accountant",
        source: "Online Test Portal",
        stage: "Interviewing",
        testScore: 71,
        cvFileName: "CV.pdf",
        createdAt: "2026-09-15T00:00:00.000Z",
    },
    {
        _id: "sample-cand-3",
        fullName: "Nusrat Jahan",
        gender: "Female",
        department: "Accounts & Finance",
        experienceYears: 4,
        interviewedBefore: true,
        positionId: { _id: "sample-pos-1", title: "Junior Accountant" },
        positionAppliedLabel: "Junior Accountant",
        source: "Online Test Portal",
        stage: "Not Selected",
        testScore: 64,
        cvFileName: "CV.pdf",
        createdAt: "2026-09-15T00:00:00.000Z",
    },
    {
        _id: "sample-cand-4",
        fullName: "Shafiqul Islam",
        gender: "Male",
        department: "Computer",
        experienceYears: 3,
        interviewedBefore: false,
        positionId: null,
        positionAppliedLabel: "Unlinked / Speculative",
        source: "Email — Direct Application",
        stage: "On File",
        cvFileName: "CV.pdf",
        createdAt: "2026-09-02T00:00:00.000Z",
    },
    {
        _id: "sample-cand-5",
        fullName: "Mitu Akter",
        gender: "Female",
        department: "Business",
        experienceYears: 1,
        interviewedBefore: false,
        positionId: null,
        positionAppliedLabel: "Unlinked / Speculative",
        source: "Referral — Akramul Haque",
        stage: "On File",
        cvFileName: "CV.pdf",
        createdAt: "2026-08-28T00:00:00.000Z",
    },
    {
        _id: "sample-cand-6",
        fullName: "Imran Kabir",
        gender: "Male",
        department: "Accounts & Finance",
        experienceYears: 2,
        interviewedBefore: true,
        positionId: null,
        positionAppliedLabel: "Unlinked / Speculative",
        source: "Job Portal",
        stage: "Not Selected",
        blacklisted: true,
        blacklistReason: "Falsified experience certificate",
        cvFileName: "CV.pdf",
        createdAt: "2026-07-10T00:00:00.000Z",
    },
];

const SAMPLE_TESTS: OnlineTestItem[] = [
    {
        _id: "sample-test-1",
        title: "Accounting Fundamentals — Screening",
        status: "Active",
        candidatesTaken: 6,
        candidatesTotal: 6,
    },
];

const SAMPLE_SUBMISSIONS: TestSubmissionItem[] = [
    {
        _id: "sample-sub-1",
        candidateName: "Farhana Islam",
        submittedDate: "2026-09-15T00:00:00.000Z",
        score: 82,
        answers: [
            {
                question: "What is the accounting equation?",
                answered: "Assets = Liabilities + Equity",
                isCorrect: true,
            },
            {
                question: "What is the formula for Net Profit Margin?",
                answered: "Net Profit ÷ Revenue × 100",
                isCorrect: true,
            },
            {
                question:
                    "Which financial statement shows a company's profitability over a period?",
                answered: "Balance Sheet",
                isCorrect: false,
            },
            {
                question: "What is a trial balance used for?",
                answered:
                    "To check that total debits equal total credits before preparing financial statements",
                isCorrect: true,
            },
            {
                question: 'What does "depreciation" represent?',
                answered: "The allocation of an asset's cost over its useful life",
                isCorrect: true,
            },
        ],
    },
    {
        _id: "sample-sub-2",
        candidateName: "Rakib Hossain",
        submittedDate: "2026-09-15T00:00:00.000Z",
        score: 71,
        answers: [
            {
                question: "What is the accounting equation?",
                answered: "Assets = Liabilities + Equity",
                isCorrect: true,
            },
            {
                question: "What does 'depreciation' represent?",
                answered: "The allocation of an asset's cost over its useful life",
                isCorrect: true,
            },
        ],
    },
];

const SAMPLE_PAPERS: QuestionPaperItem[] = [
    {
        _id: "sample-paper-1",
        title: "Accounting Fundamentals — Screening",
        positionLabel: "Junior Accountant",
        paperType: "Aptitude",
        questionsCountOverride: 15,
        questions: [
            {
                question: "What is the accounting equation?",
                answer: "Assets = Liabilities + Equity",
            },
            {
                question: "What is the formula for Net Profit Margin?",
                answer: "Net Profit ÷ Revenue × 100",
            },
            {
                question:
                    "Which financial statement shows a company's profitability over a period?",
                answer: "Income Statement (Profit & Loss)",
            },
            {
                question: "What is a trial balance used for?",
                answer:
                    "To check that total debits equal total credits before preparing financial statements",
            },
            {
                question: 'What does "depreciation" represent?',
                answer: "The allocation of an asset's cost over its useful life",
            },
        ],
    },
    {
        _id: "sample-paper-2",
        title: "General Office Aptitude — Standard",
        positionLabel: "All Positions",
        paperType: "Aptitude",
        questionsCountOverride: 10,
        questions: [
            {
                question: "How do you prioritize conflicting urgent deliverables?",
                answer: "Assess business impact, SLA deadlines, and stakeholder urgency.",
            },
        ],
    },
];

const SAMPLE_SELECTIONS: InterviewSelectionItem[] = [
    {
        _id: "sample-sel-1",
        candidateName: "Farhana Islam",
        designation: "Junior Accountant",
        interviewDate: "2026-09-22T00:00:00.000Z",
        status: "Selected",
    },
    {
        _id: "sample-sel-2",
        candidateName: "Rakib Hossain",
        designation: "Junior Accountant",
        interviewDate: "2026-09-22T00:00:00.000Z",
        status: "Scheduled",
    },
];

const SAMPLE_HIRES: OnboardingHireItem[] = [
    {
        _id: "sample-hire-1",
        employeeName: "Farhana Yasmin",
        department: "Supply Chain",
        startDate: "2026-09-05T00:00:00.000Z",
        completedSteps: 3,
        totalSteps: 6,
        ndaStatus: "Signed",
        status: "In Progress",
    },
];

export default function RecruitmentOnboardingSection({
    initialTab = "positions",
}: {
    initialTab?: RecruitmentTabKey;
}) {
    const { isAuthenticated } = useAuth();

    const [activeTab, setActiveTab] = useState<RecruitmentTabKey>(initialTab);
    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);

    const [overview, setOverview] =
        useState<RecruitmentOverviewData>(SAMPLE_OVERVIEW);
    const [positions, setPositions] = useState<JobPositionItem[]>([]);
    const [selectedPositionId, setSelectedPositionId] = useState<string>("");
    const [candidates, setCandidates] = useState<CandidateItem[]>([]);
    const [tests, setTests] = useState<OnlineTestItem[]>([]);
    const [submissions, setSubmissions] = useState<TestSubmissionItem[]>([]);
    const [papers, setPapers] = useState<QuestionPaperItem[]>([]);
    const [interviewSelections, setInterviewSelections] = useState<
        InterviewSelectionItem[]
    >([]);
    const [hires, setHires] = useState<OnboardingHireItem[]>([]);

    const loadAllRecruitmentData = useCallback(async () => {
        try {
            setLoading(true);
            const [
                ov,
                posList,
                candList,
                testBundle,
                paperList,
                selectionList,
                hireList,
            ] = await Promise.all([
                fetchRecruitmentOverview(),
                fetchPositions(),
                fetchCandidates(),
                fetchTestsAndSubmissions(),
                fetchQuestionPapers(),
                fetchInterviewSelections(),
                fetchOnboardingHires(),
            ]);

            setOverview(ov || SAMPLE_OVERVIEW);
            setPositions(posList);
            setCandidates(candList);
            setTests(testBundle.tests);
            setSubmissions(testBundle.submissions);
            setPapers(paperList);
            setInterviewSelections(selectionList);
            setHires(hireList);
            setUsingFallback(false);

            if (posList.length > 0) {
                setSelectedPositionId((prev) =>
                    prev && posList.some((p) => p._id === prev) ? prev : posList[0]._id
                );
            } else {
                setSelectedPositionId("");
            }
        } catch {
            setOverview(SAMPLE_OVERVIEW);
            setPositions(SAMPLE_POSITIONS);
            setSelectedPositionId(SAMPLE_POSITIONS[0]._id);
            setCandidates(SAMPLE_CANDIDATES);
            setTests(SAMPLE_TESTS);
            setSubmissions(SAMPLE_SUBMISSIONS);
            setPapers(SAMPLE_PAPERS);
            setInterviewSelections(SAMPLE_SELECTIONS);
            setHires(SAMPLE_HIRES);
            setUsingFallback(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllRecruitmentData();
    }, [isAuthenticated, loadAllRecruitmentData]);

    const tabItems: Array<{ id: RecruitmentTabKey; label: string }> = [
        { id: "positions", label: "Open Positions" },
        { id: "tests", label: "Online Tests" },
        { id: "papers", label: "Question Papers" },
        { id: "cv_bank", label: "CV Bank" },
        { id: "onboarding", label: "Onboarding" },
    ];

    return (
        <div className="w-full space-y-6">
            {/* Page Header */}
            <div className="space-y-1">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#9A6B26]">
                    HR &amp; Admin
                </span>
                <h1 className="text-2xl sm:text-[26px] font-bold text-[#1E1E1E] tracking-tight">
                    Recruitment &amp; Onboarding
                </h1>
                <p className="text-xs sm:text-[13px] text-[#6E6A63]">
                    Open positions, candidate pipeline, online screening tests, and
                    new-hire onboarding checklists.
                </p>
            </div>

            {usingFallback && (
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                        <strong>Preview Mode:</strong> Showing sample recruitment records.
                        Create records to store live data in MongoDB.
                    </span>
                </div>
            )}

            {/* Top 4 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#EAE4D7] rounded-xl p-4 shadow-2xs">
                    <p className="text-xs text-[#6E6A63]">Open Positions</p>
                    <p className="mt-2 text-2xl font-bold text-[#1E1E1E]">
                        {overview.openPositions.count}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8A8478] truncate">
                        {overview.openPositions.subtitle}
                    </p>
                </div>

                <div className="bg-white border border-[#EAE4D7] rounded-xl p-4 shadow-2xs">
                    <p className="text-xs text-[#6E6A63]">Candidates In Pipeline</p>
                    <p className="mt-2 text-2xl font-bold text-[#1E1E1E]">
                        {overview.candidatesInPipeline.count}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8A8478]">
                        {overview.candidatesInPipeline.subtitle}
                    </p>
                </div>

                <div className="bg-white border border-[#EAE4D7] rounded-xl p-4 shadow-2xs">
                    <p className="text-xs text-[#6E6A63]">Active Online Tests</p>
                    <p className="mt-2 text-2xl font-bold text-[#1E1E1E]">
                        {overview.activeOnlineTests.count}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8A8478]">
                        {overview.activeOnlineTests.subtitle}
                    </p>
                </div>

                <div className="bg-white border border-[#EAE4D7] rounded-xl p-4 shadow-2xs">
                    <p className="text-xs text-[#6E6A63]">Onboarding In Progress</p>
                    <p className="mt-2 text-2xl font-bold text-[#1E1E1E]">
                        {overview.onboardingInProgress.count}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8A8478]">
                        {overview.onboardingInProgress.subtitle}
                    </p>
                </div>
            </div>

            {/* Modular Tab Bar */}
            <div className="border-b border-[#EAE4D7] flex items-center gap-6 overflow-x-auto">
                {tabItems.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`cursor-pointer pb-3 text-sm whitespace-nowrap transition-colors relative ${isActive
                                    ? "text-[#9A6B26] font-semibold border-b-2 border-[#9A6B26] -mb-px"
                                    : "text-[#6E6A63] hover:text-[#1E1E1E] font-medium"
                                }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Active Tab Content */}
            {loading ? (
                <div className="bg-white border border-[#EAE4D7] rounded-xl p-14 flex flex-col items-center justify-center">
                    <Loader2 className="w-7 h-7 animate-spin text-[#9A6B26] mb-2.5" />
                    <p className="text-xs text-[#6E6A63]">Loading recruitment tab...</p>
                </div>
            ) : (
                <>
                    {activeTab === "positions" && (
                        <OpenPositionsTab
                            positions={positions}
                            candidates={candidates}
                            selectedPositionId={selectedPositionId}
                            onSelectPositionId={setSelectedPositionId}
                            onNavigateToCvBank={() => setActiveTab("cv_bank")}
                            onRefresh={loadAllRecruitmentData}
                            isSampleMode={usingFallback}
                        />
                    )}

                    {activeTab === "tests" && (
                        <OnlineTestsTab
                            tests={tests}
                            submissions={submissions}
                            positions={positions}
                            papers={papers}
                            onRefresh={loadAllRecruitmentData}
                        />
                    )}

                    {activeTab === "papers" && (
                        <QuestionPapersTab
                            papers={papers}
                            positions={positions}
                            onRefresh={loadAllRecruitmentData}
                        />
                    )}

                    {activeTab === "cv_bank" && (
                        <CvBankTab
                            candidates={candidates}
                            positions={positions}
                            interviewSelections={interviewSelections}
                            onNavigateToPositions={(posId?: string) => {
                                if (posId) setSelectedPositionId(posId);
                                setActiveTab("positions");
                            }}
                            onRefresh={loadAllRecruitmentData}
                            isSampleMode={usingFallback}
                        />
                    )}

                    {activeTab === "onboarding" && (
                        <OnboardingTab
                            hires={hires}
                            onRefresh={loadAllRecruitmentData}
                            isSampleMode={usingFallback}
                        />
                    )}
                </>
            )}
        </div>
    );
}