const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname);

async function testSidebarRemoval() {
  const port = 9340;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-'));
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-first-run'
  ]);

  let pages = null;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      pages = await res.json();
      if (pages) break;
    } catch (e) {}
  }

  try {
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
    await send("Runtime.enable");
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send("Page.navigate", { url: "http://127.0.0.1:5055/#/events" });
    await new Promise(r => setTimeout(r, 2000));

    // Switch to Prefectship Cup via official window.pages.selectTournament
    await send("Runtime.evaluate", {
      expression: `(function() {
        window.pages.selectTournament('prefectorial');
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 2000));

    const check = await send("Runtime.evaluate", {
      expression: `(function() {
        const leftSidebar = document.querySelector('#desktop-sidebar-left');
        const sidebarText = leftSidebar?.innerText || '';
        const pills = Array.from(document.querySelectorAll('.jais-fourhouse-pill')).map(el => el.textContent.trim());
        const strips = Array.from(document.querySelectorAll('.jais-all-houses-strip')).map(el => el.textContent.trim().split('\\n')[0]);
        return {
          isPref: isPrefectorialCup(),
          hasSidebarSwitchCup: sidebarText.includes('Switch Tournament Cup'),
          firstSidebarTitle: leftSidebar?.querySelector('.jais-sidebar-card-title')?.innerText?.trim(),
          topHeaderHasSwitchBtn: Boolean(document.querySelector('.jais-comp-switcher-btn')),
          topHeaderBtnText: document.querySelector('.jais-comp-switcher-btn')?.innerText?.trim(),
          firstPill: pills[0],
          firstStrip: strips[0]
        };
      })()`,
      returnByValue: true
    });
    console.log("Prefectship Cup Sidebar Check:", JSON.stringify(check.result?.value, null, 2));

    let shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, 'verified_prefectship_clean_sidebar.png'), Buffer.from(shot.data, 'base64'));
    console.log("Saved verified_prefectship_clean_sidebar.png");

    ws.close();
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    proc.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
  }
}

testSidebarRemoval();
