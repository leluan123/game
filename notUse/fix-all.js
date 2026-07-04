const fs = require('fs');

// ===== 1. Fix data.js - limit to 50 questions, track answered IDs =====
let d = fs.readFileSync('games/pronou/js/data.js', 'utf8');

// Change QUESTIONS_PER_SESSION to 50
d = d.replace('QUESTIONS_PER_SESSION: 20,', 'QUESTIONS_PER_SESSION: 50,');

// Add answeredQuestions tracking
d = d.replace(
  'currentIndex: 0,',
  'currentIndex: 0,\n  answeredIds: [],'
);

// Add markAnswered and isAnswered methods before getCurrentQuestion
d = d.replace(
  'getCurrentQuestion() {',
  'markAnswered(id) { if (!this.answeredIds.includes(id)) this.answeredIds.push(id); },\n  isAnswered(id) { return this.answeredIds.includes(id); },\n  getCurrentQuestion() {'
);

// Fix startSession to exclude answered questions
d = d.replace(
  'let available = this.filterQuestions({ grade, unit, difficulty });',
  'let available = this.filterQuestions({ grade, unit, difficulty }).filter(q => !this.answeredIds.includes(q.id));'
);

fs.writeFileSync('games/pronou/js/data.js', d);
console.log('1. Data.js: 50 questions, answered tracking added');

// ===== 2. Fix ui.js - threshold >75%, remove combo, show accuracy =====
let u = fs.readFileSync('games/pronou/js/ui.js', 'utf8');

// Change pass condition: overall > 75 instead of isCorrect
u = u.replace(
  "this._lastWasWrong = !scoreResult.isCorrect;",
  "this._lastWasWrong = scoreResult.overall < 75;"
);

// Mark question as answered when correct
u = u.replace(
  "const result = Score.processCorrectAnswer(scoreResult);",
  "const result = Score.processCorrectAnswer(scoreResult);\n      Data.markAnswered(question.id);"
);

// Remove combo display from _updateTopBar - replace with accuracy
u = u.replace(
  "// Combo\n    const comboDisplay = document.getElementById('combo-display');\n    if (Score.combo >= 2) {\n      comboDisplay.style.display = 'block';\n      document.getElementById('combo-count').textContent = Score.combo;\n    } else {\n      comboDisplay.style.display = 'none';\n    }",
  "// Session accuracy\n    const comboDisplay = document.getElementById('combo-display');\n    const acc = Score.getAccuracy();\n    comboDisplay.style.display = 'block';\n    document.getElementById('combo-count').textContent = acc + '%';\n    document.getElementById('combo-label').textContent = 'Accuracy';"
);

// Update combo label in HTML (via JS)
u = u.replace(
  "document.getElementById('combo-label').textContent = 'Accuracy';",
  "document.getElementById('combo-label').textContent = 'Accuracy';\n    if (acc >= 75) comboDisplay.style.background = 'linear-gradient(135deg, #4caf50, #66bb6a)'; else if (acc >= 50) comboDisplay.style.background = 'linear-gradient(135deg, #ff9800, #ffb74d)'; else comboDisplay.style.background = 'linear-gradient(135deg, #f44336, #ef5350)';"
);

// Remove combo popup calls
u = u.replace(
  "if (result.combo >= 3) {\n        this._showComboPopup(result.combo);\n      }",
  ""
);

fs.writeFileSync('games/pronou/js/ui.js', u);
console.log('2. UI.js: threshold 75%, accuracy display, answered tracking');

// ===== 3. Fix score.js - remove combo logic =====
let s = fs.readFileSync('games/pronou/js/score.js', 'utf8');

// Remove combo increment
s = s.replace(
  "// Increment combo\n    this.combo++;\n    if (this.combo > this.bestCombo) {\n      this.bestCombo = this.combo;\n    }",
  ""
);

// Remove combo bonus
s = s.replace(
  "// Combo bonus\n    if (this.combo >= 3) {\n      xpEarned = xpEarned + this.REWARDS.comboBonus;\n    }",
  ""
);

// Remove combo reset from processWrongAnswer
s = s.replace(
  "this.combo = 0;",
  ""
);

fs.writeFileSync('games/pronou/js/score.js', s);
console.log('3. Score.js: combo removed');

// ===== 4. Fix HTML - update combo display label =====
let h = fs.readFileSync('games/pronou/pronou.html', 'utf8');
h = h.replace(
  '<span class="combo-label">Combo</span>',
  '<span class="combo-label" id="combo-label">Accuracy</span>'
);
fs.writeFileSync('games/pronou/pronou.html', h);
console.log('4. HTML: combo label updated');

console.log('\nAll fixes applied!');