# Notas para trabajar en este repo

## Las dos reglas que no se negocian

1. **El motor no sabe que existe Mar del Plata.** `src/motor/` no puede contener ni un nombre
   de ciudad, villano, personaje ni fecha concreta. Todo eso vive en `content/`.
   Criterio para aceptar un cambio: *si para sumar otra ciudad hay que tocar `src/motor/`,
   el cambio está mal.*

2. **Ningún texto del juego afirma algo sin respaldo.** Antes de escribir un diálogo con un
   dato histórico, verificarlo y anotarlo en `docs/historia/`. Si no se puede verificar, se
   marca `⚠️ SIN VERIFICAR` y no se usa como pista verdadera. Es un juego educativo: un dato
   inventado que el chico se lleva como cierto es el peor bug posible.

## Convenciones

- **Identificadores de dominio en español** (`Gema`, `Pista`, `Cronista`, `Sensible`,
  `MaquinaDialogo`). Lo genérico de programación, en inglés (`update`, `render`, `id`).
- **Colores y casillas se nombran, no se numeran.** El contenido dice `"ropa": "violeta"` y
  `"leyenda": { "T": "arbol" }`. Nada de índices mágicos.
- **Los mapas se escriben como texto** (`leyenda` + `filas`). Para uno grande conviene
  generarlo con un script que componga rectángulos; el artefacto que queda es el JSON.
- **Todos los mapas de una ciudad tienen la misma orientación, en cualquier época.** En Mar del
  Plata, el mar abajo y tierra adentro arriba, y cada lugar para el lado en que queda de verdad.
  Ver "Todas las épocas con la misma orientación" en la biblia.
- **Comentarios: sólo el porqué.** Nada de comentarios que repitan lo que dice el código.
- Contenido en JSON, nunca en TypeScript: tiene que poder escribirlo alguien que no programa.
- Cero dependencias de runtime. `typescript` y `vite` son de desarrollo y así queda.

## Antes de dar algo por terminado

```bash
npm run check    # tipos
npm run build    # tipos + bundle
```

Y probarlo jugando. La escena expone `cronistas.escena.diagnostico` en la consola del navegador
para inspeccionar posición, nodo de diálogo y opciones visibles.

**Ojo al probar en un panel de navegador con la pestaña oculta:** `requestAnimationFrame` no
corre, así que el juego queda congelado y parece roto. Para manejarlo desde la consola sin
pestaña visible hay que pisar el bucle a mano:
`esc.actualizar(1/60); esc.entrada.finCuadro();`

## Dónde está cada cosa

| Necesito... | Voy a |
|---|---|
| Cambiar la historia o los personajes | `docs/biblia.md` |
| Verificar o citar un hecho | `docs/historia/` |
| Entender el modelo de contenido | `src/motor/tipos.ts` y `docs/arquitectura.md` |
| Escribir o editar una misión | `content/ciudades/<ciudad>/misiones/` |
| Tocar el balanceo de las Gemas | `AJUSTES` en `src/motor/gemas.ts` |
| Agregar un color o una casilla | `PALETA` en `src/motor/pantalla.ts`, `CASILLAS` en `src/motor/mapa.ts` |
| Agregar una marca `{clave}` al guion | `resolverMarca` en `src/juego/escena-exploracion.ts` |
| Agregar una regla de juego nueva | `src/juego/escena-exploracion.ts` |
| Tocar los controles del celular | el mando en `index.html` y `src/ui/mando-tactil.ts` |
