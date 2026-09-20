/**
* SEALYWORLD - La tienda
*
*   1. Aviso flotante
*   2. Menu en pantallas estrechas
*   3. Copiar la IP
*   4. Nombre de jugador
*   5. Carrito
*/

(function () {
  "use strict";

  const IP = "sealyworld.com";
  const SKIN_POR_DEFECTO = "MHF_Steve";

  /*------------------------------------------------------------
  # 1. Aviso flotante
  ------------------------------------------------------------*/
  const toast = document.getElementById("toast");
  let relojToast;

  function avisar(texto) {
    if (!toast) return;
    toast.textContent = texto;
    toast.classList.add("is-on");
    window.clearTimeout(relojToast);
    relojToast = window.setTimeout(function () {
      toast.classList.remove("is-on");
    }, 2400);
  }

  /*------------------------------------------------------------
  # 2. Menu en pantallas estrechas
  ------------------------------------------------------------*/
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  if (burger && nav) {
    burger.addEventListener("click", function () {
      const abierto = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(abierto));
    });

    /* Al elegir destino el panel se cierra solo: dejarlo abierto tapa lo
       que el jugador acaba de pedir ver. */
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /*------------------------------------------------------------
  # 3. Copiar la IP
  ------------------------------------------------------------*/
  const ipBtn = document.getElementById("ipBtn");

  if (ipBtn) {
    ipBtn.addEventListener("click", function () {
      /* navigator.clipboard solo existe en https (o en localhost). En
         http plano hay que volver al truco del campo oculto o el boton
         no hace nada y nadie entiende por que. */
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(IP).then(function () {
          avisar("IP copiada: " + IP);
        });
        return;
      }

      const campo = document.createElement("textarea");
      campo.value = IP;
      campo.setAttribute("readonly", "");
      campo.style.position = "fixed";
      campo.style.opacity = "0";
      document.body.appendChild(campo);
      campo.select();
      try {
        document.execCommand("copy");
        avisar("IP copiada: " + IP);
      } catch (err) {
        avisar("Copia la IP a mano: " + IP);
      }
      campo.remove();
    });
  }

  /*------------------------------------------------------------
  # 4. Nombre de jugador
  ------------------------------------------------------------*/
  const form = document.getElementById("playerForm");
  const input = document.getElementById("playerName");
  const skin = document.getElementById("playerSkin");

  function pintarSkin(nombre) {
    if (!skin) return;
    skin.src = "https://mc-heads.net/avatar/" + encodeURIComponent(nombre || SKIN_POR_DEFECTO) + "/96";
    skin.alt = nombre ? "Cabeza de " + nombre : "";
  }

  function jugador() {
    return input ? input.value.trim() : "";
  }

  if (form && input) {
    /* El nombre sobrevive a la recarga: nadie quiere volver a escribirlo
       cada vez que vuelve a la tienda. */
    const guardado = window.localStorage.getItem("sw-jugador");
    if (guardado) {
      input.value = guardado;
      pintarSkin(guardado);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const nombre = jugador();
      if (!nombre) return;
      window.localStorage.setItem("sw-jugador", nombre);
      pintarSkin(nombre);
      avisar("Comprando para " + nombre);
      pintarDestino();
    });

    /* Mientras escribe no se pide la skin en cada tecla: seria una
       peticion por letra. Solo al soltar el campo. */
    input.addEventListener("change", function () {
      pintarSkin(jugador());
    });
  }

  /*------------------------------------------------------------
  # 5. Carrito
  ------------------------------------------------------------*/
  const drawer = document.getElementById("drawer");
  const cartBtn = document.getElementById("cartBtn");
  const cartList = document.getElementById("cartList");
  const cartEmpty = document.getElementById("cartEmpty");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const cartFor = document.getElementById("cartFor");
  const checkout = document.getElementById("checkout");

  /* [{sku, nombre, precio, arte, cantidad}] */
  let carrito = leerCarrito();

  function leerCarrito() {
    try {
      const crudo = window.localStorage.getItem("sw-carrito");
      return crudo ? JSON.parse(crudo) : [];
    } catch (err) {
      return [];
    }
  }

  function guardarCarrito() {
    window.localStorage.setItem("sw-carrito", JSON.stringify(carrito));
  }

  function unidades() {
    return carrito.reduce(function (n, linea) { return n + linea.cantidad; }, 0);
  }

  function total() {
    return carrito.reduce(function (n, linea) { return n + linea.precio * linea.cantidad; }, 0);
  }

  function pintarDestino() {
    if (!cartFor) return;
    const nombre = jugador();
    cartFor.hidden = !nombre;
    cartFor.textContent = nombre ? "Los zafiros iran a " + nombre : "";
  }

  function pintarCarrito() {
    if (!cartList) return;

    cartList.innerHTML = "";

    carrito.forEach(function (linea) {
      const li = document.createElement("li");
      li.className = "drawer__line";
      li.innerHTML =
        '<img src="' + linea.arte + '" alt="" width="42" height="42">' +
        "<div><b></b><span></span></div>" +
        '<button type="button" class="drawer__drop" aria-label="Quitar">&times;</button>';

      /* El nombre y el precio se escriben como texto, no dentro del HTML
         de arriba: asi nada de lo que venga del data-* puede colarse como
         etiqueta. */
      li.querySelector("b").textContent = linea.nombre;
      li.querySelector("span").textContent =
        linea.cantidad + " x $" + linea.precio.toFixed(2);

      li.querySelector(".drawer__drop").addEventListener("click", function () {
        quitar(linea.sku);
      });

      cartList.appendChild(li);
    });

    const vacio = carrito.length === 0;
    if (cartEmpty) cartEmpty.hidden = !vacio;
    if (checkout) checkout.disabled = vacio;
    if (cartTotal) cartTotal.textContent = "$" + total().toFixed(2);

    if (cartCount) {
      const n = unidades();
      cartCount.hidden = n === 0;
      cartCount.textContent = String(n);
    }

    pintarDestino();
  }

  function anadir(datos) {
    const ya = carrito.find(function (linea) { return linea.sku === datos.sku; });
    if (ya) {
      ya.cantidad += 1;
    } else {
      carrito.push({
        sku: datos.sku,
        nombre: datos.nombre,
        precio: datos.precio,
        arte: datos.arte,
        cantidad: 1
      });
    }
    guardarCarrito();
    pintarCarrito();
  }

  function quitar(sku) {
    carrito = carrito.filter(function (linea) { return linea.sku !== sku; });
    guardarCarrito();
    pintarCarrito();
  }

  function abrirCarrito() {
    if (!drawer) return;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function cerrarCarrito() {
    if (!drawer) return;
    drawer.hidden = true;
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".pack__buy").forEach(function (boton) {
    boton.addEventListener("click", function () {
      const tarjeta = boton.closest(".pack");
      const arte = tarjeta ? tarjeta.querySelector(".pack__art img") : null;

      anadir({
        sku: boton.dataset.sku,
        nombre: boton.dataset.name,
        precio: parseFloat(boton.dataset.price),
        arte: arte ? arte.getAttribute("src") : ""
      });

      avisar(boton.dataset.name + " al carrito");
      abrirCarrito();
    });
  });

  if (cartBtn) cartBtn.addEventListener("click", abrirCarrito);

  if (drawer) {
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) cerrarCarrito();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && !drawer.hidden) cerrarCarrito();
  });

  if (checkout) {
    checkout.addEventListener("click", function () {
      /* Sin nombre no hay compra: la pasarela necesita saber a quien
         abonar los zafiros y despues ya no hay forma de preguntarlo. */
      if (!jugador()) {
        cerrarCarrito();
        avisar("Escribe tu nombre de jugador primero");
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      /* AQUI VA LA PASARELA.
         Hoy solo avisa. Cuando conectes Tebex, PayPal o lo que uses,
         manda `carrito` y `jugador()` a su checkout desde este punto:
         es el unico sitio del archivo que tiene que cambiar. */
      avisar("Pasarela de pago todavia sin conectar");
    });
  }

  pintarCarrito();
})();
