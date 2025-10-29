import { supabase } from '../lib/supabase';

/**
 * Servicio para gestionar operaciones de alumnos
 */

export const alumnoService = {
  /**
   * Obtener todos los alumnos
   * @param {object} options - Opciones de consulta
   * @returns {Promise<{data, error}>}
   */
  async getAll(options = {}) {
    try {
      let query = supabase.from('alumnos').select('*');

      if (options.activo !== undefined) {
        query = query.eq('activo', options.activo);
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column || 'nombre', {
          ascending: options.orderBy.ascending !== false,
        });
      } else {
        query = query.order('nombre', { ascending: true });
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Error obteniendo alumnos:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener alumno por ID
   * @param {string} id
   * @returns {Promise<{data, error}>}
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo alumno:', error);
      return { data: null, error };
    }
  },

  /**
   * Crear un nuevo alumno
   * @param {object} alumno
   * @returns {Promise<{data, error}>}
   */
  async create(alumno) {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .insert(alumno)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creando alumno:', error);
      return { data: null, error };
    }
  },

  /**
   * Actualizar un alumno
   * @param {string} id
   * @param {object} updates
   * @returns {Promise<{data, error}>}
   */
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error actualizando alumno:', error);
      return { data: null, error };
    }
  },

  /**
   * Eliminar un alumno (soft delete)
   * @param {string} id
   * @returns {Promise<{data, error}>}
   */
  async delete(id) {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .update({ activo: false })
        .eq('id', id);

      return { data, error };
    } catch (error) {
      console.error('Error eliminando alumno:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener clases asignadas a un alumno
   * @param {string} alumnoId
   * @returns {Promise<{data, error}>}
   */
  async getClasesAsignadas(alumnoId) {
    try {
      const { data, error } = await supabase
        .from('alumnos_clases')
        .select('*, clases(*)')
        .eq('alumno_id', alumnoId);

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo clases asignadas:', error);
      return { data: null, error };
    }
  },
};
