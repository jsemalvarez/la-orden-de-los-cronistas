/**
 * Modelo de contenido del juego.
 *
 * REGLA: este archivo no menciona ninguna ciudad, villano ni fecha concreta.
 * Todo lo específico vive en content/. Ver docs/arquitectura.md.
 */

import type { Color } from './pantalla';

// ─────────────────────────────────────────────────────────────── Hecho histórico

/** Una fuente que respalda un dato. Obligatoria en toda versión real. */
export interface Fuente {
  cita: string;
  url?: string;
  /** true si es documento de archivo / fuente primaria. */
  primaria?: boolean;
}

/**
 * La unidad canónica del juego: un hecho real que el villano quiere reemplazar.
 * Todo el conflicto es la disputa entre `versionReal` y `versionAlterada`.
 */
export interface HechoHistorico {
  id: string;
  titulo: string;
  /** Fecha en ISO, o texto libre si es un período ("fines de 1873"). */
  fecha: string;
  versionReal: {
    enunciado: string;
    fuentes: Fuente[];
  };
  versionAlterada: {
    enunciado: string;
    /** Qué cambia el villano para lograrlo. */
    metodo: string;
  };
}

// ─────────────────────────────────────────────────────────────── Pistas

export type TipoPista = 'verdadera' | 'falsa' | 'ruido';

export interface Pista {
  id: string;
  tipo: TipoPista;
  /** Lo que el jugador anota en su libreta. */
  texto: string;
  /** Sólo en pistas verdaderas: de dónde salió el dato. Alimenta el modo Archivo. */
  fuenteHistorica?: string;
}

// ─────────────────────────────────────────────────────────────── Diálogo

/** Única forma en que un diálogo puede tocar el estado del juego. Lista cerrada a propósito. */
export type Efecto =
  | { tipo: 'otorgarPista'; pistaId: string }
  | { tipo: 'gastarGemas'; cantidad: number }
  | { tipo: 'otorgarGemas'; cantidad: number }
  | { tipo: 'avanzarCorrupcion'; cantidad: number }
  | { tipo: 'establecerBandera'; bandera: string; valor: boolean }
  | { tipo: 'irAEscena'; escenaId: string }
  | { tipo: 'resolverMision'; resultado: 'restaurada' | 'alterada' };

export interface OpcionDialogo {
  texto: string;
  /** Id del nodo al que salta. */
  destino: string;
  efectos?: Efecto[];
  /**
   * Sólo se ofrece si el jugador ya tiene todo esto. Cada elemento es una bandera activa o el id
   * de una pista conseguida.
   */
  requiere?: string[];
}

export interface NodoDialogo {
  id: string;
  /** Nombre a mostrar. Omitido = narración sin hablante. */
  hablante?: string;
  texto: string;
  efectos?: Efecto[];
  opciones?: OpcionDialogo[];
  /** Nodo siguiente si no hay opciones. Ausente = fin del diálogo. */
  siguiente?: string;
}

export interface Dialogo {
  id: string;
  /** Nodo por el que arranca. */
  inicio: string;
  nodos: NodoDialogo[];
}

// ─────────────────────────────────────────────────────────────── Mundo

export type Direccion = 'norte' | 'sur' | 'este' | 'oeste';

/** Cómo se dibuja algo con lo que se puede interactuar y que no es una persona. */
export type SpriteObjeto = 'cartel' | 'calendario' | 'documento' | 'brillo' | 'placa';

export interface PersonajeEnMapa {
  id: string;
  nombre: string;
  /** Casilla, no píxeles. */
  x: number;
  y: number;
  mirando: Direccion;
  /** 'objeto' se dibuja según `sprite`; el resto son personas. */
  tipo?: 'persona' | 'objeto';
  sprite?: SpriteObjeto;
  /** Colores de la paleta, por nombre. */
  ropa?: Color;
  pelo?: Color;
  dialogoId: string;
  /** Se avisa en pantalla cuando es un personaje inventado. */
  ficticio?: boolean;
}

/**
 * Un mapa tal como se escribe en `content/`: una leyenda de un carácter por tipo de casilla
 * y el dibujo del mapa en texto. Se lee de un vistazo y en un diff se ve qué cambió.
 */
export interface MapaFuente {
  id: string;
  nombre: string;
  leyenda: Record<string, string>;
  filas: string[];
  /** Tipos de casilla que bloquean el paso, por nombre. */
  solidos: string[];
  personajes: PersonajeEnMapa[];
  /** Casilla donde aparece el jugador. */
  entrada: { x: number; y: number };
}

/** Un mapa ya normalizado, que es lo que consume el motor. */
export interface Mapa {
  id: string;
  nombre: string;
  ancho: number;
  alto: number;
  /** Nombres de tipo de casilla, una fila por cada `alto`. */
  casillas: string[][];
  solidos: string[];
  personajes: PersonajeEnMapa[];
  entrada: { x: number; y: number };
}

export interface Epoca {
  id: string;
  /** Lo que se muestra en pantalla: "Mar del Plata · 1873". */
  rotulo: string;
  /** Año para calcular el costo del salto temporal. */
  anio: number;
}

// ─────────────────────────────────────────────────────────────── Misión

export interface Escena {
  id: string;
  titulo: string;
  epocaId: string;
  mapaId: string;
  /** Gemas que cuesta entrar. El salto en el tiempo se cobra aparte. */
  costoEntrada?: number;
  /** Ids de personajes del mapa que no están en esta escena. */
  ocultar?: string[];
  /** Personajes que se suman, o que reemplazan a uno del mapa con el mismo id. */
  personajes?: PersonajeEnMapa[];
  /** Desde dónde entra el jugador, si no es la entrada del mapa. */
  entrada?: { x: number; y: number };
  /** Pisa el rótulo de la época en el HUD, para precisar el momento ("fines de 1873"). */
  rotulo?: string;
}

export interface Mision {
  id: string;
  titulo: string;
  hecho: HechoHistorico;
  escenas: Escena[];
  pistas: Pista[];
  dialogos: Dialogo[];
  /** Cuántas pistas verdaderas hacen falta para restaurar el hecho. */
  pistasParaResolver: number;
  escenaInicial: string;
  /** Escena de epílogo, a la que se vuelve al resolver el hecho de una forma u otra. */
  escenaFinal?: string;
}

export interface Ciudad {
  id: string;
  nombre: string;
  villano: { nombre: string; descripcion: string };
  epocas: Epoca[];
  /** Año desde el que cuenta la edad de la ciudad. */
  anioFundacion: number;
  /** Cómo se llamaría la ciudad si el villano ganara. Lo usa el calendario de la plaza. */
  nombreAlterado: string;
}
