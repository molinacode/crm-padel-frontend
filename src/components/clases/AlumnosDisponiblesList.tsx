import type { Dispatch, SetStateAction } from 'react';

interface AlumnoItem {
  id: string;
  nombre: string;
  email?: string;
  nivel?: string;
}

interface ClaseActual {
  nivel_clase?: string;
}

interface AlumnosDisponiblesListProps {
  alumnos: AlumnoItem[];
  alumnosFiltrados: AlumnoItem[];
  busqueda: string;
  setBusqueda: Dispatch<SetStateAction<string>>;
  asignados: Set<string>;
  maxAlcanzado: boolean;
  onToggleAlumno: (alumnoId: string) => void;
  claseActual?: ClaseActual | null;
}

export default function AlumnosDisponiblesList({
  alumnos,
  alumnosFiltrados,
  busqueda,
  setBusqueda,
  asignados,
  maxAlcanzado,
  onToggleAlumno,
  claseActual = null,
}: AlumnosDisponiblesListProps) {
  return (
    <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-dark-text">
            Alumnos Disponibles
          </h4>
          <p className="text-sm text-gray-500 dark:text-dark-text2">
            {busqueda
              ? `${alumnosFiltrados.length} de ${alumnos.length} alumnos`
              : `${alumnos.length} alumnos`}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
          />
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {alumnosFiltrados.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-dark-text2">No se encontraron alumnos</p>
          </div>
        ) : (
          alumnosFiltrados.map(alumno => (
            <div
              key={alumno.id}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                asignados.has(alumno.id)
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : maxAlcanzado && !asignados.has(alumno.id)
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
                  : 'border-gray-200 dark:border-dark-border hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm'
              }`}
              onClick={() => {
                if (!maxAlcanzado || asignados.has(alumno.id)) onToggleAlumno(alumno.id);
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`${alumno.nivel ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-sm'} rounded-full flex items-center justify-center font-medium ${
                    asignados.has(alumno.id)
                      ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {alumno.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className={`${alumno.nivel ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-dark-text`}>
                    {alumno.nombre}
                  </p>
                  {alumno.email && (
                    <p className="text-xs text-gray-500 dark:text-dark-text2">{alumno.email}</p>
                  )}
                  {alumno.nivel && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        🎯 {alumno.nivel}
                      </span>
                      {claseActual && alumno.nivel !== claseActual.nivel_clase && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                          ⚠️ Nivel diferente
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
