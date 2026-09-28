const fs = require('fs');
const html = fs.readFileSync('scratch/dom.html', 'utf8');
console.log('Includes jais-hero-actions-grid:', html.includes('jais-hero-actions-grid'));
console.log('Includes Judge Scoring Console:', html.includes('Judge Scoring Console'));
console.log('Includes Active Session:', html.includes('Active Session'));
console.log('Includes Student Database:', html.includes('Student Database'));
console.log('Includes Quick House Dropdown:', html.includes('jais-quick-house-dropdown'));
console.log('Includes Publish Story:', html.includes('Publish Sports Day Story'));
console.log('Active pages:', (html.match(/page-screen[^\"]*/g) || []).slice(0, 10));
