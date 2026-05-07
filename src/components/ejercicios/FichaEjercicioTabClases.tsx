import type { Tables } from '../../types/supabase';

type ClaseResumen = Pick<
  Tables<'clases'>,
  'nombre' | 'nivel_clase' | 'tipo_clase' | 'dia_semana' | 'hora_inicio' | 'hora_fin'
>;

interface ClaseEjercicioAsignada {
  id: string;
  clases: ClaseResumen | null;
}

interface FichaEjercicioTabClasesProps {
  clasesAsignadas: ClaseEjercicioAsignada[];
}

export default function FichaEjercicioTabClases({
  clasesAsignadas,
}: FichaEjercicioTabClasesProps) {
  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-gray-900'>
          📅 Clases que usan este ejercicio
        </h3>
        <span className='text-sm text-gray-500'>
          {clasesAsignadas.length} clase
          {clasesAsignadas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {clasesAsignadas.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-4xl mb-4'>📅</div>
          <p className='text-gray-500'>
            Este ejercicio no está asignado a ninguna clase
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {clasesAsignadas.map(item => {
            const clase = item.clases;
            if (!clase) {
              return (
                <div key={item.id} className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-sm text-gray-500'>Clase no disponible</p>
                </div>
              );
            }
            return (
              <div key={item.id} className='bg-gray-50 rounded-lg p-4'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h4 className='font-semibold text-gray-900'>
                      {clase.nombre}
                    </h4>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
