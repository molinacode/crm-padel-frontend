import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import GestorHorarios from './GestorHorarios';
import type { Json } from '../types/supabase';
import '../index.css';

interface HorarioDisponible {
  hora_inicio: string;
  hora_fin: string;
}

interface AlumnoEditable {
  id: string;
  nombre?: string | null;
  email?: string | null;
  telefono?: string | null;
  nivel?: string | null;
  activo?: boolean | null;
  foto_url?: string | null;
  fecha_baja?: string | null;
  disponibilidad?: {
    dias?: string[];
    horarios?: HorarioDisponible[];
  } | null;
  hora_inicio_disponible?: string | null;
  hora_fin_disponible?: string | null;
}

interface DatosAlumnoState {
  nombre: string;
  email: string;
  telefono: string;
  nivel: string;
  dias_disponibles: string[];
  horarios_disponibles: HorarioDisponible[];
  activo: boolean;
  fecha_baja: string | null;
  foto_url?: string | null;
}

interface EditarAlumnoProps {
  alumno: AlumnoEditable;
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function EditarAlumno({ alumno, onCancel, onSuccess }: EditarAlumnoProps) {
  const [datosAlumno, setDatosAlumno] = useState<DatosAlumnoState>({
    nombre: '',
    email: '',
    telefono: '',
    nivel: 'Iniciación (1)',
    dias_disponibles: [],
    horarios_disponibles: [],
    activo: true,
    fecha_baja: null,
    foto_url: null,
  });

  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(alumno?.foto_url || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!alumno) return undefined;
    return scheduleEffectWork(() => {
      const disp = alumno.disponibilidad || {};
      let horariosDisponibles = disp.horarios || [];
      if (alumno.hora_inicio_disponible && alumno.hora_fin_disponible && horariosDisponibles.length === 0) {
        horariosDisponibles = [{ hora_inicio: alumno.hora_inicio_disponible, hora_fin: alumno.hora_fin_disponible }];
      }

      setDatosAlumno({
        nombre: alumno.nombre || '',
        email: alumno.email || '',
        telefono: alumno.telefono || '',
        nivel: alumno.nivel || 'Iniciación (1)',
        dias_disponibles: disp.dias || [],
        horarios_disponibles: horariosDisponibles,
        activo: alumno.activo !== false,
        fecha_baja: alumno.fecha_baja || null,
        foto_url: alumno.foto_url || null,
      });
      setVistaPrevia(alumno.foto_url || null);
    });
  }, [alumno]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'dias_disponibles' && e.target instanceof HTMLSelectElement) {
      const selectedValues: string[] = [];
      for (let i = 0; i < e.target.options.length; i++) {
        if (e.target.options[i].selected) selectedValues.push(e.target.options[i].value);
      }
      setDatosAlumno(prev => ({ ...prev, dias_disponibles: selectedValues }));
      return;
    }

    if (name === 'activo') {
      setDatosAlumno(prev => ({ ...prev, activo: value === 'true' }));
      return;
    }

    setDatosAlumno(prev => ({ ...prev, [name]: value }));
  };

  const handleHorariosChange = (horarios: HorarioDisponible[]) => {
    setDatosAlumno(prev => ({ ...prev, horarios_disponibles: horarios }));
  };

  const handleFotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      setVistaPrevia(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fotoUrl = datosAlumno.foto_url || null;

      if (foto) {
        const fileName = `alumno_${Date.now()}`;
        const { error: uploadError } = await supabase.storage.from('fotos-alumnos').upload(fileName, foto);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('fotos-alumnos').getPublicUrl(fileName);
        fotoUrl = publicUrl;
      }

      const payload = {
        nombre: datosAlumno.nombre,
        email: datosAlumno.email,
        telefono: datosAlumno.telefono,
        nivel: datosAlumno.nivel,
        activo: datosAlumno.activo,
        foto_url: fotoUrl,
        updated_at: new Date().toISOString(),
        disponibilidad: {
          dias: datosAlumno.dias_disponibles,
          horarios: datosAlumno.horarios_disponibles.map(h => ({
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
          })),
        } as Json,
        fecha_baja: datosAlumno.activo ? null : datosAlumno.fecha_baja,
      };

      const { error: updateError } = await supabase.from('alumnos').update(payload).eq('id', alumno.id);
      if (updateError) throw updateError;
      alert('✅ Alumno actualizado correctamente');
      onSuccess?.();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al actualizar el alumno: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-30 z-50 flex items-center justify-center p-4'>
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <h3 className='text-2xl font-semibold mb-4'>✏️ Editar Alumno</h3>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {vistaPrevia && <img src={vistaPrevia} alt='Vista previa' className='w-20 h-20 rounded-full object-cover' />}
            <input type='file' accept='image/*' onChange={handleFotoChange} className='text-sm' />
            <input type='text' name='nombre' value={datosAlumno.nombre} onChange={handleChange} required className='input' />
            <input type='text' name='telefono' value={datosAlumno.telefono} onChange={handleChange} required className='input' />
            <input type='email' name='email' value={datosAlumno.email} onChange={handleChange} className='input' />
            <select name='nivel' value={datosAlumno.nivel} onChange={handleChange} className='input'>
              <option value='Iniciación (1)'>Iniciación (1)</option>
              <option value='Iniciación (2)'>Iniciación (2)</option>
              <option value='Medio (3)'>Medio (3)</option>
              <option value='Medio (4)'>Medio (4)</option>
              <option value='Avanzado (5)'>Avanzado (5)</option>
            </select>
            <select name='activo' value={String(datosAlumno.activo)} onChange={handleChange} className='input'>
              <option value='true'>✅ Activo</option>
              <option value='false'>❌ Inactivo</option>
            </select>
            {!datosAlumno.activo && (
              <input
                type='date'
                value={datosAlumno.fecha_baja || ''}
                onChange={e => setDatosAlumno(prev => ({ ...prev, fecha_baja: e.target.value || null }))}
                className='input'
              />
            )}
            <select
              name='dias_disponibles'
              value={datosAlumno.dias_disponibles}
              onChange={handleChange}
              multiple
              className='input'
              size={7}
            >
              <option value='Lunes'>Lunes</option>
              <option value='Martes'>Martes</option>
              <option value='Miércoles'>Miércoles</option>
              <option value='Jueves'>Jueves</option>
              <option value='Viernes'>Viernes</option>
              <option value='Sábado'>Sábado</option>
              <option value='Domingo'>Domingo</option>
            </select>
            <GestorHorarios horarios={datosAlumno.horarios_disponibles} onChange={handleHorariosChange} />
            <div className='flex gap-3 pt-4'>
              <button type='submit' className='btn-primary flex-1' disabled={loading}>
                {loading ? '⏳ Actualizando...' : '✅ Actualizar Alumno'}
              </button>
              <button type='button' className='btn-secondary flex-1' onClick={onCancel} disabled={loading}>
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
