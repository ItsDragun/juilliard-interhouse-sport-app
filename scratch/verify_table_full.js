const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname);
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function verifyTableFullOnly() {
  const port = 9340;
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
      height: 1000,
      deviceScaleFactor: 2,
      mobile: false
    });

    console.log('Navigating to #/table...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/table' });

    // Wait until table is rendered
    await send('Runtime.evaluate', {
      awaitPromise: true,
      expression: `
        new Promise(resolve => {
          const check = () => {
            const table = document.querySelector('.jais-table-card');
            if (table) resolve(true);
            else setTimeout(check, 100);
          };
          check();
        })
      `
    });

    // Check pills in cluster
    const clusterRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cluster = document.querySelector('.jais-subpills-cluster');
          const btns = cluster ? Array.from(cluster.querySelectorAll('.jais-subpill-btn')).map(b => b.innerText.trim()) : [];
          const hasShort = btns.includes('Short');
          const hasForm = btns.includes('Form');
          const hasFull = btns.includes('Full');
          return { btns, hasShort, hasForm, hasFull };
        })()
      `,
      returnByValue: true
    });

    console.log('Subpills result:', clusterRes.result.value);

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const localShotPath = path.join(outDir, 'verified_table_full_only.png');
    const artifactShotPath = path.join(artifactDir, 'verified_table_full_only.png');
    fs.writeFileSync(localShotPath, buffer);
    fs.writeFileSync(artifactShotPath, buffer);
    console.log('Saved screenshot to:', localShotPath, 'and', artifactShotPath);

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    proc.kill();
  }
}

verifyTableFullOnly();
