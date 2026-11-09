// components/CRM/sales-orders/AddOrderModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { SalesOrderApi, type SalesOrderStage } from '@/services/salesOrder.service';
import { inputCls, selectCls } from './constants';

interface Props {
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

export function AddOrderModal({ onClose, onSaved }: Props) {
  const [poRef, setPoRef] = useState('');
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Bangladesh');
  const [product, setProduct] = useState('');
  const [salesValue, setSalesValue] = useState('');
  const [stage, setStage] = useState<SalesOrderStage>('Order Placed');
  const [salesman, setSalesman] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!company.trim()) {
      toast.error('Client company is required');
      return;
    }

    try {
      setSaving(true);

      await SalesOrderApi.create({
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
        stage,
        salesman: salesman.trim(),
        notes: notes.trim(),
      });

      toast.success('Order created');
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create order');
    } finally {
      setSaving(false);
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
              Add Order
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Record a new order manually. PO Ref is auto-generated if left
              blank.
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
          <Field label="PO Ref (optional)" full>
            <input
              value={poRef}
              onChange={(e) => setPoRef(e.target.value)}
              placeholder="e.g. NG-XYZ/SW/260301 — leave blank to auto-generate"
              className={inputCls}
            />
          </Field>

          <Field label="Client Company" required full>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Padma Bank Ltd."
              className={inputCls}
              autoFocus
            />
          </Field>

          <Field label="Contact Name">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Rahim Uddin"
              className={inputCls}
            />
          </Field>
          <Field label="Country">
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Bangladesh"
              className={inputCls}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@company.com"
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +880 1711-000000"
              className={inputCls}
            />
          </Field>

          <Field label="Product" full>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Firewall Appliance Renewal"
              className={inputCls}
            />
          </Field>

          <Field label="Sales Value (৳)">
            <input
              type="number"
              value={salesValue}
              onChange={(e) => setSalesValue(e.target.value)}
              placeholder="e.g. 350000"
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

          <Field label="Salesman" full>
            <input
              value={salesman}
              onChange={(e) => setSalesman(e.target.value)}
              placeholder="e.g. Akramul"
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
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E2DBD1] bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#A06126] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#88501E] disabled:opacity-60 transition"
          >
            {saving ? 'Saving…' : 'Save Order'}
          </button>
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