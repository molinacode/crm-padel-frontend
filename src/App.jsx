import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
import { FormularioAlumno } from '@features/alumnos';
import Instalaciones from './pages/Instalaciones';
import InstalacionesDetalle from './pages/InstalacionesDetalle';
import PerfilUsuario from './pages/PerfilUsuario';
import Profesores from './pages/Profesores';
import { FormularioProfesor } from '@features/profesores';
import FichaProfesor from './pages/FichaProfesor';
import Ejercicios from './pages/Ejercicios';
import { FormularioEjercicio } from '@features/ejercicios';
import FichaEjercicio from './pages/FichaEjercicio';
import SeguimientoAlumno from './pages/SeguimientoAlumno';
import VistaProfesor from './pages/VistaProfesor';
import AlumnosEscuela from './pages/AlumnosEscuela';
import OtrosAlumnos from './pages/OtrosAlumnos';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Diagnostico from './components/Diagnostico';

export default function App() {
  const { userData, loading } = useAuth();
  // Layout con navbar superior y sidebar en desktop que puede anclarse
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  useEffect(() => {
    const navHandler = e => setNavbarCollapsed(Boolean(e.detail));
    const sideHandler = e => setSidebarPinned(Boolean(e.detail));
    window.addEventListener('navbar:collapsed', navHandler);
    window.addEventListener('sidebar:desktop', sideHandler);
    return () => {
      window.removeEventListener('navbar:collapsed', navHandler);
      window.removeEventListener('sidebar:desktop', sideHandler);
    };
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-gray-700 dark:text-dark-text'>
          Cargando autenticación...
        </p>
      </div>
    );
  }

  if (!userData) {
    return <Login />;
  }

  return (
    <div className='min-h-screen'>
      <Navbar />
      <main
        className={`${navbarCollapsed ? 'pt-12' : 'pt-16'} ${navbarCollapsed ? 'md:pt-16' : 'md:pt-20'} p-4 transition-all ${sidebarPinned ? 'md:ml-64' : 'md:ml-0'}`}
      >
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/alumnos' element={<Alumnos />} />
          <Route path='/alumnos-escuela' element={<AlumnosEscuela />} />
          <Route path='/alumnos-escuela-interna' element={<OtrosAlumnos />} />
          <Route path='/alumnos/nuevo' element={<FormularioAlumno />} />
          <Route path='/alumno/:id' element={<FichaAlumno />} />
          <Route path='/alumno/:id/editar' element={<EditarAlumno />} />
          <Route
            path='/alumno/:id/seguimiento'
            element={<SeguimientoAlumno />}
          />
          <Route path='/ficha-alumno/:id' element={<FichaAlumno />} />
          <Route path='/editar-alumno/:id' element={<EditarAlumno />} />
          <Route path='/pagos' element={<Pagos />} />
          <Route path='/clases' element={<Clases />} />
          <Route path='/asistencias' element={<Asistencias />} />
          <Route path='/profesores' element={<Profesores />} />
          <Route path='/profesores/nuevo' element={<FormularioProfesor />} />
          <Route path='/profesor/:id' element={<FichaProfesor />} />
          <Route path='/profesor/:id/editar' element={<FormularioProfesor />} />
          <Route path='/ejercicios' element={<Ejercicios />} />
          <Route path='/ejercicios/nuevo' element={<FormularioEjercicio />} />
          <Route path='/ejercicio/:id' element={<FichaEjercicio />} />
          <Route
            path='/ejercicio/:id/editar'
            element={<FormularioEjercicio />}
          />
          <Route path='/instalaciones' element={<Instalaciones />} />
          <Route
            path='/instalaciones/detalle'
            element={<InstalacionesDetalle />}
          />
          <Route path='/vista-profesor' element={<VistaProfesor />} />
          <Route path='/perfil' element={<PerfilUsuario />} />
          <Route path='/diagnostico' element={<Diagnostico />} />
        </Routes>
      </main>

      {/* Banner de instalación PWA */}
      <PWAInstallPrompt />
    </div>
  );
}
