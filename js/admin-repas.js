document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const exportBtn = document.getElementById('exportBtn');
    const repasTableBody = document.getElementById('repasTableBody');
    const totalReservations = document.getElementById('totalReservations');
    const vegetarienCount = document.getElementById('vegetarienCount');

    // Utilisation du système d'authentification sécurisé
    // Le module auth-security.js doit être chargé avant ce script

    // Base de données locale (IndexedDB)
    let db;
    const request = indexedDB.open('CGTAveyronDB', 2);

    request.onerror = function(event) {
        console.error('Erreur d\'ouverture de la base de données:', event.target.error);
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        // Création de la table Repas si elle n'existe pas
        if (!db.objectStoreNames.contains('repas')) {
            const objectStore = db.createObjectStore('repas', { keyPath: 'id', autoIncrement: true });
            
            // Définition des colonnes
            objectStore.createIndex('nom', 'nom', { unique: false });
            objectStore.createIndex('prenom', 'prenom', { unique: false });
            objectStore.createIndex('telephone', 'telephone', { unique: false });
            objectStore.createIndex('email', 'email', { unique: false });
            objectStore.createIndex('nombrePersonnes', 'nombrePersonnes', { unique: false });
            objectStore.createIndex('vegetarien', 'vegetarien', { unique: false });
            objectStore.createIndex('commentaire', 'commentaire', { unique: false });
            objectStore.createIndex('dateInscription', 'dateInscription', { unique: false });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Base de données ouverte avec succès');
        
        // Vérifier si l'utilisateur est déjà connecté avec un token valide
        const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const tokenData = window.authSecurity.verifyToken(authToken);
        
        if (tokenData && tokenData.role === 'admin-repas' && tokenData.unionLocale === 'Rodez') {
            showAdminSection(tokenData.unionLocale);
        }
    };

    // Gestion de la connexion sécurisée
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const unionLocale = document.getElementById('unionLocale').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        // Afficher un indicateur de chargement
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Connexion en cours...';
        submitBtn.disabled = true;
        
        try {
            // Vérification sécurisée des identifiants
            const authResult = await window.authSecurity.verifyCredentials(unionLocale, password);
            
            if (authResult.success && authResult.role === 'admin-repas') {
                // Stockage du token d'authentification
                if (rememberMe) {
                    localStorage.setItem('authToken', authResult.token);
                } else {
                    sessionStorage.setItem('authToken', authResult.token);
                }
                
                // Pour la compatibilité avec le code existant
                localStorage.setItem('currentULRepas', unionLocale);
                
                // Afficher la section d'administration
                showAdminSection(unionLocale);
                
                // Journalisation de la connexion
                console.log(`Connexion réussie pour ${unionLocale} (${authResult.role})`);
            } else if (authResult.success && authResult.role !== 'admin-repas') {
                // L'utilisateur est authentifié mais n'a pas le bon rôle
                alert('Vous n\'avez pas les droits nécessaires pour accéder à cette page');
            } else {
                // Afficher un message d'erreur
                alert(authResult.message || 'Identifiants incorrects');
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            alert('Une erreur est survenue lors de la connexion');
        } finally {
            // Rétablir le bouton
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Gestion de la déconnexion sécurisée
    logoutBtn.addEventListener('click', function() {
        // Utiliser la fonction de déconnexion du module de sécurité
        window.authSecurity.logout();
        
        // Masquer la section d'administration et afficher le formulaire de connexion
        adminSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        document.getElementById('password').value = '';
        
        // Journalisation de la déconnexion
        console.log('Déconnexion réussie');
    });

    // Exportation des données en CSV
    exportBtn.addEventListener('click', function() {
        exportRepas()
            .then(csv => {
                // Création d'un blob et téléchargement du fichier CSV
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                link.setAttribute('href', url);
                link.setAttribute('download', `repas_rodez_${formatDate(new Date())}.csv`);
                link.style.visibility = 'hidden';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => {
                console.error('Erreur lors de l\'exportation:', error);
                alert('Une erreur est survenue lors de l\'exportation');
            });
    });

    // Fonction pour afficher la section d'administration
    function showAdminSection(unionLocale) {
        loginSection.classList.add('hidden');
        adminSection.classList.remove('hidden');
        
        // Chargement des réservations de repas
        loadRepas();
    }

    // Fonction pour charger les réservations de repas
    function loadRepas() {
        const transaction = db.transaction(['repas'], 'readonly');
        const objectStore = transaction.objectStore('repas');
        const request = objectStore.getAll();
        
        request.onsuccess = function() {
            const repas = request.result;
            
            // Affichage des réservations
            displayRepas(repas);
            
            // Mise à jour des statistiques
            updateStats(repas);
        };
        
        request.onerror = function(event) {
            console.error('Erreur lors du chargement des réservations:', event.target.error);
        };
    }

    // Fonction pour afficher les réservations dans le tableau
    function displayRepas(repas) {
        repasTableBody.innerHTML = '';
        
        if (repas.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="8" style="text-align: center;">Aucune réservation pour le moment</td>';
            repasTableBody.appendChild(row);
            return;
        }
        
        repas.forEach(reservation => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${reservation.nom}</td>
                <td>${reservation.prenom}</td>
                <td>${reservation.telephone}</td>
                <td>${reservation.email || '-'}</td>
                <td>${reservation.nombrePersonnes}</td>
                <td>${reservation.vegetarien ? 'Oui' : 'Non'}</td>
                <td>${reservation.commentaire || '-'}</td>
                <td>${formatDate(new Date(reservation.dateInscription))}</td>
            `;
            
            repasTableBody.appendChild(row);
        });
    }

    // Fonction pour mettre à jour les statistiques
    function updateStats(repas) {
        let totalPersonnes = 0;
        let totalVegetarien = 0;
        
        repas.forEach(reservation => {
            totalPersonnes += reservation.nombrePersonnes;
            if (reservation.vegetarien) {
                totalVegetarien += reservation.nombrePersonnes;
            }
        });
        
        totalReservations.textContent = totalPersonnes;
        vegetarienCount.textContent = totalVegetarien;
    }

    // Fonction pour formater une date
    function formatDate(date) {
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Fonction pour exporter les réservations en CSV
    function exportRepas() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['repas'], 'readonly');
            const objectStore = transaction.objectStore('repas');
            const request = objectStore.getAll();
            
            request.onsuccess = function() {
                const repas = request.result;
                
                // Conversion en CSV
                let csv = 'Nom,Prénom,Téléphone,Email,Nombre de repas,Option végétarienne,Commentaire,Date d\'inscription\n';
                
                repas.forEach(reservation => {
                    const dateFormatted = formatDate(new Date(reservation.dateInscription));
                    csv += `"${reservation.nom}","${reservation.prenom}","${reservation.telephone}","${reservation.email || ''}",${reservation.nombrePersonnes},${reservation.vegetarien ? 'Oui' : 'Non'},"${reservation.commentaire || ''}","${dateFormatted}"\n`;
                });
                
                resolve(csv);
            };
            
            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    }
});
