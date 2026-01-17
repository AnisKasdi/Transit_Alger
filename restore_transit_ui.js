
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'components', 'TransitUI.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. FIX ENCODING ARTIFACTS
const replacements = [
    { from: 'Ã©', to: 'é' },
    { from: 'Ã ', to: 'à' }, // Space might vary
    { from: 'Ã¨', to: 'è' },
    { from: 'Ã§', to: 'ç' },
    { from: 'Ãª', to: 'ê' },
    { from: 'Ã¹', to: 'ù' },
    { from: 'â€¢', to: '•' },
    { from: 'Ã€', to: 'À' },
    { from: 'Ã«', to: 'ë' },
    { from: 'Ã¢', to: 'â' },
    { from: 'OÃ¹', to: 'Où' }, // Specific case
];

replacements.forEach(rep => {
    // Global replace
    content = content.split(rep.from).join(rep.to);
});

// 2. REWRITE RENDER CONTENT (HOME MODE)
// We identify the Start of renderContent and the End of HOME block.
// Start: const renderContent = () => {
//        if (mode === 'HOME') {
//            return (
//                <>

// We will replace this entire HOME block to be safe.

const homeBlockStart = `    const renderContent = () => {
        if (mode === 'HOME') {`;

const homeBlockEndMarker = `        if (mode === 'LINE_DETAILS' && selectedLine) {`;

const startIdx = content.indexOf(homeBlockStart);
const endIdx = content.indexOf(homeBlockEndMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error("Critical: Could not find HOME block boundaries.");
    // Fallback: Try strictly fixing the encoding if we can't find block
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Only encoding fixed (Block lookup failed).");
    process.exit(0);
}

const newHomeBlock = `    const renderContent = () => {
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
                                        fontSize: '20px', fontWeight: '600', outline: 'none'
                                    }}
                                />
                                <div style={{ padding: '8px' }}>
                                    <ArrowRightLeft size={24} color="#fff" style={{ opacity: 0.8 }} />
                                </div>
                            </div>

                            {/* Liste des Actions Rapides */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

                                {/* WRAPPED DEFAULT MENU: Hidden when searching */}
                                {!searchQuery && (
                                    <>
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

                                {/* Suggestions: Visible when searching */}
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

                    {/* Nearby List - Visible ONLY when NOT Searching */}
                    {!isSearchActive && (
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
                    )}
                </>
            );
        }

`;

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

fs.writeFileSync(filePath, before + newHomeBlock + "\n\n" + after, 'utf8');
console.log("Restored TransitUI structure and fixed encoding.");
