# Migración a TypeScript (seguimiento)

Rama de trabajo: `migracion-typescript`. La rama `main` sigue desplegando con
JS. Aquí se va tachando el progreso de migración módulo a módulo.

## Estado global

- Fase 0 (infra) terminada: `tsconfig.json`, `eslint.config.js` extendido,
  script `pnpm typecheck`, `src/types/supabase.ts` (placeholder hasta
  `pnpm run gen:supabase-types`) y pilotos en TS.
- Fase 1 (`src/utils/`) terminada: 13 utilidades migradas a `.ts`; cliente
  `lib/supabase.ts` rechaza clave JWT `service_role` en el navegador.
- TS y JS conviven (`allowJs: true`). El build de Vite no debe romperse en
  ningún punto.

## Acciones manuales del usuario

1. **Clave Supabase en el frontend:** en `crm-padel-frontend/.env` usa solo la
   clave **anon public** (`VITE_SUPABASE_KEY` o `VITE_SUPABASE_ANON_KEY`). Si
   alguna vez pusiste `service_role` en el cliente, en Supabase ve a
   **Settings → API → Reset service_role secret** y rota esa clave.
2. **Tipos reales de la base de datos:** una vez autenticado con la CLI:
   ```bash
   pnpm exec supabase login
   pnpm run gen:supabase-types
   ```
   Eso sustituye `src/types/supabase.ts` (ahora `Database = any` temporal) por
   los tipos generados del proyecto `hyieejamnaqsngnatftx`. Sin login, el
   comando falla con *Access token not provided*; alternativa: copiar tipos
   desde Supabase Studio → Database → API Docs → Generate types.

### Verificaciones

- [x] `pnpm run lint` → 0 errores
- [x] `pnpm run typecheck` → 0 errores
- [x] `pnpm run build` → OK
- [x] `pnpm run dev` → app navega sin errores

## Reglas

- `// @ts-ignore` prohibido. Usar `// @ts-expect-error` con descripción
  (>= 10 caracteres) sólo de forma temporal: si el error desaparece, el lint
  falla y avisa para limpiarlo.
- Cualquier alias nuevo (`@features`, `@shared`, etc.) se añade en el mismo
  commit en `tsconfig.json` y `vite.config.js`.
- Mantener nombres y firmas públicas de hooks ya consolidados.
- Migración en orden de **dependencia inversa**: `utils/` → `lib/` → `services/`
  → `hooks/` → `components/` (subcarpetas pequeñas primero) → `pages/` →
  `features/index.js` → `App.jsx`/`main.jsx`.

## Pilotos migrados (Fase 0)

- [x] `src/utils/scheduleEffectWork.ts`
- [x] `src/utils/domToPngSafe.ts`
- [x] `src/lib/supabase.ts`
- [x] `src/hooks/useIsMobile.ts`
- [x] `src/types/supabase.ts` (placeholder `Database = any` hasta `gen:supabase-types`)
- [x] `src/vite-env.d.ts` (tipos de variables `VITE_*`)

## Inventario por carpeta (pendiente de migrar)

> Total restante en `src/` tras la fase 1: **~213 ficheros** (aprox.). Marcar `[x]`
> cuando el módulo entero esté en TS y `pnpm typecheck` siga limpio.

### Fase 1 — `src/utils/` (13 ficheros + pilotos ya en TS)

- [x] `alumnoUtils.ts`
- [x] `calcularDeudas.ts`
- [x] `calcularHuecos.ts`
- [x] `date.ts`
- [x] `dateUtils.ts`
- [x] `diagnostico.ts`
- [x] `domToPngSafe.ts` (piloto fase 0)
- [x] `exportarCsv.ts`
- [x] `generarReciboPdf.ts` (depende de `jspdf`)
- [x] `getClassColors.ts`
- [x] `migrarOrigenesTemporales.ts`
- [x] `origenUtils.ts`
- [x] `scheduleEffectWork.ts` (piloto fase 0)
- [x] `text.ts`
- [x] `verificarTablaGastos.ts`

### Fase 2 — `src/services/` (10 ficheros)

> Aquí cobra mucho valor regenerar `src/types/supabase.ts` con los tipos reales
> antes de empezar.

- [ ] `alumnoService.js`
- [ ] `auditoriaService.js`
- [ ] `busquedaService.js`
- [ ] `claseService.js`
- [ ] `dashboardService.js`
- [ ] `liberacionesService.js`
- [ ] `notificacionesService.js`
- [ ] `pagoService.js`
- [ ] `recuperacionesService.js`
- [ ] `reportesService.js`

### Fase 3 — `src/hooks/` (36 ficheros)

> Migrar primero los hooks **sin estado complejo** y los `useXxxHandlers.js`.
> Los hooks de carga de datos heredan los tipos de `services/` cuando estén
> migrados.

- [ ] `useAlumnos.js`
- [ ] `useAlumnosEscuela.js`
- [ ] `useAsistenciasData.js`
- [ ] `useAsistenciasHandlers.js`
- [ ] `useBusquedaGlobal.js`
- [ ] `useClasesData.js`
- [ ] `useClasesEventoHandlers.js`
- [ ] `useClasesEventos.js`
- [ ] `useClasesHandlers.js`
- [ ] `useDashboardData.js`
- [ ] `useEditarAlumno.js`
- [ ] `useEjercicios.js`
- [ ] `useEventos.js`
- [ ] `useEventosData.js`
- [ ] `useEventosFiltrados.js`
- [ ] `useEventosSemanaProfesor.js`
- [ ] `useFichaAlumnoData.js`
- [ ] `useFichaEjercicioData.js`
- [ ] `useFichaProfesorData.js`
- [ ] `useGastosMaterialHandlers.js`
- [ ] `useHuecosDisponibles.js`
- [ ] `useInstalacionesData.js`
- [ ] `useInstalacionesDetalle.js`
- [ ] `useInstalacionesStats.js`
- [ ] `useInternasMes.js`
- [ ] `useOrigenAsignacion.js`
- [ ] `useOtrosAlumnos.js`
- [ ] `usePagos.js`
- [ ] `usePagosData.js`
- [ ] `useProfesores.js`
- [ ] `useSeguimientoData.js`
- [ ] `useSeguimientoStats.js`
- [ ] `useSelectorTematica.js`
- [ ] `useSincronizacionAsignaciones.js`
- [ ] `useSupabaseData.js`
- [ ] `useVistaProfesorData.js`

### Fase 4 — `src/contexts/` (2 ficheros)

- [ ] `AuthContext.jsx`
- [ ] `ThemeContext.jsx`

### Fase 5 — `src/components/` (~134 ficheros)

> Migrar por subcarpetas. Empezar por `shared/`, `common/`, luego subcarpetas
> de feature (`alumnos/`, `clases/`, `pagos/`, `profesor/`, `profesores/`,
> `instalaciones/`, `ficha/`, `seguimiento/`, `ejercicios/`, `asistencias/`,
> `dashboard/`, `notificaciones/`) y por último los componentes raíz.

- [ ] `shared/` (`StatsCard`, `SectionCard`, `PageHeader`, `ItemCard`, `index.js`)
- [ ] `common/`
- [ ] `alumnos/`
- [ ] `asistencias/`
- [ ] `clases/`
- [ ] `dashboard/`
- [ ] `ejercicios/`
- [ ] `ficha/`
- [ ] `instalaciones/`
- [ ] `notificaciones/`
- [ ] `pagos/`
- [ ] `profesor/`
- [ ] `profesores/`
- [ ] `seguimiento/`
- [ ] componentes raíz (`navbar.jsx`, `Sidebar.jsx`, `LazyWrapper.jsx`,
      `BusquedaGlobal.jsx`, `ExportarListado.jsx`, `Diagnostico.jsx`,
      `FormularioAlumno.jsx`, `FormularioClase.jsx`, `FormularioEjercicio.jsx`,
      `FormularioGastoMaterial.jsx`, `FormularioProfesor.jsx`,
      `EditarAlumno.jsx`, `OcuparHuecos.jsx`, `SugerenciasHorarios.jsx`,
      `AsignarAlumnosClase.jsx`, `DesasignarAlumnos.jsx`,
      `HistorialClasesProfesor.jsx`, `GestionDeudas.jsx`,
      `GestionTematicasEjercicios.jsx`, `InfoClasesExternas.jsx`,
      `ListaAlumnos.jsx`, `Login.jsx`, `MobileBottomNav.jsx`,
      `MobileFichaAlumno.jsx`, `NotificacionesPagos.jsx`,
      `NotificacionesProfesor.jsx`, `PWAInstallPrompt.jsx`,
      `LoadingSpinner.jsx`)

### Fase 6 — `src/pages/` (19 ficheros)

- [ ] `Alumnos.jsx`
- [ ] `AlumnosEscuela.jsx`
- [ ] `Asistencias.jsx`
- [ ] `Clases.jsx`
- [ ] `Dashboard.jsx`
- [ ] `EditarAlumno.jsx`
- [ ] `Ejercicios.jsx`
- [ ] `FichaAlumno.jsx`
- [ ] `FichaEjercicio.jsx`
- [ ] `FichaProfesor.jsx`
- [ ] `Instalaciones.jsx`
- [ ] `InstalacionesDetalle.jsx`
- [ ] `OtrosAlumnos.jsx`
- [ ] `Pagos.jsx`
- [ ] `PerfilUsuario.jsx`
- [ ] `Profesores.jsx`
- [ ] `Reportes.jsx`
- [ ] `SeguimientoAlumno.jsx`
- [ ] `VistaProfesor.jsx`

### Fase 7 — `src/features/*/index.js` (10 ficheros)

- [ ] `alumnos/index.js`
- [ ] `asistencias/index.js`
- [ ] `clases/index.js`
- [ ] `dashboard/index.js`
- [ ] `ejercicios/index.js`
- [ ] `instalaciones/index.js`
- [ ] `pagos/index.js`
- [ ] `profesor/index.js`
- [ ] `profesores/index.js`
- [ ] `seguimiento/index.js`

### Fase 8 — Entrada

- [ ] `src/App.jsx`
- [ ] `src/main.jsx`
- [ ] (opcional) `vite.config.js` → `vite.config.ts`

## Cierre

- [ ] Tipos reales de Supabase generados (sustituir el placeholder).
- [ ] `tsconfig.json` deja de tener `allowJs` (todo el código en TS).
- [ ] Borrar referencias residuales a `.js` en imports.
- [ ] PR final `migracion-typescript` → `main` y release `v1.0.0-ts`.
