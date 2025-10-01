# Changelog

## v0.1.0 - Mejoras de clases, gastos y correcciones

- Clases (vista tabla): cálculo correcto de alumnos presentes y huecos reales; botón “Ocupar huecos” visible cuando hay faltas justificadas; botón “Desasignar” siempre visible y con color diferenciado; highlight permanente y por evento.
- OcuparHuecos: lógica alineada con la tabla y validación consistente; filtro sin flicker; botones más visibles.
- DesasignarAlumnos: permite desasignar al menos 1 alumno; validación por exceso; textos de estado correctos.
- AsignarAlumnosClase: incluye clases del día actual.
- Pagos: unificación del cálculo de alumnos con deuda (coincide con Dashboard).
- calcularDeudas: detección de “escuela” por nombre de clase.
- Dashboard: corrección de redirecciones a Clases (tab=proximas) y highlight por id de evento.
- Instalaciones: integración de gastos de material (listado y cómputo), uso de `fecha_gasto_mes`.
- Migraciones: creación de `gastos_material` con columna persistida `fecha_gasto_mes`, triggers e índices; `liberaciones_plaza`.
- Logs: reducción y límite (máx. 5 clases problemáticas) para mantener la consola limpia.

## v1.0.0 - Inicial

- Rendimiento: preload de Google Fonts, reducción de CLS, tablas y tabs responsive.
- Accesibilidad: contraste mejorado, jerarquía de headings, touch targets.
- Clases: pestañas “Próximas”, “Impartidas”, “Canceladas”, “Asignar”, “Nueva”.
- Pagos: tabs “Historial de Pagos” y “Nuevos Pagos”.
- SW/PWA: logs silenciados en producción y botón “Buscar actualización”.
- SEO: robots.txt válido.
