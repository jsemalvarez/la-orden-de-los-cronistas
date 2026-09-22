# Arquitectura

## Stack

**TypeScript + Vite + Canvas 2D.** Sin motor de juego.

Razón: el 70% de este juego es una máquina de estados narrativa y un modelo de datos históricos;
el 30% restante es caminar por casillas y dibujar tiles, que en estilo Game Boy son ~300 líneas.
Un motor grande (Phaser, Godot) resolvería la parte barata y no la cara. Además: corre en
cualquier navegador y en la notebook de cualquier escuela, se embebe en cualquier sitio, pesa
poco y el código queda legible a largo plazo.

## La regla que sostiene todo

> **El motor no sabe que existe Mar del Plata.**

```
src/motor/      →  genérico. Ni un string "Mar del Plata", ni "Marola", ni "1874".
content/        →  datos puros (JSON). Todo lo específico de una ciudad.
src/juego/      →  el pegamento: toma contenido y lo corre en el motor.
```

**Agregar una ciudad nueva = agregar una carpeta en `content/`. Cero código.**
Ese es el criterio para aceptar o rechazar cualquier cambio: si para sumar Rosario hay que tocar
`src/motor/`, el cambio está mal.

## Estructura

```
content/ciudades/mar-del-plata/
  ciudad.json                    metadatos, villano, épocas disponibles
  epocas/                        paleta, tileset y aspecto de cada época
  mapas/                         leyenda + filas de texto, colisiones y personajes
  misiones/
    01-el-nombre-robado.json     hecho histórico, escenas, pistas, diálogos

src/motor/
  tipos.ts        el modelo de contenido — el corazón del proyecto
  contenido.ts    carga y valida JSON (integridad referencial)
  bucle.ts        game loop
  entrada.ts      teclado + táctil
  pantalla.ts     canvas, escalado entero, paleta con nombres
  mapa.ts         catálogo de casillas, dibujo y colisiones
  actor.ts        movimiento por casillas y sprites (personas y objetos)
  dialogo.ts      máquina de diálogo con efectos
  gemas.ts        el recurso temporal
  estado.ts       partida, línea temporal personal, guardado

src/juego/        escenas concretas
src/ui/           caja de texto estilo GB, HUD de Gemas
docs/historia/    respaldo histórico de cada misión  ← obligatorio
```

## Modelo de contenido

Cuatro conceptos. Todo lo demás se construye con estos.

### `HechoHistorico`
La unidad canónica. Tiene una **versión real** (con fuentes obligatorias) y una **versión
alterada** por el villano. El juego entero es la disputa entre esas dos versiones.

### `Escena`
Un lugar en una época. Tiene mapa, NPCs y las pistas que se pueden conseguir ahí.

### `Pista`
`verdadera` | `falsa` | `ruido`. La misión se resuelve con N pistas verdaderas.
Cada pista verdadera lleva su `fuenteHistorica` — así el modo Archivo puede mostrarle al chico
de dónde salió el dato.

### `NodoDialogo`
Texto + hablante + opciones + **efectos**. En el texto se pueden usar marcas `{clave}` que el
motor resuelve al jugar: `{fecha}`, `{anios}`, `{ciudad}`, `{nombreVigente}`, `{nombreAlterado}`
y `{jugador}` (preparada para cuando haya login). Así el guion puede nombrar cosas que sólo se
saben en tiempo de juego sin que el contenido tenga que ser código.

Los efectos son el único modo en que un diálogo toca el estado del juego:

```ts
| { tipo: 'otorgarPista',      pistaId }
| { tipo: 'gastarGemas',       cantidad }
| { tipo: 'avanzarCorrupcion', cantidad }
| { tipo: 'establecerBandera', bandera, valor }
| { tipo: 'irAEscena',         escenaId }
| { tipo: 'resolverMision',    resultado }
```

Que la lista de efectos sea cerrada y chica es deliberado: mantiene el contenido escribible por
alguien que no programa, y hace que el motor no necesite cambiar cuando se agregan misiones.

## Cómo se escribe un mapa

Una leyenda de un carácter por tipo de casilla y el dibujo del mapa en texto:

```json
{
  "leyenda": { ".": "pasto", "T": "arbol", "p": "peatonal", "~": "agua" },
  "solidos": ["arbol", "agua"],
  "filas": [
    "ppppp.......",
    "ppppp..T....",
    "~~~~~~~~~~~~"
  ]
}
```

Se lee de un vistazo, se corrige a mano y en un diff se ve exactamente qué cambió. El catálogo
de casillas está en `src/motor/mapa.ts`; cada una se dibuja por código, con una variación
estable por posición para que una pradera no se vea como un mosaico repetido.

Los mapas grandes conviene generarlos con un script que componga rectángulos y escriba el JSON:
el artefacto sigue siendo el JSON, editable a mano después.

## El elenco lo puede cambiar la escena

Un mismo mapa sirve para varios momentos. La escena puede `ocultar` personajes del mapa y
definir los suyos, que reemplazan por `id` o se suman. Así la Plaza San Martín es a la vez la
escena de apertura y la del epílogo, con otra gente y otros diálogos adentro.

## Decisiones tomadas

| Decisión | Por qué |
|---|---|
| Contenido en JSON, no en TS | Para que un docente o historiador pueda escribir una misión sin compilar |
| Mapas en `leyenda` + `filas` de texto | Un mapa se corrige a mano y se revisa en un diff; una grilla de números, no |
| Colores por nombre, no por índice | El contenido dice `"ropa": "violeta"`, no `"color": 7` |
| Los tiles se dibujan por código | El juego no depende de que exista arte todavía, y la paleta queda garantizada |
| Validación de integridad referencial en carga | Un `destino` que apunta a un nodo inexistente tiene que fallar con un mensaje claro, no con pantalla negra |
| Cero dependencias de runtime | Menos superficie, build instantáneo, nada que se pudra en 3 años |
| Identificadores de dominio en español | `Gema`, `Pista`, `Cronista`, `Sensible` son el dominio. Traducirlos sería peor. Lo genérico (`update`, `render`) queda en inglés. |
| Gemas con `cargadaDesde` (timestamp), no un contador | La regla "cuanto más cargó, más rinde" exige tiempo real, no un número |
| Escalado entero del canvas | Que los píxeles se vean cuadrados y nítidos, como en la Game Boy |

## Pendientes conocidos

- Validación de contenido con esquema (Zod) si el volumen de misiones crece.
- Tileset real en PNG, cuando haya arte. Hoy los tiles se dibujan por código.
- Audio.
- Modo Archivo: ver las pistas conseguidas con sus fuentes.
