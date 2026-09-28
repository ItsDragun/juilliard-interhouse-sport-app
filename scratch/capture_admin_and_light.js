const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseDir = path.resolve(__dirname, '..');
const outDir = path.join(baseDir, 'public', 'assets', 'stitch');

// Test 1: Light Mode Standings
const lightTarget = path.join(outDir, 'actual_05_standings_light.png');
// We can pass JavaScript to switch theme to light
console.log('Capturing Light Mode Standings...');
const cmdLight = `"${chrome}" --headless=new --disable-gpu --window-size=430,1200 --virtual-time-budget=3000 --screenshot="${lightTarget}" "http://localhost:5000/#/table"`;
// But wait, the app defaults to dark unless theme is toggled. Let's see if we can set data-theme or local storage.
// We will test both.
