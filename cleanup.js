const fs = require('fs');
const path = require('path');

const dir = 'notUse';
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const files = [
  'games/pronou/generate-data.js'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const dst = path.join(dir, path.basename(f));
    fs.renameSync(f, dst);
    console.log('Moved:', f);
  }
});

console.log('Done');