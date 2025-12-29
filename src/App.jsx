import { useState, useEffect } from 'react'
import { transitLines as initialLines, hydrateTransitData } from './data/algiersData'
import './styles/App.css'
import MapContainer from './components/MapContainer'
import NavBar from './components/NavBar'
import TransitUI from './components/TransitUI'
import Onboarding from './components/Onboarding'

function App() {
  const [searchCenter, setSearchCenter] = useState(null) // {lat, lng} of the map center (Pin)
  const [userLocation, setUserLocation] = useState(null) // {lat, lng} of the actual GPS
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [transitData, setTransitData] = useState(initialLines)
  const [userProfile, setUserProfile] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Load rich data on mount
  useEffect(() => {
    hydrateTransitData().then(data => setTransitData(data));

    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    } else {
      setShowOnboarding(true);
    }
  }, [])

  // Debug lock to preventing scrolling the body on mobile
  useEffect(() => {
    document.body.style.overflow = 'hidden';
  }, []);

  return (
    <div className="app-container">
      <div className="map-background">
        <MapContainer
          searchCenter={searchCenter}
          setSearchCenter={setSearchCenter}
          userLocation={userLocation}
          setUserLocation={setUserLocation}
          transitData={transitData}
        />

        {/* The Central Pin Overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 400,
          pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <div style={{
            width: '20px', height: '20px',
            background: 'rgba(255, 255, 255, 0.4)', // Halo
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite',
            marginBottom: '-10px'
          }} />
          {/* Pin Icon */}
          <div style={{
            width: '8px', height: '8px',
            background: '#000',
            borderRadius: '50%',
            border: '2px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }} />
        </div>
      </div>

      <div className="ui-layer">
        <NavBar
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          userProfile={userProfile}
        />

        {/* NEW: Use TransitUI instead of TransitList */}
        <TransitUI
          searchCenter={searchCenter}
          userLocation={userLocation}
          transitData={transitData}
        />

        {showOnboarding && (
          <Onboarding onComplete={(profile) => {
            setUserProfile(profile);
            setShowOnboarding(false);
          }} />
        )}
      </div>
    </div>
  )
}

export default App
