# Changelog

# Changelog

## v0.6.0 - 2025-11-18

### Vista Profesor y notificaciones
- **Recordatorios/anotaciones manuales**: desde `VistaProfesor` se pueden crear recordatorios y notas para una fecha concreta o de alcance general; se guardan como notificaciones en tiempo real con sus propios iconos y etiquetas.
- **Tipos de notificación ampliados**: se añadieron `recordatorio_manual` y `anotacion_manual`, con colores consistentes y conteo en vivo, manteniendo la suscripción Supabase existente.

### Experiencia móvil de clases impartidas
- **Bottom sheet estable en móvil**: `ClasesEventosTable` reutiliza un único `ActionBottomSheet` memoizado y badges calculados con seguridad, evitando los hooks condicionales que provocaban el crash al tocar los tres puntos.
- **MobileEventoCard mejorado**: badges para huecos y alumnos justificados funcionan aunque los valores lleguen como arrays o contadores, asegurando etiquetas correctas.

### Gestión de alumnos lesionados
- **Nuevo estado de asistencia `lesionado`** disponible en la tabla y tarjetas móviles de asistencias.
- **Sincronización de plazas**: `useAsistenciasHandlers`, `useSincronizacionAsignaciones`, `useEventosData`, `ListaAlumnos` y el `dashboardService` tratan al lesionado como una ausencia liberando la plaza, pero sin generar pendientes de pago o recuperaciones automáticas.

### Notas
- No se añadieron migraciones de base de datos para este release.

## v0.5.0 - 2025-11-13

### Mejoras significativas en experiencia móvil
- **Nuevo sistema de navegación de tabs móvil**: Componente `MobileTabsSelector` que reemplaza las tabs horizontales con un selector bottom sheet en móvil, mejorando la usabilidad y ahorrando espacio vertical.
- **Componentes móviles reutilizables**: Nueva arquitectura de componentes móviles (`MobileCard`, `MobilePagoCard`, `MobileGastoCard`, `MobileAsistenciaCard`, `MobileEventoCard`, `MobileEjercicioCard`, `MobileProfesorCard`) para una experiencia consistente en todos los dispositivos.
- **ActionBottomSheet**: Componente reutilizable para acciones móviles que reemplaza múltiples botones por un bottom sheet organizado por categorías.

### Componentes actualizados para móvil
- `ClasesEventosTable`: Vista de tarjetas móviles con `MobileEventoCard` y `ActionBottomSheet` para acciones.
- `PagosHistorial`: Vista de tarjetas móviles con `MobilePagoCard`.
- `ListaGastosMaterial`: Vista de tarjetas móviles con `MobileGastoCard`.
- `AsistenciasTable`: Vista de tarjetas móviles con `MobileAsistenciaCard`.
- `EjerciciosTable`: Vista de tarjetas móviles con `MobileEjercicioCard`.
- `ProfesoresTable`: Vista de tarjetas móviles con `MobileProfesorCard`.
- `ListaAlumnos`: Integración de `ActionBottomSheet` para acciones móviles.

### Tabs mejoradas para móvil
- `ClasesTabsContainer`: 5 tabs con selector móvil mejorado.
- `FichaAlumnoTabs`: 4 tabs con selector móvil mejorado.
- `PagosTabs`: 4 tabs con selector móvil mejorado.
- `FichaEjercicioTabs`: 3 tabs con selector móvil mejorado.
- `SeguimientoTabs`: 3 tabs con selector móvil mejorado.
- `InstalacionesTabs`: 4 tabs con selector móvil mejorado.
- `FichaProfesorTabs`: 3 tabs con selector móvil mejorado.

### Mejoras técnicas
- Hook `useIsMobile`: Hook reutilizable para detección de dispositivos móviles con soporte para breakpoints personalizables.
- Exportaciones centralizadas: `src/components/common/index.js` para simplificar imports.
- Optimización de botones móviles: Botones de acción más pequeños y optimizados para pantallas pequeñas (iPhone 5/SE 2016).

### Impacto
- Experiencia móvil completamente rediseñada y consistente en toda la aplicación.
- Reducción de código duplicado mediante componentes reutilizables.
- Mejor usabilidad en dispositivos móviles con pantallas pequeñas.
- Navegación más intuitiva con bottom sheets en lugar de múltiples botones.

### Instrucciones
- No hay migraciones de BD nuevas en este release.
- Los cambios son principalmente de UI/UX y son compatibles hacia atrás.

## v0.4.0 - 2025-10-29

### Refactorización mayor y mejoras UX/UI
- Refactorización masiva de páginas grandes: `Clases.jsx`, `Dashboard.jsx`, `Pagos.jsx`, `VistaProfesor.jsx`, `Asistencias.jsx`, `FichaAlumno.jsx`, `Ejercicios.jsx`, `Profesores.jsx`, `AlumnosEscuela.jsx`.
- Extracción de lógica a hooks reutilizables: `useEventosData`, `useEventosFiltrados`, `useClasesEventoHandlers`, `useAsistenciasData`, `useAsistenciasHandlers`, `useFichaAlumnoData`, `useInstalacionesData`, `useInternasMes`, etc.
- Componentización de UI en carpetas dedicadas: `components/clases/*`, `components/dashboard/*`, `components/pagos/*`, `components/ficha/*`, `components/asistencias/*`, `components/profesor/*`, etc.
- Calendario de clases: estilos de `react-big-calendar` importados, soporte de vistas y validaciones robustas.
- Calendario ahora muestra clases futuras e impartidas; excluye canceladas/eliminadas.

### Utilidades y servicios
- `utils/getClassColors.js` para estilos consistentes por tipo de clase.
- `utils/dateUtils.js` centraliza utilidades de fecha (rango semana/mes, formateos).
- `services/*` para separar lógica de negocio (alumnos, clases, pagos, dashboard).

### Impacto
- Reducción neta de ~8k líneas de código; mayor mantenibilidad y testabilidad.
- Estructura modular y consistente según principios de Refactoring UI.

### Instrucciones
- Instalar dependencias (si procede): `npm install`.
- Build: `npm run build`.
- No hay migraciones de BD nuevas en este release.

## v0.3.0 - 2025-10-15

### Nuevas funcionalidades
- Sistema completo de recuperaciones de clases (tabla `recuperaciones_clase`, creación automática y gestión desde perfil del alumno).
- Botón "Asignar recuperación" desde `FichaAlumno` con navegación y prefiltrado automático en `Clases`.
- Modal especial para asignaciones de recuperación con preselección de clase y alumno.
- Ocupar huecos para recuperaciones también en clases con pocos alumnos (no solo por faltas).

### Mejoras
- Calendario de `Clases`: se ocultan eventos `eliminado` y `cancelada`.
- `Dashboard`: "Huecos por faltas" ahora incluye justificadas y no justificadas; se indica si el alumno tiene derecho a recuperación.
- `Asistencias`: sincronización de liberaciones para faltas justificadas y no justificadas.

### Cambios técnicos
- Migración SQL: `migrations/2025-01-27_create-recuperaciones-clase.sql` (crea `recuperaciones_clase` con RLS y policies).
- Hook `useSincronizacionAsignaciones`: nuevas funciones para obtener, completar y cancelar recuperaciones.
- Componentes actualizados: `FichaAlumno.jsx`, `Clases.jsx`, `OcuparHuecos.jsx`, `AsignarAlumnosClase.jsx`.
- Vite, React, Supabase y otras dependencias actualizadas.

### Correcciones
- Creación de huecos por faltas no justificadas.
- Ajustes en vistas de "clases impartidas" para abrir correctamente el popup de ocupar huecos.

### Instrucciones de despliegue
- Ejecutar la migración de base de datos:
  - Supabase CLI:
    - `supabase login && supabase link --project-ref TU_PROJECT_REF && supabase db push`
  - o con psql:
    - `psql "postgres://USUARIO:PASS@HOST:PUERTO/BD" -f .\migrations\2025-01-27_create-recuperaciones-clase.sql`
