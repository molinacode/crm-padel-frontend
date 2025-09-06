// src/pages/Pagos.jsx
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

  if (loading) return <p className="text-center py-8">Cargando datos...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">💵 Gestión de Pagos</h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Formulario de registro */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">➕ Registrar Pago</h3>
          <form onSubmit={handleNuevoPago} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Alumno *</label>
              <select
                name="alumno_id"
                value={nuevoPago.alumno_id}
                onChange={e => setNuevoPago({ ...nuevoPago, alumno_id: e.target.value })}
                required
                className="input w-full"
              >
                <option value="">Selecciona un alumno</option>
                {alumnos.map(alumno => (
                  <option key={alumno.id} value={alumno.id}>{alumno.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cantidad (€) *</label>
              <input
                type="number"
                step="0.01"
                name="cantidad"
                value={nuevoPago.cantidad}
                onChange={e => setNuevoPago({ ...nuevoPago, cantidad: e.target.value })}
                required
                className="input w-full"
                placeholder="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mes cubierto *</label>
              <input
                type="month"
                name="mes_cubierto"
                value={nuevoPago.mes_cubierto}
                onChange={e => setNuevoPago({ ...nuevoPago, mes_cubierto: e.target.value })}
                required
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Método</label>
              <select
                name="metodo"
                value={nuevoPago.metodo}
                onChange={e => setNuevoPago({ ...nuevoPago, metodo: e.target.value })}
                className="input w-full"
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            <button type="submit" className="btn-primary">Registrar Pago</button>
          </form>
        </div>

        {/* Filtro y listado */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🔍 Buscar Pagos por Alumno</h3>
          
          {/* Selector de alumno */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Seleccionar Alumno</label>
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
          <h4 className="font-semibold text-gray-800 mb-3">
            {filtroAlumnoId
              ? `Pagos de: ${alumnoSeleccionado?.nombre || 'Alumno'}`
              : 'Todos los pagos registrados'}
          </h4>

          {/* Botón limpiar filtro */}
          {filtroAlumnoId && (
            <button
              onClick={() => setFiltroAlumnoId('')}
              className="text-xs text-gray-500 hover:text-gray-700 mb-3"
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