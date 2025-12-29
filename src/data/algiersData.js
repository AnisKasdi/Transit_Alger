import etusaRaw from './etusa_raw.json';

// Helper to calculate a consistent color from string (line name)
const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
}

// Fixed Manual Data (Metro & Tram)
const fixedLines = [
    {
        id: 'metro-1',
        type: 'metro',
        name: '1',
        longName: 'Place des Martyrs <-> Haï El Badr',
        color: '#007aff',
        icon: 'M',
        schedule: [2, 7, 12],
        stops: [
            { name: "Place des Martyrs", lat: 36.7856, lng: 3.0603 },
            { name: "Ali Boumendjel", lat: 36.7811, lng: 3.0586 },
            { name: "Tafourah - Grande Poste", lat: 36.7766, lng: 3.0573 },
            { name: "Khelifa Boukhalfa", lat: 36.7719, lng: 3.0551 },
            { name: "1er Mai", lat: 36.7658, lng: 3.0560 },
            { name: "Aïssat Idir", lat: 36.7629, lng: 3.0583 },
            { name: "Hamma", lat: 36.7571, lng: 3.0645 },
            { name: "Jardin d'Essai", lat: 36.7513, lng: 3.0722 },
            { name: "Les Fusillés", lat: 36.7482, lng: 3.0768 },
            { name: "Cité Amirouche", lat: 36.7437, lng: 3.0850 },
            { name: "Cité Mer et Soleil", lat: 36.7398, lng: 3.0905 },
            { name: "Haï El Badr", lat: 36.7317, lng: 3.0967 }
        ]
    },
    {
        id: 'tram-1',
        type: 'tram',
        name: 'T1',
        longName: 'Ruisseau <-> Dergana',
        color: '#ff9500',
        icon: 'T',
        schedule: [5, 15, 25],
        stops: [
            { name: "Ruisseau", lat: 36.7468, lng: 3.0759 },
            { name: "Les Fusillés", lat: 36.7481, lng: 3.0769 },
            { name: "Tripoli-Thaalibia", lat: 36.7495, lng: 3.0805 },
            { name: "Caroubier", lat: 36.7533, lng: 3.1002 },
            { name: "La Glacière", lat: 36.7478, lng: 3.1042 },
            { name: "El Harrach Gare", lat: 36.7212, lng: 3.1418 }
        ]
    }
];

// Initial Data (Unhydrated)
const initialEtusaLines = etusaRaw.map(line => {
    const stopsRaw = line.itineraire.aller || [];
    const processedStops = stopsRaw.map((s, idx) => ({
        id: `stop-${line.idLigne}-${idx}`,
        name: s.nom,
        lat: parseFloat(s.lat),
        lng: parseFloat(s.lon),
        timeFromStart: idx * 3,
        isBigStop: idx === 0 || idx === stopsRaw.length - 1
    }));

    const start = processedStops[0]?.name || "Départ";
    const end = processedStops[processedStops.length - 1]?.name || "Terminus";

    return {
        id: `bus-etusa-${line.idLigne}`,
        type: 'bus',
        name: line.nomLigne.replace('L', ''),
        longName: `${start} <-> ${end}`,
        color: stringToColor(line.nomLigne),
        icon: 'B',
        schedule: [5, 10, 15, 25, 40],
        stops: processedStops,
        originalData: line
    };
});

export const transitLines = [...fixedLines, ...initialEtusaLines];

// Async Hydrator
export const hydrateTransitData = async () => {
    try {
        const response = await fetch('/alger_stops.json');
        const stopDatabase = await response.json();

        const hydratedEtusa = etusaRaw.map(line => {
            const stopsRaw = line.itineraire.aller || [];

            const processedStops = stopsRaw.map((s, idx) => {
                const normalize = (str) => str?.toLowerCase().trim().replace(/\s+/g, ' ');
                const sName = normalize(s.nom);
                const dbStop = stopDatabase.find(dbS => normalize(dbS.nom) === sName);

                return {
                    id: `stop-${line.idLigne}-${idx}`,
                    name: dbStop ? dbStop.nom : s.nom,
                    name_ar: dbStop ? dbStop.nom_ar : "",
                    lat: dbStop ? parseFloat(dbStop.lat) : parseFloat(s.lat),
                    lng: dbStop ? parseFloat(dbStop.lon) : parseFloat(s.lon),
                    commune: dbStop ? dbStop.commune : "",
                    timeFromStart: idx * 3,
                    isBigStop: idx === 0 || idx === stopsRaw.length - 1
                };
            });
            const start = processedStops[0]?.name || "Départ";
            const end = processedStops[processedStops.length - 1]?.name || "Terminus";

            return {
                id: `bus-etusa-${line.idLigne}`,
                type: 'bus',
                name: line.nomLigne.replace('L', ''),
                longName: `${start} <-> ${end}`,
                color: stringToColor(line.nomLigne),
                icon: 'B',
                schedule: [5, 10, 15, 25, 40],
                stops: processedStops,
                originalData: line
            };
        });

        // Debug: Log success
        console.log(`Hydrated ${hydratedEtusa.length} lines with improved data.`);
        return [...fixedLines, ...hydratedEtusa];

    } catch (e) {
        console.error("Failed to hydrate data:", e);
        return transitLines; // Fallback to basic
    }
}
