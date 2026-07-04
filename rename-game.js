const fs = require('fs');
let c = fs.readFileSync('games/pronou/pronou.html', 'utf8');
c = c.replace('content="Pronou"', 'content="Pronunciation Test"');
c = c.replace('>Pronou</h1>', '>Pronunciation Test</h1>');
fs.writeFileSync('games/pronou/pronou.html', c);
console.log('Renamed to Pronunciation Test');