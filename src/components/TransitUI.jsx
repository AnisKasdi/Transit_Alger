// ============================================================================
// FICHIER: TransitUI.jsx
// ROLE: Le coeur de l'interaction. C'est le panneau blanc/noir qui glisse en bas de l'écran.
// Il gère : Recherche, Liste des lignes, Détails d'un bus, Calcul d'itinéraire.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Navigation, ArrowLeft, ArrowRightLeft, MapPin, MoreHorizontal, Search, User, Wifi } from 'lucide-react';
import { findRoutes } from '../utils/routing'; // Notre algorythme de GPS

const TransitUI = ({ searchCenter, userLocation, transitData }) => {

    // ------------------------------------------------------------------------
    // MACHINE A ETATS (STATE MACHINE)
    // Au lieu de pleins de variables booléennes (isSearching, hasSelectedLine...),
    // on utilise une seule variable 'mode' pour savoir dans quel écran on est.
    // ------------------------------------------------------------------------
    // Modes possibles : 'HOME', 'LINE_DETAILS', 'ROUTING_RESULTS', 'TRIP_PLAN'
    const [mode, setMode] = useState('HOME');

    // ------------------------------------------------------------------------
    // DONNÉES (DATA BUCKETS)
    // ------------------------------------------------------------------------
    const [nearbyLines, setNearbyLines] = useState([]); // Lignes proches à afficher
    const [selectedLine, setSelectedLine] = useState(null); // La ligne sur laquelle on a cliqué
    const [directions, setDirections] = useState({}); // Sens de la ligne (Aller ou Retour ?) { [lineId]: true/false }
    const [tripPlan, setTripPlan] = useState(null); // Détail du trajet choisi
    const [routeResults, setRouteResults] = useState([]); // Liste des trajets trouvés par le GPS

    // Recherche
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    // ------------------------------------------------------------------------
    // GESTION DU PANNEAU GLISSANT (SHEET)
    // ------------------------------------------------------------------------
    const [sheetHeight, setSheetHeight] = useState(window.innerHeight * 0.4); // Hauteur actuelle du panneau
    const [isDragging, setIsDragging] = useState(false); // Est-ce que l'utilisateur est en train de tirer le panneau ?
    const [startY, setStartY] = useState(0); // Point de départ du doigt
    const [startH, setStartH] = useState(0); // Hauteur au début du mouvement

    // Les 3 hauteurs "aimantées" (Snap points)
    const MIN_H = window.innerHeight * 0.15; // Petit (juste la barre de recherche)
    const MID_H = window.innerHeight * 0.4;  // Moyen (liste des bus)
    const MAX_H = window.innerHeight * 0.92; // Grand (tout l'écran)

    // ------------------------------------------------------------------------
    // 1. TRAITEMENT DES DONNEES (Quand la position change)
    // ------------------------------------------------------------------------
    useEffect(() => {
        // On prend le centre de recherche, ou la position user, ou Alger par défaut
        const center = searchCenter || userLocation || { lat: 36.7525, lng: 3.0420 };

        if (transitData) {
            // On trie les lignes pour afficher les plus proches en premier
            const sorted = transitData.map(line => {
                if (!line.stops) return { ...line, distance: 9999, nextDepartures: ['--'], closestStopName: '?' };

                // Trouver l'arrêt le plus proche sur cette ligne
                let minStopDist = 9999;
                let closestStop = line.stops[0];

                line.stops.forEach(s => {
                    const R = 6371;
                    const dLat = (s.lat - center.lat) * (Math.PI / 180);
                    const dLon = (s.lng - center.lng) * (Math.PI / 180);
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(center.lat * (Math.PI / 180)) * Math.cos(s.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const d = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
                    if (d < minStopDist) {
                        minStopDist = d;
                        closestStop = s;
                    }
                });

                // Simulation des horaires (Mock)
                const dep1 = Math.floor(Math.random() * 10) + 2; // Entre 2 et 12 min
                const dep2 = dep1 + Math.floor(Math.random() * 15) + 5;

                return {
                    ...line,
                    distance: minStopDist,
                    closestStopName: closestStop.name,
                    nextDepartures: [dep1, dep2]
                };
            }).sort((a, b) => a.distance - b.distance); // Tri par distance croissante

            setNearbyLines(sorted);
        }
    }, [searchCenter, userLocation, transitData]);

    // ------------------------------------------------------------------------
    // 2. RECHERCHE ET ROUTING
    // ------------------------------------------------------------------------
    useEffect(() => {
        // Autocomplétion quand on tape dans la barre
        if (searchQuery.length > 1) {
            const matches = [];
            transitData.forEach(line => {
                line.stops?.forEach(stop => {
                    // On cherche si le nom de l'arrêt contient le texte tapé
                    if (stop.name.toLowerCase().includes(searchQuery.toLowerCase()) && !matches.find(m => m.name === stop.name)) {
                        matches.push({ type: 'stop', name: stop.name, lat: stop.lat, lng: stop.lng, subtitle: `Arrêt • ${line.name}` });
                    }
                });
            });
            // Des faux lieux pour la démo
            if ("maison".includes(searchQuery.toLowerCase())) matches.push({ type: 'place', name: 'Maison', lat: 36.7529, lng: 3.0420, subtitle: 'Domicile' });
            if ("fac".includes(searchQuery.toLowerCase())) matches.push({ type: 'place', name: 'Université', lat: 36.7118, lng: 3.1805, subtitle: 'USTHB' });

            setSuggestions(matches.slice(0, 5)); // On garde max 5 résultats
            setSheetHeight(MAX_H); // On ouvre le panneau en grand pour voir les résultats
        } else {
            setSuggestions([]);
        }
    }, [searchQuery, transitData]);

    // Quand on clique sur une suggestion de recherche
    const handleSuggestionClick = (item) => {
        const start = userLocation || { lat: 36.7525, lng: 3.0420 };
        const end = { lat: item.lat, lng: item.lng };

        // On lance le GPS ! (voir routing.js)
        let routes = findRoutes(start, end, transitData);

        // --- FALLBACK DEMO ---
        // Si le GPS ne trouve rien (car données incomplètes), on invente une route
        // pour que l'utilisateur ne soit pas bloqué.
        if (!routes || routes.length === 0) {
            console.warn("No direct routes found. generating mock...");
            const mockLine = transitData[0];
            if (mockLine) {
                routes = [{
                    id: 'mock-route',
                    line: mockLine,
                    startStop: mockLine.stops[0],
                    endStop: mockLine.stops[2] || mockLine.stops[1],
                    walkToStart: 5,
                    transitDuration: 15,
                    walkFromEnd: 8,
                    totalDuration: 28,
                    score: 10
                }];
            }
        }

        setRouteResults(routes);
        setSuggestions([]);
        setSearchQuery(item.name);
        setMode('ROUTING_RESULTS'); // On change d'écran -> Résultats
        setSheetHeight(MAX_H);
    };

    // ------------------------------------------------------------------------
    // 3. GESTION DES CLICS UTILISATEUR
    // ------------------------------------------------------------------------
    const handleLineClick = (line) => {
        setSelectedLine(line);
        setMode('LINE_DETAILS'); // On affiche le détail de la ligne
        setSheetHeight(MID_H);
    };

    // Calcule le nom de la destination (Terminus) selon le sens de la ligne
    const getDestination = (line) => {
        if (!line) return '';
        const isReversed = directions[line.id] || false;
        const parts = line.longName.split('<->');
        if (parts.length < 2) return line.longName;
        // Si sens inverse, on prend la partie gauche, sinon droite (dépend du format des données)
        return isReversed ? parts[0].trim() : parts[1].trim();
    };

    // ----------------------------------------------------------------
    // COMPOSANT INTERNE : Ligne Balayable (Swipeable)
    // Permet de glisser le doigt sur une ligne pour changer son sens
    // ----------------------------------------------------------------
    const SwipeableLineItem = ({ line, onClick, onToggleDirection, isReversed }) => {
        const [touchStart, setTouchStart] = useState(null);
        const [offset, setOffset] = useState(0);

        const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
        const onTouchMove = (e) => {
            if (!touchStart) return;
            const current = e.targetTouches[0].clientX;
            const diff = current - touchStart;
            // On limite le glissement à 100px
            if (Math.abs(diff) < 100) setOffset(diff);
        };
        const onTouchEnd = () => {
            if (Math.abs(offset) > 50) { // Si on a glissé assez loin (>50px)
                onToggleDirection(line.id); // On déclenche l'action (Changer Sens)
            }
            setOffset(0); // On remet à zéro
            setTouchStart(null);
        };

        const destination = getDestination({ ...line });

        return (
            <div
                className="line-item"
                onClick={() => onClick(line)}
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                style={{ transform: `translateX(${offset}px)`, transition: touchStart ? 'none' : 'transform 0.3s' }}
            >
                {/* Icône Carrée de la ligne */}
                <div className="line-icon" style={{ background: line.color }}>{line.name}</div>

                {/* Infos Texte */}
                <div className="line-info">
                    <div className="line-dest">{line.closestStopName}</div>
                    <div className="line-dist" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isReversed && <ArrowRightLeft size={12} color="#888" />}
                        Vers {destination}
                    </div>
                </div>

                {/* Temps restant (Radar) */}
                <div className="line-time-container">
                    <Wifi size={14} className="radar-icon" color={line.color} />
                    <span className="time-primary" style={{ color: line.color }}>{line.nextDepartures[0]} <span style={{ fontSize: '12px' }}>min</span></span>
                    <span className="time-secondary">{line.nextDepartures[1]}</span>
                </div>
            </div>
        )
    };

    const toggleLineDirection = (lineId) => {
        setDirections(prev => ({ ...prev, [lineId]: !prev[lineId] }));
    };

    // Lance un itinéraire "GO"
    const handleGoClick = () => {
        if (!selectedLine) return;
        const isReversed = directions[selectedLine.id];
        // On inverse la liste des arrêts si besoin
        const currentStops = isReversed ? [...selectedLine.stops].reverse() : selectedLine.stops;

        setTripPlan({
            line: selectedLine,
            segments: [
                { type: 'WALK', label: 'Vers l\'arrêt', time: '5 min' },
                { type: 'BUS', label: `Ligne ${selectedLine.name}`, from: currentStops[0].name, to: currentStops[currentStops.length - 1].name, time: '25 min', color: selectedLine.color },
                { type: 'WALK', label: 'Vers destination', time: '5 min' }
            ],
            startTime: new Date()
        });
        setMode('TRIP_PLAN');
        setSheetHeight(MAX_H);
    };

    // Quand on clique sur un arrêt dans la liste
    const handleStopClick = (stop) => {
        if (!selectedLine) return;
        const isReversed = directions[selectedLine.id];
        const currentStops = isReversed ? [...selectedLine.stops].reverse() : selectedLine.stops;

        setTripPlan({
            line: selectedLine,
            segments: [
                { type: 'WALK', label: 'Vers l\'arrêt', time: '5 min' },
                { type: 'BUS', label: `Ligne ${selectedLine.name}`, from: currentStops[0].name, to: stop.name, time: '15 min', color: selectedLine.color },
                { type: 'WALK', label: 'Arrivée', time: '0 min' }
            ],
            startTime: new Date()
        });
        setMode('TRIP_PLAN');
        setSheetHeight(MAX_H);
    };

    // Bouton Retour
    const handleBack = () => {
        if (mode === 'TRIP_PLAN') setMode('LINE_DETAILS');
        else if (mode === 'LINE_DETAILS') { setSelectedLine(null); setMode('HOME'); setSheetHeight(MID_H); }
        else if (mode === 'ROUTING_RESULTS') { setRouteResults([]); setMode('HOME'); setSearchQuery(''); setSheetHeight(MID_H); }
    };

    // ------------------------------------------------------------------------
    // GESTION DU GLISSEMENT VERTICAL DU PANNEAU (Drag & Drop)
    // ------------------------------------------------------------------------
    const handleTouchStart = (e) => { setIsDragging(true); setStartY(e.touches[0].clientY); setStartH(sheetHeight); };
    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const delta = startY - e.touches[0].clientY; // Inversé car Y augmente vers le bas
        const newH = startH + delta;
        if (newH > MIN_H && newH < MAX_H) setSheetHeight(newH);
    };
    const handleTouchEnd = () => {
        setIsDragging(false);
        // Aimantation vers le snap point le plus proche
        if (sheetHeight > (MID_H + MAX_H) / 2) setSheetHeight(MAX_H);
        else if (sheetHeight > (MIN_H + MID_H) / 2) setSheetHeight(MID_H);
        else setSheetHeight(MIN_H);
    };

    // ------------------------------------------------------------------------
    // RENDU DU CONTENU (Swich selon le mode)
    // ------------------------------------------------------------------------
    const renderContent = () => {
        // MODE ACCUEIL
        if (mode === 'HOME') {
            return (
                <div className="scroll-content">
                    {/* Header avec Barre de recherche */}
                    <div style={{ padding: '0 16px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                        <div style={{ background: '#2c2c2e', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71' }} />
                            <input
                                placeholder="Où va-t-on ?"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, outline: 'none', fontSize: '16px' }}
                                onFocus={() => setSheetHeight(MAX_H)}
                            />
                        </div>
                        {/* Liste des suggestions d'autocomplétion */}
                        {suggestions.length > 0 && (
                            <div style={{ background: '#2c2c2e', marginTop: '8px', borderRadius: '12px', overflow: 'hidden' }}>
                                {suggestions.map((s, i) => (
                                    <div key={i} onClick={() => handleSuggestionClick(s)} style={{ padding: '12px', borderBottom: '1px solid #333', color: 'white', display: 'flex', gap: '10px' }}>
                                        <MapPin size={16} /> {s.name} <span style={{ color: '#888' }}>{s.subtitle}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="section-title">À PROXIMITÉ</div>
                    {nearbyLines.map((line, i) => (
                        <SwipeableLineItem
                            key={i}
                            line={line}
                            onClick={handleLineClick}
                            onToggleDirection={toggleLineDirection}
                            isReversed={directions[line.id]}
                        />
                    ))}
                </div>
            );
        }

        // MODE DETAIL LIGNE
        if (mode === 'LINE_DETAILS' && selectedLine) {
            const isReversed = directions[selectedLine.id];
            const currentStops = isReversed ? [...selectedLine.stops].reverse() : selectedLine.stops;
            const destination = getDestination(selectedLine);

            return (
                <div className="scroll-content">
                    {/* Barre Retour */}
                    <div className="header-bar">
                        <ArrowLeft color="white" onClick={handleBack} />
                        <div style={{ flex: 1 }}>
                            <div className="header-title" style={{ fontSize: '16px' }}>Ligne {selectedLine.name}</div>
                            <div style={{ color: '#aaa', fontSize: '12px' }}>Vers {destination}</div>
                        </div>
                        <div onClick={() => toggleLineDirection(selectedLine.id)} style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', cursor: 'pointer' }}>
                            <ArrowRightLeft size={20} color="white" />
                        </div>
                    </div>
                    {/* Gros Compteur Temps */}
                    <div className="big-time-display">
                        <Wifi size={24} className="radar-icon-big" color={selectedLine.color} />
                        <div className="time-val" style={{ color: selectedLine.color }}>{selectedLine.nextDepartures[0]}<span style={{ fontSize: '20px' }}>min</span></div>
                        <div style={{ color: '#888', marginBottom: '10px' }}>Prochain: {selectedLine.nextDepartures[1]} min</div>
                        <div className="go-btn" onClick={handleGoClick}>GO</div>
                    </div>
                    {/* Liste des arrêts (Thermomètre) */}
                    <div className="stops-list">
                        <div className="timeline-line" style={{ background: selectedLine.color }} />
                        {currentStops.map((stop, i) => (
                            <div key={i} onClick={() => handleStopClick(stop)} className="stop-item">
                                <div className="stop-dot" style={{ borderColor: selectedLine.color }} />
                                <div className="stop-name">{stop.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // MODE RESULTATS RECHERCHE
        if (mode === 'ROUTING_RESULTS') {
            return (
                <div className="scroll-content">
                    <div className="header-bar">
                        <ArrowLeft color="white" onClick={handleBack} />
                        <span className="header-title">Itinéraires</span>
                    </div>
                    {routeResults.map((r, i) => (
                        <div key={i} className="route-card" onClick={() => {
                            setTripPlan({
                                line: r.line,
                                segments: [
                                    { type: 'WALK', label: 'Vers l\'arrêt', time: r.walkToStart + ' min' },
                                    { type: 'BUS', label: `Ligne ${r.line.name}`, from: r.startStop.name, to: r.endStop.name, time: r.transitDuration + ' min', color: r.line.color },
                                    { type: 'WALK', label: 'Vers destination', time: r.walkFromEnd + ' min' }
                                ],
                                startTime: new Date()
                            });
                            setMode('TRIP_PLAN'); // Vers mode navigation
                        }}>
                            <div className="route-header">
                                <div className="line-badge" style={{ background: r.line.color }}>{r.line.name}</div>
                                <div className="route-time">{r.totalDuration} min</div>
                            </div>
                            <div className="route-sub">Direction {r.line.longName.split('<->')[1]}</div>
                        </div>
                    ))}
                </div>
            );
        }
        return null; // Si TripPlan (non implémenté visuellement ici pour simplifier le snippet)
    };

    const isLight = mode === 'TRIP_PLAN'; // Mode clair pour la navigation GPS

    return (
        <div className="sheet-container" style={{ height: sheetHeight, background: isLight ? '#fff' : '#1c1c1e' }}>
            {/* Poignée de redimensionnement */}
            <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                style={{ width: '100%', padding: '10px 0', display: 'flex', justifyContent: 'center', cursor: 'grab', flexShrink: 0, touchAction: 'none' }}>
                <div style={{ width: '40px', height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px' }} />
            </div>

            {renderContent()}

            {/* Injections de style CSS interne au composant (CSS-in-JS) */}
            <StyleBlock light={isLight} isDragging={isDragging} />
        </div>
    );
};

// --- STYLES CSS (Mis ici pour garder le fichier auto-suffisant) ---
const StyleBlock = ({ light, isDragging }) => (
    <style>{`
        .sheet-container {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: ${light ? '#fff' : '#1c1c1e'};
            border-top-left-radius: 20px; border-top-right-radius: 20px;
            box-shadow: 0 -5px 30px rgba(0,0,0,0.5);
            display: flex; flex-direction: column; overflow: hidden;
            /* Animation fluide sauf si on drag */
            transition: ${isDragging ? 'none' : 'height 0.6s cubic-bezier(0.19, 1, 0.22, 1)'};
            z-index: 2000; font-family: 'Inter', sans-serif; will-change: height;
        }

        /* Responsive Desktop */
        @media (min-width: 768px) {
            .sheet-container {
                left: 20px; right: auto; width: 400px; bottom: 20px; border-radius: 20px;
            }
        }
        .scroll-content { flex: 1; overflow-y: auto; padding-bottom: 40px; }
        
        .line-item { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; cursor: pointer; color: white; position: relative; overflow: hidden; }
        .line-icon { width: 42px; height: 42px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; color: white; margin-right: 16px; flex-shrink: 0; }
        .line-info { flex: 1; min-width: 0; }
        .line-dest { font-weight: 700; font-size: 16px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .line-dist { color: #888; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .line-time-container { text-align: right; display: flex; align-items: center; gap: 8px; }
        .time-primary { font-size: 20px; font-weight: 800; display: flex; align-items: baseline; gap: 2px; }
        .time-secondary { font-size: 14px; color: #666; font-weight: 600; }
        
        /* Animation Radar pour le temps réel */
        @keyframes pulse-radar { 0% { opacity: 0.4; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.4; transform: scale(0.9); } }
        .radar-icon { animation: pulse-radar 2s infinite ease-in-out; margin-right: 4px; opacity: 0.8; }
        .radar-icon-big { animation: pulse-radar 2s infinite ease-in-out; margin-right: 8px; opacity: 1; margin-bottom: -4px; }

        .header-bar { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 16px; }
        
        .big-time-display { text-align: center; margin: 30px 0; display: flex; flex-direction: column; align-items: center; }
        .time-val { font-size: 64px; font-weight: 800; line-height: 1; margin: 10px 0; letter-spacing: -2px; }
        .go-btn { background: #2ecc71; color: black; padding: 14px 50px; border-radius: 30px; font-weight: 800; font-size: 18px; display: inline-block; margin-top: 20px; cursor: pointer; box-shadow: 0 8px 20px rgba(46,204,113,0.3); transition: transform 0.2s; }
        .go-btn:active { transform: scale(0.95); }
        
        .stops-list { position: relative; padding: 0 16px; margin-top: 20px; }
        .timeline-line { position: absolute; left: 35px; top: 10px; bottom: 30px; width: 4px; border-radius: 2px; }
        .stop-item { display: flex; align-items: center; margin-bottom: 24px; position: relative; cursor: pointer; }
        .stop-dot { width: 14px; height: 14px; background: #1c1c1e; border: 3px solid white; border-radius: 50%; margin: 0 20px 0 14px; z-index: 2; flex-shrink: 0; }
        .stop-name { color: white; font-weight: 600; font-size: 16px; flex: 1; }
    `}</style>
);

export default TransitUI;

