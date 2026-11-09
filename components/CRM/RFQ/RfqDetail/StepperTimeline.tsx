'use client';

import React from 'react';
import type { RFQItem } from '../types';

interface Props {
  rfq: RFQItem;
}

const GREEN = '#2E7D5B';
const GRAY = '#D8D3CA';
const RED = '#DC2626';
const AMBER = '#A06126';

export default function StepperTimeline({ rfq }: Props) {
  // ---- Determine the state of each step ----
  const isArchived = rfq.stage === 'archived';
  const isLost = rfq.stage === 'lost';
  const isQuoted = rfq.stage === 'quoted';

  // Real assignee (fall back to salesman if assignedTo is missing)
  const assignee =
    (rfq.assignedTo && rfq.assignedTo !== 'Unassigned'
      ? rfq.assignedTo
      : null) ||
    (rfq.salesman && rfq.salesman !== 'Unassigned' ? rfq.salesman : null);

  const isAssigned = !!assignee;

  // ---- Step 1: RFQ Confirmed (always done) ----
  const step1Done = true;
  // Subtext: show who created/submitted it
  const step1Subtext = `By: ${rfq.source === 'online' ? 'Web Portal' : 'CRM Staff'
    }`;

  // ---- Step 2: Assigned To ----
  // Done if: rfq has an assignee
  // Active (pulsing) if: unassigned AND not archived/lost
  const step2Done = isAssigned;
  const step2Active = !isAssigned && !isArchived && !isLost;

  // ---- Step 3: Status Closed ----
  const step3Done = isArchived || isLost;
  const step3Active = !step3Done && isQuoted;

  const finalLabel = isArchived
    ? 'Deal archived'
    : isLost
      ? 'Deal lost'
      : step3Done
        ? 'Closed'
        : 'Pending completion';

  const finalSubtext = isArchived
    ? 'Archived'
    : isLost
      ? 'Marked lost'
      : 'Pending completion';

  return (
    <div className="relative my-6">
      {/* ================= CONNECTING LINES ================= */}
      <div className="absolute top-3 left-[16.66%] right-[16.66%] h-[1.5px] flex">
        {/* Left segment: step1 → step2 (green if assigned OR further) */}
        <div
          className="flex-1 transition-colors duration-500"
          style={{ backgroundColor: step2Done ? GREEN : GRAY }}
        />
        {/* Right segment: step2 → step3 (green if archived/lost) */}
        <div
          className="flex-1 transition-colors duration-500"
          style={{ backgroundColor: step3Done ? GREEN : GRAY }}
        />
      </div>

      {/* ================= 3-STEP GRID ================= */}
      <div className="relative grid grid-cols-3 text-center text-xs">
        {/* ---------- Step 1 — Confirmed ---------- */}
        <div className="flex flex-col items-center">
          <div
            className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm z-10"
            style={{ backgroundColor: GREEN }}
          >
            <CheckIcon />
          </div>
          <div className="mt-2 font-semibold text-slate-800 text-[12px]">
            RFQ Confirmed
          </div>
          <div className="text-[10.5px] text-slate-500 mt-0.5">
            {step1Subtext}
          </div>
        </div>

        {/* ---------- Step 2 — Assigned To ---------- */}
        <div className="flex flex-col items-center">
          {step2Done ? (
            // Done: solid green with check, no pulse
            <div
              className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm z-10"
              style={{ backgroundColor: GREEN }}
            >
              <CheckIcon />
            </div>
          ) : step2Active ? (
            // Active: pulsing person icon
            <div className="relative flex items-center justify-center z-10">
              <span
                className="absolute inline-flex w-6 h-6 rounded-full animate-sonar"
                style={{ backgroundColor: GREEN, opacity: 0.6 }}
              />
              <span
                className="absolute inline-flex w-6 h-6 rounded-full animate-sonar"
                style={{
                  backgroundColor: GREEN,
                  opacity: 0.4,
                  animationDelay: '0.75s',
                }}
              />
              <div
                className="relative w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm"
                style={{ backgroundColor: GREEN }}
              >
                <UserIcon />
              </div>
            </div>
          ) : (
            // Pending: hollow
            <div
              className="w-6 h-6 rounded-full bg-white border-[1.5px] flex items-center justify-center z-10"
              style={{ borderColor: GRAY }}
            >
              <span
                className="w-2 h-2 rounded-[2px]"
                style={{ backgroundColor: GRAY }}
              />
            </div>
          )}

          <div className="mt-2 font-semibold text-slate-800 text-[12px]">
            Assigned To
          </div>
          <div className="text-[10.5px] text-slate-500 mt-0.5 truncate max-w-[160px]">
            {assignee ?? 'Unassigned'}
          </div>
        </div>

        {/* ---------- Step 3 — Status Closed ---------- */}
        <div className="flex flex-col items-center">
          {step3Done ? (
            // Done: solid green (or red if lost)
            <div
              className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm z-10"
              style={{ backgroundColor: isLost ? RED : GREEN }}
            >
              {isLost ? <XIcon /> : <CheckIcon />}
            </div>
          ) : step3Active ? (
            // Active: pulsing amber (quoted = ready to close)
            <div className="relative flex items-center justify-center z-10">
              <span
                className="absolute inline-flex w-6 h-6 rounded-full animate-sonar"
                style={{ backgroundColor: AMBER, opacity: 0.5 }}
              />
              <span
                className="absolute inline-flex w-6 h-6 rounded-full animate-sonar"
                style={{
                  backgroundColor: AMBER,
                  opacity: 0.3,
                  animationDelay: '0.75s',
                }}
              />
              <div
                className="relative w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm"
                style={{ backgroundColor: AMBER }}
              >
                <ClockIcon />
              </div>
            </div>
          ) : (
            // Pending: hollow
            <div
              className="w-6 h-6 rounded-full bg-white border-[1.5px] flex items-center justify-center z-10"
              style={{ borderColor: GRAY }}
            >
              <span
                className="w-2 h-2 rounded-[2px]"
                style={{ backgroundColor: GRAY }}
              />
            </div>
          )}

          <div
            className={`mt-2 font-semibold text-[12px] ${isLost
                ? 'text-rose-700'
                : step3Done
                  ? 'text-slate-800'
                  : 'text-slate-700'
              }`}
          >
            {isLost ? 'Status: Lost' : 'Status Closed'}
          </div>
          <div
            className={`text-[10.5px] mt-0.5 ${isLost
                ? 'text-rose-600'
                : step3Done
                  ? 'text-slate-500'
                  : 'text-slate-400'
              }`}
          >
            {finalSubtext}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Inline SVG Icons
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

function XIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ClockIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}