import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '../types/supabase';

type Alumno = Tables<'alumnos'>;
type AlumnoClase = Tables<'alumnos_clases'>;

interface QueryOptions {
  activo?: boolean;
  orderBy?: { column?: keyof Alumno | 'nombre'; ascending?: boolean };
}

interface DataResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

type FechaBajaInput = Date | string | null;

export const alumnoService = {
  async getAll(options: QueryOptions = {}): Promise<DataResult<Alumno[]>> {
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
      return { data: (data as Alumno[] | null) || [], error };
    } catch (error) {
      console.error('Error obteniendo alumnos:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async getById(id: string): Promise<DataResult<Alumno>> {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', id)
        .single();

      return { data: (data as Alumno | null) || null, error };
    } catch (error) {
      console.error('Error obteniendo alumno:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async create(alumno: TablesInsert<'alumnos'>): Promise<DataResult<Alumno>> {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .insert(alumno)
        .select()
        .single();

      return { data: (data as Alumno | null) || null, error };
    } catch (error) {
      console.error('Error creando alumno:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async update(id: string, updates: TablesUpdate<'alumnos'>): Promise<DataResult<Alumno>> {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { data: (data as Alumno | null) || null, error };
    } catch (error) {
      console.error('Error actualizando alumno:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async delete(id: string, fechaBaja: FechaBajaInput = null): Promise<DataResult<Alumno[]>> {
    try {
      const fecha = fechaBaja
        ? fechaBaja instanceof Date
          ? fechaBaja.toISOString().split('T')[0]
          : fechaBaja
        : new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('alumnos')
        .update({
          activo: false,
          fecha_baja: fecha,
        })
        .eq('id', id);

      return { data: (data as Alumno[] | null) || [], error };
    } catch (error) {
      console.error('Error eliminando alumno:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async darDeBaja(id: string, fechaBaja: Date | string): Promise<DataResult<Alumno>> {
    try {
      const fecha =
        fechaBaja instanceof Date ? fechaBaja.toISOString().split('T')[0] : fechaBaja;

      const { data, error } = await supabase
        .from('alumnos')
        .update({
          activo: false,
          fecha_baja: fecha,
        })
        .eq('id', id)
        .select()
        .single();

      return { data: (data as Alumno | null) || null, error };
    } catch (error) {
      console.error('Error dando de baja alumno:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async reactivar(id: string): Promise<DataResult<Alumno>> {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .update({
          activo: true,
          fecha_baja: null,
        })
        .eq('id', id)
        .select()
        .single();

      return { data: (data as Alumno | null) || null, error };
    } catch (error) {
      console.error('Error reactivando alumno:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async getClasesAsignadas(alumnoId: string): Promise<DataResult<AlumnoClase[]>> {
    try {
      const { data, error } = await supabase
        .from('alumnos_clases')
        .select('*, clases(*)')
        .eq('alumno_id', alumnoId);

      return { data: (data as AlumnoClase[] | null) || [], error };
    } catch (error) {
      console.error('Error obteniendo clases asignadas:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },
};
