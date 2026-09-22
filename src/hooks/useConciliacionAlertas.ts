import { useEffect, useState } from 'react';
import { obtenerNotificacionesAdminNoLeidas } from '../services/notificacionesAdminService';

const STORAGE_KEY = 'conciliacion_pendientes_local';

function leerPendientesLocal(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const num = Number(raw || 0);
  return Number.isFinite(num) ? num : 0;
}

export function actualizarPendientesConciliacionLocal(total: number): void {
  if (typeof window === 'undefined') return;
  const safe = Math.max(0, total || 0);
  window.localStorage.setItem(STORAGE_KEY, String(safe));
  window.dispatchEvent(
    new CustomEvent<number>('conciliacion:pending-count', { detail: safe })
  );
}

export default function useConciliacionAlertas() {
  const [pendientesLocal, setPendientesLocal] = useState<number>(() =>
    leerPendientesLocal()
  );
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<number>;
      setPendientesLocal(Math.max(0, Number(custom.detail || 0)));
    };
    window.addEventListener('conciliacion:pending-count', handler);
    return () => window.removeEventListener('conciliacion:pending-count', handler);
  }, []);

  useEffect(() => {
    let active = true;
    const cargar = async () => {
      const noLeidas = await obtenerNotificacionesAdminNoLeidas();
      if (active) setNotificacionesNoLeidas(noLeidas);
    };
    void cargar();
    const timer = window.setInterval(() => {
      void cargar();
    }, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return {
    pendientesConciliacion: pendientesLocal,
    notificacionesConciliacion: notificacionesNoLeidas,
    totalAlertasConciliacion: pendientesLocal + notificacionesNoLeidas,
  };
}
