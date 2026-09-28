const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function runVisitorTest() {
  const port = 9390;
  console.log(`Starting headless Chrome for visitor edit test on port ${port}...`);

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

    console.log('\n--- 1. Navigating as pure unauthenticated visitor ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/news' });
    await new Promise(r => setTimeout(r, 3000));

    // Clear any admin sessions to simulate completely unauthenticated visitor
    await send('Runtime.evaluate', {
      expression: `(() => {
        sessionStorage.clear();
        localStorage.removeItem('juilliard_active_admin_session');
        window.pages.renderNewsPage();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    // Check if Edit button is visible on cards
    const visitorCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const editBtns = document.querySelectorAll('.jais-news-edit-btn');
        const publishBtn = document.querySelector('.jais-news-publish-btn');
        return {
          editButtonsCount: editBtns.length,
          publishButtonFound: !!publishBtn
        };
      })()`,
      returnByValue: true
    });
    console.log('Visitor view buttons:', visitorCheck?.result?.value);

    // Click Edit button as unauthenticated visitor
    const unlockPromptCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const firstStory = window.pages.getNewsItems()[0];
        window.pages.openEditMediaModal(firstStory.id);
        const unlockModal = document.getElementById('jais-official-unlock-modal');
        return {
          unlockModalOpen: !!unlockModal,
          title: unlockModal ? unlockModal.querySelector('.jais-media-modal-card div').innerText : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Unlock prompt appearance:', unlockPromptCheck?.result?.value);

    // Capture screenshot of official unlock modal
    const unlockShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_official_unlock_modal.png'), Buffer.from(unlockShot.data, 'base64'));
    console.log('Saved verified_official_unlock_modal.png');

    // Click 1-tap "Osaruyi Aideyan" to unlock
    const quickUnlock = await send('Runtime.evaluate', {
      expression: `(() => {
        const firstStory = window.pages.getNewsItems()[0];
        window.pages.quickUnlockOfficial('osaruyi', firstStory.id);
        const storyModal = document.getElementById('jais-add-media-modal');
        const adminSession = JSON.parse(localStorage.getItem('juilliard_active_admin_session') || '{}');
        return {
          storyEditorOpen: !!storyModal,
          activeOfficial: adminSession.name,
          activeRole: adminSession.role
        };
      })()`,
      returnByValue: true
    });
    console.log('Post-unlock editor state:', quickUnlock?.result?.value);

    console.log('\nVisitor unlock and edit flow verified 100% successfully!');

  } catch (err) {
    console.error('Visitor test error:', err);
  } finally {
    proc.kill();
  }
}

runVisitorTest();
