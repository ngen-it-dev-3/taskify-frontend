// components/CRM/sales-orders/SalesOrderDetail.tsx
'use client';

import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
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

// ⭐ Map stage name → key in `order.stages`
const STAGE_KEY_MAP: Record<SalesOrderStage, string> = {
  'Order Placed': 'orderPlaced',
  Sourcing: 'sourcing',
  Procurement: 'procurement',
  Delivery: 'delivery',
  Invoiced: 'invoiced',
  'Payment Received': 'paymentReceived',
};

export function SalesOrderDetail({ order, onRefresh }: Props) {
  const [working, setWorking] = useState(false);
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
    PAYMENT_STYLES[payStatus] || 'bg-slate-100 text-slate-600 border-slate-200';

  // ⭐ Progress percentage for the connecting line
  const progressPct =
    currentIdx <= 0 ? 0 : (currentIdx / (STAGES.length - 1)) * 100;

  return (
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
            Ordered {fmtDateLong(order.orderedAt)} · Salesman {order.salesman || '—'}
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
          ⭐ STAGE TRACKER — Redesigned + Animated
         ============================================================ */}
      <div className="px-8 py-10 border-b border-[#F0EBE3] bg-gradient-to-b from-white to-[#FDFBF7]">
        <div className="relative max-w-[1100px] mx-auto">
          {/* Track line background */}
          <div className="absolute top-5 left-[4%] right-[4%] h-[3px] rounded-full bg-[#EDE7DC]" />

          {/* ⭐ Progress fill line — animates as stages advance */}
          <div
            className="absolute top-5 left-[4%] h-[3px] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700 ease-out"
            style={{ width: `calc(${progressPct}% * 0.88)` }}
          />

          {/* Stages row */}
          <div className="relative flex items-start justify-between">
            {STAGES.map((stage, i) => {
              const done = i < currentIdx;                     // completed
              const current = i === currentIdx;                 // active
              const future = i > currentIdx;                    // not yet reached
              const clickable = future && !working;             // can advance to

              // Timestamp for this stage (if stamped)
              const stageKey = STAGE_KEY_MAP[stage.key];
              const stageData = order.stages?.[stageKey];
              const stampedAt = stageData?.at;

              return (
                <button
                  key={stage.key}
                  onClick={() => clickable && advance(stage.key)}
                  disabled={!clickable}
                  className={`relative z-10 flex flex-col items-center gap-2 group transition ${
                    clickable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  title={
                    done
                      ? `Completed ${stampedAt ? fmtDate(stampedAt) : ''}`
                      : current
                      ? 'Current stage'
                      : `Advance to ${stage.key}`
                  }
                >
                  {/* ⭐ Circle */}
                  <div
                    className={`
                      relative w-11 h-11 rounded-full flex items-center justify-center
                      text-[12px] font-bold border-2 transition-all duration-300
                      ${
                        done
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
                          : current
                          ? 'bg-white border-[#A06126] text-[#A06126] shadow-[0_0_0_6px_rgba(160,97,38,0.15)]'
                          : clickable
                          ? 'bg-white border-[#D9D2C7] text-slate-400 group-hover:border-[#A06126] group-hover:text-[#A06126] group-hover:scale-110 group-hover:shadow-[0_0_0_6px_rgba(160,97,38,0.12)]'
                          : 'bg-white border-[#E5DFD3] text-slate-300'
                      }
                    `}
                  >
                    {/* ⭐ Pulsing ring on current stage */}
                    {current && (
                      <span className="absolute inset-0 rounded-full bg-[#A06126] opacity-20 animate-ping" />
                    )}

                    {/* ⭐ Content: spinner / check / number */}
                    {working && clickable ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : done ? (
                      <Check className="w-5 h-5 animate-in zoom-in duration-300" />
                    ) : (
                      i + 1
                    )}
                  </div>

                  {/* ⭐ Label */}
                  <span
                    className={`text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                      done
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

                  {/* ⭐ Timestamp under completed stages */}
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

        {/* Progress summary */}
        <div className="mt-6 text-center text-[10.5px] text-slate-500">
          <span className="font-semibold text-slate-700">
            {currentIdx + 1} of {STAGES.length}
          </span>{' '}
          stages complete ·{' '}
          <span className="text-[#A06126] font-semibold">
            {order.stage}
          </span>
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
        <InfoBlock
          title="Procurement"
          rows={[
            ['Principal', order.principal || '—'],
            ['Status', order.procurementStatus || 'Not Sent'],
          ]}
        />
        <InfoBlock
          title="Logistics & Customs"
          rows={[
            ['Mode', order.logisticsMode || '—'],
            ['Customs', order.customs || 'Not Started'],
          ]}
        />
        <InfoBlock
          title="Payment"
          rows={[
            ['Client Payment', payStatus],
            ['Principal Payment', order.principalPayment?.status || 'Not Required'],
          ]}
        />
      </div>
    </div>
  );
}

function InfoBlock({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-lg border border-[#EBE6DF] bg-white p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h3>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 text-[11px]"
          >
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-800 truncate">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}