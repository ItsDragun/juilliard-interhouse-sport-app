const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname, '..', 'public', 'assets', 'stitch');
const artDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\7ef2d2fb-1f56-44d0-a93e-fc589f01b51c\\stitch_previews';

const tests = [
  { name: 'actual_05_standings_light.png', url: 'http://localhost:5000/?theme=light#/table' },
  { name: 'actual_06_judge_console.png', url: 'http://localhost:5000/?pin=2026#/admin' }
];

for (const t of tests) {
  const p = path.join(outDir, t.name);
  const a = path.join(artDir, t.name);
  console.log('Capturing:', t.name, 'from', t.url);
  const cmd = `"${chrome}" --headless=new --disable-gpu --window-size=430,1200 --virtual-time-budget=3000 --screenshot="${p}" "${t.url}"`;
  execSync(cmd, { stdio: 'inherit' });
  fs.copyFileSync(p, a);
  console.log('Done:', t.name);
}

console.log('Finished capturing all variants.');
