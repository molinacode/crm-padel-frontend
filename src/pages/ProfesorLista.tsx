import { useState, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/shared';
import PageHeader from '../components/shared/PageHeader';
import {
  AsistenciasHeader,
  AsistenciasEmptyState,
  AsistenciasClaseCard,
  useAsistenciasData,
  useAsistenciasHandlers,
} from '@features/asistencias';
import { useMiProfesor } from '../hooks/useMiProfesor';

const SIN_PROFESOR = ['__sin_profesor__'];

export default function ProfesorLista() {
  type EstadoAsistencia = 'asistio' | 'falta' | 'justificada' | 'lesionado' | 'recuperacion';
  type EstadoAsistenciaUI = EstadoAsistencia | '';
  type AsistenciasMapHandlers = Record<string, Record<string, EstadoAsistencia>>;

  const [params] = useSearchParams();
  const { nombres, propio, loading: cargandoProfesor } = useMiProfesor();
  const [fecha, setFecha] = useState(
    params.get('fecha') || new Date().toISOString().split('T')[0]
  );
  const {
    clases,
    alumnosPorClase,
    asistencias,
    recuperacionesMarcadas,
    loading,
    proximaFechaConClases,
    setAsistencias,
  } = useAsistenciasData(fecha, propio ? nombres : SIN_PROFESOR);

  const { handleCambioEstado } = useAsistenciasHandlers(
    fecha,
    setAsistencias as unknown as Dispatch<SetStateAction<AsistenciasMapHandlers>>
  );

  if (cargandoProfesor || loading) {
    return <LoadingSpinner size='large' text='Cargando el pase de lista...' />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader title='Pase de lista' subtitle={propio?.nombre || 'Sin profesor vinculado'} />
      <AsistenciasHeader fecha={fecha} setFecha={setFecha} sincronizando={false} />
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
            clase={{ ...evento.clases, nombre: evento.clases.nombre || 'Clase sin nombre' }}
            alumnos={alumnosPorClase[evento.clases.id] || []}
            asistenciasClase={
              (asistencias[evento.clases.id] || {}) as Record<string, EstadoAsistenciaUI>
            }
            recuperacionesMarcadas={
              (recuperacionesMarcadas[evento.clases.id] || {}) as unknown as Record<
                string,
                Record<string, Date | string | null>
              >
            }
            onCambioEstado={(claseId, alumnoId, estado) => {
              if (!estado) return;
              void handleCambioEstado(claseId, alumnoId, estado);
            }}
          />
        ))
      )}
    </div>
  );
}
