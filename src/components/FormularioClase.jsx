import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import SugerenciasHorarios from './SugerenciasHorarios';
import { InlineLoadingButton } from './LoadingSpinner';

export default function FormularioClase({ clase, onSuccess }) {
  const [datos, setDatos] = useState({
    nombre: '',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
    nivel_clase: 'Iniciación (1)',
    profesor: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_clase: 'grupal', // 'grupal' o 'particular'
    observaciones: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Funciones de validación
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!datos.nombre.trim()) {
      newErrors.nombre = 'El nombre de la clase es obligatorio';
    }

    // Validar día de la semana
    if (!datos.dia_semana) {
      newErrors.dia_semana = 'Debe seleccionar un día de la semana';
    }

    // Validar horarios
    if (!datos.hora_inicio) {
      newErrors.hora_inicio = 'Debe seleccionar una hora de inicio';
    }
    if (!datos.hora_fin) {
      newErrors.hora_fin = 'Debe seleccionar una hora de fin';
    }
    if (
      datos.hora_inicio &&
      datos.hora_fin &&
      datos.hora_inicio >= datos.hora_fin
    ) {
      newErrors.hora_fin =
        'La hora de fin debe ser posterior a la hora de inicio';
    }

    // Validar fechas
    if (!datos.fecha_inicio) {
      newErrors.fecha_inicio = 'Debe seleccionar una fecha de inicio';
    }
    if (!datos.fecha_fin) {
      newErrors.fecha_fin = 'Debe seleccionar una fecha de fin';
    }
    if (
      datos.fecha_inicio &&
      datos.fecha_fin &&
      datos.fecha_inicio > datos.fecha_fin
    ) {
      newErrors.fecha_fin =
        'La fecha de fin debe ser posterior a la fecha de inicio';
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

  const handleChange = e => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleSeleccionarHorario = horario => {
    setDatos(prev => ({
      ...prev,
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Limpiar errores previos
    setErrors({});

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const payload = { ...datos };

    let claseGuardada;
    let claseError;

    try {
      if (clase) {
        const { error } = await supabase
          .from('clases')
          .update(payload)
          .eq('id', clase.id);
        claseError = error;
        claseGuardada = { ...clase, ...payload };
      } else {
        const { data: claseData, error } = await supabase
          .from('clases')
          .insert([payload])
          .select();
        claseError = error;
        claseGuardada = claseData?.[0] || null;
      }

      if (claseError) {
        throw new Error('Error al guardar clase: ' + claseError.message);
      }

      // Si es nueva clase o cambian fechas, genera eventos
      if (
        !clase ||
        clase.fecha_inicio !== datos.fecha_inicio ||
        clase.fecha_fin !== datos.fecha_fin
      ) {
        if (claseGuardada) {
          const eventosGenerados = await generarEventos(claseGuardada);
          if (!eventosGenerados) {
            alert(
              '⚠️ Clase guardada pero hubo problemas generando algunos eventos'
            );
            onSuccess();
            return;
          }
        } else {
          throw new Error('No se pudo obtener la clase guardada');
        }
      } else if (clase) {
        // Si es modificación de clase existente, sincronizar eventos
        await sincronizarEventos(claseGuardada);
      }

      alert('✅ Clase guardada correctamente');
      onSuccess();
    } catch (error) {
      console.error('Error guardando clase:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const generarEventos = async claseGuardada => {
    try {
      const eventos = [];
      let fecha = new Date(claseGuardada.fecha_inicio);
      const fin = new Date(claseGuardada.fecha_fin);

      const dias = {
        Lunes: 1,
        Martes: 2,
        Miércoles: 3,
        Jueves: 4,
        Viernes: 5,
        Sábado: 6,
        Domingo: 0,
      };
      const diaSemana = dias[claseGuardada.dia_semana];

      while (fecha <= fin) {
        if (fecha.getDay() === diaSemana) {
          eventos.push({
            clase_id: claseGuardada.id,
            fecha: fecha.toISOString().split('T')[0],
            hora_inicio: claseGuardada.hora_inicio,
            hora_fin: claseGuardada.hora_fin,
          });
        }
        fecha.setDate(fecha.getDate() + 1);
      }

      const { error } = await supabase.from('eventos_clase').insert(eventos);
      if (error) {
        console.error('Error generando eventos:', error);
        alert('❌ Error al crear los eventos de la clase');
        return false;
      }

      console.log(`✅ Se generaron ${eventos.length} eventos para la clase`);
      return true;
    } catch (error) {
      console.error('Error inesperado generando eventos:', error);
      alert('❌ Error inesperado al crear los eventos');
      return false;
    }
  };

  // Función para sincronizar eventos cuando se modifica una clase existente
  const sincronizarEventos = async claseGuardada => {
    try {
      // Actualizar los horarios de todos los eventos existentes de esta clase
      // EXCEPTO los que han sido modificados individualmente (si el campo existe)
      let query = supabase
        .from('eventos_clase')
        .update({
          hora_inicio: claseGuardada.hora_inicio,
          hora_fin: claseGuardada.hora_fin,
        })
        .eq('clase_id', claseGuardada.id);

      // Intentar excluir eventos modificados individualmente si el campo existe
      try {
        query = query.neq('modificado_individualmente', true);
      } catch {
        console.warn(
          '⚠️ Campo "modificado_individualmente" no disponible, sincronizando todos los eventos'
        );
      }

      const { error } = await query;

      if (error) {
        console.error('Error sincronizando eventos:', error);
        alert('⚠️ Clase guardada pero hubo problemas actualizando los eventos');
        return false;
      }

      console.log(
        '✅ Eventos sincronizados correctamente (excluyendo modificados individualmente)'
      );
      return true;
    } catch (error) {
      console.error('Error inesperado sincronizando eventos:', error);
      alert('❌ Error inesperado al sincronizar los eventos');
      return false;
    }
  };

  // Función para eliminar una clase completa y limpiar eventos relacionados
  const handleEliminarClase = async () => {
    if (!clase) return;

    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres eliminar la clase "${clase.nombre}"?\n\nEsta acción eliminará:\n- La clase y todos sus eventos\n- Todas las asignaciones de alumnos\n- Todas las asistencias relacionadas\n\nEsta acción NO se puede deshacer.`
    );

    if (!confirmacion) return;

    setLoading(true);

    try {
      // 1. Eliminar asistencias relacionadas
      const { error: asistenciasError } = await supabase
        .from('asistencias')
        .delete()
        .eq('clase_id', clase.id);

      if (asistenciasError) {
        console.error('Error eliminando asistencias:', asistenciasError);
        // Continuar aunque falle
      }

      // 2. Eliminar asignaciones de alumnos
      const { error: alumnosError } = await supabase
        .from('alumnos_clases')
        .delete()
        .eq('clase_id', clase.id);

      if (alumnosError) {
        console.error('Error eliminando asignaciones:', alumnosError);
        // Continuar aunque falle
      }

      // 3. Eliminar eventos relacionados
      const { error: eventosError } = await supabase
        .from('eventos_clase')
        .delete()
        .eq('clase_id', clase.id);

      if (eventosError) {
        console.error('Error eliminando eventos:', eventosError);
        // Continuar aunque falle
      }

      // 4. Eliminar la clase
      const { error: claseError } = await supabase
        .from('clases')
        .delete()
        .eq('id', clase.id);

      if (claseError) {
        throw new Error('Error al eliminar la clase: ' + claseError.message);
      }

      alert('✅ Clase eliminada correctamente');
      onSuccess();
    } catch (error) {
      console.error('Error eliminando clase:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='card'>
      <h3 className='text-xl font-semibold text-gray-800 dark:text-dark-text mb-6 text-center'>
        {clase ? '✏️ Editar Clase' : '➕ Nueva Clase'}
      </h3>

      {/* Grid responsive: una columna en móviles, dos en desktop */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6'>
        {/* Columna Izquierda */}
        <div className='space-y-4'>
          {/* Nombre */}
          <div>
            <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-dark-text2'>
              📚 Nombre *
            </label>
            <input
              type='text'
              name='nombre'
              value={datos.nombre}
              onChange={handleChange}
              required
              className={`input w-full ${errors.nombre ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder='Grupo Avanzado'
            />
            {errors.nombre && (
              <p className='text-red-500 text-sm mt-1'>{errors.nombre}</p>
            )}
          </div>

          {/* Día de la semana */}
          <div>
            <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-dark-text2'>
              📅 Día *
            </label>
            <select
              name='dia_semana'
              value={datos.dia_semana}
              onChange={handleChange}
              required
              className={`input w-full ${errors.dia_semana ? 'border-red-500 focus:ring-red-500' : ''}`}
            >
              <option value=''>Selecciona un día</option>
              <option value='Lunes'>Lunes</option>
              <option value='Martes'>Martes</option>
              <option value='Miércoles'>Miércoles</option>
              <option value='Jueves'>Jueves</option>
              <option value='Viernes'>Viernes</option>
              <option value='Sábado'>Sábado</option>
              <option value='Domingo'>Domingo</option>
            </select>
            {errors.dia_semana && (
              <p className='text-red-500 text-sm mt-1'>{errors.dia_semana}</p>
            )}
          </div>

          {/* Horarios */}
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                🕐 Hora inicio *
              </label>
              <input
                type='time'
                name='hora_inicio'
                value={datos.hora_inicio}
                onChange={handleChange}
                required
                className={`input w-full ${errors.hora_inicio ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.hora_inicio && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.hora_inicio}
                </p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                🕐 Hora fin *
              </label>
              <input
                type='time'
                name='hora_fin'
                value={datos.hora_fin}
                onChange={handleChange}
                required
                className={`input w-full ${errors.hora_fin ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.hora_fin && (
                <p className='text-red-500 text-sm mt-1'>{errors.hora_fin}</p>
              )}
            </div>
          </div>

          {/* Nivel */}
          <div>
            <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-dark-text2'>
              🎯 Nivel *
            </label>
            <select
              name='nivel_clase'
              value={datos.nivel_clase}
              onChange={handleChange}
              className='input w-full'
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

          {/* Sugerencias de horarios */}
          <div>
            <SugerenciasHorarios
              nivel={datos.nivel_clase}
              onSeleccionarHorario={handleSeleccionarHorario}
            />
          </div>
        </div>

        {/* Columna Derecha */}
        <div className='space-y-4'>
          {/* Tipo de Clase */}
          <div>
            <label className='block text-sm font-semibold mb-2.5 text-gray-900 dark:text-white tracking-tight'>
              👥 Tipo de Clase *
            </label>
            <select
              name='tipo_clase'
              value={datos.tipo_clase}
              onChange={handleChange}
              className='w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200 dark:bg-dark-surface2 dark:text-white'
            >
              <option value='grupal'>👥 Clase Grupal (hasta 4 alumnos)</option>
              <option value='particular'>🎯 Clase Particular (1 alumno)</option>
            </select>
          </div>

          {/* Fechas */}
          <div className='grid grid-cols-1 gap-3'>
            <div>
              <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                📅 Fecha inicio *
              </label>
              <input
                type='date'
                name='fecha_inicio'
                value={datos.fecha_inicio}
                onChange={handleChange}
                required
                className={`input w-full ${errors.fecha_inicio ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.fecha_inicio && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.fecha_inicio}
                </p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-dark-text2'>
                📅 Fecha fin *
              </label>
              <input
                type='date'
                name='fecha_fin'
                value={datos.fecha_fin}
                onChange={handleChange}
                required
                className={`input w-full ${errors.fecha_fin ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.fecha_fin && (
                <p className='text-red-500 text-sm mt-1'>{errors.fecha_fin}</p>
              )}
            </div>
          </div>

          {/* Profesor */}
          <div>
            <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-dark-text2'>
              👨‍🏫 Profesor
            </label>
            <input
              type='text'
              name='profesor'
              value={datos.profesor}
              onChange={handleChange}
              className='input w-full'
              placeholder='Vivi'
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-dark-text2'>
              📝 Observaciones
            </label>
            <textarea
              name='observaciones'
              value={datos.observaciones}
              onChange={handleChange}
              className='input w-full'
              placeholder='Notas adicionales sobre la clase...'
              rows='4'
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className='mt-8 flex justify-center gap-4'>
        <InlineLoadingButton
          type='submit'
          loading={loading}
          className='btn-primary px-6 py-2'
        >
          {clase ? 'Actualizar' : 'Crear'} Clase
        </InlineLoadingButton>

        {clase && (
          <button
            type='button'
            onClick={handleEliminarClase}
            disabled={loading}
            className='btn-danger px-6 py-2'
          >
            🗑️ Eliminar Clase
          </button>
        )}
      </div>
    </form>
  );
}
