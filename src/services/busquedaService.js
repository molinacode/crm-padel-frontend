import { supabase } from '../lib/supabase';

/**
 * Servicio de búsqueda global.
 * Realiza búsquedas simples en varias entidades clave.
 */

export async function buscarGlobal(termino) {
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
      alumnos: alumnosRes.data || [],
      clases: clasesRes.data || [],
      profesores: profesoresRes.data || [],
      pagos: pagosRes.data || [],
      error: null,
    };
  } catch (error) {
    console.error('Error inesperado en buscarGlobal:', error);
    return {
      alumnos: [],
      clases: [],
      pagos: [],
      profesores: [],
      error,
    };
  }
}

