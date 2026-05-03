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
      badgeClass: 'bg-gray-100 text-gray-800',
      label: '❌ Cancelada',
    };
  }

  if (esMixta) {
    return {
      className: 'border-l-4 border-cyan-500 bg-cyan-50 text-cyan-900',
      badgeClass: 'bg-cyan-100 text-cyan-800',
      label: '🔀 Mixta',
    };
  }

  if (esModificadoIndividualmente) {
    return {
      className: 'border-l-4 border-indigo-500 bg-indigo-50 text-indigo-900',
      badgeClass: 'bg-indigo-100 text-indigo-800',
      label: '📅 Modificado',
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
      badgeClass: 'bg-purple-100 text-purple-800',
      label: '🎯 Particular',
    };
  }
  if (esInterna) {
    return {
      className: 'border-l-4 border-green-500 bg-green-50 text-green-900',
      badgeClass: 'bg-green-100 text-green-800',
      label: '🏠 Interna',
    };
  }
  if (esEscuela) {
    return {
      className: 'border-l-4 border-orange-500 bg-orange-50 text-orange-900',
      badgeClass: 'bg-orange-100 text-orange-800',
      label: '🏫 Escuela',
    };
  }
  return {
    className: 'border-l-4 border-blue-500 bg-blue-50 text-blue-900',
    badgeClass: 'bg-blue-100 text-blue-800',
    label: '👥 Grupal',
  };
}
