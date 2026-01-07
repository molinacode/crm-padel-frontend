import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import { obtenerOrigenMasComun } from '../utils/origenUtils';
import { calcularHuecosDesdeSupabase } from '../utils/calcularHuecos';
import { filtrarAlumnosActivos } from '../utils/alumnoUtils';
import OcuparHuecosHeader from './clases/OcuparHuecosHeader';
import OcuparHuecosEventoInfo from './clases/OcuparHuecosEventoInfo';
import OcuparHuecosAlumnosList from './clases/OcuparHuecosAlumnosList';

export default function OcuparHuecos({
  onClose,
  onSuccess,
  evento,
  esRecuperacion = false,
}) {
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [huecosDisponibles, setHuecosDisponibles] = useState(0);
  const [maxAlumnos, setMaxAlumnos] = useState(4);

  const cargarAlumnosDisponibles = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando alumnos disponibles para ocupar huecos...');

      // Obtener información de la clase para determinar el límite
      const { data: claseData, error: claseError } = await supabase
        .from('clases')
        .select('tipo_clase, nombre')
        .eq('id', evento.clase_id)
        .single();

      if (claseError) throw claseError;

      const esParticular = claseData.tipo_clase === 'particular';
      const maxAlumnosCalculado = esParticular ? 1 : 4;
      setMaxAlumnos(maxAlumnosCalculado);

      // Obtener alumnos activos que no están asignados a esta clase
      // Filtrar por activo en BD y luego por fecha_baja en cliente
      const { data: alumnosData, error: alumnosError } = await supabase
        .from('alumnos')
        .select('*')
        .or('activo.eq.true,activo.is.null')
        .order('nombre');

      if (alumnosError) throw alumnosError;

      // Filtrar alumnos activos considerando fecha_baja
      const alumnosActivos = filtrarAlumnosActivos(alumnosData || [], new Date());

      // Si es para recuperación, también obtener alumnos con recuperaciones pendientes
      let alumnosConRecuperaciones = [];
      if (esRecuperacion) {
        const { data: recuperacionesData, error: recuperacionesError } =
          await supabase
            .from('recuperaciones_clase')
            .select(
              `
            id,
            alumno_id,
            fecha_falta,
            clases (nombre, nivel_clase, tipo_clase),
            alumnos (id, nombre, nivel)
          `
            )
            .eq('estado', 'pendiente');

        if (recuperacionesError) throw recuperacionesError;

        alumnosConRecuperaciones = recuperacionesData.map(r => ({
          ...r.alumnos,
          recuperacion: {
            id: r.id,
            fecha_falta: r.fecha_falta,
            clase_original: r.clases,
          },
        }));

        console.log(
          `🔄 Encontrados ${alumnosConRecuperaciones.length} alumnos con recuperaciones pendientes`
        );
      }

      // Obtener alumnos ya asignados a esta clase
      // IMPORTANTE: Solo contar asignaciones permanentes + temporales de ESTE evento
      const { data: asignadosData, error: asignadosError } = await supabase
        .from('alumnos_clases')
        .select('alumno_id, tipo_asignacion, evento_id')
        .eq('clase_id', evento.clase_id);

      if (asignadosError) throw asignadosError;

      // Obtener liberaciones activas para esta clase y fecha
      const { data: liberacionesData, error: liberacionesError } =
        await supabase
          .from('liberaciones_plaza')
          .select('alumno_id')
          .eq('clase_id', evento.clase_id)
          .eq('fecha_inicio', evento.fecha)
          .eq('estado', 'activa');

      if (liberacionesError) throw liberacionesError;

      // Filtrar asignaciones: solo permanentes + temporales de este evento
      const eventoId = evento.id || evento.eventoId;
      const asignacionesValidas = asignadosData.filter(ac => {
        const esPermanente =
          !ac.tipo_asignacion || ac.tipo_asignacion === 'permanente';
        const esTemporalDeEsteEvento =
          ac.tipo_asignacion === 'temporal' && ac.evento_id === eventoId;
        return esPermanente || esTemporalDeEsteEvento;
      });

      // Calcular huecos usando la utilidad
      const resultadoHuecos = calcularHuecosDesdeSupabase({
        asignacionesData: asignacionesValidas,
        liberacionesData: liberacionesData,
        justificadosData: evento.alumnosJustificados || [],
        faltasData: [],
        eventoId: eventoId,
        maxAlumnos: 4,
        esParticular: esParticular
      });

      // Usar el valor que viene de Clases.jsx como referencia, pero validar contra huecos reales
      // Si hay inconsistencia, usar los huecos reales como límite máximo
      const huecosDisponiblesCalculados = Math.min(
        typeof evento.cantidadHuecos === 'number'
          ? evento.cantidadHuecos
          : resultadoHuecos.huecosReales,
        resultadoHuecos.huecosReales
      );

      setHuecosDisponibles(huecosDisponiblesCalculados);

      console.log(
        `📊 Popup: ${resultadoHuecos.alumnosPresentes}/${resultadoHuecos.maxAlumnos} presentes, ${huecosDisponiblesCalculados} huecos disponibles`
      );
      console.log(`🔍 Detalles del cálculo:`);
      console.log(`  📥 cantidadHuecos recibido: ${evento.cantidadHuecos}`);
      console.log(`  🕳️ huecosReales calculados: ${resultadoHuecos.huecosReales}`);
      console.log(
        `  ✅ huecosDisponibles finales: ${huecosDisponiblesCalculados}`
      );

      // Nota: aunque no haya justificadas, si hay huecos reales, permitimos mostrar alumnos (especialmente en modo recuperación)

      // Obtener IDs de alumnos asignados para filtrar
      const asignadosIdsSet = new Set(asignacionesValidas.map(a => a.alumno_id));

      // Filtrar alumnos que no están asignados a esta clase
      const disponibles = alumnosActivos.filter(
        alumno => !asignadosIdsSet.has(alumno.id)
      );

      // Si es para recuperación, añadir alumnos con recuperaciones pendientes
      if (esRecuperacion && alumnosConRecuperaciones.length > 0) {
        const alumnosConRecuperacionesDisponibles =
          alumnosConRecuperaciones.filter(
            alumno => !asignadosIdsSet.has(alumno.id)
          );

        // Combinar ambos grupos, evitando duplicados
        const todosDisponibles = [...disponibles];
        alumnosConRecuperacionesDisponibles.forEach(alumnoConRecuperacion => {
          if (!todosDisponibles.find(a => a.id === alumnoConRecuperacion.id)) {
            todosDisponibles.push(alumnoConRecuperacion);
          }
        });

        setAlumnosDisponibles(todosDisponibles);
        console.log(
          `👥 ${disponibles.length} alumnos normales + ${alumnosConRecuperacionesDisponibles.length} con recuperaciones = ${todosDisponibles.length} total disponibles`
        );
        console.log(
          '🔍 todosDisponibles es array:',
          Array.isArray(todosDisponibles)
        );
      } else {
        setAlumnosDisponibles(disponibles);
        console.log(
          `👥 ${disponibles.length} alumnos disponibles para seleccionar`
        );
        console.log('🔍 disponibles es array:', Array.isArray(disponibles));
      }
    } catch (error) {
      console.error('Error cargando alumnos disponibles:', error);
      alert('Error al cargar alumnos disponibles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAlumnosDisponibles();
  }, [evento]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAlumno = alumnoId => {
    const nuevoSeleccionados = new Set(alumnosSeleccionados);
    if (nuevoSeleccionados.has(alumnoId)) {
      nuevoSeleccionados.delete(alumnoId);
      console.log(
        `➖ Removido alumno ${alumnoId} - Seleccionados: ${nuevoSeleccionados.size}`
      );
    } else {
      // Verificar que no excedamos el número de huecos disponibles
      // Usar los huecos reales calculados en lugar de cantidadHuecos
      const maxHuecos = huecosDisponibles;

      if (nuevoSeleccionados.size >= maxHuecos) {
        alert(
          `❌ Solo puedes seleccionar hasta ${maxHuecos} alumno${maxHuecos !== 1 ? 's' : ''} para ocupar los huecos disponibles.`
        );
        return;
      }
      nuevoSeleccionados.add(alumnoId);
      console.log(
        `➕ Agregado alumno ${alumnoId} - Seleccionados: ${nuevoSeleccionados.size}`
      );
    }
    setAlumnosSeleccionados(nuevoSeleccionados);
  };

  const ocuparHuecos = async () => {
    console.log(`🚀 INICIANDO ocuparHuecos:`);
    console.log(`  alumnosSeleccionados.size: ${alumnosSeleccionados.size}`);
    console.log(`  huecosDisponibles: ${huecosDisponibles}`);
    console.log(`  evento.cantidadHuecos: ${evento.cantidadHuecos}`);
    console.log(`  esRecuperacion: ${esRecuperacion}`);

    if (alumnosSeleccionados.size === 0) {
      alert(
        '❌ Por favor selecciona al menos un alumno para ocupar los huecos.'
      );
      return;
    }

    if (alumnosSeleccionados.size > huecosDisponibles) {
      alert(
        `❌ No puedes seleccionar más de ${huecosDisponibles} alumno${huecosDisponibles !== 1 ? 's' : ''}.`
      );
      return;
    }

    try {
      setProcesando(true);
      console.log('🔄 Ocupando huecos con alumnos seleccionados...');

      // Verificar nuevamente la disponibilidad antes de proceder
      const { data: claseData, error: claseError } = await supabase
        .from('clases')
        .select('tipo_clase, nombre')
        .eq('id', evento.clase_id)
        .single();

      if (claseError) throw claseError;

      const esParticular = claseData.tipo_clase === 'particular';

      // Obtener estado actual de la clase (CON el mismo filtro que en carga inicial)
      const eventoId = evento.id || evento.eventoId;
      const [asignadosRes, liberacionesRes] = await Promise.all([
        supabase
          .from('alumnos_clases')
          .select('alumno_id, tipo_asignacion, evento_id')
          .eq('clase_id', evento.clase_id),
        supabase
          .from('liberaciones_plaza')
          .select('alumno_id')
          .eq('clase_id', evento.clase_id)
          .eq('fecha_inicio', evento.fecha)
          .eq('estado', 'activa'),
      ]);

      if (asignadosRes.error) throw asignadosRes.error;
      if (liberacionesRes.error) throw liberacionesRes.error;

      // Calcular huecos usando la utilidad para validación
      const resultadoValidacion = calcularHuecosDesdeSupabase({
        asignacionesData: asignadosRes.data,
        liberacionesData: liberacionesRes.data,
        justificadosData: evento.alumnosJustificados || [],
        faltasData: [],
        eventoId: eventoId,
        maxAlumnos: 4,
        esParticular: esParticular
      });

      console.log(`🔍 Verificación final antes de ocupar huecos:`);
      console.log(`  👥 Alumnos asignados: ${resultadoValidacion.alumnosAsignados}`);
      console.log(`  🔄 Alumnos liberados: ${resultadoValidacion.alumnosLiberados}`);
      console.log(`  ✅ Alumnos presentes: ${resultadoValidacion.alumnosPresentes}`);
      console.log(`  🕳️ Huecos reales: ${resultadoValidacion.huecosReales}`);
      console.log(`  👤 Alumnos a ocupar: ${alumnosSeleccionados.size}`);

      // Usar la misma lógica que en el cálculo inicial para mantener consistencia
      const huecosDisponiblesValidacion = Math.min(
        typeof evento.cantidadHuecos === 'number'
          ? evento.cantidadHuecos
          : resultadoValidacion.huecosReales,
        resultadoValidacion.huecosReales
      );

      console.log(`🔍 Validación de huecos:`);
      console.log(`  👥 Alumnos asignados: ${resultadoValidacion.alumnosAsignados}`);
      console.log(`  🔄 Alumnos liberados: ${resultadoValidacion.alumnosLiberados}`);
      console.log(
        `  ❌ Alumnos justificados: ${resultadoValidacion.alumnosJustificados}`
      );
      console.log(`  ✅ Alumnos presentes: ${resultadoValidacion.alumnosPresentes}`);
      console.log(`  🕳️ Huecos reales: ${resultadoValidacion.huecosReales}`);
      console.log(`  📥 cantidadHuecos recibido: ${evento.cantidadHuecos}`);
      console.log(
        `  ✅ huecosDisponiblesValidacion: ${huecosDisponiblesValidacion}`
      );
      console.log(`  👤 Alumnos a ocupar: ${alumnosSeleccionados.size}`);

      console.log(`🚨 VALIDACIÓN FINAL:`);
      console.log(
        `  huecosDisponiblesValidacion: ${huecosDisponiblesValidacion}`
      );
      console.log(`  alumnosSeleccionados.size: ${alumnosSeleccionados.size}`);
      console.log(
        `  Comparación: ${huecosDisponiblesValidacion} < ${alumnosSeleccionados.size} = ${huecosDisponiblesValidacion < alumnosSeleccionados.size}`
      );

      if (huecosDisponiblesValidacion < alumnosSeleccionados.size) {
        console.log(`❌ ERROR: No hay suficientes huecos disponibles`);
        alert(
          `❌ No hay suficientes huecos disponibles. Solo hay ${huecosDisponiblesValidacion} hueco${huecosDisponiblesValidacion !== 1 ? 's' : ''} disponible${huecosDisponiblesValidacion !== 1 ? 's' : ''} en la clase.`
        );
        return;
      }

      // Verificar que tenemos el ID del evento
      if (!eventoId) {
        throw new Error('No se pudo obtener el ID del evento');
      }

      // IMPORTANTE: NO crear asignaciones permanentes cuando se ocupan huecos o se usan recuperaciones
      // En su lugar, crear asignaciones temporales SOLO para este evento específico
      // Estas asignaciones son diferentes de las permanentes (que aplican a toda la temporada)

      // Verificar si el alumno ya está asignado permanentemente a esta clase
      const { data: asignacionesExistentes, error: checkError } = await supabase
        .from('alumnos_clases')
        .select('id')
        .in('alumno_id', Array.from(alumnosSeleccionados))
        .eq('clase_id', evento.clase_id);

      if (checkError) throw checkError;

      // Separar alumnos que ya están asignados permanentemente de los nuevos
      const alumnosAsignadosIds = new Set(
        asignacionesExistentes?.map(a => a.alumno_id) || []
      );
      const alumnosNuevos = Array.from(alumnosSeleccionados).filter(
        id => !alumnosAsignadosIds.has(id)
      );

      if (alumnosNuevos.length === 0) {
        console.log(
          'ℹ️ Todos los alumnos ya están asignados permanentemente a esta clase'
        );
        // No es un error, simplemente no hay nada que hacer
      } else {
        // Determinar el origen basado en las asignaciones permanentes del alumno
        // Obtener asignaciones permanentes de los alumnos nuevos
        const { data: asignacionesPermanentes, error: errorPerm } = await supabase
          .from('alumnos_clases')
          .select('alumno_id, origen')
          .in('alumno_id', alumnosNuevos)
          .or('tipo_asignacion.is.null,tipo_asignacion.eq.permanente');

        if (errorPerm) {
          console.error('Error obteniendo asignaciones permanentes:', errorPerm);
          // En caso de error, usar el origen del tipo de clase como fallback
          const origenFallback = evento.tipo_clase === 'interna' ? 'interna' : 'escuela';
          const asignaciones = alumnosNuevos.map(alumnoId => ({
            clase_id: evento.clase_id,
            alumno_id: alumnoId,
            origen: origenFallback,
            tipo_asignacion: 'temporal',
            evento_id: eventoId,
          }));

          const { error: asignacionError } = await supabase
            .from('alumnos_clases')
            .insert(asignaciones);

          if (asignacionError) throw asignacionError;
          console.log(`✅ Asignaciones temporales creadas con origen fallback`);
        } else {
          // Crear mapa de origen por alumno
          const origenPorAlumno = {};
          asignacionesPermanentes.forEach(ap => {
            if (!origenPorAlumno[ap.alumno_id]) {
              origenPorAlumno[ap.alumno_id] = [];
            }
            if (ap.origen) {
              origenPorAlumno[ap.alumno_id].push(ap.origen);
            }
          });

          // Usar función de utilidad para obtener origen más común

          // Obtener información de alumnos para preguntar si no tienen permanentes
          const { data: alumnos } = await supabase
            .from('alumnos')
            .select('id, nombre')
            .in('id', alumnosNuevos);

          const alumnosMap = new Map();
          if (alumnos) {
            alumnos.forEach(a => alumnosMap.set(a.id, a));
          }

          // Determinar origen para cada alumno
          const alumnosSinPermanentes = [];
          const origenPorAlumnoFinal = {};

          alumnosNuevos.forEach(alumnoId => {
            const origenesAlumno = origenPorAlumno[alumnoId] || [];
            const origenPermanente = obtenerOrigenMasComun(origenesAlumno);
            
            if (origenPermanente === null) {
              // Alumno sin permanentes - necesitamos preguntar
              alumnosSinPermanentes.push(alumnoId);
            } else {
              origenPorAlumnoFinal[alumnoId] = origenPermanente;
            }
          });

          // Si hay alumnos sin permanentes, preguntar
          let origenParaSinPermanentes = null;
          if (alumnosSinPermanentes.length > 0) {
            const listaAlumnos = alumnosSinPermanentes
              .map(id => {
                const alumno = alumnosMap.get(id);
                return `  • ${alumno?.nombre || 'Desconocido'}`;
              })
              .join('\n');
            
            const respuesta = window.confirm(
              `⚠️ Los siguientes alumnos no tienen asignaciones permanentes:\n\n` +
              `${listaAlumnos}\n\n` +
              `¿Estos alumnos deben generar pago pendiente?\n\n` +
              `• SÍ = Origen "Escuela" (requiere pago)\n` +
              `• NO = Origen "Interna" (sin pago)`
            );
            
            origenParaSinPermanentes = respuesta ? 'escuela' : 'interna';
            
            // Asignar el origen decidido a los alumnos sin permanentes
            alumnosSinPermanentes.forEach(id => {
              origenPorAlumnoFinal[id] = origenParaSinPermanentes;
            });
          }

          // Crear asignaciones temporales con el origen correcto
          const asignaciones = alumnosNuevos.map(alumnoId => ({
            clase_id: evento.clase_id,
            alumno_id: alumnoId,
            origen: origenPorAlumnoFinal[alumnoId] || (evento.tipo_clase === 'interna' ? 'interna' : 'escuela'),
            tipo_asignacion: 'temporal',
            evento_id: eventoId,
          }));

          console.log(
            `📝 Creando ${asignaciones.length} asignación(es) temporal(es) para el evento ${eventoId}`
          );

          const { error: asignacionError } = await supabase
            .from('alumnos_clases')
            .insert(asignaciones);

          if (asignacionError) {
            console.error(
              '❌ Error creando asignaciones temporales:',
              asignacionError
            );
            throw asignacionError;
          }

          console.log(`✅ Asignaciones temporales creadas correctamente`);
        }
      }

      // Cancelar liberaciones de plaza para los alumnos justificados (sus huecos fueron ocupados)
      for (const alumno of evento.alumnosJustificados) {
        try {
          // Buscar liberación activa para este alumno
          const { data: liberacionExistente, error: selectError } =
            await supabase
              .from('liberaciones_plaza')
              .select('id, estado')
              .eq('alumno_id', alumno.id)
              .eq('clase_id', evento.clase_id)
              .eq('fecha_inicio', evento.fecha)
              .eq('estado', 'activa')
              .maybeSingle();

          if (selectError) {
            console.error(
              'Error verificando liberación existente:',
              selectError
            );
            continue;
          }

          if (liberacionExistente) {
            // Cancelar la liberación porque su hueco fue ocupado
            const { error: updateError } = await supabase
              .from('liberaciones_plaza')
              .update({ estado: 'cancelada' })
              .eq('id', liberacionExistente.id);

            if (updateError) {
              console.error('Error cancelando liberación:', updateError);
            } else {
              console.log(
                `✅ Liberación cancelada para alumno ${alumno.nombre} (hueco ocupado)`
              );
            }
          } else {
            // Si no existe liberación, crear una cancelada (para registro)
            const { error: insertError } = await supabase
              .from('liberaciones_plaza')
              .insert([
                {
                  alumno_id: alumno.id,
                  clase_id: evento.clase_id,
                  fecha_inicio: evento.fecha,
                  fecha_fin: evento.fecha,
                  motivo: 'falta_justificada',
                  estado: 'cancelada',
                },
              ]);

            if (insertError) {
              console.error('Error creando liberación cancelada:', insertError);
            } else {
              console.log(
                `✅ Liberación cancelada creada para alumno ${alumno.nombre}`
              );
            }
          }
        } catch (error) {
          console.error(
            'Error procesando liberación para alumno:',
            alumno.nombre,
            error
          );
        }
      }

      // Si es para recuperación, marcar las recuperaciones como completadas
      if (esRecuperacion) {
        console.log('🔄 Procesando recuperaciones completadas...');
        console.log('🔍 alumnosDisponibles:', alumnosDisponibles);
        console.log(
          '🔍 Tipo de alumnosDisponibles:',
          typeof alumnosDisponibles,
          Array.isArray(alumnosDisponibles)
        );

        for (const alumnoId of alumnosSeleccionados) {
          if (!Array.isArray(alumnosDisponibles)) {
            console.error(
              '❌ alumnosDisponibles no es un array:',
              alumnosDisponibles
            );
            continue;
          }

          const alumnoSeleccionado = alumnosDisponibles.find(
            a => a.id === alumnoId
          );

          // Si el alumno tiene una recuperación pendiente, marcarla como completada
          if (alumnoSeleccionado?.recuperacion) {
            console.log(
              `🔄 Procesando recuperación para ${alumnoSeleccionado.nombre}...`
            );
            try {
              const { error: updateError } = await supabase
                .from('recuperaciones_clase')
                .update({
                  estado: 'recuperada',
                  fecha_recuperacion: evento.fecha,
                  observaciones: `Clase recuperada en ${evento.nombre} el ${new Date(evento.fecha).toLocaleDateString('es-ES')}`,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', alumnoSeleccionado.recuperacion.id);

              if (updateError) {
                console.error(
                  '❌ Error actualizando recuperación:',
                  updateError
                );
                throw updateError; // Re-lanzar el error para que se capture en el catch principal
              } else {
                console.log(
                  `✅ Recuperación completada para ${alumnoSeleccionado.nombre}`
                );
              }
            } catch (error) {
              console.error('❌ Error procesando recuperación:', error);
              throw error; // Re-lanzar el error para que se capture en el catch principal
            }
          }
        }
      }

      console.log('✅ Huecos ocupados correctamente');
      const mensaje = esRecuperacion
        ? `✅ Se han ocupado ${alumnosSeleccionados.size} hueco${alumnosSeleccionados.size !== 1 ? 's' : ''} y procesado las recuperaciones correspondientes.`
        : `✅ Se han ocupado ${alumnosSeleccionados.size} hueco${alumnosSeleccionados.size !== 1 ? 's' : ''} correctamente.`;

      alert(mensaje);

      onSuccess();
    } catch (error) {
      console.error('Error ocupando huecos:', error);
      alert('Error al ocupar los huecos');
    } finally {
      setProcesando(false);
    }
  };

  // Filtrar alumnos por búsqueda (sin recargar desde la base de datos)
  const alumnosFiltrados = useMemo(() => {
    if (!busqueda.trim()) {
      return alumnosDisponibles;
    }
    return alumnosDisponibles.filter(alumno =>
      alumno.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [alumnosDisponibles, busqueda]);

  // Mostrar spinner solo mientras carga, no cuando hay 0 huecos
  // (el modal debe mostrarse incluso sin huecos, especialmente en modo recuperación)
  if (loading) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4' style={{ zIndex: 9999 }}>
        <LoadingSpinner size='medium' text='Cargando alumnos disponibles...' />
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4' style={{ zIndex: 9999 }}>
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <OcuparHuecosHeader
          esRecuperacion={esRecuperacion}
          evento={evento}
          huecosDisponibles={huecosDisponibles}
          onClose={onClose}
        />

        {/* Información del evento */}
        <OcuparHuecosEventoInfo
          evento={evento}
          huecosDisponibles={huecosDisponibles}
          maxAlumnos={maxAlumnos}
          alumnosSeleccionados={alumnosSeleccionados}
          procesando={procesando}
          onClose={onClose}
          onOcuparHuecos={ocuparHuecos}
        />

        {/* Contenido */}
        <OcuparHuecosAlumnosList
          alumnosFiltrados={alumnosFiltrados}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          alumnosSeleccionados={alumnosSeleccionados}
          huecosDisponibles={huecosDisponibles}
          onToggleAlumno={toggleAlumno}
        />
      </div>
    </div>
  );
}
