import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VistaProfesor() {
    const [eventos, setEventos] = useState([]);
    const [profesorSeleccionado, setProfesorSeleccionado] = useState('');
    const [profesores, setProfesores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroSemana, setFiltroSemana] = useState('actual'); // 'actual', 'siguiente', 'anterior'

    // Función para obtener el inicio y fin de la semana
    const obtenerRangoSemana = (tipo) => {
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, etc.
        const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana; // Ajustar para que lunes sea el inicio

        let fechaInicio, fechaFin;

        switch (tipo) {
            case 'anterior':
                fechaInicio = new Date(hoy);
                fechaInicio.setDate(hoy.getDate() + diasHastaLunes - 7);
                fechaFin = new Date(fechaInicio);
                fechaFin.setDate(fechaInicio.getDate() + 6);
                break;
            case 'siguiente':
                fechaInicio = new Date(hoy);
                fechaInicio.setDate(hoy.getDate() + diasHastaLunes + 7);
                fechaFin = new Date(fechaInicio);
                fechaFin.setDate(fechaInicio.getDate() + 6);
                break;
            default: // 'actual'
                fechaInicio = new Date(hoy);
                fechaInicio.setDate(hoy.getDate() + diasHastaLunes);
                fechaFin = new Date(fechaInicio);
                fechaFin.setDate(fechaInicio.getDate() + 6);
                break;
        }

        return { fechaInicio, fechaFin };
    };

    // Cargar datos
    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            try {
                console.log('🔄 Cargando datos para Vista Profesor...');

                // Cargar eventos de clase
                const { data: eventosData, error: eventosError } = await supabase
                    .from('eventos_clase')
                    .select(`
                        *,
                        clases (
                            id,
                            nombre,
                            nivel_clase,
                            profesor,
                            tipo_clase
                        )
                    `)
                    .order('fecha', { ascending: true });

                if (eventosError) {
                    console.error('❌ Error cargando eventos:', eventosError);
                    throw eventosError;
                }

                console.log('✅ Eventos cargados:', eventosData?.length || 0);
                console.log('📋 Primer evento (ejemplo):', eventosData?.[0]);

                // Cargar alumnos asignados
                const { data: alumnosData, error: alumnosError } = await supabase
                    .from('alumnos_clases')
                    .select(`
                        clase_id,
                        alumno_id,
                        alumnos (id, nombre, nivel)
                    `);

                if (alumnosError) {
                    console.error('❌ Error cargando alumnos:', alumnosError);
                    throw alumnosError;
                }

                console.log('✅ Alumnos asignados cargados:', alumnosData?.length || 0);
                console.log('👥 Primer alumno asignado (ejemplo):', alumnosData?.[0]);

                // Crear mapa de alumnos por clase
                const alumnosPorClase = {};
                if (alumnosData) {
                    alumnosData.forEach(ac => {
                        if (!alumnosPorClase[ac.clase_id]) {
                            alumnosPorClase[ac.clase_id] = [];
                        }
                        alumnosPorClase[ac.clase_id].push(ac.alumnos);
                    });
                }

                // Procesar eventos
                const eventosProcesados = eventosData.map(ev => {
                    const start = new Date(ev.fecha + 'T' + ev.hora_inicio);
                    const end = new Date(ev.fecha + 'T' + ev.hora_fin);
                    const alumnosAsignados = alumnosPorClase[ev.clase_id] || [];

                    return {
                        id: ev.id,
                        title: `${ev.clases.nombre} (${ev.clases.nivel_clase})`,
                        subtitle: ev.clases.profesor,
                        start,
                        end,
                        allDay: false,
                        resource: ev,
                        alumnosAsignados,
                        profesor: ev.clases.profesor
                    };
                });

                console.log('✅ Eventos procesados:', eventosProcesados.length);
                setEventos(eventosProcesados);

                // Extraer profesores únicos
                const profesoresUnicos = [...new Set(eventosProcesados
                    .map(e => e.profesor)
                    .filter(p => p && p.trim() !== '')
                )].sort();

                console.log('✅ Profesores únicos encontrados:', profesoresUnicos);
                setProfesores(profesoresUnicos);

                // Seleccionar el primer profesor por defecto
                if (profesoresUnicos.length > 0 && !profesorSeleccionado) {
                    setProfesorSeleccionado(profesoresUnicos[0]);
                }

            } catch (error) {
                console.error('💥 Error cargando datos para Vista Profesor:', error);
                alert(`Error cargando datos: ${error.message || 'Error desconocido'}`);
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, []);

    // Filtrar eventos por profesor y semana
    const eventosFiltrados = useMemo(() => {
        const { fechaInicio, fechaFin } = obtenerRangoSemana(filtroSemana);

        return eventos.filter(evento => {
            const fechaEvento = new Date(evento.start);
            fechaEvento.setHours(0, 0, 0, 0);

            const esDelProfesor = !profesorSeleccionado || evento.profesor === profesorSeleccionado;
            const esDeLaSemana = fechaEvento >= fechaInicio && fechaEvento <= fechaFin;
            const noEstaCancelada = evento.resource.estado !== 'cancelada';

            return esDelProfesor && esDeLaSemana && noEstaCancelada;
        }).sort((a, b) => new Date(a.start) - new Date(b.start));
    }, [eventos, profesorSeleccionado, filtroSemana]);

    // Agrupar eventos por día
    const eventosPorDia = useMemo(() => {
        const grupos = {};
        eventosFiltrados.forEach(evento => {
            const fecha = evento.start.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit'
            });

            if (!grupos[fecha]) {
                grupos[fecha] = [];
            }
            grupos[fecha].push(evento);
        });

        return grupos;
    }, [eventosFiltrados]);

    // Obtener información de la semana
    const { fechaInicio, fechaFin } = obtenerRangoSemana(filtroSemana);
    const infoSemana = {
        inicio: fechaInicio.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        fin: fechaFin.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        mes: fechaInicio.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    };

    if (loading) return <LoadingSpinner size="large" text="Cargando vista del profesor..." />;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-4 sm:p-6 border border-purple-100 dark:border-purple-800/30">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-2xl">
                            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
                                Vista del Profesor
                            </h1>
                            <p className="text-gray-600 dark:text-dark-text2 mb-4 text-sm sm:text-base">
                                Consulta las clases semanales y alumnos asignados
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">🔍</div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-dark-text">Filtros</h3>
                            <p className="text-sm text-gray-600 dark:text-dark-text2">
                                Selecciona profesor y semana
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Filtro por profesor */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-dark-text2">
                                👨‍🏫 Profesor:
                            </label>
                            <select
                                value={profesorSeleccionado}
                                onChange={e => setProfesorSeleccionado(e.target.value)}
                                className="border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 bg-white dark:bg-dark-surface2 text-sm text-gray-900 dark:text-dark-text min-w-[200px]"
                            >
                                <option value="">Todos los profesores</option>
                                {profesores.map(profesor => (
                                    <option key={profesor} value={profesor}>{profesor}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por semana */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-dark-text2">
                                📅 Semana:
                            </label>
                            <select
                                value={filtroSemana}
                                onChange={e => setFiltroSemana(e.target.value)}
                                className="border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 bg-white dark:bg-dark-surface2 text-sm text-gray-900 dark:text-dark-text"
                            >
                                <option value="anterior">Semana anterior</option>
                                <option value="actual">Esta semana</option>
                                <option value="siguiente">Próxima semana</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Información de la semana */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800/30">
                <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">📅</div>
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                            {filtroSemana === 'anterior' ? 'Semana Anterior' :
                                filtroSemana === 'siguiente' ? 'Próxima Semana' : 'Esta Semana'}
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            {infoSemana.inicio} - {infoSemana.fin} de {infoSemana.mes}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📚</span>
                            <span className="font-medium text-gray-700 dark:text-dark-text2">Total de clases:</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {eventosFiltrados.length}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">👥</span>
                            <span className="font-medium text-gray-700 dark:text-dark-text2">Total de alumnos:</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {eventosFiltrados.reduce((total, evento) => total + evento.alumnosAsignados.length, 0)}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⏰</span>
                            <span className="font-medium text-gray-700 dark:text-dark-text2">Horas totales:</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {eventosFiltrados.reduce((total, evento) => {
                                const inicio = new Date(evento.start);
                                const fin = new Date(evento.end);
                                const horas = (fin - inicio) / (1000 * 60 * 60);
                                return total + horas;
                            }, 0).toFixed(1)}h
                        </p>
                    </div>
                </div>
            </div>

            {/* Clases por día */}
            {Object.keys(eventosPorDia).length === 0 ? (
                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-12 text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">
                        No hay clases programadas
                    </h3>
                    <p className="text-gray-500 dark:text-dark-text2">
                        No se encontraron clases para la semana seleccionada
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(eventosPorDia).map(([dia, eventosDelDia]) => (
                        <div key={dia} className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
                            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text capitalize">
                                    {dia}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-dark-text2">
                                    {eventosDelDia.length} clase{eventosDelDia.length !== 1 ? 's' : ''} programada{eventosDelDia.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            <div className="p-4 sm:p-6">
                                <div className="space-y-4">
                                    {eventosDelDia.map(evento => (
                                        <div
                                            key={evento.id}
                                            className="p-4 rounded-xl border border-gray-200 dark:border-dark-border hover:shadow-md transition-shadow duration-200"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                                {/* Información de la clase */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                                                            {evento.resource.clases.nombre}
                                                        </h4>
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                            🎯 {evento.resource.clases.nivel_clase}
                                                        </span>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${evento.resource.clases.tipo_clase === 'particular'
                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            }`}>
                                                            {evento.resource.clases.tipo_clase === 'particular' ? '🎯 Particular' : '👥 Grupal'}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">⏰</span>
                                                            <span className="text-gray-600 dark:text-dark-text2">
                                                                {evento.start.toLocaleTimeString('es-ES', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })} - {evento.end.toLocaleTimeString('es-ES', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">👨‍🏫</span>
                                                            <span className="text-gray-600 dark:text-dark-text2">
                                                                {evento.profesor || 'Sin asignar'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Alumnos asignados */}
                                                <div className="lg:w-80">
                                                    <h5 className="font-medium text-gray-700 dark:text-dark-text2 mb-3 flex items-center gap-2">
                                                        <span className="text-lg">👥</span>
                                                        Alumnos Asignados ({evento.alumnosAsignados.length})
                                                    </h5>

                                                    {evento.alumnosAsignados.length === 0 ? (
                                                        <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                            <div className="text-2xl mb-2">👥</div>
                                                            <p className="text-sm text-gray-500 dark:text-dark-text2">Sin alumnos asignados</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {evento.alumnosAsignados.map(alumno => (
                                                                <div
                                                                    key={alumno.id}
                                                                    className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium text-blue-800 dark:text-blue-200">
                                                                            {alumno.nombre.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                                                                                {alumno.nombre}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                                        🎯 {alumno.nivel}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
