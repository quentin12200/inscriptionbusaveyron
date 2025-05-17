document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const form = document.getElementById('repasForm');
    const confirmationDiv = document.getElementById('confirmation');
    const newInscriptionBtn = document.getElementById('newInscription');

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
    };

    // S'assurer que le pop-up de confirmation est caché au chargement
    confirmationDiv.classList.add('hidden');
    confirmationDiv.style.display = 'none';

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Récupération des valeurs du formulaire
        const nom = document.getElementById('nom').value;
        const prenom = document.getElementById('prenom').value;
        const telephone = document.getElementById('telephone').value;
        const email = document.getElementById('email').value;
        const nombrePersonnes = parseInt(document.getElementById('nombrePersonnes').value);
        const vegetarien = document.getElementById('vegetarien').checked;
        const commentaire = document.getElementById('commentaire').value;
        const dateInscription = new Date();
        
        // Validation basique
        if (!nom || !prenom || !telephone || !nombrePersonnes) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }
        
        // Enregistrement dans la base de données
        const transaction = db.transaction(['repas'], 'readwrite');
        const objectStore = transaction.objectStore('repas');
        
        const inscription = {
            nom: nom,
            prenom: prenom,
            telephone: telephone,
            email: email,
            nombrePersonnes: nombrePersonnes,
            vegetarien: vegetarien,
            commentaire: commentaire,
            dateInscription: dateInscription
        };
        
        const request = objectStore.add(inscription);
        
        request.onsuccess = function() {
            console.log('Réservation de repas ajoutée à la base de données');
            
            // Afficher un message de confirmation
            showConfirmation();
            
            // Envoyer un email de confirmation si le service est disponible
            if (window.emailService) {
                window.emailService.sendRepasConfirmation(inscription)
                    .then(() => {
                        console.log('Email de confirmation envoyé avec succès');
                    })
                    .catch(error => {
                        console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
                    });
            }
            
            // Réinitialiser le formulaire
            form.reset();
            
            // Affichage du message de confirmation
            // Important : retirer la classe hidden ET définir le display à flex
            confirmationDiv.classList.remove('hidden');
            // Forcer l'affichage du pop-up
            setTimeout(function() {
                confirmationDiv.style.display = 'flex';
            }, 100);
        };
        
        request.onerror = function(event) {
            console.error('Erreur lors de l\'ajout de la réservation:', event.target.error);
            alert('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.');
        };
    });
    
    // Nouvelle inscription après confirmation
    newInscriptionBtn.addEventListener('click', function() {
        confirmationDiv.classList.add('hidden');
        confirmationDiv.style.display = 'none';
    });
});
