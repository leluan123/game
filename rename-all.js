const fs = require('fs');

// Rename in HTML
let html = fs.readFileSync('games/pronou/pronou.html', 'utf8');
html = html.replace(/Pronou/g, 'Pronunciation Test');
fs.writeFileSync('games/pronou/pronou.html', html);
console.log('HTML renamed');

// Rename in game.js
let game = fs.readFileSync('games/pronou/js/game.js', 'utf8');
game = game.replace(/Pronou/g, 'Pronunciation Test');
fs.writeFileSync('games/pronou/js/game.js', game);
console.log('Game.js renamed');

// Rename in ui.js
let ui = fs.readFileSync('games/pronou/js/ui.js', 'utf8');
ui = ui.replace(/Pronou/g, 'Pronunciation Test');
fs.writeFileSync('games/pronou/js/ui.js', ui);
console.log('UI.js renamed');

// Rename in score.js
let score = fs.readFileSync('games/pronou/js/score.js', 'utf8');
score = score.replace(/Pronou/g, 'Pronunciation Test');
fs.writeFileSync('games/pronou/js/score.js', score);
console.log('Score.js renamed');

console.log('All files renamed to Pronunciation Test');