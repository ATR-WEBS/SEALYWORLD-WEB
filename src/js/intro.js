(function () {
  "use strict";

  const intro = document.getElementById("intro");
  if (!intro) return;

  const camera = intro.querySelector("#camera");
  const skip = document.getElementById("introSkip");

  const COFRE = { x: 1130, y: 613 };
  const ZOOM = 12;

  const CENTRO = { x: 800, y: 450 };

  const GUION = [
    [200, "is-sailing"],
    [4700, "is-open"],
    [6200, "is-zooming", entrarAlCofre],
    [7600, "is-flash"],
    [8200, null, terminar]
  ];

  let relojes = [];
  let terminada = false;

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

    window.setTimeout(function () {
      intro.remove();
    }, 700);
  }

  function cancelar() {
    relojes.forEach(window.clearTimeout);
    relojes = [];
  }

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

  function omitir() {
    intro.remove();
  }

  const forzada = window.location.hash === "#zarpar";
  if (forzada) window.sessionStorage.removeItem("sw-intro");

  const yaVista = window.sessionStorage.getItem("sw-intro") === "vista";

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
