// src/App.jsx
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
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

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
        } else {
          setSession(session);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    supabase.auth.signOut();
    setSession(null);
  };

  if (!session) {
    return <Login onLogin={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar onLogout={handleLogout} />
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

          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;