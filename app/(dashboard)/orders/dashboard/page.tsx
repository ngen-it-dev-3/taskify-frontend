// app/orders/dashboard/page.tsx
"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import OrderKpiCards from "@/components/orders/OrderKpiCards";
import OrderQueueList from "@/components/orders/OrderQueueList";
import OrderPipelineTimeline from "@/components/orders/OrderPipelineTimeline";
import AddOrderModal from "@/components/orders/AddOrderModal";
import UpdateStepModal from "@/components/orders/UpdateStepModal";
import {
    INITIAL_ORDERS,
    createInitialSteps,
    type FulfillmentStep,
    type NewOrderInput,
    type OrderItem,
} from "@/types/orders/types";

function getOrderStatusMeta(currentStep: number, totalSteps: number): {
    statusLabel: string;
    statusTone: OrderItem["statusTone"];
} {
    if (currentStep > totalSteps) {
        return { statusLabel: "Completed", statusTone: "emerald" };
    }
    switch (currentStep) {
        case 2:
            return { statusLabel: "Invoice Not Yet Sent", statusTone: "rose" };
        case 3:
            return { statusLabel: "Awaiting Bank Realization", statusTone: "amber" };
        case 4:
            return { statusLabel: "PO Pending to Principal", statusTone: "amber" };
        case 5:
        case 6:
            return { statusLabel: "Principal Billing / Payment", statusTone: "blue" };
        case 7:
            return { statusLabel: "Shipment in Transit", statusTone: "blue" };
        case 8:
            return { statusLabel: "Customs / C&F Clearance", statusTone: "blue" };
        case 9:
            return { statusLabel: "Delivery & Installation", statusTone: "blue" };
        case 10:
            return { statusLabel: "Awaiting Completion Cert.", statusTone: "amber" };
        default:
            return { statusLabel: "Order Placed", statusTone: "blue" };
    }
}

export default function OrderManagementDashboardPage() {
    const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
    const [selectedOrderId, setSelectedOrderId] = useState<string>(
        INITIAL_ORDERS[0]?.id || ""
    );
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeStepToUpdate, setActiveStepToUpdate] = useState<FulfillmentStep | null>(
        null
    );

    const selectedOrder = useMemo(
        () => orders.find((o) => o.id === selectedOrderId) || orders[0],
        [orders, selectedOrderId]
    );

    const handleAddOrder = (input: NewOrderInput) => {
        const steps = createInitialSteps(input.salesOrderRef, input.invoiceRef);
        const nextActiveStep =
            steps.find((s) => s.status === "in_progress")?.stepNumber || steps.length;
        const meta = getOrderStatusMeta(nextActiveStep, steps.length);

        const created: OrderItem = {
            id: `ord-${Date.now()}`,
            client: input.client,
            poRef: input.poRef,
            title: input.title,
            statusLabel: meta.statusLabel,
            statusTone: meta.statusTone,
            currentStep: nextActiveStep,
            totalSteps: steps.length,
            steps,
        };

        setOrders((prev) => [created, ...prev]);
        setSelectedOrderId(created.id);
    };

    const handleConfirmStepUpdate = ({
        dateCompleted,
        documentReference,
    }: {
        dateCompleted: string;
        documentReference: string;
    }) => {
        if (!selectedOrder || !activeStepToUpdate) return;

        const updatedStepNumber = activeStepToUpdate.stepNumber;
        const nextStepNumber = updatedStepNumber + 1;

        setOrders((prev) =>
            prev.map((order) => {
                if (order.id !== selectedOrder.id) return order;

                const nextSteps = order.steps.map((step) => {
                    if (step.stepNumber === updatedStepNumber) {
                        return {
                            ...step,
                            status: "completed" as const,
                            completedDate: dateCompleted,
                            documentReference,
                        };
                    }
                    if (step.stepNumber === nextStepNumber && step.status === "not_started") {
                        return {
                            ...step,
                            status: "in_progress" as const,
                        };
                    }
                    return step;
                });

                const resolvedCurrentStep = Math.min(nextStepNumber, order.totalSteps);
                const allDone = nextSteps.every((s) => s.status === "completed");
                const meta = allDone
                    ? { statusLabel: "Completed", statusTone: "emerald" as const }
                    : getOrderStatusMeta(resolvedCurrentStep, order.totalSteps);

                return {
                    ...order,
                    currentStep: allDone ? order.totalSteps : resolvedCurrentStep,
                    statusLabel: meta.statusLabel,
                    statusTone: meta.statusTone,
                    steps: nextSteps,
                };
            })
        );

        setActiveStepToUpdate(null);
    };

    return (
        <div className="min-h-screen bg-[#fbf9f5] text-[#181612] px-6 py-6">
            <div className="container mx-auto space-y-5">
                {/* Top Page Header + Add Order Button */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a5a14]">
                            ORDER MANAGEMENT
                        </p>
                        <h1 className="text-[30px] leading-tight font-serif font-semibold text-[#181612] mt-0.5">
                            Order Management Dashboard
                        </h1>
                        <p className="text-[12.5px] text-[#6f6960] mt-1">
                            Every order&apos;s full fulfillment pipeline, step by step — from invoice to client completion certificate — for the Commercial Manager to act on next.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#8a5a14] hover:bg-[#734a0f] text-white text-[12px] font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Add Order</span>
                    </button>
                </div>

                {/* 5 KPI Cards */}
                <OrderKpiCards orders={orders} />

                {/* Master-Detail Pipeline Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    <div className="lg:col-span-4">
                        <OrderQueueList
                            orders={orders}
                            selectedOrderId={selectedOrder?.id || ""}
                            onSelectOrder={setSelectedOrderId}
                        />
                    </div>

                    <div className="lg:col-span-8">
                        <OrderPipelineTimeline
                            order={selectedOrder}
                            onOpenUpdateStep={(step) => setActiveStepToUpdate(step)}
                        />
                    </div>
                </div>
            </div>

            {/* Add Order Modal */}
            <AddOrderModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddOrder={handleAddOrder}
            />

            {/* Update Step Modal */}
            <UpdateStepModal
                isOpen={Boolean(activeStepToUpdate)}
                step={activeStepToUpdate}
                onClose={() => setActiveStepToUpdate(null)}
                onConfirm={handleConfirmStepUpdate}
            />
        </div>
    );
}