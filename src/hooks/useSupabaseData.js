import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from(tableName).select('*');

        // Aplicar filtros
        if (queryOptions.eq) {
          Object.entries(queryOptions.eq).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (queryOptions.gte) {
          Object.entries(queryOptions.gte).forEach(([key, value]) => {
            query = query.gte(key, value);
          });
        }

        if (queryOptions.lte) {
          Object.entries(queryOptions.lte).forEach(([key, value]) => {
            query = query.lte(key, value);
          });
        }

        if (queryOptions.in) {
          Object.entries(queryOptions.in).forEach(([key, value]) => {
            query = query.in(key, value);
          });
        }

        if (queryOptions.neq) {
          Object.entries(queryOptions.neq).forEach(([key, value]) => {
            query = query.neq(key, value);
          });
        }

        if (queryOptions.orderBy) {
          query = query.order(queryOptions.orderBy.column, {
            ascending: queryOptions.orderBy.ascending !== false,
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
  }, [tableName, JSON.stringify(queryOptions)]);

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from(tableName).select(selectClause);

        // Aplicar filtros
        if (queryOptions.eq) {
          Object.entries(queryOptions.eq).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (queryOptions.gte) {
          Object.entries(queryOptions.gte).forEach(([key, value]) => {
            query = query.gte(key, value);
          });
        }

        if (queryOptions.lte) {
          Object.entries(queryOptions.lte).forEach(([key, value]) => {
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
  }, [tableName, selectClause, JSON.stringify(queryOptions)]);

  return { data, loading, error };
};
