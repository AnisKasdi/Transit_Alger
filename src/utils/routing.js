// Utility to calculate distance between two coordinates in km
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Find routes between two locations
export const findRoutes = (startCoords, endCoords, transitData) => {
    // 1. Identify potential start and end stops (within 1km)
    const startStops = [];
    const endStops = [];

    const SEARCH_RADIUS = 1.0; // km

    transitData.forEach(line => {
        if (!line.stops) return;
        line.stops.forEach((stop, idx) => {
            const distToStart = getDistance(startCoords.lat, startCoords.lng, stop.lat, stop.lng);
            if (distToStart <= SEARCH_RADIUS) {
                startStops.push({ ...stop, lineId: line.id, lineName: line.name, lineColor: line.color, lineIcon: line.icon, lineLongName: line.longName, index: idx, dist: distToStart });
            }

            const distToEnd = getDistance(endCoords.lat, endCoords.lng, stop.lat, stop.lng);
            if (distToEnd <= SEARCH_RADIUS) {
                endStops.push({ ...stop, lineId: line.id, lineName: line.name, lineColor: line.color, lineIcon: line.icon, lineLongName: line.longName, index: idx, dist: distToEnd });
            }
        });
    });

    // 2. Find Direct Routes (Best)
    const directRoutes = [];

    startStops.forEach(start => {
        // Look for an end stop on the same line that is AFTER the start stop
        const validEnds = endStops.filter(end => end.lineId === start.lineId && end.index > start.index);

        validEnds.forEach(end => {
            // Found a valid direct trip
            const line = transitData.find(l => l.id === start.lineId);
            const stopsSegment = line.stops.slice(start.index, end.index + 1);
            const duration = (end.timeFromStart - start.timeFromStart) || (stopsSegment.length * 3); // Fallback calc

            // Calculate walking times
            const walkToStart = Math.ceil(start.dist * 15); // approx 15 min per km
            const walkFromEnd = Math.ceil(end.dist * 15);
            const totalDuration = walkToStart + duration + walkFromEnd;

            directRoutes.push({
                type: 'direct',
                line: line,
                startStop: start,
                endStop: end,
                startTime: new Date(), // Now
                walkToStart,
                transitDuration: duration,
                walkFromEnd,
                totalDuration: totalDuration,
                score: totalDuration // Lower is better
            });
        });
    });

    // Sort by fastest
    return directRoutes.sort((a, b) => a.score - b.score).slice(0, 5);
};
