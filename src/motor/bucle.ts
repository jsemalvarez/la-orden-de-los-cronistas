/** Bucle principal con delta de tiempo acotado. */

export function iniciarBucle(paso: (dt: number) => void): () => void {
  let anterior = performance.now();
  let activo = true;

  const cuadro = (ahora: number) => {
    if (!activo) return;
    // Tope de 100 ms: si la pestaña estuvo en segundo plano, no saltamos medio juego.
    const dt = Math.min(0.1, (ahora - anterior) / 1000);
    anterior = ahora;
    paso(dt);
    requestAnimationFrame(cuadro);
  };

  requestAnimationFrame(cuadro);
  return () => {
    activo = false;
  };
}
