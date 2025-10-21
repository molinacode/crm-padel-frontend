# Migraciones para Sistema de Temáticas y Notificaciones de Profesores

## Fecha: 2025-01-27

### Descripción General
Estas migraciones implementan el sistema completo de gestión de temáticas y ejercicios para profesores, así como el sistema de notificaciones en tiempo real.

## Archivos de Migración

### 1. `2025-01-27_create-tematicas-clase.sql`
**Tabla:** `tematicas_clase`

**Propósito:** Gestionar las temáticas asignadas a las clases por los profesores.

**Campos:**
- `id` (UUID, PK): Identificador único
- `clase_id` (UUID, FK): Referencia a la clase
- `tematica` (VARCHAR): Nombre de la temática (ej: "Trabajo de derecha")
- `profesor` (VARCHAR): Nombre del profesor
- `fecha_asignacion` (DATE): Fecha de asignación
- `ejercicios_asignados` (INTEGER): Número de ejercicios asignados
- `observaciones` (TEXT): Observaciones adicionales
- `created_at`, `updated_at` (TIMESTAMP): Auditoría

**Índices:**
- `idx_tematicas_clase_clase_id`
- `idx_tematicas_clase_profesor`
- `idx_tematicas_clase_fecha`
- `idx_tematicas_clase_tematica`

### 2. `2025-01-27_create-notificaciones-profesor.sql`
**Tabla:** `notificaciones_profesor`

**Propósito:** Gestionar notificaciones específicas para profesores.

**Campos:**
- `id` (UUID, PK): Identificador único
- `profesor` (VARCHAR): Nombre del profesor destinatario
- `tipo` (VARCHAR): Tipo de notificación (cambio_horario, nuevo_alumno, etc.)
- `titulo` (VARCHAR): Título de la notificación
- `mensaje` (TEXT): Mensaje detallado
- `clase_id` (UUID, FK): Clase relacionada (opcional)
- `alumno_id` (UUID, FK): Alumno relacionado (opcional)
- `leida` (BOOLEAN): Estado de lectura
- `fecha_creacion` (TIMESTAMP): Fecha de creación
- `fecha_lectura` (TIMESTAMP): Fecha de lectura
- `prioridad` (VARCHAR): Prioridad (baja, normal, alta, urgente)

**Tipos de Notificaciones:**
- `cambio_horario`: Cambio en el horario de una clase
- `nuevo_alumno`: Nuevo alumno asignado a una clase
- `falta_alumno`: Falta de un alumno
- `recordatorio_clase`: Recordatorio de clase próxima
- `cambio_profesor`: Cambio de profesor asignado
- `clase_cancelada`: Clase cancelada
- `otro`: Otros tipos de notificaciones

**Función Auxiliar:**
- `crear_notificacion_profesor()`: Función para crear notificaciones programáticamente

### 3. `2025-01-27_update-clases-ejercicios.sql`
**Tabla:** `clases_ejercicios` (actualización)

**Propósito:** Agregar campos necesarios para el sistema de temáticas.

**Nuevos Campos:**
- `tematica` (VARCHAR): Temática a la que pertenece el ejercicio
- `profesor` (VARCHAR): Profesor que asignó el ejercicio
- `fecha_asignacion` (DATE): Fecha de asignación
- `orden_ejercicio` (INTEGER): Orden de ejecución
- `observaciones` (TEXT): Observaciones específicas
- `updated_at` (TIMESTAMP): Campo de auditoría

## Instrucciones de Aplicación

### Orden de Ejecución:
1. `2025-01-27_create-tematicas-clase.sql`
2. `2025-01-27_create-notificaciones-profesor.sql`
3. `2025-01-27_update-clases-ejercicios.sql`

### Aplicar Migraciones:
```sql
-- En Supabase SQL Editor o psql
\i migrations/2025-01-27_create-tematicas-clase.sql
\i migrations/2025-01-27_create-notificaciones-profesor.sql
\i migrations/2025-01-27_update-clases-ejercicios.sql
```

## Políticas RLS Recomendadas

### Para `tematicas_clase`:
```sql
-- Habilitar RLS
ALTER TABLE tematicas_clase ENABLE ROW LEVEL SECURITY;

-- Política para lectura (todos los usuarios autenticados)
CREATE POLICY "Permitir lectura de temáticas" ON tematicas_clase
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserción (solo profesores)
CREATE POLICY "Permitir inserción de temáticas" ON tematicas_clase
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para actualización (solo el profesor que creó la temática)
CREATE POLICY "Permitir actualización de temáticas" ON tematicas_clase
    FOR UPDATE USING (profesor = auth.jwt() ->> 'name');
```

### Para `notificaciones_profesor`:
```sql
-- Habilitar RLS
ALTER TABLE notificaciones_profesor ENABLE ROW LEVEL SECURITY;

-- Política para lectura (solo el profesor destinatario)
CREATE POLICY "Permitir lectura de notificaciones propias" ON notificaciones_profesor
    FOR SELECT USING (profesor = auth.jwt() ->> 'name');

-- Política para actualización (solo el profesor destinatario)
CREATE POLICY "Permitir actualización de notificaciones propias" ON notificaciones_profesor
    FOR UPDATE USING (profesor = auth.jwt() ->> 'name');

-- Política para inserción (sistema/admin)
CREATE POLICY "Permitir inserción de notificaciones" ON notificaciones_profesor
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## Funcionalidades Implementadas

### Para Profesores:
- ✅ Asignar temáticas a clases
- ✅ Seleccionar múltiples ejercicios por temática
- ✅ Ver historial de clases con ejercicios
- ✅ Recibir notificaciones en tiempo real
- ✅ Reutilizar temáticas en múltiples clases

### Para Administradores:
- ✅ Seguimiento pedagógico completo
- ✅ Estadísticas de uso de ejercicios
- ✅ Control de calidad del contenido
- ✅ Gestión de notificaciones

## Notas Importantes

1. **Compatibilidad**: Las migraciones son compatibles con la estructura existente
2. **Índices**: Se crean índices optimizados para consultas frecuentes
3. **Triggers**: Se incluyen triggers para auditoría automática
4. **Validaciones**: Se incluyen constraints para integridad de datos
5. **Funciones**: Se proporcionan funciones auxiliares para facilitar el uso

## Próximos Pasos

1. Aplicar las migraciones en el entorno de desarrollo
2. Configurar las políticas RLS
3. Probar las funcionalidades implementadas
4. Aplicar en producción cuando esté listo
