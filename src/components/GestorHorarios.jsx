import { useState } from 'react';

export default function GestorHorarios({ horarios, onChange }) {
    const [nuevoHorario, setNuevoHorario] = useState({
        hora_inicio: '',
        hora_fin: ''
    });

    const agregarHorario = () => {
        if (nuevoHorario.hora_inicio && nuevoHorario.hora_fin) {
            // Validar que la hora de inicio sea menor que la de fin
            if (nuevoHorario.hora_inicio >= nuevoHorario.hora_fin) {
                alert('❌ La hora de inicio debe ser menor que la hora de fin');
                return;
            }

            // Validar que no se solape con horarios existentes
            const solapamiento = horarios.some(horario => {
                return (
                    (nuevoHorario.hora_inicio >= horario.hora_inicio && nuevoHorario.hora_inicio < horario.hora_fin) ||
                    (nuevoHorario.hora_fin > horario.hora_inicio && nuevoHorario.hora_fin <= horario.hora_fin) ||
                    (nuevoHorario.hora_inicio <= horario.hora_inicio && nuevoHorario.hora_fin >= horario.hora_fin)
                );
            });

            if (solapamiento) {
                alert('❌ Este horario se solapa con uno existente');
                return;
            }

            const horariosActualizados = [...horarios, nuevoHorario];
            onChange(horariosActualizados);
            setNuevoHorario({ hora_inicio: '', hora_fin: '' });
        }
    };

    const eliminarHorario = (index) => {
        const horariosActualizados = horarios.filter((_, i) => i !== index);
        onChange(horariosActualizados);
    };

    const formatearHorario = (horario) => {
        return `${horario.hora_inicio} - ${horario.hora_fin}`;
    };

    return (
        <div className="space-y-4">
            <h4 className="text-base font-medium text-gray-700 dark:text-dark-text2">Horarios de Disponibilidad</h4>

            {/* Lista de horarios existentes */}
            {horarios.length > 0 && (
                <div className="space-y-2">
                    {horarios.map((horario, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30"
                        >
                            <span className="text-base font-medium text-blue-800 dark:text-blue-200">
                                {formatearHorario(horario)}
                            </span>
                            <button
                                type="button"
                                onClick={() => eliminarHorario(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                            >
                                ❌ Eliminar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Formulario para agregar nuevo horario */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-dark-border">
                <h5 className="text-base font-medium text-gray-700 dark:text-dark-text2 mb-3">➕ Agregar Nuevo Horario</h5>

                <div className="grid md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-dark-text2">Hora Inicio</label>
                        <input
                            type="time"
                            value={nuevoHorario.hora_inicio}
                            onChange={(e) => setNuevoHorario(prev => ({ ...prev, hora_inicio: e.target.value }))}
                            className="input-compact"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-dark-text2">Hora Fin</label>
                        <input
                            type="time"
                            value={nuevoHorario.hora_fin}
                            onChange={(e) => setNuevoHorario(prev => ({ ...prev, hora_fin: e.target.value }))}
                            className="input-compact"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={agregarHorario}
                            disabled={!nuevoHorario.hora_inicio || !nuevoHorario.hora_fin}
                            className="btn-primary text-sm px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ➕ Agregar
                        </button>
                    </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-dark-text2 mt-2">
                    💡 Puedes agregar múltiples horarios de disponibilidad
                </p>
            </div>
        </div>
    );
}
