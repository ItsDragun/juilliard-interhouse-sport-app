const { execSync } = require('child_process');
const fs = require('fs');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
try {
  const out = execSync(`"${chrome}" --headless=new --dump-dom --virtual-time-budget=2000 "http://127.0.0.1:8080/index.html?pin=2026#/admin"`).toString();
  fs.writeFileSync('scratch/dom.html', out);
  console.log('Saved scratch/dom.html, size:', out.length);
} catch (e) {
  console.error(e.message);
}
