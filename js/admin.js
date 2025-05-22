document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const exportBtn = document.getElementById('exportBtn');
    const inscriptionsTableBody = document.getElementById('inscriptionsTableBody');

    // Utilisation du système d'authentification sécurisé
    // Le module auth-security.js doit être chargé avant ce script

    // Base de données locale (IndexedDB)
    let db;
    const request = indexedDB.open('InscriptionsCGT', 2);

    request.onerror = function(event) {
        console.error('Erreur d\'ouverture de la base de données:', event.target.error);
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        const oldVersion = event.oldVersion;
        console.log('Mise à jour de la base de données de la version', oldVersion, 'à la version 2');
        
        // Migration des données si nécessaire
        if (oldVersion < 2) {
            // Supprimer l'ancien objectStore s'il existe
            if (db.objectStoreNames.contains('inscriptions')) {
                console.log('Migration des données de "inscriptions" vers "inscriptionsBus"');
                db.deleteObjectStore('inscriptions');
            }
            
            // Création du nouvel objectStore
            if (!db.objectStoreNames.contains('inscriptionsBus')) {
                const objectStore = db.createObjectStore('inscriptionsBus', { keyPath: 'id', autoIncrement: true });
                
                // Définition des colonnes
                objectStore.createIndex('nom', 'nom', { unique: false });
                objectStore.createIndex('prenom', 'prenom', { unique: false });
                objectStore.createIndex('telephone', 'telephone', { unique: false });
                objectStore.createIndex('email', 'email', { unique: false });
                objectStore.createIndex('lieuDepart', 'lieuDepart', { unique: false });
                objectStore.createIndex('heureDepart', 'heureDepart', { unique: false });
                objectStore.createIndex('nombrePersonnes', 'nombrePersonnes', { unique: false });
                objectStore.createIndex('besoinRappel', 'besoinRappel', { unique: false });
                objectStore.createIndex('dateInscription', 'dateInscription', { unique: false });
                
                console.log('Nouvel objectStore "inscriptionsBus" créé avec succès');
            }
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Base de données ouverte avec succès');
        
        // Vérifier si l'utilisateur est déjà connecté avec un token valide
        const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const tokenData = window.authSecurity.verifyToken(authToken);
        
        if (tokenData && tokenData.role === 'admin') {
            showAdminSection();
        }
    };

    // Gestion de la connexion sécurisée
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        // Afficher un indicateur de chargement
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Connexion en cours...';
        submitBtn.disabled = true;
        
        try {
            // Vérification sécurisée des identifiants
            const authResult = await window.authSecurity.verifyCredentials(password);
            
            if (authResult.success) {
                // Stockage du token d'authentification
                if (rememberMe) {
                    localStorage.setItem('authToken', authResult.token);
                } else {
                    sessionStorage.setItem('authToken', authResult.token);
                }
                
                // Afficher la section d'administration
                showAdminSection();
                
                // Journalisation de la connexion
                console.log(`Connexion réussie (${authResult.role})`);
            } else {
                // Afficher un message d'erreur
                alert(authResult.message || 'Mot de passe incorrect');
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
        const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!authToken) {
            alert('Veuillez vous connecter');
            return;
        }
        
        exportInscriptions()
            .then(csv => {
                // Création d'un blob et téléchargement du fichier CSV
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                link.setAttribute('href', url);
                link.setAttribute('download', `inscriptions_CGT_Aveyron_${formatDate(new Date())}.csv`);
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
    function showAdminSection() {
        loginSection.classList.add('hidden');
        adminSection.classList.remove('hidden');
        
        // Chargement de toutes les inscriptions
        loadInscriptions();
    }

    // Fonction pour charger toutes les inscriptions
    function loadInscriptions() {
        if (!db) {
            console.error('La base de données n\'est pas initialisée');
            return;
        }
        
        try {
            const transaction = db.transaction(['inscriptionsBus'], 'readonly');
            const objectStore = transaction.objectStore('inscriptionsBus');
            const request = objectStore.getAll();
            
            request.onsuccess = function() {
                const inscriptions = request.result;
                
                // Affichage des inscriptions
                displayInscriptions(inscriptions);
                console.log(`${inscriptions.length} inscriptions trouvées au total`);
            };
            
            request.onerror = function(event) {
                console.error('Erreur lors du chargement des inscriptions:', event.target.error);
            };
        } catch (error) {
            console.error('Erreur lors de l\'accès à la base de données:', error);
        }
    }

    // Fonction pour afficher les inscriptions dans le tableau
    function displayInscriptions(inscriptions) {
        inscriptionsTableBody.innerHTML = '';
        
        if (inscriptions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="8" style="text-align: center;">Aucune inscription pour le moment</td>';
            inscriptionsTableBody.appendChild(row);
            return;
        }
        
        inscriptions.forEach(inscription => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${inscription.nom}</td>
                <td>${inscription.prenom}</td>
                <td>${inscription.telephone}</td>
                <td>${inscription.email || '-'}</td>
                <td>${inscription.heureDepart}</td>
                <td>${inscription.nombrePersonnes}</td>
                <td>${inscription.besoinRappel ? 'Oui' : 'Non'}</td>
                <td>${formatDate(new Date(inscription.dateInscription))}</td>
            `;
            
            inscriptionsTableBody.appendChild(row);
        });
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

    // Fonction pour exporter les inscriptions en CSV
    function exportInscriptions() {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('La base de données n\'est pas initialisée'));
                return;
            }
            
            try {
                const transaction = db.transaction(['inscriptionsBus'], 'readonly');
                const objectStore = transaction.objectStore('inscriptionsBus');
                const request = objectStore.getAll();
                
                request.onsuccess = function() {
                    let inscriptions = request.result;
                    
                    // Conversion en CSV
                    let csv = 'Nom,Prénom,Téléphone,Email,Lieu de départ,Heure de départ,Nombre de personnes,Besoin d\'être rappelé,Date d\'inscription\n';
                    
                    inscriptions.forEach(inscription => {
                        const dateFormatted = new Date(inscription.dateInscription).toLocaleString('fr-FR');
                        csv += `"${inscription.nom}","${inscription.prenom}","${inscription.telephone}","${inscription.email}","${inscription.lieuDepart}","${inscription.heureDepart}",${inscription.nombrePersonnes},${inscription.besoinRappel ? 'Oui' : 'Non'},"${dateFormatted}"\n`;
                    });
                    
                    resolve(csv);
                };
                
                request.onerror = function(event) {
                    reject(event.target.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }
});
