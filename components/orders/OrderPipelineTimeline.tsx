// components/orders/OrderPipelineTimeline.tsx
"use client";

import { Check, Paperclip } from "lucide-react";
import type { FulfillmentStep, OrderItem } from "@/types/orders/types";

interface OrderPipelineTimelineProps {
  order: OrderItem | undefined;
  onOpenUpdateStep: (step: FulfillmentStep) => void;
}

export default function OrderPipelineTimeline({
  order,
  onOpenUpdateStep,
}: OrderPipelineTimelineProps) {
  if (!order) {
    return (
      <div className="bg-white/95 border border-[#e5dfd3] rounded-md p-8 text-center text-sm text-[#6f6960]">
        No order selected. Click <strong>+ Add Order</strong> to create a new order pipeline.
      </div>
    );
  }

  return (
    <div className="bg-white/95 border border-[#e5dfd3] rounded-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#efe9dc]">
        <h2 className="text-[16px] font-semibold text-[#181612] tracking-tight">
          {order.client} — {order.title}
        </h2>
        <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded bg-[#eef2f7] text-[#334155] border border-[#dce3ec]">
          {order.poRef}
        </span>
      </div>

      {/* Steps List */}
      <div className="divide-y divide-[#f2ede2] mt-1">
        {order.steps.map((step) => {
          const isCompleted = step.status === "completed";
          const isInProgress = step.status === "in_progress";

          return (
            <div
              key={step.stepNumber}
              className="py-3.5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Step Circle / Check */}
                {isCompleted ? (
                  <div className="w-6 h-6 rounded-full bg-[#2e7d32] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={2.5} />
                  </div>
                ) : isInProgress ? (
                  <div className="w-6 h-6 rounded-full bg-[#8a5a14] text-white text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                    {step.stepNumber}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white border border-[#d6cfc2] text-[#6f6960] text-[11px] font-medium flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                    {step.stepNumber}
                  </div>
                )}

                {/* Step Details */}
                <div className="min-w-0">
                  <p
                    className={`text-[13px] font-semibold leading-snug ${
                      isCompleted
                        ? "text-[#181612]"
                        : isInProgress
                        ? "text-[#181612]"
                        : "text-[#3d3933]"
                    }`}
                  >
                    {step.title}
                  </p>

                  {isCompleted && (
                    <>
                      <p className="text-[11px] text-[#787167] mt-0.5">
                        Completed {step.completedDate}
                      </p>
                      {step.documentReference && (
                        <p className="text-[11px] text-[#8a5a14] flex items-center gap-1 mt-1">
                          <Paperclip size={11} className="shrink-0" />
                          <span className="truncate">{step.documentReference}</span>
                        </p>
                      )}
                    </>
                  )}

                  {isInProgress && (
                    <p className="text-[11px] text-[#787167] mt-0.5">
                      {step.actionLabel || "In progress — action needed"}
                    </p>
                  )}

                  {!isCompleted && !isInProgress && (
                    <p className="text-[11px] text-[#8c857b] mt-0.5">Not started</p>
                  )}
                </div>
              </div>

              {/* Right Action Button */}
              {isInProgress && (
                <button
                  type="button"
                  onClick={() => onOpenUpdateStep(step)}
                  className="shrink-0 px-3 py-1.5 rounded bg-[#8a5a14] hover:bg-[#734a0f] text-white text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Update
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}