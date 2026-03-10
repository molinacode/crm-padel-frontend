import { supabase } from '../lib/supabase';

/**
 * Servicio para gestionar operaciones de pagos
 */

export const pagoService = {
  /**
   * Obtener todos los pagos
   * @param {object} options - Opciones de consulta
   * @returns {Promise<{data, error}>}
   */
  async getAll(options = {}) {
    try {
      const selectClause = options.withAlumno
        ? `
          *,
          alumnos (nombre)
        `
        : '*';

      let query = supabase.from('pagos').select(selectClause);

      if (options.alumnoId) {
        query = query.eq('alumno_id', options.alumnoId);
      }

      if (options.mesCubierto) {
        query = query.eq('mes_cubierto', options.mesCubierto);
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column || 'fecha_pago', {
          ascending: options.orderBy.ascending !== false,
        });
      } else {
        query = query.order('fecha_pago', { ascending: false });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Error obteniendo pagos:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener pagos del mes actual
   * @returns {Promise<{data, error}>}
   */
  async getPagosMesActual() {
    try {
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('pagos')
        .select('*, alumnos (nombre)')
        .eq('mes_cubierto', mesActual);

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo pagos del mes:', error);
      return { data: null, error };
    }
  },

  /**
   * Calcular ingresos del mes
   * @returns {Promise<{ingresos: number, error}>}
   */
  async calcularIngresosDelMes() {
    try {
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('pagos')
        .select('cantidad')
        .eq('mes_cubierto', mesActual);

      if (error) return { ingresos: 0, error };

      const ingresos = data.reduce((acc, pago) => acc + pago.cantidad, 0);
      return { ingresos, error: null };
    } catch (error) {
      console.error('Error calculando ingresos:', error);
      return { ingresos: 0, error };
    }
  },

  /**
   * Crear un nuevo pago
   * @param {object} pago
   * @returns {Promise<{data, error}>}
   */
  async create(pago) {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .insert(pago)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creando pago:', error);
      return { data: null, error };
    }
  },

  /**
   * Actualizar un pago
   * @param {string} id
   * @param {object} updates
   * @returns {Promise<{data, error}>}
   */
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error actualizando pago:', error);
      return { data: null, error };
    }
  },

  /**
   * Eliminar un pago
   * @param {string} id
   * @returns {Promise<{data, error}>}
   */
  async delete(id) {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .delete()
        .eq('id', id);

      return { data, error };
    } catch (error) {
      console.error('Error eliminando pago:', error);
      return { data: null, error };
    }
  },
};
