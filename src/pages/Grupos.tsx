import { useMemo, useState, type DragEvent } from 'react';
import { addWeeks } from 'date-fns';
import { PageHeader, LoadingSpinner } from '../components/shared';
import MobileTabsSelector from '../components/common/MobileTabsSelector';
import GrupoForm from '../components/grupos/GrupoForm';
import HuecosWeekGrid, {
  type DragPayload,
} from '../components/grupos/HuecosWeekGrid';
import { useGrupos } from '../hooks/useGrupos';
import { useAlumnos } from '../hooks/useAlumnos';
import { useProfesores } from '../hooks/useProfesores';
import {
  addOneHour,
  franjasDeGrupos,
  grupoEnFranja,
  mondayOf,
  normalizeHora,
  semanaLabel,
} from '../utils/gruposCalendar';
import type { GrupoConMiembros } from '../services/grupoService';
import type { Tables } from '../types/supabase';

type Alumno = Tables<'alumnos'>;

function errorMessage(error: unknown): string {
  if (!error) return 'No se pudo guardar';
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: string }).message);
  }
  return 'No se pudo guardar';
}

export default function Grupos() {
  const { grupos, loading, error, crear, actualizar, eliminar, asignarAlumno, quitarAlumno } =
    useGrupos();
  const { alumnos, loading: loadingAlumnos } = useAlumnos({ activo: true });
  const { profesores } = useProfesores();
  const [tab, setTab] = useState('calendario');
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [selected, setSelected] = useState<DragPayload | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GrupoConMiembros | null>(null);

  const franjas = useMemo(
    () => franjasDeGrupos(grupos.map(g => g.hora_inicio)),
    [grupos]
  );

  const showToast = (text: string, isError = false) => {
    setToast({ text, error: isError });
    window.setTimeout(() => setToast(null), 2800);
  };

  const colocarEnFranja = async (dia: string, hora: string, payload: DragPayload) => {
    const ocupante = grupoEnFranja(grupos, dia, hora);

    if (payload.kind === 'grupo') {
      if (ocupante && ocupante.id !== payload.id) {
        showToast('Esta franja ya tiene un grupo.', true);
        return;
      }
      const err = await actualizar(payload.id, {
        dia_semana: dia,
        hora_inicio: normalizeHora(hora),
        hora_fin: addOneHour(hora),
      });
      if (err) showToast(errorMessage(err), true);
      else showToast(`Grupo colocado el ${dia} a las ${normalizeHora(hora)}`);
      setSelected(null);
      return;
    }

    if (!ocupante) {
      showToast('Primero coloca un grupo en esta franja.', true);
      return;
    }
    if (ocupante.miembros.some(m => m.alumnoId === payload.id)) {
      showToast('Ese alumno ya está en este grupo.', true);
      return;
    }
    if (ocupante.miembros.length >= ocupante.capacidad_maxima) {
      showToast(`Esta franja ya tiene el máximo de ${ocupante.capacidad_maxima}.`, true);
      return;
    }
    const err = await asignarAlumno(ocupante.id, payload.id);
    if (err) showToast(errorMessage(err), true);
    else {
      const alumno = alumnos.find(a => a.id === payload.id);
      showToast(`${alumno?.nombre || 'Alumno'} añadido a ${ocupante.nombre}`);
    }
    setSelected(null);
  };

  const handleSelectSlot = (dia: string, hora: string) => {
    if (!selected) return;
    void colocarEnFranja(dia, hora, selected);
  };

  const startDrag = (event: DragEvent, payload: DragPayload) => {
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copy';
    setSelected(payload);
  };

  if (loading || loadingAlumnos) {
    return <LoadingSpinner size="large" text="Cargando grupos..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grupos"
        subtitle="Calendario de huecos: arrastra un grupo a la franja y luego los alumnos. Máximo según el aforo."
        gradient="from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
        actions={
          <button
            type="button"
            className="btn-primary px-4 py-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Nuevo grupo
          </button>
        }
      />

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 p-4 text-sm text-amber-900 dark:text-amber-100">
          No se pudieron cargar los grupos. Si es la primera vez, ejecuta en Supabase el SQL de{' '}
          <code className="font-mono">migrations/2026-09-22_grupos-y-capacidad.sql</code>.
          <div className="mt-1 text-xs opacity-80">{error}</div>
        </div>
      )}

      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        <MobileTabsSelector
          tabs={[
            { key: 'calendario', label: 'Calendario de huecos', icon: '' },
            { key: 'lista', label: `Grupos (${grupos.length})`, icon: '' },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        />

        <div className="p-4 sm:p-6">
          {tab === 'calendario' && (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
              <aside className="space-y-4">
                <section>
                  <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-text2 mb-2">
                    Grupos
                  </h2>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {grupos.filter(g => g.activo !== false).map(grupo => (
                      <button
                        key={grupo.id}
                        type="button"
                        draggable
                        onDragStart={e => startDrag(e, { kind: 'grupo', id: grupo.id })}
                        onDragEnd={() => setSelected(null)}
                        onClick={() =>
                          setSelected(prev =>
                            prev?.kind === 'grupo' && prev.id === grupo.id
                              ? null
                              : { kind: 'grupo', id: grupo.id }
                          )
                        }
                        className={`w-full text-left rounded-md px-2 py-1.5 text-sm border ${
                          selected?.kind === 'grupo' && selected.id === grupo.id
                            ? 'ring-2 ring-blue-500'
                            : 'border-transparent'
                        }`}
                        style={{
                          background: `${grupo.color}22`,
                          color: grupo.color,
                        }}
                      >
                        <span className="font-medium">{grupo.nombre}</span>
                        <span className="block text-[11px] opacity-80">
                          {grupo.dia_semana && grupo.hora_inicio
                            ? `${grupo.dia_semana} ${normalizeHora(grupo.hora_inicio)} · ${grupo.miembros.length}/${grupo.capacidad_maxima}`
                            : `Sin franja · ${grupo.miembros.length}/${grupo.capacidad_maxima}`}
                        </span>
                      </button>
                    ))}
                    {grupos.length === 0 && (
                      <p className="text-xs text-gray-500 dark:text-dark-text2">
                        Crea un grupo para poder colocarlo en la semana.
                      </p>
                    )}
                  </div>
                </section>
                <section>
                  <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-text2 mb-2">
                    Alumnos
                  </h2>
                  <div className="space-y-1 max-h-[28rem] overflow-y-auto">
                    {alumnos.map((alumno: Alumno) => (
                      <button
                        key={alumno.id}
                        type="button"
                        draggable
                        onDragStart={e => startDrag(e, { kind: 'alumno', id: alumno.id })}
                        onDragEnd={() => setSelected(null)}
                        onClick={() =>
                          setSelected(prev =>
                            prev?.kind === 'alumno' && prev.id === alumno.id
                              ? null
                              : { kind: 'alumno', id: alumno.id }
                          )
                        }
                        className={`w-full text-left rounded-md px-2 py-1.5 text-sm border bg-gray-50 dark:bg-gray-800/50 ${
                          selected?.kind === 'alumno' && selected.id === alumno.id
                            ? 'ring-2 ring-blue-500 border-blue-400'
                            : 'border-gray-200 dark:border-dark-border'
                        }`}
                      >
                        {alumno.nombre}
                      </button>
                    ))}
                  </div>
                  <p className="hint mt-3 text-xs text-gray-500 dark:text-dark-text2 leading-relaxed">
                    Arrastra (o toca y luego toca la franja). Un alumno puede estar en varios grupos; no se
                    duplica en el mismo.
                  </p>
                </section>
              </aside>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm"
                      onClick={() => setWeekStart(d => addWeeks(d, -1))}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm"
                      onClick={() => setWeekStart(mondayOf(new Date()))}
                    >
                      Esta semana
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm"
                      onClick={() => setWeekStart(d => addWeeks(d, 1))}
                    >
                      Siguiente
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-dark-text2 capitalize">
                    {semanaLabel(weekStart)}
                  </p>
                </div>
                <HuecosWeekGrid
                  weekStart={weekStart}
                  franjas={franjas}
                  grupos={grupos}
                  selected={selected}
                  onSelectSlot={handleSelectSlot}
                  onDropPayload={(dia, hora, payload) => {
                    void colocarEnFranja(dia, hora, payload);
                  }}
                  onRemoveAlumno={id => {
                    void quitarAlumno(id);
                  }}
                  onUnscheduleGrupo={id => {
                    void actualizar(id, {
                      dia_semana: null,
                      hora_inicio: null,
                      hora_fin: null,
                    });
                  }}
                />
              </div>
            </div>
          )}

          {tab === 'lista' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-dark-text2 border-b border-gray-200 dark:border-dark-border">
                    <th className="py-2 pr-3">Grupo</th>
                    <th className="py-2 pr-3">Horario</th>
                    <th className="py-2 pr-3">Aforo</th>
                    <th className="py-2 pr-3">Profesor</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map(grupo => (
                    <tr
                      key={grupo.id}
                      className="border-b border-gray-100 dark:border-dark-border/60"
                    >
                      <td className="py-3 pr-3">
                        <span className="font-medium" style={{ color: grupo.color }}>
                          {grupo.nombre}
                        </span>
                        <span className="block text-xs text-gray-500">{grupo.nivel}</span>
                      </td>
                      <td className="py-3 pr-3">
                        {grupo.dia_semana && grupo.hora_inicio
                          ? `${grupo.dia_semana} ${normalizeHora(grupo.hora_inicio)}`
                          : 'Sin franja'}
                      </td>
                      <td className="py-3 pr-3">
                        {grupo.miembros.length}/{grupo.capacidad_maxima}
                      </td>
                      <td className="py-3 pr-3">{grupo.profesor || '—'}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="text-blue-600 dark:text-blue-400 mr-3"
                          onClick={() => {
                            setEditing(grupo);
                            setFormOpen(true);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-red-600 dark:text-red-400"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar el grupo ${grupo.nombre}?`)) {
                              void eliminar(grupo.id);
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {grupos.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-dark-text2 py-6 text-center">
                  Aún no hay grupos.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Editar grupo' : 'Nuevo grupo'}
            </h2>
            <GrupoForm
              grupo={editing}
              profesores={profesores}
              onCancel={() => {
                setFormOpen(false);
                setEditing(null);
              }}
              onSave={async values => {
                const err = editing
                  ? await actualizar(editing.id, values)
                  : await crear(values);
                if (err) {
                  showToast(errorMessage(err), true);
                  return;
                }
                setFormOpen(false);
                setEditing(null);
                setTab('calendario');
              }}
            />
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-2.5 text-sm shadow-lg ${
            toast.error
              ? 'bg-white dark:bg-dark-surface border-red-400 text-red-600'
              : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border'
          }`}
          role="status"
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
