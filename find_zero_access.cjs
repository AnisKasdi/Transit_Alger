
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/TransitUI.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Searching for '[0]' in TransitUI.jsx:");
lines.forEach((line, index) => {
    if (line.includes('[0]')) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
