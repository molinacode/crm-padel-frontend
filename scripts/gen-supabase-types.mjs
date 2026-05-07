/**
 * Genera src/types/supabase.ts usando la CLI local (node_modules/supabase/bin).
 * Si falta el binario (postinstall no corrido), intenta pnpm dlx.
 * Solo escribe el fichero si el comando termina OK (evita vaciar el archivo con redirecciones `>` en Windows).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outFile = join(root, 'src', 'types', 'supabase.ts');

const args = [
  'gen',
  'types',
  'typescript',
  '--project-id',
  'hyieejamnaqsngnatftx',
  '--schema',
  'public',
];

const localBin =
  process.platform === 'win32'
    ? join(root, 'node_modules', 'supabase', 'bin', 'supabase.exe')
    : join(root, 'node_modules', 'supabase', 'bin', 'supabase');

function runLocal() {
  if (!existsSync(localBin)) {
    throw new Error(
      `No existe la CLI en:\n  ${localBin}\n\n` +
        'Soluciones:\n' +
        '  - pnpm install\n' +
        '  - pnpm rebuild supabase\n' +
        '  - node node_modules/supabase/scripts/postinstall.js'
    );
  }
  return execFileSync(localBin, args, {
    encoding: 'utf8',
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runDlx() {
  return execFileSync('pnpm', ['dlx', 'supabase@2.98.0', ...args], {
    encoding: 'utf8',
    cwd: root,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function main() {
  let ts = '';
  let lastErr = null;

  try {
    ts = runLocal();
  } catch (e) {
    lastErr = e;
    try {
      console.warn('CLI local fallo; reintentando con pnpm dlx supabase@2.98.0 ...');
      ts = runDlx();
    } catch (e2) {
      lastErr = e2;
    }
  }

  if (!ts) {
    console.error(
      '\nNo se pudieron generar los tipos de Supabase.\n\n' +
        'Causas habituales en Windows:\n' +
        '  1) No hay token de la CLI: ejecuta en esta carpeta del proyecto:\n' +
        '       pnpm exec supabase login\n' +
        '  2) Falta el ejecutable supabase.exe: ejecuta\n' +
        '       node node_modules/supabase/scripts/postinstall.js\n' +
        '     o: pnpm rebuild supabase\n\n' +
        'Alternativa: copia los tipos desde Supabase Studio (Database → API Docs → Generate types)\n' +
        'y pegalos en src/types/supabase.ts.\n'
    );
    if (lastErr) {
      const err = lastErr;
      const stderr = err.stderr ?? err.output?.[2];
      const stdout = err.stdout ?? err.output?.[1];
      if (stderr) console.error(stderr.toString());
      if (stdout) console.error(stdout.toString());
      if (err.message) console.error(err.message);
    }
    process.exit(1);
  }

  writeFileSync(outFile, ts, 'utf8');
  console.log('OK:', outFile);
}

main();
