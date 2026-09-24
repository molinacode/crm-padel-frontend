require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { runQuery } = require('./src/query');
const { requireUser } = require('./src/session');
const { mountAuth } = require('./src/auth');
const { mountProfesoresAuth } = require('./src/profesoresAuth');
const { mountStorage } = require('./src/storage');
const { query } = require('./src/db');

const app = express();
const port = Number(process.env.PORT || 3001);
app.set('trust proxy', 1);
app.disable('x-powered-by');

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "script-src 'self'",
  "worker-src 'self' blob:",
  "connect-src 'self'",
].join('; ');

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', process.env.CSP || CSP);
  next();
});

// Limitador en memoria: un solo contenedor, no hace falta estado compartido.
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const entry = hits.get(key);
    if (!entry || now > entry.reset) {
      hits.set(key, { count: 1, reset: now + windowMs });
    } else if (++entry.count > max) {
      return res.status(429).json({ error: 'Demasiadas peticiones, prueba en un minuto' });
    }
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    }
    return next();
  };
}

const origins = (process.env.CORS_ORIGINS || 'http://localhost:5175,http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, service: 'crm-padel', db: 'ok' });
  } catch (error) {
    res.status(503).json({ ok: false, service: 'crm-padel', db: error.message });
  }
});

app.use('/api/auth/login', rateLimit({ windowMs: 60_000, max: 20 }));
mountAuth(app);
mountProfesoresAuth(app);
mountStorage(app);

const TABLAS_PROFESOR = new Set([
  'clases', 'eventos_clase', 'asistencias', 'ejercicios', 'profesores',
  'alumnos', 'alumnos_clases', 'cursos', 'recuperaciones_clase',
  'tematicas_clase', 'clases_ejercicios',
]);
const ESCRITURA_PROFESOR = new Set([
  'asistencias', 'recuperaciones_clase', 'tematicas_clase', 'clases_ejercicios',
]);

app.post('/api/query', rateLimit({ windowMs: 60_000, max: 600 }), requireUser, async (req, res) => {
  try {
    if (req.user.rol === 'profesor') {
      const table = req.body?.table;
      const op = req.body?.op;
      if (!TABLAS_PROFESOR.has(table) || (op !== 'select' && !ESCRITURA_PROFESOR.has(table))) {
        return res.status(403).json({
          data: null,
          error: { message: 'Esta consulta no está permitida para un profesor' },
        });
      }
    }
    const result = await runQuery(req.body || {});
    res.json(result);
  } catch (error) {
    console.error('[query]', error);
    res.status(400).json({
      data: null,
      error: { message: error.message || 'Error de consulta' },
    });
  }
});

const publicDir = process.env.PUBLIC_DIR || path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  if (req.method !== 'GET') return next();
  const index = path.join(publicDir, 'index.html');
  res.sendFile(index, err => {
    if (err) next();
  });
});

app.listen(port, () => {
  console.log(`CRM pádel API en http://localhost:${port}`);
});
