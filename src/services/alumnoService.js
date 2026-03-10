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
   * @param {Date|string} fechaBaja - Fecha de baja (opcional, por defecto: hoy)
   * @returns {Promise<{data, error}>}
   */
  async delete(id, fechaBaja = null) {
    try {
      const fecha = fechaBaja 
        ? (fechaBaja instanceof Date ? fechaBaja.toISOString().split('T')[0] : fechaBaja)
        : new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('alumnos')
        .update({ 
          activo: false,
          fecha_baja: fecha
        })
        .eq('id', id);

      return { data, error };
    } catch (error) {
      console.error('Error eliminando alumno:', error);
      return { data: null, error };
    }
  },

  /**
   * Dar de baja un alumno desde una fecha específica
   * @param {string} id
   * @param {Date|string} fechaBaja - Fecha desde la cual el alumno está dado de baja
   * @returns {Promise<{data, error}>}
   */
  async darDeBaja(id, fechaBaja) {
    try {
      const fecha = fechaBaja instanceof Date 
        ? fechaBaja.toISOString().split('T')[0] 
        : fechaBaja;

      const { data, error } = await supabase
        .from('alumnos')
        .update({ 
          activo: false,
          fecha_baja: fecha
        })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error dando de baja alumno:', error);
      return { data: null, error };
    }
  },

  /**
   * Reactivar un alumno (quitar fecha de baja)
   * @param {string} id
   * @returns {Promise<{data, error}>}
   */
  async reactivar(id) {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .update({ 
          activo: true,
          fecha_baja: null
        })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error reactivando alumno:', error);
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
