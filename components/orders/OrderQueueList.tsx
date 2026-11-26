// components/orders/OrderQueueList.tsx
"use client";

import { OrderItem } from "@/types/orders/types";

interface OrderQueueListProps {
    orders: OrderItem[];
    selectedOrderId: string;
    onSelectOrder: (orderId: string) => void;
}

const badgeToneMap: Record<OrderItem["statusTone"], string> = {
    amber: "bg-[#f8e7c2] text-[#9a5b13] border-[#ebd098]",
    blue: "bg-[#e3eefc] text-[#25549c] border-[#c5dbf8]",
    rose: "bg-[#fde6e6] text-[#a62b2b] border-[#f6c5c5]",
    emerald: "bg-[#dff3e6] text-[#1f6b3b] border-[#bce3ca]",
};

const statusTextToneMap: Record<OrderItem["statusTone"], string> = {
    amber: "text-[#9a5b13]",
    blue: "text-[#25549c]",
    rose: "text-[#b91c1c]",
    emerald: "text-[#1f6b3b]",
};

export default function OrderQueueList({
    orders,
    selectedOrderId,
    onSelectOrder,
}: OrderQueueListProps) {
    return (
        <div className="bg-[#fffefa] border border-[#e6dfd3] rounded-[6px] overflow-hidden divide-y divide-[#ece6da] shadow-[0_1px_1px_rgba(24,22,18,0.02)]">
            {orders.map((order) => {
                const isSelected = order.id === selectedOrderId;

                return (
                    <button
                        key={order.id}
                        type="button"
                        onClick={() => onSelectOrder(order.id)}
                        className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer block border-l-[3px] ${isSelected
                                ? "bg-[#f3ead6] border-l-[#a6772a]"
                                : "bg-[#fffefa] hover:bg-[#faf7f0] border-l-transparent"
                            }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-[13px] font-semibold text-[#171512] leading-snug">
                                {order.client}
                            </span>
                            <span
                                className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeToneMap[order.statusTone]
                                    }`}
                            >
                                Step {order.currentStep} of {order.totalSteps}
                            </span>
                        </div>

                        <p className="text-[11px] text-[#6e685f] mt-1 truncate">
                            {order.poRef} · {order.title}
                        </p>

                        <p
                            className={`text-[11px] font-semibold mt-1.5 ${statusTextToneMap[order.statusTone]
                                }`}
                        >
                            {order.statusLabel}
                        </p>
                    </button>
                );
            })}
        </div>
    );
}