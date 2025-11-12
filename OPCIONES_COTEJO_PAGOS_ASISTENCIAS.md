# Opciones para Cotejar Pagos por Clases con Asistencias

## Contexto
Los alumnos pueden tener pagos de tipo `'clases'` que incluyen:
- `clases_cubiertas`: Número de clases pagadas
- `fecha_inicio` y `fecha_fin`: Rango de fechas cubierto
- `alumno_id`: ID del alumno

Las asistencias registran:
- `alumno_id`: ID del alumno
- `clase_id`: ID de la clase
- `fecha`: Fecha de la asistencia
- `estado`: Estado de la asistencia

## Opciones de Implementación

### **OPCIÓN 1: Notificación en Dashboard (Recomendada)**
**Ubicación:** Componente nuevo en Dashboard junto a `NotificacionesPagos`

**Funcionalidad:**
- Muestra alumnos con discrepancias entre pagos y asistencias
- Calcula: `clases_pagadas` vs `asistencias_registradas` en el rango de fechas del pago
- Muestra alertas visuales:
  - 🟢 Verde: Todo correcto
  - 🟡 Amarillo: Más asistencias que clases pagadas (posible deuda)
  - 🔴 Rojo: Muchas más asistencias que pagos (crítico)

**Ventajas:**
- Visible desde el inicio
- No requiere navegación adicional
- Similar a `NotificacionesPagos` existente

**Desventajas:**
- Puede saturar el dashboard si hay muchos casos

---

### **OPCIÓN 2: Tab/Sección en Ficha del Alumno**
**Ubicación:** Nueva tab en `FichaAlumno` o sección dentro de la tab "Pagos"

**Funcionalidad:**
- Muestra desglose detallado por cada pago de tipo 'clases'
- Para cada pago muestra:
  - Rango de fechas cubierto
  - Clases pagadas
  - Asistencias registradas en ese rango
  - Diferencia (positiva o negativa)
  - Lista de asistencias específicas

**Ventajas:**
- Información detallada y específica por alumno
- Permite revisar caso por caso
- No satura la vista general

**Desventajas:**
- Requiere ir a cada ficha de alumno
- Menos visible para detectar problemas globales

---

### **OPCIÓN 3: Página Dedicada de Verificación**
**Ubicación:** Nueva página `/pagos/verificacion` o `/pagos/cotejo`

**Funcionalidad:**
- Lista todos los alumnos con pagos por clases
- Tabla con columnas:
  - Alumno
  - Pagos por clases (total)
  - Asistencias registradas (en rangos de pagos)
  - Diferencia
  - Estado (✅/⚠️/❌)
  - Acciones (ver detalle, registrar pago)

**Ventajas:**
- Vista completa y centralizada
- Fácil de exportar o filtrar
- Ideal para auditorías periódicas

**Desventajas:**
- Requiere navegación específica
- Puede ser menos visible si no se consulta regularmente

---

### **OPCIÓN 4: Badge/Indicador en Lista de Alumnos**
**Ubicación:** Componente `Alumnos` - badge junto a cada alumno

**Funcionalidad:**
- Badge pequeño con número de discrepancias
- Color según severidad
- Click abre modal con detalles

**Ventajas:**
- Muy visible en la lista principal
- No requiere página adicional
- Rápido de escanear

**Desventajas:**
- Puede saturar visualmente la lista
- Menos espacio para detalles

---

### **OPCIÓN 5: Notificación Toast/Modal al Registrar Asistencia**
**Ubicación:** Componente `Asistencias` - al marcar asistencia

**Funcionalidad:**
- Al registrar una asistencia, verifica si hay pago que la cubra
- Si no hay pago que cubra esa fecha, muestra alerta:
  - "⚠️ Esta asistencia no está cubierta por ningún pago"
  - Opción rápida: "Registrar pago"

**Ventajas:**
- Preventivo: detecta el problema al momento
- Acción inmediata posible
- Evita acumulación de discrepancias

**Desventajas:**
- Solo detecta al momento de registrar
- No revisa discrepancias históricas automáticamente

---

### **OPCIÓN 6: Combinación (Recomendada para máxima utilidad)**
**Implementar OPCIÓN 1 + OPCIÓN 2 + OPCIÓN 5**

1. **Dashboard:** Notificaciones de discrepancias críticas (top 5-10)
2. **Ficha Alumno:** Tab detallada con desglose completo
3. **Al registrar asistencia:** Verificación preventiva

**Ventajas:**
- Cobertura completa: preventivo + reactivo + detallado
- Máxima visibilidad sin saturar
- Permite acción inmediata y revisión profunda

**Desventajas:**
- Más desarrollo inicial
- Más mantenimiento

---

## Lógica de Cálculo Propuesta

```javascript
// Para cada alumno con pagos tipo 'clases':
1. Obtener todos los pagos tipo 'clases' del alumno
2. Para cada pago:
   - Obtener asistencias del alumno entre fecha_inicio y fecha_fin
   - Contar asistencias con estado válido (no 'falta' o 'cancelada')
   - Comparar: clases_cubiertas vs asistencias_contadas
3. Calcular totales:
   - Total clases pagadas (suma de clases_cubiertas)
   - Total asistencias registradas (en todos los rangos)
   - Diferencia
```

## Recomendación Final

**Implementar OPCIÓN 6 (Combinación)** con prioridad:
1. **Fase 1:** OPCIÓN 2 (Tab en Ficha Alumno) - Base funcional
2. **Fase 2:** OPCIÓN 1 (Dashboard) - Visibilidad
3. **Fase 3:** OPCIÓN 5 (Preventivo) - Mejora continua

Esto proporciona:
- ✅ Funcionalidad completa desde el inicio
- ✅ Visibilidad de problemas críticos
- ✅ Prevención de nuevos problemas
- ✅ Revisión detallada cuando se necesite

