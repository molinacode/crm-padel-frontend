import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Paginacion from '../Paginacion';

export default function FichaAlumnoTabClases({
  clases,
  alumnoId,
  onDesasignar,
}) {
  const navigate = useNavigate();
  const [paginaClases, setPaginaClases] = useState(1);
  const elementosPorPagina = 10;

  const totalPaginasClases = Math.ceil(clases.length / elementosPorPagina);
  const clasesPaginadas = useMemo(
    () =>
      clases.slice(
        (paginaClases - 1) * elementosPorPagina,
        paginaClases * elementosPorPagina
      ),
    [clases, paginaClases, elementosPorPagina]
  );

  if (clases.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>📚</div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
          No hay clases asignadas
        </h3>
        <p className='text-gray-500 dark:text-dark-text2 mb-6'>
          Este alumno no tiene clases asignadas actualmente
        </p>
        <button
          onClick={() => navigate('/clases?tab=asignar')}
          className='px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto'
        >
          ➕ Asignar primera clase
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h4 className='text-lg font-semibold text-gray-800 dark:text-dark-text'>
          Clases Asignadas ({clases.length})
        </h4>
        <button
          onClick={() => navigate('/clases?tab=asignar')}
          className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2'
        >
          ➕ Asignar más clases
        </button>
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full text-sm table-hover-custom'>
          <thead className='bg-gray-50 dark:bg-dark-surface2'>
            <tr>
              <th className='text-left py-3 font-medium text-gray-700 dark:text-dark-text'>
                Clase
              </th>
              <th className='text-left py-3 font-medium text-gray-700 dark:text-dark-text'>
                Día
              </th>
              <th className='text-left py-3 font-medium text-gray-700 dark:text-dark-text'>
                Hora
              </th>
              <th className='text-left py-3 font-medium text-gray-700 dark:text-dark-text'>
                Nivel
              </th>
              <th className='text-left py-3 font-medium text-gray-700 dark:text-dark-text'>
                Tipo
              </th>
              <th className='text-left py-3 font-medium text-gray-700 dark:text-dark-text'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {clasesPaginadas.map(clase => (
              <tr
                key={clase.id}
                className='border-b border-gray-100 dark:border-dark-border'
              >
                <td className='py-3 font-medium text-gray-900 dark:text-dark-text'>
                  {clase.nombre}
                </td>
                <td className='py-3 text-gray-600 dark:text-dark-text2'>
                  {clase.dia_semana}
                </td>
                <td className='py-3 text-gray-600 dark:text-dark-text2'>
                  {clase.hora_inicio} - {clase.hora_fin}
                </td>
                <td className='py-3'>
                  <span className='px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300'>
                    {clase.nivel_clase}
                  </span>
                </td>
                <td className='py-3'>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      clase.tipo_clase === 'particular'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}
                  >
                    {clase.tipo_clase === 'particular'
                      ? '🎯 Particular'
                      : '👥 Grupal'}
                  </span>
                </td>
                <td className='py-3'>
                  <button
                    onClick={() => onDesasignar(clase.id)}
                    className='px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors'
                    title='Desasignar de esta clase'
                  >
                    ❌ Desasignar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginasClases > 1 && (
        <Paginacion
          paginaActual={paginaClases}
          totalPaginas={totalPaginasClases}
          onCambiarPagina={setPaginaClases}
          elementosPorPagina={elementosPorPagina}
          totalElementos={clases.length}
        />
      )}
    </div>
  );
}
