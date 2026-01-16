// ============================================================================
// FICHIER: MapContainer.jsx
// ROLE: Gère l'affichage de la carte (Leaflet) et des pins (arrêts, bus, utilisateur)
// ============================================================================

// Import de la librairie "React Leaflet" qui permet d'afficher des cartes OpenStreetMap
import { MapContainer as LMap, TileLayer, CircleMarker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css' // Import obligatoire du style de la carte
import { useEffect, useState } from 'react'
import L from 'leaflet'
import { Locate } from 'lucide-react'

// ----------------------------------------------------------------------------
// CORRECTIF ICONES LEAFLET
// Par défaut, Leaflet a un bug avec React pour charger les images des pins.
// Ce bloc de code corrige ce problème en redéfinissant les icônes par défaut.
// ----------------------------------------------------------------------------
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// ----------------------------------------------------------------------------
// COMPOSANTS UTILITAIRES (Des petits morceaux de logique pour la carte)
// ----------------------------------------------------------------------------

// 1. Zoom Handler : Surveille le niveau de zoom
// Si l'utilisateur dézoome trop, on cache les petits arrêts pour ne pas surcharger la vue.
const MapEventsHandler = ({ setZoom }) => {
    const map = useMapEvents({
        zoomend: () => {
            setZoom(map.getZoom()); // Met à jour la variable 'zoomLevel'
        }
    });
    return null; // Ce composant n'affiche rien visuellement
}

// 2. Map Controller : Surveille où l'utilisateur regarde
// Met à jour la variable 'searchCenter' (le centre de l'écran) quand on bouge la carte.
const MapController = ({ setSearchCenter }) => {
    const map = useMap();
    useMapEvents({
        move: () => {
            // Optionnel : on pourrait limiter le nombre d'appels ici pour la performance
        },
        moveend: () => {
            const c = map.getCenter();
            setSearchCenter({ lat: c.lat, lng: c.lng });
        }
    });
    return null;
}

// 3. Re-center Button : Le bouton "Ma Position"
// Permet de revenir instantanément sur la position GPS de l'utilisateur.
const ReCenterButton = ({ userLocation }) => {
    const map = useMap();

    // Si on n'a pas encore la position GPS, on n'affiche pas le bouton
    if (!userLocation) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '120px', // On le place un peu haut pour ne pas être caché par le panneau du bas
            right: '16px',
            zIndex: 1000 // Au dessus de la carte
        }}>
            <button
                onClick={() => {
                    // Animation fluide ("flyTo") vers la position user
                    map.flyTo(userLocation, 16);
                }}
                style={{
                    width: '48px', height: '48px',
                    borderRadius: '50%',
                    background: '#fff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                }}
            >
                <Locate color="#007aff" size={20} />
            </button>
        </div>
    )
}


// ----------------------------------------------------------------------------
// COMPOSANT PRINCIPAL : AlgiersMap
// ----------------------------------------------------------------------------
const AlgiersMap = ({ searchCenter, setSearchCenter, userLocation, setUserLocation, transitData }) => {
    const INITIAL_CENTER = [36.752887, 3.042048] // Centre d'Alger par défaut
    const [zoomLevel, setZoomLevel] = useState(14); // Niveau de zoom initial

    // Effet pour demander la géolocalisation au navigateur
    useEffect(() => {
        if (navigator.geolocation) {
            // watchPosition écoute les mouvements en temps réel
            const watchId = navigator.geolocation.watchPosition((position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude])
            }, (err) => console.warn(err), { enableHighAccuracy: true });

            return () => navigator.geolocation.clearWatch(watchId); // Nettoyage quand on quitte
        }
    }, [setUserLocation])

    return (
        // LMap est le conteneur principal de la carte
        <LMap
            center={INITIAL_CENTER}
            zoom={14}
            scrollWheelZoom={true} // Permet de zoomer à la molette
            style={{ height: "100%", width: "100%", background: "#e5e5e7" }}
            zoomControl={false} // On cache les boutons +/- par défaut (on préfère le tactile)
        >
            {/* TileLayer : C'est le fond de carte (les images satellites ou plan) */}
            <TileLayer
                attribution='&copy; OSM'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Carte style sombre "Dark Mode"
                maxNativeZoom={19}
                maxZoom={22}
            />

            {/* Nos utilitaires invisibles */}
            <MapEventsHandler setZoom={setZoomLevel} />
            <MapController setSearchCenter={setSearchCenter} />
            <ReCenterButton userLocation={userLocation} />

            {/* 
                BOUCLE D'AFFICHAGE DES ARRÊTS 
                On ne les affiche que si on est assez zoomé (> 14) pour ne pas polluer l'écran.
            */}
            {zoomLevel > 14 && transitData.map(line => (
                line.stops && line.stops.map((stop, idx) => {
                    // Optimisation : On n'affiche que les arrêts proches du centre de l'écran (< 1200m)
                    // Cela évite de ralentir l'appli en affichant 5000 points invisibles.
                    let isClose = false;
                    if (searchCenter) {
                        const dist = L.latLng(searchCenter).distanceTo(L.latLng(stop.lat, stop.lng));
                        if (dist < 1200) isClose = true;
                    } else if (userLocation) {
                        const dist = L.latLng(userLocation).distanceTo(L.latLng(stop.lat, stop.lng));
                        if (dist < 1200) isClose = true;
                    } else {
                        isClose = true;
                    }

                    if (!isClose) return null;

                    return (
                        <CircleMarker
                            key={`${line.id}-stop-${idx}`}
                            center={[stop.lat, stop.lng]}
                            radius={5} // Taille du point
                            pathOptions={{
                                fillColor: '#fff', // Blanc à l'intérieur
                                color: line.color, // Couleur de la ligne de bus autour
                                weight: 2,
                                fillOpacity: 1
                            }}
                        />
                    )
                })
            ))}

            {/* 
                AFFICHAGE DE LA POSITION UTILISATEUR (Point Bleu)
            */}
            {userLocation && (
                <>
                    {/* Le cercle transparent autour (Halo) */}
                    <CircleMarker
                        center={userLocation}
                        radius={20}
                        pathOptions={{ fillColor: '#007aff', color: '#007aff', weight: 0, fillOpacity: 0.2 }}
                    />
                    {/* Le point bleu solide au centre */}
                    <CircleMarker
                        center={userLocation}
                        radius={8}
                        pathOptions={{ fillColor: '#007aff', color: '#fff', weight: 3, fillOpacity: 1 }}
                    />
                </>
            )}
        </LMap>
    )
}

export default AlgiersMap

