import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';

export default function FormularioProfesor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    especialidad: 'Pádel',
    nivel_experiencia: 'Intermedio',
    activo: true,
    fecha_nacimiento: '',
    direccion: '',
    observaciones: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);

  const cargarProfesor = useCallback(async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('profesores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          nombre: data.nombre || '',
          apellidos: data.apellidos || '',
          email: data.email || '',
          telefono: data.telefono || '',
          especialidad: data.especialidad || 'Pádel',
          nivel_experiencia: data.nivel_experiencia || 'Intermedio',
          activo: data.activo !== false,
          fecha_nacimiento: data.fecha_nacimiento || '',
          direccion: data.direccion || '',
          observaciones: data.observaciones || '',
        });
      }
    } catch (error) {
      console.error('Error cargando profesor:', error);
      alert('Error al cargar los datos del profesor');
    } finally {
      setLoadingData(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isEditing) return undefined;
    return scheduleEffectWork(() => {
      void cargarProfesor();
    });
  }, [isEditing, cargarProfesor]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar datos para envío - convertir campos vacíos a null
      const datosParaEnviar = {
        ...formData,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        observaciones: formData.observaciones || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('profesores')
          .update(datosParaEnviar)
          .eq('id', id);

        if (error) throw error;
        alert('Profesor actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('profesores')
          .insert([datosParaEnviar]);

        if (error) throw error;
        alert('Profesor creado correctamente');
      }

      navigate('/profesores');
    } catch (error) {
      console.error('Error guardando profesor:', error);
      alert('Error al guardar el profesor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className='flex items-center justify-center min-h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-dark-text2'>
            Cargando datos del profesor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-dark-text'>
            {isEditing ? '✏️ Editar Profesor' : '➕ Nuevo Profesor'}
          </h2>
          <p className='text-gray-600 dark:text-dark-text2 mt-1'>
            {isEditing
              ? 'Modifica los datos del profesor'
              : 'Completa la información del nuevo profesor'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Información Personal */}
          <div className='bg-gray-50 dark:bg-dark-surface2 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text mb-4'>
              👤 Información Personal
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                  Nombre *
                </label>
                <input
                  type='text'
                  name='nombre'
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                  Apellidos *
                </label>
                <input
                  type='text'
                  name='apellidos'
                  value={formData.apellidos}
                  onChange={handleChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                  Fecha de Nacimiento
                </label>
                <input
                  type='date'
                  name='fecha_nacimiento'
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                  Teléfono *
                </label>
                <input
                  type='tel'
                  name='telefono'
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                />
              </div>
            </div>
            <div className='mt-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Dirección
              </label>
              <textarea
                name='direccion'
                value={formData.direccion}
                onChange={handleChange}
                rows={2}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
          </div>

          {/* Información de Contacto */}
          <div className='bg-gray-50 dark:bg-dark-surface2 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              📧 Información de Contacto
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                  Email *
                </label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                />
              </div>
            </div>
          </div>

          {/* Información Profesional */}
          <div className='bg-gray-50 dark:bg-dark-surface2 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              🏆 Información Profesional
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                  Especialidad
                </label>
                <select
                  name='especialidad'
                  value={formData.especialidad}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                >
                  <option value='Pádel'>Pádel</option>
                  <option value='Tenis'>Tenis</option>
                  <option value='Fitness'>Fitness</option>
                  <option value='Rehabilitación'>Rehabilitación</option>
                  <option value='Otro'>Otro</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                  Nivel de Experiencia
                </label>
                <select
                  name='nivel_experiencia'
                  value={formData.nivel_experiencia}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                >
                  <option value='Principiante'>Principiante</option>
                  <option value='Intermedio'>Intermedio</option>
                  <option value='Avanzado'>Avanzado</option>
                  <option value='Profesional'>Profesional</option>
                </select>
              </div>
            </div>
            <div className='mt-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Observaciones
              </label>
              <textarea
                name='observaciones'
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
                placeholder='Notas adicionales sobre el profesor...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
          </div>

          {/* Estado */}
          <div className='bg-gray-50 dark:bg-dark-surface2 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              ⚙️ Estado
            </h3>
            <div className='flex items-center'>
              <input
                type='checkbox'
                name='activo'
                checked={formData.activo}
                onChange={handleChange}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='ml-2 text-sm font-medium text-gray-700'>
                Profesor activo
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className='flex justify-end space-x-4 pt-6 border-t border-gray-200'>
            <button
              type='button'
              onClick={() => navigate('/profesores')}
              className='btn-secondary px-6 py-2'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={loading}
              className='btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
