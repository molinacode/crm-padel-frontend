import { useState, useMemo } from 'react';
import { normalizeText } from '../utils/text';
import { LoadingSpinner } from '@shared';
import { GestionTematicasEjercicios } from '@features/ejercicios';
import {
  useEjercicios,
  useSelectorTematica,
  EjerciciosHeader,
  EjerciciosFilters,
  EjerciciosTable,
  EjerciciosSelectorTematica,
} from '@features/ejercicios';

export default function Ejercicios() {
  const { ejercicios, loading, eliminarEjercicio } = useEjercicios();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [mostrarGestionTematicas, setMostrarGestionTematicas] = useState(false);

  const selectorTematica = useSelectorTematica();

  const abrirSelectorTematica = () => {
    selectorTematica.abrirSelector();
  };

  const continuarAsignacionTematica = () => {
    if (selectorTematica.continuar()) {
      selectorTematica.cerrarSelector();
      setMostrarGestionTematicas(true);
    }
  };

  const cerrarGestionTematicas = () => {
    setMostrarGestionTematicas(false);
    selectorTematica.cerrarSelector();
  };

  const categorias = useMemo(
    () => [...new Set(ejercicios.map(e => e.categoria).filter(Boolean))],
    [ejercicios]
  );

  const ejerciciosFiltrados = ejercicios.filter(ejercicio => {
    const q = normalizeText(searchTerm);
    const nombre = normalizeText(ejercicio?.nombre);
    const desc = normalizeText(ejercicio?.description);
    const matchesSearch = !q || nombre.includes(q) || desc.includes(q);
    const matchesCategory = !filterCategoria || ejercicio.categoria === filterCategoria;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <LoadingSpinner size='large' text='Cargando ejercicios...' />;
  }

  return (
    <div className='space-y-6'>
      <EjerciciosHeader onAsignarTematica={abrirSelectorTematica} />

      <EjerciciosFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterCategoria={filterCategoria}
        setFilterCategoria={setFilterCategoria}
        categorias={categorias}
      />

      <EjerciciosTable
        ejercicios={ejerciciosFiltrados}
        onEliminar={eliminarEjercicio}
        searchTerm={searchTerm}
        filterCategoria={filterCategoria}
      />

      <EjerciciosSelectorTematica
        mostrar={selectorTematica.mostrarSelector}
        onClose={selectorTematica.cerrarSelector}
        clasesDisponibles={selectorTematica.clasesDisponibles}
        profesoresDisponibles={selectorTematica.profesoresDisponibles}
        claseSeleccionada={selectorTematica.claseSeleccionada}
        setClaseSeleccionada={selectorTematica.setClaseSeleccionada}
        profesorSeleccionado={selectorTematica.profesorSeleccionado}
        setProfesorSeleccionado={selectorTematica.setProfesorSeleccionado}
        onContinuar={continuarAsignacionTematica}
      />

      {/* Modal de gestión de temática y ejercicios */}
      {mostrarGestionTematicas &&
        selectorTematica.claseSeleccionada &&
        selectorTematica.profesorSeleccionado && (
          <GestionTematicasEjercicios
            claseId={selectorTematica.claseSeleccionada}
            profesor={selectorTematica.profesorSeleccionado}
            onClose={cerrarGestionTematicas}
          />
        )}
    </div>
  );
}
