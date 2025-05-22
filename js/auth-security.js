/**
 * Module de sécurité pour l'authentification
 * CGT Aveyron - Inscription mobilisation 5 juin 2025
 */

// Utilisation de SubtleCrypto pour le hachage sécurisé
class AuthSecurity {
    /**
     * Initialise le système d'authentification sécurisé
     */
    constructor() {
        this.initSecureStorage();
        this.tokenExpiration = 3600000; // 1 heure en millisecondes
    }

    /**
     * Initialise le stockage sécurisé des identifiants
     */
    async initSecureStorage() {
        // Vérifier si les identifiants sécurisés existent déjà
        if (!localStorage.getItem('secureCredentials')) {
            // Un seul identifiant administrateur avec le mot de passe simplifié
            const defaultCredentials = [
                { passwordHash: await this.hashPassword('cgt12aveyron'), role: 'admin' }
            ];
            
            // Stocker les identifiants de manière sécurisée
            localStorage.setItem('secureCredentials', this.encryptData(JSON.stringify(defaultCredentials)));
            
            console.log('Stockage sécurisé des identifiants initialisé');
        }
    }

    /**
     * Vérifie les identifiants de l'utilisateur
     * @param {string} password - Le mot de passe
     * @returns {Promise<Object>} - Résultat de l'authentification
     */
    async verifyCredentials(password) {
        try {
            const credentials = JSON.parse(this.decryptData(localStorage.getItem('secureCredentials')));
            const userCredential = credentials[0]; // Il n'y a qu'un seul identifiant maintenant
            
            const passwordMatch = await this.verifyPassword(password, userCredential.passwordHash);
            
            if (passwordMatch) {
                // Générer un token d'authentification
                const token = this.generateAuthToken(userCredential.role);
                return { 
                    success: true, 
                    token: token,
                    role: userCredential.role,
                    expiresAt: new Date(Date.now() + this.tokenExpiration).toISOString()
                };
            } else {
                return { success: false, message: 'Mot de passe incorrect' };
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des identifiants:', error);
            return { success: false, message: 'Erreur d\'authentification' };
        }
    }

    /**
     * Hache un mot de passe de manière sécurisée
     * @param {string} password - Le mot de passe en clair
     * @returns {Promise<string>} - Le hash du mot de passe
     */
    async hashPassword(password) {
        // Utilisation de SubtleCrypto pour le hachage
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Vérifie si un mot de passe correspond au hash stocké
     * @param {string} password - Le mot de passe en clair
     * @param {string} storedHash - Le hash stocké
     * @returns {Promise<boolean>} - true si le mot de passe correspond
     */
    async verifyPassword(password, storedHash) {
        const hashedPassword = await this.hashPassword(password);
        return hashedPassword === storedHash;
    }

    /**
     * Génère un token d'authentification
     * @param {string} role - Le rôle de l'utilisateur
     * @returns {string} - Le token d'authentification
     */
    generateAuthToken(role) {
        const tokenData = {
            role: role,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.tokenExpiration,
            random: Math.random().toString(36).substring(2)
        };
        
        return this.encryptData(JSON.stringify(tokenData));
    }

    /**
     * Vérifie si un token est valide
     * @param {string} token - Le token à vérifier
     * @returns {Object|null} - Les données du token si valide, null sinon
     */
    verifyToken(token) {
        try {
            if (!token) return null;
            
            const tokenData = JSON.parse(this.decryptData(token));
            
            // Vérifier si le token a expiré
            if (tokenData.expiresAt < Date.now()) {
                return null;
            }
            
            return tokenData;
        } catch (error) {
            console.error('Erreur lors de la vérification du token:', error);
            return null;
        }
    }

    /**
     * Chiffre des données (simple encodage pour cette démo)
     * Dans une application réelle, utilisez un chiffrement plus robuste
     * @param {string} data - Les données à chiffrer
     * @returns {string} - Les données chiffrées
     */
    encryptData(data) {
        // Utilisation de btoa pour l'encodage (pas un vrai chiffrement)
        // Dans une application réelle, utilisez un algorithme de chiffrement approprié
        return btoa(data);
    }

    /**
     * Déchiffre des données
     * @param {string} encryptedData - Les données chiffrées
     * @returns {string} - Les données déchiffrées
     */
    decryptData(encryptedData) {
        // Utilisation de atob pour le décodage
        return atob(encryptedData);
    }

    /**
     * Déconnecte l'utilisateur en supprimant le token
     */
    logout() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
    }
}

// Exporter l'instance pour une utilisation globale
window.authSecurity = new AuthSecurity();
