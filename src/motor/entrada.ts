/** Teclado: estado sostenido + detección de flanco (recién presionada). */

export type Boton = 'arriba' | 'abajo' | 'izquierda' | 'derecha' | 'aceptar' | 'cancelar';

const MAPEO: Record<string, Boton> = {
  ArrowUp: 'arriba',
  ArrowDown: 'abajo',
  ArrowLeft: 'izquierda',
  ArrowRight: 'derecha',
  KeyW: 'arriba',
  KeyS: 'abajo',
  KeyA: 'izquierda',
  KeyD: 'derecha',
  Enter: 'aceptar',
  Space: 'aceptar',
  KeyZ: 'aceptar',
  Escape: 'cancelar',
  KeyX: 'cancelar',
};

export class Entrada {
  private sostenidas = new Set<Boton>();
  private recienPresionadas = new Set<Boton>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      const boton = MAPEO[e.code];
      if (!boton) return;
      e.preventDefault();
      if (!this.sostenidas.has(boton)) this.recienPresionadas.add(boton);
      this.sostenidas.add(boton);
    });
    window.addEventListener('keyup', (e) => {
      const boton = MAPEO[e.code];
      if (boton) this.sostenidas.delete(boton);
    });
    window.addEventListener('blur', () => this.sostenidas.clear());
  }

  sostenida(boton: Boton): boolean {
    return this.sostenidas.has(boton);
  }

  presionada(boton: Boton): boolean {
    return this.recienPresionadas.has(boton);
  }

  /** Llamar al final de cada cuadro: limpia los flancos. */
  finCuadro(): void {
    this.recienPresionadas.clear();
  }
}
