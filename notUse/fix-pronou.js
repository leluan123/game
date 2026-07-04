const fs = require('fs');

// 1. Remove hearts from score.js
let s = fs.readFileSync('games/pronou/js/score.js', 'utf8');
s = s.replace('hearts: 5,', 'hearts: 0,');
s = s.replace('maxHearts: 5,', 'maxHearts: 0,');
fs.writeFileSync('games/pronou/js/score.js', s);
console.log('1. Hearts removed');

// 2. Add character highlighting to ui.js
let u = fs.readFileSync('games/pronou/js/ui.js', 'utf8');
const f = '\n  _highlightWord(spoken,correct){const s=spoken.toLowerCase().trim();const c=correct.toLowerCase().trim();let h="";for(let i=0;i<Math.max(s.length,c.length);i++){h+=s[i]===c[i]?"<span class=\\"char-correct\\">"+s[i]+"</span>":"<span class=\\"char-wrong\\">"+s[i]+"</span>";}return h;},';
u = u.replace('async handleMicrophoneClick()', f + 'async handleMicrophoneClick()');
u = u.replace("document.getElementById('result-text').textContent = scoreResult.spokenText || '-';", "document.getElementById('result-text').innerHTML = this._highlightWord(scoreResult.spokenText, scoreResult.correctText);");
fs.writeFileSync('games/pronou/js/ui.js', u);
console.log('2. Char highlight added');

// 3. Add CSS styles
let c = fs.readFileSync('games/pronou/css/pronou.css', 'utf8');
c = c.replace('/* ===== RESPONSIVE ===== */', '.char-correct{color:#4caf50;font-weight:700}.char-wrong{color:#f44336;font-weight:700}\n/* ===== RESPONSIVE ===== */');
fs.writeFileSync('games/pronou/css/pronou.css', c);
console.log('3. CSS done');
console.log('All done!');