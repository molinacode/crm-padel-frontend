import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import SugerenciasHorarios from './SugerenciasHorarios';
import { InlineLoadingButton } from './LoadingSpinner';

interface ClaseData {
  id?: string;
  nombre: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  nivel_clase: string;
  profesor: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_clase: string;
  observaciones: string;
}

interface FormularioClaseProps {
  clase?: ClaseData | null;
  onSuccess: () => void;
}

type FormErrors = Record<string, string>;

export default function FormularioClase({ clase, onSuccess }: FormularioClaseProps) {
  const [datos, setDatos] = useState<ClaseData>({
    nombre: '',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
    nivel_clase: 'Iniciación (1)',
    profesor: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_clase: 'grupal',
    observaciones: '',
  });

  const [loading, setLoading] = useState(false);
  const [, setErrors] = useState<FormErrors>({});

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!datos.nombre.trim()) newErrors.nombre = 'El nombre de la clase es obligatorio';
    if (!datos.dia_semana) newErrors.dia_semana = 'Debe seleccionar un día de la semana';
    if (!datos.hora_inicio) newErrors.hora_inicio = 'Debe seleccionar una hora de inicio';
    if (!datos.hora_fin) newErrors.hora_fin = 'Debe seleccionar una hora de fin';
    if (datos.hora_inicio && datos.hora_fin && datos.hora_inicio >= datos.hora_fin) {
      newErrors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
    }
    if (!datos.fecha_inicio) newErrors.fecha_inicio = 'Debe seleccionar una fecha de inicio';
    if (!datos.fecha_fin) newErrors.fecha_fin = 'Debe seleccionar una fecha de fin';
    if (datos.fecha_inicio && datos.fecha_fin && datos.fecha_inicio > datos.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (!clase) return undefined;
    return scheduleEffectWork(() => {
      setDatos(clase);
    });
  }, [clase]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleSeleccionarHorario = (horario: { dia_semana: string; hora_inicio: string; hora_fin: string }) => {
    setDatos(prev => ({
      ...prev,
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
    }));
  };

  const generarEventos = async (claseGuardada: ClaseData & { id: string }) => {
    try {
      const eventos: Array<{ clase_id: string; fecha: string; hora_inicio: string; hora_fin: string }> = [];
      const fecha = new Date(claseGuardada.fecha_inicio);
      const fin = new Date(claseGuardada.fecha_fin);
      const dias: Record<string, number> = {
        Lunes: 1,
        Martes: 2,
        Miércoles: 3,
        Jueves: 4,
        Viernes: 5,
        Sábado: 6,
        Domingo: 0,
      };
      const diaSemana = dias[claseGuardada.dia_semana];

      for (
        let cursor = new Date(fecha);
        cursor <= fin;
        cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
      ) {
        if (cursor.getDay() === diaSemana) {
          eventos.push({
            clase_id: claseGuardada.id,
            fecha: cursor.toISOString().split('T')[0],
            hora_inicio: claseGuardada.hora_inicio,
            hora_fin: claseGuardada.hora_fin,
          });
        }
      }

      const { error } = await supabase.from('eventos_clase').insert(eventos);
      if (error) return false;
      return true;
    } catch {
      return false;
    }
  };

  const sincronizarEventos = async (claseGuardada: ClaseData & { id: string }) => {
    try {
      let query = supabase
        .from('eventos_clase')
        .update({
          hora_inicio: claseGuardada.hora_inicio,
          hora_fin: claseGuardada.hora_fin,
        })
        .eq('clase_id', claseGuardada.id);
      query = query.neq('modificado_individualmente', true);
      const { error } = await query;
      if (error) return false;
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;

    setLoading(true);
    const payload = { ...datos };

    try {
      let claseGuardada: (ClaseData & { id: string }) | null = null;

      if (clase?.id) {
        const { error } = await supabase.from('clases').update(payload).eq('id', clase.id);
        if (error) throw error;
        claseGuardada = { ...clase, ...payload, id: clase.id };
      } else {
        const { data: claseData, error } = await supabase.from('clases').insert([payload]).select();
        if (error) throw error;
        claseGuardada = (claseData?.[0] as ClaseData & { id: string }) || null;
      }

      if (!claseGuardada) throw new Error('No se pudo obtener la clase guardada');

      if (!clase || clase.fecha_inicio !== datos.fecha_inicio || clase.fecha_fin !== datos.fecha_fin) {
        const ok = await generarEventos(claseGuardada);
        if (!ok) {
          alert('⚠️ Clase guardada pero hubo problemas generando algunos eventos');
          onSuccess();
          return;
        }
      } else {
        await sincronizarEventos(claseGuardada);
      }

      alert('✅ Clase guardada correctamente');
      onSuccess();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarClase = async () => {
    if (!clase?.id) return;
    if (!window.confirm(`¿Eliminar la clase "${clase.nombre}"?`)) return;
    setLoading(true);
    try {
      await supabase.from('asistencias').delete().eq('clase_id', clase.id);
      await supabase.from('alumnos_clases').delete().eq('clase_id', clase.id);
      await supabase.from('eventos_clase').delete().eq('clase_id', clase.id);
      const { error: claseError } = await supabase.from('clases').delete().eq('id', clase.id);
      if (claseError) throw claseError;
      alert('✅ Clase eliminada correctamente');
      onSuccess();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='card'>
      <h3 className='text-xl font-semibold text-gray-800 dark:text-dark-text mb-6 text-center'>
        {clase ? '✏️ Editar Clase' : '➕ Nueva Clase'}
      </h3>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6'>
        <div className='space-y-4'>
          <input type='text' name='nombre' value={datos.nombre} onChange={handleChange} required className='input w-full' placeholder='Nombre' />
          <select name='dia_semana' value={datos.dia_semana} onChange={handleChange} required className='input w-full'>
            <option value=''>Selecciona un día</option>
            <option value='Lunes'>Lunes</option><option value='Martes'>Martes</option><option value='Miércoles'>Miércoles</option>
            <option value='Jueves'>Jueves</option><option value='Viernes'>Viernes</option><option value='Sábado'>Sábado</option><option value='Domingo'>Domingo</option>
          </select>
          <div className='grid grid-cols-2 gap-3'>
            <input type='time' name='hora_inicio' value={datos.hora_inicio} onChange={handleChange} required className='input w-full' />
            <input type='time' name='hora_fin' value={datos.hora_fin} onChange={handleChange} required className='input w-full' />
          </div>
          <select name='nivel_clase' value={datos.nivel_clase} onChange={handleChange} className='input w-full'>
            <option value='Iniciación (1)'>Iniciación (1)</option><option value='Iniciación (2)'>Iniciación (2)</option>
            <option value='Medio (3)'>Medio (3)</option><option value='Medio (4)'>Medio (4)</option><option value='Avanzado (5)'>Avanzado (5)</option>
          </select>
          <SugerenciasHorarios nivel={datos.nivel_clase} onSeleccionarHorario={handleSeleccionarHorario} />
        </div>

        <div className='space-y-4'>
          <select name='tipo_clase' value={datos.tipo_clase} onChange={handleChange} className='input w-full'>
            <option value='grupal'>👥 Clase Grupal</option>
            <option value='particular'>🎯 Clase Particular</option>
          </select>
          <input type='date' name='fecha_inicio' value={datos.fecha_inicio} onChange={handleChange} required className='input w-full' />
          <input type='date' name='fecha_fin' value={datos.fecha_fin} onChange={handleChange} required className='input w-full' />
          <input type='text' name='profesor' value={datos.profesor} onChange={handleChange} className='input w-full' placeholder='Profesor' />
          <textarea name='observaciones' value={datos.observaciones} onChange={handleChange} className='input w-full' rows={4} />
        </div>
      </div>

      <div className='mt-8 flex justify-center gap-4'>
        <InlineLoadingButton type='submit' loading={loading} className='btn-primary px-6 py-2'>
          {clase ? 'Actualizar' : 'Crear'} Clase
        </InlineLoadingButton>
        {clase && (
          <button type='button' onClick={handleEliminarClase} disabled={loading} className='btn-danger px-6 py-2'>
            🗑️ Eliminar Clase
          </button>
        )}
      </div>
    </form>
  );
}
