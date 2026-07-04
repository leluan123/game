const fs = require('fs');
let u = fs.readFileSync('games/pronou/js/ui.js', 'utf8');

// Check current state
console.log('Before:');
console.log('  playWrong:', u.includes('Audio.playWrong()'));
console.log('  playMicStop:', u.includes('Audio.playMicStop()'));

// Add Audio.playWrong() - find the exact pattern
const wrongPattern = '} else {\n      // Wrong answer\n      icon.textContent = \'✖\';';
if (u.includes(wrongPattern)) {
  u = u.replace(wrongPattern, '} else {\n      Audio.playWrong();\n      // Wrong answer\n      icon.textContent = \'✖\';');
  console.log('  Added playWrong');
}

// Add Audio.playMicStop() 
const micPattern = 'if (Speech.isListening) {\n      Speech.stopListening();';
if (u.includes(micPattern)) {
  u = u.replace(micPattern, 'if (Speech.isListening) {\n      Audio.playMicStop();\n      Speech.stopListening();');
  console.log('  Added playMicStop');
}

fs.writeFileSync('games/pronou/js/ui.js', u);

console.log('After:');
console.log('  playWrong:', u.includes('Audio.playWrong()'));
console.log('  playMicStop:', u.includes('Audio.playMicStop()'));