/**
 * PNG desde un nodo DOM con modern-screenshot (SVG → canvas).
 * No usa html2canvas (incompatible con oklch / Tailwind v4).
 */
export async function domToPngSafe(node, options = {}) {
  const { domToPng } = await import('modern-screenshot');
  return domToPng(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    ...options,
  });
}
