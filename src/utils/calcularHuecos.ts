/** Fila flexible: id de alumno o objeto con alumno_id / id */
export type IdAlumnoFlexible =
  | string
  | number
  | { alumno_id?: string | number; id?: string | number };

export interface CalcularHuecosDisponiblesParams {
  alumnosAsignados?: IdAlumnoFlexible[];
  alumnosLiberados?: IdAlumnoFlexible[];
  alumnosJustificados?: IdAlumnoFlexible[];
  alumnosConFalta?: IdAlumnoFlexible[];
  maxAlumnos?: number;
  esParticular?: boolean;
}

export interface ResultadoHuecos {
  alumnosAsignados: number;
  alumnosLiberados: number;
  alumnosJustificados: number;
  alumnosConFalta: number;
  alumnosPresentes: number;
  huecosReales: number;
  maxAlumnos: number;
}

function idFromFlexible(a: IdAlumnoFlexible): string | number {
  if (typeof a === 'object' && a !== null) {
    return a.alumno_id ?? a.id ?? '';
  }
  return a;
}

export function calcularHuecosDisponibles({
  alumnosAsignados = [],
  alumnosLiberados = [],
  alumnosJustificados = [],
  alumnosConFalta = [],
  maxAlumnos = 4,
  esParticular = false,
}: CalcularHuecosDisponiblesParams): ResultadoHuecos {
  const maxAlumnosCalculado = esParticular ? 1 : maxAlumnos;

  const asignadosIds = new Set(
    alumnosAsignados.map(a => idFromFlexible(a))
  );
  const liberadosIds = new Set(
    alumnosLiberados.map(l => idFromFlexible(l))
  );
  const justificadosIds = new Set(
    alumnosJustificados.map(j => idFromFlexible(j))
  );
  const faltasIds = new Set(alumnosConFalta.map(f => idFromFlexible(f)));

  const alumnosPresentes = Math.max(
    0,
    asignadosIds.size -
      liberadosIds.size -
      justificadosIds.size -
      faltasIds.size
  );

  const huecosReales = Math.max(0, maxAlumnosCalculado - alumnosPresentes);

  return {
    alumnosAsignados: asignadosIds.size,
    alumnosLiberados: liberadosIds.size,
    alumnosJustificados: justificadosIds.size,
    alumnosConFalta: faltasIds.size,
    alumnosPresentes,
    huecosReales,
    maxAlumnos: maxAlumnosCalculado,
  };
}

export interface AsignacionSupabaseLike {
  alumno_id?: string | number;
  tipo_asignacion?: string | null;
  evento_id?: string | null;
  id?: string | number;
  [key: string]: unknown;
}

export interface CalcularHuecosDesdeSupabaseParams {
  asignacionesData?: AsignacionSupabaseLike[];
  liberacionesData?: IdAlumnoFlexible[];
  justificadosData?: IdAlumnoFlexible[];
  faltasData?: IdAlumnoFlexible[];
  eventoId?: string | null;
  maxAlumnos?: number;
  esParticular?: boolean;
}

export function calcularHuecosDesdeSupabase({
  asignacionesData = [],
  liberacionesData = [],
  justificadosData = [],
  faltasData = [],
  eventoId = null,
  maxAlumnos = 4,
  esParticular = false,
}: CalcularHuecosDesdeSupabaseParams): ResultadoHuecos {
  const asignacionesValidas = asignacionesData.filter(ac => {
    const esPermanente =
      !ac.tipo_asignacion || ac.tipo_asignacion === 'permanente';
    const esTemporalDeEsteEvento =
      ac.tipo_asignacion === 'temporal' &&
      (eventoId ? ac.evento_id === eventoId : true);
    return esPermanente || esTemporalDeEsteEvento;
  });

  return calcularHuecosDisponibles({
    alumnosAsignados: asignacionesValidas,
    alumnosLiberados: liberacionesData,
    alumnosJustificados: justificadosData,
    alumnosConFalta: faltasData,
    maxAlumnos,
    esParticular,
  });
}
