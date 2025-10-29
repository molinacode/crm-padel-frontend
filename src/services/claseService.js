import { supabase } from '../lib/supabase';
import { obtenerRangoSemanaISO } from '../utils/dateUtils';

/**
 * Servicio para gestionar operaciones de clases y eventos
 */

export const claseService = {
  /**
   * Obtener todas las clases
   * @returns {Promise<{data, error}>}
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('clases')
        .select('*')
        .order('nombre', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo clases:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener clase por ID
   * @param {string} id
   * @returns {Promise<{data, error}>}
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('clases')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo clase:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener eventos de la semana actual
   * @param {object} options - Opciones de filtrado
   * @returns {Promise<{data, error}>}
   */
  async getEventosSemanaActual(options = {}) {
    try {
      const { lunes, domingo } = obtenerRangoSemanaISO();

      let query = supabase
        .from('eventos_clase')
        .select(
          `
          id,
          fecha,
          hora_inicio,
          estado,
          clase_id,
          clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
        `
        )
        .gte('fecha', lunes)
        .lte('fecha', domingo);

      if (options.excluirEliminados) {
        query = query.or('estado.is.null,estado.neq.eliminado');
      }

      if (options.excluirCancelados) {
        query = query.neq('estado', 'cancelada');
      }

      const { data, error } = await query;

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo eventos de la semana:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener eventos por fecha
   * @param {string} fecha - Formato YYYY-MM-DD
   * @returns {Promise<{data, error}>}
   */
  async getEventosPorFecha(fecha) {
    try {
      const { data, error } = await supabase
        .from('eventos_clase')
        .select(
          `
          id,
          fecha,
          hora_inicio,
          hora_fin,
          estado,
          clase_id,
          clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
        `
        )
        .eq('fecha', fecha)
        .or('estado.is.null,estado.eq.programada');

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo eventos por fecha:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener alumnos asignados a una clase
   * @param {string} claseId
   * @returns {Promise<{data, error}>}
   */
  async getAlumnosAsignados(claseId) {
    try {
      const { data, error } = await supabase
        .from('alumnos_clases')
        .select('*, alumnos(*)')
        .eq('clase_id', claseId);

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo alumnos asignados:', error);
      return { data: null, error };
    }
  },

  /**
   * Crear una nueva clase
   * @param {object} clase
   * @returns {Promise<{data, error}>}
   */
  async create(clase) {
    try {
      const { data, error } = await supabase
        .from('clases')
        .insert(clase)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creando clase:', error);
      return { data: null, error };
    }
  },

  /**
   * Actualizar una clase
   * @param {string} id
   * @param {object} updates
   * @returns {Promise<{data, error}>}
   */
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('clases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error actualizando clase:', error);
      return { data: null, error };
    }
  },
};
