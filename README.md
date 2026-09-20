# SealyWorld

Sitio de SealyWorld. HTML estático: se abre con doble clic o se sirve con
cualquier servidor de archivos. Con `file://` casi todo funciona, pero las
fuentes de Google y las skins remotas no siempre cargan; mejor por servidor:

```sh
python3 -m http.server 8000
```

Páginas: `index.html` (Tienda, y la raíz del dominio), `inicio.html`,
`recompensas.html`, `tops.html`, `sanciones.html`, `equipo.html`, `perfil.html`.

## La travesía

La cortinilla de entrada (barco → isla → cofre → zoom → tienda) corre **solo
en `index.html`**, que es lo que se sirve al entrar a sealyworld.com. Se ve
**una vez por visita**: quien pasa a Recompensas o a Tops y vuelve ya no se
come otros ocho segundos. Cerrar la pestaña y volver otro día es llegar a la
isla por primera vez. Para verla sin vaciar la sesión a mano, entra por
`/#zarpar`. Se corta con el botón **Saltar** o con **Escape**.

Son tres piezas y nada más:

| Dónde | Qué |
|---|---|
| `src/js/intro.js` | **Cuándo** pasa cada cosa. Los tiempos están todos en la tabla `GUION`. |
| `src/css/intro.css` | **Cómo** se ve cada tramo. |
| `index.html` | **El dibujo**, en el `<svg class="intro__scene">` del `<div id="intro">`. |

El SVG va en línea, no en un `<img>`: el JS tiene que mover el barco, abrir la
tapa y empujar la cámara, y desde fuera del documento no se puede tocar nada
de eso.

### Detalles que muerden si se tocan

- Si mueves el cofre dentro del SVG, mueve también la constante `COFRE` de
  `intro.js`, o el zoom final apuntará a la arena.
- El `<script>` de la travesía va **pegado al telón**, no al final del body con
  los demás: cuando ya se vio en esta visita hay que retirarlo antes del primer
  pintado, o asoma un fotograma de la isla al volver a la tienda.
- `index.html` es la única página **sin** `#fade-entrada`. Ese fundido negro va
  en `z-index: 999998`, por encima del telón; los dos a la vez serían un
  parpadeo negro sobre el primer fotograma.
- `intro.css` no hereda nada de `main.css`. Lo que necesita de fuera está
  declarado en su sección 0, así que llevarse la cortinilla a otra página es
  copiar dos archivos y tres líneas de HTML.
- La travesía **no** consulta `prefers-reduced-motion`. Es deliberado: Windows
  con "Mostrar animaciones" desactivado lo reporta, y ahí la entrada quedaba
  muerta. Quien no la quiera tiene Saltar y Escape. La regla que sí respeta esa
  preferencia, para el resto del sitio, está al final de `intro.css`.
