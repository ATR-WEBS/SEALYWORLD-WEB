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
     * Escalar página al tamaño de pantalla (referencia 2300px)
     */
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

        if (window.innerWidth < 768) {
            html.style.zoom = '';
            html.style.overflowX = '';
            fijos.forEach(el => el.style.zoom = '');
            return;
        }

        const scale = window.innerWidth / 2300;
        html.style.zoom = scale;
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
