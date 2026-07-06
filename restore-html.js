const { execSync } = require('child_process');
const fs = require('fs');

// Restore from git
try {
  execSync('git checkout HEAD -- games/pronou/pronou.html', { stdio: 'inherit' });
  console.log('✓ Restored HTML from git');
} catch (e) {
  console.error('Git error:', e.message);
}

// Now properly rename
let html = fs.readFileSync('games/pronou/pronou.html', 'utf8');
const original = html;
html = html.replace(/Pronou/g, 'Pronunciation Test');
fs.writeFileSync('games/pronou/pronou.html', html);
console.log('✓ Renamed to Pronunciation Test');
console.log('  File size:', html.length, 'bytes');