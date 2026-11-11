// components/tender/TenderDetailSubmitted.tsx
"use client";

import { useState } from "react";
import { FileText, ClipboardList, Download, Plus, Loader2, Pencil, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";

export interface SubmittedTenderDetail {
  id: string;
  tenderer: string;
  title: string;
  bidValue: string;
  tenderSecurity?: string;
  performanceSecurity?: string;
  documentsSubmitted: { name: string; url?: string }[];
  otherParticipants: { bidder: string; value: string; isUs?: boolean }[];
  checklist?: {
    id: string;
    label: string;
    checked: boolean;
    isCustom?: boolean;
  }[];
  agreementFiles?: {
    _id?: string; // ⭐ MongoDB subdocument ID
    title: string;
    category: string;
    fileUrl: string;
    fileName: string;
    noaDate?: string | null;
    contractDate?: string | null;
    deliveryDate?: string | null;
    invoiceDate?: string | null;
    challanDate?: string | null;
    mushakDate?: string | null;
  }[];
}

interface Props {
  data: SubmittedTenderDetail;
  onMarkWon?: () => void;
  onMarkLost?: () => void;
  onDownloadAll?: () => void | Promise<void>;
  onAddDocument?: () => void;
  onUpdateAgreement?: (tenderId: string, fileId: string, newTitle: string) => Promise<void>;
  onDeleteAgreement?: (tenderId: string, fileId: string) => Promise<void>;
}

function fullFileUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "https://taskify-server-5gat.onrender.com/api/v1";
  const origin = base.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export function TenderDetailSubmitted({
  data,
  onMarkWon,
  onMarkLost,
  onDownloadAll,
  onAddDocument,
  onUpdateAgreement, // ⭐ Destructure
  onDeleteAgreement, // ⭐ Destructure
}: Props) {
  const checklist = data.checklist ?? [];
  const agreementFiles = data.agreementFiles ?? [];

  const [downloading, setDownloading] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; title: string } | null>(null);

const handleDownloadAll = async () => {
  if (!onDownloadAll) return;
  setDownloading(true);
  const loadingId = toast.loading("Preparing ZIP file...");
  try {
    await onDownloadAll();
    toast.success("Download started", { id: loadingId });
  } catch (e) {
    toast.error((e as Error).message || "Failed to download", { id: loadingId });
  } finally {
    setDownloading(false);
  }
};

  const handleSaveTitle = async (fileId: string) => {
    if (!editingTitle.trim() || !onUpdateAgreement) return;
    try {
      await onUpdateAgreement(data.id, fileId, editingTitle.trim());
      setEditingFileId(null);
      toast.success("Title updated");
    } catch (e) {
      toast.error((e as Error).message || "Failed to update");
    }
  };

  const handleDelete = (fileId: string, fileTitle: string) => {
    if (!onDeleteAgreement) return;
    setFileToDelete({ id: fileId, title: fileTitle });
  };

  const confirmDelete = async () => {
    if (!fileToDelete || !onDeleteAgreement) return;

    setDeletingFileId(fileToDelete.id);
    try {
      await onDeleteAgreement(data.id, fileToDelete.id);
      toast.success("File deleted");
      setFileToDelete(null);
    } catch (e) {
      toast.error((e as Error).message || "Failed to delete");
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 px-5 py-3">
        <h2 className="text-sm font-bold text-slate-900">
          {data.tenderer} — {data.title}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {onDownloadAll && (
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={downloading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download All
            </button>
          )}

          {onAddDocument && (
            <button
              type="button"
              onClick={onAddDocument}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add Document
            </button>
          )}

          {onMarkWon && (
            <button
              type="button"
              onClick={onMarkWon}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              ✓ Mark as Won
            </button>
          )}
          {onMarkLost && (
            <button
              type="button"
              onClick={onMarkLost}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
            >
              ✗ Mark as Lost
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6 p-5">
          {/* Bid Summary */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Bid Summary
            </p>
            <div className="space-y-0">
              <Row label="Our Bid Value" value={data.bidValue} />
              {data.tenderSecurity && (
                <Row label="Tender Security" value={data.tenderSecurity} />
              )}
              {data.performanceSecurity && (
                <Row
                  label="Performance Security"
                  value={data.performanceSecurity}
                />
              )}
            </div>
          </div>

          {/* Other Participants */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Other Participants
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-2">Bidder</th>
                  <th className="py-2 text-right">Bid Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.otherParticipants.map((p, i) => (
                  <tr key={`${p.bidder}-${i}`}>
                    <td
                      className={`py-3 text-[11px] ${p.isUs
                        ? "font-bold text-[#a97400]"
                        : "font-medium text-slate-700"
                        }`}
                    >
                      {p.bidder}
                    </td>
                    <td
                      className={`py-3 text-right font-mono text-[11px] ${p.isUs
                        ? "font-bold text-[#a97400]"
                        : "font-semibold text-slate-800"
                        }`}
                    >
                      {p.value}
                    </td>
                  </tr>
                ))}
                {data.otherParticipants.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="py-6 text-center text-[11px] text-slate-400"
                    >
                      No participant data recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Agreement & Delivery Files */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Agreement & Delivery Files
            </p>

            {agreementFiles.map((file, idx) => {
              const fileId = file._id || `fallback-${idx}`;
              const isEditing = editingFileId === fileId;
              const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(file.fileName || file.fileUrl);

              return (
                <div key={fileId} className="rounded-lg border border-slate-200 bg-white p-3">

                  {/* ⭐ Flex container: Preview left, Details middle, Actions right */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">

                    {/* 1. Left: Avatar Preview */}
                    <div className="shrink-0">
                      {isImage ? (
                        <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                          <img
                            src={fullFileUrl(file.fileUrl)}
                            alt={file.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 flex items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                          <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* 2. Middle: Title, Category & Dates */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="h-8 w-full max-w-xs rounded border border-slate-300 px-2 text-[11px] outline-none focus:border-[#a97400]"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveTitle(fileId)}
                            className="h-8 px-2 rounded bg-emerald-600 text-white text-[10px] font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFileId(null)}
                            className="h-8 px-2 rounded border border-slate-300 bg-white text-[10px] font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[12px] font-bold text-slate-900 truncate">
                              {file.title}
                            </span>
                            <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              {file.category === "agreement" ? "Agreement" : "Product Delivery"}
                            </span>
                          </div>

                          {/* Dates inline */}
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
                            {file.category === "agreement" ? (
                              <>
                                {file.noaDate && (
                                  <span><strong className="font-semibold">NOA:</strong> {new Date(file.noaDate).toLocaleDateString("en-GB")}</span>
                                )}
                                {file.contractDate && (
                                  <span><strong className="font-semibold">Contract:</strong> {new Date(file.contractDate).toLocaleDateString("en-GB")}</span>
                                )}
                              </>
                            ) : (
                              <>
                                {file.deliveryDate && (
                                  <span><strong className="font-semibold">Delivery:</strong> {new Date(file.deliveryDate).toLocaleDateString("en-GB")}</span>
                                )}
                                {file.invoiceDate && (
                                  <span><strong className="font-semibold">Invoice:</strong> {new Date(file.invoiceDate).toLocaleDateString("en-GB")}</span>
                                )}
                                {file.challanDate && (
                                  <span><strong className="font-semibold">Challan:</strong> {new Date(file.challanDate).toLocaleDateString("en-GB")}</span>
                                )}
                                {file.mushakDate && (
                                  <span><strong className="font-semibold">Mushak:</strong> {new Date(file.mushakDate).toLocaleDateString("en-GB")}</span>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* 3. Right: Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0 self-start sm:self-center">
                        <a
                          href={fullFileUrl(file.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-green-600 hover:underline px-1.5"
                        >
                          View
                        </a>
                        <button
                          onClick={() => {
                            setEditingFileId(fileId);
                            setEditingTitle(file.title);
                          }}
                          className="text-[10px] font-semibold text-blue-600 hover:underline px-1.5 flex items-center gap-1"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(fileId, file.title)}
                          disabled={deletingFileId === fileId}
                          className="text-[10px] font-semibold text-rose-600 hover:underline px-1.5 flex items-center gap-1 disabled:opacity-50"
                        >
                          {deletingFileId === fileId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column — dividers on the left/top */}
        <div className="space-y-6 border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
          {/* Documents Submitted */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Documents Submitted
            </p>
            <ul className="space-y-1.5">
              {data.documentsSubmitted.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2 truncate text-[11px] font-medium text-slate-700">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{f.name}</span>
                  </span>
                  {f.url ? (
                    <a
                      href={fullFileUrl(f.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[10px] font-semibold text-green-600 hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="shrink-0 cursor-not-allowed text-[10px] font-semibold text-slate-300"
                    >
                      View
                    </button>
                  )}
                </li>
              ))}
              {data.documentsSubmitted.length === 0 && (
                <li className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-center text-[11px] text-slate-400">
                  No documents submitted.
                </li>
              )}
            </ul>
          </div>

          {/* Checklist */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <ClipboardList className="h-3 w-3" />
              Submission Checklist
            </p>
            {checklist.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
                No checklist items.
              </div>
            ) : (
              <ul>
                {checklist.map((item, idx) => {
                  const value =
                    (item as any).value ??
                    (item.checked ? "Done" : "Pending");
                  const tone: "neutral" | "progress" | "warn" =
                    (item as any).tone ??
                    (item.checked ? "progress" : "warn");

                  const toneStyles = {
                    neutral: "border-slate-200 bg-slate-100 text-slate-600",
                    progress: "border-orange-200 bg-orange-50 text-orange-700",
                    warn: "border-rose-200 bg-rose-50 text-rose-700",
                  } as const;

                  return (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between py-3 ${idx < checklist.length - 1
                        ? "border-b border-slate-100"
                        : ""
                        }`}
                    >
                      <span className="text-[12px] font-medium text-slate-700">
                        {item.label}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-semibold ${toneStyles[tone]}`}
                      >
                        {value}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
      {/* ⭐ Custom Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete File?</h3>
                  <p className="text-[11px] text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-[12px] text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                Are you sure you want to delete <strong>{fileToDelete.title}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
              <button
                onClick={() => setFileToDelete(null)}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="h-8 px-3 rounded-lg bg-rose-600 text-[11px] font-semibold text-white hover:bg-rose-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-[11px] font-medium text-slate-500">
        {label}
      </span>
      <span className="font-mono text-[12px] font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

