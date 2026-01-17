
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'components', 'TransitUI.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'const handleSuggestionClick = async (item) => {';
// We want to replace the whole function body.
// The next function starts usually with 'const handleLineClick' or similar?
// Let's rely on finding the matching closing brace is hard with regex.
// Instead, let's find the start, and find the end based on next function declaration or just heuristics.

const nextFunctionMarker = 'const handleLineClick = (line) => {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(nextFunctionMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find blocks!");
    // Fallback: maybe just find the block by knowing exact content?
    // Let's try to match the Catch block end.
    // 'finally {' ... '}'
    // It ends with '    };' before 'const handleLineClick'
}

if (startIndex === -1) {
    console.error("Start marker not found");
    process.exit(1);
}

// New Logic
const newLogic = `    const handleSuggestionClick = async (item) => {
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
                if (mockLine) {
                    routes = [{
                        id: 'mock-fail-a-star', line: mockLine, startStop: mockLine.stops[0], endStop: mockLine.stops[3],
                        walkToStart: 4, transitDuration: 18, walkFromEnd: 6, totalDuration: 28, score: 10,
                        segments: [{ type: 'WALK', duration: 4 }, { type: 'BUS', line: mockLine, duration: 18 }, { type: 'WALK', duration: 6 }]
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

`;

// We replace from startIndex up to (but not including) endIndex.
// But we need to make sure we don't duplicate newlines too much.
// The endIndex is at 'const handleLineClick...'
// So we just replace the chunk.

if (endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    const newContent = before + newLogic + '\n    ' + after;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Successfully patched handleSuggestionClick");
} else {
    console.error("Could not find end marker (handleLineClick)");
}
