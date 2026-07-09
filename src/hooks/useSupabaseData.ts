import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Stable stringified version of the filter object
  const filterString = useMemo(() => JSON.stringify(filter), [filter]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      try {
        console.log(`useSupabaseQuery: preparing fetch`, { table, select, filter, enabled, version });
        let query = supabase.from(table).select(select);

        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (orderBy) {
          query = query.order(orderBy, { ascending: orderAsc });
        }

        console.time(table);

const { data: result, error: err } = await query;

console.timeEnd(table);

console.log("Finished", table, err);
        console.log(`useSupabaseQuery: fetched`, { table, error: err, result });

        if (cancelled) return;

        if (err) {
          setError(err.message);
          setData([]);
        } else {
          setData((result as T[]) ?? []);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur de chargement");
        setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [table, select, orderBy, orderAsc, enabled, version, filterString]); // now uses stable filterString

  return { data, loading, error, refetch };
}