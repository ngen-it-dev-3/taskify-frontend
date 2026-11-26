// components/orders/OrderKpiCards.tsx
"use client";

import type { OrderItem } from "@/types/orders/types";

interface OrderKpiCardsProps {
  orders: OrderItem[];
}

export default function OrderKpiCards({ orders }: OrderKpiCardsProps) {
  const activeOrdersCount = orders.length;
  const awaitingBankCount = orders.filter((o) => o.currentStep === 3).length;
  const poPendingCount = orders.filter((o) => o.currentStep === 4).length;
  const inTransitCount = orders.filter(
    (o) => o.currentStep === 7 || o.currentStep === 8
  ).length;
  const awaitingCertCount = orders.filter((o) => o.currentStep === 10).length;

  const cards = [
    {
      label: "Active Orders",
      value: activeOrdersCount,
      subtext: "In fulfillment pipeline",
      subtextClass: "text-[#6e685f]",
    },
    {
      label: "Awaiting Bank Realization",
      value: awaitingBankCount,
      subtext: "Client payment pending",
      subtextClass: "text-[#c25915]",
    },
    {
      label: "PO Pending to Principal",
      value: poPendingCount,
      subtext: "Not yet issued",
      subtextClass: "text-[#c25915]",
    },
    {
      label: "In Transit / Customs",
      value: inTransitCount,
      subtext: "Shipment or clearance",
      subtextClass: "text-[#6e685f]",
    },
    {
      label: "Awaiting Completion Cert.",
      value: awaitingCertCount,
      subtext: "Delivered, cert pending",
      subtextClass: "text-[#6e685f]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[#fff] border border-[#e6dfd3] rounded-xl px-4 py-3.5 shadow-[0_1px_1px_rgba(24,22,18,0.02)]"
        >
          <p className="text-[11.5px] font-medium leading-[1.35] text-[#575148]">
            {card.label}
          </p>
          <p className="text-[20px] font-bold leading-[1.2] tracking-[-0.02em] text-[#171512] mt-1.5 tabular-nums">
            {card.value}
          </p>
          <p className={`text-[10.5px] font-normal leading-[1.35] mt-1 ${card.subtextClass}`}>
            {card.subtext}
          </p>
        </div>
      ))}
    </div>
  );
}