// Fonction serverless Vercel : récupère le flux RSS de cgt.fr et le renvoie en JSON
// (le navigateur ne peut pas lire cgt.fr directement à cause du CORS)
// Diagnostic : /api/rss?debug=1 indique les adresses essayées et leur réponse

const SITE = 'https://www.cgt.fr';
// Adresses essayées dans l'ordre si la page d'accueil n'annonce pas de flux
const CANDIDATE_FEEDS = [
  `${SITE}/rss.xml`,
  `${SITE}/actualites/rss.xml`,
  `${SITE}/rss`,
  `${SITE}/feed`
];
// Secours si cgt.fr refuse les requêtes des serveurs : articles de cgt.fr indexés par Google Actualités
const GOOGLE_NEWS_FEED = 'https://news.google.com/rss/search?q=site:cgt.fr&hl=fr&gl=FR&ceid=FR:fr';
const CACHE_MS = 30 * 60 * 1000;
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CGT-Aveyron-Inscriptions/1.0; +https://inscriptioncgtbusaveyron.vercel.app)',
  'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5'
};

let cache = { at: 0, data: null };

function decode(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? match[1] : '';
}

function parseFeed(xml, fromGoogleNews) {
  // RSS (<item>) ou Atom (<entry>)
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map(block => {
    let link = decode(tag(block, 'link'));
    if (!link) {
      const href = block.match(/<link[^>]*href="([^"]+)"/i);
      link = href ? href[1] : '';
    }
    if (link && link.startsWith('/')) link = SITE + link;
    let title = decode(tag(block, 'title'));
    let description = decode(tag(block, 'description') || tag(block, 'summary'));
    if (fromGoogleNews) {
      // Google ajoute « - Nom du site » au titre et met une liste de liens en description
      title = title.replace(/\s+-\s+[^-]*$/, '');
      description = '';
    }
    if (description.length > 220) description = description.slice(0, 217).trimEnd() + '…';
    return {
      title,
      link,
      date: decode(tag(block, 'pubDate') || tag(block, 'updated') || tag(block, 'dc:date')),
      description
    };
  }).filter(item => item.title && item.link);
}

async function get(url, log) {
  try {
    const response = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(8000) });
    log.push({ url, status: response.status });
    return response.ok ? await response.text() : null;
  } catch (e) {
    log.push({ url, error: e.message });
    return null;
  }
}

async function discoverFeeds(log) {
  const html = await get(SITE, log);
  if (!html) return [];
  return [...html.matchAll(/<link[^>]+type="application\/(?:rss|atom)\+xml"[^>]*>/gi)]
    .map(m => (m[0].match(/href="([^"]+)"/i) || [])[1])
    .filter(Boolean)
    .map(href => (href.startsWith('http') ? href : SITE + (href.startsWith('/') ? '' : '/') + href));
}

async function loadItems(log) {
  const feeds = [...new Set([...(await discoverFeeds(log)), ...CANDIDATE_FEEDS])];
  for (const url of feeds) {
    const xml = await get(url, log);
    const items = xml ? parseFeed(xml, false) : [];
    if (items.length) return { source: url, items };
  }
  const xml = await get(GOOGLE_NEWS_FEED, log);
  const items = xml ? parseFeed(xml, true) : [];
  return items.length ? { source: GOOGLE_NEWS_FEED, items } : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const debug = req.query.debug !== undefined;
  const log = [];
  if (debug || !cache.data || Date.now() - cache.at > CACHE_MS) {
    const data = await loadItems(log);
    if (data) cache = { at: Date.now(), data };
  }

  if (!cache.data) {
    return res.status(502).json({ error: 'Flux RSS de cgt.fr indisponible', tried: log });
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
  res.setHeader('Cache-Control', debug ? 'no-store' : 's-maxage=1800, stale-while-revalidate=3600');
  return res.status(200).json({
    source: cache.data.source,
    items: cache.data.items.slice(0, limit),
    ...(debug ? { tried: log } : {})
  });
};
