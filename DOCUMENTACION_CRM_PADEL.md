# 🏓 CRM Pádel - Documentación Completa

## 📋 Resumen de Funcionalidades

### 🎯 Descripción General
**CRM Pádel** es una aplicación web moderna desarrollada en React para la gestión integral de academias y clubes de pádel. La aplicación permite gestionar alumnos, profesores, clases, pagos, asistencias y ejercicios de manera eficiente y organizada.

### 🚀 Características Principales
- **Interfaz moderna y responsive** con diseño intuitivo
- **Autenticación segura** con Supabase
- **Gestión completa de usuarios** (alumnos, profesores, administradores)
- **Sistema de clases** con calendario interactivo
- **Control de asistencias** en tiempo real
- **Gestión de pagos** y facturación
- **Biblioteca de ejercicios** categorizados
- **Dashboard con estadísticas** en tiempo real
- **Reportes y análisis** de rendimiento

---

## 🛠️ Manual de Instalación

### 📋 Requisitos Previos
- **Node.js** (versión 16 o superior)
- **npm** o **yarn**
- **Cuenta de Supabase** (gratuita)
- **Git** (opcional, para clonar el repositorio)

### 🔧 Pasos de Instalación

#### 1. Clonar o Descargar el Proyecto
```bash
# Si tienes acceso al repositorio Git
git clone [URL_DEL_REPOSITORIO]
cd crm-padel-frontend

# O descargar y extraer el archivo ZIP
```

#### 2. Instalar Dependencias
```bash
npm install
# o
yarn install
```

#### 3. Configurar Variables de Entorno
Crear un archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4. Configurar Supabase
1. Crear una cuenta en [Supabase](https://supabase.com)
2. Crear un nuevo proyecto
3. Obtener la URL y la clave pública (anon key) desde Settings → API
4. Configurar las tablas necesarias (ver sección de Base de Datos)

#### 5. Ejecutar la Aplicación
```bash
# Modo desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview
```

### 🌐 Acceso a la Aplicación
- **Desarrollo**: `http://localhost:5173`
- **Producción**: Según la configuración del servidor

---

## 👥 Manual de Usuario

### 🔐 Acceso e Inicio de Sesión

#### Credenciales de Prueba
- **Email**: `admin@test.com`
- **Contraseña**: `admin123`

#### Proceso de Login
1. Abrir la aplicación en el navegador
2. Introducir las credenciales en el formulario de login
3. Hacer clic en "Iniciar Sesión"
4. Serás redirigido al Dashboard principal

### 🏠 Dashboard Principal

El Dashboard es la pantalla principal que muestra:
- **Estadísticas generales**: Total de alumnos, ingresos del mes, clases programadas
- **Clases incompletas**: Clases que necesitan más alumnos
- **Últimos pagos**: Registro de pagos recientes
- **Resumen visual** de la actividad del club

### 👥 Gestión de Alumnos

#### Ver Lista de Alumnos
1. Navegar a **"Alumnos"** en el menú lateral
2. Ver lista completa con información básica
3. Usar la barra de búsqueda para filtrar

#### Agregar Nuevo Alumno
1. Hacer clic en **"➕ Nuevo Alumno"**
2. Completar el formulario con:
   - Nombre completo
   - Email
   - Teléfono
   - Fecha de nacimiento
   - Nivel de juego
   - Observaciones
3. Hacer clic en **"Guardar"**

#### Ver/Editar Alumno
1. Hacer clic en el nombre del alumno en la lista
2. Ver información completa en la ficha del alumno
3. Hacer clic en **"Editar"** para modificar datos
4. Acceder a **"Seguimiento"** para ver historial

### 👨‍🏫 Gestión de Profesores

#### Ver Lista de Profesores
1. Navegar a **"Profesores"** en el menú lateral
2. Ver información de contacto y especialidades
3. Usar filtros de búsqueda

#### Agregar Nuevo Profesor
1. Hacer clic en **"➕ Nuevo Profesor"**
2. Completar datos personales y profesionales
3. Especificar especialidad y horarios disponibles

### 📅 Gestión de Clases

#### Vista de Calendario
1. Navegar a **"Clases"** en el menú lateral
2. Ver calendario semanal con todas las clases
3. **Colores diferenciados**:
   - 🎯 **Morado**: Clases particulares
   - 🏠 **Verde**: Clases internas
   - 🏫 **Naranja**: Clases de escuela
   - 👥 **Azul**: Clases grupales

#### Crear Nueva Clase
1. **Vista Calendario**: Hacer clic en una franja horaria vacía
2. **Vista Tabla**: Usar el formulario lateral
3. Completar información:
   - Nombre de la clase
   - Tipo (particular/grupal/interna/escuela)
   - Nivel (principiante/intermedio/avanzado)
   - Profesor asignado
   - Día y horario
   - Duración

#### Gestionar Clases Existentes
- **Click simple**: Asignar alumnos a la clase
- **Doble click**: Eliminar clase permanentemente
- **Cambiar estado**: Cancelar/Reactivar clases

#### Asignar Alumnos a Clases
1. Hacer clic en una clase existente
2. Seleccionar alumnos de la lista disponible
3. Respetar límites:
   - Clases particulares: 1 alumno
   - Clases grupales: máximo 4 alumnos

### 📋 Control de Asistencias

#### Registrar Asistencias
1. Navegar a **"Asistencias"** en el menú lateral
2. Seleccionar la fecha deseada
3. Ver clases programadas para esa fecha
4. Para cada alumno, seleccionar estado:
   - ✅ **Asistió**: El alumno estuvo presente
   - ❌ **Falta**: El alumno no asistió
   - ⚠️ **Justificada**: Falta con justificación

#### Estados de Asistencia
- **Pendiente**: Sin registrar (estado inicial)
- **Asistió**: Presencia confirmada
- **Falta**: Ausencia sin justificar
- **Justificada**: Ausencia con motivo válido

### 💰 Gestión de Pagos

#### Registrar Nuevo Pago
1. Navegar a **"Pagos"** en el menú lateral
2. Completar formulario:
   - Seleccionar alumno
   - Especificar cantidad (€)
   - Mes cubierto
   - Método de pago (transferencia/efectivo/tarjeta)
3. Hacer clic en **"Registrar Pago"**

#### Consultar Pagos
- **Ver todos**: Lista completa de pagos
- **Filtrar por alumno**: Seleccionar alumno específico
- **Historial**: Pagos ordenados por fecha

### 💪 Gestión de Ejercicios

#### Ver Biblioteca de Ejercicios
1. Navegar a **"Ejercicios"** en el menú lateral
2. Ver ejercicios categorizados por:
   - Tipo de ejercicio
   - Dificultad (Fácil/Intermedio/Avanzado)
   - Duración estimada
   - Descripción detallada

#### Agregar Nuevo Ejercicio
1. Hacer clic en **"➕ Nuevo Ejercicio"**
2. Completar información:
   - Nombre del ejercicio
   - Categoría
   - Dificultad
   - Duración en minutos
   - Descripción detallada
   - Instrucciones paso a paso

#### Filtrar Ejercicios
- **Por nombre**: Búsqueda de texto libre
- **Por categoría**: Filtro por tipo de ejercicio
- **Por dificultad**: Nivel de complejidad

### 🏢 Gestión de Instalaciones

#### Ver Estadísticas Financieras
1. Navegar a **"Instalaciones"** en el menú lateral
2. Ver resumen de:
   - **Ingresos totales**: Suma de todos los ingresos
   - **Gastos totales**: Costos operativos
   - **Beneficio neto**: Diferencia entre ingresos y gastos

#### Análisis Temporal
- **Gráfico mensual**: Evolución de ingresos y gastos
- **Filtro por fecha**: Ver datos hasta fecha específica
- **Clases del día**: Actividades programadas

### 👤 Perfil de Usuario

#### Acceder al Perfil
1. Hacer clic en el avatar en la esquina superior derecha
2. Seleccionar **"Perfil"**

#### Editar Información
- Actualizar datos personales
- Cambiar foto de perfil
- Modificar información de contacto

---

## 🗄️ Estructura de Base de Datos

### 📋 Tablas Principales

#### Tabla `usuarios`
```sql
CREATE TABLE usuarios (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre TEXT,
  telefono TEXT,
  foto_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla `alumnos`
```sql
CREATE TABLE alumnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellidos TEXT,
  email TEXT,
  telefono TEXT,
  fecha_nacimiento DATE,
  nivel_juego TEXT,
  observaciones TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla `profesores`
```sql
CREATE TABLE profesores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellidos TEXT,
  email TEXT,
  telefono TEXT,
  especialidad TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla `clases`
```sql
CREATE TABLE clases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo_clase TEXT CHECK (tipo_clase IN ('particular', 'grupal', 'interna', 'escuela')),
  nivel_clase TEXT CHECK (nivel_clase IN ('principiante', 'intermedio', 'avanzado')),
  dia_semana TEXT,
  hora_inicio TIME,
  hora_fin TIME,
  profesor TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla `eventos_clase`
```sql
CREATE TABLE eventos_clase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clase_id UUID REFERENCES clases(id),
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  estado TEXT DEFAULT 'programada',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla `alumnos_clases`
```sql
CREATE TABLE alumnos_clases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID REFERENCES alumnos(id),
  clase_id UUID REFERENCES clases(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(alumno_id, clase_id)
);
```

#### Tabla `asistencias`
```sql
CREATE TABLE asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID REFERENCES alumnos(id),
  clase_id UUID REFERENCES clases(id),
  fecha DATE NOT NULL,
  estado TEXT CHECK (estado IN ('asistio', 'falta', 'justificada')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla `pagos`
```sql
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID REFERENCES alumnos(id),
  cantidad DECIMAL(10,2) NOT NULL,
  mes_cubierto TEXT NOT NULL,
  metodo TEXT DEFAULT 'transferencia',
  fecha_pago TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla `ejercicios`
```sql
CREATE TABLE ejercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT,
  dificultad TEXT CHECK (dificultad IN ('Fácil', 'Intermedio', 'Avanzado')),
  duracion_minutos INTEGER,
  descripcion TEXT,
  instrucciones TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Tecnologías Utilizadas

### Frontend
- **React 19.1.1**: Framework principal
- **React Router DOM 7.8.2**: Navegación entre páginas
- **Tailwind CSS 4.1.12**: Framework de estilos
- **Chart.js 4.5.0**: Gráficos y visualizaciones
- **React Big Calendar 1.19.4**: Componente de calendario
- **Date-fns 4.1.0**: Manipulación de fechas

### Backend y Base de Datos
- **Supabase**: Backend como servicio (BaaS)
- **PostgreSQL**: Base de datos relacional
- **Row Level Security (RLS)**: Seguridad a nivel de fila

### Herramientas de Desarrollo
- **Vite 7.1.2**: Herramienta de construcción
- **ESLint 9.33.0**: Linter de código
- **PostCSS 8.5.6**: Procesador de CSS
- **Autoprefixer 10.4.21**: Prefijos CSS automáticos

---

## 🔧 Configuración Avanzada

### Variables de Entorno
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opcional: Configuración adicional
VITE_APP_NAME=CRM Pádel
VITE_APP_VERSION=1.0.0
```

### Scripts Disponibles
```json
{
  "dev": "vite",                    // Servidor de desarrollo
  "build": "vite build",           // Construcción para producción
  "lint": "eslint .",              // Verificación de código
  "preview": "vite preview"         // Vista previa de producción
}
```

### Estructura de Archivos
```
src/
├── components/          # Componentes reutilizables
│   ├── FormularioAlumno.jsx
│   ├── FormularioClase.jsx
│   ├── FormularioProfesor.jsx
│   ├── FormularioEjercicio.jsx
│   ├── ListaAlumnos.jsx
│   ├── Login.jsx
│   ├── ModalConfirmation.jsx
│   ├── navbar.jsx
│   └── Sidebar.jsx
├── contexts/           # Contextos de React
│   └── AuthContext.jsx
├── lib/               # Librerías y utilidades
│   └── supabase.js
├── pages/             # Páginas principales
│   ├── Dashboard.jsx
│   ├── Alumnos.jsx
│   ├── Profesores.jsx
│   ├── Clases.jsx
│   ├── Pagos.jsx
│   ├── Asistencias.jsx
│   ├── Ejercicios.jsx
│   ├── Instalaciones.jsx
│   └── PerfilUsuario.jsx
├── App.jsx            # Componente principal
├── main.jsx          # Punto de entrada
└── index.css         # Estilos globales
```

---

## 🆘 Solución de Problemas

### Problemas Comunes

#### 1. Error de Conexión con Supabase
**Síntomas**: La aplicación muestra datos de demostración
**Solución**:
1. Verificar que las variables de entorno estén correctas
2. Comprobar que el proyecto de Supabase esté activo
3. Verificar la URL y clave en Settings → API

#### 2. Error de Autenticación
**Síntomas**: No se puede iniciar sesión
**Solución**:
1. Usar las credenciales de prueba: `admin@test.com` / `admin123`
2. Verificar que la tabla `usuarios` esté creada
3. Comprobar la configuración de RLS en Supabase

#### 3. Datos No Se Cargan
**Síntomas**: Páginas en blanco o errores de carga
**Solución**:
1. Verificar la consola del navegador para errores
2. Comprobar la conexión a internet
3. Verificar que las tablas estén creadas correctamente

#### 4. Problemas de Estilos
**Síntomas**: Interfaz sin estilos o mal formateada
**Solución**:
1. Ejecutar `npm install` para reinstalar dependencias
2. Verificar que Tailwind CSS esté configurado
3. Limpiar caché del navegador

### Logs y Debugging
- **Consola del navegador**: F12 → Console
- **Logs de Supabase**: Dashboard → Logs
- **Logs de la aplicación**: Verificar mensajes en consola

---

## 📞 Soporte y Contacto

### Recursos de Ayuda
- **Documentación de Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Documentación de React**: [react.dev](https://react.dev)
- **Documentación de Tailwind**: [tailwindcss.com](https://tailwindcss.com)

### Información del Proyecto
- **Versión**: 1.0.0
- **Última actualización**: Enero 2024
- **Desarrollado con**: React + Supabase + Tailwind CSS

---

## 📝 Notas de Versión

### Versión 1.0.0 (Enero 2024)
- ✅ Gestión completa de alumnos
- ✅ Gestión de profesores
- ✅ Sistema de clases con calendario
- ✅ Control de asistencias
- ✅ Gestión de pagos
- ✅ Biblioteca de ejercicios
- ✅ Dashboard con estadísticas
- ✅ Gestión de instalaciones
- ✅ Autenticación segura
- ✅ Interfaz responsive

---

*Esta documentación está actualizada para la versión 1.0.0 del CRM Pádel. Para actualizaciones o soporte técnico, consulta la sección de contacto.*
