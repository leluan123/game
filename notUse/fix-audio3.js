const fs = require('fs');
let u = fs.readFileSync('games/pronou/js/ui.js', 'utf8');

// Fix 1: Add Audio.playWrong() before wrong answer
const wrongMarker = '// Wrong answer';
const wrongIdx = u.indexOf(wrongMarker);
if (wrongIdx > 0) {
  const lineStart = u.lastIndexOf('\n', wrongIdx) + 1;
  const before = u.substring(0, lineStart);
  const after = u.substring(lineStart);
  u = before + '      Audio.playWrong();\n' + after;
  console.log('Added Audio.playWrong()');
}

// Fix 2: Add Audio.playMicStop() before stopListening
const stopMarker = 'Speech.stopListening();';
const stopIdx = u.indexOf(stopMarker);
if (stopIdx > 0) {
  const before = u.substring(0, stopIdx);
  const after = u.substring(stopIdx);
  u = before + 'Audio.playMicStop();\n      ' + after;
  console.log('Added Audio.playMicStop()');
}

fs.writeFileSync('games/pronou/js/ui.js', u);

const v = fs.readFileSync('games/pronou/js/ui.js', 'utf8');
console.log('Verification:');
console.log('  playWrong:', v.includes('Audio.playWrong()'));
console.log('  playMicStop:', v.includes('Audio.playMicStop()'));