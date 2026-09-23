import { useMemo, useState } from 'react';
import ClasesEventosTable from './ClasesEventosTable';

function lunesDe(fecha: Date): Date {
  const dia = new Date(fecha);
  dia.setHours(0, 0, 0, 0);
  const offset = (dia.getDay() + 6) % 7;
  dia.setDate(dia.getDate() - offset);
  return dia;
}

interface Handlers {
  handleOcuparHuecos?: (...args: unknown[]) => void;
  handleOcuparHuecosRecuperacion?: (...args: unknown[]) => void;
  handleRecuperacion?: (...args: unknown[]) => void;
  handleDesasignar?: (...args: unknown[]) => void;
  handleCancelar?: (...args: unknown[]) => void;
  handleEditar?: (...args: unknown[]) => void;
  handleEditarSerie?: (...args: unknown[]) => void;
  handleEditarProfesor?: (...args: unknown[]) => void;
  handleEliminar?: (...args: unknown[]) => void;
  handleToggleExcluirAlquiler?: (...args: unknown[]) => void;
}

interface ClasesImpartidasTabProps {
  eventosImpartidos: unknown[];
  getClassColors: (...args: unknown[]) => { badgeClass: string; label: string };
  handlers: Handlers;
  elementosPorPagina: number;
  paginaActual: number;
  setPaginaActual: (page: number) => void;
  totalPaginas: number;
  searchParams: URLSearchParams;
}

export default function ClasesImpartidasTab({
  eventosImpartidos,
  getClassColors,
  handlers,
  elementosPorPagina,
  searchParams,
}: ClasesImpartidasTabProps) {
  const semanas = useMemo(() => {
    const claves = new Set<string>();
    (eventosImpartidos as Array<{ start?: string | Date }>).forEach(evento => {
      if (!evento.start) return;
      claves.add(lunesDe(new Date(evento.start)).toISOString().slice(0, 10));
    });
    return [...claves].sort();
  }, [eventosImpartidos]);
  const [indiceManual, setIndiceManual] = useState<number | null>(null);
  const [paginaSemana, setPaginaSemana] = useState(1);
  const indice = indiceManual ?? Math.max(0, semanas.length - 1);
  const semana = semanas[indice];
  const deLaSemana = useMemo(() => {
    if (!semana) return [];
    const inicio = new Date(`${semana}T00:00:00`);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 7);
    return (eventosImpartidos as Array<{ start?: string | Date }>).filter(evento => {
      if (!evento.start) return false;
      const fecha = new Date(evento.start);
      return fecha >= inicio && fecha < fin;
    });
  }, [eventosImpartidos, semana]);
  const etiqueta = semana
    ? new Date(`${semana}T00:00:00`).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2a332c] bg-[#1c241e] p-4">
        <div>
          <h3 className="font-semibold text-[#f5f1e8]">Semana del {etiqueta}</h3>
          <p className="text-sm text-[#d8d2c4]">
            {deLaSemana.length} clases esta semana. El curso tiene {eventosImpartidos.length} impartidas.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={indice <= 0}
            onClick={() => {
              setPaginaSemana(1);
              setIndiceManual(Math.max(0, indice - 1));
            }}
            className="rounded-md border border-[#c9a658] px-3 py-1 text-sm text-[#c9a658] disabled:opacity-40"
          >
            Semana anterior
          </button>
          <button
            type="button"
            disabled={indice >= semanas.length - 1}
            onClick={() => {
              setPaginaSemana(1);
              setIndiceManual(Math.min(semanas.length - 1, indice + 1));
            }}
            className="rounded-md border border-[#c9a658] px-3 py-1 text-sm text-[#c9a658] disabled:opacity-40"
          >
            Semana siguiente
          </button>
        </div>
      </div>

      <ClasesEventosTable
        eventos={deLaSemana}
        getClassColors={getClassColors}
        onAsignar={null}
        onOcuparHuecos={handlers.handleOcuparHuecos}
        onOcuparHuecosRecuperacion={handlers.handleOcuparHuecosRecuperacion}
        onRecuperacion={handlers.handleRecuperacion}
        onDesasignar={handlers.handleDesasignar}
        onCancelar={handlers.handleCancelar}
        onEditar={handlers.handleEditar}
        onEditarSerie={handlers.handleEditarSerie}
        onEditarProfesor={handlers.handleEditarProfesor}
        onEliminar={handlers.handleEliminar}
        onEliminarSerie={null}
        onToggleExcluirAlquiler={handlers.handleToggleExcluirAlquiler}
        elementosPorPagina={elementosPorPagina}
        paginaActual={paginaSemana}
        setPaginaActual={setPaginaSemana}
        totalPaginas={Math.max(1, Math.ceil(deLaSemana.length / elementosPorPagina))}
        searchParams={searchParams}
      />
    </div>
  );
}
