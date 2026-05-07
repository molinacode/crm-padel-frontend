import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '../types/supabase';
import { obtenerRangoSemanaISO } from '../utils/dateUtils';

type Clase = Tables<'clases'>;
type EventoClase = Tables<'eventos_clase'>;
type AlumnoClase = Tables<'alumnos_clases'>;

interface DataResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

interface EventosSemanaOptions {
  excluirEliminados?: boolean;
  excluirCancelados?: boolean;
}

export const claseService = {
  async getAll(): Promise<DataResult<Clase[]>> {
    try {
      const { data, error } = await supabase
        .from('clases')
        .select('*')
        .order('nombre', { ascending: true });
      return { data: (data as Clase[] | null) || [], error };
    } catch (error) {
      console.error('Error obteniendo clases:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async getById(id: string): Promise<DataResult<Clase>> {
    try {
      const { data, error } = await supabase.from('clases').select('*').eq('id', id).single();
      return { data: (data as Clase | null) || null, error };
    } catch (error) {
      console.error('Error obteniendo clase:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async getEventosSemanaActual(
    options: EventosSemanaOptions = {}
  ): Promise<DataResult<EventoClase[]>> {
    try {
      const { lunes, domingo } = obtenerRangoSemanaISO();
      let query = supabase
        .from('eventos_clase')
        .select(
          `
          id, fecha, hora_inicio, estado, clase_id,
          clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
        `
        )
        .gte('fecha', lunes)
        .lte('fecha', domingo);

      if (options.excluirEliminados) query = query.or('estado.is.null,estado.neq.eliminado');
      if (options.excluirCancelados) query = query.neq('estado', 'cancelada');

      const { data, error } = await query;
      return { data: (data as EventoClase[] | null) || [], error };
    } catch (error) {
      console.error('Error obteniendo eventos de la semana:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async getEventosPorFecha(fecha: string): Promise<DataResult<EventoClase[]>> {
    try {
      const { data, error } = await supabase
        .from('eventos_clase')
        .select(
          `
          id, fecha, hora_inicio, hora_fin, estado, clase_id,
          clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
        `
        )
        .eq('fecha', fecha)
        .or('estado.is.null,estado.eq.programada');
      return { data: (data as EventoClase[] | null) || [], error };
    } catch (error) {
      console.error('Error obteniendo eventos por fecha:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async getAlumnosAsignados(claseId: string): Promise<DataResult<AlumnoClase[]>> {
    try {
      const { data, error } = await supabase
        .from('alumnos_clases')
        .select('*, alumnos(*)')
        .eq('clase_id', claseId);
      return { data: (data as AlumnoClase[] | null) || [], error };
    } catch (error) {
      console.error('Error obteniendo alumnos asignados:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async create(clase: TablesInsert<'clases'>): Promise<DataResult<Clase>> {
    try {
      const { data, error } = await supabase.from('clases').insert(clase).select().single();
      return { data: (data as Clase | null) || null, error };
    } catch (error) {
      console.error('Error creando clase:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async update(id: string, updates: TablesUpdate<'clases'>): Promise<DataResult<Clase>> {
    try {
      const { data, error } = await supabase
        .from('clases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data: (data as Clase | null) || null, error };
    } catch (error) {
      console.error('Error actualizando clase:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },
};
