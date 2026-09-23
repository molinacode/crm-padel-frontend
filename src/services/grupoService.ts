import { supabase } from '../lib/supabase';
import type { PostgrestError, Tables, TablesInsert, TablesUpdate } from '../types/supabase';

type Grupo = Tables<'grupos'>;
type AlumnoGrupo = Tables<'alumnos_grupos'>;

export interface GrupoMiembro {
  asignacionId: string;
  alumnoId: string;
  nombre: string;
}

export interface GrupoConMiembros extends Grupo {
  miembros: GrupoMiembro[];
}

interface DataResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

interface AlumnosGruposJoin {
  id: string;
  alumno_id: string;
  alumnos: { id: string; nombre: string } | { id: string; nombre: string }[] | null;
}

function mapGrupo(
  row: Grupo & { alumnos_grupos?: AlumnosGruposJoin[] | null }
): GrupoConMiembros {
  const joins = Array.isArray(row.alumnos_grupos) ? row.alumnos_grupos : [];
  const miembros: GrupoMiembro[] = joins.map(join => {
    const alumno = Array.isArray(join.alumnos) ? join.alumnos[0] : join.alumnos;
    return {
      asignacionId: join.id,
      alumnoId: join.alumno_id,
      nombre: alumno?.nombre || 'Alumno',
    };
  });
  const { alumnos_grupos: _omit, ...grupo } = row;
  return { ...grupo, miembros };
}

const SELECT_GRUPOS = `
  *,
  alumnos_grupos (
    id,
    alumno_id,
    alumnos ( id, nombre )
  )
`;

export const grupoService = {
  async getAll(): Promise<DataResult<GrupoConMiembros[]>> {
    try {
      const { data, error } = await supabase
        .from('grupos')
        .select(SELECT_GRUPOS)
        .order('dia_semana', { ascending: true })
        .order('hora_inicio', { ascending: true });
      if (error) return { data: null, error };
      const rows = (data || []) as unknown as Array<
        Grupo & { alumnos_grupos?: AlumnosGruposJoin[] | null }
      >;
      return { data: rows.map(mapGrupo), error: null };
    } catch (error) {
      console.error('Error obteniendo grupos:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async create(grupo: TablesInsert<'grupos'>): Promise<DataResult<Grupo>> {
    try {
      const { data, error } = await supabase.from('grupos').insert(grupo).select().single();
      return { data: (data as Grupo | null) || null, error };
    } catch (error) {
      console.error('Error creando grupo:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async update(id: string, updates: TablesUpdate<'grupos'>): Promise<DataResult<Grupo>> {
    try {
      const { data, error } = await supabase
        .from('grupos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return { data: (data as Grupo | null) || null, error };
    } catch (error) {
      console.error('Error actualizando grupo:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async remove(id: string): Promise<DataResult<boolean>> {
    try {
      const { error } = await supabase.from('grupos').delete().eq('id', id);
      return { data: error ? null : true, error };
    } catch (error) {
      console.error('Error eliminando grupo:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async addAlumno(grupoId: string, alumnoId: string): Promise<DataResult<AlumnoGrupo>> {
    try {
      const { data, error } = await supabase
        .from('alumnos_grupos')
        .insert({ grupo_id: grupoId, alumno_id: alumnoId })
        .select()
        .single();
      return { data: (data as AlumnoGrupo | null) || null, error };
    } catch (error) {
      console.error('Error asignando alumno al grupo:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async removeAlumno(asignacionId: string): Promise<DataResult<boolean>> {
    try {
      const { error } = await supabase.from('alumnos_grupos').delete().eq('id', asignacionId);
      return { data: error ? null : true, error };
    } catch (error) {
      console.error('Error quitando alumno del grupo:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },
};
