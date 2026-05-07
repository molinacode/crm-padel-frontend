import { useState } from 'react';
import type { RefObject } from 'react';
import { domToPngSafe } from '../utils/domToPngSafe';

interface AlumnoListado {
  nombre?: string | null;
  email?: string | null;
  telefono?: string | null;
  nivel?: string | null;
  activo?: boolean | null;
  created_at?: string | null;
  observaciones?: string | null;
}

interface ExportarListadoProps {
  datos: AlumnoListado[];
  nombreArchivo?: string;
  titulo?: string;
  elementoRef?: RefObject<Element> | Element | null;
}

export default function ExportarListado({
  datos,
  nombreArchivo = 'listado',
  titulo = 'Listado de Alumnos',
  elementoRef = null,
}: ExportarListadoProps) {
  const [exportando, setExportando] = useState(false);

  const exportarCSV = async () => {
    try {
      setExportando(true);

      const datosCSV = datos.map((alumno, index) => ({
        Nº: index + 1,
        Nombre: alumno.nombre || '',
        Email: alumno.email || '',
        Teléfono: alumno.telefono || '',
        Nivel: alumno.nivel || '',
        Estado: alumno.activo === false ? 'Inactivo' : 'Activo',
        'Fecha Registro': alumno.created_at
          ? new Date(alumno.created_at).toLocaleDateString('es-ES')
          : '',
        Observaciones: alumno.observaciones || '',
      }));

      const headers = [
        'Nº',
        'Nombre',
        'Email',
        'Teléfono',
        'Nivel',
        'Estado',
        'Fecha Registro',
        'Observaciones',
      ] as const;
      const csvContent = [
        headers.join(','),
        ...datosCSV.map(row =>
          headers
            .map(header => {
              const raw = row[header];
              const value = raw === undefined || raw === null ? '' : String(raw);
              const escapedValue = value.replace(/"/g, '""');
              return value.includes(',') ||
                value.includes('"') ||
                value.includes('\n')
                ? `"${escapedValue}"`
                : escapedValue;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${nombreArchivo}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exportando a CSV:', error);
      alert('Error al exportar a CSV');
    } finally {
      setExportando(false);
    }
  };

  const exportarPDF = async () => {
    try {
      setExportando(true);
      const { default: jsPDF } = await import('jspdf');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generado el: ${new Date().toLocaleDateString('es-ES')}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      doc.text(
        `Total de registros: ${datos.length}`,
        pageWidth / 2,
        yPosition + 5,
        { align: 'center' }
      );
      yPosition += 20;

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
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      datos.forEach((alumno, index) => {
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
          alumno.activo === false ? 'Inactivo' : 'Activo',
        ];

        xPosition = 10;
        fila.forEach((celda, celdaIndex) => {
          const texto =
            celda.length > 20 ? celda.substring(0, 17) + '...' : celda;
          doc.text(texto, xPosition, yPosition);
          xPosition += anchos[celdaIndex];
        });

        yPosition += 6;
      });

      doc.save(`${nombreArchivo}.pdf`);
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      alert('Error al exportar a PDF');
    } finally {
      setExportando(false);
    }
  };

  const exportarPNG = async () => {
    try {
      setExportando(true);

      const target =
        elementoRef &&
        typeof elementoRef === 'object' &&
        'current' in elementoRef
          ? elementoRef.current
          : elementoRef;

      if (!target || !(target instanceof Element) || !target.isConnected) {
        alert(
          'No se puede capturar: el listado no está en el documento o aún no está visible.'
        );
        return;
      }

      const dataUrl = await domToPngSafe(target);
      const link = document.createElement('a');
      link.setAttribute('href', dataUrl);
      link.setAttribute('download', `${nombreArchivo}.png`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exportando a PNG:', error);
      alert('Error al exportar a PNG');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className='flex flex-wrap gap-2'>
      <button
        type='button'
        onClick={exportarCSV}
        disabled={exportando || datos.length === 0}
        className='bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2'
        title='Exportar a CSV (.csv)'
      >
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
        {exportando ? 'Exportando...' : 'CSV'}
      </button>

      <button
        type='button'
        onClick={exportarPDF}
        disabled={exportando || datos.length === 0}
        className='bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2'
        title='Exportar a PDF'
      >
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
          />
        </svg>
        {exportando ? 'Exportando...' : 'PDF'}
      </button>

      <button
        type='button'
        onClick={exportarPNG}
        disabled={exportando || datos.length === 0 || !elementoRef}
        className='bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2'
        title='Exportar como imagen PNG'
      >
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
        {exportando ? 'Exportando...' : 'PNG'}
      </button>
    </div>
  );
}
