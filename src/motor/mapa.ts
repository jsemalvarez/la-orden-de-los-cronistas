/**
 * Catálogo de casillas y dibujo del mapa.
 *
 * Los tiles se dibujan por código, sin PNG: el juego no depende de que exista arte todavía,
 * y la paleta queda garantizada. Cada casilla varía un poco según su posición para que una
 * pradera no se vea como un mosaico repetido.
 */

import type { Mapa } from './tipos';
import { Pantalla, TILE, ANCHO, ALTO, type Color } from './pantalla';

/** Variación estable por casilla: la misma posición da siempre el mismo detalle. */
function ruido(x: number, y: number, sal = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + sal * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function mata(p: Pantalla, x: number, y: number, color: Color): void {
  p.rect(x, y + 2, 2, 4, color);
  p.rect(x + 3, y, 2, 6, color);
  p.rect(x + 6, y + 2, 2, 4, color);
}

type Dibujante = (p: Pantalla, x: number, y: number, cx: number, cy: number) => void;

interface DefCasilla {
  base: Color;
  dibujar?: Dibujante;
}

const CASILLAS: Record<string, DefCasilla> = {
  pasto: {
    base: 'pasto',
    dibujar: (p, x, y, cx, cy) => {
      if (ruido(cx, cy) > 0.55) mata(p, x + 6, y + 18, 'pastoDet');
      if (ruido(cx, cy, 3) > 0.7) mata(p, x + 20, y + 8, 'pastoDet');
      if (ruido(cx, cy, 7) > 0.85) mata(p, x + 14, y + 26, 'pastoOsc');
    },
  },
  loma: {
    base: 'pastoOsc',
    dibujar: (p, x, y, cx, cy) => {
      if (ruido(cx, cy, 2) > 0.5) mata(p, x + 9, y + 20, 'pastoDet');
      if (ruido(cx, cy, 5) > 0.75) mata(p, x + 22, y + 11, 'pasto');
    },
  },
  seto: {
    base: 'seto',
    dibujar: (p, x, y, cx, cy) => {
      p.rect(x, y, TILE, 5, 'setoOsc');
      p.rect(x, y + TILE - 4, TILE, 4, 'setoOsc');
      for (let i = 0; i < 4; i++) {
        const dx = 3 + i * 8;
        if (ruido(cx + i, cy, 11) > 0.35) p.rect(x + dx, y + 10, 4, 4, 'hojaClara');
        if (ruido(cx, cy + i, 13) > 0.6) p.rect(x + dx + 2, y + 19, 3, 3, 'hoja');
      }
    },
  },
  arbol: {
    base: 'pasto',
    dibujar: (p, x, y) => {
      p.rect(x + 13, y + 20, 6, 11, 'tronco');
      p.rect(x + 13, y + 20, 2, 11, 'maderaOsc');
      p.rectBorde(x + 4, y + 2, 24, 10, 'hoja');
      p.rectBorde(x + 2, y + 9, 28, 9, 'hoja');
      p.rectBorde(x + 6, y + 15, 20, 8, 'hoja');
      p.rect(x + 8, y + 5, 8, 4, 'hojaClara');
      p.rect(x + 6, y + 12, 6, 3, 'hojaClara');
    },
  },
  camino: {
    base: 'camino',
    dibujar: (p, x, y, cx, cy) => {
      if (ruido(cx, cy, 17) > 0.6) p.rect(x + 7, y + 11, 3, 2, 'caminoDet');
      if (ruido(cx, cy, 19) > 0.7) p.rect(x + 21, y + 22, 3, 2, 'caminoDet');
    },
  },
  peatonal: {
    base: 'peatonal',
    dibujar: (p, x, y) => {
      p.rect(x, y + 15, TILE, 1, 'peatonalDet');
      p.rect(x, y + 31, TILE, 1, 'peatonalDet');
      p.rect(x + 15, y, 1, 16, 'peatonalDet');
      p.rect(x + 7, y + 16, 1, 16, 'peatonalDet');
      p.rect(x + 23, y + 16, 1, 16, 'peatonalDet');
    },
  },
  calle: {
    base: 'calle',
    dibujar: (p, x, y, cx, cy) => {
      if (ruido(cx, cy, 23) > 0.65) p.rect(x + 11, y + 17, 4, 2, 'calleDet');
      if (ruido(cx, cy, 29) > 0.8) p.rect(x + 24, y + 6, 3, 2, 'calleDet');
    },
  },
  agua: {
    base: 'agua',
    dibujar: (p, x, y, cx, cy) => {
      p.rect(x + 4, y + 9, 12, 2, 'aguaClara');
      if (ruido(cx, cy, 31) > 0.5) p.rect(x + 18, y + 21, 10, 2, 'aguaClara');
    },
  },
  arena: {
    base: 'arena',
    dibujar: (p, x, y, cx, cy) => {
      if (ruido(cx, cy, 37) > 0.55) p.rect(x + 9, y + 13, 2, 2, 'arenaDet');
      if (ruido(cx, cy, 41) > 0.7) p.rect(x + 22, y + 24, 2, 2, 'arenaDet');
    },
  },
  piedra: {
    base: 'piedra',
    dibujar: (p, x, y) => {
      p.rect(x, y + 10, TILE, 2, 'piedraOsc');
      p.rect(x, y + 21, TILE, 2, 'piedraOsc');
      p.rect(x + 15, y, 2, 10, 'piedraOsc');
      p.rect(x + 7, y + 12, 2, 9, 'piedraOsc');
      p.rect(x + 24, y + 23, 2, 9, 'piedraOsc');
      p.rect(x + 2, y + 2, 10, 3, 'piedraClara');
    },
  },
  muro: {
    base: 'piedraClara',
    dibujar: (p, x, y) => {
      p.rect(x, y, TILE, 2, 'piedraOsc');
      p.rectBorde(x + 8, y + 9, 16, 14, 'vidrio');
      p.rect(x + 15, y + 10, 2, 12, 'piedraOsc');
      p.rect(x + 9, y + 15, 14, 2, 'piedraOsc');
    },
  },
  pared: {
    base: 'piedraClara',
    dibujar: (p, x, y) => {
      p.rect(x, y, TILE, 3, 'piedraOsc');
      p.rect(x, y + TILE - 2, TILE, 2, 'piedra');
      p.rect(x + 4, y + 8, TILE - 8, 2, 'piedra');
    },
  },
  techo: {
    base: 'teja',
    dibujar: (p, x, y) => {
      for (let i = 0; i < 4; i++) p.rect(x, y + 1 + i * 8, TILE, 2, 'tejaOsc');
      p.rect(x, y, TILE, 1, 'contorno');
    },
  },
  torre: {
    base: 'piedraClara',
    dibujar: (p, x, y) => {
      p.rect(x, y, 2, TILE, 'piedraOsc');
      p.rect(x + TILE - 2, y, 2, TILE, 'piedraOsc');
      p.rectBorde(x + 11, y + 6, 10, 20, 'contorno');
      p.rect(x + 13, y + 9, 6, 15, 'vidrio');
    },
  },
  naveIglesia: {
    base: 'piedra',
    dibujar: (p, x, y) => {
      p.rect(x, y, TILE, 2, 'piedraOsc');
      p.rect(x, y + 30, TILE, 2, 'piedraOsc');
      p.rect(x + 13, y, 6, TILE, 'piedraClara');
      p.rect(x + 15, y, 2, TILE, 'papelSombra');
      for (let i = 0; i < 4; i++) {
        p.rect(x + 2, y + 5 + i * 8, 10, 2, 'piedraOsc');
        p.rect(x + 20, y + 5 + i * 8, 10, 2, 'piedraOsc');
      }
    },
  },
  frenteIglesia: {
    base: 'piedraClara',
    dibujar: (p, x, y) => {
      p.rect(x, y, TILE, 3, 'piedraOsc');
      p.rect(x, y + 29, TILE, 3, 'piedraOsc');
      p.rectBorde(x + 9, y + 8, 16, 16, 'vidrio');
      p.rect(x + 16, y + 9, 2, 14, 'piedraOsc');
      p.rect(x + 10, y + 15, 14, 2, 'piedraOsc');
      p.rect(x + 12, y + 11, 3, 3, 'amarillo');
      p.rect(x + 19, y + 18, 3, 3, 'amarillo');
    },
  },
  campanario: {
    base: 'piedraClara',
    dibujar: (p, x, y) => {
      p.rect(x, y, TILE, 4, 'piedraOsc');
      p.rect(x + 4, y + 4, 24, 3, 'piedra');
      p.rectBorde(x + 8, y + 9, 16, 15, 'piedraOsc');
      p.rect(x + 11, y + 12, 10, 10, 'contorno');
      p.rect(x + 13, y + 14, 6, 6, 'amarillo');
      p.rect(x + 2, y + 26, 28, 4, 'piedra');
      p.rect(x + 14, y + 24, 4, 2, 'piedraClara');
    },
  },
  torreReloj: {
    base: 'piedraClara',
    dibujar: (p, x, y) => {
      p.rect(x, y, 2, TILE, 'piedraOsc');
      p.rect(x + TILE - 2, y, 2, TILE, 'piedraOsc');
      p.rectBorde(x + 6, y + 5, 20, 20, 'papel');
      p.rect(x + 15, y + 9, 2, 8, 'contorno');
      p.rect(x + 16, y + 15, 6, 2, 'contorno');
    },
  },
  marquesina: {
    base: 'piedraClara',
    dibujar: (p, x, y) => {
      p.rect(x, y, TILE, 4, 'tejaOsc');
      p.rectBorde(x + 2, y + 6, 28, 12, 'amarillo');
      p.rect(x + 5, y + 10, 22, 2, 'tejaOsc');
      p.rect(x, y + 20, TILE, 12, 'piedraClara');
      p.rect(x + 4, y + 22, 3, 3, 'amarillo');
      p.rect(x + 25, y + 22, 3, 3, 'amarillo');
    },
  },
  porton: {
    base: 'piedraClara',
    dibujar: (p, x, y) => {
      p.rect(x, y, TILE, 4, 'piedraOsc');
      p.rectBorde(x + 2, y + 4, 28, 28, 'maderaOsc');
      p.rect(x + 5, y + 7, 10, 25, 'madera');
      p.rect(x + 17, y + 7, 10, 25, 'madera');
      p.rect(x + 13, y + 18, 2, 3, 'amarillo');
      p.rect(x + 18, y + 18, 2, 3, 'amarillo');
    },
  },
  puerta: {
    base: 'madera',
    dibujar: (p, x, y) => {
      p.rect(x + 3, y + 2, 26, 30, 'maderaOsc');
      p.rect(x + 5, y + 4, 22, 28, 'madera');
      p.rect(x + 22, y + 17, 3, 3, 'amarillo');
    },
  },
  piso: {
    base: 'piedraClara',
    dibujar: (p, x, y) => {
      p.rect(x, y + 15, TILE, 1, 'piedra');
      p.rect(x + 15, y, 1, TILE, 'piedra');
    },
  },
  muelle: {
    base: 'madera',
    dibujar: (p, x, y) => {
      p.rect(x, y + 7, TILE, 2, 'maderaOsc');
      p.rect(x, y + 16, TILE, 2, 'maderaOsc');
      p.rect(x, y + 25, TILE, 2, 'maderaOsc');
    },
  },
  banco: {
    base: 'pasto',
    dibujar: (p, x, y) => {
      p.rectBorde(x + 2, y + 12, 28, 7, 'madera');
      p.rect(x + 5, y + 19, 4, 8, 'maderaOsc');
      p.rect(x + 23, y + 19, 4, 8, 'maderaOsc');
    },
  },
  reja: {
    base: 'pasto',
    dibujar: (p, x, y) => {
      p.rect(x, y + 13, TILE, 3, 'blanco');
      p.rect(x, y + 12, TILE, 1, 'contorno');
      for (const dx of [3, 15, 27]) {
        p.rect(x + dx, y + 8, 3, 16, 'blanco');
        p.rect(x + dx, y + 8, 1, 16, 'papelBorde');
      }
    },
  },
  granza: {
    base: 'granza',
    dibujar: (p, x, y, cx, cy) => {
      if (ruido(cx, cy, 43) > 0.4) p.rect(x + 8, y + 10, 2, 2, 'piedraOsc');
      if (ruido(cx, cy, 47) > 0.6) p.rect(x + 20, y + 19, 2, 2, 'piedraOsc');
      if (ruido(cx, cy, 53) > 0.8) p.rect(x + 13, y + 25, 2, 2, 'ladrillo');
    },
  },
};

export function esSolido(mapa: Mapa, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= mapa.ancho || y >= mapa.alto) return true;
  const casilla = mapa.casillas[y]?.[x];
  if (casilla === undefined) return true;
  return mapa.solidos.includes(casilla);
}

export function hayPersonaje(mapa: Mapa, x: number, y: number) {
  return mapa.personajes.find((p) => p.x === x && p.y === y);
}

export function existeCasilla(nombre: string): boolean {
  return nombre in CASILLAS;
}

export function dibujarMapa(pantalla: Pantalla, mapa: Mapa, camaraX: number, camaraY: number): void {
  // Sólo se dibuja lo que entra en pantalla, más un borde de una casilla.
  const desdeX = Math.max(0, Math.floor(camaraX / TILE) - 1);
  const desdeY = Math.max(0, Math.floor(camaraY / TILE) - 1);
  const hastaX = Math.min(mapa.ancho, Math.ceil((camaraX + ANCHO) / TILE) + 1);
  const hastaY = Math.min(mapa.alto, Math.ceil((camaraY + ALTO) / TILE) + 1);

  for (let cy = desdeY; cy < hastaY; cy++) {
    for (let cx = desdeX; cx < hastaX; cx++) {
      const nombre = mapa.casillas[cy]?.[cx] ?? 'pasto';
      const def = CASILLAS[nombre] ?? CASILLAS['pasto']!;
      const x = cx * TILE - camaraX;
      const y = cy * TILE - camaraY;
      pantalla.rect(x, y, TILE, TILE, def.base);
      def.dibujar?.(pantalla, x, y, cx, cy);
    }
  }
}
