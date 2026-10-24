/**
 * Affiche les dernières actualités de cgt.fr (via /api/rss)
 * Usage : <div class="cgt-rss" data-limit="5"></div>
 */
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.cgt-rss').forEach(function(container) {
        const limit = container.getAttribute('data-limit') || 6;
        const fallback = '<p class="rss-message">Les actualités ne peuvent pas être chargées pour le moment. ' +
            'Retrouvez-les sur <a href="https://www.cgt.fr/actualites" target="_blank" rel="noopener">cgt.fr</a>.</p>';

        container.innerHTML = '<p class="rss-message">Chargement des actualités…</p>';

        fetch('/api/rss?limit=' + encodeURIComponent(limit))
            .then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function(data) {
                if (!data.items || !data.items.length) throw new Error('Flux vide');
                const list = document.createElement('ul');
                list.className = 'rss-list';
                data.items.forEach(function(item) {
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
            })
            .catch(function() {
                container.innerHTML = fallback;
            });
    });
});
