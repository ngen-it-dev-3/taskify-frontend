"use client";

import React, { useState, useMemo, useEffect } from "react";
import { FileText, Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
    JobPositionItem,
    CandidateItem,
    PositionStage,
    createPosition,
    updateCandidate,
    downloadCandidateCv,
    resolveCvFileUrl,
    formatDisplayDate,
} from "@/lib/recruitment";

interface OpenPositionsTabProps {
    positions: JobPositionItem[];
    candidates: CandidateItem[];
    selectedPositionId: string;
    onSelectPositionId: (id: string) => void;
    onNavigateToCvBank: () => void;
    onRefresh: () => Promise<void>;
    isSampleMode?: boolean;
}

function extractApiErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === "object" && err !== null) {
        const maybeAxios = err as {
            response?: { data?: { message?: string } };
            message?: string;
        };
        if (maybeAxios.response?.data?.message) {
            return maybeAxios.response.data.message;
        }
        if (maybeAxios.message) {
            return maybeAxios.message;
        }
    }
    return fallback;
}

export default function OpenPositionsTab({
    positions,
    candidates,
    selectedPositionId,
    onSelectPositionId,
    onNavigateToCvBank,
    onRefresh,
    isSampleMode = false,
}: OpenPositionsTabProps) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Add Position Form State
    const [title, setTitle] = useState("");
    const [department, setDepartment] = useState("");
    const [stage, setStage] = useState<PositionStage>("interviewing");
    const [targetStartDate, setTargetStartDate] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!showAddModal) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) {
                setShowAddModal(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showAddModal, saving]);

    const activePosition = useMemo(() => {
        if (!positions.length) return null;
        return (
            positions.find((p) => p._id === selectedPositionId) || positions[0]
        );
    }, [positions, selectedPositionId]);

    const positionCandidates = useMemo(() => {
        if (!activePosition) return candidates;
        const matched = candidates.filter((c) => {
            const posId =
                typeof c.positionId === "string"
                    ? c.positionId
                    : c.positionId?._id || "";
            if (posId && posId === activePosition._id) return true;
            const applied = (c.positionAppliedLabel || "").trim().toLowerCase();
            return applied === activePosition.title.trim().toLowerCase();
        });
        return matched.length > 0 ? matched : candidates;
    }, [candidates, activePosition]);

    const handleCreatePosition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !department.trim()) {
            toast.error("Position title and department are required.");
            return;
        }
        try {
            setSaving(true);
            await createPosition({
                title: title.trim(),
                department: department.trim(),
                stage,
                targetStartDate: targetStartDate || undefined,
            });
            toast.success("New position added.");
            setTitle("");
            setDepartment("");
            setStage("interviewing");
            setTargetStartDate("");
            setShowAddModal(false);
            await onRefresh();
        } catch (err: unknown) {
            toast.error(extractApiErrorMessage(err, "Failed to add position."));
        } finally {
            setSaving(false);
        }
    };

    const handleSelectCandidate = async (candidate: CandidateItem) => {
        if (isSampleMode || candidate._id.startsWith("sample-")) {
            toast.error("Sample data mode. Create a live candidate to update stage.");
            return;
        }
        const nextStage =
            candidate.stage === "Selected" ? "Shortlisted" : "Selected";
        try {
            setUpdatingId(candidate._id);
            await updateCandidate(candidate._id, { stage: nextStage });
            toast.success(`${candidate.fullName} set to ${nextStage}.`);
            await onRefresh();
        } catch (err: unknown) {
            toast.error(
                extractApiErrorMessage(err, "Failed to update candidate stage.")
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCvDownload = async (candidate: CandidateItem) => {
        if (isSampleMode || candidate._id.startsWith("sample-")) {
            toast.error("Sample CV file. Upload a candidate CV first.");
            return;
        }
        try {
            setDownloadingId(candidate._id);
            await downloadCandidateCv(candidate._id, candidate.cvFileName || "CV.pdf");
        } catch {
            const directUrl = resolveCvFileUrl(candidate.cvFileUrl);
            if (directUrl) {
                window.open(directUrl, "_blank", "noopener,noreferrer");
            } else {
                toast.error("CV file unavailable.");
            }
        } finally {
            setDownloadingId(null);
        }
    };

    const getStagePill = (stageValue: string) => {
        switch (stageValue) {
            case "Shortlisted":
            case "Selected":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "Not Selected":
                return "bg-rose-50 text-rose-700 border-rose-200";
            case "Interviewing":
            case "interviewing":
            default:
                return "bg-amber-50 text-amber-800 border-amber-200";
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Toolbar Card matching screenshot */}
            <div className="bg-white border border-[#EAE4D7] rounded-xl px-5 py-3.5 flex items-center justify-end shadow-2xs">
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9A6B26] hover:bg-[#82581E] text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Position</span>
                </button>
            </div>

            {/* Positions Table */}
            <div className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[11px] font-bold uppercase tracking-wider text-[#7D786E]">
                                <th className="py-3 px-5">Position</th>
                                <th className="py-3 px-4">Department</th>
                                <th className="py-3 px-4">Candidates</th>
                                <th className="py-3 px-4">Stage</th>
                                <th className="py-3 px-5 text-right">Target Start</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE3] text-xs">
                            {positions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-8 px-5 text-center text-[#7D786E]"
                                    >
                                        No open positions yet. Click &ldquo;+ Add Position&rdquo; to
                                        create one.
                                    </td>
                                </tr>
                            ) : (
                                positions.map((pos) => {
                                    const isSelected = activePosition?._id === pos._id;
                                    const stageLabel =
                                        pos.stage === "interviewing"
                                            ? "Interviewing"
                                            : pos.stage === "offer"
                                                ? "Offer"
                                                : pos.stage === "closed"
                                                    ? "Closed"
                                                    : "Open";

                                    return (
                                        <tr
                                            key={pos._id}
                                            onClick={() => onSelectPositionId(pos._id)}
                                            className={`cursor-pointer transition-colors ${isSelected ? "bg-[#FAF5EB]/60" : "hover:bg-[#FCFBF8]"
                                                }`}
                                        >
                                            <td className="py-3.5 px-5 font-bold text-[#1E1E1E]">
                                                {pos.title}
                                            </td>
                                            <td className="py-3.5 px-4 text-[#5A554E]">
                                                {pos.department}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-[#1E1E1E]">
                                                {pos.candidateCount ?? 0}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getStagePill(
                                                        stageLabel
                                                    )}`}
                                                >
                                                    {stageLabel}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5 text-right text-[#5A554E] font-medium">
                                                {formatDisplayDate(pos.targetStartDate)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Candidates Sub-Section */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#6E6A63]">
                        CANDIDATES —{" "}
                        {(activePosition?.title || "JUNIOR ACCOUNTANT").toUpperCase()}
                    </h2>
                    <button
                        type="button"
                        onClick={onNavigateToCvBank}
                        className="cursor-pointer text-xs font-semibold text-[#9A6B26] hover:underline"
                    >
                        Full CV Bank →
                    </button>
                </div>

                <div className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[11px] font-bold uppercase tracking-wider text-[#7D786E]">
                                    <th className="py-3 px-5">Candidate</th>
                                    <th className="py-3 px-4">CV</th>
                                    <th className="py-3 px-4">Test Score</th>
                                    <th className="py-3 px-4">Stage</th>
                                    <th className="py-3 px-5 text-right" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0ECE3] text-xs">
                                {positionCandidates.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 px-5 text-center text-[#7D786E]"
                                        >
                                            No candidates found for this position.
                                        </td>
                                    </tr>
                                ) : (
                                    positionCandidates.map((cand) => {
                                        const isNotSelected = cand.stage === "Not Selected";
                                        const isSelected = cand.stage === "Selected";

                                        return (
                                            <tr
                                                key={cand._id}
                                                className="hover:bg-[#FCFBF8] transition-colors"
                                            >
                                                <td className="py-3.5 px-5 font-bold text-[#1E1E1E]">
                                                    {cand.fullName}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCvDownload(cand)}
                                                        disabled={downloadingId === cand._id}
                                                        className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-[#3B5BDB] hover:underline"
                                                    >
                                                        {downloadingId === cand._id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <FileText className="w-3.5 h-3.5" />
                                                        )}
                                                        <span>{cand.cvFileName || "CV.pdf"}</span>
                                                    </button>
                                                </td>
                                                <td className="py-3.5 px-4 font-semibold text-[#1E1E1E]">
                                                    {typeof cand.testScore === "number"
                                                        ? `${cand.testScore}%`
                                                        : "—"}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getStagePill(
                                                            cand.stage
                                                        )}`}
                                                    >
                                                        {cand.stage}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 text-right">
                                                    <button
                                                        type="button"
                                                        disabled={isNotSelected || updatingId === cand._id}
                                                        onClick={() => handleSelectCandidate(cand)}
                                                        className={`px-3 py-1 rounded-md border text-xs font-medium transition-colors ${isNotSelected
                                                                ? "border-[#EFECE6] text-[#C5BFB2] bg-[#FAF9F7] cursor-not-allowed"
                                                                : isSelected
                                                                    ? "cursor-pointer border-emerald-600 bg-emerald-600 text-white"
                                                                    : "cursor-pointer border-[#E5DFD3] bg-white hover:bg-[#FAF5EB] text-[#1E1E1E]"
                                                            }`}
                                                    >
                                                        {updatingId === cand._id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                                                        ) : isSelected ? (
                                                            "Selected"
                                                        ) : (
                                                            "Select"
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Position Modal */}
            {showAddModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => {
                        if (!saving) setShowAddModal(false);
                    }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white border border-[#EAE4D7] p-6 shadow-2xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-[#1E1E1E]">
                                Add Position
                            </h3>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setShowAddModal(false)}
                                aria-label="Close modal"
                                className="cursor-pointer text-gray-400 hover:text-gray-700 disabled:opacity-50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreatePosition} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold mb-1">
                                    Position Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Junior Accountant"
                                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">
                                    Department *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="e.g., Accounts & Finance"
                                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold mb-1">Stage</label>
                                    <select
                                        value={stage}
                                        onChange={(e) => setStage(e.target.value as PositionStage)}
                                        className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white"
                                    >
                                        <option value="open">Open</option>
                                        <option value="interviewing">Interviewing</option>
                                        <option value="offer">Offer</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold mb-1">
                                        Target Start
                                    </label>
                                    <input
                                        type="date"
                                        value={targetStartDate}
                                        onChange={(e) => setTargetStartDate(e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => setShowAddModal(false)}
                                    className="cursor-pointer px-4 py-2 rounded-lg border border-gray-200 font-semibold disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="cursor-pointer px-4 py-2 rounded-lg bg-[#9A6B26] text-white font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                                >
                                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Save</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}