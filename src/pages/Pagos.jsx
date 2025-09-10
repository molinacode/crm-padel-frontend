import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para nuevo pago
  const [nuevoPago, setNuevoPago] = useState({
    alumno_id: '',
    cantidad: '',
    mes_cubierto: '',
    metodo: 'transferencia'
  });

  // Estado para filtro
  const [filtroAlumnoId, setFiltroAlumnoId] = useState('');

  // Cargar datos
  const cargarDatos = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando datos de pagos...');
      
      // Cargar alumnos
      const { data: alumnosData, error: alumnosError } = await supabase
        .from('alumnos')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      // Cargar pagos con información del alumno
      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos')
        .select(`
          *,
          alumnos (nombre)
        `)
        .order('fecha_pago', { ascending: false });

      if (alumnosError) {
        console.error('Error cargando alumnos:', alumnosError);
        throw alumnosError;
      }

      if (pagosError) {
        console.error('Error cargando pagos:', pagosError);
        throw pagosError;
      }

      setAlumnos(alumnosData || []);
      setPagos(pagosData || []);
      
      console.log('✅ Datos cargados:', { alumnos: alumnosData?.length, pagos: pagosData?.length });
    } catch (err) {
      console.error('💥 Error cargando datos:', err);
      setError('No se pudieron cargar los datos');
      
      // Datos de demostración si falla Supabase
      setAlumnos([
        { id: '1', nombre: 'María García', email: 'maria@email.com' },
        { id: '2', nombre: 'Carlos López', email: 'carlos@email.com' },
        { id: '3', nombre: 'Ana Martín', email: 'ana@email.com' }
      ]);
      setPagos([
        { 
          id: '1', 
          alumno_id: '1', 
          cantidad: 80, 
          mes_cubierto: '2024-01', 
          fecha_pago: '2024-01-15',
          alumnos: { nombre: 'María García' }
        },
        { 
          id: '2', 
          alumno_id: '2', 
          cantidad: 60, 
          mes_cubierto: '2024-01', 
          fecha_pago: '2024-01-14',
          alumnos: { nombre: 'Carlos López' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Manejar envío de nuevo pago
  const handleNuevoPago = async (e) => {
    e.preventDefault();
    try {
      console.log('💾 Registrando nuevo pago:', nuevoPago);
      
      const { data, error } = await supabase
        .from('pagos')
        .insert([{
          alumno_id: nuevoPago.alumno_id,
          cantidad: parseFloat(nuevoPago.cantidad),
          mes_cubierto: nuevoPago.mes_cubierto,
          metodo: nuevoPago.metodo,
          fecha_pago: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Error insertando pago:', error);
        alert('❌ Error: ' + error.message);
        return;
      }

      console.log('✅ Pago registrado:', data);
      alert('✅ Pago registrado correctamente');
      
      // Limpiar formulario
      setNuevoPago({ 
        alumno_id: '', 
        cantidad: '', 
        mes_cubierto: '', 
        metodo: 'transferencia' 
      });
      
      // Recargar datos
      cargarDatos();
      
    } catch (err) {
      console.error('💥 Error registrando pago:', err);
      alert('❌ Error de conexión');
    }
  };

  // Filtrar pagos por alumno
  const pagosFiltrados = filtroAlumnoId
    ? pagos.filter(p => p.alumno_id === filtroAlumnoId)
    : pagos;

  // Obtener nombre del alumno filtrado
  const alumnoSeleccionado = alumnos.find(a => a.id === filtroAlumnoId);

  if (loading) return <p className="text-center py-8 text-gray-700 dark:text-dark-text">Cargando datos...</p>;
  if (error) return <p className="text-red-500 dark:text-red-400 text-center">{error}</p>;

  return (
    <div>
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-100 dark:border-green-800/30 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
              💰 Gestión de Pagos
            </h1>
            <p className="text-gray-600 dark:text-dark-text2">
              Administra los pagos de tus alumnos
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Formulario de registro */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Registrar Pago</h3>
          </div>
          <form onSubmit={handleNuevoPago} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Alumno *</label>
              <select
                name="alumno_id"
                value={nuevoPago.alumno_id}
                onChange={e => setNuevoPago({ ...nuevoPago, alumno_id: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
              >
                <option value="">Selecciona un alumno</option>
                {alumnos.map(alumno => (
                  <option key={alumno.id} value={alumno.id}>{alumno.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Cantidad (€) *</label>
              <input
                type="number"
                step="0.01"
                name="cantidad"
                value={nuevoPago.cantidad}
                onChange={e => setNuevoPago({ ...nuevoPago, cantidad: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                placeholder="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Mes cubierto *</label>
              <input
                type="month"
                name="mes_cubierto"
                value={nuevoPago.mes_cubierto}
                onChange={e => setNuevoPago({ ...nuevoPago, mes_cubierto: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Método</label>
              <select
                name="metodo"
                value={nuevoPago.metodo}
                onChange={e => setNuevoPago({ ...nuevoPago, metodo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Registrar Pago
            </button>
          </form>
        </div>

        {/* Filtro y listado */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Buscar Pagos</h3>
          </div>
          
          {/* Selector de alumno */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Seleccionar Alumno</label>
            <select
              value={filtroAlumnoId}
              onChange={e => setFiltroAlumnoId(e.target.value)}
              className="input w-full"
            >
              <option value="">Ver todos los pagos</option>
              {alumnos.map(alumno => (
                <option key={alumno.id} value={alumno.id}>{alumno.nombre}</option>
              ))}
            </select>
          </div>

          {/* Título dinámico */}
          <h4 className="font-semibold text-gray-800 dark:text-dark-text mb-3">
            {filtroAlumnoId
              ? `Pagos de: ${alumnoSeleccionado?.nombre || 'Alumno'}`
              : 'Todos los pagos registrados'}
          </h4>

          {/* Botón limpiar filtro */}
          {filtroAlumnoId && (
            <button
              onClick={() => setFiltroAlumnoId('')}
              className="text-xs text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text mb-3"
            >
              🔁 Ver todos los pagos
            </button>
          )}

          {/* Tabla de pagos */}
          {pagosFiltrados.length === 0 ? (
            <p className="text-gray-500">No hay pagos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Alumno</th>
                      <th>Cantidad
                    </th>
                    <th>Mes</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosFiltrados.map(pago => (
                    <tr key={pago.id}>
                      <td>{pago.alumnos?.nombre || 'Alumno eliminado'}</td>
                      <td className="font-semibold text-green-600">€{pago.cantidad}</td>
                      <td>{pago.mes_cubierto}</td>
                      <td>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}