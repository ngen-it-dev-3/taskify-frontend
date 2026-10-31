// components/tender/documents/DocsListView.tsx
"use client";

import { Eye, RotateCw, Trash2, FileText, ExternalLink } from "lucide-react";
import type { CompanyDocUI } from "@/lib/api/mappers";
import type { DocsTab } from "./DocsTabs";

/* ---------- Convert "/uploads/..." → "http://localhost:5000/uploads/..." ---------- */
function fullFileUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
  const origin = base.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

interface Props {
  docs: CompanyDocUI[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onAction: (doc: CompanyDocUI, action?: "view" | "edit" | "renew") => void;
  onDelete: (doc: CompanyDocUI) => void;
  /** Which tab is active — controls which columns render */
  category?: DocsTab;
}

const STATUS_STYLES: Record<string, string> = {
  Valid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Expiring Soon": "bg-amber-50 text-amber-700 border-amber-200",
  Expired: "bg-rose-50 text-rose-700 border-rose-200",
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* Chips order for experience: [sector, duration, volume] */
function parseExperienceChips(chips?: string[]) {
  const arr = Array.isArray(chips) ? chips : [];
  return {
    sector: arr[0] || "—",
    duration: arr[1] || "—",
    volume: arr[2] || "—",
  };
}

export function DocsListView({
  docs,
  selectedIds,
  onToggleSelect,
  onAction,
  onDelete,
  category = "legal",
}: Props) {
  if (docs.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <FileText className="mx-auto mb-3 h-6 w-6 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">No documents here yet.</p>
        <p className="mt-1 text-[11px] text-slate-400">Click Add to create one.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">

          {/* ================= WORK ORDERS TABLE ================= */}
          {category === "work-orders" && (
            <>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Order Received</th>
                  <th className="px-4 py-3">Total Sales Value</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">What it was for</th>
                  <th className="px-4 py-3">Work Type</th>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((d) => {
                  const selected = selectedIds.has(d.id);
                  return (
                    <tr key={d.id} className={`transition hover:bg-slate-50 ${selected ? "bg-amber-50/40" : ""}`}>
                      <td className="px-4 py-3 align-middle">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onToggleSelect(d.id)}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
                        />
                      </td>
                      <td className="px-4 py-3 align-middle text-sm font-bold text-slate-800">{d.title}</td>
                      <td className="px-4 py-3 align-middle text-[11px] text-slate-600">
                        {d.issuedOn ? new Date(d.issuedOn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="font-semibold text-slate-800">{d.totalValue ? `৳${d.totalValue.toLocaleString()}` : "—"}</span>
                        <span className="block text-[9px] font-normal text-slate-400">{d.totalValue ? `${(d.totalValue / 100000).toFixed(1)} Lac` : ""}</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="mb-1 block w-fit rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                          {d.isGovt ? "Govt." : "Non-Govt."}
                        </span>
                        <span className="text-[10px] text-slate-500">{d.customerType || "—"}</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="mb-1 flex flex-wrap gap-1">
                          {(d.products || []).map((p: string) => (
                            <span key={p} className="rounded bg-[#fdf8ec] px-1.5 py-0.5 text-[9px] font-medium text-[#a97400]">{p}</span>
                          ))}
                        </div>
                        <span className="line-clamp-1 block max-w-[200px] text-[10px] text-slate-500">{d.subtitle || "—"}</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="mb-1 block w-fit rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">{d.workType || "Supply"}</span>
                        {d.certReceived && <span className="block w-fit rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">Completion cert.</span>}
                      </td>
                      <td className="px-4 py-3 align-middle text-[11px] text-slate-600">
                        {d.certReceived ? "Completion Certificate" : "Work Order"}
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button onClick={() => onAction(d)} className="text-[10px] font-bold text-[#1e3a5f] hover:underline">View</button>
                          <button onClick={() => onDelete(d)} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          )}

          {/* ================= TEAM / DATASHEETS / LEGAL / CERTS TABLE ================= */}
          {category !== "work-orders" && (
            <>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <th className="w-10 px-3 py-2.5" />
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Title</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Type / Subtitle</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Reference</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Valid Until</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="w-28 px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => {
                  const selected = selectedIds.has(d.id);
                  const status = d.status || "Valid";
                  const badge = STATUS_STYLES[status] ?? "bg-slate-50 text-slate-700 border-slate-200";
                  const fileHref = fullFileUrl(d.fileUrl);

                  return (
                    <tr key={d.id} className={`border-b border-slate-50 transition hover:bg-amber-50/30 ${selected ? "bg-amber-50/60" : ""}`}>
                      <td className="px-3 py-2.5 align-middle">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onToggleSelect(d.id)}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
                        />
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-slate-800">{d.title}</p>
                          {d.experienceYears && <p className="truncate text-[10px] text-slate-500">{d.experienceYears} yrs exp</p>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-middle text-[11px] text-slate-600">
                        {d.subtitle || d.docType || "—"}
                      </td>
                      <td className="px-3 py-2.5 align-middle text-[11px] text-slate-600">{d.reference || "—"}</td>
                      <td className="px-3 py-2.5 align-middle text-[11px] text-slate-600">{fmtDate(d.validUntil)}</td>
                      <td className="px-3 py-2.5 align-middle">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right align-middle">
                        <div className="inline-flex items-center gap-1">
                          {fileHref && (
                            <a href={fileHref} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Open file">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button type="button" onClick={() => onAction(d)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title={d.action === "Renew" ? "Renew" : "View"}>
                            {d.action === "Renew" ? <RotateCw className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button type="button" onClick={() => onDelete(d)} className="rounded-md p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  );
}