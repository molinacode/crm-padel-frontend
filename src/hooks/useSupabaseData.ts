import { useEffect, useMemo, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Primitive = string | number | boolean | null;
interface QueryOptions {
  eq?: Record<string, Primitive>;
  gte?: Record<string, Primitive>;
  lte?: Record<string, Primitive>;
  in?: Record<string, Primitive[]>;
  neq?: Record<string, Primitive>;
  orderBy?: { column: string; ascending?: boolean };
}

interface HookResult<T> {
  data: T[];
  loading: boolean;
  error: PostgrestError | Error | null;
}

interface QueryBuilderUntyped {
  eq: (key: string, value: unknown) => QueryBuilderUntyped;
  gte: (key: string, value: unknown) => QueryBuilderUntyped;
  lte: (key: string, value: unknown) => QueryBuilderUntyped;
  in: (key: string, value: unknown[]) => QueryBuilderUntyped;
  neq: (key: string, value: unknown) => QueryBuilderUntyped;
  order: (column: string, options: { ascending: boolean }) => QueryBuilderUntyped;
  then: PromiseLike<{ data: unknown[] | null; error: PostgrestError | null }>['then'];
}

interface SupabaseUntyped {
  from: (table: string) => {
    select: (selectClause: string) => QueryBuilderUntyped;
  };
}

export const useSupabaseData = <T = Record<string, unknown>>(
  tableName: string,
  queryOptions: QueryOptions = {}
): HookResult<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const queryOptionsMemo = useMemo(() => queryOptions, [queryOptions]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = (supabase as unknown as SupabaseUntyped).from(tableName).select('*');
        if (queryOptionsMemo.eq) Object.entries(queryOptionsMemo.eq).forEach(([k, v]) => { query = query.eq(k, v); });
        if (queryOptionsMemo.gte) Object.entries(queryOptionsMemo.gte).forEach(([k, v]) => { query = query.gte(k, v); });
        if (queryOptionsMemo.lte) Object.entries(queryOptionsMemo.lte).forEach(([k, v]) => { query = query.lte(k, v); });
        if (queryOptionsMemo.in) Object.entries(queryOptionsMemo.in).forEach(([k, v]) => { query = query.in(k, v); });
        if (queryOptionsMemo.neq) Object.entries(queryOptionsMemo.neq).forEach(([k, v]) => { query = query.neq(k, v); });
        if (queryOptionsMemo.orderBy) query = query.order(queryOptionsMemo.orderBy.column, { ascending: queryOptionsMemo.orderBy.ascending !== false });
        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        setData(Array.isArray(data) ? (data as T[]) : []);
        setError(null);
      } catch (err) {
        console.error(`Error cargando ${tableName}:`, err);
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableName, queryOptionsMemo]);

  return { data, loading, error };
};

export const useSupabaseDataWithJoins = <T = Record<string, unknown>>(
  tableName: string,
  selectClause: string,
  queryOptions: QueryOptions = {}
): HookResult<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const queryOptionsMemo = useMemo(() => queryOptions, [queryOptions]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = (supabase as unknown as SupabaseUntyped)
          .from(tableName)
          .select(selectClause);
        if (queryOptionsMemo.eq) Object.entries(queryOptionsMemo.eq).forEach(([k, v]) => { query = query.eq(k, v); });
        if (queryOptionsMemo.gte) Object.entries(queryOptionsMemo.gte).forEach(([k, v]) => { query = query.gte(k, v); });
        if (queryOptionsMemo.lte) Object.entries(queryOptionsMemo.lte).forEach(([k, v]) => { query = query.lte(k, v); });
        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        setData(Array.isArray(data) ? (data as T[]) : []);
        setError(null);
      } catch (err) {
        console.error(`Error cargando ${tableName}:`, err);
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableName, selectClause, queryOptionsMemo]);

  return { data, loading, error };
};


