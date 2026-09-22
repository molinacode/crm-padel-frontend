import type { DragEvent } from 'react';
import type { GrupoConMiembros } from '../../services/grupoService';
import {
  formatHoraLabel,
  getWeekDays,
  grupoEnFranja,
  slotKey,
} from '../../utils/gruposCalendar';

export type DragPayload =
  | { kind: 'alumno'; id: string }
  | { kind: 'grupo'; id: string };

interface HuecosWeekGridProps {
  weekStart: Date;
  franjas: string[];
  grupos: GrupoConMiembros[];
  selected: DragPayload | null;
  onSelectSlot: (dia: string, hora: string) => void;
  onDropPayload: (dia: string, hora: string, payload: DragPayload) => void;
  onRemoveAlumno: (asignacionId: string) => void;
  onUnscheduleGrupo: (grupoId: string) => void;
}

export default function HuecosWeekGrid({
  weekStart,
  franjas,
  grupos,
  selected,
  onSelectSlot,
  onDropPayload,
  onRemoveAlumno,
  onUnscheduleGrupo,
}: HuecosWeekGridProps) {
  const days = getWeekDays(weekStart);

  const handleDrop = (event: DragEvent<HTMLDivElement>, dia: string, hora: string) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as DragPayload;
      if (payload?.kind && payload?.id) onDropPayload(dia, hora, payload);
    } catch {
      /* ignore malformed drag data */
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div
          className="grid gap-1 mb-1"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map(day => (
            <div
              key={day.nombre}
              className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-text2 py-1"
            >
              {day.etiqueta}
            </div>
          ))}
        </div>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map(day => (
            <div
              key={day.nombre}
              className="rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface flex flex-col"
            >
              <div className="px-2 py-1.5 text-sm font-semibold bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-dark-border">
                {day.nombre}
              </div>
              <div className="p-1 flex flex-col gap-1">
                {franjas.map(hora => {
                  const grupo = grupoEnFranja(grupos, day.nombre, hora);
                  const count = grupo?.miembros.length || 0;
                  const max = grupo?.capacidad_maxima || 4;
                  const full = Boolean(grupo && count >= max);
                  return (
                    <div
                      key={slotKey(day.nombre, hora)}
                      className={`rounded-md border border-dashed p-1.5 min-h-[72px] flex flex-col gap-1 transition ${
                        full
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                          : 'bg-gray-50 dark:bg-gray-900/40 border-gray-300 dark:border-dark-border'
                      } ${selected ? 'ring-1 ring-blue-400/60' : ''}`}
                      onDragOver={e => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDrop={e => handleDrop(e, day.nombre, hora)}
                      onClick={() => onSelectSlot(day.nombre, hora)}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-dark-text2">
                          {formatHoraLabel(hora)} ({count}/{max})
                        </span>
                        {grupo && (
                          <button
                            type="button"
                            className="text-xs text-gray-400 hover:text-red-500"
                            aria-label="Quitar grupo de la franja"
                            onClick={e => {
                              e.stopPropagation();
                              onUnscheduleGrupo(grupo.id);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {grupo && (
                        <div
                          className="text-[11px] font-semibold truncate"
                          style={{ color: grupo.color }}
                        >
                          {grupo.nombre}
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5">
                        {grupo?.miembros.map(miembro => (
                          <div
                            key={miembro.asignacionId}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] leading-tight"
                            style={{
                              background: `${grupo.color}22`,
                              color: grupo.color,
                            }}
                          >
                            <span className="truncate flex-1">{miembro.nombre}</span>
                            <button
                              type="button"
                              className="opacity-60 hover:opacity-100"
                              aria-label={`Quitar a ${miembro.nombre}`}
                              onClick={e => {
                                e.stopPropagation();
                                onRemoveAlumno(miembro.asignacionId);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
