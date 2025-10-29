# Changelog

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
