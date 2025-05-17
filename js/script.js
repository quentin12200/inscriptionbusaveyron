document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const form = document.getElementById('inscriptionForm');
    const lieuDepartSelect = document.getElementById('lieuDepart');
    const heureDepartInput = document.getElementById('heureDepart');
    const confirmationDiv = document.getElementById('confirmation');
    const newInscriptionBtn = document.getElementById('newInscription');
    
    // S'assurer que le pop-up de confirmation est caché au chargement
    confirmationDiv.classList.add('hidden');
    confirmationDiv.style.display = 'none';

    // Base de données locale (IndexedDB)
    let db;
    const request = indexedDB.open('CGTAveyronDB', 1);

    request.onerror = function(event) {
        console.error('Erreur d\'ouverture de la base de données:', event.target.error);
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        // Création de la table Inscriptions
        if (!db.objectStoreNames.contains('inscriptions')) {
            const objectStore = db.createObjectStore('inscriptions', { keyPath: 'id', autoIncrement: true });
            
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
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Base de données ouverte avec succès');
    };

    // Mise à jour automatique de l'heure de départ en fonction du lieu
    lieuDepartSelect.addEventListener('change', function() {
        const selectedLieu = this.value;
        
        if (selectedLieu === 'Villefranche-de-Rouergue' || selectedLieu === 'Millau') {
            heureDepartInput.value = '13h00';
        } else if (selectedLieu === 'Decazeville') {
            heureDepartInput.value = '13h15';
        } else {
            heureDepartInput.value = '';
        }
    });

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Récupération des valeurs du formulaire
        const nom = document.getElementById('nom').value;
        const prenom = document.getElementById('prenom').value;
        const telephone = document.getElementById('telephone').value;
        const email = document.getElementById('email').value;
        const lieuDepart = lieuDepartSelect.value;
        const heureDepart = heureDepartInput.value;
        const nombrePersonnes = parseInt(document.getElementById('nombrePersonnes').value);
        const besoinRappel = document.getElementById('besoinRappel').checked;
        const dateInscription = new Date();
        
        // Validation basique
        if (!nom || !prenom || !telephone || !lieuDepart || !heureDepart || !nombrePersonnes) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }
        
        // Enregistrement dans la base de données
        const transaction = db.transaction(['inscriptions'], 'readwrite');
        const objectStore = transaction.objectStore('inscriptions');
        
        const inscription = {
            nom: nom,
            prenom: prenom,
            telephone: telephone,
            email: email,
            lieuDepart: lieuDepart,
            heureDepart: heureDepart,
            nombrePersonnes: nombrePersonnes,
            besoinRappel: besoinRappel,
            dateInscription: dateInscription
        };
        
        const request = objectStore.add(inscription);
        
        request.onsuccess = function() {
            console.log('Inscription ajoutée à la base de données');
            
            // Réinitialisation du formulaire
            form.reset();
            heureDepartInput.value = '';
            
            // Affichage du message de confirmation
            // Important : retirer la classe hidden ET définir le display à flex
            confirmationDiv.classList.remove('hidden');
            // Forcer l'affichage du pop-up
            setTimeout(function() {
                confirmationDiv.style.display = 'flex';
            }, 100);
        };
        
        request.onerror = function(event) {
            console.error('Erreur lors de l\'ajout de l\'inscription:', event.target.error);
            alert('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.');
        };
    });
    
    // Nouvelle inscription après confirmation
    newInscriptionBtn.addEventListener('click', function() {
        confirmationDiv.classList.add('hidden');
        confirmationDiv.style.display = 'none';
    });

    // Exportation des données (fonction utilisée par l'admin)
    window.exportInscriptions = function(lieuFilter = null) {
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
                    const dateFormatted = new Date(inscription.dateInscription).toLocaleString('fr-FR');
                    csv += `"${inscription.nom}","${inscription.prenom}","${inscription.telephone}","${inscription.email}","${inscription.lieuDepart}","${inscription.heureDepart}",${inscription.nombrePersonnes},${inscription.besoinRappel ? 'Oui' : 'Non'},"${dateFormatted}"\n`;
                });
                
                resolve(csv);
            };
            
            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    };
});
