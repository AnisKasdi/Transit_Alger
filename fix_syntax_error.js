
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'components', 'TransitUI.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The file has a broken structure like:
// 548:                             </div>
// 549:                         </div>
// 550:                     )}
// 551:                     
// 552: </>
// 553: )}
// 554:
// 555: {suggestions.length > 0 && (

// The previous script likely failed to remove the ')}' from the original block or added extra closing tags.
// Let's look for the specific block of garbage and replace it with clean code.

// We want to reconstruct the section.
// Ideally, we locate the Start of "Menu Items" and the Start of "suggestions.length > 0"
// And put the correct content in between.

const startMarker = '{/* Menu Items */}';
const endMarker = '{suggestions.length > 0 && (';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Critical: Could not find markers to repair file.");
    process.exit(1);
}

// The messed up part is between startMarker and endIndex. It probably contains the previous wrap attempt.
// We will simply replace it with the CORRECT logic.

const correctBlock = `                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
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
                                </div>`;

// Now construct the final wrap.
// We want:  {!searchQuery && ( <> CORRECT_BLOCK </> )}
// Note: We need to make sure we don't have dangling closing tags from the previous fail before endIndex.
// The file view showed:
// 548:                             </div>
// 549:                         </div>
// 550:                     )}
// 551:                     
// 552: </>
// 553: )}

// If we replace everything from startMarker to endIndex with the NEW wrapped block, we overwrite the mess.
// AND we are fine.

const cleanWrappedBlock = `{/* WRAPPED DEFAULT MENU */}
{!searchQuery && (
<>
` + startMarker + `
` + correctBlock + `
</>
)}

`;

// Locate the mess (StartMarker is inside the mess in my code above? No, startMarker is '{/* Menu Items */}')
// My previous script wrapped startMarker. So looking for startMarker might find the *inner* one or the *outer* one.
// Actually, earlier I saw:
// 501:                                 {/* WRAPPED DEFAULT MENU */}
// 502: {!searchQuery && (
// 503: <>
// 504: {/* Menu Items */}

// So the REAL start of the mess is line 501.
const realStartMarker = '{/* WRAPPED DEFAULT MENU */}';
let realStartIndex = content.indexOf(realStartMarker);

if (realStartIndex === -1) {
    // maybe it wasn't saved fully or I am looking at cached view?
    // fallback to original startMarker
    realStartIndex = startIndex; // Line 504 roughly
    // Wait, if I replace from line 504, I leave lines 501-503 orphan logic.
    // I should probably try to find the 'top' of this block.
    // But safely replacing from startMarker to endIndex is okay IF I don't break the outer structure.

    // Actually, looking at the broken file:
    // It has specific lines 552: </> and 553: )} which are the problem.
    // Ideally I just remove lines 552 and 553? 
    // No, line 550 is ')}' which closes... something? 
    // Line 549 is '</div>'

    // The previous structure was:
    // {suggestions.length > 0 && (
    // ...
    // )}

    // Wait, looking at lines 547-550:
    // 547:                     )}
    // 548:                     <div className="glass-card"...>
    // NO. Line 547 is closing something.
    // Line 548 is INSIDE the previous block?

    // Let's trust the "Replace Whole Block" strategy.
    // I will replace from `{!searchQuery && (` (if found) OR `{/* Menu Items */}`
    // UP TO `{suggestions.length > 0 && (`
}

// Refined Strategy:
// 1. Find `{suggestions.length > 0 && (`. This is the anchor for the NEXT block.
// 2. Find `{/* Menu Items */}`. This is the start of OUR block.
// 3. Look backward from `{/* Menu Items */}` to see if we have `{!searchQuery...`.
//    If yes, include it in the "to be replaced" range.
// 4. Look backward even more for `{/* WRAPPED DEFAULT MENU */}`. Default to that if found.

const nextBlockStart = content.indexOf('{suggestions.length > 0 && (');
if (nextBlockStart === -1) { console.error("Next block not found"); process.exit(1); }

let replaceStart = content.lastIndexOf('{/* Menu Items */}', nextBlockStart);
const wrapperStart = content.lastIndexOf('{/* WRAPPED DEFAULT MENU */}', nextBlockStart);

if (wrapperStart !== -1 && wrapperStart < replaceStart) {
    replaceStart = wrapperStart;
}

// Now replace everything from replaceStart to nextBlockStart with the Correct Clean Wrapped Block.
const before = content.substring(0, replaceStart);
const after = content.substring(nextBlockStart);

const final = before + cleanWrappedBlock + after;
fs.writeFileSync(filePath, final, 'utf8');
console.log("Syntax Error Fixed.");
