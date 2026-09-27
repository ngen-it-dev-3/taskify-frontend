'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { RFQClientInfo } from '../types';

interface Props {
  rfqNumber: string;
  clientInfo: RFQClientInfo;
  onClose: () => void;
}

export default function ClientInfoModal({ rfqNumber, clientInfo, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Click outside to close
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Build a full address line from available fields
  const fullAddress = '10, Anson Road, #21-07 International Plaza';

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-modal-title"
    >
      <div
        ref={panelRef}
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
      >
        {/* ---------- Header ---------- */}
        <div className="flex items-start justify-between px-8 pt-6 pb-4 border-b border-slate-100">
          <h2
            id="client-modal-title"
            className="text-xl font-bold text-slate-900"
          >
            RFQ Details (RFQ# {rfqNumber})
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ---------- Two-column body ---------- */}
        <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <InfoColumn title="SHIPPING INFO" info={clientInfo} address={fullAddress} />
          <InfoColumn title="END-USER INFO" info={clientInfo} address={fullAddress} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Reusable column: SHIPPING INFO / END-USER INFO
   --------------------------------------------------------- */
function InfoColumn({
  title,
  info,
  address,
}: {
  title: string;
  info: RFQClientInfo;
  address: string;
}) {
  return (
    <div>
      {/* Column title */}
      <h3 className="text-[11px] font-bold tracking-[0.08em] text-slate-700 uppercase mb-4">
        {title}
      </h3>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        <Row label="Name" value={info.contactName} />
        <Row label="Email" value={info.email} link />
        <Row label="Phone" value={info.phone} />
        <Row label="Company Name" value={info.company} />
        <Row label="Designation" value="Admin" />
        <Row label="Address" value={address} multiline />
        <Row label="Country" value={info.country} />
        <Row label="City" value={info.country} />
        <Row label="Zip Code" value={info.zipCode} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Single row: label on left, value on right, thin underline
   --------------------------------------------------------- */
function Row({
  label,
  value,
  link = false,
  multiline = false,
}: {
  label: string;
  value: string;
  link?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start py-3 text-sm">
      <span className="text-slate-400 font-normal w-32 shrink-0 leading-snug">
        {label}
      </span>
      <span
        className={`flex-1 leading-snug ${
          link
            ? 'text-[#A06126] hover:underline cursor-pointer'
            : 'text-slate-800 font-medium'
        } ${multiline ? '' : 'truncate'}`}
      >
        {value}
      </span>
    </div>
  );
}