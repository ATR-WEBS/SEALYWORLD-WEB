(function () {
    "use strict";

    /**
     * Mobile nav toggle
     */
    const mobileNavToggleBtn = document.querySelector('.tienda-nav__toggle');

    function mobileNavToggle() {
        const isActive = document.querySelector('body').classList.toggle('mobile-nav-active');
        mobileNavToggleBtn.classList.toggle('bi-list');
        mobileNavToggleBtn.classList.toggle('bi-x');
        mobileNavToggleBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    }

    if (mobileNavToggleBtn) {
        mobileNavToggleBtn.addEventListener('click', mobileNavToggle);
        mobileNavToggleBtn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                mobileNavToggle();
            }
        });
    }

    document.querySelectorAll('#tienda-nav a').forEach(navmenu => {
        navmenu.addEventListener('click', () => {
            if (document.querySelector('.mobile-nav-active')) {
                mobileNavToggle();
            }
        });
    });


    /**
     * Escalar página al tamaño de pantalla (referencia 2300px).
     *
     * El sitio se maqueta siempre como si el viewport midiera 2300px y se
     * encoge para llenar la ventana real, de modo que la estructura y el
     * orden sean identicos en cualquier pantalla.
     *
     * Aqui solo se escribe la variable --escala-pagina. Quien la aplica es
     * la regla `zoom` del body, en main.css: sobre el <html>, que es donde
     * estaba, Firefox no la aplica en paginas de ancho fijo. La misma
     * formula esta inline en el <head> de cada pagina, que es quien la fija
     * antes del primer paint; si tocas una, toca la otra.
     *
     * Solo se escala a partir de 1200px. Todos los breakpoints del sitio son
     * max-width <= 1200, asi que por encima de ese ancho no se dispara
     * ninguno y el layout de escritorio es identico siempre. Por debajo, dar
     * un lienzo de 2300px mientras las media queries leen el ancho real
     * dejaria una pagina con estilos de tablet maquetada a lo ancho de un
     * escritorio. Ahi manda el responsive del sitio, que para eso esta.
     */
    const ESCALA_REFERENCIA = 2300;
    const ESCALA_DESDE = 1200;

    function fitPageToScreen() {
        const html = document.documentElement;

        // Los elementos position:fixed se escalan con el zoom del html, por
        // eso en 2K se salen del viewport. A todos estos hay que aplicarles
        // el zoom inverso para neutralizarlo.
        //   #carrito-panel  el panel lateral del carrito
        //   #intro          el telon de la travesia (solo en la tienda, y
        //                   solo mientras corre: despues se quita del DOM,
        //                   asi que a partir de ahi esto no encuentra nada)
        const fijos = ['carrito-panel', 'intro']
            .map(id => document.getElementById(id))
            .filter(Boolean);

        if (window.innerWidth < ESCALA_DESDE) {
            html.style.removeProperty('--escala-pagina');
            html.style.overflowX = '';
            fijos.forEach(el => el.style.zoom = '');
            return;
        }

        const scale = window.innerWidth / ESCALA_REFERENCIA;
        html.style.setProperty('--escala-pagina', scale);
        html.style.overflowX = 'hidden';

        fijos.forEach(el => el.style.zoom = String(1 / scale));
    }

    window.addEventListener('load', fitPageToScreen);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(fitPageToScreen, 100);
    });

})();
