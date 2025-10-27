import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import NotificacionesPagos from '../components/NotificacionesPagos';
import { calcularAlumnosConDeuda } from '../utils/calcularDeudas';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    ingresosMes: 0,
    clasesEstaSemana: 0,
    ultimosPagos: [],
    clasesIncompletas: [],
    alumnosConDeuda: 0,
    totalProfesores: 0,
    profesoresActivos: 0,
    clasesPorProfesor: {},
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarStats = async () => {
      try {
        console.log('🔄 Intentando cargar datos del Dashboard...');

        // Intentar cargar datos reales de Supabase
        const [
          alumnosRes,
          pagosRes,
          clasesRes,
          asignadosRes,
          eventosRes,
          asistenciasRes,
          profesoresRes,
        ] = await Promise.all([
          supabase.from('alumnos').select('*'),
          supabase.from('pagos').select(`*, alumnos (nombre)`),
          supabase.from('clases').select('*'),
          supabase.from('alumnos_clases').select('clase_id'),
          supabase
            .from('eventos_clase')
            .select(
              `
            id,
            fecha,
            estado,
            clase_id,
            clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
          `
            )
            .neq('estado', 'eliminado'),
          // Asistencias con faltas (justificadas y no justificadas) en los próximos 30 días
          (() => {
            const inicio = new Date();
            inicio.setHours(0, 0, 0, 0);
            const fin = new Date();
            fin.setDate(fin.getDate() + 30); // Ampliar a 30 días
            fin.setHours(23, 59, 59, 999);
            const inicioISO = inicio.toISOString().split('T')[0];
            const finISO = fin.toISOString().split('T')[0];
            return supabase
              .from('asistencias')
              .select(
                `id, alumno_id, clase_id, fecha, estado, alumnos (nombre)`
              ) // alumnos para mostrar nombre
              .in('estado', ['justificada', 'falta'])
              .gte('fecha', inicioISO)
              .lte('fecha', finISO);
          })(),
          // Profesores
          supabase.from('profesores').select('*'),
        ]);

        const { data: alumnosData, error: alumnosError } = alumnosRes;
        const { data: pagosData, error: pagosError } = pagosRes;
        const { data: clasesData, error: clasesError } = clasesRes;
        const { data: asignadosData, error: asignadosError } = asignadosRes;
        const { data: eventosData, error: eventosError } = eventosRes;
        const { data: asistenciasData, error: asistenciasError } =
          asistenciasRes;
        const { data: profesoresData, error: profesoresError } = profesoresRes;

        if (alumnosError) throw alumnosError;
        if (pagosError) throw pagosError;
        if (clasesError) throw clasesError;
        if (asignadosError) throw asignadosError;
        if (eventosError) throw eventosError;
        if (asistenciasError) throw asistenciasError;
        if (profesoresError) throw profesoresError;

        // Aseguramos que sean arrays
        const safeAlumnosData = Array.isArray(alumnosData) ? alumnosData : [];
        const safePagosData = Array.isArray(pagosData) ? pagosData : [];
        const safeClasesData = Array.isArray(clasesData) ? clasesData : [];
        const safeAsignadosData = Array.isArray(asignadosData)
          ? asignadosData
          : [];
        const safeEventosData = Array.isArray(eventosData) ? eventosData : [];
        const safeAsistenciasData = Array.isArray(asistenciasData)
          ? asistenciasData
          : [];
        const safeProfesoresData = Array.isArray(profesoresData)
          ? profesoresData
          : [];

        console.log('📊 Datos cargados desde Supabase:');
        console.log('👥 Alumnos:', safeAlumnosData.length);
        console.log('💰 Pagos:', safePagosData.length);
        console.log('📚 Clases:', safeClasesData.length);
        console.log('🔗 Asignaciones:', safeAsignadosData.length);
        console.log('📅 Eventos:', safeEventosData.length);
        console.log('📋 Asistencias:', safeAsistenciasData.length);
        console.log('👨‍🏫 Profesores:', safeProfesoresData.length);

        // Debug de asistencias
        if (safeAsistenciasData.length > 0) {
          console.log(
            '📋 Primeras 3 asistencias:',
            safeAsistenciasData.slice(0, 3)
          );
        } else {
          console.log(
            '⚠️ No se encontraron asistencias justificadas en los próximos 7 días'
          );
        }

        // Mostrar algunas clases de ejemplo
        console.log('📋 Primeras 3 clases:', safeClasesData.slice(0, 3));
        console.log(
          '🔗 Primeras 5 asignaciones:',
          safeAsignadosData.slice(0, 5)
        );

        const hoy = new Date();
        const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

        // Calcular ingresos del mes
        const ingresosMes = safePagosData
          .filter(p => p.mes_cubierto === mesActual)
          .reduce((acc, p) => acc + p.cantidad, 0);

        // Últimos pagos
        const ultimosPagos = safePagosData
          .sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago))
          .slice(0, 5)
          .map(p => ({
            alumno: p.alumnos?.nombre || 'Alumno eliminado',
            cantidad: p.cantidad,
            mes: p.mes_cubierto,
            fecha: new Date(p.fecha_pago).toLocaleDateString(),
          }));

        // Contar asignaciones por clase (usando la consulta original que funciona)
        const asignaciones = {};
        safeAsignadosData?.forEach(ac => {
          asignaciones[ac.clase_id] = (asignaciones[ac.clase_id] || 0) + 1;
        });

        // 🆕 Obtener liberaciones de plaza activas para descontar de las asignaciones
        const { data: liberacionesData, error: liberacionesError } =
          await supabase
            .from('liberaciones_plaza')
            .select('clase_id, alumno_id, fecha_inicio, fecha_fin')
            .eq('estado', 'activa')
            .lte('fecha_inicio', hoy.toISOString().split('T')[0])
            .gte('fecha_fin', hoy.toISOString().split('T')[0]);

        if (liberacionesError) {
          console.error('Error obteniendo liberaciones:', liberacionesError);
        }

        // Crear mapa de liberaciones por clase
        const liberacionesPorClase = {};
        liberacionesData?.forEach(liberacion => {
          if (!liberacionesPorClase[liberacion.clase_id]) {
            liberacionesPorClase[liberacion.clase_id] = 0;
          }
          liberacionesPorClase[liberacion.clase_id]++;
        });

        console.log('📊 Asignaciones por clase:', asignaciones);
        console.log('🔄 Liberaciones activas por clase:', liberacionesPorClase);
        console.log('📚 Total clases:', safeClasesData.length);
        console.log('👥 Total asignaciones:', safeAsignadosData.length);

        // Calcular eventos incompletos (eventos específicos que no están completos)
        console.log('🔍 ANALIZANDO EVENTOS PARA CLASES INCOMPLETAS...');
        console.log('📅 Total eventos:', safeEventosData.length);
        console.log('📚 Total clases:', safeClasesData.length);
        console.log('👥 Total asignaciones:', safeAsignadosData.length);

        const eventosIncompletos = safeEventosData
          .filter(evento => {
            const fechaEvento = new Date(evento.fecha);
            fechaEvento.setHours(0, 0, 0, 0);

            // Solo eventos de hoy en adelante (los eliminados ya se filtraron en la consulta)
            if (fechaEvento < hoy) {
              console.log(
                `⏰ Evento "${evento.fecha}" es del pasado, saltando`
              );
              return false;
            }

            // Filtrar eventos cancelados aquí
            if (evento.estado === 'cancelada') {
              console.log(
                `❌ Evento "${evento.fecha}" está cancelado, saltando`
              );
              return false;
            }

            // Encontrar la clase correspondiente
            const clase = safeClasesData.find(c => c.id === evento.clase_id);
            if (!clase) {
              console.log(`❌ No se encontró clase para evento ${evento.id}`);
              return false;
            }

            // Contar alumnos asignados a esta clase específica
            const alumnosAsignados = asignaciones[clase.id] || 0;

            // 🆕 Descontar liberaciones de plaza activas
            const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
            const alumnosDisponibles = Math.max(
              0,
              alumnosAsignados - liberacionesActivas
            );

            // Determinar si es particular basándose en el nombre de la clase
            const esParticular =
              clase.nombre?.toLowerCase().includes('particular') ||
              clase.tipo_clase === 'particular';
            const maxAlumnos = esParticular ? 1 : 4;
            const esIncompleto = alumnosDisponibles < maxAlumnos;

            console.log(`🔍 Evento "${clase.nombre}" (${evento.fecha}):`, {
              tipo: clase.tipo_clase,
              esParticular: esParticular,
              asignados: alumnosAsignados,
              liberaciones: liberacionesActivas,
              disponibles: alumnosDisponibles,
              maximo: maxAlumnos,
              incompleto: esIncompleto,
              fechaEvento: fechaEvento.toISOString(),
              hoy: hoy.toISOString(),
              esFuturo: fechaEvento >= hoy,
              estado: evento.estado,
            });

            if (esIncompleto) {
              console.log(
                `✅ EVENTO INCOMPLETO DETECTADO: "${clase.nombre}" con ${alumnosDisponibles}/${maxAlumnos} alumnos disponibles (${alumnosAsignados} asignados - ${liberacionesActivas} liberaciones)`
              );
            }

            return esIncompleto;
          })
          .map(evento => {
            const clase = safeClasesData.find(c => c.id === evento.clase_id);
            const alumnosAsignados = asignaciones[clase.id] || 0;
            const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
            const alumnosDisponibles = Math.max(
              0,
              alumnosAsignados - liberacionesActivas
            );

            return {
              id: evento.id, // ID del evento para resaltar
              nombre: clase.nombre,
              nivel_clase: clase.nivel_clase,
              dia_semana: clase.dia_semana,
              tipo_clase: clase.tipo_clase,
              fecha: evento.fecha,
              alumnosAsignados: alumnosAsignados,
              alumnosDisponibles: alumnosDisponibles,
              liberacionesActivas: liberacionesActivas,
              eventoId: evento.id,
            };
          });

        console.log(
          '⚠️ Eventos FUTUROS incompletos encontrados:',
          eventosIncompletos.length
        );
        console.log(
          '📋 Detalles de eventos futuros incompletos:',
          eventosIncompletos
        );

        // Si no hay eventos futuros incompletos, mostrar clases que necesitan alumnos en general
        let clasesQueNecesitanAlumnos = [...eventosIncompletos];

        if (eventosIncompletos.length === 0) {
          console.log(
            '🔍 No hay eventos futuros incompletos. Analizando clases que necesitan alumnos...'
          );

          // Buscar clases que tienen menos alumnos de los esperados
          const clasesIncompletasGenerales = safeClasesData.filter(clase => {
            const alumnosAsignados = asignaciones[clase.id] || 0;
            const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
            const alumnosDisponibles = Math.max(
              0,
              alumnosAsignados - liberacionesActivas
            );
            const esParticular =
              clase.nombre?.toLowerCase().includes('particular') ||
              clase.tipo_clase === 'particular';
            const maxAlumnos = esParticular ? 1 : 4;
            const esIncompleto = alumnosDisponibles < maxAlumnos;

            return esIncompleto;
          });

          console.log(
            `📚 Clases que necesitan alumnos: ${clasesIncompletasGenerales.length}`
          );

          // Convertir clases incompletas a formato de eventos para mostrar en el dashboard
          clasesQueNecesitanAlumnos = clasesIncompletasGenerales.map(clase => {
            const alumnosAsignados = asignaciones[clase.id] || 0;
            const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
            const alumnosDisponibles = Math.max(
              0,
              alumnosAsignados - liberacionesActivas
            );

            return {
              id: `clase-${clase.id}`,
              nombre: clase.nombre,
              nivel_clase: clase.nivel_clase,
              dia_semana: clase.dia_semana,
              tipo_clase: clase.tipo_clase,
              fecha: 'Próximamente',
              alumnosAsignados: alumnosAsignados,
              alumnosDisponibles: alumnosDisponibles,
              liberacionesActivas: liberacionesActivas,
              eventoId: `clase-${clase.id}`,
            };
          });
        }

        // Resumen de todas las clases para debugging
        console.log('📊 RESUMEN DE TODAS LAS CLASES:');
        safeClasesData.forEach(clase => {
          const alumnosAsignados = asignaciones[clase.id] || 0;
          const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
          const alumnosDisponibles = Math.max(
            0,
            alumnosAsignados - liberacionesActivas
          );
          const esParticular =
            clase.nombre?.toLowerCase().includes('particular') ||
            clase.tipo_clase === 'particular';
          const maxAlumnos = esParticular ? 1 : 4;
          const esIncompleto = alumnosDisponibles < maxAlumnos;

          console.log(
            `  📚 "${clase.nombre}": ${alumnosDisponibles}/${maxAlumnos} disponibles (${alumnosAsignados} asignados - ${liberacionesActivas} liberaciones) ${esIncompleto ? '❌ INCOMPLETA' : '✅ COMPLETA'}`
          );
        });

        // Calcular clases de esta semana (clases que tienen eventos en los próximos 7 días)
        const inicioSemana = new Date();
        const finSemana = new Date();
        finSemana.setDate(finSemana.getDate() + 7);

        // Si no hay eventos futuros, contar clases activas (que tienen alumnos asignados)
        let clasesEstaSemana = safeEventosData.filter(evento => {
          const fechaEvento = new Date(evento.fecha);
          return fechaEvento >= inicioSemana && fechaEvento <= finSemana;
        }).length;

        // Si no hay eventos futuros, mostrar clases activas como alternativa
        if (clasesEstaSemana === 0) {
          console.log('📅 No hay eventos futuros. Contando clases activas...');
          clasesEstaSemana = safeClasesData.filter(clase => {
            const alumnosAsignados = asignaciones[clase.id] || 0;
            return alumnosAsignados > 0; // Clases que tienen al menos un alumno
          }).length;
          console.log(`📚 Clases activas encontradas: ${clasesEstaSemana}`);
        }

        // Calcular huecos por faltas (justificadas y no justificadas)
        console.log('🔍 Analizando huecos por faltas...');
        console.log(
          '📋 Asistencias con faltas encontradas:',
          safeAsistenciasData.length
        );

        const faltasPorEvento = new Map();
        safeAsistenciasData.forEach(a => {
          const key = `${a.clase_id}|${a.fecha}`;
          if (!faltasPorEvento.has(key)) faltasPorEvento.set(key, []);
          faltasPorEvento.get(key).push(a);
        });

        console.log('📋 Mapa de faltas por evento:', faltasPorEvento);

        // Primero intentar con eventos futuros
        let huecosPorFaltas = safeEventosData
          .filter(evento => {
            const fechaEvento = new Date(evento.fecha);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            return fechaEvento >= hoy && evento.estado !== 'cancelada';
          })
          .map(evento => {
            const key = `${evento.clase_id}|${evento.fecha}`;
            const faltas = faltasPorEvento.get(key) || [];
            const clase = safeClasesData.find(c => c.id === evento.clase_id);

            // Calcular huecos reales disponibles
            const esParticular = clase?.tipo_clase === 'particular';
            const maxAlumnos = esParticular ? 1 : 4;
            const alumnosAsignados = asignaciones[evento.clase_id] || 0;
            const liberacionesActivas =
              liberacionesPorClase[evento.clase_id] || 0;
            const alumnosDisponibles = Math.max(
              0,
              alumnosAsignados - liberacionesActivas
            );
            const huecosReales = Math.max(0, maxAlumnos - alumnosDisponibles);

            return {
              eventoId: evento.id,
              claseId: evento.clase_id,
              nombre: clase?.nombre || 'Clase',
              nivel_clase: clase?.nivel_clase,
              dia_semana: clase?.dia_semana,
              tipo_clase: clase?.tipo_clase,
              fecha: evento.fecha,
              cantidadHuecos: huecosReales,
              alumnosConFaltas: faltas.map(f => ({
                id: f.alumno_id,
                nombre: f.alumnos?.nombre || 'Alumno',
                estado: f.estado,
                derechoRecuperacion: f.estado === 'justificada',
              })),
              tieneFaltas: faltas.length > 0,
            };
          })
          .filter(item => item.tieneFaltas && item.cantidadHuecos > 0)
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        // Si no hay eventos futuros con faltas, mostrar clases con huecos disponibles
        if (huecosPorFaltas.length === 0) {
          console.log(
            '⚠️ No hay eventos futuros con faltas. Mostrando clases con huecos disponibles...'
          );

          huecosPorFaltas = safeClasesData
            .filter(clase => {
              const alumnosAsignados = asignaciones[clase.id] || 0;
              const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
              const alumnosDisponibles = Math.max(
                0,
                alumnosAsignados - liberacionesActivas
              );
              const esParticular = clase.tipo_clase === 'particular';
              const maxAlumnos = esParticular ? 1 : 4;
              const huecosDisponibles = Math.max(
                0,
                maxAlumnos - alumnosDisponibles
              );

              return huecosDisponibles > 0; // Solo clases con huecos disponibles
            })
            .map(clase => {
              const alumnosAsignados = asignaciones[clase.id] || 0;
              const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
              const alumnosDisponibles = Math.max(
                0,
                alumnosAsignados - liberacionesActivas
              );
              const esParticular = clase.tipo_clase === 'particular';
              const maxAlumnos = esParticular ? 1 : 4;
              const huecosDisponibles = Math.max(
                0,
                maxAlumnos - alumnosDisponibles
              );

              return {
                eventoId: `clase-${clase.id}`,
                claseId: clase.id,
                nombre: clase.nombre,
                nivel_clase: clase.nivel_clase,
                dia_semana: clase.dia_semana,
                tipo_clase: clase.tipo_clase,
                fecha: 'Próximamente',
                cantidadHuecos: huecosDisponibles,
                alumnosConFaltas: [],
                tieneFaltas: false,
              };
            })
            .slice(0, 5); // Limitar a 5 para no sobrecargar
        }

        console.log(
          `📊 Huecos por faltas encontrados: ${huecosPorFaltas.length}`
        );

        const totalHuecosPorFaltas = huecosPorFaltas.reduce(
          (acc, e) => acc + e.cantidadHuecos,
          0
        );

        // Calcular alumnos con deuda (todos los alumnos con clases Escuela)
        const { count: alumnosConDeuda } = await calcularAlumnosConDeuda(
          safeAlumnosData,
          safePagosData,
          false
        );

        // Calcular estadísticas de profesores
        const profesoresActivos = safeProfesoresData.filter(
          p => p.activo
        ).length;
        const clasesPorProfesor = {};
        safeClasesData.forEach(clase => {
          if (clase.profesor) {
            clasesPorProfesor[clase.profesor] =
              (clasesPorProfesor[clase.profesor] || 0) + 1;
          }
        });

        setStats({
          totalAlumnos: safeAlumnosData.length,
          ingresosMes,
          clasesEstaSemana,
          ultimosPagos,
          clasesIncompletas: clasesQueNecesitanAlumnos,
          alumnosConDeuda,
          huecosPorFaltas: huecosPorFaltas,
          totalHuecosPorFaltas,
          totalProfesores: safeProfesoresData.length,
          profesoresActivos,
          clasesPorProfesor,
        });

        console.log('✅ Datos del Dashboard cargados desde Supabase');
      } catch (err) {
        console.error('💥 Error cargando stats desde Supabase:', err);
        console.log('🛠️ Usando datos de demostración...');

        // Datos de demostración cuando Supabase falla
        setStats({
          totalAlumnos: 12,
          ingresosMes: 1250,
          clasesEstaSemana: 8,
          totalProfesores: 3,
          profesoresActivos: 2,
          clasesPorProfesor: { 'Juan Pérez': 5, 'María García': 3 },
          ultimosPagos: [
            {
              alumno: 'María García',
              cantidad: 80,
              mes: '2024-01',
              fecha: '15/01/2024',
            },
            {
              alumno: 'Carlos López',
              cantidad: 60,
              mes: '2024-01',
              fecha: '14/01/2024',
            },
            {
              alumno: 'Ana Martín',
              cantidad: 100,
              mes: '2024-01',
              fecha: '13/01/2024',
            },
            {
              alumno: 'Pedro Ruiz',
              cantidad: 80,
              mes: '2024-01',
              fecha: '12/01/2024',
            },
            {
              alumno: 'Laura Sánchez',
              cantidad: 60,
              mes: '2024-01',
              fecha: '11/01/2024',
            },
          ],
          clasesIncompletas: [
            {
              id: 1,
              nombre: 'Iniciación Martes',
              nivel_clase: 'Principiante',
              dia_semana: 'Martes',
              tipo_clase: 'grupal',
            },
            {
              id: 2,
              nombre: 'Avanzado Jueves',
              nivel_clase: 'Avanzado',
              dia_semana: 'Jueves',
              tipo_clase: 'grupal',
            },
          ],
          alumnosConDeuda: 3,
          huecosPorFaltas: [],
          totalHuecosPorFaltas: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    cargarStats();
  }, []);

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          {/* Spinner mejorado siguiendo principios de Refactoring UI */}
          <div className='inline-block relative'>
            <div className='w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin'></div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-8 h-8 bg-blue-600 dark:bg-blue-400 rounded-full opacity-20'></div>
            </div>
          </div>
          <p className='text-lg font-semibold text-gray-700 dark:text-gray-300'>
            Cargando datos...
          </p>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Por favor espera un momento
          </p>
        </div>
      </div>
    );

  return (
    <div className='space-y-6'>
      {/* Header - Refactoring UI principles */}
      <div className='bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm'>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6'>
          <div>
            <h1 className='text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight'>
              Dashboard
            </h1>
            <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium'>
              Visión general de tu academia de pádel
            </p>
          </div>
          <div className='flex items-center gap-4 sm:gap-6'>
            <div className='text-right'>
              <p className='text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                Hoy
              </p>
              <p className='text-lg sm:text-xl font-bold text-gray-900 dark:text-white'>
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas principales - Aplicando principios de Refactoring UI */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6'>
        {/* Alumnos */}
        <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 group'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
                Alumnos
              </p>
              <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
                {stats.totalAlumnos}
              </p>
            </div>
            <div className='bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 transition-colors'>
              <svg
                className='w-7 h-7 text-blue-600 dark:text-blue-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                />
              </svg>
            </div>
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
            Total registrados
          </div>
        </div>

        {/* Ingresos */}
        <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 group'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
                Ingresos
              </p>
              <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
                €{stats.ingresosMes.toLocaleString('es-ES')}
              </p>
            </div>
            <div className='bg-green-50 dark:bg-green-950/30 p-3 rounded-xl group-hover:bg-green-100 dark:group-hover:bg-green-950/50 transition-colors'>
              <svg
                className='w-7 h-7 text-green-600 dark:text-green-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                />
              </svg>
            </div>
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
            Este mes
          </div>
        </div>

        {/* Clases */}
        <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 group'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
                Clases
              </p>
              <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
                {stats.clasesEstaSemana}
              </p>
            </div>
            <div className='bg-purple-50 dark:bg-purple-950/30 p-3 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-950/50 transition-colors'>
              <svg
                className='w-7 h-7 text-purple-600 dark:text-purple-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
            </div>
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
            Esta semana
          </div>
        </div>

        {/* Clases incompletas */}
        <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-yellow-500 focus-within:ring-offset-2 group'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
                Incompletas
              </p>
              <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
                {stats.clasesIncompletas.length}
              </p>
            </div>
            <div className='bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-xl group-hover:bg-yellow-100 dark:group-hover:bg-yellow-950/50 transition-colors'>
              <svg
                className='w-7 h-7 text-yellow-600 dark:text-yellow-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
            Necesitan alumnos
          </div>
        </div>

        {/* Alumnos con deuda */}
        <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-red-500 focus-within:ring-offset-2 group'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
                Pendientes
              </p>
              <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
                {stats.alumnosConDeuda}
              </p>
            </div>
            <div className='bg-red-50 dark:bg-red-950/30 p-3 rounded-xl group-hover:bg-red-100 dark:group-hover:bg-red-950/50 transition-colors'>
              <svg
                className='w-7 h-7 text-red-600 dark:text-red-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                />
              </svg>
            </div>
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
            Pagos pendientes
          </div>
        </div>

        {/* Profesores */}
        <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 group'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
                Profesores
              </p>
              <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
                {stats.totalProfesores}
              </p>
            </div>
            <div className='bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/50 transition-colors'>
              <svg
                className='w-7 h-7 text-indigo-600 dark:text-indigo-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
            </div>
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
            {stats.profesoresActivos} activos
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className='grid lg:grid-cols-2 gap-8'>
        {/* Notificaciones de pagos pendientes */}
        <NotificacionesPagos />

        {/* Huecos por faltas justificadas (próximos 7 días) - Mejorado con Refactoring UI */}
        <div className='bg-white dark:bg-dark-surface p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border hover:shadow-md transition-shadow duration-200'>
          <div className='flex items-center gap-4 mb-6'>
            <div className='bg-orange-50 dark:bg-orange-950/30 p-3.5 rounded-2xl'>
              <svg
                className='w-7 h-7 text-orange-600 dark:text-orange-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <h2 className='text-2xl font-bold tracking-tight text-gray-900 dark:text-white'>
              Huecos por faltas
            </h2>
            <span className='ml-auto inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800'>
              {stats?.totalHuecosPorFaltas || 0} huecos
            </span>
          </div>
          {(stats?.huecosPorFaltas?.length || 0) === 0 ? (
            <p className='text-gray-500 dark:text-dark-text2 text-sm'>
              No hay faltas próximas.
            </p>
          ) : (
            <div className='space-y-3'>
              {stats.huecosPorFaltas.slice(0, 6).map(item => (
                <div
                  key={`${item.claseId}-${item.fecha}`}
                  className='flex items-center justify-between p-5 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-950/30 hover:border-orange-200 dark:hover:border-orange-700 transition-all duration-200 cursor-pointer group min-h-[52px] focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2'
                  onClick={() =>
                    navigate(
                      `/clases?tab=proximas&view=table&highlight=${item.eventoId}`
                    )
                  }
                  title='Ir a la clase para asignar huecos'
                >
                  <div className='min-w-0 mr-4 flex-1'>
                    <p className='font-semibold text-gray-900 dark:text-white truncate group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors mb-1'>
                      {item.nombre}
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400 truncate'>
                      {item.nivel_clase} • {item.dia_semana} •{' '}
                      {item.fecha === 'Próximamente'
                        ? 'Próximamente'
                        : new Date(item.fecha).toLocaleDateString('es-ES')}
                    </p>
                    {item.alumnosConFaltas?.length > 0 && (
                      <p className='text-xs text-gray-500 dark:text-gray-400 mt-1.5 truncate font-medium'>
                        Libres:{' '}
                        {item.alumnosConFaltas
                          .map(
                            a =>
                              `${a.nombre}${a.derechoRecuperacion ? ' (recuperación)' : ''}`
                          )
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <div className='text-right flex-shrink-0'>
                    <span className='inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-white text-orange-700 border-2 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-700/50 shadow-sm'>
                      {item.cantidadHuecos} hueco
                      {item.cantidadHuecos !== 1 ? 's' : ''}
                    </span>
                    <div className='mt-2 text-xs text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium'>
                      Asignar →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clases incompletas detalladas - Mejorado con Refactoring UI */}
        <div className='bg-white dark:bg-dark-surface p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border hover:shadow-md transition-shadow duration-200'>
          <div className='flex items-center gap-4 mb-6'>
            <div className='bg-yellow-50 dark:bg-yellow-950/30 p-3.5 rounded-2xl'>
              <svg
                className='w-7 h-7 text-yellow-600 dark:text-yellow-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
            <h2 className='text-2xl font-bold tracking-tight text-gray-900 dark:text-white'>
              Clases incompletas
            </h2>
          </div>
          {stats.clasesIncompletas.length === 0 ? (
            <p className='text-gray-500 dark:text-dark-text2 text-sm'>
              ¡Excelente! Todas las clases tienen alumnos asignados.
            </p>
          ) : (
            <div className='space-y-3'>
              {stats.clasesIncompletas.slice(0, 5).map(clase => (
                <div
                  key={clase.id}
                  className='flex items-center justify-between p-5 bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl border border-yellow-100 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 hover:border-yellow-200 dark:hover:border-yellow-700 transition-all duration-200 cursor-pointer group min-h-[52px] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2'
                  onClick={() => {
                    console.log(
                      `🎯 Navegando a evento específico: ${clase.eventoId}`
                    );
                    navigate(
                      `/clases?tab=proximas&view=table&highlight=${clase.eventoId}`
                    );
                  }}
                  title='Hacer clic para ver este evento específico en la tabla'
                >
                  <div className='flex-1'>
                    <p className='font-semibold text-gray-900 dark:text-white group-hover:text-yellow-700 dark:group-hover:text-yellow-300 transition-colors mb-1'>
                      {clase.nombre}
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      {clase.nivel_clase} • {clase.dia_semana} •{' '}
                      {clase.fecha === 'Próximamente'
                        ? 'Próximamente'
                        : new Date(clase.fecha).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className='text-right ml-4 flex-shrink-0'>
                    <span
                      className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border-2 shadow-sm ${
                        clase.tipo_clase === 'particular'
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-700/50'
                          : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700/50'
                      }`}
                    >
                      {clase.tipo_clase === 'particular'
                        ? '🎯 Particular'
                        : '👥 Grupal'}
                    </span>
                    <div className='mt-2 text-xs text-yellow-600 dark:text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium'>
                      Ver →
                    </div>
                  </div>
                </div>
              ))}
              {stats.clasesIncompletas.length > 5 && (
                <p className='text-sm text-gray-500 dark:text-dark-text2 text-center'>
                  Y {stats.clasesIncompletas.length - 5} clases más...
                </p>
              )}
              <div className='pt-4 border-t border-yellow-100 dark:border-yellow-800/50'>
                <button
                  onClick={() => navigate('/clases?tab=proximas&view=table')}
                  className='w-full px-5 py-3.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2'
                  aria-label='Ver todas las clases en formato de tabla'
                >
                  Ver todas las clases →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Últimos pagos - Mejorado con Refactoring UI */}
        <div className='bg-white dark:bg-dark-surface p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border hover:shadow-md transition-shadow duration-200'>
          <div className='flex items-center gap-4 mb-6'>
            <div className='bg-green-50 dark:bg-green-950/30 p-3.5 rounded-2xl'>
              <svg
                className='w-7 h-7 text-green-600 dark:text-green-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                />
              </svg>
            </div>
            <h2 className='text-2xl font-bold tracking-tight text-gray-900 dark:text-white'>
              Últimos pagos
            </h2>
          </div>
          {stats.ultimosPagos.length === 0 ? (
            <div className='py-12 text-center'>
              <p className='text-gray-500 dark:text-gray-400 text-base mb-2'>
                No hay pagos registrados
              </p>
              <p className='text-sm text-gray-400 dark:text-gray-500'>
                Los pagos aparecerán aquí cuando se registren
              </p>
            </div>
          ) : (
            <div className='space-y-2'>
              {stats.ultimosPagos.map((pago, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-100 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-950/30 hover:border-green-200 dark:hover:border-green-700 transition-all duration-200'
                >
                  <div className='flex-1'>
                    <p className='font-semibold text-gray-900 dark:text-white mb-1'>
                      {pago.alumno}
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
                      {pago.mes}
                    </p>
                  </div>
                  <div className='text-right ml-4'>
                    <p className='font-bold text-lg text-green-700 dark:text-green-400 tabular-nums'>
                      €{pago.cantidad.toLocaleString('es-ES')}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
                      {pago.fecha}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
