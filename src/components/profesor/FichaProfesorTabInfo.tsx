import type { Tables } from '../../types/supabase';

type Profesor = Tables<'profesores'>;

interface FichaProfesorTabInfoProps {
  profesor: Profesor;
  calcularEdad: (fecha: string | null) => number;
}

export default function FichaProfesorTabInfo({
  profesor,
  calcularEdad,
}: FichaProfesorTabInfoProps) {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-gray-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            👤 Información Personal
          </h3>
          <div className='space-y-3'>
            <div>
              <span className='text-sm font-medium text-gray-500'>
                Nombre completo:
              </span>
              <p className='text-gray-900'>
                {profesor.nombre} {profesor.apellidos}
              </p>
            </div>
            <div>
              <span className='text-sm font-medium text-gray-500'>Edad:</span>
              <p className='text-gray-900'>
                {calcularEdad(profesor.fecha_nacimiento)} años
              </p>
            </div>
            <div>
              <span className='text-sm font-medium text-gray-500'>
                Teléfono:
              </span>
              <p className='text-gray-900'>
                {profesor.telefono || 'No especificado'}
              </p>
            </div>
            <div>
              <span className='text-sm font-medium text-gray-500'>Email:</span>
              <p className='text-gray-900'>{profesor.email}</p>
            </div>
            {profesor.direccion && (
              <div>
                <span className='text-sm font-medium text-gray-500'>
                  Dirección:
                </span>
                <p className='text-gray-900'>{profesor.direccion}</p>
              </div>
            )}
          </div>
        </div>

        <div className='bg-gray-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            🏆 Información Profesional
          </h3>
          <div className='space-y-3'>
            <div>
              <span className='text-sm font-medium text-gray-500'>
                Especialidad:
              </span>
              <p className='text-gray-900'>{profesor.especialidad}</p>
            </div>
            <div>
              <span className='text-sm font-medium text-gray-500'>
                Nivel de experiencia:
              </span>
              <p className='text-gray-900'>{profesor.nivel_experiencia}</p>
            </div>
            <div>
              <span className='text-sm font-medium text-gray-500'>Estado:</span>
              <span
                className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                  profesor.activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {profesor.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {profesor.observaciones && (
        <div className='bg-gray-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            📝 Observaciones
          </h3>
          <p className='text-gray-700 whitespace-pre-wrap'>
            {profesor.observaciones}
          </p>
        </div>
      )}
    </div>
  );
}
