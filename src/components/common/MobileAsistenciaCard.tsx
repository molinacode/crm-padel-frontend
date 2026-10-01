import { useMemo } from 'react';
import MobileCard from './MobileCard';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

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

const ESTADOS_RAPIDOS: {
  value: EstadoAsistencia;
  label: string;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    value: 'asistio',
    label: 'Asistió',
    activeClass: 'bg-green-600 text-white border-green-600',
    idleClass:
      'bg-white dark:bg-dark-surface2 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800',
  },
  {
    value: 'falta',
    label: 'Falta',
    activeClass: 'bg-red-600 text-white border-red-600',
    idleClass:
      'bg-white dark:bg-dark-surface2 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800',
  },
  {
    value: 'justificada',
    label: 'Justif.',
    activeClass: 'bg-amber-500 text-white border-amber-500',
    idleClass:
      'bg-white dark:bg-dark-surface2 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800',
  },
];

export default function MobileAsistenciaCard({
  alumno,
  estado,
  recuperacionMarcada,
  claseId,
  onCambioEstado,
}: MobileAsistenciaCardProps) {
  const setEstado = (nuevo: EstadoAsistencia) => {
    onCambioEstado(claseId, alumno.id, nuevo);
  };

  const swipe = useSwipeGesture({
    axis: 'horizontal',
    threshold: 56,
    onSwipeRight: () => setEstado('asistio'),
    onSwipeLeft: () => setEstado('falta'),
  });

  const estadoConfig = useMemo(() => {
    switch (estado) {
      case 'asistio':
        return {
          label: 'Asistió',
          colorClass:
            'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
        };
      case 'falta':
        return {
          label: 'Falta',
          colorClass: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
        };
      case 'justificada':
        return {
          label: 'Justificada',
          colorClass:
            'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200',
        };
      case 'lesionado':
        return {
          label: 'Lesionado',
          colorClass:
            'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300',
        };
      case 'recuperacion':
        return {
          label: 'Recuperación',
          colorClass:
            'bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-200',
        };
      default:
        return {
          label: 'Pendiente',
          colorClass:
            'bg-neutral-100 dark:bg-dark-surface2 text-neutral-700 dark:text-dark-text2',
        };
    }
  }, [estado]);

  const badges = useMemo(() => {
    const badgesArray = [
      { label: estadoConfig.label, colorClass: estadoConfig.colorClass },
    ];
    if (alumno.tipo === 'temporal') {
      badgesArray.push({
        label: 'Temporal',
        colorClass:
          'bg-neutral-100 dark:bg-dark-surface2 text-neutral-700 dark:text-dark-text2',
      });
    }
    if (recuperacionMarcada) {
      const fechaRecuperacion =
        recuperacionMarcada instanceof Date
          ? recuperacionMarcada
          : new Date(recuperacionMarcada);
      if (!Number.isNaN(fechaRecuperacion.getTime())) {
        badgesArray.push({
          label: `Recup. ${fechaRecuperacion.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
          })}`,
          colorClass:
            'bg-neutral-100 dark:bg-dark-surface2 text-neutral-700 dark:text-dark-text2',
        });
      }
    }
    return badgesArray;
  }, [estadoConfig, alumno.tipo, recuperacionMarcada]);

  return (
    <div {...swipe} className="touch-pan-y">
      <MobileCard
        title={alumno.nombre}
        subtitle={
          alumno.tipo === 'temporal'
            ? 'Asignación temporal · desliza → asistió / ← falta'
            : 'Desliza → asistió / ← falta'
        }
        badges={badges}
      >
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ESTADOS_RAPIDOS.map(opt => {
            const active = estado === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEstado(opt.value)}
                className={`min-h-11 rounded-md border px-2 text-sm font-medium transition-colors ${
                  active ? opt.activeClass : opt.idleClass
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setEstado('lesionado')}
            className={`min-h-11 flex-1 rounded-md border px-2 text-sm font-medium ${
              estado === 'lesionado'
                ? 'border-rose-600 bg-rose-600 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 dark:border-dark-border dark:bg-dark-surface2 dark:text-dark-text2'
            }`}
          >
            Lesionado
          </button>
          <button
            type="button"
            onClick={() => setEstado('recuperacion')}
            className={`min-h-11 flex-1 rounded-md border px-2 text-sm font-medium ${
              estado === 'recuperacion'
                ? 'border-[#c9a658] bg-[#c9a658] text-[#0e1410]'
                : 'border-neutral-300 bg-white text-neutral-700 dark:border-dark-border dark:bg-dark-surface2 dark:text-dark-text2'
            }`}
          >
            Recuperación
          </button>
        </div>
      </MobileCard>
    </div>
  );
}
