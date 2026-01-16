// ============================================================================
// FICHIER: routing.js
// ROLE: Cerveau du calcul d'itinéraire (GPS)
// ============================================================================

// Cette fonction calcule la distance (en KM) entre deux points GPS (Latitude, Longitude).
// Elle utilise une formule mathématique appelée "Formule de Haversine".
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km (c'est une constante physique)

    // On convertit les degrés en radians car les fonctions Math.sin/cos attendent des radians
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    // Calcul de la distance "à vol d'oiseau" sur une sphère
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance finale en KM
};

// Fonction principale exportée : Trouve des itinéraires entre un point A et un point B
// startCoords: { lat: ..., lng: ... } (Départ)
// endCoords: { lat: ..., lng: ... } (Arrivée)
// transitData: La liste de toutes les lignes de bus et leurs arrêts
export const findRoutes = (startCoords, endCoords, transitData) => {

    // ---------------------------------------------------------
    // ETAPE 1 : Identifier les arrêts proches du DEPART et de l'ARRIVÉE
    // ---------------------------------------------------------
    const startStops = []; // Va contenir tous les arrêts à < 1km du départ
    const endStops = [];   // Va contenir tous les arrêts à < 1km de l'arrivée

    const SEARCH_RADIUS = 1.0; // Rayon de recherche : 1 km

    // On parcourt chaque ligne de bus disponible
    transitData.forEach(line => {
        if (!line.stops) return; // Sécurité : si la ligne n'a pas d'arrêts, on l'ignore

        // On parcourt chaque arrêt de la ligne
        line.stops.forEach((stop, idx) => {

            // Calcul distance Arret <-> Point de Départ choisi par l'utilisateur
            const distToStart = getDistance(startCoords.lat, startCoords.lng, stop.lat, stop.lng);
            if (distToStart <= SEARCH_RADIUS) {
                // Si c'est proche, on l'ajoute à la liste des départs possibles
                startStops.push({
                    ...stop, // On garde toutes les infos de l'arrêt (nom, lat, lng...)
                    lineId: line.id, // On note à quelle ligne il appartient
                    lineName: line.name,
                    lineColor: line.color,
                    lineIcon: line.icon,
                    lineLongName: line.longName,
                    index: idx, // Important : L'ordre de l'arrêt dans la ligne (1er, 2eme, 3eme...)
                    dist: distToStart
                });
            }

            // Calcul distance Arret <-> Point d'Arrivée choisi par l'utilisateur
            const distToEnd = getDistance(endCoords.lat, endCoords.lng, stop.lat, stop.lng);
            if (distToEnd <= SEARCH_RADIUS) {
                // Si c'est proche, on l'ajoute à la liste des arrivées possibles
                endStops.push({
                    ...stop,
                    lineId: line.id,
                    lineName: line.name,
                    lineColor: line.color,
                    lineIcon: line.icon,
                    lineLongName: line.longName,
                    index: idx,
                    dist: distToEnd
                });
            }
        });
    });

    // ---------------------------------------------------------
    // ETAPE 2 : Trouver les routes DIRECTES
    // "Est-ce qu'il y a une ligne qui passe par un arrêt de départ ET un arrêt d'arrivée ?"
    // ---------------------------------------------------------
    const directRoutes = [];

    // Pour chaque arrêt de départ potentiel...
    startStops.forEach(start => {
        // ...on cherche s'il existe un arrêt d'arrivée SUR LA MEME LIGNE (même lineId)
        // ET qui se trouve APRES l'arrêt de départ (index > start.index)
        const validEnds = endStops.filter(end => end.lineId === start.lineId && end.index > start.index);

        validEnds.forEach(end => {
            // BRAVO ! On a trouvé un trajet direct.

            // On récupère les infos de la ligne entière
            const line = transitData.find(l => l.id === start.lineId);

            // On isole les arrêts intermédiaires (entre départ et arrivée)
            const stopsSegment = line.stops.slice(start.index, end.index + 1);

            // Estimation du temps de trajet en bus :
            // Soit on a une info 'timeFromStart', soit on estime (3 min par arrêt)
            const duration = (end.timeFromStart - start.timeFromStart) || (stopsSegment.length * 3);

            // Estimation du temps de marche à pied
            const walkToStart = Math.ceil(start.dist * 15); // On marche à 4km/h environ => 15 min pour 1km
            const walkFromEnd = Math.ceil(end.dist * 15);

            const totalDuration = walkToStart + duration + walkFromEnd;

            // On crée l'objet "Itinéraire" final
            directRoutes.push({
                type: 'direct',
                line: line,
                startStop: start,
                endStop: end,
                startTime: new Date(), // Date du calcul
                walkToStart,       // Temps marche jusqu'à l'arrêt
                transitDuration: duration, // Temps dans le bus
                walkFromEnd,       // Temps marche depuis l'arrêt jusqu'à destination
                totalDuration: totalDuration, // Temps total
                score: totalDuration // Le score sert à trier (le plus court est le mieux)
            });
        });
    });

    // ---------------------------------------------------------
    // ETAPE 3 : Trier et renvoyer les résultats
    // ---------------------------------------------------------

    // On trie du plus rapide au moins rapide
    // Et on ne garde que les 5 meilleurs (slice 0, 5)
    return directRoutes.sort((a, b) => a.score - b.score).slice(0, 5);
};

