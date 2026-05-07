import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

type AlumnoBusqueda = Pick<
  Tables<'alumnos'>,
  'id' | 'nombre' | 'email' | 'telefono' | 'nivel'
>;
type ClaseBusqueda = Pick<
  Tables<'clases'>,
  'id' | 'nombre' | 'tipo_clase' | 'nivel_clase' | 'dia_semana'
>;
type ProfesorBusqueda = Pick<
  Tables<'profesores'>,
  'id' | 'nombre' | 'email' | 'telefono' | 'especialidad'
>;
type PagoBusqueda = Pick<
  Tables<'pagos'>,
  'id' | 'cantidad' | 'mes_cubierto' | 'fecha_pago'
> & {
  alumnos?: { id: string; nombre: string | null } | null;
};

interface BuscarGlobalResult {
  alumnos: AlumnoBusqueda[];
  clases: ClaseBusqueda[];
  pagos: PagoBusqueda[];
  profesores: ProfesorBusqueda[];
  error: PostgrestError | Error | null;
}

export async function buscarGlobal(termino: string): Promise<BuscarGlobalResult> {
  const q = termino?.trim();
  if (!q) {
    return {
      alumnos: [],
      clases: [],
      pagos: [],
      profesores: [],
      error: null,
    };
  }

  try {
    const like = `%${q}%`;

    const alumnosQuery = supabase
      .from('alumnos')
      .select('id, nombre, email, telefono, nivel')
      .or(
        `nombre.ilike.${like},email.ilike.${like},telefono.ilike.${like},nivel.ilike.${like}`
      )
      .limit(10);

    const clasesQuery = supabase
      .from('clases')
      .select('id, nombre, tipo_clase, nivel_clase, dia_semana')
      .or(
        `nombre.ilike.${like},tipo_clase.ilike.${like},nivel_clase.ilike.${like}`
      )
      .limit(10);

    const profesoresQuery = supabase
      .from('profesores')
      .select('id, nombre, email, telefono, especialidad')
      .or(
        `nombre.ilike.${like},email.ilike.${like},telefono.ilike.${like},especialidad.ilike.${like}`
      )
      .limit(10);

    const pagosQuery = supabase
      .from('pagos')
      .select('id, cantidad, mes_cubierto, fecha_pago, alumnos (id, nombre)')
      .or(`mes_cubierto.ilike.${like}`)
      .limit(10);

    const [alumnosRes, clasesRes, profesoresRes, pagosRes] = await Promise.all([
      alumnosQuery,
      clasesQuery,
      profesoresQuery,
      pagosQuery,
    ]);

    const error =
      alumnosRes.error || clasesRes.error || profesoresRes.error || pagosRes.error;

    if (error) {
      console.error('Error en buscarGlobal:', error);
      return {
        alumnos: [],
        clases: [],
        pagos: [],
        profesores: [],
        error,
      };
    }

    return {
      alumnos: (alumnosRes.data as AlumnoBusqueda[] | null) || [],
      clases: (clasesRes.data as ClaseBusqueda[] | null) || [],
      profesores: (profesoresRes.data as ProfesorBusqueda[] | null) || [],
      pagos: (pagosRes.data as PagoBusqueda[] | null) || [],
      error: null,
    };
  } catch (error) {
    console.error('Error inesperado en buscarGlobal:', error);
    return {
      alumnos: [],
      clases: [],
      pagos: [],
      profesores: [],
      error: error instanceof Error ? error : new Error('Error desconocido'),
    };
  }
}
