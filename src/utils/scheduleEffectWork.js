/**
 * Diferir trabajo iniciado desde useEffect al siguiente animation frame,
 * para que las actualizaciones de estado no ocurran de forma síncrona
 * dentro del cuerpo del efecto (eslint-plugin-react-hooks: set-state-in-effect).
 *
 * @param {() => void} fn
 * @returns {() => void} cleanup — cancelar el frame pendiente
 */
export function scheduleEffectWork(fn) {
  const id = requestAnimationFrame(() => {
    fn();
  });
  return () => cancelAnimationFrame(id);
}
