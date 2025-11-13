# 🎾 CRM Pádel

Sistema de gestión completo para academias de pádel. Aplicación web progresiva (PWA) desarrollada con React y Vite, diseñada para gestionar alumnos, clases, pagos, asistencias, profesores, ejercicios e instalaciones.

![Version](https://img.shields.io/badge/version-0.5.0-blue.svg)
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
- **Vite 7.1.2**: Build tool y dev server
- **React Router 7.8.2**: Enrutamiento
- **Tailwind CSS 4.1.12**: Framework CSS utility-first
- **Chart.js 4.5.0**: Gráficos y visualizaciones
- **React Big Calendar 1.19.4**: Calendario de clases

### Backend & Base de Datos

- **Supabase 2.56.1**: Backend as a Service (BaaS)
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions

### Utilidades

- **date-fns 4.1.0**: Manipulación de fechas
- **moment 2.30.1**: Utilidades de fecha (legacy)
- **jsPDF 3.0.3**: Generación de PDFs
- **html2canvas 1.4.1**: Captura de pantalla para PDFs
- **@react-pdf/renderer 4.3.1**: Renderizado de PDFs

### Desarrollo

- **ESLint 9.33.0**: Linter
- **Prettier 3.6.2**: Formateador de código
- **TypeScript Types**: Tipos para React y React DOM

## 📦 Requisitos Previos

- **Node.js**: >= 18.x
- **npm**: >= 9.x (o yarn/pnpm)
- **Cuenta de Supabase**: Para backend y base de datos

## 🚀 Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/molinacode/crm-padel-frontend.git
cd crm-padel-frontend
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

4. **Ejecutar migraciones de base de datos**

Consulta la documentación en `migrations/README_MIGRACIONES.md` para aplicar las migraciones necesarias a tu base de datos de Supabase.

## ⚙️ Configuración

### Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Obtén tu URL y clave anónima desde Settings > API
3. Configura las políticas de seguridad (RLS) según tus necesidades
4. Aplica las migraciones desde la carpeta `migrations/`

### Variables de Entorno

El proyecto utiliza las siguientes variables de entorno:

- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: Clave pública anónima de Supabase

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo en http://localhost:5173

# Producción
npm run build        # Construye la aplicación para producción
npm run preview      # Previsualiza la build de producción

# Calidad de Código
npm run lint         # Ejecuta ESLint
npm run format       # Formatea código con Prettier
npm run format:check # Verifica formato sin modificar archivos
npm run format:fix   # Formatea solo archivos en src/
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
├── vite.config.js
└── tailwind.config.js
```

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

- **Componentes**: PascalCase (ej: `MobileCard.jsx`)
- **Hooks**: camelCase con prefijo `use` (ej: `useIsMobile.js`)
- **Utilidades**: camelCase (ej: `formatearMesLegible.js`)
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

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. El despliegue se realiza automáticamente en cada push

### Otros Proveedores

La aplicación se puede desplegar en cualquier plataforma que soporte aplicaciones estáticas:

- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

### Build de Producción

```bash
npm run build
```

Los archivos optimizados se generan en la carpeta `dist/`.

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

### Versión Actual: v0.5.0

**Mejoras significativas en experiencia móvil:**
- Nuevo sistema de navegación de tabs móvil
- Componentes móviles reutilizables
- ActionBottomSheet para acciones móviles
- Optimización para pantallas pequeñas (iPhone 5/SE 2016)

## 📄 Licencia

Este proyecto es privado y de uso exclusivo.

## 👥 Autor

Desarrollado por [molinacode](https://github.com/molinacode)

## 🔗 Enlaces Útiles

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de React](https://react.dev)
- [Documentación de Vite](https://vitejs.dev)
- [Documentación de Tailwind CSS](https://tailwindcss.com)

## 📞 Soporte

Para soporte o preguntas, contacta al equipo de desarrollo.

---

**¡Gracias por usar CRM Pádel! 🎾**
