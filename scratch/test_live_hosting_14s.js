const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testLiveHosting() {
  const port = 9247;
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    let target = pages.find(p => p.type === 'page');
    if (!target) {
      const newRes = await fetch(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' });
      target = await newRes.json();
    }

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Runtime.consoleAPICalled") {
        console.log(`[Browser Console]:`, ...msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || '')));
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

    console.log("Navigating to https://ja-mega-26.web.app/#/table ...");
    await send("Page.navigate", { url: "https://ja-mega-26.web.app/#/table" });

    // Track every second for 14 seconds
    for (let sec = 1; sec <= 14; sec++) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await send("Runtime.evaluate", {
        expression: `({
          sec: ${sec},
          hash: window.location.hash,
          housesCount: window.currentHousesCache ? window.currentHousesCache.length : -1,
          eventsCount: window.currentEventsCache ? window.currentEventsCache.length : -1,
          phoenixGold: window.currentHousesCache ? (window.currentHousesCache.find(h => h.id === 'phoenix')?.goldCount) : null,
          phoenixMedals: window.currentHousesCache ? (window.currentHousesCache.find(h => h.id === 'phoenix')?.totalMedals) : null,
          tableRows: document.querySelectorAll('.standings-table tbody tr, .leaderboard-card').length,
          topHouseInDOM: document.querySelector('.standings-table tbody tr td:nth-child(2), .leaderboard-card .house-name')?.textContent?.trim(),
          topGoldInDOM: document.querySelector('.standings-table tbody tr td:nth-child(4), .leaderboard-card .medal-gold')?.textContent?.trim()
        })`,
        returnByValue: true
      });
      console.log(`[T = ${sec}s]`, JSON.stringify(res.result?.value));
    }

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    proc.kill();
  }
}

testLiveHosting();
