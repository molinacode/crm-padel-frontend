import jsPDF from 'jspdf';

export function generarReciboPagoPdf(pago) {
  if (!pago) return;

  const doc = new jsPDF();
  const marginLeft = 20;
  let y = 20;

  doc.setFontSize(16);
  doc.text('Recibo de pago - CRM Pádel', marginLeft, y);
  y += 10;

  doc.setFontSize(11);
  doc.text(`Alumno: ${pago.alumnos?.nombre || 'Alumno'}`, marginLeft, y);
  y += 7;
  doc.text(
    `Cantidad: ${Number(pago.cantidad || 0).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    })}`,
    marginLeft,
    y
  );
  y += 7;

  const tipoLegible =
    pago.tipo_pago === 'mensual'
      ? 'Mensual'
      : pago.tipo_pago === 'clases'
      ? 'Por clases'
      : pago.tipo_pago || 'N/A';

  doc.text(`Tipo de pago: ${tipoLegible}`, marginLeft, y);
  y += 7;

  if (pago.mes_cubierto) {
    doc.text(`Mes cubierto: ${pago.mes_cubierto}`, marginLeft, y);
    y += 7;
  } else if (pago.fecha_inicio && pago.fecha_fin) {
    doc.text(
      `Período: ${new Date(pago.fecha_inicio).toLocaleDateString(
        'es-ES'
      )} - ${new Date(pago.fecha_fin).toLocaleDateString('es-ES')}`,
      marginLeft,
      y
    );
    y += 7;
  }

  doc.text(`Método: ${pago.metodo || 'N/A'}`, marginLeft, y);
  y += 7;

  if (pago.fecha_pago) {
    doc.text(
      `Fecha de pago: ${new Date(pago.fecha_pago).toLocaleDateString('es-ES')}`,
      marginLeft,
      y
    );
    y += 7;
  }

  y += 10;
  doc.setFontSize(10);
  doc.text(
    'Este recibo ha sido generado automáticamente por CRM Pádel.',
    marginLeft,
    y
  );

  const nombreArchivo = `recibo-pago-${pago.id || 'crm-padel'}.pdf`;
  doc.save(nombreArchivo);
}

