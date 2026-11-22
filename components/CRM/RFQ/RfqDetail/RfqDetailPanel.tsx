// components/CRM/rfq/RfqDetailPanel.tsx
'use client';

import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { RFQItem, RFQProduct } from '../types';
import StepperTimeline from './StepperTimeline';
import ClientInfoPanel from './ClientInfoPanel';
import ProductInfoTable from './ProductInfoTable';
import RFQDetailsModal from './RFQDetailsModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';

type ActionType =
  | 'reassign'
  | 'mark-lost'
  | 'archive'
  | 'unarchive'
  | 'delete'
  | 'edit'
  | null;

interface Props {
  rfq: RFQItem;
  clientSinceDate?: string | null;
  onProductDetails: (p: RFQProduct) => void;
  onClientDetails: () => void;
  onReassign?: () => void;
  onArchive?: () => Promise<void> | void;
  onUnarchive?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onMarkLost?: () => Promise<void> | void;
  onQuote?: () => void;
  onEdit?: () => void;
}

const ACTION_CONFIG: Record<
  Exclude<ActionType, null | 'reassign' | 'edit'>,
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

// ⭐ Helper function to format date safely
const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return dateString;
  }
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
  onQuote,
  clientSinceDate,
  onEdit,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ActionType>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);

  const isArchived = rfq.stage === 'archived';
  const isAlreadyQuoted = rfq.stage === 'quoted';
  const isLocked = isAlreadyQuoted || rfq.stage === 'lost' || isArchived;

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const action = e.target.value as ActionType;
    e.target.value = '';

    if (!action) return;

    setTimeout(() => {
      if (action === 'reassign') {
        onReassign?.();
        return;
      }
      if (action === 'edit') {
        onEdit?.();
        return;
      }
      setConfirmAction(action);
    }, 50);
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

  // ⭐ নতুন হেল্পার ফাংশন: কত বছর ধরে ক্লায়েন্ট তা বের করার জন্য
  const getClientAge = (dateString?: string | null) => {
    if (!dateString) return '—';

    const startDate = new Date(dateString);
    const currentDate = new Date();

    // যদি ভবিষ্যতের তারিখ হয় বা ইনভ্যালিড ডেট হয়
    if (isNaN(startDate.getTime()) || startDate > currentDate) return '—';

    let years = currentDate.getFullYear() - startDate.getFullYear();
    let months = currentDate.getMonth() - startDate.getMonth();

    // যদি চলতি বছরের মাস এখনো শেষ না হয়, তবে ১ বছর কমবে
    if (months < 0 || (months === 0 && currentDate.getDate() < startDate.getDate())) {
      years--;
      months += 12;
    }

    // আউটপুট ফরম্যাট ঠিক করা (যেমন: 2 Years, 1 Year, 5 Months ইত্যাদি)
    if (years > 0) {
      return `${years} Year${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} Month${months > 1 ? 's' : ''}`;
    } else {
      return 'This Year'; // যদি ১ বছরের কম হয়
    }
  };

  const config =
    confirmAction && confirmAction !== 'reassign' && confirmAction !== 'edit'
      ? ACTION_CONFIG[confirmAction]
      : null;

  // Safe access to deeply nested properties since the exact API structure might vary
  const client = rfq.clientInfo as any;
  const rawRfq = rfq as any;

  return (
    <>
      <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-[#EBE6DF] shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-[#F0EBE3] gap-2">
          <div>
            <div className="text-xs font-bold text-[#A06126] uppercase tracking-wider font-mono flex items-center gap-2">
              <span>RFQ# {rfq.rfqNumber}</span>
              {rfq.rfqSource && (
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] lowercase font-sans tracking-normal border border-slate-200">
                  Source: {rfq.rfqSource}
                </span>
              )}
            </div>

            <h2
              onClick={() => setIsTitleModalOpen(true)}
              className="text-lg font-serif font-bold text-[#0F2D4A] mt-0.5 cursor-pointer hover:text-[#A06126] hover:underline transition-colors inline-block"
              title="Click to view more details"
            >
              {rfq.company} · {rfq.country}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* {!isArchived && rfq.stage !== 'lost' && (
              <>
                {isAlreadyQuoted ? (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    Quoted
                  </span>
                ) : (
                  <button
                    onClick={onQuote}
                    disabled={busy}
                    className="bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Create Quote
                  </button>
                )}
              </>
            )} */}

            <div className="relative">
              <select
                value=""
                onChange={handleActionChange}
                disabled={busy}
                className="appearance-none bg-[#FDFBF7] border border-[#E2DBD1] text-xs font-medium rounded-lg pl-3 pr-7 py-1.5 text-slate-700 focus:outline-none cursor-pointer disabled:opacity-60"
              >
                <option value="">{busy ? 'Working…' : 'Actions'}</option>
                {!isLocked && <option value="edit">Edit RFQ</option>}
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
        </div>

        <StepperTimeline rfq={rfq} />
        <ClientInfoPanel info={rfq.clientInfo} onDetails={onClientDetails} />

        <ProductInfoTable
          products={rfq.products}
          onDetails={onProductDetails}
          onViewAllDetails={() => setIsDetailsModalOpen(true)}
        />
      </div>

      <RFQDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        rfqNumber={rfq.rfqNumber}
        products={rfq.products}
        onProductDetails={onProductDetails}
      />

      {/* ⭐ নতুন টাইটেল ডিটেইলস মডাল */}
      {isTitleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800">
                RFQ & Client Details
              </h3>
              <button
                onClick={() => setIsTitleModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">

              {/* RFQ Section */}
              <div>
                <p className="text-[10px] font-bold text-[#A06126] uppercase tracking-wider mb-3">RFQ Information</p>
                <div className="space-y-3">
                  <DetailRow label="Client RFQ Ref:" value={`RFQ#${rfq.rfqNumber}`} />
                  <DetailRow
                    label="RFQ Reference ID:"
                    value={rawRfq.rfqReferenceId || (rfq as any).rfqReferenceId || 'N/A'}
                  />
                  <DetailRow label="Client RFQ Date:" value={formatDate(rawRfq.clientRfqDate || rawRfq.inquiryDate || rawRfq.queryDate || rawRfq.createdAt) || 'N/A'} />
                  <DetailRow label="RFQ Source Type:" value={rawRfq.rfqSourceType || rfq.rfqSource || 'N/A'} />
                </div>
              </div>
              <hr className="border-gray-100" />
              <div>
                <p className="text-[10px] font-bold text-[#A06126] uppercase tracking-wider mb-3">Client Information</p>
                <div className="space-y-3">
                  <DetailRow label="Client Type:" value={client?.clientType || (client?.isReseller ? 'Reseller' : 'End User') || 'N/A'} />
                  <DetailRow label="Client Tier:" value={client?.tier || client?.clientTier || 'N/A'} />
                  <DetailRow
                    label="Client Since:"
                    value={
                      clientSinceDate || rfq.createdAt
                        ? `${getClientAge(clientSinceDate || rfq.createdAt)} (${new Date(clientSinceDate || rfq.createdAt!).getFullYear()})`
                        : '—'
                    }
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsTitleModalOpen(false)}
                className="px-5 py-2 bg-[#0F2D4A] text-white text-xs font-semibold rounded-lg hover:bg-[#1C3760] transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {config && (
        <DeleteConfirmModal
          isOpen={!!confirmAction && confirmAction !== 'reassign' && confirmAction !== 'edit'}
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

/* =========================================================
   HELPER COMPONENTS
   ========================================================= */

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-start border-b border-gray-100/50 pb-2.5 last:border-0 last:pb-0">
      <span className="text-xs text-gray-500 font-medium pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 font-semibold break-words">
        {value || '—'}
      </span>
    </div>
  );
}