const { execSync } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const cmd = `"${chrome}" --headless=new --disable-gpu --window-size=440,1200 --dump-dom "http://localhost:5000/?view=full#/table"`;
const dom = execSync(cmd).toString();
console.log('Has screen-table:', dom.includes('id="screen-table"'));
console.log('Has qual-leader:', dom.includes('qual-leader'));
console.log('Has Juilliard Interhouse Cup:', dom.includes('Juilliard Interhouse Cup'));
