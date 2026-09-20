/**
 * Tops (tops.html)
 * Clasificación de jugadores: podio + lista + buscador.
 * Cada modalidad tiene sus propias categorías de ranking (Kills, Muertes,
 * Dinero, Victorias, Nivel...) — no todas comparten las mismas.
 *
 * Los datos son generados de forma determinista (mismo nombre + modalidad =>
 * mismas estadísticas) a la espera de conectarse al backend real del servidor.
 * Sustituye buildBoard() por un fetch a tu API cuando esté disponible.
 */
(function () {
    "use strict";

    const root = document.getElementById('tops-app');
    if (!root) return;

    /* ---------------- rng determinista ---------------- */
    function hashStr(s) {
        let h = 2166136261;
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function mulberry32(a) {
        return function () {
            a |= 0;
            a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    /* ---------------- avatar pixelado de respaldo ---------------- */
    const avaCache = {};

    function pixelAvatar(name) {
        if (avaCache[name]) return avaCache[name];
        const rnd = mulberry32(hashStr(name) + 7);
        const N = 8, px = 9, c = document.createElement('canvas');
        c.width = c.height = N * px;
        const ctx = c.getContext('2d');
        const skinTones = ['#e8b78f', '#d99a6c', '#c98a58', '#a9744a', '#8a5a3a', '#f0c9a0', '#caa17a'];
        const hairTones = ['#3a2a1c', '#1f1812', '#5a3a22', '#7a4a26', '#222', '#4a3520', '#86603a', '#2b1d12'];
        const skin = skinTones[Math.floor(rnd() * skinTones.length)];
        const hair = hairTones[Math.floor(rnd() * hairTones.length)];
        const grid = [];
        for (let y = 0; y < N; y++) {
            grid[y] = [];
            for (let x = 0; x < N / 2; x++) {
                let col = skin;
                if (y === 0) col = hair;
                else if (y === 1) col = rnd() > 0.2 ? hair : skin;
                else if (y <= 2 && x >= N / 2 - 2) col = rnd() > 0.4 ? hair : skin;
                else if (rnd() > 0.86) col = hair;
                grid[y][x] = col;
            }
        }
        for (let y = 0; y < N; y++) for (let x = 0; x < N / 2; x++) {
            ctx.fillStyle = grid[y][x];
            ctx.fillRect(x * px, y * px, px, px);
            ctx.fillRect((N - 1 - x) * px, y * px, px, px);
        }
        ctx.fillStyle = '#f4f4f4';
        ctx.fillRect(2 * px, 3 * px, px, px);
        ctx.fillRect(5 * px, 3 * px, px, px);
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(2 * px, 3 * px, px, Math.ceil(px * 0.6));
        ctx.fillRect(5 * px, 3 * px, px, Math.ceil(px * 0.6));
        const url = c.toDataURL();
        avaCache[name] = url;
        return url;
    }

    /** <img> con avatar de mc-heads y respaldo pixelado si falla la carga. */
    function avatarImg(name, cls) {
        const img = document.createElement('img');
        img.className = cls;
        img.alt = name;
        img.loading = 'lazy';
        img.width = 80;
        img.height = 80;
        img.src = 'https://mc-heads.net/avatar/' + encodeURIComponent(name) + '/80';
        img.addEventListener('error', function () {
            if (img.dataset.fb) return;
            img.dataset.fb = '1';
            img.src = pixelAvatar(name);
        });
        return img;
    }

    /* ---------------- formato ---------------- */
    const fmt = function (n) { return n.toLocaleString('es-ES'); };
    const kd = function (n) { return n.toFixed(2); };

    /* ---------------- datos ---------------- */
    const NAMES = ["xNeptuno", "CoralReaper", "AquaPyro", "FrostBYTE", "DonPepe_", "KrakenZ", "myclass", "SealMaster", "PixelPirata", "TsunamiX",
        "MangoLoco", "DarkSquid", "BluFin", "GhostReef", "ElTiburon", "ZafiroKing", "MarinaXx", "OctoPunch", "ReefRunner", "SaltyDog",
        "WavyJota", "CoralCrush", "DeepDiver", "Valeria_", "TacoGod99", "TurboCaracol", "ShadowFin", "MrBubbles", "NovaShark", "PvPandita",
        "iCalamar", "BrisaMar", "Kelpie", "RaySting", "AbyssoX", "Marlin_", "DuneSurfer", "PolloFrito", "Anchoa", "Maremoto",
        "SirenaXD", "Barracuda7", "NeoPez", "Caribe", "Plankton_", "Mareas", "Triton99", "ConchaFina", "Remolino", "Faro_"];

    const MODES = [
        {id: "practice", label: "Practice"},
        {id: "survival", label: "Survival"},
        {id: "ponygames", label: "PonyGames"},
        {id: "ffa", label: "FFA Dynamic"}
    ];

    /**
     * Categorías de ranking. Cada una define:
     *  - label:    texto del botón y de la columna.
     *  - value:    valor numérico usado para ordenar (descendente).
     *  - valueFmt: cómo se muestra el número grande.
     *  - unit:     etiqueta pequeña debajo del número en la lista.
     *  - sub:      {label, fmt} para la "pastilla" secundaria de la derecha.
     *  - meta:     línea pequeña bajo el nombre del jugador.
     */
    const CATS = {
        kills:     {label: "Kills",     value: function (p) { return p.kills; },     valueFmt: function (p) { return fmt(p.kills); },     unit: "kills",     sub: {label: "K/D", fmt: function (p) { return kd(p.kd); }},        meta: function (p) { return fmt(p.deaths) + " muertes"; }},
        muertes:   {label: "Muertes",   value: function (p) { return p.deaths; },    valueFmt: function (p) { return fmt(p.deaths); },    unit: "muertes",   sub: {label: "K/D", fmt: function (p) { return kd(p.kd); }},        meta: function (p) { return fmt(p.kills) + " kills"; }},
        dinero:    {label: "Dinero",    value: function (p) { return p.dinero; },    valueFmt: function (p) { return "$" + fmt(p.dinero); }, unit: "monedas", sub: {label: "Nivel", fmt: function (p) { return String(p.nivel); }}, meta: function (p) { return "Nivel " + p.nivel; }},
        victorias: {label: "Victorias", value: function (p) { return p.victorias; }, valueFmt: function (p) { return fmt(p.victorias); }, unit: "victorias", sub: {label: "Win", fmt: function (p) { return p.winrate + "%"; }},   meta: function (p) { return fmt(p.partidas) + " partidas"; }},
        nivel:     {label: "Nivel",     value: function (p) { return p.nivel; },     valueFmt: function (p) { return String(p.nivel); },  unit: "nivel",     sub: {label: "XP", fmt: function (p) { return fmt(p.xp); }},        meta: function (p) { return fmt(p.xp) + " XP"; }}
    };

    /* Categorías disponibles por modalidad — no todas comparten las mismas. */
    const MODE_CATS = {
        practice:  ["kills", "muertes", "victorias"],
        survival:  ["dinero", "nivel", "kills"],
        ponygames: ["victorias", "nivel", "dinero"],
        ffa:       ["kills", "muertes", "victorias", "nivel"]
    };

    /* Periodos (filtro de tiempo). El factor escala las estadísticas acumulables. */
    const TIMES = [
        {id: "permanente", label: "Permanente"},
        {id: "mensual", label: "Mensual"},
        {id: "semanal", label: "Semanal"},
        {id: "diario", label: "Diario"}
    ];
    const TIME_SCALE = {permanente: 1, mensual: 0.34, semanal: 0.11, diario: 0.022};

    function buildBoard(modeId, timeId) {
        const scale = TIME_SCALE[timeId] || 1;
        return NAMES.map(function (n) {
            const r = mulberry32(hashStr(n + "|" + modeId) + 3);
            const skill = 0.25 + r() * 0.95;
            const kills = Math.max(1, Math.round((40 + r() * 860) * skill * (0.85 + r() * 0.3) * scale));
            const deaths = Math.max(1, Math.round(kills / (0.7 + skill * 1.7) + r() * 4));
            const partidas = Math.max(1, Math.round((20 + r() * 480) * scale));
            const victorias = Math.round(partidas * (0.12 + skill * 0.5 * r()));
            const winrate = partidas ? Math.round(victorias / partidas * 100) : 0;
            const nivel = Math.max(1, Math.round(5 + skill * 90 + r() * 10)); // nivel es persistente
            const xp = Math.round(nivel * nivel * 120 + r() * 6000);
            const dinero = Math.max(0, Math.round((1000 + r() * 60000) * (0.4 + skill) * scale));
            return {
                name: n, kills: kills, deaths: deaths, kd: kills / deaths,
                partidas: partidas, victorias: victorias, winrate: winrate,
                nivel: nivel, xp: xp, dinero: dinero
            };
        });
    }

    /** Ordena por la categoría activa y reasigna el puesto (rank). */
    function rankBoard(board, cat) {
        const c = CATS[cat];
        board.sort(function (a, b) { return c.value(b) - c.value(a) || b.kills - a.kills; });
        board.forEach(function (p, i) { p.rank = i + 1; });
        return board;
    }

    const modeLabel = function (id) { return MODES.find(function (m) { return m.id === id; }).label; };
    const profileUrl = function (name) { return 'perfil.html?u=' + encodeURIComponent(name); };

    /* ---------------- helpers de DOM ---------------- */
    function el(tag, cls, html) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (html != null) node.innerHTML = html;
        return node;
    }

    const CHEVRON = '<svg class="lb__select-chevron" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    /* ---------------- estado ---------------- */
    const state = {mode: "practice", cat: MODE_CATS.practice[0], time: "permanente", query: ""};

    /* refs a contenedores */
    const gridEl = document.getElementById('lb-grid');
    const tabsEl = document.getElementById('lb-tabs');
    const filtersEl = document.getElementById('lb-filters');
    const searchEl = document.getElementById('lb-search');
    const searchWrap = searchEl.closest('.lb__search');
    const searchResultsEl = document.getElementById('lb-search-results');

    /* ---------------- render: pestañas de modalidad ---------------- */
    function renderTabs() {
        MODES.forEach(function (m) {
            const btn = el('button', 'lb__tab' + (state.mode === m.id ? ' active' : ''),
                '<span class="lb__dot"></span>' + m.label);
            btn.type = 'button';
            btn.addEventListener('click', function () {
                if (state.mode === m.id) return;
                state.mode = m.id;
                // Si la categoría actual no existe en la nueva modalidad, usar la primera.
                if (MODE_CATS[m.id].indexOf(state.cat) === -1) state.cat = MODE_CATS[m.id][0];
                tabsEl.querySelectorAll('.lb__tab').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                renderFilters();
                renderBoard();
            });
            tabsEl.appendChild(btn);
        });

        let debounce;
        searchEl.addEventListener('input', function () {
            state.query = searchEl.value;
            renderSearch();
            clearTimeout(debounce);
            debounce = setTimeout(renderBoard, 120);
        });
        searchEl.addEventListener('focus', function () {
            if (state.query.trim()) renderSearch();
        });
    }

    /* ---------------- dropdown personalizado ---------------- */
    function closeAllSelects() {
        document.querySelectorAll('.lb__select.open').forEach(function (s) {
            s.classList.remove('open');
            s.querySelector('.lb__select-btn').setAttribute('aria-expanded', 'false');
        });
    }
    document.addEventListener('click', closeAllSelects);
    document.addEventListener('click', function (e) {
        if (searchWrap && !searchWrap.contains(e.target)) searchWrap.classList.remove('open');
    });

    /**
     * Construye un desplegable. items: [{id,label}]. iconCls: clase bootstrap-icons.
     * onSelect(id) se llama al elegir una opción distinta.
     */
    function buildDropdown(iconCls, items, currentId, onSelect) {
        const wrap = el('div', 'lb__select');

        const btn = el('button', 'lb__select-btn');
        btn.type = 'button';
        btn.setAttribute('aria-haspopup', 'listbox');
        btn.setAttribute('aria-expanded', 'false');
        const current = items.find(function (it) { return it.id === currentId; }) || items[0];
        btn.innerHTML = '<i class="bi ' + iconCls + ' lb__select-icon"></i>' +
            '<span class="lb__select-value">' + current.label + '</span>' + CHEVRON;
        const valEl = btn.querySelector('.lb__select-value');

        const menu = el('ul', 'lb__select-menu');
        menu.setAttribute('role', 'listbox');
        items.forEach(function (it) {
            const opt = el('li', 'lb__select-opt' + (it.id === currentId ? ' active' : ''), it.label);
            opt.setAttribute('role', 'option');
            opt.addEventListener('click', function (e) {
                e.stopPropagation();
                menu.querySelectorAll('.lb__select-opt').forEach(function (o) { o.classList.remove('active'); });
                opt.classList.add('active');
                valEl.textContent = it.label;
                closeAllSelects();
                onSelect(it.id);
            });
            menu.appendChild(opt);
        });

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = wrap.classList.contains('open');
            closeAllSelects();
            if (!isOpen) {
                wrap.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });

        wrap.appendChild(btn);
        wrap.appendChild(menu);
        return wrap;
    }

    /* ---------------- render: filtros (tipo de top + periodo) ---------------- */
    function renderFilters() {
        filtersEl.innerHTML = '';

        const catItems = MODE_CATS[state.mode].map(function (id) {
            return {id: id, label: CATS[id].label};
        });
        filtersEl.appendChild(buildDropdown('bi-trophy-fill', catItems, state.cat, function (id) {
            state.cat = id;
            renderBoard();
        }));

        filtersEl.appendChild(buildDropdown('bi-hourglass-split', TIMES, state.time, function (id) {
            state.time = id;
            renderBoard();
        }));
    }

    /* ---------------- render: tarjeta de jugador (compacta, horizontal) ---------------- */
    function playerCard(p, place, cat, highlight) {
        const card = el('a', 'lb__pcard lb__pcard--' + place + (highlight ? ' lb__pcard--highlight' : ''));
        card.href = profileUrl(p.name);
        const medalCls = place === 1 ? 'lb__medal--gold'
            : place === 2 ? 'lb__medal--silver'
            : place === 3 ? 'lb__medal--bronze'
            : 'lb__medal--num';
        card.appendChild(el('div', 'lb__medal ' + medalCls, String(place)));
        card.appendChild(avatarImg(p.name, 'lb__ava'));

        const info = el('div', 'lb__pinfo');
        info.appendChild(el('p', 'lb__pname', p.name));
        info.appendChild(el('div', 'lb__pmeta', cat.sub.label + ' ' + cat.sub.fmt(p) + ' · ' + cat.meta(p)));
        card.appendChild(info);

        const val = el('div', 'lb__pval');
        val.appendChild(el('div', 'lb__pval-num', cat.valueFmt(p)));
        val.appendChild(el('div', 'lb__pval-label', cat.label));
        card.appendChild(val);
        return card;
    }

    /* ---------------- buscador: resultados desplegables bajo el input ---------------- */
    function renderSearch() {
        const q = state.query.trim().toLowerCase();
        searchResultsEl.innerHTML = '';
        if (!q) { searchWrap.classList.remove('open'); return; }

        const matches = NAMES.filter(function (n) {
            return n.toLowerCase().indexOf(q) !== -1;
        }).sort(function (a, b) {
            // Prioriza los que empiezan por la búsqueda.
            return a.toLowerCase().indexOf(q) - b.toLowerCase().indexOf(q) || a.localeCompare(b);
        }).slice(0, 6);

        if (matches.length) {
            matches.forEach(function (n) {
                const item = el('a', 'lb__sr-item');
                item.href = profileUrl(n);
                item.appendChild(avatarImg(n, 'lb__sr-ava'));
                item.appendChild(el('span', 'lb__sr-name', n));
                searchResultsEl.appendChild(item);
            });
        } else {
            searchResultsEl.appendChild(el('div', 'lb__sr-empty', 'No se encontró ese jugador'));
        }
        searchWrap.classList.add('open');
    }

    /* ---------------- render principal ---------------- */
    function renderBoard() {
        const cat = CATS[state.cat];
        const board = rankBoard(buildBoard(state.mode, state.time), state.cat);
        const top10 = board.slice(0, 10);

        const q = state.query.trim().toLowerCase();
        const searched = q
            ? (board.find(function (p) { return p.name.toLowerCase() === q; }) ||
               board.find(function (p) { return p.name.toLowerCase().indexOf(q) !== -1; }))
            : null;

        function matchKey(p) {
            return !!(q && p && (p.name.toLowerCase() === q || (searched && p.name === searched.name)));
        }

        /* Top 10 en tarjetas (1-5 columna izquierda, 6-10 derecha) */
        gridEl.innerHTML = '';
        top10.forEach(function (p, i) {
            const card = playerCard(p, p.rank, cat, matchKey(p));
            card.style.animationDelay = (i * 0.035) + 's';
            gridEl.appendChild(card);
        });
    }

    /* ---------------- init ---------------- */
    renderTabs();
    renderFilters();
    renderBoard();
})();
