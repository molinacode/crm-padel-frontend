import type { Tables } from '../../types/supabase';
import AvatarIniciales from '../AvatarIniciales';

type AlumnoRow = Tables<'alumnos'>;
type AlumnoFicha = AlumnoRow & {
  dias_disponibles?: string[];
  horarios_disponibles?: Array<{ hora_inicio?: string; hora_fin?: string }>;
  hora_inicio_disponible?: string;
  hora_fin_disponible?: string;
};

interface FichaAlumnoHeaderProps {
  alumno: AlumnoFicha | null;
  onEditar: () => void;
  onSeguimiento: () => void;
  onEliminar: () => void;
}

export default function FichaAlumnoHeader({
  alumno,
  onEditar,
  onSeguimiento,
  onEliminar,
}: FichaAlumnoHeaderProps) {
  if (!alumno) {
    return null;
  }

  return (
    <>
      <div className='flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8'>
        <AvatarIniciales
          nombre={alumno.nombre}
          fotoUrl={alumno.foto_url}
          className='w-32 h-32 rounded-full object-cover border-4 border-blue-100'
          textoClassName='text-3xl'
        />
        <div className='text-center md:text-left flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <h2 className='text-3xl font-bold text-gray-900 dark:text-dark-text'>
              {alumno.nombre || 'Sin nombre'}
            </h2>
            {alumno.activo === false && (
              <span className='px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700'>
                 INACTIVO
                {alumno.fecha_baja && (
                  <span className='ml-2 text-xs'>
                    (Baja: {new Date(alumno.fecha_baja).toLocaleDateString('es-ES')})
                  </span>
                )}
              </span>
            )}
          </div>
          <div className='space-y-1 text-gray-600 dark:text-dark-text2'>
            {alumno.email && <p> {alumno.email}</p>}
            {alumno.telefono && <p> {alumno.telefono}</p>}
            <p>
               Nivel:{' '}
              <span className='font-semibold text-blue-600 dark:text-blue-400'>
                {alumno.nivel || 'N/A'}
              </span>
            </p>
            <p>
               Estado:{' '}
              <span
                className={`font-semibold ${
                  alumno.activo === false
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              >
                {alumno.activo === false ? 'Inactivo' : 'Activo'}
              </span>
            </p>
          </div>

          {alumno.dias_disponibles &&
            Array.isArray(alumno.dias_disponibles) &&
            alumno.dias_disponibles.length > 0 && (
              <div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                <p className='text-sm font-medium text-blue-800 dark:text-blue-200 mb-2'>
                   Disponibilidad:
                </p>
                <div className='text-sm text-blue-700 dark:text-blue-300'>
                  <p>
                    <strong>Días:</strong> {alumno.dias_disponibles.join(', ')}
                  </p>
                  {alumno.horarios_disponibles &&
                  Array.isArray(alumno.horarios_disponibles) &&
                  alumno.horarios_disponibles.length > 0 ? (
                    <div className='mt-2'>
                      <p>
                        <strong>Horarios:</strong>
                      </p>
                      <ul className='list-disc list-inside ml-2 space-y-1'>
                        {alumno.horarios_disponibles.map((horario, index) => (
                          <li key={index}>
                            {horario?.hora_inicio || ''} -{' '}
                            {horario?.hora_fin || ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    alumno.hora_inicio_disponible &&
                    alumno.hora_fin_disponible && (
                      <p>
                        <strong>Horario:</strong>{' '}
                        {alumno.hora_inicio_disponible} -{' '}
                        {alumno.hora_fin_disponible}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}
        </div>

        <div className='flex flex-col gap-2'>
          <button
            type='button'
            onClick={onEditar}
            className='rounded-md bg-[#c9a658] px-3 py-2 text-sm font-semibold text-[#0e1410]'
          >
            Editar
          </button>
          <button
            type='button'
            onClick={onSeguimiento}
            className='rounded-md border border-[#2a332c] px-3 py-2 text-sm text-[#d8d2c4]'
          >
            Seguimiento
          </button>
          <button
            type='button'
            onClick={onEliminar}
            className='rounded-md px-3 py-2 text-sm text-red-300'
          >
            Eliminar
          </button>
        </div>
      </div>

      {alumno.activo === false && (
        <div className='my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg'>
          <div className='flex items-center gap-3'>
            
            <div>
              <h3 className='font-semibold text-red-800 dark:text-red-200'>
                Alumno Inactivo
              </h3>
              <p className='text-sm text-red-700 dark:text-red-300'>
                Este alumno está marcado como inactivo y ha sido desasignado
                automáticamente de todas las clases.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
