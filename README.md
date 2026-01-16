# Transit Alger

Application web de navigation pour les transports en commun à Alger (Bus, Tram, Métro).
Ce projet utilise React.js et Leaflet pour la cartographie.

## Installation et Lancement

1.  **Installer les dépendances** :
    ```bash
    npm install
    ```

2.  **Lancer le serveur de développement** :
    ```bash
    npm run dev
    ```

3.  **Ouvrir** : Accédez à `http://localhost:5173` (ou le port indiqué) dans votre navigateur.

## Structure du Code

L'application est structurée de manière modulaire dans le dossier `src/` :

*   **`main.jsx`** : Point d'entrée de l'application React.
*   **`App.jsx`** : Composant racine. Il gère l'état global (position utilisateur, données de transport) et assemble la carte (`MapContainer`) et l'interface (`TransitUI`).
*   **`index.css`** & **`App.css`** : Feuilles de styles globales.

### Composants Principaux (`src/components/`)

*   **`MapContainer.jsx`** : Gère l'affichage de la carte interactive via `react-leaflet`.
    *   Affiche les tracés des lignes et les positions des arrêts.
    *   Gère la géolocalisation de l'utilisateur.
    *   Optimisation : Les arrêts ne s'affichent qu'à un certain niveau de zoom.

*   **`TransitUI.jsx`** : Interface utilisateur principale (panneau inférieur).
    *   Fonctionne comme une machine à états (`HOME`, `LINE_DETAILS`, `ROUTING`).
    *   Permet la recherche de lieux et le calcul d'itinéraires.
    *   Affiche les détails des lignes (horaires, liste des arrêts).

*   **`NavBar.jsx`** : Barre de navigation supérieure.
    *   Contient l'accès au profil utilisateur et aux raccourcis (Maison/Travail).
    *   Intègre les modales `SettingsModal` (Paramètres) et `WinekModal` (Social).

### Logique Métier (`src/utils/`)

*   **`routing.js`** : Contient l'algorithme de calcul d'itinéraire (simplifié pour le frontend).
    *   `findRoutes` : Identifie les arrêts proches du départ et de l'arrivée, puis cherche les correspondances directes.
    *   Utilise la formule de Haversine pour calculer les distances géographiques.

## Données

*   **`src/data/algiersData.js`** : Contient les données statiques des lignes de transport (nom, couleur, tracé, arrêts) utilisées pour le prototype.

## Technologies Utilisées

*   **React** : Bibliothèque d'interface utilisateur.
*   **Leaflet (react-leaflet)** : Affichage de cartes OpenStreetMap.
*   **Lucide React** : Collection d'icônes.
*   **Vite** : Outil de build et serveur de développement.
