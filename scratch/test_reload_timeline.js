const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testReload() {
  const port = 9239;
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', `chrome-test-reload-${Date.now()}`);

  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    `--user-data-dir=${tempProfile}`
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    let target = pages.find(p => p.type === 'page') || (await (await fetch(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' })).json());

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Runtime.consoleAPICalled") {
        console.log(`[Browser Console (${new Date().toISOString().slice(11, 23)})]:`, ...msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || '')));
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

    await new Promise(r => ws.onopen = r);
    await send("Runtime.enable");
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log("=== NAVIGATING TO APP ===");
    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html" });

    // Track state over 8 seconds every 500ms
    for (let i = 0; i < 16; i++) {
      await new Promise(r => setTimeout(r, 500));
      const res = await send("Runtime.evaluate", {
        expression: `({
          timeMs: ${i * 500},
          hash: window.location.hash,
          housesCount: window.currentHousesCache ? window.currentHousesCache.length : -1,
          eventsCount: window.currentEventsCache ? window.currentEventsCache.length : -1,
          phoenixGold: window.currentHousesCache ? (window.currentHousesCache.find(h => h.id === 'phoenix')?.goldCount) : null,
          phoenixMedals: window.currentHousesCache ? (window.currentHousesCache.find(h => h.id === 'phoenix')?.totalMedals) : null,
          tableRows: document.querySelectorAll('.standings-table tbody tr, .leaderboard-card').length,
          eventCards: document.querySelectorAll('.event-fixture-card, .event-card').length,
          completedBadges: document.querySelectorAll('.status-badge-done, .status-badge.completed, .badge-completed').length,
          activeScreen: document.querySelector('.page-screen.active')?.id,
          pageTitle: document.querySelector('h1, .page-header h2, .section-title')?.textContent?.trim()
        })`,
        returnByValue: true
      });
      console.log(`[T = ${(i * 0.5).toFixed(1)}s]`, JSON.stringify(res.result?.value));
    }

    console.log("\n=== NOW RELOADING (simulating user reload) ===");
    await send("Page.reload");

    for (let i = 0; i < 16; i++) {
      await new Promise(r => setTimeout(r, 500));
      const res = await send("Runtime.evaluate", {
        expression: `({
          timeMs: ${i * 500},
          hash: window.location.hash,
          housesCount: window.currentHousesCache ? window.currentHousesCache.length : -1,
          eventsCount: window.currentEventsCache ? window.currentEventsCache.length : -1,
          phoenixGold: window.currentHousesCache ? (window.currentHousesCache.find(h => h.id === 'phoenix')?.goldCount) : null,
          phoenixMedals: window.currentHousesCache ? (window.currentHousesCache.find(h => h.id === 'phoenix')?.totalMedals) : null,
          tableRows: document.querySelectorAll('.standings-table tbody tr, .leaderboard-card').length,
          eventCards: document.querySelectorAll('.event-fixture-card, .event-card').length,
          completedBadges: document.querySelectorAll('.status-badge-done, .status-badge.completed, .badge-completed').length,
          activeScreen: document.querySelector('.page-screen.active')?.id,
          pageTitle: document.querySelector('h1, .page-header h2, .section-title')?.textContent?.trim()
        })`,
        returnByValue: true
      });
      console.log(`[RELOAD T = ${(i * 0.5).toFixed(1)}s]`, JSON.stringify(res.result?.value));
    }

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    proc.kill();
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch (_) {}
  }
}

testReload();
