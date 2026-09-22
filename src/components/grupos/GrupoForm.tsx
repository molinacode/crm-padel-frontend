import { useState, type FormEvent } from 'react';
import type { Tables } from '../../types/supabase';
import {
  COLORES_GRUPO,
  DIAS_SEMANA,
  NIVELES_GRUPO,
  addOneHour,
} from '../../utils/gruposCalendar';

type Grupo = Tables<'grupos'>;

interface GrupoFormProps {
  grupo?: Grupo | null;
  profesores: Array<{ id: string; nombre: string }>;
  onCancel: () => void;
  onSave: (values: {
    nombre: string;
    nivel: string;
    capacidad_maxima: number;
    profesor: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    color: string;
    observaciones: string;
    activo: boolean;
  }) => Promise<void>;
}

export default function GrupoForm({
  grupo,
  profesores,
  onCancel,
  onSave,
}: GrupoFormProps) {
  const [nombre, setNombre] = useState(grupo?.nombre || '');
  const [nivel, setNivel] = useState(grupo?.nivel || 'Iniciación (1)');
  const [capacidad, setCapacidad] = useState(grupo?.capacidad_maxima ?? 4);
  const [profesor, setProfesor] = useState(grupo?.profesor || '');
  const [dia, setDia] = useState(grupo?.dia_semana || '');
  const [horaInicio, setHoraInicio] = useState(grupo?.hora_inicio?.slice(0, 5) || '19:00');
  const [horaFin, setHoraFin] = useState(grupo?.hora_fin?.slice(0, 5) || '20:00');
  const [color, setColor] = useState(grupo?.color || COLORES_GRUPO[0]);
  const [observaciones, setObservaciones] = useState(grupo?.observaciones || '');
  const [activo, setActivo] = useState(grupo?.activo ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      await onSave({
        nombre: nombre.trim(),
        nivel,
        capacidad_maxima: Math.max(1, Number(capacidad) || 4),
        profesor,
        dia_semana: dia,
        hora_inicio: horaInicio,
        hora_fin: horaFin || addOneHour(horaInicio),
        color,
        observaciones,
        activo,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="input w-full"
        name="nombre"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        placeholder="Nombre del grupo"
        required
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select className="input w-full" value={nivel} onChange={e => setNivel(e.target.value)}>
          {NIVELES_GRUPO.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <input
          className="input w-full"
          type="number"
          min={1}
          max={8}
          value={capacidad}
          onChange={e => setCapacidad(Number(e.target.value))}
          placeholder="Aforo"
        />
      </div>
      <select className="input w-full" value={profesor} onChange={e => setProfesor(e.target.value)}>
        <option value="">Profesor (opcional)</option>
        {profesores.map(p => (
          <option key={p.id} value={p.nombre}>
            {p.nombre}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select className="input w-full" value={dia} onChange={e => setDia(e.target.value)}>
          <option value="">Sin horario aún</option>
          {DIAS_SEMANA.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          className="input w-full"
          type="time"
          value={horaInicio}
          onChange={e => {
            setHoraInicio(e.target.value);
            if (!horaFin) setHoraFin(addOneHour(e.target.value));
          }}
        />
        <input
          className="input w-full"
          type="time"
          value={horaFin}
          onChange={e => setHoraFin(e.target.value)}
        />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-dark-text2 mb-2">Color</p>
        <div className="flex flex-wrap gap-2">
          {COLORES_GRUPO.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 ${
                color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
              }`}
              style={{ background: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
      <textarea
        className="input w-full"
        rows={3}
        value={observaciones}
        onChange={e => setObservaciones(e.target.value)}
        placeholder="Notas"
      />
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text2">
        <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} />
        Grupo activo
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="px-4 py-2 rounded-lg text-sm" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary px-5 py-2" disabled={saving}>
          {saving ? 'Guardando…' : grupo ? 'Guardar' : 'Crear grupo'}
        </button>
      </div>
    </form>
  );
}
