import { useMemo } from 'react';

export function useSeguimientoStats(asistencias = [], seguimientos = []) {
  return useMemo(() => {
    const totalAsistencias = asistencias.length;
    const asistenciasPresentes = asistencias.filter(a => a.presente).length;
    const porcentajeAsistencia = totalAsistencias > 0 ? Math.round((asistenciasPresentes / totalAsistencias) * 100) : 0;
    const totalSeguimientos = seguimientos.length;

    return {
      totalAsistencias,
      asistenciasPresentes,
      porcentajeAsistencia,
      totalSeguimientos,
    };
  }, [asistencias, seguimientos]);
}


