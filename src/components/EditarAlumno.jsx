import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GestorHorarios from './GestorHorarios';
import '../index.css';

export default function EditarAlumno({ alumno, onCancel, onSuccess }) {
  const [datosAlumno, setDatosAlumno] = useState({
    nombre: '',
    email: '',
    telefono: '',
    nivel: 'Iniciación (1)',
    dias_disponibles: [],
    horarios_disponibles: [],
    activo: true,
  });

  const [foto, setFoto] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(alumno?.foto_url || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (alumno) {
      // Leer disponibilidad desde la columna JSONB
      const disp = alumno.disponibilidad || {};
      let horariosDisponibles = disp.horarios || [];

      // Si tiene horarios en el formato antiguo, convertirlos (solo si es necesario)
      if (
        alumno.hora_inicio_disponible &&
        alumno.hora_fin_disponible &&
        horariosDisponibles.length === 0
      ) {
        horariosDisponibles = [
          {
            hora_inicio: alumno.hora_inicio_disponible,
            hora_fin: alumno.hora_fin_disponible,
          },
        ];
      }

      setDatosAlumno({
        nombre: alumno.nombre || '',
        email: alumno.email || '',
        telefono: alumno.telefono || '',
        nivel: alumno.nivel || 'Iniciación (1)',
        dias_disponibles: disp.dias || [],
        horarios_disponibles: horariosDisponibles,
        activo: alumno.activo !== undefined ? alumno.activo : true,
      });
      setVistaPrevia(alumno.foto_url || null);
    }
  }, [alumno]);

  const handleChange = e => {
    const { name, value } = e.target;

    if (name === 'nivel') {
      setDatosAlumno(prev => ({
        ...prev,
        nivel: value,
      }));
      return;
    }

    if (name === 'dias_disponibles') {
      // Manejo más robusto para dispositivos móviles
      const selectElement = e.target;
      const selectedValues = [];

      // Obtener valores seleccionados de manera compatible con móvil
      for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].selected) {
          selectedValues.push(selectElement.options[i].value);
        }
      }

      setDatosAlumno(prev => ({ ...prev, [name]: selectedValues }));
      return;
    }

    setDatosAlumno(prev => ({ ...prev, [name]: value }));
  };

  const handleHorariosChange = horarios => {
    setDatosAlumno(prev => ({ ...prev, horarios_disponibles: horarios }));
  };

  const handleFotoChange = e => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setVistaPrevia(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      let fotoUrl = datosAlumno.foto_url;

      if (foto) {
        const fileName = `alumno_${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('fotos-alumnos')
          .upload(fileName, foto);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('fotos-alumnos').getPublicUrl(fileName);

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
          horarios: datosAlumno.horarios_disponibles,
        },
      };

      const { error: updateError } = await supabase
        .from('alumnos')
        .update(payload)
        .eq('id', alumno.id);

      if (updateError) throw updateError;

      // Antes: si el alumno pasaba a inactivo se eliminaban todas sus asignaciones de clases.
      // Ahora: solo marcamos el estado como inactivo para conservar el historial
      // (clases, pagos y asistencias quedan registrados para consulta histórica).

      if (datosAlumno.activo === false && alumno.activo === true) {
        console.log('🔄 Alumno marcado como inactivo (se conserva historial).');
        alert('✅ Alumno actualizado y marcado como inactivo (historial conservado)');
      } else {
        alert('✅ Alumno actualizado correctamente');
      }

      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error actualizando alumno:', error);
      alert('❌ Error al actualizar el alumno: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-30 z-50 flex items-center justify-center p-4'>
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-2xl font-semibold text-gray-900 dark:text-dark-text'>
              ✏️ Editar Alumno
            </h3>
            <button
              onClick={onCancel}
              className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Foto */}
            <div>
              <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                Foto
              </label>
              {vistaPrevia && (
                <img
                  src={vistaPrevia}
                  alt='Vista previa'
                  className='w-20 h-20 rounded-full object-cover mb-2 border-2 border-gray-200 dark:border-dark-border'
                />
              )}
              <input
                type='file'
                accept='image/*'
                onChange={handleFotoChange}
                className='text-sm'
              />
            </div>

            {/* Información básica */}
            <div className='grid md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                  Nombre *
                </label>
                <input
                  type='text'
                  name='nombre'
                  value={datosAlumno.nombre}
                  onChange={handleChange}
                  required
                  className='input'
                  placeholder='Ej: Ana López'
                />
              </div>

              <div>
                <label className='block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                  Teléfono *
                </label>
                <input
                  type='text'
                  name='telefono'
                  value={datosAlumno.telefono}
                  onChange={handleChange}
                  required
                  className='input'
                  placeholder='Ej: +54 9 11 1234 5678'
                />
              </div>
            </div>

            <div>
              <label className='block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                Email
              </label>
              <input
                type='email'
                name='email'
                value={datosAlumno.email}
                onChange={handleChange}
                className='input'
                placeholder='ana@ejemplo.com'
              />
            </div>

            <div>
              <label className='block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                Nivel
              </label>
              <select
                name='nivel'
                value={datosAlumno.nivel}
                onChange={handleChange}
                className='input'
              >
                <option value='Iniciación (1)'>Iniciación (1)</option>
                <option value='Iniciación (2)'>Iniciación (2)</option>
                <option value='Medio (3)'>Medio (3)</option>
                <option value='Medio (4)'>Medio (4)</option>
                <option value='Avanzado (5)'>Avanzado (5)</option>
                <option value='Infantil (1)'>Infantil (1)</option>
                <option value='Infantil (2)'>Infantil (2)</option>
                <option value='Infantil (3)'>Infantil (3)</option>
              </select>
            </div>

            <div>
              <label className='block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                Estado
              </label>
              <select
                name='activo'
                value={datosAlumno.activo}
                onChange={handleChange}
                className='input'
              >
                <option value={true}>✅ Activo</option>
                <option value={false}>❌ Inactivo</option>
              </select>
            </div>

            {/* Disponibilidad */}
            <div>
              <h3 className='text-lg font-semibold text-gray-800 dark:text-dark-text mb-4'>
                📅 Disponibilidad
              </h3>
            </div>

            <div>
              <label className='block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                Días Disponibles
              </label>
              <select
                name='dias_disponibles'
                value={datosAlumno.dias_disponibles}
                onChange={handleChange}
                multiple
                className='input'
                size='7'
              >
                <option value='Lunes'>Lunes</option>
                <option value='Martes'>Martes</option>
                <option value='Miércoles'>Miércoles</option>
                <option value='Jueves'>Jueves</option>
                <option value='Viernes'>Viernes</option>
                <option value='Sábado'>Sábado</option>
                <option value='Domingo'>Domingo</option>
              </select>
              <p className='text-xs text-gray-500 dark:text-dark-text2 mt-1'>
                Mantén presionado Ctrl para seleccionar múltiples días
              </p>
            </div>

            {/* Gestor de múltiples horarios */}
            <GestorHorarios
              horarios={datosAlumno.horarios_disponibles}
              onChange={handleHorariosChange}
            />

            {/* Botones */}
            <div className='flex gap-3 pt-4'>
              <button
                type='submit'
                className='btn-primary flex-1'
                disabled={loading}
              >
                {loading ? '⏳ Actualizando...' : '✅ Actualizar Alumno'}
              </button>
              <button
                type='button'
                className='btn-secondary flex-1'
                onClick={onCancel}
                disabled={loading}
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
