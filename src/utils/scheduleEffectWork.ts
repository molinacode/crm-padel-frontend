/**
 * Diferir trabajo iniciado desde useEffect al siguiente animation frame,
 * para que las actualizaciones de estado no ocurran de forma sincrona
 * dentro del cuerpo del efecto (eslint-plugin-react-hooks: set-state-in-effect).
 */
export function scheduleEffectWork(fn: () => void): () => void {
  const id = requestAnimationFrame(() => {
    fn();
  });
  return () => cancelAnimationFrame(id);
}
