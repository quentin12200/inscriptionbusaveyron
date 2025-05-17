# Inscriptions Mobilisation CGT Aveyron – 5 juin 2025

Application web permettant de gérer les inscriptions à la mobilisation du 5 juin 2025 à Rodez organisée par la CGT Aveyron.

## Fonctionnalités

- Formulaire d'inscription public pour les camarades
- Stockage des données en local via IndexedDB
- Interface d'administration pour chaque Union Locale
- Filtrage des inscriptions par Union Locale
- Exportation des données en CSV

## Structure de la base de données

La base de données contient une table principale "Inscriptions" avec les colonnes suivantes :

- Nom (texte)
- Prénom (texte)
- Téléphone (texte, requis)
- Email (texte, facultatif)
- Lieu de départ (menu déroulant : Villefranche-de-Rouergue, Decazeville, Millau)
- Heure de départ (auto-remplie en fonction du lieu : 13h00 pour Villefranche et Millau, 13h15 pour Decazeville)
- Nombre de personnes (nombre entier, valeur par défaut 1)
- Besoin d'être rappelé ? (booléen)
- Date d'inscription (date/heure, auto-remplie à l'enregistrement)

## Comment utiliser l'application

### Pour les camarades

1. Ouvrir le fichier `index.html` dans un navigateur web
2. Remplir le formulaire d'inscription
3. Cliquer sur "S'inscrire"
4. Un message de confirmation s'affiche

### Pour les administrateurs (Unions Locales)

1. Ouvrir le fichier `admin.html` dans un navigateur web
2. Se connecter avec les identifiants de l'Union Locale :
   - Villefranche-de-Rouergue : cgt12villefranche
   - Decazeville : cgt12decazeville
   - Millau : cgt12millau
3. Consulter les inscriptions filtrées pour votre Union Locale
4. Exporter les données en CSV en cliquant sur le bouton "Exporter en CSV"

## Sécurité

- Chaque Union Locale a accès uniquement à ses propres inscriptions
- Les mots de passe sont stockés en dur dans le code (pour cette version simple)
- Les données sont stockées localement dans le navigateur via IndexedDB

## Installation

Aucune installation n'est nécessaire. Il suffit d'ouvrir les fichiers HTML dans un navigateur web moderne.

Pour déployer l'application sur un serveur web :
1. Copier tous les fichiers sur le serveur
2. Accéder à l'application via l'URL du serveur

## Remarques

Cette application est conçue pour fonctionner localement sans serveur. Les données sont stockées dans le navigateur de l'utilisateur via IndexedDB. Pour une utilisation en production avec plusieurs utilisateurs, il serait préférable d'utiliser une base de données centralisée et un serveur web.
