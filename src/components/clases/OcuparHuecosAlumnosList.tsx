interface ClaseOriginal {
  nombre?: string;
}

interface RecuperacionInfo {
  clase_original?: ClaseOriginal;
  fecha_falta: string;
}

interface AlumnoItem {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  nivel?: string;
  recuperacion?: RecuperacionInfo;
}

interface OcuparHuecosAlumnosListProps {
  alumnosFiltrados: AlumnoItem[];
  busqueda: string;
  setBusqueda: (value: string) => void;
  alumnosSeleccionados: Set<string>;
  origenPorAlumno: Map<string, 'escuela' | 'interna'>;
  huecosDisponibles: number;
  onToggleAlumno: (alumnoId: string) => void;
  onToggleOrigenAlumno: (alumnoId: string, origen: 'escuela' | 'interna') => void;
}

export default function OcuparHuecosAlumnosList({
  alumnosFiltrados,
  busqueda,
  setBusqueda,
  alumnosSeleccionados,
  origenPorAlumno,
  huecosDisponibles,
  onToggleAlumno,
  onToggleOrigenAlumno,
}: OcuparHuecosAlumnosListProps) {
  return (
    <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar alumnos..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-dark-text"
        />
      </div>

      {alumnosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">
            No hay alumnos disponibles
          </h3>
          <p className="text-gray-500 dark:text-dark-text2">
            {busqueda
              ? 'No se encontraron alumnos que coincidan con la búsqueda'
              : 'No hay huecos reales disponibles en esta clase o todos los alumnos activos ya están asignados'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-dark-text">
              Alumnos disponibles ({alumnosFiltrados.length})
            </h3>
            <span className="text-sm text-gray-500 dark:text-dark-text2">
              Seleccionados: {alumnosSeleccionados.size}/{huecosDisponibles}
            </span>
          </div>

          {alumnosFiltrados.map(alumno => (
            <div
              key={alumno.id}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                alumnosSeleccionados.has(alumno.id)
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                  : 'border-gray-200 dark:border-dark-border hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-sm'
              }`}
              onClick={() => onToggleAlumno(alumno.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={alumnosSeleccionados.has(alumno.id)}
                    onChange={() => onToggleAlumno(alumno.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 text-orange-600"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text">
                      {alumno.nombre}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-dark-text2">
                      {alumno.email && <span>📧 {alumno.email}</span>}
                      {alumno.telefono && <span>📱 {alumno.telefono}</span>}
                      {alumno.nivel && <span>🎯 {alumno.nivel}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {alumnosSeleccionados.has(alumno.id) && (
                <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800/30">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={origenPorAlumno.get(alumno.id) === 'escuela'}
                      onChange={e => {
                        e.stopPropagation();
                        onToggleOrigenAlumno(
                          alumno.id,
                          e.target.checked ? 'escuela' : 'interna'
                        );
                      }}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      💰 Genera deuda (Escuela)
                    </span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
