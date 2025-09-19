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
import Profesores from './pages/Profesores';
import FormularioProfesor from './components/FormularioProfesor';
import FichaProfesor from './pages/FichaProfesor';
import Ejercicios from './pages/Ejercicios';
import FormularioEjercicio from './components/FormularioEjercicio';
import FichaEjercicio from './pages/FichaEjercicio';
import SeguimientoAlumno from './pages/SeguimientoAlumno';
import VistaProfesor from './pages/VistaProfesor';
import PWAInstallPrompt from './components/PWAInstallPrompt';

export default function App() {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-700 dark:text-dark-text">Cargando autenticación...</p>
      </div>
    );
  }

  if (!userData) {
    return <Login />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="md:ml-64 pt-16 md:pt-4 p-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alumnos" element={<Alumnos />} />
          <Route path="/alumnos/nuevo" element={<FormularioAlumno />} />
          <Route path="/alumno/:id" element={<FichaAlumno />} />
          <Route path="/alumno/:id/editar" element={<EditarAlumno />} />
          <Route path="/alumno/:id/seguimiento" element={<SeguimientoAlumno />} />
          <Route path="/pagos" element={<Pagos />} />
          <Route path="/clases" element={<Clases />} />
          <Route path="/asistencias" element={<Asistencias />} />
          <Route path="/profesores" element={<Profesores />} />
          <Route path="/profesores/nuevo" element={<FormularioProfesor />} />
          <Route path="/profesor/:id" element={<FichaProfesor />} />
          <Route path="/profesor/:id/editar" element={<FormularioProfesor />} />
          <Route path="/ejercicios" element={<Ejercicios />} />
          <Route path="/ejercicios/nuevo" element={<FormularioEjercicio />} />
          <Route path="/ejercicio/:id" element={<FichaEjercicio />} />
          <Route path="/ejercicio/:id/editar" element={<FormularioEjercicio />} />
          <Route path="/instalaciones" element={<Instalaciones />} />
          <Route path="/vista-profesor" element={<VistaProfesor />} />
          <Route path="/perfil" element={<PerfilUsuario />} />
        </Routes>
      </main>

      {/* Banner de instalación PWA */}
      <PWAInstallPrompt />
    </div>
  );
}