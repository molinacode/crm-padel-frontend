import { Building2 } from 'lucide-react';
import PageHeader from '../shared/PageHeader';
import { verificarTablaGastos } from '../../utils/verificarTablaGastos';

interface InstalacionesHeaderProps {
  onAgregarGasto: () => void;
}

export default function InstalacionesHeader({
  onAgregarGasto,
}: InstalacionesHeaderProps) {
  const handleDiagnostico = async () => {
    console.log('Ejecutando diagnóstico de gastos...');
    const verificacion = await verificarTablaGastos();
    if (verificacion.success) {
      alert(
        `Diagnóstico exitoso\n\nGastos encontrados: ${verificacion.data?.length || 0}\n\nRevisa la consola para más detalles.`
      );
    } else {
      const err = verificacion.error as { message?: string } | undefined;
      alert(
        `Problema detectado\n\nError: ${err?.message || 'Error desconocido'}\n\nRevisa la consola para más detalles.`
      );
    }
  };

  return (
    <PageHeader
      title='Gestión de Instalaciones'
      subtitle='Control de gastos e ingresos por períodos'
      icon={<Building2 className='h-8 w-8' strokeWidth={1.5} />}
      actions={
        <>
          <button
            type='button'
            onClick={handleDiagnostico}
            className='rounded-lg border border-[#2a332c] px-4 py-2 font-semibold text-[#f5f1e8]'
          >
            Diagnosticar Gastos
          </button>
          <button
            type='button'
            onClick={onAgregarGasto}
            className='rounded-lg bg-[#c9a658] px-4 py-2 font-semibold text-[#0e1410]'
          >
            Agregar Gasto Material
          </button>
        </>
      }
    />
  );
}
