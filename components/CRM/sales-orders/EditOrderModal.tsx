// components/CRM/sales-orders/EditOrderModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  SalesOrderApi,
  type SalesOrder,
  type SalesOrderStage,
} from '@/services/salesOrder.service';
import { inputCls, selectCls } from './constants';

interface Props {
  order: SalesOrder;
  onClose: () => void;
  onSaved: () => void;
}

const STAGES: SalesOrderStage[] = [
  'Order Placed',
  'Sourcing',
  'Procurement',
  'Delivery',
  'Invoiced',
  'Payment Received',
];

const PAYMENT_STATUSES = ['Not Invoiced', 'Awaiting Payment', 'Received'];

export function EditOrderModal({ order, onClose, onSaved }: Props) {
  const [poRef, setPoRef] = useState(order.poRef || '');
  const [company, setCompany] = useState(order.client?.company || '');
  const [contactName, setContactName] = useState(order.client?.contactName || '');
  const [email, setEmail] = useState(order.client?.email || '');
  const [phone, setPhone] = useState(order.client?.phone || '');
  const [country, setCountry] = useState(order.client?.country || 'Bangladesh');
  const [product, setProduct] = useState(order.product || '');
  const [salesValue, setSalesValue] = useState(String(order.salesValue || ''));
  const [stage, setStage] = useState<SalesOrderStage>(order.stage);
  const [salesman, setSalesman] = useState(order.salesman || '');
  const [notes, setNotes] = useState(order.notes || '');

  // Payment tracking
  const [clientPaymentStatus, setClientPaymentStatus] = useState(
    order.clientPayment?.status || 'Not Invoiced'
  );
  const [principalPaymentStatus, setPrincipalPaymentStatus] = useState(
    order.principalPayment?.status || 'Not Required'
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!company.trim()) {
      toast.error('Client company is required');
      return;
    }

    try {
      setSaving(true);

      // ⭐ If stage changed → use the stage endpoint (stamps the history)
      if (stage !== order.stage) {
        await SalesOrderApi.advanceStage(order.id, stage);
      }

      // ⭐ Update the rest of the fields
      await SalesOrderApi.update(order.id, {
        poRef: poRef.trim() || undefined,
        client: {
          company: company.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country: country.trim(),
        },
        product: product.trim(),
        salesValue: salesValue === '' ? 0 : Number(salesValue),
        salesman: salesman.trim(),
        notes: notes.trim(),
        clientPayment: { status: clientPaymentStatus },
        principalPayment: { status: principalPaymentStatus },
      } as any);

      toast.success('Order updated');
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete order "${order.poRef}"? This cannot be undone.`)) return;

    try {
      setDeleting(true);
      await SalesOrderApi.remove(order.id);
      toast.success('Order deleted');
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#0F2D4A]">
              Edit Order
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Update order details, advance the current stage, or track
              payments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="PO Ref" full>
            <input
              value={poRef}
              onChange={(e) => setPoRef(e.target.value)}
              className={inputCls + ' font-mono'}
            />
          </Field>

          <Field label="Client Company" required full>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Contact Name">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Country">
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Product" full>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Sales Value (৳)">
            <input
              type="number"
              value={salesValue}
              onChange={(e) => setSalesValue(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Current Stage">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as SalesOrderStage)}
              className={selectCls}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          {/* Payment tracking */}
          <Field label="Client Payment">
            <select
              value={clientPaymentStatus}
              onChange={(e) => setClientPaymentStatus(e.target.value)}
              className={selectCls}
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Principal Payment">
            <select
              value={principalPaymentStatus}
              onChange={(e) => setPrincipalPaymentStatus(e.target.value)}
              className={selectCls}
            >
              <option value="Not Required">Not Required</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </Field>

          <Field label="Salesman" full>
            <input
              value={salesman}
              onChange={(e) => setSalesman(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Notes" full>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes"
              className={inputCls + ' resize-none'}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between gap-2">
          {/* Delete on left */}
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-60 transition"
          >
            {deleting ? 'Deleting…' : 'Delete Order'}
          </button>

          {/* Cancel + Save on right */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[#E2DBD1] bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="rounded-lg bg-[#A06126] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60 transition"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}