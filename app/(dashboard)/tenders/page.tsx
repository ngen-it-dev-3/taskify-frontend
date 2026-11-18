// app/(dashboard)/tenders/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { TenderHeader } from "@/components/tender/TenderHeader";
import { TenderActionBanner } from "@/components/tender/TenderActionBanner";
import { TenderOverviewStats } from "@/components/tender/TenderOverviewStats";
import { TenderOverviewPerformance } from "@/components/tender/TenderOverviewPerformance";
import { TenderAIIntelligence } from "@/components/tender/TenderAIIntelligence";
import { TenderAlertList } from "@/components/tender/TenderAlertList";
import { TenderOverviewQuickActions } from "@/components/tender/TenderOverviewQuickActions";
import {
  useTenderOverview,
  useTenderPerformance,
  useTenderActionItems,
  useAITenderMatches,
  useTenderAlerts,
} from "@/hooks/tender/useTenderOverview";
import type { PipelineSegment } from "@/lib/api/tender.api";

/* Fixed stage → color mapping for the donut chart */
const STAGE_COLORS: Record<string, string> = {
  Potential: "#a97400",
  Active: "#1e3a8a",
  Submitted: "#94a3b8",
  Won: "#059669",
  Lost: "#dc2626",
};

export default function TenderOverviewPage() {
  const router = useRouter();

  const { data: overview, loading: overviewLoading } = useTenderOverview();
  const { data: performance, loading: perfLoading } = useTenderPerformance();
  const { data: actionItems, loading: actionLoading } = useTenderActionItems();
  const { data: aiMatches, loading: aiLoading } = useAITenderMatches();
  const { data: alerts, loading: alertsLoading } = useTenderAlerts();

  /* ---------------- Derived pipelineMix ---------------- */
  const derivedPipelineMix: PipelineSegment[] =
    performance?.pipelineMix && performance.pipelineMix.length > 0
      ? performance.pipelineMix
      : (overview?.pipeline ?? []).map((row) => ({
          label: row.label,
          value: row.count,
          color: STAGE_COLORS[row.label] ?? "#94a3b8",
        }));

  const safeWinRate = performance?.winRate ?? 0;
  const safeWonValue = performance?.wonValue ?? "BDT0";
  const safeWonValueShort = performance?.wonValueShort ?? safeWonValue;
  const safeLostCount = performance?.lostCount ?? 0;

  /* ---------------- AI crawl time ---------------- */
  const crawledAt =
    (performance as any)?.aiCrawledAt ??
    (overview as any)?.aiCrawledAt ??
    new Date().toISOString();

  /* ---------------- KPI Cards Action Links ---------------- */
  // API থেকে আসা stats এর সাথে ট্যাব লিংক যুক্ত করা হচ্ছে
  const enhancedStats = (overview?.stats ?? []).map((stat: any) => {
    let href = undefined;
    const label = stat.label.toUpperCase();

    if (label.includes("TOTAL TENDERS")) {
      href = "/tenders/manage?tab=potential";
    } else if (label.includes("ACTIVE")) {
      href = "/tenders/manage?tab=active";
    } else if (label.includes("AWAITING") || label.includes("RESULT")) {
      href = "/tenders/manage?tab=submitted";
    } else if (label.includes("WIN RATE")) {
      href = "/tenders/manage?tab=won";
    } else if (label.includes("BID VALUE")) {
      href = "/tenders/manage?tab=won"; // Total Bid Value ও Won ট্যাবে নিয়ে যাবে
    }

    return { ...stat, href };
  });

  return (
    <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-5 p-6 lg:p-8">
        <TenderHeader onAddTender={() => router.push("/tenders/manage")} />

        {/* Action Banner */}
        {actionLoading || !actionItems || actionItems.length === 0 ? (
          actionLoading ? (
            <div className="h-[88px] animate-pulse rounded-xl bg-[#0a1f2e]" />
          ) : null
        ) : (
          <TenderActionBanner items={actionItems} />
        )}

        {/* Performance + AI Intelligence */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Left Column: Performance */}
          <div>
            {perfLoading || !performance ? (
              <div className="h-[350px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
            ) : (
              <TenderOverviewPerformance
                pipelineMix={derivedPipelineMix}
                winRate={safeWinRate}
                wonValue={safeWonValue}
                wonValueShort={safeWonValueShort}
                lostCount={safeLostCount}
              />
            )}
          </div>

          {/* Right Column: AI Intelligence */}
          <div>
            {aiLoading || !aiMatches ? (
              <div className="h-[350px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
            ) : (
              <TenderAIIntelligence matches={aiMatches} crawledAt={crawledAt} />
            )}
          </div>
        </div>

        {/* KPI strip (Clickable) */}
        {overviewLoading || !overview ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[104px] animate-pulse rounded-xl border border-slate-200/80 bg-white"
              />
            ))}
          </div>
        ) : (
          <TenderOverviewStats stats={enhancedStats as any} />
        )}

        {/* Alert Lists Grid */}
        {alertsLoading || !alerts ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[200px] animate-pulse rounded-xl border border-slate-200/80 bg-white"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <TenderAlertList {...alerts.hotRfqs} />
            <TenderAlertList {...alerts.deadlines} />
            <TenderAlertList {...alerts.security} />
            <TenderAlertList {...alerts.billing} />
            <TenderAlertList {...alerts.delivery} />
          </div>
        )}

        <TenderOverviewQuickActions />
      </div>
    </main>
  );
}