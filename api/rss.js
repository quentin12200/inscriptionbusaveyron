// Fonction serverless Vercel : récupère le flux RSS de cgt.fr et le renvoie en JSON
// (le navigateur ne peut pas lire cgt.fr directement à cause du CORS)

const SITE = 'https://www.cgt.fr';
// Adresses essayées dans l'ordre si la page d'accueil n'annonce pas de flux
const CANDIDATE_FEEDS = [
  `${SITE}/rss.xml`,
  `${SITE}/actualites/rss.xml`,
  `${SITE}/rss`,
  `${SITE}/feed`
];
const CACHE_MS = 30 * 60 * 1000;

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

function parseFeed(xml) {
  // RSS (<item>) ou Atom (<entry>)
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map(block => {
    let link = decode(tag(block, 'link'));
    if (!link) {
      const href = block.match(/<link[^>]*href="([^"]+)"/i);
      link = href ? href[1] : '';
    }
    if (link && link.startsWith('/')) link = SITE + link;
    let description = decode(tag(block, 'description') || tag(block, 'summary'));
    if (description.length > 220) description = description.slice(0, 217).trimEnd() + '…';
    return {
      title: decode(tag(block, 'title')),
      link,
      date: decode(tag(block, 'pubDate') || tag(block, 'updated') || tag(block, 'dc:date')),
      description
    };
  }).filter(item => item.title && item.link);
}

async function discoverFeeds() {
  try {
    const html = await (await fetch(SITE, { headers: { 'User-Agent': 'CGT-Aveyron-Inscriptions' } })).text();
    const links = [...html.matchAll(/<link[^>]+type="application\/(?:rss|atom)\+xml"[^>]*>/gi)]
      .map(m => (m[0].match(/href="([^"]+)"/i) || [])[1])
      .filter(Boolean)
      .map(href => (href.startsWith('http') ? href : SITE + (href.startsWith('/') ? '' : '/') + href));
    return links;
  } catch (e) {
    return [];
  }
}

async function loadItems() {
  const feeds = [...new Set([...(await discoverFeeds()), ...CANDIDATE_FEEDS])];
  for (const url of feeds) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'CGT-Aveyron-Inscriptions' } });
      if (!response.ok) continue;
      const items = parseFeed(await response.text());
      if (items.length) return { source: url, items };
    } catch (e) {
      // on essaie l'adresse suivante
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!cache.data || Date.now() - cache.at > CACHE_MS) {
    const data = await loadItems();
    if (data) cache = { at: Date.now(), data };
  }

  if (!cache.data) {
    return res.status(502).json({ error: 'Flux RSS de cgt.fr indisponible' });
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  return res.status(200).json({ source: cache.data.source, items: cache.data.items.slice(0, limit) });
}
