# La Orden de los Cronistas y el Enigma de Marola

Juego educativo inspirado en *¿Dónde está Carmen Sandiego?*, para que chicos y adolescentes
aprendan la historia real de su ciudad jugando. Primera entrega: **Mar del Plata**.
Estilo Pokémon de Game Boy: mapa cenital, diálogos en cajas de texto, paleta de 4 verdes.

## Correr

```bash
npm install
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run check` | Chequeo de tipos |
| `npm run build` | Chequeo de tipos + build de producción |

**Controles:** flechas o WASD para moverse, Enter o Espacio para hablar y avanzar, Esc para el
menú de pausa, que es donde se empieza la partida de nuevo.
Desde la consola del navegador: `cronistas.partida`, `cronistas.escena.diagnostico`,
`cronistas.reiniciar()`.

## Publicar la demo

El juego es estático: no necesita servidor ni base de datos. Cada push a `main`
lo publica en GitHub Pages con `.github/workflows/deploy.yml`.

**Para habilitarlo la primera vez:** en el repo, Settings → Pages → Source:
**GitHub Actions**. Después de eso, cada push publica solo.

Queda en https://jsemalvarez.github.io/la-orden-de-los-cronistas/

El build usa `base: './'`, o sea rutas relativas, así que funciona igual servido
desde la raíz de un dominio o desde un subdirectorio.

## Cómo está armado

```
content/     Datos puros (JSON). Todo lo específico de una ciudad.
src/motor/   El motor. NO sabe que existe Mar del Plata.
src/juego/   El pegamento entre uno y otro.
docs/        Biblia narrativa, arquitectura y respaldo histórico.
```

La regla que sostiene el proyecto: **agregar una ciudad nueva es agregar una carpeta en
`content/`, sin tocar código.** Detalle en [`docs/arquitectura.md`](docs/arquitectura.md).

La otra regla: **ningún diálogo puede afirmar algo que no esté respaldado en `docs/historia/`.**

## Estado

**La Misión 1 "El Nombre Robado" está completa y jugable de punta a punta**, con sus cinco
escenas y sus dos finales. Es el prototipo para mostrar.

El recorrido: anomalía en el calendario floral de la Plaza San Martín → Balbina te recluta y te
da tres Gemas → salto a 1873, el saladero y el muelle → la Capilla Santa Cecilia, donde está
Peralta Ramos en persona → el despacho del gobernador el 10 de febrero de 1874 → vuelta a la
plaza a leer en el cantero qué versión de la historia quedó en tu partida.

### Funciona

- El centro de Mar del Plata: Plaza San Martín de cuatro manzanas con su rotonda y las
  diagonales Pueyrredón y Alberdi Sur; Catedral, Teatro Colón y Palacio Municipal con su torre
  del reloj; Peatonal San Martín y Av. Pedro Luro de punta a punta; dos manzanas hasta la costa.
  Cada edificio tiene una placa que se puede leer.
- Mapa de casillas con colisiones, cámara, orden de dibujo por profundidad y tiles con textura
- Sprites de personas con ropa, pelo, dirección y animación de paso
- Diálogos con máquina de escribir, panel de opciones, opciones condicionadas por banderas o pistas, y
  marcas `{fecha}` / `{anios}` / `{nombreVigente}` resueltas al jugar
- **El calendario floral muestra la fecha real del día**, y el nombre titila mientras el hecho
  está en disputa
- Gemas: carga en tiempo real, potencia por antigüedad, gasto atómico, costo por distancia
  temporal (saltar de época cuesta mucho más que moverse dentro de ella)
- Cinco escenas en tres épocas; una misma escena puede reusar un mapa con otro elenco
- Guardado en el navegador y línea temporal personal con el resultado de cada hecho
- Validación del contenido al cargar, con los errores en pantalla

### Falta

- **Login**, para que cada jugador entre con su nombre. El motor ya está preparado: la partida
  tiene `nombreJugador` y el guion puede usar la marca `{jugador}` en cualquier diálogo.
- **Modo Archivo**: ver las pistas conseguidas con su fuente histórica. Es lo que convierte el
  juego en material de aula; el dato ya está guardado en cada pista, falta la pantalla.
- Marcar en pantalla qué personajes son ficticios (el dato ya está en el contenido).
- Controles táctiles para jugar en celular.
- Tipografía de mapa de bits propia, en vez de la monoespaciada del sistema.
- Audio.
- Misión 2: la llegada de Pedro Luro en 1877, que Balbina ya adelanta en el cierre.
