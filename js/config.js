/**
 * ============================================================
 *  CONFIGURATION DE LA MOBILISATION – le seul fichier à modifier
 * ============================================================
 * Pour une nouvelle manif : changer les valeurs ci-dessous, puis
 * (si besoin) les balises <title>/og:/twitter: en haut de index.html
 * et pourquoi-se-mobiliser.html, que les réseaux sociaux lisent sans
 * exécuter ce fichier.
 */
const MOBILISATION = {
    // Date et heure du départ de la manifestation (heure de Paris : +01:00 en hiver, +02:00 en été)
    date: '2026-12-01T14:30:00+01:00',
    jour: 'mardi 1er décembre',      // affiché dans les titres et les messages de partage
    jourCourt: '1er décembre',
    type: 'Manifestation nationale interprofessionnelle',
    ville: 'Rodez',
    lieu: 'Mail de Bourran',
    heure: '14h30',

    // Consignes affichées au-dessus des onglets des bus
    consignes: [
        'Aucun mineur ne sera pris dans le bus sans un accompagnant majeur.',
        'Les départs de Rodez pour le retour se feront au plus tard à 17h00. Les consignes précises seront données par les responsables de chaque bus.'
    ],

    // Places restantes : lien CSV de la feuille « Places » du Google Sheets
    // (Fichier > Partager > Publier sur le Web > feuille « Places » > CSV). Vide = pas de compteur.
    placesCsv: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7BHbHv7XugW51VAmOWNuDzHGuq-I-A_-gFwsEiWpMhu42gFfxb-H41bE2WO9hYNhZPtfwfBsU_WNJ/pub?gid=1448973817&single=true&output=csv',
    placesParBus: 57, // sauf si la feuille donne un autre nombre dans la colonne « Places »

    // Un bloc par bus. « form » : lien du formulaire Google (lien viewform ou code <iframe>),
    // « hauteur » : attribut height du code <iframe> fourni par Google,
    // « complet: true » : remplace le formulaire par un message de covoiturage.
    bus: {
        decazeville: {
            nom: 'Decazeville',
            form: 'https://docs.google.com/forms/d/e/1FAIpQLScYtGIw7PRC0adOP5NPpziXab3MyI3LH03o0x8QtTyjKAygYg/viewform?embedded=true',
            hauteur: 697,
            infos: 'Départ à 13h45 – Laminoir, Decazeville.'
        },
        millau: {
            nom: 'Millau',
            form: 'https://docs.google.com/forms/d/e/1FAIpQLSe7lxYqbyRNwYehPfe4q5_rE-Wb3ILdEMrusdB_1JXTQ39QvA/viewform?embedded=true',
            hauteur: 697,
            infos: 'Départ à 13h00 – Parking du boulevard Jean Gabriac, Millau.'
        },
        'saint-affrique': {
            nom: 'Saint-Affrique',
            form: 'https://docs.google.com/forms/d/e/1FAIpQLSfPvT7tCc0tzYsNXKEdHLcEcpjCsByqDnhDXXxJfQYkztYxqw/viewform?embedded=true',
            hauteur: 697,
            infos: 'Rendez-vous à 12h00 devant la piscine municipale pour un départ à midi, Saint-Affrique.'
        },
        villefranche: {
            nom: 'Villefranche-de-Rouergue',
            form: 'https://docs.google.com/forms/d/e/1FAIpQLSfAWE9pNvg6cZtNwPkeukbQGMNEQ3d55797-L_bFotwo4304A/viewform?embedded=true',
            hauteur: 520,
            infos: 'Départ à 13h00 – Parking bas de Carrefour, Villefranche-de-Rouergue.'
        }
    }
};
