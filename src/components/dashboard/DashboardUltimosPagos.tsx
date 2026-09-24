import { SectionCard } from '../shared';

interface UltimoPago {
  alumno: string;
  mes: string;
  cantidad: number;
  fecha: string;
}

interface DashboardUltimosPagosProps {
  ultimosPagos: UltimoPago[];
}

export default function DashboardUltimosPagos({ ultimosPagos }: DashboardUltimosPagosProps) {
  return (
    <SectionCard title="Últimos pagos" iconColor="green">
      {ultimosPagos.length === 0 ? (
        <p className="text-sm text-[#8c8678]">No hay pagos registrados</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {ultimosPagos.slice(0, 8).map((pago, index) => (
            <div key={index} className="w-56 shrink-0 rounded-lg border border-[#2a332c] bg-[#121810] p-4">
              <p className="font-semibold text-[#f5f1e8]">{pago.alumno}</p>
              <p className="mt-1 text-sm text-[#8c8678]">{pago.mes}</p>
              <p className="mt-3 text-lg font-semibold tabular-nums text-[#c9a658]">
                €{pago.cantidad.toLocaleString('es-ES')}
              </p>
              <p className="text-xs text-[#8c8678]">{pago.fecha}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
