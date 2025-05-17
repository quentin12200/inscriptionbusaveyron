/**
 * Service d'envoi d'emails pour les inscriptions
 * CGT Aveyron - Inscription mobilisation 5 juin 2025
 * Utilise l'API Vercel pour envoyer des emails depuis le backend
 */

class EmailService {
    constructor() {
        // URL de l'API Vercel pour l'envoi d'emails
        this.apiUrl = '/api/send-email';
        
        console.log('Service d\'email initialisé avec l\'API Vercel');
    }
    
    /**
     * Envoie un email de confirmation pour une inscription bus
     * @param {Object} inscription - Les données de l'inscription
     * @returns {Promise} - Promesse résolue si l'email est envoyé avec succès
     */
    sendBusConfirmation(inscription) {
        console.log('Envoi email bus pour:', inscription);
        return this.sendEmail('bus', inscription);
    }
    
    /**
     * Envoie un email de confirmation pour une inscription repas
     * @param {Object} inscription - Les données de l'inscription
     * @returns {Promise} - Promesse résolue si l'email est envoyé avec succès
     */
    sendRepasConfirmation(inscription) {
        console.log('Envoi email repas pour:', inscription);
        return this.sendEmail('repas', inscription);
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
            
            // En production, envoyer l'email via l'API
            fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type, data })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log('Email envoyé avec succès:', result);
                resolve(result);
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
