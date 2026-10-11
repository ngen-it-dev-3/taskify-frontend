'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  RotateCw,
  Download,
  ArrowRight,
  MessageSquare,
  X,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  SalesDashboardApi,
  type SalesDashboardData,
  CURRENCY_META,
  convertFromBDT,
  type CurrencyCode,
  type DimensionKey,
  type TimeKey,
} from '@/services/salesDashboard.service';

interface DealItem {
  id: string;
  title: string;
  company: string;
  closing: string;
  value: string;
  priority: string;
  prob: string;
  level: 'high' | 'med';
}

const fmtPct = (n: number) =>
  `${n >= 0 ? '+' : ''}${Number(n || 0).toFixed(1)}%`;

const TIME_OPTIONS: TimeKey[] = ['Q1', 'Q2', 'Q3', 'Q4', 'FY26'];
const DIMENSIONS: DimensionKey[] = ['Country', 'Industry', 'Product'];

export default function SalesDashboardPage() {
  /* ---- Filters ---- */
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyCode>('TK');
  const [timeFilter, setTimeFilter] = useState<TimeKey>('Q1');
  const [salesByDimension, setSalesByDimension] = useState<DimensionKey>('Country');

  /* ---- Widget UI state ---- */
  const [selectedBarInfo, setSelectedBarInfo] = useState<string | null>(null);
  const [activeDonutSegment, setActiveDonutSegment] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  /* ---- Data ---- */
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const firstLoad = useRef(true);
  const requestIdRef = useRef(0);

  /* ---- Currency ---- */
  const sym = CURRENCY_META[currencyFilter].symbol;
  const fmtCurrency = (n: number) => {
    const v = convertFromBDT(n || 0, currencyFilter);
    return `${sym}${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };
  const fmtCompact = (n: number) => {
    const v = convertFromBDT(n || 0, currencyFilter);
    if (v >= 1_00_00_000) return `${sym}${(v / 1_00_00_000).toFixed(2)}Cr`;
    if (v >= 1_00_000) return `${sym}${(v / 1_00_000).toFixed(2)}L`;
    if (v >= 1_000) return `${sym}${(v / 1_000).toFixed(1)}K`;
    return `${sym}${v.toFixed(0)}`;
  };

  /* ---- Load ---- */
  const loadData = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      const myId = ++requestIdRef.current;

      try {
        if (opts.silent) setRefreshing(true);
        else setLoading(true);

        const d = await SalesDashboardApi.get({
          country: countryFilter,
          currency: currencyFilter,
          time: timeFilter,
          dimension: salesByDimension,
        });

        /* ⭐ Drop stale responses (user toggled filter again while loading) */
        if (myId !== requestIdRef.current) return;
        setData(d);
      } catch (e: any) {
        if (myId === requestIdRef.current) {
          toast.error(e.message || 'Failed to load dashboard');
        }
      } finally {
        if (myId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [countryFilter, currencyFilter, timeFilter, salesByDimension]
  );

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      loadData();
    } else {
      loadData({ silent: true });
    }
  }, [loadData]);

  /* ---- Derived ---- */
  const kpis = data?.kpis;
  const overview = data?.salesOverview ?? [];
  const productVsIndustry = data?.productVsIndustry ?? [];
  const salesByBars = data?.salesByDimension?.bars ?? [];
  const potentialDeals = data?.potentialDeals ?? [];
  const rfqAging = data?.rfqAging ?? [];
  const sourceMix = data?.sourceMix;
  const byChannel = data?.byChannel ?? [];
  const reportSummary = data?.reportSummary ?? [];
  const revenueTrend = data?.revenueTrend;
  const availableCountries = data?.availableCountries ?? [];

  /* ---- Donut math ---- */
  const DONUT_C = 220;
  const donutSegments = useMemo(() => {
    let offset = 0;
    return productVsIndustry.map((seg) => {
      const dash = (seg.pct / 100) * DONUT_C;
      const s = { ...seg, dash, offset };
      offset += dash;
      return s;
    });
  }, [productVsIndustry]);

  const sourceMixOnlinePct = sourceMix?.online.pct ?? 0;
  const sourceMixOfflinePct = sourceMix?.offline.pct ?? 0;

  /* ---- Export ---- */
  const handleExport = () => {
    if (!data || !kpis) {
      toast.error('Nothing to export yet');
      return;
    }
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines: string[] = [];

    lines.push(
      [
        'Sales Dashboard Export',
        new Date().toISOString(),
        `Country: ${countryFilter}`,
        `Currency: ${currencyFilter}`,
        `Time: ${timeFilter}`,
        `Dimension: ${salesByDimension}`,
      ]
        .map(esc)
        .join(',')
    );
    lines.push('');

    lines.push('KPIs');
    lines.push(['Metric', 'Value', 'Change %'].map(esc).join(','));
    lines.push(['Today\'s Sales', kpis.todaySales.value, kpis.todaySales.changePct].map(esc).join(','));
    lines.push(['Total Sales (YTD)', kpis.totalSalesYtd.value, kpis.totalSalesYtd.changePct].map(esc).join(','));
    lines.push(['Sales Target', kpis.salesTarget.value, kpis.salesTarget.achievedPct].map(esc).join(','));
    lines.push(['RFQs Pending', kpis.rfqsPending.value, kpis.rfqsPending.changePct].map(esc).join(','));
    lines.push(['RFQs Quoted', kpis.rfqsQuoted.value, kpis.rfqsQuoted.note || ''].map(esc).join(','));
    lines.push(['RFQs Quoted Value', kpis.rfqsQuotedValue.value, kpis.rfqsQuotedValue.changePct].map(esc).join(','));
    lines.push(['Close Rate (%)', kpis.closeRate.value, kpis.closeRate.changePct].map(esc).join(','));
    lines.push('');

    lines.push('Sales Overview');
    lines.push(['Item', 'Qty', 'Value', 'Trend'].map(esc).join(','));
    overview.forEach((r) => lines.push([r.label, r.qty, r.value, r.trend].map(esc).join(',')));
    lines.push('');

    lines.push('Product vs Industry');
    lines.push(['Label', 'Percent'].map(esc).join(','));
    productVsIndustry.forEach((p) => lines.push([p.label, `${p.pct}%`].map(esc).join(',')));
    lines.push('');

    lines.push(`Sales By ${salesByDimension}`);
    lines.push(['Name', 'Value'].map(esc).join(','));
    salesByBars.forEach((b) => lines.push([b.name, b.value].map(esc).join(',')));
    lines.push('');

    lines.push('Potential Deals');
    lines.push(['Title', 'Company', 'Closing', 'Value', 'Priority', 'Probability'].map(esc).join(','));
    potentialDeals.forEach((d) =>
      lines.push([d.title, d.company, d.closing, d.value, d.priority, d.prob].map(esc).join(','))
    );
    lines.push('');

    lines.push('RFQ Aging & SLA');
    lines.push(['Range', 'Count'].map(esc).join(','));
    rfqAging.forEach((r) => lines.push([r.range, r.count].map(esc).join(',')));
    lines.push('');

    lines.push('Source Mix');
    lines.push(['Source', 'Percent', 'Count'].map(esc).join(','));
    lines.push(['Online', `${sourceMixOnlinePct}%`, sourceMix?.online.count ?? 0].map(esc).join(','));
    lines.push(['Offline', `${sourceMixOfflinePct}%`, sourceMix?.offline.count ?? 0].map(esc).join(','));
    lines.push('');

    lines.push('By Channel');
    lines.push(['Channel', 'Sub', 'Value'].map(esc).join(','));
    byChannel.forEach((r) => lines.push([r.label, r.sublabel || '', r.value].map(esc).join(',')));
    lines.push('');

    lines.push('Sales Report Summary (Target vs Actual)');
    lines.push(['Quarter', 'Target', 'Actual'].map(esc).join(','));
    reportSummary.forEach((r) => lines.push([r.quarter, r.target, r.actual].map(esc).join(',')));
    lines.push('');

    lines.push('Revenue Trend');
    lines.push(['Month', 'Value'].map(esc).join(','));
    (revenueTrend?.months ?? []).forEach((m) => lines.push([m.label, m.value].map(esc).join(',')));

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported as CSV');
  };

  /* ---- Loading ---- */
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#A06126] mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!data || !kpis) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-sm text-slate-500">No dashboard data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased p-6 lg:p-8 selection:bg-[#EFE8DA]">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-[#A06126] uppercase">
            CRM DASHBOARD
          </span>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
            Sales Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Everything at a glance — targets, RFQ funnel, country and product mix, and what&apos;s closing next.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Country */}
          <SelectBox
            value={countryFilter}
            onChange={setCountryFilter}
            options={[
              { value: 'All', label: 'Country: All' },
              ...availableCountries.map((c) => ({ value: c, label: c })),
            ]}
          />

          {/* Currency */}
          <SelectBox
            value={currencyFilter}
            onChange={(v) => setCurrencyFilter(v as CurrencyCode)}
            options={[
              { value: 'TK', label: 'Currency: TK' },
              { value: 'USD', label: 'Currency: USD' },
              { value: 'EUR', label: 'Currency: EUR' },
            ]}
          />

          {/* Time */}
          <SelectBox
            value={timeFilter}
            onChange={(v) => setTimeFilter(v as TimeKey)}
            options={TIME_OPTIONS.map((t) => ({ value: t, label: `Time: ${t}` }))}
          />

          <button
            onClick={() => {
              setSelectedBarInfo(null);
              setActiveDonutSegment(null);
              loadData({ silent: true });
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-white border border-[#E2DBD1] shadow-2xs hover:bg-slate-50 transition text-slate-700 disabled:opacity-60"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-[#A06126] text-white shadow-2xs hover:bg-[#88501E] transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* ⭐ Silent refresh overlay */}
      {refreshing && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0F2D4A] text-white text-[11px] font-semibold shadow-lg animate-in fade-in duration-150">
          <Loader2 className="w-3 h-3 animate-spin" />
          Refreshing…
        </div>
      )}

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div className="pb-3 border-b border-[#F0EBE3]">
            <p className="text-xs text-slate-500 font-medium">Today&apos;s Sales</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              {fmtCurrency(kpis.todaySales.value)}
            </h2>
            <div className={`text-[11px] font-semibold mt-1 ${kpis.todaySales.changePct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {kpis.todaySales.changePct >= 0 ? '▲' : '▼'} {fmtPct(kpis.todaySales.changePct)} vs yesterday
            </div>
          </div>
          <div className="pt-3">
            <p className="text-xs text-slate-500 font-medium">Total Sales (YTD)</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              {fmtCurrency(kpis.totalSalesYtd.value)}
            </h2>
            <div className={`text-[11px] font-semibold mt-1 ${kpis.totalSalesYtd.changePct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {kpis.totalSalesYtd.changePct >= 0 ? '▲' : '▼'} {fmtPct(kpis.totalSalesYtd.changePct)} vs last year
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Sales Target</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              {fmtCurrency(kpis.salesTarget.value)}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">FY26 annual target</p>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-slate-500">Sales Achievement</span>
              <span className="text-emerald-700 font-bold">{kpis.salesTarget.achievedPct}%</span>
            </div>
            <div className="w-full bg-[#EFECE6] rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(kpis.salesTarget.achievedPct, 100)}%` }}
              />
            </div>
            <div className={`text-[11px] font-semibold mt-2 ${kpis.salesTarget.changePct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {kpis.salesTarget.changePct >= 0 ? '▲' : '▼'} {Math.abs(kpis.salesTarget.changePct)}% vs last quarter
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div className="pb-3 border-b border-[#F0EBE3]">
            <p className="text-xs text-slate-500 font-medium">RFQs Pending</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              {kpis.rfqsPending.value}
            </h2>
            <div className={`text-[11px] font-semibold mt-1 ${kpis.rfqsPending.changePct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {kpis.rfqsPending.changePct >= 0 ? '▲' : '▼'} {Math.abs(kpis.rfqsPending.changePct)}% vs last month
            </div>
          </div>
          <div className="pt-3">
            <p className="text-xs text-slate-500 font-medium">RFQs Quoted</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              {kpis.rfqsQuoted.value}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              {kpis.rfqsQuoted.note || 'No quotes issued this period'}
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">RFQs Quoted Value</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              {fmtCurrency(kpis.rfqsQuotedValue.value)}
            </h2>
            <div className={`text-[11px] font-semibold mt-1 ${kpis.rfqsQuotedValue.changePct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {kpis.rfqsQuotedValue.changePct >= 0 ? '▲' : '▼'} {Math.abs(kpis.rfqsQuotedValue.changePct)}% vs last quarter
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0EBE3]">
            <p className="text-xs text-slate-500 font-medium">Close Rate (Potential)</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-serif font-bold text-[#A06126]">{kpis.closeRate.value}%</span>
              <span className={`text-[11px] font-semibold ${kpis.closeRate.changePct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {kpis.closeRate.changePct >= 0 ? '↑' : '↓'} {Math.abs(kpis.closeRate.changePct)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Sales Overview */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">SALES OVERVIEW</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-[#F0EBE3] pb-2 text-left">
                  <th className="font-semibold pb-2">ITEMS</th>
                  <th className="font-semibold pb-2 text-center">QTY</th>
                  <th className="font-semibold pb-2 text-right">VALUE</th>
                  <th className="font-semibold pb-2 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F4EF]">
                {overview.map((row) => (
                  <tr key={row.label}>
                    <td className={`py-2.5 text-slate-700 font-medium ${row.link ? 'hover:underline cursor-pointer' : ''}`}>
                      {row.label}
                    </td>
                    <td className="py-2.5 text-center font-mono">{row.qty}</td>
                    <td className="py-2.5 text-right font-mono font-medium">{fmtCurrency(row.value)}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded ${row.trend === 'up'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.trend === 'down'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                      >
                        {row.trend === 'up' ? 'Up ↑' : row.trend === 'down' ? 'Down ↓' : 'Steady'}
                      </span>
                    </td>
                  </tr>
                ))}
                {overview.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400 text-[11px]">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pt-3 border-t border-[#F0EBE3] text-[11px] text-slate-400 mt-2">
            RFQs and Tenders link through to their own dashboards →
          </div>
        </div>

        {/* Product vs Industry */}
        <div className="lg:col-span-3 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase mb-3">
              PRODUCT VS INDUSTRY
            </h3>
            <div className="flex justify-center my-3 relative">
              <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90">
                {donutSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="50" cy="50" r="35"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="15"
                    strokeDasharray={`${seg.dash} ${DONUT_C}`}
                    strokeDashoffset={-seg.offset}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseEnter={() => setActiveDonutSegment(`${seg.label}: ${seg.pct}%`)}
                    onMouseLeave={() => setActiveDonutSegment(null)}
                  />
                ))}
              </svg>
            </div>
            <div className="space-y-2 mt-4 text-xs">
              {productVsIndustry.map((seg) => (
                <div
                  key={seg.label}
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-0.5 rounded"
                  onMouseEnter={() => setActiveDonutSegment(`${seg.label}: ${seg.pct}%`)}
                  onMouseLeave={() => setActiveDonutSegment(null)}
                >
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-xs" style={{ background: seg.color }} /> {seg.label}
                  </span>
                  <span className="font-mono font-medium">{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-center text-[#A06126] font-medium h-4 mt-2">
            {activeDonutSegment || ''}
          </div>
        </div>

        {/* Sales By */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">SALES BY</h3>
              <SelectBox
                value={salesByDimension}
                onChange={(v) => setSalesByDimension(v as DimensionKey)}
                options={DIMENSIONS.map((d) => ({ value: d, label: d }))}
                compact
              />
            </div>

            <div className="h-44 flex items-end justify-between gap-3 px-2 pt-4">
              {(() => {
                const max = Math.max(...salesByBars.map((b) => b.value), 1);
                return salesByBars.map((item) => {
                  const hPct = Math.max((item.value / max) * 100, 5);
                  return (
                    <div
                      key={item.name}
                      onClick={() => setSelectedBarInfo(`${item.name}: ${fmtCurrency(item.value)}`)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      <div
                        className="w-full rounded-t-sm transition-all duration-300 group-hover:brightness-90 group-hover:scale-y-102 origin-bottom"
                        style={{ height: `${hPct}%`, background: item.color }}
                      />
                      <span className="text-[11px] text-slate-500 mt-2 truncate w-full text-center">
                        {item.name}
                      </span>
                    </div>
                  );
                });
              })()}
              {salesByBars.length === 0 && (
                <p className="w-full text-center text-[11px] text-slate-400">No data for this period</p>
              )}
            </div>
          </div>
          <div className="text-[11px] text-[#A06126] font-medium mt-4">
            {selectedBarInfo
              ? `Selected: ${selectedBarInfo}`
              : `Click a bar to see individual sales data by ${salesByDimension.toLowerCase()}.`}
          </div>
        </div>
      </div>

      {/* ROW 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
              POTENTIAL DEAL CLOSING
            </h3>
            <button className="text-xs text-[#A06126] hover:underline font-semibold flex items-center gap-1">
              <span>View Tenders</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {potentialDeals.map((deal) => (
              <div
                key={deal.id}
                onClick={() => setSelectedDeal(deal)}
                className="p-3 hover:bg-[#FDFBF7] rounded-lg transition border-b border-[#F0EBE3] cursor-pointer flex justify-between items-center"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#0F2D4A]">{deal.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Company: {deal.company} · {deal.closing} · {deal.value}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-full shrink-0 ${deal.level === 'high'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                >
                  {deal.priority}
                </span>
              </div>
            ))}
            {potentialDeals.length === 0 && (
              <p className="text-[11px] text-slate-400 text-center py-4">No deals closing soon.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                RFQ AGING &amp; SLA
              </h3>
              <button className="text-xs text-[#A06126] hover:underline font-semibold flex items-center gap-1">
                <span>Full RFQ Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs">
              {(() => {
                const totalCount = rfqAging.reduce((s, r) => s + r.count, 0) || 1;
                return rfqAging.map((sla) => {
                  const widthPct = (sla.count / totalCount) * 100;
                  return (
                    <div key={sla.range} className="flex items-center gap-4 border-b border-[#F0EBE3] pb-4">
                      <span className="w-20 text-slate-600 font-medium shrink-0">{sla.range}</span>
                      <div className="flex-1 bg-[#EFECE6] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${widthPct}%`, background: sla.color }}
                        />
                      </div>
                      <span className="w-5 text-right font-mono font-bold text-slate-700">{sla.count}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          <div className="pt-3 border-t border-[#F0EBE3] text-[11px] text-slate-400 mt-4">
            {rfqAging.find((r) => r.range.includes('16'))?.count || 0} RFQs are past the 15-day SLA and risk going cold.
          </div>
        </div>
      </div>

      {/* ROW 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase mb-4">
              QUERY SOURCE MIX — ONLINE VS OFFLINE (FY26)
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50" cy="50" r="35" fill="none"
                    stroke="#1F3864" strokeWidth="16"
                    strokeDasharray={`${(sourceMixOnlinePct / 100) * 220} 220`}
                  />
                  <circle
                    cx="50" cy="50" r="35" fill="none"
                    stroke="#A06126" strokeWidth="16"
                    strokeDasharray={`${(sourceMixOfflinePct / 100) * 220} 220`}
                    strokeDashoffset={-((sourceMixOnlinePct / 100) * 220)}
                  />
                </svg>
              </div>
              <div className="flex-1 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#1F3864]" /> Online (Web RFQ)
                  </span>
                  <span className="font-mono font-semibold">
                    {sourceMixOnlinePct}% · {sourceMix?.online.count ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#A06126]" /> Offline (Salesman)
                  </span>
                  <span className="font-mono font-semibold">
                    {sourceMixOfflinePct}% · {sourceMix?.offline.count ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-[#F0EBE3] text-[11px] text-slate-400 mt-4">
            Across all RFQs, online queries, and forecast entries logged this year.
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase mb-4">BY CHANNEL</h3>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-[#F7F4EF]">
                {byChannel.map((row) => (
                  <tr key={row.label}>
                    <td className="py-2.5 text-slate-700">
                      {row.label}
                      {row.sublabel && <span className="text-slate-400"> ({row.sublabel})</span>}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-800">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pt-3 border-t border-[#F0EBE3] flex items-center gap-4 text-xs font-semibold text-[#A06126] mt-4">
            <span className="hover:underline cursor-pointer">RFQ Dashboard →</span>
            <span className="hover:underline cursor-pointer">Online CRM →</span>
            <span className="hover:underline cursor-pointer">Sales Forecast →</span>
          </div>
        </div>
      </div>

      {/* ROW 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase mb-2">
              SALES REPORT SUMMARY (ACTUAL VS TARGET)
            </h3>
            <div className="flex gap-4 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#C7CEDC] rounded-xs" /> Target
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#1FAB6F] rounded-xs" /> Actual
              </span>
            </div>
            <div className="h-44 flex items-end justify-around gap-4 pt-4 px-2">
              {(() => {
                const max = Math.max(
                  ...reportSummary.flatMap((r) => [r.target, r.actual]),
                  1
                );
                return reportSummary.map((q) => (
                  <div key={q.quarter} className="flex items-end gap-1.5 h-full flex-1 justify-center">
                    <div className="flex flex-col items-center h-full justify-end flex-1 max-w-[42px]">
                      <div
                        className="w-full bg-[#C7CEDC] rounded-t-sm"
                        style={{ height: `${(q.target / max) * 100}%` }}
                      />
                      <span className="text-[10px] text-slate-400 mt-1">{q.quarter} Target</span>
                    </div>
                    <div className="flex flex-col items-center h-full justify-end flex-1 max-w-[42px]">
                      <div
                        className="w-full bg-[#1FAB6F] rounded-t-sm"
                        style={{ height: `${(q.actual / max) * 100}%` }}
                      />
                      <span className="text-[10px] text-slate-400 mt-1">{q.quarter} Actual</span>
                    </div>
                  </div>
                ));
              })()}
              {reportSummary.length === 0 && (
                <p className="w-full text-center text-[11px] text-slate-400">
                  No report data for this period
                </p>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-[#F0EBE3] text-[11px] text-slate-400 mt-3">
            Avg. deal size {fmtCompact(
              kpis.rfqsQuotedValue.value / Math.max(kpis.rfqsQuoted.value || 1, 1)
            )} this year · Avg. sales cycle 18 days
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                REVENUE TREND (LAST 12 MONTHS)
              </h3>
              {hoveredMonth && (
                <span className="text-[11px] font-semibold text-[#A06126]">{hoveredMonth}</span>
              )}
            </div>
            <div className="h-44 relative flex flex-col justify-end pt-2">
              <svg viewBox="0 0 500 120" preserveAspectRatio="none" className="w-full h-32 overflow-visible">
                <defs>
                  <linearGradient id="revenueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A06126" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#A06126" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const months = revenueTrend?.months ?? [];
                  if (!months.length) return null;
                  const max = Math.max(...months.map((m) => m.value), 1);
                  const stepX = 500 / Math.max(months.length - 1, 1);
                  const points = months.map((m, i) => {
                    const x = i * stepX;
                    const y = 110 - (m.value / max) * 90;
                    return [x, y] as const;
                  });
                  const linePath = points
                    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
                    .join(' ');
                  const areaPath = `${linePath} L 500 120 L 0 120 Z`;
                  return (
                    <>
                      <path d={areaPath} fill="url(#revenueGrad)" />
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#0F2D4A"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <line x1="0" y1="119" x2="500" y2="119" stroke="#E2E8F0" strokeWidth="1" />
                    </>
                  );
                })()}
              </svg>
              <div className="flex justify-between text-xs text-slate-500 font-serif pt-2 px-1">
                {(revenueTrend?.months ?? []).map((item) => (
                  <span
                    key={item.label}
                    className="cursor-pointer hover:text-[#A06126] transition"
                    onMouseEnter={() => setHoveredMonth(`${item.label}: ${fmtCompact(item.value)}`)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className={`pt-3 border-t border-[#F0EBE3] text-[11px] font-semibold mt-2 ${(revenueTrend?.growthPct ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {(revenueTrend?.growthPct ?? 0) >= 0 ? '▲' : '▼'}{' '}
            {Math.abs(revenueTrend?.growthPct ?? 0)}% growth over the trailing 12 months
          </div>
        </div>
      </div>

      {/* DEAL MODAL */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#EBE6DF] relative">
            <button
              onClick={() => setSelectedDeal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold tracking-wider text-[#A06126] uppercase">
              Deal Overview
            </span>
            <h3 className="text-lg font-serif font-bold text-[#0F2D4A] mt-1">
              {selectedDeal.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Company: {selectedDeal.company} · {selectedDeal.closing}
            </p>
            <div className="space-y-2.5 text-xs divide-y divide-slate-100">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Value</span>
                <span className="font-mono font-bold text-[#0F2D4A]">{selectedDeal.value}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Closing Probability</span>
                <span className="font-semibold text-emerald-600">{selectedDeal.prob}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Priority Level</span>
                <span className="font-medium text-slate-800">{selectedDeal.priority}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDeal(null)}
                className="px-4 py-1.5 rounded-lg bg-[#A06126] text-white text-xs font-semibold hover:bg-[#88501E]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="relative bg-[#A06126] hover:bg-[#88501E] text-white p-3.5 rounded-full shadow-xl transition transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
          aria-label="Messages"
        >
          <MessageSquare className="w-5 h-5 fill-white" />
          <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
            3
          </span>
        </button>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   SelectBox
----------------------------------------------------------- */
function SelectBox({
  value,
  onChange,
  options,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  compact?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          compact
            ? 'appearance-none bg-[#F9F7F2] border border-[#E2DBD1] text-xs font-medium rounded-md pl-2.5 pr-6 py-1 focus:outline-none cursor-pointer'
            : 'appearance-none bg-white border border-[#E2DBD1] text-xs font-medium rounded-lg pl-3 pr-7 py-2 text-slate-700 shadow-2xs focus:outline-none cursor-pointer'
        }
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`${compact ? 'w-3 h-3 right-1.5' : 'w-3.5 h-3.5 right-2.5'
          } absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`}
      />
    </div>
  );
}