/**
 * La partida: el estado del jugador y su línea temporal personal.
 *
 * `lineaTemporal` es la seña de identidad del juego: el registro de qué hechos quedaron en su
 * versión real y cuáles quedaron alterados para siempre en ESTA partida. Dos jugadores terminan
 * con dos ciudades distintas.
 */

import type { Gema } from './gemas';

export type ResolucionHecho = 'pendiente' | 'restaurada' | 'alterada';

export interface RegistroHecho {
  hechoId: string;
  resolucion: ResolucionHecho;
  /** El enunciado que quedó grabado en la historia de este jugador. */
  enunciadoFinal: string;
}

export interface Partida {
  version: 2;
  /** Lo elige el jugador. Por ahora no hay login, así que arranca vacío. */
  nombreJugador: string;
  gemas: Gema[];
  /** Ids de pistas obtenidas, en orden de descubrimiento. */
  pistas: string[];
  banderas: Record<string, boolean>;
  /** Cuánto avanzó el villano. Al llegar al máximo, el hecho se pierde. */
  corrupcion: number;
  lineaTemporal: RegistroHecho[];
  escenaActual: string;
  misionActual: string;
}

const CLAVE_GUARDADO = 'orden-cronistas:partida';
export const CORRUPCION_MAXIMA = 3;

export function partidaNueva(misionId: string, escenaId: string): Partida {
  return {
    version: 2,
    nombreJugador: '',
    // Sin Gemas: todavía no es parte de la Orden. La primera se la da Balbina.
    gemas: [],
    pistas: [],
    banderas: {},
    corrupcion: 0,
    lineaTemporal: [],
    escenaActual: escenaId,
    misionActual: misionId,
  };
}

export function guardar(partida: Partida): void {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(partida));
  } catch {
    // Modo incógnito o almacenamiento bloqueado: se juega igual, sin persistir.
  }
}

export function cargar(): Partida | null {
  try {
    const crudo = localStorage.getItem(CLAVE_GUARDADO);
    if (!crudo) return null;
    const dato = JSON.parse(crudo) as Partida;
    return dato.version === 2 ? dato : null;
  } catch {
    return null;
  }
}

export function borrarGuardado(): void {
  try {
    localStorage.removeItem(CLAVE_GUARDADO);
  } catch {
    /* nada que hacer */
  }
}

export function tienePista(partida: Partida, pistaId: string): boolean {
  return partida.pistas.includes(pistaId);
}

export function registrarHecho(
  partida: Partida,
  hechoId: string,
  resolucion: ResolucionHecho,
  enunciadoFinal: string,
): void {
  const existente = partida.lineaTemporal.find((r) => r.hechoId === hechoId);
  if (existente) {
    existente.resolucion = resolucion;
    existente.enunciadoFinal = enunciadoFinal;
  } else {
    partida.lineaTemporal.push({ hechoId, resolucion, enunciadoFinal });
  }
}
