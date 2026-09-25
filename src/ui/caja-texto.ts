/** Caja de diálogo, panel de opciones y HUD, al estilo de Pokémon de Game Boy Advance. */

import type { MaquinaDialogo } from '../motor/dialogo';
import { Pantalla, ANCHO, ALTO, type Color } from '../motor/pantalla';
import { potenciaTotal, type Gema } from '../motor/gemas';

const MARGEN = 12;
const ALTO_CAJA = 96;
const Y_CAJA = ALTO - ALTO_CAJA - MARGEN;
const TAM_TEXTO = 14;
const INTERLINEA = 18;

export function dibujarCajaDialogo(pantalla: Pantalla, maquina: MaquinaDialogo): void {
  if (!maquina.nodo) return;

  const opciones = maquina.opciones.map((o) => o.texto);
  if (opciones.length > 0) dibujarPanelOpciones(pantalla, opciones, maquina.opcionElegida);
  dibujarCaja(pantalla, maquina.textoVisible, maquina.hablante);

  // Flechita de "seguir", sólo cuando terminó de escribir y no hay que elegir nada.
  if (maquina.textoCompleto && opciones.length === 0) {
    const fx = ANCHO - MARGEN - 26;
    const fy = Y_CAJA + ALTO_CAJA - 22;
    for (let i = 0; i < 4; i++) pantalla.rect(fx + i, fy + i, 8 - i * 2, 2, 'papelBorde');
  }
}

/** Un menú del juego: la misma caja y el mismo panel de opciones que un diálogo. */
export function dibujarMenu(
  pantalla: Pantalla,
  texto: string,
  opciones: string[],
  elegida: number,
): void {
  dibujarPanelOpciones(pantalla, opciones, elegida);
  dibujarCaja(pantalla, texto);
}

function dibujarCaja(pantalla: Pantalla, texto: string, hablante?: string): void {
  pantalla.ventana(MARGEN, Y_CAJA, ANCHO - MARGEN * 2, ALTO_CAJA);

  const x = MARGEN + 14;
  let y = Y_CAJA + 14;

  if (hablante) {
    // Cartelito con el nombre, montado sobre el borde de arriba de la caja.
    const ancho = pantalla.anchoTexto(hablante, 12) + 20;
    pantalla.ventana(MARGEN + 10, Y_CAJA - 13, ancho, 24);
    pantalla.texto(hablante, MARGEN + 20, Y_CAJA - 7, 'papelBorde', 12);
    y += 6;
  }

  const anchoUtil = ANCHO - MARGEN * 2 - 28;
  for (const linea of pantalla.partirEnLineas(texto, anchoUtil, TAM_TEXTO)) {
    pantalla.texto(linea, x, y, 'contorno', TAM_TEXTO);
    y += INTERLINEA;
  }
}

function dibujarPanelOpciones(pantalla: Pantalla, opciones: string[], elegida: number): void {
  const anchoMax = Math.max(...opciones.map((o) => pantalla.anchoTexto(o, TAM_TEXTO)));
  const ancho = Math.min(ANCHO - MARGEN * 2, anchoMax + 46);
  const alto = opciones.length * INTERLINEA + 18;
  const x = ANCHO - MARGEN - ancho;
  const y = Y_CAJA - alto - 6;

  pantalla.ventana(x, y, ancho, alto);

  opciones.forEach((opcion, i) => {
    const fy = y + 10 + i * INTERLINEA;
    const marcada = i === elegida;
    if (marcada) {
      for (let j = 0; j < 4; j++) {
        pantalla.rect(x + 12 + j, fy + 3 + j, 2, 8 - j * 2, 'contorno');
      }
    }
    pantalla.texto(opcion, x + 26, fy, marcada ? 'contorno' : 'papelBorde', TAM_TEXTO);
  });
}

export function dibujarHud(
  pantalla: Pantalla,
  gemas: Gema[],
  rotuloEpoca: string,
  ahora = Date.now(),
): void {
  const puntos = potenciaTotal(gemas, ahora);
  const etiqueta = `${puntos}`;

  // Indicador de Gemas, arriba a la derecha.
  const anchoGemas = 26 + pantalla.anchoTexto(etiqueta, 13) + 18;
  const xGemas = ANCHO - MARGEN - anchoGemas;
  pantalla.ventana(xGemas, MARGEN, anchoGemas, 30);
  dibujarGema(pantalla, xGemas + 12, MARGEN + 15, puntos > 0 ? 'violeta' : 'papelSombra');
  pantalla.texto(etiqueta, xGemas + 28, MARGEN + 8, 'contorno', 13);

  // Rótulo de época, arriba a la izquierda, sin invadir el indicador.
  const anchoMax = xGemas - MARGEN * 2 - 24;
  const rotulo = pantalla.recortar(rotuloEpoca, anchoMax, 12);
  const anchoRotulo = pantalla.anchoTexto(rotulo, 12) + 24;
  pantalla.ventana(MARGEN, MARGEN, anchoRotulo, 30);
  pantalla.texto(rotulo, MARGEN + 12, MARGEN + 9, 'contorno', 12);
}

function dibujarGema(pantalla: Pantalla, cx: number, cy: number, color: Color): void {
  for (let i = 0; i < 7; i++) {
    const ancho = 10 - Math.abs(i - 3) * 3;
    pantalla.rect(cx - ancho / 2, cy - 7 + i * 2, ancho, 2, color);
  }
  pantalla.rect(cx - 1, cy - 5, 2, 4, 'blanco');
}

/** Aviso al medio de la pantalla: cambios de época, gastos, resultados. */
export function dibujarAviso(pantalla: Pantalla, texto: string): void {
  const RELLENO = 16;
  const ancho = ANCHO - 72;
  const lineas = pantalla.partirEnLineas(texto, ancho - RELLENO * 2, 13);
  const alto = lineas.length * 17 + RELLENO * 2;
  const x = (ANCHO - ancho) / 2;
  const y = (ALTO - alto) / 2 - 20;

  pantalla.ventana(x, y, ancho, alto);
  lineas.forEach((linea, i) => {
    pantalla.texto(linea, x + RELLENO, y + RELLENO + i * 17, 'contorno', 13);
  });
}
