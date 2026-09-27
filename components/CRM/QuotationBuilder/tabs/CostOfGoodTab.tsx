'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { QuotationLineItem, QuotationRates } from '../types';

interface Props {
  lines: QuotationLineItem[];
  calc: any;
  rates: QuotationRates;
  logistics: {
    totalDimension: string;
    clientAskedFor: string;
    productType: string;
  };
  onChangeRates: (r: QuotationRates) => void;
  onChangeLine: (id: string, patch: Partial<QuotationLineItem>) => void;
  onAddLine: () => void;
  onRemoveLine?: (id: string) => void;   // 👈 NEW
  onChangeLogistics: (l: any) => void;
}

export default function CostOfGoodTab({
  lines,
  calc,
  rates,
  logistics,
  onChangeRates,
  onChangeLine,
  onAddLine,
  onRemoveLine,   // 👈 NEW
  onChangeLogistics,
}: Props) {
  return (
    <div className="space-y-4">
      {/* ---------- RATE INPUTS ---------- */}
      <div className="bg-white rounded-xl p-4 border border-[#EBE6DF] shadow-2xs grid grid-cols-5 gap-4">
        <RateInput
          label="PRINCIPAL DISCOUNT %"
          value={rates.principalDiscountPct}
          onChange={(v) => onChangeRates({ ...rates, principalDiscountPct: v })}
        />
        <RateInput
          label="OFFICE %"
          value={rates.officePct}
          onChange={(v) => onChangeRates({ ...rates, officePct: v })}
        />
        <RateInput
          label="PROFIT %"
          value={rates.profitPct}
          onChange={(v) => onChangeRates({ ...rates, profitPct: v })}
        />
        <RateInput
          label="OTHERS / COMMISSION %"
          value={rates.othersPct}
          onChange={(v) => onChangeRates({ ...rates, othersPct: v })}
        />
        <RateInput
          label="TAX / VAT / GST %"
          value={rates.taxPct}
          onChange={(v) => onChangeRates({ ...rates, taxPct: v })}
        />
      </div>

      {/* ---------- EDITABLE TABLE ---------- */}
      <div className="bg-white rounded-xl border border-[#EBE6DF] shadow-2xs overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[1440px]">
          <thead className="bg-[#FAF8F5] border-b border-[#F0EBE3]">
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-3 py-3 text-left w-12">SI</th>
              <th className="px-3 py-3 text-left min-w-[220px]">Item</th>
              <th className="px-3 py-3 text-center w-16">Qty</th>
              <th className="px-3 py-3 text-right w-28">Principal Cost</th>
              <th className="px-3 py-3 text-right w-24">Weight (KG)</th>
              <th className="px-3 py-3 text-right w-24">Total</th>
              <th className="px-3 py-3 text-right w-24">Office</th>
              <th className="px-3 py-3 text-right w-24">Profit</th>
              <th className="px-3 py-3 text-right w-24">Others</th>
              <th className="px-3 py-3 text-right w-28">Sub Total</th>
              <th className="px-3 py-3 text-right w-24">Tax/VAT/GST</th>
              <th className="px-3 py-3 text-right w-24">EU Price</th>
              <th className="px-3 py-3 text-center w-16">Disc %</th>
              <th className="px-3 py-3 text-right w-28">Client Price</th>
              <th className="px-3 py-3 text-center w-14">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE3]">
            {lines.map((l, i) => {
              const total = l.qty * l.principalCost;
              const office = (total * rates.officePct) / 100;
              const profit = (total * rates.profitPct) / 100;
              const others = (total * rates.othersPct) / 100;
              const sub = total + office + profit + others;
              const clientPrice = sub * (1 - l.discountPct / 100);

              const isFixed = l.type === 'fixed';

              return (
                <tr key={l.id} className="hover:bg-[#FDFBF7] group">
                  <td className="px-3 py-2 text-slate-500 font-mono">
                    {isFixed ? '-' : i + 1}
                  </td>
                  <td className="px-3 py-2">
                    {isFixed ? (
                      <span className="font-medium text-slate-800">{l.name}</span>
                    ) : (
                      <input
                        value={l.name}
                        onChange={(e) => onChangeLine(l.id, { name: e.target.value })}
                        className="w-full bg-transparent border-0 focus:outline-none text-slate-800 font-medium"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      value={l.qty}
                      onChange={(e) =>
                        onChangeLine(l.id, { qty: Number(e.target.value) || 0 })
                      }
                      className="w-14 bg-transparent border-0 focus:outline-none text-center font-mono"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={l.principalCost}
                      onChange={(e) =>
                        onChangeLine(l.id, {
                          principalCost: Number(e.target.value) || 0,
                        })
                      }
                      className="w-24 bg-transparent border-0 focus:outline-none font-mono text-right"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.1"
                      value={l.weightKg}
                      onChange={(e) =>
                        onChangeLine(l.id, {
                          weightKg: Number(e.target.value) || 0,
                        })
                      }
                      className="w-20 bg-transparent border-0 focus:outline-none font-mono text-right"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-right">
                    ৳{total.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-right">
                    ৳{office.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 font-mono text-right">
                    ৳{profit.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 font-mono text-right">
                    ৳{others.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 font-mono text-right">
                    ৳{sub.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 font-mono text-right">৳0</td>
                  <td className="px-3 py-2 font-mono text-right">
                    ৳{sub.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      value={l.discountPct}
                      onChange={(e) =>
                        onChangeLine(l.id, {
                          discountPct: Number(e.target.value) || 0,
                        })
                      }
                      className="w-12 bg-transparent border-0 focus:outline-none text-center font-mono"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-[#A06126]">
                    ৳{clientPrice.toFixed(2)}
                  </td>

                  {/* ⭐ DELETE BUTTON */}
                  <td className="px-3 py-2 text-center">
                    {!isFixed ? (
                      <button
                        type="button"
                        onClick={() => onRemoveLine?.(l.id)}
                        className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-rose-50 hover:border-rose-200 inline-flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition"
                        title="Remove this item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-300 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            <tr className="bg-[#FAF8F5] font-bold">
              <td colSpan={5} className="px-3 py-3 text-right">
                Total:
              </td>
              <td className="px-3 py-3 font-mono text-right">
                ৳{calc.costOfGoods.toLocaleString()}
              </td>
              <td className="px-3 py-3 font-mono text-right">
                ৳{calc.remittanceOfficeExp.toFixed(2)}
              </td>
              <td className="px-3 py-3 font-mono text-right">
                ৳{calc.netProfit.toFixed(2)}
              </td>
              <td className="px-3 py-3 font-mono text-right">
                ৳{calc.commissionOthers.toFixed(2)}
              </td>
              <td className="px-3 py-3 font-mono text-right">
                ৳{calc.subTotal.toFixed(2)}
              </td>
              <td className="px-3 py-3 font-mono text-right">৳0</td>
              <td className="px-3 py-3 font-mono text-right">
                ৳{calc.subTotal.toFixed(2)}
              </td>
              <td></td>
              <td className="px-3 py-3 font-mono text-right text-[#A06126]">
                ৳{calc.customerPrice.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <button
          onClick={onAddLine}
          className="w-full text-left px-3 py-2.5 text-xs font-semibold text-[#A06126] hover:bg-[#FDFBF7] transition border-t border-[#F0EBE3]"
        >
          + Add Item Row
        </button>
      </div>

      {/* ---------- LOGISTICS + COST CALC ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Logistics */}
        <div className="bg-white rounded-xl border border-[#EBE6DF] shadow-2xs p-5">
          <h3 className="text-[11px] font-bold tracking-wider text-slate-600 uppercase mb-4">
            Logistics Information
          </h3>
          <div className="divide-y divide-[#F0EBE3] text-xs">
            <Row label="Total Weight">
              <span className="font-mono font-semibold text-slate-800">
                {calc.totalWeight.toFixed(1)} Kg
              </span>
            </Row>
            <Row label="Total Dimension">
              <input
                value={logistics.totalDimension}
                onChange={(e) =>
                  onChangeLogistics({ ...logistics, totalDimension: e.target.value })
                }
                className="w-32 bg-[#FDFBF7] border border-[#E2DBD1] rounded-lg px-3 py-1.5 text-xs text-right"
              />
            </Row>
            <Row label="Client Asked For">
              <select
                value={logistics.clientAskedFor}
                onChange={(e) =>
                  onChangeLogistics({ ...logistics, clientAskedFor: e.target.value })
                }
                className="w-32 bg-[#FDFBF7] border border-[#E2DBD1] rounded-lg px-3 py-1.5 text-xs"
              >
                {['CIF', 'ExW', 'Door'].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Product Type">
              <input
                value={logistics.productType}
                onChange={(e) =>
                  onChangeLogistics({ ...logistics, productType: e.target.value })
                }
                className="w-32 bg-[#FDFBF7] border border-[#E2DBD1] rounded-lg px-3 py-1.5 text-xs text-right"
              />
            </Row>
          </div>
        </div>

        {/* Cost Calculation */}
        <div className="bg-[#0F2D4A] rounded-xl p-5 text-white shadow-2xs">
          <h3 className="text-[11px] font-bold tracking-wider uppercase mb-4 text-[#F0B85A]">
            Cost Calculation
          </h3>
          <div className="divide-y divide-white/10 text-xs">
            <CalcRow label="Cost of Goods" value={calc.costOfGoods} />
            <CalcRow
              label="Remittance + Office Expenses"
              value={calc.remittanceOfficeExp}
            />
            <CalcRow
              label="Customs / C&F + Freight / Logistics"
              value={calc.customsFreight}
            />
            <CalcRow label="Commission / Others" value={calc.commissionOthers} />
            <CalcRow label="Net Profit" value={calc.netProfit} />
            <CalcRow label="Tax/VAT/GST" value={calc.taxVatGst} />
            <div className="py-3 flex items-center justify-between border-t border-white/30">
              <span className="font-bold">Total</span>
              <span className="font-mono font-bold text-base">
                ৳{calc.subTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-3 flex items-center justify-between">
              <span className="text-[#F0B85A] font-bold">Customer Price</span>
              <span className="font-mono font-bold text-lg text-[#F0B85A]">
                ৳{calc.customerPrice.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ATOMS
   ========================================================= */

function RateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
        {label}
      </div>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full bg-[#FDFBF7] border border-[#E2DBD1] text-xs rounded-lg px-3 py-2 text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-[#A06126]"
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      {children}
    </div>
  );
}

function CalcRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="py-2.5 flex items-center justify-between">
      <span className="text-white/70">{label}</span>
      <span className="font-mono">
        ৳{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}