# Release v0.6.1

## Título del Release
**v0.6.1 - Actualización de dependencias y corrección de warnings**

## Descripción del Release

### 🚀 Mejoras Principales

- **Actualización de dependencias principales**
  - React 19.1.1 y React DOM 19.1.1
  - Supabase JS 2.87.1
  - React Router DOM 7.10.1
  - Vite 7.2.7
  - TailwindCSS 4.1.17
  - ESLint 9.39.1 y plugins actualizados

- **Seguridad**
  - Eliminación de dependencia `npx` que causaba 60 vulnerabilidades
  - Actualización de todas las dependencias a versiones seguras

- **Calidad de código**
  - Corrección de todos los warnings de ESLint (12 warnings corregidos)
  - Migración de configuración de ESLint a flat config
  - Actualización de `eslint-plugin-react-hooks` a 7.0.1
  - Mejoras en el uso de `useCallback` y `useMemo` en hooks
  - Corrección de dependencias en `useEffect` y `useCallback`
  - Eliminación de variables no utilizadas
  - Corrección de funciones impuras en render

- **Mejoras técnicas**
  - Optimización de hooks personalizados (`useAlumnos`, `useEventos`, `usePagos`, `useSupabaseData`)
  - Mejora en la gestión de dependencias de React Hooks
  - Corrección de configuración de service worker para ESLint

### 📝 Cambios Técnicos

- **Hooks actualizados:**
  - `useAlumnos.js`: Uso de `useCallback` y `useMemo` para optimización
  - `useEventos.js`: Uso de `useCallback` y `useMemo` para optimización
  - `usePagos.js`: Uso de `useCallback` y `useMemo` para optimización
  - `useSupabaseData.js`: Mejora en gestión de dependencias
  - `useFichaAlumnoData.js`: Corrección de dependencias

- **Componentes actualizados:**
  - `MobileEventoActionsModal.jsx`: Optimización con `useMemo`
  - Múltiples componentes: Eliminación de variables no utilizadas
  - Corrección de warnings de React Hooks en varios componentes

### 📦 Archivos Modificados

- 39 archivos modificados
- 973 inserciones, 5993 eliminaciones (principalmente por actualización de `package-lock.json`)

### 🔗 Enlaces

- **Repositorio:** https://github.com/molinacode/crm-padel-frontend
- **Tag:** v0.6.1
- **Commit:** [Ver commit en GitHub]

---

## Instrucciones para crear el Release en GitHub

1. Ve a: https://github.com/molinacode/crm-padel-frontend/releases/new
2. Selecciona el tag: **v0.6.1**
3. Título: **v0.6.1 - Actualización de dependencias y corrección de warnings**
4. Copia y pega la descripción de arriba
5. Marca como "Latest release" si es apropiado
6. Publica el release

## Comandos para hacer push

```bash
# Hacer push del commit
git push origin main

# Hacer push del tag
git push origin v0.6.1
```

