const fs = require('fs');
let u = fs.readFileSync('games/pronou/js/ui.js', 'utf8');

// Add _lastWasWrong flag and button text in _showFeedback
u = u.replace(
  "    if (scoreResult.isCorrect) {",
  "    this._lastWasWrong = !scoreResult.isCorrect;\n    document.getElementById('btn-feedback-ok').textContent = scoreResult.isCorrect ? 'Next \u2192' : '\uD83D\uDD04 Retry';\n    if (scoreResult.isCorrect) {"
);

// Fix _hideFeedback to retry same question if wrong
u = u.replace(
  "  _hideFeedback() {",
  "  _hideFeedback() {\n    if (this._lastWasWrong) {\n      this._lastWasWrong = false;\n      document.getElementById('feedback-overlay').style.display = 'none';\n      this._loadQuestion();\n      return;\n    }"
);

fs.writeFileSync('games/pronou/js/ui.js', u);
console.log('Retry logic fixed');