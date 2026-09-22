/**
 * Cruceta y botón en pantalla, para jugar con el pulgar.
 *
 * No es otra forma de entrada: escribe en el mismo `Entrada` que el teclado, así que ni el
 * motor ni la escena se enteran de si el paso lo dio una flecha o un dedo.
 */

import { esBoton, type Boton, type Entrada } from '../motor/entrada';

export function conectarTactil(entrada: Entrada, mando: HTMLElement | null, canvas: HTMLElement): void {
  // Qué botón mantiene apretado cada dedo: hay que soltar el que corresponde, y sólo ese,
  // porque el otro pulgar puede estar caminando al mismo tiempo.
  const dedos = new Map<number, { boton: Boton; tecla: HTMLElement | null }>();

  const apretar = (id: number, boton: Boton, tecla: HTMLElement | null): void => {
    dedos.set(id, { boton, tecla });
    entrada.presionar(boton);
    tecla?.classList.add('apretada');
  };

  const soltar = (id: number): void => {
    const dedo = dedos.get(id);
    if (!dedo) return;
    dedos.delete(id);
    entrada.soltar(dedo.boton);
    dedo.tecla?.classList.remove('apretada');
  };

  // El dedo puede levantarse en cualquier lado, y una tecla trabada deja al jugador
  // caminando solo para siempre.
  window.addEventListener('pointerup', (e) => soltar(e.pointerId));
  window.addEventListener('pointercancel', (e) => soltar(e.pointerId));
  const soltarTodos = () => {
    for (const id of Array.from(dedos.keys())) soltar(id);
  };
  window.addEventListener('blur', soltarTodos);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) soltarTodos();
  });

  if (mando) conectarTeclas(mando, apretar);
  conectarToqueEnPantalla(canvas, apretar);
}

type Apretar = (id: number, boton: Boton, tecla: HTMLElement | null) => void;

function conectarTeclas(mando: HTMLElement, apretar: Apretar): void {
  for (const tecla of Array.from(mando.querySelectorAll<HTMLElement>('[data-boton]'))) {
    const boton = tecla.dataset.boton ?? '';
    if (!esBoton(boton)) {
      console.error(`El mando táctil tiene una tecla desconocida: "${boton}".`);
      continue;
    }
    tecla.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      apretar(e.pointerId, boton, tecla);
    });
  }

  // Mantener apretada una tecla no tiene que abrir el menú de "copiar" del celular.
  mando.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** Un toque sobre el juego vale por "aceptar": es el gesto que cualquiera prueba primero. */
function conectarToqueEnPantalla(canvas: HTMLElement, apretar: Apretar): void {
  canvas.addEventListener('pointerdown', (e) => {
    // Con el mouse no: en la compu ya está Enter, y un click perdido sobre el mapa no
    // debería ponerse a hablar con nadie.
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    apretar(e.pointerId, 'aceptar', null);
  });
}
