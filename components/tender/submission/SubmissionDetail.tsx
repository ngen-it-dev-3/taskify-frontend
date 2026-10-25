// components/tender/submission/SubmissionDetail.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { type DocTask, type DocStatus } from "./DocTaskRow";
import { SubmissionChecklist } from "./SubmissionChecklist";
import { ReadinessBar } from "./ReadinessBar";
import { SubmissionPackageStepper } from "./SubmissionPackageStepper";
import { SectionCard } from "./SectionCard";
import { NotesPanel } from "./NotesPanel";
import { CreateSectionModal } from "./CreateSectionModal";
import { getLoggedInUser } from "./helpers/getLoggedInUser";
import {
  docTaskApi,
  tenderApi,
  type SubmissionPackageMode,
  type TenderSection,
} from "@/lib/api/tender.api";
import { DEFAULT_SECTIONS } from "@/lib/api/tender.mapper";
import { confirmToast } from "@/lib/confirmToast";
import toast from "react-hot-toast";
import { LiveCountdown } from "./LiveCountdown";
import { DocTaskRow } from "./DocTaskRow";

export interface SubmissionAttachment {
  _id?: string;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: string;
}

export interface SubmissionInfoPayload {
  advertisementFile?: string;
  advertisementUrl?: string;
  advertisementUploadedBy?: string;
  tenderLink?: string;
  recordedBy: string;
  tenderType: "eGP" | "RFQ" | "Hardcopy Ref.";
  responsiblePerson: string;
  lastDateOfPurchase?: string;
  lastDateOfSubmission?: string;
  note?: string;
  attachments: SubmissionAttachment[];
  lastDateOfSubmissionRaw?: string;
  eligibility?: string;
}

export interface SubmissionDetailData {
  id: string;
  tenderer: string;
  title: string;
  deadlineDays: number;
  readiness: number;
  docTasks: DocTask[];
  checklist: any[];
  info: SubmissionInfoPayload;
  packageMode?: SubmissionPackageMode;
  packageLabel?: string;
  notes?: string;
  sections?: TenderSection[];
  notifyAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  priority?: "high" | "medium" | "low" | "";
  tenderSecurityPurchased?: boolean;
}

interface Props {
  data: SubmissionDetailData;
  onTaskMutated?: () => void;
  onPreparationChanged?: () => void;
  onHeaderUpdated?: () => void; // ✅ ADD THIS LINE
  submitAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
}

const TABS = ["Tender Preparation", "Tender Info"] as const;
type Tab = (typeof TABS)[number];

function fullFileUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const uploadBase = process.env.NEXT_PUBLIC_API_URL_UPLOAD || "http://localhost:5000";
  return `${uploadBase}${url.startsWith("/") ? url : `/${url}`}`;
}

function fileSizeLabel(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SubmissionDetail({
  data,
  onTaskMutated,
  onPreparationChanged,
  onHeaderUpdated,
  submitAction,
}: Props) {
  const [tab, setTab] = useState<Tab>("Tender Preparation");
  const [showDetails, setShowDetails] = useState(true);
  const [tasks, setTasks] = useState<DocTask[]>(data.docTasks);
  const [uploadingAd, setUploadingAd] = useState(false);
  const [uploadingAtt, setUploadingAtt] = useState(false);
  const [deletingAttId, setDeletingAttId] = useState<string | null>(null);
  const [deletingAd, setDeletingAd] = useState(false);
  const [savingPrep, setSavingPrep] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [priority, setPriority] = useState(data.priority || "high");
  const [securityPurchased, setSecurityPurchased] = useState(
    Boolean(data.tenderSecurityPurchased)
  );

  const sections = useMemo<TenderSection[]>(
    () =>
      (data.sections ?? [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [data.sections]
  );

  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections[0]?.id ?? null
  );

  useEffect(() => {
    if (sections.length === 0) {
      setActiveSectionId(null);
      return;
    }
    if (!activeSectionId || !sections.some((s) => s.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [data.id, sections, activeSectionId]);

  const attachInputRef = useRef<HTMLInputElement>(null);
  const adInputRef = useRef<HTMLInputElement>(null);

  const lastTenderId = useRef(data.id);

  useEffect(() => {
    setTasks(data.docTasks);
    if (adInputRef.current) adInputRef.current.value = "";

    if (lastTenderId.current !== data.id) {
      setPriority((data.priority !== undefined ? data.priority : "high") as any);
      setSecurityPurchased(Boolean(data.tenderSecurityPurchased));
      lastTenderId.current = data.id;
    }
  }, [data.id, data.docTasks, data.priority, data.tenderSecurityPurchased]);

  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || sections.length > 0) {
      seededRef.current = true;
      return;
    }
    seededRef.current = true;
    (async () => {
      try {
        for (const s of DEFAULT_SECTIONS) await tenderApi.addSection(data.id, s);
        await tenderApi.updatePreparation(data.id, {
          packageMode: "section_by_section",
          packageLabel: "Local e-procurement portal — section by section",
        });
        onPreparationChanged?.();
      } catch (e) {
        console.warn("Auto-seed failed", e);
      }
    })();
  }, [data.id, sections.length, onPreparationChanged]);

  const activeSectionTasks = useMemo(
    () =>
      activeSectionId
        ? tasks.filter((t) => (t.sectionId ?? "") === activeSectionId)
        : [],
    [tasks, activeSectionId]
  );

  const unsectionedTasks = tasks.filter((t) => !t.sectionId);

  const addTask = () => {
    if (!activeSectionId) return toast.error("Create a section first");
    setTasks((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}`,
        sectionId: activeSectionId,
        title: "",
        owner: getLoggedInUser(),
        fileName: "No file uploaded yet",
        status: "Pending",
        isDraft: true,
      },
    ]);
  };

  const patchTask = (id: string, patch: Partial<DocTask>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const saveTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const finalTitle = task.title.trim() || "Untitled task";
    const safeStatus: DocStatus = task.pendingFile
      ? "In Progress"
      : task.fileUrl
        ? "Done"
        : "Pending";

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title: finalTitle, status: safeStatus, isDraft: false }
          : t
      )
    );

    try {
      const created = await docTaskApi.add(data.id, {
        title: finalTitle,
        owner: task.owner.trim() || getLoggedInUser(),
        status: safeStatus,
        fileName: task.fileName,
        sectionId: task.sectionId ?? "",
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, id: created._id, status: safeStatus, isDraft: false }
            : t
        )
      );

      if (task.pendingFile) {
        const loadingId = toast.loading(`Uploading ${task.pendingFile.name}...`);
        try {
          const att = await tenderApi.uploadAttachment(data.id, task.pendingFile);
          await docTaskApi.update(data.id, created._id, {
            fileName: att.name,
            fileUrl: att.url,
            status: "Done",
          });

          setTasks((prev) =>
            prev.map((t) =>
              t.id === created._id
                ? {
                  ...t,
                  fileName: att.name,
                  fileUrl: fullFileUrl(att.url),
                  status: "Done",
                  pendingFile: null,
                }
                : t
            )
          );
          toast.success("Task + file saved", { id: loadingId });
        } catch (e) {
          toast.error((e as Error).message || "File upload failed", {
            id: loadingId,
          });
          setTasks((prev) =>
            prev.map((t) =>
              t.id === created._id ? { ...t, status: "Pending" } : t
            )
          );
        }
      } else {
        toast.success("Document task added");
      }
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Failed to add document task");
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const cancelTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const removeTask = async (id: string) => {
    if (tasks.find((t) => t.id === id)?.isDraft) return cancelTask(id);
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await docTaskApi.remove(data.id, id);
      toast.success("Document task removed");
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Failed to remove");
      setTasks(snapshot);
    }
  };

  const uploadTaskFile = async (taskId: string, file: File) => {
    const loadingId = toast.loading(`Uploading ${file.name}...`);
    const snapshot = tasks;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, fileName: file.name, status: "In Progress" } : t
      )
    );
    try {
      const att = await tenderApi.uploadAttachment(data.id, file);
      await docTaskApi.update(data.id, taskId, {
        fileName: att.name,
        fileUrl: att.url,
        status: "Done",
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
              ...t,
              fileName: att.name,
              fileUrl: fullFileUrl(att.url),
              status: "Done",
            }
            : t
        )
      );
      toast.success("File uploaded", { id: loadingId });
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Upload failed", { id: loadingId });
      setTasks(snapshot);
    }
  };

  // ✅ Update the type signature here
  const savePreparation = async (patch: {
    packageMode?: SubmissionPackageMode; // Changed from string to SubmissionPackageMode
    packageLabel?: string;
    notes?: string;
  }) => {
    setSavingPrep(true);
    const loadingId = toast.loading("Updating package...");
    try {
      if (patch.packageMode && patch.packageMode !== data.packageMode) {
        await tenderApi.applySectionTemplate(data.id, patch.packageMode);
        await onPreparationChanged?.();
      } else {
        await tenderApi.updatePreparation(data.id, patch); // ✅ This will now be perfectly typed
        onPreparationChanged?.();
      }
      toast.success("Saved", { id: loadingId });
    } catch (e) {
      toast.error((e as Error).message || "Failed to save", { id: loadingId });
    } finally {
      setSavingPrep(false);
    }
  };

  const handleCreateSectionSubmit = async (formData: {
    title: string;
    description: string;
    portalHint: string;
  }) => {
    const loadingId = toast.loading("Adding section...");
    try {
      await tenderApi.addSection(data.id, {
        ...formData,
        key: formData.title.toLowerCase().replace(/\s+/g, "_").slice(0, 40),
      });
      toast.success("Section added", { id: loadingId });
      onPreparationChanged?.();
    } catch (e) {
      toast.error((e as Error).message || "Failed", { id: loadingId });
    }
  };

  const removeActiveSection = () => {
    if (!activeSectionId) return;
    const sec = sections.find((s) => s.id === activeSectionId);
    confirmToast({
      title: `Remove "${sec?.title}"?`,
      description: "Documents under this section will be unlinked.",
      confirmLabel: "Remove",
      variant: "danger",
      onConfirm: async () => {
        const loadingId = toast.loading("Removing...");
        try {
          await tenderApi.deleteSection(data.id, activeSectionId);
          toast.success("Section removed", { id: loadingId });
          onPreparationChanged?.();
        } catch (e) {
          toast.error((e as Error).message || "Failed", { id: loadingId });
        }
      },
    });
  };

  const handleAddTodo = async (title: string) => {
    if (!activeSectionId) return;
    const loadingId = toast.loading("Adding...");
    try {
      await tenderApi.addTodo(data.id, activeSectionId, { title });
      toast.success("To-do added", { id: loadingId });
      onPreparationChanged?.();
    } catch (e) {
      toast.error((e as Error).message || "Failed", { id: loadingId });
    }
  };

  const handleToggleTodo = async (todoId: string, done: boolean) => {
    if (!activeSectionId) return;
    try {
      await tenderApi.updateTodo(data.id, activeSectionId, todoId, { done });
      onPreparationChanged?.();
    } catch (e) {
      toast.error((e as Error).message || "Failed to update");
    }
  };

  const handleRemoveTodo = async (todoId: string) => {
    if (!activeSectionId) return;
    try {
      await tenderApi.deleteTodo(data.id, activeSectionId, todoId);
      onPreparationChanged?.();
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    }
  };

  const togglePriority = async () => {
    // ✅ Toggle between "high" and ""
    const next = priority === "high" ? "" : "high";
    setPriority(next as any); // Updates local UI instantly

    try {
      // ✅ Add "as any" here to bypass the strict type check for empty string
      await tenderApi.update(data.id, { priority: next as any });
      onHeaderUpdated?.(); // ONLY updates the top table, prevents the UI reset
    } catch (e) {
      setPriority(priority); // Revert if API fails
      toast.error("Failed to save");
    }
  };

  const toggleSecurity = async () => {
    const next = !securityPurchased;
    setSecurityPurchased(next);
    try {
      await tenderApi.update(data.id, { tenderSecurityPurchased: next });
      onHeaderUpdated?.(); // ✅ Changed from onTaskMutated to onHeaderUpdated
    } catch (e) {
      setSecurityPurchased(securityPurchased);
      toast.error("Failed to save");
    }
  };

  const uploadAdvertisement = async (file: File) => {
    setUploadingAd(true);
    const loadingId = toast.loading(`Uploading...`);
    try {
      await tenderApi.uploadAdvertisement(data.id, file);
      toast.success("Uploaded", { id: loadingId });
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Failed", { id: loadingId });
    } finally {
      setUploadingAd(false);
      if (adInputRef.current) adInputRef.current.value = "";
    }
  };

  const deleteAdvertisement = () => {
    if (!data.info.advertisementFile) return;
    confirmToast({
      title: "Delete advertisement?",
      description: "Permanently removed.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setDeletingAd(true);
        try {
          await tenderApi.deleteAdvertisement(data.id);
          toast.success("Removed");
          onTaskMutated?.();
        } catch (e) {
          toast.error((e as Error).message || "Failed");
        } finally {
          setDeletingAd(false);
        }
      },
    });
  };

  const handleAttachFile = async (file: File) => {
    setUploadingAtt(true);
    try {
      await tenderApi.uploadAttachment(data.id, file);
      toast.success("Attached");
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    } finally {
      setUploadingAtt(false);
      if (attachInputRef.current) attachInputRef.current.value = "";
    }
  };

  const deleteAttachment = (attachmentId: string, name: string) => {
    confirmToast({
      title: `Delete "${name}"?`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setDeletingAttId(attachmentId);
        try {
          await tenderApi.deleteAttachment(data.id, attachmentId);
          toast.success("Removed");
          onTaskMutated?.();
        } catch (e) {
          toast.error((e as Error).message || "Failed");
        } finally {
          setDeletingAttId(null);
        }
      },
    });
  };

  const activeIndex = sections.findIndex((s) => s.id === activeSectionId);
  const activeSection = activeIndex >= 0 ? sections[activeIndex] : null;

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col border-b border-amber-100 px-5 py-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex flex-col min-w-0">
            {(() => {
              const deadlineDate = data.info?.lastDateOfSubmission
                ? new Date(data.info.lastDateOfSubmission)
                : null;
              const now = new Date();
              const daysLeft = deadlineDate
                ? Math.ceil(
                  (deadlineDate.getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24)
                )
                : 0;

              if (!deadlineDate) return null;

              return (
                <div className="mb-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${daysLeft < 0
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : daysLeft === 0
                        ? "border-orange-200 bg-orange-50 text-orange-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                  >
                    {daysLeft < 0
                      ? "Deadline passed"
                      : `${daysLeft} days to deadline`}
                  </span>
                </div>
              );
            })()}

            <h2 className="text-[17px] font-bold leading-tight text-slate-900 mb-2">
              {data.tenderer} — {data.title}
            </h2>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-3">
              <button
                onClick={togglePriority}
                className="flex items-center gap-1 hover:text-slate-800 transition"
              >
                <Star
                  className={`h-3.5 w-3.5 ${priority === "high"
                    ? "fill-[#a97400] text-[#a97400]"
                    : "text-slate-400"
                    }`}
                />
                {priority === "high" ? "High priority" : "Mark High priority"}
              </button>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 transition">
                <input
                  type="checkbox"
                  checked={securityPurchased}
                  onChange={toggleSecurity}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
                />
                Tender security purchased
              </label>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Submission Readiness
              </span>
              <ReadinessBar percent={data.readiness} width={140} />
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4 shrink-0">
            <div className="flex items-center gap-2">
              {data.notifyAction && (
                <button
                  type="button"
                  onClick={data.notifyAction.onClick}
                  disabled={
                    data.notifyAction.loading || data.notifyAction.disabled
                  }
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#a97400] bg-[#fdf8ec] px-4 text-[11px] font-bold text-[#a97400] shadow-sm transition hover:bg-[#f5ecdc] disabled:opacity-60"
                >
                  {data.notifyAction.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  Notify Accounts - tender security
                </button>
              )}
              {submitAction && (
                <button
                  type="button"
                  onClick={submitAction.onClick}
                  disabled={submitAction.loading || submitAction.disabled}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-[#a97400] px-5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#8f6100] disabled:opacity-60"
                >
                  {submitAction.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {submitAction.label}
                </button>
              )}
            </div>

            <LiveCountdown deadlineStr={data.info.lastDateOfSubmissionRaw} />
          </div>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5">
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`relative inline-flex items-center px-3 py-2.5 text-[12px] font-semibold transition-colors ${active
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                {t}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#a97400]" />
                )}
              </button>
            );
          })}
        </div>
        {tab === "Tender Preparation" && (
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
          >
            {showDetails
              ? "− Hide Preparation Details"
              : "+ Show Preparation Details"}
            {showDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {/* ================= PREPARATION TAB ================= */}
      {tab === "Tender Preparation" && showDetails && (
        <div className="grid grid-cols-1 items-stretch gap-6 p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  SUBMISSION PACKAGE
                </span>
                <select
                  value={data.packageMode ?? ""}
                  onChange={(e) =>
                    savePreparation({ packageMode: e.target.value as any }) // ✅ Add "as any" here
                  }
                  disabled={savingPrep}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 focus:border-[#a97400] focus:outline-none focus:ring-1 focus:ring-amber-200 disabled:opacity-60"
                >
                  <option value="">— Select —</option>
                  <option value="portal">
                    Local e-procurement portal — section by section
                  </option>
                  <option value="single_package">
                    International — separate Technical and Financial files
                  </option>
                  <option value="rfq">
                    RFQ / EOI — initial level (technical and datasheets)
                  </option>
                </select>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Typical structure for this kind of tender — match it to what the
              tender document asks.
            </p>

            {sections.length > 0 ? (
              <>
                <SubmissionPackageStepper
                  sections={sections}
                  activeSectionId={activeSectionId}
                  onSelect={setActiveSectionId}
                  onAddSection={() => setIsSectionModalOpen(true)}
                />
                {activeSection && (
                  <SectionCard
                    section={activeSection}
                    tasks={activeSectionTasks}
                    isFirst={activeIndex <= 0}
                    isLast={activeIndex >= sections.length - 1}
                    onTaskChange={patchTask}
                    onTaskSave={saveTask}
                    onTaskCancel={cancelTask}
                    onTaskRemove={removeTask}
                    onTaskUploadFile={uploadTaskFile}
                    onAddTask={addTask}
                    onAddTodo={handleAddTodo}
                    onToggleTodo={handleToggleTodo}
                    onRemoveTodo={handleRemoveTodo}
                    onPrev={() =>
                      activeIndex > 0 &&
                      setActiveSectionId(sections[activeIndex - 1].id)
                    }
                    onNext={() =>
                      activeIndex < sections.length - 1 &&
                      setActiveSectionId(sections[activeIndex + 1].id)
                    }
                    onRemoveSection={removeActiveSection}
                    fileUrlResolver={fullFileUrl}
                  />
                )}

                {unsectionedTasks.length > 0 && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[13px] font-bold text-slate-800">
                        Unsectioned Files
                      </h3>
                      <span className="text-[10px] text-rose-600 font-semibold">Needs Review</span>
                    </div>
                    <p className="mb-3 text-[11px] text-slate-500">
                      These files don't belong to the current package structure. You can delete them or keep them here.
                    </p>
                    <div className="rounded-md bg-white border border-slate-200">
                      {unsectionedTasks.map((task) => (
                        <DocTaskRow
                          key={task.id}
                          task={task}
                          onChange={(patch) => patchTask(task.id, patch)}
                          onSave={() => saveTask(task.id)}
                          onCancel={() => cancelTask(task.id)}
                          onRemove={() => removeTask(task.id)}
                          onUploadFile={(file) => uploadTaskFile(task.id, file)}
                          fileUrlResolver={fullFileUrl}
                        />
                      ))}
                    </div>
                  </div>
                )}

              </>
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
                Preparing sections…
              </p>
            )}
          </div>

          <aside className="border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <SubmissionChecklist items={data.checklist} />
          </aside>
        </div>
      )}

      {tab === "Tender Preparation" && showDetails && (
        <div className="border-t border-slate-100 p-5">
          <NotesPanel
            value={data.notes ?? ""}
            saving={savingNotes}
            onSave={async (notes) => {
              setSavingNotes(true);
              try {
                await tenderApi.updatePreparation(data.id, { notes });
                toast.success("Notes saved");
                onPreparationChanged?.();
              } catch (e) {
                toast.error(
                  (e as Error).message || "Failed to save notes"
                );
              } finally {
                setSavingNotes(false);
              }
            }}
          />
        </div>
      )}

      {/* ================= INFO TAB ================= */}
      {tab === "Tender Info" && (
        <div className="grid grid-cols-1 items-stretch gap-8 p-5 lg:grid-cols-2">
          <div className="flex h-full flex-col gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tender Advertisement
              </p>
              <input
                ref={adInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) uploadAdvertisement(f);
                }}
              />
              {data.info.advertisementFile ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-800">
                        {data.info.advertisementFile}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Uploaded by {data.info.advertisementUploadedBy ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {data.info.advertisementUrl && (
                      <a
                        href={fullFileUrl(data.info.advertisementUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center rounded-md border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        View
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => adInputRef.current?.click()}
                      disabled={uploadingAd || deletingAd}
                      className="inline-flex h-7 items-center rounded-md border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {uploadingAd ? "Uploading…" : "Replace"}
                    </button>
                    <button
                      type="button"
                      onClick={deleteAdvertisement}
                      disabled={deletingAd || uploadingAd}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => adInputRef.current?.click()}
                  disabled={uploadingAd}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 px-3 py-3 text-left transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-60"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-amber-600 shadow-sm">
                      <Upload className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-slate-700">
                        {uploadingAd
                          ? "Uploading advertisement…"
                          : "Upload advertisement"}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Image or PDF — up to 15 MB
                      </span>
                    </span>
                  </span>
                </button>
              )}
            </div>
            <InfoField label="Tender Link">
              {data.info.tenderLink ? (
                <a
                  href={
                    data.info.tenderLink.startsWith("http")
                      ? data.info.tenderLink
                      : `https://${data.info.tenderLink}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  {data.info.tenderLink} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-400">
                  — (no portal link)
                </span>
              )}
            </InfoField>
            <InfoField label="Recorded By" value={data.info.recordedBy} />
            <InfoField label="Tender Type" value={data.info.tenderType} />
            <InfoField
              label="Responsible Person"
              value={data.info.responsiblePerson}
            />
            {data.info.lastDateOfPurchase && (
              <InfoField
                label="Last Date of Purchase"
                value={data.info.lastDateOfPurchase}
              />
            )}
            {data.info.lastDateOfSubmission && (
              <InfoField
                label="Last Date of Submission"
                value={data.info.lastDateOfSubmission}
              />
            )}
          </div>

          <div className="flex h-full flex-col gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                File Attachments ({data.info.attachments.length})
              </p>
              <ul className="space-y-1.5">
                {data.info.attachments.length === 0 && (
                  <li className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-center text-[11px] text-slate-400">
                    No attachments yet.
                  </li>
                )}
                {data.info.attachments.map((f) => {
                  const deleting = deletingAttId === f._id;
                  return (
                    <li
                      key={f._id}
                      className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2 truncate text-[11px] font-medium text-slate-700">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{f.name}</span>
                        {typeof f.size === "number" && f.size > 0 && (
                          <span className="shrink-0 text-[10px] text-slate-400">
                            ({fileSizeLabel(f.size)})
                          </span>
                        )}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {f.url && (
                          <a
                            href={fullFileUrl(f.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-semibold text-indigo-600 hover:underline"
                          >
                            View
                          </a>
                        )}
                        {typeof f._id === "string" && (
                          <button
                            type="button"
                            onClick={() =>
                              deleteAttachment(f._id!, f.name)
                            }
                            disabled={deleting}
                            className="rounded-md p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3">
                <input
                  ref={attachInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  disabled={uploadingAtt}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAttachFile(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => attachInputRef.current?.click()}
                  disabled={uploadingAtt}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
                      <Upload className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-slate-700">
                        {uploadingAtt
                          ? "Uploading…"
                          : "Choose a file to upload"}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        PDF, images, Word, Excel — up to 25 MB
                      </span>
                    </span>
                  </span>
                </button>
              </div>
            </div>
            <div className="mt-auto">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Eligibility Criteria / Important Records
              </p>
              <textarea
                readOnly
                value={data.info.eligibility ?? ""}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-[11px] leading-relaxed text-slate-700"
              />
            </div>
          </div>
        </div>
      )}

      <CreateSectionModal
        open={isSectionModalOpen}
        onOpenChange={setIsSectionModalOpen}
        onSubmit={handleCreateSectionSubmit}
      />
    </section>
  );
}

function InfoField({
  label,
  value,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      {children ?? (
        <span className="text-[12px] font-medium text-slate-800">{value}</span>
      )}
    </div>
  );
}

export default SubmissionDetail;