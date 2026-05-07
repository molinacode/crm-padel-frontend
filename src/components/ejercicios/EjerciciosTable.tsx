import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import ActionBottomSheet from '../common/ActionBottomSheet';
import MobileEjercicioCard from '../common/MobileEjercicioCard';
import type { Tables } from '../../types/supabase';

type EjercicioRow = Tables<'ejercicios'>;

interface EjerciciosTableProps {
  ejercicios: EjercicioRow[];
  onEliminar: (id: string) => void;
  searchTerm: string;
  filterCategoria: string;
}

export default function EjerciciosTable({
  ejercicios,
  onEliminar,
  searchTerm,
  filterCategoria,
}: EjerciciosTableProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile(1024);
  const [ejercicioSeleccionado, setEjercicioSeleccionado] =
    useState<EjercicioRow | null>(null);
  const [mostrarModalAcciones, setMostrarModalAcciones] = useState(false);

  const badgesEjercicio = useMemo(() => {
    if (!ejercicioSeleccionado) return [];

    return [
      {
        label: ejercicioSeleccionado.categoria || 'General',
        colorClass:
          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      },
      {
        label: ejercicioSeleccionado.dificultad || 'Intermedio',
        colorClass:
          ejercicioSeleccionado.dificultad === 'Fácil'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : ejercicioSeleccionado.dificultad === 'Intermedio'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      },
      ...(ejercicioSeleccionado.duracion_minutos
        ? [
            {
              label: `${ejercicioSeleccionado.duracion_minutos} min`,
              colorClass:
                'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
            },
          ]
        : []),
    ];
  }, [ejercicioSeleccionado]);

  const accionesEjercicio = useMemo(() => {
    if (!ejercicioSeleccionado || !ejercicioSeleccionado.id) {
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
            color: 'blue' as const,
            onClick: () => {
              navigate(`/ejercicio/${ejercicioSeleccionado.id}`);
            },
          },
          {
            id: 'editar',
            label: 'Editar ejercicio',
            icon: '✏️',
            color: 'gray' as const,
            onClick: () => {
              navigate(`/ejercicio/${ejercicioSeleccionado.id}/editar`);
            },
          },
        ],
      },
      {
        category: 'Acciones peligrosas',
        items: [
          {
            id: 'eliminar',
            label: 'Eliminar ejercicio',
            icon: '🗑️',
            color: 'red' as const,
            onClick: () => {
              if (
                window.confirm(
                  `¿Estás seguro de que quieres eliminar el ejercicio "${ejercicioSeleccionado.nombre}"?`
                )
              ) {
                onEliminar(ejercicioSeleccionado.id);
              }
            },
          },
        ],
      },
    ];
  }, [ejercicioSeleccionado, onEliminar, navigate]);

  if (ejercicios.length === 0) {
    return (
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
        <div className='text-center py-12'>
          <div className='text-6xl mb-4'>💪</div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
            {searchTerm || filterCategoria
              ? 'No se encontraron ejercicios'
              : 'No hay ejercicios registrados'}
          </h3>
          <p className='text-gray-500 dark:text-dark-text2 mb-6'>
            {searchTerm || filterCategoria
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza agregando tu primer ejercicio'}
          </p>
          {!searchTerm && !filterCategoria && (
            <Link
              to='/ejercicios/nuevo'
              className='btn-primary px-6 py-3 dark:bg-blue-600 dark:hover:bg-blue-700'
            >
              ➕ Agregar Primer Ejercicio
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <div className='space-y-3'>
          {ejercicios.map(ejercicio => (
            <MobileEjercicioCard
              key={ejercicio.id}
              ejercicio={ejercicio}
              onActionClick={() => {
                setEjercicioSeleccionado(ejercicio);
                setMostrarModalAcciones(true);
              }}
            />
          ))}
        </div>

        {ejercicioSeleccionado && (
          <ActionBottomSheet
            isOpen={mostrarModalAcciones}
            onClose={() => {
              setMostrarModalAcciones(false);
              setEjercicioSeleccionado(null);
            }}
            title={ejercicioSeleccionado?.nombre || 'Ejercicio sin nombre'}
            subtitle={
              ejercicioSeleccionado?.description || 'Sin descripción'
            }
            badges={badgesEjercicio}
            actions={accionesEjercicio}
          />
        )}
      </>
    );
  }

  return (
    <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
      <div className='overflow-x-auto'>
        <table className='w-full table-hover-custom'>
          <thead className='bg-gray-50 dark:bg-dark-surface2'>
            <tr>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Ejercicio
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Categoría
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Dificultad
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Duración
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Descripción
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 dark:divide-dark-border'>
            {ejercicios.map(ejercicio => (
              <tr key={ejercicio.id} className='transition-colors'>
                <td className='py-4 px-6'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                      <span className='text-green-600 font-semibold text-lg'>
                        {ejercicio.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className='font-semibold text-gray-900'>
                        {ejercicio.nombre}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {ejercicio.tipo || 'Ejercicio'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className='py-4 px-6'>
                  <span className='inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                    {ejercicio.categoria || 'General'}
                  </span>
                </td>
                <td className='py-4 px-6'>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      ejercicio.dificultad === 'Fácil'
                        ? 'bg-green-100 text-green-800'
                        : ejercicio.dificultad === 'Intermedio'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ejercicio.dificultad || 'Intermedio'}
                  </span>
                </td>
                <td className='py-4 px-6'>
                  <div className='text-sm text-gray-900'>
                    {ejercicio.duracion_minutos
                      ? `${ejercicio.duracion_minutos} min`
                      : 'No especificada'}
                  </div>
                </td>
                <td className='py-4 px-6'>
                  <div className='text-sm text-gray-600 max-w-xs truncate'>
                    {ejercicio.description || 'Sin descripción'}
                  </div>
                </td>
                <td className='py-4 px-6'>
                  <div className='flex space-x-2'>
                    <Link
                      to={`/ejercicio/${ejercicio.id}`}
                      className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                    >
                      Ver
                    </Link>
                    <Link
                      to={`/ejercicio/${ejercicio.id}/editar`}
                      className='text-yellow-600 hover:text-yellow-800 text-sm font-medium'
                    >
                      Editar
                    </Link>
                    <button
                      type='button'
                      onClick={() => onEliminar(ejercicio.id)}
                      className='text-red-600 hover:text-red-800 text-sm font-medium'
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
