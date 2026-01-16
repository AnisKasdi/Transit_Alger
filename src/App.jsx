// ============================================================================
// FICHIER: App.jsx
// ROLE: Point d'entrée principal de l'interface utilisateur.
// C'est ici que tout s'assemble : la Carte (Map), l'Interface (UI), et les Données.
// ============================================================================

import { useState, useEffect } from 'react'

// Import des données de transport (lignes de bus, tram, métro)
// hydrateTransitData sert à charger des données plus complexes si besoin
import { transitLines as initialLines, hydrateTransitData } from './data/algiersData'

import './styles/App.css'

// Import des composants enfants (les briques de notre application)
import MapContainer from './components/MapContainer' // La carte Leaflet (fond)
import NavBar from './components/NavBar'             // La barre de menu et profil (haut)
import TransitUI from './components/TransitUI'       // Le panneau glissant avec les lignes et itinéraires (bas)
import Onboarding from './components/Onboarding'     // L'écran d'accueil pour la première visite

function App() {
  // -------------------------------------------------------------
  // GESTION D'ETAT (STATE) : La "mémoire" de l'application
  // -------------------------------------------------------------

  // 'searchCenter' : Où l'utilisateur veut regarder sur la carte (indépendant de sa position GPS)
  // Format : { lat: x, lng: y } ou null
  const [searchCenter, setSearchCenter] = useState(null)

  // 'userLocation' : La vraie position GPS de l'utilisateur
  // Format : { lat: x, lng: y } ou null
  const [userLocation, setUserLocation] = useState(null)

  // 'isMenuOpen' : Est-ce que le menu latéral est ouvert ? (true/false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 'transitData' : La liste complète des lignes de transport chargées
  const [transitData, setTransitData] = useState(initialLines)

  // 'userProfile' : Les infos de l'utilisateur connecté (Nom, Avatar...)
  const [userProfile, setUserProfile] = useState(null)

  // 'showOnboarding' : Doit-on montrer l'écran de bienvenue ?
  const [showOnboarding, setShowOnboarding] = useState(false)

  // -------------------------------------------------------------
  // EFFETS (EFFECTS) : Ce qui se passe au chargement
  // -------------------------------------------------------------

  // 1. Au démarrage (tableau vide []), on charge les données et le profil
  useEffect(() => {
    // On charge les données complètes (hydrate) et on met à jour 'transitData'
    hydrateTransitData().then(data => setTransitData(data));

    // On regarde si l'utilisateur est déjà enregistré dans le navigateur (localStorage)
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile)); // On restaure son profil
    } else {
      // Si pas de profil, on pourrait montrer l'onboarding (désactivé pour l'instant pour le test)
      // setShowOnboarding(true); 
    }
  }, [])

  // 2. On bloque le scroll de la page entière pour avoir une sensation d'app mobile native
  useEffect(() => {
    document.body.style.overflow = 'hidden';
  }, []);

  // -------------------------------------------------------------
  // RENDU (RENDER) : Ce qui est affiché à l'écran
  // -------------------------------------------------------------
  return (
    <div className="app-container">

      {/* 
          COUCHE 1 : LA CARTE (ARRIÈRE-PLAN) 
          C'est ce qui est tout au fond.
      */}
      <div className="map-background">
        <MapContainer
          searchCenter={searchCenter}
          setSearchCenter={setSearchCenter}
          userLocation={userLocation}
          setUserLocation={setUserLocation}
          transitData={transitData}
        />

        {/* 
            Le "Pin" (Punaise) central fixe
            C'est purement visuel, ça reste toujours au milieu de l'écran
            pour montrer ce qu'on vise.
        */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)', // On centre parfaitement
          zIndex: 400, // Au dessus de la carte
          pointerEvents: 'none', // Permet de cliquer à travers sur la carte
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          {/* L'effet de halo pulse */}
          <div style={{
            width: '20px', height: '20px',
            background: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite',
            marginBottom: '-10px'
          }} />
          {/* Le point noir central */}
          <div style={{
            width: '8px', height: '8px',
            background: '#000',
            borderRadius: '50%',
            border: '2px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }} />
        </div>
      </div>

      {/* 
          COUCHE 2 : L'INTERFACE UTILISATEUR (AVANT-PLAN) 
          NavBar, Boutons, Volets glissants...
          Tout ça vient se poser PAR DESSUS la carte.
      */}
      <div className="ui-layer">

        {/* La barre du haut (Profil, Winek...) */}
        <NavBar
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          userProfile={userProfile}
        />

        {/* Le panneau du bas (Lignes proches, Itinéraires...) */}
        <TransitUI
          searchCenter={searchCenter}
          userLocation={userLocation}
          transitData={transitData}
        />

        {/* L'écran d'accueil (ne s'affiche que si showOnboarding est vrai) */}
        {showOnboarding && (
          <Onboarding onComplete={(profile) => {
            if (profile) setUserProfile(profile);
            setShowOnboarding(false);
          }} />
        )}
      </div>
    </div>
  )
}

export default App

