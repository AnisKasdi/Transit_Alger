import { MapContainer as LMap, TileLayer, CircleMarker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
// import { transitLines } from '../data/algiersData' // use prop instead
import { useEffect, useState } from 'react'
import L from 'leaflet'
import { Locate } from 'lucide-react'

// Fix icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 1. Zoom Handler to track map zoom level
const MapEventsHandler = ({ setZoom }) => {
    const map = useMapEvents({
        zoomend: () => {
            setZoom(map.getZoom());
        }
    });
    return null;
}

// 2. Map Controller to sync Search Center
const MapController = ({ setSearchCenter }) => {
    const map = useMap();
    useMapEvents({
        move: () => {
            // Optional: throttling could be added here
        },
        moveend: () => {
            const c = map.getCenter();
            setSearchCenter({ lat: c.lat, lng: c.lng });
        }
    });
    return null;
}

// 3. Re-center Button
const ReCenterButton = ({ userLocation }) => {
    const map = useMap();

    if (!userLocation) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '120px', // Adjusted to be above the folded sheet (approx 15-20%)
            right: '16px',
            zIndex: 1000
        }}>
            <button
                onClick={() => {
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


const AlgiersMap = ({ searchCenter, setSearchCenter, userLocation, setUserLocation, transitData }) => {
    const INITIAL_CENTER = [36.752887, 3.042048]
    const [zoomLevel, setZoomLevel] = useState(14);

    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition((position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude])
            }, (err) => console.warn(err), { enableHighAccuracy: true });

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [setUserLocation])

    return (
        <LMap
            center={INITIAL_CENTER}
            zoom={14}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", background: "#e5e5e7" }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; OSM'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <MapEventsHandler setZoom={setZoomLevel} />
            <MapController setSearchCenter={setSearchCenter} />
            <ReCenterButton userLocation={userLocation} />

            {/* Render Stops ONLY if zoomed in > 14 AND close to user */}
            {zoomLevel > 14 && transitData.map(line => (
                line.stops && line.stops.map((stop, idx) => {
                    // Proximity check: only show if < 1km from MAP CENTER (not just user)
                    let isClose = false;
                    if (searchCenter) {
                        const dist = L.latLng(searchCenter).distanceTo(L.latLng(stop.lat, stop.lng));
                        if (dist < 1200) isClose = true;
                    } else if (userLocation) {
                        const dist = L.latLng(userLocation).distanceTo(L.latLng(stop.lat, stop.lng));
                        if (dist < 1200) isClose = true;
                    } else {
                        isClose = true; // Fallback
                    }

                    if (!isClose) return null;

                    return (
                        <CircleMarker
                            key={`${line.id}-stop-${idx}`}
                            center={[stop.lat, stop.lng]}
                            radius={5}
                            pathOptions={{
                                fillColor: '#fff',
                                color: line.color,
                                weight: 2,
                                fillOpacity: 1
                            }}
                        />
                    )
                })
            ))}

            {/* User Location Pulse */}
            {userLocation && (
                <>
                    {/* Outer Pulse (Animation handled by CSS in App.css usually, or simulated here with transparency) */}
                    <CircleMarker
                        center={userLocation}
                        radius={20}
                        pathOptions={{ fillColor: '#007aff', color: '#007aff', weight: 0, fillOpacity: 0.2 }}
                    />
                    {/* Inner Dot */}
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
