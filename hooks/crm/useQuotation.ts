// hooks/crm/useQuotation.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { QuotationApi } from '@/services/quotation.service';
import type {
  Quotation,
  CreateQuotationPayload,
  UpdateQuotationPayload,
} from '@/services/quotation.service';

export function useQuotation(rfqId?: string) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(!!rfqId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing quotation for the RFQ
  useEffect(() => {
    if (!rfqId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const existing = await QuotationApi.getByRfqId(rfqId);
        if (mounted) setQuotation(existing);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Failed to load quotation');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [rfqId]);

  // ---- CREATE ----
  const create = useCallback(async (payload: CreateQuotationPayload) => {
    setSaving(true);
    try {
      const created = await QuotationApi.create(payload);
      setQuotation(created);
      return created;
    } finally {
      setSaving(false);
    }
  }, []);

  // ---- UPDATE ----
  const update = useCallback(
    async (id: string, payload: UpdateQuotationPayload) => {
      setSaving(true);
      try {
        const updated = await QuotationApi.update(id, payload);
        setQuotation(updated);
        return updated;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  // ---- SEND ----
const send = useCallback(
  async (id: string, withAttachment: boolean = false) => {
    const sent = await QuotationApi.send(id, withAttachment);
    setQuotation(sent);
    return sent;
  },
  []
);

  
  // ---- APPROVE ----
  const approve = useCallback(async (id: string) => {
    const approved = await QuotationApi.approve(id);
    setQuotation(approved);
    return approved;
  }, []);

  // ---- OUTCOME ----
  const markOutcome = useCallback(async (id: string, outcome: 'won' | 'lost') => {
    const updated = await QuotationApi.markOutcome(id, outcome);
    setQuotation(updated);
    return updated;
  }, []);

  // ---- DELETE ----
  const remove = useCallback(async (id: string) => {
    await QuotationApi.remove(id);
    setQuotation(null);
  }, []);

  return {
    quotation,
    loading,
    error,
    saving,
    create,
    update,
    send,
    approve,
    markOutcome,
    remove,
  };
}