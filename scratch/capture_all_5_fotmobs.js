const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname, '..', 'public', 'assets', 'stitch');
const artDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\7ef2d2fb-1f56-44d0-a93e-fc589f01b51c\\stitch_previews';

const screens = [
  { name: 'fotmob_01_matches.png', url: 'http://localhost:5000/#/events', height: 1150 },
  { name: 'fotmob_02_match_facts.png', url: 'http://localhost:5000/#/event/track-100m-boys', height: 1100 },
  { name: 'fotmob_03_dark_table.png', url: 'http://localhost:5000/?view=full#/table', height: 1050 },
  { name: 'fotmob_04_live_commentary.png', url: 'http://localhost:5000/?tab=commentary#/event/track-100m-boys', height: 1150 },
  { name: 'fotmob_05_minimal_table.png', url: 'http://localhost:5000/?view=short#/table', height: 950 },
  { name: 'fotmob_06_onboarding.png', url: 'http://localhost:5000/#/onboarding', height: 1000 },
  { name: 'fotmob_07_house_detail.png', url: 'http://localhost:5000/#/house/phoenix', height: 1150 }
];

for (const s of screens) {
  const p = path.join(outDir, s.name);
  const a = path.join(artDir, s.name);
  console.log('Capturing:', s.name, 'from', s.url);
  const cmd = `"${chrome}" --headless=new --disable-gpu --window-size=500,${s.height} --hide-scrollbars --virtual-time-budget=3000 --screenshot="${p}" "${s.url}"`;
  execSync(cmd, { stdio: 'inherit' });
  fs.copyFileSync(p, a);
  console.log('Saved:', s.name);
}

console.log('All screens successfully captured.');
