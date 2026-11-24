// Fonction serverless Vercel : places restantes dans chaque bus.
// Lit la feuille « Places » du Google Sheets publiée sur le Web au format CSV
// (colonnes : Bus, Inscrits, et facultativement Places) et renvoie
// { "<bus>": { inscrits, places } } (places vaut null si la colonne est vide).

const PREFIXE_AUTORISE = 'https://docs.google.com/spreadsheets/d/e/';

function nombre(texte) {
  const n = parseInt(String(texte || '').replace(/[^0-9-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function cellules(ligne) {
  // CSV simple : valeurs séparées par des virgules, éventuellement entre guillemets
  const resultat = [];
  let courant = '';
  let entreGuillemets = false;
  for (const c of ligne) {
    if (c === '"') entreGuillemets = !entreGuillemets;
    else if (c === ',' && !entreGuillemets) { resultat.push(courant); courant = ''; }
    else courant += c;
  }
  resultat.push(courant);
  return resultat.map((v) => v.trim());
}

export default async function handler(req, res) {
  const url = typeof req.query.url === 'string' ? req.query.url : '';
  if (!url.startsWith(PREFIXE_AUTORISE) || !url.includes('output=csv')) {
    return res.status(400).json({ error: 'Adresse de feuille invalide' });
  }

  try {
    const reponse = await fetch(url, { redirect: 'follow' });
    if (!reponse.ok) throw new Error('Google Sheets ' + reponse.status);
    const lignes = (await reponse.text()).split(/\r?\n/).filter((l) => l.trim());

    const bus = {};
    for (const ligne of lignes.slice(1)) {
      const [nom, inscrits, places] = cellules(ligne);
      const cle = (nom || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!cle || nombre(inscrits) === null) continue;
      bus[cle] = { inscrits: nombre(inscrits), places: nombre(places) };
    }

    // Mis en cache une minute par Vercel pour ne pas interroger Google à chaque visite
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(bus);
  } catch (error) {
    console.error('Erreur places restantes :', error);
    return res.status(502).json({ error: 'Feuille indisponible' });
  }
}
