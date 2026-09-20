/**
 * Tienda Sealyworld — Integración Tebex Headless
 *
 * CONFIGURACIÓN:
 *   Reemplaza TEBEX_TOKEN con tu token público de Tebex.
 *   Cada .tienda-paquetes__tarjeta debe tener:
 *     data-package-id   → ID numérico del paquete en Tebex
 *     data-package-name → Nombre para mostrar
 *     data-package-price→ Precio como número (ej: 3.07)
 */

const TEBEX_TOKEN = '122zw-32dedc44cd231c3d4194a1851298af8ee373895e';
const TEBEX_API = 'https://headless.tebex.io/api';

// ─── Estado ──────────────────────────────────────────────────────────────────

let carrito = (() => {
    try {
        return JSON.parse(localStorage.getItem('sealy_carrito') || '[]');
    } catch {
        return [];
    }
})();
let jugador = localStorage.getItem('sealy_jugador') || '';

function guardarCarrito() {
    localStorage.setItem('sealy_carrito', JSON.stringify(carrito));
}

function itemEnCarrito(id) {
    return carrito.find(item => item.id === id);
}

// ─── Acciones del carrito ─────────────────────────────────────────────────────

function agregarAlCarrito(paquete) {
    if (!itemEnCarrito(paquete.id)) {
        carrito.push({...paquete, cantidad: 1});
        guardarCarrito();
    }
    actualizarUI();
    abrirPanel();
}

function quitarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    actualizarUI();
}

// ─── UI ───────────────────────────────────────────────────────────────────────

function actualizarBadge() {
    const badge = document.getElementById('carrito-badge');
    const btnCarrito = document.querySelector('.tienda-cabecera__btn-carrito');
    const total = carrito.reduce((s, i) => s + i.cantidad, 0);
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    }
    if (btnCarrito) {
        btnCarrito.classList.toggle('tienda-cabecera__btn-carrito--activo', total > 0);
    }
}

function actualizarDorado() {
    document.querySelectorAll('.tienda-paquetes__tarjeta').forEach(tarjeta => {
        const id = tarjeta.dataset.packageId;
        const btn = tarjeta.querySelector('.tienda-paquetes__boton');
        if (id && itemEnCarrito(id)) {
            tarjeta.classList.add('tienda-paquetes__tarjeta--en-carrito');
            if (btn) btn.innerHTML = 'En Carrito';
        } else {
            tarjeta.classList.remove('tienda-paquetes__tarjeta--en-carrito');
            if (btn) btn.textContent = 'Comprar';
        }
    });
}

function renderizarItems() {
    const lista = document.getElementById('carrito-lista');
    const vacio = document.getElementById('carrito-vacio');
    const pie = document.querySelector('.carrito-panel__pie');
    if (!lista) return;

    if (carrito.length === 0) {
        lista.innerHTML = '';
        if (vacio) vacio.style.display = 'flex';
        if (pie) pie.style.display = 'none';
        return;
    }

    if (vacio) vacio.style.display = 'none';
    if (pie) pie.style.display = 'flex';

    let total = 0;
    lista.innerHTML = carrito.map(item => {
        total += item.precio * item.cantidad;
        return `
            <div class="carrito-item">
                <div class="carrito-item__img">
                    <img src="${item.img}" alt="${item.nombre}">
                </div>
                <div class="carrito-item__info">
                    <span class="carrito-item__nombre">${item.nombre}</span>
                    <span class="carrito-item__precio">$${item.precio.toFixed(2)}</span>
                </div>
                <button class="carrito-item__eliminar" data-id="${item.id}" title="Eliminar" aria-label="Eliminar ${item.nombre}">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
        `;
    }).join('');

    // Event delegation: un solo listener en el contenedor, no uno por botón
    lista.onclick = function (e) {
        const btn = e.target.closest('.carrito-item__eliminar');
        if (btn) quitarDelCarrito(btn.dataset.id);
    };

    const totalEl = document.getElementById('carrito-total');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    const aviso = document.getElementById('carrito-jugador-aviso');
    if (aviso) aviso.style.display = jugador ? 'none' : 'flex';
}

function actualizarUI() {
    actualizarBadge();
    actualizarDorado();
    renderizarItems();
}

// ─── Panel deslizable ─────────────────────────────────────────────────────────

function ajustarTamanoPanel() {
    const panel = document.getElementById('carrito-panel');
    if (!panel) return;
    const zoom = parseFloat(document.documentElement.style.zoom) || 1;
    if (zoom !== 1 && zoom > 0) {
        panel.style.width = window.innerWidth + 'px';
        panel.style.height = window.innerHeight + 'px';
    } else {
        panel.style.width = '';
        panel.style.height = '';
    }
}

function abrirPanel() {
    ajustarTamanoPanel();
    document.getElementById('carrito-panel')?.classList.add('abierto');
    document.body.classList.add('carrito-abierto');
}

function cerrarPanel() {
    document.getElementById('carrito-panel')?.classList.remove('abierto');
    document.body.classList.remove('carrito-abierto');
}

// ─── Tebex API ────────────────────────────────────────────────────────────────

function pagoCometado() {
    carrito = [];
    guardarCarrito();
    actualizarUI();
    cerrarPanel();
}

function mostrarModal(id) {
    cerrarPanel();
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');

    const cerrar = () => {
        modal.classList.remove('visible');
        modal.setAttribute('aria-hidden', 'true');
    };

    const btnCerrar = modal.querySelector('[id$="-cerrar"]');
    const overlay = modal.querySelector('.modal-jugador__overlay');
    if (btnCerrar) btnCerrar.onclick = cerrar;
    if (overlay) overlay.onclick = cerrar;
}

function mostrarModalJugador() {
    mostrarModal('modal-jugador');
    const modal = document.getElementById('modal-jugador');
    if (!modal) return;
    const btnCerrar = modal.querySelector('[id$="-cerrar"]');
    if (btnCerrar) {
        btnCerrar.onclick = () => {
            modal.classList.remove('visible');
            modal.setAttribute('aria-hidden', 'true');
            document.querySelector('.tienda-jugador__entrada')?.focus();
            document.getElementById('tienda-jugador')?.scrollIntoView({behavior: 'smooth', block: 'center'});
        };
    }
}

async function irAlPago() {
    if (!jugador) {
        mostrarModalJugador();
        return;
    }
    if (carrito.length === 0) return;

    // Abrir popup inmediatamente dentro del gesto del usuario (evita bloqueo del navegador)
    const popupW = 900, popupH = 700;
    const popupL = Math.round((screen.width - popupW) / 2);
    const popupT = Math.round((screen.height - popupH) / 2);
    const popup = window.open('about:blank', 'tebex_checkout',
        `width=${popupW},height=${popupH},left=${popupL},top=${popupT},resizable=yes,scrollbars=yes`);

    const btn = document.getElementById('btn-checkout');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
    }

    try {
        // 1. Crear cesta
        const resCesta = await fetch(`${TEBEX_API}/accounts/${TEBEX_TOKEN}/baskets`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                complete_url: window.location.origin + window.location.pathname + '?pago=ok',
                cancel_url: window.location.href,
                username: jugador
            })
        });
        if (!resCesta.ok) throw new Error('No se pudo crear la cesta en Tebex');
        const {data: cesta} = await resCesta.json();

        // 2. Agregar cada paquete
        for (const item of carrito) {
            const res = await fetch(`${TEBEX_API}/baskets/${cesta.ident}/packages`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({package_id: Number(item.id), quantity: 1, type: 'single'})
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                console.error('Tebex error al agregar paquete:', errBody);
                throw new Error(`Error al agregar "${item.nombre}"`);
            }
        }

        // 3. Obtener URL de checkout y navegar el popup
        const resFinal = await fetch(`${TEBEX_API}/accounts/${TEBEX_TOKEN}/baskets/${cesta.ident}`);
        if (!resFinal.ok) throw new Error('No se pudo obtener la cesta actualizada');
        const {data: cestaFinal} = await resFinal.json();
        const urlPago = cestaFinal.links?.checkout;
        if (!urlPago) throw new Error('No se encontró la URL de pago');

        if (popup && !popup.closed) {
            popup.location.href = urlPago;
        } else {
            // Fallback si el popup fue bloqueado por el navegador
            window.location.href = urlPago;
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock-fill"></i> Ir al Pago';
        }

    } catch (err) {
        console.error('Error en checkout Tebex:', err);
        if (popup && !popup.closed) popup.close();
        mostrarModal('modal-error-pago');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock-fill"></i> Ir al Pago';
        }
    }
}

async function cargarTopDonador() {
    try {
        const res = await fetch('https://api.sealyworld.com/top-donador');
        if (!res.ok) return;
        const {nombre} = await res.json();
        if (!nombre) return;

        const elNombre = document.querySelector('.tienda-donador__nombre');
        const elAvatar = document.querySelector('.tienda-donador__avatar-ring img');
        if (elNombre) elNombre.textContent = nombre;
        if (elAvatar) elAvatar.src = `https://vzge.me/bust/512/${encodeURIComponent(nombre)}.png?no=shadow,cape,ears`;
    } catch {
        // Mantiene el fallback estático del HTML
    }
}

// ─── Jugador ──────────────────────────────────────────────────────────────────

const AVATAR_DEFAULT = 'src/img/sealyworld_alex_head.webp';

function validarNombreMinecraft(nombre) {
    if (nombre.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
    if (nombre.length > 16) return 'El nombre no puede tener más de 16 caracteres.';
    if (!/^[a-zA-Z0-9_]+$/.test(nombre)) return 'Solo se permiten letras, números y guión bajo (_).';
    return null;
}

async function actualizarAvatar(nombre) {
    const avatar = document.querySelector('.tienda-jugador__icono img');
    if (!avatar) return;

    // Mostrar skin al instante sin esperar la verificación
    avatar.src = `https://vzge.me/face/512/${encodeURIComponent(nombre)}.png?no=shadow,ears,cape`;

    // Verificar en segundo plano si la cuenta existe
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(nombre)}`, {
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) avatar.src = AVATAR_DEFAULT;
    } catch {
        avatar.src = AVATAR_DEFAULT;
    }
}

function establecerJugador(nombre) {
    const error = validarNombreMinecraft(nombre);
    const input = document.querySelector('.tienda-jugador__entrada');

    if (error) {
        if (input) {
            input.style.borderColor = '#ff6b6b';
            input.title = error;
            input.placeholder = error;
            setTimeout(() => {
                input.style.borderColor = '';
                input.placeholder = 'Ej: SteveXD';
                input.title = '';
            }, 3000);
        }
        return;
    }

    jugador = nombre;
    localStorage.setItem('sealy_jugador', jugador);

    if (input) {
        input.style.borderColor = '#6bff9e';
        setTimeout(() => {
            input.style.borderColor = '';
        }, 1500);
    }

    actualizarAvatar(jugador);
    renderizarItems();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {

    // Si esta ventana es el popup de retorno tras el pago, muestra confirmación y cierra
    if (new URLSearchParams(window.location.search).get('pago') === 'ok') {
        document.documentElement.style.cssText = 'margin:0;padding:0;height:100%;overflow:hidden;';
        document.body.style.cssText = 'margin:0;padding:0;height:100%;overflow:hidden;';
        document.body.innerHTML = `
            <div style="
                position:fixed; inset:0; z-index:999999;
                display:flex; flex-direction:column;
                align-items:center; justify-content:center; gap:16px;
                background:#0d0d0d; font-family:'Karla',sans-serif; color:#fff;
                text-align:center; padding:24px;
                pointer-events:all;
            ">
                <div style="font-size:80px">✅</div>
                <h2 style="margin:0;font-size:42px;font-weight:800;">¡Pago completado!</h2>
                <p style="margin:0;color:rgba(255,255,255,0.55);font-size:22px;line-height:1.6;">
                    Tus Zafiros serán entregados en breve.<br>Esta ventana se cerrará automáticamente.
                </p>
            </div>`;
        if (window.opener && !window.opener.closed) {
            window.opener.pagoCometado?.();
        }
        setTimeout(() => window.close(), 3000);
        return;
    }

    // Restaurar nombre de jugador guardado
    const inputNombre = document.querySelector('.tienda-jugador__entrada');
    if (inputNombre && jugador) {
        inputNombre.value = jugador;
        actualizarAvatar(jugador);
    }

    // Guardar nombre al hacer clic en el botón o Enter
    const btnCheck = document.querySelector('.tienda-jugador__boton-check');
    if (btnCheck && inputNombre) {
        // Bloquear caracteres inválidos al escribir
        inputNombre.addEventListener('input', function () {
            const pos = this.selectionStart;
            const limpio = this.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16);
            if (this.value !== limpio) {
                this.value = limpio;
                this.setSelectionRange(pos - 1, pos - 1);
            }
        });

        const submit = () => {
            const val = inputNombre.value.trim();
            if (val) establecerJugador(val);
        };
        btnCheck.addEventListener('click', submit);
        inputNombre.addEventListener('keydown', e => {
            if (e.key === 'Enter') submit();
        });
    }

    // Botón carrito → abrir panel
    document.querySelector('.tienda-cabecera__btn-carrito')?.addEventListener('click', function (e) {
        e.preventDefault();
        abrirPanel();
    });

    // Cerrar panel
    document.getElementById('carrito-cerrar')?.addEventListener('click', cerrarPanel);
    document.querySelector('.carrito-panel__overlay')?.addEventListener('click', cerrarPanel);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') cerrarPanel();
    });

    // Ir al pago
    document.getElementById('btn-checkout')?.addEventListener('click', irAlPago);

    // Botones "Comprar" → agregar/quitar del carrito
    document.querySelectorAll('.tienda-paquetes__boton').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const tarjeta = this.closest('.tienda-paquetes__tarjeta');
            if (!tarjeta) return;
            const id = tarjeta.dataset.packageId;
            if (!id || id === 'REEMPLAZAR_ID') {
                console.warn('Tebex: data-package-id no configurado en la tarjeta.');
                return;
            }
            if (itemEnCarrito(id)) {
                quitarDelCarrito(id);
            } else {
                agregarAlCarrito({
                    id: id,
                    nombre: tarjeta.dataset.packageName || `Paquete ${id}`,
                    precio: parseFloat(tarjeta.dataset.packagePrice) || 0,
                    img: tarjeta.querySelector('.tienda-paquetes__icono img')?.src || ''
                });
            }
        });
    });

    // Ajustar panel al zoom de la página.
    // Se retrasa 150ms para ejecutar DESPUÉS del debounce de fitPageToScreen (100ms en main.js).
    window.addEventListener('load', () => setTimeout(ajustarTamanoPanel, 200));
    window.addEventListener('resize', () => setTimeout(ajustarTamanoPanel, 150));

    // Cargar top donador desde Tebex
    cargarTopDonador();

    // Render inicial
    actualizarUI();
});
