const fs = require('fs');
const path = require('path');

// 1. Rename folder from pronou to pronun
const oldFolder = 'games/pronou';
const newFolder = 'games/pronun';

if (fs.existsSync(oldFolder)) {
  fs.renameSync(oldFolder, newFolder);
  console.log('✓ Renamed folder: pronou -> pronun');
}

// 2. Rename HTML file
const oldHtml = 'games/pronun/pronou.html';
const newHtml = 'games/pronun/pronunciation.html';

if (fs.existsSync(oldHtml)) {
  fs.renameSync(oldHtml, newHtml);
  console.log('✓ Renamed file: pronou.html -> pronunciation.html');
}

// 3. Update references in all JS files
const jsFiles = [
  'games/pronun/js/game.js',
  'games/pronun/js/ui.js',
  'games/pronun/js/score.js',
  'games/pronun/js/speech.js',
  'games/pronun/js/data.js',
  'games/pronun/js/utils.js',
  'games/pronun/js/audio.js'
];

jsFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/pronou/g, 'pronun');
    content = content.replace(/pronou.html/g, 'pronunciation.html');
    fs.writeFileSync(file, content);
    console.log('✓ Updated:', file);
  }
});

// 4. Update CSS path in HTML
const htmlFile = 'games/pronun/pronunciation.html';
if (fs.existsSync(htmlFile)) {
  let html = fs.readFileSync(htmlFile, 'utf8');
  html = html.replace(/href="css\/pronou.css"/g, 'href="css/pronun.css"');
  fs.writeFileSync(htmlFile, html);
  console.log('✓ Updated CSS path in HTML');
}

// 5. Rename CSS file
const oldCss = 'games/pronun/css/pronou.css';
const newCss = 'games/pronun/css/pronun.css';
if (fs.existsSync(oldCss)) {
  fs.renameSync(oldCss, newCss);
  console.log('✓ Renamed CSS: pronou.css -> pronun.css');
}

console.log('\n✓ All renames completed!');