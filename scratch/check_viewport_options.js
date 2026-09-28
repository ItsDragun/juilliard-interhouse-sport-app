const { execSync } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const path = require('path');

const filePath = path.join(__dirname, 'test_dpi.html').replace(/\\/g, '/');

// Try with different flags
const flagsList = [
  '--window-size=500,1000',
  '--window-size=440,1000 --force-device-scale-factor=1',
  '--window-size=412,915 --user-agent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"',
  '--window-size=500,1000'
];

for (const f of flagsList) {
  try {
    const res = execSync(`"${chrome}" --headless=new --disable-gpu ${f} --dump-dom "file://${filePath}"`).toString();
    const match = res.match(/<div id="debug">([^<]+)<\/div>/);
    console.log(f, '=>', match ? match[1] : 'null');
  } catch(e) {
    console.log(f, '=> Error:', e.message);
  }
}
