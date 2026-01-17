// SERVICE: EtusaClient.js
// Handles all communication with the Etusa Proxy/API

const BASE_URL = '/api/etusa';

export const EtusaClient = {

    // 1. Fetch ALL stops (Huge JSON)
    // Endpoint: GET /recherche/arret
    getAllStops: async () => {
        try {
            const response = await fetch(`${BASE_URL}/recherche/arret`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            // Data format: [{ "id": 1, "nom": "Stop Name", "lat": "36.xxx", "lng": "3.xxx" }, ...]
            return data.map(stop => ({
                id: stop.id,
                name: stop.nom,
                lat: parseFloat(stop.lat),
                lng: parseFloat(stop.lng),
                lines: [] // Will be populated later if needed
            }));
        } catch (error) {
            console.error("ETUSA API Error (getAllStops):", error);
            return [];
        }
    },

    // 2. Fetch Lines for a specific Stop
    // Endpoint: POST /reseau/arretwithligne
    getLinesForStop: async (stopId) => {
        try {
            const response = await fetch(`${BASE_URL}/reseau/arretwithligne`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ arret_id: stopId })
            });
            const data = await response.json();
            // Normalize return data
            return data;
        } catch (error) {
            console.error("ETUSA API Error (getLinesForStop):", error);
            return [];
        }
    },

    // 3. Get Real-Time Schedule
    // Endpoint: POST /reseau/horaire
    getSchedule: async (lineId) => {
        try {
            const response = await fetch(`${BASE_URL}/reseau/horaire`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ligne: lineId })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("ETUSA API Error (getSchedule):", error);
            return null;
        }
    },

    // 4. Search Places/Stops
    // Endpoint: POST /recherche/search
    search: async (query) => {
        try {
            const response = await fetch(`${BASE_URL}/recherche/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("ETUSA API Error (search):", error);
            return [];
        }
    }
};
