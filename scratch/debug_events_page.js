const { execSync } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
try {
  const out = execSync(`"${chrome}" --headless=new --dump-dom --virtual-time-budget=3000 "http://127.0.0.1:8080/index.html#/events"`).toString();
  console.log('DOM length:', out.length);
  console.log('Includes screen-events active:', out.includes('id="screen-events" class="page-screen active"'));
  console.log('Includes 100m Race (Boys):', out.includes('100m Race (Boys)'));
  const fs = require('fs');
  fs.writeFileSync('scratch/events_dom.html', out);
} catch (e) {
  console.error(e.message);
}
