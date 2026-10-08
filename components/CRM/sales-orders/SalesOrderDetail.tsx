// components/CRM/sales-orders/SalesOrderDetail.tsx
'use client';

import React, { useState } from 'react';
import {
  Check,
  Loader2,
  Send,
  ListChecks,
  FileText,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  SalesOrderApi,
  type SalesOrder,
  type SalesOrderStage,
} from '@/services/salesOrder.service';
import { PAYMENT_STYLES, fmtFull, fmtDateLong, fmtDate } from './constants';

interface Props {
  order: SalesOrder;
  onRefresh: () => Promise<void> | void;
}

const STAGES: { key: SalesOrderStage; short: string }[] = [
  { key: 'Order Placed', short: 'Placed' },
  { key: 'Sourcing', short: 'Sourcing' },
  { key: 'Procurement', short: 'Procurement' },
  { key: 'Delivery', short: 'Delivery' },
  { key: 'Invoiced', short: 'Invoiced' },
  { key: 'Payment Received', short: 'Paid' },
];

const STAGE_KEY_MAP: Record<SalesOrderStage, string> = {
  'Order Placed': 'orderPlaced',
  Sourcing: 'sourcing',
  Procurement: 'procurement',
  Delivery: 'delivery',
  Invoiced: 'invoiced',
  'Payment Received': 'paymentReceived',
};

// ============================================================
// CHECKLIST — matches the 6 fixed schema fields
// ============================================================
const DEFAULT_CHECKLIST = [
  {
    id: 'cnfAgent',
    label: 'C&F Agent assigned',
    required: true,
    doneValue: 'Assigned',
    default: 'Not assigned',
  },
  {
    id: 'commercialInvoice',
    label: 'Commercial invoice prepared',
    required: true,
    doneValue: 'Ready',
    default: 'Pending',
  },
  {
    id: 'packingList',
    label: 'Packing list prepared',
    required: true,
    doneValue: 'Ready',
    default: 'Pending',
  },
  {
    id: 'billOfLading',
    label: 'Bill of Lading / AWB received',
    required: false,
    doneValue: 'Received',
    default: 'Pending',
  },
  {
    id: 'customsDeclaration',
    label: 'Customs declaration filed',
    required: true,
    doneValue: 'Filed',
    default: 'Not started',
  },
  {
    id: 'dutyTaxPayment',
    label: 'Duty & tax paid',
    required: true,
    doneValue: 'Paid',
    default: 'Not started',
  },
] as const;

// ============================================================
// MAIN COMPONENT
// ============================================================
export function SalesOrderDetail({ order, onRefresh }: Props) {
  const [working, setWorking] = useState(false);
  const [procurementModalOpen, setProcurementModalOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [viewFileModalOpen, setViewFileModalOpen] = useState(false);

  const currentIdx = STAGES.findIndex((s) => s.key === order.stage);

  const advance = async (stage: SalesOrderStage) => {
    if (stage === order.stage) return;

    try {
      setWorking(true);
      await SalesOrderApi.advanceStage(order.id, stage);
      toast.success(`Moved to ${stage}`);
      await onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to advance');
    } finally {
      setWorking(false);
    }
  };

  const payStatus = order.clientPayment?.status || 'Not Invoiced';
  const payStyle =
    PAYMENT_STYLES[payStatus] ||
    'bg-slate-100 text-slate-600 border-slate-200';

  const progressPct =
    currentIdx <= 0 ? 0 : (currentIdx / (STAGES.length - 1)) * 100;

  // ---- Determine which action buttons to show ----
  const procurementStatus = order.procurementStatus || 'Not Sent';
  const principalMissing = !order.principal || !order.principal.trim();
  const procurementNotSent =
    procurementStatus === 'Not Sent' || principalMissing;

  return (
    <>
      <div className="rounded-xl border border-[#EBE6DF] bg-white overflow-hidden shadow-xs">
        {/* ============================================================
            HEADER
           ============================================================ */}
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5 border-b border-[#F0EBE3]">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#A06126] mb-1">
              PO {order.poRef}
            </div>
            <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
              {order.client?.company} — {order.product}
            </h2>
            <div className="mt-1 text-[11px] text-slate-500">
              Ordered {fmtDateLong(order.orderedAt)} · Salesman{' '}
              {order.salesman || '—'}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold border ${payStyle}`}
            >
              {payStatus}
            </span>
          </div>
        </div>

        {/* ============================================================
            STAGE TRACKER
           ============================================================ */}
        <div className="px-8 py-10 border-b border-[#F0EBE3] bg-gradient-to-b from-white to-[#FDFBF7]">
          <div className="relative max-w-[1100px] mx-auto">
            <div className="absolute top-5 left-[4%] right-[4%] h-[3px] rounded-full bg-[#EDE7DC]" />
            <div
              className="absolute top-5 left-[4%] h-[3px] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700 ease-out"
              style={{ width: `calc(${progressPct}% * 0.92)` }}
            />

            <div className="relative flex items-start justify-between">
              {STAGES.map((stage, i) => {
                const done = i < currentIdx;
                const current = i === currentIdx;
                const future = i > currentIdx;
                const clickable = future && !working;

                const stageKey = STAGE_KEY_MAP[stage.key];
                const stageData = (order.stages as any)?.[stageKey];
                const stampedAt = stageData?.at;

                return (
                  <button
                    key={stage.key}
                    onClick={() => clickable && advance(stage.key)}
                    disabled={!clickable}
                    className={`relative z-10 flex flex-col items-center gap-2 group transition ${clickable ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    title={
                      done
                        ? `Completed ${stampedAt ? fmtDate(stampedAt) : ''}`
                        : current
                          ? 'Current stage'
                          : `Advance to ${stage.key}`
                    }
                  >
                    <div
                      className={`
                        relative w-11 h-11 rounded-full flex items-center justify-center
                        text-[12px] font-bold border-2 transition-all duration-300
                        ${done
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
                          : current
                            ? 'bg-white border-[#A06126] text-[#A06126] shadow-[0_0_0_6px_rgba(160,97,38,0.15)]'
                            : clickable
                              ? 'bg-white border-[#D9D2C7] text-slate-400 group-hover:border-[#A06126] group-hover:text-[#A06126] group-hover:scale-110 group-hover:shadow-[0_0_0_6px_rgba(160,97,38,0.12)]'
                              : 'bg-white border-[#E5DFD3] text-slate-300'
                        }
                      `}
                    >
                      {current && (
                        <span className="absolute inset-0 rounded-full bg-[#A06126] opacity-20 animate-ping" />
                      )}
                      {working && clickable ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : done ? (
                        <Check className="w-5 h-5 animate-in zoom-in duration-300" />
                      ) : (
                        i + 1
                      )}
                    </div>

                    <span
                      className={`text-[10.5px] font-semibold whitespace-nowrap transition-colors ${done
                        ? 'text-emerald-700'
                        : current
                          ? 'text-[#A06126]'
                          : clickable
                            ? 'text-slate-500 group-hover:text-[#A06126]'
                            : 'text-slate-400'
                        }`}
                    >
                      {stage.short}
                    </span>

                    {stampedAt && (
                      <span className="text-[9px] text-slate-400 font-mono -mt-1">
                        {fmtDate(stampedAt)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 text-center text-[10.5px] text-slate-500">
            <span className="font-semibold text-slate-700">
              {currentIdx + 1} of {STAGES.length}
            </span>{' '}
            stages complete ·{' '}
            <span className="text-[#A06126] font-semibold">{order.stage}</span>
          </div>
        </div>

        {/* ============================================================
            INFO BLOCKS
           ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <InfoBlock
            title="Order Info"
            rows={[
              ['Product', order.product || '—'],
              ['Sales Value', fmtFull(order.salesValue)],
              ['Salesman', order.salesman || '—'],
            ]}
          />

          {/* ---- Procurement card ---- */}
          <InfoBlock
            title="Procurement"
            rows={[
              [
                'Principal',
                order.principal?.trim() ? (
                  order.principal
                ) : (
                  <span className="text-rose-500 italic font-normal">
                    Not set
                  </span>
                ),
              ],
              ['Status', order.procurementStatus || 'Not Sent'],
            ]}
            actions={
              (() => {
                const hasRecipients =
                  Array.isArray(order.procurementRecipients) &&
                  order.procurementRecipients.length > 0;
                const wasSent = !!order.procurementFileSentAt || hasRecipients;

                // State 1 — never sent → Prepare & Send
                if (procurementNotSent && !wasSent) {
                  return (
                    <button
                      type="button"
                      onClick={() => setProcurementModalOpen(true)}
                      className="inline-flex w-1/2 items-center justify-center gap-1 rounded-md border border-[#A06126] bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-[#A06126] hover:bg-[#FFF7E8] transition"
                    >
                      <Send className="w-3 h-3" />
                      Prepare &amp; Send
                      <span className="text-[10px]">→</span>
                    </button>
                  );
                }

                // State 2 — sent with recipients → View & Resend
                if (wasSent && hasRecipients) {
                  return (
                    <button
                      type="button"
                      onClick={() => setViewFileModalOpen(true)}
                      className="inline-flex w-1/2 items-center justify-center gap-1 rounded-md border border-[#A06126] bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-[#A06126] hover:bg-[#FFF7E8] transition"
                    >
                      <Send className="w-3 h-3" />
                      View &amp; Resend
                      <span className="text-[10px]">→</span>
                    </button>
                  );
                }

                // State 3 — status set but no recipients (edge case) → View
                return (
                  <button
                    type="button"
                    onClick={() => setViewFileModalOpen(true)}
                    className="inline-flex w-1/2 items-center justify-center gap-1 rounded-md border border-[#E2DBD1] bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FileText className="w-3 h-3" />
                    View
                  </button>
                );
              })()
            }
          />

          {/* ---- Logistics card ---- */}
          <InfoBlock
            title="Logistics & Customs"
            rows={[
              [
                'Mode',
                order.logisticsMode?.trim() ? (
                  order.logisticsMode
                ) : (
                  <span className="text-rose-500 italic font-normal">
                    Not set
                  </span>
                ),
              ],
              ['Customs', order.customs || 'Not Started'],
            ]}
            actions={
              <button
                type="button"
                onClick={() => setChecklistModalOpen(true)}
                className="inline-flex w-1/2 items-center justify-center gap-1 rounded-md border border-[#E2DBD1] bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <ListChecks className="w-3 h-3" />
                View Checklist
                <span className="text-[10px]">→</span>
              </button>
            }
          />

          {/* ---- Payment card ---- */}
          <InfoBlock
            title="Payment"
            rows={[
              ['Client Payment', payStatus],
              [
                'Principal Payment',
                order.principalPayment?.status || 'Not Required',
              ],
            ]}
          />
        </div>
      </div>

      {/* ============================================================
          MODALS
         ============================================================ */}

      {procurementModalOpen && (
        <ProcurementFileModal
          order={order}
          onClose={() => setProcurementModalOpen(false)}
          onSaved={async () => {
            setProcurementModalOpen(false);
            await onRefresh();
          }}
        />
      )}

      {checklistModalOpen && (
        <ChecklistModal
          order={order}
          onClose={() => setChecklistModalOpen(false)}
          onSaved={async () => {
            setChecklistModalOpen(false);
            await onRefresh();
          }}
        />
      )}

      {viewFileModalOpen && (
        <ViewProcurementModal
          order={order}
          onClose={() => setViewFileModalOpen(false)}
        />
      )}
    </>
  );
}

/* =========================================================
   INFO BLOCK — now accepts React.ReactNode for values
   ========================================================= */
function InfoBlock({
  title,
  rows,
  actions,
}: {
  title: string;
  rows: [string, React.ReactNode][];
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#EBE6DF] bg-white p-4 flex flex-col">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h3>
      <div className="space-y-2 flex-1">
        {rows.map(([label, value], i) => (
          <div
            key={`${label}-${i}`}
            className="flex items-center justify-between gap-3 text-[11px]"
          >
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-800 truncate text-right">
              {value}
            </span>
          </div>
        ))}
      </div>
      {actions && (
        <div className="mt-3 pt-3 border-t border-[#F0EBE3]">{actions}</div>
      )}
    </div>
  );
}

/* =========================================================
   PROCUREMENT FILE MODAL — Prepare & Send
   ========================================================= */
function ProcurementFileModal({
  order,
  onClose,
  onSaved,
}: {
  order: SalesOrder;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [principal, setPrincipal] = useState(order.principal || '');
  const [status, setStatus] = useState(
    order.procurementStatus && order.procurementStatus !== 'Not Sent'
      ? order.procurementStatus
      : 'Sent'
  );
  const [notes, setNotes] = useState(order.notes || '');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = (order as any).expectedDeliveryDate;
    if (!d) return '';
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      return dt.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  });
  const [logisticsMode, setLogisticsMode] = useState(
    (order as any).logisticsMode || ''
  );
  const [customs, setCustoms] = useState(
    (order as any).customs || 'Not Started'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!principal.trim()) {
      toast.error('Principal is required');
      return;
    }
    try {
      setSaving(true);
      await SalesOrderApi.update(order.id, {
        principal: principal.trim(),
        procurementStatus: status,
        notes,
        expectedDeliveryDate: deliveryDate || undefined,
        logisticsMode: logisticsMode.trim() || undefined,
        customs: customs || undefined,
      } as any);
      toast.success('Procurement file sent');
      await onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Procurement File" width="md">
      <div className="space-y-4">
        {/* Principal */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Principal <span className="text-rose-500">*</span>
          </label>
          <input
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="e.g. Radmin, Adobe, Acronis"
            className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11.5px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
          />
        </div>

        {/* Status + Delivery Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11.5px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
            >
              <option value="Sent">Sent</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Delivered">Delivered</option>
              <option value="Digital — No PO Required">
                Digital — No PO Required
              </option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11.5px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
            />
          </div>
        </div>

        {/* Logistics fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Logistics Mode
            </label>
            <select
              value={logisticsMode}
              onChange={(e) => setLogisticsMode(e.target.value)}
              className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11.5px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
            >
              <option value="">Select mode…</option>
              <option value="Air">Air</option>
              <option value="Sea">Sea</option>
              <option value="Road">Road</option>
              <option value="Digital">Digital</option>
              <option value="Courier">Courier</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Customs
            </label>
            <select
              value={customs}
              onChange={(e) => setCustoms(e.target.value)}
              className="w-full rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11.5px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Cleared">Cleared</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Confirmed by principal — 19 Aug 2026"
            className="w-full resize-none rounded-lg border border-[#E2DBD1] bg-white px-3 py-2 text-[11.5px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg border border-[#E2DBD1] bg-white px-4 py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#A06126] px-4 py-2 text-[11.5px] font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          {saving ? 'Sending…' : 'Send File'}
        </button>
      </div>
    </ModalShell>
  );
}

/* =========================================================
   CHECKLIST MODAL — View Checklist
   ========================================================= */
function ChecklistModal({
  order,
  onClose,
  onSaved,
}: {
  order: SalesOrder;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  // Pre-populate from order.logisticsChecklist
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const existing = (order.logisticsChecklist || {}) as Record<
      string,
      string
    >;
    for (const item of DEFAULT_CHECKLIST) {
      const val = existing[item.id];
      initial[item.id] = !!val && val === item.doneValue;
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Record<string, string> = {};
      for (const item of DEFAULT_CHECKLIST) {
        payload[item.id] = checked[item.id] ? item.doneValue : item.default;
      }

      await SalesOrderApi.update(order.id, {
        logisticsChecklist: payload,
      } as any);
      toast.success('Checklist saved');
      await onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  const doneCount = Object.values(checked).filter(Boolean).length;
  const total = DEFAULT_CHECKLIST.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <ModalShell
      onClose={onClose}
      title="Logistics & Customs Checklist"
      width="md"
    >
      {/* Progress */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10.5px] font-semibold text-slate-600 whitespace-nowrap">
          {doneCount}/{total} · {pct}%
        </span>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {DEFAULT_CHECKLIST.map((item) => {
          const on = !!checked[item.id];
          return (
            <label
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition ${on
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-[#E2DBD1] bg-white hover:bg-slate-50'
                }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(item.id)}
                className="w-4 h-4 rounded border-slate-300 accent-emerald-600"
              />
              <span
                className={`flex-1 text-[11.5px] ${on ? 'text-emerald-800 font-semibold' : 'text-slate-700'
                  }`}
              >
                {item.label}
              </span>
              {on && (
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 shrink-0">
                  {item.doneValue}
                </span>
              )}
              {item.required && !on && (
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-rose-600 shrink-0">
                  Required
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg border border-[#E2DBD1] bg-white px-4 py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#A06126] px-4 py-2 text-[11.5px] font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          {saving ? 'Saving…' : 'Save Checklist'}
        </button>
      </div>
    </ModalShell>
  );
}

/* =========================================================
   VIEW PROCUREMENT MODAL — read-only
   ========================================================= */
function ViewProcurementModal({
  order,
  onClose,
  onResend,
}: {
  order: SalesOrder;
  onClose: () => void;
  onResend?: () => Promise<void> | void;
}) {
  const [resending, setResending] = useState(false);

  const sentAt = (order as any).procurementFileSentAt;
  const recipients: string[] = (order as any).procurementRecipients || [];
  const isAwaitingConfirmation =
    order.procurementStatus === 'Sent' ||
    order.procurementStatus === 'Pending';

  const handleResend = async () => {
    if (!onResend) {
      toast('Resend is not available right now.', { icon: 'ℹ️' });
      return;
    }
    try {
      setResending(true);
      await onResend();
      toast.success('Reminder sent to recipients');
    } catch (e: any) {
      toast.error(e.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <ModalShell
      onClose={onClose}
      title={`Procurement File — ${order.product || 'Order'}`}
      width="md"
    >
      <div className="space-y-4">
        {/* ---- Order sub-header ---- */}
        <div className="text-[10.5px] text-slate-500 -mt-2">
          PO {order.poRef}
          {order.client?.company ? ` · ${order.client.company}` : ''}
        </div>

        {/* ---- FILE CONTENTS ---- */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            File Contents
          </div>

          <div className="divide-y divide-[#F0EBE3] border-t border-b border-[#F0EBE3]">
            <Row
              label="Product / Spec"
              value={order.productSpec || order.product || '—'}
            />
            <Row
              label="Sent"
              value={sentAt ? fmtDateLong(sentAt) : 'Not sent yet'}
            />
            <Row
              label="Awaiting"
              value={
                isAwaitingConfirmation
                  ? 'Principal order confirmation'
                  : order.procurementStatus || 'Not Sent'
              }
            />
          </div>
        </div>

        {/* ---- SENT TO (recipients) ---- */}
        {recipients.length > 0 && (
          <div className="rounded-lg border border-dashed border-[#E5DFD3] bg-[#FFFBF3] p-4">
            <div className="flex items-start gap-2 mb-2">
              <Send className="w-3.5 h-3.5 text-[#A06126] mt-0.5 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A06126]">
                Sent To
              </span>
            </div>
            <div className="text-[11.5px] text-slate-700 leading-relaxed mb-3">
              {recipients.join(' · ')}
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !onResend}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#A06126] px-4 py-2 text-[11.5px] font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60 transition"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {resending ? 'Sending…' : 'Resend Reminder'}
            </button>
          </div>
        )}

        {/* ---- Extra details (mode, customs, notes) ---- */}
        {(order as any).logisticsMode && (
          <Row label="Logistics Mode" value={(order as any).logisticsMode} />
        )}
        {(order as any).customs && (
          <Row label="Customs" value={(order as any).customs} />
        )}
        {order.notes && <Row label="Notes" value={order.notes} />}
      </div>

      <div className="mt-5 flex items-center justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[#E2DBD1] bg-white px-4 py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}

/* =========================================================
   SHARED MODAL SHELL
   ========================================================= */
function ModalShell({
  onClose,
  title,
  children,
  width = 'md',
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}) {
  const widthClass =
    width === 'sm' ? 'max-w-md' : width === 'lg' ? 'max-w-3xl' : 'max-w-xl';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} rounded-2xl bg-white p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="font-serif text-lg font-bold text-[#0F2D4A]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
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
    <div className="flex items-center justify-between gap-3 text-[11.5px] py-2 border-b border-[#F0EBE3] last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 text-right truncate">
        {value}
      </span>
    </div>
  );
}