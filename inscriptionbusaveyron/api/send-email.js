// Fonction serverless Vercel pour l'envoi d'emails avec Resend
const { Resend } = require('resend');

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Gérer les requêtes OPTIONS (pre-flight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { type, data } = req.body;

    // Initialiser Resend avec votre clé API
    const resend = new Resend('re_MGTakVER_FbJar1nyUTCP6DggzkkqsVB8');

    // Préparer le contenu de l'email selon le type
    let subject = '';
    let htmlContent = '';

    if (type === 'bus') {
      subject = 'Confirmation de votre inscription au bus - CGT Aveyron';
      htmlContent = `
        <h1>Confirmation d'inscription</h1>
        <p>Bonjour ${data.prenom} ${data.nom},</p>
        <p>Nous confirmons votre inscription au bus pour la mobilisation CGT Aveyron du 5 juin 2025.</p>
        <p><strong>Détails de votre inscription :</strong></p>
        <ul>
          <li>Lieu de départ : ${data.lieuDepart}</li>
          <li>Heure de départ : ${data.heureDepart}</li>
          <li>Nombre de personnes : ${data.nombrePersonnes}</li>
          ${data.rappel ? '<li>Vous serez contacté(e) par téléphone avant la mobilisation</li>' : ''}
        </ul>
        <p>Merci de votre engagement.</p>
        <p>Cordialement,<br>L'équipe CGT Aveyron</p>
      `;
    } else if (type === 'repas') {
      subject = 'Confirmation de votre réservation de repas - CGT Aveyron';
      htmlContent = `
        <h1>Confirmation de réservation</h1>
        <p>Bonjour ${data.prenom} ${data.nom},</p>
        <p>Nous confirmons votre réservation de repas pour la mobilisation CGT Aveyron du 5 juin 2025.</p>
        <p><strong>Détails de votre réservation :</strong></p>
        <ul>
          <li>Nombre de repas : ${data.nombrePersonnes}</li>
          <li>Option végétarienne : ${data.vegetarien ? 'Oui' : 'Non'}</li>
          ${data.commentaire ? `<li>Commentaire : ${data.commentaire}</li>` : ''}
        </ul>
        <p>Merci de votre participation.</p>
        <p>Cordialement,<br>L'équipe CGT Aveyron</p>
      `;
    }

    // Envoyer l'email avec Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'CGT Aveyron <inscriptions@cgt-aveyron.fr>',
      to: [data.email],
      subject: subject,
      html: htmlContent
    });

    if (error) {
      throw new Error(error.message);
    }
    
    return res.status(200).json({ 
      success: true, 
      messageId: emailData.id 
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
