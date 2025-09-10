import { useState, useEffect } from 'react';
import { obtenerSugerenciasHorarios } from '../utils/alumnoUtils';

export default function SugerenciasHorarios({ nivel, onSeleccionarHorario }) {
    const [sugerencias, setSugerencias] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (nivel) {
            cargarSugerencias();
        }
    }, [nivel]);

    const cargarSugerencias = async () => {
        setLoading(true);
        try {
            const sugerenciasData = await obtenerSugerenciasHorarios(nivel);
            setSugerencias(sugerenciasData);
        } catch (error) {
            console.error('Error cargando sugerencias:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeleccionarHorario = (sugerencia) => {
        onSeleccionarHorario({
            dia_semana: sugerencia.dia,
            hora_inicio: sugerencia.hora_inicio,
            hora_fin: sugerencia.hora_fin
        });
    };

    if (!nivel) return null;

    return (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3">
                💡 Sugerencias de Horarios
            </h4>

            {loading ? (
                <p className="text-sm text-green-700 dark:text-green-300">Cargando sugerencias...</p>
            ) : sugerencias.length === 0 ? (
                <p className="text-sm text-green-700 dark:text-green-300">
                    No hay alumnos disponibles para este nivel
                </p>
            ) : (
                <div className="space-y-2">
                    {sugerencias.slice(0, 5).map((sugerencia, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white dark:bg-green-800/30 rounded border border-green-200 dark:border-green-700/50"
                        >
                            <div className="text-sm">
                                <span className="font-medium text-green-800 dark:text-green-200">
                                    {sugerencia.dia} {sugerencia.hora_inicio} - {sugerencia.hora_fin}
                                </span>
                                <span className="text-green-600 dark:text-green-400 ml-2">
                                    ({sugerencia.alumnos_compatibles} alumnos)
                                </span>
                            </div>
                            <button
                                onClick={() => handleSeleccionarHorario(sugerencia)}
                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                            >
                                Usar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
