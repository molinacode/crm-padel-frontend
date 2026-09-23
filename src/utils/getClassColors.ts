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
      className: 'line-through opacity-50 text-gray-400 bg-gray-100',
      badgeClass: 'bg-[#1c241e] text-[#8c8678]',
      label: 'Cancelada',
    };
  }

  if (esMixta) {
    return {
      className: 'border-l-4 border-cyan-500 bg-cyan-50 text-cyan-900',
      badgeClass: 'bg-[#1c241e] text-[#d8d2c4]',
      label: 'Mixta',
    };
  }

  if (esModificadoIndividualmente) {
    return {
      className: 'border-l-4 border-indigo-500 bg-indigo-50 text-indigo-900',
      badgeClass: 'bg-[#1c241e] text-[#d8d2c4]',
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
      className: 'border-l-4 border-purple-500 bg-purple-50 text-purple-900',
      badgeClass: 'bg-[#1c241e] text-[#f5f1e8]',
      label: 'Particular',
    };
  }
  if (esInterna) {
    return {
      className: 'border-l-4 border-green-500 bg-green-50 text-green-900',
      badgeClass: 'border border-[#2a332c] text-[#d8d2c4]',
      label: 'Interna',
    };
  }
  if (esEscuela) {
    return {
      className: 'border-l-4 border-orange-500 bg-orange-50 text-orange-900',
      badgeClass: 'bg-[#c9a658] text-[#0e1410]',
      label: 'Escuela',
    };
  }
  return {
    className: 'border-l-4 border-blue-500 bg-blue-50 text-blue-900',
    badgeClass: 'border border-[#c9a658] text-[#c9a658]',
    label: 'Grupal',
  };
}
