const { execSync } = require('child_process');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "fix: restore full HTML and rename game to Pronunciation Test"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
  console.log('✓ Successfully pushed to GitHub');
} catch (e) {
  console.error('Error:', e.message);
}