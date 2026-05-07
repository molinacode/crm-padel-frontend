import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import GestorHorarios from './GestorHorarios';
import { InlineLoadingButton } from './LoadingSpinner';
import '../index.css';

interface HorarioDisponible {
  hora_inicio: string;
  hora_fin: string;
}

interface NuevoAlumnoState {
  nombre: string;
  email: string;
  telefono: string;
  nivel: string;
  dias_disponibles: string[];
  horarios_disponibles: HorarioDisponible[];
  activo: boolean;
  observaciones?: string;
}

interface FormularioAlumnoProps {
  onCancel?: () => void;
}

export default function FormularioAlumno({ onCancel }: FormularioAlumnoProps) {
  const [nuevoAlumno, setNuevoAlumno] = useState<NuevoAlumnoState>({
    nombre: '',
    email: '',
    telefono: '',
    nivel: 'Iniciación (1)',
    dias_disponibles: [],
    horarios_disponibles: [],
    activo: true,
  });

  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!nuevoAlumno.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!nuevoAlumno.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
    if (nuevoAlumno.dias_disponibles.length === 0) {
      newErrors.dias_disponibles = 'Debe seleccionar al menos un día disponible';
    }
    if (nuevoAlumno.horarios_disponibles.length === 0) {
      newErrors.horarios_disponibles = 'Debe agregar al menos un horario disponible';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'dias_disponibles' && e.target instanceof HTMLSelectElement) {
      const selectedValues: string[] = [];
      for (let i = 0; i < e.target.options.length; i++) {
        if (e.target.options[i].selected) selectedValues.push(e.target.options[i].value);
      }
      setNuevoAlumno(prev => ({ ...prev, dias_disponibles: selectedValues }));
      return;
    }

    if (name === 'activo') {
      setNuevoAlumno(prev => ({ ...prev, activo: value === 'true' }));
      return;
    }

    setNuevoAlumno(prev => ({ ...prev, [name]: value }));
  };

  const handleHorariosChange = (horarios: HorarioDisponible[]) => {
    setNuevoAlumno(prev => ({ ...prev, horarios_disponibles: horarios }));
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
    setErrors({});
    if (!validateForm()) return;

    setLoading(true);
    try {
      let fotoUrl: string | null = null;

      if (foto) {
        const fileName = `alumno_${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('fotos-alumnos')
          .upload(fileName, foto);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('fotos-alumnos').getPublicUrl(fileName);
        fotoUrl = data.publicUrl;
      }

      const payload = {
        ...nuevoAlumno,
        foto_url: fotoUrl,
        nombre: nuevoAlumno.nombre.trim(),
        telefono: nuevoAlumno.telefono.trim(),
        email: nuevoAlumno.email?.trim() || null,
        observaciones: nuevoAlumno.observaciones || null,
        disponibilidad: {
          dias: nuevoAlumno.dias_disponibles,
          horarios: nuevoAlumno.horarios_disponibles,
        },
      };

      const { dias_disponibles, horarios_disponibles, ...dbPayload } = payload;
      void dias_disponibles;
      void horarios_disponibles;

      const { error: insertError } = await supabase.from('alumnos').insert([dbPayload]);
      if (insertError) throw insertError;

      alert('✅ Alumno creado correctamente');
      onCancel?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      alert(`❌ Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='bg-white dark:bg-dark-surface rounded-3xl p-8'>
      {vistaPrevia && (
        <div className='text-center mb-8'>
          <img src={vistaPrevia} alt='Vista previa' className='w-32 h-32 rounded-full object-cover mx-auto' />
        </div>
      )}

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <input type='file' accept='image/*' onChange={handleFotoChange} className='text-sm w-full' />
          <input type='text' name='nombre' value={nuevoAlumno.nombre} onChange={handleChange} required className='input w-full' placeholder='Nombre' />
          {errors.nombre && <p className='text-red-500 text-sm'>{errors.nombre}</p>}
          <input type='text' name='telefono' value={nuevoAlumno.telefono} onChange={handleChange} required className='input w-full' placeholder='Teléfono' />
          <input type='email' name='email' value={nuevoAlumno.email} onChange={handleChange} className='input w-full' placeholder='Email' />
          <select name='nivel' value={nuevoAlumno.nivel} onChange={handleChange} className='input w-full'>
            <option value='Iniciación (1)'>Iniciación (1)</option>
            <option value='Iniciación (2)'>Iniciación (2)</option>
            <option value='Medio (3)'>Medio (3)</option>
            <option value='Medio (4)'>Medio (4)</option>
            <option value='Avanzado (5)'>Avanzado (5)</option>
            <option value='Infantil (1)'>Infantil (1)</option>
            <option value='Infantil (2)'>Infantil (2)</option>
            <option value='Infantil (3)'>Infantil (3)</option>
          </select>
          <select name='activo' value={String(nuevoAlumno.activo)} onChange={handleChange} className='input w-full'>
            <option value='true'>✅ Activo</option>
            <option value='false'>❌ Inactivo</option>
          </select>
        </div>

        <div className='space-y-4'>
          <select
            name='dias_disponibles'
            value={nuevoAlumno.dias_disponibles}
            onChange={handleChange}
            multiple
            className='input w-full'
            size={6}
          >
            <option value='Lunes'>Lunes</option>
            <option value='Martes'>Martes</option>
            <option value='Miércoles'>Miércoles</option>
            <option value='Jueves'>Jueves</option>
            <option value='Viernes'>Viernes</option>
            <option value='Sábado'>Sábado</option>
            <option value='Domingo'>Domingo</option>
          </select>
          {errors.dias_disponibles && <p className='text-red-500 text-sm'>{errors.dias_disponibles}</p>}
          <GestorHorarios horarios={nuevoAlumno.horarios_disponibles} onChange={handleHorariosChange} />
          {errors.horarios_disponibles && <p className='text-red-500 text-sm'>{errors.horarios_disponibles}</p>}
        </div>
      </div>

      <div className='mt-10 flex justify-center gap-4'>
        <InlineLoadingButton type='submit' loading={loading} className='btn-primary px-8 py-3'>
          Agregar Alumno
        </InlineLoadingButton>
        <button type='button' className='btn-secondary px-8 py-3' onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
