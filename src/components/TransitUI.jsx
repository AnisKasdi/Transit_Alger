// ============================================================================
// FICHIER: TransitUI.jsx
// ROLE: Le coeur de l'interaction. Panneau "Bottom Sheet" premium.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Navigation, ArrowLeft, ArrowRightLeft, MapPin, Search, Wifi, Clock, ChevronUp, Crown, Home, Briefcase, Calendar, ChevronRight, Bus, TramFront, TrainFront, Plane } from 'lucide-react';
import { findRoutes } from '../utils/routing';
import { EtusaClient } from '../services/EtusaClient';

const TransitUI = ({ searchCenter, userLocation, transitData }) => {

    // --- ETATS ---
    const [mode, setMode] = useState('HOME'); // 'HOME', 'LINE_DETAILS', 'ROUTING_RESULTS', 'TRIP_PLAN'
    const [nearbyLines, setNearbyLines] = useState([]);
    const [selectedLine, setSelectedLine] = useState(null);
    const [directions, setDirections] = useState({});
    const [realTimeSchedule, setRealTimeSchedule] = useState({}); // { stopName: DateObject }
    const [ticker, setTicker] = useState(new Date()); // Updates every minute
    const [tripPlan, setTripPlan] = useState(null);
    const [routeResults, setRouteResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false); // UI Loading State

    // --- GESTION DU BOTTOM SHEET ---
    // On utilise des valeurs en pixel pour plus de précision (vs VH)
    const SCREEN_H = window.innerHeight;
    const SNAP_MIN = SCREEN_H * 0.15; // Petit (Recherche)
    const SNAP_MID = SCREEN_H * 0.45; // Moyen (Liste)
    const SNAP_MAX = SCREEN_H * 0.95; // Grand (Plein écran)

    const [sheetHeight, setSheetHeight] = useState(SNAP_MID);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartH = useRef(0);

    // --- 1. DATA PROCESSING ---
    useEffect(() => {
        const center = searchCenter || userLocation || { lat: 36.7525, lng: 3.0420 };
        if (transitData) {
            const sorted = transitData.map(line => {
                if (!line.stops) return { ...line, distance: 9999, nextDepartures: ['--'], closestStopName: '?' };
                let minStopDist = 9999;
                let closestStop = line.stops[0];

                line.stops.forEach(s => {
                    const R = 6371;
                    const dLat = (s.lat - center.lat) * (Math.PI / 180);
                    const dLon = (s.lng - center.lng) * (Math.PI / 180);
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(center.lat * (Math.PI / 180)) * Math.cos(s.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const d = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
                    if (d < minStopDist) { minStopDist = d; closestStop = s; }
                });
                // Mock horaires intelligents
                const baseTime = Math.floor(Math.random() * 8) + 1;
                return {
                    ...line,
                    distance: minStopDist,
                    closestStopName: closestStop.name,
                    nextDepartures: [baseTime, baseTime + 12]
                };
            }).sort((a, b) => a.distance - b.distance);
            setNearbyLines(sorted);
        }
    }, [searchCenter, userLocation, transitData]);

    // --- 1.5 REAL TIME SCHEDULE LOGIC ---
    // A. Ticker to update "Now" every minute
    useEffect(() => {
        const timer = setInterval(() => setTicker(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // B. Calculate Schedule (Targets)
    useEffect(() => {
        if (mode === 'LINE_DETAILS' && selectedLine) {
            const fetchRealTime = async () => {
                const now = new Date();
                // Start 2 mins from now
                const startTime = new Date(now.getTime() + 2 * 60000);

                // 2. Extrapolate
                const newSchedule = {};
                const conststops = directions[selectedLine.id] ? [...selectedLine.stops].reverse() : selectedLine.stops;

                conststops.forEach((stop, index) => {
                    // +3 mins per stop
                    const arrivalTime = new Date(startTime.getTime() + (index * 3 * 60000));
                    newSchedule[stop.name] = arrivalTime;
                });

                setRealTimeSchedule(newSchedule);
            };
            fetchRealTime();
        }
    }, [mode, selectedLine, directions]);

    // Helper: Format Countdown
    const getCountdown = (targetDate) => {
        if (!targetDate) return "";
        const diffMs = targetDate - ticker;
        const diffMins = Math.ceil(diffMs / 60000);

        if (diffMins <= 0) return "À l'instant";
        if (diffMins > 60) return targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':', 'h'); // Absolute if long
        return `Dans ${diffMins} min`;
    };


    // --- 2. SEARCH LOGIC ---
    // --- 2. SEARCH LOGIC (Server-Side) ---
    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.length > 1) {
                const normalize = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const query = normalize(searchQuery);

                const matches = [];

                // 1. Search in Hydrated Transit Data
                transitData.forEach(line => {
                    // Search Lines

                    const lName = normalize(line.name);
                    const lLongName = normalize(line.longName || "");
                    const lFullName = `ligne ${lName}`;

                    if ((lName.includes(query) || lLongName.includes(query) || lFullName.includes(query)) && !matches.find(m => m.id === line.id)) {
                        matches.push({ type: 'line', id: line.id, name: `Ligne ${line.name}`, lat: null, lng: null, subtitle: line.longName, data: line });
                    }

                    // Search Stops
                    line.stops?.forEach(stop => {
                        if (normalize(stop.name).includes(query) && !matches.find(m => m.name === stop.name)) {
                            matches.push({ type: 'stop', name: stop.name, lat: stop.lat, lng: stop.lng, subtitle: `Arrêt • ${line.name}` });
                        }
                    });
                });

                // 2. Add Local Shortcuts
                if ("maison".includes(query)) matches.push({ type: 'place', name: 'Maison', lat: 36.7529, lng: 3.0420, subtitle: 'Domicile' });
                if ("fac".includes(query) || "université".includes(query)) matches.push({ type: 'place', name: 'Université', lat: 36.7118, lng: 3.1805, subtitle: 'USTHB' });

                setSuggestions(matches.slice(0, 8));
                if (matches.length > 0 && sheetHeight < SNAP_MAX) setSheetHeight(SNAP_MAX);
            } else {
                setSuggestions([]);
            }

        };
        const timeoutId = setTimeout(performSearch, 300); // Debounce 300ms
        return () => clearTimeout(timeoutId);
    }, [searchQuery, sheetHeight]);

    // --- 3. INTERACTIONS ---
    const handleSuggestionClick = async (item) => {
        // CASE A: Line Selected -> Go to Line Details
        if (item.type === 'line' && item.data) {
            handleLineClick(item.data);
            setSuggestions([]);
            setSearchQuery(item.name);
            return;
        }

        // CASE B: Stop/Place Selected -> Routing
        const start = userLocation || { lat: 36.7525, lng: 3.0420 };
        const end = { lat: item.lat, lng: item.lng };

        setIsCalculating(true);
        setMode('ROUTING_RESULTS');
        setRouteResults([]); // Clear previous

        try {
            // CALL DISPATCHER (A* ALGORITHM)
            let routes = await findRoutes(start, end, transitData);

            if (!routes || routes.length === 0) {
                console.warn("A* returned no path. Using direct mock.");
                const mockLine = transitData[0];
                if (mockLine && mockLine.stops && mockLine.stops.length > 0) {
                    routes = [{
                        id: 'mock-fail-a-star', line: mockLine, startStop: mockLine.stops[0], endStop: mockLine.stops[mockLine.stops.length - 1],
                        walkToStart: 4, transitDuration: 18, walkFromEnd: 6, totalDuration: 28, score: 10,
                        segments: [{ type: 'WALK', duration: 4 }, { type: 'BUS', line: mockLine.name, color: mockLine.color, duration: 18 }, { type: 'WALK', duration: 6 }]
                    }];
                }
            }
            setRouteResults(routes || []);
            setSheetHeight(SNAP_MAX);

        } catch (e) {
            console.error("Routing Error:", e);
            setRouteResults([]);
        } finally {
            setIsCalculating(false);
            setSuggestions([]);
            setSearchQuery(item.name);
        }
    };


    const handleLineClick = (line) => {
        setSelectedLine(line);
        setMode('LINE_DETAILS');
        setSheetHeight(SNAP_MID);
    };

    const toggleLineDirection = (lineId, e) => {
        e.stopPropagation();
        setDirections(prev => ({ ...prev, [lineId]: !prev[lineId] }));
    };

    const handleBack = () => {
        if (mode === 'TRIP_PLAN') setMode('LINE_DETAILS');
        else if (mode === 'LINE_DETAILS') { setSelectedLine(null); setMode('HOME'); setSheetHeight(SNAP_MID); }
        else if (mode === 'ROUTING_RESULTS') { setRouteResults([]); setMode('HOME'); setSearchQuery(''); setSheetHeight(SNAP_MID); }
    };

    const handleGoClick = () => {
        if (!selectedLine) return;

        // Mock 3 Route Options similar to Transit App
        const mockRoutes = [
            {
                id: 'r1',
                duration: '42 min',
                departure: '17:00',
                arrival: '17:42',
                crowd: 'low',
                tags: ['Rapide'],
                segments: [
                    { type: 'WALK', duration: '8', color: '#888' },
                    { type: 'BUS', duration: '25', color: selectedLine.color, line: selectedLine.name },
                    { type: 'WALK', duration: '9', color: '#888' }
                ]
            },
            {
                id: 'r2',
                duration: '56 min',
                departure: '17:15',
                arrival: '18:11',
                crowd: 'med',
                tags: [],
                segments: [
                    { type: 'WALK', duration: '12', color: '#888' },
                    { type: 'BUS', duration: '44', color: '#9b59b6', line: '12A' }
                ]
            },
            {
                id: 'r3',
                duration: '1 h 05',
                departure: '17:05',
                arrival: '18:10',
                crowd: 'high',
                tags: ['Moins de marche'],
                segments: [
                    { type: 'WALK', duration: '4', color: '#888' },
                    { type: 'BUS', duration: '15', color: '#e67e22', line: '4' },
                    { type: 'BUS', duration: '35', color: '#3498db', line: '88' },
                    { type: 'WALK', duration: '11', color: '#888' }
                ]
            }
        ];

        setRouteResults(mockRoutes);
        setMode('ROUTING_RESULTS');
        setSheetHeight(SNAP_MAX);
    };

    const handleSeeAll = () => {
        // Pour l'instant, on étend juste le panneau au maximum
        setSheetHeight(SNAP_MAX);
    };

    const handleShortcut = (type) => {
        if (type === 'HOME') handleSuggestionClick({ name: 'Maison', lat: 36.7529, lng: 3.0420 });
        else if (type === 'WORK') handleSuggestionClick({ name: 'Travail', lat: 36.7118, lng: 3.1805 });
        else if (type === 'EVENT') alert('Aucun événement à venir.');
        else if (type === 'MAP') setIsSearchActive(false);
    };

    // --- 4. DRAG GESTURES (PHYSICS) ---
    const handleTouchStart = (e) => {
        setIsDragging(true);
        dragStartY.current = e.touches[0].clientY;
        dragStartH.current = sheetHeight;
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const deltaY = dragStartY.current - e.touches[0].clientY;
        const newH = dragStartH.current + deltaY;
        // Résistance élastique aux bords
        if (newH > SNAP_MAX + 50) return;
        if (newH < SNAP_MIN - 20) return;
        setSheetHeight(newH);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        // Snap logic améliorée
        const h = sheetHeight;
        if (h > (SNAP_MAX + SNAP_MID) / 2) setSheetHeight(SNAP_MAX);
        else if (h > (SNAP_MID + SNAP_MIN) / 2) setSheetHeight(SNAP_MID);
        else setSheetHeight(SNAP_MIN);
    };

    // --- COMPOSANTS UI INTERNES ---

    // Helper pour l'icone de mode
    const getModeIcon = (line, color = '#fff', size = 20) => {
        if (!line) return null;
        const type = line.type ? line.type.toLowerCase() : 'bus';
        // Détection Aéroport
        if ((line.longName && line.longName.toLowerCase().includes('aéroport')) || (line.name && line.name.toLowerCase().includes('aéroport')) || (line.originalData && line.originalData.nomLigne.toLowerCase().includes('aéroport'))) {
            return <Plane size={size} color={color} />;
        }

        switch (type) {
            case 'tram': return <TramFront size={size} color={color} />;
            case 'metro': return <TrainFront size={size} color={color} />;
            case 'bus': default: return <Bus size={size} color={color} />;
        }
    };

    const LineCard = ({ line, onClick, isReversed, onToggle }) => {
        const [translateX, setTranslateX] = useState(0);
        const [startX, setStartX] = useState(null);

        const handleTouchStart = (e) => {
            // Empêcher le scroll vertical si on swipe horizontalement pourrait être complexe, 
            // mais ici on suppose un swipe franc.
            setStartX(e.touches[0].clientX);
        };

        const handleTouchMove = (e) => {
            if (startX === null) return;
            const currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            // Limiter le déplacement visuel
            if (Math.abs(diff) < 120) {
                setTranslateX(diff);
            }
        };

        const handleTouchEnd = (e) => {
            // Seuil de déclenchement (80px)
            if (Math.abs(translateX) > 80) {
                // On déclenche le toggle
                onToggle(line.id, e);
                // Feedback haptique
                if (navigator.vibrate) navigator.vibrate(50);
            }
            // Reset position avec animation
            setTranslateX(0);
            setStartX(null);
        };

        return (
            <div className="glass-card" style={{ marginBottom: '12px', position: 'relative', overflow: 'hidden', background: '#000' }}>
                {/* Indicateurs d'arrière-plan (révélés au swipe) */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', zIndex: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2ecc71', fontWeight: 'bold', opacity: translateX > 30 ? (translateX / 80) : 0 }}>
                        <ArrowRightLeft size={20} /> Changer
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2ecc71', fontWeight: 'bold', opacity: translateX < -30 ? (Math.abs(translateX) / 80) : 0 }}>
                        Changer <ArrowRightLeft size={20} />
                    </div>
                </div>

                {/* Contenu de la carte (Glissant) */}
                <div
                    onClick={() => onClick(line)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        padding: '12px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative', zIndex: 1,
                        background: 'rgba(28, 28, 30, 0.95)',
                        transform: `translateX(${translateX}px)`,
                        transition: startX ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        width: '100%',
                        minHeight: '80px'
                    }}
                >
                    {/* Ligne Colorée Accent (Plus subtile) */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: line.color }} />

                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>

                        {/* 1. Numéro de Ligne (XXL Hero) WITH ICON */}
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            marginRight: '16px', minWidth: '60px', gap: '4px'
                        }}>
                            {getModeIcon(line, line.color, 24)}
                            <div style={{
                                fontSize: '22px', fontWeight: '900', color: line.color,
                                textShadow: '0 2px 10px rgba(0,0,0,0.3)', letterSpacing: '-1px', lineHeight: 1
                            }}>
                                {line.name}
                            </div>
                        </div>

                        {/* 2. Infos Direction (Compact) */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{
                                color: '#fff', fontWeight: '700', fontSize: '15px', lineHeight: '1.2',
                                marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px'
                            }}>
                                Vers {isReversed ? line.longName.split('<->')[0] : line.longName.split('<->')[1]}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '12px', fontWeight: '500' }}>
                                <MapPin size={12} /> {line.closestStopName}
                            </div>
                        </div>

                        {/* 3. Temps (Transit Style - Huge & Colorful) */}
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{
                                background: '#2ecc71', color: '#000', padding: '4px 12px', borderRadius: '20px',
                                display: 'flex', alignItems: 'baseline', gap: '2px', boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)'
                            }}>
                                <span style={{ fontSize: '24px', fontWeight: '900', lineHeight: '1' }}>{line.nextDepartures[0]}</span>
                                <span style={{ fontSize: '13px', fontWeight: '700' }}>min</span>
                                <Wifi size={14} style={{ marginLeft: '4px', opacity: 0.6 }} />
                            </div>
                            {/* Prochain départ & Favorite */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>{line.nextDepartures[1]} min</span>
                                <Crown size={14} color="#f1c40f" fill="#f1c40f" style={{ opacity: 0.8 }} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    };

    // --- RENDER CONTENT ---
    const renderContent = () => {
        if (mode === 'HOME') {
            return (
                <>
                    {/* Barre de Recherche (Expansion au clic) - STYLE TRANSIT VERT */}
                    {mode === 'HOME' && !isSearchActive && (
                        <div style={{ padding: '0 20px 20px 20px' }}>
                            <div
                                onClick={() => setIsSearchActive(true)}
                                style={{
                                    position: 'relative', background: '#166534', borderRadius: '16px', padding: '16px',
                                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'text',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div style={{ background: '#fff', borderRadius: '50%', padding: '4px' }}>
                                    <Search size={16} color="#166534" />
                                </div>
                                <span style={{ color: '#fff', fontSize: '16px', fontWeight: '700' }}>Où allons-nous ?</span>
                            </div>
                        </div>
                    )}

                    {/* OVERLAY DE RECHERCHE (Style Transit) */}
                    {isSearchActive && (
                        <div style={{
                            position: 'absolute', inset: 0, background: '#000', zIndex: 50,
                            display: 'flex', flexDirection: 'column'
                        }}>
                            {/* Header Vert Transit */}
                            <div style={{ background: '#1e8e3e', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                    onClick={() => setIsSearchActive(false)}
                                    style={{ padding: '8px', borderRadius: '50%', cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }}
                                >
                                    <ArrowLeft size={24} color="#fff" />
                                </div>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Ligne ou destination"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        flex: 1, background: 'transparent', border: 'none', color: '#fff',
                                        fontSize: '20px', fontWeight: '600', outline: 'none',
                                        placeholderColor: 'rgba(255,255,255,0.7)'
                                    }}
                                />
                                <div style={{ padding: '8px' }}>
                                    <ArrowRightLeft size={24} color="#fff" style={{ opacity: 0.8 }} />
                                </div>
                            </div>

                            {/* Liste des Actions Rapides */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

                                {/* WRAPPED DEFAULT MENU */}
                                {!searchQuery && (
                                    <>
                                        {/* Menu Items */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                                            {[
                                                { icon: MapPin, label: "Choisir sur la carte", color: '#fff', bg: '#2c2c2e', type: 'MAP' },
                                                { icon: MapPin, label: "Repère sur la carte", sub: "44.8436, -0.5381", color: '#d35400', bg: '#2c2c2e', iconColor: '#9b59b6', type: 'MAP' },
                                                { icon: Home, label: "Définir un domicile", color: '#fff', bg: '#2c2c2e', type: 'HOME' },
                                                { icon: Briefcase, label: "Définir un lieu de travail", color: '#fff', bg: '#2c2c2e', type: 'WORK' },
                                                { icon: Calendar, label: "Afficher événements", color: '#fff', bg: '#2c2c2e', type: 'EVENT' },
                                            ].map((item, i) => (
                                                <div key={i} onClick={() => handleShortcut(item.type)} style={{
                                                    background: item.bg, padding: '16px', borderRadius: '16px',
                                                    display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer'
                                                }}>
                                                    <div style={{
                                                        width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <item.icon size={20} color={item.iconColor || '#fff'} />
                                                    </div>
                                                    <div>
                                                        <div style={{ color: item.color, fontWeight: '700', fontSize: '16px' }}>{item.label}</div>
                                                        {item.sub && <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{item.sub}</div>}
                                                    </div>
                                                    <ChevronRight size={20} color="#666" style={{ marginLeft: 'auto' }} />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Recherches Récentes */}
                                        <div style={{ color: '#888', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>
                                            Recherches Récentes
                                        </div>
                                        <div style={{ background: '#1c1c1e', borderRadius: '16px', overflow: 'hidden' }}>
                                            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #333' }}>
                                                <div style={{ background: '#fff', padding: '4px 8px', borderRadius: '4px', color: '#000', fontWeight: '900', fontSize: '12px' }}>SNCF</div>
                                                <div style={{ color: '#fff', fontWeight: '600' }}>Montpellier Saint-Roch</div>
                                                <div style={{ marginLeft: 'auto' }}>:</div>
                                            </div>
                                            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}><Clock size={16} color="#aaa" /></div>
                                                <div style={{ color: '#fff', fontWeight: '600' }}>Aéroport Houari Boumediene</div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {suggestions.length > 0 && (
                                    <div className="glass-card" style={{ marginTop: '8px', overflow: 'hidden' }}>
                                        {suggestions.map((s, i) => (
                                            <div key={i} onClick={() => handleSuggestionClick(s)} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}><MapPin size={16} color="#fff" /></div>
                                                <div>
                                                    <div style={{ color: '#fff', fontWeight: '600' }}>{s.name}</div>
                                                    <div style={{ color: '#888', fontSize: '12px' }}>{s.subtitle}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        </div>
                    )}

                    {/* Nearby List (Restored) */}
                    <div style={{ padding: '0 20px', paddingBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ color: '#fff', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>À Proximité</span>
                            <span onClick={handleSeeAll} style={{ color: '#2ecc71', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Voir tout</span>
                        </div>
                        {nearbyLines.map((line) => (
                            <LineCard
                                key={line.id}
                                line={line}
                                onClick={handleLineClick}
                                isReversed={directions[line.id]}
                                onToggle={toggleLineDirection}
                            />
                        ))}
                    </div>
                </>
            );
        }



        if (mode === 'LINE_DETAILS' && selectedLine) {
            return (
                <div style={{ padding: 0, minHeight: '100%', background: '#000' }}>

                    {/* GREEN HEADER (Line Details) */}
                    <div style={{ background: '#1e8e3e', padding: '16px 20px 24px 20px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div onClick={handleBack} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '50%', cursor: 'pointer', marginRight: '16px' }}>
                                <ArrowLeft size={24} color="#fff" />
                            </div>
                            <div style={{ marginLeft: 'auto', padding: '6px 12px', background: '#fff', borderRadius: '12px', color: selectedLine.color, fontWeight: '900', fontSize: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {getModeIcon(selectedLine, selectedLine.color, 20)}
                                {selectedLine.name}
                            </div>
                        </div>

                        <div>
                            <div style={{ color: '#fff', fontSize: '24px', fontWeight: '800', lineHeight: '1.2' }}>Vers {directions[selectedLine.id] ? selectedLine.longName.split('<->')[0] : selectedLine.longName.split('<->')[1]}</div>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '500', marginTop: '4px' }}>Direction Principale</div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', textAlign: 'center', marginBottom: '24px', margin: '0 20px 24px 20px', background: '#1c1c1e', border: '1px solid #333' }}>
                        <div style={{ color: '#888', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Prochain départ</div>
                        <div style={{ fontSize: '56px', fontWeight: '900', color: '#fff', lineHeight: 1, letterSpacing: '-2px' }}>
                            {selectedLine.nextDepartures && selectedLine.nextDepartures[0] ? selectedLine.nextDepartures[0] : '--'} <span style={{ fontSize: '20px', color: '#2ecc71' }}>min</span>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <button onClick={handleGoClick} style={{ background: '#fff', color: '#000', border: 'none', padding: '12px 32px', borderRadius: '30px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
                                Voir Itinéraire
                            </button>
                        </div>
                    </div>

                    <div style={{ paddingLeft: '20px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '29px', top: 0, bottom: 0, width: '2px', background: '#333' }} />
                        {(directions[selectedLine.id] ? [...selectedLine.stops].reverse() : selectedLine.stops).map((stop, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#000', border: `3px solid ${i === 0 ? '#2ecc71' : (i === selectedLine.stops.length - 1 ? '#e74c3c' : '#fff')} `, zIndex: 2 }} />
                                <div style={{ marginLeft: '20px', flex: 1 }}>
                                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: '500' }}>{stop.name}</div>
                                    {realTimeSchedule[stop.name] && (
                                        <div style={{ color: '#2ecc71', fontSize: '13px', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            {getCountdown(realTimeSchedule[stop.name])}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (mode === 'ROUTING_RESULTS') {
            return (
                <div style={{ padding: 0, minHeight: '100%', background: '#000' }}>

                    {/* GREEN HEADER (Double Input) */}
                    <div style={{ background: '#1e8e3e', padding: '16px 20px 24px 20px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div onClick={handleBack} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '50%', cursor: 'pointer', marginTop: '4px' }}>
                                <ArrowLeft size={24} color="#fff" />
                            </div>

                            {/* Inputs Stack */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                                    Ma position
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <MapPin size={14} color="#fff" />
                                    {selectedLine ? `Vers ${selectedLine.longName.split('<->')[1]}` : 'Destination'}
                                </div>
                            </div>

                            <div style={{ padding: '8px', marginTop: '30px' }}>
                                <ArrowRightLeft size={20} color="#fff" style={{ transform: 'rotate(90deg)', opacity: 0.8 }} />
                            </div>
                        </div>

                        {/* Filter Chip */}
                        <div style={{ display: 'flex', gap: '10px', paddingLeft: '44px' }}>
                            <span style={{ background: '#fff', color: '#000', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Départ maintenant
                                <ChevronUp size={14} style={{ transform: 'rotate(180deg)' }} />
                            </span>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ArrowRightLeft size={16} color="#fff" />
                            </div>
                        </div>
                    </div>

                    {/* ROUTE LIST */}
                    <div style={{ padding: '0 16px' }}>
                        {routeResults.map((r, i) => (
                            <div key={i} className="glass-card" onClick={() => { setTripPlan({ line: selectedLine, segments: [] }); setMode('TRIP_PLAN'); }} style={{ marginBottom: '12px', padding: '16px', cursor: 'pointer', background: '#1c1c1e', border: '1px solid #333' }}>

                                {/* Top Row: Access Time + Duration */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                                    <div>
                                        {/* Timeline Visualization */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                                            {r.segments && r.segments.map((seg, j) => (
                                                <React.Fragment key={j}>
                                                    {/* Dot/Pill */}
                                                    {seg.type === 'WALK' ? (
                                                        <div style={{ width: Math.max(20, seg.duration * 2) + 'px', height: '6px', borderRadius: '3px', background: '#333', position: 'relative' }}>
                                                            {/* Dotted effect overlay */}
                                                            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#666 1.5px, transparent 1.5px)', backgroundSize: '6px 6px', opacity: 0.5 }} />
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            minWidth: '40px', flex: 1, height: '28px', borderRadius: '14px',
                                                            background: seg.color, color: '#fff', fontSize: '14px', fontWeight: '900',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            padding: '0 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                                        }}>
                                                            {seg.line}
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
                                            Partez dans <span style={{ color: '#2ecc71' }}>{r.segments && r.segments.length > 0 ? parseInt(r.segments[0].duration) : 0} min</span>
                                            <Wifi size={14} color="#2ecc71" style={{ display: 'inline', marginLeft: '6px' }} />
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#fff', fontWeight: '900', fontSize: '20px' }}>{r.arrival}</div>
                                        <div style={{ color: '#888', fontSize: '13px', fontWeight: '600' }}>{r.totalDuration} min</div>
                                    </div>
                                </div>

                                {/* Bottom Info (Crowd / Tags) */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {r.tags && r.tags.length > 0 && r.tags.map(t => (
                                        <span key={t} style={{ fontSize: '11px', fontWeight: '700', color: '#f1c40f', background: 'rgba(241, 196, 15, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                            {t}
                                        </span>
                                    ))}
                                    {r.crowd && (
                                        <div style={{ display: 'flex', gap: '2px', marginLeft: 'auto' }}>
                                            {[1, 2, 3].map(lvl => (
                                                <div key={lvl} style={{
                                                    width: '6px', height: '14px', borderRadius: '2px',
                                                    background: (r.crowd === 'low' && lvl === 1) ? '#2ecc71' :
                                                        (r.crowd === 'med' && lvl <= 2) ? '#f39c12' :
                                                            (r.crowd === 'high') ? '#e74c3c' : '#333'
                                                }} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))}

                        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#2c2c2e' }}>
                            <Crown size={20} color="#f1c40f" fill="#f1c40f" />
                            <span style={{ color: '#fff', fontWeight: '700' }}>Trouver d'autres trajets</span>
                            <ChevronRight size={20} color="#666" style={{ marginLeft: 'auto' }} />
                        </div>
                    </div>
                </div>
            )
        }
        if (mode === 'TRIP_PLAN' && tripPlan) {
            return (
                <div style={{ padding: '0 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                        <div onClick={handleBack} style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', cursor: 'pointer', marginRight: '16px' }}>
                            <ArrowLeft size={24} color="#fff" />
                        </div>
                        <div>
                            <div style={{ color: '#fff', fontSize: '20px', fontWeight: '800' }}>Itinéraire</div>
                            <div style={{ color: '#aaa', fontSize: '14px' }}>Vers {tripPlan.line.longName.split('<->')[1]}</div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px' }}>
                        {tripPlan.segments.map((seg, i) => (
                            <div key={i} style={{ display: 'flex', marginBottom: i === tripPlan.segments.length - 1 ? 0 : '24px', position: 'relative' }}>
                                {/* Timeline Line */}
                                {i !== tripPlan.segments.length - 1 && (
                                    <div style={{ position: 'absolute', left: '15px', top: '30px', bottom: '-24px', width: '2px', borderLeft: '2px dashed rgba(255,255,255,0.2)' }} />
                                )}

                                {/* Icon */}
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: seg.type === 'BUS' ? seg.color : '#333',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, marginRight: '16px'
                                }}>
                                    {seg.type === 'WALK' ? <Navigation size={14} color="#fff" /> : <div style={{ fontWeight: '800', fontSize: '12px' }}>{tripPlan.line.name}</div>}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{seg.label}</span>
                                        <span style={{ color: '#2ecc71', fontWeight: '600' }}>{seg.time}</span>
                                    </div>
                                    {seg.from && <div style={{ color: '#aaa', fontSize: '13px' }}>De : {seg.from}</div>}
                                    {seg.to && <div style={{ color: '#aaa', fontSize: '13px' }}>Vers : {seg.to}</div>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <button onClick={() => alert("Navigation GPS démarrée !")} style={{ width: '100%', background: '#2ecc71', color: '#fff', border: 'none', padding: '16px', borderRadius: '16px', fontSize: '18px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Navigation size={20} />
                            Démarrer
                        </button>
                    </div>
                </div>
            );
        }

        return null;
    };


    return (
        <div
            className="glass-panel"
            style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                height: sheetHeight,
                borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
                zIndex: 2000,
                display: 'flex', flexDirection: 'column',
                transition: isDragging ? 'none' : 'height 0.5s cubic-bezier(0.16, 1, 0.3, 1)', // Spring physics
                willChange: 'height',
                background: '#000', // Solid Black
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                borderTop: '1px solid #333'
            }}
        >
            {/* DRAG HANDLE */}
            <div
                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', cursor: 'grab', touchAction: 'none' }}
            >
                <div style={{ width: '48px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px' }} />
            </div>

            {/* CONTENT SCROLLABLE */}
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {renderContent()}
            </div>

            <style>{`
                            @keyframes pulse-radar { 0% { opacity: 0.4; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.4; transform: scale(0.9); } }
                            .radar-icon { animation: pulse-radar 2s infinite ease-in-out; }
                        `}</style>
        </div >
    );
};

export default TransitUI;


