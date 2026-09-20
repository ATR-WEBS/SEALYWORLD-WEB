/**
* SEALYWORLD - La travesia
*
* El guion de la cortinilla. Este archivo decide CUANDO pasa cada cosa;
* como se ve cada tramo esta en assets/css/intro.css. Si quieres que la
* entrada sea mas corta o mas larga, toca solo la tabla GUION: los
* numeros son milisegundos desde que arranca.
*/

(function () {
  "use strict";

  const intro = document.getElementById("intro");
  if (!intro) return;

  const camera = intro.querySelector("#camera");
  const skip = document.getElementById("introSkip");

  /* Adonde entra la camara. Son coordenadas del viewBox del SVG, no
     pixeles de pantalla: es el centro de la boca del cofre en index.html.
     Si mueves el cofre, mueve tambien esto. */
  const COFRE = { x: 806, y: 596 };
  const ZOOM = 12;

  /* GUION. [milisegundo, clase que se enciende, algo extra que hacer] */
  const GUION = [
    [200, "is-sailing"],                 // el barco entra en plano
    [4700, "is-open"],                   // ya ha llegado: salta la tapa
    [6200, "is-zooming", entrarAlCofre], // la camara se mete dentro
    [7600, "is-flash"],                  // fogonazo que tapa el corte
    [8200, null, terminar]               // aparece la tienda
  ];

  let relojes = [];
  let terminada = false;

  /* Encuadre del zoom.
     En SVG el origen de los transform es 0 0, asi que para acercarse a un
     punto no basta con escalar: hay que recolocar el plano para que ese
     punto se quede donde estaba. De ahi el translate, que es el mismo
     calculo que hace un transform-origin a mano. */
  function entrarAlCofre() {
    const dx = COFRE.x - COFRE.x * ZOOM;
    const dy = COFRE.y - COFRE.y * ZOOM;
    camera.style.transform = "translate(" + dx + "px, " + dy + "px) scale(" + ZOOM + ")";
  }

  function terminar() {
    if (terminada) return;
    terminada = true;

    intro.classList.add("is-done");
    document.body.classList.remove("is-intro");

    /* Se quita del documento: mientras siga ahi, un SVG a pantalla
       completa con animaciones corriendo le cuesta bateria a quien esta
       leyendo la tienda. El retardo cubre el fundido de .is-done. */
    window.setTimeout(function () {
      intro.remove();
    }, 700);
  }

  function cancelar() {
    relojes.forEach(window.clearTimeout);
    relojes = [];
  }

  /* Saltar: se corta el guion y se va directo a la tienda. */
  function saltar() {
    cancelar();
    terminar();
  }

  function arrancar() {
    document.body.classList.add("is-intro");

    relojes = GUION.map(function (paso) {
      const [cuando, clase, extra] = paso;
      return window.setTimeout(function () {
        if (clase) intro.classList.add(clase);
        if (extra) extra();
      }, cuando);
    });
  }

  /* Quitar la cortinilla sin fundido ni clases: para quien ya la vio o
     no quiere animaciones. */
  function omitir() {
    intro.remove();
  }

  // --- Decidir si toca verla -------------------------------------------

  /* Forzar la travesia: basta con entrar a sealyworld.com/#zarpar.
     Ignora dos cosas: que ya se haya visto en esta sesion Y que el sistema
     pida movimiento reducido. Lo segundo importa mucho al desarrollar:
     Windows con "Mostrar animaciones" desactivado (muy comun en portatiles
     con ahorro de energia o en escritorio remoto) reporta reduced-motion,
     y sin este atajo la travesia jamas aparece en esa maquina. */
  const forzada = window.location.hash === "#zarpar";
  if (forzada) window.sessionStorage.removeItem("sw-intro");

  /* Para el visitante normal SI se respeta: un zoom a pantalla completa es
     justo lo que esa opcion del sistema pide evitar. */
  const sinMovimiento = !forzada &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* sessionStorage y no localStorage: la travesia se ve una vez por
     visita. Cerrar la pestana y volver otro dia vuelve a ser llegar a la
     isla por primera vez. */
  const yaVista = window.sessionStorage.getItem("sw-intro") === "vista";

  if (sinMovimiento || yaVista) {
    omitir();
  } else {
    window.sessionStorage.setItem("sw-intro", "vista");
    if (skip) skip.addEventListener("click", saltar);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") saltar();
    });
    arrancar();
  }
})();
