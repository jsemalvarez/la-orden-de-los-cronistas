/**
 * Carga del contenido y validación de integridad referencial.
 *
 * Vite empaqueta todo `content/` en tiempo de build. En desarrollo, editar un JSON recarga
 * el juego al instante: se pueden escribir misiones sin tocar código ni compilar a mano.
 */

import type { Ciudad, Mapa, MapaFuente, Mision } from './tipos';
import { esSolido, existeCasilla } from './mapa';

const modulosCiudad = import.meta.glob('/content/ciudades/*/ciudad.json', { eager: true });
const modulosMapa = import.meta.glob('/content/ciudades/*/mapas/*.json', { eager: true });
const modulosMision = import.meta.glob('/content/ciudades/*/misiones/*.json', { eager: true });

function porId<T extends { id: string }>(modulos: Record<string, unknown>): Map<string, T> {
  const mapa = new Map<string, T>();
  for (const [ruta, modulo] of Object.entries(modulos)) {
    const dato = (modulo as { default: T }).default;
    if (!dato?.id) {
      console.error(`[contenido] ${ruta} no tiene "id". Se ignora.`);
      continue;
    }
    if (mapa.has(dato.id)) console.error(`[contenido] id duplicado "${dato.id}" en ${ruta}.`);
    mapa.set(dato.id, dato);
  }
  return mapa;
}

/** Problemas encontrados al normalizar los mapas, para mostrarlos junto al resto. */
const problemasDeMapa: string[] = [];

/**
 * Qué tiene de malo ubicar algo en (x, y), o `null` si nada.
 *
 * Una persona —o el jugador al entrar— sobre una casilla sólida está metida en una pared, un
 * árbol o un cantero: queda tapada por lo que se dibuja ahí o no hay por dónde llegarle, y a
 * simple vista parece que no está. Un objeto sí puede ir sobre algo sólido, como una placa en
 * una pared.
 */
function problemaDeUbicacion(mapa: Mapa, x: number, y: number, esObjeto = false): string | null {
  if (x < 0 || y < 0 || x >= mapa.ancho || y >= mapa.alto) {
    return `fuera del mapa de ${mapa.ancho}x${mapa.alto}`;
  }
  const casilla = mapa.casillas[y]?.[x];
  if (!esObjeto && casilla !== undefined && esSolido(mapa, x, y)) {
    return `sobre la casilla "${casilla}", que es sólida`;
  }
  return null;
}

/** Convierte la grilla de texto en la grilla de nombres que consume el motor. */
function normalizarMapa(fuente: MapaFuente): Mapa {
  const quejar = (m: string) => problemasDeMapa.push(`[mapa ${fuente.id}] ${m}`);

  const filas = fuente.filas ?? [];
  if (filas.length === 0) quejar('no tiene ninguna fila.');

  const ancho = Math.max(0, ...filas.map((f) => f.length));
  for (const [i, fila] of filas.entries()) {
    if (fila.length !== ancho) {
      quejar(`la fila ${i} mide ${fila.length} y las demás ${ancho}: el mapa quedaría dentado.`);
    }
  }

  for (const [simbolo, nombre] of Object.entries(fuente.leyenda ?? {})) {
    if (!existeCasilla(nombre)) {
      quejar(`la leyenda asigna "${simbolo}" a la casilla "${nombre}", que no existe.`);
    }
  }
  for (const nombre of fuente.solidos ?? []) {
    if (!existeCasilla(nombre)) quejar(`"solidos" nombra la casilla inexistente "${nombre}".`);
  }

  const desconocidos = new Set<string>();
  const casillas = filas.map((fila) =>
    [...fila].map((simbolo) => {
      const nombre = fuente.leyenda?.[simbolo];
      if (!nombre) {
        desconocidos.add(simbolo);
        return 'pasto';
      }
      return nombre;
    }),
  );
  for (const simbolo of desconocidos) {
    quejar(`el símbolo "${simbolo}" aparece en el mapa pero no está en la leyenda.`);
  }

  const mapa: Mapa = {
    id: fuente.id,
    nombre: fuente.nombre,
    ancho,
    alto: casillas.length,
    casillas,
    solidos: fuente.solidos ?? [],
    personajes: fuente.personajes ?? [],
    entrada: fuente.entrada,
  };

  const entrada = fuente.entrada ?? { x: 0, y: 0 };
  const problemaEntrada = problemaDeUbicacion(mapa, entrada.x, entrada.y);
  if (problemaEntrada) quejar(`la entrada (${entrada.x}, ${entrada.y}) cae ${problemaEntrada}.`);

  for (const personaje of mapa.personajes) {
    const { x, y } = personaje;
    const problema = problemaDeUbicacion(mapa, x, y, personaje.tipo === 'objeto');
    if (problema) quejar(`"${personaje.nombre}" está en (${x}, ${y}), ${problema}.`);
  }

  return mapa;
}

export const CIUDADES = porId<Ciudad>(modulosCiudad);
export const MISIONES = porId<Mision>(modulosMision);
export const MAPAS = new Map<string, Mapa>(
  [...porId<MapaFuente>(modulosMapa)].map(([id, fuente]) => [id, normalizarMapa(fuente)]),
);

export function obtenerCiudad(id: string): Ciudad {
  const ciudad = CIUDADES.get(id);
  if (!ciudad) throw new Error(`No existe la ciudad "${id}".`);
  return ciudad;
}

export function obtenerMapa(id: string): Mapa {
  const mapa = MAPAS.get(id);
  if (!mapa) throw new Error(`No existe el mapa "${id}".`);
  return mapa;
}

export function obtenerMision(id: string): Mision {
  const mision = MISIONES.get(id);
  if (!mision) throw new Error(`No existe la misión "${id}".`);
  return mision;
}

/**
 * Chequea que todas las referencias cruzadas existan.
 *
 * Existe para que un error de escritura de contenido salga como un mensaje claro y no como
 * una pantalla negra a mitad de una conversación. Devuelve la lista de problemas.
 */
export function validarMision(mision: Mision, ciudad: Ciudad): string[] {
  const problemas: string[] = [...problemasDeMapa];
  const quejar = (m: string) => problemas.push(`[misión ${mision.id}] ${m}`);

  const idsEscena = new Set(mision.escenas.map((e) => e.id));
  const idsPista = new Set(mision.pistas.map((p) => p.id));
  const idsDialogo = new Set(mision.dialogos.map((d) => d.id));
  const idsEpoca = new Set(ciudad.epocas.map((e) => e.id));

  if (!idsEscena.has(mision.escenaInicial)) {
    quejar(`la escena inicial "${mision.escenaInicial}" no existe.`);
  }
  if (mision.escenaFinal && !idsEscena.has(mision.escenaFinal)) {
    quejar(`la escena final "${mision.escenaFinal}" no existe.`);
  }

  const verdaderas = mision.pistas.filter((p) => p.tipo === 'verdadera').length;
  if (mision.pistasParaResolver > verdaderas) {
    quejar(
      `pide ${mision.pistasParaResolver} pistas verdaderas pero sólo define ${verdaderas}: es irresoluble.`,
    );
  }
  for (const pista of mision.pistas) {
    if (pista.tipo === 'verdadera' && !pista.fuenteHistorica) {
      quejar(`la pista verdadera "${pista.id}" no cita fuente histórica.`);
    }
  }
  if (mision.hecho.versionReal.fuentes.length === 0) {
    quejar('la versión real del hecho no tiene ninguna fuente.');
  }

  const dialogosUsados = new Set<string>();

  for (const escena of mision.escenas) {
    if (!idsEpoca.has(escena.epocaId)) {
      quejar(`la escena "${escena.id}" usa una época inexistente "${escena.epocaId}".`);
    }
    const mapa = MAPAS.get(escena.mapaId);
    if (!mapa) {
      quejar(`la escena "${escena.id}" usa un mapa inexistente "${escena.mapaId}".`);
      continue;
    }

    // Lo que trae el mapa ya se revisó al normalizarlo; acá, lo que la escena mueve o suma.
    if (escena.entrada) {
      const { x, y } = escena.entrada;
      const problema = problemaDeUbicacion(mapa, x, y);
      if (problema) {
        quejar(`la escena "${escena.id}" hace entrar al jugador en (${x}, ${y}), ${problema}.`);
      }
    }
    for (const personaje of escena.personajes ?? []) {
      const { x, y } = personaje;
      const problema = problemaDeUbicacion(mapa, x, y, personaje.tipo === 'objeto');
      if (problema) {
        quejar(`"${personaje.nombre}" (escena ${escena.id}) está en (${x}, ${y}), ${problema}.`);
      }
    }

    // El elenco de una escena es el del mapa, menos los ocultos, más los propios.
    const ocultos = new Set(escena.ocultar ?? []);
    const elenco = [
      ...mapa.personajes.filter((p) => !ocultos.has(p.id)),
      ...(escena.personajes ?? []),
    ];
    for (const personaje of elenco) {
      dialogosUsados.add(personaje.dialogoId);
      if (!idsDialogo.has(personaje.dialogoId)) {
        quejar(
          `"${personaje.nombre}" (escena ${escena.id}) apunta al diálogo inexistente "${personaje.dialogoId}".`,
        );
      }
    }
  }

  for (const dialogo of mision.dialogos) {
    if (!dialogosUsados.has(dialogo.id)) {
      quejar(`el diálogo "${dialogo.id}" no lo usa ningún personaje: es contenido muerto.`);
    }
    const idsNodo = new Set(dialogo.nodos.map((n) => n.id));
    if (!idsNodo.has(dialogo.inicio)) {
      quejar(`el diálogo "${dialogo.id}" arranca en el nodo inexistente "${dialogo.inicio}".`);
    }
    for (const nodo of dialogo.nodos) {
      const donde = `${dialogo.id}/${nodo.id}`;
      if (nodo.siguiente && !idsNodo.has(nodo.siguiente)) {
        quejar(`${donde} salta al nodo inexistente "${nodo.siguiente}".`);
      }
      for (const opcion of nodo.opciones ?? []) {
        if (!idsNodo.has(opcion.destino)) {
          quejar(`${donde} tiene una opción que salta al nodo inexistente "${opcion.destino}".`);
        }
      }
      const efectos = [...(nodo.efectos ?? []), ...(nodo.opciones ?? []).flatMap((o) => o.efectos ?? [])];
      for (const efecto of efectos) {
        if (efecto.tipo === 'otorgarPista' && !idsPista.has(efecto.pistaId)) {
          quejar(`${donde} otorga la pista inexistente "${efecto.pistaId}".`);
        }
        if (efecto.tipo === 'irAEscena' && !idsEscena.has(efecto.escenaId)) {
          quejar(`${donde} manda a la escena inexistente "${efecto.escenaId}".`);
        }
      }
    }
  }

  return problemas;
}
