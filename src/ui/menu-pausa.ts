/**
 * Menú de pausa, con el botón de cancelar.
 *
 * Existe para poder empezar de nuevo sin tocar la consola: una partida terminada, o una que
 * quedó trabada, no tenía otra salida.
 */

import type { Entrada } from '../motor/entrada';
import type { Pantalla } from '../motor/pantalla';
import { dibujarMenu } from './caja-texto';

interface Opcion {
  texto: string;
  elegir: () => void;
}

export class MenuPausa {
  private texto = '';
  private opciones: Opcion[] = [];
  private elegida = 0;

  constructor(
    private readonly entrada: Entrada,
    private readonly alReiniciar: () => void,
  ) {}

  get abierto(): boolean {
    return this.opciones.length > 0;
  }

  abrir(): void {
    this.mostrar('Juego en pausa.', [
      { texto: 'Seguir jugando.', elegir: () => this.cerrar() },
      { texto: 'Empezar de nuevo.', elegir: () => this.confirmarReinicio() },
    ]);
  }

  actualizar(): void {
    if (this.entrada.presionada('cancelar')) {
      this.cerrar();
      return;
    }
    const cantidad = this.opciones.length;
    if (this.entrada.presionada('arriba')) this.elegida = (this.elegida - 1 + cantidad) % cantidad;
    if (this.entrada.presionada('abajo')) this.elegida = (this.elegida + 1) % cantidad;
    if (this.entrada.presionada('aceptar')) this.opciones[this.elegida]?.elegir();
  }

  dibujar(pantalla: Pantalla): void {
    if (!this.abierto) return;
    dibujarMenu(pantalla, this.texto, this.opciones.map((o) => o.texto), this.elegida);
  }

  private confirmarReinicio(): void {
    // La opción que queda marcada es la que no borra nada: un Enter de más no puede costar la
    // partida.
    this.mostrar(
      '¿Empezar de nuevo? Se borra todo lo que hiciste hasta ahora: las pistas, las Gemas y cómo quedó la historia.',
      [
        { texto: 'No, seguir jugando.', elegir: () => this.cerrar() },
        { texto: 'Sí, empezar de nuevo.', elegir: () => this.alReiniciar() },
      ],
    );
  }

  private mostrar(texto: string, opciones: Opcion[]): void {
    this.texto = texto;
    this.opciones = opciones;
    this.elegida = 0;
  }

  private cerrar(): void {
    this.opciones = [];
  }
}
