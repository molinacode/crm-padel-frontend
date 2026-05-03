export type OrigenAsignacion = 'escuela' | 'interna';

export interface ClaseConNombre {
  nombre?: string | null;
}

export interface AsignacionPermanenteLike {
  alumno_id: string;
  origen?: string | null;
}

export function obtenerOrigenMasComun(
  origenes: string[] | null | undefined
): string | null {
  if (!origenes || origenes.length === 0) {
    return null;
  }

  const frecuencia: Record<string, number> = {};
  origenes.forEach(o => {
    frecuencia[o] = (frecuencia[o] ?? 0) + 1;
  });

  return Object.keys(frecuencia).reduce((a, b) =>
    frecuencia[a] > frecuencia[b] ? a : b
  );
}

export function determinarOrigenAutomatico(
  clase: ClaseConNombre | null | undefined
): OrigenAsignacion {
  if (!clase) return 'escuela';

  if (clase.nombre?.toLowerCase().includes('escuela')) {
    return 'escuela';
  }

  if (clase.nombre?.toLowerCase().includes('interna')) {
    return 'interna';
  }

  return 'escuela';
}

export function obtenerOrigenDeAlumno(
  alumnoId: string,
  asignacionesPermanentes: AsignacionPermanenteLike[]
): string | null {
  const origenesAlumno = asignacionesPermanentes
    .filter(ap => ap.alumno_id === alumnoId && ap.origen)
    .map(ap => ap.origen as string);

  return obtenerOrigenMasComun(origenesAlumno);
}
