(function () {
    "use strict";

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

    const ESCALA_REFERENCIA = 2300;
    const ESCALA_DESDE = 1200;

    function fitPageToScreen() {
        const html = document.documentElement;

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
