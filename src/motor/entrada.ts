/** Botones del juego: estado sostenido + detección de flanco (recién presionada). */

const BOTONES = ['arriba', 'abajo', 'izquierda', 'derecha', 'aceptar', 'cancelar'] as const;

export type Boton = (typeof BOTONES)[number];

export function esBoton(valor: string): valor is Boton {
  return (BOTONES as readonly string[]).includes(valor);
}

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
      this.presionar(boton);
    });
    window.addEventListener('keyup', (e) => {
      const boton = MAPEO[e.code];
      if (boton) this.soltar(boton);
    });
    window.addEventListener('blur', () => this.soltarTodo());
  }

  /** El teclado no es la única fuente: el mando táctil escribe acá mismo. */
  presionar(boton: Boton): void {
    if (!this.sostenidas.has(boton)) this.recienPresionadas.add(boton);
    this.sostenidas.add(boton);
  }

  soltar(boton: Boton): void {
    this.sostenidas.delete(boton);
  }

  soltarTodo(): void {
    this.sostenidas.clear();
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
