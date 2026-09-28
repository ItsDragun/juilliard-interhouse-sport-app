const { execSync } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
try {
  const out = execSync(`"${chrome}" --headless=new --dump-dom --virtual-time-budget=2000 "http://127.0.0.1:8080/index.html?pin=ihechukwu#/admin"`).toString();
  console.log('DOM length:', out.length);
  console.log('Includes screen-admin active:', out.includes('id="screen-admin" class="page-screen active"'));
  console.log('Active page screen:', (out.match(/class=\"page-screen[^\"]*\"/g) || []));
  console.log('Current URL/Hash:', (out.match(/window\.location[^\n]*/g) || []));
  const fs = require('fs');
  fs.writeFileSync('scratch/ihechukwu_dom.html', out);
} catch (e) {
  console.error(e.message);
}
