/** Jugador, NPCs y objetos: posición en casillas con desplazamiento suave entre una y otra. */

import type { Direccion, SpriteObjeto } from './tipos';
import { Pantalla, TILE, type Color } from './pantalla';

/** Segundos que tarda en recorrer una casilla. */
const DURACION_PASO = 0.16;

export const DELTAS: Record<Direccion, { x: number; y: number }> = {
  norte: { x: 0, y: -1 },
  sur: { x: 0, y: 1 },
  este: { x: 1, y: 0 },
  oeste: { x: -1, y: 0 },
};

export class Actor {
  x: number;
  y: number;
  mirando: Direccion = 'sur';
  ropa: Color;
  pelo: Color;

  private desdeX: number;
  private desdeY: number;
  private avance = 1; // 1 = quieto
  /** Alterna el pie de apoyo en cada paso, como en los sprites de Pokémon. */
  private pasoPar = false;

  constructor(x: number, y: number, ropa: Color = 'rojo', pelo: Color = 'pelo') {
    this.x = x;
    this.y = y;
    this.desdeX = x;
    this.desdeY = y;
    this.ropa = ropa;
    this.pelo = pelo;
  }

  get moviendose(): boolean {
    return this.avance < 1;
  }

  /** Fase de caminata: 0 quieto, 1 o 2 según el pie. */
  get fase(): 0 | 1 | 2 {
    if (!this.moviendose) return 0;
    return this.pasoPar ? 1 : 2;
  }

  /** Arranca un paso hacia una casilla contigua. El llamador ya validó que se puede. */
  darPaso(x: number, y: number, mirando: Direccion): void {
    this.desdeX = this.x;
    this.desdeY = this.y;
    this.x = x;
    this.y = y;
    this.mirando = mirando;
    this.avance = 0;
    this.pasoPar = !this.pasoPar;
  }

  actualizar(dt: number): void {
    if (this.avance < 1) this.avance = Math.min(1, this.avance + dt / DURACION_PASO);
  }

  get px(): number {
    return (this.desdeX + (this.x - this.desdeX) * this.avance) * TILE;
  }

  get py(): number {
    return (this.desdeY + (this.y - this.desdeY) * this.avance) * TILE;
  }

  casillaEnfrente(): { x: number; y: number } {
    const d = DELTAS[this.mirando];
    return { x: this.x + d.x, y: this.y + d.y };
  }
}

/** Persona vista desde arriba en tres cuartos, al estilo de los sprites de Game Boy Advance. */
export function dibujarActor(
  p: Pantalla,
  px: number,
  py: number,
  mirando: Direccion,
  ropa: Color,
  pelo: Color = 'pelo',
  fase: 0 | 1 | 2 = 0,
): void {
  const x = Math.round(px);
  const y = Math.round(py);

  // Sombra en el piso.
  p.rect(x + 9, y + 28, 14, 3, 'sombra');
  p.rect(x + 11, y + 30, 10, 1, 'sombra');

  // Piernas: alternan según la fase de caminata.
  const izq = fase === 1 ? 1 : 0;
  const der = fase === 2 ? 1 : 0;
  p.rect(x + 11, y + 24 + izq, 4, 5 - izq, 'contorno');
  p.rect(x + 17, y + 24 + der, 4, 5 - der, 'contorno');

  // Cuerpo.
  p.rectBorde(x + 8, y + 16, 16, 9, ropa);
  if (mirando === 'sur') p.rect(x + 14, y + 18, 4, 7, 'contorno');

  // Brazos.
  p.rect(x + 6, y + 17, 3, 6, ropa);
  p.rect(x + 23, y + 17, 3, 6, ropa);

  // Cabeza.
  p.rectBorde(x + 8, y + 5, 16, 12, 'piel');

  // Pelo: de espaldas tapa toda la cabeza.
  if (mirando === 'norte') {
    p.rect(x + 9, y + 6, 14, 10, pelo);
  } else {
    p.rect(x + 9, y + 6, 14, 4, pelo);
    p.rect(x + 9, y + 6, 2, 8, pelo);
    p.rect(x + 21, y + 6, 2, 8, pelo);
  }

  // Ojos.
  if (mirando === 'sur') {
    p.rect(x + 12, y + 11, 2, 3, 'contorno');
    p.rect(x + 18, y + 11, 2, 3, 'contorno');
  } else if (mirando === 'este') {
    p.rect(x + 18, y + 11, 2, 3, 'contorno');
  } else if (mirando === 'oeste') {
    p.rect(x + 12, y + 11, 2, 3, 'contorno');
  }
}

/** Datos extra que algunos objetos necesitan para dibujarse (el calendario, su fecha). */
export interface DatosObjeto {
  lineas?: string[];
  destacado?: boolean;
}

export function dibujarObjeto(
  p: Pantalla,
  px: number,
  py: number,
  sprite: SpriteObjeto,
  color: Color,
  datos: DatosObjeto = {},
): void {
  const x = Math.round(px);
  const y = Math.round(py);

  switch (sprite) {
    case 'calendario':
      dibujarCalendario(p, x, y, datos.lineas ?? []);
      break;

    case 'cartel':
      p.rect(x + 13, y + 20, 6, 11, 'maderaOsc');
      p.rectBorde(x + 2, y + 4, 28, 18, 'madera');
      p.rect(x + 5, y + 7, 22, 12, 'papel');
      p.rect(x + 8, y + 10, 16, 2, 'sombra');
      p.rect(x + 8, y + 14, 11, 2, 'sombra');
      break;

    case 'documento':
      p.rect(x + 8, y + 26, 16, 3, 'sombra');
      p.rectBorde(x + 7, y + 8, 18, 19, 'papel');
      p.rect(x + 10, y + 12, 12, 2, 'sombra');
      p.rect(x + 10, y + 16, 12, 2, 'sombra');
      p.rect(x + 10, y + 20, 7, 2, 'sombra');
      break;

    case 'placa':
      p.rectBorde(x + 4, y + 10, 24, 16, color);
      p.rect(x + 8, y + 15, 16, 2, 'papel');
      p.rect(x + 8, y + 19, 10, 2, 'papel');
      break;

    case 'brillo': {
      // Un titileo: rombo claro con destellos. No tiene contorno, para que se vea "irreal".
      const c: Color = datos.destacado ? 'blanco' : color;
      for (let i = 0; i < 7; i++) {
        const ancho = 14 - Math.abs(i - 3) * 4;
        p.rect(x + 16 - ancho / 2, y + 10 + i * 2, ancho, 2, c);
      }
      p.rect(x + 6, y + 6, 3, 3, c);
      p.rect(x + 24, y + 22, 3, 3, c);
      p.rect(x + 25, y + 8, 2, 2, c);
      break;
    }
  }
}

/**
 * El calendario floral de la Plaza San Martín.
 *
 * Son canteros escalonados de granza con las letras en polvo de ladrillo. Se dibuja hacia
 * arriba y a los costados desde su casilla, porque no entra en 32 píxeles.
 */
function dibujarCalendario(p: Pantalla, x: number, y: number, lineas: string[]): void {
  const ANCHO_BASE = 124;
  const izq = x + 16 - ANCHO_BASE / 2;
  const arriba = y - 74;

  p.rect(izq - 4, arriba - 4, ANCHO_BASE + 8, 104, 'seto');

  lineas.forEach((linea, i) => {
    // Los canteros de abajo son más anchos: el conjunto arma una pirámide.
    const ancho = 46 + i * 15;
    const alto = 15;
    const cx = x + 16 - ancho / 2;
    const cy = arriba + i * (alto + 2);

    p.rect(cx - 2, cy - 1, ancho + 4, alto + 2, 'piedraOsc');
    p.rect(cx, cy, ancho, alto, 'granza');

    const tam = 10;
    const anchoTexto = p.anchoTexto(linea, tam);
    p.texto(linea, x + 16 - anchoTexto / 2, cy + 3, 'ladrillo', tam);
  });
}
