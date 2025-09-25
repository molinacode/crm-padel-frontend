import { useState } from 'react';

export default function ExportarListado({
    datos,
    nombreArchivo = 'listado',
    titulo = 'Listado de Alumnos',
    elementoRef = null // Referencia al elemento para captura PNG
}) {
    const [exportando, setExportando] = useState(false);

  // Función para exportar a Excel
  const exportarExcel = async () => {
    try {
      setExportando(true);
      
      // Importación dinámica de XLSX
      const XLSX = await import('xlsx');
      const { saveAs } = await import('file-saver');
      
      // Preparar datos para Excel
      const datosExcel = datos.map((alumno, index) => ({
        'Nº': index + 1,
        'Nombre': alumno.nombre || '',
        'Email': alumno.email || '',
        'Teléfono': alumno.telefono || '',
        'Nivel': alumno.nivel || '',
        'Estado': alumno.activo === false ? 'Inactivo' : 'Activo',
        'Fecha Registro': alumno.created_at ? new Date(alumno.created_at).toLocaleDateString('es-ES') : '',
        'Observaciones': alumno.observaciones || ''
      }));

      // Crear hoja de trabajo
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      
      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 5 },   // Nº
        { wch: 25 },  // Nombre
        { wch: 30 },  // Email
        { wch: 15 },  // Teléfono
        { wch: 20 },  // Nivel
        { wch: 10 },  // Estado
        { wch: 15 },  // Fecha Registro
        { wch: 40 }   // Observaciones
      ];
      ws['!cols'] = colWidths;

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');

      // Generar archivo
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(dataBlob, `${nombreArchivo}.xlsx`);
      
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar a Excel');
    } finally {
      setExportando(false);
    }
  };

  // Función para exportar a PDF
  const exportarPDF = async () => {
    try {
      setExportando(true);
      
      // Importación dinámica de jsPDF
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Información del archivo
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
      doc.text(`Total de registros: ${datos.length}`, pageWidth / 2, yPosition + 5, { align: 'center' });
      yPosition += 20;

      // Encabezados de tabla
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const columnas = ['Nº', 'Nombre', 'Email', 'Teléfono', 'Nivel', 'Estado'];
      const anchos = [15, 50, 60, 30, 25, 20];
      let xPosition = 10;

      columnas.forEach((col, index) => {
        doc.text(col, xPosition, yPosition);
        xPosition += anchos[index];
      });
      
      yPosition += 8;
      
      // Línea separadora
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 5;

      // Datos
      doc.setFont('helvetica', 'normal');
      datos.forEach((alumno, index) => {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        const fila = [
          (index + 1).toString(),
          alumno.nombre || '',
          alumno.email || '',
          alumno.telefono || '',
          alumno.nivel || '',
          alumno.activo === false ? 'Inactivo' : 'Activo'
        ];

        xPosition = 10;
        fila.forEach((celda, celdaIndex) => {
          // Truncar texto si es muy largo
          const texto = celda.length > 20 ? celda.substring(0, 17) + '...' : celda;
          doc.text(texto, xPosition, yPosition);
          xPosition += anchos[celdaIndex];
        });

        yPosition += 6;
      });

      // Guardar archivo
      doc.save(`${nombreArchivo}.pdf`);
      
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      alert('Error al exportar a PDF');
    } finally {
      setExportando(false);
    }
  };

  // Función para exportar a PNG (captura de pantalla)
  const exportarPNG = async () => {
    try {
      setExportando(true);
      
      if (!elementoRef) {
        alert('No se puede capturar la pantalla. Elemento no encontrado.');
        return;
      }

      // Importación dinámica de html2canvas y file-saver
      const html2canvas = await import('html2canvas');
      const { saveAs } = await import('file-saver');

      // Capturar el elemento como imagen
      const canvas = await html2canvas.default(elementoRef, {
        scale: 2, // Mayor resolución
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Convertir a blob y descargar
      canvas.toBlob((blob) => {
        saveAs(blob, `${nombreArchivo}.png`);
      }, 'image/png');
      
    } catch (error) {
      console.error('Error exportando a PNG:', error);
      alert('Error al exportar a PNG');
    } finally {
      setExportando(false);
    }
  };

    return (
        <div className="flex flex-wrap gap-2">
            <button
                onClick={exportarExcel}
                disabled={exportando || datos.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                title="Exportar a Excel (.xlsx)"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exportando ? 'Exportando...' : 'Excel'}
            </button>

            <button
                onClick={exportarPDF}
                disabled={exportando || datos.length === 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                title="Exportar a PDF"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {exportando ? 'Exportando...' : 'PDF'}
            </button>

            <button
                onClick={exportarPNG}
                disabled={exportando || datos.length === 0 || !elementoRef}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                title="Exportar como imagen PNG"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {exportando ? 'Exportando...' : 'PNG'}
            </button>
        </div>
    );
}
