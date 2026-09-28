const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function runMobileCaptures() {
  const port = 9345;
  const tmpDir = path.join(os.tmpdir(), 'chrome_mob_' + Date.now());
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions',
    `--user-data-dir=${tmpDir}`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:5055/?admin=osaruyi%23/news`, { method: 'PUT' })).json();
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

    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await new Promise(r => setTimeout(r, 2000));

    // Mobile News screenshot
    const newsMob = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_news_mobile_view.png'), Buffer.from(newsMob.data, 'base64'));
    console.log('Saved verified_news_mobile_view.png');

    // Mobile Football Table
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/?admin=osaruyi#/table' });
    await new Promise(r => setTimeout(r, 1500));
    await send('Runtime.evaluate', { expression: `window.pages.setActiveCompetition('interhouse'); window.pages.setTableCategoryFilter('football');` });
    await new Promise(r => setTimeout(r, 1000));
    const fbMob = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_football_mobile_view.png'), Buffer.from(fbMob.data, 'base64'));
    console.log('Saved verified_football_mobile_view.png');

    // Mobile Basketball Table
    await send('Runtime.evaluate', { expression: `window.pages.setTableCategoryFilter('basketball');` });
    await new Promise(r => setTimeout(r, 1000));
    const bbMob = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_basketball_mobile_view.png'), Buffer.from(bbMob.data, 'base64'));
    console.log('Saved verified_basketball_mobile_view.png');

    console.log('Mobile screenshots captured successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    proc.kill();
  }
}

runMobileCaptures();
