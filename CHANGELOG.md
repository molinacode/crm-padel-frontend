# Changelog

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
