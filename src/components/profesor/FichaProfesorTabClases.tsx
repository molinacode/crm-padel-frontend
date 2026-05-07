import type { Tables } from '../../types/supabase';

type ClaseProfesor = Pick<
  Tables<'clases'>,
  'id' | 'nombre' | 'nivel_clase' | 'tipo_clase' | 'dia_semana' | 'hora_inicio' | 'hora_fin'
>;

interface FichaProfesorTabClasesProps {
  clases: ClaseProfesor[];
}

export default function FichaProfesorTabClases({
  clases,
}: FichaProfesorTabClasesProps) {
  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-gray-900'>
          📅 Clases Asignadas
        </h3>
        <span className='text-sm text-gray-500'>
          {clases.length} clase{clases.length !== 1 ? 's' : ''}
        </span>
      </div>

      {clases.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-4xl mb-4'>📅</div>
          <p className='text-gray-500'>
            No hay clases asignadas a este profesor
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {clases.map(clase => (
            <div key={clase.id} className='bg-gray-50 rounded-lg p-4'>
              <div className='flex justify-between items-start'>
                <div>
                  <h4 className='font-semibold text-gray-900'>{clase.nombre}</h4>
                  <p className='text-sm text-gray-600'>
                    {clase.nivel_clase} • {clase.tipo_clase}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {clase.dia_semana} • {clase.hora_inicio} - {clase.hora_fin}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    clase.tipo_clase === 'particular'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {clase.tipo_clase === 'particular'
                    ? '🎯 Particular'
                    : '👥 Grupal'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
