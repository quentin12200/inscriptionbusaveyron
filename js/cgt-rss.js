/**
 * Affiche les dernières actualités de cgt.fr
 * Usage : <div class="cgt-rss" data-limit="5"></div>
 *
 * Sources essayées dans l'ordre :
 * 1. /api/rss (fonction Vercel qui lit le flux de cgt.fr)
 * 2. le flux cgt.fr lu par le navigateur via le relais allorigins
 * 3. le flux cgt.fr converti par rss2json
 * 4. les articles de cgt.fr repris par Google Actualités, via rss2json
 * 5. si rien ne répond : cartes de liens utiles vers cgt.fr
 *
 * Diagnostic : ajouter ?actus=debug à l'adresse de la page pour voir quelle source échoue
 */
const CGT_FEED = 'https://www.cgt.fr/rss.xml';
const GOOGLE_NEWS_FEED = 'https://news.google.com/rss/search?q=site:cgt.fr&hl=fr&gl=FR&ceid=FR:fr';

const LIENS_UTILES = [
    { title: 'Toutes les actualités de la CGT', description: 'Les derniers articles, communiqués et appels à mobilisation.', link: 'https://www.cgt.fr/actualites' },
    { title: 'Tout augmente, sauf nos salaires', description: 'Pancartes et visuels à télécharger pour la mobilisation.', link: 'https://www.cgt.fr/toutaugmente' },
    { title: 'Simuler un budget de progrès social', description: 'Où va l\'argent ? Découvre les propositions de la CGT.', link: 'https://www.cgt.fr/budget' },
    { title: 'La carte des mobilisations', description: 'Toutes les manifestations et rassemblements près de chez toi.', link: 'https://carte.cgt.fr' },
    { title: 'Rejoindre la CGT', description: 'Se protéger, s\'informer et agir ensemble sur son lieu de travail.', link: 'https://www.cgt.fr/rejoindre' }
];

function texteSeul(html) {
    // DOMParser n'exécute aucun script et ne charge aucune image
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    const texte = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    return texte.length > 220 ? texte.slice(0, 217).trimEnd() + '…' : texte;
}

function lireJson(url) {
    return fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined })
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        });
}

function depuisApi(limit) {
    return lireJson('/api/rss?limit=' + encodeURIComponent(limit))
        .then(function(data) {
            if (!data.items || !data.items.length) throw new Error('flux vide');
            return data.items;
        });
}

// Lit le flux XML de cgt.fr dans le navigateur (le relais contourne le blocage CORS)
function depuisAllOrigins(limit) {
    return fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(CGT_FEED), { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined })
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.text();
        })
        .then(function(xml) {
            const doc = new DOMParser().parseFromString(xml, 'text/xml');
            const items = Array.from(doc.querySelectorAll('item')).slice(0, limit).map(function(item) {
                const champ = function(nom) {
                    const el = item.getElementsByTagName(nom)[0];
                    return el ? el.textContent.trim() : '';
                };
                return { title: champ('title'), link: champ('link'), date: champ('pubDate'), description: texteSeul(champ('description')) };
            }).filter(function(item) { return item.title && /^https?:\/\//i.test(item.link); });
            if (!items.length) throw new Error('flux vide ou illisible');
            return items;
        });
}

function depuisRss2json(feed, limit, depuisGoogle) {
    return lireJson('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed))
        .then(function(data) {
            if (data.status !== 'ok' || !data.items || !data.items.length) throw new Error(data.message || 'flux vide');
            return data.items.slice(0, limit).map(function(item) {
                return {
                    // Google ajoute « - Nom du site » à la fin du titre
                    title: depuisGoogle ? item.title.replace(/\s+-\s+[^-]*$/, '') : item.title,
                    link: item.link,
                    date: item.pubDate ? item.pubDate.replace(' ', 'T') + 'Z' : '',
                    description: depuisGoogle ? '' : texteSeul(item.description)
                };
            });
        });
}

const SOURCES = [
    { nom: 'Fonction Vercel /api/rss', lire: depuisApi },
    { nom: 'cgt.fr via allorigins', lire: depuisAllOrigins },
    { nom: 'cgt.fr via rss2json', lire: function(limit) { return depuisRss2json(CGT_FEED, limit, false); } },
    { nom: 'Google Actualités via rss2json', lire: function(limit) { return depuisRss2json(GOOGLE_NEWS_FEED, limit, true); } }
];

// Essaie chaque source l'une après l'autre et note les échecs pour le diagnostic
function chargerActus(limit, journal) {
    return SOURCES.reduce(function(promesse, source) {
        return promesse.catch(function() {
            return source.lire(limit).then(function(items) {
                journal.push('✅ ' + source.nom + ' : ' + items.length + ' articles');
                return items;
            }, function(erreur) {
                journal.push('❌ ' + source.nom + ' : ' + erreur.message);
                throw erreur;
            });
        });
    }, Promise.reject(new Error('départ')));
}

function afficher(container, items) {
    const list = document.createElement('ul');
    list.className = 'rss-list';
    items.forEach(function(item) {
        if (!/^https?:\/\//i.test(item.link)) return;
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

        const journal = [];
        const debug = new URLSearchParams(location.search).get('actus') === 'debug';
        function montrerJournal() {
            if (!debug) return;
            const pre = document.createElement('pre');
            pre.className = 'rss-debug';
            pre.textContent = journal.join('\n');
            container.appendChild(pre);
        }

        chargerActus(limit, journal)
            .then(function(items) { afficher(container, items); montrerJournal(); })
            .catch(function() { afficher(container, LIENS_UTILES.slice(0, Math.max(limit, 3))); montrerJournal(); });
    });
});
