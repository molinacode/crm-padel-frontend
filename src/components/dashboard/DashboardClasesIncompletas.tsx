import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../shared';
import { formatearFecha } from '../../utils/dateUtils';

interface ClaseIncompleta {
  id: string;
  nombre: string;
  nivel_clase?: string;
  dia_semana?: string;
  fecha: string;
  tipo_clase?: string;
  eventoId?: string;
}

interface DashboardClasesIncompletasProps {
  clasesIncompletas: ClaseIncompleta[];
}

export default function DashboardClasesIncompletas({
  clasesIncompletas,
}: DashboardClasesIncompletasProps) {
  const navigate = useNavigate();

  return (
    <SectionCard title="Clases incompletas" iconColor="yellow">
      {clasesIncompletas.length === 0 ? (
        <p className="text-gray-500 dark:text-dark-text2 text-sm">
          ¡Excelente! Todas las clases tienen alumnos asignados.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {clasesIncompletas.slice(0, 5).map(clase => (
              <div
                key={clase.id}
                className="flex items-center justify-between p-5 bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl border border-yellow-100 dark:border-yellow-800/50 cursor-pointer group"
                onClick={() => {
                  if (!clase.eventoId) return;
                  navigate(`/clases?tab=proximas&view=table&highlight=${clase.eventoId}`);
                }}
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{clase.nombre}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {clase.nivel_clase} • {clase.dia_semana}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold mt-1">
                    📅 {clase.fecha === 'Próximamente' ? 'Próximamente' : formatearFecha(clase.fecha)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}
