const { execSync } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const cmd = `"${chrome}" --headless=new --disable-gpu --window-size=440,1200 --dump-dom "http://localhost:5000/#/table"`;
const html = execSync(cmd).toString();
console.log('HTML length:', html.length);
