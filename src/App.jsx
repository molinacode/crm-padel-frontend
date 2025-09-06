import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/navbar';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Alumnos from './pages/Alumnos';
import Pagos from './pages/Pagos';
import Clases from './pages/Clases';
import Asistencias from './pages/Asistencias';
import FichaAlumno from './pages/FichaAlumno';
import EditarAlumno from './pages/EditarAlumno';
import FormularioAlumno from './components/FormularioAlumno';
import Instalaciones from './pages/Instalaciones';
import PerfilUsuario from './pages/PerfilUsuario';

export default function App() {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando autenticación...</p>
      </div>
    );
  }

  if (!userData) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ml-64 pt-16 p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alumnos" element={<Alumnos />} />
          <Route path="/alumnos/nuevo" element={<FormularioAlumno />} />
          <Route path="/alumno/:id" element={<FichaAlumno />} />
          <Route path="/alumno/:id/editar" element={<EditarAlumno />} />
          <Route path="/pagos" element={<Pagos />} />
          <Route path="/clases" element={<Clases />} />
          <Route path="/asistencias" element={<Asistencias />} />
          <Route path="/instalaciones" element={<Instalaciones />} />
          <Route path="/perfil" element={<PerfilUsuario />} />
        </Routes>
      </main>
    </div>
  );
}