// components/orders/purchase-orders/PurchaseOrdersTable.tsx
"use client";

import { PurchaseOrderRecord } from "@/types/orders/purchase-orders/types";


interface PurchaseOrdersTableProps {
  orders: PurchaseOrderRecord[];
  onPrimaryAction: (order: PurchaseOrderRecord) => void;
  onViewOrder: (order: PurchaseOrderRecord) => void;
  onToggleArchive: (id: string) => void;
}

function getProcurementTone(status: PurchaseOrderRecord["procurementStatus"]) {
  if (status === "Confirmed") return "pill-green";
  if (status === "Sent — Awaiting Confirmation") return "pill-amber";
  return "pill-rose";
}

function getPaymentTone(status: PurchaseOrderRecord["paymentStatus"]) {
  if (status === "Paid" || status === "Advance Paid") return "pill-green";
  return "pill-rose";
}

function getShipmentTone(status: PurchaseOrderRecord["shipmentStatus"]) {
  if (status === "Shipped") return "pill-amber";
  if (status === "N/A — Digital") return "pill-slate";
  return "pill-rose";
}

function getDeliveryTone(status: PurchaseOrderRecord["deliveryStatus"]) {
  if (status === "Delivered") return "pill-green";
  if (status === "In Transit") return "pill-amber";
  return "pill-rose";
}

function formatPoRefLines(poRef: string) {
  // Matches NG-SBPLC/SW/260118 wrapping cleanly across two lines when needed
  if (poRef === "NG-SBPLC/SW/260118") {
    return (
      <>
        NG-
        <br />
        SBPLC/SW/260118
      </>
    );
  }
  return poRef;
}

function formatDateLines(dateStr: string) {
  const parts = dateStr.split(" ");
  if (parts.length === 3) {
    return (
      <>
        {parts[0]} {parts[1]}
        <br />
        {parts[2]}
      </>
    );
  }
  return dateStr;
}

export default function PurchaseOrdersTable({
  orders,
  onPrimaryAction,
  onViewOrder,
  onToggleArchive,
}: PurchaseOrdersTableProps) {
  return (
    <div className="po-table-card">
      <div className="po-table-scroll">
        <table className="po-table">
          <thead>
            <tr>
              <th>PO REF</th>
              <th>CLIENT</th>
              <th>PRODUCT</th>
              <th>PRINCIPAL</th>
              <th>QTY</th>
              <th>PO DATE</th>
              <th>PROCUREMENT STATUS</th>
              <th>
                PAYMENT
                <br />
                STATUS
              </th>
              <th>
                SHIPMENT
                <br />
                STATUS
              </th>
              <th>
                DELIVERY
                <br />
                STATUS
              </th>
              <th aria-label="Actions"></th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="po-empty-cell">
                  No purchase orders match the selected month or date filter.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="po-ref-cell">{formatPoRefLines(order.poRef)}</td>
                  <td className="po-client-cell">{order.client}</td>
                  <td className="po-product-cell">{order.product}</td>
                  <td className="po-principal-cell">{order.principal}</td>
                  <td className="po-qty-cell tabular">{order.qty}</td>
                  <td className="po-date-cell tabular">
                    {formatDateLines(order.poDateDisplay)}
                  </td>

                  <td>
                    <span
                      className={`status-pill ${getProcurementTone(
                        order.procurementStatus
                      )}`}
                    >
                      {order.procurementStatus === "Sent — Awaiting Confirmation" ? (
                        <>
                          Sent — Awaiting
                          <br />
                          Confirmation
                        </>
                      ) : (
                        order.procurementStatus
                      )}
                    </span>
                  </td>

                  <td>
                    <span className={`status-pill ${getPaymentTone(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-pill ${getShipmentTone(order.shipmentStatus)}`}
                    >
                      {order.shipmentStatus}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-pill ${getDeliveryTone(order.deliveryStatus)}`}
                    >
                      {order.deliveryStatus}
                    </span>
                  </td>

                  <td className="po-actions-cell">
                    <div className="po-action-group">
                      <button
                        type="button"
                        onClick={() => onPrimaryAction(order)}
                        className="po-primary-btn"
                      >
                        {order.primaryAction} →
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewOrder(order)}
                        className="po-link-btn"
                      >
                        View Order →
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleArchive(order.id)}
                        className="po-link-btn"
                      >
                        {order.archived ? "Restore →" : "Archive →"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .po-table-card {
          background: #fffefa;
          border: 1px solid #e6e0d5;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(24, 22, 18, 0.02);
        }

        .po-table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .po-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1120px;
          text-align: left;
        }

        .po-table thead tr {
          border-bottom: 1px solid #ece6da;
          background: #fffefa;
        }

        .po-table th {
          padding: 13px 12px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #6b645b;
          vertical-align: bottom;
          line-height: 1.3;
        }

        .po-table th:first-child {
          padding-left: 18px;
        }

        .po-table th:last-child {
          padding-right: 18px;
        }

        .po-table tbody tr {
          border-bottom: 1px solid #f0ebe1;
          transition: background 0.14s ease;
        }

        .po-table tbody tr:last-child {
          border-bottom: none;
        }

        .po-table tbody tr:hover {
          background: #fcfaf5;
        }

        .po-table td {
          padding: 16px 12px;
          font-size: 12.5px;
          color: #2f2a24;
          vertical-align: middle;
          line-height: 1.4;
        }

        .po-table td:first-child {
          padding-left: 18px;
        }

        .po-table td:last-child {
          padding-right: 18px;
        }

        .po-ref-cell {
          font-size: 12px !important;
          color: #3d3832 !important;
          white-space: nowrap;
        }

        .po-client-cell {
          font-weight: 600;
          color: #1c1917 !important;
          max-width: 130px;
        }

        .po-product-cell {
          color: #2f2a24;
          max-width: 215px;
        }

        .po-principal-cell {
          color: #3d3832;
          max-width: 135px;
        }

        .po-qty-cell {
          color: #2f2a24;
        }

        .po-date-cell {
          color: #2f2a24;
          white-space: nowrap;
        }

        .tabular {
          font-variant-numeric: tabular-nums;
        }

        .status-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.3;
          white-space: nowrap;
        }

        .pill-rose {
          background: #fdecec;
          color: #c63a3a;
        }

        .pill-amber {
          background: #fdf1e2;
          color: #c5781d;
        }

        .pill-green {
          background: #e7f6ec;
          color: #267a45;
        }

        .pill-slate {
          background: #eef1f5;
          color: #475569;
        }

        .po-actions-cell {
          white-space: nowrap;
        }

        .po-action-group {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .po-primary-btn {
          background: #ffffff;
          color: #1c1917;
          border: 1px solid #dcd6ca;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .po-primary-btn:hover {
          background: #f5f1e7;
          border-color: #c8c0b0;
        }

        .po-link-btn {
          background: transparent;
          border: none;
          padding: 4px 2px;
          font-size: 11.5px;
          font-weight: 500;
          color: #6b645b;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .po-link-btn:hover {
          color: #1c1917;
        }

        .po-empty-cell {
          text-align: center !important;
          padding: 32px 16px !important;
          color: #787167 !important;
          font-size: 12.5px !important;
        }
      `}</style>
    </div>
  );
}