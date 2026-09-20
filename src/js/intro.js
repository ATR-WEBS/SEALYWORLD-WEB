/**
* SEALYWORLD - La travesia
*
* El guion de la cortinilla. Este archivo decide CUANDO pasa cada cosa;
* como se ve cada tramo esta en src/css/intro.css. Si quieres que la
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
  const COFRE = { x: 1130, y: 613 };
  const ZOOM = 12;

  /* El centro del viewBox. Con preserveAspectRatio="xMidYMid" es el unico
     punto que la pantalla enseña siempre, sea cual sea el aspecto de la
     ventana: "slice" recorta por los bordes, nunca por el medio. Ahi es
     adonde hay que llevar el cofre. */
  const CENTRO = { x: 800, y: 450 };

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
     punto no basta con escalar: hay que recolocar el plano. El translate
     lleva el cofre al CENTRO del encuadre, que es lo que hace que la
     camara caiga sobre el.

     Ojo con la tentacion de escribir (COFRE.x - COFRE.x * ZOOM): eso deja
     el cofre clavado donde ya estaba, y solo apunta bien si el cofre vive
     justo en mitad del viewBox. En cuanto se mueve a un lado, el zoom se
     va a un punto equivocado y el cofre sale de plano. */
  function entrarAlCofre() {
    const dx = CENTRO.x - COFRE.x * ZOOM;
    const dy = CENTRO.y - COFRE.y * ZOOM;
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

  /* Quitar el telon de golpe, sin fundido ni clases: para quien ya lo vio
     en esta visita. Hay que sacarlo del documento si o si, porque tapa la
     pagina entera con z-index 1000000. */
  function omitir() {
    intro.remove();
  }

  // --- Decidir si toca verla ---------------------------------------------

  /* Forzar la travesia: basta con entrar a sealyworld.com/#zarpar. Util
     para revisarla sin tener que vaciar la sesion a mano. */
  const forzada = window.location.hash === "#zarpar";
  if (forzada) window.sessionStorage.removeItem("sw-intro");

  /* sessionStorage y no localStorage: la travesia se ve una vez por visita.
     El visitante llega a la isla, entra en la tienda y puede pasearse por
     Recompensas, Tops o Equipo y volver sin comerse otros ocho segundos.
     Cerrar la pestana y volver otro dia vuelve a ser llegar por primera
     vez. */
  const yaVista = window.sessionStorage.getItem("sw-intro") === "vista";

  /* Lo que NO se consulta es prefers-reduced-motion. Importa en Windows con
     "Mostrar animaciones" desactivado (muy comun en portatiles con ahorro
     de energia o en escritorio remoto): reporta movimiento reducido y
     dejaria la entrada muerta en esas maquinas. Quien no la quiera la corta
     con el boton Saltar o con Escape. */
  if (yaVista) {
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
