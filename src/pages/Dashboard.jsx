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
    alumnosConDeuda: 0
  });

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const cargarStats = async () => {
      try {
        console.log('🔄 Intentando cargar datos del Dashboard...');

        // Intentar cargar datos reales de Supabase
        const [alumnosRes, pagosRes, clasesRes, asignadosRes, eventosRes, asistenciasRes] = await Promise.all([
          supabase.from('alumnos').select('*'),
          supabase.from('pagos').select(`*, alumnos (nombre)`),
          supabase.from('clases').select('*'),
          supabase.from('alumnos_clases').select('clase_id'),
          supabase.from('eventos_clase').select(`
            id,
            fecha,
            estado,
            clase_id,
            clases (id, tipo_clase)
          `)
          .neq('estado', 'eliminado')
          ,
          // Asistencias justificadas en los próximos 7 días
          (() => {
            const inicio = new Date();
            inicio.setHours(0, 0, 0, 0);
            const fin = new Date();
            fin.setDate(fin.getDate() + 7);
            fin.setHours(23, 59, 59, 999);
            const inicioISO = inicio.toISOString().split('T')[0];
            const finISO = fin.toISOString().split('T')[0];
            return supabase
              .from('asistencias')
              .select(`id, alumno_id, clase_id, fecha, estado, alumnos (nombre)`) // alumnos para mostrar nombre
              .eq('estado', 'justificada')
              .gte('fecha', inicioISO)
              .lte('fecha', finISO);
          })()
        ]);

        const { data: alumnosData, error: alumnosError } = alumnosRes;
        const { data: pagosData, error: pagosError } = pagosRes;
        const { data: clasesData, error: clasesError } = clasesRes;
        const { data: asignadosData, error: asignadosError } = asignadosRes;
        const { data: eventosData, error: eventosError } = eventosRes;
        const { data: asistenciasData, error: asistenciasError } = asistenciasRes;

        if (alumnosError) throw alumnosError;
        if (pagosError) throw pagosError;
        if (clasesError) throw clasesError;
        if (asignadosError) throw asignadosError;
        if (eventosError) throw eventosError;
        if (asistenciasError) throw asistenciasError;

        // Aseguramos que sean arrays
        const safeAlumnosData = Array.isArray(alumnosData) ? alumnosData : [];
        const safePagosData = Array.isArray(pagosData) ? pagosData : [];
        const safeClasesData = Array.isArray(clasesData) ? clasesData : [];
        const safeAsignadosData = Array.isArray(asignadosData) ? asignadosData : [];
        const safeEventosData = Array.isArray(eventosData) ? eventosData : [];
        const safeAsistenciasData = Array.isArray(asistenciasData) ? asistenciasData : [];

        console.log('📊 Datos cargados desde Supabase:');
        console.log('👥 Alumnos:', safeAlumnosData.length);
        console.log('💰 Pagos:', safePagosData.length);
        console.log('📚 Clases:', safeClasesData.length);
        console.log('🔗 Asignaciones:', safeAsignadosData.length);
        console.log('📅 Eventos:', safeEventosData.length);

        // Mostrar algunas clases de ejemplo
        console.log('📋 Primeras 3 clases:', safeClasesData.slice(0, 3));
        console.log('🔗 Primeras 5 asignaciones:', safeAsignadosData.slice(0, 5));

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
            fecha: new Date(p.fecha_pago).toLocaleDateString()
          }));

        // Contar asignaciones por clase (usando la consulta original que funciona)
        const asignaciones = {};
        safeAsignadosData?.forEach(ac => {
          asignaciones[ac.clase_id] = (asignaciones[ac.clase_id] || 0) + 1;
        });

        // 🆕 Obtener liberaciones de plaza activas para descontar de las asignaciones
        const { data: liberacionesData, error: liberacionesError } = await supabase
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

        const eventosIncompletos = safeEventosData.filter(evento => {
          const fechaEvento = new Date(evento.fecha);
          fechaEvento.setHours(0, 0, 0, 0);

          // Solo eventos de hoy en adelante (los eliminados y cancelados ya se filtraron en la consulta)
          if (fechaEvento < hoy) {
            console.log(`⏰ Evento "${evento.fecha}" es del pasado, saltando`);
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
          const alumnosDisponibles = Math.max(0, alumnosAsignados - liberacionesActivas);

          // Determinar si es particular basándose en el nombre de la clase
          const esParticular = clase.nombre?.toLowerCase().includes('particular') ||
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
            estado: evento.estado
          });

          if (esIncompleto) {
            console.log(`✅ EVENTO INCOMPLETO DETECTADO: "${clase.nombre}" con ${alumnosDisponibles}/${maxAlumnos} alumnos disponibles (${alumnosAsignados} asignados - ${liberacionesActivas} liberaciones)`);
          }

          return esIncompleto;
        }).map(evento => {
          const clase = safeClasesData.find(c => c.id === evento.clase_id);
          const alumnosAsignados = asignaciones[clase.id] || 0;
          const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
          const alumnosDisponibles = Math.max(0, alumnosAsignados - liberacionesActivas);

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
            eventoId: evento.id
          };
        });

        console.log('⚠️ Eventos incompletos encontrados:', eventosIncompletos.length);
        console.log('📋 Detalles de eventos incompletos:', eventosIncompletos);

        // Resumen de todas las clases para debugging
        console.log('📊 RESUMEN DE TODAS LAS CLASES:');
        safeClasesData.forEach(clase => {
          const alumnosAsignados = asignaciones[clase.id] || 0;
          const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
          const alumnosDisponibles = Math.max(0, alumnosAsignados - liberacionesActivas);
          const esParticular = clase.nombre?.toLowerCase().includes('particular') || clase.tipo_clase === 'particular';
          const maxAlumnos = esParticular ? 1 : 4;
          const esIncompleto = alumnosDisponibles < maxAlumnos;

          console.log(`  📚 "${clase.nombre}": ${alumnosDisponibles}/${maxAlumnos} disponibles (${alumnosAsignados} asignados - ${liberacionesActivas} liberaciones) ${esIncompleto ? '❌ INCOMPLETA' : '✅ COMPLETA'}`);
        });

        // Calcular clases de esta semana (eventos de los próximos 7 días)
        const inicioSemana = new Date();
        const finSemana = new Date();
        finSemana.setDate(finSemana.getDate() + 7);

        const clasesEstaSemana = safeEventosData.filter(evento => {
          const fechaEvento = new Date(evento.fecha);
          return fechaEvento >= inicioSemana && fechaEvento <= finSemana;
        }).length;

        // Calcular huecos por faltas justificadas en próximos 7 días
        const inicioAviso = new Date();
        inicioAviso.setHours(0, 0, 0, 0);
        const finAviso = new Date();
        finAviso.setDate(finAviso.getDate() + 7);
        finAviso.setHours(23, 59, 59, 999);

        const justificadasPorEvento = new Map();
        safeAsistenciasData.forEach(a => {
          const key = `${a.clase_id}|${a.fecha}`;
          if (!justificadasPorEvento.has(key)) justificadasPorEvento.set(key, []);
          justificadasPorEvento.get(key).push(a);
        });

        const huecosPorJustificadas = safeEventosData
          .filter(evento => {
            const fechaEvento = new Date(evento.fecha);
            return fechaEvento >= inicioAviso && fechaEvento <= finAviso && evento.estado !== 'cancelada';
          })
          .map(evento => {
            const key = `${evento.clase_id}|${evento.fecha}`;
            const justificadas = justificadasPorEvento.get(key) || [];
            const clase = safeClasesData.find(c => c.id === evento.clase_id);

            // 🆕 Calcular huecos reales disponibles
            const esParticular = clase?.tipo_clase === 'particular';
            const maxAlumnos = esParticular ? 1 : 4;
            const alumnosAsignados = asignaciones[evento.clase_id] || 0;
            const liberacionesActivas = liberacionesPorClase[evento.clase_id] || 0;
            const alumnosDisponibles = Math.max(0, alumnosAsignados - liberacionesActivas);
            const huecosReales = Math.max(0, maxAlumnos - alumnosDisponibles);

            // 🆕 Solo mostrar si hay huecos reales disponibles
            const tieneHuecosReales = huecosReales > 0;

            return {
              eventoId: evento.id,
              claseId: evento.clase_id,
              nombre: clase?.nombre || 'Clase',
              nivel_clase: clase?.nivel_clase,
              dia_semana: clase?.dia_semana,
              tipo_clase: clase?.tipo_clase,
              fecha: evento.fecha,
              cantidadHuecos: tieneHuecosReales ? huecosReales : 0, // 🆕 Usar huecos reales
              alumnosJustificados: justificadas.map(j => ({ id: j.alumno_id, nombre: j.alumnos?.nombre || 'Alumno' })),
              huecosReales, // 🆕 Para debugging
              tieneHuecosReales // 🆕 Flag para filtrar
            };
          })
          .filter(item => item.tieneHuecosReales && item.cantidadHuecos > 0) // 🆕 Solo con huecos reales
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        const totalHuecosJustificados = huecosPorJustificadas.reduce((acc, e) => acc + e.cantidadHuecos, 0);

        // Calcular alumnos con deuda (todos los alumnos con clases Escuela)
        const { count: alumnosConDeuda } = await calcularAlumnosConDeuda(safeAlumnosData, safePagosData, false);

        setStats({
          totalAlumnos: safeAlumnosData.length,
          ingresosMes,
          clasesEstaSemana,
          ultimosPagos,
          clasesIncompletas: eventosIncompletos,
          alumnosConDeuda,
          huecosJustificados: huecosPorJustificadas,
          totalHuecosJustificados
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
          ultimosPagos: [
            { alumno: 'María García', cantidad: 80, mes: '2024-01', fecha: '15/01/2024' },
            { alumno: 'Carlos López', cantidad: 60, mes: '2024-01', fecha: '14/01/2024' },
            { alumno: 'Ana Martín', cantidad: 100, mes: '2024-01', fecha: '13/01/2024' },
            { alumno: 'Pedro Ruiz', cantidad: 80, mes: '2024-01', fecha: '12/01/2024' },
            { alumno: 'Laura Sánchez', cantidad: 60, mes: '2024-01', fecha: '11/01/2024' }
          ],
          clasesIncompletas: [
            { id: 1, nombre: 'Iniciación Martes', nivel_clase: 'Principiante', dia_semana: 'Martes', tipo_clase: 'grupal' },
            { id: 2, nombre: 'Avanzado Jueves', nivel_clase: 'Avanzado', dia_semana: 'Jueves', tipo_clase: 'grupal' }
          ],
          alumnosConDeuda: 3,
          huecosJustificados: [],
          totalHuecosJustificados: 0
        });
      } finally {
        setLoading(false);
      }
    };

    cargarStats();
  }, []);

  if (loading) return <p className="text-center py-8 text-gray-700 dark:text-dark-text">Cargando...</p>;

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text mb-2">
              🏆 Dashboard
            </h1>
            <p className="text-gray-600 dark:text-dark-text2 text-lg">
              Resumen de tu academia de pádel
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-dark-text2">Hoy es</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Alumnos */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-dark-text2 text-sm">Alumnos</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-dark-text">{stats.totalAlumnos}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
            <span className="text-sm text-gray-500 dark:text-dark-text2">Total registrados</span>
          </div>
        </div>

        {/* Ingresos */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-dark-text2 text-sm">Ingresos (mes)</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-dark-text">€{stats.ingresosMes}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
            <span className="text-sm text-gray-500 dark:text-dark-text2">Mes actual</span>
          </div>
        </div>

        {/* Clases */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-dark-text2 text-sm">Clases esta semana</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-dark-text">{stats.clasesEstaSemana}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
            <span className="text-sm text-gray-500 dark:text-dark-text2">Próximos 7 días</span>
          </div>
        </div>

        {/* Clases incompletas */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-dark-text2 text-sm">Clases no completas</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-dark-text">{stats.clasesIncompletas.length}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
            <span className="text-sm text-gray-500 dark:text-dark-text2">Necesitan alumnos</span>
          </div>
        </div>

        {/* Alumnos con deuda */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-dark-text2 text-sm">Pagos pendientes</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-dark-text">{stats.alumnosConDeuda}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
            <span className="text-sm text-gray-500 dark:text-dark-text2">Deben dinero</span>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Notificaciones de pagos pendientes */}
        <NotificacionesPagos />

        {/* Huecos por faltas justificadas (próximos 7 días) */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6 min-h-[60px]">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Huecos por faltas justificadas</h2>
            <span className="ml-auto inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              {stats?.totalHuecosJustificados || 0} huecos • 7 días
            </span>
          </div>
          {(stats?.huecosJustificados?.length || 0) === 0 ? (
            <p className="text-gray-500 dark:text-dark-text2 text-sm">No hay faltas justificadas próximas.</p>
          ) : (
            <div className="space-y-3">
              {stats.huecosJustificados.slice(0, 6).map(item => (
                <div
                  key={`${item.claseId}-${item.fecha}`}
                  className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer group min-h-[44px]"
                  onClick={() => navigate(`/clases?tab=proximas&view=table&highlight=${item.eventoId}`)}
                  title="Ir a la clase para asignar huecos"
                >
                  <div className="min-w-0 mr-3">
                    <p className="font-medium text-gray-800 dark:text-dark-text truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {item.nombre}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-dark-text2 truncate">
                      {item.nivel_clase} • {item.dia_semana} • {new Date(item.fecha).toLocaleDateString('es-ES')}
                    </p>
                    {item.alumnosJustificados?.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-dark-text2 mt-1 truncate">
                        Libres: {item.alumnosJustificados.map(a => a.nombre).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-white text-orange-700 border border-orange-300 dark:bg-transparent dark:text-orange-300 dark:border-orange-700">
                      {item.cantidadHuecos} hueco{item.cantidadHuecos !== 1 ? 's' : ''}
                    </span>
                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      📝 Asignar alumnos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clases incompletas detalladas */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6 min-h-[60px]">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Clases que necesitan alumnos</h2>
          </div>
          {stats.clasesIncompletas.length === 0 ? (
            <p className="text-gray-500 dark:text-dark-text2 text-sm">¡Excelente! Todas las clases tienen alumnos asignados.</p>
          ) : (
            <div className="space-y-3">
              {stats.clasesIncompletas.slice(0, 5).map(clase => (
                <div
                  key={clase.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors cursor-pointer group min-h-[44px] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                  onClick={() => {
                    console.log(`🎯 Navegando a evento específico: ${clase.eventoId}`);
                    navigate(`/clases?tab=proximas&view=table&highlight=${clase.eventoId}`);
                  }}
                  title="Hacer clic para ver este evento específico en la tabla"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {clase.nombre}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-dark-text2">
                      {clase.nivel_clase} • {clase.dia_semana} • {new Date(clase.fecha).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${clase.tipo_clase === 'particular'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      {clase.tipo_clase === 'particular' ? '🎯 Particular' : '👥 Grupal'}
                    </span>
                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      📝 Asignar alumnos
                    </div>
                  </div>
                </div>
              ))}
              {stats.clasesIncompletas.length > 5 && (
                <p className="text-sm text-gray-500 dark:text-dark-text2 text-center">
                  Y {stats.clasesIncompletas.length - 5} clases más...
                </p>
              )}
              <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
                <button
                  onClick={() => navigate('/clases?tab=proximas&view=table')}
                  className="w-full px-4 py-3 bg-yellow-700 hover:bg-yellow-800 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                  aria-label="Ver todas las clases en formato de tabla"
                >
                  📝 Ver todas las clases en tabla
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Últimos pagos */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6 min-h-[60px]">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Últimos pagos</h2>
          </div>
          {stats.ultimosPagos.length === 0 ? (
            <p className="text-gray-500 dark:text-dark-text2 text-sm">No hay pagos registrados.</p>
          ) : (
            <div className="space-y-3">
              {stats.ultimosPagos.map((pago, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-dark-text">{pago.alumno}</p>
                    <p className="text-sm text-gray-600 dark:text-dark-text2">{pago.mes}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-700 dark:text-green-400">€{pago.cantidad}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-text2">{pago.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};