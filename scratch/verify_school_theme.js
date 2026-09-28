const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname);
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function verifySchoolTheme() {
  const port = 9335;
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
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({ type: msg.params.type, args: msg.params.args.map(a => a.value || a.description) });
      }
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
    await send('DOM.enable');
    await send('CSS.enable');

    async function setViewport(width, height) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width <= 500
      });
    }

    async function captureScreenshot(filename) {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(data, 'base64');
      fs.writeFileSync(path.join(outDir, filename), buf);
      if (fs.existsSync(artifactDir)) {
        fs.writeFileSync(path.join(artifactDir, filename), buf);
      }
      console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
    }

    // 1. Desktop Viewport
    await setViewport(1280, 850);
    console.log('Navigating to http://127.0.0.1:5055/#/events...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/events' });
    await new Promise(r => setTimeout(r, 2500));

    // Verify Theme Variables
    const styleCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const activeNav = document.querySelector('.jais-desktop-nav-link.active');
        const activeChip = document.querySelector('.jais-chip.active');
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        
        return {
          fmGreen: rootStyles.getPropertyValue('--fm-green').trim(),
          fmBg: rootStyles.getPropertyValue('--fm-bg').trim(),
          fmTextPrimary: rootStyles.getPropertyValue('--fm-text-primary').trim(),
          bodyBg,
          activeNavColor: activeNav ? getComputedStyle(activeNav).color : 'none',
          activeNavBg: activeNav ? getComputedStyle(activeNav).backgroundColor : 'none',
          activeChipColor: activeChip ? getComputedStyle(activeChip).color : 'none',
          activeChipBg: activeChip ? getComputedStyle(activeChip).backgroundColor : 'none',
          activeChipBorder: activeChip ? getComputedStyle(activeChip).borderColor : 'none'
        };
      })()`,
      returnByValue: true
    });

    console.log('Theme Computed Style Evaluation:', JSON.stringify(styleCheck.result?.value, null, 2));

    await captureScreenshot('verified_school_colors_events.png');

    // 2. Standings Table View
    console.log('Navigating to http://127.0.0.1:5055/#/table...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/table' });
    await new Promise(r => setTimeout(r, 2000));
    await captureScreenshot('verified_school_colors_table.png');

    // 3. Competitions Page View
    console.log('Navigating to http://127.0.0.1:5055/#/competitions...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/competitions' });
    await new Promise(r => setTimeout(r, 2000));
    await captureScreenshot('verified_school_colors_competitions.png');

    // 4. News & Media Page View
    console.log('Navigating to http://127.0.0.1:5055/#/news...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/news' });
    await new Promise(r => setTimeout(r, 2000));
    await captureScreenshot('verified_school_colors_news.png');

    // 4. Mobile Viewport (iPhone 14 style)
    await setViewport(390, 844);
    console.log('Navigating to http://127.0.0.1:5055/#/events in Mobile Viewport...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/events' });
    await new Promise(r => setTimeout(r, 2000));
    await captureScreenshot('verified_school_colors_mobile.png');

    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    proc.kill();
    console.log('Verification finished.');
  }
}

verifySchoolTheme();
