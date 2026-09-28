const { execSync } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const htmlSnippet = `
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    const c = document.querySelector('.fotmob-app-container');
    const card = document.querySelector('.fotmob-table-card');
    const r = document.querySelector('.fotmob-table-head-row');
    document.title = 'W:' + window.innerWidth + '|C:' + (c ? c.offsetWidth : 0) + '|CARD:' + (card ? card.offsetWidth : 0) + '|R:' + (r ? r.offsetWidth : 0);
  }, 1000);
});
</script>
`;

const res = execSync(`"${chrome}" --headless=new --disable-gpu --window-size=440,1000 --virtual-time-budget=2000 --dump-dom "http://localhost:5000/?view=full#/table"`);
const titleMatch = res.toString().match(/<title>(.*?)<\/title>/);
console.log("PAGE TITLE DUMP:", titleMatch ? titleMatch[1] : "not found");
