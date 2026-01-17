// ============================================================================
// FICHIER: routing.js
// ROLE: Moteur de recherche d'itinéraire A* (A-Star)
// ============================================================================

const WALK_SPEED_KMPH = 5.0; // Vitesse de marche (km/h)
const BUS_SPEED_KMPH = 25.0; // Vitesse moyenne bus (km/h) estimée
const MAX_WALK_DIST_KM = 0.8; // Distance max de marche vers un arrêt

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Priority Queue minimaliste pour A*
class PriorityQueue {
    constructor() { this.items = []; }
    enqueue(element, priority) {
        this.items.push({ element, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }
    dequeue() { return this.items.shift(); }
    isEmpty() { return this.items.length === 0; }
}

export const findRoutes = async (startCoords, endCoords, transitData) => {
    console.log("🚀 Starting A* Routing...");
    if (!startCoords || !endCoords) return [];

    // --- CONSTRUCTION DU GRAPHE (IMPLICITE) ---

    // 1. Identifier les arrêts de départ et d'arrivée potentiels
    const allStops = [];
    transitData.forEach(line => {
        line.stops.forEach((stop, idx) => {
            allStops.push({ ...stop, lineId: line.id, lineName: line.name, color: line.color, idx });
        });
    });

    const startNode = { id: 'START', lat: startCoords.lat, lng: startCoords.lng, type: 'virtual' };
    const endNode = { id: 'END', lat: endCoords.lat, lng: endCoords.lng, type: 'virtual' };

    // --- ALGORITHME A* ---

    // Heuristique: Temps min (Marche/Vol d'oiseau) jusqu'à l'arrivée
    const heuristic = (node) => {
        const dist = getDistance(node.lat, node.lng, endNode.lat, endNode.lng);
        return (dist / BUS_SPEED_KMPH) * 60; // Minutes
    };

    const openSet = new PriorityQueue();
    openSet.enqueue(startNode, 0);

    const cameFrom = new Map(); // Pour reconstruire le chemin
    const gScore = new Map(); // Coût le moins cher pour arriver ici
    gScore.set(startNode.id, 0);

    const nodes = new Map(); // Stocker les objets noeuds par ID
    nodes.set(startNode.id, startNode);

    let count = 0;
    while (!openSet.isEmpty()) {
        const currentRef = openSet.dequeue();
        const current = currentRef.element;
        count++;

        if (count > 2000) break; // Sécurité boucle infinie

        // Si on est assez proche de l'arrivée (distance de marche), on tente de finir
        const distToEnd = getDistance(current.lat, current.lng, endNode.lat, endNode.lng);
        if (current.id === 'END' || distToEnd < 0.1) {
            return reconstructPath(cameFrom, current, endNode);
        }

        // --- VOISINS ---
        const neighbors = [];

        // CAS 1: Point de Départ (Virtuel) ou Arrêt -> Marcher vers Arrêts proches
        if (current.type === 'virtual' || current.type === 'stop') {
            // Chercher arrêts marchables
            allStops.forEach(stop => {
                const d = getDistance(current.lat, current.lng, stop.lat, stop.lng);
                const uniqueId = `STOP_${stop.lineId}_${stop.idx}`;
                if (d < MAX_WALK_DIST_KM) {
                    neighbors.push({
                        id: uniqueId,
                        node: { ...stop, id: uniqueId, type: 'stop' },
                        cost: (d / WALK_SPEED_KMPH) * 60, // Temps marche
                        action: 'WALK'
                    });
                }
            });

            // Marcher vers la destination finale
            if (distToEnd < MAX_WALK_DIST_KM) {
                neighbors.push({
                    id: 'END',
                    node: endNode,
                    cost: (distToEnd / WALK_SPEED_KMPH) * 60,
                    action: 'WALK_END'
                });
            }
        }

        // CAS 2: Arrêt de Bus -> Arrêt suivant (Transit)
        if (current.type === 'stop') {
            const line = transitData.find(l => l.id === current.lineId);
            if (line && current.idx < line.stops.length - 1) {
                const nextStop = line.stops[current.idx + 1];
                const uniqueId = `STOP_${line.id}_${current.idx + 1}`;

                // Estimation temps trajet (réel via nextDepartures si dispo, sinon dist/vitesse)
                const d = getDistance(current.lat, current.lng, nextStop.lat, nextStop.lng);
                const travelTime = (d / BUS_SPEED_KMPH) * 60 + 1; // +1 min pénalité arrêt

                neighbors.push({
                    id: uniqueId,
                    node: { ...nextStop, id: uniqueId, lineId: line.id, idx: current.idx + 1, type: 'stop' },
                    cost: travelTime,
                    action: 'RIDE',
                    line: line
                });
            }
        }

        // --- RELAXATION ---
        for (const neighbor of neighbors) {
            const tentativeGScore = gScore.get(current.id) + neighbor.cost;
            const neighborId = neighbor.id;

            if (tentativeGScore < (gScore.get(neighborId) || Infinity)) {
                cameFrom.set(neighborId, { from: current, action: neighbor.action, line: neighbor.line, cost: neighbor.cost });
                gScore.set(neighborId, tentativeGScore);
                nodes.set(neighborId, neighbor.node);

                const f = tentativeGScore + heuristic(neighbor.node);
                openSet.enqueue(neighbor.node, f);
            }
        }
    }

    return []; // Pas de chemin trouvé
};

const reconstructPath = (cameFrom, current, endNode) => {
    const path = [];
    let currId = current.id;

    // Si on a fini par marcher vers END, on l'ajoute
    if (currId !== 'END') {
        // Logic to handle exact end snap if needed
    }

    while (cameFrom.has(currId)) {
        const step = cameFrom.get(currId);
        path.push({
            to: currId,
            from: step.from.id,
            action: step.action,
            line: step.line,
            cost: step.cost
        });
        currId = step.from.id;
    }
    path.reverse();

    // Convert A* steps to Transit App Route Format
    return formatRouteResult(path, endNode);
}

const formatRouteResult = (steps, endNode) => {
    if (!steps.length) return [];

    // Simplification: On regroupe les segments RIDE consécutifs
    const simplified = [];
    let currentSegment = null;

    steps.forEach(step => {
        if (step.action === 'RIDE') {
            if (currentSegment && currentSegment.type === 'BUS' && currentSegment.line.id === step.line.id) {
                currentSegment.duration += step.cost;
                currentSegment.endStop = step.to;
            } else {
                if (currentSegment) simplified.push(currentSegment);
                currentSegment = { type: 'BUS', line: step.line, duration: step.cost, startStop: step.from, endStop: step.to, color: step.line.color };
            }
        } else if (step.action === 'WALK' || step.action === 'WALK_END') {
            if (currentSegment) simplified.push(currentSegment);
            currentSegment = { type: 'WALK', duration: step.cost, color: '#999' };
        }
    });
    if (currentSegment) simplified.push(currentSegment);

    // Create the final object expected by TransitUI
    const totalDuration = simplified.reduce((acc, s) => acc + s.duration, 0);
    const mainLine = simplified.find(s => s.type === 'BUS')?.line;

    return [{
        id: 'real-route-' + Date.now(),
        line: mainLine || { name: 'Marche', color: '#999' }, // Fallback
        segments: simplified,
        totalDuration: Math.ceil(totalDuration),
        score: totalDuration,
        startTime: new Date(),
        arrival: new Date(Date.now() + totalDuration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
};

