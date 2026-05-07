export interface PagoCsvAlumno {
  nombre?: string | null;
}

export interface PagoCsvRow {
  alumnos?: PagoCsvAlumno | null;
  cantidad?: number | string | null;
  tipo_pago?: string | null;
  mes_cubierto?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  clases_cubiertas?: number | string | null;
  metodo?: string | null;
  fecha_pago?: string | null;
}

export function exportarPagosCsv(
  pagos: PagoCsvRow[] | null | undefined,
  nombreArchivo = 'pagos.csv'
): void {
  const filas: string[] = [];
  const cabecera = [
    'Alumno',
    'Cantidad',
    'Tipo pago',
    'Mes cubierto',
    'Fecha inicio',
    'Fecha fin',
    'Clases cubiertas',
    'Método',
    'Fecha pago',
  ];
  filas.push(cabecera.join(';'));

  (pagos ?? []).forEach(p => {
    const fila = [
      p.alumnos?.nombre ?? '',
      p.cantidad ?? '',
      p.tipo_pago ?? '',
      p.mes_cubierto ?? '',
      p.fecha_inicio ?? '',
      p.fecha_fin ?? '',
      p.clases_cubiertas ?? '',
      p.metodo ?? '',
      p.fecha_pago ?? '',
    ].map(valor =>
      typeof valor === 'string' ? valor.replace(/;/g, ',').trim() : valor
    );
    filas.push(fila.join(';'));
  });

  const contenido = filas.join('\n');
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
