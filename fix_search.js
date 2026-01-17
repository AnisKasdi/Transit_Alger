
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'components', 'TransitUI.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Define the old block to find (loosely)
const startMarker = 'const performSearch = async () => {';
const endMarker = 'return () => clearTimeout(timeoutId);';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find blocks!");
    process.exit(1);
}

// The new logic to insert
const newLogic = `        if (searchQuery.length > 1) {
            const normalize = str => str.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
            const query = normalize(searchQuery);
            
            const matches = [];
            
            // 1. Search in Hydrated Transit Data
            transitData.forEach(line => {
                // Search Lines
                if (normalize(line.name).includes(query) && !matches.find(m => m.id === line.id)) {
                     matches.push({ type: 'line', id: line.id, name: \`Ligne \${line.name}\`, lat: null, lng: null, subtitle: line.longName, data: line });
                }

                // Search Stops
                line.stops?.forEach(stop => {
                    if (normalize(stop.name).includes(query) && !matches.find(m => m.name === stop.name)) {
                        matches.push({ type: 'stop', name: stop.name, lat: stop.lat, lng: stop.lng, subtitle: \`Arrêt • \${line.name}\` });
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
`;

// Construct new content
// We replace everything from 'const performSearch...' up to just before 'return () => ...'
// But wait, the original code had 'useEffect(() => {' wrapping it.
// The structure was:
// useEffect(() => {
//    const performSearch = async () => { ... };
//    const timeoutId = setTimeout(performSearch, 300);
//    return ...
// }, ...);

// My new logic is NOT a function, it's direct code.
// So I should replace the WHOLE wrapper 'const performSearch ... }; const timeoutId ...' 
// with simply the new logic? NO.
// Creating a debounced function inside useEffect is good practice. 
// I should KEEP the performSearch structure but change its BODY.

// Let's refine the replacement.
// Find 'const performSearch = async () => {'
// Find the closing brace '};' OF that function.

// This is hard with simple string replace if nested braces exists.
// BUT, looking at the code, performSearch ends just before 'const timeoutId'.

const timeoutLineIndex = content.indexOf('const timeoutId = setTimeout');
if (timeoutLineIndex === -1) {
    console.error("Could not find timeout line");
    process.exit(1);
}

const beforeBlock = content.substring(0, startIndex + startMarker.length);
const afterBlock = content.substring(timeoutLineIndex);

// Add the new body (which is just the 'if...else' logic)
// AND we need to close the function '};'
const finalContent = beforeBlock + '\n' + newLogic + '\n        };\n        ' + afterBlock;

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log("Successfully patched TransitUI.jsx");
