/** Máquina de diálogo: recorre nodos, revela el texto de a poco y emite efectos. */

import type { Dialogo, Efecto, NodoDialogo, OpcionDialogo } from './tipos';

/** Caracteres por segundo del efecto de máquina de escribir. */
const VELOCIDAD_TEXTO = 55;

/**
 * Sustituye marcas del tipo `{fecha}` en el texto del contenido.
 *
 * Existe para que el guion pueda nombrar cosas que sólo se saben al jugar —la fecha real,
 * el nombre del jugador— sin que el contenido tenga que ser código.
 */
export function interpolar(texto: string, resolver: (clave: string) => string | undefined): string {
  return texto.replace(/\{(\w+)\}/g, (original, clave: string) => resolver(clave) ?? original);
}

export class MaquinaDialogo {
  private readonly nodos: Map<string, NodoDialogo>;
  private actual: NodoDialogo | null = null;
  /** El texto del nodo actual, ya con las marcas resueltas. */
  private textoActual = '';
  private revelados = 0;
  opcionElegida = 0;

  constructor(
    private readonly dialogo: Dialogo,
    private readonly emitir: (efecto: Efecto) => void,
    /** Para evaluar el campo `requiere` de las opciones. */
    private readonly banderaActiva: (bandera: string) => boolean,
    /** Para resolver las marcas `{clave}` del texto. */
    private readonly resolver: (clave: string) => string | undefined = () => undefined,
  ) {
    this.nodos = new Map(dialogo.nodos.map((n) => [n.id, n]));
  }

  iniciar(): void {
    this.irA(this.dialogo.inicio);
  }

  get activo(): boolean {
    return this.actual !== null;
  }

  get nodo(): NodoDialogo | null {
    return this.actual;
  }

  get hablante(): string | undefined {
    return this.actual?.hablante;
  }

  /** Texto revelado hasta ahora por la máquina de escribir. */
  get textoVisible(): string {
    return this.textoActual.slice(0, Math.floor(this.revelados));
  }

  get textoCompleto(): boolean {
    return !this.actual || this.revelados >= this.textoActual.length;
  }

  /** Opciones que cumplen sus requisitos. Sólo se muestran con el texto ya completo. */
  get opciones(): OpcionDialogo[] {
    if (!this.actual?.opciones || !this.textoCompleto) return [];
    return this.actual.opciones
      .filter((o) => !o.requiere || o.requiere.every((b) => this.banderaActiva(b)))
      .map((o) => ({ ...o, texto: interpolar(o.texto, this.resolver) }));
  }

  actualizar(dt: number): void {
    if (this.actual && !this.textoCompleto) this.revelados += VELOCIDAD_TEXTO * dt;
  }

  moverSeleccion(delta: number): void {
    const cantidad = this.opciones.length;
    if (cantidad === 0) return;
    this.opcionElegida = (this.opcionElegida + delta + cantidad) % cantidad;
  }

  /** Botón de aceptar: completa el texto, elige una opción o avanza al nodo siguiente. */
  aceptar(): void {
    if (!this.actual) return;

    // Primer toque con el texto a medias: lo completa de golpe.
    if (!this.textoCompleto) {
      this.revelados = this.textoActual.length;
      return;
    }

    const opciones = this.opciones;
    if (opciones.length > 0) {
      const elegida = opciones[this.opcionElegida] ?? opciones[0]!;
      for (const efecto of elegida.efectos ?? []) this.emitir(efecto);
      this.irA(elegida.destino);
      return;
    }

    if (this.actual.siguiente) this.irA(this.actual.siguiente);
    else this.actual = null; // fin del diálogo
  }

  private irA(id: string): void {
    const nodo = this.nodos.get(id);
    if (!nodo) {
      console.error(
        `[diálogo ${this.dialogo.id}] el nodo "${id}" no existe. Se corta la conversación.`,
      );
      this.actual = null;
      return;
    }
    this.actual = nodo;
    this.textoActual = interpolar(nodo.texto, this.resolver);
    this.revelados = 0;
    this.opcionElegida = 0;
    for (const efecto of nodo.efectos ?? []) this.emitir(efecto);
  }
}
