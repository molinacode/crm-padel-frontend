import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { LoadingSpinner } from '@shared';
import {
  FormularioGastoMaterial,
  ListaGastosMaterial,
} from '@features/instalaciones';
import {
  InstalacionesHeader,
  InstalacionesStatsCard,
  useInstalacionesData,
  StatsResumenGrid,
  InstalacionesInfoBox,
  InstalacionesChartPanel,
} from '@features/instalaciones';
import { supabase } from '../lib/supabase';
import { useInstalacionesStats } from '../hooks/useInstalacionesStats';
import { useGastosMaterialHandlers } from '../hooks/useGastosMaterialHandlers';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Instalaciones() {
  const navigate = useNavigate();
  const { eventos, pagos, gastosMaterial, loading } = useInstalacionesData();
  const [gastosMaterialLocal, setGastosMaterial] = useState([]);
  useEffect(() => {
    setGastosMaterial(Array.isArray(gastosMaterial) ? gastosMaterial : []);
  }, [gastosMaterial]);
  const [tabActiva, setTabActiva] = useState('diario');
  const [mostrarFormularioGasto, setMostrarFormularioGasto] = useState(false);
  const [gastoEditar, setGastoEditar] = useState(null);
  const [pagosInternasMap, setPagosInternasMap] = useState(new Map());

  // Funciones para manejar gastos de material
  const {
    eliminarGastoMaterial: hEliminarGasto,
    editarGastoMaterial: hEditarGasto,
    actualizarGastoMaterial: hActualizarGasto,
    agregarGastoMaterial: hAgregarGasto,
  } = useGastosMaterialHandlers(
    setGastosMaterial,
    setMostrarFormularioGasto,
    setGastoEditar
  );

  // Cargar estados de pago de clases internas para el rango de eventos presentes
  useEffect(() => {
    const cargarPagosInternas = async () => {
      try {
        if (!Array.isArray(eventos) || eventos.length === 0) {
          setPagosInternasMap(new Map());
          return;
        }
        const fechas = eventos
          .map(e => e.fecha)
          .filter(Boolean)
          .sort();
        const fechaInicio = fechas[0];
        const fechaFin = fechas[fechas.length - 1];
        const claseIds = Array.from(
          new Set(eventos.map(e => e.clases?.id || e.clase_id).filter(Boolean))
        );
        if (claseIds.length === 0) {
          setPagosInternasMap(new Map());
          return;
        }
        const { data, error } = await supabase
          .from('pagos_clases_internas')
          .select('clase_id, fecha, estado')
          .in('clase_id', claseIds)
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin);
        if (error) throw error;
        const map = new Map(
          (data || []).map(p => [`${p.clase_id}|${p.fecha}`, p.estado])
        );
        setPagosInternasMap(map);
      } catch (e) {
        console.error('Error cargando pagos internas:', e);
        setPagosInternasMap(new Map());
      }
    };
    cargarPagosInternas();
  }, [eventos]);

  // Calcular tipo de clase según nuevos criterios
  const getTipoClase = (nombre, tipoClase) => {
    const t = (tipoClase || '').toLowerCase().trim();
    const n = (nombre || '').toLowerCase().trim();
    const matches = term => t.includes(term) || n.includes(term);

    if (matches('interna'))
      return { tipo: 'ingreso', valor: 15, descripcion: 'Clase interna' };
    if (matches('escuela'))
      return { tipo: 'gasto', valor: 21, descripcion: 'Alquiler escuela' };
    if (matches('particular'))
      return {
        tipo: 'neutro',
        valor: 0,
        descripcion: 'Clase particular (ingreso manual)',
      };
    if (matches('grupal'))
      return { tipo: 'ingreso', valor: 15, descripcion: 'Clase grupal' };

    return { tipo: 'neutro', valor: 0, descripcion: 'Clase normal' };
  };

  // (helpers de fecha movidos a hooks)

  const { datosProcesados, estadisticas } = useInstalacionesStats({
    eventos,
    pagos,
    gastosMaterial: gastosMaterialLocal,
    pagosInternasMap,
    getTipoClase,
  });

  // Debug: verificar estadísticas
  useEffect(() => {
    console.log('📊 Estadísticas calculadas:', estadisticas);
    console.log('📅 Eventos cargados:', eventos?.length || 0);
    console.log('💰 Pagos cargados:', pagos?.length || 0);
    console.log('🛒 Gastos material:', gastosMaterialLocal?.length || 0);
  }, [estadisticas, eventos, pagos, gastosMaterialLocal]);

  // Resumen de internas (pagadas/pendientes) para el período activo
  const internasResumenPeriodo = useMemo(() => {
    if (!Array.isArray(eventos)) return { pagadas: 0, pendientes: 0 };
    const hoy = new Date();
    let inicio, fin;
    if (tabActiva === 'diario') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      fin = new Date(inicio);
    } else if (tabActiva === 'semanal') {
      inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - hoy.getDay() + 1);
      fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
    } else if (tabActiva === 'mensual') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    } else {
      inicio = new Date(hoy.getFullYear(), 0, 1);
      fin = new Date(hoy.getFullYear(), 11, 31);
    }
    const inRange = e => {
      const d = new Date(e.fecha);
      d.setHours(0, 0, 0, 0);
      return d >= inicio && d <= fin;
    };
    let pagadas = 0;
    let pendientes = 0;
    eventos.filter(inRange).forEach(ev => {
      const nombre = ev.clases?.nombre?.toLowerCase() || '';
      const tipo = ev.clases?.tipo_clase?.toLowerCase() || '';
      const esInterna = tipo.includes('interna') || nombre.includes('interna');
      if (!esInterna) return;
      const key = `${ev.clases?.id || ev.clase_id}|${ev.fecha}`;
      const estado = pagosInternasMap.get(key) || 'pendiente';
      if (estado === 'pagada') pagadas++;
      else pendientes++;
    });
    return { pagadas, pendientes };
  }, [eventos, pagosInternasMap, tabActiva]);

  // Preparar datos para gráficos
  const datosGrafico = useMemo(() => {
    const { diario, semanal, mensual, anual } = datosProcesados;

    let labels = [];
    let ingresos = [];
    let gastos = [];

    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    switch (tabActiva) {
      case 'diario': {
        // Filtrar solo fechas de los últimos 30 días y ordenar
        const fechasValidas = Object.keys(diario)
          .filter(fecha => {
            const fechaObj = new Date(fecha);
            return fechaObj >= hace30Dias && fechaObj <= hoy;
          })
          .sort();

        labels = fechasValidas;
        ingresos = labels.map(d => diario[d].ingresos);
        gastos = labels.map(d => diario[d].gastos);

        break;
      }
      case 'semanal': {
        // Filtrar solo semanas de los últimos 3 meses y ordenar
        const hoy = new Date();
        const hace3Meses = new Date();
        hace3Meses.setMonth(hoy.getMonth() - 3);

        const semanasValidas = Object.keys(semanal)
          .filter(semana => {
            // Extraer año y número de semana del formato "2024-W15"
            const [año, semanaNum] = semana.split('-W');
            const fechaSemana = new Date(parseInt(año), 0, 1);
            const diasHastaSemana = (parseInt(semanaNum) - 1) * 7;
            fechaSemana.setDate(fechaSemana.getDate() + diasHastaSemana);

            return fechaSemana >= hace3Meses && fechaSemana <= hoy;
          })
          .sort();

        labels = semanasValidas.slice(-12); // Últimas 12 semanas válidas
        ingresos = labels.map(s => semanal[s].ingresos);
        gastos = labels.map(s => semanal[s].gastos);

        console.log('📊 Semanas válidas:', labels);
        console.log('📊 Ingresos semanales:', ingresos);
        console.log('💸 Gastos semanales:', gastos);
        break;
      }
      case 'mensual':
        labels = Object.keys(mensual).sort().slice(-12); // Últimos 12 meses
        ingresos = labels.map(m => mensual[m].ingresos);
        gastos = labels.map(m => mensual[m].gastos);
        break;
      case 'anual':
        labels = Object.keys(anual).sort();
        ingresos = labels.map(a => anual[a].ingresos);
        gastos = labels.map(a => anual[a].gastos);
        break;
    }

    return { labels, ingresos, gastos };
  }, [datosProcesados, tabActiva]);

  const data = {
    labels: datosGrafico.labels,
    datasets: [
      {
        label: 'Ingresos (€)',
        data: datosGrafico.ingresos,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'Gastos (€)',
        data: datosGrafico.gastos,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Gastos e Ingresos - Vista ${tabActiva.charAt(0).toUpperCase() + tabActiva.slice(1)}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value + '€';
          },
        },
      },
    },
  };

  // Función para eliminar gasto de material
  // Handlers de gastos conectados al hook
  const editarGastoMaterial = hEditarGasto;
  const eliminarGastoMaterial = hEliminarGasto;
  const onActualizarGastoMaterial = async gastoData =>
    hActualizarGasto(gastoEditar, gastoData);
  const onAgregarGastoMaterial = async gastoData => hAgregarGasto(gastoData);

  if (loading)
    return (
      <LoadingSpinner size='large' text='Cargando datos de instalaciones...' />
    );

  return (
    <div className='space-y-8'>
      <InstalacionesHeader
        onAgregarGasto={() => setMostrarFormularioGasto(true)}
      />

      {/* Cards de estadísticas */}
      <StatsResumenGrid
        estadisticas={estadisticas}
        Card={InstalacionesStatsCard}
        onHoy={() => navigate('/instalaciones/detalle?tipo=hoy')}
        onSemana={() => navigate('/instalaciones/detalle?tipo=semana')}
        onMes={() => navigate('/instalaciones/detalle?tipo=mes')}
        onAnio={() => navigate('/instalaciones/detalle?tipo=año')}
      />

      {/* (El detalle mensual del año se muestra en la vista de detalle: tipo=año) */}

      {/* Cards internas pagadas/pendientes del período activo */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
        <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center'>
              <span className='text-green-600 dark:text-green-400'>✅</span>
            </div>
            <div>
              <div className='text-sm text-gray-500 dark:text-dark-text2'>
                Internas pagadas
              </div>
              <div className='text-2xl font-bold text-gray-900 dark:text-dark-text'>
                {internasResumenPeriodo.pagadas}
              </div>
            </div>
          </div>
        </div>
        <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center'>
              <span className='text-orange-600 dark:text-orange-400'>⏳</span>
            </div>
            <div>
              <div className='text-sm text-gray-500 dark:text-dark-text2'>
                Internas pendientes
              </div>
              <div className='text-2xl font-bold text-gray-900 dark:text-dark-text'>
                {internasResumenPeriodo.pendientes}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs y Gráfico */}
      <InstalacionesChartPanel
        tabActiva={tabActiva}
        setTabActiva={setTabActiva}
        data={data}
        options={options}
      />

      {/* Información adicional */}
      <InstalacionesInfoBox />

      {/* Lista de gastos de material */}
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='p-6 border-b border-gray-200 dark:border-dark-border'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl'>
                <svg
                  className='w-6 h-6 text-orange-600 dark:text-orange-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                  />
                </svg>
              </div>
              <div>
                <h3 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
                  Gastos de Material
                </h3>
                <p className='text-sm text-gray-500 dark:text-dark-text2'>
                  {gastosMaterial.length} gastos registrados
                  {gastosMaterial.length > 0 && (
                    <span className='ml-2 text-green-600 dark:text-green-400'>
                      ✓
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setGastoEditar(null);
                setMostrarFormularioGasto(true);
              }}
              className='bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2'
            >
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
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              Nuevo Gasto
            </button>
          </div>
        </div>

        <div className='p-6'>
          <ListaGastosMaterial
            gastos={gastosMaterialLocal}
            onEditar={editarGastoMaterial}
            onEliminar={eliminarGastoMaterial}
          />
        </div>
      </div>

      {/* Modal para agregar/editar gasto de material */}
      {mostrarFormularioGasto && (
        <FormularioGastoMaterial
          onClose={() => {
            setMostrarFormularioGasto(false);
            setGastoEditar(null);
          }}
          onSuccess={
            gastoEditar ? onActualizarGastoMaterial : onAgregarGastoMaterial
          }
          gastoEditar={gastoEditar}
        />
      )}
    </div>
  );
}
