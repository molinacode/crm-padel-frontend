import { useMemo } from 'react';
import MobileCard from './MobileCard';

type EstadoAsistencia =
  | 'asistio'
  | 'falta'
  | 'justificada'
  | 'lesionado'
  | 'recuperacion'
  | '';

interface AlumnoLike {
  id: string;
  nombre: string;
  tipo?: string;
}

interface MobileAsistenciaCardProps {
  alumno: AlumnoLike;
  estado?: EstadoAsistencia;
  recuperacionMarcada?: Date | string | null;
  claseId: string;
  onCambioEstado: (
    claseId: string,
    alumnoId: string,
    nuevoEstado: EstadoAsistencia
  ) => void;
}

export default function MobileAsistenciaCard({
  alumno,
  estado,
  recuperacionMarcada,
  claseId,
  onCambioEstado,
}: MobileAsistenciaCardProps) {
  const estadoConfig = useMemo(() => {
    switch (estado) {
      case 'asistio':
        return { label: '✅ Asistió', colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' };
      case 'falta':
        return { label: '❌ Falta', colorClass: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' };
      case 'justificada':
        return { label: '⚠️ Justificada', colorClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' };
      case 'lesionado':
        return { label: '🚑 Lesionado', colorClass: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' };
      default:
        return { label: '⏳ Pendiente', colorClass: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' };
    }
  }, [estado]);

  const badges = useMemo(() => {
    const badgesArray = [{ label: estadoConfig.label, colorClass: estadoConfig.colorClass }];
    if (alumno.tipo === 'temporal') {
      badgesArray.push({ label: '⏰ Temporal', colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' });
    }
    if (recuperacionMarcada) {
      const fechaRecuperacion =
        recuperacionMarcada instanceof Date
          ? recuperacionMarcada
          : new Date(recuperacionMarcada);
      if (!Number.isNaN(fechaRecuperacion.getTime())) {
        badgesArray.push({
          label: `🔄 Recuperación - ${fechaRecuperacion.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
          colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        });
      }
    }
    return badgesArray;
  }, [estadoConfig, alumno.tipo, recuperacionMarcada]);

  return (
    <MobileCard
      title={alumno.nombre}
      subtitle={alumno.tipo === 'temporal' ? 'Asignación temporal' : undefined}
      icon="👤"
      iconBg="bg-blue-100 dark:bg-blue-900/30"
      iconColor="text-blue-600 dark:text-blue-400"
      badges={badges}
    >
      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Estado de asistencia
        </label>
        <select
          value={estado || ''}
          onChange={e =>
            onCambioEstado(claseId, alumno.id, e.target.value as EstadoAsistencia)
          }
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-surface dark:text-dark-text"
        >
          <option value="">Seleccionar...</option>
          <option value="asistio">✅ Asistió</option>
          <option value="falta">❌ Falta</option>
          <option value="justificada">⚠️ Justificada</option>
          <option value="lesionado">🚑 Lesionado</option>
          <option value="recuperacion">🔄 Recuperación</option>
        </select>
      </div>
    </MobileCard>
  );
}
