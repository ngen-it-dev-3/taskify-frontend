// components/tender/documents/DocCard.tsx
"use client";

import { FileText, Shield, Award, Users, Trash2, RotateCw, Pencil, Clock, Calendar } from "lucide-react"; // ✅ Added Calendar icon
import { StatusPill } from "./StatusPill";
import type { CompanyDocUI } from "@/lib/api/mappers";
import type { DocsTab } from "./DocsTabs";

export type CompanyDoc = CompanyDocUI;

interface Props {
  doc: CompanyDocUI;
  category: DocsTab;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onAction?: (doc: CompanyDocUI, action?: "view" | "edit" | "renew") => void;
  onDelete?: (doc: CompanyDocUI) => void;
}

function fileSizeLabel(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimeAgo(dateString?: string) {
  if (!dateString) return "just now";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// ✅ ১. শুধু তারিখ ফরম্যাট করার ফাংশন (Year Month Date)
function formatDateOnly(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = date.toLocaleString("en-GB", { month: "long" }); 
  const day = date.getDate();

  return `${year} ${month} ${day}`;
}

// ✅ ২. শুধু সময় ফরম্যাট করার ফাংশন (Hour:Minute)
function formatTimeOnly(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function DocCard({
  doc,
  category,
  selected,
  onToggleSelect,
  onAction,
  onDelete,
}: Props) {
  const isExpired = doc.status === "Expired";
  const isExpiring = doc.status === "Expiring Soon";

  let Icon = FileText;
  let iconBg = "bg-[#fdf8ec] text-[#a97400]";
  if (category === "certificates") { Icon = Shield; iconBg = "bg-purple-50 text-purple-600"; }
  if (category === "work-orders") { Icon = Award; iconBg = "bg-[#fdf8ec] text-[#eab308]"; }
  if (category === "team") { Icon = Users; iconBg = "bg-slate-100 text-slate-600"; }
  if (category === "datasheets") { Icon = FileText; iconBg = "bg-sky-50 text-sky-600"; }

  const creatorName = doc.creatorName || "System Admin";
  const initials = creatorName.substring(0, 2).toUpperCase();
  const timeAgo = formatTimeAgo(doc.createdAt);
  
  let rawExpiryDate = doc.validUntil;
  if (!rawExpiryDate && doc.createdAt) {
    const d = new Date(doc.createdAt);
    d.setFullYear(d.getFullYear() + 1);
    rawExpiryDate = d.toISOString();
  }

  // ✅ আলাদা ভেরিয়েবল তৈরি করা হলো
  const formattedExpiryDate = formatDateOnly(rawExpiryDate);
  const formattedExpiryTime = formatTimeOnly(rawExpiryDate);
  
  const countdownColor = isExpired ? "text-rose-600" : isExpiring ? "text-orange-600" : "text-emerald-600";

  return (
    <article
      className={`relative flex flex-col rounded-xl border bg-white p-4 shadow-sm transition ${
        isExpired && category === "certificates"
          ? "border-rose-300 ring-1 ring-rose-100"
          : isExpiring && category === "certificates"
            ? "border-orange-300 ring-1 ring-orange-100"
            : selected
              ? "border-[#a97400] ring-1 ring-[#a97400]"
              : "border-slate-200 hover:shadow-md"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAction?.(doc, "edit"); }}
            className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
              className="rounded p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect?.(doc.id)}
            className="ml-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 min-w-0 flex-1">
        <h3 className="text-[14px] font-bold leading-tight text-slate-900">
          {doc.title}
        </h3>

        {category === "work-orders" && (
          <>
            <p className="mt-1 text-[11px] text-slate-500">
              {doc.issuedOn ? new Date(doc.issuedOn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-"}
              {" · "}
              {doc.totalValue ? `${(doc.totalValue / 100000).toFixed(1)} Lac (৳${doc.totalValue.toLocaleString()})` : "-"}
            </p>
            <div className="mt-2 flex flex-col gap-1.5 items-start">
              <div className="flex gap-1.5">
                <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                  {doc.isGovt ? "Govt." : "Non-Govt."}
                </span>
                {doc.customerType && (
                  <span className="rounded bg-[#e6eff8] px-1.5 py-0.5 text-[9px] font-medium text-[#1e3a5f]">
                    {doc.customerType}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(doc.products || []).map((p: string) => (
                  <span key={p} className="rounded bg-[#fdf8ec] px-1.5 py-0.5 text-[9px] font-medium text-[#a97400]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            {doc.subtitle && <p className="mt-2 line-clamp-2 text-[11px] text-slate-500">{doc.subtitle}</p>}
          </>
        )}

        {category === "team" && (
          <>
            <p className="mt-1 text-[11px] text-slate-500">{doc.subtitle || "Staff"} · {doc.experienceYears || 0} yrs</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(doc.chips || []).map((c: string) => (
                <span key={c} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] text-slate-600">{c}</span>
              ))}
            </div>
            {doc.description && <p className="mt-2 line-clamp-1 text-[11px] text-slate-500">{doc.description}</p>}
          </>
        )}

        {["datasheets", "profiles", "certificates", "legal"].includes(category) && (
          <>
            <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
              {doc.subtitle || doc.description || "No description"}
            </p>
            {category === "legal" && doc.reference && (
              <p className="mt-1 font-mono text-[11px] text-slate-500">{doc.reference}</p>
            )}
            {doc.validity && (
              <p className="mt-1 text-[10px] text-slate-400">{doc.validity}</p>
            )}
          </>
        )}

        {doc.fileName && category !== "work-orders" && category !== "team" && (
          <p className="mt-2 flex items-center gap-1.5 truncate border-t border-slate-100 pt-2 text-[10px] text-slate-400">
            <FileText className="h-3 w-3 shrink-0" />
            <span className="truncate">{doc.fileName}</span>
            {doc.fileSize ? <span className="shrink-0">({fileSizeLabel(doc.fileSize)})</span> : null}
          </p>
        )}
      </div>

      {/* Creator Info */}
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-[8px] font-bold text-white">
          {initials}
        </div>
        <span className="truncate text-[10px] font-medium text-slate-500">
          Added by <span className="font-semibold text-slate-700">{creatorName}</span>
          {timeAgo && <span className="text-slate-400"> · {timeAgo}</span>}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-end justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {category === "work-orders" && (
            <>
              {doc.workType && <span className="rounded bg-[#e6eff8] px-2 py-0.5 text-[10px] font-semibold text-[#1e3a5f]">{doc.workType}</span>}
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                {doc.certReceived ? "Completion cert." : "Work Order"}
              </span>
            </>
          )}
          {category === "team" && (
            <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${doc.isEngineer ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"}`}>
              {doc.isEngineer ? "Engineer / technician" : "Management / other"}
            </span>
          )}
          
          {["legal", "certificates", "profiles"].includes(category) && (
            <div className="flex items-center gap-2">
              <StatusPill status={doc.status} />
              
              {/* ✅ এখানে তারিখ এবং সময় আলাদা করে দেখানো হয়েছে */}
              {formattedExpiryDate && (
                <div className={`flex items-center gap-2 text-[10px] font-semibold ${countdownColor}`}>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formattedExpiryDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formattedExpiryTime}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAction?.(doc); }}
          className={
            doc.action === "Renew" && isExpired
              ? "inline-flex h-7 items-center gap-1 rounded-md bg-[#a97400] px-3 text-[10px] font-semibold text-white shadow-sm hover:bg-[#8f6100]"
              : doc.action === "Renew"
                ? "inline-flex h-7 items-center gap-1 rounded-md border border-amber-300 bg-white px-3 text-[10px] font-semibold text-amber-700 hover:bg-amber-50"
                : "text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:underline"
          }
        >
          {doc.action === "Renew" && <RotateCw className="h-3 w-3" />}
          {doc.action === "Renew" ? "Renew" : "View"}
        </button>
      </div>
    </article>
  );
}