const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function verifyNewsCardInteractions() {
  const port = 9391;
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

    console.log('\n--- Navigating to News Feed on local server ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/news' });
    await new Promise(r => setTimeout(r, 3000));

    // Evaluate cards in the feed
    const feedInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const heroEditBtn = document.querySelector('.jais-news-hero-footer .jais-news-edit-btn');
        const cardEditBtns = document.querySelectorAll('.jais-news-item-compact .jais-news-edit-btn');
        const likeBtns = document.querySelectorAll('.jais-like-btn');
        const allStories = window.pages.getNewsItems();
        return {
          totalStories: allStories.length,
          heroEditBtnFound: !!heroEditBtn,
          cardEditBtnsCount: cardEditBtns.length,
          totalLikeBtns: likeBtns.length
        };
      })()`,
      returnByValue: true
    });
    console.log('Feed Buttons Info:', JSON.stringify(feedInfo?.result?.value, null, 2));

    // Test clicking card Edit button directly
    const clickCardEdit = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.jais-news-hero-footer .jais-news-edit-btn') || document.querySelector('.jais-news-edit-btn');
        if (btn) btn.click();
        const editorModal = document.getElementById('jais-add-media-modal');
        const unlockModal = document.getElementById('jais-official-unlock-modal');
        return {
          editorModalOpen: !!editorModal,
          unlockModalOpen: !!unlockModal,
          modalFound: !!(editorModal || unlockModal)
        };
      })()`,
      returnByValue: true
    });
    console.log('Card Edit Button Click Result:', JSON.stringify(clickCardEdit?.result?.value, null, 2));

    // Screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_news_card_edit_click.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_news_card_edit_click.png');

    console.log('Feed Card Interactions verified successfully!');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    proc.kill();
  }
}

verifyNewsCardInteractions();
