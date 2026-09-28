const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname);
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function verifyH2HScores() {
  const port = 9338;
  console.log('Launching headless Chrome on port', port);
  const userDataDir = path.join(outDir, '.chrome_test_profile_' + Date.now());
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-first-run'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    let target = pages.find(p => p.type === 'page') || (await (await fetch(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' })).json());

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise(r => { ws.onopen = r; });
    await send('Page.enable');
    await send('Runtime.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width: 720,
      height: 1100,
      deviceScaleFactor: 2,
      mobile: false
    });

    // Navigate to Events page
    console.log('Navigating to Events list...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/events' });
    await new Promise(r => setTimeout(r, 2000));

    // Wait until .jais-chip elements are loaded
    await send('Runtime.evaluate', {
      awaitPromise: true,
      expression: `
        new Promise(resolve => {
          const check = () => {
            const chips = Array.from(document.querySelectorAll('.jais-chip'));
            const teamChip = chips.find(c => c.innerText.includes('Team Sports'));
            if (teamChip) {
              teamChip.click();
              resolve(teamChip.innerText);
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        })
      `
    });
    console.log('Team Sports chip found and clicked!');
    await new Promise(r => setTimeout(r, 1500));

    // Evaluate H2H fixture card titles and scores
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('.jais-fixture-item')).map(item => {
          const title = item.querySelector('.jais-event-name')?.innerText || '';
          const score = item.querySelector('.jais-score-val')?.innerText || '';
          const leftTeam = item.querySelector('.jais-team-left span')?.innerText || '';
          const rightTeam = item.querySelector('.jais-team-right span')?.innerText || '';
          const isH2H = item.innerText.includes('1v1 MATCH') || item.innerText.includes('1V1 MATCH');
          return { title, score, leftTeam, rightTeam, isH2H };
        });
      `,
      returnByValue: true
    });

    console.log('Detected Team Sports Matches:', JSON.stringify(evalRes.result.value, null, 2));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const localShotPath = path.join(outDir, 'verified_h2h_scores_fixed.png');
    const artifactShotPath = path.join(artifactDir, 'verified_h2h_scores_fixed.png');
    fs.writeFileSync(localShotPath, buffer);
    fs.writeFileSync(artifactShotPath, buffer);
    console.log('Saved screenshot to:', localShotPath, 'and', artifactShotPath);

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    proc.kill();
  }
}

verifyH2HScores();
