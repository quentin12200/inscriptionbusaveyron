// Fonction serverless Vercel pour l'envoi d'emails
const nodemailer = require('nodemailer');

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

    // Configurer le transporteur d'emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Définir dans les variables d'environnement Vercel
        pass: process.env.EMAIL_PASS  // Définir dans les variables d'environnement Vercel
      }
    });

    // Préparer le contenu de l'email selon le type
    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: '',
      html: ''
    };

    if (type === 'bus') {
      mailOptions.subject = 'Confirmation de votre inscription au bus - CGT Aveyron';
      mailOptions.html = `
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
      mailOptions.subject = 'Confirmation de votre réservation de repas - CGT Aveyron';
      mailOptions.html = `
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

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
