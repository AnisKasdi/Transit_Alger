# Transit Alger - Guide du Code (Pour Débutants)

Bienvenue dans le code source de **Transit Alger** ! 🚌🇩🇿

Ce projet est une application web moderne (type "Google Maps") conçue pour aider les algérois à trouver leur itinéraire en bus, tramway et métro.

Le but de ce document est de vous expliquer **comment ça marche sous le capot**, fichier par fichier, pour que vous puissiez comprendre, modifier et améliorer l'application même si vous débutez en React.

---

## 📂 Structure du Projet

Voici les dossiers importants que vous trouverez dans `src/` :

- **`components/`** : Les "briques" visuelles de l'application (La carte, le menu, la liste des bus...).
- **`data/`** : Les données brutes (Liste des arrêts, lignes de bus, coordonnées GPS).
- **`styles/`** : Les fichiers CSS pour le design (Couleurs, Animations, Mise en page).
- **`utils/`** : Les outils logiques (Calculateur d'itinéraire GPS).

---

## 🏗️ Architecture Principale (`App.jsx`)

Le fichier `App.jsx` est le **cerveau** qui connecte tout ensemble. Imaginez-le comme un sandwich à 2 couches :

1.  **Couche Arrière-Plan (Map)** : La carte qui bouge en fond.
2.  **Couche Interface (UI)** : Les boutons et menus par dessus.

Il gère aussi l'état global ("State") :
- `userLocation` : Où est l'utilisateur ?
- `searchCenter` : Où regarde-t-il sur la carte ?
- `transitData` : Toutes les lignes de bus chargées en mémoire.

---

## 🗺️ La Carte (`components/MapContainer.jsx`)

Ce composant utilise la librairie **Leaflet** (le concurrent gratuit de Google Maps).

**Ce qu'il fait :**
- Affiche le fond de carte (Tuiles sombres "Dark Mode").
- Dessine les **Lignes** (Polylines colorées).
- Dessine les **Arrêts** (Points blancs) quand on zoome.
- Affiche le **Point Bleu** (Position utilisateur) qui pulse.

**Astuce :** Pour ne pas faire ramer le téléphone, on n'affiche les arrêts que si le zoom est > 14 !

---

## 🧭 Le GPS / Routing (`utils/routing.js`)

C'est ici que la magie opère ! C'est un algorithme simple mais efficace pour trouver un chemin.

**Logique de `findRoutes(départ, arrivée)` :**
1.  **Scan** : Trouve tous les arrêts de bus dans un rayon de 1km autour du Départ et de l'Arrivée.
2.  **Correspondance** : Regarde s'il existe une ligne commune entre un arrêt de Départ et un arrêt d'Arrivée.
3.  **Calcul** : Estime le temps total = (Marche vers l'arrêt) + (Trajet Bus) + (Marche vers destination).
4.  **Tri** : Renvoie les 5 trajets les plus rapides.

---

## 📱 L'Interface Utilisateur

### 1. La Barre de Navigation (`components/NavBar.jsx`)
C'est le menu du haut. Il contient :
- **Le Profil** : Ouvre un menu latéral noir ("Drawer") avec vos favoris (Maison/Travail).
- **Winek** : Ouvre le tableau de bord social pour voir vos amis.
- **Réglages** : Pour changer la langue ou le thème.

### 2. Le Panneau Glissant (`components/TransitUI.jsx`)
C'est la partie la plus complexe ! C'est le panneau blanc/noir en bas de l'écran qui glisse vers le haut. Il change d'aspect selon ce que vous faites (Machine à états) :

- **Mode HOME** : Barre de recherche + Liste des lignes proches.
- **Mode LINE_DETAILS** : Affiche le thermomètre (liste des arrêts) d'une ligne.
- **Mode ROUTING_RESULTS** : Affiche les résultats d'une recherche d'itinéraire.
- **Mode TRIP_PLAN** : Affiche les étapes détaillées (Marche > Bus > Marche).

---

## ✨ Design & Animations

Tout le style est dans `App.css` et `index.css`.
Nous utilisons des **variables CSS** pour gérer facilemenent les couleurs (ex: `--bg-primary`).

Les animations (comme les fenêtres qui glissent) utilisent `@keyframes` :
- `slideInUp` : Pour faire monter un panneau.
- `slideInLeft` : Pour faire venir un menu de la gauche.
- `pulse` : Pour l'effet radar du point bleu.

---

## 🚀 Pour aller plus loin (Idées d'améliorations)

Si vous voulez contribuer, voici des idées :
1.  **Vrai Backend** : Connecter l'app à une base de données (Supabase/Firebase) pour sauvegarder les profils utilisateurs.
2.  **Horaires Réels** : Remplacer les horaires aléatoires par une vraie API de transport (GTFS).
3.  **Chat** : Ajouter une messagerie dans "Winek" pour parler aux amis sur la carte.

Bon code ! 💻
