# Release v0.8.0: Migracion Completa a TypeScript

## Resumen

Esta release cierra la migracion del frontend de JavaScript/JSX a TypeScript/TSX en todo `src`, incluyendo entrypoints, pages, components, hooks, services, utils, contexts y barrels por feature.

## Cambios principales

- Migracion de `App` y `main` a `App.tsx` y `main.tsx`.
- Migracion completa de `pages` y `components` a `.tsx`.
- Migracion de `hooks`, `services` y `utils` a `.ts`.
- Normalizacion de barrels:
  - `src/components/shared/index.ts`
  - `src/features/*/index.ts`
- Actualizacion de `index.html` para cargar `src/main.tsx`.

## Calidad y validaciones

- `pnpm run typecheck` en verde.
- `pnpm run lint` en verde.
- `pnpm run build` en verde.
- Prueba local con `pnpm run dev` validada.

## CI/CD y despliegue

- Se elimino la dependencia local `supabase` (CLI) de `devDependencies` para evitar warnings de binarios/scripts en Vercel.
- El script `gen:supabase-types` ahora usa `pnpm dlx supabase@2.98.0`.

## Seguridad y documentacion

- Se reforzo `migrations/README_MIGRACIONES.md` con recomendaciones de seguridad para evitar fugas de credenciales en repositorio.

## Impacto

- No hay cambios de contrato en runtime para usuarios finales.
- Mejora fuerte de mantenibilidad, robustez de tipos y seguridad en desarrollo/despliegue.
