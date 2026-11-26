// components/orders/purchase-orders/types.ts

export type MonthFilterKey = "all" | "2026-01" | "2026-02" | "2026-03";

export type ProcurementStatus =
  | "Not Sent"
  | "Sent — Awaiting Confirmation"
  | "Confirmed";

export type PaymentStatus = "Pending" | "Paid" | "Advance Paid";

export type ShipmentStatus =
  | "Not Shipped"
  | "N/A — Digital"
  | "Shipped";

export type DeliveryStatus =
  | "Not Started"
  | "Delivered"
  | "In Transit";

export type PrimaryActionLabel =
  | "Prepare & Send"
  | "View & Resend"
  | "View";

export interface PurchaseOrderRecord {
  id: string;
  poRef: string;
  client: string;
  product: string;
  principal: string;
  qty: number;
  poDateDisplay: string;
  poDateIso: string; // YYYY-MM-DD for date-range filtering
  monthKey: "2026-01" | "2026-02" | "2026-03";
  procurementStatus: ProcurementStatus;
  paymentStatus: PaymentStatus;
  shipmentStatus: ShipmentStatus;
  deliveryStatus: DeliveryStatus;
  primaryAction: PrimaryActionLabel;
  archived?: boolean;
  unitPrice?: number;
  currency?: string;
  notes?: string;
}

export const INITIAL_PURCHASE_ORDERS: PurchaseOrderRecord[] = [
  {
    id: "po-1",
    poRef: "NG-EGCB/HW/260201",
    client: "EGCB",
    product: "Acronis Backup Spares — DCS Module",
    principal: "Acronis",
    qty: 2,
    poDateDisplay: "01 Feb 2026",
    poDateIso: "2026-02-01",
    monthKey: "2026-02",
    procurementStatus: "Not Sent",
    paymentStatus: "Pending",
    shipmentStatus: "Not Shipped",
    deliveryStatus: "Not Started",
    primaryAction: "Prepare & Send",
    archived: false,
    unitPrice: 92500,
    currency: "৳",
    notes: "Hardware spare dispatch awaiting vendor confirmation.",
  },
  {
    id: "po-2",
    poRef: "NG-BB/SW/260305",
    client: "Bangladesh Bank",
    product: "EViews Budgetary License",
    principal: "EViews / IHS Markit",
    qty: 1,
    poDateDisplay: "05 Mar 2026",
    poDateIso: "2026-03-05",
    monthKey: "2026-03",
    procurementStatus: "Sent — Awaiting Confirmation",
    paymentStatus: "Paid",
    shipmentStatus: "N/A — Digital",
    deliveryStatus: "Delivered",
    primaryAction: "View & Resend",
    archived: false,
    unitPrice: 480000,
    currency: "৳",
    notes: "Digital license key delivered; awaiting principal acknowledgement.",
  },
  {
    id: "po-3",
    poRef: "NG-SBPLC/SW/260118",
    client: "Sonali Bank PLC",
    product: "Radmin Software",
    principal: "Radmin",
    qty: 1,
    poDateDisplay: "18 Jan 2026",
    poDateIso: "2026-01-18",
    monthKey: "2026-01",
    procurementStatus: "Confirmed",
    paymentStatus: "Paid",
    shipmentStatus: "Shipped",
    deliveryStatus: "In Transit",
    primaryAction: "View",
    archived: false,
    unitPrice: 125000,
    currency: "৳",
    notes: "Confirmed by principal and currently in transit.",
  },
];