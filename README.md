# Sealyworld

Tienda del servidor. HTML, CSS y JS a pelo: no hay build ni dependencias
que instalar.

## Verla

```sh
python -m http.server 8777
```

y abrir <http://127.0.0.1:8777>.

Con `file://` casi todo funciona, pero el botón de copiar la IP se queda
sin `navigator.clipboard` y las skins de mc-heads no siempre cargan. Mejor
por servidor.

## La travesía

La cortinilla de entrada (barco → isla → cofre → zoom → tienda) se ve
**en cada carga de la página**: no se guarda nada y no consulta
`prefers-reduced-motion`, así que también corre en equipos con las
animaciones del sistema desactivadas. Se corta con el botón **Saltar** o
con **Escape**.

- Los **tiempos** están todos en la tabla `GUION` de `assets/js/intro.js`.
- El **aspecto** de cada tramo, en `assets/css/intro.css`.
- El **dibujo**, en el `<svg class="intro__scene">` de `index.html`.

Si mueves el cofre dentro del SVG, cambia también la constante `COFRE` de
`intro.js` o el zoom final apuntará a la arena.

Con `prefers-reduced-motion` la cortinilla no se muestra.

## Qué falta por conectar

- **La pasarela de pago.** `assets/js/shop.js`, al final: el `click` de
  `#checkout` tiene marcado el punto exacto donde mandar el carrito y el
  nombre del jugador a Tebex (o lo que uses).
- **El logo.** `assets/img/ui/logo.svg` es un provisional dibujado a la
  misma proporción que reserva el pie (150×58). Pisa el archivo y ya.
- **Los enlaces.** El Discord apunta a `discord.gg/sealyworld` y las demás
  pestañas del menú (Inicio, Recompensas, Tops, Sanciones, Equipo) están a
  `#` a la espera de sus páginas.
- **El top donador** está escrito a mano en `index.html`.

## Estructura

```
index.html                 la tienda + la escena de la intro (en línea)
assets/css/base.css        variables, reinicio, el agua, la tarjeta, botones
assets/css/intro.css       la cortinilla
assets/css/shop.css        la tienda
assets/js/intro.js         el guion de la cortinilla
assets/js/shop.js          nombre de jugador, copiar IP, carrito
assets/img/bg/waves.svg    las olas del fondo
assets/img/products/       las cuatro ilustraciones de los paquetes
```
