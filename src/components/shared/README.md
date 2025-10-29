# Componentes Compartidos

Componentes reutilizables para mantener una UI consistente en toda la aplicación.

## StatsCard

Componente para mostrar tarjetas de estadísticas.

```jsx
import { StatsCard } from '../components/shared';

<StatsCard
  title='Alumnos'
  value={totalAlumnos}
  icon={<UsersIcon />}
  color='blue'
  subtitle='Total registrados'
  action={<Button>Ver todos</Button>}
  onClick={() => navigate('/alumnos')}
/>;
```

## PageHeader

Encabezado reutilizable para páginas.

```jsx
import { PageHeader } from '../components/shared';

<PageHeader
  title='Dashboard'
  subtitle='Visión general de tu academia'
  actions={
    <>
      <Button>Nueva clase</Button>
      <Button variant='secondary'>Exportar</Button>
    </>
  }
  icon={<DashboardIcon />}
  gradient='from-blue-50 via-indigo-50 to-purple-50'
/>;
```

## SectionCard

Card grande para secciones con contenido.

```jsx
import { SectionCard } from '../components/shared';

<SectionCard
  title='Últimos pagos'
  icon={<MoneyIcon />}
  iconColor='green'
  badge={<Badge>5 nuevos</Badge>}
>
  <PagosList pagos={pagos} />
</SectionCard>;
```

## ItemCard

Items reutilizables para listas (huecos, clases incompletas, etc.)

```jsx
import { ItemCard } from '../components/shared';

<ItemCard
  title='Interna - Nivel Principiante'
  subtitle='Iniciación (2) • Lunes'
  date='📅 28 Oct'
  value='1 hueco'
  color='orange'
  onClick={() => navigate('/clases')}
  buttonText='Asignar'
  onButtonClick={() => handleAsignar(id)}
>
  <p className='text-xs text-gray-500'>Libres: Juan, María</p>
</ItemCard>;
```

## Ejemplo de Refactorización

### Antes (Dashboard.jsx)

```jsx
<div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border shadow-sm'>
  <div className='flex items-center justify-between mb-3'>
    <div className='flex-1'>
      <p className='text-sm font-medium text-gray-600 mb-1 tracking-wide uppercase'>
        Alumnos
      </p>
      <p className='text-3xl font-extrabold text-gray-900'>
        {stats.totalAlumnos}
      </p>
    </div>
    <div className='bg-blue-50 p-3 rounded-xl'>
      <div className='w-7 h-7 text-blue-600'>{icon}</div>
    </div>
  </div>
</div>
```

### Después (usando StatsCard)

```jsx
import { StatsCard } from '../components/shared';

<StatsCard
  title='Alumnos'
  value={stats.totalAlumnos}
  icon={icon}
  color='blue'
/>;
```

## Beneficios

- ✅ Código más limpio y legible
- ✅ UI consistente en toda la app
- ✅ Más fácil de mantener
- ✅ Responsive y accesible
- ✅ Menos duplicación de código

## Colores Disponibles

- `blue`
- `green`
- `purple`
- `yellow`
- `red`
- `orange`
- `indigo`
