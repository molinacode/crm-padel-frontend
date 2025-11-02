export default function InstalacionesDetalleDesglose({
  eventosPorDia,
  formatearFecha,
}) {
  const fechas = Object.keys(eventosPorDia).sort();

  if (fechas.length === 0) {
    return (
      <div className='text-center py-8 text-gray-500 dark:text-dark-text2'>
        <div className='text-4xl mb-2'>📅</div>
        <p>No hay clases programadas en este período</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {fechas.map(fecha => {
        const dia = eventosPorDia[fecha];
        const balance = dia.ingresos - dia.gastos;
        return (
          <div
            key={fecha}
            className='border border-gray-200 dark:border-dark-border rounded-lg p-4'
          >
            <div className='flex justify-between items-center mb-3'>
              <h3 className='font-semibold text-gray-900 dark:text-dark-text'>
                {formatearFecha(fecha)}
              </h3>
              <div className='flex items-center gap-4 text-sm'>
                <span className='text-green-600 dark:text-green-400'>
                  +{dia.ingresos}€
                </span>
                <span className='text-red-600 dark:text-red-400'>
                  -{dia.gastos}€
                </span>
                <span
                  className={`font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {balance >= 0 ? '+' : ''}
                  {balance}€
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              {dia.clases.map((clase, index) => (
                <div
                  key={index}
                  className='flex justify-between items-center text-sm'
                >
                  <span className='text-gray-600 dark:text-dark-text2'>
                    • {clase.nombre} ({clase.tipo})
                  </span>
                  <span
                    className={`font-medium ${clase.tipoOperacion === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {clase.tipoOperacion === 'ingreso' ? '+' : '-'}
                    {clase.valor}€
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
