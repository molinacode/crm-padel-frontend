/**
 * PNG desde un nodo DOM con modern-screenshot (SVG -> canvas).
 * No usa html2canvas (incompatible con oklch / Tailwind v4).
 *
 * Nota: modern-screenshot no publica tipos en su d.ts principal, asi que
 * tipamos las opciones manualmente con un subconjunto util. Cuando el paquete
 * publique tipos, se puede sustituir por `import type { Options }`.
 */
export interface DomToPngSafeOptions {
  scale?: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
  quality?: number;
  /** Resto de opciones de modern-screenshot. */
  [key: string]: unknown;
}

export async function domToPngSafe(
  node: Node,
  options: DomToPngSafeOptions = {}
): Promise<string> {
  const { domToPng } = await import('modern-screenshot');
  return domToPng(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    ...options,
  });
}
