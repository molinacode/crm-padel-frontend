type CsvRow = Record<string, string>;

export interface MovimientoBancario {
  id: string;
  fechaOperacion: string;
  importe: number;
  concepto: string;
  referencia: string;
  ordenante: string;
}

export interface AlumnoMatch {
  alumnoId: string;
  alumnoNombre: string;
  score: number;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values.map(v => v.replace(/^"|"$/g, '').trim());
}

function detectarDelimitador(headerLine: string): string {
  const delimiters = [',', ';', '\t'];
  let best = ',';
  let bestCount = -1;
  delimiters.forEach(d => {
    const count = (headerLine.match(new RegExp(`\\${d}`, 'g')) || []).length;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  });
  return best;
}

function mapRow(headers: string[], values: string[]): CsvRow {
  const row: CsvRow = {};
  headers.forEach((h, idx) => {
    row[h] = values[idx] || '';
  });
  return row;
}

function parseFecha(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);

  const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function parseImporte(raw: string): number {
  const clean = raw.replace(/[^\d,.-]/g, '').trim();
  if (!clean) return 0;
  const normalized = clean.includes(',') && clean.includes('.')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean.replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? 0 : value;
}

function pickFirst(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const found = Object.keys(row).find(k => normalizar(k) === normalizar(key));
    if (found && row[found]) return row[found];
  }
  return '';
}

export function parseMovimientosCsv(content: string): MovimientoBancario[] {
  const lines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const delimiter = detectarDelimitador(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map(line => mapRow(headers, parseCsvLine(line, delimiter)));

  return rows
    .map((row, idx) => {
      const fechaRaw = pickFirst(row, ['fecha_operacion', 'fecha', 'fecha valor']);
      const importeRaw = pickFirst(row, ['importe', 'monto', 'abono']);
      const concepto = pickFirst(row, ['concepto', 'descripcion', 'detalle']);
      const referencia = pickFirst(row, ['referencia', 'id', 'n referencia']);
      const ordenante = pickFirst(row, ['nombre_ordenante', 'ordenante', 'beneficiario']);

      return {
        id: `csv-${idx + 1}`,
        fechaOperacion: parseFecha(fechaRaw),
        importe: parseImporte(importeRaw),
        concepto,
        referencia,
        ordenante,
      };
    })
    .filter(m => m.fechaOperacion && m.importe > 0);
}

export function sugerirAlumno(
  movimiento: MovimientoBancario,
  alumnos: Array<{ id: string; nombre: string }>
): AlumnoMatch | null {
  const texto = normalizar(`${movimiento.concepto} ${movimiento.ordenante}`);
  let best: AlumnoMatch | null = null;

  for (const alumno of alumnos) {
    const nombre = normalizar(alumno.nombre);
    if (!nombre) continue;
    let score = 0;

    if (texto.includes(nombre)) score += 60;
    const partes = nombre.split(' ').filter(Boolean);
    if (partes.some(p => p.length > 3 && texto.includes(p))) score += 25;
    if (/mensualidad|cuota|escuela|clases/.test(texto)) score += 10;

    if (!best || score > best.score) {
      best = {
        alumnoId: alumno.id,
        alumnoNombre: alumno.nombre,
        score,
      };
    }
  }

  if (!best || best.score < 40) return null;
  return best;
}
