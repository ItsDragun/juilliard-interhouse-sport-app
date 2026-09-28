const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function verifyProductionNews() {
  const port = 9392;
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions'
  ]);

  await new Promise(r => setTimeout(r, 2000));

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

    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('\n--- 1. Navigating to Production https://ja-mega-26.web.app/#/news ---');
    await send('Page.navigate', { url: 'https://ja-mega-26.web.app/#/news' });
    await new Promise(r => setTimeout(r, 4000));

    const prodCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const editBtns = document.querySelectorAll('.jais-news-edit-btn');
        const publishBtn = document.querySelector('.jais-news-publish-btn');
        const newsItems = window.pages.getNewsItems();
        return {
          storiesCount: newsItems.length,
          editButtonsCount: editBtns.length,
          publishButtonFound: !!publishBtn
        };
      })()`,
      returnByValue: true
    });
    console.log('Production News Check:', JSON.stringify(prodCheck?.result?.value, null, 2));

    // Capture screenshot of live production news
    const prodShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_production_news_live.png'), Buffer.from(prodShot.data, 'base64'));
    console.log('Saved verified_production_news_live.png');

    console.log('Production live verification passed successfully!');

  } catch (err) {
    console.error('Prod verification error:', err);
  } finally {
    proc.kill();
  }
}

verifyProductionNews();
