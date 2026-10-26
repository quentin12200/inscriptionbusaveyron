/**
 * Animations de la mobilisation du 5 novembre 2026 :
 * compte à rebours, bus qui roule vers la ville choisie, apparitions au défilement
 * (le bandeau de slogans est en CSS pur)
 */
(function() {
    const animationsReduites = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Compte à rebours ----------
    function compteARebours(bloc) {
        const cible = new Date(bloc.dataset.cible).getTime();
        const champs = {};
        bloc.querySelectorAll('[data-unite]').forEach(function(el) {
            champs[el.dataset.unite] = el;
        });

        function ecrire(el, valeur) {
            const texte = String(valeur).padStart(2, '0');
            if (el.textContent === texte) return;
            el.textContent = texte;
            if (!animationsReduites) {
                el.classList.remove('car-tic');
                void el.offsetWidth; // relance l'animation
                el.classList.add('car-tic');
            }
        }

        function maj() {
            const reste = cible - Date.now();
            if (reste <= 0) {
                clearInterval(minuterie);
                bloc.classList.add('car-termine');
                bloc.innerHTML = reste > -6 * 3600 * 1000
                    ? '<p class="car-jour-j">C\'est aujourd\'hui ! Tous à Rodez, 14h30, Jardin public</p>'
                    : '<p class="car-jour-j">Merci à toutes et à tous pour la mobilisation du 5 novembre !</p>';
                return;
            }
            const s = Math.floor(reste / 1000);
            ecrire(champs.jours, Math.floor(s / 86400));
            ecrire(champs.heures, Math.floor(s / 3600) % 24);
            ecrire(champs.minutes, Math.floor(s / 60) % 60);
            ecrire(champs.secondes, s % 60);
        }

        const minuterie = setInterval(maj, 1000);
        maj();
    }

    // ---------- Bus qui roule jusqu'à l'onglet choisi ----------
    function busAnime(route) {
        const bus = route.querySelector('.bus-anime');
        const onglets = Array.from(document.querySelectorAll('.ul-tab'));
        if (!bus || !onglets.length) return;
        let position = -bus.getBoundingClientRect().width;
        let arret;

        function cibleX() {
            const actif = onglets.find(function(t) { return t.getAttribute('aria-selected') === 'true'; }) || onglets[0];
            const largeurRoute = route.clientWidth;
            const largeurBus = bus.getBoundingClientRect().width;
            const zoneRoute = route.getBoundingClientRect();
            const zoneOnglet = actif.getBoundingClientRect();
            const empiles = onglets[0].getBoundingClientRect().left === onglets[onglets.length - 1].getBoundingClientRect().left;
            let x;
            if (empiles) {
                // Onglets les uns sous les autres (mobile) : position selon le rang
                x = onglets.indexOf(actif) / (onglets.length - 1) * (largeurRoute - largeurBus);
            } else {
                x = zoneOnglet.left - zoneRoute.left + zoneOnglet.width / 2 - largeurBus / 2;
            }
            return Math.max(0, Math.min(x, largeurRoute - largeurBus));
        }

        function rouler() {
            const x = cibleX();
            const distance = Math.abs(x - position);
            const duree = animationsReduites ? 0 : Math.min(1.6, 0.5 + distance / 500);
            bus.style.transitionDuration = duree + 's';
            bus.style.transform = 'translateX(' + x + 'px)';
            position = x;
            if (duree) {
                route.classList.add('en-route');
                clearTimeout(arret);
                arret = setTimeout(function() { route.classList.remove('en-route'); }, duree * 1000);
            }
        }

        new MutationObserver(rouler).observe(document.querySelector('.ul-tabs'), {
            attributes: true, subtree: true, attributeFilter: ['aria-selected']
        });
        window.addEventListener('resize', function() {
            bus.style.transitionDuration = '0s';
            position = cibleX();
            bus.style.transform = 'translateX(' + position + 'px)';
        });

        // Le bus entre en scène quand la route devient visible
        bus.style.transform = 'translateX(' + position + 'px)';
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(function(entrees) {
                if (entrees[0].isIntersecting) { io.disconnect(); rouler(); }
            }, { threshold: 0.6 });
            io.observe(route);
        } else {
            rouler();
        }
    }

    // ---------- Apparitions au défilement ----------
    function apparitions() {
        const elements = document.querySelectorAll('.titre-section, .sous-titre, .ul-tabs, .carte, .cta-section, footer');
        if (animationsReduites || !('IntersectionObserver' in window)) return;
        const io = new IntersectionObserver(function(entrees) {
            entrees.forEach(function(entree) {
                if (entree.isIntersecting) {
                    entree.target.classList.add('visible');
                    io.unobserve(entree.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        elements.forEach(function(el) {
            el.classList.add('apparition');
            io.observe(el);
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.compte-a-rebours').forEach(compteARebours);
        document.querySelectorAll('.route').forEach(busAnime);
        apparitions();
    });
})();
