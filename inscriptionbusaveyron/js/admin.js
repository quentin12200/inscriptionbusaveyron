document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const exportBtn = document.getElementById('exportBtn');
    const inscriptionsTableBody = document.getElementById('inscriptionsTableBody');
    const currentULSpan = document.getElementById('currentUL');

    // Mots de passe pour chaque Union Locale (en pratique, utiliser un système plus sécurisé)
    const passwords = {
        'Villefranche-de-Rouergue': 'cgt12villefranche',
        'Decazeville': 'cgt12decazeville',
        'Millau': 'cgt12millau'
    };

    // Base de données locale (IndexedDB)
    let db;
    const request = indexedDB.open('CGTAveyronDB', 1);

    request.onerror = function(event) {
        console.error('Erreur d\'ouverture de la base de données:', event.target.error);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Base de données ouverte avec succès');
        
        // Vérifier si l'utilisateur est déjà connecté
        const currentUL = localStorage.getItem('currentUL');
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
            localStorage.setItem('currentUL', unionLocale);
            showAdminSection(unionLocale);
        } else {
            alert('Mot de passe incorrect');
        }
    });

    // Gestion de la déconnexion
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUL');
        adminSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        document.getElementById('password').value = '';
    });

    // Exportation des données en CSV
    exportBtn.addEventListener('click', function() {
        const currentUL = localStorage.getItem('currentUL');
        
        if (!currentUL) {
            alert('Veuillez vous connecter');
            return;
        }
        
        exportInscriptions(currentUL)
            .then(csv => {
                // Création d'un blob et téléchargement du fichier CSV
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                link.setAttribute('href', url);
                link.setAttribute('download', `inscriptions_${currentUL}_${formatDate(new Date())}.csv`);
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
        currentULSpan.textContent = unionLocale;
        
        // Chargement des inscriptions pour cette Union Locale
        loadInscriptions(unionLocale);
    }

    // Fonction pour charger les inscriptions filtrées par Union Locale
    function loadInscriptions(unionLocale) {
        const transaction = db.transaction(['inscriptions'], 'readonly');
        const objectStore = transaction.objectStore('inscriptions');
        const request = objectStore.getAll();
        
        request.onsuccess = function() {
            const inscriptions = request.result;
            
            // Filtrage par Union Locale
            const filteredInscriptions = inscriptions.filter(inscription => 
                inscription.lieuDepart === unionLocale
            );
            
            // Affichage des inscriptions
            displayInscriptions(filteredInscriptions);
        };
        
        request.onerror = function(event) {
            console.error('Erreur lors du chargement des inscriptions:', event.target.error);
        };
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
    function exportInscriptions(lieuFilter) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['inscriptions'], 'readonly');
            const objectStore = transaction.objectStore('inscriptions');
            const request = objectStore.getAll();
            
            request.onsuccess = function() {
                let inscriptions = request.result;
                
                // Filtrage par lieu si nécessaire
                if (lieuFilter) {
                    inscriptions = inscriptions.filter(inscription => inscription.lieuDepart === lieuFilter);
                }
                
                // Conversion en CSV
                let csv = 'Nom,Prénom,Téléphone,Email,Lieu de départ,Heure de départ,Nombre de personnes,Besoin d\'être rappelé,Date d\'inscription\n';
                
                inscriptions.forEach(inscription => {
                    const dateFormatted = formatDate(new Date(inscription.dateInscription));
                    csv += `"${inscription.nom}","${inscription.prenom}","${inscription.telephone}","${inscription.email || ''}","${inscription.lieuDepart}","${inscription.heureDepart}",${inscription.nombrePersonnes},${inscription.besoinRappel ? 'Oui' : 'Non'},"${dateFormatted}"\n`;
                });
                
                resolve(csv);
            };
            
            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    }
});
