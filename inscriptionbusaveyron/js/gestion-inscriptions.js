/**
 * Module de gestion des inscriptions
 * CGT Aveyron - Inscription mobilisation 5 juin 2025
 * Permet de modifier ou annuler une inscription
 */

document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const searchForm = document.getElementById('searchForm');
    const resultSection = document.getElementById('resultSection');
    const inscriptionDetails = document.getElementById('inscriptionDetails');
    const modificationForm = document.getElementById('modificationForm');
    const cancelButton = document.getElementById('cancelInscription');
    const messageContainer = document.getElementById('messageContainer');
    
    // Base de données locale (IndexedDB)
    let db;
    const DBName = 'InscriptionsCGT';
    const DBVersion = 1;
    
    // Initialisation de la base de données
    const request = indexedDB.open(DBName, DBVersion);
    
    request.onerror = function(event) {
        console.error('Erreur d\'ouverture de la base de données:', event.target.error);
        showMessage('Erreur lors de l\'accès à la base de données', 'error');
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Base de données ouverte avec succès');
    };
    
    // Recherche d'une inscription
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('searchEmail').value.trim();
            const phone = document.getElementById('searchPhone').value.trim();
            
            if (!email && !phone) {
                showMessage('Veuillez saisir au moins un critère de recherche', 'error');
                return;
            }
            
            searchInscription(email, phone);
        });
    }
    
    /**
     * Recherche une inscription dans la base de données
     * @param {string} email - Email de l'inscription
     * @param {string} phone - Téléphone de l'inscription
     */
    function searchInscription(email, phone) {
        if (!db) {
            showMessage('La base de données n\'est pas accessible', 'error');
            return;
        }
        
        // Recherche dans les inscriptions bus
        const busPromise = new Promise((resolve) => {
            const inscriptions = [];
            const transaction = db.transaction(['inscriptionsBus'], 'readonly');
            const objectStore = transaction.objectStore('inscriptionsBus');
            
            const request = objectStore.openCursor();
            
            request.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    const inscription = cursor.value;
                    if ((email && inscription.email === email) || 
                        (phone && inscription.telephone === phone)) {
                        inscription.type = 'bus';
                        inscriptions.push(inscription);
                    }
                    cursor.continue();
                }
            };
            
            transaction.oncomplete = function() {
                resolve(inscriptions);
            };
            
            transaction.onerror = function(event) {
                console.error('Erreur lors de la recherche des inscriptions bus:', event.target.error);
                resolve([]);
            };
        });
        
        // Recherche dans les inscriptions repas
        const repasPromise = new Promise((resolve) => {
            const inscriptions = [];
            const transaction = db.transaction(['inscriptionsRepas'], 'readonly');
            const objectStore = transaction.objectStore('inscriptionsRepas');
            
            const request = objectStore.openCursor();
            
            request.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    const inscription = cursor.value;
                    if ((email && inscription.email === email) || 
                        (phone && inscription.telephone === phone)) {
                        inscription.type = 'repas';
                        inscriptions.push(inscription);
                    }
                    cursor.continue();
                }
            };
            
            transaction.oncomplete = function() {
                resolve(inscriptions);
            };
            
            transaction.onerror = function(event) {
                console.error('Erreur lors de la recherche des inscriptions repas:', event.target.error);
                resolve([]);
            };
        });
        
        // Combiner les résultats
        Promise.all([busPromise, repasPromise])
            .then(([busInscriptions, repasInscriptions]) => {
                const allInscriptions = [...busInscriptions, ...repasInscriptions];
                displaySearchResults(allInscriptions);
            });
    }
    
    /**
     * Affiche les résultats de recherche
     * @param {Array} inscriptions - Liste des inscriptions trouvées
     */
    function displaySearchResults(inscriptions) {
        if (!resultSection) return;
        
        const resultList = document.getElementById('resultList');
        resultList.innerHTML = '';
        
        if (inscriptions.length === 0) {
            showMessage('Aucune inscription trouvée avec ces informations', 'info');
            resultSection.classList.add('hidden');
            return;
        }
        
        // Afficher les résultats
        inscriptions.forEach((inscription, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('result-item');
            
            const typeLabel = inscription.type === 'bus' ? 'Bus' : 'Repas';
            const details = inscription.type === 'bus' 
                ? `Départ: ${inscription.lieuDepart} à ${inscription.heureDepart}, ${inscription.nombrePersonnes} personne(s)`
                : `${inscription.nombreRepas} repas, Option végétarienne: ${inscription.optionVegetarienne ? 'Oui' : 'Non'}`;
            
            listItem.innerHTML = `
                <h3>${inscription.nom} ${inscription.prenom}</h3>
                <p><strong>Type:</strong> ${typeLabel}</p>
                <p><strong>Email:</strong> ${inscription.email}</p>
                <p><strong>Téléphone:</strong> ${inscription.telephone}</p>
                <p>${details}</p>
                <button class="btn-edit" data-index="${index}" data-type="${inscription.type}">Modifier</button>
            `;
            
            resultList.appendChild(listItem);
            
            // Ajouter l'événement pour la modification
            const editButton = listItem.querySelector('.btn-edit');
            editButton.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                const index = this.getAttribute('data-index');
                showModificationForm(inscriptions[index], type);
            });
        });
        
        resultSection.classList.remove('hidden');
    }
    
    /**
     * Affiche le formulaire de modification
     * @param {Object} inscription - L'inscription à modifier
     * @param {string} type - Le type d'inscription (bus ou repas)
     */
    function showModificationForm(inscription, type) {
        if (!inscriptionDetails || !modificationForm) return;
        
        // Stocker l'ID de l'inscription pour la mise à jour
        modificationForm.setAttribute('data-id', inscription.id);
        modificationForm.setAttribute('data-type', type);
        
        // Remplir le formulaire avec les données existantes
        document.getElementById('modifNom').value = inscription.nom;
        document.getElementById('modifPrenom').value = inscription.prenom;
        document.getElementById('modifEmail').value = inscription.email;
        document.getElementById('modifTelephone').value = inscription.telephone;
        
        // Afficher les champs spécifiques selon le type
        const busFields = document.getElementById('busFields');
        const repasFields = document.getElementById('repasFields');
        
        if (type === 'bus') {
            busFields.classList.remove('hidden');
            repasFields.classList.add('hidden');
            
            document.getElementById('modifLieuDepart').value = inscription.lieuDepart;
            document.getElementById('modifHeureDepart').value = inscription.heureDepart;
            document.getElementById('modifNombrePersonnes').value = inscription.nombrePersonnes;
            document.getElementById('modifRappel').checked = inscription.rappel;
        } else {
            busFields.classList.add('hidden');
            repasFields.classList.remove('hidden');
            
            document.getElementById('modifNombreRepas').value = inscription.nombreRepas;
            document.getElementById('modifOptionVegetarienne').checked = inscription.optionVegetarienne;
            document.getElementById('modifCommentaires').value = inscription.commentaires || '';
        }
        
        inscriptionDetails.classList.remove('hidden');
    }
    
    // Gestion du formulaire de modification
    if (modificationForm) {
        modificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inscriptionId = this.getAttribute('data-id');
            const inscriptionType = this.getAttribute('data-type');
            
            // Récupérer les valeurs modifiées
            const updatedInscription = {
                id: inscriptionId,
                nom: document.getElementById('modifNom').value,
                prenom: document.getElementById('modifPrenom').value,
                email: document.getElementById('modifEmail').value,
                telephone: document.getElementById('modifTelephone').value,
                dateInscription: new Date().toISOString()
            };
            
            // Ajouter les champs spécifiques selon le type
            if (inscriptionType === 'bus') {
                updatedInscription.lieuDepart = document.getElementById('modifLieuDepart').value;
                updatedInscription.heureDepart = document.getElementById('modifHeureDepart').value;
                updatedInscription.nombrePersonnes = document.getElementById('modifNombrePersonnes').value;
                updatedInscription.rappel = document.getElementById('modifRappel').checked;
            } else {
                updatedInscription.nombreRepas = document.getElementById('modifNombreRepas').value;
                updatedInscription.optionVegetarienne = document.getElementById('modifOptionVegetarienne').checked;
                updatedInscription.commentaires = document.getElementById('modifCommentaires').value;
            }
            
            // Mettre à jour l'inscription dans la base de données
            updateInscription(updatedInscription, inscriptionType);
        });
    }
    
    // Gestion de l'annulation d'une inscription
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir annuler cette inscription ? Cette action est irréversible.')) {
                const inscriptionId = modificationForm.getAttribute('data-id');
                const inscriptionType = modificationForm.getAttribute('data-type');
                
                deleteInscription(inscriptionId, inscriptionType);
            }
        });
    }
    
    /**
     * Met à jour une inscription dans la base de données
     * @param {Object} inscription - L'inscription mise à jour
     * @param {string} type - Le type d'inscription (bus ou repas)
     */
    function updateInscription(inscription, type) {
        if (!db) {
            showMessage('La base de données n\'est pas accessible', 'error');
            return;
        }
        
        const storeName = type === 'bus' ? 'inscriptionsBus' : 'inscriptionsRepas';
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        
        const request = objectStore.put(inscription);
        
        request.onsuccess = function() {
            showMessage('Inscription mise à jour avec succès', 'success');
            inscriptionDetails.classList.add('hidden');
            
            // Rechercher à nouveau pour actualiser les résultats
            const email = document.getElementById('searchEmail').value.trim();
            const phone = document.getElementById('searchPhone').value.trim();
            searchInscription(email, phone);
        };
        
        request.onerror = function(event) {
            console.error('Erreur lors de la mise à jour de l\'inscription:', event.target.error);
            showMessage('Erreur lors de la mise à jour de l\'inscription', 'error');
        };
    }
    
    /**
     * Supprime une inscription de la base de données
     * @param {string} id - L'ID de l'inscription à supprimer
     * @param {string} type - Le type d'inscription (bus ou repas)
     */
    function deleteInscription(id, type) {
        if (!db) {
            showMessage('La base de données n\'est pas accessible', 'error');
            return;
        }
        
        const storeName = type === 'bus' ? 'inscriptionsBus' : 'inscriptionsRepas';
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        
        const request = objectStore.delete(id);
        
        request.onsuccess = function() {
            showMessage('Inscription annulée avec succès', 'success');
            inscriptionDetails.classList.add('hidden');
            
            // Rechercher à nouveau pour actualiser les résultats
            const email = document.getElementById('searchEmail').value.trim();
            const phone = document.getElementById('searchPhone').value.trim();
            searchInscription(email, phone);
        };
        
        request.onerror = function(event) {
            console.error('Erreur lors de la suppression de l\'inscription:', event.target.error);
            showMessage('Erreur lors de l\'annulation de l\'inscription', 'error');
        };
    }
    
    /**
     * Affiche un message à l'utilisateur
     * @param {string} message - Le message à afficher
     * @param {string} type - Le type de message (success, error, info)
     */
    function showMessage(message, type) {
        if (!messageContainer) return;
        
        messageContainer.textContent = message;
        messageContainer.className = 'message ' + type;
        messageContainer.classList.remove('hidden');
        
        // Masquer le message après 5 secondes
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 5000);
    }
});
