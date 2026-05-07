import { useState, type Dispatch, type SetStateAction } from 'react';
import { LoadingSpinner } from '../components/shared';
import { useSincronizacionAsignaciones } from '@features/alumnos';
import {
  AsistenciasHeader,
  AsistenciasEmptyState,
  AsistenciasClaseCard,
  useAsistenciasData,
  useAsistenciasHandlers,
} from '@features/asistencias';

export default function Asistencias() {
  type EstadoAsistencia = 'asistio' | 'falta' | 'justificada' | 'lesionado' | 'recuperacion';
  type EstadoAsistenciaUI = EstadoAsistencia | '';
  type AsistenciasMapHandlers = Record<string, Record<string, EstadoAsistencia>>;

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const { sincronizando } = useSincronizacionAsignaciones();

  const {
    clases,
    alumnosPorClase,
    asistencias,
    recuperacionesMarcadas,
    loading,
    proximaFechaConClases,
    setAsistencias,
  } = useAsistenciasData(fecha);

  const { handleCambioEstado } = useAsistenciasHandlers(
    fecha,
    setAsistencias as unknown as Dispatch<SetStateAction<AsistenciasMapHandlers>>
  );

  const onCambioEstado = (
    claseId: string,
    alumnoId: string,
    estado: EstadoAsistenciaUI
  ) => {
    if (!estado) return;
    void handleCambioEstado(claseId, alumnoId, estado);
  };

  if (loading) {
    return <LoadingSpinner size='large' text='Cargando asistencias...' />;
  }

  return (
    <div className='space-y-8'>
      <AsistenciasHeader
        fecha={fecha}
        setFecha={setFecha}
        sincronizando={sincronizando}
      />

      {clases.length === 0 ? (
        <AsistenciasEmptyState
          fecha={fecha}
          proximaFechaConClases={proximaFechaConClases}
          setFecha={setFecha}
        />
      ) : (
        clases.map(evento => (
          <AsistenciasClaseCard
            key={evento.id}
            evento={evento}
            clase={{
              ...evento.clases,
              nombre: evento.clases.nombre || 'Clase sin nombre',
            }}
            alumnos={alumnosPorClase[evento.clases.id] || []}
            asistenciasClase={
              (asistencias[evento.clases.id] || {}) as unknown as Record<
                string,
                'asistio' | 'falta' | 'justificada' | 'lesionado' | 'recuperacion' | ''
              >
            }
            recuperacionesMarcadas={
              (recuperacionesMarcadas[evento.clases.id] ||
                {}) as unknown as Record<
                string,
                Record<string, Date | string | null>
              >
            }
            onCambioEstado={onCambioEstado}
          />
        ))
      )}
    </div>
  );
}
