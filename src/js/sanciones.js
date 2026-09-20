(function () {
    "use strict";

    const root = document.getElementById('sanciones-app');
    if (!root) return;

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

    const NAMES = ["xNeptuno", "CoralReaper", "AquaPyro", "FrostBYTE", "DonPepe_", "KrakenZ", "myclass", "SealMaster", "PixelPirata", "TsunamiX",
        "MangoLoco", "DarkSquid", "BluFin", "GhostReef", "ElTiburon", "ZafiroKing", "MarinaXx", "OctoPunch", "ReefRunner", "SaltyDog",
        "WavyJota", "CoralCrush", "DeepDiver", "Valeria_", "TacoGod99", "TurboCaracol", "ShadowFin", "MrBubbles", "NovaShark", "PvPandita",
        "iCalamar", "BrisaMar", "Kelpie", "RaySting", "AbyssoX", "Marlin_", "DuneSurfer", "PolloFrito", "Anchoa", "Maremoto",
        "SirenaXD", "Barracuda7", "NeoPez", "Caribe", "Plankton_", "Mareas", "Triton99", "ConchaFina", "Remolino", "Faro_",
        "Hackerman", "LagSwitch", "SpammerX", "ToxicReef", "GriefKid", "BotFarmer", "RuleBreaker", "ExploitR", "FlyHaxx", "KillAuraZ"];

    const STAFF = ["AdminSeal", "ModCoral", "HelperMarea", "OwnerNeptuno", "ModAtlantis", "AdminPerla", "ModTriton", "HelperConcha"];

    const TYPES = [
        {id: "ban",       label: "Ban",       icon: "bi-hammer",            weight: 5},
        {id: "warn",      label: "Warn",      icon: "bi-exclamation-triangle-fill", weight: 5},
        {id: "mute",      label: "Mute",      icon: "bi-mic-mute-fill",     weight: 4},
        {id: "blacklist", label: "Blacklist", icon: "bi-slash-circle-fill", weight: 2}
    ];
    const TYPE_MAP = {};
    TYPES.forEach(function (t) { TYPE_MAP[t.id] = t; });

    const REASONS = {
        ban: ["Uso de hacks (KillAura)", "Uso de cliente no permitido", "Fly hack en zona PvP",
              "Bug abuse / duplicación", "Anuncio de otro servidor", "Combat log reiterado",
              "X-Ray detectado", "Evadir sanción previa", "Estafa de items",
              "Reincidencia en uso de hacks", "Uso de macros prohibidas", "Cuenta comprometida",
              "Uso reiterado de modificaciones no permitidas en el cliente de juego"],
        warn: ["Spam en el chat", "Lenguaje ofensivo leve", "Provocar a otros jugadores", "Ignorar al staff",
               "Construcción inapropiada", "Uso excesivo de mayúsculas", "Publicidad sin permiso",
               "Comportamiento inadecuado de forma reiterada en el chat global del servidor"],
        mute: ["Insultos en el chat", "Spam reiterado", "Toxicidad constante", "Flood de mensajes",
               "Discusión fuera de lugar", "Lenguaje inapropiado", "Acoso a otro jugador",
               "Acoso continuo y lenguaje ofensivo hacia varios jugadores del servidor"],
        blacklist: ["Estafa grave confirmada", "Doxxing a otro usuario", "Reincidencia tras múltiples bans",
                    "Suplantación de staff", "Distribución de contenido ilegal", "Amenazas graves",
                    "Suplantación de identidad de un miembro del staff con fines de estafa"]
    };

    const DURATIONS = {
        ban: ["7 días", "30 días", "3 días", "14 días", "1 día", "Permanente"],
        warn: ["Permanente"],
        mute: ["1 hora", "12 horas", "1 día", "3 días", "7 días"],
        blacklist: ["Permanente"]
    };

    function buildTypeBag() {
        const bag = [];
        TYPES.forEach(function (t) {
            for (let i = 0; i < t.weight; i++) bag.push(t.id);
        });
        return bag;
    }

    const TOTAL = 84;
    const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

    function buildSanctions() {
        const bag = buildTypeBag();
        const list = [];

        const now = new Date(2026, 5, 13);
        for (let i = 0; i < TOTAL; i++) {
            const r = mulberry32(hashStr("sancion|" + i) + 11);
            const name = NAMES[Math.floor(r() * NAMES.length)];
            const type = bag[Math.floor(r() * bag.length)];
            const staff = STAFF[Math.floor(r() * STAFF.length)];
            const reasons = REASONS[type];
            const reason = reasons[Math.floor(r() * reasons.length)];
            const durs = DURATIONS[type];
            const duracion = durs[Math.floor(r() * durs.length)];

            const diasAtras = Math.floor((i * 2) + r() * 4);
            const d = new Date(now.getTime() - diasAtras * 86400000);
            const fecha = d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear();

            list.push({
                id: i + 1,
                name: name,
                type: type,
                staff: staff,
                reason: reason,
                duracion: duracion,
                fecha: fecha,
                ts: d.getTime()
            });
        }

        list.sort(function (a, b) { return b.ts - a.ts; });
        return list;
    }

    const profileUrl = function (name) { return 'perfil.html?u=' + encodeURIComponent(name); };

    function el(tag, cls, html) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (html != null) node.innerHTML = html;
        return node;
    }

    const PAGE_SIZE = 6;
    const ALL = buildSanctions();
    const state = {type: "todas", query: "", page: 1};

    const gridEl = document.getElementById('sn-grid');
    const tabsEl = document.getElementById('sn-tabs');
    const pagerEl = document.getElementById('sn-pager');
    const searchEl = document.getElementById('sn-search');
    const searchWrap = searchEl.closest('.lb__search');
    const searchResultsEl = document.getElementById('sn-search-results');

    function filtered() {
        const q = state.query.trim().toLowerCase();
        return ALL.filter(function (s) {
            if (state.type !== "todas" && s.type !== state.type) return false;
            if (q && s.name.toLowerCase().indexOf(q) === -1) return false;
            return true;
        });
    }

    function renderTabs() {
        const items = [{id: "todas", label: "Todas"}].concat(TYPES);
        items.forEach(function (t) {
            const btn = el('button', 'lb__tab sn__tab--' + t.id + (state.type === t.id ? ' active' : ''),
                t.label);
            btn.type = 'button';
            btn.addEventListener('click', function () {
                if (state.type === t.id) return;
                state.type = t.id;
                state.page = 1;
                tabsEl.querySelectorAll('.lb__tab').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                render();
            });
            tabsEl.appendChild(btn);
        });

        let debounce;
        searchEl.addEventListener('input', function () {
            state.query = searchEl.value;
            renderSearch();
            clearTimeout(debounce);
            debounce = setTimeout(function () {
                state.page = 1;
                render();
            }, 120);
        });
        searchEl.addEventListener('focus', function () {
            if (state.query.trim()) renderSearch();
        });
    }

    document.addEventListener('click', function (e) {
        if (searchWrap && !searchWrap.contains(e.target)) searchWrap.classList.remove('open');
    });

    function sanctionCard(s, num) {
        const type = TYPE_MAP[s.type];
        const card = el('a', 'lb__pcard sn__card sn__card--' + s.type);
        card.href = profileUrl(s.name);

        card.appendChild(el('div', 'lb__medal lb__medal--num sn__medal', String(num)));

        card.appendChild(avatarImg(s.name, 'lb__ava sn__ava'));

        const player = el('div', 'sn__player sn__cell--player');
        player.appendChild(el('p', 'sn__name', s.name));
        player.appendChild(el('span', 'sn__staff', 'Sancionado por ' + s.staff));
        card.appendChild(player);

        const tipo = el('div', 'sn__col sn__cell--tipo');
        tipo.appendChild(el('span', 'sn__label', 'Tipo de Sanción'));
        tipo.appendChild(el('div', 'sn__col-val', type.label));
        card.appendChild(tipo);

        const reason = el('div', 'sn__col sn__cell--motivo');
        reason.appendChild(el('span', 'sn__label', 'Motivo'));
        const reasonText = el('div', 'sn__reason-text', s.reason);
        reasonText.title = s.reason;
        reason.appendChild(reasonText);
        card.appendChild(reason);

        const tiempo = el('div', 'sn__col sn__cell--tiempo');
        tiempo.appendChild(el('span', 'sn__label', 'Tiempo'));
        tiempo.appendChild(el('div', 'sn__col-val', s.duracion || '—'));
        card.appendChild(tiempo);

        const date = el('div', 'sn__col sn__cell--fecha');
        date.appendChild(el('span', 'sn__label', 'Fecha'));
        date.appendChild(el('div', 'sn__col-val', s.fecha));
        card.appendChild(date);

        return card;
    }

    function renderSearch() {
        const q = state.query.trim().toLowerCase();
        searchResultsEl.innerHTML = '';
        if (!q) { searchWrap.classList.remove('open'); return; }

        const seen = {};
        const matches = [];
        ALL.forEach(function (s) {
            if (seen[s.name]) return;
            if (s.name.toLowerCase().indexOf(q) === -1) return;
            seen[s.name] = 1;
            matches.push(s.name);
        });
        matches.sort(function (a, b) {
            return a.toLowerCase().indexOf(q) - b.toLowerCase().indexOf(q) || a.localeCompare(b);
        });

        if (matches.length) {
            matches.slice(0, 6).forEach(function (n) {
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

    function renderPager(totalPages) {
        pagerEl.innerHTML = '';
        if (totalPages <= 1) return;

        function pageBtn(label, page, opts) {
            opts = opts || {};
            const b = el('button', 'sn__page' + (opts.active ? ' active' : '') + (opts.cls ? ' ' + opts.cls : ''), label);
            b.type = 'button';
            if (opts.disabled) {
                b.disabled = true;
            } else {
                b.addEventListener('click', function () {
                    state.page = page;
                    render();
                    const sec = document.getElementById('sanciones');
                    if (sec) sec.scrollIntoView({behavior: 'smooth', block: 'start'});
                });
            }
            return b;
        }

        const ARROW_L = '<svg class="sn__arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        const ARROW_R = '<svg class="sn__arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        pagerEl.appendChild(pageBtn(ARROW_L, state.page - 1,
            {cls: 'sn__page--arrow', disabled: state.page === 1}));

        const win = 1;
        let start = Math.max(1, state.page - win);
        let end = Math.min(totalPages, state.page + win);
        if (state.page <= 2) end = Math.min(totalPages, 3);
        if (state.page >= totalPages - 1) start = Math.max(1, totalPages - 2);

        if (start > 1) {
            pagerEl.appendChild(pageBtn('1', 1, {active: state.page === 1}));
            if (start > 2) pagerEl.appendChild(el('span', 'sn__ellipsis', '…'));
        }
        for (let p = start; p <= end; p++) {
            pagerEl.appendChild(pageBtn(String(p), p, {active: p === state.page}));
        }
        if (end < totalPages) {
            if (end < totalPages - 1) pagerEl.appendChild(el('span', 'sn__ellipsis', '…'));
            pagerEl.appendChild(pageBtn(String(totalPages), totalPages, {active: state.page === totalPages}));
        }

        pagerEl.appendChild(pageBtn(ARROW_R, state.page + 1,
            {cls: 'sn__page--arrow', disabled: state.page === totalPages}));
    }

    function render() {
        const rows = filtered();
        const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        if (state.page > totalPages) state.page = totalPages;

        const start = (state.page - 1) * PAGE_SIZE;
        const pageRows = rows.slice(start, start + PAGE_SIZE);

        gridEl.innerHTML = '';
        if (!pageRows.length) {
            gridEl.appendChild(el('div', 'sn__empty',
                '<i class="bi bi-shield-check"></i><p>No hay sanciones para este filtro</p>'));
        } else {
            pageRows.forEach(function (s, i) {
                const card = sanctionCard(s, start + i + 1);
                card.style.animationDelay = (i * 0.03) + 's';
                gridEl.appendChild(card);
            });
        }

        renderPager(totalPages);
    }

    renderTabs();
    render();
})();
