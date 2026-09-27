'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  RotateCw,
  Download,
  ArrowRight,
  MessageSquare,
  X
} from 'lucide-react';

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

const dealsData: DealItem[] = [
  {
    id: '25112-1',
    title: '25112-1 (Bangladeshi-Industrial)',
    company: 'Acme Corp',
    closing: 'Closing in 1 Week',
    value: '৳12,000',
    priority: 'High Priority (90%)',
    prob: '90%',
    level: 'high',
  },
  {
    id: '25009-1',
    title: '25009-1 (World University)',
    company: 'Global Ed-Tech',
    closing: 'Closing in 3 Weeks',
    value: '৳5,000',
    priority: 'Medium Priority (65%)',
    prob: '65%',
    level: 'med',
  },
  {
    id: 'rupali-bank',
    title: 'Rupali Bank Ltd. — Network Security Appliance',
    company: 'Rupali Bank Ltd.',
    closing: 'Closing in 5 Days',
    value: '৳11,20,000',
    priority: 'High Priority (82%)',
    prob: '82%',
    level: 'high',
  },
];

export default function SalesDashboardPage() {
  // Global Filters
  const [countryFilter, setCountryFilter] = useState('All');
  const [currencyFilter, setCurrencyFilter] = useState('TK');
  const [timeFilter, setTimeFilter] = useState('Q1');

  // Widget specific states
  const [overviewCountry, setOverviewCountry] = useState('Singapore');
  const [salesByDimension, setSalesByDimension] = useState('Country');
  const [selectedBarInfo, setSelectedBarInfo] = useState<string | null>(null);
  const [activeDonutSegment, setActiveDonutSegment] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);

  // Revenue chart hovered month
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased p-6 lg:p-8 selection:bg-[#EFE8DA]">
      {/* ----------------- HEADER & CONTROLS ----------------- */}
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

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Country Selector */}
          <div className="relative">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="appearance-none bg-white border border-[#E2DBD1] text-xs font-medium rounded-lg pl-3 pr-7 py-2 text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
            >
              <option value="All">Country: All</option>
              <option value="Bangladesh">Bangladesh</option>
              <option value="Singapore">Singapore</option>
              <option value="India">India</option>
              <option value="USA">USA</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Currency Selector */}
          <div className="relative">
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="appearance-none bg-white border border-[#E2DBD1] text-xs font-medium rounded-lg pl-3 pr-7 py-2 text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
            >
              <option value="TK">Currency: TK</option>
              <option value="USD">Currency: USD</option>
              <option value="EUR">Currency: EUR</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Time Selector */}
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none bg-white border border-[#E2DBD1] text-xs font-medium rounded-lg pl-3 pr-7 py-2 text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
            >
              <option value="Q1">Time: Q1</option>
              <option value="Q2">Time: Q2</option>
              <option value="Q3">Time: Q3</option>
              <option value="Q4">Time: Q4</option>
              <option value="FY26">Time: FY26</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setSelectedBarInfo(null);
              setActiveDonutSegment(null);
            }}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-white border border-[#E2DBD1] shadow-2xs hover:bg-slate-50 transition text-slate-700"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          {/* Export Button */}
          <button className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-[#A06126] text-white shadow-2xs hover:bg-[#88501E] transition">
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* ----------------- ROW 1: TOP STAT CARDS ----------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Today's Sales & Total Sales */}
        <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div className="pb-3 border-b border-[#F0EBE3]">
            <p className="text-xs text-slate-500 font-medium">Today&apos;s Sales</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              ৳45,000
            </h2>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">
              ▲ 8.5% vs yesterday
            </div>
          </div>
          <div className="pt-3">
            <p className="text-xs text-slate-500 font-medium">Total Sales (YTD)</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              ৳58,00,000
            </h2>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">
              ▲ 12.4% vs last year
            </div>
          </div>
        </div>

        {/* Card 2: Sales Target & Achievement */}
        <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Sales Target</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              ৳65,00,000
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">FY26 annual target</p>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-slate-500">Sales Achievement</span>
              <span className="text-emerald-700 font-bold">89%</span>
            </div>
            <div className="w-full bg-[#EFECE6] rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: '89%' }}
              />
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-2">
              ▲ 3.1% vs last quarter
            </div>
          </div>
        </div>

        {/* Card 3: RFQs Pending & Quoted */}
        <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div className="pb-3 border-b border-[#F0EBE3]">
            <p className="text-xs text-slate-500 font-medium">RFQs Pending</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              28
            </h2>
            <div className="text-[11px] font-semibold text-rose-500 mt-1">
              ▼ 37.5% vs last month
            </div>
          </div>
          <div className="pt-3">
            <p className="text-xs text-slate-500 font-medium">RFQs Quoted</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              0
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">No quotes issued this period</p>
          </div>
        </div>

        {/* Card 4: RFQs Quoted Value & Close Rate */}
        <div className="bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">RFQs Quoted Value</p>
            <h2 className="text-2xl font-serif font-bold text-[#0F2D4A] tracking-tight mt-0.5">
              ৳1,25,00,000
            </h2>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">
              ▲ 9.8% vs last quarter
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0EBE3]">
            <p className="text-xs text-slate-500 font-medium">Close Rate (Potential)</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-serif font-bold text-[#A06126]">45%</span>
              <span className="text-[11px] font-semibold text-emerald-600">↑ 3.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- ROW 2: OVERVIEW TABLE, DONUT, & BAR CHART ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Sales Overview Table (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                SALES OVERVIEW
              </h3>
              <div className="relative">
                <select
                  value={overviewCountry}
                  onChange={(e) => setOverviewCountry(e.target.value)}
                  className="appearance-none bg-[#F9F7F2] border border-[#E2DBD1] text-xs font-medium rounded-md pl-2.5 pr-6 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="Singapore">Singapore</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
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
                <tr>
                  <td className="py-2.5 text-slate-700 font-medium">Closed</td>
                  <td className="py-2.5 text-center font-mono">5</td>
                  <td className="py-2.5 text-right font-mono font-medium">৳5,00,000</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Up ↑
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-700 font-medium">Potentials</td>
                  <td className="py-2.5 text-center font-mono">8</td>
                  <td className="py-2.5 text-right font-mono font-medium">৳1,20,000</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                      Steady
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-700 font-medium hover:underline cursor-pointer">
                    RFQs →
                  </td>
                  <td className="py-2.5 text-center font-mono">15</td>
                  <td className="py-2.5 text-right font-mono font-medium">৳5,50,000</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-50 text-rose-700 border border-rose-200">
                      Down ↓
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-700 font-medium hover:underline cursor-pointer">
                    Tenders →
                  </td>
                  <td className="py-2.5 text-center font-mono">3</td>
                  <td className="py-2.5 text-right font-mono font-medium">৳90,000</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                      Steady
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-700 font-medium">Lost</td>
                  <td className="py-2.5 text-center font-mono">2</td>
                  <td className="py-2.5 text-right font-mono font-medium">৳15,000</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                      Steady
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-[#F0EBE3] text-[11px] text-slate-400 mt-2">
            RFQs and Tenders link through to their own dashboards →
          </div>
        </div>

        {/* Product vs Industry (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase mb-3">
              PRODUCT VS INDUSTRY
            </h3>

            {/* Interactive SVG Donut */}
            <div className="flex justify-center my-3 relative">
              <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="#5B4FD6"
                  strokeWidth="15"
                  strokeDasharray="76.9 220"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={() => setActiveDonutSegment('Telecom: 35%')}
                  onMouseLeave={() => setActiveDonutSegment(null)}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="#1FAB6F"
                  strokeWidth="15"
                  strokeDasharray="65.9 220"
                  strokeDashoffset="-76.9"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={() => setActiveDonutSegment('Manufacturing: 30%')}
                  onMouseLeave={() => setActiveDonutSegment(null)}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="#E6A020"
                  strokeWidth="15"
                  strokeDasharray="43.9 220"
                  strokeDashoffset="-142.8"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={() => setActiveDonutSegment('Education: 20%')}
                  onMouseLeave={() => setActiveDonutSegment(null)}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="#C7CEDC"
                  strokeWidth="15"
                  strokeDasharray="33 220"
                  strokeDashoffset="-186.7"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={() => setActiveDonutSegment('Other: 15%')}
                  onMouseLeave={() => setActiveDonutSegment(null)}
                />
              </svg>
            </div>

            {/* Legend & Breakdown */}
            <div className="space-y-2 mt-4 text-xs">
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-0.5 rounded"
                onMouseEnter={() => setActiveDonutSegment('Telecom: 35%')}
                onMouseLeave={() => setActiveDonutSegment(null)}
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#5B4FD6]" /> Telecom
                </span>
                <span className="font-mono font-medium">35%</span>
              </div>
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-0.5 rounded"
                onMouseEnter={() => setActiveDonutSegment('Manufacturing: 30%')}
                onMouseLeave={() => setActiveDonutSegment(null)}
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#1FAB6F]" /> Manufacturing
                </span>
                <span className="font-mono font-medium">30%</span>
              </div>
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-0.5 rounded"
                onMouseEnter={() => setActiveDonutSegment('Education: 20%')}
                onMouseLeave={() => setActiveDonutSegment(null)}
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#E6A020]" /> Education
                </span>
                <span className="font-mono font-medium">20%</span>
              </div>
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-0.5 rounded"
                onMouseEnter={() => setActiveDonutSegment('Other: 15%')}
                onMouseLeave={() => setActiveDonutSegment(null)}
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#C7CEDC]" /> Other
                </span>
                <span className="font-mono font-medium">15%</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-center text-[#A06126] font-medium h-4 mt-2">
            {activeDonutSegment || ''}
          </div>
        </div>

        {/* Sales By (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                SALES BY
              </h3>
              <div className="relative">
                <select
                  value={salesByDimension}
                  onChange={(e) => setSalesByDimension(e.target.value)}
                  className="appearance-none bg-[#F9F7F2] border border-[#E2DBD1] text-xs font-medium rounded-md pl-2.5 pr-6 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="Country">Country</option>
                  <option value="Industry">Industry</option>
                  <option value="Product">Product</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Clickable Histogram Bars */}
            <div className="h-44 flex items-end justify-between gap-3 px-2 pt-4">
              {[
                { name: 'Bangladesh', val: '৳11,50,000', h: '95%', color: 'bg-[#5B4FD6]' },
                { name: 'Singapore', val: '৳8,20,000', h: '70%', color: 'bg-[#1FAB6F]' },
                { name: 'India', val: '৳5,30,000', h: '50%', color: 'bg-[#E6A020]' },
                { name: 'USA', val: '৳4,50,000', h: '38%', color: 'bg-[#E0524C]' },
                { name: 'Germany', val: '৳1,90,000', h: '18%', color: 'bg-[#9AA5B1]' },
              ].map((item) => (
                <div
                  key={item.name}
                  onClick={() => setSelectedBarInfo(`${item.name}: ${item.val}`)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  <div
                    className={`w-full ${item.color} rounded-t-sm transition-all duration-300 group-hover:brightness-90 group-hover:scale-y-102 origin-bottom`}
                    style={{ height: item.h }}
                  />
                  <span className="text-[11px] text-slate-500 mt-2 truncate w-full text-center">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-[#A06126] font-medium mt-4">
            {selectedBarInfo
              ? `Selected: ${selectedBarInfo}`
              : 'Click a bar to see individual sales data for that country.'}
          </div>
        </div>
      </div>

      {/* ----------------- ROW 3: POTENTIAL DEALS & RFQ AGING ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Potential Deal Closing */}
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
            {dealsData.map((deal) => (
              <div
                key={deal.id}
                onClick={() => setSelectedDeal(deal)}
                className="p-3 hover:bg-[#FDFBF7] rounded-lg transition border border-transparent hover:border-[#EBE6DF] cursor-pointer flex justify-between items-center"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#0F2D4A]">{deal.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Company: {deal.company} · {deal.closing} · {deal.value}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-full shrink-0 ${
                    deal.level === 'high'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {deal.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RFQ Aging & SLA */}
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
              {[
                { range: '0–5 Days', count: 9, width: '32%', color: 'bg-emerald-600' },
                { range: '6–10 Days', count: 7, width: '25%', color: 'bg-[#A06126]' },
                { range: '11–15 Days', count: 6, width: '21%', color: 'bg-amber-600' },
                { range: '16+ Days', count: 6, width: '21%', color: 'bg-rose-600' },
              ].map((sla) => (
                <div key={sla.range} className="flex items-center gap-4">
                  <span className="w-20 text-slate-600 font-medium shrink-0">{sla.range}</span>
                  <div className="flex-1 bg-[#EFECE6] rounded-full h-2 overflow-hidden">
                    <div
                      className={`${sla.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: sla.width }}
                    />
                  </div>
                  <span className="w-5 text-right font-mono font-bold text-slate-700">
                    {sla.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EBE3] text-[11px] text-slate-400 mt-4">
            6 RFQs are past the 15-day SLA and risk going cold.
          </div>
        </div>
      </div>

      {/* ----------------- ROW 4: SOURCE MIX & BY CHANNEL ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Query Source Mix */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase mb-4">
              QUERY SOURCE MIX — ONLINE VS OFFLINE (FY26)
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#1F3864"
                    strokeWidth="16"
                    strokeDasharray="138 220"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#A06126"
                    strokeWidth="16"
                    strokeDasharray="82 220"
                    strokeDashoffset="-138"
                  />
                </svg>
              </div>

              <div className="flex-1 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#1F3864]" /> Online (Web RFQ)
                  </span>
                  <span className="font-mono font-semibold">63% · 142</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#A06126]" /> Offline (Salesman)
                  </span>
                  <span className="font-mono font-semibold">37% · 84</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EBE3] text-[11px] text-slate-400 mt-4">
            Across all RFQs, online queries, and forecast entries logged this year.
          </div>
        </div>

        {/* By Channel */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase mb-4">
              BY CHANNEL
            </h3>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-[#F7F4EF]">
                <tr>
                  <td className="py-2.5 text-slate-700">
                    RFQ Intake <span className="text-slate-400">(RFQ Dashboard)</span>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-800">
                    28 Online · 0 Manual
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-700">
                    Active Online Queries <span className="text-slate-400">(Online CRM)</span>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-800">
                    11
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-700">
                    Forecast Entries <span className="text-slate-400">(Sales Forecast)</span>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-800">
                    1 Online · 2 Offline
                  </td>
                </tr>
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

      {/* ----------------- ROW 5: SUMMARY & REVENUE TREND ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Sales Report Summary (Actual vs Target) */}
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
              {[
                { quarter: 'Q1', targetH: '93%', actualH: '80%' },
                { quarter: 'Q2', targetH: '90%', actualH: '74%' },
                { quarter: 'Q3', targetH: '100%', actualH: '87%' },
              ].map((q) => (
                <div key={q.quarter} className="flex items-end gap-1.5 h-full flex-1 justify-center">
                  <div className="flex flex-col items-center h-full justify-end flex-1 max-w-[42px]">
                    <div className="w-full bg-[#C7CEDC] rounded-t-sm" style={{ height: q.targetH }} />
                    <span className="text-[10px] text-slate-400 mt-1">{q.quarter} Target</span>
                  </div>
                  <div className="flex flex-col items-center h-full justify-end flex-1 max-w-[42px]">
                    <div className="w-full bg-[#1FAB6F] rounded-t-sm" style={{ height: q.actualH }} />
                    <span className="text-[10px] text-slate-400 mt-1">{q.quarter} Actual</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EBE3] text-[11px] text-slate-400 mt-3">
            Avg. deal size ৳1,16,000 this year · Avg. sales cycle 18 days
          </div>
        </div>

        {/* Revenue Trend (Last 12 Months) */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-[#EBE6DF] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                REVENUE TREND (LAST 12 MONTHS)
              </h3>
              {hoveredMonth && (
                <span className="text-[11px] font-semibold text-[#A06126]">
                  {hoveredMonth}
                </span>
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
                {/* Gradient area */}
                <path
                  d="M 0 95 Q 60 70 100 80 T 200 65 T 300 75 T 400 45 T 470 50 L 500 30 L 500 120 L 0 120 Z"
                  fill="url(#revenueGrad)"
                />
                {/* Trend line */}
                <path
                  d="M 0 95 Q 60 70 100 80 T 200 65 T 300 75 T 400 45 T 470 50 L 500 30"
                  fill="none"
                  stroke="#0F2D4A"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <line x1="0" y1="119" x2="500" y2="119" stroke="#E2E8F0" strokeWidth="1" />
              </svg>

              {/* Month markers with hover */}
              <div className="flex justify-between text-xs text-slate-500 font-serif pt-2 px-1">
                {[
                  { m: 'Oct', val: '৳14.2L' },
                  { m: 'Dec', val: '৳16.8L' },
                  { m: 'Feb', val: '৳19.5L' },
                  { m: 'Apr', val: '৳22.1L' },
                  { m: 'Jun', val: '৳25.4L' },
                  { m: 'Aug Sep*', val: '৳31.2L' },
                ].map((item) => (
                  <span
                    key={item.m}
                    className="cursor-pointer hover:text-[#A06126] transition"
                    onMouseEnter={() => setHoveredMonth(`${item.m}: ${item.val}`)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {item.m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EBE3] text-[11px] font-semibold text-emerald-600 mt-2">
            ▲ 21.6% growth over the trailing 12 months
          </div>
        </div>
      </div>

      {/* ----------------- DEAL DETAILS MODAL ----------------- */}
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

      {/* Floating Chat Bubble */}
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