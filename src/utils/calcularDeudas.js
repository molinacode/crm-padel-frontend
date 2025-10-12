import { supabase } from '../lib/supabase';

/**
 * Calcula alumnos con deuda de forma consistente
 * @param {Array} alumnos - Lista de alumnos
 * @param {Array} pagos - Lista de pagos
 * @param {boolean} soloMesActual - Si true, solo considera clases del mes actual
 * @returns {Promise<{count: number, alumnos: Array}>}
 */
export const calcularAlumnosConDeuda = async (
  alumnos,
  pagos,
  soloMesActual = false
) => {
  try {
    console.log('🔄 Calculando alumnos con deuda...');
    console.log(
      '👥 Alumnos activos:',
      alumnos.filter(a => a.activo !== false).length
    );
    console.log('📅 Solo mes actual:', soloMesActual);

    const hoy = new Date();
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // Obtener alumnos activos asignados a clases
    let query = supabase
      .from('alumnos_clases')
      .select(
        `
        alumno_id,
        clase_id,
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
      .eq('alumnos.activo', true)
      .in(
        'alumno_id',
        alumnos.filter(a => a.activo !== false).map(a => a.id)
      );

    // Si solo queremos el mes actual, filtrar por eventos del mes
    if (soloMesActual) {
      console.log('📅 Filtrando por eventos del mes actual...');

      // Obtener eventos del mes en curso (excluyendo eliminados y cancelados)
      const { data: eventosMes, error: eventosError } = await supabase
        .from('eventos_clase')
        .select('clase_id')
        .gte('fecha', inicioMes.toISOString().split('T')[0])
        .lte('fecha', finMes.toISOString().split('T')[0])
        .neq('estado', 'eliminado')
        .neq('estado', 'cancelada');

      if (eventosError) throw eventosError;

      const clasesDelMes = eventosMes?.map(e => e.clase_id) || [];
      console.log('📅 Clases con eventos en el mes:', clasesDelMes.length);

      if (clasesDelMes.length === 0) {
        console.log('⚠️ No hay clases con eventos en el mes actual');
        console.log('📅 Fechas de búsqueda:', {
          inicio: inicioMes.toISOString().split('T')[0],
          fin: finMes.toISOString().split('T')[0],
          mesActual,
        });
        return { count: 0, alumnos: [] };
      }

      query = query.in('clase_id', clasesDelMes);
    }

    const { data: alumnosAsignados, error } = await query;

    if (error) throw error;

    console.log(
      '📋 Alumnos asignados encontrados:',
      alumnosAsignados?.length || 0
    );
    console.log(
      '📋 Detalles de asignaciones:',
      alumnosAsignados?.map(a => ({
        alumno: a.alumnos?.nombre,
        clase: a.clases?.nombre,
        tipoClase: a.clases?.tipo_clase,
      }))
    );

    // Filtrar solo clases que requieren pago directo (clases "Escuela")
    const alumnosConClasesPagables = {};
    alumnosAsignados?.forEach(asignacion => {
      const alumno = asignacion.alumnos;
      const clase = asignacion.clases;

      console.log('🔍 Procesando asignación:', {
        alumno: alumno?.nombre,
        clase: clase?.nombre,
        tipoClase: clase?.tipo_clase,
        nombreLower: clase?.nombre?.toLowerCase(),
        contieneEscuela: clase?.nombre?.toLowerCase().includes('escuela'),
      });

      // Solo clases "Escuela" requieren pago directo (se identifica por el nombre)
      if (clase?.nombre?.toLowerCase().includes('escuela')) {
        if (!alumnosConClasesPagables[alumno.id]) {
          alumnosConClasesPagables[alumno.id] = {
            ...alumno,
            clasesPagables: [],
          };
        }
        alumnosConClasesPagables[alumno.id].clasesPagables.push(clase);
        console.log(
          '✅ Alumno con clase pagable (Escuela):',
          alumno.nombre,
          '- Clase:',
          clase.nombre
        );
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

    const alumnosConDeuda = [];

    // Verificar pagos para cada alumno que tiene clases pagables
    Object.values(alumnosConClasesPagables).forEach(alumno => {
      const pagosAlumno = pagos.filter(p => p.alumno_id === alumno.id);
      console.log(
        `👤 Alumno ${alumno.nombre} tiene ${pagosAlumno.length} pagos`
      );

      const tienePagoMesActual = pagosAlumno.some(
        p => p.tipo_pago === 'mensual' && p.mes_cubierto === mesActual
      );

      const tienePagoClasesReciente = pagosAlumno.some(
        p =>
          p.tipo_pago === 'clases' &&
          p.fecha_inicio &&
          new Date(p.fecha_inicio) >= hace30Dias
      );

      console.log(
        `📊 Alumno ${alumno.nombre}: pago mensual=${tienePagoMesActual}, pago clases=${tienePagoClasesReciente}`
      );

      // Si no tiene pagos recientes Y tiene clases pagables, agregar a la lista de deudores
      if (
        !tienePagoMesActual &&
        !tienePagoClasesReciente &&
        alumno.clasesPagables.length > 0
      ) {
        const ultimoPago = pagosAlumno[0];
        const diasSinPagar = ultimoPago
          ? Math.floor(
              (hoy - new Date(ultimoPago.fecha_pago)) / (1000 * 60 * 60 * 24)
            )
          : 999;

        alumnosConDeuda.push({
          ...alumno,
          diasSinPagar,
          ultimoPago: ultimoPago?.fecha_pago,
          clasesPagables: alumno.clasesPagables.length,
        });

        console.log('🚨 Alumno con deuda:', alumno.nombre);
      }
    });

    console.log('📈 Total alumnos con deuda:', alumnosConDeuda.length);
    console.log('📋 Detalles de alumnos con deuda:', alumnosConDeuda);

    return {
      count: alumnosConDeuda.length,
      alumnos: alumnosConDeuda,
    };
  } catch (err) {
    console.error('💥 Error calculando alumnos con deuda:', err);
    return { count: 0, alumnos: [] };
  }
};
