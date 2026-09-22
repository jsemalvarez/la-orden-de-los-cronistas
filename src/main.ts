import { iniciarBucle } from './motor/bucle';
import { obtenerCiudad, obtenerMision, validarMision } from './motor/contenido';
import { Entrada } from './motor/entrada';
import { Pantalla } from './motor/pantalla';
import { cargar, partidaNueva, borrarGuardado, type Partida } from './motor/estado';
import { EscenaExploracion } from './juego/escena-exploracion';

const CIUDAD_ID = 'mar-del-plata';
const MISION_ID = 'mision-01-el-nombre-robado';

function arrancar(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#pantalla');
  if (!canvas) throw new Error('Falta el <canvas id="pantalla"> en el HTML.');

  const pantalla = new Pantalla(canvas);
  const entrada = new Entrada();

  const ciudad = obtenerCiudad(CIUDAD_ID);
  const mision = obtenerMision(MISION_ID);

  const problemas = validarMision(mision, ciudad);
  if (problemas.length > 0) {
    mostrarProblemas(problemas);
    return;
  }

  let partida = cargar();
  if (!partida || partida.misionActual !== mision.id) {
    partida = partidaNueva(mision.id, mision.escenaInicial);
  }

  const escena = new EscenaExploracion(pantalla, entrada, mision, ciudad, partida);

  iniciarBucle((dt) => {
    escena.actualizar(dt);
    escena.dibujar();
    entrada.finCuadro();
  });

  exponerHerramientas(partida, escena);
}

/** Los errores de contenido se ven en pantalla, no escondidos en la consola. */
function mostrarProblemas(problemas: string[]): void {
  console.error('Contenido inválido:\n' + problemas.join('\n'));
  const caja = document.createElement('pre');
  caja.className = 'errores';
  caja.textContent = 'El contenido tiene problemas:\n\n' + problemas.map((p) => `• ${p}`).join('\n');
  document.body.append(caja);
}

/** Atajos de desarrollo desde la consola del navegador. */
function exponerHerramientas(partida: Partida, escena: EscenaExploracion): void {
  Object.assign(window, {
    cronistas: {
      partida,
      escena,
      reiniciar: () => {
        borrarGuardado();
        location.reload();
      },
    },
  });
}

arrancar();
