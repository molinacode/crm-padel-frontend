import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook genérico para cargar datos de Supabase
 * @param {string} tableName - Nombre de la tabla
 * @param {object} queryOptions - Opciones de consulta
 * @returns {{ data: array, loading: boolean, error: object }}
 */
export const useSupabaseData = (tableName, queryOptions = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoizar queryOptions para evitar cambios innecesarios
  const queryOptionsMemo = useMemo(() => queryOptions, [queryOptions]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from(tableName).select('*');

        // Aplicar filtros
        if (queryOptionsMemo.eq) {
          Object.entries(queryOptionsMemo.eq).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (queryOptionsMemo.gte) {
          Object.entries(queryOptionsMemo.gte).forEach(([key, value]) => {
            query = query.gte(key, value);
          });
        }

        if (queryOptionsMemo.lte) {
          Object.entries(queryOptionsMemo.lte).forEach(([key, value]) => {
            query = query.lte(key, value);
          });
        }

        if (queryOptionsMemo.in) {
          Object.entries(queryOptionsMemo.in).forEach(([key, value]) => {
            query = query.in(key, value);
          });
        }

        if (queryOptionsMemo.neq) {
          Object.entries(queryOptionsMemo.neq).forEach(([key, value]) => {
            query = query.neq(key, value);
          });
        }

        if (queryOptionsMemo.orderBy) {
          query = query.order(queryOptionsMemo.orderBy.column, {
            ascending: queryOptionsMemo.orderBy.ascending !== false,
          });
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        setData(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error(`Error cargando ${tableName}:`, err);
        setError(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName, queryOptionsMemo]);

  return { data, loading, error };
};

/**
 * Hook para cargar datos con joins
 * @param {string} tableName - Nombre de la tabla
 * @param {string} selectClause - Cláusula SELECT con joins
 * @param {object} queryOptions - Opciones de consulta
 * @returns {{ data: array, loading: boolean, error: object }}
 */
export const useSupabaseDataWithJoins = (
  tableName,
  selectClause,
  queryOptions = {}
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoizar queryOptions para evitar cambios innecesarios
  const queryOptionsMemo = useMemo(() => queryOptions, [queryOptions]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from(tableName).select(selectClause);

        // Aplicar filtros
        if (queryOptionsMemo.eq) {
          Object.entries(queryOptionsMemo.eq).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (queryOptionsMemo.gte) {
          Object.entries(queryOptionsMemo.gte).forEach(([key, value]) => {
            query = query.gte(key, value);
          });
        }

        if (queryOptionsMemo.lte) {
          Object.entries(queryOptionsMemo.lte).forEach(([key, value]) => {
            query = query.lte(key, value);
          });
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        setData(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error(`Error cargando ${tableName}:`, err);
        setError(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName, selectClause, queryOptionsMemo]);

  return { data, loading, error };
};
