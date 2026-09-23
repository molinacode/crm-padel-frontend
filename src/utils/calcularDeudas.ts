import { supabase } from '../lib/supabase';
import { esAlumnoActivo, type AlumnoActivoFields } from './alumnoUtils';

const mesesEspañolNum: Record<string, string> = {
  '01': 'Enero',
  '02': 'Febrero',
  '03': 'Marzo',
  '04': 'Abril',
  '05': 'Mayo',
  '06': 'Junio',
  '07': 'Julio',
  '08': 'Agosto',
  '09': 'Septiembre',
  '10': 'Octubre',
  '11': 'Noviembre',
  '12': 'Diciembre',
};

const mesesEspañol: Record<string, string> = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
};

export const normalizarMesAFormatoFecha = (
  mesCubierto: string | null | undefined
): string | null => {
  if (!mesCubierto) return null;

  if (/^\d{4}-\d{2}$/.test(mesCubierto.trim())) {
    return mesCubierto.trim().slice(0, 7);
  }

  const partes = mesCubierto.trim().toLowerCase().split(/\s+/);
  if (partes.length >= 2) {
    const mesNombre = partes[0];
    const añoTexto = partes[partes.length - 1];
    const mesNum = mesesEspañol[mesNombre];

    if (mesNum && añoTexto && /^\d{4}$/.test(añoTexto)) {
      return `${añoTexto}-${mesNum}`;
    }
  }

  return null;
};

export const formatearMesLegible = (
  mesCubierto: string | null | undefined
): string => {
  if (!mesCubierto) return '-';

  const normalizado = normalizarMesAFormatoFecha(mesCubierto) || mesCubierto.trim();
  if (!/^\d{4}-\d{2}$/.test(normalizado)) {
    return mesCubierto;
  }

  const [año, mes] = normalizado.split('-');
  const mesNombre = mesesEspañolNum[mes ?? ''];

  if (mesNombre && año) {
    return `${mesNombre} ${año}`;
  }

  return mesCubierto;
};

export const correspondeMesActual = (
  mesCubierto: string | null | undefined,
  mesActual: string
): boolean => {
  if (!mesCubierto) return false;
  const mesNormalizado = normalizarMesAFormatoFecha(mesCubierto);
  if (!mesNormalizado) return false;
  return mesNormalizado === mesActual;
};

export interface AlumnoDeudaInput extends AlumnoActivoFields {
  id: string;
  nombre?: string | null;
}

export interface MesDeuda {
  mes: string;
  cursoId: string;
  cursoNombre: string;
  etiqueta: string;
}

export interface AlumnoConDeuda {
  id: string;
  nombre: string;
  baja: boolean;
  meses: MesDeuda[];
  diasSinPagar: number;
  mesReferencia: string;
  deudaTotal: number;
}

interface CursoRow {
  id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

interface AsignacionRow {
  alumno_id: string;
  clase_id: string | null;
  origen: string | null;
  tipo_asignacion: string | null;
}

interface EventoRow {
  clase_id: string | null;
  fecha: string | null;
  estado: string | null;
}

interface ClaseCursoRow {
  id: string;
  curso_id: string | null;
}

interface PagoRow {
  alumno_id: string | null;
  tipo_pago: string | null;
  mes_cubierto: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

function mesesDelRango(inicio: string, fin: string): string[] {
  const meses: string[] = [];
  let year = Number(inicio.slice(0, 4));
  let month = Number(inicio.slice(5, 7));
  const endYear = Number(fin.slice(0, 4));
  const endMonth = Number(fin.slice(5, 7));
  if (!year || !month || !endYear || !endMonth) return meses;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    meses.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return meses;
}

function pagoCubreMes(pago: PagoRow, mes: string): boolean {
  if (pago.tipo_pago === 'mensual') {
    return normalizarMesAFormatoFecha(pago.mes_cubierto) === mes;
  }
  if (pago.tipo_pago === 'clases' && pago.fecha_inicio) {
    const ini = String(pago.fecha_inicio).slice(0, 7);
    const fin = String(pago.fecha_fin || pago.fecha_inicio).slice(0, 7);
    return ini <= mes && mes <= fin;
  }
  return false;
}

function diasDesdeMes(mes: string, hoy: Date): number {
  const inicio = new Date(`${mes}-01T00:00:00`);
  return Math.max(
    0,
    Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  );
}

/**
 * Deuda por mes de curso, abierto o cerrado.
 * Un alumno debe un mes si tuvo clase de escuela ese mes y ningún pago lo cubre.
 */
export const calcularAlumnosConDeuda = async (): Promise<{
  count: number;
  alumnos: AlumnoConDeuda[];
}> => {
  try {
    const [cursosRes, alumnosRes, pagosRes, asignacionesRes, clasesRes, eventosRes] =
      await Promise.all([
        supabase.from('cursos').select('id, nombre, fecha_inicio, fecha_fin, estado'),
        supabase.from('alumnos').select('id, nombre, activo, fecha_baja'),
        supabase.from('pagos').select('alumno_id, tipo_pago, mes_cubierto, fecha_inicio, fecha_fin'),
        supabase
          .from('alumnos_clases')
          .select('alumno_id, clase_id, origen, tipo_asignacion'),
        supabase.from('clases').select('id, curso_id'),
        supabase.from('eventos_clase').select('clase_id, fecha, estado'),
      ]);

    const error =
      cursosRes.error ||
      alumnosRes.error ||
      pagosRes.error ||
      asignacionesRes.error ||
      clasesRes.error ||
      eventosRes.error;
    if (error) throw error;

    const cursos = (cursosRes.data || []) as CursoRow[];
    const alumnos = (alumnosRes.data || []) as AlumnoDeudaInput[];
    const pagos = (pagosRes.data || []) as PagoRow[];
    const asignaciones = (asignacionesRes.data || []) as AsignacionRow[];
    const clases = (clasesRes.data || []) as ClaseCursoRow[];
    const eventos = (eventosRes.data || []) as EventoRow[];

    const cursoPorClase = new Map<string, string>();
    clases.forEach(clase => {
      if (clase.curso_id) cursoPorClase.set(clase.id, clase.curso_id);
    });

    const eventosClaseMes = new Set<string>();
    eventos.forEach(evento => {
      if (!evento.clase_id || !evento.fecha) return;
      if (evento.estado === 'cancelada' || evento.estado === 'eliminado') return;
      eventosClaseMes.add(`${evento.clase_id}|${String(evento.fecha).slice(0, 7)}`);
    });

    const asignacionesEscuela = asignaciones.filter(asignacion => {
      if (!asignacion.clase_id) return false;
      const permanente =
        !asignacion.tipo_asignacion || asignacion.tipo_asignacion === 'permanente';
      const escuela = !asignacion.origen || asignacion.origen === 'escuela';
      return permanente && escuela;
    });

    const hoy = new Date();
    const pagosPorAlumno = new Map<string, PagoRow[]>();
    pagos.forEach(pago => {
      if (!pago.alumno_id) return;
      const lista = pagosPorAlumno.get(pago.alumno_id) || [];
      lista.push(pago);
      pagosPorAlumno.set(pago.alumno_id, lista);
    });

    const resultado: AlumnoConDeuda[] = [];

    alumnos.forEach(alumno => {
      if (!alumno.id) return;
      const suyas = asignacionesEscuela.filter(asignacion => asignacion.alumno_id === alumno.id);
      if (suyas.length === 0) return;

      const meses: MesDeuda[] = [];
      cursos.forEach(curso => {
        const inicio = String(curso.fecha_inicio).slice(0, 10);
        const fin = String(curso.fecha_fin).slice(0, 10);
        mesesDelRango(inicio, fin).forEach(mes => {
          const tuvoClase = suyas.some(asignacion => {
            if (cursoPorClase.get(asignacion.clase_id as string) !== curso.id) return false;
            return eventosClaseMes.has(`${asignacion.clase_id}|${mes}`);
          });
          if (!tuvoClase) return;
          const cubierto = (pagosPorAlumno.get(alumno.id) || []).some(pago =>
            pagoCubreMes(pago, mes)
          );
          if (cubierto) return;
          meses.push({
            mes,
            cursoId: curso.id,
            cursoNombre: curso.nombre,
            etiqueta: formatearMesLegible(mes),
          });
        });
      });

      if (meses.length === 0) return;
      meses.sort((a, b) => a.mes.localeCompare(b.mes));
      const baja = !esAlumnoActivo(alumno, hoy);
      resultado.push({
        id: alumno.id,
        nombre: alumno.nombre || 'Sin nombre',
        baja,
        meses,
        diasSinPagar: diasDesdeMes(meses[0].mes, hoy),
        mesReferencia: meses.map(mes => mes.etiqueta).join(', '),
        deudaTotal: 0,
      });
    });

    resultado.sort((a, b) => b.meses.length - a.meses.length || a.nombre.localeCompare(b.nombre));

    return { count: resultado.length, alumnos: resultado };
  } catch (err) {
    console.error('Error calculando alumnos con deuda:', err);
    return { count: 0, alumnos: [] };
  }
};
