// app/orders/purchase-orders/page.tsx
"use client";

import { useMemo, useState } from "react";
import PoFilterBar from "@/components/orders/purchase-orders/PoFilterBar";
import PurchaseOrdersTable from "@/components/orders/purchase-orders/PurchaseOrdersTable";
import OrderDetailModal from "@/components/orders/purchase-orders/OrderDetailModal";
import {
    INITIAL_PURCHASE_ORDERS,
    type MonthFilterKey,
    type PurchaseOrderRecord,
} from "@/types/orders/purchase-orders/types";

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrderRecord[]>(INITIAL_PURCHASE_ORDERS);
    const [activeMonth, setActiveMonth] = useState<MonthFilterKey>("all");
    const [showArchive, setShowArchive] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<"view" | "prepare">("view");

    const archivedCount = useMemo(
        () => orders.filter((o) => o.archived).length,
        [orders]
    );

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const isArchived = Boolean(order.archived);
            if (showArchive !== isArchived) return false;

            if (!showArchive && activeMonth !== "all" && order.monthKey !== activeMonth) {
                return false;
            }

            if (fromDate && order.poDateIso < fromDate) return false;
            if (toDate && order.poDateIso > toDate) return false;

            return true;
        });
    }, [orders, showArchive, activeMonth, fromDate, toDate]);

    const activeModalOrder = useMemo(
        () => orders.find((o) => o.id === selectedOrderId) || null,
        [orders, selectedOrderId]
    );

    const handleClearFilters = () => {
        setFromDate("");
        setToDate("");
        setActiveMonth("all");
    };

    const handlePrimaryAction = (order: PurchaseOrderRecord) => {
        setSelectedOrderId(order.id);
        setModalMode(order.primaryAction === "View" ? "view" : "prepare");
    };

    const handleViewOrder = (order: PurchaseOrderRecord) => {
        setSelectedOrderId(order.id);
        setModalMode("view");
    };

    const handleToggleArchive = (id: string) => {
        setOrders((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, archived: !item.archived } : item
            )
        );
    };

    const handleUpdateOrder = (updated: PurchaseOrderRecord) => {
        setOrders((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
        );
    };

    return (
        <div className="po-page-container">
            <div className="po-page-inner container mx-auto">
                {/* Page Header */}
                <header className="po-page-header">
                    <p className="po-eyebrow">ORDER MANAGEMENT</p>
                    <h1 className="po-title">Purchase Orders</h1>
                    <p className="po-subtitle">
                        Every purchase order out to a principal — procurement, payment,
                        shipment, and delivery status in one place.
                    </p>
                </header>

                {/* Filter Tabs + From/To Date Card */}
                <PoFilterBar
                    activeMonth={activeMonth}
                    onSelectMonth={setActiveMonth}
                    showArchive={showArchive}
                    onToggleArchive={() => setShowArchive((prev) => !prev)}
                    archivedCount={archivedCount}
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                    onClearFilters={handleClearFilters}
                />

                {/* Orders Table */}
                <div className="po-table-spacing">
                    <PurchaseOrdersTable
                        orders={filteredOrders}
                        onPrimaryAction={handlePrimaryAction}
                        onViewOrder={handleViewOrder}
                        onToggleArchive={handleToggleArchive}
                    />
                </div>
            </div>

            {/* Detail / Procurement Action Modal */}
            <OrderDetailModal
                order={activeModalOrder}
                mode={modalMode}
                onClose={() => setSelectedOrderId(null)}
                onUpdateOrder={handleUpdateOrder}
            />

            <style jsx>{`
        .po-page-container {
          min-height: 100vh;
          background: #faf8f4;
          color: #1c1917;
          padding: 24px 28px 40px;
        }

        .po-page-header {
          margin-bottom: 18px;
        }

        .po-eyebrow {
          margin: 0;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8c621e;
        }

        .po-title {
          margin: 4px 0 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 30px;
          font-weight: 700;
          line-height: 1.2;
          color: #1c1917;
        }

        .po-subtitle {
          margin: 6px 0 0;
          font-size: 13px;
          line-height: 1.45;
          color: #6b645b;
        }

        .po-table-spacing {
          margin-top: 16px;
        }
      `}</style>
        </div>
    );
}