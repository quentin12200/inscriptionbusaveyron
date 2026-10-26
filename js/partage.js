/**
 * Boutons de partage du compte à rebours sur les réseaux sociaux
 * Le message reprend le nombre de jours restants avant le 5 novembre
 */
document.addEventListener('DOMContentLoaded', function() {
    // On partage toujours la page d'inscription
    const url = 'https://inscriptioncgtbusaveyron.vercel.app/';

    function message(cible) {
        const jours = Math.floor((cible - Date.now()) / 86400000);
        let accroche;
        if (jours >= 2) accroche = '⏳ J-' + jours + ' avant la mobilisation du jeudi 5 novembre !';
        else if (jours === 1) accroche = '⏳ C\'est demain : mobilisation le jeudi 5 novembre !';
        else accroche = '📣 C\'est aujourd\'hui : tous mobilisés le 5 novembre !';
        return accroche + ' ✊ Manifestation à Rodez, 14h30, Jardin public. ' +
            'Inscris-toi au bus CGT au départ de Decazeville, Millau ou Villefranche-de-Rouergue :';
    }

    document.querySelectorAll('.partage').forEach(function(bloc) {
        const cible = new Date(bloc.dataset.cible).getTime();
        const confirmation = bloc.querySelector('.partage-confirmation');
        const natif = bloc.querySelector('.partage-natif');

        // Bouton « Partager » du téléphone (Messenger, Instagram, SMS…) quand il existe
        if (navigator.share) natif.hidden = false;

        function liens() {
            const texte = message(cible);
            const t = encodeURIComponent(texte);
            const u = encodeURIComponent(url);
            return {
                facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u,
                whatsapp: 'https://wa.me/?text=' + t + '%20' + u,
                x: 'https://x.com/intent/post?text=' + t + '&url=' + u,
                telegram: 'https://t.me/share/url?url=' + u + '&text=' + t,
                email: 'mailto:?subject=' + encodeURIComponent('Mobilisation du 5 novembre : inscris-toi au bus CGT') +
                    '&body=' + t + '%0A%0A' + u,
                texte: texte
            };
        }

        function confirmer(texte) {
            confirmation.textContent = texte;
            confirmation.classList.add('visible');
            clearTimeout(confirmer.minuterie);
            confirmer.minuterie = setTimeout(function() {
                confirmation.classList.remove('visible');
            }, 2500);
        }

        bloc.querySelectorAll('[data-reseau]').forEach(function(bouton) {
            bouton.addEventListener('click', function(e) {
                const reseau = bouton.dataset.reseau;
                const l = liens();
                if (reseau === 'natif') {
                    navigator.share({ title: document.title, text: l.texte, url: url }).catch(function() {});
                } else if (reseau === 'copier') {
                    const contenu = l.texte + ' ' + url;
                    const ok = function() { confirmer('Message copié ! Colle-le où tu veux.'); };
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(contenu).then(ok, function() { window.prompt('Copie ce message :', contenu); });
                    } else {
                        window.prompt('Copie ce message :', contenu);
                    }
                } else {
                    // Lien calculé au moment du clic pour avoir le bon nombre de jours
                    bouton.href = l[reseau];
                    if (reseau === 'facebook') {
                        e.preventDefault();
                        window.open(bouton.href, 'partage-facebook', 'width=600,height=500');
                    }
                }
            });
        });
    });
});
