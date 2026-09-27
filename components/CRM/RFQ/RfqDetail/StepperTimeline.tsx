'use client';

import React from 'react';
import type { RFQItem } from '../types';

interface Props {
  rfq: RFQItem;
}

export default function StepperTimeline({ rfq }: Props) {
  // ---- Determine progress state ----
  // 'pending'  → step 1 done, step 2 active, step 3 pending
  // 'quoted'   → step 1 done, step 2 done, step 3 active
  // 'archived' → all steps done (fully completed)
  const isQuoted = rfq.stage === 'quoted' || rfq.stage === 'archived';
  const isArchived = rfq.stage === 'archived';

  // ---- Shared styles ----
  const GREEN = '#2E7D5B';
  const GRAY = '#D8D3CA';

  return (
    <div className="relative my-6">
      {/* ================= CONNECTING LINES (behind circles) ================= */}
      <div className="absolute top-3 left-[16.66%] right-[16.66%] h-[1.5px] flex">
        {/* Left half — step 1 → step 2 (always green, step 1 is always done) */}
        <div className="flex-1" style={{ backgroundColor: GREEN }} />
        {/* Right half — step 2 → step 3 (green only if quoted/archived) */}
        <div
          className="flex-1 transition-colors duration-500"
          style={{ backgroundColor: isQuoted ? GREEN : GRAY }}
        />
      </div>

      {/* ================= 3-STEP GRID ================= */}
      <div className="relative grid grid-cols-3 text-center text-xs">
        {/* ---------- Step 1 — Confirmed (always done) ---------- */}
        <div className="flex flex-col items-center">
          <div
            className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm z-10"
            style={{ backgroundColor: GREEN }}
          >
            <CheckIcon />
          </div>
          <div className="mt-2 font-semibold text-slate-800 text-[12px]">RFQ Confirmed</div>
          <div className="text-[10.5px] text-slate-500 mt-0.5">By: {rfq.assignedTo}</div>
        </div>

        {/* ---------- Step 2 — Assigned (active OR done) ---------- */}
        <div className="flex flex-col items-center">
          {isQuoted ? (
            // Done state: solid green check, no pulse
            <div
              className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm z-10"
              style={{ backgroundColor: GREEN }}
            >
              <CheckIcon />
            </div>
          ) : (
            // Active state: green person icon with sonar pulse
            <div className="relative flex items-center justify-center z-10">
              {/* Sonar ring 1 */}
              <span
                className="absolute inline-flex w-6 h-6 rounded-full animate-sonar"
                style={{ backgroundColor: GREEN, opacity: 0.6 }}
              />
              {/* Sonar ring 2 (delayed) */}
              <span
                className="absolute inline-flex w-6 h-6 rounded-full animate-sonar"
                style={{
                  backgroundColor: GREEN,
                  opacity: 0.4,
                  animationDelay: '0.75s',
                }}
              />
              {/* Core circle */}
              <div
                className="relative w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm"
                style={{ backgroundColor: GREEN }}
              >
                <UserIcon />
              </div>
            </div>
          )}
          <div className="mt-2 font-semibold text-slate-800 text-[12px]">Assigned To</div>
          <div className="text-[10.5px] text-slate-500 mt-0.5 truncate max-w-[160px]">
            {rfq.assignedTo}
          </div>
        </div>

        {/* ---------- Step 3 — Status Closed (pending OR done) ---------- */}
        <div className="flex flex-col items-center">
          {isArchived ? (
            // Archived: fully complete
            <div
              className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm z-10"
              style={{ backgroundColor: GREEN }}
            >
              <CheckIcon />
            </div>
          ) : (
            // Pending: hollow circle with small square
            <div
              className="w-6 h-6 rounded-full bg-white border-[1.5px] flex items-center justify-center z-10"
              style={{ borderColor: '#C9C3B8' }}
            >
              <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: '#C9C3B8' }} />
            </div>
          )}
          <div
            className={`mt-2 font-semibold text-[12px] ${
              isArchived ? 'text-slate-800' : 'text-slate-700'
            }`}
          >
            Status Closed
          </div>
          <div
            className={`text-[10.5px] mt-0.5 ${
              isArchived ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {isArchived ? 'Deal archived' : 'Pending completion'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Inline SVG icons (crisper than emoji, match your screenshot)
   ============================================================ */

function CheckIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}