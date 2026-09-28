const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testPage() {
  const port = 9245;
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    let target = pages[0];

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

    console.log("Navigating to http://127.0.0.1:8080/index.html#/table ...");
    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html#/table" });

    // Wait 2 seconds
    await new Promise(r => setTimeout(r, 2000));

    for (let sec = 2; sec <= 12; sec += 2) {
      const state = await send("Runtime.evaluate", {
        expression: `({
          timeSec: ${sec},
          hash: window.location.hash,
          housesCount: window.currentHousesCache ? window.currentHousesCache.length : -1,
          eventsCount: window.currentEventsCache ? window.currentEventsCache.length : -1,
          phoenixGold: window.currentHousesCache ? (window.currentHousesCache.find(h => h.id === 'phoenix')?.goldCount) : null,
          phoenixMedals: window.currentHousesCache ? (window.currentHousesCache.find(h => h.id === 'phoenix')?.totalMedals) : null,
          tableRows: document.querySelectorAll('.standings-table tbody tr, .leaderboard-card').length,
          firstRowText: document.querySelector('.standings-table tbody tr, .leaderboard-card')?.textContent?.replace(/\\s+/g, ' ')?.trim()
        })`,
        returnByValue: true
      });
      console.log(`[${sec}s]:`, JSON.stringify(state.result?.value));
      await new Promise(r => setTimeout(r, 2000));
    }

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    proc.kill();
  }
}

testPage();
