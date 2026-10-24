/**
 * Affiche les dernières actualités de cgt.fr
 * Usage : <div class="cgt-rss" data-limit="5"></div>
 *
 * 1. /api/rss (fonction Vercel qui lit le flux de cgt.fr)
 * 2. secours : articles de cgt.fr via Google Actualités, convertis par rss2json
 * 3. si rien ne répond : cartes de liens utiles vers cgt.fr
 */
const GOOGLE_NEWS_FEED = 'https://news.google.com/rss/search?q=site:cgt.fr&hl=fr&gl=FR&ceid=FR:fr';

const LIENS_UTILES = [
    { title: 'Toutes les actualités de la CGT', description: 'Les derniers articles, communiqués et appels à mobilisation.', link: 'https://www.cgt.fr/actualites' },
    { title: 'Tout augmente, sauf nos salaires', description: 'Pancartes et visuels à télécharger pour la mobilisation.', link: 'https://www.cgt.fr/toutaugmente' },
    { title: 'Simuler un budget de progrès social', description: 'Où va l\'argent ? Découvre les propositions de la CGT.', link: 'https://www.cgt.fr/budget' },
    { title: 'La carte des mobilisations', description: 'Toutes les manifestations et rassemblements près de chez toi.', link: 'https://carte.cgt.fr' },
    { title: 'Rejoindre la CGT', description: 'Se protéger, s\'informer et agir ensemble sur son lieu de travail.', link: 'https://www.cgt.fr/rejoindre' }
];

function depuisApi(limit) {
    return fetch('/api/rss?limit=' + encodeURIComponent(limit))
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(function(data) {
            if (!data.items || !data.items.length) throw new Error('Flux vide');
            return data.items;
        });
}

function depuisGoogleNews(limit) {
    return fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(GOOGLE_NEWS_FEED))
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(function(data) {
            if (data.status !== 'ok' || !data.items || !data.items.length) throw new Error('Flux vide');
            return data.items.slice(0, limit).map(function(item) {
                return {
                    // Google ajoute « - Nom du site » à la fin du titre
                    title: item.title.replace(/\s+-\s+[^-]*$/, ''),
                    link: item.link,
                    date: item.pubDate ? item.pubDate.replace(' ', 'T') + 'Z' : '',
                    description: ''
                };
            });
        });
}

function afficher(container, items) {
    const list = document.createElement('ul');
    list.className = 'rss-list';
    items.forEach(function(item) {
        const li = document.createElement('li');
        li.className = 'rss-item';

        const link = document.createElement('a');
        link.href = item.link;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = item.title;
        li.appendChild(link);

        const date = new Date(item.date);
        if (item.date && !isNaN(date)) {
            const time = document.createElement('time');
            time.dateTime = date.toISOString();
            time.textContent = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            li.appendChild(time);
        }

        if (item.description) {
            const p = document.createElement('p');
            p.textContent = item.description;
            li.appendChild(p);
        }
        list.appendChild(li);
    });
    container.innerHTML = '';
    container.appendChild(list);
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.cgt-rss').forEach(function(container) {
        const limit = parseInt(container.getAttribute('data-limit'), 10) || 6;

        container.innerHTML = '<p class="rss-message">Chargement des actualités…</p>';

        depuisApi(limit)
            .catch(function() { return depuisGoogleNews(limit); })
            .then(function(items) { afficher(container, items); })
            .catch(function() { afficher(container, LIENS_UTILES.slice(0, Math.max(limit, 3))); });
    });
});
