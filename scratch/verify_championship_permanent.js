const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const port = 9253;
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
    let target = pages.find(p => p.type === 'page') || (await (await fetch(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' })).json());

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
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log("=== NAVIGATING TO http://127.0.0.1:8080/index.html?pin=ihechukwu#/table ===");
    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html?pin=ihechukwu#/table" });

    // Measure state over 8 seconds
    for (let i = 1; i <= 8; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await send("Runtime.evaluate", {
        expression: `({
          t: ${i},
          hash: window.location.hash,
          phoenixGold: window.currentHousesCache?.find(h => h.id === 'phoenix')?.goldCount,
          phoenixMedals: window.currentHousesCache?.find(h => h.id === 'phoenix')?.totalMedals,
          eventsTotal: window.currentEventsCache?.length,
          completedEvents: window.currentEventsCache?.filter(e => e.status === 'completed' || e.results)?.length,
          tableRows: document.querySelectorAll('.standings-table tbody tr').length,
          rank1House: document.querySelector('.standings-table tbody tr:first-child td:nth-child(2)')?.textContent?.trim()
        })`,
        returnByValue: true
      });
      console.log(`[Initial Load T = ${i}s]`, JSON.stringify(res.result?.value));
    }

    console.log("\n=== NOW PERFORMING HARD RELOAD (simulating user pressing reload) ===");
    await send("Page.reload");

    // Measure state over 10 seconds after reload
    for (let i = 1; i <= 10; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await send("Runtime.evaluate", {
        expression: `({
          t: ${i},
          hash: window.location.hash,
          phoenixGold: window.currentHousesCache?.find(h => h.id === 'phoenix')?.goldCount,
          phoenixMedals: window.currentHousesCache?.find(h => h.id === 'phoenix')?.totalMedals,
          eventsTotal: window.currentEventsCache?.length,
          completedEvents: window.currentEventsCache?.filter(e => e.status === 'completed' || e.results)?.length,
          tableRows: document.querySelectorAll('.standings-table tbody tr').length,
          rank1House: document.querySelector('.standings-table tbody tr:first-child td:nth-child(2)')?.textContent?.trim()
        })`,
        returnByValue: true
      });
      console.log(`[After Reload T = ${i}s]`, JSON.stringify(res.result?.value));
    }

    // Now test navigating to #/events
    console.log("\n=== NAVIGATING TO #/events ===");
    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html#/events" });
    await new Promise(r => setTimeout(r, 2000));
    const eventsRes = await send("Runtime.evaluate", {
      expression: `({
        eventsCards: document.querySelectorAll('.event-fixture-card, .event-card').length,
        doneBadges: document.querySelectorAll('.status-badge-done, .event-badge-completed, [class*="completed"]').length,
        firstEventStatus: document.querySelector('.event-fixture-card .event-status, .event-card .status')?.textContent?.trim()
      })`,
      returnByValue: true
    });
    console.log("[Events Page State]", JSON.stringify(eventsRes.result?.value));

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    proc.kill();
  }
}

main();
