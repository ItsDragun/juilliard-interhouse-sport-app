const { execSync } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const html = execSync(`"${chrome}" --headless=new --dump-dom --virtual-time-budget=3000 "http://127.0.0.1:8080/index.html#/table"`).toString();

const activeSection = html.match(/<section[^>]+class="[^"]*active[^"]*"[^>]*>/g);
console.log("Active section:", activeSection);

const allSections = [...html.matchAll(/<section id="([^"]+)"[^>]*class="([^"]*)"/g)].map(m => ({ id: m[1], class: m[2] }));
console.log("All sections and classes:", allSections);
