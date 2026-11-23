"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  FileText,
  Plus,
  Upload,
  X,
  Loader2,
  Ban,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  CandidateItem,
  JobPositionItem,
  InterviewSelectionItem,
  CandidateStage,
  createCandidateWithCv,
  createInterviewSelection,
  downloadCandidateCv,
  resolveCvFileUrl,
  formatDisplayDate,
} from "@/lib/recruitment";

interface CvBankTabProps {
  candidates: CandidateItem[];
  positions: JobPositionItem[];
  interviewSelections: InterviewSelectionItem[];
  onNavigateToPositions: (positionId?: string) => void;
  onRefresh: () => Promise<void>;
  isSampleMode?: boolean;
}

export default function CvBankTab({
  candidates,
  positions,
  interviewSelections,
  onNavigateToPositions,
  onRefresh,
  isSampleMode = false,
}: CvBankTabProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filters matching screenshot
  const [searchText, setSearchText] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [minExp, setMinExp] = useState("");
  const [maxExp, setMaxExp] = useState("");
  const [interviewedFilter, setInterviewedFilter] = useState("all");
  const [blacklistedOnly, setBlacklistedOnly] = useState(false);

  // Modals
  const [showAddCvModal, setShowAddCvModal] = useState(false);
  const [showBulkCvModal, setShowBulkCvModal] = useState(false);
  const [showAddSelectionModal, setShowAddSelectionModal] = useState(false);

  // Single CV Form
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "">("Female");
  const [department, setDepartment] = useState("Accounts & Finance");
  const [experienceYears, setExperienceYears] = useState("2");
  const [interviewedBefore, setInterviewedBefore] = useState(false);
  const [positionId, setPositionId] = useState("");
  const [source, setSource] = useState("Online Test Portal");
  const [stage, setStage] = useState<CandidateStage>("On File");
  const [blacklisted, setBlacklisted] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [savingCv, setSavingCv] = useState(false);
  const singleFileInputRef = useRef<HTMLInputElement | null>(null);

  // Bulk CV State
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkSource, setBulkSource] = useState("Job Portal");
  const [bulkDepartment, setBulkDepartment] = useState("General");
  const [savingBulk, setSavingBulk] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);

  // Add Interview Selection Form
  const [selCandidateName, setSelCandidateName] = useState("");
  const [selDesignation, setSelDesignation] = useState("Junior Accountant");
  const [selDate, setSelDate] = useState("");
  const [selStatus, setSelStatus] = useState<"Selected" | "Scheduled" | "Rejected">("Scheduled");
  const [savingSelection, setSavingSelection] = useState(false);

  const metrics = useMemo(() => {
    const total = candidates.length;
    const shortlisted = candidates.filter(
      (c) => !c.blacklisted && (c.stage === "Shortlisted" || c.stage === "Selected")
    ).length;
    const notSelectedSpeculative = candidates.filter(
      (c) =>
        !c.blacklisted &&
        (c.stage === "Not Selected" || c.stage === "On File")
    ).length;
    const unlinked = candidates.filter((c) => {
      const label = (c.positionAppliedLabel || "").toLowerCase();
      return !c.positionId || label.includes("unlinked") || label.includes("speculative");
    }).length;
    const blacklistedCount = candidates.filter((c) => Boolean(c.blacklisted)).length;

    return {
      total,
      shortlisted,
      notSelectedSpeculative,
      unlinked,
      blacklistedCount,
    };
  }, [candidates]);

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.department?.trim()) set.add(c.department.trim());
    });
    positions.forEach((p) => {
      if (p.department?.trim()) set.add(p.department.trim());
    });
    return Array.from(set);
  }, [candidates, positions]);

  const filteredCandidates = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const minVal = minExp.trim() !== "" ? Number(minExp) : null;
    const maxVal = maxExp.trim() !== "" ? Number(maxExp) : null;

    return candidates.filter((c) => {
      if (blacklistedOnly && !c.blacklisted) return false;

      if (positionFilter !== "all") {
        const posId =
          typeof c.positionId === "string" ? c.positionId : c.positionId?._id || "";
        const label = (c.positionAppliedLabel || "").toLowerCase();
        if (positionFilter === "unlinked") {
          if (posId && !label.includes("unlinked")) return false;
        } else if (posId !== positionFilter) {
          return false;
        }
      }

      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (genderFilter !== "all" && c.gender !== genderFilter) return false;
      if (
        departmentFilter !== "all" &&
        (c.department || "").toLowerCase() !== departmentFilter.toLowerCase()
      ) {
        return false;
      }

      const exp = Number(c.experienceYears || 0);
      if (minVal !== null && !Number.isNaN(minVal) && exp < minVal) return false;
      if (maxVal !== null && !Number.isNaN(maxVal) && exp > maxVal) return false;

      if (interviewedFilter === "yes" && !c.interviewedBefore) return false;
      if (interviewedFilter === "no" && c.interviewedBefore) return false;

      if (q) {
        const haystack = [
          c.fullName,
          c.department,
          c.source,
          c.positionAppliedLabel,
          c.cvFileName,
          c.blacklistReason,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    candidates,
    blacklistedOnly,
    positionFilter,
    stageFilter,
    genderFilter,
    departmentFilter,
    minExp,
    maxExp,
    interviewedFilter,
    searchText,
  ]);

  const handleClearFilters = () => {
    setSearchText("");
    setPositionFilter("all");
    setStageFilter("all");
    setGenderFilter("all");
    setDepartmentFilter("all");
    setMinExp("");
    setMaxExp("");
    setInterviewedFilter("all");
    setBlacklistedOnly(false);
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (
      filteredCandidates.length > 0 &&
      selectedIds.length === filteredCandidates.length
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map((c) => c._id));
    }
  };

  const handleDownloadCv = async (cand: CandidateItem) => {
    if (isSampleMode || cand._id.startsWith("sample-")) {
      toast.error("Sample CV. Add a live candidate to download uploaded CV.");
      return;
    }
    try {
      setDownloadingId(cand._id);
      await downloadCandidateCv(cand._id, cand.cvFileName || "CV.pdf");
    } catch {
      const directUrl = resolveCvFileUrl(cand.cvFileUrl);
      if (directUrl) {
        window.open(directUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("CV file not available.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAddSingleCv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Candidate name is required.");
      return;
    }
    try {
      setSavingCv(true);
      await createCandidateWithCv({
        fullName: fullName.trim(),
        gender,
        department: department.trim(),
        experienceYears: Math.max(0, Number(experienceYears) || 0),
        interviewedBefore,
        positionId: positionId || undefined,
        positionAppliedLabel: positionId ? undefined : "Unlinked / Speculative",
        source: source.trim() || "Online Test Portal",
        stage,
        blacklisted,
        blacklistReason: blacklisted ? blacklistReason.trim() : "",
        cvFile,
      });
      toast.success("Candidate CV added to CV Bank.");
      setFullName("");
      setCvFile(null);
      setBlacklisted(false);
      setBlacklistReason("");
      setShowAddCvModal(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add CV.");
    } finally {
      setSavingCv(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkFiles.length === 0) {
      toast.error("Select at least one CV file.");
      return;
    }
    try {
      setSavingBulk(true);
      for (const file of bulkFiles) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]+/g, " ")
          .trim() || "Candidate CV";
        await createCandidateWithCv({
          fullName: cleanName,
          department: bulkDepartment.trim() || "General",
          positionAppliedLabel: "Unlinked / Speculative",
          source: bulkSource.trim() || "Job Portal",
          stage: "On File",
          cvFile: file,
        });
      }
      toast.success(`${bulkFiles.length} CV(s) uploaded to CV Bank.`);
      setBulkFiles([]);
      setShowBulkCvModal(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Bulk CV upload failed.");
    } finally {
      setSavingBulk(false);
    }
  };

  const handleAddInterviewSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selCandidateName.trim() || !selDesignation.trim() || !selDate) {
      toast.error("Candidate name, designation, and date are required.");
      return;
    }
    try {
      setSavingSelection(true);
      await createInterviewSelection({
        candidateName: selCandidateName.trim(),
        designation: selDesignation.trim(),
        interviewDate: selDate,
        status: selStatus,
      });
      toast.success("Interview selection added.");
      setSelCandidateName("");
      setSelDate("");
      setShowAddSelectionModal(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to add interview selection."
      );
    } finally {
      setSavingSelection(false);
    }
  };

  const getStatusPill = (cand: CandidateItem) => {
    if (cand.blacklisted) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    switch (cand.stage) {
      case "Shortlisted":
      case "Selected":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Interviewing":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Not Selected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "On File":
      default:
        return "bg-[#EEF2FF] text-[#3B5BDB] border-[#DCE4FF]";
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Description & Actions matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-[#6E6A63]">
          Every CV received, in one searchable repository — whether or not
          it&apos;s tied to an open position today.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowBulkCvModal(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#1E1E1E]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Bulk Add CVs</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddCvModal(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#9A6B26] hover:bg-[#82581E] text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add CV</span>
          </button>
        </div>
      </div>

      {/* 5 CV Bank Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-[#EAE4D7] rounded-xl p-3.5">
          <p className="text-[11px] text-[#6E6A63]">Total CVs on File</p>
          <p className="mt-1.5 text-xl font-bold text-[#1E1E1E]">
            {metrics.total}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8A8478]">All sources</p>
        </div>

        <div className="bg-white border border-[#EAE4D7] rounded-xl p-3.5">
          <p className="text-[11px] text-[#6E6A63]">Shortlisted</p>
          <p className="mt-1.5 text-xl font-bold text-[#1E1E1E]">
            {metrics.shortlisted}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8A8478]">Active pipeline</p>
        </div>

        <div className="bg-white border border-[#EAE4D7] rounded-xl p-3.5">
          <p className="text-[11px] text-[#6E6A63] truncate">
            On File — Not Selected / Speculative
          </p>
          <p className="mt-1.5 text-xl font-bold text-[#1E1E1E]">
            {metrics.notSelectedSpeculative}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8A8478]">
            Kept for future roles
          </p>
        </div>

        <div className="bg-white border border-[#EAE4D7] rounded-xl p-3.5">
          <p className="text-[11px] text-[#6E6A63]">Unlinked to a Position</p>
          <p className="mt-1.5 text-xl font-bold text-[#1E1E1E]">
            {metrics.unlinked}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8A8478]">
            Speculative / referral
          </p>
        </div>

        <div className="bg-white border border-[#EAE4D7] rounded-xl p-3.5">
          <p className="text-[11px] text-[#6E6A63]">Blacklisted</p>
          <p className="mt-1.5 text-xl font-bold text-rose-600">
            {metrics.blacklistedCount}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8A8478]">
            Flagged — excluded from consideration
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#EAE4D7] rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name, skill, or position..."
            className="px-3.5 py-2 rounded-lg border border-[#E5DFD3] text-[#1E1E1E] placeholder:text-[#9A9488]"
          />

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white text-[#1E1E1E]"
          >
            <option value="all">All Positions</option>
            <option value="unlinked">Unlinked / Speculative</option>
            {positions
              .filter((p) => !p._id.startsWith("sample-"))
              .map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white text-[#1E1E1E]"
          >
            <option value="all">All Statuses</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Not Selected">Not Selected</option>
            <option value="On File">On File</option>
            <option value="Selected">Selected</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E5DFD3] bg-white text-[#1E1E1E]"
            >
              <option value="all">All Genders</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E5DFD3] bg-white text-[#1E1E1E]"
            >
              <option value="all">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5DFD3] bg-[#FAF8F5]">
              <span className="text-[10px] font-bold uppercase text-[#7D786E]">
                EXPERIENCE (YRS)
              </span>
              <input
                type="number"
                min={0}
                value={minExp}
                onChange={(e) => setMinExp(e.target.value)}
                placeholder="Min"
                className="w-12 bg-white border border-[#E5DFD3] rounded px-1.5 py-0.5 text-xs"
              />
              <span className="text-[#8A8478]">–</span>
              <input
                type="number"
                min={0}
                value={maxExp}
                onChange={(e) => setMaxExp(e.target.value)}
                placeholder="Max"
                className="w-12 bg-white border border-[#E5DFD3] rounded px-1.5 py-0.5 text-xs"
              />
            </div>

            <select
              value={interviewedFilter}
              onChange={(e) => setInterviewedFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E5DFD3] bg-white text-[#1E1E1E]"
            >
              <option value="all">Interviewed With Us · All</option>
              <option value="yes">Yes — Interviewed before</option>
              <option value="no">No — Not interviewed yet</option>
            </select>

            <button
              type="button"
              onClick={() => setBlacklistedOnly((prev) => !prev)}
              className={`cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                blacklistedOnly
                  ? "bg-rose-600 border-rose-600 text-white"
                  : "bg-white border-[#E5DFD3] text-rose-700 hover:bg-rose-50"
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Blacklisted Only</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            className="cursor-pointer text-xs font-medium text-[#7D786E] hover:text-[#1E1E1E]"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[11px] font-bold uppercase tracking-wider text-[#7D786E]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredCandidates.length > 0 &&
                      selectedIds.length === filteredCandidates.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-[#D5CFC2]"
                  />
                </th>
                <th className="py-3 px-3">Candidate</th>
                <th className="py-3 px-3">CV</th>
                <th className="py-3 px-3">Position Applied</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Added</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE3] text-xs">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 px-5 text-center text-[#7D786E]"
                  >
                    No CVs match the current filters.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const posTitle =
                    typeof cand.positionId === "object" && cand.positionId?.title
                      ? cand.positionId.title
                      : cand.positionAppliedLabel || "Unlinked / Speculative";

                  const metaLine = cand.blacklisted
                    ? `Blacklisted — ${cand.blacklistReason || "Policy violation"}`
                    : `${cand.gender || "Candidate"} · ${
                        cand.department || "General"
                      } · ${cand.experienceYears ?? 0} yrs exp · ${
                        cand.interviewedBefore
                          ? "Interviewed before"
                          : "Not interviewed yet"
                      }`;

                  const rightActionLabel = cand.blacklisted
                    ? "Do not re-contact"
                    : cand.stage === "Shortlisted" ||
                        cand.stage === "Interviewing"
                      ? "View Pipeline →"
                      : cand.stage === "Not Selected"
                        ? "Kept on file"
                        : "No active position";

                  return (
                    <tr
                      key={cand._id}
                      className="hover:bg-[#FCFBF8] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(cand._id)}
                          onChange={() => toggleSelectRow(cand._id)}
                          className="rounded border-[#D5CFC2]"
                        />
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-[#1E1E1E]">
                          {cand.fullName}
                        </p>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            cand.blacklisted
                              ? "text-rose-600 font-medium"
                              : "text-[#8A8478]"
                          }`}
                        >
                          {metaLine}
                        </p>
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadCv(cand)}
                          disabled={downloadingId === cand._id}
                          className="cursor-pointer inline-flex items-center gap-1 text-xs font-medium text-[#3B5BDB] hover:underline"
                        >
                          {downloadingId === cand._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          <span>{cand.cvFileName || "CV.pdf"}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-[#5A554E]">{posTitle}</td>
                      <td className="py-3.5 px-3 text-[#5A554E]">
                        {cand.source || "Online Test Portal"}
                      </td>
                      <td className="py-3.5 px-3 text-[#5A554E]">
                        {formatDisplayDate(cand.createdAt)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getStatusPill(
                            cand
                          )}`}
                        >
                          {cand.blacklisted ? "Not Selected" : cand.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {cand.stage === "Shortlisted" ||
                        cand.stage === "Interviewing" ? (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateToPositions(
                                typeof cand.positionId === "object"
                                  ? cand.positionId?._id
                                  : undefined
                              )
                            }
                            className="cursor-pointer text-xs font-medium text-[#3B5BDB] hover:underline"
                          >
                            {rightActionLabel}
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#8A8478]">
                            {rightActionLabel}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interview Selections Section matching screenshot */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#6E6A63]">
            INTERVIEW SELECTIONS
          </h2>
          <button
            type="button"
            onClick={() => setShowAddSelectionModal(true)}
            className="cursor-pointer text-xs font-semibold text-[#9A6B26] hover:underline"
          >
            + Add Interview Selection
          </button>
        </div>

        <div className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[11px] font-bold uppercase tracking-wider text-[#7D786E]">
                  <th className="py-3 px-5">Candidate</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Interview Date</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE3] text-xs">
                {interviewSelections.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 px-5 text-center text-[#7D786E]"
                    >
                      No interview selections scheduled yet.
                    </td>
                  </tr>
                ) : (
                  interviewSelections.map((item) => (
                    <tr key={item._id} className="hover:bg-[#FCFBF8]">
                      <td className="py-3.5 px-5 font-bold text-[#1E1E1E]">
                        {item.candidateName}
                      </td>
                      <td className="py-3.5 px-4 text-[#5A554E]">
                        {item.designation}
                      </td>
                      <td className="py-3.5 px-4 text-[#5A554E]">
                        {formatDisplayDate(item.interviewDate)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span
                          className={`text-[11px] font-semibold ${
                            item.status === "Selected"
                              ? "text-emerald-700"
                              : item.status === "Rejected"
                                ? "text-rose-600"
                                : "text-amber-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Single CV Modal */}
      {showAddCvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#EAE4D7] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E1E1E]">Add CV</h3>
              <button
                type="button"
                onClick={() => setShowAddCvModal(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSingleCv} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Candidate name"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) =>
                      setGender(
                        e.target.value as "Male" | "Female" | "Other" | ""
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3] bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Accounts & Finance"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Experience (Yrs)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as CandidateStage)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3] bg-white"
                  >
                    <option value="On File">On File</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Not Selected">Not Selected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Position</label>
                  <select
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3] bg-white"
                  >
                    <option value="">Unlinked / Speculative</option>
                    {positions
                      .filter((p) => !p._id.startsWith("sample-"))
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Source</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Online Test Portal / Referral"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interviewedBefore}
                    onChange={(e) => setInterviewedBefore(e.target.checked)}
                  />
                  <span>Interviewed before</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-rose-700">
                  <input
                    type="checkbox"
                    checked={blacklisted}
                    onChange={(e) => setBlacklisted(e.target.checked)}
                  />
                  <span>Blacklist candidate</span>
                </label>
              </div>

              {blacklisted && (
                <div>
                  <label className="block font-semibold mb-1">
                    Blacklist Reason
                  </label>
                  <input
                    type="text"
                    value={blacklistReason}
                    onChange={(e) => setBlacklistReason(e.target.value)}
                    placeholder="e.g., Falsified experience certificate"
                    className="w-full px-3 py-2 rounded-lg border border-rose-200"
                  />
                </div>
              )}

              <div>
                <input
                  ref={singleFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => singleFileInputRef.current?.click()}
                  className="w-full cursor-pointer rounded-lg border border-dashed border-[#D7C8AA] bg-[#FAF8F5] p-3 text-center font-medium text-[#1E1E1E]"
                >
                  {cvFile ? cvFile.name : "Choose CV file (.pdf, .doc, .docx)"}
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCvModal(false)}
                  className="cursor-pointer px-4 py-2 rounded-lg border border-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCv}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-[#9A6B26] text-white font-semibold inline-flex items-center gap-1.5"
                >
                  {savingCv && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save CV</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add CVs Modal */}
      {showBulkCvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#EAE4D7] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E1E1E]">
                Bulk Add CVs
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkCvModal(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBulkUpload} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={bulkDepartment}
                    onChange={(e) => setBulkDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Source</label>
                  <input
                    type="text"
                    value={bulkSource}
                    onChange={(e) => setBulkSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
              </div>
              <input
                ref={bulkFileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setBulkFiles(e.target.files ? Array.from(e.target.files) : [])
                }
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bulkFileInputRef.current?.click()}
                className="w-full cursor-pointer rounded-lg border border-dashed border-[#D7C8AA] bg-[#FAF8F5] p-4 text-center font-medium text-[#1E1E1E] inline-flex flex-col items-center gap-1"
              >
                <Upload className="w-4 h-4 text-[#9A6B26]" />
                <span>
                  {bulkFiles.length > 0
                    ? `${bulkFiles.length} CV file(s) selected`
                    : "Select multiple CVs (.pdf, .doc, .docx)"}
                </span>
              </button>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkCvModal(false)}
                  className="cursor-pointer px-4 py-2 rounded-lg border border-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBulk}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-[#9A6B26] text-white font-semibold inline-flex items-center gap-1.5"
                >
                  {savingBulk && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Upload All</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Interview Selection Modal */}
      {showAddSelectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#EAE4D7] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E1E1E]">
                Add Interview Selection
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSelectionModal(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={handleAddInterviewSelection}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">Candidate *</label>
                <input
                  type="text"
                  required
                  value={selCandidateName}
                  onChange={(e) => setSelCandidateName(e.target.value)}
                  placeholder="e.g., Farhana Islam"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Designation *</label>
                <input
                  type="text"
                  required
                  value={selDesignation}
                  onChange={(e) => setSelDesignation(e.target.value)}
                  placeholder="e.g., Junior Accountant"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Interview Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={selDate}
                    onChange={(e) => setSelDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={selStatus}
                    onChange={(e) =>
                      setSelStatus(
                        e.target.value as "Selected" | "Scheduled" | "Rejected"
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFD3] bg-white"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSelectionModal(false)}
                  className="cursor-pointer px-4 py-2 rounded-lg border border-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSelection}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-[#9A6B26] text-white font-semibold inline-flex items-center gap-1.5"
                >
                  {savingSelection && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Save Selection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}