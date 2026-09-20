/**
 * Perfil de jugador (perfil.html)
 * Lee ?u=<nombre> y muestra las estadísticas del jugador por modalidad.
 *
 * Usa exactamente la misma generación determinista que tops.js (periodo
 * "permanente") para que los números coincidan con los tops.
 * Cuando exista el backend, reemplaza buildBoard() por un fetch a tu API.
 */
(function () {
    "use strict";

    const mount = document.getElementById('pf-content');
    if (!mount) return;

    /* ---------------- rng determinista (idéntico a tops.js) ---------------- */
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

    /* ---------------- datos (idéntico a tops.js) ---------------- */
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

    const fmt = function (n) { return n.toLocaleString('es-ES'); };
    const kd = function (n) { return n.toFixed(2); };

    const CATS = {
        kills:     {label: "Kills",     value: function (p) { return p.kills; },     valueFmt: function (p) { return fmt(p.kills); }},
        muertes:   {label: "Muertes",   value: function (p) { return p.deaths; },    valueFmt: function (p) { return fmt(p.deaths); }},
        dinero:    {label: "Dinero",    value: function (p) { return p.dinero; },    valueFmt: function (p) { return "$" + fmt(p.dinero); }},
        victorias: {label: "Victorias", value: function (p) { return p.victorias; }, valueFmt: function (p) { return fmt(p.victorias); }},
        nivel:     {label: "Nivel",     value: function (p) { return p.nivel; },     valueFmt: function (p) { return String(p.nivel); }}
    };

    const MODE_CATS = {
        practice:  ["kills", "muertes", "victorias"],
        survival:  ["dinero", "nivel", "kills"],
        ponygames: ["victorias", "nivel", "dinero"],
        ffa:       ["kills", "muertes", "victorias", "nivel"]
    };

    /* ---------------- actividad reciente (eventos / partidas) ---------------- */
    /* ffa y survival muestran eventos; practice y ponygames muestran partidas. */
    const EVENT_NAMES = {
        ffa:      ["FFA Showdown", "Caos en la Arena", "Última Foca en Pie", "Duelo Abierto", "Tormenta PvP", "Reyes del FFA", "Coliseo Salvaje", "Battle Royale"],
        survival: ["Survival Royale", "Caza del Kraken", "Asalto al Búnker", "Noche de Mobs", "Guerra de Clanes", "Conquista Marina", "Saqueo del Arrecife", "Resistencia Final"]
    };
    const MATCH_MAPS = {
        practice:  ["Arena 1v1", "NoDebuff", "Sumo", "Gapple", "BuildUHC", "Combo", "Boxing", "Bridge"],
        ponygames: ["SkyWars", "BedWars", "TNT Run", "El Cazador", "Parkour", "Spleef", "Lucky Block", "OneInTheChamber"]
    };
    /* ---------------- redes sociales (solo las vinculadas) ---------------- */
    /* Redes que un jugador puede vincular. Iconos SVG inline (Simple Icons). */
    const SOCIALS = [
        {id: "twitch",  label: "Twitch",  href: function (n) { return "https://twitch.tv/" + n; },
            path: "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"},
        {id: "kick",    label: "Kick",    href: function (n) { return "https://kick.com/" + n; },
            path: "M1.333 0h8v5.333H12V2.667h2.667V0h8v8h-2.667v2.667h-2.666v2.666h2.666V16H20v2.667h2.667V24h-8v-2.667H12v-2.666H9.333V24h-8z"},
        {id: "tiktok",  label: "TikTok",  href: function (n) { return "https://www.tiktok.com/@" + n; },
            path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"},
        {id: "spotify", label: "Spotify", href: function (n) { return "https://open.spotify.com/user/" + n; },
            path: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0m5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02m1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.481.78.241 1.2m.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3"},
        {id: "youtube", label: "YouTube", href: function (n) { return "https://www.youtube.com/@" + n; },
            path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z"}
    ];

    /** Redes vinculadas del jugador (determinista). */
    function buildSocials() {
        const r = mulberry32(hashStr(realName + "|social") + 11);
        return SOCIALS.filter(function () { return r() > 0.45; });
    }

    /** Fecha dd/mm/aaaa restando N días a hoy. */
    function dateAgo(daysAgo) {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return dd + '/' + mm + '/' + d.getFullYear();
    }

    /** 4 actividades recientes deterministas para el jugador en una modalidad. */
    function buildRecent(modeId) {
        const isEvent = modeId === "ffa" || modeId === "survival";
        const pool = isEvent ? EVENT_NAMES[modeId] : MATCH_MAPS[modeId];
        const r = mulberry32(hashStr(realName + "|recent|" + modeId) + 7);
        const used = [];
        const items = [];
        let daysAgo = 0;
        for (let i = 0; i < 4; i++) {
            let idx = Math.floor(r() * pool.length);
            let guard = 0;
            while (used.indexOf(idx) !== -1 && guard < pool.length) { idx = (idx + 1) % pool.length; guard++; }
            used.push(idx);

            const kills = Math.max(0, Math.round(2 + r() * 26));
            const deaths = Math.max(1, Math.round(1 + r() * 9));
            const win = r() > 0.45;
            daysAgo += 1 + Math.floor(r() * 6); // más antigua cada tarjeta
            const item = {
                name: pool[idx],
                kills: kills,
                kd: kills / deaths,
                ago: dateAgo(daysAgo),
                win: win
            };
            if (isEvent) {
                const players = 16 + Math.round(r() * 48);
                item.players = players;
                item.pos = win ? 1 + Math.floor(r() * 3) : 4 + Math.floor(r() * Math.max(1, players - 4));
                item.points = 200 + Math.round(r() * 1800);
                item.win = item.pos <= 3; // eventos: solo top 3 es victoria
            } else if (modeId === "practice") {
                // Duelo 1v1: rival distinto al jugador.
                const foes = NAMES.filter(function (n) { return n !== realName; });
                item.opponent = foes[Math.floor(r() * foes.length)];
            } else if (modeId === "ponygames") {
                // Party games: puesto final, minijuegos ganados y puntos.
                const players = 8 + Math.round(r() * 16); // 8–24
                item.players = players;
                item.pos = 1 + Math.floor(r() * players);
                item.win = item.pos <= 3; // podio = victoria
                item.miniWins = Math.round(r() * 8);
                item.points = 200 + Math.round(r() * 2300);
            }
            items.push(item);
        }
        return {isEvent: isEvent, items: items};
    }

    /* permanente => escala 1 (mismos números que la vista por defecto del top) */
    function buildBoard(modeId) {
        return NAMES.map(function (n) {
            const r = mulberry32(hashStr(n + "|" + modeId) + 3);
            const skill = 0.25 + r() * 0.95;
            const kills = Math.max(1, Math.round((40 + r() * 860) * skill * (0.85 + r() * 0.3)));
            const deaths = Math.max(1, Math.round(kills / (0.7 + skill * 1.7) + r() * 4));
            const partidas = Math.max(1, Math.round(20 + r() * 480));
            const victorias = Math.round(partidas * (0.12 + skill * 0.5 * r()));
            const winrate = partidas ? Math.round(victorias / partidas * 100) : 0;
            const nivel = Math.max(1, Math.round(5 + skill * 90 + r() * 10));
            const xp = Math.round(nivel * nivel * 120 + r() * 6000);
            const dinero = Math.max(0, Math.round((1000 + r() * 60000) * (0.4 + skill)));
            return {
                name: n, kills: kills, deaths: deaths, kd: kills / deaths,
                partidas: partidas, victorias: victorias, winrate: winrate,
                nivel: nivel, xp: xp, dinero: dinero
            };
        });
    }

    /** Puesto del jugador en una categoría dentro de una modalidad. */
    function rankOf(board, catId, name) {
        const arr = board.slice().sort(function (a, b) {
            return CATS[catId].value(b) - CATS[catId].value(a) || b.kills - a.kills;
        });
        return arr.findIndex(function (x) { return x.name === name; }) + 1;
    }

    /* ---------------- helpers DOM ---------------- */
    function el(tag, cls, html) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (html != null) node.innerHTML = html;
        return node;
    }

    function avatarBody(name) {
        const img = el('img', 'pf__skin-img');
        img.alt = name;
        img.width = 160;
        img.height = 340;
        img.loading = 'eager';
        // Skin completa (cuerpo) del jugador.
        img.src = 'https://mc-heads.net/body/' + encodeURIComponent(name) + '/160';
        return img;
    }

    /* ---------------- jugador desde la URL ---------------- */
    const params = new URLSearchParams(location.search);
    const wanted = (params.get('u') || '').trim();
    const realName = NAMES.find(function (n) { return n.toLowerCase() === wanted.toLowerCase(); });

    /* ---------------- no encontrado ---------------- */
    if (!realName) {
        const nf = el('div', 'pf__notfound');
        nf.appendChild(el('div', 'pf__notfound-icon', '<i class="bi bi-person-exclamation"></i>'));
        nf.appendChild(el('h1', 'pf__notfound-title', 'Jugador no encontrado'));
        nf.appendChild(el('p', 'pf__notfound-text',
            wanted ? 'No existe ningún jugador llamado “' + wanted + '” en SealyWorld.' : 'No se indicó ningún jugador.'));
        const back = el('a', 'pf__notfound-btn', '<i class="bi bi-trophy-fill"></i> Ver Tops');
        back.href = 'tops.html';
        nf.appendChild(back);
        mount.appendChild(nf);
        return;
    }

    document.title = realName + ' | Perfil · Sealy World';

    /* ---------------- estadísticas por modalidad + agregados ---------------- */
    const perMode = MODES.map(function (m) {
        const board = buildBoard(m.id);
        const me = board.find(function (p) { return p.name === realName; });
        const cats = MODE_CATS[m.id].map(function (catId) {
            return {label: CATS[catId].label, value: CATS[catId].valueFmt(me), rank: rankOf(board, catId, realName)};
        });
        const bestRank = cats.reduce(function (min, c) { return Math.min(min, c.rank); }, Infinity);
        return {mode: m, board: board, me: me, cats: cats, bestRank: bestRank};
    });

    let totKills = 0, totDeaths = 0, totVict = 0, totPart = 0, totDinero = 0, maxNivel = 0;
    perMode.forEach(function (d) {
        totKills += d.me.kills;
        totDeaths += d.me.deaths;
        totVict += d.me.victorias;
        totPart += d.me.partidas;
        totDinero += d.me.dinero;
        maxNivel = Math.max(maxNivel, d.me.nivel);
    });
    const globalKD = totDeaths ? totKills / totDeaths : totKills;
    const globalWin = totPart ? Math.round(totVict / totPart * 100) : 0;
    const bestOverall = perMode.reduce(function (min, d) { return Math.min(min, d.bestRank); }, Infinity);

    /* ---------------- render ---------------- */

    const layout = el('div', 'pf__layout');

    // Izquierda: nombre arriba + skin completa + redes
    const side = el('aside', 'pf__side');
    side.appendChild(el('h1', 'pf__name', realName));
    side.appendChild(el('p', 'pf__sub', 'Jugador de SealyWorld'));

    const skin = el('div', 'pf__skin');
    skin.appendChild(avatarBody(realName));
    side.appendChild(skin);

    const linkedSocials = buildSocials();
    if (linkedSocials.length) {
        const socials = el('div', 'pf__socials');
        linkedSocials.forEach(function (s) {
            const a = el('a', 'pf__social pf__social--' + s.id);
            a.href = s.href(realName);
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.title = s.label;
            a.setAttribute('aria-label', s.label);
            a.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + s.path + '"/></svg>';
            socials.appendChild(a);
        });
        side.appendChild(socials);
    }

    layout.appendChild(side);

    // Derecha: resumen + pestañas + panel (tablas)
    const main = el('div', 'pf__main');

    const heroStats = el('div', 'pf__hero-stats');
    [
        {label: 'Kills', value: fmt(totKills)},
        {label: 'Muertes', value: fmt(totDeaths)},
        {label: 'K/D', value: kd(globalKD)},
        {label: 'Victorias', value: fmt(totVict)},
        {label: 'Dinero', value: '$' + fmt(totDinero)},
        {label: 'Win rate', value: globalWin + '%'}
    ].forEach(function (s) {
        const it = el('div', 'pf__hstat');
        it.appendChild(el('span', 'pf__hstat-num', s.value));
        it.appendChild(el('span', 'pf__hstat-label', s.label));
        heroStats.appendChild(it);
    });

    // Modalidad: pestañas + panel (una a la vez, con sus stats en grande)
    const tabs = el('div', 'pf__tabs');
    const panel = el('div', 'pf__panel');
    const recentWrap = el('section', 'pf__recent');
    let activeMode = MODES[0].id;

    /** Columna de un jugador en un duelo: cabeza arriba + nombre, ganador resaltado. */
    function duelSide(name, isWinner) {
        const side = el('div', 'pf__rcard-duel-side' + (isWinner ? ' is-win' : ''));
        const head = el('img', 'pf__rcard-duel-head');
        head.alt = name;
        head.width = 46;
        head.height = 46;
        head.loading = 'lazy';
        head.src = 'https://mc-heads.net/avatar/' + encodeURIComponent(name) + '/46';
        side.appendChild(head);
        side.appendChild(el('span', 'pf__rcard-duel-name', name));
        return side;
    }

    /** Bloque de puesto: cabeza del jugador + nº de puesto y nº de jugadores. */
    function placeBlock(pos, players, isWin) {
        const place = el('div', 'pf__rcard-place');

        const headWrap = el('div', 'pf__rcard-place-head' + (isWin ? ' is-win' : ''));
        const img = el('img', 'pf__rcard-duel-head');
        img.alt = realName;
        img.width = 46;
        img.height = 46;
        img.loading = 'lazy';
        img.src = 'https://mc-heads.net/avatar/' + encodeURIComponent(realName) + '/46';
        headWrap.appendChild(img);
        place.appendChild(headWrap);

        const info = el('div', 'pf__rcard-place-info');
        info.appendChild(el('span', 'pf__rcard-place-num',
            '#' + pos + '<span class="pf__rcard-place-total">/' + players + '</span>'));
        info.appendChild(el('span', 'pf__rcard-place-lbl', 'Puesto'));
        place.appendChild(info);
        return place;
    }

    /** Tarjetas de actividad reciente segun la modalidad activa. */
    function renderRecent(d) {
        const data = buildRecent(d.mode.id);
        recentWrap.innerHTML = '';

        const isPractice = d.mode.id === "practice";
        const isPony = d.mode.id === "ponygames";
        const isFFA = d.mode.id === "ffa";

        const grid = el('div', 'pf__recent-grid');
        data.items.forEach(function (it) {
            const card = el('article', 'pf__rcard ' + (it.win ? 'pf__rcard--win' : 'pf__rcard--loss'));

            const top = el('div', 'pf__rcard-top');
            top.appendChild(el('span', 'pf__rcard-name', isPony ? 'Partida' : isFFA ? 'Koth' : it.name));
            top.appendChild(el('span', 'pf__rcard-badge', it.win ? 'Victoria' : 'Derrota'));
            card.appendChild(top);

            if (isPractice) {
                // Duelo 1v1: jugador vs oponente, enfrentados y centrados.
                const duel = el('div', 'pf__rcard-duel');
                duel.appendChild(duelSide(realName, it.win));
                duel.appendChild(el('span', 'pf__rcard-duel-vs', 'VS'));
                duel.appendChild(duelSide(it.opponent, !it.win));
                card.appendChild(duel);
            } else if (isPony) {
                // Party games: cabeza del jugador + puesto final.
                card.appendChild(placeBlock(it.pos, it.players, it.win));
            } else if (data.isEvent) {
                // Eventos (Koth / Survival): puesto a la izquierda y puntos a la derecha.
                const row = el('div', 'pf__rcard-ffa');
                row.appendChild(placeBlock(it.pos, it.players, it.win));

                const pts = el('div', 'pf__rcard-stat pf__rcard-ffa-pts');
                pts.appendChild(el('span', 'pf__rcard-stat-num', fmt(it.points)));
                pts.appendChild(el('span', 'pf__rcard-stat-lbl', 'Puntos'));
                row.appendChild(pts);

                card.appendChild(row);
            }

            card.appendChild(el('div', 'pf__rcard-foot pf__rcard-foot--center',
                '<i class="bi bi-clock-history"></i> ' + it.ago));

            grid.appendChild(card);
        });
        recentWrap.appendChild(grid);
    }

    function renderPanel() {
        const d = perMode.find(function (x) { return x.mode.id === activeMode; });
        const me = d.me;
        panel.innerHTML = '';

        const head = el('div', 'pf__panel-head');
        head.appendChild(el('span', 'pf__panel-title', d.mode.label));
        head.appendChild(el('span', 'pf__panel-best', '<i class="bi bi-trophy-fill"></i> Mejor puesto #' + d.bestRank));
        panel.appendChild(head);

        const stats = [
            {label: 'Kills', value: fmt(me.kills), cat: 'kills'},
            {label: 'Muertes', value: fmt(me.deaths), cat: 'muertes'},
            {label: 'K/D', value: kd(me.kd)},
            {label: 'Victorias', value: fmt(me.victorias), cat: 'victorias'},
            {label: 'Win rate', value: me.winrate + '%'},
            {label: 'Partidas', value: fmt(me.partidas)},
            {label: 'Dinero', value: '$' + fmt(me.dinero), cat: 'dinero'},
            {label: 'Nivel', value: String(me.nivel), cat: 'nivel'}
        ];

        const grid = el('div', 'pf__panel-grid');
        stats.forEach(function (s) {
            const tile = el('div', 'pf__pstat');
            const top = el('div', 'pf__pstat-top');
            top.appendChild(el('span', 'pf__pstat-num', s.value));
            if (s.cat) top.appendChild(el('span', 'pf__pstat-rank', '#' + rankOf(d.board, s.cat, realName)));
            tile.appendChild(top);
            tile.appendChild(el('span', 'pf__pstat-label', s.label));
            grid.appendChild(tile);
        });
        panel.appendChild(grid);

        renderRecent(d);
    }

    MODES.forEach(function (m) {
        const btn = el('button', 'pf__tab' + (m.id === activeMode ? ' active' : ''), m.label);
        btn.type = 'button';
        btn.addEventListener('click', function () {
            if (activeMode === m.id) return;
            activeMode = m.id;
            tabs.querySelectorAll('.pf__tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            renderPanel();
        });
        tabs.appendChild(btn);
    });

    main.appendChild(tabs);
    main.appendChild(heroStats);
    main.appendChild(panel);
    renderPanel();

    layout.appendChild(main);
    mount.appendChild(layout);
    mount.appendChild(recentWrap);
})();
