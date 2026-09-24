const ALLOWED_TABLES = new Set([
  'alumnos',
  'alumnos_clases',
  'alumnos_grupos',
  'asistencias',
  'clases',
  'cursos',
  'clases_ejercicios',
  'ejercicios',
  'eventos_clase',
  'gastos_material',
  'grupos',
  'importaciones_banco',
  'importaciones_banco_movimientos',
  'instalaciones',
  'liberaciones_plaza',
  'logs_auditoria',
  'notificaciones',
  'notificaciones_admin',
  'notificaciones_profesor',
  'pagos',
  'pagos_clases_internas',
  'profesores',
  'recuperaciones_clase',
  'seguimiento_alumnos',
  'tematicas_clase',
  'tarifas_alquiler_escuela',
]);

// `staff` se gestiona solo desde /api/auth/* (es la tabla que decide el rol) y
// `usuarios` es la tabla heredada de Supabase Auth: ninguna se expone aquí.

/** Tablas donde solo se puede leer e insertar: el histórico no se toca. */
const APPEND_ONLY_TABLES = new Set(['logs_auditoria']);

function assertOperation(table, op) {
  if (APPEND_ONLY_TABLES.has(table) && op !== 'select' && op !== 'insert') {
    throw new Error(`Operación no permitida sobre ${table}: ${op}`);
  }
}

/** table -> embedName -> { from, toTable, to, many } */
const RELATIONS = {
  alumnos_clases: {
    alumnos: { from: 'alumno_id', toTable: 'alumnos', to: 'id', many: false },
    clases: { from: 'clase_id', toTable: 'clases', to: 'id', many: false },
    eventos_clase: { from: 'evento_id', toTable: 'eventos_clase', to: 'id', many: false },
  },
  alumnos_grupos: {
    alumnos: { from: 'alumno_id', toTable: 'alumnos', to: 'id', many: false },
    grupos: { from: 'grupo_id', toTable: 'grupos', to: 'id', many: false },
  },
  asistencias: {
    alumnos: { from: 'alumno_id', toTable: 'alumnos', to: 'id', many: false },
    clases: { from: 'clase_id', toTable: 'clases', to: 'id', many: false },
  },
  clases: {
    instalaciones: { from: 'instalacion_id', toTable: 'instalaciones', to: 'id', many: false },
    eventos_clase: { from: 'id', toTable: 'eventos_clase', to: 'clase_id', many: true },
    alumnos_clases: { from: 'id', toTable: 'alumnos_clases', to: 'clase_id', many: true },
    cursos: { from: 'curso_id', toTable: 'cursos', to: 'id', many: false },
  },
  clases_ejercicios: {
    clases: { from: 'clase_id', toTable: 'clases', to: 'id', many: false },
    ejercicios: { from: 'ejercicio_id', toTable: 'ejercicios', to: 'id', many: false },
  },
  eventos_clase: {
    clases: { from: 'clase_id', toTable: 'clases', to: 'id', many: false },
  },
  grupos: {
    clases: { from: 'clase_id', toTable: 'clases', to: 'id', many: false },
    instalaciones: { from: 'instalacion_id', toTable: 'instalaciones', to: 'id', many: false },
    alumnos_grupos: { from: 'id', toTable: 'alumnos_grupos', to: 'grupo_id', many: true },
  },
  liberaciones_plaza: {
    alumnos: { from: 'alumno_id', toTable: 'alumnos', to: 'id', many: false },
    clases: { from: 'clase_id', toTable: 'clases', to: 'id', many: false },
  },
  notificaciones_profesor: {
    alumnos: { from: 'alumno_id', toTable: 'alumnos', to: 'id', many: false },
    clases: { from: 'clase_id', toTable: 'clases', to: 'id', many: false },
  },
  pagos: {
    alumnos: { from: 'alumno_id', toTable: 'alumnos', to: 'id', many: false },
  },
  pagos_clases_internas: {
    clases: { from: 'clase_id', toTable: 'clases', to: 'id', many: false },
  },
  recuperaciones_clase: {
    alumnos: { from: 'alumno_id', toTable: 'alumnos', to: 'id', many: false },
    clases: { from: 'clase_id', toTable: 'clases', to: 'id', many: false },
  },
  seguimiento_alumnos: {
    profesores: { from: 'profesor_id', toTable: 'profesores', to: 'id', many: false },
  },
  tematicas_clase: {
    clases: { from: 'clase_id', toTable: 'clases', to: 'id', many: false },
  },
  importaciones_banco_movimientos: {
    importaciones_banco: { from: 'import_id', toTable: 'importaciones_banco', to: 'id', many: false },
    pagos: { from: 'pago_id_creado', toTable: 'pagos', to: 'id', many: false },
  },
};

function isIdent(name) {
  return typeof name === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

function quoteIdent(name) {
  if (!isIdent(name)) {
    throw new Error(`Identificador no permitido: ${name}`);
  }
  return `"${name}"`;
}

function assertTable(table) {
  if (!ALLOWED_TABLES.has(table) || !isIdent(table)) {
    throw new Error(`Tabla no permitida: ${table}`);
  }
  return table;
}

module.exports = {
  ALLOWED_TABLES,
  APPEND_ONLY_TABLES,
  RELATIONS,
  isIdent,
  quoteIdent,
  assertTable,
  assertOperation,
};
