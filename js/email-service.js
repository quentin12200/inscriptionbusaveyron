/**
 * Service d'envoi d'emails pour les inscriptions
 * CGT Aveyron - Inscription mobilisation 5 juin 2025
 * Utilise EmailJS pour l'envoi d'emails directement depuis le frontend
 */

class EmailService {
    constructor() {
        // Configuration EmailJS
        this.serviceID = 'service_5esf8fj';
        this.userID = 'KtRTUdZw0Ysj4Vhkt'; // Clé publique EmailJS
        
        // Initialiser EmailJS
        if (window.emailjs) {
            emailjs.init(this.userID);
            console.log('Service d\'email initialisé avec EmailJS');
        } else {
            console.error('EmailJS non disponible');
        }
    }
    
    /**
     * Envoie un email de confirmation pour une inscription au bus
     * @param {Object} data - Données de l'inscription
     * @returns {Promise} - Promesse résolue avec le résultat de l'envoi
     */
    sendBusConfirmationEmail(data) {
        console.log('Envoi email bus pour: ', data);
        return this.sendEmail('bus', data);
    }

    /**
     * Envoie un email de confirmation pour une inscription au repas
     * @param {Object} data - Données de l'inscription
     * @returns {Promise} - Promesse résolue avec le résultat de l'envoi
     */
    sendRepasConfirmationEmail(data) {
        console.log('Envoi email repas pour: ', data);
        return this.sendEmail('repas', data);
    }
    
    /**
     * Génère le template HTML pour un email de confirmation de bus
     * @param {Object} data - Données de l'inscription
     * @returns {string} - Template HTML
     */
    getBusEmailTemplate(data) {
        const dateDepart = '5 juin 2025';
        const heureRetour = '18h00';
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Confirmation d'inscription - Bus CGT Aveyron</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                .header { background-color: #e30613; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; }
                h1 { margin: 0; }
                .important { font-weight: bold; color: #e30613; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CGT Aveyron</h1>
                <p>Mobilisation du 5 juin 2025</p>
            </div>
            <div class="content">
                <p>Bonjour ${data.prenom} ${data.nom},</p>
                
                <p>Nous confirmons votre inscription au bus pour la mobilisation CGT du 5 juin 2025.</p>
                
                <p><span class="important">Détails de votre inscription :</span></p>
                <ul>
                    <li><strong>Lieu de départ :</strong> ${data.lieuDepart}</li>
                    <li><strong>Heure de départ :</strong> ${data.heureDepart}</li>
                    <li><strong>Date :</strong> ${dateDepart}</li>
                    <li><strong>Nombre de personnes :</strong> ${data.nombrePersonnes}</li>
                </ul>
                
                <p>Le retour est prévu vers ${heureRetour}.</p>
                
                <p>N'oubliez pas de vous présenter au lieu de départ au moins 15 minutes avant l'heure indiquée.</p>
                
                <p>Pour toute question, vous pouvez contacter votre Union Locale.</p>
                
                <p>Solidairement,<br>
                L'équipe CGT Aveyron</p>
            </div>
            <div class="footer">
                <p> 2025 CGT Aveyron - Tous droits réservés</p>
                <p>Ce message a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </body>
        </html>
        `;
    }
    
    /**
     * Génère le template HTML pour un email de confirmation de repas
     * @param {Object} data - Données de l'inscription
     * @returns {string} - Template HTML
     */
    getRepasEmailTemplate(data) {
        const dateRepas = '5 juin 2025';
        const lieuRepas = 'Gare de Rodez';
        const heureRepas = '12h30';
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Confirmation d'inscription - Repas CGT Aveyron</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                .header { background-color: #e30613; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; }
                h1 { margin: 0; }
                .important { font-weight: bold; color: #e30613; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CGT Aveyron</h1>
                <p>Repas du 5 juin 2025</p>
            </div>
            <div class="content">
                <p>Bonjour ${data.prenom} ${data.nom},</p>
                
                <p>Nous confirmons votre inscription au repas organisé par l'UL de Rodez dans le cadre de la mobilisation CGT du 5 juin 2025.</p>
                
                <p><span class="important">Détails de votre inscription :</span></p>
                <ul>
                    <li><strong>Date :</strong> ${dateRepas}</li>
                    <li><strong>Heure :</strong> ${heureRepas}</li>
                    <li><strong>Lieu :</strong> ${lieuRepas}</li>
                    <li><strong>Nombre de personnes :</strong> ${data.nombrePersonnes}</li>
                </ul>
                
                <p>Pour toute question, vous pouvez contacter l'Union Locale de Rodez.</p>
                
                <p>Solidairement,<br>
                L'équipe CGT Aveyron</p>
            </div>
            <div class="footer">
                <p> 2025 CGT Aveyron - Tous droits réservés</p>
                <p>Ce message a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </body>
        </html>
        `;
    }
    
    /**
     * Envoie un email de modification pour une inscription
     * @param {Object} inscription - Les données de l'inscription
     * @param {string} type - Le type d'inscription (bus ou repas)
     * @returns {Promise} - Promesse résolue si l'email est envoyé avec succès
     */
    sendModificationConfirmation(inscription, type) {
        // Ajouter une indication que c'est une modification
        inscription.isModification = true;
        inscription.modificationDate = new Date().toLocaleDateString('fr-FR');
        
        return this.sendEmail(type, inscription);
    }
    
    /**
     * Envoie un email d'annulation pour une inscription
     * @param {Object} inscription - Les données de l'inscription
     * @param {string} type - Le type d'inscription (bus ou repas)
     * @returns {Promise} - Promesse résolue si l'email est envoyé avec succès
     */
    sendCancellationConfirmation(inscription, type) {
        // Ajouter une indication que c'est une annulation
        inscription.isCancellation = true;
        inscription.cancellationDate = new Date().toLocaleDateString('fr-FR');
        
        return this.sendEmail(type, inscription);
    }
    
    /**
     * Envoie un email via l'API Vercel
     * @param {string} type - Le type d'email (bus ou repas)
     * @param {Object} data - Les données de l'inscription
     * @returns {Promise} - Promesse résolue si l'email est envoyé avec succès
     */
    sendEmail(type, data) {
        return new Promise((resolve, reject) => {
            console.log(`Tentative d'envoi d'email ${type} avec les données suivantes:`);
            console.log('Données:', JSON.stringify(data));
            
            // Détecter si nous sommes en environnement local (localhost ou fichier)
            const isLocalEnvironment = window.location.hostname === 'localhost' || 
                                       window.location.hostname === '127.0.0.1' ||
                                       window.location.protocol === 'file:';
            
            if (isLocalEnvironment) {
                // En local, simuler un envoi d'email réussi
                console.log('Environnement local détecté - Simulation d\'envoi d\'email');
                console.log(`Un email de type "${type}" serait envoyé à ${data.email} en production`);
                
                // Afficher une alerte pour informer l'utilisateur
                alert(`En environnement de production, un email de confirmation serait envoyé à ${data.email}`);
                
                // Résoudre la promesse avec un faux ID de message
                resolve({ messageId: 'local-test-' + Date.now() });
                return;
            }
            
            // Vérifier que EmailJS est disponible
            if (!window.emailjs) {
                reject(new Error('EmailJS n\'est pas disponible'));
                return;
            }
            
            // Préparer les paramètres du template en fonction du type
            let templateId, templateParams;
            
            if (type === 'bus') {
                templateId = 'template_g5gcva4';
                templateParams = {
                    to_name: `${data.prenom} ${data.nom}`,
                    to_email: data.email,
                    lieu_depart: data.lieuDepart,
                    heure_depart: data.heureDepart,
                    nombre_personnes: data.nombrePersonnes,
                    date_mobilisation: '5 juin 2025'
                };
            } else if (type === 'repas') {
                templateId = 'template_ja9wvwp';
                templateParams = {
                    to_name: `${data.prenom} ${data.nom}`,
                    to_email: data.email,
                    nombre_personnes: data.nombrePersonnes,
                    date_mobilisation: '5 juin 2025'
                };
            } else {
                reject(new Error('Type d\'email non reconnu'));
                return;
            }
            
            // Envoyer l'email via EmailJS
            emailjs.send(this.serviceID, templateId, templateParams)
                .then(response => {
                    console.log('Email envoyé avec succès:', response);
                    resolve(response);
                })
                .catch(error => {
                    console.error('Erreur lors de l\'envoi de l\'email:', error);
                    reject(error);
                });
        });
    }
}

// Exporter l'instance pour une utilisation globale
window.emailService = new EmailService();
