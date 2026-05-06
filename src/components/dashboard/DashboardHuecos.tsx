import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../shared';
import { formatearFecha } from '../../utils/dateUtils';

interface AlumnoFalta {
  nombre: string;
  derechoRecuperacion?: boolean;
}

interface HuecoItem {
  claseId: string;
  eventoId: string;
  fecha: string;
  nombre: string;
  nivel_clase?: string;
  dia_semana?: string;
  alumnosConFaltas?: AlumnoFalta[];
  cantidadHuecos: number;
}

interface DashboardHuecosProps {
  huecosPorFaltas: HuecoItem[];
  totalHuecos: number;
}

export default function DashboardHuecos({ huecosPorFaltas, totalHuecos }: DashboardHuecosProps) {
  const navigate = useNavigate();

  return (
    <SectionCard title="Huecos por faltas" iconColor="orange" badge={<span>{totalHuecos || 0} huecos</span>}>
      {huecosPorFaltas?.length === 0 ? (
        <p className="text-gray-500 dark:text-dark-text2 text-sm">No hay faltas próximas.</p>
      ) : (
        <div className="space-y-3">
          {huecosPorFaltas.slice(0, 6).map(item => (
            <div
              key={`${item.claseId}-${item.fecha}`}
              className="flex items-center justify-between p-5 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-800/50 cursor-pointer group"
              onClick={() => navigate(`/clases?tab=proximas&view=table&highlight=${item.eventoId}`)}
            >
              <div className="min-w-0 mr-4 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{item.nombre}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{item.nivel_clase} • {item.dia_semana}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1">
                  📅 {item.fecha === 'Próximamente' ? 'Próximamente' : formatearFecha(item.fecha)}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-white text-orange-700 border-2 border-orange-200">
                  {item.cantidadHuecos} hueco{item.cantidadHuecos !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
