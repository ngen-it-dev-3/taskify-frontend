// components/tender/security/SecurityTable.tsx
"use client";

import { Loader2, Pencil, Trash2, History, Bell } from "lucide-react";
import type { SecurityType } from "@/lib/api/tender.api";
import type { SecurityRowUI } from "@/lib/api/mappers";

export type { SecurityType };
export type SecurityRow = SecurityRowUI;

interface Props {
  rows: SecurityRow[];
  onDelete?: (id: string) => void | Promise<void>;
  onNotify?: (id: string) => void;
  onEdit?: (row: SecurityRow) => void; // ✅ Changed to pass the full row
  onRecordPayment?: (row: SecurityRow) => void;
  onViewHistory?: (row: SecurityRow) => void;
  deletingId?: string | null;
  notifyingId?: string | null;
}

function EntityBadge({ entity }: { entity: string }) {
  const styles: Record<string, string> = {
    "NGL-26": "bg-[#f1f5f9] text-[#475569]",
    "NG-26": "bg-[#fdf8ec] text-[#a97400]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${styles[entity] || styles["NGL-26"]}`}>
      {entity}
    </span>
  );
}

export function SecurityTable({
  rows,
  onDelete,
  onNotify,
  onEdit,
  onRecordPayment,
  onViewHistory,
  deletingId = null,
  notifyingId = null,
}: Props) {
  return (
    <section className="w-full overflow-x-auto border-t border-slate-100">
      <table className="w-full min-w-[1200px] text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-[#fbfbfb] text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">
            <th className="px-5 py-3 w-[80px]">Entity</th>
            <th className="px-5 py-3">Tender / invoice</th>
            <th className="px-5 py-3 w-[210px]">Contract value</th>
            <th className="px-5 py-3 w-[180px]">Received</th>
            <th className="px-5 py-3 w-[110px]">Balance</th>
            <th className="px-5 py-3 w-[110px]">Payment due</th>
            <th className="px-5 py-3 w-[140px]">Payment status</th>
            <th className="px-5 py-3 w-[100px]">Delivery</th>
            <th className="px-5 py-3 w-[160px] text-right pr-6">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const isDeleting = deletingId === r.id;
            const isNotifying = notifyingId === r.id;
            const rowBusy = isDeleting || isNotifying;

            return (
              <tr key={r.id} className={`transition-colors ${rowBusy ? "bg-slate-50/60" : "hover:bg-slate-50/50"}`}>
                <td className="px-5 py-3.5">
                  <EntityBadge entity={r.entity} />
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-bold text-[#1e293b] text-[11.5px] leading-tight">
                    {r.clientDescription}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {r.invoiceNo} {r.invoiceDate && `· invoiced ${r.invoiceDate}`}
                  </p>
                </td>
                <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-700">
                  ৳{r.amount.toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3.5">
                  <div className="w-[130px] h-[3px] bg-[#e2e8f0] rounded-full mb-1.5 overflow-hidden">
                    <div className="h-full bg-[#10b981]" style={{ width: `${r.receivedPercent}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium">
                    ৳{r.receivedAmount.toLocaleString('en-IN')} received &middot; {r.receivedPercent}%
                  </p>
                </td>
                <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-700">
                  ৳{r.balance.toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-bold text-[#1e293b] text-[11px]">{r.dueDate}</p>
                  {r.dueText && (
                    <p className={`text-[10px] font-medium ${r.isOverdue ? 'text-[#dc2626]' : 'text-[#64748b]'}`}>
                      {r.dueText}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {r.paymentStatus === "Part paid · overdue" && <span className="inline-flex rounded-full bg-[#fef2f2] px-2.5 py-0.5 text-[9px] font-bold text-[#dc2626]">Part paid · overdue</span>}
                  {r.paymentStatus === "Invoiced" && <span className="inline-flex rounded-full bg-[#fffbeb] px-2.5 py-0.5 text-[9px] font-bold text-[#d97706]">Invoiced</span>}
                  {r.paymentStatus === "Paid in full" && <span className="inline-flex rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-[9px] font-bold text-[#059669]">Paid in full</span>}
                  {r.paymentStatus === "Closed" && <span className="inline-flex rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[9px] font-bold text-[#475569]">Closed</span>}
                  {r.paymentStatus === "Not invoiced" && <span className="inline-flex rounded-full bg-[#fef2f2] px-2.5 py-0.5 text-[9px] font-bold text-[#dc2626]">Not invoiced</span>}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold ${r.delivery === "Delivered" ? "bg-[#ecfdf5] text-[#059669]" :
                      r.delivery === "In delivery" ? "bg-[#fef3c7] text-[#d97706]" :
                        "bg-[#f1f5f9] text-[#475569]"
                    }`}>
                    {r.delivery || "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right pr-6">
                  <div className="flex items-center justify-end gap-1.5">
                    {r.balance > 0 ? (
                      <button
                        onClick={() => onRecordPayment?.(r)}
                        className="inline-flex h-[26px] items-center rounded bg-[#a97400] px-3 text-[10px] font-bold text-white hover:bg-[#8f6100]"
                      >
                        Update
                      </button>
                    ) : (
                      <div className="w-[50px]" />
                    )}

                    <button
                      onClick={() => onViewHistory?.(r)}
                      className="inline-flex h-[26px] items-center rounded px-1.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                      History
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-1"></div>

                    {onNotify && (
                      <button
                        type="button"
                        onClick={() => onNotify(r.id)}
                        disabled={rowBusy}
                        className="rounded p-1 text-amber-500 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40"
                        title="Notify Finance"
                      >
                        {isNotifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
                      </button>
                    )}

                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(r)}
                        disabled={rowBusy}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                        title="Edit Record"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}

                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        disabled={rowBusy}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                        title="Delete Record"
                      >
                        {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}