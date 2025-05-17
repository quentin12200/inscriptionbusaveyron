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

    // Mot de passe pour l'Union Locale de Rodez (en pratique, utiliser un système plus sécurisé)
    const passwords = {
        'Rodez': 'cgt12rodez'
    };

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
        
        // Vérifier si l'utilisateur est déjà connecté
        const currentUL = localStorage.getItem('currentULRepas');
        if (currentUL) {
            showAdminSection(currentUL);
        }
    };

    // Gestion de la connexion
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const unionLocale = document.getElementById('unionLocale').value;
        const password = document.getElementById('password').value;
        
        // Vérification du mot de passe
        if (passwords[unionLocale] === password) {
            // Stockage de l'Union Locale connectée
            localStorage.setItem('currentULRepas', unionLocale);
            showAdminSection(unionLocale);
        } else {
            alert('Mot de passe incorrect');
        }
    });

    // Gestion de la déconnexion
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentULRepas');
        adminSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        document.getElementById('password').value = '';
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
