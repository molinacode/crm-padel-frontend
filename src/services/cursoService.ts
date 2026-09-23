import { supabase } from '../lib/supabase';
import { esAlumnoActivo } from '../utils/alumnoUtils';
import { calcularAlumnosConDeuda, formatearMesLegible } from '../utils/calcularDeudas';

export interface Curso {
  id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'abierto' | 'cerrado';
}

export interface ClaseCopiable {
  id: string;
  nombre: string | null;
  dia_semana: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  nivel_clase: string | null;
  profesor: string | null;
  tipo_clase: string | null;
  observaciones: string | null;
  capacidad_maxima: number | null;
  instalacion_id: number | null;
  recurrencia: string | null;
  contabiliza_como: string | null;
}

export interface ResumenCierre {
  curso: Curso;
  porMes: { mes: string; etiqueta: string; alumnos: number }[];
  clases: number;
  ultimoEvento: string | null;
  alumnosQueSiguen: number;
}

const DIAS: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
  Domingo: 0,
};

function fechaCorta(value: string | null | undefined): string {
  return String(value || '').slice(0, 10);
}

export async function listarCursos(): Promise<Curso[]> {
  const { data, error } = await supabase
    .from('cursos')
    .select('id, nombre, fecha_inicio, fecha_fin, estado')
    .order('fecha_inicio', { ascending: false });
  if (error) throw error;
  return ((data || []) as Curso[]).map(curso => ({
    ...curso,
    fecha_inicio: fechaCorta(curso.fecha_inicio),
    fecha_fin: fechaCorta(curso.fecha_fin),
  }));
}

export async function cursoAbierto(): Promise<Curso | null> {
  const cursos = await listarCursos();
  return cursos.find(curso => curso.estado === 'abierto') || null;
}

export async function resumenCierre(cursoId: string): Promise<ResumenCierre> {
  const cursos = await listarCursos();
  const curso = cursos.find(item => item.id === cursoId);
  if (!curso) throw new Error('No se encontró el curso');

  const { alumnos } = await calcularAlumnosConDeuda();
  const cuentas = new Map<string, number>();
  alumnos.forEach(alumno => {
    alumno.meses
      .filter(mes => mes.cursoId === cursoId)
      .forEach(mes => cuentas.set(mes.mes, (cuentas.get(mes.mes) || 0) + 1));
  });

  const { data: clases, error: clasesError } = await supabase
    .from('clases')
    .select('id')
    .eq('curso_id', cursoId);
  if (clasesError) throw clasesError;
  const claseIds = ((clases || []) as { id: string }[]).map(clase => clase.id);

  let ultimoEvento: string | null = null;
  let alumnosQueSiguen = 0;
  if (claseIds.length > 0) {
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos_clase')
      .select('fecha')
      .in('clase_id', claseIds)
      .order('fecha', { ascending: false })
      .limit(1);
    if (eventosError) throw eventosError;
    ultimoEvento = fechaCorta((eventos?.[0] as { fecha?: string } | undefined)?.fecha);

    const { data: asignaciones, error: asignacionesError } = await supabase
      .from('alumnos_clases')
      .select('alumno_id, tipo_asignacion, origen, alumnos (activo, fecha_baja)')
      .in('clase_id', claseIds);
    if (asignacionesError) throw asignacionesError;

    const vistos = new Set<string>();
    ((asignaciones || []) as Array<{
      alumno_id: string;
      tipo_asignacion: string | null;
      origen: string | null;
      alumnos: { activo?: boolean | null; fecha_baja?: string | null } | { activo?: boolean | null; fecha_baja?: string | null }[] | null;
    }>).forEach(asignacion => {
      const permanente =
        !asignacion.tipo_asignacion || asignacion.tipo_asignacion === 'permanente';
      const escuela = !asignacion.origen || asignacion.origen === 'escuela';
      const alumno = Array.isArray(asignacion.alumnos)
        ? asignacion.alumnos[0]
        : asignacion.alumnos;
      if (!permanente || !escuela || !alumno || !esAlumnoActivo(alumno)) return;
      vistos.add(asignacion.alumno_id);
    });
    alumnosQueSiguen = vistos.size;
  }

  return {
    curso,
    porMes: [...cuentas.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, alumnosMes]) => ({
        mes,
        etiqueta: formatearMesLegible(mes),
        alumnos: alumnosMes,
      })),
    clases: claseIds.length,
    ultimoEvento,
    alumnosQueSiguen,
  };
}

export async function cerrarCurso(cursoId: string): Promise<void> {
  const abierto = await cursoAbierto();
  if (!abierto || abierto.id !== cursoId) {
    throw new Error('Solo se puede cerrar el curso abierto');
  }
  const { error } = await supabase
    .from('cursos')
    .update({ estado: 'cerrado' })
    .eq('id', cursoId);
  if (error) throw error;
}

export async function clasesDelCurso(cursoId: string): Promise<ClaseCopiable[]> {
  const { data, error } = await supabase
    .from('clases')
    .select(
      'id, nombre, dia_semana, hora_inicio, hora_fin, nivel_clase, profesor, tipo_clase, observaciones, capacidad_maxima, instalacion_id, recurrencia, contabiliza_como'
    )
    .eq('curso_id', cursoId)
    .order('nombre');
  if (error) throw error;
  return (data || []) as ClaseCopiable[];
}

function fechasDeClase(inicio: string, fin: string, diaSemana: string | null): string[] {
  const dia = diaSemana ? DIAS[diaSemana] : undefined;
  if (dia === undefined) return [];
  const fechas: string[] = [];
  const cursor = new Date(`${inicio}T00:00:00`);
  const limite = new Date(`${fin}T00:00:00`);
  while (cursor <= limite) {
    if (cursor.getDay() === dia) {
      const mes = String(cursor.getMonth() + 1).padStart(2, '0');
      const diaMes = String(cursor.getDate()).padStart(2, '0');
      fechas.push(`${cursor.getFullYear()}-${mes}-${diaMes}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return fechas;
}

export async function abrirCurso(input: {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  claseIds: string[];
}): Promise<void> {
  const abierto = await cursoAbierto();
  if (abierto) throw new Error('Cierra el curso abierto antes de abrir otro');
  if (!input.nombre.trim()) throw new Error('El curso necesita un nombre');
  if (!input.fechaInicio || !input.fechaFin || input.fechaInicio > input.fechaFin) {
    throw new Error('Las fechas del curso no son válidas');
  }

  const cursos = await listarCursos();
  const solapa = cursos.some(
    curso => !(input.fechaFin < curso.fecha_inicio || input.fechaInicio > curso.fecha_fin)
  );
  if (solapa) throw new Error('Las fechas se solapan con otro curso');

  const { data: creado, error: crearError } = await supabase
    .from('cursos')
    .insert([
      {
        nombre: input.nombre.trim(),
        fecha_inicio: input.fechaInicio,
        fecha_fin: input.fechaFin,
        estado: 'abierto',
      },
    ])
    .select('id')
    .single();
  if (crearError) throw crearError;
  const cursoId = (creado as { id: string }).id;

  if (input.claseIds.length === 0) return;

  const { data: origenes, error: origenError } = await supabase
    .from('clases')
    .select(
      'id, nombre, dia_semana, hora_inicio, hora_fin, nivel_clase, profesor, tipo_clase, observaciones, capacidad_maxima, instalacion_id, recurrencia, contabiliza_como'
    )
    .in('id', input.claseIds);
  if (origenError) throw origenError;

  for (const clase of (origenes || []) as ClaseCopiable[]) {
    const { data: nueva, error: claseError } = await supabase
      .from('clases')
      .insert([
        {
          nombre: clase.nombre,
          dia_semana: clase.dia_semana,
          hora_inicio: clase.hora_inicio,
          hora_fin: clase.hora_fin,
          nivel_clase: clase.nivel_clase,
          profesor: clase.profesor,
          tipo_clase: clase.tipo_clase,
          observaciones: clase.observaciones,
          capacidad_maxima: clase.capacidad_maxima,
          instalacion_id: clase.instalacion_id,
          recurrencia: clase.recurrencia,
          contabiliza_como: clase.contabiliza_como,
          fecha_inicio: input.fechaInicio,
          fecha_fin: input.fechaFin,
          curso_id: cursoId,
        },
      ])
      .select('id')
      .single();
    if (claseError) throw claseError;
    const nuevaId = (nueva as { id: string }).id;

    const { data: asignaciones, error: asignacionesError } = await supabase
      .from('alumnos_clases')
      .select('alumno_id, tipo_asignacion, origen, alumnos (activo, fecha_baja)')
      .eq('clase_id', clase.id);
    if (asignacionesError) throw asignacionesError;

    const copias: Array<{ alumno_id: string; clase_id: string; origen: string; tipo_asignacion: string }> = [];
    ((asignaciones || []) as Array<{
      alumno_id: string;
      tipo_asignacion: string | null;
      origen: string | null;
      alumnos: { activo?: boolean | null; fecha_baja?: string | null } | { activo?: boolean | null; fecha_baja?: string | null }[] | null;
    }>).forEach(asignacion => {
      const permanente =
        !asignacion.tipo_asignacion || asignacion.tipo_asignacion === 'permanente';
      const escuela = !asignacion.origen || asignacion.origen === 'escuela';
      const alumno = Array.isArray(asignacion.alumnos)
        ? asignacion.alumnos[0]
        : asignacion.alumnos;
      if (!permanente || !escuela || !alumno || !esAlumnoActivo(alumno)) return;
      copias.push({
        alumno_id: asignacion.alumno_id,
        clase_id: nuevaId,
        origen: 'escuela',
        tipo_asignacion: 'permanente',
      });
    });
    if (copias.length > 0) {
      const { error: copiaError } = await supabase.from('alumnos_clases').insert(copias);
      if (copiaError) throw copiaError;
    }

    const fechas = fechasDeClase(input.fechaInicio, input.fechaFin, clase.dia_semana);
    if (fechas.length > 0 && clase.hora_inicio && clase.hora_fin) {
      const eventos = fechas.map(fecha => ({
        clase_id: nuevaId,
        fecha,
        hora_inicio: clase.hora_inicio,
        hora_fin: clase.hora_fin,
      }));
      const { error: eventosError } = await supabase.from('eventos_clase').insert(eventos);
      if (eventosError) throw eventosError;
    }
  }
}
