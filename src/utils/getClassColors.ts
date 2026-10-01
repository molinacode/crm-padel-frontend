export interface ClaseParaColor {
  tipo_clase?: string | null;
  nombre?: string | null;
}

export interface ClassColorStyles {
  className: string;
  badgeClass: string;
  label: string;
}

export function getClassColors(
  clase: ClaseParaColor,
  isCanceled = false,
  esMixta = false,
  esModificadoIndividualmente = false
): ClassColorStyles {
  if (isCanceled) {
    return {
      className:
        'line-through opacity-60 text-neutral-500 bg-neutral-100 dark:bg-dark-surface2 dark:text-dark-text2',
      badgeClass:
        'bg-neutral-100 text-neutral-600 dark:bg-dark-surface2 dark:text-dark-text2',
      label: 'Cancelada',
    };
  }

  if (esMixta) {
    return {
      className:
        'border-l-4 border-neutral-400 bg-neutral-50 text-neutral-900 dark:border-neutral-500 dark:bg-dark-surface2 dark:text-dark-text',
      badgeClass:
        'bg-neutral-100 text-neutral-700 dark:bg-dark-surface2 dark:text-dark-text2',
      label: 'Mixta',
    };
  }

  if (esModificadoIndividualmente) {
    return {
      className:
        'border-l-4 border-neutral-500 bg-neutral-50 text-neutral-800 dark:border-neutral-500 dark:bg-dark-surface dark:text-dark-text2',
      badgeClass:
        'bg-neutral-100 text-neutral-700 dark:bg-dark-surface2 dark:text-dark-text2',
      label: 'Modificado',
    };
  }

  const esParticular = clase.tipo_clase === 'particular';
  const esInterna =
    clase.tipo_clase === 'interna' ||
    clase.nombre?.toLowerCase().includes('interna');
  const esEscuela =
    clase.tipo_clase === 'escuela' ||
    clase.nombre?.toLowerCase().includes('escuela');

  if (esParticular) {
    return {
      className:
        'border-l-4 border-fuchsia-600 bg-fuchsia-50 text-fuchsia-950 dark:border-fuchsia-400 dark:bg-fuchsia-950/40 dark:text-fuchsia-100',
      badgeClass:
        'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-900/50 dark:text-fuchsia-100',
      label: 'Particular',
    };
  }
  if (esInterna) {
    return {
      className:
        'border-l-4 border-emerald-600 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100',
      badgeClass:
        'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100',
      label: 'Interna',
    };
  }
  if (esEscuela) {
    return {
      className:
        'border-l-4 border-[#c9a658] bg-[#f7f3ea] text-[#0e1410] dark:bg-[#1c241e] dark:text-[#f5f1e8]',
      badgeClass: 'bg-[#c9a658] text-[#0e1410]',
      label: 'Escuela',
    };
  }
  return {
    className:
      'border-l-4 border-teal-600 bg-teal-50 text-teal-950 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-100',
    badgeClass:
      'bg-teal-100 text-teal-900 dark:bg-teal-900/50 dark:text-teal-100',
    label: 'Grupal',
  };
}
