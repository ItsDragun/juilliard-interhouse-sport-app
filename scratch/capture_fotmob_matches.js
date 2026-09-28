const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseDir = path.resolve(__dirname, '..');
const outDir = path.join(baseDir, 'public', 'assets', 'stitch');
const artDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\7ef2d2fb-1f56-44d0-a93e-fc589f01b51c\\stitch_previews';

// Helper HTML to configure mode before navigation
const helperHtmlPath = path.join(baseDir, 'public', '_fotmob_helper.html');

fs.writeFileSync(helperHtmlPath, `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
  const urlParams = new URLSearchParams(window.location.search);
  const target = urlParams.get('to') || '#/table';
  const tableMode = urlParams.get('tableMode');
  const eventTab = urlParams.get('eventTab');

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.pages) {
        if (tableMode) window.pages.setTableSubView(tableMode);
        if (eventTab) {
          const eventId = urlParams.get('eventId') || 'track-100m-boys';
          window.pages.setEventDetailTab(eventTab, eventId);
        }
      }
    }, 400);
  });

  window.location.hash = target.replace(/^#/, '');
</script>
</body>
</html>
`);

const captures = [
  {
    name: 'fotmob_01_matches.png',
    url: 'http://localhost:5000/#/events'
  },
  {
    name: 'fotmob_02_match_facts.png',
    url: 'http://localhost:5000/#/event/track-100m-boys'
  },
  {
    name: 'fotmob_03_dark_table.png',
    url: 'http://localhost:5000/#/table'
  }
];

for (const c of captures) {
  const p = path.join(outDir, c.name);
  const a = path.join(artDir, c.name);
  console.log('Capturing:', c.name, 'from', c.url);
  const cmd = `"${chrome}" --headless=new --disable-gpu --window-size=430,1200 --virtual-time-budget=3000 --screenshot="${p}" "${c.url}"`;
  execSync(cmd, { stdio: 'inherit' });
  fs.copyFileSync(p, a);
  console.log('Saved:', c.name);
}

try { fs.unlinkSync(helperHtmlPath); } catch (e) {}
console.log('Completed capturing base FotMob screens.');
