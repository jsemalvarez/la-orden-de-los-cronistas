/**
 * Las Gemas: el único recurso del juego y su reloj.
 *
 * Una Gema no es un número, es un **timestamp**. Su "potencia" es cuánto tiempo real estuvo
 * cargando sin usarse. Gastar no es restar una unidad: es empujar su reloj hacia adelante.
 * Esa es la razón de que el modelo guarde `cargadaDesde` y no un contador.
 */

/** Perillas de balanceo. Todo el ritmo del juego se ajusta desde acá. */
export const AJUSTES = {
  /** Tiempo real que tarda una Gema en ganar un punto de potencia. */
  msPorPunto: 60_000,
  /** Techo de potencia de una sola Gema: no sirve dejarla cargando un mes. */
  potenciaMaxima: 5,
  /** Costo fijo de cualquier salto temporal. */
  costoBaseSalto: 2,
  /** Un punto más por cada tantos años de distancia hacia el pasado. */
  aniosPorPuntoExtra: 50,
  /** Moverse entre lugares dentro de una misma época. */
  costoMovimiento: 1,
} as const;

export interface Gema {
  id: string;
  /** Momento desde el cual viene cargando, en ms epoch. */
  cargadaDesde: number;
}

/**
 * Crea una Gema. Las que entrega la Orden vienen cargadas al tope; las que el jugador
 * consigue por su cuenta arrancan en cero y hay que esperarlas.
 */
export function crearGema(id: string, ahora = Date.now(), cargada = false): Gema {
  if (cargada) return { id, cargadaDesde: ahora - AJUSTES.potenciaMaxima * AJUSTES.msPorPunto };
  return { id, cargadaDesde: ahora };
}

/** Potencia actual de una Gema, topeada. */
export function potencia(gema: Gema, ahora = Date.now()): number {
  const transcurrido = Math.max(0, ahora - gema.cargadaDesde);
  return Math.min(AJUSTES.potenciaMaxima, Math.floor(transcurrido / AJUSTES.msPorPunto));
}

export function potenciaTotal(gemas: Gema[], ahora = Date.now()): number {
  return gemas.reduce((suma, gema) => suma + potencia(gema, ahora), 0);
}

/** Cuántos puntos cuesta saltar de `anioOrigen` a `anioDestino`. */
export function costoSalto(anioOrigen: number, anioDestino: number): number {
  const distancia = Math.abs(anioOrigen - anioDestino);
  return AJUSTES.costoBaseSalto + Math.floor(distancia / AJUSTES.aniosPorPuntoExtra);
}

/** Milisegundos hasta que el conjunto gane un punto más. `null` si están todas al tope. */
export function msHastaProximoPunto(gemas: Gema[], ahora = Date.now()): number | null {
  let menor: number | null = null;
  for (const gema of gemas) {
    if (potencia(gema, ahora) >= AJUSTES.potenciaMaxima) continue;
    const transcurrido = ahora - gema.cargadaDesde;
    const falta = AJUSTES.msPorPunto - (transcurrido % AJUSTES.msPorPunto);
    if (menor === null || falta < menor) menor = falta;
  }
  return menor;
}

/**
 * Gasta `puntos` empezando por las Gemas más cargadas.
 * Devuelve `false` y no toca nada si no alcanza: el gasto es atómico.
 */
export function gastar(gemas: Gema[], puntos: number, ahora = Date.now()): boolean {
  if (puntos <= 0) return true;
  if (potenciaTotal(gemas, ahora) < puntos) return false;

  let restante = puntos;
  const porPotencia = [...gemas].sort((a, b) => potencia(b, ahora) - potencia(a, ahora));

  for (const gema of porPotencia) {
    if (restante === 0) break;
    const disponible = potencia(gema, ahora);
    if (disponible === 0) continue;
    const aGastar = Math.min(disponible, restante);
    // Gastar = empujar el reloj de carga hacia adelante. Primero se normaliza el excedente:
    // lo que cargó por encima del tope no existe, y si no, gastar no le haría nada.
    const base = Math.max(gema.cargadaDesde, ahora - AJUSTES.potenciaMaxima * AJUSTES.msPorPunto);
    gema.cargadaDesde = Math.min(ahora, base + aGastar * AJUSTES.msPorPunto);
    restante -= aGastar;
  }
  return true;
}
