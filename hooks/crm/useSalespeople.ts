'use client';

import { useEffect, useState } from 'react';
import { RfqApi, type Salesperson } from '@/services/rfq.service';

// ---- Module-level cache so all instances share ----
let cache: Salesperson[] | null = null;
let cacheAt = 0;
let inflight: Promise<Salesperson[]> | null = null;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchSalespeople(force = false): Promise<Salesperson[]> {
    const now = Date.now();

    // Return cached if fresh and not forced
    if (!force && cache && now - cacheAt < TTL_MS) {
        return cache;
    }

    // Dedupe parallel requests
    if (inflight) return inflight;

    inflight = RfqApi.salespeople()
        .then((list) => {
            cache = list;
            cacheAt = Date.now();
            return list;
        })
        .finally(() => {
            inflight = null;
        });

    return inflight;
}

export function clearSalespeopleCache() {
    cache = null;
    cacheAt = 0;
}

export function useSalespeople() {
    const [users, setUsers] = useState<Salesperson[]>(cache ?? []);
    const [loading, setLoading] = useState(!cache);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            // Instant if cached
            if (cache && Date.now() - cacheAt < TTL_MS) {
                setUsers(cache);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const list = await fetchSalespeople();
                if (mounted) setUsers(list);
            } catch (e: any) {
                if (mounted) setError(e.message || 'Failed to load users');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return { users, loading, error };
}