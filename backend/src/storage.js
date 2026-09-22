const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { requireUser } = require('./session');

const BUCKET = 'fotos-alumnos';

function fotosDir() {
  return process.env.FOTOS_DIR || path.join(__dirname, '..', 'data', 'fotos-alumnos');
}

function ensureDir() {
  fs.mkdirSync(fotosDir(), { recursive: true });
}

function safeName(name) {
  return String(name || 'foto')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 180);
}

// Para leer/borrar no se reescribe el nombre: las fotos migradas de Supabase
// conservan el suyo y `safeName` las dejaría fuera. Solo se corta el traspaso
// de directorio.
function resolveExisting(name) {
  const limpio = String(name || '');
  if (!limpio || limpio.includes('/') || limpio.includes('\\') || limpio.includes('..')) {
    return null;
  }
  const dir = fotosDir();
  const file = path.join(dir, limpio);
  if (path.dirname(path.resolve(file)) !== path.resolve(dir)) return null;
  return file;
}

const TIPOS_PERMITIDOS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir();
      cb(null, fotosDir());
    },
    filename: (req, file, cb) => {
      cb(null, safeName(req.params.filename || file.originalname));
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
      cb(new Error('Solo se admiten imágenes (jpeg, png, webp, gif, avif)'));
      return;
    }
    cb(null, true);
  },
});

// Las fotos se guardan sin extensión (tanto las nuevas como las migradas de
// Supabase), así que el tipo se deduce de la cabecera del fichero. Sin esto se
// sirven sin Content-Type y el navegador tiene que adivinarlo.
function tipoPorFirma(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const head = Buffer.alloc(16);
    fs.readSync(fd, head, 0, 16, 0);
    if (head[0] === 0xff && head[1] === 0xd8) return 'image/jpeg';
    if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
      return 'image/png';
    if (head.subarray(0, 3).toString('latin1') === 'GIF') return 'image/gif';
    if (head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP')
      return 'image/webp';
    if (head.subarray(4, 8).toString('latin1') === 'ftyp') return 'image/avif';
    return null;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function publicUrl(filename) {
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${base}/${BUCKET}/${encodeURIComponent(filename)}`;
}

function mountStorage(app) {
  ensureDir();

  app.get(`/${BUCKET}/:filename`, (req, res) => {
    const file = resolveExisting(req.params.filename);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return res.status(404).end();
    }
    const tipo = tipoPorFirma(file);
    res.sendFile(file, {
      headers: {
        'Content-Type': tipo || 'application/octet-stream',
        'Content-Disposition': tipo ? 'inline' : 'attachment',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  });

  app.post(
    `/api/storage/${BUCKET}/:filename`,
    requireUser,
    (req, res, next) => {
      upload.single('file')(req, res, err => {
        if (err) return res.status(400).json({ error: err.message });
        next();
      });
    },
    (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'Sin archivo' });
      if (!tipoPorFirma(req.file.path)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'El archivo no es una imagen válida' });
      }
      res.json({ path: req.file.filename, publicUrl: publicUrl(req.file.filename) });
    }
  );

  app.delete(`/api/storage/${BUCKET}/:filename`, requireUser, (req, res) => {
    const file = resolveExisting(req.params.filename);
    if (file && fs.existsSync(file) && fs.statSync(file).isFile()) fs.unlinkSync(file);
    res.json({ ok: true });
  });
}

module.exports = { mountStorage, publicUrl, BUCKET };
