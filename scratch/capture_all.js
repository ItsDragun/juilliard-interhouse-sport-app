const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseDir = path.resolve(__dirname, '..');
const outDir = path.join(baseDir, 'public', 'assets', 'stitch');

const screens = [
  { url: 'http://localhost:5000/#/table', name: 'actual_01_standings.png' },
  { url: 'http://localhost:5000/#/events', name: 'actual_02_events.png' },
  { url: 'http://localhost:5000/#/onboarding', name: 'actual_03_onboarding.png' },
  { url: 'http://localhost:5000/#/house/phoenix', name: 'actual_04_house_phoenix.png' }
];

for (const s of screens) {
  const targetFile = path.join(outDir, s.name);
  console.log(`Capturing ${s.url} -> ${targetFile}`);
  const cmd = `"${chrome}" --headless=new --disable-gpu --window-size=430,1200 --virtual-time-budget=3000 --screenshot="${targetFile}" "${s.url}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log(`Done: ${s.name}, exists: ${fs.existsSync(targetFile)}`);
}

console.log('All screenshots captured successfully.');
