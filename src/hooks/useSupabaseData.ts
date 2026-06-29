import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseSupabaseQueryOptions {
  table: string;
  select?: string;
  orderBy?: string;
  orderAsc?: boolean;
  filter?: Record<string, string>;
  enabled?: boolean;
}

export function useSupabaseQuery<T>({
  table,
  select = '*',
  orderBy,
  orderAsc = true,
  filter,
  enabled = true,
}: UseSupabaseQueryOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      let query = supabase.from(table).select(select);

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (orderBy) {
        query = query.order(orderBy, { ascending: orderAsc });
      }

      const { data: result, error: err } = await query;

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData((result as T[]) ?? []);
        setError(null);
      }
      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [table, select, orderBy, orderAsc, enabled, version, JSON.stringify(filter)]);

  return { data, loading, error, refetch };
}
