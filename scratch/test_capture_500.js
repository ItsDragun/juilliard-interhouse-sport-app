const { execSync } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const path = require('path');

const outPath = path.resolve(__dirname, '..', 'public', 'assets', 'stitch', 'test_table_500.png');

const cmd = `"${chrome}" --headless=new --disable-gpu --window-size=500,1050 --hide-scrollbars --virtual-time-budget=3000 --screenshot="${outPath}" "http://localhost:5000/?view=full#/table"`;
execSync(cmd, { stdio: 'inherit' });
console.log('Captured test_table_500.png');
