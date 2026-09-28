const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseDir = path.resolve(__dirname, '..');
const outDir = path.join(baseDir, 'public', 'assets', 'stitch');
const artDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\7ef2d2fb-1f56-44d0-a93e-fc589f01b51c\\stitch_previews';

// In order to capture light mode or admin mode, let's create a tiny helper HTML or script injection
// Even simpler: create a test page that sets localStorage/sessionStorage then redirects to the target route!
const helperHtmlPath = path.join(baseDir, 'public', '_test_helper.html');

fs.writeFileSync(helperHtmlPath, `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
  const urlParams = new URLSearchParams(window.location.search);
  const theme = urlParams.get('theme');
  const role = urlParams.get('role');
  const target = urlParams.get('to') || '#/table';

  if (theme) localStorage.setItem('juilliard_theme', theme);
  if (role === 'admin') sessionStorage.setItem('juilliard_field_judge_key', '2026');

  window.location.href = '/' + target;
</script>
</body>
</html>
`);

console.log('Created _test_helper.html');

const tasks = [
  {
    name: 'actual_05_standings_light.png',
    url: 'http://localhost:5000/_test_helper.html?theme=light&to=%23/table'
  },
  {
    name: 'actual_06_judge_console.png',
    url: 'http://localhost:5000/_test_helper.html?theme=dark&role=admin&to=%23/admin'
  }
];

for (const t of tasks) {
  const pubPath = path.join(outDir, t.name);
  const artPath = path.join(artDir, t.name);
  console.log('Capturing:', t.name);
  execSync(`"${chrome}" --headless=new --disable-gpu --window-size=430,1200 --virtual-time-budget=3500 --screenshot="${pubPath}" "${t.url}"`, { stdio: 'inherit' });
  fs.copyFileSync(pubPath, artPath);
  console.log('Saved to pub and art:', t.name);
}

// Clean up helper
try { fs.unlinkSync(helperHtmlPath); } catch (e) {}
console.log('All variants captured.');
