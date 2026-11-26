// components/orders/purchase-orders/PoFilterBar.tsx
"use client";

import type { MonthFilterKey } from "./types";

interface PoFilterBarProps {
  activeMonth: MonthFilterKey;
  onSelectMonth: (month: MonthFilterKey) => void;
  showArchive: boolean;
  onToggleArchive: () => void;
  archivedCount: number;
  fromDate: string;
  toDate: string;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  onClearFilters: () => void;
}

const MONTH_TABS: { key: MonthFilterKey; label: string }[] = [
  { key: "all", label: "All Months" },
  { key: "2026-01", label: "Jan 2026" },
  { key: "2026-02", label: "Feb 2026" },
  { key: "2026-03", label: "Mar 2026" },
];

export default function PoFilterBar({
  activeMonth,
  onSelectMonth,
  showArchive,
  onToggleArchive,
  archivedCount,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
}: PoFilterBarProps) {
  return (
    <div className="po-filter-wrapper">
      {/* Month Tabs & Right Archive Link */}
      <div className="po-month-tabs-row">
        <div className="po-month-tabs-left" role="tablist" aria-label="Filter by month">
          {MONTH_TABS.map((tab) => {
            const isActive = !showArchive && activeMonth === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  if (showArchive) onToggleArchive();
                  onSelectMonth(tab.key);
                }}
                className={`po-month-tab ${isActive ? "is-active" : ""}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onToggleArchive}
          className={`po-archive-link ${showArchive ? "is-active" : ""}`}
        >
          Archive{archivedCount > 0 ? ` (${archivedCount})` : ""}
        </button>
      </div>

      {/* Date Range Filter Card */}
      <div className="po-date-filter-card">
        <div className="po-date-controls">
          <div className="po-date-field">
            <label htmlFor="poFilterFrom" className="po-date-label">
              FROM
            </label>
            <input
              id="poFilterFrom"
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="po-date-input"
            />
          </div>

          <div className="po-date-field">
            <label htmlFor="poFilterTo" className="po-date-label">
              TO
            </label>
            <input
              id="poFilterTo"
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="po-date-input"
            />
          </div>

          <button
            type="button"
            onClick={onClearFilters}
            className="po-clear-btn"
          >
            Clear Filters
          </button>
        </div>

        <p className="po-filter-hint">
          Narrow further within the selected month tab, or leave both blank.
        </p>
      </div>

      <style jsx>{`
        .po-filter-wrapper {
          width: 100%;
        }

        .po-month-tabs-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid #e6e0d5;
          margin-bottom: 16px;
        }

        .po-month-tabs-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .po-month-tab {
          position: relative;
          background: transparent;
          border: none;
          padding: 10px 2px;
          font-size: 13px;
          font-weight: 500;
          color: #6b645b;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .po-month-tab:hover {
          color: #1c1917;
        }

        .po-month-tab.is-active {
          color: #1c1917;
          font-weight: 600;
        }

        .po-month-tab.is-active::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 2px;
          background: #8c621e;
        }

        .po-archive-link {
          background: transparent;
          border: none;
          padding: 10px 2px;
          font-size: 12.5px;
          font-weight: 500;
          color: #6b645b;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .po-archive-link:hover,
        .po-archive-link.is-active {
          color: #1c1917;
          font-weight: 600;
        }

        .po-date-filter-card {
          background: #fffefa;
          border: 1px solid #e6e0d5;
          border-radius: 8px;
          padding: 14px 18px;
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
        }

        .po-date-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 12px;
        }

        .po-date-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .po-date-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #575148;
        }

        .po-date-input {
          height: 36px;
          padding: 0 11px;
          font-size: 12.5px;
          color: #1c1917;
          background: #ffffff;
          border: 1px solid #dcd6ca;
          border-radius: 6px;
          outline: none;
          min-width: 146px;
          transition: border-color 0.15s ease;
        }

        .po-date-input:focus {
          border-color: #8c621e;
        }

        .po-clear-btn {
          height: 36px;
          padding: 0 14px;
          font-size: 12px;
          font-weight: 500;
          color: #2f2a24;
          background: #ffffff;
          border: 1px solid #dcd6ca;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .po-clear-btn:hover {
          background: #f5f1e7;
          border-color: #c8c0b0;
        }

        .po-filter-hint {
          margin: 0;
          font-size: 12px;
          color: #787167;
          padding-bottom: 8px;
        }

        @media (max-width: 640px) {
          .po-filter-hint {
            padding-bottom: 0;
          }
        }
      `}</style>
    </div>
  );
}