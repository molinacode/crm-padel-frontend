export default function StatsResumenGrid({ estadisticas, onHoy, onSemana, onMes, onAnio, Card }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      <Card titulo='Hoy' color='blue' estadisticas={estadisticas.diario} onClick={onHoy} />
      <Card titulo='Esta semana' color='purple' estadisticas={estadisticas.semanal} onClick={onSemana} />
      <Card titulo='Este mes' color='orange' estadisticas={estadisticas.mensual} onClick={onMes} />
      <Card titulo='Este año' color='indigo' estadisticas={estadisticas.anual} onClick={onAnio} />
    </div>
  );
}


