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

## Notas Importantes
- Los campos se crean con valores por defecto seguros
- Los datos existentes no se afectan
- Se crean índices para mejorar el rendimiento
- La migración es idempotente (se puede ejecutar múltiples veces sin problemas)
