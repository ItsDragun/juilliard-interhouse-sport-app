const { execSync } = require('child_process');
const path = require('path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseDir = path.resolve(__dirname, '..');
const outDir = path.join(baseDir, 'public', 'assets', 'stitch');

const screens = [
  {
    name: 'verified_ihechukwu_superadmin_session.png',
    url: 'http://127.0.0.1:8080/index.html?pin=ihechukwu#/admin',
    w: 430,
    h: 932
  }
];

for (const s of screens) {
  const target = path.join(outDir, s.name);
  console.log(`Capturing ${s.name}...`);
  const cmd = `"${chrome}" --headless=new --disable-gpu --window-size=${s.w},${s.h} --virtual-time-budget=3000 --screenshot="${target}" "${s.url}"`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Saved: ${target}`);
  } catch (err) {
    console.error(`Error capturing ${s.name}:`, err.message);
  }
}

console.log("Done capturing all superadmin screenshots!");
