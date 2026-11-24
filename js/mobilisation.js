/**
 * Reporte la configuration de js/config.js dans la page :
 * textes marqués data-mob, dates des comptes à rebours, consignes,
 * onglets et panneaux des bus.
 * Chargé avec « defer » : s'exécute une fois la page lue, avant les autres scripts.
 */
(function() {
    const m = MOBILISATION;
    const bus = Object.keys(m.bus);

    function liste(noms) {
        return noms.length > 1 ? noms.slice(0, -1).join(', ') + ' ou ' + noms[noms.length - 1] : noms.join('');
    }

    function texte(cle, valeur) {
        document.querySelectorAll('[data-mob="' + cle + '"]').forEach(function(el) { el.textContent = valeur; });
    }

    texte('jour', m.jour);
    texte('jour-court', m.jourCourt);
    texte('ville', m.ville);
    texte('lieu', m.lieu);
    texte('heure', m.heure);
    texte('type', m.type);
    texte('rendez-vous', m.ville + ', ' + m.heure + ', ' + m.lieu);
    texte('liste-bus', liste(bus.map(function(cle) { return m.bus[cle].nom; })));

    document.querySelectorAll('[data-cible]').forEach(function(el) { el.dataset.cible = m.date; });

    const consignes = document.querySelector('[data-mob="consignes"]');
    if (consignes) {
        consignes.replaceChildren.apply(consignes, m.consignes.map(function(c) {
            const li = document.createElement('li');
            li.textContent = c;
            return li;
        }));
    }

    // Onglets et panneaux des bus, construits à partir de la liste de config.js
    const onglets = document.querySelector('.ul-tabs');
    if (onglets) {
        const ancre = onglets.nextElementSibling;
        onglets.replaceChildren();
        bus.forEach(function(cle) {
            const nom = m.bus[cle].nom;
            const tab = document.createElement('button');
            tab.type = 'button';
            tab.className = 'ul-tab';
            tab.setAttribute('role', 'tab');
            tab.id = 'tab-' + cle;
            tab.setAttribute('aria-controls', 'panel-' + cle);
            tab.dataset.ul = cle;
            tab.innerHTML = '<i class="fas fa-bus" aria-hidden="true"></i><span></span><small>Départ en bus</small>';
            tab.querySelector('span').textContent = nom;
            onglets.appendChild(tab);

            const panel = document.createElement('section');
            panel.className = 'ul-panel carte';
            panel.setAttribute('role', 'tabpanel');
            panel.id = 'panel-' + cle;
            panel.setAttribute('aria-labelledby', 'tab-' + cle);
            panel.dataset.ul = cle;
            panel.hidden = true;
            panel.innerHTML =
                '<h2></h2>' +
                '<p class="ul-infos"><i class="fas fa-location-dot" aria-hidden="true"></i><span></span></p>' +
                '<p class="ul-places" hidden></p>' +
                '<div class="ul-form-container"></div>';
            panel.querySelector('h2').textContent = 'Bus au départ de ' + nom;
            onglets.parentNode.insertBefore(panel, ancre);
        });
    }
})();
