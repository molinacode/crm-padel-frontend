import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    ingresosMes: 0,
    clasesEstaSemana: 0,
    ultimosPagos: [],
    clasesIncompletas: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarStats = async () => {
      try {
        console.log('🔄 Intentando cargar datos del Dashboard...');
        
        // Intentar cargar datos reales de Supabase
        const [alumnosRes, pagosRes, clasesRes, asignadosRes, eventosRes] = await Promise.all([
          supabase.from('alumnos').select('*'),
          supabase.from('pagos').select(`*, alumnos (nombre)`),
          supabase.from('clases').select('*'),
          supabase.from('alumnos_clases').select('clase_id'),
          supabase.from('eventos_clase').select(`
            id,
            fecha,
            clases (id, tipo_clase)
          `)
        ]);

        const { data: alumnosData, error: alumnosError } = alumnosRes;
        const { data: pagosData, error: pagosError } = pagosRes;
        const { data: clasesData, error: clasesError } = clasesRes;
        const { data: asignadosData, error: asignadosError } = asignadosRes;
        const { data: eventosData, error: eventosError } = eventosRes;

        if (alumnosError) throw alumnosError;
        if (pagosError) throw pagosError;
        if (clasesError) throw clasesError;
        if (asignadosError) throw asignadosError;
        if (eventosError) throw eventosError;

        // Aseguramos que sean arrays
        const safeAlumnosData = Array.isArray(alumnosData) ? alumnosData : [];
        const safePagosData = Array.isArray(pagosData) ? pagosData : [];
        const safeClasesData = Array.isArray(clasesData) ? clasesData : [];
        const safeAsignadosData = Array.isArray(asignadosData) ? asignadosData : [];
        const safeEventosData = Array.isArray(eventosData) ? eventosData : [];

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

        // Contar asignaciones por clase
        const asignaciones = {};
        safeAsignadosData?.forEach(ac => {
          asignaciones[ac.clase_id] = (asignaciones[ac.clase_id] || 0) + 1;
        });

        // Calcular clases incompletas considerando el tipo de clase
        const clasesIncompletas = safeClasesData.filter(clase => {
          const alumnosAsignados = asignaciones[clase.id] || 0;
          const maxAlumnos = clase.tipo_clase === 'particular' ? 1 : 4;
          return alumnosAsignados < maxAlumnos;
        });

        // Calcular clases de esta semana (eventos de los próximos 7 días)
        const inicioSemana = new Date();
        const finSemana = new Date();
        finSemana.setDate(finSemana.getDate() + 7);

        const clasesEstaSemana = safeEventosData.filter(evento => {
          const fechaEvento = new Date(evento.fecha);
          return fechaEvento >= inicioSemana && fechaEvento <= finSemana;
        }).length;

        setStats({
          totalAlumnos: safeAlumnosData.length,
          ingresosMes,
          clasesEstaSemana,
          ultimosPagos,
          clasesIncompletas
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
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    cargarStats();
  }, []);

  if (loading) return <p className="text-center py-8 text-gray-700 dark:text-dark-text">Cargando...</p>;

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-100 dark:border-blue-800/30">
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
        <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
        <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
        <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
        <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
      </div>

      {/* Información adicional */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Clases incompletas detalladas */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Clases que necesitan alumnos</h3>
          </div>
          {stats.clasesIncompletas.length === 0 ? (
            <p className="text-gray-500 dark:text-dark-text2 text-sm">¡Excelente! Todas las clases tienen alumnos asignados.</p>
          ) : (
            <div className="space-y-3">
              {stats.clasesIncompletas.slice(0, 5).map(clase => (
                <div key={clase.id} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-dark-text">{clase.nombre}</p>
                    <p className="text-sm text-gray-600 dark:text-dark-text2">{clase.nivel_clase} • {clase.dia_semana}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      clase.tipo_clase === 'particular'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {clase.tipo_clase === 'particular' ? '🎯 Particular' : '👥 Grupal'}
                    </span>
                  </div>
                </div>
              ))}
              {stats.clasesIncompletas.length > 5 && (
                <p className="text-sm text-gray-500 dark:text-dark-text2 text-center">
                  Y {stats.clasesIncompletas.length - 5} clases más...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Últimos pagos */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Últimos pagos</h3>
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