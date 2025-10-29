import AsistenciasTable from './AsistenciasTable';

export default function AsistenciasClaseCard({
  evento,
  clase,
  alumnos,
  asistenciasClase,
  recuperacionesMarcadas,
  onCambioEstado,
}) {
  const esClaseParticular = clase.tipo_clase === 'particular';

  return (
    <div className='card mb-6'>
      <div className='flex justify-between items-start mb-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-800'>
            {clase.nombre}
          </h3>
          <div className='flex items-center space-x-4 mt-2'>
            <span className='text-sm text-gray-600'>
              🕐 {evento.hora_inicio} - {evento.hora_fin}
            </span>
            <span className='text-sm text-gray-600'>📚 {clase.nivel_clase}</span>
            <span
              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                esClaseParticular
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {esClaseParticular ? '🎯 Particular' : '👥 Grupal'}
            </span>
          </div>
          {clase.profesor && (
            <p className='text-sm text-gray-500 mt-1'>👨‍🏫 {clase.profesor}</p>
          )}
        </div>
        <div className='text-right'>
          <p className='text-sm text-gray-500'>
            {alumnos.length}/{esClaseParticular ? '1' : '4'} alumnos
          </p>
        </div>
      </div>

      {alumnos.length === 0 ? (
        <div className='text-center py-6 bg-gray-50 rounded-lg'>
          <p className='text-gray-500'>
            No hay alumnos asignados a esta clase
          </p>
        </div>
      ) : (
        <AsistenciasTable
          alumnos={alumnos}
          asistenciasClase={asistenciasClase}
          recuperacionesMarcadas={recuperacionesMarcadas}
          claseId={clase.id}
          onCambioEstado={onCambioEstado}
        />
      )}
    </div>
  );
}

