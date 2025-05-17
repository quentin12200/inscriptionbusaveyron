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
    // Augmenter la version pour forcer une mise à jour du schéma
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
                // Nous ne pouvons pas directement renommer un objectStore, nous devons le recréer
                // Cette opération perdra les données existantes, mais c'est acceptable pour cette mise à jour
                db.deleteObjectStore('inscriptions');
            }
            
            // Création du nouvel objectStore
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
        
        // Vérifier si la base de données est initialisée
        if (!db) {
            alert('La base de données n\'est pas encore prête. Veuillez réessayer dans quelques instants.');
            return;
        }
        
        // Enregistrement dans la base de données
        const transaction = db.transaction(['inscriptionsBus'], 'readwrite');
        const objectStore = transaction.objectStore('inscriptionsBus');
        
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
            
            // Envoyer un email de confirmation si le service est disponible
            if (window.emailService && email) {
                window.emailService.sendBusConfirmation(inscription)
                    .then(() => {
                        console.log('Email de confirmation envoyé avec succès à', email);
                    })
                    .catch(error => {
                        console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
                    });
            } else if (!email) {
                console.log('Pas d\'email fourni, aucun email de confirmation envoyé');
            } else if (!window.emailService) {
                console.error('Service d\'email non disponible');
            }
            
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
            if (!db) {
                reject(new Error('La base de données n\'est pas initialisée'));
                return;
            }
            
            const transaction = db.transaction(['inscriptionsBus'], 'readonly');
            const objectStore = transaction.objectStore('inscriptionsBus');
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
