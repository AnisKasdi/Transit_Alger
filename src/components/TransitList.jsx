import { Navigation, ArrowLeft, ArrowRightLeft, MapPinOff, MoreHorizontal, Search, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { findRoutes } from '../utils/routing'
import { transitLines } from '../data/algiersData'

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const getNextDepartures = (line, userLat, userLng, isReversed) => {
    // Mock logic for departures
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    if (line.operatingHours && (currentHour < line.operatingHours.start || currentHour > line.operatingHours.end)) {
        return ["Fermé"];
    }
    const seedOffset = line.id.length * 2;
    // Generate 2 random times
    return [Math.floor(Math.random() * 10) + 2, Math.floor(Math.random() * 20) + 12];
}

const TransitList = ({ searchCenter, userLocation, transitData }) => {
    const [sortedLines, setSortedLines] = useState(transitData || []);
    const [destination, setDestination] = useState('');
    const [selectedLine, setSelectedLine] = useState(null);
    const [tripPlan, setTripPlan] = useState(null); // { line, startStop, endStop, startTime }
    const [searchSuggestions, setSearchSuggestions] = useState([]);

    // Routing State
    const [routes, setRoutes] = useState([]);
    const [isRoutingMode, setIsRoutingMode] = useState(false);
    const [selectedDestinationName, setSelectedDestinationName] = useState('');

    // Search Logic
    useEffect(() => {
        if (destination.length > 1) {
            const matches = [];
            transitData.forEach(line => {
                line.stops?.forEach(stop => {
                    if (stop.name.toLowerCase().includes(destination.toLowerCase()) && !matches.find(m => m.name === stop.name)) {
                        matches.push({ type: 'stop', name: stop.name, lat: stop.lat, lng: stop.lng, details: `${line.name} ${line.longName}` });
                    }
                });
            });
            // Mock some places
            if ("maison".includes(destination.toLowerCase())) matches.push({ type: 'place', name: 'Maison', lat: 36.7525, lng: 3.0420, details: 'Domicile enregistré' });
            if ("universite".includes(destination.toLowerCase())) matches.push({ type: 'place', name: 'USTHB', lat: 36.7118, lng: 3.1805, details: 'Bab Ezzouar' });

            setSearchSuggestions(matches.slice(0, 5));
        } else {
            setSearchSuggestions([]);
        }
    }, [destination, transitData]);

    // Bottom Sheet Logic
    const [sheetHeight, setSheetHeight] = useState(window.innerHeight * 0.4); // Default 40%
    const sheetRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startHeight, setStartHeight] = useState(0);

    const MIN_HEIGHT = window.innerHeight * 0.15;
    const MID_HEIGHT = window.innerHeight * 0.4;
    const MAX_HEIGHT = window.innerHeight * 0.92;

    useEffect(() => {
        if (searchCenter || userLocation) {
            const lat = searchCenter ? searchCenter.lat : userLocation?.lat;
            const lng = searchCenter ? searchCenter.lng : userLocation?.lng;
            if (!lat || !lng) return;
            const dataToProcess = transitData || [];
            const linesWithData = dataToProcess.map(line => {
                if (!line.stops) return { ...line, distance: 9999, realTimes: [] };
                const closestStopVal = Math.min(...line.stops.map(stop => calculateDistance(lat, lng, stop.lat, stop.lng)));
                const times = getNextDepartures(line, lat, lng, false);
                return { ...line, distance: closestStopVal, realTimes: times };
            });
            linesWithData.sort((a, b) => a.distance - b.distance);
            setSortedLines(linesWithData);
        }
    }, [searchCenter, userLocation, transitData]);

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartY(e.touches[0].clientY);
        setStartHeight(sheetHeight);
    }

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const deltaY = startY - e.touches[0].clientY;
        const newHeight = startHeight + deltaY;
        if (newHeight > MIN_HEIGHT && newHeight < MAX_HEIGHT) {
            setSheetHeight(newHeight);
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false);
        // Snap logic
        if (sheetHeight > (MID_HEIGHT + MAX_HEIGHT) / 2) setSheetHeight(MAX_HEIGHT);
        else if (sheetHeight > (MIN_HEIGHT + MID_HEIGHT) / 2) setSheetHeight(MID_HEIGHT);
        else setSheetHeight(MIN_HEIGHT);
    }

    const formatDistance = (dist) => {
        if (!dist || dist === 9999) return '';
        if (dist >= 1) return `${dist.toFixed(1)} km`;
        return `${Math.round(dist * 1000)} m`;
    };

    // --- Sub-components (Transit Style) ---

    const LineRow = ({ line }) => (
        <div
            onClick={() => { setSelectedLine(line); setSheetHeight(MID_HEIGHT); }}
            style={{
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', cursor: 'pointer'
            }}
        >
            {/* Icon */}
            <div style={{
                width: '42px', height: '42px',
                background: line.color, borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: '800', color: '#fff',
                boxShadow: `0 2px 8px ${line.color}40`
            }}>
                {line.name}
            </div>

            {/* Info */}
            <div style={{ flex: 1, marginLeft: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '2px' }}>
                    {line.longName.split('<->')[1]?.trim() || line.longName}
                </div>
                <div style={{ fontSize: '13px', color: '#8e8e93', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowRightLeft size={10} />
                    {line.longName.split('<->')[0]?.trim()} • {formatDistance(line.distance)}
                </div>
            </div>

            {/* Times */}
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#2ecc71' }}>
                    {line.realTimes?.[0] || '--'}<span style={{ fontSize: '12px', fontWeight: '500' }}>{line.realTimes?.[0] ? ' min' : ''}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                    {line.realTimes?.[1] ? `${line.realTimes[1]} min` : ''}
                </div>
            </div>
        </div>
    );

    // --- SELECTED LINE VIEW (Transit Style) ---
    if (selectedLine) {
        return (
            <div className="sheet-container" style={{
                height: sheetHeight,
                transition: isDragging ? 'none' : 'height 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
                background: '#1c1c1e', // Enforce solid background
                zIndex: 2002 // Higher than the list view if overlapping
            }}>
                {/* Header Actions */}
                <div style={{
                    padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div onClick={() => setSelectedLine(null)} style={{
                        width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}>
                        <ArrowLeft size={18} color="#fff" />
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>{selectedLine.name}</div>
                    <div style={{ width: '32px' }} /> {/* Spacer */}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
                    <div style={{ margin: '20px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '8px' }}>Prochain départ</div>
                        <div style={{ fontSize: '48px', fontWeight: '800', color: selectedLine.color, lineHeight: 1 }}>
                            {selectedLine.realTimes?.[0] || '--'}<span style={{ fontSize: '18px' }}>{selectedLine.realTimes?.[0] ? 'min' : ''}</span>
                        </div>
                    </div>

                    {/* GO Button */}
                    {/* GO Button */}
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            setTripPlan({
                                line: selectedLine,
                                startStop: selectedLine.stops[0],
                                endStop: selectedLine.stops[selectedLine.stops.length - 1],
                                startTime: new Date()
                            });
                        }}
                        style={{
                            background: '#2ecc71', borderRadius: '30px', padding: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', fontWeight: '800', color: '#000', cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(46, 204, 113, 0.3)',
                            marginBottom: '32px'
                        }}>
                        GO
                    </div>

                    {/* Stops List (Transit Clone) */}
                    <div style={{ paddingBottom: '40px', position: 'relative' }}>
                        {/* Continuous Vertical Line */}
                        <div style={{
                            position: 'absolute', top: '10px', bottom: '30px', left: '15px',
                            width: '4px', background: selectedLine.color, borderRadius: '2px'
                        }} />

                        {selectedLine.stops && selectedLine.stops.map((stop, idx) => (
                            <div key={idx}
                                onClick={() => setTripPlan({
                                    line: selectedLine,
                                    startStop: selectedLine.stops[0],
                                    endStop: stop,
                                    startTime: new Date()
                                })}
                                style={{ display: 'flex', padding: '12px 0', position: 'relative', alignItems: 'flex-start', cursor: 'pointer' }}>

                                {/* Dot on Line */}
                                <div style={{
                                    width: '14px', height: '14px', borderRadius: '50%',
                                    background: '#1c1c1e', border: `3px solid ${selectedLine.color}`,
                                    zIndex: 2, marginLeft: '10px', marginTop: '4px', marginRight: '20px'
                                }} />

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{stop.name}</div>
                                    {stop.name_ar && <div style={{ fontSize: '14px', color: '#8e8e93', marginTop: '2px', fontFamily: 'Arabic, sans-serif' }}>{stop.name_ar}</div>}
                                </div>

                                {/* Right Aligned Bold Time */}
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                                    {new Date(Date.now() + (stop.timeFromStart || 0) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // --- TRIP PLANNER VIEW (Green Header) ---
    if (tripPlan) {
        const arrivalTime = new Date(tripPlan.startTime.getTime() + (tripPlan.endStop.timeFromStart || 15) * 60000 + 10 * 60000); // +10min walk
        return (
            <div className="sheet-container" style={{
                height: sheetHeight,
                transition: isDragging ? 'none' : 'height 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
                background: '#fff', // Light mode for Trip Plan usually, or keep dark. user asked for Transit clone. Transit is green/white mostly.
                zIndex: 2003
            }}>
                {/* Green Header */}
                <div style={{ background: '#2ecc71', padding: '12px 16px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div onClick={() => setTripPlan(null)} style={{ cursor: 'pointer' }}><ArrowLeft size={24} /></div>
                    <div style={{ fontWeight: '700', fontSize: '18px' }}>Itinéraire</div>
                    <div style={{ width: '24px' }}></div>
                </div>

                {/* Trip Summary Card */}
                <div style={{ background: '#2ecc71', padding: '0 16px 16px 16px', color: '#fff', marginBottom: '10px' }}>
                    <div style={{ background: 'white', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Départ</div>
                            <div style={{ color: '#000', fontSize: '18px', fontWeight: '800' }}>{tripPlan.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div style={{ color: '#888', fontSize: '14px' }}><ArrowRightLeft size={16} /></div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Arrivée</div>
                            <div style={{ color: '#000', fontSize: '18px', fontWeight: '800' }}>{arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                </div>

                {/* Segment List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f5f5f5' }}>

                    {/* Segment 1: Walk */}
                    <div style={{ display: 'flex', minHeight: '60px' }}>
                        <div style={{ width: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '10px', height: '10px', background: '#888', borderRadius: '50%' }} />
                            <div style={{ width: '2px', flex: 1, background: '#ccc', borderLeft: '2px dashed #888' }} />
                        </div>
                        <div style={{ flex: 1, paddingBottom: '20px' }}>
                            <div style={{ fontWeight: '700', color: '#333', fontSize: '16px' }}>Position actuelle</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', marginTop: '4px' }}>
                                <Navigation size={14} /> <span>Marcher 5 min</span>
                            </div>
                        </div>
                    </div>

                    {/* Segment 2: BUS */}
                    <div style={{ display: 'flex', minHeight: '100px' }}>
                        <div style={{ width: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `4px solid ${tripPlan.line.color}`, background: '#fff' }} />
                            <div style={{ width: '4px', flex: 1, background: tripPlan.line.color }} />
                        </div>
                        <div style={{ flex: 1, paddingBottom: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <div style={{ background: tripPlan.line.color, color: '#fff', padding: '4px 8px', borderRadius: '6px', fontWeight: '800' }}>{tripPlan.line.name}</div>
                                <div style={{ color: '#333', fontWeight: '700' }}>Direction {tripPlan.line.longName.split('<->')[1]}</div>
                            </div>
                            <div style={{ color: '#666', fontSize: '13px' }}>Descendre à {tripPlan.endStop.name}</div>
                            <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>4 arrêts • 12 min</div>
                        </div>
                    </div>

                    {/* Segment 3: Walk to destination */}
                    <div style={{ display: 'flex' }}>
                        <div style={{ width: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#333' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', color: '#333', fontSize: '16px' }}>{tripPlan.endStop.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', marginTop: '4px' }}>
                                <span>Arrivé à destination</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        )
    }

    // --- DIRECTIONS / ROUTES LIST VIEW ---
    if (isRoutingMode) {
        return (
            <div className="sheet-container" style={{
                height: sheetHeight,
                transition: isDragging ? 'none' : 'height 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
                background: '#1c1c1e', zIndex: 2002
            }}>
                {/* Header Inputs */}
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div onClick={() => { setIsRoutingMode(false); setRoutes([]); setDestination(''); }} style={{ cursor: 'pointer' }}><ArrowLeft size={20} color="#fff" /></div>
                        <div style={{ flex: 1, background: '#2c2c2e', padding: '8px 12px', borderRadius: '8px', color: '#888', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3498db' }} />
                            <span style={{ fontSize: '14px' }}>Ma position</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '30px' }}>
                        <div style={{ flex: 1, background: '#2c2c2e', padding: '8px 12px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e74c3c' }} />
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{selectedDestinationName}</span>
                        </div>
                    </div>
                </div>

                {/* Routes List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                    <div style={{ padding: '16px 16px 8px 16px', fontSize: '12px', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase' }}>Meilleurs Trajets</div>

                    {routes.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                            Aucun itinéraire direct trouvé 😔<br /><span style={{ fontSize: '12px' }}>Essayez de vous rapprocher d'une ligne.</span>
                        </div>
                    ) : (
                        routes.map((route, idx) => (
                            <div key={idx}
                                onClick={() => setTripPlan(route)}
                                style={{
                                    padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {/* Line Icon */}
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '8px', background: route.line.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px', fontWeight: '800', color: '#fff', boxShadow: `0 2px 8px ${route.line.color}40`
                                    }}>
                                        {route.line.name}
                                    </div>

                                    <div>
                                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px', marginBottom: '2px' }}>
                                            {route.line.longName.split('<->')[1]}
                                        </div>
                                        <div style={{ color: '#8e8e93', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Navigation size={12} /> {route.walkToStart} min <ArrowRightLeft size={10} /> {route.transitDuration} min
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#2ecc71' }}>
                                        {route.totalDuration} <span style={{ fontSize: '12px' }}>min</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>
                                        {new Date(Date.now() + route.totalDuration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )
    }

    // --- MAIN LIST VIEW ---
    return (
        <div
            ref={sheetRef}
            className="sheet-container"
            style={{
                height: sheetHeight,
                transition: isDragging ? 'none' : 'height 0.4s cubic-bezier(0.19, 1, 0.22, 1)'
            }}
        >
            {/* Handle */}
            <div
                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                style={{ width: '100%', padding: '10px 0', display: 'flex', justifyContent: 'center', cursor: 'grab', touchAction: 'none' }}
            >
                <div style={{ width: '36px', height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px' }} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>

                {/* Simulated Search Bar */}
                <div style={{
                    background: '#2c2c2e', borderRadius: '12px', padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px'
                }}>
                    <div style={{ width: '8px', height: '8px', background: '#2ecc71', borderRadius: '50%' }} />
                    <input
                        type="text"
                        placeholder="Où va-t-on ?"
                        value={destination} onChange={e => setDestination(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', fontWeight: '500', width: '100%', outline: 'none' }}
                        onFocus={() => setSheetHeight(MAX_HEIGHT)}
                    />
                </div>

                {/* Suggestions List */}
                {searchSuggestions.length > 0 && (
                    <div style={{ marginBottom: '20px', background: '#2c2c2e', borderRadius: '12px', overflow: 'hidden' }}>
                        {searchSuggestions.map((s, idx) => (
                            <div key={idx} style={{
                                padding: '12px 16px', borderBottom: '1px solid #333',
                                display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
                            }} onClick={() => {
                                // Trigger Routing
                                const destLat = s.lat || (s.type === 'place' ? 36.7525 : null);
                                const destLng = s.lng || (s.type === 'place' ? 3.0420 : null);

                                if (userLocation && destLat) {
                                    const results = findRoutes(userLocation, { lat: destLat, lng: destLng }, transitData);
                                    setRoutes(results);
                                    setSelectedDestinationName(s.name);
                                    setIsRoutingMode(true);
                                    setSheetHeight(MAX_HEIGHT);
                                    setSearchSuggestions([]);
                                } else {
                                    // Fallback if no location or simple search
                                    setDestination(s.name);
                                    setSearchSuggestions([]);
                                }
                            }}>
                                <div style={{ width: '24px', height: '24px', background: s.type === 'stop' ? '#007aff' : '#f1c40f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {s.type === 'stop' ? <MapPinOff size={12} color="#fff" /> : <Navigation size={12} color="#000" />}
                                </div>
                                <div>
                                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{s.name}</div>
                                    <div style={{ color: '#888', fontSize: '12px' }}>{s.details}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Nearby Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        À proximité
                    </div>
                    <MoreHorizontal size={16} color="#8e8e93" />
                </div>

                {/* List */}
                {sortedLines.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#8e8e93' }}>
                        Aucune ligne à proximité 😔
                    </div>
                )}

                {sortedLines.map(line => <LineRow key={line.id} line={line} />)}

                {/* Spacer for bottom nav/safe area */}
                <div style={{ height: '40px' }} />
            </div>

            <style>{`
                .sheet-container {
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    background: #1c1c1e; /* Transit Dark Mode Background */
                    border-top-left-radius: 16px;
                    border-top-right-radius: 16px;
                    box-shadow: 0 -5px 30px rgba(0,0,0,0.4);
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
            `}</style>
        </div>
    )
}

export default TransitList
