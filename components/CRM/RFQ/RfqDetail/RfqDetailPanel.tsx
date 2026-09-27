'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { RFQItem, RFQProduct } from '../types';
import StepperTimeline from './StepperTimeline';
import ClientInfoPanel from './ClientInfoPanel';
import ProductInfoTable from './ProductInfoTable';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';

type ActionType =
  | 'reassign'
  | 'mark-lost'
  | 'archive'
  | 'unarchive'
  | 'delete'
  | null;

interface Props {
  rfq: RFQItem;
  onProductDetails: (p: RFQProduct) => void;
  onClientDetails: () => void;
  onReassign?: () => void;
  onArchive?: () => Promise<void> | void;
  onUnarchive?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onMarkLost?: () => Promise<void> | void;
}

// ---- Per-action modal config ----
const ACTION_CONFIG: Record<
  Exclude<ActionType, null | 'reassign'>,
  {
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }
> = {
  archive: {
    title: 'Archive RFQ',
    message:
      'Are you sure you want to archive this RFQ? It will move to the Archived list and can be restored anytime.',
    confirmLabel: 'Archive',
    variant: 'warning',
  },
  unarchive: {
    title: 'Restore RFQ',
    message:
      'Are you sure you want to restore this RFQ back to the Active Inbound Pipeline?',
    confirmLabel: 'Restore',
    variant: 'success',
  },
  'mark-lost': {
    title: 'Mark RFQ as Lost',
    message:
      'Are you sure you want to mark this RFQ as Lost? It will remain in the pipeline for reporting purposes.',
    confirmLabel: 'Mark Lost',
    variant: 'info',
  },
  delete: {
    title: 'Delete RFQ',
    message:
      'Are you sure you want to delete this RFQ? This action cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'danger',
  },
};

export default function RfqDetailPanel({
  rfq,
  onProductDetails,
  onClientDetails,
  onReassign,
  onArchive,
  onUnarchive,
  onDelete,
  onMarkLost,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ActionType>(null);

  const isArchived = rfq.stage === 'archived';

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const action = e.target.value as ActionType;
    e.target.value = '';
    if (!action) return;

    if (action === 'reassign') {
      onReassign?.();
      return;
    }

    setConfirmAction(action);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setBusy(true);
    try {
      if (confirmAction === 'archive') await onArchive?.();
      else if (confirmAction === 'unarchive') await onUnarchive?.();
      else if (confirmAction === 'delete') await onDelete?.();
      else if (confirmAction === 'mark-lost') await onMarkLost?.();
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  // Safely derive the config only when a non-reassign action is picked
  const config =
    confirmAction && confirmAction !== 'reassign'
      ? ACTION_CONFIG[confirmAction]
      : null;

  return (
    <>
      <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-[#EBE6DF] shadow-2xs">
        {/* ---------- Header ---------- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-[#F0EBE3] gap-2">
          <div>
            <div className="text-xs font-bold text-[#A06126] uppercase tracking-wider font-mono">
              RFQ# {rfq.rfqNumber}
            </div>
            <h2 className="text-lg font-serif font-bold text-[#0F2D4A] mt-0.5">
              {rfq.company} · {rfq.country}
            </h2>
          </div>

          {/* ---------- Actions dropdown ---------- */}
          <div className="relative">
            <select
              value=""
              onChange={handleActionChange}
              disabled={busy}
              className="appearance-none bg-[#FDFBF7] border border-[#E2DBD1] text-xs font-medium rounded-lg pl-3 pr-7 py-1.5 text-slate-700 focus:outline-none cursor-pointer disabled:opacity-60"
            >
              <option value="">{busy ? 'Working…' : 'Actions'}</option>
              <option value="reassign">Reassign</option>
              <option value="mark-lost">Mark Lost</option>
              {isArchived ? (
                <option value="unarchive">Unarchive</option>
              ) : (
                <option value="archive">Archive</option>
              )}
              <option value="delete">Delete</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* ---------- Body ---------- */}
        <StepperTimeline rfq={rfq} />
        <ClientInfoPanel info={rfq.clientInfo} onDetails={onClientDetails} />
        <ProductInfoTable products={rfq.products} onDetails={onProductDetails} />
      </div>

      {/* ---------- Reusable modal with per-action copy ---------- */}
      {config && (
        <DeleteConfirmModal
          isOpen={!!confirmAction && confirmAction !== 'reassign'}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          title={config.title}
          message={config.message}
          confirmLabel={config.confirmLabel}
          loading={busy}
          variant={config.variant}
        />
      )}
    </>
  );
}