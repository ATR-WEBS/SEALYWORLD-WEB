# SealyWorld

Sitio estático. Se sirve con cualquier servidor de archivos:

```sh
python3 -m http.server 8000
```

## Páginas

`index.html` (tienda, raíz del dominio), `inicio.html`, `recompensas.html`,
`tops.html`, `sanciones.html`, `equipo.html`, `perfil.html`.

## Estructura

```
src/css/    main.css, intro.css
src/js/     main.js, tienda.js, tops.js, sanciones.js, equipo.js, perfil.js, intro.js
src/img/    imágenes
src/lib/    bootstrap, bootstrap-icons, aos, swiper, glightbox
```

## Intro

Animación de entrada en `index.html`. Se reproduce una vez por sesión;
`/#zarpar` la fuerza. Se corta con el botón Saltar o con Escape.

- `src/js/intro.js` — tiempos (tabla `GUION`) y punto de zoom (`COFRE`).
- `src/css/intro.css` — estilos de cada tramo.
- `index.html` — el SVG, dentro de `<div id="intro">`.

Si se mueve el cofre en el SVG hay que actualizar `COFRE` en `intro.js`.

## Escala de página

El sitio se maqueta a 2300 px y se escala para llenar la ventana, de modo que
la estructura sea igual en cualquier pantalla. A partir de 1200 px de ancho.

- Variable `--escala-pagina`, fijada por el script inline del `<head>`.
- Aplicada por `body { zoom: ... }` en `main.css`.
- Actualizada al redimensionar en `fitPageToScreen()` de `main.js`.

## Caché

CSS y JS van versionados con `?v=` y el `.htaccess` los marca `immutable`
durante un año. **Al modificar un CSS o un JS hay que subir su `?v=` en todas
las páginas**, o los visitantes seguirán con la versión antigua.
