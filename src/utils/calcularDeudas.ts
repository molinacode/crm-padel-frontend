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
    return mesCubierto.trim();
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

  if (!/^\d{4}-\d{2}$/.test(mesCubierto.trim())) {
    return mesCubierto;
  }

  const [año, mes] = mesCubierto.trim().split('-');
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

export interface PagoDeudaInput {
  alumno_id?: string | null;
  tipo_pago?: string | null;
  mes_cubierto?: string | null;
  fecha_inicio?: string | null;
  fecha_pago?: string | null;
}

/** PostgREST puede devolver objeto o array en relaciones !inner segun version. */
function primeraRelacion<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  if (Array.isArray(x)) return x[0] ?? null;
  return x;
}

export interface AlumnoAsignadoRow {
  alumno_id: string;
  clase_id: string;
  origen?: string | null;
  alumnos: AlumnoDeudaInput | AlumnoDeudaInput[] | null;
  clases:
    | { id: string; nombre?: string | null; tipo_clase?: string | null }
    | { id: string; nombre?: string | null; tipo_clase?: string | null }[]
    | null;
}

export interface AlumnoConClasesPagables extends AlumnoDeudaInput {
  clasesPagables: { id: string; nombre?: string | null; tipo_clase?: string | null }[];
}

export interface AlumnoConDeuda
  extends Omit<AlumnoConClasesPagables, 'clasesPagables'> {
  clasesPagables: number;
  diasSinPagar: number;
  ultimoPago?: string;
}

export const calcularAlumnosConDeuda = async (
  alumnos: AlumnoDeudaInput[],
  pagos: PagoDeudaInput[],
  soloMesActual = false
): Promise<{ count: number; alumnos: AlumnoConDeuda[] }> => {
  try {
    const hoy = new Date();
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    let query = supabase
      .from('alumnos_clases')
      .select(
        `
        alumno_id,
        clase_id,
        origen,
        alumnos!inner (
          id,
          nombre,
          activo
        ),
        clases!inner (
          id,
          nombre,
          tipo_clase
        )
      `
      )
      .in(
        'alumno_id',
        alumnos.filter(a => a.activo !== false).map(a => a.id)
      );

    if (soloMesActual) {
      const { data: eventosMes, error: eventosError } = await supabase
        .from('eventos_clase')
        .select('clase_id')
        .gte('fecha', inicioMes.toISOString().split('T')[0])
        .lte('fecha', finMes.toISOString().split('T')[0])
        .neq('estado', 'eliminado')
        .neq('estado', 'cancelada');

      if (eventosError) throw eventosError;

      const clasesDelMes = eventosMes?.map(e => e.clase_id) ?? [];

      if (clasesDelMes.length === 0) {
        return { count: 0, alumnos: [] };
      }

      query = query.in('clase_id', clasesDelMes);
    }

    const { data: alumnosAsignados, error } = await query;

    if (error) throw error;

    const alumnosAsignadosActivos = (alumnosAsignados ?? []).filter(
      asignacion => {
        const alumno = primeraRelacion(
          (asignacion as AlumnoAsignadoRow).alumnos
        );
        return Boolean(alumno && esAlumnoActivo(alumno, new Date()));
      }
    ) as AlumnoAsignadoRow[];

    const alumnosConClasesPagables: Record<string, AlumnoConClasesPagables> =
      {};
    alumnosAsignadosActivos.forEach(asignacion => {
      const alumno = primeraRelacion(asignacion.alumnos);
      const clase = primeraRelacion(asignacion.clases);
      const origenAsignacion = asignacion.origen ?? 'escuela';

      if (!alumno || !clase) return;

      if (
        origenAsignacion === 'escuela' &&
        clase.nombre?.toLowerCase().includes('escuela') &&
        esAlumnoActivo(alumno, new Date())
      ) {
        if (!alumnosConClasesPagables[alumno.id]) {
          alumnosConClasesPagables[alumno.id] = {
            ...alumno,
            clasesPagables: [],
          };
        }
        alumnosConClasesPagables[alumno.id].clasesPagables.push(clase);
      } else {
        console.log('⏭️ Saltando clase interna:', clase?.nombre);
      }
    });

    console.log(
      '💰 Alumnos con clases pagables:',
      Object.keys(alumnosConClasesPagables).length
    );

    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const alumnosConDeuda: AlumnoConDeuda[] = [];

    Object.values(alumnosConClasesPagables).forEach(alumno => {
      const pagosAlumno = pagos.filter(p => p.alumno_id === alumno.id);

      const tienePagoMesActual = pagosAlumno.some(
        p =>
          p.tipo_pago === 'mensual' &&
          correspondeMesActual(p.mes_cubierto, mesActual)
      );

      const tienePagoClasesReciente = pagosAlumno.some(
        p =>
          p.tipo_pago === 'clases' &&
          p.fecha_inicio &&
          new Date(p.fecha_inicio) >= hace30Dias
      );

      const listaPagables = alumno.clasesPagables;
      if (
        !tienePagoMesActual &&
        !tienePagoClasesReciente &&
        listaPagables.length > 0
      ) {
        const ultimoPago = pagosAlumno[0];
        const diasSinPagar = ultimoPago?.fecha_pago
          ? Math.floor(
              (hoy.getTime() - new Date(ultimoPago.fecha_pago).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 999;

        const { clasesPagables: _listaClases, ...baseAlumno } = alumno;
        void _listaClases;

        alumnosConDeuda.push({
          ...baseAlumno,
          clasesPagables: listaPagables.length,
          diasSinPagar,
          ultimoPago: ultimoPago?.fecha_pago ?? undefined,
        });
      }
    });

    return {
      count: alumnosConDeuda.length,
      alumnos: alumnosConDeuda,
    };
  } catch (err) {
    console.error('💥 Error calculando alumnos con deuda:', err);
    return { count: 0, alumnos: [] };
  }
};
