// components/CRM/online-crm/MonthlyVolumeChart.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { MONTHS_SHORT } from './constants';
import { OnlineCrmApi, type DailyVolumeData } from '@/services/onlineCrm.service';

interface Props {
  data: number[];              // 12 monthly numbers
  activeMonth?: number;        // 0-11, highlight
  onSelectMonth?: (m: number) => void;
  filterParams?: Record<string, string>;
}

export function MonthlyVolumeChart({
  data,
  activeMonth,
  onSelectMonth,
  filterParams = {},
}: Props) {
  const [drillMonth, setDrillMonth] = useState<number | null>(null);
  const [dailyData, setDailyData] = useState<DailyVolumeData | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  useEffect(() => {
    if (drillMonth === null) {
      setDailyData(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingDaily(true);
        const res = await OnlineCrmApi.unifiedDailyVolume({
          ...filterParams,
          month: drillMonth,
          year: new Date().getFullYear(),
        });
        if (!cancelled) setDailyData(res);
      } catch (e: any) {
        if (!cancelled) setDailyData(null);
      } finally {
        if (!cancelled) setLoadingDaily(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [drillMonth, filterParams]);

  // ---- MONTHLY VIEW ----
  if (drillMonth === null) {
    const max = Math.max(1, ...data);

    return (
      <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
          Monthly Online Query Volume — FY26
        </h3>

        {/* ⭐ Chart area with explicit pixel heights */}
        <div className="mt-5 flex items-end gap-1.5" style={{ height: 180 }}>
          {data.map((val, i) => {
            const heightPct = (val / max) * 100;
            const isActive = activeMonth === i;
            const barHeightPx =
              val > 0 ? Math.max(6, (heightPct / 100) * 150) : 0;

            return (
              <button
                key={i}
                onClick={() => {
                  setDrillMonth(i);
                  onSelectMonth?.(i);
                }}
                className="flex flex-1 flex-col items-center group"
                style={{ height: '100%' }}
                title={`${MONTHS_SHORT[i]}: ${val} queries — click to see daily`}
              >
                {/* Bar wrapper — anchors bars to the bottom */}
                <div className="flex-1 w-full flex items-end">
                  <div
                    className={`w-full rounded-t transition-all cursor-pointer ${isActive
                        ? 'bg-[#A06126]'
                        : 'bg-[#C9A574] group-hover:bg-[#A06126]/80'
                      }`}
                    style={{ height: barHeightPx }}
                  />
                </div>

                {/* Month label */}
                <span
                  className={`mt-1.5 text-[9px] font-semibold ${isActive ? 'text-[#A06126]' : 'text-slate-500'
                    }`}
                >
                  {MONTHS_SHORT[i]}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-[10.5px] text-slate-500">
          <span className="text-[#A06126] font-semibold">
            Click a bar, or pick a month above, to drill into a daily trend.
          </span>
        </p>
      </div>
    );
  }

  // ---- DAILY DRILL-DOWN VIEW ----
  return (
    <DailyTrend
      month={drillMonth}
      data={dailyData}
      loading={loadingDaily}
      onBack={() => setDrillMonth(null)}
    />
  );
}

/* ============================================================
   DAILY TREND
   ============================================================ */
function DailyTrend({
  month,
  data,
  loading,
  onBack,
}: {
  month: number;
  data: DailyVolumeData | null;
  loading: boolean;
  onBack: () => void;
}) {
  const monthName = data?.monthName || MONTHS_SHORT[month];
  const dailyValues = data?.data || [];
  const max = Math.max(1, ...dailyValues);

  const CHART_HEIGHT = 180;
  const DAYS = dailyValues.length || 30;

  const points: [number, number][] = dailyValues.map((v, i) => {
    const x = (i / Math.max(1, DAYS - 1)) * 100;
    const y = CHART_HEIGHT - (v / max) * (CHART_HEIGHT - 20) - 10;
    return [x, y];
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');

  const areaPath =
    linePath + ` L 100 ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

  return (
    <div className="rounded-xl border border-[#EBE6DF] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
          {monthName.toUpperCase()} — Daily Query Trend
        </h3>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-3 h-3" />
          All Queries
        </button>
      </div>

      <div className="mt-6 relative" style={{ height: CHART_HEIGHT }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <svg
            viewBox={`0 0 100 ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{ overflow: 'visible' }}
          >
            <path d={areaPath} fill="#EFE8DA" opacity="0.6" />
            <path
              d={linePath}
              fill="none"
              stroke="#1E293B"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {points.map(([x, y], i) =>
              dailyValues[i] > 0 ? (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="0.8"
                  fill="#1E293B"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null
            )}
          </svg>
        )}
      </div>

      <div className="mt-2 flex justify-between text-[9px] font-semibold text-slate-500">
        <span>1</span>
        <span>{Math.floor(DAYS / 2)}</span>
        <span>{DAYS}</span>
      </div>

      <p className="mt-3 text-[10.5px] text-slate-500">
        Day-by-day RFQ volume for {monthName}. Pick &quot;All Queries&quot; above
        to return to the monthly overview.
      </p>
    </div>
  );
}