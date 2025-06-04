/**
 * Gestion des boutons de partage sur les réseaux sociaux
 */
document.addEventListener('DOMContentLoaded', function() {
    // Récupère l'URL et le titre de la page courante
    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(document.title);
    
    // Fonction pour partager sur Facebook
    document.querySelectorAll('.share-facebook').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`, 
                'facebook-share', 'width=580, height=296');
        });
    });
    
    // Fonction pour partager sur Twitter
    document.querySelectorAll('.share-twitter').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(`https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`, 
                'twitter-share', 'width=550, height=235');
        });
    });
    
    // Fonction pour partager sur LinkedIn
    document.querySelectorAll('.share-linkedin').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`, 
                'linkedin-share', 'width=550, height=435');
        });
    });
    
    // Fonction pour partager sur WhatsApp
    document.querySelectorAll('.share-whatsapp').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(`https://api.whatsapp.com/send?text=${pageTitle}%20${pageUrl}`, 
                'whatsapp-share', 'width=550, height=435');
        });
    });
    
    // Fonction pour partager par email
    document.querySelectorAll('.share-email').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = `mailto:?subject=${pageTitle}&body=Je%20te%20partage%20cette%20information%20sur%20la%20mobilisation%20CGT%20Aveyron%20du%205%20juin%202025%20:%20${pageUrl}`;
        });
    });
});
