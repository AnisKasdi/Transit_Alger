
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'components', 'TransitUI.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: r.segments[0].duration -> check existence
const crashTarget = '{parseInt(r.segments[0].duration)}';
const crashReplacement = '{r.segments && r.segments.length > 0 ? parseInt(r.segments[0].duration) : 0}';

// Fix 2: r.duration -> r.totalDuration (as per formatRouteResult)
// Context: <div style={{ color: '#888', fontSize: '13px', fontWeight: '600' }}>{r.duration}</div>
const durationTarget = '>{r.duration}</div>';
const durationReplacement = '>{r.totalDuration} min</div>';

let newContent = content;
if (newContent.includes(crashTarget)) {
    newContent = newContent.replace(crashTarget, crashReplacement);
    console.log("Fixed segments crash.");
} else {
    console.error("Could not find segments crash target.");
}

if (newContent.includes(durationTarget)) {
    newContent = newContent.replace(durationTarget, durationReplacement);
    console.log("Fixed duration property.");
} else {
    // Try looser match
    const looseTarget = '>{r.duration}';
    if (newContent.includes(looseTarget)) {
        newContent = newContent.replace(looseTarget, '>{r.totalDuration} min');
        console.log("Fixed duration property (loose match).");
    } else {
        console.error("Could not find duration target.");
    }
}

fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Patch applied.");
