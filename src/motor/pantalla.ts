/**
 * Canvas, paleta y primitivas de dibujo.
 *
 * La referencia visual es Pokémon de Game Boy Advance: color pleno, contornos oscuros y
 * texturas chicas que rompen el liso. Resolución interna 480x352 = 15x11 casillas de 32px.
 */

export const ANCHO = 480;
export const ALTO = 352;
export const TILE = 32;
export const COLUMNAS = ANCHO / TILE;
export const FILAS = ALTO / TILE;

/** Ancho del marco que el CSS dibuja alrededor del canvas. */
const MARCO = 8;

/**
 * Paleta con nombres, no con índices: el contenido dice `"color": "azul"` y se entiende
 * sin tener que ir a buscar a qué corresponde el número 7.
 */
export const PALETA = {
  contorno: '#1b2430',
  sombra: '#46536a',

  papel: '#f8f8f0',
  papelBorde: '#58687c',
  papelSombra: '#d8d8cc',

  pasto: '#78c850',
  pastoOsc: '#5aa83e',
  pastoDet: '#4c9038',
  seto: '#3c8438',
  setoOsc: '#2e6a2c',

  camino: '#c8c0b0',
  caminoDet: '#aea695',
  peatonal: '#e0d8c6',
  peatonalDet: '#c6bca6',
  calle: '#8c8c94',
  calleDet: '#787880',

  agua: '#4878d0',
  aguaClara: '#7aaef0',
  arena: '#e8d8a8',
  arenaDet: '#d0bd8a',

  piedra: '#b4aca0',
  piedraOsc: '#80766a',
  piedraClara: '#cec6ba',
  teja: '#d07840',
  tejaOsc: '#a85828',
  madera: '#a0703e',
  maderaOsc: '#6e4a28',
  tronco: '#7a5638',
  hoja: '#2f7a36',
  hojaClara: '#47a04a',

  rojo: '#e04c3c',
  azul: '#3f5aa8',
  amarillo: '#f0c040',
  violeta: '#7a4a9c',
  piel: '#f2c79a',
  pelo: '#4a3626',
  blanco: '#ffffff',
  vidrio: '#8fd0e8',
  ladrillo: '#b05a3c',
  granza: '#e6dcc8',
} as const;

export type Color = keyof typeof PALETA;

export class Pantalla {
  readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = ANCHO;
    canvas.height = ALTO;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('No se pudo crear el contexto 2D del canvas.');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textBaseline = 'top';
    this.ajustarEscala();
    window.addEventListener('resize', () => this.ajustarEscala());
    // El contenedor cambia de tamaño sin que cambie la ventana: al rotar el celular, al
    // aparecer la barra del navegador o al entrar el mando táctil.
    const contenedor = canvas.parentElement;
    if (contenedor) new ResizeObserver(() => this.ajustarEscala()).observe(contenedor);
  }

  /**
   * El canvas ocupa todo el lugar que le deja su contenedor.
   *
   * De 2x para arriba se redondea a entero, que es lo que mantiene los píxeles cuadrados y
   * nítidos. Más abajo no: en un celular la diferencia entre 1x y 1,8x es la diferencia
   * entre leer el diálogo y no leerlo, y eso vale más que la nitidez.
   */
  private ajustarEscala(): void {
    const contenedor = this.canvas.parentElement;
    // El marco del canvas se dibuja por fuera del canvas: hay que dejarle su lugar.
    const disponibleAncho = (contenedor?.clientWidth ?? window.innerWidth) - MARCO * 2;
    const disponibleAlto = (contenedor?.clientHeight ?? window.innerHeight) - MARCO * 2;

    const holgada = Math.min(disponibleAncho / ANCHO, disponibleAlto / ALTO);
    const escala = Math.max(0.5, holgada >= 2 ? Math.floor(holgada) : holgada);

    this.canvas.style.width = `${Math.floor(ANCHO * escala)}px`;
    this.canvas.style.height = `${Math.floor(ALTO * escala)}px`;
  }

  limpiar(color: Color = 'pasto'): void {
    this.rect(0, 0, ANCHO, ALTO, color);
  }

  rect(x: number, y: number, ancho: number, alto: number, color: Color): void {
    this.ctx.fillStyle = PALETA[color];
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(ancho), Math.round(alto));
  }

  /** Rectángulo con contorno oscuro, que es lo que le da el aire de sprite. */
  rectBorde(x: number, y: number, ancho: number, alto: number, relleno: Color, borde: Color = 'contorno'): void {
    this.rect(x, y, ancho, alto, borde);
    this.rect(x + 1, y + 1, ancho - 2, alto - 2, relleno);
  }

  /** Ventana estilo Pokémon: fondo claro, doble borde, esquinas recortadas. */
  ventana(x: number, y: number, ancho: number, alto: number): void {
    this.rect(x, y, ancho, alto, 'contorno');
    this.rect(x + 2, y + 2, ancho - 4, alto - 4, 'papelBorde');
    this.rect(x + 3, y + 3, ancho - 6, alto - 6, 'papel');
    // Esquinas mordidas, para que no se vea un rectángulo perfecto.
    for (const [cx, cy] of [
      [x, y],
      [x + ancho - 1, y],
      [x, y + alto - 1],
      [x + ancho - 1, y + alto - 1],
    ] as const) {
      this.rect(cx, cy, 1, 1, 'papel');
    }
  }

  texto(txt: string, x: number, y: number, color: Color = 'contorno', tam = 14): void {
    this.ctx.fillStyle = PALETA[color];
    this.ctx.font = `${tam}px "Courier New", monospace`;
    this.ctx.fillText(txt, Math.round(x), Math.round(y));
  }

  /** Texto con una sombra dura un píxel abajo: se lee sobre cualquier fondo. */
  textoSombra(txt: string, x: number, y: number, color: Color, sombra: Color, tam = 14): void {
    this.texto(txt, x + 1, y + 1, sombra, tam);
    this.texto(txt, x, y, color, tam);
  }

  anchoTexto(txt: string, tam = 14): number {
    this.ctx.font = `${tam}px "Courier New", monospace`;
    return this.ctx.measureText(txt).width;
  }

  /** Recorta un texto para que entre en `anchoMax` píxeles, con puntos suspensivos. */
  recortar(txt: string, anchoMax: number, tam = 14): string {
    if (this.anchoTexto(txt, tam) <= anchoMax) return txt;
    let corte = txt;
    while (corte.length > 1 && this.anchoTexto(`${corte}...`, tam) > anchoMax) {
      corte = corte.slice(0, -1);
    }
    return `${corte.trimEnd()}...`;
  }

  /** Parte un texto en líneas que entren en `anchoMax` píxeles. */
  partirEnLineas(txt: string, anchoMax: number, tam = 14): string[] {
    const lineas: string[] = [];
    let actual = '';
    for (const palabra of txt.split(' ')) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (this.anchoTexto(prueba, tam) > anchoMax && actual) {
        lineas.push(actual);
        actual = palabra;
      } else {
        actual = prueba;
      }
    }
    if (actual) lineas.push(actual);
    return lineas;
  }
}
