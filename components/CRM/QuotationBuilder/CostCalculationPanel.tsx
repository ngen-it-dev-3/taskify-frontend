'use client';

import React from 'react';

interface Props {
  calc: {
    costOfGoods: number;
    remittanceOfficeExp: number;
    customsFreight: number;
    commissionOthers: number;
    netProfit: number;
    taxVatGst: number;
    subTotal: number;
    customerPrice: number;
  };
}

export default function CostCalculationPanel({ calc }: Props) {
  return (
    <div className="bg-[#0F2D4A] rounded-xl p-5 text-white shadow-2xs">
      <h3 className="text-[11px] font-bold tracking-wider text-white uppercase mb-4">
        Cost Calculation
      </h3>

      <div className="divide-y divide-white/10">
        <Row label="Cost of Goods" value={calc.costOfGoods} />
        <Row label="Remittance + Office Expenses" value={calc.remittanceOfficeExp} />
        <Row label="Customs / C&F + Freight / Logistics" value={calc.customsFreight} />
        <Row label="Commission / Others" value={calc.commissionOthers} />
        <Row label="Net Profit" value={calc.netProfit} />
        <Row label="Tax/VAT/GST" value={calc.taxVatGst} />
        <Row label="Total" value={calc.subTotal} bold />
        <Row label="Customer Price" value={calc.customerPrice} bold gold />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  gold,
}: {
  label: string;
  value: number;
  bold?: boolean;
  gold?: boolean;
}) {
  return (
    <div className="py-3 flex items-center justify-between">
      <span className="text-xs text-white/70">{label}</span>
      <span
        className={`font-mono ${
          gold
            ? 'text-[#F0B85A] font-bold text-sm'
            : bold
            ? 'text-white font-bold'
            : 'text-white'
        }`}
      >
        ৳{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}