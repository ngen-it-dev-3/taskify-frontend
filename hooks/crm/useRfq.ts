'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RfqApi } from '@/services/rfq.service';
import type { RFQItem, RFQListParams, RFQStats } from '@/services/rfq.service';

// Serialize params to a stable string so we can detect real changes
// (object identity is not reliable with useMemo + nested props)
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

  // Stable key derived from externalParams — changes only when a real value changes
  const paramsKey = useMemo(() => serializeParams(externalParams), [externalParams]);

  // Keep a ref to the latest params so refresh() always uses fresh values
  const latestParamsRef = useRef<RFQListParams>(externalParams);
  useEffect(() => {
    latestParamsRef.current = externalParams;
  }, [externalParams]);

  // ---- LIST ----
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

  // ---- STATS ----
  const fetchStats = useCallback(async () => {
    try {
      const s = await RfqApi.stats();
      setStats(s);
    } catch {
      // silent — stats are non-critical
    }
  }, []);

  // ---- REFRESH (uses latest params via ref) ----
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchList(latestParamsRef.current),
      fetchStats(),
    ]);
  }, [fetchList, fetchStats]);

  // ⭐ KEY FIX: refetch whenever the serialized params key changes
  useEffect(() => {
    fetchList(externalParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // Fetch stats once on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    rfqs,
    stats,
    loading,
    error,
    refresh,

    // ---- Mutations (all auto-refresh with LATEST params) ----
    create: async (payload: Parameters<typeof RfqApi.create>[0]) => {
      const created = await RfqApi.create(payload);
      await refresh();
      return created;
    },
    update: async (id: string, payload: Parameters<typeof RfqApi.update>[1]) => {
      const updated = await RfqApi.update(id, payload);
      await refresh();
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