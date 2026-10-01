# Plantillas CSV de Pagos

Documento de referencia para la importacion de movimientos bancarios en `Pagos > Importar CSV`.

## Objetivo

Definir un formato canonico interno y las plantillas por banco para:

- mapear columnas de forma consistente,
- mejorar el matching automatico,
- separar ingresos y gastos desde el origen.

## Formato canonico interno

Campos principales que usa el importador:

- `fechaOperacion`
- `importe`
- `tipoMovimiento` (`ingreso` | `gasto`)
- `concepto`
- `referencia`
- `ordenante`
- `categoria`
- `subcategoria`
- `bancoOrigen` (`ing` | `revolut` | `desconocido`)
- `tipoOrigen`
- `estadoOrigen`
- `moneda`

Reglas generales:

- `importe > 0` -> `ingreso`
- `importe < 0` -> `gasto`
- `importe = 0` -> se ignora
- Solo se crean pagos en `pagos` con movimientos `ingreso` en el flujo actual.
- Los `gasto` se muestran en conciliacion pero no se importan (siguen a mano).
- Al confirmar se persiste el lote y los movimientos de ingreso aceptados.

## Plantilla ING

Cabeceras detectadas (ejemplo real):

- `F. VALOR`
- `CATEGORÍA`
- `SUBCATEGORÍA`
- `DESCRIPCIÓN`
- `IMPORTE (€)`

Mapeo ING -> canonico:

- `F. VALOR` -> `fechaOperacion`
- `DESCRIPCIÓN` -> `concepto`
- `IMPORTE (€)` -> `importe`
- `CATEGORÍA` -> `categoria`
- `SUBCATEGORÍA` -> `subcategoria`

Notas ING:

- Suele venir con separador `;`.
- Puede incluir lineas vacias al final (`;;;;`) y se ignoran.
- `ordenante` se intenta extraer desde `DESCRIPCIÓN` con patrones:
  - `Bizum recibido de ...`
  - `Transferencia recibida de ...`
  - `Transferencia de ...` / `Transferencia desde ...`
  - `Traspaso interno de ...` / `Traspaso interno desde ...`

## Plantilla Revolut

Cabeceras detectadas (export estandar):

- `Tipo`
- `Producto`
- `Fecha de inicio`
- `Fecha de finalización`
- `Descripción`
- `Importe`
- `Comisión`
- `Divisa`
- `State`
- `Saldo`

Mapeo Revolut -> canonico:

- `Fecha de inicio` -> `fechaOperacion`
- `Descripción` -> `concepto`
- `Importe` -> `importe`
- `Tipo` -> `tipoOrigen`
- `State` -> `estadoOrigen`
- `Divisa` -> `moneda`

Regla especifica Revolut:

- Solo se importan movimientos con `State = COMPLETADO`.

## Codificacion y compatibilidad

Recomendado:

- CSV con cabeceras
- codificacion UTF-8
- separador `;` o `,`

El parser incluye reparacion automatica de texto mojibake para casos como:

- `DescripciÃ³n` -> `Descripción`
- `aÃ±adido` -> `añadido`

## Estado actual y siguiente fase

Estado actual:

- Parser ING y Revolut operativo.
- Conciliacion visual con distincion `ingreso`/`gasto`.
- Al confirmar se crea un lote en `importaciones_banco`.
- Cada ingreso aceptado se guarda en `importaciones_banco_movimientos`
  (concepto, ordenante, referencia, categoria, huella, match alumno).
- Se crea el pago en `pagos` con `origen_registro = importacion_banco`,
  `huella_movimiento` e `importacion_movimiento_id`.
- Duplicados (misma huella ya en `pagos` o en movimientos previos) se omiten.
- Los `gasto` se muestran pero **no se importan** (siguen a mano en Instalaciones).

Huella: `banco|fecha|importe|concepto|referencia` (normalizados).

Siguiente fase opcional:

- listado de lotes de importacion en pantalla,
- reabrir un lote y revisar movimientos,
- conciliacion posterior mas fina de conflictos.
