/**
 * Service d'envoi d'emails pour les inscriptions
 * CGT Aveyron - Inscription mobilisation 5 juin 2025
 * Utilise EmailJS pour envoyer des emails depuis le frontend
 */

class EmailService {
    constructor() {
        // Configuration EmailJS
        this.serviceID = 'service_f0i8oc'; // Service ID Gmail
        this.templateIDBus = 'template_g8evo4t'; // Template ID pour les bus
        this.templateIDRepas = 'template_j2fwwwp'; // Template ID pour les repas
        this.userID = 'KtRTUdZw0Ysj4Vhkt'; // Public Key EmailJS
        
        // Chargement du script EmailJS
        this.loadEmailJSScript();
    }
    
    /**
     * Charge le script EmailJS
     */
    loadEmailJSScript() {
        if (window.emailjs) return;
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.async = true;
        document.head.appendChild(script);
        
        script.onload = () => {
            window.emailjs.init(this.userID);
            console.log('EmailJS chargé avec succès');
        };
    }
    
    /**
     * Envoie un email de confirmation pour une inscription bus
     * @param {Object} inscription - Les données de l'inscription
     * @returns {Promise} - Promesse résolue si l'email est envoyé avec succès
     */
    sendBusConfirmation(inscription) {
        return this.sendEmail(this.templateIDBus, {
            to_email: inscription.email,
            to_name: `${inscription.prenom} ${inscription.nom}`,
            lieu_depart: inscription.lieuDepart,
            heure_depart: inscription.heureDepart,
            nombre_personnes: inscription.nombrePersonnes,
            rappel: inscription.rappel ? 'Oui' : 'Non',
            date_inscription: new Date(inscription.dateInscription).toLocaleDateString('fr-FR')
        });
    }
    
    /**
     * Envoie un email de confirmation pour une inscription repas
     * @param {Object} inscription - Les données de l'inscription
     * @returns {Promise} - Promesse résolue si l'email est envoyé avec succès
     */
    sendRepasConfirmation(inscription) {
        return this.sendEmail(this.templateIDRepas, {
            to_email: inscription.email,
            to_name: `${inscription.prenom} ${inscription.nom}`,
            nombre_repas: inscription.nombreRepas,
            option_vegetarienne: inscription.optionVegetarienne ? 'Oui' : 'Non',
            commentaires: inscription.commentaires || 'Aucun',
            date_inscription: new Date(inscription.dateInscription).toLocaleDateString('fr-FR')
        });
    }
    
    /**
     * Envoie un email de modification pour une inscription
     * @param {Object} inscription - Les données de l'inscription
     * @param {string} type - Le type d'inscription (bus ou repas)
     * @returns {Promise} - Promesse résolue si l'email est envoyé avec succès
     */
    sendModificationConfirmation(inscription, type) {
        const templateID = type === 'bus' ? this.templateIDBus : this.templateIDRepas;
        const templateParams = {
            to_email: inscription.email,
            to_name: `${inscription.prenom} ${inscription.nom}`,
            subject: 'Modification de votre inscription - CGT Aveyron',
            message: `Votre inscription a été modifiée avec succès le ${new Date().toLocaleDateString('fr-FR')}.`,
            date_inscription: new Date(inscription.dateInscription).toLocaleDateString('fr-FR')
        };
        
        // Ajouter les paramètres spécifiques selon le type
        if (type === 'bus') {
            templateParams.lieu_depart = inscription.lieuDepart;
            templateParams.heure_depart = inscription.heureDepart;
            templateParams.nombre_personnes = inscription.nombrePersonnes;
            templateParams.rappel = inscription.rappel ? 'Oui' : 'Non';
        } else {
            templateParams.nombre_repas = inscription.nombreRepas;
            templateParams.option_vegetarienne = inscription.optionVegetarienne ? 'Oui' : 'Non';
            templateParams.commentaires = inscription.commentaires || 'Aucun';
        }
        
        return this.sendEmail(templateID, templateParams);
    }
    
    /**
     * Envoie un email d'annulation pour une inscription
     * @param {Object} inscription - Les données de l'inscription
     * @param {string} type - Le type d'inscription (bus ou repas)
     * @returns {Promise} - Promesse résolue si l'email est envoyé avec succès
     */
    sendCancellationConfirmation(inscription, type) {
        const templateID = type === 'bus' ? this.templateIDBus : this.templateIDRepas;
        return this.sendEmail(templateID, {
            to_email: inscription.email,
            to_name: `${inscription.prenom} ${inscription.nom}`,
            subject: 'Annulation de votre inscription - CGT Aveyron',
            message: `Votre inscription a été annulée avec succès le ${new Date().toLocaleDateString('fr-FR')}.`,
            is_cancellation: true
        });
    }
    
    /**
     * Envoie un email via EmailJS
     * @param {string} templateId - L'ID du template EmailJS
     * @param {Object} templateParams - Les paramètres du template
     * @returns {Promise} - Promesse résolue si l'email est envoyé avec succès
     */
    sendEmail(templateId, templateParams) {
        return new Promise((resolve, reject) => {
            if (!window.emailjs) {
                console.error('EmailJS n\'est pas chargé');
                reject(new Error('EmailJS n\'est pas chargé'));
                return;
            }
            
            window.emailjs.send(this.serviceID, templateId, templateParams)
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
