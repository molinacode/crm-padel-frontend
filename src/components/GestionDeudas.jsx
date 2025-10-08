import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

export default function GestionDeudas({ onClose, onSuccess }) {
    const [alumnosConDeuda, setAlumnosConDeuda] = useState([]);
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        cargarAlumnosConDeuda();
    }, []);

    const cargarAlumnosConDeuda = async () => {
        try {
            setLoading(true);
            console.log('🔄 Cargando alumnos con deuda...');

            const hoy = new Date();
            const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

            // Obtener eventos del mes en curso
            const { data: eventosMes, error: eventosError } = await supabase
                .from('eventos_clase')
                .select(`
          id,
          fecha,
          clase_id,
          clases!inner (
            id,
            nombre,
            tipo_clase
          )
        `)
                .gte('fecha', inicioMes.toISOString().split('T')[0])
                .lte('fecha', finMes.toISOString().split('T')[0])
                .neq('estado', 'eliminado')
                .neq('estado', 'cancelada');

            if (eventosError) throw eventosError;

            // Obtener alumnos asignados a clases Escuela
            const { data: alumnosAsignados, error: alumnosError } = await supabase
                .from('alumnos_clases')
                .select(`
          alumno_id,
          clase_id,
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
            nombre,
            tipo_clase
          )
        `)
                .eq('alumnos.activo', true)
                .eq('origen', 'escuela')
                .in('clase_id', eventosMes?.map(e => e.clase_id) || []);

            if (alumnosError) throw alumnosError;

            // Obtener todos los pagos
            const { data: pagos, error: pagosError } = await supabase
                .from('pagos')
                .select('*')
                .order('fecha_pago', { ascending: false });

            if (pagosError) throw pagosError;

            // Procesar alumnos y detectar deudas
            const alumnosConDeuda = [];
            const alumnosConClasesMes = {};

            alumnosAsignados?.forEach(asignacion => {
                const alumno = asignacion.alumnos;
                const clase = asignacion.clases;

                if (clase.nombre?.includes('Escuela')) {
                    if (!alumnosConClasesMes[alumno.id]) {
                        alumnosConClasesMes[alumno.id] = {
                            ...alumno,
                            clasesMes: [],
                            asignaciones: []
                        };
                    }
                    alumnosConClasesMes[alumno.id].clasesMes.push(clase);
                    alumnosConClasesMes[alumno.id].asignaciones.push(asignacion);
                }
            });

            // Verificar pagos para cada alumno
            Object.values(alumnosConClasesMes).forEach(alumno => {
                const pagosAlumno = pagos.filter(p => p.alumno_id === alumno.id);
                const hace30Dias = new Date();
                hace30Dias.setDate(hace30Dias.getDate() - 30);

                const tienePagoMesActual = pagosAlumno.some(p =>
                    p.tipo_pago === 'mensual' && p.mes_cubierto === mesActual
                );

                const tienePagoClasesReciente = pagosAlumno.some(p =>
                    p.tipo_pago === 'clases' &&
                    p.fecha_inicio &&
                    new Date(p.fecha_inicio) >= hace30Dias
                );

                if (!tienePagoMesActual && !tienePagoClasesReciente && alumno.clasesMes.length > 0) {
                    const ultimoPago = pagosAlumno[0];
                    const diasSinPagar = ultimoPago
                        ? Math.floor((hoy - new Date(ultimoPago.fecha_pago)) / (1000 * 60 * 60 * 24))
                        : 999;

                    alumnosConDeuda.push({
                        ...alumno,
                        diasSinPagar,
                        ultimoPago: ultimoPago?.fecha_pago,
                        clasesPagables: alumno.clasesMes.length
                    });
                }
            });

            setAlumnosConDeuda(alumnosConDeuda);
            console.log('📈 Alumnos con deuda encontrados:', alumnosConDeuda.length);
        } catch (error) {
            console.error('Error cargando alumnos con deuda:', error);
            alert('Error al cargar alumnos con deuda');
        } finally {
            setLoading(false);
        }
    };

    const desasignarAlumnoPorDeuda = async (alumno) => {
        try {
            setProcesando(true);
            console.log('🔄 Desasignando alumno por deuda:', alumno.nombre);

            // Crear liberaciones de plaza por deuda
            const liberaciones = alumno.asignaciones.map(asignacion => ({
                alumno_id: alumno.id,
                clase_id: asignacion.clase_id,
                fecha_inicio: new Date().toISOString().split('T')[0],
                fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
                motivo: 'deuda',
                estado: 'activa'
            }));

            const { error: liberacionError } = await supabase
                .from('liberaciones_plaza')
                .insert(liberaciones);

            if (liberacionError) {
                console.error('Error creando liberaciones:', liberacionError);
                alert('Error al crear liberaciones de plaza');
                return;
            }

            // Desasignar alumno de todas sus clases Escuela
            const { error: desasignacionError } = await supabase
                .from('alumnos_clases')
                .delete()
                .eq('alumno_id', alumno.id)
                .eq('origen', 'escuela');

            if (desasignacionError) {
                console.error('Error desasignando alumno:', desasignacionError);
                alert('Error al desasignar alumno');
                return;
            }

            // Enviar notificación (opcional)
            console.log('✅ Alumno desasignado por deuda:', alumno.nombre);
            alert(`✅ ${alumno.nombre} ha sido desasignado de sus clases por deuda. Las plazas han sido liberadas.`);

            // Recargar lista
            await cargarAlumnosConDeuda();
        } catch (error) {
            console.error('Error desasignando alumno:', error);
            alert('Error al desasignar alumno');
        } finally {
            setProcesando(false);
        }
    };

    const reasignarAlumno = async (alumno) => {
        try {
            setProcesando(true);
            console.log('🔄 Reasignando alumno:', alumno.nombre);

            // Cancelar liberaciones de plaza por deuda
            const { error: cancelarError } = await supabase
                .from('liberaciones_plaza')
                .update({ estado: 'cancelada' })
                .eq('alumno_id', alumno.id)
                .eq('motivo', 'deuda')
                .eq('estado', 'activa');

            if (cancelarError) {
                console.error('Error cancelando liberaciones:', cancelarError);
            }

            // Reasignar alumno a sus clases originales
            const reasignaciones = alumno.asignaciones.map(asignacion => ({
                alumno_id: alumno.id,
                clase_id: asignacion.clase_id,
                origen: 'escuela'
            }));

            const { error: reasignacionError } = await supabase
                .from('alumnos_clases')
                .insert(reasignaciones);

            if (reasignacionError) {
                console.error('Error reasignando alumno:', reasignacionError);
                alert('Error al reasignar alumno');
                return;
            }

            console.log('✅ Alumno reasignado:', alumno.nombre);
            alert(`✅ ${alumno.nombre} ha sido reasignado a sus clases.`);

            // Recargar lista
            await cargarAlumnosConDeuda();
        } catch (error) {
            console.error('Error reasignando alumno:', error);
            alert('Error al reasignar alumno');
        } finally {
            setProcesando(false);
        }
    };

    if (loading) return <LoadingSpinner size="medium" text="Cargando alumnos con deuda..." />;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 p-6 border-b border-gray-200 dark:border-dark-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Gestión de Deudas</h2>
                                <p className="text-gray-600 dark:text-dark-text2">Alumnos con deudas pendientes ({alumnosConDeuda.length})</p>
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

                {/* Contenido */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {alumnosConDeuda.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">¡Excelente!</h3>
                            <p className="text-gray-500 dark:text-dark-text2">No hay alumnos con deudas pendientes</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {alumnosConDeuda.map(alumno => (
                                <div key={alumno.id} className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-200 dark:border-dark-border">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-dark-text">{alumno.nombre}</h3>
                                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                    {alumno.diasSinPagar} días sin pagar
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-dark-text2 space-y-1">
                                                <p>📧 {alumno.email}</p>
                                                <p>📱 {alumno.telefono}</p>
                                                <p>📚 {alumno.clasesPagables} clase{alumno.clasesPagables !== 1 ? 's' : ''} Escuela</p>
                                                {alumno.ultimoPago && (
                                                    <p>💰 Último pago: {new Date(alumno.ultimoPago).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => desasignarAlumnoPorDeuda(alumno)}
                                                disabled={procesando}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                            >
                                                {procesando ? 'Procesando...' : 'Desasignar'}
                                            </button>
                                            <button
                                                onClick={() => reasignarAlumno(alumno)}
                                                disabled={procesando}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                            >
                                                {procesando ? 'Procesando...' : 'Reasignar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 border-t border-gray-200 dark:border-dark-border">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={cargarAlumnosConDeuda}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Cargando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


