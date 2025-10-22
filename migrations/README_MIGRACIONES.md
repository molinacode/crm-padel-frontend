# Migraciones de Base de Datos - CRM Pádel

## Problema Identificado
La aplicación está fallando al modificar eventos porque faltan campos en la base de datos de Supabase.

## Campos Faltantes

### Tabla `eventos_clase`
- `modificado_individualmente` (boolean) - Para marcar eventos modificados individualmente
- `fecha_modificacion` (timestamp) - Para registrar cuándo se modificó el evento

### Tabla `alumnos_clases`
- `origen` (text) - Para distinguir entre alumnos de escuela e interna

## Solución

### Opción 1: Ejecutar en Supabase Dashboard
1. Ve a tu proyecto en Supabase Dashboard
2. Ve a SQL Editor
3. Copia y pega el contenido de `2025-01-27_add-missing-fields-complete.sql`
4. Ejecuta el script

### Opción 2: Ejecutar desde línea de comandos
```bash
# Si tienes psql instalado
psql -h your-supabase-host -U postgres -d postgres -f migrations/2025-01-27_add-missing-fields-complete.sql
```

### Opción 3: Verificar campos existentes
Antes de ejecutar la migración, puedes verificar qué campos faltan ejecutando:
```sql
-- Copia el contenido de 2025-01-27_verificar-campos.sql en Supabase SQL Editor
```

## Campos que se agregarán

### eventos_clase
```sql
ALTER TABLE public.eventos_clase 
ADD COLUMN modificado_individualmente boolean DEFAULT false;

ALTER TABLE public.eventos_clase 
ADD COLUMN fecha_modificacion timestamp with time zone;
```

### alumnos_clases
```sql
ALTER TABLE public.alumnos_clases 
ADD COLUMN origen text DEFAULT 'interna';
```

## Índices que se crearán
- `idx_eventos_clase_modificado` - Para mejorar consultas por modificado_individualmente
- `idx_eventos_clase_estado` - Para mejorar consultas por estado
- `idx_alumnos_clases_origen` - Para mejorar consultas por origen

## Verificación
Después de ejecutar la migración, puedes verificar que todo esté correcto ejecutando el script de verificación.

## Migraciones del Sistema de Temáticas y Ejercicios (2025-01-28)

### Nuevas Tablas Creadas

#### `tematicas_clase`
- **Archivo**: `2025-01-28_create-tematicas-clase.sql`
- **Propósito**: Gestionar las temáticas asignadas a las clases por los profesores
- **Campos principales**:
  - `tematica` - Nombre de la temática (ej: "Trabajo de derecha")
  - `profesor` - Profesor que asigna la temática
  - `ejercicios_asignados` - Número de ejercicios asignados
  - `fecha_asignacion` - Fecha de asignación

#### `notificaciones_profesor`
- **Archivo**: `2025-01-28_create-notificaciones-profesor.sql`
- **Propósito**: Sistema de notificaciones en tiempo real para profesores
- **Campos principales**:
  - `tipo` - Tipo de notificación (cambio_horario, nuevo_alumno, etc.)
  - `titulo` y `mensaje` - Contenido de la notificación
  - `leida` - Estado de lectura
  - `prioridad` - Nivel de prioridad (baja, normal, alta, urgente)

#### Mejoras a `clases_ejercicios`
- **Archivo**: `2025-01-28_improve-clases-ejercicios.sql`
- **Propósito**: Mejorar la tabla existente para el sistema de temáticas
- **Nuevos campos**:
  - `tematica` - Temática a la que pertenece el ejercicio
  - `profesor` - Profesor que asignó el ejercicio
  - `fecha_asignacion` - Fecha de asignación
  - `orden_ejercicio` - Orden dentro de la temática
  - `duracion_minutos` - Duración específica
  - `observaciones` - Notas adicionales

### Funciones SQL Creadas

1. **`crear_notificacion_profesor()`** - Crear notificaciones automáticamente
2. **`marcar_notificacion_leida()`** - Marcar notificaciones como leídas
3. **`obtener_notificaciones_profesor()`** - Obtener notificaciones de un profesor
4. **`obtener_ejercicios_clase_tematica()`** - Obtener ejercicios por temática

### Cómo Ejecutar las Migraciones

1. **En Supabase Dashboard**:
   - Ve a SQL Editor
   - Ejecuta cada archivo en orden:
     - `2025-01-28_create-tematicas-clase.sql`
     - `2025-01-28_create-notificaciones-profesor.sql`
     - `2025-01-28_improve-clases-ejercicios.sql`
     - `2025-01-28_add-tipo-recuperacion.sql`

2. **Verificar la instalación**:
   ```sql
   -- Verificar que las tablas existen
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('tematicas_clase', 'notificaciones_profesor');
   
   -- Verificar campos de clases_ejercicios
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'clases_ejercicios' 
   AND column_name IN ('tematica', 'profesor', 'fecha_asignacion');
   ```

## Notas Importantes
- Los campos se crean con valores por defecto seguros
- Los datos existentes no se afectan
- Se crean índices para mejorar el rendimiento
- La migración es idempotente (se puede ejecutar múltiples veces sin problemas)
- Las nuevas funcionalidades requieren estas migraciones para funcionar correctamente
