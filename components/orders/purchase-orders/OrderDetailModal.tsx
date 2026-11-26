// components/orders/purchase-orders/OrderDetailModal.tsx
"use client";

import type {
  DeliveryStatus,
  PaymentStatus,
  ProcurementStatus,
  PurchaseOrderRecord,
  ShipmentStatus,
} from "@/types/orders/purchase-orders/types";

interface OrderDetailModalProps {
  order: PurchaseOrderRecord | null;
  mode: "view" | "prepare";
  onClose: () => void;
  onUpdateOrder: (updated: PurchaseOrderRecord) => void;
}

export default function OrderDetailModal({
  order,
  mode,
  onClose,
  onUpdateOrder,
}: OrderDetailModalProps) {
  if (!order) return null;

  const handleFieldChange = <K extends keyof PurchaseOrderRecord>(
    key: K,
    value: PurchaseOrderRecord[K]
  ) => {
    onUpdateOrder({ ...order, [key]: value });
  };

  return (
    <div className="po-modal-backdrop" onClick={onClose}>
      <div className="po-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="po-modal-header">
          <div>
            <p className="po-modal-eyebrow">
              {mode === "prepare" ? "PROCUREMENT DISPATCH & ACTION" : "PURCHASE ORDER DETAILS"}
            </p>
            <h3 className="po-modal-title">
              {order.poRef} — {order.client}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="po-modal-close">
            Close
          </button>
        </div>

        <div className="po-modal-grid">
          <div>
            <span className="po-meta-label">PRODUCT</span>
            <p className="po-meta-val">{order.product}</p>
          </div>
          <div>
            <span className="po-meta-label">PRINCIPAL</span>
            <p className="po-meta-val">{order.principal}</p>
          </div>
          <div>
            <span className="po-meta-label">QUANTITY</span>
            <p className="po-meta-val">{order.qty}</p>
          </div>
          <div>
            <span className="po-meta-label">PO DATE</span>
            <p className="po-meta-val">{order.poDateDisplay}</p>
          </div>
        </div>

        <div className="po-status-grid">
          <div>
            <label className="po-meta-label">PROCUREMENT STATUS</label>
            <select
              value={order.procurementStatus}
              onChange={(e) =>
                handleFieldChange(
                  "procurementStatus",
                  e.target.value as ProcurementStatus
                )
              }
              className="po-modal-select"
            >
              <option value="Not Sent">Not Sent</option>
              <option value="Sent — Awaiting Confirmation">
                Sent — Awaiting Confirmation
              </option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>

          <div>
            <label className="po-meta-label">PAYMENT STATUS</label>
            <select
              value={order.paymentStatus}
              onChange={(e) =>
                handleFieldChange("paymentStatus", e.target.value as PaymentStatus)
              }
              className="po-modal-select"
            >
              <option value="Pending">Pending</option>
              <option value="Advance Paid">Advance Paid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div>
            <label className="po-meta-label">SHIPMENT STATUS</label>
            <select
              value={order.shipmentStatus}
              onChange={(e) =>
                handleFieldChange("shipmentStatus", e.target.value as ShipmentStatus)
              }
              className="po-modal-select"
            >
              <option value="Not Shipped">Not Shipped</option>
              <option value="N/A — Digital">N/A — Digital</option>
              <option value="Shipped">Shipped</option>
            </select>
          </div>

          <div>
            <label className="po-meta-label">DELIVERY STATUS</label>
            <select
              value={order.deliveryStatus}
              onChange={(e) =>
                handleFieldChange("deliveryStatus", e.target.value as DeliveryStatus)
              }
              className="po-modal-select"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        <div className="po-notes-box">
          <span className="po-meta-label">NOTES</span>
          <p className="po-notes-text">{order.notes || "No additional notes."}</p>
        </div>

        <div className="po-modal-footer">
          {mode === "prepare" && order.procurementStatus === "Not Sent" && (
            <button
              type="button"
              onClick={() =>
                handleFieldChange(
                  "procurementStatus",
                  "Sent — Awaiting Confirmation"
                )
              }
              className="po-btn-primary"
            >
              Mark as Sent to Principal
            </button>
          )}
          <button type="button" onClick={onClose} className="po-btn-secondary">
            Done
          </button>
        </div>
      </div>

      <style jsx>{`
        .po-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(17, 34, 59, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .po-modal-card {
          width: 100%;
          max-width: 640px;
          background: #fffefa;
          border: 1px solid #e6e0d5;
          border-radius: 10px;
          padding: 20px 24px;
          box-shadow: 0 20px 40px rgba(17, 34, 59, 0.18);
        }

        .po-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #ece6da;
        }

        .po-modal-eyebrow {
          margin: 0;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8c621e;
        }

        .po-modal-title {
          margin: 4px 0 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          font-weight: 700;
          color: #1c1917;
        }

        .po-modal-close {
          background: #ffffff;
          border: 1px solid #dcd6ca;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          color: #2f2a24;
          cursor: pointer;
        }

        .po-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 18px;
          margin-top: 16px;
        }

        .po-status-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 16px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #ece6da;
        }

        .po-meta-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6b645b;
          margin-bottom: 4px;
        }

        .po-meta-val {
          margin: 0;
          font-size: 12.5px;
          font-weight: 600;
          color: #1c1917;
        }

        .po-modal-select {
          width: 100%;
          height: 36px;
          padding: 0 10px;
          font-size: 12px;
          color: #1c1917;
          background: #ffffff;
          border: 1px solid #dcd6ca;
          border-radius: 6px;
          outline: none;
        }

        .po-modal-select:focus {
          border-color: #8c621e;
        }

        .po-notes-box {
          margin-top: 16px;
          padding: 12px 14px;
          background: #faf8f4;
          border: 1px solid #ece6da;
          border-radius: 6px;
        }

        .po-notes-text {
          margin: 4px 0 0;
          font-size: 12px;
          color: #3d3832;
        }

        .po-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .po-btn-primary {
          background: linear-gradient(135deg, var(--navy-900, #11223b), var(--navy-700, #1e3a5f));
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .po-btn-secondary {
          background: #ffffff;
          color: #1c1917;
          border: 1px solid #dcd6ca;
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 560px) {
          .po-modal-grid,
          .po-status-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}