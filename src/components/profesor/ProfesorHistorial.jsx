import { useState } from 'react';
import DetalleClaseModal from './DetalleClaseModal';

export default function ProfesorHistorial({ eventos, onSelectEvento }) {
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const items = (eventos || []).slice(0, 20);
  
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
        Historial reciente
      </h2>
      {items.length === 0 ? (
        <p className='text-gray-500 dark:text-dark-text2 text-sm'>
          Sin historial reciente.
        </p>
      ) : (
        <div className='space-y-2'>
          {items.map(ev => (
            <div
              key={ev.id}
              className='w-full p-3 rounded-xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-dark-surface2 transition'
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-900 dark:text-dark-text'>
                    {ev.title || 'Clase'} —{' '}
                    {new Date(ev.start).toLocaleDateString('es-ES')}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-dark-text2'>
                    Haz clic en "Ver detalle" para ver alumnos, temática y ejercicios
                  </p>
                </div>
                <div className='flex gap-2 ml-4'>
                  <button
                    type='button'
                    onClick={() => setEventoSeleccionado(ev)}
                    className='px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors'
                  >
                    Ver detalle
                  </button>
                  <button
                    type='button'
                    onClick={() => onSelectEvento?.(ev)}
                    className='px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-colors'
                  >
                    Gestionar temática
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {eventoSeleccionado && (
        <DetalleClaseModal
          evento={eventoSeleccionado}
          onClose={() => setEventoSeleccionado(null)}
        />
      )}
    </div>
  );
}
