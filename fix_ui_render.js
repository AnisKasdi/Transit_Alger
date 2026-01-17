
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'components', 'TransitUI.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// We need to wrap the "Menu Items" block with {!searchQuery && ( ... )}
// Finding the block:
// It starts with {/* Menu Items */}
// It ends just before {/* Recherches Récentes */} or rather, we want to hide "Recherches Récentes" too?
// Yes, usually you hide everything default when searching.

// Let's identify the start.
const startMarker = '{/* Menu Items */}';
// And where does the default section end?
// Looking at the file view: 
// It seems the default section goes down to line 546 (end of that div).
// Then line 548 starts {suggestions.length > 0 && (

// So we want to wrap from startMarker down to the closing div of that section.
// This is risky with regex.

// Strategy: Find the startMarker. 
// Find the "{suggestions.length > 0 && (" marker which is the next logical block.
// Wrap everything in between in {!searchQuery && ( ... )}

const endMarker = '{suggestions.length > 0 && (';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found");
    process.exit(1);
}

// Extract the block to wrap
const block = content.substring(startIndex, endIndex);

// Check if already wrapped?
if (block.includes('!searchQuery &&')) {
    console.log("Already patched.");
    process.exit(0);
}

// Wrap it
const wrappedBlock = `{/* WRAPPED DEFAULT MENU */}\n{!searchQuery && (\n<>\n` + block + `\n</>\n)}\n\n`;

const newContent = content.substring(0, startIndex) + wrappedBlock + content.substring(endIndex);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log("UI Rendering fixed: Default menu hidden when searching.");
