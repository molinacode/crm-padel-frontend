import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { correspondeMesActual } from '../utils/calcularDeudas';
import { esAlumnoActivo } from '../utils/alumnoUtils';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';

interface AlumnoBase {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  activo?: boolean | null;
}

interface ClaseAsignada {
  id: string;
  tipo_clase?: string | null;
  nombre?: string | null;
}

interface AsignacionAlumnoClase {
  alumno_id: string;
  origen?: string | null;
  alumnos: AlumnoBase;
  clases: ClaseAsignada;
}

interface PagoRow {
  alumno_id: string | null;
  tipo_pago?: string | null;
  mes_cubierto?: string | null;
  fecha_inicio?: string | null;
  fecha_pago: string;
}

interface AlumnoConDeuda extends AlumnoBase {
  clasesPagables: number;
  diasSinPagar: number;
  ultimoPago?: string;
  tipoDeuda: 'mensual' | 'clases';
}

export default function NotificacionesPagos() {
  const [alumnosConDeuda, setAlumnosConDeuda] = useState<AlumnoConDeuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarAlumnosConDeuda = async () => {
    try {
      setLoading(true);

      const { data: alumnosAsignados, error: alumnosError } = await supabase
        .from('alumnos_clases')
        .select(
          `
          alumno_id,
          origen,
          alumnos!inner (
            id,
            nombre,
            email,
            telefono,
            activo
          ),
          clases!inner (
            id,
            tipo_clase,
            nombre
          )
        `
        );

      if (alumnosError) throw alumnosError;

      const alumnosAsignadosActivos = ((alumnosAsignados || []) as AsignacionAlumnoClase[]).filter(
        asignacion => {
          const alumno = asignacion.alumnos;
          return alumno && esAlumnoActivo(alumno, new Date());
        }
      );

      const { data: pagos, error: pagosError } = await supabase
        .from('pagos')
        .select('*')
        .order('fecha_pago', { ascending: false });

      if (pagosError) throw pagosError;

      const deudores: AlumnoConDeuda[] = [];
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

      const alumnosConClasesPagables: Record<
        string,
        AlumnoBase & { clasesPagables: ClaseAsignada[] }
      > = {};

      alumnosAsignadosActivos.forEach(asignacion => {
        const alumno = asignacion.alumnos;
        const clase = asignacion.clases;
        const origenAsignacion = asignacion.origen || 'escuela';

        if (
          origenAsignacion === 'escuela' &&
          clase.nombre?.includes('Escuela') &&
          esAlumnoActivo(alumno, new Date())
        ) {
          if (!alumnosConClasesPagables[alumno.id]) {
            alumnosConClasesPagables[alumno.id] = {
              ...alumno,
              clasesPagables: [],
            };
          }
          alumnosConClasesPagables[alumno.id].clasesPagables.push(clase);
        }
      });

      Object.values(alumnosConClasesPagables).forEach(alumno => {
        const pagosAlumno = ((pagos || []) as PagoRow[]).filter(
          p => p.alumno_id === alumno.id
        );

        const tienePagoMesActual = pagosAlumno.some(
          p => p.tipo_pago === 'mensual' && correspondeMesActual(p.mes_cubierto, mesActual)
        );

        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        const tienePagoClasesReciente = pagosAlumno.some(
          p => p.tipo_pago === 'clases' && p.fecha_inicio && new Date(p.fecha_inicio) >= hace30Dias
        );

        if (!tienePagoMesActual && !tienePagoClasesReciente && alumno.clasesPagables.length > 0) {
          const ultimoPago = pagosAlumno[0];
          const diasSinPagar = ultimoPago
            ? Math.floor((hoy.getTime() - new Date(ultimoPago.fecha_pago).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          deudores.push({
            ...alumno,
            diasSinPagar,
            ultimoPago: ultimoPago?.fecha_pago,
            tipoDeuda: tienePagoMesActual ? 'mensual' : 'clases',
            clasesPagables: alumno.clasesPagables.length,
          });
        }
      });

      deudores.sort((a, b) => b.diasSinPagar - a.diasSinPagar);
      setAlumnosConDeuda(deudores);
    } catch (err) {
      console.error('Error cargando alumnos con deuda:', err);
      setError('Error al cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return scheduleEffectWork(() => {
      void cargarAlumnosConDeuda();
    });
  }, []);

  if (loading) {
    return (
      <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='text-center text-red-500 dark:text-red-400'>
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-dark-border'>
      {alumnosConDeuda.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-6xl mb-4'>✅</div>
          <h4 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
            ¡Todo al día!
          </h4>
        </div>
      ) : (
        <div className='space-y-4'>
          {alumnosConDeuda.slice(0, 5).map(alumno => (
            <div key={alumno.id} className='p-4 rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Link to={`/alumno/${alumno.id}`} className='font-semibold text-gray-900 dark:text-dark-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors'>
                      {alumno.nombre}
                    </Link>
                  </div>
                  <p className='text-sm text-gray-600 dark:text-dark-text2'>
                    {alumno.diasSinPagar === 999
                      ? 'Nunca ha realizado un pago'
                      : `Sin pagar desde hace ${alumno.diasSinPagar} días`}
                  </p>
                </div>
                <Link
                  to={`/pagos?alumno=${alumno.id}`}
                  className='px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors'
                >
                  💰 Registrar Pago
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
