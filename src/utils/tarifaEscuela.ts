export interface TarifaEscuela {
  id: string;
  importe: number;
  vigente_desde: string;
}

export function precioEscuelaEnFecha(tarifas: TarifaEscuela[], fecha: string): number {
  const dia = String(fecha || '').slice(0, 10);
  const aplicable = tarifas
    .filter(tarifa => String(tarifa.vigente_desde).slice(0, 10) <= dia)
    .sort((a, b) => String(a.vigente_desde).localeCompare(String(b.vigente_desde)))
    .at(-1);
  return aplicable ? Number(aplicable.importe) : 21;
}
