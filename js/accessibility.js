/**
 * Script d'amélioration de l'accessibilité et des animations
 * CGT Aveyron - Inscription mobilisation 5 juin 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Validation améliorée des formulaires
    initFormValidation();
    
    // Gestion des animations
    initAnimations();
    
    // Amélioration de l'accessibilité au clavier
    initKeyboardAccessibility();
});

/**
 * Initialise la validation améliorée des formulaires
 */
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const requiredInputs = form.querySelectorAll('[required]');
        
        // Validation en temps réel des champs requis
        requiredInputs.forEach(input => {
            // Validation au changement
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            // Validation pendant la saisie (avec délai)
            input.addEventListener('input', debounce(function() {
                validateField(this);
            }, 500));
        });
        
        // Validation du formulaire à la soumission
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            requiredInputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                // Focus sur le premier champ invalide
                form.querySelector(':invalid').focus();
                
                // Annonce pour les lecteurs d'écran
                announceToScreenReader('Le formulaire contient des erreurs. Veuillez les corriger avant de continuer.');
            }
        });
    });
    
    // Validation spécifique pour le téléphone
    const telInputs = document.querySelectorAll('input[type="tel"]');
    telInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Nettoyer l'entrée (garder uniquement les chiffres)
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    });
}

/**
 * Valide un champ de formulaire et affiche un message d'erreur si nécessaire
 * @param {HTMLElement} field - Le champ à valider
 * @returns {boolean} - true si le champ est valide, false sinon
 */
function validateField(field) {
    const errorElement = document.getElementById(`${field.id}-error`);
    let isValid = field.checkValidity();
    let errorMessage = '';
    
    // Effacer le message d'erreur précédent
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    // Validation personnalisée selon le type de champ
    if (!isValid) {
        // Messages d'erreur personnalisés selon le type de validation
        if (field.validity.valueMissing) {
            errorMessage = 'Ce champ est obligatoire';
        } else if (field.validity.typeMismatch) {
            if (field.type === 'email') {
                errorMessage = 'Veuillez entrer une adresse email valide';
            } else {
                errorMessage = 'Format invalide';
            }
        } else if (field.validity.patternMismatch) {
            if (field.type === 'tel') {
                errorMessage = 'Veuillez entrer un numéro de téléphone à 10 chiffres';
            } else {
                errorMessage = 'Format invalide';
            }
        } else if (field.validity.rangeUnderflow) {
            errorMessage = `La valeur minimale est ${field.min}`;
        } else if (field.validity.rangeOverflow) {
            errorMessage = `La valeur maximale est ${field.max}`;
        }
        
        // Afficher le message d'erreur
        if (errorElement && errorMessage) {
            errorElement.textContent = errorMessage;
            field.setAttribute('aria-invalid', 'true');
        }
    } else {
        field.removeAttribute('aria-invalid');
    }
    
    return isValid;
}

/**
 * Initialise les animations subtiles
 */
function initAnimations() {
    // Animation du bouton de soumission
    const submitButtons = document.querySelectorAll('.btn-submit');
    submitButtons.forEach(button => {
        button.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.05)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        button.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Animation des champs de formulaire au focus
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('input-focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('input-focused');
        });
    });
}

/**
 * Améliore l'accessibilité au clavier
 */
function initKeyboardAccessibility() {
    // Gestion améliorée de la navigation au clavier
    const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    focusableElements.forEach(element => {
        element.addEventListener('keydown', function(e) {
            // Activer les éléments avec Espace (en plus de Entrée)
            if (e.key === ' ' && (this.tagName === 'A' || this.tagName === 'BUTTON')) {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // Amélioration du focus pour les utilisateurs de clavier
    document.body.addEventListener('keyup', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-user');
        }
    });
    
    document.body.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-user');
    });
}

/**
 * Annonce un message aux lecteurs d'écran
 * @param {string} message - Le message à annoncer
 */
function announceToScreenReader(message) {
    let announcer = document.getElementById('sr-announcer');
    
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'sr-announcer';
        announcer.setAttribute('aria-live', 'assertive');
        announcer.setAttribute('role', 'alert');
        announcer.style.position = 'absolute';
        announcer.style.width = '1px';
        announcer.style.height = '1px';
        announcer.style.overflow = 'hidden';
        announcer.style.clip = 'rect(0, 0, 0, 0)';
        document.body.appendChild(announcer);
    }
    
    // Vider puis remplir pour s'assurer que le contenu est annoncé
    announcer.textContent = '';
    setTimeout(() => {
        announcer.textContent = message;
    }, 100);
}

/**
 * Fonction utilitaire pour limiter la fréquence d'exécution d'une fonction
 * @param {Function} func - La fonction à exécuter
 * @param {number} wait - Le délai d'attente en millisecondes
 * @returns {Function} - La fonction avec délai
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}
