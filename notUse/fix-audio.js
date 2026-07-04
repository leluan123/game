const fs = require('fs');
let u = fs.readFileSync('games/pronou/js/ui.js', 'utf8');

// Add Audio.playWrong() before wrong answer section
u = u.replace(
  "      // Wrong answer\n      icon.textContent = '\u2716';",
  "      Audio.playWrong();\n      // Wrong answer\n      icon.textContent = '\u2716';"
);

// Add Audio.playMicStop() before stopListening
u = u.replace(
  "    if (Speech.isListening) {\n      Speech.stopListening();",
  "    if (Speech.isListening) {\n      Audio.playMicStop();\n      Speech.stopListening();"
);

fs.writeFileSync('games/pronou/js/ui.js', u);
console.log('Audio fixes applied');