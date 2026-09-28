const { execSync } = require('child_process');
const path = require('path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseDir = path.resolve(__dirname, '..');
const outDir = path.join(baseDir, 'public', 'assets', 'stitch');
const target = path.join(outDir, 'verified_officials_council.png');

console.log("Capturing verified_officials_council.png...");
// Open admin and trigger officials tab, or open with ?pin=2026#/admin
const url = 'http://127.0.0.1:8080/index.html?pin=2026#/admin';
const cmd = `"${chrome}" --headless=new --disable-gpu --window-size=430,932 --virtual-time-budget=3000 --screenshot="${target}" "${url}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log(`Saved: ${target}`);
} catch (err) {
  console.error("Error capturing screenshot:", err.message);
}
