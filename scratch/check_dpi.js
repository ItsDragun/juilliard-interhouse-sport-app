const { execSync } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fs = require('fs');
const path = require('path');

const htmlContent = `<!DOCTYPE html>
<html><body>
<div id="debug"></div>
<script>
  document.getElementById("debug").innerText = JSON.stringify({
    innerWidth: window.innerWidth,
    outerWidth: window.outerWidth,
    dpr: window.devicePixelRatio,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight
  });
</script>
</body></html>`;

fs.writeFileSync(path.join(__dirname, 'test_dpi.html'), htmlContent);
const filePath = path.join(__dirname, 'test_dpi.html').replace(/\\/g, '/');

const output = execSync(`"${chrome}" --headless=new --disable-gpu --window-size=440,1200 --dump-dom "file://${filePath}"`).toString();
const match = output.match(/<div id="debug">([^<]+)<\/div>/);
console.log('Result:', match ? match[1] : 'No match');
