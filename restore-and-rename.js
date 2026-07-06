const { execSync } = require('child_process');
const fs = require('fs');

// Restore from git
execSync('git checkout HEAD -- games/pronou/pronou.html', { stdio: 'inherit' });
console.log('Restored from git');

// Now rename
let html = fs.readFileSync('games/pronou/pronou.html', 'utf8');
html = html.replace(/Pronou/g, 'Pronunciation Test');
fs.writeFileSync('games/pronou/pronou.html', html);
console.log('Renamed to Pronunciation Test');