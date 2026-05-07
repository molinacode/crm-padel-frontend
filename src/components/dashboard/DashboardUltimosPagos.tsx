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
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-base mb-2">No hay pagos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ultimosPagos.map((pago, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-100 dark:border-green-800/50">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{pago.alumno}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{pago.mes}</p>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-lg text-green-700 dark:text-green-400 tabular-nums">
                  €{pago.cantidad.toLocaleString('es-ES')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{pago.fecha}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
