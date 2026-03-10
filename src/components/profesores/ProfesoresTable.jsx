import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import ActionBottomSheet from '../common/ActionBottomSheet';
import MobileProfesorCard from '../common/MobileProfesorCard';

export default function ProfesoresTable({
  profesores,
  onEliminar,
  searchTerm,
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile(1024);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState(null);
  const [mostrarModalAcciones, setMostrarModalAcciones] = useState(false);

  // Memoizar badges y actions FUERA del condicional para cumplir reglas de hooks
  const badgesProfesor = useMemo(() => {
    if (!profesorSeleccionado) return [];

    return [
      {
        label: profesorSeleccionado.especialidad || 'Pádel',
        colorClass:
          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      },
      {
        label: profesorSeleccionado.activo ? 'Activo' : 'Inactivo',
        icon: profesorSeleccionado.activo ? '✅' : '❌',
        colorClass: profesorSeleccionado.activo
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      },
    ];
  }, [profesorSeleccionado]);

  const accionesProfesor = useMemo(() => {
    if (!profesorSeleccionado || !profesorSeleccionado.id) {
      return [];
    }

    return [
      {
        category: 'Acciones principales',
        items: [
          {
            id: 'ver',
            label: 'Ver detalles',
            icon: '👁️',
            color: 'blue',
            onClick: () => {
              navigate(`/profesor/${profesorSeleccionado.id}`);
            },
          },
          {
            id: 'editar',
            label: 'Editar profesor',
            icon: '✏️',
            color: 'gray',
            onClick: () => {
              navigate(`/profesor/${profesorSeleccionado.id}/editar`);
            },
          },
        ],
      },
      {
        category: 'Acciones peligrosas',
        items: [
          {
            id: 'eliminar',
            label: 'Eliminar profesor',
            icon: '🗑️',
            color: 'red',
            onClick: () => {
              if (
                window.confirm(
                  `¿Estás seguro de que quieres eliminar a ${profesorSeleccionado.nombre}?`
                )
              ) {
                onEliminar(profesorSeleccionado.id);
              }
            },
          },
        ],
      },
    ];
  }, [profesorSeleccionado, onEliminar, navigate]);

  if (profesores.length === 0) {
    return (
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
        <div className='text-center py-12'>
          <div className='text-6xl mb-4'>👨‍🏫</div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
            {searchTerm
              ? 'No se encontraron profesores'
              : 'No hay profesores registrados'}
          </h3>
          <p className='text-gray-500 dark:text-dark-text2 mb-6'>
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza agregando tu primer profesor'}
          </p>
          {!searchTerm && (
            <Link
              to='/profesores/nuevo'
              className='btn-primary px-6 py-3 dark:bg-blue-600 dark:hover:bg-blue-700'
            >
              ➕ Agregar Primer Profesor
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Vista móvil: tarjetas
  if (isMobile) {
    return (
      <>
        <div className='space-y-3'>
          {profesores.map(profesor => (
            <MobileProfesorCard
              key={profesor.id}
              profesor={profesor}
              onActionClick={() => {
                setProfesorSeleccionado(profesor);
                setMostrarModalAcciones(true);
              }}
            />
          ))}
        </div>

        {/* Bottom Sheet para móvil */}
        {profesorSeleccionado && (
          <ActionBottomSheet
            isOpen={mostrarModalAcciones}
            onClose={() => {
              setMostrarModalAcciones(false);
              setProfesorSeleccionado(null);
            }}
            title={
              `${profesorSeleccionado?.nombre || ''} ${profesorSeleccionado?.apellidos || ''}`.trim() ||
              'Profesor sin nombre'
            }
            subtitle={profesorSeleccionado?.email || 'Sin email'}
            badges={badgesProfesor}
            actions={accionesProfesor}
          />
        )}
      </>
    );
  }

  // Vista desktop: tabla
  return (
    <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
      <div className='overflow-x-auto'>
        <table className='w-full table-hover-custom'>
          <thead className='bg-gray-50 dark:bg-dark-surface2'>
            <tr>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Profesor
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Contacto
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Especialidad
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Estado
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 dark:divide-dark-border'>
            {profesores.map(profesor => (
              <tr key={profesor.id} className='transition-colors'>
                <td className='py-4 px-6'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-600 font-semibold text-lg'>
                        {profesor.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className='font-semibold text-gray-900'>
                        {profesor.nombre}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {profesor.apellidos}
                      </div>
                    </div>
                  </div>
                </td>
                <td className='py-4 px-6'>
                  <div className='space-y-1'>
                    <div className='text-sm text-gray-900'>
                      {profesor.email}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {profesor.telefono}
                    </div>
                  </div>
                </td>
                <td className='py-4 px-6'>
                  <span className='inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
                    {profesor.especialidad || 'Pádel'}
                  </span>
                </td>
                <td className='py-4 px-6'>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      profesor.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {profesor.activo ? '✅ Activo' : '❌ Inactivo'}
                  </span>
                </td>
                <td className='py-4 px-6'>
                  {isMobile ? (
                    <button
                      onClick={() => {
                        setProfesorSeleccionado(profesor);
                        setMostrarModalAcciones(true);
                      }}
                      className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md'
                    >
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z'
                        />
                      </svg>
                      Acciones
                    </button>
                  ) : (
                    <div className='flex space-x-2'>
                      <Link
                        to={`/profesor/${profesor.id}`}
                        className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                      >
                        Ver
                      </Link>
                      <Link
                        to={`/profesor/${profesor.id}/editar`}
                        className='text-yellow-600 hover:text-yellow-800 text-sm font-medium'
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => onEliminar(profesor.id)}
                        className='text-red-600 hover:text-red-800 text-sm font-medium'
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
