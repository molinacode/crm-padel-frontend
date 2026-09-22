# 🎾 CRM Pádel

Sistema de gestión completo para academias de pádel. Aplicación web progresiva (PWA) desarrollada con React y Vite, diseñada para gestionar alumnos, clases, pagos, asistencias, profesores, ejercicios e instalaciones.

![Version](https://img.shields.io/badge/version-0.8.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-Private-red.svg)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Funcionalidades Principales](#-funcionalidades-principales)
- [PWA (Progressive Web App)](#-pwa-progressive-web-app)
- [Desarrollo](#-desarrollo)
- [Despliegue](#-despliegue)
- [Contribución](#-contribución)
- [Changelog](#-changelog)

## ✨ Características

### 🎯 Gestión Completa

- **👥 Alumnos**: Gestión completa de alumnos (internos, externos, temporales)
- **📚 Clases**: Programación, calendario, asignación de alumnos y profesores
- **💰 Pagos**: Control de pagos mensuales y por clases, gestión de deudas
- **✅ Asistencias**: Registro de asistencias, faltas, justificaciones y recuperaciones
- **👨‍🏫 Profesores**: Gestión de profesores, horarios y notificaciones
- **💪 Ejercicios**: Biblioteca de ejercicios con temáticas y dificultades
- **🏢 Instalaciones**: Gestión de pistas, alquileres y gastos de material

### 📱 Experiencia Móvil Optimizada

- **Diseño Responsive**: Interfaz adaptada para móviles, tablets y desktop
- **Componentes Móviles**: Tarjetas optimizadas para pantallas pequeñas
- **Navegación Intuitiva**: Bottom sheets y selectores móviles para mejor UX
- **PWA**: Instalable como aplicación nativa en dispositivos móviles

### 🎨 Interfaz Moderna

- **Dark Mode**: Soporte completo para modo oscuro
- **UI Consistente**: Componentes reutilizables y diseño coherente
- **Accesibilidad**: Interfaz accesible y fácil de usar

## 🛠️ Tecnologías

### Frontend

- **React 19.1.1**: Biblioteca de UI
- **Vite 7.x**: Build tool y dev server
- **React Router 7.10.1**: Enrutamiento
- **Tailwind CSS 4.1.17**: Framework CSS utility-first
- **Chart.js 4.5.1**: Gráficos y visualizaciones
- **React Big Calendar 1.19.4**: Calendario de clases

### Backend y Base de Datos

- **Express + `pg`**: API propia, Postgres `crm_padel` privado
- **Zitadel (OIDC)**: login staff en `auth.v3sports.es`
- El paquete `@supabase/supabase-js` queda solo para tipos `PostgrestError`; el navegador no usa la anon key

### Utilidades

- **date-fns**: Manipulación de fechas (el calendario usa `react-big-calendar` con localización compatible)
- **jsPDF**: PDF en cliente (listados, recibos)
- **modern-screenshot**: Exportación a PNG del DOM (sin segunda librería PDF paralela)

### Desarrollo

- **TypeScript 6**: Tipado estático (migración completada en `src`)
- **ESLint 9.39.1**: Linter
- **Prettier 3.7.4**: Formateador de código

## 📦 Requisitos Previos

- **Node.js**: >= 20 y < 23
- **pnpm**: 10.x (recomendado)
- **API local**: `crm-padel-backend` en el puerto 3001 (o carpeta `backend/` de este repo)

## 🚀 Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/molinacode/crm-padel-frontend.git
cd crm-padel-frontend
```

2. **Instalar dependencias**

```bash
pnpm install
```

3. **Variables de entorno**

El frontend **no** lleva claves de Supabase. Copia `.env.example` si quieres; el login va por cookie hacia `/api`. En local arranca también el backend (`crm-padel-backend`, puerto 3001).

4. **Base de datos**

En producción el schema vive en Postgres `crm_padel` (dump + `backend/sql/`). Ver `servidor/docs/apps/CRM-PADEL-DEPLOY.md`.

## ⚙️ Configuración

No hay `VITE_SUPABASE_*`. El navegador llama a Express (`/api/query`, `/api/auth/*`) con cookie httpOnly.

Local: `DATABASE_URL`, `SESSION_SECRET` y `OIDC_*` van en `backend/.env` (o `crm-padel-backend/.env`), nunca en el frontend.

## 📜 Scripts Disponibles

```bash
# Desarrollo
pnpm run dev          # Inicia servidor de desarrollo

# Producción
pnpm run build        # Construye la aplicación para producción
pnpm run preview      # Previsualiza la build de producción

# Calidad de Código
pnpm run lint         # Ejecuta ESLint
pnpm run typecheck    # TypeScript (tsc --noEmit)
pnpm run typecheck:unused # TypeScript estricto para detectar codigo sin uso
pnpm run gen:supabase-types  # Regenera src/types/supabase.ts (usa pnpm dlx)
pnpm run format       # Formatea código con Prettier
pnpm run format:check # Verifica formato sin modificar archivos
pnpm run format:fix   # Formatea solo archivos en src/
```

## 📁 Estructura del Proyecto

```
crm-padel-frontend/
├── public/              # Archivos estáticos y PWA
│   ├── manifest.json   # Configuración PWA
│   └── sw.js           # Service Worker
├── src/
│   ├── assets/         # Imágenes y recursos
│   ├── components/     # Componentes React
│   │   ├── common/     # Componentes reutilizables
│   │   ├── alumnos/    # Componentes de alumnos
│   │   ├── clases/     # Componentes de clases
│   │   ├── pagos/      # Componentes de pagos
│   │   └── ...         # Otros módulos
│   ├── contexts/       # Contextos de React (Auth, Theme)
│   ├── features/       # Features organizados por dominio
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Librerías y configuraciones
│   ├── pages/          # Páginas principales
│   ├── services/       # Servicios de API
│   └── utils/          # Utilidades y helpers
├── migrations/         # Scripts de migración SQL
├── doc/               # Documentación adicional
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### Tipado

- Antes de abrir PR, verifica: `pnpm run typecheck`

## 🎯 Funcionalidades Principales

### Dashboard

- Estadísticas generales
- Notificaciones de pagos pendientes
- Huecos disponibles por faltas
- Clases incompletas
- Últimos pagos registrados

### Gestión de Alumnos

- Listado completo de alumnos
- Fichas detalladas por alumno
- Seguimiento de progreso
- Historial de pagos y asistencias
- Gestión de deudas

### Gestión de Clases

- Calendario interactivo
- Programación de clases
- Asignación de alumnos y profesores
- Control de capacidad y huecos
- Clases internas y externas
- Recuperaciones y cancelaciones

### Gestión de Pagos

- Registro de pagos mensuales y por clases
- Historial completo
- Cálculo automático de deudas
- Notificaciones de pagos pendientes
- Exportación de datos

### Control de Asistencias

- Registro rápido de asistencias
- Estados: Asistió, Falta, Justificada
- Sistema de recuperaciones
- Vista por clase y por alumno

### Gestión de Profesores

- Perfiles de profesores
- Horarios y disponibilidad
- Notificaciones personalizadas
- Historial de clases impartidas

### Biblioteca de Ejercicios

- Catálogo de ejercicios
- Categorías y dificultades
- Temáticas asociadas
- Fichas detalladas

### Instalaciones

- Gestión de pistas
- Control de alquileres
- Gastos de material
- Estadísticas de uso

## 📱 PWA (Progressive Web App)

La aplicación es una PWA completa que permite:

- **Instalación**: Se puede instalar en dispositivos móviles y desktop
- **Funcionamiento Offline**: Service Worker para caché de recursos
- **Notificaciones**: Soporte para notificaciones push (futuro)
- **Experiencia Nativa**: Se comporta como una app nativa

### Instalación PWA

1. Abre la aplicación en un navegador compatible
2. Busca el botón de instalación en la barra de direcciones
3. O usa el prompt de instalación que aparece automáticamente

## 💻 Desarrollo

### Convenciones de Código

- **Componentes**: PascalCase (ej: `MobileCard.tsx`)
- **Hooks**: camelCase con prefijo `use` (ej: `useIsMobile.ts`)
- **Utilidades**: camelCase (ej: `formatearMesLegible.ts`)
- **Archivos de configuración**: kebab-case o camelCase según estándar

### Componentes Reutilizables

El proyecto incluye una arquitectura de componentes móviles reutilizables:

- `MobileCard`: Componente base para tarjetas móviles
- `ActionBottomSheet`: Bottom sheet para acciones móviles
- `MobileTabsSelector`: Selector de tabs optimizado para móvil
- Componentes especializados: `MobilePagoCard`, `MobileGastoCard`, etc.

### Hooks Personalizados

- `useIsMobile`: Detección de dispositivos móviles
- `useAuth`: Gestión de autenticación
- `useTheme`: Gestión de tema (dark/light)
- Y muchos más en `src/hooks/`

### Estilos

- **Tailwind CSS**: Utilidades para estilos
- **Dark Mode**: Soporte nativo con clases `dark:`
- **Responsive**: Breakpoints móvil-first

## 🚢 Despliegue

Producción: **Coolify en nodo1**, `https://app.v3sports.es`. Login en `https://auth.v3sports.es` (Zitadel). **Sin Vercel. Sin Supabase.**

- `Dockerfile` en la raíz de este repo (Vite + Express). El API está en `backend/`.
- Runbook: `servidor/docs/apps/CRM-PADEL-DEPLOY.md`
- Antes de pushear: `padel/sync-backend-into-frontend.ps1` si cambió el API.

Local: backend en `:3001`, `pnpm run dev` (Vite `:5175` hace proxy de `/api` y `/fotos-alumnos`).

## 🤝 Contribución

Este es un proyecto privado. Para contribuir:

1. Crea una rama desde `main`
2. Realiza tus cambios
3. Asegúrate de que el código pase los linters
4. Crea un Pull Request con una descripción clara

### Checklist antes de hacer PR

- [ ] Código formateado con Prettier
- [ ] Sin errores de ESLint
- [ ] Probado en desarrollo
- [ ] Documentación actualizada si es necesario

## 📝 Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial completo de cambios.

### Versión Actual: v0.8.0

**Hitos principales de esta versión:**
- Migración completa de `src` de JavaScript/JSX a TypeScript/TSX.
- Refactorización por dominios (`features`, `hooks`, `services`, `utils`) con tipado estático.
- Build, lint y typecheck estabilizados. Despliegue en Coolify (`app.v3sports.es`), no en Vercel.

## 📄 Licencia

Este proyecto es privado y de uso exclusivo.

## 👥 Autor

Desarrollado por [molinacode](https://github.com/molinacode)

## 🔗 Enlaces Útiles

- [Documentación de React](https://react.dev)
- [Documentación de Vite](https://vitejs.dev)
- [Documentación de Tailwind CSS](https://tailwindcss.com)

## 📞 Soporte

Para soporte o preguntas, contacta al equipo de desarrollo.

---

**¡Gracias por usar CRM Pádel! 🎾**
