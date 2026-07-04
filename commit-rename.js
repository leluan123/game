const { execSync } = require('child_process');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "rename: change game name from Pronou to Pronunciation Test"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
  console.log('Successfully committed and pushed');
} catch (e) {
  console.error('Error:', e.message);
}