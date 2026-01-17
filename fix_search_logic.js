
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'components', 'TransitUI.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Target the specific If condition in the loop
// Original: if (normalize(line.name).includes(query) && !matches.find(m => m.id === line.id)) {
// We want to be robust.

const target = 'if (normalize(line.name).includes(query) && !matches.find(m => m.id === line.id)) {';
const replacement = `
                const lName = normalize(line.name);
                const lLongName = normalize(line.longName || "");
                const lFullName = \`ligne \${lName}\`; 
                
                if ((lName.includes(query) || lLongName.includes(query) || lFullName.includes(query)) && !matches.find(m => m.id === line.id)) {`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Improved search logic applied.");
} else {
    console.error("Target pattern not found. Please verify file content.");
    // Fallback: try to find it without the && check? No, safer to be exact or fail.
    // The previous patches might have altered whitespace.
    // Let's try a slightly looser target if the first fails.
}
