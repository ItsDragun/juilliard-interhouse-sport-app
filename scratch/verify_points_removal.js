const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname);
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function verifyPointsRemoval() {
  const port = 9336;
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
      width: 480,
      height: 960,
      deviceScaleFactor: 2,
      mobile: true
    });

    // 1. Check Athlete Profile for Chinedu Ihejiahi
    console.log('Navigating to Chinedu Ihejiahi athlete profile...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/athlete/stu-038' });
    await new Promise(r => setTimeout(r, 2500));

    // Evaluate the items in event performance history
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.jais-athlete-history-card'));
        return cards.map(c => {
          const title = c.querySelector('div > div:first-child')?.textContent?.trim() || '';
          const subtitle = c.querySelector('div > div:last-child')?.textContent?.trim() || '';
          const badge = c.querySelector('div:last-child')?.textContent?.trim() || '';
          return { title, subtitle, badge };
        });
      })()`,
      returnByValue: true
    });

    const historyItems = evalRes.result?.value || [];
    console.log(`Found ${historyItems.length} performance history items for athlete:`);
    let hasIllegalPoints = false;
    historyItems.forEach(item => {
      console.log(` - ${item.title}: "${item.badge}"`);
      const isBall = item.title.toLowerCase().includes('football') || item.title.toLowerCase().includes('basketball');
      if (!isBall && item.badge.includes('PTS')) {
        console.error(`ILLEGAL POINTS FOUND: ${item.title} has badge "${item.badge}"!`);
        hasIllegalPoints = true;
      }
    });

    if (!hasIllegalPoints) {
      console.log('PASS: No points found for any non-football/basketball competitions in athlete history!');
    } else {
      console.error('FAIL: Found illegal points in athlete history!');
    }

    // Scroll down to show history clearly
    await send('Runtime.evaluate', {
      expression: `(() => {
        const historySection = document.querySelector('.jais-section-card');
        if (historySection) historySection.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotBuffer = Buffer.from(shot.data, 'base64');
    const localShot = path.join(outDir, 'verified_athlete_no_points.png');
    const artifactShot = path.join(artifactDir, 'verified_athlete_no_points.png');
    fs.writeFileSync(localShot, shotBuffer);
    fs.writeFileSync(artifactShot, shotBuffer);
    console.log('Saved athlete screenshot to:', artifactShot);

    // 2. Check House Details Page
    console.log('Navigating to Phoenix House detail page...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/house/phoenix' });
    await new Promise(r => setTimeout(r, 2000));

    const houseVictoriesRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const items = Array.from(document.querySelectorAll('.jais-section-card div[onclick*="event"]'));
        return items.map(el => el.textContent.trim().replace(/\\s+/g, ' '));
      })()`,
      returnByValue: true
    });

    const houseVictories = houseVictoriesRes.result?.value || [];
    console.log(`Found ${houseVictories.length} house victories:`);
    houseVictories.slice(0, 5).forEach(v => console.log('   Victory:', v));

    // Capture house detail screenshot
    const houseShot = await send('Page.captureScreenshot', { format: 'png' });
    const houseShotBuffer = Buffer.from(houseShot.data, 'base64');
    const artifactHouseShot = path.join(artifactDir, 'verified_house_victories_no_points.png');
    fs.writeFileSync(artifactHouseShot, houseShotBuffer);
    console.log('Saved house victories screenshot to:', artifactHouseShot);

    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    proc.kill();
  }
}

verifyPointsRemoval();
