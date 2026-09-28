const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseDir = path.resolve(__dirname, '..');
const outDir = path.join(baseDir, 'public', 'assets', 'stitch');

const screens = [
  {
    name: 'championship_01_standings_table.png',
    url: 'http://127.0.0.1:8080/index.html#/table',
    w: 430,
    h: 932
  },
  {
    name: 'championship_02_completed_events.png',
    url: 'http://127.0.0.1:8080/index.html#/events',
    w: 430,
    h: 932
  },
  {
    name: 'championship_03_100m_scorecard.png',
    url: 'http://127.0.0.1:8080/index.html#/event/track-100m-boys',
    w: 430,
    h: 932
  },
  {
    name: 'championship_04_football_scorecard.png',
    url: 'http://127.0.0.1:8080/index.html#/event/team-football-boys',
    w: 430,
    h: 932
  },
  {
    name: 'championship_05_phoenix_house_profile.png',
    url: 'http://127.0.0.1:8080/index.html#/house/phoenix',
    w: 430,
    h: 932
  },
  {
    name: 'championship_06_admin_scoring_console.png',
    url: 'http://127.0.0.1:8080/index.html?pin=2026#/admin',
    w: 430,
    h: 932
  },
  {
    name: 'championship_07_news_championship_stories.png',
    url: 'http://127.0.0.1:8080/index.html#/news',
    w: 430,
    h: 932
  }
];

for (const s of screens) {
  const target = path.join(outDir, s.name);
  console.log(`Capturing ${s.name}...`);
  const cmd = `"${chrome}" --headless=new --disable-gpu --window-size=${s.w},${s.h} --virtual-time-budget=3500 --screenshot="${target}" "${s.url}"`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    const size = fs.statSync(target).size;
    console.log(`Saved: ${s.name} (${size} bytes)`);
  } catch (err) {
    console.error(`Error capturing ${s.name}:`, err.message);
  }
}

console.log("All 7 championship screenshots successfully captured!");
