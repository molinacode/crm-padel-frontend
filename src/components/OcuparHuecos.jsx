import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

export default function OcuparHuecos({ onClose, onSuccess, evento }) {
    const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
    const [alumnosSeleccionados, setAlumnosSeleccionados] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        cargarAlumnosDisponibles();
    }, [evento]);

    const cargarAlumnosDisponibles = async () => {
        try {
            setLoading(true);
            console.log('🔄 Cargando alumnos disponibles para ocupar huecos...');

            // Obtener información de la clase para determinar el límite
            const { data: claseData, error: claseError } = await supabase
                .from('clases')
                .select('tipo_clase, nombre')
                .eq('id', evento.clase_id)
                .single();

            if (claseError) throw claseError;

            const esParticular = claseData.tipo_clase === 'particular';
            const maxAlumnos = esParticular ? 1 : 4;

            // Obtener alumnos activos que no están asignados a esta clase
            const { data: alumnosData, error: alumnosError } = await supabase
                .from('alumnos')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (alumnosError) throw alumnosError;

            // Obtener alumnos ya asignados a esta clase
            const { data: asignadosData, error: asignadosError } = await supabase
                .from('alumnos_clases')
                .select('alumno_id')
                .eq('clase_id', evento.clase_id);

            if (asignadosError) throw asignadosError;

            // Obtener liberaciones activas para esta clase y fecha
            const { data: liberacionesData, error: liberacionesError } = await supabase
                .from('liberaciones_plaza')
                .select('alumno_id')
                .eq('clase_id', evento.clase_id)
                .eq('fecha_inicio', evento.fecha)
                .eq('estado', 'activa');

            if (liberacionesError) throw liberacionesError;

            const asignadosIds = new Set(asignadosData.map(a => a.alumno_id));
            const liberadosIds = new Set(liberacionesData.map(l => l.alumno_id));

            // Calcular huecos reales disponibles (igual que en Clases.jsx)
            const justificadosIds = new Set(evento.alumnosJustificados.map(j => j.id));
            const alumnosPresentes = Math.max(0, asignadosIds.size - liberadosIds.size - justificadosIds.size);
            const huecosReales = Math.max(0, maxAlumnos - alumnosPresentes);

            // Los huecos disponibles son los justificados, pero limitados por los huecos reales
            const huecosDisponibles = Math.min(evento.alumnosJustificados.length, huecosReales);

            console.log(`📊 Popup: ${alumnosPresentes}/${maxAlumnos} presentes, ${huecosDisponibles} huecos disponibles`);

            // Si no hay huecos disponibles, no mostrar alumnos para seleccionar
            if (huecosDisponibles <= 0) {
                setAlumnosDisponibles([]);
                console.log('❌ No hay huecos disponibles en esta clase (sobresaturada o sin justificados)');
                return;
            }

            // Filtrar alumnos que no están asignados a esta clase
            const disponibles = alumnosData.filter(alumno => !asignadosIds.has(alumno.id));

            setAlumnosDisponibles(disponibles);
            console.log(`👥 ${disponibles.length} alumnos disponibles para seleccionar`);
        } catch (error) {
            console.error('Error cargando alumnos disponibles:', error);
            alert('Error al cargar alumnos disponibles');
        } finally {
            setLoading(false);
        }
    };

    const toggleAlumno = (alumnoId) => {
        const nuevoSeleccionados = new Set(alumnosSeleccionados);
        if (nuevoSeleccionados.has(alumnoId)) {
            nuevoSeleccionados.delete(alumnoId);
            console.log(`➖ Removido alumno ${alumnoId} - Seleccionados: ${nuevoSeleccionados.size}`);
        } else {
            // Verificar que no excedamos el número de huecos disponibles
            const maxHuecos = Math.min(evento.alumnosJustificados.length, Math.max(0, 4 - (evento.alumnosAsignados?.length || 0)));

            if (nuevoSeleccionados.size >= maxHuecos) {
                alert(`❌ Solo puedes seleccionar hasta ${maxHuecos} alumno${maxHuecos !== 1 ? 's' : ''} para ocupar los huecos disponibles.`);
                return;
            }
            nuevoSeleccionados.add(alumnoId);
            console.log(`➕ Agregado alumno ${alumnoId} - Seleccionados: ${nuevoSeleccionados.size}`);
        }
        setAlumnosSeleccionados(nuevoSeleccionados);
    };

    const ocuparHuecos = async () => {
        if (alumnosSeleccionados.size === 0) {
            alert('❌ Por favor selecciona al menos un alumno para ocupar los huecos.');
            return;
        }

        if (alumnosSeleccionados.size > evento.cantidadHuecos) {
            alert(`❌ No puedes seleccionar más de ${evento.cantidadHuecos} alumno${evento.cantidadHuecos !== 1 ? 's' : ''}.`);
            return;
        }

        try {
            setProcesando(true);
            console.log('🔄 Ocupando huecos con alumnos seleccionados...');

            // Verificar nuevamente la disponibilidad antes de proceder
            const { data: claseData, error: claseError } = await supabase
                .from('clases')
                .select('tipo_clase, nombre')
                .eq('id', evento.clase_id)
                .single();

            if (claseError) throw claseError;

            const esParticular = claseData.tipo_clase === 'particular';
            const maxAlumnos = esParticular ? 1 : 4;

            // Obtener estado actual de la clase
            const [asignadosRes, liberacionesRes] = await Promise.all([
                supabase
                    .from('alumnos_clases')
                    .select('alumno_id')
                    .eq('clase_id', evento.clase_id),
                supabase
                    .from('liberaciones_plaza')
                    .select('alumno_id')
                    .eq('clase_id', evento.clase_id)
                    .eq('fecha_inicio', evento.fecha)
                    .eq('estado', 'activa')
            ]);

            if (asignadosRes.error) throw asignadosRes.error;
            if (liberacionesRes.error) throw liberacionesRes.error;

            const asignadosIds = new Set(asignadosRes.data.map(a => a.alumno_id));
            const liberadosIds = new Set(liberacionesRes.data.map(l => l.alumno_id));
            const alumnosDisponibles = asignadosIds.size - liberadosIds.size;
            const huecosReales = maxAlumnos - alumnosDisponibles;

            console.log(`🔍 Verificación final antes de ocupar huecos:`);
            console.log(`  👥 Alumnos asignados: ${asignadosIds.size}`);
            console.log(`  🔄 Alumnos liberados: ${liberadosIds.size}`);
            console.log(`  ✅ Alumnos disponibles: ${alumnosDisponibles}`);
            console.log(`  🕳️ Huecos reales: ${huecosReales}`);
            console.log(`  👤 Alumnos a ocupar: ${alumnosSeleccionados.size}`);

            // Verificar que hay suficientes huecos disponibles (basado en huecos reales)
            // Alinear con la lógica de Clases.jsx: presentes = asignados - liberados - justificados
            const justificadosIdsValidacion = new Set(evento.alumnosJustificados.map(j => j.id));
            const alumnosPresentesValidacion = Math.max(0, asignadosIds.size - liberadosIds.size - justificadosIdsValidacion.size);
            const huecosRealesValidacion = Math.max(0, maxAlumnos - alumnosPresentesValidacion);
            const huecosDisponiblesValidacion = Math.min(evento.alumnosJustificados.length, huecosRealesValidacion);

            if (huecosDisponiblesValidacion < alumnosSeleccionados.size) {
                alert(`❌ No hay suficientes huecos disponibles. Solo hay ${huecosDisponiblesValidacion} hueco${huecosDisponiblesValidacion !== 1 ? 's' : ''} disponible${huecosDisponiblesValidacion !== 1 ? 's' : ''} en la clase.`);
                return;
            }

            // Determinar el origen basado en el tipo de clase
            const origen = evento.tipo_clase === 'interna' ? 'interna' : 'escuela';

            // Crear asignaciones temporales para los alumnos seleccionados
            const asignaciones = Array.from(alumnosSeleccionados).map(alumnoId => ({
                clase_id: evento.clase_id,
                alumno_id: alumnoId,
                origen: origen
            }));

            const { error: asignacionError } = await supabase
                .from('alumnos_clases')
                .insert(asignaciones);

            if (asignacionError) throw asignacionError;

            // Cancelar liberaciones de plaza para los alumnos justificados (sus huecos fueron ocupados)
            for (const alumno of evento.alumnosJustificados) {
                try {
                    // Buscar liberación activa para este alumno
                    const { data: liberacionExistente, error: selectError } = await supabase
                        .from('liberaciones_plaza')
                        .select('id, estado')
                        .eq('alumno_id', alumno.id)
                        .eq('clase_id', evento.clase_id)
                        .eq('fecha_inicio', evento.fecha)
                        .eq('estado', 'activa')
                        .maybeSingle();

                    if (selectError) {
                        console.error('Error verificando liberación existente:', selectError);
                        continue;
                    }

                    if (liberacionExistente) {
                        // Cancelar la liberación porque su hueco fue ocupado
                        const { error: updateError } = await supabase
                            .from('liberaciones_plaza')
                            .update({ estado: 'cancelada' })
                            .eq('id', liberacionExistente.id);

                        if (updateError) {
                            console.error('Error cancelando liberación:', updateError);
                        } else {
                            console.log(`✅ Liberación cancelada para alumno ${alumno.nombre} (hueco ocupado)`);
                        }
                    } else {
                        // Si no existe liberación, crear una cancelada (para registro)
                        const { error: insertError } = await supabase
                            .from('liberaciones_plaza')
                            .insert([{
                                alumno_id: alumno.id,
                                clase_id: evento.clase_id,
                                fecha_inicio: evento.fecha,
                                fecha_fin: evento.fecha,
                                motivo: 'falta_justificada',
                                estado: 'cancelada'
                            }]);

                        if (insertError) {
                            console.error('Error creando liberación cancelada:', insertError);
                        } else {
                            console.log(`✅ Liberación cancelada creada para alumno ${alumno.nombre}`);
                        }
                    }
                } catch (error) {
                    console.error('Error procesando liberación para alumno:', alumno.nombre, error);
                }
            }

            console.log('✅ Huecos ocupados correctamente');
            alert(`✅ Se han ocupado ${alumnosSeleccionados.size} hueco${alumnosSeleccionados.size !== 1 ? 's' : ''} correctamente.`);

            onSuccess();
        } catch (error) {
            console.error('Error ocupando huecos:', error);
            alert('Error al ocupar los huecos');
        } finally {
            setProcesando(false);
        }
    };

    // Filtrar alumnos por búsqueda (sin recargar desde la base de datos)
    const alumnosFiltrados = useMemo(() => {
        if (!busqueda.trim()) {
            return alumnosDisponibles;
        }
        return alumnosDisponibles.filter(alumno =>
            alumno.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [alumnosDisponibles, busqueda]);

    if (loading) return <LoadingSpinner size="medium" text="Cargando alumnos disponibles..." />;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 p-6 border-b border-gray-200 dark:border-dark-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Ocupar Huecos Disponibles</h2>
                                <p className="text-gray-600 dark:text-dark-text2">
                                    {evento.nombre} - {evento.cantidadHuecos} hueco{evento.cantidadHuecos !== 1 ? 's' : ''} disponible{evento.cantidadHuecos !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Información del evento */}
                <div className="p-6 border-b border-gray-200 dark:border-dark-border">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800/30">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <p className="font-medium text-orange-800 dark:text-orange-200">Clase:</p>
                                <p className="text-orange-900 dark:text-orange-100">{evento.nombre}</p>
                            </div>
                            <div>
                                <p className="font-medium text-orange-800 dark:text-orange-200">Fecha:</p>
                                <p className="text-orange-900 dark:text-orange-100">
                                    {evento.fecha ? new Date(evento.fecha).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long'
                                    }) : 'Sin fecha'}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium text-orange-800 dark:text-orange-200">Huecos disponibles:</p>
                                <p className="text-orange-900 dark:text-orange-100">{evento.cantidadHuecos} (máximo 4 por clase)</p>
                            </div>
                            <div>
                                <p className="font-medium text-orange-800 dark:text-orange-200">Alumnos justificados:</p>
                                <p className="text-orange-900 dark:text-orange-100">
                                    {evento.alumnosJustificados.map(j => j.nombre).join(', ')}
                                </p>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex justify-end gap-3 pt-3 border-t border-orange-200 dark:border-orange-800/30">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={ocuparHuecos}
                                disabled={procesando || alumnosSeleccionados.size === 0}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {procesando ? 'Procesando...' : `Ocupar ${alumnosSeleccionados.size} hueco${alumnosSeleccionados.size !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
                    {/* Búsqueda */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Buscar alumnos..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                        />
                    </div>

                    {/* Lista de alumnos disponibles */}
                    {alumnosFiltrados.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 dark:bg-gray-800/30 p-6 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">No hay alumnos disponibles</h3>
                            <p className="text-gray-500 dark:text-dark-text2">
                                {busqueda
                                    ? 'No se encontraron alumnos que coincidan con la búsqueda'
                                    : 'No hay huecos reales disponibles en esta clase o todos los alumnos activos ya están asignados'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900 dark:text-dark-text">
                                    Alumnos disponibles ({alumnosFiltrados.length})
                                </h3>
                                <span className="text-sm text-gray-500 dark:text-dark-text2">
                                    Seleccionados: {alumnosSeleccionados.size}/{evento.cantidadHuecos}
                                </span>
                            </div>

                            {alumnosFiltrados.map(alumno => (
                                <div
                                    key={alumno.id}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${alumnosSeleccionados.has(alumno.id)
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                                        : 'border-gray-200 dark:border-dark-border hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-sm'
                                        }`}
                                    onClick={() => toggleAlumno(alumno.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={alumnosSeleccionados.has(alumno.id)}
                                                onChange={() => toggleAlumno(alumno.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-4 h-4 text-orange-600"
                                            />
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-dark-text">{alumno.nombre}</h4>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-dark-text2">
                                                    <span>📧 {alumno.email}</span>
                                                    <span>📱 {alumno.telefono}</span>
                                                    <span>🎯 {alumno.nivel}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {alumnosSeleccionados.has(alumno.id) && (
                                            <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-xs font-medium">
                                                Seleccionado
                                            </div>
                                        )}
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
