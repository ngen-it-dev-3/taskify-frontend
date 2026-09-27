'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { QuotationApi, type Quotation } from '@/services/quotation.service';
import toast from 'react-hot-toast';

export default function DraftsListTab() {
  const [drafts, setDrafts] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await QuotationApi.list({ status: 'draft', limit: 100 });
      setDrafts(res.items);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft?')) return;
    try {
      await QuotationApi.remove(id);
      toast.success('Draft deleted');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

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
              <th className="px-6 py-4 w-[180px]">PQ No.</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4 w-[160px]">Last Edited</th>
              <th className="px-6 py-4 w-[160px]">Est. Value</th>
              <th className="px-6 py-4 w-[200px]">Owner</th>
              <th className="px-6 py-4 w-[100px] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE3]">
            {drafts.map((d) => (
              <tr key={d.id} className="hover:bg-[#FDFBF7] group">
                <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                  {d.pqNumber}
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {d.client?.company || '—'}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(d.updatedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </td>
                <td className="px-6 py-4 font-mono text-slate-800">
                  ৳{(d.totals?.grandTotal || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-slate-700">{d.crmManager || '—'}</td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/crm/quotation-builder/${d.rfqId}`;
                      }}
                      className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-slate-50 inline-flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 transition"
                      title="Continue editing"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
                      className="w-7 h-7 rounded border border-[#E2DBD1] hover:bg-rose-50 hover:border-rose-200 inline-flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drafts.length === 0 && (
        <div className="py-12 text-center text-slate-400 italic text-[12px]">
          No drafts in progress
        </div>
      )}
    </div>
  );
}