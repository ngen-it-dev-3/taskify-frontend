// components/orders/types.ts

export type StepStatus = "completed" | "in_progress" | "not_started";

export interface FulfillmentStep {
  stepNumber: number;
  title: string;
  status: StepStatus;
  completedDate?: string;
  documentReference?: string;
  actionLabel?: string;
}

export interface OrderItem {
  id: string;
  client: string;
  poRef: string;
  title: string;
  statusLabel: string;
  statusTone: "amber" | "blue" | "rose" | "emerald";
  currentStep: number;
  totalSteps: number;
  steps: FulfillmentStep[];
}

export interface NewOrderInput {
  client: string;
  poRef: string;
  title: string;
  salesOrderRef: string;
  invoiceRef?: string;
}

export const DEFAULT_STEP_TITLES: string[] = [
  "Order Placed",
  "Invoice Sent to Customer",
  "Bank Realization (Client Payment)",
  "PO Issued to Principal",
  "Principal Invoice Received",
  "Payment to Principal",
  "Shipment by Logistics",
  "Customs / C&F Clearance",
  "Delivery & Installation",
  "Client Completion Certificate",
];

export function createInitialSteps(
  salesOrderRef: string,
  invoiceRef?: string
): FulfillmentStep[] {
  return DEFAULT_STEP_TITLES.map((title, idx) => {
    const stepNumber = idx + 1;

    if (stepNumber === 1) {
      return {
        stepNumber,
        title,
        status: "completed",
        completedDate: "26 Nov 2026",
        documentReference: `Sales Order ${salesOrderRef || "SO-2026-0201"}`,
      };
    }

    if (stepNumber === 2 && invoiceRef?.trim()) {
      return {
        stepNumber,
        title,
        status: "completed",
        completedDate: "26 Nov 2026",
        documentReference: `Invoice ${invoiceRef.trim()} sent`,
      };
    }

    const firstPendingStep = invoiceRef?.trim() ? 3 : 2;

    if (stepNumber === firstPendingStep) {
      return {
        stepNumber,
        title,
        status: "in_progress",
        actionLabel: stepNumber === 2 ? "Invoice Not Yet Sent" : "In progress — action needed",
      };
    }

    return {
      stepNumber,
      title,
      status: "not_started",
    };
  });
}

export const INITIAL_ORDERS: OrderItem[] = [
  {
    id: "ord-egcb-1",
    client: "EGCB",
    poRef: "NG-EGCB/HW/260201",
    title: "Acronis Backup Spares — DCS Module",
    statusLabel: "Awaiting Bank Realization",
    statusTone: "amber",
    currentStep: 3,
    totalSteps: 10,
    steps: [
      {
        stepNumber: 1,
        title: "Order Placed",
        status: "completed",
        completedDate: "01 Sep 2026",
        documentReference: "Sales Order SO-2026-0142",
      },
      {
        stepNumber: 2,
        title: "Invoice Sent to Customer",
        status: "completed",
        completedDate: "03 Sep 2026",
        documentReference: "Invoice INV-2026-0088 sent",
      },
      {
        stepNumber: 3,
        title: "Bank Realization (Client Payment)",
        status: "in_progress",
      },
      { stepNumber: 4, title: "PO Issued to Principal", status: "not_started" },
      { stepNumber: 5, title: "Principal Invoice Received", status: "not_started" },
      { stepNumber: 6, title: "Payment to Principal", status: "not_started" },
      { stepNumber: 7, title: "Shipment by Logistics", status: "not_started" },
      { stepNumber: 8, title: "Customs / C&F Clearance", status: "not_started" },
      { stepNumber: 9, title: "Delivery & Installation", status: "not_started" },
      { stepNumber: 10, title: "Client Completion Certificate", status: "not_started" },
    ],
  },
  {
    id: "ord-sonali-2",
    client: "Sonali Bank PLC",
    poRef: "NG-SBPLC/SW/260118",
    title: "Radmin Software procurement",
    statusLabel: "Shipment in Transit",
    statusTone: "blue",
    currentStep: 7,
    totalSteps: 10,
    steps: DEFAULT_STEP_TITLES.map((title, index) => {
      const stepNumber = index + 1;
      if (stepNumber < 7) {
        return {
          stepNumber,
          title,
          status: "completed" as const,
          completedDate: "15 Sep 2026",
          documentReference: `Ref DOC-2026-${100 + stepNumber}`,
        };
      }
      if (stepNumber === 7) {
        return {
          stepNumber,
          title,
          status: "in_progress" as const,
        };
      }
      return {
        stepNumber,
        title,
        status: "not_started" as const,
      };
    }),
  },
  {
    id: "ord-bb-3",
    client: "Bangladesh Bank",
    poRef: "NG-BB/SW/260305",
    title: "EViews Budgetary — 1yr, C65(T10)",
    statusLabel: "Invoice Not Yet Sent",
    statusTone: "rose",
    currentStep: 2,
    totalSteps: 10,
    steps: DEFAULT_STEP_TITLES.map((title, index) => {
      const stepNumber = index + 1;
      if (stepNumber === 1) {
        return {
          stepNumber,
          title,
          status: "completed" as const,
          completedDate: "10 Sep 2026",
          documentReference: "Sales Order SO-2026-0155",
        };
      }
      if (stepNumber === 2) {
        return {
          stepNumber,
          title,
          status: "in_progress" as const,
        };
      }
      return {
        stepNumber,
        title,
        status: "not_started" as const,
      };
    }),
  },
];