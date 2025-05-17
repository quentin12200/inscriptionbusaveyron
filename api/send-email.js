// Fonction serverless Vercel pour l'envoi d'emails avec Resend
import { Resend } from 'resend';

export default async function handler(req, res) {
  // Activer CORS
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    if (!type || !data || !data.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérifier que nous avons reçu le sujet et le contenu HTML
    if (!data.subject || !data.html) {
      return res.status(400).json({ error: 'Missing subject or HTML content' });
    }

    // Initialiser Resend avec la clé API
    const resend = new Resend('re_MGTakVER_FbJar1nyUTCP6DggzkkqsVB8');

    // Envoyer l'email avec le contenu HTML fourni par le frontend
    const { data: emailData, error } = await resend.emails.send({
      from: 'CGT Aveyron <inscriptions@cgt-aveyron.fr>',
      to: [data.email],
      subject: data.subject,
      html: data.html
    });

    if (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Email sent successfully', id: emailData.id });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return res.status(500).json({ error: error.message });
  }
}
