/**
 * El pegamento: toma una misión de `content/` y la corre en el motor.
 * Es el único lugar donde se deciden reglas de juego concretas (costos, corrupción, final).
 */

import { Actor, DELTAS, dibujarActor, dibujarObjeto } from '../motor/actor';
import { obtenerMapa } from '../motor/contenido';
import { MaquinaDialogo } from '../motor/dialogo';
import { Entrada } from '../motor/entrada';
import { costoSalto, crearGema, gastar, AJUSTES } from '../motor/gemas';
import { dibujarMapa, esSolido, hayPersonaje } from '../motor/mapa';
import { ANCHO, ALTO, Pantalla, TILE } from '../motor/pantalla';
import { CORRUPCION_MAXIMA, guardar, registrarHecho, type Partida } from '../motor/estado';
import type { Ciudad, Direccion, Efecto, Escena, Mapa, Mision } from '../motor/tipos';
import { dibujarAviso, dibujarCajaDialogo, dibujarHud } from '../ui/caja-texto';
import { MenuPausa } from '../ui/menu-pausa';

const DURACION_AVISO = 3.2;

const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const DIAS = ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'];
const MESES_LARGO = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export class EscenaExploracion {
  private escena!: Escena;
  private mapa!: Mapa;
  private jugador!: Actor;
  private dialogo: MaquinaDialogo | null = null;
  private aviso: { texto: string; restante: number } | null = null;
  private resuelta = false;
  /** Escena a la que se pasa cuando termine la conversación en curso. */
  private escenaPendiente: string | null = null;
  /** Reloj propio de la escena, para el titileo del calendario. */
  private tiempo = 0;
  private readonly menu: MenuPausa;

  constructor(
    private readonly pantalla: Pantalla,
    private readonly entrada: Entrada,
    private readonly mision: Mision,
    private readonly ciudad: Ciudad,
    private readonly partida: Partida,
    alReiniciar: () => void,
  ) {
    this.menu = new MenuPausa(entrada, alReiniciar);
    this.resuelta = partida.lineaTemporal.some((r) => r.hechoId === mision.hecho.id);
    this.entrarA(this.partida.escenaActual, { cobrar: false });
  }

  /** Sólo para depurar desde la consola del navegador. */
  get diagnostico() {
    return {
      escena: this.escena.id,
      mapa: this.mapa.id,
      jugador: { x: this.jugador.x, y: this.jugador.y, mirando: this.jugador.mirando },
      enfrente: this.jugador.casillaEnfrente(),
      dialogoActivo: this.dialogo?.activo ?? false,
      nodo: this.dialogo?.nodo?.id ?? null,
      opciones: this.dialogo?.opciones.map((o) => o.texto) ?? [],
      menuAbierto: this.menu.abierto,
    };
  }

  actualizar(dt: number): void {
    // Con el menú abierto, la escena queda congelada: ni pasos, ni avisos, ni titileo.
    if (this.menu.abierto) {
      this.menu.actualizar();
      return;
    }
    this.tiempo += dt;

    // Mientras la caja de diálogo lo tapa, el aviso no se ve: que no se consuma sin leerse.
    if (this.aviso && !this.dialogo?.activo) {
      this.aviso.restante -= dt;
      if (this.aviso.restante <= 0) this.aviso = null;
    }
    this.jugador.actualizar(dt);

    if (this.dialogo?.activo) {
      this.actualizarDialogo(dt);
    } else if (this.escenaPendiente) {
      const escenaId = this.escenaPendiente;
      this.escenaPendiente = null;
      this.entrarA(escenaId, { cobrar: false });
    } else {
      this.dialogo = null;
      this.actualizarExploracion();
    }
  }

  dibujar(): void {
    const { camaraX, camaraY } = this.calcularCamara();
    this.pantalla.limpiar('contorno');
    dibujarMapa(this.pantalla, this.mapa, camaraX, camaraY);

    // Se dibuja de arriba hacia abajo para que lo de adelante tape lo de atrás.
    const enEscena = [
      ...this.mapa.personajes.map((p) => ({ personaje: p, y: p.y })),
      { personaje: null, y: this.jugador.y },
    ].sort((a, b) => a.y - b.y);

    for (const item of enEscena) {
      if (!item.personaje) {
        dibujarActor(
          this.pantalla,
          this.jugador.px - camaraX,
          this.jugador.py - camaraY,
          this.jugador.mirando,
          this.jugador.ropa,
          this.jugador.pelo,
          this.jugador.fase,
        );
        continue;
      }
      const p = item.personaje;
      const px = p.x * TILE - camaraX;
      const py = p.y * TILE - camaraY;
      if (p.tipo === 'objeto') {
        dibujarObjeto(this.pantalla, px, py, p.sprite ?? 'cartel', p.ropa ?? 'amarillo', {
          lineas: p.sprite === 'calendario' ? this.lineasCalendario() : undefined,
          destacado: Math.sin(this.tiempo * 4) > 0.3,
        });
      } else {
        dibujarActor(this.pantalla, px, py, p.mirando, p.ropa ?? 'azul', p.pelo ?? 'pelo');
      }
    }

    dibujarHud(this.pantalla, this.partida.gemas, this.rotuloEpoca());

    if (this.menu.abierto) this.menu.dibujar(this.pantalla);
    else if (this.dialogo?.activo) dibujarCajaDialogo(this.pantalla, this.dialogo);
    else if (this.aviso) dibujarAviso(this.pantalla, this.aviso.texto);
  }

  /**
   * Las seis líneas del calendario floral de la Plaza San Martín.
   *
   * Mientras el hecho está en disputa, el nombre titila entre las dos versiones: eso es
   * exactamente lo que ve un Sensible y nadie más. Una vez resuelto, queda el que ganó.
   */
  private lineasCalendario(): string[] {
    const hoy = new Date();
    const titila = !this.resuelta && Math.sin(this.tiempo * 1.7) > 0.86;
    const nombre = titila ? this.ciudad.nombreAlterado : this.nombreVigente();
    const anios = hoy.getFullYear() - this.ciudad.anioFundacion;

    return [
      MESES[hoy.getMonth()] ?? '',
      String(hoy.getDate()),
      DIAS[hoy.getDay()] ?? '',
      String(hoy.getFullYear()),
      nombre,
      `${anios} AÑOS`,
    ];
  }

  /** El nombre que tiene la ciudad en la línea temporal de este jugador. */
  private nombreVigente(): string {
    const registro = this.partida.lineaTemporal.find((r) => r.hechoId === this.mision.hecho.id);
    if (registro?.resolucion === 'alterada') return this.ciudad.nombreAlterado;
    return this.ciudad.nombre.toUpperCase();
  }

  // ───────────────────────────────────────────────────────────── exploración

  private actualizarExploracion(): void {
    // Antes que el paso en curso: si no, un toque rápido mientras camina se pierde.
    if (this.entrada.presionada('cancelar')) {
      this.menu.abrir();
      return;
    }
    if (this.jugador.moviendose) return;

    if (this.entrada.presionada('aceptar')) {
      this.interactuar();
      return;
    }

    const direccion = this.direccionPulsada();
    if (!direccion) return;

    this.jugador.mirando = direccion;
    const delta = DELTAS[direccion];
    const destinoX = this.jugador.x + delta.x;
    const destinoY = this.jugador.y + delta.y;

    if (esSolido(this.mapa, destinoX, destinoY)) return;
    if (hayPersonaje(this.mapa, destinoX, destinoY)) return;

    this.jugador.darPaso(destinoX, destinoY, direccion);
  }

  private direccionPulsada(): Direccion | null {
    // Se mira el flanco además del sostenido: un toque muy corto, que empieza y termina
    // entre dos cuadros, igual tiene que mover un paso.
    const pulsada = (b: 'arriba' | 'abajo' | 'izquierda' | 'derecha') =>
      this.entrada.sostenida(b) || this.entrada.presionada(b);

    if (pulsada('arriba')) return 'norte';
    if (pulsada('abajo')) return 'sur';
    if (pulsada('izquierda')) return 'oeste';
    if (pulsada('derecha')) return 'este';
    return null;
  }

  private interactuar(): void {
    const enfrente = this.jugador.casillaEnfrente();
    const personaje = hayPersonaje(this.mapa, enfrente.x, enfrente.y);
    if (!personaje) return;

    // Las personas se dan vuelta para mirar al jugador; un cartel no.
    if (personaje.tipo !== 'objeto') personaje.mirando = opuesta(this.jugador.mirando);

    const dialogo = this.mision.dialogos.find((d) => d.id === personaje.dialogoId);
    if (!dialogo) {
      console.error(`No existe el diálogo "${personaje.dialogoId}".`);
      return;
    }

    this.dialogo = new MaquinaDialogo(
      dialogo,
      (efecto) => this.aplicar(efecto),
      (requisito) => this.cumple(requisito),
      (clave) => this.resolverMarca(clave),
    );
    this.dialogo.iniciar();
  }

  /**
   * Un requisito de `requiere` se cumple con una bandera activa o con una pista conseguida.
   * Aceptar pistas evita espejar cada una en una bandera que habría que mantener a la par.
   */
  private cumple(requisito: string): boolean {
    return this.partida.banderas[requisito] === true || this.partida.pistas.includes(requisito);
  }

  private actualizarDialogo(dt: number): void {
    const dialogo = this.dialogo;
    if (!dialogo) return;
    dialogo.actualizar(dt);
    if (this.entrada.presionada('arriba')) dialogo.moverSeleccion(-1);
    if (this.entrada.presionada('abajo')) dialogo.moverSeleccion(1);
    if (this.entrada.presionada('aceptar')) dialogo.aceptar();
  }

  /** Marcas `{clave}` que el guion puede usar en cualquier texto. */
  private resolverMarca(clave: string): string | undefined {
    const hoy = new Date();
    switch (clave) {
      case 'fecha':
        return `${hoy.getDate()} de ${MESES_LARGO[hoy.getMonth()]} de ${hoy.getFullYear()}`;
      case 'anios':
        return String(hoy.getFullYear() - this.ciudad.anioFundacion);
      case 'jugador':
        return this.partida.nombreJugador || 'pibe';
      case 'ciudad':
        return this.ciudad.nombre;
      case 'nombreAlterado':
        return this.ciudad.nombreAlterado;
      case 'nombreVigente':
        return this.nombreVigente();
      default:
        return undefined;
    }
  }

  // ───────────────────────────────────────────────────────────── efectos

  private aplicar(efecto: Efecto): void {
    switch (efecto.tipo) {
      case 'otorgarPista': {
        if (this.partida.pistas.includes(efecto.pistaId)) break;
        this.partida.pistas.push(efecto.pistaId);
        const pista = this.mision.pistas.find((p) => p.id === efecto.pistaId);
        if (pista?.tipo === 'verdadera') this.evaluarResolucion();
        break;
      }
      case 'gastarGemas':
        if (!gastar(this.partida.gemas, efecto.cantidad)) this.perderPorFaltaDeGemas();
        break;
      case 'otorgarGemas':
        for (let i = 0; i < efecto.cantidad; i++) {
          // Las Gemas que entrega la Orden vienen cargadas al tope.
          const id = `gema-${this.partida.gemas.length + 1}`;
          this.partida.gemas.push(crearGema(id, Date.now(), true));
        }
        break;
      case 'avanzarCorrupcion':
        this.partida.corrupcion += efecto.cantidad;
        if (this.partida.corrupcion >= CORRUPCION_MAXIMA) this.cerrarMision('alterada');
        break;
      case 'establecerBandera':
        this.partida.banderas[efecto.bandera] = efecto.valor;
        break;
      case 'irAEscena':
        this.entrarA(efecto.escenaId, { cobrar: true });
        break;
      case 'resolverMision':
        this.cerrarMision(efecto.resultado);
        break;
    }
    guardar(this.partida);
  }

  private evaluarResolucion(): void {
    const verdaderas = this.partida.pistas.filter(
      (id) => this.mision.pistas.find((p) => p.id === id)?.tipo === 'verdadera',
    ).length;
    if (verdaderas >= this.mision.pistasParaResolver) {
      this.partida.banderas['pistas-completas'] = true;
    }
  }

  // ───────────────────────────────────────────────────────────── escenas y tiempo

  private entrarA(escenaId: string, opciones: { cobrar: boolean }): void {
    const destino = this.mision.escenas.find((e) => e.id === escenaId);
    if (!destino) throw new Error(`No existe la escena "${escenaId}".`);

    if (opciones.cobrar) {
      const costo = this.costoDeViajeA(destino);
      if (costo > 0 && !gastar(this.partida.gemas, costo)) {
        this.perderPorFaltaDeGemas();
        return;
      }
      if (costo > 0) this.mostrarAviso(`El salto consume ${costo} de potencia.`);
    }

    this.escena = destino;
    this.mapa = this.montarMapa(destino);
    const entrada = destino.entrada ?? this.mapa.entrada;
    this.jugador = new Actor(entrada.x, entrada.y, 'rojo', 'pelo');
    this.dialogo = null;
    this.partida.escenaActual = destino.id;
    guardar(this.partida);
  }

  /** Copia el mapa y le aplica el elenco propio de la escena. */
  private montarMapa(escena: Escena): Mapa {
    const mapa = structuredClone(obtenerMapa(escena.mapaId));
    const ocultar = new Set(escena.ocultar ?? []);
    mapa.personajes = mapa.personajes.filter((p) => !ocultar.has(p.id));

    for (const extra of escena.personajes ?? []) {
      const i = mapa.personajes.findIndex((p) => p.id === extra.id);
      if (i >= 0) mapa.personajes[i] = extra;
      else mapa.personajes.push(extra);
    }
    return mapa;
  }

  /** Cambiar de época cuesta el salto temporal; moverse dentro de la época, mucho menos. */
  private costoDeViajeA(destino: Escena): number {
    const propio = destino.costoEntrada ?? 0;
    if (destino.epocaId === this.escena?.epocaId) return propio + AJUSTES.costoMovimiento;
    return propio + costoSalto(this.anioDe(this.escena?.epocaId), this.anioDe(destino.epocaId));
  }

  private anioDe(epocaId: string | undefined): number {
    return this.ciudad.epocas.find((e) => e.id === epocaId)?.anio ?? new Date().getFullYear();
  }

  private rotuloEpoca(): string {
    if (this.escena.rotulo) return this.escena.rotulo;
    return this.ciudad.epocas.find((e) => e.id === this.escena.epocaId)?.rotulo ?? '';
  }

  // ───────────────────────────────────────────────────────────── final

  private perderPorFaltaDeGemas(): void {
    this.mostrarAviso('Las Gemas se apagaron.');
    this.cerrarMision('alterada');
  }

  private cerrarMision(resultado: 'restaurada' | 'alterada'): void {
    if (this.resuelta) return;
    this.resuelta = true;

    const enunciado =
      resultado === 'restaurada'
        ? this.mision.hecho.versionReal.enunciado
        : this.mision.hecho.versionAlterada.enunciado;

    registrarHecho(this.partida, this.mision.hecho.id, resultado, enunciado);
    this.partida.banderas[`mision-${resultado}`] = true;

    const final = this.mision.escenaFinal;
    if (!final) {
      guardar(this.partida);
      this.mostrarAviso(enunciado, 12);
      return;
    }

    // Se guarda ya en el epílogo por si cierran el juego antes de terminar de leer.
    this.partida.escenaActual = final;
    guardar(this.partida);

    // El epílogo es gratis: a la Orden vuelve el jugador aunque se haya quedado sin Gemas.
    // Si la misión se cerró en medio de una conversación, primero se termina de leer lo que
    // se estaba diciendo: suele ser justamente el desenlace.
    if (this.dialogo?.activo) {
      this.dialogo.terminarTrasEsteNodo();
      this.escenaPendiente = final;
    } else {
      this.entrarA(final, { cobrar: false });
    }
  }

  private mostrarAviso(texto: string, segundos = DURACION_AVISO): void {
    this.aviso = { texto, restante: segundos };
  }

  private calcularCamara(): { camaraX: number; camaraY: number } {
    const maxX = Math.max(0, this.mapa.ancho * TILE - ANCHO);
    const maxY = Math.max(0, this.mapa.alto * TILE - ALTO);
    return {
      camaraX: Math.round(Math.min(maxX, Math.max(0, this.jugador.px - ANCHO / 2 + TILE / 2))),
      camaraY: Math.round(Math.min(maxY, Math.max(0, this.jugador.py - ALTO / 2 + TILE / 2))),
    };
  }
}

function opuesta(direccion: Direccion): Direccion {
  const mapa: Record<Direccion, Direccion> = {
    norte: 'sur',
    sur: 'norte',
    este: 'oeste',
    oeste: 'este',
  };
  return mapa[direccion];
}
