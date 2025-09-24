import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ListaAlumnos from '../components/ListaAlumnos';
import FormularioAlumno from '../components/FormularioAlumno';

export default function AlumnosEscuela() {
    const navigate = useNavigate();
    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    useEffect(() => {
        cargarAlumnosEscuela();
    }, []);

    const cargarAlumnosEscuela = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 Cargando alumnos de escuela...');

            // Obtener alumnos que están asignados a clases de escuela
            const { data: alumnosAsignados, error: alumnosError } = await supabase
                .from('alumnos_clases')
                .select(`
          alumno_id,
          clase_id,
          alumnos (
            id,
            nombre,
            email,
            telefono,
            nivel,
            activo,
            foto_url,
            created_at
          ),
          clases (
            id,
            nombre,
            tipo_clase
          )
        `);

            if (alumnosError) throw alumnosError;

            console.log('📋 Alumnos asignados encontrados:', alumnosAsignados?.length || 0);

            // Filtrar solo alumnos activos asignados a clases de escuela
            const alumnosEscuela = alumnosAsignados?.filter(asignacion => {
                const alumno = asignacion.alumnos;
                const clase = asignacion.clases;

                // Solo alumnos activos
                if (!alumno || alumno.activo !== true) return false;

                // Solo clases que contienen "Escuela" en el nombre
                if (!clase || !clase.nombre?.includes('Escuela')) return false;

                return true;
            }) || [];

            console.log('📋 Alumnos asignados a clases de escuela encontrados:', alumnosEscuela.length);

            // Agrupar alumnos únicos (un alumno puede estar en múltiples clases de escuela)
            const alumnosUnicos = {};
            alumnosEscuela.forEach(asignacion => {
                const alumno = asignacion.alumnos;
                if (!alumnosUnicos[alumno.id]) {
                    alumnosUnicos[alumno.id] = {
                        ...alumno,
                        clasesEscuela: []
                    };
                }
                alumnosUnicos[alumno.id].clasesEscuela.push(asignacion.clases);
            });

            const listaAlumnos = Object.values(alumnosUnicos);
            console.log('👥 Alumnos únicos de escuela:', listaAlumnos.length);

            setAlumnos(listaAlumnos);
        } catch (err) {
            console.error('Error cargando alumnos de escuela:', err);
            setError('Error al cargar los alumnos de escuela');
        } finally {
            setLoading(false);
        }
    };

    const handleVerFicha = (alumnoId) => {
        navigate(`/ficha-alumno/${alumnoId}`);
    };

    const handleEditar = (alumnoId) => {
        navigate(`/editar-alumno/${alumnoId}`);
    };

    const handleEliminar = async (alumnoId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este alumno?')) {
            try {
                // Eliminar asignaciones primero
                const { error: asignacionesError } = await supabase
                    .from('alumnos_clases')
                    .delete()
                    .eq('alumno_id', alumnoId);

                if (asignacionesError) throw asignacionesError;

                // Eliminar pagos
                const { error: pagosError } = await supabase
                    .from('pagos')
                    .delete()
                    .eq('alumno_id', alumnoId);

                if (pagosError) throw pagosError;

                // Eliminar asistencias
                const { error: asistenciasError } = await supabase
                    .from('asistencias')
                    .delete()
                    .eq('alumno_id', alumnoId);

                if (asistenciasError) throw asistenciasError;

                // Finalmente, eliminar el alumno
                const { error: alumnoError } = await supabase
                    .from('alumnos')
                    .delete()
                    .eq('id', alumnoId);

                if (alumnoError) throw alumnoError;

                alert('Alumno eliminado correctamente');
                cargarAlumnosEscuela(); // Recargar la lista
            } catch (err) {
                console.error('Error eliminando alumno:', err);
                alert('Error al eliminar el alumno: ' + err.message);
            }
        }
    };

    const handleNuevoAlumno = () => {
        setMostrarFormulario(true);
    };

    const handleFormularioCerrado = () => {
        setMostrarFormulario(false);
        cargarAlumnosEscuela(); // Recargar la lista
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-dark-text2">Cargando alumnos de escuela...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">Error</h2>
                    <p className="text-gray-600 dark:text-dark-text2 mb-4">{error}</p>
                    <button
                        onClick={cargarAlumnosEscuela}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text mb-2">
                            🏫 Lista de Alumnos de Escuela
                        </h1>
                        <p className="text-gray-600 dark:text-dark-text2 text-lg">
                            Alumnos asignados a clases de escuela que requieren pago directo
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-dark-text2">Total alumnos</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text">
                                {alumnos.length}
                            </p>
                        </div>
                        {!mostrarFormulario && (
                            <button
                                onClick={handleNuevoAlumno}
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Nuevo Alumno
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            Información sobre alumnos de escuela
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Estos alumnos están asignados a clases de escuela y requieren pago directo.
                            Puedes gestionar sus pagos desde la sección de Pagos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mostrar formulario o listado */}
            {mostrarFormulario ? (
                <FormularioAlumno
                    onCancel={handleFormularioCerrado}
                />
            ) : (
                <ListaAlumnos
                    alumnos={alumnos}
                    onVerFicha={handleVerFicha}
                    onEditar={handleEditar}
                    onEliminar={handleEliminar}
                    mostrarClasesEscuela={true}
                />
            )}
        </div>
    );
}
