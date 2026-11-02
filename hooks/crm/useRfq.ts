// hooks/crm/useRfq.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RfqApi } from '@/services/rfq.service';
import type { RFQItem, RFQListParams, RFQStats } from '@/services/rfq.service';

function serializeParams(p: RFQListParams): string {
  return JSON.stringify({
    page: p.page ?? 1,
    limit: p.limit ?? 100,
    search: p.search ?? '',
    country: p.country ?? '',
    salesman: p.salesman ?? '',
    stage: p.stage ?? '',
    source: p.source ?? '',
    showArchived: p.showArchived ?? false,
    dateFrom: p.dateFrom ?? '',
    dateTo: p.dateTo ?? '',
  });
}

export function useRfq(externalParams: RFQListParams = {}) {
  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const [stats, setStats] = useState<RFQStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = useMemo(() => serializeParams(externalParams), [externalParams]);
  const latestParamsRef = useRef<RFQListParams>(externalParams);

  useEffect(() => {
    latestParamsRef.current = externalParams;
  }, [externalParams]);

  const fetchList = useCallback(async (p: RFQListParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await RfqApi.list(p);
      setRfqs(res.items);
    } catch (e: any) {
      setError(e.message || 'Failed to load RFQs');
      setRfqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const s = await RfqApi.stats();
      setStats(s);
    } catch { }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchList(latestParamsRef.current), fetchStats()]);
  }, [fetchList, fetchStats]);

  useEffect(() => {
    fetchList(latestParamsRef.current);
  }, [paramsKey]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    rfqs,
    stats,
    loading,
    error,
    refresh,
    create: async (payload: Parameters<typeof RfqApi.create>[0]) => {
      const created = await RfqApi.create(payload);
      await refresh();
      return created;
    },
    // ⭐ PROPERLY EXPOSE UPDATE
    update: async (id: string, payload: Parameters<typeof RfqApi.update>[1]) => {
      const updated = await RfqApi.update(id, payload);
      await refresh(); // ⭐ This forces the UI to pull the new data from the backend
      return updated;
    },
    assign: async (id: string, payload: Parameters<typeof RfqApi.assign>[1]) => {
      const updated = await RfqApi.assign(id, payload);
      await refresh();
      return updated;
    },
    sync: async () => {
      const r = await RfqApi.sync();
      await refresh();
      return r;
    },
    archive: async (id: string) => {
      const updated = await RfqApi.archive(id);
      await refresh();
      return updated;
    },
    unarchive: async (id: string) => {
      const updated = await RfqApi.unarchive(id);
      await refresh();
      return updated;
    },
    remove: async (id: string) => {
      await RfqApi.remove(id);
      await refresh();
    },
  };
}