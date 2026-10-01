type CsvRow = Record<string, string>;

export interface MovimientoBancario {
  id: string;
  fechaOperacion: string;
  importe: number;
  tipoMovimiento: 'ingreso' | 'gasto';
  concepto: string;
  referencia: string;
  ordenante: string;
  categoria: string;
  subcategoria: string;
  bancoOrigen: 'ing' | 'revolut' | 'desconocido';
  tipoOrigen: string;
  estadoOrigen: string;
  moneda: string;
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

function repararTextoMojibake(texto: string): string {
  if (!texto) return texto;
  const sinBom = texto.replace(/^\uFEFF/, '');
  // Heuristica: cadenas tipicas de UTF-8 mal interpretado (ej: "DescripciÃ³n")
  if (!/[ÃÂâ]/.test(sinBom)) return sinBom;
  try {
    const bytes = Uint8Array.from(sinBom, char => char.charCodeAt(0) & 0xff);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return sinBom;
  }
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
  return values.map(v => repararTextoMojibake(v.replace(/^"|"$/g, '').trim()));
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
    row[repararTextoMojibake(h)] = repararTextoMojibake(values[idx] || '');
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

function detectarBanco(headers: string[]): 'ing' | 'revolut' | 'desconocido' {
  const normalizados = headers.map(h => normalizar(h));
  const isIng =
    (normalizados.includes('f valor') || normalizados.includes('fecha valor')) &&
    normalizados.includes('categoria') &&
    normalizados.includes('subcategoria') &&
    normalizados.includes('descripcion') &&
    normalizados.some(h => h.includes('importe'));
  const isRevolut =
    normalizados.includes('tipo') &&
    normalizados.includes('fecha de inicio') &&
    normalizados.includes('fecha de finalizacion') &&
    normalizados.includes('descripcion') &&
    normalizados.includes('importe') &&
    normalizados.includes('divisa') &&
    normalizados.includes('state');
  if (isIng) return 'ing';
  if (isRevolut) return 'revolut';
  return 'desconocido';
}

function lineaSoloDelimitadores(line: string, delimiter: string): boolean {
  return parseCsvLine(line, delimiter).every(cell => !cell.trim());
}

/** ING a veces deja filas `;;;;` antes de la cabecera real. */
function indiceCabecera(lines: string[], delimiter: string): number {
  for (let i = 0; i < lines.length; i += 1) {
    if (lineaSoloDelimitadores(lines[i], delimiter)) continue;
    const headers = parseCsvLine(lines[i], delimiter).map(repararTextoMojibake);
    if (detectarBanco(headers) !== 'desconocido') return i;
    const n = headers.map(h => normalizar(h));
    const tieneFecha = n.some(
      h => h.includes('fecha') || h === 'f valor' || h.includes('valor')
    );
    const tieneImporte = n.some(h => h.includes('importe') || h.includes('monto'));
    const tieneConcepto = n.some(
      h => h.includes('descripcion') || h.includes('concepto') || h.includes('detalle')
    );
    if (tieneFecha && tieneImporte && tieneConcepto) return i;
  }
  return -1;
}

function extraerOrdenanteDesdeConcepto(concepto: string): string {
  const clean = concepto.trim();
  const bizum = clean.match(/bizum recibido de\s+(.+?)(?:\s+bizum|\s+pago|\s+clase|\s+clases|$)/i);
  if (bizum?.[1]) return bizum[1].trim();
  const transferencia = clean.match(/transferencia recibida de\s+(.+?)(?:\s+pago|\s+clase|\s+clases|$)/i);
  if (transferencia?.[1]) return transferencia[1].trim();
  const transferenciaGenerica = clean.match(/transferencia\s+(?:de|desde)\s+(.+?)(?:\s+concepto|\s+pago|\s+clase|\s+clases|$)/i);
  if (transferenciaGenerica?.[1]) return transferenciaGenerica[1].trim();
  const traspasoInterno = clean.match(/traspaso interno\s+(?:de|desde)\s+(.+?)(?:\s+concepto|\s+pago|\s+clase|\s+clases|$)/i);
  if (traspasoInterno?.[1]) return traspasoInterno[1].trim();
  return '';
}

export function parseMovimientosCsv(content: string): MovimientoBancario[] {
  const lines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  // Probar delimitadores habituales y quedarnos con el que encuentre cabecera
  let delimiter = detectarDelimitador(lines.find(l => !/^;+$/.test(l) && !/^,+$/.test(l)) || lines[0]);
  let headerIdx = indiceCabecera(lines, delimiter);
  if (headerIdx < 0) {
    for (const d of [';', ',', '\t']) {
      const idx = indiceCabecera(lines, d);
      if (idx >= 0) {
        delimiter = d;
        headerIdx = idx;
        break;
      }
    }
  }
  if (headerIdx < 0) return [];

  const headers = parseCsvLine(lines[headerIdx], delimiter).map(repararTextoMojibake);
  const banco = detectarBanco(headers);
  const dataLines = lines
    .slice(headerIdx + 1)
    .filter(line => !lineaSoloDelimitadores(line, delimiter));
  const rows = dataLines.map(line => mapRow(headers, parseCsvLine(line, delimiter)));

  return rows
    .map((row, idx) => {
      const fechaRaw = pickFirst(row, [
        'fecha_operacion',
        'fecha',
        'fecha valor',
        'f. valor',
        'f valor',
        'fecha de inicio',
      ]);
      const importeRaw = pickFirst(row, ['importe', 'importe (€)', 'monto', 'abono']);
      const concepto = pickFirst(row, ['concepto', 'descripcion', 'descripción', 'detalle']);
      const referencia = pickFirst(row, ['referencia', 'id', 'n referencia']);
      const ordenanteRaw = pickFirst(row, [
        'nombre_ordenante',
        'ordenante',
        'beneficiario',
      ]);
      const categoria = pickFirst(row, ['categoria', 'categoría']);
      const subcategoria = pickFirst(row, ['subcategoria', 'subcategoría']);
      const tipoOrigen = pickFirst(row, ['tipo']);
      const estadoOrigen = pickFirst(row, ['state', 'estado']);
      const moneda = pickFirst(row, ['divisa', 'moneda']) || 'EUR';
      const importe = parseImporte(importeRaw);
      const ordenanteInferido = ordenanteRaw || extraerOrdenanteDesdeConcepto(concepto);

      return {
        id: `csv-${idx + 1}`,
        fechaOperacion: parseFecha(fechaRaw),
        importe,
        tipoMovimiento: (importe >= 0 ? 'ingreso' : 'gasto') as
          | 'ingreso'
          | 'gasto',
        concepto,
        referencia,
        ordenante: ordenanteInferido,
        categoria,
        subcategoria,
        bancoOrigen: banco,
        tipoOrigen,
        estadoOrigen,
        moneda,
      };
    })
    .filter(m => m.fechaOperacion && m.importe !== 0 && m.concepto)
    .filter(m => {
      if (m.bancoOrigen !== 'revolut') return true;
      // En Revolut solo procesamos movimientos completados
      return normalizar(m.estadoOrigen || 'completado') === 'completado';
    });
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
    if (
      /mensualidad|cuota|escuela|clases|transferencia|traspaso interno/.test(
        texto
      )
    ) {
      score += 10;
    }

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

/** Huella estable para deduplicar el mismo movimiento en reimportaciones. */
export function huellaMovimiento(movimiento: MovimientoBancario): string {
  return [
    movimiento.bancoOrigen,
    movimiento.fechaOperacion,
    Number(movimiento.importe).toFixed(2),
    normalizar(movimiento.concepto),
    normalizar(movimiento.referencia || ''),
  ].join('|');
}

export function lineaCsvDeId(id: string): number {
  const match = String(id || '').match(/^(?:csv|pdf|xlsx)-(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function parseImporteFirmado(raw: string): number {
  const compact = raw.replace(/\s/g, '').replace(/[€£$]/g, '');
  if (!compact) return 0;
  const negativo =
    compact.startsWith('-') ||
    compact.startsWith('−') ||
    compact.endsWith('-');
  const positivo = compact.startsWith('+');
  const numero = compact.replace(/^[+−-]/, '').replace(/-$/, '');
  const valor = parseImporte(numero);
  if (!valor) return 0;
  if (negativo) return -Math.abs(valor);
  if (positivo) return Math.abs(valor);
  return valor;
}

/** Líneas tipo: `02/07/2026 Dinero añadido a través de BIZUM +€13.00 €84.37` */
export function parseMovimientosRevolutPdfTexto(texto: string): MovimientoBancario[] {
  const moneyRe =
    /([+-]?[€£$]\s*-?\d[\d.,]*|[€£$]\s*[+-]?\d[\d.,]*|[+-]\d[\d.,]*|\d[\d.,]*\s*[€£$])/g;
  const out: MovimientoBancario[] = [];
  const lines = texto
    .split(/\r?\n/)
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fechaMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/);
    if (!fechaMatch) continue;
    const fechaOperacion = parseFecha(fechaMatch[1]);
    if (!fechaOperacion) continue;
    const rest = fechaMatch[2];
    const moneys = [...rest.matchAll(moneyRe)];
    if (!moneys.length) continue;
    const amountMatch = moneys.length >= 2 ? moneys[moneys.length - 2] : moneys[0];
    const importe = parseImporteFirmado(amountMatch[0]);
    if (!importe) continue;
    const concepto = rest.slice(0, amountMatch.index ?? 0).trim();
    if (!concepto || /saldo|balance|opening|closing|extracto|statement|periodo/i.test(concepto)) {
      continue;
    }
    out.push({
      id: `pdf-${out.length + 1}`,
      fechaOperacion,
      importe,
      tipoMovimiento: importe >= 0 ? 'ingreso' : 'gasto',
      concepto,
      referencia: '',
      ordenante: extraerOrdenanteDesdeConcepto(concepto),
      categoria: '',
      subcategoria: '',
      bancoOrigen: 'revolut',
      tipoOrigen: '',
      estadoOrigen: 'COMPLETADO',
      moneda: /£/.test(amountMatch[0]) ? 'GBP' : 'EUR',
    });
  }
  return out;
}

async function textoDesdePdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const chunks: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    let line = '';
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = 'transform' in item && Array.isArray(item.transform) ? item.transform[5] : 0;
      if (lastY != null && Math.abs(y - lastY) > 2) {
        chunks.push(line.trim());
        line = '';
      }
      line += `${item.str} `;
      lastY = y;
    }
    if (line.trim()) chunks.push(line.trim());
  }
  return chunks.join('\n');
}

async function parseMovimientosExcel(file: File): Promise<MovimientoBancario[]> {
  const XLSX = await import('xlsx');
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ',' });
  return parseMovimientosCsv(csv);
}

/** CSV / Excel Revolut-ING o PDF de extracto Revolut. */
export async function parseMovimientosArchivo(file: File): Promise<MovimientoBancario[]> {
  const nombre = (file.name || '').toLowerCase();
  const tipo = (file.type || '').toLowerCase();

  if (
    nombre.endsWith('.pdf') ||
    tipo === 'application/pdf'
  ) {
    const texto = await textoDesdePdf(file);
    const fromPdf = parseMovimientosRevolutPdfTexto(texto);
    if (fromPdf.length) return fromPdf;
    // A veces el PDF es texto tabular exportable como CSV interno
    return parseMovimientosCsv(texto);
  }

  if (
    nombre.endsWith('.xlsx') ||
    nombre.endsWith('.xls') ||
    tipo.includes('spreadsheet') ||
    tipo.includes('excel')
  ) {
    return parseMovimientosExcel(file);
  }

  const content = await file.text();
  return parseMovimientosCsv(content);
}
