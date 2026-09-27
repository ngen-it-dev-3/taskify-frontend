'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { QuotationApi, type Quotation } from '@/services/quotation.service';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  awaiting_approval: 'bg-[#FFF3E0] text-[#A06126] border-[#F5D9B8]',
  sent: 'bg-[#EEF4FB] text-[#1F3864] border-[#D6E3F5]',
  won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  lost: 'bg-rose-50 text-rose-700 border-rose-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_approval: 'Awaiting Approval',
  sent: 'Sent',
  won: 'Won',
  lost: 'Lost',
  draft: 'Draft',
  expired: 'Expired',
};

export default function QuotesListTab() {
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Get all sent/won/lost quotes
        const res = await QuotationApi.list({ limit: 100 });
        setQuotes(
          res.items.filter((q) =>
            ['sent', 'won', 'lost', 'awaiting_approval'].includes(q.status)
          )
        );
      } catch (e: any) {
        toast.error(e.message || 'Failed to load quotes');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="mt-5 flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#A06126] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-5 bg-white rounded-xl border border-[#EBE6DF] shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white border-b border-[#F0EBE3]">
            <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold text-left">
              <th className="px-6 py-4 w-[180px]">Quote Ref</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4 w-[140px]">Sent</th>
              <th className="px-6 py-4 w-[160px]">Value</th>
              <th className="px-6 py-4 w-[180px]">Status</th>
              <th className="px-6 py-4 w-[80px] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE3]">
            {quotes.map((q) => (
              <tr key={q.id} className="hover:bg-[#FDFBF7] group">
                <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                  {q.pqNumber}
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {q.client?.company || '—'}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {q.sentAt
                    ? new Date(q.sentAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })
                    : '—'}
                </td>
                <td className="px-6 py-4 font-mono text-slate-800">
                  ৳{(q.totals?.grandTotal || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border ${
                      STATUS_COLORS[q.status]
                    }`}
                  >
                    {STATUS_LABELS[q.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/crm/quotation-builder/${q.rfqId}`;
                    }}
                    className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-slate-50 inline-flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 transition"
                    title="Open"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {quotes.length === 0 && (
        <div className="py-12 text-center text-slate-400 italic text-[12px]">
          No quotes yet
        </div>
      )}
    </div>
  );
}