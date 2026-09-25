# La Orden de los Cronistas y el Enigma de Marola — Biblia del juego

> Canon narrativo y de diseño. Si el código y este documento se contradicen, gana este documento
> (o se actualiza acá primero). Todo dato histórico que aparezca en el juego debe estar
> respaldado en `docs/historia/`.

## 1. Qué es

Juego educativo inspirado en *¿Dónde está Carmen Sandiego?*, para que chicos y adolescentes
aprendan la historia real de su ciudad jugando. Primera entrega: **Mar del Plata, Argentina**.
Diseñado desde el día uno para escalar a otras ciudades.

## 2. Reglas del mundo

### La Chispa y los Sensibles
El jugador es un **Sensible**: percibe cuando la historia fue alterada. Ve *titilar* entre dos
versiones un nombre, un cartel, una fecha. La gente común no lo nota. Son muy raros.

> **Regla de escritura:** la Chispa nunca *explica* la anomalía, sólo la *muestra*. El jugador
> saca la conclusión. Es el núcleo pedagógico del juego: entrenar la sospecha ante un dato.

### La Orden de los Cronistas
Organización **genérica**, no atada a ninguna ciudad — por eso escala. Detecta alteraciones y
recluta Sensibles. Contacto del jugador: **Balbina**, cronista.

### Los villanos
Cada ciudad tiene el suyo. El de Mar del Plata es **Marola**. No borra la historia: la
**reescribe de forma sutil y creíble**, para que exista "otra" ciudad en lugar de la real, una
sin su identidad. A futuro: los villanos de distintas ciudades podrían aliarse (modo multijugador).

> **Regla de escritura:** Marola nunca miente de forma absurda. Toda versión falsa suya tiene que
> sonar plausible. Si un chico no duda, la mentira está mal escrita.

### Las Gemas
Único recurso. Es el reloj del juego.

| Regla | Detalle |
|---|---|
| Cargan solas | Mientras no se usan, con el paso del tiempo real |
| Cuanto más cargaron, más rinden | El tiempo de carga define la **potencia**, no sólo la cantidad |
| Saltar en el tiempo cuesta | Cuanto más atrás, más caro |
| Moverse dentro de la época cuesta | Bastante menos que el salto |
| Quedarse sin Gemas | El cambio de Marola se vuelve **irreversible** — pero **sólo en la línea temporal de ese jugador** |

### La línea temporal personal
Consecuencia directa de la regla anterior y seña de identidad del juego: **cada jugador termina
con su propia versión de la historia de Mar del Plata**, según qué logró restaurar y qué no.
No hay "game over": hay una ciudad distinta.

### Las hendijas
Son los pasos de un momento a otro, y **sólo se abren para quien ya sabe a qué va**: la de cada
escena se abre cuando el jugador consiguió la pista verdadera de esa escena.

> **Regla de diseño:** el camino de una misión es de ida. Si una hendija dejara pasar sin la
> pista de su escena, el jugador podría llegar al final sin forma de resolverlo, y sin poder
> volver a buscarla.

## 3. Estilo

**Pokémon de Game Boy Advance**: color pleno, mapa cenital, personaje que camina por casillas,
sprites con pelo y ropa, contornos oscuros, pasto con textura, árboles redondeados, y ventanas
de diálogo claras con texto oscuro y el nombre del que habla en un cartelito sobre el borde.
**El mapa cambia visualmente según la época** (el Mar del Plata de 1874 no se ve como el de hoy).

Paleta con nombres (no índices) en `src/motor/pantalla.ts`. Ver `docs/arquitectura.md`.

### El mapa del presente es Mar del Plata de verdad

Tres columnas de manzanas y cinco filas, separadas por las dos calles que ordenan el centro:

- **Peatonal San Martín**, vertical por el oeste, de la costa hasta pasar Hipólito Yrigoyen.
- **Av. Pedro Luro**, vertical por el centro, y **parte la plaza al medio**: la **rotonda** está
  justo donde la avenida cruza la plaza. Lleva el nombre del hombre que en 1877 se hace cargo
  del saladero, el personaje que Balbina adelanta en el cierre; el cartel de la esquina se lee.
- **Plaza San Martín**: cuatro manzanas, dos a cada lado de Av. Pedro Luro, con **el calendario
  floral** en la manzana sudoeste.
- **Catedral de los Santos Pedro y Cecilia** en la manzana de enfrente, cruzando la peatonal,
  con el frente mirándola: el calendario le queda justo enfrente.
- **Teatro Colón** y **Palacio Municipal** sobre **Hipólito Yrigoyen**, en **una sola manzana**,
  al norte de la plaza. El Palacio con su torre del reloj.
- Bajando de la rotonda, las **diagonales Pueyrredón** (sudoeste) y **Alberdi Sur** (sudeste)
  cortan las manzanas que van a la **costa**.

> El centro de Mar del Plata tiene la retícula girada unos 30° respecto al norte (medido sobre
> OpenStreetMap): por eso en un mapa satelital todas las calles se ven en diagonal. En el juego la
> retícula se alinea con la pantalla, y así las diagonales de verdad —Pueyrredón y Alberdi— son
> las que se ven en diagonal.
>
> ⚠️ Los nombres de las dos calles horizontales que quedan (entre la plaza y la costa) están
> **sin confirmar**: en el mapa figuran sin nombre hasta tener el dato.

### Todas las épocas con la misma orientación

Todo mapa de exterior, de cualquier época, se orienta como el del presente: **el mar abajo y
tierra adentro arriba**. De una época a otra cambia lo construido, no para qué lado queda el mar.
Así el jugador arma en la cabeza un solo plano de la ciudad y lo reconoce en cualquier año:
bajar es ir hacia la costa; subir, hacia la loma.

- **Si un mapa muestra el mar, va abajo.** La plaza de hoy y el saladero de 1873 tienen la costa
  en el mismo borde.
- **Cada lugar queda para el lado en que queda de verdad**, tomando las calles de hoy como
  referencia: Luro vertical, San Martín a su izquierda, 25 de Mayo y 9 de Julio a su derecha. El
  saladero estaba a la derecha de Luro, tres cuadras más abajo que la plaza; la capilla, arriba y
  a la derecha del saladero; Punta Iglesia, a la derecha, sobre la costa. Ver H-07 y H-12.
- **El texto y el mapa dicen lo mismo.** Si el capataz dice "arriba, en la loma", la loma queda
  para arriba en la pantalla.
- Un interior, como el despacho de La Plata, no tiene costa que respetar: se entra por abajo.

Los puntos cardinales de esta biblia son los del juego: el norte es arriba, tierra adentro.

### El calendario floral es el ancla del juego
Muestra la **fecha real del día en que se está jugando**, y abajo MAR DEL PLATA y los años
cumplidos desde 1874. Mientras el hecho está en disputa, el nombre **titila** entre las dos
versiones: eso es exactamente lo que ve un Sensible y nadie más. Resuelta la misión, queda fijo
el nombre que ganó — el jugador puede ir a leer el resultado de su partida escrito en el piso
de la plaza.

## 4. Personajes

| Personaje | Rol | ¿Histórico? |
|---|---|---|
| El jugador | Sensible recién reclutado | ficticio |
| **Balbina** | Cronista, mentora, cierra y abre misiones | ficticia |
| **Marola** | Antagonista de Mar del Plata | ficticia |
| **Patricio Peralta Ramos** | Pide por carta el nombre "Mar del Plata" | **real** |
| **Mariano Acosta** | Gobernador de Bs. As., firma el decreto | **real** |
| Capataz del saladero | Pista verdadera (Escena A) | ficticio |
| Marinero infiltrado | Pista falsa (Escena A) | ficticio, agente de Marola |
| Pescador viejo | Ruido / color (Escena A) | ficticio |
| Turista | Explica el calendario en el presente; no ve la anomalía | ficticio |
| Vecino de la sierra | Distracción con base real: *serranos vs. costeros* | ficticio, postura real |
| Figura encapuchada | Marola disfrazada — cuesta Gemas | — |
| Escribano nervioso | Pista parcial: "hay dos versiones del decreto" | ficticio |

> Todo personaje ficticio se marca en el juego. Un chico tiene que poder distinguir qué pasó de
> verdad y qué inventamos para contarlo.

## 5. Misión 1 — "El Nombre Robado"

**Hecho real:** el 14/11/1873 Peralta Ramos le escribe al gobernador Acosta pidiendo fundar el
pueblo y **proponiendo el nombre "Mar del Plata"**. El 10/02/1874 Acosta firma el decreto que
reconoce al pueblo dentro del Partido de Balcarce **con ese nombre**.

**Qué hace Marola:** impedir que la carta llegue al despacho. Sin pedido, el decreto sale con el
nombre administrativo por defecto del partido: **"Puerto Balcarce"** — y la ciudad pierde su nombre.

> ⚠️ Esta premisa **corrige** la del planteo inicial, que no se sostiene en las fuentes.
> El detalle completo, con fuentes, está en [`docs/historia/mision-01-fuentes.md`](historia/mision-01-fuentes.md).

### Escenas

| # | Escena | Época | Qué pasa |
|---|---|---|---|
| 0 | Anomalía cotidiana | presente | El jugador ve titilar el nombre en el calendario floral. No entiende qué le pasa. |
| 0.5 | El contacto | presente | Balbina: sos un Sensible / qué es la Orden / quién es Marola / tu primera Gema. |
| A | El saladero y el muelle | 1873 | Capataz (verdadera) · Marinero infiltrado (falsa) · Pescador viejo (ruido) |
| B | La Capilla Santa Cecilia | fines de 1873 | Peralta Ramos (clave) · Vecino de la sierra (distrae) · Figura encapuchada (cuesta Gemas) |
| C | El despacho del gobierno | 10/02/1874 | La carta original (definitiva) · Decreto falso (avanza la corrupción) · Escribano (parcial) |
| R | Resolución | — | Con las pistas a tiempo → **Mar del Plata**. Sin Gemas → **Puerto Balcarce**, para siempre, en esa partida. |
| F | Cierre | presente | De vuelta en la plaza. Balbina confirma qué versión quedó grabada, el jugador lo lee en el cantero, y ella adelanta a Pedro Luro en 1877. |

## 6. Qué NO es este juego

- No es una enciclopedia: el dato se descubre jugando, nunca se dicta.
- No castiga con "perdiste": bifurca la historia.
- No inventa hechos para que cierre la trama. Si la historia no da, se cambia la trama.
