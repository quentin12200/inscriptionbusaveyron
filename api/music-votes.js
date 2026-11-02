// Fonction serverless Vercel : votes de la playlist (/music)
// Les compteurs sont stockés dans Redis (Upstash) via son API REST.
// Variables d'environnement : KV_REST_API_URL / KV_REST_API_TOKEN
// (ou UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN), ajoutées automatiquement
// par l'intégration Upstash du Marketplace Vercel.

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const CLES = { garder: 'playlist:garder', retirer: 'playlist:retirer' };

async function redis(commandes) {
  const reponse = await fetch(REDIS_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commandes)
  });
  if (!reponse.ok) throw new Error('Redis ' + reponse.status);
  return reponse.json();
}

// HGETALL renvoie [champ, valeur, champ, valeur…]
function enObjet(liste) {
  const objet = {};
  for (let i = 0; i < (liste || []).length; i += 2) objet[liste[i]] = Number(liste[i + 1]) || 0;
  return objet;
}

async function lireVotes() {
  const [garder, retirer] = await redis([['HGETALL', CLES.garder], ['HGETALL', CLES.retirer]]);
  return { garder: enObjet(garder.result), retirer: enObjet(retirer.result) };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(503).json({ error: 'Stockage des votes non configuré' });
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await lireVotes());
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id, vote, precedent } = req.body || {};
    const choixValide = (v) => v === 'garder' || v === 'retirer';

    if (typeof id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(id)) {
      return res.status(400).json({ error: 'Morceau invalide' });
    }
    if ((vote && !choixValide(vote)) || (precedent && !choixValide(precedent)) || vote === precedent) {
      return res.status(400).json({ error: 'Vote invalide' });
    }

    const commandes = [];
    if (precedent) commandes.push(['HINCRBY', CLES[precedent], id, -1]);
    if (vote) commandes.push(['HINCRBY', CLES[vote], id, 1]);
    if (commandes.length) await redis(commandes);

    return res.status(200).json(await lireVotes());
  } catch (error) {
    console.error('Erreur votes playlist :', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
