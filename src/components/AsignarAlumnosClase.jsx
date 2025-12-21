import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import Paginacion from './Paginacion';
import { determinarOrigenAutomatico, obtenerOrigenMasComun } from '../utils/origenUtils';
import OrigenAsignacionSelector from './clases/OrigenAsignacionSelector';
import ClaseInfoCard from './clases/ClaseInfoCard';
import AlumnosAsignadosList from './clases/AlumnosAsignadosList';
import AlumnosDisponiblesList from './clases/AlumnosDisponiblesList';
import AsignarAlumnosHeader from './clases/AsignarAlumnosHeader';
import ClaseSelector from './clases/ClaseSelector';

export default function AsignarAlumnosClase({
  onCancel,
  onSuccess,
  refreshTrigger,
  eventoParaAsignar,
}) {
  const [alumnos, setAlumnos] = useState([]);
  const [clases, setClases] = useState([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState('');
  const [asignados, setAsignados] = useState(new Set());
  const [maxAlcanzado, setMaxAlcanzado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [origenAsignacion, setOrigenAsignacion] = useState('escuela');

  // Usar función de utilidad para determinar origen automático

  // Estados para paginación de clases
  const [paginaClases, setPaginaClases] = useState(1);
  const elementosPorPaginaClases = 10;

  const claseActual = clases.find(c => c.id === claseSeleccionada);
  const esClaseParticular = claseActual?.tipo_clase === 'particular';
  const maxAlumnos = esClaseParticular ? 1 : 4;

  // 🆕 Actualizar origen automáticamente cuando se selecciona una clase
  useEffect(() => {
    if (claseActual) {
      const origenAutomatico = determinarOrigenAutomatico(claseActual);
      setOrigenAsignacion(origenAutomatico);
      console.log(
        `🔄 Origen automático para "${claseActual.nombre}": ${origenAutomatico}`
      );
    }
  }, [claseSeleccionada, claseActual]);

  // Filtrar alumnos según la búsqueda
  const alumnosFiltrados = alumnos.filter(alumno =>
    alumno.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Filtrar clases según el nivel
  const clasesFiltradas = clases.filter(
    clase => !filtroNivel || clase.nivel_clase === filtroNivel
  );

  // Lógica de paginación para clases
  const totalPaginasClases = Math.ceil(
    clasesFiltradas.length / elementosPorPaginaClases
  );
  const inicioIndiceClases = (paginaClases - 1) * elementosPorPaginaClases;
  const finIndiceClases = inicioIndiceClases + elementosPorPaginaClases;
  const clasesPaginadas = clasesFiltradas.slice(
    inicioIndiceClases,
    finIndiceClases
  );


  // Función para cargar datos
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [alumnosRes, clasesRes] = await Promise.all([
        supabase.from('alumnos').select('*').eq('activo', true),
        supabase
          .from('clases')
          .select(
            `
            *,
            eventos_clase (
              id,
              fecha,
              hora_inicio,
              hora_fin,
              estado
            )
          `
          )
          .order('nombre'),
      ]);

      if (alumnosRes.error) throw alumnosRes.error;
      if (clasesRes.error) throw clasesRes.error;

      // Filtrar eventos de hoy en adelante y activos para cada clase
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Establecer a las 00:00:00 para incluir todo el día actual

      const clasesConEventos = (clasesRes.data || []).map(clase => ({
        ...clase,
        eventos_proximos:
          clase.eventos_clase
            ?.filter(evento => {
              const fechaEvento = new Date(evento.fecha);
              fechaEvento.setHours(0, 0, 0, 0);
              return fechaEvento >= hoy && evento.estado !== 'cancelada';
            })
            ?.sort((a, b) => {
              // Ordenar por fecha primero, luego por hora
              const fechaA = new Date(a.fecha);
              const fechaB = new Date(b.fecha);
              if (fechaA.getTime() !== fechaB.getTime()) {
                return fechaA - fechaB;
              }
              // Si la fecha es igual, ordenar por hora de inicio
              return a.hora_inicio.localeCompare(b.hora_inicio);
            }) || [],
      }));

      // Ordenar las clases por su próximo evento (fecha y hora)
      clasesConEventos.sort((a, b) => {
        const proximoA = a.eventos_proximos[0];
        const proximoB = b.eventos_proximos[0];

        // Si una clase no tiene eventos próximos, va al final
        if (!proximoA && !proximoB) return 0;
        if (!proximoA) return 1;
        if (!proximoB) return -1;

        // Comparar por fecha
        const fechaA = new Date(proximoA.fecha);
        const fechaB = new Date(proximoB.fecha);
        if (fechaA.getTime() !== fechaB.getTime()) {
          return fechaA - fechaB;
        }

        // Si la fecha es igual, comparar por hora
        return proximoA.hora_inicio.localeCompare(proximoB.hora_inicio);
      });

      setAlumnos(alumnosRes.data || []);
      setClases(clasesConEventos);

      // 🔍 DEBUG: Mostrar información de clases y eventos en consola
      console.log('📊 DEBUG - Información de Clases y Eventos:');
      console.log(`Total de clases cargadas: ${clasesConEventos.length}`);
      clasesConEventos.forEach((clase, index) => {
        console.log(`\n${index + 1}. Clase: "${clase.nombre}"`);
        console.log(`   📋 Tabla: clases`);
        console.log(`   🆔 ID: ${clase.id}`);
        console.log(`   📅 Eventos próximos: ${clase.eventos_proximos?.length || 0}`);
        if (clase.eventos_proximos && clase.eventos_proximos.length > 0) {
          console.log(`   📋 Tabla de eventos: eventos_clase`);
          clase.eventos_proximos.forEach((evento, evIndex) => {
            console.log(`      ${evIndex + 1}. Evento ID: ${evento.id} | Fecha: ${evento.fecha} | Hora: ${evento.hora_inicio}-${evento.hora_fin}`);
          });
        }
      });
      console.log('\n💡 Para ver esta información en la UI, revisa la consola del navegador (F12)');
    } catch (err) {
      console.error('Error cargando datos:', err);
      alert('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar datos cuando cambie el refreshTrigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      cargarDatos();
    }
  }, [refreshTrigger]);

  // Preseleccionar clase cuando viene desde una recuperación
  useEffect(() => {
    if (eventoParaAsignar && clases.length > 0) {
      const claseEncontrada = clases.find(
        c => c.id === eventoParaAsignar.clase_id
      );
      if (claseEncontrada) {
        setClaseSeleccionada(eventoParaAsignar.clase_id);
        // Si es una recuperación, preseleccionar también el alumno
        if (eventoParaAsignar.alumnoRecuperacion) {
          setAsignados(new Set([eventoParaAsignar.alumnoRecuperacion]));
        }
      }
    }
  }, [eventoParaAsignar, clases]);

  // Cargar asignaciones cuando se selecciona una clase
  useEffect(() => {
    const cargarAsignaciones = async () => {
      if (!claseSeleccionada) {
        setAsignados(new Set());
        setMaxAlcanzado(false);
        return;
      }

      try {
        // Buscar asignaciones para toda la serie de eventos de esta clase
        const { data: asignadosRes, error } = await supabase
          .from('alumnos_clases')
          .select('*')
          .eq('clase_id', claseActual?.id);

        if (error) throw error;

        const asignadosSet = new Set(asignadosRes.map(a => a.alumno_id));
        setAsignados(asignadosSet);
        setMaxAlcanzado(asignadosSet.size >= maxAlumnos);

        // Si hay asignaciones existentes, verificar el origen
        if (asignadosRes && asignadosRes.length > 0) {
          // Obtener el origen más común (o el primero si todos son iguales)
          const origenes = asignadosRes
            .map(a => a.origen)
            .filter(o => o !== null && o !== undefined);
          
          if (origenes.length > 0) {
            // Obtener el origen más común usando utilidad
            const origenMasComun = obtenerOrigenMasComun(origenes);
            
            setOrigenAsignacion(origenMasComun);
          } else {
            // Si no hay origen definido, usar el automático
            const origenAutomatico = determinarOrigenAutomatico(claseActual);
            setOrigenAsignacion(origenAutomatico);
          }
        } else {
          // Si no hay asignaciones, usar el origen automático
          const origenAutomatico = determinarOrigenAutomatico(claseActual);
          setOrigenAsignacion(origenAutomatico);
        }
      } catch (err) {
        console.error('Error cargando asignaciones:', err);
        alert('No se pudieron cargar las asignaciones');
      }
    };

    cargarAsignaciones();
  }, [claseSeleccionada, maxAlumnos, claseActual?.id, claseActual]);

  // Función para eliminar una clase completa
  const handleEliminarClase = async (claseId, nombreClase, e) => {
    // Prevenir que se seleccione la clase al hacer clic en el botón
    if (e) {
      e.stopPropagation();
    }

    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres eliminar la clase "${nombreClase}"?\n\nEsta acción eliminará:\n- La clase y todos sus eventos\n- Todas las asignaciones de alumnos\n- Todas las asistencias relacionadas\n\nEsta acción NO se puede deshacer.`
    );

    if (!confirmacion) return;

    setLoading(true);

    try {
      // 1. Eliminar asistencias relacionadas
      const { error: asistenciasError } = await supabase
        .from('asistencias')
        .delete()
        .eq('clase_id', claseId);

      if (asistenciasError) {
        console.error('Error eliminando asistencias:', asistenciasError);
        // Continuar aunque falle
      }

      // 2. Eliminar asignaciones de alumnos
      const { error: alumnosError } = await supabase
        .from('alumnos_clases')
        .delete()
        .eq('clase_id', claseId);

      if (alumnosError) {
        console.error('Error eliminando asignaciones:', alumnosError);
        // Continuar aunque falle
      }

      // 3. Eliminar eventos relacionados
      const { error: eventosError } = await supabase
        .from('eventos_clase')
        .delete()
        .eq('clase_id', claseId);

      if (eventosError) {
        console.error('Error eliminando eventos:', eventosError);
        // Continuar aunque falle
      }

      // 4. Eliminar la clase
      const { error: claseError } = await supabase
        .from('clases')
        .delete()
        .eq('id', claseId);

      if (claseError) {
        throw new Error('Error al eliminar la clase: ' + claseError.message);
      }

      alert(`✅ Clase "${nombreClase}" eliminada correctamente`);
      
      // Si la clase eliminada estaba seleccionada, limpiar selección
      if (claseSeleccionada === claseId) {
        setClaseSeleccionada('');
        setAsignados(new Set());
        setMaxAlcanzado(false);
      }

      // Recargar datos
      await cargarDatos();
    } catch (error) {
      console.error('Error eliminando clase:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlumno = async alumnoId => {
    if (!claseSeleccionada) {
      alert('❌ Por favor selecciona una clase primero');
      return;
    }

    const estaAsignado = asignados.has(alumnoId);
    const nuevaCantidad = estaAsignado
      ? asignados.size - 1
      : asignados.size + 1;

    if (!estaAsignado && nuevaCantidad > maxAlumnos) {
      alert(
        `❌ Máximo ${maxAlumnos} alumno${maxAlumnos > 1 ? 's' : ''} por clase ${esClaseParticular ? 'particular' : 'grupal'}`
      );
      return;
    }

    // Validación de nivel (solo al asignar, no al desasignar)
    if (!estaAsignado) {
      const alumno = alumnos.find(a => a.id === alumnoId);
      const nivelAlumno = alumno?.nivel;
      const nivelClase = claseActual?.nivel_clase;

      if (nivelAlumno !== nivelClase) {
        const confirmacion = window.confirm(
          `⚠️ ADVERTENCIA DE NIVEL\n\n` +
            `El alumno "${alumno?.nombre}" tiene nivel "${nivelAlumno}"\n` +
            `pero la clase "${claseActual?.nombre}" es de nivel "${nivelClase}".\n\n` +
            `¿Estás seguro de que quieres asignar este alumno?\n` +
            `(El profesor puede permitir esta asignación si lo considera apropiado)`
        );

        if (!confirmacion) {
          return;
        }
      }
    }

    try {
      let error;
      if (estaAsignado) {
        // Desasignar - eliminar de toda la serie de eventos
        const { error: deleteError } = await supabase
          .from('alumnos_clases')
          .delete()
          .eq('clase_id', claseActual?.id)
          .eq('alumno_id', alumnoId);
        error = deleteError;
      } else {
        // Asignar - crear registro para toda la serie de eventos
        const { error: insertError } = await supabase
          .from('alumnos_clases')
          .insert([
            {
              clase_id: claseActual?.id,
              alumno_id: alumnoId,
              origen: origenAsignacion,
            },
          ]);
        error = insertError;
      }

      if (error) throw error;

      // Actualizar estado local
      const nuevoAsignados = new Set(asignados);
      if (estaAsignado) {
        nuevoAsignados.delete(alumnoId);
      } else {
        nuevoAsignados.add(alumnoId);
      }
      setAsignados(nuevoAsignados);
      setMaxAlcanzado(nuevoAsignados.size >= maxAlumnos);
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error al asignar/desasignar alumno');
    }
  };

  const handleCancelar = () => {
    if (!claseSeleccionada && asignados.size === 0) {
      onCancel();
      return;
    }
    if (asignados.size > 0) {
      const confirmar = window.confirm(
        `¿Estás seguro de que quieres salir? Se perderán ${asignados.size} asignación${asignados.size > 1 ? 'es' : ''} sin guardar.`
      );
      if (confirmar) onCancel();
    } else {
      onCancel();
    }
  };

  const handleGuardar = async () => {
    if (!claseSeleccionada) {
      alert('❌ Por favor selecciona una clase antes de guardar.');
      return;
    }
    if (asignados.size === 0) {
      alert(
        '❌ No hay alumnos asignados para guardar. Selecciona al menos un alumno.'
      );
      return;
    }

    alert(
      `✅ Se han guardado ${asignados.size} asignación${asignados.size > 1 ? 'es' : ''} correctamente.`
    );
    await cargarDatos();
    setClaseSeleccionada('');
    setAsignados(new Set());
    setMaxAlcanzado(false);
    onSuccess();
  };

  if (loading)
    return <LoadingSpinner size='medium' text='Cargando alumnos...' />;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <AsignarAlumnosHeader
        loading={loading}
        onRecargar={cargarDatos}
        onCancelar={handleCancelar}
        onGuardar={handleGuardar}
        asignadosCount={asignados.size}
      />

      {/* Layout mejorado */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Columna 1: Selección de Clase */}
        <div className='space-y-6'>
          <ClaseSelector
            clases={clases}
            clasesFiltradas={clasesFiltradas}
            clasesPaginadas={clasesPaginadas}
            claseSeleccionada={claseSeleccionada}
            setClaseSeleccionada={setClaseSeleccionada}
            filtroNivel={filtroNivel}
            setFiltroNivel={setFiltroNivel}
            paginaClases={paginaClases}
            setPaginaClases={setPaginaClases}
            elementosPorPagina={elementosPorPaginaClases}
            totalPaginas={totalPaginasClases}
            onEliminarClase={handleEliminarClase}
            loading={loading}
          />
        </div>

        {/* Columna 2: Asignación de Alumnos */}
        <div className='space-y-6'>
          {claseSeleccionada ? (
            <>
              {/* Información de la clase seleccionada */}
              {/* Información de la clase */}
              <ClaseInfoCard 
                clase={claseActual} 
                esClaseParticular={esClaseParticular} 
              />

              {/* Selector de origen */}
              <OrigenAsignacionSelector
                origenAsignacion={origenAsignacion}
                setOrigenAsignacion={setOrigenAsignacion}
                claseId={claseActual?.id}
                asignadosCount={asignados.size}
              />

                <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4'>
                  <div className='flex justify-between items-center gap-4 flex-wrap'>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>📊</span>
                      <span className='font-medium text-gray-700 dark:text-dark-text2'>
                        {asignados.size}/{maxAlumnos} alumnos asignados
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <label className='text-sm font-medium text-gray-700 dark:text-dark-text2'>
                        Origen:
                      </label>
                      <select
                        value={origenAsignacion}
                        onChange={e => setOrigenAsignacion(e.target.value)}
                        className='border border-gray-300 dark:border-dark-border rounded-lg px-2 py-1 bg-white dark:bg-dark-surface2 text-sm text-gray-900 dark:text-dark-text'
                      >
                        <option value='escuela'>Escuela</option>
                        <option value='interna'>Interna</option>
                      </select>
                    </div>
                    {maxAlcanzado && (
                      <span className='text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1'>
                        <span>⚠️</span>
                        Capacidad máxima
                      </span>
                    )}
                  </div>
                </div>

              {/* Alumnos asignados */}
              <AlumnosAsignadosList
                asignados={asignados}
                alumnos={alumnos}
                maxAlumnos={maxAlumnos}
                onToggleAlumno={toggleAlumno}
              />

              {/* Lista de alumnos disponibles */}
              <AlumnosDisponiblesList
                alumnos={alumnos}
                alumnosFiltrados={alumnosFiltrados}
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                asignados={asignados}
                maxAlcanzado={maxAlcanzado}
                onToggleAlumno={toggleAlumno}
                claseActual={claseActual}
              />
            </>
          ) : (
            <div className='bg-white dark:bg-dark-surface p-12 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border text-center'>
              <div className='text-6xl mb-4'>📚</div>
              <h3 className='text-xl font-bold text-gray-900 dark:text-dark-text mb-2'>
                Selecciona una clase
              </h3>
              <p className='text-gray-500 dark:text-dark-text2 mb-4'>
                Elige una clase de la lista de la izquierda para comenzar a
                asignar alumnos
              </p>
              <div className='inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span>
                  Las asignaciones se aplicarán a toda la serie de clases
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
