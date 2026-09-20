(function () {
    "use strict";

    const mount = document.getElementById('equipo-app');
    if (!mount) return;

    const RANKS = [
        {
            id: "owner", label: "Owner", color: "#ffd272",
            desc: "Fundadores del servidor",
            members: ["myclass", "xNeptuno", "SealMaster", "AquaKing", "OceanLord"]
        },
        {
            id: "admin", label: "Admin", color: "#f0654f",
            desc: "Administración general",
            members: ["FrostBYTE", "KrakenZ", "DonPepe_"]
        },
        {
            id: "partner", label: "Partner", color: "#c77ce0",
            desc: "Creadores de contenido aliados",
            members: ["PixelPirata", "ElTiburon", "TsunamiX", "Valeria_", "MarinaWaves"]
        }
    ];

    function el(tag, cls, html) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (html != null) node.innerHTML = html;
        return node;
    }

    function memberCard(name, rank, idx) {
        const card = el('a', 'eq__card' + (rank.id === 'owner' ? ' eq__card--owner' : ''));
        card.href = 'perfil.html?u=' + encodeURIComponent(name);
        card.style.animationDelay = (idx * 0.05) + 's';

        const head = el('img', 'eq__ava');
        head.alt = name;
        head.width = 58;
        head.height = 58;
        head.loading = 'lazy';
        head.src = 'https://mc-heads.net/avatar/' + encodeURIComponent(name) + '/58';
        card.appendChild(head);

        const info = el('div', 'eq__info');
        info.appendChild(el('span', 'eq__name', name));
        info.appendChild(el('span', 'eq__role', rank.label));
        card.appendChild(info);

        return card;
    }

    document.title = 'Equipo | Sealy World';

    RANKS.forEach(function (rank) {
        const sec = el('section', 'eq__section');
        sec.style.setProperty('--rk', rank.color);

        const label = el('div', 'eq__rank-label');
        label.appendChild(el('span', 'eq__rank-desc', rank.desc));
        label.appendChild(el('span', 'eq__rank-line'));
        sec.appendChild(label);

        const roster = el('div', 'eq__roster');
        rank.members.forEach(function (n, i) { roster.appendChild(memberCard(n, rank, i)); });
        sec.appendChild(roster);

        mount.appendChild(sec);
    });
})();
