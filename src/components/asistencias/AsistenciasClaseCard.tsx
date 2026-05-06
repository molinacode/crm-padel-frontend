import { useIsMobile } from '../../hooks/useIsMobile';
import AsistenciasTable from './AsistenciasTable';

interface EventoLike {
  hora_inicio?: string | null;
  hora_fin?: string | null;
}

interface ClaseLike {
  id: string;
  nombre: string;
  tipo_clase?: string | null;
  nivel_clase?: string | null;
  profesor?: string | null;
}

interface AlumnoLike {
  id: string;
  nombre: string;
  tipo?: string;
}

type EstadoAsistencia =
  | 'asistio'
  | 'falta'
  | 'justificada'
  | 'lesionado'
  | 'recuperacion'
  | '';

interface AsistenciasClaseCardProps {
  evento: EventoLike;
  clase: ClaseLike;
  alumnos: AlumnoLike[];
  asistenciasClase: Record<string, EstadoAsistencia>;
  recuperacionesMarcadas: Record<string, Record<string, Date | string | null>>;
  onCambioEstado: (
    claseId: string,
    alumnoId: string,
    estado: EstadoAsistencia
  ) => void;
}

export default function AsistenciasClaseCard({
  evento,
  clase,
  alumnos,
  asistenciasClase,
  recuperacionesMarcadas,
  onCambioEstado,
}: AsistenciasClaseCardProps) {
  const isMobile = useIsMobile(1024);
  const esClaseParticular = clase.tipo_clase === 'particular';

  if (isMobile) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-4 mb-4 shadow-sm">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text flex-1">
              {clase.nombre}
            </h3>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {alumnos.length}/{esClaseParticular ? '1' : '4'}
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-text2">alumnos</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs text-gray-600 dark:text-dark-text2">
              🕐 {evento.hora_inicio} - {evento.hora_fin}
            </span>
            <span className="text-xs text-gray-600 dark:text-dark-text2">
              📚 {clase.nivel_clase}
            </span>
            <span
              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                esClaseParticular
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}
            >
              {esClaseParticular ? '🎯 Particular' : '👥 Grupal'}
            </span>
            {clase.profesor && (
              <span className="text-xs text-gray-600 dark:text-dark-text2">
                👨‍🏫 {clase.profesor}
              </span>
            )}
          </div>
        </div>

        {alumnos.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No hay alumnos asignados a esta clase
            </p>
          </div>
        ) : (
          <AsistenciasTable
            alumnos={alumnos}
            asistenciasClase={asistenciasClase}
            recuperacionesMarcadas={recuperacionesMarcadas}
            claseId={clase.id}
            onCambioEstado={onCambioEstado}
          />
        )}
      </div>
    );
  }

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text">
            {clase.nombre}
          </h3>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-600 dark:text-dark-text2">
              🕐 {evento.hora_inicio} - {evento.hora_fin}
            </span>
            <span className="text-sm text-gray-600 dark:text-dark-text2">
              📚 {clase.nivel_clase}
            </span>
            <span
              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                esClaseParticular
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}
            >
              {esClaseParticular ? '🎯 Particular' : '👥 Grupal'}
            </span>
          </div>
          {clase.profesor && (
            <p className="text-sm text-gray-500 dark:text-dark-text2 mt-1">
              👨‍🏫 {clase.profesor}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-dark-text2">
            {alumnos.length}/{esClaseParticular ? '1' : '4'} alumnos
          </p>
        </div>
      </div>

      {alumnos.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            No hay alumnos asignados a esta clase
          </p>
        </div>
      ) : (
        <AsistenciasTable
          alumnos={alumnos}
          asistenciasClase={asistenciasClase}
          recuperacionesMarcadas={recuperacionesMarcadas}
          claseId={clase.id}
          onCambioEstado={onCambioEstado}
        />
      )}
    </div>
  );
}
